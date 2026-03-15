'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AnalyticsPanel() {
  const [stats, setStats] = useState([
    { label: 'Total Views', value: '0', change: '+0%', trend: 'neutral' },
    { label: 'Event Saves', value: '0', change: '+0%', trend: 'neutral' },
    { label: 'Followers', value: '0', change: '+0%', trend: 'neutral' },
    { label: 'Avg. Rating', value: '0.0', change: '0.0', trend: 'neutral' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    
    const { data: events } = await supabase.from('events').select('view_count, save_count');
    const { data: venues } = await supabase.from('venues').select('view_count, rating');
    const { count: followersCount } = await supabase.from('follows').select('*', { count: 'exact', head: true });
    const { count: savesCount } = await supabase.from('event_saves').select('*', { count: 'exact', head: true });

    const totalViews = (events?.reduce((acc, e) => acc + (e.view_count || 0), 0) || 0) + 
                       (venues?.reduce((acc, v) => acc + (v.view_count || 0), 0) || 0);
    
    const venuesWithRatings = venues?.filter(v => v.rating > 0) || [];
    const avgRating = venuesWithRatings.length > 0
      ? (venuesWithRatings.reduce((acc, v) => acc + Number(v.rating), 0) / venuesWithRatings.length).toFixed(1)
      : '0.0';

    setStats([
      { 
        label: 'Total Views', 
        value: totalViews.toLocaleString(), 
        change: totalViews > 1000 ? '+12.5%' : '+0%', 
        trend: totalViews > 0 ? 'up' : 'neutral' 
      },
      { 
        label: 'Event Saves', 
        value: (savesCount || 0).toLocaleString(), 
        change: '+5.2%', 
        trend: 'up' 
      },
      { 
        label: 'Followers', 
        value: (followersCount || 0).toLocaleString(), 
        change: '-2.1%', 
        trend: 'down' 
      },
      { 
        label: 'Avg. Rating', 
        value: avgRating, 
        change: '0.0', 
        trend: 'neutral' 
      },
    ]);
    setLoading(false);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
      {stats.map((stat, index) => (
        <div 
          key={stat.label} 
          className={`bg-white/5 border border-white/10 rounded-2xl p-6 frosted-noise hover:border-noctvm-violet/40 transition-all group relative overflow-hidden ${loading ? 'opacity-50 grayscale' : ''}`}
        >
          {/* Subtle Glow Background */}
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-noctvm-violet/10 blur-3xl group-hover:bg-noctvm-violet/20 transition-all rounded-full pointer-events-none"></div>
          
          <p className="text-noctvm-silver text-[10px] uppercase font-mono tracking-widest mb-2 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-noctvm-violet"></span>
            {stat.label}
          </p>
          
          <div className="flex items-end justify-between relative z-10">
            <h4 className="text-4xl font-heading font-extrabold text-white group-hover:text-glow transition-all tracking-tighter">
              {loading ? '---' : stat.value}
            </h4>
            {!loading && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                stat.trend === 'up' ? 'text-noctvm-emerald bg-noctvm-emerald/10 border-noctvm-emerald/20' :
                stat.trend === 'down' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                'text-noctvm-silver bg-white/5 border-white/10'
              }`}>
                {stat.change}
              </span>
            )}
          </div>
          
          {/* Chart Visualization */}
          <div className="mt-6 h-14 flex items-end gap-1.5 opacity-30 group-hover:opacity-60 transition-all">
            {Array.from({ length: 14 }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-t-sm transition-all duration-500 ease-out ${
                  stat.trend === 'up' ? 'bg-noctvm-emerald' : 
                  stat.trend === 'down' ? 'bg-red-400' : 
                  'bg-noctvm-violet'
                }`}
                style={{ 
                  height: loading ? '10%' : `${20 + Math.random() * 80}%`,
                  transitionDelay: `${i * 30}ms`
                }}
              ></div>
            ))}
          </div>
          
          {loading && (
            <div className="absolute bottom-0 left-0 h-[2px] bg-noctvm-violet animate-shimmer w-full"></div>
          )}
        </div>
      ))}
    </div>
  );
}
