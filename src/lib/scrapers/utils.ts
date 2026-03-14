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
      let content = match[1].trim();
      // Remove CDATA tags if present
      content = content.replace(/\/\*<!\[CDATA\[\*\//g, '').replace(/\/\*\]\]>\*\//g, '');
      content = content.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '');
      
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        results.push(...parsed);
      } else if (parsed && typeof parsed === 'object' && '@graph' in parsed && Array.isArray(parsed['@graph'])) {
        results.push(...(parsed['@graph'] as unknown[]));
      } else {
        results.push(parsed);
      }
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
  const currentYear = '2026';

  // ISO-like: 2026-03-15 or 2026-3-15 or 2026-3-1
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // European numeric: 15.03.2026 or 15/03/2026
  const euNumeric = raw.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/);
  if (euNumeric) {
    const [, d, m, y] = euNumeric;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Short numeric: 14/03 or 14.03 -> 2026-03-14
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
      const targetYear = year || currentYear;
      return `${targetYear}-${monthNum}-${day.padStart(2, '0')}`;
    }
  }

  // Fallback: native Date
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch { /* skip */ }

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'ro,en;q=0.9,en-US;q=0.8',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}
