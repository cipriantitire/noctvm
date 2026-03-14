'use client';

import { useState, useEffect, useCallback } from 'react';
import { HeartIcon, ChatIcon, ShareIcon } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

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
  const { user, profile } = useAuth();
  const [index, setIndex] = useState(initialIndex);

  // Per-post live state
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<{ user: string; text: string }[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const post = posts[index];

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) setIndex(initialIndex);
  }, [isOpen, initialIndex]);

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

  // Load post data from Supabase on post change
  const loadPostData = useCallback(async (postId: string) => {
    // Like count + user's own like
    const [countRes, userLikeRes, commentsRes] = await Promise.all([
      supabase.from('post_likes').select('id', { count: 'exact', head: true }).eq('post_id', postId),
      user
        ? supabase.from('post_likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('post_comments')
        .select('text, profiles(username)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(50),
    ]);
    setLikeCount(countRes.count ?? 0);
    setLiked(!!(userLikeRes as { data: unknown }).data);
    setComments(
      ((commentsRes.data ?? []) as { text: string; profiles: { username: string } | null }[]).map(c => ({
        user: c.profiles?.username || 'user',
        text: c.text,
      }))
    );
    setCommentInput('');
    setShowComments(false);
  }, [user]);

  useEffect(() => {
    if (!isOpen || !post?.id) return;
    loadPostData(post.id);
  }, [isOpen, index, post?.id, loadPostData]);

  // Realtime subscription for likes + comments on current post
  useEffect(() => {
    if (!isOpen || !post?.id) return;
    const postId = post.id;

    const channel = supabase
      .channel(`post_viewer_${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes', filter: `post_id=eq.${postId}` }, async () => {
        const { count } = await supabase.from('post_likes').select('id', { count: 'exact', head: true }).eq('post_id', postId);
        setLikeCount(count ?? 0);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` }, (payload) => {
        const row = payload.new as { text: string; user_id: string };
        setComments(prev => [...prev, { user: 'user', text: row.text }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, index, post?.id]);

  if (!isOpen || posts.length === 0 || !post) return null;

  const hasPrev = index > 0;
  const hasNext = index < posts.length - 1;
  const userInitial = profile ? (profile.display_name || profile.username || 'N')[0].toUpperCase() : 'N';

  const handleLike = async () => {
    if (loadingLike) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => newLiked ? c + 1 : Math.max(0, c - 1));
    if (!user) return;
    setLoadingLike(true);
    try {
      if (liked) {
        await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      } else {
        await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
      }
    } catch {
      setLiked(liked);
      setLikeCount(c => newLiked ? Math.max(0, c - 1) : c + 1);
    } finally {
      setLoadingLike(false);
    }
  };

  const handleSubmitComment = async () => {
    const text = commentInput.trim();
    if (!text || !user || submittingComment) return;
    setCommentInput('');
    setSubmittingComment(true);
    try {
      await supabase.from('post_comments').insert({ post_id: post.id, user_id: user.id, text });
      setComments(prev => [...prev, { user: profile?.username || 'you', text }]);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/?post=${post.id}`;
    if (navigator.share) {
      navigator.share({ url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

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

      {/* Post card — styled exactly like a FeedPage article */}
      <div className="relative w-full max-w-sm bg-noctvm-surface rounded-xl border border-noctvm-border overflow-hidden shadow-2xl z-10 flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center gap-3 p-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-noctvm-violet to-purple-500 flex items-center justify-center flex-shrink-0">
            {profileAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-white">{profileInitial || 'U'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white leading-tight truncate">{profileName || 'User'}</p>
            <p className="text-[10px] text-noctvm-silver">{timeAgo(post.created_at)}</p>
          </div>
          <span className="text-[11px] text-noctvm-silver/60 font-mono flex-shrink-0">{index + 1}/{posts.length}</span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-noctvm-silver hover:text-white hover:bg-black/80 transition-all ml-1 flex-shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="aspect-square bg-noctvm-black flex-shrink-0 overflow-hidden">
          {post.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-noctvm-violet/20 to-purple-900/20 flex items-center justify-center">
              <span className="text-noctvm-silver/30 text-sm px-4 text-center line-clamp-4">{post.caption}</span>
            </div>
          )}
        </div>

        {/* Actions + content (scrollable) */}
        <div className="flex-1 overflow-y-auto">
          {/* Action row */}
          <div className="flex items-center gap-3 px-3 pt-3">
            <button onClick={handleLike} disabled={loadingLike} className="hover:scale-110 active:animate-micro-pop transition-transform">
              {liked
                ? <svg className="w-6 h-6 text-red-500 animate-micro-pop" viewBox="0 0 24 24" fill="currentColor"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                : <HeartIcon className="w-6 h-6 text-noctvm-silver hover:text-red-400 transition-colors" />
              }
            </button>
            <button onClick={() => setShowComments(s => !s)} className="hover:scale-110 transition-transform">
              <ChatIcon className="w-6 h-6 text-noctvm-silver hover:text-white transition-colors" />
            </button>
            <button onClick={handleShare} className="ml-auto hover:scale-110 transition-transform">
              <ShareIcon className="w-6 h-6 text-noctvm-silver hover:text-white transition-colors" />
            </button>
          </div>

          <p className="px-3 pt-2 text-xs font-semibold text-white">{likeCount.toLocaleString()} like{likeCount !== 1 ? 's' : ''}</p>

          {post.caption && (
            <p className="px-3 pt-1 pb-2 text-xs text-noctvm-silver leading-relaxed">{post.caption}</p>
          )}

          {/* Comments */}
          <div className="px-3 pb-3">
            {comments.length > 0 && !showComments && (
              <button onClick={() => setShowComments(true)} className="text-[11px] text-noctvm-silver/60 hover:text-noctvm-silver mb-1 transition-colors">
                View all {comments.length} comment{comments.length !== 1 ? 's' : ''}
              </button>
            )}
            {showComments && (
              <div className="space-y-1 mb-2">
                {comments.length === 0 && <p className="text-[11px] text-noctvm-silver/40 italic">No comments yet.</p>}
                {comments.map((c, ci) => (
                  <p key={ci} className="text-[11px] text-noctvm-silver">
                    <span className="font-semibold text-white mr-1">{c.user}</span>{c.text}
                  </p>
                ))}
              </div>
            )}

            {/* Comment input */}
            <div className="flex items-center gap-2 pt-2 border-t border-noctvm-border">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-400 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {profile?.avatar_url
                  ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-[8px] font-bold text-white">{userInitial}</span>
                }
              </div>
              <input
                type="text"
                placeholder={user ? 'Add a comment...' : 'Sign in to comment'}
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmitComment(); }}
                disabled={!user}
                className="flex-1 bg-transparent text-[11px] text-noctvm-silver placeholder:text-noctvm-silver/30 outline-none disabled:cursor-not-allowed"
              />
              {commentInput.trim() && (
                <button
                  onClick={handleSubmitComment}
                  disabled={submittingComment}
                  className="text-[10px] text-noctvm-violet font-semibold hover:text-noctvm-violet/80 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  Post
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
