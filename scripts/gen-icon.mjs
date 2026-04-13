import sharp from 'sharp';
import { writeFileSync } from 'fs';

// Generate SVG at given size
function makeSVG(size) {
  const cx = size / 2;
  const r1 = size * 0.42;  // outer ring
  const r2 = size * 0.33;  // mid ring
  const r3 = size * 0.22;  // inner ring
  const r4 = size * 0.13;  // core
  const pad = size * 0.06;
  const corner = size * 0.22;

  // Tick marks around outer ring (12 positions)
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 15 * Math.PI) / 180;
    const isMajor = i % 6 === 0;
    const rOuter = r1;
    const rInner = isMajor ? r1 - size * 0.06 : r1 - size * 0.03;
    const x1 = cx + rOuter * Math.cos(angle);
    const y1 = cx + rOuter * Math.sin(angle);
    const x2 = cx + rInner * Math.cos(angle);
    const y2 = cx + rInner * Math.sin(angle);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
      stroke="${isMajor ? '#00d4ff' : '#0099bb'}"
      stroke-width="${isMajor ? size * 0.012 : size * 0.006}"
      opacity="${isMajor ? '1' : '0.5'}"/>`;
  }).join('\n');

  // Hex points on mid ring
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 - 90) * Math.PI / 180;
    const x = cx + r2 * Math.cos(angle);
    const y = cx + r2 * Math.sin(angle);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(size * 0.018).toFixed(1)}"
      fill="#00d4ff" opacity="0.9"/>`;
  }).join('\n');

  // The "M" letter - bold, tech style
  const mSize = size * 0.28;
  const mX = cx - mSize / 2;
  const mY = cx - mSize / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Background gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0a1628"/>
      <stop offset="100%" stop-color="#020810"/>
    </radialGradient>
    <!-- Outer glow -->
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#00d4ff" stop-opacity="0"/>
    </radialGradient>
    <!-- Core glow -->
    <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#00d4ff"/>
      <stop offset="100%" stop-color="#0066aa"/>
    </radialGradient>
    <!-- M glow filter -->
    <filter id="mGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="${size * 0.012}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="ringGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="${size * 0.008}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${size * 0.025}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="${size}" height="${size}" rx="${corner}" ry="${corner}" fill="url(#bgGrad)"/>

  <!-- Ambient glow layer -->
  <circle cx="${cx}" cy="${cx}" r="${r1 * 1.1}" fill="url(#glowGrad)"/>

  <!-- Outer ring -->
  <circle cx="${cx}" cy="${cx}" r="${r1}"
    fill="none" stroke="#00d4ff" stroke-width="${size * 0.008}" opacity="0.7" filter="url(#ringGlow)"/>

  <!-- Tick marks -->
  ${ticks}

  <!-- Mid ring dashed -->
  <circle cx="${cx}" cy="${cx}" r="${r2}"
    fill="none" stroke="#00aacc" stroke-width="${size * 0.005}"
    stroke-dasharray="${size * 0.04} ${size * 0.015}" opacity="0.6"/>

  <!-- Hex dots on mid ring -->
  ${hexPoints}

  <!-- Inner ring -->
  <circle cx="${cx}" cy="${cx}" r="${r3}"
    fill="none" stroke="#00d4ff" stroke-width="${size * 0.007}" opacity="0.8" filter="url(#ringGlow)"/>

  <!-- Cross hair lines (subtle) -->
  <line x1="${cx}" y1="${(cx - r3 * 1.05).toFixed(1)}" x2="${cx}" y2="${(cx - r1 * 0.92).toFixed(1)}"
    stroke="#00d4ff" stroke-width="${size * 0.004}" opacity="0.4"/>
  <line x1="${cx}" y1="${(cx + r3 * 1.05).toFixed(1)}" x2="${cx}" y2="${(cx + r1 * 0.92).toFixed(1)}"
    stroke="#00d4ff" stroke-width="${size * 0.004}" opacity="0.4"/>
  <line x1="${(cx - r3 * 1.05).toFixed(1)}" y1="${cx}" x2="${(cx - r1 * 0.92).toFixed(1)}" y2="${cx}"
    stroke="#00d4ff" stroke-width="${size * 0.004}" opacity="0.4"/>
  <line x1="${(cx + r3 * 1.05).toFixed(1)}" y1="${cx}" x2="${(cx + r1 * 0.92).toFixed(1)}" y2="${cx}"
    stroke="#00d4ff" stroke-width="${size * 0.004}" opacity="0.4"/>

  <!-- Core circle -->
  <circle cx="${cx}" cy="${cx}" r="${r4}" fill="url(#coreGrad)" filter="url(#coreGlow)" opacity="0.95"/>

  <!-- M letter -->
  <text x="${cx}" y="${cx}"
    text-anchor="middle" dominant-baseline="central"
    font-family="'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif"
    font-weight="800"
    font-size="${mSize}"
    fill="#ffffff"
    filter="url(#mGlow)"
    letter-spacing="-1"
  >M</text>

  <!-- Subtle vignette -->
  <rect width="${size}" height="${size}" rx="${corner}" ry="${corner}"
    fill="none" stroke="#00d4ff" stroke-width="${size * 0.004}" opacity="0.3"/>
</svg>`;
}

// Generate 512x512
const svg512 = makeSVG(512);
await sharp(Buffer.from(svg512)).png().toFile('public/icon-512.png');
console.log('✓ icon-512.png');

// Generate 192x192
const svg192 = makeSVG(192);
await sharp(Buffer.from(svg192)).png().toFile('public/icon-192.png');
console.log('✓ icon-192.png');

console.log('Done!');
