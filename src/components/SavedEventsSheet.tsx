'use client';

import { useState, useEffect, useMemo } from 'react';
import { useScrollFade } from '@/hooks/useScrollFade';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
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
  onEventClick?: (event: NoctEvent) => void;
}

function SavedEventItem({ event, onEventClick }: { event: NoctEvent; onEventClick?: (event: NoctEvent) => void }) {
  const [hasError, setHasError] = useState(false);

  return (
    <button
      onClick={() => {
        if (onEventClick) {
          onEventClick(event);
          return;
        }
        window.open(event.event_url, '_blank');
      }}
      className="w-full flex items-center gap-3 p-2.5 rounded-[18px] bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all group text-left"
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
            "text-xs font-bold text-white"
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

export default function SavedEventsSheet({ userId, isOpen, onClose, activeCity = 'bucuresti', onEventClick }: SavedEventsSheetProps) {
  const [savedEvents, setSavedEvents] = useState<NoctEvent[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { ref, maskStyle } = useScrollFade('y');
  const dragControls = useDragControls();

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
    const eventsToUse = filteredEvents;
    eventsToUse.forEach(e => {
      counts[e.venue] = (counts[e.venue] || 0) + 1;
    });
    return counts;
  }, [filteredEvents]);

  const displayEvents = filteredEvents;

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
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            drag="x"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80) onClose();
            }}
            className="frosted-glass-modal fixed right-0 top-0 bottom-0 w-3/4 sm:max-w-sm z-[401] flex flex-col xl:hidden overflow-hidden border-l border-noctvm-border shadow-2xl"
            style={{
              zIndex: 401,
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              left: 'auto',
              pointerEvents: 'auto',
            }}
          >
            {/* Header */}
            <div
              className="py-5 pl-6 pr-4 flex items-center justify-between"
              onPointerDown={(event) => dragControls.start(event)}
            >
              <h3 className="text-sm font-bold capitalize tracking-wide text-white flex items-center gap-2">
                <TicketIcon className="w-4 h-4 text-noctvm-violet" />
                Your Agenda
              </h3>
              <button 
                onPointerDown={(event) => event.stopPropagation()}
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-noctvm-silver hover:text-white transition-colors"
                title="Close"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div ref={ref} style={maskStyle} className="flex-1 overflow-y-auto custom-scrollbar pl-6 pr-4 pb-6">
              {/* Map Section */}
              <div className="mt-4 w-full rounded-[22px] border border-white/10 bg-noctvm-surface/40 overflow-hidden shadow-[0_12px_34px_rgba(0,0,0,0.45)]">
                <div className="h-[188px] w-full relative">
                  <SidebarMap 
                    venues={venues}
                    events={displayEvents}
                    eventCounts={eventCounts}
                    activeCity={activeCity}
                    activeTab="profile"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-noctvm-black/90 via-noctvm-black/35 to-transparent pointer-events-none z-20" />
                </div>
              </div>

              {/* Calendar Section */}
              <div className="mt-4 w-full">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                  }}
                  className="w-full rounded-[22px]"
                  modifiers={{
                    hasEvent: eventDates
                  }}
                  modifiersClassNames={{
                    hasEvent: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-noctvm-violet after:rounded-full"
                  }}
                />
              </div>

              {/* Events ListSection */}
              <div className="mt-4 w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-noctvm-silver/60">
                      {selectedDate ? format(selectedDate, 'eee, MMM d') : 'All Saved Events'}
                    </span>
                  </div>
                  {selectedDate && (
                    <button 
                      onClick={() => setSelectedDate(undefined)}
                      className="text-[10px] font-mono uppercase tracking-tighter px-2 py-1 rounded-md transition-colors bg-white/5 hover:bg-white/10 text-noctvm-silver"
                    >
                      Show All
                    </button>
                  )}
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
                      <SavedEventItem key={event.id || i} event={event} onEventClick={onEventClick} />
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <p className="text-noctvm-micro text-noctvm-silver/40 font-medium">
                        {savedEvents.length === 0 ? 'No saved events yet' : (selectedDate ? 'No events for this date' : 'No saved events found')}
                      </p>
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
