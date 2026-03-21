'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getVenueLogo } from '@/lib/venue-logos';
import type { FeedPost } from '@/types/feed';

interface EditPostModalProps {
  post: FeedPost;
  isOpen: boolean;
  onClose: () => void;
  activeCity?: 'bucuresti' | 'constanta';
}

export default function EditPostModal({ post, isOpen, onClose, activeCity = 'bucuresti' }: EditPostModalProps) {
  const { user, profile } = useAuth();
  
  const [isClosing, setIsClosing] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  const [caption, setCaption] = useState('');
  const [venueSearch, setVenueSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(post.tags?.map(t => t.replace(/#/g, '')) || []);
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

  // Fetch full DB state
  useEffect(() => {
    if (!isOpen) return;
    const fetchPost = async () => {
      setLoadingInitial(true);
      const { data } = await supabase.from('posts').select('*').eq('id', post.id).single();
      if (data) {
        setCaption(data.caption || '');
        setSelectedVenue(data.venue_name || '');
        setTags(data.tags || []);
        setTaggedUsers(data.tagged_users || []);
        if (data.event_id) {
           setSelectedEvent({ id: data.event_id, title: data.event_title || '', date: data.event_date || '', venue: data.event_venue || '' });
        }
      }
      setLoadingInitial(false);
    };
    fetchPost();
  }, [isOpen, post.id]);

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

  const addTag = () => {
    const raw = tagInput.trim().replace(/#/g, '');
    if (raw && !tags.includes(raw) && tags.length < 10) {
      setTags(prev => [...prev, raw]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const handleSubmit = async () => {
    if (!user) return;
    
    // Auto-append pending hashtag if they didn't hit enter
    let currentTags = tags;
    if (tagInput.trim()) {
      const raw = tagInput.trim().replace(/#/g, '');
      if (raw && !currentTags.includes(raw) && currentTags.length < 10) {
        currentTags = [...currentTags, raw];
        setTags(currentTags);
      }
    }
    
    setSubmitting(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          caption: caption.trim(),
          venue_name: selectedVenue || null,
          tags: currentTags.length > 0 ? currentTags : null,
          tagged_users: taggedUsers.length > 0 ? taggedUsers : null,
          event_id: selectedEvent?.id || null,
          event_title: selectedEvent?.title || null,
          event_date: selectedEvent?.date || null,
          event_venue: selectedEvent?.venue || null,
        })
        .eq('id', post.id);

      if (updateError) throw updateError;
      
      onClose();
      // Temporary solution until we add global state mutation: reload the page to show latest updates
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to update post.');
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
        className={`w-full max-w-lg frosted-glass-modal frosted-noise rounded-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col max-h-[90vh] ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
        onClick={e => e.stopPropagation()}
        onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-noctvm-border flex-shrink-0">
          <button onClick={handleClose} className="text-noctvm-silver hover:text-white text-sm transition-colors" title="Cancel edit">Cancel</button>
          <span className="text-sm font-semibold text-white">Edit Post</span>
          <button
            onClick={handleSubmit}
            disabled={submitting || loadingInitial}
            className="text-sm font-semibold text-noctvm-violet hover:text-noctvm-violet/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Save changes"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {loadingInitial ? (
             <div className="flex justify-center py-12">
               <div className="w-6 h-6 border-2 border-noctvm-violet border-t-transparent rounded-full animate-spin" />
             </div>
          ) : (
            <>
              {/* Display existing Image - NEVER editable, exactly as requested */}
              <div className="relative mx-4 mt-4 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center bg-black/50">
                {post.imageUrl ? (
                  <Image src={post.imageUrl} alt="Post media" width={500} height={500} className="w-full h-auto max-h-[300px] object-contain" unoptimized />
                ) : (
                   <div className={`w-full h-[200px] bg-gradient-to-br ${post.imageTheme?.gradient} flex items-center justify-center`}>
                      <span className="text-white/50 text-xs tracking-widest uppercase font-black">Text Post</span>
                   </div>
                )}
              </div>

              {/* Caption + user */}
              <div className="flex items-start gap-3 px-4 py-4 border-b border-noctvm-border mt-2">
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
                  <span className="text-sm text-white font-medium">Tag Venue</span>
                  <div className="flex-1 ml-4">
                    {selectedVenue ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm text-noctvm-violet font-bold">{selectedVenue}</span>
                        <button onClick={() => { setSelectedVenue(''); setVenueSearch(''); }} className="text-noctvm-silver hover:text-white transition-colors" title="Remove venue">
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
                  <span className="text-sm text-white font-medium">Tag Event</span>
                  <div className="flex-1 ml-4">
                    {selectedEvent ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm text-noctvm-emerald font-bold">{selectedEvent.title}</span>
                        <button onClick={() => { setSelectedEvent(null); setEventSearch(''); }} className="text-noctvm-silver hover:text-white transition-colors" title="Remove event">
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
                  <span className="text-sm text-white flex-shrink-0 font-medium">Tag People</span>
                  {taggedUsers.map(handle => (
                    <span key={handle} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-noctvm-violet/20 text-noctvm-violet text-xs border border-noctvm-violet/20">
                      {handle}
                      <button onClick={() => setTaggedUsers(prev => prev.filter(h => h !== handle))} title={`Remove ${handle}`} className="hover:text-white">
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
                  <span className="text-sm text-white flex-shrink-0 font-medium">Tags</span>
                  <div className="flex-1 flex flex-wrap items-center gap-1.5">
                    {tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-noctvm-violet/20 text-noctvm-violet text-xs">
                        {tag}
                        <button onClick={() => removeTag(tag)} title={`Remove tag ${tag}`} className="hover:text-white">
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
                <div className="mx-4 my-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
                  {error}
                </div>
              )}

              <div className="h-6" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
