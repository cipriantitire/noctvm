'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ScrollFadeInit from './ScrollFadeInit';

// Completely isolate the import and instantiation of the Consent Manager
const ConsentManagerBase = dynamic(() => 
  import('@/app/consent-manager').then(mod => mod.ConsentManager),
  { ssr: false }
);

export function SafeConsentManager({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Strict guard: Do not even render the dynamic import until the client fully mounts
  if (!isMounted) return <>{children}</>;

  return <ConsentManagerBase><ScrollFadeInit />{children}</ConsentManagerBase>;
}
