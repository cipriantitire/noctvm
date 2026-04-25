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
    allowedCities: ['bucuresti', 'bucharest', 'ilfov', 'sector'],
  },
  {
    url: 'https://www.iabilet.ro/bilete-constanta/',
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
  // Mobile listing catches events that the desktop listing paginates differently
  {
    url: 'https://m.iabilet.ro/bilete-in-constanta',
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
  // Tag-based listing surfaces events that the city page misses
  {
    url: 'https://www.iabilet.ro/tag/constanta',
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
];
const BASE_URL = 'https://www.iabilet.ro';

// Category-level pages that share the same /bilete-* pattern but are not events
const EXCLUDED_SLUGS = new Set([
  'bilete-bucuresti', 'bilete-constanta', 'bilete-cluj',
  'bilete-timisoara', 'bilete-iasi', 'bilete-brasov', 'bilete-sibiu',
]);

// URL patterns that are category/venue/landing pages, not real events
const CATEGORY_VENUE_URL_RE = /\/(?:bilete-concerte-|bilete-festivaluri|bilete-[\w-]+-venue-\d+|bilete-voucher-cadou)/i;

// Slug fragments that definitively mark non-music events — skip before fetching
const SLUG_BLOCK_TERMS = [
  'pentru-copii', 'copii', 'teatru-interactiv', 'teatru-pentru', 'spectacol-copii',
  'teatru', 'theatre', 'piesa-de-teatru', 'balet', 'ballet',
  'stand-up', 'standup', 'comedy', 'comedie',
  'opera', 'simfonie', 'filarmon',
  'cinema', 'film', 'proiectie',
  'yoga', 'wellness', 'culinar', 'cooking', 'targ', 'expozitie',
  'marionete', 'papusi', 'animatie', 'circ', 'circus', 'magie', 'magician',
  // Family / social-game content
  'family-fest', 'familie', 'suspecti-la-party',
];

/** Supplementary: extract event hrefs from raw HTML (for non-JS-rendered pages). */
function extractHtmlUrls(html: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  const linkRe = /href="((?:https:\/\/www\.iabilet\.ro)?\/bilete-([a-z0-9\-]+)\/?)"/gi;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const slug = m[2];
    if (EXCLUDED_SLUGS.has(`bilete-${slug}`)) continue;
    if (CATEGORY_VENUE_URL_RE.test(m[1])) continue;
    if (slug.split('-').length < 2) continue;
    if (SLUG_BLOCK_TERMS.some(term => slug.includes(term))) continue;
    const full = (m[1].startsWith('http') ? m[1] : `${BASE_URL}${m[1]}`).replace(/\/$/, '') + '/';
    if (!seen.has(full)) { seen.add(full); urls.push(full); }
  }
  return urls;
}

export async function scrapeIabilet(settings?: { scan_depth?: number; concurrency?: number }): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];
  const limit = Math.max(30, Math.min(settings?.scan_depth ?? 60, 60));
  const batchSize = Math.max(3, Math.min(settings?.concurrency ?? 5, 6));

  for (const { url: baseUrl, city, allowedCities } of LIST_URLS) {
    try {
      // Fetch up to 3 pages of the listing to catch events deep in the catalog
      const MAX_PAGES = 3;
      let allLdUrls: string[] = [];
      let allHtmlUrls: string[] = [];

      for (let page = 1; page <= MAX_PAGES; page++) {
        const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
        let html: string;
        try {
          html = await fetchHtml(url, 15_000);
        } catch {
          break; // stop pagination on first failure
        }

        // Primary: JSON-LD url fields (works even with JS-rendered event cards)
        const ldUrls   = extractUrlsFromJsonLd(html, BASE_URL);
        // Supplementary: static hrefs in HTML
        const htmlUrls = extractHtmlUrls(html);

        allLdUrls.push(...ldUrls);
        allHtmlUrls.push(...htmlUrls);

        // Stop early if page had very few events (reached end)
        if (ldUrls.length + htmlUrls.length < 10 && page > 1) break;
      }

      // Merge, deduplicate, slug-filter
      const allUrls = Array.from(new Set([...allLdUrls, ...allHtmlUrls]))
        .filter(u => {
          const slug = u.replace(/\/$/, '').split('/').pop() ?? '';
          if (CATEGORY_VENUE_URL_RE.test(u)) return false;
          return !SLUG_BLOCK_TERMS.some(term => slug.includes(term));
        });
      console.log(`[iabilet] ${city}: ${allLdUrls.length} JSON-LD + ${allHtmlUrls.length} HTML = ${allUrls.length} candidate URLs`);

      // Pass allowedCities so events from wrong Romanian cities (Baia Mare, Bacau…) are rejected
      const events = await batchFetch(allUrls, city, { limit, batchSize, allowedCities });
      console.log(`[iabilet] ${city}: kept ${events.length} music events`);
      allEvents.push(...events);
    } catch (err) {
      console.warn(`[iabilet] failed for ${baseUrl}:`, err);
    }
  }

  return allEvents;
}
