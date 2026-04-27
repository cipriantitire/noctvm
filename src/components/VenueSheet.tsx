'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { NoctEvent } from '@/lib/types';
import { SAMPLE_EVENTS } from '@/lib/events-data';
import { getVenueLogo } from '@/lib/venue-logos';
import { supabase } from '@/lib/supabase';
import { Venue } from '@/lib/types';
import EventCard from './EventCard';
import VerifiedBadge from './VerifiedBadge';
import Image from 'next/image';
import CurvedScrollBar from './ui/CurvedScrollBar';
import { useScrollFade } from '@/hooks/useScrollFade';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/Sheet';

interface VenueSheetProps {
  venueName: string;
  onBack: () => void;
  onClose?: () => void;
  onEventClick?: (event: NoctEvent) => void;
}

const VENUE_INFO: Record<string, { description: string; address: string; capacity: string; genres: string[] }> = {
  'Control Club': { description: 'Underground electronic music club in the heart of Bucharest. Known for quality bookings and intimate atmosphere.', address: 'Str. Constantin Mille 4, Bucharest', capacity: '400', genres: ['Techno', 'House', 'Electronic'] },
  'Nook Club': { description: 'Boutique club experience with curated lineups and premium sound.', address: 'Str. Bd. Nicolae Balcescu 2, Bucharest', capacity: '300', genres: ['House', 'Disco', 'Electronic'] },
  'Club Guesthouse': { description: 'Multi-room venue hosting diverse events from electronic to live music.', address: 'Str. Batistei 14, Bucharest', capacity: '500', genres: ['Electronic', 'Live', 'Alternative'] },
  'Expirat Halele Carol': { description: 'Legendary underground venue in Halele Carol complex. Raw industrial aesthetic.', address: 'Halele Carol, Piata Libertatii, Bucharest', capacity: '600', genres: ['Techno', 'Underground', 'Experimental'] },
  'OXYA Club': { description: 'Premium nightlife destination with world-class sound and production.', address: 'Bucharest', capacity: '800', genres: ['Electronic', 'Techno', 'House'] },
};

function getVenueInfo(name: string) {
  return VENUE_INFO[name] || { description: 'A popular nightlife venue in Bucharest.', address: 'Bucharest, Romania', capacity: 'N/A', genres: ['Various'] };
}

const GALLERY_THEMES = [
  { gradient: 'from-purple-900/80 via-noctvm-midnight to-indigo-900/60', label: 'Main Room', icon: 'M' },
  { gradient: 'from-red-900/60 via-noctvm-midnight to-orange-900/40', label: 'DJ Booth', icon: 'D' },
  { gradient: 'from-blue-900/60 via-noctvm-midnight to-cyan-900/40', label: 'Crowd', icon: 'C' },
  { gradient: 'from-emerald-900/60 via-noctvm-midnight to-teal-900/40', label: 'Lounge', icon: 'L' },
  { gradient: 'from-pink-900/60 via-noctvm-midnight to-rose-900/40', label: 'Entrance', icon: 'E' },
  { gradient: 'from-amber-900/60 via-noctvm-midnight to-yellow-900/40', label: 'Bar', icon: 'B' },
  { gradient: 'from-violet-900/60 via-noctvm-midnight to-fuchsia-900/40', label: 'Outside', icon: 'O' },
  { gradient: 'from-sky-900/60 via-noctvm-midnight to-blue-900/40', label: 'VIP', icon: 'V' },
];

