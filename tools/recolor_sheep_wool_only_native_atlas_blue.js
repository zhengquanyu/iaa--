const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const atlasPath = path.join(root, 'subpackages/game/native/6b/6bc5fc93-b403-4b31-a0e1-7ccff54c45d7.7b5a8.png');
const atlasTextPath = path.join(root, 'subpackages/game/native/d6/d614ee96-d20f-4373-8064-5d92fd589021.ac70a.atlas');
const originalAtlasPath = path.join(root, 'backups/spine_sheep_14_20260610-100729/6bc5fc93-b403-4b31-a0e1-7ccff54c45d7.7b5a8.png');
const outDir = path.join(root, 'animal_replacement_spine_parts/20_sheep_wool_only_native_blue');
const backupDir = path.join(root, 'backups', `spine_sheep_wool_only_native_blue_${stamp()}`);
const sheepSlots = ['sheep_body', 'sheep_hair', 'sheep_light', 'sheep_wei'];
const preserveSlots = ['sheep_leg1', 'sheep_leg2', 'sheep_leg3', 'sheep_leg4', 'sheep_ear1', 'sheep_ear2', 'sheep_eye'];
const allSlots = [...sheepSlots, ...preserveSlots];
const blue = [78, 163, 232];

function stamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function loadPng(file) { return PNG.sync.read(fs.readFileSync(file)); }
function savePng(file, png) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, PNG.sync.write(png)); }
function blank(width, height) { return new PNG({ width, height }); }
function ix(p, x, y) { return (y * p.width + x) * 4; }
function get(p, x, y) { const i = ix(p, x, y); return [p.data[i], p.data[i + 1], p.data[i + 2], p.data[i + 3]]; }
function set(p, x, y, rgba) { const i = ix(p, x, y); p.data[i] = rgba[0]; p.data[i + 1] = rgba[1]; p.data[i + 2] = rgba[2]; p.data[i + 3] = rgba[3]; }
function copyPng(src) { const dst = blank(src.width, src.height); src.data.copy(dst.data); return dst; }

function parseAtlas(text) {
  const lines = text.split(/\r?\n/);
  const regions = {};
  for (let i = 0; i < lines.length; i++) {
    const name = lines[i].trim();
    if (!allSlots.includes(name)) continue;
    const region = { name };
    for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
      const line = lines[j].trim();
      let m;
      if (line.startsWith('rotate:')) region.rotate = line.endsWith('true');
      if ((m = line.match(/^xy:\s*(\d+),\s*(\d+)/))) [region.x, region.y] = [Number(m[1]), Number(m[2])];
      if ((m = line.match(/^size:\s*(\d+),\s*(\d+)/))) [region.w, region.h] = [Number(m[1]), Number(m[2])];
      if ((m = line.match(/^orig:\s*(\d+),\s*(\d+)/))) [region.origW, region.origH] = [Number(m[1]), Number(m[2])];
      if ((m = line.match(/^offset:\s*(-?\d+),\s*(-?\d+)/))) [region.offsetX, region.offsetY] = [Number(m[1]), Number(m[2])];
    }
    regions[name] = region;
  }
  return regions;
}
function rotateCcw(src) { const dst = blank(src.height, src.width); for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) set(dst, y, src.width - 1 - x, get(src, x, y)); return dst; }
function rotateCw(src) { const dst = blank(src.height, src.width); for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) set(dst, src.height - 1 - y, x, get(src, x, y)); return dst; }
function extractLogical(atlas, region) {
  const packedW = region.rotate ? region.h : region.w;
  const packedH = region.rotate ? region.w : region.h;
  const top = atlas.height - region.y - packedH;
  const packed = blank(packedW, packedH);
  for (let y = 0; y < packedH; y++) for (let x = 0; x < packedW; x++) set(packed, x, y, get(atlas, region.x + x, top + y));
  return region.rotate ? rotateCcw(packed) : packed;
}
function writeLogical(atlas, region, logical) {
  if (logical.width !== region.w || logical.height !== region.h) throw new Error(`${region.name} size mismatch ${logical.width}x${logical.height} vs ${region.w}x${region.h}`);
  const packed = region.rotate ? rotateCw(logical) : logical;
  const top = atlas.height - region.y - packed.height;
  for (let y = 0; y < packed.height; y++) for (let x = 0; x < packed.width; x++) set(atlas, region.x + x, top + y, get(packed, x, y));
}
function isWoolWhite(r, g, b, a, slot) {
  if (a <= 8) return false;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const chroma = max - min;
  if (lum < 150 || chroma > 54) return false;
  // Preserve black outlines, colored face/skin pixels, and warm ear/leg/tan pixels.
  if (r > g + 22 && r > b + 28 && lum < 215) return false;
  if (slot === 'sheep_wei') return lum > 165 && chroma < 48;
  return true;
}
function recolorWool(src, slot) {
  const dst = copyPng(src);
  let changed = 0;
  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      const i = ix(dst, x, y);
      const r = dst.data[i], g = dst.data[i + 1], b = dst.data[i + 2], a = dst.data[i + 3];
      if (!isWoolWhite(r, g, b, a, slot)) continue;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const shade = Math.max(0.58, Math.min(1.15, lum / 210));
      const highlight = Math.max(0, lum - 220) / 35;
      for (let c = 0; c < 3; c++) {
        const tinted = blue[c] * shade;
        dst.data[i + c] = Math.max(0, Math.min(255, Math.round(tinted + (255 - tinted) * Math.min(0.28, highlight * 0.18))));
      }
      changed++;
    }
  }
  return { png: dst, changed };
}
function stats(p) {
  const out = { alpha: 0, whiteWoolCandidate: 0, blue: 0, dark: 0, other: 0 };
  for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
    const [r, g, b, a] = get(p, x, y);
    if (a <= 8) continue;
    out.alpha++;
    const lum = (r + g + b) / 3, chroma = Math.max(r, g, b) - Math.min(r, g, b);
    if (b > r + 14 && b >= g - 18 && b > 92) out.blue++;
    else if (lum < 82) out.dark++;
    else if (lum > 150 && chroma < 54) out.whiteWoolCandidate++;
    else out.other++;
  }
  return out;
}
function samePixels(a, b) {
  if (a.width !== b.width || a.height !== b.height) return false;
  for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) return false;
  return true;
}

