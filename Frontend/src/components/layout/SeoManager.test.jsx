import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import SeoManager from './SeoManager';

const meta = name => document.head.querySelector('meta[name="' + name + '"]')?.getAttribute('content');

function show(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <SeoManager />
    </MemoryRouter>
  );
}

describe('SeoManager', () => {
  it('sets a title and a description for a public page', () => {
    show('/login');
    expect(document.title).toBe('Log in | HireMe AI');
    expect(meta('description')).toBeTruthy();
    expect(meta('robots')).toBe('index, follow');
  });

  it('keeps private pages out of search engines', () => {
    show('/dashboard');
    expect(meta('robots')).toBe('noindex, nofollow');
  });

  it('treats an unknown address as not found', () => {
    show('/nope');
    expect(document.title).toBe('Page not found | HireMe AI');
    expect(meta('robots')).toBe('noindex, nofollow');
  });
});
