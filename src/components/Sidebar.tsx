'use client';

import { MoonIcon, ExploreIcon, MapIcon, BookmarkIcon, UserIcon } from './icons';

const NAV_ITEMS = [
  { icon: ExploreIcon, label: 'Explore', active: true },
  { icon: MapIcon, label: 'Map', active: false },
  { icon: BookmarkIcon, label: 'Saved', active: false },
  { icon: UserIcon, label: 'Profile', active: false },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 h-screen sticky top-0 bg-noctvm-black border-r border-noctvm-border p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <MoonIcon className="w-8 h-8 text-noctvm-violet" />
        <span className="font-heading text-xl font-bold text-glow">NOCTVM</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              active
                ? 'bg-noctvm-violet/10 text-noctvm-violet border border-noctvm-violet/20'
                : 'text-noctvm-silver hover:text-white hover:bg-noctvm-surface'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="pt-6 border-t border-noctvm-border">
        <p className="text-[10px] uppercase tracking-widest text-noctvm-silver/50 font-mono">Bucharest</p>
        <p className="text-xs text-noctvm-silver/30 mt-1">The Living Memory of the Night</p>
      </div>
    </aside>
  );
}
