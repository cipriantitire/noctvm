'use client';

import { useMemo, useState, useEffect } from 'react';
import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';
import { NoctEvent, Venue } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { buildMapVenuesForEvents } from '@/lib/map-venues';
import { useScrollFade } from '@/hooks/useScrollFade';
import SidebarMap from './SidebarMap';

interface RightPanelProps {
  onVenueClick?: (venueName: string) => void;
  onEventClick?: (event: NoctEvent) => void;
  activeCity?: 'bucuresti' | 'constanta';
  activeTab?: string;
  activeGenres?: string[];
}

export default function RightPanel({
  onVenueClick,
  onEventClick,
  activeCity = 'bucuresti',
  activeTab = 'events',
  activeGenres = ['All']
}: RightPanelProps) {
  const { ref: liveTonightRef, maskStyle: liveTonightMask } = useScrollFade('y');
  const [dbEvents, setDbEvents] = useState<NoctEvent[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [trendingVenues, setTrendingVenues] = useState<{name: string, count: number}[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const cityLabel = activeCity === 'bucuresti' ? 'Bucharest' : 'Constanta';
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch tonight's events
    supabase
      .from('events')
      .select('*')
      .eq('city', cityLabel)
      .eq('date', today)
      .order('time', { ascending: true })
      .then(({ data }) => {
        if (data) setDbEvents(data as NoctEvent[]);
      });

    // Fetch venues for map
    supabase
      .from('venues')
      .select('*')
      .eq('city', cityLabel)
      .then(({ data }) => {
        if (data) setVenues(data as Venue[]);
      });

    // Trending venues and event counts
    supabase
      .from('events')
      .select('venue')
      .eq('city', cityLabel)
      .gte('date', today)
      .then(({ data }) => {
        if (data) {
          const counts: Record<string, number> = {};
          data.forEach(ev => {
            if (!ev.venue || ev.venue === 'Venue TBC') return;
            counts[ev.venue] = (counts[ev.venue] || 0) + 1;
          });
          
          setEventCounts(counts);

          const sorted = Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
          setTrendingVenues(sorted);
        }
      });
  }, [activeCity]);

  // Filter venues for map based on tab and genres
  const mapVenues = useMemo(() => {
    let filtered = venues;
    
    // Apply genre filter if not 'All'
    if (activeGenres && !activeGenres.includes('All')) {
      filtered = venues.filter(v => 
        v.genres.some(g => activeGenres.some(ag => g.toLowerCase().includes(ag.toLowerCase())))
      );
    }

    if (activeTab === 'venues') return filtered;
    
    // For feed/events tab, only show venues with events tonight
    return buildMapVenuesForEvents(dbEvents, filtered);
  }, [venues, dbEvents, activeTab, activeGenres]);

  const tonightEvents = useMemo(() => dbEvents, [dbEvents]);

  return (
    <aside className="hidden xl:block w-80 h-screen sticky top-0 rounded-l-2xl frosted-glass-subtle border-l border-white/5 p-6 overflow-hidden z-40">
      <div className="rounded-xl overflow-hidden mb-6 border border-noctvm-border h-[200px]">
        <SidebarMap 
          venues={mapVenues} 
          events={dbEvents}
          eventCounts={eventCounts}
          activeCity={activeCity!} 
          activeTab={activeTab as any}
          onVenueClick={onVenueClick}
          onEventClick={onEventClick}
        />
      </div>

      {/* Live Tonight */}
      <div
        data-colorbends-refraction="search-surface"
        className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-noctvm-midnight/50 to-transparent backdrop-blur-sm border border-white/5 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-noctvm-violet/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-noctvm-violet/10 transition-colors" />
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <span className="w-2 h-2 rounded-full bg-noctvm-emerald live-pulse"></span>
          <span className="text-noctvm-caption tracking-widest font-mono font-medium">
            <span className="text-noctvm-emerald">LIVE</span>
            <span className="text-noctvm-silver"> in {activeCity === 'bucuresti' ? 'București' : 'Constanța'}</span>
          </span>
          <span className="ml-auto text-noctvm-caption text-noctvm-silver/80 font-mono">{tonightEvents.length} events</span>
        </div>
        {tonightEvents.length > 0 ? (
          <div ref={liveTonightRef} style={liveTonightMask} className="space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar relative z-10 pr-1">
            {tonightEvents.map((event, i) => (
              <button
                key={i}
                onClick={() => onEventClick ? onEventClick(event) : window.open(event.event_url, '_blank')}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors group/event text-left"
              >
                <div className="w-8 h-8 rounded-full border border-noctvm-border bg-noctvm-midnight flex items-center justify-center flex-shrink-0 overflow-hidden group-hover/event:border-noctvm-violet/30 transition-colors">
                  <img src={getVenueLogo(event.venue)} alt={event.venue} className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      el.parentElement!.querySelector('.fallback')?.classList.remove('hidden');
                    }}
                  />
                  <span className={`fallback hidden text-noctvm-caption font-bold text-white`}>
                    {event.venue[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-noctvm-label font-medium text-white truncate group-hover/event:text-noctvm-violet transition-colors">{event.title}</p>
                  <p className="text-noctvm-caption text-noctvm-silver truncate">{event.venue}{event.time ? ` · ${event.time}` : ''}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-noctvm-silver/60">No events scheduled tonight</p>
        )}
      </div>

      {/* Trending venues */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-white mb-3">Trending Venues</h3>
        <div className="space-y-2">
          {trendingVenues.slice(0, 5).map(({ name, count }) => (
            <button
              key={name}
              onClick={() => onVenueClick?.(name)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 hover:border-noctvm-violet/30 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
            >
              <div className="w-9 h-9 rounded-full border border-noctvm-border bg-noctvm-midnight flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:border-noctvm-violet/30 transition-colors">
                <img src={getVenueLogo(name)} alt={name} className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                    el.parentElement!.querySelector('.fallback')?.classList.remove('hidden');
                  }}
                />
                <span className={`fallback hidden text-xs font-heading font-bold text-white`}>
                  {name[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-white group-hover:text-noctvm-violet transition-colors truncate">{name}</p>
                <p className="text-noctvm-caption text-noctvm-silver">{count} Upcoming Events</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
