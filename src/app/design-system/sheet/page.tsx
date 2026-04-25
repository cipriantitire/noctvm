'use client';
import React from 'react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui';
import { Button } from '@/components/ui';

export default function SheetPage() {
  return (
    <div className="space-y-12 animate-fade-in pb-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 font-heading uppercase tracking-wider">Sheet</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">Sliding panel from any edge. Replaces custom bottom sheets and side drawers.</p>
      </div>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold border-b border-noctvm-border pb-3 text-noctvm-silver">Variants</h2>
        <div className="flex flex-wrap gap-4 bg-noctvm-surface/30 p-8 rounded-2xl border border-white/5">
          {(['bottom', 'right', 'left', 'top'] as const).map(side => (
            <Sheet key={side}>
              <SheetTrigger asChild>
                <Button variant="secondary" className="capitalize">{side} Sheet</Button>
              </SheetTrigger>
              <SheetContent side={side}>
                <SheetHeader>
                  <SheetTitle className="capitalize">{side} Sheet</SheetTitle>
                  <SheetDescription>This is a {side}-anchored sheet panel.</SheetDescription>
                </SheetHeader>
                <div className="px-4 py-6 flex-1">
                  <p className="text-sm text-noctvm-silver">Content goes here. The sheet handles scroll lock, focus trap, ESC dismiss, and backdrop click automatically.</p>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="primary">Done</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          ))}
        </div>
      </section>
    </div>
  );
}
