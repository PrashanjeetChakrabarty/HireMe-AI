import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(frontend, path), 'utf8');

const NEW = 'https://hireme-ai-hiring.vercel.app';
// Built from pieces, so this file does not contain the old address itself.
const OLD = 'resume-screening' + '-ar.vercel.app';

describe('the website address', () => {
  it('is the new one in the page head', () => {
    const html = read('index.html');
    expect(html).toContain(`<link rel="canonical" href="${NEW}/" />`);
    expect(html).toContain(`<meta property="og:url" content="${NEW}/" />`);
    expect(html).toContain(`<meta property="og:image" content="${NEW}/og-image.jpg" />`);
    expect(html).toContain(`<meta name="twitter:image" content="${NEW}/og-image.jpg" />`);
  });

  it('is the new one in the sitemap and robots.txt', () => {
    const sitemap = read('public/sitemap.xml');
    ['/', '/login', '/register', '/privacy', '/terms'].forEach(path => {
      expect(sitemap).toContain(`<loc>${NEW}${path}</loc>`);
    });
    expect(read('public/robots.txt')).toContain(`Sitemap: ${NEW}/sitemap.xml`);
  });

  it('is the new one in the SEO helper', () => {
    expect(read('src/components/layout/SeoManager.jsx')).toContain(`const SITE_URL = '${NEW}';`);
  });

  it('has no trace of the old address in the site files', () => {
    ['index.html', 'public/sitemap.xml', 'public/robots.txt', 'src/components/layout/SeoManager.jsx'].forEach(file => {
      expect(read(file), file).not.toContain(OLD);
    });
  });
});
