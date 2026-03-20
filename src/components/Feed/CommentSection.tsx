'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { UserIcon, ChatIcon, TrashIcon, EditIcon, BellIcon, ShieldIcon } from '../icons';
import VerifiedBadge from '../VerifiedBadge';

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  text: string;
  created_at: string;
  user: {
    display_name: string;
    username: string;
    avatar_url: string | null;
    badge?: string;
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  postOwnerId: string;
  currentUserId: string | null;
  initialComments?: any[];
  isCollapsed?: boolean;
}

export default function CommentSection({ 
  postId, 
  postOwnerId, 
  currentUserId, 
  initialComments = [],
  isCollapsed = false
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [truncatedIds, setTruncatedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('post_comments')
      .select('*, user:profiles(display_name, username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Build tree
      const commentMap: Record<string, Comment> = {};
      const tree: Comment[] = [];

      data.forEach(c => {
        commentMap[c.id] = { ...c, replies: [] };
      });

      data.forEach(c => {
        if (c.parent_id && commentMap[c.parent_id]) {
          commentMap[c.parent_id].replies?.push(commentMap[c.id]);
        } else {
          tree.push(commentMap[c.id]);
        }
      });

      setComments(tree.reverse()); // Show newest top-level first
    }
    setLoading(false);
  };

  const handlePost = async (parentId: string | null = null) => {
    const text = parentId ? replyText : newComment;
    if (!text.trim() || !currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({ 
          post_id: postId, 
          user_id: currentUserId, 
          text: text.trim(),
          parent_id: parentId 
        })
        .select('*, user:profiles(display_name, username, avatar_url)')
        .single();

      if (error) throw error;
      
      if (parentId) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
      
      fetchComments(); // Refresh tree
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
      if (error) throw error;
      fetchComments();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      const { error } = await supabase
        .from('post_comments')
        .update({ text: editContent.trim() })
        .eq('id', commentId);
      if (error) throw error;
      setEditingId(null);
      fetchComments();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment, depth?: number }) => {
    const isOwnComment = currentUserId === comment.user_id;
    const isPostOwner = currentUserId === postOwnerId;
    const canDelete = isOwnComment || isPostOwner;
    const displayTime = timeAgo(comment.created_at);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
      <div className={`group animate-fade-in relative transition-all duration-300 ${depth > 0 ? 'ml-6 sm:ml-8' : 'mt-6'}`}>
        {/* Reddit-style Vertical Thread Lines */}
        {depth > 0 && Array.from({ length: depth }).map((_, i) => (
          <div 
            key={i}
            className="absolute top-0 bottom-0 w-[1.5px] bg-white/5 group-hover:bg-noctvm-violet/20 transition-colors"
            style={{ left: `-${(i + 1) * 24}px` }} 
          />
        ))}
        
        {/* Current Node Point */}
        {depth > 0 && (
          <div className="absolute -left-6 sm:-left-8 top-4 w-4 h-[1.5px] bg-white/5 group-hover:bg-noctvm-violet/20 transition-colors rounded-full" />
        )}

        <div className="flex gap-3 relative z-10">
          <Link href={`/@${comment.user.username}`} className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/10 hover:ring-noctvm-violet/40 transition-all hover:scale-105 active:scale-95 shadow-lg">
            {comment.user.avatar_url ? (
              <Image src={comment.user.avatar_url} alt="" width={32} height={32} className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full bg-noctvm-violet/20 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-tighter">
                {comment.user.display_name[0]}
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            {/* Instagram Premium Format: Name + Text on same line */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col">
                  {editingId === comment.id ? (
                    <div className="space-y-2 mt-1">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-noctvm-midnight/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-noctvm-violet/40 transition-all resize-none shadow-inner"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex justify-end gap-3 px-2 pb-1">
                        <button onClick={() => setEditingId(null)} className="text-[10px] text-noctvm-silver hover:text-white uppercase font-black tracking-widest transition-colors">Cancel</button>
                        <button onClick={() => handleUpdate(comment.id)} className="text-[10px] text-noctvm-violet hover:text-white uppercase font-black tracking-widest transition-colors">Save Changes</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[13px] leading-relaxed break-words group/text relative">
                      {/* Name + Badge */}
                      <span className="inline-flex items-center gap-1.5 mr-2">
                        <Link href={`/@${comment.user.username}`} className="font-black text-white hover:text-noctvm-violet transition-colors tracking-tight">
                          {comment.user.display_name}
                        </Link>
                        {comment.user_id === postOwnerId && (
                          <span className="text-[7px] bg-noctvm-violet/20 border border-noctvm-violet/30 text-noctvm-violet px-1.5 py-0.5 rounded-full uppercase font-black tracking-widest shadow-[0_0_10px_rgba(139,92,246,0.2)]">Author</span>
                        )}
                        {comment.user.badge && comment.user.badge !== 'none' && (
                          <VerifiedBadge type={comment.user.badge as 'owner' | 'admin' | 'verified' | 'gold'} size="xs" />
                        )}
                      </span>
                      
                      {/* Comment Body */}
                      <span className="text-white/80 font-medium selection:bg-noctvm-violet/30 tracking-tight">
                        {isCollapsed ? (
                          <button onClick={() => setIsCollapsed(false)} className="italic text-noctvm-silver/40 hover:text-noctvm-violet transition-colors">[ Comment collapsed ]</button>
                        ) : comment.text}
                      </span>
                    </div>
                  )}

                  {!isCollapsed && !editingId && (
                    <div className="flex items-center gap-4 mt-2 mb-1">
                      <span className="text-[10px] text-noctvm-silver/30 font-bold uppercase tracking-tighter">{displayTime}</span>
                      
                      <button 
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className={`text-[10px] font-black uppercase tracking-widest transition-all ${replyingTo === comment.id ? 'text-noctvm-violet scale-105' : 'text-noctvm-silver/50 hover:text-white'}`}
                      >
                        Reply
                      </button>

                      <button 
                        onClick={() => setIsCollapsed(true)}
                        className="text-[10px] font-black uppercase tracking-widest text-noctvm-silver/20 hover:text-noctvm-violet transition-colors group-hover:opacity-100 opacity-0"
                      >
                        Collapse
                      </button>
                      
                      {/* Moderation Controls hidden by default, shown on hover */}
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all ml-2 scale-95 group-hover:scale-100">
                        {isOwnComment && (
                          <button onClick={() => { setEditingId(comment.id); setEditContent(comment.text); }} className="text-[9px] font-black text-noctvm-silver/30 hover:text-noctvm-violet transition-colors uppercase tracking-widest">Edit</button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(comment.id)} className="text-[9px] font-black text-red-500/30 hover:text-red-400 transition-colors uppercase tracking-widest">Delete</button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reply Input */}
            {replyingTo === comment.id && !isCollapsed && (
              <div className="mt-4 mb-4 relative animate-slide-up">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-noctvm-violet/20 rounded-full" />
                <div className="pl-4">
                  <input
                    type="text"
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to @${comment.user.username}...`}
                    className="w-full bg-noctvm-midnight/40 border border-white/5 rounded-2xl px-5 py-2.5 text-xs text-white focus:outline-none focus:border-noctvm-violet/40 pr-20 transition-all shadow-inner"
                    onKeyDown={(e) => e.key === 'Enter' && handlePost(comment.id)}
                  />
                  <button
                    onClick={() => handlePost(comment.id)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-noctvm-violet hover:text-white hover:scale-110 active:scale-95 transition-all"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Recursive Replies */}
            {!isCollapsed && comment.replies && comment.replies.length > 0 && (
              <div className="mt-2 space-y-1">
                {comment.replies.map(reply => (
                  <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Helper function for time ago in comments
  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  return (
    <div className="mt-4 space-y-4 border-t border-white/5 pt-4">
      {/* Root Input - Top only when expanded */}
      {currentUserId && isExpanded && (
        <div className="relative group mb-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-noctvm-midnight/80 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-noctvm-violet/20 focus:border-noctvm-violet/40 transition-all pr-24"
            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
          />
          <button
            onClick={() => handlePost()}
            disabled={!newComment.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-noctvm-violet text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-noctvm-violet/20 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all"
          >
            Post
          </button>
        </div>
      )}

      {/* Main List */}
      <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[800px] overflow-y-auto custom-scrollbar' : ''}`}>
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-noctvm-violet border-t-transparent rounded-full animate-spin" />
            <span className="text-[9px] uppercase tracking-widest text-noctvm-silver/50 font-black">Syncing thread...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/5">
            <p className="text-[11px] text-noctvm-silver/40 font-bold uppercase tracking-widest">No comments yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {(isExpanded ? comments.slice(0, 10) : comments.slice(0, 2)).map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>

      {!isExpanded && comments.length > 2 && (
        <button 
          onClick={() => setIsExpanded(true)}
          className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider text-noctvm-silver/40 hover:text-white transition-all bg-white/[0.02] hover:bg-white/[0.05] rounded-xl border border-white/5 group"
        >
          <span>View all {comments.length} comments</span>
          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
        </button>
      )}

      {/* Input at bottom if collapsed */}
      {currentUserId && !isExpanded && (
        <div className="relative group">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-transparent border-b border-white/5 px-0 py-2.5 text-xs text-white focus:outline-none focus:border-noctvm-violet/40 transition-all pr-12"
            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
          />
          <button
            onClick={() => handlePost()}
            disabled={!newComment.trim()}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-noctvm-violet hover:text-white disabled:opacity-0 transition-all"
          >
            Post
          </button>
        </div>
      )}
    </div>
  );
}
