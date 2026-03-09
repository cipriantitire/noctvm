'use client';

import { useMemo } from 'react';
import { SAMPLE_EVENTS } from '@/lib/events-data';

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
            <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald live-pulse"></span>
            <span className="text-[9px] uppercase tracking-widest text-noctvm-emerald font-mono font-medium">Live Tonight</span>
            <span className="ml-auto text-[9px] text-noctvm-silver font-mono">{tonightEvents.length}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {tonightEvents.slice(0, 6).map((event, i) => (
              <a
                key={i}
                href={event.event_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-noctvm-surface/50 border border-noctvm-border flex-shrink-0 hover:border-noctvm-violet/30 transition-all duration-200"
              >
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getVenueColor(event.venue)} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-[8px] font-bold text-white">{event.venue[0]}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-white truncate max-w-[120px]">{event.title}</p>
                  <p className="text-[9px] text-noctvm-silver truncate max-w-[120px]">{event.venue}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Trending Venues - horizontal scroll */}
      <div className="animate-fade-in-up stagger-4">
        <h3 className="text-[10px] uppercase tracking-widest text-noctvm-silver font-mono font-medium mb-2 px-1">Trending Venues</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {trendingVenues.map(({ name, count }, i) => (
            <button
              key={name}
              onClick={() => onVenueClick(name)}
              className={`flex flex-col items-center gap-1.5 flex-shrink-0 w-[76px] group animate-fade-in-up stagger-${i + 1}`}
            >
              <div className="relative">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getVenueColor(name)} flex items-center justify-center ring-2 ring-noctvm-border group-hover:ring-noctvm-violet/50 transition-all duration-300 group-hover:scale-105`}>
                  <span className="text-base font-heading font-bold text-white">{name[0]}</span>
                </div>
                {count > 1 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-noctvm-violet text-[10px] font-bold text-white flex items-center justify-center">{count}</span>
                )}
              </div>
              <span className="text-[12px] text-noctvm-silver group-hover:text-white transition-colors text-center leading-tight line-clamp-2">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
