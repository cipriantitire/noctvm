'use client';

import React, { useState } from 'react';
import Tabs from '@/components/ui/Tabs';
import { GlassPanel } from '@/components/ui';
import CodePreview from '../CodePreview';
import { SearchIcon, EventsIcon, UserIcon, FeedIcon } from '@/components/icons';

export default function TabsShowcasePage() {
  const [activeTab1, setActiveTab1] = useState('events');
  const [activeTab2, setActiveTab2] = useState('all');
  const [activeTab3, setActiveTab3] = useState('grid');
  
  const [activeVariant, setActiveVariant] = useState<'underline' | 'pills' | 'segmented'>('underline');
  const [fullWidth, setFullWidth] = useState(false);

  const MOCK_TABS = [
    { id: 'events', label: 'Events' },
    { id: 'venues', label: 'Venues', count: 12 },
    { id: 'feed', label: 'Feed' },
  ];

  const MOCK_TABS_WITH_ICONS = [
    { id: 'grid', label: 'Grid', icon: <EventsIcon className="w-4 h-4" /> },
    { id: 'list', label: 'List', icon: <FeedIcon className="w-4 h-4" /> },
    { id: 'map', label: 'Map', icon: <SearchIcon className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-12 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-white mb-4">Tabs</h1>
        <p className="text-noctvm-silver text-lg max-w-2xl">
          Navigation elements for switching between different views or categories. Uses Framer Motion for smooth active state transitions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Playground */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-semibold text-white">Interactive Playground</h2>
            <GlassPanel variant="noise" className="p-8 flex items-center justify-center min-h-[300px]">
              <Tabs 
                tabs={MOCK_TABS_WITH_ICONS}
                activeTab={activeTab3}
                onChange={setActiveTab3}
                variant={activeVariant}
                fullWidth={fullWidth}
              />
            </GlassPanel>
            
            <CodePreview code={`<Tabs 
  tabs={[
    { id: 'grid', label: 'Grid', icon: <GridIcon /> },
    { id: 'list', label: 'List', icon: <ListIcon /> },
    { id: 'map', label: 'Map', icon: <MapIcon /> }
  ]}
  activeTab="${activeTab3}"
  onChange={setActiveTab}
  variant="${activeVariant}"
  fullWidth={${fullWidth}}
/>`} />
          </section>

          {/* Variants Showcase */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-semibold text-white">Variants</h2>
            <div className="space-y-6">
              <GlassPanel className="p-6 space-y-4">
                <h3 className="text-sm font-medium text-noctvm-silver">Underline (Default)</h3>
                <Tabs 
                  tabs={MOCK_TABS}
                  activeTab={activeTab1}
                  onChange={setActiveTab1}
                  variant="underline"
                />
              </GlassPanel>

              <GlassPanel className="p-6 space-y-4">
                <h3 className="text-sm font-medium text-noctvm-silver">Pills</h3>
                <Tabs 
                  tabs={MOCK_TABS}
                  activeTab={activeTab1}
                  onChange={setActiveTab1}
                  variant="pills"
                />
              </GlassPanel>

              <GlassPanel className="p-6 space-y-4">
                <h3 className="text-sm font-medium text-noctvm-silver">Segmented</h3>
                <Tabs 
                  tabs={MOCK_TABS}
                  activeTab={activeTab1}
                  onChange={setActiveTab1}
                  variant="segmented"
                />
              </GlassPanel>
            </div>
          </section>
        </div>

        {/* Controls Sidebar */}
        <div className="space-y-6">
          <GlassPanel className="p-6 sticky top-24">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Playground Controls</h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                 <label className="text-xs font-medium text-noctvm-silver block">Variant</label>
                 <div className="flex gap-2 bg-noctvm-surface p-1 rounded-xl">
                   {['underline', 'pills', 'segmented'].map((v) => (
                     <button
                       key={v}
                       onClick={() => setActiveVariant(v as any)}
                       className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                         activeVariant === v ? 'bg-noctvm-violet text-white' : 'text-noctvm-silver hover:text-white'
                       }`}
                     >
                       {v.charAt(0).toUpperCase() + v.slice(1)}
                     </button>
                   ))}
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-xs font-medium text-noctvm-silver block">Layout</label>
                 <label className="flex items-center gap-3 p-3 rounded-xl bg-noctvm-surface border border-noctvm-border cursor-pointer hover:border-noctvm-violet/30 transition-colors">
                   <input 
                     type="checkbox" 
                     checked={fullWidth}
                     onChange={(e) => setFullWidth(e.target.checked)}
                     className="w-4 h-4 rounded bg-noctvm-black border-noctvm-border text-noctvm-violet focus:ring-noctvm-violet/30"
                   />
                   <span className="text-sm text-white">Full Width</span>
                 </label>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
