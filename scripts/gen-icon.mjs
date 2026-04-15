import sharp from 'sharp';

function makeSVG(size) {
  const cx = size / 2;
  const corner = size * 0.225; // iOS-style rounded corners

  // Ring dimensions
  const ringR = size * 0.36;     // orbital ring radius
  const ringStroke = size * 0.014;

  // "M" size
  const mSize = size * 0.38;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Deep indigo radial background -->
    <radialGradient id="bg" cx="40%" cy="30%" r="70%">
      <stop offset="0%"   stop-color="#1e1650"/>
      <stop offset="60%"  stop-color="#0d0a2e"/>
      <stop offset="100%" stop-color="#05030f"/>
    </radialGradient>

    <!-- Glass highlight at top (white sheen) -->
    <linearGradient id="glassTop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="45%"  stop-color="#ffffff" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- Ring glow filter -->
    <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${(size * 0.018).toFixed(1)}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- M letter glow -->
    <filter id="mGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${(size * 0.022).toFixed(1)}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Clip to rounded rect -->
    <clipPath id="clip">
      <rect width="${size}" height="${size}" rx="${corner}" ry="${corner}"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${corner}" ry="${corner}" fill="url(#bg)"/>

  <g clip-path="url(#clip)">
    <!-- Subtle ambient glow blob behind ring -->
    <ellipse cx="${cx}" cy="${cx}" rx="${ringR * 1.3}" ry="${ringR * 1.3}"
      fill="#4f46e5" opacity="0.08"/>

    <!-- Outer orbital ring — indigo with glow -->
    <circle cx="${cx}" cy="${cx}" r="${ringR}"
      fill="none"
      stroke="#6366f1"
      stroke-width="${ringStroke}"
      opacity="0.85"
      filter="url(#ringGlow)"/>

    <!-- Four small dots at cardinal points on the ring -->
    <circle cx="${cx}" cy="${(cx - ringR).toFixed(1)}" r="${(size * 0.018).toFixed(1)}" fill="#818cf8" opacity="0.9"/>
    <circle cx="${cx}" cy="${(cx + ringR).toFixed(1)}" r="${(size * 0.018).toFixed(1)}" fill="#818cf8" opacity="0.9"/>
    <circle cx="${(cx - ringR).toFixed(1)}" cy="${cx}" r="${(size * 0.018).toFixed(1)}" fill="#818cf8" opacity="0.9"/>
    <circle cx="${(cx + ringR).toFixed(1)}" cy="${cx}" r="${(size * 0.018).toFixed(1)}" fill="#818cf8" opacity="0.9"/>

    <!-- M lettermark — white with subtle glow -->
    <text
      x="${cx}" y="${(cx + mSize * 0.13).toFixed(1)}"
      text-anchor="middle"
      dominant-baseline="middle"
      font-family="'SF Pro Display', -apple-system, 'Helvetica Neue', Arial, sans-serif"
      font-weight="800"
      font-size="${mSize}"
      fill="#ffffff"
      filter="url(#mGlow)"
      letter-spacing="-2"
    >M</text>

    <!-- Glass highlight overlay (top sheen) -->
    <rect width="${size}" height="${size * 0.55}" rx="${corner}" ry="${corner}"
      fill="url(#glassTop)"/>
  </g>

  <!-- Glass rim border -->
  <rect width="${size}" height="${size}" rx="${corner}" ry="${corner}"
    fill="none"
    stroke="white"
    stroke-width="${(size * 0.004).toFixed(1)}"
    opacity="0.10"/>
</svg>`;
}

// 512×512
await sharp(Buffer.from(makeSVG(512))).png().toFile('public/icon-512.png');
console.log('✓ icon-512.png');

// 192×192
await sharp(Buffer.from(makeSVG(192))).png().toFile('public/icon-192.png');
console.log('✓ icon-192.png');

console.log('Done!');
