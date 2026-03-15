'use client';

import React, { useState, useEffect } from 'react';
import { XIcon, CogIcon, CheckIcon } from '@/components/icons';
import { supabase } from '@/lib/supabase';

interface ScraperSettingsModalProps {
  source: { id: string, name: string };
  onClose: () => void;
}

export default function ScraperSettingsModal({ source, onClose }: ScraperSettingsModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    scanDepth: 5,
    concurrency: 2,
    categories: ['techno', 'house', 'experimental'],
    autoUpdate: true,
    priority: 5,
    cityFilter: ['Bucharest', 'Constanta']
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('scraper_settings')
          .select('settings')
          .eq('id', source.id)
          .single();

        if (data && data.settings) {
          setSettings(prev => ({
            ...prev,
            ...data.settings
          }));
        }
      } catch (err) {
        console.error('Failed to fetch scraper settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [source.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('scraper_settings')
        .upsert({
          id: source.id,
          settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      onClose();
    } catch (err) {
      alert('Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="w-12 h-12 border-4 border-noctvm-violet/20 border-t-noctvm-violet rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto no-scrollbar">
       <div className="w-full max-w-md my-auto bg-noctvm-black border border-white/10 rounded-3xl p-6 shadow-2xl frosted-noise relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-noctvm-violet/5 to-transparent pointer-events-none"></div>

        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-noctvm-violet/10 text-noctvm-violet shadow-inner shadow-noctvm-violet/20">
                <CogIcon className="w-4 h-4" />
             </div>
             <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">{source.name} Settings</h3>
                <p className="text-[9px] font-mono text-noctvm-silver/40 uppercase tracking-widest mt-0.5">Hardware Abstraction Layer</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/5 rounded-lg text-noctvm-silver transition-colors"
            title="Close Settings"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
              <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Scan Depth</label>
              <input 
                type="number"
                value={settings.scanDepth}
                onChange={(e) => setSettings({...settings, scanDepth: parseInt(e.target.value) || 1})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm text-white focus:border-noctvm-violet/50 outline-none transition-all shadow-inner"
                title="Scan Depth"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Priority (1-10)</label>
              <input 
                type="number"
                min="1"
                max="10"
                value={settings.priority}
                onChange={(e) => setSettings({...settings, priority: parseInt(e.target.value) || 5})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm text-white focus:border-noctvm-violet/50 outline-none transition-all shadow-inner"
                title="Scraper Priority"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Concurrency Limit</label>
            <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl">
              {[1, 2, 4, 8].map(n => (
                <button
                  key={n}
                  onClick={() => setSettings({...settings, concurrency: n})}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                    settings.concurrency === n 
                      ? 'bg-noctvm-violet text-white shadow-lg shadow-noctvm-violet/20' 
                      : 'text-noctvm-silver/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {n}x
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Active Cities</label>
            <div className="flex flex-wrap gap-2">
              {['Bucharest', 'Constanta', 'Cluj', 'Iasi', 'Timisoara'].map(city => (
                <button
                  key={city}
                  onClick={() => {
                    const active = settings.cityFilter?.includes(city);
                    setSettings({
                      ...settings,
                      cityFilter: active 
                        ? (settings.cityFilter || []).filter(c => c !== city) 
                        : [...(settings.cityFilter || []), city]
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                    settings.cityFilter?.includes(city)
                      ? 'bg-noctvm-emerald/10 border-noctvm-emerald/30 text-noctvm-emerald shadow-[0_0_15px_-5px_var(--noctvm-emerald)]'
                      : 'bg-white/5 border-white/10 text-noctvm-silver/30 hover:border-white/20'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
             <div className="flex flex-col">
                <span className="text-[11px] font-black text-white uppercase tracking-tight">Autonomous Sync</span>
                <span className="text-[8px] text-noctvm-silver/40 font-mono uppercase tracking-tighter">Automatic background execution</span>
             </div>
             <button 
              onClick={() => setSettings({...settings, autoUpdate: !settings.autoUpdate})}
              className={`w-11 h-6 rounded-full transition-all relative p-1 ${settings.autoUpdate ? 'bg-noctvm-violet shadow-[0_0_15px_-5px_var(--noctvm-violet)]' : 'bg-white/10'}`}
              title={settings.autoUpdate ? "Disable Auto-Update" : "Enable Auto-Update"}
             >
                <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-md ${settings.autoUpdate ? 'translate-x-5' : 'translate-x-0'}`}></div>
             </button>
          </div>
        </div>

        <div className="mt-8 flex gap-3 relative z-10">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-noctvm-silver hover:bg-white/5 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] px-4 py-3 rounded-2xl bg-noctvm-violet text-white text-[10px] font-bold uppercase tracking-widest hover:bg-noctvm-violet/80 transition-all shadow-xl shadow-noctvm-violet/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
               <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckIcon className="w-3.5 h-3.5" />
                Commit Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
