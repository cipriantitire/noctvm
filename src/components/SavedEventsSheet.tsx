'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { NoctEvent, Venue } from '@/lib/types';
import SidebarMap from './SidebarMap';
import { Calendar } from '@/components/ui/Calendar';
import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';
import { format, isSameDay, parseISO } from 'date-fns';
import { MapPinIcon, TicketIcon, XIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import NextImage from 'next/image';

interface SavedEventsSheetProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  activeCity?: 'bucuresti' | 'constanta';
}

function SavedEventItem({ event }: { event: NoctEvent }) {
  const [hasError, setHasError] = useState(false);

  return (
    <button
      onClick={() => window.open(event.event_url, '_blank')}
      className="w-full flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all group text-left"
    >
      <div className="w-10 h-10 rounded-full border border-noctvm-border bg-noctvm-midnight flex items-center justify-center flex-shrink-0 overflow-hidden relative">
        {!hasError ? (
          <NextImage 
            src={getVenueLogo(event.venue)} 
            alt={event.venue} 
            fill
            className="object-cover" 
            unoptimized
            onError={() => setHasError(true)}
          />
        ) : (
          <span className={cn(
            "text-xs font-bold bg-gradient-to-br bg-clip-text text-transparent",
            getVenueColor(event.venue)
          )}>
            {event.venue[0]}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{event.title}</p>
        <p className="text-[10px] text-noctvm-silver flex items-center gap-1 opacity-60">
          <MapPinIcon className="w-2.5 h-2.5" />
          {event.venue}
        </p>
      </div>
      <ChevronRightIcon className="w-4 h-4 text-noctvm-silver/20" />
    </button>
  );
}

export default function SavedEventsSheet({ userId, isOpen, onClose, activeCity = 'bucuresti' }: SavedEventsSheetProps) {
  const [savedEvents, setSavedEvents] = useState<NoctEvent[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!userId || !isOpen) return;

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
          
          if (venuesData) setVenues(venuesData as Venue[]);
        }
      }
      setLoading(false);
    }

    fetchData();
  }, [userId, isOpen]);

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

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] xl:hidden"
          />

          {/* Sheet Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80) onClose();
            }}
            className="fixed right-0 top-0 bottom-0 w-[85%] sm:w-80 bg-noctvm-black border-l border-white/10 z-[401] flex flex-col xl:hidden overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-white/5 bg-noctvm-midnight/50 backdrop-blur-md">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <TicketIcon className="w-4 h-4 text-noctvm-violet" />
                Your Agenda
              </h3>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-noctvm-silver"
                title="Close"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Map Section */}
              <div className="h-[180px] w-full relative">
                <SidebarMap 
                  venues={venues}
                  events={displayEvents}
                  eventCounts={eventCounts}
                  activeCity={activeCity}
                  activeTab="profile"
                />
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-noctvm-black to-transparent pointer-events-none z-20" />
              </div>

              {/* Calendar Section */}
              <div className={cn("p-5 pt-2 transition-all duration-300", showAll && "opacity-40 grayscale pointer-events-none")}>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (showAll) setShowAll(false);
                  }}
                  className="w-full bg-transparent border-0"
                  modifiers={{
                    hasEvent: eventDates
                  }}
                  modifiersClassNames={{
                    hasEvent: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-noctvm-violet after:rounded-full"
                  }}
                />
              </div>

              {/* Events ListSection */}
              <div className="px-5 pb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-noctvm-silver/60">
                      {showAll ? 'All Saved Events' : (selectedDate ? format(selectedDate, 'eee, MMM d') : 'Saved Events')}
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowAll(!showAll)}
                    className={cn(
                       "text-[10px] font-mono uppercase tracking-tighter px-2 py-1 rounded-md transition-colors",
                       showAll ? "bg-noctvm-violet text-white" : "bg-white/5 hover:bg-white/10 text-noctvm-silver"
                    )}
                  >
                    {showAll ? 'By Date' : 'Show All'}
                  </button>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5" />
                        <div className="flex-1 space-y-2">
                          <div className="h-2 bg-white/5 rounded" />
                        </div>
                      </div>
                    ))
                  ) : displayEvents.length > 0 ? (
                    displayEvents.map((event, i) => (
                      <SavedEventItem key={event.id || i} event={event} />
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <p className="text-noctvm-micro text-noctvm-silver/40 font-medium">No events for this date</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
