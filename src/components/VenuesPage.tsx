'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';
import { StarIcon, SearchIcon } from './icons';

interface VenueData {
  name: string;
  address: string;
  genres: string[];
  capacity: number;
  rating: number;
  reviewCount: number;
  description: string;
  followers: number;
}

const ALL_VENUES: VenueData[] = [
  { name: 'Control Club', address: 'Str. Constantin Mille 4, Sector 1', genres: ['Techno', 'House', 'Electronic'], capacity: 400, rating: 4.7, reviewCount: 342, description: 'Underground electronic music club. Known for quality bookings and intimate atmosphere.', followers: 2841 },
  { name: 'Expirat Halele Carol', address: 'Halele Carol, Piața Libertății, Sector 4', genres: ['Techno', 'Underground', 'Experimental'], capacity: 600, rating: 4.8, reviewCount: 567, description: 'Legendary underground venue in Halele Carol complex. Raw industrial aesthetic and uncompromising sound.', followers: 4120 },
  { name: 'Nook Club', address: 'Bd. Nicolae Bălcescu 2, Sector 1', genres: ['House', 'Disco', 'Electronic'], capacity: 300, rating: 4.5, reviewCount: 218, description: 'Boutique club experience with curated lineups and a premium sound system.', followers: 1654 },
  { name: 'Club Guesthouse', address: 'Str. Batistei 14, Sector 2', genres: ['Electronic', 'Live', 'Alternative'], capacity: 500, rating: 4.4, reviewCount: 189, description: 'Multi-room venue hosting diverse events from electronic to live music.', followers: 1982 },
  { name: 'OXYA Club', address: 'Piața Victoriei, Sector 1', genres: ['Electronic', 'Techno', 'House'], capacity: 800, rating: 4.3, reviewCount: 423, description: 'Premium nightlife destination with world-class sound and production.', followers: 3340 },
  { name: 'Fratelli', address: 'Str. Gabroveni 16, Sector 3', genres: ['House', 'Commercial', 'R&B'], capacity: 600, rating: 4.1, reviewCount: 312, description: 'Trendy club in the old town with multiple floors and a rooftop terrace.', followers: 2210 },
  { name: 'Quantic Club', address: 'Bd. Magheru 12, Sector 1', genres: ['Indie', 'Jazz', 'Electronic'], capacity: 350, rating: 4.6, reviewCount: 276, description: 'The go-to spot for alternative music lovers. Eclectic programming, great cocktails.', followers: 1780 },
  { name: 'Club Eclipse', address: 'Str. Ion Câmpineanu 22, Sector 1', genres: ['EDM', 'Commercial', 'Latin'], capacity: 700, rating: 3.9, reviewCount: 445, description: 'Massive venue with state-of-the-art lighting rigs and impressive production value.', followers: 2990 },
  { name: 'Baraka', address: 'Str. Gabroveni 26, Sector 3', genres: ['Minimal', 'Techno', 'Deep House'], capacity: 250, rating: 4.5, reviewCount: 189, description: 'Intimate venue with a focus on minimal and deep electronic sounds.', followers: 1220 },
  { name: 'Midi Club', address: 'Str. Foișorului 23, Sector 3', genres: ['Drum & Bass', 'Electronic', 'Experimental'], capacity: 300, rating: 4.4, reviewCount: 134, description: 'Dedicated to experimental and underground sounds. A haven for music purists.', followers: 890 },
  { name: 'Void Club', address: 'Str. Vasile Lascăr 72, Sector 2', genres: ['Techno', 'Industrial', 'Dark'], capacity: 350, rating: 4.2, reviewCount: 167, description: 'Dark, raw, and unapologetically underground. For those who truly live the night.', followers: 1100 },
  { name: 'Fabrica', address: 'Str. Fabricii 4, Sector 6', genres: ['Alternative', 'Rock', 'Electronic'], capacity: 1000, rating: 4.3, reviewCount: 892, description: 'Creative hub turned nightlife destination. A converted factory with soul.', followers: 5670 },
];

const MOCK_REVIEWS: Record<string, { user: string; text: string; rating: number; time: string }[]> = {
  'Control Club': [
    { user: 'alex_techno', rating: 5, text: 'Best techno nights in Bucharest, no debate. The sound system is immaculate.', time: '2d ago' },
    { user: 'maria.dance', rating: 5, text: 'Intimate and underground, exactly how a club should be. Bookings are always quality.', time: '1w ago' },
    { user: 'night_owl_buc', rating: 4, text: 'Long queues sometimes but worth the wait. Crowd is always right.', time: '2w ago' },
  ],
  'Expirat Halele Carol': [
    { user: 'rave.ioana', rating: 5, text: 'The industrial space is incredible. That raw energy cannot be replicated anywhere.', time: '3d ago' },
    { user: 'bassline_stefan', rating: 5, text: 'Legendary status for a reason. Every night feels like a once-in-a-lifetime experience.', time: '1w ago' },
  ],
};

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
}

