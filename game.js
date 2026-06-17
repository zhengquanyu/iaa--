require("./wx-restore-loader.js");

(function () {
  function suppressGameClubButton(button) {
    if (!button || button._restoreGameClubSuppressed) return button;
    try { button.hide && button.hide(); } catch (err) {}
    try {
      if (button.show) {
        button._restoreOriginalShow = button.show;
        button.show = function () {
          try { button.hide && button.hide(); } catch (err) {}
        };
      }
      if (button.onShow) button.onShow(function () { try { button.hide && button.hide(); } catch (err) {} });
      button._restoreGameClubSuppressed = true;
    } catch (err2) {}
    return button;
  }

  function installPreBundleGameClubSuppressor() {
    try {
      var wxObj = typeof wx !== "undefined" ? wx : (typeof GameGlobal !== "undefined" && GameGlobal.wx);
      if (!wxObj || wxObj._restoreCreateGameClubSuppressed) return;
      var originalCreate = wxObj.createGameClubButton;
      if (typeof originalCreate === "function") {
        wxObj.createGameClubButton = function () {
          var button = originalCreate.apply(this, arguments);
          return suppressGameClubButton(button);
        };
      } else {
        wxObj.createGameClubButton = function () {
          return suppressGameClubButton({ hide: function () {}, show: function () {}, destroy: function () {} });
        };
      }
      wxObj._restoreCreateGameClubSuppressed = true;
    } catch (err) {}
  }

  installPreBundleGameClubSuppressor();
  try { if (typeof GameGlobal !== "undefined") GameGlobal._restoreSuppressGameClubButton = suppressGameClubButton; } catch (err) {}
})();

(function () {
  var animalNames = {
    zhu: true, niu: true, tu: true, gou: true, mao: true, ji: true, ma: true,
    hou: true, she: true, shu: true, hu: true, xiong: true, xiongmao: true,
    kaola: true, ka: true, eyu: true, pangxie: true, qingwa: true,
    kongque: true, yingwu: true, banma: true, daxiang: true, hudie: true,
    mifeng: true, mayi: true, yang: true
  };
  function normalizeLevelAnimalNames(value) {
    if (!value || typeof value !== "object") return value;
    if (typeof value.name === "string" && animalNames[value.name]) value.name = "yang";
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) normalizeLevelAnimalNames(value[i]);
      return value;
    }
    for (var key in value) if (Object.prototype.hasOwnProperty.call(value, key)) normalizeLevelAnimalNames(value[key]);
    return value;
  }
  try {
    if (typeof JSON !== "undefined" && JSON.parse && !JSON._restoreSheepParamParse) {
      var originalParse = JSON.parse;
      JSON.parse = function () {
        var parsed = originalParse.apply(this, arguments);
        return normalizeLevelAnimalNames(parsed);
      };
      JSON._restoreSheepParamParse = true;
    }
  } catch (err) {}
})();

require("./game.bundle.js");

// Runtime sheep visuals use the game's native sheep parameters; level animal names are normalized before creation.

