'use client';

import { EventsIcon, FeedIcon, PocketIcon, UserIcon, VenuesIcon } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import UIBottomNav, { BottomNavItem } from './ui/BottomNav';

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

  const profileLabel = user ? 'You' : 'Log In';

  const navItems: BottomNavItem[] = ITEMS.map(({ icon: Icon, label, tab }) => ({
    id: tab,
    label: tab === 'profile' ? profileLabel : label,
    icon: tab === 'profile' && profile?.avatar_url ? (
      <div className={`w-6 h-6 rounded-full overflow-hidden ring-1 ${activeTab === 'profile' ? 'ring-noctvm-violet shadow-[0_0_0_1px_rgba(124,58,237,0.12)]' : 'ring-white/10'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
      </div>
    ) : (
      <Icon className="w-6 h-6" />
    ),
    isActive: activeTab === tab,
    onClick: () => onTabChange(tab),
  }));

  return (
    <div className="z-50 pb-8 pointer-events-none md:hidden">
      <div className="pointer-events-auto">
        <UIBottomNav items={navItems} />
      </div>
    </div>
  );
}
