'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
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

const BAR_GAP = 8;
const BAR_PADDING = 4;
const ACTIVE_OVERLAP = 10;

export default function BottomNav({ items, className = '' }: BottomNavProps) {
  const activeIndex = items.findIndex((item) => item.isActive);
  const hasActiveItem = activeIndex >= 0;
  const reducedMotion = useReducedMotion();
  const itemCount = Math.max(items.length, 1);
  const slotWidth = `calc((100% - ${((itemCount - 1) * BAR_GAP) + (BAR_PADDING * 2)}px) / ${itemCount})`;
  const cardStyle = { ['--slot-width' as string]: slotWidth } as React.CSSProperties;
  const glassSurfaceStyle: React.CSSProperties = {
    backgroundColor: 'rgba(5, 6, 10, 0.64)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  };

  const getTabGeometry = (index: number) => {
    const hasLeftNeighbor = index > 0;
    const hasRightNeighbor = index < itemCount - 1;

    return {
      left: `calc(${BAR_PADDING}px + (${index} * (var(--slot-width) + ${BAR_GAP}px)) - ${hasLeftNeighbor ? ACTIVE_OVERLAP : 0}px)`,
      width: `calc(var(--slot-width) + ${(hasLeftNeighbor ? ACTIVE_OVERLAP : 0) + (hasRightNeighbor ? ACTIVE_OVERLAP : 0)}px)`,
    };
  };

  return (
    <nav
      id="bottom-floating-nav"
      className={`fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom)] pointer-events-none ${className}`}
      aria-label="Primary navigation"
    >
      <div className="relative isolate w-full max-w-[360px] h-[59px] pointer-events-auto">
        <div
          className="liquid-glass-card liquid-glass-nav cursor-default relative h-full overflow-hidden rounded-full border border-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.5)]"
          style={{ ...glassSurfaceStyle, ...cardStyle }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_50%_0%,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_20%,rgba(255,255,255,0)_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.015)_18%,rgba(0,0,0,0.18)_100%)] pointer-events-none" />

          {hasActiveItem && (
            <motion.div
              layout
              initial={false}
              className="absolute top-[3px] bottom-[3px] z-0 rounded-full border border-noctvm-violet/20 bg-noctvm-surface/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_20px_rgba(0,0,0,0.2),0_0_18px_rgba(124,58,237,0.1)] backdrop-blur-md pointer-events-none"
              style={getTabGeometry(activeIndex)}
              aria-hidden="true"
              transition={reducedMotion ? { duration: 0 } : {
                duration: 0.35,
                ease: [0.23, 1, 0.32, 1],
              }}
            />
          )}

          <div className="absolute inset-0 z-10 flex items-center gap-2 px-1 py-1">
            {items.map((item, index) => {
              const isActive = Boolean(item.isActive);
              const iconNode = isActive && item.activeIcon ? item.activeIcon : item.icon;
              const activeTintClass = 'text-noctvm-violet';
              const tabGeometry = getTabGeometry(index);
              const content = (
                <div
                  className={`relative z-10 flex h-full w-full flex-col items-center justify-center gap-1 text-center transition-[color,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive
                      ? `${activeTintClass} drop-shadow-[0_0_4px_rgba(124,58,237,0.12)]`
                      : 'text-noctvm-silver/70 hover:text-foreground'
                  }`}
                >
                  <div
                    className={`relative z-10 flex h-6 w-6 items-center justify-center transition-[color,filter] duration-300 ${
                      isActive ? activeTintClass : 'text-current'
                    }`}
                  >
                    {iconNode}
                    {item.badge !== undefined && (
                      <div className="absolute -right-1.5 -top-1.5">
                        <Badge
                          variant="custom"
                          className="flex h-4 min-w-[16px] items-center justify-center rounded-full border border-noctvm-black bg-noctvm-violet px-1 py-0 text-noctvm-caption text-foreground"
                        >
                          {item.badge}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <span
                    className={`relative z-10 max-w-full truncate text-noctvm-sm leading-none tracking-[0.02em] font-medium transition-colors duration-300 ${
                      isActive ? activeTintClass : 'text-current group-hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );

              const activeControlClassName =
                'group absolute top-[2px] bottom-[2px] z-20 flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-noctvm-violet/50';

              if (item.href) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={activeControlClassName}
                    onClick={item.onClick}
                    aria-current={isActive ? 'page' : undefined}
                    style={tabGeometry}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className={activeControlClassName}
                  aria-current={isActive ? 'page' : undefined}
                  style={tabGeometry}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
