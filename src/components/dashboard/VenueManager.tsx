import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Venue } from '@/lib/types';
import VerifiedBadge from '@/components/VerifiedBadge';
import VenueForm from './VenueForm';
import ClaimModal from './ClaimModal';
import { PlusIcon, EditIcon, CheckIcon } from '@/components/icons';

export default function VenueManager() {
  const { profile, isAdmin } = useAuth();
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVenue, setEditingVenue] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [claimingVenue, setClaimingVenue] = useState<any | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'popularity' | 'events'>('name');

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    
    let query = supabase.from('venues').select('*');
    
    if (!isAdmin && profile?.id) {
      query = query.eq('owner_id', profile.id);
    }

    if (sortBy === 'name') query = query.order('name');
    else if (sortBy === 'popularity') query = query.order('view_count', { ascending: false });

    const { data } = await query;
    let venuesData = data || [];

    if (sortBy === 'events') {
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
  }, [profile, isAdmin, sortBy]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handleToggleVerified = async (venue: Venue) => {
    const { error } = await supabase
      .from('venues')
      .update({ is_verified: !venue.is_verified, badge: !venue.is_verified ? 'gold' : 'none' })
      .eq('id', venue.id);
    
    if (!error) fetchVenues();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-12 h-12 border-4 border-noctvm-violet/20 border-t-noctvm-violet rounded-full animate-spin"></div>
      <p className="text-noctvm-silver font-mono text-xs uppercase tracking-widest animate-pulse">Scanning Venue Signal...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div>
            <h2 className="text-3xl font-heading font-black tracking-tighter italic uppercase text-white">Station Management</h2>
            <p className="text-noctvm-silver text-xs font-mono uppercase tracking-[0.2em] mt-1 opacity-60">Control your broadcast locations</p>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-1.5 backdrop-blur-xl">
            <span className="text-[10px] text-noctvm-silver font-mono uppercase tracking-widest opacity-40">Frequency:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-black uppercase tracking-tighter text-noctvm-violet focus:outline-none cursor-pointer appearance-none pr-4"
              title="Sort Venues"
            >
              <option value="name" className="bg-noctvm-black">ALPHABETICAL</option>
              <option value="popularity" className="bg-noctvm-black">POPULARITY</option>
              <option value="events" className="bg-noctvm-black">EVENT_FEED_DENSITY</option>
            </select>
            <div className="w-1.5 h-1.5 rounded-full bg-noctvm-violet shadow-[0_0_8px_rgba(139,92,246,0.6)] animate-pulse"></div>
          </div>
        </div>
        <button 
          onClick={() => { setEditingVenue(null); setShowForm(true); }}
          className="group flex items-center gap-2 px-6 py-3 bg-noctvm-emerald rounded-2xl text-sm font-black uppercase tracking-widest text-white hover:bg-noctvm-emerald/80 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
        >
          <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          Add Station
        </button>
      </div>

      {(showForm || editingVenue) && (
        <div className="animate-fade-in relative z-50">
          <div className="absolute inset-0 bg-noctvm-emerald/5 blur-3xl -z-10 rounded-full"></div>
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

      <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden frosted-noise shadow-2xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-white font-black font-mono">Location Identity</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-white font-black font-mono">Sector</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-white font-black font-mono">Status Indicator</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-white font-black font-mono text-right">System Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {venues.map((venue) => (
                <tr key={venue.id} className="group hover:bg-noctvm-emerald/5 transition-all duration-300">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/10 group-hover:border-noctvm-emerald/30 group-hover:scale-110 shadow-xl transition-all duration-500">
                        📍
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white tracking-tight text-lg group-hover:text-noctvm-emerald transition-colors">
                            {venue.name}
                          </span>
                          {venue.badge !== 'none' && <VerifiedBadge type={venue.badge} size="sm" />}
                        </div>
                        <p className="text-[10px] font-mono text-noctvm-silver/40 uppercase tracking-widest">{venue.address || 'Unknown'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{venue.city?.toUpperCase()}</span>
                      <span className="text-[9px] font-mono text-noctvm-silver/30 uppercase tracking-widest">Regional Zone</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      {venue.is_verified ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-noctvm-emerald shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                          <span className="text-[10px] font-black font-mono text-noctvm-emerald tracking-widest uppercase">Certified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-white/20"></div>
                          <span className="text-[10px] font-black font-mono text-noctvm-silver/40 tracking-widest uppercase">Initializing</span>
                        </div>
                      )}
                      {venue.owner_id && (
                        <span className="text-[8px] font-black font-mono text-noctvm-violet/60 uppercase tracking-[0.2em] bg-noctvm-violet/5 px-2 py-0.5 rounded border border-noctvm-violet/20 w-fit">
                          Authorized Owner
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      {!venue.owner_id && (
                        <button 
                          onClick={() => setClaimingVenue(venue)}
                          className="px-4 py-2 rounded-2xl bg-noctvm-violet/10 text-noctvm-violet text-[10px] font-black border border-noctvm-violet/30 hover:bg-noctvm-violet/20 transition-all shadow-inner tracking-widest uppercase"
                        >
                          Request Claim
                        </button>
                      )}
                      <button 
                        onClick={() => handleToggleVerified(venue)}
                        className={`p-3 rounded-2xl transition-all border shadow-inner ${
                          venue.is_verified 
                            ? 'bg-noctvm-gold/10 text-noctvm-gold border-noctvm-gold/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]' 
                            : 'bg-white/5 text-noctvm-silver border-white/5 hover:text-noctvm-gold hover:border-noctvm-gold/20'
                        }`}
                        title="Manual Verification"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setEditingVenue(venue)}
                        className="p-3 rounded-2xl bg-white/5 text-noctvm-silver border border-white/5 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-inner"
                        title="Mod Access"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {venues.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-noctvm-silver/40 italic font-mono uppercase tracking-[0.3em] text-sm">
                    NO_STATION_SIGNALS_DETECTED
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
