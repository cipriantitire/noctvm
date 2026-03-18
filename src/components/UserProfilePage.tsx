'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { GridIcon, BookmarkIcon, TagIcon, UserIcon, RepostIcon, ShieldIcon, SettingsIcon } from './icons';
import type { StoryUser, RealStory } from './StoriesViewerModal';
import CreateHighlightModal from './CreateHighlightModal';
import EventCard from './EventCard';
import type { NoctEvent } from '@/lib/types';
import PostViewerModal from './PostViewerModal';
import VerifiedBadge from './VerifiedBadge';

// ── Types ────────────────────────────────────────────────────────────────────

interface ProfilePost {
  id: string;
  user_id: string;
  image_url: string | null;
  caption: string;
  created_at: string;
  likes_count: number;
}

interface DbHighlight {
  id: string;
  name: string;
  color: string;
  cover_url: string | null;
}

interface VenueManagerRecord {
  venue_id: string;
  role: string;
  venues: {
    id: string;
    name: string;
    image_url: string | null;
    city: string;
  };
}

interface UserProfilePageProps {
  onOpenAuth: () => void;
  onSettingsClick: () => void;
  onOpenCreatePost?: () => void;
  onOpenStories?: (users: StoryUser[], index: number) => void;
  onEventClick: (event: NoctEvent) => void;
  onManageVenue?: (venueId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserProfilePage({
  onOpenAuth,
  onSettingsClick,
  onOpenCreatePost,
  onOpenStories,
  onEventClick,
  onManageVenue,
}: UserProfilePageProps) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'saved' | 'tagged'>('posts');

  // ── Highlights state ──────────────────────────────────────────────────────
  const [highlights, setHighlights] = useState<DbHighlight[]>([]);
  const [showCreateHighlight, setShowCreateHighlight] = useState(false);

  // ── Active stories state ──────────────────────────────────────────────────
  const [hasActiveStories, setHasActiveStories] = useState(false);

  // ── Posts state ───────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [reposts, setReposts] = useState<ProfilePost[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<ProfilePost[]>([]);
  const [savedEvents, setSavedEvents] = useState<NoctEvent[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [activeViewerPosts, setActiveViewerPosts] = useState<ProfilePost[]>([]);

  // ── Venue Management ──────────────────────────────────────────────────────
  const [managedVenues, setManagedVenues] = useState<VenueManagerRecord[]>([]);

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

  // ── Data Fetching ─────────────────────────────────────────────────────────

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
      // 1. Fetch own posts
      const { data: ownData } = await supabase
        .from('posts')
        .select('id, user_id, image_url, caption, created_at, likes_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // 2. Fetch reposted posts
      const { data: repostData } = await supabase
        .from('reposts')
        .select('post_id, posts(id, user_id, image_url, caption, created_at, likes_count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // 3. Fetch tagged posts (mentions in caption or tagged_users array)
      const { data: taggedData } = await supabase
        .from('posts')
        .select('id, user_id, image_url, caption, created_at, likes_count')
        .or(`caption.ilike.%@${profile?.username}%,tagged_users.cs.{"@${profile?.username}"}`)
        .order('created_at', { ascending: false });

      const ownPosts = (ownData || []) as ProfilePost[];
      const repostedPosts = (repostData || []).map((r: any) => r.posts).filter(Boolean) as ProfilePost[];
      const tagged = (taggedData || []) as ProfilePost[];

      setPosts(ownPosts);
      setReposts(repostedPosts);
      setTaggedPosts(tagged);
    } finally {
      setLoadingPosts(false);
    }
  }, [user, profile?.username]);

  const fetchSavedEvents = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('event_saves')
      .select('events(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSavedEvents((data ?? []).map((r: any) => r.events).filter(Boolean) as NoctEvent[]);
  }, [user]);

