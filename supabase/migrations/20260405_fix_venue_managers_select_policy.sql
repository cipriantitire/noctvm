BEGIN;

DROP POLICY IF EXISTS "Managers can view other team members" ON public.venue_managers;

CREATE POLICY "Managers can view other team members"
ON public.venue_managers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.venue_managers vm
    WHERE vm.venue_id = public.venue_managers.venue_id
      AND vm.user_id = auth.uid()
  )
);

COMMIT;