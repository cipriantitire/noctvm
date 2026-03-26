'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';
import { X } from 'lucide-react';

type AlertVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  onDismiss?: () => void;
}

const variantStyles: Record<AlertVariant, { border: string; icon: string; bg: string }> = {
  default: {
    border: 'border-l-noctvm-violet',
    icon: 'text-noctvm-violet',
    bg: 'bg-noctvm-violet/10',
  },
  success: {
    border: 'border-l-noctvm-emerald',
    icon: 'text-noctvm-emerald',
    bg: 'bg-noctvm-emerald/10',
  },
  warning: {
    border: 'border-l-noctvm-gold',
    icon: 'text-noctvm-gold',
    bg: 'bg-noctvm-gold/10',
  },
  error: {
    border: 'border-l-red-500',
    icon: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  info: {
    border: 'border-l-blue-400',
    icon: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', title, children, onDismiss, ...props }, ref) => {
    const styles = variantStyles[variant];
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative flex gap-3 rounded-noctvm-md border border-white/10 border-l-4 p-4',
          styles.border,
          styles.bg,
          className
        )}
        {...props}
      >
        <div className="flex-1 min-w-0">
          {title && (
            <p className={cn('text-sm font-semibold mb-1', styles.icon)}>{title}</p>
          )}
          <div className="text-sm text-noctvm-silver leading-relaxed">{children}</div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-0.5 rounded text-noctvm-silver hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export { Alert };
export type { AlertProps, AlertVariant };
