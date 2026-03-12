'use client';

import { useMemo, useState } from 'react';
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

  return (
    <div className="p-4 lg:p-6 overflow-y-auto flex-1 min-h-0">
      {/* Header */}
      <div className="h-6" /> {/* Spacer instead of header */}

      {/* Venue Identity */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden border border-noctvm-border flex items-center justify-center bg-noctvm-midnight flex-shrink-0">
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
          <span className="fallback hidden text-2xl font-bold text-noctvm-violet">{venueName.charAt(0)}</span>
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">{venueName}</h1>
          <p className="text-noctvm-silver/70 text-sm">{info.address}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {info.genres.map(g => (
              <span key={g} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-noctvm-violet/10 text-noctvm-violet border border-noctvm-violet/20">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 rounded-xl liquid-glass-subtle">
          <p className="text-lg font-bold text-white">{venueEvents.length}</p>
          <p className="text-[10px] text-noctvm-silver/60">Events</p>
        </div>
        <div className="text-center p-3 rounded-xl liquid-glass-subtle">
          <p className="text-lg font-bold text-white">{info.capacity}</p>
          <p className="text-[10px] text-noctvm-silver/60">Capacity</p>
        </div>
        <div className="text-center p-3 rounded-xl liquid-glass-subtle">
          <p className="text-lg font-bold text-noctvm-gold">4.5</p>
          <p className="text-[10px] text-noctvm-silver/60">Rating</p>
        </div>
      </div>

      {/* About */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-white mb-2">About</h3>
        <p className="text-noctvm-silver/80 text-sm leading-relaxed">{info.description}</p>
      </div>

      {/* Gallery */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-white mb-3">Gallery</h3>
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-2 px-2">
          {GALLERY_THEMES.map((theme) => (
            <div key={theme.label} className={`flex-shrink-0 w-80 sm:w-96 aspect-[21/9] rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center border border-white/5 group hover:border-white/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-xl`}>
              <div className="text-center group-hover:transform group-hover:scale-110 transition-transform">
                <span className="text-4xl font-bold text-white/20 group-hover:text-white/40 transition-colors">{theme.icon}</span>
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mt-2">{theme.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Now */}
      {liveEvents.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-noctvm-emerald animate-pulse-slow" />
            <h3 className="text-sm font-semibold text-noctvm-emerald">Live Now</h3>
          </div>
          <div className="space-y-3">
            {liveEvents.map(event => <EventCard key={event.id} event={event} variant="landscape" />)}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingEvents.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Upcoming Events</h3>
            <div className="flex p-0.5 rounded-lg bg-noctvm-surface border border-noctvm-border">
              <button
                onClick={() => setViewMode('portrait')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'portrait' ? 'bg-noctvm-violet text-white shadow-lg' : 'text-noctvm-silver hover:text-white'}`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              </button>
              <button
                onClick={() => setViewMode('landscape')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'landscape' ? 'bg-noctvm-violet text-white shadow-lg' : 'text-noctvm-silver hover:text-white'}`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>
            </div>
          </div>
          <div className={`${viewMode === 'portrait' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-3"}`}>
            {upcomingEvents.map(event => <EventCard key={event.id} event={event} variant={viewMode} />)}
          </div>
        </div>
      )}

      {/* Past */}
      {pastEvents.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-noctvm-silver/60 mb-3">Past Events</h3>
          <div className="space-y-3 opacity-60">
            {pastEvents.map(event => <EventCard key={event.id} event={event} variant="landscape" />)}
          </div>
        </div>
      )}
    </div>
  );
}
