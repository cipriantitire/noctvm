'use client';

import { useState, useEffect, useCallback, useMemo, useRef, type MouseEvent } from 'react';
import { NoctEvent } from '@/lib/types';
import { CalendarIcon, StarIcon, TicketIcon } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import VerifiedBadge from './VerifiedBadge';
import { Button, IconButton } from '@/components/ui';
import CurvedScrollBar from './ui/CurvedScrollBar';
import { imageBadgeChrome, imageGenreBadgeClass, imagePriceBadgeClass, imageRatingBadgeClass } from '@/lib/eventImageBadgeStyles';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/Sheet';

interface EventSheetProps {
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
    case 'controlclub': return { label: 'Control Club', color: `bg-zinc-950/85 text-zinc-100 border-zinc-300/30 ${imageBadgeChrome}` };
    case 'clubguesthouse': return { label: 'GH', color: `bg-zinc-950/85 text-zinc-100 border-zinc-300/30 ${imageBadgeChrome}` };
    case 'fever':       return { label: 'Fever',         color: `bg-orange-950/85 text-orange-200 border-orange-300/30 ${imageBadgeChrome}` };
    case 'emagic':      return { label: 'Emagic',        color: `bg-emerald-950/85 text-emerald-200 border-emerald-300/30 ${imageBadgeChrome}` };
    case 'ra':          return { label: 'RA',             color: `bg-red-950/85 text-[#FF8A8A] border-red-300/30 ${imageBadgeChrome}` };
    case 'eventbook':   return { label: 'Eventbook',      color: `bg-rose-950/85 text-[#FF7A8F] border-rose-300/30 ${imageBadgeChrome}` };
    case 'livetickets': return { label: 'LiveTickets',    color: `bg-pink-950/85 text-pink-200 border-pink-300/30 ${imageBadgeChrome}` };
    case 'iabilet':     return { label: 'iaBilet',        color: `bg-cyan-950/85 text-cyan-200 border-cyan-300/30 ${imageBadgeChrome}` };
    case 'beethere':    return { label: 'BeeThere',       color: `bg-yellow-950/85 text-yellow-200 border-yellow-300/30 ${imageBadgeChrome}` };
    case 'zilesinopti': return { label: 'Zile si Nopți',  color: `bg-amber-950/85 text-amber-200 border-amber-300/30 ${imageBadgeChrome}` };
    case 'onevent':     return { label: 'OnEvent',         color: `bg-violet-950/85 text-violet-200 border-violet-300/30 ${imageBadgeChrome}` };
    case 'ambilet':     return { label: 'Ambilet',         color: `bg-teal-950/85 text-teal-200 border-teal-300/30 ${imageBadgeChrome}` };
    default:            return { label: source,            color: `bg-zinc-950/85 text-noctvm-silver border-zinc-300/30 ${imageBadgeChrome}` };
  }
}

function getSourceDisplayName(source: string): string {
  switch (source) {
    case 'controlclub': return 'Control Club';
    case 'clubguesthouse': return 'GH';
    case 'ra': return 'Resident Advisor';
    case 'eventbook': return 'Eventbook';
    case 'livetickets': return 'LiveTickets';
    case 'iabilet': return 'iaBilet';
    case 'beethere': return 'BeeThere';
    case 'zilesinopti': return 'Zile si Nopti';
    case 'onevent': return 'OnEvent';
    case 'ambilet': return 'Ambilet';
    case 'fever': return 'Fever';
    case 'emagic': return 'Emagic';
    default: return source;
  }
}

function getTicketProviderFromUrl(url?: string | null): string | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes('ambilet.ro')) return 'ambilet';
  if (lower.includes('iabilet.ro')) return 'iabilet';
  if (lower.includes('eventbook.ro')) return 'eventbook';
  if (lower.includes('livetickets.ro')) return 'livetickets';
  if (lower.includes('ra.co')) return 'ra';
  if (lower.includes('control-club.ro')) return 'controlclub';
  return null;
}

