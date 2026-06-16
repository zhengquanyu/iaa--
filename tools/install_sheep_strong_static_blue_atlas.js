const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const atlasPath = path.join(root, 'subpackages/game/native/6b/6bc5fc93-b403-4b31-a0e1-7ccff54c45d7.7b5a8.png');
const atlasTextPath = path.join(root, 'subpackages/game/native/d6/d614ee96-d20f-4373-8064-5d92fd589021.ac70a.atlas');
const originalAtlasPath = path.join(root, 'backups/spine_sheep_14_20260610-100729/6bc5fc93-b403-4b31-a0e1-7ccff54c45d7.7b5a8.png');
const outDir = path.join(root, 'animal_replacement_spine_parts/22_sheep_strong_static_blue_atlas');
const backupDir = path.join(root, 'backups', `spine_sheep_strong_static_blue_atlas_${stamp()}`);

const writeSlots = ['sheep_body', 'sheep_hair', 'sheep_light', 'sheep_wei'];
const preservedSlots = ['sheep_leg1', 'sheep_leg2', 'sheep_leg3', 'sheep_leg4', 'sheep_ear1', 'sheep_ear2', 'sheep_eye'];
const allSlots = [...writeSlots, ...preservedSlots];
const blue = [88, 166, 232];

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
  if (logical.width !== region.w || logical.height !== region.h) throw new Error(`${region.name} size mismatch`);
  const packed = region.rotate ? rotateCw(logical) : logical;
  const top = atlas.height - region.y - packed.height;
  for (let y = 0; y < packed.height; y++) for (let x = 0; x < packed.width; x++) set(atlas, region.x + x, top + y, get(packed, x, y));
}
function shouldKeepOutline(r, g, b, a) {
  if (a <= 8) return true;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum < 58;
}
function mapToStaticBlue(r, g, b) {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const normalized = Math.max(0, Math.min(1, lum / 255));
  const shade = 0.38 + normalized * 0.9;
  const highlight = Math.max(0, normalized - 0.74) * 0.55;
  return blue.map(c => {
    const tinted = c * shade;
    return Math.max(0, Math.min(255, Math.round(tinted + (255 - tinted) * highlight)));
  });
}
function recolorStrong(original) {
  const dst = copyPng(original);
  let changed = 0;
  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      const i = ix(dst, x, y);
      const r = original.data[i], g = original.data[i + 1], b = original.data[i + 2], a = original.data[i + 3];
      if (shouldKeepOutline(r, g, b, a)) continue;
      const next = mapToStaticBlue(r, g, b);
      if (r !== next[0] || g !== next[1] || b !== next[2]) changed++;
      dst.data[i] = next[0];
      dst.data[i + 1] = next[1];
      dst.data[i + 2] = next[2];
      dst.data[i + 3] = a;
    }
  }
  return { png: dst, changed };
}
function stats(p) {
  const out = { alpha: 0, blue: 0, white: 0, warm: 0, dark: 0, other: 0 };
  for (let i = 0; i < p.data.length; i += 4) {
    const r = p.data[i], g = p.data[i + 1], b = p.data[i + 2], a = p.data[i + 3];
    if (a <= 8) continue;
    out.alpha++;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    if (b > r + 14 && b >= g - 18 && b > 92) out.blue++;
    else if (lum > 170 && chroma < 80) out.white++;
    else if (r > g + 18 && r > b + 20) out.warm++;
    else if (lum < 70) out.dark++;
    else out.other++;
  }
  return out;
}

fs.mkdirSync(backupDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(atlasPath, path.join(backupDir, path.basename(atlasPath)));
fs.copyFileSync(atlasTextPath, path.join(backupDir, path.basename(atlasTextPath)));

const atlas = loadPng(originalAtlasPath);
const regions = parseAtlas(fs.readFileSync(atlasTextPath, 'utf8'));
const report = [
  'Strong static-blue sheep atlas install',
  '',
  'Base: original white game atlas backup.',
  'Changed: sheep_body, sheep_hair, sheep_light, sheep_wei. Every visible non-outline pixel in those slots is remapped to the static img_yx_yang blue range.',
  'Preserved: legs, ears, eye, atlas text, skeleton, bones, slots, mesh vertices/uvs/triangles, rotate/orig/offset.',
  '',
  `target_atlas=${path.relative(root, atlasPath).replace(/\\/g, '/')}`,
  `source_original_atlas=${path.relative(root, originalAtlasPath).replace(/\\/g, '/')}`,
  `backup=${path.relative(root, backupDir).replace(/\\/g, '/')}`,
  '',
];

for (const slot of writeSlots) {
  const before = extractLogical(atlas, regions[slot]);
  const after = recolorStrong(before);
  writeLogical(atlas, regions[slot], after.png);
  savePng(path.join(outDir, `${slot}.png`), after.png);
  report.push(`${slot}: changed=${after.changed}, before=${JSON.stringify(stats(before))}, after=${JSON.stringify(stats(after.png))}`);
}
for (const slot of preservedSlots) {
  const part = extractLogical(atlas, regions[slot]);
  savePng(path.join(outDir, `preserved_${slot}.png`), part);
  report.push(`${slot}: preserved=true, stats=${JSON.stringify(stats(part))}`);
}

savePng(atlasPath, atlas);
fs.writeFileSync(path.join(outDir, 'manifest.txt'), report.join('\n') + '\n');
console.log(`Updated ${path.relative(root, atlasPath)}`);
console.log(`Backup ${path.relative(root, backupDir)}`);
console.log(report.join('\n'));
