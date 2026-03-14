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

const NON_MUSIC_TERMS = [
  'workshop', 'curs', 'conference', 'conferinta', 'teatru', 'theatre', 'play', 'piesa teatru', 
  'kids', 'copii', 'targ', 'expo', 'fair', 'exhibition', 'business', 'seminar',
  'comedy', 'stand-up', 'standup', 'stand up', 'yoga', 'wellness', 'gastronomy', 'food',
  'cinema', 'film', 'movie', 'sport', 'atletism', 'maraton', 'match', 'meci', 'fotbal',
  'culinary', 'cooking', 'tasting', 'degustari', 'vernissage', 'vernisaj', 'lectura',
  'educational', 'training', 'prezentare', 'lansare carte', 'book launch', 'reprezentatie',
  'spectacol teatru', 'actori:', 'regia:', 'distributia:', 'conferința', 'simulare', 'cambridge',
  'atelier', 'personală', 'dezvoltare', 'cursuri', 'clasa a', 'evaluare', 'păpuși', 'marionete', 'spectacol copii'
];

/** Guess genres from title/desc. Returns null if definitively non-music. */
export function guessGenres(title: string, desc: string): string[] | null {
  // Normalize stylized unicode characters (like bold 𝐓𝐚𝐤𝐞 𝐌𝐞 𝐇𝐨𝐦𝐞)
  const normTitle = (title || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const t = (normTitle + ' ' + desc).toLowerCase();
  
  // Hard filter for definitely non-music
  if (NON_MUSIC_TERMS.some(term => t.includes(term))) {
    // Exception: if it also has strong music terms (concert, festival), maybe it's okay
    const strongMusic = ['festival', 'concert', 'live', 'dj set', 'rave'];
    if (!strongMusic.some(sm => t.includes(sm))) return null;
  }

  const found = new Set<string>();
  const mapping: Record<string, string[]> = {
    'Techno': ['techno', 'dark techno', 'industrial'],
    'House': ['house', 'deep house', 'tech house', 'progressive house'],
    'Electronic': ['electronic', 'electronica', 'synth', 'modular'],
    'Minimal': ['minimal', 'microhouse', 'rominimal'],
    'Hip-Hop': ['hiphop', 'hip-hop', 'rap', 'trap'],
    'Jazz': ['jazz', 'blues'],
    'Rock': ['rock', 'alternative', 'indie', 'punk'],
    'Metal': ['metal', 'hardcore', 'doom', 'sludge'],
    'Drum & Bass': ['dnb', 'drum and bass', 'drum & bass', 'jungle'],
    'Live Music': ['live band', 'concert', 'live music', 'lansare album'],
    'Disco': ['disco', 'nu-disco', '80s', '90s'],
    'Party': ['party', 'clubbing', 'nightlife', 'dancing', 'club'],
  };

  for (const [genre, keywords] of Object.entries(mapping)) {
    if (keywords.some(k => t.includes(k))) found.add(genre);
  }

  if (found.size === 0) {
    // If it mentions party/night/club but no genre found, it's probably Electronic or general Party
    if (/party|club|night|rave|dance|dancing|discote/.test(t)) {
      found.add('Electronic');
    } else {
      // If we found NO music terms at all and it didn't even match "Party", definitively non-music
      return null;
    }
  }
  
  // Final check: if it has non-music terms AND No strong music headers, discard
  if (NON_MUSIC_TERMS.some(term => t.includes(term))) {
    const strongMusic = ['festival', 'concert', 'live', 'dj set', 'rave', 'party', 'techno', 'house'];
    if (!strongMusic.some(sm => t.includes(sm))) return null;
  }

  return Array.from(found);
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
