-- migrate:up
begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Event snapshot columns on posts
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.posts') is not null then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'posts' and column_name = 'event_id'
    ) then
      alter table public.posts add column event_id uuid references public.events(id) on delete set null;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'posts' and column_name = 'event_title'
    ) then
      alter table public.posts add column event_title text;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'posts' and column_name = 'event_date'
    ) then
      -- Stored as text snapshot for resilience (display-only, no date arithmetic needed)
      alter table public.posts add column event_date text;
    end if;
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'posts' and column_name = 'event_venue'
    ) then
      alter table public.posts add column event_venue text;
    end if;
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. reposts table
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.reposts (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  post_id     uuid        not null references public.posts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint reposts_unique unique (user_id, post_id)
);

alter table public.reposts enable row level security;

drop policy if exists "reposts_select_own" on public.reposts;
create policy "reposts_select_own"
  on public.reposts for select
  using (auth.uid() = user_id);

drop policy if exists "reposts_insert_own" on public.reposts;
create policy "reposts_insert_own"
  on public.reposts for insert
  with check (auth.uid() = user_id);

drop policy if exists "reposts_delete_own" on public.reposts;
create policy "reposts_delete_own"
  on public.reposts for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. reward_config table + public view (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.reward_config (
  id          serial      primary key,
  action      text        not null unique,
  reward_value int        not null default 0,
  daily_cap   int,
  total_cap   int,
  updated_at  timestamptz not null default now()
);

alter table public.reward_config enable row level security;

drop policy if exists "reward_config_admin_only" on public.reward_config;
create policy "reward_config_admin_only"
  on public.reward_config
  for all
  using (coalesce(auth.jwt() ->> 'role', '') = 'service_role')
  with check (coalesce(auth.jwt() ->> 'role', '') = 'service_role');

create or replace view public.reward_config_public as
  select action, reward_value, daily_cap
  from public.reward_config;

-- Seed default reward values (skip if already present)
insert into public.reward_config (action, reward_value, daily_cap) values
  ('signup',    500, null),
  ('post',       10,   10),
  ('repost',      5,   20),
  ('like',        1,   50),
  ('referral',  100, null)
on conflict (action) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. repost_post RPC
--    p_dry_run = true  → validate only (no insert), returns reward_value
--    p_dry_run = false → insert repost row, returns reward_value
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.repost_post(
  p_post_id uuid,
  p_dry_run  boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_reward    int  := 0;
  v_already   boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Check if post exists
  if not exists (select 1 from public.posts where id = p_post_id) then
    raise exception 'Post not found';
  end if;

  -- Cannot repost own post
  if exists (select 1 from public.posts where id = p_post_id and user_id = v_user_id) then
    raise exception 'Cannot repost your own post';
  end if;

  -- Already reposted?
  select exists(
    select 1 from public.reposts where user_id = v_user_id and post_id = p_post_id
  ) into v_already;

  if v_already then
    raise exception 'Already reposted';
  end if;

  -- Fetch reward value from authoritative config
  select coalesce(
    (select reward_value from public.reward_config where action = 'repost'),
    5
  ) into v_reward;

  if p_dry_run then
    return jsonb_build_object('ok', true, 'reward', v_reward, 'dry_run', true);
  end if;

  -- Insert repost
  insert into public.reposts (user_id, post_id) values (v_user_id, p_post_id);

  -- Credit moonrays if wallet table exists
  if to_regclass('public.moonrays_wallets') is not null and v_reward > 0 then
    insert into public.moonrays_wallets (user_id, balance, net_earned)
      values (v_user_id, v_reward, v_reward)
      on conflict (user_id) do update
        set balance    = moonrays_wallets.balance + excluded.balance,
            net_earned = moonrays_wallets.net_earned + excluded.net_earned;
  end if;

  return jsonb_build_object('ok', true, 'reward', v_reward, 'dry_run', false);
end;
$$;

commit;

-- migrate:down (rollback; run manually if reverting)
-- begin;
-- drop function if exists public.repost_post(uuid, boolean);
-- drop view  if exists public.reward_config_public;
-- drop table if exists public.reward_config;
-- drop table if exists public.reposts;
-- do $$
-- begin
--   if to_regclass('public.posts') is not null then
--     alter table public.posts
--       drop column if exists event_id,
--       drop column if exists event_title,
--       drop column if exists event_date,
--       drop column if exists event_venue;
--   end if;
-- end $$;
-- commit;
