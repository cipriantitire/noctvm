'use client';
import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, items, separator, maxItems, ...props }, ref) => {
    let displayItems = items;

    if (maxItems && items.length > maxItems) {
      const before = 1;
      const after = maxItems - before - 1;
      displayItems = [
        ...items.slice(0, before),
        { label: '…' },
        ...items.slice(items.length - after),
      ];
    }

    return (
      <nav ref={ref} aria-label="Breadcrumb" className={cn('flex', className)} {...props}>
        <ol className="flex items-center gap-1 flex-wrap">
          {displayItems.map((item, i) => {
            const isLast = i === displayItems.length - 1;
            const isEllipsis = item.label === '…';
            return (
              <li key={i} className="flex items-center gap-1">
                {isEllipsis ? (
                  <span className="text-sm text-noctvm-silver px-1">…</span>
                ) : isLast ? (
                  <span
                    className="text-sm text-foreground font-medium"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : item.href ? (
                  <a
                    href={item.href}
                    className="text-sm text-noctvm-silver hover:text-foreground transition-colors px-1 py-0.5 rounded hover:bg-white/5"
                  >
                    {item.label}
                  </a>
                ) : (
                  <button
                    onClick={item.onClick}
                    className="text-sm text-noctvm-silver hover:text-foreground transition-colors px-1 py-0.5 rounded hover:bg-white/5"
                  >
                    {item.label}
                  </button>
                )}
                {!isLast && (
                  <span className="text-noctvm-border" aria-hidden="true">
                    {separator ?? <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);
Breadcrumbs.displayName = 'Breadcrumbs';

export { Breadcrumbs };
export type { BreadcrumbsProps, BreadcrumbItem };
