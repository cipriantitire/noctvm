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
-- Active stories visible to everyone; all stories visible to their owner (for highlight picker)
alter table public.stories enable row level security;

create policy "stories_select_public" on public.stories for select
  using (expires_at > now() or auth.uid() = user_id);

create policy "stories_insert_own" on public.stories for insert
  with check (auth.uid() = user_id);

create policy "stories_delete_own" on public.stories for delete
  using (auth.uid() = user_id);
