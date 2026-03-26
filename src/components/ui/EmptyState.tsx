'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 px-4 text-center', className)}>
      {icon && (
        <div className="flex size-14 items-center justify-center rounded-full bg-noctvm-surface-light text-noctvm-silver">
          {icon}
        </div>
      )}
      <p className="font-heading text-base font-semibold text-white">{title}</p>
      {description && <p className="max-w-xs text-sm text-noctvm-silver">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
