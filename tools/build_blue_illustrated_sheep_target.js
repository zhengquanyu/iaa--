const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const targetPath = path.join(root, 'subpackages', 'game', 'native', '73', '73923bd9-a2db-4b39-b1a7-fb656b5815ed.b862d.png');
const outDir = path.join(root, 'animal_art_extracted', 'preview_variants', 'illustrated_target_sheep_blue_v5');
const backupDir = path.join(root, 'backups', `illustrated_target_sheep_blue_v5_${stamp()}`);
const blueRgb = [88, 166, 232];

function stamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function loadPng(file) { return PNG.sync.read(fs.readFileSync(file)); }
function savePng(file, png) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, PNG.sync.write(png)); }
function blank(width, height, rgba = [0, 0, 0, 0]) { const png = new PNG({ width, height }); for (let i = 0; i < png.data.length; i += 4) { png.data[i] = rgba[0]; png.data[i + 1] = rgba[1]; png.data[i + 2] = rgba[2]; png.data[i + 3] = rgba[3]; } return png; }
function getPixel(png, x, y) { const i = (y * png.width + x) * 4; return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]]; }
function setPixel(png, x, y, rgba) { const i = (y * png.width + x) * 4; png.data[i] = rgba[0]; png.data[i + 1] = rgba[1]; png.data[i + 2] = rgba[2]; png.data[i + 3] = rgba[3]; }
function copyPng(src) { const dst = blank(src.width, src.height); src.data.copy(dst.data); return dst; }

function recolorWool(src) {
  const dst = copyPng(src);
  let changed = 0;
  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      const i = (y * dst.width + x) * 4;
      const a = dst.data[i + 3];
      if (!a) continue;
      const r = dst.data[i], g = dst.data[i + 1], b = dst.data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const normalized = luma / 255;
      const shade = 0.74 + normalized * 0.36;
      const highlight = Math.max(0, normalized - 0.72) * 0.35;
      for (let c = 0; c < 3; c++) {
        const tinted = blueRgb[c] * shade;
        dst.data[i + c] = Math.max(0, Math.min(255, Math.round(tinted + (255 - tinted) * highlight)));
      }
      changed++;
    }
  }
  return { png: dst, changed };
}

function paste(dst, src, ox, oy) { for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) setPixel(dst, ox + x, oy + y, getPixel(src, x, y)); }
function compare(original, blue) {
  const gap = 12;
  const diff = blank(original.width, original.height, [245, 245, 245, 255]);
  let changed = 0;
  for (let y = 0; y < original.height; y++) for (let x = 0; x < original.width; x++) {
    const a = getPixel(original, x, y), b = getPixel(blue, x, y);
    const d = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) + Math.abs(a[3] - b[3]);
    if (d > 20) { setPixel(diff, x, y, [255, 41, 126, 255]); changed++; }
  }
  const out = blank(original.width * 3 + gap * 2, original.height, [245, 245, 245, 255]);
  paste(out, original, 0, 0); paste(out, blue, original.width + gap, 0); paste(out, diff, (original.width + gap) * 2, 0);
  return { png: out, changed };
}
function alphaDiff(a, b) { let diff = 0; for (let i = 3; i < a.data.length; i += 4) if (a.data[i] !== b.data[i]) diff++; return diff; }

function main() {
  const original = loadPng(targetPath);
  const recolored = recolorWool(original);
  const comp = compare(original, recolored.png);
  const alpha = alphaDiff(original, recolored.png);
  if (alpha !== 0) throw new Error(`Alpha changed: ${alpha}`);
  fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(targetPath, path.join(backupDir, path.basename(targetPath)));
  savePng(path.join(outDir, 'original_illustrated_target_sheep.png'), original);
  savePng(path.join(outDir, 'blue_illustrated_target_sheep.png'), recolored.png);
  savePng(path.join(outDir, 'compare_original_blue_diff.png'), comp.png);
  savePng(targetPath, recolored.png);
  fs.writeFileSync(path.join(outDir, 'README.txt'), [
    'Illustrated/target sheep blue v5.',
    '',
    'This updates texture/illustrated/animal/sheep used by the top target hint / illustrated sheep image.',
    'The existing non-transparent target hint pixels were recolored blue; alpha and dimensions are unchanged.',
    '',
    `target=${path.relative(root, targetPath).replace(/\\/g, '/')}`,
    `backup=${path.relative(root, backupDir).replace(/\\/g, '/')}`,
    `size=${original.width}x${original.height}`,
    `alpha_diff_pixels=0`,
    `recolored_pixels=${recolored.changed}`,
    `compare_changed_pixels=${comp.changed}`,
    '',
  ].join('\n'));
  console.log(`Updated ${path.relative(root, targetPath)}`);
  console.log(`Backup ${path.relative(root, backupDir)}`);
  console.log(`recolored_pixels=${recolored.changed}`);
}

main();
