import React, { useState, useEffect } from 'react';
import { NoctEvent } from '@/lib/types';
import { CalendarIcon, StarIcon } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

function getSourceBadge(source: string) {
  switch (source) {
    case 'fever':       return { label: 'Fever',        color: 'bg-orange-500/20 text-orange-400' };
    case 'ra':          return { label: 'RA',            color: 'bg-blue-500/20 text-blue-400' };
    case 'livetickets': return { label: 'LiveTickets',  color: 'bg-pink-500/20 text-pink-400' };
    case 'iabilet':     return { label: 'iaBilet',      color: 'bg-cyan-500/20 text-cyan-400' };
    case 'beethere':    return { label: 'BeeThere',     color: 'bg-yellow-500/20 text-yellow-400' };
    case 'zilesinopti': return { label: 'Zile si Nopti',color: 'bg-amber-500/20 text-amber-400' };
    case 'onevent':     return { label: 'OnEvent',       color: 'bg-violet-500/20 text-violet-400' };
    case 'ambilet':     return { label: 'Ambilet',       color: 'bg-teal-500/20 text-teal-400' };
    default:            return { label: source,          color: 'bg-noctvm-silver/20 text-noctvm-silver' };
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
}

export default function EventCard({ event, variant = 'portrait', onClick, onSaveRequireAuth }: EventCardProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);

  const sourceBadge = getSourceBadge(event.source);
  const real = isRealEvent(event.id);

  // Fetch save count + user's saved state
  useEffect(() => {
    if (!real) {
      setSaveCount(0);
      setIsSaved(false);
      return;
    }
    
    const fetchSaveData = async () => {
      const { data, count } = await supabase
        .from('event_saves')
        .select('id, user_id', { count: 'exact' })
        .eq('event_id', event.id);
      
      setSaveCount(count ?? 0);
      if (user) setIsSaved((data ?? []).some((r: { user_id: string }) => r.user_id === user.id));
    };

    fetchSaveData();

    // Realtime subscription for this event's saves
    const channel = supabase
      .channel(`event_saves_${event.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'event_saves', 
        filter: `event_id=eq.${event.id}` 
      }, () => {
        fetchSaveData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event.id, user, real]);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { onSaveRequireAuth?.(); return; }
    if (saveLoading) return;
    
    // If it's a sample event, it can't be saved to DB (foreign key constraint)
    if (!real) {
      // Just toggle local state for UI demo purposes if it's a sample event
      setIsSaved(!isSaved);
      setSaveCount(c => !isSaved ? c + 1 : Math.max(0, c - 1));
      return;
    }

    const newSaved = !isSaved;
    setIsSaved(newSaved);
    setSaveCount(c => newSaved ? c + 1 : Math.max(0, c - 1));
    setSaveLoading(true);
    try {
      if (isSaved) {
        await supabase.from('event_saves').delete().eq('event_id', event.id).eq('user_id', user.id);
      } else {
        await supabase.from('event_saves').insert({ event_id: event.id, user_id: user.id });
      }
    } catch (err) {
      console.error('Error saving event:', err);
      // Revert on error
      setIsSaved(isSaved);
      setSaveCount(c => newSaved ? Math.max(0, c - 1) : c + 1);
    } finally {
      setSaveLoading(false);
    }
  };

  const bookmarkButton = (
    <button
      onClick={handleSave}
      disabled={saveLoading}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-200 ${
        isSaved 
          ? 'bg-noctvm-violet/20 text-noctvm-violet border border-noctvm-violet/30' 
          : 'bg-white/5 text-noctvm-silver/50 hover:bg-white/10 hover:text-white border border-white/5'
      } active:scale-95`}
      title={isSaved ? 'Remove from saved' : 'Save event'}
    >
      <svg
        className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isSaved ? 'scale-110' : ''}`}
        viewBox="0 0 24 24"
        fill={isSaved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
      <span className="text-[10px] font-bold font-mono tracking-tight">{saveCount}</span>
    </button>
  );

  const getPriceBadge = () => {
    if (!event.price) return null;
    const isFree = event.price.toLowerCase() === 'free';
    const display = isFree ? 'FREE' : event.price;

    return (
      <a
        href={event.event_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="absolute bottom-3 right-3 z-30 group/price"
      >
        <div className="flex items-center px-3 py-1 rounded-lg text-[11px] font-bold bg-noctvm-emerald/10 text-noctvm-emerald border border-noctvm-emerald/20 backdrop-blur-md hover:bg-noctvm-emerald hover:text-white transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105">
          {display}
        </div>
      </a>
    );
  };

  const ratingBadge = event.rating && (
    <div className={`absolute ${event.price ? 'top-2.5 right-2.5' : 'bottom-2.5 right-2.5'} flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/5 z-20`}>
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
      <Wrapper className="group flex bg-noctvm-surface rounded-xl overflow-hidden border border-noctvm-border hover:border-noctvm-violet/50 transition-all duration-300 hover:shadow-glow h-[160px] lg:h-[180px] cursor-pointer">
        <div className="relative w-[180px] sm:w-[240px] flex-shrink-0 overflow-hidden bg-noctvm-midnight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Source badge — links to ticket platform */}
          <a
            href={event.event_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className={`absolute top-2.5 left-2.5 z-20 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${sourceBadge.color} backdrop-blur-md border border-white/10 hover:scale-105 transition-transform`}
          >
            {sourceBadge.label}
          </a>
          {getPriceBadge()}
          {ratingBadge}
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {event.genres.slice(0, 2).map(genre => (
                <span key={genre} className="px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold bg-white/5 text-noctvm-silver/60 border border-white/5">{genre}</span>
              ))}
            </div>
            <h3 className="font-heading font-semibold text-white text-sm lg:text-base leading-tight mb-1 line-clamp-2 group-hover:text-noctvm-violet transition-colors">
              {event.title}
            </h3>
            <p className="text-noctvm-silver/70 text-xs truncate">{event.venue}</p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 text-noctvm-silver/80">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono">{formatDate(event.date)}</span>
              {event.time && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span className="text-[11px] font-mono text-noctvm-violet">{event.time}</span>
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
    <Wrapper className="group flex flex-col bg-noctvm-surface/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/5 hover:border-noctvm-violet/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] cursor-pointer h-full relative">
      {/* Fixed-height image — no aspect-ratio so content area stays consistent */}
      <div className="relative h-[160px] overflow-hidden bg-noctvm-midnight flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Source badge — links to ticket platform */}
        <a
          href={event.event_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className={`absolute top-3 left-3 z-20 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${sourceBadge.color} backdrop-blur-md border border-white/10 hover:scale-105 transition-transform`}
        >
          {sourceBadge.label}
        </a>
        {getPriceBadge()}
        {ratingBadge}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className="flex flex-wrap gap-1 mb-1.5">
          {event.genres.slice(0, 2).map(genre => (
            <span key={genre} className="px-1.5 py-0.5 rounded text-[9px] lg:text-[10px] uppercase font-bold bg-white/5 text-noctvm-silver/60 border border-white/5">{genre}</span>
          ))}
        </div>
        <h3 className="font-heading font-semibold text-white text-sm leading-snug mb-1 line-clamp-2 group-hover:text-noctvm-violet transition-colors">
          {event.title}
        </h3>
        <p className="text-noctvm-silver/70 text-xs truncate mb-3">{event.venue}</p>
        <div className="mt-auto pt-2.5 border-t border-white/5 flex items-center gap-2 text-noctvm-silver/80">
          <CalendarIcon className="w-3 h-3 flex-shrink-0" />
          <span className="text-[10px] font-mono leading-none truncate">{formatDate(event.date)}</span>
          {event.time && (
            <>
              <span className="w-1 h-1 rounded-full bg-white/10 flex-shrink-0" />
              <span className="text-[10px] font-mono text-noctvm-violet leading-none flex-shrink-0">{event.time}</span>
            </>
          )}
          <div className="ml-auto">{bookmarkButton}</div>
        </div>
      </div>
    </Wrapper>
  );
}
