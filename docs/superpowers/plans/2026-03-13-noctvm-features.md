# NOCTVM Features & Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 8 bugs/features: back-button nav, price tag unification, FAB desktop visibility, sign-in prompts, people tagging in posts, stories viewer modal, functional highlights, and modal closing animations.

**Architecture:** All modals live at `page.tsx` root (no stacking context). New `StoriesViewerModal` component receives data via props. Local React state drives Highlights (no Supabase yet). Closing animation pattern: `isClosing` state + CSS keyframes + `onAnimationEnd` handler.

**Tech Stack:** Next.js 14.2.35 App Router, React 18, TypeScript, Tailwind CSS, Supabase. Validation: `npx tsc --noEmit` (no test suite configured).

---

## Files Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/globals.css` | Modify | Add `scaleOut` + `fadeOut` keyframes and `.animate-scale-out` / `.animate-fade-out` classes |
| `src/app/page.tsx` | Modify | `previousTab` state; FAB moved here; `showStories` state; pass new props to children |
| `src/components/EventCard.tsx` | Modify | Replace `liquid-glass-price` inner div with emerald pill style |
| `src/components/EventDetailModal.tsx` | Modify | Add `isClosing` + closing animation |
| `src/components/CreatePostModal.tsx` | Modify | Add `isClosing` animation; add "Tag People" section; add `onOpenAuth` prop |
| `src/components/CreateStoryModal.tsx` | Modify | Add `isClosing` animation; add `onOpenAuth` prop; replace "Close" with "Sign In" |
| `src/components/AuthModal.tsx` | Modify | Add `isClosing` animation |
| `src/components/FeedPage.tsx` | Modify | Remove FAB (moved to page.tsx); pass `onOpenStories` callback; story circles call `onOpenStories` |
| `src/components/UserProfilePage.tsx` | Modify | Functional highlights with local state; "New" creates a highlight; clicking highlight triggers viewer |
| `src/components/StoriesViewerModal.tsx` | Create | Full-screen story viewer with progress bars, auto-advance, tap zones |

---

## Chunk 1: CSS Closing Animations + Price Tag + Back Button

### Task 1: Add closing animation CSS

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add `scaleOut` and `fadeOut` keyframes + utility classes**

Find the `@keyframes scaleIn` block (around line 180–200) and add directly after it:

```css
@keyframes scaleOut {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to   { opacity: 0; transform: scale(0.95) translateY(4px); }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to   { opacity: 0; }
}

.animate-scale-out {
  animation: scaleOut 0.18s ease-in both;
  pointer-events: none;
}

.animate-fade-out {
  animation: fadeOut 0.18s ease-in both;
  pointer-events: none;
}
```

