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
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    supabase
      .from('profiles')
      .select('*')
      .eq('username', cleanHandle)
      .single()
      .then(({ data }) => {
        setTargetProfile(data as Profile | null);
        setLoading(false);
      });
  }, [handle]);

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
