// ─────────────────────────────────────────────────────────────────────────────
// bilete.emagic.ro scraper
// Strategy:
//   1. Fetch the homepage listing
//   2. Extract numeric event URLs from .eventblock cards
//   3. Use the city text in .eventblockinfowhen to keep only Bucharest +
//      Constanta area events
//   4. Deep-fetch each detail page for title, banner, price, and description
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { batchFetch, clean, containsUnexpectedCitySignal, fetchHtml, parseDate } from './utils';

const LIST_URLS = [
  {
    url: 'https://bilete.emagic.ro',
    city: 'Mixed',
    allowedCities: [
      'bucuresti', 'bucharest', 'ilfov', 'sector',
      'constanta', 'constanța', 'mamaia', 'navodari', 'năvodari',
      'costinesti', 'costinești', 'eforie', 'eforie nord', 'eforie sud',
      'neptun', 'mangalia', 'venus', 'saturn', 'olimp', 'jupiter',
      'techirghiol', 'corbu', 'culmea', '2 mai', 'vama veche',
    ],
  },
];

type EmagicCity = 'Bucharest' | 'Constanta';

type EmagicListingCard = {
  url: string;
  title: string;
  date: string;
  city: EmagicCity;
  poster_url: string;
};

const BUCURESTI_SIGNALS = ['bucuresti', 'bucharest', 'ilfov', 'sector'];
const CONSTANTA_SIGNALS = [
  'constanta', 'constanța', 'mamaia', 'navodari', 'năvodari',
  'costinesti', 'costinești', 'eforie', 'eforie nord', 'eforie sud',
  'neptun', 'mangalia', 'venus', 'saturn', 'olimp', 'jupiter',
  'techirghiol', 'corbu', 'culmea', '2 mai', 'vama veche',
];

const COMBINED_ALLOWED_CITIES = Array.from(new Set([...BUCURESTI_SIGNALS, ...CONSTANTA_SIGNALS]));
const NON_MUSIC_HINTS = /\b(?:the real|talk|interview|lecture|conference|podcast|masterclass|panel|discussion|author|writer|book launch|reading|stand-up|stand up|comedy|theatre|teatru|ballet|opera|cinema|movie|film)\b/i;

function canonicalCity(raw: string): EmagicCity | null {
  const text = clean(raw)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!text) return null;
  if (BUCURESTI_SIGNALS.some(signal => text.includes(signal))) return 'Bucharest';
  if (CONSTANTA_SIGNALS.some(signal => text.includes(signal))) return 'Constanta';
  return null;
}

function extractPosterUrl(block: string): string {
  const match = block.match(/background-image:\s*url\((['"]?)(.*?)\1\)/i);
  return match?.[2]?.trim() ?? '';
}

function extractListingCards(html: string): EmagicListingCard[] {
  const cards: EmagicListingCard[] = [];
  const seen = new Set<string>();

  const cardRe = /<a\b(?=[^>]*class=["'][^"']*\beventblock\b[^"']*["'])(?=[^>]*href=["']([^"']+)["'])[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = cardRe.exec(html)) !== null) {
    const url = match[1].trim();
    const block = match[2];
    if (!/\?p=event&e=\d+/i.test(url)) continue;
    if (seen.has(url)) continue;

    const title = clean(block.match(/class=["'][^"']*\beventblockinfoname\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? '');
    const whenHtml = block.match(/class=["'][^"']*\beventblockinfowhen\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? '';
    const cityText = clean(whenHtml.split('<span class="fa fa-map-marker"></span>')[1] ?? '');
    const dateText = clean(whenHtml.split('<span class="fa fa-map-marker"></span>')[0] ?? '');
    const city = canonicalCity(cityText);
    const date = parseDate(dateText);

    if (!city || !date) continue;
    if (NON_MUSIC_HINTS.test([title, whenHtml].join(' '))) continue;
    if (containsUnexpectedCitySignal([title, whenHtml].join(' '), COMBINED_ALLOWED_CITIES)) continue;

    seen.add(url);
    cards.push({
      url,
      title,
      date,
      city,
      poster_url: extractPosterUrl(block),
    });
  }

  return cards;
}

export async function scrapeEmagic(settings?: { scan_depth?: number; concurrency?: number }): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];
  const limit = Math.max(20, Math.min(settings?.scan_depth ?? 60, 120));
  const batchSize = Math.max(3, Math.min(settings?.concurrency ?? 5, 8));

  for (const { url, city, allowedCities } of LIST_URLS) {
    try {
      const html = await fetchHtml(url, 15_000);
      const cards = extractListingCards(html).filter(card => !containsUnexpectedCitySignal([card.title, card.city].join(' '), allowedCities));
      if (cards.length === 0) {
        console.log(`[emagic] ${city}: no candidate cards found`);
        continue;
      }

      const buckets = new Map<EmagicCity, EmagicListingCard[]>();
      for (const card of cards) {
        if (!buckets.has(card.city)) buckets.set(card.city, []);
        buckets.get(card.city)!.push(card);
      }

      for (const [bucketCity, bucketCards] of Array.from(buckets.entries()) as Array<[EmagicCity, EmagicListingCard[]]>) {
        const cardMap = new Map<string, EmagicListingCard>();
        const urls: string[] = Array.from(new Set(bucketCards.map((card: EmagicListingCard) => card.url)));

        for (const card of bucketCards) {
          cardMap.set(card.url, card);
        }

        const events = await batchFetch(urls, bucketCity, {
          limit,
          batchSize,
          allowedCities: bucketCity === 'Bucharest' ? BUCURESTI_SIGNALS : CONSTANTA_SIGNALS,
        });

        const keptEvents = events.filter((event) => {
          const card = cardMap.get(event.event_url);
          if (card) {
            event.date = card.date || event.date;
            event.city = card.city;
            if (!event.image_url && card.poster_url) event.image_url = card.poster_url;
            if (!event.title && card.title) event.title = card.title;
          }

          return !NON_MUSIC_HINTS.test([event.title, event.description ?? '', event.venue].join(' '));
        });

        console.log(`[emagic] ${bucketCity}: kept ${keptEvents.length} music events`);
        allEvents.push(...keptEvents);
      }
    } catch (err) {
      console.warn(`[emagic] failed for ${url}:`, err);
    }
  }

  return allEvents;
}
