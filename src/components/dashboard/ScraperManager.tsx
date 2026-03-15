'use client';

import React, { useState, useEffect } from 'react';
import { PlayIcon, RefreshIcon, ChevronDownIcon, ChevronUpIcon, XIcon, CogIcon } from '@/components/icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ScraperSettingsModal from './ScraperSettingsModal';

interface ScraperSource {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'error' | 'success';
}

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

const SOURCES: ScraperSource[] = [
  { id: 'iabilet', name: 'Iabilet', description: 'Ticketed events tracking', status: 'idle' },
  { id: 'livetickets', name: 'LiveTickets', description: 'Local club life data', status: 'idle' },
  { id: 'eventbook', name: 'Eventbook', description: 'Cultural and art events', status: 'idle' },
  { id: 'ra', name: 'Resident Advisor', description: 'Electronic music focus', status: 'idle' },
  { id: 'onevent', name: 'OnEvent', description: 'Regional gathering data', status: 'idle' },
  { id: 'ambilet', name: 'Ambilet', description: 'Music and theater ticketing', status: 'idle' },
];

export default function ScraperManager() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [runningSource, setRunningSource] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<ScraperSource | null>(null);
  const [settingSource, setSettingSource] = useState<ScraperSource | null>(null);

  const runAllScrapers = async () => {
    if (!window.confirm('Start full system scrape? This will scan all sources and update the database.')) return;
    
    setLoading(true);
    setSummary(null);

    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
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

  const runSingleScraper = async (sourceId: string) => {
    if (!window.confirm(`Start ${sourceId} scrape?`)) return;
    
    setRunningSource(sourceId);
    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source: sourceId })
      });
      const data = await res.json();
      if (res.ok) {
        setSummary(data);
        setLastRun(new Date().toLocaleString());
      } else {
        alert(data.error || `Failed to run ${sourceId} scraper`);
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setRunningSource(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Scraper Management</h2>
          <p className="text-noctvm-silver text-[10px] font-mono uppercase tracking-widest mt-1 opacity-60">Automated event discovery & data sync</p>
        </div>
        <button
          onClick={runAllScrapers}
          disabled={loading || !!runningSource}
          className="flex items-center gap-2 px-5 py-2.5 bg-noctvm-violet text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-noctvm-violet/80 transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          <PlayIcon className="w-3.5 h-3.5" />
          {loading ? 'Processing...' : 'Start Full System Scrape'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Status', value: loading || runningSource ? 'Active' : 'Ready', color: loading || runningSource ? 'noctvm-gold' : 'noctvm-emerald' },
          { label: 'Last Run', value: lastRun || 'No data', color: 'noctvm-violet' },
          { label: 'Sources', value: `${SOURCES.length} Sources`, color: 'noctvm-emerald' }
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 frosted-noise shadow-md">
            <p className="text-[9px] text-noctvm-silver/40 uppercase font-mono tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full bg-${stat.color} ${loading || runningSource ? 'animate-pulse' : ''}`}></div>
              <span className="text-lg font-bold text-white uppercase tracking-tight">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden frosted-noise shadow-xl">
          <div className="px-6 py-4 border-b border-white/5 bg-white/5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-noctvm-silver font-mono">Individual Sources</h3>
          </div>
          <div className="divide-y divide-white/5">
            {SOURCES.map(source => (
              <div key={source.id} className="px-6 py-4 flex items-center justify-between group hover:bg-white/[0.02] transition-all cursor-pointer" onClick={() => setSelectedSource(source)}>
                <div>
                  <h4 className="text-sm font-bold text-white mb-0.5">{source.name}</h4>
                  <p className="text-[10px] text-noctvm-silver/40 lowercase font-mono">{source.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSettingSource(source); }}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-noctvm-silver/40 hover:text-noctvm-violet transition-all"
                    title="Settings"
                  >
                    <CogIcon className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); runSingleScraper(source.id); }}
                    disabled={loading || !!runningSource}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-noctvm-silver hover:bg-noctvm-violet hover:text-white hover:border-noctvm-violet transition-all active:scale-95 disabled:opacity-30"
                  >
                    {runningSource === source.id ? (
                      <div className="w-3 h-3 border-2 border-noctvm-violet/20 border-t-noctvm-violet rounded-full animate-spin"></div>
                    ) : 'Run'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {summary ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden frosted-noise shadow-xl h-full">
              <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-noctvm-silver font-mono">Scrape Analysis</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-noctvm-emerald/10 text-noctvm-emerald border border-noctvm-emerald/20 rounded-md uppercase tracking-tighter">
                  {summary.upserted} Upserted
                </span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {summary.results.map((r, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-[8px] text-noctvm-silver/40 uppercase font-mono mb-1">{r.source}</span>
                      <span className={`text-2xl font-black ${r.error ? 'text-noctvm-rose' : 'text-white'}`}>
                        {r.error ? 'Error' : r.count}
                      </span>
                    </div>
                  ))}
                </div>
                
                {summary.skipped_venues.length > 0 && (
                   <div className="mt-6 p-4 bg-noctvm-rose/5 border border-noctvm-rose/10 rounded-xl">
                      <h4 className="text-[10px] font-bold text-noctvm-rose uppercase mb-3 px-1">Skipped Venues ({summary.skipped_venues.length})</h4>
                      <div className="max-h-32 overflow-y-auto no-scrollbar space-y-1">
                        {summary.skipped_venues.map((v, i) => (
                          <div key={i} className="text-[9px] text-noctvm-silver/60 bg-white/5 px-2 py-1 rounded truncate uppercase font-mono">
                            {v}
                          </div>
                        ))}
                      </div>
                   </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 border-dashed rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center space-y-4">
              <div className="text-4xl opacity-20">📊</div>
              <p className="text-noctvm-silver/30 text-[10px] font-mono uppercase tracking-[0.2em] max-w-[200px]">
                Analysis data will appear here after execution
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedSource && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto no-scrollbar">
            <div className="w-full max-w-lg my-auto bg-noctvm-black/90 border border-white/10 rounded-3xl p-8 shadow-2xl frosted-noise relative">
              <button 
                onClick={() => setSelectedSource(null)}
                className="absolute right-6 top-6 p-2 hover:bg-white/5 rounded-lg transition-colors text-noctvm-silver"
                title="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-noctvm-violet/10 border border-noctvm-violet/20 flex items-center justify-center text-xl">
                  {selectedSource.id === 'ra' ? '🎧' : '🎫'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tight">{selectedSource.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald"></span>
                    <span className="text-[10px] text-noctvm-emerald uppercase font-mono font-bold">Signal Ready</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-noctvm-silver/40 uppercase font-mono tracking-widest">Source Description</label>
                  <p className="text-sm text-noctvm-silver leading-relaxed">{selectedSource.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[9px] text-noctvm-silver/30 uppercase font-mono mb-1">Success Rate</p>
                    <p className="text-lg font-bold text-white font-mono">98.2%</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[9px] text-noctvm-silver/30 uppercase font-mono mb-1">Latency</p>
                    <p className="text-lg font-bold text-noctvm-emerald font-mono">140ms</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                   <button 
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                  >
                    View Logs
                  </button>
                  <button 
                    onClick={() => runSingleScraper(selectedSource.id)}
                    disabled={loading}
                    className="flex-[2] px-4 py-3 bg-noctvm-violet text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-noctvm-violet/80 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    Run Scraper
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {settingSource && (
          <ScraperSettingsModal 
            source={settingSource} 
            onClose={() => setSettingSource(null)} 
          />
        )}
    </div>
  );
}
