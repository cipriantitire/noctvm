import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
interface JsonObject { [key: string]: JsonValue; }

interface EventRow {
  id: string;
  title: string;
  venue: string | null;
  date: string;
  time: string | null;
  source: string;
  city: string;
  price: string | null;
  event_url: string | null;
  ticket_url: string | null;
  updated_at?: string | null;
}

interface SnapshotSummary {
  totalEvents: number;
  byCity: Record<string, number>;
  bySource: Record<string, number>;
  byCitySource: Record<string, number>;
  duplicateGroupCount: number;
  quality: {
    tbaVenueCount: number;
    missingPriceCount: number;
    suspiciousPriceCount: number;
  };
}

interface SnapshotMeta {
  snapshotId: string;
  label: string;
  createdAt: string;
  fromDate: string;
  cwd: string;
  git: {
    branch: string;
    commit: string;
    dirty: boolean;
  };
}

interface DuplicateGroupItem {
  source: string;
  title: string;
  venue: string | null;
  price: string | null;
  time: string | null;
}

interface DuplicateGroup {
  key: string;
  city: string;
  date: string;
  normalizedTitle: string;
  count: number;
  items: DuplicateGroupItem[];
}

interface SnapshotPayload {
  meta: SnapshotMeta;
  summary: SnapshotSummary;
  duplicateGroups: DuplicateGroup[];
  suspiciousPriceSamples: Array<{ title: string; city: string; date: string; source: string; price: string }>;
  events: EventRow[];
}

interface DiffPayload {
  generatedAt: string;
  before: SnapshotMeta;
  after: SnapshotMeta;
  summary: {
    totalBefore: number;
    totalAfter: number;
    totalDelta: number;
    added: number;
    removed: number;
    changed: number;
    duplicateGroupsBefore: number;
    duplicateGroupsAfter: number;
    duplicateGroupsDelta: number;
    tbaVenueBefore: number;
    tbaVenueAfter: number;
    tbaVenueDelta: number;
    missingPriceBefore: number;
    missingPriceAfter: number;
    missingPriceDelta: number;
    suspiciousPriceBefore: number;
    suspiciousPriceAfter: number;
    suspiciousPriceDelta: number;
  };
  deltas: {
    byCity: Array<{ key: string; before: number; after: number; delta: number }>;
    bySource: Array<{ key: string; before: number; after: number; delta: number }>;
    byCitySource: Array<{ key: string; before: number; after: number; delta: number }>;
  };
  samples: {
    added: EventRow[];
    removed: EventRow[];
    changed: Array<{
      key: string;
      changedFields: string[];
      before: Partial<EventRow>;
      after: Partial<EventRow>;
    }>;
  };
}

const AUDIT_DIR = path.join(process.cwd(), 'tmp', 'scraper-audits');
const SELECT_FIELDS = 'id,title,venue,date,time,source,city,price,event_url,ticket_url,updated_at';
const SUSPICIOUS_PRICE_RE = /(^0\d{2,}$)|(\b\d{4,}\b)/i;
const TBA_VENUE_RE = /\b(tba|tbc|to be announced|venue tbc|venue tba)\b/i;

function usage(): never {
  console.error(
    [
      'Usage:',
      '  npx tsx scripts/scraper-audit.ts snapshot [label] [--from=YYYY-MM-DD|today] [--out=path]',
      '  npx tsx scripts/scraper-audit.ts diff <before.json> <after.json> [--out=path]',
      '  npx tsx scripts/scraper-audit.ts diff-latest [--out=path]',
    ].join('\n')
  );
  process.exit(1);
}

function parseArgs(argv: string[]): { command?: string; positionals: string[]; flags: Record<string, string | boolean> } {
  const [command, ...rest] = argv;
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }

    const noPrefix = token.slice(2);
    const eqIndex = noPrefix.indexOf('=');
    if (eqIndex >= 0) {
      const key = noPrefix.slice(0, eqIndex);
      const value = noPrefix.slice(eqIndex + 1);
      flags[key] = value;
      continue;
    }

    const maybeValue = rest[i + 1];
    if (maybeValue && !maybeValue.startsWith('--')) {
      flags[noPrefix] = maybeValue;
      i += 1;
    } else {
      flags[noPrefix] = true;
    }
  }

  return { command, positionals, flags };
}

