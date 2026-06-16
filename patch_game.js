const fs = require("fs");
const path = require("path");

// Read the replacement data
const replaceData = fs.readFileSync(
  path.join(__dirname, "illustrated-replacement-data.js"),
  "utf8"
);

// Read game.js
let gameJs = fs.readFileSync(path.join(__dirname, "game.js"), "utf8");

// 1. Bump illustratedRenderVersion from 9 to 10
gameJs = gameJs.replace(
  "var illustratedRenderVersion = 9;",
  "var illustratedRenderVersion = 10;"
);

// 2. Replace getIllustrateData to return new animals
const oldGetData = `  function getIllustrateData() {
    var original = getOriginalIllustrateData();
    if (original) return original;
    return [
      { name: "\\u4f01\\u9e45", dec: "" },
      { name: "\\u9e66\\u9e49", dec: "" },
      { name: "\\u5154\\u5b50", dec: "" },
      { name: "\\u5927\\u8c61", dec: "" },
      { name: "\\u5b54\\u96c0", dec: "" },
      { name: "\\u6591\\u9a6c", dec: "" },
      { name: "\\u677e\\u9f20", dec: "" },
      { name: "\\u6cb3\\u9a6c", dec: "" },
      { name: "\\u706b\\u70c8\\u9e1f", dec: "" },
      { name: "\\u718a\\u732b", dec: "" },
      { name: "\\u72d7", dec: "" },
      { name: "\\u732b", dec: "" },
      { name: "\\u732b\\u5934\\u9e70", dec: "" },
      { name: "\\u7334\\u5b50", dec: "" },
      { name: "\\u767d\\u72d7", dec: "" },
      { name: "\\u767d\\u9e3d", dec: "" },
      { name: "\\u7f8a", dec: "" },
      { name: "\\u7f8a\\u9a7c", dec: "" },
      { name: "\\u8001\\u9f20", dec: "" },
      { name: "\\u8003\\u62c9", dec: "" },
      { name: "\\u8682\\u8681", dec: "" },
      { name: "\\u86c7", dec: "" },
      { name: "\\u871c\\u8702", dec: "" },
      { name: "\\u8774\\u8776", dec: "" },
      { name: "\\u8783\\u87f9", dec: "" },
      { name: "\\u888b\\u9f20", dec: "" },
      { name: "\\u9752\\u86d9", dec: "" },
      { name: "\\u9cc4\\u9c7c", dec: "" },
      { name: "\\u9e21", dec: "" },
      { name: "\\u4e4c\\u9f9f", dec: "" }
    ];
  }`;

const newGetData = `  function getIllustrateData() {
    var repl = typeof GameGlobal !== "undefined" && GameGlobal._restoreIllustratedReplacementData;
    var list = repl && repl.getList && repl.getList();
    if (list && list.length) return list;
    var original = getOriginalIllustrateData();
    if (original) return original;
    return [
      { name: "\\u4f01\\u9e45", dec: "" },
      { name: "\\u9e66\\u9e49", dec: "" },
      { name: "\\u5154\\u5b50", dec: "" },
      { name: "\\u5927\\u8c61", dec: "" },
      { name: "\\u5b54\\u96c0", dec: "" },
      { name: "\\u6591\\u9a6c", dec: "" },
      { name: "\\u677e\\u9f20", dec: "" },
      { name: "\\u6cb3\\u9a6c", dec: "" },
      { name: "\\u706b\\u70c8\\u9e1f", dec: "" },
      { name: "\\u718a\\u732b", dec: "" },
      { name: "\\u72d7", dec: "" },
      { name: "\\u732b", dec: "" },
      { name: "\\u732b\\u5934\\u9e70", dec: "" },
      { name: "\\u7334\\u5b50", dec: "" },
      { name: "\\u767d\\u72d7", dec: "" },
      { name: "\\u767d\\u9e3d", dec: "" },
      { name: "\\u7f8a", dec: "" },
      { name: "\\u7f8a\\u9a7c", dec: "" },
      { name: "\\u8001\\u9f20", dec: "" },
      { name: "\\u8003\\u62c9", dec: "" },
      { name: "\\u8682\\u8681", dec: "" },
      { name: "\\u86c7", dec: "" },
      { name: "\\u871c\\u8702", dec: "" },
      { name: "\\u8774\\u8776", dec: "" },
      { name: "\\u8783\\u87f9", dec: "" },
      { name: "\\u888b\\u9f20", dec: "" },
      { name: "\\u9752\\u86d9", dec: "" },
      { name: "\\u9cc4\\u9c7c", dec: "" },
      { name: "\\u9e21", dec: "" },
      { name: "\\u4e4c\\u9f9f", dec: "" }
    ];
  }`;

