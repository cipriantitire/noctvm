'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { SearchIcon } from './icons';
import { Calendar } from './ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import CurvedScrollBar from './ui/CurvedScrollBar';

export const GENRE_FILTERS = [
  'All', 'Techno', 'House', 'Electronic', 'Minimal', 'Underground',
  'Club', 'Party', 'Hip-Hop', 'Reggaeton', 'Latin', 'Live Music',
  'Alternative', 'Drum & Bass', 'Hard Dance', 'Hardcore', 'Dub',
  'Reggae', 'Bass Music', 'Experimental', 'Deep House', 'Acid',
  'EBM', 'Nightlife', 'Queer', 'Melodic Techno', 'Indie Dance', 
  'Nu-Disco', 'Afro House', 'Progressive House', 'Tech House', 
  'Psytrance', 'Breaks', 'Garage', 'Grime', 'Phonk', 'Ambient', 
  'Downtempo', 'Jazz', 'Soul', 'Funk', 'Disco'
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
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

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

  const selectedDateValue = selectedDate ? parseISO(selectedDate) : undefined;
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-2">
      {/* Row 1: Search + view toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 h-[42px] frosted-glass rounded-full corner-smooth-none">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon className="w-4 h-4 text-noctvm-silver" />
          </div>
          <input
            type="text"
            placeholder="Search events, venues..."
            value={searchQuery}
            className="h-full w-full bg-transparent border-0 rounded-full corner-smooth-none pl-10 pr-4 text-sm text-noctvm-silver placeholder:text-noctvm-silver focus:outline-none focus:ring-0"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* View mode toggle */}
        <div className="flex h-[42px] flex-shrink-0 items-center rounded-full corner-smooth-none frosted-glass p-1">
          <button
            onClick={() => onViewModeChange('portrait')}
            className={`p-2 rounded-full corner-smooth-none transition-all duration-200 flex items-center justify-center ${
              viewMode === 'portrait'
                ? 'bg-noctvm-violet/15 text-white border border-noctvm-violet/20'
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
            className={`p-2 rounded-full corner-smooth-none transition-all duration-200 flex items-center justify-center ${
              viewMode === 'landscape'
                ? 'bg-noctvm-violet/15 text-white border border-noctvm-violet/20'
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
        <Popover open={dateDropdownOpen} onOpenChange={setDateDropdownOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`flex h-[34px] w-fit min-w-[5.25rem] items-center justify-center gap-1.5 rounded-full corner-smooth-none border border-white/10 px-3 text-xs font-medium frosted-glass transition-colors ${
                selectedDate
                  ? '!border-noctvm-violet/20 !bg-noctvm-violet/10 !text-white'
                  : '!text-noctvm-silver hover:!border-noctvm-violet/30'
              }`}
              title="Filter events by date"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{selectedDateValue ? format(selectedDateValue, 'd MMM') : 'Date'}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={8}
            className="!z-[500] !w-[min(19rem,calc(100vw-1rem))] !rounded-noctvm-md !border-noctvm-border !p-1 !shadow-md overflow-hidden"
          >
            <Calendar
              mode="single"
              selected={selectedDateValue}
              className="!rounded-noctvm-sm"
              onSelect={(date) => {
                onDateChange(date ? format(date, 'yyyy-MM-dd') : null);
                setDateDropdownOpen(false);
              }}
              disabled={{ before: todayDate }}
              initialFocus
            />
            <div className="flex items-center justify-between gap-2 px-2 py-2">
              <button
                type="button"
                onClick={() => {
                  onDateChange(null);
                  setDateDropdownOpen(false);
                }}
                className="rounded-noctvm-sm px-2 py-1 text-[11px] font-medium text-noctvm-silver/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  onDateChange(format(todayDate, 'yyyy-MM-dd'));
                  setDateDropdownOpen(false);
                }}
                className="rounded-noctvm-sm px-2 py-1 text-[11px] font-medium text-noctvm-silver/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                Today
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Genres dropdown */}
        <Popover open={genreDropdownOpen} onOpenChange={setGenreDropdownOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`w-full flex h-[34px] items-center justify-between gap-2 px-3 rounded-full corner-smooth-none text-xs font-medium frosted-glass transition-colors ${
                activeGenres.includes('All')
                  ? 'text-noctvm-silver hover:border-noctvm-violet/30'
                  : 'bg-noctvm-violet/10 border-noctvm-violet/20 text-white'
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
            >
              <div className="flex flex-wrap gap-1.5">
                {GENRE_FILTERS.map(genre => {
                  const isActive = activeGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleGenreClick(genre)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-noctvm-violet/85 text-white'
                          : 'bg-noctvm-surface text-noctvm-silver border border-noctvm-border hover:border-noctvm-violet/30'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </CurvedScrollBar>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
