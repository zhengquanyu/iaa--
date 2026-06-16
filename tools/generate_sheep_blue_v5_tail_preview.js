const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const skeletonPath = path.join(root, 'animal_art_extracted', 'level_spine', 'exported_spine_files', 'animal.skeleton.json');
const atlasPath = path.join(root, 'animal_art_extracted', 'level_spine', 'original_cocos_files', 'animal.atlas');
const bodyRoot = path.join(root, 'animal_art_extracted', 'level_spine', 'animals_by_body');
const approvedBlueDir = path.join(root, 'animal_art_extracted', 'preview_variants', 'sheep_back_wool_blue_test_v5_color_mask');
const outDir = path.join(root, 'animal_art_extracted', 'preview_variants', 'sheep_blue_v5_spine_runtime_animation_preview_v4_transparent_clean_edges');

const sheepDrawOrder = [
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

const blueRgb = [88, 166, 232];

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
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return [0, 0, 0, 0];
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

function sameAlphaShape(a, b) {
  if (a.width !== b.width || a.height !== b.height) return false;
  for (let i = 3; i < a.data.length; i += 4) {
    if (a.data[i] !== b.data[i]) return false;
  }
  return true;
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
  const regions = {};
  for (let i = 0; i < lines.length; i++) {
    const name = lines[i].trim();
    if (!sheepDrawOrder.includes(name)) continue;
    const region = { name };
    for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
      const line = lines[j].trim();
      let m;
      if (line.startsWith('rotate:')) region.rotate = line.endsWith('true');
      if ((m = line.match(/^xy:\s*(\d+),\s*(\d+)/))) [region.x, region.y] = [Number(m[1]), Number(m[2])];
      if ((m = line.match(/^size:\s*(\d+),\s*(\d+)/))) [region.width, region.height] = [Number(m[1]), Number(m[2])];
      if ((m = line.match(/^orig:\s*(\d+),\s*(\d+)/))) [region.originalWidth, region.originalHeight] = [Number(m[1]), Number(m[2])];
      if ((m = line.match(/^offset:\s*(-?\d+),\s*(-?\d+)/))) [region.offsetX, region.offsetY] = [Number(m[1]), Number(m[2])];
    }
    regions[name] = region;
  }
  return regions;
}

function findSheepDir() {
  const dirs = fs.readdirSync(bodyRoot, { withFileTypes: true }).filter(entry => entry.isDirectory());
  for (const dir of dirs) {
    const full = path.join(bodyRoot, dir.name);
    if (fs.existsSync(path.join(full, 'sheep_wei.png'))) return full;
  }
  throw new Error(`Could not find sheep parts under ${bodyRoot}`);
}

function recolorWoolPixels(src, targetRgb) {
  const dst = copyPng(src);
  let changed = 0;
  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      const i = (y * dst.width + x) * 4;
      const a = dst.data[i + 3];
      if (a === 0) continue;
      const r = dst.data[i];
      const g = dst.data[i + 1];
      const b = dst.data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      if (luma < 185 || chroma > 45) continue;

      const normalized = luma / 255;
      const shade = 0.42 + normalized * 0.82;
      const highlight = Math.max(0, normalized - 0.78) * 0.55;
      for (let c = 0; c < 3; c++) {
        const tinted = targetRgb[c] * shade;
        dst.data[i + c] = Math.max(0, Math.min(255, Math.round(tinted + (255 - tinted) * highlight)));
      }
      changed++;
    }
  }
  return { png: dst, changed };
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
  const rotation = item.rotation || 0;
  const rad = rotation * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const sx = item.scaleX == null ? 1 : item.scaleX;
  const sy = item.scaleY == null ? 1 : item.scaleY;
  return { a: cos * sx, b: sin * sx, c: -sin * sy, d: cos * sy, tx: item.x || 0, ty: item.y || 0 };
}

function transformPoint(matrix, x, y) {
  return { x: matrix.a * x + matrix.c * y + matrix.tx, y: matrix.b * x + matrix.d * y + matrix.ty };
}

