'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ConsentManager } from './consent-manager';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConsentManager>
      <AuthProvider>{children}</AuthProvider>
    </ConsentManager>
  );
}