export default function VenuesPage({ onVenueClick }: VenuesPageProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [followedVenues, setFollowedVenues] = useState<Set<string>>(new Set());
  const [loadingFollows, setLoadingFollows] = useState<Set<string>>(new Set());
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [reviewInputs, setReviewInputs] = useState<Record<string, string>>({});
  const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({});
  const [venueView, setVenueView] = useState<'grid' | 'list'>('list');

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
  const allGenres = ['All', ...Array.from(new Set(ALL_VENUES.flatMap(v => v.genres))).sort()];

  const filteredVenues = ALL_VENUES.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.genres.some(g => g.toLowerCase().includes(search.toLowerCase()));
    const matchesGenre = activeFilter === 'All' || v.genres.includes(activeFilter);
    return matchesSearch && matchesGenre;
  });

  // Sort: followed first, then by rating
  const sortedVenues = [...filteredVenues].sort((a, b) => {
    const aFollowed = followedVenues.has(a.name) ? 1 : 0;
    const bFollowed = followedVenues.has(b.name) ? 1 : 0;
    if (bFollowed !== aFollowed) return bFollowed - aFollowed;
    return b.rating - a.rating;
  });

  const venueReviews = (name: string) => MOCK_REVIEWS[name] || [];

  return (
    <div className="tab-content">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="font-heading text-2xl font-bold text-white">Venues</h1>
        <p className="text-sm text-noctvm-silver mt-1">Bucharest&apos;s nightlife scene — {ALL_VENUES.length} venues</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-noctvm-surface rounded-xl border border-noctvm-border mb-4 animate-fade-in-up">
        <SearchIcon className="w-4 h-4 text-noctvm-silver flex-shrink-0" />
        <input
          type="text"
          placeholder="Search venues or genres..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-noctvm-silver/40 outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-noctvm-silver hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Genre filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-5 animate-fade-in-up stagger-2">
        {allGenres.slice(0, 12).map(genre => (
          <button
            key={genre}
            onClick={() => setActiveFilter(genre)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
              activeFilter === genre
                ? 'bg-noctvm-violet text-white shadow-lg shadow-noctvm-violet/30'
                : 'bg-noctvm-surface text-noctvm-silver border border-noctvm-border hover:border-noctvm-violet/30 hover:text-white'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* View toggle row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-noctvm-silver font-mono">{sortedVenues.length} venues</span>
        <div className="flex p-1 bg-noctvm-surface border border-noctvm-border rounded-xl shadow-inner h-[36px]">
          <button
            onClick={() => setVenueView('grid')}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${venueView === 'grid' ? 'bg-noctvm-violet text-white shadow-lg' : 'text-noctvm-silver hover:text-white'}`}
            title="Grid view"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
          </button>
          <div className="w-px h-4 bg-noctvm-border self-center mx-0.5 opacity-50" />
          <button
            onClick={() => setVenueView('list')}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${venueView === 'list' ? 'bg-noctvm-violet text-white shadow-lg' : 'text-noctvm-silver hover:text-white'}`}
            title="List view"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          </button>
        </div>
      </div>

      {/* Venues list/grid */}
      <div className={`pb-24 lg:pb-6 ${venueView === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}`}>
        {sortedVenues.map((venue, idx) => {
          const isFollowed = followedVenues.has(venue.name);
          const isLoading = loadingFollows.has(venue.name);
          const isExpanded = expandedVenue === venue.name;
          const reviews = venueReviews(venue.name);

          return venueView === 'grid' ? (
            <div
              key={venue.name}
              onClick={() => onVenueClick(venue.name)}
              className={`group bg-noctvm-surface rounded-xl border cursor-pointer hover:border-noctvm-violet/50 transition-all duration-300 hover:shadow-glow overflow-hidden h-full flex flex-col ${isFollowed ? 'border-noctvm-violet/30' : 'border-noctvm-border'}`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Venue color header */}
              <div className={`h-[100px] bg-gradient-to-br ${getVenueColor(venue.name)} relative flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20 flex items-center justify-center bg-black/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getVenueLogo(venue.name)}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      el.parentElement!.querySelector('.fallback')?.classList.remove('hidden');
                    }}
                  />
                  <span className={`fallback hidden text-2xl font-bold text-white`}>{venue.name[0]}</span>
                </div>
                {isFollowed && <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-noctvm-violet/80 text-white text-[9px] font-semibold">Following</span>}
              </div>
              {/* Info */}
              <div className="p-3 flex flex-col flex-1">
                <h3 className="font-heading font-semibold text-white text-sm leading-tight mb-1 group-hover:text-noctvm-violet transition-colors line-clamp-1">{venue.name}</h3>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <StarRating rating={venue.rating} />
                  <span className="text-[9px] text-noctvm-silver/60">{venue.rating}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-auto">
                  {venue.genres.slice(0, 2).map(g => (
                    <span key={g} className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-white/5 text-noctvm-silver/60 border border-white/5">{g}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-noctvm-border">
                  <span className="text-[9px] text-noctvm-silver/40 font-mono">Cap. {venue.capacity}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFollow(venue.name); }}
                    disabled={isLoading || !user}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${isFollowed ? 'bg-noctvm-violet/10 text-noctvm-violet' : 'bg-noctvm-midnight text-noctvm-silver border border-noctvm-border hover:border-noctvm-violet/40 hover:text-white'} disabled:opacity-40`}
                  >
                    {isLoading ? '...' : isFollowed ? 'Following' : 'Follow'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={venue.name}
              className={`bg-noctvm-surface rounded-2xl border transition-all duration-300 overflow-hidden animate-fade-in-up cursor-pointer ${
                isFollowed ? 'border-noctvm-violet/30' : 'border-noctvm-border'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={() => onVenueClick(venue.name)}
            >
              {/* Venue header row */}
              <div className="flex items-center gap-3 p-4">
                {/* Logo */}
                <div
                  className="w-14 h-14 rounded-2xl overflow-hidden border border-noctvm-border flex items-center justify-center bg-noctvm-midnight flex-shrink-0 hover:border-noctvm-violet/40 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getVenueLogo(venue.name)}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      el.parentElement!.querySelector('.fallback')?.classList.remove('hidden');
                    }}
                  />
                  <span className={`fallback hidden text-lg font-bold bg-gradient-to-br ${getVenueColor(venue.name)} bg-clip-text text-transparent`}>
                    {venue.name[0]}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-heading font-semibold text-white text-sm hover:text-noctvm-violet transition-colors truncate">{venue.name}</span>
                      {isFollowed && (
                        <span className="px-1.5 py-0.5 rounded-full bg-noctvm-violet/10 text-noctvm-violet text-[9px] font-semibold flex-shrink-0">Following</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={venue.rating} />
                    <span className="text-[10px] text-noctvm-silver/60">{venue.rating} · {venue.reviewCount} reviews</span>
                  </div>
                  <p className="text-[10px] text-noctvm-silver/50 truncate">{venue.address}</p>
                </div>

                {/* Follow button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFollow(venue.name); }}
                  disabled={isLoading || !user}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                    isFollowed
                      ? 'bg-noctvm-violet/10 text-noctvm-violet border border-noctvm-violet/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                      : 'bg-noctvm-midnight text-noctvm-silver border border-noctvm-border hover:border-noctvm-violet/40 hover:text-white'
                  } disabled:opacity-40`}
                >
                  {isLoading ? '...' : isFollowed ? 'Following' : 'Follow'}
                </button>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                {venue.genres.map(g => (
                  <span key={g} className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-noctvm-violet/8 text-noctvm-violet/70 border border-noctvm-violet/10">
                    {g}
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-noctvm-surface text-noctvm-silver/40 border border-noctvm-border ml-auto">
                  Cap. {venue.capacity}
                </span>
              </div>

              {/* Description + expand button */}
              <div className="px-4 pb-3">
                <p className="text-xs text-noctvm-silver/70 leading-relaxed">{venue.description}</p>
              </div>

              {/* Reviews toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedVenue(isExpanded ? null : venue.name); }}
                className="w-full flex items-center justify-between px-4 py-2.5 border-t border-noctvm-border text-xs text-noctvm-silver hover:text-white transition-colors"
              >
                <span>{reviews.length > 0 ? `${reviews.length} reviews` : 'No reviews yet'} · {venue.followers.toLocaleString()} followers</span>
                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7" /></svg>
              </button>

              {/* Expanded reviews section */}
              {isExpanded && (
                <div className="border-t border-noctvm-border bg-noctvm-midnight/50 animate-fade-in">
                  {reviews.length > 0 && (
                    <div className="p-4 space-y-3">
                      {reviews.map((review, ri) => (
                        <div key={ri} className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-noctvm-violet/40 to-purple-500/40 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-white">{review.user[0].toUpperCase()}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-semibold text-white">@{review.user}</span>
                              <StarRating rating={review.rating} />
                              <span className="text-[10px] text-noctvm-silver/40 ml-auto">{review.time}</span>
                            </div>
                            <p className="text-xs text-noctvm-silver/80 leading-relaxed">{review.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Write a review */}
                  {user ? (
                    <div className="p-4 border-t border-noctvm-border">
                      <p className="text-xs font-semibold text-white mb-2">Rate & Review</p>
                      {/* Star picker */}
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            onClick={(e) => { e.stopPropagation(); setReviewRatings(prev => ({ ...prev, [venue.name]: s })); }}
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
                          className="flex-1 bg-noctvm-surface text-xs text-white placeholder:text-noctvm-silver/30 outline-none px-3 py-2 rounded-lg border border-noctvm-border"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: submit review to supabase venue_reviews table
                            setReviewInputs(prev => ({ ...prev, [venue.name]: '' }));
                            setReviewRatings(prev => ({ ...prev, [venue.name]: 0 }));
                          }}
                          disabled={!reviewInputs[venue.name]?.trim() || !reviewRatings[venue.name]}
                          className="px-3 py-2 rounded-lg bg-noctvm-violet text-white text-xs font-semibold disabled:opacity-40 hover:bg-noctvm-violet/80 transition-colors"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 pb-4 pt-2 text-xs text-noctvm-silver/50">Sign in to leave a review</div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {sortedVenues.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <p className="text-white font-semibold text-sm mb-1">No venues found</p>
            <p className="text-xs text-noctvm-silver/60">Try a different search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
