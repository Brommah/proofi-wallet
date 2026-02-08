#!/usr/bin/env node
/**
 * Generate Proofi Hub extension icons (16, 32, 48, 128px)
 * Uses Node.js built-in zlib to create valid PNG files.
 * Run: node generate-icons.js
 */
const fs = require('fs');
const zlib = require('zlib');

const BLUE = [59, 130, 246]; // #3B82F6
const WHITE = [255, 255, 255];

function createPNG(width, height, rawData) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crcData = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeInt32BE(crc32(crcData));
    return Buffer.concat([len, typeB, data, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT
  const compressed = zlib.deflateSync(rawData);

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', iend),
  ]);
}

// CRC32 table
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

function isInP(nx, ny) {
  // "P" character relative to the circle (0-1 coordinates)
  const stemL = 0.32, stemR = 0.42;
  const top = 0.24, bottom = 0.76;
  const bowlTop = 0.24, bowlBot = 0.52;
  const bowlR = 0.66;
  const t = 0.10; // stroke thickness

  // Vertical stem
  if (nx >= stemL && nx <= stemR && ny >= top && ny <= bottom) return true;
  // Top bar
  if (nx >= stemL && nx <= bowlR && ny >= bowlTop && ny <= bowlTop + t) return true;
  // Middle bar (bowl bottom)
  if (nx >= stemL && nx <= bowlR && ny >= bowlBot - t && ny <= bowlBot) return true;
  // Right side of bowl
  if (nx >= bowlR - t && nx <= bowlR && ny >= bowlTop && ny <= bowlBot) return true;

  return false;
}

function generateIcon(size) {
  const rawData = Buffer.alloc((size * 4 + 1) * size);
  const cx = size / 2, cy = size / 2;
  const r = size * 0.44;

  for (let y = 0; y < size; y++) {
    const rowOff = y * (size * 4 + 1);
    rawData[rowOff] = 0; // filter: None

    for (let x = 0; x < size; x++) {
      const px = rowOff + 1 + x * 4;
      const dx = x - cx + 0.5, dy = y - cy + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= r + 1.5) {
        // Edge softness
        const edgeAlpha = dist > r ? Math.max(0, 1 - (dist - r) / 1.5) : 1;
        const nx = x / size, ny = y / size;

        if (isInP(nx, ny)) {
          rawData[px] = WHITE[0];
          rawData[px + 1] = WHITE[1];
          rawData[px + 2] = WHITE[2];
        } else {
          rawData[px] = BLUE[0];
          rawData[px + 1] = BLUE[1];
          rawData[px + 2] = BLUE[2];
        }
        rawData[px + 3] = Math.round(255 * edgeAlpha);
      } else {
        rawData[px] = rawData[px + 1] = rawData[px + 2] = rawData[px + 3] = 0;
      }
    }
  }

  return createPNG(size, size, rawData);
}

// Generate all sizes
[16, 32, 48, 128].forEach(size => {
  const png = generateIcon(size);
  const path = `icons/icon-${size}.png`;
  fs.writeFileSync(path, png);
  console.log(`✓ ${path} (${png.length} bytes)`);
});

console.log('\nDone! Icons generated in icons/ folder.');
