'use client';

/**
 * /figma-export/events
 * Static Events screen — mobile 390px + desktop 1440px side by side.
 */

import React, { useState } from 'react';
import { SAMPLE_EVENTS } from '@/lib/events-data';
import EventCard from '@/components/EventCard';
import { Badge, Button, Chip, SearchBox } from '@/components/ui';
import { EventsIcon } from '@/components/icons';

const GENRES = ['All', 'Techno', 'House', 'Ambient', 'Electronic', 'Minimal', 'Experimental'];

function FilterBar({ active, onToggle }: { active: string[]; onToggle: (g: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap px-4 pb-3 pt-1">
      {GENRES.map(g => (
        <button
          key={g}
          onClick={() => onToggle(g)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all border ${
            active.includes(g)
              ? 'bg-noctvm-violet/20 border-noctvm-violet/50 text-noctvm-violet'
              : 'border-white/10 bg-white/5 text-[#8A8A8A] hover:border-white/20'
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  );
}

function MobileView() {
  const [genres, setGenres] = useState(['All']);
  const toggle = (g: string) => setGenres(prev =>
    prev.includes(g) ? prev.filter(x => x !== g) : [...prev.filter(x => x !== 'All'), g]
  );

  return (
    <div className="w-[390px] bg-[#050505] min-h-screen flex flex-col border border-white/5 rounded-3xl overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <div className="flex items-center gap-2">
          <EventsIcon className="w-5 h-5 text-noctvm-violet" />
          <span className="text-white font-bold text-lg font-[Syne]">Events</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="featured">București</Badge>
          <Badge variant="genre">Constanța</Badge>
        </div>
      </div>
      <div className="px-4 pb-2">
        <SearchBox placeholder="Search events..." className="w-full" />
      </div>
      <FilterBar active={genres} onToggle={toggle} />
      <div className="flex-1 overflow-y-auto px-3 space-y-3 pb-24">
        {SAMPLE_EVENTS.slice(0, 6).map(evt => (
          <EventCard
            key={evt.id}
            event={evt}
            onClick={() => {}}
          />
        ))}
      </div>
      {/* Bottom nav placeholder */}
      <div className="h-[72px] border-t border-white/5 frosted-glass-header flex items-center justify-around px-4">
        {['Events', 'Feed', 'Venues', 'Pocket', 'Profile'].map(tab => (
          <div key={tab} className={`flex flex-col items-center gap-1 text-[10px] ${tab === 'Events' ? 'text-noctvm-violet' : 'text-[#8A8A8A]'}`}>
            <div className={`w-1 h-1 rounded-full ${tab === 'Events' ? 'bg-noctvm-violet' : 'bg-transparent'}`} />
            {tab}
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopView() {
  const [genres, setGenres] = useState(['All']);
  const toggle = (g: string) => setGenres(prev =>
    prev.includes(g) ? prev.filter(x => x !== g) : [...prev.filter(x => x !== 'All'), g]
  );

  return (
    <div className="w-[1440px] bg-[#050505] min-h-screen border border-white/5 rounded-3xl overflow-hidden flex">
      {/* Sidebar */}
      <aside className="w-[240px] border-r border-white/5 bg-[#0A0A0A] flex flex-col pt-8 pb-4 shrink-0">
        <div className="px-6 mb-8">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-1">NOCTVM</p>
          <p className="text-white font-bold text-lg font-[Syne]">Platform</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {['Events', 'Feed', 'Venues', 'Pocket', 'Profile'].map(t => (
            <div key={t} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              t === 'Events'
                ? 'bg-noctvm-violet/15 text-noctvm-violet border border-noctvm-violet/20'
                : 'text-[#8A8A8A] hover:bg-white/5 hover:text-white'
            }`}>
              <EventsIcon className="w-4 h-4" />
              {t}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <h1 className="text-2xl font-black text-white font-[Syne]">Events</h1>
          <div className="flex items-center gap-3">
            <SearchBox placeholder="Search events..." className="w-64" />
            <Badge variant="featured">București</Badge>
          </div>
        </div>
        <FilterBar active={genres} onToggle={toggle} />
        <div className="flex-1 px-8 py-4 grid grid-cols-3 gap-4 content-start">
          {SAMPLE_EVENTS.slice(0, 9).map(evt => (
            <EventCard
              key={evt.id}
              event={evt}
              onClick={() => {}}
            />
          ))}
        </div>
      </main>

      {/* Right panel placeholder */}
      <aside className="w-[320px] border-l border-white/5 bg-[#0A0A0A] shrink-0 p-6">
        <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-4">Tonight</p>
        <div className="space-y-3">
          {SAMPLE_EVENTS.slice(0, 3).map(e => (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="w-2 h-2 rounded-full bg-noctvm-violet shrink-0" />
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">{e.title}</p>
                <p className="text-[#8A8A8A] text-[10px]">{e.venue}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default function EventsExportPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="text-xs text-[#8A8A8A] font-mono uppercase tracking-widest mb-4">
        figma-export / events — capture each frame separately with html.to.design
      </div>
      {/* Mobile */}
      <div>
        <p className="text-[10px] text-[#8A8A8A] font-mono uppercase tracking-widest mb-3">Mobile — 390px</p>
        <MobileView />
      </div>
      {/* Desktop */}
      <div>
        <p className="text-[10px] text-[#8A8A8A] font-mono uppercase tracking-widest mb-3">Desktop — 1440px</p>
        <DesktopView />
      </div>
    </div>
  );
}
