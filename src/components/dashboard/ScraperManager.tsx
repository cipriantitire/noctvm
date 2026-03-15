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
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <header>
          <h2 className="text-2xl font-heading font-bold">Scraper Control Center</h2>
          <p className="text-noctvm-silver text-sm">Orchestrate automated event discovery from all sources.</p>
        </header>

        <button 
          onClick={runScrapers}
          disabled={loading}
          className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${
            loading 
              ? 'bg-white/5 text-noctvm-silver cursor-not-allowed' 
              : 'bg-noctvm-violet hover:bg-noctvm-violet/80 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              RUNNING ALL...
            </>
          ) : (
            <>
              <span>⚡</span>
              RUN FULL SCRAPE
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 frosted-noise">
          <p className="text-[10px] text-noctvm-silver uppercase font-mono tracking-widest mb-1">Status</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${loading ? 'bg-noctvm-gold animate-pulse' : 'bg-noctvm-emerald'}`}></span>
            <span className="text-lg font-bold">{loading ? 'ACTIVE' : 'READY'}</span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 frosted-noise">
          <p className="text-[10px] text-noctvm-silver uppercase font-mono tracking-widest mb-1">Last Run</p>
          <span className="text-lg font-bold">{lastRun || 'NEVER'}</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 frosted-noise">
          <p className="text-[10px] text-noctvm-silver uppercase font-mono tracking-widest mb-1">Active Sources</p>
          <span className="text-lg font-bold">7</span>
        </div>
      </div>

      {summary && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-slide-up bg-gradient-to-br from-noctvm-violet/5 to-transparent">
          <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <span className="text-noctvm-emerald">✓</span> Scrape Summary
            </h3>
            <span className="text-[10px] font-mono bg-noctvm-emerald/20 text-noctvm-emerald px-2 py-0.5 rounded-full border border-noctvm-emerald/30">
              {summary.upserted} UPSERTED
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
            {summary.results.map((r, i) => (
              <div key={i} className="bg-noctvm-black/40 p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-noctvm-silver uppercase font-mono mb-1">{r.source}</span>
                <span className={`text-xl font-bold ${r.error ? 'text-noctvm-rose' : 'text-white'}`}>
                  {r.error ? '!' : r.count}
                </span>
                {r.error && <p className="text-[8px] text-noctvm-rose mt-1 max-w-full truncate">{r.error}</p>}
              </div>
            ))}
          </div>

          {summary.skipped_venues.length > 0 && (
            <div className="p-6 bg-noctvm-rose/5 border-t border-white/10">
              <h4 className="text-sm font-bold text-noctvm-rose mb-3 flex items-center gap-2">
                ⚠️ RESOLUTION REQUIRED ({summary.skipped_venues.length})
              </h4>
              <div className="bg-black/20 rounded-xl p-4 max-h-40 overflow-y-auto space-y-2">
                {summary.skipped_venues.map((v, i) => (
                  <div key={i} className="text-xs text-noctvm-silver flex items-center gap-2 font-mono">
                    <span className="text-noctvm-rose">•</span> {v}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scraper Logs / Manual Triggers */}
      <section className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center border-dashed">
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-4xl">🤖</div>
          <h3 className="text-lg font-bold">Manual Source Triggers</h3>
          <p className="text-noctvm-silver text-sm">
            Coming soon: Ability to run individual scrapers or schedule recurring cron jobs directly from the UI.
          </p>
        </div>
      </section>
    </div>
  );
}
