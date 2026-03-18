export interface FeedPost {
  id: string;
  userId: string | null;
  user: {
    name: string;
    handle: string;
    avatar: string;
    avatarUrl: string | null;
    verified: boolean;
    badge: 'none' | 'owner' | 'admin' | 'gold' | 'verified';
  };
  caption: string;
  venue: { name: string; tagged: boolean };
  tags: string[];
  likes: number;
  comments: { user: string; text: string; badge: 'none' | 'owner' | 'admin' | 'gold' | 'verified' }[];
  timeAgo: string;
  createdAt: string;
  liked: boolean;
  saved: boolean;
  reposted: boolean;
  reposts: number;
  event: { id: string; title: string; date: string; venue: string } | null;
  imageTheme: { gradient: string; scene: string };
  imageUrl: string | null;
}
