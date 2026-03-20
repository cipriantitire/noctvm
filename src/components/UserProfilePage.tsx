'use client';

import { useState, useEffect, useCallback } from 'react';
import NextImage from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { GridIcon, BookmarkIcon, TagIcon, UserIcon, RepostIcon, ShieldIcon, SettingsIcon, MapPinIcon } from './icons';
import type { StoryUser, RealStory } from './StoriesViewerModal';
import CreateHighlightModal from './CreateHighlightModal';
import EventCard from './EventCard';
import type { NoctEvent } from '@/lib/types';
import PostViewerModal from './PostViewerModal';
import VerifiedBadge from './VerifiedBadge';
import { 
  MusicIcon, 
  InstagramIcon, 
  FacebookIcon, 
  TwitterIcon, 
  SnapchatIcon, 
  TikTokIcon, 
  GlobeIcon
} from './icons';

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
  onEditProfileClick: () => void;
  onOpenCreatePost?: () => void;
  onOpenStories?: (users: StoryUser[], index: number) => void;
  onEventClick: (event: NoctEvent) => void;
  onManageVenue?: (venueId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserProfilePage({
  onOpenAuth,
  onSettingsClick,
  onEditProfileClick,
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
  const [mobileFeedView, setMobileFeedView] = useState(false);

  // ── Venue Management ──────────────────────────────────────────────────────
  const [managedVenues, setManagedVenues] = useState<VenueManagerRecord[]>([]);

  // ── Stats state ───────────────────────────────────────────────────────────
  const [statsData, setStatsData] = useState({ 
    posts: 0, 
    followers: 0, 
    following: 0,
    eventsAttended: 0,
    venuesVisited: 0
  });

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
        eventsAttended: profile?.events_attended ?? 0,
        venuesVisited: profile?.venues_visited ?? 0
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
  }, [user, profile?.events_attended, profile?.venues_visited]);

  // ── Stories Logic ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    supabase
      .from('stories')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .then(({ count }) => setHasActiveStories((count ?? 0) > 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAndOpenMyStories = async () => {
    if (!user || !onOpenStories) return;
    const { data } = await supabase
      .from('stories')
      .select('id, image_url, caption, venue_name, event_id, event_title, created_at')
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
        event_id: s.event_id ?? null,
        event_title: s.event_title ?? null,
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
      .map((row: any) => ({
        ...row.stories,
        event_id: row.stories.event_id ?? null,
        event_title: row.stories.event_title ?? null
      }))
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
    <div className="w-full lg:max-w-2xl lg:mx-auto tab-content animate-fade-in font-sans">

      {/* ── Profile Header ────────────────────────────────────── */}
      <div className="px-0 sm:px-4 pt-4 pb-8">
        {/* Main Header Container: Desktop side-by-side, Mobile stacked */}
        <div className="flex flex-col lg:flex-row gap-8 px-4 lg:px-0 mb-8">
          
          {/* Left Side: Identity */}
          <div className="flex items-center gap-6 flex-1 min-w-0">
            {/* Avatar block */}
            <div className="relative flex-shrink-0">
              <div
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full p-0.5 relative ${
                  hasActiveStories 
                    ? 'bg-gradient-to-tr from-noctvm-violet via-purple-500 to-pink-500 animate-spin-slow cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.5)]' 
                    : 'bg-white/10'
                }`}
                onClick={hasActiveStories ? fetchAndOpenMyStories : undefined}
              >
                <div className="w-full h-full rounded-full bg-noctvm-black p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden bg-noctvm-midnight relative border border-white/5">
                    {profile?.avatar_url ? (
                      <NextImage src={profile.avatar_url} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-noctvm-violet/10">
                        <span className="text-4xl font-sans font-black text-white tracking-widest leading-none translate-y-[-2px]">{initials}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Name + Nickname Block */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h2 className="text-3xl sm:text-4xl font-sans font-black text-white tracking-tight truncate leading-none">
                  {profile?.display_name || 'Night Owl'}
                </h2>
                {profile?.badge && profile.badge !== 'none' && (
                  <VerifiedBadge type={profile.badge} size="md" />
                )}
              </div>
              <p className="text-sm font-black text-noctvm-silver/40 uppercase tracking-[0.2em]">@{profile?.username || 'nightowl'}</p>
              
              {profile?.city && (
                <div className="flex items-center gap-2 mt-3 p-1 px-3 w-fit rounded-full bg-white/[0.03] border border-white/5">
                  <MapPinIcon className="w-3 h-3 text-noctvm-violet" />
                  <span className="text-[9px] text-noctvm-silver font-black uppercase tracking-widest">{profile.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: High-End Stats Grid (Moved to same row on Desktop) */}
          <div className="w-full lg:w-[320px] grid grid-cols-2 gap-2">
            {/* Card 1: Network (Followers) */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center group hover:bg-white/[0.05] hover:border-noctvm-violet/30 transition-all cursor-default relative overflow-hidden">
               <div className="absolute top-0 right-0 w-12 h-12 bg-noctvm-violet/5 blur-xl group-hover:bg-noctvm-violet/10 transition-colors" />
               <span className="text-2xl font-mono font-black text-noctvm-violet group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">{statsData.followers}</span>
               <span className="text-[8px] uppercase tracking-widest text-noctvm-silver/40 font-black mt-1">Network</span>
            </div>

            {/* Card 2: Activity (Events) */}
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center group hover:bg-white/[0.05] hover:border-noctvm-emerald/30 transition-all cursor-default relative overflow-hidden">
               <div className="absolute top-0 right-0 w-12 h-12 bg-noctvm-emerald/5 blur-xl group-hover:bg-noctvm-emerald/10 transition-colors" />
               <span className="text-2xl font-mono font-black text-noctvm-emerald group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{statsData.eventsAttended}</span>
               <span className="text-[8px] uppercase tracking-widest text-noctvm-silver/40 font-black mt-1">Activity</span>
            </div>

            {/* Card 3: Social Proof (Following/Venues Combined) */}
            <div className="col-span-2 bg-white/[0.02] border border-white/[0.03] rounded-2xl p-3 px-4 flex items-center justify-around group hover:bg-white/[0.04] transition-all">
                <div className="text-center">
                  <span className="block text-xs font-mono font-bold text-white/50">{statsData.following}</span>
                  <span className="text-[7px] uppercase tracking-widest text-white/20 font-black">Following</span>
                </div>
                <div className="w-px h-6 bg-white/5" />
                <div className="text-center">
                  <span className="block text-xs font-mono font-bold text-white/50">{statsData.posts}</span>
                  <span className="text-[7px] uppercase tracking-widest text-white/20 font-black">Moments</span>
                </div>
                <div className="w-px h-6 bg-white/5" />
                <div className="text-center">
                  <span className="block text-xs font-mono font-bold text-white/50">{statsData.venuesVisited}</span>
                  <span className="text-[7px] uppercase tracking-widest text-white/20 font-black">Venues</span>
                </div>
            </div>
          </div>
        </div>

        {/* Bio & Links area */}
        <div className="px-4 lg:px-0 mb-6">
          {profile?.bio && (
            <p className="text-xs text-noctvm-silver/80 leading-relaxed max-w-lg mb-4 italic font-medium">&quot;{profile.bio}&quot;</p>
          )}

          <div className="flex flex-wrap gap-4 items-center">
            {/* Music Link */}
            {profile?.music_link && (
              <div className="flex items-center gap-2 p-2 px-3 rounded-full bg-noctvm-surface/50 border border-noctvm-border/50 hover:border-noctvm-violet/30 transition-all">
                <MusicIcon className="w-3.5 h-3.5 text-noctvm-violet shadow-glow" />
                <a 
                  href={profile.music_link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono font-bold text-white hover:text-noctvm-violet transition-colors flex items-center gap-1 uppercase tracking-wider"
                >
                  {profile.music_link.type}
                  <svg className="w-2.5 h-2.5 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                </a>
              </div>
            )}

            {/* Social Links */}
            {profile?.social_links && profile.social_links.length > 0 && (
              <div className="flex items-center gap-3">
                {profile.social_links.map(link => {
                  const Icon = link.platform === 'instagram' ? InstagramIcon :
                               link.platform === 'facebook' ? FacebookIcon :
                               link.platform === 'twitter' ? TwitterIcon :
                               link.platform === 'snapchat' ? SnapchatIcon :
                               link.platform === 'tiktok' ? TikTokIcon : GlobeIcon;
                  return (
                    <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" title={link.platform} className="p-2 rounded-lg text-noctvm-silver hover:text-white hover:bg-white/5 transition-all">
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Genre Pills */}
          {profile?.genres && profile.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-5">
              {profile.genres.map(genre => (
                <span key={genre} className="px-3 py-1 rounded-lg bg-noctvm-violet/5 border border-noctvm-violet/10 text-[9px] font-mono font-bold text-noctvm-violet/80 uppercase tracking-widest">
                  #{genre}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Profile Action Buttons */}
        <div className="flex gap-2.5 px-4 lg:px-0">
          <button onClick={onEditProfileClick} className="flex-1 py-3 rounded-xl bg-white text-black text-[11px] font-black uppercase tracking-wider hover:bg-noctvm-silver/90 transition-all shadow-xl shadow-white/5 active:scale-95">Edit Profile</button>
          <button onClick={handleShareProfile} className="flex-1 py-3 rounded-xl bg-noctvm-surface border border-noctvm-border text-[11px] font-black uppercase tracking-wider text-white hover:bg-noctvm-surface/70 transition-all active:scale-95">
            {shareToast ? 'Address Copied' : 'Share Profile'}
          </button>
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
                      <NextImage src={mv.venues.image_url} alt="" fill className="object-cover" unoptimized />
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
                  <div className="w-full h-full rounded-full overflow-hidden bg-noctvm-black flex items-center justify-center relative">
                    {hl.cover_url ? (
                      <NextImage src={hl.cover_url} alt="" fill className="object-cover" unoptimized />
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
        {activeTab === 'posts' && mobileFeedView && typeof window !== 'undefined' && window.innerWidth < 1024 && (
            <div className="flex flex-col mb-16">
              <div className="flex items-center gap-3 p-4 border-b border-noctvm-border bg-noctvm-midnight sticky top-0 z-20">
                <button onClick={() => setMobileFeedView(false)} title="Close feed view" className="p-2 text-white bg-white/5 rounded-full hover:bg-white/10 active:scale-95 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-sm font-bold text-white tracking-widest uppercase">Posts</span>
              </div>
              {posts.map((post, i) => (
                <div key={post.id} className="w-full bg-noctvm-surface border-b border-noctvm-border mb-4 pb-4 animate-fade-in" id={`post-${i}`}>
                  {post.image_url ? (
                    <div className="w-full aspect-square relative" onClick={() => { setActiveViewerPosts(posts); setViewerIndex(i); setViewerOpen(true); }}>
                      <NextImage src={post.image_url} alt="" fill className="object-cover" unoptimized />
                    </div>
                  ) : null}
                  <div className="p-4 flex gap-4">
                    <button className="text-white hover:text-noctvm-violet transition-colors" title="Like">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                    <button className="text-white hover:text-noctvm-violet transition-colors" onClick={() => { setActiveViewerPosts(posts); setViewerIndex(i); setViewerOpen(true); }} title="Comment">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </button>
                  </div>
                  {post.likes_count > 0 && <div className="px-4 text-xs font-bold text-white mb-1">{post.likes_count} likes</div>}
                  {post.caption && (
                    <div className="px-4 text-sm text-noctvm-silver leading-relaxed">
                      <span className="font-bold text-white mr-2">{profile?.username || 'nightowl'}</span>
                      {post.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
        )}

        {activeTab === 'posts' && !(mobileFeedView && typeof window !== 'undefined' && window.innerWidth < 1024) && (
          <div className="grid grid-cols-3 gap-0.5">
            {posts.map((post, i) => (
              <button key={post.id} onClick={() => { 
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setMobileFeedView(true);
                  setTimeout(() => { document.getElementById(`post-${i}`)?.scrollIntoView({ behavior: 'smooth' }); }, 100);
                } else {
                  setActiveViewerPosts(posts); setViewerIndex(i); setViewerOpen(true); 
                }
              }} className="aspect-square bg-noctvm-surface relative group">
                {post.image_url ? (
                  <NextImage src={post.image_url} alt="" fill className="object-cover group-hover:scale-105 transition-all duration-500" unoptimized />
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
                  <NextImage src={post.image_url} alt="" fill className="object-cover opacity-80" unoptimized />
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
                  <NextImage src={post.image_url} alt="" fill className="object-cover" unoptimized />
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

      {/* ── Profile Create Post FAB ──────────────────────────────── */}
      {onOpenCreatePost && (
        <button
          onClick={onOpenCreatePost}
          className="fixed bottom-24 right-6 lg:hidden z-40 w-14 h-14 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-600 shadow-lg shadow-noctvm-violet/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 border border-noctvm-violet/30"
          title="Create Post"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
}
