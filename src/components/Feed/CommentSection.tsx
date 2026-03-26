'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  hideRootInput?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// Shared props type for CommentItem
interface CommentItemProps {
  comment: Comment;
  depth?: number;
  currentUserId: string | null;
  postOwnerId: string;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editContent: string;
  setEditContent: (c: string) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyText: string;
  setReplyText: (t: string) => void;
  handleUpdate: (id: string) => void;
  handleDelete: (id: string) => void;
  handlePost: (id: string | null) => void;
  // Per-comment collapsed state lifted up to CommentSection
  collapsedIds: Set<string>;
  toggleCollapsed: (id: string) => void;
}

const MAX_DEPTH = 8;

const CommentItem = ({
  comment,
  depth = 0,
  currentUserId,
  postOwnerId,
  editingId,
  setEditingId,
  editContent,
  setEditContent,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  handleUpdate,
  handleDelete,
  handlePost,
  collapsedIds,
  toggleCollapsed,
}: CommentItemProps) => {
  const isOwnComment = currentUserId === comment.user_id;
  const isPostOwner = currentUserId === postOwnerId;
  const canDelete = isOwnComment || isPostOwner;
  const displayTime = timeAgo(comment.created_at);
  const [showOptions, setShowOptions] = useState(false);

  const hasReplies = !!(comment.replies && comment.replies.length > 0);
  const isCollapsed = collapsedIds.has(comment.id);
  const replyCount = comment.replies?.length ?? 0;

  // Common props passed down to children
  const childProps = {
    currentUserId,
    postOwnerId,
    editingId,
    setEditingId,
    editContent,
    setEditContent,
    replyingTo,
    setReplyingTo,
    replyText,
    setReplyText,
    handleUpdate,
    handleDelete,
    handlePost,
    collapsedIds,
    toggleCollapsed,
  };

  return (
    /*
      CSS Grid layout: [16px thread-line column | 1fr content column]
      - depth 0: no line shown (root comments have no parent thread)
      - depth 1+: 2px visible line centered in 16px clickable column
      The grid wraps the entire comment including its nested replies,
      so the vertical line naturally spans from avatar down through all children.
    */
    <div className="grid grid-cols-[16px_minmax(0,1fr)] w-full animate-fade-in group/node">

      {/*
        ── LEFT COLUMN: Thread line ──
        Only rendered at depth > 0 (depth 0 = root, no parent line to draw).
        The full 16px column is the click target; the 2px div inside is purely visual.
        bg-noctvm-black on the avatar wrapper below "cuts" the line behind the avatar,
        creating the Reddit illusion that lines connect children but stop at avatars.
      */}
      {depth > 0 ? (
        <button
          className="w-[16px] flex justify-center cursor-pointer group/line pt-0 self-stretch focus:outline-none"
          onClick={() => toggleCollapsed(comment.id)}
          title={isCollapsed ? 'Expand thread' : 'Collapse thread'}
          aria-label={isCollapsed ? 'Expand thread' : 'Collapse thread'}
        >
          <div className="w-[2px] h-full bg-white/10 group-hover/line:bg-white/25 transition-colors" />
        </button>
      ) : (
        // Depth 0: empty spacer so the grid still has a left cell
        <div className="w-[16px]" />
      )}

      {/* ── RIGHT COLUMN: Avatar + content + replies ── */}
      <div className="min-w-0">

        {/* HEADER ROW: avatar + username + timestamp */}
        <div className="flex items-start gap-2 relative group/mainrow">

          {/*
            Avatar wrapper: bg-noctvm-black is intentional — it paints over
            the thread line of any ancestor, creating the "line interrupted by
            avatar" Reddit effect.
          */}
          <div className="flex-shrink-0 relative z-10 bg-noctvm-black rounded-full">
            <Link
              href={`/@${comment.user.username}`}
              className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 hover:ring-noctvm-violet/40 transition-all hover:scale-105 active:scale-95 shadow-lg block"
            >
              {comment.user.avatar_url ? (
                <Image
                  src={comment.user.avatar_url}
                  alt=""
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-noctvm-violet/20 flex items-center justify-center text-noctvm-caption font-black text-white uppercase tracking-tighter">
                  {comment.user.display_name[0]}
                </div>
              )}
            </Link>
          </div>

          {/* Content area: name, badge, body, actions */}
          <div className="flex-1 min-w-0 pb-1">
            {editingId === comment.id ? (
              <div className="space-y-2 mt-1 pr-4">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-noctvm-surface/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-noctvm-violet/40 transition-all shadow-inner"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdate(comment.id)}
                />
                <div className="flex justify-end gap-3 px-2 pb-1">
                  <button
                    onClick={() => { setEditingId(null); setEditContent(''); }}
                    className="text-noctvm-caption text-noctvm-silver hover:text-white uppercase font-black tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdate(comment.id)}
                    className="text-noctvm-caption text-noctvm-violet hover:text-white uppercase font-black tracking-widest transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs leading-relaxed break-words relative pr-8">
                {/* Name + Badge */}
                <span className="inline-flex items-center gap-1.5 mr-2">
                  <Link
                    href={`/@${comment.user.username}`}
                    className="font-bold text-white hover:text-noctvm-violet transition-colors tracking-tight text-xs"
                  >
                    {comment.user.username}
                  </Link>
                  {comment.user.badge && comment.user.badge !== 'none' && (
                    <VerifiedBadge
                      type={comment.user.badge as 'owner' | 'admin' | 'verified' | 'gold'}
                      size="xs"
                    />
                  )}
                </span>

                {/* Comment body */}
                <span className="text-white/80 font-normal selection:bg-noctvm-violet/30">
                  {comment.text}
                </span>

                {/* Popover Edit/Delete on hover */}
                {!editingId && canDelete && (
                  <div
                    className={`absolute right-0 top-0 group/menu transition-all z-20 ${
                      showOptions ? 'opacity-100' : 'opacity-0 group-hover/mainrow:opacity-100'
                    }`}
                  >
                    <button
                      onClick={() => setShowOptions(!showOptions)}
                      className={`p-1 transition-colors ${
                        showOptions ? 'text-white' : 'text-noctvm-silver/40 hover:text-white'
                      }`}
                      title="Options"
                    >
                      <svg className="w-5 h-5 font-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h.01M12 12h.01M19 12h.01" />
                      </svg>
                    </button>

                    {showOptions && (
                      <div className="absolute right-0 top-full mt-1 flex flex-col bg-noctvm-midnight border border-noctvm-border rounded-xl shadow-2xl overflow-hidden min-w-[140px] z-modal animate-scale-in pointer-events-auto">
                        {isOwnComment && (
                          <button
                            onClick={() => { setEditingId(comment.id); setEditContent(comment.text); setShowOptions(false); }}
                            className="px-4 py-3 text-xs text-left text-white hover:bg-white/10 font-black uppercase tracking-wider transition-colors border-b border-white/5"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => { handleDelete(comment.id); setShowOptions(false); }}
                          className="px-4 py-3 text-xs text-left text-red-500 hover:bg-red-500/10 font-black uppercase tracking-wider transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    {showOptions && <div className="fixed inset-0 z-[-1]" onClick={() => setShowOptions(false)} />}
                  </div>
                )}
              </div>
            )}

            {/* Action row: timestamp + reply button */}
            {!editingId && (
              <div className="flex items-center gap-4 mt-1 mb-1">
                <span className="text-noctvm-label text-noctvm-silver/40 font-medium tracking-tight">
                  {displayTime}
                </span>
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className={`text-noctvm-label font-bold transition-all ${
                    replyingTo === comment.id
                      ? 'text-noctvm-violet scale-105'
                      : 'text-noctvm-silver/60 hover:text-white'
                  }`}
                >
                  Reply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reply input (shown inline below this comment's header) */}
        {replyingTo === comment.id && (
          <div className="mt-2 mb-3 relative animate-slide-up pl-10">
            <input
              type="text"
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${comment.user.username}...`}
              className="w-full bg-noctvm-surface/50 border border-white/5 rounded-2xl px-4 py-2 text-xs text-white focus:outline-none focus:border-noctvm-violet/40 pr-16 transition-all shadow-inner"
              onKeyDown={(e) => e.key === 'Enter' && handlePost(comment.id)}
            />
            <button
              onClick={() => handlePost(comment.id)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-noctvm-label font-bold text-noctvm-violet hover:text-white hover:scale-105 active:scale-95 transition-all"
            >
              Post
            </button>
          </div>
        )}

        {/*
          REPLIES SECTION
          Three cases:
          1. Collapsed → show stub with reply count
          2. Depth >= MAX_DEPTH → show "Continue thread →" link instead of inline nesting
          3. Normal → render children recursively
        */}
        {hasReplies && (
          <>
            {isCollapsed ? (
              /* Collapsed stub */
              <button
                onClick={() => toggleCollapsed(comment.id)}
                className="ml-10 mb-2 text-noctvm-caption text-noctvm-silver hover:text-white transition-colors font-black tracking-wide"
              >
                [+] {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </button>
            ) : depth >= MAX_DEPTH ? (
              /* Max depth reached — don't recurse inline */
              <button
                className="ml-10 mb-2 text-noctvm-caption text-noctvm-violet hover:text-white transition-colors font-black tracking-wide"
                onClick={() => {
                  /* In a full implementation this would open a dedicated thread view */
                }}
              >
                Continue thread →
              </button>
            ) : (
              /* Normal recursive render */
              <div className="mt-1">
                {comment.replies!.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    depth={depth + 1}
                    {...childProps}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default function CommentSection({ 
  postId, 
  postOwnerId, 
  currentUserId, 
  initialComments = [],
  isCollapsed = false,
  hideRootInput = false
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

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

      setComments(tree.reverse()); 
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

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
      
      fetchComments(); 
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

  return (
    <div className={`mt-4 space-y-4 border-t border-white/5 pt-4 ${hideRootInput ? 'pb-4' : ''}`}>
      {!hideRootInput && currentUserId && isExpanded && (
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
          <div className="space-y-1">
            {(isExpanded ? comments.slice(0, 10) : comments.slice(0, 2)).map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                postOwnerId={postOwnerId}
                editingId={editingId}
                setEditingId={setEditingId}
                editContent={editContent}
                setEditContent={setEditContent}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                handleUpdate={handleUpdate}
                handleDelete={handleDelete}
                handlePost={handlePost}
                collapsedIds={collapsedIds}
                toggleCollapsed={toggleCollapsed}
              />
            ))}
          </div>
        )}
      </div>

      {!isExpanded && comments.length > 2 && (
        <button 
          onClick={() => setIsExpanded(true)}
          className="w-full py-2.5 flex items-center justify-center gap-2 text-noctvm-caption font-black uppercase tracking-wider text-noctvm-silver/40 hover:text-white transition-all bg-white/[0.02] hover:bg-white/[0.05] rounded-xl border border-white/5 group"
        >
          <span>View all {comments.length} comments</span>
          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
        </button>
      )}

      {!hideRootInput && currentUserId && !isExpanded && (
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
            className="absolute right-0 top-1/2 -translate-y-1/2 text-noctvm-caption font-bold text-noctvm-violet hover:text-white disabled:opacity-0 transition-all"
          >
            Post
          </button>
        </div>
      )}
    </div>
  );
}
