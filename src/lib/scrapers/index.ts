// ─────────────────────────────────────────────────────────────────────────────
// Scraper orchestrator — runs all sources, deduplicates, and upserts to Supabase
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import { scrapeZilesinopti } from './zilesinopti';
import { scrapeIabilet }    from './iabilet';
import { scrapeOnevent }    from './onevent';
import { scrapeAmbilet }    from './ambilet';
import { scrapeLivetickets } from './livetickets';
import { scrapeRA }         from './ra';
import { ScrapedEvent }     from './types';

type Source = 'zilesinopti' | 'iabilet' | 'onevent' | 'ambilet' | 'livetickets' | 'ra';

interface ScrapeResult {
  source: Source;
  count: number;
  error?: string;
}

export interface FetchSummary {
  total: number;
  upserted: number;
  results: ScrapeResult[];
}

export async function fetchAndUpsertEvents(): Promise<FetchSummary> {
  // Service-role client bypasses RLS for upserts
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const scrapers: [Source, () => Promise<ScrapedEvent[]>][] = [
    ['zilesinopti', scrapeZilesinopti],
    ['iabilet',     scrapeIabilet],
    ['onevent',     scrapeOnevent],
    ['ambilet',     scrapeAmbilet],
    ['livetickets', scrapeLivetickets],
    ['ra',          scrapeRA],
  ];

  // Run all scrapers in parallel; individual failures don't abort others
  const settled = await Promise.allSettled(
    scrapers.map(async ([source, fn]) => {
      const events = await fn();
      return { source, events };
    })
  );

  const results: ScrapeResult[] = [];
  const allRows: Array<ScrapedEvent & { source: Source; city: string }> = [];

  for (const outcome of settled) {
    if (outcome.status === 'rejected') {
      results.push({ source: 'zilesinopti', count: 0, error: String(outcome.reason) });
      continue;
    }
    const { source, events } = outcome.value;
    results.push({ source, count: events.length });
    allRows.push(...events.map(e => ({ ...e, source, city: e.city || 'Bucharest' })));
  }

  // Deduplicate within the batch by (title, venue, date, source)
  const seen = new Set<string>();
  const unique = allRows.filter(row => {
    const key = `${row.title}|${row.venue}|${row.date}|${row.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

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
      city:        row.city,
      updated_at:  new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('events')
      .upsert(chunk, {
        onConflict: 'title,venue,date,source',
        ignoreDuplicates: false,  // update existing rows (e.g., image might change)
      });

    if (error) {
      console.error('[scraper] upsert error:', error.message);
    } else {
      upserted += chunk.length;
    }
  }

  return { total: allRows.length, upserted, results };
}
