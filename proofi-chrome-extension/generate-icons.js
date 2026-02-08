/**
 * Generate PNG icons for Proofi Chrome Extension
 * Creates simple but distinctive icons: black background, cyan "P" mark
 * No external dependencies — uses raw PNG construction
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(__dirname, 'icons'), { recursive: true });

// Minimal PNG encoder (no dependencies)
function createPNG(width, height, pixels) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk (raw pixel data with zlib)
  const rawData = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (width * 4 + 1) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];     // R
      rawData[dstIdx + 1] = pixels[srcIdx + 1]; // G
      rawData[dstIdx + 2] = pixels[srcIdx + 2]; // B
      rawData[dstIdx + 3] = pixels[srcIdx + 3]; // A
    }
  }

  // Simple zlib wrapping (deflate stored blocks)
  const zlibData = deflateStored(rawData);
  const idatChunk = makeChunk('IDAT', zlibData);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function deflateStored(data) {
  // Zlib header (CM=8, CINFO=7, FCHECK)
  const header = Buffer.from([0x78, 0x01]);
  
  const blocks = [];
  const BLOCK_SIZE = 65535;
  
  for (let i = 0; i < data.length; i += BLOCK_SIZE) {
    const block = data.slice(i, Math.min(i + BLOCK_SIZE, data.length));
    const isLast = (i + BLOCK_SIZE >= data.length) ? 1 : 0;
    const blockHeader = Buffer.alloc(5);
    blockHeader[0] = isLast;
    blockHeader.writeUInt16LE(block.length, 1);
    blockHeader.writeUInt16LE(block.length ^ 0xFFFF, 3);
    blocks.push(blockHeader, block);
  }
  
  // Adler-32 checksum
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE((b << 16) | a, 0);
  
  return Buffer.concat([header, ...blocks, checksum]);
}

// CRC32 lookup table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// Draw the Proofi icon
function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const bg = [0, 0, 0, 255];         // Black background
  const cyan = [0, 229, 255, 255];    // #00E5FF
  const border = [0, 229, 255, 80];   // Cyan border (subtle)

  // Fill background
  for (let i = 0; i < size * size; i++) {
    pixels.set(bg, i * 4);
  }

  function setPixel(x, y, color) {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      pixels.set(color, (y * size + x) * 4);
    }
  }

  function fillRect(x1, y1, x2, y2, color) {
    for (let y = y1; y < y2; y++) {
      for (let x = x1; x < x2; x++) {
        setPixel(x, y, color);
      }
    }
  }

  // Scale factor
  const s = size / 16;

  // Draw border (1px cyan border)
  const bw = Math.max(1, Math.round(s * 0.5));
  fillRect(0, 0, size, bw, border);              // top
  fillRect(0, size - bw, size, size, border);     // bottom
  fillRect(0, 0, bw, size, border);               // left
  fillRect(size - bw, 0, size, size, border);     // right

  // Draw "P" shape (Proofi brand mark)
  const margin = Math.round(s * 3);
  const thick = Math.max(2, Math.round(s * 2.5));
  
  // Vertical stroke of P
  fillRect(margin, margin, margin + thick, size - margin, cyan);
  
  // Top horizontal of P
  fillRect(margin, margin, size - margin - Math.round(s * 1), margin + thick, cyan);
  
  // Right vertical of P (upper half only)
  const midY = Math.round(size * 0.55);
  fillRect(size - margin - Math.round(s * 1), margin, size - margin - Math.round(s * 1) + thick, midY, cyan);
  
  // Middle horizontal of P
  fillRect(margin, midY - thick, size - margin - Math.round(s * 1) + thick, midY, cyan);

  return Buffer.from(pixels);
}

// Generate icons at different sizes
for (const size of [16, 32, 48, 128]) {
  const pixels = drawIcon(size);
  const png = createPNG(size, size, pixels);
  writeFileSync(join(__dirname, 'icons', `icon${size}.png`), png);
  console.log(`✅ Generated icon${size}.png (${png.length} bytes)`);
}

console.log('✅ All icons generated');
