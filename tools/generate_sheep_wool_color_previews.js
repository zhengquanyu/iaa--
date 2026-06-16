const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const bodyRoot = path.join(root, 'animal_art_extracted', 'level_spine', 'animals_by_body');
const skeletonPath = path.join(root, 'animal_art_extracted', 'level_spine', 'exported_spine_files', 'animal.skeleton.json');
const outDir = path.join(root, 'animal_art_extracted', 'preview_variants', 'sheep_wool_colors_shape_preserved');

const colors = {
  blue: { label: 'blue', rgb: [88, 166, 232] },
  pink: { label: 'pink', rgb: [239, 143, 184] },
  purple: { label: 'purple', rgb: [159, 126, 219] },
  brown: { label: 'brown', rgb: [164, 116, 76] },
};

const sheepParts = [
  'sheep_leg4',
  'sheep_leg3',
  'sheep_leg2',
  'sheep_leg1',
  'sheep_body',
  'sheep_light',
  'sheep_wei',
  'sheep_ear2',
  'sheep_ear1',
  'sheep_hair',
  'sheep_eye',
];

function loadPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function savePng(file, png) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(png));
}

function blank(width, height, rgba = [0, 0, 0, 0]) {
  const png = new PNG({ width, height });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = rgba[0];
    png.data[i + 1] = rgba[1];
    png.data[i + 2] = rgba[2];
    png.data[i + 3] = rgba[3];
  }
  return png;
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

function copyPng(src) {
  const dst = blank(src.width, src.height);
  src.data.copy(dst.data);
  return dst;
}

function findSheepDir() {
  const dirs = fs.readdirSync(bodyRoot, { withFileTypes: true }).filter(entry => entry.isDirectory());
  for (const dir of dirs) {
    const full = path.join(bodyRoot, dir.name);
    if (fs.existsSync(path.join(full, 'sheep_body.png')) && fs.existsSync(path.join(full, 'sheep_hair.png'))) return full;
  }
  throw new Error(`Could not find sheep parts under ${bodyRoot}`);
}

function recolorWool(src, targetRgb) {
  const dst = copyPng(src);
  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      const i = (y * dst.width + x) * 4;
      const a = dst.data[i + 3];
      if (a === 0) continue;

      const r = dst.data[i];
      const g = dst.data[i + 1];
      const b = dst.data[i + 2];
      const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const shade = 0.42 + luma * 0.82;
      const highlight = Math.max(0, luma - 0.78) * 0.55;

      for (let c = 0; c < 3; c++) {
        const tinted = targetRgb[c] * shade;
        dst.data[i + c] = Math.max(0, Math.min(255, Math.round(tinted + (255 - tinted) * highlight)));
      }
    }
  }
  return dst;
}

function multiplyMatrix(a, b) {
  return {
    a: a.a * b.a + a.c * b.b,
    b: a.b * b.a + a.d * b.b,
    c: a.a * b.c + a.c * b.d,
    d: a.b * b.c + a.d * b.d,
    tx: a.a * b.tx + a.c * b.ty + a.tx,
    ty: a.b * b.tx + a.d * b.ty + a.ty,
  };
}

function localMatrix(item) {
  const rad = ((item.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const sx = item.scaleX == null ? 1 : item.scaleX;
  const sy = item.scaleY == null ? 1 : item.scaleY;
  return {
    a: cos * sx,
    b: sin * sx,
    c: -sin * sy,
    d: cos * sy,
    tx: item.x || 0,
    ty: item.y || 0,
  };
}

function worldMatrices(skeleton) {
  const bones = new Map(skeleton.bones.map(bone => [bone.name, bone]));
  const cache = new Map();
  const identity = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
  function resolve(name) {
    if (cache.has(name)) return cache.get(name);
    const bone = bones.get(name);
    if (!bone) throw new Error(`Missing bone ${name}`);
    const parent = bone.parent ? resolve(bone.parent) : identity;
    const world = multiplyMatrix(parent, localMatrix(bone));
    cache.set(name, world);
    return world;
  }
  for (const bone of skeleton.bones) resolve(bone.name);
  return cache;
}

function transformPoint(matrix, x, y) {
  return {
    x: matrix.a * x + matrix.c * y + matrix.tx,
    y: matrix.b * x + matrix.d * y + matrix.ty,
  };
}

function partCorners(matrix, attachment) {
  const w = attachment.width || 1;
  const h = attachment.height || 1;
  const x = attachment.x || 0;
  const y = attachment.y || 0;
  const rotation = attachment.rotation || 0;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ].map(([px, py]) => transformPoint(matrix, x + px * cos - py * sin, y + px * sin + py * cos));
}

function sampleNearest(src, u, v) {
  const x = Math.max(0, Math.min(src.width - 1, Math.round(u * (src.width - 1))));
  const y = Math.max(0, Math.min(src.height - 1, Math.round(v * (src.height - 1))));
  return getPixel(src, x, y);
}

function blendPixel(dst, x, y, rgba) {
  if (rgba[3] === 0 || x < 0 || y < 0 || x >= dst.width || y >= dst.height) return;
  const i = (y * dst.width + x) * 4;
  const sa = rgba[3] / 255;
  const da = dst.data[i + 3] / 255;
  const outA = sa + da * (1 - sa);
  if (outA <= 0) return;
  for (let c = 0; c < 3; c++) {
    dst.data[i + c] = Math.round((rgba[c] * sa + dst.data[i + c] * da * (1 - sa)) / outA);
  }
  dst.data[i + 3] = Math.round(outA * 255);
}

function drawTexturedQuad(dst, src, corners) {
  const minX = Math.floor(Math.min(...corners.map(p => p.x)));
  const maxX = Math.ceil(Math.max(...corners.map(p => p.x)));
  const minY = Math.floor(Math.min(...corners.map(p => p.y)));
  const maxY = Math.ceil(Math.max(...corners.map(p => p.y)));

  const p0 = corners[0];
  const p1 = corners[1];
  const p3 = corners[3];
  const ux = p1.x - p0.x;
  const uy = p1.y - p0.y;
  const vx = p3.x - p0.x;
  const vy = p3.y - p0.y;
  const det = ux * vy - uy * vx;
  if (Math.abs(det) < 0.0001) return;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x + 0.5 - p0.x;
      const dy = y + 0.5 - p0.y;
      const u = (dx * vy - dy * vx) / det;
      const v = (ux * dy - uy * dx) / det;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      blendPixel(dst, x, y, sampleNearest(src, u, 1 - v));
    }
  }
}

