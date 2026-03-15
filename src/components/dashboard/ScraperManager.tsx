'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ScrapeResult {
  source: string;
  count: number;
  error?: string;
}

interface Summary {
  total: number;
  upserted: number;
  results: ScrapeResult[];
  skipped_venues: string[];
}

export default function ScraperManager() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runScrapers = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setSummary(null);

    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSummary(data);
        setLastRun(new Date().toLocaleString());
      } else {
        alert(data.error || 'Failed to run scrapers');
      }
    } catch (err) {
      alert('Network error while running scrapers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
        <header>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-noctvm-violet animate-pulse shadow-[0_0_12px_rgba(139,92,246,0.8)]"></div>
            <h2 className="text-4xl font-heading font-black tracking-tighter italic uppercase text-white">Signal Orchestrator</h2>
          </div>
          <p className="text-noctvm-silver text-xs font-mono uppercase tracking-[0.3em] opacity-50">Automated event discovery & resource management</p>
        </header>

        <button 
          onClick={runScrapers}
          disabled={loading}
          className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-2xl active:scale-95 ${
            loading 
              ? 'bg-white/5 text-noctvm-silver cursor-not-allowed border border-white/10' 
              : 'bg-noctvm-violet text-white border border-noctvm-violet/50 hover:bg-noctvm-violet/80 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:scale-105'
          }`}
        >
          {loading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
          )}
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <span>ORCHESTRATING...</span>
            </>
          ) : (
            <>
              <span className="text-xl group-hover:rotate-12 transition-transform">⚡</span>
              <span>INITIATE_FULL_SCRAPE</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'System Status', value: loading ? 'ACTIVE_SCAN' : 'STATION_READY', color: loading ? 'noctvm-gold' : 'noctvm-emerald' },
          { label: 'Last Transmission', value: lastRun || 'NO_DATA', color: 'noctvm-violet' },
          { label: 'Active Channels', value: '07_SOURCES', color: 'noctvm-emerald' }
        ].map((stat, i) => (
          <div key={i} className="group bg-white/5 border border-white/10 rounded-[24px] p-8 frosted-noise hover:border-white/20 transition-all hover:bg-white/[0.07] relative overflow-hidden shadow-xl">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-100 transition-opacity`}></div>
            <p className="text-[10px] text-noctvm-silver/40 uppercase font-mono tracking-[0.3em] mb-3">{stat.label}</p>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full bg-${stat.color} shadow-[0_0_10px_rgba(var(--${stat.color}-rgb),0.8)] ${loading && i === 0 ? 'animate-pulse' : ''}`}></div>
              <span className="text-2xl font-black tracking-tighter text-white uppercase italic">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {summary && (
        <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden animate-slide-up frosted-noise shadow-2xl">
          <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-2 h-2 rounded-sm bg-noctvm-emerald rotate-45"></span>
              Transmission Analysis
            </h3>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-noctvm-emerald/10 text-noctvm-emerald rounded-xl border border-noctvm-emerald/20 text-[10px] font-black tracking-widest uppercase">
              <span className="animate-pulse">●</span>
              {summary.upserted} UPSERTED
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-px bg-white/5">
            {summary.results.map((r, i) => (
              <div key={i} className="bg-noctvm-black/20 p-8 flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-colors">
                <span className="text-[9px] text-noctvm-silver/40 uppercase font-mono tracking-[0.2em] mb-2">{r.source}</span>
                <span className={`text-4xl font-black italic tracking-tighter ${r.error ? 'text-noctvm-rose' : 'text-white group-hover:text-noctvm-violet transition-colors'}`}>
                  {r.error ? 'ERR' : r.count.toString().padStart(2, '0')}
                </span>
                {r.error && (
                  <div className="mt-4 px-3 py-1 bg-noctvm-rose/10 border border-noctvm-rose/20 rounded-md">
                    <p className="text-[8px] text-noctvm-rose font-mono uppercase tracking-tighter truncate max-w-[120px]">{r.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {summary.skipped_venues.length > 0 && (
            <div className="p-8 bg-noctvm-rose/[0.03] border-t border-white/5">
              <h4 className="text-xs font-black text-noctvm-rose mb-6 flex items-center gap-3 uppercase tracking-[0.2em]">
                <span className="animate-pulse">⚠️</span> Conflict Resolution Required ({summary.skipped_venues.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto no-scrollbar">
                {summary.skipped_venues.map((v, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 group hover:border-noctvm-rose/30 transition-all">
                    <span className="text-noctvm-rose font-mono text-[10px]">[{ (i+1).toString().padStart(2, '0') }]</span>
                    <span className="text-xs text-noctvm-silver font-bold uppercase tracking-tight group-hover:text-white transition-colors">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scraper Logs / Manual Triggers Placeholder */}
      <section className="bg-white/[0.02] border border-white/5 border-dashed rounded-[32px] p-16 text-center group hover:bg-white/[0.04] transition-all">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-6xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 opacity-20">🤖</div>
          <h3 className="text-xl font-black uppercase tracking-widest text-white/40">Manual Source Overrides</h3>
          <p className="text-noctvm-silver/30 text-xs font-mono uppercase tracking-[0.2em] leading-relaxed">
            Neural link established. Individual channel triggers and cron scheduling interface currently offline.
          </p>
          <div className="pt-4 flex justify-center gap-4 opacity-20">
             {[1,2,3,4].map(i => <div key={i} className="w-8 h-1 bg-white/20 rounded-full"></div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
