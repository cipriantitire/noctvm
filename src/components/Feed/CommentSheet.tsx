'use client';

import { useScrollFade } from '@/hooks/useScrollFade';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui';
import CommentSection from './CommentSection';

interface CommentSheetProps {
  postId: string;
  postOwnerId: string;
  currentUserId: string | null;
  storyRingByUserId?: Record<string, 'none' | 'story-unseen' | 'story-seen'>;
  onClose: () => void;
}

/**
 * Full-screen bottom sheet for comments on mobile.
 * Slides up from the bottom, covers whole viewport with Radix Sheet handling pointer interactions.
 */
export default function CommentSheet({ postId, postOwnerId, currentUserId, storyRingByUserId, onClose }: CommentSheetProps) {
  const { ref, maskStyle } = useScrollFade('y');

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="lg:hidden">
        <SheetHeader>
          <SheetTitle className="uppercase tracking-widest">Comments</SheetTitle>
        </SheetHeader>

        {/* Scrollable comment content */}
        <div ref={ref} style={maskStyle} className="flex-1 overflow-y-auto overscroll-contain px-0">
          <CommentSection
            postId={postId}
            postOwnerId={postOwnerId}
            currentUserId={currentUserId}
            isCollapsed={false}
            storyRingByUserId={storyRingByUserId}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
