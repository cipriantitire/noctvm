'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import FilterBar, { GENRE_FILTERS } from '@/components/FilterBar';
import Link from 'next/link';
import Image from 'next/image';
import EventCard from '@/components/EventCard';
import RightPanel from '@/components/RightPanel';
import VenueModal from '@/components/VenueModal';
import VenuesPage from '@/components/VenuesPage';
import FeedPage from '@/components/FeedPage';
import MobileTopSection from '@/components/MobileTopSection';
import UserProfilePage from '@/components/UserProfilePage';
import SearchBar from '@/components/SearchBar';
import { ActivityLogPage, SettingsPage } from '@/components/ProfilePages';
import ProfileSidebar from '@/components/ProfileSidebar';
import AuthModal from '@/components/AuthModal';
import EventModal from '@/components/EventModal';
import CreatePostModal from '@/components/CreatePostModal';
import CreateStoryModal from '@/components/CreateStoryModal';
import GlobalSearchSheet, { type GlobalSearchActionId } from '@/components/GlobalSearchSheet';
import type { StoryUser } from '@/components/StoriesViewerModal';
import StoriesViewerModal from '@/components/StoriesViewerModal';
import NotificationsPanel from '@/components/NotificationsPanel';
import { 
  MoonIcon, 
  UserIcon, 
  EventsIcon, 
  FeedIcon, 
  PocketIcon, 
  CogIcon, 
  VenuesIcon, 
  GridIcon, 
  BellIcon,
  SearchIcon,
  EditIcon,
  ShieldIcon,
  StarIcon 
} from '@/components/icons';
import { SAMPLE_EVENTS } from '@/lib/events-data';
import { NoctEvent } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useFrostedGlass } from '@/hooks/useFrostedGlass';
import PocketPage from '@/components/PocketPage';
import { useAuth } from '@/contexts/AuthContext';
import ManageVenueModal from '@/components/ManageVenueModal';
import type { Profile } from '@/lib/supabase';

type TabType = 'events' | 'feed' | 'venues' | 'pocket' | 'profile';

// Profile views:
//   'profile'         → Instagram-style public profile page
//   'account-menu'    → Old settings menu (Manage Account, Add Location, etc.)
//   'manage-account'  → Manage account sub-page
//   'add-location'    → Add location sub-page
//   'claim-location'  → Claim location sub-page
//   'app-settings'    → App settings sub-page
type ProfileView =
  | 'profile'
  | 'account-menu'
  | 'account'
  | 'manage-account'
  | 'add-location'
  | 'claim-location'
  | 'app-settings'
  | 'edit-profile'
  | 'appearance'
  | 'blocked_muted'
  | 'inventory'
  | 'notifications'
  | 'privacy'
  | 'activity-log';

type UrlState = {
  tab: TabType;
  eventId: string | null;
  venueName: string | null;
  postId: string | null;
};

const AUTH_GATED_TABS: TabType[] = ['feed', 'pocket', 'profile'];

function isAuthGatedTab(tab: TabType) {
  return AUTH_GATED_TABS.includes(tab);
}

function parseUrlState(search: string): UrlState {
  const params = new URLSearchParams(search);
  const tabParam = params.get('tab');
  const postId = params.get('post');
  const eventId = params.get('event');
  const venueName = params.get('venue');
  const tab = tabParam && ['events', 'feed', 'venues', 'pocket', 'profile'].includes(tabParam)
    ? tabParam as TabType
    : postId
      ? 'feed'
      : eventId
        ? 'events'
        : venueName
          ? 'venues'
          : 'events';

  return { tab, eventId, venueName, postId };
}

