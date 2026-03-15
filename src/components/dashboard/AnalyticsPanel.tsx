'use client';

import React from 'react';

export default function AnalyticsPanel() {
  const stats = [
    { label: 'Total Views', value: '12,482', change: '+12.5%', trend: 'up' },
    { label: 'Event Saves', value: '843', change: '+5.2%', trend: 'up' },
    { label: 'Followers', value: '2,105', change: '-2.1%', trend: 'down' },
    { label: 'Avg. Rating', value: '4.8', change: '0.0', trend: 'neutral' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
      {stats.map((stat, index) => (
        <div 
          key={stat.label} 
          className="bg-white/5 border border-white/10 rounded-2xl p-6 frosted-noise hover:border-noctvm-violet/30 transition-all group"
        >
          <p className="text-noctvm-silver text-sm mb-2">{stat.label}</p>
          <div className="flex items-end justify-between">
            <h4 className="text-3xl font-heading font-bold text-white group-hover:text-glow transition-all">
              {stat.value}
            </h4>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
              stat.trend === 'up' ? 'text-noctvm-emerald bg-noctvm-emerald/10' :
              stat.trend === 'down' ? 'text-red-400 bg-red-400/10' :
              'text-noctvm-silver bg-white/5'
            }`}>
              {stat.change}
            </span>
          </div>
          
          {/* Simple Chart Placeholder (Custom CSS) */}
          <div className="mt-4 h-12 flex items-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
            {Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={i} 
                className="flex-1 bg-noctvm-violet/40 rounded-t-sm group-hover:bg-noctvm-violet/60 transition-colors"
                style={{ height: `${Math.random() * 100}%` }}
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
