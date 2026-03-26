import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'segmented';
  fullWidth?: boolean;
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  fullWidth = false,
  className = ''
}: TabsProps) {
  
  if (variant === 'segmented') {
    return (
      <div className={`flex p-1 bg-noctvm-surface border border-noctvm-border rounded-xl shadow-inner ${fullWidth ? 'w-full' : 'inline-flex'} ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${fullWidth ? 'flex-1' : ''} ${
                isActive ? 'text-white shadow-lg' : 'text-noctvm-silver hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="segmented-active"
                  className="absolute inset-0 bg-noctvm-violet rounded-lg"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'pills') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-noctvm-violet text-white shadow-glow'
                  : 'bg-noctvm-surface text-noctvm-silver border border-noctvm-border hover:border-noctvm-violet/30 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-noctvm-caption px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline variant (Default)
  return (
    <div className={`flex items-center border-b border-noctvm-border ${fullWidth ? 'w-full' : ''} ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center justify-center gap-2 py-4 px-1 font-medium text-sm transition-colors ${fullWidth ? 'flex-1' : 'mr-8'} ${
              isActive ? 'text-white' : 'text-noctvm-silver hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
               <span className={`text-noctvm-caption px-1.5 py-0.5 rounded-full ${isActive ? 'bg-noctvm-violet/20 text-noctvm-violet' : 'bg-white/5 text-noctvm-silver'}`}>
                 {tab.count}
               </span>
            )}
            {isActive && (
              <motion.div
                layoutId="underline-active"
                className="absolute left-0 right-0 bottom-[-1px] h-[2px] bg-noctvm-violet"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
