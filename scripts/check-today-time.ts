import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase.from('events').select('title, time').eq('date', today).limit(10);
  console.log('Sample events for today with time:', data);
}

main();
