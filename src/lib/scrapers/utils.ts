// ─────────────────────────────────────────────────────────────────────────────
// Shared scraper utilities
// ─────────────────────────────────────────────────────────────────────────────

import { ScrapedEvent } from './types';

// ── JSON-LD ───────────────────────────────────────────────────────────────────

/** Extract all JSON-LD blocks from raw HTML. */
export function extractJsonLd(html: string): unknown[] {
  const results: unknown[] = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      let content = match[1].trim()
        .replace(/\/\*<!\[CDATA\[\*\//g, '').replace(/\/\*\]\]>\*\//g, '')
        .replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        results.push(...parsed);
      } else if (parsed && typeof parsed === 'object' && '@graph' in parsed && Array.isArray(parsed['@graph'])) {
        results.push(...(parsed['@graph'] as unknown[]));
      } else {
        results.push(parsed);
      }
    } catch { /* malformed JSON-LD — skip */ }
  }
  return results;
}

// ── Open Graph ────────────────────────────────────────────────────────────────

/** Extract og: and twitter: meta tag values from HTML (handles any attribute order). */
export function extractOgMeta(html: string): Record<string, string> {
  const result: Record<string, string> = {};

  // Match any <meta> tag and then pull property/name + content from it
  const tagRe = /<meta\s([^>]+?)(?:\s*\/)?>/gi;
  let tag;
  while ((tag = tagRe.exec(html)) !== null) {
    const attrs = tag[1];

    const propMatch  = attrs.match(/property=["']([^"']+)["']/i);
    const nameMatch  = attrs.match(/name=["']([^"']+)["']/i);
    const contMatch  = attrs.match(/content=["']([^"']*)["']/i);

    if (!contMatch) continue;
    const value = contMatch[1];

    if (propMatch) result[propMatch[1]] = value;       // og:title, twitter:image …
    if (nameMatch) result[nameMatch[1]] = value;       // description, keywords …
  }

  return result;
}

// ── Date / Time ───────────────────────────────────────────────────────────────

const RO_MONTHS: Record<string, string> = {
  ianuarie: '01', ian: '01',
  februarie: '02', feb: '02',
  martie: '03', mar: '03',
  aprilie: '04', apr: '04',
  mai: '05',
  iunie: '06', iun: '06',
  iulie: '07', iul: '07',
  august: '08', aug: '08',
  septembrie: '09', sep: '09',
  octombrie: '10', oct: '10',
  noiembrie: '11', nov: '11',
  decembrie: '12', dec: '12',
};

