'use client';

import { useEffect, useRef } from 'react';

interface PostOptionsMenuProps {
  postId: string;
  postUserId: string | null;      // null = mock post
  currentUserId: string | null;   // null = not logged in
  authorHandle: string;
  isFollowing?: boolean;
  onClose: () => void;
  onUnfollow?: () => void;
  onNotInterested?: () => void;
  onCopyLink?: () => void;
  onReport?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PostOptionsMenu({
  postUserId,
  currentUserId,
  authorHandle,
  isFollowing = true,
  onClose,
  onUnfollow,
  onNotInterested,
  onCopyLink,
  onReport,
  onEdit,
  onDelete,
}: PostOptionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwnPost = postUserId && currentUserId && postUserId === currentUserId;

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const OptionRow = ({
    label,
    icon,
    danger = false,
    onClick,
  }: {
    label: string;
    icon: React.ReactNode;
    danger?: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={() => { onClick(); onClose(); }}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-noctvm-midnight text-left ${
        danger ? 'text-red-400 hover:text-red-300' : 'text-white hover:text-white'
      }`}
    >
      <span className={danger ? 'text-red-400' : 'text-noctvm-silver'}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div
      ref={menuRef}
      className="absolute top-8 right-0 z-50 w-52 bg-noctvm-midnight border border-noctvm-border rounded-xl overflow-hidden shadow-2xl shadow-black/60 animate-scale-in origin-top-right"
    >
      {isOwnPost ? (
        <>
          <OptionRow
            label="Copy Link"
            icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>}
            onClick={onCopyLink || (() => {})}
          />
          <div className="h-px bg-noctvm-border mx-4" />
          <OptionRow
            label="Edit Post"
            icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
            onClick={onEdit || (() => {})}
          />
          <div className="h-px bg-noctvm-border mx-4" />
          <OptionRow
            label="Delete Post"
            icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>}
            danger
            onClick={onDelete || (() => {})}
          />
        </>
      ) : (
        <>
          <OptionRow
            label="Not Interested"
            icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>}
            onClick={onNotInterested || (() => {})}
          />
          {isFollowing && (
            <OptionRow
              label={`Unfollow ${authorHandle}`}
              icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"/></svg>}
              onClick={onUnfollow || (() => {})}
            />
          )}
          <OptionRow
            label="Copy Link"
            icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"/></svg>}
            onClick={onCopyLink || (() => {})}
          />
          <div className="h-px bg-noctvm-border mx-4" />
          <OptionRow
            label="Report"
            icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"/></svg>}
            danger
            onClick={onReport || (() => {})}
          />
        </>
      )}
    </div>
  );
}
