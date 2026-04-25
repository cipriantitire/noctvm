"use client";

import { useState, useEffect, useRef } from "react";
import {
  Badge,
  Button,
  Field,
  GlassPanel,
  IconButton,
  Input,
} from "@/components/ui";

import CodePreview from './CodePreview';

export default function DesignSystemContent() {
  // Panel State
  const [panel, setPanel] = useState<"default" | "modal" | "subtle" | "noise">("default");
  
  // Button State
  const [btnVariant, setBtnVariant] = useState<"primary" | "secondary" | "ghost" | "submit">("primary");
  const [btnSize, setBtnSize] = useState<"sm" | "md" | "lg">("md");
  const [btnDisabled, setBtnDisabled] = useState(false);

  // Figma Lab State
  const [testVioletRgb, setTestVioletRgb] = useState("124 58 237"); // default noctvm-violet-rgb
  const figmaLabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!figmaLabRef.current) return;
    figmaLabRef.current.style.setProperty("--figma-violet-rgb", testVioletRgb);
  }, [testVioletRgb]);
  
  const typeScale = [
    { name: "Hero", size: "48px", weight: "800", font: "FreshID", className: "font-heading text-5xl font-extrabold", token: "text-5xl" },
    { name: "H1", size: "36px", weight: "800", font: "FreshID", className: "font-heading text-4xl font-extrabold", token: "text-4xl" },
    { name: "H2", size: "24px", weight: "700", font: "FreshID", className: "font-heading text-2xl font-bold", token: "text-2xl" },
    { name: "H3", size: "18px", weight: "600", font: "FreshID", className: "font-heading text-lg font-semibold", token: "text-lg" },
    { name: "Body L", size: "16px", weight: "400", font: "Satoshi", className: "font-body text-base", token: "text-base" },
    { name: "Body M", size: "14px", weight: "400", font: "Satoshi", className: "font-body text-sm", token: "text-sm" },
    { name: "NOCTVM 2XL", size: "22px", weight: "700", font: "FreshID", className: "font-heading text-noctvm-2xl font-bold", token: "text-noctvm-2xl" },
    { name: "NOCTVM XL", size: "20px", weight: "700", font: "FreshID", className: "font-heading text-noctvm-xl font-bold", token: "text-noctvm-xl" },
    { name: "NOCTVM Base", size: "13px", weight: "500", font: "Satoshi", className: "font-body text-noctvm-base font-medium", token: "text-noctvm-base" },
    { name: "NOCTVM SM", size: "12px", weight: "400", font: "Satoshi", className: "font-body text-noctvm-sm", token: "text-noctvm-sm" },
    { name: "NOCTVM Label", size: "11px", weight: "500", font: "JetBrains Mono", className: "font-mono text-noctvm-label uppercase tracking-widest", token: "text-noctvm-label" },
    { name: "NOCTVM Caption", size: "10px", weight: "400", font: "JetBrains Mono", className: "font-mono text-noctvm-caption uppercase tracking-widest", token: "text-noctvm-caption" },
    { name: "NOCTVM Micro", size: "9px", weight: "300", font: "JetBrains Mono", className: "font-mono text-noctvm-micro font-light uppercase tracking-widest", token: "text-noctvm-micro" },
    { name: "NOCTVM XS", size: "8px", weight: "300", font: "JetBrains Mono", className: "font-mono text-noctvm-xs font-light uppercase tracking-widest", token: "text-noctvm-xs" }
  ];

  return (
    <div className="min-h-screen bg-noctvm-black text-foreground p-6 md:p-10 space-y-16 max-w-5xl mx-auto pb-32">
      <header className="space-y-4 pb-8 border-b border-white/10">
        <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-noctvm-caption font-mono tracking-widest text-noctvm-silver mb-2">
          BRAND SYSTEM v3.0
        </div>
        <h1 className="font-heading text-4xl font-bold tracking-tight">NOCTVM primitives</h1>
        <p className="text-base text-noctvm-silver/80 max-w-2xl leading-relaxed">
          Interactive playground for NOCTVM tokens and UI primitives. Edit <code className="font-mono text-xs text-noctvm-violet bg-noctvm-violet/10 px-1 py-0.5 rounded">src/styles/design-tokens.css</code> to tune colors and glass effects globally.
        </p>
      </header>

      {/* TYPOGRAPHY */}
      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">
          1. Typography
        </h2>
        <div className="grid gap-4 bg-noctvm-surface/50 border border-white/5 rounded-2xl p-6">
          {typeScale.map((t, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-baseline justify-between py-3 border-b border-white/5 last:border-0 gap-2">
              <span className="font-mono text-noctvm-caption tracking-widest text-foreground/40 w-28 flex-shrink-0 uppercase">{t.name}</span>
              <span className={`${t.className} flex-1 text-foreground`}>Noaptea își amintește</span>
              <span className="font-mono text-noctvm-caption text-foreground/30 tracking-wider flex-shrink-0 text-right">{t.token} • {t.size}</span>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-white/5">
          <div className="text-noctvm-label font-mono text-foreground/50 tracking-widest mb-2">TOKEN GUIDE</div>
          <p className="text-sm text-foreground/60">
            <strong className="text-foreground">Tailwind defaults</strong> (text-5xl, text-base, text-sm) are used for major headings and body text.
            <strong className="text-foreground"> NOCTVM tokens</strong> (text-noctvm-*) are used for UI chrome: labels, captions, metadata, stats, and fine-grained hierarchy.
            Never use arbitrary values like <code className="font-mono text-noctvm-violet">text-[13px]</code>. Add a token if the scale is missing.
          </p>
        </div>
      </section>

      {/* SWATCHES */}
      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">
          2. Color Context
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {(
            [
              ["black", "bg-noctvm-black", "#050505"],
              ["midnight", "bg-noctvm-midnight", "#1A0A2E"],
              ["violet", "bg-noctvm-violet", "#7C3AED"],
              ["gold", "bg-noctvm-gold", "#D4A843"],
              ["silver", "bg-noctvm-silver", "#9CA3AF"],
              ["emerald", "bg-noctvm-emerald", "#10B981"],
              ["surface", "bg-noctvm-surface", "#0A0A0A"],
              ["border", "bg-noctvm-border", "#1A1A1A"],
            ] as const
          ).map(([name, cls, hex]) => (
            <div key={name} className="flex flex-col gap-2 group">
              <div
                className={`w-full aspect-square rounded-xl border border-white/10 ${cls} transition-transform group-hover:scale-105 group-hover:shadow-glow-pulse`}
              />
              <div>
                <div className="text-noctvm-label font-mono text-foreground/70 capitalize">{name}</div>
                <div className="text-noctvm-micro font-mono text-foreground/30">{hex}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col gap-2">
          <div className="text-xs font-mono text-foreground/50 tracking-widest">COLOR RATIO RULE</div>
          <div className="flex h-8 rounded overflow-hidden">
            <div className="flex-[75] bg-noctvm-black" title="75% Void" />
            <div className="flex-[15] bg-[#1A1A1A]" title="15% Ash" />
            <div className="flex-[8] bg-noctvm-violet" title="8% Violet" />
            <div className="flex-[2] bg-[#DB2777]" title="2% Magenta" />
          </div>
          <div className="flex justify-between text-noctvm-micro font-mono text-foreground/30 px-1">
            <span>75% BASE</span>
            <span>15% MID</span>
            <span>8% ACCENT</span>
            <span>2% SIGNAL</span>
          </div>
        </div>
      </section>



      {/* SURFACES */}
      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">
          3. Surfaces
        </h2>
        <p className="text-sm text-foreground/60 max-w-3xl">
          NOCTVM uses two surface systems side-by-side: <strong className="text-foreground">CSS utility classes</strong> (legacy, widely used in the app) and the <strong className="text-foreground">GlassPanel component</strong> (design-system canonical). They render identically. GlassPanel is a thin wrapper around the classes.
        </p>

        <div className="grid gap-4">
          {/* frosted-glass */}
          <div className="flex flex-col md:flex-row gap-4 items-start p-5 rounded-2xl border border-white/5 bg-white/5">
            <div className="w-full md:w-48 flex-shrink-0">
              <div className="text-noctvm-label font-mono text-foreground/70 tracking-widest mb-1">frosted-glass</div>
              <div className="text-noctvm-caption font-mono text-foreground/30">Default glass surface</div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="frosted-glass p-4 rounded-xl">
                <span className="text-sm text-foreground/80">This is a frosted-glass surface</span>
              </div>
              <div className="text-noctvm-caption font-mono text-foreground/30">
                Use for: cards, dropdowns, input fields, primary containers. Has displacement filter, violet glow, and inset highlight.
              </div>
            </div>
          </div>

          {/* frosted-glass-subtle */}
          <div className="flex flex-col md:flex-row gap-4 items-start p-5 rounded-2xl border border-white/5 bg-white/5">
            <div className="w-full md:w-48 flex-shrink-0">
              <div className="text-noctvm-label font-mono text-foreground/70 tracking-widest mb-1">frosted-glass-subtle</div>
              <div className="text-noctvm-caption font-mono text-foreground/30">Reduced saturation</div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="frosted-glass-subtle p-4 rounded-xl">
                <span className="text-sm text-foreground/80">This is a subtle glass surface</span>
              </div>
              <div className="text-noctvm-caption font-mono text-foreground/30">
                Use for: secondary cards, popovers, list items. Less blur, no violet glow.
              </div>
            </div>
          </div>

          {/* frosted-glass-modal */}
          <div className="flex flex-col md:flex-row gap-4 items-start p-5 rounded-2xl border border-white/5 bg-white/5">
            <div className="w-full md:w-48 flex-shrink-0">
              <div className="text-noctvm-label font-mono text-foreground/70 tracking-widest mb-1">frosted-glass-modal</div>
              <div className="text-noctvm-caption font-mono text-foreground/30">Nested context</div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="frosted-glass-modal p-4 rounded-xl">
                <span className="text-sm text-foreground/80">This is a modal glass surface</span>
              </div>
              <div className="text-noctvm-caption font-mono text-foreground/30">
                Use for: modals, sheets, dialogs. Lighter blur to avoid nested blur accumulation. Add <code className="text-noctvm-violet">frosted-noise</code> for sticky headers.
              </div>
            </div>
          </div>

          {/* frosted-glass-header */}
          <div className="flex flex-col md:flex-row gap-4 items-start p-5 rounded-2xl border border-white/5 bg-white/5">
            <div className="w-full md:w-48 flex-shrink-0">
              <div className="text-noctvm-label font-mono text-foreground/70 tracking-widest mb-1">frosted-glass-header</div>
              <div className="text-noctvm-caption font-mono text-foreground/30">Sticky nav bars</div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="frosted-glass-header p-4 rounded-xl">
                <span className="text-sm text-foreground/80">This is a header glass surface</span>
              </div>
              <div className="text-noctvm-caption font-mono text-foreground/30">
                Use for: sticky search bars, top navigation. Higher opacity base, no border radius.
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/5 bg-white/5">
          <div className="text-noctvm-label font-mono text-foreground/50 tracking-widest mb-3">GLASS PANEL COMPONENT</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-noctvm-caption font-mono">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-foreground/60">{`GlassPanel variant="card"`}</span>
              <span className="text-foreground/30">→ frosted-glass</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-foreground/60">{`GlassPanel variant="popover"`}</span>
              <span className="text-foreground/30">→ frosted-glass-subtle</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-foreground/60">{`GlassPanel variant="modal"`}</span>
              <span className="text-foreground/30">→ frosted-glass-modal + frosted-noise</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-foreground/60">{`GlassPanel variant="nav"`}</span>
              <span className="text-foreground/30">→ frosted-glass-header</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-foreground/60">{`GlassPanel variant="input"`}</span>
              <span className="text-foreground/30">→ frosted-glass</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-foreground/60">{`GlassPanel variant="button"`}</span>
              <span className="text-foreground/30">→ glass-button</span>
            </div>
          </div>
          <p className="text-noctvm-caption text-foreground/30 mt-3">
            Rule of thumb: use <code className="text-noctvm-violet">&lt;GlassPanel&gt;</code> for new components; keep existing <code className="text-noctvm-violet">className=&quot;frosted-glass&quot;</code> usage as-is. Do not mass-migrate unless a component is being rebuilt.
          </p>
        </div>
      </section>

      {/* FIGMA LAB */}
      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-violet">
          ✦ Figma Blend Lab
        </h2>
        <div
          ref={figmaLabRef}
          className="figma-lab-shell p-8 rounded-2xl border transition-colors duration-500"
        >
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <p className="text-sm text-foreground/60 leading-relaxed">
                Testing a new accent color from the Community files? Paste the RGB value below to inject it into the local scope of this box.
              </p>
              <Field id="figma-rgb" label="Test Accent RGB">
                <Input 
                  id="figma-rgb" 
                  value={testVioletRgb} 
                  onChange={(e) => setTestVioletRgb(e.target.value)} 
                  placeholder="e.g. 16 185 129"
                />
              </Field>
              <p className="text-noctvm-caption font-mono text-foreground/30">
                Current NOCTVM Violet is: 124 58 237
              </p>
            </div>
            
            <div className="figma-lab-surface flex-1 p-6 rounded-xl border flex flex-col justify-center items-center gap-4 transition-all">
              <button className="figma-lab-button px-6 py-2 rounded-lg font-bold text-sm transition-all">
                Simulated Primary
              </button>
              
              <div className="figma-lab-preview-text text-noctvm-caption font-mono tracking-widest uppercase transition-colors">
                Injected Accent Preview
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOTION */}
      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">
          5. Motion
        </h2>
        <div className="flex flex-wrap gap-4">
          <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 animate-fade-in-up font-mono text-xs">
            animate-fade-in-up
          </div>
          <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 animate-scale-in font-mono text-xs">
            animate-scale-in
          </div>
          <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 animate-slide-in-up font-mono text-xs">
            animate-slide-in-up
          </div>
          <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 animate-micro-pop font-mono text-xs">
            animate-micro-pop
          </div>
        </div>
      </section>
    </div>
  );
}
