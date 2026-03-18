-- NOCTVM: Repost & Event Tagging Infrastructure
-- Created: 2026-03-18

BEGIN;

-- 1. Extend Posts for Event Tagging
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_title text,
  ADD COLUMN IF NOT EXISTS event_date timestamptz,
  ADD COLUMN IF NOT EXISTS event_venue text;

-- 2. Reposts Table (if not already created in previous Hardenings)
CREATE TABLE IF NOT EXISTS public.reposts (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id     uuid        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

-- 3. Reposts RLS
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage their own reposts" ON public.reposts;
    CREATE POLICY "Users can manage their own reposts"
      ON public.reposts FOR ALL USING (auth.uid() = user_id);
      
    DROP POLICY IF EXISTS "Anyone can see reposts of people they follow" ON public.reposts;
    CREATE POLICY "Anyone can see reposts of people they follow"
      ON public.reposts FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.follows
          WHERE follower_id = auth.uid() AND target_id = reposts.user_id AND target_type = 'user'
        )
      );
END $$;

-- 4. Repost RPC Logic
CREATE OR REPLACE FUNCTION public.repost_post(
  p_post_id uuid,
  p_dry_run boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  v_user_id   uuid := auth.uid();
  v_author_id uuid;
  v_reward    int;
  v_txn_ref   text;
BEGIN
  -- 1. Validation
  SELECT user_id INTO v_author_id FROM public.posts WHERE id = p_post_id;
  
  IF v_author_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Post not found');
  END IF;
  
  IF v_author_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot repost your own content');
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.reposts WHERE user_id = v_user_id AND post_id = p_post_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Post already reposted');
  END IF;

  -- 2. Dry Run Check
  IF p_dry_run THEN
    RETURN jsonb_build_object('success', true, 'message', 'Ready to repost');
  END IF;

  -- 3. Execute Repost
  INSERT INTO public.reposts (user_id, post_id) 
  VALUES (v_user_id, p_post_id);

  -- 4. Award Reward
  SELECT points INTO v_reward FROM public.reward_config WHERE id = 'repost' AND is_active = true;
  v_reward := COALESCE(v_reward, 5); -- Default fallback
  
  v_txn_ref := 'repost:' || p_post_id || ':' || v_user_id;
  
  PERFORM public.award_moonrays(
    v_user_id,
    v_txn_ref,
    'earn_repost',
    v_reward,
    'Moonray bonus for reposting'
  );

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Post successfully reposted',
    'reward', v_reward
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
