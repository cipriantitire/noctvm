'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'rectangular', width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-noctvm-surface',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-noctvm-sm',
        variant === 'text' && 'rounded h-4',
        className,
      )}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    />
  );
}
