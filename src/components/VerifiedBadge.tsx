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
  
  // Color palette derived from the provided images
  const colors = {
    blue: {
      inner: '#48CBF4',
      stripes: '#9EE7F9',
      border: '#111111', // Dark border of the badge itself
      check: '#FFFFFF',
    },
    premium: {
      inner: '#995BFF',
      border: '#111111',
      check: '#5EFFA1',
    }
  };

  const activeColors = isGold ? colors.premium : colors.blue;
  
  // A professional seal/wavy path
  const badgePath = "M12 21.66c-.52 0-1.03-.13-1.49-.38l-1.68-.92a2.97 2.97 0 00-2.84 0l-1.68.92c-.89.49-1.95.42-2.77-.18s-1.21-1.61-1.02-2.6l.35-1.89c.1-.53 0-1.07-.27-1.54l-.94-1.66c-.5-.88-.47-1.94.07-2.79.54-.86 1.49-1.34 2.49-1.25l1.91.17c.54.05 1.07-.12 1.5-.47l1.49-1.2c.79-.64 1.86-.77 2.76-.32l1.69.83c.48.24 1.03.3 1.55.19l1.88-.4c1-.22 2.01.19 2.62 1.04s.7 1.93.24 2.82l-.84 1.71c-.24.49-.3 1.04-.18 1.56l.44 1.87c.23 1 .1 2.01-.76 2.62s-1.93.7-2.81.25l-1.72-.88c-.49-.25-1.05-.31-1.57-.18l-1.89.47c-.16.05-.33.07-.5.07z";
  
  // Actually, the path above is complex. Let's use a simpler, more "chunky" one like in the image.
  // The image has 16 waves.
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
        className="w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
      >
        <defs>
          <pattern id="badgeStripes" patternUnits="userSpaceOnUse" width="24" height="1.5" patternTransform="rotate(0)">
            <rect width="24" height="0.6" fill={colors.blue.stripes} />
          </pattern>
        </defs>

        {/* 1. White Outer Sticker Border (The largest layer) */}
        <path d={chunkySealPath} fill="white" transform="scale(1.1) translate(-1.1, -1.1)" />
        
        {/* 2. Hard Black Shadow (Bottom-Right) */}
        <path d={chunkySealPath} fill="black" transform="translate(1, 1.5)" />
        
        {/* 3. Dark Outer Border of the seal itself */}
        <path d={chunkySealPath} fill={activeColors.border} />
        
        {/* 4. Main Colored Insert (Slightly smaller) */}
        <path d={chunkySealPath} fill={activeColors.inner} transform="scale(0.85) translate(2.1, 2.1)" />
        
        {/* 5. Pattern Layer for Blue */}
        {!isGold && (
          <g transform="scale(0.85) translate(2.1, 2.1)">
             <path d={chunkySealPath} fill="url(#badgeStripes)" />
          </g>
        )}

        {/* 6. Checkmark Hard Shadow */}
        <path 
           d="M8.5 12.5L11 15L16.5 9.5" 
           stroke="black" 
           strokeWidth="2.5" 
           strokeLinecap="round" 
           strokeLinejoin="round" 
           transform="translate(0.8, 1)"
        />
        
        {/* 7. Main Thick Checkmark */}
        <path 
          d="M8.5 12.5L11 15L16.5 9.5" 
          stroke={activeColors.check} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    </div>
  );
}
