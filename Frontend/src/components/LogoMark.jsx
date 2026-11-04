import { useRef } from 'react';

// The HireMe AI mark: an arch with a person in it, on a chip with a gold rim and a fine brushed texture.
// The colours come from CSS variables (--logo-*, see landing.css), so the mark follows the light and dark theme by itself.
// Every copy gets its own gradient names, so two marks on one page (top bar and footer) never clash.
let copies = 0;

export default function LogoMark(props) {
  const ref = useRef(null);
  if (ref.current === null) {
    copies += 1;
    ref.current = `hm${copies}`;
  }
  const id = ref.current;
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" {...props}>
      <defs>
        <linearGradient id={`${id}-chip`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--logo-chip-a)' }} />
          <stop offset="1" style={{ stopColor: 'var(--logo-chip-b)' }} />
        </linearGradient>
        <radialGradient id={`${id}-sheen`} cx="0.28" cy="0.12" r="0.95">
          <stop offset="0" stopColor="#ffffff" style={{ stopOpacity: 'var(--logo-sheen)' }} />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--logo-rim-a)' }} />
          <stop offset="1" style={{ stopColor: 'var(--logo-rim-b)' }} />
        </linearGradient>
        <pattern id={`${id}-grain`} width="1.7" height="1.7" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
          <line x1="0" y1="0" x2="0" y2="1.7" strokeWidth="0.45" style={{ stroke: 'var(--logo-grain)', strokeOpacity: 'var(--logo-grain-o)' }} />
        </pattern>
        <linearGradient id={`${id}-arch`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="360">
          <stop offset="0" style={{ stopColor: 'var(--logo-arch-a)' }} />
          <stop offset="1" style={{ stopColor: 'var(--logo-arch-b)' }} />
        </linearGradient>
        <linearGradient id={`${id}-gold`} gradientUnits="userSpaceOnUse" x1="110" y1="70" x2="270" y2="360">
          <stop offset="0" style={{ stopColor: 'var(--logo-gold-a)' }} />
          <stop offset="0.5" style={{ stopColor: 'var(--logo-gold-b)' }} />
          <stop offset="1" style={{ stopColor: 'var(--logo-gold-c)' }} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14.4" fill={`url(#${id}-chip)`} />
      <rect width="64" height="64" rx="14.4" fill={`url(#${id}-grain)`} />
      <rect width="64" height="64" rx="14.4" fill={`url(#${id}-sheen)`} />
      <rect x="2.3" y="2.3" width="59.4" height="59.4" rx="12.2" fill="none" strokeWidth="0.6" style={{ stroke: 'var(--logo-bevel)', strokeOpacity: 'var(--logo-bevel-o)' }} />
      <rect x="0.7" y="0.7" width="62.6" height="62.6" rx="13.7" fill="none" strokeWidth="1.4" stroke={`url(#${id}-rim)`} />
      <g transform="translate(9.6 11.25) scale(0.11979)">
        <path d="M52.5 352V142A134 134 0 0 1 320.5 142V352" fill="none" stroke={`url(#${id}-arch)`} strokeWidth="24" />
        <path d="M6.5 352H367.5" fill="none" stroke={`url(#${id}-arch)`} strokeWidth="22" strokeLinecap="round" />
        <path d="M101.5 358V167A85.5 85.5 0 0 1 272.5 167V358" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="21" />
        <circle cx="187" cy="182.5" r="36" fill={`url(#${id}-gold)`} />
        <path d="M129 353A58 112 0 0 1 245 353Z" fill={`url(#${id}-gold)`} />
      </g>
    </svg>
  );
}
