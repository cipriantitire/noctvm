'use client';

import Image from 'next/image';
import { ArrowRight, MapPin } from 'lucide-react';
import type { NoctEvent, Venue } from '@/lib/types';
import { getVenueColor, getVenueLogo } from '@/lib/venue-logos';

interface MapVenuePopupProps {
  venue: Venue;
  isEventsMode: boolean;
  events?: NoctEvent[];
  eventCount: number;
  onVenueClick?: (venueName: string) => void;
  onEventClick?: (event: NoctEvent) => void;
}

export default function MapVenuePopup({
  venue,
  isEventsMode,
  events = [],
  eventCount,
  onVenueClick,
  onEventClick,
}: MapVenuePopupProps) {
  const visibleEvents = isEventsMode ? events.slice(0, 2) : [];
  const remainingEvents = Math.max(0, eventCount - visibleEvents.length);
  const summaryChip = !isEventsMode && eventCount > 0
    ? `${eventCount.toLocaleString()} events`
    : !isEventsMode && venue.genres[0]
      ? venue.genres[0]
      : null;

  const handleClick = () => {
    onVenueClick?.(venue.name);
  };

  return (
    <div className="group/map-popup relative flex w-[min(252px,calc(100vw-24px))] flex-col overflow-hidden rounded-[18px] border border-white/10 bg-noctvm-surface/96 text-left shadow-[0_18px_42px_rgba(0,0,0,0.48)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_42%)]" />

      <button
        type="button"
        aria-label={`Open venue ${venue.name}`}
        title={`Open venue ${venue.name}`}
        onClick={handleClick}
        className="relative z-10 flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noctvm-violet/60"
      >
        <div className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${getVenueColor(venue.name)} shadow-[0_8px_18px_rgba(0,0,0,0.22)]`}>
          <div className="absolute inset-0 bg-noctvm-black/20" />
          <Image
            src={getVenueLogo(venue.name, venue.logo_url)}
            alt={venue.name}
            fill
            sizes="40px"
            unoptimized
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
          <p className="m-0 truncate text-noctvm-base font-semibold leading-[14px] text-foreground">
            {venue.name}
          </p>

          <div className="flex min-w-0 items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0 text-noctvm-silver/45" />
            <p className="m-0 min-w-0 truncate text-noctvm-caption leading-[12px] text-noctvm-silver/60">
              {venue.address}
            </p>
          </div>

          {summaryChip ? (
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-noctvm-micro font-semibold uppercase tracking-[0.18em] text-foreground/[0.78]">
                {summaryChip}
              </span>
            </div>
          ) : null}
        </div>
      </button>

      {visibleEvents.length > 0 ? (
        <div className="relative z-10 border-t border-white/5 px-2 pb-2 pt-1.5">
          <div className="space-y-1">
            {visibleEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                aria-label={`Open event ${event.title}`}
                title={`Open event ${event.title}`}
                onClick={() => onEventClick?.(event)}
                className="flex w-full items-center gap-1.5 rounded-[11px] px-1.5 py-1 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noctvm-violet/60"
              >
                <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-noctvm-micro font-semibold uppercase tracking-[0.18em] text-noctvm-silver/80">
                  {event.time || 'Now'}
                </span>
                <p className="min-w-0 flex-1 truncate text-noctvm-caption font-medium leading-none text-foreground">
                  {event.title}
                </p>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-noctvm-silver/50" />
              </button>
            ))}
          </div>

          {remainingEvents > 0 ? (
            <p className="mt-1 px-1 text-noctvm-micro font-semibold uppercase tracking-[0.2em] text-noctvm-silver/40">
              +{remainingEvents} more
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}