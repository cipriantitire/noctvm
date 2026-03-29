// ─────────────────────────────────────────────────────────────────────────────
// Zilesinopti.ro scraper
// Site: WordPress + The Events Calendar plugin + custom "kzn" widget
// Strategy:
//   Use ONLY the /muzica/ (music) category page — avoids mixed-category
//   listing that produces garbage dates and off-topic events.
//   Listing-page JSON-LD is intentionally SKIPPED — it injects similar-events
//   blocks from other pages, causing wrong titles and crazy years (2647, 3049).
//   Instead: collect /evenimente/ URLs from HTML cards → deep-fetch detail pages.
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { fetchHtml, parseDetailPage, parseDate, clean } from './utils';

const BASE_URL = 'https://zilesinopti.ro';

// Music-specific category page — clean, curated signal
const LIST_URLS = [
  { url: 'https://zilesinopti.ro/muzica/', city: 'Bucharest' },
];

const TITLE_BLOCK_TERMS = [
  'priscene',
  'caritabil de priscene',
  'pentru copii',
  'teatru',
  'familie',
];

/** Collect event stubs from the listing-page HTML kzn-sw-item cards. */
function collectStubsFromHtml(html: string): Array<{ title: string; url: string; rawDate: string }> {
  const stubs: Array<{ title: string; url: string; rawDate: string }> = [];
  const seen = new Set<string>();

  // kzn-sw-item — The Events Calendar superwidget card
  // Parent: class='kzn-sw-item' (exact, single or double quotes in raw HTML)
  // Children: class="kzn-sw-item-imagine ...", class="kzn-sw-item-text ..." etc.
  // Lookahead must be EXACT match (no suffix) so it doesn't stop at child divs
  const cardRe = /<div\s+class=["']kzn-sw-item["'][^>]*>([\s\S]*?)(?=<div\s+class=["']kzn-sw-item["']|$)/gi;
  let m;
  while ((m = cardRe.exec(html)) !== null) {
    const block = m[1];

    // Only accept /evenimente/ detail page URLs — hard-reject everything else
    const linkM = block.match(/href=["'](https?:\/\/zilesinopti\.ro\/evenimente\/[^"'?#]+)["']/i)
      ?? block.match(/href=["'](\/evenimente\/[^"'?#]+)["']/i);
    if (!linkM) continue;
    const url = linkM[1].startsWith('http') ? linkM[1] : `${BASE_URL}${linkM[1]}`;
    if (!/\/evenimente\//.test(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);

    // Title
    const titleM = block.match(/class=["'][^"']*kzn-sw-item-titlu[^"']*["'][^>]*>([\s\S]*?)<\/\w+>/i)
      ?? block.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const title = clean(titleM?.[1] ?? '');
    if (!title || title.length < 3) continue;
    const lowTitle = title.toLowerCase();
    if (TITLE_BLOCK_TERMS.some(term => lowTitle.includes(term))) continue;

    // Raw date from card (refined later by the detail page JSON-LD)
    const dateM = block.match(/class=["'][^"']*kzn-one-event-date[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    const rawDate = clean(dateM?.[1] ?? '');

    stubs.push({ title, url, rawDate });
  }

  return stubs;
}

export async function scrapeZilesinopti(): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (const { url, city } of LIST_URLS) {
    try {
      const html = await fetchHtml(url, 15_000);

      // HTML cards only — skip listing JSON-LD (unreliable dates, stale blocks)
      const stubs = collectStubsFromHtml(html);
      console.log(`[zilesinopti] ${city}: ${stubs.length} card stubs from /muzica/`);
      if (stubs.length === 0) continue;

      // Rough future-event pre-filter
      const futureStubs = stubs.filter(s => {
        if (!s.rawDate) return true;
        const d = parseDate(s.rawDate);
        return !d || d >= today;
      });

      // Deep-fetch detail pages in small batches with jitter
      const capped = futureStubs.slice(0, 25);
      for (let i = 0; i < capped.length; i += 5) {
        const chunk = capped.slice(i, i + 5);
        const results = await Promise.allSettled(
          chunk.map(async (s) => {
            await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));
            return parseDetailPage(s.url, city, 15_000);
          }),
        );
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) allEvents.push(r.value);
        }
      }

      console.log(`[zilesinopti] ${city}: kept ${allEvents.length} music events`);
    } catch (err) {
      console.warn(`[zilesinopti] failed for ${url}:`, err);
    }
  }

  return allEvents;
}