- [ ] **Step 2: Validate TypeScript (CSS doesn't affect TS, but run for sanity)**

```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit
```
Expected: 0 errors.

---

### Task 2: Fix price tag in EventCard to match modal style

**Files:**
- Modify: `src/components/EventCard.tsx`

- [ ] **Step 1: Replace `getPriceBadge()` inner div**

Current inner div:
```tsx
<div className="liquid-glass-price rounded-xl px-2.5 py-1.5 flex items-center justify-center min-w-[44px]">
  <span className="text-[11px] font-bold text-white uppercase tracking-tight relative z-10">{display}</span>
</div>
```

Replace with the same emerald pill from EventDetailModal:
```tsx
<div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
  {display}
</div>
```

The outer `<a>` wrapper and positioning (`absolute bottom-2.5 right-2.5 z-20`) stay unchanged.

- [ ] **Step 2: Validate TypeScript**

```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit
```
Expected: 0 errors.

---

### Task 3: Fix back button to return to origin tab

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add `previousTab` state near the other state declarations (around line 50)**

```tsx
const [previousTab, setPreviousTab] = useState<TabType>('events');
```

- [ ] **Step 2: Update `handleSettingsClick` to save the current tab before navigating**

Current:
```tsx
const handleSettingsClick = () => {
  setActiveTab('profile');
  setProfileView('account-menu');
};
```

Replace with:
```tsx
const handleSettingsClick = () => {
  setPreviousTab(activeTab);
  setActiveTab('profile');
  setProfileView('account-menu');
};
```

- [ ] **Step 3: Update the account-menu back button (around line 353–359)**

Current:
```tsx
onClick={() => setProfileView('profile')}
```

Replace the entire `onClick` callback:
```tsx
onClick={() => {
  if (previousTab === 'profile') {
    setProfileView('profile');
  } else {
    setActiveTab(previousTab);
    setProfileView('profile');
  }
}}
```

- [ ] **Step 4: Validate TypeScript**

```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit
```
Expected: 0 errors.

---

## Chunk 2: Closing Animations on All Modals

Apply the `isClosing` pattern to `EventDetailModal`, `CreatePostModal`, `CreateStoryModal`, and `AuthModal`. Also apply to the Venue overlay in `page.tsx`.

**Shared pattern for every modal:**

```tsx
// 1. Add to state:
const [isClosing, setIsClosing] = useState(false);

// 2. Replace direct onClose calls with:
const handleClose = () => setIsClosing(true);

// 3. On the backdrop div, add onClick={handleClose} and:
className={`... ${isClosing ? 'animate-fade-out' : ''}`}

// 4. On the inner panel div, change className:
className={`... ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
// and add:
onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
```

All existing `onClose()` direct calls in event handlers (Cancel button, backdrop click, X button) must be replaced with `handleClose()`.

---

### Task 4: EventDetailModal closing animation

**Files:**
- Modify: `src/components/EventDetailModal.tsx`

- [ ] **Step 1: Add `useState` for `isClosing` (it's already imported)**

Add near the top of the component function body:
```tsx
const [isClosing, setIsClosing] = useState(false);
const handleClose = () => setIsClosing(true);
```

- [ ] **Step 2: Update the backdrop div**

Find: `<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onClose()} />`

Replace:
```tsx
<div
  className={`absolute inset-0 bg-black/70 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : ''}`}
  onClick={handleClose}
/>
```

- [ ] **Step 3: Update the inner panel classname and add `onAnimationEnd`**

Find the inner panel div (has `animate-scale-in` on it, around line 57):
```tsx
className="relative w-full h-full sm:w-[560px] sm:h-auto sm:max-h-[90vh] bg-noctvm-midnight sm:rounded-2xl overflow-hidden flex flex-col animate-scale-in shadow-2xl shadow-black/60 border border-noctvm-border"
```

Replace:
```tsx
className={`relative w-full h-full sm:w-[560px] sm:h-auto sm:max-h-[90vh] bg-noctvm-midnight sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl shadow-black/60 border border-noctvm-border ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
```

- [ ] **Step 4: Replace all `onClose()` calls with `handleClose()`**

Search for `onClose()` in EventDetailModal.tsx and replace each with `handleClose()`.
Specifically the X close button `onClick`.

- [ ] **Step 5: Validate TypeScript**

```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit
```
Expected: 0 errors.

---

### Task 5: CreatePostModal — closing animation + Sign In prompt + onOpenAuth prop

**Files:**
- Modify: `src/components/CreatePostModal.tsx`

- [ ] **Step 1: Add `onOpenAuth` to the props interface**

```tsx
interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
  onOpenAuth?: () => void;
}
```

Update function signature:
```tsx
export default function CreatePostModal({ isOpen, onClose, onPostCreated, onOpenAuth }: CreatePostModalProps)
```

- [ ] **Step 2: Update the "not signed in" UI — replace "Close" with "Sign In" + Cancel**

Find the not-signed-in return block (around line 114–124). Replace the button:
```tsx
if (!user) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-noctvm-midnight border border-noctvm-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
        <p className="text-white font-semibold mb-2">Sign in to post</p>
        <p className="text-sm text-noctvm-silver mb-6">Create an account to share your nightlife moments.</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { onClose(); onOpenAuth?.(); }}
            className="px-6 py-2.5 rounded-lg bg-noctvm-violet text-white text-sm font-medium hover:bg-noctvm-violet/90 transition-colors"
          >
            Sign In
          </button>
          <button onClick={onClose} className="text-xs text-noctvm-silver hover:text-white transition-colors py-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add `isClosing` state and `handleClose`**

Add near the top of the component body (below existing state):
```tsx
const [isClosing, setIsClosing] = useState(false);
const handleClose = () => {
  setImagePreview(null);
  setCaption('');
  setSelectedVenue('');
  setVenueSearch('');
  setTags([]);
  setTagInput('');
  setError('');
  setIsClosing(true);
};
```

Remove the existing `handleClose` function (it did the same reset + called `onClose()` directly).

- [ ] **Step 4: Update backdrop and inner panel**

Backdrop:
```tsx
<div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : ''}`} onClick={handleClose}>
```

