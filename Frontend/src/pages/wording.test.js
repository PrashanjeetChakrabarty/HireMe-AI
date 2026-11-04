import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = readdirSync(srcDir, { recursive: true })
  .filter(name => /\.jsx$/.test(name) && !/\.test\.jsx?$/.test(name))
  .map(name => ({ name, text: readFileSync(resolve(srcDir, name), 'utf8') }));

const offenders = test => files.filter(file => test(file.text)).map(file => file.name);
const hasLine = (text, wanted) => text.split('\n').some(line => wanted(line.trim()));

describe('the same words everywhere', () => {
  it('has the files to look at', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it('says "Log out", never "Logout", on a button or a link', () => {
    expect(offenders(text => hasLine(text, line => line === 'Logout' || />Logout</.test(line)))).toEqual([]);
  });

  it('says "Create account", never "Register", "Get started" or "Create an account", on a button or a title', () => {
    const wrong = text =>
      hasLine(text, line => line === 'Get started' || line.startsWith('Get started <I.') || />Get started<\/Link>/.test(line)) ||
      />Register</.test(text) ||
      /['"]Register['"]/.test(text) ||
      />Create an account</.test(text) ||
      /Create an account \|/.test(text);
    expect(offenders(wrong)).toEqual([]);
  });

  it('says "Sign in" only in "Sign in with Google", and never asks "How do I sign in?"', () => {
    expect(offenders(text => /Sign in(?! with Google)/.test(text) || /how do i sign in/i.test(text))).toEqual([]);
  });

  it('uses the agreed words in the top bar', () => {
    const navbar = files.find(file => file.name.endsWith('Navbar.jsx')).text;
    expect(navbar).toContain('Log in');
    expect(navbar).toContain('Log out');
    expect(navbar).toContain('Create account');
  });
});
