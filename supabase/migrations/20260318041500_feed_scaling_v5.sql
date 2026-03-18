-- NOCTVM Feed Scaling v5 (Mutual-based)
-- Created: 2026-03-18

-- Implement get_feed_posts_v5 using mutual_connections cache
CREATE OR REPLACE FUNCTION public.get_feed_posts_v5(
  p_mode text DEFAULT 'explore',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS SETOF public.posts AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF p_mode = 'following' THEN
    RETURN QUERY
    SELECT p.*
    FROM public.posts p
    JOIN public.follows f ON p.user_id::text = f.target_id
    WHERE f.follower_id = v_user_id AND f.target_type = 'user'
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
    
  ELSIF p_mode = 'friends' THEN
    -- Optimization: Use mutual_connections cache table
    -- Fallback/Join is only used if cache is empty or for safety, but here we strictly leverage the cache for v5
    RETURN QUERY
    SELECT p.*
    FROM public.posts p
    WHERE p.user_id IN (
      SELECT m.mutual_user_id
      FROM public.mutual_connections m
      WHERE m.user_id = v_user_id
    )
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
    
  ELSE -- 'explore' (v5: weighted by engagement + proximity to social graph)
    RETURN QUERY
    SELECT p.*
    FROM public.posts p
    LEFT JOIN public.follows f ON p.user_id = f.target_id AND f.follower_id = v_user_id
    ORDER BY 
      (CASE WHEN f.follower_id IS NOT NULL THEN 1.5 ELSE 1.0 END) * -- Boost followed users
      ((p.likes_count * 2) + (p.comments_count * 5) + 1) DESC,
      p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
