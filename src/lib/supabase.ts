import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const CANONICAL_PUBLIC_ORIGIN = 'https://www.noctvm.app';

export type UserSettings = {
  user_id: string;
  is_profile_private: boolean;
  likes_visibility: 'public' | 'followers' | 'none';
  comment_restrictions: 'everyone' | 'following' | 'none';
  tag_restrictions: 'everyone' | 'following' | 'none';
  show_moonray_level: boolean;
  camera_access: boolean;
  contacts_access: boolean;
  location_access: boolean;
  notif_access: boolean;
  files_access: boolean;
  notify_likes: boolean;
  notify_comments: boolean;
  notify_followers: boolean;
  notify_events: boolean;
  theme: 'light' | 'dark' | 'system';
  updated_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  city: string;
  role: 'admin' | 'owner' | 'user';
  badge: 'none' | 'owner' | 'admin' | 'gold' | 'verified';
  is_verified: boolean;
  referral_code: string | null;
  music_link: { type: string; url: string; label?: string } | null;
  social_links: { platform: string; url: string }[] | null;
  genres: string[];
  events_attended: number;
  venues_visited: number;
  created_at: string;
  updated_at: string;
  settings?: UserSettings;
};
