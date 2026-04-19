import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NoctEvent } from '@/lib/types';
import EventModal from '@/components/EventModal';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
  }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      then: vi.fn(),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

const baseEvent: NoctEvent = {
  id: 'event-1',
  source: 'ra',
  title: 'AFRO VIBES VOL.39',
  venue: 'Control Club',
  date: '2026-04-24',
  time: '23:00',
  description: 'A focused club night.',
  image_url: '/images/event-fallback.png',
  event_url: 'https://ra.co/events/123',
  ticket_url: 'https://tickets.example.com/afro-vibes',
  genres: ['Afro House', 'Electronic'],
  price: '50 RON',
};

function renderModal(event: Partial<NoctEvent> = {}) {
  return render(
    <EventModal
      event={{ ...baseEvent, ...event }}
      onClose={vi.fn()}
      onOpenAuth={vi.fn()}
      onVenueClick={vi.fn()}
    />,
  );
}

function setDescriptionMetrics({ clientHeight, scrollHeight }: { clientHeight: number; scrollHeight: number }) {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return clientHeight;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get() {
      return scrollHeight;
    },
  });
}

describe('EventModal', () => {
  beforeEach(() => {
    setDescriptionMetrics({ clientHeight: 120, scrollHeight: 120 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders a secondary source event page action when it differs from the ticket CTA', () => {
    renderModal();

    const ticketLink = screen.getByRole('link', { name: /get tickets on/i });
    expect(ticketLink).toHaveAttribute('href', 'https://tickets.example.com/afro-vibes');

    const sourceLink = screen.getByRole('link', { name: /view event on resident advisor/i });
    expect(sourceLink).toHaveAttribute('href', 'https://ra.co/events/123');
    expect(sourceLink.compareDocumentPosition(ticketLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText(/^opens\s+/i)).not.toBeInTheDocument();
  });

  it('does not render a duplicate source action when the source URL is the ticket CTA', () => {
    renderModal({
      ticket_url: 'https://ra.co/events/123',
    });

    expect(screen.getByRole('link', { name: /get tickets on/i })).toHaveAttribute('href', 'https://ra.co/events/123');
    expect(screen.queryByRole('link', { name: /view event on/i })).not.toBeInTheDocument();
  });

  it('cleans leading scrape artifacts and decodes common HTML entities in the description', () => {
    renderModal({
      description: '?? AFRO VIBES VOL.39 &ndash; all-night session &amp; guests',
    });

    expect(screen.getByText('AFRO VIBES VOL.39 - all-night session & guests')).toBeInTheDocument();
    expect(screen.queryByText(/\?\? AFRO VIBES/)).not.toBeInTheDocument();
  });

  it('does not show the description toggle when rendered text does not overflow', async () => {
    setDescriptionMetrics({ clientHeight: 160, scrollHeight: 160 });
    renderModal({
      description: 'A long source description that still fits inside the available modal description space.'.repeat(20),
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
    });
  });

  it('shows more and less controls when the rendered description overflows', async () => {
    setDescriptionMetrics({ clientHeight: 120, scrollHeight: 320 });
    renderModal({
      description: 'Short but visually overflowing description.',
    });

    const showMore = await screen.findByRole('button', { name: /show more/i });
    fireEvent.click(showMore);

    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
  });

  it('shows at most three genre badges on the hero image', () => {
    renderModal({
      genres: ['Afro', 'House', 'Techno', 'Disco'],
    });

    expect(screen.getByText('Afro')).toBeInTheDocument();
    expect(screen.getByText('House')).toBeInTheDocument();
    expect(screen.getByText('Techno')).toBeInTheDocument();
    expect(screen.queryByText('Disco')).not.toBeInTheDocument();
  });
});
