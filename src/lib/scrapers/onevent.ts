// ─────────────────────────────────────────────────────────────────────────────
// onevent.ro scraper
// Strategy:
//   1. Fetch music-category listing page per city
//   2. Pull event URLs from JSON-LD (primary)
//   3. Supplement with absolute hrefs to event detail pages
//   4. Deep-fetch each event page
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { fetchHtml, batchFetch, extractUrlsFromJsonLd } from './utils';

const LIST_URLS = [
  {
    url: 'https://www.onevent.ro/bucuresti/music/',
    city: 'Bucharest',
    allowedCities: ['bucuresti', 'bucharest', 'ilfov', 'sector'],
  },
  {
    url: 'https://www.onevent.ro/constanta/music/',
    city: 'Constanta',
    allowedCities: ['constanta', 'constanța', 'mamaia', 'eforie', 'neptun', 'mangalia'],
  },
];
const BASE_URL = 'https://www.onevent.ro';

// Segments that identify category/navigation pages, not event detail pages
const SKIP_SEGMENTS = new Set([
  'about', 'contact', 'terms', 'privacy', 'blog', 'help', 'login',
  'register', 'search', 'categories', 'tag', 'ajax', 'api',
  'bucuresti', 'constanta', 'cluj', 'timisoara', 'iasi',
  'music', 'sport', 'kids', 'theatre', 'comedy', 'festival',
]);

/** Supplementary: extract event detail hrefs from raw HTML. */
function extractHtmlUrls(html: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  // Match links that look like https://www.onevent.ro/event-name-slug/
  const re = /href=["'](https?:\/\/www\.onevent\.ro\/([^"?#/\s]+)\/?)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const [, fullUrl, slug] = m;
    if (!slug) continue;
    
    // If the slug is a known category or short segment, skip it
    if (SKIP_SEGMENTS.has(slug.toLowerCase())) continue;
    
    // Ensure it's not a root category page like /bucuresti/music/
    const pathSegments = new URL(fullUrl).pathname.split('/').filter(Boolean);
    if (pathSegments.length < 1) continue;
    if (pathSegments.length === 2 && SKIP_SEGMENTS.has(pathSegments[0])) continue;

    const url = fullUrl.replace(/\/$/, '') + '/';
    if (!seen.has(url)) { seen.add(url); urls.push(url); }
  }
  return urls;
}

export async function scrapeOnevent(): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];

  for (const { url, city, allowedCities } of LIST_URLS) {
    try {
      const html = await fetchHtml(url, 20_000);

      if (html.includes('Niciun eveniment') || html.includes('Oups!')) {
        console.log(`[onevent] ${city}: no events on listing page`);
        continue;
      }

      const ldUrls   = extractUrlsFromJsonLd(html, BASE_URL);
      const htmlUrls = extractHtmlUrls(html);
      const allUrls  = Array.from(new Set([...ldUrls, ...htmlUrls]));
      console.log(`[onevent] ${city}: ${ldUrls.length} JSON-LD + ${htmlUrls.length} HTML = ${allUrls.length} URLs`);

      const events = await batchFetch(allUrls, city, { limit: 30, batchSize: 5, allowedCities });
      console.log(`[onevent] ${city}: kept ${events.length} music events`);
      allEvents.push(...events);
    } catch (err) {
      console.warn(`[onevent] failed for ${url}:`, err);
    }
  }

  return allEvents;
}
