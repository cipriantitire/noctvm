'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Venue } from '@/lib/types';
import Image from 'next/image';
import SidebarMap from './SidebarMap';
import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';
import { StarIcon } from './icons';
import VerifiedBadge from './VerifiedBadge';
import SearchBar from './SearchBar';
import TrendingVenues from './TrendingVenues';
import { TrendingVenuesSkeleton } from './SkeletonLoader';

interface VenueReview {
  id: string;
  user_id: string;
  venue_name: string;
  rating: number;
  text: string;
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

interface VenuesPageProps {
  onVenueClick: (venueName: string) => void;
  activeCity?: 'bucuresti' | 'constanta';
  onCityChange?: (city: 'bucuresti' | 'constanta') => void;
  headerHidden?: boolean;
  activeGenre?: string;
  onGenreChange?: (genre: string) => void;
  allGenres?: string[];
}

export default function VenuesPage({ 
  onVenueClick, 
  activeCity: activeCityProp, 
  onCityChange, 
  headerHidden = false,
  activeGenre = 'All',
  onGenreChange,
  allGenres: allGenresProp
}: VenuesPageProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [followedVenues, setFollowedVenues] = useState<Set<string>>(new Set());
  const [loadingFollows, setLoadingFollows] = useState<Set<string>>(new Set());
  const cityToQuery = activeCityProp === 'bucuresti' ? 'Bucharest' : 'Constanta';
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null);
  const [reviewInputs, setReviewInputs] = useState<Record<string, string>>({});
  const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({});
  const [venueView, setVenueView] = useState<'grid' | 'list'>('list');
  const [venueSort, setVenueSort] = useState<'name' | 'popularity' | 'events'>('events');
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [trendingVenues, setTrendingVenues] = useState<{ name: string; count: number; logo_url?: string | null }[]>([]);
  const [loadedReviews, setLoadedReviews] = useState<Record<string, VenueReview[]>>({});
  const [loadedGoogleReviews, setLoadedGoogleReviews] = useState<Record<string, any[]>>({});
  const [googlePlaceIds, setGooglePlaceIds] = useState<Record<string, string | undefined>>({});
  const [loadingReviews, setLoadingReviews] = useState<Set<string>>(new Set());
  const [submittingReview, setSubmittingReview] = useState(false);
  const [preloadedStats, setPreloadedStats] = useState<Record<string, { avg: number; count: number }>>({});
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const [loadingTrendingVenues, setLoadingTrendingVenues] = useState(true);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Fetch event counts for sorting
    const today = new Date().toISOString().split('T')[0];
    supabase.from('events').select('venue').gte('date', today).then(({ data }) => {
      const counts: Record<string, number> = {};
      data?.forEach(e => { counts[e.venue] = (counts[e.venue] || 0) + 1; });
      setEventCounts(counts);
    });
  }, [cityToQuery]);

  useEffect(() => {
    let isActive = true;

    const loadTrendingVenues = async () => {
      setLoadingTrendingVenues(true);
      setTrendingVenues([]);

      try {
        const { data } = await supabase
          .from('events')
          .select('venue')
          .eq('city', cityToQuery)
          .gte('date', today);

        if (!isActive) return;

        if (data) {
          const counts: Record<string, number> = {};
          data.forEach((event) => {
            counts[event.venue] = (counts[event.venue] || 0) + 1;
          });

          const sorted = Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

          // Fetch logo_urls from venues table for trending venues
          if (sorted.length > 0) {
            const { data: venueData } = await supabase
              .from('venues')
              .select('name, logo_url')
              .in('name', sorted.map(v => v.name));
            if (venueData) {
              const logoMap = new Map(venueData.map(v => [v.name, v.logo_url]));
              sorted.forEach(v => { (v as any).logo_url = logoMap.get(v.name) || null; });
            }
          }

          setTrendingVenues(sorted);
        }
      } finally {
        if (isActive) {
          setLoadingTrendingVenues(false);
        }
      }
    };

    void loadTrendingVenues();

    return () => {
      isActive = false;
    };
  }, [cityToQuery, today]);

  useEffect(() => {
    if (!genreDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target as Node)) {
        setGenreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [genreDropdownOpen]);

  // Fetch venues from Supabase when city changes
  useEffect(() => {
    setLoadingVenues(true);
    let query = supabase.from('venues').select('*').eq('city', cityToQuery);
    
    if (venueSort === 'name') query = query.order('name');
    else if (venueSort === 'popularity') query = query.order('followers', { ascending: false });

    query.then(({ data }) => {
      setVenues((data ?? []) as Venue[]);
      setLoadingVenues(false);
    });
  }, [cityToQuery, venueSort]);

  // Preload review stats (avg + count) for all venues so toggle shows real data immediately
  useEffect(() => {
    if (venues.length === 0) return;
    supabase
      .from('venue_reviews')
      .select('venue_name, rating')
      .in('venue_name', venues.map(v => v.name))
      .then(({ data }) => {
        const acc: Record<string, { sum: number; count: number }> = {};
        (data || []).forEach((r: { venue_name: string; rating: number }) => {
          if (!acc[r.venue_name]) acc[r.venue_name] = { sum: 0, count: 0 };
          acc[r.venue_name].sum += r.rating;
          acc[r.venue_name].count++;
        });
        const stats: Record<string, { avg: number; count: number; googleAvg?: number; googleCount?: number; googlePlaceId?: string }> = {};
        venues.forEach(v => {
          const r = acc[v.name];
          const userAvg = r ? r.sum / r.count : 0;
          const userCount = r ? r.count : 0;
          // Merge with Google rating if available
          const googleRating = (v as any).rating as number | undefined;
          const googleReviewCount = (v as any).review_count as number | undefined;
          const googlePlaceId = (v as any).google_place_id as string | undefined;
          if (googleRating && googleReviewCount && googleReviewCount > 0) {
            // Weighted average: Google reviews carry more weight
            const totalCount = userCount + googleReviewCount;
            const weightedAvg = (userAvg * userCount + googleRating * googleReviewCount) / totalCount;
            stats[v.name] = { avg: weightedAvg, count: totalCount, googleAvg: googleRating, googleCount: googleReviewCount, googlePlaceId };
          } else {
            stats[v.name] = { avg: userAvg, count: userCount, googlePlaceId };
          }
        });
        setPreloadedStats(stats);
      });
  }, [venues]);

  // Load current user's venue follows
  useEffect(() => {
    if (!user) return;
    supabase
      .from('follows')
      .select('target_id')
      .eq('follower_id', user.id)
      .eq('target_type', 'venue')
      .then(({ data }) => {
        if (data) setFollowedVenues(new Set(data.map((f: { target_id: string }) => f.target_id)));
      });
  }, [user]);

  const toggleFollow = async (venueName: string) => {
    if (!user) return;
    setLoadingFollows(prev => new Set(prev).add(venueName));
    const isFollowing = followedVenues.has(venueName);
    // Optimistic update
    setFollowedVenues(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(venueName) : next.add(venueName);
      return next;
    });
    try {
      if (isFollowing) {
        await supabase.from('follows').delete()
          .eq('follower_id', user.id).eq('target_id', venueName).eq('target_type', 'venue');
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, target_id: venueName, target_type: 'venue' });
      }
    } catch {
      // Revert on error
      setFollowedVenues(prev => {
        const next = new Set(prev);
        isFollowing ? next.add(venueName) : next.delete(venueName);
        return next;
      });
    }
    setLoadingFollows(prev => { const next = new Set(prev); next.delete(venueName); return next; });
  };

  // Genre filters
  const allGenres = allGenresProp || ['All', ...Array.from(new Set(venues.flatMap(v => v.genres))).sort()];

  const filteredVenues = venues.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.genres.some(g => g.toLowerCase().includes(search.toLowerCase()));
    const matchesGenre = activeGenre === 'All' || v.genres.includes(activeGenre);
    return matchesSearch && matchesGenre;
  });

  // Sort: followed first, then by chosen sort
  const sortedVenues = [...filteredVenues].sort((a, b) => {
    const aFollowed = followedVenues.has(a.name) ? 1 : 0;
    const bFollowed = followedVenues.has(b.name) ? 1 : 0;
    if (bFollowed !== aFollowed) return bFollowed - aFollowed;

    if (venueSort === 'events') {
      const aEvents = eventCounts[a.name] || 0;
      const bEvents = eventCounts[b.name] || 0;
      return bEvents - aEvents;
    }
    
    if (venueSort === 'name') return a.name.localeCompare(b.name);
    // popularity is already handled by query order mostly, but for completeness:
    if (venueSort === 'popularity') return (b.rating || 0) - (a.rating || 0);

    return (b.rating || 0) - (a.rating || 0); // fallback
  });

  const fetchReviews = async (venueName: string) => {
    if (loadedReviews[venueName] !== undefined) return;
    setLoadingReviews(prev => new Set(prev).add(venueName));
    
    // Load user reviews
    const { data } = await supabase
      .from('venue_reviews')
      .select('*, profiles(username, display_name, avatar_url)')
      .eq('venue_name', venueName)
      .order('created_at', { ascending: false });
    
    // Also load Google reviews from venue record
    const venue = venues.find(v => v.name === venueName);
    const googleReviews = (venue as any)?.google_reviews || [];
    const googlePlaceId = (venue as any)?.google_place_id as string | undefined;
    
    setLoadedReviews(prev => ({ ...prev, [venueName]: (data as VenueReview[] | null) || [] }));
    setLoadedGoogleReviews(prev => ({ ...prev, [venueName]: googleReviews }));
    setGooglePlaceIds(prev => ({ ...prev, [venueName]: googlePlaceId }));
    setLoadingReviews(prev => { const next = new Set(prev); next.delete(venueName); return next; });
  };

  const submitReview = async (venueName: string) => {
    if (!user || submittingReview) return;
    const text = reviewInputs[venueName]?.trim();
    const rating = reviewRatings[venueName];
    if (!text || !rating) return;
    setSubmittingReview(true);
    try {
      const { data: inserted } = await supabase
        .from('venue_reviews')
        .insert({ user_id: user.id, venue_name: venueName, rating, text })
        .select('id, user_id, venue_name, rating, text, created_at, profiles(username, display_name, avatar_url)')
        .single();
      if (inserted) {
        setLoadedReviews(prev => ({ ...prev, [venueName]: [inserted as unknown as VenueReview, ...(prev[venueName] || [])] }));
      }
      setReviewInputs(prev => ({ ...prev, [venueName]: '' }));
      setReviewRatings(prev => ({ ...prev, [venueName]: 0 }));
    } finally {
      setSubmittingReview(false);
    }
  };

  const getReviews = (venueName: string) => loadedReviews[venueName] || [];
  const getAvgRating = (venueName: string, dbRating: number) => {
    const reviews = loadedReviews[venueName];
    if (!reviews || reviews.length === 0) return dbRating;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  };

  return (
    <div className="tab-content">
      {/* Mobile Map - wide landscape (Top of Venues Page) */}
      <div className="lg:hidden mb-4 rounded-xl overflow-hidden border border-white/5 bg-noctvm-midnight/30 backdrop-blur-sm animate-fade-in-up">
        <div className="aspect-[21/9] flex items-center justify-center relative">
          <SidebarMap 
            venues={filteredVenues}
            eventCounts={eventCounts}
            activeCity={activeCityProp || 'bucuresti'}
            activeTab="venues"
            onVenueClick={onVenueClick}
            headerHidden={headerHidden}
          />
        </div>
      </div>

      <div className="lg:hidden mb-4 animate-fade-in-up">
        {loadingTrendingVenues ? (
          <TrendingVenuesSkeleton />
        ) : (
          <TrendingVenues
            venues={trendingVenues}
            onVenueClick={onVenueClick}
            headerHidden={headerHidden}
          />
        )}
      </div>

      {/* Sticky auto-hide header */}
      <SearchBar
        type="venues"
        activeCity={activeCityProp || 'bucuresti'}
        onCityChange={(city) => onCityChange?.(city)}
        headerHidden={headerHidden}
        activeGenre={activeGenre}
        onGenreChange={onGenreChange}
        venueSearch={search}
        onVenueSearchChange={setSearch}
        venueView={venueView}
        onVenueViewChange={setVenueView}
        venueSort={venueSort}
        onVenueSortChange={setVenueSort}
        venuesCount={sortedVenues.length}
        allGenres={allGenres}
      />

      {/* Venues list/grid */}
      {loadingVenues ? (
        <div className="space-y-4 pb-24 lg:pb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-noctvm-surface animate-pulse" />
          ))}
        </div>
      ) : (
      <div className={`mt-0 pb-24 lg:pb-6 ${venueView === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}`}>
        {sortedVenues.map((venue, idx) => {
          const isFollowed = followedVenues.has(venue.name);
          const isLoading = loadingFollows.has(venue.name);
          const isExpanded = expandedVenue === venue.name;
          const reviews = getReviews(venue.name);
          const avgRating = getAvgRating(venue.name, venue.rating || 0);
          const isLoadingReviews = loadingReviews.has(venue.name);

          return venueView === 'grid' ? (
            <div
              key={venue.name}
              onClick={() => onVenueClick(venue.name)}
              data-venue-card={idx === 0 ? 'first' : undefined}
              className="group event-card-liquid rounded-xl corner-smooth cursor-pointer transition-all duration-300 overflow-hidden h-full flex flex-col"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Venue color header */}
              <div className={`h-[156px] bg-gradient-to-br ${getVenueColor(venue.name)} relative flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                <div className="w-[80px] h-[80px] rounded-2xl overflow-hidden border-2 border-white/20 flex items-center justify-center bg-noctvm-black/20 relative">
                  <Image
                    src={getVenueLogo(venue.name, venue.logo_url)}
                    alt={venue.name}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      const el = (e.target as any).parentElement;
                      el.querySelector('.fallback')?.classList.remove('hidden');
                    }}
                  />
                  <span className={`fallback hidden text-2xl font-bold text-foreground absolute inset-0 flex items-center justify-center`}>{venue.name[0]}</span>
                </div>
                {isFollowed && <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full corner-smooth-none bg-noctvm-violet/80 text-foreground text-noctvm-micro font-semibold">Following</span>}
              </div>
              {/* Info */}
              <div className="p-3 flex flex-col flex-1">
                <div className="flex items-center gap-1.5 mb-1 min-w-0">
                  <h3 className="font-heading font-semibold text-foreground text-sm leading-tight group-hover:text-noctvm-violet transition-colors truncate">{venue.name}</h3>
                  {venue.badge !== 'none' && <VerifiedBadge type={venue.badge} size="xs" />}
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <StarRating rating={venue.rating || 0} />
                  <span className="text-noctvm-micro text-noctvm-silver/60">{venue.rating || 'N/A'}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-auto">
                  {venue.genres.slice(0, 2).map(g => (
                    <span key={g} className="px-1.5 py-0.5 rounded-full corner-smooth-none text-noctvm-micro uppercase font-bold bg-white/5 text-noctvm-silver/60 border border-white/5">{g}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-noctvm-border">
                  <span className="text-noctvm-micro text-noctvm-silver/40 font-mono">Cap. {venue.capacity || 'N/A'}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFollow(venue.name); }}
                    disabled={isLoading || !user}
                    className={`px-2 py-1 rounded-md text-noctvm-caption font-semibold transition-all ${isFollowed ? 'bg-noctvm-violet/10 text-noctvm-violet' : 'bg-noctvm-midnight text-noctvm-silver border border-noctvm-border hover:border-noctvm-violet/40 hover:text-foreground'} disabled:opacity-40`}
                  >
                    {isLoading ? '...' : isFollowed ? 'Following' : 'Follow'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={venue.name}
              onClick={() => onVenueClick(venue.name)}
              data-venue-card={idx === 0 ? 'first' : undefined}
              className="event-card-liquid rounded-xl corner-smooth transition-all duration-300 overflow-hidden animate-fade-in-up cursor-pointer"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Venue header row */}
              <div className="flex items-center gap-3 p-4">
                {/* Logo */}
                <button
                  onClick={(e) => { e.stopPropagation(); onVenueClick(venue.name); }}
                  title="View venue details"
                  className="w-14 h-14 rounded-2xl overflow-hidden border border-noctvm-border flex items-center justify-center bg-noctvm-midnight flex-shrink-0 hover:border-noctvm-violet/40 transition-colors relative"
                >
                  <Image
                    src={getVenueLogo(venue.name, venue.logo_url)}
                    alt={venue.name}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      const el = (e.target as any).parentElement;
                      el.querySelector('.fallback')?.classList.remove('hidden');
                    }}
                  />
                  <span className={`fallback hidden text-lg font-bold text-foreground absolute inset-0 flex items-center justify-center`}>
                    {venue.name[0]}
                  </span>
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-heading font-semibold text-foreground text-sm truncate">{venue.name}</span>
                    {venue.badge !== 'none' && <VerifiedBadge type={venue.badge} size="xs" />}
                  </div>
                    {isFollowed && (
                      <span className="px-1.5 py-0.5 rounded-full bg-noctvm-violet/10 text-noctvm-violet text-noctvm-micro font-semibold flex-shrink-0">Following</span>
                    )}
                  </div>
                  {venue.followers > 0 && (
                    <p className="text-noctvm-caption text-noctvm-silver/40 mb-0.5">{venue.followers.toLocaleString()} followers</p>
                  )}
                  <p className="text-noctvm-caption text-noctvm-silver/50 truncate">{venue.address}</p>
                </div>

                {/* Follow button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFollow(venue.name); }}
                  disabled={isLoading || !user}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                    isFollowed
                      ? 'bg-noctvm-violet/10 text-noctvm-violet border border-noctvm-violet/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                      : 'bg-noctvm-midnight text-noctvm-silver border border-noctvm-border hover:border-noctvm-violet/40 hover:text-foreground'
                  } disabled:opacity-40`}
                >
                  {isLoading ? '...' : isFollowed ? 'Following' : 'Follow'}
                </button>
              </div>

              {/* Genres + capacity inline */}
              <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
                {venue.genres.map(g => (
                  <span key={g} className="px-2 py-0.5 rounded-full text-noctvm-micro font-semibold bg-noctvm-violet/8 text-noctvm-violet/70 border border-noctvm-violet/10">
                    {g}
                  </span>
                ))}
                {(venue.capacity || 0) > 0 && (
                  <span className="px-3 py-1 rounded-full text-noctvm-caption font-mono bg-noctvm-surface border border-noctvm-border text-noctvm-silver/60">
                    Cap. {venue.capacity}
                  </span>
                )}
              </div>

              {/* Description — card click handles navigation */}
              {venue.description && (
                <div className="w-full px-4 pb-3">
                  <p className="text-xs text-noctvm-silver/70 leading-relaxed">{venue.description}</p>
                </div>
              )}

              {/* Reviews toggle row — stops card click from propagating */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const next = isExpanded ? null : venue.name;
                  setExpandedVenue(next);
                  if (next) fetchReviews(next);
                }}
                className="relative w-full flex items-center justify-between px-4 py-2.5 border-t border-noctvm-border text-xs text-noctvm-silver hover:text-foreground transition-colors overflow-hidden"
              >
                <div className="absolute inset-0 z-0 pointer-events-none mask-gradient" />
                <div className="relative z-10 flex items-center gap-1.5">
                  {(() => {
                    const stat = preloadedStats[venue.name] ?? { avg: 0, count: 0 };
                    return (
                      <>
                        <StarRating rating={stat.avg} />
                        <span className="text-noctvm-caption text-noctvm-silver/60">
                          {stat.avg > 0 ? stat.avg.toFixed(1) : 'N/A'} · {stat.count} Reviews
                        </span>
                      </>
                    );
                  })()}
                </div>
                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7" /></svg>
              </button>

              {/* Expanded reviews section */}
              {isExpanded && (
                <div className="border-t border-noctvm-border bg-noctvm-midnight/50 animate-fade-in">
                  {isLoadingReviews ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-5 h-5 border-2 border-noctvm-violet/30 border-t-noctvm-violet rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Google Reviews */}
                      {(loadedGoogleReviews[venue.name] || []).length > 0 && (
                        <div className="p-4 pb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-noctvm-gold" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            <span className="text-noctvm-caption font-bold text-noctvm-silver/60 uppercase tracking-widest">Google Reviews</span>
                            {googlePlaceIds[venue.name] && (
                              <a href={`https://search.google.com/local/writereview?placeid=${googlePlaceIds[venue.name]}`} target="_blank" rel="noopener noreferrer" className="ml-auto text-noctvm-caption text-noctvm-violet hover:underline">Write a Review on Google</a>
                            )}
                          </div>
                          <div className="space-y-2.5">
                            {(loadedGoogleReviews[venue.name] || []).slice(0, 3).map((r: any, i: number) => (
                              <div key={`g-${i}`} className="flex gap-2.5">
                                <div className="w-6 h-6 rounded-full bg-noctvm-surface flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                  {r.profile_photo_url ? <Image src={r.profile_photo_url} alt="" fill className="object-cover" unoptimized /> : <span className="text-noctvm-caption font-bold text-noctvm-silver/50">G</span>}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-noctvm-label font-semibold text-foreground text-xs">{r.author_name}</span>
                                    <StarRating rating={r.rating} />
                                  </div>
                                  <p className="text-xs text-noctvm-silver/80 leading-relaxed line-clamp-3">{r.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* User Reviews */}
                      {loadedReviews[venue.name]?.length > 0 ? (
                        <div className={`p-4 ${(loadedGoogleReviews[venue.name] || []).length > 0 ? 'pt-0' : ''} space-y-3`}>
                          {(loadedGoogleReviews[venue.name] || []).length > 0 && loadedReviews[venue.name]?.length > 0 && (
                            <div className="flex items-center gap-2 pt-2 pb-1">
                              <div className="flex-1 h-px bg-noctvm-border/50" />
                              <span className="text-noctvm-caption text-noctvm-silver/40">App Reviews</span>
                              <div className="flex-1 h-px bg-noctvm-border/50" />
                            </div>
                          )}
                          {loadedReviews[venue.name].map((review) => {
                            const handle = review.profiles?.username || review.user_id.slice(0, 8);
                            const initial = (review.profiles?.display_name || review.profiles?.username || '?')[0].toUpperCase();
                        return (
                          <div key={review.id} className="flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-noctvm-violet/40 to-purple-500/40 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                              {review.profiles?.avatar_url ? (
                                <Image src={review.profiles.avatar_url} alt="" fill className="object-cover" unoptimized />
                              ) : (
                                <span className="text-noctvm-caption font-bold text-foreground">{initial}</span>
                              )}
                              <div className="absolute inset-0 pointer-events-none z-10 glass-fade-edge" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-noctvm-label font-semibold text-foreground">@{handle}</span>
                                <StarRating rating={review.rating} />
                                <span className="text-noctvm-caption text-noctvm-silver/40 ml-auto">{timeAgoShort(review.created_at)}</span>
                              </div>
                              <p className="text-xs text-noctvm-silver/80 leading-relaxed">{review.text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (loadedGoogleReviews[venue.name] || []).length === 0 ? (
                    <p className="px-4 py-4 text-xs text-noctvm-silver/50">No reviews yet. Be the first!</p>
                  ) : null}

                  {/* Write a review */}
                  {user ? (
                    <div className="p-4 border-t border-noctvm-border" onClick={e => e.stopPropagation()}>
                      <p className="text-xs font-semibold text-foreground mb-2">Rate & Review</p>
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            onClick={(e) => { e.stopPropagation(); setReviewRatings(prev => ({ ...prev, [venue.name]: s })); }}
                            title={`Rate ${s} stars`}
                            className="hover:scale-110 transition-transform"
                          >
                            <StarIcon className={`w-5 h-5 ${s <= (reviewRatings[venue.name] || 0) ? 'text-noctvm-gold' : 'text-noctvm-silver/20'}`} />
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Share your experience..."
                          value={reviewInputs[venue.name] || ''}
                          onChange={e => setReviewInputs(prev => ({ ...prev, [venue.name]: e.target.value }))}
                          onClick={e => e.stopPropagation()}
                          onKeyDown={e => { if (e.key === 'Enter') submitReview(venue.name); }}
                          className="flex-1 bg-noctvm-surface text-xs text-foreground placeholder:text-noctvm-silver/30 outline-none px-3 py-2 rounded-lg border border-noctvm-border focus:border-noctvm-violet/50 transition-colors"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); submitReview(venue.name); }}
                          disabled={!reviewInputs[venue.name]?.trim() || !reviewRatings[venue.name] || submittingReview}
                          title="Post review"
                          className="px-3 py-2 rounded-lg bg-noctvm-violet text-foreground text-xs font-semibold disabled:opacity-40 hover:bg-noctvm-violet/80 transition-colors"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 pb-4 pt-2 text-xs text-noctvm-silver/50">Sign in to leave a review</div>
                  )}
                  </>
                )}
                </div>
              )}
            </div>
          );
        })}

        {sortedVenues.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <p className="text-foreground font-semibold text-sm mb-1">No venues found</p>
            <p className="text-xs text-noctvm-silver/60">Try a different search or filter</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
