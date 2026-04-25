'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';

// --- ListboxItem ---
interface ListboxItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  description?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  isSelected?: boolean;
  isDisabled?: boolean;
  color?: 'default' | 'violet' | 'emerald' | 'gold' | 'red';
  variant?: 'flat' | 'solid' | 'bordered';
}

const colorHover: Record<string, string> = {
  default: 'hover:bg-white/10',
  violet: 'hover:bg-noctvm-violet/20',
  emerald: 'hover:bg-noctvm-emerald/20',
  gold: 'hover:bg-noctvm-gold/20',
  red: 'hover:bg-red-500/20',
};
const colorSelected: Record<string, string> = {
  default: 'bg-white/10 text-foreground',
  violet: 'bg-noctvm-violet/20 text-noctvm-violet',
  emerald: 'bg-noctvm-emerald/20 text-noctvm-emerald',
  gold: 'bg-noctvm-gold/20 text-noctvm-gold',
  red: 'bg-red-500/20 text-red-400',
};

const ListboxItem = React.forwardRef<HTMLButtonElement, ListboxItemProps>(
  (
    { className, children, description, startContent, endContent, isSelected, isDisabled, color = 'default', onClick, ...props },
    ref
  ) => (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={isSelected}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 rounded-noctvm-sm px-2 py-1.5',
        'text-left transition-colors duration-100 outline-none',
        'focus-visible:ring-2 focus-visible:ring-noctvm-violet/50',
        isSelected ? colorSelected[color] : cn('text-foreground', colorHover[color]),
        isDisabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...props}
    >
      {startContent && (
        <span className="flex-shrink-0 text-noctvm-silver">{startContent}</span>
      )}
      <span className="flex-1 min-w-0 flex flex-col">
        <span className="text-sm font-medium truncate">{children}</span>
        {description && (
          <span className="text-noctvm-caption text-noctvm-silver truncate">{description}</span>
        )}
      </span>
      {endContent && (
        <span className="flex-shrink-0 text-noctvm-silver">{endContent}</span>
      )}
    </button>
  )
);
ListboxItem.displayName = 'ListboxItem';

// --- ListboxSection ---
interface ListboxSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  showDivider?: boolean;
}

const ListboxSection = React.forwardRef<HTMLDivElement, ListboxSectionProps>(
  ({ className, title, showDivider, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-0.5', showDivider && 'pb-2 mb-2 border-b border-white/10', className)} {...props}>
      {title && (
        <p className="text-noctvm-caption text-noctvm-silver font-semibold uppercase tracking-widest px-2 py-1">
          {title}
        </p>
      )}
      {children}
    </div>
  )
);
ListboxSection.displayName = 'ListboxSection';

// --- Listbox Container ---
interface ListboxProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  emptyContent?: React.ReactNode;
}

const Listbox = React.forwardRef<HTMLDivElement, ListboxProps>(
  ({ className, label, children, emptyContent, ...props }, ref) => (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      className={cn('flex flex-col gap-0.5 p-1', className)}
      {...props}
    >
      {React.Children.count(children) === 0
        ? (emptyContent ?? <div className="h-10 flex items-center justify-center text-noctvm-caption text-noctvm-silver">No items</div>)
        : children}
    </div>
  )
);
Listbox.displayName = 'Listbox';

export { Listbox, ListboxItem, ListboxSection };
export type { ListboxProps, ListboxItemProps, ListboxSectionProps };
