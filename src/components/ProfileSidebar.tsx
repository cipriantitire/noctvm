'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { NoctEvent, Venue } from '@/lib/types';
import SidebarMap from './SidebarMap';
import { Calendar } from '@/components/ui/Calendar';
import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';
import { format, isSameDay, parseISO } from 'date-fns';
import { CalendarIcon, MapPinIcon, TicketIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useScrollFade } from '@/hooks/useScrollFade';
import NextImage from 'next/image';

interface ProfileSidebarProps {
  userId: string;
  activeCity?: 'bucuresti' | 'constanta';
}

function SavedEventItem({ event }: { event: NoctEvent }) {
  const [hasError, setHasError] = useState(false);

  return (
    <button
      type="button"
      onClick={() => window.open(event.event_url, '_blank')}
      className="w-full flex items-center gap-4 p-3 rounded-xl bg-noctvm-midnight/40 border border-white/5 hover:border-noctvm-violet/40 hover:bg-noctvm-midnight/60 transition-all duration-500 group text-left relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-glow-violet opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="w-12 h-12 rounded-lg border border-white/10 bg-noctvm-black flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:border-noctvm-violet/30 transition-all duration-500 relative z-10">
        {!hasError ? (
          <NextImage 
            src={getVenueLogo(event.venue)} 
            alt={event.venue} 
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
            unoptimized
            onError={() => setHasError(true)}
          />
        ) : (
          <span className={cn(
            "text-sm font-mono font-bold text-white"
          )}>
            {event.venue[0]}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 relative z-10">
        <p className="text-noctvm-caption font-bold text-noctvm-silver group-hover:text-white transition-colors leading-tight">
          {event.title}
        </p>
        <p className="text-noctvm-micro font-mono text-noctvm-silver/40 flex items-center gap-1 mt-1 uppercase tracking-wider">
          {event.venue}
        </p>
      </div>

      <div className="w-6 h-6 rounded-full border border-white/5 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:border-noctvm-violet/30 transition-all z-10">
        <ChevronRightIcon className="w-3 h-3 text-noctvm-silver" />
      </div>
    </button>
  );
}

export default function ProfileSidebar({ userId, activeCity = 'bucuresti' }: ProfileSidebarProps) {
  const [savedEvents, setSavedEvents] = useState<NoctEvent[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!userId) return;

    async function fetchData() {
      setLoading(true);
      
      const { data: savesData } = await supabase
        .from('event_saves')
        .select('event_id, events(*)')
        .eq('user_id', userId);

      if (savesData) {
        const events = savesData
          .map((s: any) => s.events)
          .filter(Boolean) as NoctEvent[];
        setSavedEvents(events);

        const venueNames = Array.from(new Set(events.map(e => e.venue)));
        if (venueNames.length > 0) {
          const { data: venuesData } = await supabase
            .from('venues')
            .select('*')
            .in('name', venueNames);
          
          if (venuesData) {
            setVenues(venuesData as Venue[]);
          }
        }
      }
      setLoading(false);
    }

    fetchData();
  }, [userId]);

  const filteredEvents = useMemo(() => {
    if (!selectedDate) return savedEvents;
    return savedEvents.filter(event => {
      try {
        return isSameDay(parseISO(event.date), selectedDate);
      } catch {
        return false;
      }
    });
  }, [savedEvents, selectedDate]);

  const eventDates = useMemo(() => {
    return savedEvents.map(e => parseISO(e.date));
  }, [savedEvents]);

  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const eventsToUse = showAll ? savedEvents : filteredEvents;
    eventsToUse.forEach(e => {
      counts[e.venue] = (counts[e.venue] || 0) + 1;
    });
    return counts;
  }, [savedEvents, filteredEvents, showAll]);

  const displayEvents = showAll ? savedEvents : filteredEvents;
  const { ref: scrollRef, maskStyle } = useScrollFade('y');

  return (
    <aside className="hidden xl:flex flex-col w-80 h-screen sticky top-0 rounded-l-2xl frosted-glass-subtle border-l border-white/5 overflow-hidden font-body z-40">
      <div className="p-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-noctvm-silver/40 mb-1">
              Agenda
            </h3>
            <h2 className="text-xl font-heading font-black text-white leading-none">
              Saved Events
            </h2>
          </div>
          <span className="text-noctvm-2xl font-mono font-black text-noctvm-violet leading-none">
            {savedEvents.length.toString().padStart(2, '0')}
          </span>
        </div>

        <div className="rounded-xl overflow-hidden mb-6 border border-noctvm-border h-[200px]">
          <SidebarMap
            venues={venues}
            events={displayEvents}
            eventCounts={eventCounts}
            activeCity={activeCity}
            activeTab="profile"
          />
        </div>

        <div className={cn("mb-6 transition-all duration-300", showAll && "opacity-40 grayscale pointer-events-none")}>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              if (showAll) setShowAll(false);
            }}
            className="border-0 pointer-events-auto"
            modifiers={{
              hasEvent: eventDates
            }}
            modifiersClassNames={{
              hasEvent: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-noctvm-violet after:rounded-full"
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col px-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-noctvm-caption font-mono font-bold uppercase tracking-[0.1em] text-noctvm-silver/60">
            {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'All Events'}
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div ref={scrollRef} style={maskStyle} className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-6 pr-1">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-2 w-3/4 bg-white/5 rounded" />
                  <div className="h-2 w-1/2 bg-white/5 rounded" />
                </div>
              </div>
            ))
          ) : displayEvents.length > 0 ? (
            displayEvents.map((event, i) => (
              <SavedEventItem key={event.id || i} event={event} />
            ))
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center px-4">
              <div className="p-3 rounded-full bg-white/5 mb-3">
                <CalendarIcon className="w-5 h-5 text-noctvm-silver/20" />
              </div>
              <p className="text-noctvm-micro text-noctvm-silver/40 font-medium">
                No events saved for this date
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
