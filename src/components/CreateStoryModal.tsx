import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getVenueLogo } from '@/lib/venue-logos';
import Image from 'next/image';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated?: () => void;
  onOpenAuth?: () => void;
}

const BUCHAREST_VENUES = [
  'Control Club', 'Expirat Halele Carol', 'Club Guesthouse', 'Nook Club',
  'OXYA Club', 'Fratelli', 'Quantic Club', 'Club Eclipse', 'Baraka', 'Midi Club',
];

export default function CreateStoryModal({ isOpen, onClose, onStoryCreated, onOpenAuth }: CreateStoryModalProps) {
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
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isClosing, setIsClosing] = useState(false);
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

  const filteredVenues = BUCHAREST_VENUES.filter(v =>
    v.toLowerCase().includes(venueSearch.toLowerCase()) && venueSearch.length > 0
  );

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
    setImageFile(file);
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
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

  const reset = () => {
    setImagePreview(null);
    setImageFile(null);
    setMediaType('image');
    setCaption('');
    setSelectedVenue('');
    setVenueSearch('');
    setTags([]);
    setTagInput('');
    setError('');
  };

  const handleClose = () => {
    reset();
    setIsClosing(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!imageFile) { setError('Add a photo for your story.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('Please sign in again to share a story.');
      }

      const formData = new FormData();
      formData.append('media', imageFile);
      formData.append('caption', caption.trim());
      formData.append('venue_name', selectedVenue);
      formData.append('expires_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
      formData.append('tags', JSON.stringify(tags));
      formData.append('event_id', selectedEvent?.id || '');
      formData.append('event_title', selectedEvent?.title || '');

      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || 'Failed to share story.'
        );
      }

      onStoryCreated?.();
      window.dispatchEvent(new Event('noctvm:story-views-updated'));
      handleClose();
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Could not reach the story upload service. Try again in a moment.');
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Failed to share story.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-noctvm-midnight border border-noctvm-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
          <p className="text-white font-semibold mb-2">Sign in to share a story</p>
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
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : ''}`}
    >
      <div
        className={`w-full max-w-lg frosted-glass-modal frosted-noise rounded-2xl overflow-hidden shadow-2xl shadow-black/80 ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
        onClick={e => e.stopPropagation()}
        onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-noctvm-border">
          <button onClick={handleClose} className="text-noctvm-silver hover:text-white text-sm transition-colors" title="Cancel story">Cancel</button>
          <span className="text-sm font-semibold text-white">New Story</span>
          <button
            onClick={handleSubmit}
            disabled={submitting || !imagePreview}
            className="text-sm font-semibold text-noctvm-violet hover:text-noctvm-violet/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Share story"
          >
            {submitting ? 'Sharing...' : 'Share'}
          </button>
        </div>

        <div className="overflow-y-auto max-h-[75vh]">
          {/* Photo upload — flexible aspect ratio, portrait recommended */}
          <div
            className={`relative mx-4 mt-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer min-h-[300px] ${
              isDragging ? 'border-noctvm-violet bg-noctvm-violet/5' : 'border-noctvm-border hover:border-noctvm-violet/40'
            } ${imagePreview ? 'border-solid border-noctvm-border' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <>
                {mediaType === 'video' ? (
                  <video src={imagePreview} className="w-full max-h-[60vh] object-contain rounded-xl" autoPlay muted playsInline loop />
                ) : (
                  <Image src={imagePreview} alt="Story preview" width={500} height={800} className="w-full max-h-[60vh] object-contain rounded-xl" unoptimized />
                )}
                <button
                  onClick={e => { e.stopPropagation(); setImagePreview(null); setImageFile(null); setMediaType('image'); }}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition-colors"
                  title="Remove media"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-noctvm-surface flex items-center justify-center">
                  {/* Story/phone icon */}
                  <svg className="w-7 h-7 text-noctvm-silver" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <path d="M12 18h.01"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">Portrait recommended · Any photo or video</p>
                  <p className="text-xs text-noctvm-silver mt-0.5">or <span className="text-noctvm-violet">browse files</span></p>
                  <p className="text-noctvm-caption text-noctvm-silver/40 mt-1">Disappears after 24 hours</p>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" title="Upload story media" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {/* User row + caption */}
          <div className="flex items-start gap-3 px-4 py-4 border-b border-noctvm-border">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-400 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              {profile?.avatar_url
                ? <Image src={profile.avatar_url} alt="My profile" fill className="object-cover" unoptimized />
                : <span className="text-xs font-bold text-white">{(profile?.display_name || 'N')[0].toUpperCase()}</span>
              }
            </div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value.slice(0, 150))}
              placeholder="Add a caption... (optional)"
              title="Story caption"
              rows={2}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-noctvm-silver/40 outline-none resize-none"
            />
            <span className="text-noctvm-micro text-noctvm-silver/30 mt-2">{caption.length}/150</span>
          </div>

          {/* Tag venue */}
          <div className="px-4 py-3 border-b border-noctvm-border relative">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">Tag Venue</span>
              <div className="flex-1 ml-4">
                {selectedVenue ? (
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm text-noctvm-violet">{selectedVenue}</span>
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
              <div className="absolute left-4 right-4 top-full mt-1 bg-noctvm-midnight border border-noctvm-border rounded-xl overflow-hidden z-10 shadow-xl">
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
                    <span className="font-medium text-xs">{e.title}</span>
                    <span className="text-noctvm-caption text-noctvm-silver">{new Date(e.date).toLocaleDateString()} • {e.venue}</span>
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
                  title="Add hashtag"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addTag(); } }}
                  className="flex-1 min-w-[80px] bg-transparent text-xs text-white placeholder:text-noctvm-silver/30 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Story duration info */}
          <div className="px-4 py-3 flex items-center gap-2 text-noctvm-silver/50">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
            </svg>
            <span className="text-xs">Your story will be visible for 24 hours</span>
          </div>

          {error && (
            <div className="mx-4 my-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
          )}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
