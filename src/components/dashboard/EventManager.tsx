'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { NoctEvent, Venue } from '@/lib/types';
import EventForm from './EventForm';
import Image from 'next/image';
import { CheckIcon, XIcon, PlusIcon, EditIcon } from '@/components/icons';

export default function EventManager() {
  const { profile, isAdmin } = useAuth();
  const [events, setEvents] = useState<NoctEvent[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<NoctEvent | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      
      // Fetch Venues first (to know which events we can manage)
      let venueQuery = supabase.from('venues').select('name, id, owner_id');
      if (!isAdmin && profile?.id) {
        venueQuery = venueQuery.eq('owner_id', profile.id);
      }
      const { data: venueData } = await venueQuery;
      if (venueData) setVenues(venueData as any[]);

      // Fetch Events
      let eventQuery = supabase.from('events').select('*');
      if (!isAdmin && venueData && venueData.length > 0) {
        const ownedVenueNames = venueData.map(v => v.name);
        eventQuery = eventQuery.in('venue', ownedVenueNames);
      } else if (!isAdmin) {
        // If owner has no venues, they see no events
        setEvents([]);
        setLoading(false);
        return;
      }

      const { data: eventData } = await eventQuery.order('is_promoted', { ascending: false }).order('date', { ascending: false });
      if (eventData) setEvents(eventData as any[]);
      
      setLoading(false);
    };

    fetchInitialData();
  }, [profile, isAdmin]);

  const refreshData = async () => {
    // Re-fetch events primarily
    let eventQuery = supabase.from('events').select('*');
    if (!isAdmin && venues.length > 0) {
      const ownedVenueNames = venues.map(v => v.name);
      eventQuery = eventQuery.in('venue', ownedVenueNames);
    } else if (!isAdmin) {
      setEvents([]);
      return;
    }
    const { data: eventData } = await eventQuery.order('is_promoted', { ascending: false }).order('date', { ascending: false });
    if (eventData) setEvents(eventData as any[]);
  };

  const handleToggleFeatured = async (event: NoctEvent) => {
    const { error } = await supabase
      .from('events')
      .update({ featured: !event.featured })
      .eq('id', event.id);
    
    if (!error) refreshData();
  };

  const handleTogglePromoted = async (event: NoctEvent) => {
    const { error } = await supabase
      .from('events')
      .update({ is_promoted: !event.is_promoted })
      .eq('id', event.id);
    
    if (!error) refreshData();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-12 h-12 border-4 border-noctvm-violet/20 border-t-noctvm-violet rounded-full animate-spin"></div>
      <p className="text-noctvm-silver font-mono text-xs uppercase tracking-widest animate-pulse">Syncing Event Database...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-3xl font-heading font-black tracking-tighter italic uppercase text-white">Event Streams</h2>
          <p className="text-noctvm-silver text-xs font-mono uppercase tracking-[0.2em] mt-1 opacity-60">Manage your nightlife broadcasts</p>
        </div>
        <button 
          onClick={() => { setEditingEvent(null); setShowForm(true); }}
          className="group flex items-center gap-2 px-6 py-3 bg-noctvm-violet rounded-2xl text-sm font-black uppercase tracking-widest text-white hover:bg-noctvm-violet/80 transition-all shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95"
        >
          <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          Create Event
        </button>
      </div>

      {(showForm || editingEvent) && (
        <div className="animate-fade-in relative z-50">
          <div className="absolute inset-0 bg-noctvm-violet/5 blur-3xl -z-10 rounded-full"></div>
          <EventForm 
            venues={venues}
            initialData={editingEvent || undefined}
            onSuccess={() => { setShowForm(false); setEditingEvent(null); refreshData(); }}
            onCancel={() => { setShowForm(false); setEditingEvent(null); }}
          />
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden frosted-noise shadow-2xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-white font-black font-mono">Channel Information</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-white font-black font-mono">Location</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-white font-black font-mono">Timestamp</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-white font-black font-mono text-right">Sequence Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.map((event, index) => (
                <tr key={event.id || index} className="group hover:bg-noctvm-violet/5 transition-all duration-300">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 group-hover:border-noctvm-violet/30 transition-all shadow-xl">
                        {event.image_url ? (
                          <Image 
                            src={event.image_url} 
                            alt={event.title} 
                            fill 
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                            sizes="56px"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">📷</div>
                        )}
                        {event.is_promoted && (
                          <div className="absolute top-0 right-0 p-1">
                            <div className="w-2 h-2 rounded-full bg-noctvm-emerald shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white tracking-tight text-lg group-hover:text-noctvm-violet transition-colors">
                            {event.title}
                          </span>
                          {event.featured && (
                            <span className="text-[8px] font-black text-noctvm-gold bg-noctvm-gold/10 px-2 py-0.5 rounded-full border border-noctvm-gold/20 tracking-widest uppercase">
                              Prime
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-noctvm-silver/40 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1 h-3 bg-noctvm-violet/20 rounded-full"></span>
                          SOURCE_{event.source?.replace(/\s+/g, '_').toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">@{event.venue}</span>
                      <span className="text-[9px] font-mono text-noctvm-silver/30 uppercase tracking-widest">Active Station</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-black font-mono text-noctvm-silver tracking-tighter">
                        {event.date}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {event.featured && (
                          <div className="w-1.5 h-1.5 rounded-full bg-noctvm-gold shadow-[0_0_6px_rgba(251,191,36,0.6)]" title="Featured"></div>
                        )}
                        {event.is_promoted && (
                          <div className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald shadow-[0_0_6px_rgba(16,185,129,0.6)]" title="Promoted"></div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => handleTogglePromoted(event)}
                        className={`p-3 rounded-2xl transition-all border shadow-inner ${
                          event.is_promoted 
                            ? 'bg-noctvm-emerald/10 text-noctvm-emerald border-noctvm-emerald/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                            : 'bg-white/5 text-noctvm-silver border-white/5 hover:text-noctvm-emerald hover:border-noctvm-emerald/20'
                        }`}
                        title={event.is_promoted ? "Deactivate Promotion" : "Initialize Promotion"}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleToggleFeatured(event)}
                        className={`p-3 rounded-2xl transition-all border shadow-inner ${
                          event.featured 
                            ? 'bg-noctvm-gold/10 text-noctvm-gold border-noctvm-gold/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]' 
                            : 'bg-white/5 text-noctvm-silver border-white/5 hover:text-noctvm-gold hover:border-noctvm-gold/20'
                        }`}
                        title={event.featured ? "Remove Prime Focus" : "Set Prime Focus"}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.482-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setEditingEvent(event)}
                        className="p-3 rounded-2xl bg-white/5 text-noctvm-silver border border-white/5 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-inner"
                        title="Mod Access"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-noctvm-silver/40 italic font-mono uppercase tracking-[0.3em] text-sm">
                    SIGNAL LOST: NO_ACTIVE_EVENTS_FOUND
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
