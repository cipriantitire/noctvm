'use client';

import React, { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import { GlassPanel, Badge } from '@/components/ui';

export default function AvatarsShowcasePage() {
  const [size, setSize] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('xl');
  const [ring, setRing] = useState<'none' | 'story-unseen' | 'story-seen' | 'highlight' | 'live'>('none');
  const [useImage, setUseImage] = useState(true);

  const sizes: ('sm' | 'md' | 'lg' | 'xl' | '2xl')[] = ['sm', 'md', 'lg', 'xl', '2xl'];
  const rings: ('none' | 'story-unseen' | 'story-seen' | 'highlight' | 'live')[] = ['none', 'story-unseen', 'story-seen', 'highlight', 'live'];
  
  const mockImage = 'https://i.pravatar.cc/150?u=a042581f4e29026704d';

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-foreground mb-2 font-heading tracking-wider uppercase">Avatars</h1>
        <p className="text-noctvm-silver/70">
          The core atomic component for representing users, venues, or brands. Supports story rings, live states, and text fallbacks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Playground Controls */}
        <div className="lg:col-span-4 space-y-6">
          <GlassPanel variant="subtle" className="p-6 space-y-8">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Properties</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-noctvm-silver block mb-2 font-mono">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(s => (
                      <button 
                        key={s} 
                        onClick={() => setSize(s)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${size === s ? 'bg-noctvm-violet/20 border-noctvm-violet/50 border text-foreground' : 'bg-white/5 text-noctvm-silver border border-transparent hover:bg-white/10'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-noctvm-silver block mb-2 font-mono">Ring Style</label>
                  <div className="flex flex-col gap-2">
                    {rings.map(r => (
                      <label key={r} className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" checked={ring === r} onChange={() => setRing(r)} className="text-noctvm-violet focus:ring-noctvm-violet bg-white/5 border-white/20" />
                        <span className={`text-sm ${ring === r ? 'text-foreground font-medium' : 'text-noctvm-silver group-hover:text-foreground/80'}`}>{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-noctvm-silver block mb-2 font-mono">Content Type</label>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setUseImage(true)}
                      className={`flex-1 py-1.5 rounded text-xs transition-colors ${useImage ? 'bg-white/20 text-foreground' : 'bg-white/5 text-noctvm-silver hover:bg-white/10'}`}
                    >
                      Image
                    </button>
                    <button 
                      onClick={() => setUseImage(false)}
                      className={`flex-1 py-1.5 rounded text-xs transition-colors ${!useImage ? 'bg-white/20 text-foreground' : 'bg-white/5 text-noctvm-silver hover:bg-white/10'}`}
                    >
                      Fallback Text
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Live Preview area */}
        <div className="lg:col-span-8 space-y-6">
          <GlassPanel variant="modal" className="p-12 flex flex-col items-center justify-center min-h-[300px] border border-white/10 relative overflow-hidden">
            {/* BG pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
            
            <div className="relative z-10 flex flex-col items-center gap-6">
               <Avatar 
                  size={size} 
                  ring={ring} 
                  src={useImage ? mockImage : undefined} 
                  fallback="C"
               />
               <Badge variant="outline" className="font-mono mt-4">
                 &lt;Avatar size=&quot;{size}&quot; ring=&quot;{ring}&quot; /&gt;
               </Badge>
            </div>
          </GlassPanel>

          {/* Quick Grids */}
          <GlassPanel variant="subtle" className="p-6">
            <h3 className="text-sm font-bold text-foreground mb-6">Size Scale</h3>
            <div className="flex items-end gap-6 flex-wrap">
              {sizes.map(s => (
                <div key={s} className="flex flex-col items-center gap-3">
                  <Avatar size={s} src={mockImage} />
                  <span className="text-noctvm-caption text-noctvm-silver font-mono">{s}</span>
                </div>
              ))}
            </div>
          </GlassPanel>

        </div>
      </div>
    </div>
  );
}
