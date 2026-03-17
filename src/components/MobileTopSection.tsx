'use client';

import { useState, useEffect, useMemo } from 'react';
import { SAMPLE_EVENTS } from '@/lib/events-data';
import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';
import { supabase } from '@/lib/supabase';
import { NoctEvent, Venue } from '@/lib/types';
import SidebarMap from './SidebarMap';

interface MobileTopSectionProps {
  onVenueClick: (venueName: string) => void;
  onEventClick?: (event: NoctEvent) => void;
  activeCity?: 'bucuresti' | 'constanta';
  activeGenres?: string[];
  activeTab?: string;
  headerHidden?: boolean;
}

export default function MobileTopSection({ 
  onVenueClick, 
  onEventClick,
  activeCity = 'bucuresti',
  activeGenres = ['All'],
  activeTab = 'events',
  headerHidden = false
}: MobileTopSectionProps) {
  const [dbEvents, setDbEvents] = useState<NoctEvent[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [trendingVenues, setTrendingVenues] = useState<{name: string, count: number}[]>([]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const cityLabel = activeCity === 'bucuresti' ? 'Bucharest' : 'Constanta';
    
    // Fetch tonight's events
    supabase
      .from('events')
      .select('*')
      .eq('city', cityLabel)
      .eq('date', today)
      .limit(6)
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

    // Trending venues
    supabase
      .from('events')
      .select('venue')
      .eq('city', cityLabel)
      .gte('date', today)
      .then(({ data }) => {
        if (data) {
          const counts: Record<string, number> = {};
          data.forEach(ev => {
            counts[ev.venue] = (counts[ev.venue] || 0) + 1;
          });
          const sorted = Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
          setTrendingVenues(sorted);
        }
      });
  }, [activeCity, today]);

  // Fallback to sample events
  const tonightEvents = dbEvents.length > 0 
    ? dbEvents 
    : SAMPLE_EVENTS.filter(e => {
        const matchesCity = e.city?.toLowerCase() === (activeCity === 'bucuresti' ? 'bucharest' : 'constanta');
        return matchesCity && e.date === today;
      });

  // Filter venues for map based on genres and events
  const mapVenues = useMemo(() => {
    let filtered = venues;
    
    // Apply genre filter if not 'All'
    if (activeGenres && !activeGenres.includes('All')) {
      filtered = venues.filter(v => 
        v.genres.some(g => activeGenres.some(ag => g.toLowerCase().includes(ag.toLowerCase())))
      );
    }

    // On Events tab mobile, show venues that have events tonight
    const activeVenueNames = new Set(tonightEvents.map(e => e.venue));
    return filtered.filter(v => activeVenueNames.has(v.name));
  }, [venues, activeGenres, tonightEvents]);

  return (
    <div className="lg:hidden space-y-2 mb-3 animate-fade-in">
      {/* Map - wide landscape */}
      <div className="rounded-xl overflow-hidden border border-white/5 bg-noctvm-midnight/30 backdrop-blur-sm animate-fade-in-up">
        <div className="aspect-[21/9] flex items-center justify-center relative">
          <SidebarMap 
            venues={mapVenues}
            events={tonightEvents}
            activeCity={activeCity}
            activeTab={activeTab as any}
            onVenueClick={onVenueClick}
            onEventClick={onEventClick}
            headerHidden={headerHidden}
          />
        </div>
      </div>

      {/* LIVE TONIGHT */}
      {tonightEvents.length > 0 && (
        <div className="p-3 rounded-xl bg-gradient-to-br from-noctvm-midnight/50 to-transparent backdrop-blur-sm border border-white/5 animate-fade-in-up stagger-2 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-noctvm-violet/5 rounded-full -mr-12 -mt-12 blur-2xl" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald live-pulse" />
            <span className="text-[11px] font-semibold text-noctvm-emerald uppercase tracking-wider font-mono">Live Tonight</span>
            <span className="text-[10px] text-noctvm-silver/50 ml-auto font-mono">{tonightEvents.length} events</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-1 px-1 relative z-10">
            {tonightEvents.slice(0, 5).map(event => (
              <button
                key={event.id}
                onClick={() => window.open(event.event_url, '_blank')}
                className="flex-shrink-0 w-[140px] rounded-lg overflow-hidden border border-white/5 bg-black/20 hover:border-noctvm-violet/40 transition-all active:scale-95 text-left group/card"
              >
                <div className="aspect-[3/2] bg-noctvm-midnight relative overflow-hidden">
                  <img 
                    src={event.image_url || '/images/event-fallback.png'} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" 
                    loading="lazy" 
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/event-fallback.png'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="p-1.5">
                  <p className="text-[10px] font-medium text-white line-clamp-1 group-hover/card:text-noctvm-violet transition-colors">{event.title}</p>
                  <p className="text-[9px] text-noctvm-silver/60 truncate">{event.venue}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TRENDING VENUES */}
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 animate-fade-in-up stagger-3">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[11px] font-semibold text-noctvm-silver/70 uppercase tracking-wider font-mono">Trending Venues</span>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {trendingVenues.map(venue => {
            const logoSrc = getVenueLogo(venue.name);
            return (
              <button
                key={venue.name}
                onClick={() => onVenueClick(venue.name)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[65px] group"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 group-hover:border-noctvm-violet/50 shadow-sm group-hover:shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all flex items-center justify-center bg-noctvm-midnight relative">
                  <img
                    src={logoSrc}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      el.parentElement!.querySelector('.fallback')?.classList.remove('hidden');
                    }}
                  />
                  <span className={`fallback text-xs font-bold bg-gradient-to-br ${getVenueColor(venue.name)} bg-clip-text text-transparent hidden relative z-10`}>
                    {venue.name.charAt(0)}
                  </span>
                </div>
                <span className="text-[9px] text-noctvm-silver/60 text-center line-clamp-1 w-full font-medium transition-colors group-hover:text-white">{venue.name}</span>
                <span className="text-[8px] text-noctvm-silver/40 font-mono -mt-1 group-hover:text-noctvm-violet transition-colors">{venue.count} events</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