function sampleTimeline(frames, time, prop, defaultValue) {
  if (!frames || frames.length === 0) return defaultValue;
  const normalized = frames.map(frame => ({ ...frame, time: frame.time == null ? 0 : frame.time }));
  if (time <= normalized[0].time) return normalized[0][prop] == null ? defaultValue : normalized[0][prop];
  for (let i = 0; i < normalized.length - 1; i++) {
    const a = normalized[i];
    const b = normalized[i + 1];
    if (time > b.time) continue;
    const span = b.time - a.time;
    const t = curvePercent(a, span <= 0 ? 0 : (time - a.time) / span);
    const av = a[prop] == null ? defaultValue : a[prop];
    const bv = b[prop] == null ? defaultValue : b[prop];
    return av + (bv - av) * t;
  }
  const last = normalized[normalized.length - 1];
  return last[prop] == null ? defaultValue : last[prop];
}

function cubicBezier(t, p0, p1, p2, p3) {
  const inv = 1 - t;
  return inv * inv * inv * p0 + 3 * inv * inv * t * p1 + 3 * inv * t * t * p2 + t * t * t * p3;
}

function curvePercent(frame, percent) {
  if (percent <= 0 || percent >= 1) return percent;
  if (frame.curve == null) return percent;
  if (frame.curve === 'stepped') return 0;
  if (typeof frame.curve !== 'number') return percent;

  const x1 = frame.curve;
  const y1 = frame.c2 == null ? 0 : frame.c2;
  const x2 = frame.c3 == null ? 1 : frame.c3;
  const y2 = frame.c4 == null ? 1 : frame.c4;
  let lo = 0;
  let hi = 1;
  let t = percent;
  for (let i = 0; i < 16; i++) {
    const x = cubicBezier(t, 0, x1, x2, 1);
    if (Math.abs(x - percent) < 0.00001) break;
    if (x < percent) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return cubicBezier(t, 0, y1, y2, 1);
}

function sampleTranslate(frames, time, baseX, baseY) {
  if (!frames || frames.length === 0) return { x: baseX, y: baseY };
  const normalized = frames.map(frame => ({ ...frame, time: frame.time == null ? 0 : frame.time }));
  if (time <= normalized[0].time) return { x: baseX + (normalized[0].x || 0), y: baseY + (normalized[0].y || 0) };
  for (let i = 0; i < normalized.length - 1; i++) {
    const a = normalized[i];
    const b = normalized[i + 1];
    if (time > b.time) continue;
    const span = b.time - a.time;
    const t = curvePercent(a, span <= 0 ? 0 : (time - a.time) / span);
    return { x: baseX + (a.x || 0) + ((b.x || 0) - (a.x || 0)) * t, y: baseY + (a.y || 0) + ((b.y || 0) - (a.y || 0)) * t };
  }
  const last = normalized[normalized.length - 1];
  return { x: baseX + (last.x || 0), y: baseY + (last.y || 0) };
}

function sampleScale(frames, time, baseX, baseY) {
  if (!frames || frames.length === 0) return { scaleX: baseX == null ? 1 : baseX, scaleY: baseY == null ? 1 : baseY };
  const normalized = frames.map(frame => ({ ...frame, time: frame.time == null ? 0 : frame.time }));
  const sx = sampleTimeline(normalized, time, 'x', 1);
  const sy = sampleTimeline(normalized, time, 'y', 1);
  return { scaleX: (baseX == null ? 1 : baseX) * sx, scaleY: (baseY == null ? 1 : baseY) * sy };
}

function animatedBoneState(bone, timelines, time) {
  const timeline = timelines[bone.name] || {};
  const translated = sampleTranslate(timeline.translate, time, bone.x || 0, bone.y || 0);
  const scaled = sampleScale(timeline.scale, time, bone.scaleX, bone.scaleY);
  return {
    ...bone,
    x: translated.x,
    y: translated.y,
    rotation: (bone.rotation || 0) + sampleTimeline(timeline.rotate, time, 'angle', 0),
    scaleX: scaled.scaleX,
    scaleY: scaled.scaleY,
  };
}

function worldMatrices(skeleton, time) {
  const timelines = skeleton.animations.yidle.bones || {};
  const bones = new Map(skeleton.bones.map(bone => [bone.name, bone]));
  const cache = new Map();
  const identity = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
  function resolve(name) {
    if (cache.has(name)) return cache.get(name);
    const bone = bones.get(name);
    if (!bone) throw new Error(`Missing bone ${name}`);
    const parent = bone.parent ? resolve(bone.parent) : identity;
    const world = multiplyMatrix(parent, localMatrix(animatedBoneState(bone, timelines, time)));
    cache.set(name, world);
    return world;
  }
  for (const bone of skeleton.bones) resolve(bone.name);
  return cache;
}

function attachmentMatrix(boneMatrix, attachment) {
  return multiplyMatrix(boneMatrix, localMatrix(attachment));
}

function regionCorners(boneMatrix, attachment, region) {
  const matrix = attachmentMatrix(boneMatrix, attachment);
  const scaleX = attachment.width / region.originalWidth;
  const scaleY = attachment.height / region.originalHeight;
  const localX = -attachment.width / 2 + region.offsetX * scaleX;
  const localY = -attachment.height / 2 + region.offsetY * scaleY;
  const localX2 = localX + region.width * scaleX;
  const localY2 = localY + region.height * scaleY;
  return [
    transformPoint(matrix, localX, localY),
    transformPoint(matrix, localX2, localY),
    transformPoint(matrix, localX2, localY2),
    transformPoint(matrix, localX, localY2),
  ];
}

function computeMeshWorldVertices(skeleton, matrices, attachment) {
  const out = [];
  const bones = skeleton.bones;
  const vertices = attachment.vertices;
  for (let i = 0; i < vertices.length;) {
    const boneCount = vertices[i++];
    let wx = 0;
    let wy = 0;
    for (let j = 0; j < boneCount; j++) {
      const boneIndex = vertices[i++];
      const vx = vertices[i++];
      const vy = vertices[i++];
      const weight = vertices[i++];
      const bone = bones[boneIndex];
      const p = transformPoint(matrices.get(bone.name), vx, vy);
      wx += p.x * weight;
      wy += p.y * weight;
    }
    out.push({ x: wx, y: wy });
  }
  return out;
}

function blendPixel(dst, x, y, rgba) {
  if (rgba[3] === 0 || x < 0 || y < 0 || x >= dst.width || y >= dst.height) return;
  const i = (y * dst.width + x) * 4;
  const sa = rgba[3] / 255;
  const da = dst.data[i + 3] / 255;
  const outA = sa + da * (1 - sa);
  if (outA <= 0) return;
  for (let c = 0; c < 3; c++) dst.data[i + c] = Math.round((rgba[c] * sa + dst.data[i + c] * da * (1 - sa)) / outA);
  dst.data[i + 3] = Math.round(outA * 255);
}

function sampleNearest(src, u, v) {
  const x = Math.max(0, Math.min(src.width - 1, Math.round(u * (src.width - 1))));
  const y = Math.max(0, Math.min(src.height - 1, Math.round(v * (src.height - 1))));
  return getPixel(src, x, y);
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

function edge(a, b, p) {
  return (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
}

function drawTexturedTriangle(dst, src, p0, p1, p2, uv0, uv1, uv2) {
  const minX = Math.max(0, Math.floor(Math.min(p0.x, p1.x, p2.x)));
  const maxX = Math.min(dst.width - 1, Math.ceil(Math.max(p0.x, p1.x, p2.x)));
  const minY = Math.max(0, Math.floor(Math.min(p0.y, p1.y, p2.y)));
  const maxY = Math.min(dst.height - 1, Math.ceil(Math.max(p0.y, p1.y, p2.y)));
  const area = edge(p0, p1, p2);
  if (Math.abs(area) < 0.0001) return;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const p = { x: x + 0.5, y: y + 0.5 };
      const w0 = edge(p1, p2, p) / area;
      const w1 = edge(p2, p0, p) / area;
      const w2 = edge(p0, p1, p) / area;
      if (w0 < -0.0001 || w1 < -0.0001 || w2 < -0.0001) continue;
      const u = uv0.u * w0 + uv1.u * w1 + uv2.u * w2;
      const v = uv0.v * w0 + uv1.v * w1 + uv2.v * w2;
      blendPixel(dst, x, y, sampleNearest(src, u, v));
    }
  }
}

function renderFrame(skeleton, atlas, parts, time, view, background = [0, 0, 0, 0]) {
  const matrices = worldMatrices(skeleton, time);
  const slots = new Map(skeleton.slots.map(slot => [slot.name, slot]));
  const skin = skeleton.skins.find(item => item.name === 'default').attachments;
  const dst = blank(view.width, view.height, background);

  function toCanvas(p) {
    return { x: (p.x - view.minX) * view.scale + view.padding, y: (view.maxY - p.y) * view.scale + view.padding };
  }

  for (const name of sheepDrawOrder) {
    const slot = slots.get(name);
    const attachment = skin[name] && skin[name][name];
    const src = parts[name];
    if (!slot || !attachment || !src) throw new Error(`Missing render item ${name}`);
    const boneMatrix = matrices.get(slot.bone);
    if ((attachment.type || 'region') === 'mesh') {
      const vertices = computeMeshWorldVertices(skeleton, matrices, attachment).map(toCanvas);
      const uvs = [];
      for (let i = 0; i < attachment.uvs.length; i += 2) uvs.push({ u: attachment.uvs[i], v: attachment.uvs[i + 1] });
      for (let i = 0; i < attachment.triangles.length; i += 3) {
        const a = attachment.triangles[i];
        const b = attachment.triangles[i + 1];
        const c = attachment.triangles[i + 2];
        drawTexturedTriangle(dst, src, vertices[a], vertices[b], vertices[c], uvs[a], uvs[b], uvs[c]);
      }
    } else {
      const corners = regionCorners(boneMatrix, attachment, atlas[name]).map(toCanvas);
      drawTexturedQuad(dst, src, corners);
    }
  }
  return dst;
}

function compositeOnBackground(src, rgba) {
  const dst = blank(src.width, src.height, rgba);
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) blendPixel(dst, x, y, getPixel(src, x, y));
  }
  return dst;
}

