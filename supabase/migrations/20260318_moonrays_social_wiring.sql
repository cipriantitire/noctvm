-- ─────────────────────────────────────────────────────────────────────────────
-- MOONRAYS SOCIAL WIRING & AUTH INTEGRATION
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. Swap Auth Trigger to Referral-Aware Logic
-- We must drop the old trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_with_referral();

-- 2. Derived Status View (The "Trust Source")
-- This ensures the UI badge reflects actual staking truth
CREATE OR REPLACE VIEW public.profile_status AS
SELECT 
  p.id,
  p.username,
  p.display_name,
  COALESCE(s.badge_type, p.badge::text, 'none') as current_badge,
  (s.id IS NOT NULL AND s.locked_until > now()) as is_staking_active,
  p.is_verified
FROM public.profiles p
LEFT JOIN public.moonrays_stakes s ON s.user_id = p.id AND s.status = 'active' AND s.locked_until > now()
ORDER BY s.amount DESC NULLS LAST;

-- 3. Simplified Social Activity RPC
-- This is what the frontend calls for Like/Comment/Story
CREATE OR REPLACE FUNCTION public.award_social_activity(
  p_target_id text, -- post_id, story_id, etc.
  p_action_type text -- 'like', 'comment', 'story'
)
RETURNS uuid AS $$
DECLARE
  v_amount bigint;
  v_txn_type public.moonrays_txn_type;
BEGIN
  CASE p_action_type
    WHEN 'like' THEN 
      v_amount := 2;
      v_txn_type := 'earn_like';
    WHEN 'comment' THEN 
      v_amount := 10;
      v_txn_type := 'earn_comment';
    WHEN 'story' THEN 
      v_amount := 50;
      v_txn_type := 'earn_story';
    ELSE
      RAISE EXCEPTION 'Invalid social action type';
  END CASE;

  RETURN public.award_moonrays(
    auth.uid(),
    p_action_type || ':' || p_target_id || ':' || auth.uid(),
    v_txn_type,
    v_amount,
    'Social reward for ' || p_action_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
