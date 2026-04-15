import sharp from 'sharp';

function makeSVG(size) {
  const cx = size / 2;
  const corner = size * 0.225; // iOS icon corner radius

  const ringR      = size * 0.355;
  const ringStroke = size * 0.013;
  const mSize      = size * 0.36;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Background: deep indigo-purple matching app UI -->
    <radialGradient id="bg" cx="40%" cy="32%" r="75%">
      <stop offset="0%"   stop-color="#1a1548"/>
      <stop offset="55%"  stop-color="#0d0a2e"/>
      <stop offset="100%" stop-color="#06040f"/>
    </radialGradient>

    <!-- Subtle glass sheen — indigo-tinted, not white-bright -->
    <linearGradient id="sheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#7c75f5" stop-opacity="0.20"/>
      <stop offset="40%"  stop-color="#4f46e5" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#4f46e5" stop-opacity="0"/>
    </linearGradient>

    <!-- Soft ring glow — one pass only so it doesn't overpower -->
    <filter id="ringGlow" x="-15%" y="-15%" width="130%" height="130%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${(size * 0.014).toFixed(1)}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- M: clean drop shadow only — no bloom -->
    <filter id="mShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="${(size * 0.006).toFixed(1)}"
        stdDeviation="${(size * 0.008).toFixed(1)}"
        flood-color="#4f46e5" flood-opacity="0.7"/>
    </filter>

    <!-- Clip to rounded rect -->
    <clipPath id="clip">
      <rect width="${size}" height="${size}" rx="${corner}" ry="${corner}"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${corner}" ry="${corner}" fill="url(#bg)"/>

  <g clip-path="url(#clip)">
    <!-- Ambient indigo glow behind ring (very subtle) -->
    <ellipse cx="${cx}" cy="${cx}" rx="${ringR * 1.25}" ry="${ringR * 1.25}"
      fill="#4f46e5" opacity="0.07"/>

    <!-- Orbital ring — exact app indigo #4f46e5 -->
    <circle cx="${cx}" cy="${cx}" r="${ringR}"
      fill="none"
      stroke="#4f46e5"
      stroke-width="${ringStroke}"
      opacity="0.90"
      filter="url(#ringGlow)"/>

    <!-- Four accent dots at cardinal points — lighter indigo -->
    <circle cx="${cx}"               cy="${(cx - ringR).toFixed(1)}" r="${(size * 0.016).toFixed(1)}" fill="#818cf8"/>
    <circle cx="${cx}"               cy="${(cx + ringR).toFixed(1)}" r="${(size * 0.016).toFixed(1)}" fill="#818cf8"/>
    <circle cx="${(cx - ringR).toFixed(1)}" cy="${cx}"               r="${(size * 0.016).toFixed(1)}" fill="#818cf8"/>
    <circle cx="${(cx + ringR).toFixed(1)}" cy="${cx}"               r="${(size * 0.016).toFixed(1)}" fill="#818cf8"/>

    <!-- M — crisp white, drop shadow only, no bloom -->
    <text
      x="${cx}" y="${(cx + mSize * 0.12).toFixed(1)}"
      text-anchor="middle"
      dominant-baseline="middle"
      font-family="'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif"
      font-weight="800"
      font-size="${mSize}"
      fill="#ffffff"
      filter="url(#mShadow)"
      letter-spacing="-2"
    >M</text>

    <!-- Glass sheen overlay (top ~50%) -->
    <rect width="${size}" height="${size * 0.52}" rx="${corner}" ry="${corner}"
      fill="url(#sheen)"/>
  </g>

  <!-- Glass rim border — indigo-tinted, very subtle -->
  <rect width="${size}" height="${size}" rx="${corner}" ry="${corner}"
    fill="none"
    stroke="#6366f1"
    stroke-width="${(size * 0.004).toFixed(1)}"
    opacity="0.18"/>
</svg>`;
}

await sharp(Buffer.from(makeSVG(512))).png().toFile('public/icon-512.png');
console.log('✓ icon-512.png');

await sharp(Buffer.from(makeSVG(192))).png().toFile('public/icon-192.png');
console.log('✓ icon-192.png');

console.log('Done!');
