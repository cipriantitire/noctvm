-- NOCTVM Boutique v2: Asset Equipping Logic
-- Created: 2026-03-18

CREATE OR REPLACE FUNCTION public.equip_moonrays_asset(
  p_profile_asset_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_user_id     uuid := auth.uid();
  v_asset_type  text;
  v_asset_id    uuid;
BEGIN
  -- 1. Verify ownership & status
  SELECT a.type, pa.asset_id INTO v_asset_type, v_asset_id
  FROM public.profile_assets pa
  JOIN public.moonrays_assets a ON pa.asset_id = a.id
  WHERE pa.id = p_profile_asset_id 
    AND pa.user_id = v_user_id 
    AND pa.status = 'active'
    AND (pa.expires_at IS NULL OR pa.expires_at > now());

  IF v_asset_type IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid asset or ownership verify failed');
  END IF;

  -- 2. Unequip all assets of the same type for this user
  UPDATE public.profile_assets pa
  SET is_equipped = false
  FROM public.moonrays_assets a
  WHERE pa.asset_id = a.id
    AND pa.user_id = v_user_id
    AND a.type = v_asset_type;

  -- 3. Equip the requested asset
  UPDATE public.profile_assets
  SET is_equipped = true
  WHERE id = p_profile_asset_id;

  RETURN jsonb_build_object('success', true, 'message', 'Equipped asset successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
