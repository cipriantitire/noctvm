'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { GridIcon, BookmarkIcon, TagIcon, UserIcon } from './icons';
import type { StoryUser, RealStory } from './StoriesViewerModal';
import CreateHighlightModal from './CreateHighlightModal';
import EventCard from './EventCard';
import type { NoctEvent } from '@/lib/types';
import PostViewerModal from './PostViewerModal';

// ── Post types ────────────────────────────────────────────────────────────────

interface ProfilePost {
  id: string;
  image_url: string | null;
  caption: string;
  created_at: string;
  likes_count: number;
}

// ── Highlight types ───────────────────────────────────────────────────────────

interface DbHighlight {
  id: string;
  name: string;
  color: string;
  cover_url: string | null;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface UserProfilePageProps {
  onOpenAuth: () => void;
  onSettingsClick: () => void;
  onOpenCreatePost?: () => void;
  onOpenStories?: (users: StoryUser[], index: number) => void;
  onEventClick: (event: NoctEvent) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserProfilePage({
  onOpenAuth,
  onSettingsClick,
  onOpenCreatePost,
  onOpenStories,
  onEventClick,
}: UserProfilePageProps) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');

  // ── Highlights state ──────────────────────────────────────────────────────
  const [highlights, setHighlights] = useState<DbHighlight[]>([]);
  const [showCreateHighlight, setShowCreateHighlight] = useState(false);

  // ── Active stories state ──────────────────────────────────────────────────
  const [hasActiveStories, setHasActiveStories] = useState(false);

  // ── Posts state ───────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [savedEvents, setSavedEvents] = useState<NoctEvent[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // ── Stats state ───────────────────────────────────────────────────────────
  const [statsData, setStatsData] = useState({ posts: 0, followers: 0, following: 0 });

  // ── Share toast state ──────────────────────────────────────────────────────
  const [shareToast, setShareToast] = useState(false);

  const handleShareProfile = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'NOCTVM', url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  // ── Fetch highlights ──────────────────────────────────────────────────────

  const fetchHighlights = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('highlights')
      .select('id, name, color, cover_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (data) setHighlights(data as DbHighlight[]);
  }, [user]);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoadingPosts(true);
    try {
      const { data } = await supabase
        .from('posts')
        .select('id, image_url, caption, created_at, likes_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPosts((data || []) as ProfilePost[]);
    } finally {
      setLoadingPosts(false);
    }
  }, [user]);

  const fetchSavedEvents = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('event_saves')
      .select('events(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSavedEvents((data ?? []).map((r: any) => r.events).filter(Boolean) as NoctEvent[]);
  }, [user]);

  useEffect(() => {
    fetchHighlights();
    fetchPosts();
    fetchSavedEvents();
  }, [fetchHighlights, fetchPosts, fetchSavedEvents]);

  // ── Check for active stories ──────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    supabase
      .from('stories')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .then(({ count }) => setHasActiveStories((count ?? 0) > 0));
  }, [user]);

  // ── Fetch real counters ───────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('target_id', user.id).eq('target_type', 'user'),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', user.id).eq('target_type', 'user'),
    ]).then(([postsRes, followersRes, followingRes]) => {
      setStatsData({
        posts: postsRes.count ?? 0,
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
      });
    });
  }, [user]);

  // ── Fetch and open my stories ─────────────────────────────────────────────

  const fetchAndOpenMyStories = async () => {
    if (!user || !onOpenStories) return;
    const { data } = await supabase
      .from('stories')
      .select('id, image_url, caption, venue_name, created_at')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true });
    if (!data || data.length === 0) return;
    const name = profile?.display_name || profile?.username || 'Me';
    const storyUser: import('./StoriesViewerModal').StoryUser = {
      id: user.id,
      name,
      avatar: name[0].toUpperCase(),
      avatarUrl: profile?.avatar_url ?? null,
      hasNew: true,
      color: 'from-noctvm-violet to-purple-500',
      stories: data.map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        image_url: s.image_url,
        caption: s.caption,
        venue_name: s.venue_name,
        created_at: s.created_at,
      })),
    };
    onOpenStories([storyUser], 0);
  };

  // ── Open highlight in stories viewer ─────────────────────────────────────

  const openHighlight = async (hl: DbHighlight) => {
    const { data } = await supabase
      .from('highlight_stories')
      .select('stories(id, image_url, caption, venue_name, created_at)')
      .eq('highlight_id', hl.id)
      .order('added_at', { ascending: true });

    const realStories: RealStory[] = (data ?? [])
      .map((row: any) => row.stories)
      .filter(Boolean);

    if (!realStories.length) return;

    const storyUser: StoryUser = {
      id: hl.id,
      name: hl.name,
      avatar: hl.name[0].toUpperCase(),
      avatarUrl: hl.cover_url,
      hasNew: false,
      color: hl.color,
      stories: realStories,
    };

    onOpenStories?.([storyUser], 0);
  };

  // ── Delete highlight ──────────────────────────────────────────────────────

  const deleteHighlight = async (hlId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('highlights').delete().eq('id', hlId);
    setHighlights((prev) => prev.filter((h) => h.id !== hlId));
  };

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-16 tab-content animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-noctvm-surface border-2 border-noctvm-violet/30 flex items-center justify-center mx-auto mb-6">
          <UserIcon className="w-10 h-10 text-noctvm-silver" />
        </div>
        <h2 className="font-heading text-xl font-bold text-white mb-2">Join NOCTVM</h2>
        <p className="text-sm text-noctvm-silver mb-6">
          Sign in to save events, follow venues, and connect with the nightlife community.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-8 py-3 rounded-lg bg-noctvm-violet text-white text-sm font-medium hover:bg-noctvm-violet/90 transition-colors"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  // ── Logged-in profile ─────────────────────────────────────────────────────
  const initials = (profile?.display_name || profile?.username || 'N')[0].toUpperCase();

  const stats = [
    { label: 'Posts',     value: statsData.posts },
    { label: 'Followers', value: statsData.followers },
    { label: 'Following', value: statsData.following },
  ];

  const tabs = [
    { key: 'posts'  as const, icon: <GridIcon     className="w-5 h-5" /> },
    { key: 'saved'  as const, icon: <BookmarkIcon className="w-5 h-5" /> },
    { key: 'tagged' as const, icon: <TagIcon      className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-xl mx-auto tab-content animate-fade-in">

      {/* ── Profile header ────────────────────────────────────── */}
      <div className="px-4 pt-2 pb-4">

        {/* Avatar + stats */}
        <div className="flex items-center gap-6 mb-4">
          <div className="relative flex-shrink-0">
            {hasActiveStories ? (
              <div className="p-0.5 bg-gradient-to-br from-noctvm-violet via-purple-500 to-pink-500 rounded-full">
                <div
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-500 overflow-hidden ring-2 ring-noctvm-black cursor-pointer"
                  onClick={fetchAndOpenMyStories}
                >
                  {profile?.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{initials}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-500 overflow-hidden ring-2 ring-noctvm-border">
                {profile?.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{initials}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-around">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <span className="block text-base font-bold text-white font-heading">{stat.value}</span>
                <span className="text-[11px] text-noctvm-silver">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Name, username, bio */}
        <div className="mb-3 space-y-0.5">
          <p className="text-sm font-semibold text-white leading-tight">
            {profile?.display_name || 'Night Owl'}
          </p>
          <p className="text-xs text-noctvm-silver">@{profile?.username || 'nightowl'}</p>
          {profile?.bio && (
            <p className="text-xs text-noctvm-silver/80 mt-1.5 leading-relaxed">{profile.bio}</p>
          )}
          {profile?.city && (
            <div className="flex items-center gap-1 mt-1">
              <svg className="w-3 h-3 text-noctvm-silver/50" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.953-5.158 3.953-9.077A8.223 8.223 0 0012 2.25a8.223 8.223 0 00-8.22 7.97c0 3.92 2.01 6.998 3.954 9.077a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] text-noctvm-silver/50">{profile.city}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onSettingsClick}
            className="flex-1 py-2 rounded-lg bg-noctvm-surface border border-noctvm-border text-xs font-semibold text-white hover:bg-noctvm-surface/70 transition-colors"
          >
            Edit Profile
          </button>
          <button
            onClick={handleShareProfile}
            className="flex-1 py-2 rounded-lg bg-noctvm-surface border border-noctvm-border text-xs font-semibold text-white hover:bg-noctvm-surface/70 transition-colors"
          >
            {shareToast ? 'Copied!' : 'Share Profile'}
          </button>
        </div>
      </div>

      {/* ── Story highlights ──────────────────────────────────── */}
      <div className="border-t border-noctvm-border px-4 py-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">

          {/* "New" button */}
          <button
            onClick={() => setShowCreateHighlight(true)}
            className="flex flex-col items-center gap-1 flex-shrink-0 focus:outline-none group"
            aria-label="Create new highlight"
          >
            <div className="w-16 h-16 rounded-full bg-noctvm-surface border-2 border-dashed border-noctvm-border flex items-center justify-center group-hover:border-noctvm-violet/50 transition-colors">
              <svg className="w-6 h-6 text-noctvm-silver group-hover:text-noctvm-violet transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-[9px] text-noctvm-silver">New</span>
          </button>

          {/* Existing highlights */}
          {highlights.map((hl) => (
            <div
              key={hl.id}
              className="flex flex-col items-center gap-1 flex-shrink-0 relative group"
            >
              <button
                onClick={() => openHighlight(hl)}
                className="focus:outline-none"
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${hl.color} overflow-hidden flex items-center justify-center ring-2 ring-noctvm-border group-hover:ring-noctvm-violet/50 transition-all`}>
                  {hl.cover_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={hl.cover_url} alt={hl.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-lg font-bold">{hl.name[0].toUpperCase()}</span>
                  )}
                </div>
              </button>

              {/* Delete button — visible on hover */}
              <button
                onClick={(e) => deleteHighlight(hl.id, e)}
                className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-noctvm-midnight border border-noctvm-border text-noctvm-silver hover:text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                aria-label={`Delete ${hl.name}`}
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <span className="text-[9px] text-noctvm-silver truncate max-w-[4rem] text-center">{hl.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────── */}
      <div className="border-t border-noctvm-border">
        <div className="flex">
          {tabs.map(({ key, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex justify-center py-3 border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-white text-white'
                  : 'border-transparent text-noctvm-silver hover:text-white'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Posts grid / empty state ──────────────────────────── */}
      <div className="pb-24 lg:pb-6">
        {activeTab === 'posts' && (
          <>
            {loadingPosts ? (
              <div className="grid grid-cols-3 gap-0.5">{Array.from({length:6}).map((_,i)=><div key={i} className="aspect-square bg-noctvm-surface animate-pulse"/>)}</div>
            ) : posts.length > 0 ? (
              <div className="grid grid-cols-3 gap-0.5">
                {posts.map((post, i) => (
                  <button
                    key={post.id}
                    onClick={() => { setViewerIndex(i); setViewerOpen(true); }}
                    className="aspect-square bg-noctvm-surface overflow-hidden relative group cursor-pointer"
                  >
                    {post.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-noctvm-violet/20 to-purple-900/20 flex items-center justify-center">
                        <span className="text-noctvm-silver/30 text-xs text-center px-2 line-clamp-3">{post.caption}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold">❤️ {post.likes_count}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-noctvm-surface border-2 border-noctvm-border flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-noctvm-silver/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
                </div>
                <h3 className="font-heading text-sm font-bold text-white mb-1">No Posts Yet</h3>
                <p className="text-xs text-noctvm-silver/60">Share your first nightlife moment</p>
                <button onClick={onOpenCreatePost} className="mt-4 px-6 py-2 rounded-lg bg-noctvm-violet/20 border border-noctvm-violet/30 text-noctvm-violet text-xs font-medium hover:bg-noctvm-violet/30 transition-colors">Create Post</button>
              </div>
            )}
          </>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-3 px-1">
            {savedEvents.length > 0 ? (
              savedEvents.map(event => (
                <EventCard key={event.id} event={event} variant="landscape" onClick={onEventClick} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-noctvm-surface flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-noctvm-violet/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
                </div>
                <p className="text-sm text-noctvm-silver">No saved events</p>
                <p className="text-xs text-noctvm-silver/50 mt-1">Bookmark events to find them here</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tagged' && (
          <div className="text-center py-16 animate-fade-in">
            <h3 className="font-heading text-sm font-bold text-white mb-1">No Tags Yet</h3>
            <p className="text-xs text-noctvm-silver/60">Posts where you are tagged appear here</p>
          </div>
        )}
      </div>

      {/* ── Create Highlight Modal ────────────────────────────── */}
      <CreateHighlightModal
        isOpen={showCreateHighlight}
        onClose={() => setShowCreateHighlight(false)}
        onCreated={() => {
          setShowCreateHighlight(false);
          fetchHighlights();
        }}
      />

      <PostViewerModal
        posts={posts}
        initialIndex={viewerIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
