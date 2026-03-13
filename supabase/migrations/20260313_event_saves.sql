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
