'use client';

import { NoctEvent } from '@/lib/types';

import Image from 'next/image';

interface LiveTonightProps {
  events: NoctEvent[];
  onEventClick: (event: NoctEvent) => void;
  headerHidden?: boolean;
}

export default function LiveTonight({ 
  events, 
  onEventClick,
  headerHidden = false 
}: LiveTonightProps) {
  if (events.length === 0) return null;

  return (
    <div
      data-colorbends-refraction="search-surface"
      className={`p-3 rounded-xl bg-gradient-to-br from-noctvm-midnight/50 to-transparent backdrop-blur-sm border border-white/5 transition-transform duration-300 ease-in-out relative group overflow-hidden ${headerHidden ? '-translate-y-[calc(100%+1rem)]' : ''}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-noctvm-violet/5 rounded-full -mr-12 -mt-12 blur-2xl" />
      <div className="flex items-center gap-2 mb-2 relative z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald live-pulse" />
        <span className="text-noctvm-label font-semibold text-noctvm-emerald uppercase tracking-wider font-mono">Live Tonight</span>
        <span className="text-noctvm-caption text-noctvm-silver/50 ml-auto font-mono">{events.length} events</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-1 px-1 relative z-10">
        {events.slice(0, 5).map(event => (
          <button
            key={event.id}
            onClick={() => onEventClick(event)}
            className="flex-shrink-0 w-[140px] rounded-lg overflow-hidden border border-white/5 bg-black/20 hover:border-noctvm-violet/40 transition-all active:scale-95 text-left group/card"
          >
            <div className="aspect-[3/2] bg-noctvm-midnight relative overflow-hidden">
              <Image 
                src={event.image_url || '/images/event-fallback.png'} 
                alt={event.title} 
                fill
                className="object-cover group-hover/card:scale-105 transition-transform duration-500" 
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div className="p-1.5">
              <p className="text-noctvm-caption font-medium text-white line-clamp-1 group-hover/card:text-noctvm-violet transition-colors">{event.title}</p>
              <p className="text-noctvm-micro text-noctvm-silver/60 truncate">{event.venue}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
