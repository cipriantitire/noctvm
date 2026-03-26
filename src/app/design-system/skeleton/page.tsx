'use client';
import React, { useState } from 'react';
import { Skeleton } from '@/components/ui';
import { Button } from '@/components/ui';

function EventCardSkeleton() {
  return (
    <div className="space-y-3 p-4 bg-noctvm-surface rounded-xl border border-white/5">
      <Skeleton variant="rectangular" className="w-full h-40 rounded-lg" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="text" className="w-24" />
      </div>
    </div>
  );
}

export default function SkeletonPage() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 font-heading uppercase tracking-wider">Skeleton</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">Loading placeholders with shimmer animation.</p>
      </div>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">Variants</h2>
        <div className="flex flex-wrap gap-6 items-center bg-noctvm-surface/30 p-8 rounded-2xl border border-white/5">
          <Skeleton variant="rectangular" width={120} height={80} />
          <Skeleton variant="circular" width={56} height={56} />
          <div className="space-y-2 flex-1 min-w-[200px]">
            <Skeleton variant="text" className="w-full" />
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">Event Card Skeleton</h2>
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setLoading(l => !l)}>
            Toggle: {loading ? 'Loading' : 'Loaded'}
          </Button>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {loading ? (
              [1, 2, 3].map(i => <EventCardSkeleton key={i} />)
            ) : (
              [1, 2, 3].map(i => (
                <div key={i} className="p-4 bg-noctvm-surface rounded-xl border border-white/5">
                  <div className="w-full h-40 bg-noctvm-violet/20 rounded-lg mb-3 flex items-center justify-center text-noctvm-violet text-sm font-mono">Event {i}</div>
                  <p className="text-white font-medium text-sm">Sample Event Name</p>
                  <p className="text-noctvm-silver text-xs mt-1">Control Club · Tonight</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
