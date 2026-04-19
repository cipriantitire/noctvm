import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BottomNav from '@/components/BottomNav';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
  }),
}));

vi.mock('@/components/ui/BottomNav', () => ({
  default: ({ items }: { items: Array<{ id: string; label: string }> }) => (
    <nav aria-label="Mock bottom navigation">
      {items.map((item) => (
        <button key={item.id} type="button">
          {item.label}
        </button>
      ))}
    </nav>
  ),
}));

describe('BottomNav', () => {
  it('keeps navbar navigation available through tablet widths until the desktop sidebar breakpoint', () => {
    const { container } = render(<BottomNav activeTab="events" onTabChange={vi.fn()} />);
    const wrapper = container.firstElementChild;

    expect(wrapper).toHaveClass('lg:hidden');
    expect(wrapper).not.toHaveClass('md:hidden');
    expect(screen.getByRole('button', { name: 'Events' })).toBeInTheDocument();
  });
});
