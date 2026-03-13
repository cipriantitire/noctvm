'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { RealStory } from './StoriesViewerModal';

// ── Constants ─────────────────────────────────────────────────────────────────

const HIGHLIGHT_COLORS = [
  { label: 'Violet',  value: 'from-noctvm-violet to-purple-500' },
  { label: 'Pink',    value: 'from-pink-500 to-rose-500' },
  { label: 'Cyan',    value: 'from-cyan-500 to-blue-500' },
  { label: 'Amber',   value: 'from-amber-500 to-orange-500' },
  { label: 'Emerald', value: 'from-emerald-500 to-teal-500' },
  { label: 'Red',     value: 'from-red-500 to-rose-600' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface CreateHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateHighlightModal({
  isOpen,
  onClose,
  onCreated,
}: CreateHighlightModalProps) {
  const { user } = useAuth();

  // Step 1: story picker; Step 2: name + color
  const [step, setStep] = useState<1 | 2>(1);
  const [stories, setStories] = useState<RealStory[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Step 2 state
  const [name, setName] = useState('');
  const [color, setColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch user's own stories ───────────────────────────────────────────────

  const fetchStories = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('stories')
      .select('id, image_url, caption, venue_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setStories((data as RealStory[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setStep(1);
      setSelectedIds(new Set());
      setName('');
      setColor(HIGHLIGHT_COLORS[0].value);
      setError(null);
      fetchStories();
    }
  }, [isOpen, fetchStories]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleStory = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || !user) return;

    setCreating(true);
    setError(null);

    // Derive cover_url from the first selected story that has an image
    const firstSelectedStory = stories.find(
      (s) => selectedIds.has(s.id) && s.image_url
    );
    const coverUrl = firstSelectedStory?.image_url ?? null;

    // Insert highlight row
    const { data: hlData, error: hlError } = await supabase
      .from('highlights')
      .insert({
        user_id: user.id,
        name: trimmedName,
        color,
        cover_url: coverUrl,
      })
      .select('id')
      .single();

    if (hlError || !hlData) {
      setError(hlError?.message ?? 'Failed to create highlight');
      setCreating(false);
      return;
    }

    // Insert junction rows
    if (selectedIds.size > 0) {
      const junctionRows = Array.from(selectedIds).map((storyId) => ({
        highlight_id: hlData.id,
        story_id: storyId,
      }));

      const { error: jError } = await supabase
        .from('highlight_stories')
        .insert(junctionRows);

      if (jError) {
        setError(jError.message);
        setCreating(false);
        return;
      }
    }

    setCreating(false);
    onCreated();
    onClose();
  };

  // ── Don't render when closed ───────────────────────────────────────────────

  if (!isOpen) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4 bg-noctvm-midnight border border-noctvm-border rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-noctvm-border">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="p-1 rounded-lg text-noctvm-silver hover:text-white transition-colors"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-noctvm-silver hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <h2 className="flex-1 text-center text-sm font-semibold text-white">
            {step === 1 ? 'Select Stories' : 'New Highlight'}
          </h2>
          {/* Spacer to centre heading */}
          <div className="w-7" />
        </div>

        {/* ── Step 1: Story picker ───────────────────────────────── */}
        {step === 1 && (
          <>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-noctvm-violet border-t-transparent rounded-full animate-spin" />
                </div>
              ) : stories.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-noctvm-silver">No stories yet.</p>
                  <p className="text-xs text-noctvm-silver/50 mt-1">Post a story first to add it to a highlight.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {stories.map((story) => {
                    const isSelected = selectedIds.has(story.id);
                    return (
                      <button
                        key={story.id}
                        onClick={() => toggleStory(story.id)}
                        className="relative focus:outline-none"
                        style={{ aspectRatio: '1' }}
                      >
                        {story.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={story.image_url}
                            alt={story.caption ?? ''}
                            className="w-full h-full object-cover rounded-sm"
                          />
                        ) : (
                          <div className="w-full h-full rounded-sm bg-gradient-to-br from-noctvm-violet to-purple-500 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {story.caption?.[0]?.toUpperCase() ?? '?'}
                            </span>
                          </div>
                        )}

                        {/* Selection overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 rounded-sm bg-noctvm-violet/40 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-noctvm-violet flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-noctvm-border flex items-center justify-between">
              <span className="text-xs text-noctvm-silver">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setStep(2)}
                disabled={selectedIds.size === 0}
                className="px-5 py-2 rounded-lg bg-noctvm-violet text-white text-sm font-semibold hover:bg-noctvm-violet/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Name + color ───────────────────────────────── */}
        {step === 2 && (
          <div className="p-4 space-y-4">
            {/* Name input */}
            <div>
              <label className="block text-xs font-semibold text-noctvm-silver mb-1.5">
                Highlight Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                placeholder="e.g. Summer Nights"
                maxLength={24}
                autoFocus
                className="w-full bg-noctvm-surface border border-noctvm-border rounded-lg px-3 py-2 text-sm text-white placeholder-noctvm-silver/50 focus:outline-none focus:border-noctvm-violet/50"
              />
              <p className="text-right text-[10px] text-noctvm-silver/40 mt-1">
                {name.length}/24
              </p>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-semibold text-noctvm-silver mb-2">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    title={c.label}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.value} border-2 transition-all ${
                      color === c.value
                        ? 'border-white scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-noctvm-border text-xs text-noctvm-silver hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || creating}
                className="flex-1 py-2.5 rounded-lg bg-noctvm-violet text-white text-sm font-semibold hover:bg-noctvm-violet/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
