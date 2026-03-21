import { scrapeRA } from './src/lib/scrapers/ra';

async function test() {
  console.log('Running RA Scraper...');
  try {
    const results = await scrapeRA();
    console.log(`Successfully scraped ${results.length} events from RA.`);
    if (results.length > 0) {
      console.log('First event:', JSON.stringify(results[0], null, 2));
    }
  } catch (err) {
    console.error('Failed to run scraper:', err);
  }
}
test();
