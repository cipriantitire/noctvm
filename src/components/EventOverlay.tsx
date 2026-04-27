'use client';

import { useState, useEffect } from 'react';
import EventModal from './EventModal';
import EventSheet from './EventSheet';
import { NoctEvent } from '@/lib/types';

interface EventOverlayProps {
  event: NoctEvent | null;
  onClose: () => void;
  onVenueClick?: (venueName: string) => void;
  onOpenAuth: () => void;
  zIndex?: number;
}

export default function EventOverlay({ event, onClose, onVenueClick, onOpenAuth, zIndex }: EventOverlayProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!event) return null;

  return isMobile 
    ? <EventSheet event={event} onClose={onClose} onVenueClick={onVenueClick} onOpenAuth={onOpenAuth} />
    : <EventModal event={event} onClose={onClose} onVenueClick={onVenueClick} onOpenAuth={onOpenAuth} zIndex={zIndex} />;
}
