'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Venue } from '@/lib/types';
import VerifiedBadge from '@/components/VerifiedBadge';
import VenueForm from './VenueForm';
import ClaimModal from './ClaimModal';
import { PlusIcon, EditIcon, CheckIcon, SearchIcon, GridIcon, UsersIcon } from '@/components/icons';
import Image from 'next/image';
import { getVenueLogo } from '@/lib/venue-logos';

function StarRating({ rating }: { rating: number }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5">
      {stars.map(s => (
        <svg key={s} className={`w-2 h-2 ${s <= Math.round(rating) ? 'text-noctvm-gold' : 'text-noctvm-silver/20'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function VenueManager() {
  const { profile, isAdmin } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [followCounts, setFollowCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [claimingVenue, setClaimingVenue] = useState<Venue | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    
    // Fetch venues
    const { data: venuesData } = await supabase.from('venues').select('*').order('name');
    
    // Fetch follow counts
    const { data: followsData } = await supabase
      .from('follows')
      .select('target_id')
      .eq('target_type', 'venue');
    
    const counts: Record<string, number> = {};
    followsData?.forEach(f => {
      counts[f.target_id] = (counts[f.target_id] || 0) + 1;
    });
    
    if (venuesData) setVenues(venuesData as Venue[]);
    setFollowCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const filteredVenues = venues.filter(venue => 
    venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedVenues = [...filteredVenues].sort((a, b) => {
    if (profile?.id) {
      const aOwned = a.owner_id === profile.id ? 1 : 0;
      const bOwned = b.owner_id === profile.id ? 1 : 0;
      if (aOwned !== bOwned) return bOwned - aOwned;
    }
    return a.name.localeCompare(b.name);
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-10 h-10 border-4 border-noctvm-violet/20 border-t-noctvm-violet rounded-full animate-spin"></div>
      <p className="text-noctvm-silver font-mono text-[10px] uppercase tracking-widest animate-pulse">Loading Venues...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 px-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white uppercase">Venues</h2>
            <p className="text-noctvm-silver text-[9px] md:text-[10px] font-mono uppercase tracking-widest mt-1 opacity-60">Manage your partner locations</p>
          </div>
        </div>
      </div>

      <div className="sticky top-0 lg:top-0 z-30 frosted-noise bg-noctvm-black/70 backdrop-blur-3xl rounded-2xl border border-noctvm-violet/15 p-3 shadow-xl flex flex-col sm:flex-row items-center gap-3 mx-2">
        <div className="relative flex-1 w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noctvm-silver/40" />
          <input 
            type="text"
            placeholder="Search venues..."
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
            onClick={() => { setEditingVenue(null); setShowForm(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 h-[42px] bg-noctvm-violet rounded-xl text-[10px] font-bold uppercase tracking-wider text-white hover:bg-noctvm-violet/80 transition-all shadow-lg shadow-noctvm-violet/20 active:scale-95 whitespace-nowrap"
          >
            <PlusIcon className="w-3.5 h-3.5" />
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

      <div className={`mt-4 pb-20 px-2 ${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
          : 'flex flex-col gap-3'
      }`}>
        {sortedVenues.map((venue) => {
          const isOwned = profile?.id && venue.owner_id === profile.id;
          const venueLogo = getVenueLogo(venue.name);
          
          return (
            <div 
              key={venue.id} 
              className={`group relative bg-white/5 border border-white/10 frosted-noise hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 shadow-xl overflow-hidden ${
                viewMode === 'grid' ? 'rounded-[2rem] p-5' : 'rounded-2xl p-4 flex items-center gap-4'
              }`}
            >
              <div className={`absolute top-0 right-0 bg-noctvm-violet/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-noctvm-violet/10 transition-colors duration-700 ${
                viewMode === 'grid' ? 'w-32 h-32' : 'w-24 h-24'
              }`}></div>

              <div className={`relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-500 flex-shrink-0 bg-noctvm-midnight ${
                viewMode === 'grid' ? 'w-full aspect-[2/1] mb-5' : 'w-16 h-16 sm:w-20 sm:h-20'
              }`}>
                <Image 
                  src={venueLogo} 
                  alt={venue.name} 
                  fill 
                  className="object-cover"
                  sizes={viewMode === 'grid' ? "400px" : "80px"}
                />
                {isOwned && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-noctvm-violet backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest shadow-lg">
                    My Venue
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-white tracking-tight text-lg group-hover:text-noctvm-violet transition-colors truncate">
                        {venue.name}
                      </h3>
                      {venue.is_verified && <VerifiedBadge type={venue.badge} size="sm" />}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StarRating rating={venue.rating || 0} />
                      <span className="text-[10px] font-bold text-noctvm-gold">{(venue.rating || 0).toFixed(1)}</span>
                      <span className="text-[10px] text-noctvm-silver/40 font-mono uppercase tracking-widest">({venue.review_count || 0} reviews)</span>
                    </div>
                  </div>
                  {viewMode === 'list' && (
                    <div className="flex gap-2">
                       <button onClick={() => setEditingVenue(venue)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-noctvm-silver/40 hover:text-white transition-all" title="Edit Venue"><EditIcon className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>

                <div className={`flex items-center gap-3 mb-4 ${viewMode === 'list' ? 'mt-2' : 'mt-1'}`}>
                   <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                      <span className="text-[9px] font-black text-white">{followCounts[venue.name] || 0}</span>
                      <span className="text-[8px] uppercase font-mono tracking-widest text-noctvm-silver/50">Followers</span>
                   </div>
                   <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                      <UsersIcon className="w-2.5 h-2.5 text-noctvm-emerald" />
                      <span className="text-[9px] font-black text-white">{venue.capacity || 'N/A'}</span>
                      <span className="text-[8px] uppercase font-mono tracking-widest text-noctvm-silver/50">Capacity</span>
                   </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {venue.genres.slice(0, 3).map(g => (
                    <span key={g} className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-noctvm-violet/10 text-noctvm-violet border border-noctvm-violet/20 flex items-center gap-1">
                      {g}
                    </span>
                  ))}
                  {venue.genres.length > 3 && (
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-white/5 text-noctvm-silver/40">
                      +{venue.genres.length - 3}
                    </span>
                  )}
                </div>

                 <div className="flex items-center justify-between gap-2 mt-auto pt-4 border-t border-white/5">
                  <div className="flex gap-2 w-full">
                    {!venue.owner_id && (
                      <button 
                        onClick={() => setClaimingVenue(venue)}
                        className="flex-1 px-4 py-2 bg-noctvm-violet/20 text-noctvm-violet border border-noctvm-violet/40 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-noctvm-violet hover:text-white transition-all shadow-glow-sm"
                      >
                        Claim
                      </button>
                    )}
                    {viewMode === 'grid' && (
                      <button 
                        onClick={() => setEditingVenue(venue)}
                        className={`flex-1 px-4 py-2 bg-noctvm-violet text-white border border-noctvm-violet/50 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-noctvm-violet/80 transition-all shadow-lg shadow-noctvm-violet/20`}
                       >
                        Edit Venue
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredVenues.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-noctvm-silver/40 italic font-mono uppercase tracking-widest text-xs">No venues found</p>
          </div>
        )}
      </div>
    </div>
  );
}
