'use client';

import React from 'react';
import DesignSystemContent from '../DesignSystemContent';

export default function TokensPage() {
  return (
    <div className="space-y-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 font-heading uppercase tracking-wider">Foundation & Tokens</h1>
        <p className="text-noctvm-silver/70 max-w-2xl">
          Core design system principles, typography scales, color palettes, and interactive Figma lab for testing core primitives.
        </p>
      </div>

      <DesignSystemContent />
    </div>
  );
}
