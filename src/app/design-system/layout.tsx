'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/ui';

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [productionContext, setProductionContext] = useState(false);

  const navGroups = [
    {
      title: 'Overview',
      links: [
        { href: '/design-system', label: 'Introduction' },
        { href: '/design-system/tokens', label: 'Tokens & Typography' },
      ],
    },
    {
      title: 'Atoms',
      categories: [
        { name: 'Buttons', href: '/design-system/buttons' },
        { name: 'Avatars', href: '/design-system/avatars' },
        { name: 'Avatar Group', href: '/design-system/avatar-group' },
        { name: 'Badges', href: '/design-system/badges' },
        { name: 'Chip / Tag', href: '/design-system/chip' },
        { name: 'Divider', href: '/design-system/divider' },
        { name: 'Kbd', href: '/design-system/kbd' },
        { name: 'Spinner', href: '/design-system/spinner' },
      ]
    },
    {
      title: 'Form Controls',
      categories: [
        { name: 'Inputs', href: '/design-system/inputs' },
        { name: 'Calendar', href: '/design-system/calendar' },
        { name: 'Checkbox', href: '/design-system/checkbox' },
        { name: 'Radio Group', href: '/design-system/radio' },
        { name: 'Switch', href: '/design-system/switch' },
        { name: 'Select', href: '/design-system/select' },
        { name: 'Slider', href: '/design-system/slider' },
      ]
    },
    {
      title: 'Molecules',
      categories: [
        { name: 'Bottom Nav', href: '/design-system/bottom-nav' },
        { name: 'Search Box', href: '/design-system/search' },
        { name: 'Tabs', href: '/design-system/tabs' },
        { name: 'Button Group', href: '/design-system/button-group' },
        { name: 'Breadcrumbs', href: '/design-system/breadcrumbs' },
        { name: 'Pagination', href: '/design-system/pagination' },
        { name: 'Progress', href: '/design-system/progress' },
      ]
    },
      {
      title: 'Organisms',
      categories: [
        { name: 'GlassPanel', href: '/design-system/glass-panel' },
        { name: 'Cards & Panels', href: '/design-system/cards' },
        { name: 'Card (Structured)', href: '/design-system/card' },
        { name: 'Modals', href: '/design-system/modals' },
        { name: 'Sidebars', href: '/design-system/sidebars' },
        { name: 'Navbars', href: '/design-system/navbars' },
        { name: 'Table', href: '/design-system/table' },
        { name: 'Listbox', href: '/design-system/listbox' },
      ]
    },
    {
      title: 'Social Elements',
      categories: [
        { name: 'Stories', href: '/design-system/stories' },
        { name: 'Message Trees', href: '/design-system/messages' }
      ]
    },
    {
      title: 'Interactive (New)',
      categories: [
        { name: 'Popover', href: '/design-system/popover' },
        { name: 'Sheet / Drawer', href: '/design-system/sheet' },
        { name: 'Select', href: '/design-system/select' },
        { name: 'Switch', href: '/design-system/switch' },
        { name: 'Tooltip', href: '/design-system/tooltip' },
        { name: 'Dropdown Menu', href: '/design-system/dropdown' },
        { name: 'Accordion', href: '/design-system/accordion' },
        { name: 'Collapsible', href: '/design-system/collapsible' },
      ]
    },
    {
      title: 'Feedback',
      categories: [
        { name: 'Toast', href: '/design-system/toast' },
        { name: 'Alert / Banner', href: '/design-system/alert' },
        { name: 'Skeleton', href: '/design-system/skeleton' },
        { name: 'Empty State', href: '/design-system/empty-state' },
      ]
    },
  ];

  return (
    <ToastProvider>
    <div className="min-h-screen bg-[#050505] text-noctvm-silver flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/5 bg-noctvm-surface/50 h-screen sticky top-0 overflow-y-auto flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold text-foreground font-heading uppercase tracking-wider">
            NOCTVM
          </h1>
          <p className="text-xs text-noctvm-silver/50 font-mono mt-1">Component Library System</p>
        </div>

        <nav className="flex-1 p-4 space-y-8">
          {navGroups.map((group, i) => (
            <div key={i}>
              <h3 className="text-noctvm-caption uppercase font-bold text-noctvm-silver/40 tracking-widest pl-3 mb-2 font-mono">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.categories?.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-noctvm-violet/20 text-foreground border border-noctvm-violet/30 shadow-[0_0_15px_rgba(124,58,237,0.1)]'
                            : 'text-noctvm-silver/70 hover:bg-white/5 hover:text-foreground'
                        }`}
                      >
                        <span className="truncate">{link.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 h-screen overflow-y-auto w-full relative ${
        productionContext
          ? "bg-[url('/images/noise.png')] bg-repeat bg-noctvm-black"
          : "bg-[#050505]"
      }`}>
        {productionContext && (
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-noctvm-midnight/30 via-transparent to-noctvm-violet/5" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.08)_0%,transparent_70%)]" />
          </div>
        )}
        <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          {/* Production Context Toggle */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setProductionContext(!productionContext)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-noctvm-label font-mono uppercase tracking-widest transition-all ${
                productionContext
                  ? 'bg-noctvm-violet/20 border-noctvm-violet/30 text-noctvm-violet'
                  : 'bg-white/5 border-white/10 text-noctvm-silver/50 hover:text-foreground hover:bg-white/10'
              }`}
              title="Toggle app-like background context"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${productionContext ? 'bg-noctvm-violet animate-pulse' : 'bg-noctvm-silver/30'}`} />
              {productionContext ? 'Production Context' : 'Flat Background'}
            </button>
          </div>
          {children}
        </div>
      </main>
    </div>
    </ToastProvider>
  );
}
