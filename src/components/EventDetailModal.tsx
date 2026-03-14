'use client';

import { useState, useEffect, useCallback } from 'react';
import { NoctEvent } from '@/lib/types';
import { CalendarIcon, StarIcon, TicketIcon } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface EventDetailModalProps {
  event: NoctEvent | null;
  onClose: () => void;
  onVenueClick?: (venueName: string) => void;
  onOpenAuth: () => void;
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
    case 'fever':       return { label: 'Fever',        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    case 'ra':          return { label: 'Resident Advisor', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    case 'livetickets': return { label: 'LiveTickets',  color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' };
    case 'iabilet':     return { label: 'iaBilet',      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
    case 'beethere':    return { label: 'BeeThere',     color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    case 'zilesinopti': return { label: 'Zile și Nopți',color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    case 'onevent':     return { label: 'OnEvent',       color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' };
    case 'ambilet':     return { label: 'Ambilet',       color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' };
    default:            return { label: source,          color: 'bg-noctvm-silver/20 text-noctvm-silver border-noctvm-border' };
  }
}

export default function EventDetailModal({ event, onClose, onVenueClick, onOpenAuth }: EventDetailModalProps) {
  const { user } = useAuth();
  const [descExpanded, setDescExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [saveCount, setSaveCount]     = useState(0);
  const [isSaved,   setIsSaved]       = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
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
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 lg:p-8 ${isClosing ? 'animate-fade-out' : ''}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={handleClose} />

      {/* Modal */}
      <div
        className={`relative w-full h-full sm:w-[560px] sm:h-auto sm:max-h-[90vh] bg-noctvm-midnight sm:rounded-2xl overflow-hidden flex flex-col ${isClosing ? 'animate-scale-out' : 'animate-scale-in'} shadow-2xl shadow-black/60 border border-noctvm-border`}
        onClick={e => e.stopPropagation()}
        onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
      >
        {/* Hero image */}
        <div className="relative flex-shrink-0 h-[260px] sm:h-[300px] bg-noctvm-black overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-noctvm-midnight via-noctvm-midnight/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-noctvm-silver hover:text-white hover:bg-black/80 transition-all z-10"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>

          {/* Source badge (ticket platform) — clickable link */}
          <a
            href={event.event_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight ${sourceBadge.color} backdrop-blur-md border z-10 hover:scale-105 transition-transform`}
          >
            <TicketIcon className="w-3 h-3" />
            {sourceBadge.label}
          </a>

          {/* Price badge on image */}
          {(hasPrice || isFree) && (
            <a
              href={event.event_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="absolute bottom-4 right-4 flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold liquid-glass-price z-10 hover:scale-105 transition-all text-white"
            >
              <div className="relative z-10">{isFree ? 'FREE' : event.price}</div>
            </a>
          )}

          {/* Rating */}
          {event.rating && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/10 z-10">
              <StarIcon className="w-3.5 h-3.5 text-noctvm-gold" />
              <span className="text-sm font-bold text-noctvm-gold">{event.rating}</span>
              {event.reviews && <span className="text-[10px] text-noctvm-silver/60">({event.reviews} reviews)</span>}
            </div>
          )}
        </div>

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
              className="text-noctvm-violet font-medium text-sm hover:underline text-left"
            >
              @ {event.venue}
            </button>
          ) : (
            <p className="text-noctvm-violet font-medium text-sm">@ {event.venue}</p>
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
              <p className={`text-sm text-noctvm-silver/80 leading-relaxed ${!descExpanded ? 'line-clamp-4' : ''}`}>
                {event.description}
              </p>
              {event.description.length > 200 && (
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
            href={event.event_url}
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
  );
}
