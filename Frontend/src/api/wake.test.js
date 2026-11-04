import { afterEach, describe, expect, it, vi } from 'vitest';

import { wakeServer } from './wake';

describe('wakeServer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks the backend for the public role list', () => {
    const fetchMock = vi.fn(() => Promise.resolve({}));
    vi.stubGlobal('fetch', fetchMock);
    wakeServer();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/api/Roles/register-options');
  });

  it('never throws when the server cannot be reached', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    expect(() => wakeServer()).not.toThrow();
  });
});
