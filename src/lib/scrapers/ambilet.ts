// ─────────────────────────────────────────────────────────────────────────────
// ambilet.ro scraper
// Site: WordPress with a custom Tailwind events plugin.
//   • Detail pages have NO "@type":"Event" JSON-LD — only WebPage/Organization.
//   • Detail pages DO have full OG meta (title, image, description).
//   • Date appears as Romanian text in the HTML body ("14 mar 2026").
//   • Venue is embedded in the OG title after "@" ("Grimus @The Pub").
//   • Listing page uses ABSOLUTE hrefs: https://www.ambilet.ro/bilete/…
// Strategy:
//   1. Extract all unique event URLs from listing-page absolute hrefs.
//   2. Pre-filter slugs that are clearly non-music (teatru, copii, etc.).
//   3. Deep-fetch each detail page — parseDetailPage handles OG+HTML date+venue.
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { fetchHtml, batchFetch } from './utils';

const LIST_URLS = [
  { url: 'https://www.ambilet.ro/orase/bucuresti/', city: 'Bucharest' },
  { url: 'https://www.ambilet.ro/orase/constanta/', city: 'Constanta' },
];
const BASE_URL = 'https://www.ambilet.ro';

// Slug segments that strongly indicate a non-music event — skip without fetching
const SLUG_BLOCK = [
  'teatru', 'teatro', 'copii', 'marionete', 'papusi', 'balet', 'ballet',
  'opera', 'simfonie', 'filarmon', 'stand-up', 'standup', 'comedy',
  'cinema', 'film', 'yoga', 'culinar', 'cooking', 'targ', 'expozitie',
  // Family / social-game events
  'family', 'familie', 'suspecti-la-party', 'board-game', 'boardgame', 'murder-mystery',
];

/** Extract unique event detail URLs from the listing page HTML. */
function extractEventUrls(html: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  // ambilet listing page uses absolute hrefs
  const re = /href="(https?:\/\/www\.ambilet\.ro\/bilete\/([^"?#]+))"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const [, fullUrl, slug] = m;
    // Skip very short slugs (category roots like /bilete/) or system files
    if (!slug || slug.length < 5 || slug.includes('.php') || slug.includes('.xml')) continue;
    // Skip known non-music slugs
    if (SLUG_BLOCK.some(term => slug.includes(term))) continue;

    const normalised = fullUrl.replace(/\/$/, '') + '/';
    if (!seen.has(normalised)) {
      seen.add(normalised);
      urls.push(normalised);
    }
  }

  return urls;
}

export async function scrapeAmbilet(): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];

  for (const { url, city } of LIST_URLS) {
    try {
      const html = await fetchHtml(url, 15_000);
      const eventUrls = extractEventUrls(html);
      console.log(`[ambilet] ${city}: ${eventUrls.length} candidate URLs (slug-filtered)`);

      const events = await batchFetch(eventUrls, city, { limit: 30, batchSize: 5 });
      console.log(`[ambilet] ${city}: kept ${events.length} music events`);
      allEvents.push(...events);
    } catch (err) {
      console.warn(`[ambilet] failed for ${url}:`, err);
    }
  }

  return allEvents;
}
