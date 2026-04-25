'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';

// --- Card Root ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'bordered' | 'flat';
  isHoverable?: boolean;
  isPressable?: boolean;
  shadow?: 'none' | 'sm' | 'md';
  fullWidth?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', isHoverable, isPressable, shadow = 'sm', fullWidth, children, onClick, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-noctvm-surface border border-noctvm-border',
      glass: 'frosted-glass border border-white/10',
      bordered: 'bg-transparent border border-noctvm-border',
      flat: 'bg-noctvm-surface-light border-0',
    };
    const shadowStyles = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
    };
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-noctvm-md overflow-hidden flex flex-col',
          variantStyles[variant],
          shadowStyles[shadow],
          fullWidth && 'w-full',
          isHoverable && 'transition-colors duration-150 hover:border-white/20 hover:bg-noctvm-surface-light',
          isPressable && 'cursor-pointer active:scale-[0.98] transition-transform duration-100',
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// --- Card Header ---
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1 p-3 pb-0', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

// --- Card Title ---
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base font-semibold text-foreground leading-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

// --- Card Description ---
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-noctvm-silver leading-snug', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

// --- Card Body ---
const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-3 flex-1', className)}
      {...props}
    />
  )
);
CardBody.displayName = 'CardBody';

// --- Card Footer ---
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-3 pt-0 gap-2', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter };
export type { CardProps };
