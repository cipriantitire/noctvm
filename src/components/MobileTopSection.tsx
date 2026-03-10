'use client';

import { useMemo } from 'react';
import { SAMPLE_EVENTS } from '@/lib/events-data';
import { getVenueLogo } from '@/lib/venue-logos';

const VENUE_COLORS: Record<string, string> = {
  'Control Club': 'from-red-500 to-orange-500',
  'Nook Club': 'from-blue-500 to-cyan-500',
  'Club Guesthouse': 'from-emerald-500 to-teal-500',
  'Platforma Wolff': 'from-amber-500 to-yellow-500',
  'Beraria H': 'from-noctvm-violet to-purple-500',
  'Expirat Halele Carol': 'from-pink-500 to-rose-500',
  'Interbelic': 'from-indigo-500 to-blue-500',
  'OXYA Club': 'from-fuchsia-500 to-pink-500',
  'Maison 64': 'from-violet-500 to-purple-500',
  'Noar Hall': 'from-sky-500 to-blue-500',
  'KAYO Club': 'from-lime-500 to-green-500',
  'Princess Club': 'from-rose-500 to-red-500',
  'Forge Bucharest': 'from-orange-500 to-amber-500',
};

function getVenueColor(venue: string): string {
  return VENUE_COLORS[venue] || 'from-noctvm-violet to-purple-400';
}

interface MobileTopSectionProps {
  onVenueClick: (venueName: string) => void;
}

export default function MobileTopSection({ onVenueClick }: MobileTopSectionProps) {
  const tonightEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return SAMPLE_EVENTS.filter(e => e.date === today);
  }, []);

  const trendingVenues = useMemo(() => {
    const counts: Record<string, { count: number }> = {};
    SAMPLE_EVENTS.forEach(e => {
      if (!counts[e.venue]) counts[e.venue] = { count: 0 };
      counts[e.venue].count++;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 8)
      .map(([name, data]) => ({ name, ...data }));
  }, []);

  return (
    <div className="lg:hidden space-y-2 mb-3 animate-fade-in">
      {/* Map - wide landscape */}
      <div className="rounded-xl overflow-hidden border border-noctvm-border animate-fade-in-up">
        <div className="aspect-[21/7] bg-noctvm-midnight flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-noctvm-violet/10 flex items-center justify-center mx-auto mb-1.5">
              <svg className="w-5 h-5 text-noctvm-violet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <p className="text-noctvm-silver text-[10px]">Map coming soon</p>
          </div>
        </div>
      </div>

      {/* LIVE TONIGHT */}
      {tonightEvents.length > 0 && (
        <div className="p-3 rounded-xl liquid-glass-subtle border-noctvm-violet/20 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-noctvm-violet animate-pulse-slow" />
            <span className="text-[11px] font-semibold text-noctvm-violet uppercase tracking-wider">Live Tonight</span>
            <span className="text-[10px] text-noctvm-silver/50 ml-auto">{tonightEvents.length} events</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {tonightEvents.slice(0, 4).map(event => (
              <a
                key={event.id}
                href={event.event_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 w-[140px] rounded-lg overflow-hidden border border-noctvm-border hover:border-noctvm-violet/30 transition-colors"
              >
                <div className="aspect-[3/2] bg-noctvm-midnight relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="p-1.5">
                  <p className="text-[10px] font-medium text-white line-clamp-1">{event.title}</p>
                  <p className="text-[9px] text-noctvm-silver/60">{event.venue}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* TRENDING VENUES */}
      <div className="p-3 rounded-xl liquid-glass-subtle animate-fade-in-up stagger-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-semibold text-noctvm-silver uppercase tracking-wider">Trending Venues</span>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {trendingVenues.map(venue => {
            const logoSrc = getVenueLogo(venue.name);
            return (
              <button
                key={venue.name}
                onClick={() => onVenueClick(venue.name)}
                className="flex-shrink-0 flex flex-col items-center gap-1 w-[60px] group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border border-noctvm-border group-hover:border-noctvm-violet/50 transition-colors flex items-center justify-center bg-noctvm-midnight">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoSrc}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      el.parentElement!.querySelector('.fallback')?.classList.remove('hidden');
                    }}
                  />
                  <span className={`fallback text-xs font-bold bg-gradient-to-br ${getVenueColor(venue.name)} bg-clip-text text-transparent hidden`}>
                    {venue.name.charAt(0)}
                  </span>
                </div>
                <span className="text-[9px] text-noctvm-silver/70 text-center line-clamp-1 w-full">{venue.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
