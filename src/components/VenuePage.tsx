'use client';

import { useMemo } from 'react';
import { NoctEvent } from '@/lib/types';
import { SAMPLE_EVENTS } from '@/lib/events-data';
import EventCard from './EventCard';

interface VenuePageProps {
  venueName: string;
  onBack: () => void;
  onClose?: () => void;
}

const VENUE_INFO: Record<string, { description: string; address: string; capacity: string; genres: string[]; vibe: string }> = {
  'Control Club': { description: 'Underground electronic music club in the heart of Bucharest. Known for quality bookings and intimate atmosphere.', address: 'Str. Constantin Mille 4, Bucharest', capacity: '400', genres: ['Techno', 'House', 'Electronic'], vibe: 'Dark, raw, industrial warehouse feel with exposed brick and minimal lighting' },
  'Nook Club': { description: 'Boutique club experience with curated lineups and premium sound.', address: 'Str. Bd. Nicolae Balcescu 2, Bucharest', capacity: '300', genres: ['House', 'Disco', 'Electronic'], vibe: 'Sleek and intimate with warm amber tones and velvet accents' },
  'Club Guesthouse': { description: 'Multi-room venue hosting diverse events from electronic to live music.', address: 'Str. Batistei 14, Bucharest', capacity: '500', genres: ['Electronic', 'Live', 'Alternative'], vibe: 'Eclectic multi-room space, each room a different world' },
  'Expirat Halele Carol': { description: 'Legendary underground venue in Halele Carol complex. Raw industrial aesthetic.', address: 'Halele Carol, Piata Libertatii, Bucharest', capacity: '600', genres: ['Techno', 'Underground', 'Experimental'], vibe: 'Cavernous concrete halls with industrial pipes and strobes' },
  'OXYA Club': { description: 'Premium nightlife destination with world-class sound and production.', address: 'Bucharest', capacity: '800', genres: ['Electronic', 'Techno', 'House'], vibe: 'Futuristic LED-wrapped walls, massive sound system' },
};

function getVenueInfo(name: string) {
  return VENUE_INFO[name] || { description: 'A popular nightlife venue in Bucharest.', address: 'Bucharest, Romania', capacity: 'N/A', genres: ['Various'], vibe: 'Vibrant nightlife atmosphere' };
}

// Simulated gallery with themed color gradients per photo
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
  const info = getVenueInfo(venueName);
  const venueEvents = useMemo(() => SAMPLE_EVENTS.filter(e => e.venue === venueName), [venueName]);

  const today = new Date().toISOString().split('T')[0];
  const liveEvents = venueEvents.filter(e => e.date === today);
  const upcomingEvents = venueEvents.filter(e => e.date >= today);
  const pastEvents = venueEvents.filter(e => e.date < today);

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-[1800px] mx-auto px-4 lg:px-8 py-6 pb-24 lg:pb-6">
        {/* Back / Close button */}
        <button onClick={onClose || onBack} className="flex items-center gap-2 text-noctvm-silver hover:text-white transition-colors mb-4 group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          <span className="text-xs font-medium">{onClose ? 'Close' : 'Back'}</span>
        </button>

        {/* Venue header - compact */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-noctvm-violet to-purple-400 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-heading font-bold text-white">{venueName[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-xl font-bold text-white">{venueName}</h1>
              {liveEvents.length > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-noctvm-emerald/20 border border-noctvm-emerald/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald live-pulse"></span>
                  <span className="text-[9px] font-mono font-medium text-noctvm-emerald uppercase tracking-wider">LIVE</span>
                </span>
              )}
            </div>
            <p className="text-xs text-noctvm-silver mt-0.5">{info.address}</p>
            <p className="text-xs text-noctvm-silver/70 mt-1 line-clamp-2">{info.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {info.genres.map(g => (
                <span key={g} className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-medium bg-noctvm-midnight text-noctvm-violet border border-noctvm-violet/20">{g}</span>
              ))}
              <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-medium bg-noctvm-surface text-noctvm-silver border border-noctvm-border">Cap. {info.capacity}</span>
            </div>
          </div>
        </div>

        {/* Gallery - landscape thumbnails, 160px tall */}
        <div className="mb-6">
          <h3 className="font-heading text-xs font-semibold text-noctvm-silver uppercase tracking-wider mb-2">Gallery</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {GALLERY_THEMES.map((theme, i) => (
              <div
                key={i}
                className={`w-56 h-40 flex-shrink-0 rounded-xl bg-gradient-to-br ${theme.gradient} border border-noctvm-border/50 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-noctvm-violet/30 transition-all`}
              >
                {/* Decorative elements to make placeholders look more like photos */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/10"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2 backdrop-blur-sm">
                  <span className="text-sm font-heading font-bold text-white/60">{theme.icon}</span>
                </div>
                <span className="text-[10px] text-white/50 font-medium">{theme.label}</span>
                <span className="absolute bottom-2 right-2 text-[8px] text-white/20 font-mono">{i + 1}/8</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vibe description */}
        <div className="mb-6 p-4 rounded-xl bg-noctvm-surface/50 border border-noctvm-border">
          <h3 className="font-heading text-xs font-semibold text-noctvm-silver uppercase tracking-wider mb-1">The Vibe</h3>
          <p className="text-xs text-noctvm-silver/80 leading-relaxed italic">&ldquo;{info.vibe}&rdquo;</p>
        </div>

        {/* Live Events */}
        {liveEvents.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-noctvm-emerald live-pulse"></span>
              <h3 className="font-heading text-xs font-semibold text-noctvm-emerald uppercase tracking-wider">Happening Now</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {liveEvents.map((event, i) => <EventCard key={i} event={event} />)}
            </div>
          </div>
        )}

        {/* Upcoming Events - same grid as events page */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-xs font-semibold text-white uppercase tracking-wider">Upcoming Events</h3>
            <span className="text-[10px] text-noctvm-silver font-mono">{upcomingEvents.length} events</span>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {upcomingEvents.map((event, i) => <EventCard key={i} event={event} />)}
            </div>
          ) : (
            <p className="text-xs text-noctvm-silver/60 py-4">No upcoming events scheduled</p>
          )}
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-xs font-semibold text-noctvm-silver uppercase tracking-wider">Past Events</h3>
              <span className="text-[10px] text-noctvm-silver/50 font-mono">{pastEvents.length} events</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-50">
              {pastEvents.slice(0, 4).map((event, i) => <EventCard key={i} event={event} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
