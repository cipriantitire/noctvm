import { notFound } from "next/navigation";
import React from 'react';

export default function DesignSystemIntroPage() {
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_ENABLE_DESIGN_SYSTEM !== 'true') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-foreground">
        <p>Design System is currently disabled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div className="p-8 rounded-xl bg-gradient-to-br from-noctvm-violet/20 to-black border border-noctvm-violet/20 shadow-[0_0_50px_rgba(124,58,237,0.1)] relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
        <h1 className="text-5xl font-black text-foreground mb-4 font-heading tracking-widest uppercase relative z-10">
          Component Library
        </h1>
        <p className="text-lg text-noctvm-silver leading-relaxed relative z-10 font-medium">
          The centralized hub for NOCTVM&apos;s Atomic UI Design. Use the sidebar to explore and configure every element mathematically and visually ensuring 100% fidelity across all features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
           { title: 'Tokens & Typography', desc: 'Core foundational variables.', href: '/design-system/tokens' },
           { title: 'Atoms', desc: 'Base building blocks like Avatars and Buttons.', href: '/design-system/avatars' },
           { title: 'Molecules', desc: 'Input fields, Tabs, Dropdowns.', href: '/design-system/inputs' },
           { title: 'Organisms', desc: 'Complex UI like Cards and Modals.', href: '/design-system/cards' },
           { title: 'Social Elements', desc: 'Message Trees, Highlight Rings, Stories.', href: '/design-system/social' }
        ].map(item => (
          <a
            key={item.title}
            href={item.href}
            className="p-6 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-noctvm-violet/40 transition-all hover:-translate-y-1 block group"
          >
            <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-noctvm-violet transition-colors">{item.title}</h3>
            <p className="text-sm text-noctvm-silver/70">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
