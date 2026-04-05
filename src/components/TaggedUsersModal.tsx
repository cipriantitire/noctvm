'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { getUserFollowState, setUserFollowState } from '@/lib/userFollow';

interface TaggedUser {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  is_following: boolean;
}

interface TaggedUsersModalProps {
  handles: string[]; // e.g., ["@cipri", "@user2"]
  isOpen: boolean;
  onClose: () => void;
}

export default function TaggedUsersModal({ handles, isOpen, onClose }: TaggedUsersModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<TaggedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizeHandle = useCallback((value: string) => value.replace(/^@/, '').trim(), []);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const cleanHandles = handles.map(h => normalizeHandle(h));
        if (cleanHandles.length === 0) {
          setUsers([]);
          return;
        }

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .in('username', cleanHandles);
          
        if (profilesError) throw profilesError;
        
        const formattedUsers = await Promise.all((profilesData || []).map(async (profile: any) => {
          let isFollowing = false;
          
          if (user && user.id !== profile.id) {
            isFollowing = await getUserFollowState(user.id, profile.id);
          }
          
          return {
            id: profile.id,
            display_name: profile.display_name || 'Night Owl',
            username: normalizeHandle(profile.username || profile.display_name || 'user'),
            avatar_url: profile.avatar_url,
            is_following: isFollowing,
          };
        }));
        
        setUsers(formattedUsers);
      } catch (err) {
        console.error('Error fetching tagged users:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [handles, isOpen, normalizeHandle, user]);

  const handleToggleFollow = useCallback(async (taggedUser: TaggedUser) => {
    if (!user || user.id === taggedUser.id) return;

    const nextIsFollowing = !taggedUser.is_following;
    setUsers(prev => prev.map((entry) => (
      entry.id === taggedUser.id
        ? { ...entry, is_following: nextIsFollowing }
        : entry
    )));

    try {
      await setUserFollowState(user.id, taggedUser.id, nextIsFollowing);
    } catch (error) {
      console.error('Error toggling tagged follow:', error);
      setUsers(prev => prev.map((entry) => (
        entry.id === taggedUser.id
          ? { ...entry, is_following: taggedUser.is_following }
          : entry
      )));
    }
  }, [user]);

  const openProfile = useCallback((handle: string) => {
    const normalizedHandle = handle.replace(/^@/, '').trim();
    onClose();
    void router.push(`/@${encodeURIComponent(normalizedHandle)}`);
  }, [onClose, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-viewer flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-noctvm-black border border-noctvm-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-4 border-b border-noctvm-border flex items-center justify-between">
          <h3 className="font-heading font-bold text-white text-base">Tagged People</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors" title="Close">
             <svg className="w-5 h-5 text-noctvm-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-noctvm-violet border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-noctvm-silver">Loading people...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-noctvm-silver">Nobody is tagged here</p>
            </div>
          ) : (
            <div className="divide-y divide-noctvm-border/50">
              {users.map((u) => (
                <div key={u.id} className="group flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openProfile(normalizeHandle(u.username) || normalizeHandle(u.display_name) || u.id)}
                      className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-noctvm-border bg-noctvm-surface transition-transform hover:scale-[1.02]"
                      aria-label={`Open ${u.display_name}'s profile`}
                      title={`Open ${u.display_name}'s profile`}
                    >
                      {u.avatar_url ? (
                        <Image src={u.avatar_url} alt={u.display_name} fill className="object-cover" unoptimized sizes="40px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-noctvm-violet/20">
                          <span className="text-sm font-bold text-noctvm-violet">{(u.display_name?.[0] || u.username?.[0] || 'N').toUpperCase()}</span>
                        </div>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => openProfile(normalizeHandle(u.username) || normalizeHandle(u.display_name) || u.id)}
                        className="block min-w-0 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-noctvm-violet/60"
                        aria-label={`Open ${u.display_name}'s profile`}
                        title={`Open ${u.display_name}'s profile`}
                      >
                        <p className="truncate text-sm font-semibold leading-tight text-white">{u.display_name}</p>
                        <p className="truncate text-xs text-noctvm-silver">@{normalizeHandle(u.username)}</p>
                      </button>
                    </div>
                  </div>
                  
                  {user && user.id !== u.id && (
                    <button
                      type="button"
                      onClick={() => void handleToggleFollow(u)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      u.is_following 
                        ? 'bg-noctvm-surface text-white border border-noctvm-border hover:bg-noctvm-surface/70' 
                        : 'bg-noctvm-violet text-white hover:bg-noctvm-violet/90'
                    }`}
                    >
                      {u.is_following ? 'Following' : 'Follow'}
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
