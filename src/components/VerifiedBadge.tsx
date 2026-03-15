'use client';

import React from 'react';

interface VerifiedBadgeProps {
  type: 'blue' | 'gold' | 'none';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * VerifiedBadge - Recreates the sticker-style badges from the user images.
 * 'blue' -> Cyan with horizontal stripes and white checkmark.
 * 'gold' -> Purple with mint green checkmark (Premium NOCTVM style).
 */
export default function VerifiedBadge({ type, size = 'md', className = '' }: VerifiedBadgeProps) {
  if (type === 'none') return null;

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
  };

  const isGold = type === 'gold';
  
  // Color palette derived from the user request and image
  const colors = {
    blue: {
      inner: '#48CBF4',
      stripes: '#9EE7F9',
      border: '#6B21A8', // Deep Purple Margin
      check: '#FFFFFF',
    },
    premium: {
      inner: '#995BFF',
      border: '#7C3AED', // Slightly darker purple margin
      check: '#5EFFA1', // Mint Green Tick
    }
  };

  const activeColors = isGold ? colors.premium : colors.blue;
  
  // The chunky seal path from the image
  const chunkySealPath = "M12 2L14.2 3.6L16.8 3.2L18.4 5.3L21 5.8L21.4 8.5L23.4 10.4L22.6 13L23.4 15.6L21.4 17.5L21 20.2L18.4 20.7L16.8 22.8L14.2 22.4L12 24L9.8 22.4L7.2 22.8L5.6 20.7L3 20.2L2.6 17.5L0.6 15.6L1.4 13L0.6 10.4L2.6 8.5L3 5.8L5.6 5.3L7.2 3.2L9.8 3.6L12 2Z";

  return (
    <div 
      className={`inline-flex items-center justify-center flex-shrink-0 ${sizeClasses[size]} ${className}`} 
      title={isGold ? 'Verified Venue' : 'Verified User'}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
      >
        <defs>
          <pattern id="badgeStripes" patternUnits="userSpaceOnUse" width="24" height="2" patternTransform="rotate(0)">
            <rect width="24" height="1" fill={colors.blue.stripes} fillOpacity="0.6" />
          </pattern>
        </defs>

        {/* 1. Hard Black Shadow (Offset) */}
        <path d={chunkySealPath} fill="black" transform="translate(1, 1.5)" />
        
        {/* 2. Outer Border (The Margin Color) */}
        <path d={chunkySealPath} fill={activeColors.border} />
        
        {/* 3. Main Colored Insert (Slightly smaller to show the border/margin) */}
        <path d={chunkySealPath} fill={activeColors.inner} transform="scale(0.88) translate(1.6, 1.6)" />
        
        {/* 4. Pattern Layer for Blue */}
        {!isGold && (
          <g transform="scale(0.88) translate(1.6, 1.6)">
             <path d={chunkySealPath} fill="url(#badgeStripes)" />
          </g>
        )}

        {/* 5. Checkmark Hard Shadow */}
        <path 
           d="M8.5 12.5L11 15L16.5 9.5" 
           stroke="black" 
           strokeWidth="2.8" 
           strokeLinecap="round" 
           strokeLinejoin="round" 
           transform="translate(0.8, 1)"
        />
        
        {/* 6. Main Thick Checkmark */}
        <path 
          d="M8.5 12.5L11 15L16.5 9.5" 
          stroke={activeColors.check} 
          strokeWidth="2.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    </div>
  );
}