(function () {
  var patchedStartBtn = null;
  var pauseActionTimes = Object.create(null);
  var illustratedRenderVersion = 13;
  var sheepSpriteFrame = null;
  var sheepSpriteLoading = false;
  var sheepSpriteWaiters = [];
  var sheepSequenceFrames = null;
  var sheepSequenceLoading = false;
  var sheepSequenceWaiters = [];
  var sheepSequenceNodes = [];
  var sheepSequenceFrameMs = 83;
  var sheepMotionFrameMs = 33;
  var animalSpriteFrameCache = Object.create(null);
  var animalSpriteFrameLoading = Object.create(null);
  var replacementSpriteFrameCache = Object.create(null);
  var replacementSpriteFrameLoading = Object.create(null);
  var dataUrlImagePathCache = Object.create(null);
  var puzzleReplacementDataLoaded = false;
  var animalNodeNames = Object.create(null);
  var puzzleHoldTimer = null;
  var puzzleHoldInterval = null;
  var puzzleDirectHoldTimer = null;
  var puzzleDirectHoldInterval = null;
  var puzzleGlobalTouchTarget = null;
  var puzzleHoldActive = false;
  var puzzleHoldRepeated = false;
  var puzzleUnlockLastTime = 0;
  var puzzleFeedbackLastTime = 0;
  var puzzleLogLastTime = 0;
  var puzzleTouchLastTime = 0;
  var puzzlePressStartTime = 0;
  var puzzleCancelStopTimer = null;
  var puzzleForceStopTimer = null;
  var activePuzzlePanel = null;
  var puzzleCompletionOpening = false;
  var rankDataCache = Object.create(null);
  var illustrateFrameCache = Object.create(null);
  var illustrateFrameLoading = Object.create(null);
  var homeColorModeFrameCache = Object.create(null);
  var homeColorModeFrameLoading = Object.create(null);
  var uiReplacementFrameCache = Object.create(null);
  var uiReplacementFrameLoading = Object.create(null);
  var homeColorMode = null;
  var homeColorModeToggleTime = 0;
  var resultNextLastTime = 0;

  [
    "zhu",
    "yang",
    "niu",
    "tu",
    "gou",
    "mao",
    "ji",
    "ma",
    "hou",
    "she",
    "shu",
    "hu",
    "xiong",
    "xiongmao",
    "kaola",
    "eyu",
    "pangxie",
    "qingwa",
    "kongque",
    "yingwu",
    "banma",
    "daxiang",
    "hudie",
    "mifeng",
    "mayi"
  ].forEach(function (name) {
    animalNodeNames[name] = true;
  });

  function findNode(root, name) {
    if (!root) return null;
    if (root.name === name) return root;
    var children = root.children || [];
    for (var i = 0; i < children.length; i++) {
      var found = findNode(children[i], name);
      if (found) return found;
    }
    return null;
  }

  function findChild(root, name) {
    if (!root) return null;
    var children = root.children || [];
    for (var i = 0; i < children.length; i++) {
      if (children[i].name === name) return children[i];
    }
    return null;
  }

  function findAncestorWithChild(node, childName) {
    var cur = node;
    while (cur && cur.isValid) {
      if (findChild(cur, childName)) return cur;
      cur = cur.parent;
    }
    return null;
  }

  function findAncestorByName(node, name) {
    var cur = node;
    while (cur && cur.isValid) {
      if (cur.name === name) return cur;
      cur = cur.parent;
    }
    return null;
  }

  function isNodeUnderRoot(node, root) {
    var cur = node;
    while (cur && cur.isValid) {
      if (cur === root) return true;
      cur = cur.parent;
    }
    return false;
  }

  function findPanelWithChildren(root, names) {
    if (!root) return null;
    var ok = true;
    for (var i = 0; i < names.length; i++) {
      if (!findChild(root, names[i])) {
        ok = false;
        break;
      }
    }
    if (ok) return root;

    var children = root.children || [];
    for (var j = 0; j < children.length; j++) {
      var found = findPanelWithChildren(children[j], names);
      if (found) return found;
    }
    return null;
  }

  function findActivePanelWithChildren(root, names) {
    if (!root) return null;
    var ok = root.activeInHierarchy;
    if (ok) {
      for (var i = 0; i < names.length; i++) {
        if (!findChild(root, names[i])) {
          ok = false;
          break;
        }
      }
      if (ok) return root;
    }

    var children = root.children || [];
    for (var j = children.length - 1; j >= 0; j--) {
      var found = findActivePanelWithChildren(children[j], names);
      if (found) return found;
    }
    return null;
  }

  function hideTouchableNode(node) {
    if (!node || !node.isValid) return;
    node.active = false;
    node.opacity = 0;
    node.width = 0;
    node.height = 0;
    if (node.pauseSystemEvents) node.pauseSystemEvents(true);
  }

  function hideGuideNode(node) {
    if (!node || !node.isValid) return;
    try { cc.Tween && cc.Tween.stopAllByTarget && cc.Tween.stopAllByTarget(node); } catch (err) {}
    node.active = false;
    node.opacity = 0;
    if (node.pauseSystemEvents) node.pauseSystemEvents(true);
  }

  function hideGuideNodesUnder(root) {
    if (!root || !root.isValid) return;
    var guideNodes = findNodes(root, "guideNode");
    for (var i = 0; i < guideNodes.length; i++) {
      var guideNode = guideNodes[i];
      var finger = findNode(guideNode, "finger");
      hideGuideNode(finger);
      hideGuideNode(guideNode);
    }
  }

  function suppressGameGuide() {
    try {
      var gameAppModule = requireGameModule("GameApp");
      var gameApp = gameAppModule.GameApp || gameAppModule.default || gameAppModule;
      if (gameApp.gameMgr) gameApp.gameMgr.guidePos = null;
      if (gameApp.uiMgr) {
        hideGuideNode(gameApp.uiMgr.finger);
        hideGuideNode(gameApp.uiMgr.guideNode);
      }
    } catch (err) {}

    try {
      if (GameGlobal.cc && cc.director && cc.director.getScene()) hideGuideNodesUnder(cc.director.getScene());
    } catch (err2) {}
  }

  function suppressGameGuideSoon() {
    suppressGameGuide();
    setTimeout(suppressGameGuide, 0);
    setTimeout(suppressGameGuide, 80);
    setTimeout(suppressGameGuide, 300);
  }

  function findNodes(root, name, out) {
    out = out || [];
    if (!root) return out;
    if (root.name === name) out.push(root);
    var children = root.children || [];
    for (var i = 0; i < children.length; i++) findNodes(children[i], name, out);
    return out;
  }

  function clearNodeGraphics(node) {
    if (!node || !node.isValid || typeof cc === "undefined" || !cc.Graphics || !node.getComponent) return;
    try {
      var graphics = node.getComponent(cc.Graphics);
      if (graphics && graphics.clear) graphics.clear();
    } catch (err) {}
  }

  function hideNodeOwnSprite(node) {
    if (!node || !node.isValid || typeof cc === "undefined" || !cc.Sprite || !node.getComponent) return;
    try {
      var sprite = node.getComponent(cc.Sprite);
      if (sprite) {
        sprite.spriteFrame = null;
        sprite.enabled = false;
      }
    } catch (err) {}
    clearNodeGraphics(node);
  }

  function collectNodes(root, out) {
    out = out || [];
    if (!root) return out;
    out.push(root);
    var children = root.children || [];
    for (var i = 0; i < children.length; i++) collectNodes(children[i], out);
    return out;
  }

  function requireGameModule(name) {
    if (GameGlobal.__require) {
      try {
        return GameGlobal.__require(name);
      } catch (err) {}
    }
    if (GameGlobal.require) {
      try {
        return GameGlobal.require(name);
      } catch (err) {}
    }
    throw new Error("Cannot find game module '" + name + "'");
  }

  function getGameGlobals() {
    var gameUiConfig = requireGameModule("GameUIConfig");
    var globalModule = requireGameModule("Global");
    return {
      globalData: globalModule.default || globalModule,
      uiId: gameUiConfig.UIID || (gameUiConfig.default && gameUiConfig.default.UIID)
    };
  }

  function runPauseAction(name, handler) {
    var now = Date.now();
    if (pauseActionTimes[name] && now - pauseActionTimes[name] < 250) return;
    pauseActionTimes[name] = now;
    handler();
  }

  function pointInNodeTree(node, point) {
    if (!node || !node.activeInHierarchy || !point) return false;
    if (node.getBoundingBoxToWorld && node.getBoundingBoxToWorld().contains(point)) return true;
    var children = node.children || [];
    for (var i = 0; i < children.length; i++) {
      if (pointInNodeTree(children[i], point)) return true;
    }
    return false;
  }

  function pointInNodeBox(node, point, padX, padY) {
    if (!node || !node.isValid || !node.activeInHierarchy || !point || !node.getBoundingBoxToWorld) return false;
    var box = node.getBoundingBoxToWorld();
    if (!box) return false;
    padX = padX || 0;
    padY = padY || 0;
    return point.x >= box.x - padX && point.x <= box.x + box.width + padX &&
      point.y >= box.y - padY && point.y <= box.y + box.height + padY;
  }

  function addDeepTouch(target, name, handler) {
    if (!target || !target.isValid) return;
    target._restoreTouchHandlers = target._restoreTouchHandlers || {};
    if (target._restoreTouchHandlers[name]) return;
    target.on(cc.Node.EventType.TOUCH_END, function (event) {
      event.stopPropagation && event.stopPropagation();
      runPauseAction(name, handler);
    });
    var children = target.children || [];
    for (var i = 0; i < children.length; i++) addDeepTouch(children[i], name, handler);
    target._restoreTouchHandlers[name] = true;
  }

  function getHomeColorMode() {
    if (homeColorMode === "pure" || homeColorMode === "multi") return homeColorMode;
    try {
      var stored = cc.sys && cc.sys.localStorage && cc.sys.localStorage.getItem("restore_home_color_mode");
      homeColorMode = stored === "multi" ? "multi" : "pure";
    } catch (err) {
      homeColorMode = "pure";
    }
    return homeColorMode;
  }

  function setHomeColorMode(mode) {
    homeColorMode = mode === "multi" ? "multi" : "pure";
    try {
      cc.sys && cc.sys.localStorage && cc.sys.localStorage.setItem("restore_home_color_mode", homeColorMode);
    } catch (err) {}
  }

  function emitChangeSkin() {
    try {
      var eventModule = requireGameModule("EventDispatcher");
      var ed = eventModule.ED || (eventModule.default && eventModule.default.ED);
      var clientEvent = eventModule.ClientEvent || (eventModule.default && eventModule.default.ClientEvent);
      if (ed && clientEvent && clientEvent.CHANGE_SKIN) ed.send(clientEvent.CHANGE_SKIN);
    } catch (err) {}
  }

  function emitClientEvent(eventName) {
    try {
      var eventModule = requireGameModule("EventDispatcher");
      var ed = eventModule.ED || (eventModule.default && eventModule.default.ED);
      var clientEvent = eventModule.ClientEvent || (eventModule.default && eventModule.default.ClientEvent);
      if (ed && clientEvent && clientEvent[eventName]) ed.send(clientEvent[eventName]);
    } catch (err) {}
  }

  function installHitArea(target, name, handler) {
    if (!target || !target.isValid || target._restoreHitArea) return;
    target.on(cc.Node.EventType.TOUCH_END, function (event) {
      event.stopPropagation && event.stopPropagation();
      handler();
    });
    target._restoreHitArea = true;
    console.log("restore button listener installed", name, target.width, target.height);
  }

  function setNodeTreeVisible(node) {
    if (!node || !node.isValid) return;
    node.active = true;
    node.opacity = 255;
    if (node.setLocalZOrder) node.setLocalZOrder(999);
    var children = node.children || [];
    for (var i = 0; i < children.length; i++) setNodeTreeVisible(children[i]);
  }

  function keepNodeVisibleForTouch(node) {
    if (!node || !node.isValid) return;
    node.active = true;
    node.opacity = 255;
    if (node.setLocalZOrder) node.setLocalZOrder(999);
  }

  function closeMenuPanel(globalData, uiId) {
    try {
      globalData.gui.remove(uiId.MemuPanel);
    } catch (err) {}
  }

  function openMenuPanel() {
    try {
      var globals = getGameGlobals();
      globals.globalData.platform && globals.globalData.platform.playEffect && globals.globalData.platform.playEffect("ab:audio/click");
      globals.globalData.gui.open(globals.uiId.MemuPanel);
      scrubHomeMenuPanelSoon();
      console.log("restore home menu open");
    } catch (err) {
      console.error("restore home menu open failed", err && err.message ? err.message : err);
    }
  }

  function openRankPanel() {
    try {
      var globals = getGameGlobals();
      globals.globalData.platform && globals.globalData.platform.playEffect && globals.globalData.platform.playEffect("ab:audio/click");
      globals.globalData.gui.open(globals.uiId.RankPanel);
      setTimeout(function () {
        try { installRankPanelPatch(); } catch (err) {}
      }, 0);
      console.log("restore home rank open");
    } catch (err) {
      console.error("restore home rank open failed", err && err.message ? err.message : err);
    }
  }

  function openIllustratedPanel() {
    try {
      var globals = getGameGlobals();
      globals.globalData.isPuzzle = false;
      globals.globalData.platform && globals.globalData.platform.playEffect && globals.globalData.platform.playEffect("ab:audio/click");
      preloadIllustratedFrames(9);
      globals.globalData.gui.open(globals.uiId.IllustratedPanel);
      setTimeout(function () {
        try { installIllustratedPanelPatch(); } catch (err) {}
      }, 0);
      console.log("restore home illustrated open");
    } catch (err) {
      console.error("restore home illustrated open failed", err && err.message ? err.message : err);
    }
  }

  function openGamePanel() {
    try {
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      var uiId = globals.uiId;
      console.log("restore start button direct open", !!globalData, !!uiId);
      applyHomeColorMode();
      scrubFirstFrameButtonsSoon(260);
      globalData.isPuzzle = false;
      globalData.platform && globalData.platform.playEffect && globalData.platform.playEffect("ab:audio/click");
      globalData.gui.remove(uiId.MainPanel);
      globalData.gui.open(uiId.GamePanel);
      scrubFirstFrameButtonsSoon(420);
    } catch (err) {
      console.error("restore start button failed", err && err.message ? err.message : err);
    }
  }

  function restoreStartButtonAnimation(startBtn) {
    if (!startBtn || !startBtn.isValid) return;
    if (startBtn._restoreStartAnimTarget === startBtn && startBtn._restoreStartAnimInstalled) return;
    startBtn._restoreStartAnimTarget = startBtn;
    startBtn._restoreStartAnimInstalled = true;
    try {
      var utilModule = requireGameModule("Util");
      var util = utilModule.Util || (utilModule.default && utilModule.default.Util) || utilModule.default || utilModule;
      if (util && typeof util.btnAnimation === "function") {
        util.btnAnimation(startBtn);
        console.log("restore start button original animation");
        return;
      }
    } catch (err) {}
    if (cc.Tween && cc.tween) {
      cc.Tween.stopAllByTarget(startBtn);
      startBtn.setScale && startBtn.setScale(1);
      var pulse = cc.tween(startBtn).to(1, { scale: 1.1 }).to(1, { scale: 1 }).to(1, { scale: 1.1 }).to(1, { scale: 1 });
      cc.tween(startBtn).repeatForever(pulse).start();
      console.log("restore start button fallback animation");
    }
  }

  function openPuzzlePanel() {
    try {
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      var uiId = globals.uiId;
      ensurePuzzleUserData(globalData);
      globalData.isPuzzle = true;
      globalData.platform && globalData.platform.playEffect && globalData.platform.playEffect("ab:audio/click");
      globalData.platform && globalData.platform.hideGameClub && globalData.platform.hideGameClub();
      try { globalData.gui.remove(uiId.PuzzlePanel); } catch (removeErr) {}
      globalData.gui.open(uiId.PuzzlePanel);
      setTimeout(function () {
        emitClientEvent("UPDATE_PUZZLE_MASK");
      }, 0);
      console.log("restore home puzzle open");
    } catch (err) {
      console.error("restore home puzzle open failed", err && err.message ? err.message : err);
    }
  }

  function shareHome() {
    try {
      var globals = getGameGlobals();
      var platform = globals.globalData && globals.globalData.platform;
      platform && platform.playEffect && platform.playEffect("ab:audio/click");
      var isDevTools = false;
      try {
        var sys = typeof wx !== "undefined" && wx.getSystemInfoSync && wx.getSystemInfoSync();
        isDevTools = !!(sys && sys.platform === "devtools");
      } catch (sysErr) {}
      if (isDevTools) {
        console.log("restore home share devtools preview", platform && platform.shareData ? platform.shareData : null);
      } else if (platform && typeof platform.share === "function") {
        platform.share(null);
      } else if (typeof wx !== "undefined" && wx.shareAppMessage) {
        wx.shareAppMessage(platform && platform.shareData ? platform.shareData : {});
      }
      console.log("restore home share");
    } catch (err) {
      console.error("restore home share failed", err && err.message ? err.message : err);
    }
  }

  function ensurePuzzleUserData(globalData) {
    if (!globalData || !globalData.user) return;
    if (typeof globalData.user.blockNum !== "number" || isNaN(globalData.user.blockNum)) globalData.user.blockNum = 0;
    if (!globalData.user.puzzleProgress || typeof globalData.user.puzzleProgress !== "object") globalData.user.puzzleProgress = {};
    for (var i = 0; i < 30; i++) {
      if (typeof globalData.user.puzzleProgress[i] !== "number" || isNaN(globalData.user.puzzleProgress[i])) {
        globalData.user.puzzleProgress[i] = 0;
      }
    }
  }

  function getLevelBlockReward() {
    try {
      var staticModule = requireGameModule("StaticData");
      var staticData = staticModule.StaticData || (staticModule.default && staticModule.default.StaticData);
      if (staticData && typeof staticData.levelBlock === "number") return staticData.levelBlock;
    } catch (err) {}
    return 39;
  }

  function getStaticData() {
    try {
      var staticModule = requireGameModule("StaticData");
      return staticModule.StaticData || (staticModule.default && staticModule.default.StaticData) || null;
    } catch (err) {}
    return null;
  }

  function getPuzzleMax() {
    var staticData = getStaticData();
    return staticData && typeof staticData.puzzleMax === "number" ? staticData.puzzleMax : 156;
  }

  function getOriginalIllustrateData() {
    var staticData = getStaticData();
    return staticData && staticData.illustrateData && staticData.illustrateData.length ? staticData.illustrateData : null;
  }

  function getPuzzleAnimalData(puzzleIndex) {
    var list = getIllustrateData();
    var data = list && list[puzzleIndex];
    if (!data) {
      var original = getOriginalIllustrateData();
      data = original && original[puzzleIndex];
    }
    return data || { name: "\u52a8\u7269\u540d\u79f0", dec: "\u52a8\u7269\u4ecb\u7ecd" };
  }

  function awardPuzzleBlocks(reason) {
    try {
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      ensurePuzzleUserData(globalData);
      var user = globalData.user;
      var level = typeof user.level === "number" ? user.level : 0;
      if (level <= 1) return;
      if (globalData._restorePuzzleAwardLevel === level) return;

      var amount = getLevelBlockReward();
      user.blockNum += amount;
      persistPuzzleUserData(user);
      globalData._restorePuzzleAwardLevel = level;
      console.log("restore puzzle blocks awarded", amount, "level", level, reason || "");
    } catch (err) {
      console.error("restore puzzle blocks award failed", err && err.message ? err.message : err);
    }
  }

  function reconcilePuzzleBlocks(globalData) {
    if (!globalData || !globalData.user) return;
    var user = globalData.user;
    var level = typeof user.level === "number" ? user.level : 1;
    if (level <= 1) return;

    var used = 0;
    for (var i = 0; i < 30; i++) {
      var progress = user.puzzleProgress && typeof user.puzzleProgress[i] === "number" ? user.puzzleProgress[i] : 0;
      used += Math.max(0, progress);
    }

    var earned = (level - 1) * getLevelBlockReward();
    var expectedLeft = Math.max(0, earned - used);
    if (user.blockNum < expectedLeft) {
      user.blockNum = expectedLeft;
      console.log("restore puzzle blocks reconciled", expectedLeft, "level", level, "used", used);
    }
  }

  function persistPuzzleUserData(user) {
    try {
      if (user && typeof user.delaySave === "function") user.delaySave();
    } catch (err) {}
    try {
      if (user && typeof user.save === "function") user.save();
    } catch (err) {}
  }

  function refreshPuzzlePanelBlockLabel(scene) {
    var panel = getPuzzlePanel(scene);
    if (!panel || !panel.activeInHierarchy) return;
    try {
      var globals = getGameGlobals();
      ensurePuzzleUserData(globals.globalData);
      var blockNumNode = findNode(panel, "blockNum");
      var label = blockNumNode && blockNumNode.getComponent(cc.Label);
      if (label) label.string = "\u788e\u7247\u6570\u91cf\uff1a" + globals.globalData.user.blockNum;
    } catch (err) {}
  }

  function getPuzzlePanel(scene) {
    return findPanelWithChildren(scene, ["puzzleBtn", "blockNode", "blockNum"]) ||
      findPanelWithChildren(scene, ["puzzleBtn", "backBtn", "continueBtn"]);
  }

  function getPuzzlePanelComponent(panel) {
    if (!panel || !panel.isValid) return null;
    if (panel._restorePuzzleComp && panel._restorePuzzleComp.node && panel._restorePuzzleComp.node.isValid) return panel._restorePuzzleComp;
    var comps = panel.getComponents ? panel.getComponents(cc.Component) : [];
    for (var i = 0; i < comps.length; i++) {
      if (comps[i] && typeof comps[i].unLockPuzzle === "function") {
        panel._restorePuzzleComp = comps[i];
        return comps[i];
      }
    }
    var children = panel.children || [];
    for (var j = 0; j < children.length; j++) {
      var found = getPuzzlePanelComponent(children[j]);
      if (found) {
        panel._restorePuzzleComp = found;
        return found;
      }
    }
    return null;
  }

  function getPuzzleRuntime(panel) {
    if (!panel || !panel.isValid) return null;
    var runtime = panel._restorePuzzleRuntime;
    if (!runtime || !runtime.mask || !runtime.mask.isValid || !runtime.puzzleBtn || !runtime.puzzleBtn.isValid) {
      runtime = {
        comp: getPuzzlePanelComponent(panel),
        mask: findNode(panel, "mask"),
        puzzle: findNode(panel, "puzzle"),
        puzzleBtn: findNode(panel, "puzzleBtn"),
        puzzleBtnLabel: findNode(panel, "puzzleBtnLabel"),
        continueBtn: findNode(panel, "continueBtn"),
        blockNumNode: findNode(panel, "blockNum"),
        animNode: findNode(panel, "animNode")
      };
      runtime.blockNumLabel = runtime.blockNumNode && runtime.blockNumNode.getComponent(cc.Label);
      panel._restorePuzzleRuntime = runtime;
    }
    return runtime;
  }

  function getPuzzleIndex(globalData, comp) {
    var user = globalData && globalData.user;
    var max = getPuzzleMax();
    if (comp && typeof comp.puzzleIndex === "number" && user && user.puzzleProgress[comp.puzzleIndex] < max) return comp.puzzleIndex;
    for (var i = 0; i < 30; i++) {
      if (user && user.puzzleProgress[i] < max) return i;
    }
    return 29;
  }

  function applyPuzzleMaskProgress(panel, progress) {
    var runtime = getPuzzleRuntime(panel);
    var mask = runtime && runtime.mask;
    if (!mask || !mask.children) return;
    progress = Math.max(0, Math.min(mask.children.length, progress || 0));
    for (var i = 0; i < mask.children.length; i++) {
      var block = mask.children[i];
      if (!block || !block.isValid) continue;
      if (i < progress) {
        block.active = false;
        block.opacity = 0;
      } else {
        block.active = true;
        block.opacity = 255;
      }
    }
  }
  function revealPuzzleMask(panel, index) {
    var runtime = getPuzzleRuntime(panel);
    var mask = runtime && runtime.mask;
    if (!mask || !mask.children) return;
    var block = mask.children[index];
    if (block && block.isValid) {
      block.active = false;
      block.opacity = 0;
    }
  }

  function updatePuzzlePanelState(panel, user) {
    var runtime = getPuzzleRuntime(panel);
    if (!runtime) return;
    if (runtime.blockNumLabel) runtime.blockNumLabel.string = "\u788e\u7247\u6570\u91cf\uff1a" + user.blockNum;
    var globals = getGameGlobals();
    var globalData = globals.globalData;
    var comp = runtime.comp;
    var max = getPuzzleMax();
    var puzzleIndex = getPuzzleIndex(globalData, comp);
    var progress = globalData && globalData.user && globalData.user.puzzleProgress ? globalData.user.puzzleProgress[puzzleIndex] || 0 : 0;
    var lockedFinish = puzzleIndex === 29 && progress >= max;
    var hasBlocks = user.blockNum > 0 && !lockedFinish;
    if (runtime.puzzleBtn) runtime.puzzleBtn.active = hasBlocks;
    if (runtime.puzzleBtnLabel) runtime.puzzleBtnLabel.active = hasBlocks;
    if (runtime.continueBtn) runtime.continueBtn.active = true;
  }

  function playPuzzleFeedback(globalData) {
    var now = Date.now();
    var minGap = puzzleHoldActive ? 280 : 140;
    if (now - puzzleFeedbackLastTime < minGap) return;
    puzzleFeedbackLastTime = now;
    globalData.platform && globalData.platform.playEffect && globalData.platform.playEffect("ab:audio/click2");
    globalData.platform && globalData.platform.shock && globalData.platform.shock("medium");
  }

  function nodeBoxIntersects(a, b, padX, padY) {
    if (!a || !b) return false;
    padX = padX || 0;
    padY = padY || 0;
    return a.x <= b.x + b.width + padX && a.x + a.width >= b.x - padX &&
      a.y <= b.y + b.height + padY && a.y + a.height >= b.y - padY;
  }

  function isPuzzleEffectName(name) {
    name = (name || "").toLowerCase();
    return name.indexOf("light") >= 0 || name.indexOf("glow") >= 0 ||
      name.indexOf("shine") >= 0 || name.indexOf("flash") >= 0 ||
      name.indexOf("particle") >= 0 || name.indexOf("effect") >= 0 ||
      name.indexOf("highlight") >= 0 || name.indexOf("halo") >= 0 ||
      name === "eff" || name === "touchnode";
  }

  function hasPuzzleEffectComponent(node) {
    if (!node || !node.isValid || !node.getComponent) return false;
    try { if (cc.ParticleSystem && node.getComponent(cc.ParticleSystem)) return true; } catch (err) {}
    try { if (cc.Animation && node.getComponent(cc.Animation) && isPuzzleEffectName(node.name)) return true; } catch (err2) {}
    return false;
  }

  function suppressPuzzleEffectNode(node) {
    if (!node || !node.isValid) return;
    try { cc.Tween && cc.Tween.stopAllByTarget && cc.Tween.stopAllByTarget(node); } catch (err) {}
    try { node.stopAllActions && node.stopAllActions(); } catch (err) {}
    try {
      var particle = cc.ParticleSystem && node.getComponent && node.getComponent(cc.ParticleSystem);
      if (particle) {
        particle.stopSystem && particle.stopSystem();
        particle.resetSystem && particle.resetSystem();
        particle.enabled = false;
      }
    } catch (err) {}
    try {
      var animation = cc.Animation && node.getComponent && node.getComponent(cc.Animation);
      if (animation) {
        animation.stop && animation.stop();
        animation.enabled = false;
      }
    } catch (err) {}
    try {
      var skeleton = sp && sp.Skeleton && node.getComponent && node.getComponent(sp.Skeleton);
      if (skeleton) {
        skeleton.clearTracks && skeleton.clearTracks();
        skeleton.enabled = false;
      }
    } catch (err) {}
    node.active = false;
    node.opacity = 0;
    node.scale = 0;
    var children = node.children || [];
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child && child.isValid && (isPuzzleEffectName(child.name) || hasPuzzleEffectComponent(child))) suppressPuzzleEffectNode(child);
    }
  }

  function cleanupPuzzleBoardAreaEffects(panel) {
    if (!panel || !panel.isValid) return;
    var puzzleBtn = findNode(panel, "puzzleBtn");
    var continueBtn = findNode(panel, "continueBtn");
    var backBtn = findNode(panel, "backBtn");
    var blockNode = findNode(panel, "blockNode");
    var animNode = findNode(panel, "animNode");
    var mask = findNode(panel, "mask");
    var puzzle = findNode(panel, "puzzle");
    var frame = findNode(panel, "img_huakuang") || findNode(panel, "unLockedPicture") || mask || puzzle;
    var targetBox = null;
    try {
      targetBox = (frame && frame.getBoundingBoxToWorld && frame.getBoundingBoxToWorld()) ||
        (mask && mask.getBoundingBoxToWorld && mask.getBoundingBoxToWorld()) ||
        (puzzle && puzzle.getBoundingBoxToWorld && puzzle.getBoundingBoxToWorld());
    } catch (err) {}
    if (!targetBox) return;

    var nodes = [];
    collectNodes(panel, nodes);
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!node || !node.isValid) continue;
      if (node === frame || node === mask || node === puzzle) continue;
      if (isNodeUnderRoot(node, puzzleBtn) || isNodeUnderRoot(node, continueBtn) ||
        isNodeUnderRoot(node, backBtn) || isNodeUnderRoot(node, blockNode) || isNodeUnderRoot(node, animNode)) continue;
      if (!isPuzzleEffectName(node.name) && !hasPuzzleEffectComponent(node)) continue;
      var nodeBox = null;
      try { nodeBox = node.getBoundingBoxToWorld && node.getBoundingBoxToWorld(); } catch (boxErr) {}
      var nearBoard = nodeBox ? nodeBoxIntersects(nodeBox, targetBox, 180, 180) :
        (isNodeUnderRoot(node, mask) || isNodeUnderRoot(node, puzzle) || isNodeUnderRoot(node, frame));
      if (nearBoard) suppressPuzzleEffectNode(node);
    }
  }

  function cleanupPuzzleFrameGlow(panel) {
    if (!panel || !panel.isValid) return;
    var puzzleBtn = findNode(panel, "puzzleBtn");
    var continueBtn = findNode(panel, "continueBtn");
    var backBtn = findNode(panel, "backBtn");
    var blockNode = findNode(panel, "blockNode");
    var mask = findNode(panel, "mask");
    var puzzle = findNode(panel, "puzzle");
    var frame = findNode(panel, "img_huakuang") || findNode(panel, "unLockedPicture") || mask || puzzle;
    var targetBox = null;
    try {
      targetBox = (frame && frame.getBoundingBoxToWorld && frame.getBoundingBoxToWorld()) ||
        (mask && mask.getBoundingBoxToWorld && mask.getBoundingBoxToWorld()) ||
        (puzzle && puzzle.getBoundingBoxToWorld && puzzle.getBoundingBoxToWorld());
    } catch (err) {}
    if (!targetBox) return;
    var effectNames = ["Light", "light", "glow", "shine", "flash", "highlight", "halo", "effect", "eff", "particleClick", "particle"];
    for (var n = 0; n < effectNames.length; n++) {
      var nodes = findNodes(panel, effectNames[n]);
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (!node || !node.isValid) continue;
        if (isNodeUnderRoot(node, puzzleBtn) || isNodeUnderRoot(node, continueBtn) || isNodeUnderRoot(node, backBtn) || isNodeUnderRoot(node, blockNode)) continue;
        var nodeBox = null;
        try { nodeBox = node.getBoundingBoxToWorld && node.getBoundingBoxToWorld(); } catch (boxErr) {}
        var nearBoard = nodeBox ? nodeBoxIntersects(nodeBox, targetBox, 140, 140) : (isNodeUnderRoot(node, mask) || isNodeUnderRoot(node, puzzle) || isNodeUnderRoot(node, frame));
        if (!nearBoard) continue;
        suppressPuzzleEffectNode(node);
      }
    }
    cleanupPuzzleBoardAreaEffects(panel);
  }
  function cleanupPuzzleEffects(panel, includeButtonEffects) {
    if (!panel || !panel.isValid) return;
    var puzzleBtn = findNode(panel, "puzzleBtn");
    var continueBtn = findNode(panel, "continueBtn");
    var effectNames = ["touchNode", "particleClick", "particle", "Light", "light", "shine", "flash", "highlight", "halo", "effect", "eff", "glow"];
    for (var n = 0; n < effectNames.length; n++) {
      var nodes = findNodes(panel, effectNames[n]);
      for (var j = 0; j < nodes.length; j++) {
        var node = nodes[j];
        if (!node || !node.isValid) continue;
        if (isNodeUnderRoot(node, findNode(panel, "animNode"))) continue;
        if (!includeButtonEffects && (isNodeUnderRoot(node, puzzleBtn) || isNodeUnderRoot(node, continueBtn))) continue;
        try { cc.Tween && cc.Tween.stopAllByTarget && cc.Tween.stopAllByTarget(node); } catch (err) {}
        try { node.stopAllActions && node.stopAllActions(); } catch (err) {}
        try {
          var particle = cc.ParticleSystem && node.getComponent && node.getComponent(cc.ParticleSystem);
          if (particle) {
            particle.stopSystem && particle.stopSystem();
            particle.resetSystem && particle.resetSystem();
            particle.enabled = false;
          }
        } catch (err) {}
        try {
          var animation = cc.Animation && node.getComponent && node.getComponent(cc.Animation);
          if (animation) {
            animation.stop && animation.stop();
            animation.enabled = false;
          }
        } catch (err) {}
        try {
          var skeleton = sp && sp.Skeleton && node.getComponent && node.getComponent(sp.Skeleton);
          if (skeleton) {
            skeleton.clearTracks && skeleton.clearTracks();
            skeleton.enabled = false;
          }
        } catch (err) {}
        node.active = false;
        node.opacity = 0;
        node.scale = 0;
      }
    }
  }

  function cleanupPuzzleAnimNodeResidue(panel) {
    if (!panel || !panel.isValid) return;
    var animNode = findNode(panel, "animNode");
    if (!animNode || !animNode.isValid) return;
    var children = (animNode.children || []).slice();
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (!child || !child.isValid) continue;
      try { cc.Tween && cc.Tween.stopAllByTarget && cc.Tween.stopAllByTarget(child); } catch (err) {}
      try { child.stopAllActions && child.stopAllActions(); } catch (err2) {}
      try { child.destroy && child.destroy(); } catch (err3) {
        child.active = false;
        child.opacity = 0;
      }
    }
  }

  function cleanupPuzzleAnimNodeResidueSoon(panel) {
    [900, 1200, 1600, 2400].forEach(function (delay) {
      setTimeout(function () {
        try { cleanupPuzzleAnimNodeResidue(panel); } catch (err) {}
      }, delay);
    });
  }

  function cleanupPuzzleEffectsSoon(panel, includeButtonEffects) {
    cleanupPuzzleEffects(panel, includeButtonEffects);
    cleanupPuzzleFrameGlow(panel);
    [16, 40, 120, 300, 700, 1200].forEach(function (delay) {
      setTimeout(function () {
        try { cleanupPuzzleEffects(panel, includeButtonEffects); cleanupPuzzleFrameGlow(panel); } catch (err) {}
      }, delay);
    });
  }

  function disablePuzzleClickEffectTouch(panel) {
    if (!panel || !panel.isValid) return;
    var nodes = findNodes(panel, "touchNode");
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!node || !node.isValid) continue;
      try { node.off && node.off(cc.Node.EventType.TOUCH_START); } catch (err) {}
      try { node.off && node.off(cc.Node.EventType.TOUCH_MOVE); } catch (err) {}
      try { node.off && node.off(cc.Node.EventType.TOUCH_END); } catch (err) {}
      try { node.off && node.off(cc.Node.EventType.TOUCH_CANCEL); } catch (err) {}
      node.active = false;
      node.opacity = 0;
      node.scale = 0;
    }
  }

  function suppressGlobalClickEffectNode(node) {
    if (!node || !node.isValid) return;
    try { cc.Tween && cc.Tween.stopAllByTarget && cc.Tween.stopAllByTarget(node); } catch (err) {}
    try { node.stopAllActions && node.stopAllActions(); } catch (err) {}
    try {
      var particle = cc.ParticleSystem && node.getComponent && node.getComponent(cc.ParticleSystem);
      if (particle) {
        particle.stopSystem && particle.stopSystem();
        particle.enabled = false;
      }
    } catch (err) {}
    node.active = false;
    node.opacity = 0;
  }

  function cleanupGlobalPuzzleClickEffects() {
    var scene = cc.director && cc.director.getScene && cc.director.getScene();
    if (!scene || !scene.isValid) return;
    ["particle", "particleClick", "Light", "light", "glow", "shine", "flash", "highlight", "halo", "effect", "eff", "touchNode"].forEach(function (name) {
      var nodes = findNodes(scene, name);
      for (var i = 0; i < nodes.length; i++) suppressGlobalClickEffectNode(nodes[i]);
    });
  }

  function cleanupPuzzleClickEffectsSoon(panel) {
    cleanupGlobalPuzzleClickEffects();
    cleanupPuzzleEffects(panel, true);
    cleanupPuzzleFrameGlow(panel);
    [0, 16, 33, 66, 120, 240, 500, 900, 1400].forEach(function (delay) {
      setTimeout(function () {
        try {
          cleanupGlobalPuzzleClickEffects();
          cleanupPuzzleEffects(panel, true);
          cleanupPuzzleFrameGlow(panel);
        } catch (err) {}
      }, delay);
    });
  }

  function patchGlobalClickEffectForPuzzle(panel) {
    var scene = cc.director && cc.director.getScene && cc.director.getScene();
    if (!scene || !scene.isValid) return;
    var all = [];
    collectNodes(scene, all);
    for (var i = 0; i < all.length; i++) {
      var node = all[i];
      if (!node || !node.isValid || !node.getComponents) continue;
      var comps = node.getComponents(cc.Component) || [];
      for (var j = 0; j < comps.length; j++) {
        var comp = comps[j];
        if (!comp || comp._restorePuzzleClickEffectPatched || !comp.particle || !comp.particleClick) continue;
        comp._restorePuzzleClickEffectPatched = true;
        comp._restorePuzzleClickEffectOriginals = {
          start: comp.onTouchStart,
          move: comp.onTouchMove,
          end: comp.onTouchEnd,
          clicked: comp.onClicked
        };
        var suppress = function (event) {
          var activePanel = getPuzzlePanel(cc.director && cc.director.getScene && cc.director.getScene());
          if (activePanel && activePanel.isValid && activePanel.activeInHierarchy) {
            event && event.stopPropagationImmediate && event.stopPropagationImmediate();
            event && event.stopPropagation && event.stopPropagation();
            cleanupGlobalPuzzleClickEffects();
            return true;
          }
          return false;
        };
        var originalStart = comp._restorePuzzleClickEffectOriginals.start;
        var originalMove = comp._restorePuzzleClickEffectOriginals.move;
        var originalEnd = comp._restorePuzzleClickEffectOriginals.end;
        var originalClicked = comp._restorePuzzleClickEffectOriginals.clicked;
        try { node.off(cc.Node.EventType.TOUCH_START, originalStart, comp); } catch (err) {}
        try { node.off(cc.Node.EventType.TOUCH_MOVE, originalMove, comp); } catch (err) {}
        try { node.off(cc.Node.EventType.TOUCH_END, originalEnd, comp); } catch (err) {}
        try { node.off(cc.Node.EventType.TOUCH_CANCEL, originalEnd, comp); } catch (err) {}
        comp.onTouchStart = function (event) { if (suppress(event)) return; return originalStart && originalStart.call(this, event); };
        comp.onTouchMove = function (event) { if (suppress(event)) return; return originalMove && originalMove.call(this, event); };
        comp.onTouchEnd = function (event) { if (suppress(event)) return; return originalEnd && originalEnd.call(this, event); };
        comp.onClicked = function (event) { if (suppress(event)) return; return originalClicked && originalClicked.call(this, event); };
        try { node.on(cc.Node.EventType.TOUCH_START, comp.onTouchStart, comp); } catch (err) {}
        try { node.on(cc.Node.EventType.TOUCH_MOVE, comp.onTouchMove, comp); } catch (err) {}
        try { node.on(cc.Node.EventType.TOUCH_END, comp.onTouchEnd, comp); } catch (err) {}
        try { node.on(cc.Node.EventType.TOUCH_CANCEL, comp.onTouchEnd, comp); } catch (err) {}
      }
    }
    cleanupGlobalPuzzleClickEffects();
  }

  function pointInAnyPuzzleNode(nodes, point) {
    if (!nodes || !point) return false;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] && nodes[i].isValid && pointInNodeTree(nodes[i], point)) return true;
    }
    return false;
  }

  function installPuzzleBoardEffectBlocker(panel) {
    if (!panel || !panel.isValid || panel._restorePuzzleBoardEffectBlocker) return;
    var target = (cc.Canvas && cc.Canvas.instance && cc.Canvas.instance.node) || panel;
    if (!target || !target.isValid) return;
    var handler = function (event) {
      try {
        if (isAnimalDecPanelOpen(cc.director && cc.director.getScene && cc.director.getScene())) { routeAnimalDecTouch(event); return; }
        if (!panel || !panel.isValid || !panel.activeInHierarchy) return;
        var point = event && event.getLocation && event.getLocation();
        if (!point) return;
        var controls = [findNode(panel, "puzzleBtn"), findNode(panel, "backBtn"), findNode(panel, "continueBtn"), findNode(panel, "restorePuzzleBtnProxy")];
        if (pointInAnyPuzzleNode(controls, point)) return;
        var boardNodes = [findNode(panel, "puzzle"), findNode(panel, "mask"), findNode(panel, "unLockedPicture"), findNode(panel, "img_huakuang"), findNode(panel, "blockNode")];
        if (!pointInAnyPuzzleNode(boardNodes, point)) return;
        event.stopPropagationImmediate && event.stopPropagationImmediate();
        event.stopPropagation && event.stopPropagation();
        disablePuzzleClickEffectTouch(panel);
        cleanupPuzzleClickEffectsSoon(panel);
      } catch (err) {}
    };
    target.on(cc.Node.EventType.TOUCH_START, handler, panel, true);
    target.on(cc.Node.EventType.TOUCH_END, handler, panel, true);
    if (cc.Node.EventType.MOUSE_DOWN) target.on(cc.Node.EventType.MOUSE_DOWN, handler, panel, true);
    if (cc.Node.EventType.MOUSE_UP) target.on(cc.Node.EventType.MOUSE_UP, handler, panel, true);
    panel._restorePuzzleBoardEffectBlocker = true;
  }

  function getSpriteComponentFromNode(node) {
    return node && node.isValid && node.getComponent && node.getComponent(cc.Sprite);
  }

  function applyPuzzleFrameReplacement(root) {
    if (!root || !root.isValid) return;
    var frames = findNodes(root, "img_huakuang", []);
    if (!frames.length && root.name === "img_huakuang") frames.push(root);
    for (var i = 0; i < frames.length; i++) {
      var node = frames[i];
      if (!node || !node.isValid) continue;
      var sprite = getSpriteComponentFromNode(node);
      if (!sprite && node.addComponent) sprite = node.addComponent(cc.Sprite);
      if (!sprite) continue;
      sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
      applyUiReplacementSprite(sprite, "puzzleFrame", node.width || 343, node.height || 376);
    }
  }

  function fillPuzzleSpriteToNode(sprite, targetNode) {
    if (!sprite || !sprite.node || !sprite.node.isValid) return;
    var node = targetNode && targetNode.isValid ? targetNode : sprite.node;
    var panel = findAncestorWithChild(node, "puzzleBtn") || findAncestorWithChild(node, "blockNum");
    var mask = panel && findNode(panel, "mask");
    if (!node._restorePuzzleCanvasWidth && mask && mask.width) node._restorePuzzleCanvasWidth = mask.width;
    if (!node._restorePuzzleCanvasHeight && mask && mask.height) node._restorePuzzleCanvasHeight = mask.height;
    if (!node._restorePuzzleCanvasWidth && node.width) node._restorePuzzleCanvasWidth = node.width;
    if (!node._restorePuzzleCanvasHeight && node.height) node._restorePuzzleCanvasHeight = node.height;
    var w = node._restorePuzzleCanvasWidth || node.width || sprite.node.width || 520;
    var h = node._restorePuzzleCanvasHeight || node.height || sprite.node.height || 520;
    sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    sprite.node.setContentSize && sprite.node.setContentSize(w, h);
    sprite.node.width = w;
    sprite.node.height = h;
    sprite.node.setScale && sprite.node.setScale(1, 1);
    sprite._restorePuzzleFillSize = { w: w, h: h };
  }

  function alignHomePuzzleSpriteToMask(sprite, puzzleNode, maskNode) {
    if (!sprite || !puzzleNode || !puzzleNode.isValid || !maskNode || !maskNode.isValid) return;
    var w = maskNode.width || puzzleNode.width || 520;
    var h = maskNode.height || puzzleNode.height || 520;
    puzzleNode._restorePuzzleCanvasWidth = w;
    puzzleNode._restorePuzzleCanvasHeight = h;
    sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    puzzleNode.setContentSize && puzzleNode.setContentSize(w, h);
    puzzleNode.width = w;
    puzzleNode.height = h;
    puzzleNode.setScale && puzzleNode.setScale(1, 1);
    if (puzzleNode.parent && maskNode.parent && puzzleNode.setPosition) {
      if (puzzleNode.parent === maskNode.parent) {
        puzzleNode.setPosition(maskNode.x || 0, maskNode.y || 0);
      } else if (maskNode.parent.convertToWorldSpaceAR && puzzleNode.parent.convertToNodeSpaceAR) {
        var worldPos = maskNode.parent.convertToWorldSpaceAR(maskNode.position || cc.v2(maskNode.x || 0, maskNode.y || 0));
        var localPos = puzzleNode.parent.convertToNodeSpaceAR(worldPos);
        puzzleNode.setPosition(localPos);
      }
    }
    sprite._restorePuzzleFillSize = { w: w, h: h };
  }

  function findFirstSpriteNode(root, skipNames) {
    if (!root || !root.isValid) return null;
    var name = root.name || "";
    if (!skipNames || !skipNames[name]) {
      var sprite = getSpriteComponentFromNode(root);
      if (sprite) return root;
    }
    var children = root.children || [];
    for (var i = 0; i < children.length; i++) {
      var found = findFirstSpriteNode(children[i], skipNames);
      if (found) return found;
    }
    return null;
  }

  function cleanupScenePuzzleEffects(scene) {
    if (!scene || !scene.isValid) return;
    var roots = [];
    var frameNode = findNode(scene, "img_huakuang") || findNode(scene, "unLockedPicture");
    var homeNode = findNode(scene, "unLockedPicture");
    var puzzleNode = findNode(scene, "puzzle");
    if (frameNode && frameNode.isValid) roots.push(frameNode);
    if (homeNode && homeNode.isValid && roots.indexOf(homeNode) < 0) roots.push(homeNode);
    if (puzzleNode && puzzleNode.isValid && roots.indexOf(puzzleNode) < 0) roots.push(puzzleNode);
    if (!roots.length) return;
    var effectNames = ["particleClick", "particle", "Light", "light", "effect", "eff", "glow"];
    for (var n = 0; n < effectNames.length; n++) {
      for (var r = 0; r < roots.length; r++) {
        var nodes = findNodes(roots[r], effectNames[n]);
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i] && nodes[i].isValid) {
            nodes[i].active = false;
            nodes[i].opacity = 0;
          }
        }
      }
    }
  }

  function capturePuzzleBoardSnapshot(panel, puzzleIndex, progress) {
    if (!panel || !panel.isValid) return null;
    try {
      var runtime = getPuzzleRuntime(panel);
      if (!runtime || !runtime.puzzle || !runtime.puzzle.isValid || !runtime.mask || !runtime.mask.isValid) return null;
      var puzzleSprite = runtime.puzzle.getComponent && runtime.puzzle.getComponent(cc.Sprite);
      if (!puzzleSprite || !puzzleSprite.spriteFrame) return null;
      var data = getPuzzleAnimalData(puzzleIndex);
      var dataName = data && data.name || "";
      var snapshot = {
        key: puzzleIndex + ":" + progress + ":" + dataName,
        index: puzzleIndex,
        name: dataName,
        progress: progress,
        path: dataName ? "ab:game2/texture/puzzle/puzzle/" + dataName : "",
        spriteFrame: puzzleSprite.spriteFrame,
        puzzle: {
          w: runtime.puzzle.width || 520,
          h: runtime.puzzle.height || 520
        },
        mask: {
          w: runtime.mask.width || runtime.puzzle.width || 520,
          h: runtime.mask.height || runtime.puzzle.height || 520
        },
        blocks: []
      };
      var children = runtime.mask.children || [];
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (!child || !child.isValid) continue;
        var blockSprite = child.getComponent && child.getComponent(cc.Sprite);
        snapshot.blocks.push({
          x: child.x || 0,
          y: child.y || 0,
          w: child.width || 0,
          h: child.height || 0,
          sx: child.scaleX === undefined ? 1 : child.scaleX,
          sy: child.scaleY === undefined ? 1 : child.scaleY,
          angle: child.angle || child.rotation || 0,
          active: child.active,
          opacity: child.opacity,
          spriteFrame: blockSprite && blockSprite.spriteFrame
        });
      }
      var globals = getGameGlobals();
      if (globals.globalData) globals.globalData._restorePuzzleBoardSnapshot = null;
      console.log("restore home puzzle board captured", snapshot.key, snapshot.blocks.length);
      return snapshot;
    } catch (err) {
      console.error("restore home puzzle board capture failed", err && err.message ? err.message : err);
      return null;
    }
  }

  function renderHomePuzzleBoardSnapshot(frameNode, snapshot, previewKey) {
    if (!frameNode || !frameNode.isValid || !snapshot || snapshot.key !== previewKey || !snapshot.spriteFrame) return false;
    var overlay = findChild(frameNode, "restoreHomePuzzleOverlay");
    if (overlay) overlay.active = false;
    var board = findChild(frameNode, "restoreHomePuzzleBoardSnapshot");
    if (!board) {
      board = new cc.Node("restoreHomePuzzleBoardSnapshot");
      board.parent = frameNode;
      board.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
    }
    board.active = true;
    board.opacity = 255;
    board.setPosition(0, 0);
    board.setScale && board.setScale(1);
    board.setContentSize(snapshot.puzzle.w, snapshot.puzzle.h);
    board.zIndex = 2;
    board.setLocalZOrder && board.setLocalZOrder(2);
    var boardSprite = board.getComponent(cc.Sprite);
    boardSprite.spriteFrame = snapshot.spriteFrame;
    boardSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

    var coverRoot = findChild(board, "restoreHomePuzzleBoardMask");
    if (!coverRoot) {
      coverRoot = new cc.Node("restoreHomePuzzleBoardMask");
      coverRoot.parent = board;
    }
    coverRoot.active = true;
    coverRoot.setPosition(0, 0);
    coverRoot.setScale && coverRoot.setScale(1);
    coverRoot.setContentSize(snapshot.mask.w, snapshot.mask.h);
    coverRoot.zIndex = 3;
    coverRoot.setLocalZOrder && coverRoot.setLocalZOrder(3);

    var blocks = snapshot.blocks || [];
    for (var i = 0; i < blocks.length; i++) {
      var info = blocks[i];
      var block = coverRoot.children && coverRoot.children[i];
      if (!block) {
        block = new cc.Node("restoreHomePuzzleMaskBlock");
        block.parent = coverRoot;
        block.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
      }
      block.active = info.active;
      block.opacity = info.opacity;
      block.setPosition(info.x, info.y);
      block.setScale && block.setScale(info.sx, info.sy);
      block.angle = info.angle || 0;
      block.setContentSize(info.w, info.h);
      var sprite = block.getComponent(cc.Sprite);
      if (sprite) {
        sprite.spriteFrame = info.spriteFrame || null;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
      }
    }
    for (var j = blocks.length; coverRoot.children && j < coverRoot.children.length; j++) {
      if (coverRoot.children[j]) coverRoot.children[j].active = false;
    }
    console.log("restore home puzzle preview board only", previewKey, blocks.length);
    return true;
  }

  function isHomeScene(scene) {
    if (!scene || !scene.isValid) return false;
    var startBtn = findNode(scene, "startBtn");
    if (startBtn && startBtn.isValid && startBtn.activeInHierarchy) return true;
    var puzzleFrame = findNode(scene, "img_huakuang");
    var pauseBtn = findNode(scene, "pauseBtn");
    var levelLabel = findNode(scene, "lvTxt");
    return !!(puzzleFrame && puzzleFrame.isValid && puzzleFrame.activeInHierarchy && !pauseBtn && !levelLabel);
  }

  function refreshHomePuzzlePreview(scene, force) {
    if (!scene || !scene.isValid) return;
    try {
      if (!isHomeScene(scene)) return;
      applyPuzzleFrameReplacement(scene);
      var homePuzzle = findNode(scene, "unLockedPicture") || findNode(scene, "img_huakuang") || findNode(scene, "puzzle");
      if (!homePuzzle || !homePuzzle.isValid) return;
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      ensurePuzzleUserData(globalData);
      var max = getPuzzleMax();
      var savedIndex = typeof globalData._restoreCurrentPuzzleIndex === "number" ? globalData._restoreCurrentPuzzleIndex : -1;
      var puzzleIndex = savedIndex >= 0 && savedIndex < 30 && globalData.user.puzzleProgress[savedIndex] < max ? savedIndex : getPuzzleIndex(globalData, null);
      var progress = Math.max(0, Math.min(max, globalData.user.puzzleProgress[puzzleIndex] || 0));
      var data = getPuzzleAnimalData(puzzleIndex);
      var previewKey = puzzleIndex + ":" + progress + ":" + (data && data.name || "");

      cleanupScenePuzzleEffects(scene);
      if (!force && homePuzzle._restoreHomePuzzleKey === previewKey) {
        cleanupScenePuzzleEffects(scene);
        return;
      }
      homePuzzle._restoreHomePuzzleKey = previewKey;

      homePuzzle.active = true;
      var spriteNode = findNode(homePuzzle, "unLockedPictureSprite") || findNode(homePuzzle, "picture");
      var maskNode = findNode(homePuzzle, "unLockedPictureMask");
      var labelNode = findNode(homePuzzle, "unLockedPictureStr") || findNode(homePuzzle, "progressLabel") || findNode(homePuzzle, "label");
      var sprite = getSpriteComponentFromNode(spriteNode);
      var maskSprite = getSpriteComponentFromNode(maskNode);
      var label = labelNode && labelNode.getComponent && labelNode.getComponent(cc.Label);
      var fillRange = max > 0 ? progress / max : 0;
      var frameNode = findNode(scene, "img_huakuang") || findNode(scene, "puzzle");
      globalData._restorePuzzleBoardSnapshot = null;
      if (frameNode && frameNode.isValid) {
        var staleSnapshotBoard = findChild(frameNode, "restoreHomePuzzleBoardSnapshot");
        if (staleSnapshotBoard && staleSnapshotBoard.isValid && staleSnapshotBoard.destroy) staleSnapshotBoard.destroy();
      }
      var nativePuzzleNode = findNode(scene, "puzzle");
      var nativePuzzleSprite = getSpriteComponentFromNode(nativePuzzleNode);
      var nativeMask = findNode(scene, "mask");
      if (nativePuzzleSprite && nativeMask && nativeMask.children && nativeMask.children.length >= Math.min(max, 20)) {
        var nativeBoard = frameNode && findChild(frameNode, "restoreHomePuzzleBoardSnapshot");
        var nativeOverlay = frameNode && findChild(frameNode, "restoreHomePuzzleOverlay");
        if (nativeBoard) nativeBoard.active = false;
        if (nativeOverlay) nativeOverlay.active = false;
        if (sprite && sprite.node && sprite.node !== nativePuzzleNode) sprite.node.active = false;
        nativePuzzleNode.active = true;
        nativePuzzleNode.opacity = 255;
        nativeMask.active = true;
        alignHomePuzzleSpriteToMask(nativePuzzleSprite, nativePuzzleNode, nativeMask);
        if (data && data.name) loadIllustrateSprite(nativePuzzleSprite, "ab:game2/texture/puzzle/puzzle/" + data.name);
        for (var mi = 0; mi < nativeMask.children.length; mi++) {
          var maskChild = nativeMask.children[mi];
          if (maskChild && maskChild.isValid) {
            maskChild.active = true;
            maskChild.opacity = mi < progress ? 0 : 255;
          }
        }
        if (label) label.string = "\u8fdb\u5ea6" + (100 * fillRange).toFixed(1) + "%";
        console.log("restore home puzzle native opacity mask", puzzleIndex, progress, nativeMask.children.length);
        return;
      }

      if (sprite && data && data.name) {
        loadIllustrateSprite(sprite, "ab:game2/texture/puzzle/puzzle/" + data.name);
        if (sprite.node) sprite.node.active = false;
      }
      if (maskSprite && data && data.name) loadIllustrateSprite(maskSprite, "ab:game2/texture/puzzle/puzzle/" + data.name);
      if (frameNode && frameNode.isValid) {
        var board = findChild(frameNode, "restoreHomePuzzleBoardSnapshot");
        if (board) board.active = false;
        var overlay = findChild(frameNode, "restoreHomePuzzleOverlay");
        if (!overlay) {
          overlay = new cc.Node("restoreHomePuzzleOverlay");
          overlay.parent = frameNode;
          overlay.setPosition(0, 0);
          overlay.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
        }
        var squareSize = Math.min(frameNode.width || 720, frameNode.height || 720) * 0.86;
        overlay.setPosition(0, 0);
        overlay.setContentSize(squareSize, squareSize);
        overlay.active = progress > 0;
        overlay.opacity = 255;
        overlay.zIndex = 2;
        overlay.setLocalZOrder && overlay.setLocalZOrder(2);
        var overlaySprite = overlay.getComponent(cc.Sprite);
        if (overlaySprite && data && data.name) {
          loadIllustrateSprite(overlaySprite, "ab:game2/texture/puzzle/puzzle/" + data.name);
          overlaySprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
          if (cc.Sprite && cc.Sprite.Type && cc.Sprite.Type.FILLED !== undefined) overlaySprite.type = cc.Sprite.Type.FILLED;
          if (cc.Sprite && cc.Sprite.FillType && cc.Sprite.FillType.VERTICAL !== undefined) overlaySprite.fillType = cc.Sprite.FillType.VERTICAL;
          overlaySprite.fillStart = 1;
          overlaySprite.fillRange = -fillRange;
        }
      }
      var mask = findNode(homePuzzle, "mask") || findNode(frameNode, "mask") || findNode(homePuzzle, "unLockedPictureMask");
      if (mask && mask.children && mask.children.length > 1) {
        for (var i = 0; i < mask.children.length; i++) {
          if (mask.children[i] && mask.children[i].isValid) {
            mask.children[i].active = true;
            mask.children[i].opacity = i < progress ? 0 : 255;
          }
        }
      }
      if (label) label.string = "\u8fdb\u5ea6" + (100 * fillRange).toFixed(1) + "%";
      console.log("restore home puzzle preview", puzzleIndex, progress);
    } catch (err) {
      console.error("restore home puzzle preview failed", err && err.message ? err.message : err);
    }
  }

  function hideHomePuzzlePreviewOutsideHome(scene) {
    if (!scene || !scene.isValid) return;
    if (isHomeScene(scene)) return;
    var nodes = findNodes(scene, "unLockedPicture");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] && nodes[i].isValid) nodes[i].active = false;
    }
  }

  function hideNodeAndParents(node) {
    if (!node || !node.isValid) return;
    var target = node;
    for (var i = 0; i < 3 && target.parent && target.parent.isValid; i++) {
      if ((target.width || 0) > 80 || (target.height || 0) > 80 || target.name.indexOf("Btn") >= 0 || target.name.indexOf("btn") >= 0) break;
      target = target.parent;
    }
    target.active = false;
  }

  function hideGameClubNodeOnly(node) {
    if (!node || !node.isValid) return;
    if (node._restoreHomeColorModeSource || node.name === "restoreHomeColorModeBtn") return;
    hideNodeOwnSprite(node);
    node.active = false;
    node.opacity = 0;
    if (node.pauseSystemEvents) node.pauseSystemEvents(true);
  }

  function hideLabelsWithText(root, text) {
    if (!root || !root.isValid) return;
    var label = root.getComponent && root.getComponent(cc.Label);
    if (label && label.string && label.string.indexOf(text) >= 0) hideNodeAndParents(root);
    var children = root.children || [];
    for (var i = 0; i < children.length; i++) hideLabelsWithText(children[i], text);
  }

  function suppressExistingGameClubButtons(platform) {
    if (!platform) return;
    try {
      var suppress = typeof GameGlobal !== "undefined" && GameGlobal._restoreSuppressGameClubButton;
      var clubs = platform.gameClubs || platform._gameClubs || platform.gameClubButtons;
      if (clubs && clubs.length) {
        for (var i = 0; i < clubs.length; i++) {
          if (suppress) suppress(clubs[i]);
          else if (clubs[i] && clubs[i].hide) clubs[i].hide();
        }
      }
    } catch (err) {}
  }

  function installHideGameCirclePatch() {
    if (!GameGlobal.cc || !cc.director || !cc.director.getScene()) return;
    var scene = cc.director.getScene();
    if (!scene || !scene.isValid) return;
    try {
      var globals = getGameGlobals();
      var platform = globals.globalData && globals.globalData.platform;
      if (platform && !platform._restoreGameClubSuppressed) {
        platform._restoreOriginalShowGameClub = platform.showGameClub;
        platform.showGameClub = function () {
          if (platform.hideGameClub) platform.hideGameClub();
          suppressExistingGameClubButtons(platform);
        };
        platform._restoreGameClubSuppressed = true;
      }
      platform && platform.hideGameClub && platform.hideGameClub();
      suppressExistingGameClubButtons(platform);
    } catch (err0) {}
    var names = [
      "gameCircle", "gameCircleBtn", "gameClub", "gameClubBtn", "gameClubButton",
      "clubBtn", "circleBtn", "gameQuan", "gameq", "gameQun", "gameClubNode"
    ];
    for (var i = 0; i < names.length; i++) {
      var nodes = findNodes(scene, names[i]);
      for (var j = 0; j < nodes.length; j++) {
        hideGameClubNodeOnly(nodes[j]);
      }
    }
    hideLabelsWithText(scene, "\u6e38\u620f\u5708");
    hideLabelsWithText(scene, "\u670b\u53cb\u5708");
    try {
      var globals = getGameGlobals();
      globals.globalData.platform && globals.globalData.platform.hideGameClub && globals.globalData.platform.hideGameClub();
      suppressExistingGameClubButtons(globals.globalData.platform);
    } catch (err) {}
  }

  function openPuzzleAnimalDec(globalData, uiId, puzzleIndex) {
    var data = getPuzzleAnimalData(puzzleIndex);
    if (!data) return;
    globalData._restorePuzzleAnimalData = data;
    globalData._restoreAnimalDecData = data;
    globalData.animalName = data.name;
    globalData.animalDec = data.dec || data.name;
    try {
      patchAnimalDecPanel(cc.director && cc.director.getScene && cc.director.getScene(), data);
    } catch (err) {}
    try {
      globalData.gui.remove(uiId.AnimalDecPanel);
    } catch (err) {}
    globalData.gui.open(uiId.AnimalDecPanel);
    try {
      patchAnimalDecPanel(cc.director && cc.director.getScene && cc.director.getScene(), data);
    } catch (err2) {}
    setTimeout(function () {
      try {
        patchAnimalDecPanel(cc.director && cc.director.getScene && cc.director.getScene(), data);
        installAnimalDecButtonPatch(cc.director && cc.director.getScene && cc.director.getScene());
      } catch (err3) {}
    }, 0);
    setTimeout(function () {
      try {
        patchAnimalDecPanel(cc.director && cc.director.getScene && cc.director.getScene(), data);
        installAnimalDecButtonPatch(cc.director && cc.director.getScene && cc.director.getScene());
      } catch (err) {}
    }, 80);
    setTimeout(function () {
      try {
        patchAnimalDecPanel(cc.director && cc.director.getScene && cc.director.getScene(), data);
        installAnimalDecButtonPatch(cc.director && cc.director.getScene && cc.director.getScene());
      } catch (err4) {}
    }, 240);
  }

  function refreshPuzzlePanelToCurrent(panel, force) {
    if (!panel || !panel.isValid || !panel.activeInHierarchy) return;
    try {
      applyPuzzleFrameReplacement(panel);
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      ensurePuzzleUserData(globalData);
      var runtime = getPuzzleRuntime(panel);
      var comp = runtime && runtime.comp;
      var max = getPuzzleMax();
      var puzzleIndex = getPuzzleIndex(globalData, null);
      var progress = Math.max(0, Math.min(max, globalData.user.puzzleProgress[puzzleIndex] || 0));
      var data = getPuzzleAnimalData(puzzleIndex);
      var visualKey = puzzleIndex + ":" + progress + ":" + (data && data.name || "") + ":" + globalData.user.blockNum;
      globalData._restoreCurrentPuzzleIndex = puzzleIndex;

      if (!force && panel._restorePuzzleVisualKey === visualKey) {
        if (comp) {
          comp.puzzleIndex = puzzleIndex;
          comp.unLockProgress = progress;
        }
        applyPuzzleMaskProgress(panel, progress);
        capturePuzzleBoardSnapshot(panel, puzzleIndex, progress);
        cleanupPuzzleFrameGlow(panel);
        return;
      }
      panel._restorePuzzleVisualKey = visualKey;

      if (comp) {
        comp.puzzleIndex = puzzleIndex;
        comp.unLockProgress = progress;
        comp.lockBtn = false;
        comp.isLockFinish = puzzleIndex === 29 && progress >= max;
      }

      if (comp && typeof comp.updatePuzzleMask === "function") {
        try { comp.updatePuzzleMask.call(comp); } catch (maskErr) {}
      }
      applyPuzzleMaskProgress(panel, progress);

      if (runtime && runtime.puzzle) {
        var puzzleSprite = runtime.puzzle.getComponent && runtime.puzzle.getComponent(cc.Sprite);
        if (puzzleSprite && data && data.name) {
          fillPuzzleSpriteToNode(puzzleSprite, runtime.puzzle);
          loadIllustrateSprite(puzzleSprite, "ab:game2/texture/puzzle/puzzle/" + data.name);
          fillPuzzleSpriteToNode(puzzleSprite, runtime.puzzle);
        }
      }
      capturePuzzleBoardSnapshot(panel, puzzleIndex, progress);
      cleanupPuzzleFrameGlow(panel);
      setTimeout(function () {
        try { capturePuzzleBoardSnapshot(panel, puzzleIndex, progress); cleanupPuzzleFrameGlow(panel); } catch (err) {}
      }, 80);
      console.log("restore puzzle switched", puzzleIndex, progress);
    } catch (err) {
      console.error("restore puzzle switch failed", err && err.message ? err.message : err);
    }
  }

  function getAnimalIconReplacementBase64(name) {
    try {
      if (typeof GameGlobal === "undefined" || !name) return null;
      var repl = GameGlobal._restoreIllustratedReplacementData;
      if (repl && repl.getIconBase64) return repl.getIconBase64(name);
    } catch (err) {}
    return null;
  }

  function loadPuzzleAnimalIconSprite(sprite, name) {
    if (!sprite || !sprite.node || !sprite.node.isValid || !name) return;
    var node = sprite.node;
    var boxW = Math.max(node.width || 0, 300);
    var boxH = Math.max(node.height || 0, 300);
    if (node.parent && node.parent.width) boxW = Math.min(boxW, Math.max(220, node.parent.width * 0.72));
    if (node.parent && node.parent.height) boxH = Math.min(boxH, Math.max(220, node.parent.height * 0.48));
    var path = "ab:game/texture/illustrated/animalIcon/" + name;
    sprite._restoreIllustratePath = path;
    var iconBase64 = getAnimalIconReplacementBase64(name);
    var fallbackPath = "ab:game2/texture/puzzle/puzzle/" + name;
    var applyBase64 = function (base64) {
      if (!base64) return loadIllustrateSprite(sprite, fallbackPath);
      loadRemoteTextureAsSpriteFrame([base64], 0, function (frame) {
        if (!frame) return loadIllustrateSprite(sprite, fallbackPath);
        if (sprite._restoreIllustratePath && sprite._restoreIllustratePath !== path) return;
        fitSpriteFrameIntoBox(sprite, frame, boxW, boxH, false);
        node.opacity = typeof node._restoreIllustrateOpacity === "number" ? node._restoreIllustrateOpacity : 255;
      });
    };
    if (iconBase64) return applyBase64(iconBase64);
    getPuzzleRawReplacementBase64(name, applyBase64);
  }

  function patchAnimalDecPanel(scene, data) {
    if (!scene || !data) return;
    var panel = getAnimalDecPanel(scene);
    if (!panel || !panel.activeInHierarchy) return;
    var nameNode = findNode(panel, "animalName");
    var decNode = findNode(panel, "animalDec");
    var iconNode = findNode(panel, "animalIcon");
    var nameLabel = nameNode && nameNode.getComponent(cc.Label);
    var decLabel = decNode && decNode.getComponent(cc.Label);
    var iconSprite = iconNode && iconNode.getComponent(cc.Sprite);
    if (nameLabel) nameLabel.string = data.name;
    if (decLabel) decLabel.string = data.dec || data.name;
    if (iconSprite && panel._restoreAnimalDecIconName !== data.name) {
      panel._restoreAnimalDecIconName = data.name;
      loadPuzzleAnimalIconSprite(iconSprite, data.name);
    }
  }

  function getAnimalDecPanel(scene) {
    return findActivePanelWithChildren(scene, ["animalName", "animalDec", "animalIcon"]) ||
      findActivePanelWithChildren(scene, ["closeBtn", "shareBtn", "animalIcon"]);
  }

  function isAnimalDecPanelOpen(scene) {
    var panel = getAnimalDecPanel(scene);
    return !!(panel && panel.isValid && panel.activeInHierarchy);
  }

  function closeAnimalDecPanel() {
    try {
      var globals = getGameGlobals();
      globals.globalData.platform && globals.globalData.platform.playEffect && globals.globalData.platform.playEffect("ab:audio/click");
      globals.globalData.gui.remove(globals.uiId.AnimalDecPanel);
      try {
        var eventModule = requireGameModule("EventDispatcher");
        var ed = eventModule.ED || (eventModule.default && eventModule.default.ED);
        var clientEvent = eventModule.ClientEvent || (eventModule.default && eventModule.default.ClientEvent);
        if (globals.globalData.isPuzzle && ed && clientEvent && clientEvent.UPDATE_PUZZLE_MASK) ed.send(clientEvent.UPDATE_PUZZLE_MASK);
      } catch (err) {}
      setTimeout(function () {
        try {
          refreshPuzzlePanelToCurrent(getPuzzlePanel(cc.director && cc.director.getScene && cc.director.getScene()), true);
        } catch (err) {}
      }, 60);
      console.log("restore animal dec close");
    } catch (err) {
      console.error("restore animal dec close failed", err && err.message ? err.message : err);
    }
  }

  function shareAnimalDecPanel() {
    try {
      var globals = getGameGlobals();
      globals.globalData.platform && globals.globalData.platform.playEffect && globals.globalData.platform.playEffect("ab:audio/click");
      if (!cc.sys || !cc.sys.isBrowser) {
        globals.globalData.platform && globals.globalData.platform.share && globals.globalData.platform.share(null);
      }
      console.log("restore animal dec share");
    } catch (err) {
      console.error("restore animal dec share failed", err && err.message ? err.message : err);
    }
  }

  function addAnimalDecButtonTouch(target, name, handler) {
    if (!target || !target.isValid || target["_restoreAnimalDec_" + name]) return;
    target.on(cc.Node.EventType.TOUCH_END, function (event) {
      event.stopPropagation && event.stopPropagation();
      runPauseAction("animalDec_" + name, handler);
    });
    if (cc.Node.EventType.MOUSE_UP) {
      target.on(cc.Node.EventType.MOUSE_UP, function (event) {
        event.stopPropagation && event.stopPropagation();
        runPauseAction("animalDec_" + name, handler);
      });
    }
    var children = target.children || [];
    for (var i = 0; i < children.length; i++) addAnimalDecButtonTouch(children[i], name, handler);
    target["_restoreAnimalDec_" + name] = true;
  }

  function getAnimalDecCloseButton(panel) {
    return findNode(panel, "closeBtn") || findNode(panel, "btnClose") || findNode(panel, "backBtn");
  }

  function getAnimalDecShareButton(panel) {
    return findNode(panel, "shareBtn");
  }

  function pointInAnimalDecCloseArea(panel, closeBtn, point) {
    if (!panel || !panel.isValid || !panel.activeInHierarchy || !point) return false;
    if (closeBtn && closeBtn.isValid && (pointInNodeTree(closeBtn, point) || pointInNodeBox(closeBtn, point, 90, 70))) return true;
    if (!panel.getBoundingBoxToWorld) return false;
    var box = panel.getBoundingBoxToWorld();
    if (!box || !box.width || !box.height) return false;
    var relX = point.x - box.x;
    var relY = point.y - box.y;
    return relX >= box.width * 0.08 && relX <= box.width * 0.50 &&
      relY >= box.height * 0.06 && relY <= box.height * 0.24;
  }

  function pointInAnimalDecShareArea(panel, shareBtn, point) {
    if (!panel || !panel.isValid || !panel.activeInHierarchy || !point) return false;
    if (shareBtn && shareBtn.isValid && (pointInNodeTree(shareBtn, point) || pointInNodeBox(shareBtn, point, 90, 70))) return true;
    if (!panel.getBoundingBoxToWorld) return false;
    var box = panel.getBoundingBoxToWorld();
    if (!box || !box.width || !box.height) return false;
    var relX = point.x - box.x;
    var relY = point.y - box.y;
    return relX >= box.width * 0.50 && relX <= box.width * 0.92 &&
      relY >= box.height * 0.06 && relY <= box.height * 0.24;
  }

  function consumeAnimalDecTouch(event) {
    event && event.stopPropagationImmediate && event.stopPropagationImmediate();
    event && event.stopPropagation && event.stopPropagation();
  }

  function routeAnimalDecTouch(event) {
    handleAnimalDecSystemButton(event);
    consumeAnimalDecTouch(event);
  }

  function handleAnimalDecSystemButton(event, fallbackPanel) {
    var livePanel = getAnimalDecPanel(cc.director && cc.director.getScene && cc.director.getScene()) || fallbackPanel;
    if (!livePanel || !livePanel.isValid || !livePanel.activeInHierarchy) return;
    var point = event && event.getLocation && event.getLocation();
    if (!point) return;
    var liveCloseBtn = getAnimalDecCloseButton(livePanel);
    var liveShareBtn = getAnimalDecShareButton(livePanel);
    if (pointInAnimalDecCloseArea(livePanel, liveCloseBtn, point)) {
      consumeAnimalDecTouch(event);
      runPauseAction("animalDec_close", closeAnimalDecPanel);
    } else if (pointInAnimalDecShareArea(livePanel, liveShareBtn, point)) {
      consumeAnimalDecTouch(event);
      runPauseAction("animalDec_share", shareAnimalDecPanel);
    }
  }

  function installAnimalDecTouchBlocker(panel) {
    if (!panel || !panel.isValid || !cc.Node) return;
    if (panel._restoreAnimalDecTouchBlocker && panel._restoreAnimalDecTouchBlocker.isValid) {
      var oldBlocker = panel._restoreAnimalDecTouchBlocker;
      oldBlocker.width = panel.width || oldBlocker.width || 1080;
      oldBlocker.height = panel.height || oldBlocker.height || 1920;
      oldBlocker.setContentSize && oldBlocker.setContentSize(oldBlocker.width, oldBlocker.height);
      oldBlocker.zIndex = 9999;
      return;
    }
    var blocker = new cc.Node("restoreAnimalDecTouchBlocker");
    blocker.opacity = 0;
    blocker.width = panel.width || 1080;
    blocker.height = panel.height || 1920;
    blocker.setContentSize && blocker.setContentSize(blocker.width, blocker.height);
    blocker.setPosition && blocker.setPosition(0, 0);
    try { blocker.addComponent && cc.Button && blocker.addComponent(cc.Button); } catch (errBtn) {}
    try { blocker.addComponent && cc.BlockInputEvents && blocker.addComponent(cc.BlockInputEvents); } catch (errBlock) {}
    blocker.zIndex = 9999;
    if (blocker._sgNode && blocker._sgNode.setLocalZOrder) blocker._sgNode.setLocalZOrder(9999);
    panel.addChild(blocker);
    var blockOnly = function (event) {
      consumeAnimalDecTouch(event);
    };
    var endHandler = function (event) {
      handleAnimalDecSystemButton(event, panel);
      consumeAnimalDecTouch(event);
    };
    blocker.on(cc.Node.EventType.TOUCH_START, blockOnly, panel, true);
    blocker.on(cc.Node.EventType.TOUCH_MOVE, blockOnly, panel, true);
    blocker.on(cc.Node.EventType.TOUCH_END, endHandler, panel, true);
    blocker.on(cc.Node.EventType.TOUCH_CANCEL, blockOnly, panel, true);
    if (cc.Node.EventType.MOUSE_DOWN) blocker.on(cc.Node.EventType.MOUSE_DOWN, blockOnly, panel, true);
    if (cc.Node.EventType.MOUSE_UP) blocker.on(cc.Node.EventType.MOUSE_UP, endHandler, panel, true);
    panel._restoreAnimalDecTouchBlocker = blocker;
  }

  function installAnimalDecButtonPatch(scene) {
    var panel = getAnimalDecPanel(scene);
    if (!panel || !panel.activeInHierarchy) return;
    installAnimalDecTouchBlocker(panel);
    var closeBtn = getAnimalDecCloseButton(panel);
    var shareBtn = getAnimalDecShareButton(panel);
    if (closeBtn) addAnimalDecButtonTouch(closeBtn, "close", closeAnimalDecPanel);
    if (shareBtn) addAnimalDecButtonTouch(shareBtn, "share", shareAnimalDecPanel);

    if (!panel._restoreAnimalDecSystemTouch && cc.systemEvent && cc.SystemEvent && cc.SystemEvent.EventType) {
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, handleAnimalDecSystemButton, panel, true);
      if (cc.SystemEvent.EventType.MOUSE_UP) {
        cc.systemEvent.on(cc.SystemEvent.EventType.MOUSE_UP, handleAnimalDecSystemButton, panel, true);
      }
      panel._restoreAnimalDecSystemTouch = true;
      console.log("restore animal dec button patch installed");
    }
  }

  function runOriginalPuzzleUnlock(panel, comp, puzzleIndex, progress, max) {
    if (!comp || typeof comp.unLockPuzzle !== "function") return progress;
    var globals = getGameGlobals();
    var user = globals.globalData && globals.globalData.user;
    try {
      comp.puzzleIndex = puzzleIndex;
      comp.unLockProgress = progress;
      comp.lockBtn = false;
      comp.isLockFinish = puzzleIndex === 29 && progress >= max;
      if (user && typeof user.blockNum === "number" && user.blockNum <= 0) return progress;
      comp.unLockPuzzle.call(comp);
      var nextProgress = typeof comp.unLockProgress === "number" ? comp.unLockProgress : progress;
      if (user && user.puzzleProgress && typeof user.puzzleProgress[puzzleIndex] === "number") {
        nextProgress = Math.max(nextProgress, user.puzzleProgress[puzzleIndex]);
      }
      return Math.max(progress, Math.min(max, nextProgress));
    } catch (err) {
      console.error("restore original puzzle unlock failed", err && err.message ? err.message : err);
    }
    return progress;
  }

  function syncAfterOriginalPuzzleUnlock(panel, comp) {
    try {
      if (!panel || !panel.isValid || !comp) return;
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      ensurePuzzleUserData(globalData);
      var max = getPuzzleMax();
      var puzzleIndex = getPuzzleIndex(globalData, comp);
      var progress = typeof comp.unLockProgress === "number" ? comp.unLockProgress : 0;
      progress = Math.max(progress, globalData.user.puzzleProgress[puzzleIndex] || 0);
      progress = Math.max(0, Math.min(max, progress));
      globalData._restoreCurrentPuzzleIndex = puzzleIndex;
      globalData.user.puzzleProgress[puzzleIndex] = progress;
      if (progress >= max) {
        if (typeof globalData.user.illustrateLock !== "number") globalData.user.illustrateLock = 0;
        globalData.user.illustrateLock = Math.max(globalData.user.illustrateLock, puzzleIndex + 1);
      }
      comp.puzzleIndex = puzzleIndex;
      comp.unLockProgress = progress;
      comp.lockBtn = false;
      comp.isLockFinish = puzzleIndex === 29 && progress >= max;
      persistPuzzleUserData(globalData.user);
      updatePuzzlePanelState(panel, globalData.user);
      applyPuzzleMaskProgress(panel, progress);
      capturePuzzleBoardSnapshot(panel, puzzleIndex, progress);
      panel._restorePuzzleVisualKey = null;
    } catch (err) {
      console.error("restore puzzle original sync failed", err && err.message ? err.message : err);
    }
  }

  function patchOriginalPuzzleUnlockMethod(panel) {
    var comp = getPuzzlePanelComponent(panel);
    if (!comp || typeof comp.unLockPuzzle !== "function" || comp._restoreOriginalPuzzleUnlockPatched) return;
    var originalUnlock = comp.unLockPuzzle;
    comp.unLockPuzzle = function () {
      var result = originalUnlock.apply(this, arguments);
      syncAfterOriginalPuzzleUnlock(panel, this);
      return result;
    };
    comp._restoreOriginalPuzzleUnlockPatched = true;
  }

  function isBasePuzzleSpriteNode(node) {
    if (!node || !node.isValid) return false;
    if (isNodeUnderRoot(node, findAncestorByName(node, "mask"))) return false;
    if (isNodeUnderRoot(node, findAncestorByName(node, "animNode"))) return false;
    if (isNodeUnderRoot(node, findAncestorByName(node, "blockNode"))) return false;
    var name = node.name || "";
    return name === "puzzle" || name === "unLockedPictureSprite" || name === "picture";
  }

  function patchOriginalPuzzleLoadSprite(panel) {
    var comp = getPuzzlePanelComponent(panel);
    if (!comp || typeof comp.loadSprite !== "function" || comp._restorePuzzleLoadSpritePatched) return;
    var originalLoadSprite = comp.loadSprite;
    comp.loadSprite = function (sprite, path) {
      var self = this;
      var originalResult = originalLoadSprite.apply(this, arguments);
      try {
        if (path && path.indexOf("puzzle/") === 0 && sprite && sprite.node && sprite.node.isValid && isBasePuzzleSpriteNode(sprite.node)) {
          var globals = getGameGlobals();
          ensurePuzzleUserData(globals.globalData);
          var puzzleIndex = typeof self.puzzleIndex === "number" ? self.puzzleIndex : getPuzzleIndex(globals.globalData, self);
          var data = getPuzzleAnimalData(puzzleIndex);
          if (data && data.name) {
            var applyReplacement = function () {
              try {
                if (!sprite || !sprite.node || !sprite.node.isValid) return;
                fillPuzzleSpriteToNode(sprite, sprite.node);
                loadIllustrateSprite(sprite, "ab:game2/texture/puzzle/puzzle/" + data.name);
                fillPuzzleSpriteToNode(sprite, sprite.node);
              } catch (replaceErr) {}
            };
            if (originalResult && typeof originalResult.then === "function") originalResult.then(applyReplacement, applyReplacement);
            else applyReplacement();
          }
        }
      } catch (err) {}
      return originalResult;
    };
    comp._restorePuzzleLoadSpritePatched = true;
  }

  function manualPuzzleUnlock(panel, reason) {
    var globals = getGameGlobals();
    var globalData = globals.globalData;
    var user = globalData.user;
    ensurePuzzleUserData(globalData);
    if (user.blockNum <= 0) {
      refreshPuzzlePanelBlockLabel(cc.director.getScene());
      return false;
    }

    var runtime = getPuzzleRuntime(panel);
    var comp = runtime && runtime.comp;
    var max = getPuzzleMax();
    var puzzleIndex = getPuzzleIndex(globalData, comp);
    globalData._restoreCurrentPuzzleIndex = puzzleIndex;
    var progress = Math.max(0, Math.min(max, user.puzzleProgress[puzzleIndex] || 0));
    if (progress >= max) {
      refreshPuzzlePanelBlockLabel(cc.director.getScene());
      return false;
    }

    var beforeBlockNum = user.blockNum;
    var originalProgress = runOriginalPuzzleUnlock(panel, comp, puzzleIndex, progress, max);
    if (originalProgress > progress) {
      progress = Math.min(max, originalProgress);
      user.puzzleProgress[puzzleIndex] = progress;
      if (user.blockNum === beforeBlockNum) user.blockNum = Math.max(0, user.blockNum - 1);
    } else {
      playPuzzleFeedback(globalData);
      revealPuzzleMask(panel, progress);
      progress++;
      user.puzzleProgress[puzzleIndex] = progress;
      user.blockNum = Math.max(0, user.blockNum - 1);
    }
    persistPuzzleUserData(user);
    panel._restorePuzzleVisualKey = null;

    updatePuzzlePanelState(panel, user);
    applyPuzzleMaskProgress(panel, progress);
    capturePuzzleBoardSnapshot(panel, puzzleIndex, progress);
    if (comp) {
      comp.puzzleIndex = puzzleIndex;
      comp.unLockProgress = progress;
      comp.lockBtn = false;
      if (comp.blockNum && comp.blockNum.string !== undefined) comp.blockNum.string = "\u788e\u7247\u6570\u91cf\uff1a" + user.blockNum;
    }

    if (progress >= max) {
      if (typeof user.illustrateLock !== "number") user.illustrateLock = 0;
      user.illustrateLock = Math.max(user.illustrateLock, puzzleIndex + 1);
      persistPuzzleUserData(user);
      cleanupPuzzleEffectsSoon(panel, true);
      stopPuzzleHold(panel);
      if (!puzzleCompletionOpening) {
        puzzleCompletionOpening = true;
        setTimeout(function () {
          try {
            openPuzzleAnimalDec(globalData, globals.uiId, puzzleIndex);
          } catch (err) {}
          setTimeout(function () { puzzleCompletionOpening = false; }, 800);
        }, 180);
      }
    }

    var logNow = Date.now();
    if (logNow - puzzleLogLastTime > 1000) {
      puzzleLogLastTime = logNow;
      console.log("restore puzzle manual unlock", reason || "", "index", puzzleIndex, "progress", progress, "left", user.blockNum);
    }
    cleanupPuzzleEffectsSoon(panel, true);
    cleanupPuzzleAnimNodeResidueSoon(panel);
    if (user.blockNum <= 0) stopPuzzleHold(panel);
    return true;
  }

  function runPuzzleUnlock(panel, reason, force) {
    if (activePuzzlePanel && panel && panel !== activePuzzlePanel) return false;
    var now = Date.now();
    if (!force && now - puzzleUnlockLastTime < 45) return true;
    puzzleUnlockLastTime = now;

    try {
      return manualPuzzleUnlock(panel, reason || "direct");
    } catch (err) {
      console.error("restore puzzle unlock failed", err && err.message ? err.message : err);
    }
    return false;
  }

  function stopPuzzleHold(panel) {
    if (activePuzzlePanel && panel && panel !== activePuzzlePanel) return;
    var wasShortTap = puzzleHoldActive && !puzzleHoldRepeated;
    puzzleHoldActive = false;
    puzzlePressStartTime = 0;
    if (puzzleCancelStopTimer) {
      clearTimeout(puzzleCancelStopTimer);
      puzzleCancelStopTimer = null;
    }
    if (puzzleForceStopTimer) {
      clearTimeout(puzzleForceStopTimer);
      puzzleForceStopTimer = null;
    }
    if (puzzleHoldTimer) {
      clearTimeout(puzzleHoldTimer);
      puzzleHoldTimer = null;
    }
    if (puzzleHoldInterval) {
      clearInterval(puzzleHoldInterval);
      puzzleHoldInterval = null;
    }
    if (!panel || panel === activePuzzlePanel) activePuzzlePanel = null;
    if (wasShortTap) runPuzzleUnlock(panel, "tap", true);
  }

  function startPuzzleHold(panel) {
    if (!panel || !panel.isValid || !panel.activeInHierarchy) return;
    if (activePuzzlePanel && activePuzzlePanel !== panel) stopPuzzleHold(activePuzzlePanel);
    if (puzzleCancelStopTimer) {
      clearTimeout(puzzleCancelStopTimer);
      puzzleCancelStopTimer = null;
    }
    if (puzzleHoldActive) return;
    activePuzzlePanel = panel;
    puzzleHoldActive = true;
    puzzleHoldRepeated = false;
    puzzlePressStartTime = Date.now();
    puzzleHoldTimer = setTimeout(function () {
      if (!puzzleHoldActive || !panel || !panel.isValid || !panel.activeInHierarchy) return;
      puzzleHoldRepeated = true;
      if (!runPuzzleUnlock(panel, "hold", true)) {
        stopPuzzleHold(panel);
        return;
      }
      puzzleHoldInterval = setInterval(function () {
        if (!puzzleHoldActive || !panel || !panel.isValid || !panel.activeInHierarchy || !runPuzzleUnlock(panel, "hold")) {
          stopPuzzleHold(panel);
        }
      }, 80);
    }, 220);
    puzzleForceStopTimer = setTimeout(function () {
      stopPuzzleHold(panel);
    }, 8000);
  }

  function schedulePuzzleCancelStop(panel) {
    if (activePuzzlePanel && panel && panel !== activePuzzlePanel) return;
    if (!puzzleHoldActive) return;
    if (puzzleCancelStopTimer) clearTimeout(puzzleCancelStopTimer);
    puzzleCancelStopTimer = setTimeout(function () {
      puzzleCancelStopTimer = null;
      stopPuzzleHold(panel);
    }, 260);
  }

  function handlePuzzleTouchCancel(panel) {
    puzzleTouchLastTime = Date.now();
    if (!puzzleHoldActive) return;
    if (activePuzzlePanel && panel && panel !== activePuzzlePanel) return;
    if (!puzzlePressStartTime || Date.now() - puzzlePressStartTime <= 180) {
      schedulePuzzleCancelStop(panel);
      return;
    }
    if (puzzleHoldRepeated) {
      if (puzzleCancelStopTimer) {
        clearTimeout(puzzleCancelStopTimer);
        puzzleCancelStopTimer = null;
      }
      return;
    }
    schedulePuzzleCancelStop(panel);
  }

  function recoverPuzzleHoldState() {
    if (!puzzleHoldActive && !activePuzzlePanel) return;
    if (!activePuzzlePanel || !activePuzzlePanel.isValid || !activePuzzlePanel.activeInHierarchy) {
      stopPuzzleHold(activePuzzlePanel || null);
    }
  }

  function runOriginalPuzzleTouchStart(panel) {
    try {
      var comp = getPuzzlePanelComponent(panel);
      if (!comp || typeof comp.touchStart !== "function") return false;
      if (comp.isOnClick || comp.timer != null) return true;
      comp._restoreTouchFallbackStart = Date.now();
      comp.touchStart.call(comp);
      return true;
    } catch (err) {
      console.error("restore original puzzle touchStart failed", err && err.message ? err.message : err);
    }
    return false;
  }

  function runOriginalPuzzleTouchEnd(panel) {
    try {
      var comp = getPuzzlePanelComponent(panel);
      if (!comp || typeof comp.touchEnd !== "function") return false;
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      ensurePuzzleUserData(globalData);
      var puzzleIndex = getPuzzleIndex(globalData, comp);
      var beforeProgress = globalData.user && globalData.user.puzzleProgress ? globalData.user.puzzleProgress[puzzleIndex] || 0 : 0;
      var beforeBlockNum = globalData.user && typeof globalData.user.blockNum === "number" ? globalData.user.blockNum : 0;
      if (!comp.isOnClick && comp.timer == null) runOriginalPuzzleTouchStart(panel);
      if (!comp.isOnClick && comp.timer == null) return false;
      comp.touchEnd.call(comp);
      syncAfterOriginalPuzzleUnlock(panel, comp);
      var afterProgress = globalData.user && globalData.user.puzzleProgress ? globalData.user.puzzleProgress[puzzleIndex] || 0 : beforeProgress;
      var afterBlockNum = globalData.user && typeof globalData.user.blockNum === "number" ? globalData.user.blockNum : beforeBlockNum;
      if (beforeBlockNum > 0 && afterProgress === beforeProgress && afterBlockNum === beforeBlockNum) {
        return runPuzzleButtonPress(panel, "tap-fallback");
      }
      return true;
    } catch (err) {
      console.error("restore original puzzle touchEnd failed", err && err.message ? err.message : err);
    }
    return false;
  }

  function addOriginalPuzzleButtonTouch(target, panel) {
    if (!target || !target.isValid || target._restoreOriginalPuzzleButtonTouch) return;
    target.on(cc.Node.EventType.TOUCH_START, function (event) {
      if (isAnimalDecPanelOpen(cc.director && cc.director.getScene && cc.director.getScene())) { routeAnimalDecTouch(event); return; }
      event.stopPropagationImmediate && event.stopPropagationImmediate();
      event.stopPropagation && event.stopPropagation();
      puzzleTouchLastTime = Date.now();
      runOriginalPuzzleTouchStart(panel);
    });
    target.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
      if (isAnimalDecPanelOpen(cc.director && cc.director.getScene && cc.director.getScene())) { routeAnimalDecTouch(event); return; }
      event.stopPropagationImmediate && event.stopPropagationImmediate();
      event.stopPropagation && event.stopPropagation();
      puzzleTouchLastTime = Date.now();
    });
    target.on(cc.Node.EventType.TOUCH_END, function (event) {
      if (isAnimalDecPanelOpen(cc.director && cc.director.getScene && cc.director.getScene())) { routeAnimalDecTouch(event); return; }
      event.stopPropagationImmediate && event.stopPropagationImmediate();
      event.stopPropagation && event.stopPropagation();
      puzzleTouchLastTime = Date.now();
      runOriginalPuzzleTouchEnd(panel);
    });
    target.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
      if (isAnimalDecPanelOpen(cc.director && cc.director.getScene && cc.director.getScene())) { routeAnimalDecTouch(event); return; }
      event.stopPropagationImmediate && event.stopPropagationImmediate();
      event.stopPropagation && event.stopPropagation();
      puzzleTouchLastTime = Date.now();
      runOriginalPuzzleTouchEnd(panel);
    });
    if (cc.Node.EventType.MOUSE_DOWN) {
      target.on(cc.Node.EventType.MOUSE_DOWN, function (event) {
        if (isAnimalDecPanelOpen(cc.director && cc.director.getScene && cc.director.getScene())) { routeAnimalDecTouch(event); return; }
        if (Date.now() - puzzleTouchLastTime < 350) return;
        event.stopPropagationImmediate && event.stopPropagationImmediate();
        event.stopPropagation && event.stopPropagation();
        runOriginalPuzzleTouchStart(panel);
      });
    }
    if (cc.Node.EventType.MOUSE_UP) {
      target.on(cc.Node.EventType.MOUSE_UP, function (event) {
        if (isAnimalDecPanelOpen(cc.director && cc.director.getScene && cc.director.getScene())) { routeAnimalDecTouch(event); return; }
        event.stopPropagationImmediate && event.stopPropagationImmediate();
        event.stopPropagation && event.stopPropagation();
        runOriginalPuzzleTouchEnd(panel);
      });
    }
    var children = target.children || [];
    for (var i = 0; i < children.length; i++) addOriginalPuzzleButtonTouch(children[i], panel);
    target._restoreOriginalPuzzleButtonTouch = true;
  }

  function runOriginalPuzzleUnlockOnce(panel, reason) {
    try {
      if (!panel || !panel.isValid || !panel.activeInHierarchy) return false;
      var comp = getPuzzlePanelComponent(panel);
      if (!comp || typeof comp.unLockPuzzle !== "function") return false;
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      ensurePuzzleUserData(globalData);
      var user = globalData.user;
      if (!user || user.blockNum <= 0) {
        refreshPuzzlePanelBlockLabel(cc.director.getScene());
        return false;
      }
      var max = getPuzzleMax();
      var puzzleIndex = getPuzzleIndex(globalData, comp);
      var progress = Math.max(0, Math.min(max, user.puzzleProgress[puzzleIndex] || 0));
      if (progress >= max) return false;
      comp.puzzleIndex = puzzleIndex;
      comp.unLockProgress = progress;
      comp.lockBtn = false;
      comp.isLockFinish = puzzleIndex === 29 && progress >= max;
      globalData._restoreCurrentPuzzleIndex = puzzleIndex;
      comp.unLockPuzzle.call(comp);
      syncAfterOriginalPuzzleUnlock(panel, comp);
      console.log("restore puzzle original unlock bridge", reason || "tap", puzzleIndex, progress, user.blockNum);
      return true;
    } catch (err) {
      console.error("restore puzzle original unlock bridge failed", err && err.message ? err.message : err);
    }
    return false;
  }

  function handlePuzzleCanvasBridge(panel, event) {
    try {
      if (isAnimalDecPanelOpen(cc.director && cc.director.getScene && cc.director.getScene())) { routeAnimalDecTouch(event); return false; }
      if (!panel || !panel.isValid || !panel.activeInHierarchy) return false;
      var point = event && event.getLocation && event.getLocation();
      var puzzleBtn = findNode(panel, "puzzleBtn");
      if (!point || !puzzleBtn || !puzzleBtn.isValid || !puzzleBtn.activeInHierarchy) return false;
      if (!pointInNodeBox(puzzleBtn, point, 80, 80) && !pointInNodeTree(puzzleBtn, point)) return false;
      event.stopPropagationImmediate && event.stopPropagationImmediate();
      event.stopPropagation && event.stopPropagation();
      return runOriginalPuzzleUnlockOnce(panel, "canvas-bridge");
    } catch (err) {
      console.error("restore puzzle canvas bridge failed", err && err.message ? err.message : err);
    }
    return false;
  }

  function installPuzzleCanvasBridge(panel) {
    if (!panel || !panel.isValid || panel._restorePuzzleCanvasBridge) return;
    var target = (cc.Canvas && cc.Canvas.instance && cc.Canvas.instance.node) || (cc.director && cc.director.getScene && cc.director.getScene());
    if (!target || !target.isValid) return;
    target.on(cc.Node.EventType.TOUCH_END, function (event) { handlePuzzleCanvasBridge(panel, event); }, panel, true);
    if (cc.Node.EventType.MOUSE_UP) target.on(cc.Node.EventType.MOUSE_UP, function (event) { handlePuzzleCanvasBridge(panel, event); }, panel, true);
    if (cc.systemEvent && cc.SystemEvent && cc.SystemEvent.EventType) {
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, function (event) {
        try {
          if (isAnimalDecPanelOpen(cc.director && cc.director.getScene && cc.director.getScene())) { routeAnimalDecTouch(event); return; }
          if (!panel || !panel.isValid || !panel.activeInHierarchy) return;
          var point = event && event.getLocation && event.getLocation();
          if (!point) return;
          var backBtn = findNode(panel, "backBtn");
          var continueBtn = findNode(panel, "continueBtn");
          if ((backBtn && pointInNodeTree(backBtn, point)) || (continueBtn && pointInNodeTree(continueBtn, point))) return;
          var puzzleBtn = findNode(panel, "puzzleBtn");
          var hitButton = puzzleBtn && puzzleBtn.isValid && pointInNodeBox(puzzleBtn, point, 160, 120);
          var hitPanelBottom = panel.getBoundingBoxToWorld && panel.getBoundingBoxToWorld().contains(point) && point.y < panel.getBoundingBoxToWorld().y + panel.getBoundingBoxToWorld().height * 0.35;
          if (!hitButton && !hitPanelBottom) return;
          event.stopPropagationImmediate && event.stopPropagationImmediate();
          event.stopPropagation && event.stopPropagation();
          runOriginalPuzzleUnlockOnce(panel, hitButton ? "system-button" : "system-bottom");
        } catch (sysErr) {}
      }, panel, true);
    }
    panel._restorePuzzleCanvasBridge = true;
    console.log("restore puzzle canvas bridge installed", target.name || "target");
  }

  function cleanupPuzzleButtonProxies(panel) {
    hidePuzzleButtonProxy();
    if (!panel || !panel.isValid) return;
    var names = ["restorePuzzleOriginalUnlockProxy", "restorePuzzleBtnProxy"];
    for (var i = 0; i < names.length; i++) {
      var proxy = findChild(panel, names[i]);
      if (proxy && proxy.isValid) proxy.active = false;
    }
  }
  function ensurePuzzleOriginalUnlockProxy(panel) {
    if (!panel || !panel.isValid) return null;
    var puzzleBtn = findNode(panel, "puzzleBtn");
    if (!puzzleBtn || !puzzleBtn.isValid) return null;
    var proxy = findChild(panel, "restorePuzzleOriginalUnlockProxy");
    if (!proxy) {
      proxy = new cc.Node("restorePuzzleOriginalUnlockProxy");
      proxy.parent = panel;
      proxy.setAnchorPoint && proxy.setAnchorPoint(0.5, 0.5);
      if (cc.BlockInputEvents && proxy.addComponent) proxy.addComponent(cc.BlockInputEvents);
    }
    proxy.active = puzzleBtn.active !== false;
    proxy.opacity = 1;
    proxy.setLocalZOrder && proxy.setLocalZOrder(10000);
    proxy.zIndex = 10000;
    try {
      var world = puzzleBtn.parent && puzzleBtn.parent.convertToWorldSpaceAR ? puzzleBtn.parent.convertToWorldSpaceAR(puzzleBtn.position) : null;
      var local = world && panel.convertToNodeSpaceAR ? panel.convertToNodeSpaceAR(world) : null;
      if (local && proxy.setPosition) proxy.setPosition(local.x, local.y);
      else if (proxy.setPosition) proxy.setPosition(puzzleBtn.x || 0, puzzleBtn.y || -650);
    } catch (posErr) {
      proxy.setPosition && proxy.setPosition(puzzleBtn.x || 0, puzzleBtn.y || -650);
    }
    proxy.setContentSize && proxy.setContentSize(Math.max(puzzleBtn.width || 0, 460), Math.max(puzzleBtn.height || 0, 220));
    if (!proxy._restorePuzzleOriginalUnlockProxyTouch) {
      proxy.on(cc.Node.EventType.TOUCH_END, function (event) {
        event.stopPropagationImmediate && event.stopPropagationImmediate();
        event.stopPropagation && event.stopPropagation();
        runOriginalPuzzleUnlockOnce(panel, "proxy");
      });
      if (cc.Node.EventType.MOUSE_UP) {
        proxy.on(cc.Node.EventType.MOUSE_UP, function (event) {
          event.stopPropagationImmediate && event.stopPropagationImmediate();
          event.stopPropagation && event.stopPropagation();
          runOriginalPuzzleUnlockOnce(panel, "proxy-mouse");
        });
      }
      proxy._restorePuzzleOriginalUnlockProxyTouch = true;
    }
    return proxy;
  }

  function runPuzzleButtonPress(panel, reason) {
    try {
      if (!panel || !panel.isValid || !panel.activeInHierarchy) return false;
      var comp = getPuzzlePanelComponent(panel);
      if (!comp || typeof comp.unLockPuzzle !== "function") return false;
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      ensurePuzzleUserData(globalData);
      if (!globalData.user || globalData.user.blockNum <= 0) {
        console.log("restore puzzle button pressed no blocks", reason || "tap", globalData.user && globalData.user.blockNum);
        if (globalData.gui && typeof globalData.gui.toast === "function") globalData.gui.toast("\u62fc\u56fe\u788e\u5757\u5df2\u7528\u5b8c\uff01");
        updatePuzzlePanelState(panel, globalData.user);
        return false;
      }
      var max = getPuzzleMax();
      var puzzleIndex = getPuzzleIndex(globalData, comp);
      var progress = Math.max(0, Math.min(max, globalData.user.puzzleProgress[puzzleIndex] || 0));
      comp.puzzleIndex = puzzleIndex;
      comp.unLockProgress = progress;
      comp.lockBtn = false;
      comp.isLockFinish = puzzleIndex === 29 && progress >= max;
      console.log("restore puzzle button pressed", reason || "tap", puzzleIndex, progress, globalData.user.blockNum);
      comp.unLockPuzzle.call(comp);
      syncAfterOriginalPuzzleUnlock(panel, comp);
      return true;
    } catch (err) {
      console.error("restore puzzle button press failed", err && err.message ? err.message : err);
    }
    return false;
  }

  function startPuzzleDirectHold(panel) {
    stopPuzzleDirectHold(false);
    puzzleDirectHoldTimer = setTimeout(function () {
      runPuzzleUnlock(panel, "hold", true);
      puzzleDirectHoldInterval = setInterval(function () {
        if (!panel || !panel.isValid || !panel.activeInHierarchy || !runPuzzleUnlock(panel, "hold")) stopPuzzleDirectHold(false);
      }, 160);
    }, 180);
  }

  function stopPuzzleDirectHold(runTap, panel) {
    if (puzzleDirectHoldTimer) {
      clearTimeout(puzzleDirectHoldTimer);
      puzzleDirectHoldTimer = null;
      if (runTap) runPuzzleUnlock(panel, "tap", true);
    }
    if (puzzleDirectHoldInterval) {
      clearInterval(puzzleDirectHoldInterval);
      puzzleDirectHoldInterval = null;
    }
  }

  function getPuzzleButtonHitNode(panel) {
    if (!panel || !panel.isValid) return null;
    var puzzleBtn = findNode(panel, "puzzleBtn");
    if (puzzleBtn && puzzleBtn.isValid && puzzleBtn.activeInHierarchy) return puzzleBtn;
    var continueBtn = findNode(panel, "continueBtn");
    if (continueBtn && continueBtn.isValid && continueBtn.activeInHierarchy) return continueBtn;
    return null;
  }

  function hidePuzzleButtonProxy() {
    try {
      var root = (cc.Canvas && cc.Canvas.instance && cc.Canvas.instance.node) || (cc.director && cc.director.getScene && cc.director.getScene());
      var proxy = root && findChild(root, "restorePuzzleBtnProxy");
      if (!proxy || !proxy.isValid) return;
      proxy.active = false;
      proxy.opacity = 0;
      proxy._restorePuzzleProxyPanel = null;
    } catch (err) {}
  }

  function isPuzzleButtonProxyUsable(proxy) {
    var panel = proxy && proxy._restorePuzzleProxyPanel;
    return !!(proxy && proxy.isValid && panel && panel.isValid && panel.activeInHierarchy);
  }

  function handlePuzzleGlobalPress(panel, event, phase) {
    try {
      if (isAnimalDecPanelOpen(cc.director && cc.director.getScene && cc.director.getScene())) { routeAnimalDecTouch(event); return false; }
      if (!panel || !panel.isValid || !panel.activeInHierarchy) return false;
      var point = event && event.getLocation && event.getLocation();
      var hitNode = getPuzzleButtonHitNode(panel);
      if (!point || !hitNode || !pointInNodeBox(hitNode, point, 80, 80)) return false;
      event.stopPropagationImmediate && event.stopPropagationImmediate();
      event.stopPropagation && event.stopPropagation();
      if (hitNode.name === "continueBtn") {
        if (phase === "end") closePuzzlePanel(panel);
        return true;
      }
      if (phase === "start") startPuzzleDirectHold(panel);
      else if (phase === "cancel") stopPuzzleDirectHold(false, panel);
      else if (phase === "end") stopPuzzleDirectHold(true, panel);
      return true;
    } catch (err) {
      console.error("restore puzzle global press failed", err && err.message ? err.message : err);
    }
    return false;
  }

  function installPuzzleGlobalTouch(panel) {
    if (!panel || !panel.isValid || panel._restorePuzzleGlobalTouch) return;
    var target = (cc.Canvas && cc.Canvas.instance && cc.Canvas.instance.node) || (cc.director && cc.director.getScene && cc.director.getScene());
    if (!target || !target.isValid) return;
    if (puzzleGlobalTouchTarget && puzzleGlobalTouchTarget.isValid && puzzleGlobalTouchTarget !== target) {
      try { puzzleGlobalTouchTarget.targetOff && puzzleGlobalTouchTarget.targetOff(panel); } catch (err) {}
    }
    target.on(cc.Node.EventType.TOUCH_START, function (event) { handlePuzzleGlobalPress(panel, event, "start"); }, panel, true);
    target.on(cc.Node.EventType.TOUCH_END, function (event) { handlePuzzleGlobalPress(panel, event, "end"); }, panel, true);
    target.on(cc.Node.EventType.TOUCH_CANCEL, function (event) { handlePuzzleGlobalPress(panel, event, "cancel"); }, panel, true);
    if (cc.Node.EventType.MOUSE_DOWN) target.on(cc.Node.EventType.MOUSE_DOWN, function (event) { handlePuzzleGlobalPress(panel, event, "start"); }, panel, true);
    if (cc.Node.EventType.MOUSE_UP) target.on(cc.Node.EventType.MOUSE_UP, function (event) { handlePuzzleGlobalPress(panel, event, "end"); }, panel, true);
    puzzleGlobalTouchTarget = target;
    panel._restorePuzzleGlobalTouch = true;
    console.log("restore puzzle global touch installed", target.name || "target");
  }

  function addPuzzleUnlockTouch(target, panel) {
    if (!target || !target.isValid || target._restorePuzzleUnlockTouch) return;
    target.on(cc.Node.EventType.TOUCH_START, function (event) {
      event.stopPropagationImmediate && event.stopPropagationImmediate();
      event.stopPropagation && event.stopPropagation();
      puzzleTouchLastTime = Date.now();
      startPuzzleDirectHold(panel);
    });
    target.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
      event.stopPropagationImmediate && event.stopPropagationImmediate();
      event.stopPropagation && event.stopPropagation();
      puzzleTouchLastTime = Date.now();
      if (puzzleCancelStopTimer) {
        clearTimeout(puzzleCancelStopTimer);
        puzzleCancelStopTimer = null;
      }
    });
    target.on(cc.Node.EventType.TOUCH_END, function (event) {
      event.stopPropagationImmediate && event.stopPropagationImmediate();
      event.stopPropagation && event.stopPropagation();
      puzzleTouchLastTime = Date.now();
      stopPuzzleDirectHold(true, panel);
    });
    target.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
      event.stopPropagationImmediate && event.stopPropagationImmediate();
      event.stopPropagation && event.stopPropagation();
      puzzleTouchLastTime = Date.now();
      stopPuzzleDirectHold(false, panel);
    });
    if (cc.Node.EventType.MOUSE_DOWN) {
      target.on(cc.Node.EventType.MOUSE_DOWN, function (event) {
        if (Date.now() - puzzleTouchLastTime < 350) return;
        event.stopPropagationImmediate && event.stopPropagationImmediate();
        event.stopPropagation && event.stopPropagation();
        startPuzzleDirectHold(panel);
      });
    }
    if (cc.Node.EventType.MOUSE_UP) {
      target.on(cc.Node.EventType.MOUSE_UP, function (event) {
        event.stopPropagationImmediate && event.stopPropagationImmediate();
        event.stopPropagation && event.stopPropagation();
        stopPuzzleDirectHold(true, panel);
      });
    }
    var children = target.children || [];
    for (var i = 0; i < children.length; i++) addPuzzleUnlockTouch(children[i], panel);
    target._restorePuzzleUnlockTouch = true;
  }

  function ensurePuzzleButtonProxy(puzzleBtn, panel) {
    if (!puzzleBtn || !puzzleBtn.isValid || !panel || !panel.isValid) return null;
    var root = (cc.Canvas && cc.Canvas.instance && cc.Canvas.instance.node) || panel;
    var proxy = findChild(root, "restorePuzzleBtnProxy");
    if (!proxy) {
      proxy = new cc.Node("restorePuzzleBtnProxy");
      proxy.parent = root;
      proxy.setAnchorPoint && proxy.setAnchorPoint(0.5, 0.5);
      if (cc.BlockInputEvents && proxy.addComponent) proxy.addComponent(cc.BlockInputEvents);
    }
    proxy._restorePuzzleProxyPanel = panel;
    var enabled = panel.activeInHierarchy && puzzleBtn.activeInHierarchy;
    proxy.active = !!enabled;
    proxy.opacity = enabled ? 1 : 0;
    if (!enabled) return proxy;
    proxy.setLocalZOrder && proxy.setLocalZOrder(2147483647);
    proxy.zIndex = 2147483647;
    try {
      var world = puzzleBtn.parent && puzzleBtn.parent.convertToWorldSpaceAR ? puzzleBtn.parent.convertToWorldSpaceAR(puzzleBtn.position) : null;
      var local = world && root.convertToNodeSpaceAR ? root.convertToNodeSpaceAR(world) : null;
      if (local && proxy.setPosition) proxy.setPosition(local.x, local.y);
      else if (proxy.setPosition) proxy.setPosition(puzzleBtn.x || 0, puzzleBtn.y || -650);
    } catch (posErr) {
      proxy.setPosition && proxy.setPosition(puzzleBtn.x || 0, puzzleBtn.y || -650);
    }
    proxy.setContentSize && proxy.setContentSize(Math.max(puzzleBtn.width || 0, 520), Math.max(puzzleBtn.height || 0, 260));
    if (!proxy._restorePuzzleBtnProxyTouch) {
      proxy.on(cc.Node.EventType.TOUCH_START, function (event) {
        if (!isPuzzleButtonProxyUsable(proxy)) { hidePuzzleButtonProxy(); return; }
        var livePanel = proxy._restorePuzzleProxyPanel;
        event.stopPropagationImmediate && event.stopPropagationImmediate();
        event.stopPropagation && event.stopPropagation();
        puzzleTouchLastTime = Date.now();
        cleanupPuzzleEffectsSoon(livePanel, true);
        console.log("restore puzzle proxy touch start");
        startPuzzleDirectHold(livePanel);
      });
      proxy.on(cc.Node.EventType.TOUCH_END, function (event) {
        if (!isPuzzleButtonProxyUsable(proxy)) { hidePuzzleButtonProxy(); return; }
        var livePanel = proxy._restorePuzzleProxyPanel;
        event.stopPropagationImmediate && event.stopPropagationImmediate();
        event.stopPropagation && event.stopPropagation();
        puzzleTouchLastTime = Date.now();
        console.log("restore puzzle proxy touch end");
        stopPuzzleDirectHold(true, livePanel);
        cleanupPuzzleEffectsSoon(livePanel, true);
      });
      proxy.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
        if (!isPuzzleButtonProxyUsable(proxy)) { hidePuzzleButtonProxy(); return; }
        var livePanel = proxy._restorePuzzleProxyPanel;
        event.stopPropagationImmediate && event.stopPropagationImmediate();
        event.stopPropagation && event.stopPropagation();
        puzzleTouchLastTime = Date.now();
        stopPuzzleDirectHold(false, livePanel);
        cleanupPuzzleEffectsSoon(livePanel, true);
      });
      if (cc.Node.EventType.MOUSE_DOWN) {
        proxy.on(cc.Node.EventType.MOUSE_DOWN, function (event) {
          if (!isPuzzleButtonProxyUsable(proxy)) { hidePuzzleButtonProxy(); return; }
          var livePanel = proxy._restorePuzzleProxyPanel;
          event.stopPropagationImmediate && event.stopPropagationImmediate();
          event.stopPropagation && event.stopPropagation();
          puzzleTouchLastTime = Date.now();
          cleanupPuzzleEffectsSoon(livePanel, true);
          console.log("restore puzzle proxy mouse down");
          startPuzzleDirectHold(livePanel);
        });
      }
      if (cc.Node.EventType.MOUSE_UP) {
        proxy.on(cc.Node.EventType.MOUSE_UP, function (event) {
          if (!isPuzzleButtonProxyUsable(proxy)) { hidePuzzleButtonProxy(); return; }
          var livePanel = proxy._restorePuzzleProxyPanel;
          event.stopPropagationImmediate && event.stopPropagationImmediate();
          event.stopPropagation && event.stopPropagation();
          puzzleTouchLastTime = Date.now();
          console.log("restore puzzle proxy mouse up");
          stopPuzzleDirectHold(true, livePanel);
          cleanupPuzzleEffectsSoon(livePanel, true);
        });
      }
      proxy._restorePuzzleBtnProxyTouch = true;
    }
    console.log("restore puzzle button canvas proxy ready", root.name || "canvas", proxy.x, proxy.y, proxy.width, proxy.height);
    return proxy;
  }

  function detachOriginalPuzzleTouchHandlers(panel, puzzleBtn, backBtn, continueBtn) {
    return;
    var comp = getPuzzlePanelComponent(panel);
    if (!comp) return;
    try {
      if (puzzleBtn && comp.touchStart) {
        puzzleBtn.off(cc.Node.EventType.TOUCH_START, comp.touchStart, comp);
        puzzleBtn.off(cc.Node.EventType.TOUCH_MOVE, comp.touchStart, comp);
      }
      if (puzzleBtn && comp.touchEnd) {
        puzzleBtn.off(cc.Node.EventType.TOUCH_CANCEL, comp.touchEnd, comp);
        puzzleBtn.off(cc.Node.EventType.TOUCH_END, comp.touchEnd, comp);
      }
      if (backBtn && comp.onClicked) backBtn.off(cc.Node.EventType.TOUCH_END, comp.onClicked, comp);
      if (continueBtn && comp.onClicked) continueBtn.off(cc.Node.EventType.TOUCH_END, comp.onClicked, comp);
      if (comp.timer && comp.unschedule) {
        comp.unschedule(comp.timer);
        comp.timer = null;
      }
      comp.isOnClick = false;
      comp.lockBtn = false;
    } catch (err) {
      console.error("restore detach puzzle handlers failed", err && err.message ? err.message : err);
    }
  }

  function installPuzzlePanelComponentButtons(panel) {
    if (!panel || !panel.isValid || !panel.activeInHierarchy) return;
    var runtime = getPuzzleRuntime(panel);
    var comp = runtime && runtime.comp;
    var puzzleBtn = (comp && comp.puzzleBtn && comp.puzzleBtn.isValid && comp.puzzleBtn) || (runtime && runtime.puzzleBtn);
    var backBtn = (comp && comp.backBtn && comp.backBtn.isValid && comp.backBtn) || findNode(panel, "backBtn");
    var continueBtn = (comp && comp.continueBtn && comp.continueBtn.isValid && comp.continueBtn) || (runtime && runtime.continueBtn);
    if (puzzleBtn && puzzleBtn.isValid && !puzzleBtn._restorePuzzlePanelComponentButton) {
      addOriginalPuzzleButtonTouch(puzzleBtn, panel);
      puzzleBtn._restorePuzzlePanelComponentButton = true;
      console.log("restore puzzle component button bound", puzzleBtn.width, puzzleBtn.height);
    }
    if (puzzleBtn && puzzleBtn.isValid) {
      ensurePuzzleButtonProxy(puzzleBtn, panel);
      installPuzzleGlobalTouch(panel);
    }
    if (backBtn && backBtn.isValid && !backBtn._restorePuzzlePanelCloseButton) {
      addPuzzleCloseTouch(backBtn, panel);
      backBtn._restorePuzzlePanelCloseButton = true;
    }
    if (continueBtn && continueBtn.isValid && !continueBtn._restorePuzzlePanelCloseButton) {
      addPuzzleCloseTouch(continueBtn, panel);
      continueBtn._restorePuzzlePanelCloseButton = true;
    }
    if (!panel._restorePuzzlePanelSystemButtons && cc.systemEvent && cc.SystemEvent && cc.SystemEvent.EventType) {
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_START, function (event) {
        if (!panel.isValid || !panel.activeInHierarchy) return;
        if (isAnimalDecPanelOpen(cc.director && cc.director.getScene && cc.director.getScene())) { routeAnimalDecTouch(event); return; }
        var point = event.getLocation && event.getLocation();
        var runtimeNow = getPuzzleRuntime(panel);
        var compNow = runtimeNow && runtimeNow.comp;
        var btnNow = (compNow && compNow.puzzleBtn && compNow.puzzleBtn.isValid && compNow.puzzleBtn) || (runtimeNow && runtimeNow.puzzleBtn);
        if (point && btnNow && btnNow.isValid && btnNow.activeInHierarchy && pointInNodeBox(btnNow, point, 80, 80)) {
          event.stopPropagationImmediate && event.stopPropagationImmediate();
          event.stopPropagation && event.stopPropagation();
          puzzleTouchLastTime = Date.now();
          startPuzzleDirectHold(panel);
        }
      });
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, function (event) {
        if (!panel.isValid || !panel.activeInHierarchy) return;
        if (isAnimalDecPanelOpen(cc.director && cc.director.getScene && cc.director.getScene())) { routeAnimalDecTouch(event); return; }
        var point = event.getLocation && event.getLocation();
        var runtimeNow = getPuzzleRuntime(panel);
        var compNow = runtimeNow && runtimeNow.comp;
        var btnNow = (compNow && compNow.puzzleBtn && compNow.puzzleBtn.isValid && compNow.puzzleBtn) || (runtimeNow && runtimeNow.puzzleBtn);
        var backNow = (compNow && compNow.backBtn && compNow.backBtn.isValid && compNow.backBtn) || findNode(panel, "backBtn");
        var continueNow = (compNow && compNow.continueBtn && compNow.continueBtn.isValid && compNow.continueBtn) || (runtimeNow && runtimeNow.continueBtn);
        if (point && btnNow && btnNow.isValid && btnNow.activeInHierarchy && pointInNodeBox(btnNow, point, 80, 80)) {
          event.stopPropagationImmediate && event.stopPropagationImmediate();
          event.stopPropagation && event.stopPropagation();
          puzzleTouchLastTime = Date.now();
          stopPuzzleDirectHold(true, panel);
        } else if (point && backNow && backNow.isValid && pointInNodeBox(backNow, point, 40, 40)) {
          event.stopPropagation && event.stopPropagation();
          closePuzzlePanel(panel);
        } else if (point && continueNow && continueNow.isValid && continueNow.activeInHierarchy && pointInNodeBox(continueNow, point, 40, 40)) {
          event.stopPropagation && event.stopPropagation();
          closePuzzlePanel(panel);
        }
      });
      panel._restorePuzzlePanelSystemButtons = true;
      console.log("restore puzzle component system buttons bound");
    }
  }
  function closePuzzlePanel(panel) {
    try {
      stopPuzzleHold(panel);
      hidePuzzleButtonProxy();
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      var uiId = globals.uiId;
      cleanupPuzzleEffects(panel);
      try {
        ensurePuzzleUserData(globalData);
        var runtime = getPuzzleRuntime(panel);
        var max = getPuzzleMax();
        var currentIndex = getPuzzleIndex(globalData, runtime && runtime.comp);
        var currentProgress = globalData && globalData.user ? Math.max(0, Math.min(max, globalData.user.puzzleProgress[currentIndex] || 0)) : 0;
        capturePuzzleBoardSnapshot(panel, currentIndex, currentProgress);
      } catch (snapshotErr) {}
      persistPuzzleUserData(globalData && globalData.user);
      globalData.platform && globalData.platform.playEffect && globalData.platform.playEffect("ab:audio/click");
      try {
        var eventModule = requireGameModule("EventDispatcher");
        var ed = eventModule.ED || (eventModule.default && eventModule.default.ED);
        var clientEvent = eventModule.ClientEvent || (eventModule.default && eventModule.default.ClientEvent);
        if (ed && clientEvent && clientEvent.RESTART) ed.send(clientEvent.RESTART);
        if (ed && clientEvent && clientEvent.UPDATE_HOME_PUZZLE_MASK) ed.send(clientEvent.UPDATE_HOME_PUZZLE_MASK);
      } catch (err) {}
      globalData.isPuzzle = false;
      globalData.gui.remove(uiId.PuzzlePanel);
      setTimeout(function () {
        try {
          var scene = cc.director && cc.director.getScene && cc.director.getScene();
          if (scene && !findNode(scene, "startBtn")) globalData.gui.open(uiId.MainPanel);
          setTimeout(function () {
            try {
              refreshHomePuzzlePreview(cc.director && cc.director.getScene && cc.director.getScene(), true);
            } catch (err) {}
          }, 80);
        } catch (err) {}
      }, 60);
      console.log("restore puzzle close");
    } catch (err) {
      console.error("restore puzzle close failed", err && err.message ? err.message : err);
    }
  }

  function addPuzzleCloseTouch(target, panel) {
    if (!target || !target.isValid || target._restorePuzzleCloseTouch) return;
    target.on(cc.Node.EventType.TOUCH_END, function (event) {
      event.stopPropagation && event.stopPropagation();
      closePuzzlePanel(panel);
    });
    var children = target.children || [];
    for (var i = 0; i < children.length; i++) addPuzzleCloseTouch(children[i], panel);
    target._restorePuzzleCloseTouch = true;
  }

  function sendRestartEvent() {
    try {
      var eventModule = requireGameModule("EventDispatcher");
      var ed = eventModule.ED || (eventModule.default && eventModule.default.ED);
      var clientEvent = eventModule.ClientEvent || (eventModule.default && eventModule.default.ClientEvent);
      if (ed && clientEvent && clientEvent.RESTART) {
        ed.send(clientEvent.RESTART);
        return true;
      }
    } catch (err) {}
    return false;
  }

  function restartNextResultLevel(panel) {
    var now = Date.now();
    if (now - resultNextLastTime < 900) return;
    resultNextLastTime = now;
    try {
      var gameAppModule = requireGameModule("GameApp");
      var gameApp = gameAppModule.GameApp || gameAppModule.default || gameAppModule;
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      var uiId = globals.uiId;
      if (!globalData || !globalData.user) return;

      globalData.platform && globalData.platform.playEffect && globalData.platform.playEffect("ab:audio/click");
      awardPuzzleBlocks("next");
      globalData.user.level = (typeof globalData.user.level === "number" ? globalData.user.level : 1) + 1;
      persistPuzzleUserData(globalData.user);
      globalData.platform && globalData.platform.submitScoreForRank && globalData.platform.submitScoreForRank(globalData.user.level, function () {});
      if (uiId && uiId.ResultPanel !== undefined) {
        try { globalData.gui.remove(uiId.ResultPanel); } catch (removeErr) {}
      }
      if (!sendRestartEvent() && gameApp.gameMgr && gameApp.gameMgr.enterGame) gameApp.gameMgr.enterGame();
      suppressGameGuideSoon();
      console.log("restore result next level", globalData.user.level, panel && panel.name);
    } catch (err) {
      console.error("restore result next failed", err && err.message ? err.message : err);
    }
  }

  function installResultNextPatch(resultPanel) {
    if (!resultPanel || !resultPanel.isValid || !resultPanel.activeInHierarchy) return;
    var nextBtn = findNode(resultPanel, "nextBtn");
    if (!nextBtn || !nextBtn.isValid) return;
    var proxy = findChild(nextBtn, "restoreResultNextProxy");
    if (!proxy) {
      proxy = new cc.Node("restoreResultNextProxy");
      proxy.parent = nextBtn;
      proxy.setAnchorPoint && proxy.setAnchorPoint(0.5, 0.5);
      proxy.setPosition && proxy.setPosition(0, 0);
      if (cc.BlockInputEvents && proxy.addComponent) proxy.addComponent(cc.BlockInputEvents);
    }
    proxy.active = true;
    proxy.opacity = 1;
    proxy.setLocalZOrder && proxy.setLocalZOrder(9999);
    proxy.setContentSize && proxy.setContentSize(nextBtn.width > 0 ? nextBtn.width : 350, nextBtn.height > 0 ? nextBtn.height : 155);
    if (!proxy._restoreResultNextTouch) {
      proxy.on(cc.Node.EventType.TOUCH_END, function (event) {
        event.stopPropagationImmediate && event.stopPropagationImmediate();
        event.stopPropagation && event.stopPropagation();
        restartNextResultLevel(resultPanel);
      });
      proxy._restoreResultNextTouch = true;
    }
    if (!resultPanel._restoreResultNextSystemTouch && cc.systemEvent && cc.SystemEvent && cc.SystemEvent.EventType) {
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, function (event) {
        if (!resultPanel.isValid || !resultPanel.activeInHierarchy || !nextBtn.isValid) return;
        var point = event.getLocation && event.getLocation();
        if (point && pointInNodeTree(nextBtn, point)) {
          event.stopPropagationImmediate && event.stopPropagationImmediate();
          event.stopPropagation && event.stopPropagation();
          restartNextResultLevel(resultPanel);
        }
      });
      resultPanel._restoreResultNextSystemTouch = true;
      console.log("restore result next patch installed", nextBtn.width, nextBtn.height);
    }
  }

  function installPuzzleUnlockPatch(scene) {
    var panel = getPuzzlePanel(scene);
    if (!panel || !panel.activeInHierarchy) return;
    cleanupPuzzleButtonProxies(panel);
    refreshPuzzlePanelToCurrent(panel, true);
    patchGlobalClickEffectForPuzzle(panel);
    installPuzzleBoardEffectBlocker(panel);
    installPuzzlePanelComponentButtons(panel);
    cleanupPuzzleClickEffectsSoon(panel);
    cleanupPuzzleAnimNodeResidue(panel);
    emitClientEvent("UPDATE_PUZZLE_MASK");
    return;

    if (false && !panel._restorePuzzleUnlockSystemTouch && cc.systemEvent && cc.SystemEvent && cc.SystemEvent.EventType) {
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_START, function (event) {
        if (!panel.isValid || !panel.activeInHierarchy) return;
        var point = event.getLocation && event.getLocation();
        if (point && panel.isValid && panel.activeInHierarchy && puzzleBtn && puzzleBtn.isValid && puzzleBtn.activeInHierarchy && (pointInNodeTree(puzzleBtn, point) || pointInNodeBox(puzzleBtn, point, 40, 40))) {
          event.stopPropagationImmediate && event.stopPropagationImmediate();
          event.stopPropagation && event.stopPropagation();
          puzzleTouchLastTime = Date.now();
          startPuzzleDirectHold(panel);
        }
      });
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, function (event) {
        if (!panel.isValid || !panel.activeInHierarchy) return;
        var point = event.getLocation && event.getLocation();
        if (point && panel.isValid && panel.activeInHierarchy && backBtn && backBtn.isValid && pointInNodeTree(backBtn, point)) {
          event.stopPropagation && event.stopPropagation();
          closePuzzlePanel(panel);
        } else if (point && panel.isValid && panel.activeInHierarchy && puzzleBtn && puzzleBtn.isValid && puzzleBtn.activeInHierarchy && (pointInNodeTree(puzzleBtn, point) || pointInNodeBox(puzzleBtn, point, 40, 40))) {
          event.stopPropagationImmediate && event.stopPropagationImmediate();
          event.stopPropagation && event.stopPropagation();
          puzzleTouchLastTime = Date.now();
          stopPuzzleDirectHold(true, panel);
        } else if (point && panel.isValid && panel.activeInHierarchy && continueBtn && continueBtn.isValid && continueBtn.activeInHierarchy && pointInNodeTree(continueBtn, point)) {
          event.stopPropagation && event.stopPropagation();
          closePuzzlePanel(panel);
        } else if (puzzleHoldActive && (!activePuzzlePanel || activePuzzlePanel === panel)) {
          stopPuzzleHold(panel);
        }
      });
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_CANCEL, function () {
        if (!panel.isValid || !panel.activeInHierarchy) return;
        stopPuzzleDirectHold(false, panel);
        if (activePuzzlePanel && activePuzzlePanel !== panel) return;
        handlePuzzleTouchCancel(panel);
      });
      if (cc.SystemEvent.EventType.MOUSE_DOWN) {
        cc.systemEvent.on(cc.SystemEvent.EventType.MOUSE_DOWN, function (event) {
          if (!panel.isValid || !panel.activeInHierarchy) return;
          var point = event.getLocation && event.getLocation();
          if (point && panel.isValid && panel.activeInHierarchy && puzzleBtn && puzzleBtn.isValid && puzzleBtn.activeInHierarchy && (pointInNodeTree(puzzleBtn, point) || pointInNodeBox(puzzleBtn, point, 40, 40))) {
            event.stopPropagationImmediate && event.stopPropagationImmediate();
            event.stopPropagation && event.stopPropagation();
            if (Date.now() - puzzleTouchLastTime < 350) return;
            startPuzzleDirectHold(panel);
          }
        });
      }
      if (cc.SystemEvent.EventType.MOUSE_UP) {
        cc.systemEvent.on(cc.SystemEvent.EventType.MOUSE_UP, function (event) {
          if (!panel.isValid || !panel.activeInHierarchy) return;
          var point = event.getLocation && event.getLocation();
          if (point && panel.isValid && panel.activeInHierarchy && puzzleBtn && puzzleBtn.isValid && puzzleBtn.activeInHierarchy && (pointInNodeTree(puzzleBtn, point) || pointInNodeBox(puzzleBtn, point, 40, 40))) {
            event.stopPropagationImmediate && event.stopPropagationImmediate();
            event.stopPropagation && event.stopPropagation();
            stopPuzzleDirectHold(true, panel);
          } else if (puzzleHoldActive && (!activePuzzlePanel || activePuzzlePanel === panel)) {
            stopPuzzleHold(panel);
          }
        });
      }
      panel._restorePuzzleUnlockSystemTouch = true;
      console.log("restore puzzle unlock patch installed");
    }
  }

  function useGameProp(propName) {
    try {
      var gameAppModule = requireGameModule("GameApp");
      var gameApp = gameAppModule.GameApp || gameAppModule.default || gameAppModule;
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      console.log("restore prop button", propName);
      globalData.platform && globalData.platform.playEffect && globalData.platform.playEffect("ab:audio/click");

      if (propName === "catchBtn" && gameApp.gameMgr && gameApp.gameMgr.onCatch) {
        gameApp.gameMgr.onCatch();
      } else if (propName === "flipBtn" && gameApp.gameMgr && gameApp.gameMgr.onFlip) {
        gameApp.gameMgr.onFlip();
      } else if (propName === "shuffleBtn" && gameApp.gameMgr && gameApp.gameMgr.onShuffle) {
        gameApp.uiMgr && gameApp.uiMgr.onUseShuffle && gameApp.uiMgr.onUseShuffle();
        gameApp.gameMgr.onShuffle();
      }
    } catch (err) {
      console.error("restore prop button failed", propName, err && err.message ? err.message : err);
    }
  }

  function findMainPropIcon(button) {
    if (!button || !button.isValid) return null;
    var preferred = findChild(button, "restorePropMainIcon");
    if (preferred) return preferred;

    var children = button.children || [];
    var best = null;
    var bestArea = 0;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (!child || !child.isValid) continue;
      if (child.name === "dec" || child.name === "num") continue;
      if (child.name === "img_yx_btn_hong" || child.name === "img_yx_shp" || child.name === "img_yx_frenxiang") continue;
      var sprite = child.getComponent && child.getComponent(cc.Sprite);
      if (!sprite) continue;
      var area = Math.max(1, child.width || 0) * Math.max(1, child.height || 0);
      if (area > bestArea) {
        best = child;
        bestArea = area;
      }
    }
    if (best) return best;
    var icon = new cc.Node("restorePropMainIcon");
    icon.parent = button;
    icon.addComponent && icon.addComponent(cc.Sprite);
    return icon;
  }

  function ensurePropLabel(button, text) {
    var dec = findChild(button, "dec");
    if (!dec) dec = makeLabel(button, text, 44, cc.Color.WHITE, 0, -59.942, 118, 62);
    dec.name = "dec";
    dec.active = true;
    dec.opacity = 255;
    dec.setPosition && dec.setPosition(0, -59.942);
    dec.setContentSize && dec.setContentSize(118, 62);
    var label = dec.getComponent && dec.getComponent(cc.Label);
    if (!label && dec.addComponent) label = dec.addComponent(cc.Label);
    if (label) {
      label.string = text;
      label.fontSize = 44;
      label.lineHeight = 44;
      label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
      label.verticalAlign = cc.Label.VerticalAlign.CENTER;
    }
    dec.color = cc.Color.WHITE;
    var outline = dec.getComponent && dec.getComponent(cc.LabelOutline) || dec.addComponent && dec.addComponent(cc.LabelOutline);
    if (outline) {
      outline.width = 3;
      outline.color = cc.color(0, 0, 0, 255);
    }
  }

  function normalizePropBadge(button, share) {
    var badge = findChild(button, "img_yx_btn_hong");
    var adIcon = findChild(button, "img_yx_shp");
    var shareIcon = findChild(button, "img_yx_frenxiang");
    if (badge) {
      badge.active = true;
      badge.opacity = 255;
      badge.setPosition && badge.setPosition(90, 55);
      badge.setContentSize && badge.setContentSize(71, 71);
      badge.setLocalZOrder && badge.setLocalZOrder(20);
    }
    if (adIcon) {
      adIcon.active = !share;
      adIcon.opacity = 255;
      adIcon.setPosition && adIcon.setPosition(90, 55);
      adIcon.setContentSize && adIcon.setContentSize(47, 35);
      adIcon.setLocalZOrder && adIcon.setLocalZOrder(21);
    }
    if (shareIcon) {
      shareIcon.active = !!share;
      shareIcon.opacity = 255;
      shareIcon.setPosition && shareIcon.setPosition(90, 55);
      shareIcon.setContentSize && shareIcon.setContentSize(43, 41);
      shareIcon.setLocalZOrder && shareIcon.setLocalZOrder(21);
    }
  }

  function normalizeGamePropButton(button, options) {
    if (!button || !button.isValid) return;
    options = options || {};
    button.active = true;
    button.opacity = 255;
    button.setContentSize && button.setContentSize(221, 140);
    button.setScale && button.setScale(1);

    var icon = findMainPropIcon(button);
    if (icon) {
      icon.name = "restorePropMainIcon";
      icon.active = true;
      icon.opacity = 255;
      icon.setPosition && icon.setPosition(0, 5);
      icon.setContentSize && icon.setContentSize(options.iconW || 113, options.iconH || 88);
      icon.setScale && icon.setScale(1);
      icon.setLocalZOrder && icon.setLocalZOrder(5);
      var sprite = icon.getComponent && icon.getComponent(cc.Sprite) || icon.addComponent && icon.addComponent(cc.Sprite);
      if (sprite) {
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        if (icon._restorePropIconName !== options.iconName || !sprite.spriteFrame) {
          icon._restorePropIconName = options.iconName;
          loadSpriteFrameInto(sprite, "ab:game/texture/game/" + options.iconName);
        }
      }
    }

    ensurePropLabel(button, options.text || "");
    normalizePropBadge(button, !!options.share);

    var num = findChild(button, "num");
    if (num) {
      num.active = false;
      num.opacity = 0;
    }
  }

  function normalizeGamePropButtons(scene) {
    var btnNode = findNode(scene, "btnNode");
    if (btnNode) {
      btnNode.active = true;
      btnNode.opacity = 255;
      btnNode.setContentSize && btnNode.setContentSize(974, 200);
      btnNode.setScale && btnNode.setScale(1);
    }

    var catchBtn = findNode(scene, "catchBtn");
    var flipBtn = findNode(scene, "flipBtn");
    var shuffleBtn = findNode(scene, "shuffleBtn");
    var shareBtn = findNode(scene, "shuffleShareBtn");

    if (catchBtn) {
      catchBtn.setPosition && catchBtn.setPosition(-376.5, 0);
      normalizeGamePropButton(catchBtn, { text: "\u6293\u8d70", iconName: "img_yx_zhuazou", iconW: 145, iconH: 106 });
    }
    if (flipBtn) {
      flipBtn.setPosition && flipBtn.setPosition(-125.5, 0);
      normalizeGamePropButton(flipBtn, { text: "\u7ffb\u8f6c", iconName: "img_yx_fanzhuan", iconW: 105, iconH: 109 });
    }
    if (shuffleBtn) {
      shuffleBtn.setPosition && shuffleBtn.setPosition(125.5, 0);
      normalizeGamePropButton(shuffleBtn, { text: "\u6d17\u724c", iconName: "img_yx_dasan", iconW: 113, iconH: 88 });
    }
    if (shareBtn) {
      shareBtn.setPosition && shareBtn.setPosition(376.5, 0);
      normalizeGamePropButton(shareBtn, { text: "\u6d17\u724c", iconName: "img_yx_dasan", iconW: 113, iconH: 88, share: true });
    }
  }

  function pauseBackHome() {
    try {
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      var uiId = globals.uiId;
      globalData.platform && globalData.platform.playEffect && globalData.platform.playEffect("ab:audio/click");
      closeMenuPanel(globalData, uiId);
      globalData.gui.remove(uiId.GamePanel);
      globalData.gui.open(uiId.MainPanel);
      console.log("restore pause back home");
    } catch (err) {
      console.error("restore pause back home failed", err && err.message ? err.message : err);
    }
  }

  function pauseSkipLevel() {
    try {
      var gameAppModule = requireGameModule("GameApp");
      var gameApp = gameAppModule.GameApp || gameAppModule.default || gameAppModule;
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      var uiId = globals.uiId;
      globalData.platform && globalData.platform.playEffect && globalData.platform.playEffect("ab:audio/click");
      console.log("restore pause skip tapped");

      var finishSkip = function () {
        suppressGameGuide();
        globalData.user.level++;
        awardPuzzleBlocks("skip");
        var level = globalData.user.level;
        globalData.platform.submitScoreForRank && globalData.platform.submitScoreForRank(level, function () {});
        gameApp.gameMgr && gameApp.gameMgr.enterGame && gameApp.gameMgr.enterGame();
        suppressGameGuideSoon();
        closeMenuPanel(globalData, uiId);
      };

      if (globalData.platform && globalData.platform.watchAd && !globalData._restorePreviewSkipNoAd) {
        var handled = false;
        var fallbackTimer = setTimeout(function () {
          if (handled) return;
          handled = true;
          finishSkip();
        }, 1500);

        globalData.platform.watchAd(function (ok, _unused, message) {
          if (handled) return;
          handled = true;
          clearTimeout(fallbackTimer);
          if (ok) finishSkip();
          else if (message) globalData.gui.toast(message);
          else finishSkip();
        });
      } else {
        finishSkip();
      }
    } catch (err) {
      console.error("restore pause skip level failed", err && err.message ? err.message : err);
    }
  }

  function updatePauseSwitchVisual(button, enabled) {
    if (!button || !button.isValid) return;
    var onImage = findNode(button, "img_sz_kai");
    var offImage = findNode(button, "img_sz_guan") || findNode(button, "img_sz_guanbi") || findNode(button, "img_sz_off");
    var bar = findNode(button, "bar") || findNode(button, "bg") || findNode(button, "img_sz_di");
    var knob = findNode(button, "img_sz_dian");
    var switchRoot = knob && knob.parent && knob.parent.isValid ? knob.parent :
      (onImage && onImage.parent && onImage.parent.isValid ? onImage.parent : null);
    var baseW = 169;
    var baseH = 66;
    var knobSize = 56;
    var knobOnX = -50;
    var knobOffX = 50;
    button._restoreSwitchW = baseW;
    button._restoreSwitchH = baseH;
    var staleFixedRoot = findChild(button, "restoreSwitchFixedRoot");
    if (staleFixedRoot) staleFixedRoot.active = false;
    var staleBg = switchRoot && switchRoot.isValid ? findChild(switchRoot, "restoreSwitchBg") : null;
    var staleKnob = switchRoot && switchRoot.isValid ? findChild(switchRoot, "restoreSwitchFixedKnob") : null;
    if (staleBg) staleBg.active = false;
    if (staleKnob) staleKnob.active = false;
    switchRoot = switchRoot && switchRoot.isValid ? switchRoot : button;
    switchRoot.active = true;
    switchRoot.setScale && switchRoot.setScale(1);
    switchRoot.setContentSize && switchRoot.setContentSize(baseW, baseH);
    function normalizeSprite(node, visible, tint) {
      if (!node || !node.isValid) return;
      node.active = !!visible;
      node.opacity = 255;
      node.setScale && node.setScale(1);
      node.setPosition && node.setPosition(0, 0);
      node.setContentSize && node.setContentSize(baseW, baseH);
      if (tint) node.color = tint;
      node.zIndex = 1;
      node.setLocalZOrder && node.setLocalZOrder(1);
      var sprite = node.getComponent && node.getComponent(cc.Sprite);
      if (sprite) sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    }
    if (offImage) {
      normalizeSprite(onImage, enabled, cc.Color.WHITE);
      normalizeSprite(offImage, !enabled, cc.Color.WHITE);
    } else {
      normalizeSprite(onImage || bar, true, enabled ? cc.Color.WHITE : cc.color(150, 135, 170, 255));
      if (bar && bar !== onImage) normalizeSprite(bar, false);
    }
    if (knob) {
      knob.active = true;
      knob.opacity = 255;
      knob.setScale && knob.setScale(1);
      knob.setContentSize && knob.setContentSize(knobSize, knobSize);
      knob.setPosition && knob.setPosition(enabled ? knobOnX : knobOffX, 0);
      knob.zIndex = 2;
      knob.setLocalZOrder && knob.setLocalZOrder(2);
      var knobSprite = knob.getComponent && knob.getComponent(cc.Sprite);
      if (knobSprite) knobSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    }
  }

  function findSwitchButton(panel, directName, labelText, fallbackIndex) {
    var direct = findChild(panel, directName) || findNode(panel, directName);
    if (direct) return direct;
    var matches = [];
    function walk(node) {
      if (!node || !node.isValid) return;
      var label = node.getComponent && node.getComponent(cc.Label);
      if (label && label.string && label.string.indexOf(labelText) >= 0) {
        var p = node.parent;
        for (var i = 0; i < 4 && p && p.isValid; i++) {
          if (findNode(p, "img_sz_dian") || findNode(p, "img_sz_kai")) {
            matches.push(p);
            return;
          }
          p = p.parent;
        }
      }
      var children = node.children || [];
      for (var j = 0; j < children.length; j++) walk(children[j]);
    }
    walk(panel);
    if (matches.length > 0) return matches[0];
    var switches = [];
    function collect(node) {
      if (!node || !node.isValid) return;
      if (findNode(node, "img_sz_dian") && findNode(node, "img_sz_kai")) switches.push(node);
      var children = node.children || [];
      for (var i = 0; i < children.length; i++) collect(children[i]);
    }
    collect(panel);
    return switches[fallbackIndex] || null;
  }

  function getAudioTarget(globalData) {
    return globalData && globalData.platform && globalData.platform.audio;
  }

  function getRestoreSettings(globalData) {
    globalData._restoreSettings = globalData._restoreSettings || {};
    var settings = globalData._restoreSettings;
    var platform = globalData && globalData.platform;
    var audio = getAudioTarget(globalData);
    if (typeof settings.sound !== "boolean") {
      settings.sound = globalData._restoreSoundTouched && platform && typeof platform.enabledEffect === "boolean" ? !!platform.enabledEffect : true;
    }
    if (typeof settings.music !== "boolean") {
      settings.music = globalData._restoreMusicTouched && platform && typeof platform.enableMusic === "boolean" ? !!platform.enableMusic : true;
    }
    if (typeof settings.vibrate !== "boolean") {
      settings.vibrate = globalData._restoreVibrateTouched && platform && typeof platform.enabledShock === "boolean" ? !!platform.enabledShock : true;
    }
    return settings;
  }

  function persistRestoreSettings(globalData) {
    try {
      var settings = getRestoreSettings(globalData);
      var platform = globalData && globalData.platform;
      var audio = getAudioTarget(globalData);
      var oldMusic = platform && typeof platform.enableMusic === "boolean" ? platform.enableMusic :
        (audio && typeof audio._switch_music === "boolean" ? audio._switch_music : true);
      if (platform) {
        platform.enabledEffect = settings.sound;
        if (settings.music && !oldMusic) stopBackgroundMusic(audio);
        platform.enableMusic = settings.music;
        platform.enabledShock = settings.vibrate;
        platform.enableShock = settings.vibrate;
      }
      if (audio) {
        if (typeof audio.switchEffect !== "undefined") audio.switchEffect = settings.sound;
        if (!platform && typeof audio.switchMusic !== "undefined") audio.switchMusic = settings.music;
        audio._switch_effect = settings.sound;
        audio._switch_music = settings.music;
        audio.local_data = audio.local_data || {};
        audio.local_data.switch_effect = settings.sound;
        audio.local_data.switch_music = settings.music;
        if (typeof audio.saveData === "function") audio.saveData();
      }
      syncBackgroundMusic(globalData, oldMusic, !!platform);
      try {
        if (cc.sys && cc.sys.localStorage) {
          cc.sys.localStorage.removeItem("restore_setting_sound");
          cc.sys.localStorage.removeItem("restore_setting_music");
          cc.sys.localStorage.removeItem("restore_setting_vibrate");
        }
      } catch (err) {}
    } catch (err) {}
  }

  function stopBackgroundMusic(audio) {
    try {
      if (audio && audio.music !== undefined && cc.audioEngine && cc.audioEngine.stop) {
        cc.audioEngine.stop(audio.music);
        audio.music = null;
      }
    } catch (err) {}
    try {
      if (cc.audioEngine && cc.audioEngine.stopMusic) cc.audioEngine.stopMusic();
    } catch (err) {}
  }

  function syncBackgroundMusic(globalData, oldMusic, platformHandledMusic) {
    try {
      var settings = getRestoreSettings(globalData);
      var platform = globalData && globalData.platform;
      var audio = getAudioTarget(globalData);
      if (!settings.music) {
        stopBackgroundMusic(audio);
        return;
      }
      if (oldMusic === false) {
        if (platformHandledMusic) return;
        stopBackgroundMusic(audio);
        if (platform && typeof platform.playMusic === "function") platform.playMusic("ab:audio/bgm");
        else if (audio && typeof audio.playMusic === "function") audio.playMusic("ab:audio/bgm");
      }
    } catch (err) {}
  }

  function installInitialSettingStatePatch() {
    try {
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      if (!globalData || globalData._restoreSettingsInitialized) return;
      globalData._restoreSettingsInitialized = true;
      globalData._restoreSettings = globalData._restoreSettings || {};
      if (!globalData._restoreSoundTouched) globalData._restoreSettings.sound = true;
      if (!globalData._restoreMusicTouched) globalData._restoreSettings.music = true;
      if (!globalData._restoreVibrateTouched) globalData._restoreSettings.vibrate = true;
      persistRestoreSettings(globalData);
      setTimeout(function () {
        try {
          var scene = cc.director && cc.director.getScene && cc.director.getScene();
          var panel = findPanelWithChildren(scene, ["soundBtn", "musicBtn"]) ||
            findPanelWithChildren(scene, ["closeBtn", "soundBtn"]) ||
            findPanelWithChildren(scene, ["backBtn", "skipBtn", "soundBtn"]);
          applyPanelSwitchStates(panel);
        } catch (err) {}
      }, 0);
      console.log("restore initial settings on");
    } catch (err) {}
  }

  function applyPanelSwitchStates(panel) {
    if (!panel || !panel.isValid) return;
    try {
      var globals = getGameGlobals();
      var settings = getRestoreSettings(globals.globalData);
      updatePauseSwitchVisual(findSwitchButton(panel, "soundBtn", "\u97f3\u6548", 0), settings.sound);
      updatePauseSwitchVisual(findSwitchButton(panel, "musicBtn", "\u97f3\u4e50", 1), settings.music);
      updatePauseSwitchVisual(findSwitchButton(panel, "vibrateBtn", "\u9707\u52a8", 2), settings.vibrate);
    } catch (err) {}
  }

  function pauseToggleSwitch(name, button) {
    try {
      var globals = getGameGlobals();
      var globalData = globals.globalData;
      var settings = getRestoreSettings(globalData);
      if (name === "soundBtn") {
        globalData._restoreSoundTouched = true;
        settings.sound = !settings.sound;
      } else if (name === "musicBtn") {
        globalData._restoreMusicTouched = true;
        settings.music = !settings.music;
      } else if (name === "vibrateBtn") {
        globalData._restoreVibrateTouched = true;
        settings.vibrate = !settings.vibrate;
      }
      persistRestoreSettings(globalData);
      updatePauseSwitchVisual(button, name === "soundBtn" ? settings.sound : (name === "musicBtn" ? settings.music : settings.vibrate));
      console.log("restore pause switch", name, settings.sound, settings.music, settings.vibrate);
    } catch (err) {
      console.error("restore pause switch failed", name, err && err.message ? err.message : err);
    }
  }

  function closePanelById(uiIdName) {
    try {
      var globals = getGameGlobals();
      globals.globalData.platform && globals.globalData.platform.playEffect && globals.globalData.platform.playEffect("ab:audio/click");
      globals.globalData.gui.remove(globals.uiId[uiIdName]);
      console.log("restore panel close", uiIdName);
    } catch (err) {
      console.error("restore panel close failed", uiIdName, err && err.message ? err.message : err);
    }
  }

  function closePausePanel() {
    try {
      var globals = getGameGlobals();
      globals.globalData.platform && globals.globalData.platform.playEffect && globals.globalData.platform.playEffect("ab:audio/click");
      try {
        globals.globalData.gui.remove(globals.uiId.MemuPanel);
      } catch (err) {}
      try {
        var settings = getRestoreSettings(globals.globalData);
        if (settings.music) globals.globalData.platform && globals.globalData.platform.resumeAll && globals.globalData.platform.resumeAll();
        else stopBackgroundMusic(getAudioTarget(globals.globalData));
      } catch (err) {}
      try {
        cc.director && cc.director.resume && cc.director.resume();
      } catch (err) {}
      console.log("restore pause close");
    } catch (err) {
      console.error("restore pause close failed", err && err.message ? err.message : err);
    }
  }

  function openGamePausePanel() {
    try {
      var globals = getGameGlobals();
      globals.globalData.platform && globals.globalData.platform.playEffect && globals.globalData.platform.playEffect("ab:audio/click");
      globals.globalData.gui.open(globals.uiId.MemuPanel);
      scrubPausePanelSoon();
      console.log("restore game pause open");
    } catch (err) {
      console.error("restore game pause open failed", err && err.message ? err.message : err);
    }
  }

  function sanitizeHomeMenuPanel(scene) {
    if (!scene || !scene.isValid || !isHomeScene(scene)) return null;
    var panel = findPanelWithChildren(scene, ["closeBtn", "soundBtn", "musicBtn"]) ||
      findPanelWithChildren(scene, ["soundBtn", "musicBtn", "vibrateBtn"]);
    if (!panel || !panel.activeInHierarchy) return null;
    var backBtn = findChild(panel, "backBtn");
    var skipBtn = findChild(panel, "skipBtn");
    if (backBtn) {
      backBtn.active = false;
      backBtn.opacity = 0;
    }
    if (skipBtn) {
      skipBtn.active = false;
      skipBtn.opacity = 0;
    }
    applyPanelSwitchStates(panel);
    return panel;
  }

  function scrubHomeMenuPanelSoon() {
    var start = Date.now();
    var tick = function () {
      try {
        var scene = cc.director && cc.director.getScene && cc.director.getScene();
        var panel = sanitizeHomeMenuPanel(scene);
        if (panel) installMenuPanelPatch();
      } catch (err) {}
      if (Date.now() - start < 220) setTimeout(tick, 8);
    };
    tick();
  }

  function installHomeButtonPatch() {
    if (!GameGlobal.cc || !cc.director || !cc.director.getScene()) return;
    var scene = cc.director.getScene();
    if (!isHomeScene(scene)) return;

    var menuBtn = findNode(scene, "pauseBtn") || findNode(scene, "settingBtn") || findNode(scene, "setBtn");
    var rankBtn = findNode(scene, "rankBtn") || findNode(scene, "rank");
    var illustratedBtn = findNode(scene, "illustratedBtn") || findNode(scene, "illustrateBtn") || findNode(scene, "bookBtn");
    var shareBtn = findNode(scene, "shareBtn") || findNode(scene, "share");

    applyHomeSettingButtonLayout(menuBtn, rankBtn, shareBtn);
    applyHomeEntryButtonReplacement(rankBtn, "homeRankEntry");
    applyHomeEntryButtonReplacement(shareBtn, "homeShareEntry");
    ensureHomeColorModeButton(scene, rankBtn, shareBtn);
    installHideGameCirclePatch();

    if (menuBtn) addDeepTouch(menuBtn, "homeMenu", openMenuPanel);
    if (rankBtn) addDeepTouch(rankBtn, "homeRank", openRankPanel);
    if (illustratedBtn) addDeepTouch(illustratedBtn, "homeIllustrated", openIllustratedPanel);
    if (shareBtn) addDeepTouch(shareBtn, "homeShare", shareHome);

    if (!scene._restoreHomeButtonSystemTouch && cc.systemEvent && cc.SystemEvent && cc.SystemEvent.EventType) {
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, function (event) {
        var current = cc.director && cc.director.getScene && cc.director.getScene();
        if (!isHomeScene(current)) return;
        var point = event.getLocation && event.getLocation();
        if (!point) return;
        var menu = findNode(current, "pauseBtn") || findNode(current, "settingBtn") || findNode(current, "setBtn");
        var rank = findNode(current, "rankBtn") || findNode(current, "rank");
        var illustrated = findNode(current, "illustratedBtn") || findNode(current, "illustrateBtn") || findNode(current, "bookBtn");
        var share = findNode(current, "shareBtn") || findNode(current, "share");
        var colorMode = findNode(current, "restoreHomeColorModeBtn");
        var size = cc.winSize || cc.visibleRect && cc.visibleRect;
        var w = size && size.width || 750;
        var h = size && size.height || 1334;
        if (menu && pointInNodeTree(menu, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("homeMenu", openMenuPanel);
        } else if (colorMode && pointInNodeTree(colorMode, point)) {
          event.stopPropagation && event.stopPropagation();
          toggleHomeColorMode(colorMode);
        } else if (rank && pointInNodeTree(rank, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("homeRank", openRankPanel);
        } else if (illustrated && pointInNodeTree(illustrated, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("homeIllustrated", openIllustratedPanel);
        } else if (share && pointInNodeTree(share, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("homeShare", shareHome);
        } else if (point.x < w * 0.28 && point.y < h * 0.34) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("homeRank", openRankPanel);
        } else if (point.x > w * 0.70 && point.y < h * 0.38) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("homeIllustrated", openIllustratedPanel);
        }
      });
      scene._restoreHomeButtonSystemTouch = true;
      console.log("restore home buttons patch installed");
    }
  }

  function applyHomeSettingButtonLayout(menuBtn, rankBtn, shareBtn) {
    if (!menuBtn || !menuBtn.isValid) return;
    var widgets = menuBtn.getComponents && cc.Widget ? menuBtn.getComponents(cc.Widget) : null;
    if (widgets && widgets.length) {
      for (var i = 0; i < widgets.length; i++) {
        widgets[i].isAlignLeft = true;
        widgets[i].isAlignTop = true;
        widgets[i].isAlignRight = false;
        widgets[i].isAlignBottom = false;
        widgets[i].left = 88;
        widgets[i].top = 155;
        widgets[i].updateAlignment && widgets[i].updateAlignment();
      }
    } else {
      if (menuBtn.setPosition) menuBtn.setPosition(-405.5, 759);
      else {
        menuBtn.x = -405.5;
        menuBtn.y = 759;
      }
    }
  }

  function applyHomeEntryButtonReplacement(button, key) {
    if (!button || !button.isValid || !key) return;
    var w = button.width || 169;
    var h = button.height || 181;
    button.active = true;
    button.opacity = 255;
    button.setContentSize && button.setContentSize(w, h);
    button.setScale && button.setScale(1);
    hideNodeOwnSprite(button);
    var fallbackName = "restoreHomeEntryFallback_" + key;
    var iconName = "restoreHomeEntryIcon_" + key;
    ensureHomeEntryFallbackLayer(button, key, w, h);
    var icon = findChild(button, iconName);
    if (!icon) {
      icon = new cc.Node(iconName);
      icon.parent = button;
      icon.setAnchorPoint && icon.setAnchorPoint(0.5, 0.5);
    }
    icon.active = true;
    icon.opacity = 255;
    icon.setPosition && icon.setPosition(0, 0);
    icon.setContentSize && icon.setContentSize(w, h);
    icon.setScale && icon.setScale(1);
    icon.setLocalZOrder && icon.setLocalZOrder(1000);
    var sprite = icon.getComponent && icon.getComponent(cc.Sprite);
    if (!sprite && icon.addComponent) sprite = icon.addComponent(cc.Sprite);
    if (sprite) {
      sprite.enabled = true;
      sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    }
    var children = button.children || [];
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (!child || !child.isValid) continue;
      if (child.name === fallbackName) continue;
      if (child.name === iconName) continue;
      child.active = false;
      child.opacity = 0;
    }
    if (sprite) {
      loadUiReplacementFrame(key, function (frame) {
        if (icon && icon.isValid && sprite && frame) {
          clearNodeGraphics(icon);
          sprite.spriteFrame = frame;
          sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
          icon.setContentSize && icon.setContentSize(w, h);
          setHomeEntryFallbackVisible(button, key, false);
        } else {
          setHomeEntryFallbackVisible(button, key, true);
        }
      });
    }
  }

  function loadSpriteFrameInto(sprite, path, fallback) {
    if (!sprite || !path) return;
    var promise = loadAsset(path, cc.SpriteFrame);
    if (!promise || !promise.then) {
      if (fallback) fallback();
      return;
    }
    promise.then(function (frame) {
      if (sprite && sprite.node && sprite.node.isValid && frame) sprite.spriteFrame = frame;
    }).catch(function () {
      if (fallback) fallback();
    });
  }

  function getUiReplacementImagePath(key) {
    var fileName = null;
    if (key === "homeColorPure") fileName = "pure_mode_entry.png";
    else if (key === "homeColorMulti") fileName = "multi_mode_entry.png";
    else if (key === "homeRankEntry") fileName = "home_rank_entry.png";
    else if (key === "homeShareEntry") fileName = "home_share_entry.png";
    else if (key === "puzzleFrame") fileName = "puzzle_frame.png";
    if (!fileName) return null;
    return "subpackages/resources/ui_replacement_runtime/" + fileName;
  }

  function getUiReplacementDataUrl(key) {
    try {
      if (key !== "homeRankEntry" && key !== "homeShareEntry") return null;
      if (typeof GameGlobal !== "undefined" && (!GameGlobal._restoreUiReplacementData || !GameGlobal._restoreUiReplacementData.getBase64)) {
        try { require("./ui-replacement-data.js"); } catch (loadErr) {}
      }
      var repl = typeof GameGlobal !== "undefined" && GameGlobal._restoreUiReplacementData;
      return repl && repl.getBase64 ? repl.getBase64(key) : null;
    } catch (err) {
      return null;
    }
  }

  function loadUiReplacementFrame(key, callback) {
    if (!key) {
      callback && callback(null);
      return;
    }
    if (uiReplacementFrameCache[key]) {
      callback && callback(uiReplacementFrameCache[key]);
      return;
    }
    if (uiReplacementFrameLoading[key]) {
      if (callback) uiReplacementFrameLoading[key].push(callback);
      return;
    }
    uiReplacementFrameLoading[key] = callback ? [callback] : [];
    var dataUrl = getUiReplacementDataUrl(key);
    if ((key === "homeRankEntry" || key === "homeShareEntry") && !dataUrl) {
      var missingWaiters = uiReplacementFrameLoading[key] || [];
      delete uiReplacementFrameLoading[key];
      for (var missingIndex = 0; missingIndex < missingWaiters.length; missingIndex++) {
        try { missingWaiters[missingIndex](null); } catch (missingErr) {}
      }
      return;
    }
    var path = dataUrl || getUiReplacementImagePath(key);
    var paths = dataUrl ? [dataUrl] : (path ? [path, "./" + path, "/" + path] : []);
    loadRemoteTextureAsSpriteFrame(paths, 0, function (frame) {
      if (frame) uiReplacementFrameCache[key] = frame;
      var waiters = uiReplacementFrameLoading[key] || [];
      delete uiReplacementFrameLoading[key];
      for (var i = 0; i < waiters.length; i++) {
        try { waiters[i](frame || null); } catch (err) {}
      }
    });
  }

  function preloadHomeEntryReplacementFrames() {
    loadUiReplacementFrame("homeRankEntry");
    loadUiReplacementFrame("homeShareEntry");
  }

  function ensureHomeEntryFallbackLayer(button, key, width, height) {
    if (!button || !button.isValid) return null;
    var name = "restoreHomeEntryFallback_" + key;
    var layer = findChild(button, name);
    if (!layer) {
      layer = new cc.Node(name);
      layer.parent = button;
      layer.setAnchorPoint && layer.setAnchorPoint(0.5, 0.5);
    }
    layer.active = true;
    layer.opacity = 255;
    layer.setPosition && layer.setPosition(0, 0);
    layer.setContentSize && layer.setContentSize(width || button.width || 169, height || button.height || 181);
    layer.setScale && layer.setScale(1);
    layer.setLocalZOrder && layer.setLocalZOrder(999);
    drawHomeEntryFallback(layer, key);
    return layer;
  }

  function setHomeEntryFallbackVisible(button, key, visible) {
    var layer = findChild(button, "restoreHomeEntryFallback_" + key);
    if (!layer || !layer.isValid) return;
    layer.active = !!visible;
    layer.opacity = visible ? 255 : 0;
  }

  function drawHomeEntryFallback(icon, key) {
    if (!icon || !icon.isValid) return;
    var g = icon.getComponent(cc.Graphics) || icon.addComponent(cc.Graphics);
    g.clear && g.clear();
    var w = icon.width || 169;
    var h = icon.height || 181;
    var r = Math.min(w, h) * 0.44;
    g.lineWidth = 4;
    g.strokeColor = cc.color(102, 72, 38, 255);
    g.fillColor = key === "homeRankEntry" ? cc.color(255, 205, 74, 255) : cc.color(83, 178, 236, 255);
    g.circle(0, 0, r);
    g.fill();
    g.stroke();
    g.fillColor = cc.color(255, 255, 255, 255);
    if (key === "homeRankEntry") {
      g.rect(-r * 0.42, -r * 0.32, r * 0.24, r * 0.64);
      g.rect(-r * 0.12, -r * 0.12, r * 0.24, r * 0.44);
      g.rect(r * 0.18, -r * 0.50, r * 0.24, r);
      g.fill();
    } else {
      g.circle(-r * 0.18, r * 0.08, r * 0.18);
      g.circle(r * 0.18, r * 0.08, r * 0.18);
      g.circle(0, -r * 0.24, r * 0.22);
      g.fill();
    }
  }

  function applyUiReplacementSprite(sprite, key, width, height, fallback) {
    if (!sprite || !sprite.node || !sprite.node.isValid || !key) return;
    loadUiReplacementFrame(key, function (frame) {
      if (sprite && sprite.node && sprite.node.isValid && frame) {
        clearNodeGraphics(sprite.node);
        sprite.spriteFrame = frame;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        if (width && height && sprite.node.setContentSize) sprite.node.setContentSize(width, height);
      } else if (fallback) {
        fallback();
      }
    });
  }

  function loadHomeColorModeFrame(sprite, mode, fallback) {
    if (!sprite || !sprite.node || !sprite.node.isValid) return;
    var replacementKey = mode === "pure" ? "homeColorPure" : "homeColorMulti";
    applyUiReplacementSprite(sprite, replacementKey, sprite.node.width, sprite.node.height, function () {
      loadHomeColorModeFrameFromAsset(sprite, mode, fallback);
    });
  }

  function loadHomeColorModeFrameFromAsset(sprite, mode, fallback) {
    if (!sprite || !sprite.node || !sprite.node.isValid) return;
    var path = "ab:game/texture/game/" + (mode === "pure" ? "dsms" : "csms");
    if (homeColorModeFrameCache[path]) {
      clearNodeGraphics(sprite.node);
      sprite.spriteFrame = homeColorModeFrameCache[path];
      return;
    }
    if (homeColorModeFrameLoading[path]) {
      homeColorModeFrameLoading[path].push({ sprite: sprite, mode: mode, fallback: fallback });
      return;
    }
    homeColorModeFrameLoading[path] = [{ sprite: sprite, mode: mode, fallback: fallback }];
    var promise = loadAsset(path, cc.SpriteFrame);
    if (!promise || !promise.then) {
      delete homeColorModeFrameLoading[path];
      if (fallback) fallback();
      return;
    }
    promise.then(function (frame) {
      if (frame) homeColorModeFrameCache[path] = frame;
      var waiters = homeColorModeFrameLoading[path] || [];
      delete homeColorModeFrameLoading[path];
      for (var i = 0; i < waiters.length; i++) {
        var waiter = waiters[i];
        if (waiter.sprite && waiter.sprite.node && waiter.sprite.node.isValid && frame) {
          clearNodeGraphics(waiter.sprite.node);
          waiter.sprite.spriteFrame = frame;
        }
      }
    }).catch(function () {
      var waiters = homeColorModeFrameLoading[path] || [];
      delete homeColorModeFrameLoading[path];
      for (var i = 0; i < waiters.length; i++) {
        if (waiters[i].fallback) waiters[i].fallback();
      }
    });
  }

  function drawModeFallbackIcon(node, mode) {
    if (!node || !node.isValid) return;
    node.removeAllChildren && node.removeAllChildren();
    var g = node.getComponent(cc.Graphics) || node.addComponent(cc.Graphics);
    g.clear && g.clear();
    g.lineWidth = 4;
    g.strokeColor = cc.color(83, 65, 48, 255);
    g.fillColor = mode === "pure" ? cc.color(255, 229, 86, 255) : cc.color(93, 177, 245, 255);
    g.circle(0, 0, 27);
    g.fill();
    g.stroke();
    if (mode !== "pure") {
      g.fillColor = cc.color(255, 105, 116, 255);
      g.circle(-10, 8, 8);
      g.fill();
      g.fillColor = cc.color(86, 205, 112, 255);
      g.circle(10, 8, 8);
      g.fill();
      g.fillColor = cc.color(255, 221, 91, 255);
      g.circle(0, -9, 8);
      g.fill();
    }
  }

  function ensureHomeColorModeFallbackLayer(button, mode) {
    if (!button || !button.isValid) return null;
    var layer = findChild(button, "restoreColorModeFallbackIcon");
    if (!layer) {
      layer = new cc.Node("restoreColorModeFallbackIcon");
      layer.parent = button;
      layer.setAnchorPoint && layer.setAnchorPoint(0.5, 0.5);
    }
    layer.active = true;
    layer.opacity = 255;
    layer.setPosition && layer.setPosition(0, 0);
    layer.setScale && layer.setScale(1);
    layer.setContentSize && layer.setContentSize(button.width > 0 ? button.width : 169, button.height > 0 ? button.height : 181);
    layer.setLocalZOrder && layer.setLocalZOrder(1001);
    drawModeFallbackIcon(layer, mode);
    return layer;
  }

  function setHomeColorModeFallbackVisible(button, visible) {
    var layer = findChild(button, "restoreColorModeFallbackIcon");
    if (!layer || !layer.isValid) return;
    layer.active = !!visible;
    layer.opacity = visible ? 255 : 0;
  }

  function fixHomeColorModeLabel(labelNode, mode) {
    var label = labelNode && labelNode.getComponent && labelNode.getComponent(cc.Label);
    if (label) {
      label.string = mode === "pure" ? "\u7eaf\u8272" : "\u591a\u5f69";
      label.fontSize = 32;
      label.lineHeight = 36;
      label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
      label.verticalAlign = cc.Label.VerticalAlign.CENTER;
    }
    if (labelNode) labelNode.color = cc.Color.WHITE;
  }

  function updateHomeColorModeButton(button) {
    if (!button || !button.isValid) return;
    button.active = true;
    button.opacity = 255;
    button.setLocalZOrder && button.setLocalZOrder(1000);
    var mode = getHomeColorMode();
    ensureHomeColorModeFallbackLayer(button, mode);
    var icon = findChild(button, "restoreColorModeIcon");
    var labelNode = findChild(button, "restoreColorModeLabel");
    if (icon) {
      icon.active = true;
      icon.opacity = 255;
      icon.setLocalZOrder && icon.setLocalZOrder(1002);
      var visualSize = getHomeColorModeVisualSize(button, mode);
      icon.setContentSize && icon.setContentSize(visualSize.width, visualSize.height);
      icon.setScale && icon.setScale(1);
      var sprite = icon.getComponent && icon.getComponent(cc.Sprite);
      if (sprite) {
        setHomeColorModeFallbackVisible(button, !sprite.spriteFrame);
        loadHomeColorModeFrame(sprite, mode, function () {
          ensureHomeColorModeFallbackLayer(button, mode);
        });
        setTimeout(function () {
          if (sprite && sprite.node && sprite.node.isValid) setHomeColorModeFallbackVisible(button, !sprite.spriteFrame);
        }, 0);
        setTimeout(function () {
          if (sprite && sprite.node && sprite.node.isValid) setHomeColorModeFallbackVisible(button, !sprite.spriteFrame);
        }, 120);
      } else {
        ensureHomeColorModeFallbackLayer(button, mode);
      }
    }
    if (labelNode) {
      labelNode.active = false;
      labelNode.opacity = 0;
    }
  }

  function getHomeButtonReferenceSize(rankBtn, shareBtn) {
    var refW = rankBtn && rankBtn.isValid && rankBtn.width > 0 ? rankBtn.width : 0;
    var refH = rankBtn && rankBtn.isValid && rankBtn.height > 0 ? rankBtn.height : 0;
    if ((!refW || !refH) && shareBtn && shareBtn.isValid) {
      refW = shareBtn.width || refW;
      refH = shareBtn.height || refH;
    }
    return {
      width: refW || 169,
      height: refH || 181
    };
  }

  function getHomeColorModeVisualSize(button, mode) {
    var w = button && button.width > 0 ? button.width : 169;
    var h = button && button.height > 0 ? button.height : 181;
    return {
      width: w,
      height: h
    };
  }

  function fitHomeColorModeButtonToReference(button, rankBtn, shareBtn) {
    if (!button || !button.isValid || !rankBtn || !rankBtn.isValid || !shareBtn || !shareBtn.isValid) return;
    var refSize = getHomeButtonReferenceSize(rankBtn, shareBtn);
    button.setAnchorPoint && button.setAnchorPoint(0.5, 0.5);
    button.setContentSize && button.setContentSize(refSize.width, refSize.height);
    button.setScale && button.setScale(1);
    if (button.setPosition) {
      if (button.parent && rankBtn.parent && shareBtn.parent && button.parent !== rankBtn.parent && button.parent.convertToNodeSpaceAR && rankBtn.parent.convertToWorldSpaceAR) {
        var rankWorld = rankBtn.parent.convertToWorldSpaceAR(rankBtn.position || cc.v2(rankBtn.x, rankBtn.y));
        var shareWorld = shareBtn.parent.convertToWorldSpaceAR(shareBtn.position || cc.v2(shareBtn.x, shareBtn.y));
        var localX = button.parent.convertToNodeSpaceAR(rankWorld);
        var localY = button.parent.convertToNodeSpaceAR(shareWorld);
        button.setPosition(localX.x, localY.y);
      } else {
        button.setPosition(rankBtn.x, shareBtn.y);
      }
    }

    var icon = findChild(button, "restoreColorModeIcon");
    if (icon) {
      icon.setPosition && icon.setPosition(0, 0);
      var visualSize = getHomeColorModeVisualSize(button, getHomeColorMode());
      icon.setContentSize && icon.setContentSize(visualSize.width, visualSize.height);
      icon.setScale && icon.setScale(1);
    }
    var labelNode = findChild(button, "restoreColorModeLabel");
    if (labelNode) {
      labelNode.active = false;
      labelNode.opacity = 0;
    }
  }

  function applyHomeColorMode() {
    var mode = getHomeColorMode();
    try {
      var scene = cc.director && cc.director.getScene && cc.director.getScene();
      if (mode === "pure") {
        forcePureSheepMode();
        clearReplacementAnimalSpriteNodes(scene);
      } else {
        restoreOriginalAnimalUi(scene);
        emitChangeSkin();
        restoreAnimalNodes(scene);
        if (scene && !isHomeScene(scene)) console.log("restore runtime animal components", scene && scene.name, refreshExistingAnimalSkins(scene, true) || 0);
        refreshGameColorModeSoon();
      }
      console.log("restore home color mode", mode);
    } catch (err) {
      console.error("restore home color mode failed", err && err.message ? err.message : err);
    }
  }

  function toggleHomeColorMode(button) {
    var now = Date.now();
    if (now - homeColorModeToggleTime < 500) return;
    homeColorModeToggleTime = now;
    setHomeColorMode(getHomeColorMode() === "pure" ? "multi" : "pure");
    updateHomeColorModeButton(button);
    applyHomeColorMode();
  }

  function getHomeColorModeButtonParent(scene, rankBtn, shareBtn) {
    var parent = rankBtn && rankBtn.isValid && rankBtn.parent && rankBtn.parent.isValid ? rankBtn.parent : null;
    if (!parent && shareBtn && shareBtn.isValid && shareBtn.parent && shareBtn.parent.isValid) parent = shareBtn.parent;
    if (parent && parent.activeInHierarchy) return parent;
    var canvasNode = cc.Canvas && cc.Canvas.instance && cc.Canvas.instance.node;
    if (canvasNode && canvasNode.isValid && canvasNode.activeInHierarchy) return canvasNode;
    return scene;
  }

  function ensureHomeColorModeButton(scene, rankBtn, shareBtn) {
    if (!scene || !scene.isValid || !rankBtn || !rankBtn.isValid || !shareBtn || !shareBtn.isValid) return;
    var button = findChild(scene, "restoreHomeColorModeBtn") || findNode(scene, "restoreHomeColorModeBtn");
    if (!button) {
      var refSize = getHomeButtonReferenceSize(rankBtn, shareBtn);
      button = findNode(scene, "clubBtn");
      if (button && button.isValid) {
        button._restoreHomeColorModeSource = true;
        button.name = "restoreHomeColorModeBtn";
        button.active = true;
        button.opacity = 255;
        if (button.resumeSystemEvents) button.resumeSystemEvents(true);
        hideNodeOwnSprite(button);
      } else {
        button = new cc.Node("restoreHomeColorModeBtn");
        button.parent = getHomeColorModeButtonParent(scene, rankBtn, shareBtn);
      }
      button.setAnchorPoint && button.setAnchorPoint(0.5, 0.5);
      button.setContentSize(refSize.width, refSize.height);

      var icon = findChild(button, "restoreColorModeIcon");
      if (!icon) {
        icon = new cc.Node("restoreColorModeIcon");
        icon.parent = button;
      }
      icon.setContentSize(refSize.width, refSize.height);
      icon.setPosition(0, 0);
      var sprite = icon.getComponent && icon.getComponent(cc.Sprite);
      if (!sprite && icon.addComponent) sprite = icon.addComponent(cc.Sprite);
      if (sprite) sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    }
    var safeParent = getHomeColorModeButtonParent(scene, rankBtn, shareBtn);
    if (safeParent && safeParent.isValid && (!button.parent || !button.parent.isValid || !button.parent.activeInHierarchy)) {
      button.parent = safeParent;
    }
    button.active = true;
    button.opacity = 255;
    if (button.resumeSystemEvents) button.resumeSystemEvents(true);
    button.setLocalZOrder && button.setLocalZOrder(1000);
    fitHomeColorModeButtonToReference(button, rankBtn, shareBtn);
    var colorIcon = findChild(button, "restoreColorModeIcon");
    if (colorIcon && colorIcon.isValid) {
      colorIcon.active = true;
      colorIcon.opacity = 255;
      colorIcon.setLocalZOrder && colorIcon.setLocalZOrder(1000);
    }
    updateHomeColorModeButton(button);
    var children = button.children || [];
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (!child || !child.isValid || child.name === "restoreColorModeIcon" || child.name === "restoreColorModeFallbackIcon") continue;
      child.active = false;
      child.opacity = 0;
    }
    if (!button._restoreColorModeTouch) {
      button.on(cc.Node.EventType.TOUCH_END, function (event) {
        event.stopPropagation && event.stopPropagation();
        toggleHomeColorMode(button);
      });
      button._restoreColorModeTouch = true;
    }
  }

  function updateGameColorModeButton(button) {
    if (!button || !button.isValid) return;
    keepNodeVisibleForTouch(button);
    hideNodeOwnSprite(button);
    button.setContentSize && button.setContentSize(button.width > 0 ? button.width : 96, button.height > 0 ? button.height : 96);
    button.setScale && button.setScale(1);
    var mode = getHomeColorMode();
    var spriteNode = findChild(button, "restoreGameColorModeIcon");
    if (!spriteNode) {
      spriteNode = new cc.Node("restoreGameColorModeIcon");
      spriteNode.parent = button;
      spriteNode.setAnchorPoint && spriteNode.setAnchorPoint(0.5, 0.5);
      spriteNode.setPosition && spriteNode.setPosition(0, 0);
    }
    spriteNode.active = true;
    spriteNode.opacity = 255;
    spriteNode.setLocalZOrder && spriteNode.setLocalZOrder(998);
    spriteNode.setContentSize && spriteNode.setContentSize(button.width > 0 ? button.width : 96, button.height > 0 ? button.height : 96);
    var children = button.children || [];
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (!child || !child.isValid || child === spriteNode || child.name === "restoreGameColorModeHitProxy") continue;
      child.active = false;
      child.opacity = 0;
    }
    var sprite = spriteNode.getComponent && spriteNode.getComponent(cc.Sprite);
    if (!sprite && spriteNode.addComponent) sprite = spriteNode.addComponent(cc.Sprite);
    if (sprite) {
      sprite.enabled = true;
      sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
      if (!sprite.spriteFrame) drawModeFallbackIcon(spriteNode, mode);
      loadHomeColorModeFrame(sprite, mode, function () {
        drawModeFallbackIcon(spriteNode, mode);
      });
    } else {
      drawModeFallbackIcon(spriteNode, mode);
    }
  }

  function toggleGameColorMode(button) {
    var now = Date.now();
    if (now - homeColorModeToggleTime < 500) return;
    homeColorModeToggleTime = now;
    setHomeColorMode(getHomeColorMode() === "pure" ? "multi" : "pure");
    updateGameColorModeButton(button);
    applyHomeColorMode();
  }

  function ensureGameColorModeHitProxy(button) {
    if (!button || !button.isValid || button.name !== "skinBtn") return button;
    var proxy = findChild(button, "restoreGameColorModeHitProxy");
    if (!proxy) {
      proxy = new cc.Node("restoreGameColorModeHitProxy");
      proxy.parent = button;
      proxy.setAnchorPoint && proxy.setAnchorPoint(0.5, 0.5);
      proxy.setPosition && proxy.setPosition(0, 0);
      if (cc.BlockInputEvents && proxy.addComponent) proxy.addComponent(cc.BlockInputEvents);
    }
    proxy.active = true;
    proxy.opacity = 1;
    proxy.setLocalZOrder && proxy.setLocalZOrder(9999);
    proxy.setContentSize && proxy.setContentSize(button.width > 0 ? button.width : 96, button.height > 0 ? button.height : 96);
    if (!proxy._restoreGameColorModeTouch) {
      proxy.on(cc.Node.EventType.TOUCH_END, function (event) {
        event.stopPropagation && event.stopPropagation();
        toggleGameColorMode(button);
      });
      proxy._restoreGameColorModeTouch = true;
    }
    return proxy;
  }

  function ensureGameColorModeButton(scene) {
    if (!scene || !scene.isValid || isHomeScene(scene)) return;
    var gamePanel = findPanelWithChildren(scene, ["btnNode", "pauseBtn"]) || findPanelWithChildren(scene, ["btnNode", "catchBtn"]);
    var button = findNode(scene, "skinBtn") || findNode(scene, "restoreGameColorModeBtn");
    if (!button) {
      button = new cc.Node("restoreGameColorModeBtn");
      button.parent = gamePanel || scene;
      button.setAnchorPoint && button.setAnchorPoint(0.5, 0.5);
      button.setContentSize && button.setContentSize(96, 96);
      var icon = new cc.Node("restoreGameColorModeIcon");
      icon.parent = button;
      icon.setPosition && icon.setPosition(0, 0);
      icon.setContentSize && icon.setContentSize(96, 96);
      var iconSprite = icon.addComponent && icon.addComponent(cc.Sprite);
      if (iconSprite) iconSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    }
    if (button.name !== "skinBtn") button.name = "restoreGameColorModeBtn";
    if (!button.parent) button.parent = gamePanel || scene;
    if (button.setPosition && button.name === "restoreGameColorModeBtn") {
      var size = cc.winSize || {};
      var w = size.width || 750;
      var h = size.height || 1334;
      button.setPosition(-w * 0.5 + 62, h * 0.5 - 168);
    }
    button.setLocalZOrder && button.setLocalZOrder(999);
    updateGameColorModeButton(button);
    var touchTarget = ensureGameColorModeHitProxy(button);
    if (touchTarget === button && !button._restoreGameColorModeTouch) {
      button.on(cc.Node.EventType.TOUCH_END, function (event) {
        event.stopPropagation && event.stopPropagation();
        toggleGameColorMode(button);
      });
      button._restoreGameColorModeTouch = true;
    }
  }

  function installStartPatch() {
    if (!GameGlobal.cc || !cc.director || !cc.director.getScene()) return;
    var scene = cc.director.getScene();
    var startBtn = findNode(scene, "startBtn");
    if (!startBtn || !startBtn.isValid) return;
    if (patchedStartBtn === startBtn && startBtn._restoreStartPatch) return;

    patchedStartBtn = startBtn;
    startBtn._restoreStartPatch = true;
    restoreStartButtonAnimation(startBtn);
    console.log("restore root start patch installed", startBtn.width, startBtn.height);

    startBtn.on(cc.Node.EventType.TOUCH_END, function (event) {
      event.stopPropagation && event.stopPropagation();
      openGamePanel();
    });

    if (cc.systemEvent && cc.SystemEvent && cc.SystemEvent.EventType) {
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, function (event) {
        var point = event.getLocation && event.getLocation();
        if (point && startBtn.isValid && startBtn.getBoundingBoxToWorld().contains(point)) {
          event.stopPropagation && event.stopPropagation();
          openGamePanel();
        }
      });
    }
  }

  function installHomePuzzlePatch() {
    if (!GameGlobal.cc || !cc.director || !cc.director.getScene()) return;
    var scene = cc.director.getScene();
    var puzzleFrame = findNode(scene, "img_huakuang") || findNode(scene, "puzzle");
    if (!puzzleFrame || !puzzleFrame.isValid) return;
    if (puzzleFrame._restorePuzzlePatch) return;

    puzzleFrame._restorePuzzlePatch = true;
    applyPuzzleFrameReplacement(scene);
    addDeepTouch(puzzleFrame, "homePuzzle", openPuzzlePanel);
    refreshHomePuzzlePreview(scene, true);
    console.log("restore home puzzle patch installed", puzzleFrame.width, puzzleFrame.height);

    if (cc.systemEvent && cc.SystemEvent && cc.SystemEvent.EventType) {
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, function (event) {
        var point = event.getLocation && event.getLocation();
        if (point && puzzleFrame.isValid && pointInNodeTree(puzzleFrame, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("homePuzzle", openPuzzlePanel);
        }
      });
    }
  }

  function installPuzzleRewardPatch() {
    if (!GameGlobal.cc || !cc.director || !cc.director.getScene()) return;
    try {
      var globals = getGameGlobals();
      ensurePuzzleUserData(globals.globalData);
    } catch (err) {}

    var scene = cc.director.getScene();
    hideHomePuzzlePreviewOutsideHome(scene);
    refreshHomePuzzlePreview(scene);
    refreshPuzzlePanelBlockLabel(scene);
    var puzzlePanel = getPuzzlePanel(scene);
    cleanupPuzzleButtonProxies(puzzlePanel);
    if (puzzlePanel && puzzlePanel.activeInHierarchy) {
      refreshPuzzlePanelToCurrent(puzzlePanel, true);
      installPuzzlePanelComponentButtons(puzzlePanel);
    } else {
      hidePuzzleButtonProxy();
    }
    var resultPanel = findPanelWithChildren(scene, ["nextBtn", "puzzleBtn", "selfRankItem"]);
    if (resultPanel && resultPanel.activeInHierarchy) {
      awardPuzzleBlocks("result");
      installResultNextPatch(resultPanel);
    }
  }

  function installGamePropPatch() {
    if (!GameGlobal.cc || !cc.director || !cc.director.getScene()) return;
    var scene = cc.director.getScene();
    hideHomePuzzlePreviewOutsideHome(scene);
    var pauseBtn = findNode(scene, "pauseBtn");
    var catchBtn = findNode(scene, "catchBtn");
    var shuffleBtn = findNode(scene, "shuffleBtn");
    var flipBtn = findNode(scene, "flipBtn");
    normalizeGamePropButtons(scene);
    ensureGameColorModeButton(scene);

    if (pauseBtn) addDeepTouch(pauseBtn, "gamePause", openGamePausePanel);
    if (catchBtn) installHitArea(catchBtn, "catchBtn", function () { useGameProp("catchBtn"); });
    if (shuffleBtn) installHitArea(shuffleBtn, "shuffleBtn", function () { useGameProp("shuffleBtn"); });
    if (flipBtn) installHitArea(flipBtn, "flipBtn", function () { useGameProp("flipBtn"); });
  }

  function scrubPausePanelSoon() {
    var start = Date.now();
    var tick = function () {
      try { installPausePanelPatch(); } catch (err) {}
      if (Date.now() - start < 220) setTimeout(tick, 8);
    };
    tick();
  }

  function installPausePanelPatch() {
    if (!GameGlobal.cc || !cc.director || !cc.director.getScene()) return;
    var scene = cc.director.getScene();
    if (isHomeScene(scene)) return;
    var panel = findPanelWithChildren(scene, ["closeBtn", "backBtn", "skipBtn", "soundBtn"]);
    if (!panel || !panel.activeInHierarchy) return;

    var closeBtn = findChild(panel, "closeBtn") || findChild(panel, "btnClose");
    var backBtn = findChild(panel, "backBtn");
    var skipBtn = findChild(panel, "skipBtn");
    var soundBtn = findSwitchButton(panel, "soundBtn", "\u97f3\u6548", 0);
    var musicBtn = findSwitchButton(panel, "musicBtn", "\u97f3\u4e50", 1);
    var vibrateBtn = findSwitchButton(panel, "vibrateBtn", "\u9707\u52a8", 2);

    applyPanelSwitchStates(panel);
    if (closeBtn) addDeepTouch(closeBtn, "pauseClose", closePausePanel);
    if (backBtn) addDeepTouch(backBtn, "backBtn", pauseBackHome);
    if (skipBtn) addDeepTouch(skipBtn, "skipBtn", pauseSkipLevel);
    if (soundBtn) addDeepTouch(soundBtn, "soundBtn", function () { pauseToggleSwitch("soundBtn", soundBtn); });
    if (musicBtn) addDeepTouch(musicBtn, "musicBtn", function () { pauseToggleSwitch("musicBtn", musicBtn); });
    if (vibrateBtn) addDeepTouch(vibrateBtn, "vibrateBtn", function () { pauseToggleSwitch("vibrateBtn", vibrateBtn); });

    if (!panel._restorePauseSystemTouch && cc.systemEvent && cc.SystemEvent && cc.SystemEvent.EventType) {
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, function (event) {
        var point = event.getLocation && event.getLocation();
        var panelBox = panel.getBoundingBoxToWorld && panel.getBoundingBoxToWorld();
        var inTopRight = panelBox && point && point.x > panelBox.x + panelBox.width * 0.82 && point.y > panelBox.y + panelBox.height * 0.82;
        if ((closeBtn && pointInNodeTree(closeBtn, point)) || inTopRight) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("pauseClose", closePausePanel);
        } else if (backBtn && pointInNodeTree(backBtn, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("backBtn", pauseBackHome);
        } else if (skipBtn && pointInNodeTree(skipBtn, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("skipBtn", pauseSkipLevel);
        } else if (soundBtn && pointInNodeTree(soundBtn, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("soundBtn", function () { pauseToggleSwitch("soundBtn", soundBtn); });
        } else if (musicBtn && pointInNodeTree(musicBtn, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("musicBtn", function () { pauseToggleSwitch("musicBtn", musicBtn); });
        } else if (vibrateBtn && pointInNodeTree(vibrateBtn, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("vibrateBtn", function () { pauseToggleSwitch("vibrateBtn", vibrateBtn); });
        }
      });
      panel._restorePauseSystemTouch = true;
      console.log("restore pause panel patch installed");
    }
  }

  function installMenuPanelPatch() {
    if (!GameGlobal.cc || !cc.director || !cc.director.getScene()) return;
    var scene = cc.director.getScene();
    if (!isHomeScene(scene)) return;
    var panel = sanitizeHomeMenuPanel(scene);
    if (!panel) return;

    var closeBtn = findChild(panel, "closeBtn") || findChild(panel, "btnClose");
    var soundBtn = findSwitchButton(panel, "soundBtn", "\u97f3\u6548", 0);
    var musicBtn = findSwitchButton(panel, "musicBtn", "\u97f3\u4e50", 1);
    var vibrateBtn = findSwitchButton(panel, "vibrateBtn", "\u9707\u52a8", 2);

    applyPanelSwitchStates(panel);
    if (closeBtn) addDeepTouch(closeBtn, "menuClose", function () { closePanelById("MemuPanel"); });
    if (soundBtn) addDeepTouch(soundBtn, "menuSound", function () { pauseToggleSwitch("soundBtn", soundBtn); });
    if (musicBtn) addDeepTouch(musicBtn, "menuMusic", function () { pauseToggleSwitch("musicBtn", musicBtn); });
    if (vibrateBtn) addDeepTouch(vibrateBtn, "menuVibrate", function () { pauseToggleSwitch("vibrateBtn", vibrateBtn); });

    if (!panel._restoreMenuSystemTouch && cc.systemEvent && cc.SystemEvent && cc.SystemEvent.EventType) {
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, function (event) {
        if (!panel.isValid || !panel.activeInHierarchy) return;
        var point = event.getLocation && event.getLocation();
        var panelBox = panel.getBoundingBoxToWorld && panel.getBoundingBoxToWorld();
        var inTopRight = panelBox && point && point.x > panelBox.x + panelBox.width * 0.82 && point.y > panelBox.y + panelBox.height * 0.82;
        if ((closeBtn && pointInNodeTree(closeBtn, point)) || inTopRight) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("menuClose", function () { closePanelById("MemuPanel"); });
        } else if (soundBtn && pointInNodeTree(soundBtn, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("menuSound", function () { pauseToggleSwitch("soundBtn", soundBtn); });
        } else if (musicBtn && pointInNodeTree(musicBtn, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("menuMusic", function () { pauseToggleSwitch("musicBtn", musicBtn); });
        } else if (vibrateBtn && pointInNodeTree(vibrateBtn, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("menuVibrate", function () { pauseToggleSwitch("vibrateBtn", vibrateBtn); });
        }
      });
      panel._restoreMenuSystemTouch = true;
      console.log("restore menu panel patch installed");
    }
  }

  function isRankPanelNode(panel) {
    if (!panel || !panel.isValid || !panel.activeInHierarchy) return false;
    if (findNode(panel, "collectLab") || findNode(panel, "restoreIllustratedLayer") || findNode(panel, "restoreIllustratedItem")) return false;
    var hasWorldButton = findNode(panel, "worldBtn") || findNode(panel, "restoreWorldRankBtn");
    var hasFriendButton = findNode(panel, "friendBtn") || findNode(panel, "restoreFriendRankBtn");
    var hasRankBody = findNode(panel, "selfRankItem") || findNode(panel, "subContext");
    return !!(hasRankBody && hasWorldButton && hasFriendButton);
  }

  function findRankPanel(scene) {
    var candidates = [
      findPanelWithChildren(scene, ["closeBtn", "selfRankItem", "worldBtn"]),
      findPanelWithChildren(scene, ["closeBtn", "selfRankItem", "friendBtn"]),
      findPanelWithChildren(scene, ["backBtn", "selfRankItem", "worldBtn"]),
      findPanelWithChildren(scene, ["closeBtn", "subContext", "worldBtn"]),
      findPanelWithChildren(scene, ["closeBtn", "restoreWorldRankBtn", "restoreFriendRankBtn"])
    ];
    for (var i = 0; i < candidates.length; i++) {
      if (isRankPanelNode(candidates[i])) return candidates[i];
    }
    return null;
  }

  function clearRankFallbackArtifacts(panel) {
    if (!panel || !panel.isValid) return;
    ["restoreRankLayer", "restoreRankSelfBar", "restoreRankTabs"].forEach(function (name) {
      var node = findChild(panel, name) || findNode(panel, name);
      if (!node || !node.isValid) return;
      if (node.destroy) node.destroy();
      else if (node.removeFromParent) node.removeFromParent();
    });
    panel._restoreRankKey = "";
    panel._restoreRankRendered = false;
    panel._restoreRankWheelInstalled = false;
  }

  function installRankPanelPatch() {
    if (!GameGlobal.cc || !cc.director || !cc.director.getScene()) return;
    var scene = cc.director.getScene();
    var panel = findRankPanel(scene);
    if (!panel || !panel.activeInHierarchy) return;

    var closeBtn = findChild(panel, "closeBtn") || findChild(panel, "backBtn");
    var shareBtn = findChild(panel, "shareBtn");
    if (closeBtn) addDeepTouch(closeBtn, "rankClose", function () { closePanelById("RankPanel"); });
    if (shareBtn) addDeepTouch(shareBtn, "rankShare", function () {
      try {
        var globals = getGameGlobals();
        globals.globalData.platform && globals.globalData.platform.share && globals.globalData.platform.share(null);
      } catch (err) {}
    });

    ensureRankTabs(panel);
    renderRankFallback(panel);

    if (!panel._restoreRankSystemTouch && cc.systemEvent && cc.SystemEvent && cc.SystemEvent.EventType) {
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, function (event) {
        if (!panel.isValid || !panel.activeInHierarchy) return;
        var point = event.getLocation && event.getLocation();
        var worldBtn = findNode(panel, "restoreWorldRankBtn");
        var friendBtn = findNode(panel, "restoreFriendRankBtn");
        if (closeBtn && pointInNodeTree(closeBtn, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("rankClose", function () { closePanelById("RankPanel"); });
        } else if (shareBtn && pointInNodeTree(shareBtn, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("rankShare", function () {
            try {
              var globals = getGameGlobals();
              globals.globalData.platform && globals.globalData.platform.share && globals.globalData.platform.share(null);
            } catch (err) {}
          });
        } else if (worldBtn && pointInNodeTree(worldBtn, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("rankWorld", function () {
            panel._restoreRankMode = "world";
            panel._restoreRankKey = "";
            ensureRankTabs(panel);
            renderRankFallback(panel);
          });
        } else if (friendBtn && pointInNodeTree(friendBtn, point)) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("rankFriend", function () {
            panel._restoreRankMode = "friend";
            panel._restoreRankKey = "";
            ensureRankTabs(panel);
            renderRankFallback(panel);
          });
        }
      });
      panel._restoreRankSystemTouch = true;
      console.log("restore rank panel patch installed");
    }
  }

  function ensureRankTabs(panel) {
    if (!panel || !panel.isValid) return;
    if (!panel._restoreRankMode) panel._restoreRankMode = "world";
    var oldTabs = findChild(panel, "restoreRankTabs");
    if (oldTabs) oldTabs.active = false;
    var originalWorld = findChild(panel, "worldBtn") || findNode(panel, "worldBtn");
    var originalFriend = findChild(panel, "friendBtn") || findNode(panel, "friendBtn");
    if (originalWorld) {
      originalWorld.active = true;
      originalWorld.opacity = panel._restoreRankMode === "world" ? 255 : 170;
      addDeepTouch(originalWorld, "rankWorldOriginal", function () {
        panel._restoreRankMode = "world";
        panel._restoreRankKey = "";
        ensureRankTabs(panel);
        renderRankFallback(panel);
      });
    }
    if (originalFriend) {
      originalFriend.active = true;
      originalFriend.opacity = panel._restoreRankMode === "friend" ? 255 : 170;
      addDeepTouch(originalFriend, "rankFriendOriginal", function () {
        panel._restoreRankMode = "friend";
        panel._restoreRankKey = "";
        ensureRankTabs(panel);
        renderRankFallback(panel);
      });
    }
    return;
    var tabs = findChild(panel, "restoreRankTabs");
    if (!tabs) {
      tabs = new cc.Node("restoreRankTabs");
      tabs.parent = panel;
      tabs.setContentSize(360, 58);
      tabs.setPosition(0, -(panel.height || 900) / 2 + 72);
      tabs.zIndex = 25;
      tabs.setLocalZOrder && tabs.setLocalZOrder(25);

      var worldBtn = makeSpriteBox(tabs, -92, 0, 156, 50, cc.color(55, 132, 214, 255));
      worldBtn.name = "restoreWorldRankBtn";
      makeLabel(worldBtn, "\u4e16\u754c\u699c", 26, cc.color(255, 255, 255, 255), 0, 0, 130, 40);

      var friendBtn = makeSpriteBox(tabs, 92, 0, 156, 50, cc.color(55, 132, 214, 255));
      friendBtn.name = "restoreFriendRankBtn";
      makeLabel(friendBtn, "\u597d\u53cb\u699c", 26, cc.color(255, 255, 255, 255), 0, 0, 130, 40);

      addDeepTouch(worldBtn, "rankWorld", function () {
        panel._restoreRankMode = "world";
        panel._restoreRankKey = "";
        ensureRankTabs(panel);
        renderRankFallback(panel);
      });
      addDeepTouch(friendBtn, "rankFriend", function () {
        panel._restoreRankMode = "friend";
        panel._restoreRankKey = "";
        ensureRankTabs(panel);
        renderRankFallback(panel);
      });
    }
    tabs.active = true;
    tabs.zIndex = 25;
    tabs.setLocalZOrder && tabs.setLocalZOrder(25);
    var world = findChild(tabs, "restoreWorldRankBtn");
    var friend = findChild(tabs, "restoreFriendRankBtn");
    if (world) {
      world.opacity = panel._restoreRankMode === "world" ? 255 : 150;
      world.color = panel._restoreRankMode === "world" ? cc.Color.WHITE : cc.color(180, 210, 255, 255);
    }
    if (friend) {
      friend.opacity = panel._restoreRankMode === "friend" ? 255 : 150;
      friend.color = panel._restoreRankMode === "friend" ? cc.Color.WHITE : cc.color(180, 210, 255, 255);
    }
  }

  function makeRankMedal(parent, rank, x, y) {
    var node = new cc.Node("restoreRankMedal");
    node.parent = parent;
    node.setPosition(x, y);
    node.setContentSize(74, 74);
    var g = node.addComponent(cc.Graphics);
    var fill = rank === 1 ? cc.color(255, 214, 76, 255) : (rank === 2 ? cc.color(182, 198, 255, 255) : cc.color(203, 128, 80, 255));
    var stroke = rank === 1 ? cc.color(173, 97, 26, 255) : (rank === 2 ? cc.color(70, 86, 162, 255) : cc.color(111, 61, 35, 255));
    g.fillColor = fill;
    g.strokeColor = stroke;
    g.lineWidth = 5;
    g.circle(0, -4, 27);
    g.fill();
    g.stroke();
    g.fillColor = cc.color(255, 246, 184, 255);
    g.circle(0, -4, 12);
    g.fill();
    g.fillColor = stroke;
    g.rect(-20, 18, 16, 28);
    g.rect(4, 18, 16, 28);
    g.fill();
    makeLabel(node, String(rank), 22, cc.color(116, 72, 28, 255), 0, -4, 36, 32);
    return node;
  }

  function makeRankAvatar(parent, index, x, y) {
    var colors = [
      cc.color(242, 216, 181, 255),
      cc.color(188, 229, 245, 255),
      cc.color(214, 238, 203, 255),
      cc.color(245, 205, 219, 255)
    ];
    var avatar = makeSpriteBox(parent, x, y, 94, 94, colors[index % colors.length]);
    avatar.name = "restoreRankAvatar";
    var g = avatar.getComponent && avatar.getComponent(cc.Graphics);
    if (g) {
      g.fillColor = cc.color(255, 255, 255, 70);
      g.rect(-47, 11, 94, 17);
      g.fill();
      g.fillColor = cc.color(255, 255, 255, 40);
      g.rect(-47, -23, 94, 17);
      g.fill();
    }
    return avatar;
  }

  function loadRankSprite(sprite, name) {
    if (!sprite || !name) return;
    loadIllustrateSprite(sprite, "ab:game2/texture/rank/" + name);
  }

  function trimRankText(text, maxUnits) {
    text = text == null ? "" : String(text);
    maxUnits = maxUnits || 16;
    var units = 0;
    var out = "";
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var code = text.charCodeAt(i);
      var weight = code > 255 ? 2 : 1;
      if (units + weight > maxUnits) return out + "...";
      out += ch;
      units += weight;
    }
    return out;
  }

  function styleRankLabel(node, align, outlineColor) {
    if (!node || !node.isValid) return node;
    var label = node.getComponent && node.getComponent(cc.Label);
    if (label) {
      if (cc.Label.HorizontalAlign && align) label.horizontalAlign = cc.Label.HorizontalAlign[align] || label.horizontalAlign;
      if (cc.Label.Overflow && cc.Label.Overflow.SHRINK != null) {
        label.overflow = cc.Label.Overflow.SHRINK;
        label.enableWrapText = false;
      }
    }
    if (outlineColor) {
      var outline = node.getComponent && node.getComponent(cc.LabelOutline) || node.addComponent && node.addComponent(cc.LabelOutline);
      if (outline) {
        outline.width = 2;
        outline.color = outlineColor;
      }
    }
    return node;
  }

  function makeRankText(parent, text, size, color, x, y, width, height, align, outlineColor) {
    return styleRankLabel(makeLabel(parent, text, size, color, x, y, width, height), align, outlineColor);
  }

  function makeRankPanelRect(parent, name, x, y, w, h, fillColor, strokeColor, radius, strokeWidth) {
    var node = new cc.Node(name || "rankRect");
    node.parent = parent;
    node.setPosition(x || 0, y || 0);
    node.setContentSize(w || 100, h || 40);
    var g = node.addComponent(cc.Graphics);
    g.fillColor = fillColor || cc.color(255, 255, 255, 255);
    if (strokeColor) {
      g.strokeColor = strokeColor;
      g.lineWidth = strokeWidth || 4;
    }
    g.roundRect(-(w || 100) / 2, -(h || 40) / 2, w || 100, h || 40, radius == null ? 12 : radius);
    g.fill();
    if (strokeColor) g.stroke();
    return node;
  }

  function addRankTopShine(parent, w, h, radius) {
    var shine = makeRankPanelRect(parent, "restoreRankShine", 0, h * 0.24, w - 26, h * 0.32, cc.color(255, 255, 255, 38), null, radius || 10, 0);
    shine.zIndex = -1;
    shine.setLocalZOrder && shine.setLocalZOrder(-1);
    return shine;
  }

  function getRankPanelComponent(panel) {
    if (!panel || !panel.isValid) return null;
    if (panel._restoreRankComp && panel._restoreRankComp.node && panel._restoreRankComp.node.isValid) return panel._restoreRankComp;
    var comps = panel.getComponents ? panel.getComponents(cc.Component) : [];
    for (var i = 0; i < comps.length; i++) {
      if (comps[i] && (typeof comps[i].refreshPanel === "function" || typeof comps[i].changeMode === "function")) {
        panel._restoreRankComp = comps[i];
        return comps[i];
      }
    }
    var children = panel.children || [];
    for (var j = 0; j < children.length; j++) {
      var found = getRankPanelComponent(children[j]);
      if (found) {
        panel._restoreRankComp = found;
        return found;
      }
    }
    return null;
  }

  function buildRankFallbackData(userLevel, mode) {
    var level = Math.max(1, Number(userLevel) || 1);
    var cacheKey = (mode || "world") + ":" + level;
    if (rankDataCache[cacheKey]) return rankDataCache[cacheKey];
    var friendNames = ["\u97e6\u6842\u73cd", "\u4e94\u5802\u5c71\u4eba\uff0c\u6768\u5b8f\u4f1f", "\u73cd", "\u82b3\u82b3", "\u5154\u5154\u8c46", "\u91d1\u6d9b", "\u9646\u5947\u6587", "\u73a9\u5bb68", "\u73a9\u5bb69", "\u73a9\u5bb610"];
    var friendScores = [2763, 2001, 1005, 779, 574, 524, 445, 338, 120, 85];
    var worldNames = ["\u97e6\u6842\u73cd", "\u4e94\u5cf0\u5c71\u4eba\uff0c\u6768\u5b8f\u4f1f", "\u82b3\u82b3", "\u8bb8", "\u676d\u732a\u513f", "\u91d1\u6c85", "\u987e\u76ca\u6587", "\u73a9\u5bb68", "\u73a9\u5bb69", "\u73a9\u5bb610"];
    var worldScores = [2763, 2001, 1005, 779, 574, 524, 445, 338, 120, 85];
    var names = mode === "friend" ? friendNames : worldNames;
    var scores = mode === "friend" ? friendScores : worldScores;
    var baseCount = 30;
    try {
      if (cc.sys && cc.sys.localStorage) {
        var savedCount = Number(cc.sys.localStorage.getItem("restore_rank_fallback_count"));
        if (!isNaN(savedCount) && savedCount > 0) baseCount = savedCount;
      }
    } catch (err) {}
    baseCount = Math.max(names.length, scores.length, Math.min(100, Math.max(30, baseCount)));
    var list = [];
    for (var i = 0; i < baseCount; i++) {
      var fallbackScore = scores[i];
      if (!fallbackScore) {
        fallbackScore = Math.max(1, Math.round(85 - (i - scores.length + 1) * 1.75));
      }
      list.push({
        scoreRank: i + 1,
        nickname: names[i] || ((mode === "friend" ? "\u597d\u53cb" : "\u73a9\u5bb6") + (i + 1)),
        avatarUrl: "",
        score: fallbackScore
      });
    }
    var data = {
      myInfo: {
        scoreRank: Math.min(100, Math.max(1, Math.min(baseCount, 20))),
        score: level
      },
      userList: list
    };
    data._restoreRankSource = "fallback";
    rankDataCache[cacheKey] = data;
    storeRankData(mode, data, true);
    return data;
  }

  function getStoredRankData(mode, userLevel) {
    try {
      var cacheKey = (mode || "world") + ":" + Math.max(1, Number(userLevel) || 1);
      if (rankDataCache[cacheKey]) return rankDataCache[cacheKey];
      if (!cc.sys || !cc.sys.localStorage) return null;
      var raw = cc.sys.localStorage.getItem("restore_rank_data_" + (mode || "world"));
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (data && data.userList && data.userList.length) {
        rankDataCache[cacheKey] = data;
        return data;
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  function storeRankData(mode, data, keepSource) {
    try {
      if (!cc.sys || !cc.sys.localStorage || !data || !data.userList || !data.userList.length) return;
      if (!keepSource) data._restoreRankSource = "live";
      var level = data.myInfo && data.myInfo.score || 1;
      rankDataCache[(mode || "world") + ":" + Math.max(1, Number(level) || 1)] = data;
      cc.sys.localStorage.setItem("restore_rank_data_" + (mode || "world"), JSON.stringify(data));
    } catch (err) {}
  }

  function normalizeRankRecord(raw, index, fallbackName, fallbackScore) {
    raw = raw || {};
    var score = Number(raw.score != null ? raw.score : (raw.rankScore != null ? raw.rankScore : (raw.level != null ? raw.level : fallbackScore)));
    if (isNaN(score)) score = 0;
    return {
      scoreRank: Number(raw.scoreRank != null ? raw.scoreRank : (raw.rank != null ? raw.rank : index + 1)) || index + 1,
      nickname: raw.nickname || raw.nickName || raw.name || fallbackName || ("\u73a9\u5bb6" + (index + 1)),
      avatarUrl: raw.avatarUrl || raw.avatar || raw.head || "",
      score: score
    };
  }

  function normalizeRankData(rawData, userLevel, mode) {
    var source = rawData && (rawData.userList || rawData.rankList || rawData.list || rawData.data);
    if (!source || !source.length) return null;
    var list = [];
    for (var i = 0; i < source.length; i++) {
      list.push(normalizeRankRecord(source[i], i, (mode === "friend" ? "\u597d\u53cb" : "\u73a9\u5bb6") + (i + 1), userLevel));
    }
    list.sort(function (a, b) { return (Number(b.score) || 0) - (Number(a.score) || 0); });
    for (var j = 0; j < list.length; j++) list[j].scoreRank = j + 1;

    var globals = getGameGlobals();
    var user = globals.globalData && globals.globalData.user || {};
    var rawMyInfo = rawData && (rawData.myInfo || rawData.selfInfo || rawData.userInfo);
    var myInfo = rawMyInfo ? normalizeRankRecord(rawMyInfo, 0, user.nickName || "ZX05191016", userLevel) : null;
    if (!myInfo) {
      for (var k = 0; k < list.length; k++) {
        if ((user.nickName && list[k].nickname === user.nickName) || (user.avatarUrl && list[k].avatarUrl === user.avatarUrl)) {
          myInfo = {
            scoreRank: list[k].scoreRank,
            nickname: list[k].nickname,
            avatarUrl: list[k].avatarUrl,
            score: list[k].score
          };
          break;
        }
      }
    }
    if (!myInfo) {
      myInfo = {
        scoreRank: list.length + 1,
        nickname: user.nickName || "ZX05191016",
        avatarUrl: user.avatarUrl || "",
        score: Math.max(1, Number(userLevel) || 1)
      };
    }
    return {
      myInfo: myInfo,
      userList: list
    };
  }

  function requestLiveRankData(panel, mode, userLevel) {
    if (!panel) return;
    try {
      var sys = typeof wx !== "undefined" && wx.getSystemInfoSync && wx.getSystemInfoSync();
      if (sys && sys.platform === "devtools") {
        if (!panel._restoreRankSkipDevtoolsLogged) {
          panel._restoreRankSkipDevtoolsLogged = true;
          console.log("restore rank live data skipped devtools", mode);
        }
        return;
      }
    } catch (sysErr) {}
    var now = Date.now();
    if (panel._restoreRankRequesting && now - (panel._restoreRankRequestTime || 0) < 2200) return;
    panel._restoreRankRequestTimes = panel._restoreRankRequestTimes || {};
    var requestKey = mode || "world";
    var lastRequest = panel._restoreRankRequestTimes[requestKey] || 0;
    if (lastRequest && now - lastRequest < 30000) return;
    try {
      var globals = getGameGlobals();
      var platform = globals.globalData && globals.globalData.platform;
      if (!platform || typeof platform.getRankInfo !== "function") return;
      panel._restoreRankRequesting = true;
      panel._restoreRankRequestTime = now;
      panel._restoreRankRequestTimes[requestKey] = now;
      var requestMode = mode;
      var requestLevel = userLevel;
      setTimeout(function () {
        if (!panel.isValid || !panel._restoreRankRequesting || panel._restoreRankRequestTime !== now) return;
        panel._restoreRankRequesting = false;
        console.log("restore rank live data timeout", requestMode);
      }, 2200);
      console.log("restore rank live data request", mode);
      platform.getRankInfo(function (data) {
        if (panel._restoreRankRequestTime !== now) return;
        panel._restoreRankRequesting = false;
        if (!panel.isValid) return;
        var normalized = normalizeRankData(data, requestLevel, requestMode);
        if (!normalized || !normalized.userList.length) {
          console.log("restore rank live data empty", requestMode);
          return;
        }
        panel._restoreRankLiveData = panel._restoreRankLiveData || {};
        panel._restoreRankLiveData[requestMode] = normalized;
        panel._restoreRankDataVersion = (panel._restoreRankDataVersion || 0) + 1;
        panel._restoreRankKey = "";
        storeRankData(requestMode, normalized);
        console.log("restore rank live data loaded", requestMode, normalized.userList.length);
        renderRankFallback(panel);
      });
    } catch (err) {
      panel._restoreRankRequesting = false;
      console.error("restore rank live data failed", err && err.message ? err.message : err);
    }
  }

  function getRankDataForPanel(panel, mode, userLevel) {
    var live = panel && panel._restoreRankLiveData && panel._restoreRankLiveData[mode];
    if (live && live.userList && live.userList.length) return live;
    var stored = getStoredRankData(mode, userLevel);
    if (stored) {
      var normalized = normalizeRankData(stored, userLevel, mode);
      if (normalized) return normalized;
    }
    return buildRankFallbackData(userLevel, mode);
  }

  function renderRankWithOriginal(panel, mode, userLevel) {
    var comp = getRankPanelComponent(panel);
    if (!comp || typeof comp.refreshPanel !== "function") {
      console.log("restore rank original unavailable", "no-comp");
      return false;
    }
    var scrollViewNode = findNode(panel, "scrollView") || findNode(panel, "rankScrollView");
    var selfRankItem = findNode(panel, "selfRankItem");
    if (!scrollViewNode || !selfRankItem || !scrollViewNode.getComponent) {
      console.log("restore rank original unavailable", "missing-nodes", !!scrollViewNode, !!selfRankItem);
      return false;
    }
    var listView = null;
    var comps = scrollViewNode.getComponents ? scrollViewNode.getComponents(cc.Component) : [];
    for (var i = 0; i < comps.length; i++) {
      if (comps[i] && typeof comps[i].setData === "function") {
        listView = comps[i];
        break;
      }
    }
    if (!listView) {
      console.log("restore rank original unavailable", "no-listview", comps.length);
      return false;
    }

    var manualLayer = findChild(panel, "restoreRankLayer");
    if (manualLayer) manualLayer.active = false;
    var manualSelf = findChild(panel, "restoreRankSelfBar");
    if (manualSelf) manualSelf.active = false;

    var subContext = findNode(panel, "subContext");
    if (subContext) subContext.active = false;
    scrollViewNode.active = true;
    selfRankItem.active = true;

    comp.selfRankItem = selfRankItem;
    comp.scrollView = scrollViewNode;
    comp.subContext = subContext;
    comp.worldBtn = findNode(panel, "worldBtn");
    comp.friendBtn = findNode(panel, "friendBtn");
    comp.worldDec = comp.worldBtn && findNode(comp.worldBtn, "dec");
    comp.friendDec = comp.friendBtn && findNode(comp.friendBtn, "dec");
    comp.rankIcon = findNode(selfRankItem, "rankIcon") && findNode(selfRankItem, "rankIcon").getComponent(cc.Sprite);
    comp.rank = findNode(selfRankItem, "rank") && findNode(selfRankItem, "rank").getComponent(cc.Label);
    comp.avater = findNode(selfRankItem, "avater") && findNode(selfRankItem, "avater").getComponent(cc.Sprite);
    comp.nickName = findNode(selfRankItem, "nickName") && findNode(selfRankItem, "nickName").getComponent(cc.Label);
    comp.scoreLabel = findNode(selfRankItem, "scoreLabel") && findNode(selfRankItem, "scoreLabel").getComponent(cc.Label);
    if (!comp.rankIcon || !comp.rank || !comp.nickName || !comp.scoreLabel) {
      console.log("restore rank original unavailable", "missing-self-fields", !!comp.rankIcon, !!comp.rank, !!comp.nickName, !!comp.scoreLabel);
      return false;
    }

    var globals = getGameGlobals();
    if (globals.globalData && globals.globalData.user) {
      if (!globals.globalData.user.nickName) globals.globalData.user.nickName = "ZX05191016";
      if (!globals.globalData.user.avatarUrl) globals.globalData.user.avatarUrl = "";
    }

    comp.type = 1;
    comp.allData = getRankDataForPanel(panel, mode, userLevel);
    comp.refreshPanel(comp.allData);
    console.log("restore rank original rendered", mode, comp.allData.userList && comp.allData.userList.length);
    return true;
  }

  function installRankWheelScroll(panel, layer, listNode, visibleTop, visibleBottom, maxOffset) {
    if (!panel || !layer || !listNode) return;
    panel._restoreRankListNode = listNode;
    panel._restoreRankVisibleTop = visibleTop;
    panel._restoreRankVisibleBottom = visibleBottom;
    panel._restoreRankMaxOffset = maxOffset || 0;
    function setOffset(offset) {
      offset = Math.max(0, Math.min(panel._restoreRankMaxOffset || 0, offset || 0));
      panel._restoreRankScrollOffset = offset;
      var activeList = panel._restoreRankListNode;
      if (activeList && activeList.isValid) activeList.y = (activeList._restoreRankBaseY || 0) + offset;
      var rows = activeList && activeList.children || [];
      for (var i = 0; i < rows.length; i++) {
        var y = rows[i].y + offset;
        rows[i].active = y < (panel._restoreRankVisibleTop || 0) + 80 && y > (panel._restoreRankVisibleBottom || 0) - 80;
      }
    }
    panel._restoreRankApplyScroll = setOffset;
    if (panel._restoreRankWheelInstalled) {
      setOffset(panel._restoreRankScrollOffset || 0);
      return;
    }
    function onWheel(event) {
      if (!panel.activeInHierarchy) return;
      var scrollY = event.getScrollY ? event.getScrollY() : 0;
      var delta = scrollY ? -scrollY * 0.65 : 80;
      setOffset((panel._restoreRankScrollOffset || 0) + delta);
      event.stopPropagation && event.stopPropagation();
      console.log("restore rank wheel", panel._restoreRankScrollOffset);
    }
    function onTouchStart(event) {
      var point = event.getLocation && event.getLocation();
      panel._restoreRankDragY = point && typeof point.y === "number" ? point.y : 0;
      panel._restoreRankDragFallbackDir = 1;
    }
    function onTouchMove(event) {
      if (event._restoreRankDragHandled) return;
      event._restoreRankDragHandled = true;
      if (panel._restoreRankDragY == null) return;
      var point = event.getLocation && event.getLocation();
      var y = point && typeof point.y === "number" ? point.y : panel._restoreRankDragY;
      var delta = 0;
      var eventDelta = event.getDelta && event.getDelta();
      if (eventDelta && typeof eventDelta.y === "number" && Math.abs(eventDelta.y) > 0.1) {
        delta = eventDelta.y;
      } else if (typeof y === "number" && Math.abs(y - panel._restoreRankDragY) > 0.1) {
        delta = y - panel._restoreRankDragY;
      } else {
        delta = 30 * (panel._restoreRankDragFallbackDir || 1);
      }
      if (delta) panel._restoreRankDragFallbackDir = delta > 0 ? 1 : -1;
      setOffset((panel._restoreRankScrollOffset || 0) + delta);
      panel._restoreRankDragY = y;
      event.stopPropagation && event.stopPropagation();
      if (!panel._restoreRankLastDragLog || Date.now() - panel._restoreRankLastDragLog > 250) {
        panel._restoreRankLastDragLog = Date.now();
        console.log("restore rank drag", panel._restoreRankScrollOffset);
      }
    }
    function onTouchEnd() {
      panel._restoreRankDragY = null;
      panel._restoreRankDragFallbackDir = 1;
    }
    function onMouseDown(event) {
      panel._restoreRankMouseDown = true;
      var point = event.getLocation && event.getLocation();
      panel._restoreRankDragY = point && typeof point.y === "number" ? point.y : 0;
      panel._restoreRankDragFallbackDir = 1;
      event.stopPropagation && event.stopPropagation();
    }
    function onMouseMove(event) {
      if (event._restoreRankMouseDragHandled) return;
      event._restoreRankMouseDragHandled = true;
      if (!panel._restoreRankMouseDown) return;
      if (panel._restoreRankDragY == null) return;
      var point = event.getLocation && event.getLocation();
      var y = point && typeof point.y === "number" ? point.y : panel._restoreRankDragY;
      var delta = 0;
      var eventDelta = event.getDelta && event.getDelta();
      if (eventDelta && typeof eventDelta.y === "number" && Math.abs(eventDelta.y) > 0.1) {
        delta = eventDelta.y;
      } else if (typeof y === "number" && Math.abs(y - panel._restoreRankDragY) > 0.1) {
        delta = y - panel._restoreRankDragY;
      } else {
        delta = 30 * (panel._restoreRankDragFallbackDir || 1);
      }
      if (delta) panel._restoreRankDragFallbackDir = delta > 0 ? 1 : -1;
      setOffset((panel._restoreRankScrollOffset || 0) + delta);
      panel._restoreRankDragY = y;
      event.stopPropagation && event.stopPropagation();
      if (!panel._restoreRankLastDragLog || Date.now() - panel._restoreRankLastDragLog > 250) {
        panel._restoreRankLastDragLog = Date.now();
        console.log("restore rank mouse drag", panel._restoreRankScrollOffset);
      }
    }
    function onMouseUp(event) {
      panel._restoreRankMouseDown = false;
      onTouchEnd();
      event && event.stopPropagation && event.stopPropagation();
    }
    if (cc.Node.EventType.MOUSE_WHEEL) {
      panel.on(cc.Node.EventType.MOUSE_WHEEL, onWheel);
      layer.on(cc.Node.EventType.MOUSE_WHEEL, onWheel);
    }
    if (cc.Node.EventType.MOUSE_DOWN) {
      panel.on(cc.Node.EventType.MOUSE_DOWN, onMouseDown);
      layer.on(cc.Node.EventType.MOUSE_DOWN, onMouseDown);
      listNode.on(cc.Node.EventType.MOUSE_DOWN, onMouseDown);
    }
    if (cc.Node.EventType.MOUSE_MOVE) {
      panel.on(cc.Node.EventType.MOUSE_MOVE, onMouseMove);
      layer.on(cc.Node.EventType.MOUSE_MOVE, onMouseMove);
      listNode.on(cc.Node.EventType.MOUSE_MOVE, onMouseMove);
    }
    if (cc.Node.EventType.MOUSE_UP) {
      panel.on(cc.Node.EventType.MOUSE_UP, onMouseUp);
      layer.on(cc.Node.EventType.MOUSE_UP, onMouseUp);
      listNode.on(cc.Node.EventType.MOUSE_UP, onMouseUp);
    }
    if (cc.systemEvent && cc.systemEvent.on && cc.SystemEvent && cc.SystemEvent.EventType) {
      if (cc.SystemEvent.EventType.MOUSE_DOWN) {
        cc.systemEvent.on(cc.SystemEvent.EventType.MOUSE_DOWN, function (event) {
          if (!panel.isValid || !panel.activeInHierarchy) return;
          onMouseDown(event);
          console.log("restore rank system mouse down");
        });
      }
      if (cc.SystemEvent.EventType.MOUSE_MOVE) {
        cc.systemEvent.on(cc.SystemEvent.EventType.MOUSE_MOVE, function (event) {
          if (!panel.isValid || !panel.activeInHierarchy || !panel._restoreRankMouseDown) return;
          onMouseMove(event);
          console.log("restore rank system mouse move");
        });
      }
      if (cc.SystemEvent.EventType.MOUSE_UP) {
        cc.systemEvent.on(cc.SystemEvent.EventType.MOUSE_UP, function (event) {
          if (!panel.isValid) return;
          onMouseUp(event);
        });
      }
      if (cc.SystemEvent.EventType.MOUSE_WHEEL) {
        cc.systemEvent.on(cc.SystemEvent.EventType.MOUSE_WHEEL, function (event) {
          if (!panel.isValid || !panel.activeInHierarchy) return;
          onWheel(event);
        });
      }
      if (cc.SystemEvent.EventType.TOUCH_START) {
        cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_START, function (event) {
          if (!panel.isValid || !panel.activeInHierarchy) return;
          onTouchStart(event);
        });
      }
      if (cc.SystemEvent.EventType.TOUCH_MOVE) {
        cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_MOVE, function (event) {
          if (!panel.isValid || !panel.activeInHierarchy) return;
          onTouchMove(event);
        });
      }
      if (cc.SystemEvent.EventType.TOUCH_END) {
        cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, function () {
          if (!panel.isValid || !panel.activeInHierarchy) return;
          onTouchEnd();
        });
      }
      if (cc.SystemEvent.EventType.TOUCH_CANCEL) {
        cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_CANCEL, function () {
          if (!panel.isValid || !panel.activeInHierarchy) return;
          onTouchEnd();
        });
      }
    }
    panel.on(cc.Node.EventType.TOUCH_START, onTouchStart);
    panel.on(cc.Node.EventType.TOUCH_MOVE, onTouchMove);
    panel.on(cc.Node.EventType.TOUCH_END, onTouchEnd);
    panel.on(cc.Node.EventType.TOUCH_CANCEL, onTouchEnd);
    layer.on(cc.Node.EventType.TOUCH_START, onTouchStart);
    layer.on(cc.Node.EventType.TOUCH_MOVE, onTouchMove);
    layer.on(cc.Node.EventType.TOUCH_END, onTouchEnd);
    layer.on(cc.Node.EventType.TOUCH_CANCEL, onTouchEnd);
    listNode.on(cc.Node.EventType.TOUCH_START, onTouchStart);
    listNode.on(cc.Node.EventType.TOUCH_MOVE, onTouchMove);
    listNode.on(cc.Node.EventType.TOUCH_END, onTouchEnd);
    listNode.on(cc.Node.EventType.TOUCH_CANCEL, onTouchEnd);
    panel._restoreRankWheelInstalled = true;
    setOffset(panel._restoreRankScrollOffset || 0);
    console.log("restore rank wheel patch installed");
  }

  function renderRankFallback(panel) {
    if (!panel) return;
    if (!isRankPanelNode(panel)) return;
    var scrollViewNode = findNode(panel, "scrollView") || findNode(panel, "rankScrollView");
    var content = getContentNode(scrollViewNode);
    try {
      var globals = getGameGlobals();
      var userLevel = globals.globalData && globals.globalData.user && globals.globalData.user.level || 1;
      var mode = panel._restoreRankMode || "world";
      requestLiveRankData(panel, mode, userLevel);
      var rankData = getRankDataForPanel(panel, mode, userLevel);
      var rankList = rankData.userList || [];
      var myInfo = rankData.myInfo || { scoreRank: rankList.length + 1, score: userLevel };
      var key = mode + ":" + userLevel + ":" + (rankData._restoreRankSource || "fallback") + ":" + (panel._restoreRankDataVersion || 0) + ":" + rankList.length;
      if (panel._restoreRankKey === key) return;
      panel._restoreRankKey = key;
      if (renderRankWithOriginal(panel, mode, userLevel)) return;
      if (scrollViewNode) scrollViewNode.active = false;
      if (content) content.removeAllChildren();
      var originalSelfRank = findChild(panel, "selfRankItem") || findNode(panel, "selfRankItem");
      if (originalSelfRank) originalSelfRank.active = false;
      var layer = findChild(panel, "restoreRankLayer");
      if (!layer) {
        layer = new cc.Node("restoreRankLayer");
        layer.parent = panel;
      }
      layer.removeAllChildren();
      layer.active = true;
      layer.setPosition(0, 0);
      layer.setScale && layer.setScale(1);
      layer.setContentSize(960, 1000);
      layer.zIndex = 15;
      layer.setLocalZOrder && layer.setLocalZOrder(15);
      var oldSelf = findChild(panel, "restoreRankSelfBar");
      if (oldSelf) oldSelf.destroy ? oldSelf.destroy() : oldSelf.removeFromParent();
      var viewport = new cc.Node("restoreRankViewport");
      viewport.parent = layer;
      var viewportTop = 540;
      var viewportBottom = -460;
      var viewportY = (viewportTop + viewportBottom) / 2;
      viewport.setContentSize(930, viewportTop - viewportBottom);
      viewport.setPosition(0, viewportY);
      viewport.zIndex = 16;
      viewport.setLocalZOrder && viewport.setLocalZOrder(16);
      try {
        var mask = viewport.addComponent(cc.Mask);
        if (mask && cc.Mask.Type) mask.type = cc.Mask.Type.RECT;
      } catch (maskErr) {}
      var listNode = new cc.Node("restoreRankList");
      listNode.parent = viewport;
      listNode.setContentSize(960, 920);
      listNode._restoreRankBaseY = -viewportY;
      listNode.setPosition(0, listNode._restoreRankBaseY);

      var rankRowHeight = 150;
      var rankRowGap = 150;
      var rankTopY = 465;
      var totalRankRows = rankList.length;
      for (var i = 0; i < totalRankRows; i++) {
        var rankItem = rankList[i] || {};
        var row = new cc.Node("restoreRankItem");
        row.parent = listNode;
        row.setContentSize(900, rankRowHeight);
        row.setPosition(0, rankTopY - i * rankRowGap);
        var rowBgNode = new cc.Node("rankBg");
        rowBgNode.parent = row;
        rowBgNode.setContentSize(894.4, rankRowHeight);
        rowBgNode.setPosition(0, 0);
        var rowBg = rowBgNode.addComponent(cc.Sprite);
        if (cc.Sprite.Type) rowBg.type = cc.Sprite.Type.SLICED;
        rowBg.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        loadRankSprite(rowBg, i === 0 ? "img_ph_dk1" : (i === 1 ? "img_ph_dk2" : (i === 2 ? "img_ph_dk3" : "img_ph_dk4")));
        if (i < 3) {
          var iconNode = new cc.Node("rankIcon");
          iconNode.parent = row;
          iconNode.setPosition(-320, 0);
          iconNode.setContentSize(118, 146);
          var iconSprite = iconNode.addComponent(cc.Sprite);
          iconSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
          loadRankSprite(iconSprite, "img_ph_jp" + (i + 1));
        } else {
          makeLabel(row, String(i + 1), 54, cc.color(94, 64, 34, 255), -320, 0, 80, 74);
        }
        makeRankAvatar(row, i, -172, 0);
        var playerName = rankItem.nickname || ((mode === "friend" ? "\u597d\u53cb" : "\u73a9\u5bb6") + (i + 1));
        var score = Number(rankItem.score) || 0;
        makeLabel(row, playerName, 38, cc.color(94, 64, 34, 255), 70, 0, 340, 98);
        makeLabel(row, String(score) + "\u5173", 38, cc.color(94, 64, 34, 255), 338, 0, 210, 98);
      }

      var selfBar = makeSpriteBox(layer, 0, -521.249, 960, 150, cc.color(255, 159, 55, 255));
      selfBar.name = "restoreRankSelfBar";
      selfBar.zIndex = 30;
      selfBar.setLocalZOrder && selfBar.setLocalZOrder(30);
      makeLabel(selfBar, String(myInfo.scoreRank || "\u672a\u4e0a\u699c"), 58, cc.Color.WHITE, -350, 0, 140, 80);
      makeRankAvatar(selfBar, 7, -187, 0);
      makeLabel(selfBar, myInfo.nickname || "ZX05191016", 38, cc.color(107, 65, 23, 255), 56, 0, 330, 98);
      makeLabel(selfBar, (Number(myInfo.score) || userLevel) + "\u5173", 38, cc.Color.WHITE, 323, 0, 210, 98);
      installRankWheelScroll(panel, layer, listNode, viewportTop, viewportBottom, Math.max(0, (totalRankRows - 7) * rankRowGap));
      if (panel._restoreRankApplyScroll) panel._restoreRankApplyScroll(panel._restoreRankScrollOffset || 0);
      panel._restoreRankRendered = true;
      console.log("restore rank fallback rendered", mode, totalRankRows);
    } catch (err) {
      console.error("restore rank fallback failed", err && err.message ? err.message : err);
    }
  }

  function getIllustrateData() {
    try {
      if (typeof GameGlobal !== "undefined" && GameGlobal._restoreIllustratedReplacementData && GameGlobal._restoreIllustratedReplacementData.getList) {
        var _riList = GameGlobal._restoreIllustratedReplacementData.getList();
        if (_riList && _riList.length) return _riList;
      }
    } catch (_e) {}
    var original = getOriginalIllustrateData();
    if (original) return original;
    return [
      { name: "\u4f01\u9e45", dec: "" },
      { name: "\u9e66\u9e49", dec: "" },
      { name: "\u5154\u5b50", dec: "" },
      { name: "\u5927\u8c61", dec: "" },
      { name: "\u5b54\u96c0", dec: "" },
      { name: "\u6591\u9a6c", dec: "" },
      { name: "\u677e\u9f20", dec: "" },
      { name: "\u6cb3\u9a6c", dec: "" },
      { name: "\u706b\u70c8\u9e1f", dec: "" },
      { name: "\u718a\u732b", dec: "" },
      { name: "\u72d7", dec: "" },
      { name: "\u732b", dec: "" },
      { name: "\u732b\u5934\u9e70", dec: "" },
      { name: "\u7334\u5b50", dec: "" },
      { name: "\u767d\u72d7", dec: "" },
      { name: "\u767d\u9e3d", dec: "" },
      { name: "\u7f8a", dec: "" },
      { name: "\u7f8a\u9a7c", dec: "" },
      { name: "\u8001\u9f20", dec: "" },
      { name: "\u8003\u62c9", dec: "" },
      { name: "\u8682\u8681", dec: "" },
      { name: "\u86c7", dec: "" },
      { name: "\u871c\u8702", dec: "" },
      { name: "\u8774\u8776", dec: "" },
      { name: "\u8783\u87f9", dec: "" },
      { name: "\u888b\u9f20", dec: "" },
      { name: "\u9752\u86d9", dec: "" },
      { name: "\u9cc4\u9c7c", dec: "" },
      { name: "\u9e21", dec: "" },
      { name: "\u4e4c\u9f9f", dec: "" }
    ];
  }

  function getContentNode(scrollViewNode) {
    if (!scrollViewNode) return null;
    var scrollView = scrollViewNode.getComponent && scrollViewNode.getComponent(cc.ScrollView);
    if (scrollView && scrollView.content) return scrollView.content;

    var view = findChild(scrollViewNode, "view") || scrollViewNode;
    var content = findChild(view, "content");
    if (content) return content;

    content = new cc.Node("content");
    content.parent = view;
    content.setAnchorPoint && content.setAnchorPoint(0.5, 1);
    content.setPosition(0, 0);
    if (scrollView) scrollView.content = content;
    return content;
  }

  function makeLabel(parent, text, size, color, x, y, width, height) {
    var node = new cc.Node("label");
    node.parent = parent;
    node.setPosition(x || 0, y || 0);
    node.setContentSize(width || 120, height || 36);
    var label = node.addComponent(cc.Label);
    label.string = text;
    label.fontSize = size || 22;
    label.lineHeight = height || 36;
    label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    label.verticalAlign = cc.Label.VerticalAlign.CENTER;
    node.color = color || cc.Color.WHITE;
    return node;
  }

  function styleIllustrateLabel(node) {
    if (!node || !node.isValid) return;
    node.color = cc.Color.WHITE;
    var label = node.getComponent && node.getComponent(cc.Label);
    if (label) {
      label.fontSize = 40;
      label.lineHeight = 40;
      label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
      label.verticalAlign = cc.Label.VerticalAlign.CENTER;
    }
    var outline = node.getComponent && node.getComponent(cc.LabelOutline) || node.addComponent && node.addComponent(cc.LabelOutline);
    if (outline) {
      outline.width = 4;
      outline.color = cc.color(124, 74, 2, 255);
    }
    var shadow = node.getComponent && node.getComponent(cc.LabelShadow);
    if (shadow) {
      shadow.enabled = false;
      shadow.color = cc.color(255, 255, 255, 0);
    }
  }

  function normalizeIllustrateAnimalSpriteNode(node, referenceNode) {
    if (!node || !node.isValid) return null;
    if (referenceNode && referenceNode.isValid && referenceNode !== node) {
      if (node.setPosition && referenceNode.position) node.setPosition(referenceNode.position);
      if (node.setAnchorPoint && referenceNode.anchorX !== undefined && referenceNode.anchorY !== undefined) {
        node.setAnchorPoint(referenceNode.anchorX, referenceNode.anchorY);
      }
    }
    if (node.setContentSize) node.setContentSize(183, 119);
    node.width = 183;
    node.height = 119;
    if (node.setScale) node.setScale(1, 1);
    var sprite = node.getComponent && node.getComponent(cc.Sprite);
    if (sprite) sprite.sizeMode = cc.Sprite.SizeMode.RAW;
    return sprite;
  }

  function makeSpriteBox(parent, x, y, w, h, color) {
    var node = new cc.Node("box");
    node.parent = parent;
    node.setPosition(x, y);
    node.setContentSize(w, h);
    var graphics = node.addComponent(cc.Graphics);
    graphics.fillColor = color;
    graphics.roundRect(-w / 2, -h / 2, w, h, 12);
    graphics.fill();
    return node;
  }


  function getIllustratedReplacementBase64(path) {
    try {
      if (typeof GameGlobal === "undefined") return null;
      var repl = GameGlobal._restoreIllustratedReplacementData;
      if (!repl || !repl.getBase64) return null;
      // path like "ab:game/texture/illustrated/animal/????" or ".../animalGray/????"
      // animalLock paths
      if (path.indexOf("/animalLock/animal/") >= 0) {
        var _alName = path.split("/").pop();
        if (_alName) return repl.getBase64(_alName, false);
        return null;
      }
      // puzzle paths
      if (path.indexOf("/puzzle/puzzle/") >= 0) {
        var _pzName = path.split("/").pop();
        if (_pzName && repl._puzzleCanvasData && repl._puzzleCanvasData[_pzName]) return repl._puzzleCanvasData[_pzName];
        var _pzBase64 = null;
        if (_pzName && repl.getPuzzleBase64) _pzBase64 = repl.getPuzzleBase64(_pzName);
        if (!_pzBase64 && _pzName && repl._puzzleData) _pzBase64 = repl._puzzleData[_pzName] || null;
        if (_pzBase64 && repl._puzzleCanvasData && repl._puzzleCanvasData[_pzName]) return repl._puzzleCanvasData[_pzName];
        return _pzBase64;
      }
      var isGray = false;
      if (path.indexOf("/illustrated/animalGray/") >= 0) isGray = true;
      else if (path.indexOf("/illustrated/animal/") < 0) return null;
      var name = path.split("/").pop();
      if (!name) return null;
      return repl.getBase64(name, isGray);
    } catch (e) { return null; }
  }

  function getPuzzleCanvasReplacementBase64(name, callback) {
    try {
      getPuzzleRawReplacementBase64(name, callback);
    } catch (err) {
      callback(null);
    }
  }

  function ensurePuzzleReplacementDataLoaded() {
    if (puzzleReplacementDataLoaded) return;
    puzzleReplacementDataLoaded = true;
    try {
      if (typeof GameGlobal !== "undefined" && (!GameGlobal._restoreIllustratedReplacementData || !GameGlobal._restoreIllustratedReplacementData.getBase64)) {
        try { require("./illustrated-replacement-data.js"); } catch (illustratedErr) {}
      }
      require("./puzzle-replacement-data.js");
    } catch (err) {
      puzzleReplacementDataLoaded = false;
      console.error("load puzzle replacement data failed", err && err.message ? err.message : err);
    }
  }

  function getPuzzleRawReplacementBase64(name, callback) {
    try {
      if (typeof GameGlobal === "undefined" || !name) return callback(null);
      ensurePuzzleReplacementDataLoaded();
      var repl = GameGlobal._restoreIllustratedReplacementData;
      if (!repl) return callback(null);
      var src = repl.getPuzzleBase64 ? repl.getPuzzleBase64(name) : null;
      if (!src && repl._puzzleData) src = repl._puzzleData[name] || null;
      callback(src || null);
    } catch (err) {
      callback(null);
    }
  }

  function loadIllustrateSpriteFromRes(sprite, path, maxW, maxH, fit) {
    if (illustrateFrameCache[path]) {
      applyIllustrateFrameToSprite(sprite, path, illustrateFrameCache[path]);
      if (fit) fitIllustrateSprite(sprite, illustrateFrameCache[path], maxW, maxH);
      return;
    }
    if (illustrateFrameLoading[path]) {
      illustrateFrameLoading[path].push(fit ? { sprite: sprite, maxW: maxW, maxH: maxH, fit: true } : { sprite: sprite });
      return;
    }
    illustrateFrameLoading[path] = [fit ? { sprite: sprite, maxW: maxW, maxH: maxH, fit: true } : { sprite: sprite }];
    try {
      var resModule = requireGameModule("Res");
      var res = resModule.default || resModule;
      if (res && res.load) {
        res.load(path, cc.SpriteFrame).then(function (frame) {
          illustrateFrameCache[path] = frame;
          applyLoadedIllustrateFrame(path, frame);
        }).catch(function () {
          failIllustrateFrameLoad(path);
        });
      } else {
        failIllustrateFrameLoad(path);
      }
    } catch (err) {
      failIllustrateFrameLoad(path);
    }
  }

  function loadIllustrateSprite(sprite, path) {
    if (!sprite || !path) return;
    prepareIllustrateSpriteLoad(sprite, path);
    if (path.indexOf("/puzzle/puzzle/") >= 0) {
      var _pzName = path.split("/").pop();
      getPuzzleCanvasReplacementBase64(_pzName, function (_pzB64) {
        if (_pzB64) {
          loadRemoteTextureAsSpriteFrame([_pzB64], 0, function (_pzFrame) {
            if (_pzFrame) {
              illustrateFrameCache[path] = _pzFrame;
              applyIllustrateFrameToSprite(sprite, path, _pzFrame);
            } else {
              console.error("restore puzzle replacement texture failed", _pzName);
              loadIllustrateSpriteFromRes(sprite, path, 0, 0, false);
            }
          });
        } else {
          console.error("restore puzzle replacement data missing", _pzName);
          loadIllustrateSpriteFromRes(sprite, path, 0, 0, false);
        }
      });
      return;
    }
    var _riB64 = getIllustratedReplacementBase64(path);
    if (_riB64) {
      loadRemoteTextureAsSpriteFrame([_riB64], 0, function (_riFrame) {
        if (_riFrame) {
          illustrateFrameCache[path] = _riFrame;
          applyIllustrateFrameToSprite(sprite, path, _riFrame);
        } else {
          loadIllustrateSpriteFromRes(sprite, path, 0, 0, false);
        }
      });
      return;
    }
    loadIllustrateSpriteFromRes(sprite, path, 0, 0, false);
  }

  function loadIllustrateSpriteFit(sprite, path, maxW, maxH) {
    if (!sprite || !path) return;
    prepareIllustrateSpriteLoad(sprite, path);
    var _riB64 = getIllustratedReplacementBase64(path);
    if (_riB64) {
      loadRemoteTextureAsSpriteFrame([_riB64], 0, function (_riFrame) {
        if (_riFrame) {
          illustrateFrameCache[path] = _riFrame;
          applyIllustrateFrameToSprite(sprite, path, _riFrame);
          fitIllustrateSprite(sprite, _riFrame, maxW, maxH);
        } else {
          loadIllustrateSpriteFromRes(sprite, path, maxW, maxH, true);
        }
      });
      return;
    }
    loadIllustrateSpriteFromRes(sprite, path, maxW, maxH, true);
  }

  function applyLoadedIllustrateFrame(path, frame) {
    var waiters = illustrateFrameLoading[path] || [];
    delete illustrateFrameLoading[path];
    for (var i = 0; i < waiters.length; i++) {
      var sprite = waiters[i].sprite;
      if (!sprite || !sprite.node || !sprite.node.isValid) continue;
      if (!applyIllustrateFrameToSprite(sprite, path, frame)) continue;
      if (waiters[i].fit) fitIllustrateSprite(sprite, frame, waiters[i].maxW, waiters[i].maxH);
    }
  }

  function failIllustrateFrameLoad(path) {
    var waiters = illustrateFrameLoading[path] || [];
    delete illustrateFrameLoading[path];
    for (var i = 0; i < waiters.length; i++) {
      restoreIllustrateSpriteAfterLoadFailure(waiters[i].sprite, path);
    }
  }

  function prepareIllustrateSpriteLoad(sprite, path) {
    if (!sprite || !sprite.node || !sprite.node.isValid) return;
    sprite._restorePreviousIllustrateFrame = sprite.spriteFrame || null;
    sprite._restorePreviousIllustrateOpacity = typeof sprite.node.opacity === "number" ? sprite.node.opacity : 255;
    sprite._restoreIllustratePath = path;
    if (typeof sprite.node._restoreIllustrateOpacity !== "number") {
      sprite.node._restoreIllustrateOpacity = typeof sprite.node.opacity === "number" ? sprite.node.opacity : 255;
    }
    if (!sprite.spriteFrame) sprite.node.opacity = 0;
  }

  function applyIllustrateFrameToSprite(sprite, path, frame) {
    if (!sprite || !sprite.node || !sprite.node.isValid || !frame) return false;
    if (sprite._restoreIllustratePath && sprite._restoreIllustratePath !== path) return false;
    sprite.spriteFrame = frame;
    if (sprite._restorePuzzleFillSize) fillPuzzleSpriteToNode(sprite, sprite.node);
    sprite.node.opacity = typeof sprite.node._restoreIllustrateOpacity === "number" ? sprite.node._restoreIllustrateOpacity : 255;
    sprite._restorePreviousIllustrateFrame = null;
    sprite._restorePreviousIllustrateOpacity = null;
    return true;
  }

  function restoreIllustrateSpriteAfterLoadFailure(sprite, path) {
    if (!sprite || !sprite.node || !sprite.node.isValid) return;
    if (sprite._restoreIllustratePath && sprite._restoreIllustratePath !== path) return;
    if (sprite._restorePreviousIllustrateFrame) sprite.spriteFrame = sprite._restorePreviousIllustrateFrame;
    if (typeof sprite._restorePreviousIllustrateOpacity === "number") {
      sprite.node.opacity = sprite._restorePreviousIllustrateOpacity;
    } else if (sprite.spriteFrame) {
      sprite.node.opacity = typeof sprite.node._restoreIllustrateOpacity === "number" ? sprite.node._restoreIllustrateOpacity : 255;
    }
    sprite._restorePreviousIllustrateFrame = null;
    sprite._restorePreviousIllustrateOpacity = null;
  }

  function fitIllustrateSprite(sprite, frame, maxW, maxH) {
    if (!sprite || !sprite.node || !sprite.node.isValid) return;
    sprite.sizeMode = cc.Sprite.SizeMode.RAW;
    if (sprite.node.setScale) sprite.node.setScale(1, 1);
    var rect = frame && frame.getRect && frame.getRect();
    var w = rect && rect.width || sprite.node.width || maxW || 1;
    var h = rect && rect.height || sprite.node.height || maxH || 1;
    var scale = Math.min((maxW || w) / w, (maxH || h) / h, 1.6);
    sprite.node.setScale && sprite.node.setScale(scale);
  }

  function getSpriteFramePixelSize(frame) {
    if (!frame) return null;
    try {
      var rect = frame.getRect && frame.getRect();
      if (rect && rect.width > 0 && rect.height > 0) return { w: rect.width, h: rect.height };
    } catch (err) {}
    try {
      var originalSize = frame.getOriginalSize && frame.getOriginalSize();
      if (originalSize && originalSize.width > 0 && originalSize.height > 0) return { w: originalSize.width, h: originalSize.height };
    } catch (err2) {}
    try {
      var texture = frame.getTexture && frame.getTexture();
      if (texture && texture.width > 0 && texture.height > 0) return { w: texture.width, h: texture.height };
    } catch (err3) {}
    return null;
  }

  function rememberSpriteDisplayBox(sprite) {
    var node = sprite && sprite.node;
    if (!node || !node.isValid || typeof node._restoreOriginalFitWidth === "number") return;
    node._restoreOriginalFitWidth = node.width || 0;
    node._restoreOriginalFitHeight = node.height || 0;
    node._restoreOriginalFitScaleX = typeof node.scaleX === "number" ? node.scaleX : 1;
    node._restoreOriginalFitScaleY = typeof node.scaleY === "number" ? node.scaleY : 1;
    sprite._restoreOriginalFitSizeMode = sprite.sizeMode;
  }

  function restoreSpriteDisplayBox(sprite) {
    var node = sprite && sprite.node;
    if (!node || !node.isValid || typeof node._restoreOriginalFitWidth !== "number") return;
    if (node._restoreOriginalFitWidth > 0 && node._restoreOriginalFitHeight > 0) {
      node.setContentSize(node._restoreOriginalFitWidth, node._restoreOriginalFitHeight);
    }
    if (node.setScale) node.setScale(node._restoreOriginalFitScaleX || 1, node._restoreOriginalFitScaleY || 1);
    if (typeof sprite._restoreOriginalFitSizeMode !== "undefined") sprite.sizeMode = sprite._restoreOriginalFitSizeMode;
    node._restoreOriginalFitWidth = null;
    node._restoreOriginalFitHeight = null;
    node._restoreOriginalFitScaleX = null;
    node._restoreOriginalFitScaleY = null;
    sprite._restoreOriginalFitSizeMode = null;
  }

  function fitSpriteFrameIntoBox(sprite, frame, maxW, maxH, rememberOriginal) {
    if (!sprite || !sprite.node || !sprite.node.isValid || !frame) return;
    var node = sprite.node;
    if (rememberOriginal) rememberSpriteDisplayBox(sprite);
    sprite.spriteFrame = frame;
    sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    var frameSize = getSpriteFramePixelSize(frame);
    var frameW = frameSize && frameSize.w > 0 ? frameSize.w : 1;
    var frameH = frameSize && frameSize.h > 0 ? frameSize.h : 1;
    var boxW = maxW || node._restoreOriginalFitWidth || node.width || frameW;
    var boxH = maxH || node._restoreOriginalFitHeight || node.height || frameH;
    var scale = Math.min(boxW / frameW, boxH / frameH);
    if (!isFinite(scale) || scale <= 0) scale = 1;
    node.setContentSize(Math.max(1, frameW * scale), Math.max(1, frameH * scale));
  }

  function loadAsset(path, type) {
    try {
      var resModule = requireGameModule("Res");
      var res = resModule.default || resModule;
      if (res && res.load) return res.load(path, type);
    } catch (err) {}
    return null;
  }

  function forcePureSheepMode() {
    try {
      var globals = getGameGlobals();
      var gameApp = globals && globals.gameApp;
      var sheepType = getSheepType();
      if (gameApp && gameApp.gameMgr) {
        if (typeof gameApp.gameMgr.type === "number") gameApp.gameMgr.type = sheepType;
        if (typeof gameApp.gameMgr.curType === "number") gameApp.gameMgr.curType = sheepType;
        if (typeof gameApp.gameMgr.animalType === "number") gameApp.gameMgr.animalType = sheepType;
      }
    } catch (err) {}
  }

  function getPigType() {
    try {
      var enumModule = requireGameModule("Enum");
      var enums = enumModule.default || enumModule;
      if (enums.AnimalType) {
        if (typeof enums.AnimalType.Pig === "number") return enums.AnimalType.Pig;
        if (typeof enums.AnimalType.Zhu === "number") return enums.AnimalType.Zhu;
      }
    } catch (err) {}
    return 0;
  }

  function getAnimalNodeName(node) {
    var cur = node;
    while (cur && cur.isValid) {
      if (animalNodeNames[cur.name]) return cur.name;
      cur = cur.parent;
    }
    return null;
  }

  function getAnimalTypeByNodeName(name) {
    if (!name) return null;
    try {
      var enumModule = requireGameModule("Enum");
      var enums = enumModule.default || enumModule;
      var animalType = enums.AnimalType || {};
      var map = {
        gou: ["Dog"],
        zhu: ["Pig", "Zhu"],
        yang: ["Sheep"],
        ka: ["Ka"],
        kaola: ["Ka"],
        mao: ["Cat"],
        niu: ["Cattle"],
        hu: ["Fox"],
        shu: ["Mouse"],
        tu: ["Rabbit"],
        gui: ["Tortoise"],
        wugui: ["Tortoise"]
      };
      var keys = map[name] || [];
      for (var i = 0; i < keys.length; i++) {
        if (typeof animalType[keys[i]] === "number") return animalType[keys[i]];
      }
    } catch (err) {}
    return null;
  }

  function getAnimalTypeFromNode(node) {
    return getAnimalTypeByNodeName(getAnimalNodeName(node));
  }

  function getOriginalAnimalComponentType(comp) {
    if (!comp) return null;
    var nodeType = getAnimalTypeFromNode(comp.node);
    if (typeof nodeType === "number") return nodeType;
    if (typeof comp._restoreOriginalAnimalType === "number") return comp._restoreOriginalAnimalType;
    return getAnimalComponentType(comp, null);
  }

  function getNextMultiAnimalType() {
    try {
      var gameAppModule = requireGameModule("GameApp");
      var gameApp = gameAppModule.GameApp || gameAppModule.default || gameAppModule;
      if (gameApp && gameApp.gameMgr && typeof gameApp.gameMgr.getType === "function") {
        var type = gameApp.gameMgr.getType();
        if (typeof type === "number") return type;
      }
    } catch (err) {}
    try {
      var enumModule = requireGameModule("Enum");
      var enums = enumModule.default || enumModule;
      var animalType = enums.AnimalType || {};
      var pool = [animalType.Dog, animalType.Pig, animalType.Zhu, animalType.Sheep, animalType.Ka, animalType.Cat, animalType.Cattle, animalType.Fox, animalType.Mouse, animalType.Rabbit, animalType.Tortoise];
      var available = [];
      for (var i = 0; i < pool.length; i++) {
        if (typeof pool[i] === "number" && available.indexOf(pool[i]) < 0) available.push(pool[i]);
      }
      if (available.length) return available[Math.floor(Math.random() * available.length)];
    } catch (err2) {}
    return null;
  }

  function getAnimalComponentType(comp, fallback) {
    if (!comp) return fallback;
    if (typeof comp._restoreOriginalAnimalType === "number") return comp._restoreOriginalAnimalType;
    if (comp.aniData && typeof comp.aniData.type === "number") return comp.aniData.type;
    if (typeof comp.aniType === "number") return comp.aniType;
    if (typeof comp.type === "number") return comp.type;
    if (typeof comp.skinType === "number") return comp.skinType;
    return fallback;
  }

  function isPigAnimalComponent(comp, fallback) {
    return getAnimalComponentType(comp, fallback) === getPigType();
  }

  function isAnimalRuntimeComponent(comp) {
    if (!comp) return false;
    if (comp.aniData && typeof comp.aniData === "object") return true;
    if (typeof comp.aniType === "number" && typeof comp.getAniName === "function") return true;
    return !!(comp.aniSpine && typeof comp.getAniName === "function");
  }

  function patchAnimalClass(moduleName) {
    return;
  }

  function installSheepAnimationPatch() {
    return;
  }

  function getSheepType() {
    try {
      var enumModule = requireGameModule("Enum");
      var enums = enumModule.default || enumModule;
      if (enums.AnimalType && typeof enums.AnimalType.Sheep === "number") return enums.AnimalType.Sheep;
    } catch (err) {}
    return 2;
  }

  function applySheepAnimationToComponent(comp, sheepType, replay) {
    return;
  }

  function restoreOriginalAnimationToComponent(comp, replay) {
    if (!comp) return;
    var originalType = getOriginalAnimalComponentType(comp);
    var targetType = getHomeColorMode() === "multi" ? getNextMultiAnimalType() : originalType;
    if (typeof targetType !== "number") targetType = originalType;
    if (typeof targetType === "number") {
      comp.aniType = targetType;
      if (comp.aniData) comp.aniData.type = targetType;
      if (typeof comp.type === "number") comp.type = targetType;
      if (typeof comp.skinType === "number") comp.skinType = targetType;
    }
    comp._restoreSheepAnimKey = null;
    if (!replay) return;

    if (getHomeColorMode() !== "multi" && typeof comp.onChangeSkin === "function") {
      try { comp.onChangeSkin(); } catch (err0) {}
    }
    if (typeof targetType === "number") {
      comp.aniType = targetType;
      if (comp.aniData) comp.aniData.type = targetType;
    }
    if (typeof comp.onIdle === "function") {
      try { comp.onIdle(); } catch (errIdle) {}
    } else if (comp.aniSpine && typeof comp.getAniName === "function" && typeof comp.playAnimation === "function") {
      try {
        var state = comp.state || comp.aniState || 0;
        var aniName = comp.getAniName(comp.aniType, state);
        if (aniName) comp.playAnimation(aniName, true);
      } catch (err1) {}
    }
  }

  function getAnimalReplacementNode(comp) {
    if (!comp || !comp.node || !comp.node.isValid) return null;
    var spineNode = comp.aniSpine && comp.aniSpine.node && comp.aniSpine.node.isValid ? comp.aniSpine.node : null;
    var parent = spineNode && spineNode.parent && spineNode.parent.isValid ? spineNode.parent : comp.node;
    var node = comp._restoreReplacementAnimalNode && comp._restoreReplacementAnimalNode.isValid ? comp._restoreReplacementAnimalNode : null;
    if (!node && comp.node.getChildByName) node = comp.node.getChildByName("restoreReplacementAnimalSprite");
    if (!node) {
      node = new cc.Node("restoreReplacementAnimalSprite");
      node.addComponent(cc.Sprite);
    }
    comp._restoreReplacementAnimalNode = node;
    if (node.parent !== parent) node.parent = parent;
    node.zIndex = 9999;
    node.setLocalZOrder && node.setLocalZOrder(9999);
    node.setAnchorPoint && node.setAnchorPoint(spineNode && spineNode.getAnchorPoint ? spineNode.getAnchorPoint() : cc.v2 ? cc.v2(0.5, 0.5) : { x: 0.5, y: 0.5 });
    node.setPosition(spineNode ? spineNode.x : 0, spineNode ? spineNode.y : 0);
    if (node.setScale) node.setScale(spineNode ? (spineNode.scaleX || 1) : 1, spineNode ? (spineNode.scaleY || 1) : 1);
    node.rotation = spineNode ? (spineNode.rotation || 0) : 0;
    if (node._restoreSheepMotionBase) {
      node._restoreSheepMotionBase.x = node.x || 0;
      node._restoreSheepMotionBase.y = node.y || 0;
      node._restoreSheepMotionBase.scaleX = typeof node.scaleX === "number" ? node.scaleX : 1;
      node._restoreSheepMotionBase.scaleY = typeof node.scaleY === "number" ? node.scaleY : 1;
      node._restoreSheepMotionBase.rotation = typeof node.rotation === "number" ? node.rotation : 0;
    }
    node.active = true;
    node.opacity = 255;
    return node;
  }

  function getAnimalReplacementSize(comp) {
    var spineNode = comp && comp.aniSpine && comp.aniSpine.node && comp.aniSpine.node.isValid ? comp.aniSpine.node : null;
    var sourceNode = spineNode || (comp && comp.node && comp.node.isValid ? comp.node : null);
    var w = sourceNode && sourceNode.width > 0 ? sourceNode.width : 0;
    var h = sourceNode && sourceNode.height > 0 ? sourceNode.height : 0;
    if (w > 0 && h > 0) return { w: w, h: h };
    return { w: 114, h: 115 };
  }

  function setOriginalAnimalVisualsHidden(root, hidden) {
    if (!root || !root.isValid || (root.name && root.name.indexOf("restoreReplacementAnimalSprite") === 0)) return;
    var visualComps = [];
    try {
      var sprite = root.getComponent && root.getComponent(cc.Sprite);
      if (sprite) visualComps.push(sprite);
      var skeleton = typeof sp !== "undefined" && sp.Skeleton && root.getComponent && root.getComponent(sp.Skeleton);
      if (skeleton) visualComps.push(skeleton);
    } catch (err) {}
    for (var v = 0; v < visualComps.length; v++) {
      var comp = visualComps[v];
      if (hidden) {
        if (typeof comp._restoreOriginalAnimalEnabled !== "boolean") comp._restoreOriginalAnimalEnabled = comp.enabled !== false;
        comp.enabled = false;
      } else if (typeof comp._restoreOriginalAnimalEnabled === "boolean") {
        comp.enabled = comp._restoreOriginalAnimalEnabled;
      }
    }
    var children = root.children || [];
    for (var i = 0; i < children.length; i++) setOriginalAnimalVisualsHidden(children[i], hidden);
  }

  function setOriginalAnimalNodeActiveHidden(node, hidden) {
    if (!node || !node.isValid || (node.name && node.name.indexOf("restoreReplacementAnimalSprite") === 0)) return;
    if (hidden) {
      if (typeof node._restoreOriginalAnimalActive !== "boolean") node._restoreOriginalAnimalActive = node.active !== false;
      if (typeof node._restoreOriginalAnimalOpacity !== "number") node._restoreOriginalAnimalOpacity = typeof node.opacity === "number" ? node.opacity : 255;
      node.active = false;
      node.opacity = 0;
    } else {
      if (typeof node._restoreOriginalAnimalActive === "boolean") node.active = node._restoreOriginalAnimalActive;
      if (typeof node._restoreOriginalAnimalOpacity === "number") node.opacity = node._restoreOriginalAnimalOpacity;
    }
  }

  function hideOriginalAnimalSpine(comp) {
    var spineNode = comp && comp.aniSpine && comp.aniSpine.node;
    if (spineNode && spineNode.isValid) setOriginalAnimalNodeActiveHidden(spineNode, true);
    setOriginalAnimalVisualsHidden(comp && comp.node, true);
  }

  function restoreOriginalAnimalSpine(comp) {
    var spineNode = comp && comp.aniSpine && comp.aniSpine.node;
    if (spineNode && spineNode.isValid) setOriginalAnimalNodeActiveHidden(spineNode, false);
    setOriginalAnimalVisualsHidden(comp && comp.node, false);
    var replacement = comp && comp._restoreReplacementAnimalNode && comp._restoreReplacementAnimalNode.isValid ? comp._restoreReplacementAnimalNode : null;
    if (!replacement) replacement = comp && comp.node && comp.node.getChildByName && comp.node.getChildByName("restoreReplacementAnimalSprite");
    if (replacement && replacement.isValid) {
      replacement.active = false;
      replacement.opacity = 0;
      replacement._restoreReplacementComp = null;
    }
  }

  function clearReplacementAnimalSpriteNodes(root) {
    if (!root || !root.isValid) return;
    if (root.name && root.name.indexOf("restoreReplacementAnimalSprite") === 0) {
      root.active = false;
      root.opacity = 0;
      return;
    }
    var children = root.children || [];
    for (var i = 0; i < children.length; i++) clearReplacementAnimalSpriteNodes(children[i]);
  }

  function getReplacementImageIndexForComponent(comp) {
    if (getHomeColorMode() === "pure") return 1;
    var name = getAnimalNodeName(comp && comp.node);
    return getReplacementAnimalImageIndex(name);
  }

  function applyReplacementImageToComponent(comp) {
    if (!shouldUseBlueSheepReplacement(comp)) {
      restoreOriginalAnimalSpine(comp);
      return;
    }
    if (getHomeColorMode() === "multi") {
      restoreOriginalAnimationToComponent(comp, true);
      restoreOriginalAnimalSpine(comp);
      return;
    }
    forceComponentToSheep(comp);
    restoreOriginalAnimalSpine(comp);
    if (typeof comp.onChangeSkin === "function") {
      try { comp.onChangeSkin(); } catch (errSkin) {}
    }
    if (typeof comp.onIdle === "function") {
      try { comp.onIdle(); } catch (errIdle) {}
    } else if (comp.aniSpine && typeof comp.getAniName === "function" && typeof comp.playAnimation === "function") {
      try {
        var state = comp.state || comp.aniState || 0;
        var aniName = comp.getAniName(comp.aniType, state);
        if (aniName) comp.playAnimation(aniName, true);
      } catch (errPlay) {}
    }
  }

  function applySheepSequenceOverlayToComponent(comp) {
    if (!comp) return;
    if (typeof comp._restoreOriginalAnimalType !== "number") comp._restoreOriginalAnimalType = getOriginalAnimalComponentType(comp);
    loadSheepSequenceFrames(function (frames) {
      if (!frames || !frames.length || !comp || !comp.node || !comp.node.isValid) return;
      var node = getAnimalReplacementNode(comp);
      if (!node || !node.isValid) return;
      var sprite = node.getComponent && node.getComponent(cc.Sprite);
      if (!sprite) return;
      var size = getAnimalReplacementSize(comp);
      fitSpriteFrameIntoBox(sprite, frames[0], size.w, size.h, false);
      hideOriginalAnimalSpine(comp);
      node.active = true;
      node.opacity = 255;
      node._restoreReplacementComp = comp;
      registerSheepSequenceNode(node);
    });
  }

  function forceExistingAnimalComponents(root) {
    if (!root || !root.isValid) return;
    var comps = root.getComponents ? root.getComponents(cc.Component) : [];
    for (var i = 0; i < comps.length; i++) {
      var comp = comps[i];
      if (!isAnimalRuntimeComponent(comp)) continue;
      applyReplacementImageToComponent(comp);
    }

    var children = root.children || [];
    for (var j = 0; j < children.length; j++) forceExistingAnimalComponents(children[j]);
  }

  function refreshExistingAnimalSkins(root, forceEventRefresh) {
    if (!root || !root.isValid) return;
    var changed = 0;
    var comps = root.getComponents ? root.getComponents(cc.Component) : [];
    for (var i = 0; i < comps.length; i++) {
      var comp = comps[i];
      if (!isAnimalRuntimeComponent(comp)) continue;
      applyReplacementImageToComponent(comp);
      changed++;
    }

    var children = root.children || [];
    for (var j = 0; j < children.length; j++) changed += refreshExistingAnimalSkins(children[j], forceEventRefresh) || 0;
    return changed;
  }

  function refreshGameColorModeSoon() {
    var run = function (forceEventRefresh) {
      try {
        var scene = cc.director && cc.director.getScene && cc.director.getScene();
        refreshExistingAnimalSkins(scene, !!forceEventRefresh);
      } catch (err) {}
    };
    run(false);
    setTimeout(run, 40);
    setTimeout(run, 120);
    setTimeout(run, 260);
  }

  function getAnimalSpriteAssetName(name) {
    if (name === "kaola") return "ka";
    if (name === "gou" || name === "zhu" || name === "yang" || name === "ka") return name;
    return null;
  }

  function getReplacementAnimalImageIndex(name) {
    var order = [
      "zhu", "yang", "niu", "tu", "gou", "mao", "ji", "ma", "hou", "she", "shu", "hu", "xiong",
      "xiongmao", "kaola", "eyu", "pangxie", "qingwa", "kongque", "yingwu", "banma", "daxiang", "hudie", "mifeng", "mayi"
    ];
    var idx = order.indexOf(name);
    if (idx < 0) idx = 0;
    return idx % 13 + 1;
  }

  function makeSpriteFrameFromTexture(texture) {
    if (!texture) return null;
    if (texture.length && texture[0]) return makeSpriteFrameFromTexture(texture[0]);
    if (cc.SpriteFrame && texture instanceof cc.SpriteFrame) return texture;
    if (cc.Texture2D && texture instanceof cc.Texture2D) return new cc.SpriteFrame(texture);
    if (texture.texture) return makeSpriteFrameFromTexture(texture.texture);
    if (texture._texture) return new cc.SpriteFrame(texture._texture);
    return null;
  }

  function hashString(value) {
    value = String(value || "");
    var hash = 2166136261;
    for (var i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16);
  }

  function dataUrlToWxTempFile(path) {
    try {
      if (typeof path !== "string" || path.indexOf("data:image/") !== 0) return path;
      var wxObj = typeof wx !== "undefined" ? wx : (typeof GameGlobal !== "undefined" && GameGlobal.wx);
      if (!wxObj || !wxObj.env || !wxObj.env.USER_DATA_PATH || !wxObj.getFileSystemManager) return path;
      if (dataUrlImagePathCache[path]) return dataUrlImagePathCache[path];
      var comma = path.indexOf(",");
      if (comma < 0) return path;
      var ext = path.indexOf("image/jpeg") >= 0 ? ".jpg" : ".png";
      var filePath = wxObj.env.USER_DATA_PATH + "/restore_img_" + hashString(path) + "_" + path.length + ext;
      var fs = wxObj.getFileSystemManager();
      try { fs.accessSync && fs.accessSync(filePath); dataUrlImagePathCache[path] = filePath; return filePath; } catch (accessErr) {}
      fs.writeFileSync(filePath, path.slice(comma + 1), "base64");
      dataUrlImagePathCache[path] = filePath;
      console.log("restore data url cached", filePath);
      return filePath;
    } catch (err) {
      return path;
    }
  }

  function loadImagePathAsSpriteFrame(path, callback) {
    try {
      path = dataUrlToWxTempFile(path);
      var wxObj = typeof wx !== "undefined" ? wx : (typeof GameGlobal !== "undefined" && GameGlobal.wx);
      var image = wxObj && wxObj.createImage ? wxObj.createImage() : (typeof Image !== "undefined" ? new Image() : null);
      if (!image || !cc.Texture2D) {
        callback(null);
        return;
      }
      image.onload = function () {
        try {
          var texture = new cc.Texture2D();
          texture.initWithElement(image);
          if (texture.handleLoadedTexture) texture.handleLoadedTexture();
          callback(new cc.SpriteFrame(texture));
        } catch (err) {
          callback(null);
        }
      };
      image.onerror = function () { callback(null); };
      image.src = path;
    } catch (err2) {
      callback(null);
    }
  }

  function loadRemoteTextureAsSpriteFrame(paths, index, callback) {
    if (!paths || index >= paths.length) {
      callback(null);
      return;
    }
    var path = paths[index];
    if (typeof path === "string" && path.indexOf("data:image/") === 0) {
      var convertedPath = dataUrlToWxTempFile(path);
      if (convertedPath !== path) {
        paths = paths.slice();
        paths[index] = convertedPath;
        path = convertedPath;
      }
    }
    var done = function (err, asset) {
      var frame = !err && makeSpriteFrameFromTexture(asset);
      if (frame) callback(frame);
      else loadRemoteTextureAsSpriteFrame(paths, index + 1, callback);
    };
    try {
      if (typeof path === "string" && path.indexOf("data:image/") === 0) {
        loadImagePathAsSpriteFrame(path, function (frame) {
          if (frame) callback(frame);
          else loadRemoteTextureAsSpriteFrame(paths, index + 1, callback);
        });
        return;
      }
      if (cc.assetManager && cc.assetManager.loadRemote) {
        cc.assetManager.loadRemote(path, { ext: ".png" }, done);
        return;
      }
      if (cc.loader && cc.loader.load) {
        cc.loader.load(path, done);
        return;
      }
    } catch (err) {}
    loadImagePathAsSpriteFrame(path, function (frame) {
      if (frame) callback(frame);
      else loadRemoteTextureAsSpriteFrame(paths, index + 1, callback);
    });
  }

  function isSheepAnimalComponent(comp) {
    if (!comp || !comp.node) return false;
    if (getAnimalNodeName(comp.node) === "yang") return true;
    return getAnimalComponentType(comp, null) === getSheepType();
  }

  function shouldUseBlueSheepReplacement(comp) {
    return getHomeColorMode() === "pure" ? isAnimalRuntimeComponent(comp) : isSheepAnimalComponent(comp);
  }

  function forceComponentToSheep(comp) {
    if (!comp) return;
    var sheepType = getSheepType();
    if (typeof comp._restoreOriginalAnimalType !== "number") comp._restoreOriginalAnimalType = getOriginalAnimalComponentType(comp);
    comp.aniType = sheepType;
    if (comp.aniData) comp.aniData.type = sheepType;
    if (typeof comp.type === "number") comp.type = sheepType;
    if (typeof comp.skinType === "number") comp.skinType = sheepType;
  }

  function finishSheepSequenceLoad(frames) {
    sheepSequenceFrames = frames || [];
    sheepSequenceLoading = false;
    var waiters = sheepSequenceWaiters || [];
    sheepSequenceWaiters = [];
    for (var i = 0; i < waiters.length; i++) waiters[i](sheepSequenceFrames);
  }

  function loadSheepSequenceFrames(callback) {
    if (!callback) return false;
    if (sheepSequenceFrames && sheepSequenceFrames.length) {
      callback(sheepSequenceFrames);
      return true;
    }
    sheepSequenceWaiters.push(callback);
    if (sheepSequenceLoading) return true;
    sheepSequenceLoading = true;
    var data = typeof GameGlobal !== "undefined" && GameGlobal._restoreSheepSequenceData || [];
    var frames = new Array(data.length);
    var remaining = data.length;
    if (!remaining) {
      finishSheepSequenceLoad([]);
      return true;
    }
    for (var i = 0; i < data.length; i++) {
      (function (index) {
        loadRemoteTextureAsSpriteFrame([data[index]], 0, function (frame) {
          frames[index] = frame || null;
          remaining--;
          if (remaining <= 0) {
            var loaded = [];
            for (var j = 0; j < frames.length; j++) if (frames[j]) loaded.push(frames[j]);
            finishSheepSequenceLoad(loaded);
          }
        });
      })(i);
    }
    return true;
  }

  function registerSheepSequenceNode(node) {
    if (!node || !node.isValid) return;
    if (!node._restoreSheepMotionBase) {
      node._restoreSheepMotionBase = {
        x: node.x || 0,
        y: node.y || 0,
        scaleX: typeof node.scaleX === "number" ? node.scaleX : 1,
        scaleY: typeof node.scaleY === "number" ? node.scaleY : 1,
        rotation: typeof node.rotation === "number" ? node.rotation : 0,
        phase: Math.abs(Math.floor(((node.parent && node.parent.x) || 0) * 13 + ((node.parent && node.parent.y) || 0) * 7 + (node.x || 0) * 5 + (node.y || 0) * 3)) % 628 / 100
      };
    }
    for (var i = 0; i < sheepSequenceNodes.length; i++) if (sheepSequenceNodes[i] === node) return;
    sheepSequenceNodes.push(node);
  }

  function tickSheepSequence() {
    return;
    if (!sheepSequenceFrames || !sheepSequenceFrames.length) return;
    var now = Date.now ? Date.now() : new Date().getTime();
    var frameIndex = Math.floor(now / sheepSequenceFrameMs) % sheepSequenceFrames.length;
    for (var i = sheepSequenceNodes.length - 1; i >= 0; i--) {
      var node = sheepSequenceNodes[i];
      if (!node || !node.isValid) {
        sheepSequenceNodes.splice(i, 1);
        continue;
      }
      if (!node.active) continue;
      if (node._restoreReplacementComp && getHomeColorMode() === "pure") hideOriginalAnimalSpine(node._restoreReplacementComp);
      var sprite = node.getComponent && node.getComponent(cc.Sprite);
      if (sprite && sprite.spriteFrame !== sheepSequenceFrames[frameIndex]) sprite.spriteFrame = sheepSequenceFrames[frameIndex];
      var base = node._restoreSheepMotionBase;
      if (base) {
        var t = now / 260 + base.phase;
        var slow = now / 620 + base.phase * 0.7;
        var hop = Math.max(0, Math.sin(t)) * 0.9;
        var sway = Math.sin(slow) * 0.65 + Math.sin(t * 0.5) * 0.25;
        var breathe = 1 + Math.sin(slow + 0.8) * 0.018;
        node.x = base.x + sway;
        node.y = base.y + hop + Math.sin(slow * 1.3) * 0.35;
        node.rotation = base.rotation + Math.sin(slow) * 1.25 + Math.sin(t) * 0.45;
        if (node.setScale) node.setScale(base.scaleX * breathe, base.scaleY * (1 - Math.sin(slow + 0.8) * 0.01));
      }
    }
  }

  function loadReplacementSpriteFrame(index, callback) {
    if (!callback) return false;
    index = Math.max(1, Math.min(13, index || 1));
    var key = "replacement-sheep-" + index;
    if (replacementSpriteFrameCache[key]) {
      callback(replacementSpriteFrameCache[key]);
      return true;
    }
    if (replacementSpriteFrameLoading[key]) {
      replacementSpriteFrameLoading[key].push(callback);
      return true;
    }
    replacementSpriteFrameLoading[key] = [callback];
    var file = "animal_replacement_runtime/" + index + ".png";
    var embeddedData = typeof GameGlobal !== "undefined" && GameGlobal._restoreAnimalReplacementData && GameGlobal._restoreAnimalReplacementData[String(index)];
    var paths = [file, "./" + file, "/" + file];
    if (embeddedData) paths.push(embeddedData);
    loadRemoteTextureAsSpriteFrame(paths, 0, function (frame) {
      if (frame) replacementSpriteFrameCache[key] = frame;
      var waiters = replacementSpriteFrameLoading[key] || [];
      delete replacementSpriteFrameLoading[key];
      for (var i = 0; i < waiters.length; i++) waiters[i](frame);
    });
    return true;
  }

  function loadReplacementAnimalSpriteFrame(name, callback) {
    return loadReplacementSpriteFrame(getReplacementAnimalImageIndex(name), callback);
  }

  function loadAnimalSpriteFrame(name, callback) {
    return false;
    if (getHomeColorMode() === "multi") return loadReplacementAnimalSpriteFrame(name, callback);
    var assetName = getAnimalSpriteAssetName(name);
    if (!assetName || !callback) return false;
    var path = "ab:game/texture/game/img_yx_" + assetName;
    if (animalSpriteFrameCache[path]) {
      callback(animalSpriteFrameCache[path]);
      return true;
    }
    if (animalSpriteFrameLoading[path]) {
      animalSpriteFrameLoading[path].push(callback);
      return true;
    }
    var promise = loadAsset(path, cc.SpriteFrame);
    if (!promise || !promise.then) return false;
    animalSpriteFrameLoading[path] = [callback];
    promise.then(function (frame) {
      if (frame) animalSpriteFrameCache[path] = frame;
      var waiters = animalSpriteFrameLoading[path] || [];
      delete animalSpriteFrameLoading[path];
      for (var i = 0; i < waiters.length; i++) waiters[i](frame);
    }).catch(function () {
      delete animalSpriteFrameLoading[path];
    });
    return true;
  }

  function loadSheepSpriteFrame(callback) {
    if (!callback) return;
    if (sheepSpriteFrame) {
      callback(sheepSpriteFrame);
      return;
    }
    sheepSpriteWaiters.push(callback);
    if (sheepSpriteLoading) return;

    sheepSpriteLoading = true;
    var promise = loadAsset("ab:game/texture/game/img_yx_yang", cc.SpriteFrame);
      if (!promise || !promise.then) {
        sheepSpriteLoading = false;
        sheepSpriteWaiters = [];
        return;
      }

    promise.then(function (frame) {
      sheepSpriteFrame = frame;
      sheepSpriteLoading = false;
      var waiters = sheepSpriteWaiters || [];
      sheepSpriteWaiters = [];
      console.log("restore sheep sprite frame loaded", !!frame);
      for (var i = 0; i < waiters.length; i++) waiters[i](frame);
    }).catch(function () {
      sheepSpriteLoading = false;
      sheepSpriteWaiters = [];
    });
  }

  function applySheepFrameUnder(node, frame) {
    if (!node || !node.isValid || !frame) return 0;
    var changed = 0;
    var sprite = node.getComponent && node.getComponent(cc.Sprite);
    if (sprite) {
      if (sprite.spriteFrame !== frame && !sprite._restoreOriginalSpriteFrame) sprite._restoreOriginalSpriteFrame = sprite.spriteFrame;
      var boxW = node._restoreOriginalFitWidth || node.width;
      var boxH = node._restoreOriginalFitHeight || node.height;
      fitSpriteFrameIntoBox(sprite, frame, boxW, boxH, true);
      changed++;
    }

    var children = node.children || [];
    for (var i = 0; i < children.length; i++) {
      changed += applySheepFrameUnder(children[i], frame) || 0;
    }
    return changed;
  }

  function isLikelyBoardAnimalSprite(node) {
    if (!node || !node.isValid || !node.activeInHierarchy) return false;
    if (animalNodeNames[node.name]) return true;
    var sprite = node.getComponent && node.getComponent(cc.Sprite);
    if (!sprite || !sprite.spriteFrame) return false;
    var w = node.width || 0;
    var h = node.height || 0;
    if (w < 45 || h < 45 || w > 180 || h > 190) return false;
    var name = "";
    try { name = sprite.spriteFrame.name || sprite.spriteFrame._name || ""; } catch (err) {}
    if (name.indexOf("img_yx_btn") === 0 || name === "img_yx_shp" || name === "img_yx_frenxiang" || name === "img_yx_fanzhuan" || name === "img_yx_dasan" || name === "img_yx_zhuazou") return false;
    if (name.indexOf("img_yx_") === 0 && node.parent && animalNodeNames[node.parent.name]) return true;
    return false;
  }

  function restoreAnimalFrameUnder(node) {
    if (!node || !node.isValid) return;
    var sprite = node.getComponent && node.getComponent(cc.Sprite);
    if (sprite && sprite._restoreOriginalSpriteFrame) {
      sprite.spriteFrame = sprite._restoreOriginalSpriteFrame;
      sprite._restoreOriginalSpriteFrame = null;
      restoreSpriteDisplayBox(sprite);
    }
    var children = node.children || [];
    for (var i = 0; i < children.length; i++) restoreAnimalFrameUnder(children[i]);
  }

  function replaceAnimalNodes(root, frame) {
    if (!root || !root.isValid || !frame) return 0;
    if (isLikelyBoardAnimalSprite(root)) {
      return applySheepFrameUnder(root, frame) || 0;
    }

    var changed = 0;
    var children = root.children || [];
    for (var i = 0; i < children.length; i++) {
      changed += replaceAnimalNodes(children[i], frame) || 0;
    }
    return changed;
  }

  function restoreAnimalNodes(root) {
    if (!root || !root.isValid) return;
    if (animalNodeNames[root.name]) {
      restoreAnimalFrameUnder(root);
      return;
    }
    var children = root.children || [];
    for (var i = 0; i < children.length; i++) restoreAnimalNodes(children[i]);
  }

  function restoreOriginalAnimalUi(root) {
    if (!root || !root.isValid) return;
    var comps = root.getComponents ? root.getComponents(cc.Component) : [];
    for (var i = 0; i < comps.length; i++) {
      var comp = comps[i];
      if (!isAnimalRuntimeComponent(comp)) continue;
      if (getHomeColorMode() === "pure") {
        applyReplacementImageToComponent(comp);
        continue;
      }
      restoreOriginalAnimalSpine(comp);
      if (typeof comp._restoreOriginalAnimalType === "number") {
        comp.aniType = comp._restoreOriginalAnimalType;
        if (comp.aniData) comp.aniData.type = comp._restoreOriginalAnimalType;
        if (typeof comp.type === "number") comp.type = comp._restoreOriginalAnimalType;
        if (typeof comp.skinType === "number") comp.skinType = comp._restoreOriginalAnimalType;
      }
      comp._restoreSheepAnimKey = null;
      if (isSheepAnimalComponent(comp)) {
        applyReplacementImageToComponent(comp);
        continue;
      }
      if (typeof comp.onIdle === "function") {
        try { comp.onIdle(); } catch (errIdle) {}
      } else if (comp.aniSpine && typeof comp.getAniName === "function" && typeof comp.playAnimation === "function") {
        try {
          var state = comp.state || comp.aniState || 0;
          var aniName = comp.getAniName(comp.aniType, state);
          if (aniName) comp.playAnimation(aniName, true);
        } catch (errPlay) {}
      }
    }
    if (getHomeColorMode() !== "pure") restoreAnimalNodes(root);
    var children = root.children || [];
    for (var j = 0; j < children.length; j++) restoreOriginalAnimalUi(children[j]);
  }

  function installPureSheepPatch() {
    if (!GameGlobal.cc || !cc.director || !cc.director.getScene()) return;
    var scene = cc.director.getScene();
    if (isHomeScene(scene)) return;
    try {
      if (!scene._restoreFrameRate60 && cc.game && cc.game.setFrameRate) {
        cc.game.setFrameRate(60);
        scene._restoreFrameRate60 = true;
      }
    } catch (err) {}
    ensureGameColorModeButton(scene);
    if (getHomeColorMode() === "pure") {
      forcePureSheepMode();
      clearReplacementAnimalSpriteNodes(scene);
    } else {
      restoreAnimalNodes(scene);
      console.log("restore runtime animal components", scene && scene.name, refreshExistingAnimalSkins(scene, false) || 0);
    }
  }

  function openAnimalDec(data) {
    try {
      var globals = getGameGlobals();
      if (!data || !data.name) return;
      var repl = typeof GameGlobal !== "undefined" && GameGlobal._restoreIllustratedReplacementData;
      var dec = data.dec || (repl && repl.getDesc && repl.getDesc(data.name)) || data.name;
      var viewData = { name: data.name, dec: dec };
      globals.globalData._restoreAnimalDecData = viewData;
      globals.globalData._restorePuzzleAnimalData = null;
      globals.globalData.animalName = viewData.name;
      globals.globalData.animalDec = viewData.dec;
      try { globals.globalData.gui.remove(globals.uiId.AnimalDecPanel); } catch (removeErr) {}
      globals.globalData.gui.open(globals.uiId.AnimalDecPanel);
      try {
        patchAnimalDecPanel(cc.director && cc.director.getScene && cc.director.getScene(), viewData);
        installAnimalDecButtonPatch(cc.director && cc.director.getScene && cc.director.getScene());
      } catch (patchErr) {}
      setTimeout(function () {
        try {
          patchAnimalDecPanel(cc.director && cc.director.getScene && cc.director.getScene(), viewData);
          installAnimalDecButtonPatch(cc.director && cc.director.getScene && cc.director.getScene());
        } catch (err0) {}
      }, 0);
      setTimeout(function () {
        try {
          patchAnimalDecPanel(cc.director && cc.director.getScene && cc.director.getScene(), viewData);
          installAnimalDecButtonPatch(cc.director && cc.director.getScene && cc.director.getScene());
        } catch (err1) {}
      }, 80);
      setTimeout(function () {
        try {
          patchAnimalDecPanel(cc.director && cc.director.getScene && cc.director.getScene(), viewData);
          installAnimalDecButtonPatch(cc.director && cc.director.getScene && cc.director.getScene());
        } catch (err2) {}
      }, 240);
    } catch (err) {
      console.error("restore illustrated open dec failed", err && err.message ? err.message : err);
    }
  }

  function closeIllustratedPanel() {
    try {
      var globals = getGameGlobals();
      globals.globalData.platform && globals.globalData.platform.playEffect && globals.globalData.platform.playEffect("ab:audio/click");
      globals.globalData.gui.remove(globals.uiId.IllustratedPanel);
      console.log("restore illustrated close");
    } catch (err) {
      console.error("restore illustrated close failed", err && err.message ? err.message : err);
    }
  }

  function renderIllustratedFallback(panel) {
    if (!panel || panel._restoreIllustratedRenderVersion === illustratedRenderVersion || panel._restoreIllustratedRendering) return;
    var scrollViewNode = findNode(panel, "scrollView");
    var content = getContentNode(scrollViewNode);
    if (!content) return;

    var data = getIllustrateData();
    var globals = getGameGlobals();
    var unlockCount = Math.max(0, globals.globalData.user && globals.globalData.user.illustrateLock || 0);
    preloadIllustratedFrames(9);
    var collectLab = findNode(panel, "collectLab");
    if (collectLab && collectLab.getComponent(cc.Label)) {
      collectLab.getComponent(cc.Label).string = unlockCount + "/30";
    }

    panel._restoreIllustratedRendering = true;
    renderIllustratedItems(panel, content, data, unlockCount, null);
  }

  function preloadIllustratedFrames(count) {
    try {
      var data = getIllustrateData();
      count = Math.min(data.length, count || 9);
      preloadIllustrateFrame("ab:game/texture/illustrated/img_tj_dkzhi");
      for (var i = 0; i < count; i++) {
        if (!data[i] || !data[i].name) continue;
        preloadIllustrateFrame("ab:game/texture/illustrated/animalGray/" + data[i].name);
        preloadIllustrateFrame("ab:game/texture/illustrated/animal/" + data[i].name);
      }
    } catch (err) {}
  }

  function preloadIllustrateFrame(path) {
    if (!path || illustrateFrameCache[path] || illustrateFrameLoading[path]) return;
    var _riB64 = getIllustratedReplacementBase64(path);
    if (_riB64) {
      illustrateFrameLoading[path] = [];
      loadRemoteTextureAsSpriteFrame([_riB64], 0, function (_riFrame) {
        if (_riFrame) {
          illustrateFrameCache[path] = _riFrame;
          applyLoadedIllustrateFrame(path, _riFrame);
        } else {
          delete illustrateFrameLoading[path];
        }
      });
      return;
    }
    illustrateFrameLoading[path] = [];
    try {
      var resModule = requireGameModule("Res");
      var res = resModule.default || resModule;
      if (res && res.load) {
        res.load(path, cc.SpriteFrame).then(function (frame) {
          illustrateFrameCache[path] = frame;
          applyLoadedIllustrateFrame(path, frame);
        }).catch(function () {
          delete illustrateFrameLoading[path];
        });
      }
    } catch (err) {
      delete illustrateFrameLoading[path];
    }
  }

  function updateOriginalIllustrateItem(item, itemData) {
    var comps = item.getComponents(cc.Component) || [];
    for (var i = 0; i < comps.length; i++) {
      if (comps[i] && typeof comps[i].updateView === "function") {
        comps[i].updateView(itemData);
        return true;
      }
    }
    return false;
  }

  function restoreOriginalIllustrateItemView(item, itemData, unlocked) {
    if (!item || !item.isValid) return;

    var nameLabel = findNode(item, "aName");
    if (nameLabel && nameLabel.getComponent(cc.Label)) {
      nameLabel.getComponent(cc.Label).string = unlocked ? itemData.name : "\u672a\u89e3\u9501";
      styleIllustrateLabel(nameLabel);
    }

    var grayNode = findNode(item, "gray");
    var animalNode = findNode(item, "animal");
    if (grayNode && grayNode.getComponent(cc.Sprite)) {
      grayNode.active = true;
      loadIllustrateSpriteFit(normalizeIllustrateAnimalSpriteNode(grayNode), "ab:game/texture/illustrated/animalGray/" + itemData.name, 183, 119);
    }
    if (animalNode && animalNode.getComponent(cc.Sprite)) {
      animalNode.active = !!unlocked;
      loadIllustrateSpriteFit(normalizeIllustrateAnimalSpriteNode(animalNode, grayNode), "ab:game/texture/illustrated/animal/" + itemData.name, 183, 119);
    }
  }

  function renderIllustratedItems(panel, content, data, unlockCount, prefab) {
    content.removeAllChildren();
    content.setAnchorPoint && content.setAnchorPoint(0, 1);
    content.setPosition && content.setPosition(0, 0);

    var cols = 3;
    var itemW = 290;
    var itemH = 366;
    var gapX = 20;
    var gapY = 60;
    var left = 10;
    var top = 0;
    var rows = Math.ceil(data.length / cols);
    var contentW = Math.max(content.parent && content.parent.width || 0, left + cols * itemW + (cols - 1) * gapX);
    var contentH = rows * itemH + Math.max(0, rows - 1) * gapY + top;
    content.setContentSize(contentW, contentH);

    for (var i = 0; i < data.length; i++) {
      (function (index) {
        var itemData = data[index];
        var col = index % cols;
        var row = Math.floor(index / cols);
        var x = itemW * (0.5 + col) + gapX * col + left;
        var y = -itemH * (0.5 + row) - gapY * row - top;
        var unlocked = index < unlockCount;
        var item;

        if (prefab) {
          item = cc.instantiate(prefab);
          item.parent = content;
          item.setPosition(x, y);
          item.setScale && item.setScale(1);
          item.name = "restoreIllustrateItem";
          if (!updateOriginalIllustrateItem(item, {
            index: index,
            name: itemData.name,
            dec: itemData.dec || ""
          })) {
            renderManualIllustrateItem(item, itemData, unlocked);
          }
          restoreOriginalIllustrateItemView(item, itemData, unlocked);
        } else {
          item = new cc.Node("restoreIllustrateItem");
          item.parent = content;
          item.setPosition(x, y);
          item.setContentSize(itemW, itemH);
          item.name = "restoreIllustrateItem";
          renderManualIllustrateItem(item, itemData, unlocked);
        }

        item.on(cc.Node.EventType.TOUCH_END, function (event) {
          event.stopPropagation && event.stopPropagation();
          if (unlocked) openAnimalDec(itemData);
        });
      })(i);
    }

    panel._restoreIllustratedRendering = false;
    panel._restoreIllustratedRenderVersion = illustratedRenderVersion;
    console.log("restore illustrated fallback rendered", data.length, unlockCount, prefab ? "prefab" : "manual");
  }

  function renderManualIllustrateItem(item, itemData, unlocked) {
    item.removeAllChildren && item.removeAllChildren();
    item.setContentSize(290, 366);
    var bg = item.getComponent(cc.Sprite) || item.addComponent(cc.Sprite);
    bg.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    loadIllustrateSprite(bg, "ab:game/texture/illustrated/img_tj_dkzhi");

    var grayNode = new cc.Node("gray");
    grayNode.parent = item;
    grayNode.setPosition(0, 35);
    grayNode.setContentSize(183, 119);
    var graySprite = grayNode.addComponent(cc.Sprite);
    graySprite.sizeMode = cc.Sprite.SizeMode.RAW;
    loadIllustrateSpriteFit(graySprite, "ab:game/texture/illustrated/animalGray/" + itemData.name, 183, 119);

    var animalNode = new cc.Node("animal");
    animalNode.parent = item;
    animalNode.active = !!unlocked;
    animalNode.setPosition(0, 35);
    animalNode.setContentSize(183, 119);
    var animalSprite = animalNode.addComponent(cc.Sprite);
    animalSprite.sizeMode = cc.Sprite.SizeMode.RAW;
    loadIllustrateSpriteFit(animalSprite, "ab:game/texture/illustrated/animal/" + itemData.name, 183, 119);

    var nameNode = makeLabel(item, unlocked ? itemData.name : "\u672a\u89e3\u9501", 26, cc.Color.WHITE, 0, -134.367, 88, 58.4);
    nameNode.name = "aName";
    styleIllustrateLabel(nameNode);
  }

  function installIllustratedPanelPatch() {
    if (!GameGlobal.cc || !cc.director || !cc.director.getScene()) return;
    var scene = cc.director.getScene();
    var panel = findPanelWithChildren(scene, ["closeBtn", "collectLab", "scrollView"]);
    if (!panel || !panel.activeInHierarchy) return;
    clearRankFallbackArtifacts(panel);

    var closeBtn = findChild(panel, "closeBtn") || findChild(panel, "backBtn") || findChild(panel, "btnClose");
    if (closeBtn) addDeepTouch(closeBtn, "illustratedCloseBtn", closeIllustratedPanel);

    if (!panel._restoreIllustratedCloseSystemTouch && cc.systemEvent && cc.SystemEvent && cc.SystemEvent.EventType) {
      cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, function (event) {
        if (!panel.isValid || !panel.activeInHierarchy) return;
        var point = event.getLocation && event.getLocation();
        var panelBox = panel.getBoundingBoxToWorld && panel.getBoundingBoxToWorld();
        var inTopRight = panelBox && point && point.x > panelBox.x + panelBox.width * 0.82 && point.y > panelBox.y + panelBox.height * 0.82;
        if ((closeBtn && closeBtn.isValid && pointInNodeTree(closeBtn, point)) || inTopRight) {
          event.stopPropagation && event.stopPropagation();
          runPauseAction("illustratedCloseBtn", closeIllustratedPanel);
        }
      });
      panel._restoreIllustratedCloseSystemTouch = true;
      console.log("restore illustrated close patch installed");
    }

    var scrollViewNode = findNode(panel, "scrollView");
    var content = getContentNode(scrollViewNode);
    var empty = !content || !content.children || content.children.length === 0;
    if (empty || panel._restoreIllustratedRenderVersion !== illustratedRenderVersion) renderIllustratedFallback(panel);
  }

  function installAnimalDecPanelPatch() {
    if (!GameGlobal.cc || !cc.director || !cc.director.getScene()) return;
    try {
      var globals = getGameGlobals();
      var data = globals.globalData && (globals.globalData._restoreAnimalDecData || globals.globalData._restorePuzzleAnimalData);
      if (data) patchAnimalDecPanel(cc.director.getScene(), data);
      installAnimalDecButtonPatch(cc.director.getScene());
    } catch (err) {}
  }

  function scrubFirstFrameButtons() {
    try { preloadHomeEntryReplacementFrames(); } catch (errPreload) {}
    try { installHomeButtonPatch(); } catch (err1) {}
    try { installHideGameCirclePatch(); } catch (err0) {}
    try { installGamePropPatch(); } catch (err2) {}
  }

  function scrubFirstFrameButtonsSoon(duration) {
    var start = Date.now();
    var total = typeof duration === "number" ? duration : 360;
    var tick = function () {
      scrubFirstFrameButtons();
      if (Date.now() - start >= total) return;
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(tick);
      else setTimeout(tick, 16);
    };
    tick();
  }

  function installFirstFrameButtonScrubHooks() {
    if (!cc || !cc.director || !cc.Director || cc.director._restoreFirstFrameButtonScrubHooks) return;
    cc.director._restoreFirstFrameButtonScrubHooks = true;
    var scrub = function () { scrubFirstFrameButtons(); };
    try { cc.director.on(cc.Director.EVENT_BEFORE_UPDATE, scrub); } catch (err0) {}
    try { cc.director.on(cc.Director.EVENT_BEFORE_DRAW, scrub); } catch (err1) {}
    try { cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () { scrubFirstFrameButtonsSoon(500); }); } catch (err2) {}
  }

  installFirstFrameButtonScrubHooks();
  preloadHomeEntryReplacementFrames();
  scrubFirstFrameButtonsSoon(480);
  setInterval(installStartPatch, 500);
  setInterval(installInitialSettingStatePatch, 500);
  setInterval(installHomeButtonPatch, 500);
  setInterval(installHomePuzzlePatch, 500);
  setInterval(installHideGameCirclePatch, 500);
  setInterval(installPuzzleRewardPatch, 500);
  setInterval(installGamePropPatch, 500);
  setInterval(installPausePanelPatch, 500);
  setInterval(installMenuPanelPatch, 500);
  setInterval(installRankPanelPatch, 500);
  setInterval(installIllustratedPanelPatch, 500);
  setInterval(installPureSheepPatch, 1000);
  // setInterval(tickSheepSequence, sheepMotionFrameMs);
  setInterval(installAnimalDecPanelPatch, 500);


// Load large replacement image data only when a replacement is first requested.
(function () {
  if (typeof GameGlobal === "undefined") return;
  var proxy = null;
  var illustratedLoaded = false;
  var puzzleLoaded = false;

  function loadIllustrated() {
    if (!illustratedLoaded) {
      illustratedLoaded = true;
      try { require("./illustrated-replacement-data.js"); }
      catch (err) { console.error("load illustrated replacement data failed", err && err.message ? err.message : err); }
    }
    return GameGlobal._restoreIllustratedReplacementData || proxy;
  }

  function loadPuzzle() {
    var repl = loadIllustrated();
    if (!puzzleLoaded) {
      puzzleLoaded = true;
      try { ensurePuzzleReplacementDataLoaded(); }
      catch (err) { console.error("load puzzle replacement data failed", err && err.message ? err.message : err); }
      repl = GameGlobal._restoreIllustratedReplacementData || repl;
    }
    return repl || proxy;
  }

  proxy = {
    getBase64: function (name, gray) {
      var repl = loadIllustrated();
      return repl && repl !== proxy && repl.getBase64 ? repl.getBase64(name, gray) : null;
    },
    getDesc: function (name) {
      var repl = loadIllustrated();
      return repl && repl !== proxy && repl.getDesc ? repl.getDesc(name) : "";
    },
    getIconBase64: function (name) {
      var repl = loadIllustrated();
      return repl && repl !== proxy && repl.getIconBase64 ? repl.getIconBase64(name) : null;
    },
    getList: function () {
      var repl = loadIllustrated();
      return repl && repl !== proxy && repl.getList ? repl.getList() : [];
    },
    getPuzzleBase64: function (name) {
      var repl = loadPuzzle();
      return repl && repl !== proxy && repl.getPuzzleBase64 ? repl.getPuzzleBase64(name) : null;
    }
  };

  try {
    Object.defineProperty(proxy, "_puzzleData", {
      get: function () {
        var repl = loadPuzzle();
        return repl && repl !== proxy ? repl._puzzleData : null;
      }
    });
  } catch (err2) {}

  GameGlobal._restoreIllustratedReplacementData = proxy;
})();

})();
