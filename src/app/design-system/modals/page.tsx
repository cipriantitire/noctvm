'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button, GlassPanel } from '@/components/ui';
import CodePreview from '../CodePreview';

export default function ModalsShowcasePage() {
  const [isStandardOpen, setIsStandardOpen] = useState(false);
  const [isWideOpen, setIsWideOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  
  const [maxWidth, setMaxWidth] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'>('md');
  const [showCloseButton, setShowCloseButton] = useState(true);

  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4">Modals</h1>
        <p className="text-noctvm-silver text-lg max-w-2xl">
          Overlay windows for focused tasks or important information. Features glassmorphic backdrops, entrance/exit animations, and auto scroll-lock.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Playground */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-semibold text-foreground">Interactive Playground</h2>
            <GlassPanel variant="noise" className="p-8 flex items-center justify-center min-h-[300px]">
              <Button onClick={() => setIsStandardOpen(true)} variant="primary" size="lg">
                Open Configured Modal
              </Button>

              <Modal
                isOpen={isStandardOpen}
                onClose={() => setIsStandardOpen(false)}
                title="Interactive Playground Modal"
                maxWidth={maxWidth}
                showCloseButton={showCloseButton}
                footer={
                  <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setIsStandardOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={() => setIsStandardOpen(false)}>Confirm Action</Button>
                  </div>
                }
              >
                <div className="p-6 space-y-4">
                  <p className="text-noctvm-silver">
                    This is a highly generic modal. It completely handles the entry animations, exit animations, click-away to close, and Escape key bindings automatically.
                  </p>
                  <p className="text-noctvm-silver">
                    You can inject any content into its body or footer.
                  </p>
                </div>
              </Modal>
            </GlassPanel>
            
            <CodePreview code={`<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Interactive Playground Modal"
  maxWidth="${maxWidth}"
  showCloseButton={${showCloseButton}}
  footer={
    <div className="flex justify-end gap-3">
      <Button variant="ghost" onClick={close}>Cancel</Button>
      <Button variant="primary" onClick={close}>Confirm</Button>
    </div>
  }
>
  <div className="p-6">Content goes here...</div>
</Modal>`} />
          </section>

          {/* Variants */}
          <section className="space-y-4">
             <h2 className="text-xl font-heading font-semibold text-foreground">Examples</h2>
             <div className="space-y-6">
                <GlassPanel className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">Wide Screen / Map Modal</h3>
                    <p className="text-sm text-noctvm-silver">Useful for map overlays or large data tables (maxWidth=&quot;full&quot;)</p>
                  </div>
                  <Button variant="ghost" onClick={() => setIsWideOpen(true)}>Open Full Width</Button>
                </GlassPanel>

                <GlassPanel className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">Custom Header-less Modal</h3>
                    <p className="text-sm text-noctvm-silver">Image preview or custom layout without standard borders.</p>
                  </div>
                  <Button variant="ghost" onClick={() => setIsCustomOpen(true)}>Open Custom</Button>
                </GlassPanel>
             </div>

             {/* Hidden Modals that open from the examples */}
             <Modal isOpen={isWideOpen} onClose={() => setIsWideOpen(false)} maxWidth="full" title="Global Venues Map">
                <div className="h-[60vh] bg-noctvm-black flex items-center justify-center">
                  <span className="text-noctvm-silver/50 font-mono text-xl">Map Component Goes Here</span>
                </div>
             </Modal>

             <Modal isOpen={isCustomOpen} onClose={() => setIsCustomOpen(false)} showCloseButton={false} maxWidth="lg">
                <div className="relative">
                  {/* Custom Close Button absolute over image */}
                  <button onClick={() => setIsCustomOpen(false)} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-noctvm-black/50 text-foreground flex items-center justify-center hover:bg-noctvm-black/80 backdrop-blur-md">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                  <div className="h-64 bg-gradient-to-br from-noctvm-violet to-purple-800 flex items-center justify-center">
                    <h2 className="text-3xl font-heading font-black text-foreground mix-blend-overlay">NOCTVM EXCLUSIVE</h2>
                  </div>
                  <div className="p-6 bg-noctvm-midnight text-center">
                     <h3 className="text-xl font-bold text-foreground mb-2">Claim Your Premium Invite</h3>
                     <p className="text-noctvm-silver mb-6">Join the VIP list to get early access to exclusive private events.</p>
                     <Button variant="primary" className="w-full" onClick={() => setIsCustomOpen(false)}>Upgrade Account</Button>
                  </div>
                </div>
             </Modal>
          </section>
        </div>

        {/* Controls Sidebar */}
        <div className="space-y-6">
          <GlassPanel className="p-6 sticky top-24">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-6">Playground Controls</h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                 <label className="text-xs font-medium text-noctvm-silver block">Max Width</label>
                 <select 
                   value={maxWidth}
                   onChange={(e) => setMaxWidth(e.target.value as any)}
                   className="w-full bg-noctvm-black border border-noctvm-border rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:border-noctvm-violet/50"
                 >
                   <option value="sm">Small (sm)</option>
                   <option value="md">Medium (md) - Default</option>
                   <option value="lg">Large (lg)</option>
                   <option value="xl">Extra Large (xl)</option>
                   <option value="2xl">2X Large (2xl)</option>
                   <option value="full">Full Width (90-95%)</option>
                 </select>
              </div>

              <div className="space-y-3">
                 <label className="text-xs font-medium text-noctvm-silver block">Options</label>
                 <label className="flex items-center gap-3 p-3 rounded-xl bg-noctvm-surface border border-noctvm-border cursor-pointer hover:border-noctvm-violet/30 transition-colors">
                   <input 
                     type="checkbox" 
                     checked={showCloseButton}
                     onChange={(e) => setShowCloseButton(e.target.checked)}
                     className="w-4 h-4 rounded bg-noctvm-black border-noctvm-border text-noctvm-violet focus:ring-noctvm-violet/30"
                   />
                   <span className="text-sm text-foreground">Show Close Button (Header)</span>
                 </label>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