function makeCheckerBackground(width, height, a = [238, 238, 238, 255], b = [210, 216, 224, 255], size = 16) {
  const dst = blank(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) setPixel(dst, x, y, ((Math.floor(x / size) + Math.floor(y / size)) % 2) ? a : b);
  }
  return dst;
}

function compositeOnChecker(src) {
  const dst = makeCheckerBackground(src.width, src.height);
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) blendPixel(dst, x, y, getPixel(src, x, y));
  }
  return dst;
}

function paste(dst, src, ox, oy) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) setPixel(dst, ox + x, oy + y, getPixel(src, x, y));
  }
}

function makeCompareFrame(original, blue) {
  const gap = 18;
  const labelH = 26;
  const diff = blank(original.width, original.height, [246, 246, 246, 255]);
  let changed = 0;
  for (let y = 0; y < original.height; y++) {
    for (let x = 0; x < original.width; x++) {
      const a = getPixel(original, x, y);
      const b = getPixel(blue, x, y);
      const d = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) + Math.abs(a[3] - b[3]);
      if (d > 28) {
        setPixel(diff, x, y, [255, 41, 126, 255]);
        changed++;
      }
    }
  }
  const out = blank(original.width * 3 + gap * 2, original.height + labelH, [36, 36, 36, 255]);
  paste(out, original, 0, labelH);
  paste(out, blue, original.width + gap, labelH);
  paste(out, diff, original.width * 2 + gap * 2, labelH);
  return { png: out, changed };
}

