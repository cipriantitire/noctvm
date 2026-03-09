'use client';

import { EventsIcon, FeedIcon, WalletIcon, UserIcon } from './icons';

type TabType = 'events' | 'feed' | 'wallet' | 'profile';

const NAV_ITEMS: { icon: React.FC<{ className?: string }>; label: string; tab: TabType }[] = [
  { icon: EventsIcon, label: 'Events', tab: 'events' },
  { icon: FeedIcon, label: 'Feed', tab: 'feed' },
  { icon: WalletIcon, label: 'Wallet', tab: 'wallet' },
  { icon: UserIcon, label: 'Profile', tab: 'profile' },
];

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-noctvm-border">
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(({ icon: Icon, label, tab }) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
              activeTab === tab ? 'text-white' : 'text-noctvm-silver hover:text-white'
            }`}
          >
            <Icon className={`w-6 h-6 ${activeTab === tab ? 'scale-110' : ''} transition-transform`} />
            <span className={`text-[10px] font-medium ${activeTab === tab ? 'text-white' : ''}`}>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}