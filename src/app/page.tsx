'use client';

import { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import FilterBar from '@/components/FilterBar';
import EventCard from '@/components/EventCard';
import RightPanel from '@/components/RightPanel';
import VenuePage from '@/components/VenuePage';
import { MoonIcon } from '@/components/icons';
import { SAMPLE_EVENTS } from '@/lib/events-data';

type TabType = 'events' | 'feed' | 'wallet' | 'profile';
type FeedSubTab = 'following' | 'explore' | 'friends';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [activeGenres, setActiveGenres] = useState<string[]>(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedSubTab, setFeedSubTab] = useState<FeedSubTab>('explore');
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'portrait' | 'landscape'>('portrait');

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

  if (selectedVenue) {
    return (
      <div className="flex min-h-screen bg-noctvm-black">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 min-h-screen">
          <VenuePage
            venueName={selectedVenue}
            onBack={() => setSelectedVenue(null)}
          />
        </main>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-noctvm-black">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 min-h-screen">
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
          {activeTab === 'events' && (
            <>
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
                  <EventCard key={`${event.source}-${index}`} event={event} variant={viewMode} />
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
            </>
          )}

          {activeTab === 'feed' && (
            <div className="space-y-6">
              <div className="flex gap-4 border-b border-noctvm-border">
                {(['following', 'explore', 'friends'] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setFeedSubTab(sub)}
                    className={`pb-3 text-sm font-medium capitalize transition-colors ${
                      feedSubTab === sub
                        ? 'text-noctvm-violet border-b-2 border-noctvm-violet'
                        : 'text-noctvm-silver hover:text-white'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
              <div className="text-center py-16 text-noctvm-silver">
                <p className="font-heading text-lg">Coming Soon</p>
                <p className="text-sm mt-1 text-noctvm-silver/50">Social features are on the way</p>
              </div>
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <h2 className="font-heading text-xl font-bold text-white">Wallet</h2>
                <p className="text-sm text-noctvm-silver mt-1">Your digital nightlife wallet</p>
              </div>
              <div className="bg-gradient-to-br from-noctvm-midnight to-noctvm-surface rounded-2xl p-6 border border-noctvm-violet/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-noctvm-violet/20 flex items-center justify-center">
                    <MoonIcon className="w-5 h-5 text-noctvm-violet" />
                  </div>
                  <div>
                    <p className="text-xs text-noctvm-silver">Moonrays</p>
                    <p className="font-heading text-2xl font-bold text-white">0</p>
                  </div>
                </div>
                <p className="text-xs text-noctvm-silver/70">Earn Moonrays by checking in at venues, attending events, and engaging with the community.</p>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-noctvm-surface border-2 border-noctvm-violet/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-heading font-bold text-noctvm-violet">N</span>
                </div>
                <h2 className="font-heading text-xl font-bold text-white">Noctvm User</h2>
                <p className="text-sm text-noctvm-silver mt-1">Bucharest, Romania</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Manage Account', desc: 'Edit profile, privacy settings' },
                  { label: 'Add Location', desc: 'Add a venue or event space' },
                  { label: 'Claim Location', desc: 'Claim ownership of a venue' },
                  { label: 'Settings', desc: 'App preferences and notifications' },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center justify-between p-4 bg-noctvm-surface rounded-xl border border-noctvm-border hover:border-noctvm-violet/30 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-noctvm-silver mt-0.5">{item.desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-noctvm-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <RightPanel onVenueClick={setSelectedVenue} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
