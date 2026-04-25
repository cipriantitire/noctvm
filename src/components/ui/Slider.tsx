'use client';
import * as React from 'react';
import { Slider as SliderPrimitive } from 'radix-ui';
import { cn } from '@/lib/cn';

type SliderSize = 'sm' | 'md' | 'lg';
type SliderColor = 'violet' | 'emerald' | 'gold' | 'white';

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  size?: SliderSize;
  color?: SliderColor;
  label?: string;
  showValue?: boolean;
  formatValue?: (v: number) => string;
}

const trackSize: Record<SliderSize, string> = {
  sm: 'h-1',
  md: 'h-3',
  lg: 'h-7',
};

const thumbSize: Record<SliderSize, string> = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
};

const fillColor: Record<SliderColor, string> = {
  violet: 'bg-noctvm-violet',
  emerald: 'bg-noctvm-emerald',
  gold: 'bg-noctvm-gold',
  white: 'bg-white',
};

const thumbGlow: Record<SliderColor, string> = {
  violet: 'shadow-glow focus-visible:ring-noctvm-violet/50',
  emerald: 'focus-visible:ring-noctvm-emerald/50',
  gold: 'focus-visible:ring-noctvm-gold/50',
  white: 'focus-visible:ring-white/50',
};

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      size = 'md',
      color = 'violet',
      label,
      showValue,
      formatValue,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const displayValue = value ?? defaultValue;
    const rawVal = Array.isArray(displayValue) ? displayValue[0] : displayValue;
    const formatted =
      rawVal !== undefined
        ? formatValue
          ? formatValue(rawVal)
          : `${rawVal}`
        : null;

    return (
      <div className={cn('flex flex-col gap-2 w-full', className)}>
        {(label || showValue) && (
          <div className="flex justify-between items-center">
            {label && (
              <span className="text-sm text-foreground font-medium">{label}</span>
            )}
            {showValue && formatted && (
              <span className="text-noctvm-caption text-noctvm-silver">
                {formatted}
              </span>
            )}
          </div>
        )}
        <SliderPrimitive.Root
          ref={ref}
          className="relative flex items-center select-none touch-none w-full"
          value={value}
          defaultValue={defaultValue}
          {...props}
        >
          <SliderPrimitive.Track
            className={cn(
              'relative grow rounded-full overflow-hidden bg-noctvm-surface-light',
              trackSize[size]
            )}
          >
            <SliderPrimitive.Range
              className={cn('absolute h-full rounded-full', fillColor[color])}
            />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            className={cn(
              thumbSize[size],
              'block rounded-full bg-white',
              'border-2 border-noctvm-surface',
              'transition-transform duration-100 active:scale-110',
              'focus-visible:outline-none focus-visible:ring-2',
              thumbGlow[color]
            )}
          />
        </SliderPrimitive.Root>
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
export type { SliderProps };
