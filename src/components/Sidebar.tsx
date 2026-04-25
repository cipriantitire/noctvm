'use client';

import { EventsIcon, FeedIcon, PocketIcon, UserIcon, CogIcon, VenuesIcon, BellIcon, GridIcon, SearchIcon } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

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
  onSearchClick?: () => void;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
  activeCity?: 'bucuresti' | 'constanta';
  pushContent?: boolean;
}

export default function Sidebar({
  activeTab = 'events',
  onTabChange = () => {},
  onSearchClick = () => {},
  onSettingsClick,
  onNotificationsClick,
  pushContent = true,
}: SidebarProps) {
  const { profile, user, isAdmin, isOwner } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const reducedMotion = useReducedMotion();

  const profileLabel = user
    ? (profile?.username || profile?.display_name || 'Profile')
    : 'Log In';

  const labelCls = 'max-w-0 group-hover/sidebar:max-w-[160px] overflow-hidden opacity-0 group-hover/sidebar:opacity-100 translate-y-2 group-hover/sidebar:translate-y-0 transition-[opacity,transform,max-width] duration-200 delay-100 [transition-timing-function:cubic-bezier(0.45,0,0.55,1)] whitespace-nowrap';

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`hidden lg:flex flex-col items-center w-[72px] hover:w-56 group/sidebar h-screen z-40 rounded-r-2xl bg-[rgb(20_20_20_/_0.7)] backdrop-blur-lg backdrop-saturate-150 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] border-r border-white/[0.08] hover:bg-noctvm-black/95 hover:shadow-none hover:border-white/5 hover:rounded-r-xl transition-[width,background-color,box-shadow,border-radius] duration-300 [transition-timing-function:cubic-bezier(0.45,0,0.55,1)] py-6 overflow-hidden ${pushContent ? 'sticky top-0' : 'absolute left-0 top-0'}`}
    >
      {/* Logo */}
      <div className="relative flex items-center justify-center px-4 mb-10 w-full h-10 flex-shrink-0">
        {/* Collapsed: standalone moon mark */}
        <Image
          src="/images/logo.svg"
          alt="NOCTVM"
          width={28}
          height={32}
          className="absolute inset-0 m-auto object-contain opacity-100 group-hover/sidebar:opacity-0 transition-opacity duration-200 [transition-timing-function:cubic-bezier(0.45,0,0.55,1)]"
          priority
        />
        {/* Expanded: full type logo */}
        <Image
          src="/images/typelogo-inside.webp"
          alt="NOCTVM"
          width={148}
          height={32}
          className="absolute inset-0 m-auto object-contain opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 [transition-timing-function:cubic-bezier(0.45,0,0.55,1)]"
          priority
        />
      </div>

      {/* Nav icons - centered when collapsed, left-aligned when expanded */}
      <nav className="flex-1 flex flex-col items-center justify-center w-full space-y-1 px-3">
        {NAV_ITEMS.map(({ icon: Icon, label, tab }) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`w-full flex items-center justify-start gap-4 pl-[10px] pr-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
              activeTab === tab
                ? 'bg-noctvm-violet/10 text-foreground'
                : 'text-noctvm-silver hover:text-foreground hover:bg-noctvm-surface'
            }`}
          >
            <Icon className={`w-6 h-6 flex-shrink-0 ${activeTab === tab ? 'scale-110' : ''}`} />
            <span className={labelCls}>{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom: Profile (Bottom-most) -> Notifications -> Settings -> Dashboard (Top-most of group) */}
      <div className="absolute bottom-6 left-0 right-0 px-3 flex flex-col-reverse gap-1">
        
        {/* Profile (Base Button) */}
        <button
          onClick={() => onTabChange('profile')}
          className={`w-full flex items-center justify-start gap-4 pl-[10px] pr-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 z-20 ${
            activeTab === 'profile'
              ? 'text-foreground group-hover/sidebar:bg-noctvm-violet/10 group-hover/sidebar:ring-1 group-hover/sidebar:ring-noctvm-violet/20 ring-1 ring-transparent'
              : 'bg-noctvm-black text-noctvm-silver hover:text-foreground hover:bg-noctvm-surface'
          }`}
        >
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-400 flex items-center justify-center flex-shrink-0 ring-2 overflow-hidden transition-all duration-200 ${activeTab === 'profile' ? 'ring-noctvm-violet/70 shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'ring-noctvm-border'}`}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-4 h-4 text-foreground" />
            )}
          </div>
          <span className={labelCls + ' truncate'}>{profileLabel}</span>
        </button>

        {/* Animated Stack */}
        <AnimatePresence>
          {isHovered && (
            <motion.div 
              initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0, y: 0 } : { opacity: 0, y: 20 }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.25, ease: [0.45, 0, 0.55, 1] }}
              className="flex flex-col-reverse gap-1 mb-1"
            >
              {/* Notifications */}
              <button
                onClick={onNotificationsClick}
                className="w-full flex items-center justify-start gap-4 pl-[10px] pr-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150 text-noctvm-silver hover:text-foreground hover:bg-noctvm-surface"
              >
                <BellIcon className="w-6 h-6 flex-shrink-0" />
                <span className={labelCls}>Notifications</span>
              </button>

              {/* Search */}
              <button
                onClick={onSearchClick}
                className="w-full flex items-center justify-start gap-4 pl-[10px] pr-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150 text-noctvm-silver hover:text-foreground hover:bg-noctvm-surface"
              >
                <SearchIcon className="w-6 h-6 flex-shrink-0" />
                <span className={labelCls}>Search</span>
              </button>

              {/* Settings */}
              <button
                onClick={onSettingsClick}
                className="w-full flex items-center justify-start gap-4 pl-[10px] pr-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150 text-noctvm-silver hover:text-foreground hover:bg-noctvm-surface"
              >
                <CogIcon className="w-6 h-6 flex-shrink-0" />
                <span className={labelCls}>Settings</span>
              </button>

              {/* Dashboard */}
              {(isAdmin || isOwner) && (
                <Link
                  href="/dashboard"
                  className="w-full flex items-center justify-start gap-4 pl-[10px] pr-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150 text-noctvm-violet hover:bg-noctvm-violet/10"
                >
                  <GridIcon className="w-6 h-6 flex-shrink-0" />
                  <span className={labelCls}>Dashboard</span>
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </aside>
  );
}