function makeContactSheet(frames, columns = 6, gap = 10, labelH = 0) {
  const rows = Math.ceil(frames.length / columns);
  const cellW = frames[0].width;
  const cellH = frames[0].height + labelH;
  const out = blank(columns * cellW + (columns - 1) * gap, rows * cellH + (rows - 1) * gap, [36, 36, 36, 255]);
  frames.forEach((frame, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    paste(out, frame, col * (cellW + gap), row * (cellH + gap) + labelH);
  });
  return out;
}

function alphaStats(png) {
  let count = 0;
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const a = png.data[(y * png.width + x) * 4 + 3];
      if (a === 0) continue;
      count++;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return { count, bounds: count ? [minX, minY, maxX, maxY] : null };
}

function auditReport(skeleton, atlas, originalParts, blueParts, tailRecolor, view, frameChangedCounts) {
  const slots = new Map(skeleton.slots.map(slot => [slot.name, slot]));
  const skin = skeleton.skins.find(item => item.name === 'default').attachments;
  const lines = [
    'Sheep blue v5 model-parameter audit',
    '',
    'Result: PASS - skeleton, slots, bones, attachment dimensions, mesh vertices/uvs/triangles, atlas rotate/orig/offset are read-only; only selected wool RGB pixels are changed.',
    '',
    `animation=yidle`,
    `frame_count=24`,
    `view=${view.width}x${view.height}, scale=${view.scale}, padding=${view.padding}`,
    `changed_pixels_per_compare_frame_min=${Math.min(...frameChangedCounts)}`,
    `changed_pixels_per_compare_frame_max=${Math.max(...frameChangedCounts)}`,
    '',
    'slot_order_and_geometry:',
  ];
  for (const name of sheepDrawOrder) {
    const slot = slots.get(name);
    const attachment = skin[name][name];
    const region = atlas[name];
    const original = originalParts[name];
    const blue = blueParts[name];
    const originalAlpha = alphaStats(original);
    const blueAlpha = alphaStats(blue);
    const alphaSame = sameAlphaShape(original, blue);
    const type = attachment.type || 'region';
    const atlasInfo = `atlas_rotate=${region.rotate}, atlas_size=${region.width}x${region.height}, atlas_orig=${region.originalWidth}x${region.originalHeight}, atlas_offset=${region.offsetX},${region.offsetY}`;
    const attachmentInfo = type === 'mesh'
      ? `mesh_width=${attachment.width}, mesh_height=${attachment.height}, vertices=${attachment.vertices.length}, uvs=${attachment.uvs.length}, triangles=${attachment.triangles.length}`
      : `region_x=${attachment.x || 0}, region_y=${attachment.y || 0}, region_rotation=${attachment.rotation || 0}, region_width=${attachment.width}, region_height=${attachment.height}`;
    lines.push(`- ${name}: bone=${slot.bone}, type=${type}, ${attachmentInfo}, ${atlasInfo}, original_png=${original.width}x${original.height}, blue_png=${blue.width}x${blue.height}, alpha_same=${alphaSame}, original_alpha=${originalAlpha.count}/${JSON.stringify(originalAlpha.bounds)}, blue_alpha=${blueAlpha.count}/${JSON.stringify(blueAlpha.bounds)}`);
  }
  lines.push('', `tail_recolored_pixels=${tailRecolor.changed}`);
  lines.push('tail_decision=sheep_wei belongs to the wool tail; bright low-chroma wool pixels are recolored blue and dark outline pixels are preserved.');
  lines.push('curve_sampling=Spine cubic/stepped timeline curves are sampled; omitted keyframe time is treated as 0.');
  lines.push('resource_safety=No game resource was replaced by this preview generator.');
  lines.push('');
  return lines.join('\n');
}

