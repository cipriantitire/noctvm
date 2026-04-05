'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SearchBox } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getVenueLogo } from '@/lib/venue-logos';
import type { NoctEvent, Venue } from '@/lib/types';
import VerifiedBadge from './VerifiedBadge';
import { CalendarIcon, CogIcon, GridIcon, SearchIcon, UserIcon, VenuesIcon, EventsIcon, BellIcon, EditIcon, ShieldIcon, StarIcon, MapPinIcon, LayoutListIcon } from './icons';

export type GlobalSearchActionId =
  | 'open-settings'
  | 'open-notifications'
  | 'open-dashboard'
  | 'edit-profile'
  | 'account'
  | 'privacy'
  | 'notifications-settings'
  | 'appearance'
  | 'blocked_muted'
  | 'inventory'
  | 'activity'
  | 'add_location'
  | 'claim_location';

type SearchEventResult = NoctEvent & { kind: 'event' };
type SearchVenueResult = Pick<Venue, 'id' | 'name' | 'city' | 'logo_url' | 'genres'> & { kind: 'venue' };
type SearchUserResult = {
  kind: 'user';
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  badge: 'none' | 'owner' | 'admin' | 'gold' | 'verified';
  is_verified: boolean;
};
type SearchActionResult = {
  kind: 'action';
  id: GlobalSearchActionId;
  label: string;
  desc: string;
  icon: JSX.Element;
};

type SearchResult = SearchEventResult | SearchVenueResult | SearchUserResult | SearchActionResult;

interface GlobalSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventSelect: (event: NoctEvent) => void;
  onVenueSelect: (venueName: string) => void;
  onUserSelect: (username: string) => void;
  onActionSelect: (action: GlobalSearchActionId) => void;
}

function formatEventDate(date: string, time: string | null) {
  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  return time ? `${formattedDate} · ${time}` : formattedDate;
}

function SectionHeading({ title, count, icon }: { title: string; count: number; icon: JSX.Element }) {
  return (
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-noctvm-black/60 text-noctvm-silver">
          {icon}
        </div>
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.26em] text-noctvm-silver/50">{title}</p>
      </div>
      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.22em] text-noctvm-silver/30">{count}</span>
    </div>
  );
}

function ResultButton({
  onClick,
  children,
  className = '',
  compact = false,
}: {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const buttonClassName = compact
    ? 'group flex w-full items-center gap-2.5 rounded-[18px] border border-white/5 bg-noctvm-black/60 px-2.5 py-2.5 text-left transition-all hover:border-white/10 hover:bg-noctvm-black/75 active:scale-[0.99]'
    : 'group flex w-full items-center gap-3 rounded-[22px] border border-white/5 bg-noctvm-black/50 px-3 py-3 text-left transition-all hover:border-white/10 hover:bg-noctvm-black/70 active:scale-[0.99]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${buttonClassName} ${className}`}
    >
      {children}
    </button>
  );
}

