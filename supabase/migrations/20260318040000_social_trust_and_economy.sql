-- ─────────────────────────────────────────────────────────────────────────────
-- SOCIAL TRUST & ECONOMY: reward_config, mutual_connections, reposts
-- Security contract:
--   • reward_config  – service_role-only mutations; public read via view only
--   • mutual_connections – SELECT for both participants; writes via service_role
--   • follow_change_queue – fully private; only service_role / edge worker
--   • reposts – owner INSERT/DELETE; follow-or-self SELECT
-- ─────────────────────────────────────────────────────────────────────────────

-- migrate:up
BEGIN;

-- ── 0. Extend the txn-type enum (idempotent) ─────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'earn_post'
      AND enumtypid = 'public.moonrays_txn_type'::regtype
  ) THEN
    ALTER TYPE public.moonrays_txn_type ADD VALUE 'earn_post';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'earn_repost'
      AND enumtypid = 'public.moonrays_txn_type'::regtype
  ) THEN
    ALTER TYPE public.moonrays_txn_type ADD VALUE 'earn_repost';
  END IF;
END $$;

-- ── 1. reward_config ──────────────────────────────────────────────────────────
-- Stores authoritative reward rules.  NEVER exposed directly to anon/authed
-- clients – the reward_config_public view is the only safe read path.

CREATE TABLE IF NOT EXISTS public.reward_config (
  action_key    text        PRIMARY KEY,
  base_amount   bigint      NOT NULL CHECK (base_amount >= 0),
  daily_cap     bigint      CHECK (daily_cap IS NULL OR daily_cap >= 0),
  total_cap     bigint      CHECK (total_cap IS NULL OR total_cap >= 0),
  cooldown_sec  int         NOT NULL DEFAULT 0 CHECK (cooldown_sec >= 0),
  is_active     boolean     NOT NULL DEFAULT true,
  starts_at     timestamptz,
  ends_at       timestamptz,
  metadata      jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reward_config ENABLE ROW LEVEL SECURITY;

-- Strict RLS: no policy means NO access for regular JWT roles.
-- service_role bypasses RLS in Supabase by design → admin path is safe.
-- No INSERT / UPDATE / DELETE policies are created intentionally.

-- ── 2. reward_config_public (non-sensitive read path) ────────────────────────
-- Exposes only the fields the UI needs for display hints.
-- Excludes: total_cap, metadata, cooldown_sec, created_at, updated_at.
-- Security: created with SECURITY DEFINER semantics (owner = postgres, which
--   bypasses RLS) so authenticated clients can read through it without any
--   SELECT policy on the base table.

DROP VIEW IF EXISTS public.reward_config_public;
CREATE VIEW public.reward_config_public
WITH (security_invoker = false)  -- runs as view owner (postgres), bypassing base-table RLS
AS
SELECT
  action_key,
  base_amount,
  daily_cap,
  is_active,
  starts_at,
  ends_at
FROM public.reward_config
WHERE is_active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at   IS NULL OR ends_at   >= now());

GRANT SELECT ON public.reward_config_public TO authenticated, anon;

-- Seed initial economy values (INSERT only if the row is absent)
INSERT INTO public.reward_config (action_key, base_amount, daily_cap, cooldown_sec, is_active)
VALUES
  ('signup',   500, NULL, 0,   true),
  ('post',      10,  100, 0,   true),
  ('repost',     5,   25, 0,   true),
  ('like',       2,   50, 0,   true),
  ('comment',   10,   50, 0,   true),
  ('checkin',   20,   40, 3600,true),
  ('referral', 100, NULL, 0,   true)
ON CONFLICT (action_key) DO NOTHING;

-- ── 3. mutual_connections (friends-feed cache) ───────────────────────────────
-- Maintained exclusively by the async edge worker; users must NEVER write here.

CREATE TABLE IF NOT EXISTS public.mutual_connections (
  user_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mutual_user_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score          int         NOT NULL DEFAULT 0 CHECK (score >= 0),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mutual_user_id),
  CONSTRAINT mutual_connections_no_self CHECK (user_id <> mutual_user_id)
);

ALTER TABLE public.mutual_connections ENABLE ROW LEVEL SECURITY;

-- SELECT: strictly scoped to the two participants of the connection.
-- No USING (true) – each side can only see rows where they appear.
CREATE POLICY "mutual_connections_select_participants"
  ON public.mutual_connections
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = mutual_user_id);

-- INSERT / UPDATE / DELETE: no user-facing policies.
-- service_role (edge worker) bypasses RLS and is the only writer.

CREATE INDEX IF NOT EXISTS mutual_connections_mutual_user_id_idx
  ON public.mutual_connections (mutual_user_id);

-- ── 4. follow_change_queue (async worker inbox) ───────────────────────────────
-- Populated by a lightweight trigger; consumed by the edge worker.
-- Fully private – no SELECT / INSERT / UPDATE / DELETE policies for users.

