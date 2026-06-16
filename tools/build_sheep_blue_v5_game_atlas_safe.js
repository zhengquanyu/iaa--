const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const atlasPath = path.join(root, 'subpackages', 'game', 'native', '6b', '6bc5fc93-b403-4b31-a0e1-7ccff54c45d7.7b5a8.png');
const atlasTextPath = path.join(root, 'subpackages', 'game', 'native', 'd6', 'd614ee96-d20f-4373-8064-5d92fd589021.ac70a.atlas');
const originalPartsRoot = path.join(root, 'animal_art_extracted', 'level_spine', 'animals_by_body');
const approvedBlueDir = path.join(root, 'animal_art_extracted', 'preview_variants', 'sheep_back_wool_blue_test_v5_color_mask');
const approvedTailPath = path.join(root, 'animal_art_extracted', 'preview_variants', 'sheep_blue_v5_spine_runtime_animation_preview_v4_transparent_clean_edges', 'blue_sheep_wei.png');
const outDir = path.join(root, 'animal_replacement_spine_parts', '14_sheep_blue_v5_safe_game_atlas');
const backupDir = path.join(root, 'backups', `spine_sheep_blue_v5_safe_${stamp()}`);

const slots = [
  'sheep_body',
  'sheep_leg1',
  'sheep_leg2',
  'sheep_leg3',
  'sheep_leg4',
  'sheep_eye',
  'sheep_ear1',
  'sheep_ear2',
  'sheep_hair',
  'sheep_wei',
  'sheep_light',
];

function stamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function loadPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function savePng(file, png) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(png));
}

function blank(width, height) {
  return new PNG({ width, height });
}

function getPixel(png, x, y) {
  const i = (y * png.width + x) * 4;
  return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]];
}

function setPixel(png, x, y, rgba) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const i = (y * png.width + x) * 4;
  png.data[i] = rgba[0];
  png.data[i + 1] = rgba[1];
  png.data[i + 2] = rgba[2];
  png.data[i + 3] = rgba[3];
}

function rotateCw(src) {
  const dst = blank(src.height, src.width);
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) setPixel(dst, src.height - 1 - y, x, getPixel(src, x, y));
  }
  return dst;
}

function rotateCcw(src) {
  const dst = blank(src.height, src.width);
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) setPixel(dst, y, src.width - 1 - x, getPixel(src, x, y));
  }
  return dst;
}

function parseAtlas(text) {
  const lines = text.split(/\r?\n/);
  const page = { width: 0, height: 0, regions: {} };
  const sizeLine = lines.find(line => line.startsWith('size:'));
  if (sizeLine) {
    const m = sizeLine.match(/size:\s*(\d+),\s*(\d+)/);
    page.width = Number(m[1]);
    page.height = Number(m[2]);
  }
  for (let i = 0; i < lines.length; i++) {
    const name = lines[i].trim();
    if (!slots.includes(name)) continue;
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
    page.regions[name] = region;
  }
  return page;
}

function findOriginalPartsDir() {
  const dirs = fs.readdirSync(originalPartsRoot, { withFileTypes: true }).filter(entry => entry.isDirectory());
  for (const dir of dirs) {
    const full = path.join(originalPartsRoot, dir.name);
    if (fs.existsSync(path.join(full, 'sheep_body.png')) && fs.existsSync(path.join(full, 'sheep_wei.png'))) return full;
  }
  throw new Error(`Could not find sheep parts under ${originalPartsRoot}`);
}

function alphaCount(png) {
  let count = 0;
  for (let i = 3; i < png.data.length; i += 4) if (png.data[i] > 0) count++;
  return count;
}

function samePng(a, b) {
  if (a.width !== b.width || a.height !== b.height) return false;
  if (a.data.length !== b.data.length) return false;
  for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) return false;
  return true;
}

function clearAtlasRegion(atlas, region) {
  const packedW = region.rotate ? region.h : region.w;
  const packedH = region.rotate ? region.w : region.h;
  const top = atlas.height - region.y - packedH;
  for (let y = 0; y < packedH; y++) {
    for (let x = 0; x < packedW; x++) setPixel(atlas, region.x + x, top + y, [0, 0, 0, 0]);
  }
}

function cropPacked(atlas, region) {
  const packedW = region.rotate ? region.h : region.w;
  const packedH = region.rotate ? region.w : region.h;
  const top = atlas.height - region.y - packedH;
  const dst = blank(packedW, packedH);
  for (let y = 0; y < packedH; y++) {
    for (let x = 0; x < packedW; x++) setPixel(dst, x, y, getPixel(atlas, region.x + x, top + y));
  }
  return dst;
}

