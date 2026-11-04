import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { PrivacyPage, TermsPage } from './LegalPages';

afterEach(cleanup);

function show(page) {
  render(<MemoryRouter>{page}</MemoryRouter>);
  return document.body.textContent;
}

describe('Privacy Policy', () => {
  it('has no [placeholder] left to fill in', () => {
    show(<PrivacyPage />);
    expect(document.querySelectorAll('.ph').length).toBe(0);
    expect(document.body.textContent).not.toMatch(/\[[^\]]+\]/);
  });

  it('names the company, the contact address and the backup period', () => {
    const text = show(<PrivacyPage />);
    expect(text).toContain('HireMe AI');
    expect(text).toContain('6 months');
    expect(document.querySelector('a[href="mailto:workbuildwithus@gmail.com"]')).not.toBeNull();
  });

  it('explains the consent records, the job rules, the human check and the emails', () => {
    const text = show(<PrivacyPage />);
    expect(text).toContain('Consent records');
    expect(text).toContain('Job rules');
    expect(text).toContain('Cloudflare');
    expect(text).toContain('welcome message');
  });

  it('says the minimum age is 18 and resume files are deleted with the account', () => {
    const text = show(<PrivacyPage />);
    expect(text).toContain('under 18');
    expect(text).toContain('uploaded resume files are deleted from storage too');
  });
});

describe('Terms of Service', () => {
  it('has no [placeholder] left to fill in', () => {
    show(<TermsPage />);
    expect(document.querySelectorAll('.ph').length).toBe(0);
    expect(document.body.textContent).not.toMatch(/\[[^\]]+\]/);
  });

  it('names the governing law, the courts and the contact address', () => {
    const text = show(<TermsPage />);
    expect(text).toContain('laws of India');
    expect(text).toContain('Allahabad High Court');
    expect(text).toContain('HireMe AI');
    expect(document.querySelector('a[href="mailto:workbuildwithus@gmail.com"]')).not.toBeNull();
  });

  it('has a part about the job application rules', () => {
    const text = show(<TermsPage />);
    expect(text).toContain('Job application rules');
    expect(text).toContain('accept them before applying');
  });
});
