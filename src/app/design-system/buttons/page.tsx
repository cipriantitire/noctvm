'use client';

import React, { useState } from 'react';
import { Button, IconButton } from '@/components/ui';

import CodePreview from '../CodePreview';

export default function ButtonsShowcasePage() {
  const [btnVariant, setBtnVariant] = useState<"primary" | "secondary" | "ghost" | "submit">("primary");
  const [btnSize, setBtnSize] = useState<"sm" | "md" | "lg">("md");
  const [btnDisabled, setBtnDisabled] = useState(false);

  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 heading-syne uppercase tracking-wider">Buttons & Icons</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">
          Core interaction primitives.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">
          Standard Buttons
        </h2>
        <div className="grid md:grid-cols-[250px_1fr] gap-8 bg-noctvm-surface/30 p-6 rounded-2xl border border-white/5">
          {/* Controls */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-noctvm-caption font-mono text-white/40 tracking-widest">VARIANT</div>
              <div className="flex flex-col gap-1">
                {(["primary", "secondary", "ghost", "submit"] as const).map(v => (
                  <label key={v} className="flex items-center gap-2 text-sm cursor-pointer hover:text-white text-noctvm-silver transition-colors">
                    <input type="radio" checked={btnVariant === v} onChange={() => setBtnVariant(v)} className="accent-noctvm-violet" />
                    <span className="capitalize">{v}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-noctvm-caption font-mono text-white/40 tracking-widest">SIZE</div>
              <div className="flex gap-2">
                {(["sm", "md", "lg"] as const).map(s => (
                  <button key={s} onClick={() => setBtnSize(s)} className={`px-3 py-1 text-xs border rounded transition-colors ${btnSize === s ? "border-white/40 text-white" : "border-white/10 text-white/40 hover:border-white/20"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer text-noctvm-silver hover:text-white">
              <input type="checkbox" checked={btnDisabled} onChange={(e) => setBtnDisabled(e.target.checked)} className="accent-noctvm-violet rounded" />
              Disabled State
            </label>
          </div>

          {/* Preview */}
          <div className="flex flex-col justify-center gap-8 pl-0 md:pl-8 md:border-l border-white/10">
            <div className="flex items-center justify-center p-12 bg-black/40 rounded-xl border border-white/5 min-h-[200px] bg-[url('/images/noise.png')] bg-repeat relative">
              <div className="absolute inset-0 bg-gradient-to-br from-noctvm-midnight/50 to-noctvm-black/95 pointer-events-none rounded-xl" />
              <div className="relative z-10">
                <Button variant={btnVariant} size={btnSize} disabled={btnDisabled}>
                  {btnVariant === "submit" ? "Submit Action" : "Interactive Button"}
                </Button>
              </div>
            </div>
            <CodePreview 
              code={`import { Button } from "@/components/ui";\n\n<Button \n  variant="${btnVariant}" \n  size="${btnSize}"${btnDisabled ? '\n  disabled' : ''}\n>\n  Interactive Button\n</Button>`} 
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">
          Icon Buttons
        </h2>
        <div className="p-6 bg-noctvm-surface/50 border border-white/5 rounded-2xl space-y-6">
          <div className="flex items-center gap-4">
            <IconButton size="sm" aria-label="Small"><span className="text-sm">×</span></IconButton>
            <IconButton size="md" aria-label="Medium"><span className="text-lg">×</span></IconButton>
            <IconButton size="lg" aria-label="Large"><span className="text-xl">×</span></IconButton>
          </div>
          <CodePreview code={`<IconButton size="md"><Icon /></IconButton>`} />
        </div>
      </section>
    </div>
  );
}
