-- ─────────────────────────────────────────────────────────────────────────────
-- MOONRAYS BOUTIQUE & PROGRESSION LADDER
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. Asset Enhancements: Unique Codes for Styling
ALTER TABLE public.moonrays_assets 
  ADD COLUMN IF NOT EXISTS asset_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS duration_days int; -- null for permanent

UPDATE public.moonrays_assets SET asset_code = 'bg_aurora' WHERE name = 'Frosted Aurora Background';
UPDATE public.moonrays_assets SET asset_code = 'frame_liquid' WHERE name = 'Liquid Metal Story Frame';
UPDATE public.moonrays_assets SET asset_code = 'pin_glow' WHERE name = 'Golden Glow Post Pin';

-- 2. Profile Asset Enhancements: Tracking Origins
ALTER TABLE public.profile_assets 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  ADD COLUMN IF NOT EXISTS source_txn_id uuid REFERENCES public.moonrays_ledger_transactions(id);

-- 3. Ranks/Progression Infrastructure
CREATE OR REPLACE FUNCTION public.get_user_rank(p_user_id uuid)
RETURNS TABLE (
  rank_name text,
  rank_level int,
  next_rank_name text,
  next_rank_goal bigint,
  progress_percent float
) AS $$
DECLARE
  v_lifetime bigint;
BEGIN
  SELECT net_earned INTO v_lifetime FROM public.moonrays_wallets WHERE user_id = p_user_id;
  v_lifetime := COALESCE(v_lifetime, 0);

  IF v_lifetime < 5000 THEN
    RETURN QUERY SELECT 'Bronze Voyager'::text, 1, 'Silver Pulse'::text, 5000::bigint, (v_lifetime::float / 5000 * 100);
  ELSIF v_lifetime < 25000 THEN
    RETURN QUERY SELECT 'Silver Pulse'::text, 2, 'Gold Eclipse'::text, 25000::bigint, ((v_lifetime - 5000)::float / (25000 - 5000) * 100);
  ELSIF v_lifetime < 100000 THEN
    RETURN QUERY SELECT 'Gold Eclipse'::text, 3, 'Platinum Aura'::text, 100000::bigint, ((v_lifetime - 25000)::float / (100000 - 25000) * 100);
  ELSIF v_lifetime < 300000 THEN
    RETURN QUERY SELECT 'Platinum Aura'::text, 4, 'Diamond Night-Owl'::text, 300000::bigint, ((v_lifetime - 100000)::float / (300000 - 100000) * 100);
  ELSE
    RETURN QUERY SELECT 'Diamond Night-Owl'::text, 5, 'MASTERY'::text, 0::bigint, 100.0::float;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Purchase RPC: The Boutique Logic
CREATE OR REPLACE FUNCTION public.purchase_moonrays_asset(
  p_asset_id uuid,
  p_dry_run boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  v_user_id   uuid := auth.uid();
  v_wallet_id uuid;
  v_balance   bigint;
  v_cost      bigint;
  v_asset_name text;
  v_txn_id    uuid;
  v_profile_asset_id uuid;
  v_duration  int;
BEGIN
  -- 1. Get Asset & Wallet info
  SELECT name, cost, duration_days INTO v_asset_name, v_cost, v_duration FROM public.moonrays_assets WHERE id = p_asset_id AND is_active = true;
  SELECT id, balance INTO v_wallet_id, v_balance FROM public.moonrays_wallets WHERE user_id = v_user_id;

  IF v_asset_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Asset not found or inactive');
  END IF;

  IF v_balance < v_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient Moonrays balance', 'required', v_cost, 'balance', v_balance);
  END IF;

  -- 2. If dry run, stop here and return success preview
  IF p_dry_run THEN
    RETURN jsonb_build_object('success', true, 'message', 'Dry run successful: ' || v_asset_name || ' costs ' || v_cost || ' MR');
  END IF;

  -- 3. Execute Transaction (Atomic)
  -- Step 3a: Create Ledger Entry
  v_txn_id := public.burn_moonrays(
    v_user_id,
    'purchase:' || v_user_id || ':' || p_asset_id || ':' || now(),
    'burn_promotion',
    v_cost,
    'Purchased boutique asset: ' || v_asset_name
  );

  -- Step 3b: Grant Asset
  INSERT INTO public.profile_assets (user_id, asset_id, source_txn_id, expires_at)
  VALUES (
    v_user_id, 
    p_asset_id, 
    v_txn_id, 
    CASE WHEN v_duration IS NOT NULL THEN now() + (v_duration || ' days')::interval ELSE NULL END
  )
  RETURNING id INTO v_profile_asset_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Successfully purchased ' || v_asset_name,
    'txn_id', v_txn_id,
    'asset_id', v_profile_asset_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
