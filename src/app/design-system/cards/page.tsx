'use client';

import React, { useState } from 'react';
import { GlassPanel } from '@/components/ui';

import CodePreview from '../CodePreview';

export default function CardsShowcasePage() {
  const [panel, setPanel] = useState<"default" | "modal" | "subtle" | "noise">("default");

  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 heading-syne uppercase tracking-wider">Cards & Containers</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">
          The frosted glass base system for all modal windows, dropdowns, and content blocks.
        </p>
      </div>

      <section className="space-y-6">
        <div className="bg-[url('/images/noise.png')] bg-repeat rounded-2xl p-8 border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-noctvm-midnight/40 to-noctvm-black/90 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              {(["default", "modal", "subtle", "noise"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPanel(v)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono tracking-wider border transition-colors ${
                    panel === v
                      ? "border-noctvm-violet bg-noctvm-violet/20 text-white shadow-glow"
                      : "border-white/10 text-noctvm-silver hover:border-white/30 bg-black/50"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <GlassPanel variant={panel} className="p-8 max-w-md min-h-[160px] flex items-center justify-center">
              <p className="text-sm text-center text-noctvm-silver/90">
                Interactive preview for <strong className="text-white capitalize">{panel}</strong> glass.<br/><br/>
                Radius maps to <span className="text-noctvm-violet font-mono text-xs">--radius-xl</span>.
              </p>
            </GlassPanel>

            <CodePreview code={`import { GlassPanel } from "@/components/ui";\n\n<GlassPanel variant="${panel}" className="p-8">\n  <p>Content goes here</p>\n</GlassPanel>`} />
          </div>
        </div>
      </section>
    </div>
  );
}
