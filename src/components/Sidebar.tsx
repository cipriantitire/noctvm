'use client';

import { MoonIcon, EventsIcon, FeedIcon, WalletIcon, HubIcon, UserIcon } from './icons';

type TabType = 'events' | 'feed' | 'wallet' | 'hub';

const NAV_ITEMS: { icon: React.FC<{ className?: string }>; label: string; tab: TabType }[] = [
  { icon: EventsIcon, label: 'Events', tab: 'events' },
  { icon: FeedIcon, label: 'Feed', tab: 'feed' },
  { icon: WalletIcon, label: 'Wallet', tab: 'wallet' },
  { icon: HubIcon, label: 'Hub', tab: 'hub' },
];

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col items-center w-[72px] hover:w-56 group/sidebar h-screen sticky top-0 bg-noctvm-black border-r border-noctvm-border transition-all duration-300 ease-in-out py-6 overflow-hidden">
      {/* Moon Logo - top left */}
      <div className="flex items-center gap-3 px-5 mb-10 w-full">
        <MoonIcon className="w-8 h-8 text-noctvm-violet flex-shrink-0" />
        <span className="font-heading text-xl font-bold text-glow opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">NOCTVM</span>
      </div>

      {/* Centered nav icons */}
      <nav className="flex-1 flex flex-col items-center justify-center w-full space-y-1 px-3">
        {NAV_ITEMS.map(({ icon: Icon, label, tab }) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-noctvm-violet/10 text-white'
                : 'text-noctvm-silver hover:text-white hover:bg-noctvm-surface'
            }`}
          >
            <Icon className={`w-6 h-6 flex-shrink-0 ${activeTab === tab ? 'scale-110' : ''} transition-transform`} />
            <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">{label}</span>
          </button>
        ))}
      </nav>

      {/* Profile avatar at bottom */}
      <div className="px-3 w-full">
        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-noctvm-silver hover:text-white hover:bg-noctvm-surface transition-all duration-200">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-400 flex items-center justify-center flex-shrink-0 ring-2 ring-noctvm-border">
            <UserIcon className="w-4 h-4 text-white" />
          </div>
          <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">Profile</span>
        </button>
      </div>
    </aside>
  );
}
