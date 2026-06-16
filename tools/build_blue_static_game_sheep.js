const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const sheepPath = path.join(root, 'subpackages', 'game', 'native', 'f9', 'f9298e8a-1b65-4329-9e08-b1dc2634e02d.e4707.png');
const outDir = path.join(root, 'animal_art_extracted', 'preview_variants', 'static_game_sheep_blue_v5_actual_level_sprite');
const backupDir = path.join(root, 'backups', `static_game_sheep_blue_v5_${stamp()}`);
const blueRgb = [88, 166, 232];

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

function recolorStaticSheepWool(src) {
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
      const yellowishWool = r >= 210 && g >= 205 && b >= 165 && chroma <= 80;
      const whiteWool = luma >= 190 && chroma <= 55;
      if (!yellowishWool && !whiteWool) continue;

      const normalized = luma / 255;
      const shade = 0.44 + normalized * 0.78;
      const highlight = Math.max(0, normalized - 0.78) * 0.5;
      for (let c = 0; c < 3; c++) {
        const tinted = blueRgb[c] * shade;
        dst.data[i + c] = Math.max(0, Math.min(255, Math.round(tinted + (255 - tinted) * highlight)));
      }
      changed++;
    }
  }
  return { png: dst, changed };
}

function paste(dst, src, ox, oy) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) setPixel(dst, ox + x, oy + y, getPixel(src, x, y));
  }
}

function makeCompare(original, blue) {
  const gap = 12;
  const diff = blank(original.width, original.height, [255, 255, 255, 0]);
  let changed = 0;
  for (let y = 0; y < original.height; y++) {
    for (let x = 0; x < original.width; x++) {
      const a = getPixel(original, x, y);
      const b = getPixel(blue, x, y);
      const d = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) + Math.abs(a[3] - b[3]);
      if (d > 20) {
        setPixel(diff, x, y, [255, 41, 126, 255]);
        changed++;
      }
    }
  }
  const out = blank(original.width * 3 + gap * 2, original.height, [245, 245, 245, 255]);
  paste(out, original, 0, 0);
  paste(out, blue, original.width + gap, 0);
  paste(out, diff, (original.width + gap) * 2, 0);
  return { png: out, changed };
}

function alphaDiff(a, b) {
  if (a.width !== b.width || a.height !== b.height) return Infinity;
  let diff = 0;
  for (let i = 3; i < a.data.length; i += 4) if (a.data[i] !== b.data[i]) diff++;
  return diff;
}

function main() {
  const original = loadPng(sheepPath);
  const recolored = recolorStaticSheepWool(original);
  const compare = makeCompare(original, recolored.png);
  if (alphaDiff(original, recolored.png) !== 0) throw new Error('Alpha changed unexpectedly');

  fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(sheepPath, path.join(backupDir, path.basename(sheepPath)));
  savePng(path.join(outDir, 'original_img_yx_yang.png'), original);
  savePng(path.join(outDir, 'blue_img_yx_yang.png'), recolored.png);
  savePng(path.join(outDir, 'compare_original_blue_diff.png'), compare.png);
  savePng(sheepPath, recolored.png);

  fs.writeFileSync(path.join(outDir, 'README.txt'), [
    'Static game-level sheep sprite blue v5.',
    '',
    'This is the actual level board sprite: texture/game/img_yx_yang.',
    'Only bright wool pixels were recolored blue. Face, mouth outline, eyes, legs, ears, black outline, and alpha shape are preserved.',
    'No SpriteFrame JSON was changed; rect/originalSize remains 114x115 via existing metadata.',
    '',
    `target=${path.relative(root, sheepPath).replace(/\\/g, '/')}`,
    `backup=${path.relative(root, backupDir).replace(/\\/g, '/')}`,
    `size=${original.width}x${original.height}`,
    `alpha_diff_pixels=0`,
    `recolored_pixels=${recolored.changed}`,
    `compare_changed_pixels=${compare.changed}`,
    '',
  ].join('\n'));

  console.log(`Updated ${path.relative(root, sheepPath)}`);
  console.log(`Backup ${path.relative(root, backupDir)}`);
  console.log(`recolored_pixels=${recolored.changed}`);
}

main();
