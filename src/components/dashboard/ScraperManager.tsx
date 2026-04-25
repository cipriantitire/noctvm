'use client';

import React, { useState, useEffect } from 'react';
import { PlayIcon, HubIcon, RefreshIcon, CheckIcon, XIcon, EyeIcon } from '@/components/icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logActivity } from '@/lib/activity';
import ScraperSettingsModal from './ScraperSettingsModal';
import VenueCleanupPanel from './VenueCleanupPanel';

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

interface ScraperLog {
  id: string;
  run_date: string;
  source: string;
  total_upserted: number;
  results: ScrapeResult[];
  skipped_venues: string[];
}

interface Summary {
  total?: number;
  upserted: number;
  total_upserted?: number; // compat for logs
  results: ScrapeResult[];
  skipped_venues: string[];
}

const SOURCES: ScraperSource[] = [
  { id: 'controlclub', name: 'Control Club', description: 'Direct venue calendar: authoritative dates & prices', status: 'idle' },
  { id: 'clubguesthouse', name: 'Club Guesthouse', description: 'Direct venue program: server-rendered HTML', status: 'idle' },
  { id: 'ra', name: 'Resident Advisor', description: 'Electronic music platform: rich metadata & tickets', status: 'idle' },
  { id: 'livetickets', name: 'LiveTickets', description: 'Local club life data', status: 'idle' },
  { id: 'iabilet', name: 'Iabilet', description: 'Ticketed events tracking', status: 'idle' },
  { id: 'eventbook', name: 'Eventbook', description: 'Cultural and art events', status: 'idle' },
  { id: 'onevent', name: 'OnEvent', description: 'Regional gathering data', status: 'idle' },
  { id: 'ambilet', name: 'Ambilet', description: 'Music and theater ticketing', status: 'idle' },
  { id: 'zilesinopti', name: 'Zile și Nopți', description: 'Music category: /muzica/ only', status: 'idle' },
];

