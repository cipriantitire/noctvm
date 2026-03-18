-- ─────────────────────────────────────────────────────────────────────────────
-- NOCTVM SOCIAL HARDENING: SETTINGS & FEED LOGIC
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. User Settings (Privacy & Notifications)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id          uuid        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Privacy Settings
  is_profile_private boolean    NOT NULL DEFAULT false,
  allow_mentions     text       NOT NULL DEFAULT 'everyone' CHECK (allow_mentions IN ('everyone', 'following', 'none')),
  show_moonray_level boolean    NOT NULL DEFAULT true,
  
  -- Notification Settings
  notify_likes       boolean    NOT NULL DEFAULT true,
  notify_comments    boolean    NOT NULL DEFAULT true,
  notify_followers   boolean    NOT NULL DEFAULT true,
  notify_events      boolean    NOT NULL DEFAULT true,
  
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

-- Enable RLS for settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- 2. Feed Logic: engagement-based & proximity
-- Mode: 'explore', 'following', 'friends'
CREATE OR REPLACE FUNCTION public.get_feed_posts(
  p_mode text DEFAULT 'explore',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS SETOF public.posts AS $$
declare
  v_user_id uuid := auth.uid();
begin
  if p_mode = 'following' then
    return query
    select p.*
    from public.posts p
    join public.follows f on p.user_id = f.target_id
    where f.follower_id = v_user_id and f.target_type = 'user'
    order by p.created_at desc
    limit p_limit offset p_offset;
    
  elsif p_mode = 'friends' then
    -- Friends are mutual follows
    return query
    select p.*
    from public.posts p
    where p.user_id in (
      select f1.target_id 
      from public.follows f1
      join public.follows f2 on f1.target_id = f2.follower_id
      where f1.follower_id = v_user_id 
        and f2.target_id = v_user_id
        and f1.target_type = 'user'
        and f2.target_type = 'user'
    )
    order by p.created_at desc
    limit p_limit offset p_offset;
    
  else -- 'explore' (Default)
    -- Multi-factor sort: (likes * 2) + (comments * 5) + (freshness score)
    return query
    select p.*
    from public.posts p
    order by 
      ((p.likes_count * 2) + (p.comments_count * 5)) desc,
      p.created_at desc
    limit p_limit offset p_offset;
  end if;
end;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Activity Log View
CREATE OR REPLACE VIEW public.vw_user_activity_log AS
  -- Likes
  SELECT user_id, 'like' as action_type, post_id as target_id, created_at
  FROM public.post_likes
  UNION ALL
  -- Comments
  SELECT user_id, 'comment' as action_type, post_id as target_id, created_at
  FROM public.post_comments
  UNION ALL
  -- Event Claims
  SELECT user_id, 'claim' as action_type, id::uuid as target_id, created_at
  FROM public.claims;

COMMIT;