Inner panel div — add `onAnimationEnd` and toggle animation class:
```tsx
<div
  className={`w-full max-w-lg bg-noctvm-midnight border border-noctvm-border rounded-2xl overflow-hidden ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
  onClick={e => e.stopPropagation()}
  onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
>
```

- [ ] **Step 5: Replace all remaining `onClose()` calls inside the modal body with `handleClose()`**

The Cancel button text button and any other direct `onClose()` references.

- [ ] **Step 6: Pass `onOpenAuth` from `page.tsx` to `CreatePostModal`**

In `page.tsx`, find:
```tsx
<CreatePostModal isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} onPostCreated={() => {}} />
```
Replace:
```tsx
<CreatePostModal isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} onPostCreated={() => {}} onOpenAuth={() => setShowAuthModal(true)} />
```

- [ ] **Step 7: Validate TypeScript**

```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit
```
Expected: 0 errors.

---

### Task 6: CreateStoryModal — closing animation + Sign In prompt + onOpenAuth

**Files:**
- Modify: `src/components/CreateStoryModal.tsx`

- [ ] **Step 1: Add `onOpenAuth` to the props interface + function signature**

```tsx
interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated?: () => void;
  onOpenAuth?: () => void;
}
export default function CreateStoryModal({ isOpen, onClose, onStoryCreated, onOpenAuth }: CreateStoryModalProps)
```

- [ ] **Step 2: Update the "not signed in" UI — replace "Close" with "Sign In" + Cancel**

Find the not-signed-in return block (around line 84–94). Replace:
```tsx
if (!user) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-noctvm-midnight border border-noctvm-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
        <p className="text-white font-semibold mb-2">Sign in to share a story</p>
        <p className="text-sm text-noctvm-silver mb-6">Create an account to share your nightlife moments.</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { onClose(); onOpenAuth?.(); }}
            className="px-6 py-2.5 rounded-lg bg-noctvm-violet text-white text-sm font-medium hover:bg-noctvm-violet/90 transition-colors"
          >
            Sign In
          </button>
          <button onClick={onClose} className="text-xs text-noctvm-silver hover:text-white transition-colors py-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add `isClosing` state, update `handleClose` and `reset`**

Add after existing state declarations:
```tsx
const [isClosing, setIsClosing] = useState(false);
```

Update existing `handleClose`:
```tsx
const handleClose = () => {
  reset();
  setIsClosing(true);
};
```

- [ ] **Step 4: Update backdrop + inner panel**

Backdrop div: add `${isClosing ? 'animate-fade-out' : ''}` to className.

Inner panel:
```tsx
<div
  className={`w-full max-w-sm bg-noctvm-midnight border border-noctvm-border rounded-2xl overflow-hidden ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
  onClick={e => e.stopPropagation()}
  onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
