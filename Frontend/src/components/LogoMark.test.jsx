import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import * as I from '../lib/icons';
import LogoMark from './LogoMark';

const here = dirname(fileURLToPath(import.meta.url));
const read = path => readFileSync(resolve(here, path), 'utf8');

describe('the logo mark', () => {
  it('is available as I.LogoMark, the way the top bar and the footer use it', () => {
    expect(I.LogoMark).toBe(LogoMark);
  });

  it('gives every copy its own gradient names, so two on one page never clash', () => {
    const { container } = render(
      <>
        <LogoMark className="one" />
        <LogoMark className="two" />
      </>
    );
    const ids = [...container.querySelectorAll('[id]')].map(node => node.id);
    expect(ids.length).toBeGreaterThan(10);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('takes its colours from the theme variables, not from fixed colours', () => {
    const source = read('LogoMark.jsx');
    ['--logo-chip-a', '--logo-arch-a', '--logo-gold-b', '--logo-rim-a', '--logo-grain'].forEach(name => {
      expect(source).toContain(`var(${name})`);
    });
  });

  it('has the colours for the light theme, the system dark theme and the chosen dark theme', () => {
    const css = read('../styles/landing.css');
    expect(css.match(/--logo-chip-a:/g)).toHaveLength(3);
    expect(css).toMatch(/:root\[data-theme='dark'\] \{[^}]*--logo-chip-a/);
    expect(css).toMatch(/:root:not\(\[data-theme='light'\]\) \{[^}]*--logo-chip-a/);
  });
});
