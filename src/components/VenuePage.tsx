'use client';

import { useMemo, useState, useRef } from 'react';
import { NoctEvent } from '@/lib/types';
import { SAMPLE_EVENTS } from '@/lib/events-data';
import { getVenueLogo } from '@/lib/venue-logos';
import EventCard from './EventCard';

interface VenuePageProps {
  venueName: string;
  onBack: () => void;
  onClose?: () => void;
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

export default function VenuePage({ venueName, onBack, onClose }: VenuePageProps) {
  const [viewMode, setViewMode] = useState<'portrait' | 'landscape'>('landscape');
  const info = getVenueInfo(venueName);
  const venueEvents = useMemo(() => SAMPLE_EVENTS.filter(e => e.venue === venueName), [venueName]);

  const today = new Date().toISOString().split('T')[0];
  const liveEvents = venueEvents.filter(e => e.date === today);
  const upcomingEvents = venueEvents.filter(e => e.date > today);
  const pastEvents = venueEvents.filter(e => e.date < today);

  const logoSrc = getVenueLogo(venueName);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="p-4 lg:p-6 overflow-y-auto flex-1 min-h-0">
      {/* Header */}
      <div className="h-6" /> {/* Spacer instead of header */}

      {/* Venue Identity */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl overflow-hidden border border-noctvm-border flex items-center justify-center bg-noctvm-midnight flex-shrink-0 shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={venueName}
            className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              el.parentElement!.querySelector('.fallback')?.classList.remove('hidden');
            }}
          />
          <span className="fallback hidden text-4xl font-bold text-noctvm-violet">{venueName.charAt(0)}</span>
        </div>
        <div className="flex-1 pt-1">
          <h1 className="text-2xl lg:text-4xl font-bold text-white leading-tight">{venueName}</h1>
          <p className="text-noctvm-silver font-medium text-xs lg:text-sm mt-0.5">{info.address}</p>
          <div className="flex flex-wrap gap-1.5 mt-2 mb-4">
            {info.genres.map(g => (
              <span key={g} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-noctvm-violet/10 text-noctvm-violet border border-noctvm-violet/20">
                {g}
              </span>
            ))}
          </div>
          <p className="text-noctvm-silver/90 text-sm leading-relaxed max-w-4xl">{info.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        <div className="text-center p-4 rounded-2xl liquid-glass-subtle">
          <p className="text-xl font-bold text-white">{venueEvents.length}</p>
          <p className="text-[10px] text-noctvm-silver/60 uppercase tracking-widest mt-1">Events</p>
        </div>
        <div className="text-center p-4 rounded-2xl liquid-glass-subtle">
          <p className="text-xl font-bold text-white">{info.capacity}</p>
          <p className="text-[10px] text-noctvm-silver/60 uppercase tracking-widest mt-1">Capacity</p>
        </div>
        <div className="text-center p-4 rounded-2xl liquid-glass-subtle">
          <p className="text-xl font-bold text-noctvm-gold font-mono">4.5</p>
          <p className="text-[10px] text-noctvm-silver/60 uppercase tracking-widest mt-1">Rating</p>
        </div>
      </div>

      <div className="h-4" /> {/* Spacer */}

      {/* Gallery */}
      <div className="mb-10 relative group/gallery">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.3em] opacity-30">Gallery</h3>
          <div className="flex p-1 rounded-xl bg-noctvm-surface border border-noctvm-border shadow-inner">
            <button 
              onClick={() => scroll('left')}
              className="p-2 rounded-lg text-noctvm-silver hover:text-white hover:bg-noctvm-violet transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <div className="w-px h-4 bg-noctvm-border self-center mx-1 opacity-50" />
            <button 
              onClick={() => scroll('right')}
              className="p-2 rounded-lg text-noctvm-silver hover:text-white hover:bg-noctvm-violet transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide -mx-2 px-2 snap-x snap-mandatory"
        >
          {GALLERY_THEMES.map((theme) => (
            <div key={theme.label} className="snap-start flex-shrink-0 w-full sm:w-[48%] lg:w-[23.5%]">
              <div className={`aspect-video rounded-3xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center border border-white/5 group hover:border-white/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-xl relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-center group-hover:transform group-hover:scale-110 transition-transform relative z-10">
                  <span className="text-5xl font-bold text-white/10 group-hover:text-white/30 transition-colors uppercase tracking-tighter">{theme.icon}</span>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-3">{theme.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Now */}
      {liveEvents.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-noctvm-emerald animate-pulse-slow shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <h3 className="text-sm font-bold text-noctvm-emerald uppercase tracking-widest">Live Now</h3>
          </div>
          <div className="space-y-4">
            {liveEvents.map(event => <EventCard key={event.id} event={event} variant="landscape" />)}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingEvents.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Upcoming Events</h3>
            <div className="flex p-1 rounded-xl bg-noctvm-surface border border-noctvm-border shadow-inner">
              <button
                onClick={() => setViewMode('portrait')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'portrait' ? 'bg-noctvm-violet text-white shadow-xl scale-110' : 'text-noctvm-silver hover:text-white'}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
              </button>
              <button
                onClick={() => setViewMode('landscape')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'landscape' ? 'bg-noctvm-violet text-white shadow-xl scale-110' : 'text-noctvm-silver hover:text-white'}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>
            </div>
          </div>
          <div className={`${viewMode === 'portrait' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4 gap-5" : "space-y-4"}`}>
            {upcomingEvents.map(event => <EventCard key={event.id} event={event} variant={viewMode} />)}
          </div>
        </div>
      )}

      {/* Past */}
      {pastEvents.length > 0 && (
        <div className="pb-10">
          <h3 className="text-xs font-bold text-noctvm-silver/40 mb-4 uppercase tracking-[0.2em]">Past Events</h3>
          <div className="space-y-4 opacity-50 grayscale hover:grayscale-0 transition-all">
            {pastEvents.map(event => <EventCard key={event.id} event={event} variant="landscape" />)}
          </div>
        </div>
      )}
    </div>
  );
}
