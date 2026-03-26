'use client';

import React from 'react';
import { Badge } from '@/components/ui';

export default function BadgesShowcasePage() {
  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 heading-syne uppercase tracking-wider">Badges & Tags</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">
          Use badges for genre labeling, metadata tags, counts, and statuses.
        </p>
      </div>

      <section className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-noctvm-surface/50 border border-white/5 rounded-2xl space-y-6">
            <div className="space-y-3">
              <span className="text-sm font-medium text-white/90">Genre Badges</span>
              <div className="flex flex-wrap gap-2">
                <Badge variant="genre">Techno</Badge>
                <Badge variant="genre">House</Badge>
                <Badge variant="genre">Minimal</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <span className="text-sm font-medium text-white/90">Featured / Price Badges</span>
              <div className="flex flex-wrap gap-2">
                <Badge variant="featured">Featured</Badge>
                <Badge variant="custom" className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-tight bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Free Entry</Badge>
                <Badge variant="outline">Sold Out</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
