'use client';

/**
 * /figma-export/profile
 * Static Profile screen design comp — mobile + desktop.
 */

import React, { useState } from 'react';
import { Avatar, Badge, Button, GlassPanel, Tabs, type TabItem } from '@/components/ui';
import { EventsIcon, FeedIcon, VenuesIcon, PocketIcon, UserIcon } from '@/components/icons';
import { Heart, MessageCircle, Repeat2, Settings, Grid3x3, Bookmark, Star } from 'lucide-react';

const MOCK_USER = {
  username: 'djnoctvm',
  displayName: 'NOCTVM DJ',
  bio: 'Underground music curator · București · 🌙 Techno / Minimal / Experimental\nResident @ Control Club',
  avatar: 'https://i.pravatar.cc/150?u=djnoctvm',
  followers: 2840,
  following: 312,
  posts: 94,
  moonrays: 3200,
  rank: 'Silver',
  verified: true,
};

const MOCK_POSTS_GRID = Array.from({ length: 9 }, (_, i) => ({
  id: String(i),
  image: `https://picsum.photos/seed/noctvm${i}/300/300`,
  likes: Math.floor(Math.random() * 200) + 20,
}));

const MOCK_SAVED_EVENTS = [
  { id: '1', title: 'Admina & Chlorys', venue: 'Control Club', date: 'Mar 08', image: 'https://picsum.photos/seed/ev1/200/120' },
  { id: '2', title: 'Vlad Flueraru', venue: 'Control Club', date: 'Mar 14', image: 'https://picsum.photos/seed/ev2/200/120' },
  { id: '3', title: 'Ladies Night BDLP', venue: 'OXYA Club', date: 'Mar 08', image: 'https://picsum.photos/seed/ev3/200/120' },
];

const profileTabs: TabItem[] = [
  { id: 'posts',  label: 'Posts'  },
  { id: 'saved',  label: 'Saved'  },
  { id: 'highlights', label: 'Highlights' },
];

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-white font-bold text-lg font-[Syne]">{typeof value === 'number' ? value.toLocaleString() : value}</span>
      <span className="text-[#8A8A8A] text-xs">{label}</span>
    </div>
  );
}

