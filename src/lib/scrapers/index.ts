// ─────────────────────────────────────────────────────────────────────────────
// Scraper orchestrator — runs all sources, deduplicates, and upserts to Supabase
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import { scrapeZilesinopti }  from './zilesinopti';
import { scrapeIabilet }      from './iabilet';
import { scrapeOnevent }      from './onevent';
import { scrapeAmbilet }      from './ambilet';
import { scrapeLivetickets }  from './livetickets';
import { scrapeRA }           from './ra';
import { scrapeEventbook }    from './eventbook';
import { scrapeControlClub }  from './controlclub';
import { scrapeClubGuesthouse } from './clubguesthouse';
import { scrapeFever }        from './fever';
import { scrapeEmagic } from './emagic';
import { ScrapedEvent, Source } from './types';
import { isValidVenueName, clean }  from './utils';
import { withSentryScraper } from '../sentry-utils';
import * as Sentry           from '@sentry/nextjs';

interface ScraperSettings {
  scan_depth?: number;
  concurrency?: number;
  auto_update?: boolean;
  priority?: number;
  [key: string]: any;
}

// ── Venue normalisation ───────────────────────────────────────────────────────
// Simple alias map: scraped name (lowercase) → canonical name stored in DB.
// Use lowercase keys for case-insensitive matching.
const VENUE_ALIASES: Record<string, string> = {
  // iabilet/zilesinopti list some events with hall name instead of club name
  'sala luceafarul': 'Control Club',   // default mapping; event-title override applied below
  // Control Club variants (RA uses lowercase, zilesinopti appends suffix)
  'control':        'Control Club',
  'club control':   'Control Club',
  // Quantic appears both as "Quantic" and "Quantic Club"/"Quantic Pub"
  'quantic club': 'Quantic',
  'quantic pub':  'Quantic',
  // Club Doors / Doors Club duplicate
  'club doors': 'Doors Club',
  // B52 variants
  'b52 the club': 'B52',
  'club b52':     'B52',
  // Bucharest club duplicates
  'encore':             'Encore Club',
  'nether':             'Nether Club',
  'noar hall':          'Noar Hall',
  'the pub universitatii': 'The Pub Universității',
  // Trattoria Monza variants
  'trattoria monza drumul taberei': 'Trattoria Monza',
  // Rio Club variants
  'rio club bucuresti': 'Rio Club',
  // Constanta venue duplicates
  'club phoenix, constanta': 'Club Phoenix',
  'phoenix':                 'Club Phoenix',
  'nuba club':               'Nuba Beach Club',
  'platforma wolff':         'Platforma Wolff',
  'wolff':                   'Platforma Wolff',
  'rock halle':              'Rock Halle',
  'beraria h':               'Beraria H',
  'berăria h':               'Beraria H',
  // Constanta venue aliases (zilesinopti often uses different names from ticket providers)
  'tulum mamaia':                    'Club Tulum',
  'club tulum':                      'Club Tulum',
  'un piacere da ridere':            'Un Piacere da Ridere',
  'pov garden':                      'POV Garden',
  'hotel sulina mamaia':             'Hotel Sulina Mamaia',
  'hotel sulina mamaia international': 'Hotel Sulina Mamaia',
  'fratelli beach & club':           'Fratelli Beach & Club',
  'fratelli mamaia':                 'Fratelli Beach & Club',
  'white horse costinesti':          'White Horse Costinești',
  'white horse costinești':          'White Horse Costinești',
  'white horse rockn roll costinesti': 'White Horse Costinești',
  'white horse rock\'n roll costinești': 'White Horse Costinești',
  'casa de cultura a sindicatelor constanta': 'Casa de Cultură a Sindicatelor Constanţa',
  'casa de cultura a sindicatelor constanța': 'Casa de Cultură a Sindicatelor Constanţa',
  'casa de cultură a sindicatelor constanta': 'Casa de Cultură a Sindicatelor Constanţa',
  // iabilet uses "Harlequin by the Sea", zilesinopti uses "Harlequin by The Sea" or "Harlequin Mamaia"
  'harlequin mamaia':       'Harlequin by the Sea',
  'harlequin by the sea':   'Harlequin by the Sea',
  'harlequin by the sea mamaia': 'Harlequin by the Sea',
  // Onevent misattributes Fratelli event to "Untold Seaside Stories"
  'untold seaside stories':    'Fratelli Beach & Club',
  // Doors Club / Club Doors already above, but cover Romanian casing
  'doors':          'Doors Club',
  // Green Pub
  'green pub constanta': 'Green Pub',
  // Restaurant Dorna — strip HTML entities / bullet variants
  'restaurant dorna mamaia &bull; zile și nopți': 'Restaurant Dorna Mamaia',
  'restaurant dorna mamaia • zile și nopți':      'Restaurant Dorna Mamaia',
  'restaurant dorna mamaia • zile si nopti':      'Restaurant Dorna Mamaia',
  // Forge aliases
  'forge bucharest': 'Forge',
  'forge':            'Forge',
  'industrial warehouse': 'Secret Location',
  // Apollo111 variants
  'apollo111 barul & terasa': 'Apollo111',
  // Hard Rock Cafe variants (sometimes with city suffix)
  'hard rock cafe bucuresti': 'Hard Rock Cafe',
  'hard rock cafe bucharest': 'Hard Rock Cafe',
};

// Event-title–aware overrides: if (title pattern) + wrong venue → correct venue.
// Applied AFTER the simple alias map.
const VENUE_TITLE_OVERRIDES: Array<{ titlePattern: RegExp; wrongVenue: RegExp; correctVenue: string }> = [
  // Blaze (Japonia) and similar Japanese/Asian acts are at Encore Club, not Control Club
  { titlePattern: /japonia|japan|encore/i,  wrongVenue: /sala luceafarul|control club/i, correctVenue: 'Encore Club' },
  // "ctrl LIVE: ..." series events are at Control Club
  { titlePattern: /^ctrl\s+live/i, wrongVenue: /venue tbc|club control/i, correctVenue: 'Control Club' },
  { titlePattern: /echtzeit/i, wrongVenue: /venue tbc/i, correctVenue: 'Control Club' },
  // Onevent Candlelight events have wrong venue (Rock Halle) extracted from similar-events footer;
  // the actual venue is always Hotel Sulina Mamaia for Constanta Candlelight events.
  { titlePattern: /candlelight/i, wrongVenue: /rock halle|rock theatre|rock club/i, correctVenue: 'Hotel Sulina Mamaia' },
];

/** Strip common branding suffixes appended by aggregator sites. */
function stripVenueSuffix(name: string): string {
  return name
    .replace(/\s*[•·\-–—]\s*Zile [șs]i Nop[țt]i$/i, '')
    .replace(/\s*&bull;\s*Zile [șs]i Nop[țt]i$/i, '')
    .replace(/\s*\|\s*[^|]+$/, '')  // Strip trailing pipe-adorned taglines (e.g. "| HEAVIEST SUBGENRES")
    .trim();
}

/** Normalise a scraped venue name to its canonical form. */
function normalizeVenue(venueName: string, eventTitle: string): string {
  // Strip aggregator suffixes first (e.g. "Control Club • Zile și Nopți" → "Control Club")
  const cleaned = stripVenueSuffix(venueName);
  const tbaRecovered = clean(cleaned.replace(/^(?:venue\s*)?tba\s*[-:|/]\s*/i, '')) || cleaned;
  const lower = tbaRecovered.toLowerCase().trim();
  // Simple alias lookup
  const alias = VENUE_ALIASES[lower];
  const base = alias ?? tbaRecovered;

  // Remove trailing city suffixes from venue names to improve cross-source dedupe
  // e.g. "Natural High București" vs "Natural High"
  const cityStripped = base
    .replace(/\s*[-–—,]?\s*(bucuresti|bucurești|bucharest|constanta|constanța)\s*$/i, '')
    .trim();
  const normalizedBase = cityStripped || base;

  // Title-aware overrides (e.g. Sala Luceafarul → Encore Club for Japanese acts)
  for (const { titlePattern, wrongVenue, correctVenue } of VENUE_TITLE_OVERRIDES) {
    if (titlePattern.test(eventTitle) && wrongVenue.test(normalizedBase)) return correctVenue;
  }

  return normalizedBase;
}

