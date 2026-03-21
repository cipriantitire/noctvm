'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { HeartIcon, ChatIcon, ShareIcon, RepostIcon, CalendarIcon } from '../icons';
import { getVenueLogo } from '@/lib/venue-logos';
import { formatFullDate } from '@/lib/feed-utils';
import type { FeedPost } from '@/types/feed';
import VerifiedBadge from '../VerifiedBadge';
import PostOptionsMenu from '../PostOptionsMenu';
import PostBody from './PostBody';
import CommentSheet from './CommentSheet';
import CommentSection from './CommentSection';
import PostViewerModal from '../PostViewerModal';
import EditPostModal from '../EditPostModal';
import TaggedUsersModal from '../TaggedUsersModal';

interface FeedItemProps {
  post: FeedPost;
  idx: number;
  user: any;
  activeDotsId: string | null;
  setActiveDotsId: (id: string | null) => void;
  onVenueClick: (name: string) => void;
  toggleLike: (post: FeedPost) => void;
  onShare: (id: string) => void;
  onRepost: (post: FeedPost) => void;
  onDelete: (id: string) => void;
  venueLogosMap: Record<string, string>;
  onFollow?: (userId: string) => void;
}

export function FeedItem({
  post,
  idx,
  user,
  activeDotsId,
  setActiveDotsId,
  onVenueClick,
  toggleLike,
  onShare,
  onRepost,
  onDelete,
  venueLogosMap,
  onFollow,
}: FeedItemProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [showTaggedUsers, setShowTaggedUsers] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentPreview, setCommentPreview] = useState<{count: number, firstComment: any | null}>({ count: 0, firstComment: null });
  const isFollowing = post.user.isFollowing || false;
  const isOwnPost = user?.id === post.userId;

  // Fetch comment preview for this feed item
  useEffect(() => {
    supabase.from('post_comments')
      .select('id, text, user_id, user:profiles(username, display_name)', { count: 'exact' })
      .eq('post_id', post.id)
      .order('created_at', { ascending: false }) // GET LATEST COMMENT
      .limit(1)
      .then(({ data, count }) => {
        if (count !== null) setCommentPreview({ count, firstComment: data?.[0] || null });
      });
  }, [post.id]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?post=${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCommentClick = () => {
    // On mobile (max-width < 1024px) → bottom sheet
    // On desktop → PostViewerModal overlay
    if (window.innerWidth < 1024) {
      setShowMobileSheet(true);
    } else {
      setShowComments(!showComments);
    }
  };

  const handleEditPost = async () => {
    setActiveDotsId(null);
    setShowEditModal(true);
  };

  const authorLink = `/@${post.user.handle.replace('@', '')}`;

  return (
    <>
      <article
        className="bg-noctvm-surface rounded-xl border border-noctvm-border overflow-hidden animate-fade-in-up"
        style={{ animationDelay: `${idx * 80}ms` }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-3">
          <Link
            href={authorLink}
            className="w-9 h-9 rounded-full border border-noctvm-border flex items-center justify-center flex-shrink-0 overflow-hidden relative bg-noctvm-midnight hover:opacity-80 transition-opacity"
            title={`View ${post.user.name}'s profile`}
          >
            {post.user.avatarUrl ? (
              <Image src={post.user.avatarUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <span className="text-xs font-bold text-white">{post.user.avatar}</span>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link
                href={authorLink}
                className="text-sm font-medium text-white hover:text-noctvm-violet transition-colors truncate"
                title={post.user.name}
              >
                {post.user.name}
              </Link>
              {post.user.badge !== 'none' && <VerifiedBadge type={post.user.badge} size="sm" />}

              {!isFollowing && !isOwnPost && user && (
                <button
                  onClick={() => onFollow?.(post.userId!)}
                  className="ml-2 px-2.5 py-0.5 rounded-full bg-noctvm-violet/20 border border-noctvm-violet/30 text-[9px] font-bold text-noctvm-violet hover:bg-noctvm-violet hover:text-white transition-all animate-fade-in"
                  title={`Follow ${post.user.handle}`}
                >
                  Follow
                </button>
              )}
            </div>
            <Link
              href={authorLink}
              className="text-[10px] text-noctvm-silver block hover:text-noctvm-violet transition-colors"
              title={post.user.handle}
            >
              {post.user.handle}
            </Link>
          </div>
          <span title={formatFullDate(post.createdAt)} className="text-[10px] text-noctvm-silver font-mono">
            {post.timeAgo}
          </span>

          <div className="relative">
            <button
              onClick={() => setActiveDotsId(activeDotsId === post.id ? null : post.id)}
              className="text-noctvm-silver hover:text-white p-1"
              title="Options"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {activeDotsId === post.id && (
              <PostOptionsMenu
                postId={post.id}
                postUserId={post.userId}
                currentUserId={user?.id || null}
                authorHandle={post.user.handle}
                isFollowing={isFollowing}
                onClose={() => setActiveDotsId(null)}
                onCopyLink={handleCopyLink}
                onEdit={handleEditPost}
                onDelete={() => onDelete(post.id)}
                onNotInterested={() => {}}
                onReport={() => {}}
              />
            )}
          </div>
        </div>

        {/* Image */}
        <div 
          className={`aspect-square bg-gradient-to-br ${post.imageTheme.gradient} flex items-center justify-center relative overflow-hidden ${window.innerWidth >= 1024 ? 'cursor-pointer' : ''}`}
          onClick={() => { if (window.innerWidth >= 1024) setViewerOpen(true); }}
        >
          {post.imageUrl ? (
            <Image src={post.imageUrl} alt="" fill className="object-cover" priority={idx < 2} unoptimized />
          ) : (
            <div className="text-white/20 italic p-4 text-center">Scene visualization unavailable</div>
          )}
          {post.venue.tagged && post.venue.name && (
            <button
              onClick={() => onVenueClick(post.venue.name)}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 hover:border-noctvm-violet/50"
              title={`View ${post.venue.name}`}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 bg-noctvm-midnight flex items-center justify-center relative">
                <Image src={getVenueLogo(post.venue.name, venueLogosMap[post.venue.name])} alt="" fill className="object-cover" />
              </div>
              <span className="text-[10px] font-bold text-white pr-1">{post.venue.name}</span>
            </button>
          )}

          {/* Tagged Users Pill */}
          {post.taggedUsers && post.taggedUsers.length > 0 && (
            <button
              onClick={() => setShowTaggedUsers(true)}
              className="absolute bottom-3 left-3 flex items-center gap-2 px-2 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 hover:border-noctvm-violet/50 transition-all"
              title={`${post.taggedUsers.length} people tagged`}
            >
              <div className="flex px-1">
                {post.taggedUsers.slice(0, 5).map((handle, i) => {
                  const is5th = i === 4;
                  return (
                    <div 
                      key={handle}
                      className={`w-6 h-6 rounded-full border border-black flex items-center justify-center bg-noctvm-surface/80 shadow-sm ${is5th && post.taggedUsers.length > 5 ? 'opacity-50' : ''}`}
                      style={{ marginLeft: i === 0 ? 0 : '-10px', zIndex: 10 - i }}
                    >
                      <span className="text-[9px] font-bold text-white uppercase">{handle.replace('@', '')[0]}</span>
                    </div>
                  );
                })}
              </div>
              <span className="text-[10px] font-bold text-white pr-1 tracking-wider">
                {post.taggedUsers.length > 9 ? '9+' : post.taggedUsers.length}
              </span>
            </button>
          )}

          {/* Event Badge Overlay */}
          {post.event && (
            <div className="absolute bottom-[44px] right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-noctvm-violet/80 backdrop-blur-md border border-noctvm-violet/30 shadow-lg shadow-noctvm-violet/20 animate-fade-in">
              <CalendarIcon className="w-3 h-3 text-white" />
              <span className="text-[9px] font-black text-white uppercase tracking-wider truncate max-w-[120px]">
                {post.event.title}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-3 py-3">
          {/* Action row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleLike(post)}
                title={post.liked ? 'Unlike' : 'Like'}
                className={`flex items-center gap-1.5 group ${post.liked ? 'text-noctvm-violet' : 'text-noctvm-silver hover:text-white'}`}
              >
                <HeartIcon className={`w-5 h-5 ${post.liked ? 'fill-current' : 'group-hover:scale-110'}`} />
                <span className="text-xs font-mono">{post.likes}</span>
              </button>
              <button
                onClick={handleCommentClick}
                title="Comments"
                className="flex items-center gap-1.5 text-noctvm-silver hover:text-white transition-all group"
              >
                <ChatIcon className="w-5 h-5 group-hover:scale-110" />
              </button>
              <button
                onClick={() => onRepost(post)}
                title="Remix"
                className={`flex items-center gap-1.5 group transition-all ${post.reposted ? 'text-noctvm-emerald' : 'text-noctvm-silver hover:text-white'}`}
              >
                <RepostIcon className={`w-5 h-5 ${post.reposted ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'group-hover:scale-110'}`} />
                {post.reposts > 0 && <span className="text-xs font-mono">{post.reposts}</span>}
              </button>
              <button
                onClick={() => onShare(post.id)}
                title="Share"
                className="flex items-center gap-1.5 text-noctvm-silver hover:text-white group"
              >
                <ShareIcon className="w-5 h-5 group-hover:scale-110" />
              </button>
            </div>
            {copied && <span className="text-[10px] text-noctvm-emerald font-bold animate-fade-in">Link Copied!</span>}
          </div>

          {/* Caption (Inline with Nickname) */}
          <div className="text-[13px] leading-relaxed text-noctvm-silver/90 mb-1 break-words">
            <Link href={authorLink} className="font-bold text-white mr-1.5 hover:text-noctvm-violet transition-colors">
              {post.user.handle.replace('@', '')}
            </Link>
            {post.caption ? <PostBody text={post.caption} /> : null}
          </div>

          {/* Comment Preview Area */}
          {commentPreview.count > 0 && (
            <div className="mt-1 space-y-1">
               {/* View all X comments / Close comments */}
               <button 
                 onClick={handleCommentClick}
                 className="text-[12px] font-bold text-noctvm-silver/40 hover:text-noctvm-silver transition-colors pt-0.5"
               >
                 {showComments 
                   ? 'Close comments' 
                   : `View ${commentPreview.count === 1 ? '1 comment' : `all ${commentPreview.count} comments`}`
                 }
               </button>
            </div>
          )}



          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.tags.map(tag => (
                <span key={tag} className="text-[9px] font-black text-noctvm-violet/40 hover:text-noctvm-violet cursor-pointer transition-colors uppercase tracking-widest">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Desktop inline comment section */}
          {showComments && (
            <div className="hidden lg:block mt-4 animate-fade-in">
              <CommentSection
                postId={post.id}
                postOwnerId={post.userId || ''}
                currentUserId={user?.id || null}
              />
            </div>
          )}
        </div>
      </article>

      <TaggedUsersModal
        handles={post.taggedUsers || []}
        isOpen={showTaggedUsers}
        onClose={() => setShowTaggedUsers(false)}
      />

      {/* Mobile bottom sheet — rendered in portal to break out of article stacking context */}
      {showMobileSheet && typeof window !== 'undefined' && createPortal(
        <CommentSheet
          postId={post.id}
          postOwnerId={post.userId || ''}
          currentUserId={user?.id || null}
          onClose={() => setShowMobileSheet(false)}
        />,
        document.body
      )}

      {viewerOpen && typeof window !== 'undefined' && createPortal(
        <PostViewerModal
          posts={[{
            id: post.id,
            user_id: post.userId || '',
            caption: post.caption || '',
            image_url: post.imageUrl || null,
            created_at: post.createdAt,
            likes_count: post.likes
          }]}
          initialIndex={0}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          profileAvatar={post.user.avatarUrl}
          profileName={post.user.name}
          profileInitial={post.user.avatar}
          profileBadge={post.user.badge}
        />,
        document.body
      )}

      {/* Edit Post Modal */}
      {showEditModal && (
        <EditPostModal
          post={post}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
