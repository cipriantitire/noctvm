// ─────────────────────────────────────────────────────────────────────────────
// feverup.com scraper
// Strategy:
//   1. Query Fever's public Algolia index (primary path)
//   2. Fallback to Fever public plans API
//   3. Fallback to listing-page JSON-LD / embedded URLs + deep fetch
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import {
  batchFetch,
  clean,
  extractTime,
  fetchHtml,
  guessGenres,
  parseDate,
  parseEventsFromJsonLd,
  extractUrlsFromJsonLd,
} from './utils';

const ALGOLIA_APP_ID = 'I80Y2BQLSL';
const ALGOLIA_API_KEY = 'e4226055c240f9e38e89794dcfb91766';
const ALGOLIA_INDEX_CANDIDATES = ['Prod-plan', 'Prod-plans', 'Prod-FeverCitySearch'] as const;
const ALGOLIA_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries`;

const FEVER_BASE = 'https://feverup.com';

const CITY_CONFIGS = [
  {
    city: 'Constanta',
    query: 'constanta candlelight',
    listingUrl: 'https://feverup.com/ro/constanta/candlelight',
    apiCities: ['constanta'],
    allowedCities: ['constanta', 'mamaia', 'navodari', 'năvodari', 'eforie', 'costinesti', 'costinești'],
  },
  {
    city: 'Bucharest',
    query: 'bucharest candlelight',
    listingUrl: 'https://feverup.com/ro/bucuresti/candlelight',
    apiCities: ['bucuresti', 'bucharest'],
    allowedCities: ['bucuresti', 'bucharest', 'ilfov', 'sector'],
  },
] as const;

type FeverLikeItem = Record<string, unknown>;

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return clean(value);
  }
  return '';
}

function extractFeverImage(item: FeverLikeItem): string {
  const direct = pickString(item.image, item.image_url, item.cover_image, item.thumbnail);
  if (direct) return direct;

  for (const candidate of asArray<unknown>(item.images)) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
    if (candidate && typeof candidate === 'object') {
      const nested = candidate as Record<string, unknown>;
      const url = pickString(nested.url, nested.src, nested.image);
      if (url) return url;
    }
  }

  return '';
}

function formatPrice(value: unknown): string | null {
  if (value == null) return null;

  if (typeof value === 'number') return value === 0 ? 'Free' : `${value} RON`;
  if (typeof value === 'string') {
    const cleaned = clean(value);
    return cleaned || null;
  }

  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    const currency = pickString(v.currency, v.currency_code, v.symbol) || 'RON';
    const min = Number(v.min ?? v.min_price ?? v.from ?? v.low);
    const max = Number(v.max ?? v.max_price ?? v.to ?? v.high);
    const amount = Number(v.amount ?? v.value ?? v.price);

    if (Number.isFinite(min) && Number.isFinite(max)) {
      if (min === 0 && max === 0) return 'Free';
      if (min === max) return `${min} ${currency}`;
      if (min === 0) return `Free - ${max} ${currency}`;
      return `${min} - ${max} ${currency}`;
    }

    if (Number.isFinite(amount)) return amount === 0 ? 'Free' : `${amount} ${currency}`;
  }

  return null;
}

function normalizeEventUrl(urlValue: unknown, slugValue: unknown): string {
  const fromUrl = pickString(urlValue);
  if (fromUrl) {
    if (fromUrl.startsWith('http')) return fromUrl;
    return `${FEVER_BASE}${fromUrl.startsWith('/') ? '' : '/'}${fromUrl}`;
  }

  const slug = pickString(slugValue);
  if (!slug) return '';
  return `${FEVER_BASE}${slug.startsWith('/') ? '' : '/'}${slug}`;
}

function resolveCity(item: FeverLikeItem, fallbackCity: string): string {
  const cityRaw = pickString(item.city, (item.city as Record<string, unknown> | undefined)?.name, item.city_name).toLowerCase();
  const venueRaw = pickString(item.venue_name, (item.venue as Record<string, unknown> | undefined)?.name).toLowerCase();
  const blob = `${cityRaw} ${venueRaw}`;

  if (/constan|mamaia|costinesti|costinești|navodari|năvodari/.test(blob)) return 'Constanta';
  if (/bucure|bucharest|ilfov|sector/.test(blob)) return 'Bucharest';
  return fallbackCity;
}

function candlelightGenres(title: string, description: string): string[] | null {
  const guessed = guessGenres(title, description);
  const signal = `${title} ${description}`.toLowerCase();
  const isCandlelight = /candlelight|classical|filarmonic|orchestra|quartet/.test(signal);

  if (!guessed && isCandlelight) return ['Live Music'];
  if (!guessed) return null;
  if (isCandlelight && !guessed.includes('Live Music')) return [...guessed, 'Live Music'];
  return guessed;
}

function mapFeverItem(item: FeverLikeItem, fallbackCity: string): ScrapedEvent | null {
  const title = pickString(item.title, item.name, item.event_name);
  if (!title) return null;

  const startRaw = pickString(item.start_date, item.startDate, item.date, item.datetime, item.starts_at);
  const date = parseDate(startRaw);
  if (!date) return null;
  if (date < new Date().toISOString().split('T')[0]) return null;

  const venue = pickString(
    item.venue_name,
    (item.venue as Record<string, unknown> | undefined)?.name,
    item.location_name,
    (item.location as Record<string, unknown> | undefined)?.name,
  ) || 'Venue TBC';

  const description = pickString(item.description, item.summary, item.short_description) || null;
  const genres = candlelightGenres(title, description ?? '');
  if (!genres) return null;

  const event_url = normalizeEventUrl(item.url, item.slug);
  if (!event_url) return null;

  const image_url = extractFeverImage(item);
  const price =
    formatPrice(item.price) ??
    formatPrice(item.price_range) ??
    formatPrice(item.offers) ??
    formatPrice(item.ticket_price) ??
    null;

  const timeFromField = pickString(item.time, item.start_time);

  return {
    title,
    venue,
    date,
    time: extractTime(startRaw) || (timeFromField.match(/\b\d{1,2}:\d{2}\b/)?.[0] ?? null),
    description,
    image_url,
    event_url,
    ticket_url: normalizeEventUrl(item.ticket_url, null) || event_url,
    genres,
    price,
    city: resolveCity(item, fallbackCity),
  };
}

async function fetchAlgoliaItems(query: string, hitsPerPage: number): Promise<FeverLikeItem[]> {
  const params = new URLSearchParams({
    query,
    hitsPerPage: String(hitsPerPage),
  });

  let lastError: string | null = null;
  let hadSuccessfulResponse = false;

  for (const indexName of ALGOLIA_INDEX_CANDIDATES) {
    const res = await fetch(ALGOLIA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
      },
      body: JSON.stringify({
        requests: [{
          indexName,
          params: params.toString(),
        }],
      }),
    });

    if (!res.ok) {
      lastError = `${indexName}: HTTP ${res.status}`;
      continue;
    }

    hadSuccessfulResponse = true;

    const json = (await res.json()) as { results?: Array<{ hits?: FeverLikeItem[] }> };
    const hits = asArray<FeverLikeItem>(json.results?.[0]?.hits);

    // Ignore city-search style indexes (they don't contain event URLs/titles in scraper shape).
    const eventLikeHits = hits.filter((hit) => !!normalizeEventUrl(hit.url, hit.slug) && !!pickString(hit.title, hit.name, hit.event_name));
    if (eventLikeHits.length > 0) {
      console.log(`[fever] Algolia index ${indexName} yielded ${eventLikeHits.length} event-like hits`);
      return eventLikeHits;
    }
  }

  if (!hadSuccessfulResponse && lastError) throw new Error(`Algolia request failed (${lastError})`);
  return [];
}

async function fetchPlansApiItems(cityParam: string): Promise<FeverLikeItem[]> {
  const url = `https://feverup.com/api/4.2/plans?city=${encodeURIComponent(cityParam)}&section=candlelight&locale=ro-RO`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return [];

  const json = (await res.json()) as Record<string, unknown>;
  const plans = asArray<FeverLikeItem>(json.plans);
  const dataPlans = asArray<FeverLikeItem>((json.data as Record<string, unknown> | undefined)?.plans);
  const nested = asArray<FeverLikeItem>((json.data as Record<string, unknown> | undefined)?.items);
  return [...plans, ...dataPlans, ...nested];
}

