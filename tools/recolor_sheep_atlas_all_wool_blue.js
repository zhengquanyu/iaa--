const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const atlasPath = path.join(root, 'subpackages/game/native/6b/6bc5fc93-b403-4b31-a0e1-7ccff54c45d7.7b5a8.png');
const atlasTextPath = path.join(root, 'subpackages/game/native/d6/d614ee96-d20f-4373-8064-5d92fd589021.ac70a.atlas');
const outDir = path.join(root, 'animal_replacement_spine_parts/17_sheep_all_wool_blue');
const backupDir = path.join(root, 'backups', `spine_sheep_all_wool_blue_${stamp()}`);

const slots = ['sheep_body', 'sheep_leg1', 'sheep_leg2', 'sheep_leg3', 'sheep_leg4', 'sheep_eye', 'sheep_ear1', 'sheep_ear2', 'sheep_hair', 'sheep_wei', 'sheep_light'];

function stamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function loadPng(file) { return PNG.sync.read(fs.readFileSync(file)); }
function savePng(file, png) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, PNG.sync.write(png)); }
function blank(width, height) { return new PNG({ width, height }); }
function ix(png, x, y) { return (y * png.width + x) * 4; }
function get(png, x, y) { const i = ix(png, x, y); return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]]; }
function set(png, x, y, rgba) { const i = ix(png, x, y); png.data[i] = rgba[0]; png.data[i + 1] = rgba[1]; png.data[i + 2] = rgba[2]; png.data[i + 3] = rgba[3]; }

function parseAtlas(text) {
  const lines = text.split(/\r?\n/);
  const regions = {};
  for (let i = 0; i < lines.length; i++) {
    const name = lines[i].trim();
    if (!slots.includes(name)) continue;
    const region = { name };
    for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
      const line = lines[j].trim();
      let match;
      if (line.startsWith('rotate:')) region.rotate = line.endsWith('true');
      if ((match = line.match(/^xy:\s*(\d+),\s*(\d+)/))) { region.x = Number(match[1]); region.y = Number(match[2]); }
      if ((match = line.match(/^size:\s*(\d+),\s*(\d+)/))) { region.w = Number(match[1]); region.h = Number(match[2]); }
    }
    regions[name] = region;
  }
  return regions;
}

function rotateCcw(src) {
  const dst = blank(src.height, src.width);
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) set(dst, y, src.width - 1 - x, get(src, x, y));
  return dst;
}

function rotateCw(src) {
  const dst = blank(src.height, src.width);
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) set(dst, src.height - 1 - y, x, get(src, x, y));
  return dst;
}

function extract(atlas, region) {
  const packedW = region.rotate ? region.h : region.w;
  const packedH = region.rotate ? region.w : region.h;
  const top = atlas.height - region.y - packedH;
  const packed = blank(packedW, packedH);
  for (let y = 0; y < packedH; y++) for (let x = 0; x < packedW; x++) set(packed, x, y, get(atlas, region.x + x, top + y));
  return region.rotate ? rotateCcw(packed) : packed;
}

function write(atlas, region, part) {
  const packed = region.rotate ? rotateCw(part) : part;
  const top = atlas.height - region.y - packed.height;
  for (let y = 0; y < packed.height; y++) for (let x = 0; x < packed.width; x++) set(atlas, region.x + x, top + y, get(packed, x, y));
}

function recolorPixel(r, g, b, a, slotName) {
  if (a <= 8) return [0, 0, 0, 0];
  if (slotName === 'sheep_eye') return [r, g, b, a];
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const lum = (r + g + b) / 3;
  const chroma = max - min;
  if (lum < 82 && chroma < 90) return [r, g, b, a];
  const alreadyBlue = b > r + 14 && b >= g - 16 && b > 92;
  const veryLight = lum > 174;
  const warm = r > 130 && g > 105 && b < 145;
  const neutral = chroma < 80;
  const woolSlot = slotName === 'sheep_body' || slotName === 'sheep_hair' || slotName === 'sheep_light' || slotName === 'sheep_wei';
  if (!(alreadyBlue || veryLight || warm || neutral || woolSlot)) return [r, g, b, a];
  const shade = Math.max(0.52, Math.min(1.2, lum / 190));
  const nr = Math.round(Math.min(120, Math.max(34, 55 * shade)));
  const ng = Math.round(Math.min(190, Math.max(112, 145 * shade)));
  const nb = Math.round(Math.min(255, Math.max(178, 226 * shade * (alreadyBlue ? 1.04 : 1.0))));
  return [nr, ng, nb, a];
}

function recolorPart(src, slotName) {
  const dst = blank(src.width, src.height);
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) set(dst, x, y, recolorPixel(...get(src, x, y), slotName));
  return dst;
}

function stats(png) {
  const out = { alpha: 0, white: 0, yellow: 0, blue: 0, dark: 0, other: 0, light: 0 };
  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i], g = png.data[i + 1], b = png.data[i + 2], a = png.data[i + 3];
    if (a <= 8) continue;
    out.alpha++;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), lum = (r + g + b) / 3;
    if (lum > 218 && max - min < 45) out.white++;
    else if (r > 170 && g > 145 && b < 115) out.yellow++;
    else if (b > r + 18 && b > g - 8 && b > 95) out.blue++;
    else if (lum < 75) out.dark++;
    else out.other++;
    if (lum > 190) out.light++;
  }
  return out;
}

fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(atlasPath, path.join(backupDir, path.basename(atlasPath)));
fs.copyFileSync(atlasTextPath, path.join(backupDir, path.basename(atlasTextPath)));

const atlas = loadPng(atlasPath);
const regions = parseAtlas(fs.readFileSync(atlasTextPath, 'utf8'));
const report = [];

for (const name of slots) {
  const region = regions[name];
  if (!region) throw new Error(`Missing atlas region: ${name}`);
  const before = extract(atlas, region);
  const after = recolorPart(before, name);
  write(atlas, region, after);
  savePng(path.join(outDir, `${name}.png`), after);
  report.push(`${name}: before=${JSON.stringify(stats(before))} after=${JSON.stringify(stats(after))}`);
}

savePng(atlasPath, atlas);
fs.writeFileSync(path.join(outDir, 'manifest.txt'), [
  'Sheep all-wool blue recolor install',
  '',
  'Fix: recolored every non-outline sheep_* atlas pixel that reads as white, yellow, pale highlight, neutral wool, or prior blue into a unified blue range.',
  'Preserved: transparent pixels, black/dark outlines, and sheep_eye.',
  '',
  `atlas_texture=${path.relative(root, atlasPath).replace(/\\/g, '/')}`,
  `atlas_text=${path.relative(root, atlasTextPath).replace(/\\/g, '/')}`,
  `backup=${path.relative(root, backupDir).replace(/\\/g, '/')}`,
  '',
  ...report,
  '',
].join('\n'));

console.log(`Updated ${path.relative(root, atlasPath)}`);
console.log(`Backup ${path.relative(root, backupDir)}`);
console.log(report.join('\n'));
