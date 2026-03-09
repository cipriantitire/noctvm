'use client';

import { useState } from 'react';
import { SearchIcon } from './icons';

const GENRE_FILTERS = ['All', 'Techno', 'House', 'Hip-Hop', 'Manele', 'Live', 'Party', 'DnB', 'Reggaeton'];

interface FilterBarProps {
  activeGenres: string[];
  onFilterChange: (genres: string[]) => void;
  onSearchChange?: (query: string) => void;
}

export default function FilterBar({ activeGenres, onFilterChange, onSearchChange }: FilterBarProps) {
  const handleGenreClick = (genre: string) => {
    if (genre === 'All') {
      onFilterChange(['All']);
      return;
    }
    let next = activeGenres.filter(g => g !== 'All');
    if (next.includes(genre)) {
      next = next.filter(g => g !== genre);
    } else {
      next = [...next, genre];
    }
    if (next.length === 0) next = ['All'];
    onFilterChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <SearchIcon className="w-4 h-4 text-noctvm-silver/50" />
        </div>
        <input
          type="text"
          placeholder="Search events, venues..."
          className="w-full bg-noctvm-surface border border-noctvm-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-noctvm-silver/50 focus:outline-none focus:border-noctvm-violet/50 focus:shadow-glow transition-all"
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {GENRE_FILTERS.map((genre) => {
          const isActive = activeGenres.includes(genre);
          return (
            <button
              key={genre}
              onClick={() => handleGenreClick(genre)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
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