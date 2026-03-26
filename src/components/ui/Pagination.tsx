'use client';
import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  page: number;
  total: number;
  siblings?: number;
  boundaries?: number;
  onChange: (page: number) => void;
  showControls?: boolean;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { item: 'w-8 h-8 text-noctvm-caption', icon: 'w-3.5 h-3.5' },
  md: { item: 'w-9 h-9 text-sm', icon: 'w-4 h-4' },
  lg: { item: 'w-10 h-10 text-base', icon: 'w-4 h-4' },
};

function getRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function usePagination(page: number, total: number, siblings = 1, boundaries = 1) {
  const totalPageNumbers = siblings * 2 + 3 + boundaries * 2;
  if (totalPageNumbers >= total) return getRange(1, total);

  const leftSiblingIndex = Math.max(page - siblings, boundaries);
  const rightSiblingIndex = Math.min(page + siblings, total - boundaries);
  const showLeftDots = leftSiblingIndex > boundaries + 2;
  const showRightDots = rightSiblingIndex < total - boundaries - 1;

  const leftRange = getRange(1, boundaries);
  const rightRange = getRange(total - boundaries + 1, total);

  if (!showLeftDots && showRightDots) {
    const leftItemCount = siblings * 2 + boundaries + 2;
    return [...getRange(1, leftItemCount), -1, ...rightRange];
  }
  if (showLeftDots && !showRightDots) {
    const rightItemCount = siblings * 2 + boundaries + 2;
    return [...leftRange, -1, ...getRange(total - rightItemCount + 1, total)];
  }
  return [...leftRange, -1, ...getRange(leftSiblingIndex, rightSiblingIndex), -1, ...rightRange];
}

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      className,
      page,
      total,
      siblings = 1,
      boundaries = 1,
      onChange,
      showControls = true,
      isDisabled,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const pages = usePagination(page, total, siblings, boundaries);
    const { item, icon } = sizeMap[size];
    const itemBase = cn(
      item,
      'inline-flex items-center justify-center rounded-noctvm-sm font-medium',
      'transition-colors duration-150 select-none',
      isDisabled && 'opacity-50 pointer-events-none'
    );

    return (
      <nav ref={ref} aria-label="Pagination" className={cn('flex items-center gap-1', className)} {...props}>
        {showControls && (
          <button
            onClick={() => onChange(Math.max(1, page - 1))}
            disabled={page === 1 || isDisabled}
            className={cn(itemBase, 'text-noctvm-silver hover:bg-white/10 hover:text-white disabled:opacity-30')}
            aria-label="Previous page"
          >
            <ChevronLeft className={icon} />
          </button>
        )}
        {pages.map((p, i) =>
          p === -1 ? (
            <span key={`dots-${i}`} className={cn(itemBase, 'text-noctvm-silver pointer-events-none')}>
              <MoreHorizontal className={icon} />
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              disabled={isDisabled}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                itemBase,
                p === page
                  ? 'bg-noctvm-violet text-white shadow-glow'
                  : 'text-noctvm-silver hover:bg-white/10 hover:text-white'
              )}
            >
              {p}
            </button>
          )
        )}
        {showControls && (
          <button
            onClick={() => onChange(Math.min(total, page + 1))}
            disabled={page === total || isDisabled}
            className={cn(itemBase, 'text-noctvm-silver hover:bg-white/10 hover:text-white disabled:opacity-30')}
            aria-label="Next page"
          >
            <ChevronRight className={icon} />
          </button>
        )}
      </nav>
    );
  }
);
Pagination.displayName = 'Pagination';

export { Pagination };
export type { PaginationProps };
