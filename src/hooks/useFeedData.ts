import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { FeedPost } from '@/types/feed';
import { mapSupabasePost } from '../lib/feed-utils';

export function useFeedData(user: any, activeCity: string) {
  const [explorePosts, setExplorePosts] = useState<FeedPost[]>([]);
  const [followingPosts, setFollowingPosts] = useState<FeedPost[]>([]);
  const [friendsPosts, setFriendsPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);

  const cityLabel = activeCity === 'bucuresti' ? 'Bucharest' : 'Constanta';

  const fetchFeed = useCallback(async () => {
    if (!user) {
      // Basic explore for guest
      setLoading(true);
      const { data } = await supabase.from('posts').select('*, profiles(display_name, username, avatar_url, is_verified, badge)').eq('city', cityLabel).order('created_at', { ascending: false }).limit(40);
      const postRows = data || [];
      const postIds = postRows.map((p: any) => p.id);
      let likeCounts: Record<string, number> = {};
      if (postIds.length > 0) {
        const { data: allLikes } = await supabase.from('post_likes').select('post_id').in('post_id', postIds);
        (allLikes || []).forEach((l: any) => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });
      }
      const mapped = postRows.map((row: any) => ({ ...mapSupabasePost(row), liked: false, saved: false, likes: likeCounts[row.id] || 0 }));
      setExplorePosts(mapped);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. DATA PRE-FETCH
      const [followsRes, venueFollowsRes] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', user.id).eq('target_type', 'user'),
        supabase.from('follows').select('target_id').eq('follower_id', user.id).eq('target_type', 'venue')
      ]);

      const followingIds = (followsRes.data || []).map(f => f.following_id);
      const followedVenueNames = (venueFollowsRes.data || []).map(f => f.target_id);

      // Mutuality check for FRIENDS TABS
      const { data: mutuals } = await supabase.from('follows').select('follower_id').in('follower_id', followingIds).eq('following_id', user.id).eq('target_type', 'user');
      const friendIds = (mutuals || []).map(f => f.follower_id);

      // Friends of Friends (for Explore)
      const { data: fofRes } = await supabase.from('follows').select('following_id').in('follower_id', followingIds).eq('target_type', 'user');
      const fofIds = Array.from(new Set((fofRes || []).map(f => f.following_id).filter(id => id !== user.id && !followingIds.includes(id))));

      // 2. PARALLEL POST FETCHING
      const [followingRes, exploreRes, friendsRes] = await Promise.all([
        // FOLLOWING: People you follow OR posts tagging venues you follow
        supabase.from('posts').select('*, profiles(display_name, username, avatar_url, is_verified, badge)')
          .or(`user_id.in.(${[user.id, ...followingIds].join(',')}),venue_name.in.(${followedVenueNames.length ? followedVenueNames.map(v => `"${v}"`).join(',') : '"_none_"'})`)
          .eq('city', cityLabel).order('created_at', { ascending: false }).limit(40),
        
        // EXPLORE: Not followed + city tagged + fof
        supabase.from('posts').select('*, profiles(display_name, username, avatar_url, is_verified, badge)')
          .not('user_id', 'in', `(${[user.id, ...followingIds].join(',')})`)
          .eq('city', cityLabel).order('created_at', { ascending: false }).limit(40),

        // FRIENDS: Mutual follows
        friendIds.length > 0 
          ? supabase.from('posts').select('*, profiles(display_name, username, avatar_url, is_verified, badge)')
              .in('user_id', friendIds).eq('city', cityLabel).order('created_at', { ascending: false }).limit(40)
          : Promise.resolve({ data: [] })
      ]);

      const allPostRows = [...(followingRes.data || []), ...(exploreRes.data || []), ...(friendsRes.data || [])];
      const allPostIds = Array.from(new Set(allPostRows.map(p => p.id)));

      let likedSet = new Set<string>();
      let savedSet = new Set<string>();
      let likeCounts: Record<string, number> = {};

      if (allPostIds.length > 0) {
        const [allLikesRes, userLikesRes, userSavesRes] = await Promise.all([
          supabase.from('post_likes').select('post_id').in('post_id', allPostIds),
          supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', allPostIds),
          supabase.from('post_saves').select('post_id').eq('user_id', user.id).in('post_id', allPostIds),
        ]);
        (allLikesRes.data || []).forEach((l: any) => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });
        likedSet = new Set((userLikesRes.data || []).map(l => l.post_id));
        savedSet = new Set((userSavesRes.data || []).map(s => s.post_id));
      }

      setFollowingPosts((followingRes.data || []).map(row => ({
        ...mapSupabasePost(row),
        liked: likedSet.has(row.id),
        saved: savedSet.has(row.id),
        likes: likeCounts[row.id] || 0
      })));

      setExplorePosts((exploreRes.data || []).map(row => ({
        ...mapSupabasePost(row),
        liked: likedSet.has(row.id),
        saved: savedSet.has(row.id),
        likes: likeCounts[row.id] || 0
      })));

      setFriendsPosts((friendsRes.data || []).map(row => ({
        ...mapSupabasePost(row),
        liked: likedSet.has(row.id),
        saved: savedSet.has(row.id),
        likes: likeCounts[row.id] || 0
      })));

    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
    }
  }, [cityLabel, user]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return { 
    explorePosts, 
    followingPosts, 
    friendsPosts, 
    loading, 
    fetchExplorePosts: fetchFeed,
    fetchFollowingPosts: fetchFeed
  };
}
