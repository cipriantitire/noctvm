import React, { useState, useEffect } from 'react';
import { NoctEvent } from '@/lib/types';
import { CalendarIcon, StarIcon } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { imageBadgeChrome, imagePriceBadgeClass, imageRatingBadgeClass } from '@/lib/eventImageBadgeStyles';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

function getSourceBadge(source: string) {
  switch (source) {
    case 'controlclub': return { label: 'Control Club', color: `bg-zinc-950/85 text-zinc-100 border-zinc-300/30 ${imageBadgeChrome}` };
    case 'clubguesthouse': return { label: 'GH', color: `bg-zinc-950/85 text-zinc-100 border-zinc-300/30 ${imageBadgeChrome}` };
    case 'fever':       return { label: 'Fever',         color: `bg-orange-950/85 text-orange-200 border-orange-300/30 ${imageBadgeChrome}` };
    case 'emagic':      return { label: 'Emagic',        color: `bg-emerald-950/85 text-emerald-200 border-emerald-300/30 ${imageBadgeChrome}` };
    case 'ra':          return { label: 'RA',             color: `bg-red-950/85 text-[#FF8A8A] border-red-300/30 ${imageBadgeChrome}` };
    case 'eventbook':   return { label: 'Eventbook',      color: `bg-rose-950/85 text-[#FF7A8F] border-rose-300/30 ${imageBadgeChrome}` };
    case 'livetickets': return { label: 'LiveTickets',    color: `bg-pink-950/85 text-pink-200 border-pink-300/30 ${imageBadgeChrome}` };
    case 'iabilet':     return { label: 'iaBilet',        color: `bg-cyan-950/85 text-cyan-200 border-cyan-300/30 ${imageBadgeChrome}` };
    case 'beethere':    return { label: 'BeeThere',       color: `bg-yellow-950/85 text-yellow-200 border-yellow-300/30 ${imageBadgeChrome}` };
    case 'zilesinopti': return { label: 'Zile si Nopti',  color: `bg-amber-950/85 text-amber-200 border-amber-300/30 ${imageBadgeChrome}` };
    case 'onevent':     return { label: 'OnEvent',         color: `bg-violet-950/85 text-violet-200 border-violet-300/30 ${imageBadgeChrome}` };
    case 'ambilet':     return { label: 'Ambilet',         color: `bg-teal-950/85 text-teal-200 border-teal-300/30 ${imageBadgeChrome}` };
    default:            return { label: source,            color: `bg-zinc-950/85 text-noctvm-silver border-zinc-300/30 ${imageBadgeChrome}` };
  }
}

function isRealEvent(id: string | undefined): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

interface EventCardProps {
  event: NoctEvent;
  variant?: 'portrait' | 'landscape';
  onClick?: (event: NoctEvent) => void;
  onSaveRequireAuth?: () => void;
  saveState?: {
    isSaved: boolean;
    saveCount: number;
  };
  onSaveStateChange?: (eventId: string, state: { isSaved: boolean; saveCount: number }) => void;
}

