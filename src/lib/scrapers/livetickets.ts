// ─────────────────────────────────────────────────────────────────────────────
// livetickets.ro scraper
// Site: Romanian ticketing platform with a public REST API
// Strategy: Query the JSON API directly (no HTML scraping needed).
//           API returns rich structured data with venue, price, and description.
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';
import { parseDate, extractTime, clean, guessGenres } from './utils';

// The API has no working city filter param; fetch all Romanian events and
// filter client-side. Important: page 1 is not enough. Relevant events can sit
// on later pages, which leaves weaker aggregator rows alive.
const API_BASE_URL = 'https://api.livetickets.ro/public/event-search';
const PAGE_SIZE = 200;
const MAX_PAGES = 5;
const IMG_CDN = 'https://livetickets-cdn.azureedge.net/itemimages/';
const WEB_BASE = 'https://www.livetickets.ro';

const API_HEADERS = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Flow-Language-Code': 'RO',
};

interface LiveticketsItem {
  event_id?: string;
  name?: string;
  start_date?: string;
  description?: string;
  image?: string;
  url?: string;
  price_min?: number | string;
  price_max?: number | string;
  currency?: { symbol?: string };
  image_token?: string;
  // Venue can come from multiple fields depending on API version
  location?: string;
  venue?: string;
  venue_name?: string;
  place?: string;
  place_name?: string;
  city?: string;
  city_name?: string;
}

let liveticketsItemsPromise: Promise<LiveticketsItem[]> | null = null;

function buildApiUrl(pageNumber: number): string {
  return `${API_BASE_URL}?spc.numberOfRecords=${PAGE_SIZE}&spc.pageNumber=${pageNumber}`;
}

function normalizeLiveticketsSlug(url: string): string {
  try {
    const parsed = new URL(url, WEB_BASE);
    const marker = '/bilete/';
    const idx = parsed.pathname.toLowerCase().indexOf(marker);
    if (idx === -1) return '';
    return parsed.pathname.slice(idx + marker.length).replace(/^\/+|\/+$/g, '').toLowerCase();
  } catch {
    const marker = '/bilete/';
    const lower = url.toLowerCase();
    const idx = lower.indexOf(marker);
    return idx === -1 ? '' : lower.slice(idx + marker.length).replace(/^\/+|\/+$/g, '');
  }
}

export function formatLiveticketsPrice(item: LiveticketsItem): string | null {
  const priceMin = parseFloat(String(item.price_min ?? ''));
  const priceMax = parseFloat(String(item.price_max ?? ''));
  const currency = item.currency?.symbol ?? 'RON';

  if (isNaN(priceMin)) return null;
  if (priceMin === 0 && (isNaN(priceMax) || priceMax === 0)) return 'Free';
  if (!isNaN(priceMax) && priceMax > priceMin) return `${priceMin} - ${priceMax} ${currency}`;
  return `${priceMin} ${currency}`;
}

