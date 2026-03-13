'use client';

import { MoonIcon, EventsIcon, FeedIcon, WalletIcon, UserIcon, CogIcon, VenuesIcon } from './icons';
import { useAuth } from '@/contexts/AuthContext';

type TabType = 'events' | 'feed' | 'venues' | 'wallet' | 'profile';

const NAV_ITEMS: { icon: React.FC<{ className?: string }>; label: string; tab: TabType }[] = [
  { icon: EventsIcon, label: 'Events', tab: 'events' },
  { icon: VenuesIcon, label: 'Venues', tab: 'venues' },
  { icon: FeedIcon,   label: 'Feed',   tab: 'feed' },
  { icon: WalletIcon, label: 'Wallet', tab: 'wallet' },
];

interface SidebarProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  onSettingsClick?: () => void;
}

export default function Sidebar({ activeTab = 'events', onTabChange = () => {}, onSettingsClick }: SidebarProps) {
  const { profile, user } = useAuth();

  const profileLabel = user
    ? (profile?.username || profile?.display_name || 'Profile')
    : 'Log In';

  return (
    <aside className="hidden lg:flex flex-col items-center w-[72px] hover:w-56 group/sidebar h-screen sticky top-0 bg-noctvm-black border-r border-noctvm-border transition-all duration-300 ease-in-out py-6 overflow-hidden">
      {/* Moon Logo */}
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
            className={`w-full flex items-center justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-4 px-2 group-hover/sidebar:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === tab
                ? 'bg-noctvm-violet/10 text-white'
                : 'text-noctvm-silver hover:text-white hover:bg-noctvm-surface'
            }`}
          >
            <Icon className={`w-6 h-6 flex-shrink-0 ${activeTab === tab ? 'scale-110' : ''} transition-transform`} />
            <span className="max-w-0 overflow-hidden opacity-0 group-hover/sidebar:max-w-[160px] group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap">{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom: Cogwheel + Profile */}
      <div className="px-3 w-full space-y-1">
        {/* Cogwheel / Settings */}
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-4 px-2 group-hover/sidebar:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 text-noctvm-silver hover:text-white hover:bg-noctvm-surface"
          title="Account Settings"
        >
          <CogIcon className="w-6 h-6 flex-shrink-0 transition-transform" />
          <span className="max-w-0 overflow-hidden opacity-0 group-hover/sidebar:max-w-[160px] group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap">Settings</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onTabChange('profile')}
          className={`w-full flex items-center justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-4 px-2 group-hover/sidebar:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
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
          <span className="max-w-0 overflow-hidden opacity-0 group-hover/sidebar:max-w-[120px] group-hover/sidebar:opacity-100 transition-all duration-300 whitespace-nowrap truncate">
            {profileLabel}
          </span>
        </button>
      </div>
    </aside>
  );
}
