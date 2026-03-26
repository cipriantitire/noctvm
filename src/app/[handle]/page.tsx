'use client';

import UserProfilePage from '@/components/UserProfilePage';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { handle: string };
}

export default function ProfilePage({ params }: PageProps) {
  const { handle } = params;
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-noctvm-black">
      <UserProfilePage 
        onOpenAuth={() => router.push('/')}
        onSettingsClick={() => router.push('/settings')}
        onEditProfileClick={() => router.push('/settings/profile')}
        onEventClick={(event) => router.push(`/event/${event.id}`)}
      />
    </div>
  );
}
