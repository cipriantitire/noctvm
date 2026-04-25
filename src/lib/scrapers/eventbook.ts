// ─────────────────────────────────────────────────────────────────────────────
// eventbook.ro scraper
// Strategy:
//   1. Use the city search endpoint (the /muzica category URL returns 404).
//   2. Extract event URLs — only follow music-category paths to prevent non-music
//      events from entering the pipeline at the URL level.
//   3. Also pull URLs from any JSON-LD on the search results page.
//   4. Deep-fetch each event detail page for full data.
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { fetchHtml, batchFetch, extractUrlsFromJsonLd } from './utils';

const LIST_URLS = [
  {
    url: 'https://eventbook.ro/event/search?term=Bucuresti',
    city: 'Bucharest',
    allowedCities: ['bucuresti', 'bucharest', 'ilfov', 'sector'],
  },
  {
    url: 'https://eventbook.ro/event/search?term=Constanta',
    city: 'Constanta',
    allowedCities: [
      'constanta', 'constanța', 'mamaia',
      'eforie', 'eforie nord', 'eforie sud',
      'neptun', 'mangalia',
      'navodari', 'năvodari',
      'costinesti', 'costinești',
      'vama veche', '2 mai',
      'venus', 'saturn', 'olimp', 'jupiter',
      'techirghiol',
    ],
  },
  {
    url: 'https://eventbook.ro/event/search?term=Mamaia',
    city: 'Constanta',
    allowedCities: [
      'constanta', 'constanța', 'mamaia',
      'navodari', 'năvodari', 'vama veche', '2 mai',
    ],
  },
  {
    url: 'https://eventbook.ro/event/search?term=Costinesti',
    city: 'Constanta',
    allowedCities: ['constanta', 'constanța', 'costinesti', 'costinești'],
  },
];
const BASE_URL = 'https://eventbook.ro';

const MUSIC_CATEGORIES = new Set(['muzica', 'music', 'concert', 'festival', 'club', 'party']);
const SKIP_SEGMENTS = new Set([
  'about', 'contact', 'terms', 'privacy', 'blog', 'help',
  'login', 'register', 'search', 'categories', 'tag', 'page', 'ajax',
  'event',
]);

/** Extract music-category event hrefs from search results HTML. */
function extractHtmlUrls(html: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  const re = /href="(\/([a-z0-9\-]+)\/([^"?#\s]+))"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const [, path, category, slug] = m;
    if (SKIP_SEGMENTS.has(category) || !slug || slug.length < 3) continue;
    // Only follow music-related category paths
    if (!MUSIC_CATEGORIES.has(category)) continue;
    const full = `${BASE_URL}${path}`;
    if (!seen.has(full)) { seen.add(full); urls.push(full); }
  }
  return urls;
}

export async function scrapeEventbook(settings?: { scan_depth?: number; concurrency?: number }): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];
  const limit = Math.max(25, Math.min(settings?.scan_depth ?? 80, 120));
  const batchSize = Math.max(2, Math.min(settings?.concurrency ?? 4, 6));

  for (const { url, city, allowedCities } of LIST_URLS) {
    try {
      const html = await fetchHtml(url, 15_000);

      const ldUrls   = extractUrlsFromJsonLd(html, BASE_URL);
      const htmlUrls = extractHtmlUrls(html);
      const allUrls  = Array.from(new Set([...ldUrls, ...htmlUrls]));
      console.log(`[eventbook] ${city}: ${ldUrls.length} JSON-LD + ${htmlUrls.length} HTML = ${allUrls.length} URLs`);

      const events = await batchFetch(allUrls, city, { limit, batchSize, allowedCities });
      console.log(`[eventbook] ${city}: kept ${events.length} music events`);
      allEvents.push(...events);
    } catch (err) {
      console.warn(`[eventbook] failed for ${url}:`, err);
    }
  }

  return allEvents;
}