CREATE TABLE IF NOT EXISTS public.follow_change_queue (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action       text        NOT NULL CHECK (action IN ('follow', 'unfollow')),
  processed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.follow_change_queue ENABLE ROW LEVEL SECURITY;
-- Intentionally no user-facing SELECT / INSERT / UPDATE / DELETE policies.

CREATE INDEX IF NOT EXISTS follow_change_queue_unprocessed_idx
  ON public.follow_change_queue (created_at)
  WHERE processed_at IS NULL;

-- ── 5. Enqueue trigger (tiny insert; never blocks follow writes) ───────────────
-- Inspects the follows table schema once at migration time and creates a
-- schema-specific trigger function body; avoids per-row row_to_json overhead.

DO $$
DECLARE
  v_target_col text;
  v_func_body  text;
BEGIN
  IF to_regclass('public.follows') IS NULL THEN
    RETURN;  -- follows table not yet present; skip
  END IF;

  -- Determine which column holds the "person being followed"
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'follows'
      AND column_name  = 'following_id'
  ) THEN
    v_target_col := 'following_id';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'follows'
      AND column_name  = 'target_id'
  ) THEN
    v_target_col := 'target_id';
  ELSE
    RAISE WARNING 'follows table has no following_id or target_id column; trigger skipped';
    RETURN;
  END IF;

  v_func_body := format($fn$
    CREATE OR REPLACE FUNCTION public.enqueue_follow_change()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $body$
    DECLARE
      v_actor  uuid;
      v_target uuid;
      v_action text;
    BEGIN
      v_action := CASE WHEN TG_OP = 'DELETE' THEN 'unfollow' ELSE 'follow' END;
      IF TG_OP = 'DELETE' THEN
        v_actor  := OLD.follower_id;
        v_target := OLD.%I;
      ELSE
        v_actor  := NEW.follower_id;
        v_target := NEW.%I;
      END IF;
      INSERT INTO public.follow_change_queue (actor_id, target_id, action)
      VALUES (v_actor, v_target, v_action);
      RETURN COALESCE(NEW, OLD);
    END;
    $body$;
  $fn$, v_target_col, v_target_col);

  EXECUTE v_func_body;

  DROP TRIGGER IF EXISTS tr_follow_change_enqueue ON public.follows;
  CREATE TRIGGER tr_follow_change_enqueue
    AFTER INSERT OR DELETE ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION public.enqueue_follow_change();
END $$;

-- ── 6. reposts ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reposts (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id    uuid        NOT NULL REFERENCES public.posts(id)    ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

-- SELECT: own reposts + reposts from people the viewer follows.
-- Dynamically built to match the actual follows schema so no
-- unnecessary casts or OR branches degrade index usage.
DO $$
DECLARE
  v_join_col      text;
  v_select_clause text;
BEGIN
  IF to_regclass('public.follows') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'follows'
        AND column_name  = 'following_id'
    ) THEN
      v_join_col := 'following_id';
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'follows'
        AND column_name  = 'target_id'
    ) THEN
      v_join_col := 'target_id';
    END IF;
  END IF;

  IF v_join_col IS NOT NULL THEN
    v_select_clause := format(
      $sql$auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.follows f
        WHERE f.follower_id = auth.uid() AND f.%I = reposts.user_id
      )$sql$,
      v_join_col
    );
  ELSE
    v_select_clause := 'auth.uid() = user_id';
  END IF;

  EXECUTE format(
    'CREATE POLICY "reposts_select_own_or_followed"
       ON public.reposts FOR SELECT USING (%s)',
    v_select_clause
  );
END $$;

CREATE POLICY "reposts_insert_own"
  ON public.reposts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reposts_delete_own"
  ON public.reposts
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS reposts_post_id_idx  ON public.reposts (post_id);
CREATE INDEX IF NOT EXISTS reposts_user_id_idx  ON public.reposts (user_id);

-- ── 7. repost_post RPC ────────────────────────────────────────────────────────
-- Reads reward amount from reward_config at call time; falls back to 5 MR.
-- Server-side idempotency key prevents double-awarding.

CREATE OR REPLACE FUNCTION public.repost_post(p_post_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward  bigint;
  v_txn_id  uuid;
BEGIN
  -- Authoritative reward lookup (bypasses RLS via SECURITY DEFINER)
  SELECT base_amount
  INTO   v_reward
  FROM   public.reward_config
  WHERE  action_key = 'repost'
    AND  is_active  = true
    AND  (starts_at IS NULL OR starts_at <= now())
    AND  (ends_at   IS NULL OR ends_at   >= now());

  v_reward := COALESCE(v_reward, 5);

  -- Record the repost (unique constraint blocks duplicates)
  INSERT INTO public.reposts (user_id, post_id)
  VALUES (auth.uid(), p_post_id);

  -- Award Moonrays (idempotent txn_ref)
  v_txn_id := public.award_moonrays(
    auth.uid(),
    'repost:' || p_post_id || ':' || auth.uid(),
    'earn_repost',
    v_reward,
    'Repost reward'
  );

  RETURN v_txn_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.repost_post(uuid) TO authenticated;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- migrate:down  (run manually when a rollback is required)
-- ─────────────────────────────────────────────────────────────────────────────
-- BEGIN;
--
-- REVOKE EXECUTE ON FUNCTION public.repost_post(uuid) FROM authenticated;
-- DROP FUNCTION IF EXISTS public.repost_post(uuid);
--
-- DO $$ BEGIN
--   IF to_regclass('public.follows') IS NOT NULL THEN
--     DROP TRIGGER IF EXISTS tr_follow_change_enqueue ON public.follows;
--   END IF;
-- END $$;
-- DROP FUNCTION IF EXISTS public.enqueue_follow_change();
--
-- DROP TABLE IF EXISTS public.reposts;
-- DROP TABLE IF EXISTS public.follow_change_queue;
-- DROP TABLE IF EXISTS public.mutual_connections;
-- DROP VIEW  IF EXISTS public.reward_config_public;
-- DROP TABLE IF EXISTS public.reward_config;
--
-- COMMIT;
