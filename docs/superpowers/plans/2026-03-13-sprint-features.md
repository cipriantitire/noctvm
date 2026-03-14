# NOCTVM Sprint Features Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 14 UI/feature improvements across events, venues, profile, stories, and data layers.

**Architecture:** Pure client-side React component edits + one new Supabase migration + one new component. No new API routes needed. Real-time via Supabase channel subscriptions on the client.

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS, Supabase JS client, TypeScript.

---

## Chunk 1: Navigation + Genre Filter + Back Buttons

### Task 1: Reorder sidebar and bottom nav (Events → Venues → Feed → Wallet)

**Files:**
- Modify: `src/components/Sidebar.tsx:8-12`
- Modify: `src/components/BottomNav.tsx:8-12`

- [ ] **Step 1: Reorder `NAV_ITEMS` in Sidebar.tsx**

In `Sidebar.tsx`, change:
```ts
const NAV_ITEMS = [
  { icon: EventsIcon, label: 'Events', tab: 'events' },
  { icon: VenuesIcon, label: 'Venues', tab: 'venues' },
  { icon: FeedIcon,   label: 'Feed',   tab: 'feed' },
  { icon: WalletIcon, label: 'Wallet', tab: 'wallet' },
];
```

- [ ] **Step 2: Reorder `BASE_NAV` in BottomNav.tsx**

In `BottomNav.tsx`, change:
```ts
const BASE_NAV = [
  { icon: EventsIcon, label: 'Events',  tab: 'events' },
  { icon: VenuesIcon, label: 'Venues',  tab: 'venues' },
  { icon: FeedIcon,   label: 'Feed',    tab: 'feed' },
  { icon: WalletIcon, label: 'Wallet',  tab: 'wallet' },
];
```

- [ ] **Step 3: Verify** — Start dev server, confirm tab order in both sidebar (desktop) and bottom nav (mobile).

- [ ] **Step 4: Commit**
```bash
git add src/components/Sidebar.tsx src/components/BottomNav.tsx
git commit -m "fix: reorder tabs to Events, Venues, Feed, Wallet"
```

---

### Task 2: Genre selector — flex-wrap (2 lines, no scroll)

**Files:**
- Modify: `src/components/FilterBar.tsx:98`

- [ ] **Step 1: Change genre pill container**

In `FilterBar.tsx`, find:
```tsx
<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
```
Replace with:
```tsx
<div className="flex flex-wrap gap-2 pb-1">
```

- [ ] **Step 2: Verify** — On desktop, genre pills should wrap to a second line instead of scrolling horizontally.

- [ ] **Step 3: Commit**
```bash
git add src/components/FilterBar.tsx
git commit -m "fix: genre pills flex-wrap instead of horizontal scroll"
```

---

### Task 3: Replace text Back buttons with circle `<` icon buttons

**Files:**
- Modify: `src/components/ProfilePages.tsx:8-13`
- Modify: `src/app/page.tsx` (account-menu back button ~line 439)
- Modify: `src/components/VenuePage.tsx`

The circle back button style matches the X close button used in modals:
```tsx
// Reusable style: w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10
// flex items-center justify-center text-noctvm-silver hover:text-white hover:bg-black/80 transition-all
```

- [ ] **Step 1: Replace `BackButton` component in `ProfilePages.tsx`**

Find the existing `BackButton` function (~line 8):
```tsx
function BackButton({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <button onClick={onBack} className="flex items-center gap-2 text-noctvm-silver hover:text-white transition-colors mb-6 group">
      <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
```

Replace with:
```tsx
function BackButton({ onBack }: { onBack: () => void; label?: string }) {
  return (
    <button
      onClick={onBack}
      className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-noctvm-silver hover:text-white hover:bg-black/80 transition-all mb-6"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
```

- [ ] **Step 2: Replace account-menu back button in `page.tsx`**

