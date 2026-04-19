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
  showAddStoryButton?: boolean;
  onAddStoryClick?: () => void;
  addStoryButtonSize?: 'sm' | 'md' | 'lg' | 'xl';
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
  showAddStoryButton = false,
  onAddStoryClick,
  addStoryButtonSize,
}: AvatarProps) {
  const baseSizeClass = sizeClasses[size];
  const addButtonSizeClass = addStoryButtonSize === 'xl'
    ? 'w-8 h-8'
    : addStoryButtonSize === 'lg'
      ? 'w-6 h-6'
      : addStoryButtonSize === 'md'
        ? 'w-5 h-5'
        : addStoryButtonSize === 'sm'
          ? 'w-4 h-4'
          : size === 'sm'
            ? 'w-4 h-4'
            : size === 'md'
              ? 'w-5 h-5'
              : 'w-6 h-6';
  const addButtonOffsetClass = addStoryButtonSize === 'xl' ? '-bottom-1 -right-1' : '-bottom-0.5 -right-0.5';
  const addButtonIconClass = addStoryButtonSize === 'xl'
    ? 'h-4 w-4'
    : addStoryButtonSize === 'lg'
      ? 'h-3 w-3'
      : 'h-2.5 w-2.5';

  // Render the inner circle (image or fallback)
  const innerContent = src ? (
    <Image src={src} alt={alt} fill className="object-cover" unoptimized />
  ) : (
    <span className="font-bold text-white uppercase">{fallback[0]}</span>
  );

  const innerCircle = (
    <div className={`rounded-full overflow-hidden bg-noctvm-surface w-full h-full relative ${ring === 'none' ? 'border border-transparent' : 'border border-white/10'}`}>
      {innerContent}
    </div>
  );

  let ringOuterClass = '';

  if (ring === 'story-unseen') {
    ringOuterClass = 'bg-gradient-to-tr from-noctvm-violet via-purple-500 to-fuchsia-500 p-[2px] rounded-full';
  } else if (ring === 'story-seen') {
    ringOuterClass = 'bg-white/20 p-[1.5px] rounded-full';
  } else if (ring === 'highlight') {
    ringOuterClass = 'bg-noctvm-silver p-[1.5px] rounded-full';
  } else if (ring === 'live') {
    ringOuterClass = 'bg-red-500 p-[2px] rounded-full animate-pulse';
  }

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center ${baseSizeClass} ${ring === 'none' ? '' : ringOuterClass} ${className}`}
    >
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={alt}
          title={alt}
          className="block h-full w-full rounded-full cursor-pointer transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noctvm-violet/60"
        >
          {innerCircle}
        </button>
      ) : (
        innerCircle
      )}
      {showAddStoryButton && (
        <button
          type="button"
          aria-label="Add story"
          title="Add story"
          onClick={(event) => {
            event.stopPropagation();
            onAddStoryClick?.();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className={`absolute ${addButtonOffsetClass} flex items-center justify-center rounded-full border border-noctvm-black/70 ring-1 ring-white/20 bg-[linear-gradient(155deg,rgba(124,58,237,0.72),rgba(124,58,237,0.44))] text-white shadow-[0_6px_12px_rgba(5,5,5,0.45),inset_0_1px_0_rgba(255,255,255,0.30)] backdrop-blur-md backdrop-saturate-150 hover:scale-105 hover:brightness-105 active:scale-95 transition-all ${addButtonSizeClass}`}
        >
          <svg className={addButtonIconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
    </div>
  );
}
