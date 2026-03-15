'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { NoctEvent, Venue } from '@/lib/types';
import EventForm from './EventForm';
import Image from 'next/image';
import { CheckIcon, XIcon, PlusIcon, EditIcon, SearchIcon } from '@/components/icons';

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

  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-10 h-10 border-4 border-noctvm-violet/20 border-t-noctvm-violet rounded-full animate-spin"></div>
      <p className="text-noctvm-silver font-mono text-[10px] uppercase tracking-widest animate-pulse">Loading Events...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Events</h2>
          <p className="text-noctvm-silver text-[10px] font-mono uppercase tracking-widest mt-1 opacity-60">Manage your nightlife listings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noctvm-silver/40" />
            <input 
              type="text"
              placeholder="Search events or venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:border-noctvm-violet/50 outline-none transition-all w-64"
            />
          </div>
          <button 
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-noctvm-violet rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:bg-noctvm-violet/80 transition-all shadow-lg active:scale-95"
          >
            <PlusIcon className="w-3 h-3" />
            Create Event
          </button>
        </div>
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

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden frosted-noise shadow-xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-noctvm-silver font-bold font-mono">Event Details</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-noctvm-silver font-bold font-mono">Venue</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-noctvm-silver font-bold font-mono">Date</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-noctvm-silver font-bold font-mono text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEvents.map((event, index) => (
                <tr key={event.id || index} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                        {event.image_url ? (
                          <Image 
                            src={event.image_url} 
                            alt={event.title} 
                            fill 
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center text-lg">📷</div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-white tracking-tight text-sm">
                            {event.title}
                          </span>
                          {event.featured && (
                            <span className="text-[8px] font-bold text-noctvm-gold bg-noctvm-gold/10 px-1.5 py-0.5 rounded border border-noctvm-gold/20 tracking-tighter uppercase font-mono">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] font-mono text-noctvm-silver/40 uppercase tracking-widest">
                          {event.source?.replace(/\s+/g, '_').toUpperCase() || 'MANUAL'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">@{event.venue}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-mono text-noctvm-silver tracking-tight">
                      {event.date}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleTogglePromoted(event)}
                        className={`p-2 rounded-xl transition-all ${
                          event.is_promoted 
                            ? 'text-noctvm-emerald bg-noctvm-emerald/10 border border-noctvm-emerald/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                            : 'text-noctvm-silver/40 hover:text-noctvm-emerald hover:bg-white/5'
                        }`}
                        title={event.is_promoted ? "Stop Promoting" : "Promote Event"}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleToggleFeatured(event)}
                        className={`p-2 rounded-xl transition-all ${
                          event.featured 
                            ? 'text-noctvm-gold bg-noctvm-gold/10 border border-noctvm-gold/20 shadow-[0_0_10px_rgba(251,191,36,0.2)]' 
                            : 'text-noctvm-silver/40 hover:text-noctvm-gold hover:bg-white/5'
                        }`}
                        title={event.featured ? "Remove Featured" : "Feature Event"}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.482-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setEditingEvent(event)}
                        className="p-2 rounded-xl text-noctvm-silver/40 hover:text-white hover:bg-white/5 transition-all"
                        title="Edit Event"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-noctvm-silver/40 italic font-mono uppercase tracking-widest text-xs">
                    No active events found
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
