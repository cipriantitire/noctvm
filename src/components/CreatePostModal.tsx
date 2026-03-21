'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getVenueLogo } from '@/lib/venue-logos';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
  onOpenAuth?: () => void;
  activeCity?: 'bucuresti' | 'constanta';
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated, onOpenAuth, activeCity = 'bucuresti' }: CreatePostModalProps) {
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [caption, setCaption] = useState('');
  const [venueSearch, setVenueSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [showPeopleSuggestions, setShowPeopleSuggestions] = useState(false);
  const [profileResults, setProfileResults] = useState<{ id: string; handle: string; name: string }[]>([]);
  const [eventSearch, setEventSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; title: string; date: string; venue: string } | null>(null);
  const [showEventSuggestions, setShowEventSuggestions] = useState(false);
  const [eventResults, setEventResults] = useState<{ id: string; title: string; date: string; venue: string }[]>([]);
  const [venueResults, setVenueResults] = useState<{ name: string; logo_url: string | null }[]>([]);

  // Close with ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const searchVenues = async (q: string) => {
    if (!q || q.length < 1) { setVenueResults([]); return; }
    const { data } = await supabase
      .from('venues')
      .select('name, logo_url')
      .ilike('name', `%${q}%`)
      .limit(8);
    setVenueResults(data || []);
  };

  const searchProfiles = async (q: string) => {
    const term = q.replace(/^@/, '');
    if (!term || term.length < 2) { setProfileResults([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
      .limit(8);
    setProfileResults((data || []).map((p: any) => ({
      id: p.id,
      handle: `@${p.username}`,
      name: p.display_name,
    })));
  };

  const searchEvents = async (q: string) => {
    if (!q || q.length < 2) { setEventResults([]); return; }
    const { data } = await supabase
      .from('events')
      .select('id, title, date, venue')
      .ilike('title', `%${q}%`)
      .order('date', { ascending: false })
      .limit(8);
    
    setEventResults((data || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      venue: e.venue || 'TBA',
    })));
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const addTag = () => {
    const raw = tagInput.trim().replace(/#/g, '');
    if (raw && !tags.includes(`#${raw}`) && tags.length < 10) {
      setTags(prev => [...prev, `#${raw}`]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const handleSubmit = async () => {
    if (!user) return;
    if (!caption.trim() && !imagePreview) {
      setError('Add a caption or photo before posting.');
      return;
    }
    
    // Auto-append pending hashtag if they didn't hit enter
    let currentTags = tags;
    if (tagInput.trim()) {
      const raw = tagInput.trim().replace(/#/g, '');
      if (raw && !currentTags.includes(`#${raw}`) && currentTags.length < 10) {
        currentTags = [...currentTags, `#${raw}`];
        setTags(currentTags);
      }
    }
    
    setSubmitting(true);
    setError('');

    try {
      let uploadedUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('post-media')
          .upload(path, imageFile, { cacheControl: '3600', upsert: false });
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(path);
        uploadedUrl = publicUrl;
      }

      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption: caption.trim(),
          image_url: uploadedUrl,
          venue_name: selectedVenue || null,
          tags: currentTags.length > 0 ? currentTags : null,
          tagged_users: taggedUsers.length > 0 ? taggedUsers : null,
          city: activeCity === 'bucuresti' ? 'Bucharest' : 'Constanta',
          event_id: selectedEvent?.id || null,
          event_title: selectedEvent?.title || null,
          event_date: selectedEvent?.date || null,
          event_venue: selectedEvent?.venue || null,
        });

      if (insertError) throw insertError;

      // Reset form
      setImagePreview(null);
      setImageFile(null);
      setCaption('');
      setSelectedVenue('');
      setVenueSearch('');
      setTags([]);
      setTagInput('');
      setTaggedUsers([]);
      setPeopleSearch('');
      setProfileResults([]);
      onPostCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Failed to create post.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setImagePreview(null);
    setImageFile(null);
    setCaption('');
    setSelectedVenue('');
    setVenueSearch('');
    setTags([]);
    setTagInput('');
    setTaggedUsers([]);
    setPeopleSearch('');
    setProfileResults([]);
    setEventSearch('');
    setSelectedEvent(null);
    setEventResults([]);
    setError('');
    setIsClosing(true);
  };

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-noctvm-midnight border border-noctvm-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
          <p className="text-white font-semibold mb-2">Sign in to post</p>
          <p className="text-sm text-noctvm-silver mb-4">Create an account to share your nightlife moments.</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { onClose(); onOpenAuth?.(); }}
              className="px-6 py-2.5 rounded-lg bg-noctvm-violet text-white text-sm font-medium hover:bg-noctvm-violet/90 transition-colors"
            >
              Sign In
            </button>
            <button onClick={onClose} className="text-xs text-noctvm-silver hover:text-white transition-colors py-1">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : ''}`}>
      <div
        className={`w-full max-w-lg frosted-glass-modal frosted-noise rounded-2xl overflow-hidden shadow-2xl shadow-black/80 ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
        onClick={e => e.stopPropagation()}
        onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-noctvm-border">
          <button onClick={handleClose} className="text-noctvm-silver hover:text-white text-sm transition-colors" title="Cancel post">Cancel</button>
          <span className="text-sm font-semibold text-white">New Post</span>
          <button
            onClick={handleSubmit}
            disabled={submitting || (!caption.trim() && !imagePreview)}
            className="text-sm font-semibold text-noctvm-violet hover:text-noctvm-violet/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Share post"
          >
            {submitting ? 'Sharing...' : 'Share'}
          </button>
        </div>

        <div className="overflow-y-auto max-h-[80vh]">
          {/* Image upload area */}
          <div
            className={`relative mx-4 mt-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
              isDragging ? 'border-noctvm-violet bg-noctvm-violet/5' : 'border-noctvm-border hover:border-noctvm-violet/40'
            } ${imagePreview ? 'border-solid border-noctvm-border' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <div className="relative">
                <Image src={imagePreview} alt="Preview" width={500} height={500} className="w-full rounded-xl object-contain max-h-80" unoptimized />
                <button
                  onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition-colors"
                  title="Remove photo"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3">
                <div className="w-14 h-14 rounded-2xl bg-noctvm-surface flex items-center justify-center">
                  <svg className="w-7 h-7 text-noctvm-silver" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">Drop photo here</p>
                  <p className="text-xs text-noctvm-silver mt-0.5">or <span className="text-noctvm-violet font-bold">browse files</span></p>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" title="upload image" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {/* Caption + user */}
          <div className="flex items-start gap-3 px-4 py-4 border-b border-noctvm-border">
            <div className="w-8 h-8 rounded-full bg-noctvm-surface border border-noctvm-border flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              {profile?.avatar_url
                ? <Image src={profile.avatar_url} alt="My profile" fill className="object-cover" unoptimized />
                : <span className="text-xs font-bold text-white">{(profile?.display_name || 'N')[0].toUpperCase()}</span>
              }
            </div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Write a caption..."
              title="Post caption"
              rows={3}
              maxLength={2200}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-noctvm-silver/40 outline-none resize-none"
            />
          </div>

          {/* Tag venue */}
          <div className="px-4 py-3 border-b border-noctvm-border relative">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">Tag Venue</span>
              <div className="flex-1 ml-4">
                {selectedVenue ? (
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm text-noctvm-violet font-bold">{selectedVenue}</span>
                    <button onClick={() => { setSelectedVenue(''); setVenueSearch(''); }} className="text-noctvm-silver hover:text-white" title="Remove venue">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Search venues..."
                    title="Search venues to tag"
                    value={venueSearch}
                    onChange={e => { setVenueSearch(e.target.value); searchVenues(e.target.value); setShowVenueSuggestions(true); }}
                    onFocus={() => setShowVenueSuggestions(true)}
                    className="w-full bg-transparent text-sm text-white placeholder:text-noctvm-silver/40 outline-none text-right"
                  />
                )}
              </div>
            </div>
            {showVenueSuggestions && venueResults.length > 0 && !selectedVenue && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-noctvm-midnight/95 backdrop-blur-xl border border-noctvm-border rounded-xl shadow-2xl z-20 overflow-hidden">
                {venueResults.map(venue => (
                  <button
                    key={venue.name}
                    onMouseDown={() => { setSelectedVenue(venue.name); setVenueSearch(''); setShowVenueSuggestions(false); }}
                    className="w-full px-3 py-2.5 text-sm text-white hover:bg-noctvm-surface text-left transition-colors flex items-center gap-2"
                    title={`Select ${venue.name}`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 bg-black/20 flex-shrink-0 relative">
                       <Image src={getVenueLogo(venue.name, venue.logo_url || undefined)} alt="" fill className="object-cover" />
                    </div>
                    {venue.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tag event */}
          <div className="px-4 py-3 border-b border-noctvm-border relative">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">Tag Event</span>
              <div className="flex-1 ml-4">
                {selectedEvent ? (
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm text-noctvm-emerald font-bold">{selectedEvent.title}</span>
                    <button onClick={() => { setSelectedEvent(null); setEventSearch(''); }} className="text-noctvm-silver hover:text-white" title="Remove event">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Search events..."
                    title="Search events to tag"
                    value={eventSearch}
                    onChange={e => { setEventSearch(e.target.value); searchEvents(e.target.value); setShowEventSuggestions(true); }}
                    onFocus={() => setShowEventSuggestions(true)}
                    className="w-full bg-transparent text-sm text-white placeholder:text-noctvm-silver/40 outline-none text-right"
                  />
                )}
              </div>
            </div>
            {showEventSuggestions && eventResults.length > 0 && !selectedEvent && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-noctvm-midnight/95 backdrop-blur-xl border border-noctvm-border rounded-xl shadow-2xl z-20 overflow-hidden">
                {eventResults.map(e => (
                  <button
                    key={e.id}
                    onMouseDown={() => { setSelectedEvent(e); setEventSearch(''); setShowEventSuggestions(false); }}
                    className="w-full px-3 py-2.5 text-sm text-white hover:bg-noctvm-surface text-left transition-colors flex flex-col"
                    title={`Select ${e.title}`}
                  >
                    <span className="font-medium">{e.title}</span>
                    <span className="text-[10px] text-noctvm-silver">{new Date(e.date).toLocaleDateString()} • {e.venue}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tag people */}
          <div className="px-4 py-3 border-b border-noctvm-border relative">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-white flex-shrink-0">Tag People</span>
              {taggedUsers.map(handle => (
                <span key={handle} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-noctvm-violet/20 text-noctvm-violet text-xs border border-noctvm-violet/20">
                  {handle}
                  <button onClick={() => setTaggedUsers(prev => prev.filter(h => h !== handle))} title={`Remove ${handle}`}>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="@username"
                title="Search people to tag"
                value={peopleSearch}
                onChange={e => { setPeopleSearch(e.target.value); searchProfiles(e.target.value); setShowPeopleSuggestions(true); }}
                onFocus={() => setShowPeopleSuggestions(true)}
                onBlur={() => setTimeout(() => setShowPeopleSuggestions(false), 150)}
                className="flex-1 min-w-[100px] bg-transparent text-sm text-white placeholder:text-noctvm-silver/40 outline-none"
              />
            </div>
            {showPeopleSuggestions && profileResults.length > 0 && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-noctvm-midnight border border-noctvm-border rounded-xl overflow-hidden z-10 shadow-xl">
                {profileResults.map(u => (
                  <button
                    key={u.id}
                    onMouseDown={() => {
                      setTaggedUsers(prev => [...prev, u.handle]);
                      setPeopleSearch('');
                      setProfileResults([]);
                      setShowPeopleSuggestions(false);
                    }}
                    className="w-full px-3 py-2.5 text-sm text-white hover:bg-noctvm-surface text-left transition-colors flex items-center gap-2"
                    title={`Tag ${u.name}`}
                  >
                    <span className="font-medium">{u.name}</span>
                    <span className="text-noctvm-silver text-xs">{u.handle}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="px-4 py-3 border-b border-noctvm-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white flex-shrink-0">Tags</span>
              <div className="flex-1 flex flex-wrap items-center gap-1.5">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-noctvm-violet/20 text-noctvm-violet text-xs">
                    {tag}
                    <button onClick={() => removeTag(tag)} title={`Remove tag ${tag}`}>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="#tag"
                  title="Add hashtags"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addTag(); } }}
                  className="flex-1 min-w-[80px] bg-transparent text-xs text-white placeholder:text-noctvm-silver/30 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 my-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
