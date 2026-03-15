'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import FilterBar from '@/components/FilterBar';
import EventCard from '@/components/EventCard';
import RightPanel from '@/components/RightPanel';
import VenuePage from '@/components/VenuePage';
import VenuesPage from '@/components/VenuesPage';
import FeedPage from '@/components/FeedPage';
import MobileTopSection from '@/components/MobileTopSection';
import UserProfilePage from '@/components/UserProfilePage';
import { ManageAccountPage, AddLocationPage, ClaimLocationPage, SettingsPage } from '@/components/ProfilePages';
import AuthModal from '@/components/AuthModal';
import EventDetailModal from '@/components/EventDetailModal';
import CreatePostModal from '@/components/CreatePostModal';
import CreateStoryModal from '@/components/CreateStoryModal';
import type { StoryUser } from '@/components/StoriesViewerModal';
import StoriesViewerModal from '@/components/StoriesViewerModal';
import { MoonIcon, UserIcon, TicketIcon, WalletIcon, StarIcon, CogIcon } from '@/components/icons';
import { SAMPLE_EVENTS } from '@/lib/events-data';
import { NoctEvent } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useLiquidGlass } from '@/hooks/useLiquidGlass';
import { useAuth } from '@/contexts/AuthContext';

type TabType = 'events' | 'feed' | 'venues' | 'wallet' | 'profile';

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
  | 'app-settings';