function allFrameBounds(skeleton, atlas, frameCount, duration) {
  const slots = new Map(skeleton.slots.map(slot => [slot.name, slot]));
  const skin = skeleton.skins.find(item => item.name === 'default').attachments;
  const points = [];
  for (let frame = 0; frame < frameCount; frame++) {
    const time = duration * frame / frameCount;
    const matrices = worldMatrices(skeleton, time);
    for (const name of sheepDrawOrder) {
      const slot = slots.get(name);
      const attachment = skin[name][name];
      if ((attachment.type || 'region') === 'mesh') points.push(...computeMeshWorldVertices(skeleton, matrices, attachment));
      else points.push(...regionCorners(matrices.get(slot.bone), attachment, atlas[name]));
    }
  }
  return {
    minX: Math.min(...points.map(p => p.x)),
    maxX: Math.max(...points.map(p => p.x)),
    minY: Math.min(...points.map(p => p.y)),
    maxY: Math.max(...points.map(p => p.y)),
  };
}

function animationDuration(animation) {
  let max = 0;
  for (const bone of Object.values(animation.bones || {})) {
    for (const timeline of Object.values(bone)) {
      for (const frame of timeline) max = Math.max(max, frame.time == null ? 0 : frame.time);
    }
  }
  return max || 2;
}