fs.mkdirSync(backupDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(atlasPath, path.join(backupDir, path.basename(atlasPath)));
fs.copyFileSync(atlasTextPath, path.join(backupDir, path.basename(atlasTextPath)));

if (!fs.existsSync(originalAtlasPath)) throw new Error(`Missing original atlas backup: ${originalAtlasPath}`);
const atlas = loadPng(originalAtlasPath);
const regions = parseAtlas(fs.readFileSync(atlasTextPath, 'utf8'));
const report = [
  'Sheep wool-only native atlas blue install',
  '',
  'Base: restored from original white sheep atlas backup, then recolored only sheep wool slots.',
  'Changed slots: sheep_body, sheep_hair, sheep_light, sheep_wei.',
  'Preserved slots unchanged: sheep_leg1-4, sheep_ear1-2, sheep_eye, all non-sheep atlas regions.',
  'No skeleton, atlas text, bone, slot, attachment, mesh, uv, triangle, size, orig, or offset data changed.',
  '',
  `target_atlas=${path.relative(root, atlasPath).replace(/\\/g, '/')}`,
  `source_original_atlas=${path.relative(root, originalAtlasPath).replace(/\\/g, '/')}`,
  `atlas_text=${path.relative(root, atlasTextPath).replace(/\\/g, '/')}`,
  `backup=${path.relative(root, backupDir).replace(/\\/g, '/')}`,
  '',
];
for (const name of sheepSlots) {
  const region = regions[name];
  const before = extractLogical(atlas, region);
  const recolored = recolorWool(before, name);
  writeLogical(atlas, region, recolored.png);
  savePng(path.join(outDir, `${name}.png`), recolored.png);
  report.push(`${name}: changed=${recolored.changed}, before=${JSON.stringify(stats(before))}, after=${JSON.stringify(stats(recolored.png))}`);
}
for (const name of preserveSlots) {
  const region = regions[name];
  const part = extractLogical(atlas, region);
  savePng(path.join(outDir, `preserved_${name}.png`), part);
  report.push(`${name}: preserved=true, stats=${JSON.stringify(stats(part))}`);
}
savePng(atlasPath, atlas);
fs.writeFileSync(path.join(outDir, 'manifest.txt'), report.join('\n') + '\n');
console.log(`Updated ${path.relative(root, atlasPath)}`);
console.log(`Backup ${path.relative(root, backupDir)}`);
console.log(report.join('\n'));