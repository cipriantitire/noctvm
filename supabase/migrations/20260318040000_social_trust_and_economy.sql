-- migrate:up
-- ============================================================================
-- NOCTVM: Social Trust & Economy
-- - reward_config: server-authoritative reward config table (admin-only write)
-- - reward_config_public: view for authenticated client reads (hints-only, no authority)
-- - mutual_connections: denormalized mutual-follow cache for scalable friends feed
-- - follow_change_queue: audit/processing queue for follow change events
-- - reposts: content repost records with unique-per-user-post constraint
-- - get_feed_posts_v5: friends feed RPC using mutual_connections cache
-- - RLS re-hardening for event_saves and post_likes (idempotent)
-- ============================================================================

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. reward_config
-- Server-authoritative. Only service_role may insert/update/delete.
-- authenticated users may read via the public view below.
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.reward_config (
  id           uuid        primary key default gen_random_uuid(),
  action_key   text        not null unique,          -- e.g. 'post_story', 'referral'
  label        text        not null,                 -- display name
  description  text        not null default '',      -- hint shown in UI
  icon         text        not null default '🌙',    -- emoji / icon token
  amount       integer     not null check (amount >= 0),
  daily_cap    integer     null check (daily_cap is null or daily_cap >= 0),
  is_active    boolean     not null default true,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.reward_config enable row level security;

-- Only service_role can manage reward configs
drop policy if exists "reward_config_service_all"  on public.reward_config;
create policy "reward_config_service_all"
  on public.reward_config
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

-- Authenticated users may read active config (hints-only; server validates)
drop policy if exists "reward_config_authenticated_read" on public.reward_config;
create policy "reward_config_authenticated_read"
  on public.reward_config
  for select
  using (auth.uid() is not null and is_active = true);

-- Seed canonical reward tiers (idempotent via ON CONFLICT DO NOTHING)
insert into public.reward_config
  (action_key, label, description, icon, amount, daily_cap, sort_order)
values
  ('post_story',  'Socialite',  'Post stories & feed updates',     '🎭', 15,  50,  1),
  ('referral',    'Connector',  'Build your referral network',      '🤝', 100, null, 2),
  ('venue_review','Taster',     'Review & rate locations',          '⭐', 25,  75,  3),
  ('event_scan',  'Explorer',   'Scan tickets at events',           '🎫', 50,  100, 4),
  ('repost',      'Amplifier',  'Repost content to your followers', '🔁', 5,   25,  5)
on conflict (action_key) do nothing;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. reward_config_public view
-- Exposes only the columns the UI needs; amount is intentionally included so
-- the UI can display hints, but server-side RPC is the only authority.
-- ────────────────────────────────────────────────────────────────────────────

create or replace view public.reward_config_public
  with (security_invoker = true)
as
select
  action_key,
  label,
  description,
  icon,
  amount,
  daily_cap,
  sort_order
from public.reward_config
where is_active = true
order by sort_order;

grant select on public.reward_config_public to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. mutual_connections cache
-- Denormalized table: one row per (user_a, user_b) mutual-follow pair.
-- user_a < user_b (canonical ordering to avoid duplicates).
-- Maintained by trigger on the follows table.
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.mutual_connections (
  user_a     uuid        not null references public.profiles(id) on delete cascade,
  user_b     uuid        not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create index if not exists idx_mutual_connections_a on public.mutual_connections (user_a);
create index if not exists idx_mutual_connections_b on public.mutual_connections (user_b);

alter table public.mutual_connections enable row level security;

-- A user may only see their own mutual connections
drop policy if exists "mutual_connections_select_own" on public.mutual_connections;
create policy "mutual_connections_select_own"
  on public.mutual_connections
  for select
  using (auth.uid() = user_a or auth.uid() = user_b);

-- Only the maintenance function (security definer) may insert/delete
drop policy if exists "mutual_connections_service_write" on public.mutual_connections;
create policy "mutual_connections_service_write"
  on public.mutual_connections
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

-- ────────────────────────────────────────────────────────────────────────────
-- 4. follow_change_queue
-- Lightweight audit/processing queue.  Rows are written by the trigger and
-- consumed by a background worker or cron (mark processed_at).
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.follow_change_queue (
  id            bigserial   primary key,
  follower_id   uuid        not null,
  following_id  uuid        not null,
  action        text        not null check (action in ('follow', 'unfollow')),
  enqueued_at   timestamptz not null default now(),
  processed_at  timestamptz null
);

create index if not exists idx_follow_change_queue_unprocessed
  on public.follow_change_queue (processed_at)
  where processed_at is null;

alter table public.follow_change_queue enable row level security;

-- Service role only for the queue; end-users must not read each other's queued events
drop policy if exists "follow_change_queue_service_all" on public.follow_change_queue;
create policy "follow_change_queue_service_all"
  on public.follow_change_queue
  for all
  using (auth.jwt() ->> 'role' = 'service_role')
  with check (auth.jwt() ->> 'role' = 'service_role');

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Trigger: maintain mutual_connections + enqueue follow changes
-- Runs AFTER INSERT / DELETE on public.follows (target_type = 'user').
-- Safety: SECURITY DEFINER so it can bypass RLS on mutual_connections.
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.fn_follows_sync_mutuals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a uuid;
  v_b uuid;
begin
  if tg_op = 'INSERT' then
    -- Only process user follows
    if new.target_type <> 'user' then
      return new;
    end if;

    -- Enqueue for audit/processing
    insert into public.follow_change_queue (follower_id, following_id, action)
    values (new.follower_id, new.following_id, 'follow');

    -- Check if the reverse follow already exists → mutual
    if exists (
      select 1
      from public.follows
      where follower_id = new.following_id
        and following_id = new.follower_id
        and target_type = 'user'
    ) then
      -- Insert canonical pair (smaller uuid first)
      v_a := least(new.follower_id, new.following_id);
      v_b := greatest(new.follower_id, new.following_id);
      insert into public.mutual_connections (user_a, user_b)
      values (v_a, v_b)
      on conflict (user_a, user_b) do nothing;
    end if;

  elsif tg_op = 'DELETE' then
    if old.target_type <> 'user' then
      return old;
    end if;

    -- Enqueue unfollow event
    insert into public.follow_change_queue (follower_id, following_id, action)
    values (old.follower_id, old.following_id, 'unfollow');

    -- Remove mutual entry (canonical pair)
    v_a := least(old.follower_id, old.following_id);
    v_b := greatest(old.follower_id, old.following_id);
    delete from public.mutual_connections
    where user_a = v_a and user_b = v_b;
  end if;

  return coalesce(new, old);
end;
$$;

-- Attach trigger only if follows table exists
do $$
begin
  if to_regclass('public.follows') is not null then
    drop trigger if exists trg_follows_sync_mutuals on public.follows;
    create trigger trg_follows_sync_mutuals
      after insert or delete
      on public.follows
      for each row
      execute function public.fn_follows_sync_mutuals();
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 5b. Back-fill mutual_connections from existing follows data
-- Idempotent: ON CONFLICT DO NOTHING.
-- ────────────────────────────────────────────────────────────────────────────

do $$
begin
  if to_regclass('public.follows') is not null then
    insert into public.mutual_connections (user_a, user_b)
    select
      least(a.follower_id, a.following_id),
      greatest(a.follower_id, a.following_id)
    from public.follows a
    join public.follows b
      on  b.follower_id  = a.following_id
      and b.following_id = a.follower_id
      and b.target_type  = 'user'
    where a.target_type = 'user'
      and a.follower_id < a.following_id
    on conflict (user_a, user_b) do nothing;
  end if;
end $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. reposts
-- One repost per (user_id, post_id) enforced by unique constraint.
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.reposts (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  post_id     uuid        not null,
  created_at  timestamptz not null default now(),
  unique (user_id, post_id)
);

create index if not exists idx_reposts_user_id on public.reposts (user_id);
create index if not exists idx_reposts_post_id on public.reposts (post_id);

alter table public.reposts enable row level security;

-- Users may see reposts of content in their visible scope (simplest: own reposts + public)
drop policy if exists "reposts_select_own"   on public.reposts;
drop policy if exists "reposts_select_public" on public.reposts;
create policy "reposts_select_own"
  on public.reposts
  for select
  using (auth.uid() = user_id);

create policy "reposts_insert_own"
  on public.reposts
  for insert
  with check (auth.uid() = user_id);

create policy "reposts_delete_own"
  on public.reposts
  for delete
  using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. get_feed_posts_v5
-- Friends/Mutuals mode uses mutual_connections cache to avoid O(N^2) join.
-- mode: 'friends' | 'following' | 'explore'
-- Returns posts with basic profile join; pagination via cursor (before_id).
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.get_feed_posts_v5(
  p_mode      text    default 'following',
  p_city      text    default null,
  p_limit     integer default 40,
  p_before_id uuid    default null
)
returns table (
  id          uuid,
  user_id     uuid,
  content     text,
  image_url   text,
  venue_name  text,
  city        text,
  created_at  timestamptz,
  display_name text,
  username    text,
  avatar_url  text,
  is_verified boolean,
  badge       text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    raise exception 'Authentication required';
  end if;

  if p_mode not in ('friends', 'following', 'explore') then
    raise exception 'Invalid mode: %', p_mode;
  end if;

  return query
  select
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.venue_name,
    p.city,
    p.created_at,
    pr.display_name,
    pr.username,
    pr.avatar_url,
    pr.is_verified,
    pr.badge::text
  from public.posts p
  join public.profiles pr on pr.id = p.user_id
  where
    -- City filter (optional)
    (p_city is null or p.city = p_city)
    -- Cursor-based pagination
    and (p_before_id is null or p.created_at < (select created_at from public.posts where id = p_before_id))
    -- Mode-specific author filter
    and (
      case p_mode
        when 'friends' then
          -- Use mutual_connections cache: O(1) index lookup instead of O(N^2) join
          exists (
            select 1
            from public.mutual_connections mc
            where (mc.user_a = v_caller and mc.user_b = p.user_id)
               or (mc.user_b = v_caller and mc.user_a = p.user_id)
          )
        when 'following' then
          p.user_id = v_caller
          or exists (
            select 1
            from public.follows f
            where f.follower_id = v_caller
              and f.following_id = p.user_id
              and f.target_type = 'user'
          )
          or exists (
            select 1
            from public.follows fv
            where fv.follower_id = v_caller
              and fv.target_type = 'venue'
              and fv.target_id::text = p.venue_name
          )
        when 'explore' then
          p.user_id <> v_caller
          and not exists (
            select 1
            from public.follows f2
            where f2.follower_id = v_caller
              and f2.following_id = p.user_id
              and f2.target_type = 'user'
          )
        else false
      end
    )
  order by p.created_at desc
  limit p_limit;
end;
$$;

revoke all on function public.get_feed_posts_v5(text, text, integer, uuid) from public;
grant execute on function public.get_feed_posts_v5(text, text, integer, uuid) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 8. Re-harden RLS on event_saves and post_likes (idempotent)
-- Ensures the USING (true) historical leak pattern is fully removed.
-- ────────────────────────────────────────────────────────────────────────────

do $$
begin
  if to_regclass('public.event_saves') is not null then
    alter table public.event_saves enable row level security;

    -- Drop any permissive catch-all policies
    drop policy if exists "public read"              on public.event_saves;
    drop policy if exists "event_saves_read"         on public.event_saves;
    drop policy if exists "allow_all_read"           on public.event_saves;

    -- Ensure owner-only policies exist (idempotent)
    drop policy if exists "event_saves_select_own"   on public.event_saves;
    drop policy if exists "event_saves_insert_own"   on public.event_saves;
    drop policy if exists "event_saves_delete_own"   on public.event_saves;

    create policy "event_saves_select_own"
      on public.event_saves
      for select
      using (auth.uid() = user_id);

    create policy "event_saves_insert_own"
      on public.event_saves
      for insert
      with check (auth.uid() = user_id);

    create policy "event_saves_delete_own"
      on public.event_saves
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if to_regclass('public.post_likes') is not null then
    alter table public.post_likes enable row level security;

    drop policy if exists "public read"                         on public.post_likes;
    drop policy if exists "post_likes_read"                     on public.post_likes;
    drop policy if exists "post_likes_select_all"               on public.post_likes;
    drop policy if exists "allow_all_read"                      on public.post_likes;
    drop policy if exists "post_likes_select_following_or_self" on public.post_likes;
    drop policy if exists "post_likes_insert_own"               on public.post_likes;
    drop policy if exists "post_likes_delete_own"               on public.post_likes;

    -- Own likes + likes from followed users
    execute format(
      $pol$
      create policy "post_likes_select_following_or_self"
        on public.post_likes
        for select
        using (
          auth.uid() = user_id
          or exists (
            select 1
            from public.follows f
            where f.follower_id = auth.uid()
              and f.following_id = post_likes.user_id
              and f.target_type = 'user'
          )
        )
      $pol$
    );

    create policy "post_likes_insert_own"
      on public.post_likes
      for insert
      with check (auth.uid() = user_id);

    create policy "post_likes_delete_own"
      on public.post_likes
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

commit;

-- ============================================================================
-- migrate:down  (rollback — run manually; companion rollback script)
-- ============================================================================
-- begin;
--
-- drop trigger  if exists trg_follows_sync_mutuals           on public.follows;
-- drop function if exists public.fn_follows_sync_mutuals();
-- drop function if exists public.get_feed_posts_v5(text, text, integer, uuid);
--
-- drop view     if exists public.reward_config_public;
-- drop table    if exists public.reposts;
-- drop table    if exists public.follow_change_queue;
-- drop table    if exists public.mutual_connections;
-- drop table    if exists public.reward_config;
--
-- -- Restore permissive read on post_likes / event_saves ONLY if intentional
-- -- (these were already hardened by 20260318_production_social_hardening.sql)
--
-- commit;