const DESCRIPTION_COLLAPSED_MAX_HEIGHT = 220;

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '-',
  mdash: '-',
  lsquo: "'",
  rsquo: "'",
  ldquo: '"',
  rdquo: '"',
  hellip: '...',
  bull: '*',
};

function normalizeDecodedEntity(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '*');
}

function decodeHtmlEntities(value: string): string {
  return normalizeDecodedEntity(value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/g, (entity, body: string) => {
    const key = body.toLowerCase();
    if (key in HTML_ENTITY_MAP) return HTML_ENTITY_MAP[key];

    if (key.startsWith('#x')) {
      const codePoint = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
    }

    if (key.startsWith('#')) {
      const codePoint = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
    }

    return entity;
  }));
}

function normalizeDescriptionParagraphs(description: string | null): string[] {
  if (!description) return [];

  const cleaned = decodeHtmlEntities(description)
    .replace(/\r\n?/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\uFFFD/g, '')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .replace(/^[\s?!.:,;|/\\-]+(?=[A-Za-z0-9])/g, '')
    .trim();

  if (!cleaned) return [];

  return cleaned
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);
}

function normalizeOutboundUrl(url?: string | null): string {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    parsed.hash = '';
    const normalizedPath = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.origin.toLowerCase()}${normalizedPath}${parsed.search}`;
  } catch {
    return url.trim().replace(/\/+$/, '').toLowerCase();
  }
}

export default function EventSheet({ 
  event, 
  onClose, 
  onVenueClick, 
  onOpenAuth,
}: EventSheetProps) {
  const LIGHTBOX_OPEN_GUARD_MS = 350;
  const { user } = useAuth();
  const [descExpanded, setDescExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [saveCount, setSaveCount]     = useState(0);
  const [isSaved,   setIsSaved]       = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [venueBadge, setVenueBadge] = useState<'none' | 'owner' | 'admin' | 'gold' | 'verified'>('none');
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const blockLightboxUntilRef = useRef(0);

  const handleClose = useCallback(() => {
    setLightboxOpen(false);
    setIsOpen(false);
    setTimeout(() => onClose(), 350);
  }, [onClose]);

  useEffect(() => {
    if (!event) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [event, handleClose]);

  useEffect(() => {
    if (!event || !isRealEvent(event.id)) { setSaveCount(0); setIsSaved(false); return; }
    const eventId = event.id;

    supabase
      .from('event_saves')
      .select('id, user_id', { count: 'exact' })
      .eq('event_id', eventId)
      .then(({ data, count }) => {
        setSaveCount(count ?? 0);
        if (user) setIsSaved((data ?? []).some((r: any) => r.user_id === user.id));
      });

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

  const descriptionParagraphs = useMemo(() => normalizeDescriptionParagraphs(event?.description ?? null), [event?.description]);

  useEffect(() => {
    setDescExpanded(false);
    setLightboxOpen(false);
    blockLightboxUntilRef.current = Date.now() + LIGHTBOX_OPEN_GUARD_MS;
  }, [event?.id]);

  const handleHeroImageClick = useCallback(() => {
    if (Date.now() < blockLightboxUntilRef.current) return;
    setLightboxOpen(true);
  }, []);

  useEffect(() => {
    const measureDescription = () => {
      const descriptionElement = descriptionRef.current;
      if (!descriptionElement) {
        setIsDescriptionOverflowing(false);
        return;
      }

      setIsDescriptionOverflowing(descriptionElement.scrollHeight > DESCRIPTION_COLLAPSED_MAX_HEIGHT + 1);
    };

    measureDescription();
    window.addEventListener('resize', measureDescription);
    return () => window.removeEventListener('resize', measureDescription);
  }, [descriptionParagraphs]);

  if (!event) return null;

  const sourceBadge = getSourceBadge(event.source);
  const badgeLink = event.event_url || undefined;

  const isValidTicketUrl = event.ticket_url && !event.ticket_url.match(/\.(css|js|png|jpg|jpeg|gif|svg|webp|woff2?|pdf|ico|php|xml)(\?|#|$)/i) && !event.ticket_url.includes('/assets/') && !event.ticket_url.includes('/css/') && !event.ticket_url.includes('x.com') && !event.ticket_url.includes('twitter.com') && !event.ticket_url.includes('facebook.com') && !event.ticket_url.includes('xmlrpc');
  const ticketCtaLink = isValidTicketUrl ? event.ticket_url || undefined : event.event_url;
  const ticketSource = getTicketProviderFromUrl(ticketCtaLink) || event.source;
  const ticketSourceBadge = getSourceBadge(ticketSource);
  const priceLink = ticketCtaLink;
  const sourceEventLink = event.event_url && normalizeOutboundUrl(event.event_url) !== normalizeOutboundUrl(ticketCtaLink)
    ? event.event_url
    : null;
  const sourceEventLabel = getSourceDisplayName(event.source);
  const heroGenres = event.genres.slice(0, 3);

  const hasPrice = event.price && event.price.toLowerCase() !== 'free';
  const isFree = event.price?.toLowerCase() === 'free';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <SheetContent
        side="bottom"
        overlayClassName="!bg-noctvm-black/70 backdrop-blur-md"
        className="h-auto max-h-[85vh] bg-noctvm-black border-noctvm-border border-t p-0 rounded-t-3xl overflow-hidden flex flex-col min-h-0 corner-smooth"
        showCloseButton={false}
      >
        {/* Lightbox */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-noctvm-black/95 cursor-zoom-out"
            style={{ zIndex: 500 }}
            onClick={() => setLightboxOpen(false)}
          >
            <img
              src={event.image_url || '/images/event-fallback.png'}
              alt={event.title}
              className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
              onError={(e) => { (e.target as HTMLImageElement).src = '/images/event-fallback.png'; }}
            />
            <IconButton
              size="lg"
              aria-label="Close image preview"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 text-foreground"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </IconButton>
          </div>
        )}

        {/* Hero image */}
        <div className="relative flex-shrink-0 h-[240px] bg-noctvm-black overflow-hidden">
          <img
            src={event.image_url || '/images/event-fallback.png'}
            alt={event.title}
            className="w-full h-full object-cover cursor-zoom-in"
            onClick={handleHeroImageClick}
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/event-fallback.png'; }}
          />
          <IconButton
            onClick={handleClose}
            title="Close"
            aria-label="Close"
            className="absolute top-3 right-3 z-10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </IconButton>
        </div>

        {/* Absolute floating elements */}
        <div className="absolute top-0 left-0 right-0 h-[240px] pointer-events-none">
          <a
            href={badgeLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className={`absolute top-3 left-3 pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight ${sourceBadge.color} backdrop-blur-md border z-10 hover:scale-105 transition-transform`}
          >
            <TicketIcon className="w-3 h-3" />
            {sourceBadge.label === 'Control Club' ? 'CTRL' : sourceBadge.label}
          </a>

          {heroGenres.length > 0 && (
            <div className="absolute bottom-3 left-3 z-10 max-w-[70%] flex flex-wrap gap-1.5">
              {heroGenres.map((genre) => (
                <span
                  key={genre}
                  className={`px-3 py-1.5 rounded-full corner-smooth-none text-xs font-bold uppercase tracking-tight backdrop-blur-md border ${imageGenreBadgeClass}`}
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {(event.rating || hasPrice || isFree) && (
            <div className="absolute bottom-3 right-3 z-10 pointer-events-auto flex flex-col items-end gap-2">
              {event.rating && (
                <div className={`flex items-center gap-1.5 backdrop-blur-sm rounded-lg px-2 py-1 border ${imageRatingBadgeClass}`}>
                  <StarIcon className="w-3 h-3 text-noctvm-gold" />
                  <span className="text-xs font-bold text-noctvm-gold">{event.rating}</span>
                  {event.reviews && <span className="text-noctvm-caption text-noctvm-silver/60">({event.reviews} reviews)</span>}
                </div>
              )}
              {(hasPrice || isFree) && (
                <a
                  href={priceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight backdrop-blur-md border hover:scale-105 transition-transform ${imagePriceBadgeClass}`}
                >
                  {isFree ? 'FREE' : event.price}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Header metadata */}
        <div className="flex-shrink-0 space-y-3 p-4">
          <h2 className="font-heading text-lg font-bold text-foreground leading-tight">
            {event.title}
          </h2>

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

          <div className="flex items-center gap-3 text-noctvm-silver/80">
            <div className="w-9 h-9 rounded-xl bg-noctvm-surface border border-noctvm-border flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="w-4 h-4 text-noctvm-violet" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{formatDate(event.date)}</p>
              {event.time && <p className="text-xs text-noctvm-violet font-mono">{event.time}</p>}
            </div>
            <button
              onClick={handleSave}
              disabled={saveLoading || !isRealEvent(event?.id ?? '')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isSaved
                  ? 'bg-noctvm-violet/20 text-noctvm-violet border-noctvm-violet/40'
                  : 'bg-noctvm-black/40 text-noctvm-silver border-white/10 hover:border-noctvm-violet/30 hover:text-noctvm-violet'
              } ${!isRealEvent(event?.id ?? '') ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              <span>{saveCount}</span>
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 px-4">
          <div className="w-full h-px bg-noctvm-border" />
        </div>

        {/* Scrollable description */}
        <CurvedScrollBar className="flex-1 min-h-0" viewportClassName="p-5 overscroll-contain" cornerRadius={24} edgePadding={4} verticalInset={4} fadeEdges>
          {descriptionParagraphs.length > 0 && (
            <section id="event-sheet-description" className="space-y-3">
              <div
                ref={descriptionRef}
                className="space-y-3 overflow-hidden transition-[max-height] duration-300 ease-out"
                style={{
                  maxHeight: descExpanded ? 'none' : `${DESCRIPTION_COLLAPSED_MAX_HEIGHT}px`,
                  maskImage: (!descExpanded && isDescriptionOverflowing) ? 'linear-gradient(to bottom, black 75%, transparent 100%)' : undefined,
                  WebkitMaskImage: (!descExpanded && isDescriptionOverflowing) ? 'linear-gradient(to bottom, black 75%, transparent 100%)' : undefined,
                }}
              >
                {descriptionParagraphs.map((paragraph, index) => (
                  <p key={`${paragraph.slice(0, 24)}-${index}`} className="text-sm text-noctvm-silver/80 leading-relaxed whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
              {isDescriptionOverflowing && (
                <button
                  type="button"
                  onClick={() => setDescExpanded(prev => !prev)}
                  className="text-xs text-noctvm-violet hover:text-noctvm-violet/80 font-medium transition-colors"
                >
                  {descExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </section>
          )}
        </CurvedScrollBar>

        {/* CTA footer */}
        <div className="px-4 pb-5 pt-3 border-t border-noctvm-border bg-noctvm-midnight flex-shrink-0 space-y-3">
          {sourceEventLink && (
            <a
              href={sourceEventLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e: MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
              className="w-full flex items-center justify-center gap-1.5 text-noctvm-caption font-medium text-noctvm-silver/65 hover:text-noctvm-silver transition-colors"
            >
              <span>View event on {sourceEventLabel}</span>
              <svg
                aria-hidden="true"
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 4h6v6" />
                <path d="M10 14L20 4" />
                <path d="M20 14v6h-6" />
                <path d="M4 10V4h6" />
              </svg>
            </a>
          )}
          {ticketCtaLink ? (
            <Button
              href={ticketCtaLink}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="md"
              onClick={(e: MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
              className="w-full"
            >
              <TicketIcon className="w-4 h-4" />
              Get Tickets on {ticketSourceBadge.label}
            </Button>
          ) : (
            <p className="text-center text-sm text-noctvm-silver/50 py-3">No outbound link for this event.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
