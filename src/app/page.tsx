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
  const [activeGenre, setActiveGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = useMemo(() => {
    let events = SAMPLE_EVENTS;
    if (activeGenre !== 'All') {
      events = events.filter(e => e.genres.some(g => g.toLowerCase().includes(activeGenre.toLowerCase())));
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
  }, [activeGenre, searchQuery]);

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
        <div className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-6">
          {/* Page title (desktop only) */}
          <div className="hidden lg:block mb-6">
            <h1 className="font-heading text-2xl font-bold text-white">Explore</h1>
            <p className="text-sm text-noctvm-silver mt-1">Discover what&apos;s happening in Bucharest tonight</p>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <FilterBar
              onFilterChange={setActiveGenre}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Event grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredEvents.map((event, index) => (
              <EventCard key={`${event.source}-${index}`} event={event} />
            ))}
          </div>

          {/* Empty state */}
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
      </main>

      {/* Desktop right panel */}
      <RightPanel />

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