function normalizeForDedupeLoose(s: string): string {
  if (!s) return '';
  return s.toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[|:;,.@()[\]{}/\\_•*–—!?&+#~'\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeInTensionToken(s: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(?:in\s*tension|intension|in-tension)\b/g, 'intension')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitleWithoutPromoterPrefix(s: string): string {
  if (!s) return '';
  return normalizeForDedupeLoose(
    s.replace(/^(?:[a-z0-9+&.'-]{2,}\s*(?:x|×)\s*){1,4}(?=[a-z0-9].{0,80}(?::|-|\[|\())/i, '')
  );
}

function normalizeTitleForLineupMatch(s: string): string {
  return normalizeTitleWithoutPromoterPrefix(s)
    // Cross-language/event-taxonomy bridges so identical events from RO/EN feeds collide.
    .replace(/\b(?:targ|târg)\s+de\s+viniluri\b/g, 'records fair')
    .replace(/\bvinyl\s+fair\b/g, 'records fair')
    .replace(/\b(?:bucuresti|bucharest|constanta|concert|live|party|event|eveniment|bilete|tickets?|with|feat|featuring|si|at|all|night|long|prezinta|presents|festival|fest|tour|editia|edition)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasSameCoreLineup(a: string, b: string): boolean {
  const aCore = normalizeTitleForLineupMatch(a);
  const bCore = normalizeTitleForLineupMatch(b);
  if (!aCore || !bCore) return false;

  const aCompact = aCore.replace(/\s+/g, '');
  const bCompact = bCore.replace(/\s+/g, '');
  if (Math.min(aCompact.length, bCompact.length) >= 8 && (aCompact.includes(bCompact) || bCompact.includes(aCompact))) {
    return true;
  }

  const aTokens = aCore.split(' ').filter(token => token.length >= 3);
  const bTokens = bCore.split(' ').filter(token => token.length >= 3);
  const shorter = aTokens.length <= bTokens.length ? aTokens : bTokens;
  const longer = aTokens.length <= bTokens.length ? bTokens : aTokens;
  if (shorter.length < 2) return false;

  const longerSet = new Set(longer);
  const hits = shorter.filter(token => longerSet.has(token)).length;
  return hits === shorter.length || (hits >= 2 && hits / shorter.length >= 0.75);
}

function normalizeComparableUrl(url?: string | null): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const cleanedParams = Array.from(parsed.searchParams.entries())
      .filter(([key]) => !/^(utm_|fbclid$|gclid$|ref$|refsrc$|mc_cid$|mc_eid$|aem_)/i.test(key))
      .sort(([a], [b]) => a.localeCompare(b));

    const query = cleanedParams.length > 0
      ? `?${cleanedParams.map(([key, value]) => `${key}=${value}`).join('&')}`
      : '';

    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '').toLowerCase() + query.toLowerCase();
  } catch {
    return url.trim().replace(/\/+$/, '').toLowerCase();
  }
}

function comparableUrlKey(url?: string | null): string {
  const normalized = normalizeComparableUrl(url);
  if (!normalized) return '';

  try {
    const parsed = new URL(normalized);
    if (!parsed.pathname || parsed.pathname === '/') return '';
    return normalized;
  } catch {
    return /^https?:\/\/[^/]+\/.+/i.test(normalized) ? normalized : '';
  }
}

function priceStrength(price?: string | null): number {
  if (!price) return 0;
  const normalized = price.toLowerCase().trim();
  if (!normalized) return 0;
  if (/sold\s*out|sold-out|epuizat|unavailable/.test(normalized)) return 6;
  const numericMatches = Array.from(normalized.matchAll(/(\d+(?:[.,]\d+)?)/g));
  if (numericMatches.length >= 2) return 5;
  if (numericMatches.length === 1) return 4;
  if (/free|gratuit|intrare libera/.test(normalized)) return 3;
  if (/door|at the door|cash|card/.test(normalized)) return 2;
  return 1;
}

function pickStrongerPrice(current?: string | null, candidate?: string | null): string | undefined {
  const currentNorm = (current ?? '').toLowerCase().trim();
  const candidateNorm = (candidate ?? '').toLowerCase().trim();
  // If the winner already has an explicit FREE price, don't let a lower-priority
  // duplicate overwrite it with a paid amount.
  if (/^free$|gratuit|intrare libera/.test(currentNorm) && /\d/.test(candidateNorm)) {
    return current ?? undefined;
  }

  const currentStrength = priceStrength(current);
  const candidateStrength = priceStrength(candidate);
  if (candidateStrength > currentStrength) return candidate ?? undefined;
  if (candidateStrength === currentStrength && (candidate?.length ?? 0) > (current?.length ?? 0)) {
    return candidate ?? undefined;
  }
  return current ?? undefined;
}

function isTicketProviderSource(source: string): boolean {
  return source === 'livetickets' || source === 'eventbook' || source === 'iabilet' || source === 'ambilet' || source === 'onevent' || source === 'fever' || source === 'emagic';
}

type DedupeRow = ScrapedEvent & { source: Source; city: string };

function providerTicketUrl(event: DedupeRow): string | null {
  return event.ticket_url || event.event_url || null;
}

function eventStorageKey(row: Pick<DedupeRow, 'title' | 'venue' | 'date' | 'source'>): string {
  return `${row.title}|${row.venue}|${row.date}|${row.source}`;
}

function parseTimeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function diffDays(dateA: string, dateB: string): number | null {
  const a = new Date(`${dateA}T00:00:00Z`);
  const b = new Date(`${dateB}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round(Math.abs(a.getTime() - b.getTime()) / 86400000);
}

interface ScrapeResult {
  source: Source;
  count: number;
  error?: string;
}

export interface FetchSummary {
  total: number;
  upserted: number;
  skipped_venues: string[];   // venues that couldn't be resolved from the DB
  results: ScrapeResult[];
}

type HistoricalScraperLog = {
  source?: string | null;
  total_upserted?: number | null;
  results?: Array<{ source?: string | null; count?: number | null }> | null;
};

function extractHistoricalSourceCount(log: HistoricalScraperLog, source: Source): number | null {
  if (log.source === source) {
    const directCount = log.results?.find((entry) => entry.source === source)?.count;
    if (typeof directCount === 'number') return directCount;
    return typeof log.total_upserted === 'number' ? log.total_upserted : null;
  }

  if (log.source === 'all') {
    const nestedCount = log.results?.find((entry) => entry.source === source)?.count;
    return typeof nestedCount === 'number' ? nestedCount : null;
  }

  return null;
}

const SCRAPERS: [Source, (settings?: ScraperSettings) => Promise<ScrapedEvent[]>][] = [
  ['zilesinopti', scrapeZilesinopti],
  ['iabilet',     scrapeIabilet],
  ['onevent',     scrapeOnevent],
  ['ambilet',     scrapeAmbilet],
  ['livetickets', scrapeLivetickets],
  ['ra',          scrapeRA],
  ['eventbook',   scrapeEventbook],
  ['emagic',      scrapeEmagic],
  ['controlclub', scrapeControlClub],
  ['clubguesthouse', scrapeClubGuesthouse],
  ['fever',       scrapeFever],
];

export async function fetchAndUpsertEvents(targetSource?: string): Promise<FetchSummary> {
  // Service-role client bypasses RLS for upserts
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Capture run timestamp BEFORE upserts — used to purge stale events afterwards
  const runStart = new Date().toISOString();
  const today = runStart.split('T')[0];

  // Fetch scraper settings from the DB
  const { data: dbSettings } = await supabase
    .from('scraper_settings')
    .select('id, settings');
  
  const settingsMap = new Map<string, ScraperSettings>();
  dbSettings?.forEach(s => settingsMap.set(s.id, s.settings));

  // Run all scrapers or just one; individual failures do not abort others
  const scrapersToRun = targetSource 
    ? SCRAPERS.filter(([s]) => s === targetSource)
    : SCRAPERS;

  const settled = await Promise.allSettled(
    scrapersToRun.map(async ([source, fn]) => {
      return await withSentryScraper(source, async () => {
        const sourceSettings = settingsMap.get(source) || {};
        const events = await fn(sourceSettings);
        return { source, events };
      });
    }),
  );

  const results: ScrapeResult[] = [];
  const allRows: Array<ScrapedEvent & { source: Source; city: string }> = [];

  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i];
    const source = scrapersToRun[i][0]; // use index to correctly map source even on failure

    if (outcome.status === 'rejected') {
      console.error(`[orchestrator] ${source} failed:`, outcome.reason);
      results.push({ source, count: 0, error: String(outcome.reason) });
      continue;
    }

    const { events } = outcome.value;
    results.push({ source, count: events.length });
    allRows.push(...events.map(e => ({ ...e, source, city: e.city || 'Bucharest' })));
  }

  // ── Protection for Manual Edits ───────────────────────────────────────────
  // Fetch all events flagged as 'manual' to prevent scrapers from re-adding them
  const { data: manualEvents } = await supabase
    .from('events')
    .select('title, venue, date')
    .eq('source', 'manual')
    .gte('date', today);

  const manualKeys = new Set(
    (manualEvents || []).map(e => `${normalizeForDedupe(e.title)}|${normalizeForDedupe(e.venue)}|${e.date}`)
  );
  
  if (manualKeys.size > 0) {
    console.log(`[orchestrator] protecting ${manualKeys.size} manually edited events from overwrite`);
  }

  // ── Apply venue normalisation before deduplication ───────────────────────
  for (const row of allRows) {
    row.venue = normalizeVenue(row.venue, row.title);
  }

  function normalizeForDedupe(s: string): string {
    if (!s) return '';
    return s.toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(?:bucuresti|bucharest|constanta|constanța|cluj\s*napoca|cluj)\b/g, ' ')
      .replace(/\b(?:concert\s+caritabil|music\s+for\s+autism|festival\s+de\s+paste|festival\s+de\s+pa[șs]te)\b/g, ' ')
      .replace(/\b(?:\d+\s+ani|anniversary|aniversare)\b/g, ' ')
      .replace(/^(pw|ctrl|control|extra|live|concert|party|alt jazz)\s*[-•x]*\s*/i, '') // Strip common prefixes
      .replace(/[|:;,.@()[\]{}/\\_•*–—!?&+#~'-]/g, ' ')  // Strip ALL punctuation including !?& (regression fix)
      .replace(/\s+/g, '') // Strip all spaces for strict core match
      .trim();
  }

  /** Loose title normalisation that keeps word boundaries for token overlap matching. */
  function normalizeTitleTokens(s: string): string[] {
    if (!s) return [];
    const cleaned = s.toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(?:bucuresti|bucharest|constanta|constanța|mamaia|costinesti|costinești|cluj\s*napoca|cluj)\b/g, ' ')
      .replace(/\b(?:concert|live|party|eveniment|bilete|tickets?|festival|fest|tour|editia|edition|caritabil|music\s+for\s+autism|festival\s+de\s+paste|pa[șs]te|1\s*mai|1st\s*may)\b/g, ' ')
      .replace(/\b(?:with|feat|featuring|si|at|all|night|long|prezinta|presents|aniversar|ani|anniversary|aniversare|ora|ore)\b/g, ' ')
      .replace(/\b\d{2,}\s*(?:ani|yrs|years|de\s+ani)\b/g, ' ')
      .replace(/^(?:pw|ctrl|control|extra|live|concert|party|alt jazz|targ|târg)\s*[-•x:]*\s*/i, '')
      .replace(/[|:;,.@()[\]{}/\\_•*–—!?&+#~'"-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned.split(' ').filter(t => t.length >= 2);
  }

  /** Dice coefficient of two token sets (0-1). */
  function tokenOverlap(a: string[], b: string[]): number {
    if (a.length === 0 && b.length === 0) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    const aSet = new Set(a);
    const bSet = new Set(b);
    let intersection = 0;
    aSet.forEach(t => { if (bSet.has(t)) intersection++; });
    return intersection / (aSet.size + bSet.size - intersection);
  }

  // Deduplicate within the batch by fuzzy (title, venue, date)
  // Logic: Group by fuzzy key, then pick the best one and merge ticket_url
  const groups = new Map<string, DedupeRow[]>();
  const zilesinoptiRows: DedupeRow[] = [];
  const providerGroupsByDate = new Map<string, Array<{ key: string; tokens: string[]; venue: string }>>();

  for (const row of allRows) {
    const key = `${normalizeForDedupe(row.title)}|${normalizeForDedupe(row.venue)}|${row.date}`;
    
    // Skip if a manual version already exists in the DB to protect edits
    if (manualKeys.has(key)) {
      console.log(`[orchestrator] skipping "${row.title}" - protected by manual edit`);
      continue;
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);

    // Track zilesinopti rows for cross-source merging
    if (row.source === 'zilesinopti') {
      zilesinoptiRows.push(row);
    } else {
      // Track ticket-provider groups by date for zilesinopti matching
      if (!providerGroupsByDate.has(row.date)) providerGroupsByDate.set(row.date, []);
      providerGroupsByDate.get(row.date)!.push({
        key,
        tokens: normalizeTitleTokens(row.title),
        venue: normalizeForDedupe(row.venue),
      });
    }
  }

  // ── ZileSiNopti cross-source bridge ─────────────────────────────────────
  // For each zilesinopti row, try to find a ticket-provider group on the same date
  // whose title tokens overlap enough. If found, join the zilesinopti row into that
  // provider group so it gets merged (description preserved, source stays provider).
  for (const zRow of zilesinoptiRows) {
    const zTokens = normalizeTitleTokens(zRow.title);
    if (zTokens.length === 0) continue;
    const dateProviders = providerGroupsByDate.get(zRow.date);
    if (!dateProviders) continue;
    const zVenue = normalizeForDedupe(zRow.venue);

    let bestMatch: { key: string; score: number } | null = null;
    for (const pg of dateProviders) {
      const titleScore = tokenOverlap(zTokens, pg.tokens);
      const venueBonus = zVenue && pg.venue && (
        zVenue.includes(pg.venue) || pg.venue.includes(zVenue) || 
        zVenue === pg.venue
      ) ? 0.25 : 0;
      const score = titleScore + venueBonus;
      // Require strong signal: either very high title overlap OR moderate overlap with venue match
      if (score >= (zVenue && (zVenue.includes(pg.venue) || pg.venue.includes(zVenue)) ? 0.40 : 0.60)) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { key: pg.key, score };
        }
      }
    }

    if (bestMatch && bestMatch.score >= 0.55) {
      const targetGroup = groups.get(bestMatch.key);
      if (targetGroup && targetGroup.length > 0 && targetGroup[0].source !== 'zilesinopti') {
        const zKey = `${normalizeForDedupe(zRow.title)}|${normalizeForDedupe(zRow.venue)}|${zRow.date}`;
        const zGroup = groups.get(zKey);
        if (zGroup && zGroup.length === 1 && zGroup[0] === zRow) {
          // Move this zilesinopti row into the provider group
          targetGroup.push(zRow);
          groups.delete(zKey);
          if (bestMatch.score < 0.80) {
            console.log(`[orchestrator] zs-bridge: matched "${zRow.title}" (zilesinopti) -> "${targetGroup[0].title}" (${targetGroup[0].source}) score=${bestMatch.score.toFixed(2)}`);
          }
        }
      }
    }
  }

  console.log(`[orchestrator] batch size after inter-batch dedupe: ${groups.size} (from ${allRows.length} raw rows)`);

  const unique: DedupeRow[] = [];
  for (const group of Array.from(groups.values())) {
    // Sort by source priority with venue-aware boosting
    const priority = (s: string, venue: string = '') => {
      // Venue-specific scrapers get highest priority for their own venues
      if (s === 'controlclub' && venue.toLowerCase().includes('control club')) return 20;
      if (s === 'clubguesthouse' && venue.toLowerCase().includes('guesthouse')) return 20;
      if (s === 'livetickets' && venue.toLowerCase().includes('livetickets')) return 20;
      if (s === 'ambilet' && venue.toLowerCase().includes('ambilet')) return 20;
      if (s === 'eventbook' && venue.toLowerCase().includes('eventbook')) return 20;
      if (s === 'onevent' && venue.toLowerCase().includes('onevent')) return 20;
      if (s === 'iabilet' && venue.toLowerCase().includes('iabilet')) return 20;
      if (s === 'fever' && (venue.toLowerCase().includes('candlelight') || venue.toLowerCase().includes('fever'))) return 20;
      
      // Existing priority logic for non-venue-specific cases
      if (s === 'controlclub') return 12; // Direct venue — always wins for its own events
      if (s === 'clubguesthouse') return 12; // Direct venue — always wins for its own events
      if (s === 'ra') return 11;          // RA is preferred editorial/source truth for club events
      if (s === 'livetickets') return 10; // Ticket provider should enrich price/buy link
      if (s === 'fever') return 9;
      if (s === 'emagic') return 8;
      if (s === 'iabilet') return 8;
      if (s === 'eventbook') return 7;
      if (s === 'ambilet') return 6;
      return 1;
    };
    group.sort((a: DedupeRow, b: DedupeRow) => priority(b.source, b.venue) - priority(a.source, a.venue));

    const best: DedupeRow = { ...group[0] };
    
    // Smart cross-source merge: RA and Control Club are equals, each has strengths
    for (let i = 1; i < group.length; i++) {
      const other = group[i];
      const bestIsRA  = best.source === 'ra';
      const bestIsCC  = best.source === 'controlclub';
      const otherIsRA = other.source === 'ra';
      const otherIsCC = other.source === 'controlclub';

      // RA+CC special pairing: venue calendar wins for date & SOLD OUT price;
      // RA platform wins for description, ticket_url, image
      if (bestIsRA && otherIsCC) {
        if (other.date) best.date = other.date;           // CC date is authoritative
        if (other.time) best.time = other.time;           // CC time from the calendar
        const mergedPrice = pickStrongerPrice(best.price, other.price);
        if (mergedPrice) best.price = mergedPrice;
      }
      if (bestIsCC && otherIsRA) {
        if (!best.description && other.description) best.description = other.description;
        if (!best.ticket_url && other.ticket_url)   best.ticket_url  = other.ticket_url;
        if (!best.image_url  && other.image_url)    best.image_url   = other.image_url;
        const mergedPrice = pickStrongerPrice(best.price, other.price);
        if (mergedPrice) best.price = mergedPrice;
      }

      if (best.source === 'ra' && isTicketProviderSource(other.source)) {
        const ticketUrl = providerTicketUrl(other);
        if (ticketUrl) best.ticket_url = ticketUrl;
        const mergedPrice = pickStrongerPrice(best.price, other.price);
        if (mergedPrice) best.price = mergedPrice;
        if (!best.time && other.time) best.time = other.time;
      }

      // ZileSiNopti is a low-trust aggregator. When it collides with ticketing
      // or official sources, keep the stronger source's fields rather than
      // backfilling potentially noisy descriptions/images/venues.
      // Still, zilesinopti descriptions are usually rich and accurate — merge them
      // when the provider row lacks one.
      if (best.source !== 'zilesinopti' && other.source === 'zilesinopti') {
        if (!best.description && other.description) best.description = other.description;
        if (!best.image_url  && other.image_url)  best.image_url  = other.image_url;
        continue;
      }

      // General fallback for all other source combos
      if (!best.ticket_url  && other.ticket_url)  best.ticket_url  = other.ticket_url;
      if (!best.image_url   && other.image_url)   best.image_url   = other.image_url;
      if (!best.description && other.description) best.description = other.description;
      if (!best.time        && other.time)        best.time        = other.time;
      const mergedPrice = pickStrongerPrice(best.price, other.price);
      if (mergedPrice) best.price = mergedPrice;
      // RA-specific fallback: if RA is not the winner but another source lacked a ticket link
      if (bestIsRA && !best.ticket_url && !otherIsCC && other.event_url) {
        best.ticket_url = other.event_url;
      }
    }
    unique.push(best);
  }

  // ── Filter out blocked venues before upsert ──────────────────────────────────
  // Prevent events at theatres, culture halls, and schools from being re-added.
  const blockedVenuePatterns = [
    /casa de cultur[ăa]/i,
    /colegiul național de arte/i,
    /centrul multifuncțional educativ/i,
    /jean constantin/i,
    /biseric/i,
  ];
  const blockedTitleTerms = [
    'lacul lebedelor',
    'spargatorul de nuci',
    'spărgătorul de nuci',
    'dragoste in 2 acte',
    'dragoste în 2 acte',
    'pentru copii',
    'spectacol copii',
    'atelier copii',
    'papusi',
    'păpuși',
    'balet',
    'ballet',
    'teatru',
    'stand-up',
    'stand up',
    'standup',
    'comedy',
    'comedie',
    'elrow',
    'concert de org',
  ];
  const blockedVenueCount = unique.length;
  let filteredCount = 0;
  for (let i = unique.length - 1; i >= 0; i--) {
    const venue = unique[i].venue;
    const title = unique[i].title;
    const titleLower = title.toLowerCase();
    if (
      blockedVenuePatterns.some(re => re.test(venue)) ||
      blockedTitleTerms.some(term => titleLower.includes(term))
    ) {
      unique.splice(i, 1);
      filteredCount++;
    }
  }
  if (filteredCount > 0) {
    console.log(`[orchestrator] filtered ${filteredCount} events at blocked venues/titles before upsert`);
  }

  // Track venues returned as "Venue TBC" so callers can flag them for manual review
  const skipped_venues: string[] = unique
    .filter(e => e.venue === 'Venue TBC')
    .map(e => `${e.title} (${e.source})`);

  if (skipped_venues.length > 0) {
    console.warn(`[orchestrator] ${skipped_venues.length} events have unresolved venue:`);
    skipped_venues.forEach(v => console.warn('  •', v));
  }

  // ── Purge non-music events that slipped through old filter runs ─────────────
  // Delete any DB rows whose title contains a hard-blocked term so stale children's
  // or theatre events don't persist between scraper runs.
  const HARD_BLOCK_TITLE_TERMS = [
    'pentru copii', 'spectacol copii', 'atelier copii',
    'copii', 'marionete', 'papusi', 'păpuși',
    'educativ', 'balet', 'ballet',
    'teatru',
    'stand-up', 'stand up', 'standup',
    'comedy', 'comedie',
    'elrow',
    'concert de org',
    // Classical/ballet/opera that gets miscategorized
    'lacul lebedelor',
    'spargatorul de nuci',
    'spărgătorul de nuci',
    'dragoste in 2 acte',
    'dragoste în 2 acte',
  ];
  for (const term of HARD_BLOCK_TITLE_TERMS) {
    const { error: cleanErr } = await supabase
      .from('events')
      .delete()
      .ilike('title', `%${term}%`);
    if (cleanErr) console.warn(`[orchestrator] cleanup error for "${term}":`, cleanErr.message);
  }

  // Also cleanup by DESCRIPTION, because some iabilet children's events have neutral titles
  // (e.g. "Dumbo cel isteț") but contain clear children's/theatre markers in full body text.
  const HARD_BLOCK_DESC_TERMS = [
    'pentru copii',
    'spectacol copii',
    'teatru interactiv',
    'teatru pentru',
    'festival de paște pentru întreaga familie',
    'festival de paste pentru intreaga familie',
    'pentru intreaga familie',
    'suspecți la party',
    'suspecti la party',
    'murder mystery',
    'board game',
    'social game',
    'copii',
    'teatru',
    'stand-up',
    'stand up',
    'standup',
    'comedy',
    'comedie',
    'elrow',
    'biserica',
    'concert de org',
  ];
  for (const term of HARD_BLOCK_DESC_TERMS) {
    const { error: cleanErr } = await supabase
      .from('events')
      .delete()
      .ilike('description', `%${term}%`);
    if (cleanErr) console.warn(`[orchestrator] cleanup error (description) for "${term}":`, cleanErr.message);
  }

  // Venue-level hard blocks for non-nightlife spaces that should never appear.
  const HARD_BLOCK_VENUE_TERMS = [
    'biserica',
    // Theatres, municipal culture halls, and educational institutions
    // are not nightlife venues and should be excluded.
    'casa de cultura a sindicatelor',
    'casa de cultură a sindicatelor',
    'colegiul național de arte',
    'centrul multifuncțional educativ',
    'jean constantin',
  ];
  for (const term of HARD_BLOCK_VENUE_TERMS) {
    const { error: cleanErr } = await supabase
      .from('events')
      .delete()
      .ilike('venue', `%${term}%`);
    if (cleanErr) console.warn(`[orchestrator] cleanup error (venue) for "${term}":`, cleanErr.message);
  }

  // ── Normalize venue city values (Constanța with ț → Constanta without) ──────

  // ── Clean legacy artifacts from previous scraper versions ────────────────────
  // 1. Titles stored as "Event @ Venue" (now stripped at scrape time)
  // 2. Venue stored as a street address (now detected and skipped at scrape time)
  const ADDRESS_PREFIXES = ['Strada %', 'Str. %', 'Str.%', 'Bulevardul %', 'Bd. %', 'Calea %', 'Piata %', 'Piața %'];
  await Promise.all([
    supabase.from('events').delete().like('title', '% @ %'),
    supabase.from('events').delete().like('title', '% @%'),
    ...ADDRESS_PREFIXES.map(p => supabase.from('events').delete().ilike('venue', p)),
  ]);

  // ── Purge specifically bad venue entries ─────────────────────────────────────
  const BAD_VENUES_EVENTS = [
    'Clubul Țăranului – La Mama MȚR',
    'Clubul Taranului - La Mama',
    'La Mama - Clubul Taranului',
    'La Mama - Clubul Țăranului',
    'Clubul Țăranului – La Mama (MTR)',
    'La Mama MȚR',
    'Teatrul de Vara Radu Beligan',
    'Teatrul de Vară Radu Beligan',
    'Sala Luceafarul',  // will be re-inserted with correct alias after this run
    // Berlin / wrong-country venues
    'DSTRKT Club Berlin',
    'KREUZWERK',
    'Lokschuppen Berlin',
    'Renate',
    'OST',
    // Wrong-city / nonsensical venues
    'altfel cluj',
    'LOG OUT',
    'secret location announced a few hours before',
    'Royal Hall, 1 Piața Presei Libere, Bucharest, Romania',
    'Monumentul Răscoalei de la Bobâlna',
    'Băile Figa',
  ];
  const BAD_VENUES_VENUES_TABLE = [
    'Clubul Țăranului – La Mama MȚR',
    'Clubul Taranului - La Mama',
    'La Mama - Clubul Taranului',
    'La Mama - Clubul Țăranului',
    'Clubul Țăranului – La Mama (MTR)',
    'Teatrul de Vara Radu Beligan',
    'Teatrul de Vară Radu Beligan',
    'Sala Luceafarul',
    'Quantic Club',    // normalised → "Quantic"
    'Quantic Pub',     // normalised → "Quantic"
    'Club Doors',      // normalised → "Doors Club"
    'DSTRKT Club',
    'DSTRKT Club Berlin',
    'Kreuzwerk',
    'KREUZWERK',
    'Lokschuppen Berlin',
    'Renate',
    'OST',
    'altfel cluj',
    'LOG OUT',
    'secret location announced a few hours before',
    'Royal Hall, 1 Piața Presei Libere, Bucharest, Romania',
    'Monumentul Răscoalei de la Bobâlna',
    'Băile Figa',
    // Constanta duplicate stubs
    'Club Phoenix, Constanta',
    'Phoenix',
    'Nuba Club',
    'Restaurant Dorna Mamaia &bull; Zile și Nopți',
    'Restaurant Dorna Mamaia • Zile și Nopți',
    // Bucharest duplicate stubs
    'Encore',
    'Nether',
    'NOAR HALL',
    'B52 The Club',
    'The Pub Universitatii',
    // Zilesinopti suffixed duplicates (now stripped at normalisation time)
    'Control Club • Zile și Nopți',
    'Hard Rock Cafe • Zile și Nopți',
    'Apollo111 Barul & Terasa • Zile și Nopți',
    'Groove Alt Social Bar • Zile și Nopți',
    'The Coffee Shop Constituției • Zile și Nopți',
    // RA lowercase variant
    'control',
    // Other duplicates
    'Trattoria Monza Drumul Taberei',
    'Rio Club Bucuresti',
  ];
  await Promise.all([
    ...BAD_VENUES_EVENTS.map(v => supabase.from('events').delete().eq('venue', v)),
    // Merge duplicate Quantic rows in events table (rename "Quantic Club" → "Quantic")
    supabase.from('events').update({ venue: 'Quantic' }).eq('venue', 'Quantic Club'),
    // Merge duplicate Doors rows (rename "Club Doors" → "Doors Club")
    supabase.from('events').update({ venue: 'Doors Club' }).eq('venue', 'Club Doors'),
  ]);

  // Remove events outside our target cities (Bucharest/Constanta) that still slip in from aggregators.
  // We intentionally check both title and venue text to catch rows like
  // "Concert caritabil de priscene" with venue "Casa de Cultură a Studenților Cluj".
  const OUT_OF_SCOPE_CITY_TERMS = [
    'cluj', 'cluj-napoca',
    'iasi', 'iași',
    'timisoara', 'timișoara',
    'brasov', 'brașov',
    'sibiu',
    'oradea',
  ];
  for (const term of OUT_OF_SCOPE_CITY_TERMS) {
    const [{ error: evErr }, { error: venueErr }] = await Promise.all([
      supabase.from('events').delete().ilike('title', `%${term}%`),
      supabase.from('events').delete().ilike('venue', `%${term}%`),
    ]);
    if (evErr) console.warn(`[orchestrator] out-of-scope cleanup error (title:${term}):`, evErr.message);
    if (venueErr) console.warn(`[orchestrator] out-of-scope cleanup error (venue:${term}):`, venueErr.message);
  }

  // ── Pre-clean ALL stale "Venue TBC" rows ─────────────────────────────────────
  // Delete every "Venue TBC" row before upserting — any event that still can't
  // resolve a venue will be re-inserted as "Venue TBC" in this run's upsert.
  {
    const { error: delError } = await supabase
      .from('events')
      .delete()
      .eq('venue', 'Venue TBC');
    if (delError) console.warn('[orchestrator] Venue TBC pre-clean error:', delError.message);
    else console.log('[orchestrator] cleared all stale "Venue TBC" rows');
  }

  let upserted = 0;

  // Upsert in chunks of 50 to stay within Supabase payload limits
  for (let i = 0; i < unique.length; i += 50) {
    const rows = unique.slice(i, i + 50);
    const existingByKey = new Map<string, {
      title: string;
      venue: string;
      date: string;
      source: Source;
      time?: string | null;
      description?: string | null;
      image_url?: string | null;
      price?: string | null;
      ticket_url?: string | null;
    }>();
    const dates = Array.from(new Set(rows.map(row => row.date)));
    const sources = Array.from(new Set(rows.map(row => row.source)));

    if (dates.length > 0 && sources.length > 0) {
      const { data: existingRows, error: existingErr } = await supabase
        .from('events')
        .select('title,venue,date,source,time,description,image_url,price,ticket_url')
        .in('date', dates)
        .in('source', sources);

      if (existingErr) {
        console.warn('[orchestrator] existing-row lookup failed before upsert:', existingErr.message);
      } else {
        for (const existing of existingRows || []) {
          existingByKey.set(eventStorageKey(existing as any), existing as any);
        }
      }
    }

    const chunk = rows.map(row => {
      const existing = existingByKey.get(eventStorageKey(row));
      return {
      source:      row.source,
      title:       row.title,
      venue:       row.venue,
      date:        row.date,
      time:        row.time || existing?.time || null,
      description: row.description || existing?.description || null,
      image_url:   row.image_url || existing?.image_url || '',
      event_url:   row.event_url,
      genres:      row.genres,
      price:       row.price || existing?.price || null,
      ticket_url:  row.ticket_url || existing?.ticket_url || null,
      city:        row.city,
      updated_at:  new Date().toISOString(),
      };
    });

    const { error } = await supabase
      .from('events')
      .upsert(chunk, {
        onConflict: 'title,venue,date,source',
        ignoreDuplicates: false, // update existing rows (image/price may change)
      });

    if (error) {
      console.error('[orchestrator] upsert error:', error.message);
    } else {
      upserted += chunk.length;
    }
  }

  // ── Venue sync disabled ───────────────────────────────────────────────────
  // Venues are curated manually. Scrapes must not mutate the venues table or
  // reintroduce duplicates when editors are cleaning venue records.
  const unmatchedVenues = Array.from(
    new Set(unique.map(row => row.venue).filter(name => isValidVenueName(name)))
  );
  console.log(`[orchestrator] venue auto-sync disabled; ${unmatchedVenues.length} scraped venue names observed this run`);

  // ── Global duplicate sweeper ───────────────────────────────────────────────
  // Fetch all upcoming events and manually prune duplicates that survived upsert
  // (e.g. because (title,venue,date,source) is the existing unique constraint)
  const { data: allUpcoming } = await supabase
    .from('events')
    .select('id, title, venue, date, time, price, source, ticket_url, event_url, image_url, description')
    .gte('date', today);

  if (allUpcoming && allUpcoming.length > 0) {
    // Pass 0: remove strict duplicates first (same source + same event_url + same date)
    {
      const seenStrict = new Map<string, any>();
      const strictDeleteIds: string[] = [];
      for (const row of allUpcoming) {
        const strictKey = `${row.source}|${row.event_url ?? ''}|${row.date}`;
        if (!row.event_url) continue;
        const prev = seenStrict.get(strictKey);
        if (!prev) {
          seenStrict.set(strictKey, row);
          continue;
        }
        const prevNorm = normalizeForDedupeLoose(prev.venue ?? '');
        const currNorm = normalizeForDedupeLoose(row.venue ?? '');
        // Prefer the non-TBA/non-null venue variant
        const prevBad = prevNorm === 'tba' || prevNorm.startsWith('tba ');
        const currBad = currNorm === 'tba' || currNorm.startsWith('tba ');
        if (prevBad && !currBad) {
          strictDeleteIds.push(prev.id);
          seenStrict.set(strictKey, row);
        } else {
          strictDeleteIds.push(row.id);
        }
      }
      if (strictDeleteIds.length > 0) {
        for (let i = 0; i < strictDeleteIds.length; i += 20) {
          const batch = strictDeleteIds.slice(i, i + 20);
          const { error: strictErr } = await supabase.from('events').delete().in('id', batch);
          if (strictErr) console.warn('[orchestrator] strict dedupe delete error:', strictErr.message);
        }
      }
    }

    // Re-read after strict dedupe so clustering works on fresh set
    const { data: allUpcoming2 } = await supabase
      .from('events')
      .select('id, title, venue, date, time, price, source, ticket_url, event_url, image_url, description')
      .gte('date', today);
    const rowsForSweep = allUpcoming2 || allUpcoming;

    // Group by VENUE + DATE first (broad filter)
    const venueDateGroups = new Map<string, any[]>();
    for (const row of rowsForSweep) {
      // Use normalizeVenue to ensure different aliases of same venue end up in same bucket
      const vNorm = normalizeVenue(row.venue, row.title);
      const key = `${normalizeForDedupeLoose(vNorm)}|${row.date}`;
      if (!venueDateGroups.has(key)) venueDateGroups.set(key, []);
      venueDateGroups.get(key)!.push(row);
    }

    const idsToDelete: string[] = [];
    
    for (const [key, eventsAtVenueDate] of Array.from(venueDateGroups.entries())) {
      if (eventsAtVenueDate.length <= 1) continue;

      // Clustering algorithm: group events that are "related" by title
      const clusters: any[][] = [];
      const priority = (s: string) => {
        if (s === 'manual') return 100;
        if (s === 'controlclub') return 12; // Always wins for its own venue
        if (s === 'clubguesthouse') return 12; // Always wins for its own venue
        if (s === 'ra') return 11;
        if (s === 'livetickets') return 10;
        if (s === 'fever') return 9;
        if (s === 'emagic') return 8;
        if (s === 'eventbook') return 8;
        if (s === 'iabilet') return 7;
        return 1;
      };

      for (const event of eventsAtVenueDate) {
        let addedToCluster = false;
        const normTitle = normalizeForDedupe(event.title);
        const promoterFreeTitle = normalizeTitleWithoutPromoterPrefix(event.title);
        const eventTicketUrl = comparableUrlKey(event.ticket_url);
        const eventUrl = comparableUrlKey(event.event_url);

        for (const cluster of clusters) {
          const leader = cluster[0];
          const leaderTitle = normalizeForDedupe(leader.title);
          const leaderPromoterFreeTitle = normalizeTitleWithoutPromoterPrefix(leader.title);
          const leaderTicketUrl = comparableUrlKey(leader.ticket_url);
          const leaderEventUrl = comparableUrlKey(leader.event_url);
          
          // Keep same-day dedupe conservative. Loose substring/prefix heuristics were
          // collapsing distinct lineups at the same venue on the same night.
          const normTitleLoose = normalizeInTensionToken(event.title);
          const leaderTitleLoose = normalizeInTensionToken(leader.title);

          const sameMeaningfulUrl =
            (eventTicketUrl && leaderTicketUrl && eventTicketUrl === leaderTicketUrl && eventTicketUrl.length > 20) ||
            (eventUrl && leaderEventUrl && eventUrl === leaderEventUrl && eventUrl.length > 20) ||
            (eventTicketUrl && leaderEventUrl && eventTicketUrl === leaderEventUrl && eventTicketUrl.length > 20) ||
            (eventUrl && leaderTicketUrl && eventUrl === leaderTicketUrl && eventUrl.length > 20);

          const promoterFreeExact =
            promoterFreeTitle.length > 6 &&
            leaderPromoterFreeTitle.length > 6 &&
            promoterFreeTitle === leaderPromoterFreeTitle;

          const isRelated =
            normTitle === leaderTitle ||
            promoterFreeExact ||
            hasSameCoreLineup(event.title, leader.title) ||
            sameMeaningfulUrl ||
            // Explicit alias bridge for inTension/intension variants
            (normTitleLoose.includes('intension') && leaderTitleLoose.includes('intension'));

          if (isRelated) {
            cluster.push(event);
            addedToCluster = true;
            break;
          }
        }
        if (!addedToCluster) {
          clusters.push([event]);
        }
      }

      // Inside each cluster, pick a winner and delete others
      for (const cluster of clusters) {
        if (cluster.length <= 1) continue;

        cluster.sort((a, b) => priority(b.source) - priority(a.source));
        const winner = cluster[0];
        const losers = cluster.slice(1);

        let updatedWinner = false;
        for (const loser of losers) {
          console.log(`[orchestrator] sweeper: marking duplicate for deletion: "${loser.title}" (${loser.source}) -> keeping: "${winner.title}" (${winner.source})`);
          if (winner.source !== 'zilesinopti' && loser.source === 'zilesinopti') {
            idsToDelete.push(loser.id);
            continue;
          }
          if (winner.source === 'ra' && isTicketProviderSource(loser.source)) {
            const ticketUrl = loser.ticket_url || loser.event_url;
            if (ticketUrl) {
              winner.ticket_url = ticketUrl;
              updatedWinner = true;
            }
            const mergedPrice = pickStrongerPrice(winner.price, loser.price);
            if (mergedPrice !== winner.price) {
              winner.price = mergedPrice;
              updatedWinner = true;
            }
            if (!winner.time && loser.time) {
              winner.time = loser.time;
              updatedWinner = true;
            }
            idsToDelete.push(loser.id);
            continue;
          }
          // Merge valuable data if winner is missing it
          if (!winner.ticket_url && loser.ticket_url) {
            winner.ticket_url = loser.ticket_url;
            updatedWinner = true;
          }
          if (!winner.image_url && loser.image_url) {
            winner.image_url = loser.image_url;
            updatedWinner = true;
          }
          if (!winner.description && loser.description) {
            winner.description = loser.description;
            updatedWinner = true;
          }
          if (!winner.time && loser.time) {
            winner.time = loser.time;
            updatedWinner = true;
          }
          const mergedPrice = pickStrongerPrice(winner.price, loser.price);
          if (mergedPrice !== winner.price) {
            winner.price = mergedPrice;
            updatedWinner = true;
          }
          idsToDelete.push(loser.id);
        }

        if (updatedWinner) {
          console.log(`[orchestrator] sweeper: update winner "${winner.title}" (${winner.id})`);
          await supabase.from('events').update({ 
            ticket_url: winner.ticket_url,
            image_url: winner.image_url,
            description: winner.description,
            time: winner.time,
            price: winner.price,
            updated_at: new Date().toISOString()
          }).eq('id', winner.id);
        }
      }
    }

    // Pass 2: merge overnight duplicates that split across adjacent dates
    // (e.g. venue calendar says 22:00 on Friday, aggregator says 01:00 on Saturday).
    const deletedIds = new Set(idsToDelete);
    const venueGroups = new Map<string, any[]>();
    for (const row of rowsForSweep) {
      if (deletedIds.has(row.id)) continue;
      const vNorm = normalizeForDedupeLoose(normalizeVenue(row.venue, row.title));
      if (!venueGroups.has(vNorm)) venueGroups.set(vNorm, []);
      venueGroups.get(vNorm)!.push(row);
    }

    for (const eventsAtVenue of Array.from(venueGroups.values())) {
      if (eventsAtVenue.length <= 1) continue;

      const clusters: any[][] = [];
      const priority = (s: string) => {
        if (s === 'manual') return 100;
        if (s === 'controlclub') return 12;
        if (s === 'clubguesthouse') return 12;
        if (s === 'ra') return 11;
        if (s === 'livetickets') return 10;
        if (s === 'fever') return 9;
        if (s === 'emagic') return 8;
        if (s === 'eventbook') return 8;
        if (s === 'iabilet') return 7;
        if (s === 'ambilet') return 7;
        return 1;
      };

      const isCrossMidnightDuplicate = (a: any, b: any): boolean => {
        const dayGap = diffDays(a.date, b.date);
        if (dayGap !== 1) return false;

        const aMinutes = parseTimeToMinutes(a.time);
        const bMinutes = parseTimeToMinutes(b.time);
        if (aMinutes === null || bMinutes === null) return false;

        const overnight =
          (aMinutes >= 20 * 60 && bMinutes <= 6 * 60) ||
          (bMinutes >= 20 * 60 && aMinutes <= 6 * 60);
        if (!overnight) return false;

        const aNormTitle = normalizeForDedupe(a.title);
        const bNormTitle = normalizeForDedupe(b.title);
        const aPromoterFreeTitle = normalizeTitleWithoutPromoterPrefix(a.title);
        const bPromoterFreeTitle = normalizeTitleWithoutPromoterPrefix(b.title);
        const aTicketUrl = comparableUrlKey(a.ticket_url);
        const bTicketUrl = comparableUrlKey(b.ticket_url);
        const aEventUrl = comparableUrlKey(a.event_url);
        const bEventUrl = comparableUrlKey(b.event_url);

        const sameMeaningfulUrl =
          (aTicketUrl && bTicketUrl && aTicketUrl === bTicketUrl) ||
          (aEventUrl && bEventUrl && aEventUrl === bEventUrl) ||
          (aTicketUrl && bEventUrl && aTicketUrl === bEventUrl) ||
          (aEventUrl && bTicketUrl && aEventUrl === bTicketUrl);

        if (sameMeaningfulUrl) return true;

        return (
          aNormTitle === bNormTitle ||
          hasSameCoreLineup(a.title, b.title) ||
          (aPromoterFreeTitle.length > 8 &&
            bPromoterFreeTitle.length > 8 &&
            aPromoterFreeTitle === bPromoterFreeTitle)
        );
      };

      for (const event of eventsAtVenue) {
        let addedToCluster = false;
        for (const cluster of clusters) {
          if (cluster.some(existing => isCrossMidnightDuplicate(event, existing))) {
            cluster.push(event);
            addedToCluster = true;
            break;
          }
        }
        if (!addedToCluster) clusters.push([event]);
      }

      for (const cluster of clusters) {
        if (cluster.length <= 1) continue;

        cluster.sort((a, b) => priority(b.source) - priority(a.source));
        const winner = cluster[0];
        const losers = cluster.slice(1);

        let updatedWinner = false;
        for (const loser of losers) {
          if (deletedIds.has(loser.id)) continue;
          console.log(`[orchestrator] sweeper: cross-midnight duplicate "${loser.title}" (${loser.source}) -> keeping "${winner.title}" (${winner.source})`);
          if (winner.source !== 'zilesinopti' && loser.source === 'zilesinopti') {
            idsToDelete.push(loser.id);
            deletedIds.add(loser.id);
            continue;
          }
          if (winner.source === 'ra' && isTicketProviderSource(loser.source)) {
            const ticketUrl = loser.ticket_url || loser.event_url;
            if (ticketUrl) {
              winner.ticket_url = ticketUrl;
              updatedWinner = true;
            }
            const mergedPrice = pickStrongerPrice(winner.price, loser.price);
            if (mergedPrice !== winner.price) {
              winner.price = mergedPrice;
              updatedWinner = true;
            }
            if (!winner.time && loser.time) {
              winner.time = loser.time;
              updatedWinner = true;
            }
            idsToDelete.push(loser.id);
            deletedIds.add(loser.id);
            continue;
          }
          if (!winner.ticket_url && loser.ticket_url) {
            winner.ticket_url = loser.ticket_url;
            updatedWinner = true;
          }
          if (!winner.image_url && loser.image_url) {
            winner.image_url = loser.image_url;
            updatedWinner = true;
          }
          if (!winner.description && loser.description) {
            winner.description = loser.description;
            updatedWinner = true;
          }
          if (!winner.time && loser.time) {
            winner.time = loser.time;
            updatedWinner = true;
          }
          const mergedPrice = pickStrongerPrice(winner.price, loser.price);
          if (mergedPrice !== winner.price) {
            winner.price = mergedPrice;
            updatedWinner = true;
          }
          idsToDelete.push(loser.id);
          deletedIds.add(loser.id);
        }

        if (updatedWinner) {
          console.log(`[orchestrator] sweeper: update winner "${winner.title}" (${winner.id})`);
          await supabase.from('events').update({
            ticket_url: winner.ticket_url,
            image_url: winner.image_url,
            description: winner.description,
            time: winner.time,
            price: winner.price,
            updated_at: new Date().toISOString()
          }).eq('id', winner.id);
        }
      }
    }

    if (idsToDelete.length > 0) {
      console.log(`[orchestrator] duplicate sweeper: removing ${idsToDelete.length} stale twins`);
      // Delete in batches to avoid URL length limits
      for (let i = 0; i < idsToDelete.length; i += 20) {
        const batch = idsToDelete.slice(i, i + 20);
        const { error: sweepErr } = await supabase.from('events').delete().in('id', batch);
        if (sweepErr) console.error('[orchestrator] sweep delete error:', sweepErr.message);
      }
    }

    // ── Venue-agnostic zilesinopti cross-source sweeper ─────────────────────
    // The venue-based sweepers above can miss zilesinopti duplicates when venue
    // names differ between sources (e.g. "Tulum Mamaia" vs "Club Tulum"). This
    // pass ignores venue entirely and matches zilesinopti rows against ALL
    // ticket-provider rows on the same date using title token overlap.
    {
      const { data: currentRows } = await supabase
        .from('events')
        .select('id, title, venue, date, time, price, source, ticket_url, event_url, image_url, description')
        .gte('date', today);

      if (currentRows && currentRows.length > 0) {
        const zsRows = currentRows.filter(r => (r as any).source === 'zilesinopti');
        const providerRows = currentRows.filter(r => isTicketProviderSource((r as any).source) || (r as any).source === 'controlclub' || (r as any).source === 'clubguesthouse');

        const zsDeleteIds: string[] = [];
        const providerUpdates: Array<{ id: string; description?: string | null; image_url?: string | null }> = [];

        for (const zs of zsRows) {
          const zsRow = zs as any;
          if (!zsRow.title) continue;
          const zTokens = normalizeTitleTokens(zsRow.title);
          if (zTokens.length === 0) continue;

          let bestProvider: { row: any; score: number } | null = null;
          for (const prov of providerRows) {
            const pRow = prov as any;
            if (pRow.date !== zsRow.date) continue;
            const pTokens = normalizeTitleTokens(pRow.title);
            if (pTokens.length === 0) continue;
            const score = tokenOverlap(zTokens, pTokens);
            if (score >= 0.50 && (!bestProvider || score > bestProvider.score)) {
              bestProvider = { row: pRow, score };
            }
          }

          if (bestProvider && bestProvider.score >= 0.55) {
            const update: any = { id: bestProvider.row.id };
            if (!bestProvider.row.description && zsRow.description) update.description = zsRow.description;
            if (!bestProvider.row.image_url && zsRow.image_url) update.image_url = zsRow.image_url;
            if (Object.keys(update).length > 1) providerUpdates.push(update);
            zsDeleteIds.push(zsRow.id);
          }
        }

        // Apply provider description/image updates
        for (const update of providerUpdates) {
          const { id, ...fields } = update;
          const { error: upErr } = await supabase.from('events').update(fields).eq('id', id);
          if (upErr) console.warn('[orchestrator] zs-bridge update error:', upErr.message);
        }

        // Delete the matched zilesinopti rows
        if (zsDeleteIds.length > 0) {
          console.log(`[orchestrator] zs-bridge sweeper: removing ${zsDeleteIds.length} zilesinopti rows matched to providers`);
          for (let i = 0; i < zsDeleteIds.length; i += 20) {
            const batch = zsDeleteIds.slice(i, i + 20);
            const { error: delErr } = await supabase.from('events').delete().in('id', batch);
            if (delErr) console.error('[orchestrator] zs-bridge delete error:', delErr.message);
          }
        }

        // ── Re-attribute zilesinopti rows that already have known-provider ticket URLs ──
        // Some zilesinopti events link directly to iabilet/ambilet/etc. but the provider
        // scraper didn't surface them (pagination, different naming). Re-attribute these
        // so the source badge reflects the real ticket seller.
        const reattributable = (currentRows || []).filter(r => {
          const src = (r as any).source;
          const url = (r as any).ticket_url;
          if (src !== 'zilesinopti' || !url) return false;
          return /(?:iabilet|eventbook|livetickets|ambilet|emagic)\.ro/i.test(url);
        });

        if (reattributable.length > 0) {
          const reattrUpdates: Array<{ id: string; source: string }> = [];
          for (const row of reattributable) {
            const r = row as any;
            const url = r.ticket_url || '';
            let newSource = '';
            if (/iabilet\.ro/i.test(url)) newSource = 'iabilet';
            else if (/eventbook\.ro/i.test(url)) newSource = 'eventbook';
            else if (/livetickets\.ro/i.test(url)) newSource = 'livetickets';
            else if (/ambilet\.ro/i.test(url)) newSource = 'ambilet';
            else if (/emagic\.ro/i.test(url)) newSource = 'emagic';
            else continue;
            reattrUpdates.push({ id: r.id, source: newSource });
          }

          // Apply in batches to avoid unique constraint violations from concurrent runs
          for (const u of reattrUpdates) {
            const { error: reattrErr } = await supabase.from('events')
              .update({ source: u.source, updated_at: new Date().toISOString() })
              .eq('id', u.id);
            if (reattrErr) {
              // If the row already exists as the provider source, delete the zilesinopti version
              if (reattrErr.code === '23505') {
                await supabase.from('events').delete().eq('id', u.id);
              } else {
                console.warn('[orchestrator] zs-reattr update error:', reattrErr.message);
              }
            }
          }
          console.log(`[orchestrator] zs-reattr: re-attributed ${reattrUpdates.length} zilesinopti rows to provider sources`);
        }
      }
    }
  }

  // ── Stale-source garbage collection ──────────────────────────────────────────
  // Keep historical events searchable so people can still tag a weekend party
  // after it has passed. Only prune rows that have been stale for a long time.
  // Exception: never delete SOLD OUT events — they have historical value.
  const activeSourcesWithEvents = results.filter(r => r.count > 0).map(r => r.source);
  const { data: historicalLogs } = await supabase
    .from('scraper_logs')
    .select('source, total_upserted, results')
    .order('run_date', { ascending: false })
    .limit(40);

  for (const src of activeSourcesWithEvents) {
    const currentCount = results.find((result) => result.source === src)?.count ?? 0;
    const previousCounts = ((historicalLogs || []) as HistoricalScraperLog[])
      .map((log) => extractHistoricalSourceCount(log, src))
      .filter((count): count is number => typeof count === 'number' && count > 0)
      .slice(0, 3);

    const historicalBaseline = previousCounts.length > 0 ? Math.max(...previousCounts) : null;
    const minimumTrustedCount = historicalBaseline
      ? Math.max(5, Math.floor(historicalBaseline * 0.6))
      : 5;

    if (historicalBaseline && currentCount < minimumTrustedCount) {
      console.warn(
        `[orchestrator] skipping stale future cleanup for ${src}: current count ${currentCount} is below trusted threshold ${minimumTrustedCount} (baseline ${historicalBaseline})`,
      );
      continue;
    }

    const { error: staleFutureErr } = await supabase
      .from('events')
      .delete()
      .eq('source', src)
      .gte('date', today)
      .lt('updated_at', runStart);
    if (staleFutureErr) console.warn(`[orchestrator] stale future cleanup error for ${src}:`, staleFutureErr.message);
  }

  const archiveRetentionDays = 365;
  const archiveCutoffIso = new Date(Date.now() - archiveRetentionDays * 24 * 60 * 60 * 1000).toISOString();
  for (const src of activeSourcesWithEvents) {
    const { error: staleErr } = await supabase
      .from('events')
      .delete()
      .eq('source', src)
      .neq('price', 'SOLD OUT')
      .lt('updated_at', archiveCutoffIso);
    if (staleErr) console.warn(`[orchestrator] stale cleanup error for ${src}:`, staleErr.message);
  }
  const activeCount = activeSourcesWithEvents.length;
  if (activeCount > 0) console.log(`[orchestrator] stale GC: retained recent history and pruned archived rows from ${activeCount} active source(s)`);

  const total = unique.length;
  const summary = { total, upserted, skipped_venues, results };

  // ── Persist run results to history ──────────────────────────────────────────
  try {
    await supabase.from('scraper_logs').insert({
      source: targetSource || 'all',
      total_upserted: upserted,
      results: results,
      skipped_venues: skipped_venues,
      run_date: new Date().toISOString()
    });
    console.log('[orchestrator] persisted run results to scraper_logs');
  } catch (logErr) {
    console.warn('[orchestrator] failed to persist scraper log (table might not exist yet):', logErr);
  }

  return summary;
}
