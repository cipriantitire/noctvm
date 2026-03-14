// ─────────────────────────────────────────────────────────────────────────────
// iabilet.ro scraper
// Site: Romanian ticketing platform
// Strategy: JSON-LD extraction + embedded JSON data in HTML
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { extractJsonLd, parseDate, extractTime, clean, guessGenres, fetchHtml } from './utils';

const LIST_URL = 'https://www.iabilet.ro/bilete-categories/cluburi-si-concerte/';
const BASE_URL  = 'https://www.iabilet.ro';

function fromJsonLd(html: string): ScrapedEvent[] {
  const events: ScrapedEvent[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (const block of extractJsonLd(html)) {
    const b = block as Record<string, unknown>;
    if ((b['@type'] as string) !== 'Event') continue;

    const startDate = String(b.startDate ?? '');
    const date = parseDate(startDate);
    if (!date || date < today) continue;

    const location = (b.location as Record<string, unknown>) ?? {};
    const venue = clean(String(location.name ?? 'Venue TBC'));
    const title = clean(b.name as string);
    if (!title) continue;

    const description = clean(b.description as string);
    const img = b.image;
    const image_url = typeof img === 'string' ? img
      : (img as Record<string, unknown>)?.url as string ?? '';

    const offers = b.offers as Record<string, unknown> | undefined;
    const price = offers
      ? (Number(offers.price) === 0 ? 'Free' : `${offers.price} RON`)
      : null;

    events.push({
      title,
      venue,
      date,
      time: extractTime(startDate),
      description: description || null,
      image_url,
      event_url: String(b.url ?? ''),
      genres: guessGenres(title, description),
      price,
    });
  }

  return events;
}

/** Fallback: parse iabilet event cards from HTML. */
function fromHtml(html: string): ScrapedEvent[] {
  const events: ScrapedEvent[] = [];
  const today = new Date().toISOString().split('T')[0];

  // iabilet event cards typically look like:
  // <div class="event-item"> ... <a href="/bilete-*"> ... </a> ... </div>
  const cardRegex = /<div[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  let match: RegExpExecArray | null;

  while ((match = cardRegex.exec(html)) !== null) {
    const block = match[1];

    const linkMatch = block.match(/<a[^>]+href="(\/bilete-[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;

    const eventPath = linkMatch[1];
    const rawInner = linkMatch[2];
    const title = clean(rawInner.replace(/<[^>]+>/g, '').split('\n')[0]);
    if (!title) continue;

    const imgMatch = block.match(/<img[^>]+src="([^"]+)"/i);
    const image_url = imgMatch?.[1] ?? '';

    // Look for a date element
    const dateMatch = block.match(/(\d{1,2}[.\-]\d{1,2}[.\-]\d{4})|(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? parseDate(dateMatch[0]) : null;
    if (!date || date < today) continue;

    events.push({
      title,
      venue: 'Venue TBC',
      date,
      time: null,
      description: null,
      image_url,
      event_url: `${BASE_URL}${eventPath}`,
      genres: guessGenres(title, ''),
      price: null,
    });
  }

  return events;
}

export async function scrapeIabilet(): Promise<ScrapedEvent[]> {
  try {
    const html = await fetchHtml(LIST_URL);
    const fromLd = fromJsonLd(html);
    if (fromLd.length > 0) return fromLd;
    return fromHtml(html);
  } catch (err) {
    console.warn('[iabilet] scrape failed:', err);
    return [];
  }
}
