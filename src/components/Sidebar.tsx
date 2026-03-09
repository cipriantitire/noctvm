'use client';

import { MoonIcon, EventsIcon, FeedIcon, ReservationsIcon, HubIcon } from './icons';

type TabType = 'events' | 'feed' | 'reservations' | 'hub';

const NAV_ITEMS: { icon: React.FC<{ className?: string }>; label: string; tab: TabType }[] = [
  { icon: EventsIcon, label: 'Events', tab: 'events' },
  { icon: FeedIcon, label: 'Feed', tab: 'feed' },
  { icon: ReservationsIcon, label: 'Reservations', tab: 'reservations' },
  { icon: HubIcon, label: 'Hub', tab: 'hub' },
];

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 h-screen sticky top-0 bg-noctvm-black border-r border-noctvm-border p-6">
      <div className="flex items-center gap-3 mb-10">
        <MoonIcon className="w-8 h-8 text-noctvm-violet" />
        <span className="font-heading text-xl font-bold text-glow">NOCTVM</span>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ icon: Icon, label, tab }) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-noctvm-violet/10 text-noctvm-violet border border-noctvm-violet/20'
                : 'text-noctvm-silver hover:text-white hover:bg-noctvm-surface'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </nav>
      <div className="pt-6 border-t border-noctvm-border">
        <p className="text-[10px] uppercase tracking-widest text-noctvm-silver/50 font-mono">Bucharest</p>
        <p className="text-xs text-noctvm-silver/30 mt-1">The Living Memory of the Night</p>
      </div>
    </aside>
  );
}
