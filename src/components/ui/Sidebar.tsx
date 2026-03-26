'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface SidebarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  isActive?: boolean;
  highlightColor?: string; // Optional custom active color class, default is text-white
}

export interface SidebarProps {
  /** Topmost content like a logo */
  logo?: React.ReactNode;
  /** Primary navigation items */
  items: SidebarItem[];
  /** Bottom section content, rendered below navigation */
  bottomContent?: React.ReactNode | ((isHovered: boolean) => React.ReactNode);
  /** Custom class names for the sidebar container */
  className?: string;
}

export default function Sidebar({
  logo,
  items,
  bottomContent,
  className = ''
}: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);

  const labelCls = "max-w-0 group-hover/sidebar:max-w-[160px] overflow-hidden opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 delay-75 whitespace-nowrap";

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`hidden lg:flex flex-col items-center w-[72px] hover:w-56 group/sidebar h-screen sticky top-0 bg-noctvm-black border-r border-noctvm-border transition-[width] duration-200 ease-out py-6 overflow-hidden z-40 ${className}`}
    >
      {/* Top Header / Logo */}
      {logo && (
        <div className="flex items-center justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-3 px-5 mb-10 w-full flex-shrink-0">
          {logo}
        </div>
      )}

      {/* Main Navigation Items */}
      <nav className="flex-1 flex flex-col items-center justify-start w-full space-y-1 px-3 mt-2 overflow-y-auto no-scrollbar pb-6 relative z-10">
        {items.map((item) => {
          const content = (
            <>
              <div className={`flex-shrink-0 transition-transform ${item.isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className={labelCls}>{item.label}</span>
            </>
          );

          const baseClasses = `w-full flex items-center justify-center group-hover/sidebar:justify-start gap-0 group-hover/sidebar:gap-4 px-2 group-hover/sidebar:px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150`;
          
          const activeClasses = item.isActive
            ? `bg-noctvm-violet/10 ${item.highlightColor || 'text-white'}`
            : `text-noctvm-silver hover:text-white hover:bg-noctvm-surface`;

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${baseClasses} ${activeClasses}`}
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
              className={`${baseClasses} ${activeClasses}`}
            >
              {content}
            </button>
          );
        })}
      </nav>

      {/* Bottom Content Area */}
      {bottomContent && (
        <div className="px-3 w-full flex flex-col-reverse gap-1 flex-shrink-0 relative z-20">
          {typeof bottomContent === 'function' ? bottomContent(isHovered) : bottomContent}
        </div>
      )}
    </aside>
  );
}
