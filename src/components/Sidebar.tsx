'use client';

import { MoonIcon, EventsIcon, FeedIcon, PocketIcon, UserIcon, CogIcon, VenuesIcon } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

type TabType = 'events' | 'feed' | 'venues' | 'pocket' | 'profile';

const NAV_ITEMS: { icon: React.FC<{ className?: string }>; label: string; tab: TabType }[] = [
  { icon: EventsIcon, label: 'Events', tab: 'events' },
  { icon: VenuesIcon, label: 'Venues', tab: 'venues' },
  { icon: FeedIcon,   label: 'Feed',   tab: 'feed' },
  { icon: PocketIcon, label: 'Pocket', tab: 'pocket' },
];

interface SidebarProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  onSettingsClick?: () => void;
  activeCity?: 'bucuresti' | 'constanta';
}

export default function Sidebar({ activeTab = 'events', onTabChange = () => {}, onSettingsClick }: SidebarProps) {
  const { profile, user, isAdmin, isOwner } = useAuth();

  const profileLabel = user
    ? (profile?.username || profile?.display_name || 'Profile')
    : 'Log In';

  // Shared label class: zero width when collapsed (no space taken), fades in when expanded.
  // max-w change is instant (no layout transition), only opacity animates (GPU composited).
  const labelCls = 'max-w-0 group-hover/sidebar:max-w-[160px] overflow-hidden opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 delay-75 whitespace-nowrap';

  return (
    <aside className="hidden lg:flex flex-col items-center w-[72px] hover:w-56 group/sidebar h-screen sticky top-0 bg-noctvm-black border-r border-noctvm-border transition-[width] duration-200 ease-out py-6 overflow-hidden">
      {/* Moon Logo */}
      <div className="flex items-center justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-3 px-5 mb-10 w-full">
        <MoonIcon className="w-8 h-8 text-noctvm-violet flex-shrink-0" />
        <span className={labelCls + ' font-heading text-xl font-bold text-glow'}>NOCTVM</span>
      </div>

      {/* Nav icons — centered when collapsed, left-aligned when expanded */}
      <nav className="flex-1 flex flex-col items-center justify-center w-full space-y-1 px-3">
        {NAV_ITEMS.map(({ icon: Icon, label, tab }) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`w-full flex items-center justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-4 px-2 group-hover/sidebar:px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
              activeTab === tab
                ? 'bg-noctvm-violet/10 text-white'
                : 'text-noctvm-silver hover:text-white hover:bg-noctvm-surface'
            }`}
          >
            <Icon className={`w-6 h-6 flex-shrink-0 ${activeTab === tab ? 'scale-110' : ''}`} />
            <span className={labelCls}>{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom: Cogwheel + Profile */}
      <div className="px-3 w-full space-y-1">
        {/* Command Center (Admin/Owner only) */}
        {(isAdmin || isOwner) && (
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-4 px-2 group-hover/sidebar:px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 text-noctvm-violet hover:bg-noctvm-violet/10 group/cc"
            title="Command Center"
          >
            <svg className="w-6 h-6 flex-shrink-0 group-hover/cc:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6V3.75a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75V6m-1.5 1.5h1.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V8.25a.75.75 0 01.75-.75z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9H6a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75v-7.5a.75.75 0 01.75-.75zM18 12.75h2.25a.75.75 0 01.75.75v3.75a.75.75 0 01-.75.75H18a.75.75 0 01-.75-.75v-3.75a.75.75 0 01.75-.75z" />
            </svg>
            <span className={labelCls}>Command Center</span>
          </Link>
        )}

        {/* Settings */}
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-4 px-2 group-hover/sidebar:px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 text-noctvm-silver hover:text-white hover:bg-noctvm-surface"
          title="Account Settings"
        >
          <CogIcon className="w-6 h-6 flex-shrink-0" />
          <span className={labelCls}>Settings</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onTabChange('profile')}
          className={`w-full flex items-center justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-4 px-2 group-hover/sidebar:px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
            activeTab === 'profile'
              ? 'bg-noctvm-violet/10 text-white'
              : 'text-noctvm-silver hover:text-white hover:bg-noctvm-surface'
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-400 flex items-center justify-center flex-shrink-0 ring-2 ring-noctvm-border overflow-hidden">
            {profile?.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-4 h-4 text-white" />
            )}
          </div>
          <span className={labelCls + ' truncate'}>{profileLabel}</span>
        </button>
      </div>
    </aside>
  );
}
