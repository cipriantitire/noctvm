'use client';

import { useState, useRef, useEffect } from 'react';
import { SearchIcon } from './icons';

const GENRE_FILTERS = [
  'All', 'Techno', 'House', 'Electronic', 'Minimal', 'Underground',
  'Club', 'Party', 'Hip-Hop', 'Reggaeton', 'Latin', 'Live Music',
  'Alternative', 'Drum & Bass', 'Hard Dance', 'Hardcore', 'Dub',
  'Reggae', 'Bass Music', 'Experimental', 'Deep House', 'Acid',
  'EBM', 'Nightlife', 'Queer'
];

interface FilterBarProps {
  activeGenres: string[];
  onGenreChange: (genres: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'portrait' | 'landscape';
  onViewModeChange: (mode: 'portrait' | 'landscape') => void;
  selectedDate: string | null;
  onDateChange: (d: string | null) => void;
}

export default function FilterBar({
  activeGenres,
  onGenreChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  selectedDate,
  onDateChange,
}: FilterBarProps) {
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!genreDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setGenreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [genreDropdownOpen]);

  const handleGenreClick = (genre: string) => {
    if (genre === 'All') {
      onGenreChange(['All']);
      return;
    }
    let next = activeGenres.filter(g => g !== 'All');
    if (next.includes(genre)) {
      next = next.filter(g => g !== genre);
    } else {
      next = [...next, genre];
    }
    if (next.length === 0) next = ['All'];
    onGenreChange(next);
  };

  return (
    <div className="space-y-2 mb-4">
      {/* Row 1: Search + view toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon className="w-4 h-4 text-noctvm-silver/50" />
          </div>
          <input
            type="text"
            placeholder="Search events, venues..."
            value={searchQuery}
            className="w-full bg-noctvm-surface border border-noctvm-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-noctvm-silver/50 focus:outline-none focus:border-noctvm-violet/50 focus:shadow-glow transition-all"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* View mode toggle */}
        <div className="flex p-1 bg-noctvm-surface border border-noctvm-border rounded-xl shadow-inner flex-shrink-0 h-[42px]">
          <button
            onClick={() => onViewModeChange('portrait')}
            className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
              viewMode === 'portrait'
                ? 'bg-noctvm-violet text-white shadow-lg scale-105'
                : 'text-noctvm-silver hover:text-white'
            }`}
            title="Grid view"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </button>
          <div className="w-px h-4 bg-noctvm-border self-center mx-1 opacity-50" />
          <button
            onClick={() => onViewModeChange('landscape')}
            className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
              viewMode === 'landscape'
                ? 'bg-noctvm-violet text-white shadow-lg scale-105'
                : 'text-noctvm-silver hover:text-white'
            }`}
            title="List view"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Row 2: Date + Genres dropdown */}
      <div className="flex items-center gap-2">
        {/* Date button */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => {
              const input = document.getElementById('event-date-filter') as HTMLInputElement;
              input?.showPicker?.();
              input?.click();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              selectedDate
                ? 'bg-noctvm-violet/20 border-noctvm-violet/50 text-noctvm-violet'
                : 'bg-noctvm-surface border-noctvm-border text-noctvm-silver hover:border-noctvm-violet/30'
            }`}
          >
            {selectedDate ? (
              <>
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                <span
                  onClick={e => { e.stopPropagation(); onDateChange(null); }}
                  className="ml-1 hover:text-white"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Date
              </>
            )}
          </button>
          <input
            id="event-date-filter"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={selectedDate ?? ''}
            onChange={e => onDateChange(e.target.value || null)}
            className="absolute opacity-0 pointer-events-none w-0 h-0"
          />
        </div>

        {/* Genres dropdown */}
        <div className="relative flex-1" ref={dropdownRef}>
          <button
            onClick={() => setGenreDropdownOpen(o => !o)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              activeGenres.includes('All')
                ? 'bg-noctvm-surface border-noctvm-border text-noctvm-silver hover:border-noctvm-violet/30'
                : 'bg-noctvm-violet/10 border-noctvm-violet/50 text-noctvm-violet'
            }`}
          >
            <span>
              {activeGenres.includes('All')
                ? 'All Genres'
                : `${activeGenres.length} genre${activeGenres.length > 1 ? 's' : ''}`}
            </span>
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

          {genreDropdownOpen && (
            <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-noctvm-midnight border border-noctvm-border rounded-xl shadow-xl overflow-hidden">
              <div className="flex flex-wrap gap-1.5 p-3 max-h-48 overflow-y-auto">
                {GENRE_FILTERS.map(genre => {
                  const isActive = activeGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      onClick={() => handleGenreClick(genre)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-noctvm-violet text-white shadow-glow'
                          : 'bg-noctvm-surface text-noctvm-silver border border-noctvm-border hover:border-noctvm-violet/30'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
