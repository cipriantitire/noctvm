'use client';

import { EventsIcon, FeedIcon, PocketIcon, UserIcon, VenuesIcon } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

type TabType = 'events' | 'feed' | 'venues' | 'pocket' | 'profile';

const ITEMS: { icon: any; label: string; tab: TabType }[] = [
  { icon: EventsIcon, label: 'Events', tab: 'events' },
  { icon: VenuesIcon, label: 'Venues', tab: 'venues' },
  { icon: FeedIcon, label: 'Feed', tab: 'feed' },
  { icon: PocketIcon, label: 'Pocket',  tab: 'pocket' },
  { icon: UserIcon, label: 'Profile', tab: 'profile' },
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
        {ITEMS.map(({ icon: Icon, label, tab }) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
              activeTab === tab ? 'text-white' : 'text-noctvm-silver hover:text-white'
            }`}
          >
            {tab === 'profile' && profile?.avatar_url ? (
              <div className={`w-6 h-6 rounded-full overflow-hidden ${activeTab === 'profile' ? 'ring-2 ring-noctvm-violet' : 'ring-1 ring-white/10'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <Icon className={`w-6 h-6 ${activeTab === tab ? 'scale-110' : ''} transition-transform`} />
            )}
            <span className={`text-[10px] font-medium truncate max-w-[52px] ${activeTab === tab ? 'text-white' : ''}`}>
              {tab === 'profile' ? profileLabel : label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