function buildUrlStateUrl(state: UrlState, pathname = window.location.pathname): string {
  const params = new URLSearchParams();
  params.set('tab', state.tab);
  if (state.postId) params.set('post', state.postId);
  if (state.eventId) params.set('event', state.eventId);
  if (state.venueName) params.set('venue', state.venueName);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function AppShell() {
  const { user, profile, signOut, isAdmin, isOwner } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [activeCity, setActiveCity] = useState<'bucuresti' | 'constanta'>('bucuresti');
  const [activeGenres, setActiveGenres] = useState<string[]>(['All']);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [activeGenreVenues, setActiveGenreVenues] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'portrait' | 'landscape'>('landscape');
  const [profileView, setProfileView] = useState<ProfileView>('profile');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<NoctEvent | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [previousTab, setPreviousTab] = useState<TabType>('events');
  const [venueClosing, setVenueClosing] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [storyStartIndex, setStoryStartIndex] = useState(0);
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [dbEvents, setDbEvents] = useState<NoctEvent[] | null>(null);
  const [managedVenueId, setManagedVenueId] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const [initialPostId, setInitialPostId] = useState<string | null>(null);
  const [publicProfileHandle, setPublicProfileHandle] = useState<string | null>(null);
  const [publicProfile, setPublicProfile] = useState<Profile | null>(null);
  const [publicProfileLoading, setPublicProfileLoading] = useState(false);
  const bootstrappedHistoryRef = useRef(false);

  const syncHistory = useCallback((state: UrlState, mode: 'push' | 'replace' = 'push', pathnameOverride?: string) => {
    if (typeof window === 'undefined') return;
    const url = buildUrlStateUrl(state, pathnameOverride ?? window.location.pathname);
    if (mode === 'replace') {
      window.history.replaceState({ noctvm: 'app', ...state }, '', url);
    } else {
      window.history.pushState({ noctvm: 'app', ...state }, '', url);
    }
  }, []);

  const applyUrlState = useCallback((state: UrlState) => {
    setActiveTab(state.tab);
    setInitialPostId(state.postId);
    setPendingEventId(state.eventId);
    setSelectedVenue(state.venueName);
    if (state.tab !== 'profile') {
      setProfileView('profile');
    }
    if (!state.eventId) {
      setSelectedEvent(null);
    }
    if (!state.venueName) {
      setVenueClosing(false);
      setSelectedVenue(null);
    }
  }, []);

  const syncRouteFromLocation = useCallback(() => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname;

    if (pathname.startsWith('/@')) {
      const cleanHandle = decodeURIComponent(pathname.slice(2)).replace(/^@/, '').trim();
      setPublicProfileHandle(cleanHandle || null);
      setPublicProfile(null);
      setPublicProfileLoading(!!cleanHandle);
      setActiveTab('profile');
      setProfileView('profile');
      return;
    }

    setPublicProfileHandle(null);
    setPublicProfile(null);
    setPublicProfileLoading(false);
    applyUrlState(parseUrlState(window.location.search));
  }, [applyUrlState]);

  useEffect(() => {
    syncRouteFromLocation();
  }, [pathname, syncRouteFromLocation]);

  useEffect(() => {
    setIsClient(true);
    syncRouteFromLocation();

    const initialState = parseUrlState(window.location.search);

    if (!bootstrappedHistoryRef.current) {
      bootstrappedHistoryRef.current = true;
      const baseState: UrlState = {
        tab: initialState.postId ? 'feed' : initialState.eventId ? 'events' : initialState.venueName ? 'venues' : initialState.tab,
        eventId: null,
        venueName: null,
        postId: null,
      };
      const deepLinkPresent = !!(initialState.postId || initialState.eventId || initialState.venueName);
      if (deepLinkPresent) {
        const baseUrl = buildUrlStateUrl(baseState);
        const deepUrl = buildUrlStateUrl(initialState);
        window.history.replaceState({ noctvm: 'app', ...baseState }, '', baseUrl);
        window.history.pushState({ noctvm: 'app', ...initialState }, '', deepUrl);
      }
    }

    const handlePopState = () => {
      syncRouteFromLocation();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncRouteFromLocation]);

  useEffect(() => {
    let cancelled = false;

    if (!publicProfileHandle) {
      setPublicProfile(null);
      setPublicProfileLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const loadPublicProfile = async () => {
      setActiveTab('profile');
      setProfileView('profile');
      setPublicProfileLoading(true);

      try {
        const { data: usernameMatch } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', publicProfileHandle)
          .maybeSingle();

        let resolvedProfile = usernameMatch as Profile | null;

        if (!resolvedProfile) {
          const { data: displayNameMatch } = await supabase
            .from('profiles')
            .select('*')
            .ilike('display_name', publicProfileHandle)
            .maybeSingle();

          resolvedProfile = displayNameMatch as Profile | null;
        }

        if (!cancelled) {
          setPublicProfile(resolvedProfile);
        }
      } finally {
        if (!cancelled) {
          setPublicProfileLoading(false);
        }
      }
    };

    void loadPublicProfile();

    return () => {
      cancelled = true;
    };
  }, [publicProfileHandle]);

  useEffect(() => {
    if (!pendingEventId) return;
    const allEvents = [...(dbEvents ?? []), ...SAMPLE_EVENTS];
    const match = allEvents.find(event => event.id === pendingEventId);
    if (match) setSelectedEvent(match);
  }, [dbEvents, pendingEventId]);

  const handleOpenStories = useCallback((users: StoryUser[], index: number) => {
    setStoryUsers(users);
    setStoryStartIndex(index);
    setShowStories(true);
  }, []);

  useFrostedGlass();

  useEffect(() => {
    if (window.innerWidth >= 1024) setViewMode('portrait');
  }, []);

  useEffect(() => {
    // DB uses "Bucharest" and "Constanta" (no accent)
    const city = activeCity === 'bucuresti' ? 'Bucharest' : 'Constanta';
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('events')
      .select('*')
      .eq('city', city)
      .gte('date', today)
      .order('is_promoted', { ascending: false })
      .order('date')
      .then(({ data }) => {
        if (data && data.length > 0) setDbEvents(data as NoctEvent[]);
        else setDbEvents([]);
      });
  }, [activeCity]);

  // Reset header visibility on tab change
  useEffect(() => { setHeaderHidden(false); }, [activeTab]);

  // Auto-hide header on scroll down, reveal on scroll up
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    let lastY = el.scrollTop;
    const handler = () => {
      const y = el.scrollTop;
      const diff = y - lastY;
      
      // Delay hide until user has scrolled past most of the top section
      // 600px is ~8 lines (Events), 300px is ~4 lines (Venues)
      const threshold = activeTab === 'venues' ? 300 : 600;
      
      if (diff > 8 && y > threshold) setHeaderHidden(true);
      else if (diff < -8) setHeaderHidden(false);
      lastY = y;
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [activeTab]);

  // Lock body scroll when overlay is active
  useEffect(() => {
    if (selectedVenue || selectedEvent || showAuthModal || showCreatePost || showCreateStory || showStories || isGlobalSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isGlobalSearchOpen, selectedVenue, selectedEvent, showAuthModal, showCreatePost, showCreateStory, showStories]);

  const openProfileSettingsView = useCallback((view: ProfileView) => {
    setPreviousTab(activeTab);
    setActiveTab('profile');
    setProfileView('profile');
    setSelectedEvent(null);
    setPendingEventId(null);
    setSelectedVenue(null);
    setVenueClosing(false);
    setInitialPostId(null);
    syncHistory({ tab: 'profile', eventId: null, venueName: null, postId: null });

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setProfileView(view);
  }, [activeTab, syncHistory, user]);

  // Switch to profile tab and show the account menu
  const handleSettingsClick = useCallback(() => {
    openProfileSettingsView('account-menu');
  }, [openProfileSettingsView]);

  const handleSearchAction = useCallback((action: GlobalSearchActionId) => {
    setIsGlobalSearchOpen(false);

    switch (action) {
      case 'open-settings':
        openProfileSettingsView('account-menu');
        return;
      case 'open-notifications':
        setIsNotificationsOpen(true);
        return;
      case 'open-dashboard':
        router.push('/dashboard');
        return;
      case 'edit-profile':
        openProfileSettingsView('edit-profile');
        return;
      case 'account':
        openProfileSettingsView('account');
        return;
      case 'privacy':
        openProfileSettingsView('privacy');
        return;
      case 'notifications-settings':
        openProfileSettingsView('notifications');
        return;
      case 'appearance':
        openProfileSettingsView('appearance');
        return;
      case 'blocked_muted':
        openProfileSettingsView('blocked_muted');
        return;
      case 'inventory':
        openProfileSettingsView('inventory');
        return;
      case 'activity':
        openProfileSettingsView('activity-log');
        return;
      case 'add_location':
        openProfileSettingsView('add-location');
        return;
      case 'claim_location':
        openProfileSettingsView('claim-location');
        return;
      default:
        return;
    }
  }, [openProfileSettingsView, router]);

  // Switch to a tab and reset profile view to 'profile'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotificationsOpen(false);
        setShowAuthModal(false);
        setSelectedEvent(null);
        setSelectedVenue(null);
        setShowCreatePost(false);
        setShowCreateStory(false);
        setShowStories(false);
        setManagedVenueId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    const leavingPublicProfile = !!publicProfileHandle && tab !== 'profile';

    setActiveTab(tab);
    if (tab === 'profile') setProfileView('profile');
    setSelectedEvent(null);
    setPendingEventId(null);
    setSelectedVenue(null);
    setVenueClosing(false);
    setInitialPostId(null);

    if (leavingPublicProfile) {
      setPublicProfileHandle(null);
      setPublicProfile(null);
      setPublicProfileLoading(false);
    }

    syncHistory(
      { tab, eventId: null, venueName: null, postId: null },
      'push',
      leavingPublicProfile ? '/' : undefined,
    );

    if (!user && isAuthGatedTab(tab)) {
      setShowAuthModal(true);
    }
  }, [publicProfileHandle, syncHistory, user]);

  // Modal Z-Index Management (whichever open last on top)
  const [eventZIndex, setEventZIndex] = useState(200);
  const [venueZIndex, setVenueZIndex] = useState(100);
  const [maxZIndex, setMaxZIndex] = useState(200);

  const openVenue = useCallback((venue: string | null) => {
    if (!venue) {
      setSelectedVenue(null);
      return;
    }

    const newZ = maxZIndex + 1;
    setVenueZIndex(newZ);
    setMaxZIndex(newZ);
    setSelectedVenue(venue);
    syncHistory({ tab: activeTab, eventId: null, venueName: venue, postId: null });
  }, [activeTab, maxZIndex, syncHistory]);

  const openEvent = useCallback((event: NoctEvent | null) => {
    if (event) {
      const newZ = maxZIndex + 1;
      setEventZIndex(newZ);
      setMaxZIndex(newZ);
      setPendingEventId(event.id);
      syncHistory({ tab: activeTab, eventId: event.id, venueName: null, postId: null });
    } else if (typeof window !== 'undefined' && window.location.search.includes('event=')) {
      window.history.back();
      return;
    }
    setSelectedEvent(event);
  }, [activeTab, maxZIndex, syncHistory]);

  const filteredEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const isBuc = activeCity === 'bucuresti';
    
    // Use DB events when loaded; fall back to sample data ONLY for Bucharest if DB is empty
    let events: NoctEvent[] = [];
    if (dbEvents !== null) {
      if (dbEvents.length > 0) {
        events = dbEvents;
      } else if (isBuc) {
        events = SAMPLE_EVENTS.filter(e => e.date >= today);
      }
    }

    if (!activeGenres.includes('All')) {
      events = events.filter(e =>
        (e.genres || []).some(g => activeGenres.some(ag => g.toLowerCase().includes(ag.toLowerCase())))
      );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        (e.genres || []).some(g => g.toLowerCase().includes(q))
      );
    }
    if (selectedDate) {
      events = events.filter(e => e.date === selectedDate);
    }
    return events;
  }, [dbEvents, activeGenres, searchQuery, selectedDate, activeCity]);

  const handleVenueClick = useCallback((name: string) => openVenue(name), [openVenue]);
  const handleCloseVenue = useCallback(() => setVenueClosing(true), []);

  // ── Account menu icons ────────────────────────────────────────────────────
  const addLocationIcon = (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
  const claimLocationIcon = (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );

  // Account menu items
  const accountMenuItems = [
    { label: 'Edit Profile', desc: 'Avatar, bio, social links, effects', key: 'edit-profile' as ProfileView, icon: <EditIcon className="w-5 h-5" /> },
    { label: 'Inventory', desc: 'Manage your premium profile effects', key: 'inventory' as ProfileView, icon: <StarIcon className="w-5 h-5" /> },
    { label: 'Privacy & Terms', desc: 'Security and usage preferences', key: 'manage-account' as ProfileView, icon: <ShieldIcon className="w-5 h-5" /> },
    { label: 'Settings', desc: 'App preferences and notifications', key: 'app-settings' as ProfileView, icon: <CogIcon className="w-5 h-5" /> },
    { label: 'Add Location', desc: 'Add a venue or event space', key: 'add-location' as ProfileView, icon: addLocationIcon },
    { label: 'Claim Location', desc: 'Claim ownership of a venue', key: 'claim-location' as ProfileView, icon: claimLocationIcon },
  ];

  // ── Profile sub-page resolver ─────────────────────────────────────────────
  const backToMenu = () => setProfileView('account-menu');
  const profileSubContent: Record<string, React.ReactNode> = {
    'account-menu':    <SettingsPage onBack={() => setProfileView('profile')} />,
    'edit-profile':    <SettingsPage onBack={() => setProfileView('profile')} initialView="edit" />,
    'account':         <SettingsPage onBack={() => setProfileView('profile')} initialView="account" />,
    'manage-account':  <SettingsPage onBack={() => setProfileView('profile')} initialView="privacy" />,
    'privacy':         <SettingsPage onBack={() => setProfileView('profile')} initialView="privacy" />,
    'notifications':   <SettingsPage onBack={() => setProfileView('profile')} initialView="notifications" />,
    'appearance':      <SettingsPage onBack={() => setProfileView('profile')} initialView="appearance" />,
    'blocked_muted':   <SettingsPage onBack={() => setProfileView('profile')} initialView="blocked_muted" />,
    'inventory':       <SettingsPage onBack={() => setProfileView('profile')} initialView="inventory" />,
    'add-location':    <SettingsPage onBack={() => setProfileView('profile')} initialView="add_location" />,
    'claim-location':  <SettingsPage onBack={() => setProfileView('profile')} initialView="claim_location" />,
    'app-settings':    <SettingsPage onBack={() => setProfileView('profile')} initialView="notifications" />,
    'activity-log':    <ActivityLogPage onBack={() => setProfileView('profile')} />,
  };

  const isProfileSubPage = [
    'account-menu',
    'account',
    'edit-profile',
    'manage-account',
    'inventory',
    'add-location',
    'claim-location',
    'app-settings',
    'appearance',
    'blocked_muted',
    'notifications',
    'privacy',
    'activity-log'
  ].includes(profileView);
  const isOwnPublicProfile = !!publicProfile && !!user && publicProfile.id === user.id;
  const canAccessProfileSubPages = !!user && (!publicProfile || isOwnPublicProfile);
  const isProfileSettingsView = activeTab === 'profile' && isProfileSubPage && canAccessProfileSubPages;

  useEffect(() => {
    if (!user && activeTab === 'profile' && profileView !== 'profile') {
      setProfileView('profile');
    }
  }, [activeTab, profileView, user]);

  const authGateCopy: Record<Exclude<TabType, 'events' | 'venues'>, { title: string; subtitle: string; body: string; icon: typeof FeedIcon }> = {
    feed: {
      title: 'Feed locked',
      subtitle: 'Sign in to read and post',
      body: 'Your feed, stories, and sharing tools live behind your account so your activity stays tied to the right profile.',
      icon: FeedIcon,
    },
    pocket: {
      title: 'Pocket locked',
      subtitle: 'Sign in to open your rewards',
      body: 'Pocket balance, rewards, and saved perks are personalized. Sign in to continue where you left off.',
      icon: PocketIcon,
    },
    profile: {
      title: 'Profile locked',
      subtitle: 'Sign in to access your account',
      body: 'Your profile, settings, and saved venues are private to your account. Sign in to continue.',
      icon: UserIcon,
    },
  };

  const renderAuthGate = (tab: Exclude<TabType, 'events' | 'venues'>) => {
    const gate = authGateCopy[tab];
    const GateIcon = gate.icon;

    return (
      <section className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-noctvm-violet/20 blur-3xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-noctvm-midnight/70 shadow-[0_0_40px_rgba(139,92,246,0.25)]">
            <GateIcon className="h-8 w-8 text-noctvm-violet" />
          </div>
        </div>

        <p className="text-noctvm-caption uppercase tracking-[0.35em] text-noctvm-silver/50">{gate.title}</p>
        <h2 className="mt-3 font-heading text-3xl font-black text-white sm:text-4xl">{gate.subtitle}</h2>
        <p className="mt-4 max-w-lg text-sm leading-6 text-noctvm-silver">{gate.body}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="rounded-full bg-noctvm-violet px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-noctvm-violet/90"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAuthModal(false);
              handleTabChange('events');
            }}
            className="rounded-full border border-noctvm-border bg-noctvm-surface px-6 py-3 text-sm font-semibold text-noctvm-silver transition-colors hover:text-white hover:bg-white/5"
          >
            Browse Events
          </button>
        </div>
      </section>
    );
  };

  return (
    <>
      {/* ── Auth Modal ──────────────────────────────────────────── */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* ── Manage Venue Modal ───────────────────────────────────── */}
      <ManageVenueModal 
        isOpen={!!managedVenueId} 
        onClose={() => setManagedVenueId(null)} 
        venueId={managedVenueId!} 
      />

      {/* ── Event Detail Modal ──────────────────────────────────── */}
      {/* Note: Injected at root, uses z-[200] in component to sit above Venue Overlay z-[100] */}
      <EventModal
        event={selectedEvent}
        onClose={() => {
          if (typeof window !== 'undefined' && window.location.search.includes('event=')) {
            window.history.back();
            return;
          }
          setSelectedEvent(null);
          setPendingEventId(null);
        }}
        onVenueClick={(venueName) => {
          setSelectedEvent(null);
          setPendingEventId(null);
          openVenue(venueName);
        }}
        onOpenAuth={() => setShowAuthModal(true)}
        zIndex={eventZIndex}
      />

      {/* ── Create Post Modal ───────────────────────────────────── */}
      <CreatePostModal isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} onPostCreated={() => {}} onOpenAuth={() => setShowAuthModal(true)} activeCity={activeCity} />

      {/* ── Create Story Modal ──────────────────────────────────── */}
      <CreateStoryModal isOpen={showCreateStory} onClose={() => setShowCreateStory(false)} onOpenAuth={() => setShowAuthModal(true)} activeCity={activeCity} />

      {/* ── Stories Viewer Modal ──────────────────────────────────── */}
      <StoriesViewerModal
        isOpen={showStories}
        onClose={() => setShowStories(false)}
        users={storyUsers}
        startIndex={storyStartIndex}
        myUserId={user?.id}
      />

      {/* ── Feed Create Post FAB ──────────────────────────────────── */}
      {activeTab === 'feed' && user && (
        <button
          onClick={() => setShowCreatePost(true)}
          className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 xl:right-[22rem] z-40 w-14 h-14 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-600 shadow-lg shadow-noctvm-violet/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 border border-noctvm-violet/30"
          title="Add Post"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* ── Venue Overlay ───────────────────────────────────────── */}
      {(selectedVenue || venueClosing) && (
        <div 
          className={`fixed inset-0 flex sm:items-center sm:justify-center p-0 sm:p-4 lg:p-8 ${venueZIndex >= eventZIndex ? 'z-[210]' : 'z-[200]'}`}
        >
          <div className={`absolute inset-0 bg-black/70 backdrop-blur-md backdrop-enter ${venueClosing ? 'animate-fade-out' : ''}`} onClick={handleCloseVenue} />
          <div
            className={`relative w-full h-full sm:h-auto sm:max-h-[95vh] sm:w-[95%] lg:w-[90%] lg:h-[92%] sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col ${
              venueClosing ? 'animate-scale-out' : 'animate-scale-in'
            } border-0 sm:border border-white/10 frosted-glass-modal frosted-noise`}
            onAnimationEnd={() => {
              if (!venueClosing) return;
              setVenueClosing(false);
              setSelectedVenue(null);
              if (typeof window !== 'undefined' && window.location.search.includes('venue=')) {
                window.history.back();
              }
            }}
          >
            <VenueModal
              venueName={selectedVenue!}
              onBack={handleCloseVenue}
              onClose={handleCloseVenue}
              onEventClick={(e) => openEvent(e)}
              zIndex={venueZIndex}
            />
          </div>
        </div>
      )}

      {/* ── Main Layout ─────────────────────────────────────────── */}
      <div className="flex h-screen bg-noctvm-black overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSearchClick={() => setIsGlobalSearchOpen(true)}
          onSettingsClick={handleSettingsClick}
          onNotificationsClick={() => setIsNotificationsOpen(true)}
          activeCity={activeCity}
        />

        <main ref={mainRef} className={`flex-1 min-h-screen ${isProfileSettingsView ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {/* Mobile header */}
          <header className="lg:hidden sticky top-0 z-40 glass border-b border-noctvm-border px-4 py-3">
            <div className="grid grid-cols-3 items-center">
              {/* Left: Logo */}
              <div className="flex items-center justify-start min-w-0 overflow-hidden">
                <Image
                  src="/images/typelogo-first.webp"
                  alt="NOCTVM"
                  width={200}
                  height={48}
                  priority
                  className="h-6 w-auto max-w-[120px] object-contain sm:max-w-[140px]"
                />
              </div>
              
              {/* Middle: City Selector */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 opacity-80">
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald live-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)] flex-shrink-0"
                  />
                  <div className="relative flex h-6 items-center">
                    <select
                      value={activeCity}
                      onChange={(e) => setActiveCity(e.target.value as 'bucuresti' | 'constanta')}
                      className="h-6 bg-transparent text-noctvm-label text-noctvm-silver font-mono capitalize leading-none focus:outline-none cursor-pointer appearance-none pr-4"
                      aria-label="Select City"
                    >
                      <option value="bucuresti" className="bg-noctvm-black">București</option>
                      <option value="constanta" className="bg-noctvm-black">Constanța</option>
                    </select>
                    <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-noctvm-silver pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setIsGlobalSearchOpen(true)}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-noctvm-silver/70 hover:text-white hover:bg-noctvm-violet/20 hover:border-noctvm-violet/30 transition-all flex items-center justify-center"
                  title="Search"
                >
                  <SearchIcon className="w-3.5 h-3.5" />
                </button>
                {(isAdmin || isOwner) && (
                  <Link 
                    href="/dashboard"
                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-noctvm-silver/70 hover:text-white hover:bg-noctvm-violet/20 hover:border-noctvm-violet/30 transition-all flex items-center justify-center"
                    title="Dashboard"
                  >
                    <GridIcon className="w-3.5 h-3.5" />
                  </Link>
                )}
                <button
                  onClick={() => setIsNotificationsOpen(true)}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-noctvm-silver/70 hover:text-white hover:bg-noctvm-violet/20 hover:border-noctvm-violet/30 transition-all flex items-center justify-center relative"
                  title="Notifications"
                >
                  <BellIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleSettingsClick}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-noctvm-silver/70 hover:text-white hover:bg-noctvm-violet/20 hover:border-noctvm-violet/30 transition-all flex items-center justify-center"
                  title="Settings"
                >
                  <CogIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </header>

          <div className={`w-full h-full max-w-[1800px] mx-auto px-4 lg:px-8 py-6 pb-24 lg:pb-6 ${isProfileSettingsView ? 'overflow-hidden' : ''}`}>

            {/* ── Events Tab ──────────────────────────────────── */}
            {activeTab === 'events' && (
              <div className="tab-content">
                <MobileTopSection 
                  onVenueClick={openVenue} 
                  onEventClick={openEvent}
                  activeCity={activeCity} 
                  activeGenres={activeGenres}
                  activeTab={activeTab}
                  headerHidden={headerHidden}
                />

                {/* Sticky auto-hide header */}
                <SearchBar
                  type="events"
                  activeCity={activeCity}
                  onCityChange={setActiveCity}
                  headerHidden={headerHidden}
                  activeGenres={activeGenres}
                  onGenresChange={setActiveGenres}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  eventsCount={filteredEvents.length}
                />

                <>
                    <div
                      key={viewMode}
                      className={`mt-10 view-transition ${
                        viewMode === 'portrait'
                          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-stretch'
                          : 'grid grid-cols-1 lg:grid-cols-2 gap-4'
                      }`}
                    >
                      {dbEvents === null ? (
                        // Loading State (Skeleton)
                        Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="bg-noctvm-surface/40 rounded-2xl h-[320px] animate-pulse border border-white/5" />
                        ))
                      ) : (
                        filteredEvents.map((event, index) => (
                          <div key={`${event.source}-${index}`} className={`animate-fade-in-up hover-lift stagger-${Math.min(index + 1, 12)} h-full`}>
                            <EventCard 
                              event={event} 
                              variant={viewMode} 
                              onClick={openEvent} 
                              onSaveRequireAuth={() => setShowAuthModal(true)} 
                            />
                          </div>
                        ))
                      )}
                    </div>
                    {filteredEvents.length === 0 && (
                      <div className="text-center py-16 animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-noctvm-surface flex items-center justify-center mx-auto mb-4">
                          <MoonIcon className="w-8 h-8 text-noctvm-violet/50" />
                        </div>
                        <p className="text-noctvm-silver text-sm">No events found</p>
                        <p className="text-noctvm-silver/50 text-xs mt-1">Try adjusting your filters</p>
                      </div>
                    )}
                  </>
              </div>
            )}

            {/* ── Feed Tab ────────────────────────────────────── */}
            {activeTab === 'feed' && (
              <div className="tab-content">
                {user ? (
                  <FeedPage
                    onVenueClick={handleVenueClick}
                    onOpenCreatePost={() => setShowCreatePost(true)}
                    onOpenCreateStory={() => setShowCreateStory(true)}
                    onOpenStories={(users, index) => handleOpenStories(users, index)}
                    activeCity={activeCity}
                    initialPostId={initialPostId}
                  />
                ) : (
                  renderAuthGate('feed')
                )}
              </div>
            )}

            {/* ── Venues Tab ──────────────────────────────────── */}
            {activeTab === 'venues' && (
              <div className="tab-content">
                  <VenuesPage
                    onVenueClick={handleVenueClick}
                    activeCity={activeCity}
                    onCityChange={setActiveCity}
                    headerHidden={headerHidden}
                    activeGenre={activeGenreVenues}
                    onGenreChange={setActiveGenreVenues}
                    allGenres={GENRE_FILTERS}
                  />
              </div>
            )}
            {/* ── Pocket / Moonrays Tab ────────────────────────── */}
            {activeTab === 'pocket' && (
              <div key="pocket" className="animate-in fade-in duration-500">
                {user ? <PocketPage /> : renderAuthGate('pocket')}
              </div>
            )}

            {/* ── Profile Tab ─────────────────────────────────── */}
            {activeTab === 'profile' && (
              <>
                {/* Public profile route or owner profile */}
                {publicProfileLoading && publicProfileHandle && (
                  <div className="mx-auto flex min-h-[40vh] max-w-2xl items-center justify-center text-noctvm-silver">
                    Loading profile...
                  </div>
                )}

                {publicProfile && profileView === 'profile' && (
                  <UserProfilePage
                    targetProfile={publicProfile}
                    onOpenAuth={() => setShowAuthModal(true)}
                    onSettingsClick={handleSettingsClick}
                    onOpenActivityLog={() => setProfileView('activity-log')}
                    onEditProfileClick={() => {
                      setActiveTab('profile');
                      setProfileView('edit-profile' as ProfileView);
                    }}
                    onOpenCreatePost={() => setShowCreatePost(true)}
                    onOpenStories={(users, index) => handleOpenStories(users, index)}
                    onEventClick={(e) => openEvent(e)}
                    onManageVenue={(id) => setManagedVenueId(id)}
                  />
                )}

                {/* Public profile (Instagram-style) */}
                {!publicProfile && user && profileView === 'profile' && profile && (
                  <UserProfilePage
                    targetProfile={profile}
                    onOpenAuth={() => setShowAuthModal(true)}
                    onSettingsClick={handleSettingsClick}
                    onOpenActivityLog={() => setProfileView('activity-log')}
                    onEditProfileClick={() => {
                      setActiveTab('profile');
                      setProfileView('edit-profile' as ProfileView);
                    }}
                    onOpenCreatePost={() => setShowCreatePost(true)}
                    onOpenStories={(users, index) => handleOpenStories(users, index)}
                    onEventClick={(e) => openEvent(e)}
                    onManageVenue={(id) => setManagedVenueId(id)}
                  />
                )}

                {/* Profile Sub-pages (including Settings Hub) */}
                {canAccessProfileSubPages && isProfileSubPage && profileSubContent[profileView]}

                {!publicProfile && !user && renderAuthGate('profile')}

                {publicProfileHandle && !publicProfileLoading && !publicProfile && (
                  <div className="mx-auto flex min-h-[40vh] max-w-2xl items-center justify-center text-noctvm-silver">
                    Profile not found.
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Right panel */}
        {(activeTab === 'events' || activeTab === 'venues' || (activeTab === 'feed' && user)) && (
          <RightPanel 
            onVenueClick={openVenue} 
            onEventClick={openEvent} 
            activeCity={activeCity}
            activeTab={activeTab}
            activeGenres={activeTab === 'venues' ? [activeGenreVenues] : activeGenres}
          />
        )}

        {activeTab === 'profile' && profileView === 'profile' && user && canAccessProfileSubPages && (
          <ProfileSidebar 
            userId={user.id} 
            activeCity={activeCity}
          />
        )}

        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        <GlobalSearchSheet
          open={isGlobalSearchOpen}
          onOpenChange={setIsGlobalSearchOpen}
          onEventSelect={openEvent}
          onVenueSelect={openVenue}
          onUserSelect={(username) => {
            const cleanUsername = username.replace(/^@/, '').trim();
            if (!cleanUsername) return;
            router.push(`/@${cleanUsername}`);
          }}
          onActionSelect={handleSearchAction}
        />
        <NotificationsPanel 
          isOpen={isNotificationsOpen} 
          onClose={() => setIsNotificationsOpen(false)} 
        />
        

      </div>
    </>
  );
}

export default function Home() {
  return <AppShell />;
}
