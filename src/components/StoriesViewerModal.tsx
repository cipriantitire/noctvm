'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Public types ─────────────────────────────────────────────────────────────

export interface StoryUser {
  name: string;
  avatar: string;
  hasNew: boolean;
  color: string; // Tailwind gradient string e.g. 'from-red-500 to-orange-500'
}

// ── Internal types ───────────────────────────────────────────────────────────

interface Story {
  id: number;
  caption: string;
  timeAgo: string;
}

interface StoriesViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: StoryUser[];
  startIndex: number;
}

// ── Mock story data per user ──────────────────────────────────────────────────

const STORY_CAPTIONS = [
  'Best night ever 🔥',
  'Vibes immaculate 🎧',
  "Can't stop, won't stop",
  'Living for this moment ✨',
  'Underground all night long',
];

function buildUserStories(userIndex: number): Story[] {
  const count = 2 + (userIndex % 2); // 2 or 3 stories per user
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    caption: STORY_CAPTIONS[(userIndex + i) % STORY_CAPTIONS.length],
    timeAgo: `${i + 1}h`,
  }));
}

const STORY_DURATION_MS = 5000;

// ── Component ─────────────────────────────────────────────────────────────────

export default function StoriesViewerModal({
  isOpen,
  onClose,
  users,
  startIndex,
}: StoriesViewerModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [userIndex, setUserIndex] = useState(startIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const currentUser = users[userIndex] ?? null;
  const stories = currentUser ? buildUserStories(userIndex) : [];
  const totalStories = stories.length;

  // ── Close ──────────────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsClosing(true);
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────

  const resetProgress = () => {
    setProgress(0);
    elapsedRef.current = 0;
  };

  const advanceStory = useCallback(() => {
    if (storyIndex < totalStories - 1) {
      setStoryIndex((s) => s + 1);
      resetProgress();
    } else if (userIndex < users.length - 1) {
      setUserIndex((u) => u + 1);
      setStoryIndex(0);
      resetProgress();
    } else {
      handleClose();
    }
  }, [storyIndex, totalStories, userIndex, users.length, handleClose]);

  const goBack = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((s) => s - 1);
      resetProgress();
    } else if (userIndex > 0) {
      setUserIndex((u) => u - 1);
      setStoryIndex(0);
      resetProgress();
    }
  }, [storyIndex, userIndex]);

  // ── Reset on open ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setUserIndex(startIndex);
      setStoryIndex(0);
      setProgress(0);
      elapsedRef.current = 0;
      setIsClosing(false);
    }
  }, [isOpen, startIndex]);

  // ── Progress timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen || isClosing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Reset progress for new story
    setProgress(0);
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      elapsedRef.current = elapsed;
      const pct = Math.min((elapsed / STORY_DURATION_MS) * 100, 100);
      setProgress(pct);
      if (elapsed >= STORY_DURATION_MS) {
        clearInterval(timerRef.current!);
        advanceStory();
      }
    }, 40);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isClosing, storyIndex, userIndex]);

  // ── Keyboard navigation ───────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      else if (e.key === 'ArrowRight') advanceStory();
      else if (e.key === 'ArrowLeft') goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose, advanceStory, goBack]);

  // ── Render guard ──────────────────────────────────────────────────────────

  if (!isOpen && !isClosing) return null;
  if (!currentUser) return null;

  const story = stories[storyIndex] ?? stories[0];

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onAnimationEnd={() => {
        if (isClosing) {
          setIsClosing(false);
          onClose();
        }
      }}
    >
      {/* ── Gradient background ─────────────────────────────────────────── */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentUser.color} opacity-80`} />
      <div className="absolute inset-0 bg-black/50" />

      {/* ── Progress bars ───────────────────────────────────────────────── */}
      <div className="absolute top-2 left-3 right-3 flex gap-1 z-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{
                width:
                  i < storyIndex ? '100%' :
                  i === storyIndex ? `${progress}%` :
                  '0%',
                transition: i === storyIndex ? 'none' : undefined,
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Header: avatar + name + close ───────────────────────────────── */}
      <div className="absolute top-7 left-0 right-0 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${currentUser.color} flex items-center justify-center text-white text-sm font-bold border-2 border-white/40 shadow-lg`}
          >
            {currentUser.avatar}
          </div>
          <div>
            <div className="text-white text-sm font-semibold leading-tight drop-shadow">{currentUser.name}</div>
            {story && <div className="text-white/60 text-[10px]">{story.timeAgo}</div>}
          </div>
        </div>
        <button
          onClick={handleClose}
          className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          aria-label="Close stories"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Story content (centre) ───────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <p className="text-white text-2xl font-bold text-center px-10 drop-shadow-2xl leading-snug">
          {story?.caption}
        </p>
      </div>

      {/* ── Tap zones (below header, above content) ─────────────────────── */}
      <div className="absolute inset-0 flex z-10" style={{ top: '80px' }}>
        {/* Left: go back */}
        <div
          className="flex-1 h-full cursor-pointer select-none"
          onClick={goBack}
          aria-label="Previous story"
        />
        {/* Right: advance */}
        <div
          className="flex-1 h-full cursor-pointer select-none"
          onClick={advanceStory}
          aria-label="Next story"
        />
      </div>

      {/* ── Caption bottom ───────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-12 z-20 pointer-events-none" style={{ paddingBottom: 'max(3rem, env(safe-area-inset-bottom))' }}>
        <p className="text-white/80 text-sm text-center">{story?.caption}</p>
      </div>

      {/* ── User navigation hints ────────────────────────────────────────── */}
      {userIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setUserIndex((u) => u - 1); setStoryIndex(0); resetProgress(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all"
          aria-label="Previous user"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {userIndex < users.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setUserIndex((u) => u + 1); setStoryIndex(0); resetProgress(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all"
          aria-label="Next user"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
