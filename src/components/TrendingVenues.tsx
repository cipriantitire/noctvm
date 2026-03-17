'use client';

import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';

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
  if (venues.length === 0) return null;

  return (
    <div className={`p-3 rounded-xl bg-white/[0.02] border border-white/5 transition-transform duration-300 ease-in-out ${headerHidden ? '-translate-y-[calc(100%+1rem)]' : ''}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[11px] font-semibold text-noctvm-silver/70 uppercase tracking-wider font-mono">Trending Venues</span>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
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
              <span className="text-[9px] text-noctvm-silver/60 text-center line-clamp-1 w-full font-medium transition-colors group-hover:text-white">{venue.name}</span>
              <span className="text-[8px] text-noctvm-silver/40 font-mono -mt-1 group-hover:text-noctvm-violet transition-colors">{venue.count} events</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
