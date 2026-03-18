import { useState } from 'react';
import Image from 'next/image';
import { HeartIcon, ChatIcon, ShareIcon, RepostIcon } from '../icons';
import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';
import { formatFullDate } from '@/lib/feed-utils';
import type { FeedPost } from '@/types/feed';
import VerifiedBadge from '../VerifiedBadge';
import PostOptionsMenu from '../PostOptionsMenu';
import PostBody from './PostBody';

interface FeedItemProps {
  post: FeedPost;
  idx: number;
  user: any;
  activeDotsId: string | null;
  setActiveDotsId: (id: string | null) => void;
  onVenueClick: (name: string) => void;
  toggleLike: (post: FeedPost) => void;
  toggleSave: (post: FeedPost) => void;
  toggleComments: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
  onRepost: (post: FeedPost) => Promise<void>;
  repostReward: number;
  venueLogosMap: Record<string, string>;
}

export function FeedItem({
  post,
  idx,
  user,
  activeDotsId,
  setActiveDotsId,
  onVenueClick,
  toggleLike,
  toggleSave,
  toggleComments,
  onShare,
  onDelete,
  onRepost,
  repostReward,
  venueLogosMap,
}: FeedItemProps) {
  const [reposting, setReposting] = useState(false);
  const [repostCooldown, setRepostCooldown] = useState(false);
  const [showRewardAnim, setShowRewardAnim] = useState(false);
  const [localReposted, setLocalReposted] = useState(post.reposted);
  const [localReposts, setLocalReposts] = useState(post.reposts);

  const handleRepost = async () => {
    if (!user || reposting || repostCooldown || localReposted) return;
    setReposting(true);
    try {
      await onRepost(post);
      setLocalReposted(true);
      setLocalReposts(n => n + 1);
      if (repostReward > 0) {
        setShowRewardAnim(true);
        setTimeout(() => setShowRewardAnim(false), 1800);
      }
      setRepostCooldown(true);
      setTimeout(() => setRepostCooldown(false), 5000);
    } catch {
      // silently fail; parent may show toast
    } finally {
      setReposting(false);
    }
  };

  return (
    <article className="bg-noctvm-surface rounded-xl border border-noctvm-border overflow-hidden animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
      <div className="flex items-center gap-3 p-3">
        <div className="w-9 h-9 rounded-full border border-noctvm-border flex items-center justify-center flex-shrink-0 overflow-hidden relative bg-noctvm-midnight">
          {post.user.avatarUrl ? (
            <Image src={post.user.avatarUrl} alt="" fill className="object-cover" unoptimized />
          ) : (
            <span className="text-xs font-bold text-white">{post.user.avatar}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white">{post.user.name}</span>
            {post.user.badge !== 'none' && <VerifiedBadge type={post.user.badge} size="sm" />}
          </div>
          <span className="text-[10px] text-noctvm-silver block">{post.user.handle}</span>
        </div>
        <span title={formatFullDate(post.createdAt)} className="text-[10px] text-noctvm-silver font-mono">{post.timeAgo}</span>

        <div className="relative">
          <button onClick={() => setActiveDotsId(activeDotsId === post.id ? null : post.id)} className="text-noctvm-silver hover:text-white p-1">
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
              isFollowing={true}
              onClose={() => setActiveDotsId(null)}
              onCopyLink={() => {}}
              onDelete={() => onDelete(post.id)}
              onNotInterested={() => {}}
              onReport={() => {}}
            />
          )}
        </div>
      </div>

      <div className={`aspect-square bg-gradient-to-br ${post.imageTheme.gradient} flex items-center justify-center relative overflow-hidden`}>
        {post.imageUrl ? (
          <Image src={post.imageUrl} alt="" fill className="object-cover" priority={idx < 2} unoptimized />
        ) : (
          <div className="text-white/20 italic p-4 text-center">Scene visualization unavailable</div>
        )}
        {post.venue.tagged && post.venue.name && (
          <button onClick={() => onVenueClick(post.venue.name)} className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 hover:border-noctvm-violet/50">
            <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 bg-noctvm-midnight flex items-center justify-center relative">
              <Image src={getVenueLogo(post.venue.name, venueLogosMap[post.venue.name])} alt="" fill className="object-cover" />
            </div>
            <span className="text-[10px] font-bold text-white pr-1">{post.venue.name}</span>
          </button>
        )}
        {post.event && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-noctvm-violet/80 backdrop-blur-sm border border-noctvm-violet/40">
            <svg className="w-3 h-3 text-white flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-[10px] font-bold text-white max-w-[120px] truncate">{post.event.title}</span>
          </div>
        )}
      </div>

      <div className="px-3 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={() => toggleLike(post)} className={`flex items-center gap-1.5 group ${post.liked ? 'text-noctvm-violet' : 'text-noctvm-silver hover:text-white'}`}>
              <HeartIcon className={`w-5 h-5 ${post.liked ? 'fill-current' : 'group-hover:scale-110'}`} />
              <span className="text-xs font-mono">{post.likes}</span>
            </button>
            <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 text-noctvm-silver hover:text-white group">
              <ChatIcon className="w-5 h-5 group-hover:scale-110" />
            </button>
            <button onClick={() => onShare(post.id)} className="flex items-center gap-1.5 text-noctvm-silver hover:text-white group">
              <ShareIcon className="w-5 h-5 group-hover:scale-110" />
            </button>
            <div className="relative flex items-center">
              <button
                onClick={handleRepost}
                disabled={!user || reposting || localReposted}
                title={localReposted ? 'Already reposted' : 'Repost'}
                className={`flex items-center gap-1.5 group transition-colors disabled:cursor-not-allowed ${
                  localReposted
                    ? 'text-emerald-400'
                    : repostCooldown
                    ? 'text-noctvm-silver/40'
                    : 'text-noctvm-silver hover:text-emerald-400'
                }`}
              >
                <RepostIcon className={`w-5 h-5 ${reposting ? 'animate-spin' : 'group-hover:scale-110'}`} />
                {localReposts > 0 && <span className="text-xs font-mono">{localReposts}</span>}
              </button>
              {showRewardAnim && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold text-emerald-400 animate-bounce-up pointer-events-none whitespace-nowrap">
                  +{repostReward} MR ✦
                </span>
              )}
            </div>
          </div>
          <button onClick={() => toggleSave(post)} className={`${post.saved ? 'text-noctvm-violet' : 'text-noctvm-silver hover:text-white'}`}>
            <svg className={`w-5 h-5 ${post.saved ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
        <p className="text-xs leading-relaxed text-noctvm-silver/90 mb-1">
          <span className="font-bold text-white mr-2">{post.user.handle}</span>
          <PostBody text={post.caption || ''} />
        </p>
        {post.event && (
          <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-noctvm-violet/10 border border-noctvm-violet/20 w-fit">
            <svg className="w-3.5 h-3.5 text-noctvm-violet flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-noctvm-violet truncate max-w-[200px]">{post.event.title}</p>
              {(post.event.venue || post.event.date) && (
                <p className="text-[9px] text-noctvm-silver/60 truncate max-w-[200px]">
                  {[post.event.venue, post.event.date].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
        )}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map(tag => <span key={tag} className="text-[10px] text-noctvm-violet hover:underline cursor-pointer">#{tag}</span>)}
          </div>
        )}
      </div>
    </article>
  );
}
