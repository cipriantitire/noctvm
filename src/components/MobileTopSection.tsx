'use client';

import { useState, useEffect } from 'react';
import { SAMPLE_EVENTS } from '@/lib/events-data';
import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';
import { supabase } from '@/lib/supabase';
import { NoctEvent } from '@/lib/types';

interface MobileTopSectionProps {
  onVenueClick: (venueName: string) => void;
  activeCity?: 'bucuresti' | 'constanta';
}

export default function MobileTopSection({ onVenueClick, activeCity = 'bucuresti' }: MobileTopSectionProps) {
  const [dbEvents, setDbEvents] = useState<NoctEvent[]>([]);
  const [trendingVenues, setTrendingVenues] = useState<{name: string, count: number}[]>([]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const cityLabel = activeCity === 'bucuresti' ? 'Bucharest' : 'Constanța';
    
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

    // Fetch trending venues
    supabase
      .from('venues')
      .select('name, followers')
      .eq('city', cityLabel)
      .order('followers', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) {
          setTrendingVenues(data.map(v => ({ name: v.name, count: Math.floor(v.followers / 100) })));
        }
      });
  }, [activeCity]);

  // Fallback to sample events
  const tonightEvents = dbEvents.length > 0 
    ? dbEvents 
    : SAMPLE_EVENTS.filter(e => {
        const matchesCity = e.city?.toLowerCase() === (activeCity === 'bucuresti' ? 'bucharest' : 'constanta');
        return matchesCity && e.date === today;
      });

  return (
    <div className="lg:hidden space-y-2 mb-3 animate-fade-in">
      {/* Map - wide landscape */}
      <div className="rounded-xl overflow-hidden border border-white/5 bg-noctvm-midnight/30 backdrop-blur-sm animate-fade-in-up">
        <div className="aspect-[21/7] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-noctvm-violet/10 flex items-center justify-center mx-auto mb-1.5 border border-noctvm-violet/20">
              <svg className="w-5 h-5 text-noctvm-violet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <p className="text-noctvm-silver text-[10px] font-mono tracking-tight">Map coming soon</p>
          </div>
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
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" loading="lazy" />
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
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
