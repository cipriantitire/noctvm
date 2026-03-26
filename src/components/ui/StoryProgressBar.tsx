'use client';

import React from 'react';

export interface StoryProgressBarProps {
  /** The total number of stories in the current segment/group */
  totalStories: number;
  /** The index (0-based) of the currently active story */
  currentIndex: number;
  /** The progress percentage (0-100) of the current story */
  progress: number;
  /** Optional class name to override styles */
  className?: string;
  /** Custom colors, defaults to white and white/30 */
  activeColor?: string;
  inactiveColor?: string;
}

export function StoryProgressBar({
  totalStories,
  currentIndex,
  progress,
  className = '',
  activeColor = 'bg-white',
  inactiveColor = 'bg-white/30'
}: StoryProgressBarProps) {
  if (totalStories <= 0) return null;

  // We create an array of size totalStories
  return (
    <div className={`flex gap-1 w-full z-20 ${className}`}>
      {Array.from({ length: totalStories }).map((_, i) => {
        // Calculate the width of the active bar for this segment
        let width = '0%';
        if (i < currentIndex) {
          width = '100%'; // Past stories are fully complete
        } else if (i === currentIndex) {
          width = `${progress}%`; // Current story shows actual progress
        }

        return (
          <div key={i} className={`flex-1 h-0.5 rounded-full overflow-hidden ${inactiveColor}`}>
            <div 
              className={`h-full rounded-full transition-all duration-[40ms] ease-linear ${activeColor}`} 
              style={{ width }} 
            />
          </div>
        );
      })}
    </div>
  );
}

export default StoryProgressBar;
