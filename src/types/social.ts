export interface SocialPost {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string | null;
  venue_name: string | null;
  tags: string[] | null;
  tagged_users: string[] | null;
  city: string | null;
  likes_count: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface SocialPostComment {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string | null;
}

export interface SocialPostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}
