(function () {
  var root = typeof GameGlobal !== "undefined" ? GameGlobal : global;
  root.window = root.window || root;
  root.global = root.global || root;

  var modules = Object.create(null);
  var cache = Object.create(null);
  var nativeRequire = root.require;

  function dirname(id) {
    var index = id.lastIndexOf("/");
    return index >= 0 ? id.slice(0, index) : "";
  }

  function normalize(path) {
    var parts = path.split("/");
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (!part || part === ".") continue;
      if (part === "..") out.pop();
      else out.push(part);
    }
    return out.join("/");
  }

  function resolve(request, parentId) {
    if (request.charAt(0) === ".") return normalize(dirname(parentId || "") + "/" + request);
    return request;
  }

  root.define = function define(id, factory) {
    modules[id] = factory;
  };

  root.require = function restoredRequire(id, parentId) {
    var resolved = resolve(id, parentId);
    if (!modules[resolved] && modules[resolved + ".js"]) resolved += ".js";
    if (!modules[resolved]) {
      if (nativeRequire) return nativeRequire(id);
      throw new Error("Cannot find module '" + id + "'");
    }
    if (cache[resolved]) return cache[resolved].exports;

    var module = { exports: {} };
    cache[resolved] = module;
    modules[resolved](function localRequire(request) {
      return root.require(request, resolved);
    }, module, module.exports);
    return module.exports;
  };
})();

require("./index.bundle.js");