export default function GlobalSearchSheet({
  open,
  onOpenChange,
  onEventSelect,
  onVenueSelect,
  onUserSelect,
  onActionSelect,
}: GlobalSearchSheetProps) {
  const { isAdmin, isOwner } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<SearchEventResult[]>([]);
  const [venues, setVenues] = useState<SearchVenueResult[]>([]);
  const [users, setUsers] = useState<SearchUserResult[]>([]);
  const [actions, setActions] = useState<SearchActionResult[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const searchRunRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const isCompactLayout = !isDesktop;
  const mobileSheetTop = 'calc(3.75rem + env(safe-area-inset-top))';
  const mobileBackdropTop = 'calc(3.75rem + env(safe-area-inset-top) - 6px)';
  const mobileSheetHeight = 'calc(100dvh - 3.75rem - env(safe-area-inset-top))';

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const updateLayout = () => setIsDesktop(media.matches);

    updateLayout();
    media.addEventListener('change', updateLayout);
    return () => media.removeEventListener('change', updateLayout);
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(frame);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setLoading(false);
      setEvents([]);
      setVenues([]);
      setUsers([]);
      setActions([]);
      return;
    }

    const term = query.trim();
    const searchableActionsBase = [
      {
        kind: 'action',
        id: 'open-settings',
        label: 'Open Settings',
        desc: 'Profile, privacy, and app preferences',
        icon: <CogIcon className="h-4 w-4" />,
      },
      {
        kind: 'action',
        id: 'open-notifications',
        label: 'Notifications',
        desc: 'Alerts, follows, likes, and comments',
        icon: <BellIcon className="h-4 w-4" />,
      },
      {
        kind: 'action',
        id: 'open-dashboard',
        label: 'Dashboard',
        desc: 'Manage events, venues, users, and scrapers',
        icon: <GridIcon className="h-4 w-4" />,
      },
      {
        kind: 'action',
        id: 'edit-profile',
        label: 'Edit Profile',
        desc: 'Avatar, bio, music, and socials',
        icon: <EditIcon className="h-4 w-4" />,
      },
      {
        kind: 'action',
        id: 'account',
        label: 'Account',
        desc: 'Email, password, and security',
        icon: <UserIcon className="h-4 w-4" />,
      },
      {
        kind: 'action',
        id: 'privacy',
        label: 'Privacy',
        desc: 'Visibility and interactions',
        icon: <ShieldIcon className="h-4 w-4" />,
      },
      {
        kind: 'action',
        id: 'notifications-settings',
        label: 'Notification Settings',
        desc: 'Alerts and delivery preferences',
        icon: <BellIcon className="h-4 w-4" />,
      },
      {
        kind: 'action',
        id: 'appearance',
        label: 'Appearance',
        desc: 'Theme and visual preferences',
        icon: <SearchIcon className="h-4 w-4" />,
      },
      {
        kind: 'action',
        id: 'blocked_muted',
        label: 'Blocked & Muted',
        desc: 'Restricted accounts and filters',
        icon: <ShieldIcon className="h-4 w-4" />,
      },
      {
        kind: 'action',
        id: 'inventory',
        label: 'Inventory',
        desc: 'Premium profile effects',
        icon: <StarIcon className="h-4 w-4" />,
      },
      {
        kind: 'action',
        id: 'activity',
        label: 'Activity Log',
        desc: 'Audit trail of account changes',
        icon: <LayoutListIcon className="h-4 w-4" />,
      },
      {
        kind: 'action',
        id: 'add_location',
        label: 'Add Location',
        desc: 'List a new venue or club',
        icon: <MapPinIcon className="h-4 w-4" />,
      },
      {
        kind: 'action',
        id: 'claim_location',
        label: 'Claim Location',
        desc: 'Verify venue ownership',
        icon: <ShieldIcon className="h-4 w-4" />,
      },
    ] satisfies SearchActionResult[];

    const searchableActions = searchableActionsBase.filter((action) => {
      if (action.id === 'open-dashboard' && !(isAdmin || isOwner)) return false;
      return true;
    });

    if (!term) {
      setLoading(false);
      setEvents([]);
      setVenues([]);
      setUsers([]);
      setActions([]);
      return;
    }

    if (term.length < 2) {
      setLoading(false);
      setEvents([]);
      setVenues([]);
      setUsers([]);
      setActions(searchableActions.filter((action) => {
        const haystack = `${action.label} ${action.desc}`.toLowerCase();
        return haystack.includes(term.toLowerCase());
      }));
      return;
    }

    const runId = ++searchRunRef.current;
    const timeout = window.setTimeout(async () => {
      setLoading(true);

      const eventFields = 'id, source, title, venue, date, time, description, image_url, event_url, genres, price, city, ticket_url';
      const venueFields = 'id, name, city, logo_url, genres';
      const userFields = 'id, username, display_name, avatar_url, badge, is_verified';

      const [eventTitleRes, eventVenueRes, venueRes, userHandleRes, userNameRes] = await Promise.allSettled([
        supabase.from('events').select(eventFields).ilike('title', `%${term}%`).order('date', { ascending: false }).limit(6),
        supabase.from('events').select(eventFields).ilike('venue', `%${term}%`).order('date', { ascending: false }).limit(6),
        supabase.from('venues').select(venueFields).ilike('name', `%${term}%`).order('name', { ascending: true }).limit(6),
        supabase.from('profiles').select(userFields).ilike('username', `%${term}%`).order('username', { ascending: true }).limit(6),
        supabase.from('profiles').select(userFields).ilike('display_name', `%${term}%`).order('display_name', { ascending: true }).limit(6),
      ]);

      if (searchRunRef.current !== runId) return;

      const eventMap = new Map<string, SearchEventResult>();
      for (const result of [eventTitleRes, eventVenueRes]) {
        if (result.status !== 'fulfilled' || result.value.error || !result.value.data) continue;
        for (const row of result.value.data as any[]) {
          if (!eventMap.has(row.id)) {
            eventMap.set(row.id, {
              kind: 'event',
              id: row.id,
              source: row.source,
              title: row.title,
              venue: row.venue,
              date: row.date,
              time: row.time,
              description: row.description,
              image_url: row.image_url,
              event_url: row.event_url,
              genres: row.genres || [],
              price: row.price,
              ticket_url: row.ticket_url ?? null,
              city: row.city,
            });
          }
        }
      }

      const venueMap = new Map<string, SearchVenueResult>();
      if (venueRes.status === 'fulfilled' && !venueRes.value.error && venueRes.value.data) {
        for (const row of venueRes.value.data as any[]) {
          if (!venueMap.has(row.id)) {
            venueMap.set(row.id, {
              kind: 'venue',
              id: row.id,
              name: row.name,
              city: row.city,
              logo_url: row.logo_url ?? null,
              genres: row.genres || [],
            });
          }
        }
      }

      const userMap = new Map<string, SearchUserResult>();
      for (const result of [userHandleRes, userNameRes]) {
        if (result.status !== 'fulfilled' || result.value.error || !result.value.data) continue;
        for (const row of result.value.data as any[]) {
          if (!userMap.has(row.id)) {
            userMap.set(row.id, {
              kind: 'user',
              id: row.id,
              username: row.username,
              display_name: row.display_name ?? null,
              avatar_url: row.avatar_url ?? null,
              badge: row.badge ?? 'none',
              is_verified: !!row.is_verified,
            });
          }
        }
      }

      const lowerTerm = term.toLowerCase();
      const filteredActions = searchableActions.filter((action) => {
        const haystack = [action.label, action.desc].concat(action.id.replace(/_/g, ' ')).join(' ').toLowerCase();
        return haystack.includes(lowerTerm);
      });

      setEvents(Array.from(eventMap.values()));
      setVenues(Array.from(venueMap.values()));
      setUsers(Array.from(userMap.values()));
      setActions(filteredActions);
      setLoading(false);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [open, query, isAdmin, isOwner]);

  const closeSearch = useCallback(() => {
    onOpenChange(false);
    setQuery('');
  }, [onOpenChange]);

  const openSide = isDesktop ? 'right' : 'top';
  const overlayStyle = isDesktop
    ? { zIndex: 400 }
    : {
        zIndex: 400,
        top: mobileBackdropTop,
        right: 0,
        bottom: 0,
        left: 0,
      };
  const sheetStyle = isDesktop
    ? { zIndex: 401, position: 'fixed' as const, width: 'min(44rem, calc(100vw - 1rem))', height: '100dvh' }
    : { zIndex: 401, position: 'fixed' as const, top: mobileSheetTop, left: 0, right: 0, width: '100vw', height: mobileSheetHeight };

  const handleEventSelect = (event: SearchEventResult) => {
    closeSearch();
    onEventSelect(event);
  };

  const handleVenueSelect = (venue: SearchVenueResult) => {
    closeSearch();
    onVenueSelect(venue.name);
  };

  const handleUserSelect = (user: SearchUserResult) => {
    closeSearch();
    onUserSelect(user.username);
  };

  const handleActionSelect = (action: SearchActionResult) => {
    closeSearch();
    onActionSelect(action.id);
  };

  const hasQuery = query.trim().length > 0;
  const hasAnyResults = events.length > 0 || venues.length > 0 || users.length > 0 || actions.length > 0;

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : closeSearch())}>
      <SheetContent
        side={openSide}
        overlayClassName="bg-transparent backdrop-blur-sm"
        overlayStyle={overlayStyle}
        glass={isDesktop}
        showCloseButton={isDesktop}
        className={isDesktop
          ? 'overflow-hidden border-white/10 bg-noctvm-black/95 p-0 shadow-[0_0_80px_rgba(0,0,0,0.65)]'
          : 'overflow-hidden border-0 bg-transparent p-0 shadow-none !border-0 !shadow-none !rounded-none'}
        style={sheetStyle}
      >
        <div className="flex h-full flex-col">
          <SheetHeader className={isDesktop
            ? 'sticky top-0 z-10 border-b border-white/5 bg-noctvm-black/90 px-4 pb-4 pt-5 backdrop-blur-xl pr-14'
            : 'sticky top-0 z-10 px-3 pb-3 pt-3'}
          >
            <div className={isDesktop ? 'space-y-1' : 'sr-only'}>
              <SheetTitle className={isDesktop ? 'text-2xl font-black tracking-tight text-white' : ''}>Global Search</SheetTitle>
              <SheetDescription className={isDesktop ? 'text-noctvm-silver/60' : ''}>
                Search events, venues, people, and settings from anywhere in the app.
              </SheetDescription>
            </div>

            <div className={isDesktop ? 'mt-4' : 'mt-1'}>
              <SearchBox
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClear={() => setQuery('')}
                placeholder="Search events, venues, people, settings..."
                aria-label="Global search"
                className="rounded-2xl border-white/10 bg-noctvm-black/90 py-4 pl-11 pr-10 text-sm placeholder:text-noctvm-silver/35 focus:border-noctvm-violet/40"
                wrapperClassName="w-full"
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  const firstResult = (events[0] ?? venues[0] ?? users[0] ?? actions[0]) as SearchResult | undefined;
                  if (!firstResult) return;
                  e.preventDefault();
                  switch (firstResult.kind) {
                    case 'event':
                      handleEventSelect(firstResult);
                      return;
                    case 'venue':
                      handleVenueSelect(firstResult);
                      return;
                    case 'user':
                      handleUserSelect(firstResult);
                      return;
                    case 'action':
                      handleActionSelect(firstResult);
                      return;
                  }
                }}
              />
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
            {!hasQuery ? (
                <div className="mb-4 rounded-[22px] border border-white/5 bg-noctvm-black/55 px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-noctvm-black/70 text-noctvm-violet">
                      <SearchIcon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">Start typing to search the entire app.</p>
                      <p className="max-w-xl text-xs leading-5 text-noctvm-silver/60">
                        Search events, venues, people, and settings from one place. Results update as soon as you type.
                      </p>
                    </div>
                  </div>
                </div>
            ) : loading ? (
                <div className="mb-4 rounded-[22px] border border-white/5 bg-noctvm-black/55 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-noctvm-violet border-t-transparent" />
                    <p className="text-sm text-noctvm-silver/60">Searching the vault...</p>
                </div>
              </div>
            ) : hasAnyResults ? (
              <div className="space-y-6 pb-6">
                {events.length > 0 && (
                  <section className="space-y-3">
                    <SectionHeading title="Events" count={events.length} icon={<EventsIcon className="h-4 w-4" />} />
                    <div className="space-y-2">
                      {events.map((event) => (
                          <ResultButton key={`${event.kind}-${event.id}`} compact={isCompactLayout} onClick={() => handleEventSelect(event)}>
                            <div className={`relative shrink-0 overflow-hidden border border-white/10 bg-noctvm-midnight/80 ${isCompactLayout ? 'h-11 w-11 rounded-xl' : 'h-14 w-14 rounded-2xl'}`}>
                            {event.image_url ? (
                              <Image src={event.image_url} alt={event.title} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-noctvm-violet/20 to-noctvm-midnight">
                                <CalendarIcon className="h-5 w-5 text-white/70" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-semibold text-white">{event.title}</p>
                              {event.city && (
                                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-noctvm-silver/60">
                                  {event.city}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 truncate text-xs text-noctvm-silver/55">
                              {event.venue} · {formatEventDate(event.date, event.time)}
                            </p>
                          </div>
                        </ResultButton>
                      ))}
                    </div>
                  </section>
                )}

                {venues.length > 0 && (
                  <section className="space-y-3">
                    <SectionHeading title="Venues" count={venues.length} icon={<VenuesIcon className="h-4 w-4" />} />
                    <div className="space-y-2">
                      {venues.map((venue) => (
                        <ResultButton key={`${venue.kind}-${venue.id}`} compact={isCompactLayout} onClick={() => handleVenueSelect(venue)}>
                          <div className={`relative shrink-0 overflow-hidden border border-white/10 bg-noctvm-midnight/80 ${isCompactLayout ? 'h-11 w-11 rounded-xl' : 'h-14 w-14 rounded-2xl'}`}>
                            {venue.logo_url ? (
                              <Image src={getVenueLogo(venue.name, venue.logo_url || undefined)} alt={venue.name} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-noctvm-violet/20 to-noctvm-midnight">
                                <span className="text-sm font-black text-white">{venue.name[0]}</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-semibold text-white">{venue.name}</p>
                              {venue.city && (
                                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-noctvm-silver/60">
                                  {venue.city}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 truncate text-xs text-noctvm-silver/55">
                              {venue.genres?.length ? venue.genres.slice(0, 3).join(' · ') : 'Venue profile'}
                            </p>
                          </div>
                        </ResultButton>
                      ))}
                    </div>
                  </section>
                )}

                {users.length > 0 && (
                  <section className="space-y-3">
                    <SectionHeading title="People" count={users.length} icon={<UserIcon className="h-4 w-4" />} />
                    <div className="space-y-2">
                      {users.map((user) => (
                        <ResultButton key={`${user.kind}-${user.id}`} compact={isCompactLayout} onClick={() => handleUserSelect(user)}>
                          <div className={`relative shrink-0 overflow-hidden border border-white/10 bg-noctvm-midnight/80 ${isCompactLayout ? 'h-11 w-11 rounded-xl' : 'h-14 w-14 rounded-2xl'}`}>
                            {user.avatar_url ? (
                              <Image src={user.avatar_url} alt={user.display_name || user.username} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-noctvm-violet/20 to-noctvm-midnight">
                                <span className="text-sm font-black text-white">{(user.display_name || user.username || 'U')[0].toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-semibold text-white">{user.display_name || user.username}</p>
                              {user.badge !== 'none' && <VerifiedBadge type={user.badge} size="sm" />}
                            </div>
                            <p className="mt-1 truncate text-xs text-noctvm-silver/55">@{user.username}</p>
                          </div>
                        </ResultButton>
                      ))}
                    </div>
                  </section>
                )}

                {actions.length > 0 && (
                  <section className="space-y-3">
                    <SectionHeading title="Settings" count={actions.length} icon={<CogIcon className="h-4 w-4" />} />
                    <div className="space-y-2">
                      {actions.map((action) => (
                        <ResultButton key={action.id} compact={isCompactLayout} onClick={() => handleActionSelect(action)}>
                          <div className={`flex shrink-0 items-center justify-center border border-white/10 bg-noctvm-violet/10 text-noctvm-violet ${isCompactLayout ? 'h-11 w-11 rounded-xl' : 'h-14 w-14 rounded-2xl'}`}>
                            {action.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-white">{action.label}</p>
                            <p className="mt-1 truncate text-xs text-noctvm-silver/55">{action.desc}</p>
                          </div>
                        </ResultButton>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="rounded-[22px] border border-white/5 bg-noctvm-black/55 px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-noctvm-black/70 text-noctvm-silver/40">
                    <SearchIcon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">No matches found.</p>
                    <p className="max-w-xl text-xs leading-5 text-noctvm-silver/60">
                      Try a different keyword, or search for an event, venue, person, or settings page.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}