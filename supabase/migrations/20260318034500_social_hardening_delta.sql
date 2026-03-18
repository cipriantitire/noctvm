-- Delta migration for Social Hardening v6 (Event Tagging + Venue Team)
-- Created: 2026-03-18

-- 1. Update posts for event tagging
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS event_name TEXT;

-- 2. Repost Linkage
CREATE TABLE IF NOT EXISTS public.reposts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, post_id)
);

-- 3. Repost RPC
CREATE OR REPLACE FUNCTION public.repost_post(p_post_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized', 'code', 401);
    END IF;

    INSERT INTO public.reposts (user_id, post_id)
    VALUES (v_user_id, p_post_id)
    ON CONFLICT (user_id, post_id) DO NOTHING;

    -- Trigger Moonrays Reward (Handled by existing triggers on net_earned or separate RPC)
    RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. Venue Manager RPC Refinement
CREATE OR REPLACE FUNCTION public.get_venue_team(p_venue_id UUID)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        p.id,
        p.username,
        p.full_name,
        p.avatar_url,
        vm.role
    FROM public.venue_managers vm
    JOIN public.profiles p ON vm.user_id = p.id
    WHERE vm.venue_id = p_venue_id;
$$;

-- RLS for Reposts
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reposts" ON public.reposts
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own reposts" ON public.reposts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reposts" ON public.reposts
    FOR DELETE USING (auth.uid() = user_id);
