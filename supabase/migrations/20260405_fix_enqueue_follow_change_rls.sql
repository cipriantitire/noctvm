BEGIN;

CREATE OR REPLACE FUNCTION public.enqueue_follow_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.target_type = 'user' THEN
            INSERT INTO public.follow_change_queue (user_id, target_id, action_type)
            VALUES (NEW.follower_id, NEW.target_id::uuid, 'follow');
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.target_type = 'user' THEN
            INSERT INTO public.follow_change_queue (user_id, target_id, action_type)
            VALUES (OLD.follower_id, OLD.target_id::uuid, 'unfollow');
        END IF;
    END IF;

    RETURN NULL;
END;
$$;

COMMIT;