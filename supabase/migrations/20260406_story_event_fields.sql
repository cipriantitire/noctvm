-- Add event tagging support to stories.

alter table public.stories
  add column if not exists event_id uuid references public.events(id) on delete set null,
  add column if not exists event_title text;

create index if not exists stories_event_id_idx on public.stories (event_id);