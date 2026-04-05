BEGIN;

DROP POLICY IF EXISTS "Managers can view other team members" ON public.venue_managers;

CREATE POLICY "Managers can view other team members"
ON public.venue_managers
FOR SELECT
USING (
  venue_id IN (
    SELECT vm.venue_id
    FROM public.venue_managers vm
    WHERE vm.user_id = auth.uid()
  )
);

COMMIT;