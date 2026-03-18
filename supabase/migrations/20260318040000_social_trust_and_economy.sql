-- NOCTVM Social Trust Layer & Economy Hardening v7
-- Created: 2026-03-18

--------------------------------------------------------------------------------
-- 1. SOCIAL TRUST LAYER (RLS Hardening)
--------------------------------------------------------------------------------

-- Tighten event_saves (historically 'using(true)')
DROP POLICY IF EXISTS "event_saves_read" ON public.event_saves;
DROP POLICY IF EXISTS "event_saves_select_own" ON public.event_saves;
CREATE POLICY "event_saves_read" ON public.event_saves 
FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = auth.uid() 
      AND target_id = event_saves.user_id::text
));

-- Ensure post_likes follow strict privacy
DROP POLICY IF EXISTS "post_likes_read" ON public.post_likes;
DROP POLICY IF EXISTS "post_likes_select_following_or_self" ON public.post_likes;
CREATE POLICY "post_likes_read" ON public.post_likes 
FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = auth.uid() 
      AND target_id = post_likes.user_id::text
));

-- Reposts
DROP POLICY IF EXISTS "Anyone can view reposts" ON public.reposts;
DROP POLICY IF EXISTS "reposts_read" ON public.reposts;
CREATE POLICY "reposts_read" ON public.reposts
FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = auth.uid() 
      AND target_id = reposts.user_id::text
));

--------------------------------------------------------------------------------
-- 2. ECONOMY INFRASTRUCTURE (reward_config)
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reward_config (
    id TEXT PRIMARY KEY, -- e.g. 'repost', 'post_create', 'daily_login'
    points INTEGER NOT NULL DEFAULT 0,
    daily_cap INTEGER, -- Max awards per user per day
    total_cap INTEGER, -- Max awards per user total (for one-time)
    min_rank_required TEXT, -- nullable
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on reward_config (Admins/Service only for writes; public for reads via view)
ALTER TABLE public.reward_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reward_config_admin_select" ON public.reward_config FOR SELECT USING (true);

-- Public view for frontend hints (sanitized)
CREATE OR REPLACE VIEW public.reward_config_public AS
    SELECT id, points, daily_cap, total_cap, min_rank_required 
    FROM public.reward_config
    WHERE is_active = true;

-- Default rewards seed
INSERT INTO public.reward_config (id, points, daily_cap, total_cap) VALUES
('sign_up', 500, NULL, 1),
('post_create', 10, 5, NULL),
('story_create', 5, 10, NULL),
('comment_create', 2, 20, NULL),
('venue_review', 25, 2, NULL),
('repost', 5, 5, NULL),
('referral_invite', 100, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET points = EXCLUDED.points;

--------------------------------------------------------------------------------
-- 3. FEED SCALING (Mutual Connections & Async Queue)
--------------------------------------------------------------------------------

-- Mutual connections cache
CREATE TABLE IF NOT EXISTS public.mutual_connections (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mutual_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    score FLOAT DEFAULT 1.0, -- for feed relevance
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, mutual_user_id)
);

ALTER TABLE public.mutual_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own mutuals" ON public.mutual_connections
    FOR SELECT USING (auth.uid() = user_id);

-- Async processing queue
CREATE TABLE IF NOT EXISTS public.follow_change_queue (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    target_id UUID NOT NULL,
    action_type TEXT NOT NULL, -- 'follow', 'unfollow'
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.follow_change_queue ENABLE ROW LEVEL SECURITY;
-- No public CRUD on queue (Service only)

-- Trigger to enqueue changes
CREATE OR REPLACE FUNCTION public.enqueue_follow_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.follow_change_queue (user_id, target_id, action_type)
        VALUES (NEW.follower_id, NEW.target_id::uuid, 'follow');
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.follow_change_queue (user_id, target_id, action_type)
        VALUES (OLD.follower_id, OLD.target_id::uuid, 'unfollow');
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_follow_change_enqueue ON public.follows;
CREATE TRIGGER tr_follow_change_enqueue
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.enqueue_follow_change();

-- Authoritative RPC for recomputing mutuality (to be called by edge worker)
CREATE OR REPLACE FUNCTION public.recompute_mutual_connection(p_user_a UUID, p_user_b UUID)
RETURNS VOID AS $$
DECLARE
    v_is_mutual BOOLEAN;
BEGIN
    -- Check if both follow each other (follows table uses target_id/follower_id)
    SELECT EXISTS (
        SELECT 1 FROM public.follows WHERE follower_id = p_user_a AND target_id = p_user_b::text
    ) AND EXISTS (
        SELECT 1 FROM public.follows WHERE follower_id = p_user_b AND target_id = p_user_a::text
    ) INTO v_is_mutual;

    IF v_is_mutual THEN
        INSERT INTO public.mutual_connections (user_id, mutual_user_id)
        VALUES (p_user_a, p_user_b), (p_user_b, p_user_a)
        ON CONFLICT (user_id, mutual_user_id) DO UPDATE SET updated_at = now();
    ELSE
        DELETE FROM public.mutual_connections 
        WHERE (user_id = p_user_a AND mutual_user_id = p_user_b)
           OR (user_id = p_user_b AND mutual_user_id = p_user_a);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
