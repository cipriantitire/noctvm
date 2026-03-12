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
  'OXYA Club':        '/venues/oxya.jpg',
  'Club Guesthouse':  '/venues/guesthouse.png',
  'Platforma Wolff':  '/venues/wolff.jpg',
  'Princess Club':    '/venues/princess.jpg',
  'Noar Hall':        '/venues/noar.png',
  'Quantic':          '/venues/quantic.png',
};

// -- SVG data URI fallbacks for venues without local logos --
function makeSvgLogo(label: string): string {
  // Split long names into two lines if needed
  const maxLineLen = 14;
  let line1 = label;
  let line2 = '';

  if (label.length > maxLineLen) {
    const words = label.split(' ');
    line1 = '';
    line2 = '';
    let onLine1 = true;
    for (const word of words) {
      if (onLine1 && (line1 + ' ' + word).trim().length <= maxLineLen) {
        line1 = (line1 + ' ' + word).trim();
      } else {
        onLine1 = false;
        line2 = (line2 + ' ' + word).trim();
      }
    }
  }

  const fontSize = label.length > 12 ? 18 : label.length > 8 ? 20 : 24;

  const svg = line2
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">`
      + `<rect width="200" height="200" rx="16" fill="#1a1a2e"/>`
      + `<text x="100" y="92" text-anchor="middle" fill="#a78bfa" font-family="system-ui,sans-serif" font-weight="700" font-size="${fontSize}">${line1}</text>`
      + `<text x="100" y="${92 + fontSize + 4}" text-anchor="middle" fill="#a78bfa" font-family="system-ui,sans-serif" font-weight="700" font-size="${fontSize}">${line2}</text>`
      + `</svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">`
      + `<rect width="200" height="200" rx="16" fill="#1a1a2e"/>`
      + `<text x="100" y="108" text-anchor="middle" fill="#a78bfa" font-family="system-ui,sans-serif" font-weight="700" font-size="${fontSize}">${line1}</text>`
      + `</svg>`;

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
 */
export function getVenueLogo(venueName: string): string {
  // 1. Exact match (case-insensitive)
  const lower = venueName.toLowerCase();
  for (const [key, url] of LOOKUP_ENTRIES) {
    if (key === lower) return url;
  }

  // 2. Partial match -- venue name contains or is contained by a key
  for (const [key, url] of LOOKUP_ENTRIES) {
    if (lower.includes(key) || key.includes(lower)) return url;
  }

  // 3. Fallback -- generate an SVG with the first 2 characters
  const fallbackLabel = venueName.slice(0, 2).toUpperCase();
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
