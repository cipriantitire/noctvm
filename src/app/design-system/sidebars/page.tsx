'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import { GlassPanel } from '@/components/ui';
import { MoonIcon, EventsIcon, FeedIcon, PocketIcon, UserIcon } from '@/components/icons';
import CodePreview from '../CodePreview';

export default function SidebarsShowcasePage() {
  const [activeTab, setActiveTab] = useState('events');

  const mainItems = [
    {
      id: 'events',
      label: 'Events',
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
    },
    {
      id: 'pocket',
      label: 'Pocket',
      icon: <PocketIcon className="w-6 h-6" />,
      isActive: activeTab === 'pocket',
      onClick: () => setActiveTab('pocket'),
    }
  ];

  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-4">Sidebars</h1>
        <p className="text-noctvm-silver text-lg max-w-2xl">
          Expandable standard navigation panels. Sidebars are heavily CSS-driven to ensure fast hover transitions with zero layout reflows on the main content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-semibold text-white">Interactive Playground</h2>
            <div className="relative border border-noctvm-border rounded-2xl overflow-hidden bg-black flex h-[600px]">
               {/* Left: The rendered Sidebar component */}
               <div className="flex-shrink-0 relative z-10 w-[72px] hover:w-56 transition-[width] duration-200">
                 <Sidebar
                   className="h-full !sticky top-0 absolute border-r-0 shadow-[8px_0_24px_rgba(0,0,0,0.5)]"
                   logo={
                     <>
                        <MoonIcon className="w-8 h-8 text-noctvm-violet flex-shrink-0" />
                        <span className="max-w-0 group-hover/sidebar:max-w-[160px] overflow-hidden opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 delay-75 whitespace-nowrap font-heading text-xl font-bold text-glow">
                          BRAND
                        </span>
                     </>
                   }
                   items={mainItems}
                   bottomContent={
                     <div className="w-full">
                       <button className="w-full flex items-center justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-4 px-2 group-hover/sidebar:px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 text-noctvm-silver hover:text-white hover:bg-noctvm-surface">
                         <UserIcon className="w-6 h-6 flex-shrink-0" />
                         <span className="max-w-0 group-hover/sidebar:max-w-[160px] overflow-hidden opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 delay-75 whitespace-nowrap">Profile</span>
                       </button>
                     </div>
                   }
                 />
               </div>

               {/* Right: Mock Page Content Container */}
               <div className="flex-1 bg-noctvm-surface/20 p-8 relative flex items-center justify-center z-0 overflow-hidden">
                 <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2 font-heading">Active Tab: {activeTab}</h3>
                    <p className="text-noctvm-silver">Hover over the sidebar on the left to see rapid CSS transitions.</p>
                 </div>
                 {/* Decorative mock items to show z-indexing overlaps */}
                 <div className="absolute left-10 bottom-10 w-64 h-32 bg-noctvm-violet/5 border border-noctvm-violet/20 rounded-xl" />
               </div>
            </div>

            <CodePreview code={`<Sidebar
  logo={
    <>
      <LogoIcon className="w-8 h-8 text-violet-500" />
      <span className="max-w-0 group-hover/sidebar:max-w-xs overflow-hidden opacity-0 group-hover/sidebar:opacity-100 transition-all font-bold">
        NOCTVM
      </span>
    </>
  }
  items={[
    { id: 'events', label: 'Events', icon: <EventsIcon />, isActive: true },
    { id: 'feed', label: 'Feed', icon: <FeedIcon /> },
  ]}
  bottomContent={
    <button className="flex w-full ..."> <UserIcon /> <span>Profile</span> </button>
  }
/>`} />
          </section>
        </div>

        <div className="space-y-6">
          <GlassPanel className="p-6 sticky top-24">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Technical Notes</h3>
            <ul className="space-y-4 text-sm text-noctvm-silver leading-relaxed list-disc list-inside">
              <li>Sidebar uses <code>w-[72px] hover:w-56 group/sidebar</code> classes to manage states entirely via CSS.</li>
              <li>Inner children labels use <code>max-w-0 group-hover/sidebar:max-w-[160px]</code> trick so they don&apos;t block flex-box space when collapsed.</li>
              <li>This pattern ensures the main page body does NOT experience costly re-flows when standardly positioned.</li>
              <li>If the sidebar is placed above sibling content via <code>absolute</code> or <code>fixed</code>, it floats over nicely.</li>
            </ul>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
