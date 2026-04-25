'use client';

import React from 'react';
import { useMoonrays } from '@/hooks/useMoonrays';
import { SparklesIcon, MoonIcon, TrendingUpIcon, LockIcon } from 'lucide-react';
import { PrestigeProgressMotion } from './PrestigeProgressMotion';

export const MoonraysPrestigeCard = () => {
  const { pocket, rank, progressPercent, loading, isAuthenticated } = useMoonrays();

  // 1. Loading State
  if (loading) return (
    <div className="bg-noctvm-surface/40 rounded-2xl h-[180px] animate-pulse border border-white/5" />
  );

  // 2. Not Logged In State (Fixes the "flashing" issue)
  if (!isAuthenticated || !pocket) return (
    <div className="group relative overflow-hidden rounded-2xl p-8 transition-all duration-500 hover:scale-[1.01]">
      <div className="absolute inset-0 bg-gradient-to-br from-noctvm-violet/10 via-black/80 to-purple-900/40 backdrop-blur-[60px] border border-white/5 rounded-2xl shadow-xl" />
      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
          <LockIcon className="w-8 h-8 text-noctvm-silver/40" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-bold text-white">Your Nightly Status</h3>
          <p className="text-xs text-noctvm-silver/60 mt-1 max-w-[200px]">Rank up, claim perks, and unlock premium cosmetics by logging in.</p>
        </div>
      </div>
    </div>
  );

  // 3. Authenticated Card
  return (
    <div className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:scale-[1.01] active:scale-[0.98]">
      {/* ── Liquid Glass Layer (Refracted) ────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-br from-noctvm-violet/20 via-black/80 to-purple-900/40 backdrop-blur-[60px] border border-white/10 rounded-2xl shadow-2xl overflow-hidden shadow-black/80 ring-1 ring-white/10" />

      {/* ── Top Highlight (Specular) ─────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-2xl pointer-events-none" />

      {/* ── Ambient Rank Glow ────────────────────────────── */}
      <div 
        className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[80px] mix-blend-screen opacity-40 animate-pulse duration-5000"
        style={{ 
          backgroundColor: 'var(--glow-color)',
          '--glow-color': rank.glowColor 
        } as React.CSSProperties}
      />

      {/* ── Content ──────────────────────────────────────── */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${rank.color} flex items-center justify-center shadow-lg transform rotate-3 border border-white/20`}>
              <MoonIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-noctvm-caption text-noctvm-silver/60 font-mono uppercase tracking-[0.2em]">Current Rank</p>
              <h3 className="text-xl font-heading font-bold text-white tracking-tight">{rank.name}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-noctvm-caption text-noctvm-silver/60 font-mono uppercase tracking-[0.2em]">Lifetime Achievement</p>
            <p className="text-lg font-heading font-bold text-noctvm-violet drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]">
              {pocket.net_earned.toLocaleString()} <span className="text-sm">🌙</span>
            </p>
          </div>
        </div>

        {/* ── Progress Section ───────────────────────────── */}
        {rank.nextRankName && (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <p className="text-xs text-noctvm-silver/80 flex items-center gap-1.5 font-medium">
                <TrendingUpIcon className="w-3.5 h-3.5 text-noctvm-violet" />
                {rank.nextRankName} <span className="text-noctvm-caption text-noctvm-silver/40 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 uppercase font-mono">NEXT</span>
              </p>
              <p className="text-noctvm-caption text-noctvm-silver/60 font-mono tracking-wider italic">
                {Math.max(0, (rank.nextRankGoal || 0) - pocket.net_earned).toLocaleString()} MR to rank up
              </p>
            </div>

            {/* ── Glass Motion Progress Bar ────────────────── */}
            <PrestigeProgressMotion progress={progressPercent} color={rank.color} />

            {/* ── Next Perks Teaser ─────────────────────── */}
            <div className="flex flex-wrap gap-2 pt-2">
              {rank.perks.slice(0, 2).map((perk, i) => (
                <span key={i} className="text-noctvm-micro px-2 py-0.5 rounded-full bg-white/5 text-noctvm-silver/80 border border-white/5 backdrop-blur-md flex items-center gap-1 hover:bg-white/10 transition-colors">
                  <SparklesIcon className="w-2.5 h-2.5 text-noctvm-violet" />
                  {perk}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
