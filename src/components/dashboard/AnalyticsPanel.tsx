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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
      {/* Featured stat: Total Views — spans 2 cols on desktop */}
      <div className={`lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 frosted-noise hover:border-noctvm-violet/40 transition-all group relative overflow-hidden ${loading ? 'opacity-50 grayscale' : ''}`}>
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-noctvm-violet/10 blur-3xl group-hover:bg-noctvm-violet/20 transition-all rounded-full pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-noctvm-silver text-noctvm-caption uppercase font-mono tracking-widest mb-2 flex items-center gap-2">
              <svg className="w-3 h-3 text-noctvm-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              {stats[0].label}
            </p>
            <h4 className="text-5xl font-heading font-black text-foreground group-hover:text-glow transition-all tracking-tighter">
              {loading ? '---' : stats[0].value}
            </h4>
          </div>
          {!loading && (
            <span className={`text-noctvm-caption font-mono font-bold px-2 py-1 rounded-lg border ${
              stats[0].trend === 'up' ? 'text-noctvm-emerald bg-noctvm-emerald/10 border-noctvm-emerald/20' :
              stats[0].trend === 'down' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
              'text-noctvm-silver bg-white/5 border-white/10'
            }`}>
              {stats[0].change}
            </span>
          )}
        </div>
        <div className="mt-6 h-16 flex items-end gap-1 opacity-30 group-hover:opacity-60 transition-all">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex-1 rounded-t-sm bg-noctvm-violet transition-all duration-500" style={{ height: loading ? '10%' : `${15 + Math.random() * 85}%`, transitionDelay: `${i * 20}ms` }} />
          ))}
        </div>
        {loading && <div className="absolute bottom-0 left-0 h-[2px] bg-noctvm-violet animate-shimmer w-full" />}
      </div>

      {/* Secondary stats: stacked vertically on the right */}
      {stats.slice(1).map((stat, index) => (
        <div 
          key={stat.label} 
          className={`bg-white/5 border border-white/10 rounded-2xl p-5 frosted-noise hover:border-noctvm-violet/30 transition-all group relative overflow-hidden ${loading ? 'opacity-50 grayscale' : ''}`}
        >
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-noctvm-violet/5 blur-3xl group-hover:bg-noctvm-violet/15 transition-all rounded-full pointer-events-none" />
          
          <p className="text-noctvm-silver text-noctvm-caption uppercase font-mono tracking-widest mb-3 flex items-center gap-2">
            {index === 0 && <svg className="w-3 h-3 text-noctvm-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
            {index === 1 && <svg className="w-3 h-3 text-noctvm-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            {index === 2 && <svg className="w-3 h-3 text-noctvm-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
            {stat.label}
          </p>
          
          <div className="flex items-end justify-between relative z-10">
            <h4 className="text-3xl font-heading font-black text-foreground group-hover:text-glow transition-all tracking-tighter">
              {loading ? '---' : stat.value}
            </h4>
            {!loading && (
              <span className={`text-noctvm-caption font-mono font-bold px-1.5 py-0.5 rounded border ${
                stat.trend === 'up' ? 'text-noctvm-emerald bg-noctvm-emerald/10 border-noctvm-emerald/20' :
                stat.trend === 'down' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                'text-noctvm-silver bg-white/5 border-white/10'
              }`}>
                {stat.change}
              </span>
            )}
          </div>
          
          <div className="mt-4 h-10 flex items-end gap-1 opacity-20 group-hover:opacity-50 transition-all">
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-t-sm transition-all duration-500 ease-out ${
                  stat.trend === 'up' ? 'bg-noctvm-emerald' : 
                  stat.trend === 'down' ? 'bg-red-400' : 
                  'bg-noctvm-violet'
                }`}
                style={{ 
                  height: loading ? '10%' : `${20 + Math.random() * 80}%`,
                  transitionDelay: `${i * 40}ms`
                }}
              />
            ))}
          </div>
          
          {loading && (
            <div className="absolute bottom-0 left-0 h-[2px] bg-noctvm-violet animate-shimmer w-full" />
          )}
        </div>
      ))}
    </div>
  );
}
