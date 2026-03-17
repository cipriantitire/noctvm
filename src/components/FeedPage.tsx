'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useFeedData } from '@/hooks/useFeedData';
import { StoriesRow } from './Feed/StoriesRow';
import { FeedItem } from './Feed/FeedItem';
import ShareSheet from './ShareSheet';
import type { StoryUser, RealStory } from './StoriesViewerModal';
import type { FeedPost } from '@/types/feed';

interface FeedPageProps {
  onVenueClick: (venueName: string) => void;
  onOpenCreatePost: () => void;
  onOpenCreateStory: () => void;
  onOpenStories: (users: StoryUser[], index: number) => void;
  activeCity?: 'bucuresti' | 'constanta';
}

export default function FeedPage({ onVenueClick, onOpenCreatePost, onOpenCreateStory, onOpenStories, activeCity = 'bucuresti' }: FeedPageProps) {
  const { user, profile } = useAuth();
  const [subTab, setSubTab] = useState<'explore' | 'following' | 'friends'>('following');
  const { explorePosts, followingPosts, friendsPosts, loading, fetchExplorePosts } = useFeedData(user, activeCity);
  
  const [liveStoryUsers, setLiveStoryUsers] = useState<StoryUser[]>([]);
  const [showMyStoryDropdown, setShowMyStoryDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const myStoryBtnRef = useRef<HTMLButtonElement>(null);
  
  const [activeDotsId, setActiveDotsId] = useState<string | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [venueLogosMap, setVenueLogosMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchLogos = async () => {
      const { data } = await supabase.from('venues').select('name, logo_url');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(v => { if (v.logo_url) map[v.name] = v.logo_url; });
        setVenueLogosMap(map);
      }
    };
    fetchLogos();
  }, []);

  const toggleMyStoryDropdown = useCallback(() => {
    if (!showMyStoryDropdown && myStoryBtnRef.current) {
      const rect = myStoryBtnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    }
    setShowMyStoryDropdown(v => !v);
  }, [showMyStoryDropdown]);

  const activePosts = subTab === 'explore' ? explorePosts : subTab === 'following' ? followingPosts : subTab === 'friends' ? friendsPosts : [];

  return (
    <div className="space-y-0">
      <ShareSheet
        isOpen={!!sharePostId}
        onClose={() => setSharePostId(null)}
        postUrl={sharePostId ? `${window.location.origin}/?post=${sharePostId}` : ''}
      />

      <div className="flex justify-center gap-6 border-b border-noctvm-border mb-4">
        {['explore', 'following', 'friends'].map((sub) => (
          <button
            key={sub}
            onClick={() => setSubTab(sub as any)}
            className={`pb-3 text-[10px] font-bold uppercase tracking-[0.1em] transition-all ${
              subTab === sub ? 'text-noctvm-violet border-b-2 border-noctvm-violet' : 'text-noctvm-silver/40 hover:text-white'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      <StoriesRow 
        user={profile}
        liveStoryUsers={liveStoryUsers}
        onOpenStories={onOpenStories}
        onOpenCreateStory={onOpenCreateStory}
        showMyStoryDropdown={showMyStoryDropdown}
        setShowMyStoryDropdown={setShowMyStoryDropdown}
        dropdownPos={dropdownPos}
        myStoryBtnRef={myStoryBtnRef}
        toggleMyStoryDropdown={toggleMyStoryDropdown}
      />

      <div className="space-y-6 max-w-2xl mx-auto pb-20">
        {loading && <div className="text-center py-8"><div className="w-8 h-8 border-2 border-noctvm-violet border-t-transparent rounded-full animate-spin mx-auto" /></div>}
        
        {activePosts.map((post, idx) => (
          <FeedItem 
            key={post.id} 
            post={post} 
            idx={idx} 
            user={user}
            activeDotsId={activeDotsId}
            setActiveDotsId={setActiveDotsId}
            onVenueClick={onVenueClick}
            toggleLike={() => {}} 
            toggleSave={() => {}}
            toggleComments={() => {}}
            onShare={setSharePostId}
            onDelete={() => {}}
            venueLogosMap={venueLogosMap}
          />
        ))}

        {!loading && activePosts.length > 0 && (
          <div className="text-center py-10 opacity-30 flex flex-col items-center gap-2">
            <div className="w-12 h-px bg-current mb-2" />
            <p className="text-[10px] uppercase tracking-widest font-bold">You&apos;ve reached the end of the vibe</p>
            <p className="text-[9px]">Check back later for fresh energy</p>
          </div>
        )}

        {!loading && activePosts.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-noctvm-surface border border-noctvm-border flex items-center justify-center opacity-20">
              {subTab === 'explore' ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              ) : subTab === 'following' ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-white/60 font-bold uppercase tracking-widest text-[11px]">
                {subTab === 'explore' ? 'No new vibes discovered' : subTab === 'following' ? 'Your circle is quiet' : 'No mutual friends yet'}
              </p>
              <p className="text-noctvm-silver/40 text-[10px] max-w-[200px] mx-auto leading-relaxed">
                {subTab === 'explore' ? `We couldn't find any recent posts in ${activeCity}. Be the first to start the trend!` : 
                 subTab === 'following' ? 'Follow more people or venues to populate your feed with their latest updates.' : 
                 'Mutual connections appear here. Follow people back who follow you to start the conversation.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
