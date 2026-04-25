'use client';

import { useState } from 'react';
import FilterBar from './FilterBar';
import { SearchIcon } from './icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/DropdownMenu';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import CurvedScrollBar from './ui/CurvedScrollBar';
import { CheckIcon } from 'lucide-react';

interface SearchBarProps {
  type: 'events' | 'venues';
  activeCity: 'bucuresti' | 'constanta';
  onCityChange: (city: 'bucuresti' | 'constanta') => void;
  headerHidden: boolean;
  
  // Events specific
  activeGenres?: string[];
  onGenresChange?: (genres: string[]) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  viewMode?: 'portrait' | 'landscape';
  onViewModeChange?: (mode: 'portrait' | 'landscape') => void;
  selectedDate?: string | null;
  onDateChange?: (date: string | null) => void;
  eventsCount?: number;

  // Venues specific
  activeGenre?: string;
  onGenreChange?: (genre: string) => void;
  venueSearch?: string;
  onVenueSearchChange?: (q: string) => void;
  venueView?: 'grid' | 'list';
  onVenueViewChange?: (view: 'grid' | 'list') => void;
  venueSort?: 'name' | 'popularity' | 'events';
  onVenueSortChange?: (sort: 'name' | 'popularity' | 'events') => void;
  venuesCount?: number;
  allGenres?: string[];
}

