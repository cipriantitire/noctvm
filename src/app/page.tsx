'use client';

import { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import FilterBar from '@/components/FilterBar';
import EventCard from '@/components/EventCard';
import RightPanel from '@/components/RightPanel';
import VenuePage from '@/components/VenuePage';
import { MoonIcon, HeartIcon, ChatIcon, ShareIcon, BookmarkIcon } from '@/components/icons';
import { SAMPLE_EVENTS } from '@/lib/events-data';

type TabType = 'events' | 'feed' | 'wallet' | 'profile';
type FeedSubTab = 'following' | 'explore' | 'friends';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [activeGenres, setActiveGenres] = useState<string[]>(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedSubTab, setFeedSubTab] = useState<FeedSubTab>('explore');
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    let events = SAMPLE_EVENTS;
    if (!activeGenres.includes('All')) {
      events = events.filter(e =>
        activeGenres.some(genre =>
          e.genres.some(g => g.toLowerCase().includes(genre.toLowerCase()))
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

  const todaysEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return SAMPLE_EVENTS.filter(e => e.date === today);
  }, []);

  return (
    <div className="flex min-h-screen bg-noctvm-black">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

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

        <div className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-6">
          {/* EVENTS TAB */}
          {activeTab === 'events' && (
            <>
              {selectedVenue ? (
                <VenuePage 
                  venueName={selectedVenue} 
                  events={SAMPLE_EVENTS} 
                  onBack={() => setSelectedVenue(null)} 
                />
              ) : (
                <>
                  <div className="hidden lg:block mb-6">
                    <h1 className="font-heading text-2xl font-bold text-white">Events</h1>
                    <p className="text-sm text-noctvm-silver mt-1">Discover what&apos;s happening in Bucharest</p>
                  </div>
                  <div className="mb-6">
                    <FilterBar activeGenres={activeGenres} onFilterChange={setActiveGenres} onSearchChange={setSearchQuery} />
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
            </>
          )}

          {/* FEED TAB - Instagram-inspired */}
          {activeTab === 'feed' && (
            <div>
              {/* Stories-style bar */}
              <div className="flex gap-4 overflow-x-auto pb-4 mb-2 border-b border-noctvm-border scrollbar-hide">
                {['Your Story', 'Control', 'Nook', 'Expirat', 'Guesthouse', 'OXYA'].map((name, i) => (
                  <div key={name} className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${i === 0 ? 'border-2 border-dashed border-noctvm-silver/30' : 'bg-gradient-to-br from-noctvm-violet to-purple-500 p-[2px]'}`}>
                      <div className="w-full h-full rounded-full bg-noctvm-black flex items-center justify-center">
                        <span className="text-xs font-heading font-bold text-noctvm-silver">{name[0]}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-noctvm-silver truncate w-16 text-center">{name}</span>
                  </div>
                ))}
              </div>

              {/* Sub-tabs: Following / Explore / Friends */}
              <div className="flex border-b border-noctvm-border mb-6">
                {(['following', 'explore', 'friends'] as FeedSubTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFeedSubTab(tab)}
                    className={`flex-1 py-3 text-sm font-medium capitalize transition-colors relative ${
                      feedSubTab === tab ? 'text-white' : 'text-noctvm-silver hover:text-white'
                    }`}
                  >
                    {tab}
                    {feedSubTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white" />
                    )}
                  </button>
                ))}
              </div>

              {/* Feed posts - Instagram card style */}
              <div className="space-y-6">
                {SAMPLE_EVENTS.slice(0, 6).map((event, i) => (
                  <div key={i} className="border border-noctvm-border rounded-lg overflow-hidden bg-noctvm-surface">
                    {/* Post header */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-400 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">{event.venue[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{event.venue}</p>
                        <p className="text-[10px] text-noctvm-silver">{event.date}</p>
                      </div>
                      <button className="text-noctvm-silver hover:text-white">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>
                      </button>
                    </div>
                    {/* Post image */}
                    <div className="aspect-square bg-noctvm-midnight overflow-hidden">
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    {/* Action row */}
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <button className="text-white hover:text-noctvm-violet transition-colors"><HeartIcon className="w-6 h-6" /></button>
                          <button className="text-white hover:text-noctvm-violet transition-colors"><ChatIcon className="w-6 h-6" /></button>
                          <button className="text-white hover:text-noctvm-violet transition-colors"><ShareIcon className="w-6 h-6" /></button>
                        </div>
                        <button className="text-white hover:text-noctvm-violet transition-colors"><BookmarkIcon className="w-6 h-6" /></button>
                      </div>
                      <p className="text-sm text-white font-semibold mb-1">{event.title}</p>
                      {event.description && <p className="text-xs text-noctvm-silver line-clamp-2">{event.description}</p>}
                      <div className="flex gap-1.5 mt-2">
                        {event.genres.slice(0, 3).map(g => (
                          <span key={g} className="text-[10px] text-noctvm-violet">#{g.replace(/\s+/g, '')}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WALLET TAB */}
          {activeTab === 'wallet' && (
            <div>
              <div className="mb-8">
                <h2 className="font-heading text-2xl font-bold text-white mb-1">Wallet</h2>
                <p className="text-sm text-noctvm-silver">Your nightlife essentials in one place</p>
              </div>

              {/* Wallet sections */}
              <div className="space-y-4">
                {[
                  { title: 'Tickets', desc: 'Upcoming event tickets', count: 0, icon: 'TK', color: 'from-noctvm-violet/20 to-purple-900/20' },
                  { title: 'Passes', desc: 'Season & venue passes', count: 0, icon: 'ID', color: 'from-blue-500/20 to-cyan-900/20' },
                  { title: 'VIP Access', desc: 'Table reservations & VIP entries', count: 0, icon: '\u2605', color: 'from-noctvm-gold/20 to-amber-900/20' },
                  { title: 'Fidelity Cards', desc: 'Venue loyalty programs', count: 0, icon: 'CD', color: 'from-noctvm-emerald/20 to-emerald-900/20' },
                ].map(({ title, desc, count, icon, color }) => (
                  <button key={title} className={`w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${color} border border-noctvm-border hover:border-noctvm-violet/30 transition-all text-left group`}>
                    <div className="w-12 h-12 rounded-xl bg-noctvm-midnight/50 flex items-center justify-center text-2xl flex-shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white group-hover:text-noctvm-violet transition-colors">{title}</h3>
                        <span className="text-xs text-noctvm-silver font-mono">{count}</span>
                      </div>
                      <p className="text-xs text-noctvm-silver mt-0.5">{desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-noctvm-silver/50 group-hover:text-noctvm-violet transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                ))}
              </div>

              {/* Moonrays teaser */}
              <div className="mt-8 p-5 rounded-xl bg-gradient-to-br from-noctvm-midnight to-noctvm-black border border-noctvm-violet/20 text-center">
                <div className="text-3xl mb-2">\u263D</div>
                <h3 className="font-heading text-lg font-bold text-white mb-1">Moonrays</h3>
                <p className="text-xs text-noctvm-silver max-w-xs mx-auto">Earn points every night out. Redeem for exclusive perks, skip-the-line access, and more.</p>
                <p className="text-[10px] text-noctvm-violet font-mono mt-3 uppercase tracking-widest">Coming Soon</p>
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div>
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-400 flex items-center justify-center ring-2 ring-noctvm-border">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  </div>
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-white">Your Profile</h2>
                    <p className="text-sm text-noctvm-silver">Manage your nightlife presence</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3">
                {[
                  { label: 'Manage Account', desc: 'Edit profile, preferences, privacy', icon: '\u2699' },
                  { label: 'Add Location', desc: 'Register a new venue or event space', icon: '+' },
                  { label: 'Claim Location', desc: 'Claim ownership of an existing venue', icon: '\u2713' },
                  { label: 'Moonrays Balance', desc: 'View your points and rewards', icon: '\u263D' },
                  { label: 'Settings', desc: 'Notifications, privacy, app preferences', icon: '\u25CB' },
                ].map(({ label, desc, icon }) => (
                  <div key={label} className="flex items-center gap-4 px-4 py-4 rounded-xl bg-noctvm-surface text-left border border-noctvm-border hover:border-noctvm-violet/30 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-noctvm-midnight/50 flex items-center justify-center text-lg text-noctvm-silver flex-shrink-0">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-noctvm-violet transition-colors">{label}</p>
                      <p className="text-xs text-noctvm-silver mt-0.5">{desc}</p>
                    </div>
                    <svg className="w-4 h-4 text-noctvm-silver/50 group-hover:text-noctvm-violet transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                ))}
              </div>
              <p className="text-noctvm-silver/40 text-xs font-mono mt-8 text-center">More features coming soon</p>
            </div>
          )}
        </div>
      </main>

      <RightPanel events={SAMPLE_EVENTS} onVenueClick={(name) => { setActiveTab('events'); setSelectedVenue(name); }} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
