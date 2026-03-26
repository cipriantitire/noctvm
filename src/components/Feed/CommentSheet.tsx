'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui';
import CommentSection from './CommentSection';

interface CommentSheetProps {
  postId: string;
  postOwnerId: string;
  currentUserId: string | null;
  onClose: () => void;
}

/**
 * Full-screen bottom sheet for comments on mobile.
 * Slides up from the bottom, covers whole viewport with Radix Sheet handling pointer interactions.
 */
export default function CommentSheet({ postId, postOwnerId, currentUserId, onClose }: CommentSheetProps) {

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="lg:hidden">
        <SheetHeader>
          <SheetTitle className="uppercase tracking-widest">Comments</SheetTitle>
        </SheetHeader>

        {/* Scrollable comment content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-0">
          <CommentSection
            postId={postId}
            postOwnerId={postOwnerId}
            currentUserId={currentUserId}
            isCollapsed={false}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
