'use client';

/**
 * /figma-export/venues
 * Static Venues screen design comp — mobile + desktop.
 */

import React, { useState } from 'react';
import { Avatar, Badge, Button, GlassPanel, SearchBox, Chip } from '@/components/ui';
import { EventsIcon, FeedIcon, VenuesIcon, PocketIcon, UserIcon, StarIcon } from '@/components/icons';
import { MapPin, Clock, Music, Users } from 'lucide-react';

const MOCK_VENUES = [
  {
    id: '1',
    name: 'Control Club',
    city: 'București',
    type: 'Club',
    genres: ['Techno', 'Minimal', 'Experimental'],
    rating: 4.8,
    reviews: 312,
    capacity: 500,
    description: 'Iconic underground club in the heart of Bucharest, hosting the best techno and electronic music events.',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
    openNow: true,
  },
  {
    id: '2',
    name: 'OXYA Club',
    city: 'București',
    type: 'Club',
    genres: ['House', 'Party', 'R&B'],
    rating: 4.5,
    reviews: 218,
    capacity: 1200,
    description: 'Premier entertainment venue with multiple floors and world-class production.',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
    openNow: true,
  },
  {
    id: '3',
    name: 'Expirat',
    city: 'București',
    type: 'Bar/Club',
    genres: ['Indie', 'Electronic', 'Alternative'],
    rating: 4.6,
    reviews: 156,
    capacity: 300,
    description: 'Eclectic venue on the banks of the Dâmbovița with a beautiful terrace.',
    image: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d9a?w=600&q=80',
    openNow: false,
  },
  {
    id: '4',
    name: 'Quantic',
    city: 'București',
    type: 'Club',
    genres: ['Jazz', 'Electronic', 'Fusion'],
    rating: 4.7,
    reviews: 189,
    capacity: 400,
    description: 'Artistic space merging club culture with live music and cultural events.',
    image: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&q=80',
    openNow: false,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <StarIcon key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-noctvm-gold' : 'text-[#2A2A2A]'}`} />
      ))}
    </div>
  );
}