export default function Home() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [activeCity, setActiveCity] = useState<'bucuresti' | 'constanta'>('bucuresti');
  const [activeGenres, setActiveGenres] = useState<string[]>(['All']);
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
  const mainRef = useRef<HTMLElement>(null);
  const [headerHidden, setHeaderHidden] = useState(false);

  const handleOpenStories = useCallback((users: StoryUser[], index: number) => {
    setStoryUsers(users);
    setStoryStartIndex(index);
    setShowStories(true);
  }, []);

  useLiquidGlass();

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
      if (diff > 8 && y > 100) setHeaderHidden(true);
      else if (diff < -8) setHeaderHidden(false);
      lastY = y;
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

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
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'profile') setProfileView('profile');
  }, []);

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
        e.genres.some(g => activeGenres.some(ag => g.toLowerCase().includes(ag.toLowerCase())))
      );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.genres.some(g => g.toLowerCase().includes(q))
      );
    }
    if (selectedDate) {
      events = events.filter(e => e.date === selectedDate);
    }
    return events;
  }, [dbEvents, activeGenres, searchQuery, selectedDate, activeCity]);

  const handleVenueClick = useCallback((name: string) => setSelectedVenue(name), []);
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
    { label: 'Manage Account', desc: 'Edit profile, privacy settings', key: 'manage-account' as ProfileView, icon: <UserIcon className="w-5 h-5" /> },
    { label: 'Add Location', desc: 'Add a venue or event space', key: 'add-location' as ProfileView, icon: addLocationIcon },
    { label: 'Claim Location', desc: 'Claim ownership of a venue', key: 'claim-location' as ProfileView, icon: claimLocationIcon },
    { label: 'Settings', desc: 'App preferences and notifications', key: 'app-settings' as ProfileView, icon: <CogIcon className="w-5 h-5" /> },
  ];

  // ── Profile sub-page resolver ─────────────────────────────────────────────
  const backToMenu = () => setProfileView('account-menu');
  const profileSubContent: Record<string, React.ReactNode> = {
    'manage-account': <ManageAccountPage onBack={backToMenu} />,
    'add-location': <AddLocationPage onBack={backToMenu} />,
    'claim-location': <ClaimLocationPage onBack={backToMenu} />,
    'app-settings': <SettingsPage onBack={backToMenu} />,
  };

  const isProfileSubPage = ['manage-account', 'add-location', 'claim-location', 'app-settings'].includes(profileView);

  return (
    <>
      {/* ── Auth Modal ──────────────────────────────────────────── */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* ── Event Detail Modal ──────────────────────────────────── */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onVenueClick={(venueName) => { setSelectedEvent(null); handleVenueClick(venueName); }}
        onOpenAuth={() => setShowAuthModal(true)}
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
        <div className="fixed inset-0 z-[100] flex sm:items-center sm:justify-center p-0 sm:p-4 lg:p-8">
          <div className={`absolute inset-0 bg-black/70 backdrop-blur-md backdrop-enter ${venueClosing ? 'animate-fade-out' : ''}`} onClick={handleCloseVenue} />
          <div
            className={`relative w-full h-full sm:h-auto sm:max-h-[95vh] sm:w-[95%] lg:w-[90%] lg:h-[92%] sm:rounded-3xl bg-noctvm-midnight/80 overflow-hidden shadow-2xl shadow-black/80 flex flex-col ${
              venueClosing ? 'animate-scale-out' : 'animate-scale-in'
            } border-0 sm:border border-white/10 liquid-glass frosted-noise`}
            onAnimationEnd={() => { if (venueClosing) { setVenueClosing(false); setSelectedVenue(null); } }}
          >
            <VenuePage
              venueName={selectedVenue!}
              onBack={handleCloseVenue}
              onClose={handleCloseVenue}
              onEventClick={(e) => setSelectedEvent(e)}
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
          activeCity={activeCity}
        />

        <main ref={mainRef} className="flex-1 min-h-screen overflow-y-auto">
          {/* Mobile header */}
          <header className="lg:hidden sticky top-0 z-40 glass border-b border-noctvm-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MoonIcon className="w-6 h-6 text-noctvm-violet" />
                <span className="font-heading text-lg font-bold text-glow">NOCTVM</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald live-pulse"></span>
                <div className="relative">
                  <select
                    value={activeCity}
                    onChange={(e) => setActiveCity(e.target.value as 'bucuresti' | 'constanta')}
                    className="bg-transparent text-[10px] text-noctvm-silver font-mono capitalize focus:outline-none cursor-pointer appearance-none pr-4"
                  >
                    <option value="bucuresti">București</option>
                    <option value="constanta">Constanța</option>
                  </select>
                  <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-noctvm-silver pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
                <button
                  onClick={handleSettingsClick}
                  className="p-1.5 rounded-lg text-noctvm-silver hover:text-white hover:bg-noctvm-surface transition-colors"
                  title="Settings"
                >
                  <CogIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          <div className="w-full max-w-[1800px] mx-auto px-4 lg:px-8 py-6 pb-24 lg:pb-6">

            {/* ── Events Tab ──────────────────────────────────── */}
            {activeTab === 'events' && (
              <div className="tab-content">
                <MobileTopSection 
                  onVenueClick={handleVenueClick} 
                  activeCity={activeCity} 
                  activeGenres={activeGenres}
                  activeTab={activeTab}
                  headerHidden={headerHidden}
                />

                {/* Sticky auto-hide header */}
                <div className={`sticky top-12 lg:top-0 z-20 transition-transform duration-300 ease-in-out mb-5 ${headerHidden ? '-translate-y-[200%]' : ''}`}>
                  <div className="frosted-noise bg-noctvm-black/70 backdrop-blur-3xl rounded-2xl border border-noctvm-violet/15 p-4 shadow-xl">
                    {/* Desktop: Title + city */}
                    <div className="hidden lg:flex items-center justify-between mb-4">
                      <div>
                        <h1 className="font-heading text-2xl font-bold text-white">Events</h1>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-noctvm-silver">Nightlife in</span>
                          <div className="relative">
                            <select
                              value={activeCity}
                              onChange={(e) => setActiveCity(e.target.value as 'bucuresti' | 'constanta')}
                              className="bg-noctvm-surface border border-noctvm-border rounded-lg px-3 py-1 text-sm text-white font-medium focus:outline-none focus:border-noctvm-violet/50 cursor-pointer pr-7 appearance-none"
                            >
                              <option value="bucuresti">București</option>
                              <option value="constanta">Constanța</option>
                            </select>
                            <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-noctvm-silver pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    <FilterBar
                      activeGenres={activeGenres}
                      onGenreChange={setActiveGenres}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                      selectedDate={selectedDate}
                      onDateChange={setSelectedDate}
                    />
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-noctvm-silver font-mono">{filteredEvents.length} events</span>
                    </div>
                  </div>
                </div>

                <>
                    <div
                      key={viewMode}
                      className={`view-transition ${
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
                              onClick={(e: NoctEvent) => setSelectedEvent(e)} 
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
                />
              </div>
            )}

            {/* ── Wallet / Moonrays Tab ────────────────────────── */}
            {activeTab === 'wallet' && (
              <div className="space-y-6 max-w-2xl mx-auto tab-content">
                <div className="text-center py-4 animate-fade-in-up">
                  <h2 className="font-heading text-xl font-bold text-white">Moonrays</h2>
                  <p className="text-sm text-noctvm-silver mt-1">Your nightlife loyalty points</p>
                </div>

                {/* Balance card */}
                <div className="bg-gradient-to-br from-noctvm-violet/30 via-noctvm-midnight to-purple-900/30 rounded-2xl p-6 border border-noctvm-violet/40 animate-fade-in-up stagger-2 relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 text-8xl opacity-5 select-none pointer-events-none">🌙</div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Total Moonrays</span>
                    <span className="px-2 py-0.5 rounded-full bg-noctvm-violet/20 text-noctvm-violet text-[10px] font-medium border border-noctvm-violet/30">
                      {user ? 'Active' : 'Sign in to earn'}
                    </span>
                  </div>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-4xl font-heading font-bold text-white">{user ? '500' : '0'}</span>
                    <span className="text-2xl mb-0.5">🌙</span>
                  </div>
                  <p className="text-xs text-noctvm-silver/60">{user ? 'Welcome bonus applied ✨' : 'Create an account to start earning'}</p>
                </div>

                {/* How to earn */}
                <div className="bg-noctvm-surface rounded-xl border border-noctvm-border p-5 animate-fade-in-up stagger-3">
                  <h3 className="font-heading text-sm font-semibold text-white mb-4">How to Earn Moonrays</h3>
                  <div className="space-y-3">
                    {[
                      { icon: '🌙', action: 'Create your account',  points: '+500', desc: 'Welcome bonus, one-time' },
                      { icon: '📸', action: 'Share a post',         points: '+10',  desc: 'Per post published' },
                      { icon: '🎭', action: 'Add a story',          points: '+5',   desc: 'Per 24h story' },
                      { icon: '💬', action: 'Leave a comment',      points: '+2',   desc: 'Per comment' },
                      { icon: '⭐', action: 'Review a venue',       points: '+25',  desc: 'Per verified review' },
                      { icon: '🎟️', action: 'Attend an event',     points: '+50',  desc: 'Scan ticket at the door' },
                      { icon: '👥', action: 'Invite a friend',      points: '+100', desc: 'When they sign up' },
                    ].map(item => (
                      <div key={item.action} className="flex items-center gap-3">
                        <span className="text-lg w-8 text-center flex-shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium leading-tight">{item.action}</p>
                          <p className="text-[10px] text-noctvm-silver/60">{item.desc}</p>
                        </div>
                        <span className="text-sm font-bold text-noctvm-violet font-mono flex-shrink-0">{item.points}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent activity (logged in only) */}
                {user && (
                  <div className="bg-noctvm-surface rounded-xl border border-noctvm-border p-5 animate-fade-in-up stagger-4">
                    <h3 className="font-heading text-sm font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-noctvm-violet/20 flex items-center justify-center text-base flex-shrink-0">🌙</div>
                      <div className="flex-1">
                        <p className="text-xs text-white">Welcome bonus</p>
                        <p className="text-[10px] text-noctvm-silver/50">Account created</p>
                      </div>
                      <span className="text-sm font-bold text-noctvm-violet font-mono">+500</span>
                    </div>
                  </div>
                )}

                {/* Coming-soon redemption cards */}
                <div className="grid grid-cols-2 gap-3 animate-fade-in-up stagger-5">
                  {[
                    { icon: <TicketIcon className="w-5 h-5 text-noctvm-violet" />, title: 'Redeem Tickets',  desc: 'Use Moonrays for event entry' },
                    { icon: <StarIcon   className="w-5 h-5 text-noctvm-gold"   />, title: 'VIP Perks',       desc: 'Unlock exclusive venue benefits' },
                  ].map(item => (
                    <div key={item.title} className="bg-noctvm-surface rounded-xl p-4 border border-noctvm-border relative overflow-hidden">
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-noctvm-violet/10 border border-noctvm-violet/20">
                        <span className="text-[8px] font-mono text-noctvm-violet uppercase tracking-wider">Soon</span>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-noctvm-midnight flex items-center justify-center mb-2">{item.icon}</div>
                      <h3 className="font-heading text-xs font-semibold text-white mb-0.5">{item.title}</h3>
                      <p className="text-[10px] text-noctvm-silver/70">{item.desc}</p>
                    </div>
                  ))}
                </div>
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
                    onOpenCreatePost={() => setShowCreatePost(true)}
                    onOpenStories={(users, index) => handleOpenStories(users, index)}
                    onEventClick={(e) => setSelectedEvent(e)}
                  />
                )}

                {/* Account menu (old profile menu, now behind the cogwheel) */}
                {profileView === 'account-menu' && (
                  <div className="space-y-6 max-w-lg mx-auto tab-content">
                    {/* Header with back button */}
                    <div className="flex items-center gap-3 animate-fade-in">
                      <button
                        onClick={() => {
                          if (previousTab === 'profile') {
                            setProfileView('profile');
                          } else {
                            setActiveTab(previousTab);
                            setProfileView('profile');
                          }
                        }}
                        className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-noctvm-silver hover:text-white hover:bg-black/80 transition-all"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <h2 className="font-heading text-lg font-bold text-white">Settings</h2>
                    </div>

                    {/* Avatar + name summary */}
                    {user && (
                      <div className="flex items-center gap-3 p-4 bg-noctvm-surface rounded-xl border border-noctvm-border animate-fade-in-up">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-400 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {profile?.avatar_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-white">
                              {(profile?.display_name || 'N')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{profile?.display_name || 'Night Owl'}</p>
                          <p className="text-xs text-noctvm-silver">@{profile?.username || 'nightowl'}</p>
                        </div>
                      </div>
                    )}

                    {/* Menu items */}
                    <div className="space-y-2 animate-fade-in-up stagger-3">
                      {accountMenuItems.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => setProfileView(item.key)}
                          className="w-full flex items-center gap-3 p-4 bg-noctvm-surface rounded-xl border border-noctvm-border hover:border-noctvm-violet/30 transition-colors text-left group hover-lift"
                        >
                          <div className="w-10 h-10 rounded-lg bg-noctvm-midnight flex items-center justify-center text-noctvm-silver group-hover:text-noctvm-violet transition-colors">
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{item.label}</p>
                            <p className="text-[11px] text-noctvm-silver">{item.desc}</p>
                          </div>
                          <svg className="w-4 h-4 text-noctvm-silver/40 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                        </button>
                      ))}
                    </div>

                    {user && (
                      <button
                        onClick={() => { signOut(); setProfileView('profile'); }}
                        className="w-full mt-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors text-red-400 text-sm font-medium animate-fade-in-up stagger-4"
                      >
                        Log Out
                      </button>
                    )}
                  </div>
                )}

                {/* Sub-pages (manage account, add location, etc.) */}
                {isProfileSubPage && profileSubContent[profileView]}
              </>
            )}
          </div>
        </main>

        {/* Right panel */}
        {(activeTab === 'events' || activeTab === 'feed' || activeTab === 'venues') && (
          <RightPanel 
            onVenueClick={handleVenueClick} 
            onEventClick={(e: NoctEvent) => setSelectedEvent(e)} 
            activeCity={activeCity}
            activeTab={activeTab}
            activeGenres={activeTab === 'venues' ? [activeGenreVenues] : activeGenres}
          />
        )}

        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </>
  );
}
