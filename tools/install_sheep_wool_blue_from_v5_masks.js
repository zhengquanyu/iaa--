const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const atlasPath = path.join(root, 'subpackages/game/native/6b/6bc5fc93-b403-4b31-a0e1-7ccff54c45d7.7b5a8.png');
const atlasTextPath = path.join(root, 'subpackages/game/native/d6/d614ee96-d20f-4373-8064-5d92fd589021.ac70a.atlas');
const originalAtlasPath = path.join(root, 'backups/spine_sheep_14_20260610-100729/6bc5fc93-b403-4b31-a0e1-7ccff54c45d7.7b5a8.png');
const staticBlueReferenceDir = path.join(root, 'animal_art_extracted/preview_variants/static_game_sheep_blue_v5_actual_level_sprite');
const outDir = path.join(root, 'animal_replacement_spine_parts/21_sheep_wool_blue_from_v5_masks');
const backupDir = path.join(root, 'backups', `spine_sheep_wool_blue_from_v5_masks_${stamp()}`);

const writeSlots = ['sheep_body', 'sheep_hair', 'sheep_light', 'sheep_wei'];
const inspectSlots = [...writeSlots, 'sheep_leg1', 'sheep_leg2', 'sheep_leg3', 'sheep_leg4', 'sheep_ear1', 'sheep_ear2', 'sheep_eye'];
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
    if (!inspectSlots.includes(name)) continue;
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
function isStaticSheepWool(r, g, b, a, slot) {
  if (a === 0) return false;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  const yellowishWool = r >= 210 && g >= 195 && b >= 140 && chroma <= 90;
  const whiteWool = luma >= 190 && chroma <= 55;
  const spineYellowHighlight = luma >= 190 && r >= 190 && g >= 180 && b <= 120 && Math.abs(r - g) <= 36;
  const spineYellowGreenWool = slot !== 'sheep_wei' && luma >= 115 && r >= 120 && g >= 120 && b <= 80 && Math.abs(r - g) <= 28;
  return yellowishWool || whiteWool || spineYellowHighlight || spineYellowGreenWool;
}
function recolorLikeStaticBlueSheep(original, slot) {
  const dst = copyPng(original);
  let changed = 0;
  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      const i = ix(dst, x, y);
      const a = original.data[i + 3];
      const r = original.data[i], g = original.data[i + 1], b = original.data[i + 2];
      if (!isStaticSheepWool(r, g, b, a, slot)) continue;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const normalized = luma / 255;
      const shade = 0.44 + normalized * 0.78;
      const highlight = Math.max(0, normalized - 0.78) * 0.5;
      const next = [];
      for (let c = 0; c < 3; c++) {
        const tinted = blue[c] * shade;
        next[c] = Math.max(0, Math.min(255, Math.round(tinted + (255 - tinted) * highlight)));
      }
      if (dst.data[i] !== next[0] || dst.data[i + 1] !== next[1] || dst.data[i + 2] !== next[2]) changed++;
      dst.data[i] = next[0];
      dst.data[i + 1] = next[1];
      dst.data[i + 2] = next[2];
      dst.data[i + 3] = a;
    }
  }
  return { png: dst, changed };
}
function stats(p) {
  const out = { alpha: 0, blue: 0, white: 0, pale: 0, warm: 0, dark: 0, other: 0 };
  for (let i = 0; i < p.data.length; i += 4) {
    const r = p.data[i], g = p.data[i + 1], b = p.data[i + 2], a = p.data[i + 3];
    if (a <= 8) continue;
    out.alpha++;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    if (b > r + 14 && b >= g - 18 && b > 92) out.blue++;
    else if (lum > 170 && chroma < 80) out.white++;
    else if (lum > 115 && chroma < 110) out.pale++;
    else if (r > g + 18 && r > b + 20) out.warm++;
    else if (lum < 85) out.dark++;
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
  'Sheep wool blue install from approved v5 color masks',
  '',
  'Base: original white game atlas backup.',
  'Changed slots: sheep_body, sheep_hair, sheep_light, sheep_wei using the same bright-wool thresholds and blue shading as static_game_sheep_blue_v5_actual_level_sprite, plus Spine atlas high-yellow and yellow-green wool highlights that do not exist in the static sprite.',
  'Preserved: legs, ears, eye, all non-sheep regions, skeleton, atlas text, orig/offset/rotate, bone animation.',
  '',
  `target_atlas=${path.relative(root, atlasPath).replace(/\\/g, '/')}`,
  `source_original_atlas=${path.relative(root, originalAtlasPath).replace(/\\/g, '/')}`,
  `blue_reference=${path.relative(root, staticBlueReferenceDir).replace(/\\/g, '/')}`,
  `backup=${path.relative(root, backupDir).replace(/\\/g, '/')}`,
  '',
];
for (const slot of ['sheep_body', 'sheep_hair', 'sheep_light']) {
  const before = extractLogical(atlas, regions[slot]);
  const after = recolorLikeStaticBlueSheep(before, slot);
  writeLogical(atlas, regions[slot], after.png);
  savePng(path.join(outDir, `${slot}.png`), after.png);
  report.push(`${slot}: changed=${after.changed}, before=${JSON.stringify(stats(before))}, after=${JSON.stringify(stats(after.png))}`);
}
{
  const slot = 'sheep_wei';
  const before = extractLogical(atlas, regions[slot]);
  const after = recolorLikeStaticBlueSheep(before, slot);
  writeLogical(atlas, regions[slot], after.png);
  savePng(path.join(outDir, `${slot}.png`), after.png);
  report.push(`${slot}: changed=${after.changed}, before=${JSON.stringify(stats(before))}, after=${JSON.stringify(stats(after.png))}`);
}
for (const slot of ['sheep_leg1', 'sheep_leg2', 'sheep_leg3', 'sheep_leg4', 'sheep_ear1', 'sheep_ear2', 'sheep_eye']) {
  const part = extractLogical(atlas, regions[slot]);
  savePng(path.join(outDir, `preserved_${slot}.png`), part);
  report.push(`${slot}: preserved=true, stats=${JSON.stringify(stats(part))}`);
}
savePng(atlasPath, atlas);
fs.writeFileSync(path.join(outDir, 'manifest.txt'), report.join('\n') + '\n');
console.log(`Updated ${path.relative(root, atlasPath)}`);
console.log(`Backup ${path.relative(root, backupDir)}`);
console.log(report.join('\n'));
