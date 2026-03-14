import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: events } = await supabase.from('events').select('venue').limit(100);
  const venues = Array.from(new Set(events?.map(e => e.venue))).sort();
  console.log('Unique venues in first 100 events:', venues);
}

main();
