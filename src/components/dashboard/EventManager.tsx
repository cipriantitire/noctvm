'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { NoctEvent, Venue } from '@/lib/types';
import EventForm from './EventForm';

export default function EventManager() {
  const { profile, isAdmin } = useAuth();
  const [events, setEvents] = useState<NoctEvent[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<NoctEvent | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [profile, isAdmin]);

  async function fetchInitialData() {
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

    const { data: eventData } = await eventQuery.order('date', { ascending: false });
    if (eventData) setEvents(eventData as any[]);
    
    setLoading(false);
  }

  const handleToggleFeatured = async (event: NoctEvent) => {
    const { error } = await supabase
      .from('events')
      .update({ featured: !event.featured })
      .eq('id', event.id);
    
    if (!error) fetchInitialData();
  };

  if (loading) return <div className="p-8 text-center text-noctvm-silver">Loading events...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold">Manage Events</h2>
        <button 
          onClick={() => { setEditingEvent(null); setShowForm(true); }}
          className="px-4 py-2 bg-noctvm-violet rounded-xl text-sm font-semibold hover:bg-noctvm-violet/80 transition-all"
        >
          Add Event
        </button>
      </div>

      {(showForm || editingEvent) && (
        <div className="animate-fade-in">
          <EventForm 
            venues={venues}
            initialData={editingEvent || undefined}
            onSuccess={() => { setShowForm(false); setEditingEvent(null); fetchInitialData(); }}
            onCancel={() => { setShowForm(false); setEditingEvent(null); }}
          />
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden frosted-noise">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-noctvm-silver font-mono">
              <th className="px-6 py-4">Event</th>
              <th className="px-6 py-4">Venue</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {events.map((event, index) => (
              <tr key={event.id || index} className="group hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={event.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                    <div>
                      <div className="flex items-center gap-1.5 font-medium">
                        {event.title}
                        {event.featured && (
                          <span className="text-[10px] bg-noctvm-gold/10 text-noctvm-gold px-1.5 py-0.5 rounded border border-noctvm-gold/20">
                            FEATURED
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-noctvm-silver uppercase">{event.source}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-noctvm-silver">
                  {event.venue}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-noctvm-silver">
                  {event.date}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleToggleFeatured(event)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-noctvm-silver hover:text-noctvm-gold transition-all"
                      title="Toggle Featured"
                    >
                      ⭐
                    </button>
                    <button 
                      onClick={() => setEditingEvent(event)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-noctvm-silver hover:text-white transition-all"
                      title="Edit Event"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-noctvm-silver italic">
                  No events found. Add your first event!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
