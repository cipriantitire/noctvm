'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

// Inline colors bypass the frosted-glass border shorthand override in the CSS cascade
const variantBorderColor: Record<ToastVariant, string> = {
  default: 'rgb(124 58 237)',
  success: 'rgb(16 185 129)',
  error: 'rgb(239 68 68)',
  warning: 'rgb(212 168 67)',
  info: 'rgb(96 165 250)',
};

function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  React.useEffect(() => {
    const timer = setTimeout(() => onRemove(item.id), item.duration ?? 3500);
    return () => clearTimeout(timer);
  }, [item, onRemove]);

  return (
    <div
      className={cn(
        'frosted-glass pointer-events-auto flex items-center gap-3 rounded-noctvm-md border px-4 py-3 pr-10 text-sm text-white shadow-lg',
        'animate-fade-in-up',
      )}
      style={{ borderLeftColor: variantBorderColor[item.variant ?? 'default'] }}
      role="alert"
    >
      <span className="flex-1">{item.message}</span>
      <button
        onClick={() => onRemove(item.id)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-noctvm-silver hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const showToast = React.useCallback((message: string, variant: ToastVariant = 'default', duration?: number) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, variant, duration }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-24 left-1/2 z-toast flex -translate-x-1/2 flex-col items-center gap-2 w-full max-w-sm px-4"
      >
        {toasts.map(toast => (
          <ToastItem key={toast.id} item={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
