'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';

type ProgressColor = 'violet' | 'emerald' | 'gold' | 'red' | 'white';
type ProgressSize = 'sm' | 'md' | 'lg';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  color?: ProgressColor;
  size?: ProgressSize;
  label?: string;
  showValue?: boolean;
  isIndeterminate?: boolean;
}

const sizeMap: Record<ProgressSize, string> = {
  sm: 'h-1',
  md: 'h-3',
  lg: 'h-5',
};

const colorMap: Record<ProgressColor, string> = {
  violet: 'bg-noctvm-violet',
  emerald: 'bg-noctvm-emerald',
  gold: 'bg-noctvm-gold',
  red: 'bg-red-500',
  white: 'bg-white',
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      color = 'violet',
      size = 'md',
      label,
      showValue,
      isIndeterminate,
      ...props
    },
    ref
  ) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <div ref={ref} className={cn('w-full flex flex-col gap-1.5', className)} {...props}>
        {(label || showValue) && (
          <div className="flex justify-between items-center">
            {label && <span className="text-sm text-white font-medium">{label}</span>}
            {showValue && (
              <span className="text-noctvm-caption text-noctvm-silver">
                {isIndeterminate ? '...' : `${Math.round(pct)}%`}
              </span>
            )}
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={isIndeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
          className={cn(
            'w-full rounded-full overflow-hidden bg-noctvm-surface-light',
            sizeMap[size]
          )}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              colorMap[color],
              isIndeterminate && 'animate-[indeterminate_1.5s_ease-in-out_infinite] w-1/3 origin-left'
            )}
            style={isIndeterminate ? undefined : { width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }
);
Progress.displayName = 'Progress';

// --- Circular Progress ---
interface CircularProgressProps extends React.SVGAttributes<SVGElement> {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: ProgressColor;
  showValue?: boolean;
  isIndeterminate?: boolean;
  label?: string;
}

const circularSizeMap = {
  sm: { px: 32, stroke: 3, r: 12 },
  md: { px: 40, stroke: 3, r: 16 },
  lg: { px: 48, stroke: 4, r: 20 },
};

const circularColorMap: Record<ProgressColor, string> = {
  violet: 'stroke-noctvm-violet',
  emerald: 'stroke-noctvm-emerald',
  gold: 'stroke-noctvm-gold',
  red: 'stroke-red-500',
  white: 'stroke-white',
};

const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size = 'md',
      color = 'violet',
      showValue,
      isIndeterminate,
      label,
      ...props
    },
    ref
  ) => {
    const { px, stroke, r } = circularSizeMap[size];
    const circumference = 2 * Math.PI * r;
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const offset = circumference - (pct / 100) * circumference;
    const center = px / 2;

    return (
      <div className="inline-flex flex-col items-center gap-1">
        <div className="relative" style={{ width: px, height: px }}>
          <svg
            ref={ref}
            width={px}
            height={px}
            viewBox={`0 0 ${px} ${px}`}
            className={cn(isIndeterminate && 'animate-spin', className)}
            {...props}
          >
            <circle
              cx={center}
              cy={center}
              r={r}
              fill="none"
              strokeWidth={stroke}
              className="stroke-noctvm-surface-light"
            />
            <circle
              cx={center}
              cy={center}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={isIndeterminate ? circumference * 0.75 : offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              className={cn('transition-all duration-500', circularColorMap[color])}
            />
          </svg>
          {showValue && !isIndeterminate && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-noctvm-xs text-white font-semibold">
                {Math.round(pct)}%
              </span>
            </div>
          )}
        </div>
        {label && <span className="text-noctvm-caption text-noctvm-silver">{label}</span>}
      </div>
    );
  }
);
CircularProgress.displayName = 'CircularProgress';

export { Progress, CircularProgress };
export type { ProgressProps, CircularProgressProps, ProgressColor, ProgressSize };
