// Server-only Supabase client using the service_role key.
// NEVER import this in client-side code — it would expose the secret key.
import { createClient } from '@supabase/supabase-js';

/** Service-role client — bypasses RLS. Only use in server-side API routes. */
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
