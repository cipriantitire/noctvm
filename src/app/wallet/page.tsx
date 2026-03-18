'use client';

import React from 'react';
import WalletPage from '@/components/WalletPage';

export default function WalletRoute() {
  return (
    <main className="min-h-screen bg-noctvm-midnight pt-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <WalletPage />
      </div>
    </main>
  );
}
