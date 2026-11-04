import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import HeroOrb, { CANDIDATE_WORDS, RECRUITER_WORDS, project, spherePoints } from './HeroOrb';

// The scroll helper is not what is tested here.
vi.mock('../lib/hooks', () => ({ useInView: () => [{ current: null }, true] }));

afterEach(cleanup);

const firstChip = () => document.querySelector('.orb-chip');

describe('spherePoints and project', () => {
  it('puts every point on the ball, each in a different place', () => {
    const points = spherePoints(10);

    expect(points.length).toBe(10);
    points.forEach(point => {
      expect(point.x ** 2 + point.y ** 2 + point.z ** 2).toBeCloseTo(1, 5);
    });
    const places = new Set(points.map(point => `${point.x.toFixed(3)},${point.y.toFixed(3)},${point.z.toFixed(3)}`));
    expect(places.size).toBe(10);
  });

  it('says a point at the front is near (depth 1) and one at the back is far (depth 0)', () => {
    expect(project({ x: 0, y: 0, z: 1 }, 0, 0).depth).toBeCloseTo(1, 5);
    expect(project({ x: 0, y: 0, z: -1 }, 0, 0).depth).toBeCloseTo(0, 5);
  });

  it('moves a point sideways when the ball is turned', () => {
    const turned = project({ x: 0, y: 0, z: 1 }, 0, Math.PI / 2);

    expect(turned.x).toBeCloseTo(1, 5);
    expect(turned.depth).toBeCloseTo(0.5, 5);
  });
});

describe('HeroOrb', () => {
  it('shows one label for each word', () => {
    render(<HeroOrb words={CANDIDATE_WORDS} />);

    expect(document.querySelectorAll('.orb-chip').length).toBe(CANDIDATE_WORDS.length);
    expect(screen.getByText('Resume')).toBeTruthy();
    expect(screen.getByText('AI match')).toBeTruthy();
  });

  it('has its own words for a recruiter', () => {
    render(<HeroOrb words={RECRUITER_WORDS} />);

    expect(screen.getByText('Post')).toBeTruthy();
    expect(screen.getByText('Analytics')).toBeTruthy();
    expect(screen.queryByText('Resume')).toBeNull();
  });

  it('places the labels as soon as it shows, and spins them with the arrow keys', () => {
    render(<HeroOrb words={CANDIDATE_WORDS} />);
    const before = firstChip().style.transform;
    expect(before).toContain('translate(');

    fireEvent.keyDown(screen.getByRole('img'), { key: 'ArrowRight' });

    expect(firstChip().style.transform).not.toBe(before);
  });

  it('spins when it is dragged with the mouse', () => {
    render(<HeroOrb words={CANDIDATE_WORDS} />);
    const orb = screen.getByRole('img');
    const before = firstChip().style.transform;

    fireEvent.pointerDown(orb, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(orb, { clientX: 150, clientY: 120, pointerId: 1 });
    fireEvent.pointerUp(orb, { pointerId: 1 });

    expect(firstChip().style.transform).not.toBe(before);
  });
});
