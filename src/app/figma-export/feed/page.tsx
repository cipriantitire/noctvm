'use client';

/**
 * /figma-export/feed
 * Static Feed screen design comp — mobile + desktop.
 */

import React, { useState } from 'react';
import { Avatar, Badge, Button, GlassPanel, Tabs, type TabItem } from '@/components/ui';
import { EventsIcon, FeedIcon, VenuesIcon, PocketIcon, UserIcon } from '@/components/icons';
import { Heart, MessageCircle, Repeat2, Share2, Plus, ImageIcon } from 'lucide-react';

const subTabs: TabItem[] = [
  { id: 'explore',   label: 'Explore' },
  { id: 'following', label: 'Following' },
  { id: 'friends',   label: 'Friends' },
];

const MOCK_STORIES = [
  { id: '1', name: 'djnoctvm',   seen: false },
  { id: '2', name: 'control',    seen: false },
  { id: '3', name: 'oxya',       seen: true  },
  { id: '4', name: 'afterhours', seen: true  },
  { id: '5', name: 'vinyl_ro',   seen: true  },
];

const MOCK_POSTS = [
  {
    id: '1',
    author: 'djnoctvm',
    handle: '@djnoctvm',
    time: '2h',
    text: 'Incredible set tonight at Control Club. The energy was unreal — see you next week! 🌙',
    venue: 'Control Club',
    likes: 142,
    comments: 23,
    reposts: 8,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
  },
  {
    id: '2',
    author: 'vinyl_ro',
    handle: '@vinyl_ro',
    time: '4h',
    text: 'New arrivals from Berlin. Techno, minimal, acid. Come by the shop or DM for titles.',
    venue: null,
    likes: 87,
    comments: 12,
    reposts: 31,
    image: null,
  },
  {
    id: '3',
    author: 'oxya_club',
    handle: '@oxya_club',
    time: '6h',
    text: 'Ladies Night this Saturday — doors open at 22:00. Free entry before midnight! 💜',
    venue: 'OXYA Club',
    likes: 213,
    comments: 44,
    reposts: 67,
    image: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d9a?w=600&q=80',
  },
];

function StoryBubble({ name, seen, isMe }: { name: string; seen: boolean; isMe?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className={`relative p-[2px] rounded-full ${
        isMe ? 'bg-[#2A2A2A]' : seen ? 'bg-[#2A2A2A]' : 'bg-gradient-to-tr from-noctvm-violet to-fuchsia-500'
      }`}>
        {isMe ? (
          <div className="w-14 h-14 rounded-full bg-[#111] flex items-center justify-center">
            <Plus className="w-5 h-5 text-[#8A8A8A]" />
          </div>
        ) : (
          <Avatar size="xl" fallback={name[0].toUpperCase()} src={`https://i.pravatar.cc/150?u=${name}`} />
        )}
      </div>
      <span className="text-[10px] text-[#8A8A8A] max-w-[56px] truncate text-center">{isMe ? 'Your story' : name}</span>
    </div>
  );
}

