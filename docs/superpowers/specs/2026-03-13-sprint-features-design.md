# NOCTVM Sprint — Feature Design (2026-03-13)

## Overview
14 features/fixes across UI, events, venues, profile, and data layers.

---

## A. Instant UI Fixes

### A1. Genre selector — 2 lines
**File:** `src/components/FilterBar.tsx`
Change `flex gap-2 overflow-x-auto pb-1 scrollbar-hide` → `flex flex-wrap gap-2 pb-1`.

### A2. Back buttons → circle `<` button
Replace every text "← Back" button with a circle icon button matching the modal X style:
`w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-noctvm-silver hover:text-white hover:bg-black/80 transition-all`
SVG: left chevron `<path d="M15 18l-6-6 6-6" />`.
**Files:** `src/components/ProfilePages.tsx`, `src/app/page.tsx` (account-menu back), `src/components/VenuePage.tsx`.

### A3. Story viewer — object-contain
**File:** `src/components/StoriesViewerModal.tsx`
Change image `object-cover` → `object-contain bg-black` so full story image is visible.

### A4. Story delete button
**File:** `src/components/StoriesViewerModal.tsx`
When `story.user_id === currentUser?.id`, show a trash icon button (top-right corner area).
On click: `supabase.from('stories').delete().eq('id', story.id)` → advance to next story or close.

### A5. Share Profile
**File:** `src/components/UserProfilePage.tsx`
Replace no-op "Share Profile" with:
1. `navigator.share({ title: 'NOCTVM', url: window.location.href })` if supported
2. Fallback: `navigator.clipboard.writeText(...)` + show a 2s "Copied!" toast.

### A6. Remove Save from posts modal
**File:** `src/components/CreatePostModal.tsx` (and post cards in FeedPage if present)
Remove the bookmark/save button. Save concept belongs to events only.

---

## B. Sidebar tab order

**File:** `src/components/Sidebar.tsx`, `src/components/BottomNav.tsx`
New order: **Events → Venues → Feed → Wallet** (profile stays pinned at bottom).

---

## C. Events Page

### C1. Calendar date filter
**File:** `src/app/page.tsx` + `src/components/FilterBar.tsx`
- New `selectedDate: string | null` state in `page.tsx`, passed as prop to FilterBar.
- FilterBar renders a calendar icon button (right side of filter row, next to grid/list toggle).
- Clicking reveals a native `<input type="date" min={today}>` styled to match design language (dark bg, violet border focus, same pill shape as genre buttons).
- When set, `filteredEvents` adds `.filter(e => e.date === selectedDate)`.
- Active date shows as a dismissible chip with × to clear.

### C2. Save Event (interest)

**New Supabase table:**
```sql
create table event_saves (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (event_id, user_id)
);
-- RLS: anyone can read counts, only owner can insert/delete own row
alter table event_saves enable row level security;
create policy "public read" on event_saves for select using (true);
create policy "owner insert" on event_saves for insert with check (auth.uid() = user_id);
create policy "owner delete" on event_saves for delete using (auth.uid() = user_id);
```

**EventCard** (`src/components/EventCard.tsx`):
- Bookmark icon in bottom-right corner, same row as date/venue info.
- Shows save count (loaded once on mount via `supabase.from('event_saves').select('id', {count:'exact'}).eq('event_id', event.id)`).
- Only shown for DB events (those with a real UUID that exists in `events` table). Hidden for sample-data fallback events.

**EventDetailModal** (`src/components/EventDetailModal.tsx`):
- Bottom info row: add bookmark icon + count on the right side.
- Real-time subscription: `supabase.channel('saves-{eventId}').on('postgres_changes', {event:'*', schema:'public', table:'event_saves', filter:'event_id=eq.{id}'}, handler)`.
- Logged-out click → trigger `onOpenAuth` callback.
- Logged-in click → upsert or delete from `event_saves`.
- `EventDetailModal` receives new optional props: `onOpenAuth: () => void`.

---

## D. Profile Page

### D1. Saved Events tab (replaces Saved Posts)
**File:** `src/components/UserProfilePage.tsx`
- Bookmark tab now fetches: `supabase.from('event_saves').select('events(*)').eq('user_id', userId).order('created_at', {ascending: false})`.
- Renders compact landscape EventCards. Clicking opens EventDetailModal.
- Pass `onEventClick` prop down into UserProfilePage.

### D2. Post modal viewer (click-through)
**New component:** `src/components/PostViewerModal.tsx`
- Opens when a post is clicked in the profile grid.
- Shows full post (image + caption + likes/comments).
- Prev/next arrow buttons navigate through the user's posts array.
- Same circle-button close style as other modals.
- Props: `posts: ProfilePost[], initialIndex: number, isOpen: bool, onClose: () => void`.
- `UserProfilePage` passes `onEventClick` up and triggers this modal on post click.

---

## E. Venues Page

### E1. City selector
**File:** `src/components/VenuesPage.tsx`
- Add `activeCity` state (`'bucuresti' | 'constanta'`), same `<select>` dropdown as Events tab.
- Filter `VENUES` array by city field (add `city` field to each venue entry).
- Constanta branch: show `CONSTANTA_VENUES` or "Coming soon Summer 2026" if empty.

### E2. Constanta venues
Add `CONSTANTA_VENUES` array with known venues: Vox Maris Beach Club, Nuba Club, Doors Club, Euphoria, Eden Club — same data shape as Bucharest array.

---

## F. Profile picture consistency

### F1. My Story bubble matches profile pic
**File:** `src/components/MobileTopSection.tsx` (or wherever the story bubble renders)
Audit: ensure the "My Story" bubble uses the same `profile.avatar_url` from `useAuth()` with identical fallback logic (gradient + first letter). Both places must use the same image source.

---

## Migration file
`supabase/migrations/20260313_event_saves.sql` — the SQL above for `event_saves`.

---

## Files changed summary
| File | Change |
|------|--------|
| `src/components/FilterBar.tsx` | flex-wrap genres; calendar date filter |
| `src/components/Sidebar.tsx` | tab order |
| `src/components/BottomNav.tsx` | tab order |
| `src/components/ProfilePages.tsx` | circle back buttons |
| `src/components/VenuePage.tsx` | circle back button |
| `src/app/page.tsx` | circle back button in account-menu; selectedDate state |
| `src/components/StoriesViewerModal.tsx` | object-contain; delete button |
| `src/components/UserProfilePage.tsx` | share profile; saved events tab; post click opens modal |
| `src/components/CreatePostModal.tsx` | remove save button |
| `src/components/EventCard.tsx` | bookmark icon + count in bottom row |
| `src/components/EventDetailModal.tsx` | bookmark + realtime counter; onOpenAuth prop |
| `src/components/VenuesPage.tsx` | city selector; Constanta venues |
| `src/components/MobileTopSection.tsx` | story bubble avatar consistency |
| `src/components/PostViewerModal.tsx` | NEW — post viewer with prev/next |
| `supabase/migrations/20260313_event_saves.sql` | NEW — event_saves table |
