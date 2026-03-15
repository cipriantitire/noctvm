'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HeartIcon, ChatIcon, ShareIcon, BookmarkIcon } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import PostOptionsMenu from './PostOptionsMenu';
import LikesModal from './LikesModal';

interface ProfilePost {
  id: string;
  user_id: string; // Added user_id
  image_url: string | null;
  caption: string;
  created_at: string;
  likes_count: number;
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
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<{ user: string; text: string }[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);

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
    // Like count + user's own like + user's own save
    const [countRes, userLikeRes, userSaveRes, commentsRes] = await Promise.all([
      supabase.from('post_likes').select('id', { count: 'exact', head: true }).eq('post_id', postId),
      user
        ? supabase.from('post_likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? supabase.from('post_saves').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from('post_comments')
        .select('text, profiles(username)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(50),
    ]);
    
    setLikeCount(countRes.count ?? 0);
    setLiked(!!userLikeRes.data);
    setSaved(!!userSaveRes.data);
    
    if (commentsRes.data) {
      // Cast through unknown to resolve type overlap error in build
      const rawComments = commentsRes.data as unknown as any[];
      const formattedComments = rawComments.map(c => ({
        user: (Array.isArray(c.profiles) ? c.profiles[0]?.username : c.profiles?.username) || 'user',
        text: c.text
      }));
      setComments(formattedComments);
    } else {
      setComments([]);
    }
    
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
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'post_likes', 
        filter: `post_id=eq.${postId}` 
      }, async () => {
        const { count } = await supabase.from('post_likes').select('id', { count: 'exact', head: true }).eq('post_id', postId);
        setLikeCount(count ?? 0);
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'post_comments', 
        filter: `post_id=eq.${postId}` 
      }, async (payload) => {
        const row = payload.new as { text: string; user_id: string };
        const { data: prof } = await supabase.from('profiles').select('username').eq('id', row.user_id).single();
        setComments(prev => [...prev, { user: prof?.username || 'user', text: row.text }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, index, post?.id]);

  if (!isOpen || posts.length === 0 || !post || typeof document === 'undefined') return null;

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

  // Save post is deprecated

  const handleSubmitComment = async () => {
    const text = commentInput.trim();
    if (!text || !user || submittingComment) return;
    setCommentInput('');
    setSubmittingComment(true);
    try {
      await supabase.from('post_comments').insert({ post_id: post.id, user_id: user.id, text });
      // Optimistic update already handled by realtime insert? 
      // Actually we update here too for immediate feedback
      if (!comments.some(c => c.text === text && c.user === (profile?.username || 'you'))) {
        setComments(prev => [...prev, { user: profile?.username || 'you', text }]);
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!user || user.id !== post.user_id) return;
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id).eq('user_id', user.id);
      if (error) throw error;
      onClose();
      window.location.reload(); // Simple way to refresh lists
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post.');
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

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl transition-opacity animate-fade-in" onClick={onClose} />

      {/* Close button top right */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-[110] p-2 text-white/50 hover:text-white transition-colors"
      >
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Nav Arrows */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 pointer-events-none z-[110]">
        <button
          onClick={() => setIndex(i => i - 1)}
          disabled={!hasPrev}
          className={`w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all pointer-events-auto ${!hasPrev ? 'opacity-0 scale-90' : 'opacity-100'}`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button
          onClick={() => setIndex(i => i + 1)}
          disabled={!hasNext}
          className={`w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all pointer-events-auto ${!hasNext ? 'opacity-0 scale-90' : 'opacity-100'}`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-5xl h-full md:h-[90vh] bg-noctvm-black md:rounded-xl overflow-hidden shadow-2xl z-[105] flex flex-col md:flex-row transition-transform animate-scale-in md:mx-0">
        
        {/* Left: Image Side */}
        <div className="flex-1 bg-black flex items-center justify-center relative min-h-[40vh] md:min-h-0">
          {post.image_url ? (
            <img 
              src={post.image_url} 
              alt="Post media" 
              className="w-full h-full object-contain"
            />
          ) : (
             <div className="w-full h-full bg-gradient-to-br from-noctvm-violet/20 to-purple-900/40 p-12 flex items-center justify-center">
                <p className="text-noctvm-silver text-center italic text-lg leading-relaxed">{post.caption}</p>
             </div>
          )}
        </div>

        {/* Right: Info + Comments Side */}
        <div className="w-full md:w-[400px] border-l border-noctvm-border flex flex-col bg-noctvm-surface">
          
          {/* Header */}
          <div className="p-4 border-b border-noctvm-border flex items-center gap-3 relative">
             <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-br from-noctvm-violet to-purple-500">
                <div className="w-full h-full rounded-full bg-noctvm-black p-0.5">
                   <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                      {profileAvatar ? (
                        <img src={profileAvatar} alt={profileName || 'Profile'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white">{profileInitial || 'U'}</span>
                      )}
                   </div>
                </div>
             </div>
              <div className="flex-1 min-w-0">
                 <button className="text-sm font-semibold text-white leading-tight truncate hover:text-noctvm-violet transition-colors">
                   {profileName || 'User'}
                 </button>
                 <p className="text-[10px] text-noctvm-silver/50 uppercase tracking-wider font-mono mt-0.5">{timeAgo(post.created_at)} ago</p>
              </div>
             <div className="relative">
                <button 
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-1.5 text-noctvm-silver/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                </button>
                {showOptions && (
                  <PostOptionsMenu
                    postId={post.id}
                    postUserId={post.user_id}
                    currentUserId={user?.id || null}
                    authorHandle={profileName || 'user'}
                    onClose={() => setShowOptions(false)}
                    onCopyLink={handleShare}
                    onDelete={handleDelete}
                  />
                )}
             </div>
          </div>

          {/* Comments Section (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
             {post.caption && (
               <div className="flex gap-3">
                  <div>
                     <p className="text-xs text-white leading-relaxed">
                        <button className="font-bold mr-2 text-noctvm-violet hover:underline focus:outline-none">
                          {profileName}
                        </button>
                        {post.caption}
                     </p>
                  </div>
               </div>
             )}

              {comments.map((c, i) => (
                <div key={i} className="flex gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="flex-1">
                    <p className="text-xs text-noctvm-silver leading-relaxed">
                      <button className="font-bold text-white hover:text-noctvm-violet transition-colors mr-1 focus:outline-none">
                        {c.user}
                      </button>
                      {c.text}
                    </p>
                    <div className="flex items-center gap-3 mt-1 op-60">
                      <span className="text-[10px] text-noctvm-silver/50">12h</span>
                      <button className="text-[10px] items-center font-semibold text-noctvm-silver/50 hover:text-white transition-colors">Reply</button>
                    </div>
                  </div>
                </div>
              ))}
             {comments.length === 0 && !post.caption && (
               <div className="flex flex-col items-center justify-center h-full py-20 opacity-30">
                  <ChatIcon className="w-8 h-8 mb-2" />
                  <p className="text-xs">No comments yet.</p>
               </div>
             )}
          </div>

          {/* Interaction Area */}
          <div className="p-4 border-t border-noctvm-border bg-noctvm-midnight/30">
             <div className="flex items-center gap-4 mb-3">
                <button onClick={handleLike} className={`${liked ? 'scale-110' : 'hover:scale-110 active:scale-90'} transition-all`}>
                  {liked 
                    ? <svg className="w-7 h-7 text-red-500 fill-current" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                    : <HeartIcon className="w-7 h-7 text-white/70 hover:text-white" />
                  }
                </button>
                <button className="hover:scale-110 active:scale-90 transition-all">
                  <ChatIcon className="w-7 h-7 text-white/70 hover:text-white" />
                </button>
                <button onClick={handleShare} className="hover:scale-110 active:scale-90 transition-all">
                  <ShareIcon className="w-7 h-7 text-white/70 hover:text-white" />
                </button>
             </div>

             <button 
               onClick={() => setShowLikesModal(true)}
               className="text-sm font-bold text-white mb-1 hover:underline focus:outline-none"
             >
               {likeCount.toLocaleString()} like{likeCount !== 1 ? 's' : ''}
             </button>
             <p className="text-[10px] text-noctvm-silver/50 uppercase font-mono">{timeAgo(post.created_at)} ago</p>

             <div className="mt-4 flex items-center gap-3">
                <input 
                  type="text" 
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-noctvm-silver/30 outline-none"
                />
                <button 
                  onClick={handleSubmitComment}
                  disabled={!commentInput.trim() || !user || submittingComment}
                  className="text-sm font-bold text-noctvm-violet hover:text-white transition-colors disabled:opacity-30"
                >
                  Post
                </button>
             </div>
          </div>

        </div>
      </div>
      <LikesModal
        postId={post.id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
      />
    </div>,
    document.body
  );
}
