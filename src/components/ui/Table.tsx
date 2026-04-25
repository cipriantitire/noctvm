'use client';
import * as React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';

// --- Table Root ---
interface TableRootProps extends React.HTMLAttributes<HTMLDivElement> {
  isStriped?: boolean;
  isCompact?: boolean;
  removeWrapper?: boolean;
}

const TableRoot = React.forwardRef<HTMLDivElement, TableRootProps>(
  ({ className, isStriped, isCompact, removeWrapper, children, ...props }, ref) => {
    const table = (
      <div className="w-full overflow-x-auto">
        <table
          className={cn(
            'w-full caption-bottom text-sm border-collapse',
            className
          )}
          data-striped={isStriped}
          data-compact={isCompact}
        >
          {children}
        </table>
      </div>
    );

    if (removeWrapper) return table;

    return (
      <div
        ref={ref}
        className="rounded-noctvm-md border border-noctvm-border overflow-hidden"
        {...props}
      >
        {table}
      </div>
    );
  }
);
TableRoot.displayName = 'Table';

// --- Table Header ---
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'bg-noctvm-surface-light border-b border-noctvm-border',
      className
    )}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

// --- Table Body ---
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      '[&_tr:last-child]:border-0',
      '[&[data-striped=true]_tr:nth-child(even)]:bg-white/5',
      className
    )}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

// --- Table Footer ---
const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t border-noctvm-border bg-noctvm-surface-light',
      className
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

// --- Table Row ---
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-b border-noctvm-border transition-colors',
      'hover:bg-white/5 data-[selected=true]:bg-noctvm-violet/10',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

// --- Table Head (column header) ---
interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  isSortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, isSortable, sortDirection, onSort, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-10 px-3 text-left text-noctvm-caption font-semibold uppercase tracking-wider text-noctvm-silver',
        'whitespace-nowrap',
        isSortable && 'cursor-pointer hover:text-foreground select-none',
        className
      )}
      onClick={isSortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        {isSortable && (
          <span className="inline-flex flex-col">
            {sortDirection === 'asc' ? (
              <ChevronUp className="w-3 h-3 text-noctvm-violet" />
            ) : sortDirection === 'desc' ? (
              <ChevronDown className="w-3 h-3 text-noctvm-violet" />
            ) : (
              <ChevronsUpDown className="w-3 h-3 opacity-40" />
            )}
          </span>
        )}
      </div>
    </th>
  )
);
TableHead.displayName = 'TableHead';

// --- Table Cell ---
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('py-2 px-3 text-sm text-foreground align-middle', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

// --- Table Caption ---
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      'mt-4 text-noctvm-caption text-noctvm-silver text-center',
      className
    )}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export {
  TableRoot as Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
