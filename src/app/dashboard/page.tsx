'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AnalyticsPanel from '@/components/dashboard/AnalyticsPanel';
import VenueForm from '@/components/dashboard/VenueForm';
import EventForm from '@/components/dashboard/EventForm';
import { withAuth } from '@/components/hoc/withAuth';

function DashboardPage() {
  const { profile, isAdmin } = useAuth();
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [ownedVenues, setOwnedVenues] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    // Fetch owned venues for the event form
    let venueQuery = supabase.from('venues').select('id, name, owner_id');
    if (!isAdmin && profile?.id) {
      venueQuery = venueQuery.eq('owner_id', profile.id);
    }
    
    const { data: venuesData } = await venueQuery;
    if (venuesData) setOwnedVenues(venuesData);

    // Fetch recent activity
    const { data: activityData } = await supabase
      .from('events')
      .select('title, venue:venues(name), created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (activityData) {
      setRecentActivity(activityData.map((d: any) => ({
        title: d.title,
        venue: d.venue?.name || 'Unknown',
        created_at: d.created_at
      })));
    }
  }, [profile, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in pb-20">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Dashboard Overview
            </h1>
          </div>
        </header>

        <AnalyticsPanel />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-white tracking-tight uppercase font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-noctvm-violet"></span>
                Quick Actions
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowEventForm(true)}
                className="group relative flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-noctvm-violet/10 hover:border-noctvm-violet/30 transition-all duration-500 overflow-hidden active:scale-95 shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-noctvm-violet/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-4xl mb-4 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500 ease-out">📅</span>
                  <span className="text-xs font-black tracking-widest uppercase font-mono">Add Event</span>
                  <span className="text-[8px] text-noctvm-silver/40 mt-1 uppercase font-mono letter-spacing-widest">Create nightlife</span>
                </div>
              </button>

              <button 
                onClick={() => setShowVenueForm(true)}
                className="group relative flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-noctvm-emerald/10 hover:border-noctvm-emerald/30 transition-all duration-500 overflow-hidden active:scale-95 shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-noctvm-emerald/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-4xl mb-4 group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-500 ease-out">📍</span>
                  <span className="text-xs font-black tracking-widest uppercase font-mono">Add Venue</span>
                  <span className="text-[8px] text-noctvm-silver/40 mt-1 uppercase font-mono">List location</span>
                </div>
              </button>

              <button 
                onClick={() => window.location.href = '/dashboard/events'}
                className="group relative flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-noctvm-gold/10 hover:border-noctvm-gold/30 transition-all duration-500 overflow-hidden active:scale-95 shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-noctvm-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-500 ease-out">✨</span>
                  <span className="text-xs font-black tracking-widest uppercase font-mono">Promote</span>
                  <span className="text-[8px] text-noctvm-silver/40 mt-1 uppercase font-mono">Boost reach</span>
                </div>
              </button>

              <button 
                onClick={() => window.location.href = '/dashboard/scrapers'}
                className="group relative flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden active:scale-95 shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-500 ease-out">🤖</span>
                  <span className="text-xs font-black tracking-widest uppercase font-mono">Automate</span>
                  <span className="text-[8px] text-noctvm-silver/40 mt-1 uppercase font-mono">Run scrapers</span>
                </div>
              </button>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-white tracking-tight uppercase font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-noctvm-emerald"></span>
                Activity Feed
              </h3>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-3 frosted-noise divide-y divide-white/5 shadow-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-noctvm-violet/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-5 p-5 hover:bg-white/5 transition-all duration-300 relative z-10">
                  <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-noctvm-violet shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'bg-white/10'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate group-hover/item:text-noctvm-violet transition-colors">
                      {activity.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-noctvm-silver uppercase font-mono tracking-widest px-1.5 py-0.5 bg-white/5 rounded border border-white/5">
                        {activity.venue}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-[10px] text-white/40 font-mono">
                      {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[8px] text-noctvm-silver/20 uppercase font-mono tracking-tighter">Event Created</span>
                  </div>
                </div>
              )) : (
                <div className="p-20 text-center text-noctvm-silver/40 italic text-sm font-mono uppercase tracking-widest">
                  No recent activity
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Modals for creation */}
        {showVenueForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <VenueForm 
                onSuccess={() => { setShowVenueForm(false); fetchData(); }} 
                onCancel={() => setShowVenueForm(false)} 
              />
            </div>
          </div>
        )}

        {showEventForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <EventForm 
                venues={ownedVenues}
                onSuccess={() => { setShowEventForm(false); fetchData(); }} 
                onCancel={() => setShowEventForm(false)} 
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DashboardPage, { requireOwner: true });
