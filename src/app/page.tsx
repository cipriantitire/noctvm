'use client';

import { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import FilterBar from '@/components/FilterBar';
import EventCard from '@/components/EventCard';
import RightPanel from '@/components/RightPanel';
import { MoonIcon } from '@/components/icons';
import { SAMPLE_EVENTS } from '@/lib/events-data';

type TabType = 'events' | 'feed' | 'reservations' | 'hub';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('events');
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

        <div className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-6">
          {activeTab === 'events' && (
            <>
              <div className="hidden lg:block mb-6">
                <h1 className="font-heading text-2xl font-bold text-white">Events</h1>
                <p className="text-sm text-noctvm-silver mt-1">Discover what&apos;s happening in Bucharest</p>
              </div>
              <div className="mb-6">
                <FilterBar onFilterChange={setActiveGenre} onSearchChange={setSearchQuery} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredEvents.map((event, index) => (
                  <EventCard key={`${event.source}-${index}`} event={event} />
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
            <div className="py-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-noctvm-midnight flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-noctvm-violet/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18a1.5 1.5 0 001.5-1.5V4.5A1.5 1.5 0 0021 3H3a1.5 1.5 0 00-1.5 1.5v15A1.5 1.5 0 003 21z" />
                </svg>
              </div>
              <h2 className="font-heading text-xl font-bold text-white mb-2">Feed</h2>
              <p className="text-noctvm-silver text-sm mb-6">Past events, photo albums, venue posts</p>
              <div className="flex justify-center gap-3 mb-8">
                {['Following', 'Explore', 'Friends'].map((tab) => (
                  <span key={tab} className="px-4 py-1.5 rounded-full text-xs font-medium bg-noctvm-surface text-noctvm-silver border border-noctvm-border">
                    {tab}
                  </span>
                ))}
              </div>
              <p className="text-noctvm-silver/40 text-xs font-mono">Coming soon</p>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div className="py-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-noctvm-midnight flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-noctvm-violet/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                </svg>
              </div>
              <h2 className="font-heading text-xl font-bold text-white mb-2">Reservations</h2>
              <p className="text-noctvm-silver text-sm mb-6">Table bookings, VIP access & more</p>
              <div className="flex justify-center gap-3 mb-8">
                {['Fidelity Card', 'Bonus'].map((tab) => (
                  <span key={tab} className="px-4 py-1.5 rounded-full text-xs font-medium bg-noctvm-surface text-noctvm-silver border border-noctvm-border">
                    {tab}
                  </span>
                ))}
              </div>
              <p className="text-noctvm-silver/40 text-xs font-mono">Coming soon</p>
            </div>
          )}

          {activeTab === 'hub' && (
            <div className="py-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-noctvm-midnight flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-noctvm-violet/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="font-heading text-xl font-bold text-white mb-2">Hub</h2>
              <p className="text-noctvm-silver text-sm mb-6">Manage your nightlife presence</p>
              <div className="grid gap-3 max-w-xs mx-auto">
                {['Manage Account', 'Add Location', 'Claim Location'].map((item) => (
                  <div key={item} className="px-4 py-3 rounded-xl bg-noctvm-surface text-noctvm-silver text-sm border border-noctvm-border hover:border-noctvm-violet/30 transition-colors cursor-pointer text-left">
                    {item}
                  </div>
                ))}
              </div>
              <p className="text-noctvm-silver/40 text-xs font-mono mt-8">Coming soon</p>
            </div>
          )}
        </div>
      </main>

      <RightPanel />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
