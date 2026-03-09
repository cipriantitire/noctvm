/**
 * Venue logo mappings for NOCTVM.
 * Local assets served from /venues/ (pushed to public/venues/).
 * External logos use direct URLs with onError fallback to letter circles.
 */

export const VENUE_LOGOS: Record<string, string> = {
  // -- Local assets (uploaded logos) --
  'Control Club':     '/venues/control.jpg',
  'OXYA Club':        '/venues/oxya.jpg',
  'Club Guesthouse':  '/venues/guesthouse.png',
  'Platforma Wolff':  '/venues/wolff.jpg',
  'Princess Club':    '/venues/princess.jpg',
  'Noar Hall':        '/venues/noar.png',
  'Quantic':          '/venues/quantic.png',

  // -- External URLs (fetched from official sites) --
  'Expirat Halele Carol': 'https://expirat.org/wp-content/uploads/2023/02/Expirat-Fav-1.svg',
  'FOMO Club':            'https://fomoclub.ro/wp-content/themes/fomo-club/assets/images/fomo-by-story.png',
  'Club Mono':            'https://clubmono.ro/wp-content/uploads/2023/11/cropped-MONO-ursulet-cu-scris-3-192x192.png',
  'Interbelic':           'https://static.tildacdn.net/tild6138-6662-4831-b731-633037616266/noroot.png',
  'Fratelli Studios':     'https://fratelli.ro/wp-content/uploads/2025/01/fratelli-new.png',
  'KAYO Club':            'https://kayo.ro/wp-content/uploads/2024/07/kayo-logo-white-600.png',
};

/**
 * Venues that still need a proper logo.
 * Provide images to replace the fallback letter-circles.
 */
export const VENUES_MISSING_LOGOS: string[] = [
  'Maison 64',
  'Nook Club',
  'Forge Bucharest',
  'Beraria H',
  'NJoy Club & Garden',
  'Le Dome',
  'Laminor Arena',
  'Halo Events Center',
  'Oclu Pub',
  'Museum of Immersive New Art (MINA)',
];
