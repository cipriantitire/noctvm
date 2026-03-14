// ─────────────────────────────────────────────────────────────────────────────
// iabilet.ro scraper
// Strategy:
//   1. Fetch listing page HTML
//   2. Pull event URLs from JSON-LD `url` fields (works even with JS-rendered cards)
//   3. Supplement with any href links found in raw HTML
//   4. Deep-fetch each event detail page for venue, price, image, description
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { fetchHtml, batchFetch, extractUrlsFromJsonLd } from './utils';

const LIST_URLS = [
  {
    url: 'https://www.iabilet.ro/bilete-bucuresti/',
    city: 'Bucharest',
    // iabilet's Bucharest listing includes national events — verify the JSON-LD city
    allowedCities: ['bucuresti', 'bucharest', 'ilfov', 'sector'],
  },
  {
    url: 'https://www.iabilet.ro/bilete-constanta/',
    city: 'Constanta',
    allowedCities: ['constanta', 'constanța', 'mamaia', 'eforie', 'neptun', 'mangalia'],
  },
];
const BASE_URL = 'https://www.iabilet.ro';

// Category-level pages that share the same /bilete-* pattern but are not events
const EXCLUDED_SLUGS = new Set([
  'bilete-bucuresti', 'bilete-constanta', 'bilete-cluj',
  'bilete-timisoara', 'bilete-iasi', 'bilete-brasov', 'bilete-sibiu',
]);

/** Supplementary: extract event hrefs from raw HTML (for non-JS-rendered pages). */
function extractHtmlUrls(html: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  const linkRe = /href="((?:https:\/\/www\.iabilet\.ro)?\/bilete-([a-z0-9\-]+)\/?)"/gi;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const slug = m[2];
    if (EXCLUDED_SLUGS.has(`bilete-${slug}`)) continue;
    if (slug.split('-').length < 2) continue;
    const full = (m[1].startsWith('http') ? m[1] : `${BASE_URL}${m[1]}`).replace(/\/$/, '') + '/';
    if (!seen.has(full)) { seen.add(full); urls.push(full); }
  }
  return urls;
}

export async function scrapeIabilet(): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];

  for (const { url, city, allowedCities } of LIST_URLS) {
    try {
      const html = await fetchHtml(url, 15_000);

      // Primary: JSON-LD url fields (works even with JS-rendered event cards)
      const ldUrls   = extractUrlsFromJsonLd(html, BASE_URL);
      // Supplementary: static hrefs in HTML
      const htmlUrls = extractHtmlUrls(html);

      // Merge, deduplicate
      const allUrls = Array.from(new Set([...ldUrls, ...htmlUrls]));
      console.log(`[iabilet] ${city}: ${ldUrls.length} JSON-LD + ${htmlUrls.length} HTML = ${allUrls.length} candidate URLs`);

      // Pass allowedCities so events from wrong Romanian cities (Baia Mare, Bacau…) are rejected
      const events = await batchFetch(allUrls, city, { limit: 30, batchSize: 5, allowedCities });
      console.log(`[iabilet] ${city}: kept ${events.length} music events`);
      allEvents.push(...events);
    } catch (err) {
      console.warn(`[iabilet] failed for ${url}:`, err);
    }
  }

  return allEvents;
}
