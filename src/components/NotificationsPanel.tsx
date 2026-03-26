'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui';
import { HeartIcon, ChatIcon, RepostIcon, UserIcon, BellIcon } from './icons';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'remix' | 'follow' | 'event_new' | 'album_new';
  actor_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  entity_id: string | null;
  actor: {
    username: string;
    avatar_url: string | null;
  };
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isOpen) return;

    const fetchNotifications = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (
            username,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data as any);
      }
      setLoading(false);
    };

    fetchNotifications();

    // Real-time subscription
    const channel = supabase
      .channel('notifications_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // Fetch full record with actor data
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isOpen]);

  const markAsRead = async (id?: string) => {
    if (!user) return;
    
    let query = supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    if (id) query = query.eq('id', id);

    const { error } = await query;
    if (!error) {
      setNotifications(prev => prev.map(n => id && n.id !== id ? n : { ...n, is_read: true }));
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like': return <HeartIcon className="w-4 h-4 text-noctvm-rose" />;
      case 'comment': return <ChatIcon className="w-4 h-4 text-noctvm-violet" />;
      case 'remix': return <RepostIcon className="w-4 h-4 text-noctvm-emerald" />;
      case 'follow': return <UserIcon className="w-4 h-4 text-blue-400" />;
      default: return <BellIcon className="w-4 h-4 text-noctvm-silver" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <BellIcon className="w-5 h-5 text-noctvm-violet" />
            <SheetTitle>Alerts</SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex flex-col flex-1 gap-4">
          <button
            onClick={() => markAsRead()}
            className="text-xs text-noctvm-silver hover:text-white transition-colors"
          >
            Mark all as read
          </button>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="w-6 h-6 border-2 border-noctvm-violet border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-noctvm-silver font-mono">Loading waves...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <BellIcon className="w-6 h-6 text-noctvm-silver/30" />
                </div>
                <p className="text-noctvm-silver text-sm">No new alerts yet.</p>
                <p className="text-xs text-noctvm-silver/50 mt-1">Check back later for interactions.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all group relative overflow-hidden ${
                    n.is_read ? 'opacity-60' : 'bg-white/[0.03] hover:bg-white/[0.05]'
                  }`}
                >
                  {!n.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-noctvm-violet shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                  )}

                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10">
                      {n.actor?.avatar_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={n.actor.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-noctvm-surface flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-noctvm-silver" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-noctvm-black border border-white/10 flex items-center justify-center shadow-lg">
                      {getIcon(n.type)}
                    </div>
                  </div>

                  <div className="flex-1 text-left">
                    <p className="text-sm text-white font-medium">
                      <span className="font-bold text-noctvm-silver group-hover:text-white transition-colors">
                        @{n.actor?.username || 'someone'}
                      </span>
                      {' '}{n.message}
                    </p>
                    <p className="text-noctvm-caption text-noctvm-silver/50 mt-1 font-mono">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-4 border-t border-white/10 bg-black/20">
            <p className="text-noctvm-caption text-center text-noctvm-silver/30 uppercase tracking-widest font-bold">
              End of Notifications
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
