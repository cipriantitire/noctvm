'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { Venue } from '@/lib/types';
import VerifiedBadge from '@/components/VerifiedBadge';
import VenueForm from './VenueForm';
import ClaimModal from './ClaimModal';
import { TrashIcon, PlusIcon, EditIcon, CheckIcon, SearchIcon, GridIcon, UsersIcon, LayoutListIcon, StarIcon, ClaimIcon, ChatIcon } from '@/components/icons';
import { logActivity } from '@/lib/activity';
import Image from 'next/image';
import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';

interface VenueReview {
  id: string;
  user_id: string;
  venue_name: string;
  rating: number;
  text: string;
  reply_text?: string;
  created_at: string;
  profiles?: { username: string; display_name: string | null; avatar_url: string | null };
}

function timeAgoShort(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const stars = [1, 2, 3, 4, 5];
  const cls = size === 'md' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <div className="flex items-center gap-0.5">
      {stars.map(s => (
        <StarIcon key={s} className={`${cls} ${s <= Math.round(rating) ? 'text-noctvm-gold' : 'text-noctvm-silver/20'}`} />
      ))}
    </div>
  );
}

export default function VenueManager() {
  const { profile, isAdmin } = useAuth();
  const { headerHidden } = useDashboard();
  const [venues, setVenues] = useState<(Venue & { upcoming_events: number })[]>([]);
  const [followCounts, setFollowCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [claimingVenue, setClaimingVenue] = useState<Venue | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'city' | 'genres' | 'upcoming_events' | 'followers'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null);
  const [loadedReviews, setLoadedReviews] = useState<Record<string, VenueReview[]>>({});
  const [loadingReviews, setLoadingReviews] = useState<Set<string>>(new Set());
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});




  const fetchVenues = useCallback(async () => {
    setLoading(true);
    
    // 1. Fetch all venues
    const { data: venuesData } = await supabase.from('venues').select('*');
    if (!venuesData) { setLoading(false); return; }

    // 2. Fetch follower counts
    const { data: followsData } = await supabase
      .from('follows')
      .select('target_id')
      .eq('target_type', 'venue');
    
    const counts: Record<string, number> = {};
    followsData?.forEach(f => {
      counts[f.target_id] = (counts[f.target_id] || 0) + 1;
    });

    // 3. Fetch review statistics
    const { data: reviewsData } = await supabase
      .from('venue_reviews')
      .select('venue_name, rating');
    
    const stats: Record<string, { sum: number; count: number }> = {};
    reviewsData?.forEach(r => {
      if (!stats[r.venue_name]) stats[r.venue_name] = { sum: 0, count: 0 };
      stats[r.venue_name].sum += r.rating;
      stats[r.venue_name].count++;
    });

    // 4. Fetch upcoming events count
    const now = new Date().toISOString().split('T')[0];
    const { data: eventsData } = await supabase
      .from('events')
      .select('venue')
      .gte('date', now);
    
    const eventCounts: Record<string, number> = {};
    eventsData?.forEach(e => {
      eventCounts[e.venue] = (eventCounts[e.venue] || 0) + 1;
    });

    // 5. Map everything together
    const enrichedVenues = (venuesData as Venue[]).map(v => ({
      ...v,
      followers: counts[v.name] || 0,
      rating: stats[v.name] ? stats[v.name].sum / stats[v.name].count : (v.rating || 0),
      review_count: stats[v.name] ? stats[v.name].count : (v.review_count || 0),
      upcoming_events: eventCounts[v.name] || 0
    }));
    
    setVenues(enrichedVenues as any);
    setFollowCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);


  const filteredAndSortedVenues = useMemo(() => {
    let result = venues.filter(venue => 
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      let valA = (a as any)[sortBy] || '';
      let valB = (b as any)[sortBy] || '';
      
      if (Array.isArray(valA)) valA = valA.join(', ');
      if (Array.isArray(valB)) valB = valB.join(', ');

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Keep owned venues at the very top regardless of primary sort, but only if they are tied? 
    // Actually user asked for specific sorting, let's respect it but maybe highlight owned ones.
    
    return result;
  }, [venues, searchTerm, sortBy, sortOrder]);

  const handleDelete = async (venue: Venue) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${venue.name}"? This will remove all associated data and cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', venue.id);

    if (error) {
      alert(error.message);
    } else {
      await logActivity({
        type: 'venue_delete',
        message: `Deleted venue: ${venue.name}`,
        entity_name: venue.name,
        user_name: profile?.display_name || 'Admin'
      });
      fetchVenues();
    }
  };

  const fetchReviews = async (venueName: string) => {
    if (loadedReviews[venueName] !== undefined) return;
    setLoadingReviews(prev => new Set(prev).add(venueName));
    const { data } = await supabase
      .from('venue_reviews')
      .select('id, user_id, venue_name, rating, text, reply_text, created_at, profiles(username, display_name, avatar_url)')
      .eq('venue_name', venueName)
      .order('created_at', { ascending: false });
    setLoadedReviews(prev => ({ ...prev, [venueName]: (data as any[]) || [] }));
    setLoadingReviews(prev => { const next = new Set(prev); next.delete(venueName); return next; });
  };

  const handleDeleteReview = async (venueName: string, reviewId: string) => {
    if (!window.confirm('Delete this review?')) return;
    const { error } = await supabase.from('venue_reviews').delete().eq('id', reviewId);
    if (!error) {
      setLoadedReviews(prev => ({
        ...prev,
        [venueName]: prev[venueName].filter(r => r.id !== reviewId)
      }));
    }
  };

  const handleReplyReview = async (venueName: string, reviewId: string) => {
    const text = replyInputs[reviewId]?.trim();
    if (!text) return;

    const { error } = await supabase
      .from('venue_reviews')
      .update({ reply_text: text })
      .eq('id', reviewId);
    
    if (!error) {
      setLoadedReviews(prev => ({
        ...prev,
        [venueName]: prev[venueName].map(r => r.id === reviewId ? { ...r, reply_text: text } : r)
      }));
      setReplyInputs(prev => ({ ...prev, [reviewId]: '' }));
    }
  };


  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-10 h-10 border-4 border-noctvm-violet/20 border-t-noctvm-violet rounded-full animate-spin"></div>
      <p className="text-noctvm-silver font-mono text-[10px] uppercase tracking-widest animate-pulse">Loading Venues...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className={`sticky top-0 lg:top-0 z-30 lg:mt-0 mt-4 transition-transform duration-300 ease-in-out frosted-noise bg-noctvm-black/70 backdrop-blur-3xl rounded-2xl border border-noctvm-violet/15 p-3 shadow-xl flex flex-col sm:flex-row items-center gap-3 mx-2 ${headerHidden ? '-translate-y-[210%]' : 'translate-y-0'}`}>
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
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest focus:border-noctvm-violet/50 outline-none text-noctvm-silver cursor-pointer hover:bg-white/10 transition-all font-bold"
            title="Sort By"
          >
            <option value="name">Name</option>
            <option value="city">City</option>
            <option value="genres">Genres</option>
            <option value="upcoming_events">Upcoming Events</option>
            <option value="followers">Popularity</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-noctvm-silver hover:text-white transition-all h-[42px] flex items-center justify-center min-w-[42px]"
            title="Toggle Sort Order"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>

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
              <LayoutListIcon className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => { setEditingVenue(null); setShowForm(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 h-[42px] bg-noctvm-violet rounded-xl text-[10px] font-bold uppercase tracking-wider text-white hover:bg-noctvm-violet/80 transition-all shadow-lg shadow-noctvm-violet/20 active:scale-95 whitespace-nowrap"
            title="Add Venue"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Add
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
            <div className={`mt-12 pb-20 px-2 min-h-screen ${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
          : 'flex flex-col gap-3'
      }`}>
        {filteredAndSortedVenues.map((venue) => {
          const isOwned = profile?.id && venue.owner_id === profile.id;
          const venueLogo = getVenueLogo(venue.name);
          return (
            <div 
              key={venue.id} 
              className={`group relative bg-white/5 border border-white/10 frosted-noise hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 shadow-xl overflow-hidden flex flex-col ${
                viewMode === 'grid' ? 'rounded-[2rem] p-5 h-full' : 'rounded-2xl'
              }`}
            >
              <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'items-center gap-4 p-4'}`}>
                <div className={`absolute top-0 right-0 bg-noctvm-violet/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-noctvm-violet/10 transition-colors duration-700 ${
                  viewMode === 'grid' ? 'w-32 h-32' : 'w-24 h-24'
                }`}></div>

                <div className={`relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group-hover:scale-105 transition-transform duration-500 flex-shrink-0 bg-noctvm-midnight ${
                  viewMode === 'grid' ? 'w-full aspect-[2/1] mb-5' : 'w-14 h-14 sm:w-16 sm:h-16'
                }`} onClick={() => viewMode === 'list' && setExpandedVenue(expandedVenue === venue.name ? null : venue.name)}>
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

                <div className="flex-1 min-w-0 relative z-10 flex flex-col">
                  <div className="flex items-start justify-between mb-0.5">
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-white tracking-tight text-base group-hover:text-noctvm-violet transition-colors truncate">
                          {venue.name}
                        </h3>
                        {venue.is_verified && <VerifiedBadge type={venue.badge} size="xs" />}
                      </div>
                      {venue.address && (
                        <p className="text-[10px] text-noctvm-silver/50 truncate -mt-0.5 mb-1.5">{venue.address}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-1.5 flex-shrink-0 -mt-0.5">
                      {!venue.owner_id && (
                        <button 
                          onClick={() => setClaimingVenue(venue)}
                          className="p-2 rounded-xl bg-white/5 border border-white/10 text-noctvm-silver/40 hover:text-noctvm-emerald hover:bg-noctvm-emerald/5 transition-all"
                          title="Claim Venue"
                        >
                          <ClaimIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => setEditingVenue(venue)} 
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-noctvm-silver/40 hover:text-noctvm-gold hover:bg-noctvm-gold/5 transition-all" 
                        title="Edit Venue"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      {(isAdmin || isOwned) && (
                        <button 
                          onClick={() => handleDelete(venue)} 
                          className="p-2 rounded-xl bg-white/5 border border-white/10 text-noctvm-silver/40 hover:text-red-500 hover:bg-red-500/5 transition-all" 
                          title="Delete Venue"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                       <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                          <span className="text-[9px] font-black text-white">{followCounts[venue.name] || 0}</span>
                          <span className="text-[8px] uppercase font-mono tracking-widest text-noctvm-silver/50">Followers</span>
                       </div>
                       <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                          <UsersIcon className="w-2.5 h-2.5 text-noctvm-emerald" />
                          <span className="text-[9px] font-black text-white">{venue.capacity || 'N/A'}</span>
                          <span className="text-[8px] uppercase font-mono tracking-widest text-noctvm-silver/50">Capacity</span>
                       </div>
                       <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                          <span className="text-[9px] font-black text-white">{venue.upcoming_events}</span>
                          <span className="text-[8px] uppercase font-mono tracking-widest text-noctvm-silver/50 ml-1">Upcoming</span>
                       </div>
                    </div>

                  <div className={`flex flex-wrap gap-1.5 ${viewMode === 'grid' ? 'mb-5' : ''}`}>
                    {venue.genres.slice(0, 3).map((g: string) => (
                      <span key={g} className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-noctvm-violet/10 text-noctvm-violet border border-noctvm-violet/20">
                        {g}
                      </span>
                    ))}
                    {venue.genres.length > 3 && (
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-white/5 text-noctvm-silver/40">
                        +{venue.genres.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = expandedVenue === venue.name ? null : venue.name;
                    setExpandedVenue(next);
                    if (next) fetchReviews(next);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 border-t border-white/5 text-[10px] text-noctvm-silver hover:text-white transition-colors uppercase font-mono tracking-widest mt-auto"
                >
                  <div className="flex items-center gap-2">
                    <StarRating rating={venue.rating || 0} />
                    <span className="text-noctvm-silver/60">
                      {(venue.rating || 0).toFixed(1)} · {venue.review_count || 0} Reviews
                    </span>
                  </div>
                  <svg className={`w-3 h-3 transition-transform duration-300 ${expandedVenue === venue.name ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

              {expandedVenue === venue.name && (
                <div className="border-t border-white/5 bg-black/20 animate-fade-in max-h-[300px] overflow-y-auto no-scrollbar">
                  {loadingReviews.has(venue.name) ? (
                    <div className="flex items-center justify-center py-8">
                       <div className="w-5 h-5 border-2 border-noctvm-violet/30 border-t-noctvm-violet rounded-full animate-spin" />
                    </div>
                  ) : (loadedReviews[venue.name] || []).length > 0 ? (
                    <div className="p-4 space-y-4">
                      {(loadedReviews[venue.name] || []).map((review) => (
                        <div key={review.id} className="space-y-3">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                               {review.profiles?.avatar_url ? (
                                 <Image src={review.profiles.avatar_url} alt="" width={32} height={32} className="object-cover" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-[10px]">👤</div>
                               )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-white uppercase tracking-tight">
                                    {review.profiles?.display_name || review.profiles?.username || 'Anonymous'}
                                  </span>
                                  <StarRating rating={review.rating} />
                                </div>
                                <span className="text-[9px] text-noctvm-silver/40 font-mono italic">{timeAgoShort(review.created_at)}</span>
                              </div>
                              <p className="text-xs text-noctvm-silver/80 leading-relaxed bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                                {review.text}
                              </p>
                              
                              <div className="flex items-center gap-3 mt-2 px-1">
                                <button 
                                  onClick={() => handleDeleteReview(venue.name, review.id)}
                                  className="text-[9px] text-noctvm-rose/50 hover:text-noctvm-rose font-bold uppercase tracking-widest transition-colors"
                                >
                                  Delete
                                </button>
                                {!review.reply_text && (
                                  <button 
                                    onClick={() => setReplyInputs(prev => ({ ...prev, [review.id]: (prev[review.id] === undefined ? '' : undefined) as any }))}
                                    className="text-[9px] text-noctvm-silver/40 hover:text-white font-bold uppercase tracking-widest transition-colors"
                                  >
                                    Reply
                                  </button>
                                )}
                              </div>

                              {review.reply_text && (
                                <div className="mt-3 ml-4 border-l-2 border-noctvm-violet/30 pl-4 py-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-black text-noctvm-violet uppercase tracking-widest">Venue Response</span>
                                  </div>
                                  <p className="text-[11px] text-noctvm-silver/60 italic leading-relaxed">
                                    &quot;{review.reply_text}&quot;
                                  </p>
                                </div>
                              )}

                              {replyInputs[review.id] !== undefined && (
                                <div className="mt-3 flex gap-2">
                                  <input 
                                    type="text"
                                    placeholder="Write a reply as owner..."
                                    value={replyInputs[review.id]}
                                    onChange={(e) => setReplyInputs(prev => ({ ...prev, [review.id]: e.target.value }))}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-noctvm-violet/50"
                                  />
                                  <button 
                                    onClick={() => handleReplyReview(venue.name, review.id)}
                                    className="px-4 py-2 bg-noctvm-violet text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
                                  >
                                    Send
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-[10px] text-noctvm-silver/30 uppercase font-mono tracking-widest italic">No reviews yet for this venue</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
        {filteredAndSortedVenues.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-noctvm-silver/40 italic font-mono uppercase tracking-widest text-xs">No venues found</p>
          </div>
        )}
      </div>
    </div>
  );
}