async function fetchLiveticketsPage(pageNumber: number): Promise<LiveticketsItem[]> {
  const res = await fetch(buildApiUrl(pageNumber), { headers: API_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} on page ${pageNumber}`);

  const data = (await res.json()) as { events?: { items?: LiveticketsItem[] } };
  return data.events?.items ?? [];
}

async function fetchAllLiveticketsItems(): Promise<LiveticketsItem[]> {
  if (!liveticketsItemsPromise) {
    liveticketsItemsPromise = (async () => {
      const allItems: LiveticketsItem[] = [];
      const seen = new Set<string>();

      for (let page = 1; page <= MAX_PAGES; page++) {
        const items = await fetchLiveticketsPage(page);
        console.log(`[livetickets] API page ${page} returned ${items.length} raw items`);

        for (const item of items) {
          const dedupeKey = item.event_id ?? item.url ?? `${item.name ?? ''}|${item.start_date ?? ''}`;
          if (seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);
          allItems.push(item);
        }

        if (items.length < PAGE_SIZE) break;
      }

      return allItems;
    })();
  }

  return liveticketsItemsPromise;
}

export async function fetchLiveticketsEventByUrl(url: string): Promise<LiveticketsItem | null> {
  const slug = normalizeLiveticketsSlug(url);
  if (!slug) return null;

  const items = await fetchAllLiveticketsItems();
  return items.find(item => (item.url ?? '').toLowerCase() === slug) ?? null;
}

/** Resolve the best venue name from an API item. */
function resolveVenue(item: LiveticketsItem): string {
  const raw =
    item.venue_name ??
    item.venue ??
    item.place_name ??
    item.place ??
    item.location ??
    '';
  return clean(raw) || 'Venue TBC';
}

/** Resolve event URL — prefer livetickets.ro domain. */
function resolveUrl(item: LiveticketsItem): string {
  const raw = item.url ?? '';
  if (!raw) return '';
  if (raw.startsWith('http')) return raw;
  return `${WEB_BASE}/bilete/${raw}`;
}

// Known foreign city/country hints that should never appear in Romanian results
const FOREIGN_HINTS = [
  'germany', 'deutschland', 'berlin', 'hamburg', 'munich', 'münchen', 'frankfurt',
  'köln', 'dortmund', 'düsseldorf', 'stuttgart', 'friedrichshain', 'kreuzberg',
  'prenzlauer', 'alt-stralau', 'stralau',
  'france', 'paris', 'london', 'united kingdom', 'netherlands', 'amsterdam',
  'barcelona', 'spain', 'budapest', 'hungary', 'prague', 'czech', 'warsaw', 'poland',
];

/** Confirm the item is from Bucharest or Constanta (API search can return nearby cities). */
function matchesCity(item: LiveticketsItem, expectedCity: string): boolean {
  const rawCity   = clean(item.city_name ?? item.city ?? '').toLowerCase();
  const rawVenue  = clean(item.venue_name ?? item.venue ?? item.place_name ?? item.place ?? item.location ?? '').toLowerCase();
  const rawName   = clean(item.name ?? '').toLowerCase();
  const rawDescription = clean((item.description ?? '').replace(/<[^>]+>/g, ' ')).toLowerCase();
  const rawUrl = clean(item.url ?? '').toLowerCase();

  // Reject anything with a confirmed foreign-country/city hint in any field
  const textToCheck = `${rawCity} ${rawVenue} ${rawName} ${rawDescription} ${rawUrl}`;
  const allForeignHints = [...FOREIGN_HINTS, 'bulgaria', 'varna', 'golden sands', 'black sea coast'];
  if (allForeignHints.some(h => textToCheck.includes(h))) return false;

  // Other Romanian cities — if found in name/venue, reject for both Bucharest and Constanta
  const OTHER_RO_CITIES = [
    'cluj', 'timisoa', 'iași', 'iasi', 'brașov', 'brasov',
    'craiova', 'galați', 'galati', 'ploiești', 'ploiesti',
    'sibiu', 'arad', 'oradea', 'bacău', 'bacau', 'baia mare',
    'pitești', 'pitesti', 'buzău', 'buzau', 'suceava', 'târgu', 'targu',
  ];
  const hasOtherRoCity = OTHER_RO_CITIES.some(c =>
    rawCity.includes(c) || rawVenue.includes(c) || rawName.includes(c)
  );
  if (hasOtherRoCity) return false;

  if (expectedCity === 'Bucharest') {
    // Primary: city field contains "bucure" or "ilfov"
    if (rawCity.includes('bucure') || rawCity.includes('ilfov')) return true;
    // Fallback: livetickets sometimes stores garbage in city (e.g. "belgië").
    // If the event NAME explicitly says "București", trust that.
    if (rawName.includes('bucure')) return true;
    // Unknown city AND no name hint → skip
    if (rawCity) return false;
    return true; // empty city, no foreign/other-city hints → keep
  }
  if (expectedCity === 'Constanta') {
    if (rawCity.includes('constan') || rawCity.includes('mamaia')) return true;
    if (rawName.includes('constan') || rawName.includes('mamaia')) return true;
    if (rawCity) return false;
    return true;
  }
  return true;
}

export async function scrapeLivetickets(): Promise<ScrapedEvent[]> {
  const allEvents: ScrapedEvent[] = [];
  const today = new Date().toISOString().split('T')[0];

  try {
    const items = await fetchAllLiveticketsItems();
    console.log(`[livetickets] API returned ${items.length} raw items after pagination`);

    for (const item of items) {
      const startDate = String(item.start_date ?? '');
      const date = parseDate(startDate);
      if (!date || date < today) continue;

      // Determine city by client-side matching (Bucharest checked first)
      let city: string | null = null;
      if (matchesCity(item, 'Bucharest')) city = 'Bucharest';
      else if (matchesCity(item, 'Constanta')) city = 'Constanta';
      if (!city) continue;

      const title = clean(item.name);
      if (!title) continue;

      // Strip HTML from API description (livetickets sometimes returns HTML)
      const description = clean(item.description?.replace(/<[^>]+>/g, ' ') ?? '') || null;

      // CDN URL: https://livetickets-cdn.azureedge.net/itemimages/{slug}/Background_MEDIUM.jpg?{token}
      const image_url = item.url && item.image_token
        ? `${IMG_CDN}${item.url}/Background_MEDIUM.jpg?${item.image_token}`
        : '';
      const event_url = resolveUrl(item);

      const price = formatLiveticketsPrice(item);

      const genres = guessGenres(title, description ?? '');
      if (!genres) continue;

      allEvents.push({
        title,
        venue: resolveVenue(item),
        date,
        time: extractTime(startDate),
        description,
        image_url,
        event_url,
        ticket_url: event_url,
        genres,
        price,
        city,
      });
    }

    const buc = allEvents.filter(e => e.city === 'Bucharest').length;
    const cst = allEvents.filter(e => e.city === 'Constanta').length;
    console.log(`[livetickets] kept ${buc} Bucharest + ${cst} Constanta music events`);
  } catch (err) {
    console.warn('[livetickets] failed:', err);
  }

  return allEvents;
}