function extractLogical(atlas, region) {
  const packed = cropPacked(atlas, region);
  return region.rotate ? rotateCcw(packed) : packed;
}

function writeAtlasRegion(atlas, region, logicalPart) {
  if (logicalPart.width !== region.w || logicalPart.height !== region.h) {
    throw new Error(`Size mismatch for ${region.name}: part=${logicalPart.width}x${logicalPart.height}, atlas_region=${region.w}x${region.h}`);
  }
  const packed = region.rotate ? rotateCw(logicalPart) : logicalPart;
  const top = atlas.height - region.y - packed.height;
  clearAtlasRegion(atlas, region);
  for (let y = 0; y < packed.height; y++) {
    for (let x = 0; x < packed.width; x++) setPixel(atlas, region.x + x, top + y, getPixel(packed, x, y));
  }
}

function main() {
  if (!fs.existsSync(atlasPath)) throw new Error(`Missing atlas texture: ${atlasPath}`);
  if (!fs.existsSync(atlasTextPath)) throw new Error(`Missing atlas text: ${atlasTextPath}`);
  if (!fs.existsSync(approvedBlueDir)) throw new Error(`Missing approved blue dir: ${approvedBlueDir}`);
  if (!fs.existsSync(approvedTailPath)) throw new Error(`Missing approved blue tail: ${approvedTailPath}`);

  const atlas = loadPng(atlasPath);
  const atlasInfo = parseAtlas(fs.readFileSync(atlasTextPath, 'utf8'));
  const originalPartsDir = findOriginalPartsDir();
  const originalPart = name => {
    const packed = loadPng(path.join(originalPartsDir, `${name}.png`));
    return atlasInfo.regions[name].rotate ? rotateCcw(packed) : packed;
  };
  const bluePart = file => loadPng(path.join(approvedBlueDir, file));

  const parts = Object.fromEntries(slots.map(name => [name, originalPart(name)]));
  parts.sheep_body = bluePart('blue_sheep_body.png');
  parts.sheep_hair = bluePart('blue_sheep_hair.png');
  parts.sheep_light = bluePart('blue_sheep_light.png');
  parts.sheep_wei = loadPng(approvedTailPath);

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(atlasPath, path.join(backupDir, path.basename(atlasPath)));
  fs.copyFileSync(atlasTextPath, path.join(backupDir, path.basename(atlasTextPath)));

  const report = [
    'Blue sheep v5 safe game-atlas install',
    '',
    'No skeleton, atlas text, bone, slot, attachment, mesh, uv, or triangle data was changed.',
    'Only sheep_* atlas texture pixels were replaced.',
    'All rotate:true parts are converted to logical Spine orientation, validated against atlas size, then packed back using atlas rotate.',
    'No part is resized.',
    '',
    `atlas_texture=${path.relative(root, atlasPath).replace(/\\/g, '/')}`,
    `atlas_text=${path.relative(root, atlasTextPath).replace(/\\/g, '/')}`,
    `backup=${path.relative(root, backupDir).replace(/\\/g, '/')}`,
    `blue_body_hair_light=${path.relative(root, approvedBlueDir).replace(/\\/g, '/')}`,
    `blue_tail=${path.relative(root, approvedTailPath).replace(/\\/g, '/')}`,
    '',
    'written_regions:',
  ];

  for (const name of slots) {
    const region = atlasInfo.regions[name];
    if (!region) throw new Error(`Atlas region not found: ${name}`);
    writeAtlasRegion(atlas, region, parts[name]);
    const after = extractLogical(atlas, region);
    const exact = samePng(after, parts[name]);
    if (!exact) throw new Error(`Post-write verification failed for ${name}`);
    savePng(path.join(outDir, `${name}.png`), parts[name]);
    report.push(`${name}: logical=${parts[name].width}x${parts[name].height}, atlas_rotate=${region.rotate}, atlas_orig=${region.origW}x${region.origH}, atlas_offset=${region.offsetX},${region.offsetY}, alpha=${alphaCount(parts[name])}, exact_post_write=true`);
  }

  savePng(atlasPath, atlas);
  fs.writeFileSync(path.join(outDir, 'manifest.txt'), `${report.join('\n')}\n`);
  console.log(`Updated ${path.relative(root, atlasPath)}`);
  console.log(`Backup written to ${path.relative(root, backupDir)}`);
  console.log(`Manifest written to ${path.relative(root, path.join(outDir, 'manifest.txt'))}`);
}

main();
