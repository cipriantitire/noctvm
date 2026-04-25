'use client';
import { Divider } from '@/components/ui/Divider';

export default function DividerPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Divider</h1>
        <p className="text-noctvm-silver">Visual separator for content sections.</p>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Horizontal</h2>
        <div className="space-y-4 max-w-md">
          <p className="text-sm text-foreground">Content above</p>
          <Divider />
          <p className="text-sm text-foreground">Content below</p>
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Vertical</h2>
        <div className="flex items-center gap-4 h-8">
          <span className="text-sm text-foreground">Left</span>
          <Divider orientation="vertical" />
          <span className="text-sm text-foreground">Right</span>
        </div>
      </div>
    </div>
  );
}
