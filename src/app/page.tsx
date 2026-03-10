'use client';

import { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import FilterBar from '@/components/FilterBar';
import EventCard from '@/components/EventCard';
import RightPanel from '@/components/RightPanel';
import { MoonIcon } from '@/components/icons';
import { SAMPLE_EVENTS } from '@/lib/events-data';

export default function Home() {
  const [activeGenres, setActiveGenres] = useState<string[]>(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'portrait' | 'landscape'>('portrait');

  const filteredEvents = useMemo(() => {
    let events = SAMPLE_EVENTS;
    if (!activeGenres.includes('All')) {
      events = events.filter(e =>
        e.genres.some(g =>
          activeGenres.some(ag => g.toLowerCase().includes(ag.toLowerCase()))
        )
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

  return (
    <div className="flex min-h-screen bg-noctvm-black">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 min-h-screen">
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

        {/* Content area */}
        <div className="w-full max-w-[1800px] mx-auto px-4 lg:px-8 py-6 pb-24 lg:pb-6">
          {/* Page title (desktop only) */}
          <div className="hidden lg:block mb-6">
            <h1 className="font-heading text-2xl font-bold text-white">Explore</h1>
            <p className="text-sm text-noctvm-silver mt-1">Discover what&apos;s happening in Bucharest tonight</p>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <FilterBar
              activeGenres={activeGenres}
              onFilterChange={setActiveGenres}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Event grid */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-noctvm-silver font-mono">{filteredEvents.length} events found</p>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('portrait')}
                className={`px-2 py-1 rounded-lg text-xs transition-all ${
                  viewMode === 'portrait'
                    ? 'bg-noctvm-violet/20 text-noctvm-violet'
                    : 'text-noctvm-silver hover:text-white'
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => setViewMode('landscape')}
                className={`px-2 py-1 rounded-lg text-xs transition-all ${
                  viewMode === 'landscape'
                    ? 'bg-noctvm-violet/20 text-noctvm-violet'
                    : 'text-noctvm-silver hover:text-white'
                }`}
              >
                Landscape
              </button>
            </div>
          </div>

          <div className={`grid gap-4 ${
            viewMode === 'portrait'
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                viewMode={viewMode}
                onVenueClick={(venue) => setSelectedVenue(venue)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Right panel (desktop only) */}
      <RightPanel
        selectedVenue={selectedVenue}
        onClose={() => setSelectedVenue(null)}
      />

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
