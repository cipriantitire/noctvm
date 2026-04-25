'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import MessageTree, { type MessageTreeNode } from '@/components/ui/MessageTree';

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
  hideRootInput?: boolean;
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

/** Recursively convert the Supabase Comment tree into MessageTreeNode shape */
function convertToMessageTreeNodes(
  comments: Comment[],
  currentUserId: string | null,
  storyRingByUserId?: Record<string, 'none' | 'story-unseen' | 'story-seen'>
): MessageTreeNode[] {
  return comments.map((c) => ({
    id: c.id,
    authorId: c.user_id,
    authorName: c.user.display_name || c.user.username,
    authorHandle: `@${c.user.username}`,
    authorAvatar: c.user.avatar_url || undefined,
    authorFallback: (c.user.display_name || c.user.username || 'U')[0].toUpperCase(),
    avatarRing: storyRingByUserId?.[c.user_id] ?? 'none',
    content: c.text,
    timestampStr: timeAgo(c.created_at),
    // Only show edit/delete controls on comments the current user owns
    isOwner: c.user_id === currentUserId,
    replies: c.replies ? convertToMessageTreeNodes(c.replies, currentUserId, storyRingByUserId) : [],
  }));
}

export default function CommentSection({
  postId,
  postOwnerId,
  currentUserId,
  initialComments = [],
  isCollapsed = false,
  hideRootInput = false,
  storyRingByUserId,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsExpanded(!isCollapsed);
  }, [isCollapsed]);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('post_comments')
      .select('*, user:profiles(display_name, username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const commentMap: Record<string, Comment> = {};
      const tree: Comment[] = [];

      data.forEach((c) => {
        commentMap[c.id] = { ...c, replies: [] };
      });

      data.forEach((c) => {
        if (c.parent_id && commentMap[c.parent_id]) {
          commentMap[c.parent_id].replies?.push(commentMap[c.id]);
        } else {
          tree.push(commentMap[c.id]);
        }
      });

      setComments(tree.reverse());
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  /** Called by MessageTree's onReply — parentId is the comment being replied to */
  const handleReply = async (parentId: string, text: string) => {
    if (!text.trim() || !currentUserId) return;
    try {
      await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: currentUserId,
        text: text.trim(),
        parent_id: parentId === 'root' ? null : parentId,
      });
      fetchComments();
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  /** Root-level post (only shown when hideRootInput is false) */
  const handleRootPost = async () => {
    if (!newComment.trim() || !currentUserId) return;
    try {
      await supabase.from('post_comments').insert({
        post_id: postId,
        user_id: currentUserId,
        text: newComment.trim(),
        parent_id: null,
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  /** Called by MessageTree's onDelete */
  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await supabase.from('post_comments').delete().eq('id', commentId);
      fetchComments();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  /** Called by MessageTree's onEdit */
  const handleEdit = async (commentId: string, newText: string) => {
    if (!newText.trim()) return;
    try {
      await supabase
        .from('post_comments')
        .update({ text: newText.trim() })
        .eq('id', commentId);
      fetchComments();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const treeData = convertToMessageTreeNodes(comments, currentUserId, storyRingByUserId);

  return (
    <div className={`mt-4 space-y-4 border-t border-white/5 pt-4 ${hideRootInput ? 'pb-4' : ''}`}>

      {/* Root input (top) — only in FeedItem inline mode */}
      {!hideRootInput && currentUserId && isExpanded && (
        <div className="relative group mb-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-noctvm-midnight/80 border border-white/10 rounded-2xl px-5 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-noctvm-violet/20 focus:border-noctvm-violet/40 transition-all pr-24"
            onKeyDown={(e) => e.key === 'Enter' && handleRootPost()}
          />
          <button
            onClick={handleRootPost}
            disabled={!newComment.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-noctvm-violet text-foreground px-4 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-noctvm-violet/20 hover:scale-105 active:scale-[0.96] disabled:opacity-30 disabled:scale-100 transition-all"
          >
            Post
          </button>
        </div>
      )}

      {/* Comment tree */}
      <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[800px] overflow-y-auto custom-scrollbar' : ''}`}>
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-noctvm-violet border-t-transparent rounded-full animate-spin" />
            <span className="text-noctvm-micro uppercase tracking-widest text-noctvm-silver/50 font-black">Syncing thread...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/5">
            <p className="text-noctvm-label text-noctvm-silver/40 font-bold uppercase tracking-widest">No comments yet</p>
          </div>
        ) : (
          <MessageTree
            data={isExpanded ? treeData : treeData.slice(0, 2)}
            onReply={currentUserId ? handleReply : undefined}
            onEdit={currentUserId ? handleEdit : undefined}
            onDelete={currentUserId ? handleDelete : undefined}
            hideRootInput={true}
          />
        )}
      </div>

      {/* "View all" expand button */}
      {!isExpanded && comments.length > 2 && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full py-2.5 flex items-center justify-center gap-2 text-noctvm-caption font-black uppercase tracking-wider text-noctvm-silver/40 hover:text-foreground transition-all bg-white/[0.02] hover:bg-white/[0.05] rounded-xl border border-white/5 group"
        >
          <span>View all {comments.length} comments</span>
          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Collapsed-state compact input */}
      {!hideRootInput && currentUserId && !isExpanded && (
        <div className="relative group">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-transparent border-b border-white/5 px-0 py-2.5 text-xs text-foreground focus:outline-none focus:border-noctvm-violet/40 transition-all pr-12"
            onKeyDown={(e) => e.key === 'Enter' && handleRootPost()}
          />
          <button
            onClick={handleRootPost}
            disabled={!newComment.trim()}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-noctvm-caption font-bold text-noctvm-violet hover:text-foreground disabled:opacity-0 transition-all"
          >
            Post
          </button>
        </div>
      )}
    </div>
  );
}
