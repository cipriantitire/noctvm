'use client';

import { useMemo } from 'react';
import { NoctEvent } from '@/lib/types';
import EventCard from './EventCard';

interface VenuePageProps {
  venueName: string;
  events: NoctEvent[];
  onBack: () => void;
}

const VENUE_INFO: Record<string, { description: string; address: string; capacity: string; genres: string[] }> = {
  'Control Club': { description: 'Underground electronic music club in the heart of Bucharest. Known for quality bookings and intimate atmosphere.', address: 'Str. Constantin Mille 4, Bucharest', capacity: '400', genres: ['Techno', 'House', 'Electronic'] },
  'Nook Club': { description: 'Boutique club experience with curated lineups and premium sound.', address: 'Str. Bd. Nicolae Balcescu 2, Bucharest', capacity: '300', genres: ['House', 'Disco', 'Electronic'] },
  'Club Guesthouse': { description: 'Multi-room venue hosting diverse events from electronic to live music.', address: 'Str. Batistei 14, Bucharest', capacity: '500', genres: ['Electronic', 'Live', 'Alternative'] },
  'Expirat Halele Carol': { description: 'Legendary underground venue in Halele Carol complex. Raw industrial aesthetic.', address: 'Halele Carol, Piata Libertatii, Bucharest', capacity: '600', genres: ['Techno', 'Underground', 'Experimental'] },
};

function getVenueInfo(name: string) {
  return VENUE_INFO[name] || { description: 'A popular nightlife venue in Bucharest.', address: 'Bucharest, Romania', capacity: 'N/A', genres: ['Various'] };
}

export default function VenuePage({ venueName, events, onBack }: VenuePageProps) {
  const info = getVenueInfo(venueName);
  
  const venueEvents = useMemo(() => events.filter(e => e.venue === venueName), [events, venueName]);
  
  const today = new Date().toISOString().split('T')[0];
  const liveEvents = venueEvents.filter(e => e.date === today);
  const upcomingEvents = venueEvents.filter(e => e.date >= today);
  const pastEvents = venueEvents.filter(e => e.date < today);

  return (
    <div>
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-noctvm-silver hover:text-white transition-colors mb-6 group">
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        <span className="text-sm font-medium">Back to Events</span>
      </button>

      {/* Venue header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-noctvm-violet to-purple-400 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-heading font-bold text-white">{venueName[0]}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold text-white">{venueName}</h1>
              {liveEvents.length > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-noctvm-emerald/20 border border-noctvm-emerald/30">
                  <span className="w-2 h-2 rounded-full bg-noctvm-emerald live-pulse"></span>
                  <span className="text-[10px] font-mono font-medium text-noctvm-emerald uppercase tracking-wider">LIVE NOW</span>
                </span>
              )}
            </div>
            <p className="text-sm text-noctvm-silver mt-1">{info.address}</p>
          </div>
        </div>
        <p className="text-sm text-noctvm-silver/80 leading-relaxed">{info.description}</p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {info.genres.map(g => (
            <span key={g} className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-medium bg-noctvm-midnight text-noctvm-violet border border-noctvm-violet/20">{g}</span>
          ))}
          <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-medium bg-noctvm-surface text-noctvm-silver border border-noctvm-border">Cap. {info.capacity}</span>
        </div>
      </div>

      {/* Gallery placeholder */}
      <div className="mb-8">
        <h3 className="font-heading text-sm font-semibold text-white mb-3">Gallery</h3>
        <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
          {[1,2,3].map(i => (
            <div key={i} className="aspect-square bg-noctvm-surface border border-noctvm-border flex items-center justify-center">
              <span className="text-[10px] text-noctvm-silver/30 font-mono">Photo {i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Events */}
      {liveEvents.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-noctvm-emerald live-pulse"></span>
            <h3 className="font-heading text-sm font-semibold text-noctvm-emerald">Happening Now</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {liveEvents.map((event, i) => <EventCard key={i} event={event} />)}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="mb-8">
        <h3 className="font-heading text-sm font-semibold text-white mb-3">Upcoming Events ({upcomingEvents.length})</h3>
        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingEvents.map((event, i) => <EventCard key={i} event={event} />)}
          </div>
        ) : (
          <p className="text-xs text-noctvm-silver/60 py-4">No upcoming events scheduled</p>
        )}
      </div>

      {/* Past Events */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-noctvm-silver mb-3">Past Events ({pastEvents.length})</h3>
        {pastEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-60">
            {pastEvents.slice(0, 4).map((event, i) => <EventCard key={i} event={event} />)}
          </div>
        ) : (
          <p className="text-xs text-noctvm-silver/60 py-4">No past events recorded yet</p>
        )}
      </div>
    </div>
  );
}
