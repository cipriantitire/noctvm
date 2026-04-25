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
import AppBackdrop from '@/components/AppBackdrop';
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
import { useEventSaveStates } from '@/hooks/useEventSaveStates';
import { useProgressiveEvents } from '@/hooks/useProgressiveEvents';
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

type EventOpenSource = 'default' | 'profile-saved-events';

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
  const [editProfileOrigin, setEditProfileOrigin] = useState<'profile' | 'settings'>('profile');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<NoctEvent | null>(null);
  const [eventOpenSource, setEventOpenSource] = useState<EventOpenSource>('default');
  const [pendingSavedEventsReopen, setPendingSavedEventsReopen] = useState(false);
  const [reopenProfileSavedEventsSignal, setReopenProfileSavedEventsSignal] = useState(0);
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
  const eventLoadMoreRef = useRef<HTMLDivElement>(null);
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

  const backdropMode = activeTab === 'events' || activeTab === 'venues' ? 'rich' : 'faded';
  const backdropPaused = Boolean(
    selectedEvent ||
    selectedVenue ||
    venueClosing ||
    showAuthModal ||
    showCreatePost ||
    showCreateStory ||
    showStories ||
    isGlobalSearchOpen ||
    managedVenueId,
  );

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
      
      // Delay hide until the first venue card reaches the top of the scroll area.
      const threshold = (() => {
        if (activeTab !== 'venues') return 600;

        const firstVenueCard = el.querySelector<HTMLElement>('[data-venue-card="first"]');
        if (!firstVenueCard) return 520;

        const containerRect = el.getBoundingClientRect();
        const cardRect = firstVenueCard.getBoundingClientRect();
        return Math.max(cardRect.top - containerRect.top + y, 0);
      })();
      
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

  const openProfileSettingsView = useCallback((view: ProfileView, options?: { editOrigin?: 'profile' | 'settings' }) => {
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

    if (view === 'edit-profile') {
      setEditProfileOrigin(options?.editOrigin ?? 'settings');
    }

    setProfileView(view);
  }, [activeTab, syncHistory, user]);

  // Switch to profile tab and show the account menu
  const handleSettingsClick = useCallback(() => {
    openProfileSettingsView('account-menu');
  }, [openProfileSettingsView]);

  const closeProfileSettingsView = useCallback(() => {
    setActiveTab(previousTab);
    setProfileView('profile');
    setSelectedEvent(null);
    setPendingEventId(null);
    setSelectedVenue(null);
    setVenueClosing(false);
    setInitialPostId(null);
    syncHistory({ tab: previousTab, eventId: null, venueName: null, postId: null }, 'replace');
  }, [previousTab, syncHistory]);

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
        openProfileSettingsView('edit-profile', { editOrigin: 'settings' });
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
    setPendingSavedEventsReopen(false);
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

  const openEventWithSource = useCallback((event: NoctEvent | null, source: EventOpenSource = 'default') => {
    if (event) {
      setEventOpenSource(source);
    }
    openEvent(event);
  }, [openEvent]);

  useEffect(() => {
    if (!selectedEvent && pendingSavedEventsReopen) {
      setReopenProfileSavedEventsSignal((previous) => previous + 1);
      setPendingSavedEventsReopen(false);
    }
  }, [selectedEvent, pendingSavedEventsReopen]);

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

  const eventBatchSize = 20;
  const {
    visibleEvents,
    hasMore: hasMoreEvents,
    showMore: showMoreEvents,
  } = useProgressiveEvents(filteredEvents, eventBatchSize);
  const { saveStates, handleSaveStateChange } = useEventSaveStates(visibleEvents, user?.id);

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
    'account-menu':    <SettingsPage onBack={closeProfileSettingsView} />,
    'edit-profile':    (
      <SettingsPage
        onBack={closeProfileSettingsView}
        initialView="edit"
        editProfileOrigin={editProfileOrigin}
        onEditProfileBack={() => setProfileView('profile')}
      />
    ),
    'account':         <SettingsPage onBack={closeProfileSettingsView} initialView="account" />,
    'manage-account':  <SettingsPage onBack={closeProfileSettingsView} initialView="privacy" />,
    'privacy':         <SettingsPage onBack={closeProfileSettingsView} initialView="privacy" />,
    'notifications':   <SettingsPage onBack={closeProfileSettingsView} initialView="notifications" />,
    'appearance':      <SettingsPage onBack={closeProfileSettingsView} initialView="appearance" />,
    'blocked_muted':   <SettingsPage onBack={closeProfileSettingsView} initialView="blocked_muted" />,
    'inventory':       <SettingsPage onBack={closeProfileSettingsView} initialView="inventory" />,
    'add-location':    <SettingsPage onBack={closeProfileSettingsView} initialView="add_location" />,
    'claim-location':  <SettingsPage onBack={closeProfileSettingsView} initialView="claim_location" />,
    'app-settings':    <SettingsPage onBack={closeProfileSettingsView} initialView="notifications" />,
    'activity-log':    <ActivityLogPage onBack={closeProfileSettingsView} />,
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
        <h2 className="mt-3 font-heading text-3xl font-black text-foreground sm:text-4xl">{gate.subtitle}</h2>
        <p className="mt-4 max-w-lg text-sm leading-6 text-noctvm-silver">{gate.body}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="rounded-full bg-noctvm-violet px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-noctvm-violet/90"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAuthModal(false);
              handleTabChange('events');
            }}
            className="rounded-full border border-noctvm-border bg-noctvm-surface px-6 py-3 text-sm font-semibold text-noctvm-silver transition-colors hover:text-foreground hover:bg-white/5"
          >
            Browse Events
          </button>
        </div>
      </section>
    );
  };

  return (
    <>
      <AppBackdrop mode={backdropMode} paused={backdropPaused} />

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
          const shouldReopenSavedEvents = eventOpenSource === 'profile-saved-events';
          if (shouldReopenSavedEvents) {
            setPendingSavedEventsReopen(true);
          }
          setEventOpenSource('default');
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
          setEventOpenSource('default');
          openVenue(venueName);
        }}
        onOpenAuth={() => setShowAuthModal(true)}
        zIndex={eventZIndex}
      />

      {/* ── Create Post Modal ───────────────────────────────────── */}
      <CreatePostModal isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} onPostCreated={() => {}} onOpenAuth={() => setShowAuthModal(true)} activeCity={activeCity} />

      {/* ── Create Story Modal ──────────────────────────────────── */}
      <CreateStoryModal isOpen={showCreateStory} onClose={() => setShowCreateStory(false)} onOpenAuth={() => setShowAuthModal(true)} />

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
          className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 xl:right-[22rem] z-40 w-14 h-14 rounded-full border border-noctvm-black/70 ring-1 ring-white/20 bg-[linear-gradient(155deg,rgba(104,44,206,0.96),rgba(58,22,146,0.90))] text-foreground shadow-[0_6px_12px_rgba(5,5,5,0.45),inset_0_1px_0_rgba(255,255,255,0.30)] flex items-center justify-center hover:scale-105 hover:brightness-105 active:scale-[0.96] transition-all duration-200"
          title="Add Post"
        >
          <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* ── Venue Overlay ───────────────────────────────────────── */}
      {(selectedVenue || venueClosing) && (
        <div 
          className={`fixed inset-0 flex sm:items-center sm:justify-center p-0 sm:p-4 lg:p-8 ${venueZIndex >= eventZIndex ? 'z-[210]' : 'z-[200]'}`}
        >
          <div className={`absolute inset-0 bg-noctvm-black/70 backdrop-blur-md backdrop-enter ${venueClosing ? 'animate-fade-out' : ''}`} onClick={handleCloseVenue} />
          <div
            className={`relative w-full h-full sm:h-auto sm:max-h-[95vh] sm:w-[95%] lg:w-[90%] lg:h-[92%] sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col min-h-0 ${
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
      <div className="flex h-screen bg-transparent overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSearchClick={() => setIsGlobalSearchOpen(true)}
          onSettingsClick={handleSettingsClick}
          onNotificationsClick={() => setIsNotificationsOpen(true)}
          activeCity={activeCity}
        />

        <main ref={mainRef} className={`flex-1 min-h-screen ${isProfileSettingsView ? 'overflow-hidden' : 'overflow-y-auto mobile-scrollbar-hide'}`}>
          {/* Mobile header */}
          <header
            className="lg:hidden sticky top-0 z-40 liquid-glass-card liquid-glass-nav cursor-default overflow-hidden rounded-b-[36px] border-x border-b border-t-0 px-4 py-3"
            style={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'rgba(5, 6, 10, 0.64)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderTopWidth: 0,
              boxShadow: '0 18px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_50%_0%,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_20%,rgba(255,255,255,0)_60%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.015)_18%,rgba(0,0,0,0.18)_100%)] pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
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

              {/* Right: Actions */}
              <div className="flex items-center gap-2.5 justify-end flex-shrink-0">
                {(isAdmin || isOwner) && (
                  <Link
                    href="/dashboard"
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-noctvm-silver/70 hover:text-foreground hover:bg-noctvm-violet/20 hover:border-noctvm-violet/30 transition-all flex items-center justify-center flex-shrink-0"
                    title="Dashboard"
                  >
                    <GridIcon className="w-4 h-4" />
                  </Link>
                )}
                <button
                  onClick={() => setIsGlobalSearchOpen(true)}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-noctvm-silver/70 hover:text-foreground hover:bg-noctvm-violet/20 hover:border-noctvm-violet/30 transition-all flex items-center justify-center flex-shrink-0"
                  title="Search"
                >
                  <SearchIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsNotificationsOpen(true)}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-noctvm-silver/70 hover:text-foreground hover:bg-noctvm-violet/20 hover:border-noctvm-violet/30 transition-all flex items-center justify-center relative flex-shrink-0"
                  title="Notifications"
                >
                  <BellIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSettingsClick}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-noctvm-silver/70 hover:text-foreground hover:bg-noctvm-violet/20 hover:border-noctvm-violet/30 transition-all flex items-center justify-center flex-shrink-0"
                  title="Settings"
                >
                  <CogIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          <div className={`w-full h-full max-w-[1800px] mx-auto px-4 lg:px-8 py-4 lg:py-6 pb-24 lg:pb-6 ${isProfileSettingsView ? 'overflow-hidden' : ''}`}>

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

                <div className="pb-20 sm:pb-24 lg:pb-0">
                    <div
                      key={viewMode}
                      className={`mt-0 view-transition ${
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
                        visibleEvents.map((event, index) => (
                          <div key={`${event.source}-${event.id}`} className={`animate-fade-in-up hover-lift stagger-${Math.min(index + 1, 12)} h-full`}>
                            <EventCard 
                              event={event} 
                              variant={viewMode} 
                              onClick={openEvent} 
                              onSaveRequireAuth={() => setShowAuthModal(true)} 
                              saveState={saveStates[event.id] ?? { isSaved: false, saveCount: event.save_count ?? 0 }}
                              onSaveStateChange={handleSaveStateChange}
                            />
                          </div>
                        ))
                      )}
                    </div>
                    {dbEvents !== null && hasMoreEvents && (
                      <div ref={eventLoadMoreRef} className="flex justify-center py-8">
                        <button
                          type="button"
                          onClick={showMoreEvents}
                          className="rounded-lg border border-white/10 bg-noctvm-surface/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-noctvm-silver transition-colors hover:border-white/20 hover:text-foreground"
                        >
                          Load more events
                        </button>
                      </div>
                    )}
                    {filteredEvents.length === 0 && (
                      <div className="text-center py-16 animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-noctvm-surface flex items-center justify-center mx-auto mb-4">
                          <MoonIcon className="w-8 h-8 text-noctvm-violet/50" />
                        </div>
                        <p className="text-noctvm-silver text-sm">No events found</p>
                        <p className="text-noctvm-silver/50 text-xs mt-1">Try adjusting your filters</p>
                      </div>
                    )}
                  </div>
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
                    onOpenCreateStory={() => setShowCreateStory(true)}
                    onOpenActivityLog={() => setProfileView('activity-log')}
                    onEditProfileClick={() => openProfileSettingsView('edit-profile', { editOrigin: 'profile' })}
                    onOpenCreatePost={() => setShowCreatePost(true)}
                    onOpenStories={(users, index) => handleOpenStories(users, index)}
                    onEventClick={(e, source) => openEventWithSource(e, source ?? 'default')}
                    reopenSavedEventsSignal={reopenProfileSavedEventsSignal}
                    onManageVenue={(id) => setManagedVenueId(id)}
                  />
                )}

                {/* Public profile (Instagram-style) */}
                {!publicProfile && user && profileView === 'profile' && profile && (
                  <UserProfilePage
                    targetProfile={profile}
                    onOpenAuth={() => setShowAuthModal(true)}
                    onSettingsClick={handleSettingsClick}
                    onOpenCreateStory={() => setShowCreateStory(true)}
                    onOpenActivityLog={() => setProfileView('activity-log')}
                    onEditProfileClick={() => openProfileSettingsView('edit-profile', { editOrigin: 'profile' })}
                    onOpenCreatePost={() => setShowCreatePost(true)}
                    onOpenStories={(users, index) => handleOpenStories(users, index)}
                    onEventClick={(e, source) => openEventWithSource(e, source ?? 'default')}
                    reopenSavedEventsSignal={reopenProfileSavedEventsSignal}
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

        {!isGlobalSearchOpen && (
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        )}
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
