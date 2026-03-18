'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { MoonraysPocket, MoonraysRank, MOONRAYS_RANKS, RankInfo } from '@/types/moonrays';

export function useMoonrays() {
  const [pocket, setPocket] = useState<MoonraysPocket | null>(null);
  const [rank, setRank] = useState<RankInfo>(MOONRAYS_RANKS['Bronze Voyager']);
  const [loading, setLoading] = useState(true);

  const fetchPocket = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch pocket
      const { data: pocketData, error } = await supabase
        .from('moonrays_wallets') // Table name stays same for now (DB sync)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && pocketData) {
        setPocket(pocketData);
        
        const lifetime = pocketData.net_earned || 0;
        const currentRank = Object.values(MOONRAYS_RANKS)
          .reverse()
          .find(r => lifetime >= r.minPoints) || MOONRAYS_RANKS['Bronze Voyager'];
          
        setRank(currentRank);
      }
    } catch (err) {
      console.error('Error fetching pocket:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPocket();

    // Subscribe to pocket updates
    const channel = supabase
      .channel('pocket_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'moonrays_wallets' }, () => {
        fetchPocket();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPocket]);

  const progressPercent = useMemo(() => {
    if (!pocket || !rank.nextRankGoal) return 0;
    const currentPoints = pocket.net_earned || 0;
    const prevGoal = Object.values(MOONRAYS_RANKS)
      .find(r => r.minPoints < currentPoints && r.minPoints > 0)?.minPoints || 0;
    
    return Math.min(100, ((currentPoints - prevGoal) / (rank.nextRankGoal - prevGoal)) * 100);
  }, [pocket, rank]);

  return {
    pocket,
    rank,
    progressPercent,
    loading,
    refresh: fetchPocket,
    isAuthenticated: !!pocket
  };
}
