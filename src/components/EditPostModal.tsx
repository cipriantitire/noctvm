'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { FeedPost } from '@/types/feed';

interface EditPostModalProps {
  post: FeedPost;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditPostModal({ post, isOpen, onClose }: EditPostModalProps) {
  const [caption, setCaption] = useState(post.caption || '');
  const [isClosing, setIsClosing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Close with ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = async () => {
    if (caption.trim() === post.caption) {
      handleClose();
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ caption: caption.trim() })
        .eq('id', post.id);

      if (updateError) throw updateError;

      onClose();
      // Temporary solution until we add global state mutation: reload the page to show latest caption
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to update caption.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : ''}`}>
      <div
        className={`w-full max-w-md frosted-glass-modal frosted-noise rounded-2xl overflow-hidden shadow-2xl shadow-black/80 ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
        onClick={e => e.stopPropagation()}
        onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-noctvm-border">
          <button onClick={handleClose} className="text-noctvm-silver hover:text-white text-sm transition-colors" title="Cancel edit">Cancel</button>
          <span className="text-sm font-semibold text-white">Edit Post</span>
          <button
            onClick={handleSubmit}
            disabled={submitting || caption.trim() === (post.caption || '')}
            className="text-sm font-semibold text-noctvm-violet hover:text-noctvm-violet/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Save changes"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="p-4">
          <label className="block text-[11px] font-black text-noctvm-silver/50 mb-2 uppercase tracking-widest">Caption</label>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Write a caption..."
            title="Post caption"
            rows={5}
            maxLength={2200}
            className="w-full bg-noctvm-surface/50 border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-noctvm-violet/40 transition-all resize-none shadow-inner"
            autoFocus
          />

          {error && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
