'use client';
import React, { useState } from 'react';
import { EmptyState } from '@/components/ui';
import { Button } from '@/components/ui';

const scenarios = [
  {
    id: 'feed',
    label: 'Empty Feed',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
    title: 'Nothing here yet',
    description: 'Follow people to see their posts and stories in your feed.',
    action: <Button variant="primary" size="sm">Explore People</Button>,
  },
  {
    id: 'search',
    label: 'No Results',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" /></svg>,
    title: 'No results found',
    description: 'Try different keywords or browse events by city.',
    action: undefined,
  },
  {
    id: 'notifications',
    label: 'No Notifications',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>,
    title: "You're all caught up",
    description: 'No new notifications. Check back after the weekend.',
    action: undefined,
  },
];

export default function EmptyStatePage() {
  const [active, setActive] = useState('feed');
  const scenario = scenarios.find(s => s.id === active)!;

  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 font-heading uppercase tracking-wider">Empty State</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">Contextual zero-state with icon, title, description, and optional CTA.</p>
      </div>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">Scenarios</h2>
        <div className="flex gap-2 flex-wrap">
          {scenarios.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active === s.id ? 'bg-noctvm-violet/20 text-white border border-noctvm-violet/30' : 'text-noctvm-silver border border-white/10 hover:border-white/20'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="bg-noctvm-surface/30 rounded-2xl border border-white/5">
          <EmptyState icon={scenario.icon} title={scenario.title} description={scenario.description} action={scenario.action} />
        </div>
      </section>
    </div>
  );
}
