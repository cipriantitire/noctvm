import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  const { data } = await supabase.from('events').select('title, venue').ilike('venue', '%Apollo%');
  console.log('Events with Apollo in venue name:', data);
  
  const { data: allVenues } = await supabase.from('events').select('venue');
  const uniqueVenues = Array.from(new Set(allVenues?.map(v => v.venue)));
  console.log('All unique venues in events table:', uniqueVenues);
}

main();
