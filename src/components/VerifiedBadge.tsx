'use client';

import React from 'react';

interface VerifiedBadgeProps {
  type: 'owner' | 'admin' | 'verified' | 'gold' | 'none';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * VerifiedBadge - Recreates the sticker-style badges.
 * 'owner'   -> Purple (current verified)
 * 'admin'   -> Pink with cyan checkmark
 * 'verified' -> Also purple for legacy/consistency
 */
export default function VerifiedBadge({ type, size = 'md', className = '' }: VerifiedBadgeProps) {
  if (type === 'none' || !type) return null;

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
  };

  const isAdmin = type === 'admin';
  
  const colors = {
    owner: { // Violet
      inner: '#7C3AED', // noctvm-violet
      margin: '#FFFFFF',
      check: '#10B981', // noctvm-emerald
      border: '#6D28D9',
    },
    admin: { // Pink
      inner: '#FF4DFF', 
      margin: '#FFFFFF',
      check: '#00FFFF', // Cyan checkmark
      border: '#D400D4',
    }
  };

  const activeColors = isAdmin ? colors.admin : colors.owner;
  
  const chunkySealPath = "M12 2L14.2 3.6L16.8 3.2L18.4 5.3L21 5.8L21.4 8.5L23.4 10.4L22.6 13L23.4 15.6L21.4 17.5L21 20.2L18.4 20.7L16.8 22.8L14.2 22.4L12 24L9.8 22.4L7.2 22.8L5.6 20.7L3 20.2L2.6 17.5L0.6 15.6L1.4 13L0.6 10.4L2.6 8.5L3 5.8L5.6 5.3L7.2 3.2L9.8 3.6L12 2Z";

  return (
    <div 
      className={`inline-flex items-center justify-center flex-shrink-0 ${sizeClasses[size]} ${className}`} 
      title={isAdmin ? 'Admin' : 'Verified Owner'}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
      >
        {/* 1. Hard Black Shadow (Offset) */}
        <path d={chunkySealPath} fill="black" transform="translate(1, 1.5)" />
        
        {/* 2. Outer Border */}
        <path d={chunkySealPath} fill={activeColors.border} />
        
        {/* 3. Main Colored Body */}
        <path d={chunkySealPath} fill={activeColors.inner} transform="scale(0.88) translate(1.6, 1.6)" />
        
        {/* 4. White Wavy Margin */}
        <path 
          d={chunkySealPath} 
          stroke="white" 
          strokeWidth="0.8" 
          fill="none" 
          transform="scale(0.8) translate(3, 3)" 
        />

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
