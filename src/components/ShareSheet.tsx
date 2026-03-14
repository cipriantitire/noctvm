'use client';

import { useEffect, useRef, useState } from 'react';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  postCaption?: string;
  postUrl?: string;
}

// Mock friends — will be replaced with real follows data in Task 3 backend wiring
const MOCK_FRIENDS = [
  { name: 'Alexandra', initial: 'A', color: 'from-pink-500 to-rose-500' },
  { name: 'Mihai', initial: 'M', color: 'from-blue-500 to-cyan-500' },
  { name: 'Ioana', initial: 'I', color: 'from-emerald-500 to-teal-500' },
  { name: 'Stefan', initial: 'S', color: 'from-amber-500 to-orange-500' },
  { name: 'Catalina', initial: 'C', color: 'from-noctvm-violet to-purple-500' },
  { name: 'Andrei', initial: 'R', color: 'from-red-500 to-orange-500' },
  { name: 'Diana', initial: 'D', color: 'from-fuchsia-500 to-pink-500' },
  { name: 'Radu', initial: 'R', color: 'from-indigo-500 to-blue-500' },
];

const PLATFORMS = [
  {
    label: 'Copy link',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    bg: 'bg-noctvm-surface',
    action: 'copy',
  },
  {
    label: 'Instagram',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    bg: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    action: 'instagram',
  },
  {
    label: 'Facebook',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    bg: 'bg-[#1877F2]',
    action: 'facebook',
  },
  {
    label: 'Messenger',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.374 0 0 4.975 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.626 0 12-4.975 12-11.111S18.626 0 12 0zm1.191 14.963L10.025 11.6 3.86 14.963l6.831-7.258 3.198 3.362 6.127-3.362-6.825 7.258z" />
      </svg>
    ),
    bg: 'bg-gradient-to-br from-blue-500 to-purple-600',
    action: 'messenger',
  },
  {
    label: 'WhatsApp',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.49" />
      </svg>
    ),
    bg: 'bg-[#25D366]',
    action: 'whatsapp',
  },
  {
    label: 'Email',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    bg: 'bg-noctvm-surface',
    action: 'email',
  },
  {
    label: 'X',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    bg: 'bg-black border border-noctvm-border',
    action: 'x',
  },
];

export default function ShareSheet({ isOpen, onClose, postCaption = '', postUrl = '' }: ShareSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shareUrl = postUrl || window.location.href;
  const filteredFriends = MOCK_FRIENDS.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePlatform = (action: string) => {
    switch (action) {
      case 'copy':
        navigator.clipboard.writeText(shareUrl).then(() => {
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        });
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=Check this out&body=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'x':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      default:
        break;
    }
    if (action !== 'copy') onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-lg bg-noctvm-midnight border border-noctvm-border rounded-t-2xl pb-[env(safe-area-inset-bottom)] animate-slide-up"
        style={{ maxHeight: '80vh' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-noctvm-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-noctvm-border">
          <span className="text-sm font-semibold text-white">Share</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-noctvm-surface flex items-center justify-center text-noctvm-silver hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-noctvm-surface rounded-xl border border-noctvm-border">
            <svg className="w-4 h-4 text-noctvm-silver flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-noctvm-silver/40 outline-none"
            />
          </div>
        </div>

        {/* Friends grid */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-4 gap-3">
            {filteredFriends.slice(0, 8).map((friend) => (
              <button
                key={friend.name}
                onClick={onClose}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${friend.color} flex items-center justify-center ring-2 ring-transparent group-hover:ring-noctvm-violet/40 transition-all`}>
                  <span className="text-base font-bold text-white">{friend.initial}</span>
                </div>
                <span className="text-[10px] text-noctvm-silver truncate w-full text-center">{friend.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-noctvm-border mx-4 mb-3" />

        {/* Platform row */}
        <div className="px-4 pb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 min-w-max">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.label}
                onClick={() => handlePlatform(platform.action)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div className={`w-12 h-12 rounded-2xl ${platform.bg} flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95`}>
                  {platform.icon}
                </div>
                <span className="text-[10px] text-noctvm-silver whitespace-nowrap">
                  {platform.action === 'copy' && copiedLink ? '✓ Copied!' : platform.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