function PostCard({ post, compact = false }: { post: typeof MOCK_POSTS[0]; compact?: boolean }) {
  return (
    <div className="border-b border-white/5 p-4 hover:bg-white/[0.02] transition-colors">
      <div className="flex gap-3">
        <Avatar size="md" fallback={post.author[0].toUpperCase()} src={`https://i.pravatar.cc/150?u=${post.author}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-foreground text-sm font-semibold">{post.author}</span>
            <span className="text-[#8A8A8A] text-xs">{post.handle}</span>
            <span className="text-[#8A8A8A] text-xs">· {post.time}</span>
            {post.venue && (
              <Badge variant="genre">{post.venue}</Badge>
            )}
          </div>
          <p className="text-[#E8E4DF] text-sm leading-relaxed mb-3">{post.text}</p>
          {post.image && !compact && (
            <div className="rounded-2xl overflow-hidden mb-3 bg-[#111]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image} alt="" className="w-full object-cover max-h-64" />
            </div>
          )}
          {post.image && compact && (
            <div className="flex items-center gap-1.5 text-[#8A8A8A] text-xs mb-2">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photo</span>
            </div>
          )}
          <div className="flex items-center gap-6 text-[#8A8A8A]">
            <button className="flex items-center gap-1.5 text-xs hover:text-red-400 transition-colors">
              <Heart className="w-4 h-4" />{post.likes}
            </button>
            <button className="flex items-center gap-1.5 text-xs hover:text-noctvm-violet transition-colors">
              <MessageCircle className="w-4 h-4" />{post.comments}
            </button>
            <button className="flex items-center gap-1.5 text-xs hover:text-noctvm-emerald transition-colors">
              <Repeat2 className="w-4 h-4" />{post.reposts}
            </button>
            <button className="ml-auto hover:text-foreground transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileView() {
  const [tab, setTab] = useState('following');
  return (
    <div className="w-[390px] bg-[#050505] min-h-screen flex flex-col border border-white/5 rounded-3xl overflow-hidden">
      {/* Top */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <div className="flex items-center gap-2">
          <FeedIcon className="w-5 h-5 text-noctvm-violet" />
          <span className="text-foreground font-bold text-lg font-heading">Feed</span>
        </div>
        <Button variant="primary" size="sm">Post</Button>
      </div>
      {/* Sub-tabs */}
      <div className="px-4 pb-2">
        <Tabs tabs={subTabs} activeTab={tab} onChange={setTab} />
      </div>
      {/* Stories row */}
      <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-none">
        <StoryBubble name="me" seen={false} isMe />
        {MOCK_STORIES.map(s => <StoryBubble key={s.id} name={s.name} seen={s.seen} />)}
      </div>
      {/* Posts */}
      <div className="flex-1 overflow-y-auto pb-24">
        {MOCK_POSTS.map(p => <PostCard key={p.id} post={p} compact />)}
      </div>
      {/* Bottom nav */}
      <div className="h-[72px] border-t border-white/5 frosted-glass-header flex items-center justify-around px-4 shrink-0">
        {['Events', 'Feed', 'Venues', 'Pocket', 'Profile'].map(t => (
          <div key={t} className={`flex flex-col items-center gap-1 text-[10px] ${t === 'Feed' ? 'text-noctvm-violet' : 'text-[#8A8A8A]'}`}>
            <div className={`w-1 h-1 rounded-full ${t === 'Feed' ? 'bg-noctvm-violet' : 'bg-transparent'}`} />
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopView() {
  const [tab, setTab] = useState('following');
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
              label === 'Feed'
                ? 'bg-noctvm-violet/15 text-noctvm-violet border border-noctvm-violet/20'
                : 'text-[#8A8A8A] hover:bg-white/5 hover:text-foreground'
            }`}>
              <Icon className="w-4 h-4" />
              {label}
            </div>
          ))}
        </nav>
        <div className="px-3 mt-4">
          <Button variant="primary" size="sm">+ New Post</Button>
        </div>
      </aside>

      {/* Feed column */}
      <main className="flex-1 max-w-[680px] border-r border-white/5">
        <div className="sticky top-0 z-10 bg-[#050505]/90 backdrop-blur-md px-6 pt-6 pb-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-black text-foreground font-heading">Feed</h1>
          </div>
          <Tabs tabs={subTabs} activeTab={tab} onChange={setTab} />
        </div>
        {/* Stories */}
        <div className="flex gap-4 px-6 py-4 overflow-x-auto scrollbar-none border-b border-white/5">
          <StoryBubble name="me" seen={false} isMe />
          {MOCK_STORIES.map(s => <StoryBubble key={s.id} name={s.name} seen={s.seen} />)}
        </div>
        {/* Posts */}
        <div>
          {MOCK_POSTS.map(p => <PostCard key={p.id} post={p} />)}
        </div>
      </main>

      {/* Right panel */}
      <aside className="flex-1 p-6 space-y-6">
        <GlassPanel variant="subtle" className="rounded-2xl p-4">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-3">Trending Venues</p>
          {['Control Club', 'OXYA Club', 'Expirat', 'Quantic'].map((v, i) => (
            <div key={v} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
              <span className="text-[#8A8A8A] text-xs font-mono w-4">{i + 1}</span>
              <span className="text-foreground text-sm flex-1">{v}</span>
              <Badge variant="genre">Hot</Badge>
            </div>
          ))}
        </GlassPanel>
        <GlassPanel variant="subtle" className="rounded-2xl p-4">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-3">Who to Follow</p>
          {['djnoctvm', 'control_club', 'vinyl_ro'].map(u => (
            <div key={u} className="flex items-center gap-3 py-2">
              <Avatar size="sm" fallback={u[0].toUpperCase()} src={`https://i.pravatar.cc/150?u=${u}`} />
              <span className="text-foreground text-sm flex-1">@{u}</span>
              <Button variant="secondary" size="sm">Follow</Button>
            </div>
          ))}
        </GlassPanel>
      </aside>
    </div>
  );
}

export default function FeedExportPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="text-xs text-[#8A8A8A] font-mono uppercase tracking-widest mb-4">
        figma-export / feed
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
