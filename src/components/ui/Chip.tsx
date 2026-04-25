'use client';
import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

type ChipVariant = 'solid' | 'bordered' | 'flat' | 'ghost';
type ChipColor = 'default' | 'violet' | 'emerald' | 'gold' | 'red';
type ChipSize = 'sm' | 'md' | 'lg';

interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ChipVariant;
  color?: ChipColor;
  size?: ChipSize;
  onRemove?: () => void;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  isDisabled?: boolean;
  isDot?: boolean;
}

const sizeMap: Record<ChipSize, { height: string; text: string; px: string; dot: string }> = {
  sm: { height: 'h-6', text: 'text-noctvm-caption', px: 'px-2', dot: 'w-1.5 h-1.5' },
  md: { height: 'h-7', text: 'text-sm', px: 'px-2.5', dot: 'w-2 h-2' },
  lg: { height: 'h-8', text: 'text-base', px: 'px-3', dot: 'w-2.5 h-2.5' },
};

const colorMap: Record<ChipColor, Record<ChipVariant, string>> = {
  default: {
    solid: 'bg-noctvm-surface-light text-foreground border-transparent',
    bordered: 'bg-transparent text-foreground border-noctvm-border',
    flat: 'bg-white/10 text-foreground border-transparent',
    ghost: 'bg-transparent text-noctvm-silver border-noctvm-border hover:bg-white/5',
  },
  violet: {
    solid: 'bg-noctvm-violet text-foreground border-transparent',
    bordered: 'bg-transparent text-noctvm-violet border-noctvm-violet',
    flat: 'bg-noctvm-violet/20 text-noctvm-violet border-transparent',
    ghost: 'bg-transparent text-noctvm-violet border-noctvm-violet/50 hover:bg-noctvm-violet/10',
  },
  emerald: {
    solid: 'bg-noctvm-emerald text-foreground border-transparent',
    bordered: 'bg-transparent text-noctvm-emerald border-noctvm-emerald',
    flat: 'bg-noctvm-emerald/20 text-noctvm-emerald border-transparent',
    ghost: 'bg-transparent text-noctvm-emerald border-noctvm-emerald/50 hover:bg-noctvm-emerald/10',
  },
  gold: {
    solid: 'bg-noctvm-gold text-noctvm-black border-transparent',
    bordered: 'bg-transparent text-noctvm-gold border-noctvm-gold',
    flat: 'bg-noctvm-gold/20 text-noctvm-gold border-transparent',
    ghost: 'bg-transparent text-noctvm-gold border-noctvm-gold/50 hover:bg-noctvm-gold/10',
  },
  red: {
    solid: 'bg-red-500 text-foreground border-transparent',
    bordered: 'bg-transparent text-red-400 border-red-500',
    flat: 'bg-red-500/20 text-red-400 border-transparent',
    ghost: 'bg-transparent text-red-400 border-red-500/50 hover:bg-red-500/10',
  },
};

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      className,
      variant = 'flat',
      color = 'default',
      size = 'md',
      onRemove,
      startContent,
      endContent,
      isDisabled,
      isDot,
      children,
      ...props
    },
    ref
  ) => {
    const s = sizeMap[size];
    const colorStyles = colorMap[color][variant];
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border font-medium',
          'transition-colors duration-150 select-none',
          s.height,
          s.text,
          s.px,
          colorStyles,
          isDisabled && 'opacity-50 pointer-events-none',
          className
        )}
        {...props}
      >
        {isDot && !startContent && (
          <span className={cn('rounded-full bg-current', s.dot)} />
        )}
        {startContent}
        <span className="px-0.5">{children}</span>
        {endContent}
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="flex items-center justify-center rounded-full hover:bg-white/20 transition-colors w-4 h-4 flex-shrink-0 -mr-1"
            aria-label="Remove"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }
);
Chip.displayName = 'Chip';

export { Chip };
export type { ChipProps, ChipColor, ChipVariant, ChipSize };
