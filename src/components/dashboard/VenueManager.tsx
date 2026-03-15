'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Venue } from '@/lib/types';
import VerifiedBadge from '@/components/VerifiedBadge';
import VenueForm from './VenueForm';
import ClaimModal from './ClaimModal';

export default function VenueManager() {
  const { profile, isAdmin } = useAuth();
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVenue, setEditingVenue] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [claimingVenue, setClaimingVenue] = useState<any | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'popularity' | 'events'>('name');

  useEffect(() => {
    fetchVenues();
  }, [profile, isAdmin, sortBy]);

  async function fetchVenues() {
    setLoading(true);
    
    // We fetch venue names + event counts if possible
    // For now, let's fetch basic venues and sorting happens here or in query
    let query = supabase.from('venues').select('*');
    
    if (!isAdmin && profile?.id) {
      query = query.eq('owner_id', profile.id);
    }

    if (sortBy === 'name') query = query.order('name');
    else if (sortBy === 'popularity') query = query.order('view_count', { ascending: false });

    const { data, error } = await query;
    let venuesData = data || [];

    if (sortBy === 'events') {
      // Manual sort for events count for now or complex query
      // Let's just fetch everything and sort
      const { data: events } = await supabase.from('events').select('venue');
      const counts: Record<string, number> = {};
      events?.forEach(e => {
        counts[e.venue] = (counts[e.venue] || 0) + 1;
      });
      venuesData = venuesData.map(v => ({ ...v, event_count: counts[v.name] || 0 }));
      venuesData.sort((a, b) => b.event_count - a.event_count);
    }

    if (venuesData) setVenues(venuesData as any[]);
    setLoading(false);
  }

  const handleToggleVerified = async (venue: Venue) => {
    const { error } = await supabase
      .from('venues')
      .update({ is_verified: !venue.is_verified, badge: !venue.is_verified ? 'gold' : 'none' })
      .eq('id', venue.id);
    
    if (!error) fetchVenues();
  };

  if (loading) return <div className="p-8 text-center text-noctvm-silver">Loading venues...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-heading font-bold">Manage Venues</h2>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1">
            <span className="text-[10px] text-noctvm-silver font-mono uppercase tracking-widest">Sort:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer"
            >
              <option value="name">NAME</option>
              <option value="popularity">POPULARITY</option>
              <option value="events">EVENTS COUNT</option>
            </select>
          </div>
        </div>
        <button 
          onClick={() => { setEditingVenue(null); setShowForm(true); }}
          className="px-4 py-2 bg-noctvm-violet rounded-xl text-sm font-semibold hover:bg-noctvm-violet/80 transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)]"
        >
          Add Venue
        </button>
      </div>

      {(showForm || editingVenue) && (
        <div className="animate-fade-in">
          <VenueForm 
            initialData={editingVenue || undefined}
            onSuccess={() => { setShowForm(false); setEditingVenue(null); fetchVenues(); }}
            onCancel={() => { setShowForm(false); setEditingVenue(null); }}
          />
        </div>
      )}

      {claimingVenue && (
        <ClaimModal 
          venue={claimingVenue}
          onSuccess={() => { setClaimingVenue(null); fetchVenues(); }}
          onCancel={() => setClaimingVenue(null)}
        />
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden frosted-noise">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-noctvm-silver font-mono">
              <th className="px-6 py-4">Venue</th>
              <th className="px-6 py-4">City</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {venues.map((venue) => (
              <tr key={venue.id} className="group hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg border border-white/10">
                      📍
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-medium">
                        {venue.name}
                        {venue.badge !== 'none' && <VerifiedBadge type={venue.badge} size="sm" />}
                      </div>
                      <p className="text-xs text-noctvm-silver">{venue.address}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-noctvm-silver">
                  {venue.city}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {venue.is_verified ? (
                      <span className="w-fit px-2 py-0.5 rounded-full bg-noctvm-emerald/10 text-noctvm-emerald text-[10px] font-bold border border-noctvm-emerald/20">
                        VERIFIED
                      </span>
                    ) : (
                      <span className="w-fit px-2 py-0.5 rounded-full bg-white/10 text-noctvm-silver text-[10px] font-bold border border-white/20">
                        PENDING
                      </span>
                    )}
                    {venue.owner_id && (
                      <span className="text-[9px] text-white/40 font-mono">OWNED</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!venue.owner_id && (
                      <button 
                        onClick={() => setClaimingVenue(venue)}
                        className="px-3 py-1 rounded-lg bg-noctvm-violet/20 text-noctvm-violet text-[10px] font-bold border border-noctvm-violet/30 hover:bg-noctvm-violet/30 transition-all shadow-[0_0_10px_rgba(139,92,246,0.1)]"
                      >
                        CLAIM VENUE
                      </button>
                    )}
                    <button 
                      onClick={() => handleToggleVerified(venue)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-noctvm-silver hover:text-noctvm-gold transition-all"
                      title="Toggle Verification"
                    >
                      ✨
                    </button>
                    <button 
                      onClick={() => setEditingVenue(venue)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-noctvm-silver hover:text-white transition-all"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