>
```

- [ ] **Step 5: Pass `onOpenAuth` from `page.tsx` to `CreateStoryModal`**

In `page.tsx`:
```tsx
<CreateStoryModal isOpen={showCreateStory} onClose={() => setShowCreateStory(false)} onOpenAuth={() => setShowAuthModal(true)} />
```

- [ ] **Step 6: Validate TypeScript**

```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit
```
Expected: 0 errors.

---

### Task 7: AuthModal closing animation

**Files:**
- Modify: `src/components/AuthModal.tsx`

- [ ] **Step 1: Read the AuthModal to understand its structure**

Read `src/components/AuthModal.tsx` to find: the backdrop div, the inner panel div (has `animate-scale-in`), and any `onClose()` calls.

- [ ] **Step 2: Add `isClosing` state**

```tsx
const [isClosing, setIsClosing] = useState(false);
const handleClose = () => setIsClosing(true);
```

- [ ] **Step 3: Apply the closing animation pattern**

- Backdrop: add `${isClosing ? 'animate-fade-out' : ''}` to className and change `onClick={onClose}` → `onClick={handleClose}`
- Inner panel: toggle `animate-scale-in`/`animate-scale-out`, add `onAnimationEnd`
- All buttons that called `onClose()` → call `handleClose()`

- [ ] **Step 4: Validate TypeScript**

```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit
```
Expected: 0 errors.

---

### Task 8: Venue overlay closing animation (page.tsx)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add `venueClosing` state**

```tsx
const [venueClosing, setVenueClosing] = useState(false);
```

- [ ] **Step 2: Update `handleCloseVenue`**

Current:
```tsx
const handleCloseVenue = () => setSelectedVenue(null);
```

Replace:
```tsx
const handleCloseVenue = () => setVenueClosing(true);
```

- [ ] **Step 3: Update the venue overlay JSX**

Find the venue overlay block (around line 141–154). Update:

- Outer backdrop div: add `${venueClosing ? 'animate-fade-out' : ''}` and change `onClick={handleCloseVenue}`
- Inner `animate-scale-in` div:
```tsx
className={`relative w-full h-full sm:w-[95%] sm:h-[95%] lg:w-[90%] lg:h-[92%] sm:rounded-2xl liquid-glass overflow-hidden shadow-2xl shadow-black/50 flex flex-col ${venueClosing ? 'animate-scale-out' : 'animate-scale-in'}`}
onAnimationEnd={() => { if (venueClosing) { setVenueClosing(false); setSelectedVenue(null); } }}
```

- All close button `onClick` handlers inside the overlay should call `handleCloseVenue`.

- [ ] **Step 4: Validate TypeScript**

```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit
```
Expected: 0 errors.

---

## Chunk 3: FAB Desktop Fix + People Tagging

### Task 9: Move FAB to page.tsx and fix desktop positioning

**Files:**
- Modify: `src/components/FeedPage.tsx`
- Modify: `src/app/page.tsx`

**Context:** The FAB (`fixed bottom-24 right-6 lg:bottom-8 lg:right-8`) is currently inside `FeedPage`, which renders inside `<main className="overflow-y-auto">`. On `xl` screens the RightPanel is 320px wide (`w-80`). The FAB at `right-8` (32px) sits under the panel visually.

- [ ] **Step 1: Remove the FAB from `FeedPage.tsx`**

Delete the entire FAB button block at the bottom of FeedPage's return statement (lines ~559–567):
```tsx
{/* ── Floating Add Post FAB ────────────────────────────── */}
<button
  onClick={() => onOpenCreatePost()}
  className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 z-40 w-14 h-14 ..."
  title="Add Post"
>
  ...
