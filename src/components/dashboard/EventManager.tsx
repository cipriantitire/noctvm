'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { NoctEvent, Venue } from '@/lib/types';
import EventForm from './EventForm';
import Image from 'next/image';
import { CheckIcon, XIcon, PlusIcon, EditIcon, SearchIcon, GridIcon, MapPinIcon, CalendarIcon, UsersIcon, TrashIcon } from '@/components/icons';

import { useDashboard } from '@/contexts/DashboardContext';

export default function EventManager() {
  const { profile, isAdmin } = useAuth();
  const { headerHidden } = useDashboard();
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

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
      {/* Title removed per request */}


      <div className={`sticky top-[-4px] lg:top-0 z-30 lg:mt-0 mt-2 transition-transform duration-300 ease-in-out frosted-noise bg-noctvm-black/70 backdrop-blur-3xl rounded-2xl border border-noctvm-violet/15 p-3 shadow-xl flex flex-col sm:flex-row items-center gap-3 mx-2 ${headerHidden ? '-translate-y-[210%]' : 'translate-y-0'}`}>
        <div className="relative flex-1 w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noctvm-silver/40" />
          <input 
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:border-noctvm-violet/50 outline-none transition-all w-full font-mono uppercase tracking-widest"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Layout Toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 h-[42px]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-noctvm-violet text-white shadow-lg shadow-noctvm-violet/20' : 'text-noctvm-silver/40 hover:text-noctvm-silver'}`}
              title="Grid View"
            >
              <GridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-noctvm-violet text-white shadow-lg shadow-noctvm-violet/20' : 'text-noctvm-silver/40 hover:text-noctvm-silver'}`}
              title="List View"
            >
              <div className="w-4 h-4 flex flex-col justify-between py-0.5 px-0.5">
                <div className="h-[2px] w-full bg-current rounded-full"></div>
                <div className="h-[2px] w-full bg-current rounded-full"></div>
                <div className="h-[2px] w-full bg-current rounded-full"></div>
              </div>
            </button>
          </div>

          <button 
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 h-[42px] bg-noctvm-violet rounded-xl text-[10px] font-bold uppercase tracking-wider text-white hover:bg-noctvm-violet/80 transition-all shadow-lg shadow-noctvm-violet/20 active:scale-95 whitespace-nowrap"
          >
            <PlusIcon className="w-3.5 h-3.5" />
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

      <div className={`mt-12 pb-20 px-2 min-h-screen ${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'flex flex-col gap-3'
      }`}>
        {filteredEvents.map((event, index) => (
          <div 
            key={event.id || index} 
            className={`group relative bg-white/5 border border-white/10 frosted-noise hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 shadow-xl overflow-hidden flex ${
              viewMode === 'grid' ? 'flex-col h-full rounded-[2rem] p-5' : 'flex-row items-center gap-4 rounded-2xl p-4'
            }`}
          >
            {/* Image Section */}
            <div className={`relative flex-shrink-0 overflow-hidden border border-white/10 shadow-2xl group-hover:scale-[1.02] transition-transform duration-500 bg-noctvm-midnight ${
              viewMode === 'grid' ? 'w-full aspect-square rounded-[1.5rem] mb-5' : 'w-20 h-20 rounded-xl'
            }`}>
              {event.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={event.image_url} 
                  alt={event.title} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center text-3xl">📷</div>
              )}
              {event.is_promoted && (
                <div className={`absolute top-2 right-2 bg-noctvm-emerald/90 backdrop-blur-md text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-glow-sm ${
                  viewMode === 'grid' ? 'text-[9px]' : 'text-[7px]'
                }`}>
                  Promoted
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
              <div className={`flex ${viewMode === 'grid' ? 'flex-col h-full' : 'flex-row items-center justify-between gap-4'}`}>
                <div className="min-w-0 flex-1">
                  <h3 className={`font-bold text-white tracking-tight group-hover:text-noctvm-violet transition-colors truncate ${
                    viewMode === 'grid' ? 'text-base line-clamp-2 leading-tight mb-1' : 'text-sm mb-0.5'
                  }`}>
                    {event.title}
                  </h3>
                  
                  <div className={`flex flex-wrap gap-x-4 gap-y-1 ${viewMode === 'grid' ? 'mb-6' : ''}`}>
                    <div className="flex items-center gap-1.5">
                      <MapPinIcon className="w-3 h-3 text-noctvm-violet/60" />
                      <span className="text-[10px] font-bold text-white/70 truncate">@{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3 h-3 text-noctvm-emerald/60" />
                      <span className="text-[10px] font-mono text-noctvm-silver tracking-tight">{event.date}</span>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'mt-auto pt-4 border-t border-white/5 justify-between' : ''}`}>
                  <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald animate-pulse"></span>
                    <span className="text-[7px] font-mono text-noctvm-silver uppercase tracking-widest hidden sm:inline">Active</span>
                  </div>

                  <div className="flex gap-1.5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePromote(event.id, !!event.is_promoted); }}
                      className={`p-2 rounded-lg transition-all ${
                        event.is_promoted 
                          ? 'text-noctvm-emerald bg-noctvm-emerald/10 border border-noctvm-emerald/20 shadow-glow-sm' 
                          : 'text-noctvm-silver/40 hover:text-white hover:bg-white/10 border border-white/5'
                      }`}
                      title={event.is_promoted ? "Stop Promoting" : "Promote Event"}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingEvent(event); }}
                      className="p-2 rounded-lg text-noctvm-silver/40 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
                      title="Edit Event"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this event?')) {
                          supabase.from('events').delete().eq('id', event.id).then(() => refreshData());
                        }
                      }}
                      className="p-2 rounded-lg text-noctvm-silver/40 hover:text-noctvm-rose hover:bg-noctvm-rose/5 border border-white/5 transition-all"
                      title="Delete Event"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
