import { supabase } from './src/lib/supabase';

async function checkVenues() {
  const { data, error } = await supabase.from('venues').select('name, city');
  if (error) {
    console.error('Error fetching venues:', error);
    return;
  }
  console.log('Venues found:', JSON.stringify(data, null, 2));
}

checkVenues();
