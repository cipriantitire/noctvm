-- ─────────────────────────────────────────────────────────────────────────────
-- NOCTVM Moonrays Economy: The Double-Entry Ledger (Web3-Ready)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create Enums for Transaction Types and Status
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moonrays_txn_type') THEN
    CREATE TYPE public.moonrays_txn_type AS ENUM (
      'earn_signup',
      'earn_like', 
      'earn_comment',
      'earn_share', 
      'earn_story',
      'earn_checkin', 
      'earn_review',
      'earn_invite',
      'burn_promotion', 
      'burn_ticket_redeem',
      'adjustment',
      'reversal'
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moonrays_wallet_status') THEN
    CREATE TYPE public.moonrays_wallet_status AS ENUM ('active', 'locked', 'suspended');
  END IF;
END $$;

-- 2. Create Wallets Table (One per user)
CREATE TABLE IF NOT EXISTS public.moonrays_wallets (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      public.moonrays_wallet_status NOT NULL DEFAULT 'active',
  balance     bigint      NOT NULL DEFAULT 0 CHECK (balance >= 0), -- Materialized for performance
  net_earned  bigint      NOT NULL DEFAULT 0, -- Total earned lifetime (no burns)
  net_burned  bigint      NOT NULL DEFAULT 0, -- Total burned lifetime
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. Create Ledger Transactions (Idempotency and Audit)
CREATE TABLE IF NOT EXISTS public.moonrays_ledger_transactions (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  txn_ref     text        UNIQUE NOT NULL, -- e.g. "like:{post_id}:{actor_id}"
  txn_type    public.moonrays_txn_type NOT NULL,
  description text,
  metadata    jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 4. Create Ledger Entries (The Truth Source)
CREATE TABLE IF NOT EXISTS public.moonrays_ledger_entries (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  txn_id      uuid        NOT NULL REFERENCES public.moonrays_ledger_transactions(id) ON DELETE CASCADE,
  wallet_id   uuid        NOT NULL REFERENCES public.moonrays_wallets(id) ON DELETE CASCADE,
  direction   text        NOT NULL CHECK (direction IN ('debit', 'credit')), -- Credit increases, Debit decreases
  amount      bigint      NOT NULL CHECK (amount > 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.moonrays_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moonrays_ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moonrays_ledger_entries ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Users can only read their own wallet data"
  ON public.moonrays_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only read entries related to their wallet"
  ON public.moonrays_ledger_entries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.moonrays_wallets 
    WHERE id = wallet_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can only read transactions they are a part of"
  ON public.moonrays_ledger_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.moonrays_ledger_entries e
    JOIN public.moonrays_wallets w ON w.id = e.wallet_id
    WHERE e.txn_id = public.moonrays_ledger_transactions.id AND w.user_id = auth.uid()
  ));

-- 7. Functions for Atomic Awarding (Security Definer)
CREATE OR REPLACE FUNCTION public.award_moonrays(
  p_user_id uuid,
  p_txn_ref text,
  p_txn_type public.moonrays_txn_type,
  p_amount bigint,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  v_wallet_id uuid;
  v_txn_id uuid;
BEGIN
  -- 1. Ensure wallet exists
  INSERT INTO public.moonrays_wallets (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_wallet_id;

  -- 2. Create Transaction (Unique ref prevents double-spending/rewards)
  INSERT INTO public.moonrays_ledger_transactions (txn_ref, txn_type, description, metadata)
  VALUES (p_txn_ref, p_txn_type, p_description, p_metadata)
  ON CONFLICT (txn_ref) DO NOTHING
  RETURNING id INTO v_txn_id;

  IF v_txn_id IS NULL THEN
    RETURN NULL; -- Already processed
  END IF;

  -- 3. Create Credit Entry
  INSERT INTO public.moonrays_ledger_entries (txn_id, wallet_id, direction, amount)
  VALUES (v_txn_id, v_wallet_id, 'credit', p_amount);

  RETURN v_txn_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Functions for Atomic Burning (Security Definer)
CREATE OR REPLACE FUNCTION public.burn_moonrays(
  p_user_id uuid,
  p_txn_ref text,
  p_txn_type public.moonrays_txn_type,
  p_amount bigint,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  v_wallet_id uuid;
  v_balance bigint;
  v_txn_id uuid;
BEGIN
  SELECT id, balance INTO v_wallet_id, v_balance 
  FROM public.moonrays_wallets 
  WHERE user_id = p_user_id;

  IF v_wallet_id IS NULL OR v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient Moonrays balance';
  END IF;

  -- Create Transaction
  INSERT INTO public.moonrays_ledger_transactions (txn_ref, txn_type, description, metadata)
  VALUES (p_txn_ref, p_txn_type, p_description, p_metadata)
  RETURNING id INTO v_txn_id;

  -- Create Debit Entry
  INSERT INTO public.moonrays_ledger_entries (txn_id, wallet_id, direction, amount)
  VALUES (v_txn_id, v_wallet_id, 'debit', p_amount);

  RETURN v_txn_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Trigger: Materialize balance and totals
CREATE OR REPLACE FUNCTION public.handle_moonrays_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.direction = 'credit' THEN
    UPDATE public.moonrays_wallets 
    SET balance = balance + NEW.amount,
        net_earned = net_earned + NEW.amount,
        updated_at = now()
    WHERE id = NEW.wallet_id;
  ELSE
    UPDATE public.moonrays_wallets 
    SET balance = balance - NEW.amount,
        net_burned = net_burned + NEW.amount,
        updated_at = now()
    WHERE id = NEW.wallet_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_on_ledger_entry
  AFTER INSERT ON public.moonrays_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_moonrays_entry();

-- 10. Automatic Wallet Creation for new profiles
CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.moonrays_wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- migrate:down (Run manually if revert is required)
/*
BEGIN;
DROP TABLE IF EXISTS public.moonrays_ledger_entries CASCADE;
DROP TABLE IF EXISTS public.moonrays_ledger_transactions CASCADE;
DROP TABLE IF EXISTS public.moonrays_wallets CASCADE;
DROP TYPE IF EXISTS public.moonrays_txn_type;
DROP TYPE IF EXISTS public.moonrays_wallet_status;
DROP FUNCTION IF EXISTS public.handle_moonrays_entry();
DROP FUNCTION IF EXISTS public.award_moonrays();
DROP FUNCTION IF EXISTS public.burn_moonrays();
COMMIT;
*/
