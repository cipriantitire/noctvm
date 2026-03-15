import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Venue } from '@/lib/types';
import VerifiedBadge from '@/components/VerifiedBadge';
import VenueForm from './VenueForm';
import ClaimModal from './ClaimModal';
import { PlusIcon, EditIcon, CheckIcon, SearchIcon } from '@/components/icons';
import Image from 'next/image';

export default function VenueManager() {
  const { profile, isAdmin } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [claimingVenue, setClaimingVenue] = useState<Venue | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('venues').select('*').order('name');
    if (!isAdmin && profile?.id) {
      query = query.eq('owner_id', profile.id);
    }
    const { data } = await query;
    if (data) setVenues(data as Venue[]);
    setLoading(false);
  }, [profile, isAdmin]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const filteredVenues = venues.filter(venue => 
    venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-10 h-10 border-4 border-noctvm-violet/20 border-t-noctvm-violet rounded-full animate-spin"></div>
      <p className="text-noctvm-silver font-mono text-[10px] uppercase tracking-widest animate-pulse">Loading Venues...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Venues</h2>
          <p className="text-noctvm-silver text-[10px] font-mono uppercase tracking-widest mt-1 opacity-60">Manage your partner locations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noctvm-silver/40" />
            <input 
              type="text"
              placeholder="Search venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:border-noctvm-violet/50 outline-none transition-all w-64"
            />
          </div>
          <button 
            onClick={() => { setEditingVenue(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-noctvm-violet rounded-xl text-xs font-bold uppercase tracking-wider text-white hover:bg-noctvm-violet/80 transition-all shadow-lg active:scale-95"
          >
            <PlusIcon className="w-3 h-3" />
            Add Venue
          </button>
        </div>
      </div>

      {(showForm || editingVenue) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto no-scrollbar">
          <div className="w-full max-w-4xl my-auto">
            <VenueForm 
              initialData={editingVenue || undefined}
              onSuccess={() => { setShowForm(false); setEditingVenue(null); fetchVenues(); }}
              onCancel={() => { setShowForm(false); setEditingVenue(null); }}
            />
          </div>
        </div>
      )}

      {claimingVenue && (
        <ClaimModal 
          venue={claimingVenue}
          onSuccess={() => { setClaimingVenue(null); fetchVenues(); }}
          onCancel={() => setClaimingVenue(null)}
        />
      )}

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden frosted-noise shadow-xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-noctvm-silver font-bold font-mono">Venue Details</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-noctvm-silver font-bold font-mono">Location</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-noctvm-silver font-bold font-mono">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-noctvm-silver font-bold font-mono text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredVenues.map((venue) => (
                <tr key={venue.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                        {venue.image_url ? (
                          <Image 
                            src={venue.image_url} 
                            alt={venue.name} 
                            fill 
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center text-lg">🏢</div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-white tracking-tight text-sm">
                            {venue.name}
                          </span>
                          {venue.is_verified && <VerifiedBadge type={venue.badge} size="sm" />}
                        </div>
                        <p className="text-[9px] font-mono text-noctvm-silver/40 uppercase tracking-widest">{venue.address || 'No Address'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white/70">{venue.city}</span>
                      <span className="text-[9px] font-mono text-noctvm-silver/30 uppercase tracking-tighter">{venue.country}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border tracking-tighter uppercase font-mono w-fit ${
                        venue.is_verified 
                          ? 'bg-noctvm-emerald/10 text-noctvm-emerald border-noctvm-emerald/20' 
                          : 'bg-white/5 text-noctvm-silver border-white/10'
                      }`}>
                        {venue.is_verified ? 'Verified' : 'Pending'}
                      </span>
                      {venue.owner_id && (
                        <span className="text-[8px] font-bold text-noctvm-violet uppercase tracking-widest">Managed</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {!venue.owner_id && (
                        <button 
                          onClick={() => setClaimingVenue(venue)}
                          className="px-3 py-1 bg-noctvm-violet/10 text-noctvm-violet border border-noctvm-violet/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-noctvm-violet hover:text-white transition-all"
                        >
                          Claim
                        </button>
                      )}
                      <button 
                        onClick={() => setEditingVenue(venue)}
                        className="p-2 rounded-xl text-noctvm-silver/40 hover:text-white hover:bg-white/5 transition-all"
                        title="Edit Venue"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredVenues.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-noctvm-silver/40 italic font-mono uppercase tracking-widest text-xs">
                    No venues found
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
