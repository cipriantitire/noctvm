'use client';

import { ExploreIcon, MapIcon, BookmarkIcon, UserIcon } from './icons';

const NAV_ITEMS = [
  { icon: ExploreIcon, label: 'Explore', active: true },
  { icon: MapIcon, label: 'Map', active: false },
  { icon: BookmarkIcon, label: 'Saved', active: false },
  { icon: UserIcon, label: 'Profile', active: false },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-noctvm-border">
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
              active ? 'text-noctvm-violet' : 'text-noctvm-silver hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
