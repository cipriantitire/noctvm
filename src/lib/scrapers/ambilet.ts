// ─────────────────────────────────────────────────────────────────────────────
// ambilet.ro scraper
// Site: Romanian ticketing platform
// Strategy: JSON-LD extraction + HTML card parsing
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { extractJsonLd, parseDate, extractTime, clean, guessGenres, fetchHtml } from './utils';

const LIST_URL = 'https://www.ambilet.ro/bilete/cluburi-concerte/';
const BASE_URL  = 'https://www.ambilet.ro';

function fromJsonLd(html: string): ScrapedEvent[] {
  const today = new Date().toISOString().split('T')[0];
  const events: ScrapedEvent[] = [];

  for (const block of extractJsonLd(html)) {
    const b = block as Record<string, unknown>;
    if (String(b['@type'] ?? '') !== 'Event') continue;

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
    const price = offers?.price != null
      ? (Number(offers.price) === 0 ? 'Free' : `${offers.price} RON`)
      : null;

    events.push({
      title,
      venue,
      date,
      time: extractTime(startDate),
      description: description || null,
      image_url,
      event_url: String(b.url ?? LIST_URL),
      genres: guessGenres(title, description),
      price,
    });
  }

  return events;
}

function fromHtml(html: string): ScrapedEvent[] {
  const today = new Date().toISOString().split('T')[0];
  const events: ScrapedEvent[] = [];

  // ambilet event links pattern
  const linkRegex = /<a[^>]+href="((?:https?:\/\/(?:www\.)?ambilet\.ro)?\/bilete-[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();

  while ((match = linkRegex.exec(html)) !== null) {
    let url = match[1];
    if (!url.startsWith('http')) url = `${BASE_URL}${url}`;
    if (seen.has(url)) continue;
    seen.add(url);

    const inner = match[2];
    const title = clean(inner.replace(/<[^>]+>/g, '').trim().split('\n')[0]);
    if (!title || title.length < 3) continue;

    const dateMatch = inner.match(/(\d{1,2}[.\-]\d{1,2}[.\-]\d{4})|(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? parseDate(dateMatch[0]) : null;
    if (!date || date < today) continue;

    const imgMatch = match[0].match(/<img[^>]+src="([^"]+)"/i);

    events.push({
      title,
      venue: 'Venue TBC',
      date,
      time: null,
      description: null,
      image_url: imgMatch?.[1] ?? '',
      event_url: url,
      genres: guessGenres(title, ''),
      price: null,
    });
  }

  return events;
}

export async function scrapeAmbilet(): Promise<ScrapedEvent[]> {
  try {
    const html = await fetchHtml(LIST_URL);
    const fromLd = fromJsonLd(html);
    if (fromLd.length > 0) return fromLd;
    return fromHtml(html);
  } catch (err) {
    console.warn('[ambilet] scrape failed:', err);
    return [];
  }
}
