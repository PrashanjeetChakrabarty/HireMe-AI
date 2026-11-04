import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import SeoManager from './SeoManager';

afterEach(cleanup);

const robotsTxt = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../public/robots.txt'), 'utf8');

function visit(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <SeoManager />
    </MemoryRouter>
  );
}

describe('the profile page and search engines', () => {
  it('has its own tab title and is hidden from search engines', () => {
    visit('/profile');

    expect(document.title).toBe('My profile | HireMe AI');
    expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toBe('noindex, nofollow');
  });

  it('is blocked in robots.txt, like the other private pages', () => {
    expect(robotsTxt).toContain('Disallow: /profile');
    expect(robotsTxt).toContain('Disallow: /dashboard');
  });
});
