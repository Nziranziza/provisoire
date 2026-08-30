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
 * High quality vector SVG icon for Provisoire
 */
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="provisoireBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1d4ed8" />
      <stop offset="60%" stop-color="#1e40af" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="wheelRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="softShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#020617" flood-opacity="0.4" />
    </filter>
    <filter id="hubShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="120" fill="url(#provisoireBg)" />

  <!-- Subtle interior border ring -->
  <rect x="14" y="14" width="484" height="484" rx="108" fill="none" stroke="#ffffff" stroke-width="3" stroke-opacity="0.15" />

  <!-- Steering Wheel Outer Ring -->
  <circle cx="256" cy="256" r="162" fill="none" stroke="url(#wheelRimGrad)" stroke-width="28" filter="url(#softShadow)" />

  <!-- Darker inner wheel recess -->
  <circle cx="256" cy="256" r="148" fill="#0f172a" fill-opacity="0.45" />

  <!-- Steering Wheel Spokes -->
  <!-- Left horizontal spoke -->
  <rect x="94" y="244" width="86" height="24" rx="12" fill="url(#wheelRimGrad)" />
  <!-- Right horizontal spoke -->
  <rect x="332" y="244" width="86" height="24" rx="12" fill="url(#wheelRimGrad)" />
  <!-- Bottom vertical spoke -->
  <rect x="244" y="322" width="24" height="86" rx="12" fill="url(#wheelRimGrad)" />

  <!-- Center Horn Hub / Medallion -->
  <circle cx="256" cy="256" r="56" fill="#ffffff" filter="url(#hubShadow)" />
  <circle cx="256" cy="256" r="46" fill="url(#goldGrad)" />
  <circle cx="256" cy="256" r="46" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.4" />

  <!-- Center Emblem: Bold 'P' -->
  <text x="256" y="277" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="58" font-weight="900" text-anchor="middle" fill="#0f172a">P</text>
</svg>`;

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

  const crc = zlib.crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

/**
 * Draws a high quality anti-aliased icon on an RGBA buffer.
 */
function renderAppIcon(size, isMaskable = false) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = isMaskable ? size * 0.5 : size * 0.46;
  const innerR = size * 0.32;
  const rimWidth = size * 0.055;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Smooth anti-aliased gradient background
      let r = 29,
        g = 78,
        b = 216,
        a = 255;

      if (isMaskable) {
        // Maskable icon: full-bleed background
        r = 29;
        g = 78;
        b = 216;
        a = 255;
      } else {
        // Regular icon: rounded squircle boundary with alpha feathering
        if (dist > outerR) {
          const edgeDist = dist - outerR;
          if (edgeDist < 1.0) {
            a = Math.round((1.0 - edgeDist) * 255);
          } else {
            a = 0;
          }
        }
      }

      if (a > 0) {
        // Gradient color: #1d4ed8 at top to #0f172a at bottom
        const t = y / size;
        r = Math.round(29 * (1 - t) + 15 * t);
        g = Math.round(78 * (1 - t) + 23 * t);
        b = Math.round(216 * (1 - t) + 42 * t);

        // Steering wheel outer rim
        const distFromWheelRim = Math.abs(dist - innerR);
        if (distFromWheelRim <= rimWidth) {
          // White steering wheel rim
          r = 255;
          g = 255;
          b = 255;
        } else if (dist < innerR - rimWidth && dist > size * 0.12) {
          // Inside wheel hollow area: dark blue
          r = 15;
          g = 23;
          b = 42;

          // 3 Spokes (left: 180 deg, right: 0 deg, bottom: 90 deg)
          const angleNorm = (angle + Math.PI * 2) % (Math.PI * 2);
          const isLeftSpoke = Math.abs(angleNorm - Math.PI) < 0.18;
          const isRightSpoke =
            Math.abs(angleNorm - 0) < 0.18 ||
            Math.abs(angleNorm - Math.PI * 2) < 0.18;
          const isBottomSpoke = Math.abs(angleNorm - Math.PI / 2) < 0.18;

          if (isLeftSpoke || isRightSpoke || isBottomSpoke) {
            r = 255;
            g = 255;
            b = 255;
          }
        } else if (dist <= size * 0.12) {
          // Center horn badge: Yellow/Gold #f59e0b
          if (dist <= size * 0.1) {
            r = 245;
            g = 158;
            b = 11; // Gold
            if (dist <= size * 0.05) {
              r = 15;
              g = 23;
              b = 42; // Central dark core
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

/** Multi-size ICO with embedded PNG payloads. */
function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const sizes = [16, 32];
  const entries = [];
  let offset = 6 + count * 16;

  for (let i = 0; i < count; i++) {
    const png = pngBuffers[i];
    const size = sizes[i] ?? 32;
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size; // width
    entry[1] = size >= 256 ? 0 : size; // height
    entry[2] = 0; // color count
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

// 1. Write SVG icons
fs.writeFileSync(path.join(publicIconsDir, 'icon.svg'), svgIcon);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon);

// 2. Generate PNG icons and favicons
const favicon16 = renderAppIcon(16, false);
const favicon32 = renderAppIcon(32, false);
const icon192 = renderAppIcon(192, false);
const icon512 = renderAppIcon(512, false);
const maskable192 = renderAppIcon(192, true);
const maskable512 = renderAppIcon(512, true);
const appleIcon = renderAppIcon(180, false);

fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), favicon16);
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), favicon32);
fs.writeFileSync(
  path.join(publicDir, 'favicon.ico'),
  createIco([favicon16, favicon32]),
);
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
  'Successfully generated favicon (SVG, ICO, 16/32 PNG) and PWA icons (192, 512, maskable, apple-touch)',
);
