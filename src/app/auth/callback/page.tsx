'use client';

import { useEffect } from 'react';
import { CANONICAL_PUBLIC_ORIGIN } from '@/lib/supabase';

export default function AuthCallbackPage() {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const nextPath = searchParams.get('next') || '/';
    const safeNextPath = nextPath.startsWith('/') ? nextPath : '/';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const targetOrigin = isLocalhost ? window.location.origin : CANONICAL_PUBLIC_ORIGIN;

    window.location.replace(`${targetOrigin}${safeNextPath}`);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-noctvm-black px-4 text-center">
      <div className="max-w-sm space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full border border-white/10 bg-noctvm-surface animate-pulse" />
        <p className="font-heading text-xl font-semibold text-white">Signing you in</p>
        <p className="text-sm text-noctvm-silver">Redirecting you back to NOCTVM.</p>
      </div>
    </div>
  );
}