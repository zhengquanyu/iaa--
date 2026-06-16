const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const sequencePath = path.join(root, 'sheep-sequence-data.js');
const outDir = path.join(root, 'animal_replacement_spine_parts/19_sheep_sequence_strict_blue');
const backupDir = path.join(root, 'backups', `sheep_sequence_strict_blue_${stamp()}`);

function stamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function recolorPixel(r, g, b, a) {
  if (a <= 8) return [0, 0, 0, 0];
  const lum = (r + g + b) / 3;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);

  if (lum < 48 && chroma < 115) return [r, g, b, a];

  const skin = r > 205 && g > 135 && g < 215 && b > 120 && b < 205 && r > g + 18 && g >= b - 10;
  if (skin) return [r, g, b, a];

  const shade = Math.max(0.5, Math.min(1.2, lum / 180));
  return [
    Math.round(Math.min(120, Math.max(34, 54 * shade))),
    Math.round(Math.min(194, Math.max(110, 150 * shade))),
    Math.round(Math.min(255, Math.max(184, 236 * shade))),
    a,
  ];
}

function stats(png) {
  const out = { alpha: 0, white: 0, light: 0, blue: 0, nearBlack: 0, skin: 0, nonBlue: 0 };
  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2], a = png.data[i + 3];
    if (a <= 8) continue;
    out.alpha++;
    const lum = (r + g + b) / 3;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const skin = r > 205 && g > 135 && g < 215 && b > 120 && b < 205 && r > g + 18 && g >= b - 10;
    if (lum > 170 && chroma < 90) out.white++;
    if (lum > 150) out.light++;
    if (lum < 48 && chroma < 115) out.nearBlack++;
    else if (skin) out.skin++;
    else if (b > r + 12 && b >= g - 18 && b > 90) out.blue++;
    else out.nonBlue++;
  }
  return out;
}

fs.mkdirSync(backupDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(sequencePath, path.join(backupDir, path.basename(sequencePath)));

const text = fs.readFileSync(sequencePath, 'utf8');
let index = 0;
const report = [];
const rewritten = text.replace(/"(data:image\/png;base64,([^"]+))"/g, (match, dataUrl, base64) => {
  const before = PNG.sync.read(Buffer.from(base64, 'base64'));
  const after = new PNG({ width: before.width, height: before.height });
  for (let i = 0; i < before.data.length; i += 4) {
    const rgba = recolorPixel(before.data[i], before.data[i + 1], before.data[i + 2], before.data[i + 3]);
    after.data[i] = rgba[0];
    after.data[i + 1] = rgba[1];
    after.data[i + 2] = rgba[2];
    after.data[i + 3] = rgba[3];
  }
  const nextBase64 = PNG.sync.write(after).toString('base64');
  fs.writeFileSync(path.join(outDir, `frame_${String(index).padStart(2, '0')}.png`), PNG.sync.write(after));
  report.push(`frame_${String(index).padStart(2, '0')}: before=${JSON.stringify(stats(before))} after=${JSON.stringify(stats(after))}`);
  index++;
  return `"data:image/png;base64,${nextBase64}"`;
});

fs.writeFileSync(sequencePath, rewritten, 'utf8');
fs.writeFileSync(path.join(outDir, 'manifest.txt'), [
  'Sheep sequence strict blue recolor install',
  '',
  'Fix: recolored embedded 24-frame sheep PNG sequence used by restoreReplacementAnimalSprite.',
  'Preserved: transparent pixels, black outline, and pink hand/skin pixels.',
  `target=${path.relative(root, sequencePath).replace(/\\/g, '/')}`,
  `backup=${path.relative(root, backupDir).replace(/\\/g, '/')}`,
  `frames=${index}`,
  '',
  ...report,
  '',
].join('\n'));

console.log(`Updated ${path.relative(root, sequencePath)}`);
console.log(`Backup ${path.relative(root, backupDir)}`);
console.log(`Frames ${index}`);
console.log(report.slice(0, 3).join('\n'));
