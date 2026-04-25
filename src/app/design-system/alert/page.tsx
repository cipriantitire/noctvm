'use client';
import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';

export default function AlertPage() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const dismiss = (id: string) => setDismissed(prev => [...prev, id]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Alert</h1>
        <p className="text-noctvm-silver">Persistent informational banners.</p>
      </div>
      <div className="space-y-3 max-w-lg">
        {!dismissed.includes('default') && (
          <Alert variant="default" title="Pro tip" onDismiss={() => dismiss('default')}>
            You can connect your venue to start selling tickets.
          </Alert>
        )}
        {!dismissed.includes('success') && (
          <Alert variant="success" title="Booking confirmed" onDismiss={() => dismiss('success')}>
            Your table at Prism is reserved for Friday at 11 PM.
          </Alert>
        )}
        {!dismissed.includes('warning') && (
          <Alert variant="warning" title="Limited availability" onDismiss={() => dismiss('warning')}>
            Only 3 tickets remain for this event.
          </Alert>
        )}
        {!dismissed.includes('error') && (
          <Alert variant="error" title="Payment failed" onDismiss={() => dismiss('error')}>
            Your card was declined. Please update your payment method.
          </Alert>
        )}
        {!dismissed.includes('info') && (
          <Alert variant="info" title="New feature" onDismiss={() => dismiss('info')}>
            Venue analytics are now available in your dashboard.
          </Alert>
        )}
      </div>
    </div>
  );
}
