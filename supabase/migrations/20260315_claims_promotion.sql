-- ─────────────────────────────────────────────────────────────────────────────
-- NOCTVM: Venue Claims & Event Promotion Migration
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create Venue Claims Table
create table if not exists public.venue_claims (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) not null,
  user_id uuid references public.profiles(id) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  documents text[] not null default '{}',
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Add is_promoted to Events Table
alter table public.events
  add column if not exists is_promoted boolean not null default false;

-- 3. Enable RLS on venue_claims
alter table public.venue_claims enable row level security;

-- 4. RLS Policies for venue_claims
create policy "Users can see their own claims"
  on public.venue_claims for select
  using (auth.uid() = user_id);

create policy "Admins can see all claims"
  on public.venue_claims for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Users can create claims"
  on public.venue_claims for insert
  with check (auth.uid() = user_id);

create policy "Admins can update claims"
  on public.venue_claims for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 5. Update events sort logic (implicit in queries)
-- We will handle sorting by is_promoted in the frontend/backend queries.
