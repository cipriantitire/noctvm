'use client';
import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui';
import { Button } from '@/components/ui';

export default function TooltipPage() {
  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 font-heading uppercase tracking-wider">Tooltip</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">Contextual hint on hover. Portal-rendered, zero delay by default.</p>
      </div>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">Placements</h2>
        <div className="flex flex-wrap gap-6 bg-noctvm-surface/30 p-12 rounded-2xl border border-white/5 items-center justify-center">
          {(['top', 'right', 'bottom', 'left'] as const).map(side => (
            <Tooltip key={side}>
              <TooltipTrigger asChild>
                <Button variant="secondary" className="capitalize">{side}</Button>
              </TooltipTrigger>
              <TooltipContent side={side}>Tooltip on {side}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">On Icon Buttons</h2>
        <div className="flex gap-4 bg-noctvm-surface/30 p-8 rounded-2xl border border-white/5">
          {['Bookmark', 'Share', 'Report'].map(label => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-noctvm-silver hover:text-white hover:bg-white/10 transition-colors text-xs font-mono">
                  {label[0]}
                </button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </section>
    </div>
  );
}
