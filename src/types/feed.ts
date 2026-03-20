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
    isFollowing?: boolean;
  };
  caption: string;
  venue: { name: string; tagged: boolean };
  tags: string[];
  likes: number;
  reposts: number;
  comments: { user: string; text: string; badge: 'none' | 'owner' | 'admin' | 'gold' | 'verified' }[];
  timeAgo: string;
  createdAt: string;
  liked: boolean;
  reposted: boolean;
  saved: boolean;
  imageTheme: { gradient: string; scene: string };
  imageUrl: string | null;
  event?: {
    id: string;
    title: string;
    date: string | null;
    venue: string | null;
  };
}
