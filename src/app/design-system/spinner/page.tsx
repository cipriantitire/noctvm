'use client';
import { Spinner } from '@/components/ui/Spinner';

export default function SpinnerPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Spinner</h1>
        <p className="text-noctvm-silver">Loading state indicator.</p>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Sizes</h2>
        <div className="flex items-center gap-8">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Colors</h2>
        <div className="flex items-center gap-8">
          <Spinner color="violet" />
          <Spinner color="emerald" />
          <Spinner color="gold" />
          <Spinner color="white" />
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">With Label</h2>
        <Spinner label="Loading events..." />
      </div>
    </div>
  );
}
