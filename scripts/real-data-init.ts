import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { fetchAndUpsertEvents } from '../src/lib/scrapers/index';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function init() {
  console.log('🚀 Starting Data Initialization...');

  // 1. Seed Venues
  const venues = [
    { name: 'Control Club', address: 'Str. Constantin Mille 4, Bucharest', city: 'Bucharest', followers: 15400, rating: 4.8 },
    { name: 'Expirat Halele Carol', address: 'Str. Constantin Istrati 1, Bucharest', city: 'Bucharest', followers: 12200, rating: 4.7 },
    { name: 'Apollo111', address: 'Str. Ion Brezoianu 23-25, Bucharest', city: 'Bucharest', followers: 8500, rating: 4.6 },
    { name: 'Breeze Constanta', address: 'Mamaia Nord, Constanta', city: 'Constanta', followers: 2500, rating: 4.8 },
    { name: 'Fratelli Beach & Club', address: 'Mamaia Beach, Constanta', city: 'Constanta', followers: 4200, rating: 4.7 },
    { name: 'Luv Constanta', address: 'Bulevardul Tomis 122, Constanta', city: 'Constanta', followers: 1800, rating: 4.5 },
  ];

  console.log('Inserting Venues...');
  for (const v of venues) {
    const { error } = await supabase.from('venues').upsert(v, { onConflict: 'name' });
    if (error) console.error(`Failed to insert venue ${v.name}:`, error.message);
    else console.log(`✓ Venue ${v.name} upserted`);
  }

  // 2. Run scrapers
  console.log('Running scrapers...');
  try {
     const summary = await fetchAndUpsertEvents();
     console.log('✅ Initialization complete!', summary);
  } catch (e) {
     console.error('Scraper run failed:', e);
  }
}

init();
