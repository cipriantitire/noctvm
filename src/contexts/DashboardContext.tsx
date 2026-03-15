'use client';

import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { useHeadroom } from '@/hooks/useHeadroom';

interface DashboardContextType {
  headerHidden: boolean;
  scrollRef: React.RefObject<HTMLElement>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const scrollRef = useRef<HTMLElement>(null);
  const headerHidden = useHeadroom(scrollRef as React.RefObject<HTMLElement | null>);

  return (
    <DashboardContext.Provider value={{ headerHidden, scrollRef: scrollRef as React.RefObject<HTMLElement> }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
