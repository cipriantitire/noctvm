'use client';

import { useRef, useState, useEffect } from 'react';
import FilterBar from './FilterBar';
import { SearchIcon } from './icons';

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
  const genreDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!genreDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target as Node)) {
        setGenreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [genreDropdownOpen]);

  return (
    <div 
      className={`sticky z-20 transition-all duration-300 ease-in-out mb-4 ${headerHidden ? '-translate-y-[220%] top-0' : 'top-[56px]'} lg:!top-0`}
    >
      <div className="frosted-noise frosted-glass-header rounded-2xl p-4 shadow-xl">
        {/* Desktop Header area */}
        <div className="hidden lg:flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-noctvm-silver">{type === 'events' ? 'Nightlife' : 'Venues'} in</span>
            <div className="relative">
                <select
                  value={activeCity}
                  onChange={(e) => onCityChange(e.target.value as 'bucuresti' | 'constanta')}
                  className="bg-noctvm-surface border border-noctvm-border rounded-lg px-3 py-1 text-sm text-white font-medium focus:outline-none focus:border-noctvm-violet/50 cursor-pointer pr-7 appearance-none"
                  title="Select city"
                >
                <option value="bucuresti">București</option>
                <option value="constanta">Constanța</option>
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-noctvm-silver pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
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
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <SearchIcon className="w-4 h-4 text-noctvm-silver/50" />
                </div>
                <input
                  type="text"
                  placeholder="Search venues or genres..."
                  title="Search venues"
                  value={props.venueSearch || ''}
                  onChange={e => props.onVenueSearchChange?.(e.target.value)}
                  className="w-full bg-noctvm-surface border border-noctvm-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-noctvm-silver/50 focus:outline-none focus:border-noctvm-violet/50 focus:shadow-glow transition-all"
                />
                {props.venueSearch && (
                  <button
                    type="button"
                    onClick={() => props.onVenueSearchChange?.('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-noctvm-silver hover:text-white transition-colors"
                    aria-label="Clear venue search"
                    title="Clear venue search"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              
              <div className="flex p-1 bg-noctvm-surface border border-noctvm-border rounded-xl shadow-inner flex-shrink-0 h-[42px] items-center">
                <button
                  type="button"
                  onClick={() => props.onVenueViewChange?.('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${props.venueView === 'grid' ? 'bg-noctvm-violet text-white shadow-lg' : 'text-noctvm-silver hover:text-white'}`}
                  aria-label="Switch to grid view"
                  title="Switch to grid view"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
                </button>
                <div className="w-px h-4 bg-noctvm-border self-center mx-1 opacity-50" />
                <button
                  type="button"
                  onClick={() => props.onVenueViewChange?.('list')}
                  className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${props.venueView === 'list' ? 'bg-noctvm-violet text-white shadow-lg' : 'text-noctvm-silver hover:text-white'}`}
                  aria-label="Switch to list view"
                  title="Switch to list view"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                </button>
              </div>

              <div className="flex p-1 bg-noctvm-surface border border-noctvm-border rounded-xl shadow-inner flex-shrink-0 h-[42px] items-center px-3">
                <select 
                  value={props.venueSort}
                  onChange={(e) => props.onVenueSortChange?.(e.target.value as any)}
                  className="bg-transparent text-noctvm-caption font-bold text-white focus:outline-none cursor-pointer appearance-none uppercase"
                  title="Sort venues"
                >
                  <option value="popularity">POPULAR</option>
                  <option value="events">EVENTS</option>
                  <option value="name">A-Z</option>
                </select>
              </div>
            </div>

            <div className="relative" ref={genreDropdownRef}>
              <button
                onClick={() => setGenreDropdownOpen(o => !o)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  props.activeGenre === 'All'
                    ? 'bg-noctvm-surface border-noctvm-border text-noctvm-silver hover:border-noctvm-violet/30'
                    : 'bg-noctvm-violet/10 border-noctvm-violet/50 text-noctvm-violet'
                }`}
              >
                <span>{props.activeGenre === 'All' ? 'All Genres' : props.activeGenre}</span>
                <svg
                  className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${genreDropdownOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {genreDropdownOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-noctvm-black/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  <div className="flex flex-wrap gap-1.5 p-3 max-h-48 overflow-y-auto">
                    {allGenres.map(genre => (
                      <button
                        key={genre}
                        onClick={() => { props.onGenreChange?.(genre); setGenreDropdownOpen(false); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          props.activeGenre === genre
                            ? 'bg-noctvm-violet text-white shadow-glow'
                            : 'bg-noctvm-surface text-noctvm-silver border border-noctvm-border hover:border-noctvm-violet/30'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Count footer */}
        <div className="flex items-center mt-1">
          <span className="text-noctvm-caption text-noctvm-silver/50 font-mono">
            {type === 'events' ? `${eventsCount || 0} events` : `${venuesCount || 0} venues`}
          </span>
        </div>
      </div>
    </div>
  );
}