Find the account-menu back button (inside `profileView === 'account-menu'` block, ~line 438):
```tsx
<button
  onClick={() => {
    if (previousTab === 'profile') {
      setProfileView('profile');
    } else {
      setActiveTab(previousTab);
      setProfileView('profile');
    }
  }}
  className="flex items-center gap-2 text-noctvm-silver hover:text-white transition-colors group"
>
  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
  <span className="text-xs font-medium">Back</span>
</button>
```

Replace with:
```tsx
<button
  onClick={() => {
    if (previousTab === 'profile') {
      setProfileView('profile');
    } else {
      setActiveTab(previousTab);
      setProfileView('profile');
    }
  }}
  className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-noctvm-silver hover:text-white hover:bg-black/80 transition-all"
>
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
</button>
```

- [ ] **Step 3: Verify** — Profile sub-pages and account menu show circle `<` button instead of text back link.

- [ ] **Step 4: Commit**
```bash
git add src/components/ProfilePages.tsx src/app/page.tsx
git commit -m "fix: replace text back buttons with circle chevron button"
```

---

## Chunk 2: Stories + Share + Post Save Removal

### Task 4: Story viewer — object-contain + delete own story

**Files:**
- Modify: `src/components/StoriesViewerModal.tsx`

- [ ] **Step 1: Change `object-cover` to `object-contain` with black bg**

Find (line ~144):
```tsx
<img src={story.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
```
Replace with:
```tsx
<img src={story.image_url} alt="" className="absolute inset-0 w-full h-full object-contain bg-black" />
```

- [ ] **Step 2: Add `myUserId` prop to `StoriesViewerModalProps`**

The component needs to know the current user's ID to show delete on own stories. Add it to the props interface:
```tsx
interface StoriesViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: StoryUser[];
  startIndex: number;
  myUserId?: string;           // ← add this
}
```

Update the function signature:
```tsx
export default function StoriesViewerModal({ isOpen, onClose, users, startIndex, myUserId }: StoriesViewerModalProps) {
```

- [ ] **Step 3: Add delete button inside the modal**

After the close/progress bar header area, inside the story display (around line 160, after the progress bars), add a delete button that only shows when `story.user_id === myUserId`:

```tsx
{myUserId && story.user_id === myUserId && (
  <button
    onClick={async (e) => {
      e.stopPropagation();
      await supabase.from('stories').delete().eq('id', story.id);
      // advance or close
      if (storyIndex < totalStories - 1) {
        setStoryIndex(s => s + 1);
        resetProgress();
      } else if (userIndex < users.length - 1) {
        setUserIndex(u => u + 1);
        setStoryIndex(0);
        resetProgress();
      } else {
        handleClose();
      }
    }}
    className="absolute top-4 left-14 z-30 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-black/80 transition-all"
    title="Delete story"
  >
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  </button>
)}
```

Add the `supabase` import at the top: `import { supabase } from '@/lib/supabase';`

- [ ] **Step 4: Pass `myUserId` from `page.tsx`**

In `page.tsx`, find the `StoriesViewerModal` usage:
```tsx
<StoriesViewerModal
  isOpen={showStories}
  onClose={() => setShowStories(false)}
  users={storyUsers}
  startIndex={storyStartIndex}
/>
```
Add the prop:
```tsx
<StoriesViewerModal
  isOpen={showStories}
  onClose={() => setShowStories(false)}
  users={storyUsers}
  startIndex={storyStartIndex}
  myUserId={user?.id}
/>
```

- [ ] **Step 5: Verify** — Stories show full image (no cropping), own stories have trash icon top-left, tapping it deletes the story and advances.

- [ ] **Step 6: Commit**
```bash
git add src/components/StoriesViewerModal.tsx src/app/page.tsx
git commit -m "fix: story viewer object-contain; add delete own story button"
```

---

### Task 5: Share Profile button

**Files:**
- Modify: `src/components/UserProfilePage.tsx`

- [ ] **Step 1: Add share toast state and handler**

