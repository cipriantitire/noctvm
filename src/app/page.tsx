'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import FilterBar, { GENRE_FILTERS } from '@/components/FilterBar';
import Link from 'next/link';
import EventCard from '@/components/EventCard';
import RightPanel from '@/components/RightPanel';
import VenueModal from '@/components/VenueModal';
import VenuesPage from '@/components/VenuesPage';
import FeedPage from '@/components/FeedPage';
import MobileTopSection from '@/components/MobileTopSection';
import UserProfilePage from '@/components/UserProfilePage';
import SearchBar from '@/components/SearchBar';
import { SettingsPage } from '@/components/ProfilePages';
import ProfileSidebar from '@/components/ProfileSidebar';
import AuthModal from '@/components/AuthModal';
import EventModal from '@/components/EventModal';
import CreatePostModal from '@/components/CreatePostModal';
import CreateStoryModal from '@/components/CreateStoryModal';
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
  | 'manage-account'
  | 'add-location'
  | 'claim-location'
  | 'app-settings'
  | 'edit-profile'
  | 'inventory';

export default function Home() {
  const { user, profile, signOut, isAdmin, isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [activeCity, setActiveCity] = useState<'bucuresti' | 'constanta'>('bucuresti');
  const [activeGenres, setActiveGenres] = useState<string[]>(['All']);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
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

  useEffect(() => {
    setIsClient(true);
    // Deep linking support for tabs (e.g. ?tab=pocket)
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['events', 'feed', 'venues', 'pocket', 'profile'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

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
    if (selectedVenue || selectedEvent || showAuthModal || showCreatePost || showCreateStory || showStories) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedVenue, selectedEvent, showAuthModal, showCreatePost, showCreateStory, showStories]);

  // Switch to profile tab and show the account menu
  const handleSettingsClick = useCallback(() => {
    setPreviousTab(activeTab);
    setActiveTab('profile');
    setProfileView('account-menu');
  }, [activeTab]);

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
    setActiveTab(tab);
    if (tab === 'profile') setProfileView('profile');
  }, []);

  // Modal Z-Index Management (whichever open last on top)
  const [eventZIndex, setEventZIndex] = useState(200);
  const [venueZIndex, setVenueZIndex] = useState(100);
  const [maxZIndex, setMaxZIndex] = useState(200);

  const openVenue = useCallback((venue: string | null) => {
    if (venue) {
      const newZ = maxZIndex + 1;
      setVenueZIndex(newZ);
      setMaxZIndex(newZ);
    }
    setSelectedVenue(venue);
  }, [maxZIndex]);

  const openEvent = useCallback((event: NoctEvent | null) => {
    if (event) {
      const newZ = maxZIndex + 1;
      setEventZIndex(newZ);
      setMaxZIndex(newZ);
    }
    setSelectedEvent(event);
  }, [maxZIndex]);

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
    'manage-account':  <SettingsPage onBack={() => setProfileView('profile')} initialView="privacy" />,
    'inventory':       <SettingsPage onBack={() => setProfileView('profile')} initialView="inventory" />,
    'add-location':    <SettingsPage onBack={() => setProfileView('profile')} initialView="add_location" />,
    'claim-location':  <SettingsPage onBack={() => setProfileView('profile')} initialView="claim_location" />,
    'app-settings':    <SettingsPage onBack={() => setProfileView('profile')} initialView="notifications" />,
  };

  const isProfileSubPage = [
    'account-menu',
    'edit-profile',
    'manage-account',
    'inventory',
    'add-location',
    'claim-location',
    'app-settings'
  ].includes(profileView);

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
        onClose={() => openEvent(null)}
        onVenueClick={(venueName) => { openEvent(null); openVenue(venueName); }}
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
      {activeTab === 'feed' && (
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
          className="fixed inset-0 flex sm:items-center sm:justify-center p-0 sm:p-4 lg:p-8"
          style={{ zIndex: venueZIndex }}
        >
          <div className={`absolute inset-0 bg-black/70 backdrop-blur-md backdrop-enter ${venueClosing ? 'animate-fade-out' : ''}`} onClick={handleCloseVenue} />
          <div
            className={`relative w-full h-full sm:h-auto sm:max-h-[95vh] sm:w-[95%] lg:w-[90%] lg:h-[92%] sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col ${
              venueClosing ? 'animate-scale-out' : 'animate-scale-in'
            } border-0 sm:border border-white/10 frosted-glass-modal frosted-noise`}
            onAnimationEnd={() => { if (venueClosing) { setVenueClosing(false); setSelectedVenue(null); } }}
          >
            <VenueModal
              venueName={selectedVenue!}
              onBack={() => openVenue(null)}
              onClose={() => openVenue(null)}
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
          onSettingsClick={handleSettingsClick}
          onNotificationsClick={() => setIsNotificationsOpen(true)}
          activeCity={activeCity}
        />

        <main ref={mainRef} className="flex-1 min-h-screen overflow-y-auto">
          {/* Mobile header */}
          <header className="lg:hidden sticky top-0 z-40 glass border-b border-noctvm-border px-4 py-3">
            <div className="grid grid-cols-3 items-center">
              {/* Left: Logo */}
              <div className="flex items-center gap-2">
                <MoonIcon className="w-6 h-6 text-noctvm-violet" />
                <span className="font-heading text-lg font-bold text-glow">NOCTVM</span>
              </div>
              
              {/* Middle: City Selector */}
              <div className="flex justify-center">
                <div className="flex items-center gap-1.5 opacity-80">
                  <div className="relative">
                    <select
                      value={activeCity}
                      onChange={(e) => setActiveCity(e.target.value as 'bucuresti' | 'constanta')}
                      className="bg-transparent text-noctvm-label text-noctvm-silver font-mono capitalize focus:outline-none cursor-pointer appearance-none pr-4"
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

          <div className="w-full h-full max-w-[1800px] mx-auto px-4 lg:px-8 py-6 pb-24 lg:pb-6">

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
                <FeedPage
                  onVenueClick={handleVenueClick}
                  onOpenCreatePost={() => setShowCreatePost(true)}
                  onOpenCreateStory={() => setShowCreateStory(true)}
                  onOpenStories={(users, index) => handleOpenStories(users, index)}
                  activeCity={activeCity}
                />
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
                <PocketPage />
              </div>
            )}

            {/* ── Profile Tab ─────────────────────────────────── */}
            {activeTab === 'profile' && (
              <>
                {/* Public profile (Instagram-style) */}
                {profileView === 'profile' && (
                  <UserProfilePage
                    onOpenAuth={() => setShowAuthModal(true)}
                    onSettingsClick={handleSettingsClick}
                    onEditProfileClick={() => {
                      setActiveTab('profile');
                      setProfileView('edit-profile' as ProfileView);
                    }}
                    onOpenCreatePost={() => setShowCreatePost(true)}
                    onOpenStories={(users, index) => handleOpenStories(users, index)}
                    onEventClick={(e) => setSelectedEvent(e)}
                    onManageVenue={(id) => setManagedVenueId(id)}
                  />
                )}

                {/* Profile Sub-pages (including Settings Hub) */}
                {isProfileSubPage && profileSubContent[profileView]}
              </>
            )}
          </div>
        </main>

        {/* Right panel */}
        {(activeTab === 'events' || activeTab === 'feed' || activeTab === 'venues') && (
          <RightPanel 
            onVenueClick={openVenue} 
            onEventClick={openEvent} 
            activeCity={activeCity}
            activeTab={activeTab}
            activeGenres={activeTab === 'venues' ? [activeGenreVenues] : activeGenres}
          />
        )}

        {activeTab === 'profile' && profileView === 'profile' && user && (
          <ProfileSidebar 
            userId={user.id} 
            activeCity={activeCity}
          />
        )}

        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        <NotificationsPanel 
          isOpen={isNotificationsOpen} 
          onClose={() => setIsNotificationsOpen(false)} 
        />
        
        {/* Temporary Dev Shortcut to Design System for Visual Editor */}
        <Link 
          href="/design-system" 
          className="fixed bottom-24 left-6 z-50 px-4 py-2 bg-noctvm-violet text-white text-sm font-bold rounded-full shadow-lg border border-white/20 hover:scale-105 transition-transform"
        >
          🎨 Design System
        </Link>
      </div>
    </>
  );
}
