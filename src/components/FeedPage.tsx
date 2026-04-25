'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useFeedData } from '@/hooks/useFeedData';
import { StoriesRow } from './Feed/StoriesRow';
import { FeedItem } from './Feed/FeedItem';
import ShareSheet from './ShareSheet';
import { EmptyState } from '@/components/ui';
import type { StoryUser, RealStory } from './StoriesViewerModal';
import type { FeedPost } from '@/types/feed';

const STORY_VIEW_STORAGE_KEY = 'noctvm:viewed-story-user-map';
const LEGACY_STORY_VIEW_STORAGE_KEY = 'noctvm:viewed-story-user-ids';

function readViewedStoryUserIds(): Record<string, number> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORY_VIEW_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORY_VIEW_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      const map = parsed.reduce<Record<string, number>>((accumulator, userId) => {
        accumulator[userId] = Date.now();
        return accumulator;
      }, {});
      window.localStorage.setItem(STORY_VIEW_STORAGE_KEY, JSON.stringify(map));
      return map;
    }

    return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function markViewedStoryUserIds(userIds: string[]) {
  if (typeof window === 'undefined') return;

  const nextIds = readViewedStoryUserIds();
  const viewedAt = Date.now();
  userIds.forEach(userId => {
    nextIds[userId] = viewedAt;
  });
  window.localStorage.setItem(STORY_VIEW_STORAGE_KEY, JSON.stringify(nextIds));
  window.dispatchEvent(new Event('noctvm:story-views-updated'));
}

interface FeedPageProps {
  onVenueClick: (venueName: string) => void;
  onOpenCreatePost: () => void;
  onOpenCreateStory: () => void;
  onOpenStories: (users: StoryUser[], index: number) => void;
  activeCity?: 'bucuresti' | 'constanta';
  initialPostId?: string | null;
}

