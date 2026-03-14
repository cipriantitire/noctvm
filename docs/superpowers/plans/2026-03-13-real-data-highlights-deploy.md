# Real Data, Highlights & Deploy Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all mock data, wire everything to Supabase (with Storage for images), build functional Instagram-style highlights, widen CreateStoryModal to match CreatePostModal, then deploy to Vercel.

**Architecture:** All mocks replaced with live Supabase queries. Images upload to Supabase Storage buckets (`post-media`, `story-media`) and the public URL is stored in the DB. Highlights are Supabase rows linking to real story rows. StoriesViewerModal receives a `StoryUser[]` with real `stories` arrays instead of generating mocks internally. The `onOpenStories` signature changes to `(users: StoryUser[], startIndex: number)` so any caller (Feed or Highlights) passes its own data set.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Supabase JS v2, Tailwind CSS, Vercel

---

## Files Changed

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/components/CreateHighlightModal.tsx` | Story picker + name + colour → insert `highlights` + `highlight_stories` |
| Modify | `src/components/StoriesViewerModal.tsx` | Accept real `RealStory[]` on `StoryUser`; remove mock generation |
| Modify | `src/components/FeedPage.tsx` | Query real stories + posts; remove all mocks |
| Modify | `src/components/CreatePostModal.tsx` | Upload to Storage; query real profiles for tagging |
| Modify | `src/components/CreateStoryModal.tsx` | Upload to Storage; widen to `max-w-lg`; add hashtags |
| Modify | `src/components/UserProfilePage.tsx` | Fetch/create/delete highlights from Supabase |
| Modify | `src/app/page.tsx` | Remove `FEED_STORY_USERS`; lift story data; update `onOpenStories` signature |

---

## Chunk 1: Schema + Storage

### Task 1: Run Supabase migration SQL

**No files to edit — run this SQL in Supabase Dashboard → SQL Editor.**

- [ ] **Step 1: Run migration**

```sql
-- ── highlights ─────────────────────────────────────────────────────────────
create table if not exists public.highlights (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  color        text not null default 'from-noctvm-violet to-purple-500',
  cover_url    text,          -- optional cover image (first story's image_url)
  created_at   timestamptz default now()
);

alter table public.highlights enable row level security;

create policy "highlights_select_own"  on public.highlights for select  using (auth.uid() = user_id);
create policy "highlights_insert_own"  on public.highlights for insert  with check (auth.uid() = user_id);
create policy "highlights_delete_own"  on public.highlights for delete  using (auth.uid() = user_id);

-- ── highlight_stories ──────────────────────────────────────────────────────
create table if not exists public.highlight_stories (
  highlight_id uuid references public.highlights(id) on delete cascade not null,
  story_id     uuid references public.stories(id)    on delete cascade not null,
  added_at     timestamptz default now(),
  primary key (highlight_id, story_id)
);

alter table public.highlight_stories enable row level security;

-- Anyone can read highlight_stories (so profile is public)
create policy "highlight_stories_select_all"  on public.highlight_stories for select  using (true);
-- Only the highlight owner can manage junction rows
create policy "highlight_stories_manage_own"  on public.highlight_stories for all
  using (exists (select 1 from public.highlights h where h.id = highlight_stories.highlight_id and h.user_id = auth.uid()));

-- ── stories: add RLS if not present ────────────────────────────────────────
-- Active stories visible to everyone; all stories visible to their owner
alter table public.stories enable row level security;

create policy "stories_select_public" on public.stories for select
  using (expires_at > now() or auth.uid() = user_id);

create policy "stories_insert_own" on public.stories for insert
  with check (auth.uid() = user_id);

create policy "stories_delete_own" on public.stories for delete
  using (auth.uid() = user_id);
```

- [ ] **Step 2: Create Storage buckets in Supabase Dashboard → Storage**

Create two **public** buckets:
- `post-media`
- `story-media`

Set both to **Public** (anonymous read). For each bucket under "Policies" add:
```
INSERT: (auth.uid() IS NOT NULL)
```

- [ ] **Step 3: Commit SQL for reference**

```bash
mkdir -p C:\Users\cipri\NOCTVM\supabase
```

Save the SQL above as `C:\Users\cipri\NOCTVM\supabase\migrations\20260313_highlights.sql`

```bash
git add supabase/
git commit -m "chore: add highlights schema + storage bucket notes"
```

---

## Chunk 2: StoriesViewerModal — real data types

### Task 2: Update StoryUser interface + remove mock generation

**Modify:** `src/components/StoriesViewerModal.tsx`

- [ ] **Step 1: Replace the entire file** with the version below

```tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Public types ─────────────────────────────────────────────────────────────

export interface RealStory {
  id: string;
  image_url: string | null;
  caption: string | null;
  venue_name: string | null;
  created_at: string;
}

export interface StoryUser {
  id: string;
  name: string;
  avatar: string;          // single letter fallback
  avatarUrl?: string | null;
  hasNew: boolean;
  color: string;           // Tailwind gradient, used as bg fallback
  stories: RealStory[];
}

interface StoriesViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: StoryUser[];
  startIndex: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const STORY_DURATION_MS = 5000;

export default function StoriesViewerModal({
  isOpen, onClose, users, startIndex,
}: StoriesViewerModalProps) {
  const [isClosing, setIsClosing]     = useState(false);
  const [userIndex, setUserIndex]     = useState(startIndex);
  const [storyIndex, setStoryIndex]   = useState(0);
  const [progress, setProgress]       = useState(0);

  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef  = useRef<number>(0);

  const currentUser  = users[userIndex] ?? null;
  const stories      = currentUser?.stories ?? [];
  const totalStories = stories.length;

  const handleClose = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsClosing(true);
  }, []);

  const resetProgress = () => { setProgress(0); };

  const advanceStory = useCallback(() => {
    if (storyIndex < totalStories - 1) {
      setStoryIndex(s => s + 1); resetProgress();
    } else if (userIndex < users.length - 1) {
      setUserIndex(u => u + 1); setStoryIndex(0); resetProgress();
    } else {
      handleClose();
    }
  }, [storyIndex, totalStories, userIndex, users.length, handleClose]);

  const goBack = useCallback(() => {
    if (storyIndex > 0) { setStoryIndex(s => s - 1); resetProgress(); }
    else if (userIndex > 0) { setUserIndex(u => u - 1); setStoryIndex(0); resetProgress(); }
  }, [storyIndex, userIndex]);

  useEffect(() => {
    if (isOpen) {
      setUserIndex(startIndex); setStoryIndex(0);
      setProgress(0); setIsClosing(false);
    }
  }, [isOpen, startIndex]);

  useEffect(() => {
    if (!isOpen || isClosing || !totalStories) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setProgress(0);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / STORY_DURATION_MS) * 100, 100);
      setProgress(pct);
      if (elapsed >= STORY_DURATION_MS) { clearInterval(timerRef.current!); advanceStory(); }
    }, 40);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isClosing, storyIndex, userIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      handleClose();
      else if (e.key === 'ArrowRight') advanceStory();
      else if (e.key === 'ArrowLeft')  goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose, advanceStory, goBack]);

  if (!isOpen && !isClosing) return null;
  if (!currentUser || !totalStories) return null;

  const story = stories[storyIndex] ?? stories[0];

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
    >
      {/* Background: real image or gradient fallback */}
      {story.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={story.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${currentUser.color}`} />
      )}
      <div className="absolute inset-0 bg-black/40" />

      {/* Progress bars */}
      <div className="absolute top-2 left-3 right-3 flex gap-1 z-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%' }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-7 left-0 right-0 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${currentUser.color} flex items-center justify-center text-white text-sm font-bold border-2 border-white/40 shadow-lg overflow-hidden`}>
            {currentUser.avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              : currentUser.avatar}
          </div>
          <div>
            <div className="text-white text-sm font-semibold leading-tight drop-shadow">{currentUser.name}</div>
            <div className="text-white/60 text-[10px]">{timeAgo(story.created_at)}</div>
          </div>
        </div>
        <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-white transition-colors" aria-label="Close">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Story caption */}
      {story.caption && (
        <div className="absolute bottom-0 left-0 right-0 px-6 z-20 pointer-events-none" style={{ paddingBottom: 'max(3rem, env(safe-area-inset-bottom))' }}>
          <p className="text-white text-sm text-center drop-shadow-lg">{story.caption}</p>
          {story.venue_name && <p className="text-white/60 text-xs text-center mt-1">📍 {story.venue_name}</p>}
        </div>
      )}

      {/* Tap zones */}
      <div className="absolute inset-0 flex z-10" style={{ top: '80px' }}>
        <div className="flex-1 h-full cursor-pointer select-none" onClick={goBack} />
        <div className="flex-1 h-full cursor-pointer select-none" onClick={advanceStory} />
      </div>

      {/* User nav arrows */}
      {userIndex > 0 && (
        <button onClick={e => { e.stopPropagation(); setUserIndex(u => u - 1); setStoryIndex(0); resetProgress(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
      {userIndex < users.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setUserIndex(u => u + 1); setStoryIndex(0); resetProgress(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**
```bash
npx tsc --noEmit
```
Expected: 0 errors (downstream callers will break — fix in later tasks).

---

## Chunk 3: page.tsx — lift story data, fix onOpenStories signature

### Task 3: Update page.tsx

**Modify:** `src/app/page.tsx`

The `onOpenStories` prop threading changes from `(index: number)` to `(users: StoryUser[], index: number)`.
`FEED_STORY_USERS` constant is removed.
A new state `storyUsers: StoryUser[]` holds the live feed story users, populated by FeedPage via a callback.

- [ ] **Step 1: Update imports + remove FEED_STORY_USERS**

Remove the `import type { StoryUser }` and `const FEED_STORY_USERS` lines at the top.

Re-add: `import type { StoryUser } from '@/components/StoriesViewerModal';`

- [ ] **Step 2: Add storyUsers state**

```tsx
const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
```

- [ ] **Step 3: Update showStories / storyStartIndex handler**

Replace the old `onOpenStories={(index) => { setStoryStartIndex(index); setShowStories(true); }}` call sites with:

```tsx
// Generic handler used by both FeedPage and UserProfilePage
const handleOpenStories = (users: StoryUser[], index: number) => {
  setStoryUsers(users);
  setStoryStartIndex(index);
  setShowStories(true);
};
```

- [ ] **Step 4: Pass to StoriesViewerModal**

```tsx
<StoriesViewerModal
  isOpen={showStories}
  onClose={() => setShowStories(false)}
  users={storyUsers}
  startIndex={storyStartIndex}
/>
```

- [ ] **Step 5: Update FeedPage prop**

```tsx
<FeedPage
  ...
  onOpenStories={(users, index) => handleOpenStories(users, index)}
/>
```

- [ ] **Step 6: Update UserProfilePage prop**

```tsx
<UserProfilePage
  ...
  onOpenStories={(users, index) => handleOpenStories(users, index)}
/>
```

- [ ] **Step 7: TypeScript check**
```bash
npx tsc --noEmit
```
(FeedPage + UserProfilePage will still error — fix next)

---

## Chunk 4: FeedPage — real stories + real posts

### Task 4: Remove STORY_USERS, MOCK_POSTS; query Supabase

**Modify:** `src/components/FeedPage.tsx`

The `onOpenStories` prop type changes from `(index: number)` to `(users: StoryUser[], index: number)`.
`STORY_USERS` constant replaced by `liveStoryUsers: StoryUser[]` state fetched from Supabase.
`MOCK_POSTS` removed; explore tab fetches all recent posts from `posts` table.

- [ ] **Step 1: Add import for StoryUser + RealStory**

```tsx
import type { StoryUser, RealStory } from './StoriesViewerModal';
```

- [ ] **Step 2: Remove STORY_USERS and MOCK_POSTS constants**

Delete both constants entirely.

- [ ] **Step 3: Update FeedPageProps**

```tsx
interface FeedPageProps {
  onVenueClick: (venueName: string) => void;
  onOpenCreatePost: () => void;
  onOpenCreateStory: () => void;
  onOpenStories: (users: StoryUser[], index: number) => void;
}
```

- [ ] **Step 4: Add liveStoryUsers state + loading**

```tsx
const [liveStoryUsers, setLiveStoryUsers] = useState<StoryUser[]>([]);
```

- [ ] **Step 5: Fetch active stories on mount**

```tsx
useEffect(() => {
  fetchActiveStories();
}, []);

const fetchActiveStories = async () => {
  const { data } = await supabase
    .from('stories')
    .select('id, image_url, caption, venue_name, created_at, expires_at, user_id, profiles(display_name, username, avatar_url)')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (!data) return;

  // Group by user_id
  const userMap = new Map<string, StoryUser>();
  const colors = ['from-red-500 to-orange-500', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500',
    'from-noctvm-violet to-purple-500', 'from-pink-500 to-rose-500', 'from-amber-500 to-orange-500'];
  let colorIdx = 0;

  for (const row of data) {
    const prof = row.profiles as { display_name: string; username: string; avatar_url: string | null } | null;
    const story: RealStory = {
      id: row.id,
      image_url: row.image_url,
      caption: row.caption,
      venue_name: row.venue_name,
      created_at: row.created_at,
    };
    if (!userMap.has(row.user_id)) {
      const name = prof?.display_name || prof?.username || 'User';
      userMap.set(row.user_id, {
        id: row.user_id,
        name,
        avatar: name[0].toUpperCase(),
        avatarUrl: prof?.avatar_url,
        hasNew: true,
        color: colors[colorIdx++ % colors.length],
        stories: [],
      });
    }
    userMap.get(row.user_id)!.stories.push(story);
  }

  setLiveStoryUsers(Array.from(userMap.values()));
};
```

- [ ] **Step 6: Replace explore posts init with empty + fetch on mount**

```tsx
const [explorePosts, setExplorePosts] = useState<FeedPost[]>([]);

useEffect(() => {
  fetchExplorePosts();
}, []);

const fetchExplorePosts = async () => {
  setLoadingTab(true);
  try {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(display_name, username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(40);
    setExplorePosts((data || []).map(mapSupabasePost));
  } finally {
    setLoadingTab(false);
  }
};
```

- [ ] **Step 7: Update story bubbles render to use liveStoryUsers**

Replace `{STORY_USERS.map(...)}` with:

```tsx
{liveStoryUsers.map((su, i) => (
  <div
    key={su.id}
    onClick={() => onOpenStories(liveStoryUsers, i)}
    className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
  >
    <div className={`w-16 h-16 rounded-full p-[2px] ${su.hasNew ? 'bg-gradient-to-br from-noctvm-violet via-purple-500 to-pink-500' : 'bg-noctvm-border'}`}>
      <div className={`w-full h-full rounded-full bg-gradient-to-br ${su.color} flex items-center justify-center ring-2 ring-noctvm-black overflow-hidden`}>
        {su.avatarUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={su.avatarUrl} alt="" className="w-full h-full object-cover" />
          : <span className="text-sm font-bold text-white">{su.avatar}</span>}
      </div>
    </div>
    <span className="text-[9px] text-noctvm-silver truncate max-w-[64px]">{su.name}</span>
  </div>
))}
```

- [ ] **Step 8: TypeScript check**
```bash
npx tsc --noEmit
```

- [ ] **Step 9: Commit**
```bash
git add src/components/FeedPage.tsx src/components/StoriesViewerModal.tsx src/app/page.tsx
git commit -m "feat: real stories and posts in feed — remove all mock data"
```

---

## Chunk 5: Image uploads to Supabase Storage

### Task 5: CreatePostModal — Storage upload + real user search

**Modify:** `src/components/CreatePostModal.tsx`

- [ ] **Step 1: Track the raw File alongside the preview**

```tsx
const [imageFile, setImageFile] = useState<File | null>(null);
```

Update `handleFile`:
```tsx
const handleFile = (file: File) => {
  if (!file.type.startsWith('image/')) return;
  setImageFile(file);
  const reader = new FileReader();
  reader.onload = (e) => setImagePreview(e.target?.result as string);
  reader.readAsDataURL(file);
};
```

Update clear: also `setImageFile(null)`.

- [ ] **Step 2: Remove MOCK_USERS; add profileSearch state + query**

Remove the `MOCK_USERS` constant.

Add state:
```tsx
const [profileResults, setProfileResults] = useState<{ id: string; handle: string; name: string }[]>([]);
```

Replace `filteredUsers` derived value with a search function:
```tsx
const searchProfiles = async (q: string) => {
  if (!q || q.length < 2) { setProfileResults([]); return; }
  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(8);
  setProfileResults((data || []).map(p => ({
    id: p.id,
    handle: `@${p.username}`,
    name: p.display_name,
  })));
};
```

Update `onChange` for the people search input:
```tsx
onChange={e => { setPeopleSearch(e.target.value); searchProfiles(e.target.value); setShowPeopleSuggestions(true); }}
```

Replace `filteredUsers` in the dropdown with `profileResults`.

- [ ] **Step 3: Upload image to Storage in handleSubmit**

Replace the comment `// For now, store imagePreview as image_url (data URL)` with:

```tsx
let uploadedUrl: string | null = null;
if (imageFile) {
  const ext  = imageFile.name.split('.').pop() ?? 'jpg';
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from('post-media')
    .upload(path, imageFile, { cacheControl: '3600', upsert: false });
  if (uploadErr) throw uploadErr;
  const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(path);
  uploadedUrl = publicUrl;
}
```

Pass `image_url: uploadedUrl` to the insert (remove `imagePreview` from the insert).

Also clear `setImageFile(null)` in the reset.

### Task 6: CreateStoryModal — Storage upload + widen + hashtags

**Modify:** `src/components/CreateStoryModal.tsx`

- [ ] **Step 1: Track raw File + update handleFile + reset**

Same pattern as Task 5 Step 1 but for `story-media` bucket.

- [ ] **Step 2: Widen to `max-w-lg`**

Change `max-w-sm` → `max-w-lg` in the modal container div.

- [ ] **Step 3: Change story upload area to 1:1 (same as post)**

Change `aspectRatio: '9/16', maxHeight: '280px'` → `aspectRatio: '1'` (no maxHeight override).

Keep icon as the phone/story icon.

- [ ] **Step 4: Add hashtags section (same style as CreatePostModal)**

After the Tag Venue section, add a `Hashtags` section identical to the one in CreatePostModal (tags state + tagInput + addTag fn + removeTag fn).

Include `tags` in the Supabase insert.

- [ ] **Step 5: Upload to Storage in handleSubmit**

```tsx
const ext  = imageFile!.name.split('.').pop() ?? 'jpg';
const path = `${user.id}/${Date.now()}.${ext}`;
const { error: uploadErr } = await supabase.storage
  .from('story-media')
  .upload(path, imageFile!, { cacheControl: '3600', upsert: false });
if (uploadErr) throw uploadErr;
const { data: { publicUrl } } = supabase.storage.from('story-media').getPublicUrl(path);
const imageUrl = publicUrl;
```

Pass `image_url: imageUrl` to the insert.

- [ ] **Step 6: TypeScript check**
```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**
```bash
git add src/components/CreatePostModal.tsx src/components/CreateStoryModal.tsx
git commit -m "feat: upload images to Supabase Storage; real user search in tagging"
```

---

## Chunk 6: CreateHighlightModal + UserProfilePage wired highlights

### Task 7: CreateHighlightModal component

**Create:** `src/components/CreateHighlightModal.tsx`

This modal:
1. Shows user's own stories (past + active) in a scrollable grid
2. User taps stories to select (multi-select)
3. User enters a highlight name
4. User picks a colour
5. On confirm: inserts into `highlights` then inserts selected story IDs into `highlight_stories`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { RealStory } from './StoriesViewerModal';

const HIGHLIGHT_COLORS = [
  { label: 'Violet',  value: 'from-noctvm-violet to-purple-500' },
  { label: 'Pink',    value: 'from-pink-500 to-rose-500' },
  { label: 'Cyan',    value: 'from-cyan-500 to-blue-500' },
  { label: 'Amber',   value: 'from-amber-500 to-orange-500' },
  { label: 'Emerald', value: 'from-emerald-500 to-teal-500' },
  { label: 'Red',     value: 'from-red-500 to-rose-600' },
];

interface CreateHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateHighlightModal({ isOpen, onClose, onCreated }: CreateHighlightModalProps) {
  const { user } = useAuth();
  const [isClosing, setIsClosing] = useState(false);
  const [step, setStep] = useState<'pick' | 'name'>('pick');
  const [myStories, setMyStories] = useState<RealStory[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [color, setColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) fetchMyStories();
    if (isOpen) { setStep('pick'); setSelected(new Set()); setName(''); setColor(HIGHLIGHT_COLORS[0].value); setError(''); setIsClosing(false); }
  }, [isOpen, user]);

  const fetchMyStories = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('stories')
      .select('id, image_url, caption, venue_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setMyStories(data || []);
  };

  const toggleStory = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!user || !name.trim() || selected.size === 0) return;
    setSubmitting(true);
    setError('');
    try {
      // Pick cover = first selected story's image_url
      const firstStory = myStories.find(s => selected.has(s.id));
      const { data: hl, error: hlErr } = await supabase
        .from('highlights')
        .insert({ user_id: user.id, name: name.trim(), color, cover_url: firstStory?.image_url ?? null })
        .select('id')
        .single();
      if (hlErr || !hl) throw hlErr ?? new Error('Failed to create highlight');

      const junctionRows = Array.from(selected).map(story_id => ({ highlight_id: hl.id, story_id }));
      const { error: jErr } = await supabase.from('highlight_stories').insert(junctionRows);
      if (jErr) throw jErr;

      onCreated();
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create highlight.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => setIsClosing(true);

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-lg bg-noctvm-midnight border border-noctvm-border rounded-2xl overflow-hidden ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
        onClick={e => e.stopPropagation()}
        onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-noctvm-border">
          {step === 'name' ? (
            <button onClick={() => setStep('pick')} className="text-noctvm-silver hover:text-white text-sm transition-colors">Back</button>
          ) : (
            <button onClick={handleClose} className="text-noctvm-silver hover:text-white text-sm transition-colors">Cancel</button>
          )}
          <span className="text-sm font-semibold text-white">
            {step === 'pick' ? `Select Stories (${selected.size})` : 'Name Highlight'}
          </span>
          {step === 'pick' ? (
            <button
              onClick={() => selected.size > 0 && setStep('name')}
              disabled={selected.size === 0}
              className="text-sm font-semibold text-noctvm-violet hover:text-noctvm-violet/80 disabled:opacity-40 transition-colors"
            >Next</button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={submitting || !name.trim()}
              className="text-sm font-semibold text-noctvm-violet hover:text-noctvm-violet/80 disabled:opacity-40 transition-colors"
            >{submitting ? 'Creating…' : 'Create'}</button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[75vh]">
          {step === 'pick' ? (
            myStories.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-noctvm-silver text-sm">You haven&apos;t posted any stories yet.</p>
                <p className="text-noctvm-silver/50 text-xs mt-1">Share a story first, then add it to a highlight.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5 p-0.5">
                {myStories.map(story => (
                  <button
                    key={story.id}
                    onClick={() => toggleStory(story.id)}
                    className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                      selected.has(story.id) ? 'border-noctvm-violet' : 'border-transparent'
                    }`}
                  >
                    {story.image_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={story.image_url} alt="" className="w-full h-full object-cover" />
                      : <div className={`w-full h-full bg-gradient-to-br ${HIGHLIGHT_COLORS[0].value} flex items-center justify-center`}>
                          <span className="text-white text-xs">{story.caption?.slice(0, 20)}</span>
                        </div>}
                    {selected.has(story.id) && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-noctvm-violet flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="p-4 space-y-4">
              {/* Name input */}
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && name.trim()) handleCreate(); }}
                placeholder="Highlight name…"
                maxLength={24}
                autoFocus
                className="w-full bg-noctvm-surface border border-noctvm-border rounded-xl px-4 py-3 text-sm text-white placeholder-noctvm-silver/50 focus:outline-none focus:border-noctvm-violet/50"
              />
              {/* Colour swatches */}
              <div>
                <p className="text-xs text-noctvm-silver mb-2">Cover colour</p>
                <div className="flex gap-2 flex-wrap">
                  {HIGHLIGHT_COLORS.map(c => (
                    <button key={c.value} onClick={() => setColor(c.value)} title={c.label}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.value} border-2 transition-all ${color === c.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`} />
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">{name[0]?.toUpperCase() || '?'}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{name || 'Preview'}</p>
                  <p className="text-noctvm-silver text-xs">{selected.size} {selected.size === 1 ? 'story' : 'stories'}</p>
                </div>
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Task 8: UserProfilePage — wired highlights with real Supabase data

**Modify:** `src/components/UserProfilePage.tsx`

- [ ] **Step 1: Update props**

```tsx
interface UserProfilePageProps {
  onOpenAuth: () => void;
  onSettingsClick: () => void;
  onOpenCreatePost?: () => void;
  onOpenStories?: (users: StoryUser[], startIndex: number) => void;
}
```

Add import:
```tsx
import type { StoryUser, RealStory } from './StoriesViewerModal';
```

- [ ] **Step 2: Replace local Highlight interface with Supabase-backed type**

```tsx
interface DBHighlight {
  id: string;
  name: string;
  color: string;
  cover_url: string | null;
  stories?: RealStory[];  // loaded lazily when clicked
}
```

- [ ] **Step 3: Replace local highlights state with Supabase fetch**

Remove the local `highlights`, `showNewHighlight`, `newHighlightName`, `newHighlightColor` states.
Replace with:

```tsx
const [highlights, setHighlights] = useState<DBHighlight[]>([]);
const [showCreateHighlight, setShowCreateHighlight] = useState(false);

useEffect(() => {
  if (user) fetchHighlights();
}, [user]);

const fetchHighlights = async () => {
  if (!user) return;
  const { data } = await supabase
    .from('highlights')
    .select('id, name, color, cover_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
  setHighlights(data || []);
};
```

- [ ] **Step 4: Open a highlight → fetch its stories → pass to StoriesViewer**

```tsx
const openHighlight = async (hl: DBHighlight) => {
  const { data } = await supabase
    .from('highlight_stories')
    .select('stories(id, image_url, caption, venue_name, created_at)')
    .eq('highlight_id', hl.id);

  const stories: RealStory[] = (data || [])
    .map((row: { stories: RealStory | null }) => row.stories)
    .filter(Boolean) as RealStory[];

  if (!stories.length) return;

  const storyUser: StoryUser = {
    id: hl.id,
    name: hl.name,
    avatar: hl.name[0].toUpperCase(),
    avatarUrl: hl.cover_url,
    hasNew: false,
    color: hl.color,
    stories,
  };
  onOpenStories?.([storyUser], 0);
};
```

- [ ] **Step 5: Delete highlight**

```tsx
const deleteHighlight = async (id: string, e: React.MouseEvent) => {
  e.stopPropagation();
  await supabase.from('highlights').delete().eq('id', id);
  setHighlights(prev => prev.filter(h => h.id !== id));
};
```

- [ ] **Step 6: Replace highlights section JSX**

```tsx
{/* ── Story highlights ─────────────────────────────────── */}
<div className="border-t border-noctvm-border px-4 py-4">
  <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
    {/* "New" button */}
    <button onClick={() => setShowCreateHighlight(true)}
      className="flex flex-col items-center gap-1 flex-shrink-0 focus:outline-none group">
      <div className="w-16 h-16 rounded-full bg-noctvm-surface border-2 border-dashed border-noctvm-border flex items-center justify-center group-hover:border-noctvm-violet/50 transition-colors">
        <svg className="w-6 h-6 text-noctvm-silver group-hover:text-noctvm-violet transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <span className="text-[9px] text-noctvm-silver">New</span>
    </button>

    {highlights.map(hl => (
      <button key={hl.id} onClick={() => openHighlight(hl)}
        className="flex flex-col items-center gap-1 flex-shrink-0 focus:outline-none group relative">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${hl.color} flex items-center justify-center ring-2 ring-noctvm-border group-hover:ring-noctvm-violet/50 transition-all overflow-hidden`}>
          {hl.cover_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={hl.cover_url} alt="" className="w-full h-full object-cover" />
            : <span className="text-white text-lg font-bold">{hl.name[0].toUpperCase()}</span>}
        </div>
        <span className="text-[9px] text-noctvm-silver truncate max-w-[4rem] text-center">{hl.name}</span>
        {/* Long-press / right-click delete (touch: hold 600ms) */}
        <button
          onContextMenu={e => deleteHighlight(hl.id, e)}
          onClick={e => e.stopPropagation()}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          title="Delete highlight"
        >
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </button>
    ))}
  </div>
</div>

{/* CreateHighlightModal */}
<CreateHighlightModal
  isOpen={showCreateHighlight}
  onClose={() => setShowCreateHighlight(false)}
  onCreated={() => { fetchHighlights(); setShowCreateHighlight(false); }}
/>
```

- [ ] **Step 7: Add import at top**

```tsx
import CreateHighlightModal from './CreateHighlightModal';
```

- [ ] **Step 8: TypeScript check**
```bash
npx tsc --noEmit
```

- [ ] **Step 9: Commit**
```bash
git add src/components/CreateHighlightModal.tsx src/components/UserProfilePage.tsx
git commit -m "feat: functional highlights — Supabase-backed, story picker, delete"
```

---

## Chunk 7: Final cleanup + deploy

### Task 9: TypeScript clean pass

- [ ] **Step 1: Full TypeScript check**
```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit 2>&1
```
Fix any remaining errors.

- [ ] **Step 2: Remove any remaining TODO comments referencing mock data**

```bash
grep -r "mock\|MOCK\|TODO.*real\|data URL" src/ --include="*.tsx" -l
```

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: remove all mock data — everything wired to Supabase"
```

### Task 10: Deploy to Vercel

- [ ] **Step 1: Deploy**

Use the `vercel:deploy` skill, or:
```bash
npx vercel --prod
```

Ensure env vars are set in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- [ ] **Step 2: Smoke test on production URL**

- Sign up / sign in
- Create a post with photo
- Create a story with photo
- Create a highlight from the story
- View highlights on profile
- View feed stories from another account

- [ ] **Step 3: Final commit**
```bash
git add -A && git commit -m "chore: production deploy verified"
```
