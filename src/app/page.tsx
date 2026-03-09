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

type TabType = 'events' | 'feed' | 'wallet' | 'profile';
type ProfileSubPage = null | 'manage-account' | 'add-location' | 'claim-location' | 'settings';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [activeGenres, setActiveGenres] = useState<string[]>(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'portrait' | 'landscape'>('landscape');
  const [profileSubPage, setProfileSubPage] = useState<ProfileSubPage>(null);

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

        {/* Main content area - THIS is the scroll container */}
        <main className="flex-1 min-w-0 h-screen overflow-y-auto">
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

                <div className="hidden lg:block mb-6">
                  <h1 className="font-heading text-2xl font-bold text-white">Explore</h1>
                  <p className="text-sm text-noctvm-silver mt-1">Discover what&apos;s happening in Bucharest tonight</p>
                </div>

                <div className="mb-6">
                  <FilterBar
                    activeGenres={activeGenres}
                    onFilterChange={setActiveGenres}
                    onSearchChange={setSearchQuery}
                  />
                </div>

                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-noctvm-silver font-mono">{filteredEvents.length} events</p>
                  <div className="flex items-center gap-1 bg-noctvm-surface border border-noctvm-border rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('portrait')}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === 'portrait' ? 'bg-noctvm-violet/20 text-noctvm-violet' : 'text-noctvm-silver hover:text-white'}`}
                      title="Grid view"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
                    </button>
                    <button
                      onClick={() => setViewMode('landscape')}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === 'landscape' ? 'bg-noctvm-violet/20 text-noctvm-violet' : 'text-noctvm-silver hover:text-white'}`}
                      title="List view"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="6" rx="1"/><rect x="1" y="9" width="14" height="6" rx="1"/></svg>
                    </button>
                  </div>
                </div>

                <div className={viewMode === 'portrait'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                  : "grid grid-cols-1 lg:grid-cols-2 gap-4"
                }>
                  {filteredEvents.map((event, index) => (
                    <div key={`${event.source}-${index}`} className={`animate-fade-in-up hover-lift stagger-${Math.min(index + 1, 12)}`}>
                      <EventCard event={event} variant={viewMode} />
                    </div>
                  ))}
                </div>

                {filteredEvents.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-noctvm-midnight flex items-center justify-center mx-auto mb-4">
                      <MoonIcon className="w-8 h-8 text-noctvm-violet/50" />
                    </div>
                    <p className="text-noctvm-silver font-heading">No events found</p>
                    <p className="text-noctvm-silver/50 text-sm mt-1">Try a different filter or search</p>
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

                {/* Moonrays card */}
                <div className="liquid-glass rounded-2xl p-5 animate-fade-in-up stagger-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-noctvm-violet/20 flex items-center justify-center">
                      <MoonIcon className="w-5 h-5 text-noctvm-violet" />
                    </div>
                    <div>
                      <p className="text-[10px] text-noctvm-silver uppercase tracking-wider">Moonrays Balance</p>
                      <p className="font-heading text-2xl font-bold text-white">0</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-noctvm-silver/70 leading-relaxed">Earn Moonrays by checking in at venues, attending events, and engaging with the community.</p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-medium bg-noctvm-violet/10 text-noctvm-violet border border-noctvm-violet/20">+5 per check-in</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-medium bg-noctvm-emerald/10 text-noctvm-emerald border border-noctvm-emerald/20">+10 per event</span>
                  </div>
                </div>

                {/* Coming Soon sections */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up stagger-4">
                  <div className="bg-noctvm-surface rounded-xl p-5 border border-noctvm-border relative overflow-hidden">
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-noctvm-violet/10 border border-noctvm-violet/20">
                      <span className="text-[8px] uppercase tracking-wider font-mono font-medium text-noctvm-violet">Coming Soon</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-noctvm-midnight flex items-center justify-center mb-3">
                      <TicketIcon className="w-5 h-5 text-noctvm-violet" />
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-white mb-1">My Tickets</h3>
                    <p className="text-[11px] text-noctvm-silver/70 leading-relaxed">Your event tickets in one place. QR codes for entry, transfer tickets to friends.</p>
                  </div>

                  <div className="bg-noctvm-surface rounded-xl p-5 border border-noctvm-border relative overflow-hidden">
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-noctvm-violet/10 border border-noctvm-violet/20">
                      <span className="text-[8px] uppercase tracking-wider font-mono font-medium text-noctvm-violet">Coming Soon</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-noctvm-midnight flex items-center justify-center mb-3">
                      <StarIcon className="w-5 h-5 text-noctvm-gold" />
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-white mb-1">NFT Collectibles</h3>
                    <p className="text-[11px] text-noctvm-silver/70 leading-relaxed">Collect digital memorabilia from events. Proof of attendance, exclusive artwork.</p>
                  </div>

                  <div className="bg-noctvm-surface rounded-xl p-5 border border-noctvm-border relative overflow-hidden">
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-noctvm-violet/10 border border-noctvm-violet/20">
                      <span className="text-[8px] uppercase tracking-wider font-mono font-medium text-noctvm-violet">Coming Soon</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-noctvm-midnight flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-noctvm-emerald" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-white mb-1">Rewards</h3>
                    <p className="text-[11px] text-noctvm-silver/70 leading-relaxed">Redeem Moonrays for VIP access, drink vouchers, skip-the-line passes.</p>
                  </div>

                  <div className="bg-noctvm-surface rounded-xl p-5 border border-noctvm-border relative overflow-hidden">
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-noctvm-violet/10 border border-noctvm-violet/20">
                      <span className="text-[8px] uppercase tracking-wider font-mono font-medium text-noctvm-violet">Coming Soon</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-noctvm-midnight flex items-center justify-center mb-3">
                      <WalletIcon className="w-5 h-5 text-noctvm-silver" />
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-white mb-1">Payments</h3>
                    <p className="text-[11px] text-noctvm-silver/70 leading-relaxed">Transaction history, linked cards, split bills with friends at venues.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ===== PROFILE TAB ===== */}
            {activeTab === 'profile' && !profileSubContent && (
              <div className="space-y-6 max-w-lg mx-auto tab-content">
                <div className="text-center py-6 animate-fade-in-up">
                  <div className="w-20 h-20 rounded-full bg-noctvm-surface border-2 border-noctvm-violet/30 flex items-center justify-center mx-auto mb-4 animate-scale-in">
                    <span className="text-2xl font-heading font-bold text-noctvm-violet">N</span>
                  </div>
                  <h2 className="font-heading text-xl font-bold text-white">Noctvm User</h2>
                  <p className="text-sm text-noctvm-silver mt-1">Bucharest, Romania</p>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="text-center hover-lift cursor-pointer">
                      <p className="font-heading text-lg font-bold text-white">0</p>
                      <p className="text-[10px] text-noctvm-silver">Events</p>
                    </div>
                    <div className="w-px h-8 bg-noctvm-border"></div>
                    <div className="text-center hover-lift cursor-pointer">
                      <p className="font-heading text-lg font-bold text-white">0</p>
                      <p className="text-[10px] text-noctvm-silver">Following</p>
                    </div>
                    <div className="w-px h-8 bg-noctvm-border"></div>
                    <div className="text-center hover-lift cursor-pointer">
                      <p className="font-heading text-lg font-bold text-white">0</p>
                      <p className="text-[10px] text-noctvm-silver">Followers</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 animate-fade-in-up stagger-3">
                  {[
                    { label: 'Manage Account', desc: 'Edit profile, privacy settings', key: 'manage-account' as ProfileSubPage, icon: <UserIcon className="w-5 h-5" /> },
                    { label: 'Add Location', desc: 'Add a venue or event space', key: 'add-location' as ProfileSubPage, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.5v15m7.5-7.5h-15" /></svg> },
                    { label: 'Claim Location', desc: 'Claim ownership of a venue', key: 'claim-location' as ProfileSubPage, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> },
                    { label: 'Settings', desc: 'App preferences and notifications', key: 'settings' as ProfileSubPage, icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setProfileSubPage(item.key)}
                      className="w-full flex items-center gap-3 p-4 bg-noctvm-surface rounded-xl border border-noctvm-border hover:border-noctvm-violet/30 transition-colors text-left group hover-lift"
                    >
                      <div className="w-9 h-9 rounded-lg bg-noctvm-midnight flex items-center justify-center text-noctvm-silver group-hover:text-noctvm-violet transition-colors">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white group-hover:text-noctvm-violet transition-colors">{item.label}</p>
                        <p className="text-[10px] text-noctvm-silver">{item.desc}</p>
                      </div>
                      <svg className="w-4 h-4 text-noctvm-silver/40 group-hover:text-noctvm-violet transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
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
