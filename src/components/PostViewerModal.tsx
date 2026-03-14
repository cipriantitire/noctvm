'use client';
import { useState, useEffect } from 'react';

interface ProfilePost {
  id: string;
  image_url: string | null;
  caption: string | null;
  created_at: string;
  likes_count?: number;
}

interface PostViewerModalProps {
  posts: ProfilePost[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostViewerModal({ posts, initialIndex, isOpen, onClose }: PostViewerModalProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => { if (isOpen) setIndex(initialIndex); }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) setIndex(i => i - 1);
      if (e.key === 'ArrowRight' && index < posts.length - 1) setIndex(i => i + 1);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, index, posts.length, onClose]);

  if (!isOpen || posts.length === 0) return null;

  const post = posts[index];
  const hasPrev = index > 0;
  const hasNext = index < posts.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-noctvm-surface rounded-2xl overflow-hidden border border-noctvm-border shadow-2xl z-10">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-noctvm-silver hover:text-white hover:bg-black/80 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        {/* Image */}
        <div className="relative aspect-square bg-noctvm-midnight">
          {post.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image_url} alt="" className="w-full h-full object-contain bg-black" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-noctvm-violet/20 to-purple-900/20 flex items-center justify-center">
              <span className="text-noctvm-silver/30 text-sm text-center px-4">{post.caption}</span>
            </div>
          )}

          {/* Prev */}
          {hasPrev && (
            <button
              onClick={() => setIndex(i => i - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          {/* Next */}
          {hasNext && (
            <button
              onClick={() => setIndex(i => i + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[11px] font-mono">
            {index + 1} / {posts.length}
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="px-4 py-3">
            <p className="text-sm text-noctvm-silver">{post.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}
