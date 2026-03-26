'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ConsentManagerBase = dynamic(() => 
  import('@/app/consent-manager').then(mod => mod.ConsentManager),
  { ssr: false }
);

export function SafeConsentManager({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <>{children}</>;

  return <ConsentManagerBase>{children}</ConsentManagerBase>;
}
