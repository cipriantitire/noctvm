import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  music_link: { type: string; url: string } | null;
  social_links: { platform: string; url: string }[] | null;
  genres: string[];
  events_attended: number;
  venues_visited: number;
  created_at: string;
  updated_at: string;
};
