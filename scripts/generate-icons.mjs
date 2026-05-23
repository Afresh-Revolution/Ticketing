/**
 * Generates favicon and PWA icons from public/logo.png (G mark).
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const source = join(publicDir, 'logo.png');

/** App theme background — matches index.html theme-color */
const BG = { r: 26, g: 18, b: 46, alpha: 1 };

/**
 * @param {number} size
 * @param {number} contentScale 0–1 fraction of canvas used by the logo
 */
async function squareIcon(size, contentScale, outName) {
  const inner = Math.round(size * contentScale);
  const logo = await sharp(source)
    .resize(inner, inner, { fit: 'contain', background: { ...BG, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9, palette: size <= 32 })
    .toFile(join(publicDir, outName));

  console.log(`  ${outName} (${size}×${size})`);
}

/** Minimal ICO (16 + 32) for legacy browsers */
async function writeFaviconIco() {
  const sizes = [16, 32];
  const pngBuffers = await Promise.all(
    sizes.map(async (size) => {
      const inner = Math.round(size * 0.82);
      const logo = await sharp(source)
        .resize(inner, inner, { fit: 'contain', background: { ...BG, alpha: 0 } })
        .png()
        .toBuffer();
      return sharp({
        create: { width: size, height: size, channels: 4, background: BG },
      })
        .composite([{ input: logo, gravity: 'center' }])
        .png()
        .toBuffer();
    }),
  );

  const parts = [];
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const png = pngBuffers[i];
    const offset = 6 + 16 * sizes.length + parts.reduce((s, p) => s + p.length, 0);
    parts.push(png);
    // directory entry written below
  }

  let dataOffset = 6 + 16 * sizes.length;
  const entries = [];
  let cursor = dataOffset;
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const png = pngBuffers[i];
    entries.push({ size, png, offset: cursor });
    cursor += png.length;
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);

  const dir = Buffer.alloc(16 * sizes.length);
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size === 256 ? 0 : e.size, o);
    dir.writeUInt8(e.size === 256 ? 0 : e.size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(e.png.length, o + 8);
    dir.writeUInt32LE(e.offset, o + 12);
  });

  const ico = Buffer.concat([header, dir, ...entries.map((e) => e.png)]);
  await writeFile(join(publicDir, 'favicon.ico'), ico);
  console.log('  favicon.ico (16 + 32)');
}

console.log('Generating icons from public/logo.png …');
await squareIcon(16, 0.82, 'favicon-16x16.png');
await squareIcon(32, 0.82, 'favicon-32x32.png');
await squareIcon(180, 0.78, 'apple-touch-icon.png');
await squareIcon(192, 0.78, 'icon-192.png');
await squareIcon(512, 0.78, 'icon-512.png');
await squareIcon(512, 0.62, 'icon-512-maskable.png');
await writeFaviconIco();
console.log('Done.');
