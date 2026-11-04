import { describe, it, expect } from 'vitest';
import { parseApiDate } from './dateTime';

describe('parseApiDate', () => {
  it('treats a timestamp without a zone as UTC', () => {
    expect(parseApiDate('2026-10-09T03:30:00').toISOString()).toBe('2026-10-09T03:30:00.000Z');
  });

  it('keeps a timestamp that already has a zone', () => {
    expect(parseApiDate('2026-10-09T03:30:00Z').toISOString()).toBe('2026-10-09T03:30:00.000Z');
    expect(parseApiDate('2026-10-09T09:00:00+05:30').toISOString()).toBe('2026-10-09T03:30:00.000Z');
  });

  it('returns null for empty input', () => {
    expect(parseApiDate(null)).toBeNull();
    expect(parseApiDate('')).toBeNull();
  });
});
