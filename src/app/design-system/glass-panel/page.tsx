'use client';

import { GlassPanel } from '@/components/ui';

export default function GlassPanelPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">GlassPanel</h1>
        <p className="text-noctvm-silver">
          Canonical surface component wrapping frosted-glass CSS utilities.
          Use for cards, modals, nav bars, inputs, and popovers.
        </p>
      </div>

      {/* Card variant */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">variant=&quot;card&quot; (default)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <GlassPanel variant="card" className="p-5 rounded-xl">
            <h3 className="text-foreground font-medium mb-1">Default Card</h3>
            <p className="text-noctvm-sm text-noctvm-silver/70">
              Uses frosted-glass with displacement filter, violet glow, and inset highlight.
            </p>
          </GlassPanel>
          <GlassPanel variant="card" className="p-5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-foreground font-medium">Stats Card</h3>
              <span className="text-noctvm-label font-mono text-noctvm-violet">+12%</span>
            </div>
            <p className="text-noctvm-2xl font-bold text-foreground font-mono">1,247</p>
            <p className="text-noctvm-caption text-noctvm-silver/50 mt-1">Events this month</p>
          </GlassPanel>
        </div>
      </section>

      {/* Popover variant */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">variant=&quot;popover&quot;</h2>
        <div className="max-w-md">
          <GlassPanel variant="popover" className="p-4 rounded-xl">
            <p className="text-noctvm-sm text-foreground/80">
              Subtle glass for dropdowns, tooltips, and secondary surfaces.
              Less blur, no violet glow.
            </p>
          </GlassPanel>
        </div>
      </section>

      {/* Modal variant */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">variant=&quot;modal&quot;</h2>
        <div className="max-w-lg">
          <GlassPanel variant="modal" className="p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">Modal Surface</h3>
            <p className="text-noctvm-sm text-noctvm-silver/70 mb-4">
              Lighter blur to avoid nested blur accumulation. Includes frosted-noise overlay for texture.
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-noctvm-violet text-foreground text-noctvm-sm font-medium">
                Confirm
              </button>
              <button className="px-4 py-2 rounded-lg border border-white/10 text-noctvm-silver text-noctvm-sm font-medium hover:bg-white/5">
                Cancel
              </button>
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* Nav variant */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">variant=&quot;nav&quot;</h2>
        <div className="max-w-2xl">
          <GlassPanel variant="nav" className="px-4 py-3 rounded-xl flex items-center gap-4">
            <span className="text-foreground font-medium text-noctvm-sm">Logo</span>
            <nav className="flex gap-3">
              <span className="text-noctvm-sm text-noctvm-silver/70">Feed</span>
              <span className="text-noctvm-sm text-foreground">Venues</span>
              <span className="text-noctvm-sm text-noctvm-silver/70">Pocket</span>
            </nav>
          </GlassPanel>
        </div>
      </section>

      {/* Input variant */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">variant=&quot;input&quot;</h2>
        <div className="max-w-md">
          <GlassPanel variant="input" className="px-4 py-3 rounded-xl flex items-center gap-3">
            <svg className="w-4 h-4 text-noctvm-silver/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-noctvm-sm text-noctvm-silver/50">Search events, venues...</span>
          </GlassPanel>
        </div>
      </section>

      {/* Button variant */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">variant=&quot;button&quot;</h2>
        <div className="flex gap-3">
          <GlassPanel variant="button" className="px-5 py-2.5 rounded-lg text-noctvm-sm font-medium text-foreground">
            glass-button
          </GlassPanel>
        </div>
      </section>

      {/* Comparison table */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-noctvm-silver uppercase tracking-widest">Variant Map</h2>
        <div className="max-w-2xl border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-noctvm-sm">
            <thead className="bg-white/5 text-noctvm-label font-mono uppercase tracking-widest text-noctvm-silver/50">
              <tr>
                <th className="px-4 py-3 text-left">Variant</th>
                <th className="px-4 py-3 text-left">CSS Class</th>
                <th className="px-4 py-3 text-left">Use For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="px-4 py-3 text-foreground font-medium">card</td>
                <td className="px-4 py-3 text-noctvm-silver/70 font-mono">frosted-glass</td>
                <td className="px-4 py-3 text-noctvm-silver/70">Cards, dropdowns, primary containers</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground font-medium">popover</td>
                <td className="px-4 py-3 text-noctvm-silver/70 font-mono">frosted-glass-subtle</td>
                <td className="px-4 py-3 text-noctvm-silver/70">Secondary cards, list items</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground font-medium">modal</td>
                <td className="px-4 py-3 text-noctvm-silver/70 font-mono">frosted-glass-modal + frosted-noise</td>
                <td className="px-4 py-3 text-noctvm-silver/70">Dialogs, sheets, bottom drawers</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground font-medium">nav</td>
                <td className="px-4 py-3 text-noctvm-silver/70 font-mono">frosted-glass-header</td>
                <td className="px-4 py-3 text-noctvm-silver/70">Sticky search bars, top nav</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground font-medium">input</td>
                <td className="px-4 py-3 text-noctvm-silver/70 font-mono">frosted-glass</td>
                <td className="px-4 py-3 text-noctvm-silver/70">Search fields, form inputs</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground font-medium">button</td>
                <td className="px-4 py-3 text-noctvm-silver/70 font-mono">glass-button</td>
                <td className="px-4 py-3 text-noctvm-silver/70">CTAs on dark backgrounds</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
