/**
 * Run once to generate PWA icons: node generate-icons.mjs
 * Requires: npm install sharp (dev dep)
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#4f46e5"/>
  <rect x="160" y="160" width="192" height="192" rx="24" fill="white" opacity="0.15"/>
  <circle cx="256" cy="220" r="40" fill="white"/>
  <rect x="196" y="278" width="120" height="16" rx="8" fill="white" opacity="0.8"/>
  <rect x="216" y="306" width="80" height="12" rx="6" fill="white" opacity="0.5"/>
</svg>`;

const svgBuffer = Buffer.from(svg);

await sharp(svgBuffer).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(svgBuffer).resize(512, 512).png().toFile('public/icon-512.png');

console.log('Icons generated: public/icon-192.png, public/icon-512.png');
