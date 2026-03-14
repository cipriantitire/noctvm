// ─────────────────────────────────────────────────────────────────────────────
// Shared scraper utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Extract all JSON-LD blocks from raw HTML. */
export function extractJsonLd(html: string): unknown[] {
  const results: unknown[] = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) results.push(...parsed);
      else results.push(parsed);
    } catch {
      // malformed JSON-LD — skip
    }
  }
  return results;
}

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

  // ISO-ish: 2026-03-15 or 2026-03-15T20:00:00
  const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  // European numeric: 15.03.2026 or 15/03/2026
  const euNumeric = raw.match(/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/);
  if (euNumeric) {
    const [, d, m, y] = euNumeric;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Romanian text: "15 Martie 2026" or "15 mar 2026"
  const roText = raw.toLowerCase().match(/(\d{1,2})\s+([a-zăîâșț]+)\.?\s+(\d{4})/);
  if (roText) {
    const [, day, monthStr, year] = roText;
    const monthNum = RO_MONTHS[monthStr] ?? RO_MONTHS[monthStr.slice(0, 3)];
    if (monthNum) return `${year}-${monthNum}-${day.padStart(2, '0')}`;
  }

  // Fallback: native Date (handles many formats)
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch {
    // unparseable
  }

  return null;
}

/** Extract HH:MM from an ISO datetime string. */
export function extractTime(iso: string): string | null {
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : null;
}

/** Collapse whitespace and trim. */
export function clean(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

/** Infer likely genres from title + description text. */
export function guessGenres(title: string, desc: string): string[] {
  const text = `${title} ${desc}`.toLowerCase();
  const genres: string[] = [];

  if (/techno/.test(text))                     genres.push('Techno');
  if (/\bhouse\b/.test(text))                  genres.push('House');
  if (/deep house/.test(text))                 genres.push('Deep House');
  if (/minimal/.test(text))                    genres.push('Minimal');
  if (/hip.?hop|rap\b/.test(text))             genres.push('Hip-Hop');
  if (/drum.?n.?bass|dnb/.test(text))          genres.push('Drum & Bass');
  if (/latin|reggaeton|salsa|merengue/.test(text)) genres.push('Latin');
  if (/reggae/.test(text))                     genres.push('Reggae');
  if (/experimental/.test(text))               genres.push('Experimental');
  if (/acid/.test(text))                       genres.push('Acid');
  if (/\bebm\b/.test(text))                    genres.push('EBM');
  if (/hard\s?dance|hardcore/.test(text))      genres.push('Hard Dance');
  if (/bass/.test(text))                       genres.push('Bass Music');
  if (/live|concert|band/.test(text))          genres.push('Live Music');
  if (/underground/.test(text))                genres.push('Underground');
  if (/electronic|electro/.test(text))         genres.push('Electronic');
  if (/club|party|petrecere/.test(text))       genres.push('Club');

  if (genres.length === 0) genres.push('Electronic');
  return Array.from(new Set(genres));
}

/** Fetch HTML with a browser-like User-Agent and a timeout. */
export async function fetchHtml(url: string, timeoutMs = 8_000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NOCTVM-scraper/1.0)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ro,en;q=0.9',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}
