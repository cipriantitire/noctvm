begin;

create or replace function public.handle_new_user_with_referral()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_referrer_id uuid;
  v_referral_code text;
  v_avatar_url text;
begin
  v_referral_code := new.raw_user_meta_data->>'referral_code';
  v_avatar_url := coalesce(
    nullif(new.raw_user_meta_data->>'picture', ''),
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    nullif(new.raw_user_meta_data->>'avatar', '')
  );

  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(v_avatar_url, '')
  );

  if v_referral_code is not null then
    select id into v_referrer_id from public.profiles where referral_code = v_referral_code;

    if v_referrer_id is not null then
      insert into public.referrals (referrer_id, referred_user_id, reward_amount)
      values (v_referrer_id, new.id, 100);

      perform public.award_moonrays(
        v_referrer_id,
        'referral_success:' || new.id,
        'earn_invite',
        100,
        'Successful referral bonus'
      );
    end if;
  end if;

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

update public.profiles p
set avatar_url = coalesce(
  nullif(p.avatar_url, ''),
  nullif(u.raw_user_meta_data->>'picture', ''),
  nullif(u.raw_user_meta_data->>'avatar_url', ''),
  nullif(u.raw_user_meta_data->>'avatar', '')
)
from auth.users u
where u.id = p.id
  and coalesce(nullif(p.avatar_url, ''), '') = '';

commit;