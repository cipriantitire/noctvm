'use client';

import { useState, useMemo, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import FilterBar from '@/components/FilterBar';
import EventCard from '@/components/EventCard';
import RightPanel from '@/components/RightPanel';
import VenuePage from '@/components/VenuePage';
import FeedPage from '@/components/FeedPage';
import MobileTopSection from '@/components/MobileTopSection';
import { ManageAccountPage, AddLocationPage, ClaimLocationPage, SettingsPage } from '@/components/ProfilePages';
import { MoonIcon, UserIcon, TicketIcon, WalletIcon, StarIcon } from '@/components/icons';
import { SAMPLE_EVENTS } from '@/lib/events-data';
import { useLiquidGlass } from '@/hooks/useLiquidGlass';

type TabType = 'events' | 'feed' | 'wallet' | 'profile';
type ProfileSubPage = null | 'manage-account' | 'add-location' | 'claim-location' | 'settings';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [activeGenres, setActiveGenres] = useState<string[]>(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'portrait' | 'landscape'>('landscape');
  const [profileSubPage, setProfileSubPage] = useState<ProfileSubPage>(null);

  // Activate mouse-reactive liquid glass shimmer on desktop
  useLiquidGlass();

  // Default to landscape (rows) on mobile, portrait (grid) on desktop
  useEffect(() => {
    if (window.innerWidth >= 1024) setViewMode('portrait');
  }, []);

  const filteredEvents = useMemo(() => {
    let events = SAMPLE_EVENTS;
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
    return events;
  }, [activeGenres, searchQuery]);

  const handleVenueClick = (name: string) => {
    setSelectedVenue(name);
  };

  const handleCloseVenue = () => {
    setSelectedVenue(null);
  };

  // Profile sub-page content
  const profileSubContent = profileSubPage ? {
    'manage-account': <ManageAccountPage onBack={() => setProfileSubPage(null)} />,
    'add-location': <AddLocationPage onBack={() => setProfileSubPage(null)} />,
    'claim-location': <ClaimLocationPage onBack={() => setProfileSubPage(null)} />,
    'settings': <SettingsPage onBack={() => setProfileSubPage(null)} />,
  }[profileSubPage] : null;

  return (
    <>
      {/* ===== VENUE OVERLAY MODAL ===== */}
      {selectedVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 lg:p-8">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md backdrop-enter"
            onClick={handleCloseVenue}
          />
          {/* Modal window - liquid glass + scale entrance */}
          <div className="relative w-full h-full sm:w-[95%] sm:h-[95%] lg:w-[90%] lg:h-[92%] sm:rounded-2xl liquid-glass overflow-hidden shadow-2xl shadow-black/50 flex flex-col animate-scale-in">
            {/* Close button */}
            <button
              onClick={handleCloseVenue}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-noctvm-surface/80 backdrop-blur-sm border border-noctvm-border flex items-center justify-center text-noctvm-silver hover:text-white hover:bg-noctvm-surface transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            {/* VenuePage content inside modal */}
            <VenuePage
              venueName={selectedVenue}
              onBack={handleCloseVenue}
              onClose={handleCloseVenue}
            />
          </div>
        </div>
      )}

      {/* ===== MAIN LAYOUT ===== */}
      {/* h-screen + overflow-hidden on outer = body never scrolls, only main scrolls */}
      <div className="flex h-screen bg-noctvm-black overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={(t) => { setActiveTab(t); setProfileSubPage(null); }} />

        <main className="flex-1 min-h-screen overflow-y-auto">
          {/* Mobile header */}
          <header className="lg:hidden sticky top-0 z-40 glass border-b border-noctvm-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MoonIcon className="w-6 h-6 text-noctvm-violet" />
                <span className="font-heading text-lg font-bold text-glow">NOCTVM</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald live-pulse"></span>
                <span className="text-[10px] text-noctvm-silver font-mono">Bucharest</span>
              </div>
            </div>
          </header>

          <div className="w-full max-w-[1800px] mx-auto px-4 lg:px-8 py-6 pb-24 lg:pb-6">
            {/* ===== EVENTS TAB ===== */}
            {activeTab === 'events' && !profileSubContent && (
              <div className="tab-content">
                {/* Mobile top section: map + live tonight + trending venues */}
                <MobileTopSection onVenueClick={handleVenueClick} />

                {/* Desktop title */}
                <div className="hidden lg:flex items-center justify-between mb-6 animate-fade-in">
                  <div>
                    <h1 className="font-heading text-2xl font-bold text-white">Explore</h1>
                    <p className="text-sm text-noctvm-silver mt-1">Discover what&apos;s happening in Bucharest tonight</p>
                  </div>
                </div>

                {/* Filters */}
                {/* Filters + Search + View Toggle */}
                <FilterBar
                  activeGenres={activeGenres}
                  onGenreChange={setActiveGenres}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

                {/* Event count */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-noctvm-silver font-mono">{filteredEvents.length} events</span>
                </div>

                <div
                  key={viewMode}
                  className={`view-transition ${
                    viewMode === 'portrait'
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                      : "grid grid-cols-1 lg:grid-cols-2 gap-4"
                  }`}
                >
                  {filteredEvents.map((event, index) => (
                    <div key={`${event.source}-${index}`} className={`animate-fade-in-up hover-lift stagger-${Math.min(index + 1, 12)}`}>
                      <EventCard event={event} variant={viewMode} />
                    </div>
                  ))}
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
              </div>
            )}

            {/* ===== FEED TAB ===== */}
            {activeTab === 'feed' && !profileSubContent && (
              <div className="tab-content">
                <FeedPage onVenueClick={handleVenueClick} />
              </div>
            )}

            {/* ===== WALLET TAB ===== */}
            {activeTab === 'wallet' && !profileSubContent && (
              <div className="space-y-6 max-w-2xl mx-auto tab-content">
                <div className="text-center py-4 animate-fade-in-up">
                  <h2 className="font-heading text-xl font-bold text-white">Wallet</h2>
                  <p className="text-sm text-noctvm-silver mt-1">Your digital nightlife wallet</p>
                </div>

                {/* Balance Card */}
                <div className="bg-gradient-to-br from-noctvm-violet/20 via-noctvm-midnight to-purple-900/20 rounded-2xl p-6 border border-noctvm-violet/30 animate-fade-in-up stagger-2">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Total Balance</span>
                    <span className="px-2 py-0.5 rounded-full bg-noctvm-emerald/20 text-noctvm-emerald text-[10px] font-medium">Active</span>
                  </div>
                  <div className="text-3xl font-heading font-bold text-white mb-1">0.00 <span className="text-lg text-noctvm-silver">RON</span></div>
                  <p className="text-xs text-noctvm-silver/60">No transactions yet</p>
                </div>

                {/* Coming Soon sections */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up stagger-4">
                  <div className="bg-noctvm-surface rounded-xl p-5 border border-noctvm-border relative overflow-hidden">
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-noctvm-violet/10 border border-noctvm-violet/20">
                      <span className="text-[9px] font-mono text-noctvm-violet uppercase tracking-wider">Coming Soon</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-noctvm-midnight flex items-center justify-center mb-3">
                      <TicketIcon className="w-5 h-5 text-noctvm-violet" />
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-white mb-1">My Tickets</h3>
                    <p className="text-xs text-noctvm-silver/70">Digital tickets for upcoming events</p>
                  </div>
                  <div className="bg-noctvm-surface rounded-xl p-5 border border-noctvm-border relative overflow-hidden">
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-noctvm-violet/10 border border-noctvm-violet/20">
                      <span className="text-[9px] font-mono text-noctvm-violet uppercase tracking-wider">Coming Soon</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-noctvm-midnight flex items-center justify-center mb-3">
                      <StarIcon className="w-5 h-5 text-noctvm-gold" />
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-white mb-1">Rewards</h3>
                    <p className="text-xs text-noctvm-silver/70">Earn points at partner venues</p>
                  </div>
                  <div className="bg-noctvm-surface rounded-xl p-5 border border-noctvm-border relative overflow-hidden">
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-noctvm-violet/10 border border-noctvm-violet/20">
                      <span className="text-[9px] font-mono text-noctvm-violet uppercase tracking-wider">Coming Soon</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-noctvm-midnight flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-noctvm-emerald" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-white mb-1">Top-Up</h3>
                    <p className="text-xs text-noctvm-silver/70">Add funds for instant entry</p>
                  </div>
                  <div className="bg-noctvm-surface rounded-xl p-5 border border-noctvm-border relative overflow-hidden">
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-noctvm-violet/10 border border-noctvm-violet/20">
                      <span className="text-[9px] font-mono text-noctvm-violet uppercase tracking-wider">Coming Soon</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-noctvm-midnight flex items-center justify-center mb-3">
                      <WalletIcon className="w-5 h-5 text-noctvm-silver" />
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-white mb-1">Payments</h3>
                    <p className="text-xs text-noctvm-silver/70">Transaction history and receipts</p>
                  </div>
                </div>
              </div>
            )}

            {/* ===== PROFILE TAB ===== */}
            {activeTab === 'profile' && !profileSubContent && (
              <div className="space-y-6 max-w-lg mx-auto tab-content">
                <div className="text-center py-6 animate-fade-in-up">
                  <div className="w-20 h-20 rounded-full bg-noctvm-surface border-2 border-noctvm-violet/30 flex items-center justify-center mx-auto mb-4 animate-scale-in">
                    <UserIcon className="w-10 h-10 text-noctvm-silver" />
                  </div>
                  <h2 className="font-heading text-xl font-bold text-white">Night Owl</h2>
                  <p className="text-sm text-noctvm-silver mt-1">@nightowl</p>
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <div className="text-center">
                      <span className="block font-heading font-bold text-white">0</span>
                      <span className="text-[10px] text-noctvm-silver">Events</span>
                    </div>
                    <div className="w-px h-8 bg-noctvm-border"></div>
                    <div className="text-center">
                      <span className="block font-heading font-bold text-white">0</span>
                      <span className="text-[10px] text-noctvm-silver">Following</span>
                    </div>
                    <div className="w-px h-8 bg-noctvm-border"></div>
                    <div className="text-center">
                      <span className="block font-heading font-bold text-white">0</span>
                      <span className="text-[10px] text-noctvm-silver">Reviews</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 animate-fade-in-up stagger-3">
                  {[\
                    { label: 'Manage Account', desc: 'Edit profile, privacy settings', key: 'manage-account' as ProfileSubPage, icon: <UserIcon className="w-5 h-5" /> },\
                    { label: 'Add Location', desc: 'Add a venue or event space', key: 'add-location' as ProfileSubPage, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.5v15m7.5-7.5h-15" /></svg> },\
                    { label: 'Claim Location', desc: 'Claim ownership of a venue', key: 'claim-location' as ProfileSubPage, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> },\
                    { label: 'Settings', desc: 'App preferences and notifications', key: 'settings' as ProfileSubPage, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },\
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setProfileSubPage(item.key)}
                      className="w-full flex items-center gap-3 p-4 bg-noctvm-surface rounded-xl border border-noctvm-border hover:border-noctvm-violet/30 transition-colors text-left group hover-lift"
                    >
                      <div className="w-10 h-10 rounded-lg bg-noctvm-midnight flex items-center justify-center text-noctvm-silver group-hover:text-noctvm-violet transition-colors">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-[11px] text-noctvm-silver">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ===== PROFILE SUB-PAGES ===== */}
            {profileSubContent && profileSubContent}
          </div>
        </main>

        {/* Right panel - only on events tab, stays fixed */}
        {activeTab === 'events' && !profileSubContent && (
          <RightPanel onVenueClick={handleVenueClick} />
        )}

        <BottomNav activeTab={activeTab} onTabChange={(t) => { setActiveTab(t); setProfileSubPage(null); }} />
      </div>
    </>
  );
}