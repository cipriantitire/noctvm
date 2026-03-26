import React from 'react';
import Image from 'next/image';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type AvatarRing = 'none' | 'story-unseen' | 'story-seen' | 'highlight' | 'live';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  ring?: AvatarRing;
  className?: string;
  onClick?: () => void;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-6 h-6 text-noctvm-caption',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base',
  '2xl': 'w-16 h-16 text-[20px]',
};

export default function Avatar({
  src,
  alt = 'Avatar',
  fallback = 'U',
  size = 'md',
  ring = 'none',
  className = '',
  onClick,
}: AvatarProps) {
  const baseSizeClass = sizeClasses[size];

  // Render the inner circle (image or fallback)
  const innerContent = src ? (
    <Image src={src} alt={alt} fill className="object-cover" unoptimized />
  ) : (
    <span className="font-bold text-white uppercase">{fallback[0]}</span>
  );

  // If no ring, just return a simple rounded div
  if (ring === 'none') {
    return (
      <div
        onClick={onClick}
        className={`relative rounded-full overflow-hidden bg-noctvm-surface flex items-center justify-center border border-white/10 shrink-0 ${baseSizeClass} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      >
        {innerContent}
      </div>
    );
  }

  // Handle Rings (Story rings, live rings, etc.)
  let ringOuterClass = '';
  let ringInnerPaddingClass = 'p-[2px]'; // Space between ring and avatar

  if (ring === 'story-unseen') {
    ringOuterClass = 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-noctvm-violet p-[2px] rounded-full';
  } else if (ring === 'story-seen') {
    ringOuterClass = 'bg-white/20 p-[1.5px] rounded-full';
  } else if (ring === 'highlight') {
    ringOuterClass = 'bg-noctvm-silver p-[1.5px] rounded-full';
  } else if (ring === 'live') {
    ringOuterClass = 'bg-red-500 p-[2px] rounded-full animate-pulse';
  }

  return (
    <div
      onClick={onClick}
      className={`relative shrink-0 flex items-center justify-center ${ringOuterClass} ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${className}`}
    >
      <div className={`rounded-full overflow-hidden bg-black w-full h-full relative border border-black`}>
        {innerContent}
      </div>
    </div>
  );
}
