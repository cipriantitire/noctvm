-- ─────────────────────────────────────────────────────────────────────────────
-- MOONRAYS SOCIAL REWARDS & REFERRAL SYSTEM
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- 1. Referrals Table: Anti-Fraud and Tracking
CREATE TABLE IF NOT EXISTS public.referrals (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id      uuid        NOT NULL REFERENCES public.profiles(id),
  referred_user_id uuid        NOT NULL UNIQUE REFERENCES public.profiles(id),
  reward_amount    bigint      NOT NULL DEFAULT 100,
  status           text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'invalid')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 2. Social Assets (The "Sinks")
-- Instead of basic features, we burn points for premium "Boasts"
CREATE TABLE IF NOT EXISTS public.moonrays_assets (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('profile_background', 'story_frame', 'post_effect')),
  cost        bigint      NOT NULL,
  metadata    jsonb       NOT NULL DEFAULT '{}', -- CSS styles or effect IDs
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. User Inventory (What they've burned points for)
CREATE TABLE IF NOT EXISTS public.profile_assets (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_id    uuid        NOT NULL REFERENCES public.moonrays_assets(id),
  expires_at  timestamptz, -- null for permanent items
  is_equipped boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moonrays_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own referral activities"
  ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Everyone can see available assets"
  ON public.moonrays_assets FOR SELECT USING (true);

CREATE POLICY "Users can manage their own library"
  ON public.profile_assets FOR ALL USING (auth.uid() = user_id);

-- 5. Seed Initial Assets (The Premium "Vibe")
INSERT INTO public.moonrays_assets (name, type, cost, metadata) VALUES
('Frosted Aurora Background', 'profile_background', 1200, '{"css": "bg-gradient-to-br from-violet-500/20 to-emerald-500/10 backdrop-blur-xl"}'),
('Liquid Metal Story Frame', 'story_frame', 500, '{"effect": "liquid_metal_border"}'),
('Golden Glow Post Pin', 'post_effect', 800, '{"css": "shadow-[0_0_15px_rgba(255,215,0,0.4)] border-gold"}');

-- 6. Updated handle_new_user to reward Referrers
CREATE OR REPLACE FUNCTION public.handle_new_user_with_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
declare
  v_referrer_id uuid;
  v_referral_code text;
begin
  -- 1. Get referral code from metadata if present
  -- Assuming frontend sends { "referral_code": "..." } in signup metadata
  v_referral_code := new.raw_user_meta_data->>'referral_code';
  
  -- 2. Create the baseline profile (Copy existing logic)
  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );

  -- 3. Check for Referrer
  if v_referral_code is not null then
    select id into v_referrer_id from public.profiles where referral_code = v_referral_code;
    
    if v_referrer_id is not null then
      -- Record referral
      insert into public.referrals (referrer_id, referred_user_id, reward_amount)
      values (v_referrer_id, new.id, 100);
      
      -- Award Referrer (Using our idempotent ledger)
      -- txn_ref prefix prevents duplicate awards for same referral
      perform public.award_moonrays(
        v_referrer_id, 
        'referral_success:' || new.id, 
        'earn_invite', 
        100, 
        'Successful referral bonus'
      );
    end if;
  end if;

  -- 4. Award Welcome Bonus to New User
  perform public.award_moonrays(
    new.id, 
    'welcome_bonus:' || new.id, 
    'earn_signup', 
    500, 
    'Welcome to NOCTVM!'
  );

  return new;
end;
$$;

COMMIT;
