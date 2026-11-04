import { useEffect, useRef } from 'react';

import { useInView } from '../lib/hooks';

const AUTO_SPIN = 0.0045; // radians per frame, the slow turn it does by itself
const RADIUS = 88; // how far the labels are from the middle, in pixels

export const CANDIDATE_WORDS = ['Resume', 'Skills', 'AI match', 'Apply', 'Shortlist', 'Interview', 'Offer', 'Growth', 'Profile', 'Jobs'];
export const RECRUITER_WORDS = ['Post', 'Review', 'AI match', 'Shortlist', 'Interview', 'Offer', 'Analytics', 'Pipeline', 'Talent', 'Hire'];

// Points spread evenly over a ball (the Fibonacci spiral). Each point is one label.
export function spherePoints(count) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, index) => {
    // Start half a step in, so no label sits exactly on the top or bottom tip, where turning the ball would not move it.
    const y = 1 - ((index + 0.5) / Math.max(1, count)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = golden * index;
    return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius };
  });
}

// Turns a point by two angles. Returns where it lands (x and y from -1 to 1) and how far in front it is (depth 0 = at the back, 1 = at the front).
export function project(point, rotX, rotY) {
  const x1 = point.x * Math.cos(rotY) + point.z * Math.sin(rotY);
  const z1 = -point.x * Math.sin(rotY) + point.z * Math.cos(rotY);
  const y2 = point.y * Math.cos(rotX) - z1 * Math.sin(rotX);
  const z2 = point.y * Math.sin(rotX) + z1 * Math.cos(rotX);
  return { x: x1, y: y2, depth: (z2 + 1) / 2 };
}

// A ball of labels you can drag and spin. Decoration only: nothing on the page depends on it.
export default function HeroOrb({ words }) {
  const [viewRef, inView] = useInView({ threshold: 0.1 }, false);
  const chips = useRef([]);
  const visible = useRef(true);
  const spin = useRef({ x: -0.35, y: 0.5, vx: 0, vy: AUTO_SPIN, dragging: false, lastX: 0, lastY: 0 });
  const points = useRef(spherePoints(words.length));

  useEffect(() => {
    visible.current = inView;
  }, [inView]);

  const paint = () => {
    const s = spin.current;
    points.current.forEach((point, index) => {
      const chip = chips.current[index];
      if (!chip) return;
      const { x, y, depth } = project(point, s.x, s.y);
      const scale = 0.62 + 0.5 * depth;
      chip.style.transform = `translate(-50%, -50%) translate(${(x * RADIUS).toFixed(1)}px, ${(y * RADIUS).toFixed(1)}px) scale(${scale.toFixed(2)})`;
      chip.style.opacity = (0.3 + 0.7 * depth).toFixed(2);
      chip.style.zIndex = String(Math.round(depth * 100));
    });
  };

  useEffect(() => {
    points.current = spherePoints(words.length);
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words.length]);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    const s = spin.current;
    let raf = 0;
    const tick = () => {
      if (visible.current && !document.hidden && !s.dragging) {
        // After a drag the ball keeps some speed. It slows down toward the gentle automatic turn.
        s.vy += ((reduceMotion ? 0 : AUTO_SPIN) - s.vy) * 0.04;
        s.vx *= 0.94;
        s.y += s.vy;
        s.x += s.vx;
        paint();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = event => {
    const s = spin.current;
    s.dragging = true;
    s.lastX = event.clientX;
    s.lastY = event.clientY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = event => {
    const s = spin.current;
    if (!s.dragging) return;
    const dx = event.clientX - s.lastX;
    const dy = event.clientY - s.lastY;
    s.lastX = event.clientX;
    s.lastY = event.clientY;
    s.y += dx * 0.012;
    s.x -= dy * 0.012;
    s.vy = dx * 0.012;
    s.vx = -dy * 0.012;
    paint();
  };

  const onPointerEnd = event => {
    spin.current.dragging = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const onKeyDown = event => {
    const s = spin.current;
    const step = 0.35;
    if (event.key === 'ArrowRight') s.y += step;
    else if (event.key === 'ArrowLeft') s.y -= step;
    else if (event.key === 'ArrowUp') s.x += step;
    else if (event.key === 'ArrowDown') s.x -= step;
    else return;
    event.preventDefault();
    paint();
  };

  return (
    <div
      ref={viewRef}
      className="hero-orb"
      role="img"
      tabIndex={0}
      aria-label="A ball of labels. Drag it with the mouse to spin it, or use the arrow keys."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    >
      <span className="orb-ring a" aria-hidden="true" />
      <span className="orb-ring b" aria-hidden="true" />
      <span className="orb-core" aria-hidden="true" />
      {words.map((word, index) => (
        <span
          key={word}
          ref={element => {
            chips.current[index] = element;
          }}
          className={`orb-chip c${index % 5}`}
        >
          {word}
        </span>
      ))}
      <span className="hero-orb-hint" aria-hidden="true">
        Drag to spin
      </span>
    </div>
  );
}
