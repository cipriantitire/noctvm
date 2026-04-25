'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
  ChevronRightIcon,
  PlusIcon,
  InfoIcon,
} from 'lucide-react';
import { PocketIcon } from '@/components/icons';
import { PocketModal } from '@/components/moonrays/PocketModal';
import { BoutiqueModal } from '@/components/moonrays/BoutiqueModal';

export default function PocketPage() {
  const { user, profile } = useAuth();
  const { pocket, rank, loading } = useMoonrays();
  const [copied, setCopied] = useState(false);
  
  // Modal states
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isBoutiqueOpen, setIsBoutiqueOpen] = useState(false);
  const [isItemPreviewOpen, setIsItemPreviewOpen] = useState(false);
  
  // Dynamic Rewards
  const [rewards, setRewards] = useState<any[]>([]);
  const [fetchingRewards, setFetchingRewards] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const { data, error } = await supabase.from('reward_config_public').select('*');
        if (!error && data) {
          // Map to match the existing UI structure
          const iconMap: Record<string, string> = {
            'sign_up': '🌙',
            'post_create': '📸',
            'story_create': '🎭',
            'comment_create': '💬',
            'venue_review': '⭐',
            'repost': '🔄',
            'referral_invite': '👥',
            'attend_event': '🎟️'
          };
          
          const labelMap: Record<string, string> = {
            'sign_up': 'Create your account',
            'post_create': 'Share a post',
            'story_create': 'Add a story',
            'comment_create': 'Leave a comment',
            'venue_review': 'Review a venue',
            'repost': 'Repost content',
            'referral_invite': 'Invite a friend',
            'attend_event': 'Attend an event'
          };

          const descMap: Record<string, string> = {
            'sign_up': 'Welcome bonus, one-time',
            'post_create': 'Per post published',
            'story_create': 'Per 24h story',
            'comment_create': 'Per comment',
            'venue_review': 'Per verified review',
            'repost': 'Per repost shared',
            'referral_invite': 'When they sign up',
            'attend_event': 'Scan ticket at the door'
          };

          setRewards(data.map(r => ({
            icon: iconMap[r.id] || '✨',
            action: labelMap[r.id] || r.id.replace(/_/g, ' '),
            points: `+${r.points}`,
            desc: descMap[r.id] || `Awarded for ${r.id}`,
            id: r.id
          })));
        }
      } catch (err) {
        console.error('Error fetching reward config:', err);
      } finally {
        setFetchingRewards(false);
      }
    };

    fetchRewards();
  }, []);

  const copyToClipboard = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fallback if DB fetch fails or is pending
  const REWARDS_LIST = rewards.length > 0 ? rewards : [
    { icon: '🌙', action: 'Create your account',  points: '+500', desc: 'Welcome bonus, one-time' },
    { icon: '📸', action: 'Share a post',         points: '+10',  desc: 'Per post published' },
    { icon: '🎭', action: 'Add a story',          points: '+5',   desc: 'Per 24h story' },
    { icon: '💬', action: 'Leave a comment',      points: '+2',   desc: 'Per comment' },
    { icon: '⭐', action: 'Review a venue',       points: '+25',  desc: 'Per verified review' },
    { icon: '🎟️', action: 'Attend an event',     points: '+50',  desc: 'Scan ticket at the door' },
    { icon: '👥', action: 'Invite a friend',      points: '+100', desc: 'When they sign up' },
  ];

  return (
    <div className="space-y-12 max-w-2xl mx-auto pb-40 px-4 pt-12">
      {/* ── 1. The Moonrays Pulsar (Hero Balance) ───────── */}
      <section className="relative flex flex-col items-center justify-center py-12">
        <div 
          className="absolute w-64 h-64 rounded-full blur-[120px] mix-blend-screen opacity-20 animate-pulse duration-[5s] transition-colors"
          style={{ 
            backgroundColor: 'var(--glow-color)',
            '--glow-color': rank?.glowColor || '#8B5CF6' 
          } as React.CSSProperties}
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center border border-white/10 glass-card bg-noctvm-midnight/40 shadow-2xl group cursor-pointer active:scale-[0.96] transition-all"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/5 to-transparent overflow-hidden pointer-events-none" />
          <PocketIcon className="w-8 h-8 text-noctvm-violet mb-2 animate-float" />
          <span className="text-4xl font-heading font-black text-foreground text-glow">
            {pocket?.balance.toLocaleString() || (loading ? '...' : '0')}
          </span>
          <span className="text-noctvm-caption text-noctvm-silver/60 font-mono uppercase tracking-[0.3em] mt-1 italic">Pocket</span>
        </motion.div>
      </section>

      {/* ── 1.5. Live Activity Ticker (Activity Tracker Refined) ── */}
      <MoonraysTicker />

      {/* ── 2. Prestige Journey ────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-heading font-bold text-foreground uppercase tracking-widest">Nightly Prestige</h2>
        </div>
        <MoonraysPrestigeCard />
      </section>

      {/* ── 3. The Earning nexus (Guide + Referrals) ───── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Guide Link */}
        <button 
          onClick={() => setIsGuideOpen(true)}
          className="group relative overflow-hidden rounded-3xl p-6 bg-white/[0.03] border border-white/5 text-left hover:bg-white/[0.05] transition-all"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <PlusIcon className="w-12 h-12 text-noctvm-violet" />
          </div>
          <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wider mb-1">Earning Guide</h3>
          <p className="text-noctvm-caption text-noctvm-silver/60">Earn Moonrays through social rites</p>
          <div className="mt-4 flex items-center gap-1.5 text-noctvm-caption font-mono text-noctvm-violet uppercase">
            Browse Methods <ChevronRightIcon className="w-3 h-3" />
          </div>
        </button>

        {/* Referrals Link */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-noctvm-violet/5 border border-noctvm-violet/10 text-left">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <StarIcon className="w-12 h-12 text-noctvm-gold" />
          </div>
          <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wider mb-1">Invite Nexus</h3>
          <p className="text-noctvm-caption text-noctvm-silver/60">Share code: <span className="text-noctvm-violet font-mono">{profile?.referral_code || '...'}</span></p>
          <button 
            onClick={copyToClipboard}
            className="mt-4 flex items-center gap-1.5 text-noctvm-caption font-mono text-noctvm-violet uppercase hover:underline"
          >
            {copied ? 'Copied' : 'Copy Code'} <CopyIcon className="w-3 h-3" />
          </button>
        </div>
      </section>

      {/* ── 4. The Vanity Emporium (Redeem Section) ────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-heading font-bold text-foreground uppercase tracking-widest">Vanity Emporium</h2>
          <button 
            onClick={() => setIsBoutiqueOpen(true)}
            className="text-noctvm-caption text-noctvm-violet font-mono uppercase flex items-center gap-1 hover:underline active:scale-[0.96] transition-all"
          >
            Enter Boutique <ShoppingBagIcon className="w-3 h-3" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'Violet Pulse Frame', cost: 1200, type: 'Avatar Effect', color: 'bg-noctvm-violet/40', icon: <StarIcon className="w-5 h-5 text-noctvm-violet" /> },
            { name: 'Obsidian Bio', cost: 800, type: 'Profile Vibe', color: 'bg-gray-900', icon: <MoonIcon className="w-5 h-5 text-noctvm-silver" /> },
          ].map(item => (
            <div 
              key={item.name} 
              onClick={() => setIsItemPreviewOpen(true)}
              className="relative group p-5 rounded-3xl bg-white/5 border border-white/5 overflow-hidden cursor-pointer active:scale-[0.96] transition-all hover:bg-white/10"
            >
              <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl ${item.color} opacity-20`} />
              <div className="w-10 h-10 rounded-xl bg-noctvm-black/40 border border-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h4 className="text-noctvm-caption font-heading font-bold text-foreground mb-1 uppercase tracking-wider">{item.name}</h4>
              <p className="text-noctvm-micro text-noctvm-silver/50 font-mono mb-4">{item.type}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-noctvm-violet">{item.cost} <span className="text-noctvm-xs">MR</span></span>
                <span className="text-noctvm-xs font-mono text-foreground/20 uppercase tracking-widest flex items-center gap-1 border border-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
                   Preview <ExternalLinkIcon className="w-2 h-2" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODALS ───────────── */}
      
      {/* 1. Rewards Guide Modal */}
      <PocketModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
        title="Moonrays Pocket Guide"
      >
        <div className="space-y-4">
          {REWARDS_LIST.map((item, i) => (
            <motion.div 
              key={item.action} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl"
            >
              <div className="w-12 h-12 rounded-xl bg-noctvm-black/40 flex items-center justify-center text-2xl border border-white/5 shadow-inner">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-bold leading-tight">{item.action}</p>
                <p className="text-noctvm-caption text-noctvm-silver/60 mt-0.5">{item.desc}</p>
              </div>
              <span className="text-xs font-bold text-noctvm-violet font-mono bg-noctvm-violet/10 px-3 py-1 rounded-lg border border-noctvm-violet/20">
                {item.points}
              </span>
            </motion.div>
          ))}
        </div>
      </PocketModal>

      {/* 2. Digital Identity Boutique Modal */}
      <BoutiqueModal 
        isOpen={isBoutiqueOpen} 
        onClose={() => setIsBoutiqueOpen(false)} 
        pocketBalance={pocket?.balance || 0}
      />

      {/* 3. Previewer Placeholder */}
      <PocketModal 
        isOpen={isItemPreviewOpen} 
        onClose={() => setIsItemPreviewOpen(false)} 
        title="Asset Previewer"
      >
        <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-pulse">
           <div className="w-32 h-32 rounded-full border-4 border-noctvm-violet border-t-transparent animate-spin" />
           <p className="text-noctvm-caption font-mono text-noctvm-violet uppercase tracking-widest">Generating Neural Preview...</p>
        </div>
      </PocketModal>

    </div>
  );
}
