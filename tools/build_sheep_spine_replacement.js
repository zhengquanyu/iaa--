const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const atlasPath = path.join(root, 'subpackages', 'game', 'native', '6b', '6bc5fc93-b403-4b31-a0e1-7ccff54c45d7.7b5a8.png');
const atlasTextPath = path.join(root, 'subpackages', 'game', 'native', 'd6', 'd614ee96-d20f-4373-8064-5d92fd589021.ac70a.atlas');
const originalPartsDir = path.join(root, 'animal_art_extracted', 'level_spine', 'animals_by_body', '小羊');
const approvedBlueDir = path.join(root, 'animal_art_extracted', 'preview_variants', 'sheep_back_wool_blue_test_v5_color_mask');
const approvedTailPath = path.join(root, 'animal_art_extracted', 'preview_variants', 'sheep_blue_v5_spine_runtime_animation_preview_v3_tail_blue_region_offset', 'blue_sheep_wei.png');
const outDir = path.join(root, 'animal_replacement_spine_parts', '14_sheep');
const backupDir = path.join(root, 'backups', `spine_sheep_14_${stamp()}`);

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

function blank(w, h) {
  return new PNG({ width: w, height: h });
}

function get(px, x, y) {
  const i = (y * px.width + x) * 4;
  return [px.data[i], px.data[i + 1], px.data[i + 2], px.data[i + 3]];
}

function set(px, x, y, rgba) {
  if (x < 0 || y < 0 || x >= px.width || y >= px.height) return;
  const i = (y * px.width + x) * 4;
  px.data[i] = rgba[0];
  px.data[i + 1] = rgba[1];
  px.data[i + 2] = rgba[2];
  px.data[i + 3] = rgba[3];
}

function copyPng(src) {
  const dst = blank(src.width, src.height);
  src.data.copy(dst.data);
  return dst;
}

function removeWhiteBackground(src) {
  const dst = copyPng(src);
  const bg = new Uint8Array(dst.width * dst.height);
  const queue = [];
  const nearWhite = (x, y) => {
    const [r, g, b, a] = get(dst, x, y);
    const min = Math.min(r, g, b), max = Math.max(r, g, b);
    return a > 0 && (r + g + b) / 3 > 232 && max - min < 28;
  };
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= dst.width || y >= dst.height) return;
    const idx = y * dst.width + x;
    if (bg[idx] || !nearWhite(x, y)) return;
    bg[idx] = 1;
    queue.push([x, y]);
  };
  for (let x = 0; x < dst.width; x++) { push(x, 0); push(x, dst.height - 1); }
  for (let y = 0; y < dst.height; y++) { push(0, y); push(dst.width - 1, y); }
  for (let q = 0; q < queue.length; q++) {
    const [x, y] = queue[q];
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      const i = (y * dst.width + x) * 4;
      if (bg[y * dst.width + x]) dst.data[i + 3] = 0;
    }
  }
  return trimAlpha(dst, 6);
}

function trimAlpha(src, threshold) {
  let minX = src.width, minY = src.height, maxX = -1, maxY = -1;
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const a = src.data[(y * src.width + x) * 4 + 3];
      if (a > threshold) {
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX || maxY < minY) return blank(1, 1);
  return crop(src, minX, minY, maxX - minX + 1, maxY - minY + 1);
}

function crop(src, x, y, w, h) {
  const dst = blank(w, h);
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) set(dst, xx, yy, get(src, x + xx, y + yy));
  }
  return dst;
}

function resize(src, w, h) {
  const dst = blank(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.min(src.width - 1, Math.max(0, Math.round((x + 0.5) * src.width / w - 0.5)));
      const sy = Math.min(src.height - 1, Math.max(0, Math.round((y + 0.5) * src.height / h - 0.5)));
      set(dst, x, y, get(src, sx, sy));
    }
  }
  return dst;
}

function fitContain(src, w, h, scale = 1, xBias = 0, yBias = 0) {
  const dst = blank(w, h);
  const s = Math.min(w / src.width, h / src.height) * scale;
  const rw = Math.max(1, Math.round(src.width * s));
  const rh = Math.max(1, Math.round(src.height * s));
  const resized = resize(src, rw, rh);
  const ox = Math.round((w - rw) / 2 + xBias * (w - rw) / 2);
  const oy = Math.round((h - rh) / 2 + yBias * (h - rh) / 2);
  blit(dst, resized, ox, oy);
  return dst;
}

function fitStretch(src, w, h) {
  return resize(src, w, h);
}

function blit(dst, src, ox, oy) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const rgba = get(src, x, y);
      if (rgba[3]) set(dst, ox + x, oy + y, rgba);
    }
  }
}

function ovalMask(src, cx, cy, rx, ry, soft = 0.08) {
  const dst = copyPng(src);
  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const d = Math.sqrt(nx * nx + ny * ny);
      const i = (y * dst.width + x) * 4 + 3;
      if (d > 1) dst.data[i] = 0;
      else if (d > 1 - soft) dst.data[i] = Math.round(dst.data[i] * (1 - d) / soft);
    }
  }
  return trimAlpha(dst, 1);
}

function rectMask(src, x0, y0, x1, y1) {
  const dst = blank(Math.max(1, x1 - x0), Math.max(1, y1 - y0));
  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) set(dst, x, y, get(src, x0 + x, y0 + y));
  }
  return trimAlpha(dst, 1);
}

