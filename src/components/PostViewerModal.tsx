'use client';
import { useState, useEffect } from 'react';
import { HeartIcon, ChatIcon, ShareIcon } from './icons';

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
  profileName?: string;
  profileAvatar?: string | null;
  profileInitial?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function PostViewerModal({
  posts,
  initialIndex,
  isOpen,
  onClose,
  profileName,
  profileAvatar,
  profileInitial,
}: PostViewerModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<string[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false);

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Reset per-post state when index changes
  useEffect(() => {
    setLiked(false);
    setLikeCount(posts[index]?.likes_count ?? 0);
    setComments([]);
    setCommentInput('');
    setShowComments(false);
  }, [index, posts]);

  // Keyboard navigation
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

  function handleLike() {
    if (liked) {
      setLiked(false);
      setLikeCount(c => Math.max(0, c - 1));
    } else {
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  }

  function handleAddComment() {
    const trimmed = commentInput.trim();
    if (!trimmed) return;
    setComments(prev => [...prev, trimmed]);
    setCommentInput('');
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Prev arrow */}
      {hasPrev && (
        <button
          onClick={() => setIndex(i => i - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all z-20"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Next arrow */}
      {hasNext && (
        <button
          onClick={() => setIndex(i => i + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all z-20"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {/* Post card */}
      <div className="relative w-full max-w-sm bg-noctvm-midnight rounded-2xl overflow-hidden border border-noctvm-border shadow-2xl z-10 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center gap-3 p-3 border-b border-noctvm-border flex-shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-noctvm-violet/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
            {profileAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white">{profileInitial || 'U'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">{profileName || 'User'}</p>
            <p className="text-[10px] text-noctvm-silver/60">{timeAgo(post.created_at)}</p>
          </div>
          {/* Counter */}
          <span className="text-[11px] text-noctvm-silver/60 font-mono flex-shrink-0">
            {index + 1}/{posts.length}
          </span>
          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-noctvm-silver hover:text-white hover:bg-black/60 transition-all ml-1 flex-shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="bg-noctvm-black flex-shrink-0">
          {post.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image_url} alt="" className="w-full object-contain max-h-[50vh]" />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-noctvm-violet/20 to-purple-900/20 flex items-center justify-center">
              <span className="text-noctvm-silver/30 text-sm px-4 text-center">{post.caption}</span>
            </div>
          )}
        </div>

        {/* Actions + content (scrollable) */}
        <div className="flex-1 overflow-y-auto">

          {/* Action row */}
          <div className="flex items-center gap-4 px-4 py-3">
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 hover:scale-110 active:animate-micro-pop transition-transform"
            >
              {liked ? (
                <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                <HeartIcon className="w-6 h-6 text-noctvm-silver hover:text-red-400 transition-colors" />
              )}
              <span className="text-sm font-semibold text-white">{likeCount}</span>
            </button>

            <button
              onClick={() => setShowComments(s => !s)}
              className="hover:scale-110 transition-transform"
            >
              <ChatIcon className="w-6 h-6 text-noctvm-silver hover:text-white transition-colors" />
            </button>

            <button className="ml-auto hover:scale-110 transition-transform">
              <ShareIcon className="w-6 h-6 text-noctvm-silver hover:text-white transition-colors" />
            </button>
          </div>

          {/* Likes count */}
          <p className="px-4 text-sm font-semibold text-white pb-1">
            {likeCount} like{likeCount !== 1 ? 's' : ''}
          </p>

          {/* Caption */}
          {post.caption && (
            <p className="px-4 pb-3 text-sm text-noctvm-silver leading-relaxed">{post.caption}</p>
          )}

          {/* Comments section */}
          {showComments && (
            <div className="border-t border-noctvm-border px-4 py-3 space-y-2">
              {comments.length === 0 && (
                <p className="text-xs text-noctvm-silver/40 italic">No comments yet.</p>
              )}
              {comments.map((c, ci) => (
                <p key={ci} className="text-xs text-noctvm-silver">{c}</p>
              ))}
              <div className="flex gap-2 mt-2 pt-2 border-t border-noctvm-border/50">
                <input
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-noctvm-silver/40 border-b border-noctvm-border focus:outline-none focus:border-noctvm-violet/50 pb-1"
                />
                {commentInput.trim() && (
                  <button
                    onClick={handleAddComment}
                    className="text-[11px] text-noctvm-violet font-semibold hover:text-noctvm-violet/80 transition-colors flex-shrink-0"
                  >
                    Post
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
