-- migrate:up
begin;

-- 1) event_saves: private saves (owner-only visibility)
do $$
begin
  if to_regclass('public.event_saves') is not null then
    alter table public.event_saves enable row level security;

    drop policy if exists "event_saves_read" on public.event_saves;
    drop policy if exists "public read" on public.event_saves;
    drop policy if exists "event_saves_select_own" on public.event_saves;
    drop policy if exists "owner select" on public.event_saves;

    drop policy if exists "event_saves_insert" on public.event_saves;
    drop policy if exists "owner insert" on public.event_saves;
    drop policy if exists "event_saves_insert_own" on public.event_saves;

    drop policy if exists "event_saves_delete" on public.event_saves;
    drop policy if exists "owner delete" on public.event_saves;
    drop policy if exists "event_saves_delete_own" on public.event_saves;

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

-- 2) post_likes: only own likes + followed users' likes
do $$
declare
  follows_clause text := '';
  visibility_clause text := 'auth.uid() = user_id';
begin
  if to_regclass('public.post_likes') is not null then
    alter table public.post_likes enable row level security;

    drop policy if exists "post_likes_read" on public.post_likes;
    drop policy if exists "post_likes_select_all" on public.post_likes;
    drop policy if exists "post_likes_select" on public.post_likes;
    drop policy if exists "post_likes_select_following_or_self" on public.post_likes;

    drop policy if exists "post_likes_insert" on public.post_likes;
    drop policy if exists "post_likes_insert_own" on public.post_likes;

    drop policy if exists "post_likes_delete" on public.post_likes;
    drop policy if exists "post_likes_delete_own" on public.post_likes;

    if to_regclass('public.follows') is not null then
      if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'follows'
          and column_name = 'target_id'
      ) then
        follows_clause := '(f.target_type = ''user'' and f.target_id::text = post_likes.user_id::text)';
      end if;

      if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'follows'
          and column_name = 'following_id'
      ) then
        follows_clause := case
          when follows_clause = ''
            then '(f.target_type = ''user'' and f.following_id::text = post_likes.user_id::text)'
          else follows_clause || ' or (f.target_type = ''user'' and f.following_id::text = post_likes.user_id::text)'
        end;
      end if;
    end if;

    if follows_clause <> ''
       and exists (
         select 1
         from information_schema.columns
         where table_schema = 'public'
           and table_name = 'follows'
           and column_name = 'follower_id'
       ) then
      visibility_clause := visibility_clause || format(
        ' or exists (
            select 1
            from public.follows f
            where f.follower_id = auth.uid()
              and (%s)
          )',
        follows_clause
      );
    end if;

    execute format(
      'create policy "post_likes_select_following_or_self"
         on public.post_likes
         for select
         using (%s)',
      visibility_clause
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

-- 3) profiles: block client-side writes to role/badge/is_verified
do $$
begin
  if to_regclass('public.profiles') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'profiles'
         and column_name = 'role'
     )
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'profiles'
         and column_name = 'badge'
     )
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'profiles'
         and column_name = 'is_verified'
     ) then
    create or replace function public.profiles_block_sensitive_client_updates()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    begin
      if coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
         and (
           new.role is distinct from old.role
           or new.badge is distinct from old.badge
           or new.is_verified is distinct from old.is_verified
         ) then
        raise exception 'Updating role, badge, or is_verified is restricted to service_role';
      end if;
      return new;
    end;
    $fn$;

    drop trigger if exists profiles_block_sensitive_client_updates on public.profiles;
    create trigger profiles_block_sensitive_client_updates
      before update on public.profiles
      for each row
      execute function public.profiles_block_sensitive_client_updates();
  end if;
end $$;

commit;

-- migrate:down (rollback plan; run manually if revert is required)
-- begin;
-- do $$
-- begin
--   if to_regclass('public.event_saves') is not null then
--     drop policy if exists "event_saves_select_own" on public.event_saves;
--     drop policy if exists "event_saves_insert_own" on public.event_saves;
--     drop policy if exists "event_saves_delete_own" on public.event_saves;
--     create policy "event_saves_read" on public.event_saves for select using (true);
--     create policy "event_saves_insert" on public.event_saves for insert with check (auth.uid() = user_id);
--     create policy "event_saves_delete" on public.event_saves for delete using (auth.uid() = user_id);
--   end if;
-- end $$;
-- do $$
-- begin
--   if to_regclass('public.post_likes') is not null then
--     drop policy if exists "post_likes_select_following_or_self" on public.post_likes;
--     drop policy if exists "post_likes_insert_own" on public.post_likes;
--     drop policy if exists "post_likes_delete_own" on public.post_likes;
--     create policy "post_likes_read" on public.post_likes for select using (true);
--     create policy "post_likes_insert" on public.post_likes for insert with check (auth.uid() = user_id);
--     create policy "post_likes_delete" on public.post_likes for delete using (auth.uid() = user_id);
--   end if;
-- end $$;
-- do $$
-- begin
--   if to_regclass('public.profiles') is not null then
--     drop trigger if exists profiles_block_sensitive_client_updates on public.profiles;
--     drop function if exists public.profiles_block_sensitive_client_updates();
--   end if;
-- end $$;
-- commit;
