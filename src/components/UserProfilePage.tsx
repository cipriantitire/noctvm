'use client';
// Triggering preview build for mobile feed enhancement

import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import NextImage from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/supabase';
import { getUserFollowState, getUserFollowerCount, getUserFollowedIds, setUserFollowState } from '@/lib/userFollow';
import { GridIcon, BookmarkIcon, TagIcon, UserIcon, RepostIcon, ShieldIcon, SettingsIcon, MapPinIcon, LayoutListIcon } from './icons';
import type { StoryUser, RealStory } from './StoriesViewerModal';
import CreateHighlightModal from './CreateHighlightModal';
import EventCard from './EventCard';
import type { NoctEvent } from '@/lib/types';
import { FeedItem } from './Feed/FeedItem';
import { mapSupabasePost } from '../lib/feed-utils';
import PostViewerModal, { type ProfilePost } from './PostViewerModal';
import VerifiedBadge from './VerifiedBadge';
import {
  MusicIcon,
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
  SnapchatIcon,
  TikTokIcon,
  GlobeIcon,
  CalendarIcon
} from './icons';
import { useScrollFade } from '@/hooks/useScrollFade';
import { ArrowUpRight, Ban, Eye, Flag, MoreHorizontal, Music2, PencilLine, PlusCircle, Share2, VolumeX, X } from 'lucide-react';
import SavedEventsSheet from './SavedEventsSheet';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Avatar } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui';

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

// ── Types ────────────────────────────────────────────────────────────────────

// Removed local ProfilePost, using imported one.

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

// ── socRow helpers ──────────────────────────────────────────────────────────

function extractSocialLabel(platform: string, url: string): string {
  // Guard: if it's not a real URL (legacy bare username stored), return as-is
  const normalized = url.startsWith('http') ? url : `https://${url}`;
  try {
    const parsed = new URL(normalized);
    if (platform === 'website') return parsed.hostname.replace(/^www\./, '');
    const parts = parsed.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || parsed.hostname;
    return last.replace(/^@/, '');
  } catch {
    return url;
  }
}

function extractMusicLabel(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    // Spotify: open.spotify.com/track/ID or /album/ID or /playlist/ID
    if (host === 'open.spotify.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      // parts: ['track', 'ID'] → return ID
      return parts[1] ?? parts[0] ?? 'spotify';
    }
    // YouTube Music: music.youtube.com/watch?v=ID
    if (host === 'music.youtube.com') {
      return parsed.searchParams.get('v') ?? 'youtube music';
    }
    // Regular YouTube — label will be fetched async; return ID as fallback
    if (host === 'youtube.com' || host === 'youtu.be') {
      const id = host === 'youtu.be'
        ? parsed.pathname.split('/').filter(Boolean)[0]
        : parsed.searchParams.get('v');
      return id ?? 'youtube';
    }
    // SoundCloud or other — show hostname
    return host;
  } catch {
    return url;
  }
}

function MusicLinkRow({ link }: { link: { type: string; url: string; label?: string } }) {
  const [title, setTitle] = React.useState<string | null>(null);

  React.useEffect(() => {
    let shouldFetch = false;
    try {
      const host = new URL(link.url).hostname.replace(/^www\./, '');
      shouldFetch = ['youtube.com', 'youtu.be', 'music.youtube.com', 'soundcloud.com', 'open.spotify.com'].includes(host);
    } catch { /* noop */ }

    if (!shouldFetch) return;
    let cancelled = false;
    fetch(`/api/yt-title?url=${encodeURIComponent(link.url)}`)
      .then(r => r.json())
      .then(data => { if (!cancelled && data.title) setTitle(data.title); })
      .catch(() => { /* silently fallback */ });
    return () => { cancelled = true; };
  }, [link.url]);

  const label = link.label ?? title ?? extractMusicLabel(link.url);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
    >
      <div className="w-[30px] h-[30px] rounded-[9px] bg-[#7C3AED25] border border-[#7C3AED40] flex items-center justify-center shrink-0">
        <Music2 className="w-3.5 h-3.5 text-noctvm-violet" />
      </div>
      <span className="font-mono text-noctvm-caption text-white">{label}</span>
    </a>
  );
}

// ────────────────────────────────────────────────────────────────────────────

