'use client';
import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui';
import { Button } from '@/components/ui';

export default function PopoverPage() {
  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 font-heading uppercase tracking-wider">Popover</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">Floating content anchored to a trigger. Portal-rendered, Radix-powered.</p>
      </div>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">Basic</h2>
        <div className="flex flex-wrap gap-4 bg-noctvm-surface/30 p-8 rounded-2xl border border-white/5 items-start">
          <Popover>
            <PopoverTrigger asChild><Button variant="secondary">Open Popover</Button></PopoverTrigger>
            <PopoverContent>
              <p className="text-sm text-foreground font-medium mb-1">Quick Info</p>
              <p className="text-xs text-noctvm-silver">This popover is glass-styled, portal-rendered, and accessible.</p>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild><Button variant="ghost">Align Start</Button></PopoverTrigger>
            <PopoverContent align="start">
              <p className="text-sm text-noctvm-silver">Aligned to the start of the trigger.</p>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild><Button variant="ghost">Align End</Button></PopoverTrigger>
            <PopoverContent align="end">
              <p className="text-sm text-noctvm-silver">Aligned to the end of the trigger.</p>
            </PopoverContent>
          </Popover>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">With List Content</h2>
        <div className="flex bg-noctvm-surface/30 p-8 rounded-2xl border border-white/5">
          <Popover>
            <PopoverTrigger asChild><Button variant="primary">Event Actions</Button></PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-1">
                {['Save to list', 'Share event', 'Get directions', 'Report'].map(item => (
                  <button key={item} className="w-full text-left px-2 py-1.5 text-sm text-noctvm-silver rounded hover:bg-white/10 hover:text-foreground transition-colors">{item}</button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </section>
    </div>
  );
}
