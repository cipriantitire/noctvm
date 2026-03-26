'use client';

import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn';

// --- RadioGroup (container) ---
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn('flex flex-col gap-2', className)}
    {...props}
  />
));
RadioGroup.displayName = 'RadioGroup';

// --- RadioItem ---
interface RadioItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { outer: 'w-4 h-4', inner: 'w-1.5 h-1.5', text: 'text-sm', desc: 'text-noctvm-caption' },
  md: { outer: 'w-5 h-5', inner: 'w-2 h-2', text: 'text-sm', desc: 'text-noctvm-caption' },
  lg: { outer: 'w-6 h-6', inner: 'w-2.5 h-2.5', text: 'text-base', desc: 'text-sm' },
};

const RadioItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioItemProps
>(({ className, label, description, size = 'md', children, ...props }, ref) => {
  const s = sizeMap[size];
  return (
    <label className="flex items-start gap-2.5 cursor-pointer">
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn(
          s.outer,
          'flex-shrink-0 mt-0.5 rounded-full',
          'border border-noctvm-border bg-noctvm-surface-light',
          'transition-all duration-150',
          'hover:border-noctvm-violet/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noctvm-violet/50',
          'data-[state=checked]:border-noctvm-violet',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center w-full h-full">
          <span className={cn('rounded-full bg-noctvm-violet', s.inner)} />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <span className={cn(s.text, 'text-white font-medium leading-tight')}>
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
RadioItem.displayName = 'RadioItem';

export { RadioGroup, RadioItem };
export type { RadioItemProps };
