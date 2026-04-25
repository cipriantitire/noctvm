'use client';

import React, { useState } from 'react';
import BottomNav from '@/components/ui/BottomNav';

const navItems = [
  {
    id: 'feed',
    label: 'Feed',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    activeIcon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" /></svg>,
  },
  {
    id: 'venues',
    label: 'Venues',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>,
    activeIcon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>,
  },
  {
    id: 'pocket',
    label: 'Pocket',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>,
    badge: 3,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
    activeIcon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg>,
  },
];

export default function BottomNavPage() {
  const [activeId, setActiveId] = useState('feed');

  const items = navItems.map(item => ({
    ...item,
    isActive: item.id === activeId,
    onClick: () => setActiveId(item.id),
  }));

  return (
    <div className="space-y-10 pb-32">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">BottomNav</h1>
        <p className="text-noctvm-silver">
          Floating pill navigation for mobile. Features animated active indicator,
          badge support, and liquid glass treatment.
        </p>
      </div>

      {/* Live Preview */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Live Preview</h2>
        <p className="text-noctvm-sm text-noctvm-silver/60">
          Click the nav items below to see the active indicator animate.
        </p>
        <div className="relative h-[200px] bg-noctvm-midnight/30 rounded-2xl border border-white/5 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-noctvm-label text-noctvm-silver/30 font-mono uppercase tracking-widest">
            Content Area
          </div>
          <BottomNav items={items} className="!relative !bottom-0 !px-0 !pb-0" />
        </div>
      </section>

      {/* Variants */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Variants</h2>

        <div className="space-y-6">
          <div>
            <p className="text-noctvm-label font-mono text-foreground/50 uppercase tracking-widest mb-3">4 Items with Badge</p>
            <div className="relative h-[100px] bg-noctvm-black rounded-xl border border-white/5">
              <BottomNav items={items} className="!relative !bottom-0 !px-0 !pb-0" />
            </div>
          </div>

          <div>
            <p className="text-noctvm-label font-mono text-foreground/50 uppercase tracking-widest mb-3">3 Items (no badge)</p>
            <div className="relative h-[100px] bg-noctvm-black rounded-xl border border-white/5">
              <BottomNav
                items={items.slice(0, 3).map(item => ({ ...item, badge: undefined }))}
                className="!relative !bottom-0 !px-0 !pb-0"
              />
            </div>
          </div>

          <div>
            <p className="text-noctvm-label font-mono text-foreground/50 uppercase tracking-widest mb-3">5 Items (compact)</p>
            <div className="relative h-[100px] bg-noctvm-black rounded-xl border border-white/5">
              <BottomNav
                items={[
                  ...items,
                  {
                    id: 'settings',
                    label: 'Settings',
                    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                  },
                ].map((item, i) => ({ ...item, isActive: i === 0, onClick: () => {} }))}
                className="!relative !bottom-0 !px-0 !pb-0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Specs */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Specs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-noctvm-sm">
          <div className="p-4 rounded-xl border border-white/5 bg-white/5">
            <p className="text-noctvm-label font-mono text-foreground/40 uppercase tracking-widest mb-1">Height</p>
            <p className="text-foreground">59px fixed</p>
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-white/5">
            <p className="text-noctvm-label font-mono text-foreground/40 uppercase tracking-widest mb-1">Max Width</p>
            <p className="text-foreground">360px</p>
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-white/5">
            <p className="text-noctvm-label font-mono text-foreground/40 uppercase tracking-widest mb-1">Active Indicator</p>
            <p className="text-foreground">Animated layout transition, 0.35s ease-out-quint</p>
          </div>
        </div>
      </section>
    </div>
  );
}
