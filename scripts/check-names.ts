import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: venues, error: vErr } = await supabase.from('venues').select('name, city');
  if (vErr) console.error('Venues Error:', vErr);
  else console.log('Venues:', venues);

  const { data: events, error: eErr } = await supabase.from('events').select('city, venue').limit(20);
  if (eErr) console.error('Events Error:', eErr);
  else {
    console.log('Events Cities:', Array.from(new Set(events.map(e => e.city))));
    console.log('Events Venues (sample):', events.map(e => e.venue).slice(0, 10));
  }
}

main();
