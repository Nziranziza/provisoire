import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicIconsDir = path.join(__dirname, '..', 'public', 'icons');
const publicDir = path.join(__dirname, '..', 'public');

fs.mkdirSync(publicIconsDir, { recursive: true });

/**
 * Creates an uncompressed / deflate-compressed PNG buffer from raw RGBA pixel data.
 */
function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit depth
  ihdr[9] = 6; // Color type 6 (RGBA)
  ihdr[10] = 0; // Compression 0
  ihdr[11] = 0; // Filter 0
  ihdr[12] = 0; // Interlace 0

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Scanlines with filter type 0 (None)
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (width * 4 + 1);
    scanlines[scanlineOffset] = 0; // Filter byte: 0
    const rowData = rgbaBuffer.subarray(y * width * 4, (y + 1) * width * 4);
    rowData.copy(scanlines, scanlineOffset + 1);
  }

  const compressedData = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 table
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

/**
 * Draws a high quality vector-style PWA icon on an RGBA buffer.
 */
function renderAppIcon(size, isMaskable = false) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = isMaskable ? size * 0.48 : size * 0.45;
  const innerR = size * 0.32;
  const rimWidth = size * 0.045;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      let r = 29,
        g = 78,
        b = 216,
        a = 255; // Base Blue #1d4ed8

      if (isMaskable) {
        // Full bleed background for maskable
        r = 29;
        g = 78;
        b = 216;
        a = 255;
      } else {
        // Rounded squircle / circular badge
        const inBadge = dist <= outerR;
        if (!inBadge) {
          a = 0;
        }
      }

      if (a > 0) {
        // Steering wheel outer rim
        const distFromWheelRim = Math.abs(dist - innerR);
        if (distFromWheelRim <= rimWidth) {
          // White steering wheel rim
          r = 255;
          g = 255;
          b = 255;
        } else if (dist < innerR - rimWidth && dist > size * 0.12) {
          // Inside wheel hollow area: darker blue #1e40af
          r = 30;
          g = 64;
          b = 175;

          // Steering wheel 3 spokes (at 180 deg, 0 deg, 90 deg / bottom)
          const angleNorm = (angle + Math.PI * 2) % (Math.PI * 2);
          const isLeftSpoke = Math.abs(angleNorm - Math.PI) < 0.14;
          const isRightSpoke =
            Math.abs(angleNorm - 0) < 0.14 ||
            Math.abs(angleNorm - Math.PI * 2) < 0.14;
          const isBottomSpoke = Math.abs(angleNorm - Math.PI / 2) < 0.14;

          if (isLeftSpoke || isRightSpoke || isBottomSpoke) {
            r = 255;
            g = 255;
            b = 255;
          }
        } else if (dist <= size * 0.12) {
          // Center horn badge: Yellow #fbbf24 with white star/check
          if (dist <= size * 0.09) {
            r = 251;
            g = 191;
            b = 36; // Amber gold
            if (dist <= size * 0.04) {
              r = 255;
              g = 255;
              b = 255; // Central white dot
            }
          } else {
            r = 255;
            g = 255;
            b = 255; // White ring
          }
        }
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = a;
    }
  }

  return createPng(size, size, buf);
}

// Generate SVG icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />

  <!-- Outer Steering Wheel Ring -->
  <circle cx="256" cy="256" r="160" fill="none" stroke="#ffffff" stroke-width="26" filter="url(#shadow)" />

  <!-- Inner wheel background accent -->
  <circle cx="256" cy="256" r="146" fill="#1e40af" fill-opacity="0.5" />

  <!-- Spokes -->
  <!-- Left spoke -->
  <rect x="96" y="244" width="80" height="24" rx="12" fill="#ffffff" />
  <!-- Right spoke -->
  <rect x="336" y="244" width="80" height="24" rx="12" fill="#ffffff" />
  <!-- Bottom spoke -->
  <rect x="244" y="320" width="24" height="80" rx="12" fill="#ffffff" />

  <!-- Center Hub / Horn Badge -->
  <circle cx="256" cy="256" r="54" fill="#ffffff" />
  <circle cx="256" cy="256" r="44" fill="url(#goldGrad)" />
  
  <!-- "P" for Provisoire in Center -->
  <text x="256" y="274" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" text-anchor="middle" fill="#0f172a">P</text>
</svg>`;

// Write SVG icons
fs.writeFileSync(path.join(publicIconsDir, 'icon.svg'), svgIcon);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon);

// Generate PNG icons
const icon192 = renderAppIcon(192, false);
const icon512 = renderAppIcon(512, false);
const maskable192 = renderAppIcon(192, true);
const maskable512 = renderAppIcon(512, true);
const appleIcon = renderAppIcon(180, false);

fs.writeFileSync(path.join(publicIconsDir, 'icon-192x192.png'), icon192);
fs.writeFileSync(path.join(publicIconsDir, 'icon-512x512.png'), icon512);
fs.writeFileSync(
  path.join(publicIconsDir, 'icon-maskable-192x192.png'),
  maskable192,
);
fs.writeFileSync(
  path.join(publicIconsDir, 'icon-maskable-512x512.png'),
  maskable512,
);
fs.writeFileSync(path.join(publicIconsDir, 'apple-touch-icon.png'), appleIcon);

console.log(
  'Successfully generated all PWA icons (192, 512, maskable, apple-touch, SVG)',
);
