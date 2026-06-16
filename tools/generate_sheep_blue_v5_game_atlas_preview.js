const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const basePreviewScript = path.join(__dirname, 'generate_sheep_blue_v5_tail_preview.js');
const gameAtlasPath = path.join(root, 'subpackages', 'game', 'native', '6b', '6bc5fc93-b403-4b31-a0e1-7ccff54c45d7.7b5a8.png');
const gameAtlasTextPath = path.join(root, 'subpackages', 'game', 'native', 'd6', 'd614ee96-d20f-4373-8064-5d92fd589021.ac70a.atlas');
const tempPartsDir = path.join(root, 'animal_art_extracted', 'preview_variants', 'sheep_blue_v5_game_atlas_extracted_parts_for_runtime_check');

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
  const i = (y * png.width + x) * 4;
  png.data[i] = rgba[0];
  png.data[i + 1] = rgba[1];
  png.data[i + 2] = rgba[2];
  png.data[i + 3] = rgba[3];
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
    if (!slots.includes(name)) continue;
    const region = { name };
    for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
      const line = lines[j].trim();
      let m;
      if (line.startsWith('rotate:')) region.rotate = line.endsWith('true');
      if ((m = line.match(/^xy:\s*(\d+),\s*(\d+)/))) [region.x, region.y] = [Number(m[1]), Number(m[2])];
      if ((m = line.match(/^size:\s*(\d+),\s*(\d+)/))) [region.w, region.h] = [Number(m[1]), Number(m[2])];
    }
    regions[name] = region;
  }
  return regions;
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

function main() {
  const atlas = loadPng(gameAtlasPath);
  const regions = parseAtlas(fs.readFileSync(gameAtlasTextPath, 'utf8'));
  fs.rmSync(tempPartsDir, { recursive: true, force: true });
  fs.mkdirSync(tempPartsDir, { recursive: true });
  for (const name of slots) {
    const packed = cropPacked(atlas, regions[name]);
    savePng(path.join(tempPartsDir, `${name}.png`), regions[name].rotate ? rotateCcw(packed) : packed);
  }
  const script = fs.readFileSync(basePreviewScript, 'utf8')
    .replace("const approvedBlueDir = path.join(root, 'animal_art_extracted', 'preview_variants', 'sheep_back_wool_blue_test_v5_color_mask');", "const approvedBlueDir = path.join(root, 'animal_art_extracted', 'preview_variants', 'sheep_blue_v5_game_atlas_extracted_parts_for_runtime_check');")
    .replace("const outDir = path.join(root, 'animal_art_extracted', 'preview_variants', 'sheep_blue_v5_spine_runtime_animation_preview_v4_transparent_clean_edges');", "const outDir = path.join(root, 'animal_art_extracted', 'preview_variants', 'sheep_blue_v5_game_atlas_runtime_check');")
    .replace("parts.sheep_body = loadPng(path.join(approvedBlueDir, 'blue_sheep_body.png'));", "parts.sheep_body = loadPng(path.join(approvedBlueDir, 'sheep_body.png'));")
    .replace("parts.sheep_hair = loadPng(path.join(approvedBlueDir, 'blue_sheep_hair.png'));", "parts.sheep_hair = loadPng(path.join(approvedBlueDir, 'sheep_hair.png'));")
    .replace("parts.sheep_light = loadPng(path.join(approvedBlueDir, 'blue_sheep_light.png'));", "parts.sheep_light = loadPng(path.join(approvedBlueDir, 'sheep_light.png'));")
    .replace("const tailRecolor = recolorWoolPixels(originalParts.sheep_wei, blueRgb);\n  parts.sheep_wei = tailRecolor.png;", "const tailRecolor = { png: loadPng(path.join(approvedBlueDir, 'sheep_wei.png')), changed: 0 };\n  parts.sheep_wei = tailRecolor.png;");
  const tempScript = path.join(__dirname, 'run_game_atlas_runtime_check.tmp.js');
  fs.writeFileSync(tempScript, script);
  require(tempScript);
  fs.unlinkSync(tempScript);
}

main();
