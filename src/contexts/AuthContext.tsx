'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isOwner: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, user?: User) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      const p = data as Profile;
      
      // Auto-verify Google users
      const isGoogle = user?.app_metadata?.provider === 'google' || 
                       user?.app_metadata?.providers?.includes('google') ||
                       user?.identities?.some(id => id.provider === 'google');

      if (!p.is_verified && isGoogle) {
        await supabase.from('profiles').update({ is_verified: true }).eq('id', userId);
        p.is_verified = true;
      }
      setProfile(p);
    }
  }, []);

  useEffect(() => {
    // ── DEV BYPASS ──────────────────────────────────────────────────────────
    // Allow mocking a user via ?dev=true on localhost
    const isLocal = typeof window !== 'undefined' && 
                   (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const params = new URLSearchParams(window.location.search);
    
    if (isLocal && params.get('dev') === 'true') {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'dev@noctvm.com',
        app_metadata: { provider: 'google' },
        user_metadata: { full_name: 'Dev Admin' }
      } as any as User;

      const mockProfile: Profile = {
        id: mockUser.id,
        display_name: 'Night Owl Dev',
        username: 'nightowl_dev',
        email: mockUser.email!,
        avatar_url: null,
        bio: 'Developer mode active. Verifying Saved Events and Profile Sidebar.',
        city: 'Bucharest',
        role: 'admin',
        badge: 'verified',
        is_verified: true,
        referral_code: 'DEVMOON',
        music_link: { type: 'soundcloud', url: 'https://soundcloud.com/nightowldev', label: 'Night Owl - Void Set' },
        social_links: [
          { platform: 'website', url: 'https://nightowldev.github.io' },
          { platform: 'instagram', url: 'https://instagram.com/nightowldev' },
        ],
        genres: ['Electronic', 'Techno'],
        events_attended: 42,
        venues_visited: 13,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setUser(mockUser);
      setProfile(mockProfile);
      setLoading(false);
      return;
    }
    // ────────────────────────────────────────────────────────────────────────

    // Restore existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user);
      setLoading(false);
    });

    // Listen for auth changes (login, logout, OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id, session.user);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id, user);
  }, [user, fetchProfile]);

  const isAdmin = profile?.role === 'admin';
  const isOwner = profile?.role === 'owner';

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isAdmin, isOwner, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
