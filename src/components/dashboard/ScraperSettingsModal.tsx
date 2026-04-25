'use client';

import React, { useState, useEffect } from 'react';
import { XIcon, CogIcon, CheckIcon } from '@/components/icons';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';

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
    cityFilter: ['Bucharest', 'Constanta'],
    includeKeywords: [] as string[],
    excludeKeywords: ['festival', 'workshop', 'theater'] as string[],
    venueMappingWords: ['club', 'garden', 'space', 'hall', 'terrace', 'arena'] as string[],
    priceKeywords: ['ron', 'lei', 'free', 'gratis', 'bilete', 'tickets'] as string[],
    locationKeywords: ['strada', 'nr.', 'sector', 'bucuresti', 'constanta'] as string[]
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
      await logActivity({
        type: 'event_edit', // generic config change
        message: `Updated scraper settings for ${source.name}`,
        entity_name: source.name,
        user_name: 'Admin'
      });
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
      <div className="fixed inset-0 z-dropdown flex items-center justify-center p-4 bg-noctvm-black/80 backdrop-blur-md">
        <div className="w-12 h-12 border-4 border-noctvm-violet/20 border-t-noctvm-violet rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-dropdown flex items-center justify-center p-4 bg-noctvm-black/80 backdrop-blur-md animate-fade-in overflow-y-auto no-scrollbar">
       <div className="w-full max-w-md my-auto bg-noctvm-black border border-white/10 rounded-3xl p-6 shadow-2xl frosted-noise relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-noctvm-violet/5 to-transparent pointer-events-none"></div>

        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-noctvm-violet/10 text-noctvm-violet shadow-inner shadow-noctvm-violet/20">
                <CogIcon className="w-4 h-4" />
             </div>
             <div>
                <h3 className="text-base font-bold text-foreground uppercase tracking-tight">{source.name} Settings</h3>
                <p className="text-noctvm-micro font-mono text-noctvm-silver/40 uppercase tracking-widest mt-0.5">Hardware Abstraction Layer</p>
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
              <label className="text-noctvm-caption text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Scan Depth</label>
              <input 
                type="number"
                value={settings.scanDepth}
                onChange={(e) => setSettings({...settings, scanDepth: parseInt(e.target.value) || 1})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm text-foreground focus:border-noctvm-violet/50 outline-none transition-all shadow-inner"
                title="Scan Depth"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-noctvm-caption text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Priority (1-10)</label>
              <input 
                type="number"
                min="1"
                max="10"
                value={settings.priority}
                onChange={(e) => setSettings({...settings, priority: parseInt(e.target.value) || 5})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm text-foreground focus:border-noctvm-violet/50 outline-none transition-all shadow-inner"
                title="Scraper Priority"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-noctvm-caption text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Concurrency Limit</label>
            <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-2xl">
              {[1, 2, 4, 8].map(n => (
                <button
                  key={n}
                  onClick={() => setSettings({...settings, concurrency: n})}
                  className={`flex-1 py-1.5 rounded-xl text-noctvm-caption font-bold transition-all ${
                    settings.concurrency === n 
                      ? 'bg-noctvm-violet text-foreground shadow-lg shadow-noctvm-violet/20' 
                      : 'text-noctvm-silver/40 hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {n}x
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-noctvm-caption text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Active Cities</label>
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
                  className={`px-3 py-1.5 rounded-xl text-noctvm-caption font-bold border transition-all ${
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

          <div className="space-y-4 pt-4 border-t border-white/5 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
            <div className="space-y-1.5">
              <label className="text-noctvm-caption text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Include Keywords</label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-noctvm-caption text-foreground focus:border-noctvm-violet/50 outline-none transition-all resize-none h-16"
                placeholder="e.g. techno, house..."
                value={settings.includeKeywords?.join(', ') || ''}
                onChange={(e) => setSettings({...settings, includeKeywords: e.target.value.split(',').map(s => s.trim()).filter(s => !!s)})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-noctvm-caption text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Exclude Keywords</label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-noctvm-caption text-noctvm-silver focus:border-noctvm-rose/50 outline-none transition-all resize-none h-16"
                placeholder="e.g. festival, workshop..."
                value={settings.excludeKeywords?.join(', ') || ''}
                onChange={(e) => setSettings({...settings, excludeKeywords: e.target.value.split(',').map(s => s.trim()).filter(s => !!s)})}
              />
            </div>

            <div className="space-y-1.5 border-t border-white/5 pt-4">
              <label className="text-noctvm-caption text-noctvm-violet font-mono uppercase tracking-widest ml-1 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-noctvm-violet"></span>
                Venue Mapping Words
              </label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-noctvm-caption text-foreground focus:border-noctvm-violet/50 outline-none transition-all resize-none h-16"
                placeholder="e.g. club, garden, space..."
                value={(settings as any).venueMappingWords?.join(', ') || ''}
                onChange={(e) => setSettings({...settings, venueMappingWords: e.target.value.split(',').map(s => s.trim()).filter(s => !!s)} as any)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-noctvm-caption text-noctvm-emerald font-mono uppercase tracking-widest ml-1 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-noctvm-emerald"></span>
                Price Detection Keywords
              </label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-noctvm-caption text-foreground focus:border-noctvm-emerald/50 outline-none transition-all resize-none h-16"
                placeholder="e.g. ron, free, gratis..."
                value={(settings as any).priceKeywords?.join(', ') || ''}
                onChange={(e) => setSettings({...settings, priceKeywords: e.target.value.split(',').map(s => s.trim()).filter(s => !!s)} as any)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-noctvm-caption text-noctvm-gold font-mono uppercase tracking-widest ml-1 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-noctvm-gold"></span>
                Location Detection Words
              </label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-noctvm-caption text-foreground focus:border-noctvm-gold/50 outline-none transition-all resize-none h-16"
                placeholder="e.g. strada, nr, sector..."
                value={(settings as any).locationKeywords?.join(', ') || ''}
                onChange={(e) => setSettings({...settings, locationKeywords: e.target.value.split(',').map(s => s.trim()).filter(s => !!s)} as any)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
             <div className="flex flex-col">
                <span className="text-noctvm-label font-black text-foreground uppercase tracking-tight">Autonomous Sync</span>
                <span className="text-noctvm-xs text-noctvm-silver/40 font-mono uppercase tracking-tighter">Automatic background execution</span>
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
            className="flex-1 px-4 py-3 rounded-2xl border border-white/10 text-noctvm-caption font-bold uppercase tracking-widest text-noctvm-silver hover:bg-white/5 transition-all active:scale-[0.96]"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] px-4 py-3 rounded-2xl bg-noctvm-violet text-foreground text-noctvm-caption font-bold uppercase tracking-widest hover:bg-noctvm-violet/80 transition-all shadow-xl shadow-noctvm-violet/20 flex items-center justify-center gap-2 active:scale-[0.96] disabled:opacity-50"
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
