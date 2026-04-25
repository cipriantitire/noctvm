import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MoonIcon, UserIcon, CogIcon, GridIcon, SearchIcon, AggregatorIcon, VenuesIcon, EventsIcon } from '@/components/icons';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin } = useAuth();
  const { headerHidden, scrollRef } = useDashboard();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: <GridIcon className="w-5 h-5" /> },
    { label: 'Venues', href: '/dashboard/venues', icon: <VenuesIcon className="w-5 h-5" /> },
    { label: 'Events', href: '/dashboard/events', icon: <EventsIcon className="w-5 h-5" /> },
  ];

  if (isAdmin) {
    navItems.push(
      { label: 'Users', href: '/dashboard/users', icon: <UserIcon className="w-5 h-5" /> },
      { label: 'Scrapers', href: '/dashboard/scrapers', icon: <AggregatorIcon className="w-5 h-5" /> }
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-noctvm-black overflow-hidden font-body text-foreground selection:bg-noctvm-violet/30 selection:text-foreground">
      {/* Dynamic Background Noise/Gradient */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-noctvm-violet/20 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-noctvm-emerald/10 blur-[120px] rounded-full animate-pulse-slow [animation-delay:2s]"></div>
      </div>

      {/* Mobile Top Header - Always Sticky */}
      <header className="lg:hidden sticky top-0 z-50 glass border-b border-noctvm-border px-4 py-3 shadow-lg">
        <div className="grid grid-cols-3 items-center">
          <div className="flex items-center justify-start min-w-0 overflow-hidden" onClick={() => router.push('/dashboard')}>
            <Image
              src="/images/typelogo-first.webp"
              alt="NOCTVM"
              width={200}
              height={48}
              priority
              className="h-6 w-auto max-w-[120px] object-contain sm:max-w-[140px]"
            />
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/')}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-noctvm-silver/70 hover:text-foreground hover:bg-noctvm-violet/20 hover:border-noctvm-violet/30 transition-all flex items-center justify-center"
              title="Return to App"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span className="text-noctvm-caption font-mono text-noctvm-silver uppercase tracking-widest">{profile?.role || 'User'}</span>
          </div>
        </div>
      </header>

      {/* Dashboard Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 border-r border-white/5 bg-noctvm-midnight/40 backdrop-blur-2xl flex-col relative z-20">
        <div className="px-6 py-8 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/dashboard')}>
            <div className="relative">
              <MoonIcon className="w-8 h-8 text-noctvm-violet drop-shadow-[0_0_10px_rgba(139,92,246,0.4)] group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl font-black tracking-tighter leading-none">NOCTVM</span>
              <span className="text-noctvm-micro uppercase font-mono tracking-[0.2em] text-noctvm-silver opacity-50">Dashboard</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar py-4">
          <p className="px-4 text-noctvm-micro uppercase font-mono tracking-widest text-noctvm-silver/40 mb-2">Main Navigation</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
                <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-noctvm-violet text-foreground shadow-lg shadow-noctvm-violet/10'
                    : 'text-noctvm-silver/60 hover:text-foreground hover:bg-white/5'
                }`}
              >
                <span className={`${isActive ? 'text-foreground' : 'group-hover:text-noctvm-violet'} transition-colors duration-200`}>
                  {item.icon}
                </span>
                <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-3 flex items-center gap-3 border border-white/5 group">
            <div className="w-10 h-10 rounded-xl bg-noctvm-violet/10 flex items-center justify-center border border-noctvm-violet/30 overflow-hidden shadow-lg relative flex-shrink-0">
              {profile?.avatar_url ? (
                <Image 
                  src={profile.avatar_url} 
                  alt={profile.display_name || 'User'} 
                  fill 
                  className="object-cover"
                  sizes="40px"
                  priority
                />
              ) : (
                <UserIcon className="w-5 h-5 text-noctvm-violet" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate tracking-tight uppercase text-foreground">{profile?.display_name || 'Admin'}</p>
              <p className="text-noctvm-micro text-noctvm-silver font-mono uppercase tracking-widest">
                {profile?.role || 'User'}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg text-noctvm-silver/40 hover:text-foreground hover:bg-white/5 transition-all"
              title="Return to App"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation - Matching Webapp Style */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-noctvm-border">
        <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
                  isActive ? 'text-foreground' : 'text-noctvm-silver hover:text-foreground'
                }`}
              >
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110 text-foreground' : ''}`}>
                  {React.cloneElement(item.icon as React.ReactElement, { className: "w-6 h-6" })}
                </div>
                <span className={`text-noctvm-caption font-medium ${isActive ? 'text-foreground' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto relative no-scrollbar pb-24 lg:pb-0">
        {/* Subtle Content Grid Overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none"></div>
        
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardContent>{children}</DashboardContent>
    </DashboardProvider>
  );
}
