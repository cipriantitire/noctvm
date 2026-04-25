'use client';

import React from 'react';
import { MessageTree } from '@/components/ui';

const mockData = [
  {
    id: '1',
    authorName: 'Alexandra M.',
    authorHandle: '@alexndr',
    authorAvatar: '',
    authorFallback: 'AM',
    content: 'Control Club tonight was absolutely unreal. The new Boiler Room setup is next level. Who else was there?',
    timestampStr: '2h',
    isOwner: false,
    replies: [
      {
        id: '1-1',
        authorName: 'Vlad D.',
        authorHandle: '@vladd',
        authorFallback: 'VD',
        content: 'I was at the bar during the transition. Missed the first 20 min but caught the peak. Incredible energy.',
        timestampStr: '1h',
        isOwner: false,
      },
      {
        id: '1-2',
        authorName: 'Maria S.',
        authorHandle: '@maria_s',
        authorFallback: 'MS',
        content: 'The sound system upgrade is noticeable. Bass felt cleaner, less muddy in the back.',
        timestampStr: '45m',
        isOwner: false,
        replies: [
          {
            id: '1-2-1',
            authorName: 'Alexandra M.',
            authorHandle: '@alexndr',
            authorFallback: 'AM',
            content: 'Right? They installed the new Funktion-One rig last week. Makes a huge difference.',
            timestampStr: '30m',
            isOwner: false,
          },
        ],
      },
    ],
  },
  {
    id: '2',
    authorName: 'You',
    authorHandle: '@you',
    authorFallback: 'YO',
    content: 'Next Saturday: Techno Showcase at Guesthouse. Lineup drops tomorrow.',
    timestampStr: '5h',
    isOwner: true,
    replies: [
      {
        id: '2-1',
        authorName: 'Ionut C.',
        authorHandle: '@ionut',
        authorFallback: 'IC',
        content: 'Any idea who is headlining?',
        timestampStr: '4h',
        isOwner: false,
      },
    ],
  },
];

const singleThread = [
  {
    id: '3',
    authorName: 'Diana R.',
    authorHandle: '@diana_r',
    authorFallback: 'DR',
    content: 'Has anyone been to the new venue in Expozitiei? Curious about the vibe before I commit to the event.',
    timestampStr: '1d',
    isOwner: false,
  },
];

export default function MessageTreePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">MessageTree</h1>
        <p className="text-noctvm-silver">
          Nested comment thread with collapsible branches, inline editing, reply inputs,
          and threaded connector lines.
        </p>
      </div>

      {/* Full Thread */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Nested Thread (3 levels)</h2>
        <div className="max-w-xl bg-noctvm-surface/30 border border-white/5 rounded-2xl p-6">
          <MessageTree
            data={mockData}
            onReply={(id, text) => console.log('Reply to', id, ':', text)}
            onEdit={(id, text) => console.log('Edit', id, ':', text)}
            onDelete={(id) => console.log('Delete', id)}
          />
        </div>
      </section>

      {/* Single Comment */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Single Comment (No Replies)</h2>
        <div className="max-w-xl bg-noctvm-surface/30 border border-white/5 rounded-2xl p-6">
          <MessageTree
            data={singleThread}
            onReply={(id, text) => console.log('Reply to', id, ':', text)}
          />
        </div>
      </section>

      {/* Empty State */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Empty State</h2>
        <div className="max-w-xl bg-noctvm-surface/30 border border-white/5 rounded-2xl p-6">
          <MessageTree
            data={[]}
            onReply={(id, text) => console.log('Reply to', id, ':', text)}
          />
        </div>
      </section>

      {/* Specs */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-noctvm-sm">
          {[
            { label: 'Collapsible threads', desc: 'Click username or stem to collapse/expand' },
            { label: 'Inline editing', desc: 'Edit button reveals input + Save/Cancel' },
            { label: 'Reply input', desc: 'Animated slide-up with placeholder' },
            { label: 'Thread connectors', desc: 'L-shaped elbows + vertical continuation lines' },
            { label: 'Owner actions', desc: 'Edit/Delete popover on hover (if isOwner)' },
            { label: 'Avatar rings', desc: 'story-unseen, story-seen, or none' },
          ].map((f) => (
            <div key={f.label} className="p-4 rounded-xl border border-white/5 bg-white/5">
              <p className="text-foreground font-medium mb-1">{f.label}</p>
              <p className="text-noctvm-silver/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
