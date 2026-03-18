-- ─────────────────────────────────────────────────────────────────────────────
-- MOONRAYS SOCIAL & REFERRAL HARDWARE
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. Profiles Expansion: Referral Foundation
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_id uuid REFERENCES public.profiles(id);

-- 2. Staking Table (Golden Night / Verification)
CREATE TABLE IF NOT EXISTS public.moonrays_stakes (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount       bigint      NOT NULL CHECK (amount > 0),
  locked_until timestamptz NOT NULL,
  status       text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'slashed')),
  badge_type   text        NOT NULL DEFAULT 'gold',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 3. Staking Infrastructure: RLS
ALTER TABLE public.moonrays_stakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stakes"
  ON public.moonrays_stakes FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Staking Logic: Lock Function
CREATE OR REPLACE FUNCTION public.lock_moonrays_stake(
  p_amount bigint,
  p_lock_days int,
  p_badge_type text DEFAULT 'gold'
)
RETURNS uuid AS $$
DECLARE
  v_wallet_id uuid;
  v_balance   bigint;
  v_txn_id    uuid;
  v_stake_id  uuid;
BEGIN
  -- 1. Get Wallet
  SELECT id, balance INTO v_wallet_id, v_balance 
  FROM public.moonrays_wallets WHERE user_id = auth.uid();

  IF v_wallet_id IS NULL OR v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient Moonrays balance for staking';
  END IF;

  -- 2. Record Transaction
  INSERT INTO public.moonrays_ledger_transactions (txn_ref, txn_type, description)
  VALUES (
    'stake:' || auth.uid() || ':' || now(),
    'adjustment',
    'Staking for ' || p_badge_type || ' badge'
  )
  RETURNING id INTO v_txn_id;

  -- 3. Debit Wallet
  INSERT INTO public.moonrays_ledger_entries (txn_id, wallet_id, direction, amount)
  VALUES (v_txn_id, v_wallet_id, 'debit', p_amount);

  -- 4. Create Stake Row
  INSERT INTO public.moonrays_stakes (user_id, amount, locked_until, badge_type)
  VALUES (auth.uid(), p_amount, now() + (p_lock_days || ' days')::interval, p_badge_type)
  RETURNING id INTO v_stake_id;

  -- 5. Update Profile Badge (Internal Trust)
  UPDATE public.profiles SET badge = p_badge_type::badge_type WHERE id = auth.uid();

  RETURN v_stake_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Referral Logic: Utility
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := encode(gen_random_bytes(6), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

COMMIT;
