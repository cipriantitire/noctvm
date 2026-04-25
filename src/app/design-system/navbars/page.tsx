'use client';

import React, { useState } from 'react';
import BottomNav from '@/components/ui/BottomNav';
import { GlassPanel } from '@/components/ui';
import { EventsIcon, FeedIcon, PocketIcon, SettingsIcon, UserIcon, BellIcon } from '@/components/icons';
import CodePreview from '../CodePreview';

export default function NavbarsShowcasePage() {
  const [activeTab, setActiveTab] = useState('events');

  const navItems = [
    {
      id: 'events',
      label: 'Explore',
      icon: <EventsIcon className="w-6 h-6" />,
      isActive: activeTab === 'events',
      onClick: () => setActiveTab('events'),
    },
    {
      id: 'feed',
      label: 'Feed',
      icon: <FeedIcon className="w-6 h-6" />,
      isActive: activeTab === 'feed',
      onClick: () => setActiveTab('feed'),
      badge: 3
    },
    {
      id: 'pocket',
      label: 'Tickets',
      icon: <PocketIcon className="w-6 h-6" />,
      isActive: activeTab === 'pocket',
      onClick: () => setActiveTab('pocket'),
    },
    {
      id: 'notifications',
      label: 'Alerts',
      icon: <BellIcon className="w-6 h-6" />,
      isActive: activeTab === 'notifications',
      onClick: () => setActiveTab('notifications'),
      badge: '9+'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <UserIcon className="w-6 h-6" />,
      isActive: activeTab === 'profile',
      onClick: () => setActiveTab('profile'),
    }
  ];

  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4">Navbars</h1>
        <p className="text-noctvm-silver text-lg max-w-2xl">
          Mobile-first navigation bars. Includes generic support for active states, badges, and safe area inset paddings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-semibold text-foreground">Interactive Playground</h2>
            <div className="relative border border-noctvm-border rounded-3xl overflow-hidden bg-noctvm-black flex flex-col justify-end h-[600px] shadow-2xl w-full max-w-[400px] mx-auto">
               
               {/* Mock Mobile Screen Content */}
               <div className="flex-1 p-6 relative flex flex-col items-center justify-center overflow-hidden">
                 <div className="w-full text-center space-y-4">
                    <h3 className="text-2xl font-bold text-foreground mb-2 font-heading">Active: {activeTab}</h3>
                    <p className="text-noctvm-silver">This mimics a true mobile screen layout.</p>
                 </div>
                 
                 {/* Decorative background blur */}
                 <div className="absolute inset-0 bg-gradient-to-b from-noctvm-violet/5 to-transparent flex items-end">
                    <div className="w-full h-1/2 bg-gradient-to-t from-black to-transparent" />
                 </div>
               </div>

               {/* Left: The rendered BottomNav component overrides absolute styling for preview */}
               <BottomNav 
                 items={navItems} 
                 className="!absolute" /* Force to remain within the mock mobile bounding box instead of locking to the real window port */
               />
            </div>

            <CodePreview code={`<BottomNav
  items={[
    { 
      id: 'events', 
      label: 'Explore', 
      icon: <EventsIcon />, 
      isActive: activeTab === 'events' 
    },
    { 
      id: 'feed', 
      label: 'Feed', 
      icon: <FeedIcon />, 
      isActive: activeTab === 'feed',
      badge: 3 // Renders a small red badge
    },
  ]}
/>`} />
          </section>
        </div>

        <div className="space-y-6">
          <GlassPanel className="p-6 sticky top-24">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-6">Technical Notes</h3>
            <ul className="space-y-4 text-sm text-noctvm-silver leading-relaxed list-disc list-inside">
              <li>By default, BottomNav is <code>fixed</code> to the window bottom.</li>
              <li>Includes <code>pb-[env(safe-area-inset-bottom)]</code> specifically for iOS home button clearances.</li>
              <li>Supports an optional <code>badge</code> property for unread counts or alerts.</li>
            </ul>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
