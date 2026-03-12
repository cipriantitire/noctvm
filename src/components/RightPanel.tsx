'use client';

import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';

interface RightPanelProps {
  onVenueClick?: (venueName: string) => void;
}

export default function RightPanel({ onVenueClick }: RightPanelProps) {
  // Get tonight's events
  const tonightEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return SAMPLE_EVENTS.filter(e => e.date === today);
  }, []);

  // Get trending venues (most events)
  const trendingVenues = useMemo(() => {
    const counts: Record<string, { count: number; image: string }> = {};
    SAMPLE_EVENTS.forEach(e => {
      if (!counts[e.venue]) {
        counts[e.venue] = { count: 0, image: e.image_url };
      }
      counts[e.venue].count++;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 6)
      .map(([name, data]) => ({ name, ...data }));
  }, []);

  return (
    <aside className="hidden xl:block w-80 h-screen sticky top-0 bg-noctvm-black border-l border-noctvm-border p-6 overflow-y-auto">
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
            <p className="text-noctvm-silver/50 text-[10px] mt-1">Bucharest venues</p>
          </div>
        </div>
      </div>

      {/* Live Tonight */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-noctvm-midnight to-noctvm-black border border-noctvm-violet/20">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-noctvm-emerald live-pulse"></span>
          <span className="text-[10px] uppercase tracking-widest text-noctvm-emerald font-mono font-medium">Live Tonight</span>
          <span className="ml-auto text-[10px] text-noctvm-silver font-mono">{tonightEvents.length} events</span>
        </div>
        {tonightEvents.length > 0 ? (
          <div className="space-y-2.5 max-h-48 overflow-y-auto">
            {tonightEvents.slice(0, 5).map((event, i) => (
              <a
                key={i}
                href={event.event_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full border border-noctvm-border bg-noctvm-midnight flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:border-noctvm-violet/30 transition-colors">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
                  <p className="text-[11px] font-medium text-white truncate group-hover:text-noctvm-violet transition-colors">{event.title}</p>
                  <p className="text-[10px] text-noctvm-silver">{event.venue}{event.time ? ` \u00b7 ${event.time}` : ''}</p>
                </div>
              </a>
            ))}
            {tonightEvents.length > 5 && (
              <p className="text-[10px] text-noctvm-violet text-center pt-1 font-medium">+{tonightEvents.length - 5} more tonight</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-noctvm-silver/60">No events scheduled for tonight</p>
        )}
      </div>

      {/* Trending venues */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-white mb-3">Trending Venues</h3>
        <div className="space-y-2">
          {trendingVenues.map(({ name, count }) => (
            <button
              key={name}
              onClick={() => onVenueClick?.(name)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-noctvm-surface border border-noctvm-border hover:border-noctvm-violet/30 transition-colors cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full border border-noctvm-border bg-noctvm-midnight flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:border-noctvm-violet/30 transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white group-hover:text-noctvm-violet transition-colors">{name}</p>
                <p className="text-[10px] text-noctvm-silver">{count} upcoming event{count !== 1 ? 's' : ''}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}