Near the top of the `UserProfilePage` component, add:
```tsx
const [shareToast, setShareToast] = useState(false);

const handleShareProfile = async () => {
  const url = `${window.location.origin}${window.location.pathname}`;
  if (navigator.share) {
    try { await navigator.share({ title: 'NOCTVM', url }); } catch {}
  } else {
    await navigator.clipboard.writeText(url);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  }
};
```

- [ ] **Step 2: Wire the button and add toast**

Find the "Share Profile" button and replace with:
```tsx
<button
  onClick={handleShareProfile}
  className="flex-1 py-2 rounded-lg bg-noctvm-surface border border-noctvm-border text-xs text-noctvm-silver font-medium hover:border-noctvm-violet/30 transition-colors relative"
>
  {shareToast ? 'Copied!' : 'Share Profile'}
</button>
```

- [ ] **Step 3: Verify** — On mobile "Share Profile" triggers native share sheet. On desktop it copies URL and briefly shows "Copied!".

- [ ] **Step 4: Commit**
```bash
git add src/components/UserProfilePage.tsx
git commit -m "feat: share profile via Web Share API or clipboard copy"
```

---

### Task 6: Remove Save button from post cards in FeedPage

**Files:**
- Modify: `src/components/FeedPage.tsx`

The `FeedPage` post cards have a bookmark/save icon in the action row. Find and remove it.

- [ ] **Step 1: Find and remove the save button**

Search for `BookmarkIcon` usage in `FeedPage.tsx`. There will be a button that calls `toggleSave`. Remove the entire save button element from the post action row (keep like, comment, share buttons).

Also remove `saved: boolean` from the post state type if it's only used for the save button. If it's used elsewhere, leave the state but just hide the UI.

- [ ] **Step 2: Verify** — Post cards no longer show a bookmark/save button. Like, comment, share still work.

- [ ] **Step 3: Commit**
```bash
git add src/components/FeedPage.tsx
git commit -m "feat: remove save button from post cards (save applies to events only)"
```

---

## Chunk 3: Calendar Date Filter

### Task 7: Calendar date filter on Events page

**Files:**
- Modify: `src/components/FilterBar.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add `selectedDate` prop to FilterBar**

In `FilterBar.tsx`, update props:
```tsx
interface FilterBarProps {
  activeGenres: string[];
  onGenreChange: (genres: string[]) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'portrait' | 'landscape';
  onViewModeChange: (m: 'portrait' | 'landscape') => void;
  selectedDate: string | null;            // ← add
  onDateChange: (d: string | null) => void; // ← add
}
```

- [ ] **Step 2: Add calendar icon button + date input to FilterBar**

In the top row of FilterBar (where the search + grid/list toggle is), add a calendar button between/after the view mode toggle:

```tsx
{/* Calendar filter */}
<div className="relative">
  <button
    onClick={() => {
      const input = document.getElementById('event-date-filter') as HTMLInputElement;
      input?.showPicker?.();
      input?.click();
    }}
    className={`p-2 rounded-lg border transition-colors ${
      selectedDate
        ? 'bg-noctvm-violet/20 border-noctvm-violet/50 text-noctvm-violet'
        : 'bg-noctvm-surface border-noctvm-border text-noctvm-silver hover:text-white hover:border-noctvm-violet/30'
    }`}
    title="Filter by date"
  >
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  </button>
  <input
    id="event-date-filter"
    type="date"
    min={new Date().toISOString().split('T')[0]}
    value={selectedDate ?? ''}
    onChange={e => onDateChange(e.target.value || null)}
    className="absolute opacity-0 pointer-events-none w-0 h-0"
  />
</div>
```

- [ ] **Step 3: Show active date chip in genre area**

At the start of the genre pills row, if `selectedDate` is set, show a chip:
```tsx
{selectedDate && (
  <button
    onClick={() => onDateChange(null)}
    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-noctvm-violet/20 border border-noctvm-violet/50 text-noctvm-violet text-xs font-medium flex-shrink-0"
  >
    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
  </button>
)}
```

- [ ] **Step 4: Add `selectedDate` state in `page.tsx` and filter**

In `page.tsx`:
```tsx
const [selectedDate, setSelectedDate] = useState<string | null>(null);
```

Add date filter to `filteredEvents` useMemo (after genre/search filters):
```tsx
if (selectedDate) {
  events = events.filter(e => e.date === selectedDate);
}
```

Pass to FilterBar:
```tsx
<FilterBar
  ...
  selectedDate={selectedDate}
  onDateChange={setSelectedDate}
