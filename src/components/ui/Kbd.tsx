'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  keys?: string | string[];
}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, keys, children, ...props }, ref) => {
    const keysArray = keys ? (Array.isArray(keys) ? keys : [keys]) : [];
    return (
      <kbd
        ref={ref}
        className={cn(
          'inline-flex items-center gap-0.5',
          'rounded-noctvm-sm border border-white/10 bg-white/5',
          'px-1.5 py-0.5 text-noctvm-caption font-mono font-normal',
          'text-noctvm-silver shadow-inner',
          className
        )}
        {...props}
      >
        {keysArray.map((key, i) => (
          <abbr key={i} title={key} className="no-underline">
            {key}
          </abbr>
        ))}
        {children}
      </kbd>
    );
  }
);
Kbd.displayName = 'Kbd';

export { Kbd };
export type { KbdProps };
