'use client';

import { useState, useEffect } from 'react';
import type { StoryUser, RealStory } from './StoriesViewerModal';
import { HeartIcon, ChatIcon, ShareIcon, BookmarkIcon } from './icons';
import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import PostOptionsMenu from './PostOptionsMenu';
import ShareSheet from './ShareSheet';

// ── Types ────────────────────────────────────────────────────────────────────

interface FeedPost {
  id: string;
  userId: string | null;
  user: { name: string; handle: string; avatar: string; verified: boolean };
  caption: string;
  venue: { name: string; tagged: boolean };
  tags: string[];
  likes: number;
  comments: { user: string; text: string }[];
  timeAgo: string;
  liked: boolean;
  saved: boolean;
  imageTheme: { gradient: string; scene: string };
  imageUrl: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// Map Supabase post row → FeedPost
/* eslint-disable-next-line */
function mapSupabasePost(row: any): FeedPost {
  const gradients = ['from-red-900 via-purple-950 to-black', 'from-blue-900 via-indigo-950 to-black', 'from-emerald-950 via-gray-950 to-black', 'from-amber-900 via-orange-950 to-black', 'from-fuchsia-900 via-violet-950 to-black'];
  const grad = gradients[Math.abs((row.id as string).charCodeAt(0)) % gradients.length];
  return {
    id: row.id as string, userId: row.user_id as string | null,
    user: {
      name: (row.profiles?.display_name as string) || 'Night Owl',
      handle: `@${(row.profiles?.username as string) || 'nightowl'}`,
      avatar: ((row.profiles?.display_name as string) || 'N')[0].toUpperCase(),
      verified: false,
    },
    caption: (row.caption as string) || '',
    venue: { name: (row.venue_name as string) || '', tagged: !!row.venue_name },
    tags: (row.tags as string[]) || [],
    likes: (row.likes_count as number) || 0,
    comments: [],
    timeAgo: timeAgo(row.created_at as string),
    liked: false, saved: false,
    imageUrl: row.image_url,
    imageTheme: { gradient: grad, scene: '' },
  };
}

// ── FeedPage Component ───────────────────────────────────────────────────────

interface FeedPageProps {
  onVenueClick: (venueName: string) => void;
  onOpenCreatePost: () => void;
  onOpenCreateStory: () => void;
  onOpenStories: (users: StoryUser[], index: number) => void;
}

export default function FeedPage({ onVenueClick, onOpenCreatePost, onOpenCreateStory, onOpenStories }: FeedPageProps) {
  const { user, profile } = useAuth();
  const [subTab, setSubTab] = useState<'following' | 'explore' | 'friends'>('explore');

  // Stories
  const [liveStoryUsers, setLiveStoryUsers] = useState<StoryUser[]>([]);

  // Per-tab post lists
  const [explorePosts, setExplorePosts] = useState<FeedPost[]>([]);
  const [followingPosts, setFollowingPosts] = useState<FeedPost[]>([]);
  const [friendsPosts, setFriendsPosts] = useState<FeedPost[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  // UI state
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeDotsId, setActiveDotsId] = useState<string | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);

  // ── Load active stories ──────────────────────────────────────────────────

  useEffect(() => { fetchActiveStories(); }, []);

