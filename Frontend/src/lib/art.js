// All artwork is generated from SVG text, so the page needs no photos and no network.
const toUri = svg => `data:image/svg+xml;base64,${btoa(svg)}`;

// Colourful blurred mesh. It shows through the letters of the masked heading.
export const meshArt = toUri(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800" viewBox="0 0 1600 800">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#071a52"/><stop offset="1" stop-color="#2a0f5c"/></linearGradient>
<filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="80"/></filter>
</defs>
<rect width="1600" height="800" fill="url(#g)"/>
<g filter="url(#b)">
<circle cx="260" cy="190" r="330" fill="#25b7ff"/>
<circle cx="860" cy="640" r="360" fill="#7a5cff"/>
<circle cx="1360" cy="160" r="310" fill="#ff4fb8"/>
<circle cx="620" cy="120" r="230" fill="#22e0c8"/>
<circle cx="1180" cy="620" r="220" fill="#3b82ff"/>
</g>
</svg>`);

// Dark theme version of the mesh: teal and sky blue on deep ocean.
export const meshArtDark = toUri(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="800" viewBox="0 0 1600 800">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#061317"/><stop offset="1" stop-color="#0c2a30"/></linearGradient>
<filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="80"/></filter>
</defs>
<rect width="1600" height="800" fill="url(#g)"/>
<g filter="url(#b)">
<circle cx="260" cy="190" r="330" fill="#2dd4bf"/>
<circle cx="860" cy="640" r="360" fill="#0ea5e9"/>
<circle cx="1360" cy="160" r="310" fill="#22d3ee"/>
<circle cx="620" cy="120" r="230" fill="#7dd3fc"/>
<circle cx="1180" cy="620" r="220" fill="#0d9488"/>
</g>
</svg>`);

// Stylised person bust for the profile cards (no photo, just shapes).
const bust = (a, b) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560">
<defs>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
<radialGradient id="h" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${a}"/></radialGradient>
</defs>
<g transform="translate(30 84) scale(0.85)">
<path d="M30 560 C40 420 120 372 200 372 C280 372 360 420 370 560 Z" fill="url(#s)"/>
<rect x="168" y="318" width="64" height="70" rx="26" fill="url(#h)"/>
<ellipse cx="200" cy="250" rx="86" ry="104" fill="url(#h)"/>
<path d="M112 238 C108 150 160 118 208 124 C262 130 296 170 288 244 C270 196 236 176 200 178 C160 180 128 200 112 238 Z" fill="${b}"/>
</g>
</svg>`;
export const avatarA = toUri(bust('#e8f4ff', '#3d7fe0'));
export const avatarB = toUri(bust('#ffeaf6', '#c4429e'));
export const avatarC = toUri(bust('#e9fff6', '#2aa889'));

// Tile used as the holographic shine mask on the cards (white shapes on black).
export const iconPattern = toUri(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
<rect width="120" height="120" fill="#000"/>
<path d="M60 14 L70 28 L60 42 L50 28 Z" fill="#fff"/>
<path d="M14 74 L22 84 L14 94 L6 84 Z" fill="#fff" opacity=".8"/>
<path d="M106 74 L114 84 L106 94 L98 84 Z" fill="#fff" opacity=".8"/>
<circle cx="60" cy="96" r="5" fill="#fff"/>
<circle cx="20" cy="28" r="3" fill="#fff" opacity=".7"/>
<circle cx="100" cy="28" r="3" fill="#fff" opacity=".7"/>
</svg>`);

export const grain = toUri(`<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/>
<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/></filter>
<rect width="220" height="220" filter="url(#n)"/>
</svg>`);