export default function FeedPage({ onVenueClick, onOpenCreatePost, onOpenCreateStory, onOpenStories, activeCity = 'bucuresti', initialPostId = null }: FeedPageProps) {
  const { user, profile } = useAuth();
  const [subTab, setSubTab] = useState<'explore' | 'following' | 'friends'>('following');
  const { explorePosts, followingPosts, friendsPosts, loading, fetchExplorePosts } = useFeedData(user, activeCity);
  
  const [liveStoryUsers, setLiveStoryUsers] = useState<StoryUser[]>([]);
  

  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [venueLogosMap, setVenueLogosMap] = useState<Record<string, string>>({});
  const initialPostResolverRef = useRef<string | null>(null);

  const fetchLiveStories = useCallback(async () => {
    const viewedStoryUserIds = readViewedStoryUserIds();

    const { data } = await supabase
      .from('stories')
      .select('id, user_id, image_url, caption, venue_name, event_id, event_title, created_at, profiles(display_name, username, avatar_url)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true });

    if (!data) {
      setLiveStoryUsers([]);
      return;
    }

    const groupedStories = new Map<string, StoryUser>();

    data.forEach((row: any) => {
      const profileRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const userId = row.user_id as string;
      const existing = groupedStories.get(userId);

      const story = {
        id: row.id,
        user_id: userId,
        image_url: row.image_url,
        caption: row.caption,
        venue_name: row.venue_name,
        event_id: row.event_id ?? null,
        event_title: row.event_title ?? null,
        created_at: row.created_at,
      };

      if (existing) {
        existing.stories.push(story);
        return;
      }

      groupedStories.set(userId, {
        id: userId,
        name: profileRow?.display_name || profileRow?.username || 'User',
        avatar: (profileRow?.display_name || profileRow?.username || 'U')[0].toUpperCase(),
        avatarUrl: profileRow?.avatar_url ?? null,
        hasNew: false,
        color: 'from-noctvm-violet via-purple-500 to-fuchsia-500',
        stories: [story],
      });
    });

    const storyUsers = Array.from(groupedStories.values()).map(storyUser => {
      const latestStoryCreatedAt = storyUser.stories[storyUser.stories.length - 1]?.created_at ?? '';
      const viewedAt = viewedStoryUserIds[storyUser.id] ?? 0;

      return {
        ...storyUser,
        hasNew: new Date(latestStoryCreatedAt).getTime() > viewedAt,
      };
    });

    setLiveStoryUsers(storyUsers);
  }, []);

  useEffect(() => {
    const fetchLogos = async () => {
      const { data } = await supabase.from('venues').select('name, logo_url');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(v => { if (v.logo_url) map[v.name] = v.logo_url; });
        setVenueLogosMap(map);
      }
    };
    fetchLogos();
  }, []);

  useEffect(() => {
    void fetchLiveStories();
  }, [fetchLiveStories]);

  useEffect(() => {
    const handleStoryViewsUpdated = () => {
      void fetchLiveStories();
    };

    window.addEventListener('noctvm:story-views-updated', handleStoryViewsUpdated);
    return () => window.removeEventListener('noctvm:story-views-updated', handleStoryViewsUpdated);
  }, [fetchLiveStories]);

  useEffect(() => {
    if (!initialPostId) {
      initialPostResolverRef.current = null;
      return;
    }

    if (initialPostResolverRef.current === initialPostId) return;

    if (followingPosts.some(post => post.id === initialPostId)) {
      initialPostResolverRef.current = initialPostId;
      setSubTab('following');
      return;
    }

    if (friendsPosts.some(post => post.id === initialPostId)) {
      initialPostResolverRef.current = initialPostId;
      setSubTab('friends');
      return;
    }

    if (explorePosts.some(post => post.id === initialPostId)) {
      initialPostResolverRef.current = initialPostId;
      setSubTab('explore');
    }
  }, [explorePosts, friendsPosts, followingPosts, initialPostId]);
  
  const handleOpenStories = useCallback((users: StoryUser[], index: number) => {
    markViewedStoryUserIds(users.map(userStory => userStory.id));
    setLiveStoryUsers(prev => prev.map(userStory => (
      users.some(opened => opened.id === userStory.id)
        ? { ...userStory, hasNew: false }
        : userStory
    )));
    onOpenStories(users, index);
  }, [onOpenStories]);

  const storyRingByUserId = useMemo<Record<string, 'none' | 'story-unseen' | 'story-seen'>>(() => {
    return liveStoryUsers.reduce<Record<string, 'none' | 'story-unseen' | 'story-seen'>>((map, storyUser) => {
      map[storyUser.id] = storyUser.hasNew ? 'story-unseen' : 'story-seen';
      return map;
    }, {});
  }, [liveStoryUsers]);

  const handleRepost = async (post: FeedPost) => {
    if (post.reposted) return;
    
    try {
      // 1. Dry run for validation
      const { data: dryData } = await supabase.rpc('repost_post', { 
        p_post_id: post.id, 
        p_dry_run: true 
      });

      if (dryData && !dryData.success) {
        alert(dryData.error);
        return;
      }

      // 2. Actual Repost
      const { data, error } = await supabase.rpc('repost_post', { 
        p_post_id: post.id 
      });

      if (error) throw error;
      if (data?.success) {
        // Optimistic update or refetch
        // For now, simple alert or let real-time handle it (if implemented)
        console.log('Reposted!', data.reward);
      }
    } catch (err) {
      console.error('Repost failed:', err);
    }
  };

  const handleToggleLike = async (post: FeedPost) => {
    try {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: post.id, user_id: user?.id });
      
      if (error && error.code === '23505') { // Unique violation = already liked, so unlike
        await supabase
          .from('post_likes')
          .delete()
          .match({ post_id: post.id, user_id: user?.id });
      }
    } catch (err) {
      console.error('Toggle like failed:', err);
    }
  };

  const handleToggleSave = async (post: FeedPost) => {
    try {
      const { error } = await supabase
        .from('event_saves')
        .insert({ post_id: post.id, user_id: user?.id });
        
      if (error && error.code === '23505') {
        await supabase
          .from('event_saves')
          .delete()
          .match({ post_id: post.id, user_id: user?.id });
      }
    } catch (err) {
      console.error('Toggle save failed:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      if (error) throw error;
    } catch (err) {
      console.error('Delete post failed:', err);
    }
  };

  const activePosts = subTab === 'explore' ? explorePosts : subTab === 'following' ? followingPosts : subTab === 'friends' ? friendsPosts : [];

  return (
    <div className="space-y-0">
      <ShareSheet
        isOpen={!!sharePostId}
        onClose={() => setSharePostId(null)}
        postUrl={sharePostId ? `${window.location.origin}/?tab=feed&post=${sharePostId}` : ''}
      />

      <div className="flex justify-center gap-6 border-b border-noctvm-border mb-4">
        {['explore', 'following', 'friends'].map((sub) => (
          <button
            key={sub}
            onClick={() => setSubTab(sub as any)}
            className={`pb-3 text-noctvm-caption font-bold uppercase tracking-[0.1em] transition-all ${
              subTab === sub ? 'text-noctvm-violet border-b-2 border-noctvm-violet' : 'text-noctvm-silver/40 hover:text-foreground'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      <StoriesRow 
        user={profile}
        liveStoryUsers={liveStoryUsers}
        onOpenStories={handleOpenStories}
        onOpenCreateStory={onOpenCreateStory}
      />

      <div className="space-y-6 max-w-2xl mx-auto pb-20">
        {loading && <div className="text-center py-8"><div className="w-8 h-8 border-2 border-noctvm-violet border-t-transparent rounded-full animate-spin mx-auto" /></div>}
        
        {activePosts.map((post, idx) => (
          <FeedItem 
            key={post.id} 
            post={post} 
            idx={idx} 
            user={user}
            onVenueClick={onVenueClick}
            toggleLike={handleToggleLike} 
            onShare={setSharePostId}
            onRepost={handleRepost}
            onDelete={handleDeletePost}
            venueLogosMap={venueLogosMap}
            storyRingByUserId={storyRingByUserId}
            autoOpenPostId={initialPostId}
          />
        ))}

        {!loading && activePosts.length > 0 && (
          <div className="text-center py-10 opacity-30 flex flex-col items-center gap-2">
            <div className="w-12 h-px bg-current mb-2" />
            <p className="text-noctvm-caption uppercase tracking-widest font-bold">You&apos;ve reached the end of the vibe</p>
            <p className="text-noctvm-micro">Check back later for fresh energy</p>
          </div>
        )}

        {!loading && activePosts.length === 0 && (
          <EmptyState
            icon={
              subTab === 'explore' ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              ) : subTab === 'following' ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              )
            }
            title={
              subTab === 'explore' ? 'No new vibes discovered' : subTab === 'following' ? 'Your circle is quiet' : 'No mutual friends yet'
            }
            description={
              subTab === 'explore' ? `We couldn't find any recent posts in ${activeCity}. Be the first to start the trend!` :
              subTab === 'following' ? 'Follow more people or venues to populate your feed with their latest updates.' :
              'Mutual connections appear here. Follow people back who follow you to start the conversation.'
            }
            className="py-20"
          />
        )}
      </div>
    </div>
  );
}
