import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TurnstileBox, { isTurnstileEnabled } from './TurnstileBox';

describe('TurnstileBox', () => {
  beforeEach(() => {
    window.turnstile = { render: vi.fn(() => 'widget-1'), reset: vi.fn(), remove: vi.fn() };
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    delete window.turnstile;
  });

  it('shows nothing and does nothing when no site key is set', () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '');
    const { container } = render(<TurnstileBox onToken={() => {}} />);
    expect(isTurnstileEnabled()).toBe(false);
    expect(container.firstChild).toBeNull();
    expect(window.turnstile.render).not.toHaveBeenCalled();
  });

  it('draws the box with the site key and passes the answer on', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'test-key');
    const answers = [];
    render(<TurnstileBox onToken={(token) => answers.push(token)} />);
    await waitFor(() => expect(window.turnstile.render).toHaveBeenCalledTimes(1));
    const options = window.turnstile.render.mock.calls[0][1];
    expect(options.sitekey).toBe('test-key');
    options.callback('abc');
    options['expired-callback']();
    expect(answers).toEqual(['abc', '']);
  });

  it('starts the check again when the reset number goes up', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'test-key');
    const { rerender } = render(<TurnstileBox onToken={() => {}} resetCounter={0} />);
    await waitFor(() => expect(window.turnstile.render).toHaveBeenCalledTimes(1));
    rerender(<TurnstileBox onToken={() => {}} resetCounter={1} />);
    expect(window.turnstile.reset).toHaveBeenCalledWith('widget-1');
  });
});
