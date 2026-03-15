'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { withAuth } from '@/components/hoc/withAuth';
import AnalyticsPanel from '@/components/dashboard/AnalyticsPanel';

function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <header>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Command Center</h1>
          <p className="text-noctvm-silver">Monitor your performance and manage your content.</p>
        </header>

        <AnalyticsPanel />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 frosted-noise">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center p-4 bg-noctvm-violet/10 border border-noctvm-violet/20 rounded-xl hover:bg-noctvm-violet/20 transition-all group">
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📅</span>
                <span className="text-sm font-medium">Add Event</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-noctvm-emerald/10 border border-noctvm-emerald/20 rounded-xl hover:bg-noctvm-emerald/20 transition-all group">
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📍</span>
                <span className="text-sm font-medium">Add Venue</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-noctvm-gold/10 border border-noctvm-gold/20 rounded-xl hover:bg-noctvm-gold/20 transition-all group">
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">✨</span>
                <span className="text-sm font-medium">Feature Event</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group">
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📊</span>
                <span className="text-sm font-medium">Full Report</span>
              </button>
            </div>
          </section>

          {/* Recent Activity (Placeholder) */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 frosted-noise">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 text-sm text-noctvm-silver py-2 border-b border-white/5 last:border-0">
                  <span className="w-2 h-2 rounded-full bg-noctvm-violet"></span>
                  <p className="flex-1"><span className="text-white">Control Club</span> updated their contact info.</p>
                  <span className="text-[10px] font-mono">2h ago</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DashboardPage, { requireOwner: true });