  const fetchManagedVenues = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('venue_managers')
      .select('venue_id, role, venues(id, name, image_url, city)')
      .eq('user_id', user.id);
    if (data) setManagedVenues(data as any[]);
  }, [user]);

  useEffect(() => {
    fetchHighlights();
    fetchPosts();
    fetchSavedEvents();
    fetchManagedVenues();
  }, [fetchHighlights, fetchPosts, fetchSavedEvents, fetchManagedVenues]);

  // ── Stats Real-time ───────────────────────────────────────────────────────

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

    // Real-time listener for likes
    const channel = supabase
      .channel('profile_likes_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, async (payload) => {
        const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
        if (!postId) return;
        const { count } = await supabase.from('post_likes').select('id', { count: 'exact', head: true }).eq('post_id', postId);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: count ?? 0 } : p));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ── Stories Logic ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    supabase
      .from('stories')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .then(({ count }) => setHasActiveStories((count ?? 0) > 0));
  }, [user]);

  const fetchAndOpenMyStories = async () => {
    if (!user || !onOpenStories) return;
    const { data } = await supabase
      .from('stories')
      .select('id, image_url, caption, venue_name, created_at')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true });
    if (!data || data.length === 0) return;
    const initials = (profile?.display_name || profile?.username || 'N')[0].toUpperCase();
    const storyUser: StoryUser = {
      id: user.id,
      name: profile?.display_name || profile?.username || 'Me',
      avatar: initials,
      avatarUrl: profile?.avatar_url ?? null,
      hasNew: true,
      color: 'from-noctvm-violet to-purple-500',
      stories: data.map((s: any) => ({
        id: s.id,
        user_id: user.id,
        image_url: s.image_url,
        caption: s.caption,
        venue_name: s.venue_name,
        created_at: s.created_at,
      })),
    };
    onOpenStories([storyUser], 0);
  };

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

  const deleteHighlight = async (hlId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('highlights').delete().eq('id', hlId);
    setHighlights((prev) => prev.filter((h) => h.id !== hlId));
  };

  // ── Render Helpers ─────────────────────────────────────────────────────────

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

  const initials = (profile?.display_name || profile?.username || 'N')[0].toUpperCase();
  const tabs = [
    { key: 'posts'   as const, icon: <GridIcon     className="w-5 h-5" /> },
    { key: 'reposts' as const, icon: <RepostIcon   className="w-5 h-5" /> },
    { key: 'saved'   as const, icon: <BookmarkIcon className="w-5 h-5" /> },
    { key: 'tagged'  as const, icon: <TagIcon      className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-xl mx-auto tab-content animate-fade-in">

      {/* ── Profile Header ────────────────────────────────────── */}
      <div className="px-4 pt-2 pb-4">
        {/* Avatar + stats */}
        <div className="flex items-center gap-6 mb-4">
          <div className="relative flex-shrink-0">
            {hasActiveStories ? (
              <div
                className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-br from-noctvm-violet via-purple-500 to-pink-500 cursor-pointer"
                onClick={fetchAndOpenMyStories}
              >
                <div className="w-full h-full rounded-full bg-noctvm-black p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-noctvm-violet/30 to-purple-500/30 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-white">{initials}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-noctvm-violet/30 to-purple-500/30 flex items-center justify-center">
                {profile?.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">{initials}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-around">
            {[
              { label: 'Posts', value: statsData.posts },
              { label: 'Followers', value: statsData.followers },
              { label: 'Following', value: statsData.following },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <span className="block text-base font-bold text-white font-heading">{stat.value}</span>
                <span className="text-[11px] text-noctvm-silver">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="mb-3 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-white leading-tight">
              {profile?.display_name || 'Night Owl'}
            </p>
            {profile?.badge && profile.badge !== 'none' && (
              <VerifiedBadge type={profile.badge} size="sm" />
            )}
          </div>
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

        <div className="flex gap-2">
          <button onClick={onSettingsClick} className="flex-1 py-2 rounded-lg bg-noctvm-surface border border-noctvm-border text-xs font-semibold text-white hover:bg-noctvm-surface/70 transition-colors">Edit Profile</button>
          <button onClick={handleShareProfile} className="flex-1 py-2 rounded-lg bg-noctvm-surface border border-noctvm-border text-xs font-semibold text-white hover:bg-noctvm-surface/70 transition-colors">{shareToast ? 'Copied!' : 'Share Profile'}</button>
        </div>
      </div>

      {/* ── Manage Venue Card ─────────────────────────────────── */}
      {managedVenues.length > 0 && (
        <div className="px-4 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-noctvm-violet/20 via-noctvm-midnight to-noctvm-midnight border border-noctvm-violet/30 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-noctvm-violet">
                <ShieldIcon className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Venue Management</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-noctvm-violet/20 text-noctvm-violet text-[9px] font-bold uppercase">Authorized</span>
            </div>
            
            <div className="space-y-3">
              {managedVenues.map((mv) => (
                <div key={mv.venue_id} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-noctvm-border/50 group hover:border-noctvm-violet/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-noctvm-surface overflow-hidden">
                      {mv.venues.image_url ? (
                        <img src={mv.venues.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-noctvm-silver text-xs font-bold">{mv.venues.name[0]}</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{mv.venues.name}</p>
                      <p className="text-[10px] text-noctvm-silver font-medium">{mv.role} • {mv.venues.city}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onManageVenue?.(mv.venue_id)}
                    className="p-2 rounded-lg bg-noctvm-violet/10 border border-noctvm-violet/20 text-noctvm-violet hover:bg-noctvm-violet hover:text-white transition-all"
                    title="Manage Venue Settings"
                  >
                    <SettingsIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Story Highlights ──────────────────────────────────── */}
      <div className="border-t border-noctvm-border px-4 py-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 pt-1 px-0.5">
          <button onClick={() => setShowCreateHighlight(true)} className="flex flex-col items-center gap-1 flex-shrink-0 focus:outline-none group">
            <div className="w-16 h-16 rounded-full bg-noctvm-surface border-2 border-dashed border-noctvm-border flex items-center justify-center group-hover:border-noctvm-violet/50 transition-colors">
              <svg className="w-6 h-6 text-noctvm-silver group-hover:text-noctvm-violet transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
            </div>
            <span className="text-[9px] text-noctvm-silver">New</span>
          </button>

          {highlights.map((hl) => (
            <div key={hl.id} className="flex flex-col items-center gap-1 flex-shrink-0 relative group">
              <button onClick={() => openHighlight(hl)} className="focus:outline-none">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${hl.color} p-[2px] transition-all group-hover:p-[1px]`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-noctvm-black flex items-center justify-center">
                    {hl.cover_url ? (
                      <img src={hl.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-lg font-bold">{hl.name[0].toUpperCase()}</span>
                    )}
                  </div>
                </div>
              </button>
               <button 
                 onClick={(e) => deleteHighlight(hl.id, e)} 
                 className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-noctvm-midnight border border-noctvm-border text-noctvm-silver opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                 title="Delete Highlight"
               >
                 <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
              <span className="text-[9px] text-noctvm-silver truncate max-w-[4rem] text-center">{hl.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Bar ───────────────────────────────────────────── */}
      <div className="border-t border-noctvm-border">
        <div className="flex">
          {tabs.map(({ key, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex justify-center py-3 border-b-2 transition-all ${
                activeTab === key ? 'border-white text-white' : 'border-transparent text-noctvm-silver'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Grid ──────────────────────────────────────── */}
      <div className="pb-24">
        {activeTab === 'posts' && (
          <div className="grid grid-cols-3 gap-0.5">
            {posts.map((post, i) => (
              <button key={post.id} onClick={() => { setActiveViewerPosts(posts); setViewerIndex(i); setViewerOpen(true); }} className="aspect-square bg-noctvm-surface relative group">
                {post.image_url ? (
                  <img src={post.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                ) : (
                  <div className="w-full h-full bg-noctvm-surface flex items-center justify-center p-2"><span className="text-[10px] text-noctvm-silver/40 text-center line-clamp-3">{post.caption}</span></div>
                )}
              </button>
            ))}
            {!loadingPosts && posts.length === 0 && (
              <div className="col-span-3 py-16 text-center text-noctvm-silver">
                <GridIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No posts shared yet</p>
                <button onClick={onOpenCreatePost} className="mt-4 px-4 py-2 rounded-lg bg-noctvm-violet/20 text-noctvm-violet text-xs font-bold">Share Your First Post</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reposts' && (
          <div className="grid grid-cols-3 gap-0.5">
            {reposts.map((post, i) => (
              <button key={post.id} onClick={() => { setActiveViewerPosts(reposts); setViewerIndex(i); setViewerOpen(true); }} className="aspect-square bg-noctvm-surface relative group">
                {post.image_url ? (
                  <img src={post.image_url} alt="" className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full bg-noctvm-midnight flex items-center justify-center p-2"><span className="text-[10px] text-noctvm-emerald/40 text-center line-clamp-3">{post.caption}</span></div>
                )}
                <div className="absolute top-2 right-2 p-1 rounded-full bg-noctvm-emerald/80 backdrop-blur-sm border border-noctvm-emerald/30">
                  <RepostIcon className="w-3 h-3 text-white" />
                </div>
              </button>
            ))}
            {!loadingPosts && reposts.length === 0 && (
              <div className="col-span-3 py-16 text-center text-noctvm-silver">
                <RepostIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No reposts yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-3 px-4 py-4">
            {savedEvents.map(event => (
              <EventCard key={event.id} event={event} variant="landscape" onClick={onEventClick} />
            ))}
            {savedEvents.length === 0 && (
              <div className="py-12 text-center text-noctvm-silver">
                <BookmarkIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No events bookmarked</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tagged' && (
          <div className="grid grid-cols-3 gap-0.5">
            {taggedPosts.map((post, i) => (
              <button key={post.id} onClick={() => { setActiveViewerPosts(taggedPosts); setViewerIndex(i); setViewerOpen(true); }} className="aspect-square bg-noctvm-surface relative group">
                {post.image_url ? (
                  <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-noctvm-surface flex items-center justify-center p-2"><span className="text-[10px] text-noctvm-silver/40 text-center line-clamp-3">{post.caption}</span></div>
                )}
              </button>
            ))}
            {!loadingPosts && taggedPosts.length === 0 && (
              <div className="col-span-3 py-16 text-center text-noctvm-silver">
                <TagIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No tagged posts</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}
      <CreateHighlightModal
        isOpen={showCreateHighlight}
        onClose={() => setShowCreateHighlight(false)}
        onCreated={() => { setShowCreateHighlight(false); fetchHighlights(); }}
      />

      <PostViewerModal
        posts={activeViewerPosts}
        initialIndex={viewerIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        profileName={profile?.display_name || profile?.username || 'User'}
        profileAvatar={profile?.avatar_url ?? null}
        profileInitial={initials}
      />
    </div>
  );
}