gameJs = gameJs.replace(oldGetData, newGetData);

// 3. Patch loadIllustrateSpriteFit to try replacement data first
const oldFit = `  function loadIllustrateSpriteFit(sprite, path, maxW, maxH) {
    if (!sprite || !path) return;
    prepareIllustrateSpriteLoad(sprite, path);
    if (illustrateFrameCache[path]) {`;

const newFit = `  function loadIllustrateSpriteFit(sprite, path, maxW, maxH) {
    if (!sprite || !path) return;
    prepareIllustrateSpriteLoad(sprite, path);
    var b64 = getIllustratedReplacementBase64(path);
    if (b64) {
      loadRemoteTextureAsSpriteFrame([b64], 0, function(frame) {
        if (frame) {
          illustrateFrameCache[path] = frame;
          if (sprite && sprite.node && sprite.node.isValid) {
            applyIllustrateFrameToSprite(sprite, path, frame);
            fitIllustrateSprite(sprite, frame, maxW, maxH);
          }
        }
      });
      return;
    }
    if (illustrateFrameCache[path]) {`;

gameJs = gameJs.replace(oldFit, newFit);

// 4. Patch loadIllustrateSprite similarly
const oldLoad = `  function loadIllustrateSprite(sprite, path) {
    if (!sprite || !path) return;
    prepareIllustrateSpriteLoad(sprite, path);
    if (illustrateFrameCache[path]) {`;

const newLoad = `  function loadIllustrateSprite(sprite, path) {
    if (!sprite || !path) return;
    prepareIllustrateSpriteLoad(sprite, path);
    var b64 = getIllustratedReplacementBase64(path);
    if (b64) {
      loadRemoteTextureAsSpriteFrame([b64], 0, function(frame) {
        if (frame) {
          illustrateFrameCache[path] = frame;
          if (sprite && sprite.node && sprite.node.isValid) {
            applyIllustrateFrameToSprite(sprite, path, frame);
          }
        }
      });
      return;
    }
    if (illustrateFrameCache[path]) {`;

gameJs = gameJs.replace(oldLoad, newLoad);

// 5. Add getIllustratedReplacementBase64 helper function
// Insert it right before loadIllustrateSprite
const insertBefore = "  function loadIllustrateSprite(sprite, path) {";
const helperFunc = `
  function getIllustratedReplacementBase64(path) {
    try {
      if (typeof GameGlobal === "undefined") return null;
      var repl = GameGlobal._restoreIllustratedReplacementData;
      if (!repl || !repl.getBase64) return null;
      // path like "ab:game/texture/illustrated/animal/斑马" or ".../animalGray/斑马"
      var isGray = false;
      if (path.indexOf("/animalGray/") >= 0) isGray = true;
      else if (path.indexOf("/animal/") < 0) return null;
      var name = path.split("/").pop();
      if (!name) return null;
      return repl.getBase64(name, isGray);
    } catch (e) { return null; }
  }
` + insertBefore;

gameJs = gameJs.replace(insertBefore, helperFunc);

// 6. Embed the IIFE data before the final `})();`
gameJs = gameJs.replace(/\}\)\(\);$/, "\n" + replaceData + "\n})();");

fs.writeFileSync(path.join(__dirname, "game.js"), gameJs, "utf8");
console.log("game.js modified successfully");
console.log("New size:", Math.round(fs.statSync(path.join(__dirname, "game.js")).size / 1024), "KB");
