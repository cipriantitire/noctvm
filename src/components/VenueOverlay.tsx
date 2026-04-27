'use client';

import { useState, useEffect, useCallback } from 'react';
import { NoctEvent } from '@/lib/types';
import VenueModal from './VenueModal';
import VenueSheet from './VenueSheet';

interface VenueOverlayProps {
  venueName: string;
  onBack: () => void;
  onClose?: () => void;
  onEventClick?: (event: NoctEvent) => void;
  zIndex?: number;
  eventZIndex?: number;
}

export default function VenueOverlay({ 
  venueName, 
  onBack, 
  onClose, 
  onEventClick,
  zIndex = 100,
  eventZIndex = 200,
}: VenueOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [venueClosing, setVenueClosing] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleCloseVenue = useCallback(() => {
    setVenueClosing(true);
  }, []);

  const handleAnimationEnd = useCallback(() => {
    if (!venueClosing) return;
    setVenueClosing(false);
    onBack();
    onClose?.();
    if (typeof window !== 'undefined' && window.location.search.includes('venue=')) {
      window.history.back();
    }
  }, [venueClosing, onBack, onClose]);

  if (isMobile) {
    return (
      <VenueSheet 
        venueName={venueName} 
        onBack={onBack} 
        onClose={onClose} 
        onEventClick={onEventClick} 
      />
    );
  }

  return (
    <div 
      className={`fixed inset-0 flex sm:items-center sm:justify-center p-0 sm:p-4 lg:p-8 ${zIndex >= eventZIndex ? 'z-[210]' : 'z-[200]'}`}
    >
      <div 
        className={`absolute inset-0 bg-noctvm-black/70 backdrop-blur-md backdrop-enter ${venueClosing ? 'animate-fade-out' : ''}`} 
        onClick={handleCloseVenue} 
      />
      <div
        className={`relative w-full h-full sm:h-auto sm:max-h-[95vh] sm:w-[95%] lg:w-[90%] lg:h-[92%] sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col min-h-0 corner-smooth ${
          venueClosing ? 'animate-scale-out' : 'animate-scale-in'
        } border-0 sm:border border-white/10 frosted-glass-modal frosted-noise`}
        onAnimationEnd={handleAnimationEnd}
      >
        <VenueModal
          venueName={venueName}
          onBack={handleCloseVenue}
          onClose={onClose}
          onEventClick={onEventClick}
          zIndex={zIndex}
        />
      </div>
    </div>
  );
}
