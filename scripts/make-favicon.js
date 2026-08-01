// ============================================================
// scripts/make-favicon.js — generates app/favicon.ico
// ============================================================
// Run with: node scripts/make-favicon.js
//
// The icon is committed as a binary, which is impossible to review in a diff.
// This script is the source it was built from, so the mark can be adjusted and
// regenerated rather than reverse-engineered out of the .ico.
//
// The mark is two arrows pointing opposite ways. The site is two people
// exchanging test dates, so the icon is the exchange, on the same green as the
// site buttons (#1D9E75 to #15805e).
//
// Sizing note. The geometry is written in whole 16px units and multiplied up
// into a 256 design space, so every edge lands on a whole pixel at 16x16. That
// size is the one that matters, since it is what a browser tab and a Google
// result show, and an earlier version with thinner arrowheads dissolved into
// two featureless bars there. Each size is rendered separately at 4x and
// downsampled, rather than scaling one big render down, so 16px gets its own
// clean anti-aliasing.
//
// No dependencies. PNG and ICO are both written by hand below.
// ============================================================

const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const D = 256;        // design space
const RADIUS = 48;    // corner radius, 3px at 16x16
const P = 16;         // one 16px pixel, in design units

// Each arrow is a rectangular shaft plus a triangular head that tapers from
// `half` at `base` down to nothing at `tip`.
const ARROWS = [
  // top, pointing right
  { shaft: [2 * P, 4 * P, 9 * P, 6 * P], tip: [14 * P, 5 * P], base: 8 * P, half: 2 * P, dir: 1 },
  // bottom, pointing left
  { shaft: [7 * P, 10 * P, 14 * P, 12 * P], tip: [2 * P, 11 * P], base: 8 * P, half: 2 * P, dir: -1 },
];

const SIZES = [16, 32, 48, 256];

// ── shapes ─────────────────────────────────────────────────

function inRoundedRect(x, y, w, h, r) {
  if (x < 0 || y < 0 || x > w || y > h) return false;
  const cx = Math.min(Math.max(x, r), w - r);
  const cy = Math.min(Math.max(y, r), h - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function inArrow(x, y, a) {
  const [x0, y0, x1, y1] = a.shaft;
  if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return true;
  const [tx, ty] = a.tip;
  const span = (tx - a.base) * a.dir;   // always positive
  const along = (x - a.base) * a.dir;
  if (along < 0 || along > span) return false;
  return Math.abs(y - ty) <= a.half * (1 - along / span);
}

// ── rendering ──────────────────────────────────────────────

function render(size) {
  const SS = 4;
  const scale = (size * SS) / D;
  const out = Buffer.alloc(size * size * 4);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, covered = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const dx = (px * SS + sx + 0.5) / scale;
          const dy = (py * SS + sy + 0.5) / scale;
          if (!inRoundedRect(dx, dy, D, D, RADIUS)) continue;

          if (ARROWS.some((a) => inArrow(dx, dy, a))) {
            r += 255; g += 255; b += 255;
          } else {
            // 135deg gradient, #1D9E75 to #15805e
            const t = (dx + dy) / (2 * D);
            r += 0x1d + (0x15 - 0x1d) * t;
            g += 0x9e + (0x80 - 0x9e) * t;
            b += 0x75 + (0x5e - 0x75) * t;
          }
          covered++;
        }
      }

      const i = (py * size + px) * 4;
      // Average over covered samples only, so a partly covered edge pixel keeps
      // its full colour and softens through alpha rather than towards black.
      out[i] = covered ? Math.round(r / covered) : 0;
      out[i + 1] = covered ? Math.round(g / covered) : 0;
      out[i + 2] = covered ? Math.round(b / covered) : 0;
      out[i + 3] = Math.round((covered / (SS * SS)) * 255);
    }
  }
  return out;
}

// ── PNG ────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typed = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([len, typed, crc]);
}

function encodePNG(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA

  const stride = size * 4 + 1;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── BMP/DIB, for the small sizes ───────────────────────────
// Older ICO parsers only understand DIB, so 16/32/48 go in that way. 256 goes
// in as PNG because a 256px DIB is 256KB and anything that can render one can
// read PNG.

function encodeDIB(rgba, size) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8); // doubled: colour data plus AND mask
  header.writeUInt16LE(1, 12);      // planes
  header.writeUInt16LE(32, 14);     // bits per pixel

  // BGRA, bottom-up.
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    const src = (size - 1 - y) * size * 4;
    for (let x = 0; x < size; x++) {
      const s = src + x * 4;
      const d = (y * size + x) * 4;
      pixels[d] = rgba[s + 2];
      pixels[d + 1] = rgba[s + 1];
      pixels[d + 2] = rgba[s];
      pixels[d + 3] = rgba[s + 3];
    }
  }

  // AND mask, 1bpp with rows padded to 4 bytes. Left zeroed: the alpha channel
  // above is what gets used, but the mask has to be present and correctly sized
  // or strict parsers reject the entry.
  const mask = Buffer.alloc(Math.ceil(size / 32) * 4 * size);

  return Buffer.concat([header, pixels, mask]);
}

// ── ICO container ──────────────────────────────────────────

const images = SIZES.map((size) => {
  const rgba = render(size);
  return { size, data: size === 256 ? encodePNG(rgba, size) : encodeDIB(rgba, size) };
});

const dir = Buffer.alloc(6);
dir.writeUInt16LE(0, 0);               // reserved
dir.writeUInt16LE(1, 2);               // type: icon
dir.writeUInt16LE(images.length, 4);

let offset = 6 + images.length * 16;
const entries = images.map((img) => {
  const e = Buffer.alloc(16);
  e[0] = img.size === 256 ? 0 : img.size; // 0 means 256
  e[1] = img.size === 256 ? 0 : img.size;
  e[2] = 0;                               // palette entries
  e[3] = 0;                               // reserved
  e.writeUInt16LE(1, 4);                  // planes
  e.writeUInt16LE(32, 6);                 // bits per pixel
  e.writeUInt32LE(img.data.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += img.data.length;
  return e;
});

const ico = Buffer.concat([dir, ...entries, ...images.map((i) => i.data)]);
const out = path.join(__dirname, "..", "app", "favicon.ico");
fs.writeFileSync(out, ico);
console.log(`wrote ${out} — ${ico.length} bytes, sizes ${SIZES.join(", ")}`);
