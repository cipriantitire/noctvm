'use client';

import React, { useState } from 'react';
import SearchBox from '@/components/ui/SearchBox';
import { GlassPanel } from '@/components/ui';
import CodePreview from '../CodePreview';
import { UserIcon } from '@/components/icons';

export default function SearchBoxShowcasePage() {
  const [query1, setQuery1] = useState('');
  const [query2, setQuery2] = useState('Techno party');
  const [query3, setQuery3] = useState('');
  
  const [placeholder, setPlaceholder] = useState('Search events, venues...');
  const [disabled, setDisabled] = useState(false);
  const [customIcon, setCustomIcon] = useState(false);

  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4">Search Box</h1>
        <p className="text-noctvm-silver text-lg max-w-2xl">
          Configurable search input fields with embedded icons and clear functionality.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Playground */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-semibold text-foreground">Interactive Playground</h2>
            <GlassPanel variant="noise" className="p-8 flex items-center justify-center min-h-[250px]">
              <div className="w-full max-w-md">
                <SearchBox 
                  placeholder={placeholder}
                  value={query1}
                  onChange={(e) => setQuery1(e.target.value)}
                  onClear={() => setQuery1('')}
                  disabled={disabled}
                  icon={customIcon ? <UserIcon className="w-4 h-4" /> : undefined}
                />
              </div>
            </GlassPanel>
            
            <CodePreview code={`<SearchBox 
  placeholder="${placeholder}"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  onClear={() => setQuery('')}${disabled ? '\n  disabled' : ''}${customIcon ? '\n  icon={<UserIcon />}' : ''}
/>`} />
          </section>

          {/* Variants Showcase */}
          <section className="space-y-4">
             <h2 className="text-xl font-heading font-semibold text-foreground">Examples</h2>
             <div className="space-y-6">
                <GlassPanel className="p-6 space-y-4">
                  <h3 className="text-sm font-medium text-noctvm-silver">Standard usage (Empty)</h3>
                  <div className="max-w-md">
                    <SearchBox placeholder="Search..." value={query3} onChange={e => setQuery3(e.target.value)} />
                  </div>
                </GlassPanel>

                <GlassPanel className="p-6 space-y-4">
                  <h3 className="text-sm font-medium text-noctvm-silver">With Value & Clear Button</h3>
                  <div className="max-w-md">
                    <SearchBox 
                      placeholder="Search..." 
                      value={query2} 
                      onChange={e => setQuery2(e.target.value)} 
                      onClear={() => setQuery2('')}
                    />
                  </div>
                </GlassPanel>

                <GlassPanel className="p-6 space-y-4">
                  <h3 className="text-sm font-medium text-noctvm-silver">Disabled State</h3>
                  <div className="max-w-md opacity-60">
                    <SearchBox placeholder="Search disabled..." disabled />
                  </div>
                </GlassPanel>
             </div>
          </section>
        </div>

        {/* Controls Sidebar */}
        <div className="space-y-6">
          <GlassPanel className="p-6 sticky top-24">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-6">Playground Controls</h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                 <label className="text-xs font-medium text-noctvm-silver block">Placeholder</label>
                 <input 
                   type="text" 
                   value={placeholder}
                   onChange={(e) => setPlaceholder(e.target.value)}
                   className="w-full bg-noctvm-black border border-noctvm-border rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:border-noctvm-violet/50"
                 />
              </div>

              <div className="space-y-3">
                 <label className="text-xs font-medium text-noctvm-silver block">Options</label>
                 <div className="space-y-2">
                   <label className="flex items-center gap-3 p-3 rounded-xl bg-noctvm-surface border border-noctvm-border cursor-pointer hover:border-noctvm-violet/30 transition-colors">
                     <input 
                       type="checkbox" 
                       checked={customIcon}
                       onChange={(e) => setCustomIcon(e.target.checked)}
                       className="w-4 h-4 rounded bg-noctvm-black border-noctvm-border text-noctvm-violet focus:ring-noctvm-violet/30"
                     />
                     <span className="text-sm text-foreground">Custom Icon</span>
                   </label>
                   
                   <label className="flex items-center gap-3 p-3 rounded-xl bg-noctvm-surface border border-noctvm-border cursor-pointer hover:border-noctvm-violet/30 transition-colors">
                     <input 
                       type="checkbox" 
                       checked={disabled}
                       onChange={(e) => setDisabled(e.target.checked)}
                       className="w-4 h-4 rounded bg-noctvm-black border-noctvm-border text-noctvm-violet focus:ring-noctvm-violet/30"
                     />
                     <span className="text-sm text-foreground">Disabled</span>
                   </label>
                 </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
