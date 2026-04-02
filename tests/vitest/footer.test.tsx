// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Footer from '@/components/Footer';

describe('Footer', () => {
  it('centers the identity row and reserves extra bottom space for floating widgets on small screens', () => {
    const { container } = render(<Footer />);

    const footer = container.querySelector('footer');
    expect(footer?.className ?? '').toContain('pb-28');
    expect(footer?.className ?? '').toContain('md:pb-16');

    const homeLink = screen.getByRole('link', { name: 'Zomer Gregorio' });
    const identityRow = homeLink.closest('div');
    expect(identityRow?.className ?? '').toContain('text-center');

    const socialsLink = screen.getByRole('link', { name: /github/i });
    const socialsRow = socialsLink.parentElement;
    expect(socialsRow?.className ?? '').toContain('justify-center');

    const bottomRow = homeLink.closest('div')?.parentElement;
    expect(bottomRow?.className ?? '').toContain('items-center');
    expect(bottomRow?.className ?? '').toContain('justify-center');
  });
});
