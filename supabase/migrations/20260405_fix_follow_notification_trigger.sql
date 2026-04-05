-- Fix follow notifications to use the shared follows schema.
-- User follows notify the followed profile; venue follows remain non-notifying.

CREATE OR REPLACE FUNCTION public.handle_social_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  target_user_id uuid;
BEGIN
  -- Logic for Likes
  IF (TG_TABLE_NAME = 'post_likes') THEN
    SELECT user_id INTO target_user_id FROM public.posts WHERE id = NEW.post_id;
    IF (target_user_id != NEW.user_id) THEN
      INSERT INTO public.notifications (user_id, actor_id, type, entity_id, message)
      VALUES (target_user_id, NEW.user_id, 'like', NEW.post_id, 'liked your post');
    END IF;

  -- Logic for Comments
  ELSIF (TG_TABLE_NAME = 'post_comments') THEN
    SELECT user_id INTO target_user_id FROM public.posts WHERE id = NEW.post_id;
    IF (target_user_id != NEW.user_id) THEN
      INSERT INTO public.notifications (user_id, actor_id, type, entity_id, message)
      VALUES (target_user_id, NEW.user_id, 'comment', NEW.post_id, 'commented on your post');
    END IF;

  -- Logic for Reposts (Remixes)
  ELSIF (TG_TABLE_NAME = 'reposts') THEN
    SELECT user_id INTO target_user_id FROM public.posts WHERE id = NEW.post_id;
    IF (target_user_id != NEW.user_id) THEN
      INSERT INTO public.notifications (user_id, actor_id, type, entity_id, message)
      VALUES (target_user_id, NEW.user_id, 'remix', NEW.post_id, 'remixed your post');
    END IF;

  -- Logic for Follows
  ELSIF (TG_TABLE_NAME = 'follows') THEN
    IF (NEW.target_type = 'user' AND NEW.follower_id::text <> NEW.target_id) THEN
      INSERT INTO public.notifications (user_id, actor_id, type, entity_id, message)
      VALUES (NEW.target_id::uuid, NEW.follower_id, 'follow', NULL, 'started following you');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;