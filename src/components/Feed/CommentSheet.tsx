'use client';

import { useEffect, useRef } from 'react';
import CommentSection from './CommentSection';

interface CommentSheetProps {
  postId: string;
  postOwnerId: string;
  currentUserId: string | null;
  onClose: () => void;
}

/**
 * Full-screen bottom sheet for comments on mobile.
 * Slides up from the bottom, covers whole viewport, swipeable to dismiss.
 */
export default function CommentSheet({ postId, postOwnerId, currentUserId, onClose }: CommentSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const currentYRef = useRef<number>(0);

  // Lock body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Swipe-to-dismiss logic
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0 && sheetRef.current) {
      currentYRef.current = dy;
      sheetRef.current.style.transform = `translateY(${dy}px)`;
      sheetRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = () => {
    if (currentYRef.current > 120) {
      // Swiped down far enough → dismiss
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.3s ease';
        sheetRef.current.style.transform = 'translateY(100%)';
        setTimeout(onClose, 300);
      }
    } else {
      // Spring back
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.3s ease';
        sheetRef.current.style.transform = 'translateY(0)';
      }
    }
    startYRef.current = null;
    currentYRef.current = 0;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] lg:hidden"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-[201] lg:hidden flex flex-col bg-noctvm-midnight border-t border-noctvm-border rounded-t-3xl max-h-[90dvh] translate-y-0"
        style={{ animation: 'slideUp 0.35s cubic-bezier(0.32,0.72,0,1)' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-noctvm-border flex-shrink-0">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Comments</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-noctvm-silver hover:text-white transition-all"
            aria-label="Close comments"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable comment content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4">
          <CommentSection
            postId={postId}
            postOwnerId={postOwnerId}
            currentUserId={currentUserId}
            isCollapsed={false}
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
