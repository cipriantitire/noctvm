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

      <div className="space-y-6 max-w-2xl mx-auto">
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

        {!loading && activePosts.length === 0 && (
          <div className="text-center py-16 opacity-50 text-sm">No posts found in {activeCity}</div>
        )}
      </div>
    </div>
  );
}