/** Normalise various date strings to YYYY-MM-DD. Returns null if unparseable. */
export function parseDate(raw: string): string | null {
  if (!raw) return null;
  const currentYear = new Date().getFullYear().toString();
  const isValidYear = (y: number) => y >= 2020 && y <= 2100;

  // ISO-like: 2026-03-15 or 2026-3-15 (or ISO datetime: 2026-03-15T20:00:00)
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    if (!isValidYear(parseInt(y, 10))) return null;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // European numeric: 15.03.2026 or 15/03/2026
  const euNumeric = raw.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/);
  if (euNumeric) {
    const [, d, m, y] = euNumeric;
    if (!isValidYear(parseInt(y, 10))) return null;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Short numeric without year: 14/03 or 14.03
  const shortNumeric = raw.match(/(\d{1,2})[.\/](\d{1,2})(?!\d)/);
  if (shortNumeric) {
    const [, d, m] = shortNumeric;
    return `${currentYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Romanian text: "15 Martie 2026" or "15 mar 2026"
  const roText = raw.toLowerCase().match(/(\d{1,2})\s+([a-zăîâșț]{3,})\.?(\s+(\d{4}))?/);
  if (roText) {
    const [, day, monthStr, , year] = roText;
    const monthNum = RO_MONTHS[monthStr] ?? RO_MONTHS[monthStr.slice(0, 3)];
    if (monthNum) {
      const yr = year || currentYear;
      if (!isValidYear(parseInt(yr, 10))) return null;
      return `${yr}-${monthNum}-${day.padStart(2, '0')}`;
    }
  }

  // Fallback: native Date — only accept if year is sane
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime()) && isValidYear(d.getFullYear())) {
      return d.toISOString().split('T')[0];
    }
  } catch { /* skip */ }

  return null;
}

/** Extract HH:MM from an ISO datetime string. */
export function extractTime(iso: string): string | null {
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : null;
}

// ── Text helpers ──────────────────────────────────────────────────────────────

/**
 * If a title encodes the venue as "Event @ Venue" or "Event @Venue", split them.
 * Handles both " @ " (space-at-space) and " @X" (no space after @, used by ambilet).
 * Returns cleaned title and an optional venue hint.
 */
export function splitTitleVenue(title: string): { title: string; venueHint: string | null } {
  // Prefer " @ " (unambiguous separator)
  const spaceAtSpace = title.indexOf(' @ ');
  if (spaceAtSpace > 3) {
    return {
      title: title.slice(0, spaceAtSpace).trim(),
      venueHint: title.slice(spaceAtSpace + 3).trim() || null,
    };
  }
  // Also handle " @Venue" (ambilet: "Grimus @The Pub Universității")
  const compactAt = title.search(/ @\S/);
  if (compactAt > 3) {
    return {
      title: title.slice(0, compactAt).trim(),
      venueHint: title.slice(compactAt + 2).trim() || null,
    };
  }
  return { title, venueHint: null };
}

/** Collapse whitespace, strip HTML entities, and trim. */
export function clean(text: string | null | undefined): string {
  return (text ?? '')
    .replace(/<[^>]+>/g, ' ')        // strip any residual HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&bull;/g, '•')
    .replace(/&#8226;/g, '•')
    .replace(/&#\d+;/g, c => { try { return String.fromCodePoint(parseInt(c.slice(2, -1), 10)); } catch { return c; } })
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Genre / music filter ──────────────────────────────────────────────────────

/**
 * ABSOLUTE blocks — dropped even if the title also contains a music term.
 * "Concert pentru copii" IS still a children's event, not nightlife.
 */
const HARD_BLOCK_TERMS = [
  'pentru copii', 'spectacol copii', 'atelier copii', 'activitati copii', 'povestea celor', 'purcelusi',
  'copii', 'marionete', 'papusi', 'copilasi', 'bebelusi', 'parinti', 'mamici',
  'educativ', 'educational', 'clasa a', 'cambridge', 'scoala', 'gradinita',
  'balet', 'ballet', 'lectii',
  'festival de film', 'festival culinar', 'festival de gastronomie', 'festival de arta', 'festival de arte',
  'festival de ceramica', 'festival de carte', 'festival literar',
  'muzeul', 'muzeu', 'muzeale', 'comunismul', 'realismul socialist', 'ceramica', 'palatul sutu',
  'expozitia', 'vernisaj', 
  // Theatre & Comedy
  'show de comedie', 'show comedie', 'comedie pentru', 'comedie corporatisti', 'stand-up', 'standup', 'stand up', 'comedy show', 'improv',
  'teatru interactiv', 'teatru pentru', 'spectacol de teatru',
  'teatru de vara', 'teatrul de vara', 'teatru vara', 'teatru aer liber',
  'piesa de teatru', 'teatru cu', 'joc de rol', 'teatru', 'theatre',
  'actori:', 'regia:', 'distributia:', 'reprezentatie',
  // Magic
  'magie pentru', 'magician', 'clovn', 'ursitoare', 'animatori', 'circ', 'circus', 'magie', 'magic show',
  // Salsa / Latin specific blocked terms
  'salsa revolution', 'salsa congress',
  // Social/party games (non-nightlife music)
  'suspecti la party', 'suspecți la party', 'murder mystery', 'board game', 'boardgames', 'social game', 'games night',
  // Family/kids festivals
  'pentru intreaga familie', 'pentru întreaga familie', 'family fest', 'festival de paște pentru întreaga familie',
];

/** Soft blocks — dropped unless a strong music term is also present. */
const SOFT_BLOCK_TERMS = [
  'opera ', 'operă', 'simfon', 'filarmon', 'orchester', 'cor ', 'fanfara',
  'targ', 'târg', 'expo ', 'expozitie', 'expozitia', 'expoziție', 'bazar',
  'sport', 'atletism', 'maraton', 'match', 'meci', 'fotbal', 'tenis',
  'cinema', 'film ', ' film', 'movie', 'proiectie',
  'culinar', 'cooking', 'tasting', 'degustare', 'degustari',
  'yoga', 'wellness', 'meditatie', 'meditație',
  'conferinta', 'conferința', 'conference', 'business', 'forum', 'summit',
  'lectura', 'simulare', 'training', 'curs', 'cursuri', 'workshop', 'seminar', 'atelier',
  'prezentare', 'lansare carte', 'book launch', 'dezvoltare',
  // Automotive / off-road events (not music)
  'off-road', 'offroad', '4x4', 'automobilism', 'rally', 'curse auto', 'motorsport',
];

const STRONG_MUSIC_TERMS = [
  'live set', 'dj set', 'rave', 'club night',
  'techno', 'house', 'trance', 'drum and bass', 'dnb', 'edm', 'electronic', 'underground',
  'hip-hop', 'hip hop', 'hiphop', 'jazz', 'blues', 'rock music', 'rock band', 'rock concert', 'rock night', 'metal', 'punk', 'alternativ',
  'disco', 'funk', 'soul', 'reggae', 'clubbing', 'dancefloor',
  'manele', 'manea',
];

/** Returns genre array if music event, null if definitively non-music. */
export function guessGenres(title: string, desc: string): string[] | null {
  const normalize = (s: string) => (s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const t = normalize(title) + ' ' + normalize(desc);

  // Helper for word-boundary matching (prevents "terapie" matching "rap")
  const hasTerm = (term: string) => {
    const escaped = normalize(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // If term explicitly contains leading/trailing spaces in the definition, just use .includes
    if (term.startsWith(' ') || term.endsWith(' ')) {
      return t.includes(normalize(term));
    }
    return new RegExp(`\\b${escaped}\\b`).test(t);
  };

  // Hard blocks: aggressive inclusion match is fine for blocks (e.g. "teatrul" blocks "teatru")
  if (HARD_BLOCK_TERMS.some(term => t.includes(normalize(term)))) return null;

  // Soft blocks
  const isSoftBlocked = SOFT_BLOCK_TERMS.some(term => t.includes(normalize(term)));
  const isStrongMusic = STRONG_MUSIC_TERMS.some(sm => hasTerm(sm));

  if (isSoftBlocked && !isStrongMusic) return null;

  const found = new Set<string>();
  const mapping: Record<string, string[]> = {
    'Techno':       ['techno', 'dark techno', 'industrial techno'],
    'House':        ['house music', 'deep house', 'tech house', 'progressive house', 'afro house'],
    'Electronic':   ['electronic', 'electronica', 'synth', 'modular', 'edm'],
    'Minimal':      ['minimal', 'microhouse', 'rominimal'],
    'Hip-Hop':      ['hip-hop', 'hip hop', 'hiphop', 'rap', 'trap', 'grime'],
    'Manele':       ['manele', 'manea', 'maneliada', 'manelist'],
    'Jazz':         ['jazz', 'blues', 'soul', 'funk'],
    'Rock':         ['rock', 'alternative', 'indie', 'punk', 'grunge'],
    'Metal':        ['metal', 'hardcore', 'doom', 'sludge', 'deathcore'],
    'Drum & Bass':  ['dnb', 'drum and bass', 'drum & bass', 'jungle', 'liquid'],
    'Live Music':   ['live band', 'concert', 'live music', 'lansare album', 'recital', 'eveniment muzical', 'live act'],
    'Disco':        ['disco', 'nu-disco', '80s', '90s', 'retro'],
    'Trance':       ['trance', 'psytrance', 'psy trance', 'goa'],
    'Reggae':       ['reggae', 'dancehall', 'ska', 'dub'],
    'Party':        ['party', 'clubbing', 'nightlife', 'dancing', 'club night', 'dj performance'],
  };

  for (const [genre, keywords] of Object.entries(mapping)) {
    if (keywords.some(k => hasTerm(k))) found.add(genre);
  }

  if (found.size === 0) {
    // Only match as Electronic if it's clearly a party term
    if (/\b(party|night|rave|dancefloor|discoteca|clubbing|afterparty|nightlife)\b/.test(t)) {
      found.add('Electronic');
    } else if (isStrongMusic) {
      found.add('Live Music');
    } else {
      return null;
    }
  }

  return Array.from(found);
}

// ── Parse events directly from listing-page JSON-LD ──────────────────────────

/**
 * Extract ScrapedEvents directly from JSON-LD blocks in a listing page.
 * Use this when the listing page already embeds full event data (ambilet, zilesinopti).
 * Returns an array — empty if no Event blocks are found.
 */
export function parseEventsFromJsonLd(html: string, city: string): ScrapedEvent[] {
  const today = new Date().toISOString().split('T')[0];
  const events: ScrapedEvent[] = [];

  for (const block of extractJsonLd(html)) {
    const b = block as Record<string, unknown>;
    if (!String(b['@type'] ?? '').includes('Event')) continue;

    const startDate = String(b.startDate ?? '');
    const date = parseDate(startDate);
    if (!date || date < today) continue;

    const rawName = clean(String(b.name ?? ''));
    if (!rawName) continue;
    const { title, venueHint } = splitTitleVenue(rawName);

    const description = clean(String(b.description ?? '')) || null;

    const genres = guessGenres(title, description ?? '');
    if (!genres) continue;

    const location = (b.location as Record<string, unknown>) ?? {};
    const addr = (location.address as Record<string, unknown>) ?? {};
    const venueName = clean(String(location.name ?? addr.name ?? ''));
    // Prefer title hint over an address-like location.name (some sites set location.name = street address)
    const resolvedVenueHint =
      venueHint && isAddressString(venueHint) ? extractVenueFromAddress(venueHint) : venueHint;
    const venue = (venueName && !isAddressString(venueName))
      ? venueName
      : resolvedVenueHint || 'Venue TBC';

    const rawImg = b.image;
    const image_url =
      typeof rawImg === 'string' ? rawImg
      : Array.isArray(rawImg) ? String((rawImg[0] as Record<string, unknown>)?.url ?? rawImg[0] ?? '')
      : String((rawImg as Record<string, unknown>)?.url ?? '');

    events.push({
      title,
      venue,
      date,
      time: extractTime(startDate),
      description,
      image_url,
      event_url: String(b.url ?? ''),
      genres,
      price: extractPriceFromOffers(b.offers),
      city,
    });
  }

  return events;
}

// ── URL extraction from listing-page JSON-LD ──────────────────────────────────

/**
 * Extract event detail page URLs from a listing page's JSON-LD blocks.
 * This is the most reliable extraction method — it works even when the page
 * renders event cards with JavaScript (no `href` links in raw HTML).
 *
 * @param baseUrl  Only return URLs whose origin matches this (avoids cross-domain noise).
 */
export function extractUrlsFromJsonLd(html: string, baseUrl?: string): string[] {
  const today = new Date().toISOString().split('T')[0];
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const block of extractJsonLd(html)) {
    const b = block as Record<string, unknown>;
    const type = String(b['@type'] ?? '');
    if (!type.includes('Event')) continue;

    // Skip past events early
    const startDate = String(b.startDate ?? '');
    const date = parseDate(startDate);
    if (date && date < today) continue;

    const url = String(b.url ?? '').trim();
    if (!url || seen.has(url)) continue;

    // Optionally restrict to same origin
    if (baseUrl) {
      try {
        const base = new URL(baseUrl).origin;
        if (!url.startsWith(base)) continue;
      } catch { /* ignore */ }
    }

    seen.add(url);
    urls.push(url);
  }

  return urls;
}

// ── Network ───────────────────────────────────────────────────────────────────

/** Fetch HTML with a browser-like User-Agent and a timeout. */
export async function fetchHtml(url: string, timeoutMs = 10_000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// ── Price extraction ──────────────────────────────────────────────────────────

/** Try to extract a price from Schema.org offers block (single or array). Returns a range or single value. */
export function extractPriceFromOffers(offers: unknown): string | null {
  if (!offers) return null;
  const offerList = Array.isArray(offers) ? offers : [offers];
  let prices: number[] = [];
  let currency = 'RON';

  for (const o of offerList as Record<string, unknown>[]) {
    const p = parseFloat(String(o.price ?? o.lowPrice ?? o.highPrice ?? ''));
    if (!isNaN(p)) prices.push(p);
    if (o.priceCurrency) currency = String(o.priceCurrency);
  }

  if (prices.length === 0) return null;
  
  prices = Array.from(new Set(prices)).sort((a, b) => a - b);
  
  if (prices.length === 1) {
    return prices[0] === 0 ? 'Free' : `${prices[0]} ${currency}`;
  }
  
  const min = prices[0];
  const max = prices[prices.length - 1];
  
  if (min === 0 && max === 0) return 'Free';
  if (min === 0) return `Free - ${max} ${currency}`;
  return `${min} - ${max} ${currency}`;
}

/**
 * Returns true if the string looks like a street address rather than a venue name.
 * Used to avoid storing "Strada 11 Iunie nr. 30" as the venue.
 */
export function isAddressString(s: string): boolean {
  return /\b(str\.?\s|strada\s|bd\.?\s|bulevardul\s|calea\s|nr\.?\s|piata\s|pia[țt]a\s|\d{5,})\b/i.test(s);
}

/**
 * When a venue hint extracted from a title looks like "Calea Floreasca 246, Royal Hall"
 * (an address followed by the actual venue name), this tries to recover the venue name
 * by returning the last comma-separated segment that isn't itself address-like.
 */
function extractVenueFromAddress(addrStr: string): string | null {
  const parts = addrStr.split(',').map(s => s.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (!isAddressString(p) && p.length >= 4) return p;
  }
  return null;
}

const VENUE_BLOCK_TERMS = [
  'copii', 'pentru copii', 'teatru pentru', 'teatrul pentru',
  'educativ', 'educational', 'pentru tineret', 'centrul multifunc',
  'muzeu', 'monument', 'parc ', 'gradina ',
];

/**
 * Returns true if a venue name is valid (not an address, not too short/long, not TBC, not a non-venue type).
 */
export function isValidVenueName(name: string): boolean {
  if (!name || name === 'Venue TBC') return false;
  if (name.length < 3 || name.length > 80) return false;
  if (isAddressString(name)) return false;
  const lower = name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  if (VENUE_BLOCK_TERMS.some(t => lower.includes(t))) return false;
  return true;
}

/**
 * Extract a text description from HTML body when JSON-LD/OG meta description is absent.
 * Tries common content containers in priority order.
 */
export function extractDescriptionFromHtml(html: string): string | null {
  // iabilet: full body content lives under #details; XPath provided by user points inside this container.
  // Take a bounded chunk starting at #details so nested div structure doesn't break regex extraction.
  const detailsIdx = html.search(/id=["']details["']/i);
  if (detailsIdx >= 0) {
    const detailsChunk = html.slice(detailsIdx, detailsIdx + 12_000);
    const text = clean(detailsChunk);
    if (text.length > 80) return text.slice(0, 1500);
  }

  // Ordered list of selectors to try (id/class based, regex-extracted)
  const patterns: RegExp[] = [
    // iabilet: <div id="details" ...>
    /<div[^>]+id=["']details["'][^>]*>([\s\S]{30,3000}?)<\/div>\s*<\/div>/i,
    // itemprop="description"
    /itemprop=["']description["'][^>]*>([\s\S]{30,2000}?)<\/(?:div|p|section)>/i,
    // common class names
    /<div[^>]+class=["'][^"']*(?:event-description|description-text|event-detail|event-body|event-content)[^"']*["'][^>]*>([\s\S]{30,2000}?)<\/div>/i,
  ];

  for (const re of patterns) {
    const m = html.match(re);
    if (m) {
      const text = clean(m[1]);
      if (text.length > 30) return text.slice(0, 1500);
    }
  }
  return null;
}

/**
 * Try to extract a venue name from HTML when JSON-LD location.name is absent.
 * Tries: itemprop="location", JSON fragment, common class names.
 */
function extractVenueFromHtml(html: string): string {
  // Schema.org itemprop inline: <span itemprop="location">…<span itemprop="name">Club</span>
  const itemProp = html.match(/itemprop=["']location["'][^>]*>[\s\S]{0,200}?itemprop=["']name["'][^>]*>([^<]{2,60})</i);
  if (itemProp) return clean(itemProp[1]);

  // JSON fragment buried in a script: "location":{"name":"Club Momo"
  const jsonFrag = html.match(/"location"\s*:\s*\{[^}]{0,200}"name"\s*:\s*"([^"]{2,60})"/);
  if (jsonFrag) return clean(jsonFrag[1]);

  // Common CSS class patterns used by event sites
  const cssClass = html.match(/class="[^"]*(?:venue|location|place|club)[^"]*"[^>]*>\s*<[^>]+>\s*([^<]{2,60})\s*</i)
    ?? html.match(/class="[^"]*(?:venue|location|place|club)[^"]*"[^>]*>([^<]{2,60})</i);
  if (cssClass) return clean(cssClass[1]);

  return 'Venue TBC';
}

interface PriceProvider {
  extract: (html: string, url?: string) => string | null;
  priority: number;
}

// Site-specific price providers
const priceProviders: Record<string, PriceProvider> = {
  // WooCommerce price extraction (used by ambilet.ro and others)
  wooCommerce: {
    extract: (html: string): string | null => {
      // Targets <span class="woocommerce-Price-amount"><bdi>50,00 <span ...>lei</span></bdi></span>
      const wcPriceMatches = Array.from(html.matchAll(
        /woocommerce-Price-amount[^>]*>\s*<bdi>\s*([\d.,]+)\s*(?:&nbsp;)?\s*<span[^>]*woocommerce-Price-currencySymbol[^>]*>([^<]+)<\/span>/gi
      ));
      
      // Ambilet sometimes uses explicit classes for their side widgets
      const sideWidgetMatches = Array.from(html.matchAll(
        /class=["'][^"']*(?:price|pret_bilet|bilet-pret|ticket-price)[^"']*["'][^>]*>[\s\S]{0,100}?(\d+(?:[.,]\d+)?)\s*(?:RON|lei|LEI)/gi
      ));

      // Additional check for basic paragraph formats like <p>50 lei</p> often used by Ambilet / ControlClub DOM
      const basicTagMatches = Array.from(html.matchAll(
        /<(?:p|span|div)[^>]*>\s*(?:<input[^>]*>\s*)?(\d+(?:[.,]\d+)?)\s*(?:RON|lei|LEI|EUR|€)[^<]*<\/(?:p|span|div)>/gi
      ));

      const combinedWcAndSide = [...wcPriceMatches, ...sideWidgetMatches, ...basicTagMatches];

      if (combinedWcAndSide.length > 0) {
        const rawPrices = combinedWcAndSide
          .map(m => parseFloat(m[1].replace(',', '.')))
          .filter(p => !isNaN(p) && p > 0 && p < 5000)
          .sort((a, b) => a - b);
       
        if (rawPrices.length > 0) {
          const unique = Array.from(new Set(rawPrices));
          const currency = combinedWcAndSide[0][2]?.trim() || 'RON';
          const currLabel = currency.toLowerCase() === 'lei' ? 'RON' : currency;
          if (unique.length === 1) {
            return unique[0] === 0 ? 'Free' : `${unique[0]} ${currLabel}`;
          }
          const min = unique[0];
          const max = unique[unique.length - 1];
          if (min === 0 && max === 0) return 'Free';
          if (min === 0) return `Free - ${max} ${currLabel}`;
          return `${min} - ${max} ${currLabel}`;
        }
      }
      
      return null;
    },
    priority: 10
  },
  
  // Ambilet specific price extraction
  ambilet: {
    extract: (html: string): string | null => {
      // Ambilet uses Tailwind utility classes (not semantic IDs), so we anchor on
      // the "Cumpara bilet" buy-button which always appears in the sticky price sidebar.
      // Price numbers appear in the ~800 chars leading up to that button.
      const cumparaPos = html.search(/[Cc]ump[aă]r[aă]\s+bilet|[Aa]daug[aă]\s+[îi]n\s+co[șs]/);
      if (cumparaPos > 0) {
        const beforeBtn = html.slice(Math.max(0, cumparaPos - 800), cumparaPos);
        const prices = Array.from(beforeBtn.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:lei|RON|LEI)/gi))
          .map(m => parseFloat(m[1].replace(',', '.')))
          .filter(p => !isNaN(p) && p >= 5 && p < 5000)
          .sort((a, b) => a - b);

        if (prices.length > 0) {
          const unique = Array.from(new Set(prices));
          if (unique.length === 1) return `${unique[0]} RON`;
          return `${unique[0]} - ${unique[unique.length - 1]} RON`;
        }
      }

      // Fallback: scan for a sticky sidebar (Ambilet's right-column ticket widget)
      const stickyIdx = html.search(/class=["'][^"']*\bsticky\b[^"']*bg-white[^"']*["']/i);
      if (stickyIdx >= 0) {
        const stickyChunk = html.slice(stickyIdx, stickyIdx + 1500);
        const prices = Array.from(stickyChunk.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:lei|RON|LEI)/gi))
          .map(m => parseFloat(m[1].replace(',', '.')))
          .filter(p => !isNaN(p) && p >= 5 && p < 5000)
          .sort((a, b) => a - b);

        if (prices.length > 0) {
          const unique = Array.from(new Set(prices));
          if (unique.length === 1) return `${unique[0]} RON`;
          return `${unique[0]} - ${unique[unique.length - 1]} RON`;
        }
      }

      return null;
    },
    priority: 15 // Higher priority than wooCommerce for ambilet.ro sites
  },
  
  // Control Club specific price extraction
  controlClub: {
    extract: (html: string): string | null => {
      // Control Club often has prices in specific formats
      // Look for price elements in their typical locations
      const pricePatterns = [
        // Pattern: <span class="price">50 lei</span>
        /class=["'][^"']*price[^"']*["'][^>]*>\s*(\d+(?:[.,]\d+)?)\s*(?:RON|lei|LEI)/gi,
        // Pattern: <div class="ticket-price">50 lei</div>
        /class=["'][^"']*ticket-price[^"']*["'][^>]*>\s*(\d+(?:[.,]\d+)?)\s*(?:RON|lei|LEI)/gi,
        // Pattern: <p>50 lei</p> or similar
        /<(?:p|div|span)[^>]*>\s*(\d+(?:[.,]\d+)?)\s*(?:RON|lei|LEI|EUR|€)\s*<\/(?:p|div|span)>/gi
      ];
      
      let allPrices: number[] = [];
      
      for (const pattern of pricePatterns) {
        const matches = Array.from(html.matchAll(pattern));
        for (const match of matches) {
          const val = parseFloat(match[1].replace(',', '.'));
          if (!isNaN(val) && val > 0 && val < 5000) {
            allPrices.push(val);
          }
        }
      }
      
      if (allPrices.length > 0) {
        const unique = Array.from(new Set(allPrices)).sort((a, b) => a - b);
        if (unique.length === 1) {
          return unique[0] === 0 ? 'Free' : `${unique[0]} RON`;
        }
        const min = unique[0];
        const max = unique[unique.length - 1];
        if (min === 0 && max === 0) return 'Free';
        if (min === 0) return `Free - ${max} RON`;
        return `${min} - ${max} RON`;
      }
      
      return null;
    },
    priority: 10
  },
  
  // Generic fallback provider
  generic: {
    extract: (html: string): string | null => {
      // ── Generic regex price extraction ───────────────────────────────────────
      // Stricter price regex: prioritize prefix or common price patterns
      // Increase digit limit to 1-5 to handle premium/festival tickets
      const priceMatches = Array.from(html.matchAll(/(?:(?:Tickets from|Cost|Pret|de la|Preț|Bilete|Bilet)\s*:?\s*)?(?:(?:\d{1,5}(?:[.,]\d+)?)\s*(?:RON|lei|ron|LEI|EUR|€|USD|\$)\b)|(?:(?:RON|lei|ron|LEI|EUR|€|USD|\$)\s*(?:\d{1,5}(?:[.,]\d+)?))/gi));
       
      const prices = priceMatches
        .map(m => {
          const matchText = m[0];
          const hasPrefix = /(Tickets from|Cost|Pret|de la|Preț|Bilete|Bilet)/i.test(matchText);
          const numMatch = matchText.match(/\d+(?:[.,]\d+)?/);
          const val = numMatch ? parseFloat(numMatch[0].replace(',', '.')) : null;
          
          // If it doesn't have a specific price prefix, be more skeptical of very small numbers (often stray text)
          if (val !== null && !hasPrefix && val < 5) return null; // Likely a quantity or day, not a price
          
          return val;
        })
        .filter((p): p is number => p !== null && !isNaN(p) && p > 0 && p < 15000); // 15,000 RON upper bound for festivals

      if (prices.length > 0) {
        const sorted = Array.from(new Set(prices)).sort((a, b) => a - b);
        if (sorted.length === 1) return `${sorted[0]} RON`;
        
        // If we have multiple matches, prioritize those with explicit price prefixes
        // to avoid junk ranges from stray numbers (e.g., "1 - 714")
        const prefixed = priceMatches
          .filter(m => /(Tickets from|Cost|Pret|de la|Preț|Bilete|Bilet)/i.test(m[0]))
          .map(m => {
            const numMatch = m[0].match(/\d+(?:[.,]\d+)?/);
            return numMatch ? parseFloat(numMatch[0].replace(',', '.')) : null;
          })
          .filter((p): p is number => p !== null && !isNaN(p) && p > 0);

        if (prefixed.length > 0) {
          const sortedPrefixed = Array.from(new Set(prefixed)).sort((a, b) => a - b);
          if (sortedPrefixed.length === 1) return `${sortedPrefixed[0]} RON`;
          return `${sortedPrefixed[0]} - ${sortedPrefixed[sortedPrefixed.length - 1]} RON`;
        }

        // Ratio-based sanity check: if the range is suspiciously wide (max/min > 15)
        // and no prices had explicit labels, it's likely junk numbers from page elements
        // (e.g. input value="1", data-product_id="831747")
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        if (max / min > 15) {
          // Range is suspiciously wide — reject it as likely containing stray numbers
          // Return only the most common/middle value as single price, or null
          return null;
        }

        return `${sorted[0]} - ${sorted[sorted.length - 1]} RON`;
      }
      
      return null;
    },
    priority: 1
  }
};

/** Scrape a price from raw HTML text as a last resort. Supports ranges and "Free". */
export function extractPriceFromHtml(html: string, url?: string): string | null {
  // Try site-specific providers first
  const providerResults: Array<{price: string | null; priority: number; provider: string}> = [];
  
  for (const [providerKey, provider] of Object.entries(priceProviders)) {
    const price = provider.extract(html, url);
    if (price) {
      providerResults.push({price, priority: provider.priority, provider: providerKey});
    }
  }
  
  // Return highest priority result
  if (providerResults.length > 0) {
    providerResults.sort((a, b) => b.priority - a.priority);
    return providerResults[0].price;
  }
  
  // Only then check for "Free" as absolute last resort — require entry-specific phrasing
  // (avoid false positives from "livrare gratuita", "garantie gratuita" in page footers)
  if (/\b(?:free entry|intrare liber[aă]|bilet gratuit|bilete gratuite|intrare gratuit[aă]|entree gratuite)\b/i.test(html)) {
    return 'Free';
  }
  
  return null;
}

/** Extract registration/ticket links from HTML if JSON-LD is missing them. */
export function extractTicketsFromHtml(html: string): string | null {
  // Search for buttons or links with ticket keywords
  const re = /href=["']([^"']*(?:iabilet|livetickets|eventbook|ambilet|entertix|bilete\.ro|entree|tickets?|booking)[^"']*)["']/gi;
  const matches = Array.from(html.matchAll(re));
  
  const ignoredExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2', '.pdf', '.php', '.xml', '.ico'];
  
  const validMatches = matches.map(m => m[1]).filter(link => {
    const lower = link.toLowerCase();
    const urlWithoutQuery = lower.split('?')[0];
    
    // 1. Exclude common assets and system files
    if (ignoredExtensions.some(ext => urlWithoutQuery.endsWith(ext))) return false;
    
    // 2. Exclude anything that looks like a static asset or system directory
    if (lower.includes('/assets/') || lower.includes('/css/') || lower.includes('/js/') || lower.includes('/img/') || 
        lower.includes('/wp-includes/') || lower.includes('/wp-content/themes/') || lower.includes('xmlrpc.php')) return false;
    
    // 3. Exclude social media links that might contain keywords in text/params but aren't ticket links
    if (lower.includes('facebook.com') || lower.includes('instagram.com') || 
        lower.includes('twitter.com') || lower.includes('x.com') || 
        lower.includes('linkedin.com') || lower.includes('pinterest.com') ||
        lower.includes('whatsapp.com')) return false;

    // 4. Verify the keyword isn't just in a UTM or referral query parameter
    // If 'tickets' or 'booking' is ONLY found after the '?' and it's part of a UTM, skip it
    const searchPart = lower.includes('?') ? lower.split('?')[1] : '';
    const mainPart   = lower.split('?')[0];
    
    if (!mainPart.includes('ticket') && !mainPart.includes('booking') && !mainPart.includes('billet') && !mainPart.includes('bilete')) {
      // It matched because of something in the query string
      // If it's a UTM param or similar noise, ignore it
      if (searchPart.includes('utm_') || searchPart.includes('ref=')) {
        // Double check if it's a known provider though
        const isKnownProvider = ['iabilet', 'livetickets', 'eventbook', 'ambilet', 'entertix', 'bilete.ro'].some(p => mainPart.includes(p));
        if (!isKnownProvider) return false;
      }
    }

    return true;
  });

  // Prioritize external ticketing providers over internal page links
  const providers = [
    'iabilet.ro/bilete-', 'iabilet.ro/go/', 'livetickets.ro/bilete/', 
    'eventbook.ro/event/', 'ambilet.ro/eveniment/', 'entertix.ro/', 'bilete.ro/'
  ];
  for (const p of providers) {
    const found = validMatches.find(link => link.toLowerCase().includes(p.toLowerCase()));
    if (found) return found;
  }
  
  // Fallback to any valid match that isn't just the homepage
  return validMatches.find(m => m.length > 25) ?? (validMatches.length > 0 ? validMatches[0] : null);
}

// ── Deep-fetch core ───────────────────────────────────────────────────────────

/**
 * Fetch an individual event detail page and extract a complete ScrapedEvent.
 * Strategy: JSON-LD Event block → OG meta tags → raw HTML price fallback.
 * Returns null if the event is non-music, in the past, or the page is unreachable.
 *
 * @param allowedCities  Optional list of lowercase city/region substrings that must appear
 *                       in the JSON-LD addressLocality (e.g. ['bucuresti','bucharest','ilfov']).
 *                       If the page encodes a different city, the event is rejected.
 *                       Pass undefined/null to skip city verification (default).
 */
export async function parseDetailPage(
  url: string,
  city: string,
  timeoutMs = 10_000,
  allowedCities?: string[],
): Promise<ScrapedEvent | null> {
  let html: string;
  try {
    html = await fetchHtml(url, timeoutMs);
  } catch {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];
  const og = extractOgMeta(html);

  // ── 1. Try JSON-LD Event blocks ──────────────────────────────────────────
  // Build a slug from the page URL we fetched — used to reject JSON-LD blocks
  // from "similar events" sidebars that inject other events into the same page.
  const pageSlug = url.replace(/\/$/, '').split('/').pop()?.toLowerCase() ?? '';

  for (const block of extractJsonLd(html)) {
    const b = block as Record<string, unknown>;
    const type = String(b['@type'] ?? '');
    if (!type.includes('Event')) continue;

    // ── URL guard: if the JSON-LD block has a `url` field, it must relate to
    // the page we fetched (either same slug OR url contains pageSlug as substring).
    // This rejects similar-events sidebar blocks injected into every event page.
    if (b.url && pageSlug) {
      const blockUrl = String(b.url).toLowerCase();
      const blockSlug = blockUrl.replace(/\/$/, '').split('/').pop() ?? '';
      // Accept if the block URL contains our page slug anywhere
      const slugMatches = blockSlug === pageSlug || blockUrl.includes(pageSlug);
      if (!slugMatches) continue;
    }

    const startDate = String(b.startDate ?? '');
    const date = parseDate(startDate);
    if (!date || date < today) continue;

    const rawName = clean(String(b.name ?? og['og:title'] ?? ''));
    if (!rawName) continue;
    const { title, venueHint } = splitTitleVenue(rawName);

    const rawDesc = String(b.description ?? og['og:description'] ?? og['description'] ?? '');
    const cleanedRawDesc = clean(rawDesc);
    const htmlDesc = extractDescriptionFromHtml(html);
    // Prefer richer HTML body description when available, but never lose JSON-LD/OG text.
    const description =
      htmlDesc && htmlDesc.length > cleanedRawDesc.length
        ? htmlDesc
        : cleanedRawDesc || htmlDesc || null;

    // Venue: JSON-LD location.name > title "@Venue" hint > HTML itemprop/class > "Venue TBC"
    // Skip location.name if it looks like a street address (some sites set it to the street address)
    const location = (b.location as Record<string, unknown>) ?? {};
    const addrBlock = (location.address as Record<string, unknown>) ?? {};

    // ── City verification (iabilet lists national events under Bucharest URL) ──
    if (allowedCities && allowedCities.length > 0) {
      // Normalize diacritics so "București" (ș U+015F) matches allowedCity "bucuresti"
      const addrLocality = clean(String(
        addrBlock.addressLocality ?? addrBlock.addressRegion ?? location.address ?? ''
      )).toLowerCase()
        .normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
      if (addrLocality && !allowedCities.some(c => addrLocality.includes(c))) {
        // The event is in a city that doesn't match — skip silently
        continue;
      }
    }

    const venueName = clean(String(location.name ?? addrBlock.name ?? ''));
    const htmlVenue = extractVenueFromHtml(html);
    // If venueHint looks like an address, try to salvage the venue name from it
    const resolvedVenueHint =
      venueHint && isAddressString(venueHint) ? extractVenueFromAddress(venueHint) : venueHint;
    const venue = (venueName && !isAddressString(venueName))
      ? venueName
      : resolvedVenueHint || (!isAddressString(htmlVenue) ? htmlVenue : 'Venue TBC');

    // Image: JSON-LD image > og:image
    const rawImg = b.image;
    let image_url =
      typeof rawImg === 'string' ? rawImg
      : Array.isArray(rawImg) ? String((rawImg[0] as Record<string, unknown>)?.url ?? rawImg[0] ?? '')
      : String((rawImg as Record<string, unknown>)?.url ?? '');
    if (!image_url) image_url = og['og:image'] ?? '';

    // Price: JSON-LD offers > raw HTML. 
    // Fallback to HTML even if JSON-LD says "Free" if we find price-like strings in HTML,
    // as some sites (onevent, ambilet) often have incorrect 0 values in JSON-LD.
    let price = extractPriceFromOffers(b.offers);
    if (!price || price === 'Free') {
      const htmlPrice = extractPriceFromHtml(html);
      // If HTML gives a non-Free price, prefer it over the suspicious JSON-LD "Free"
      if (htmlPrice && htmlPrice !== 'Free') {
        price = htmlPrice;
      } else {
        // Look for RA/widget specific formats first to avoid matching generic words like 'Cost'
        // Precise RA DOM path: #AddTickets > ul > li.ticket-wrapper
        const raDomPattern = html.match(/id=["']AddTickets["'][^>]*>[\s\S]{0,1000}?class=["'][^"']*ticket-wrapper[^"']*["'][^>]*>[\s\S]{0,300}?(\d+(?:[.,]\d+)?)\s*(?:RON|lei|LEI)?/i) ||
                             html.match(/class=["'][^"']*ticket-wrapper[^"']*["'][^>]*>[\s\S]{0,300}?(\d+(?:[.,]\d+)?)\s*(?:RON|lei|LEI)?/i);

        const specificWidgetPattern = html.match(/(?:Tickets from|Bilete de la)\s*(?:<\/div>|:|\s)*\s*(?:RON|lei|LEI)?\s*(\d+(?:[.,]\d+)?)/i);
        const genericRaPattern = html.match(/(?:Pret|Preț|Cost|Prices?)\s*(?:<\/div>|:|\s)*\s*(?:RON|lei|LEI)?\s*(\d+(?:[.,]\d+)?)/i);
        const genericPattern = html.match(/(\d+(?:[.,]\d+)?)\s*(?:RON|lei|LEI|EUR|€)/i);

        if (raDomPattern) price = `${raDomPattern[1]} RON`;
        else if (specificWidgetPattern) price = `${specificWidgetPattern[1]} RON`;
        else if (genericRaPattern) price = `${genericRaPattern[1]} RON`;
        else if (genericPattern) price = `${genericPattern[1]} RON`;
        else price = htmlPrice || price;
      }
    }

    // Ticket link: JSON-LD url > HTML ticket providers
    // Priority for ticket_url: External provider (iabilet, etc)
    // event_url is the primary source page (e.g. RA detail page)
    const externalTicketLink = extractTicketsFromHtml(html);
    const source = url.includes('ra.com') || url.includes('residentadvisor.net') ? 'ra'
      : url.includes('onevent.ro') ? 'onevent'
      : url.includes('iabilet.ro') ? 'iabilet'
      : url.includes('livetickets.ro') ? 'livetickets'
      : url.includes('eventbook.ro') ? 'eventbook'
      : url.includes('ambilet.ro') ? 'ambilet'
      : 'manual';

    const event_url = url; 
    const ticket_url: string | null = externalTicketLink;

    // Genre filter
    const genres = guessGenres(title, description ?? '');
    if (!genres) continue;

    return {
      title,
      venue,
      date,
      time: extractTime(startDate) || null,
      description,
      image_url,
      event_url,
      ticket_url,
      genres,
      price,
      city,
    };
  }

  // ── 2. OG-meta fallback (no JSON-LD Event found) ─────────────────────────
  // Used for sites like ambilet.ro whose detail pages only have WebPage JSON-LD
  // but carry full event info in OG tags and visible HTML text.
  const rawOgTitle = clean(og['og:title']);
  if (!rawOgTitle) return null;

  // Split "Event Name @ Venue" in the OG title
  const { title: ogTitle, venueHint: ogVenueHint } = splitTitleVenue(rawOgTitle);

  // Date strategy: "startDate" JSON-LD → Romanian text in HTML → DD.MM.YYYY
  const sdRaw = (html.match(/"startDate"\s*:\s*"([^"]+)"/) ?? [])[1] ?? '';
  let dateStr = sdRaw;
  if (!dateStr) {
    // e.g. "14 mar 2026", "14 martie 2026"
    const roM = html.match(/(\d{1,2})\s+(ian|feb|mar|apr|mai|iun|iul|aug|sep|oct|nov|dec)\w*\.?\s+(\d{4})/i);
    if (roM) dateStr = `${roM[1]} ${roM[2]} ${roM[3]}`;
  }
  if (!dateStr) {
    const numM = html.match(/(\d{1,2}[.\/]\d{1,2}[.\/]\d{4})/);
    if (numM) dateStr = numM[1];
  }
  const date = dateStr ? parseDate(dateStr) : null;
  if (!date || date < today) return null;

  const ogDesc = clean(og['og:description'] ?? og['description'] ?? '');
  const htmlDescFallback = extractDescriptionFromHtml(html);
  const finalDesc =
    htmlDescFallback && htmlDescFallback.length > ogDesc.length
      ? htmlDescFallback
      : ogDesc || htmlDescFallback || null;
  const genres = guessGenres(ogTitle, finalDesc ?? '');
  if (!genres) return null;

  // Venue strategy: JSON-LD location fragment → title "@Venue" hint → " – Venue" → HTML
  let venue = 'Venue TBC';
  const locMatch = html.match(/"location"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]{2,})"/);
  if (locMatch && !isAddressString(clean(locMatch[1]))) {
    venue = clean(locMatch[1]);
  } else if (ogVenueHint) {
    venue = ogVenueHint;
  } else {
    // Fallback: "Event – Venue" separator in original OG title
    const dashM = rawOgTitle.match(/\s+[–—]\s+(.+)$/);
    if (dashM) venue = clean(dashM[1]);
    else {
      const htmlVenue = extractVenueFromHtml(html);
      venue = isAddressString(htmlVenue) ? 'Venue TBC' : htmlVenue;
    }
  }

  return {
    title: ogTitle,
    venue,
    date,
    time: sdRaw ? extractTime(sdRaw) : null,
    description: finalDesc,
    image_url: og['og:image'] ?? '',
    event_url: url,
    ticket_url: extractTicketsFromHtml(html),
    genres,
    price: extractPriceFromHtml(html),
    city,
  };
}

// ── Batch fetcher ─────────────────────────────────────────────────────────────

/**
 * Fetch up to `limit` event detail pages from `urls`, in parallel batches of `batchSize`.
 * Silently drops failures and non-music events.
 *
 * @param allowedCities  Passed to parseDetailPage for city verification (see that fn for details).
 */
export async function batchFetch(
  urls: string[],
  city: string,
  {
    limit = 25,
    batchSize = 5,
    timeoutMs = 10_000,
    allowedCities,
  }: { limit?: number; batchSize?: number; timeoutMs?: number; allowedCities?: string[] } = {},
): Promise<ScrapedEvent[]> {
  const results: ScrapedEvent[] = [];
  const capped = urls.slice(0, limit);

  for (let i = 0; i < capped.length; i += batchSize) {
    const chunk = capped.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      chunk.map(async (url) => {
        // Small jitter delay
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
        return parseDetailPage(url, city, 15_000, allowedCities);
      }),
    );
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    }
  }

  return results;
}
