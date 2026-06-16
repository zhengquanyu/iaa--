const { Jimp } = require("./node_modules/jimp");
const fs = require("fs");
const path = require("path");

const SOURCE = path.join(__dirname, "animal_art_extracted", "illustrated_single_png", "animals_by_name_3");
const OLD_DESC_SOURCE = path.join(__dirname, "animal_art_extracted", "illustrated_single_png", "animals_by_name_2");
const OLD_PROCESSED = path.join(__dirname, "animal_art_extracted", "illustrated_single_png", "processed");
const ILLUSTRATED_OUT = path.join(__dirname, "illustrated-replacement-data.js");
const PUZZLE_OUT = path.join(__dirname, "puzzle-replacement-data.js");

function jsString(value) {
  return JSON.stringify(String(value == null ? "" : value));
}

function dataUrl(filePath) {
  return "data:image/png;base64," + fs.readFileSync(filePath).toString("base64");
}

async function transparentIconDataUrl(filePath) {
  var img = await Jimp.read(fs.readFileSync(filePath));
  var w = img.width;
  var h = img.height;
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var px = img.getPixelColor(x, y);
      var r = (px >> 24) & 0xff;
      var g = (px >> 16) & 0xff;
      var b = (px >> 8) & 0xff;
      var a = px & 0xff;
      if (a > 0 && r > 238 && g > 238 && b > 238 && Math.max(r, g, b) - Math.min(r, g, b) < 18) {
        img.setPixelColor(0x00000000, x, y);
      }
    }
  }
  var buf = await img.getBuffer("image/png");
  return "data:image/png;base64," + buf.toString("base64");
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

function getGrayPath(name, colorPath) {
  var localGray = path.join(SOURCE, name + "_gray.png");
  if (fs.existsSync(localGray)) return localGray;
  var oldGray = path.join(OLD_PROCESSED, name + "_gray.png");
  if (fs.existsSync(oldGray)) return oldGray;
  return colorPath;
}

function getDescription(name) {
  return readTextIfExists(path.join(SOURCE, name + "_简介.txt")) ||
    readTextIfExists(path.join(SOURCE, name, "简介.txt")) ||
    readTextIfExists(path.join(OLD_DESC_SOURCE, name, "简介.txt"));
}

async function buildIllustratedData(animals) {
  var code = "(function() {\n";
  code += "  var data = {};\n";
  code += "  var colorData = {};\n";
  code += "  var grayData = {};\n";
  code += "  var iconData = {};\n";
  code += "  var descData = {};\n";

  animals.forEach(function(animal) {
    code += "  colorData[" + jsString(animal.name) + "] = " + jsString(dataUrl(animal.colorPath)) + ";\n";
  });

  animals.forEach(function(animal) {
    code += "  grayData[" + jsString(animal.name) + "] = " + jsString(dataUrl(getGrayPath(animal.name, animal.colorPath))) + ";\n";
  });

  for (var i = 0; i < animals.length; i++) {
    var animal = animals[i];
    code += "  iconData[" + jsString(animal.name) + "] = " + jsString(await transparentIconDataUrl(animal.colorPath)) + ";\n";
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
