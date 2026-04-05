'use client';

/**
 * /figma-export/pocket
 * Static Pocket / Moonrays screen design comp — mobile + desktop.
 */

import React, { useState } from 'react';
import { Badge, Button, GlassPanel, Progress, CircularProgress } from '@/components/ui';
import { EventsIcon, FeedIcon, VenuesIcon, PocketIcon, UserIcon } from '@/components/icons';
import { Moon, Star, Ticket, TrendingUp, ShoppingBag, ChevronRight, Gift, Users, MessageCircle, Camera, RefreshCw, MapPin } from 'lucide-react';

const MOCK_POCKET = {
  moonrays: 3200,
  rank: 'Silver',
  nextRank: 'Gold',
  nextRankAt: 5000,
  totalEarned: 4850,
  referrals: 3,
  eventsAttended: 12,
};

const RANK_TIERS = [
  { name: 'Bronze', min: 0,    max: 1000, color: '#CD7F32' },
  { name: 'Silver', min: 1000, max: 5000, color: '#C0C0C0' },
  { name: 'Gold',   min: 5000, max: 15000, color: '#D4A843' },
  { name: 'Onyx',   min: 15000, max: Infinity, color: '#7C3AED' },
];

const EARN_ACTIONS = [
  { icon: <Moon className="w-4 h-4" />,         label: 'Create your account',  desc: 'Welcome bonus, one-time',  points: 100,  done: true  },
  { icon: <Ticket className="w-4 h-4" />,       label: 'Attend an event',      desc: 'Scan ticket at the door',  points: 50,   done: false },
  { icon: <Camera className="w-4 h-4" />,       label: 'Share a post',         desc: 'Per post published',       points: 20,   done: false },
  { icon: <MessageCircle className="w-4 h-4" />,label: 'Leave a comment',      desc: 'Per comment',              points: 5,    done: false },
  { icon: <Star className="w-4 h-4" />,         label: 'Review a venue',       desc: 'Per verified review',      points: 30,   done: false },
  { icon: <RefreshCw className="w-4 h-4" />,    label: 'Repost content',       desc: 'Per repost shared',        points: 10,   done: false },
  { icon: <Users className="w-4 h-4" />,        label: 'Invite a friend',      desc: 'When they sign up',        points: 200,  done: false },
];

const BOUTIQUE_ITEMS = [
  { id: '1', name: 'Priority Access Pass',  desc: 'Skip the queue at partner venues',  cost: 2000, image: 'https://picsum.photos/seed/bq1/120/80' },
  { id: '2', name: 'DJ Collab Badge',       desc: 'Exclusive profile flair',           cost: 3500, image: 'https://picsum.photos/seed/bq2/120/80' },
  { id: '3', name: 'Guest List Spot',       desc: 'One free entry at Control Club',    cost: 1500, image: 'https://picsum.photos/seed/bq3/120/80' },
];

const currentRank = RANK_TIERS.find(r => r.name === MOCK_POCKET.rank)!;
const nextRank    = RANK_TIERS.find(r => r.name === MOCK_POCKET.nextRank)!;
const rankProgress = Math.round(
  ((MOCK_POCKET.moonrays - currentRank.min) / (nextRank.min - currentRank.min)) * 100
);

function PrestigeCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #1A0A3E 0%, #0D0520 50%, #050505 100%)', border: '1px solid rgba(124,58,237,0.3)' }}
    >
      {/* Glow orb */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20"
           style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
      <div className={`relative ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#8A8A8A] text-xs font-mono uppercase tracking-widest">Moonrays Balance</p>
            <p className={`text-noctvm-gold font-black font-heading leading-none mt-1 ${compact ? 'text-3xl' : 'text-5xl'}`}>
              {MOCK_POCKET.moonrays.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-noctvm-gold border-noctvm-gold/40 bg-noctvm-gold/10 text-sm px-3 py-1">
              {MOCK_POCKET.rank}
            </Badge>
            <p className="text-[#8A8A8A] text-[10px]">🌙 Rank</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8A8A8A]">{MOCK_POCKET.rank}</span>
            <span className="text-[#8A8A8A]">{MOCK_POCKET.nextRank} at {MOCK_POCKET.nextRankAt.toLocaleString()} 🌙</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${rankProgress}%`, background: 'linear-gradient(90deg, #7C3AED, #D4A843)' }}
            />
          </div>
          <p className="text-[#8A8A8A] text-[10px]">{rankProgress}% to {MOCK_POCKET.nextRank}</p>
        </div>
        {!compact && (
          <div className="flex gap-6 mt-4 pt-4 border-t border-white/5">
            <div>
              <p className="text-white text-sm font-bold">{MOCK_POCKET.eventsAttended}</p>
              <p className="text-[#8A8A8A] text-[10px]">Events attended</p>
            </div>
            <div>
              <p className="text-white text-sm font-bold">{MOCK_POCKET.referrals}</p>
              <p className="text-[#8A8A8A] text-[10px]">Friends invited</p>
            </div>
            <div>
              <p className="text-white text-sm font-bold">{MOCK_POCKET.totalEarned.toLocaleString()}</p>
              <p className="text-[#8A8A8A] text-[10px]">Total earned</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EarnRow({ action }: { action: typeof EARN_ACTIONS[0] }) {
  return (
    <div className={`flex items-center gap-3 py-3 border-b border-white/5 last:border-0 ${action.done ? 'opacity-50' : ''}`}>
      <div className="w-9 h-9 rounded-xl bg-noctvm-violet/10 border border-noctvm-violet/20 flex items-center justify-center text-noctvm-violet shrink-0">
        {action.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">{action.label}</p>
        <p className="text-[#8A8A8A] text-xs">{action.desc}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-noctvm-gold text-sm font-bold">+{action.points}</span>
        <span className="text-noctvm-gold text-xs">🌙</span>
        {action.done && <span className="text-noctvm-emerald text-xs ml-1">✓</span>}
      </div>
    </div>
  );
}

function BoutiqueCard({ item }: { item: typeof BOUTIQUE_ITEMS[0] }) {
  const canAfford = MOCK_POCKET.moonrays >= item.cost;
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
      <div className="h-24 bg-[#111] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <p className="text-white text-sm font-semibold">{item.name}</p>
        <p className="text-[#8A8A8A] text-xs mt-0.5 mb-2">{item.desc}</p>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold ${canAfford ? 'text-noctvm-gold' : 'text-[#8A8A8A]'}`}>
            {item.cost.toLocaleString()} 🌙
          </span>
          <Button variant={canAfford ? 'primary' : 'outline'} size="sm" className="text-xs px-2 py-1">
            {canAfford ? 'Redeem' : 'Locked'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MobileView() {
  const [section, setSection] = useState<'earn' | 'boutique'>('earn');
  return (
    <div className="w-[390px] bg-[#050505] min-h-screen flex flex-col border border-white/5 rounded-3xl overflow-hidden">
      {/* Top */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-3">
        <PocketIcon className="w-5 h-5 text-noctvm-violet" />
        <span className="text-white font-bold text-lg font-heading">Pocket</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
        {/* Prestige card */}
        <PrestigeCard compact />

        {/* Section toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setSection('earn')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${section === 'earn' ? 'bg-noctvm-violet/20 text-noctvm-violet border border-noctvm-violet/30' : 'bg-white/[0.03] text-[#8A8A8A] border border-white/5'}`}
          >
            Earn
          </button>
          <button
            onClick={() => setSection('boutique')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${section === 'boutique' ? 'bg-noctvm-violet/20 text-noctvm-violet border border-noctvm-violet/30' : 'bg-white/[0.03] text-[#8A8A8A] border border-white/5'}`}
          >
            Boutique
          </button>
        </div>

        {section === 'earn' && (
          <GlassPanel variant="subtle" className="rounded-2xl p-4">
            <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-3">Ways to Earn</p>
            {EARN_ACTIONS.map(a => <EarnRow key={a.label} action={a} />)}
          </GlassPanel>
        )}

        {section === 'boutique' && (
          <div className="space-y-3">
            <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest">Boutique</p>
            {BOUTIQUE_ITEMS.map(item => <BoutiqueCard key={item.id} item={item} />)}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="h-[72px] border-t border-white/5 frosted-glass-header flex items-center justify-around px-4 shrink-0">
        {['Events', 'Feed', 'Venues', 'Pocket', 'Profile'].map(t => (
          <div key={t} className={`flex flex-col items-center gap-1 text-[10px] ${t === 'Pocket' ? 'text-noctvm-violet' : 'text-[#8A8A8A]'}`}>
            <div className={`w-1 h-1 rounded-full ${t === 'Pocket' ? 'bg-noctvm-violet' : 'bg-transparent'}`} />
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

function DesktopView() {
  return (
    <div className="w-[1440px] bg-[#050505] min-h-screen border border-white/5 rounded-3xl overflow-hidden flex">
      {/* App sidebar */}
      <aside className="w-[240px] border-r border-white/5 bg-[#0A0A0A] flex flex-col pt-8 pb-4 shrink-0">
        <div className="px-6 mb-8">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-1">NOCTVM</p>
          <p className="text-white font-bold text-lg font-heading">Platform</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {[
            { label: 'Events',  Icon: EventsIcon },
            { label: 'Feed',    Icon: FeedIcon   },
            { label: 'Venues',  Icon: VenuesIcon  },
            { label: 'Pocket',  Icon: PocketIcon  },
            { label: 'Profile', Icon: UserIcon    },
          ].map(({ label, Icon }) => (
            <div key={label} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              label === 'Pocket'
                ? 'bg-noctvm-violet/15 text-noctvm-violet border border-noctvm-violet/20'
                : 'text-[#8A8A8A] hover:bg-white/5 hover:text-white'
            }`}>
              <Icon className="w-4 h-4" />
              {label}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-2xl space-y-8">
          <h1 className="text-2xl font-black text-white font-heading">Pocket</h1>

          {/* Prestige card */}
          <PrestigeCard />

          {/* Earn section */}
          <div>
            <h2 className="text-sm font-mono text-[#8A8A8A] uppercase tracking-widest mb-4">Ways to Earn</h2>
            <GlassPanel variant="subtle" className="rounded-2xl p-6">
              {EARN_ACTIONS.map(a => <EarnRow key={a.label} action={a} />)}
            </GlassPanel>
          </div>

          {/* Boutique */}
          <div>
            <h2 className="text-sm font-mono text-[#8A8A8A] uppercase tracking-widest mb-4">Boutique</h2>
            <div className="grid grid-cols-3 gap-4">
              {BOUTIQUE_ITEMS.map(item => <BoutiqueCard key={item.id} item={item} />)}
            </div>
          </div>
        </div>
      </main>

      {/* Right panel */}
      <aside className="w-[320px] border-l border-white/5 bg-[#0A0A0A] shrink-0 p-6 space-y-6">
        {/* Rank tiers */}
        <GlassPanel variant="subtle" className="rounded-2xl p-4">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-4">Rank Tiers</p>
          {RANK_TIERS.filter(r => r.name !== 'Onyx').map(tier => {
            const isCurrent = tier.name === MOCK_POCKET.rank;
            return (
              <div key={tier.name} className={`flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0 ${isCurrent ? 'opacity-100' : 'opacity-50'}`}>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tier.color }} />
                <span className="text-white text-sm flex-1">{tier.name}</span>
                <span className="text-[#8A8A8A] text-xs">{tier.min.toLocaleString()}+ 🌙</span>
                {isCurrent && <Badge variant="featured" className="text-[10px]">Current</Badge>}
              </div>
            );
          })}
          <div className="flex items-center gap-3 py-2.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-noctvm-violet" />
            <span className="text-white text-sm flex-1">Onyx</span>
            <span className="text-[#8A8A8A] text-xs">15,000+ 🌙</span>
          </div>
        </GlassPanel>

        {/* Stats */}
        <GlassPanel variant="subtle" className="rounded-2xl p-4">
          <p className="text-xs font-mono text-[#8A8A8A] uppercase tracking-widest mb-4">Your Activity</p>
          <div className="space-y-3">
            {[
              { label: 'Events attended', value: MOCK_POCKET.eventsAttended, icon: <Ticket className="w-3.5 h-3.5" /> },
              { label: 'Friends invited',  value: MOCK_POCKET.referrals,       icon: <Users className="w-3.5 h-3.5" /> },
              { label: 'Total earned',     value: `${MOCK_POCKET.totalEarned.toLocaleString()} 🌙`, icon: <TrendingUp className="w-3.5 h-3.5" /> },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-3">
                <span className="text-noctvm-violet">{stat.icon}</span>
                <span className="text-[#8A8A8A] text-sm flex-1">{stat.label}</span>
                <span className="text-white text-sm font-bold">{stat.value}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </aside>
    </div>
  );
}

export default function PocketExportPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="text-xs text-[#8A8A8A] font-mono uppercase tracking-widest mb-4">
        figma-export / pocket
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