interface UserProfilePageProps {
  targetProfile: Profile;
  onOpenAuth: () => void;
  onSettingsClick: () => void;
  onOpenActivityLog?: () => void;
  onEditProfileClick: () => void;
  onOpenCreatePost?: () => void;
  onOpenCreateStory?: () => void;
  onOpenStories?: (users: StoryUser[], index: number) => void;
  onEventClick: (event: NoctEvent, source?: 'profile-saved-events') => void;
  reopenSavedEventsSignal?: number;
  onManageVenue?: (venueId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserProfilePage({
  targetProfile,
  onOpenAuth,
  onSettingsClick,
  onOpenActivityLog,
  onEditProfileClick,
  onOpenCreatePost,
  onOpenCreateStory,
  onOpenStories,
  onEventClick,
  reopenSavedEventsSignal,
  onManageVenue,
}: UserProfilePageProps) {
  const { user } = useAuth();
  const isOwner = user?.id === targetProfile.id;
  const profileUsername = (targetProfile.username || 'user').replace(/^@/, '').toLowerCase();
  const profileName = targetProfile.display_name || profileUsername || 'Night Owl';
  const dragControls = useDragControls();
  const [isFollowingTarget, setIsFollowingTarget] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [hasViewedActiveStories, setHasViewedActiveStories] = useState(false);

  const handleToggleLike = useCallback(async (post: import('@/types/feed').FeedPost) => {
    if (!user) return;
    // Optimistic update across all post lists
    const toggle = (list: ProfilePost[]) => list.map(p =>
      p.id === post.id
        ? { ...p, liked: !p.liked, likes_count: p.liked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1, raw_row: { ...p.raw_row, liked: !p.liked, likes_count: p.liked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1 } }
        : p
    );
    setPosts(prev => toggle(prev));
    setReposts(prev => toggle(prev));
    setTaggedPosts(prev => toggle(prev));
    setSavedPosts(prev => toggle(prev));
    setActiveViewerPosts(prev => toggle(prev));
    // Persist
    const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
    if (error?.code === '23505') {
      await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: user.id });
    }
  }, [user]);
  const feedScrollRef = useRef<HTMLDivElement>(null) as React.MutableRefObject<HTMLDivElement | null>;
  const { ref: highlightsRef, maskStyle: highlightsMaskStyle } = useScrollFade('x');
  const { ref: fadeRef, maskStyle: feedMaskStyle } = useScrollFade('y');
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'saved' | 'tagged'>('posts');

  // ── Highlights state ──────────────────────────────────────────────────────
  const [highlights, setHighlights] = useState<DbHighlight[]>([]);
  const [showCreateHighlight, setShowCreateHighlight] = useState(false);

  // ── Active stories state ──────────────────────────────────────────────────
  const [hasActiveStories, setHasActiveStories] = useState(false);
  const [isAvatarActionPopoverOpen, setIsAvatarActionPopoverOpen] = useState(false);
  const [showProfilePictureLightbox, setShowProfilePictureLightbox] = useState(false);

  // ── Posts state ───────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [reposts, setReposts] = useState<ProfilePost[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<ProfilePost[]>([]);
  const [savedPosts, setSavedPosts] = useState<ProfilePost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [activeViewerPosts, setActiveViewerPosts] = useState<ProfilePost[]>([]);
  const [mobileFeedView, setMobileFeedView] = useState(false);

  // Scroll to the clicked post once the sheet is open
  useEffect(() => {
    if (!mobileFeedView) return;
    const el = document.getElementById(`post-${viewerIndex}`);
    if (el && feedScrollRef.current) {
      feedScrollRef.current.scrollTop = el.offsetTop;
    }
  }, [mobileFeedView, viewerIndex]);

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

  // ── Saved Events Sheet state ──────────────────────────────────────────────
  const [isSavedEventsOpen, setIsSavedEventsOpen] = useState(false);
  const lastSavedEventsReopenSignalRef = useRef<number>(reopenSavedEventsSignal ?? 0);

  useEffect(() => {
    if (!isOwner || reopenSavedEventsSignal === undefined) return;
    if (reopenSavedEventsSignal === lastSavedEventsReopenSignalRef.current) return;

    lastSavedEventsReopenSignalRef.current = reopenSavedEventsSignal;
    setIsSavedEventsOpen(true);
  }, [isOwner, reopenSavedEventsSignal]);

  useEffect(() => {
    if (!user || isOwner) {
      setIsFollowingTarget(false);
      return;
    }

    let cancelled = false;

    const fetchFollowState = async () => {
      if (!cancelled) {
        setIsFollowingTarget(await getUserFollowState(user.id, targetProfile.id));
      }
    };

    void fetchFollowState();

    return () => {
      cancelled = true;
    };
  }, [isOwner, targetProfile.id, user]);

