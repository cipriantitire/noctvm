'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MoonIcon, UserIcon, CogIcon } from '@/components/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut, isAdmin } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: <ChartBarIcon className="w-5 h-5" /> },
    { label: 'Venues', href: '/dashboard/venues', icon: <VenueIcon className="w-5 h-5" /> },
    { label: 'Events', href: '/dashboard/events', icon: <TicketIcon className="w-5 h-5" /> },
  ];

  if (isAdmin) {
    navItems.push(
      { label: 'Users', href: '/dashboard/users', icon: <UserIcon className="w-5 h-5" /> },
      { label: 'Scrapers', href: '/dashboard/scrapers', icon: <CpuIcon className="w-5 h-5" /> }
    );
  }

  return (
    <div className="flex h-screen bg-noctvm-black overflow-hidden font-sans text-white">
      {/* Dashboard Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-noctvm-midnight/50 backdrop-blur-xl flex flex-col pt-6">
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MoonIcon className="w-8 h-8 text-noctvm-violet drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
            <span className="font-heading text-xl font-bold tracking-tight">COMMAND</span>
          </div>
          <Link 
            href="/"
            className="p-2 rounded-lg bg-white/5 text-noctvm-silver hover:text-white hover:bg-white/10 transition-all border border-white/5"
            title="Exit to App"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-noctvm-violet/20 text-noctvm-violet border border-noctvm-violet/30'
                    : 'text-noctvm-silver hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`${isActive ? 'text-noctvm-violet' : 'group-hover:text-noctvm-violet'} transition-colors`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-noctvm-violet/20 flex items-center justify-center border border-noctvm-violet/30">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-noctvm-violet" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.display_name || 'Admin'}</p>
              <p className="text-[10px] text-noctvm-silver uppercase tracking-wider font-mono">
                {profile?.role || 'User'}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg text-noctvm-silver hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.05)_0%,transparent_50%)]">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

// Icons for the dashboard sidebar
function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function VenueIcon({ className }: { className?: string }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21V10.75m0 0l7.71-4.15a.75.75 0 011.04.685V18.75a.75.75 0 01-.75.75H2.25a.75.75 0 01-.75-.75V7.285a.75.75 0 011.04-.685L10.25 10.75m3.25 0V21m-3.25-10.25V21m0-10.25l3.25 0m-3.25 0V10.75" />
    </svg>
  );
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  );
}

function CpuIcon({ className }: { className?: string }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5m-15 7.5H3m18 0h-1.5m-15-7.5A2.25 2.25 0 003 12.75v3.75c0 .621.504 1.125 1.125 1.125h3.75A2.25 2.25 0 0010.125 15.375v-3.75A2.25 2.25 0 007.875 9.375m1.5-6.375h1.5M12 3v1.5m3.75-1.5v1.5M12 21v-1.5m0-16.5V3m0 18v-1.5m3.75 1.5v-1.5m-7.5 1.5v-1.5M21 12h-1.5m-15 0H3m18 0h-1.5" />
    </svg>
  );
}
