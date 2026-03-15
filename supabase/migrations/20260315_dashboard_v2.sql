-- ─────────────────────────────────────────────────────────────────────────────
-- NOCTVM: Command Center & RBAC Migration
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create Role and Badge Enums
do $$ 
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'owner', 'user');
  end if;
  if not exists (select 1 from pg_type where typname = 'badge_type') then
    create type badge_type as enum ('none', 'blue', 'gold');
  end if;
end $$;

-- 2. Update Profiles Table
alter table public.profiles 
  add column if not exists role user_role not null default 'user',
  add column if not exists badge badge_type not null default 'none',
  add column if not exists is_verified boolean not null default false;

-- 3. Update Venues Table
alter table public.venues
  add column if not exists owner_id uuid references public.profiles(id),
  add column if not exists badge badge_type not null default 'none',
  add column if not exists is_verified boolean not null default false,
  add column if not exists featured boolean not null default false,
  add column if not exists view_count integer not null default 0,
  add column if not exists save_count integer not null default 0;

-- 4. Update Events Table
alter table public.events
  add column if not exists featured boolean not null default false,
  add column if not exists view_count integer not null default 0,
  add column if not exists save_count integer not null default 0;

-- 5. Update RLS Policies

-- Venues: Admins can do everything. Owners can update their own venue.
create policy "Admins can manage all venues"
  on public.venues for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Owners can update their own venues"
  on public.venues for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Events: Admins can do everything. Owners can manage events at their venues.
create policy "Admins can manage all events"
  on public.events for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Owners can manage events at their venues"
  on public.events for all
  using (
    exists (
      select 1 from venues 
      where venues.name = events.venue 
      and venues.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from venues 
      where venues.name = events.venue 
      and venues.owner_id = auth.uid()
    )
  );

-- Function to increment counts (to be called via RPC)
create or replace function increment_view_count(table_name text, row_id uuid)
returns void as $$
begin
  if table_name = 'events' then
    update events set view_count = view_count + 1 where id = row_id;
  elsif table_name = 'venues' then
    update venues set view_count = view_count + 1 where id = row_id;
  end if;
end;
$$ language plpgsql security definer;
