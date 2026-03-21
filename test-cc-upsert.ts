import { fetchAndUpsertEvents } from './src/lib/scrapers/index';
// need to load env vars for supabase client
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  console.log('Running Control Club Orchestrator...');
  try {
    const summary = await fetchAndUpsertEvents('controlclub');
    console.log(`Results:`, JSON.stringify(summary, null, 2));
  } catch (err) {
    console.error('Failed to run scraper:', err);
  }
}
test();
