"use client";

import { useState, useEffect } from "react";
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
  
  const typeScale = [
    { name: "Hero", size: "48px", weight: "800", font: "Syne", className: "font-heading text-5xl font-extrabold" },
    { name: "H1", size: "36px", weight: "800", font: "Syne", className: "font-heading text-4xl font-extrabold" },
    { name: "H2", size: "24px", weight: "700", font: "Syne", className: "font-heading text-2xl font-bold" },
    { name: "H3", size: "18px", weight: "600", font: "Syne", className: "font-heading text-lg font-semibold" },
    { name: "Body L", size: "16px", weight: "400", font: "DM Sans", className: "font-body text-base" },
    { name: "Body M", size: "14px", weight: "400", font: "DM Sans", className: "font-body text-sm" },
    { name: "Label", size: "12px", weight: "400", font: "JetBrains Mono", className: "font-mono text-xs" },
    { name: "Tag", size: "10px", weight: "400", font: "JetBrains Mono", className: "font-mono text-noctvm-caption" },
    { name: "Micro", size: "9px", weight: "300", font: "JetBrains Mono", className: "font-mono text-noctvm-micro font-light" }
  ];

  return (
    <div className="min-h-screen bg-noctvm-black text-white p-6 md:p-10 space-y-16 max-w-5xl mx-auto pb-32">
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
              <span className="font-mono text-noctvm-caption tracking-widest text-white/40 w-24 flex-shrink-0 uppercase">{t.name}</span>
              <span className={`${t.className} flex-1 text-white`}>Noaptea își amintește</span>
              <span className="font-mono text-noctvm-caption text-white/30 tracking-wider flex-shrink-0 text-right">{t.size} • {t.weight}</span>
            </div>
          ))}
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
                <div className="text-noctvm-label font-mono text-white/70 capitalize">{name}</div>
                <div className="text-noctvm-micro font-mono text-white/30">{hex}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col gap-2">
          <div className="text-xs font-mono text-white/50 tracking-widest">COLOR RATIO RULE</div>
          <div className="flex h-8 rounded overflow-hidden">
            <div className="flex-[75] bg-noctvm-black" title="75% Void" />
            <div className="flex-[15] bg-[#1A1A1A]" title="15% Ash" />
            <div className="flex-[8] bg-noctvm-violet" title="8% Violet" />
            <div className="flex-[2] bg-[#DB2777]" title="2% Magenta" />
          </div>
          <div className="flex justify-between text-noctvm-micro font-mono text-white/30 px-1">
            <span>75% BASE</span>
            <span>15% MID</span>
            <span>8% ACCENT</span>
            <span>2% SIGNAL</span>
          </div>
        </div>
      </section>



      {/* FIGMA LAB */}
      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-violet">
          ✦ Figma Blend Lab
        </h2>
        <div 
          className="p-8 rounded-2xl border transition-colors duration-500" 
          style={{ 
            borderColor: `rgba(${testVioletRgb}, 0.3)`,
            boxShadow: `0 0 40px rgba(${testVioletRgb}, 0.05)`,
            backgroundColor: 'rgba(5, 5, 5, 1)' 
          }}
        >
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <p className="text-sm text-white/60 leading-relaxed">
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
              <p className="text-noctvm-caption font-mono text-white/30">
                Current NOCTVM Violet is: 124 58 237
              </p>
            </div>
            
            <div 
              className="flex-1 p-6 rounded-xl border flex flex-col justify-center items-center gap-4 transition-all"
              style={{
                borderColor: `rgba(${testVioletRgb}, 0.2)`,
                backgroundColor: `rgba(${testVioletRgb}, 0.05)`
              }}
            >
              <button 
                className="px-6 py-2 rounded-lg font-bold text-sm transition-all"
                style={{
                  backgroundColor: `rgba(${testVioletRgb}, 0.2)`,
                  color: `rgb(${testVioletRgb})`,
                  borderColor: `rgba(${testVioletRgb}, 0.4)`,
                  borderWidth: '1px'
                }}
              >
                Simulated Primary
              </button>
              
              <div 
                className="text-noctvm-caption font-mono tracking-widest uppercase transition-colors"
                style={{ color: `rgb(${testVioletRgb})` }}
              >
                Injected Accent Preview
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOTION */}
      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">
          6. Motion
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