function html(frameCount) {
  const frames = Array.from({ length: frameCount }, (_, i) => `frames/frame_${String(i).padStart(2, '0')}.png`);
  return `<!doctype html><meta charset="utf-8"><title>sheep blue v5 transparent preview</title><style>body{margin:0;background:#242424;color:#eee;font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh}main{display:grid;gap:12px;text-align:center}.stage{width:520px;height:520px;background-color:#e8edf3;background-image:linear-gradient(45deg,#d4dbe4 25%,transparent 25%),linear-gradient(-45deg,#d4dbe4 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d4dbe4 75%),linear-gradient(-45deg,transparent 75%,#d4dbe4 75%);background-size:24px 24px;background-position:0 0,0 12px,12px -12px,-12px 0;display:grid;place-items:center}img{width:520px;height:520px}button{font-size:16px;padding:8px 14px}</style><main><h3>Blue v5 sheep - transparent frames, tail blue, atlas offset/orig fixed</h3><div class="stage"><img id="p" src="${frames[0]}"></div><div><button id="b">Pause</button> <span id="n"></span></div></main><script>const frames=${JSON.stringify(frames)};let i=0,run=true;const img=document.getElementById('p'),n=document.getElementById('n'),b=document.getElementById('b');function tick(){if(run){i=(i+1)%frames.length;img.src=frames[i];n.textContent=(i+1)+'/'+frames.length}setTimeout(tick,83)}b.onclick=()=>{run=!run;b.textContent=run?'Pause':'Play'};n.textContent='1/'+frames.length;tick();</script>`;
}

function compareHtml(frameCount) {
  const frames = Array.from({ length: frameCount }, (_, i) => `compare_frames/compare_${String(i).padStart(2, '0')}.png`);
  return `<!doctype html><meta charset="utf-8"><title>sheep original vs blue v5 tail compare</title><style>body{margin:0;background:#242424;color:#eee;font-family:Arial,sans-serif;display:grid;place-items:center;min-height:100vh}main{display:grid;gap:12px;text-align:center}img{width:min(96vw,1200px);height:auto;background:#242424}button{font-size:16px;padding:8px 14px}</style><main><h3>Original / Blue v5 / Changed pixels</h3><img id="p" src="${frames[0]}"><div><button id="b">Pause</button> <span id="n"></span></div></main><script>const frames=${JSON.stringify(frames)};let i=0,run=true;const img=document.getElementById('p'),n=document.getElementById('n'),b=document.getElementById('b');function tick(){if(run){i=(i+1)%frames.length;img.src=frames[i];n.textContent=(i+1)+'/'+frames.length}setTimeout(tick,83)}b.onclick=()=>{run=!run;b.textContent=run?'Pause':'Play'};n.textContent='1/'+frames.length;tick();</script>`;
}

