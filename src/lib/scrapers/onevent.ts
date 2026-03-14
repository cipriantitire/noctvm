// ─────────────────────────────────────────────────────────────────────────────
// onevent.ro scraper
// Site: Romanian event listing platform
// Strategy: JSON-LD → HTML event cards → Open Graph meta
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { extractJsonLd, parseDate, extractTime, clean, guessGenres, fetchHtml } from './utils';

const LIST_URL = 'https://www.onevent.ro/events/bucharest/';
const BASE_URL  = 'https://www.onevent.ro';

function fromJsonLd(html: string): ScrapedEvent[] {
  const today = new Date().toISOString().split('T')[0];
  const events: ScrapedEvent[] = [];

  for (const block of extractJsonLd(html)) {
    const b = block as Record<string, unknown>;
    const type = String(b['@type'] ?? '');
    if (!type.includes('Event')) continue;

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
      : Array.isArray(img) ? String(img[0]) ?? ''
      : (img as Record<string, unknown>)?.url as string ?? '';

    events.push({
      title,
      venue,
      date,
      time: extractTime(startDate),
      description: description || null,
      image_url,
      event_url: String(b.url ?? LIST_URL),
      genres: guessGenres(title, description),
      price: null,
    });
  }

  return events;
}

function fromHtml(html: string): ScrapedEvent[] {
  const today = new Date().toISOString().split('T')[0];
  const events: ScrapedEvent[] = [];

  // Generic event card pattern: anchor with event URL
  const linkRegex = /<a[^>]+href="(https?:\/\/www\.onevent\.ro\/event\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();

  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    if (seen.has(url)) continue;
    seen.add(url);

    const inner = match[2];
    const title = clean(inner.replace(/<[^>]+>/g, '').split('\n').find(l => l.trim()) ?? '');
    if (!title || title.length < 3) continue;

    const imgMatch = html.slice(Math.max(0, match.index - 500), match.index + 500)
      .match(/<img[^>]+src="([^"]+)"/i);
    const dateMatch = inner.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2}[.\-]\d{1,2}[.\-]\d{4})/);
    const date = dateMatch ? parseDate(dateMatch[0]) : null;
    if (!date || date < today) continue;

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

export async function scrapeOnevent(): Promise<ScrapedEvent[]> {
  try {
    const html = await fetchHtml(LIST_URL);
    const fromLd = fromJsonLd(html);
    if (fromLd.length > 0) return fromLd;
    return fromHtml(html);
  } catch (err) {
    console.warn('[onevent] scrape failed:', err);
    return [];
  }
}
