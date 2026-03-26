'use client';

import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { box: 'w-4 h-4', icon: 'w-3 h-3', text: 'text-sm', desc: 'text-noctvm-caption' },
  md: { box: 'w-5 h-5', icon: 'w-3.5 h-3.5', text: 'text-sm', desc: 'text-noctvm-caption' },
  lg: { box: 'w-6 h-6', icon: 'w-4 h-4', text: 'text-base', desc: 'text-sm' },
};

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, description, size = 'md', ...props }, ref) => {
  const s = sizeMap[size];
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          s.box,
          'flex-shrink-0 mt-0.5 rounded-[5px]',
          'border border-noctvm-border bg-noctvm-surface-light',
          'transition-all duration-150',
          'hover:border-noctvm-violet/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noctvm-violet/50',
          'data-[state=checked]:bg-noctvm-violet data-[state=checked]:border-noctvm-violet',
          'data-[state=indeterminate]:bg-noctvm-violet/30 data-[state=indeterminate]:border-noctvm-violet',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
          {props.checked === 'indeterminate' ? (
            <Minus className={s.icon} strokeWidth={3} />
          ) : (
            <Check className={s.icon} strokeWidth={3} />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <span className={cn(s.text, 'text-white font-medium leading-tight group-has-[button:disabled]:opacity-50')}>
              {label}
            </span>
          )}
          {description && (
            <span className={cn(s.desc, 'text-noctvm-silver leading-snug')}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
});
Checkbox.displayName = 'Checkbox';

export { Checkbox };
export type { CheckboxProps };
