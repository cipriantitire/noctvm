'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAdmin?: boolean; requireOwner?: boolean } = {}
) {
  return function ProtectedComponent(props: P) {
    const { user, profile, loading, isAdmin, isOwner } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (loading) return;

      if (!user) {
        router.push('/');
        return;
      }

      if (options.requireAdmin && !isAdmin) {
        router.push('/');
        return;
      }

      if (options.requireOwner && !isOwner && !isAdmin) {
        router.push('/');
        return;
      }
    }, [user, profile, loading, isAdmin, isOwner, router]);

    if (loading || !user) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-noctvm-black">
          <div className="w-8 h-8 border-4 border-noctvm-violet border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (options.requireAdmin && !isAdmin) return null;
    if (options.requireOwner && !isOwner && !isAdmin) return null;

    return <Component {...props} />;
  };
}
