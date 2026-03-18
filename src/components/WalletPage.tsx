'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMoonrays } from '@/hooks/useMoonrays';
import { MoonraysPrestigeCard } from '@/components/moonrays/MoonraysPrestigeCard';
import { MoonIcon, TicketIcon, StarIcon } from '@/components/icons';

export default function WalletPage() {
  const { user, profile } = useAuth();
  const { wallet } = useMoonrays();

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24">
      <div className="text-center py-4 animate-fade-in-up">
        <h2 className="font-heading text-xl font-bold text-white">Moonrays</h2>
        <p className="text-sm text-noctvm-silver mt-1">Your nightlife loyalty points</p>
      </div>

      {/* Prestige Rank Card (Lifetime Achievement) */}
      <div className="animate-fade-in-up stagger-2">
        <MoonraysPrestigeCard />
      </div>

      {/* Balance & Referral Card */}
      <div className="bg-gradient-to-br from-noctvm-violet/30 via-noctvm-midnight/90 to-purple-900/30 rounded-2xl p-6 border border-noctvm-violet/40 animate-fade-in-up stagger-3 relative overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="absolute -top-4 -right-4 text-8xl opacity-10 select-none pointer-events-none drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]">🌙</div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-noctvm-silver font-mono uppercase tracking-wider">Available Balance</span>
          {user && (
            <div className="px-2 py-0.5 rounded-full bg-noctvm-violet/20 text-noctvm-violet text-[10px] font-medium border border-noctvm-violet/30 flex items-center gap-1 shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-noctvm-violet animate-pulse" />
              Live Account
            </div>
          )}
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-5xl font-heading font-bold text-white tracking-tighter drop-shadow-sm">
            {wallet?.balance.toLocaleString() || (user ? '...' : '0')}
          </span>
          <span className="text-2xl mb-1.5 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">🌙</span>
        </div>
        
        {/* Referral Code */}
        {user && profile?.referral_code && (
          <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
            <p className="text-[10px] text-noctvm-silver/50 font-mono uppercase tracking-widest">Share to earn more</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm font-mono text-noctvm-violet truncate">
                {profile.referral_code}
              </div>
              <button 
                className="px-4 py-2 rounded-lg bg-noctvm-violet text-white text-xs font-semibold hover:bg-noctvm-violet-light transition-all active:scale-95 shadow-lg shadow-noctvm-violet/20"
                onClick={() => {
                  navigator.clipboard.writeText(profile.referral_code || '');
                  // Todo: Toast notification
                }}
              >
                Copy Code
              </button>
            </div>
            <p className="text-[9px] text-noctvm-silver/40 italic">Gets +100 MR for every friend that joins ✨</p>
          </div>
        )}
      </div>

      {/* How to earn */}
      <div className="bg-noctvm-surface rounded-xl border border-noctvm-border p-5 animate-fade-in-up stagger-3 shadow-xl">
        <h3 className="font-heading text-sm font-semibold text-white mb-4">How to Earn Moonrays</h3>
        <div className="space-y-4">
          {[
            { icon: '🌙', action: 'Create your account',  points: '+500', desc: 'Welcome bonus, one-time' },
            { icon: '📸', action: 'Share a post',         points: '+10',  desc: 'Per post published' },
            { icon: '🎭', action: 'Add a story',          points: '+5',   desc: 'Per 24h story' },
            { icon: '💬', action: 'Leave a comment',      points: '+2',   desc: 'Per comment' },
            { icon: '⭐', action: 'Review a venue',       points: '+25',  desc: 'Per verified review' },
            { icon: '🎟️', action: 'Attend an event',     points: '+50',  desc: 'Scan ticket at the door' },
            { icon: '👥', action: 'Invite a friend',      points: '+100', desc: 'When they sign up' },
          ].map(item => (
            <div key={item.action} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl flex-shrink-0 border border-white/5 shadow-inner">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium leading-tight">{item.action}</p>
                <p className="text-[10px] text-noctvm-silver/60 mt-0.5">{item.desc}</p>
              </div>
              <span className="text-sm font-bold text-noctvm-violet font-mono flex-shrink-0 bg-noctvm-violet/10 px-2 py-0.5 rounded-md border border-noctvm-violet/20">
                {item.points}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity (logged in only) */}
      {user && (
        <div className="bg-noctvm-surface rounded-xl border border-noctvm-border p-5 animate-fade-in-up stagger-4 shadow-xl">
          <h3 className="font-heading text-sm font-semibold text-white mb-4">Recent Activity</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-noctvm-violet/20 flex items-center justify-center text-xl flex-shrink-0 border border-noctvm-violet/20 shadow-inner">🌙</div>
            <div className="flex-1">
              <p className="text-sm text-white font-medium">Welcome bonus</p>
              <p className="text-[10px] text-noctvm-silver/50 mt-0.5">Account created</p>
            </div>
            <span className="text-sm font-bold text-noctvm-violet font-mono">+500</span>
          </div>
        </div>
      )}

      {/* Coming-soon redemption cards */}
      <div className="grid grid-cols-2 gap-4 animate-fade-in-up stagger-5 pb-8">
        {[
          { icon: <TicketIcon className="w-6 h-6 text-noctvm-violet" />, title: 'Redeem Tickets',  desc: 'Use Moonrays for event entry' },
          { icon: <StarIcon   className="w-6 h-6 text-noctvm-gold"   />, title: 'VIP Perks',       desc: 'Unlock exclusive venue benefits' },
        ].map(item => (
          <div key={item.title} className="bg-noctvm-surface/60 rounded-xl p-5 border border-noctvm-border relative overflow-hidden backdrop-blur-md group hover:bg-noctvm-surface transition-all">
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-noctvm-violet/10 border border-noctvm-violet/20 shadow-sm">
              <span className="text-[8px] font-mono text-noctvm-violet uppercase tracking-wider">Soon</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-black/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner border border-white/5">{item.icon}</div>
            <h3 className="font-heading text-sm font-bold text-white mb-1">{item.title}</h3>
            <p className="text-[11px] text-noctvm-silver/70 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
