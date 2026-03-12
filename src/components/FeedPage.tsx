'use client';

import { useState } from 'react';
import { HeartIcon, ChatIcon, ShareIcon, BookmarkIcon } from './icons';
import { getVenueLogo, getVenueColor } from '@/lib/venue-logos';

interface FeedPost {
  id: string;
  user: { name: string; handle: string; avatar: string; verified: boolean };
  caption: string;
  venue: { name: string; tagged: boolean };
  tags: string[];
  likes: number;
  comments: { user: string; text: string }[];
  timeAgo: string;
  liked: boolean;
  saved: boolean;
  // Visual theming for mock photo placeholder
  imageTheme: { gradient: string; scene: string; emoji: string };
}

const MOCK_POSTS: FeedPost[] = [
  {
    id: '1',
    user: { name: 'Alexandra M.', handle: '@alexm_buc', avatar: 'A', verified: true },
    caption: 'Best techno night in months. The sound system at Control is unmatched. Three hours of pure underground bliss.',
    venue: { name: 'Control Club', tagged: true },
    tags: ['#techno', '#nightlife', '#bucharest', '#underground'],
    likes: 234,
    comments: [
      { user: 'dj_raven', text: 'That set was insane! The last hour was pure fire' },
      { user: 'maria.dance', text: 'wish I was there omg' },
      { user: 'night.owl', text: 'Control never disappoints, best sound in the city' },
    ],
    timeAgo: '2h',
    liked: false,
    saved: false,
    imageTheme: { gradient: 'from-red-900 via-purple-950 to-black', scene: 'Strobe lights cutting through fog over a packed dancefloor', emoji: '' },
  },
  {
    id: '2',
    user: { name: 'Mihai D.', handle: '@mihai.deep', avatar: 'M', verified: false },
    caption: 'Friday vibes at Nook. House music and good people. What more do you need? DJ kept the energy perfect all night.',
    venue: { name: 'Nook Club', tagged: true },
    tags: ['#house', '#fridaynight', '#nookclub', '#deephouse'],
    likes: 128,
    comments: [
      { user: 'elena.groove', text: 'The DJ was amazing! Do you know who played?' },
      { user: 'andrei_buc', text: 'Next Friday again? Im in' },
    ],
    timeAgo: '5h',
    liked: true,
    saved: false,
    imageTheme: { gradient: 'from-blue-900 via-indigo-950 to-black', scene: 'Warm amber lights over an intimate bar scene', emoji: '' },
  },
  {
    id: '3',
    user: { name: 'Ioana R.', handle: '@ioana.rave', avatar: 'I', verified: true },
    caption: 'Expirat never fails. That industrial vibe with the underground sound... pure magic. The concrete walls were literally shaking.',
    venue: { name: 'Expirat Halele Carol', tagged: true },
    tags: ['#underground', '#rave', '#expirat', '#halelecarol'],
    likes: 456,
    comments: [
      { user: 'techno.kid', text: 'Best venue in the city hands down' },
      { user: 'dark_bass', text: 'Those visuals were next level, who did the VJ set?' },
      { user: 'radu.night', text: 'See you next week! Cant miss the Recondite show' },
      { user: 'ana.dance', text: 'Legendary night, my ears are still ringing' },
    ],
    timeAgo: '8h',
    liked: false,
    saved: true,
    imageTheme: { gradient: 'from-emerald-950 via-gray-950 to-black', scene: 'Raw concrete hall with green lasers slicing through haze', emoji: '' },
  },
  {
    id: '4',
    user: { name: 'Stefan V.', handle: '@stef.vinyl', avatar: 'S', verified: false },
    caption: 'Guesthouse with the crew. Multi-room setup means you always find your vibe. Started in the disco room, ended up at the techno floor at 5am.',
    venue: { name: 'Club Guesthouse', tagged: true },
    tags: ['#clubbing', '#crew', '#guesthouse', '#vinyl'],
    likes: 89,
    comments: [
      { user: 'liviu.bass', text: 'Room 2 was fire, that vinyl-only set was chef kiss' },
    ],
    timeAgo: '12h',
    liked: false,
    saved: false,
    imageTheme: { gradient: 'from-amber-900 via-orange-950 to-black', scene: 'Cozy multi-room club with warm lights spilling between doorways', emoji: '' },
  },
  {
    id: '5',
    user: { name: 'Catalina P.', handle: '@cat.party', avatar: 'C', verified: true },
    caption: 'Opening night was everything. New sound system, new lighting rig, same incredible energy. OXYA is about to become everyones favorite.',
    venue: { name: 'OXYA Club', tagged: true },
    tags: ['#opening', '#newclub', '#bucharest', '#oxya'],
    likes: 312,
    comments: [
      { user: 'night.rider', text: 'Cant wait to go back, when is the next event?' },
      { user: 'diana.groove', text: 'The LED walls were insane, felt like being inside a music video' },
    ],
    timeAgo: '1d',
    liked: true,
    saved: false,
    imageTheme: { gradient: 'from-fuchsia-900 via-violet-950 to-black', scene: 'Futuristic LED panels pulsing with color over a euphoric crowd', emoji: '' },
  },
];