export default function SearchBar(props: SearchBarProps) {
  const { 
    type, 
    activeCity, 
    onCityChange, 
    headerHidden, 
    allGenres = [],
    eventsCount,
    venuesCount
  } = props;

  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const resultCountLabel = type === 'events' ? `${eventsCount || 0} events` : `${venuesCount || 0} venues`;

  return (
    <div 
      className={`sticky z-20 transition-all duration-300 ease-in-out mb-4 ${headerHidden ? '-translate-y-[220%] top-0' : 'top-[56px]'} lg:!top-0`}
    >
      <div className="liquid-glass-card search-frost-boost rounded-[40px] corner-smooth-none" data-colorbends-refraction="search-surface">
        <div className="card-content">
        {/* Desktop Header area */}
        <div className="card-header hidden lg:!flex !items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-noctvm-silver">{type === 'events' ? 'Nightlife' : 'Venues'} in</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                   className="search-static-glass flex h-[34px] min-w-[7rem] items-center justify-between gap-1.5 rounded-[16px] px-3 text-noctvm-base font-medium text-noctvm-silver transition-colors"
                  title="Select city"
                >
                  <span>{activeCity === 'bucuresti' ? 'București' : 'Constanța'}</span>
                  <svg className="size-4 text-noctvm-silver" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="w-56">
                <DropdownMenuItem
                  onClick={() => onCityChange('bucuresti')}
                  className={activeCity === 'bucuresti' ? 'bg-white/10 text-foreground' : ''}
                >
                  <span>București</span>
                  <span className="ml-auto flex w-4 items-center justify-center">
                    {activeCity === 'bucuresti' ? <CheckIcon className="size-4 text-noctvm-violet" /> : null}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onCityChange('constanta')}
                  className={activeCity === 'constanta' ? 'bg-white/10 text-foreground' : ''}
                >
                  <span>Constanța</span>
                  <span className="ml-auto flex w-4 items-center justify-center">
                    {activeCity === 'constanta' ? <CheckIcon className="size-4 text-noctvm-violet" /> : null}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <span className="flex h-[34px] items-center text-noctvm-caption text-noctvm-silver/50 font-mono tabular-nums">
            {resultCountLabel}
          </span>
        </div>

        {type === 'events' ? (
          <FilterBar
            activeGenres={props.activeGenres || ['All']}
            onGenreChange={props.onGenresChange || (() => {})}
            searchQuery={props.searchQuery || ''}
            onSearchChange={props.onSearchChange || (() => {})}
            viewMode={props.viewMode || 'portrait'}
            onViewModeChange={props.onViewModeChange || (() => {})}
            selectedDate={props.selectedDate || null}
            onDateChange={props.onDateChange || (() => {})}
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative flex-1 min-w-0 h-[42px] frosted-glass rounded-full corner-smooth-none">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <SearchIcon className="w-4 h-4 text-noctvm-silver" />
                </div>
                <input
                  type="text"
                  placeholder="Search venues or genres..."
                  title="Search venues"
                  value={props.venueSearch || ''}
                  onChange={e => props.onVenueSearchChange?.(e.target.value)}
                  className="h-full w-full bg-transparent border-0 rounded-full corner-smooth-none pl-10 pr-4 text-sm text-noctvm-silver placeholder:text-noctvm-silver focus:outline-none focus:ring-0"
                />
                {props.venueSearch && (
                  <button
                    type="button"
                    onClick={() => props.onVenueSearchChange?.('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-noctvm-silver hover:text-foreground transition-colors"
                    aria-label="Clear venue search"
                    title="Clear venue search"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              
              <div className="flex h-[42px] flex-shrink-0 items-center rounded-full corner-smooth-none frosted-glass p-1">
                <button
                  type="button"
                  onClick={() => props.onVenueViewChange?.('grid')}
                  className={`p-2 rounded-full corner-smooth-none transition-all duration-200 flex items-center justify-center ${props.venueView === 'grid' ? 'bg-noctvm-violet/15 text-foreground border border-noctvm-violet/20' : 'text-noctvm-silver hover:text-foreground'}`}
                  aria-label="Switch to grid view"
                  title="Switch to grid view"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
                </button>
                <div className="w-px h-4 bg-noctvm-border self-center mx-1 opacity-50" />
                <button
                  type="button"
                  onClick={() => props.onVenueViewChange?.('list')}
                  className={`p-2 rounded-full corner-smooth-none transition-all duration-200 flex items-center justify-center ${props.venueView === 'list' ? 'bg-noctvm-violet/15 text-foreground border border-noctvm-violet/20' : 'text-noctvm-silver hover:text-foreground'}`}
                  aria-label="Switch to list view"
                  title="Switch to list view"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <div className="relative flex-shrink-0 w-fit">
                <Select value={props.venueSort} onValueChange={(value) => props.onVenueSortChange?.(value as NonNullable<SearchBarProps['venueSort']>)}>
                  <SelectTrigger
                    size="sm"
                    className="h-[34px] w-auto whitespace-nowrap !justify-between !rounded-full corner-smooth-none !border-white/10 !bg-white/[0.04] !px-2.5 !py-1 !text-noctvm-sm !font-medium !text-noctvm-silver !shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:!bg-white/[0.06] focus-visible:!border-noctvm-violet/50"
                    title="Sort venues"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    sideOffset={8}
                    className="!z-[500] !min-w-[8.5rem] !rounded-[20px] !border-white/10 !bg-noctvm-black/82 !p-2 !shadow-[0_24px_48px_rgba(0,0,0,0.55)]"
                  >
                    <SelectItem value="popularity">Popular</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="name">A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Popover open={genreDropdownOpen} onOpenChange={setGenreDropdownOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`w-full h-[34px] flex items-center justify-between gap-2 px-3 rounded-full corner-smooth-none text-noctvm-sm font-medium frosted-glass transition-colors ${
                      props.activeGenre === 'All'
                        ? 'text-noctvm-silver hover:border-noctvm-violet/30'
                        : 'bg-noctvm-violet/10 border-noctvm-violet/20 text-foreground'
                    }`}
                  >
                    <span>{props.activeGenre === 'All' ? 'All Genres' : props.activeGenre}</span>
                    <svg
                      className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${genreDropdownOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={8}
                  style={{ width: 'var(--radix-popover-trigger-width)' }}
                  className="!z-[500] !p-0 !rounded-xl !border-white/10 !shadow-2xl overflow-hidden"
                >
                  <CurvedScrollBar
                    className="w-full h-48"
                    viewportClassName="p-3"
                    scrollBarColor="rgb(var(--noctvm-violet-rgb) / 0.92)"
                    scrollBarWidth={4}
                    visibleLength={56}
                    edgePadding={2}
                    cornerRadius={12}
                    verticalInset={2}
                    fadeEdges
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {allGenres.map(genre => (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => {
                            props.onGenreChange?.(genre);
                            setGenreDropdownOpen(false);
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            props.activeGenre === genre
                              ? 'bg-noctvm-violet/85 text-foreground'
                              : 'bg-noctvm-surface text-noctvm-silver border border-noctvm-border hover:border-noctvm-violet/30'
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </CurvedScrollBar>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
