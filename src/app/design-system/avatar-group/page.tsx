'use client';
import { AvatarGroup } from '@/components/ui/AvatarGroup';

const sample = [
  { name: 'Alex Carter' },
  { name: 'Marie Dubois' },
  { name: 'Sam Park' },
  { name: 'Julia Reyes' },
  { name: 'Tom Weiss' },
  { name: 'Nora Klein' },
];

export default function AvatarGroupPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Avatar Group</h1>
        <p className="text-noctvm-silver">Overlapping stack for multiple users.</p>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Sizes</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <AvatarGroup avatars={sample} size="sm" max={4} />
            <span className="text-noctvm-caption text-noctvm-silver">Small</span>
          </div>
          <div className="flex items-center gap-4">
            <AvatarGroup avatars={sample} size="md" max={4} />
            <span className="text-noctvm-caption text-noctvm-silver">Medium</span>
          </div>
          <div className="flex items-center gap-4">
            <AvatarGroup avatars={sample} size="lg" max={4} />
            <span className="text-noctvm-caption text-noctvm-silver">Large</span>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Overflow count</h2>
        <div className="flex items-center gap-3">
          <AvatarGroup avatars={sample} max={3} />
          <span className="text-sm text-noctvm-silver">{sample.length} people going tonight</span>
        </div>
      </div>
    </div>
  );
}
