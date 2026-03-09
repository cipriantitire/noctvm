'use client';

import { useMemo } from 'react';
import { SAMPLE_EVENTS } from '@/lib/events-data';
import { VENUE_LOGOS } from '@/lib/venue-logos';

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
            <span className="w-1.5 h-1.5 rounded-full bg-noctvm-violet animate-pulse" />
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-noctvm-silver">Live Tonight</h2>
            <span className="ml-auto bg-noctvm-violet/10 text-noctvm-violet text-[10px] font-medium px-1.5 py-0.5 rounded-full">
              {tonightEvents.length} event{tonightEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-1.5">
            {tonightEvents.map((event, i) => (
              <button
                key={i}
                onClick={() => onVenueClick(event.venue)}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-left"
              >
                {VENUE_LOGOS[event.venue] ? (
                  <img
                    src={VENUE_LOGOS[event.venue]}
                    alt={event.venue}
                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getVenueColor(event.venue)} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-[10px] font-bold">{event.venue[0]}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-white truncate">{event.title}</p>
                  <p className="text-[10px] text-noctvm-silver truncate">{event.venue}</p>
                </div>
                <span className="ml-auto text-[10px] text-noctvm-silver whitespace-nowrap">{event.time}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TRENDING VENUES */}
      <div className="p-3 rounded-xl liquid-glass-subtle animate-fade-in-up stagger-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-noctvm-silver mb-2">Trending Venues</h2>
        <div className="grid grid-cols-4 gap-2">
          {trendingVenues.map((venue) => (
            <button
              key={venue.name}
              onClick={() => onVenueClick(venue.name)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              {VENUE_LOGOS[venue.name] ? (
                <img
                  src={VENUE_LOGOS[venue.name]}
                  alt={venue.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getVenueColor(venue.name)} flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{venue.name[0]}</span>
                </div>
              )}
              <span className="text-[10px] text-noctvm-silver text-center leading-tight truncate w-full">{venue.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
