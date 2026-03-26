-- post_saves: tracks which users saved which posts
create table if not exists post_saves (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

alter table post_saves enable row level security;

-- anyone can see who saved what if it's public, or maybe keep it private?
-- typically saved posts are PRIVATE for the user only.
create policy "post_saves_read"   on post_saves 
  for select using (auth.uid() = user_id);

create policy "post_saves_insert" on post_saves 
  for insert with check (auth.uid() = user_id);

create policy "post_saves_delete" on post_saves 
  for delete using (auth.uid() = user_id);

create index if not exists post_saves_user_id_idx  on post_saves(user_id);
create index if not exists post_saves_post_id_idx on post_saves(post_id);
