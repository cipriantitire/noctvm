'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from './Badge';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  href?: string;
  badge?: string | number;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  className?: string;
}

export default function BottomNav({ items, className = '' }: BottomNavProps) {
  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 glass border-t border-noctvm-border ${className}`}>
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const content = (
            <div className="flex flex-col items-center gap-0.5 relative">
              <div className={`relative transition-transform ${item.isActive ? 'scale-110 text-white' : 'text-noctvm-silver group-hover:text-white'}`}>
                {item.isActive && item.activeIcon ? item.activeIcon : item.icon}
                
                {/* Optional Badge */}
                {item.badge !== undefined && (
                   <div className="absolute -top-1 -right-2">
                     <Badge variant="custom" className="bg-noctvm-violet text-white text-noctvm-caption px-1 py-0 border border-noctvm-black min-w-[16px] flex items-center justify-center h-4 rounded-full">
                       {item.badge}
                     </Badge>
                   </div>
                )}
              </div>
              <span className={`text-noctvm-caption font-medium truncate max-w-[56px] ${item.isActive ? 'text-white' : 'text-noctvm-silver group-hover:text-white'}`}>
                {item.label}
              </span>
            </div>
          );

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group flex-1 flex justify-center items-center py-1.5 rounded-lg active:bg-white/5 transition-colors"
                onClick={item.onClick}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className="group flex-1 flex justify-center items-center py-1.5 rounded-lg active:bg-white/5 transition-colors"
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
