'use client';

import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';
import { useScrollFade } from '@/hooks/useScrollFade';

import Image from 'next/image';

interface TrendingVenuesProps {
  venues: { name: string, count: number }[];
  onVenueClick: (venueName: string) => void;
  headerHidden?: boolean;
}

export default function TrendingVenues({
  venues,
  onVenueClick,
  headerHidden = false
}: TrendingVenuesProps) {
  const { ref, maskStyle } = useScrollFade('x');
  if (venues.length === 0) return null;

  return (
    <div
      data-colorbends-refraction="search-surface"
      className={`relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-noctvm-midnight/70 via-noctvm-midnight/52 to-black/25 backdrop-blur-sm border border-white/5 transition-transform duration-300 ease-in-out ${headerHidden ? '-translate-y-[calc(100%+1rem)]' : ''}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-noctvm-violet/5 rounded-full -mr-12 -mt-12 blur-2xl" />
      <div className="flex items-center gap-2 mb-2.5 relative z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald live-pulse" />
        <span className="text-noctvm-label font-semibold text-noctvm-emerald uppercase tracking-wider font-mono">Trending Venues</span>
        <span className="text-noctvm-caption text-noctvm-silver/80 ml-auto font-mono">{venues.length} venues</span>
      </div>
      <div ref={ref} style={maskStyle} className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 relative z-10">
        {venues.map(venue => {
          const logoSrc = getVenueLogo(venue.name);
          return (
            <button
              key={venue.name}
              onClick={() => onVenueClick(venue.name)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 w-[65px] group"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 group-hover:border-noctvm-violet/50 shadow-sm group-hover:shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all flex items-center justify-center bg-noctvm-midnight relative">
                <Image
                  src={logoSrc}
                  alt={venue.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  unoptimized
                />
                <span className={`fallback text-xs font-bold bg-gradient-to-br ${getVenueColor(venue.name)} bg-clip-text text-transparent hidden relative z-10`}>
                  {venue.name.charAt(0)}
                </span>
              </div>
              <span className="text-xs text-noctvm-silver/70 text-center line-clamp-1 w-full font-medium transition-colors group-hover:text-white">{venue.name}</span>
              <span className="text-noctvm-caption text-noctvm-silver/50 font-mono -mt-1 group-hover:text-noctvm-violet transition-colors">{venue.count} events</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