function rectCanvas(src, x0, y0, x1, y1, w, h) {
  return fitStretch(rectMask(src, x0, y0, x1, y1), w, h);
}

function parseAtlas(text) {
  const lines = text.split(/\r?\n/);
  const page = { width: 0, height: 0, regions: {} };
  const sizeLine = lines.find(line => line.startsWith('size:'));
  if (sizeLine) {
    const [, w, h] = sizeLine.match(/size:\s*(\d+),(\d+)/) || [];
    page.width = Number(w); page.height = Number(h);
  }
  for (let i = 0; i < lines.length; i++) {
    const name = lines[i].trim();
    if (!slots.includes(name)) continue;
    const region = { name };
    for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
      const line = lines[j].trim();
      if (line.startsWith('rotate:')) region.rotate = line.endsWith('true');
      if (line.startsWith('xy:')) {
        const [, x, y] = line.match(/xy:\s*(\d+),\s*(\d+)/) || [];
        region.x = Number(x); region.y = Number(y);
      }
      if (line.startsWith('size:')) {
        const [, w, h] = line.match(/size:\s*(\d+),\s*(\d+)/) || [];
        region.w = Number(w); region.h = Number(h);
      }
    }
    page.regions[name] = region;
  }
  return page;
}

function rotateCw(src) {
  const dst = blank(src.height, src.width);
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) set(dst, src.height - 1 - y, x, get(src, x, y));
  }
  return dst;
}

function clearAtlasRegion(atlas, region) {
  const packedW = region.rotate ? region.h : region.w;
  const packedH = region.rotate ? region.w : region.h;
  const top = atlas.height - region.y - packedH;
  for (let y = 0; y < packedH; y++) {
    for (let x = 0; x < packedW; x++) set(atlas, region.x + x, top + y, [0, 0, 0, 0]);
  }
}

function writeAtlasRegion(atlas, region, part) {
  const fitted = fitContain(part, region.w, region.h, 1.0);
  const packed = region.rotate ? rotateCw(fitted) : fitted;
  const top = atlas.height - region.y - packed.height;
  clearAtlasRegion(atlas, region);
  blit(atlas, packed, region.x, top);
}

function alphaCount(png) {
  let count = 0;
  for (let i = 3; i < png.data.length; i += 4) if (png.data[i] > 8) count++;
  return count;
}

function main() {
  if (!fs.existsSync(atlasPath)) throw new Error(`Missing atlas texture: ${atlasPath}`);
  if (!fs.existsSync(atlasTextPath)) throw new Error(`Missing atlas text: ${atlasTextPath}`);
  if (!fs.existsSync(originalPartsDir)) throw new Error(`Missing original sheep parts: ${originalPartsDir}`);
  if (!fs.existsSync(approvedBlueDir)) throw new Error(`Missing approved blue sheep parts: ${approvedBlueDir}`);

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(atlasPath, path.join(backupDir, path.basename(atlasPath)));
  fs.copyFileSync(atlasTextPath, path.join(backupDir, path.basename(atlasTextPath)));

  const atlas = loadPng(atlasPath);
  const atlasInfo = parseAtlas(fs.readFileSync(atlasTextPath, 'utf8'));

  const originalPart = name => loadPng(path.join(originalPartsDir, `${name}.png`));
  const approvedBluePart = file => loadPng(path.join(approvedBlueDir, file));
  const parts = Object.fromEntries(slots.map(name => [name, originalPart(name)]));
  parts.sheep_body = approvedBluePart('blue_sheep_body.png');
  parts.sheep_hair = approvedBluePart('blue_sheep_hair.png');
  parts.sheep_light = approvedBluePart('blue_sheep_light.png');
  if (fs.existsSync(approvedTailPath)) parts.sheep_wei = loadPng(approvedTailPath);

  for (const name of slots) {
    const region = atlasInfo.regions[name];
    if (!region) throw new Error(`Atlas region not found: ${name}`);
    savePng(path.join(outDir, `${name}.png`), parts[name]);
    writeAtlasRegion(atlas, region, parts[name]);
  }

  savePng(atlasPath, atlas);

  const report = slots.map(name => `${name}: ${parts[name].width}x${parts[name].height}, alpha=${alphaCount(parts[name])}`).join('\n');
  fs.writeFileSync(path.join(outDir, 'manifest.txt'), [
    'source=animal_art_extracted/level_spine/animals_by_body/小羊/*.png',
    'blue_source=animal_art_extracted/preview_variants/sheep_back_wool_blue_test_v5_color_mask/blue_sheep_{body,hair,light}.png',
    fs.existsSync(approvedTailPath) ? 'tail_source=animal_art_extracted/preview_variants/sheep_blue_v5_spine_runtime_animation_preview_v3_tail_blue_region_offset/blue_sheep_wei.png' : 'tail_source=original sheep_wei.png',
    'target=subpackages/game/native/6b/6bc5fc93-b403-4b31-a0e1-7ccff54c45d7.7b5a8.png sheep_* atlas regions',
    'notes=Original eye, legs, and ears are preserved so the Spine rig can assemble them instead of using hard-cropped pieces from a flat preview.',
    `backup=${path.relative(root, backupDir).replace(/\\/g, '/')}`,
    '',
    report,
    '',
  ].join('\n'));

  console.log(`Updated ${path.relative(root, atlasPath)}`);
  console.log(`Parts written to ${path.relative(root, outDir)}`);
  console.log(`Backup written to ${path.relative(root, backupDir)}`);
}

main();
