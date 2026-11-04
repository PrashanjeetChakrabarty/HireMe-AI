import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const frontend = resolve(here, '..');
const src = resolve(here);
const read = path => readFileSync(resolve(frontend, path), 'utf8');
// Built from two pieces, so this file does not write the old name in full.
const OLD = 'arie' + 'otech';

describe('the HireMe AI brand', () => {
  it('has no trace of the old name in the website code, the page head or the styles', () => {
    const files = readdirSync(src, { recursive: true }).filter(name => /\.(css|jsx?)$/.test(name) && !/\.test\.jsx?$/.test(name));
    expect(files.length).toBeGreaterThan(10);
    const offenders = files.filter(name => new RegExp(OLD, 'i').test(readFileSync(resolve(src, name), 'utf8')));
    expect(offenders).toEqual([]);
    expect(new RegExp(OLD, 'i').test(read('index.html'))).toBe(false);
  });

  it('puts the new name, favicon and share image in the page head', () => {
    const html = read('index.html');
    expect(html).toContain('<title>HireMe AI | Right hire. Right role. AI makes the match.</title>');
    expect(html).toContain('href="/favicon.svg"');
    expect(html).toContain('href="/apple-touch-icon.png"');
    expect(html).toContain('property="og:site_name" content="HireMe AI"');
  });

  it('has every logo and icon file in the public folder, and not the old logo', () => {
    ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'og-image.jpg', 'hireme-logo-dark.svg', 'hireme-logo-light.svg'].forEach(file => {
      expect(existsSync(resolve(frontend, 'public', file)), file).toBe(true);
    });
    expect(existsSync(resolve(frontend, 'public', `${OLD}Logo.jpg`))).toBe(false);
  });

  it('shows the name with a gold AI in the top bar and in the footer', () => {
    ['src/components/layout/Navbar.jsx', 'src/components/layout/Footer.jsx'].forEach(file => {
      expect(read(file)).toContain('HireMe <i className="brand-ai">AI</i>');
    });
    expect(read('src/components/layout/Navbar.jsx')).toContain('<small>AI Resume Screener</small>');
  });

  it('keeps the legal pages free of the draft banner, with the new contact email', () => {
    const legal = read('src/pages/LegalPages.jsx');
    expect(legal).not.toMatch(/Draft/);
    expect(legal).toContain("const CONTACT_EMAIL = 'workbuildwithus@gmail.com'");
  });
});
