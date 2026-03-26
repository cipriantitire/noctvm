'use client';
import React from 'react';
import { useToast } from '@/components/ui';
import { Button } from '@/components/ui';

const variants = [
  { label: 'Default', variant: 'default' as const, msg: 'Link copied to clipboard' },
  { label: 'Success', variant: 'success' as const, msg: 'Event saved successfully' },
  { label: 'Error', variant: 'error' as const, msg: 'Failed to load events' },
  { label: 'Warning', variant: 'warning' as const, msg: 'You are offline' },
  { label: 'Info', variant: 'info' as const, msg: 'New events nearby' },
];

export default function ToastPage() {
  const { showToast } = useToast();

  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 font-heading uppercase tracking-wider">Toast</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">Global notification system. Call <code className="text-noctvm-violet font-mono text-sm">useToast()</code> from anywhere. Requires <code className="text-noctvm-violet font-mono text-sm">ToastProvider</code> in the layout.</p>
      </div>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">Variants</h2>
        <div className="flex flex-wrap gap-3 bg-noctvm-surface/30 p-8 rounded-2xl border border-white/5">
          {variants.map(({ label, variant, msg }) => (
            <Button key={variant} variant="secondary" onClick={() => showToast(msg, variant)}>
              {label} Toast
            </Button>
          ))}
          <Button variant="ghost" onClick={() => showToast('Auto-dismisses in 3.5s by default')}>
            Long message toast
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">Usage</h2>
        <div className="bg-noctvm-surface/30 p-6 rounded-2xl border border-white/5 font-mono text-sm text-noctvm-silver space-y-1">
          <p><span className="text-noctvm-violet">const</span> {'{ showToast }'} = <span className="text-noctvm-violet">useToast</span>();</p>
          <p>showToast(<span className="text-noctvm-gold">&apos;Event saved&apos;</span>, <span className="text-noctvm-gold">&apos;success&apos;</span>);</p>
        </div>
      </section>
    </div>
  );
}
