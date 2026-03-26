'use client';
import { useState, useEffect } from 'react';
import { Progress, CircularProgress } from '@/components/ui/Progress';

export default function ProgressPage() {
  const [value, setValue] = useState(30);
  useEffect(() => {
    const t = setInterval(() => setValue(v => v >= 100 ? 0 : v + 5), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Progress</h1>
        <p className="text-noctvm-silver">Linear bars and circular rings.</p>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Linear — Animated</h2>
        <div className="space-y-4 max-w-md">
          <Progress value={value} label="Capacity" showValue color="violet" size="md" />
          <Progress value={75} color="emerald" size="sm" label="Check-ins" showValue />
          <Progress value={40} color="gold" size="lg" label="VIP tables" showValue />
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Indeterminate</h2>
        <div className="max-w-md">
          <Progress isIndeterminate color="violet" size="sm" label="Loading events..." />
        </div>
      </div>
      <div className="space-y-6">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Circular</h2>
        <div className="flex items-end gap-8">
          <CircularProgress value={value} size="sm" showValue />
          <CircularProgress value={75} size="md" showValue color="emerald" label="Capacity" />
          <CircularProgress value={40} size="lg" showValue color="gold" />
        </div>
      </div>
    </div>
  );
}