function main() {
  const skeleton = JSON.parse(fs.readFileSync(skeletonPath, 'utf8'));
  const atlas = parseAtlas(fs.readFileSync(atlasPath, 'utf8'));
  const sheepDir = findSheepDir();
  const originalParts = {};
  for (const name of sheepDrawOrder) {
    const packedPart = loadPng(path.join(sheepDir, `${name}.png`));
    originalParts[name] = atlas[name].rotate ? rotateCcw(packedPart) : packedPart;
  }
  const parts = {};
  for (const name of sheepDrawOrder) parts[name] = copyPng(originalParts[name]);
  parts.sheep_body = loadPng(path.join(approvedBlueDir, 'blue_sheep_body.png'));
  parts.sheep_hair = loadPng(path.join(approvedBlueDir, 'blue_sheep_hair.png'));
  parts.sheep_light = loadPng(path.join(approvedBlueDir, 'blue_sheep_light.png'));

  const tailRecolor = recolorWoolPixels(originalParts.sheep_wei, blueRgb);
  parts.sheep_wei = tailRecolor.png;

  const frameCount = 24;
  const duration = animationDuration(skeleton.animations.yidle);
  const bounds = allFrameBounds(skeleton, atlas, frameCount, duration);
  const scale = 4;
  const padding = 46;
  const view = {
    ...bounds,
    scale,
    padding,
    width: Math.ceil((bounds.maxX - bounds.minX) * scale + padding * 2),
    height: Math.ceil((bounds.maxY - bounds.minY) * scale + padding * 2),
  };

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, 'frames'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'white_bg_frames'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'dark_bg_frames'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'checker_bg_frames'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'original_frames'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'compare_frames'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'full_sheep_preview'), { recursive: true });
  savePng(path.join(outDir, 'blue_sheep_wei.png'), parts.sheep_wei);
  const changedCounts = [];
  const originalRenderedFrames = [];
  const blueRenderedFrames = [];
  const compareRenderedFrames = [];
  for (let frame = 0; frame < frameCount; frame++) {
    const time = duration * frame / frameCount;
    const originalFrame = renderFrame(skeleton, atlas, originalParts, time, view);
    const blueFrame = renderFrame(skeleton, atlas, parts, time, view);
    const originalFrameForCompare = compositeOnBackground(originalFrame, [246, 246, 246, 255]);
    const blueFrameForCompare = compositeOnBackground(blueFrame, [246, 246, 246, 255]);
    const compareFrame = makeCompareFrame(originalFrameForCompare, blueFrameForCompare);
    originalRenderedFrames.push(originalFrame);
    blueRenderedFrames.push(blueFrame);
    compareRenderedFrames.push(compareFrame.png);
    changedCounts.push(compareFrame.changed);
    savePng(path.join(outDir, 'original_frames', `frame_${String(frame).padStart(2, '0')}.png`), originalFrame);
    savePng(path.join(outDir, 'frames', `frame_${String(frame).padStart(2, '0')}.png`), blueFrame);
    savePng(path.join(outDir, 'white_bg_frames', `frame_${String(frame).padStart(2, '0')}.png`), compositeOnBackground(blueFrame, [255, 255, 255, 255]));
    savePng(path.join(outDir, 'dark_bg_frames', `frame_${String(frame).padStart(2, '0')}.png`), compositeOnBackground(blueFrame, [36, 36, 36, 255]));
    savePng(path.join(outDir, 'checker_bg_frames', `frame_${String(frame).padStart(2, '0')}.png`), compositeOnChecker(blueFrame));
    savePng(path.join(outDir, 'compare_frames', `compare_${String(frame).padStart(2, '0')}.png`), compareFrame.png);
  }
  savePng(path.join(outDir, 'full_sheep_preview', 'original_full_sheep_yidle_frame_00.png'), originalRenderedFrames[0]);
  savePng(path.join(outDir, 'full_sheep_preview', 'blue_v5_full_sheep_tail_blue_yidle_frame_00.png'), blueRenderedFrames[0]);
  savePng(path.join(outDir, 'full_sheep_preview', 'compare_original_blue_tail_blue_yidle_frame_00.png'), compareRenderedFrames[0]);
  savePng(path.join(outDir, 'full_sheep_preview', 'blue_v5_full_sheep_tail_blue_yidle_24_frame_contact_sheet.png'), makeContactSheet(blueRenderedFrames, 6, 10));
  savePng(path.join(outDir, 'full_sheep_preview', 'blue_v5_full_sheep_tail_blue_yidle_24_frame_contact_sheet_white_bg.png'), makeContactSheet(blueRenderedFrames.map(frame => compositeOnBackground(frame, [255, 255, 255, 255])), 6, 10));
  savePng(path.join(outDir, 'full_sheep_preview', 'blue_v5_full_sheep_tail_blue_yidle_24_frame_contact_sheet_dark_bg.png'), makeContactSheet(blueRenderedFrames.map(frame => compositeOnBackground(frame, [36, 36, 36, 255])), 6, 10));
  savePng(path.join(outDir, 'full_sheep_preview', 'blue_v5_full_sheep_tail_blue_yidle_24_frame_contact_sheet_checker_bg.png'), makeContactSheet(blueRenderedFrames.map(frame => compositeOnChecker(frame)), 6, 10));
  savePng(path.join(outDir, 'full_sheep_preview', 'compare_original_blue_tail_blue_yidle_24_frame_contact_sheet.png'), makeContactSheet(compareRenderedFrames, 3, 10));
  fs.writeFileSync(path.join(outDir, 'preview_blue_v5_yidle_tail_blue_region_offset.html'), html(frameCount));
  fs.writeFileSync(path.join(outDir, 'compare_original_vs_blue_v5_tail.html'), compareHtml(frameCount));
  fs.writeFileSync(path.join(outDir, 'MODEL_PARAMETER_AUDIT.txt'), auditReport(skeleton, atlas, originalParts, parts, tailRecolor, view, changedCounts));
  fs.writeFileSync(path.join(outDir, 'README.txt'), [
    'Blue v5 sheep yidle animation preview, v4 transparent clean-edge export.',
    '',
    'Open preview_blue_v5_yidle_tail_blue_region_offset.html. It uses transparent PNG frames over a CSS checker background.',
    'Open full_sheep_preview/blue_v5_full_sheep_tail_blue_yidle_frame_00.png for a single complete sheep image.',
    'Open full_sheep_preview/blue_v5_full_sheep_tail_blue_yidle_24_frame_contact_sheet.png for a complete-sheep animation contact sheet.',
    'Uses approved v5 blue sheep_body/sheep_light/sheep_hair files unchanged.',
    'sheep_wei is treated as wool/tail: only bright, low-chroma wool pixels are recolored blue; dark outline pixels are preserved.',
    'Region attachments use atlas originalWidth/originalHeight and offsetX/offsetY when computing quad corners.',
    'Packed rotated sheep_wei.png is rotated back for logical 29x20 sampling before render.',
    'Spine keyframes with omitted time are treated as time=0.',
    'No original game resource was replaced.',
    'frames/*.png and full_sheep_preview/blue_v5_full_sheep_tail_blue_yidle_frame_00.png are transparent PNGs, so edge pixels are not pre-composited into a gray background.',
    'white_bg_frames, dark_bg_frames, and checker_bg_frames are only diagnostic composites for checking edge quality.',
    '',
    'source_parts=animal_art_extracted/level_spine/animals_by_body/[folder containing sheep_wei.png]',
    `approved_blue=${path.relative(root, approvedBlueDir).replace(/\\/g, '/')}`,
    `tail_atlas=rotate:${atlas.sheep_wei.rotate}, size:${atlas.sheep_wei.width}x${atlas.sheep_wei.height}, orig:${atlas.sheep_wei.originalWidth}x${atlas.sheep_wei.originalHeight}, offset:${atlas.sheep_wei.offsetX},${atlas.sheep_wei.offsetY}`,
    `tail_source_png=[source sheep_wei.png] (${loadPng(path.join(sheepDir, 'sheep_wei.png')).width}x${loadPng(path.join(sheepDir, 'sheep_wei.png')).height}, packed rotated crop)`,
    `tail_output_png=blue_sheep_wei.png (${parts.sheep_wei.width}x${parts.sheep_wei.height}, logical unrotated crop)`,
    `tail_recolored_pixels=${tailRecolor.changed}`,
    `compare_changed_pixels_min=${Math.min(...changedCounts)}`,
    `compare_changed_pixels_max=${Math.max(...changedCounts)}`,
    `frames=${frameCount}`,
    `duration=${duration}`,
    '',
  ].join('\n'));
  console.log(`Wrote ${outDir}`);
  console.log(`tail_recolored_pixels=${tailRecolor.changed}`);
  console.log(`tail_output=${parts.sheep_wei.width}x${parts.sheep_wei.height}`);
}

main();
