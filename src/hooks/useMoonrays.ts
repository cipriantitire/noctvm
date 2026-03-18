'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MoonraysWallet, MoonraysRank, MOONRAYS_RANKS, RankInfo } from '@/types/moonrays';

export function useMoonrays() {
  const [wallet, setWallet] = useState<MoonraysWallet | null>(null);
  const [rank, setRank] = useState<RankInfo>(MOONRAYS_RANKS['Bronze Voyager']);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: walletData, error } = await supabase
      .from('moonrays_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && walletData) {
      setWallet(walletData);
      
      // Calculate rank locally from lifetime earned
      const lifetime = walletData.net_earned || 0;
      let currentRank: MoonraysRank = 'Bronze Voyager';
      
      if (lifetime >= 1000000) currentRank = 'MASTERY';
      else if (lifetime >= 300000) currentRank = 'Diamond Night-Owl';
      else if (lifetime >= 100000) currentRank = 'Platinum Aura';
      else if (lifetime >= 25000) currentRank = 'Gold Eclipse';
      else if (lifetime >= 5000) currentRank = 'Silver Pulse';
      
      setRank(MOONRAYS_RANKS[currentRank]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const progressPercent = useMemo(() => {
    if (!wallet || !rank.nextRankGoal) return 0;
    const currentPoints = wallet.net_earned || 0;
    const prevGoal = rank.minPoints;
    const nextGoal = rank.nextRankGoal;
    
    return Math.min(100, Math.max(0, ((currentPoints - prevGoal) / (nextGoal - prevGoal)) * 100));
  }, [wallet, rank]);

  return {
    wallet,
    rank,
    progressPercent,
    loading,
    refresh: fetchWallet
  };
}

import { useMemo } from 'react';
