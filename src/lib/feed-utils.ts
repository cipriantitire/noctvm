import type { FeedPost } from '@/types/feed';

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${hh}:${mm} ${day}/${month}/${year}`;
}

export function mapSupabasePost(row: any): FeedPost {
  const gradients = [
    'from-red-900 via-purple-950 to-black',
    'from-blue-900 via-indigo-950 to-black',
    'from-emerald-950 via-gray-950 to-black',
    'from-amber-900 via-orange-950 to-black',
    'from-fuchsia-900 via-violet-950 to-black'
  ];
  const grad = gradients[Math.abs((row.id as string).charCodeAt(0)) % gradients.length];
  return {
    id: row.id as string,
    userId: row.user_id as string | null,
    user: {
      name: (row.profiles?.display_name as string) || 'Night Owl',
      handle: `@${(row.profiles?.username as string) || 'nightowl'}`,
      avatar: ((row.profiles?.display_name as string) || 'N')[0].toUpperCase(),
      avatarUrl: (row.profiles?.avatar_url as string | null) ?? null,
      verified: !!row.profiles?.is_verified,
      badge: (row.profiles?.badge as any) || 'none',
    },
    caption: (row.caption as string) || '',
    venue: { name: (row.venue_name as string) || '', tagged: !!row.venue_name },
    tags: (row.tags as string[]) || [],
    taggedUsers: (row.tagged_users as string[]) || [],
    likes: (row.likes_count as number) || 0,
    reposts: (row.reposts_count as number) || 0,
    comments: [],
    timeAgo: timeAgo(row.created_at as string),
    createdAt: row.created_at as string,
    liked: false,
    reposted: false,
    saved: false,
    imageUrl: row.image_url,
    imageTheme: { gradient: grad, scene: '' },
    event: row.event_id ? {
      id: row.event_id,
      title: row.event_title || 'Untitled Event',
      date: row.event_date,
      venue: row.event_venue
    } : undefined
  };
}