function EventCard({ event, variant = 'portrait', onClick, onSaveRequireAuth, saveState, onSaveStateChange }: EventCardProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);

  const sourceBadge = getSourceBadge(event.source);
  const badgeLink = event.event_url || undefined;

  const isValidTicketUrl = event.ticket_url && !event.ticket_url.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|woff2?|pdf|ico|php|xml)(\?|#|$)/i) && !event.ticket_url.includes('/assets/') && !event.ticket_url.includes('/css/') && !event.ticket_url.includes('x.com') && !event.ticket_url.includes('twitter.com') && !event.ticket_url.includes('facebook.com') && !event.ticket_url.includes('xmlrpc');
  const priceLink = isValidTicketUrl ? event.ticket_url || undefined : event.event_url;

  const real = isRealEvent(event.id);
  const isSaveStateControlled = saveState !== undefined;
  const currentIsSaved = saveState?.isSaved ?? isSaved;
  const currentSaveCount = saveState?.saveCount ?? saveCount;
  const applySaveState = (nextState: { isSaved: boolean; saveCount: number }) => {
    if (isSaveStateControlled) {
      onSaveStateChange?.(event.id, nextState);
      return;
    }

    setIsSaved(nextState.isSaved);
    setSaveCount(nextState.saveCount);
  };

  // Fetch save count + user's saved state
  useEffect(() => {
    if (isSaveStateControlled) {
      return;
    }

    if (!real) {
      setSaveCount(0);
      setIsSaved(false);
      return;
    }
    
    const fetchSaveData = async () => {
      try {
        const { data, count } = await supabase
          .from('event_saves')
          .select('id, user_id', { count: 'exact' })
          .eq('event_id', event.id);
        
        setSaveCount(count ?? 0);
        if (user) setIsSaved((data ?? []).some((r: { user_id: string }) => r.user_id === user.id));
      } catch (err) {
        console.warn('Error fetching save data for card:', event.id);
      }
    };

    fetchSaveData();
  }, [event.id, user, real, isSaveStateControlled]);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { onSaveRequireAuth?.(); return; }
    if (saveLoading) return;
    
    // If it's a sample event, it can't be saved to DB (foreign key constraint)
    if (!real) {
      // Just toggle local state for UI demo purposes if it's a sample event
      applySaveState({
        isSaved: !currentIsSaved,
        saveCount: !currentIsSaved ? currentSaveCount + 1 : Math.max(0, currentSaveCount - 1),
      });
      return;
    }

    const previousState = {
      isSaved: currentIsSaved,
      saveCount: currentSaveCount,
    };
    const nextState = {
      isSaved: !currentIsSaved,
      saveCount: !currentIsSaved ? currentSaveCount + 1 : Math.max(0, currentSaveCount - 1),
    };

    applySaveState(nextState);
    setSaveLoading(true);
    try {
      if (currentIsSaved) {
        await supabase.from('event_saves').delete().eq('event_id', event.id).eq('user_id', user.id);
      } else {
        await supabase.from('event_saves').insert({ event_id: event.id, user_id: user.id });
      }
    } catch (err) {
      console.error('Error saving event:', err);
      // Revert on error
      applySaveState(previousState);
    } finally {
      setSaveLoading(false);
    }
  };

  const bookmarkButton = (
    <button
      onClick={handleSave}
      disabled={saveLoading}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-200 ${
        currentIsSaved 
          ? 'bg-noctvm-violet/20 text-noctvm-violet border border-noctvm-violet/30' 
          : 'bg-white/5 text-noctvm-silver/50 hover:bg-white/10 hover:text-white border border-white/5'
      } active:scale-[0.96]`}
      title={currentIsSaved ? 'Remove from saved' : 'Save event'}
    >
      <svg
        className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${currentIsSaved ? 'scale-110' : ''}`}
        viewBox="0 0 24 24"
        fill={currentIsSaved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
      <span className="text-noctvm-caption font-bold font-mono tabular-nums tracking-tight">{currentSaveCount}</span>
    </button>
  );

  const getPriceBadge = () => {
    if (!event.price) return null;
    const isFree = event.price.toLowerCase() === 'free';
    const display = isFree ? 'FREE' : event.price;

    return (
      <a
        href={priceLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="absolute bottom-3 right-3 z-30 group/price"
      >
        <div className={`flex items-center px-2 py-1 rounded-lg text-noctvm-caption font-bold uppercase tracking-tight backdrop-blur-md border hover:scale-105 transition-transform ${imagePriceBadgeClass}`}>
          {display}
        </div>
      </a>
    );
  };

  const ratingBadge = event.rating && (
    <div className={`absolute ${event.price ? 'top-2.5 right-2.5' : 'bottom-2.5 right-2.5'} flex items-center gap-1 backdrop-blur-sm rounded-lg px-2 py-1 border z-20 ${imageRatingBadgeClass}`}>
      <StarIcon className="w-3 h-3 text-noctvm-gold" />
      <span className="text-xs font-bold text-noctvm-gold">{event.rating}</span>
    </div>
  );

  const Wrapper = onClick
    ? ({ children, className }: { children: React.ReactNode; className: string }) => (
        <div role="button" tabIndex={0} className={className} onClick={() => onClick(event)} onKeyDown={e => e.key === 'Enter' && onClick(event)}>
          {children}
        </div>
      )
    : ({ children, className }: { children: React.ReactNode; className: string }) => (
        <a href={event.event_url} target="_blank" rel="noopener noreferrer" className={className}>
          {children}
        </a>
      );

  if (variant === 'landscape') {
    return (
      <Wrapper className="group event-card-liquid flex rounded-xl corner-smooth overflow-hidden transition-all duration-300 h-[160px] lg:h-[180px] cursor-pointer">
        <div className="relative w-[180px] sm:w-[240px] flex-shrink-0 overflow-hidden bg-noctvm-midnight">
            <Image
              src={event.image_url || '/images/event-fallback.png'}
              alt={event.title}
              fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 image-outline-dark"
          sizes="(max-width: 640px) 180px, 240px"
              priority={false}
              unoptimized
            />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Source badge — links to platform or venue */}
          <a
            href={badgeLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className={`absolute top-2.5 left-2.5 z-20 px-2 py-1 rounded-lg text-noctvm-caption font-bold uppercase tracking-tight ${sourceBadge.color} backdrop-blur-md border hover:scale-105 transition-transform`}
          >
            {sourceBadge.label === 'Control Club' ? 'CTRL' : sourceBadge.label}
          </a>
          {getPriceBadge()}
          {ratingBadge}
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {event.genres.slice(0, 2).map(genre => (
                <span key={genre} className="px-2 py-0.5 rounded-full corner-smooth-none text-noctvm-caption uppercase font-bold bg-white/5 text-noctvm-silver/60 border border-white/5">{genre}</span>
              ))}
            </div>
            <h3 className="font-heading font-semibold text-white text-sm lg:text-base leading-tight mb-1 line-clamp-2 group-hover:text-noctvm-violet transition-colors">
              {event.title}
            </h3>
            <p className="text-noctvm-silver/70 text-xs truncate">{event.venue}</p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-noctvm-silver/80">
              <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-noctvm-label font-mono">{formatDate(event.date)}</span>
              {event.time && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span className="text-noctvm-label font-mono text-noctvm-violet">{event.time}</span>
                </>
              )}
            </div>
            {bookmarkButton}
          </div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper className="group event-card-liquid flex flex-col rounded-xl corner-smooth overflow-hidden transition-all duration-500 cursor-pointer h-full min-h-[338px] relative">
      {/* Fixed-height image — no aspect-ratio so content area stays consistent */}
      <div className="relative h-[192px] overflow-hidden bg-noctvm-midnight flex-shrink-0">
        <Image
          src={event.image_url || '/images/event-fallback.png'}
          alt={event.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700 image-outline-dark"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Source badge — links to platform or venue */}
        <a
          href={badgeLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className={`absolute top-3 left-3 z-20 px-2 py-1 rounded-lg text-noctvm-caption font-bold uppercase tracking-tight ${sourceBadge.color} backdrop-blur-md border hover:scale-105 transition-transform`}
        >
          {sourceBadge.label === 'Control Club' ? 'CTRL' : sourceBadge.label}
        </a>
        {getPriceBadge()}
        {ratingBadge}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className="flex flex-wrap gap-1 mb-1.5">
          {event.genres.slice(0, 2).map(genre => (
            <span key={genre} className="px-1.5 py-0.5 rounded-full corner-smooth-none text-noctvm-micro lg:text-noctvm-caption uppercase font-bold bg-white/5 text-noctvm-silver/60 border border-white/5">{genre}</span>
          ))}
        </div>
        <h3 className="font-heading font-semibold text-white text-sm leading-snug mb-1 line-clamp-2 group-hover:text-noctvm-violet transition-colors">
          {event.title}
        </h3>
        <p className="text-noctvm-silver/70 text-xs truncate mb-3">{event.venue}</p>
        <div className="mt-auto pt-2.5 border-t border-white/5 flex items-center gap-2 text-noctvm-silver/80">
          <CalendarIcon className="w-3 h-3 flex-shrink-0" />
          <span className="text-noctvm-caption font-mono leading-none truncate">{formatDate(event.date)}</span>
          {event.time && (
            <>
              <span className="w-1 h-1 rounded-full bg-white/10 flex-shrink-0" />
              <span className="text-noctvm-caption font-mono text-noctvm-violet leading-none flex-shrink-0">{event.time}</span>
            </>
          )}
          <div className="ml-auto">{bookmarkButton}</div>
        </div>
      </div>
    </Wrapper>
  );
}

export default React.memo(EventCard);
