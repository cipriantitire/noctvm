-- Venue follows store venue names in target_id, so only user follows can be queued.

CREATE OR REPLACE FUNCTION public.enqueue_follow_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.target_type = 'user' THEN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO public.follow_change_queue (user_id, target_id, action_type)
            VALUES (NEW.follower_id, NEW.target_id::uuid, 'follow');
        ELSIF TG_OP = 'DELETE' THEN
            INSERT INTO public.follow_change_queue (user_id, target_id, action_type)
            VALUES (OLD.follower_id, OLD.target_id::uuid, 'unfollow');
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;