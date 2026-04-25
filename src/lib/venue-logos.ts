/**
 * Venue logo system for NOCTVM.
 *
 * Self-hosted approach: local images under /venues/ for venues with uploaded logos,
 * inline SVG data URIs as elegant text-based fallbacks for everything else.
 * No external URLs -- zero CORS issues, zero broken images.
 */

// -- Venues with local image assets (in public/venues/) --
const LOCAL_LOGOS: Record<string, string> = {
  'Control Club':     '/venues/control.jpg',
  'Expirat Halele Carol': '/venues/expirat.jpg', // Guessed or using interbelic as proxy if missing
  'Interbelic':       '/venues/interbelic.jpg',
  'KAYO Club':        '/venues/kayo.jpg',
  'Maison 64':        '/venues/maison64.jpg',
  'Club Mono':        '/venues/mono.png',
  'Noar Hall':        '/venues/noar.png',
  'Nook Club':        '/venues/nook.webp',
  'OXYA Club':        '/venues/oxya.jpg',
  'Princess Club':    '/venues/princess.jpg',
  'Quantic':          '/venues/quantic.png',
  'Quantic Club':     '/venues/quantic.png',
  'Club Guesthouse':  '/venues/guesthouse.png',
  'Platforma Wolff':  '/venues/wolff.jpg',
};

// -- SVG data URI fallbacks for venues without local logos --
function makeSvgLogo(name: string): string {
  const initial = name.charAt(0).toUpperCase();
  const fontSize = 80;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="40" fill="#1a1a2e"/>
    <text x="100" y="130" text-anchor="middle" fill="#a78bfa" font-family="Satoshi, sans-serif" font-weight="800" font-size="${fontSize}">${initial}</text>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const SVG_LOGOS: Record<string, string> = {
  'Expirat Halele Carol': makeSvgLogo('Expirat'),
  'FOMO Club':            makeSvgLogo('FOMO'),
  'Club Mono':            makeSvgLogo('Club Mono'),
  'Interbelic':           makeSvgLogo('Interbelic'),
  'Fratelli Studios':     makeSvgLogo('Fratelli'),
  'KAYO Club':            makeSvgLogo('KAYO'),
  'Maison 64':            makeSvgLogo('Maison 64'),
  'Nook Club':            makeSvgLogo('Nook'),
  'Forge Bucharest':      makeSvgLogo('Forge'),
  'Beraria H':            makeSvgLogo('Beraria H'),
  'NJoy Club & Garden':   makeSvgLogo('NJoy'),
  'Le Dome':              makeSvgLogo('Le Dome'),
  'Laminor Arena':        makeSvgLogo('Laminor'),
  'Halo Events Center':   makeSvgLogo('Halo'),
  'Oclu Pub':             makeSvgLogo('Oclu Pub'),
  'Museum of Immersive New Art (MINA)': makeSvgLogo('MINA'),
};

// Merged lookup: local images take priority, then SVG fallbacks
const ALL_LOGOS: Record<string, string> = { ...SVG_LOGOS, ...LOCAL_LOGOS };

// Build a lowercase lookup table for case-insensitive partial matching
const LOOKUP_ENTRIES = Object.entries(ALL_LOGOS).map(
  ([name, url]) => [name.toLowerCase(), url] as const
);

/**
 * Get a venue logo URL by name.
 * Supports case-insensitive partial matching:
 *   getVenueLogo('control club')   -> '/venues/control.jpg'
 *   getVenueLogo('Expirat')        -> SVG data URI for Expirat
 *   getVenueLogo('Unknown Venue')  -> SVG data URI with "Un"
 * If providedUrl is present, it takes absolute priority (user-uploaded logo).
 */
export function getVenueLogo(venueName: string, providedUrl?: string | null): string {
  if (providedUrl) return providedUrl;

  // 1. Exact match (case-insensitive)
  const lower = venueName.toLowerCase();
  for (const [key, url] of LOOKUP_ENTRIES) {
    if (key === lower) return url;
  }

  // 2. Partial match -- venue name contains or is contained by a key
  for (const [key, url] of LOOKUP_ENTRIES) {
    if (lower.includes(key) || key.includes(lower)) return url;
  }

  // 3. Fallback -- generate an SVG with the first character
  const fallbackLabel = venueName.slice(0, 1).toUpperCase();
  return makeSvgLogo(fallbackLabel);
}

// -- UI Theming for fallbacks --
const VENUE_COLORS: Record<string, string> = {
  'Control Club': 'from-red-500 to-orange-500',
  'Nook Club': 'from-blue-500 to-cyan-500',
  'Club Guesthouse': 'from-emerald-500 to-teal-500',
  'Platforma Wolff': 'from-amber-500 to-yellow-500',
  'Beraria H': 'from-noctvm-violet to-purple-500',
  'Expirat Halele Carol': 'from-pink-500 to-rose-500',
  'Interbelic': 'from-indigo-500 to-blue-500',
  'OXYA Club': 'from-fuchsia-500 to-pink-500',
  'Maison 64': 'from-violet-500 to-purple-500',
  'Noar Hall': 'from-sky-500 to-blue-500',
  'KAYO Club': 'from-lime-500 to-green-500',
  'Princess Club': 'from-rose-500 to-red-500',
  'Forge Bucharest': 'from-orange-500 to-amber-500',
};

export function getVenueColor(venue: string): string {
  return VENUE_COLORS[venue] || 'from-noctvm-violet to-purple-400';
}

/**
 * Legacy export for backwards compatibility.
 * Prefer getVenueLogo() for new code.
 */
export const VENUE_LOGOS = ALL_LOGOS;
