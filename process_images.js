const { Jimp } = require("./node_modules/jimp");
const fs = require("fs");
const path = require("path");

const BASE = path.join(__dirname, "animal_art_extracted", "illustrated_single_png", "animals_by_name_2");
const OUT = path.join(__dirname, "animal_art_extracted", "illustrated_single_png", "processed");

async function removeWhiteBg(filepath, outpath) {
  const buf = fs.readFileSync(filepath);
  const img = await Jimp.read(buf);
  const w = img.width, h = img.height;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  
  // Scan through all pixels to find bounds and replace white with transparent
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = img.getPixelColor(x, y);
      // Jimp 1.x returns a number (0xRRGGBBAA or similar)
      const r = (px >> 24) & 0xff;
      const g = (px >> 16) & 0xff;
      const b = (px >> 8) & 0xff;
      const a = px & 0xff;
      // White or near-white pixels become transparent
      if (r > 240 && g > 240 && b > 240) {
        img.setPixelColor(0x00000000, x, y);
      } else if (a > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  if (minX > maxX || minY > maxY) {
    console.log("  WARNING: no content found in", path.basename(filepath));
    await img.write(outpath);
    return;
  }
  
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  console.log("  " + w + "x" + h + " -> " + cropW + "x" + cropH + " (" + path.basename(filepath) + ")");
  
  const cropped = new Jimp({ width: cropW, height: cropH, color: 0x00000000 });
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const px = img.getPixelColor(minX + x, minY + y);
      cropped.setPixelColor(px, x, y);
    }
  }
  
  await cropped.write(outpath);
}

async function main() {
  const dirs = fs.readdirSync(BASE);
  let processed = 0;
  
  for (const dir of dirs) {
    const dirPath = path.join(BASE, dir);
    if (!fs.statSync(dirPath).isDirectory()) continue;
    
    const files = fs.readdirSync(dirPath);
    const colorFile = files.find(f => f.endsWith("_01.png"));
    const grayFile = files.find(f => f.endsWith("_gray.png"));
    
    if (colorFile) {
      console.log("Processing color:", dir);
      await removeWhiteBg(path.join(dirPath, colorFile), path.join(OUT, dir + ".png"));
      processed++;
    }
    if (grayFile) {
      console.log("Processing gray:", dir);
      await removeWhiteBg(path.join(dirPath, grayFile), path.join(OUT, dir + "_gray.png"));
      processed++;
    }
  }
  console.log("Done! Processed", processed, "images.");
}
main().catch(e => console.error(e));