function VenueCard({ venue, compact = false }: { venue: typeof MOCK_VENUES[0]; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex gap-3 p-3 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#111]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-foreground text-sm font-semibold truncate">{venue.name}</span>
            {venue.openNow && <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 text-[#8A8A8A] text-xs mb-1">
            <MapPin className="w-3 h-3" />{venue.city} · {venue.type}
          </div>
          <div className="flex items-center gap-2">
            <StarRating rating={venue.rating} />
            <span className="text-[#8A8A8A] text-[10px]">({venue.reviews})</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/10 transition-colors">
      <div className="h-40 bg-[#111] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={venue.image} alt={venue.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <span className="text-foreground font-semibold">{venue.name}</span>
          {venue.openNow && (
            <span className="text-noctvm-emerald text-[10px] font-mono uppercase tracking-wide flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald" />Open
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[#8A8A8A] text-xs mb-2">
          <MapPin className="w-3 h-3" />{venue.city} · <Users className="w-3 h-3" />{venue.capacity}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={venue.rating} />
          <span className="text-[#8A8A8A] text-xs">{venue.rating} ({venue.reviews} reviews)</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {venue.genres.map(g => <Badge key={g} variant="genre">{g}</Badge>)}
        </div>
        <p className="text-[#8A8A8A] text-xs line-clamp-2">{venue.description}</p>
        <div className="flex gap-2 mt-3">
          <Button variant="primary" size="sm">View Events</Button>
          <Button variant="secondary" size="sm">Follow</Button>
        </div>
      </div>
    </div>
  );
}

const GENRE_FILTERS = ['All', 'Techno', 'House', 'Indie', 'Jazz', 'Electronic'];

function MobileView() {
  const [activeGenre, setActiveGenre] = useState('All');
  return (
    <div className="w-[390px] bg-[#050505] min-h-screen flex flex-col border border-white/5 rounded-3xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-12 pb-3">
        <VenuesIcon className="w-5 h-5 text-noctvm-violet" />
        <span className="text-foreground font-bold text-lg font-heading">Venues</span>
      </div>
      <div className="px-4 pb-2">
        <SearchBox placeholder="Search venues..." className="w-full" />
      </div>
      {/* Genre filters */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
        {GENRE_FILTERS.map(g => (
          <Chip
            key={g}
            variant={activeGenre === g ? 'solid' : 'bordered'}
            color={activeGenre === g ? 'violet' : 'default'}
            size="sm"
            onClick={() => setActiveGenre(g)}
          >{g}</Chip>
        ))}
      </div>
      {/* City switcher */}
      <div className="flex gap-2 px-4 pb-3">
        <Badge variant="featured">București</Badge>
        <Badge variant="genre">Constanța</Badge>
      </div>
      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24">
        {MOCK_VENUES.map(v => <VenueCard key={v.id} venue={v} compact />)}
      </div>
      <div className="h-[72px] border-t border-white/5 frosted-glass-header flex items-center justify-around px-4 shrink-0">
        {['Events', 'Feed', 'Venues', 'Pocket', 'Profile'].map(t => (
          <div key={t} className={`flex flex-col items-center gap-1 text-[10px] ${t === 'Venues' ? 'text-noctvm-violet' : 'text-[#8A8A8A]'}`}>
            <div className={`w-1 h-1 rounded-full ${t === 'Venues' ? 'bg-noctvm-violet' : 'bg-transparent'}`} />
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopView() {
  const [activeGenre, setActiveGenre] = useState('All');
  return (
    <div className="w-[1440px] bg-[#050505] min-h-screen border border-white/5 rounded-3xl overflow-hidden flex">
      {/* Sidebar */}
      <aside className="w-[240px] border-r border-white/5 bg-[#0A0A0A] flex flex-col pt-8 pb-4 shrink-0">
        <div className="px-6 mb-8">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-1">NOCTVM</p>
          <p className="text-foreground font-bold text-lg font-heading">Platform</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {[
            { label: 'Events', Icon: EventsIcon },
            { label: 'Feed',   Icon: FeedIcon   },
            { label: 'Venues', Icon: VenuesIcon  },
            { label: 'Pocket', Icon: PocketIcon  },
            { label: 'Profile',Icon: UserIcon    },
          ].map(({ label, Icon }) => (
            <div key={label} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              label === 'Venues'
                ? 'bg-noctvm-violet/15 text-noctvm-violet border border-noctvm-violet/20'
                : 'text-[#8A8A8A] hover:bg-white/5 hover:text-foreground'
            }`}>
              <Icon className="w-4 h-4" />
              {label}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 pt-8 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-foreground font-heading">Venues</h1>
            <div className="flex items-center gap-3">
              <SearchBox placeholder="Search venues..." className="w-64" />
              <Badge variant="featured">București</Badge>
              <Badge variant="genre">Constanța</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {GENRE_FILTERS.map(g => (
              <Chip
                key={g}
                variant={activeGenre === g ? 'solid' : 'bordered'}
                color={activeGenre === g ? 'violet' : 'default'}
                size="sm"
                onClick={() => setActiveGenre(g)}
              >{g}</Chip>
            ))}
          </div>
        </div>
        <div className="flex-1 p-8 grid grid-cols-2 gap-4 content-start overflow-y-auto">
          {MOCK_VENUES.map(v => <VenueCard key={v.id} venue={v} />)}
        </div>
      </main>

      {/* Map panel */}
      <aside className="w-[380px] border-l border-white/5 bg-[#0A0A0A] shrink-0 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest">Map View</p>
        </div>
        <div className="flex-1 bg-[#111] flex items-center justify-center">
          <div className="text-center text-[#8A8A8A]">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-noctvm-violet" />
            <p className="text-sm">Interactive map</p>
            <p className="text-xs mt-1">București venues</p>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-3">Open Now</p>
          {MOCK_VENUES.filter(v => v.openNow).map(v => (
            <div key={v.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="w-2 h-2 rounded-full bg-noctvm-emerald shrink-0" />
              <span className="text-foreground text-sm flex-1">{v.name}</span>
              <span className="text-[#8A8A8A] text-xs">{v.city}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default function VenuesExportPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="text-xs text-[#8A8A8A] font-mono uppercase tracking-widest mb-4">
        figma-export / venues
      </div>
      <div>
        <p className="text-[10px] text-[#8A8A8A] font-mono uppercase tracking-widest mb-3">Mobile — 390px</p>
        <MobileView />
      </div>
      <div>
        <p className="text-[10px] text-[#8A8A8A] font-mono uppercase tracking-widest mb-3">Desktop — 1440px</p>
        <DesktopView />
      </div>
    </div>
  );
}
