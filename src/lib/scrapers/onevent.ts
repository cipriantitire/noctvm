// ─────────────────────────────────────────────────────────────────────────────
// onevent.ro scraper
// Strategy:
//   1. Fetch music-category listing page per city
//   2. Extract event URLs from HTML cards ONLY (listing-page JSON-LD has
//      wrong URL-to-event mappings, causing duplicate/mismatched events)
//   3. Deep-fetch each event detail page for full data
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { fetchHtml, batchFetch } from './utils';

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

/** Extract event detail hrefs from raw HTML cards. */
function extractHtmlUrls(html: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  // Match links that look like https://www.onevent.ro/evenimente/event-name-slug/
  // Also match the shorter /event-name-slug/ pattern
  const re = /href=["'](https?:\/\/www\.onevent\.ro\/(?:evenimente\/)?([^"?#/\s]+)\/?)['"]/gi;
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

      // NOTE: We intentionally skip extractUrlsFromJsonLd — the listing-page JSON-LD
      // contains Event blocks whose `url` fields don't match the actual HTML cards.
      // This caused triplicates like "Balkanique Drag Wedding" appearing 3 times
      // with wrong venues/URLs. Detail pages have correct JSON-LD.
      const htmlUrls = extractHtmlUrls(html);
      console.log(`[onevent] ${city}: ${htmlUrls.length} HTML URLs (JSON-LD skipped — unreliable on listing pages)`);

      const events = await batchFetch(htmlUrls, city, { limit: 30, batchSize: 10, allowedCities });
      
      // Deduplicate locally because onevent frequently posts the exact same event
      // under different URLs with slightly varying titles and null/"Venue TBC" venues
      const uniqueEvents: ScrapedEvent[] = [];
      for (const e of events) {
        const existingIdx = uniqueEvents.findIndex(u => {
          if (u.date !== e.date) return false;
          // Exact text match check first before fuzzy
          if (u.title === e.title) return true;
          
          // Fuzzy word overlap check for differently styled titles
          // e.g. "Concert Live București – Ardor de Primăvară cu AMBRA" vs "Concert -Ardor de Primavera♥️-AMBRA"
          const getWords = (s: string) => s.toLowerCase().replace(/[^\w\săâîșț]/gi, '').split(/\s+/).filter(w => w.length > 2);
          const wordsA = getWords(e.title);
          const wordsB = getWords(u.title);
          
          const intersection = wordsA.filter(w => wordsB.includes(w)).length;
          const minLen = Math.min(wordsA.length, wordsB.length);
          
          // 60% overlap logic
          return minLen > 0 && (intersection / minLen) >= 0.6;
        });

        if (existingIdx === -1) {
          uniqueEvents.push(e);
        } else {
          // We found a duplicate. Swap them if the new one is "better" (e.g. has a real venue vs Venue TBC)
          const u = uniqueEvents[existingIdx];
          const hasRealVenue = (v: string) => v && !v.includes('TBC') ? 2 : 0;
          const uScore = hasRealVenue(u.venue) + (u.ticket_url ? 1 : 0) + (u.image_url ? 1 : 0);
          const eScore = hasRealVenue(e.venue) + (e.ticket_url ? 1 : 0) + (e.image_url ? 1 : 0);
          
          if (eScore > uScore) {
            console.log(`[onevent] Replaced internal duplicate with better version: "${e.title}" (better venue/attributes than "${u.title}")`);
            uniqueEvents[existingIdx] = e;
          } else {
            console.log(`[onevent] Dropped internal duplicate: "${e.title}"`);
          }
        }
      }

      console.log(`[onevent] ${city}: kept ${uniqueEvents.length} music events`);
      allEvents.push(...uniqueEvents);
    } catch (err) {
      console.warn(`[onevent] failed for ${url}:`, err);
    }
  }

  return allEvents;
}
