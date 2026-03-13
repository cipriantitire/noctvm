'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Public types ─────────────────────────────────────────────────────────────

export interface RealStory {
  id: string;
  image_url: string | null;
  caption: string | null;
  venue_name: string | null;
  created_at: string;
}

export interface StoryUser {
  id: string;
  name: string;
  avatar: string;          // single letter fallback
  avatarUrl?: string | null;
  hasNew: boolean;
  color: string;           // Tailwind gradient, used as bg fallback
  stories: RealStory[];
}

interface StoriesViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: StoryUser[];
  startIndex: number;
}

function isVideo(url: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|mov|avi|m4v)(\?|$)/i.test(url);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const STORY_DURATION_MS = 5000;

export default function StoriesViewerModal({
  isOpen, onClose, users, startIndex,
}: StoriesViewerModalProps) {
  const [isClosing, setIsClosing]     = useState(false);
  const [userIndex, setUserIndex]     = useState(startIndex);
  const [storyIndex, setStoryIndex]   = useState(0);
  const [progress, setProgress]       = useState(0);

  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef  = useRef<number>(0);

  const currentUser  = users[userIndex] ?? null;
  const stories      = currentUser?.stories ?? [];
  const totalStories = stories.length;

  const handleClose = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsClosing(true);
  }, []);

  const resetProgress = () => { setProgress(0); };

  const advanceStory = useCallback(() => {
    if (storyIndex < totalStories - 1) {
      setStoryIndex(s => s + 1); resetProgress();
    } else if (userIndex < users.length - 1) {
      setUserIndex(u => u + 1); setStoryIndex(0); resetProgress();
    } else {
      handleClose();
    }
  }, [storyIndex, totalStories, userIndex, users.length, handleClose]);

  const goBack = useCallback(() => {
    if (storyIndex > 0) { setStoryIndex(s => s - 1); resetProgress(); }
    else if (userIndex > 0) { setUserIndex(u => u - 1); setStoryIndex(0); resetProgress(); }
  }, [storyIndex, userIndex]);

  useEffect(() => {
    if (isOpen) {
      setUserIndex(startIndex); setStoryIndex(0);
      setProgress(0); setIsClosing(false);
    }
  }, [isOpen, startIndex]);

  useEffect(() => {
    if (!isOpen || isClosing || !totalStories) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setProgress(0);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / STORY_DURATION_MS) * 100, 100);
      setProgress(pct);
      if (elapsed >= STORY_DURATION_MS) { clearInterval(timerRef.current!); advanceStory(); }
    }, 40);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isClosing, storyIndex, userIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      handleClose();
      else if (e.key === 'ArrowRight') advanceStory();
      else if (e.key === 'ArrowLeft')  goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose, advanceStory, goBack]);

  if (!isOpen && !isClosing) return null;
  if (!currentUser || !totalStories) return null;

  const story = stories[storyIndex] ?? stories[0];

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
    >
      {/* Background: real image/video or gradient fallback */}
      {story.image_url ? (
        isVideo(story.image_url) ? (
          <video
            key={story.image_url}
            src={story.image_url}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            loop
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={story.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${currentUser.color}`} />
      )}
      <div className="absolute inset-0 bg-black/40" />

      {/* Progress bars */}
      <div className="absolute top-2 left-3 right-3 flex gap-1 z-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%' }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-7 left-0 right-0 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${currentUser.color} flex items-center justify-center text-white text-sm font-bold border-2 border-white/40 shadow-lg overflow-hidden`}>
            {currentUser.avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              : currentUser.avatar}
          </div>
          <div>
            <div className="text-white text-sm font-semibold leading-tight drop-shadow">{currentUser.name}</div>
            <div className="text-white/60 text-[10px]">{timeAgo(story.created_at)}</div>
          </div>
        </div>
        <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-colors" aria-label="Close">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Story caption */}
      {story.caption && (
        <div className="absolute bottom-0 left-0 right-0 px-6 z-20 pointer-events-none" style={{ paddingBottom: 'max(3rem, env(safe-area-inset-bottom))' }}>
          <p className="text-white text-sm text-center drop-shadow-lg">{story.caption}</p>
          {story.venue_name && <p className="text-white/60 text-xs text-center mt-1">📍 {story.venue_name}</p>}
        </div>
      )}

      {/* Tap zones */}
      <div className="absolute inset-0 flex z-10" style={{ top: '80px' }}>
        <div className="flex-1 h-full cursor-pointer select-none" onClick={goBack} />
        <div className="flex-1 h-full cursor-pointer select-none" onClick={advanceStory} />
      </div>

      {/* User nav arrows */}
      {userIndex > 0 && (
        <button onClick={e => { e.stopPropagation(); setUserIndex(u => u - 1); setStoryIndex(0); resetProgress(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
      {userIndex < users.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setUserIndex(u => u + 1); setStoryIndex(0); resetProgress(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      )}
    </div>
  );
}