  const fetchActiveStories = async () => {
    const { data } = await supabase
      .from('stories')
      .select('id, image_url, caption, venue_name, created_at, expires_at, user_id, profiles(display_name, username, avatar_url)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!data) return;

    const userMap = new Map<string, StoryUser>();
    const colors = ['from-red-500 to-orange-500', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500',
      'from-noctvm-violet to-purple-500', 'from-pink-500 to-rose-500', 'from-amber-500 to-orange-500'];
    let colorIdx = 0;

    for (const row of data) {
      const prof = row.profiles as unknown as { display_name: string; username: string; avatar_url: string | null } | null;
      const story: RealStory = {
        id: row.id,
        image_url: row.image_url,
        caption: row.caption,
        venue_name: row.venue_name,
        created_at: row.created_at,
      };
      if (!userMap.has(row.user_id)) {
        const name = prof?.display_name || prof?.username || 'User';
        userMap.set(row.user_id, {
          id: row.user_id,
          name,
          avatar: name[0].toUpperCase(),
          avatarUrl: prof?.avatar_url,
          hasNew: true,
          color: colors[colorIdx++ % colors.length],
          stories: [],
        });
      }
      userMap.get(row.user_id)!.stories.push(story);
    }

    setLiveStoryUsers(Array.from(userMap.values()));
  };

  // ── Load explore posts ────────────────────────────────────────────────────

  useEffect(() => { fetchExplorePosts(); }, []);

  const fetchExplorePosts = async () => {
    setLoadingTab(true);
    try {
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(display_name, username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(40);
      setExplorePosts((data || []).map(mapSupabasePost));
    } finally {
      setLoadingTab(false);
    }
  };

  // ── Load real posts for Following / Friends tabs ─────────────────────────

  useEffect(() => {
    if (!user) return;
    if (subTab === 'following') loadFollowingPosts();
    if (subTab === 'friends') loadFriendsPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab, user]);

  const loadFollowingPosts = async () => {
    if (!user) return;
    setLoadingTab(true);
    try {
      // Get followed user IDs
      const { data: follows } = await supabase
        .from('follows')
        .select('target_id')
        .eq('follower_id', user.id)
        .eq('target_type', 'user');

      const followedIds = (follows || []).map((f: { target_id: string }) => f.target_id);
      if (followedIds.length === 0) { setFollowingPosts([]); return; }

      const { data: posts } = await supabase
        .from('posts')
        .select('*, profiles(display_name, username, avatar_url)')
        .in('user_id', followedIds)
        .order('created_at', { ascending: false })
        .limit(30);

      setFollowingPosts((posts || []).map(mapSupabasePost));
    } finally {
      setLoadingTab(false);
    }
  };

  const loadFriendsPosts = async () => {
    if (!user) return;
    setLoadingTab(true);
    try {
      // Mutual follows: people who follow me AND I follow them
      const { data: iFollow } = await supabase
        .from('follows')
        .select('target_id')
        .eq('follower_id', user.id)
        .eq('target_type', 'user');

      const { data: followMe } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('target_id', user.id)
        .eq('target_type', 'user');

      const iFollowSet = new Set((iFollow || []).map((f: { target_id: string }) => f.target_id));
      const mutualIds = (followMe || [])
        .map((f: { follower_id: string }) => f.follower_id)
        .filter((id: string) => iFollowSet.has(id));

      if (mutualIds.length === 0) { setFriendsPosts([]); return; }

      const { data: posts } = await supabase
        .from('posts')
        .select('*, profiles(display_name, username, avatar_url)')
        .in('user_id', mutualIds)
        .order('created_at', { ascending: false })
        .limit(30);

      setFriendsPosts((posts || []).map(mapSupabasePost));
    } finally {
      setLoadingTab(false);
    }
  };

  // ── Active post list ─────────────────────────────────────────────────────

  const activePosts = subTab === 'following' ? followingPosts : subTab === 'friends' ? friendsPosts : explorePosts;

  const updatePost = (id: string, updates: Partial<FeedPost>, tab?: 'following' | 'explore' | 'friends') => {
    const t = tab || subTab;
    const setter = t === 'following' ? setFollowingPosts : t === 'friends' ? setFriendsPosts : setExplorePosts;
    setter(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // ── Interactions ─────────────────────────────────────────────────────────

  const toggleLike = async (post: FeedPost) => {
    const optimistic = { liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 };
    updatePost(post.id, optimistic);

    if (!user) return;
    if (post.userId === null) return; // mock post - optimistic only

    if (post.liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
    }
  };

  const toggleSave = async (post: FeedPost) => {
    updatePost(post.id, { saved: !post.saved });

    if (!user || post.userId === null) return;
    if (post.saved) {
      await supabase.from('post_saves').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('post_saves').insert({ post_id: post.id, user_id: user.id });
    }
  };

  const toggleComments = (id: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const submitComment = async (post: FeedPost) => {
    const text = (commentInputs[post.id] || '').trim();
    if (!text) return;
    setCommentInputs(prev => ({ ...prev, [post.id]: '' }));

    const newComment = { user: profile?.username || 'you', text };
    updatePost(post.id, { comments: [...post.comments, newComment] });

    if (!user || post.userId === null) return;
    await supabase.from('post_comments').insert({ post_id: post.id, user_id: user.id, text });
  };

  const copyLink = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/?post=${postId}`);
  };

  // ── Render helpers ───────────────────────────────────────────────────────

  const userInitial = profile ? (profile.display_name || profile.username || 'N')[0].toUpperCase() : 'N';

  // ── Empty state for Following / Friends ─────────────────────────────────

  const renderEmptyState = () => {
    if (subTab === 'following') return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-noctvm-surface flex items-center justify-center mx-auto mb-4 border-2 border-noctvm-border">
          <svg className="w-7 h-7 text-noctvm-silver/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
        </div>
        <p className="text-white font-heading font-semibold text-sm mb-1">No posts yet</p>
        <p className="text-xs text-noctvm-silver/60">Follow people and venues to see their posts here</p>
      </div>
    );
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-noctvm-surface flex items-center justify-center mx-auto mb-4 border-2 border-noctvm-border">
          <svg className="w-7 h-7 text-noctvm-silver/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
        </div>
        <p className="text-white font-heading font-semibold text-sm mb-1">No mutual friends yet</p>
        <p className="text-xs text-noctvm-silver/60">Follow people back who follow you to see them here</p>
      </div>
    );
  };

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <>
      <ShareSheet
        isOpen={!!sharePostId}
        onClose={() => setSharePostId(null)}
        postCaption={activePosts.find(p => p.id === sharePostId)?.caption}
        postUrl={sharePostId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?post=${sharePostId}` : ''}
      />

      <div className="space-y-0">

        {/* ── Sub-tabs ─────────────────────────────────────────── */}
        <div className="flex justify-center gap-6 border-b border-noctvm-border mb-4">
          {(['following', 'explore', 'friends'] as const).map((sub) => (
            <button
              key={sub}
              onClick={() => setSubTab(sub)}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                subTab === sub ? 'text-noctvm-violet border-b-2 border-noctvm-violet' : 'text-noctvm-silver hover:text-white'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* ── Stories row ──────────────────────────────────────── */}
        <div className="flex justify-center mb-4">
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-2 py-3">
            {/* Add story / create post */}
            <div
              onClick={() => onOpenCreateStory()}
              className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-noctvm-surface border-2 border-dashed border-noctvm-border flex items-center justify-center group-hover:border-noctvm-violet/50 transition-colors relative">
                {profile?.avatar_url
                  ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full opacity-60" />
                  : null}
                <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-noctvm-violet flex items-center justify-center border-2 border-noctvm-black">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                {!profile?.avatar_url && <svg className="w-6 h-6 text-noctvm-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>}
              </div>
              <span className="text-[9px] text-noctvm-silver">Add Story</span>
            </div>

            {liveStoryUsers.map((su, i) => (
              <div
                key={su.id}
                onClick={() => onOpenStories(liveStoryUsers, i)}
                className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-full p-[2px] ${su.hasNew ? 'bg-gradient-to-br from-noctvm-violet via-purple-500 to-pink-500' : 'bg-noctvm-border'}`}>
                  <div className={`w-full h-full rounded-full bg-gradient-to-br ${su.color} flex items-center justify-center ring-2 ring-noctvm-black overflow-hidden`}>
                    {su.avatarUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={su.avatarUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sm font-bold text-white">{su.avatar}</span>}
                  </div>
                </div>
                <span className="text-[9px] text-noctvm-silver truncate max-w-[64px]">{su.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Posts ────────────────────────────────────────────── */}
        <div className="space-y-6 max-w-2xl mx-auto">

          {/* Loading */}
          {loadingTab && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-noctvm-violet/30 border-t-noctvm-violet rounded-full animate-spin mx-auto" />
            </div>
          )}

          {/* Empty states */}
          {!loadingTab && activePosts.length === 0 && renderEmptyState()}

          {/* Post cards */}
          {!loadingTab && activePosts.map((post, idx) => (
            <article key={post.id} className="bg-noctvm-surface rounded-xl border border-noctvm-border overflow-hidden animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>

              {/* ── Post header ────────────────────────────────── */}
              <div className="flex items-center gap-3 p-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">{post.user.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white">{post.user.name}</span>
                    {post.user.verified && (
                      <svg className="w-3.5 h-3.5 text-noctvm-violet" viewBox="0 0 24 24" fill="currentColor"><path d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" /></svg>
                    )}
                  </div>
                  <span className="text-[10px] text-noctvm-silver">{post.user.handle}</span>
                </div>
                <span className="text-[10px] text-noctvm-silver font-mono">{post.timeAgo}</span>

                {/* 3-dots */}
                <div className="relative">
                  <button
                    onClick={() => setActiveDotsId(activeDotsId === post.id ? null : post.id)}
                    className="text-noctvm-silver hover:text-white p-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                  {activeDotsId === post.id && (
                    <PostOptionsMenu
                      postId={post.id}
                      postUserId={post.userId}
                      currentUserId={user?.id || null}
                      authorHandle={post.user.handle}
                      isFollowing={true}
                      onClose={() => setActiveDotsId(null)}
                      onCopyLink={() => copyLink(post.id)}
                      onNotInterested={() => setExplorePosts(prev => prev.filter(p => p.id !== post.id))}
                      onReport={() => {/* TODO: report modal */}}
                    />
                  )}
                </div>
              </div>

              {/* ── Post image ─────────────────────────────────── */}
              <div className={`aspect-square bg-gradient-to-br ${post.imageTheme.gradient} flex items-center justify-center relative overflow-hidden`}>
                {post.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0">
                      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-white/5 via-white/10 to-transparent rotate-12"></div>
                      <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-white/5 via-white/8 to-transparent -rotate-6"></div>
                      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/5 blur-3xl"></div>
                      <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-white/3 blur-3xl"></div>
                      <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>
                    <div className="relative text-center px-8">
                      <p className="text-sm text-white/25 font-medium leading-relaxed italic">{post.imageTheme.scene}</p>
                    </div>
                  </>
                )}

                {/* Venue tag */}
                {post.venue.tagged && post.venue.name && (
                  <button
                    onClick={() => onVenueClick(post.venue.name)}
                    className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 hover:border-noctvm-violet/50 transition-all group hover:bg-black/80"
                  >
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 bg-noctvm-midnight flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getVenueLogo(post.venue.name)} alt="" className="w-full h-full object-cover"
                        onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.parentElement!.querySelector('.fallback')?.classList.remove('hidden'); }}
                      />
                      <span className={`fallback hidden text-[8px] font-bold bg-gradient-to-br ${getVenueColor(post.venue.name)} bg-clip-text text-transparent`}>{post.venue.name[0]}</span>
                    </div>
                    <span className="text-[10px] font-medium text-white group-hover:text-noctvm-violet transition-colors">{post.venue.name}</span>
                  </button>
                )}
              </div>

              {/* ── Actions bar ────────────────────────────────── */}
              <div className="px-3 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleLike(post)} className="hover:scale-110 active:animate-micro-pop transition-transform">
                      {post.liked
                        ? <svg className="w-6 h-6 text-red-500 animate-micro-pop" viewBox="0 0 24 24" fill="currentColor"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                        : <HeartIcon className="w-6 h-6 text-noctvm-silver hover:text-red-400 transition-colors" />
                      }
                    </button>
                    <button onClick={() => toggleComments(post.id)} className="hover:scale-110 transition-transform">
                      <ChatIcon className="w-6 h-6 text-noctvm-silver hover:text-white transition-colors" />
                    </button>
                    <button onClick={() => setSharePostId(post.id)} className="hover:scale-110 transition-transform">
                      <ShareIcon className="w-6 h-6 text-noctvm-silver hover:text-white transition-colors" />
                    </button>
                  </div>
                  <button onClick={() => toggleSave(post)} className="hover:scale-110 active:animate-micro-pop transition-transform">
                    {post.saved
                      ? <svg className="w-6 h-6 text-noctvm-gold animate-micro-pop" viewBox="0 0 24 24" fill="currentColor"><path d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" /></svg>
                      : <BookmarkIcon className="w-6 h-6 text-noctvm-silver hover:text-noctvm-gold transition-colors" />
                    }
                  </button>
                </div>

                <p className="text-xs font-semibold text-white mb-1">{post.likes.toLocaleString()} likes</p>

                <p className="text-xs text-noctvm-silver leading-relaxed mb-1">
                  <span className="font-semibold text-white mr-1">{post.user.name}</span>
                  {post.caption}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {post.venue.tagged && post.venue.name && (
                    <button onClick={() => onVenueClick(post.venue.name)} className="text-[10px] text-noctvm-violet hover:text-noctvm-violet/80 font-medium transition-colors">
                      @{post.venue.name}
                    </button>
                  )}
                  {post.tags.map(tag => <span key={tag} className="text-[10px] text-noctvm-violet/60">{tag}</span>)}
                </div>

                {/* Comments */}
                <div className="pb-3">
                  {post.comments.length > 2 && !expandedComments.has(post.id) && (
                    <button onClick={() => toggleComments(post.id)} className="text-[11px] text-noctvm-silver/60 hover:text-noctvm-silver mb-1 transition-colors">
                      View all {post.comments.length} comments
                    </button>
                  )}
                  <div className="space-y-1">
                    {(expandedComments.has(post.id) ? post.comments : post.comments.slice(0, 2)).map((c, ci) => (
                      <p key={ci} className="text-[11px] text-noctvm-silver">
                        <span className="font-semibold text-white mr-1">{c.user}</span>{c.text}
                      </p>
                    ))}
                  </div>

                  {/* Comment input */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-noctvm-border">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-400 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {profile?.avatar_url
                        ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-[8px] font-bold text-white">{userInitial}</span>
                      }
                    </div>
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInputs[post.id] || ''}
                      onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') submitComment(post); }}
                      className="flex-1 bg-transparent text-[11px] text-noctvm-silver placeholder:text-noctvm-silver/30 outline-none"
                    />
                    <button
                      onClick={() => submitComment(post)}
                      className="text-[10px] text-noctvm-violet font-semibold hover:text-noctvm-violet/80 transition-colors"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

    </>
  );
}