function PostsGrid({ compact = false }: { compact?: boolean }) {
  const cols = compact ? 'grid-cols-3' : 'grid-cols-3';
  return (
    <div className={`grid ${cols} gap-0.5`}>
      {MOCK_POSTS_GRID.map(p => (
        <div key={p.id} className="aspect-square relative overflow-hidden group cursor-pointer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-1 text-white text-sm font-bold">
              <Heart className="w-4 h-4 fill-white" />{p.likes}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SavedEvents() {
  return (
    <div className="p-4 space-y-3">
      {MOCK_SAVED_EVENTS.map(e => (
        <div key={e.id} className="flex gap-3 items-center p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="w-16 h-12 rounded-xl overflow-hidden shrink-0 bg-[#111]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={e.image} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{e.title}</p>
            <p className="text-[#8A8A8A] text-xs">{e.venue} · {e.date}</p>
          </div>
          <Bookmark className="w-4 h-4 text-noctvm-violet shrink-0" />
        </div>
      ))}
    </div>
  );
}

function MobileView() {
  const [tab, setTab] = useState('posts');
  return (
    <div className="w-[390px] bg-[#050505] min-h-screen flex flex-col border border-white/5 rounded-3xl overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <span className="text-white font-bold text-lg font-[Syne]">@{MOCK_USER.username}</span>
        <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button>
      </div>

      {/* Profile header */}
      <div className="px-4 pb-4">
        <div className="flex items-start gap-4 mb-4">
          <Avatar size="2xl" src={MOCK_USER.avatar} alt={MOCK_USER.displayName} ring="highlight" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold">{MOCK_USER.displayName}</span>
              {MOCK_USER.verified && <Badge variant="featured">✓</Badge>}
            </div>
            <div className="flex gap-4 mt-2">
              <StatBlock value={MOCK_USER.posts} label="posts" />
              <StatBlock value={MOCK_USER.followers} label="followers" />
              <StatBlock value={MOCK_USER.following} label="following" />
            </div>
          </div>
        </div>
        <p className="text-[#E8E4DF] text-sm leading-relaxed whitespace-pre-line">{MOCK_USER.bio}</p>
        <div className="flex gap-2 mt-3">
          <Button variant="primary" size="sm" className="flex-1">Follow</Button>
          <Button variant="outline" size="sm">Message</Button>
        </div>
        {/* Moonrays badge */}
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
          <span className="text-noctvm-gold text-xs">🌙</span>
          <span className="text-[#E8E4DF] text-xs font-medium">{MOCK_USER.moonrays.toLocaleString()} Moonrays</span>
          <Badge variant="outlined" className="ml-auto text-noctvm-gold border-noctvm-gold/30 bg-noctvm-gold/10">
            {MOCK_USER.rank}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 border-b border-white/5 pb-0">
        <Tabs tabs={profileTabs} activeTab={tab} onChange={setTab} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {tab === 'posts' && <PostsGrid compact />}
        {tab === 'saved' && <SavedEvents />}
        {tab === 'highlights' && (
          <div className="p-8 text-center text-[#8A8A8A] text-sm">No highlights yet</div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="h-[72px] border-t border-white/5 frosted-glass-header flex items-center justify-around px-4 shrink-0">
        {['Events', 'Feed', 'Venues', 'Pocket', 'Profile'].map(t => (
          <div key={t} className={`flex flex-col items-center gap-1 text-[10px] ${t === 'Profile' ? 'text-noctvm-violet' : 'text-[#8A8A8A]'}`}>
            <div className={`w-1 h-1 rounded-full ${t === 'Profile' ? 'bg-noctvm-violet' : 'bg-transparent'}`} />
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopView() {
  const [tab, setTab] = useState('posts');
  return (
    <div className="w-[1440px] bg-[#050505] min-h-screen border border-white/5 rounded-3xl overflow-hidden flex">
      {/* Sidebar */}
      <aside className="w-[240px] border-r border-white/5 bg-[#0A0A0A] flex flex-col pt-8 pb-4 shrink-0">
        <div className="px-6 mb-8">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-1">NOCTVM</p>
          <p className="text-white font-bold text-lg font-[Syne]">Platform</p>
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
              label === 'Profile'
                ? 'bg-noctvm-violet/15 text-noctvm-violet border border-noctvm-violet/20'
                : 'text-[#8A8A8A] hover:bg-white/5 hover:text-white'
            }`}>
              <Icon className="w-4 h-4" />
              {label}
            </div>
          ))}
        </nav>
        {/* Mini profile in sidebar */}
        <div className="px-3 mt-4 p-3 rounded-xl border border-white/5 mx-3 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Avatar size="sm" src={MOCK_USER.avatar} />
            <div>
              <p className="text-white text-xs font-medium">@{MOCK_USER.username}</p>
              <p className="text-[#8A8A8A] text-[10px]">🌙 {MOCK_USER.moonrays.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Profile main */}
      <main className="flex-1 overflow-y-auto">
        {/* Cover / header area */}
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-noctvm-midnight via-[#1A0A3E] to-[#050505]" />
          <div className="px-8 pb-4">
            <div className="flex items-end gap-6 -mt-10 mb-4">
              <Avatar size="2xl" src={MOCK_USER.avatar} alt={MOCK_USER.displayName} ring="highlight" />
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-white text-2xl font-black font-[Syne]">{MOCK_USER.displayName}</h1>
                  {MOCK_USER.verified && <Badge variant="featured">Verified</Badge>}
                </div>
                <p className="text-[#8A8A8A] text-sm">@{MOCK_USER.username}</p>
              </div>
              <div className="flex gap-2 pb-2">
                <Button variant="primary" size="sm">Follow</Button>
                <Button variant="outline" size="sm">Message</Button>
                <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button>
              </div>
            </div>
            <p className="text-[#E8E4DF] text-sm leading-relaxed max-w-xl whitespace-pre-line mb-4">{MOCK_USER.bio}</p>
            <div className="flex items-center gap-8 mb-4">
              <StatBlock value={MOCK_USER.posts} label="posts" />
              <StatBlock value={MOCK_USER.followers} label="followers" />
              <StatBlock value={MOCK_USER.following} label="following" />
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-noctvm-gold/10 border border-noctvm-gold/20">
                <span className="text-noctvm-gold text-sm">🌙</span>
                <span className="text-noctvm-gold text-sm font-bold">{MOCK_USER.moonrays.toLocaleString()} Moonrays</span>
                <Badge variant="outlined" className="text-noctvm-gold border-noctvm-gold/30">{MOCK_USER.rank}</Badge>
              </div>
            </div>
            <Tabs tabs={profileTabs} activeTab={tab} onChange={setTab} />
          </div>
        </div>

        {/* Content */}
        <div className="px-8">
          {tab === 'posts' && <PostsGrid />}
          {tab === 'saved' && <SavedEvents />}
          {tab === 'highlights' && (
            <div className="py-16 text-center text-[#8A8A8A] text-sm">No highlights yet</div>
          )}
        </div>
      </main>

      {/* Right panel */}
      <aside className="w-[320px] border-l border-white/5 bg-[#0A0A0A] shrink-0 p-6">
        <GlassPanel variant="subtle" className="rounded-2xl p-4 mb-4">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-3">Moonrays</p>
          <div className="text-center py-2">
            <p className="text-3xl font-black text-noctvm-gold font-[Syne]">{MOCK_USER.moonrays.toLocaleString()}</p>
            <p className="text-[#8A8A8A] text-xs mt-1">{MOCK_USER.rank} Rank</p>
          </div>
        </GlassPanel>
        <GlassPanel variant="subtle" className="rounded-2xl p-4">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-3">Attended Venues</p>
          {['Control Club', 'OXYA Club', 'Expirat'].map(v => (
            <div key={v} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <span className="text-noctvm-violet text-xs">◆</span>
              <span className="text-white text-sm">{v}</span>
            </div>
          ))}
        </GlassPanel>
      </aside>
    </div>
  );
}

export default function ProfileExportPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="text-xs text-[#8A8A8A] font-mono uppercase tracking-widest mb-4">
        figma-export / profile
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
