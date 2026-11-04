import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import ConsentCheckbox from './ConsentCheckbox';

afterEach(cleanup);

describe('ConsentCheckbox', () => {
  it('links to the terms and to the privacy policy', () => {
    render(
      <MemoryRouter>
        <ConsentCheckbox checked={false} onChange={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Terms of Service' }).getAttribute('href')).toBe('/terms');
    expect(screen.getByRole('link', { name: 'Privacy Policy' }).getAttribute('href')).toBe('/privacy');
  });

  it('reports the new value when it is ticked', () => {
    const calls = [];
    render(
      <MemoryRouter>
        <ConsentCheckbox checked={false} onChange={(value) => calls.push(value)} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(calls).toEqual([true]);
  });
});