</button>
```

- [ ] **Step 2: Add the FAB to `page.tsx` root level, below the modals section**

In `page.tsx`, after the `<CreateStoryModal>` line and before the Venue overlay block, add:

```tsx
{/* ── Feed Create Post FAB ────────────────────────────── */}
{activeTab === 'feed' && (
  <button
    onClick={() => setShowCreatePost(true)}
    className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 xl:right-[22rem] z-40 w-14 h-14 rounded-full bg-gradient-to-br from-noctvm-violet to-purple-600 shadow-lg shadow-noctvm-violet/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 border border-noctvm-violet/30"
    title="Add Post"
  >
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  </button>
)}
```

The key fix: `xl:right-[22rem]` (352px) clears the 320px right panel on xl+ screens.

- [ ] **Step 3: Validate TypeScript**

```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit
```
Expected: 0 errors.

---

### Task 10: People tagging in CreatePostModal

**Files:**
- Modify: `src/components/CreatePostModal.tsx`

- [ ] **Step 1: Add mock users list and `taggedUsers` state**

After `BUCHAREST_VENUES` const, add:
```tsx
const MOCK_USERS = [
  { handle: '@alexm_buc',   name: 'Alexandra M.' },
  { handle: '@mihai.deep',  name: 'Mihai D.' },
  { handle: '@ioana.rave',  name: 'Ioana R.' },
  { handle: '@stef.vinyl',  name: 'Stefan V.' },
  { handle: '@cat.party',   name: 'Catalina P.' },
  { handle: '@radu.night',  name: 'Radu N.' },
  { handle: '@diana.groove',name: 'Diana G.' },
];
```

Inside the component, add state:
```tsx
const [peopleSearch, setPeopleSearch] = useState('');
const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
const [showPeopleSuggestions, setShowPeopleSuggestions] = useState(false);
```

- [ ] **Step 2: Add filtered users derived value**

```tsx
const filteredUsers = MOCK_USERS.filter(u =>
  (u.handle.toLowerCase().includes(peopleSearch.toLowerCase()) ||
   u.name.toLowerCase().includes(peopleSearch.toLowerCase())) &&
  peopleSearch.length > 0 &&
  !taggedUsers.includes(u.handle)
);
```

- [ ] **Step 3: Add "Tag People" section in the form, between the "Tag Venue" section and the "Hashtags" section**

```tsx
{/* Tag people */}
<div className="px-4 py-3 border-b border-noctvm-border relative">
  <div className="flex items-center gap-2 flex-wrap">
    <span className="text-sm text-white flex-shrink-0">Tag People</span>
    {taggedUsers.map(handle => (
      <span key={handle} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-noctvm-violet/20 text-noctvm-violet text-xs border border-noctvm-violet/20">
        {handle}
        <button onClick={() => setTaggedUsers(prev => prev.filter(h => h !== handle))}>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </span>
    ))}
    <input
      type="text"
      placeholder="@username"
      value={peopleSearch}
      onChange={e => { setPeopleSearch(e.target.value); setShowPeopleSuggestions(true); }}
      onFocus={() => setShowPeopleSuggestions(true)}
      onBlur={() => setTimeout(() => setShowPeopleSuggestions(false), 150)}
      className="flex-1 min-w-[100px] bg-transparent text-sm text-white placeholder:text-noctvm-silver/40 outline-none"
    />
  </div>
  {showPeopleSuggestions && filteredUsers.length > 0 && (
    <div className="absolute left-4 right-4 top-full mt-1 bg-noctvm-midnight border border-noctvm-border rounded-xl overflow-hidden z-10 shadow-xl">
      {filteredUsers.map(u => (
        <button
          key={u.handle}
          onMouseDown={() => {
            setTaggedUsers(prev => [...prev, u.handle]);
            setPeopleSearch('');
            setShowPeopleSuggestions(false);
          }}
          className="w-full px-3 py-2.5 text-sm text-white hover:bg-noctvm-surface text-left transition-colors flex items-center gap-2"
        >
          <span className="font-medium">{u.name}</span>
          <span className="text-noctvm-silver text-xs">{u.handle}</span>
        </button>
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 4: Include `taggedUsers` in the Supabase insert**

In `handleSubmit`, update the insert object:
```tsx
.insert({
  user_id: user.id,
  caption: caption.trim(),
  image_url: imagePreview,
  venue_name: selectedVenue || null,
  tags,
  tagged_users: taggedUsers.length > 0 ? taggedUsers : null,
})
```

- [ ] **Step 5: Reset `taggedUsers` in `handleClose`**

Add to the reset block in `handleClose`:
```tsx
setTaggedUsers([]);
setPeopleSearch('');
```

- [ ] **Step 6: Validate TypeScript**

```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit
```
Expected: 0 errors.

---

## Chunk 4: StoriesViewerModal

### Task 11: Create StoriesViewerModal component

**Files:**
- Create: `src/components/StoriesViewerModal.tsx`

- [ ] **Step 1: Create the file with the full component**

```tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface StoryUser {
  name: string;
  avatar: string;
  color: string;
  hasNew: boolean;
}

interface StoriesViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: StoryUser[];
  startIndex?: number;
}

// Each user gets 1 mock story for now (image placeholder + color bg)
const STORY_DURATION_MS = 5000;

export default function StoriesViewerModal({ isOpen, onClose, users, startIndex = 0 }: StoriesViewerModalProps) {
  const [userIndex, setUserIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const handleClose = useCallback(() => setIsClosing(true), []);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setUserIndex(startIndex);
      setProgress(0);
      setIsClosing(false);
    }
  }, [isOpen, startIndex]);

  // Auto-advance timer
  useEffect(() => {
    if (!isOpen || isClosing) return;
    setProgress(0);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / STORY_DURATION_MS) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        // Advance to next user
        setUserIndex(prev => {
          const next = prev + 1;
          if (next >= users.length) {
            handleClose();
            return prev;
          }
          setProgress(0);
          startTimeRef.current = Date.now();
          return next;
        });
      }
    }, 50);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isOpen, isClosing, userIndex, users.length, handleClose]);

  const goNext = useCallback(() => {
    const next = userIndex + 1;
    if (next >= users.length) { handleClose(); return; }
    setUserIndex(next);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [userIndex, users.length, handleClose]);

  const goPrev = useCallback(() => {
    if (userIndex === 0) return;
    setUserIndex(prev => prev - 1);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [userIndex]);

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, goNext, goPrev, handleClose]);

  if (!isOpen && !isClosing) return null;

  const currentUser = users[userIndex];
  if (!currentUser) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black ${isClosing ? 'animate-fade-out' : ''}`}
      onAnimationEnd={() => { if (isClosing) { setIsClosing(false); onClose(); } }}
    >
      {/* Story card */}
      <div className={`relative w-full h-full max-w-sm mx-auto ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}`}>

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3 pt-safe">
          {users.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < userIndex ? '100%' : i === userIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-10 flex items-center gap-3 px-4">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentUser.color} flex items-center justify-center ring-2 ring-white/40 flex-shrink-0`}>
            <span className="text-xs font-bold text-white">{currentUser.avatar}</span>
          </div>
          <span className="text-sm font-semibold text-white drop-shadow">{currentUser.name}</span>
          <span className="text-[10px] text-white/60 font-mono">2h</span>
          <button
            onClick={handleClose}
            className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Story background */}
        <div className={`w-full h-full bg-gradient-to-br ${currentUser.color} flex items-center justify-center`}>
          <div className="text-center px-8 opacity-20">
            <span className="text-8xl font-bold text-white">{currentUser.avatar}</span>
          </div>
        </div>

        {/* Tap zones */}
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full cursor-pointer" onClick={goPrev} />
          <div className="flex-1 h-full cursor-pointer" onClick={goNext} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Validate TypeScript**

```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit
```
Expected: 0 errors.

---

### Task 12: Wire StoriesViewerModal to FeedPage story circles

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/FeedPage.tsx`

- [ ] **Step 1: Add stories viewer state to `page.tsx`**

```tsx
import StoriesViewerModal from '@/components/StoriesViewerModal';
import type { StoryUser } from '@/components/StoriesViewerModal';

// In state:
const [showStories, setShowStories] = useState(false);
const [storyStartIndex, setStoryStartIndex] = useState(0);
```

- [ ] **Step 2: Add `StoriesViewerModal` to `page.tsx` root render**

After `<CreateStoryModal .../>`:
```tsx
{/* ── Stories Viewer Modal ────────────────────────────── */}
<StoriesViewerModal
  isOpen={showStories}
  onClose={() => setShowStories(false)}
  users={FEED_STORY_USERS}
  startIndex={storyStartIndex}
/>
```

Where `FEED_STORY_USERS` is a constant defined in `page.tsx` (copy STORY_USERS from FeedPage or import from a shared location). Define it at the top of the file (outside the component):

```tsx
const FEED_STORY_USERS: StoryUser[] = [
  { name: 'Alexandra', avatar: 'A', hasNew: true,  color: 'from-red-500 to-orange-500' },
  { name: 'Mihai',     avatar: 'M', hasNew: true,  color: 'from-blue-500 to-cyan-500' },
  { name: 'Ioana',     avatar: 'I', hasNew: true,  color: 'from-emerald-500 to-teal-500' },
  { name: 'Stefan',    avatar: 'S', hasNew: false, color: 'from-noctvm-violet to-purple-500' },
  { name: 'Catalina',  avatar: 'C', hasNew: true,  color: 'from-pink-500 to-rose-500' },
  { name: 'Andrei',    avatar: 'R', hasNew: false, color: 'from-amber-500 to-orange-500' },
  { name: 'Diana',     avatar: 'D', hasNew: true,  color: 'from-indigo-500 to-blue-500' },
];
```

- [ ] **Step 3: Add `onOpenStories` prop to `FeedPage`**

In `FeedPage.tsx`, add to `FeedPageProps`:
```tsx
onOpenStories: (index: number) => void;
```

Update the function signature:
```tsx
export default function FeedPage({ onVenueClick, onOpenCreatePost, onOpenCreateStory, onOpenStories }: FeedPageProps)
```

- [ ] **Step 4: Wire story bubble clicks in FeedPage**

Find the `STORY_USERS.map(...)` section in FeedPage (around line 362–371). Change each story bubble div to call `onOpenStories(i)`:

```tsx
{STORY_USERS.map((su, i) => (
  <div
    key={su.name}
    onClick={() => onOpenStories(i)}
    className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
  >
    ...
  </div>
))}
```

- [ ] **Step 5: Pass `onOpenStories` from `page.tsx` to `FeedPage`**

In `page.tsx`, find the `<FeedPage>` JSX and add:
```tsx
onOpenStories={(index) => { setStoryStartIndex(index); setShowStories(true); }}
```

- [ ] **Step 6: Validate TypeScript**

```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit
```
Expected: 0 errors.

---

## Chunk 5: Highlights — Functional Profile Section

### Task 13: Functional Highlights in UserProfilePage

**Files:**
- Modify: `src/components/UserProfilePage.tsx`

**Design:** Highlights are local React state (no Supabase). A highlight has `{ id, name, color }`. The "New" circle opens an inline mini-form (name input + color swatches). Clicking a highlight calls `onOpenStories?.()`.

- [ ] **Step 1: Add Highlight type and state**

At the top of the file (outside the component), add:
```tsx
interface Highlight {
  id: string;
  name: string;
  color: string; // Tailwind gradient classes
}

const HIGHLIGHT_COLORS = [
  'from-noctvm-violet to-purple-500',
  'from-pink-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-blue-500 to-cyan-500',
  'from-red-500 to-pink-500',
];
```

Inside the component, add state:
```tsx
const [highlights, setHighlights] = useState<Highlight[]>([]);
const [showNewHighlight, setShowNewHighlight] = useState(false);
const [newHighlightName, setNewHighlightName] = useState('');
const [newHighlightColor, setNewHighlightColor] = useState(HIGHLIGHT_COLORS[0]);
```

- [ ] **Step 2: Add `onOpenStories` to `UserProfilePageProps`**

```tsx
interface UserProfilePageProps {
  onOpenAuth: () => void;
  onSettingsClick: () => void;
  onOpenCreatePost?: () => void;
  onOpenStories?: (index: number) => void;
}
```

Update function signature.

- [ ] **Step 3: Add `createHighlight` helper**

```tsx
const createHighlight = () => {
  const name = newHighlightName.trim();
  if (!name) return;
  setHighlights(prev => [...prev, { id: Date.now().toString(), name, color: newHighlightColor }]);
  setNewHighlightName('');
  setNewHighlightColor(HIGHLIGHT_COLORS[0]);
  setShowNewHighlight(false);
};
```

- [ ] **Step 4: Replace the highlights section JSX**

Find the Story Highlights section (around line 125–137):
```tsx
{/* ── Story highlights ──────────────────────────────────── */}
<div className="border-t border-noctvm-border px-4 py-4">
  <div className="flex gap-4 overflow-x-auto scrollbar-hide">
    {/* "New" button */}
    <div className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer" onClick={() => setShowNewHighlight(true)}>
      <div className="w-16 h-16 rounded-full bg-noctvm-surface border-2 border-dashed border-noctvm-border flex items-center justify-center hover:border-noctvm-violet/40 transition-colors">
        <svg className="w-6 h-6 text-noctvm-silver" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <span className="text-[9px] text-noctvm-silver">New</span>
    </div>

    {/* Existing highlights */}
    {highlights.map((hl, i) => (
      <div
        key={hl.id}
        onClick={() => onOpenStories?.(i)}
        className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer group"
      >
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${hl.color} flex items-center justify-center ring-2 ring-noctvm-border group-hover:ring-noctvm-violet/50 transition-all`}>
          <span className="text-xl font-bold text-white">{hl.name[0].toUpperCase()}</span>
        </div>
        <span className="text-[9px] text-noctvm-silver truncate max-w-[64px] text-center">{hl.name}</span>
      </div>
    ))}
  </div>

  {/* Inline "New Highlight" form */}
  {showNewHighlight && (
    <div className="mt-3 p-3 bg-noctvm-surface rounded-xl border border-noctvm-border animate-scale-in">
      <p className="text-xs font-semibold text-white mb-2">New Highlight</p>
      <input
        type="text"
        value={newHighlightName}
        onChange={e => setNewHighlightName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') createHighlight(); if (e.key === 'Escape') setShowNewHighlight(false); }}
        placeholder="Name this highlight..."
        autoFocus
        maxLength={20}
        className="w-full bg-noctvm-midnight border border-noctvm-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-noctvm-silver/40 outline-none focus:border-noctvm-violet/50 mb-2"
      />
      <div className="flex gap-2 mb-3">
        {HIGHLIGHT_COLORS.map(c => (
          <button
            key={c}
            onClick={() => setNewHighlightColor(c)}
            className={`w-6 h-6 rounded-full bg-gradient-to-br ${c} transition-transform ${newHighlightColor === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={createHighlight}
          disabled={!newHighlightName.trim()}
          className="flex-1 py-1.5 rounded-lg bg-noctvm-violet text-white text-xs font-semibold disabled:opacity-40 hover:bg-noctvm-violet/90 transition-colors"
        >
          Create
        </button>
        <button
          onClick={() => setShowNewHighlight(false)}
          className="flex-1 py-1.5 rounded-lg bg-noctvm-surface border border-noctvm-border text-noctvm-silver text-xs hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )}
</div>
```

- [ ] **Step 5: Pass `onOpenStories` from `page.tsx` to `UserProfilePage`**

In `page.tsx`, find `<UserProfilePage ...>` and add:
```tsx
onOpenStories={(index) => { setStoryStartIndex(index); setShowStories(true); }}
```

- [ ] **Step 6: Validate TypeScript**

```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit
```
Expected: 0 errors.

---

## Final Validation

- [ ] **Run full TypeScript check**

```bash
cd C:\Users\cipri\NOCTVM && npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Visual checks (start dev server and verify)**

1. **Price tags**: Open Events page on desktop — cards show emerald green pill badges matching the modal
2. **EventDetailModal**: Click a card → modal opens with scale-in animation; press ✕ → smooth scale-out + fade
3. **Back button**: Tap cog from Feed tab → tap back → should return to Feed (not Profile)
4. **Create Post FAB**: Switch to Feed tab on desktop → FAB visible at bottom-right, not under the right panel
5. **Create Post (signed out)**: Click FAB while logged out → shows "Sign In" button, not "Close"
6. **Tag People**: Open Create Post (signed in) → "Tag People" row visible → type a name → dropdown appears
7. **Stories**: Click a story bubble in Feed → full-screen viewer opens with progress bars; auto-advances; X closes with animation
8. **Highlights**: Go to Profile → click "New" circle → form appears → enter name + pick color → highlight circle appears → click it → stories viewer opens
9. **Venue overlay**: Open a venue → ✕ → smooth fade-out animation

- [ ] **Commit everything**

```bash
cd C:\Users\cipri\NOCTVM
git add -A
git commit -m "feat: stories viewer, highlights, people tagging, closing animations, price tag unification, back nav fix, FAB desktop fix, sign-in prompts"
```
