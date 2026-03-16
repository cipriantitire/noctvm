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
import { ScrapedEvent }       from './types';
import { isValidVenueName }  from './utils';

type Source = 'zilesinopti' | 'iabilet' | 'onevent' | 'ambilet' | 'livetickets' | 'ra' | 'eventbook';

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
  // Constanta venue duplicates
  'club phoenix, constanta': 'Club Phoenix',
  'phoenix':                 'Club Phoenix',
  'nuba club':               'Nuba Beach Club',
  // Restaurant Dorna — strip HTML entities / bullet variants
  'restaurant dorna mamaia &bull; zile și nopți': 'Restaurant Dorna Mamaia',
  'restaurant dorna mamaia • zile și nopți':      'Restaurant Dorna Mamaia',
  'restaurant dorna mamaia • zile si nopti':      'Restaurant Dorna Mamaia',
};

// Event-title–aware overrides: if (title pattern) + wrong venue → correct venue.
// Applied AFTER the simple alias map.
const VENUE_TITLE_OVERRIDES: Array<{ titlePattern: RegExp; wrongVenue: RegExp; correctVenue: string }> = [
  // Blaze (Japonia) and similar Japanese/Asian acts are at Encore Club, not Control Club
  { titlePattern: /japonia|japan|encore/i,  wrongVenue: /sala luceafarul|control club/i, correctVenue: 'Encore Club' },
  // "ctrl LIVE: ..." series events are at Control Club
  { titlePattern: /^ctrl\s+live/i, wrongVenue: /venue tbc/i, correctVenue: 'Control Club' },
];

/** Normalise a scraped venue name to its canonical form. */
function normalizeVenue(venueName: string, eventTitle: string): string {
  const lower = venueName.toLowerCase().trim();
  // Simple alias lookup
  const alias = VENUE_ALIASES[lower];
  const base = alias ?? venueName;

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
];

