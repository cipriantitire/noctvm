'use client';

import { useState, useEffect } from 'react';
import UserProfilePage from '@/components/UserProfilePage';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { handle: string };
}

export default function ProfilePage({ params }: PageProps) {
  const { handle } = params;
  const router = useRouter();
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const cleanHandle = decodeURIComponent(handle).replace(/^@/, '').trim();

    const loadProfile = async () => {
      setLoading(true);

      try {
        const { data: usernameMatch } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', cleanHandle)
          .maybeSingle();

        let resolvedProfile = usernameMatch as Profile | null;

        if (!resolvedProfile) {
          const { data: displayNameMatch } = await supabase
            .from('profiles')
            .select('*')
            .ilike('display_name', cleanHandle)
            .maybeSingle();

          resolvedProfile = displayNameMatch as Profile | null;
        }

        if (cancelled) return;

        setTargetProfile(resolvedProfile);

        if (resolvedProfile?.username) {
          const canonicalHandle = resolvedProfile.username.replace(/^@/, '');
          if (canonicalHandle.toLowerCase() !== cleanHandle.toLowerCase()) {
            router.replace(`/@${encodeURIComponent(canonicalHandle)}`);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [handle, router]);

  if (loading) return <div className="min-h-screen bg-noctvm-black" />;

  if (!targetProfile) {
    return (
      <div className="min-h-screen bg-noctvm-black flex items-center justify-center">
        <p className="text-noctvm-silver text-sm">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noctvm-black">
      <UserProfilePage
        targetProfile={targetProfile}
        onOpenAuth={() => router.push('/')}
        onSettingsClick={() => router.push('/settings')}
        onEditProfileClick={() => router.push('/settings/profile')}
        onEventClick={(event) => router.push(`/event/${event.id}`)}
      />
    </div>
  );
}
