'use client';

import { useState, useEffect, useMemo } from 'react';
import { SAMPLE_EVENTS } from '@/lib/events-data';
import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';
import { supabase } from '@/lib/supabase';
import { NoctEvent, Venue } from '@/lib/types';
import { buildMapVenuesForEvents } from '@/lib/map-venues';
import SidebarMap from './SidebarMap';

import LiveTonight from './LiveTonight';
import TrendingVenues from './TrendingVenues';

interface MobileTopSectionProps {
  onVenueClick: (venueName: string) => void;
  onEventClick: (event: NoctEvent) => void;
  activeCity?: 'bucuresti' | 'constanta';
  activeGenres?: string[];
  activeTab?: string;
  headerHidden?: boolean;
}

import { MapSkeleton, LiveTonightSkeleton, TrendingVenuesSkeleton } from './SkeletonLoader';

export default function MobileTopSection({ 
  onVenueClick, 
  onEventClick,
  activeCity = 'bucuresti',
  activeGenres = ['All'],
  activeTab = 'events',
  headerHidden = false
}: MobileTopSectionProps) {
  const [dbEvents, setDbEvents] = useState<NoctEvent[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [trendingVenues, setTrendingVenues] = useState<{name: string, count: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setLoading(true);
    const cityLabel = activeCity === 'bucuresti' ? 'Bucharest' : 'Constanta';
    
    // Fetch tonight's events
    const fetchEvents = supabase
      .from('events')
      .select('*')
      .eq('city', cityLabel)
      .eq('date', today)
      .order('time', { ascending: true })
      .then(({ data }) => {
        if (data) setDbEvents(data as NoctEvent[]);
      });

    // Fetch venues for map
    const fetchVenues = supabase
      .from('venues')
      .select('*')
      .eq('city', cityLabel)
      .then(({ data }) => {
        if (data) setVenues(data as Venue[]);
      });

    // Trending venues
    const fetchTrending = supabase
      .from('events')
      .select('venue')
      .eq('city', cityLabel)
      .gte('date', today)
      .then(({ data }) => {
        if (data) {
          const counts: Record<string, number> = {};
          data.forEach(ev => {
            counts[ev.venue] = (counts[ev.venue] || 0) + 1;
          });
          const sorted = Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
          setTrendingVenues(sorted);
        }
      });

    Promise.all([fetchEvents, fetchVenues, fetchTrending]).then(() => {
      setLoading(false);
    });
  }, [activeCity, today]);

  // Fallback to sample events
  const tonightEvents = dbEvents.length > 0 
    ? dbEvents 
    : SAMPLE_EVENTS.filter(e => {
        const matchesCity = e.city?.toLowerCase() === (activeCity === 'bucuresti' ? 'bucharest' : 'constanta');
        return matchesCity && e.date === today;
      });

  // Filter venues for map based on genres and events
  const mapVenues = useMemo(() => {
    let filtered = venues;
    
    // Apply genre filter if not 'All'
    if (activeGenres && !activeGenres.includes('All')) {
      filtered = venues.filter(v => 
        v.genres.some(g => activeGenres.some(ag => g.toLowerCase().includes(ag.toLowerCase())))
      );
    }

    if (activeTab === 'venues') return filtered;

    // On Events tab mobile, show coordinate-backed venues that have events tonight.
    return buildMapVenuesForEvents(tonightEvents, filtered);
  }, [venues, activeGenres, tonightEvents, activeTab]);

  return (
    <div className="lg:hidden space-y-4 mb-4 animate-fade-in relative">
      {loading ? (
        <>
          <MapSkeleton />
          <LiveTonightSkeleton />
          <TrendingVenuesSkeleton />
        </>
      ) : (
        <>
          {/* Map - wide landscape */}
          <div className="rounded-xl overflow-hidden border border-white/5 bg-noctvm-midnight/30 backdrop-blur-sm animate-fade-in-up">
            <div className="aspect-[21/9] flex items-center justify-center relative">
              <SidebarMap 
                venues={mapVenues}
                events={tonightEvents}
                activeCity={activeCity}
                activeTab={activeTab as any}
                onVenueClick={onVenueClick}
                onEventClick={onEventClick}
                headerHidden={headerHidden}
              />
            </div>
          </div>

          <LiveTonight 
            events={tonightEvents} 
            onEventClick={onEventClick} 
            headerHidden={headerHidden} 
          />

          <TrendingVenues 
            venues={trendingVenues} 
            onVenueClick={onVenueClick} 
            headerHidden={headerHidden} 
          />
        </>
      )}
    </div>
  );
}