function safeGit(cmd: string): string {
  try {
    return execSync(cmd, { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'unknown';
  }
}

function loadEnv(): void {
  const localEnv = path.join(process.cwd(), '.env.local');
  const env = path.join(process.cwd(), '.env');
  if (fs.existsSync(localEnv)) dotenv.config({ path: localEnv, override: false });
  if (fs.existsSync(env)) dotenv.config({ path: env, override: false });
}

function normalizeTitle(value: string): string {
  return (value || '')
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sourceSignature(event: EventRow): string {
  return `${event.city}|${event.date}|${normalizeTitle(event.title)}|${event.source}`;
}

function logicalSignature(event: EventRow): string {
  return `${event.city}|${event.date}|${normalizeTitle(event.title)}`;
}

function timestampId(date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
}

function sanitizeLabel(value: string): string {
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return cleaned || 'snapshot';
}

function parseFromDate(fromFlag: string | boolean | undefined): string {
  if (fromFlag === undefined || fromFlag === true) return new Date().toISOString().slice(0, 10);
  if (fromFlag === 'today') return new Date().toISOString().slice(0, 10);
  if (typeof fromFlag === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fromFlag)) return fromFlag;
  throw new Error(`Invalid --from value: ${String(fromFlag)}. Use YYYY-MM-DD or today.`);
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function resolveOutPath(flagOut: string | boolean | undefined, fallbackName: string): string {
  if (typeof flagOut === 'string' && flagOut.trim()) {
    return path.isAbsolute(flagOut) ? flagOut : path.join(process.cwd(), flagOut);
  }
  return path.join(AUDIT_DIR, fallbackName);
}

function countBy<T>(rows: T[], keyFn: (row: T) => string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    const key = keyFn(row) || 'unknown';
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

function sortedRecords(obj: Record<string, number>): Record<string, number> {
  const entries = Object.entries(obj).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return Object.fromEntries(entries);
}

function buildDuplicateGroups(events: EventRow[]): DuplicateGroup[] {
  const map = new Map<string, EventRow[]>();
  for (const event of events) {
    const key = logicalSignature(event);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(event);
  }

  const entries = Array.from(map.entries());

  return entries
    .filter((entry: [string, EventRow[]]) => entry[1].length > 1)
    .map(([key, rows]: [string, EventRow[]]) => {
      const [city, date, normalizedTitle] = key.split('|');
      return {
        key,
        city,
        date,
        normalizedTitle,
        count: rows.length,
        items: rows
          .sort((a: EventRow, b: EventRow) => a.source.localeCompare(b.source))
          .map((row: EventRow) => ({
            source: row.source,
            title: row.title,
            venue: row.venue,
            price: row.price,
            time: row.time,
          })),
      };
    })
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function pickDiff<T extends JsonValue | undefined>(before: T, after: T): boolean {
  return JSON.stringify(before ?? null) !== JSON.stringify(after ?? null);
}

function toDeltaRows(beforeMap: Record<string, number>, afterMap: Record<string, number>): Array<{ key: string; before: number; after: number; delta: number }> {
  const keys = Array.from(new Set<string>([...Object.keys(beforeMap), ...Object.keys(afterMap)]));
  return keys
    .map((key) => {
      const before = beforeMap[key] ?? 0;
      const after = afterMap[key] ?? 0;
      return { key, before, after, delta: after - before };
    })
    .filter((row) => row.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.key.localeCompare(b.key));
}

async function fetchEvents(fromDate: string): Promise<EventRow[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error('Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceRole);
  const pageSize = 1000;
  let start = 0;
  const out: EventRow[] = [];

  for (;;) {
    const { data, error } = await supabase
      .from('events')
      .select(SELECT_FIELDS)
      .gte('date', fromDate)
      .order('date', { ascending: true })
      .range(start, start + pageSize - 1);

    if (error) throw new Error(`Supabase query failed: ${error.message}`);
    if (!data || data.length === 0) break;

    out.push(...(data as EventRow[]));
    if (data.length < pageSize) break;
    start += pageSize;
  }

  return out.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.city !== b.city) return a.city.localeCompare(b.city);
    if (a.source !== b.source) return a.source.localeCompare(b.source);
    return a.title.localeCompare(b.title);
  });
}

function buildSnapshot(events: EventRow[], label: string, fromDate: string): SnapshotPayload {
  const duplicateGroups = buildDuplicateGroups(events);
  const suspiciousPriceSamples = events
    .filter((event) => event.price && SUSPICIOUS_PRICE_RE.test(event.price.trim()))
    .slice(0, 50)
    .map((event) => ({
      title: event.title,
      city: event.city,
      date: event.date,
      source: event.source,
      price: event.price || '',
    }));

  const byCity = sortedRecords(countBy(events, (e) => e.city));
  const bySource = sortedRecords(countBy(events, (e) => e.source));
  const byCitySource = sortedRecords(countBy(events, (e) => `${e.city}::${e.source}`));

  const snapshotId = timestampId();
  const payload: SnapshotPayload = {
    meta: {
      snapshotId,
      label,
      createdAt: new Date().toISOString(),
      fromDate,
      cwd: process.cwd(),
      git: {
        branch: safeGit('git rev-parse --abbrev-ref HEAD'),
        commit: safeGit('git rev-parse HEAD'),
        dirty: safeGit('git status --porcelain').length > 0,
      },
    },
    summary: {
      totalEvents: events.length,
      byCity,
      bySource,
      byCitySource,
      duplicateGroupCount: duplicateGroups.length,
      quality: {
        tbaVenueCount: events.filter((e) => TBA_VENUE_RE.test(e.venue || '')).length,
        missingPriceCount: events.filter((e) => !e.price || !e.price.trim()).length,
        suspiciousPriceCount: events.filter((e) => !!e.price && SUSPICIOUS_PRICE_RE.test(e.price.trim())).length,
      },
    },
    duplicateGroups,
    suspiciousPriceSamples,
    events,
  };

  return payload;
}

function writeJson(filePath: string, payload: JsonValue): void {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function readSnapshot(filePath: string): SnapshotPayload {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) throw new Error(`Snapshot file not found: ${fullPath}`);
  const raw = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(raw) as SnapshotPayload;
}

function buildDiff(before: SnapshotPayload, after: SnapshotPayload): DiffPayload {
  const beforeBySourceSignature = new Map<string, EventRow>(before.events.map((event) => [sourceSignature(event), event]));
  const afterBySourceSignature = new Map<string, EventRow>(after.events.map((event) => [sourceSignature(event), event]));

  const added: EventRow[] = [];
  const removed: EventRow[] = [];
  const changed: Array<{
    key: string;
    changedFields: string[];
    before: Partial<EventRow>;
    after: Partial<EventRow>;
  }> = [];

  const inspectedFields: Array<keyof EventRow> = ['title', 'venue', 'time', 'price', 'event_url', 'ticket_url', 'city', 'date'];

  Array.from(beforeBySourceSignature.entries()).forEach(([key, event]) => {
    const afterEvent = afterBySourceSignature.get(key);
    if (!afterEvent) {
      removed.push(event);
      return;
    }

    const changedFields = inspectedFields.filter((field) => pickDiff(event[field] as JsonValue, afterEvent[field] as JsonValue));
    if (changedFields.length > 0) {
      changed.push({
        key,
        changedFields,
        before: Object.fromEntries(inspectedFields.map((field) => [field, event[field]])) as Partial<EventRow>,
        after: Object.fromEntries(inspectedFields.map((field) => [field, afterEvent[field]])) as Partial<EventRow>,
      });
    }
  });

  Array.from(afterBySourceSignature.entries()).forEach(([key, event]) => {
    if (!beforeBySourceSignature.has(key)) added.push(event);
  });

  const beforeByCity = countBy(before.events, (e) => e.city);
  const afterByCity = countBy(after.events, (e) => e.city);
  const beforeBySource = countBy(before.events, (e) => e.source);
  const afterBySource = countBy(after.events, (e) => e.source);
  const beforeByCitySource = countBy(before.events, (e) => `${e.city}::${e.source}`);
  const afterByCitySource = countBy(after.events, (e) => `${e.city}::${e.source}`);

  return {
    generatedAt: new Date().toISOString(),
    before: before.meta,
    after: after.meta,
    summary: {
      totalBefore: before.summary.totalEvents,
      totalAfter: after.summary.totalEvents,
      totalDelta: after.summary.totalEvents - before.summary.totalEvents,
      added: added.length,
      removed: removed.length,
      changed: changed.length,
      duplicateGroupsBefore: before.summary.duplicateGroupCount,
      duplicateGroupsAfter: after.summary.duplicateGroupCount,
      duplicateGroupsDelta: after.summary.duplicateGroupCount - before.summary.duplicateGroupCount,
      tbaVenueBefore: before.summary.quality.tbaVenueCount,
      tbaVenueAfter: after.summary.quality.tbaVenueCount,
      tbaVenueDelta: after.summary.quality.tbaVenueCount - before.summary.quality.tbaVenueCount,
      missingPriceBefore: before.summary.quality.missingPriceCount,
      missingPriceAfter: after.summary.quality.missingPriceCount,
      missingPriceDelta: after.summary.quality.missingPriceCount - before.summary.quality.missingPriceCount,
      suspiciousPriceBefore: before.summary.quality.suspiciousPriceCount,
      suspiciousPriceAfter: after.summary.quality.suspiciousPriceCount,
      suspiciousPriceDelta: after.summary.quality.suspiciousPriceCount - before.summary.quality.suspiciousPriceCount,
    },
    deltas: {
      byCity: toDeltaRows(beforeByCity, afterByCity),
      bySource: toDeltaRows(beforeBySource, afterBySource),
      byCitySource: toDeltaRows(beforeByCitySource, afterByCitySource),
    },
    samples: {
      added: added.slice(0, 100),
      removed: removed.slice(0, 100),
      changed: changed.slice(0, 100),
    },
  };
}

function resolveSnapshotFile(input: string): string {
  return path.isAbsolute(input) ? input : path.join(process.cwd(), input);
}

function latestSnapshots(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((name) => name.endsWith('.json') && !name.includes('-diff-'))
    .map((name) => path.join(dirPath, name))
    .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
}

async function runSnapshot(positionals: string[], flags: Record<string, string | boolean>): Promise<void> {
  loadEnv();
  const label = sanitizeLabel(positionals[0] || 'snapshot');
  const fromDate = parseFromDate(flags.from);
  const events = await fetchEvents(fromDate);
  const payload = buildSnapshot(events, label, fromDate);
  const fileName = `${payload.meta.snapshotId}-${label}.json`;
  const outPath = resolveOutPath(flags.out, fileName);
  writeJson(outPath, payload as unknown as JsonValue);

  console.log(`[audit] snapshot written: ${outPath}`);
  console.log(`[audit] total=${payload.summary.totalEvents} from=${fromDate}`);
  console.log(`[audit] byCity=${JSON.stringify(payload.summary.byCity)}`);
  console.log(`[audit] bySource=${JSON.stringify(payload.summary.bySource)}`);
  console.log(
    `[audit] quality={tbaVenue:${payload.summary.quality.tbaVenueCount}, missingPrice:${payload.summary.quality.missingPriceCount}, suspiciousPrice:${payload.summary.quality.suspiciousPriceCount}}`
  );
}

function runDiff(positionals: string[], flags: Record<string, string | boolean>): void {
  if (positionals.length < 2) usage();
  const beforePath = resolveSnapshotFile(positionals[0]);
  const afterPath = resolveSnapshotFile(positionals[1]);
  const before = readSnapshot(beforePath);
  const after = readSnapshot(afterPath);
  const diff = buildDiff(before, after);
  const outFallback = `${timestampId()}-diff-${before.meta.snapshotId}-to-${after.meta.snapshotId}.json`;
  const outPath = resolveOutPath(flags.out, outFallback);
  writeJson(outPath, diff as unknown as JsonValue);

  console.log(`[audit] diff written: ${outPath}`);
  console.log(`[audit] totals ${diff.summary.totalBefore} -> ${diff.summary.totalAfter} (delta ${diff.summary.totalDelta})`);
  console.log(`[audit] added=${diff.summary.added} removed=${diff.summary.removed} changed=${diff.summary.changed}`);
  if (diff.deltas.byCity.length > 0) {
    console.log('[audit] top city deltas:', JSON.stringify(diff.deltas.byCity.slice(0, 5)));
  }
  if (diff.deltas.bySource.length > 0) {
    console.log('[audit] top source deltas:', JSON.stringify(diff.deltas.bySource.slice(0, 5)));
  }
}

function runDiffLatest(flags: Record<string, string | boolean>): void {
  const files = latestSnapshots(AUDIT_DIR);
  if (files.length < 2) {
    throw new Error(`Need at least 2 snapshots in ${AUDIT_DIR} to run diff-latest.`);
  }
  const beforePath = files[files.length - 2];
  const afterPath = files[files.length - 1];
  console.log(`[audit] diff-latest using:\n  before: ${beforePath}\n  after : ${afterPath}`);
  runDiff([beforePath, afterPath], flags);
}

async function main(): Promise<void> {
  const { command, positionals, flags } = parseArgs(process.argv.slice(2));

  switch (command) {
    case 'snapshot':
      await runSnapshot(positionals, flags);
      return;
    case 'diff':
      runDiff(positionals, flags);
      return;
    case 'diff-latest':
      runDiffLatest(flags);
      return;
    default:
      usage();
  }
}

main().catch((error) => {
  console.error(`[audit] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
