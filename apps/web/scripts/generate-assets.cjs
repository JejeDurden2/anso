#!/usr/bin/env node

/**
 * Generate favicon and social media assets for Anso
 *
 * Run: node scripts/generate-assets.js
 *
 * Requirements: npm install sharp
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not installed. Installing...');
  const { execSync } = require('child_process');
  execSync('npm install sharp --save-dev', { stdio: 'inherit' });
  sharp = require('sharp');
}

const PUBLIC_DIR = path.join(__dirname, '../public');

// Brand color
const BRAND_COLOR = '#0ea5e9';
const WHITE = '#ffffff';

// SVG logo (triangle inside rounded square)
const createLogoSvg = (size, padding = 0) => {
  const innerSize = size - padding * 2;
  const radius = Math.round(innerSize * 0.25);

  // Triangle points scaled to inner size
  const scale = innerSize / 32;
  const offsetX = padding;
  const offsetY = padding;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect x="${offsetX}" y="${offsetY}" width="${innerSize}" height="${innerSize}" rx="${radius}" fill="${BRAND_COLOR}"/>
    <path d="M${offsetX + 8 * scale} ${offsetY + 22 * scale}L${offsetX + 16 * scale} ${offsetY + 10 * scale}L${offsetX + 24 * scale} ${offsetY + 22 * scale}H${offsetX + 8 * scale}Z"
          stroke="${WHITE}"
          stroke-width="${2 * scale}"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"/>
  </svg>`;
};

// OG Image SVG (1200x630 with logo and tagline)
const createOgImageSvg = () => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>

    <!-- Logo -->
    <g transform="translate(500, 180)">
      <rect width="200" height="200" rx="40" fill="${WHITE}" fill-opacity="0.15"/>
      <path d="M50 137.5L100 62.5L150 137.5H50Z"
            stroke="${WHITE}"
            stroke-width="12"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"/>
    </g>

    <!-- Brand name -->
    <text x="600" y="450"
          font-family="Inter, system-ui, sans-serif"
          font-size="72"
          font-weight="700"
          fill="${WHITE}"
          text-anchor="middle">Anso</text>

    <!-- Tagline -->
    <text x="600" y="520"
          font-family="Inter, system-ui, sans-serif"
          font-size="32"
          font-weight="400"
          fill="${WHITE}"
          fill-opacity="0.9"
          text-anchor="middle">Le CRM simple pour freelances et TPE</text>
  </svg>`;
};

// Twitter Image SVG (1200x600)
const createTwitterImageSvg = () => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
    <defs>
      <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="1200" height="600" fill="url(#bg2)"/>

    <!-- Logo -->
    <g transform="translate(500, 160)">
      <rect width="200" height="200" rx="40" fill="${WHITE}" fill-opacity="0.15"/>
      <path d="M50 137.5L100 62.5L150 137.5H50Z"
            stroke="${WHITE}"
            stroke-width="12"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"/>
    </g>

    <!-- Brand name -->
    <text x="600" y="430"
          font-family="Inter, system-ui, sans-serif"
          font-size="72"
          font-weight="700"
          fill="${WHITE}"
          text-anchor="middle">Anso</text>

    <!-- Tagline -->
    <text x="600" y="500"
          font-family="Inter, system-ui, sans-serif"
          font-size="32"
          font-weight="400"
          fill="${WHITE}"
          fill-opacity="0.9"
          text-anchor="middle">Le CRM simple pour freelances et TPE</text>
  </svg>`;
};

async function generateAssets() {
  console.log('Generating assets...\n');

  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // Generate favicon PNGs
  const faviconSizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
  ];

  for (const { name, size } of faviconSizes) {
    const svg = createLogoSvg(size);
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(PUBLIC_DIR, name));
    console.log(`Created ${name}`);
  }

  // Generate favicon.ico (32x32)
  const ico32Svg = createLogoSvg(32);
  await sharp(Buffer.from(ico32Svg))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon.ico'));
  console.log('Created favicon.ico');

  // Generate OG image
  const ogSvg = createOgImageSvg();
  await sharp(Buffer.from(ogSvg))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'og-image.png'));
  console.log('Created og-image.png');

  // Generate Twitter image
  const twitterSvg = createTwitterImageSvg();
  await sharp(Buffer.from(twitterSvg))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'twitter-image.png'));
  console.log('Created twitter-image.png');

  console.log('\nAll assets generated successfully!');
}

generateAssets().catch(console.error);