function extractEmbeddedEventUrls(html: string): string[] {
  const urls = new Set<string>();
  const normalizedHtml = html.replace(/\\\//g, '/');
  const patterns = [
    /"url"\s*:\s*"(https?:\/\/feverup\.com\/[^"\\]+)"/gi,
    /href=["'](https?:\/\/feverup\.com\/[^"']+)["']/gi,
    /href=["'](\/m\/\d+)["']/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(normalizedHtml)) !== null) {
      const normalized = match[1]
        .replace(/\/$/, '')
        .trim();
      const absolute = normalized.startsWith('http')
        ? normalized
        : `${FEVER_BASE}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
      if (/\/events?\//i.test(absolute) || /\/candlelight\//i.test(absolute) || /\/m\/\d+$/i.test(absolute)) {
        urls.add(absolute);
      }
    }
  }

  return Array.from(urls);
}

export async function scrapeFever(settings?: { scan_depth?: number; concurrency?: number }): Promise<ScrapedEvent[]> {
  const hitsPerPage = Math.max(20, Math.min(settings?.scan_depth ?? 40, 100));
  const batchSize = Math.max(2, Math.min(settings?.concurrency ?? 6, 10));
  const collected: ScrapedEvent[] = [];

  for (const config of CITY_CONFIGS) {
    let cityEvents: ScrapedEvent[] = [];

    try {
      const algoliaItems = await fetchAlgoliaItems(config.query, hitsPerPage);
      cityEvents = algoliaItems
        .map((item) => mapFeverItem(item, config.city))
        .filter((event): event is ScrapedEvent => !!event);

      if (cityEvents.length > 0) {
        console.log(`[fever] ${config.city}: ${cityEvents.length} events from Algolia`);
      }
    } catch (error) {
      console.warn(`[fever] ${config.city}: Algolia fetch failed`, error);
    }

    if (cityEvents.length === 0) {
      try {
        const apiItems = (
          await Promise.all(config.apiCities.map((cityParam) => fetchPlansApiItems(cityParam)))
        ).flat();

        cityEvents = apiItems
          .map((item) => mapFeverItem(item, config.city))
          .filter((event): event is ScrapedEvent => !!event);

        if (cityEvents.length > 0) {
          console.log(`[fever] ${config.city}: ${cityEvents.length} events from plans API`);
        }
      } catch (error) {
        console.warn(`[fever] ${config.city}: plans API fallback failed`, error);
      }
    }

    if (cityEvents.length === 0) {
      try {
        const html = await fetchHtml(config.listingUrl, 20_000);

        const ldEvents = parseEventsFromJsonLd(html, config.city)
          .map((event) => {
            const genres = candlelightGenres(event.title, event.description ?? '');
            if (!genres) return null;
            return { ...event, genres };
          })
          .filter((event): event is ScrapedEvent => !!event);

        if (ldEvents.length > 0) {
          cityEvents = ldEvents;
          console.log(`[fever] ${config.city}: ${cityEvents.length} events from listing JSON-LD`);
        } else {
          const urls = Array.from(
            new Set([
              ...extractUrlsFromJsonLd(html, FEVER_BASE),
              ...extractEmbeddedEventUrls(html),
            ]),
          );

          if (urls.length > 0) {
            cityEvents = await batchFetch(urls, config.city, {
              limit: hitsPerPage,
              batchSize,
              allowedCities: [...config.allowedCities],
            });

            cityEvents = cityEvents
              .map((event) => {
                const genres = candlelightGenres(event.title, event.description ?? '');
                if (!genres) return null;
                return { ...event, genres };
              })
              .filter((event): event is ScrapedEvent => !!event);
          }

          console.log(`[fever] ${config.city}: ${cityEvents.length} events from HTML fallback`);
        }
      } catch (error) {
        console.warn(`[fever] ${config.city}: HTML fallback failed`, error);
      }
    }

    collected.push(...cityEvents);
  }

  const deduped = new Map<string, ScrapedEvent>();
  for (const event of collected) {
    const key = `${event.title.toLowerCase()}|${event.venue.toLowerCase()}|${event.date}|${event.city ?? ''}`;
    if (!deduped.has(key)) {
      deduped.set(key, event);
      continue;
    }

    const current = deduped.get(key)!;
    const currentScore = Number(!!current.ticket_url) + Number(!!current.price) + Number(!!current.image_url);
    const candidateScore = Number(!!event.ticket_url) + Number(!!event.price) + Number(!!event.image_url);
    if (candidateScore > currentScore) deduped.set(key, event);
  }

  return Array.from(deduped.values());
}
