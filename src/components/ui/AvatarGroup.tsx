'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarGroupItemProps {
  src?: string;
  name?: string;
  size?: AvatarSize;
}

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: AvatarGroupItemProps[];
  max?: number;
  size?: AvatarSize;
  overlap?: 'sm' | 'md' | 'lg';
}

const sizeMap: Record<AvatarSize, { img: string; text: string; border: string }> = {
  sm: { img: 'w-7 h-7', text: 'text-noctvm-xs', border: 'border-[1.5px]' },
  md: { img: 'w-9 h-9', text: 'text-noctvm-caption', border: 'border-2' },
  lg: { img: 'w-12 h-12', text: 'text-sm', border: 'border-2' },
};

const overlapMap: Record<'sm' | 'md' | 'lg', string> = {
  sm: '-ml-1.5',
  md: '-ml-2.5',
  lg: '-ml-3',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, avatars, max = 4, size = 'md', overlap = 'md', ...props }, ref) => {
    const visible = avatars.slice(0, max);
    const overflow = avatars.length - max;
    const s = sizeMap[size];
    const ol = overlapMap[overlap];

    return (
      <div
        ref={ref}
        className={cn('flex items-center', className)}
        {...props}
      >
        {visible.map((avatar, i) => (
          <div
            key={i}
            className={cn(
              s.img,
              s.border,
              'rounded-full border-noctvm-black bg-noctvm-surface-light flex-shrink-0 overflow-hidden',
              'ring-0',
              i > 0 && ol
            )}
            style={{ zIndex: visible.length - i }}
          >
            {avatar.src ? (
              <img
                src={avatar.src}
                alt={avatar.name ?? `User ${i + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-noctvm-violet/30">
                <span className={cn(s.text, 'text-foreground font-semibold')}>
                  {avatar.name ? getInitials(avatar.name) : '?'}
                </span>
              </div>
            )}
          </div>
        ))}
        {overflow > 0 && (
          <div
            className={cn(
              s.img,
              s.border,
              'rounded-full border-noctvm-black bg-noctvm-surface-light flex-shrink-0',
              'flex items-center justify-center',
              ol
            )}
            style={{ zIndex: 0 }}
          >
            <span className={cn(s.text, 'text-noctvm-silver font-semibold')}>
              +{overflow}
            </span>
          </div>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = 'AvatarGroup';

export { AvatarGroup };
export type { AvatarGroupProps, AvatarGroupItemProps };
