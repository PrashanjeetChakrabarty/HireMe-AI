import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const tokens = readFileSync(resolve(here, 'tokens.css'), 'utf8');
const indexHtml = readFileSync(resolve(here, '../../index.html'), 'utf8');

describe('one font for the whole site', () => {
  it('points the display, body and mono font names to Inter', () => {
    ['--f-display', '--f-body', '--f-mono'].forEach(name => {
      const line = tokens.split('\n').find(row => row.trim().startsWith(name + ':'));
      expect(line, name).toBeTruthy();
      expect(line).toContain("'Inter'");
    });
  });

  it('loads only Inter from Google Fonts', () => {
    const families = [...indexHtml.matchAll(/family=([^&:"]+)/g)].map(match => match[1]);
    expect(families).toEqual(['Inter']);
  });

  it('keeps the old fonts out of every style and script', () => {
    const srcDir = resolve(here, '..');
    const files = readdirSync(srcDir, { recursive: true }).filter(
      name => /\.(css|jsx?)$/.test(name) && !/\.test\.jsx?$/.test(name)
    );
    expect(files.length).toBeGreaterThan(10);
    const offenders = files.filter(name => /Space Grotesk|IBM Plex/i.test(readFileSync(srcDir + '/' + name, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