export default function VenueSheet({ venueName, onBack, onClose, onEventClick }: VenueSheetProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'portrait' | 'landscape'>('landscape');
  const [dbEvents, setDbEvents] = useState<NoctEvent[]>([]);
  const [venue, setVenue] = useState<Venue | null>(null);
  const info = getVenueInfo(venueName);

  useEffect(() => {
    supabase
      .from('venues')
      .select('*')
      .eq('name', venueName)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setVenue(data as Venue);
      });
  }, [venueName]);

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .or(`venue.ilike.%${venueName}%,venue.ilike.%${venueName.replace(/([a-zA-Z])(\d)/g, '$1 $2')}%`)
      .order('date', { ascending: true })
      .then(({ data }) => {
        if (data) setDbEvents(data as NoctEvent[]);
      });
  }, [venueName]);

  const venueEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetNorm = norm(venueName);

    const dbRaw = dbEvents.filter(e => {
      const vNorm = norm(e.venue);
      return vNorm === targetNorm || vNorm.includes(targetNorm) || targetNorm.includes(vNorm);
    });

    if (dbRaw.length > 0) {
      return dbRaw.sort((a, b) => a.date.localeCompare(b.date));
    }

    const sampleRaw = SAMPLE_EVENTS.filter(e => {
      const vNorm = norm(e.venue);
      return (vNorm === targetNorm || vNorm.includes(targetNorm) || targetNorm.includes(vNorm)) && e.date >= today;
    });

    return sampleRaw.sort((a, b) => a.date.localeCompare(b.date));
  }, [venueName, dbEvents]);

  const today = new Date().toISOString().split('T')[0];
  const liveEvents = venueEvents.filter(e => e.date === today);
  const upcomingEvents = venueEvents.filter(e => e.date > today);
  const pastEvents = venueEvents.filter(e => e.date < today);

  useEffect(() => {
    if (upcomingEvents.length > 4 || pastEvents.length > 4) {
      setViewMode('portrait');
    }
  }, [upcomingEvents.length, pastEvents.length]);

  const { ref: galleryScrollRef, maskStyle: galleryMaskStyle } = useScrollFade('x');

  const venuePhotos: string[] = Array.isArray(venue?.photos)
    ? (venue!.photos as string[]).map((ref: string) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDFcufnUYpyjAi7vuA2vgwYhodb3K93UU0'}`)
    : [];

  const scrollGallery = (direction: 'left' | 'right') => {
    const el = galleryScrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.getBoundingClientRect().width ?? el.clientWidth * 0.48;
    const gap = 20;
    const scrollAmount = cardWidth + gap;
    const target = direction === 'left' ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount;
    el.scrollTo({ left: target, behavior: 'smooth' });
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      onBack();
      onClose?.();
    }, 350);
  }, [onBack, onClose]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent
        side="bottom"
        overlayClassName="!bg-noctvm-black/70 backdrop-blur-md"
        className="h-auto max-h-[95vh] bg-noctvm-black border-noctvm-border border-t p-0 rounded-t-3xl overflow-hidden flex flex-col min-h-0 corner-smooth"
        showCloseButton={false}
      >
        <CurvedScrollBar className="flex-1 min-h-0" viewportClassName="p-4 overscroll-contain" edgePadding={4} verticalInset={4} cornerRadius={16} fadeEdges>
          {/* Header */}
          <button
            onClick={handleClose}
            title="Go back"
            className="w-9 h-9 rounded-full bg-noctvm-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-noctvm-silver hover:text-foreground hover:bg-noctvm-black/80 transition-all mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Venue Identity */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-noctvm-border flex items-center justify-center bg-noctvm-midnight flex-shrink-0 shadow-2xl relative">
              <Image
                src={getVenueLogo(venueName, venue?.logo_url)}
                alt={venueName}
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  const el = (e.target as any).parentElement;
                  el.querySelector('.fallback')?.classList.remove('hidden');
                }}
              />
              <span className="fallback hidden text-3xl font-bold text-noctvm-violet absolute inset-0 flex items-center justify-center">{venueName.charAt(0)}</span>
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground leading-tight">{venueName}</h1>
                {venue?.badge && venue.badge !== 'none' && (
                  <VerifiedBadge type={venue.badge} size="sm" className="translate-y-0.5" />
                )}
              </div>
              <p className="text-noctvm-silver font-medium text-xs mt-0.5">{venue?.address || info.address}</p>
              <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                {info.genres.map(g => (
                  <span key={g} className="px-2 py-0.5 rounded-full text-noctvm-caption font-semibold bg-noctvm-violet/10 text-noctvm-violet border border-noctvm-violet/20">
                    {g}
                  </span>
                ))}
                {venue?.website && (
                  <a href={venue.website} target="_blank" rel="noopener noreferrer" className="px-2.5 py-0.5 rounded-full text-noctvm-caption font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-300/20">
                    Website ↗
                  </a>
                )}
                {venue?.facebook && (
                  <a href={venue.facebook} target="_blank" rel="noopener noreferrer" className="px-2.5 py-0.5 rounded-full text-noctvm-caption font-semibold bg-blue-950/50 text-blue-300 border border-blue-300/20">
                    Facebook ↗
                  </a>
                )}
                {venue?.instagram && (
                  <a href={venue.instagram} target="_blank" rel="noopener noreferrer" className="px-2.5 py-0.5 rounded-full text-noctvm-caption font-semibold bg-pink-950/50 text-pink-300 border border-pink-300/20">
                    Instagram ↗
                  </a>
                )}
              </div>
              <p className="text-noctvm-silver/90 text-sm leading-relaxed">{venue?.description || info.description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="text-center p-3 rounded-2xl frosted-glass-subtle">
              <p className="text-lg font-bold text-foreground">{venueEvents.length}</p>
              <p className="text-noctvm-caption text-noctvm-silver/60 uppercase tracking-widest mt-1">Events</p>
            </div>
            <div className="text-center p-3 rounded-2xl frosted-glass-subtle">
              <p className="text-lg font-bold text-foreground">{info.capacity}</p>
              <p className="text-noctvm-caption text-noctvm-silver/60 uppercase tracking-widest mt-1">Capacity</p>
            </div>
            <div className="text-center p-3 rounded-2xl frosted-glass-subtle">
              <p className="text-lg font-bold text-noctvm-gold font-mono">
                {venue?.rating ? venue.rating.toFixed(1) : '0.0'}
              </p>
              <p className="text-noctvm-caption text-noctvm-silver/60 uppercase tracking-widest mt-1">Rating</p>
            </div>
          </div>

          {/* Gallery */}
          {venuePhotos.length > 0 && (
            <div className="mb-8 relative group/gallery">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-noctvm-caption font-bold text-foreground uppercase tracking-[0.3em] opacity-30">Gallery</h3>
                <div className="flex p-1 rounded-xl bg-noctvm-surface border border-noctvm-border shadow-inner">
                  <button onClick={() => scrollGallery('left')} className="p-2 rounded-lg text-noctvm-silver hover:text-foreground hover:bg-noctvm-violet transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                  </button>
                  <div className="w-px h-4 bg-noctvm-border self-center mx-1 opacity-50" />
                  <button onClick={() => scrollGallery('right')} className="p-2 rounded-lg text-noctvm-silver hover:text-foreground hover:bg-noctvm-violet transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                  </button>
                </div>
              </div>
              <div ref={galleryScrollRef} style={galleryMaskStyle} className="flex gap-5 overflow-x-auto py-4 pb-6 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory">
                {venuePhotos.map((url, i) => (
                  <div key={i} className="snap-start flex-shrink-0 w-[85vw] sm:w-[48%] lg:w-[32%]">
                    <div className="aspect-video rounded-3xl overflow-hidden border border-white/5 hover:border-white/20 transition-all hover:scale-[1.02] active:scale-[0.96] cursor-pointer shadow-xl relative">
                      <img src={url} alt={`${venueName} photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Now */}
          {liveEvents.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-noctvm-emerald animate-pulse-slow shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <h3 className="text-sm font-bold text-noctvm-emerald uppercase tracking-widest">Live Tonight</h3>
              </div>
              <div className="space-y-4">
                {liveEvents.map(event => <EventCard key={event.id} event={event} variant="landscape" onClick={onEventClick} />)}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingEvents.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Upcoming Events</h3>
                <div className="flex p-1 rounded-xl bg-noctvm-surface border border-noctvm-border shadow-inner">
                  <button
                    onClick={() => setViewMode('portrait')}
                    title="Portrait view"
                    className={`p-2 rounded-lg transition-all ${viewMode === 'portrait' ? 'bg-noctvm-violet text-foreground shadow-xl scale-110' : 'text-noctvm-silver hover:text-foreground'}`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
                  </button>
                  <button
                    onClick={() => setViewMode('landscape')}
                    title="Landscape view"
                    className={`p-2 rounded-lg transition-all ${viewMode === 'landscape' ? 'bg-noctvm-violet text-foreground shadow-xl scale-110' : 'text-noctvm-silver hover:text-foreground'}`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                  </button>
                </div>
              </div>
              <div className={`${viewMode === 'portrait' ? "grid grid-cols-2 gap-4" : "space-y-4"}`}>
                {upcomingEvents.map(event => <EventCard key={event.id} event={event} variant={viewMode} onClick={onEventClick} />)}
              </div>
            </div>
          )}

          {/* Past */}
          {pastEvents.length > 0 && (
            <div className="pb-8">
              <h3 className="text-xs font-bold text-noctvm-silver/40 mb-4 uppercase tracking-[0.2em]">Past Events</h3>
              <div className="space-y-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                {pastEvents.map(event => <EventCard key={event.id} event={event} variant={viewMode} onClick={onEventClick} />)}
              </div>
            </div>
          )}
        </CurvedScrollBar>
      </SheetContent>
    </Sheet>
  );
}