export async function fetchAndUpsertEvents(): Promise<FetchSummary> {
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

  // Run all scrapers concurrently; individual failures do not abort others
  const settled = await Promise.allSettled(
    SCRAPERS.map(async ([source, fn]) => {
      const sourceSettings = settingsMap.get(source) || {};
      const events = await fn(sourceSettings);
      return { source, events };
    }),
  );

  const results: ScrapeResult[] = [];
  const allRows: Array<ScrapedEvent & { source: Source; city: string }> = [];

  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i];
    const source = SCRAPERS[i][0]; // use index to correctly map source even on failure

    if (outcome.status === 'rejected') {
      console.error(`[orchestrator] ${source} failed:`, outcome.reason);
      results.push({ source, count: 0, error: String(outcome.reason) });
      continue;
    }

    const { events } = outcome.value;
    results.push({ source, count: events.length });
    allRows.push(...events.map(e => ({ ...e, source, city: e.city || 'Bucharest' })));
  }

  // ── Apply venue normalisation before deduplication ───────────────────────
  for (const row of allRows) {
    row.venue = normalizeVenue(row.venue, row.title);
  }

  function normalizeForDedupe(s: string): string {
    return s.toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b\d{1,2}[\/\-\.]\d{1,2}([\/\-\.]\d{2,4})?\b/g, ' ') // strip dates like 21.03, 21-03, 21/03
      .replace(/[|:;,\-.@()[\]{}/\\_]/g, ' ') // More aggressive punctuation stripping
      .replace(/\b(gh|pw|platforma wolff|control|quantic|expro|expanse)\b/g, '') // strip common venue prefix shortcuts from comparison
      .replace(/\s+/g, ' ')
      .trim();
  }

  type DedupeRow = ScrapedEvent & { source: Source; city: string };

  // Deduplicate within the batch by fuzzy (title, venue, date)
  // Logic: Group by fuzzy key, then pick the best one and merge ticket_url
  const groups = new Map<string, DedupeRow[]>();
  for (const row of allRows) {
    const key = `${normalizeForDedupe(row.title)}|${normalizeForDedupe(row.venue)}|${row.date}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const unique: DedupeRow[] = [];
  for (const group of Array.from(groups.values())) {
    // Sort by source priority (ra is best, then iabilet, livetickets, onevent, etc)
    const priority = (s: string) => {
      if (s === 'ra') return 10;
      if (s === 'iabilet') return 8;
      if (s === 'livetickets') return 7;
      if (s === 'eventbook') return 6;
      if (s === 'ambilet') return 5;
      return 1;
    };
    group.sort((a: DedupeRow, b: DedupeRow) => priority(b.source) - priority(a.source));

    const best: DedupeRow = { ...group[0] };
    
    // Merge ticket_url from any other source in the group if the best one doesn't have it
    // or if the best one is RA (which uses ticket_url for external providers anyway)
    for (let i = 1; i < group.length; i++) {
      const other = group[i];
      if (!best.ticket_url && other.ticket_url) {
        best.ticket_url = other.ticket_url;
      }
      // If we have an RA event and a LiveTickets event, ensure the LiveTickets link
      // ends up in ticket_url if it's not already there.
      if (best.source === 'ra' && other.source !== 'ra' && !best.ticket_url) {
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
        onConflict: 'title,venue,date',
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
    .select('id, title, venue, date, source, ticket_url, event_url')
    .gte('date', today);

  if (allUpcoming && allUpcoming.length > 0) {
    const sweepGroups = new Map<string, any[]>();
    for (const row of allUpcoming) {
      const key = `${normalizeForDedupe(row.title)}|${normalizeForDedupe(row.venue)}|${row.date}`;
      if (!sweepGroups.has(key)) sweepGroups.set(key, []);
      sweepGroups.get(key)!.push(row);
    }

    const idsToDelete: string[] = [];
    for (const group of Array.from(sweepGroups.values())) {
      if (group.length <= 1) continue;

      const priority = (s: string) => {
        if (s === 'ra') return 10;
        if (s === 'iabilet') return 8;
        if (s === 'livetickets') return 7;
        if (s === 'eventbook') return 6;
        if (s === 'ambilet') return 5;
        return 1;
      };
      group.sort((a, b) => priority(b.source) - priority(a.source));

      const winner = group[0];
      const losers = group.slice(1);

      // Merge valuable links into winner if winner is missing them
      let updatedWinner = false;
      for (const loser of losers) {
        if (!winner.ticket_url && loser.ticket_url) {
          winner.ticket_url = loser.ticket_url;
          updatedWinner = true;
        }
        // If loser has a better source (e.g. RA) but winner is already RA, no need.
        // But if winner is Iabilet and loser is RA, they should have been swapped by sort.
        idsToDelete.push(loser.id);
      }

      if (updatedWinner) {
        console.log(`[orchestrator] updated winner ${winner.id} withmerged ticket_url`);
        await supabase.from('events').update({ 
          ticket_url: winner.ticket_url,
          updated_at: new Date().toISOString()
        }).eq('id', winner.id);
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
  const activeSourcesWithEvents = results.filter(r => r.count > 0).map(r => r.source);
  for (const src of activeSourcesWithEvents) {
    const { error: staleErr } = await supabase
      .from('events')
      .delete()
      .eq('source', src)
      .lt('updated_at', runStart);
    if (staleErr) console.warn(`[orchestrator] stale cleanup error for ${src}:`, staleErr.message);
  }
  const activeCount = activeSourcesWithEvents.length;
  if (activeCount > 0) console.log(`[orchestrator] stale GC: cleaned events from ${activeCount} active source(s)`);

  const total = unique.length;
  console.log(`[orchestrator] done — ${total} unique events, ${upserted} upserted`);
  results.forEach(r =>
    console.log(`  ${r.source}: ${r.count} events${r.error ? ` (ERROR: ${r.error})` : ''}`),
  );

  return { total, upserted, skipped_venues, results };
}
