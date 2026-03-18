'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
  onOpenAuth?: () => void;
  activeCity?: 'bucuresti' | 'constanta';
}

const BUCHAREST_VENUES = [
  'Control Club', 'Expirat Halele Carol', 'Club Guesthouse', 'Nook Club',
  'OXYA Club', 'Fratelli', 'Setup Cluj', 'Quantic Club',
  'Club Eclipse', 'Baraka', 'Midi Club',
];

export default function CreatePostModal({ isOpen, onClose, onPostCreated, onOpenAuth, activeCity = 'bucuresti' }: CreatePostModalProps) {
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [caption, setCaption] = useState('');
  const [venueSearch, setVenueSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; title: string; date: string; venue: string } | null>(null);
  const [eventResults, setEventResults] = useState<{ id: string; title: string; date: string; venue: string }[]>([]);
  const [showEventSuggestions, setShowEventSuggestions] = useState(false);

  const [peopleSearch, setPeopleSearch] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [showPeopleSuggestions, setShowPeopleSuggestions] = useState(false);
  const [profileResults, setProfileResults] = useState<{ id: string; handle: string; name: string }[]>([]);

  const filteredVenues = BUCHAREST_VENUES.filter(v =>
    v.toLowerCase().includes(venueSearch.toLowerCase()) && venueSearch.length > 0
  );

  const searchProfiles = async (q: string) => {
    if (!q || q.length < 2) { setProfileResults([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(8);
    setProfileResults((data || []).map((p: { id: string; username: string; display_name: string }) => ({
      id: p.id,
      handle: `@${p.username}`,
      name: p.display_name,
    })));
  };

  const searchEvents = async (q: string) => {
    if (!q || q.length < 2) { setEventResults([]); return; }
    try {
      const { data } = await supabase
        .from('events')
        .select('id, title, start_date, venue_name')
        .ilike('title', `%${q}%`)
        .order('start_date', { ascending: true })
        .limit(6);
      setEventResults((data || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.start_date ? new Date(e.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '',
        venue: e.venue_name || '',
      })));
    } catch {
      setEventResults([]);
    }
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
    const raw = tagInput.trim().replace(/^#/, '');
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
          tags: tags.length > 0 ? tags : null,
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
      setSelectedEvent(null);
      setEventSearch('');
      setEventResults([]);
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
    setSelectedEvent(null);
    setEventSearch('');
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
          <button onClick={handleClose} className="text-noctvm-silver hover:text-white text-sm transition-colors">Cancel</button>
          <span className="text-sm font-semibold text-white">New Post</span>
          <button
            onClick={handleSubmit}
            disabled={submitting || (!caption.trim() && !imagePreview)}
            className="text-sm font-semibold text-noctvm-violet hover:text-noctvm-violet/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
            style={{ aspectRatio: imagePreview ? 'auto' : '1' }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-full rounded-xl object-contain max-h-80" />
                <button
                  onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </>
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
                  <p className="text-xs text-noctvm-silver mt-0.5">or <span className="text-noctvm-violet">browse files</span></p>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {/* Caption + user */}
          <div className="flex items-start gap-3 px-4 py-4 border-b border-noctvm-border">
            <div className="w-8 h-8 rounded-full bg-noctvm-surface border border-noctvm-border flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile?.avatar_url
                ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={profile.avatar_url} alt="My profile" className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-white">{(profile?.display_name || 'N')[0].toUpperCase()}</span>
              }
            </div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Write a caption..."
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
                    <span className="text-sm text-noctvm-violet">{selectedVenue}</span>
                    <button onClick={() => { setSelectedVenue(''); setVenueSearch(''); }} className="text-noctvm-silver hover:text-white">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Search venues..."
                    value={venueSearch}
                    onChange={e => { setVenueSearch(e.target.value); setShowVenueSuggestions(true); }}
                    onFocus={() => setShowVenueSuggestions(true)}
                    className="w-full bg-transparent text-sm text-white placeholder:text-noctvm-silver/40 outline-none text-right"
                  />
                )}
              </div>
            </div>
            {showVenueSuggestions && filteredVenues.length > 0 && !selectedVenue && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-noctvm-midnight border border-noctvm-border rounded-xl overflow-hidden z-10 shadow-xl">
                {filteredVenues.map(venue => (
                  <button
                    key={venue}
                    onClick={() => { setSelectedVenue(venue); setVenueSearch(''); setShowVenueSuggestions(false); }}
                    className="w-full px-3 py-2.5 text-sm text-white hover:bg-noctvm-surface text-left transition-colors"
                  >
                    {venue}
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
                  <button onClick={() => setTaggedUsers(prev => prev.filter(h => h !== handle))}>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="@username"
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
                  >
                    <span className="font-medium">{u.name}</span>
                    <span className="text-noctvm-silver text-xs">{u.handle}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tag an event */}
          <div className="px-4 py-3 border-b border-noctvm-border relative">
            <div className="flex items-center gap-2 flex-wrap">
              <svg className="w-4 h-4 text-noctvm-violet flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-sm text-white flex-shrink-0">Event</span>
              {selectedEvent ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-noctvm-violet/20 text-noctvm-violet text-xs border border-noctvm-violet/30">
                  <span className="font-medium max-w-[180px] truncate">{selectedEvent.title}</span>
                  {selectedEvent.date && <span className="text-noctvm-silver/70">· {selectedEvent.date}</span>}
                  <button onClick={() => { setSelectedEvent(null); setEventSearch(''); }}>
                    <svg className="w-3 h-3 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </span>
              ) : (
                <input
                  type="text"
                  placeholder="Search events…"
                  value={eventSearch}
                  onChange={e => { setEventSearch(e.target.value); searchEvents(e.target.value); setShowEventSuggestions(true); }}
                  onFocus={() => setShowEventSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowEventSuggestions(false), 150)}
                  className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder:text-noctvm-silver/40 outline-none"
                />
              )}
            </div>
            {showEventSuggestions && eventResults.length > 0 && !selectedEvent && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-noctvm-midnight border border-noctvm-border rounded-xl overflow-hidden z-10 shadow-xl">
                {eventResults.map(ev => (
                  <button
                    key={ev.id}
                    onMouseDown={() => {
                      setSelectedEvent(ev);
                      setEventSearch('');
                      setEventResults([]);
                      setShowEventSuggestions(false);
                    }}
                    className="w-full px-3 py-2.5 text-sm text-white hover:bg-noctvm-surface text-left transition-colors flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5 text-noctvm-violet flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <div className="min-w-0">
                      <span className="font-medium block truncate">{ev.title}</span>
                      {(ev.venue || ev.date) && (
                        <span className="text-noctvm-silver text-xs">{[ev.venue, ev.date].filter(Boolean).join(' · ')}</span>
                      )}
                    </div>
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
                    <button onClick={() => removeTag(tag)}>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="#tag"
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
