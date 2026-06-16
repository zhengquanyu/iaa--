const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const BASE = "C:/Users/admin/Desktop/KillWxapkgGame/animal_art_extracted/illustrated_single_png/animals_by_name";

const dirs = fs.readdirSync(BASE, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

// Threshold: pixels where R,G,B all above this are considered "white background"
const WHITE_THRESHOLD = 210;
// The gray color for animal silhouette
const SILHOUETTE_GRAY = 120;

let fixed = 0;

for (const name of dirs) {
  const colorFile = path.join(BASE, name, name + "_01.png");
  const grayFile = path.join(BASE, name, name + "_02_gray.png");

  if (!fs.existsSync(colorFile)) {
    console.log(name + ": no color, skip");
    continue;
  }

  const buf = fs.readFileSync(colorFile);
  const png = PNG.sync.read(buf);

  const out = new PNG({ width: png.width, height: png.height });

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      const a = png.data[idx + 3];

      // White/light background pixel? Make transparent
      if (a > 200 && r > WHITE_THRESHOLD && g > WHITE_THRESHOLD && b > WHITE_THRESHOLD) {
        out.data[idx] = 0;
        out.data[idx + 1] = 0;
        out.data[idx + 2] = 0;
        out.data[idx + 3] = 0;
      } else if (a > 20) {
        // Foreground pixel: gray silhouette
        out.data[idx] = SILHOUETTE_GRAY;
        out.data[idx + 1] = SILHOUETTE_GRAY;
        out.data[idx + 2] = SILHOUETTE_GRAY;
        out.data[idx + 3] = 255;
      } else {
        // Already transparent
        out.data[idx] = 0;
        out.data[idx + 1] = 0;
        out.data[idx + 2] = 0;
        out.data[idx + 3] = 0;
      }
    }
  }

  fs.writeFileSync(grayFile, PNG.sync.write(out));
  console.log(name + ": done");
  fixed++;
}

console.log("\nFixed " + fixed + " gray silhouettes. White backgrounds removed.");