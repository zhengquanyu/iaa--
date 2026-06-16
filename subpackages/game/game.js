var global = (function() {
    return this
})();
if (!global && typeof GameGlobal !== 'undefined') global = GameGlobal;
var pluginInfoMap = {};;
global.requirePlugin = global.requirePlugin || function(path) {
    var position = path.indexOf('/');
    var alias = '';
    var pagePath = '';
    if (position !== -1) {
        alias = path.substr(0, position);
        pagePath = path.substr(position + 1, path.length);
    } else {
        alias = path;
    }
    if (pluginInfoMap.hasOwnProperty(alias)) {
        var realPath = '';
        if (pagePath.length === 0) {
            realPath = '__plugin__/' + pluginInfoMap[alias].appid;
            return require(realPath);
        } else {
            realPath = '__plugin__/' + pluginInfoMap[alias].appid + '/' + pagePath;
            return require(realPath);
        }
    } else {
        console.error('not found alias: ', alias);
        throw new Error('Plugin ' + alias + ' is not defined.')
    }
};
define("subpackages/game/game.js", function(require, module, exports) {
    "use strict";

    var _typeof2 = require("../../@babel/runtime/helpers/typeof");
    window.__require = function t(e, n, i) {
        function o(a, c) {
            if (!n[a]) {
                if (!e[a]) {
                    var s = a.split("/");
                    if (s = s[s.length - 1], !e[s]) {
                        var l = "function" == typeof __require && __require;
                        if (!c && l) return l(s, !0);
                        if (r) return r(s, !0);
                        throw new Error("Cannot find module '" + a + "'");
                    }
                    a = s;
                }
                var u = n[a] = {
                    exports: {}
                };
                e[a][0].call(u.exports, function(t) {
                    return o(e[a][1][t] || t);
                }, u, u.exports, t, e, n, i);
            }
            return n[a].exports;
        }
        for (var r = "function" == typeof __require && __require, a = 0; a < i.length; a++) o(i[a]);
        return o;
    }({
        AnimalDecPanel: [function(t, e, n) {
            "use strict";

            cc._RF.push(e, "a6baaOkf/BEtLQnNFRbJnwJ", "AnimalDecPanel");
            var _i,
                o = this && this.__extends || (_i = function i(t, e) {
                    return (_i = Object.setPrototypeOf || {
                            __proto__: []
                        }
                        instanceof Array && function(t, e) {
                            t.__proto__ = e;
                        } || function(t, e) {
                            for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
                        })(t, e);
                }, function(t, e) {
                    function n() {
                        this.constructor = t;
                    }
                    _i(t, e), t.prototype = null === e ? Object.create(e) : (n.prototype = e.prototype, new n());
                }),
                r = this && this.__decorate || function(t, e, n, i) {
                    var o,
                        r = arguments.length,
                        a = r < 3 ? e : null === i ? i = Object.getOwnPropertyDescriptor(e, n) : i;
                    if ("object" == (typeof Reflect === "undefined" ? "undefined" : _typeof2(Reflect)) && "function" == typeof Reflect.decorate) a = Reflect.decorate(t, e, n, i);
                    else
                        for (var c = t.length - 1; c >= 0; c--)(o = t[c]) && (a = (r < 3 ? o(a) : r > 3 ? o(e, n, a) : o(e, n)) || a);
                    return r > 3 && a && Object.defineProperty(e, n, a), a;
                },
                a = this && this.__awaiter || function(t, e, n, i) {
                    return new(n || (n = Promise))(function(o, r) {
                        function a(t) {
                            try {
                                s(i.next(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function c(t) {
                            try {
                                s(i.throw(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function s(t) {
                            var e;
                            t.done ? o(t.value) : (e = t.value, e instanceof n ? e : new n(function(t) {
                                t(e);
                            })).then(a, c);
                        }
                        s((i = i.apply(t, e || [])).next());
                    });
                },
                c = this && this.__generator || function(t, e) {
                    var n,
                        i,
                        o,
                        r,
                        a = {
                            label: 0,
                            sent: function sent() {
                                if (1 & o[0]) throw o[1];
                                return o[1];
                            },
                            trys: [],
                            ops: []
                        };
                    return r = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    }, "function" == typeof Symbol && (r[Symbol.iterator] = function() {
                        return this;
                    }), r;

                    function c(t) {
                        return function(e) {
                            return s([t, e]);
                        };
                    }

                    function s(r) {
                        if (n) throw new TypeError("Generator is already executing.");
                        for (; a;) try {
                            if (n = 1, i && (o = 2 & r[0] ? i.return : r[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, r[1])).done) return o;
                            switch (i = 0, o && (r = [2 & r[0], o.value]), r[0]) {
                                case 0:
                                case 1:
                                    o = r;
                                    break;
                                case 4:
                                    return a.label++, {
                                        value: r[1],
                                        done: !1
                                    };
                                case 5:
                                    a.label++, i = r[1], r = [0];
                                    continue;
                                case 7:
                                    r = a.ops.pop(), a.trys.pop();
                                    continue;
                                default:
                                    if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === r[0] || 2 === r[0])) {
                                        a = 0;
                                        continue;
                                    }
                                    if (3 === r[0] && (!o || r[1] > o[0] && r[1] < o[3])) {
                                        a.label = r[1];
                                        break;
                                    }
                                    if (6 === r[0] && a.label < o[1]) {
                                        a.label = o[1], o = r;
                                        break;
                                    }
                                    if (o && a.label < o[2]) {
                                        a.label = o[2], a.ops.push(r);
                                        break;
                                    }
                                    o[2] && a.ops.pop(), a.trys.pop();
                                    continue;
                            }
                            r = e.call(t, a);
                        } catch (c) {
                            r = [6, c], i = 0;
                        } finally {
                            n = o = 0;
                        }
                        if (5 & r[0]) throw r[1];
                        return {
                            value: r[0] ? r[1] : void 0,
                            done: !0
                        };
                    }
                };
            Object.defineProperty(n, "__esModule", {
                value: !0
            });
            var s = t("../../../script/core/event/ClientEvent"),
                l = t("../../../script/core/res/Res"),
                u = t("../../../script/game/data/GameApp"),
                p = t("../../../script/game/data/GameUIConfig"),
                h = t("../../../script/game/data/Global"),
                f = cc._decorator,
                d = f.ccclass,
                m = (f.property, function(t) {
                    function e() {
                        var e = null !== t && t.apply(this, arguments) || this;
                        return e.fallSpeed = 50, e.swayAmplitude = 30, e.swayFrequency = 2, e.spawnCount = 20, e.spawnXMin = -600, e.spawnXMax = 400, e.spawnYMin = 700, e.spawnYMax = 500, e;
                    }
                    return o(e, t), e.prototype.onLoad = function() {
                        this.closeBtn = cc.find("closeBtn", this.node), this.shareBtn = cc.find("shareBtn", this.node), this.img_js_bg = cc.find("img_js_bg", this.node), this.animalName = cc.find("animalName", this.node).getComponent(cc.Label), this.animalDec = cc.find("animalDec", this.node).getComponent(cc.Label), this.animalIcon = cc.find("animalIcon", this.node).getComponent(cc.Sprite), this.title = cc.find("title", this.node), this.initPage();
                    }, e.prototype.onEnable = function() {
                        h.default.platform.showInterstitialAd(), this.closeBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.shareBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this);
                    }, e.prototype.onDisable = function() {
                        cc.Tween.stopAllByTarget(this.img_js_bg), this.closeBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.shareBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this);
                    }, e.prototype.initPage = function() {
                        this.animalName.string = h.default.animalName, this.animalDec.string = h.default.animalDec, this.loadSprite(this.animalIcon, "animal/" + h.default.animalName), cc.Tween.stopAllByTarget(this.img_js_bg), cc.tween().target(this.img_js_bg).by(1, {
                            angle: 180
                        }).repeatForever().start(), this.spawnRibbonsUniformly(), h.default.isPuzzle && (this.title.active = !0);
                    }, e.prototype.fallCd = function(t, e) {
                        var n = this,
                            i = cc.instantiate(u.GameApp.cdPrefab);
                        this.node.addChild(i);
                        var o = t,
                            r = e;
                        i.setPosition(o, r), i.angle = 360 * Math.random();
                        var a = Math.ceil(5 * Math.random());
                        this.loadSprite(i.getComponent(cc.Sprite), "cd/cd" + a);
                        var c = Date.now(),
                            s = function s() {
                                var t = n.getOffsetValue(n.swayAmplitude),
                                    e = n.getOffsetValue(n.swayFrequency),
                                    a = n.getOffsetValue(n.fallSpeed),
                                    l = (Date.now() - c) / 1e3,
                                    u = r - a * l;
                                r = u;
                                var p = o + Math.sin(l * e * 2 * Math.PI) * t;
                                o = p;
                                var h = i.angle + 50 * Math.sin(l * e * 2 * Math.PI);
                                i.angle = h, i.setPosition(p, u), u < -500 && (i.removeFromParent(), n.unschedule(s), i.destroy());
                            };
                        this.schedule(s, 0);
                    }, e.prototype.getOffsetValue = function(t) {
                        return t * (Math.random() - .5) + t;
                    }, e.prototype.spawnRibbonsUniformly = function() {
                        var t = this;
                        this.jitteredPoints(this.spawnCount, this.spawnXMin, this.spawnXMax, this.spawnYMin, this.spawnYMax).forEach(function(e) {
                            t.fallCd(e.x, e.y);
                        });
                    }, e.prototype.jitteredPoints = function(t, e, n, i, o) {
                        for (var r = [], a = Math.ceil(Math.sqrt(t)), c = (n - e) / a, s = (o - i) / Math.ceil(t / a), l = 0; l < t; l++) {
                            var u = Math.floor(l / a),
                                p = l % a,
                                h = Math.random() * c,
                                f = Math.random() * s;
                            r.push({
                                x: e + p * c + h,
                                y: i + u * s + f
                            });
                        }
                        return r;
                    }, e.prototype.onClicked = function(t) {
                        switch (h.default.platform.playEffect("ab:audio/click"), s.ED.send(s.ClientEvent.SCREEN_CLICK, t), t.target.name) {
                            case "closeBtn":
                                h.default.isPuzzle && s.ED.send(s.ClientEvent.UPDATE_PUZZLE_MASK), this.close();
                                break;
                            case "shareBtn":
                                if (cc.sys.isBrowser) return;
                                h.default.platform.share(null);
                        }
                    }, e.prototype.loadSprite = function(t, e) {
                        return a(this, void 0, void 0, function() {
                            var n, i;
                            return c(this, function(o) {
                                switch (o.label) {
                                    case 0:
                                        return n = "ab:game2/texture/animalLock/" + e, i = t, [4, l.default.load(n, cc.SpriteFrame)];
                                    case 1:
                                        return i.spriteFrame = o.sent(), [2];
                                }
                            });
                        });
                    }, e.prototype.close = function() {
                        h.default.gui.remove(p.UIID.AnimalDecPanel);
                    }, r([d], e);
                }(cc.Component));
            n.default = m, cc._RF.pop();
        }, {
            "../../../script/core/event/ClientEvent": void 0,
            "../../../script/core/res/Res": void 0,
            "../../../script/game/data/GameApp": void 0,
            "../../../script/game/data/GameUIConfig": void 0,
            "../../../script/game/data/Global": void 0
        }],
        IllustratedPanel: [function(t, e, n) {
            "use strict";

            cc._RF.push(e, "8cb2eIOOXRCJLxY5WB2RHHE", "IllustratedPanel");
            var _i2,
                o = this && this.__extends || (_i2 = function i(t, e) {
                    return (_i2 = Object.setPrototypeOf || {
                            __proto__: []
                        }
                        instanceof Array && function(t, e) {
                            t.__proto__ = e;
                        } || function(t, e) {
                            for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
                        })(t, e);
                }, function(t, e) {
                    function n() {
                        this.constructor = t;
                    }
                    _i2(t, e), t.prototype = null === e ? Object.create(e) : (n.prototype = e.prototype, new n());
                }),
                r = this && this.__decorate || function(t, e, n, i) {
                    var o,
                        r = arguments.length,
                        a = r < 3 ? e : null === i ? i = Object.getOwnPropertyDescriptor(e, n) : i;
                    if ("object" == (typeof Reflect === "undefined" ? "undefined" : _typeof2(Reflect)) && "function" == typeof Reflect.decorate) a = Reflect.decorate(t, e, n, i);
                    else
                        for (var c = t.length - 1; c >= 0; c--)(o = t[c]) && (a = (r < 3 ? o(a) : r > 3 ? o(e, n, a) : o(e, n)) || a);
                    return r > 3 && a && Object.defineProperty(e, n, a), a;
                };
            Object.defineProperty(n, "__esModule", {
                value: !0
            });
            var a = t("../../../script/core/display/ListView"),
                c = t("../../../script/core/event/ClientEvent"),
                s = t("../../../script/game/data/GameUIConfig"),
                l = t("../../../script/game/data/Global"),
                u = t("../../../script/game/data/StaticData"),
                p = t("../../../script/game/enum/Enum"),
                h = cc._decorator,
                f = h.ccclass,
                d = (h.property, function(t) {
                    function e() {
                        return null !== t && t.apply(this, arguments) || this;
                    }
                    return o(e, t), e.prototype.onLoad = function() {
                        this.closeBtn = cc.find("closeBtn", this.node), this.collectLab = cc.find("collectLab", this.node).getComponent(cc.Label), this.scrollView = cc.find("scrollView", this.node), this.collectLab.string = l.default.user.illustrateLock + "/30";
                        for (var t = u.StaticData.illustrateData, e = [], n = 0; n < t.length; n++) {
                            var i = {
                                index: 0,
                                name: "",
                                dec: ""
                            };
                            i.index = n, i.name = t[n].name, i.dec = t[n].dec, e.push(i);
                        }
                        this.scrollView.getComponent(a.default).setData(e);
                    }, e.prototype.onEnable = function() {
                        l.default.platform.showInterstitialAd(), this.closeBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this);
                    }, e.prototype.onDisable = function() {
                        l.default.curPage == p.CurPage.home && c.ED.send(c.ClientEvent.LOAD_GAME_CLUB), this.closeBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this);
                    }, e.prototype.onClicked = function(t) {
                        switch (l.default.platform.playEffect("ab:audio/click"), c.ED.send(c.ClientEvent.SCREEN_CLICK, t), t.target.name) {
                            case "closeBtn":
                                this.close();
                        }
                    }, e.prototype.close = function() {
                        l.default.gui.remove(s.UIID.IllustratedPanel);
                    }, r([f], e);
                }(cc.Component));
            n.default = d, cc._RF.pop();
        }, {
            "../../../script/core/display/ListView": void 0,
            "../../../script/core/event/ClientEvent": void 0,
            "../../../script/game/data/GameUIConfig": void 0,
            "../../../script/game/data/Global": void 0,
            "../../../script/game/data/StaticData": void 0,
            "../../../script/game/enum/Enum": void 0
        }],
        MainPanel: [function(t, e, n) {
            "use strict";

            cc._RF.push(e, "91d08nPJaJAv4+8xRvjbDgm", "MainPanel");
            var _i3,
                o = this && this.__extends || (_i3 = function i(t, e) {
                    return (_i3 = Object.setPrototypeOf || {
                            __proto__: []
                        }
                        instanceof Array && function(t, e) {
                            t.__proto__ = e;
                        } || function(t, e) {
                            for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
                        })(t, e);
                }, function(t, e) {
                    function n() {
                        this.constructor = t;
                    }
                    _i3(t, e), t.prototype = null === e ? Object.create(e) : (n.prototype = e.prototype, new n());
                }),
                r = this && this.__decorate || function(t, e, n, i) {
                    var o,
                        r = arguments.length,
                        a = r < 3 ? e : null === i ? i = Object.getOwnPropertyDescriptor(e, n) : i;
                    if ("object" == (typeof Reflect === "undefined" ? "undefined" : _typeof2(Reflect)) && "function" == typeof Reflect.decorate) a = Reflect.decorate(t, e, n, i);
                    else
                        for (var c = t.length - 1; c >= 0; c--)(o = t[c]) && (a = (r < 3 ? o(a) : r > 3 ? o(e, n, a) : o(e, n)) || a);
                    return r > 3 && a && Object.defineProperty(e, n, a), a;
                },
                a = this && this.__awaiter || function(t, e, n, i) {
                    return new(n || (n = Promise))(function(o, r) {
                        function a(t) {
                            try {
                                s(i.next(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function c(t) {
                            try {
                                s(i.throw(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function s(t) {
                            var e;
                            t.done ? o(t.value) : (e = t.value, e instanceof n ? e : new n(function(t) {
                                t(e);
                            })).then(a, c);
                        }
                        s((i = i.apply(t, e || [])).next());
                    });
                },
                c = this && this.__generator || function(t, e) {
                    var n,
                        i,
                        o,
                        r,
                        a = {
                            label: 0,
                            sent: function sent() {
                                if (1 & o[0]) throw o[1];
                                return o[1];
                            },
                            trys: [],
                            ops: []
                        };
                    return r = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    }, "function" == typeof Symbol && (r[Symbol.iterator] = function() {
                        return this;
                    }), r;

                    function c(t) {
                        return function(e) {
                            return s([t, e]);
                        };
                    }

                    function s(r) {
                        if (n) throw new TypeError("Generator is already executing.");
                        for (; a;) try {
                            if (n = 1, i && (o = 2 & r[0] ? i.return : r[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, r[1])).done) return o;
                            switch (i = 0, o && (r = [2 & r[0], o.value]), r[0]) {
                                case 0:
                                case 1:
                                    o = r;
                                    break;
                                case 4:
                                    return a.label++, {
                                        value: r[1],
                                        done: !1
                                    };
                                case 5:
                                    a.label++, i = r[1], r = [0];
                                    continue;
                                case 7:
                                    r = a.ops.pop(), a.trys.pop();
                                    continue;
                                default:
                                    if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === r[0] || 2 === r[0])) {
                                        a = 0;
                                        continue;
                                    }
                                    if (3 === r[0] && (!o || r[1] > o[0] && r[1] < o[3])) {
                                        a.label = r[1];
                                        break;
                                    }
                                    if (6 === r[0] && a.label < o[1]) {
                                        a.label = o[1], o = r;
                                        break;
                                    }
                                    if (o && a.label < o[2]) {
                                        a.label = o[2], a.ops.push(r);
                                        break;
                                    }
                                    o[2] && a.ops.pop(), a.trys.pop();
                                    continue;
                            }
                            r = e.call(t, a);
                        } catch (c) {
                            r = [6, c], i = 0;
                        } finally {
                            n = o = 0;
                        }
                        if (5 & r[0]) throw r[1];
                        return {
                            value: r[0] ? r[1] : void 0,
                            done: !0
                        };
                    }
                },
                s = this && this.__read || function(t, e) {
                    var n = "function" == typeof Symbol && t[Symbol.iterator];
                    if (!n) return t;
                    var i,
                        o,
                        r = n.call(t),
                        a = [];
                    try {
                        for (;
                            (void 0 === e || e-- > 0) && !(i = r.next()).done;) a.push(i.value);
                    } catch (c) {
                        o = {
                            error: c
                        };
                    } finally {
                        try {
                            i && !i.done && (n = r.return) && n.call(r);
                        } finally {
                            if (o) throw o.error;
                        }
                    }
                    return a;
                },
                l = this && this.__values || function(t) {
                    var e = "function" == typeof Symbol && Symbol.iterator,
                        n = e && t[e],
                        i = 0;
                    if (n) return n.call(t);
                    if (t && "number" == typeof t.length) return {
                        next: function next() {
                            return t && i >= t.length && (t = void 0), {
                                value: t && t[i++],
                                done: !t
                            };
                        }
                    };
                    throw new TypeError(e ? "Object is not iterable." : "Symbol.iterator is not defined.");
                },
                u = this && this.__spread || function() {
                    for (var t = [], e = 0; e < arguments.length; e++) t = t.concat(s(arguments[e]));
                    return t;
                };
            Object.defineProperty(n, "__esModule", {
                value: !0
            });
            var p = t("../../../script/core/event/ClientEvent"),
                h = t("../../../script/core/res/Res"),
                f = t("../../../script/game/data/GameApp"),
                d = t("../../../script/game/data/GameUIConfig"),
                m = t("../../../script/game/data/Global"),
                y = t("../../../script/game/data/StaticData"),
                v = t("../../../script/game/enum/Enum"),
                g = t("../../../script/game/gameScipt/AnimalM"),
                b = t("../../../script/util/Util"),
                _ = [{
                    dx: 0,
                    dy: 1
                }, {
                    dx: 1,
                    dy: 0
                }],
                k = cc._decorator,
                C = k.ccclass,
                E = (k.property, function(t) {
                    function e() {
                        var e = null !== t && t.apply(this, arguments) || this;
                        return e.listenerList = [], e.unLockProgress = 0, e;
                    }
                    return o(e, t), e.prototype.onLoad = function() {
                        this.setBtn = cc.find("setBtn", this.node), this.rankBtn = cc.find("rankBtn", this.node), this.shareBtn = cc.find("shareBtn", this.node), this.startBtn = cc.find("startBtn", this.node), this.illustratedBtn = cc.find("illustratedBtn", this.node), this.mapNode = cc.find("mapNode", this.node), m.default.curPage = v.CurPage.home, this.clubBtn = cc.find("clubBtn", this.node), this.img_huakuang = cc.find("img_huakuang", this.node), this.mask = cc.find("mask", this.node), this.puzzle = cc.find("puzzle", this.node).getComponent(cc.Sprite), this.installStartButtonFallback(), this.initPuzzleMask(), this.loadGameClub(), b.Util.btnAnimation(this.startBtn);
                    }, e.prototype.installStartButtonFallback = function() {
                        if (this.startBtn) {
                            var t = this.startBtn.getComponent(cc.Button) || this.startBtn.addComponent(cc.Button),
                                e = new cc.Component.EventHandler;
                            e.target = this.node, e.component = "MainPanel", e.handler = "startGameDirect", t.clickEvents = [e], this.startBtn.on("click", this.startGameDirect, this), this.startBtn["_touchListener"] && (this.startBtn["_touchListener"].swallowTouches = !1);
                            var n = new cc.Node("startBtnHitArea");
                            n.width = Math.max(this.startBtn.width || 0, 680), n.height = Math.max(this.startBtn.height || 0, 260), n.position = this.startBtn.position, n.zIndex = 99999, n.opacity = 0, n.parent = this.node, n.on(cc.Node.EventType.TOUCH_END, this.startGameDirect, this), n.on("click", this.startGameDirect, this), n.addComponent(cc.BlockInputEvents), this.startBtnHitArea = n, console.log("MainPanel start hit area installed", n.width, n.height, n.x, n.y);
                        }
                    }, e.prototype.startGameDirect = function() {
                        console.log("MainPanel startGameDirect", "loadFinish", m.default.loadFinish), m.default.loadFinish ? (m.default.platform.playEffect("ab:audio/click"), p.ED.send(p.ClientEvent.SCREEN_CLICK), this.close(), m.default.gui.open(d.UIID.GamePanel)) : m.default.gui.toast("\u8D44\u6E90\u52A0\u8F7D\u4E2D\uFF0C\u8BF7\u7A0D\u5019\uFF01");
                    }, e.prototype.bindClickDeep = function(t, e) {
                        if (t && (e ? t.on(cc.Node.EventType.TOUCH_END, this.onClicked, this) : t.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), t.children))
                            for (var n = 0; n < t.children.length; n++) this.bindClickDeep(t.children[n], e);
                    }, e.prototype.onEnable = function() {
                        this.node.on(cc.Node.EventType.TOUCH_END, this.onMainPanelTouch, this, !0), cc.systemEvent && cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_END, this.onMainPanelTouch, this), this.bindClickDeep(this.setBtn, !0), this.bindClickDeep(this.rankBtn, !0), this.bindClickDeep(this.shareBtn, !0), this.bindClickDeep(this.startBtn, !0), this.bindClickDeep(this.illustratedBtn, !0), this.bindClickDeep(this.clubBtn, !0), this.listenerList.push(p.ED.on(p.ClientEvent.LOAD_GAME_CLUB, this.loadGameClub, this)), this.listenerList.push(p.ED.on(p.ClientEvent.UPDATE_HOME_PUZZLE_MASK, this.initPuzzleMask, this)), this.bindClickDeep(this.img_huakuang, !0);
                    }, e.prototype.onDisable = function() {
                        this.node.off(cc.Node.EventType.TOUCH_END, this.onMainPanelTouch, this, !0), cc.systemEvent && cc.systemEvent.off(cc.SystemEvent.EventType.TOUCH_END, this.onMainPanelTouch, this), this.startBtnHitArea && (this.startBtnHitArea.destroy(), this.startBtnHitArea = null), this.bindClickDeep(this.setBtn, !1), this.bindClickDeep(this.rankBtn, !1), this.bindClickDeep(this.shareBtn, !1), this.bindClickDeep(this.startBtn, !1), this.bindClickDeep(this.illustratedBtn, !1), this.bindClickDeep(this.clubBtn, !1), this.bindClickDeep(this.img_huakuang, !1);
                        for (var t = 0; t < this.listenerList.length; ++t) p.ED.off(this.listenerList[t]);
                        m.default.platform.hideGameClub();
                    }, e.prototype.onMainPanelTouch = function(t) {
                        var e = t.getLocation && t.getLocation();
                        if (e && this.startBtn && this.startBtn.getBoundingBoxToWorld && this.startBtn.getBoundingBoxToWorld().contains(e)) return console.log("MainPanel capture startBtn", e.x, e.y), t.stopPropagation && t.stopPropagation(), void this.startGameDirect();
                    }, e.prototype.onClicked = function(t) {
                        t.stopPropagation && t.stopPropagation();
                        for (var e = this, n = t.currentTarget || t.target, i = ["setBtn", "rankBtn", "shareBtn", "startBtn", "illustratedBtn", "clubBtn", "img_huakuang"]; n && -1 === i.indexOf(n.name);) n = n.parent;
                        console.log("MainPanel click", n && n.name, "loadFinish", m.default.loadFinish);
                        if (m.default.platform.playEffect("ab:audio/click"), p.ED.send(p.ClientEvent.SCREEN_CLICK, t), m.default.loadFinish) switch (n && n.name) {
                            case "setBtn":
                                m.default.gui.open(d.UIID.MemuPanel), m.default.platform.hideGameClub(), m.default.user.puzzleProgress[v.PuzzleData.乌龟] = 50;
                                break;
                            case "rankBtn":
                                m.default.platform.staticgetUseInfo(function() {
                                    var t;
                                    t = m.default.user.level, m.default.platform.submitScoreForRank(t, function() {
                                        m.default.platform.hideGameClub(), m.default.gui.open(d.UIID.RankPanel);
                                    });
                                });
                                break;
                            case "shareBtn":
                                if (cc.sys.isBrowser) return;
                                m.default.platform.share(function() {
                                    e.loadGameClub();
                                });
                                break;
                            case "startBtn":
                                this.close(), m.default.gui.open(d.UIID.GamePanel);
                                break;
                            case "illustratedBtn":
                                m.default.platform.hideGameClub(), m.default.gui.open(d.UIID.IllustratedPanel);
                                break;
                            case "img_huakuang":
                                m.default.platform.hideGameClub(), m.default.gui.open(d.UIID.PuzzlePanel);
                        } else m.default.gui.toast("\u8D44\u6E90\u52A0\u8F7D\u4E2D\uFF0C\u8BF7\u7A0D\u5019\uFF01");
                    }, e.prototype.close = function() {
                        m.default.gui.remove(d.UIID.MainPanel);
                    }, e.prototype.generateRandomRectangles = function(t, e) {
                        var n,
                            i,
                            o,
                            r = Array.from({
                                length: t
                            }, function() {
                                return Array(t).fill(0);
                            }),
                            a = new Set(),
                            c = new Set(),
                            p = s(e, 2),
                            h = p[0],
                            f = p[1],
                            d = Math.floor(Math.random() * (f - h + 1)) + h,
                            m = [],
                            y = Math.floor(t / 2),
                            v = new Set();

                        function g(e, n) {
                            var i, o;
                            try {
                                for (var r = l([{
                                        dx: -1,
                                        dy: 0
                                    }, {
                                        dx: 1,
                                        dy: 0
                                    }, {
                                        dx: 0,
                                        dy: -1
                                    }, {
                                        dx: 0,
                                        dy: 1
                                    }]), a = r.next(); !a.done; a = r.next()) {
                                    var c = a.value,
                                        s = c.dx,
                                        u = c.dy,
                                        p = e + s,
                                        h = n + u;
                                    if (p >= 0 && p < t && h >= 0 && h < t) {
                                        var f = p + "," + h;
                                        v.has(f) || (v.add(f), m.push({
                                            x: p,
                                            y: h
                                        }));
                                    }
                                }
                            } catch (d) {
                                i = {
                                    error: d
                                };
                            } finally {
                                try {
                                    a && !a.done && (o = r.return) && o.call(r);
                                } finally {
                                    if (i) throw i.error;
                                }
                            }
                        }
                        var b = y + "," + y;
                        v.add(b), m.push({
                            x: y,
                            y: y
                        });
                        for (var k = 0; m.length > 0 && k < d;) {
                            var C = Math.floor(Math.random() * m.length),
                                E = m.splice(C, 1)[0],
                                w = E.x,
                                B = E.y,
                                P = Math.floor(Math.random() * _.length),
                                T = u(_);
                            0 !== P && (n = s([T[P], T[0]], 2), T[0] = n[0], T[P] = n[1]);
                            var z = !1;
                            try {
                                for (var D = (i = void 0, l(T)), O = D.next(); !O.done; O = D.next()) {
                                    var N = O.value,
                                        I = N.dx,
                                        U = N.dy,
                                        R = w + I,
                                        S = B + U;
                                    if (R >= 0 && R < t && S >= 0 && S < t && 0 === r[w][B] && 0 === r[R][S]) {
                                        r[w][B] = 1, r[R][S] = 1, a.add(w + "," + B), a.add(R + "," + S), c.add(w + "," + B + "-" + R + "," + S), g(w, B), g(R, S), k++, z = !0;
                                        break;
                                    }
                                }
                            } catch (x) {
                                i = {
                                    error: x
                                };
                            } finally {
                                try {
                                    O && !O.done && (o = D.return) && o.call(D);
                                } finally {
                                    if (i) throw i.error;
                                }
                            }
                            z || g(w, B);
                        }
                        return c;
                    }, e.prototype.generateRectanglesToJson = function(t, e) {
                        var n,
                            i,
                            o = this.generateRandomRectangles(t, e),
                            r = [];
                        try {
                            for (var a = l(o), c = a.next(); !c.done; c = a.next()) {
                                var u = c.value,
                                    p = s(u.split("-"), 2),
                                    h = p[0],
                                    f = p[1],
                                    d = s(h.split(",").map(Number), 2),
                                    m = d[0],
                                    y = d[1],
                                    v = s(f.split(",").map(Number), 2),
                                    g = v[0],
                                    b = v[1];
                                r.push({
                                    start: {
                                        x: m,
                                        y: y
                                    },
                                    end: {
                                        x: g,
                                        y: b
                                    }
                                });
                            }
                        } catch (_) {
                            n = {
                                error: _
                            };
                        } finally {
                            try {
                                c && !c.done && (i = a.return) && i.call(a);
                            } finally {
                                if (n) throw n.error;
                            }
                        }
                        return r;
                    }, e.prototype.initMap = function() {
                        var t = this.generateRectanglesToJson(7, [15, 20]);
                        for (var e in t) {
                            var n = t[e],
                                i = cc.instantiate(f.GameApp.animalMPrefab);
                            i.parent = this.mapNode;
                            var o = this.getPos(n);
                            i.setPosition(new cc.Vec2(0, 0)), i.angle = this.getAngle(n), i.getComponent(g.default).init(o);
                        }
                    }, e.prototype.getPos = function(t) {
                        var e = t.start.x,
                            n = t.start.y,
                            i = t.end.x,
                            o = t.end.y,
                            r = new cc.Vec2(0, 0);
                        return e == i ? (r.x = 0 + 80 * e, r.y = 480 - 80 * (n + o) / 2) : n == o && (r.x = 0 + 80 * (e + i) / 2, r.y = 480 - 80 * n), r;
                    }, e.prototype.getAngle = function(t) {
                        var e = t.start.x,
                            n = t.start.y,
                            i = t.end.x,
                            o = t.end.y,
                            r = 0;
                        return e == i ? r = Math.random() > .5 ? 0 : 180 : n == o && (r = Math.random() > .5 ? 90 : 270), r;
                    }, e.prototype.loadGameClub = function() {
                        try {
                            m.default.platform && m.default.platform.hideGameClub && m.default.platform.hideGameClub();
                        } catch (t) {}
                    }, e.prototype.initPuzzleMask = function() {
                        var t = this.getPuzzle();
                        this.puzzleIndex = t;
                        var e = y.StaticData.illustrateData[t].name;
                        this.loadSprite(this.puzzle, "puzzle/" + e);
                        var n = m.default.user.puzzleProgress[t];
                        this.unLockProgress = n;
                        for (var i = 0; i < n; i++) this.mask.children[i].active = !1;
                    }, e.prototype.getPuzzle = function() {
                        for (var t = 0; t < Object.keys(v.PuzzleData).length; t++)
                            if (m.default.user.puzzleProgress[t] < y.StaticData.puzzleMax) return t;
                        return 29;
                    }, e.prototype.loadSprite = function(t, e) {
                        return a(this, void 0, void 0, function() {
                            var n, i;
                            return c(this, function(o) {
                                switch (o.label) {
                                    case 0:
                                        return n = "ab:game2/texture/puzzle/" + e, i = t, [4, h.default.load(n, cc.SpriteFrame)];
                                    case 1:
                                        return i.spriteFrame = o.sent(), [2];
                                }
                            });
                        });
                    }, r([C], e);
                }(cc.Component));
            n.default = E, cc._RF.pop();
        }, {
            "../../../script/core/event/ClientEvent": void 0,
            "../../../script/core/res/Res": void 0,
            "../../../script/game/data/GameApp": void 0,
            "../../../script/game/data/GameUIConfig": void 0,
            "../../../script/game/data/Global": void 0,
            "../../../script/game/data/StaticData": void 0,
            "../../../script/game/enum/Enum": void 0,
            "../../../script/game/gameScipt/AnimalM": void 0,
            "../../../script/util/Util": void 0
        }],
        MemuPanel: [function(t, e, n) {
            "use strict";

            cc._RF.push(e, "63944OLiahPlrDdx3rE2ju7", "MemuPanel");
            var _i4,
                o = this && this.__extends || (_i4 = function i(t, e) {
                    return (_i4 = Object.setPrototypeOf || {
                            __proto__: []
                        }
                        instanceof Array && function(t, e) {
                            t.__proto__ = e;
                        } || function(t, e) {
                            for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
                        })(t, e);
                }, function(t, e) {
                    function n() {
                        this.constructor = t;
                    }
                    _i4(t, e), t.prototype = null === e ? Object.create(e) : (n.prototype = e.prototype, new n());
                }),
                r = this && this.__decorate || function(t, e, n, i) {
                    var o,
                        r = arguments.length,
                        a = r < 3 ? e : null === i ? i = Object.getOwnPropertyDescriptor(e, n) : i;
                    if ("object" == (typeof Reflect === "undefined" ? "undefined" : _typeof2(Reflect)) && "function" == typeof Reflect.decorate) a = Reflect.decorate(t, e, n, i);
                    else
                        for (var c = t.length - 1; c >= 0; c--)(o = t[c]) && (a = (r < 3 ? o(a) : r > 3 ? o(e, n, a) : o(e, n)) || a);
                    return r > 3 && a && Object.defineProperty(e, n, a), a;
                };
            Object.defineProperty(n, "__esModule", {
                value: !0
            });
            var a = t("../../../script/core/event/ClientEvent"),
                c = t("../../../script/game/data/GameApp"),
                s = t("../../../script/game/data/GameUIConfig"),
                l = t("../../../script/game/data/Global"),
                u = t("../../../script/game/enum/Enum"),
                p = cc._decorator,
                h = p.ccclass,
                f = (p.property, function(t) {
                    function e() {
                        return null !== t && t.apply(this, arguments) || this;
                    }
                    return o(e, t), e.prototype.onLoad = function() {
                        this.closeBtn = cc.find("closeBtn", this.node), this.title = cc.find("title", this.node).getComponent(cc.Label), this.backBtn = cc.find("backBtn", this.node), this.skipBtn = cc.find("skipBtn", this.node), this.soundBtn = cc.find("soundBtn", this.node), this.musicBtn = cc.find("musicBtn", this.node), this.vibrateBtn = cc.find("vibrateBtn", this.node), this.setBtn(this.soundBtn, l.default.platform.enabledEffect), this.setBtn(this.musicBtn, l.default.platform.enableMusic), this.setBtn(this.vibrateBtn, l.default.platform.enabledShock), this.initPage();
                    }, e.prototype.onEnable = function() {
                        l.default.platform.showInterstitialAd(), l.default.platform.showBannerAd(), this.closeBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.backBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.skipBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.soundBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.musicBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.vibrateBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this);
                    }, e.prototype.onDisable = function() {
                        l.default.platform.hideBanner(), this.closeBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.backBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.skipBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.soundBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.musicBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.vibrateBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this);
                    }, e.prototype.setBtn = function(t, e) {
                        cc.find("img_sz_kai", t).active = e;
                        var n = e ? cc.v2(-50, 0) : cc.v2(50, 0);
                        cc.find("img_sz_dian", t).position = cc.v3(n);
                    }, e.prototype.initPage = function() {
                        l.default.curPage == u.CurPage.home ? (this.backBtn.active = !1, this.skipBtn.active = !1, this.title.string = "\u8BBE\u7F6E") : l.default.curPage == u.CurPage.game && (this.skipBtn.active = !0, this.skipBtn.active = !0, this.title.string = "\u6682\u505C");
                    }, e.prototype.onClicked = function(t) {
                        for (var n = t.currentTarget || t.target, i = ["closeBtn", "backBtn", "skipBtn", "soundBtn", "musicBtn", "vibrateBtn"]; n && -1 === i.indexOf(n.name);) n = n.parent;
                        switch (a.ED.send(a.ClientEvent.SCREEN_CLICK, t), l.default.platform.playEffect("ab:audio/click"), n && n.name) {
                            case "closeBtn":
                                this.close();
                                break;
                            case "backBtn":
                                this.close(), l.default.gui.remove(s.UIID.GamePanel), l.default.gui.open(s.UIID.MainPanel);
                                break;
                            case "skipBtn":
                                var e = this;
                                l.default.platform.watchAd(function(t, n, i) {
                                    if (t) {
                                        l.default.user.level++;
                                        var o = l.default.user.level;
                                        l.default.platform.submitScoreForRank(o, function() {}), c.GameApp.gameMgr.enterGame(), e.close();
                                    } else {
                                        var r = i || "\u89C2\u770B\u5B8C\u6FC0\u52B1\u89C6\u9891\u624D\u80FD\u83B7\u5F97\u5956\u52B1";
                                        l.default.gui.toast(r);
                                    }
                                });
                                break;
                            case "soundBtn":
                                l.default.platform.enabledEffect = !l.default.platform.enabledEffect, this.setBtn(this.soundBtn, l.default.platform.enabledEffect);
                                break;
                            case "musicBtn":
                                l.default.platform.enableMusic = !l.default.platform.enableMusic, this.setBtn(this.musicBtn, l.default.platform.enableMusic);
                                break;
                            case "vibrateBtn":
                                l.default.platform.enabledShock = !l.default.platform.enabledShock, this.setBtn(this.vibrateBtn, l.default.platform.enabledShock);
                        }
                    }, e.prototype.close = function() {
                        l.default.curPage == u.CurPage.home && a.ED.send(a.ClientEvent.LOAD_GAME_CLUB), l.default.gui.remove(s.UIID.MemuPanel);
                    }, r([h], e);
                }(cc.Component));
            n.default = f, cc._RF.pop();
        }, {
            "../../../script/core/event/ClientEvent": void 0,
            "../../../script/game/data/GameApp": void 0,
            "../../../script/game/data/GameUIConfig": void 0,
            "../../../script/game/data/Global": void 0,
            "../../../script/game/enum/Enum": void 0
        }],
        PropsPanel: [function(t, e, n) {
            "use strict";

            cc._RF.push(e, "96dbaHJWPFBQZXj/NtbW5iW", "PropsPanel");
            var _i5,
                o = this && this.__extends || (_i5 = function i(t, e) {
                    return (_i5 = Object.setPrototypeOf || {
                            __proto__: []
                        }
                        instanceof Array && function(t, e) {
                            t.__proto__ = e;
                        } || function(t, e) {
                            for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
                        })(t, e);
                }, function(t, e) {
                    function n() {
                        this.constructor = t;
                    }
                    _i5(t, e), t.prototype = null === e ? Object.create(e) : (n.prototype = e.prototype, new n());
                }),
                r = this && this.__decorate || function(t, e, n, i) {
                    var o,
                        r = arguments.length,
                        a = r < 3 ? e : null === i ? i = Object.getOwnPropertyDescriptor(e, n) : i;
                    if ("object" == (typeof Reflect === "undefined" ? "undefined" : _typeof2(Reflect)) && "function" == typeof Reflect.decorate) a = Reflect.decorate(t, e, n, i);
                    else
                        for (var c = t.length - 1; c >= 0; c--)(o = t[c]) && (a = (r < 3 ? o(a) : r > 3 ? o(e, n, a) : o(e, n)) || a);
                    return r > 3 && a && Object.defineProperty(e, n, a), a;
                },
                a = this && this.__awaiter || function(t, e, n, i) {
                    return new(n || (n = Promise))(function(o, r) {
                        function a(t) {
                            try {
                                s(i.next(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function c(t) {
                            try {
                                s(i.throw(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function s(t) {
                            var e;
                            t.done ? o(t.value) : (e = t.value, e instanceof n ? e : new n(function(t) {
                                t(e);
                            })).then(a, c);
                        }
                        s((i = i.apply(t, e || [])).next());
                    });
                },
                c = this && this.__generator || function(t, e) {
                    var n,
                        i,
                        o,
                        r,
                        a = {
                            label: 0,
                            sent: function sent() {
                                if (1 & o[0]) throw o[1];
                                return o[1];
                            },
                            trys: [],
                            ops: []
                        };
                    return r = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    }, "function" == typeof Symbol && (r[Symbol.iterator] = function() {
                        return this;
                    }), r;

                    function c(t) {
                        return function(e) {
                            return s([t, e]);
                        };
                    }

                    function s(r) {
                        if (n) throw new TypeError("Generator is already executing.");
                        for (; a;) try {
                            if (n = 1, i && (o = 2 & r[0] ? i.return : r[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, r[1])).done) return o;
                            switch (i = 0, o && (r = [2 & r[0], o.value]), r[0]) {
                                case 0:
                                case 1:
                                    o = r;
                                    break;
                                case 4:
                                    return a.label++, {
                                        value: r[1],
                                        done: !1
                                    };
                                case 5:
                                    a.label++, i = r[1], r = [0];
                                    continue;
                                case 7:
                                    r = a.ops.pop(), a.trys.pop();
                                    continue;
                                default:
                                    if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === r[0] || 2 === r[0])) {
                                        a = 0;
                                        continue;
                                    }
                                    if (3 === r[0] && (!o || r[1] > o[0] && r[1] < o[3])) {
                                        a.label = r[1];
                                        break;
                                    }
                                    if (6 === r[0] && a.label < o[1]) {
                                        a.label = o[1], o = r;
                                        break;
                                    }
                                    if (o && a.label < o[2]) {
                                        a.label = o[2], a.ops.push(r);
                                        break;
                                    }
                                    o[2] && a.ops.pop(), a.trys.pop();
                                    continue;
                            }
                            r = e.call(t, a);
                        } catch (c) {
                            r = [6, c], i = 0;
                        } finally {
                            n = o = 0;
                        }
                        if (5 & r[0]) throw r[1];
                        return {
                            value: r[0] ? r[1] : void 0,
                            done: !0
                        };
                    }
                };
            Object.defineProperty(n, "__esModule", {
                value: !0
            });
            var s = t("../../../script/core/event/ClientEvent"),
                l = t("../../../script/core/res/Res"),
                u = t("../../../script/game/data/GameApp"),
                p = t("../../../script/game/data/GameUIConfig"),
                h = t("../../../script/game/data/Global"),
                f = t("../../../script/game/enum/Enum"),
                d = cc._decorator,
                m = d.ccclass,
                y = (d.property, function(t) {
                    function e() {
                        return null !== t && t.apply(this, arguments) || this;
                    }
                    return o(e, t), e.prototype.onLoad = function() {
                        this.closeBtn = cc.find("closeBtn", this.node), this.shareBtn = cc.find("shareBtn", this.node), this.videoBtn = cc.find("videoBtn", this.node), this.title = cc.find("title", this.node).getComponent(cc.Label), this.propsIcon = cc.find("propsIcon", this.node).getComponent(cc.Sprite), this.propsDec = cc.find("propsDec", this.node).getComponent(cc.Label), this.initPage();
                    }, e.prototype.onEnable = function() {
                        h.default.platform.showInterstitialAd(), h.default.platform.showBannerAd(), this.closeBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.shareBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.videoBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this);
                    }, e.prototype.onDisable = function() {
                        h.default.platform.hideBanner(), this.closeBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.shareBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.videoBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this);
                    }, e.prototype.onClicked = function(t) {
                        switch (s.ED.send(s.ClientEvent.SCREEN_CLICK, t), h.default.platform.playEffect("ab:audio/click"), t.target.name) {
                            case "closeBtn":
                                this.close();
                                break;
                            case "shareBtn":
                                this.onUseProps();
                                break;
                            case "videoBtn":
                                var e = this;
                                h.default.platform.watchAd(function(t, n, i) {
                                    if (t) e.onUseProps(), e.close();
                                    else {
                                        var o = i || "\u89C2\u770B\u5B8C\u6FC0\u52B1\u89C6\u9891\u624D\u80FD\u83B7\u5F97\u5956\u52B1";
                                        h.default.gui.toast(o);
                                    }
                                });
                        }
                    }, e.prototype.initPage = function() {
                        u.GameApp.gameMgr.propsType == f.PropsTypes.catch ? (this.title.string = "\u6293\u8D70\u9053\u5177", this.loadSprite(this.propsIcon, "img_dj_zhua"), this.propsDec.string = "\u968F\u673A\u6293\u8D70\u573A\u4E0A\u4E09\u53EA\u52A8\u7269") : u.GameApp.gameMgr.propsType == f.PropsTypes.shuffle ? (this.title.string = "\u6D17\u724C\u9053\u5177", this.loadSprite(this.propsIcon, "img_dj_suiji"), this.propsDec.string = "\u968F\u673A\u4F7F\u573A\u4E0A\u52A8\u7269\u8F6C\u5411") : u.GameApp.gameMgr.propsType == f.PropsTypes.flip && (this.title.string = "\u7FFB\u8F6C\u9053\u5177", this.propsDec.string = "\u4F7F\u7528\u540E\u70B9\u51FB\u573A\u4E0A\u52A8\u7269\u8F6C\u5411", this.loadSprite(this.propsIcon, "img_dj_fanzhuan"));
                    }, e.prototype.onUseProps = function() {
                        u.GameApp.gameMgr.propsType == f.PropsTypes.catch ? u.GameApp.gameMgr.onCatch() : u.GameApp.gameMgr.propsType == f.PropsTypes.shuffle ? u.GameApp.gameMgr.onFlip() : u.GameApp.gameMgr.propsType == f.PropsTypes.flip && (u.GameApp.uiMgr.onUseShuffle(), u.GameApp.gameMgr.onShuffle());
                    }, e.prototype.loadSprite = function(t, e) {
                        return a(this, void 0, void 0, function() {
                            var n, i;
                            return c(this, function(o) {
                                switch (o.label) {
                                    case 0:
                                        return n = "ab:game2/texture/props/" + e, i = t, [4, l.default.load(n, cc.SpriteFrame)];
                                    case 1:
                                        return i.spriteFrame = o.sent(), [2];
                                }
                            });
                        });
                    }, e.prototype.close = function() {
                        h.default.gui.remove(p.UIID.PropsPanel);
                    }, r([m], e);
                }(cc.Component));
            n.default = y, cc._RF.pop();
        }, {
            "../../../script/core/event/ClientEvent": void 0,
            "../../../script/core/res/Res": void 0,
            "../../../script/game/data/GameApp": void 0,
            "../../../script/game/data/GameUIConfig": void 0,
            "../../../script/game/data/Global": void 0,
            "../../../script/game/enum/Enum": void 0
        }],
        PuzzlePanel: [function(t, e, n) {
            "use strict";

            cc._RF.push(e, "8612fFKuaRM5aVYqm7WjYwC", "PuzzlePanel");
            var _i6,
                o = this && this.__extends || (_i6 = function i(t, e) {
                    return (_i6 = Object.setPrototypeOf || {
                            __proto__: []
                        }
                        instanceof Array && function(t, e) {
                            t.__proto__ = e;
                        } || function(t, e) {
                            for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
                        })(t, e);
                }, function(t, e) {
                    function n() {
                        this.constructor = t;
                    }
                    _i6(t, e), t.prototype = null === e ? Object.create(e) : (n.prototype = e.prototype, new n());
                }),
                r = this && this.__decorate || function(t, e, n, i) {
                    var o,
                        r = arguments.length,
                        a = r < 3 ? e : null === i ? i = Object.getOwnPropertyDescriptor(e, n) : i;
                    if ("object" == (typeof Reflect === "undefined" ? "undefined" : _typeof2(Reflect)) && "function" == typeof Reflect.decorate) a = Reflect.decorate(t, e, n, i);
                    else
                        for (var c = t.length - 1; c >= 0; c--)(o = t[c]) && (a = (r < 3 ? o(a) : r > 3 ? o(e, n, a) : o(e, n)) || a);
                    return r > 3 && a && Object.defineProperty(e, n, a), a;
                },
                a = this && this.__awaiter || function(t, e, n, i) {
                    return new(n || (n = Promise))(function(o, r) {
                        function a(t) {
                            try {
                                s(i.next(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function c(t) {
                            try {
                                s(i.throw(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function s(t) {
                            var e;
                            t.done ? o(t.value) : (e = t.value, e instanceof n ? e : new n(function(t) {
                                t(e);
                            })).then(a, c);
                        }
                        s((i = i.apply(t, e || [])).next());
                    });
                },
                c = this && this.__generator || function(t, e) {
                    var n,
                        i,
                        o,
                        r,
                        a = {
                            label: 0,
                            sent: function sent() {
                                if (1 & o[0]) throw o[1];
                                return o[1];
                            },
                            trys: [],
                            ops: []
                        };
                    return r = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    }, "function" == typeof Symbol && (r[Symbol.iterator] = function() {
                        return this;
                    }), r;

                    function c(t) {
                        return function(e) {
                            return s([t, e]);
                        };
                    }

                    function s(r) {
                        if (n) throw new TypeError("Generator is already executing.");
                        for (; a;) try {
                            if (n = 1, i && (o = 2 & r[0] ? i.return : r[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, r[1])).done) return o;
                            switch (i = 0, o && (r = [2 & r[0], o.value]), r[0]) {
                                case 0:
                                case 1:
                                    o = r;
                                    break;
                                case 4:
                                    return a.label++, {
                                        value: r[1],
                                        done: !1
                                    };
                                case 5:
                                    a.label++, i = r[1], r = [0];
                                    continue;
                                case 7:
                                    r = a.ops.pop(), a.trys.pop();
                                    continue;
                                default:
                                    if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === r[0] || 2 === r[0])) {
                                        a = 0;
                                        continue;
                                    }
                                    if (3 === r[0] && (!o || r[1] > o[0] && r[1] < o[3])) {
                                        a.label = r[1];
                                        break;
                                    }
                                    if (6 === r[0] && a.label < o[1]) {
                                        a.label = o[1], o = r;
                                        break;
                                    }
                                    if (o && a.label < o[2]) {
                                        a.label = o[2], a.ops.push(r);
                                        break;
                                    }
                                    o[2] && a.ops.pop(), a.trys.pop();
                                    continue;
                            }
                            r = e.call(t, a);
                        } catch (c) {
                            r = [6, c], i = 0;
                        } finally {
                            n = o = 0;
                        }
                        if (5 & r[0]) throw r[1];
                        return {
                            value: r[0] ? r[1] : void 0,
                            done: !0
                        };
                    }
                };
            Object.defineProperty(n, "__esModule", {
                value: !0
            });
            var s = t("../../../script/core/event/ClientEvent"),
                l = t("../../../script/core/res/Res"),
                u = t("../../../script/game/data/GameApp"),
                p = t("../../../script/game/data/GameUIConfig"),
                h = t("../../../script/game/data/Global"),
                f = t("../../../script/game/data/StaticData"),
                d = t("../../../script/game/enum/Enum"),
                m = cc._decorator,
                y = m.ccclass,
                v = (m.property, function(t) {
                    function e() {
                        var e = null !== t && t.apply(this, arguments) || this;
                        return e.listenerList = [], e.lockBtn = !1, e.startClickTime = 0, e.isOnClick = !1, e.clickLimit = 150, e.timer = null, e.unLockProgress = 0, e.isLockFinish = !1, e;
                    }
                    return o(e, t), e.prototype.onLoad = function() {
                        this.mask = cc.find("mask", this.node), this.puzzle = cc.find("puzzle", this.node).getComponent(cc.Sprite), this.puzzleBtn = cc.find("puzzleBtn", this.node), this.blockNode = cc.find("blockNode", this.node), this.animNode = cc.find("animNode", this.node), this.backBtn = cc.find("backBtn", this.node), this.continueBtn = cc.find("continueBtn", this.node), this.puzzleBtnLabel = cc.find("puzzleBtnLabel", this.node), this.blockNum = cc.find("blockNum", this.node).getComponent(cc.Label), this.initPuzzleMask();
                    }, e.prototype.onEnable = function() {
                        this.puzzleBtn.on(cc.Node.EventType.TOUCH_START, this.touchStart, this), this.puzzleBtn.on(cc.Node.EventType.TOUCH_MOVE, this.touchStart, this), this.puzzleBtn.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this), this.puzzleBtn.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this), this.backBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.continueBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.listenerList.push(s.ED.on(s.ClientEvent.UPDATE_PUZZLE_MASK, this.updatePuzzleMask, this)), h.default.isPuzzle = !0;
                    }, e.prototype.onDisable = function() {
                        this.puzzleBtn.off(cc.Node.EventType.TOUCH_START, this.touchStart, this), this.puzzleBtn.off(cc.Node.EventType.TOUCH_MOVE, this.touchStart, this), this.puzzleBtn.off(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this), this.puzzleBtn.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this), this.backBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.continueBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), h.default.isPuzzle = !1;
                        for (var t = 0; t < this.listenerList.length; ++t) s.ED.off(this.listenerList[t]);
                    }, e.prototype.onClicked = function(t) {
                        switch (s.ED.send(s.ClientEvent.SCREEN_CLICK, t), h.default.platform.playEffect("ab:audio/click"), t.target.name) {
                            case "closeBtn":
                                this.close();
                                break;
                            case "puzzleBtn":
                                this.unLockPuzzle();
                                break;
                            case "backBtn":
                            case "continueBtn":
                                s.ED.send(s.ClientEvent.RESTART), this.close();
                        }
                    }, e.prototype.close = function() {
                        h.default.curPage == d.CurPage.home && (s.ED.send(s.ClientEvent.LOAD_GAME_CLUB), s.ED.send(s.ClientEvent.UPDATE_HOME_PUZZLE_MASK)), h.default.gui.remove(p.UIID.PuzzlePanel);
                    }, e.prototype.initPuzzleMask = function() {
                        var t = this.getPuzzle();
                        this.puzzleIndex = t;
                        var e = f.StaticData.illustrateData[t].name;
                        this.loadSprite(this.puzzle, "puzzle/" + e);
                        var n = h.default.user.puzzleProgress[t];
                        if (this.unLockProgress = n, this.blockNum.string = "\u788E\u7247\u6570\u91CF\uFF1A" + h.default.user.blockNum, 29 == t && n >= 156) return this.isLockFinish = !0, this.puzzleBtn.active = !1, void(this.puzzleBtnLabel.active = !1);
                        for (var i = 0; i < n; i++) this.mask.children[i].opacity = 0;
                    }, e.prototype.updatePuzzleMask = function() {
                        this.lockBtn = !1;
                        var t = this.getPuzzle();
                        this.puzzleIndex = t;
                        var e = f.StaticData.illustrateData[t].name;
                        this.loadSprite(this.puzzle, "puzzle/" + e);
                        var n = h.default.user.puzzleProgress[t];
                        if (29 == t && n >= 156) return this.isLockFinish = !0, this.puzzleBtn.active = !1, void(this.puzzleBtnLabel.active = !1);
                        this.unLockProgress = n;
                        for (var i = 0; i < this.mask.childrenCount; i++) this.mask.children[i].opacity = 255;
                        h.default.user.blockNum > 0 ? (this.puzzleBtn.active = !0, this.puzzleBtnLabel.active = !0) : (this.puzzleBtn.active = !1, this.puzzleBtnLabel.active = !1), this.blockNum.string = "\u788E\u7247\u6570\u91CF\uFF1A" + h.default.user.blockNum;
                    }, e.prototype.touchStart = function() {
                        var t = this;
                        if (this.isLockFinish) {
                            var e = "\u62FC\u56FE\u5DF2\u5168\u90E8\u89E3\u9501\uFF01";
                            h.default.gui.toast(e);
                        } else this.lockBtn || (h.default.user.blockNum <= 0 ? (e = "\u62FC\u56FE\u788E\u5757\u5DF2\u7528\u5B8C\uFF01", h.default.gui.toast(e)) : (this.startClickTime = new Date().getTime(), this.isOnClick = !0, this.timer || (this.timer = function() {
                            t.isOnClick && new Date().getTime() - t.startClickTime > t.clickLimit && (t.startClickTime = new Date().getTime(), t.unLockPuzzle());
                        }, this.schedule(this.timer, .1))));
                    }, e.prototype.touchEnd = function() {
                        if (this.isOnClick = !1, !this.isLockFinish && (this.timer && (this.unschedule(this.timer), this.timer = null), !this.lockBtn)) return h.default.user.blockNum <= 0 ? (this.puzzleBtn.active = !1, void(this.puzzleBtnLabel.active = !1)) : void this.unLockPuzzle();
                    }, e.prototype.unLockPuzzle = function() {
                        var t = this;
                        if (h.default.platform.playEffect("ab:audio/click2"), !this.lockBtn) {
                            if (h.default.user.blockNum <= 0) return h.default.gui.toast("\u62FC\u56FE\u788E\u5757\u5DF2\u7528\u5B8C\uFF01"), this.isOnClick = !1, this.unschedule(this.timer), this.timer = null, this.puzzleBtn.active = !1, void(this.puzzleBtnLabel.active = !1);
                            h.default.platform.shock("medium");
                            var e = this.mask.children[this.unLockProgress],
                                n = f.StaticData.blockRank[this.unLockProgress],
                                i = f.StaticData.blockData[n - 1],
                                o = cc.v2(i.x, i.y),
                                r = this.blockNode.convertToWorldSpaceAR(o),
                                a = this.mask.convertToNodeSpaceAR(r),
                                c = cc.instantiate(u.GameApp.blockPrefab);
                            c.position = cc.v3(a), c.parent = this.animNode, c.angle = i.angle, this.btnAnimation(), this.loadSprite(c.getComponent(cc.Sprite), "img_xz_pt" + i.type), cc.tween().target(c).to(1, {
                                position: e.position
                            }).call(function() {
                                c.destroy();
                            }).start(), cc.tween().target(c).to(1, {
                                angle: e.angle
                            }).start(), cc.tween().target(e).delay(1).to(.5, {
                                opacity: 0
                            }).call(function() {
                                e.opacity = 0;
                            }).start(), this.unLockProgress++, h.default.user.puzzleProgress[this.puzzleIndex] = this.unLockProgress, h.default.user.blockNum--, this.blockNum.string = "\u788E\u7247\u6570\u91CF\uFF1A" + h.default.user.blockNum, h.default.user.puzzleProgress[this.puzzleIndex] == f.StaticData.puzzleMax && (this.lockBtn = !0, this.scheduleOnce(function() {
                                h.default.gui.open(p.UIID.AnimalDecPanel), h.default.user.illustrateLock++;
                                var e = f.StaticData.illustrateData[t.puzzleIndex];
                                h.default.animalName = e.name, h.default.animalDec = e.dec;
                            }, 1.5));
                        }
                    }, e.prototype.getPuzzle = function() {
                        for (var t = 0; t < Object.keys(d.PuzzleData).length; t++)
                            if (h.default.user.puzzleProgress[t] < f.StaticData.puzzleMax) return t;
                        return 29;
                    }, e.prototype.loadSprite = function(t, e) {
                        return a(this, void 0, void 0, function() {
                            var n, i;
                            return c(this, function(o) {
                                switch (o.label) {
                                    case 0:
                                        return n = "ab:game2/texture/puzzle/" + e, i = t, [4, l.default.load(n, cc.SpriteFrame)];
                                    case 1:
                                        return i.spriteFrame = o.sent(), [2];
                                }
                            });
                        });
                    }, e.prototype.btnAnimation = function() {
                        var t = this;
                        cc.Tween.stopAllByTarget(this.puzzleBtn), this.btnTween && (this.btnTween.stop(), this.btnTween = null), this.btnTween = cc.tween().target(this.puzzleBtn).to(.05, {
                            scale: 1.1
                        }, {
                            easing: cc.easing.quadInOut
                        }).to(.05, {
                            scale: 1
                        }, {
                            easing: cc.easing.quadInOut,
                            onComplete: function onComplete() {
                                t.btnTween = null;
                            }
                        }).start();
                    }, r([y], e);
                }(cc.Component));
            n.default = v, cc._RF.pop();
        }, {
            "../../../script/core/event/ClientEvent": void 0,
            "../../../script/core/res/Res": void 0,
            "../../../script/game/data/GameApp": void 0,
            "../../../script/game/data/GameUIConfig": void 0,
            "../../../script/game/data/Global": void 0,
            "../../../script/game/data/StaticData": void 0,
            "../../../script/game/enum/Enum": void 0
        }],
        RankPanel: [function(t, e, n) {
            "use strict";

            cc._RF.push(e, "df0a9iIzVJKw4f4d08Wkxwk", "RankPanel");
            var _i7,
                o = this && this.__extends || (_i7 = function i(t, e) {
                    return (_i7 = Object.setPrototypeOf || {
                            __proto__: []
                        }
                        instanceof Array && function(t, e) {
                            t.__proto__ = e;
                        } || function(t, e) {
                            for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
                        })(t, e);
                }, function(t, e) {
                    function n() {
                        this.constructor = t;
                    }
                    _i7(t, e), t.prototype = null === e ? Object.create(e) : (n.prototype = e.prototype, new n());
                }),
                r = this && this.__decorate || function(t, e, n, i) {
                    var o,
                        r = arguments.length,
                        a = r < 3 ? e : null === i ? i = Object.getOwnPropertyDescriptor(e, n) : i;
                    if ("object" == (typeof Reflect === "undefined" ? "undefined" : _typeof2(Reflect)) && "function" == typeof Reflect.decorate) a = Reflect.decorate(t, e, n, i);
                    else
                        for (var c = t.length - 1; c >= 0; c--)(o = t[c]) && (a = (r < 3 ? o(a) : r > 3 ? o(e, n, a) : o(e, n)) || a);
                    return r > 3 && a && Object.defineProperty(e, n, a), a;
                },
                a = this && this.__awaiter || function(t, e, n, i) {
                    return new(n || (n = Promise))(function(o, r) {
                        function a(t) {
                            try {
                                s(i.next(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function c(t) {
                            try {
                                s(i.throw(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function s(t) {
                            var e;
                            t.done ? o(t.value) : (e = t.value, e instanceof n ? e : new n(function(t) {
                                t(e);
                            })).then(a, c);
                        }
                        s((i = i.apply(t, e || [])).next());
                    });
                },
                c = this && this.__generator || function(t, e) {
                    var n,
                        i,
                        o,
                        r,
                        a = {
                            label: 0,
                            sent: function sent() {
                                if (1 & o[0]) throw o[1];
                                return o[1];
                            },
                            trys: [],
                            ops: []
                        };
                    return r = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    }, "function" == typeof Symbol && (r[Symbol.iterator] = function() {
                        return this;
                    }), r;

                    function c(t) {
                        return function(e) {
                            return s([t, e]);
                        };
                    }

                    function s(r) {
                        if (n) throw new TypeError("Generator is already executing.");
                        for (; a;) try {
                            if (n = 1, i && (o = 2 & r[0] ? i.return : r[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, r[1])).done) return o;
                            switch (i = 0, o && (r = [2 & r[0], o.value]), r[0]) {
                                case 0:
                                case 1:
                                    o = r;
                                    break;
                                case 4:
                                    return a.label++, {
                                        value: r[1],
                                        done: !1
                                    };
                                case 5:
                                    a.label++, i = r[1], r = [0];
                                    continue;
                                case 7:
                                    r = a.ops.pop(), a.trys.pop();
                                    continue;
                                default:
                                    if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === r[0] || 2 === r[0])) {
                                        a = 0;
                                        continue;
                                    }
                                    if (3 === r[0] && (!o || r[1] > o[0] && r[1] < o[3])) {
                                        a.label = r[1];
                                        break;
                                    }
                                    if (6 === r[0] && a.label < o[1]) {
                                        a.label = o[1], o = r;
                                        break;
                                    }
                                    if (o && a.label < o[2]) {
                                        a.label = o[2], a.ops.push(r);
                                        break;
                                    }
                                    o[2] && a.ops.pop(), a.trys.pop();
                                    continue;
                            }
                            r = e.call(t, a);
                        } catch (c) {
                            r = [6, c], i = 0;
                        } finally {
                            n = o = 0;
                        }
                        if (5 & r[0]) throw r[1];
                        return {
                            value: r[0] ? r[1] : void 0,
                            done: !0
                        };
                    }
                };
            Object.defineProperty(n, "__esModule", {
                value: !0
            });
            var s = t("../../../script/core/display/ListView"),
                l = t("../../../script/core/event/ClientEvent"),
                u = t("../../../script/core/platform/PlatformBase"),
                p = t("../../../script/core/res/Res"),
                h = t("../../../script/game/data/GameUIConfig"),
                f = t("../../../script/game/data/Global"),
                d = t("../../../script/util/Util"),
                m = cc._decorator,
                y = m.ccclass,
                v = (m.property, function(t) {
                    function e() {
                        var e = null !== t && t.apply(this, arguments) || this;
                        return e.type = 1, e.allData = null, e;
                    }
                    return o(e, t), e.prototype.onLoad = function() {
                        this.closeBtn = cc.find("closeBtn", this.node), this.selfRankItem = cc.find("selfRankItem", this.node), this.rankIcon = cc.find("rankIcon", this.selfRankItem).getComponent(cc.Sprite), this.rank = cc.find("rank", this.selfRankItem).getComponent(cc.Label), this.avater = cc.find("avater", this.selfRankItem).getComponent(cc.Sprite), this.nickName = cc.find("nickName", this.selfRankItem).getComponent(cc.Label), this.scoreLabel = cc.find("scoreLabel", this.selfRankItem).getComponent(cc.Label), this.worldBtn = cc.find("worldBtn", this.node), this.friendBtn = cc.find("friendBtn", this.node), this.subContext = cc.find("subContext", this.node), this.worldDec = cc.find("dec", this.worldBtn), this.friendDec = cc.find("dec", this.friendBtn), this.scrollView = cc.find("scrollView", this.node), this.changeMode();
                    }, e.prototype.onEnable = function() {
                        f.default.platform.showInterstitialAd(), this.closeBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.worldBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.friendBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this);
                    }, e.prototype.onDisable = function() {
                        l.ED.send(l.ClientEvent.LOAD_GAME_CLUB), this.closeBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.worldBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.friendBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this);
                    }, e.prototype.onClicked = function(t) {
                        switch (l.ED.send(l.ClientEvent.SCREEN_CLICK, t), f.default.platform.playEffect("ab:audio/click"), t.target.name) {
                            case "closeBtn":
                                this.close();
                                break;
                            case "worldBtn":
                                this.type = 1, this.changeMode();
                                break;
                            case "friendBtn":
                                this.type = 2, this.changeMode();
                        }
                    }, e.prototype.changeMode = function() {
                        var t = this;
                        1 == this.type ? (this.subContext.active = !1, this.worldDec.color = new cc.Color(193, 193, 193, 255), this.friendDec.color = new cc.Color(103, 62, 14, 255), this.loadSprite(this.worldBtn.getComponent(cc.Sprite), "img_ph_btnlan"), this.loadSprite(this.friendBtn.getComponent(cc.Sprite), "img_ph_btnhuang"), this.selfRankItem.active = !0, this.scrollView.active = !0, this.allData ? this.refreshPanel(this.allData) : f.default.platform.getRankInfo(function(e) {
                            t.allData = e, t.refreshPanel(e);
                        })) : 2 == this.type && (this.subContext.active = !0, this.selfRankItem.active = !1, this.scrollView.active = !1, this.friendDec.color = new cc.Color(193, 193, 193, 255), this.worldDec.color = new cc.Color(103, 62, 14, 255), this.loadSprite(this.worldBtn.getComponent(cc.Sprite), "img_ph_btnhuang"), this.loadSprite(this.friendBtn.getComponent(cc.Sprite), "img_ph_btnlan"), f.default.platform.getSubRank(u.eventString.refresh, f.default.user.level));
                    }, e.prototype.refreshPanel = function(t) {
                        return a(this, void 0, void 0, function() {
                            var e,
                                n,
                                i,
                                o = this;
                            return c(this, function() {
                                for (e = t.myInfo, (n = e.scoreRank) > 100 ? (this.rankIcon.spriteFrame = null, this.rank.string = "\u672A\u4E0A\u699C") : n > 3 ? (this.rankIcon.spriteFrame = null, this.rank.string = "" + n) : n > 0 && (this.loadSprite(this.rankIcon, "img_ph_jp" + n), this.rank.string = ""), f.default.user.avatarUrl && d.Util.getUrlImage(f.default.user.avatarUrl, function(t) {
                                        o.avater.spriteFrame = t;
                                    }), this.nickName.string = f.default.user.nickName, this.scoreLabel.string = e.score + "\u5173", i = 0; i < t.userList.length; ++i) t.userList[i].scoreRank = i + 1;
                                return this.scrollView.getComponent(s.default).setData(t.userList), [2];
                            });
                        });
                    }, e.prototype.loadSprite = function(t, e) {
                        return a(this, void 0, void 0, function() {
                            var n, i;
                            return c(this, function(o) {
                                switch (o.label) {
                                    case 0:
                                        return n = "ab:game2/texture/rank/" + e, i = t, [4, p.default.load(n, cc.SpriteFrame)];
                                    case 1:
                                        return i.spriteFrame = o.sent(), [2];
                                }
                            });
                        });
                    }, e.prototype.close = function() {
                        f.default.gui.remove(h.UIID.RankPanel);
                    }, r([y], e);
                }(cc.Component));
            n.default = v, cc._RF.pop();
        }, {
            "../../../script/core/display/ListView": void 0,
            "../../../script/core/event/ClientEvent": void 0,
            "../../../script/core/platform/PlatformBase": void 0,
            "../../../script/core/res/Res": void 0,
            "../../../script/game/data/GameUIConfig": void 0,
            "../../../script/game/data/Global": void 0,
            "../../../script/util/Util": void 0
        }],
        ResultPanel: [function(t, e, n) {
            "use strict";

            cc._RF.push(e, "bfc3dSrFDNGao64Hj0XAKsO", "ResultPanel");
            var _i8,
                o = this && this.__extends || (_i8 = function i(t, e) {
                    return (_i8 = Object.setPrototypeOf || {
                            __proto__: []
                        }
                        instanceof Array && function(t, e) {
                            t.__proto__ = e;
                        } || function(t, e) {
                            for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
                        })(t, e);
                }, function(t, e) {
                    function n() {
                        this.constructor = t;
                    }
                    _i8(t, e), t.prototype = null === e ? Object.create(e) : (n.prototype = e.prototype, new n());
                }),
                r = this && this.__decorate || function(t, e, n, i) {
                    var o,
                        r = arguments.length,
                        a = r < 3 ? e : null === i ? i = Object.getOwnPropertyDescriptor(e, n) : i;
                    if ("object" == (typeof Reflect === "undefined" ? "undefined" : _typeof2(Reflect)) && "function" == typeof Reflect.decorate) a = Reflect.decorate(t, e, n, i);
                    else
                        for (var c = t.length - 1; c >= 0; c--)(o = t[c]) && (a = (r < 3 ? o(a) : r > 3 ? o(e, n, a) : o(e, n)) || a);
                    return r > 3 && a && Object.defineProperty(e, n, a), a;
                },
                a = this && this.__awaiter || function(t, e, n, i) {
                    return new(n || (n = Promise))(function(o, r) {
                        function a(t) {
                            try {
                                s(i.next(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function c(t) {
                            try {
                                s(i.throw(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function s(t) {
                            var e;
                            t.done ? o(t.value) : (e = t.value, e instanceof n ? e : new n(function(t) {
                                t(e);
                            })).then(a, c);
                        }
                        s((i = i.apply(t, e || [])).next());
                    });
                },
                c = this && this.__generator || function(t, e) {
                    var n,
                        i,
                        o,
                        r,
                        a = {
                            label: 0,
                            sent: function sent() {
                                if (1 & o[0]) throw o[1];
                                return o[1];
                            },
                            trys: [],
                            ops: []
                        };
                    return r = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    }, "function" == typeof Symbol && (r[Symbol.iterator] = function() {
                        return this;
                    }), r;

                    function c(t) {
                        return function(e) {
                            return s([t, e]);
                        };
                    }

                    function s(r) {
                        if (n) throw new TypeError("Generator is already executing.");
                        for (; a;) try {
                            if (n = 1, i && (o = 2 & r[0] ? i.return : r[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, r[1])).done) return o;
                            switch (i = 0, o && (r = [2 & r[0], o.value]), r[0]) {
                                case 0:
                                case 1:
                                    o = r;
                                    break;
                                case 4:
                                    return a.label++, {
                                        value: r[1],
                                        done: !1
                                    };
                                case 5:
                                    a.label++, i = r[1], r = [0];
                                    continue;
                                case 7:
                                    r = a.ops.pop(), a.trys.pop();
                                    continue;
                                default:
                                    if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === r[0] || 2 === r[0])) {
                                        a = 0;
                                        continue;
                                    }
                                    if (3 === r[0] && (!o || r[1] > o[0] && r[1] < o[3])) {
                                        a.label = r[1];
                                        break;
                                    }
                                    if (6 === r[0] && a.label < o[1]) {
                                        a.label = o[1], o = r;
                                        break;
                                    }
                                    if (o && a.label < o[2]) {
                                        a.label = o[2], a.ops.push(r);
                                        break;
                                    }
                                    o[2] && a.ops.pop(), a.trys.pop();
                                    continue;
                            }
                            r = e.call(t, a);
                        } catch (c) {
                            r = [6, c], i = 0;
                        } finally {
                            n = o = 0;
                        }
                        if (5 & r[0]) throw r[1];
                        return {
                            value: r[0] ? r[1] : void 0,
                            done: !0
                        };
                    }
                };
            Object.defineProperty(n, "__esModule", {
                value: !0
            });
            var s = t("../../../script/core/display/ListView"),
                l = t("../../../script/core/event/ClientEvent"),
                u = t("../../../script/core/res/Res"),
                p = t("../../../script/game/data/GameApp"),
                h = t("../../../script/game/data/GameUIConfig"),
                f = t("../../../script/game/data/Global"),
                d = t("../../../script/util/Util"),
                m = cc._decorator,
                y = m.ccclass,
                v = (m.property, function(t) {
                    function e() {
                        var e = null !== t && t.apply(this, arguments) || this;
                        return e.delay1 = 1, e.delay2 = 2, e.delay3 = 3, e.delay4 = 4, e.delay5 = 5, e;
                    }
                    return o(e, t), e.prototype.onLoad = function() {
                        var t = this;
                        this.nextBtn = cc.find("nextBtn", this.node), this.puzzleBtn = cc.find("puzzleBtn", this.node), this.scrollView = cc.find("scrollView", this.node), this.star1 = cc.find("star1", this.node), this.star2 = cc.find("star2", this.node), this.star3 = cc.find("star3", this.node), this.star4 = cc.find("star4", this.node), this.star5 = cc.find("star5", this.node), f.default.platform.playEffect("ab:audio/success"), this.selfRankItem = cc.find("selfRankItem", this.node), this.rankIcon = cc.find("rankIcon", this.selfRankItem).getComponent(cc.Sprite), this.rank = cc.find("rank", this.selfRankItem).getComponent(cc.Label), this.avater = cc.find("avater", this.selfRankItem).getComponent(cc.Sprite), this.nickName = cc.find("nickName", this.selfRankItem).getComponent(cc.Label), this.scoreLabel = cc.find("scoreLabel", this.selfRankItem).getComponent(cc.Label), this.scrollView = cc.find("scrollView", this.node), 1 == f.default.user.level && (this.puzzleBtn.active = !1), this.scheduleOnce(function() {
                            t.starMgr();
                        }, .5), this.initRank(), f.default.sendProps > 1 && (1 == f.default.sendPropsType ? f.default.user.propsShuffle++ : 2 == f.default.sendPropsType ? f.default.user.propsFlip++ : 3 == f.default.sendProps && f.default.user.propsCatch++);
                    }, e.prototype.onEnable = function() {
                        f.default.platform.showBannerAd(), f.default.platform.showInterstitialAd(), this.nextBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.puzzleBtn.on(cc.Node.EventType.TOUCH_END, this.onClicked, this);
                    }, e.prototype.onDisable = function() {
                        f.default.platform.hideBanner(), this.nextBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), this.puzzleBtn.off(cc.Node.EventType.TOUCH_END, this.onClicked, this), cc.Tween.stopAllByTarget(this.star1), cc.Tween.stopAllByTarget(this.star2), cc.Tween.stopAllByTarget(this.star3), cc.Tween.stopAllByTarget(this.star4), cc.Tween.stopAllByTarget(this.star5);
                    }, e.prototype.onClicked = function(t) {
                        switch (f.default.platform.playEffect("ab:audio/click"), l.ED.send(l.ClientEvent.SCREEN_CLICK, t), t.target.name) {
                            case "puzzleBtn":
                                f.default.gui.open(h.UIID.PuzzlePanel), this.close();
                                break;
                            case "nextBtn":
                                p.GameApp.gameMgr.enterGame(), this.close();
                        }
                    }, e.prototype.close = function() {
                        f.default.gui.remove(h.UIID.ResultPanel);
                    }, e.prototype.starMgr = function() {
                        cc.Tween.stopAllByTarget(this.star1), cc.Tween.stopAllByTarget(this.star2), cc.Tween.stopAllByTarget(this.star3), cc.Tween.stopAllByTarget(this.star4), cc.Tween.stopAllByTarget(this.star5), cc.tween().target(this.star1).delay(this.delay1).to(.2, {
                            opacity: 0
                        }).to(.2, {
                            opacity: 255
                        }).delay(5).union().repeatForever().start(), cc.tween().target(this.star2).delay(this.delay2).to(.2, {
                            opacity: 0
                        }).to(.2, {
                            opacity: 255
                        }).delay(5).union().repeatForever().start(), cc.tween().target(this.star3).delay(this.delay3).to(.2, {
                            opacity: 0
                        }).to(.2, {
                            opacity: 255
                        }).delay(5).union().repeatForever().start(), cc.tween().target(this.star4).delay(this.delay4).to(.2, {
                            opacity: 0
                        }).to(.2, {
                            opacity: 255
                        }).delay(5).union().repeatForever().start(), cc.tween().target(this.star5).delay(this.delay5).to(.2, {
                            opacity: 0
                        }).to(.2, {
                            opacity: 255
                        }).delay(5).union().repeatForever().start();
                    }, e.prototype.initRank = function() {
                        var t = this;
                        f.default.platform.getRankInfo(function(e) {
                            t.refreshPanel(e);
                        });
                    }, e.prototype.refreshPanel = function(t) {
                        return a(this, void 0, void 0, function() {
                            var e,
                                n,
                                i,
                                o = this;
                            return c(this, function() {
                                for (e = t.myInfo, (n = e.scoreRank) > 100 ? (this.rankIcon.spriteFrame = null, this.rank.string = "\u672A\u4E0A\u699C") : n > 3 ? (this.rankIcon.spriteFrame = null, this.rank.string = "" + n) : n > 0 && (this.loadSprite(this.rankIcon, "img_ph_jp" + n), this.rank.string = ""), f.default.user.avatarUrl && d.Util.getUrlImage(f.default.user.avatarUrl, function(t) {
                                        o.avater.spriteFrame = t;
                                    }), this.nickName.string = f.default.user.nickName, this.scoreLabel.string = e.score + "\u5173", i = 0; i < t.userList.length; ++i) t.userList[i].scoreRank = i + 1;
                                return this.scrollView.getComponent(s.default).setData(t.userList), [2];
                            });
                        });
                    }, e.prototype.loadSprite = function(t, e) {
                        return a(this, void 0, void 0, function() {
                            var n, i;
                            return c(this, function(o) {
                                switch (o.label) {
                                    case 0:
                                        return n = "ab:game2/texture/rank/" + e, i = t, [4, u.default.load(n, cc.SpriteFrame)];
                                    case 1:
                                        return i.spriteFrame = o.sent(), [2];
                                }
                            });
                        });
                    }, r([y], e);
                }(cc.Component));
            n.default = v, cc._RF.pop();
        }, {
            "../../../script/core/display/ListView": void 0,
            "../../../script/core/event/ClientEvent": void 0,
            "../../../script/core/res/Res": void 0,
            "../../../script/game/data/GameApp": void 0,
            "../../../script/game/data/GameUIConfig": void 0,
            "../../../script/game/data/Global": void 0,
            "../../../script/util/Util": void 0
        }],
        illustrateAnimalItem: [function(t, e, n) {
            "use strict";

            cc._RF.push(e, "c9de1JEpGJBFYj0qR19rdaI", "illustrateAnimalItem");
            var _i9,
                o = this && this.__extends || (_i9 = function i(t, e) {
                    return (_i9 = Object.setPrototypeOf || {
                            __proto__: []
                        }
                        instanceof Array && function(t, e) {
                            t.__proto__ = e;
                        } || function(t, e) {
                            for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
                        })(t, e);
                }, function(t, e) {
                    function n() {
                        this.constructor = t;
                    }
                    _i9(t, e), t.prototype = null === e ? Object.create(e) : (n.prototype = e.prototype, new n());
                }),
                r = this && this.__decorate || function(t, e, n, i) {
                    var o,
                        r = arguments.length,
                        a = r < 3 ? e : null === i ? i = Object.getOwnPropertyDescriptor(e, n) : i;
                    if ("object" == (typeof Reflect === "undefined" ? "undefined" : _typeof2(Reflect)) && "function" == typeof Reflect.decorate) a = Reflect.decorate(t, e, n, i);
                    else
                        for (var c = t.length - 1; c >= 0; c--)(o = t[c]) && (a = (r < 3 ? o(a) : r > 3 ? o(e, n, a) : o(e, n)) || a);
                    return r > 3 && a && Object.defineProperty(e, n, a), a;
                },
                a = this && this.__awaiter || function(t, e, n, i) {
                    return new(n || (n = Promise))(function(o, r) {
                        function a(t) {
                            try {
                                s(i.next(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function c(t) {
                            try {
                                s(i.throw(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function s(t) {
                            var e;
                            t.done ? o(t.value) : (e = t.value, e instanceof n ? e : new n(function(t) {
                                t(e);
                            })).then(a, c);
                        }
                        s((i = i.apply(t, e || [])).next());
                    });
                },
                c = this && this.__generator || function(t, e) {
                    var n,
                        i,
                        o,
                        r,
                        a = {
                            label: 0,
                            sent: function sent() {
                                if (1 & o[0]) throw o[1];
                                return o[1];
                            },
                            trys: [],
                            ops: []
                        };
                    return r = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    }, "function" == typeof Symbol && (r[Symbol.iterator] = function() {
                        return this;
                    }), r;

                    function c(t) {
                        return function(e) {
                            return s([t, e]);
                        };
                    }

                    function s(r) {
                        if (n) throw new TypeError("Generator is already executing.");
                        for (; a;) try {
                            if (n = 1, i && (o = 2 & r[0] ? i.return : r[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, r[1])).done) return o;
                            switch (i = 0, o && (r = [2 & r[0], o.value]), r[0]) {
                                case 0:
                                case 1:
                                    o = r;
                                    break;
                                case 4:
                                    return a.label++, {
                                        value: r[1],
                                        done: !1
                                    };
                                case 5:
                                    a.label++, i = r[1], r = [0];
                                    continue;
                                case 7:
                                    r = a.ops.pop(), a.trys.pop();
                                    continue;
                                default:
                                    if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === r[0] || 2 === r[0])) {
                                        a = 0;
                                        continue;
                                    }
                                    if (3 === r[0] && (!o || r[1] > o[0] && r[1] < o[3])) {
                                        a.label = r[1];
                                        break;
                                    }
                                    if (6 === r[0] && a.label < o[1]) {
                                        a.label = o[1], o = r;
                                        break;
                                    }
                                    if (o && a.label < o[2]) {
                                        a.label = o[2], a.ops.push(r);
                                        break;
                                    }
                                    o[2] && a.ops.pop(), a.trys.pop();
                                    continue;
                            }
                            r = e.call(t, a);
                        } catch (c) {
                            r = [6, c], i = 0;
                        } finally {
                            n = o = 0;
                        }
                        if (5 & r[0]) throw r[1];
                        return {
                            value: r[0] ? r[1] : void 0,
                            done: !0
                        };
                    }
                };
            Object.defineProperty(n, "__esModule", {
                value: !0
            });
            var s = t("../../../script/core/res/Res"),
                l = t("../../../script/game/data/GameUIConfig"),
                u = t("../../../script/game/data/Global"),
                p = cc._decorator,
                h = p.ccclass,
                f = (p.property, function(t) {
                    function e() {
                        var e = null !== t && t.apply(this, arguments) || this;
                        return e.isLock = !1, e;
                    }
                    return o(e, t), e.prototype.updateView = function(t) {
                        return a(this, void 0, void 0, function() {
                            return c(this, function() {
                                var n = {
                                    "北极熊": "熊猫",
                                    "刺猬": "兔子",
                                    "海马": "蛇",
                                    "海豚": "青蛙",
                                    "狐狸": "白狗",
                                    "鲸鱼": "企鹅",
                                    "恐龙": "乌龟",
                                    "老虎": "猫",
                                    "梅花鹿": "羊驼",
                                    "绵羊": "羊",
                                    "鲨鱼": "鳄鱼",
                                    "狮子": "狗",
                                    "水母": "蝴蝶",
                                    "犀牛": "大象",
                                    "小鸟": "鹦鹉",
                                    "小熊猫": "熊猫",
                                    "章鱼": "螃蟹",
                                    "长颈鹿": "斑马"
                                }, e = n[t.name] || t.name;
                                return this.animalData = t, this.node.on(cc.Node.EventType.TOUCH_END, this.onClickItem, this), this.gray = cc.find("gray", this.node).getComponent(cc.Sprite), this.animal = cc.find("animal", this.node).getComponent(cc.Sprite), this.aName = cc.find("aName", this.node).getComponent(cc.Label), this.loadSprite(this.gray, "animalGray/" + e), this.loadSprite(this.animal, "animal/" + e), t.index >= u.default.user.illustrateLock ? (this.aName.string = "\u672A\u89E3\u9501", this.animal.node.active = !1, this.isLock = !0) : (this.animal.node.active = !0, this.aName.string = t.name, this.isLock = !1), [2];
                            });
                        });
                    }, e.prototype.loadSprite = function(t, e) {
                        return a(this, void 0, void 0, function() {
                            var n, i;
                            return c(this, function(o) {
                                switch (o.label) {
                                    case 0:
                                        return n = "ab:game/texture/illustrated/" + e, i = t, [4, s.default.load(n, cc.SpriteFrame)];
                                    case 1:
                                        return (n = o.sent()) && (i.spriteFrame = n), [2];
                                }
                            });
                        });
                    }, e.prototype.onDisable = function() {
                        this.node.off(cc.Node.EventType.TOUCH_END, this.onClickItem, this);
                    }, e.prototype.onClickItem = function() {
                        this.isLock || (u.default.animalName = this.animalData.name, u.default.animalDec = this.animalData.dec, u.default.gui.open(l.UIID.AnimalDecPanel));
                    }, r([h], e);
                }(cc.Component));
            n.default = f, cc._RF.pop();
        }, {
            "../../../script/core/res/Res": void 0,
            "../../../script/game/data/GameUIConfig": void 0,
            "../../../script/game/data/Global": void 0
        }],
        rankItem: [function(t, e, n) {
            "use strict";

            cc._RF.push(e, "667d7A3RhBATbef3r6wsxIf", "rankItem");
            var _i10,
                o = this && this.__extends || (_i10 = function i(t, e) {
                    return (_i10 = Object.setPrototypeOf || {
                            __proto__: []
                        }
                        instanceof Array && function(t, e) {
                            t.__proto__ = e;
                        } || function(t, e) {
                            for (var n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
                        })(t, e);
                }, function(t, e) {
                    function n() {
                        this.constructor = t;
                    }
                    _i10(t, e), t.prototype = null === e ? Object.create(e) : (n.prototype = e.prototype, new n());
                }),
                r = this && this.__decorate || function(t, e, n, i) {
                    var o,
                        r = arguments.length,
                        a = r < 3 ? e : null === i ? i = Object.getOwnPropertyDescriptor(e, n) : i;
                    if ("object" == (typeof Reflect === "undefined" ? "undefined" : _typeof2(Reflect)) && "function" == typeof Reflect.decorate) a = Reflect.decorate(t, e, n, i);
                    else
                        for (var c = t.length - 1; c >= 0; c--)(o = t[c]) && (a = (r < 3 ? o(a) : r > 3 ? o(e, n, a) : o(e, n)) || a);
                    return r > 3 && a && Object.defineProperty(e, n, a), a;
                },
                a = this && this.__awaiter || function(t, e, n, i) {
                    return new(n || (n = Promise))(function(o, r) {
                        function a(t) {
                            try {
                                s(i.next(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function c(t) {
                            try {
                                s(i.throw(t));
                            } catch (e) {
                                r(e);
                            }
                        }

                        function s(t) {
                            var e;
                            t.done ? o(t.value) : (e = t.value, e instanceof n ? e : new n(function(t) {
                                t(e);
                            })).then(a, c);
                        }
                        s((i = i.apply(t, e || [])).next());
                    });
                },
                c = this && this.__generator || function(t, e) {
                    var n,
                        i,
                        o,
                        r,
                        a = {
                            label: 0,
                            sent: function sent() {
                                if (1 & o[0]) throw o[1];
                                return o[1];
                            },
                            trys: [],
                            ops: []
                        };
                    return r = {
                        next: c(0),
                        throw: c(1),
                        return: c(2)
                    }, "function" == typeof Symbol && (r[Symbol.iterator] = function() {
                        return this;
                    }), r;

                    function c(t) {
                        return function(e) {
                            return s([t, e]);
                        };
                    }

                    function s(r) {
                        if (n) throw new TypeError("Generator is already executing.");
                        for (; a;) try {
                            if (n = 1, i && (o = 2 & r[0] ? i.return : r[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, r[1])).done) return o;
                            switch (i = 0, o && (r = [2 & r[0], o.value]), r[0]) {
                                case 0:
                                case 1:
                                    o = r;
                                    break;
                                case 4:
                                    return a.label++, {
                                        value: r[1],
                                        done: !1
                                    };
                                case 5:
                                    a.label++, i = r[1], r = [0];
                                    continue;
                                case 7:
                                    r = a.ops.pop(), a.trys.pop();
                                    continue;
                                default:
                                    if (!(o = (o = a.trys).length > 0 && o[o.length - 1]) && (6 === r[0] || 2 === r[0])) {
                                        a = 0;
                                        continue;
                                    }
                                    if (3 === r[0] && (!o || r[1] > o[0] && r[1] < o[3])) {
                                        a.label = r[1];
                                        break;
                                    }
                                    if (6 === r[0] && a.label < o[1]) {
                                        a.label = o[1], o = r;
                                        break;
                                    }
                                    if (o && a.label < o[2]) {
                                        a.label = o[2], a.ops.push(r);
                                        break;
                                    }
                                    o[2] && a.ops.pop(), a.trys.pop();
                                    continue;
                            }
                            r = e.call(t, a);
                        } catch (c) {
                            r = [6, c], i = 0;
                        } finally {
                            n = o = 0;
                        }
                        if (5 & r[0]) throw r[1];
                        return {
                            value: r[0] ? r[1] : void 0,
                            done: !0
                        };
                    }
                };
            Object.defineProperty(n, "__esModule", {
                value: !0
            });
            var s = t("../../../script/core/res/Res"),
                l = t("../../../script/util/Util"),
                u = cc._decorator,
                p = u.ccclass,
                h = (u.property, function(t) {
                    function e() {
                        return null !== t && t.apply(this, arguments) || this;
                    }
                    return o(e, t), e.prototype.updateView = function(t) {
                        return a(this, void 0, void 0, function() {
                            var e = this;
                            return c(this, function() {
                                return this.rankBg = cc.find("rankBg", this.node).getComponent(cc.Sprite), this.rank = cc.find("rank", this.node).getComponent(cc.Label), this.scoreLabel = cc.find("scoreLabel", this.node).getComponent(cc.Label), this.nickName = cc.find("nickName", this.node).getComponent(cc.Label), this.rankIcon = cc.find("rankIcon", this.node).getComponent(cc.Sprite), this.avater = cc.find("avater", this.node).getComponent(cc.Sprite), t.scoreRank <= 3 ? (this.loadSprite(this.rankIcon, "img_ph_jp" + t.scoreRank), this.rank.string = "", this.loadSprite(this.rankBg, "img_ph_dk" + t.scoreRank)) : (this.rankIcon.spriteFrame = null, this.rank.string = "" + t.scoreRank, this.loadSprite(this.rankBg, "img_ph_dk4")), this.nickName.string = t.nickname, this.scoreLabel.string = t.score ? t.score + "\u5173" : "0\u5173", l.Util.getUrlImage(t.avatarUrl, function(t) {
                                    e.avater.spriteFrame = t;
                                }), [2];
                            });
                        });
                    }, e.prototype.loadSprite = function(t, e) {
                        return a(this, void 0, void 0, function() {
                            var n, i;
                            return c(this, function(o) {
                                switch (o.label) {
                                    case 0:
                                        return n = "ab:game2/texture/rank/" + e, i = t, [4, s.default.load(n, cc.SpriteFrame)];
                                    case 1:
                                        return i.spriteFrame = o.sent(), [2];
                                }
                            });
                        });
                    }, r([p], e);
                }(cc.Component));
            n.default = h, cc._RF.pop();
        }, {
            "../../../script/core/res/Res": void 0,
            "../../../script/util/Util": void 0
        }]
    }, {}, ["AnimalDecPanel", "IllustratedPanel", "MainPanel", "MemuPanel", "PropsPanel", "PuzzlePanel", "RankPanel", "ResultPanel", "illustrateAnimalItem", "rankItem"]);
});
GameGlobal.require("subpackages/game/game.js");
