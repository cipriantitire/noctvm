import { useMemo, useState, useEffect } from 'react';
import { SAMPLE_EVENTS } from '@/lib/events-data';
import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';
import { NoctEvent } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface RightPanelProps {
  onVenueClick?: (venueName: string) => void;
  onEventClick?: (event: NoctEvent) => void;
  activeCity?: 'bucuresti' | 'constanta';
}

export default function RightPanel({ onVenueClick, onEventClick, activeCity = 'bucuresti' }: RightPanelProps) {
  const [dbEvents, setDbEvents] = useState<NoctEvent[]>([]);
  const [trendingVenues, setTrendingVenues] = useState<{name: string, count: number}[]>([]);

  useEffect(() => {
    const cityLabel = activeCity === 'bucuresti' ? 'Bucharest' : 'Constanta';
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch tonight's events
    supabase
      .from('events')
      .select('*')
      .eq('city', cityLabel)
      .eq('date', today)
      .limit(10)
      .then(({ data }) => {
        if (data) setDbEvents(data as NoctEvent[]);
      });

    // Trending venues now means "Venues with the most upcoming events"
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
            .slice(0, 8);
          setTrendingVenues(sorted);
        }
      });
  }, [activeCity]);

  // Fallback to sample events
  const tonightEvents = useMemo(() => {
    if (dbEvents.length > 0) return dbEvents;
    const today = new Date().toISOString().split('T')[0];
    return SAMPLE_EVENTS.filter(e => {
      const matchesCity = e.city?.toLowerCase() === (activeCity === 'bucuresti' ? 'bucharest' : 'constanta');
      return matchesCity && e.date === today;
    });
  }, [dbEvents, activeCity]);

  return (
    <aside className="hidden xl:block w-80 h-screen sticky top-0 bg-noctvm-black border-l border-white/5 p-6 overflow-hidden">
      {/* Map placeholder */}
      <div className="rounded-xl overflow-hidden mb-6 border border-noctvm-border">
        <div className="aspect-[4/3] bg-noctvm-midnight flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-noctvm-violet/10 flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-noctvm-violet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <p className="text-noctvm-silver text-xs">Map coming soon</p>
            <p className="text-noctvm-silver/50 text-[10px] mt-1">{activeCity === 'bucuresti' ? 'Bucharest' : 'Constanța'} venues</p>
          </div>
        </div>
      </div>

      {/* Live Tonight */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-noctvm-midnight/50 to-transparent backdrop-blur-md border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-noctvm-violet/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-noctvm-violet/10 transition-colors" />
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <span className="w-2 h-2 rounded-full bg-noctvm-emerald live-pulse"></span>
          <span className="text-[10px] uppercase tracking-widest text-noctvm-emerald font-mono font-medium">Live Tonight</span>
          <span className="ml-auto text-[10px] text-noctvm-silver font-mono">{tonightEvents.length} events</span>
        </div>
        {tonightEvents.length > 0 ? (
          <div className="space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar relative z-10 pr-1">
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
                  <span className={`fallback hidden text-[10px] font-bold bg-gradient-to-br ${getVenueColor(event.venue)} bg-clip-text text-transparent`}>
                    {event.venue[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-white truncate group-hover/event:text-noctvm-violet transition-colors">{event.title}</p>
                  <p className="text-[10px] text-noctvm-silver truncate">{event.venue}{event.time ? ` · ${event.time}` : ''}</p>
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
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-noctvm-violet/30 hover:bg-white/[0.08] transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
            >
              <div className="w-9 h-9 rounded-full border border-noctvm-border bg-noctvm-midnight flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:border-noctvm-violet/30 transition-colors">
                <img src={getVenueLogo(name)} alt={name} className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                    el.parentElement!.querySelector('.fallback')?.classList.remove('hidden');
                  }}
                />
                <span className={`fallback hidden text-xs font-heading font-bold bg-gradient-to-br ${getVenueColor(name)} bg-clip-text text-transparent`}>
                  {name[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-white group-hover:text-noctvm-violet transition-colors truncate">{name}</p>
                <p className="text-[10px] text-noctvm-silver">{count} Upcoming Events</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
