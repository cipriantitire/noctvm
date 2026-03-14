import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('date', today);
  console.log(`Events for today (${today}):`, count);
  
  if (count === 0) {
    const { data } = await supabase.from('events').select('date').limit(5).order('date', { ascending: true });
    console.log('Earliest event dates in DB:', data);
  }
}

main();
