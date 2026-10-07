/**
 * Generates the Quizeasy PWA icons (PNG) with no image dependencies.
 *
 * Usage: node scripts/generate-icons.mjs
 *
 * The mark is deliberately simple: a rounded indigo tile with a white ring and
 * a tail — a readable "Q" shape that survives being rendered at 48px.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(rootDir, 'public', 'icons');

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const mix = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smoothstep = (edge0, edge1, x) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
// Signed distance to a rounded rectangle centered on the canvas.
function roundedRectDistance(px, py, halfW, halfH, radius) {
  const dx = Math.abs(px) - (halfW - radius);
  const dy = Math.abs(py) - (halfH - radius);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  return outside + Math.min(Math.max(dx, dy), 0) - radius;
}

function renderIcon(size, { maskable }) {
  const rgba = Buffer.alloc(size * size * 4);
  const aa = 1.2;
  const center = size / 2;
  // Maskable icons need their content inside the safe zone.
  const scale = maskable ? 0.72 : 0.92;
  const tileHalf = (size / 2) * (maskable ? 1.0 : 0.96);
  const cornerRadius = maskable ? 0 : size * 0.22;
  const ringRadius = size * 0.27 * scale;
  const ringThickness = size * 0.088 * scale;
  const ring = ringRadius - ringThickness / 2;
  const tailLength = size * 0.2 * scale;
  const tailThickness = size * 0.09 * scale;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const px = x + 0.5 - center;
      const py = y + 0.5 - center;

      // Background tile with a diagonal gradient.
      const tileAlpha = maskable
        ? 1
        : 1 - smoothstep(-aa, aa, roundedRectDistance(px, py, tileHalf, tileHalf, cornerRadius));
      const t = clamp01((x / size + y / size) / 2);
      const bgR = mix(79, 124, t);
      const bgG = mix(70, 58, t);
      const bgB = mix(229, 237, t);

      // Ring (annulus).
      const ringDist = Math.abs(Math.hypot(px, py) - ring) - ringThickness / 2;
      // Tail: a rounded capsule along the diagonal, outside the ring.
      const ux = Math.SQRT1_2;
      const startX = ring * 0.6;
      const startY = ring * 0.6;
      const relX = px - startX;
      const relY = py - startY;
      const along = relX * ux + relY * ux;
      const across = -relX * ux + relY * ux;
      const tailDist =
        Math.hypot(Math.max(along - tailLength, 0), across) +
        Math.min(Math.max(along - tailLength, across), 0) -
        tailThickness / 2;
      const markDist = Math.min(ringDist, tailDist);
      const markAlpha = 1 - smoothstep(-aa, aa, markDist);

      const fgR = 255;
      const fgG = 255;
      const fgB = 255;

      const alpha = clamp01(tileAlpha);
      const r = mix(bgR, fgR, markAlpha);
      const g = mix(bgG, fgG, markAlpha);
      const b = mix(bgB, fgB, markAlpha);

      rgba[i] = Math.round(r);
      rgba[i + 1] = Math.round(g);
      rgba[i + 2] = Math.round(b);
      rgba[i + 3] = Math.round(alpha * 255);
    }
  }
  return encodePng(size, size, rgba);
}

mkdirSync(outDir, { recursive: true });

const targets = [
  ['icon-192.png', 192, { maskable: false }],
  ['icon-512.png', 512, { maskable: false }],
  ['icon-maskable-512.png', 512, { maskable: true }],
];

for (const [name, size, options] of targets) {
  const file = path.join(outDir, name);
  writeFileSync(file, renderIcon(size, options));
  console.log(`wrote ${path.relative(rootDir, file)} (${size}x${size})`);
}
