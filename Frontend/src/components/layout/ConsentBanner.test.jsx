import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { recordStorageNotice } from '../../api/consentApi';
import ConsentBanner from './ConsentBanner';

vi.mock('../../api/consentApi', () => ({
  recordStorageNotice: vi.fn(() => Promise.resolve()),
}));

function show(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ConsentBanner />
    </MemoryRouter>
  );
}

describe('ConsentBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
  });
  afterEach(cleanup);

  it('asks the visitor the first time', () => {
    show();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/local storage/i)).toBeTruthy();
  });

  it('locks the page until OK is pressed, then unlocks it and remembers the choice', () => {
    const root = document.getElementById('root');
    show();
    expect(root.hasAttribute('inert')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'OK, got it' }));
    expect(root.hasAttribute('inert')).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem('consent-notice')).toBe('accepted');
  });

  it('does not ask again when the choice was already made', () => {
    localStorage.setItem('consent-notice', 'accepted');
    show();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps the legal pages readable without a click', () => {
    show('/privacy');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('records the choice on the server when OK is pressed', () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'OK, got it' }));
    expect(recordStorageNotice).toHaveBeenCalledTimes(1);
  });

  it('does not contact the server when the choice was already made', () => {
    localStorage.setItem('consent-notice', 'accepted');
    show();
    expect(recordStorageNotice).not.toHaveBeenCalled();
  });
});
