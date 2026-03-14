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
    { name: 'Club Guesthouse', address: 'Splaiul Unirii 160, Bucharest', city: 'Bucharest', followers: 9200, rating: 4.9 },
    { name: 'Platforma Wolff', address: 'Str. Dr. Constantin Istrati 1, Bucharest', city: 'Bucharest', followers: 5800, rating: 4.8 },
    { name: 'OXYA Club', address: 'Str. Caroteni 11, Bucharest', city: 'Bucharest', followers: 3100, rating: 4.4 },
    { name: 'Interbelic', address: 'Calea Victoriei 17, Bucharest', city: 'Bucharest', followers: 4200, rating: 4.5 },
    { name: 'KAYO Club', address: 'Soseaua Nordului 1, Bucharest', city: 'Bucharest', followers: 2800, rating: 4.3 },
    { name: 'Maison 64', address: 'Soseaua Nordului 64, Bucharest', city: 'Bucharest', followers: 1500, rating: 4.6 },
    { name: 'Noar Hall', address: 'Soseaua Pipera 48, Bucharest', city: 'Bucharest', followers: 1200, rating: 4.2 },
    { name: 'Nook Club', address: 'Soseaua Nordului 7-9, Bucharest', city: 'Bucharest', followers: 2100, rating: 4.5 },
    { name: 'Quantic Club', address: 'Soseaua Grozavesti 82, Bucharest', city: 'Bucharest', followers: 5400, rating: 4.7 },
    { name: 'Breeze Constanta', address: 'Mamaia Nord, Constanta', city: 'Constanta', followers: 2500, rating: 4.8 },
    { name: 'Fratelli Beach & Club', address: 'Mamaia Beach, Constanta', city: 'Constanta', followers: 4200, rating: 4.7 },
    { name: 'Luv Constanta', address: 'Bulevardul Tomis 122, Constanta', city: 'Constanta', followers: 1800, rating: 4.5 },
    { name: 'Goblin Constanta', address: 'Faleză Nord, Constanta', city: 'Constanta', followers: 1200, rating: 4.4 },
    { name: 'Ego Club Mamaia', address: 'Mamaia Nord, Constanta', city: 'Constanta', followers: 3100, rating: 4.6 },
    { name: 'Nuba Beach Club', address: 'Mamaia Nord, Constanta', city: 'Constanta', followers: 2900, rating: 4.5 },
    { name: 'Doors Club', address: 'Str. Traian 68, Constanta', city: 'Constanta', followers: 1500, rating: 4.3 },
    { name: 'Azimuth Beach & Lounge', address: 'Mamaia Nord, Constanta', city: 'Constanta', followers: 3400, rating: 4.7 },
    { name: 'Amos Mamaia', address: 'Promenada Mamaia, Constanta', city: 'Constanta', followers: 1200, rating: 4.4 },
    { name: 'Club Momo', address: 'Strada Lipscani, Bucharest', city: 'Bucharest', followers: 2200, rating: 4.4 },
    { name: 'Kran', address: 'Strada Gabroveni, Bucharest', city: 'Bucharest', followers: 1800, rating: 4.5 },
    { name: 'Eden', address: 'Calea Victoriei 107, Bucharest', city: 'Bucharest', followers: 7200, rating: 4.7 },
    { name: 'Face Club', address: 'Piata Presei Libere 3-5, Bucharest', city: 'Bucharest', followers: 9500, rating: 4.3 },
    { name: 'BAMBOO', address: 'Strada Ramuri Tei, Bucharest', city: 'Bucharest', followers: 12000, rating: 4.2 },
    { name: 'BIARETTI', address: 'Strada Academiei, Bucharest', city: 'Bucharest', followers: 1100, rating: 4.1 },
    { name: 'BOA', address: 'Soseaua Pavel D. Kiseleff 32, Bucharest', city: 'Bucharest', followers: 8900, rating: 4.4 },
    { name: 'The Pub Universitatii', address: 'Blv Regina Elisabeta 9, Bucharest', city: 'Bucharest', followers: 4500, rating: 4.6 },
    { name: 'Quantic', address: 'Soseaua Grozavesti 82, Bucharest', city: 'Bucharest', followers: 5400, rating: 4.7 },
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
