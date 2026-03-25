'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface LikedUser {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  is_following: boolean;
}

interface LikesModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LikesModal({ postId, isOpen, onClose }: LikesModalProps) {
  const { user } = useAuth();
  const [likes, setLikes] = useState<LikedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchLikes = async () => {
      setLoading(true);
      try {
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('user_id, profiles(id, display_name, username, avatar_url)')
          .eq('post_id', postId);
          
        if (likesError) throw likesError;
        
        const formattedLikes = await Promise.all((likesData || []).map(async (l: any) => {
          const profile = l.profiles;
          let isFollowing = false;
          
          if (user && user.id !== profile.id) {
            const { data: followData } = await supabase
              .from('follows')
              .select('id')
              .eq('follower_id', user.id)
              .eq('target_id', profile.id)
              .eq('target_type', 'user')
              .maybeSingle();
            isFollowing = !!followData;
          }
          
          return {
            id: profile.id,
            display_name: profile.display_name || 'Night Owl',
            username: profile.username || 'user',
            avatar_url: profile.avatar_url,
            is_following: isFollowing,
          };
        }));
        
        setLikes(formattedLikes);
      } catch (err) {
        console.error('Error fetching likes:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLikes();
  }, [postId, isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-viewer flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-noctvm-black border border-noctvm-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-4 border-b border-noctvm-border flex items-center justify-between">
          <h3 className="font-heading font-bold text-white text-base">Likes</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors">
             <svg className="w-5 h-5 text-noctvm-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-noctvm-violet border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-noctvm-silver">Loading likes...</p>
            </div>
          ) : likes.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-noctvm-silver">No likes yet</p>
            </div>
          ) : (
            <div className="divide-y divide-noctvm-border/50">
              {likes.map((l) => (
                <div key={l.id} className="p-3 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-noctvm-surface border border-noctvm-border overflow-hidden">
                      {l.avatar_url ? (
                        <img src={l.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-noctvm-violet/20">
                          <span className="text-sm font-bold text-noctvm-violet">{l.display_name[0]}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">{l.display_name}</p>
                      <p className="text-xs text-noctvm-silver">@{l.username}</p>
                    </div>
                  </div>
                  
                  {user && user.id !== l.id && (
                    <button className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      l.is_following 
                        ? 'bg-noctvm-surface text-white border border-noctvm-border hover:bg-noctvm-surface/70' 
                        : 'bg-noctvm-violet text-white hover:bg-noctvm-violet/90'
                    }`}>
                      {l.is_following ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
