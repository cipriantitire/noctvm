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
import { ScrapedEvent }       from './types';
import { isValidVenueName }  from './utils';
import { withSentryScraper } from '../sentry-utils';
import * as Sentry           from '@sentry/nextjs';

type Source = 'zilesinopti' | 'iabilet' | 'onevent' | 'ambilet' | 'livetickets' | 'ra' | 'eventbook' | 'controlclub';

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
  // Restaurant Dorna — strip HTML entities / bullet variants
  'restaurant dorna mamaia &bull; zile și nopți': 'Restaurant Dorna Mamaia',
  'restaurant dorna mamaia • zile și nopți':      'Restaurant Dorna Mamaia',
  'restaurant dorna mamaia • zile si nopti':      'Restaurant Dorna Mamaia',
  // Forge aliases
  'forge bucharest': 'Forge',
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
];

/** Strip common branding suffixes appended by aggregator sites. */
function stripVenueSuffix(name: string): string {
  return name
    .replace(/\s*[•·\-–—]\s*Zile [șs]i Nop[țt]i$/i, '')
    .replace(/\s*&bull;\s*Zile [șs]i Nop[țt]i$/i, '')
    .trim();
}

/** Normalise a scraped venue name to its canonical form. */
function normalizeVenue(venueName: string, eventTitle: string): string {
  // Strip aggregator suffixes first (e.g. "Control Club • Zile și Nopți" → "Control Club")
  const cleaned = stripVenueSuffix(venueName);
  const lower = cleaned.toLowerCase().trim();
  // Simple alias lookup
  const alias = VENUE_ALIASES[lower];
  const base = alias ?? cleaned;

  // Title-aware overrides (e.g. Sala Luceafarul → Encore Club for Japanese acts)
  for (const { titlePattern, wrongVenue, correctVenue } of VENUE_TITLE_OVERRIDES) {
    if (titlePattern.test(eventTitle) && wrongVenue.test(base)) return correctVenue;
  }

  return base;
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

const SCRAPERS: [Source, (settings?: ScraperSettings) => Promise<ScrapedEvent[]>][] = [
  ['zilesinopti', scrapeZilesinopti],
  ['iabilet',     scrapeIabilet],
  ['onevent',     scrapeOnevent],
  ['ambilet',     scrapeAmbilet],
  ['livetickets', scrapeLivetickets],
  ['ra',          scrapeRA],
  ['eventbook',   scrapeEventbook],
  ['controlclub', scrapeControlClub],
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
      .replace(/^(pw|ctrl|control|extra|live|concert|party|alt jazz)\s*[-•x]*\s*/i, '') // Strip common prefixes
      .replace(/[|:;,.@()[\]{}/\\_•*–—!?&+#~'-]/g, ' ')  // Strip ALL punctuation including !?& (regression fix)
      .replace(/\s+/g, '') // Strip all spaces for strict core match
      .trim();
  }

  type DedupeRow = ScrapedEvent & { source: Source; city: string };

  // Deduplicate within the batch by fuzzy (title, venue, date)
  // Logic: Group by fuzzy key, then pick the best one and merge ticket_url
  const groups = new Map<string, DedupeRow[]>();
  for (const row of allRows) {
    const key = `${normalizeForDedupe(row.title)}|${normalizeForDedupe(row.venue)}|${row.date}`;
    
    // Skip if a manual version already exists in the DB to protect edits
    if (manualKeys.has(key)) {
      console.log(`[orchestrator] skipping "${row.title}" - protected by manual edit`);
      continue;
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  console.log(`[orchestrator] batch size after inter-batch dedupe: ${groups.size} (from ${allRows.length} raw rows)`);

  const unique: DedupeRow[] = [];
  for (const group of Array.from(groups.values())) {
    // Sort by source priority with venue-aware boosting
    const priority = (s: string, venue: string = '') => {
      // Venue-specific scrapers get highest priority for their own venues
      if (s === 'controlclub' && venue.toLowerCase().includes('control club')) return 20;
      if (s === 'livetickets' && venue.toLowerCase().includes('livetickets')) return 20;
      if (s === 'ambilet' && venue.toLowerCase().includes('ambilet')) return 20;
      if (s === 'eventbook' && venue.toLowerCase().includes('eventbook')) return 20;
      if (s === 'onevent' && venue.toLowerCase().includes('onevent')) return 20;
      if (s === 'zilesinopti' && venue.toLowerCase().includes('zilesinopti')) return 20;
      if (s === 'iabilet' && venue.toLowerCase().includes('iabilet')) return 20;
      
      // Existing priority logic for non-venue-specific cases
      if (s === 'controlclub') return 10; // Direct venue — always wins for its own events
      if (s === 'livetickets') return 10; // Keep parity with livetickets
      if (s === 'ra') return 9;           // RA fills in metadata where venue lacks it
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
        if (other.price === 'SOLD OUT') best.price = 'SOLD OUT';
        else if (!best.price && other.price) best.price = other.price;
      }
      if (bestIsCC && otherIsRA) {
        if (!best.description && other.description) best.description = other.description;
        if (!best.ticket_url && other.ticket_url)   best.ticket_url  = other.ticket_url;
        if (!best.image_url  && other.image_url)    best.image_url   = other.image_url;
      }

      // General fallback for all other source combos
      if (!best.ticket_url  && other.ticket_url)  best.ticket_url  = other.ticket_url;
      if (!best.image_url   && other.image_url)   best.image_url   = other.image_url;
      if (!best.description && other.description) best.description = other.description;
      if (!best.time        && other.time)        best.time        = other.time;
      // RA-specific fallback: if RA is not the winner but another source lacked a ticket link
      if (bestIsRA && !best.ticket_url && !otherIsCC && other.event_url) {
        best.ticket_url = other.event_url;
      }
    }
    unique.push(best);
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
  ];
  for (const term of HARD_BLOCK_TITLE_TERMS) {
    const { error: cleanErr } = await supabase
      .from('events')
      .delete()
      .ilike('title', `%${term}%`);
    if (cleanErr) console.warn(`[orchestrator] cleanup error for "${term}":`, cleanErr.message);
  }

  // ── Normalize venue city values (Constanța with ț → Constanta without) ──────
  await supabase.from('venues').update({ city: 'Constanta' }).eq('city', 'Constanța');

  // ── Clean legacy artifacts from previous scraper versions ────────────────────
  // 1. Titles stored as "Event @ Venue" (now stripped at scrape time)
  // 2. Venue stored as a street address (now detected and skipped at scrape time)
  const ADDRESS_PREFIXES = ['Strada %', 'Str. %', 'Str.%', 'Bulevardul %', 'Bd. %', 'Calea %', 'Piata %', 'Piața %'];
  await Promise.all([
    supabase.from('events').delete().like('title', '% @ %'),
    supabase.from('events').delete().like('title', '% @%'),
    ...ADDRESS_PREFIXES.map(p => supabase.from('events').delete().ilike('venue', p)),
    // Also purge address-string venue names from the venues table
    ...ADDRESS_PREFIXES.map(p => supabase.from('venues').delete().ilike('name', p)),
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
    ...BAD_VENUES_VENUES_TABLE.map(v => supabase.from('venues').delete().eq('name', v)),
    // Merge duplicate Quantic rows in events table (rename "Quantic Club" → "Quantic")
    supabase.from('events').update({ venue: 'Quantic' }).eq('venue', 'Quantic Club'),
    // Merge duplicate Doors rows (rename "Club Doors" → "Doors Club")
    supabase.from('events').update({ venue: 'Doors Club' }).eq('venue', 'Club Doors'),
  ]);

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
    const chunk = unique.slice(i, i + 50).map(row => ({
      source:      row.source,
      title:       row.title,
      venue:       row.venue,
      date:        row.date,
      time:        row.time,
      description: row.description,
      image_url:   row.image_url || '',
      event_url:   row.event_url,
      genres:      row.genres,
      price:       row.price,
      ticket_url:  row.ticket_url,
      city:        row.city,
      updated_at:  new Date().toISOString(),
    }));

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

  // ── Auto-sync venues from scraped events ──────────────────────────────────
  // Insert new venues discovered from events; never overwrite existing data.
  const venueMap = new Map<string, { city: string; genres: Set<string> }>();
  for (const row of unique) {
    if (!isValidVenueName(row.venue)) continue;
    const existing = venueMap.get(row.venue);
    if (existing) {
      row.genres.forEach(g => existing.genres.add(g));
    } else {
      venueMap.set(row.venue, { city: row.city, genres: new Set(row.genres) });
    }
  }

  if (venueMap.size > 0) {
    const venueRows = Array.from(venueMap.entries()).map(([name, data]) => ({
      name,
      city:    data.city,
      genres:  Array.from(data.genres),
      address: '',
    }));

    // Insert new venues discovered from events; ignoreDuplicates: true ensures we never overwrite old ones
    console.log(`[orchestrator] found ${venueRows.length} potential venues to sync`);
    
    for (const cityGroup of ['Bucharest', 'Constanta']) {
      const batch = venueRows.filter(v => v.city === cityGroup);
      if (batch.length === 0) continue;
      
      const { data: newVenues, error: ve } = await supabase
        .from('venues')
        .upsert(batch, { onConflict: 'name', ignoreDuplicates: true })
        .select('name');
        
      if (ve) {
        console.warn(`[orchestrator] venue sync error (${cityGroup}): ${ve.message}`);
      } else if (newVenues && newVenues.length > 0) {
        console.log(`[orchestrator] added ${newVenues.length} new ${cityGroup} venues`);
      }
    }
  }

  // ── Global duplicate sweeper ───────────────────────────────────────────────
  // Fetch all upcoming events and manually prune duplicates that survived upsert
  // (e.g. because (title,venue,date,source) is the existing unique constraint)
  const { data: allUpcoming } = await supabase
    .from('events')
    .select('id, title, venue, date, time, source, ticket_url, event_url')
    .gte('date', today);

  if (allUpcoming && allUpcoming.length > 0) {
    // Group by VENUE + DATE first (broad filter)
    const venueDateGroups = new Map<string, any[]>();
    for (const row of allUpcoming) {
      // Use normalizeVenue to ensure different aliases of same venue end up in same bucket
      const vNorm = normalizeVenue(row.venue, row.title);
      const key = `${vNorm}|${row.date}`;
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
        if (s === 'controlclub') return 11; // Always wins for its own venue
        if (s === 'livetickets') return 10;
        if (s === 'ra') return 9;
        if (s === 'eventbook') return 8;
        if (s === 'iabilet') return 7;
        return 1;
      };

      for (const event of eventsAtVenueDate) {
        let addedToCluster = false;
        const normTitle = normalizeForDedupe(event.title);

        for (const cluster of clusters) {
          const leader = cluster[0];
          const leaderTitle = normalizeForDedupe(leader.title);
          
          // Fuzzy match: if titles are nearly identical or one is a significant substring of the other
          // We use 6 chars as a minimum for substring matching to avoid short false positives
          const isRelated = normTitle === leaderTitle || 
                           (normTitle.length > 6 && leaderTitle.includes(normTitle)) ||
                           (leaderTitle.length > 6 && normTitle.includes(leaderTitle)) ||
                           // Prefix match: if both titles share the same first 10+ chars, they're likely the same event
                           (normTitle.length >= 10 && leaderTitle.length >= 10 && normTitle.slice(0, 10) === leaderTitle.slice(0, 10)) ||
                           // URL match: if they point to the exact same ticket listing (e.g. RA event link)
                           (event.ticket_url && leader.ticket_url && event.ticket_url === leader.ticket_url && event.ticket_url.length > 20);

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
          idsToDelete.push(loser.id);
        }

        if (updatedWinner) {
          console.log(`[orchestrator] sweeper: update winner "${winner.title}" (${winner.id})`);
          await supabase.from('events').update({ 
            ticket_url: winner.ticket_url,
            time: winner.time,
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
  }

  // ── Stale-source garbage collection ──────────────────────────────────────────
  // Delete events from active sources whose updated_at predates this run.
  // Exception: never delete SOLD OUT events — they have historical value
  // and may not be re-listed by the source after selling out.
  const activeSourcesWithEvents = results.filter(r => r.count > 0).map(r => r.source);
  for (const src of activeSourcesWithEvents) {
    const { error: staleErr } = await supabase
      .from('events')
      .delete()
      .eq('source', src)
      .lt('updated_at', runStart)
      .neq('price', 'SOLD OUT');  // Preserve SOLD OUT events
    if (staleErr) console.warn(`[orchestrator] stale cleanup error for ${src}:`, staleErr.message);
  }
  const activeCount = activeSourcesWithEvents.length;
  if (activeCount > 0) console.log(`[orchestrator] stale GC: cleaned events from ${activeCount} active source(s)`);

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
