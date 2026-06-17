const { Jimp } = require("./node_modules/jimp");
const fs = require("fs");
const path = require("path");

const SOURCE = path.join(__dirname, "animal_art_extracted", "illustrated_single_png", "animals_by_name_3");
const OLD_DESC_SOURCE = path.join(__dirname, "animal_art_extracted", "illustrated_single_png", "animals_by_name_2");
const ICON_SOURCE = path.join(__dirname, "animal_art_extracted", "illustrated_single_png", "animal_icon_transparent");
const ILLUSTRATED_OUT = path.join(__dirname, "illustrated-replacement-data.js");
const PUZZLE_OUT = path.join(__dirname, "puzzle-replacement-data.js");

function jsString(value) {
  return JSON.stringify(String(value == null ? "" : value));
}

function dataUrl(filePath) {
  return "data:image/png;base64," + fs.readFileSync(filePath).toString("base64");
}

async function dataUrlFromImage(img) {
  var buf = await img.getBuffer("image/png");
  return "data:image/png;base64," + buf.toString("base64");
}

function makeWhiteTransparent(img) {
  var out = img.clone();
  var w = out.width;
  var h = out.height;
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var px = out.getPixelColor(x, y);
      var r = (px >> 24) & 0xff;
      var g = (px >> 16) & 0xff;
      var b = (px >> 8) & 0xff;
      var a = px & 0xff;
      if (a > 0 && r > 238 && g > 238 && b > 238 && Math.max(r, g, b) - Math.min(r, g, b) < 18) {
        out.setPixelColor(0x00000000, x, y);
      }
    }
  }
  return out;
}

function cropToVisibleBounds(img) {
  var minX = img.width;
  var minY = img.height;
  var maxX = -1;
  var maxY = -1;
  for (var y = 0; y < img.height; y++) {
    for (var x = 0; x < img.width; x++) {
      var a = img.getPixelColor(x, y) & 0xff;
      if (a > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0 || maxY < 0) return img.clone();
  return img.clone().crop({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
}

async function prepareIllustratedImage(filePath) {
  return cropToVisibleBounds(makeWhiteTransparent(await Jimp.read(fs.readFileSync(filePath))));
}

function makeGrayImage(img) {
  return img.clone().greyscale();
}

async function transparentIconDataUrl(filePath) {
  return dataUrl(filePath);
}

function readTextIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch (e) {
    return "";
  }
}

function getOrderedAnimals() {
  return fs.readdirSync(SOURCE, { withFileTypes: true })
    .filter(function(entry) { return entry.isFile() && /_01\.png$/i.test(entry.name); })
    .map(function(entry) {
      return {
        name: entry.name.replace(/_01\.png$/i, ""),
        colorPath: path.join(SOURCE, entry.name)
      };
    });
}

function getDescription(name) {
  return readTextIfExists(path.join(SOURCE, name + "_简介.txt")) ||
    readTextIfExists(path.join(SOURCE, name, "简介.txt")) ||
    readTextIfExists(path.join(OLD_DESC_SOURCE, name, "简介.txt"));
}

function getIconPath(name) {
  var filePath = path.join(ICON_SOURCE, name + "_01.png");
  return fs.existsSync(filePath) ? filePath : null;
}

async function buildIllustratedData(animals) {
  for (var i = 0; i < animals.length; i++) {
    animals[i].preparedImage = await prepareIllustratedImage(animals[i].colorPath);
    animals[i].colorDataUrl = await dataUrlFromImage(animals[i].preparedImage);
    animals[i].grayDataUrl = await dataUrlFromImage(makeGrayImage(animals[i].preparedImage));
  }

  var code = "(function() {\n";
  code += "  var data = {};\n";
  code += "  var colorData = {};\n";
  code += "  var grayData = {};\n";
  code += "  var iconData = {};\n";
  code += "  var descData = {};\n";

  animals.forEach(function(animal) {
    code += "  colorData[" + jsString(animal.name) + "] = " + jsString(animal.colorDataUrl) + ";\n";
  });

  animals.forEach(function(animal) {
    code += "  grayData[" + jsString(animal.name) + "] = " + jsString(animal.grayDataUrl) + ";\n";
  });

  for (var j = 0; j < animals.length; j++) {
    var animal = animals[j];
    var iconPath = getIconPath(animal.name);
    var iconDataUrl = iconPath ? await transparentIconDataUrl(iconPath) : animal.colorDataUrl;
    code += "  iconData[" + jsString(animal.name) + "] = " + jsString(iconDataUrl) + ";\n";
  }

  animals.forEach(function(animal) {
    code += "  descData[" + jsString(animal.name) + "] = " + jsString(animal.desc) + ";\n";
  });

  code += "  var list = [\n";
  animals.forEach(function(animal) {
    code += "    { name: " + jsString(animal.name) + ", dec: " + jsString(animal.desc) + " },\n";
  });
  code += "  ];\n";

  code += "  var getBase64 = function(name, gray) {\n";
  code += "    var map = gray ? grayData : colorData;\n";
  code += "    return map[name] || null;\n";
  code += "  };\n";
  code += "  var getDesc = function(name) { return descData[name] || \"\"; };\n";
  code += "  var getIconBase64 = function(name) { return iconData[name] || colorData[name] || null; };\n";
  code += "  var getList = function() { return list; };\n";
  code += "  if (typeof GameGlobal !== \"undefined\") {\n";
  code += "    GameGlobal._restoreIllustratedReplacementData = {\n";
  code += "      getBase64: getBase64,\n";
  code += "      getDesc: getDesc,\n";
  code += "      getIconBase64: getIconBase64,\n";
  code += "      getList: getList\n";
  code += "    };\n";
  code += "  }\n";
  code += "})();\n";
  return code;
}

function buildPuzzleData(animals) {
  var code = "(function() {\n";
  code += "  if (typeof GameGlobal === \"undefined\") return;\n";
  code += "  var repl = GameGlobal._restoreIllustratedReplacementData;\n";
  code += "  if (!repl) return;\n";
  code += "  repl._puzzleData = {};\n";
  animals.forEach(function(animal) {
    // Puzzle play needs the original full canvas, including the white backing.
    code += "  repl._puzzleData[" + jsString(animal.name) + "] = " + jsString(dataUrl(animal.colorPath)) + ";\n";
  });
  code += "  repl.getPuzzleBase64 = function(name) {\n";
  code += "    return repl._puzzleData[name] || null;\n";
  code += "  };\n";
  code += "})();\n";
  return code;
}

async function main() {
  if (!fs.existsSync(SOURCE)) throw new Error("Missing source folder: " + SOURCE);
  var animals = getOrderedAnimals().map(function(animal) {
    animal.desc = getDescription(animal.name);
    return animal;
  });
  if (!animals.length) throw new Error("No *_01.png files found in " + SOURCE);

  fs.writeFileSync(ILLUSTRATED_OUT, await buildIllustratedData(animals), "utf8");
  fs.writeFileSync(PUZZLE_OUT, buildPuzzleData(animals), "utf8");

  console.log("Generated illustrated-replacement-data.js", Math.round(fs.statSync(ILLUSTRATED_OUT).size / 1024), "KB");
  console.log("Generated puzzle-replacement-data.js", Math.round(fs.statSync(PUZZLE_OUT).size / 1024), "KB");
  console.log("Order:", animals.map(function(animal) { return animal.name; }).join(", "));
}

main().catch(function(err) {
  console.error(err);
  process.exit(1);
});
