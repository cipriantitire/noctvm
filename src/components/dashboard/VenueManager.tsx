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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">Venues</h2>
          <p className="text-noctvm-silver text-[9px] md:text-[10px] font-mono uppercase tracking-widest mt-1 opacity-60">Manage your partner locations</p>
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
            onClick={() => { setEditingVenue(null); setShowForm(true); }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-noctvm-violet rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider text-white hover:bg-noctvm-violet/80 transition-all shadow-lg active:scale-95 whitespace-nowrap"
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20 px-2 mt-4">
        {filteredVenues.map((venue) => (
          <div 
            key={venue.id} 
            className="group relative bg-white/5 border border-white/10 rounded-[2rem] p-5 frosted-noise hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 shadow-xl overflow-hidden"
          >
            {/* Glossy Overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-noctvm-violet/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-noctvm-violet/10 transition-colors duration-700"></div>

            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                  {venue.image_url ? (
                    <Image 
                      src={venue.image_url} 
                      alt={venue.name} 
                      fill 
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-2xl">🏢</div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white tracking-tight text-lg group-hover:text-noctvm-violet transition-colors">
                      {venue.name}
                    </h3>
                    {venue.is_verified && <VerifiedBadge type={venue.badge} size="sm" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-noctvm-silver/60">
                      {venue.city}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/10"></span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-tighter uppercase font-mono ${
                      venue.is_verified 
                        ? 'bg-noctvm-emerald/10 text-noctvm-emerald border-noctvm-emerald/20' 
                        : 'bg-white/5 text-noctvm-silver border-white/10'
                    }`}>
                      {venue.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex flex-col gap-1 px-1">
                <p className="text-[10px] text-noctvm-silver/40 uppercase font-mono tracking-widest">Address</p>
                <p className="text-xs text-white/80 font-medium truncate">{venue.address || 'No Address Listed'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                  <p className="text-[9px] text-noctvm-silver/40 uppercase font-mono tracking-widest mb-1">Status</p>
                  <p className="text-[10px] font-bold text-white uppercase tracking-tight">
                    {venue.owner_id ? 'Managed' : 'Unclaimed'}
                  </p>
                </div>
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                  <p className="text-[9px] text-noctvm-silver/40 uppercase font-mono tracking-widest mb-1">Country</p>
                  <p className="text-[10px] font-bold text-white uppercase tracking-tight">{venue.country || 'Romania'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-8 pt-4 border-t border-white/5 relative z-10">
              <div className="flex gap-2">
                {!venue.owner_id && (
                  <button 
                    onClick={() => setClaimingVenue(venue)}
                    className="flex-1 px-4 py-2 bg-noctvm-violet/10 text-noctvm-violet border border-noctvm-violet/30 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-noctvm-violet hover:text-white transition-all shadow-glow-sm"
                  >
                    Claim
                  </button>
                )}
                <button 
                  onClick={() => setEditingVenue(venue)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-noctvm-silver hover:text-white hover:bg-white/10 transition-all"
                >
                  Edit
                </button>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
                 <span className="w-1.5 h-1.5 rounded-full bg-noctvm-emerald animate-pulse"></span>
                 <span className="text-[8px] font-mono text-noctvm-silver uppercase tracking-widest">Live</span>
              </div>
            </div>
          </div>
        ))}
        {filteredVenues.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-noctvm-silver/40 italic font-mono uppercase tracking-widest text-xs">No venues found</p>
          </div>
        )}
      </div>
    </div>
  );
}
