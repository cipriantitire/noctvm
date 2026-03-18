-- ─────────────────────────────────────────────────────────────────────────────
-- MOONRAYS REFUNDER HARDWARE
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. Create Refund Audit Table
CREATE TABLE IF NOT EXISTS public.moonrays_refunds (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  original_txn_id  uuid        NOT NULL REFERENCES public.moonrays_ledger_transactions(id),
  reversal_txn_id  uuid        NOT NULL REFERENCES public.moonrays_ledger_transactions(id),
  user_id          uuid        NOT NULL REFERENCES public.profiles(id),
  reason           text        NOT NULL,
  operator_id      uuid        REFERENCES auth.users(id), -- Admin who performed it
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 2. Create Refund RPC
CREATE OR REPLACE FUNCTION public.refund_moonrays_asset(
  p_txn_id uuid,
  p_reason text
)
RETURNS jsonb AS $$
DECLARE
  v_user_id      uuid;
  v_asset_id     uuid;
  v_amount       bigint;
  v_reversal_txn uuid;
  v_operator_id  uuid := auth.uid();
  v_profile_role text;
BEGIN
  -- 1. Identity Verification (Admin check)
  SELECT role INTO v_profile_role FROM public.profiles WHERE id = v_operator_id;
  IF v_profile_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied. Admin role required.');
  END IF;

  -- 2. Locate original purchase
  -- A purchase has a burn direction for the user in ledger entries
  SELECT e.amount, t.user_id 
  INTO v_amount, v_user_id
  FROM public.moonrays_ledger_entries e
  JOIN public.moonrays_ledger_transactions t ON e.txn_id = t.id
  WHERE t.id = p_txn_id AND e.direction = 'debit'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Original purchase transaction not found');
  END IF;

  -- 3. Check if purchase is already refunded
  IF EXISTS (SELECT 1 FROM public.moonrays_refunds WHERE original_txn_id = p_txn_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction already refunded');
  END IF;

  -- 4. Locate and revoke asset entitlement
  SELECT asset_id INTO v_asset_id FROM public.profile_assets 
  WHERE source_txn_id = p_txn_id AND status = 'active'
  LIMIT 1;

  IF v_asset_id IS NULL THEN
     RETURN jsonb_build_object('success', false, 'error', 'No active asset found for this transaction');
  END IF;

  -- 5. Atomic Reversal
  -- Stage 5a: Credit user back
  v_reversal_txn := public.award_moonrays(
    v_user_id,
    'refund:' || p_txn_id,
    'reversal',
    v_amount,
    'Refund for purchase: ' || p_txn_id || '. Reason: ' || p_reason
  );

  -- Stage 5b: Revoke asset
  UPDATE public.profile_assets 
  SET status = 'revoked', updated_at = now() 
  WHERE source_txn_id = p_txn_id;

  -- Stage 5c: Log in audit table
  INSERT INTO public.moonrays_refunds (original_txn_id, reversal_txn_id, user_id, reason, operator_id)
  VALUES (p_txn_id, v_reversal_txn, v_user_id, p_reason, v_operator_id);

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Refund successful', 
    'reversal_id', v_reversal_txn
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Audit View
CREATE OR REPLACE VIEW public.vw_moonrays_refund_audit AS
  SELECT 
    r.id,
    r.created_at as refund_date,
    p.display_name as user_name,
    t.description as original_purchase,
    r.reason,
    r.operator_id
  FROM public.moonrays_refunds r
  JOIN public.profiles p ON r.user_id = p.id
  JOIN public.moonrays_ledger_transactions t ON r.original_txn_id = t.id;

COMMIT;
