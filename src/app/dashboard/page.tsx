'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AnalyticsPanel from '@/components/dashboard/AnalyticsPanel';
import VenueForm from '@/components/dashboard/VenueForm';
import EventForm from '@/components/dashboard/EventForm';
import { withAuth } from '@/components/hoc/withAuth';
import { PlusIcon, MapPinIcon, StarIcon, HubIcon } from '@/components/icons';

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

    // Fetch recent activity from the dedicated activity table
    const { data: activityData } = await supabase
      .from('dashboard_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8);
    
    if (activityData) {
      setRecentActivity(activityData);
    }
  }, [profile, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in pb-20">


        <AnalyticsPanel />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-white tracking-tight uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-noctvm-violet"></span>
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
                  <div className="w-12 h-12 rounded-2xl bg-noctvm-violet/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 group-hover:bg-noctvm-violet/40">
                    <PlusIcon className="w-6 h-6 text-noctvm-violet" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase mb-1">Add Event</span>
                  <span className="text-[8px] text-noctvm-silver/40 uppercase tracking-widest">Create nightlife</span>
                </div>
              </button>

              <button 
                onClick={() => setShowVenueForm(true)}
                className="group relative flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-noctvm-emerald/10 hover:border-noctvm-emerald/30 transition-all duration-500 overflow-hidden active:scale-95 shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-noctvm-emerald/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col items-center">
                   <div className="w-12 h-12 rounded-2xl bg-noctvm-emerald/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 group-hover:bg-noctvm-emerald/40">
                    <MapPinIcon className="w-6 h-6 text-noctvm-emerald" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase mb-1">Add Venue</span>
                  <span className="text-[8px] text-noctvm-silver/40 uppercase">List location</span>
                </div>
              </button>

              <button 
                onClick={() => window.location.href = '/dashboard/events'}
                className="group relative flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-noctvm-gold/10 hover:border-noctvm-gold/30 transition-all duration-500 overflow-hidden active:scale-95 shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-noctvm-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-noctvm-gold/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 group-hover:bg-noctvm-gold/40">
                    <StarIcon className="w-6 h-6 text-noctvm-gold" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase mb-1">Promote</span>
                  <span className="text-[8px] text-noctvm-silver/40 uppercase">Boost reach</span>
                </div>
              </button>

              <button 
                onClick={() => window.location.href = '/dashboard/scrapers'}
                className="group relative flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden active:scale-95 shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 group-hover:bg-white/20">
                    <HubIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase mb-1">Automate</span>
                  <span className="text-[8px] text-noctvm-silver/40 uppercase">Run scrapers</span>
                </div>
              </button>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-white tracking-tight uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald"></span>
                Activity Feed
              </h3>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-3 frosted-noise divide-y divide-white/5 shadow-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-noctvm-violet/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              {recentActivity.length > 0 ? recentActivity.map((activity, i) => {
                const colors: Record<string, string> = {
                  event_add: 'bg-noctvm-violet',
                  event_edit: 'bg-blue-400',
                  event_delete: 'bg-noctvm-rose',
                  scrape_run: 'bg-noctvm-emerald',
                  user_signup: 'bg-noctvm-gold',
                  user_edit: 'bg-amber-400',
                  user_delete: 'bg-noctvm-rose',
                  venue_claim: 'bg-purple-400',
                  owner_claim: 'bg-noctvm-rose',
                  user_verify: 'bg-noctvm-emerald',
                  user_unverify: 'bg-noctvm-silver',
                  venue_add: 'bg-noctvm-violet',
                  venue_edit: 'bg-blue-400',
                  venue_delete: 'bg-noctvm-rose',
                };
                const color = colors[activity.type] || 'bg-white/10';
                const typeLabel = activity.type.split('_').join(' ').toUpperCase();
                
                return (
                  <div key={activity.id || i} className="flex items-center gap-5 p-5 hover:bg-white/5 transition-all duration-300 relative z-10 group/item">
                    <div className={`w-2 h-2 rounded-full ${color} ${i === 0 ? 'shadow-[0_0_8px_rgba(139,92,246,0.8)]' : ''}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate group-hover/item:text-noctvm-violet transition-colors">
                        {activity.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-noctvm-violet/10 border border-noctvm-violet/20 rounded-full">
                          <span className="w-1 h-1 rounded-full bg-noctvm-violet animate-pulse"></span>
                          <span className="text-[8px] font-bold text-noctvm-violet uppercase tracking-widest whitespace-nowrap">
                            {activity.user_name || 'System'}
                          </span>
                        </div>
                        <span className="text-[7px] font-black text-noctvm-silver/40 uppercase tracking-tighter ml-1">
                          {typeLabel}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-[10px] text-white/40 font-mono">
                        {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[8px] text-noctvm-silver/20 uppercase font-mono tracking-tighter">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              }) : (
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
