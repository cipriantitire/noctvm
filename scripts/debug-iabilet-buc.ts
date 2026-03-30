import { config } from 'dotenv';
config({ path: '.env.local' });
import { fetchHtml, extractUrlsFromJsonLd, parseDetailPage } from '../src/lib/scrapers/utils';
import { guessGenres } from '../src/lib/scrapers/utils';

const BASE_URL = 'https://www.iabilet.ro';
const allowedCities = ['bucuresti', 'bucharest', 'ilfov', 'sector'];

async function main() {
  const html = await fetchHtml('https://www.iabilet.ro/bilete-bucuresti/', 15_000);
  const ldUrls = extractUrlsFromJsonLd(html, BASE_URL);
  console.log(`Found ${ldUrls.length} JSON-LD URLs`);

  // Test first 5 URLs
  for (const url of ldUrls.slice(0, 5)) {
    console.log(`\nTesting: ${url}`);
    const result = await parseDetailPage(url, 'Bucharest', 15_000, allowedCities);
    if (result) {
      console.log(`  ✓ "${result.title}" | genres: ${result.genres.join(', ')}`);
    } else {
      console.log(`  ✗ returned null`);
      // Quick genre check
      const detailHtml = await fetchHtml(url, 10_000).catch(() => '');
      const ogTitle = detailHtml.match(/property="og:title" content="([^"]+)"/)?.[1] ?? '';
      const ogDesc = detailHtml.match(/property="og:description" content="([^"]+)"/)?.[1] ?? '';
      const genres = guessGenres(ogTitle, ogDesc);
      console.log(`  title: "${ogTitle.slice(0,60)}" | genres: ${JSON.stringify(genres)}`);
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