function buildSetupItems(skeleton) {
  const slots = new Map(skeleton.slots.map(slot => [slot.name, slot]));
  const skin = Array.isArray(skeleton.skins) ? skeleton.skins.find(item => item.name === 'default') : null;
  const attachments = skin && skin.attachments ? skin.attachments : {};
  const matrices = worldMatrices(skeleton);
  return sheepParts.map(name => {
    const slot = slots.get(name);
    const attachment = attachments[name] && attachments[name][name];
    if (!slot || !attachment) throw new Error(`Missing setup attachment for ${name}`);
    return { name, slot, attachment, matrix: matrices.get(slot.bone) };
  });
}

function renderPreview(parts, setupItems, scale = 4, padding = 32) {
  const allCorners = setupItems.flatMap(item => partCorners(item.matrix, item.attachment));
  const minX = Math.min(...allCorners.map(p => p.x));
  const maxX = Math.max(...allCorners.map(p => p.x));
  const minY = Math.min(...allCorners.map(p => p.y));
  const maxY = Math.max(...allCorners.map(p => p.y));
  const width = Math.ceil((maxX - minX) * scale + padding * 2);
  const height = Math.ceil((maxY - minY) * scale + padding * 2);
  const dst = blank(width, height, [255, 255, 255, 0]);

  for (const item of setupItems) {
    const corners = partCorners(item.matrix, item.attachment).map(p => ({
      x: (p.x - minX) * scale + padding,
      y: (maxY - p.y) * scale + padding,
    }));
    drawTexturedQuad(dst, parts[item.name], corners);
  }
  return dst;
}

function paste(dst, src, ox, oy) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) blendPixel(dst, ox + x, oy + y, getPixel(src, x, y));
  }
}

function buildContactSheet(previews) {
  const names = Object.keys(previews);
  const cellW = Math.max(...names.map(name => previews[name].width)) + 80;
  const cellH = Math.max(...names.map(name => previews[name].height)) + 80;
  const dst = blank(cellW * 2, cellH * 2, [246, 246, 246, 255]);
  names.forEach((name, index) => {
    const src = previews[name];
    const col = index % 2;
    const row = Math.floor(index / 2);
    paste(dst, src, col * cellW + Math.round((cellW - src.width) / 2), row * cellH + Math.round((cellH - src.height) / 2));
  });
  return dst;
}

function main() {
  const sheepDir = findSheepDir();
  const skeleton = JSON.parse(fs.readFileSync(skeletonPath, 'utf8'));
  const setupItems = buildSetupItems(skeleton);
  const originalParts = Object.fromEntries(sheepParts.map(name => [name, loadPng(path.join(sheepDir, `${name}.png`))]));
  const previews = {};

  fs.mkdirSync(outDir, { recursive: true });
  for (const [name, color] of Object.entries(colors)) {
    const parts = { ...originalParts };
    parts.sheep_body = recolorWool(originalParts.sheep_body, color.rgb);
    parts.sheep_hair = recolorWool(originalParts.sheep_hair, color.rgb);
    parts.sheep_light = recolorWool(originalParts.sheep_light, color.rgb);

    const dir = path.join(outDir, name);
    fs.mkdirSync(dir, { recursive: true });
    savePng(path.join(dir, 'sheep_body.png'), parts.sheep_body);
    savePng(path.join(dir, 'sheep_hair.png'), parts.sheep_hair);
    savePng(path.join(dir, 'sheep_light.png'), parts.sheep_light);
    const preview = renderPreview(parts, setupItems);
    previews[name] = preview;
    savePng(path.join(dir, 'sheep_spine_setup_preview.png'), preview);
  }

  savePng(path.join(outDir, 'sheep_spine_setup_contact_sheet.png'), buildContactSheet(previews));
  fs.writeFileSync(path.join(outDir, 'README.txt'), [
    'Sheep wool color previews with original shape preserved.',
    '',
    'Only sheep_body.png, sheep_hair.png, and sheep_light.png are recolored.',
    'Other sheep parts are original and used only to assemble the preview.',
    'Each color folder contains sheep_spine_setup_preview.png for checking the full assembled sheep.',
    '',
    `source_parts=${path.relative(root, sheepDir).replace(/\\/g, '/')}`,
    `skeleton=${path.relative(root, skeletonPath).replace(/\\/g, '/')}`,
    '',
  ].join('\n'));

  console.log(`Wrote ${outDir}`);
}

main();
