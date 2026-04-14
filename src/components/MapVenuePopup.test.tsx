import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Venue, NoctEvent } from '@/lib/types';
import MapVenuePopup from '@/components/MapVenuePopup';

vi.mock('next/image', () => ({
  default: ({ fill, unoptimized, ...props }: any) => <img {...props} />,
}));

const venue: Venue = {
  id: 'venue-1',
  name: 'Control Club',
  address: 'Str. Constantin Mille 4, Bucharest',
  genres: ['Techno', 'House'],
  capacity: 450,
  rating: 4.8,
  review_count: 128,
  description: 'An underground club with late-night programming and a tight crowd.',
  followers: 1834,
  city: 'Bucharest',
  lat: 44.4321,
  lng: 26.1023,
  badge: 'verified',
  is_verified: true,
  featured: true,
  view_count: 0,
  save_count: 0,
};

const firstEvent: NoctEvent = {
  id: 'event-1',
  source: 'manual',
  title: 'Midnight Frequency',
  venue: 'Control Club',
  date: '2026-04-14',
  time: '23:00',
  description: 'A dense club night built around long-form techno sets.',
  image_url: '',
  event_url: '',
  genres: ['Techno', 'Minimal'],
  price: null,
};

const secondEvent: NoctEvent = {
  id: 'event-2',
  source: 'manual',
  title: 'Basement Ritual',
  venue: 'Control Club',
  date: '2026-04-14',
  time: '01:00',
  description: 'A second late-night set.',
  image_url: '',
  event_url: '',
  genres: ['House'],
  price: null,
};

describe('MapVenuePopup', () => {
  it('renders a compact venue popup with multiple events', () => {
    const onEventClick = vi.fn();

    render(
      <MapVenuePopup
        venue={venue}
        isEventsMode
        events={[firstEvent, secondEvent]}
        eventCount={2}
        onEventClick={onEventClick}
      />
    );

    expect(screen.getByText('Control Club')).toBeInTheDocument();
    expect(screen.getByText('Str. Constantin Mille 4, Bucharest')).toBeInTheDocument();
    expect(screen.getByText('Midnight Frequency')).toBeInTheDocument();
    expect(screen.getByText('Basement Ritual')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open event midnight frequency/i }));

    expect(onEventClick).toHaveBeenCalledWith(firstEvent);
  });
});