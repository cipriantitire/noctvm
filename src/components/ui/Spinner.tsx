'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';

type SpinnerSize = 'sm' | 'md' | 'lg';
type SpinnerColor = 'default' | 'violet' | 'emerald' | 'gold' | 'white';

interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  color?: SpinnerColor;
  label?: string;
}

const sizeMap: Record<SpinnerSize, { wrapper: string; border: string }> = {
  sm: { wrapper: 'w-5 h-5', border: 'border-2' },
  md: { wrapper: 'w-8 h-8', border: 'border-[3px]' },
  lg: { wrapper: 'w-10 h-10', border: 'border-[3px]' },
};

const colorMap: Record<SpinnerColor, string> = {
  default: 'border-noctvm-violet',
  violet: 'border-noctvm-violet',
  emerald: 'border-noctvm-emerald',
  gold: 'border-noctvm-gold',
  white: 'border-white',
};

const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size = 'md', color = 'default', label, ...props }, ref) => {
    const { wrapper, border } = sizeMap[size];
    const colorClass = colorMap[color];
    return (
      <span
        ref={ref}
        role="status"
        aria-label={label ?? 'Loading'}
        className={cn('inline-flex flex-col items-center gap-2', className)}
        {...props}
      >
        <span
          className={cn(
            wrapper,
            'rounded-full animate-spin',
            border,
            colorClass,
            'border-t-transparent'
          )}
        />
        {label && (
          <span className="text-noctvm-caption text-noctvm-silver">{label}</span>
        )}
      </span>
    );
  }
);
Spinner.displayName = 'Spinner';

export { Spinner };
export type { SpinnerProps };
