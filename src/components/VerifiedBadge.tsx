'use client';

import React from 'react';

interface VerifiedBadgeProps {
  type: 'blue' | 'gold' | 'none';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function VerifiedBadge({ type, size = 'md', className = '' }: VerifiedBadgeProps) {
  if (type === 'none') return null;

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const isGold = type === 'gold';

  return (
    <div className={`inline-flex items-center justify-center flex-shrink-0 ${sizeClasses[size]} ${className}`} title={isGold ? 'Verified Venue/Organization' : 'Verified User'}>
      <svg
        viewBox="0 0 24 24"
        aria-label="Verified account"
        role="img"
        className={`w-full h-full ${isGold ? 'text-[#FFD700]' : 'text-[#1d9bf0]'}`}
        fill="currentColor"
      >
        <g>
          <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.97-.81-4.08s-2.47-1.49-4.08-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.97-.2-4.08.81s-1.49 2.47-.81 4.08c-1.31.66-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.97.81 4.08s2.47 1.49 4.08.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.33-2.19c1.4.46 2.97.2 4.08-.81s1.49-2.47.81-4.08c1.32-.66 2.2-1.91 2.2-3.34zm-11.71 4.2l-3.22-3.22 1.44-1.44 1.76 1.77 4.28-4.28 1.44 1.44-5.7 5.73z"></path>
        </g>
      </svg>
    </div>
  );
}
