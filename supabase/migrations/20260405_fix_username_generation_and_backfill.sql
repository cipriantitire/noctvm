BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user_with_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_referral_code text;
  v_avatar_url text;
  v_display_name text;
  v_username_source text;
  v_username_base text;
  v_username_candidate text;
  v_suffix int := 0;
BEGIN
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';
  v_avatar_url := coalesce(
    nullif(NEW.raw_user_meta_data->>'picture', ''),
    nullif(NEW.raw_user_meta_data->>'avatar_url', ''),
    nullif(NEW.raw_user_meta_data->>'avatar', '')
  );

  v_display_name := coalesce(
    nullif(NEW.raw_user_meta_data->>'full_name', ''),
    nullif(NEW.raw_user_meta_data->>'name', ''),
    nullif(split_part(coalesce(NEW.email, ''), '@', 1), ''),
    'Night Owl'
  );

  v_username_source := coalesce(
    nullif(NEW.raw_user_meta_data->>'preferred_username', ''),
    nullif(NEW.raw_user_meta_data->>'user_name', ''),
    nullif(NEW.raw_user_meta_data->>'nickname', ''),
    nullif(split_part(coalesce(NEW.email, ''), '@', 1), ''),
    nullif(v_display_name, ''),
    'user'
  );

  v_username_base := lower(regexp_replace(v_username_source, '[^a-zA-Z0-9_]+', '_', 'g'));
  v_username_base := regexp_replace(v_username_base, '_+', '_', 'g');
  v_username_base := regexp_replace(regexp_replace(v_username_base, '^_+', ''), '_+$', '');

  IF v_username_base = '' THEN
    v_username_base := 'user';
  END IF;

  LOOP
    IF v_suffix = 0 THEN
      v_username_candidate := v_username_base;
    ELSE
      v_username_candidate := left(v_username_base, greatest(1, 30 - length(v_suffix::text) - 1)) || '_' || v_suffix::text;
    END IF;

    BEGIN
      INSERT INTO public.profiles (id, display_name, email, avatar_url, username)
      VALUES (
        NEW.id,
        v_display_name,
        NEW.email,
        coalesce(v_avatar_url, ''),
        v_username_candidate
      )
      ON CONFLICT (id) DO UPDATE
        SET display_name = coalesce(nullif(public.profiles.display_name, ''), EXCLUDED.display_name),
            email = coalesce(public.profiles.email, EXCLUDED.email),
            avatar_url = coalesce(nullif(public.profiles.avatar_url, ''), EXCLUDED.avatar_url),
            username = coalesce(nullif(public.profiles.username, ''), EXCLUDED.username),
            updated_at = now();

      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_suffix := v_suffix + 1;
      IF v_suffix > 999 THEN
        RAISE EXCEPTION 'Unable to allocate unique username for user %', NEW.id;
      END IF;
    END;
  END LOOP;

  IF v_referral_code IS NOT NULL THEN
    SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_referral_code;

    IF v_referrer_id IS NOT NULL THEN
      INSERT INTO public.referrals (referrer_id, referred_user_id, reward_amount)
      VALUES (v_referrer_id, NEW.id, 100)
      ON CONFLICT (referred_user_id) DO NOTHING;

      PERFORM public.award_moonrays(
        v_referrer_id,
        'referral_success:' || NEW.id,
        'earn_invite',
        100,
        'Successful referral bonus'
      );
    END IF;
  END IF;

  PERFORM public.award_moonrays(
    NEW.id,
    'welcome_bonus:' || NEW.id,
    'earn_signup',
    500,
    'Welcome to NOCTVM!'
  );

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  rec record;
  v_source text;
  v_base text;
  v_candidate text;
  v_suffix int;
BEGIN
  FOR rec IN
    SELECT
      p.id,
      p.email,
      p.display_name,
      u.raw_user_meta_data,
      p.created_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE p.username IS NULL OR btrim(p.username) = ''
    ORDER BY p.created_at, p.id
  LOOP
    v_source := coalesce(
      nullif(rec.raw_user_meta_data->>'preferred_username', ''),
      nullif(rec.raw_user_meta_data->>'user_name', ''),
      nullif(rec.raw_user_meta_data->>'nickname', ''),
      nullif(split_part(coalesce(rec.email, ''), '@', 1), ''),
      nullif(rec.display_name, ''),
      'user'
    );

    v_base := lower(regexp_replace(v_source, '[^a-zA-Z0-9_]+', '_', 'g'));
    v_base := regexp_replace(v_base, '_+', '_', 'g');
    v_base := regexp_replace(regexp_replace(v_base, '^_+', ''), '_+$', '');

    IF v_base = '' THEN
      v_base := 'user';
    END IF;

    v_candidate := v_base;
    v_suffix := 0;

    WHILE EXISTS (
      SELECT 1
      FROM public.profiles p2
      WHERE p2.username = v_candidate
        AND p2.id <> rec.id
    ) LOOP
      v_suffix := v_suffix + 1;
      v_candidate := left(v_base, greatest(1, 30 - length(v_suffix::text) - 1)) || '_' || v_suffix::text;
    END LOOP;

    UPDATE public.profiles
    SET username = v_candidate,
        updated_at = now()
    WHERE id = rec.id;
  END LOOP;
END;
$$;

ALTER TABLE public.profiles
  ALTER COLUMN username SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'profiles'
      AND c.conname = 'profiles_username_not_blank'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_username_not_blank CHECK (btrim(username) <> '');
  END IF;
END;
$$;

COMMIT;