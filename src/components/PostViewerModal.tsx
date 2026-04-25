'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useScrollFade } from '@/hooks/useScrollFade';
import { createPortal } from 'react-dom';
import { HeartIcon, ChatIcon, ShareIcon, BookmarkIcon } from './icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import PostOptionsMenu from './PostOptionsMenu';
import LikesSheet from './LikesSheet';
import { Avatar } from '@/components/ui';

import VerifiedBadge from './VerifiedBadge';
import CommentSection from './Feed/CommentSection';
import EditPostModal from './EditPostModal';
import TaggedUsersModal from './TaggedUsersModal';
import { getVenueLogo } from '@/lib/venue-logos';
import { RepostIcon, CalendarIcon } from './icons';

export interface ProfilePost {
  id: string;
  user_id: string;
  image_url: string | null;
  caption: string;
  created_at: string;
  likes_count: number;
  reposts_count: number;
  reposted: boolean;
  liked?: boolean;
  venue?: { name: string; tagged: boolean };
  event?: { title: string };
  tags?: string[];
  tagged_users?: string[];
  raw_row?: any;
}

interface PostViewerModalProps {
  posts: ProfilePost[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  profileName?: string;
  profileAvatar?: string | null;
  profileInitial?: string;
  profileBadge?: 'none' | 'owner' | 'admin' | 'gold' | 'verified';
  venueLogosMap?: Record<string, string>;
  storyRing?: 'none' | 'story-unseen' | 'story-seen';
  storyRingByUserId?: Record<string, 'none' | 'story-unseen' | 'story-seen'>;
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
  profileBadge = 'none',
  venueLogosMap = {},
  storyRing = 'none',
  storyRingByUserId,
}: PostViewerModalProps) {
  const { user, profile } = useAuth();
  const [index, setIndex] = useState(initialIndex);

  // Per-post live state
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [comments, setComments] = useState<{ user: string; text: string; badge: 'none' | 'owner' | 'admin' | 'gold' | 'verified' }[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaggedUsers, setShowTaggedUsers] = useState(false);
  const [reposting, setReposting] = useState(false);
  const { ref, maskStyle } = useScrollFade('y');

  const post = posts[index];

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
        .select('text, profiles(username, badge)')
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
      const formattedComments = rawComments.map(c => {
        const prof = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
        return {
          user: prof?.username || 'user',
          text: c.text,
          badge: (prof?.badge as any) || 'none'
        };
      });
      setComments(formattedComments);
    } else {
      setComments([]);
    }
    
    setCommentInput('');
    setShowComments(false);
  }, [user]); // Added post to dependencies

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
        event: '*', 
        schema: 'public', 
        table: 'reposts', 
        filter: `post_id=eq.${postId}` 
      }, async (payload) => {
        const { count } = await supabase.from('reposts').select('id', { count: 'exact', head: true }).eq('post_id', postId);
        setRepostCount(count ?? 0);
        if (user) {
          const { data: userRepost } = await supabase.from('reposts').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
          setReposted(!!userRepost);
        }
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'post_comments', 
        filter: `post_id=eq.${postId}` 
      }, async (payload) => {
        const row = payload.new as { text: string; user_id: string };
        const { data: prof } = await supabase.from('profiles').select('username, badge').eq('id', row.user_id).single();
        setComments(prev => [...prev, { 
          user: prof?.username || 'user', 
          text: row.text,
          badge: (prof?.badge as any) || 'none'
        }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen, index, post?.id, user]);

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

  const handleRepost = async () => {
    if (!user || reposting) return;
    setReposting(true);
    try {
      const { error } = await supabase.rpc('repost_post', { p_post_id: post.id });
      if (error) throw error;
      setReposted(!reposted);
      setRepostCount(prev => reposted ? prev - 1 : prev + 1);
    } catch (err) {
       console.error("Failed to repost", err);
    } finally {
      setReposting(false);
    }
  };

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
        setComments(prev => [...prev, { 
          user: profile?.username || 'you', 
          text,
          badge: (profile?.badge as any) || 'none'
        }]);
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
    const url = `${window.location.origin}/?tab=feed&post=${post.id}`;
    if (navigator.share) {
      navigator.share({ url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-viewer flex items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-noctvm-black/90 backdrop-blur-xl transition-opacity animate-fade-in" onClick={onClose} />

      {/* Close button top right */}
      <button 
        onClick={onClose}
        title="Close modal"
        aria-label="Close modal"
        className="absolute top-10 right-4 lg:top-6 lg:right-6 z-viewer-controls p-3 rounded-full bg-noctvm-black/60 backdrop-blur-md border border-white/10 text-foreground hover:bg-noctvm-black/80 transition-all active:scale-90"
      >
        <svg className="w-6 h-6 lg:w-8 lg:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Mobile Back button top left (for extra safety) */}
      <button 
        onClick={onClose}
        title="Go back"
        aria-label="Go back"
        className="absolute top-10 left-4 lg:hidden z-viewer-controls p-3 rounded-full bg-noctvm-black/60 backdrop-blur-md border border-white/10 text-foreground hover:bg-noctvm-black/80 transition-all active:scale-90 shadow-xl"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Nav Arrows */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 pointer-events-none z-overlay">
        <button
          onClick={() => setIndex(i => i - 1)}
          disabled={!hasPrev}
          title="Previous post"
          className={`w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-foreground transition-all pointer-events-auto ${!hasPrev ? 'opacity-0 scale-90' : 'opacity-100'}`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button
          onClick={() => setIndex(i => i + 1)}
          disabled={!hasNext}
          title="Next post"
          className={`w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-foreground transition-all pointer-events-auto ${!hasNext ? 'opacity-0 scale-90' : 'opacity-100'}`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-[1200px] lg:max-w-5xl h-full lg:h-[calc(100vh-80px)] lg:max-h-[850px] bg-noctvm-midnight border border-white/10 lg:rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] z-modal flex flex-col lg:flex-row transition-transform animate-scale-in mx-auto">
        
        {/* Left: Image Side */}
        <div className="flex-1 bg-noctvm-black flex items-center justify-center relative min-h-[40vh] md:min-h-0">
          {post.image_url ? (
            <div className="w-full h-full relative">
              <Image 
                src={post.image_url} 
                alt="Post media" 
                fill 
                className="object-contain lg:object-contain"
                unoptimized
                priority
              />
            </div>
          ) : (
             <div className="w-full h-full bg-gradient-to-br from-noctvm-violet/20 to-purple-900/40 p-12 flex items-center justify-center">
                <p className="text-noctvm-silver text-center italic text-lg leading-relaxed">{post.caption}</p>
             </div>
          )}

          {/* Image Pills (Matching FeedItem) */}
          <div className="absolute inset-0 pointer-events-none z-10 p-4">
             {post.venue?.tagged && post.venue?.name && (
               <button
                 onClick={(e) => { e.stopPropagation(); /* onVenueClick handling? maybe link to it later */ }}
                 className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-noctvm-black/60 backdrop-blur-sm border border-white/10 hover:border-noctvm-violet/50 pointer-events-auto"
                 title={`View ${post.venue.name}`}
               >
                 <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 bg-noctvm-midnight flex items-center justify-center relative">
                   <Image src={getVenueLogo(post.venue.name, venueLogosMap?.[post.venue.name])} alt="" fill className="object-cover" />
                 </div>
                 <span className="text-noctvm-caption font-bold text-foreground pr-1">{post.venue.name}</span>
               </button>
             )}

             {post.event && (
               <div className="absolute bottom-16 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-noctvm-violet/80 backdrop-blur-md border border-noctvm-violet/30 shadow-lg animate-fade-in pointer-events-auto">
                 <CalendarIcon className="w-3 h-3 text-foreground" />
                 <span className="text-noctvm-micro font-black text-foreground uppercase tracking-wider truncate max-w-[120px]">
                   {post.event.title}
                 </span>
               </div>
             )}

             {post.tagged_users && post.tagged_users.length > 0 && (
               <button
                 onClick={(e) => { e.stopPropagation(); setShowTaggedUsers(true); }}
                 className="absolute bottom-4 left-4 flex items-center gap-2 px-2 py-1.5 rounded-full bg-noctvm-black/60 backdrop-blur-sm border border-white/10 hover:border-noctvm-violet/50 transition-all pointer-events-auto"
                 title={`${post.tagged_users.length} people tagged`}
               >
                 <div className="flex px-1">
                   {post.tagged_users.slice(0, 5).map((handle, i) => {
                     const is5th = i === 4;
                     return (
                       <div key={handle} className={`w-6 h-6 rounded-full border border-black flex items-center justify-center bg-noctvm-surface/80 shadow-sm ${is5th && (post.tagged_users?.length || 0) > 5 ? 'opacity-50' : ''}`} style={{ marginLeft: i === 0 ? 0 : '-10px', zIndex: 10 - i }}>
                         <span className="text-noctvm-micro font-bold text-foreground uppercase">{handle.replace('@', '')[0]}</span>
                       </div>
                     );
                   })}
                 </div>
                 <span className="text-noctvm-caption font-bold text-foreground pr-1 tracking-wider">
                   {(post.tagged_users?.length || 0) > 9 ? '9+' : post.tagged_users?.length}
                 </span>
               </button>
             )}
          </div>
        </div>

        {/* Right: Info + Comments Side */}
        <div className="w-full lg:w-[400px] xl:w-[450px] border-l border-white/5 flex flex-col bg-noctvm-surface flex-shrink-0">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3 relative shrink-0 min-h-[60px] z-20">
             <Avatar
               src={profileAvatar}
               alt={profileName || 'Profile'}
               fallback={profileInitial || 'U'}
               size="md"
               ring={storyRing}
               className="w-9 h-9"
             />
              <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-1.5">
                    <button className="text-sm font-semibold text-foreground leading-tight truncate hover:text-noctvm-violet transition-colors">
                      {profileName || 'User'}
                    </button>
                    {profileBadge !== 'none' && <VerifiedBadge type={profileBadge} size="sm" />}
                 </div>
                 <p className="text-noctvm-caption text-noctvm-silver/50 uppercase tracking-wider font-mono mt-0.5">{timeAgo(post.created_at)} ago</p>
              </div>
             <PostOptionsMenu
                postId={post.id}
                postUserId={post.user_id}
                currentUserId={user?.id || null}
                authorHandle={profileName || 'user'}
                onCopyLink={handleShare}
                onDelete={handleDelete}
                onEdit={() => setShowEditModal(true)}
             />
          </div>

          {/* Actions Bar removed from here, moved to Bottom Area */}

          {/* Comments Section (Scrollable) */}
          <div ref={ref} style={maskStyle} className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar flex flex-col gap-2">
             {post.caption && (
               <div className="mb-2 mt-1">
                  <p className="text-xs text-foreground/90 leading-relaxed break-words">
                     {post.caption}
                  </p>
                  {/* Hashtag Buttons */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {post.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-2.5 py-1 rounded bg-noctvm-violet/10 text-noctvm-micro font-black text-noctvm-violet/60 hover:text-noctvm-violet hover:bg-noctvm-violet/20 cursor-pointer transition-all uppercase tracking-widest border border-noctvm-violet/5 active:scale-[0.96]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
               </div>
             )}
               <div className="pt-2">
                 <CommentSection 
                   postId={post.id} 
                   postOwnerId={post.user_id} 
                   currentUserId={user?.id || null}
                   isCollapsed={false}
                   hideRootInput={true}
                     storyRingByUserId={storyRingByUserId}
                 />
               </div>
          </div>

          {/* Bottom Actions Bar + Input */}
          <div className="border-t border-white/5 bg-noctvm-surface shrink-0 pt-3 pb-4 px-4">
              {/* Action Icons Mimicked from FeedItem */}
              <div className="flex items-center gap-4 mb-1">
                 <button 
                   onClick={handleLike} 
                   className={`flex items-center gap-1.5 group transition-all ${liked ? 'text-red-500' : 'text-noctvm-silver/60 hover:text-red-500'}`}
                   title={liked ? "Unlike" : "Like"}
                 >
                   {liked 
                     ? <HeartIcon className="w-5 h-5 fill-current scale-110" />
                     : <HeartIcon className="w-5 h-5 group-hover:scale-110" />
                   }
                   <span className="text-xs font-mono leading-none">{likeCount}</span>
                 </button>
                
                {/* Repost Icon */}
                <button 
                  onClick={handleRepost}
                  disabled={reposting}
                  className={`flex items-center gap-1.5 group transition-all ${reposted ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-noctvm-silver/60 hover:text-blue-500'}`}
                  title="Remix / Repost"
                >
                  <RepostIcon className={`w-5 h-5 ${reposted ? 'scale-110' : 'group-hover:scale-110'} ${reposting ? 'animate-pulse' : ''}`} />
                  {repostCount > 0 && <span className="text-xs font-mono leading-none">{repostCount}</span>}
                </button>

                {/* Share Icon */}
                <button 
                  onClick={handleShare} 
                  className="flex items-center gap-1.5 text-noctvm-silver/60 hover:text-noctvm-emerald transition-all group"
                  title="Share"
                >
                  <ShareIcon className="w-5 h-5 group-hover:scale-110" />
                </button>
              </div>

              <div className="mb-2">
                <button 
                  onClick={() => setShowLikesModal(true)}
                  title="View likes"
                  className="text-xs font-black text-foreground hover:text-noctvm-violet transition-colors"
                >
                  {likeCount.toLocaleString()} likes
                </button>
              </div>

             {/* Inline Comment Input Box */}
             <div className="relative flex items-center gap-3">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-transparent border-none p-0 text-sm text-foreground focus:outline-none focus:ring-0 placeholder-noctvm-silver/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                />
                {commentInput.trim() && (
                  <button
                    onClick={handleSubmitComment}
                    disabled={submittingComment}
                    className="text-sm font-black text-noctvm-violet hover:text-purple-400 uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Post
                  </button>
                )}
             </div>
          </div>

        </div>
      </div>
      <LikesSheet
        postId={post.id}
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
      />

      <TaggedUsersModal
        handles={post.tagged_users || []}
        isOpen={showTaggedUsers}
        onClose={() => setShowTaggedUsers(false)}
      />

      {/* Edit Post Modal overlay */}
      {showEditModal && (
        <EditPostModal
          post={{
             ...post,
             userId: post.user_id,
             user: { 
               display_name: profileName || '', 
               username: profileName || '', 
               avatar_url: profileAvatar || null, 
               is_verified: profileBadge === 'verified' || profileBadge === 'gold', 
               badge: profileBadge as any 
             },
             venue: post.venue || { name: '', tagged: false },
             tags: [],
             likes: post.likes_count,
             reposts: 0,
             comments: [],
             timeAgo: '',
             liked: false,
             reposted: false,
             saved: false,
             imageUrl: post.image_url,
             imageTheme: { gradient: '', scene: '' },
             taggedUsers: post.tagged_users || []
          } as any}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>,
    document.body
  );
}
