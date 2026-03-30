// Quick local scraper runner — usage: npx tsx scripts/run-scraper.ts [source]
// source: iabilet | ambilet | controlclub | zilesinopti | ra | livetickets | eventbook | all
import { config } from 'dotenv';
config({ path: '.env.local' });
import { fetchAndUpsertEvents } from '../src/lib/scrapers/index';

const source = process.argv[2] || 'all';
console.log(`\n▶ Running scraper: ${source}\n`);

fetchAndUpsertEvents(source === 'all' ? undefined : source)
  .then(summary => {
    console.log('\n✓ Done:', JSON.stringify(summary, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('\n✗ Error:', err);
    process.exit(1);
  });
