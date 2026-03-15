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

  const handlePromote = async (id: string, currentlyPromoted: boolean) => {
    const { error } = await supabase
      .from('events')
      .update({ is_promoted: !currentlyPromoted })
      .eq('id', id);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">Events</h2>
          <p className="text-noctvm-silver text-[9px] md:text-[10px] font-mono uppercase tracking-widest mt-1 opacity-60">Manage your nightlife listings</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noctvm-silver/40" />
            <input 
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:border-noctvm-violet/50 outline-none transition-all w-full sm:w-48 md:w-64"
            />
          </div>
          <button 
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-noctvm-violet rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider text-white hover:bg-noctvm-violet/80 transition-all shadow-lg active:scale-95 whitespace-nowrap"
          >
            <PlusIcon className="w-3 h-3" />
            Create Event
          </button>
        </div>
      </div>

      {(showForm || editingEvent) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto no-scrollbar">
          <div className="w-full max-w-4xl my-auto">
            <EventForm 
              venues={venues}
              initialData={editingEvent || undefined}
              onSuccess={() => { setShowForm(false); setEditingEvent(null); refreshData(); }}
              onCancel={() => { setShowForm(false); setEditingEvent(null); }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 px-2 mt-4">
        {filteredEvents.map((event, index) => (
          <div 
            key={event.id || index} 
            className="group relative bg-white/5 border border-white/10 rounded-[2rem] p-5 frosted-noise hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 shadow-xl overflow-hidden flex flex-col h-full"
          >
            {/* Top Image Section */}
            <div className="relative w-full aspect-square rounded-[1.5rem] overflow-hidden border border-white/10 mb-5 shadow-2xl group-hover:scale-[1.02] transition-transform duration-500">
              {event.image_url ? (
                <Image 
                  src={event.image_url} 
                  alt={event.title} 
                  fill 
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center text-3xl">📷</div>
              )}
              {/* Promotion Badge */}
              {event.is_promoted && (
                <div className="absolute top-3 right-3 bg-noctvm-emerald/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-glow-sm">
                  Promoted
                </div>
              )}
              {/* Featured Badge */}
              {event.featured && (
                <div className="absolute top-3 left-3 bg-noctvm-gold/90 backdrop-blur-md text-noctvm-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Featured
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-white tracking-tight text-base leading-tight group-hover:text-noctvm-violet transition-colors line-clamp-2">
                  {event.title}
                </h3>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs">🏢</div>
                  <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">@{event.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs">📅</div>
                  <span className="text-xs font-mono text-noctvm-silver tracking-tight">{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs">🔗</div>
                  <span className="text-[9px] font-mono text-noctvm-silver/40 uppercase tracking-widest">{event.source || 'MANUAL'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-white/5">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePromote(event.id, !!event.is_promoted)}
                    className={`p-2.5 rounded-xl transition-all ${
                      event.is_promoted 
                        ? 'text-noctvm-emerald bg-noctvm-emerald/10 border border-noctvm-emerald/20 shadow-glow-sm' 
                        : 'text-noctvm-silver/40 hover:text-white hover:bg-white/10 border border-white/5'
                    }`}
                    title={event.is_promoted ? "Stop Promoting" : "Promote Event"}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setEditingEvent(event)}
                    className="p-2.5 rounded-xl text-noctvm-silver/40 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
                    title="Edit Event"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                </div>
                
                 <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald animate-pulse"></span>
                    <span className="text-[8px] font-mono text-noctvm-silver uppercase tracking-widest">Active</span>
                 </div>
              </div>
            </div>
          </div>
        ))}
        {filteredEvents.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-noctvm-silver/40 italic font-mono uppercase tracking-widest text-xs">No active events found</p>
          </div>
        )}
      </div>
    </div>
  );
}
