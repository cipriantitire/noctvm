'use client';

import { EventsIcon, FeedIcon, WalletIcon, UserIcon, VenuesIcon } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

type TabType = 'events' | 'feed' | 'venues' | 'wallet' | 'profile';

const BASE_NAV: { icon: React.FC<{ className?: string }>; label: string; tab: TabType }[] = [
  { icon: EventsIcon, label: 'Events',  tab: 'events' },
  { icon: VenuesIcon, label: 'Venues',  tab: 'venues' },
  { icon: FeedIcon,   label: 'Feed',    tab: 'feed' },
  { icon: WalletIcon, label: 'Wallet',  tab: 'wallet' },
];

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { profile, user } = useAuth();

  const profileLabel = user
    ? (profile?.username ? `@${profile.username}` : 'Profile')
    : 'Log In';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-noctvm-border">
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom)]">
        {BASE_NAV.map(({ icon: Icon, label, tab }) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
              activeTab === tab ? 'text-white' : 'text-noctvm-silver hover:text-white'
            }`}
          >
            <Icon className={`w-6 h-6 ${activeTab === tab ? 'scale-110' : ''} transition-transform`} />
            <span className={`text-[10px] font-medium ${activeTab === tab ? 'text-white' : ''}`}>{label}</span>
          </button>
        ))}

        {/* Profile tab */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
            activeTab === 'profile' ? 'text-white' : 'text-noctvm-silver hover:text-white'
          }`}
        >
          {profile?.avatar_url ? (
            <div className={`w-6 h-6 rounded-full overflow-hidden ${activeTab === 'profile' ? 'ring-2 ring-noctvm-violet' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <UserIcon className={`w-6 h-6 ${activeTab === 'profile' ? 'scale-110' : ''} transition-transform`} />
          )}
          <span className={`text-[10px] font-medium truncate max-w-[52px] ${activeTab === 'profile' ? 'text-white' : ''}`}>
            {profileLabel}
          </span>
        </button>
      </div>
    </nav>
  );
}
