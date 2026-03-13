'use client';

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
}

export default function FilterBar({
  activeGenres,
  onGenreChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: FilterBarProps) {
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
    <div className="space-y-3 mb-4">
      {/* Search + view toggle row */}
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

      {/* Genre pills */}
      <div className="flex flex-wrap gap-2 pb-1">
        {GENRE_FILTERS.map((genre) => {
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
  );
}
