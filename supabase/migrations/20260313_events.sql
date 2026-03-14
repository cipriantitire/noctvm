-- ─────────────────────────────────────────────────────────────────────────────
-- NOCTVM: events table
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.events (
  id          uuid        default gen_random_uuid() primary key,
  source      text        not null,
  title       text        not null,
  venue       text        not null,
  date        date        not null,
  time        text,
  description text,
  image_url   text        not null default '',
  event_url   text        not null,
  genres      text[]      not null default '{}',
  price       text,
  rating      numeric(3,1),
  reviews     integer,
  city        text        not null default 'Bucharest',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- deduplicate by (title + venue + date + source)
  unique (title, venue, date, source)
);

-- Enable RLS
alter table public.events enable row level security;

-- Anyone can read events (public data)
create policy "Events are publicly readable"
  on public.events for select using (true);

-- Only service_role can insert/update (cron job uses service_role key)
create policy "Service role can manage events"
  on public.events for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Index for common queries
create index if not exists events_date_city_idx on public.events (date, city);
create index if not exists events_source_idx    on public.events (source);
