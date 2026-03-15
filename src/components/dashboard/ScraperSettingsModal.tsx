'use client';

import React, { useState } from 'react';
import { XIcon, CogIcon } from '@/components/icons';

interface ScraperSettingsModalProps {
  source: { id: string, name: string };
  onClose: () => void;
}

export default function ScraperSettingsModal({ source, onClose }: ScraperSettingsModalProps) {
  const [settings, setSettings] = useState({
    scanDepth: 5,
    concurrency: 2,
    categories: ['techno', 'house', 'experimental'],
    autoUpdate: true
  });

  const handleSave = () => {
    // In a real app, this would save to a database or config file
    console.log(`Saving settings for ${source.id}:`, settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
       <div className="w-full max-w-md bg-noctvm-black border border-white/10 rounded-3xl p-6 shadow-2xl frosted-noise relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-noctvm-violet/5 to-transparent pointer-events-none"></div>

        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-noctvm-violet/10 text-noctvm-violet">
                <CogIcon className="w-4 h-4" />
             </div>
             <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">{source.name} Settings</h3>
                <p className="text-[9px] font-mono text-noctvm-silver/40 uppercase tracking-widest mt-0.5">Scraper Configuration</p>
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

        <div className="space-y-5 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Scan Depth (Pages)</label>
            <input 
              type="number"
              value={settings.scanDepth}
              onChange={(e) => setSettings({...settings, scanDepth: parseInt(e.target.value)})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 font-mono text-sm text-white focus:border-noctvm-violet/50 outline-none transition-all"
              title="Scan Depth"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Concurrency Limit</label>
            <div className="flex gap-2">
              {[1, 2, 4, 8].map(n => (
                <button
                  key={n}
                  onClick={() => setSettings({...settings, concurrency: n})}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${
                    settings.concurrency === n 
                      ? 'bg-noctvm-violet border-noctvm-violet text-white shadow-lg shadow-noctvm-violet/20' 
                      : 'bg-white/5 border-white/10 text-noctvm-silver hover:border-white/20'
                  }`}
                >
                  {n}x
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-noctvm-silver/60 font-mono uppercase tracking-widest ml-1">Active Categories</label>
            <div className="flex flex-wrap gap-1.5">
              {['techno', 'house', 'electronic', 'experimental', 'live'].map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    const active = settings.categories.includes(cat);
                    setSettings({
                      ...settings,
                      categories: active ? settings.categories.filter(c => c !== cat) : [...settings.categories, cat]
                    });
                  }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    settings.categories.includes(cat)
                      ? 'bg-noctvm-violet/20 border-noctvm-violet text-noctvm-violet'
                      : 'bg-white/5 border-white/10 text-noctvm-silver/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white uppercase tracking-tight">Auto-Update</span>
                <span className="text-[8px] text-noctvm-silver/40 font-mono uppercase">Sync on system events</span>
             </div>
             <button 
              onClick={() => setSettings({...settings, autoUpdate: !settings.autoUpdate})}
              className={`w-10 h-5 rounded-full transition-all relative ${settings.autoUpdate ? 'bg-noctvm-violet' : 'bg-white/10'}`}
              title={settings.autoUpdate ? "Disable Auto-Update" : "Enable Auto-Update"}
             >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.autoUpdate ? 'right-1' : 'left-1'}`}></div>
             </button>
          </div>
        </div>

        <div className="mt-8 flex gap-3 relative z-10">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-noctvm-silver hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex-[2] px-4 py-2.5 rounded-xl bg-noctvm-violet text-white text-[10px] font-bold uppercase tracking-widest hover:bg-noctvm-violet/80 transition-all shadow-lg shadow-noctvm-violet/20 flex items-center justify-center gap-2"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}
