'use client';
import React from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui';
import { Button } from '@/components/ui';

export default function CollapsiblePage() {
  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 font-heading uppercase tracking-wider">Collapsible</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">Spring-physics height animation via Framer Motion. Smooth expand/collapse.</p>
      </div>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">Event Details</h2>
        <div className="bg-noctvm-surface/30 p-6 rounded-2xl border border-white/5 space-y-3">
          <Collapsible>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">Lineup &amp; Artists</p>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">Toggle</Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="pt-3">
              <ul className="space-y-2 text-sm text-noctvm-silver">
                {['Boiler Room DJ Set — 23:00', 'Local Support — 21:00', 'Opening Act — 20:00'].map(a => (
                  <li key={a} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-noctvm-violet inline-block" />
                    {a}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <p className="text-sm font-medium text-white">Venue Rules</p>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">Toggle</Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="pt-3">
              <p className="text-sm text-noctvm-silver">18+ only. No re-entry after midnight. Dress code enforced. Photography allowed.</p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </section>
    </div>
  );
}
