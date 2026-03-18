'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useMoonrays } from '@/hooks/useMoonrays';
import { MoonraysPrestigeCard } from '@/components/moonrays/MoonraysPrestigeCard';
import { MoonraysTicker } from '@/components/moonrays/MoonraysTicker';
import { 
  MoonIcon, 
  TicketIcon, 
  StarIcon, 
  TrendingUpIcon, 
  CopyIcon, 
  ExternalLinkIcon, 
  ShoppingBagIcon,
  ChevronRightIcon
} from 'lucide-react';

export default function WalletPage() {
  const { user, profile } = useAuth();
  const { wallet, rank, loading } = useMoonrays();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-12 max-w-2xl mx-auto pb-40 px-4 pt-12">
      {/* ── 1. The Moonrays Pulsar (Hero Balance) ───────── */}
      <section className="relative flex flex-col items-center justify-center py-12">
        {/* Glow Background */}
        <div 
          className="absolute w-64 h-64 rounded-full blur-[120px] mix-blend-screen opacity-20 animate-pulse duration-[5s] transition-colors"
          style={{ backgroundColor: rank?.glowColor || '#8B5CF6' }}
        />
        
        {/* The Balance Orb (Liquid Glass) */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center border border-white/10 glass-card bg-noctvm-midnight/40 shadow-2xl group cursor-pointer active:scale-95 transition-all"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/5 to-transparent overflow-hidden pointer-events-none" />
          <MoonIcon className="w-8 h-8 text-noctvm-violet mb-2 animate-float" />
          <span className="text-4xl font-heading font-black text-white text-glow">
            {wallet?.balance.toLocaleString() || (loading ? '...' : '0')}
          </span>
          <span className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-[0.3em] mt-1 italic">Balance</span>
        </motion.div>

        {/* Floating Accents */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <motion.div 
            animate={{ y: [0, -10, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute top-10 right-20 w-1.5 h-1.5 rounded-full bg-noctvm-violet blur-[2px]"
          />
          <motion.div 
            animate={{ y: [0, 8, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 6, delay: 1 }}
            className="absolute bottom-20 left-10 w-2 h-2 rounded-full bg-purple-500 blur-[3px]"
          />
        </div>
      </section>

      {/* ── 1.5. Live Activity Ticker ──────────────────── */}
      <MoonraysTicker />

      {/* ── 2. Prestige Journey ────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-heading font-bold text-white uppercase tracking-widest bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Nightly Prestige</h2>
        </div>
        <MoonraysPrestigeCard />
      </section>

      {/* ── 3. The Referral Nexus (Earning Engine) ───── */}
      {user && profile?.referral_code && (
        <section className="group relative overflow-hidden rounded-3xl p-8 bg-black/40 border border-white/5 shadow-inner">
          <div className="absolute top-0 right-0 w-32 h-32 bg-noctvm-violet/5 rounded-full blur-[60px]" />
          <div className="relative z-10">
            <h3 className="text-lg font-heading font-bold text-white mb-2 flex items-center gap-2">
              Referral Nexus <span className="text-xs text-noctvm-violet font-mono font-normal">EARN +100 MR</span>
            </h3>
            <p className="text-xs text-noctvm-silver/70 leading-relaxed mb-6 max-w-[340px]">Expand your network. For every friend that enters the night using your code, you both earn Moonrays.</p>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-lg font-mono text-noctvm-violet tracking-widest flex items-center justify-between group/code hover:bg-white/10 transition-colors">
                {profile.referral_code}
                <button 
                  onClick={copyToClipboard}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {copied ? <StarIcon className="w-5 h-5 text-noctvm-gold fill-current animate-wiggle" /> : <CopyIcon className="w-5 h-5 opacity-40 group-hover/code:opacity-100 transition-opacity" />}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. The Vanity Shop Preview (Boutique) ──────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-heading font-bold text-white uppercase tracking-widest bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Vanity Emporium</h2>
          <button className="text-[10px] text-noctvm-violet font-mono uppercase flex items-center gap-1 hover:underline">View Store <ChevronRightIcon className="w-3 h-3" /></button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'Violet Pulse Frame', cost: 1200, type: 'Avatar Effect', color: 'from-noctvm-violet/40 to-transparent' },
            { name: 'Obsidian Bio', cost: 800, type: 'Profile Vibe', color: 'from-gray-900 to-black' },
          ].map(item => (
            <div key={item.name} className="relative group p-5 rounded-3xl bg-white/5 border border-white/5 overflow-hidden active:scale-95 transition-all hover:bg-white/10">
              <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl bg-gradient-to-tr ${item.color} opacity-40`} />
              <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ShoppingBagIcon className="w-5 h-5 text-white/40" />
              </div>
              <h4 className="text-[11px] font-heading font-bold text-white mb-1 uppercase tracking-wider">{item.name}</h4>
              <p className="text-[9px] text-noctvm-silver/50 font-mono mb-4">{item.type}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-noctvm-violet">{item.cost} <span className="text-[8px]">MR</span></span>
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-1 border border-white/10 px-2 py-0.5 rounded-full">Preview <ExternalLinkIcon className="w-2 h-2" /></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Earning Deck (Carousel-like) ───────────── */}
      <section className="space-y-6">
        <div className="px-2">
          <h2 className="text-sm font-heading font-bold text-white uppercase tracking-widest bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">Earning Rites</h2>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 no-scrollbar scroll-smooth">
          {[
            { icon: '🎭', label: 'Socialite', desc: 'Post stories & feed updates', reward: 15 },
            { icon: '🤝', label: 'Connector', desc: 'Build your referral network', reward: 100 },
            { icon: '⭐', label: 'Taster', desc: 'Review & rate locations', reward: 25 },
            { icon: '🎫', label: 'Explorer', desc: 'Scan tickets at events', reward: 50 },
          ].map(item => (
            <div key={item.label} className="min-w-[140px] p-5 rounded-3xl bg-noctvm-surface/60 border border-white/5 shadow-xl flex flex-col items-center text-center">
              <div className="text-4xl mb-3 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{item.icon}</div>
              <h4 className="text-xs font-bold text-white mb-1">{item.label}</h4>
              <p className="text-[9px] text-noctvm-silver/40 leading-tight mb-4">{item.desc}</p>
              <span className="mt-auto px-3 py-1 rounded-full bg-noctvm-violet/20 text-noctvm-violet font-mono font-bold text-[10px] border border-noctvm-violet/20">
                +{item.reward}
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
