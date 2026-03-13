'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GridIcon, BookmarkIcon, TagIcon, UserIcon } from './icons';

// ── Highlight types ───────────────────────────────────────────────────────────

interface Highlight {
  id: string;
  name: string;
  color: string; // Tailwind gradient
}

const HIGHLIGHT_COLORS = [
  { label: 'Violet', value: 'from-noctvm-violet to-purple-500' },
  { label: 'Pink',   value: 'from-pink-500 to-rose-500' },
  { label: 'Cyan',   value: 'from-cyan-500 to-blue-500' },
  { label: 'Amber',  value: 'from-amber-500 to-orange-500' },
  { label: 'Emerald',value: 'from-emerald-500 to-teal-500' },
  { label: 'Red',    value: 'from-red-500 to-rose-600' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface UserProfilePageProps {
  onOpenAuth: () => void;
  onSettingsClick: () => void;
  onOpenCreatePost?: () => void;
  onOpenStories?: (index: number) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserProfilePage({
  onOpenAuth,
  onSettingsClick,
  onOpenCreatePost,
  onOpenStories,
}: UserProfilePageProps) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');

  // ── Highlights state ──────────────────────────────────────────────────────
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [showNewHighlight, setShowNewHighlight] = useState(false);
  const [newHighlightName, setNewHighlightName] = useState('');
  const [newHighlightColor, setNewHighlightColor] = useState(HIGHLIGHT_COLORS[0].value);

  const createHighlight = () => {
    const name = newHighlightName.trim();
    if (!name) return;
    setHighlights((prev) => [
      ...prev,
      { id: Date.now().toString(), name, color: newHighlightColor },
    ]);
    setNewHighlightName('');
    setNewHighlightColor(HIGHLIGHT_COLORS[0].value);
    setShowNewHighlight(false);
  };

  const cancelNewHighlight = () => {
    setNewHighlightName('');
    setNewHighlightColor(HIGHLIGHT_COLORS[0].value);
    setShowNewHighlight(false);
  };

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-16 tab-content animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-noctvm-surface border-2 border-noctvm-violet/30 flex items-center justify-center mx-auto mb-6">
          <UserIcon className="w-10 h-10 text-noctvm-silver" />
        </div>
        <h2 className="font-heading text-xl font-bold text-white mb-2">Join NOCTVM</h2>
        <p className="text-sm text-noctvm-silver mb-6">
          Sign in to save events, follow venues, and connect with the nightlife community.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-8 py-3 rounded-lg bg-noctvm-violet text-white text-sm font-medium hover:bg-noctvm-violet/90 transition-colors"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  // ── Logged-in profile ─────────────────────────────────────────────────────
  const initials = (profile?.display_name || profile?.username || 'N')[0].toUpperCase();

  const stats = [
    { label: 'Posts',     value: 0 },
    { label: 'Followers', value: 0 },
    { label: 'Following', value: 0 },
  ];

  const tabs = [
    { key: 'posts'  as const, icon: <GridIcon     className="w-5 h-5" /> },
    { key: 'saved'  as const, icon: <BookmarkIcon className="w-5 h-5" /> },
    { key: 'tagged' as const, icon: <TagIcon      className="w-5 h-5" /> },
  ];

  const emptyMessages = {
    posts:  { title: 'No Posts Yet',    sub: 'Share your first nightlife moment', cta: true  },
    saved:  { title: 'Nothing Saved',   sub: 'Save posts to find them here',      cta: false },
    tagged: { title: 'No Tags Yet',     sub: 'Posts where you are tagged appear here', cta: false },
  };

  return (
    <div className="max-w-xl mx-auto tab-content animate-fade-in">

      {/* ── Profile header ────────────────────────────────────── */}
      <div className="px-4 pt-2 pb-4">

        {/* Avatar + stats */}
        <div className="flex items-center gap-6 mb-4">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-500 overflow-hidden ring-2 ring-noctvm-border">
              {profile?.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{initials}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex justify-around">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <span className="block text-base font-bold text-white font-heading">{stat.value}</span>
                <span className="text-[11px] text-noctvm-silver">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Name, username, bio */}
        <div className="mb-3 space-y-0.5">
          <p className="text-sm font-semibold text-white leading-tight">
            {profile?.display_name || 'Night Owl'}
          </p>
          <p className="text-xs text-noctvm-silver">@{profile?.username || 'nightowl'}</p>
          {profile?.bio && (
            <p className="text-xs text-noctvm-silver/80 mt-1.5 leading-relaxed">{profile.bio}</p>
          )}
          {profile?.city && (
            <div className="flex items-center gap-1 mt-1">
              <svg className="w-3 h-3 text-noctvm-silver/50" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.953-5.158 3.953-9.077A8.223 8.223 0 0012 2.25a8.223 8.223 0 00-8.22 7.97c0 3.92 2.01 6.998 3.954 9.077a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] text-noctvm-silver/50">{profile.city}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onSettingsClick}
            className="flex-1 py-2 rounded-lg bg-noctvm-surface border border-noctvm-border text-xs font-semibold text-white hover:bg-noctvm-surface/70 transition-colors"
          >
            Edit Profile
          </button>
          <button className="flex-1 py-2 rounded-lg bg-noctvm-surface border border-noctvm-border text-xs font-semibold text-white hover:bg-noctvm-surface/70 transition-colors">
            Share Profile
          </button>
        </div>
      </div>

      {/* ── Story highlights ──────────────────────────────────── */}
      <div className="border-t border-noctvm-border px-4 py-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">

          {/* "New" button */}
          <button
            onClick={() => setShowNewHighlight(true)}
            className="flex flex-col items-center gap-1 flex-shrink-0 focus:outline-none group"
            aria-label="Create new highlight"
          >
            <div className="w-16 h-16 rounded-full bg-noctvm-surface border-2 border-dashed border-noctvm-border flex items-center justify-center group-hover:border-noctvm-violet/50 transition-colors">
              <svg className="w-6 h-6 text-noctvm-silver group-hover:text-noctvm-violet transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-[9px] text-noctvm-silver">New</span>
          </button>

          {/* Existing highlights */}
          {highlights.map((hl, i) => (
            <button
              key={hl.id}
              onClick={() => onOpenStories?.(i % 7)}
              className="flex flex-col items-center gap-1 flex-shrink-0 focus:outline-none group"
            >
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${hl.color} flex items-center justify-center ring-2 ring-noctvm-border group-hover:ring-noctvm-violet/50 transition-all`}>
                <span className="text-white text-lg font-bold">{hl.name[0].toUpperCase()}</span>
              </div>
              <span className="text-[9px] text-noctvm-silver truncate max-w-[4rem] text-center">{hl.name}</span>
            </button>
          ))}
        </div>

        {/* Inline create form */}
        {showNewHighlight && (
          <div className="mt-3 p-3 rounded-xl bg-noctvm-surface border border-noctvm-border animate-scale-in">
            <p className="text-xs font-semibold text-white mb-2">New Highlight</p>
            <input
              type="text"
              value={newHighlightName}
              onChange={(e) => setNewHighlightName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createHighlight(); if (e.key === 'Escape') cancelNewHighlight(); }}
              placeholder="Collection name…"
              maxLength={24}
              autoFocus
              className="w-full bg-noctvm-midnight border border-noctvm-border rounded-lg px-3 py-2 text-sm text-white placeholder-noctvm-silver/50 focus:outline-none focus:border-noctvm-violet/50 mb-3"
            />
            {/* Color swatches */}
            <div className="flex gap-2 mb-3">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setNewHighlightColor(c.value)}
                  title={c.label}
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${c.value} border-2 transition-all ${newHighlightColor === c.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                />
              ))}
            </div>
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={cancelNewHighlight}
                className="flex-1 py-1.5 rounded-lg border border-noctvm-border text-xs text-noctvm-silver hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createHighlight}
                disabled={!newHighlightName.trim()}
                className="flex-1 py-1.5 rounded-lg bg-noctvm-violet text-white text-xs font-semibold hover:bg-noctvm-violet/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Tab bar ───────────────────────────────────────────── */}
      <div className="border-t border-noctvm-border">
        <div className="flex">
          {tabs.map(({ key, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex justify-center py-3 border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-white text-white'
                  : 'border-transparent text-noctvm-silver hover:text-white'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Posts grid / empty state ──────────────────────────── */}
      <div className="pb-24 lg:pb-6">
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-noctvm-surface border-2 border-noctvm-border flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-noctvm-silver/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </div>
          <h3 className="font-heading text-sm font-bold text-white mb-1">
            {emptyMessages[activeTab].title}
          </h3>
          <p className="text-xs text-noctvm-silver/60">
            {emptyMessages[activeTab].sub}
          </p>
          {emptyMessages[activeTab].cta && (
            <button
              onClick={onOpenCreatePost}
              className="mt-4 px-6 py-2 rounded-lg bg-noctvm-violet/20 border border-noctvm-violet/30 text-noctvm-violet text-xs font-medium hover:bg-noctvm-violet/30 transition-colors"
            >
              Create Post
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
