// ─────────────────────────────────────────────────────────────────────────────
// Zilesinopti.ro scraper
// Site: WordPress + The Events Calendar plugin + custom "kzn" widget
// The listing page embeds event data in HTML cards (class="kzn-sw-item").
// Individual event pages have full JSON-LD via The Events Calendar plugin.
// Strategy:
//   Phase 1 — Parse listing-page JSON-LD (if present).
//   Phase 2 — Parse listing-page HTML "kzn-sw-item" cards.
//   Phase 3 — Deep-fetch each event's detail page for full venue/image/price.
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { fetchHtml, parseEventsFromJsonLd, parseDetailPage, parseDate, clean, guessGenres } from './utils';

const BASE_URL = 'https://zilesinopti.ro';
const LIST_URLS = [
  { url: 'https://zilesinopti.ro/evenimente-bucuresti/', city: 'Bucharest' },
  { url: 'https://zilesinopti.ro/evenimente-constanta/', city: 'Constanta' },
];

/** Collect event stubs (title + url + date) from the listing-page HTML cards. */
function collectStubsFromHtml(html: string): Array<{ title: string; url: string; rawDate: string }> {
  const stubs: Array<{ title: string; url: string; rawDate: string }> = [];
  const seen = new Set<string>();

  // kzn-sw-item is the The Events Calendar superwidget card
  const cardRe = /<div[^>]*class="[^"]*kzn-sw-item[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*kzn-sw-item|$)/gi;
  let m;
  while ((m = cardRe.exec(html)) !== null) {
    const block = m[1];

    // URL — look for first meaningful <a href>
    const linkM = block.match(/href="(https?:\/\/zilesinopti\.ro\/[^"?#]+)"/i)
      ?? block.match(/href="(\/[^"?#]+)"/i);
    if (!linkM) continue;
    const url = linkM[1].startsWith('http') ? linkM[1] : `${BASE_URL}${linkM[1]}`;
    if (seen.has(url)) continue;
    seen.add(url);

    // Title
    const titleM = block.match(/class="[^"]*kzn-sw-item-titlu[^"]*"[^>]*>([\s\S]*?)<\/\w+>/i)
      ?? block.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const title = clean(titleM?.[1] ?? '');
    if (!title || title.length < 3) continue;

    // Date string (will be refined by parseDetailPage)
    const dateM = block.match(/class="[^"]*kzn-one-event-date[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const rawDate = clean(dateM?.[1] ?? '');

    stubs.push({ title, url, rawDate });
  }

  // Also capture plain <article> or <li> links that might exist on the page
  if (stubs.length === 0) {
    const linkRe = /href="(https?:\/\/zilesinopti\.ro\/event[^"?#]*)"/gi;
    let lm;
    while ((lm = linkRe.exec(html)) !== null) {
      const url = lm[1].replace(/\/$/, '') + '/';
      if (!seen.has(url)) {
        seen.add(url);
        stubs.push({ title: '', url, rawDate: '' });
      }
    }
  }

  return stubs;
}

export async function scrapeZilesinopti(): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (const { url, city } of LIST_URLS) {
    try {
      const html = await fetchHtml(url, 15_000);

      // Phase 1: listing-page JSON-LD
      let events = parseEventsFromJsonLd(html, city);

      if (events.length > 0) {
        console.log(`[zilesinopti] ${city}: ${events.length} events from listing JSON-LD`);
        allEvents.push(...events);
        continue;
      }

      // Phase 2: collect stubs from HTML cards
      const stubs = collectStubsFromHtml(html);
      console.log(`[zilesinopti] ${city}: ${stubs.length} card stubs from HTML`);
      if (stubs.length === 0) continue;

      // Filter stubs to future events using rough date check
      const futureStubs = stubs.filter(s => {
        if (!s.rawDate) return true; // can't tell — let detail page decide
        const d = parseDate(s.rawDate);
        return !d || d >= today;
      });

      // Phase 3: deep-fetch each stub's detail page for full data
      const capped = futureStubs.slice(0, 30);
      for (let i = 0; i < capped.length; i += 5) {
        const chunk = capped.slice(i, i + 5);
        const results = await Promise.allSettled(
          chunk.map(s => parseDetailPage(s.url, city, 12_000)),
        );
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) allEvents.push(r.value);
        }
      }

      const kept = allEvents.filter(e => e.city === city).length;
      console.log(`[zilesinopti] ${city}: kept ${kept} music events`);
    } catch (err) {
      console.warn(`[zilesinopti] failed for ${url}:`, err);
    }
  }

  return allEvents;
}