const AVATAR_COLORS = ['from-red-500 to-orange-500', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500', 'from-noctvm-violet to-purple-500', 'from-pink-500 to-rose-500'];

const STORY_USERS = [
  { name: 'Alexandra', avatar: 'A', hasNew: true },
  { name: 'Mihai', avatar: 'M', hasNew: true },
  { name: 'Ioana', avatar: 'I', hasNew: true },
  { name: 'Stefan', avatar: 'S', hasNew: false },
  { name: 'Catalina', avatar: 'C', hasNew: true },
  { name: 'Andrei', avatar: 'R', hasNew: false },
  { name: 'Diana', avatar: 'D', hasNew: true },
];

interface FeedPageProps {
  onVenueClick: (venueName: string) => void;
}

export default function FeedPage({ onVenueClick }: FeedPageProps) {
  const [subTab, setSubTab] = useState<'following' | 'explore' | 'friends'>('explore');
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const toggleLike = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const toggleSave = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p));
  };

  const toggleComments = (id: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-0">
      {/* Sub-tabs - CENTERED */}
      <div className="flex justify-center gap-6 border-b border-noctvm-border mb-4">
        {(['following', 'explore', 'friends'] as const).map((sub) => (
          <button
            key={sub}
            onClick={() => setSubTab(sub)}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              subTab === sub
                ? 'text-noctvm-violet border-b-2 border-noctvm-violet'
                : 'text-noctvm-silver hover:text-white'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Stories row - CENTERED */}
      <div className="flex justify-center mb-4">
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-2 py-3">
          {/* Add story */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-noctvm-surface border-2 border-dashed border-noctvm-border flex items-center justify-center">
              <svg className="w-6 h-6 text-noctvm-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </div>
            <span className="text-[9px] text-noctvm-silver">Your story</span>
          </div>
          {STORY_USERS.map((user, i) => (
            <div key={user.name} className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer">
              <div className={`w-16 h-16 rounded-full p-[2px] ${user.hasNew ? 'bg-gradient-to-br from-noctvm-violet via-purple-500 to-pink-500' : 'bg-noctvm-border'}`}>
                <div className={`w-full h-full rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center ring-2 ring-noctvm-black`}>
                  <span className="text-sm font-bold text-white">{user.avatar}</span>
                </div>
              </div>
              <span className="text-[9px] text-noctvm-silver truncate max-w-[64px]">{user.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6 max-w-2xl mx-auto">
        {posts.map((post, idx) => (
          <article key={post.id} className="bg-noctvm-surface rounded-xl border border-noctvm-border overflow-hidden animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
            {/* Post header */}
            <div className="flex items-center gap-3 p-3">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center flex-shrink-0`}>
                <span className="text-xs font-bold text-white">{post.user.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-white">{post.user.name}</span>
                  {post.user.verified && (
                    <svg className="w-3.5 h-3.5 text-noctvm-violet" viewBox="0 0 24 24" fill="currentColor"><path d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" /></svg>
                  )}
                </div>
                <span className="text-[10px] text-noctvm-silver">{post.user.handle}</span>
              </div>
              <span className="text-[10px] text-noctvm-silver font-mono">{post.timeAgo}</span>
              <button className="text-noctvm-silver hover:text-white p-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
              </button>
            </div>

            {/* Post image - themed gradient with scene description */}
            <div className={`aspect-square bg-gradient-to-br ${post.imageTheme.gradient} flex items-center justify-center relative overflow-hidden`}>
              {/* Atmospheric overlay elements */}
              <div className="absolute inset-0">
                {/* Fake light beams */}
                <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-white/5 via-white/10 to-transparent rotate-12"></div>
                <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-white/5 via-white/8 to-transparent -rotate-6"></div>
                {/* Corner glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/5 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-white/3 blur-3xl"></div>
                {/* Horizontal haze band */}
                <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              </div>
              {/* Scene description */}
              <div className="relative text-center px-8">
                <p className="text-sm text-white/25 font-medium leading-relaxed italic">{post.imageTheme.scene}</p>
              </div>
              {/* Venue tag overlay */}
              {post.venue.tagged && (
                <button
                  onClick={() => onVenueClick(post.venue.name)}
                  className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 hover:border-noctvm-violet/50 transition-all group hover:bg-black/80"
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 bg-noctvm-midnight flex items-center justify-center">
                    <img src={getVenueLogo(post.venue.name)} alt="" className="w-full h-full object-cover" 
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = 'none';
                        el.parentElement!.querySelector('.fallback')?.classList.remove('hidden');
                      }}
                    />
                    <span className={`fallback hidden text-[8px] font-bold bg-gradient-to-br ${getVenueColor(post.venue.name)} bg-clip-text text-transparent`}>
                      {post.venue.name[0]}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-white group-hover:text-noctvm-violet transition-colors">{post.venue.name}</span>
                </button>
              )}
            </div>

            {/* Actions bar */}
            <div className="px-3 pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleLike(post.id)} className="hover:scale-110 active:animate-micro-pop transition-transform">
                    {post.liked ? (
                      <svg className="w-6 h-6 text-red-500 animate-micro-pop" viewBox="0 0 24 24" fill="currentColor"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                    ) : (
                      <HeartIcon className="w-6 h-6 text-noctvm-silver hover:text-red-400 transition-colors" />
                    )}
                  </button>
                  <button onClick={() => toggleComments(post.id)} className="hover:scale-110 transition-transform">
                    <ChatIcon className="w-6 h-6 text-noctvm-silver hover:text-white transition-colors" />
                  </button>
                  <button className="hover:scale-110 transition-transform">
                    <ShareIcon className="w-6 h-6 text-noctvm-silver hover:text-white transition-colors" />
                  </button>
                </div>
                <button onClick={() => toggleSave(post.id)} className="hover:scale-110 active:animate-micro-pop transition-transform">
                  {post.saved ? (
                    <svg className="w-6 h-6 text-noctvm-gold animate-micro-pop" viewBox="0 0 24 24" fill="currentColor"><path d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" /></svg>
                  ) : (
                    <BookmarkIcon className="w-6 h-6 text-noctvm-silver hover:text-noctvm-gold transition-colors" />
                  )}
                </button>
              </div>

              {/* Likes */}
              <p className="text-xs font-semibold text-white mb-1">{post.likes.toLocaleString()} likes</p>

              {/* Caption */}
              <p className="text-xs text-noctvm-silver leading-relaxed mb-1">
                <span className="font-semibold text-white mr-1">{post.user.name}</span>
                {post.caption}
              </p>

              {/* Venue + tags */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {post.venue.tagged && (
                  <button
                    onClick={() => onVenueClick(post.venue.name)}
                    className="text-[10px] text-noctvm-violet hover:text-noctvm-violet/80 font-medium transition-colors"
                  >
                    @{post.venue.name}
                  </button>
                )}
                {post.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-noctvm-violet/60">{tag}</span>
                ))}
              </div>

              {/* Comments */}
              {post.comments.length > 0 && (
                <div className="pb-3">
                  {!expandedComments.has(post.id) && post.comments.length > 2 && (
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="text-[11px] text-noctvm-silver/60 hover:text-noctvm-silver mb-1 transition-colors"
                    >
                      View all {post.comments.length} comments
                    </button>
                  )}
                  <div className="space-y-1">
                    {(expandedComments.has(post.id) ? post.comments : post.comments.slice(0, 2)).map((c, ci) => (
                      <p key={ci} className="text-[11px] text-noctvm-silver">
                        <span className="font-semibold text-white mr-1">{c.user}</span>
                        {c.text}
                      </p>
                    ))}
                  </div>
                  {/* Comment input */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-noctvm-border">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] font-bold text-white">N</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="flex-1 bg-transparent text-[11px] text-noctvm-silver placeholder:text-noctvm-silver/30 outline-none"
                    />
                    <button className="text-[10px] text-noctvm-violet font-semibold hover:text-noctvm-violet/80 transition-colors">Post</button>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
