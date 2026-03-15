'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchData();
  }, [profile, isAdmin]);

  async function fetchData() {
    // Fetch owned venues for the event form
    let venueQuery = supabase.from('venues').select('id, name, owner_id');
    if (!isAdmin && profile?.id) {
      venueQuery = venueQuery.eq('owner_id', profile.id);
    }
    const { data: venues } = await venueQuery;
    if (venues) setOwnedVenues(venues);

    // Fetch recent activity (mocked from actual table updates if we had logs, but let's show real data)
    const { data: events } = await supabase
      .from('events')
      .select('title, venue, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (events) setRecentActivity(events);
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-heading font-extrabold text-white mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Command Center
            </h1>
            <p className="text-noctvm-silver font-medium">
              Welcome back, <span className="text-noctvm-violet">{profile?.display_name || 'Night Owl'}</span>.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 backdrop-blur-md">
              <p className="text-[10px] text-noctvm-silver uppercase font-mono tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-noctvm-emerald animate-pulse"></span>
                <span className="text-sm font-bold text-white uppercase tracking-tighter">{profile?.role}</span>
              </div>
            </div>
          </div>
        </header>

        <AnalyticsPanel />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-white tracking-tight uppercase font-mono">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowEventForm(true)}
                className="flex flex-col items-center justify-center p-6 bg-noctvm-violet/5 border border-noctvm-violet/20 rounded-2xl hover:bg-noctvm-violet/10 hover:border-noctvm-violet/40 transition-all group relative overflow-hidden active:scale-95"
              >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-4xl text-noctvm-violet">📅</span>
                </div>
                <span className="text-2xl mb-3 group-hover:scale-125 transition-transform duration-300">📅</span>
                <span className="text-sm font-bold tracking-tight">ADD EVENT</span>
                <span className="text-[9px] text-noctvm-silver/60 mt-1 uppercase font-mono">Create new nightlife</span>
              </button>

              <button 
                onClick={() => setShowVenueForm(true)}
                className="flex flex-col items-center justify-center p-6 bg-noctvm-emerald/5 border border-noctvm-emerald/20 rounded-2xl hover:bg-noctvm-emerald/10 hover:border-noctvm-emerald/40 transition-all group relative overflow-hidden active:scale-95"
              >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-4xl text-noctvm-emerald">📍</span>
                </div>
                <span className="text-2xl mb-3 group-hover:scale-125 transition-transform duration-300">📍</span>
                <span className="text-sm font-bold tracking-tight">ADD VENUE</span>
                <span className="text-[9px] text-noctvm-silver/60 mt-1 uppercase font-mono">List new location</span>
              </button>

              <button 
                className="flex flex-col items-center justify-center p-6 bg-noctvm-gold/5 border border-noctvm-gold/20 rounded-2xl hover:bg-noctvm-gold/10 hover:border-noctvm-gold/40 transition-all group relative overflow-hidden active:scale-95"
                onClick={() => window.location.href = '/dashboard/events'}
              >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-4xl text-noctvm-gold">✨</span>
                </div>
                <span className="text-2xl mb-3 group-hover:scale-125 transition-transform duration-300">✨</span>
                <span className="text-sm font-bold tracking-tight">PROMOTIONS</span>
                <span className="text-[9px] text-noctvm-silver/60 mt-1 uppercase font-mono">Boost visibility</span>
              </button>

              <button 
                className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group relative overflow-hidden active:scale-95"
                onClick={() => window.location.href = '/dashboard/scrapers'}
              >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="text-4xl text-noctvm-silver">📊</span>
                </div>
                <span className="text-2xl mb-3 group-hover:scale-125 transition-transform duration-300">📊</span>
                <span className="text-sm font-bold tracking-tight">SCRAPERS</span>
                <span className="text-[9px] text-noctvm-silver/60 mt-1 uppercase font-mono">System health</span>
              </button>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-white tracking-tight uppercase font-mono">Recent Activity</h3>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2 frosted-noise divide-y divide-white/5">
              {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-all">
                  <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-noctvm-violet animate-pulse' : 'bg-noctvm-silver/40'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-bold text-white">New Event:</span> {activity.title}
                    </p>
                    <p className="text-[10px] text-noctvm-silver uppercase font-mono mt-0.5">at {activity.venue}</p>
                  </div>
                  <span className="text-[10px] text-noctvm-silver/40 font-mono italic">
                    {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )) : (
                <div className="p-12 text-center text-noctvm-silver italic text-sm">
                  No recent activity found.
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
