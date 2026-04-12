import { NoctEvent, Venue } from './types';

function normalizeVenueName(name: string | null | undefined): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(?:constanta|bucuresti|bucharest|romania|club|lounge|bar)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasCoordinates(venue: Venue): boolean {
  return venue.lat !== null && venue.lng !== null;
}

function resolveVenueForEvent(event: NoctEvent, venues: Venue[]): Venue | null {
  const eventKey = normalizeVenueName(event.venue);
  if (!eventKey) return null;

  const exact = venues.find(venue => normalizeVenueName(venue.name) === eventKey && hasCoordinates(venue));
  if (exact) return exact;

  const fuzzy = venues.find((venue) => {
    if (!hasCoordinates(venue)) return false;
    const venueKey = normalizeVenueName(venue.name);
    if (!venueKey) return false;
    return venueKey.includes(eventKey) || eventKey.includes(venueKey);
  });
  if (fuzzy) return fuzzy;

  const aliases: Record<string, string[]> = {
    'pavilionul expozitional': ['exhibitions pavilion'],
  };

  const aliasKeys = aliases[eventKey] || [];
  return venues.find((venue) => {
    if (!hasCoordinates(venue)) return false;
    const venueKey = normalizeVenueName(venue.name);
    return aliasKeys.some(alias => venueKey === alias || venueKey.includes(alias));
  }) || null;
}

export function buildMapVenuesForEvents(events: NoctEvent[], venues: Venue[]): Venue[] {
  const mapVenues = new Map<string, Venue>();

  for (const event of events) {
    const matchedVenue = resolveVenueForEvent(event, venues);
    if (!matchedVenue) continue;

    mapVenues.set(event.venue, {
      ...matchedVenue,
      id: `${matchedVenue.id}:${event.venue}`,
      name: event.venue,
    });
  }

  return Array.from(mapVenues.values());
}