export default function ScraperManager() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [runningSource, setRunningSource] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<ScraperSource | null>(null);
  const [settingSource, setSettingSource] = useState<ScraperSource | null>(null);
  const [logs, setLogs] = useState<ScraperLog[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('scraper_logs')
      .select('*')
      .order('run_date', { ascending: false })
      .limit(10);
    
    if (data) {
      setLogs(data);
      if (data.length > 0) {
        setLastRun(new Date(data[0].run_date).toLocaleString());
      }
    }
  };

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
        await logActivity({
          type: 'scrape_run',
          message: `Full system scrape completed. ${data.upserted} events updated.`,
          user_name: 'Admin'
        });
        fetchLogs();
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
        await logActivity({
          type: 'scrape_run',
          message: `Manual scrape run: ${sourceId} (${data.upserted} updates)`,
          entity_name: sourceId,
          user_name: 'Admin'
        });
        fetchLogs();
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status card: larger, with visual indicator */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 frosted-noise shadow-md relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 ${loading || runningSource ? 'bg-noctvm-gold' : 'bg-noctvm-emerald'}`} />
          <p className="text-noctvm-micro text-noctvm-silver/40 uppercase font-mono tracking-widest mb-2">Status</p>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${loading || runningSource ? 'bg-noctvm-gold animate-pulse' : 'bg-noctvm-emerald'} shadow-[0_0_8px_currentColor]`} />
            <span className="text-xl font-bold text-foreground uppercase tracking-tight">{loading || runningSource ? 'Active' : 'Ready'}</span>
          </div>
          {loading && <p className="text-noctvm-caption text-noctvm-silver/50 mt-2 font-mono">Processing scrapers...</p>}
        </div>

        {/* Last Run: compact data point */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 frosted-noise shadow-md">
          <p className="text-noctvm-micro text-noctvm-silver/40 uppercase font-mono tracking-widest mb-2">Last Run</p>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-noctvm-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-lg font-bold text-foreground tracking-tight">{lastRun || 'No data'}</span>
          </div>
        </div>

        {/* Sources: badge-style count */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 frosted-noise shadow-md flex items-center justify-between">
          <div>
            <p className="text-noctvm-micro text-noctvm-silver/40 uppercase font-mono tracking-widest mb-2">Sources</p>
            <span className="text-3xl font-bold text-foreground font-heading tracking-tighter">{SOURCES.length}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-noctvm-emerald/10 border border-noctvm-emerald/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-noctvm-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
        </div>
      </div>

      <div className="px-2">
        <button
          onClick={runAllScrapers}
          disabled={loading || !!runningSource}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-noctvm-violet text-foreground rounded-2xl text-noctvm-caption md:text-xs font-bold uppercase tracking-widest hover:bg-noctvm-violet/80 transition-all shadow-xl shadow-noctvm-violet/10 active:scale-[0.96] disabled:opacity-50 w-full"
        >
          <PlayIcon className="w-4 h-4" />
          {loading ? 'Processing...' : 'Full System Scrape'}
        </button>
      </div>

      <VenueCleanupPanel accessToken={session?.access_token} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden frosted-noise shadow-xl">
          <div className="px-6 py-4 border-b border-white/5 bg-white/5">
                <h3 className="text-noctvm-caption font-bold uppercase tracking-widest text-noctvm-silver font-mono">Individual Sources</h3>
          </div>
          <div className="divide-y divide-white/5">
            {SOURCES.map(source => (
              <div key={source.id} className="px-6 py-4 flex items-center justify-between group hover:bg-white/[0.02] transition-all cursor-pointer" onClick={() => setSelectedSource(source)}>
                <div className="flex items-center gap-3">
                  {/* Priority badge for top-tier sources */}
                  {(source.id === 'controlclub' || source.id === 'ra') && (
                    <span className="text-noctvm-xs font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-noctvm-gold/10 text-noctvm-gold border border-noctvm-gold/20">
                      {source.id === 'controlclub' ? 'Venue' : 'Platform'}
                    </span>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-0.5">{source.name}</h4>
                    <p className="text-noctvm-caption text-noctvm-silver/60 lowercase font-mono">{source.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedSource(source); }}
                    className="p-2 hover:bg-white/10 rounded-xl text-noctvm-silver/60 hover:text-foreground transition-all bg-white/5 border border-white/10"
                    title="View Source"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSettingSource(source); }}
                    className="p-2 hover:bg-white/10 rounded-xl text-noctvm-silver/60 hover:text-foreground transition-all bg-white/5 border border-white/10"
                    title="Settings"
                  >
                    <HubIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); runSingleScraper(source.id); }}
                    disabled={loading || !!runningSource}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-noctvm-caption font-bold uppercase tracking-widest text-noctvm-silver hover:bg-noctvm-violet hover:text-foreground hover:border-noctvm-violet transition-all active:scale-[0.96] disabled:opacity-30"
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
                <h3 className="text-noctvm-caption font-bold uppercase tracking-widest text-noctvm-silver font-mono">Scrape Analysis</h3>
                <span className="text-noctvm-caption font-bold px-2 py-0.5 bg-noctvm-emerald/10 text-noctvm-emerald border border-noctvm-emerald/20 rounded-md uppercase tracking-tighter">
                  {summary.upserted} Upserted
                </span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {summary.results.map((r, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-noctvm-xs text-noctvm-silver/40 uppercase font-mono mb-1">{r.source}</span>
                      <span className={`text-2xl font-black ${r.error ? 'text-noctvm-rose' : 'text-foreground'}`}>
                        {r.error ? 'Error' : r.count}
                      </span>
                    </div>
                  ))}
                </div>
                
                {summary.skipped_venues.length > 0 && (
                   <div className="mt-6 p-4 bg-noctvm-rose/5 border border-noctvm-rose/10 rounded-xl">
                      <h4 className="text-noctvm-caption font-bold text-noctvm-rose uppercase mb-3 px-1">Skipped Venues ({summary.skipped_venues.length})</h4>
                      <div className="max-h-32 overflow-y-auto no-scrollbar space-y-1">
                        {summary.skipped_venues.map((v, i) => (
                          <div key={i} className="text-noctvm-micro text-noctvm-silver/60 bg-white/5 px-2 py-1 rounded truncate uppercase font-mono">
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
              <p className="text-noctvm-silver/30 text-noctvm-caption font-mono uppercase tracking-[0.2em] max-w-[200px]">
                Analysis data will appear here after execution
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden frosted-noise shadow-xl">
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <h3 className="text-noctvm-caption font-bold uppercase tracking-widest text-noctvm-silver font-mono">Run History Log</h3>
          <button onClick={fetchLogs} className="p-2 hover:bg-white/10 rounded-lg text-noctvm-silver/40 hover:text-foreground transition-all" title="Refresh Logs">
            <RefreshIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-3 text-noctvm-micro text-noctvm-silver/40 uppercase font-mono">Date</th>
                <th className="px-6 py-3 text-noctvm-micro text-noctvm-silver/40 uppercase font-mono">Source</th>
                <th className="px-6 py-3 text-noctvm-micro text-noctvm-silver/40 uppercase font-mono text-center">Upserted</th>
                <th className="px-6 py-3 text-noctvm-micro text-noctvm-silver/40 uppercase font-mono text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="group hover:bg-white/[0.01] transition-all">
                    <td className="px-6 py-4">
                      <p className="text-xs text-foreground font-medium">{new Date(log.run_date).toLocaleDateString()}</p>
                      <p className="text-noctvm-caption text-noctvm-silver/40 font-mono italic">{new Date(log.run_date).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md text-noctvm-micro font-bold uppercase tracking-tighter ${
                        log.source === 'all' ? 'bg-noctvm-violet/10 text-noctvm-violet border border-noctvm-violet/20' : 'bg-white/5 text-noctvm-silver border border-white/10'
                      }`}>
                        {log.source === 'all' ? 'Full System' : log.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-noctvm-emerald">{log.total_upserted}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSummary({ 
                          upserted: log.total_upserted, 
                          results: log.results, 
                          skipped_venues: log.skipped_venues || [] 
                        })}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-noctvm-silver/40 hover:text-foreground transition-all inline-flex items-center gap-1.5 text-noctvm-caption uppercase font-bold"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        Analysis
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-noctvm-silver/20 text-noctvm-caption font-mono uppercase tracking-widest italic">
                    No run logs found in secure storage
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSource && (
          <div className="fixed inset-0 z-sheet flex items-center justify-center p-4 bg-noctvm-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto no-scrollbar">
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
                  {selectedSource.id === 'controlclub' ? '🎛️'
                    : selectedSource.id === 'clubguesthouse' ? '🏠'
                    : selectedSource.id === 'ra' ? '🎧'
                    : selectedSource.id === 'zilesinopti' ? '🌙'
                    : selectedSource.id === 'livetickets' ? '🎟️'
                    : '🎫'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">{selectedSource.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald"></span>
                    <span className="text-noctvm-caption text-noctvm-emerald uppercase font-mono font-bold">Signal Ready</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-noctvm-caption text-noctvm-silver/40 uppercase font-mono tracking-widest">Source Description</label>
                  <p className="text-sm text-noctvm-silver leading-relaxed">{selectedSource.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-noctvm-micro text-noctvm-silver/30 uppercase font-mono mb-1">Success Rate</p>
                    <p className="text-lg font-bold text-foreground font-mono">98.2%</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-noctvm-micro text-noctvm-silver/30 uppercase font-mono mb-1">Latency</p>
                    <p className="text-lg font-bold text-noctvm-emerald font-mono">140ms</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                   <button 
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-noctvm-caption font-bold uppercase tracking-widest text-foreground hover:bg-white/10 transition-all"
                  >
                    View Logs
                  </button>
                  <button 
                    onClick={() => runSingleScraper(selectedSource.id)}
                    disabled={loading}
                    className="flex-[2] px-4 py-3 bg-noctvm-violet text-foreground rounded-xl text-noctvm-caption font-bold uppercase tracking-widest hover:bg-noctvm-violet/80 transition-all shadow-lg active:scale-[0.96] disabled:opacity-50"
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
