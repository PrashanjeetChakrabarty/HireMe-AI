import { beforeEach, describe, expect, it, vi } from 'vitest';

import axiosClient from './axiosClient';
import { recordStorageNotice } from './consentApi';

vi.mock('./axiosClient', () => ({
  default: { post: vi.fn(() => Promise.resolve({})) },
}));

describe('recordStorageNotice', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('sends a random visitor id to the consent endpoint and keeps it', async () => {
    await recordStorageNotice();
    const [url, body] = axiosClient.post.mock.calls[0];
    expect(url).toBe('/api/Consent/notice');
    expect(body.visitorId).toMatch(/^[0-9a-f-]{36}$/);
    expect(localStorage.getItem('visitor-id')).toBe(body.visitorId);
  });

  it('sends the same visitor id the next time', async () => {
    await recordStorageNotice();
    await recordStorageNotice();
    const ids = axiosClient.post.mock.calls.map((call) => call[1].visitorId);
    expect(ids[0]).toBe(ids[1]);
  });
});
