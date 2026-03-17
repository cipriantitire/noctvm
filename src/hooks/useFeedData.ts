import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { FeedPost } from '@/types/feed';
import { mapSupabasePost } from '@/lib/feed-utils';

export function useFeedData(user: any, activeCity: string) {
  const [explorePosts, setExplorePosts] = useState<FeedPost[]>([]);
  const [followingPosts, setFollowingPosts] = useState<FeedPost[]>([]);
  const [friendsPosts, setFriendsPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);

  const cityLabel = activeCity === 'bucuresti' ? 'Bucharest' : 'Constanta';

  const fetchExplorePosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(display_name, username, avatar_url, is_verified, badge)')
        .eq('city', cityLabel)
        .order('created_at', { ascending: false })
        .limit(40);

      const postRows = data || [];
      const postIds = postRows.map((p: any) => p.id);

      let likedSet = new Set<string>();
      let savedSet = new Set<string>();
      let likeCounts: Record<string, number> = {};

      if (postIds.length > 0) {
        const [allLikesRes, likesRes, savesRes] = await Promise.all([
          supabase.from('post_likes').select('post_id').in('post_id', postIds),
          user ? supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds) : Promise.resolve({ data: [] }),
          user ? supabase.from('post_saves').select('post_id').eq('user_id', user.id).in('post_id', postIds) : Promise.resolve({ data: [] }),
        ]);
        (allLikesRes.data || []).forEach((l: any) => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });
        if (user) {
          likedSet = new Set(((likesRes as any).data || []).map((l: any) => l.post_id));
          savedSet = new Set(((savesRes as any).data || []).map((s: any) => s.post_id));
        }
      }

      setExplorePosts(postRows.map((row: any) => ({
        ...mapSupabasePost(row),
        liked: likedSet.has(row.id),
        saved: savedSet.has(row.id),
        likes: likeCounts[row.id] || 0
      })));
    } catch (err) {
      console.error('Error fetching explore posts:', err);
    } finally {
      setLoading(false);
    }
  }, [cityLabel, user]);

  useEffect(() => {
    fetchExplorePosts();
  }, [fetchExplorePosts]);

  return { explorePosts, setExplorePosts, followingPosts, setFollowingPosts, friendsPosts, setFriendsPosts, loading, fetchExplorePosts };
}
