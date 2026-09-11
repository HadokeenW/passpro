const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Generate a valid RGBA PNG file
function createPng(width, height) {
  // RGBA buffer with filter byte 0 at start of each scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      
      // Calculate distance from center for a rounded icon / badge
      const cx = width / 2;
      const cy = height / 2;
      const r = width / 2 - 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      if (dist <= r) {
        // Gradient from #1E3A8A (deep blue) to #2563EB (vibrant royal blue)
        const factor = y / height;
        const rVal = Math.round(30 + factor * 7);
        const gVal = Math.round(58 + factor * 41);
        const bVal = Math.round(138 + factor * 97);

        // Draw an inner white shield / "P" monogram in the center
        const isInPStem = x >= cx - 48 && x <= cx - 24 && y >= cy - 64 && y <= cy + 64;
        const isInPLoop = x >= cx - 24 && x <= cx + 48 && y >= cy - 64 && y <= cy;
        const isInPLoopHole = x >= cx - 4 && x <= cx + 28 && y >= cy - 44 && y <= cy - 20;

        if (isInPStem || (isInPLoop && !isInPLoopHole)) {
          rawData[pixelOffset] = 255; // R
          rawData[pixelOffset + 1] = 255; // G
          rawData[pixelOffset + 2] = 255; // B
          rawData[pixelOffset + 3] = 255; // A
        } else {
          rawData[pixelOffset] = rVal;
          rawData[pixelOffset + 1] = gVal;
          rawData[pixelOffset + 2] = bVal;
          rawData[pixelOffset + 3] = 255;
        }
      } else {
        // Transparent outside circle
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  // Deflate compressed data
  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // Bit depth
  ihdrData.writeUInt8(6, 9); // Color type: RGBA
  ihdrData.writeUInt8(0, 10); // Compression
  ihdrData.writeUInt8(0, 11); // Filter
  ihdrData.writeUInt8(0, 12); // Interlace
  const ihdrChunk = createChunk("IHDR", ihdrData);

  // IDAT Chunk
  const idatChunk = createChunk("IDAT", compressed);

  // IEND Chunk
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// CRC-32 table calculation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const iconBuffer = createPng(256, 256);
const destPath = path.join(__dirname, "assets", "icon.png");
fs.writeFileSync(destPath, iconBuffer);
console.log("PASSPro icon generated successfully at:", destPath);