  const handleShareProfile = async () => {
    const cleanHandle = targetProfile.username.replace(/^@/, '');
    const url = `${window.location.origin}/@${cleanHandle}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'NOCTVM', url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    } catch {
      // User cancelled or clipboard access was denied.
    }
  };

  const handleReportProfile = () => {
    const cleanHandle = targetProfile.username.replace(/^@/, '');
    const url = `${window.location.origin}/@${cleanHandle}`;
    const subject = encodeURIComponent(`Report profile: @${cleanHandle}`);
    const body = encodeURIComponent(`Profile URL: ${url}\n\nReason:`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
  };

  const handleBlockUser = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      const { error } = await supabase
        .from('user_blocks')
        .upsert({ blocker_id: user.id, blocked_id: targetProfile.id }, { onConflict: 'blocker_id,blocked_id' });

      if (error) {
        console.error('Error blocking user:', error);
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleMuteUser = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      const { error } = await supabase
        .from('user_mutes')
        .upsert({ muter_id: user.id, muted_id: targetProfile.id }, { onConflict: 'muter_id,muted_id' });

      if (error) {
        console.error('Error muting user:', error);
      }
    } catch (error) {
      console.error('Error muting user:', error);
    }
  };

  const handleToggleFollow = useCallback(async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (isOwner) return;

    const previousState = isFollowingTarget;
    const nextState = !previousState;

    setFollowLoading(true);
    setIsFollowingTarget(nextState);
    setStatsData(prev => ({
      ...prev,
      followers: Math.max(0, prev.followers + (nextState ? 1 : -1)),
    }));

    try {
      await setUserFollowState(user.id, targetProfile.id, nextState);
    } catch (error) {
      console.error('Error toggling follow:', error);
      setIsFollowingTarget(previousState);
      setStatsData(prev => ({
        ...prev,
        followers: Math.max(0, prev.followers + (previousState ? 1 : -1)),
      }));
    } finally {
      setFollowLoading(false);
    }
  }, [isFollowingTarget, isOwner, onOpenAuth, targetProfile.id, user]);

  // ── Data Fetching ─────────────────────────────────────────────────────────

  const fetchHighlights = useCallback(async () => {
    const { data } = await supabase
      .from('highlights')
      .select('id, name, color, cover_url')
      .eq('user_id', targetProfile.id)
      .order('created_at', { ascending: true });
    if (data) setHighlights(data as DbHighlight[]);
  }, [targetProfile.id]);

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      // 1. Fetch own posts
      const { data: ownData } = await supabase
        .from('posts')
        .select('*, profiles(display_name, username, avatar_url, is_verified, badge)')
        .eq('user_id', targetProfile.id)
        .order('created_at', { ascending: false });

      // 2. Fetch reposted posts
      const { data: repostData } = await supabase
        .from('reposts')
        .select('post_id, posts(*, profiles(display_name, username, avatar_url, is_verified, badge))')
        .eq('user_id', targetProfile.id)
        .order('created_at', { ascending: false });

      // 3. Fetch tagged posts (mentions in caption or tagged_users array)
      const { data: taggedData } = await supabase
        .from('posts')
        .select('*, profiles(display_name, username, avatar_url, is_verified, badge)')
        .or(`caption.ilike.%@${targetProfile.username}%,tagged_users.cs.{"@${targetProfile.username}"}`)
        .order('created_at', { ascending: false });

      // Collect all post IDs and fetch real like counts + current user's liked set
      const allRawPosts = [
        ...(ownData || []),
        ...((repostData || []).map((r: any) => r.posts).filter(Boolean)),
        ...(taggedData || []),
      ];
      const allPostIds = Array.from(new Set(allRawPosts.map((p: any) => p.id as string)));
      let likeCounts: Record<string, number> = {};
      let likedSet = new Set<string>();
      if (allPostIds.length > 0) {
        const [{ data: allLikes }, { data: userLikes }] = await Promise.all([
          supabase.from('post_likes').select('post_id').in('post_id', allPostIds),
          user ? supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', allPostIds) : Promise.resolve({ data: [] }),
        ]);
        (allLikes || []).forEach((l: any) => { likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1; });
        (userLikes || []).forEach((l: any) => likedSet.add(l.post_id));
      }

      const withLikes = (p: any) => ({ ...p, likes_count: likeCounts[p.id] || 0, liked: likedSet.has(p.id) });

      const ownPosts = (ownData || []).map(p => ({
        ...withLikes(p),
        reposted: false,
        raw_row: withLikes(p)
      })) as ProfilePost[];

      const repostedPosts = (repostData || [])
        .map((r: any) => r.posts)
        .filter(Boolean)
        .map((p: any) => ({
          ...withLikes(p),
          reposted: true,
          raw_row: withLikes(p)
        })) as ProfilePost[];

      const tagged = (taggedData || []).map(p => ({
        ...withLikes(p),
        reposted: false,
        raw_row: withLikes(p)
      })) as ProfilePost[];

      setPosts(ownPosts);
      setReposts(repostedPosts);
      setTaggedPosts(tagged);
    } finally {
      setLoadingPosts(false);
    }
  }, [targetProfile.id, targetProfile.username, user]);

  const fetchSavedPosts = useCallback(async () => {
    if (!user || !isOwner) return;
    const { data } = await supabase
      .from('post_saves')
      .select('post_id, posts(*, profiles(display_name, username, avatar_url, is_verified, badge))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      const posts = (data as any[])
        .map(r => r.posts)
        .filter(Boolean)
        .map(p => ({ 
          ...p, 
          reposted: false, 
          reposts_count: p.reposts_count,
          raw_row: p
        })) as ProfilePost[];
      setSavedPosts(posts);
    }
  }, [user, isOwner]);

  const fetchManagedVenues = useCallback(async () => {
    const { data } = await supabase
      .from('venue_managers')
      .select('venue_id, role, venues(id, name, image_url, city)')
      .eq('user_id', targetProfile.id);
    if (data) setManagedVenues(data as any[]);
  }, [targetProfile.id]);

  useEffect(() => {
    fetchHighlights();
    fetchPosts();
    fetchSavedPosts();
    fetchManagedVenues();
  }, [fetchHighlights, fetchPosts, fetchSavedPosts, fetchManagedVenues]);

  // ── Stats Real-time ───────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', targetProfile.id),
      getUserFollowerCount(targetProfile.id),
      getUserFollowedIds(targetProfile.id),
    ]).then(([postsRes, followersCount, followingIds]) => {
      setStatsData({
        posts: postsRes.count ?? 0,
        followers: followersCount,
        following: followingIds.length,
        eventsAttended: targetProfile.events_attended ?? 0,
        venuesVisited: targetProfile.venues_visited ?? 0
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
  }, [targetProfile.id, targetProfile.events_attended, targetProfile.venues_visited]);

  // ── Stories Logic ──────────────────────────────────────────────────────────

  const refreshStoryMeta = useCallback(async () => {
    const { data } = await supabase
      .from('stories')
      .select('created_at')
      .eq('user_id', targetProfile.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    const hasStories = (data?.length ?? 0) > 0;
    const latestStoryAt = hasStories ? new Date(data?.[0]?.created_at ?? 0).getTime() : 0;
    const viewedAt = readViewedStoryUserIds()[targetProfile.id] ?? 0;
    setHasActiveStories(hasStories);
    setHasViewedActiveStories(hasStories && latestStoryAt <= viewedAt);
  }, [targetProfile.id]);

  useEffect(() => {
    void refreshStoryMeta();

    const handleStoryRefresh = () => {
      void refreshStoryMeta();
    };

    window.addEventListener('noctvm:story-views-updated', handleStoryRefresh);
    return () => window.removeEventListener('noctvm:story-views-updated', handleStoryRefresh);
  }, [refreshStoryMeta]);

  useEffect(() => {
    if (hasActiveStories && isAvatarActionPopoverOpen) {
      setIsAvatarActionPopoverOpen(false);
    }
  }, [hasActiveStories, isAvatarActionPopoverOpen]);

  useEffect(() => {
    if (!showProfilePictureLightbox) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowProfilePictureLightbox(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showProfilePictureLightbox]);

  const fetchAndOpenMyStories = async () => {
    if (!onOpenStories) return;
    const { data } = await supabase
      .from('stories')
      .select('id, image_url, caption, venue_name, event_id, event_title, created_at')
      .eq('user_id', targetProfile.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true });
    if (!data || data.length === 0) return;
    markViewedStoryUserIds([targetProfile.id]);
    setHasViewedActiveStories(true);
    const storyInitials = (targetProfile.display_name || targetProfile.username || 'N')[0].toUpperCase();
    const storyUser: StoryUser = {
      id: targetProfile.id,
      name: profileName,
      avatar: storyInitials,
      avatarUrl: targetProfile.avatar_url ?? null,
      hasNew: true,
      color: 'from-noctvm-violet to-purple-500',
      stories: data.map((s: any) => ({
        id: s.id,
        user_id: targetProfile.id,
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

  const storyRing = hasActiveStories
    ? (hasViewedActiveStories ? 'story-seen' : 'story-unseen')
    : 'none';

  const handleAvatarClick = () => {
    if (hasActiveStories) {
      void fetchAndOpenMyStories();
    }
  };

  const handleViewProfilePicture = () => {
    setIsAvatarActionPopoverOpen(false);
    setShowProfilePictureLightbox(true);
  };

  const handleEditProfilePicture = () => {
    setIsAvatarActionPopoverOpen(false);
    onEditProfileClick();
  };

  const handleAddStoryFromPopover = () => {
    setIsAvatarActionPopoverOpen(false);
    onOpenCreateStory?.();
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

  const initials = (targetProfile.display_name || targetProfile.username || 'N')[0].toUpperCase();
  const tabs: Array<{ key: 'posts' | 'reposts' | 'saved' | 'tagged'; Icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'posts',   Icon: GridIcon },
    { key: 'reposts', Icon: RepostIcon },
    ...(isOwner ? [{ key: 'saved' as const, Icon: BookmarkIcon }] : []),
    { key: 'tagged',  Icon: TagIcon },
  ];

  return (
    <Fragment>
    <motion.div
      className="w-full lg:max-w-2xl lg:mx-auto tab-content animate-fade-in font-body"
      onPanEnd={(_, info) => {
        if (isOwner && (info.offset.x < -100 || info.velocity.x < -500)) {
          setIsSavedEventsOpen(true);
        }
      }}
    >
      {isOwner && (
        <SavedEventsSheet
          userId={user?.id || ''}
          isOpen={isSavedEventsOpen}
          onClose={() => setIsSavedEventsOpen(false)}
          activeCity={targetProfile.city as any}
          onEventClick={(event) => {
            setIsSavedEventsOpen(false);
            onEventClick(event, 'profile-saved-events');
          }}
        />
      )}

      {/* ── Profile Header ────────────────────────────────────── */}
      <div className="px-4 pt-6 pb-8">

        {/* Row 1: Avatar + Identity */}
        <div className="flex items-start gap-5 mb-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {isOwner && !hasActiveStories ? (
              <DropdownMenu
                open={isAvatarActionPopoverOpen}
                onOpenChange={setIsAvatarActionPopoverOpen}
              >
                <DropdownMenuTrigger asChild>
                  <div
                    className="outline-none"
                    role="button"
                    tabIndex={0}
                    aria-label="Profile picture actions"
                    title="Profile picture actions"
                  >
                    <Avatar
                      src={targetProfile.avatar_url}
                      alt={targetProfile.display_name || targetProfile.username || 'Profile'}
                      fallback={initials}
                      size="2xl"
                      ring={storyRing}
                      showAddStoryButton={isOwner}
                      onAddStoryClick={() => {
                        setIsAvatarActionPopoverOpen(false);
                        onOpenCreateStory?.();
                      }}
                      addStoryButtonSize="xl"
                      className="w-32 h-32 cursor-pointer"
                    />
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" side="bottom" sideOffset={8} className="w-56">
                  <DropdownMenuItem onClick={handleViewProfilePicture}>
                    <Eye className="h-4 w-4" />
                    <span>View profile picture</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEditProfilePicture}>
                    <PencilLine className="h-4 w-4" />
                    <span>Edit profile picture</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleAddStoryFromPopover}>
                    <PlusCircle className="h-4 w-4" />
                    <span>Add a story</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Avatar
                src={targetProfile.avatar_url}
                alt={targetProfile.display_name || targetProfile.username || 'Profile'}
                fallback={initials}
                size="2xl"
                ring={storyRing}
                onClick={hasActiveStories ? handleAvatarClick : undefined}
                showAddStoryButton={isOwner}
                onAddStoryClick={() => {
                  setIsAvatarActionPopoverOpen(false);
                  onOpenCreateStory?.();
                }}
                addStoryButtonSize="xl"
                className={`w-32 h-32 ${hasActiveStories || isOwner ? 'cursor-pointer' : ''}`}
              />
            )}
          </div>

          {/* Identity col: name + handle + location + bio */}
          <div className="flex-1 min-w-0 flex items-start justify-between gap-3 pt-1">
            <div className="min-w-0 flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-white tracking-tight leading-none">
                  {profileName}
                </h2>
                {targetProfile.badge && targetProfile.badge !== 'none' && (
                  <VerifiedBadge type={targetProfile.badge} size="md" />
                )}
              </div>

              <p className="text-xs font-semibold text-noctvm-silver/50 tracking-[0.2em]">
                @{profileUsername}
              </p>

              {targetProfile.city && (
                <div className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  <MapPinIcon className="w-3 h-3 text-noctvm-silver/60" />
                  <span className="text-noctvm-caption font-black uppercase tracking-widest text-noctvm-silver/60">
                    {targetProfile.city}
                  </span>
                </div>
              )}

              {targetProfile.bio && (
                <p className="text-xs text-noctvm-silver/70 leading-relaxed italic font-medium mt-1">
                  &quot;{targetProfile.bio}&quot;
                </p>
              )}
            </div>

            {/* Mobile Agenda trigger */}
            {isOwner && (
              <button
                onClick={() => setIsSavedEventsOpen(true)}
                type="button"
                className="xl:hidden shrink-0 p-2 rounded-xl bg-white/5 border border-white/10 text-noctvm-silver/70 hover:text-white hover:bg-noctvm-violet/20 hover:border-noctvm-violet/30 transition-all flex items-center justify-center relative group"
                title="View Agenda"
              >
                <CalendarIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-noctvm-violet rounded-full border border-noctvm-black animate-pulse" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Stats */}
        <div className="flex flex-wrap gap-2 mb-5">
          {/* Events card */}
          <div className="order-1 flex-1 basis-[calc(50%-4px)] lg:order-1 lg:flex-none lg:w-[124px] bg-[#111111] border border-[#1A1A1A] rounded-[14px] p-2 flex flex-col items-center justify-center gap-1 relative overflow-hidden group hover:border-noctvm-emerald/40 transition-all cursor-default">
            <div className="absolute inset-0 bg-noctvm-emerald/5 group-hover:bg-noctvm-emerald/10 transition-colors" />
            <span className="text-noctvm-xl leading-none font-bold text-noctvm-emerald font-mono relative tabular-nums">{statsData.eventsAttended}</span>
            <span className="text-noctvm-micro uppercase tracking-widest text-noctvm-silver/60 font-semibold font-body relative">Events</span>
          </div>

          {/* Grouped card: Posts / Followers / Following */}
          <div className="order-3 basis-full lg:order-2 lg:flex-1 bg-[#111111] border border-[#1A1A1A] rounded-[14px] p-2 flex items-center">
            <div className="flex flex-1 flex-col items-center gap-1">
              <span className="text-noctvm-xl leading-none font-bold text-[#E8E4DF] font-mono tabular-nums">{statsData.posts}</span>
              <span className="text-noctvm-micro uppercase tracking-widest text-noctvm-silver/60 font-semibold font-body">Posts</span>
            </div>
            <div className="w-px h-6 bg-[#FFFFFF15]" />
            <div className="flex flex-1 flex-col items-center gap-1">
              <span className="text-noctvm-xl leading-none font-bold text-[#E8E4DF] font-mono tabular-nums">{statsData.followers}</span>
              <span className="text-noctvm-micro uppercase tracking-widest text-noctvm-silver/60 font-semibold font-body">Followers</span>
            </div>
            <div className="w-px h-6 bg-[#FFFFFF15]" />
            <div className="flex flex-1 flex-col items-center gap-1">
              <span className="text-noctvm-xl leading-none font-bold text-[#E8E4DF] font-mono tabular-nums">{statsData.following}</span>
              <span className="text-noctvm-micro uppercase tracking-widest text-noctvm-silver/60 font-semibold font-body">Following</span>
            </div>
          </div>

          {/* Venues card */}
          <div className="order-2 flex-1 basis-[calc(50%-4px)] lg:order-3 lg:flex-none lg:w-[124px] bg-[#111111] border border-[#1A1A1A] rounded-[14px] p-2 flex flex-col items-center justify-center gap-1 relative overflow-hidden group hover:border-noctvm-violet/40 transition-all cursor-default">
            <div className="absolute inset-0 bg-noctvm-violet/5 group-hover:bg-noctvm-violet/10 transition-colors" />
            <span className="text-noctvm-xl leading-none font-bold text-noctvm-violet font-mono relative tabular-nums">{statsData.venuesVisited}</span>
            <span className="text-noctvm-micro uppercase tracking-widest text-noctvm-silver/60 font-semibold font-body relative">Venues</span>
          </div>
        </div>

        {/* Row 3: socRow — vertical link stack */}
        {(targetProfile.music_link || (targetProfile.social_links && targetProfile.social_links.length > 0)) && (
          <div className="flex flex-col gap-1.5 mb-4 w-fit">
            {targetProfile.social_links?.map(link => {
              const isWebsite = link.platform === 'website';
              const Icon = isWebsite ? ArrowUpRight
                : link.platform === 'instagram' ? InstagramIcon
                : link.platform === 'facebook' ? FacebookIcon
                : link.platform === 'twitter' ? TwitterIcon
                : link.platform === 'snapchat' ? SnapchatIcon
                : link.platform === 'tiktok' ? TikTokIcon
                : GlobeIcon;
              const label = extractSocialLabel(link.platform, link.url);
              return (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
                >
                  <div className="w-[30px] h-[30px] rounded-[9px] bg-[#111111] border border-[#1A1A1A] flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-noctvm-silver" />
                  </div>
                  <span className="font-mono text-noctvm-caption text-white">{label}</span>
                </a>
              );
            })}
            {targetProfile.music_link && (
              <MusicLinkRow link={targetProfile.music_link} />
            )}
          </div>
        )}

        {/* Row 4: Genre pills */}
        {targetProfile.genres && targetProfile.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {targetProfile.genres.map(genre => (
              <span
                key={genre}
                className="px-3 py-1 rounded-full bg-noctvm-violet/10 border border-noctvm-violet/20 text-noctvm-caption font-mono font-bold text-noctvm-violet/90 uppercase tracking-widest"
              >
                #{genre}
              </span>
            ))}
          </div>
        )}

        {/* Row 5: Action buttons */}
        <div className="flex gap-2.5">
          {isOwner ? (
            <button
              type="button"
              onClick={onEditProfileClick}
              className="flex-1 py-3 rounded-2xl border border-white/10 bg-white/[0.05] text-noctvm-label font-black uppercase tracking-wider text-white transition-all hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.96]"
            >
              Edit Profile
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleToggleFollow()}
              disabled={followLoading}
              className="flex-1 py-3 rounded-2xl bg-noctvm-violet text-white text-noctvm-label font-black uppercase tracking-wider hover:bg-noctvm-violet/90 transition-all active:scale-[0.96] disabled:opacity-60"
            >
              {followLoading ? '...' : (isFollowingTarget ? 'Following' : 'Follow')}
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Profile options"
                title={shareToast ? 'Profile shared' : 'Profile options'}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-[0.96] ${
                  shareToast
                    ? 'border-noctvm-violet/30 bg-noctvm-violet/10 text-white'
                    : 'border-noctvm-border bg-noctvm-surface text-white hover:bg-white/[0.06]'
                }`}
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={8} className="w-56">
              {isOwner ? (
                <>
                  <DropdownMenuItem onClick={() => void handleShareProfile()}>
                    <Share2 className="h-4 w-4" />
                    <span>Share profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onOpenActivityLog?.()}>
                    <LayoutListIcon className="h-4 w-4" />
                    <span>Activity Log</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => void handleShareProfile()}>
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleReportProfile} variant="destructive">
                    <Flag className="h-4 w-4" />
                    <span>Report</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleBlockUser()} variant="destructive">
                    <Ban className="h-4 w-4" />
                    <span>Block</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleMuteUser()} variant="destructive">
                    <VolumeX className="h-4 w-4" />
                    <span>Mute</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Manage Venue Card ─────────────────────────────────── */}
      {managedVenues.length > 0 && (
        <div className="px-4 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-noctvm-violet/20 via-noctvm-midnight to-noctvm-midnight border border-noctvm-violet/30 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-noctvm-violet">
                <ShieldIcon className="w-4 h-4" />
                <span className="text-noctvm-label font-bold uppercase tracking-wider">Venue Management</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-noctvm-violet/20 text-noctvm-violet text-noctvm-micro font-bold uppercase">Authorized</span>
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
                      <p className="text-noctvm-caption text-noctvm-silver font-medium">{mv.role} • {mv.venues.city}</p>
                    </div>
                  </div>
                  <button
                    type="button"
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
        <div ref={highlightsRef} style={highlightsMaskStyle} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 pt-1 px-0.5">
          {isOwner && (
            <button type="button" onClick={() => setShowCreateHighlight(true)} className="flex flex-col items-center gap-1 flex-shrink-0 focus:outline-none group">
              <div className="w-16 h-16 rounded-full bg-noctvm-surface border-2 border-dashed border-noctvm-border flex items-center justify-center group-hover:border-noctvm-violet/50 transition-colors">
                <svg className="w-6 h-6 text-noctvm-silver group-hover:text-noctvm-violet transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
              </div>
              <span className="text-noctvm-micro text-noctvm-silver">New</span>
            </button>
          )}

          {highlights.map((hl) => (
            <div key={hl.id} className="flex flex-col items-center gap-1 flex-shrink-0 relative group">
              <button type="button" onClick={() => openHighlight(hl)} className="focus:outline-none">
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
               {isOwner && (
                 <button
                   type="button"
                   onClick={(e) => deleteHighlight(hl.id, e)}
                   className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-noctvm-midnight border border-noctvm-border text-noctvm-silver opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                   title="Delete Highlight"
                 >
                   <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
               )}
              <span className="text-noctvm-micro text-noctvm-silver truncate max-w-[4rem] text-center">{hl.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Bar ───────────────────────────────────────────── */}
      <div className="border-t border-noctvm-border">
        <div className="flex">
          {tabs.map(({ key, Icon }) => (
            <button
              key={key}
              type="button"
              aria-label={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex justify-center py-3 border-b-2 transition-all ${
                activeTab === key ? 'border-white text-white' : 'border-transparent text-noctvm-silver'
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Grid ──────────────────────────────────────── */}
      <div className="pb-24">

        {activeTab === 'posts' && !(mobileFeedView && typeof window !== 'undefined' && window.innerWidth < 1024) && (
          <div className="grid grid-cols-3 gap-0.5">
            {posts.map((post, i) => (
              <button type="button" key={post.id} onClick={() => {
                setActiveViewerPosts(posts); setViewerIndex(i);
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setMobileFeedView(true);
                } else {
                  setViewerOpen(true);
                }
              }} className="aspect-square bg-noctvm-surface relative group">
                {post.image_url ? (
                  <NextImage src={post.image_url} alt="" fill className="object-cover group-hover:scale-105 transition-all duration-500" unoptimized />
                ) : (
                  <div className="w-full h-full bg-noctvm-surface flex items-center justify-center p-2"><span className="text-noctvm-caption text-noctvm-silver/40 text-center line-clamp-3">{post.caption}</span></div>
                )}
              </button>
            ))}
            {!loadingPosts && posts.length === 0 && (
              <div className="col-span-3 py-16 text-center text-noctvm-silver">
                <GridIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No posts shared yet</p>
                {isOwner && <button type="button" onClick={onOpenCreatePost} className="mt-4 px-4 py-2 rounded-lg bg-noctvm-violet/20 text-noctvm-violet text-xs font-bold">Share Your First Post</button>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reposts' && (
          <div className="grid grid-cols-3 gap-0.5">
            {reposts.map((post, i) => (
              <button type="button" key={post.id} onClick={() => {
                setActiveViewerPosts(reposts); setViewerIndex(i);
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setMobileFeedView(true);
                } else {
                  setViewerOpen(true);
                }
              }} className="aspect-square bg-noctvm-surface relative group">
                {post.image_url ? (
                  <NextImage src={post.image_url} alt="" fill className="object-cover opacity-80" unoptimized />
                ) : (
                  <div className="w-full h-full bg-noctvm-midnight flex items-center justify-center p-2"><span className="text-noctvm-caption text-noctvm-emerald/40 text-center line-clamp-3">{post.caption}</span></div>
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
          <div className="grid grid-cols-3 gap-0.5">
            {savedPosts.map((post, i) => (
              <button
                type="button"
                key={post.id}
                onClick={() => {
                  setActiveViewerPosts(savedPosts); setViewerIndex(i);
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setMobileFeedView(true);
                  } else {
                    setViewerOpen(true);
                  }
                }}
                className="aspect-square bg-noctvm-surface relative group"
              >
                {post.image_url ? (
                  <NextImage src={post.image_url} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-noctvm-midnight flex items-center justify-center p-2">
                    <span className="text-noctvm-caption text-noctvm-silver/40 text-center line-clamp-3">{post.caption}</span>
                  </div>
                )}
              </button>
            ))}
            {!loadingPosts && savedPosts.length === 0 && (
              <div className="col-span-3 py-16 text-center text-noctvm-silver">
                <BookmarkIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No saved posts</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tagged' && (
          <div className="grid grid-cols-3 gap-0.5">
            {taggedPosts.map((post, i) => (
              <button type="button" key={post.id} onClick={() => {
                setActiveViewerPosts(taggedPosts); setViewerIndex(i);
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setMobileFeedView(true);
                } else {
                  setViewerOpen(true);
                }
              }} className="aspect-square bg-noctvm-surface relative group">
                {post.image_url ? (
                  <NextImage src={post.image_url} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-noctvm-surface flex items-center justify-center p-2"><span className="text-noctvm-caption text-noctvm-silver/40 text-center line-clamp-3">{post.caption}</span></div>
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
        profileName={profileName}
        profileAvatar={targetProfile.avatar_url ?? null}
        profileInitial={initials}
      />

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showProfilePictureLightbox && (
            <motion.div
              key="profile-picture-lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[650] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
              onClick={() => setShowProfilePictureLightbox(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Profile picture"
            >
              <button
                type="button"
                onClick={() => setShowProfilePictureLightbox(false)}
                className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white transition-colors hover:bg-black/75"
                aria-label="Close profile picture"
              >
                <X className="h-5 w-5" />
              </button>

              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="relative h-[min(82vw,560px)] w-[min(82vw,560px)] max-h-[560px] max-w-[560px] overflow-hidden rounded-full border border-white/10 bg-noctvm-surface shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
                onClick={(event) => event.stopPropagation()}
              >
                {targetProfile.avatar_url ? (
                  <NextImage
                    src={targetProfile.avatar_url}
                    alt={targetProfile.display_name || targetProfile.username || 'Profile picture'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-7xl font-bold text-white/90">{initials}</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      , document.body)}

      {/* ── Profile Create Post FAB ──────────────────────────────── */}
      {isOwner && onOpenCreatePost && (
        <button
          type="button"
          onClick={onOpenCreatePost}
          className="fixed bottom-24 right-6 lg:hidden z-40 w-14 h-14 rounded-full border border-noctvm-black/70 ring-1 ring-white/20 bg-[linear-gradient(155deg,rgba(104,44,206,0.96),rgba(58,22,146,0.90))] text-white shadow-[0_6px_12px_rgba(5,5,5,0.45),inset_0_1px_0_rgba(255,255,255,0.30)] flex items-center justify-center hover:scale-105 hover:brightness-105 active:scale-[0.96] transition-all duration-200"
          title="Create Post"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </motion.div>

    {typeof document !== 'undefined' && createPortal(
    <AnimatePresence>
      {mobileFeedView && typeof window !== 'undefined' && window.innerWidth < 1024 && (
        <motion.div
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 80 || info.velocity.y > 400) setMobileFeedView(false);
          }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 z-[300] bg-noctvm-midnight flex flex-col"
          onKeyDown={(e) => { if (e.key === 'Escape') setMobileFeedView(false); }}
          tabIndex={-1}
        >
          {/* Header — drag from anywhere here to dismiss */}
          <div
            className="touch-none flex-shrink-0 bg-noctvm-midnight/90 backdrop-blur-md border-b border-noctvm-border"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center gap-3 px-4 pb-3">
              <button
                type="button"
                onClick={() => setMobileFeedView(false)}
                title="Close feed"
                className="p-2 text-white bg-white/5 rounded-full hover:bg-white/10 active:scale-[0.96] transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white tracking-[0.2em] uppercase">
                  {activeTab === 'posts' ? 'Moments' :
                   activeTab === 'reposts' ? 'Reposts' :
                   activeTab === 'saved' ? 'Saved' : 'Tagged'}
                </span>
                <span className="text-noctvm-caption text-noctvm-silver/50 font-bold uppercase tracking-widest">
                  {profileName}
                </span>
              </div>
            </div>
          </div>
          {/* Scrollable content — separate from draggable container */}
          <div ref={(node) => { feedScrollRef.current = node; fadeRef.current = node; }} style={feedMaskStyle} className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-px bg-noctvm-border">
              {activeViewerPosts.map((post, i) => {
                const feedPost = post.raw_row ? mapSupabasePost(post.raw_row) : null;
                if (!feedPost) return null;
                return (
                  <div key={post.id} className="bg-noctvm-midnight" id={`post-${i}`}>
                    <FeedItem
                      post={{ ...feedPost, liked: post.liked ?? false, likes: post.likes_count }}
                      idx={i}
                      user={user}
                      onVenueClick={() => {}}
                      toggleLike={handleToggleLike}
                      onShare={() => {}}
                      onRepost={() => {}}
                      onDelete={() => {}}
                      venueLogosMap={{}}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    , document.body)}
    </Fragment>
  );
}
