import { AuthProvider } from '@/contexts/AuthContext';
import { SafeConsentManager } from '@/components/SafeConsentManager';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeConsentManager>
      <AuthProvider>{children}</AuthProvider>
    </SafeConsentManager>
  );
}
