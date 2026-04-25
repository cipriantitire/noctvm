'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet';

interface LikedUser {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  is_following: boolean;
}

interface LikesSheetProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LikesSheet({ postId, isOpen, onClose }: LikesSheetProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [likes, setLikes] = useState<LikedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});

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

  const handleToggleFollow = useCallback(async (likedUser: LikedUser) => {
    if (!user || user.id === likedUser.id) return;

    const nextIsFollowing = !likedUser.is_following;
    setUpdatingIds(prev => ({ ...prev, [likedUser.id]: true }));

    setLikes(prev => prev.map((entry) => (
      entry.id === likedUser.id
        ? { ...entry, is_following: nextIsFollowing }
        : entry
    )));

    try {
      if (likedUser.is_following) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('target_id', likedUser.id)
          .eq('target_type', 'user');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            target_id: likedUser.id,
            target_type: 'user',
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setLikes(prev => prev.map((entry) => (
        entry.id === likedUser.id
          ? { ...entry, is_following: likedUser.is_following }
          : entry
      )));
    } finally {
      setUpdatingIds(prev => {
        const next = { ...prev };
        delete next[likedUser.id];
        return next;
      });
    }
  }, [user]);

  const getProfileHref = useCallback((username: string, displayName: string) => {
    const handle = (username || displayName || 'user').replace(/^@/, '').trim();
    return `/@${encodeURIComponent(handle)}`;
  }, []);

  const handleOpenProfile = useCallback((username: string, displayName: string) => {
    onClose();
    router.push(getProfileHref(username, displayName));
  }, [getProfileHref, onClose, router]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="h-[70vh] bg-noctvm-black border-noctvm-border p-0">
        <SheetHeader className="p-4 border-b border-noctvm-border">
          <SheetTitle className="font-heading font-bold text-base">Likes</SheetTitle>
        </SheetHeader>
        
        <div className="overflow-y-auto custom-scrollbar flex-1">
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
                  <button
                    type="button"
                    onClick={() => handleOpenProfile(l.username, l.display_name)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    title={`View ${l.display_name}'s profile`}
                  >
                    <div className="w-10 h-10 rounded-full bg-noctvm-surface border border-noctvm-border overflow-hidden shrink-0">
                      {l.avatar_url ? (
                        <img src={l.avatar_url} alt={l.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(l.username || l.display_name)}`}
                          alt={l.display_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold leading-tight text-foreground hover:text-noctvm-violet transition-colors">{l.display_name}</p>
                      <p className="truncate text-xs text-noctvm-silver">@{l.username}</p>
                    </div>
                  </button>
                  
                  {user && user.id !== l.id && (
                    <button
                      type="button"
                      onClick={() => void handleToggleFollow(l)}
                      disabled={!!updatingIds[l.id]}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${
                        l.is_following 
                          ? 'bg-noctvm-surface text-foreground border border-noctvm-border hover:bg-noctvm-surface/70' 
                          : 'bg-noctvm-violet text-foreground hover:bg-noctvm-violet/90'
                      }`}
                    >
                      {updatingIds[l.id] ? '...' : (l.is_following ? 'Following' : 'Follow')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
