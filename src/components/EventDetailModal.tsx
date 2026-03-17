'use client';

import { useState, useEffect, useCallback } from 'react';
import { NoctEvent } from '@/lib/types';
import { CalendarIcon, StarIcon, TicketIcon } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import VerifiedBadge from './VerifiedBadge';

interface EventDetailModalProps {
  event: NoctEvent | null;
  onClose: () => void;
  onVenueClick?: (venueName: string) => void;
  onOpenAuth: () => void;
  zIndex?: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

function isRealEvent(id: string | undefined): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function getSourceBadge(source: string) {
  switch (source) {
    case 'fever':       return { label: 'Fever',         color: 'bg-orange-500/15 text-orange-400 border-white/10' };
    case 'ra':          return { label: 'RA',             color: 'bg-[#FF4848]/15 text-[#FF4848] border-white/10' };
    case 'eventbook':   return { label: 'Eventbook',      color: 'bg-[#E01539]/15 text-[#E01539] border-white/10' };
    case 'livetickets': return { label: 'LiveTickets',    color: 'bg-pink-500/15 text-pink-400 border-white/10' };
    case 'iabilet':     return { label: 'iaBilet',        color: 'bg-cyan-500/15 text-cyan-400 border-white/10' };
    case 'beethere':    return { label: 'BeeThere',       color: 'bg-yellow-500/15 text-yellow-400 border-white/10' };
    case 'zilesinopti': return { label: 'Zile și Nopți',  color: 'bg-amber-500/15 text-amber-400 border-white/10' };
    case 'onevent':     return { label: 'OnEvent',         color: 'bg-violet-500/15 text-violet-400 border-white/10' };
    case 'ambilet':     return { label: 'Ambilet',         color: 'bg-teal-500/15 text-teal-400 border-white/10' };
    default:            return { label: source,            color: 'bg-noctvm-silver/15 text-noctvm-silver border-white/10' };
  }
}

export default function EventDetailModal({ 
  event, 
  onClose, 
  onVenueClick, 
  onOpenAuth,
  zIndex = 200
}: EventDetailModalProps) {
  const { user } = useAuth();
  const [descExpanded, setDescExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [saveCount, setSaveCount]     = useState(0);
  const [isSaved,   setIsSaved]       = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [venueBadge, setVenueBadge] = useState<'none' | 'owner' | 'admin' | 'gold' | 'verified'>('none');
  const handleClose = useCallback(() => setIsClosing(true), []);

  useEffect(() => {
    if (!event) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [event, handleClose]);

  useEffect(() => {
    if (!event || !isRealEvent(event.id)) { setSaveCount(0); setIsSaved(false); return; }
    const eventId = event.id;

    // Initial fetch
    supabase
      .from('event_saves')
      .select('id, user_id', { count: 'exact' })
      .eq('event_id', eventId)
      .then(({ data, count }) => {
        setSaveCount(count ?? 0);
        if (user) setIsSaved((data ?? []).some((r: any) => r.user_id === user.id));
      });

    // Real-time subscription
    const channel = supabase
      .channel(`event_saves_${eventId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'event_saves',
        filter: `event_id=eq.${eventId}`,
      }, async () => {
        const { data, count } = await supabase
          .from('event_saves')
          .select('id, user_id', { count: 'exact' })
          .eq('event_id', eventId);
        setSaveCount(count ?? 0);
        if (user) setIsSaved((data ?? []).some((r: any) => r.user_id === user.id));
      })
      .subscribe();

    // Fetch venue badge
    supabase
      .from('venues')
      .select('badge')
      .eq('name', event.venue)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setVenueBadge(data.badge as any);
        else setVenueBadge('none');
      });

    return () => { supabase.removeChannel(channel); };
  }, [event, user]);

  const handleSave = async () => {
    if (!user) { onOpenAuth(); return; }
    if (!event || !isRealEvent(event.id) || saveLoading) return;
    const eventId = event.id;
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    setSaveCount(c => newSaved ? c + 1 : Math.max(0, c - 1));
    setSaveLoading(true);
    try {
      if (isSaved) {
        await supabase.from('event_saves').delete().eq('event_id', eventId).eq('user_id', user.id);
      } else {
        await supabase.from('event_saves').insert({ event_id: eventId, user_id: user.id });
      }
    } catch {
      setIsSaved(isSaved);
      setSaveCount(c => newSaved ? Math.max(0, c - 1) : c + 1);
    } finally {
      setSaveLoading(false);
    }
  };

  if (!event) return null;

  const sourceBadge = getSourceBadge(event.source);
  const hasPrice = event.price && event.price.toLowerCase() !== 'free';
  const isFree = event.price?.toLowerCase() === 'free';

  return (
    <>
    {/* Image lightbox */}
    {lightboxOpen && (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 cursor-zoom-out"
        onClick={() => setLightboxOpen(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.image_url || '/images/event-fallback.png'}
          alt={event.title}
          className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
          onClick={e => e.stopPropagation()}
          onError={(e) => { (e.target as HTMLImageElement).src = '/images/event-fallback.png'; }}
        />
        <button
          onClick={() => setLightboxOpen(false)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
    )}

    <div
      className={`fixed inset-0 flex items-center justify-center p-0 sm:p-4 lg:p-8 ${isClosing ? 'animate-fade-out' : ''}`}
      style={{ zIndex }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={handleClose} />

      {/* Modal - Z-INDEX 200 to be above VenuePage (100) */}
      <div
        className={`relative w-full h-full sm:w-[560px] sm:h-auto sm:max-h-[90vh] sm:rounded-3xl overflow-hidden flex flex-col ${isClosing ? 'animate-scale-out' : 'animate-scale-in'} shadow-2xl shadow-black/60 border border-white/10 frosted-glass-modal frosted-noise`}
        style={{ zIndex: (zIndex || 200) + 1 }}
        onClick={e => e.stopPropagation()}
        onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
      >
        {/* Hero image */}
        <div className="relative flex-shrink-0 h-[260px] sm:h-[300px] bg-noctvm-black overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image_url || '/images/event-fallback.png'}
            alt={event.title}
            className="w-full h-full object-cover cursor-zoom-in"
            onClick={() => (event.image_url || true) && setLightboxOpen(true)}
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/event-fallback.png'; }}
          />
          {/* Close button */}
          <button
            onClick={handleClose}
            title="Close modal"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-noctvm-silver hover:text-white hover:bg-black/80 transition-all z-10"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Absolute floating elements positioned relative to modal but outside hero container to avoid clipping shadows */}
        <div className="absolute top-0 left-0 right-0 h-[260px] sm:h-[300px] pointer-events-none">
          {/* Source badge (ticket platform) — clickable link */}
          <a
            href={event.event_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className={`absolute top-4 left-4 pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight ${sourceBadge.color} backdrop-blur-md border z-10 hover:scale-105 transition-transform`}
          >
            <TicketIcon className="w-3 h-3" />
            {sourceBadge.label}
          </a>

          {/* Price badge on image */}
          {(hasPrice || isFree) && (
            <div className="absolute bottom-4 right-4 z-10 pointer-events-auto flex flex-col items-end gap-2">
              <a
                href={event.ticket_url && !event.ticket_url.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|woff2?|pdf|ico|php|xml)(\?|#|$)/i) && !event.ticket_url.includes('/assets/') && !event.ticket_url.includes('/css/') && !event.ticket_url.includes('x.com') && !event.ticket_url.includes('twitter.com') && !event.ticket_url.includes('facebook.com') && !event.ticket_url.includes('xmlrpc') ? event.ticket_url : event.event_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight bg-emerald-500/15 text-emerald-300 backdrop-blur-md border border-white/10 hover:scale-105 transition-transform"
              >
                {isFree ? 'FREE' : event.price}
              </a>
            </div>
          )}
        </div>


          {event.rating && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/10 z-10">
              <StarIcon className="w-3.5 h-3.5 text-noctvm-gold" />
              <span className="text-sm font-bold text-noctvm-gold">{event.rating}</span>
              {event.reviews && <span className="text-[10px] text-noctvm-silver/60">({event.reviews} reviews)</span>}
            </div>
          )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Genres */}
          <div className="flex flex-wrap gap-1.5">
            {event.genres.map(genre => (
              <span key={genre} className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold bg-white/5 text-noctvm-silver/70 border border-white/5 tracking-wide">
                {genre}
              </span>
            ))}
          </div>

          {/* Title */}
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-white leading-tight">
            {event.title}
          </h2>

          {/* Venue */}
          {onVenueClick ? (
            <button
              onClick={(e) => { e.stopPropagation(); onVenueClick(event.venue); }}
              className="flex items-center gap-1.5 text-noctvm-violet font-medium text-sm hover:underline text-left"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.953-5.158 3.953-9.077A8.223 8.223 0 0012 2.25a8.223 8.223 0 00-8.22 7.97c0 3.92 2.01 6.998 3.954 9.077a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span>{event.venue}</span>
              {venueBadge !== 'none' && <VerifiedBadge type={venueBadge} size="xs" />}
            </button>
          ) : (
            <p className="flex items-center gap-1.5 text-noctvm-violet font-medium text-sm">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.953-5.158 3.953-9.077A8.223 8.223 0 0012 2.25a8.223 8.223 0 00-8.22 7.97c0 3.92 2.01 6.998 3.954 9.077a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span>{event.venue}</span>
              {venueBadge !== 'none' && <VerifiedBadge type={venueBadge} size="xs" />}
            </p>
          )}

          {/* Date + Time */}
          <div className="flex items-center gap-3 text-noctvm-silver/80">
            <div className="w-9 h-9 rounded-xl bg-noctvm-surface border border-noctvm-border flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="w-4 h-4 text-noctvm-violet" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{formatDate(event.date)}</p>
              {event.time && <p className="text-xs text-noctvm-violet font-mono">{event.time}</p>}
            </div>
            <button
              onClick={handleSave}
              disabled={saveLoading || !isRealEvent(event?.id ?? '')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isSaved
                  ? 'bg-noctvm-violet/20 text-noctvm-violet border-noctvm-violet/40'
                  : 'bg-black/40 text-noctvm-silver border-white/10 hover:border-noctvm-violet/30 hover:text-noctvm-violet'
              } ${!isRealEvent(event?.id ?? '') ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              <span>{saveCount}</span>
            </button>
          </div>

          {/* Description */}
          {event.description && (
            <div className="pt-1">
              <div className="w-full h-px bg-noctvm-border mb-3" />
              <p className={`text-sm text-noctvm-silver/80 leading-relaxed ${!descExpanded ? 'line-clamp-[15]' : ''}`}>
                {event.description}
              </p>
              {event.description.length > 800 && (
                <button
                  onClick={() => setDescExpanded(prev => !prev)}
                  className="mt-1.5 text-xs text-noctvm-violet hover:text-noctvm-violet/80 font-medium transition-colors"
                >
                  {descExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* CTA footer */}
        <div className="px-5 pb-6 pt-3 border-t border-noctvm-border bg-noctvm-midnight flex-shrink-0">
          <a
            href={event.ticket_url && !event.ticket_url.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|woff2?|pdf|ico|php|xml)(\?|#|$)/i) && !event.ticket_url.includes('/assets/') && !event.ticket_url.includes('/css/') && !event.ticket_url.includes('x.com') && !event.ticket_url.includes('twitter.com') && !event.ticket_url.includes('facebook.com') && !event.ticket_url.includes('xmlrpc') ? event.ticket_url : event.event_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-noctvm-violet to-purple-500 text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-noctvm-violet/30"
          >
            <TicketIcon className="w-4 h-4" />
            Get Tickets on {sourceBadge.label}
          </a>
          <p className="text-center text-[10px] text-noctvm-silver/40 mt-2">Opens {sourceBadge.label} in a new tab</p>
        </div>
      </div>
    </div>
    </>
  );
}
