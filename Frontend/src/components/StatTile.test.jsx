import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import StatTile from './StatTile';

// The animation helpers are not what is tested here.
vi.mock('../lib/hooks', () => ({
  useInView: () => [{ current: null }, true],
  useCountUp: value => value,
  useTilt: () => ({ current: null }),
}));

const Icon = () => <svg />;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function show(tile) {
  render(<MemoryRouter>{tile}</MemoryRouter>);
}

describe('StatTile', () => {
  it('is a link to the page it leads to, and shows the number and the name', () => {
    show(<StatTile icon={Icon} value={3} label="Applications" hint="All the jobs you applied to." to="/my-activity" />);

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/my-activity');
    expect(link.textContent).toContain('3');
    expect(link.textContent).toContain('Applications');
  });

  it('is a button when it does something on the same page', () => {
    const onClick = vi.fn();
    show(<StatTile icon={Icon} value={2} label="Open roles" hint="Jobs open right now." onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('explains itself in a pop-up when you point at it, and hides it after 5 seconds', () => {
    show(<StatTile icon={Icon} value={3} label="Applications" hint="All the jobs you applied to." to="/my-activity" />);
    const tip = screen.getByRole('tooltip', { hidden: true });
    expect(tip.className).not.toContain('show');
    expect(tip.textContent).toBe('All the jobs you applied to.');

    fireEvent.mouseEnter(screen.getByRole('link'));
    expect(tip.className).toContain('show');

    act(() => {
      vi.advanceTimersByTime(4900);
    });
    expect(tip.className).toContain('show');
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(tip.className).not.toContain('show');
  });

  it('hides the pop-up as soon as the pointer leaves, and shows it for keyboard users too', () => {
    show(<StatTile icon={Icon} value={3} label="Applications" hint="All the jobs you applied to." to="/my-activity" />);
    const tip = screen.getByRole('tooltip', { hidden: true });

    fireEvent.mouseEnter(screen.getByRole('link'));
    fireEvent.mouseLeave(screen.getByRole('link'));
    expect(tip.className).not.toContain('show');

    fireEvent.focus(screen.getByRole('link'));
    expect(tip.className).toContain('show');
  });
});