/>
```

- [ ] **Step 5: Verify** — Clicking calendar icon opens date picker. Selecting a date shows chip and filters events. Clicking × chip clears the filter.

- [ ] **Step 6: Commit**
```bash
git add src/components/FilterBar.tsx src/app/page.tsx
git commit -m "feat: calendar date filter on events page"
```

---

## Chunk 4: Event Saves (DB + EventCard + EventDetailModal)

### Task 8: Create event_saves migration

**Files:**
- Create: `supabase/migrations/20260313_event_saves.sql`

- [ ] **Step 1: Create migration file**

```sql
-- event_saves: tracks which users saved/bookmarked which events
create table if not exists event_saves (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references events(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (event_id, user_id)
);

alter table event_saves enable row level security;

create policy "event_saves_read"   on event_saves for select using (true);
create policy "event_saves_insert" on event_saves for insert with check (auth.uid() = user_id);
create policy "event_saves_delete" on event_saves for delete using (auth.uid() = user_id);

-- fast count lookups
create index if not exists event_saves_event_id_idx on event_saves(event_id);
create index if not exists event_saves_user_id_idx  on event_saves(user_id);
```

- [ ] **Step 2: Run migration in Supabase Dashboard → SQL Editor**

Paste and execute the migration. Verify table exists in Table Editor.

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/20260313_event_saves.sql
git commit -m "feat: event_saves migration for event interest/bookmarks"
```

---

### Task 9: Bookmark icon on EventCard

**Files:**
- Modify: `src/components/EventCard.tsx`
- Modify: `src/lib/types.ts` (add `saveCount?: number` to NoctEvent if desired, or fetch inline)

The bookmark shows save count and is in the bottom row (same row as date/time). It only renders for DB events (those with a real `id` that references `events.id` — sample events have hardcoded IDs that won't exist in `event_saves`).

Since EventCard is rendered in a list, avoid per-card DB calls on mount for performance. Instead, fetch counts in batch in `page.tsx` and pass as a map, or simply show the icon without count on the card (count only in modal). Given scope, keep it simple: **no count on EventCard** — just a visual bookmark indicator that shows whether the current user has saved it, fetched once when events load in `page.tsx`.

Actually simpler still: **show the bookmark icon as a static button on the card** that opens the modal (clicking the card already opens the modal). The count is shown inside the modal with real-time. On the card, just show the icon with a "saved" filled state if the user has saved it.

- [ ] **Step 1: Add `BookmarkIcon` to the imports in EventCard**

Add to the icon imports at top of `EventCard.tsx`:
```tsx
import { BookmarkIcon } from './icons';
```
(Check if it exists in `icons.tsx`, add if not: `export const BookmarkIcon = ...`)

- [ ] **Step 2: Add bookmark display to the landscape card bottom row**

In the landscape card variant, find the bottom info row (around line 112):
```tsx
<div className="flex items-center justify-between pt-3 border-t border-white/5">
  <div className="flex items-center gap-2 text-noctvm-silver/80">
    ...date/time...
  </div>
  ...
</div>
```

Add bookmark icon to the right side of that row:
```tsx
<div className="flex items-center justify-between pt-3 border-t border-white/5">
  <div className="flex items-center gap-2 text-noctvm-silver/80">
    {/* existing date/time */}
  </div>
  {event.id && (
    <BookmarkIcon className="w-3.5 h-3.5 text-noctvm-silver/40 flex-shrink-0" />
  )}
</div>
```

- [ ] **Step 3: Same for portrait card bottom row** (~line 166)

```tsx
<div className="mt-auto pt-2.5 border-t border-white/5 flex items-center gap-2 text-noctvm-silver/80">
  {/* existing date/time */}
  <div className="ml-auto">
    {event.id && <BookmarkIcon className="w-3.5 h-3.5 text-noctvm-silver/40 flex-shrink-0" />}
  </div>
</div>
```

- [ ] **Step 4: Verify** — Both card variants show a small bookmark icon in the bottom row for events. It's static (just visual cue to click for details).

- [ ] **Step 5: Commit**
```bash
git add src/components/EventCard.tsx src/components/icons.tsx
git commit -m "feat: bookmark icon indicator on event cards"
```

---

### Task 10: EventDetailModal — save button with real-time counter

**Files:**
- Modify: `src/components/EventDetailModal.tsx`
- Modify: `src/app/page.tsx` (pass `onOpenAuth`)

- [ ] **Step 1: Add `onOpenAuth` prop to EventDetailModal**

```tsx
interface EventDetailModalProps {
  event: NoctEvent | null;
  onClose: () => void;
  onVenueClick: (name: string) => void;
  onOpenAuth: () => void;   // ← add
}
```

Update function signature.

- [ ] **Step 2: Add save state + real-time subscription inside EventDetailModal**

After the existing state variables, add:
```tsx
const { user } = useAuth();
const [saveCount, setSaveCount]   = useState(0);
const [isSaved,   setIsSaved]     = useState(false);
const [saveLoading, setSaveLoading] = useState(false);
```

Add a `useEffect` that fires when `event?.id` changes:
```tsx
useEffect(() => {
  if (!event?.id) return;
  // Initial fetch
  supabase
    .from('event_saves')
    .select('id, user_id', { count: 'exact' })
    .eq('event_id', event.id)
    .then(({ data, count }) => {
      setSaveCount(count ?? 0);
      if (user) setIsSaved((data ?? []).some((r: any) => r.user_id === user.id));
    });

  // Real-time subscription
  const channel = supabase
    .channel(`event_saves_${event.id}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'event_saves',
      filter: `event_id=eq.${event.id}`,
    }, async () => {
      const { data, count } = await supabase
        .from('event_saves')
        .select('id, user_id', { count: 'exact' })
        .eq('event_id', event.id);
      setSaveCount(count ?? 0);
      if (user) setIsSaved((data ?? []).some((r: any) => r.user_id === user.id));
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [event?.id, user]);
```

Add `useAuth` import: `import { useAuth } from '@/contexts/AuthContext';`
Add `supabase` import: `import { supabase } from '@/lib/supabase';`

- [ ] **Step 3: Add save toggle handler**

```tsx
const handleSave = async () => {
  if (!user) { onOpenAuth(); return; }
  if (!event?.id || saveLoading) return;
  setSaveLoading(true);
  if (isSaved) {
    await supabase.from('event_saves').delete().eq('event_id', event.id).eq('user_id', user.id);
  } else {
    await supabase.from('event_saves').insert({ event_id: event.id, user_id: user.id });
  }
  setSaveLoading(false);
};
```

- [ ] **Step 4: Add bookmark button to the modal bottom info row**

Find the bottom info area of the modal (date/time/venue row). Add the bookmark button on the right side:
```tsx
<button
  onClick={handleSave}
  disabled={saveLoading || !event?.id}
  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
    isSaved
      ? 'bg-noctvm-violet/20 text-noctvm-violet border-noctvm-violet/40'
      : 'bg-black/40 text-noctvm-silver border-white/10 hover:border-noctvm-violet/30 hover:text-noctvm-violet'
  } ${!event?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
>
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
  <span>{saveCount}</span>
</button>
```

- [ ] **Step 5: Pass `onOpenAuth` from `page.tsx`**

In `page.tsx`:
```tsx
<EventDetailModal
  event={selectedEvent}
  onClose={() => setSelectedEvent(null)}
  onVenueClick={(venueName) => { setSelectedEvent(null); handleVenueClick(venueName); }}
  onOpenAuth={() => setShowAuthModal(true)}
/>
```

- [ ] **Step 6: Reset save state when modal closes**

Add to the event change useEffect cleanup or add explicit reset:
```tsx
useEffect(() => {
  if (!event) { setSaveCount(0); setIsSaved(false); }
}, [event]);
```

- [ ] **Step 7: Verify** — Opening an event from DB shows bookmark icon + count. Clicking it saves/unsaves. Count updates in real-time across sessions. Logged-out click opens auth modal. Sample events (no DB ID) show disabled bookmark.

- [ ] **Step 8: Commit**
```bash
git add src/components/EventDetailModal.tsx src/app/page.tsx
git commit -m "feat: event save/bookmark with real-time interest counter"
```

---

## Chunk 5: Profile Improvements

### Task 11: Saved Events tab in UserProfilePage

**Files:**
- Modify: `src/components/UserProfilePage.tsx`
- Modify: `src/app/page.tsx` (pass `onEventClick` to UserProfilePage)

- [ ] **Step 1: Add `onEventClick` prop to UserProfilePage**

```tsx
interface UserProfilePageProps {
  onOpenAuth: () => void;
  onSettingsClick: () => void;
  onOpenCreatePost: () => void;
  onOpenStories: (users: StoryUser[], index: number) => void;
  onEventClick: (event: NoctEvent) => void;  // ← add
}
```

- [ ] **Step 2: Replace saved posts fetch with saved events fetch**

Find `fetchSavedPosts`:
```tsx
const fetchSavedPosts = useCallback(async () => {
  ...
  supabase.from('post_saves').select('posts(...)').eq('user_id', user.id)
  ...
}, [...]);
```

Replace with `fetchSavedEvents`:
```tsx
const [savedEvents, setSavedEvents] = useState<NoctEvent[]>([]);

const fetchSavedEvents = useCallback(async () => {
  if (!user) return;
  const { data } = await supabase
    .from('event_saves')
    .select('events(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  setSavedEvents((data ?? []).map((r: any) => r.events).filter(Boolean) as NoctEvent[]);
}, [user]);
```

Update the `useEffect` that calls fetchers to call `fetchSavedEvents` instead of `fetchSavedPosts`.

- [ ] **Step 3: Update the saved tab render**

Find `{activeTab === 'saved' && ...}` block. Replace saved posts grid with event cards:
```tsx
{activeTab === 'saved' && (
  <div className="space-y-3 px-1">
    {savedEvents.length > 0 ? (
      savedEvents.map(event => (
        <div key={event.id} onClick={() => onEventClick(event)} className="cursor-pointer">
          <EventCard event={event} variant="landscape" onClick={onEventClick} />
        </div>
      ))
    ) : (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-full bg-noctvm-surface flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-noctvm-violet/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
        </div>
        <p className="text-sm text-noctvm-silver">No saved events</p>
        <p className="text-xs text-noctvm-silver/50 mt-1">Bookmark events to find them here</p>
      </div>
    )}
  </div>
)}
```

Add `import EventCard from './EventCard';` and `import { NoctEvent } from '@/lib/types';` if not already present.

- [ ] **Step 4: Pass `onEventClick` from `page.tsx`**

```tsx
<UserProfilePage
  onOpenAuth={() => setShowAuthModal(true)}
  onSettingsClick={handleSettingsClick}
  onOpenCreatePost={() => setShowCreatePost(true)}
  onOpenStories={(users, index) => handleOpenStories(users, index)}
  onEventClick={(e) => setSelectedEvent(e)}
/>
```

- [ ] **Step 5: Verify** — Profile bookmark tab shows saved events as cards. Clicking opens EventDetailModal. Empty state when none saved.

- [ ] **Step 6: Commit**
```bash
git add src/components/UserProfilePage.tsx src/app/page.tsx
git commit -m "feat: saved events tab on profile (replaces saved posts)"
```

---

### Task 12: Post viewer modal — click profile grid posts

**Files:**
- Create: `src/components/PostViewerModal.tsx`
- Modify: `src/components/UserProfilePage.tsx`

- [ ] **Step 1: Create `PostViewerModal.tsx`**

```tsx
'use client';
import { useState, useEffect } from 'react';

interface ProfilePost {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  likes_count?: number;
}

interface PostViewerModalProps {
  posts: ProfilePost[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostViewerModal({ posts, initialIndex, isOpen, onClose }: PostViewerModalProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => { if (isOpen) setIndex(initialIndex); }, [isOpen, initialIndex]);

  if (!isOpen || posts.length === 0) return null;

  const post = posts[index];
  const hasPrev = index > 0;
  const hasNext = index < posts.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-noctvm-surface rounded-2xl overflow-hidden border border-noctvm-border shadow-2xl z-10">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-noctvm-silver hover:text-white hover:bg-black/80 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        {/* Image */}
        <div className="relative aspect-square bg-noctvm-midnight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image_url} alt="" className="w-full h-full object-contain bg-black" />

          {/* Prev */}
          {hasPrev && (
            <button
              onClick={() => setIndex(i => i - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          {/* Next */}
          {hasNext && (
            <button
              onClick={() => setIndex(i => i + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[11px] font-mono">
            {index + 1} / {posts.length}
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="px-4 py-3">
            <p className="text-sm text-noctvm-silver">{post.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add viewer state and wire up in `UserProfilePage`**

Add state:
```tsx
const [viewerOpen, setViewerOpen]     = useState(false);
const [viewerIndex, setViewerIndex]   = useState(0);
```

When rendering the posts grid, make each post clickable:
```tsx
{posts.map((post, i) => (
  <button
    key={post.id}
    onClick={() => { setViewerIndex(i); setViewerOpen(true); }}
    className="aspect-square overflow-hidden bg-noctvm-midnight hover:opacity-90 transition-opacity"
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
  </button>
))}
```

Add modal at the bottom of the component return:
```tsx
<PostViewerModal
  posts={posts}
  initialIndex={viewerIndex}
  isOpen={viewerOpen}
  onClose={() => setViewerOpen(false)}
/>
```

Add import: `import PostViewerModal from './PostViewerModal';`

- [ ] **Step 3: Verify** — Clicking a post in the profile grid opens the modal. Prev/Next buttons navigate. Close button and backdrop dismiss.

- [ ] **Step 4: Commit**
```bash
git add src/components/PostViewerModal.tsx src/components/UserProfilePage.tsx
git commit -m "feat: post viewer modal with prev/next navigation on profile grid"
```

---

### Task 13: My Story bubble — avatar consistency

**Files:**
- Modify: `src/components/FeedPage.tsx`

The issue: the "Add Story" button (when no active story) uses `profile.avatar_url` but shows it at `opacity-60`. The "My Story" bubble (when story exists) uses `myEntry.avatarUrl` from the story DB row. These should match but the styling differs.

- [ ] **Step 1: Fix "Add Story" bubble avatar display**

Find the no-story "Add Story" state (around line 476). Currently:
```tsx
{profile?.avatar_url
  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full opacity-60" />
  : null}
```

Replace with full-opacity avatar + letter fallback (matching the "My Story" bubble):
```tsx
{profile?.avatar_url ? (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
) : (
  <span className="text-white font-bold text-lg">{userInitial}</span>
)}
```

- [ ] **Step 2: Verify** — "Add Story" and "My Story" bubbles show the same profile image at the same opacity with the same fallback.

- [ ] **Step 3: Commit**
```bash
git add src/components/FeedPage.tsx
git commit -m "fix: story bubble avatar matches profile pic (no opacity reduction)"
```

---

## Chunk 6: Venues City Selector + Constanta

### Task 14: VenuesPage city selector + Constanta venues

**Files:**
- Modify: `src/components/VenuesPage.tsx`

- [ ] **Step 1: Add `city` field to existing Bucharest venues array**

In `VenuesPage.tsx`, add `city: 'Bucharest'` to each entry in the existing venues array. Update the type:
```tsx
interface Venue {
  name: string;
  address: string;
  genres: string[];
  capacity: number;
  rating: number;
  reviewCount: number;
  description: string;
  followers: number;
  city: 'Bucharest' | 'Constanța';
}
```

- [ ] **Step 2: Add Constanta venues array**

```tsx
const CONSTANTA_VENUES: Venue[] = [
  { name: 'Vox Maris Beach Club', address: 'Sat Costinești, Constanța', genres: ['House', 'Electronic', 'Commercial'], capacity: 2000, rating: 4.5, reviewCount: 312, description: 'Iconic Black Sea beach club. Massive outdoor dancefloor with sea views and world-class DJs every summer.', followers: 5200, city: 'Constanța' },
  { name: 'Nuba Club', address: 'Bd. Mamaia, Constanța', genres: ['House', 'Techno', 'Electronic'], capacity: 800, rating: 4.3, reviewCount: 189, description: 'Premium nightclub on the Mamaia strip. Multiple rooms and a rooftop with Black Sea panoramas.', followers: 2800, city: 'Constanța' },
  { name: 'Doors Club', address: 'Str. Mircea cel Bătrân, Constanța', genres: ['Techno', 'Underground', 'Minimal'], capacity: 350, rating: 4.4, reviewCount: 134, description: 'Underground club bringing the best of Romanian techno to the coast.', followers: 1400, city: 'Constanța' },
  { name: 'Euphoria Music Hall', address: 'Bd. Aurel Vlaicu, Constanța', genres: ['EDM', 'Commercial', 'Party'], capacity: 1200, rating: 4.0, reviewCount: 267, description: 'Largest indoor venue in Constanța. Concert-grade production for big events and festivals.', followers: 3100, city: 'Constanța' },
  { name: 'Eden Club', address: 'Mamaia Nord, Constanța', genres: ['House', 'Disco', 'R&B'], capacity: 600, rating: 4.2, reviewCount: 98, description: 'Beachfront open-air club at Mamaia Nord. Sunset sessions and deep house vibes.', followers: 1750, city: 'Constanța' },
];
```

Merge into one array or keep separate and switch by city:
```tsx
const ALL_VENUES = { Bucharest: BUCHAREST_VENUES, Constanța: CONSTANTA_VENUES };
```

- [ ] **Step 3: Add city selector state and dropdown**

Add to the VenuesPage component:
```tsx
const [activeCity, setActiveCity] = useState<'Bucharest' | 'Constanța'>('Bucharest');
```

In the page header, add the same city selector as the Events tab:
```tsx
<div className="flex items-center gap-2 mt-1">
  <span className="text-sm text-noctvm-silver">Venues in</span>
  <div className="relative">
    <select
      value={activeCity}
      onChange={e => setActiveCity(e.target.value as 'Bucharest' | 'Constanța')}
      className="bg-noctvm-surface border border-noctvm-border rounded-lg px-3 py-1 text-sm text-white font-medium focus:outline-none focus:border-noctvm-violet/50 cursor-pointer pr-7 appearance-none"
    >
      <option value="Bucharest">București</option>
      <option value="Constanța">Constanța</option>
    </select>
    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-noctvm-silver pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
  </div>
</div>
```

- [ ] **Step 4: Filter venues by active city**

Replace the venues source:
```tsx
const venues = activeCity === 'Bucharest' ? BUCHAREST_VENUES : CONSTANTA_VENUES;
```

Filter the existing search/genre logic against `venues` instead of the hardcoded array.

- [ ] **Step 5: Verify** — Venues tab shows city selector. Switching to Constanța shows Constanta venues. Search/filter still works per city.

- [ ] **Step 6: Commit**
```bash
git add src/components/VenuesPage.tsx
git commit -m "feat: venues city selector; add Constanta venues"
```

---

## Final verification

- [ ] Run `npx tsc --noEmit` — zero errors
- [ ] Test all features: tab order, genre wrap, back buttons, story delete, share profile, date filter, event save (requires migration), profile saved events, post viewer, venues constanta
- [ ] Final commit if any loose ends
