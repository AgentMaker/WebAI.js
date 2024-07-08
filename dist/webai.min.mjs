import Be from "https://cdn.jsdelivr.net/npm/onnxruntime-web@dev/dist/ort.all.min.mjs";
import { default as oa } from "https://cdn.jsdelivr.net/npm/onnxruntime-web@dev/dist/ort.all.min.mjs";
var x = function() {
  var b = typeof document < "u" && document.currentScript ? document.currentScript.src : void 0;
  return function(y) {
    y = y || {};
    var i = typeof y < "u" ? y : {}, T = {}, k;
    for (k in i)
      i.hasOwnProperty(k) && (T[k] = i[k]);
    var C = "./this.program", R = !1, S = !1, N = !1, j = !1, O = !1;
    R = typeof window == "object", S = typeof importScripts == "function", j = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string", N = j && !R && !S, O = !R && !N && !S;
    var $ = "";
    function le(e) {
      return i.locateFile ? i.locateFile(e, $) : $ + e;
    }
    var H, ge, ue;
    if (N) {
      $ = __dirname + "/";
      var Ie, ze;
      H = function(n, r) {
        var t;
        return t = Fe(n), t || (Ie || (Ie = require("fs")), ze || (ze = require("path")), n = ze.normalize(n), t = Ie.readFileSync(n)), r ? t : t.toString();
      }, ue = function(n) {
        var r = H(n, !0);
        return r.buffer || (r = new Uint8Array(r)), ae(r.buffer), r;
      }, process.argv.length > 1 && (C = process.argv[1].replace(/\\/g, "/")), process.argv.slice(2), process.on("uncaughtException", function(e) {
        if (!(e instanceof kr))
          throw e;
      }), process.on("unhandledRejection", G), i.inspect = function() {
        return "[Emscripten Module object]";
      };
    } else O ? (typeof read < "u" && (H = function(n) {
      var r = Fe(n);
      return r ? Er(r) : read(n);
    }), ue = function(n) {
      var r;
      return r = Fe(n), r || (typeof readbuffer == "function" ? new Uint8Array(readbuffer(n)) : (r = read(n, "binary"), ae(typeof r == "object"), r));
    }, typeof scriptArgs < "u" && scriptArgs, typeof print < "u" && (typeof console > "u" && (console = {}), console.log = print, console.warn = console.error = typeof printErr < "u" ? printErr : print)) : (R || S) && (S ? $ = self.location.href : document.currentScript ? $ = document.currentScript.src : $ = import.meta.url, b && ($ = b), $.indexOf("blob:") !== 0 ? $ = $.substr(
      0,
      $.lastIndexOf("/") + 1
    ) : $ = "", H = function(n) {
      try {
        var r = new XMLHttpRequest();
        return r.open("GET", n, !1), r.send(null), r.responseText;
      } catch (a) {
        var t = Fe(n);
        if (t)
          return Er(t);
        throw a;
      }
    }, S && (ue = function(n) {
      try {
        var r = new XMLHttpRequest();
        return r.open("GET", n, !1), r.responseType = "arraybuffer", r.send(null), new Uint8Array(r.response);
      } catch (a) {
        var t = Fe(n);
        if (t)
          return t;
        throw a;
      }
    }), ge = function(n, r, t) {
      var a = new XMLHttpRequest();
      a.open("GET", n, !0), a.responseType = "arraybuffer", a.onload = function() {
        if (a.status == 200 || a.status == 0 && a.response) {
          r(a.response);
          return;
        }
        var u = Fe(n);
        if (u) {
          r(u.buffer);
          return;
        }
        t();
      }, a.onerror = t, a.send(null);
    });
    var Ue = i.print || console.log.bind(console), ee = i.printErr || console.warn.bind(console);
    for (k in T)
      T.hasOwnProperty(k) && (i[k] = T[k]);
    T = null, i.arguments && i.arguments, i.thisProgram && (C = i.thisProgram), i.quit && i.quit;
    function Pr(e) {
      var n = E[kn >> 2], r = n + e + 15 & -16;
      return r > hr() && G(), E[kn >> 2] = r, n;
    }
    function je(e) {
      je.shown || (je.shown = {}), je.shown[e] || (je.shown[e] = 1, ee(e));
    }
    var We;
    i.wasmBinary && (We = i.wasmBinary), i.noExitRuntime && i.noExitRuntime, typeof WebAssembly != "object" && ee("no native wasm support detected");
    var he, Fr = new WebAssembly.Table({
      initial: 12498,
      maximum: 12498,
      element: "anyfunc"
    }), _e = !1;
    function ae(e, n) {
      e || G("Assertion failed: " + n);
    }
    function Tr(e) {
      return rr ? Te(e) : Pr(e);
    }
    var qn = typeof TextDecoder < "u" ? new TextDecoder("utf8") : void 0;
    function Re(e, n, r) {
      for (var t = n + r, a = n; e[a] && !(a >= t); ) ++a;
      if (a - n > 16 && e.subarray && qn)
        return qn.decode(e.subarray(n, a));
      for (var l = ""; n < a; ) {
        var u = e[n++];
        if (!(u & 128)) {
          l += String.fromCharCode(u);
          continue;
        }
        var s = e[n++] & 63;
        if ((u & 224) == 192) {
          l += String.fromCharCode((u & 31) << 6 | s);
          continue;
        }
        var d = e[n++] & 63;
        if ((u & 240) == 224 ? u = (u & 15) << 12 | s << 6 | d : u = (u & 7) << 18 | s << 12 | d << 6 | e[n++] & 63, u < 65536)
          l += String.fromCharCode(u);
        else {
          var f = u - 65536;
          l += String.fromCharCode(55296 | f >> 10, 56320 | f & 1023);
        }
      }
      return l;
    }
    function $e(e, n) {
      return e ? Re(J, e, n) : "";
    }
    function En(e, n, r, t) {
      if (!(t > 0)) return 0;
      for (var a = r, l = r + t - 1, u = 0; u < e.length; ++u) {
        var s = e.charCodeAt(u);
        if (s >= 55296 && s <= 57343) {
          var d = e.charCodeAt(++u);
          s = 65536 + ((s & 1023) << 10) | d & 1023;
        }
        if (s <= 127) {
          if (r >= l) break;
          n[r++] = s;
        } else if (s <= 2047) {
          if (r + 1 >= l) break;
          n[r++] = 192 | s >> 6, n[r++] = 128 | s & 63;
        } else if (s <= 65535) {
          if (r + 2 >= l) break;
          n[r++] = 224 | s >> 12, n[r++] = 128 | s >> 6 & 63, n[r++] = 128 | s & 63;
        } else {
          if (r + 3 >= l) break;
          n[r++] = 240 | s >> 18, n[r++] = 128 | s >> 12 & 63, n[r++] = 128 | s >> 6 & 63, n[r++] = 128 | s & 63;
        }
      }
      return n[r] = 0, r - a;
    }
    function bn(e, n, r) {
      return En(e, J, n, r);
    }
    function Ve(e) {
      for (var n = 0, r = 0; r < e.length; ++r) {
        var t = e.charCodeAt(r);
        t >= 55296 && t <= 57343 && (t = 65536 + ((t & 1023) << 10) | e.charCodeAt(++r) & 1023), t <= 127 ? ++n : t <= 2047 ? n += 2 : t <= 65535 ? n += 3 : n += 4;
      }
      return n;
    }
    typeof TextDecoder < "u" && new TextDecoder("utf-16le");
    function Rr(e, n) {
      ne.set(e, n);
    }
    function Ar(e, n, r) {
      for (var t = 0; t < e.length; ++t)
        ne[n++ >> 0] = e.charCodeAt(t);
      ne[n >> 0] = 0;
    }
    var Hn = 16384, Yn = 65536;
    function Gn(e, n) {
      return e % n > 0 && (e += n - e % n), e;
    }
    var qe, ne, J, nn, Sn, E, se, Xn, Kn;
    function Zn(e) {
      qe = e, i.HEAP8 = ne = new Int8Array(e), i.HEAP16 = nn = new Int16Array(e), i.HEAP32 = E = new Int32Array(e), i.HEAPU8 = J = new Uint8Array(e), i.HEAPU16 = Sn = new Uint16Array(e), i.HEAPU32 = se = new Uint32Array(e), i.HEAPF32 = Xn = new Float32Array(e), i.HEAPF64 = Kn = new Float64Array(e);
    }
    var Mr = 7022992, kn = 1779952, Qn = i.TOTAL_MEMORY || 134217728;
    i.wasmMemory ? he = i.wasmMemory : he = new WebAssembly.Memory({
      initial: Qn / Yn,
      maximum: 1073741824 / Yn
    }), he && (qe = he.buffer), Qn = qe.byteLength, Zn(qe), E[kn >> 2] = Mr;
    function rn(e) {
      for (; e.length > 0; ) {
        var n = e.shift();
        if (typeof n == "function") {
          n();
          continue;
        }
        var r = n.func;
        typeof r == "number" ? n.arg === void 0 ? i.dynCall_v(r) : i.dynCall_vi(r, n.arg) : r(n.arg === void 0 ? null : n.arg);
      }
    }
    var Jn = [], er = [], Lr = [], nr = [], rr = !1;
    function Or() {
      if (i.preRun)
        for (typeof i.preRun == "function" && (i.preRun = [i.preRun]); i.preRun.length; )
          Ir(i.preRun.shift());
      rn(Jn);
    }
    function xr() {
      rr = !0, !i.noFSInit && !o.init.initialized && o.init(), rn(er);
    }
    function Nr() {
      o.ignorePermissions = !1, rn(Lr);
    }
    function Br() {
      if (i.postRun)
        for (typeof i.postRun == "function" && (i.postRun = [i.postRun]); i.postRun.length; )
          zr(i.postRun.shift());
      rn(nr);
    }
    function Ir(e) {
      Jn.unshift(e);
    }
    function zr(e) {
      nr.unshift(e);
    }
    var Dn = Math.abs, He = Math.ceil, Ye = Math.floor, Pn = Math.min, we = 0, Ge = null;
    function ra(e) {
      return e;
    }
    function tn(e) {
      we++, i.monitorRunDependencies && i.monitorRunDependencies(we);
    }
    function Xe(e) {
      if (we--, i.monitorRunDependencies && i.monitorRunDependencies(we), we == 0 && Ge) {
        var n = Ge;
        Ge = null, n();
      }
    }
    i.preloadedImages = {}, i.preloadedAudios = {};
    function G(e) {
      throw i.onAbort && i.onAbort(e), e += "", Ue(e), ee(e), _e = !0, "abort(" + e + "). Build with -s ASSERTIONS=1 for more info.";
    }
    var Fn = "data:application/octet-stream;base64,";
    function Tn(e) {
      return String.prototype.startsWith ? e.startsWith(Fn) : e.indexOf(Fn) === 0;
    }
    var me = "opencv.wasm";
    Tn(me) || (me = le(me));
    function ir() {
      try {
        if (We)
          return new Uint8Array(We);
        var e = Fe(me);
        if (e)
          return e;
        if (ue)
          return ue(me);
        throw "both async and sync fetching of the wasm failed";
      } catch (n) {
        G(n);
      }
    }
    function Ur() {
      return !We && (R || S) && typeof fetch == "function" ? fetch(me, { credentials: "same-origin" }).then(function(e) {
        if (!e.ok)
          throw "failed to load wasm binary file at '" + me + "'";
        return e.arrayBuffer();
      }).catch(function() {
        return ir();
      }) : new Promise(function(e, n) {
        e(ir());
      });
    }
    function jr() {
      var e = { env: br, wasi_unstable: br };
      function n(u, s) {
        var d = u.exports;
        i.asm = d, Xe();
      }
      tn();
      function r(u) {
        n(u.instance);
      }
      function t(u) {
        return Ur().then(function(s) {
          return WebAssembly.instantiate(s, e);
        }).then(u, function(s) {
          ee("failed to asynchronously prepare wasm: " + s), G(s);
        });
      }
      function a() {
        if (!We && typeof WebAssembly.instantiateStreaming == "function" && !Tn(me) && typeof fetch == "function")
          fetch(me, { credentials: "same-origin" }).then(
            function(u) {
              var s = WebAssembly.instantiateStreaming(u, e);
              return s.then(r, function(d) {
                ee("wasm streaming compile failed: " + d), ee("falling back to ArrayBuffer instantiation"), t(r);
              });
            }
          );
        else
          return t(r);
      }
      if (i.instantiateWasm)
        try {
          var l = i.instantiateWasm(e, n);
          return l;
        } catch (u) {
          return ee("Module.instantiateWasm callback failed with error: " + u), !1;
        }
      return a(), {};
    }
    var Z, pe;
    er.push({
      func: function() {
        Vt();
      }
    });
    function Wr(e, n) {
      if (c.mainLoop.timingMode = e, c.mainLoop.timingValue = n, !c.mainLoop.func)
        return 1;
      if (e == 0)
        c.mainLoop.scheduler = function() {
          var u = Math.max(
            0,
            c.mainLoop.tickStartTime + n - Ce()
          ) | 0;
          setTimeout(c.mainLoop.runner, u);
        }, c.mainLoop.method = "timeout";
      else if (e == 1)
        c.mainLoop.scheduler = function() {
          c.requestAnimationFrame(c.mainLoop.runner);
        }, c.mainLoop.method = "rAF";
      else if (e == 2) {
        if (typeof setImmediate > "u") {
          var r = [], t = "setimmediate", a = function(l) {
            (l.data === t || l.data.target === t) && (l.stopPropagation(), r.shift()());
          };
          addEventListener(
            "message",
            a,
            !0
          ), setImmediate = function(u) {
            r.push(u), S ? (i.setImmediates === void 0 && (i.setImmediates = []), i.setImmediates.push(u), postMessage({ target: t })) : postMessage(t, "*");
          };
        }
        c.mainLoop.scheduler = function() {
          setImmediate(c.mainLoop.runner);
        }, c.mainLoop.method = "immediate";
      }
      return 0;
    }
    function Ce() {
      G();
    }
    function $r(e, n, r, t, a) {
      ae(
        !c.mainLoop.func,
        "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters."
      ), c.mainLoop.func = e, c.mainLoop.arg = t;
      var l;
      typeof t < "u" ? l = function() {
        i.dynCall_vi(e, t);
      } : l = function() {
        i.dynCall_v(e);
      };
      var u = c.mainLoop.currentlyRunningMainloop;
      c.mainLoop.runner = function() {
        if (!_e) {
          if (c.mainLoop.queue.length > 0) {
            var d = Date.now(), f = c.mainLoop.queue.shift();
            if (f.func(f.arg), c.mainLoop.remainingBlockers) {
              var m = c.mainLoop.remainingBlockers, p = m % 1 == 0 ? m - 1 : Math.floor(m);
              f.counted ? c.mainLoop.remainingBlockers = p : (p = p + 0.5, c.mainLoop.remainingBlockers = (8 * m + p) / 9);
            }
            if (console.log(
              'main loop blocker "' + f.name + '" took ' + (Date.now() - d) + " ms"
            ), c.mainLoop.updateStatus(), u < c.mainLoop.currentlyRunningMainloop)
              return;
            setTimeout(c.mainLoop.runner, 0);
            return;
          }
          if (!(u < c.mainLoop.currentlyRunningMainloop)) {
            if (c.mainLoop.currentFrameNumber = c.mainLoop.currentFrameNumber + 1 | 0, c.mainLoop.timingMode == 1 && c.mainLoop.timingValue > 1 && c.mainLoop.currentFrameNumber % c.mainLoop.timingValue != 0) {
              c.mainLoop.scheduler();
              return;
            } else c.mainLoop.timingMode == 0 && (c.mainLoop.tickStartTime = Ce());
            c.mainLoop.method === "timeout" && i.ctx && (ee(
              "Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!"
            ), c.mainLoop.method = ""), c.mainLoop.runIter(l), !(u < c.mainLoop.currentlyRunningMainloop) && (typeof SDL == "object" && SDL.audio && SDL.audio.queueNewAudioData && SDL.audio.queueNewAudioData(), c.mainLoop.scheduler());
          }
        }
      };
    }
    var c = {
      mainLoop: {
        scheduler: null,
        method: "",
        currentlyRunningMainloop: 0,
        func: null,
        arg: 0,
        timingMode: 0,
        timingValue: 0,
        currentFrameNumber: 0,
        queue: [],
        pause: function() {
          c.mainLoop.scheduler = null, c.mainLoop.currentlyRunningMainloop++;
        },
        resume: function() {
          c.mainLoop.currentlyRunningMainloop++;
          var e = c.mainLoop.timingMode, n = c.mainLoop.timingValue, r = c.mainLoop.func;
          c.mainLoop.func = null, $r(r, 0, !1, c.mainLoop.arg), Wr(e, n), c.mainLoop.scheduler();
        },
        updateStatus: function() {
          if (i.setStatus) {
            var e = i.statusMessage || "Please wait...", n = c.mainLoop.remainingBlockers, r = c.mainLoop.expectedBlockers;
            n ? n < r ? i.setStatus(
              e + " (" + (r - n) + "/" + r + ")"
            ) : i.setStatus(e) : i.setStatus("");
          }
        },
        runIter: function(e) {
          if (!_e) {
            if (i.preMainLoop) {
              var n = i.preMainLoop();
              if (n === !1)
                return;
            }
            try {
              e();
            } catch (r) {
              if (r instanceof kr)
                return;
              throw r && typeof r == "object" && r.stack && ee("exception thrown: " + [r, r.stack]), r;
            }
            i.postMainLoop && i.postMainLoop();
          }
        }
      },
      isFullscreen: !1,
      pointerLock: !1,
      moduleContextCreatedCallbacks: [],
      workers: [],
      init: function() {
        if (i.preloadPlugins || (i.preloadPlugins = []), c.initted) return;
        c.initted = !0;
        try {
          new Blob(), c.hasBlobConstructor = !0;
        } catch {
          c.hasBlobConstructor = !1, console.log(
            "warning: no blob constructor, cannot create blobs with mimetypes"
          );
        }
        c.BlobBuilder = typeof MozBlobBuilder < "u" ? MozBlobBuilder : typeof WebKitBlobBuilder < "u" ? WebKitBlobBuilder : c.hasBlobConstructor ? null : console.log("warning: no BlobBuilder"), c.URLObject = typeof window < "u" ? window.URL ? window.URL : window.webkitURL : void 0, !i.noImageDecoding && typeof c.URLObject > "u" && (console.log(
          "warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available."
        ), i.noImageDecoding = !0);
        var e = {};
        e.canHandle = function(l) {
          return !i.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(l);
        }, e.handle = function(l, u, s, d) {
          var f = null;
          if (c.hasBlobConstructor)
            try {
              f = new Blob([l], { type: c.getMimetype(u) }), f.size !== l.length && (f = new Blob([new Uint8Array(l).buffer], {
                type: c.getMimetype(u)
              }));
            } catch (g) {
              je(
                "Blob constructor present but fails: " + g + "; falling back to blob builder"
              );
            }
          if (!f) {
            var m = new c.BlobBuilder();
            m.append(new Uint8Array(l).buffer), f = m.getBlob();
          }
          var p = c.URLObject.createObjectURL(f), _ = new Image();
          _.onload = function() {
            ae(_.complete, "Image " + u + " could not be decoded");
            var w = document.createElement("canvas");
            w.width = _.width, w.height = _.height;
            var L = w.getContext("2d");
            L.drawImage(_, 0, 0), i.preloadedImages[u] = w, c.URLObject.revokeObjectURL(p), s && s(l);
          }, _.onerror = function(w) {
            console.log("Image " + p + " could not be decoded"), d && d();
          }, _.src = p;
        }, i.preloadPlugins.push(e);
        var n = {};
        n.canHandle = function(l) {
          return !i.noAudioDecoding && l.substr(-4) in { ".ogg": 1, ".wav": 1, ".mp3": 1 };
        }, n.handle = function(l, u, s, d) {
          var f = !1;
          function m(L) {
            f || (f = !0, i.preloadedAudios[u] = L, s && s(l));
          }
          function p() {
            f || (f = !0, i.preloadedAudios[u] = new Audio(), d && d());
          }
          if (c.hasBlobConstructor) {
            try {
              var _ = new Blob([l], {
                type: c.getMimetype(u)
              });
            } catch {
              return p();
            }
            var g = c.URLObject.createObjectURL(_), w = new Audio();
            w.addEventListener(
              "canplaythrough",
              function() {
                m(w);
              },
              !1
            ), w.onerror = function(W) {
              if (f) return;
              console.log(
                "warning: browser could not fully decode audio " + u + ", trying slower base64 approach"
              );
              function z(v) {
                for (var h = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", U = "=", F = "", I = 0, Q = 0, de = 0; de < v.length; de++)
                  for (I = I << 8 | v[de], Q += 8; Q >= 6; ) {
                    var Qt = I >> Q - 6 & 63;
                    Q -= 6, F += h[Qt];
                  }
                return Q == 2 ? (F += h[(I & 3) << 4], F += U + U) : Q == 4 && (F += h[(I & 15) << 2], F += U), F;
              }
              w.src = "data:audio/x-" + u.substr(-3) + ";base64," + z(l), m(w);
            }, w.src = g, c.safeSetTimeout(function() {
              m(w);
            }, 1e4);
          } else
            return p();
        }, i.preloadPlugins.push(n);
        function r() {
          c.pointerLock = document.pointerLockElement === i.canvas || document.mozPointerLockElement === i.canvas || document.webkitPointerLockElement === i.canvas || document.msPointerLockElement === i.canvas;
        }
        var t = i.canvas;
        t && (t.requestPointerLock = t.requestPointerLock || t.mozRequestPointerLock || t.webkitRequestPointerLock || t.msRequestPointerLock || function() {
        }, t.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock || document.msExitPointerLock || function() {
        }, t.exitPointerLock = t.exitPointerLock.bind(document), document.addEventListener(
          "pointerlockchange",
          r,
          !1
        ), document.addEventListener(
          "mozpointerlockchange",
          r,
          !1
        ), document.addEventListener(
          "webkitpointerlockchange",
          r,
          !1
        ), document.addEventListener(
          "mspointerlockchange",
          r,
          !1
        ), i.elementPointerLock && t.addEventListener(
          "click",
          function(a) {
            !c.pointerLock && i.canvas.requestPointerLock && (i.canvas.requestPointerLock(), a.preventDefault());
          },
          !1
        ));
      },
      createContext: function(e, n, r, t) {
        if (n && i.ctx && e == i.canvas)
          return i.ctx;
        var a, l;
        if (n) {
          var u = {
            antialias: !1,
            alpha: !1,
            majorVersion: 1
          };
          if (t)
            for (var s in t)
              u[s] = t[s];
          typeof GL < "u" && (l = GL.createContext(e, u), l && (a = GL.getContext(l).GLctx));
        } else
          a = e.getContext("2d");
        return a ? (r && (n || ae(
          typeof GLctx > "u",
          "cannot set in module if GLctx is used, but we are a non-GL context that would replace it"
        ), i.ctx = a, n && GL.makeContextCurrent(l), i.useWebGL = n, c.moduleContextCreatedCallbacks.forEach(function(d) {
          d();
        }), c.init()), a) : null;
      },
      destroyContext: function(e, n, r) {
      },
      fullscreenHandlersInstalled: !1,
      lockPointer: void 0,
      resizeCanvas: void 0,
      requestFullscreen: function(e, n, r) {
        c.lockPointer = e, c.resizeCanvas = n, c.vrDevice = r, typeof c.lockPointer > "u" && (c.lockPointer = !0), typeof c.resizeCanvas > "u" && (c.resizeCanvas = !1), typeof c.vrDevice > "u" && (c.vrDevice = null);
        var t = i.canvas;
        function a() {
          c.isFullscreen = !1;
          var u = t.parentNode;
          (document.fullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement) === u ? (t.exitFullscreen = c.exitFullscreen, c.lockPointer && t.requestPointerLock(), c.isFullscreen = !0, c.resizeCanvas ? c.setFullscreenCanvasSize() : c.updateCanvasDimensions(t)) : (u.parentNode.insertBefore(t, u), u.parentNode.removeChild(u), c.resizeCanvas ? c.setWindowedCanvasSize() : c.updateCanvasDimensions(t)), i.onFullScreen && i.onFullScreen(c.isFullscreen), i.onFullscreen && i.onFullscreen(c.isFullscreen);
        }
        c.fullscreenHandlersInstalled || (c.fullscreenHandlersInstalled = !0, document.addEventListener(
          "fullscreenchange",
          a,
          !1
        ), document.addEventListener(
          "mozfullscreenchange",
          a,
          !1
        ), document.addEventListener(
          "webkitfullscreenchange",
          a,
          !1
        ), document.addEventListener(
          "MSFullscreenChange",
          a,
          !1
        ));
        var l = document.createElement("div");
        t.parentNode.insertBefore(l, t), l.appendChild(t), l.requestFullscreen = l.requestFullscreen || l.mozRequestFullScreen || l.msRequestFullscreen || (l.webkitRequestFullscreen ? function() {
          l.webkitRequestFullscreen(
            Element.ALLOW_KEYBOARD_INPUT
          );
        } : null) || (l.webkitRequestFullScreen ? function() {
          l.webkitRequestFullScreen(
            Element.ALLOW_KEYBOARD_INPUT
          );
        } : null), r ? l.requestFullscreen({ vrDisplay: r }) : l.requestFullscreen();
      },
      requestFullScreen: function(e, n, r) {
        return ee(
          "Browser.requestFullScreen() is deprecated. Please call Browser.requestFullscreen instead."
        ), c.requestFullScreen = function(t, a, l) {
          return c.requestFullscreen(t, a, l);
        }, c.requestFullscreen(e, n, r);
      },
      exitFullscreen: function() {
        if (!c.isFullscreen)
          return !1;
        var e = document.exitFullscreen || document.cancelFullScreen || document.mozCancelFullScreen || document.msExitFullscreen || document.webkitCancelFullScreen || function() {
        };
        return e.apply(document, []), !0;
      },
      nextRAF: 0,
      fakeRequestAnimationFrame: function(e) {
        var n = Date.now();
        if (c.nextRAF === 0)
          c.nextRAF = n + 1e3 / 60;
        else
          for (; n + 2 >= c.nextRAF; )
            c.nextRAF += 1e3 / 60;
        var r = Math.max(c.nextRAF - n, 0);
        setTimeout(e, r);
      },
      requestAnimationFrame: function(e) {
        if (typeof requestAnimationFrame == "function") {
          requestAnimationFrame(e);
          return;
        }
        var n = c.fakeRequestAnimationFrame;
        n(e);
      },
      safeCallback: function(e) {
        return function() {
          if (!_e) return e.apply(null, arguments);
        };
      },
      allowAsyncCallbacks: !0,
      queuedAsyncCallbacks: [],
      pauseAsyncCallbacks: function() {
        c.allowAsyncCallbacks = !1;
      },
      resumeAsyncCallbacks: function() {
        if (c.allowAsyncCallbacks = !0, c.queuedAsyncCallbacks.length > 0) {
          var e = c.queuedAsyncCallbacks;
          c.queuedAsyncCallbacks = [], e.forEach(function(n) {
            n();
          });
        }
      },
      safeRequestAnimationFrame: function(e) {
        return c.requestAnimationFrame(function() {
          _e || (c.allowAsyncCallbacks ? e() : c.queuedAsyncCallbacks.push(e));
        });
      },
      safeSetTimeout: function(e, n) {
        return setTimeout(function() {
          _e || (c.allowAsyncCallbacks ? e() : c.queuedAsyncCallbacks.push(e));
        }, n);
      },
      safeSetInterval: function(e, n) {
        return setInterval(function() {
          _e || c.allowAsyncCallbacks && e();
        }, n);
      },
      getMimetype: function(e) {
        return {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          bmp: "image/bmp",
          ogg: "audio/ogg",
          wav: "audio/wav",
          mp3: "audio/mpeg"
        }[e.substr(e.lastIndexOf(".") + 1)];
      },
      getUserMedia: function(e) {
        window.getUserMedia || (window.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia), window.getUserMedia(e);
      },
      getMovementX: function(e) {
        return e.movementX || e.mozMovementX || e.webkitMovementX || 0;
      },
      getMovementY: function(e) {
        return e.movementY || e.mozMovementY || e.webkitMovementY || 0;
      },
      getMouseWheelDelta: function(e) {
        var n = 0;
        switch (e.type) {
          case "DOMMouseScroll":
            n = e.detail / 3;
            break;
          case "mousewheel":
            n = e.wheelDelta / 120;
            break;
          case "wheel":
            switch (n = e.deltaY, e.deltaMode) {
              case 0:
                n /= 100;
                break;
              case 1:
                n /= 3;
                break;
              case 2:
                n *= 80;
                break;
              default:
                throw "unrecognized mouse wheel delta mode: " + e.deltaMode;
            }
            break;
          default:
            throw "unrecognized mouse wheel event: " + e.type;
        }
        return n;
      },
      mouseX: 0,
      mouseY: 0,
      mouseMovementX: 0,
      mouseMovementY: 0,
      touches: {},
      lastTouches: {},
      calculateMouseEvent: function(e) {
        if (c.pointerLock)
          e.type != "mousemove" && "mozMovementX" in e ? c.mouseMovementX = c.mouseMovementY = 0 : (c.mouseMovementX = c.getMovementX(e), c.mouseMovementY = c.getMovementY(e)), typeof SDL < "u" ? (c.mouseX = SDL.mouseX + c.mouseMovementX, c.mouseY = SDL.mouseY + c.mouseMovementY) : (c.mouseX += c.mouseMovementX, c.mouseY += c.mouseMovementY);
        else {
          var n = i.canvas.getBoundingClientRect(), r = i.canvas.width, t = i.canvas.height, a = typeof window.scrollX < "u" ? window.scrollX : window.pageXOffset, l = typeof window.scrollY < "u" ? window.scrollY : window.pageYOffset;
          if (e.type === "touchstart" || e.type === "touchend" || e.type === "touchmove") {
            var u = e.touch;
            if (u === void 0)
              return;
            var s = u.pageX - (a + n.left), d = u.pageY - (l + n.top);
            s = s * (r / n.width), d = d * (t / n.height);
            var f = { x: s, y: d };
            if (e.type === "touchstart")
              c.lastTouches[u.identifier] = f, c.touches[u.identifier] = f;
            else if (e.type === "touchend" || e.type === "touchmove") {
              var m = c.touches[u.identifier];
              m || (m = f), c.lastTouches[u.identifier] = m, c.touches[u.identifier] = f;
            }
            return;
          }
          var p = e.pageX - (a + n.left), _ = e.pageY - (l + n.top);
          p = p * (r / n.width), _ = _ * (t / n.height), c.mouseMovementX = p - c.mouseX, c.mouseMovementY = _ - c.mouseY, c.mouseX = p, c.mouseY = _;
        }
      },
      asyncLoad: function(e, n, r, t) {
        var a = t ? "" : "al " + e;
        ge(
          e,
          function(l) {
            ae(
              l,
              'Loading data file "' + e + '" failed (no arrayBuffer).'
            ), n(new Uint8Array(l)), a && Xe();
          },
          function(l) {
            if (r)
              r();
            else
              throw 'Loading data file "' + e + '" failed.';
          }
        ), a && tn();
      },
      resizeListeners: [],
      updateResizeListeners: function() {
        var e = i.canvas;
        c.resizeListeners.forEach(function(n) {
          n(e.width, e.height);
        });
      },
      setCanvasSize: function(e, n, r) {
        var t = i.canvas;
        c.updateCanvasDimensions(t, e, n), r || c.updateResizeListeners();
      },
      windowedWidth: 0,
      windowedHeight: 0,
      setFullscreenCanvasSize: function() {
        if (typeof SDL < "u") {
          var e = se[SDL.screen >> 2];
          e = e | 8388608, E[SDL.screen >> 2] = e;
        }
        c.updateCanvasDimensions(i.canvas), c.updateResizeListeners();
      },
      setWindowedCanvasSize: function() {
        if (typeof SDL < "u") {
          var e = se[SDL.screen >> 2];
          e = e & -8388609, E[SDL.screen >> 2] = e;
        }
        c.updateCanvasDimensions(i.canvas), c.updateResizeListeners();
      },
      updateCanvasDimensions: function(e, n, r) {
        n && r ? (e.widthNative = n, e.heightNative = r) : (n = e.widthNative, r = e.heightNative);
        var t = n, a = r;
        if (i.forcedAspectRatio && i.forcedAspectRatio > 0 && (t / a < i.forcedAspectRatio ? t = Math.round(a * i.forcedAspectRatio) : a = Math.round(t / i.forcedAspectRatio)), (document.fullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement) === e.parentNode && typeof screen < "u") {
          var l = Math.min(screen.width / t, screen.height / a);
          t = Math.round(t * l), a = Math.round(a * l);
        }
        c.resizeCanvas ? (e.width != t && (e.width = t), e.height != a && (e.height = a), typeof e.style < "u" && (e.style.removeProperty("width"), e.style.removeProperty("height"))) : (e.width != n && (e.width = n), e.height != r && (e.height = r), typeof e.style < "u" && (t != n || a != r ? (e.style.setProperty("width", t + "px", "important"), e.style.setProperty("height", a + "px", "important")) : (e.style.removeProperty("width"), e.style.removeProperty("height"))));
      },
      wgetRequests: {},
      nextWgetRequestHandle: 0,
      getNextWgetRequestHandle: function() {
        var e = c.nextWgetRequestHandle;
        return c.nextWgetRequestHandle++, e;
      }
    };
    function Vr(e) {
      var n = i.___cxa_demangle || i.__cxa_demangle;
      ae(n);
      try {
        var r = e;
        r.startsWith("__Z") && (r = r.substr(1));
        var t = Ve(r) + 1, a = Te(t);
        bn(r, a, t);
        var l = Te(4), u = n(a, 0, 0, l);
        if (E[l >> 2] === 0 && u)
          return $e(u);
      } catch {
      } finally {
        a && oe(a), l && oe(l), u && oe(u);
      }
      return e;
    }
    function qr(e) {
      var n = /\b_Z[\w\d_]+/g;
      return e.replace(n, function(r) {
        var t = Vr(r);
        return r === t ? r : t + " [" + r + "]";
      });
    }
    function Hr() {
      var e = new Error();
      if (!e.stack) {
        try {
          throw new Error(0);
        } catch (n) {
          e = n;
        }
        if (!e.stack)
          return "(no stack trace available)";
      }
      return e.stack.toString();
    }
    function Yr() {
      var e = Hr();
      return i.extraStackTrace && (e += `
` + i.extraStackTrace()), qr(e);
    }
    function Gr(e) {
      return Te(e);
    }
    function tr(e, n) {
    }
    function Xr() {
      return tr.apply(null, arguments);
    }
    function Kr() {
      return tr.apply(null, arguments);
    }
    function Zr(e, n, r) {
      throw "uncaught_exception" in $n ? $n.uncaught_exceptions++ : $n.uncaught_exceptions = 1, e;
    }
    function Qr() {
    }
    function Ee(e) {
      return i.___errno_location && (E[i.___errno_location() >> 2] = e), e;
    }
    function Jr(e, n) {
      return Ee(63), -1;
    }
    var M = {
      splitPath: function(e) {
        var n = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return n.exec(e).slice(1);
      },
      normalizeArray: function(e, n) {
        for (var r = 0, t = e.length - 1; t >= 0; t--) {
          var a = e[t];
          a === "." ? e.splice(t, 1) : a === ".." ? (e.splice(t, 1), r++) : r && (e.splice(t, 1), r--);
        }
        if (n)
          for (; r; r--)
            e.unshift("..");
        return e;
      },
      normalize: function(e) {
        var n = e.charAt(0) === "/", r = e.substr(-1) === "/";
        return e = M.normalizeArray(
          e.split("/").filter(function(t) {
            return !!t;
          }),
          !n
        ).join("/"), !e && !n && (e = "."), e && r && (e += "/"), (n ? "/" : "") + e;
      },
      dirname: function(e) {
        var n = M.splitPath(e), r = n[0], t = n[1];
        return !r && !t ? "." : (t && (t = t.substr(0, t.length - 1)), r + t);
      },
      basename: function(e) {
        if (e === "/") return "/";
        var n = e.lastIndexOf("/");
        return n === -1 ? e : e.substr(n + 1);
      },
      extname: function(e) {
        return M.splitPath(e)[3];
      },
      join: function() {
        var e = Array.prototype.slice.call(arguments, 0);
        return M.normalize(e.join("/"));
      },
      join2: function(e, n) {
        return M.normalize(e + "/" + n);
      }
    }, fe = {
      resolve: function() {
        for (var e = "", n = !1, r = arguments.length - 1; r >= -1 && !n; r--) {
          var t = r >= 0 ? arguments[r] : o.cwd();
          if (typeof t != "string")
            throw new TypeError("Arguments to path.resolve must be strings");
          if (!t)
            return "";
          e = t + "/" + e, n = t.charAt(0) === "/";
        }
        return e = M.normalizeArray(
          e.split("/").filter(function(a) {
            return !!a;
          }),
          !n
        ).join("/"), (n ? "/" : "") + e || ".";
      },
      relative: function(e, n) {
        e = fe.resolve(e).substr(1), n = fe.resolve(n).substr(1);
        function r(f) {
          for (var m = 0; m < f.length && f[m] === ""; m++)
            ;
          for (var p = f.length - 1; p >= 0 && f[p] === ""; p--)
            ;
          return m > p ? [] : f.slice(m, p - m + 1);
        }
        for (var t = r(e.split("/")), a = r(n.split("/")), l = Math.min(t.length, a.length), u = l, s = 0; s < l; s++)
          if (t[s] !== a[s]) {
            u = s;
            break;
          }
        for (var d = [], s = u; s < t.length; s++)
          d.push("..");
        return d = d.concat(a.slice(u)), d.join("/");
      }
    }, be = {
      ttys: [],
      init: function() {
      },
      shutdown: function() {
      },
      register: function(e, n) {
        be.ttys[e] = { input: [], output: [], ops: n }, o.registerDevice(e, be.stream_ops);
      },
      stream_ops: {
        open: function(e) {
          var n = be.ttys[e.node.rdev];
          if (!n)
            throw new o.ErrnoError(43);
          e.tty = n, e.seekable = !1;
        },
        close: function(e) {
          e.tty.ops.flush(e.tty);
        },
        flush: function(e) {
          e.tty.ops.flush(e.tty);
        },
        read: function(e, n, r, t, a) {
          if (!e.tty || !e.tty.ops.get_char)
            throw new o.ErrnoError(60);
          for (var l = 0, u = 0; u < t; u++) {
            var s;
            try {
              s = e.tty.ops.get_char(e.tty);
            } catch {
              throw new o.ErrnoError(29);
            }
            if (s === void 0 && l === 0)
              throw new o.ErrnoError(6);
            if (s == null) break;
            l++, n[r + u] = s;
          }
          return l && (e.node.timestamp = Date.now()), l;
        },
        write: function(e, n, r, t, a) {
          if (!e.tty || !e.tty.ops.put_char)
            throw new o.ErrnoError(60);
          try {
            for (var l = 0; l < t; l++)
              e.tty.ops.put_char(e.tty, n[r + l]);
          } catch {
            throw new o.ErrnoError(29);
          }
          return t && (e.node.timestamp = Date.now()), l;
        }
      },
      default_tty_ops: {
        get_char: function(e) {
          if (!e.input.length) {
            var n = null;
            if (N) {
              var r = 256, t = Buffer.alloc ? Buffer.alloc(r) : new Buffer(r), a = 0;
              try {
                a = K.readSync(
                  process.stdin.fd,
                  t,
                  0,
                  r,
                  null
                );
              } catch (l) {
                if (l.toString().indexOf("EOF") != -1) a = 0;
                else throw l;
              }
              a > 0 ? n = t.slice(0, a).toString("utf-8") : n = null;
            } else typeof window < "u" && typeof window.prompt == "function" ? (n = window.prompt("Input: "), n !== null && (n += `
`)) : typeof readline == "function" && (n = readline(), n !== null && (n += `
`));
            if (!n)
              return null;
            e.input = vn(n, !0);
          }
          return e.input.shift();
        },
        put_char: function(e, n) {
          n === null || n === 10 ? (Ue(Re(e.output, 0)), e.output = []) : n != 0 && e.output.push(n);
        },
        flush: function(e) {
          e.output && e.output.length > 0 && (Ue(Re(e.output, 0)), e.output = []);
        }
      },
      default_tty1_ops: {
        put_char: function(e, n) {
          n === null || n === 10 ? (ee(Re(e.output, 0)), e.output = []) : n != 0 && e.output.push(n);
        },
        flush: function(e) {
          e.output && e.output.length > 0 && (ee(Re(e.output, 0)), e.output = []);
        }
      }
    }, P = {
      ops_table: null,
      mount: function(e) {
        return P.createNode(null, "/", 16895, 0);
      },
      createNode: function(e, n, r, t) {
        if (o.isBlkdev(r) || o.isFIFO(r))
          throw new o.ErrnoError(63);
        P.ops_table || (P.ops_table = {
          dir: {
            node: {
              getattr: P.node_ops.getattr,
              setattr: P.node_ops.setattr,
              lookup: P.node_ops.lookup,
              mknod: P.node_ops.mknod,
              rename: P.node_ops.rename,
              unlink: P.node_ops.unlink,
              rmdir: P.node_ops.rmdir,
              readdir: P.node_ops.readdir,
              symlink: P.node_ops.symlink
            },
            stream: { llseek: P.stream_ops.llseek }
          },
          file: {
            node: {
              getattr: P.node_ops.getattr,
              setattr: P.node_ops.setattr
            },
            stream: {
              llseek: P.stream_ops.llseek,
              read: P.stream_ops.read,
              write: P.stream_ops.write,
              allocate: P.stream_ops.allocate,
              mmap: P.stream_ops.mmap,
              msync: P.stream_ops.msync
            }
          },
          link: {
            node: {
              getattr: P.node_ops.getattr,
              setattr: P.node_ops.setattr,
              readlink: P.node_ops.readlink
            },
            stream: {}
          },
          chrdev: {
            node: {
              getattr: P.node_ops.getattr,
              setattr: P.node_ops.setattr
            },
            stream: o.chrdev_stream_ops
          }
        });
        var a = o.createNode(e, n, r, t);
        return o.isDir(a.mode) ? (a.node_ops = P.ops_table.dir.node, a.stream_ops = P.ops_table.dir.stream, a.contents = {}) : o.isFile(a.mode) ? (a.node_ops = P.ops_table.file.node, a.stream_ops = P.ops_table.file.stream, a.usedBytes = 0, a.contents = null) : o.isLink(a.mode) ? (a.node_ops = P.ops_table.link.node, a.stream_ops = P.ops_table.link.stream) : o.isChrdev(a.mode) && (a.node_ops = P.ops_table.chrdev.node, a.stream_ops = P.ops_table.chrdev.stream), a.timestamp = Date.now(), e && (e.contents[n] = a), a;
      },
      getFileDataAsRegularArray: function(e) {
        if (e.contents && e.contents.subarray) {
          for (var n = [], r = 0; r < e.usedBytes; ++r) n.push(e.contents[r]);
          return n;
        }
        return e.contents;
      },
      getFileDataAsTypedArray: function(e) {
        return e.contents ? e.contents.subarray ? e.contents.subarray(0, e.usedBytes) : new Uint8Array(e.contents) : new Uint8Array();
      },
      expandFileStorage: function(e, n) {
        var r = e.contents ? e.contents.length : 0;
        if (!(r >= n)) {
          var t = 1024 * 1024;
          n = Math.max(
            n,
            r * (r < t ? 2 : 1.125) | 0
          ), r != 0 && (n = Math.max(n, 256));
          var a = e.contents;
          e.contents = new Uint8Array(n), e.usedBytes > 0 && e.contents.set(a.subarray(0, e.usedBytes), 0);
        }
      },
      resizeFileStorage: function(e, n) {
        if (e.usedBytes != n) {
          if (n == 0) {
            e.contents = null, e.usedBytes = 0;
            return;
          }
          if (!e.contents || e.contents.subarray) {
            var r = e.contents;
            e.contents = new Uint8Array(new ArrayBuffer(n)), r && e.contents.set(
              r.subarray(0, Math.min(n, e.usedBytes))
            ), e.usedBytes = n;
            return;
          }
          if (e.contents || (e.contents = []), e.contents.length > n) e.contents.length = n;
          else for (; e.contents.length < n; ) e.contents.push(0);
          e.usedBytes = n;
        }
      },
      node_ops: {
        getattr: function(e) {
          var n = {};
          return n.dev = o.isChrdev(e.mode) ? e.id : 1, n.ino = e.id, n.mode = e.mode, n.nlink = 1, n.uid = 0, n.gid = 0, n.rdev = e.rdev, o.isDir(e.mode) ? n.size = 4096 : o.isFile(e.mode) ? n.size = e.usedBytes : o.isLink(e.mode) ? n.size = e.link.length : n.size = 0, n.atime = new Date(e.timestamp), n.mtime = new Date(e.timestamp), n.ctime = new Date(e.timestamp), n.blksize = 4096, n.blocks = Math.ceil(n.size / n.blksize), n;
        },
        setattr: function(e, n) {
          n.mode !== void 0 && (e.mode = n.mode), n.timestamp !== void 0 && (e.timestamp = n.timestamp), n.size !== void 0 && P.resizeFileStorage(e, n.size);
        },
        lookup: function(e, n) {
          throw o.genericErrors[44];
        },
        mknod: function(e, n, r, t) {
          return P.createNode(e, n, r, t);
        },
        rename: function(e, n, r) {
          if (o.isDir(e.mode)) {
            var t;
            try {
              t = o.lookupNode(n, r);
            } catch {
            }
            if (t)
              for (var a in t.contents)
                throw new o.ErrnoError(55);
          }
          delete e.parent.contents[e.name], e.name = r, n.contents[r] = e, e.parent = n;
        },
        unlink: function(e, n) {
          delete e.contents[n];
        },
        rmdir: function(e, n) {
          var r = o.lookupNode(e, n);
          for (var t in r.contents)
            throw new o.ErrnoError(55);
          delete e.contents[n];
        },
        readdir: function(e) {
          var n = [".", ".."];
          for (var r in e.contents)
            e.contents.hasOwnProperty(r) && n.push(r);
          return n;
        },
        symlink: function(e, n, r) {
          var t = P.createNode(e, n, 41471, 0);
          return t.link = r, t;
        },
        readlink: function(e) {
          if (!o.isLink(e.mode))
            throw new o.ErrnoError(28);
          return e.link;
        }
      },
      stream_ops: {
        read: function(e, n, r, t, a) {
          var l = e.node.contents;
          if (a >= e.node.usedBytes) return 0;
          var u = Math.min(e.node.usedBytes - a, t);
          if (u > 8 && l.subarray)
            n.set(l.subarray(a, a + u), r);
          else
            for (var s = 0; s < u; s++)
              n[r + s] = l[a + s];
          return u;
        },
        write: function(e, n, r, t, a, l) {
          if (l = !1, !t) return 0;
          var u = e.node;
          if (u.timestamp = Date.now(), n.subarray && (!u.contents || u.contents.subarray)) {
            if (l)
              return u.contents = n.subarray(r, r + t), u.usedBytes = t, t;
            if (u.usedBytes === 0 && a === 0)
              return u.contents = new Uint8Array(
                n.subarray(r, r + t)
              ), u.usedBytes = t, t;
            if (a + t <= u.usedBytes)
              return u.contents.set(
                n.subarray(r, r + t),
                a
              ), t;
          }
          if (P.expandFileStorage(u, a + t), u.contents.subarray && n.subarray)
            u.contents.set(
              n.subarray(r, r + t),
              a
            );
          else
            for (var s = 0; s < t; s++)
              u.contents[a + s] = n[r + s];
          return u.usedBytes = Math.max(u.usedBytes, a + t), t;
        },
        llseek: function(e, n, r) {
          var t = n;
          if (r === 1 ? t += e.position : r === 2 && o.isFile(e.node.mode) && (t += e.node.usedBytes), t < 0)
            throw new o.ErrnoError(28);
          return t;
        },
        allocate: function(e, n, r) {
          P.expandFileStorage(e.node, n + r), e.node.usedBytes = Math.max(
            e.node.usedBytes,
            n + r
          );
        },
        mmap: function(e, n, r, t, a, l, u) {
          if (!o.isFile(e.node.mode))
            throw new o.ErrnoError(43);
          var s, d, f = e.node.contents;
          if (!(u & 2) && (f.buffer === n || f.buffer === n.buffer))
            d = !1, s = f.byteOffset;
          else {
            (a > 0 || a + t < e.node.usedBytes) && (f.subarray ? f = f.subarray(a, a + t) : f = Array.prototype.slice.call(
              f,
              a,
              a + t
            )), d = !0;
            var m = n.buffer == ne.buffer;
            if (s = Te(t), !s)
              throw new o.ErrnoError(48);
            (m ? ne : n).set(f, s);
          }
          return { ptr: s, allocated: d };
        },
        msync: function(e, n, r, t, a) {
          if (!o.isFile(e.node.mode))
            throw new o.ErrnoError(43);
          return a & 2 || P.stream_ops.write(
            e,
            n,
            0,
            t,
            r,
            !1
          ), 0;
        }
      }
    }, V = {
      dbs: {},
      indexedDB: function() {
        if (typeof indexedDB < "u") return indexedDB;
        var e = null;
        return typeof window == "object" && (e = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB), ae(e, "IDBFS used, but indexedDB not supported"), e;
      },
      DB_VERSION: 21,
      DB_STORE_NAME: "FILE_DATA",
      mount: function(e) {
        return P.mount.apply(null, arguments);
      },
      syncfs: function(e, n, r) {
        V.getLocalSet(e, function(t, a) {
          if (t) return r(t);
          V.getRemoteSet(e, function(l, u) {
            if (l) return r(l);
            var s = n ? u : a, d = n ? a : u;
            V.reconcile(s, d, r);
          });
        });
      },
      getDB: function(e, n) {
        var r = V.dbs[e];
        if (r)
          return n(null, r);
        var t;
        try {
          t = V.indexedDB().open(e, V.DB_VERSION);
        } catch (a) {
          return n(a);
        }
        if (!t)
          return n("Unable to connect to IndexedDB");
        t.onupgradeneeded = function(a) {
          var l = a.target.result, u = a.target.transaction, s;
          l.objectStoreNames.contains(V.DB_STORE_NAME) ? s = u.objectStore(V.DB_STORE_NAME) : s = l.createObjectStore(V.DB_STORE_NAME), s.indexNames.contains("timestamp") || s.createIndex("timestamp", "timestamp", { unique: !1 });
        }, t.onsuccess = function() {
          r = t.result, V.dbs[e] = r, n(null, r);
        }, t.onerror = function(a) {
          n(this.error), a.preventDefault();
        };
      },
      getLocalSet: function(e, n) {
        var r = {};
        function t(d) {
          return d !== "." && d !== "..";
        }
        function a(d) {
          return function(f) {
            return M.join2(d, f);
          };
        }
        for (var l = o.readdir(e.mountpoint).filter(t).map(a(e.mountpoint)); l.length; ) {
          var u = l.pop(), s;
          try {
            s = o.stat(u);
          } catch (d) {
            return n(d);
          }
          o.isDir(s.mode) && l.push.apply(
            l,
            o.readdir(u).filter(t).map(a(u))
          ), r[u] = { timestamp: s.mtime };
        }
        return n(null, { type: "local", entries: r });
      },
      getRemoteSet: function(e, n) {
        var r = {};
        V.getDB(e.mountpoint, function(t, a) {
          if (t) return n(t);
          try {
            var l = a.transaction([V.DB_STORE_NAME], "readonly");
            l.onerror = function(d) {
              n(this.error), d.preventDefault();
            };
            var u = l.objectStore(V.DB_STORE_NAME), s = u.index("timestamp");
            s.openKeyCursor().onsuccess = function(d) {
              var f = d.target.result;
              if (!f)
                return n(null, {
                  type: "remote",
                  db: a,
                  entries: r
                });
              r[f.primaryKey] = { timestamp: f.key }, f.continue();
            };
          } catch (d) {
            return n(d);
          }
        });
      },
      loadLocalEntry: function(e, n) {
        var r, t;
        try {
          var a = o.lookupPath(e);
          t = a.node, r = o.stat(e);
        } catch (l) {
          return n(l);
        }
        return o.isDir(r.mode) ? n(null, { timestamp: r.mtime, mode: r.mode }) : o.isFile(r.mode) ? (t.contents = P.getFileDataAsTypedArray(t), n(null, {
          timestamp: r.mtime,
          mode: r.mode,
          contents: t.contents
        })) : n(new Error("node type not supported"));
      },
      storeLocalEntry: function(e, n, r) {
        try {
          if (o.isDir(n.mode))
            o.mkdir(e, n.mode);
          else if (o.isFile(n.mode))
            o.writeFile(e, n.contents, { canOwn: !0 });
          else
            return r(new Error("node type not supported"));
          o.chmod(e, n.mode), o.utime(e, n.timestamp, n.timestamp);
        } catch (t) {
          return r(t);
        }
        r(null);
      },
      removeLocalEntry: function(e, n) {
        try {
          var r = o.lookupPath(e), t = o.stat(e);
          o.isDir(t.mode) ? o.rmdir(e) : o.isFile(t.mode) && o.unlink(e);
        } catch (a) {
          return n(a);
        }
        n(null);
      },
      loadRemoteEntry: function(e, n, r) {
        var t = e.get(n);
        t.onsuccess = function(a) {
          r(null, a.target.result);
        }, t.onerror = function(a) {
          r(this.error), a.preventDefault();
        };
      },
      storeRemoteEntry: function(e, n, r, t) {
        var a = e.put(r, n);
        a.onsuccess = function() {
          t(null);
        }, a.onerror = function(l) {
          t(this.error), l.preventDefault();
        };
      },
      removeRemoteEntry: function(e, n, r) {
        var t = e.delete(n);
        t.onsuccess = function() {
          r(null);
        }, t.onerror = function(a) {
          r(this.error), a.preventDefault();
        };
      },
      reconcile: function(e, n, r) {
        var t = 0, a = [];
        Object.keys(e.entries).forEach(function(p) {
          var _ = e.entries[p], g = n.entries[p];
          (!g || _.timestamp > g.timestamp) && (a.push(p), t++);
        });
        var l = [];
        if (Object.keys(n.entries).forEach(function(p) {
          n.entries[p];
          var _ = e.entries[p];
          _ || (l.push(p), t++);
        }), !t)
          return r(null);
        var u = !1, s = e.type === "remote" ? e.db : n.db, d = s.transaction([V.DB_STORE_NAME], "readwrite"), f = d.objectStore(V.DB_STORE_NAME);
        function m(p) {
          if (p && !u)
            return u = !0, r(p);
        }
        d.onerror = function(p) {
          m(this.error), p.preventDefault();
        }, d.oncomplete = function(p) {
          u || r(null);
        }, a.sort().forEach(function(p) {
          n.type === "local" ? V.loadRemoteEntry(f, p, function(_, g) {
            if (_) return m(_);
            V.storeLocalEntry(p, g, m);
          }) : V.loadLocalEntry(p, function(_, g) {
            if (_) return m(_);
            V.storeRemoteEntry(f, p, g, m);
          });
        }), l.sort().reverse().forEach(function(p) {
          n.type === "local" ? V.removeLocalEntry(p, m) : V.removeRemoteEntry(f, p, m);
        });
      }
    }, ar = {
      EPERM: 63,
      ENOENT: 44,
      ESRCH: 71,
      EINTR: 27,
      EIO: 29,
      ENXIO: 60,
      E2BIG: 1,
      ENOEXEC: 45,
      EBADF: 8,
      ECHILD: 12,
      EAGAIN: 6,
      EWOULDBLOCK: 6,
      ENOMEM: 48,
      EACCES: 2,
      EFAULT: 21,
      ENOTBLK: 105,
      EBUSY: 10,
      EEXIST: 20,
      EXDEV: 75,
      ENODEV: 43,
      ENOTDIR: 54,
      EISDIR: 31,
      EINVAL: 28,
      ENFILE: 41,
      EMFILE: 33,
      ENOTTY: 59,
      ETXTBSY: 74,
      EFBIG: 22,
      ENOSPC: 51,
      ESPIPE: 70,
      EROFS: 69,
      EMLINK: 34,
      EPIPE: 64,
      EDOM: 18,
      ERANGE: 68,
      ENOMSG: 49,
      EIDRM: 24,
      ECHRNG: 106,
      EL2NSYNC: 156,
      EL3HLT: 107,
      EL3RST: 108,
      ELNRNG: 109,
      EUNATCH: 110,
      ENOCSI: 111,
      EL2HLT: 112,
      EDEADLK: 16,
      ENOLCK: 46,
      EBADE: 113,
      EBADR: 114,
      EXFULL: 115,
      ENOANO: 104,
      EBADRQC: 103,
      EBADSLT: 102,
      EDEADLOCK: 16,
      EBFONT: 101,
      ENOSTR: 100,
      ENODATA: 116,
      ETIME: 117,
      ENOSR: 118,
      ENONET: 119,
      ENOPKG: 120,
      EREMOTE: 121,
      ENOLINK: 47,
      EADV: 122,
      ESRMNT: 123,
      ECOMM: 124,
      EPROTO: 65,
      EMULTIHOP: 36,
      EDOTDOT: 125,
      EBADMSG: 9,
      ENOTUNIQ: 126,
      EBADFD: 127,
      EREMCHG: 128,
      ELIBACC: 129,
      ELIBBAD: 130,
      ELIBSCN: 131,
      ELIBMAX: 132,
      ELIBEXEC: 133,
      ENOSYS: 52,
      ENOTEMPTY: 55,
      ENAMETOOLONG: 37,
      ELOOP: 32,
      EOPNOTSUPP: 138,
      EPFNOSUPPORT: 139,
      ECONNRESET: 15,
      ENOBUFS: 42,
      EAFNOSUPPORT: 5,
      EPROTOTYPE: 67,
      ENOTSOCK: 57,
      ENOPROTOOPT: 50,
      ESHUTDOWN: 140,
      ECONNREFUSED: 14,
      EADDRINUSE: 3,
      ECONNABORTED: 13,
      ENETUNREACH: 40,
      ENETDOWN: 38,
      ETIMEDOUT: 73,
      EHOSTDOWN: 142,
      EHOSTUNREACH: 23,
      EINPROGRESS: 26,
      EALREADY: 7,
      EDESTADDRREQ: 17,
      EMSGSIZE: 35,
      EPROTONOSUPPORT: 66,
      ESOCKTNOSUPPORT: 137,
      EADDRNOTAVAIL: 4,
      ENETRESET: 39,
      EISCONN: 30,
      ENOTCONN: 53,
      ETOOMANYREFS: 141,
      EUSERS: 136,
      EDQUOT: 19,
      ESTALE: 72,
      ENOTSUP: 138,
      ENOMEDIUM: 148,
      EILSEQ: 25,
      EOVERFLOW: 61,
      ECANCELED: 11,
      ENOTRECOVERABLE: 56,
      EOWNERDEAD: 62,
      ESTRPIPE: 135
    }, D = {
      isWindows: !1,
      staticInit: function() {
        D.isWindows = !!process.platform.match(/^win/);
        var e = process.binding("constants");
        e.fs && (e = e.fs), D.flagsForNodeMap = {
          1024: e.O_APPEND,
          64: e.O_CREAT,
          128: e.O_EXCL,
          0: e.O_RDONLY,
          2: e.O_RDWR,
          4096: e.O_SYNC,
          512: e.O_TRUNC,
          1: e.O_WRONLY
        };
      },
      bufferFrom: function(e) {
        return Buffer.alloc ? Buffer.from(e) : new Buffer(e);
      },
      convertNodeCode: function(e) {
        var n = e.code;
        return ae(n in ar), ar[n];
      },
      mount: function(e) {
        return ae(j), D.createNode(null, "/", D.getMode(e.opts.root), 0);
      },
      createNode: function(e, n, r, t) {
        if (!o.isDir(r) && !o.isFile(r) && !o.isLink(r))
          throw new o.ErrnoError(28);
        var a = o.createNode(e, n, r);
        return a.node_ops = D.node_ops, a.stream_ops = D.stream_ops, a;
      },
      getMode: function(e) {
        var n;
        try {
          n = K.lstatSync(e), D.isWindows && (n.mode = n.mode | (n.mode & 292) >> 2);
        } catch (r) {
          throw r.code ? new o.ErrnoError(D.convertNodeCode(r)) : r;
        }
        return n.mode;
      },
      realPath: function(e) {
        for (var n = []; e.parent !== e; )
          n.push(e.name), e = e.parent;
        return n.push(e.mount.opts.root), n.reverse(), M.join.apply(null, n);
      },
      flagsForNode: function(e) {
        e &= -2097153, e &= -2049, e &= -32769, e &= -524289;
        var n = 0;
        for (var r in D.flagsForNodeMap)
          e & r && (n |= D.flagsForNodeMap[r], e ^= r);
        if (e)
          throw new o.ErrnoError(28);
        return n;
      },
      node_ops: {
        getattr: function(e) {
          var n = D.realPath(e), r;
          try {
            r = K.lstatSync(n);
          } catch (t) {
            throw t.code ? new o.ErrnoError(D.convertNodeCode(t)) : t;
          }
          return D.isWindows && !r.blksize && (r.blksize = 4096), D.isWindows && !r.blocks && (r.blocks = (r.size + r.blksize - 1) / r.blksize | 0), {
            dev: r.dev,
            ino: r.ino,
            mode: r.mode,
            nlink: r.nlink,
            uid: r.uid,
            gid: r.gid,
            rdev: r.rdev,
            size: r.size,
            atime: r.atime,
            mtime: r.mtime,
            ctime: r.ctime,
            blksize: r.blksize,
            blocks: r.blocks
          };
        },
        setattr: function(e, n) {
          var r = D.realPath(e);
          try {
            if (n.mode !== void 0 && (K.chmodSync(r, n.mode), e.mode = n.mode), n.timestamp !== void 0) {
              var t = new Date(n.timestamp);
              K.utimesSync(r, t, t);
            }
            n.size !== void 0 && K.truncateSync(r, n.size);
          } catch (a) {
            throw a.code ? new o.ErrnoError(D.convertNodeCode(a)) : a;
          }
        },
        lookup: function(e, n) {
          var r = M.join2(D.realPath(e), n), t = D.getMode(r);
          return D.createNode(e, n, t);
        },
        mknod: function(e, n, r, t) {
          var a = D.createNode(e, n, r, t), l = D.realPath(a);
          try {
            o.isDir(a.mode) ? K.mkdirSync(l, a.mode) : K.writeFileSync(l, "", { mode: a.mode });
          } catch (u) {
            throw u.code ? new o.ErrnoError(D.convertNodeCode(u)) : u;
          }
          return a;
        },
        rename: function(e, n, r) {
          var t = D.realPath(e), a = M.join2(D.realPath(n), r);
          try {
            K.renameSync(t, a);
          } catch (l) {
            throw l.code ? new o.ErrnoError(D.convertNodeCode(l)) : l;
          }
        },
        unlink: function(e, n) {
          var r = M.join2(D.realPath(e), n);
          try {
            K.unlinkSync(r);
          } catch (t) {
            throw t.code ? new o.ErrnoError(D.convertNodeCode(t)) : t;
          }
        },
        rmdir: function(e, n) {
          var r = M.join2(D.realPath(e), n);
          try {
            K.rmdirSync(r);
          } catch (t) {
            throw t.code ? new o.ErrnoError(D.convertNodeCode(t)) : t;
          }
        },
        readdir: function(e) {
          var n = D.realPath(e);
          try {
            return K.readdirSync(n);
          } catch (r) {
            throw r.code ? new o.ErrnoError(D.convertNodeCode(r)) : r;
          }
        },
        symlink: function(e, n, r) {
          var t = M.join2(D.realPath(e), n);
          try {
            K.symlinkSync(r, t);
          } catch (a) {
            throw a.code ? new o.ErrnoError(D.convertNodeCode(a)) : a;
          }
        },
        readlink: function(e) {
          var n = D.realPath(e);
          try {
            return n = K.readlinkSync(n), n = Cr.relative(
              Cr.resolve(e.mount.opts.root),
              n
            ), n;
          } catch (r) {
            throw r.code ? new o.ErrnoError(D.convertNodeCode(r)) : r;
          }
        }
      },
      stream_ops: {
        open: function(e) {
          var n = D.realPath(e.node);
          try {
            o.isFile(e.node.mode) && (e.nfd = K.openSync(n, D.flagsForNode(e.flags)));
          } catch (r) {
            throw r.code ? new o.ErrnoError(D.convertNodeCode(r)) : r;
          }
        },
        close: function(e) {
          try {
            o.isFile(e.node.mode) && e.nfd && K.closeSync(e.nfd);
          } catch (n) {
            throw n.code ? new o.ErrnoError(D.convertNodeCode(n)) : n;
          }
        },
        read: function(e, n, r, t, a) {
          if (t === 0) return 0;
          try {
            return K.readSync(
              e.nfd,
              D.bufferFrom(n.buffer),
              r,
              t,
              a
            );
          } catch (l) {
            throw new o.ErrnoError(D.convertNodeCode(l));
          }
        },
        write: function(e, n, r, t, a) {
          try {
            return K.writeSync(
              e.nfd,
              D.bufferFrom(n.buffer),
              r,
              t,
              a
            );
          } catch (l) {
            throw new o.ErrnoError(D.convertNodeCode(l));
          }
        },
        llseek: function(e, n, r) {
          var t = n;
          if (r === 1)
            t += e.position;
          else if (r === 2 && o.isFile(e.node.mode))
            try {
              var a = K.fstatSync(e.nfd);
              t += a.size;
            } catch (l) {
              throw new o.ErrnoError(D.convertNodeCode(l));
            }
          if (t < 0)
            throw new o.ErrnoError(28);
          return t;
        }
      }
    }, X = {
      DIR_MODE: 16895,
      FILE_MODE: 33279,
      reader: null,
      mount: function(e) {
        ae(S), X.reader || (X.reader = new FileReaderSync());
        var n = X.createNode(null, "/", X.DIR_MODE, 0), r = {};
        function t(l) {
          for (var u = l.split("/"), s = n, d = 0; d < u.length - 1; d++) {
            var f = u.slice(0, d + 1).join("/");
            r[f] || (r[f] = X.createNode(
              s,
              u[d],
              X.DIR_MODE,
              0
            )), s = r[f];
          }
          return s;
        }
        function a(l) {
          var u = l.split("/");
          return u[u.length - 1];
        }
        return Array.prototype.forEach.call(
          e.opts.files || [],
          function(l) {
            X.createNode(
              t(l.name),
              a(l.name),
              X.FILE_MODE,
              0,
              l,
              l.lastModifiedDate
            );
          }
        ), (e.opts.blobs || []).forEach(function(l) {
          X.createNode(
            t(l.name),
            a(l.name),
            X.FILE_MODE,
            0,
            l.data
          );
        }), (e.opts.packages || []).forEach(function(l) {
          l.metadata.files.forEach(function(u) {
            var s = u.filename.substr(1);
            X.createNode(
              t(s),
              a(s),
              X.FILE_MODE,
              0,
              l.blob.slice(u.start, u.end)
            );
          });
        }), n;
      },
      createNode: function(e, n, r, t, a, l) {
        var u = o.createNode(e, n, r);
        return u.mode = r, u.node_ops = X.node_ops, u.stream_ops = X.stream_ops, u.timestamp = (l || /* @__PURE__ */ new Date()).getTime(), ae(X.FILE_MODE !== X.DIR_MODE), r === X.FILE_MODE ? (u.size = a.size, u.contents = a) : (u.size = 4096, u.contents = {}), e && (e.contents[n] = u), u;
      },
      node_ops: {
        getattr: function(e) {
          return {
            dev: 1,
            ino: void 0,
            mode: e.mode,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: void 0,
            size: e.size,
            atime: new Date(e.timestamp),
            mtime: new Date(e.timestamp),
            ctime: new Date(e.timestamp),
            blksize: 4096,
            blocks: Math.ceil(e.size / 4096)
          };
        },
        setattr: function(e, n) {
          n.mode !== void 0 && (e.mode = n.mode), n.timestamp !== void 0 && (e.timestamp = n.timestamp);
        },
        lookup: function(e, n) {
          throw new o.ErrnoError(44);
        },
        mknod: function(e, n, r, t) {
          throw new o.ErrnoError(63);
        },
        rename: function(e, n, r) {
          throw new o.ErrnoError(63);
        },
        unlink: function(e, n) {
          throw new o.ErrnoError(63);
        },
        rmdir: function(e, n) {
          throw new o.ErrnoError(63);
        },
        readdir: function(e) {
          var n = [".", ".."];
          for (var r in e.contents)
            e.contents.hasOwnProperty(r) && n.push(r);
          return n;
        },
        symlink: function(e, n, r) {
          throw new o.ErrnoError(63);
        },
        readlink: function(e) {
          throw new o.ErrnoError(63);
        }
      },
      stream_ops: {
        read: function(e, n, r, t, a) {
          if (a >= e.node.size) return 0;
          var l = e.node.contents.slice(a, a + t), u = X.reader.readAsArrayBuffer(l);
          return n.set(new Uint8Array(u), r), l.size;
        },
        write: function(e, n, r, t, a) {
          throw new o.ErrnoError(29);
        },
        llseek: function(e, n, r) {
          var t = n;
          if (r === 1 ? t += e.position : r === 2 && o.isFile(e.node.mode) && (t += e.node.size), t < 0)
            throw new o.ErrnoError(28);
          return t;
        }
      }
    }, o = {
      root: null,
      mounts: [],
      devices: {},
      streams: [],
      nextInode: 1,
      nameTable: null,
      currentPath: "/",
      initialized: !1,
      ignorePermissions: !0,
      trackingDelegate: {},
      tracking: { openFlags: { READ: 1, WRITE: 2 } },
      ErrnoError: null,
      genericErrors: {},
      filesystems: null,
      syncFSRequests: 0,
      handleFSError: function(e) {
        if (!(e instanceof o.ErrnoError)) throw e + " : " + Yr();
        return Ee(e.errno);
      },
      lookupPath: function(e, n) {
        if (e = fe.resolve(o.cwd(), e), n = n || {}, !e) return { path: "", node: null };
        var r = { follow_mount: !0, recurse_count: 0 };
        for (var t in r)
          n[t] === void 0 && (n[t] = r[t]);
        if (n.recurse_count > 8)
          throw new o.ErrnoError(32);
        for (var a = M.normalizeArray(
          e.split("/").filter(function(_) {
            return !!_;
          }),
          !1
        ), l = o.root, u = "/", s = 0; s < a.length; s++) {
          var d = s === a.length - 1;
          if (d && n.parent)
            break;
          if (l = o.lookupNode(l, a[s]), u = M.join2(u, a[s]), o.isMountpoint(l) && (!d || d && n.follow_mount) && (l = l.mounted.root), !d || n.follow)
            for (var f = 0; o.isLink(l.mode); ) {
              var m = o.readlink(u);
              u = fe.resolve(M.dirname(u), m);
              var p = o.lookupPath(u, {
                recurse_count: n.recurse_count
              });
              if (l = p.node, f++ > 40)
                throw new o.ErrnoError(32);
            }
        }
        return { path: u, node: l };
      },
      getPath: function(e) {
        for (var n; ; ) {
          if (o.isRoot(e)) {
            var r = e.mount.mountpoint;
            return n ? r[r.length - 1] !== "/" ? r + "/" + n : r + n : r;
          }
          n = n ? e.name + "/" + n : e.name, e = e.parent;
        }
      },
      hashName: function(e, n) {
        for (var r = 0, t = 0; t < n.length; t++)
          r = (r << 5) - r + n.charCodeAt(t) | 0;
        return (e + r >>> 0) % o.nameTable.length;
      },
      hashAddNode: function(e) {
        var n = o.hashName(e.parent.id, e.name);
        e.name_next = o.nameTable[n], o.nameTable[n] = e;
      },
      hashRemoveNode: function(e) {
        var n = o.hashName(e.parent.id, e.name);
        if (o.nameTable[n] === e)
          o.nameTable[n] = e.name_next;
        else
          for (var r = o.nameTable[n]; r; ) {
            if (r.name_next === e) {
              r.name_next = e.name_next;
              break;
            }
            r = r.name_next;
          }
      },
      lookupNode: function(e, n) {
        var r = o.mayLookup(e);
        if (r)
          throw new o.ErrnoError(r, e);
        for (var t = o.hashName(e.id, n), a = o.nameTable[t]; a; a = a.name_next) {
          var l = a.name;
          if (a.parent.id === e.id && l === n)
            return a;
        }
        return o.lookup(e, n);
      },
      createNode: function(e, n, r, t) {
        if (!o.FSNode) {
          o.FSNode = function(s, d, f, m) {
            s || (s = this), this.parent = s, this.mount = s.mount, this.mounted = null, this.id = o.nextInode++, this.name = d, this.mode = f, this.node_ops = {}, this.stream_ops = {}, this.rdev = m;
          }, o.FSNode.prototype = {};
          var a = 365, l = 146;
          Object.defineProperties(o.FSNode.prototype, {
            read: {
              get: function() {
                return (this.mode & a) === a;
              },
              set: function(s) {
                s ? this.mode |= a : this.mode &= ~a;
              }
            },
            write: {
              get: function() {
                return (this.mode & l) === l;
              },
              set: function(s) {
                s ? this.mode |= l : this.mode &= ~l;
              }
            },
            isFolder: {
              get: function() {
                return o.isDir(this.mode);
              }
            },
            isDevice: {
              get: function() {
                return o.isChrdev(this.mode);
              }
            }
          });
        }
        var u = new o.FSNode(e, n, r, t);
        return o.hashAddNode(u), u;
      },
      destroyNode: function(e) {
        o.hashRemoveNode(e);
      },
      isRoot: function(e) {
        return e === e.parent;
      },
      isMountpoint: function(e) {
        return !!e.mounted;
      },
      isFile: function(e) {
        return (e & 61440) === 32768;
      },
      isDir: function(e) {
        return (e & 61440) === 16384;
      },
      isLink: function(e) {
        return (e & 61440) === 40960;
      },
      isChrdev: function(e) {
        return (e & 61440) === 8192;
      },
      isBlkdev: function(e) {
        return (e & 61440) === 24576;
      },
      isFIFO: function(e) {
        return (e & 61440) === 4096;
      },
      isSocket: function(e) {
        return (e & 49152) === 49152;
      },
      flagModes: {
        r: 0,
        rs: 1052672,
        "r+": 2,
        w: 577,
        wx: 705,
        xw: 705,
        "w+": 578,
        "wx+": 706,
        "xw+": 706,
        a: 1089,
        ax: 1217,
        xa: 1217,
        "a+": 1090,
        "ax+": 1218,
        "xa+": 1218
      },
      modeStringToFlags: function(e) {
        var n = o.flagModes[e];
        if (typeof n > "u")
          throw new Error("Unknown file open mode: " + e);
        return n;
      },
      flagsToPermissionString: function(e) {
        var n = ["r", "w", "rw"][e & 3];
        return e & 512 && (n += "w"), n;
      },
      nodePermissions: function(e, n) {
        return o.ignorePermissions ? 0 : n.indexOf("r") !== -1 && !(e.mode & 292) || n.indexOf("w") !== -1 && !(e.mode & 146) || n.indexOf("x") !== -1 && !(e.mode & 73) ? 2 : 0;
      },
      mayLookup: function(e) {
        var n = o.nodePermissions(e, "x");
        return n || (e.node_ops.lookup ? 0 : 2);
      },
      mayCreate: function(e, n) {
        try {
          var r = o.lookupNode(e, n);
          return 20;
        } catch {
        }
        return o.nodePermissions(e, "wx");
      },
      mayDelete: function(e, n, r) {
        var t;
        try {
          t = o.lookupNode(e, n);
        } catch (l) {
          return l.errno;
        }
        var a = o.nodePermissions(e, "wx");
        if (a)
          return a;
        if (r) {
          if (!o.isDir(t.mode))
            return 54;
          if (o.isRoot(t) || o.getPath(t) === o.cwd())
            return 10;
        } else if (o.isDir(t.mode))
          return 31;
        return 0;
      },
      mayOpen: function(e, n) {
        return e ? o.isLink(e.mode) ? 32 : o.isDir(e.mode) && (o.flagsToPermissionString(n) !== "r" || n & 512) ? 31 : o.nodePermissions(e, o.flagsToPermissionString(n)) : 44;
      },
      MAX_OPEN_FDS: 4096,
      nextfd: function(e, n) {
        e = e || 0, n = n || o.MAX_OPEN_FDS;
        for (var r = e; r <= n; r++)
          if (!o.streams[r])
            return r;
        throw new o.ErrnoError(33);
      },
      getStream: function(e) {
        return o.streams[e];
      },
      createStream: function(e, n, r) {
        o.FSStream || (o.FSStream = function() {
        }, o.FSStream.prototype = {}, Object.defineProperties(o.FSStream.prototype, {
          object: {
            get: function() {
              return this.node;
            },
            set: function(u) {
              this.node = u;
            }
          },
          isRead: {
            get: function() {
              return (this.flags & 2097155) !== 1;
            }
          },
          isWrite: {
            get: function() {
              return (this.flags & 2097155) !== 0;
            }
          },
          isAppend: {
            get: function() {
              return this.flags & 1024;
            }
          }
        }));
        var t = new o.FSStream();
        for (var a in e)
          t[a] = e[a];
        e = t;
        var l = o.nextfd(n, r);
        return e.fd = l, o.streams[l] = e, e;
      },
      closeStream: function(e) {
        o.streams[e] = null;
      },
      chrdev_stream_ops: {
        open: function(e) {
          var n = o.getDevice(e.node.rdev);
          e.stream_ops = n.stream_ops, e.stream_ops.open && e.stream_ops.open(e);
        },
        llseek: function() {
          throw new o.ErrnoError(70);
        }
      },
      major: function(e) {
        return e >> 8;
      },
      minor: function(e) {
        return e & 255;
      },
      makedev: function(e, n) {
        return e << 8 | n;
      },
      registerDevice: function(e, n) {
        o.devices[e] = { stream_ops: n };
      },
      getDevice: function(e) {
        return o.devices[e];
      },
      getMounts: function(e) {
        for (var n = [], r = [e]; r.length; ) {
          var t = r.pop();
          n.push(t), r.push.apply(r, t.mounts);
        }
        return n;
      },
      syncfs: function(e, n) {
        typeof e == "function" && (n = e, e = !1), o.syncFSRequests++, o.syncFSRequests > 1 && console.log(
          "warning: " + o.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work"
        );
        var r = o.getMounts(o.root.mount), t = 0;
        function a(u) {
          return o.syncFSRequests--, n(u);
        }
        function l(u) {
          if (u)
            return l.errored ? void 0 : (l.errored = !0, a(u));
          ++t >= r.length && a(null);
        }
        r.forEach(function(u) {
          if (!u.type.syncfs)
            return l(null);
          u.type.syncfs(u, e, l);
        });
      },
      mount: function(e, n, r) {
        var t = r === "/", a = !r, l;
        if (t && o.root)
          throw new o.ErrnoError(10);
        if (!t && !a) {
          var u = o.lookupPath(r, { follow_mount: !1 });
          if (r = u.path, l = u.node, o.isMountpoint(l))
            throw new o.ErrnoError(10);
          if (!o.isDir(l.mode))
            throw new o.ErrnoError(54);
        }
        var s = {
          type: e,
          opts: n,
          mountpoint: r,
          mounts: []
        }, d = e.mount(s);
        return d.mount = s, s.root = d, t ? o.root = d : l && (l.mounted = s, l.mount && l.mount.mounts.push(s)), d;
      },
      unmount: function(e) {
        var n = o.lookupPath(e, { follow_mount: !1 });
        if (!o.isMountpoint(n.node))
          throw new o.ErrnoError(28);
        var r = n.node, t = r.mounted, a = o.getMounts(t);
        Object.keys(o.nameTable).forEach(function(u) {
          for (var s = o.nameTable[u]; s; ) {
            var d = s.name_next;
            a.indexOf(s.mount) !== -1 && o.destroyNode(s), s = d;
          }
        }), r.mounted = null;
        var l = r.mount.mounts.indexOf(t);
        r.mount.mounts.splice(l, 1);
      },
      lookup: function(e, n) {
        return e.node_ops.lookup(e, n);
      },
      mknod: function(e, n, r) {
        var t = o.lookupPath(e, { parent: !0 }), a = t.node, l = M.basename(e);
        if (!l || l === "." || l === "..")
          throw new o.ErrnoError(28);
        var u = o.mayCreate(a, l);
        if (u)
          throw new o.ErrnoError(u);
        if (!a.node_ops.mknod)
          throw new o.ErrnoError(63);
        return a.node_ops.mknod(a, l, n, r);
      },
      create: function(e, n) {
        return n = n !== void 0 ? n : 438, n &= 4095, n |= 32768, o.mknod(e, n, 0);
      },
      mkdir: function(e, n) {
        return n = n !== void 0 ? n : 511, n &= 1023, n |= 16384, o.mknod(e, n, 0);
      },
      mkdirTree: function(e, n) {
        for (var r = e.split("/"), t = "", a = 0; a < r.length; ++a)
          if (r[a]) {
            t += "/" + r[a];
            try {
              o.mkdir(t, n);
            } catch (l) {
              if (l.errno != 20) throw l;
            }
          }
      },
      mkdev: function(e, n, r) {
        return typeof r > "u" && (r = n, n = 438), n |= 8192, o.mknod(e, n, r);
      },
      symlink: function(e, n) {
        if (!fe.resolve(e))
          throw new o.ErrnoError(44);
        var r = o.lookupPath(n, { parent: !0 }), t = r.node;
        if (!t)
          throw new o.ErrnoError(44);
        var a = M.basename(n), l = o.mayCreate(t, a);
        if (l)
          throw new o.ErrnoError(l);
        if (!t.node_ops.symlink)
          throw new o.ErrnoError(63);
        return t.node_ops.symlink(t, a, e);
      },
      rename: function(e, n) {
        var r = M.dirname(e), t = M.dirname(n), a = M.basename(e), l = M.basename(n), u, s, d;
        try {
          u = o.lookupPath(e, { parent: !0 }), s = u.node, u = o.lookupPath(n, { parent: !0 }), d = u.node;
        } catch {
          throw new o.ErrnoError(10);
        }
        if (!s || !d) throw new o.ErrnoError(44);
        if (s.mount !== d.mount)
          throw new o.ErrnoError(75);
        var f = o.lookupNode(s, a), m = fe.relative(e, t);
        if (m.charAt(0) !== ".")
          throw new o.ErrnoError(28);
        if (m = fe.relative(n, r), m.charAt(0) !== ".")
          throw new o.ErrnoError(55);
        var p;
        try {
          p = o.lookupNode(d, l);
        } catch {
        }
        if (f !== p) {
          var _ = o.isDir(f.mode), g = o.mayDelete(s, a, _);
          if (g)
            throw new o.ErrnoError(g);
          if (g = p ? o.mayDelete(d, l, _) : o.mayCreate(d, l), g)
            throw new o.ErrnoError(g);
          if (!s.node_ops.rename)
            throw new o.ErrnoError(63);
          if (o.isMountpoint(f) || p && o.isMountpoint(p))
            throw new o.ErrnoError(10);
          if (d !== s && (g = o.nodePermissions(s, "w"), g))
            throw new o.ErrnoError(g);
          try {
            o.trackingDelegate.willMovePath && o.trackingDelegate.willMovePath(e, n);
          } catch (w) {
            console.log(
              "FS.trackingDelegate['willMovePath']('" + e + "', '" + n + "') threw an exception: " + w.message
            );
          }
          o.hashRemoveNode(f);
          try {
            s.node_ops.rename(f, d, l);
          } catch (w) {
            throw w;
          } finally {
            o.hashAddNode(f);
          }
          try {
            o.trackingDelegate.onMovePath && o.trackingDelegate.onMovePath(e, n);
          } catch (w) {
            console.log(
              "FS.trackingDelegate['onMovePath']('" + e + "', '" + n + "') threw an exception: " + w.message
            );
          }
        }
      },
      rmdir: function(e) {
        var n = o.lookupPath(e, { parent: !0 }), r = n.node, t = M.basename(e), a = o.lookupNode(r, t), l = o.mayDelete(r, t, !0);
        if (l)
          throw new o.ErrnoError(l);
        if (!r.node_ops.rmdir)
          throw new o.ErrnoError(63);
        if (o.isMountpoint(a))
          throw new o.ErrnoError(10);
        try {
          o.trackingDelegate.willDeletePath && o.trackingDelegate.willDeletePath(e);
        } catch (u) {
          console.log(
            "FS.trackingDelegate['willDeletePath']('" + e + "') threw an exception: " + u.message
          );
        }
        r.node_ops.rmdir(r, t), o.destroyNode(a);
        try {
          o.trackingDelegate.onDeletePath && o.trackingDelegate.onDeletePath(e);
        } catch (u) {
          console.log(
            "FS.trackingDelegate['onDeletePath']('" + e + "') threw an exception: " + u.message
          );
        }
      },
      readdir: function(e) {
        var n = o.lookupPath(e, { follow: !0 }), r = n.node;
        if (!r.node_ops.readdir)
          throw new o.ErrnoError(54);
        return r.node_ops.readdir(r);
      },
      unlink: function(e) {
        var n = o.lookupPath(e, { parent: !0 }), r = n.node, t = M.basename(e), a = o.lookupNode(r, t), l = o.mayDelete(r, t, !1);
        if (l)
          throw new o.ErrnoError(l);
        if (!r.node_ops.unlink)
          throw new o.ErrnoError(63);
        if (o.isMountpoint(a))
          throw new o.ErrnoError(10);
        try {
          o.trackingDelegate.willDeletePath && o.trackingDelegate.willDeletePath(e);
        } catch (u) {
          console.log(
            "FS.trackingDelegate['willDeletePath']('" + e + "') threw an exception: " + u.message
          );
        }
        r.node_ops.unlink(r, t), o.destroyNode(a);
        try {
          o.trackingDelegate.onDeletePath && o.trackingDelegate.onDeletePath(e);
        } catch (u) {
          console.log(
            "FS.trackingDelegate['onDeletePath']('" + e + "') threw an exception: " + u.message
          );
        }
      },
      readlink: function(e) {
        var n = o.lookupPath(e), r = n.node;
        if (!r)
          throw new o.ErrnoError(44);
        if (!r.node_ops.readlink)
          throw new o.ErrnoError(28);
        return fe.resolve(
          o.getPath(r.parent),
          r.node_ops.readlink(r)
        );
      },
      stat: function(e, n) {
        var r = o.lookupPath(e, { follow: !n }), t = r.node;
        if (!t)
          throw new o.ErrnoError(44);
        if (!t.node_ops.getattr)
          throw new o.ErrnoError(63);
        return t.node_ops.getattr(t);
      },
      lstat: function(e) {
        return o.stat(e, !0);
      },
      chmod: function(e, n, r) {
        var t;
        if (typeof e == "string") {
          var a = o.lookupPath(e, { follow: !r });
          t = a.node;
        } else
          t = e;
        if (!t.node_ops.setattr)
          throw new o.ErrnoError(63);
        t.node_ops.setattr(t, {
          mode: n & 4095 | t.mode & -4096,
          timestamp: Date.now()
        });
      },
      lchmod: function(e, n) {
        o.chmod(e, n, !0);
      },
      fchmod: function(e, n) {
        var r = o.getStream(e);
        if (!r)
          throw new o.ErrnoError(8);
        o.chmod(r.node, n);
      },
      chown: function(e, n, r, t) {
        var a;
        if (typeof e == "string") {
          var l = o.lookupPath(e, { follow: !t });
          a = l.node;
        } else
          a = e;
        if (!a.node_ops.setattr)
          throw new o.ErrnoError(63);
        a.node_ops.setattr(a, { timestamp: Date.now() });
      },
      lchown: function(e, n, r) {
        o.chown(e, n, r, !0);
      },
      fchown: function(e, n, r) {
        var t = o.getStream(e);
        if (!t)
          throw new o.ErrnoError(8);
        o.chown(t.node, n, r);
      },
      truncate: function(e, n) {
        if (n < 0)
          throw new o.ErrnoError(28);
        var r;
        if (typeof e == "string") {
          var t = o.lookupPath(e, { follow: !0 });
          r = t.node;
        } else
          r = e;
        if (!r.node_ops.setattr)
          throw new o.ErrnoError(63);
        if (o.isDir(r.mode))
          throw new o.ErrnoError(31);
        if (!o.isFile(r.mode))
          throw new o.ErrnoError(28);
        var a = o.nodePermissions(r, "w");
        if (a)
          throw new o.ErrnoError(a);
        r.node_ops.setattr(r, { size: n, timestamp: Date.now() });
      },
      ftruncate: function(e, n) {
        var r = o.getStream(e);
        if (!r)
          throw new o.ErrnoError(8);
        if (!(r.flags & 2097155))
          throw new o.ErrnoError(28);
        o.truncate(r.node, n);
      },
      utime: function(e, n, r) {
        var t = o.lookupPath(e, { follow: !0 }), a = t.node;
        a.node_ops.setattr(a, { timestamp: Math.max(n, r) });
      },
      open: function(e, n, r, t, a) {
        if (e === "")
          throw new o.ErrnoError(44);
        n = typeof n == "string" ? o.modeStringToFlags(n) : n, r = typeof r > "u" ? 438 : r, n & 64 ? r = r & 4095 | 32768 : r = 0;
        var l;
        if (typeof e == "object")
          l = e;
        else {
          e = M.normalize(e);
          try {
            var u = o.lookupPath(e, { follow: !(n & 131072) });
            l = u.node;
          } catch {
          }
        }
        var s = !1;
        if (n & 64)
          if (l) {
            if (n & 128)
              throw new o.ErrnoError(20);
          } else
            l = o.mknod(e, r, 0), s = !0;
        if (!l)
          throw new o.ErrnoError(44);
        if (o.isChrdev(l.mode) && (n &= -513), n & 65536 && !o.isDir(l.mode))
          throw new o.ErrnoError(54);
        if (!s) {
          var d = o.mayOpen(l, n);
          if (d)
            throw new o.ErrnoError(d);
        }
        n & 512 && o.truncate(l, 0), n &= -641;
        var f = o.createStream(
          {
            node: l,
            path: o.getPath(l),
            flags: n,
            seekable: !0,
            position: 0,
            stream_ops: l.stream_ops,
            ungotten: [],
            error: !1
          },
          t,
          a
        );
        f.stream_ops.open && f.stream_ops.open(f), i.logReadFiles && !(n & 1) && (o.readFiles || (o.readFiles = {}), e in o.readFiles || (o.readFiles[e] = 1, console.log("FS.trackingDelegate error on read file: " + e)));
        try {
          if (o.trackingDelegate.onOpenFile) {
            var m = 0;
            (n & 2097155) !== 1 && (m |= o.tracking.openFlags.READ), n & 2097155 && (m |= o.tracking.openFlags.WRITE), o.trackingDelegate.onOpenFile(e, m);
          }
        } catch (p) {
          console.log(
            "FS.trackingDelegate['onOpenFile']('" + e + "', flags) threw an exception: " + p.message
          );
        }
        return f;
      },
      close: function(e) {
        if (o.isClosed(e))
          throw new o.ErrnoError(8);
        e.getdents && (e.getdents = null);
        try {
          e.stream_ops.close && e.stream_ops.close(e);
        } catch (n) {
          throw n;
        } finally {
          o.closeStream(e.fd);
        }
        e.fd = null;
      },
      isClosed: function(e) {
        return e.fd === null;
      },
      llseek: function(e, n, r) {
        if (o.isClosed(e))
          throw new o.ErrnoError(8);
        if (!e.seekable || !e.stream_ops.llseek)
          throw new o.ErrnoError(70);
        if (r != 0 && r != 1 && r != 2)
          throw new o.ErrnoError(28);
        return e.position = e.stream_ops.llseek(e, n, r), e.ungotten = [], e.position;
      },
      read: function(e, n, r, t, a) {
        if (t < 0 || a < 0)
          throw new o.ErrnoError(28);
        if (o.isClosed(e))
          throw new o.ErrnoError(8);
        if ((e.flags & 2097155) === 1)
          throw new o.ErrnoError(8);
        if (o.isDir(e.node.mode))
          throw new o.ErrnoError(31);
        if (!e.stream_ops.read)
          throw new o.ErrnoError(28);
        var l = typeof a < "u";
        if (!l)
          a = e.position;
        else if (!e.seekable)
          throw new o.ErrnoError(70);
        var u = e.stream_ops.read(
          e,
          n,
          r,
          t,
          a
        );
        return l || (e.position += u), u;
      },
      write: function(e, n, r, t, a, l) {
        if (t < 0 || a < 0)
          throw new o.ErrnoError(28);
        if (o.isClosed(e))
          throw new o.ErrnoError(8);
        if (!(e.flags & 2097155))
          throw new o.ErrnoError(8);
        if (o.isDir(e.node.mode))
          throw new o.ErrnoError(31);
        if (!e.stream_ops.write)
          throw new o.ErrnoError(28);
        e.flags & 1024 && o.llseek(e, 0, 2);
        var u = typeof a < "u";
        if (!u)
          a = e.position;
        else if (!e.seekable)
          throw new o.ErrnoError(70);
        var s = e.stream_ops.write(
          e,
          n,
          r,
          t,
          a,
          l
        );
        u || (e.position += s);
        try {
          e.path && o.trackingDelegate.onWriteToFile && o.trackingDelegate.onWriteToFile(e.path);
        } catch (d) {
          console.log(
            "FS.trackingDelegate['onWriteToFile']('" + e.path + "') threw an exception: " + d.message
          );
        }
        return s;
      },
      allocate: function(e, n, r) {
        if (o.isClosed(e))
          throw new o.ErrnoError(8);
        if (n < 0 || r <= 0)
          throw new o.ErrnoError(28);
        if (!(e.flags & 2097155))
          throw new o.ErrnoError(8);
        if (!o.isFile(e.node.mode) && !o.isDir(e.node.mode))
          throw new o.ErrnoError(43);
        if (!e.stream_ops.allocate)
          throw new o.ErrnoError(138);
        e.stream_ops.allocate(e, n, r);
      },
      mmap: function(e, n, r, t, a, l, u) {
        if (l & 2 && !(u & 2) && (e.flags & 2097155) !== 2)
          throw new o.ErrnoError(2);
        if ((e.flags & 2097155) === 1)
          throw new o.ErrnoError(2);
        if (!e.stream_ops.mmap)
          throw new o.ErrnoError(43);
        return e.stream_ops.mmap(
          e,
          n,
          r,
          t,
          a,
          l,
          u
        );
      },
      msync: function(e, n, r, t, a) {
        return !e || !e.stream_ops.msync ? 0 : e.stream_ops.msync(
          e,
          n,
          r,
          t,
          a
        );
      },
      munmap: function(e) {
        return 0;
      },
      ioctl: function(e, n, r) {
        if (!e.stream_ops.ioctl)
          throw new o.ErrnoError(59);
        return e.stream_ops.ioctl(e, n, r);
      },
      readFile: function(e, n) {
        if (n = n || {}, n.flags = n.flags || "r", n.encoding = n.encoding || "binary", n.encoding !== "utf8" && n.encoding !== "binary")
          throw new Error('Invalid encoding type "' + n.encoding + '"');
        var r, t = o.open(e, n.flags), a = o.stat(e), l = a.size, u = new Uint8Array(l);
        return o.read(t, u, 0, l, 0), n.encoding === "utf8" ? r = Re(u, 0) : n.encoding === "binary" && (r = u), o.close(t), r;
      },
      writeFile: function(e, n, r) {
        r = r || {}, r.flags = r.flags || "w";
        var t = o.open(e, r.flags, r.mode);
        if (typeof n == "string") {
          var a = new Uint8Array(Ve(n) + 1), l = En(n, a, 0, a.length);
          o.write(t, a, 0, l, void 0, r.canOwn);
        } else if (ArrayBuffer.isView(n))
          o.write(t, n, 0, n.byteLength, void 0, r.canOwn);
        else
          throw new Error("Unsupported data type");
        o.close(t);
      },
      cwd: function() {
        return o.currentPath;
      },
      chdir: function(e) {
        var n = o.lookupPath(e, { follow: !0 });
        if (n.node === null)
          throw new o.ErrnoError(44);
        if (!o.isDir(n.node.mode))
          throw new o.ErrnoError(54);
        var r = o.nodePermissions(n.node, "x");
        if (r)
          throw new o.ErrnoError(r);
        o.currentPath = n.path;
      },
      createDefaultDirectories: function() {
        o.mkdir("/tmp"), o.mkdir("/home"), o.mkdir("/home/web_user");
      },
      createDefaultDevices: function() {
        o.mkdir("/dev"), o.registerDevice(o.makedev(1, 3), {
          read: function() {
            return 0;
          },
          write: function(t, a, l, u, s) {
            return u;
          }
        }), o.mkdev("/dev/null", o.makedev(1, 3)), be.register(o.makedev(5, 0), be.default_tty_ops), be.register(o.makedev(6, 0), be.default_tty1_ops), o.mkdev("/dev/tty", o.makedev(5, 0)), o.mkdev("/dev/tty1", o.makedev(6, 0));
        var e;
        if (typeof crypto == "object" && typeof crypto.getRandomValues == "function") {
          var n = new Uint8Array(1);
          e = function() {
            return crypto.getRandomValues(n), n[0];
          };
        } else if (N)
          try {
            var r = require("crypto");
            e = function() {
              return r.randomBytes(1)[0];
            };
          } catch {
          }
        e || (e = function() {
          G("random_device");
        }), o.createDevice("/dev", "random", e), o.createDevice("/dev", "urandom", e), o.mkdir("/dev/shm"), o.mkdir("/dev/shm/tmp");
      },
      createSpecialDirectories: function() {
        o.mkdir("/proc"), o.mkdir("/proc/self"), o.mkdir("/proc/self/fd"), o.mount(
          {
            mount: function() {
              var e = o.createNode("/proc/self", "fd", 16895, 73);
              return e.node_ops = {
                lookup: function(n, r) {
                  var t = +r, a = o.getStream(t);
                  if (!a) throw new o.ErrnoError(8);
                  var l = {
                    parent: null,
                    mount: { mountpoint: "fake" },
                    node_ops: {
                      readlink: function() {
                        return a.path;
                      }
                    }
                  };
                  return l.parent = l, l;
                }
              }, e;
            }
          },
          {},
          "/proc/self/fd"
        );
      },
      createStandardStreams: function() {
        i.stdin ? o.createDevice("/dev", "stdin", i.stdin) : o.symlink("/dev/tty", "/dev/stdin"), i.stdout ? o.createDevice("/dev", "stdout", null, i.stdout) : o.symlink("/dev/tty", "/dev/stdout"), i.stderr ? o.createDevice("/dev", "stderr", null, i.stderr) : o.symlink("/dev/tty1", "/dev/stderr"), o.open("/dev/stdin", "r"), o.open("/dev/stdout", "w"), o.open("/dev/stderr", "w");
      },
      ensureErrnoError: function() {
        o.ErrnoError || (o.ErrnoError = function(n, r) {
          this.node = r, this.setErrno = function(t) {
            this.errno = t;
          }, this.setErrno(n), this.message = "FS error";
        }, o.ErrnoError.prototype = new Error(), o.ErrnoError.prototype.constructor = o.ErrnoError, [44].forEach(function(e) {
          o.genericErrors[e] = new o.ErrnoError(e), o.genericErrors[e].stack = "<generic error, no stack>";
        }));
      },
      staticInit: function() {
        o.ensureErrnoError(), o.nameTable = new Array(4096), o.mount(P, {}, "/"), o.createDefaultDirectories(), o.createDefaultDevices(), o.createSpecialDirectories(), o.filesystems = {
          MEMFS: P,
          IDBFS: V,
          NODEFS: D,
          WORKERFS: X
        };
      },
      init: function(e, n, r) {
        o.init.initialized = !0, o.ensureErrnoError(), i.stdin = e || i.stdin, i.stdout = n || i.stdout, i.stderr = r || i.stderr, o.createStandardStreams();
      },
      quit: function() {
        o.init.initialized = !1;
        var e = i._fflush;
        e && e(0);
        for (var n = 0; n < o.streams.length; n++) {
          var r = o.streams[n];
          r && o.close(r);
        }
      },
      getMode: function(e, n) {
        var r = 0;
        return e && (r |= 365), n && (r |= 146), r;
      },
      joinPath: function(e, n) {
        var r = M.join.apply(null, e);
        return n && r[0] == "/" && (r = r.substr(1)), r;
      },
      absolutePath: function(e, n) {
        return fe.resolve(n, e);
      },
      standardizePath: function(e) {
        return M.normalize(e);
      },
      findObject: function(e, n) {
        var r = o.analyzePath(e, n);
        return r.exists ? r.object : (Ee(r.error), null);
      },
      analyzePath: function(e, n) {
        try {
          var r = o.lookupPath(e, { follow: !n });
          e = r.path;
        } catch {
        }
        var t = {
          isRoot: !1,
          exists: !1,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: !1,
          parentPath: null,
          parentObject: null
        };
        try {
          var r = o.lookupPath(e, { parent: !0 });
          t.parentExists = !0, t.parentPath = r.path, t.parentObject = r.node, t.name = M.basename(e), r = o.lookupPath(e, { follow: !n }), t.exists = !0, t.path = r.path, t.object = r.node, t.name = r.node.name, t.isRoot = r.path === "/";
        } catch (a) {
          t.error = a.errno;
        }
        return t;
      },
      createFolder: function(e, n, r, t) {
        var a = M.join2(
          typeof e == "string" ? e : o.getPath(e),
          n
        ), l = o.getMode(r, t);
        return o.mkdir(a, l);
      },
      createPath: function(e, n, r, t) {
        e = typeof e == "string" ? e : o.getPath(e);
        for (var a = n.split("/").reverse(); a.length; ) {
          var l = a.pop();
          if (l) {
            var u = M.join2(e, l);
            try {
              o.mkdir(u);
            } catch {
            }
            e = u;
          }
        }
        return u;
      },
      createFile: function(e, n, r, t, a) {
        var l = M.join2(
          typeof e == "string" ? e : o.getPath(e),
          n
        ), u = o.getMode(t, a);
        return o.create(l, u);
      },
      createDataFile: function(e, n, r, t, a, l) {
        var u = n ? M.join2(
          typeof e == "string" ? e : o.getPath(e),
          n
        ) : e, s = o.getMode(t, a), d = o.create(u, s);
        if (r) {
          if (typeof r == "string") {
            for (var f = new Array(r.length), m = 0, p = r.length; m < p; ++m)
              f[m] = r.charCodeAt(m);
            r = f;
          }
          o.chmod(d, s | 146);
          var _ = o.open(d, "w");
          o.write(_, r, 0, r.length, 0, l), o.close(_), o.chmod(d, s);
        }
        return d;
      },
      createDevice: function(e, n, r, t) {
        var a = M.join2(
          typeof e == "string" ? e : o.getPath(e),
          n
        ), l = o.getMode(!!r, !!t);
        o.createDevice.major || (o.createDevice.major = 64);
        var u = o.makedev(o.createDevice.major++, 0);
        return o.registerDevice(u, {
          open: function(s) {
            s.seekable = !1;
          },
          close: function(s) {
            t && t.buffer && t.buffer.length && t(10);
          },
          read: function(s, d, f, m, p) {
            for (var _ = 0, g = 0; g < m; g++) {
              var w;
              try {
                w = r();
              } catch {
                throw new o.ErrnoError(29);
              }
              if (w === void 0 && _ === 0)
                throw new o.ErrnoError(6);
              if (w == null) break;
              _++, d[f + g] = w;
            }
            return _ && (s.node.timestamp = Date.now()), _;
          },
          write: function(s, d, f, m, p) {
            for (var _ = 0; _ < m; _++)
              try {
                t(d[f + _]);
              } catch {
                throw new o.ErrnoError(29);
              }
            return m && (s.node.timestamp = Date.now()), _;
          }
        }), o.mkdev(a, l, u);
      },
      createLink: function(e, n, r, t, a) {
        var l = M.join2(
          typeof e == "string" ? e : o.getPath(e),
          n
        );
        return o.symlink(r, l);
      },
      forceLoadFile: function(e) {
        if (e.isDevice || e.isFolder || e.link || e.contents)
          return !0;
        var n = !0;
        if (typeof XMLHttpRequest < "u")
          throw new Error(
            "Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread."
          );
        if (H)
          try {
            e.contents = vn(H(e.url), !0), e.usedBytes = e.contents.length;
          } catch {
            n = !1;
          }
        else
          throw new Error("Cannot load without read() or XMLHttpRequest.");
        return n || Ee(29), n;
      },
      createLazyFile: function(e, n, r, t, a) {
        function l() {
          this.lengthKnown = !1, this.chunks = [];
        }
        if (l.prototype.get = function(_) {
          if (!(_ > this.length - 1 || _ < 0)) {
            var g = _ % this.chunkSize, w = _ / this.chunkSize | 0;
            return this.getter(w)[g];
          }
        }, l.prototype.setDataGetter = function(_) {
          this.getter = _;
        }, l.prototype.cacheLength = function() {
          var _ = new XMLHttpRequest();
          if (_.open("HEAD", r, !1), _.send(null), !(_.status >= 200 && _.status < 300 || _.status === 304))
            throw new Error(
              "Couldn't load " + r + ". Status: " + _.status
            );
          var g = Number(_.getResponseHeader("Content-length")), w, L = (w = _.getResponseHeader("Accept-Ranges")) && w === "bytes", W = (w = _.getResponseHeader("Content-Encoding")) && w === "gzip", z = 1024 * 1024;
          L || (z = g);
          var v = function(U, F) {
            if (U > F)
              throw new Error(
                "invalid range (" + U + ", " + F + ") or no bytes requested!"
              );
            if (F > g - 1)
              throw new Error(
                "only " + g + " bytes available! programmer error!"
              );
            var I = new XMLHttpRequest();
            if (I.open("GET", r, !1), g !== z && I.setRequestHeader("Range", "bytes=" + U + "-" + F), typeof Uint8Array < "u" && (I.responseType = "arraybuffer"), I.overrideMimeType && I.overrideMimeType("text/plain; charset=x-user-defined"), I.send(null), !(I.status >= 200 && I.status < 300 || I.status === 304))
              throw new Error(
                "Couldn't load " + r + ". Status: " + I.status
              );
            return I.response !== void 0 ? new Uint8Array(I.response || []) : vn(I.responseText || "", !0);
          }, h = this;
          h.setDataGetter(function(U) {
            var F = U * z, I = (U + 1) * z - 1;
            if (I = Math.min(I, g - 1), typeof h.chunks[U] > "u" && (h.chunks[U] = v(F, I)), typeof h.chunks[U] > "u")
              throw new Error("doXHR failed!");
            return h.chunks[U];
          }), (W || !g) && (z = g = 1, g = this.getter(0).length, z = g, console.log(
            "LazyFiles on gzip forces download of the whole file when length is accessed"
          )), this._length = g, this._chunkSize = z, this.lengthKnown = !0;
        }, typeof XMLHttpRequest < "u") {
          if (!S)
            throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
          var u = new l();
          Object.defineProperties(u, {
            length: {
              get: function() {
                return this.lengthKnown || this.cacheLength(), this._length;
              }
            },
            chunkSize: {
              get: function() {
                return this.lengthKnown || this.cacheLength(), this._chunkSize;
              }
            }
          });
          var s = { isDevice: !1, contents: u };
        } else
          var s = { isDevice: !1, url: r };
        var d = o.createFile(e, n, s, t, a);
        s.contents ? d.contents = s.contents : s.url && (d.contents = null, d.url = s.url), Object.defineProperties(d, {
          usedBytes: {
            get: function() {
              return this.contents.length;
            }
          }
        });
        var f = {}, m = Object.keys(d.stream_ops);
        return m.forEach(function(p) {
          var _ = d.stream_ops[p];
          f[p] = function() {
            if (!o.forceLoadFile(d))
              throw new o.ErrnoError(29);
            return _.apply(null, arguments);
          };
        }), f.read = function(_, g, w, L, W) {
          if (!o.forceLoadFile(d))
            throw new o.ErrnoError(29);
          var z = _.node.contents;
          if (W >= z.length) return 0;
          var v = Math.min(z.length - W, L);
          if (z.slice)
            for (var h = 0; h < v; h++)
              g[w + h] = z[W + h];
          else
            for (var h = 0; h < v; h++)
              g[w + h] = z.get(W + h);
          return v;
        }, d.stream_ops = f, d;
      },
      createPreloadedFile: function(e, n, r, t, a, l, u, s, d, f) {
        c.init();
        var m = n ? fe.resolve(M.join2(e, n)) : e;
        function p(_) {
          function g(L) {
            f && f(), s || o.createDataFile(
              e,
              n,
              L,
              t,
              a,
              d
            ), l && l(), Xe();
          }
          var w = !1;
          i.preloadPlugins.forEach(function(L) {
            w || L.canHandle(m) && (L.handle(_, m, g, function() {
              u && u(), Xe();
            }), w = !0);
          }), w || g(_);
        }
        tn(), typeof r == "string" ? c.asyncLoad(
          r,
          function(_) {
            p(_);
          },
          u
        ) : p(r);
      },
      indexedDB: function() {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },
      DB_NAME: function() {
        return "EM_FS_" + window.location.pathname;
      },
      DB_VERSION: 20,
      DB_STORE_NAME: "FILE_DATA",
      saveFilesToDB: function(e, n, r) {
        n = n || function() {
        }, r = r || function() {
        };
        var t = o.indexedDB();
        try {
          var a = t.open(o.DB_NAME(), o.DB_VERSION);
        } catch (l) {
          return r(l);
        }
        a.onupgradeneeded = function() {
          console.log("creating db");
          var u = a.result;
          u.createObjectStore(o.DB_STORE_NAME);
        }, a.onsuccess = function() {
          var u = a.result, s = u.transaction([o.DB_STORE_NAME], "readwrite"), d = s.objectStore(o.DB_STORE_NAME), f = 0, m = 0, p = e.length;
          function _() {
            m == 0 ? n() : r();
          }
          e.forEach(function(g) {
            var w = d.put(
              o.analyzePath(g).object.contents,
              g
            );
            w.onsuccess = function() {
              f++, f + m == p && _();
            }, w.onerror = function() {
              m++, f + m == p && _();
            };
          }), s.onerror = r;
        }, a.onerror = r;
      },
      loadFilesFromDB: function(e, n, r) {
        n = n || function() {
        }, r = r || function() {
        };
        var t = o.indexedDB();
        try {
          var a = t.open(o.DB_NAME(), o.DB_VERSION);
        } catch (l) {
          return r(l);
        }
        a.onupgradeneeded = r, a.onsuccess = function() {
          var u = a.result;
          try {
            var s = u.transaction([o.DB_STORE_NAME], "readonly");
          } catch (g) {
            r(g);
            return;
          }
          var d = s.objectStore(o.DB_STORE_NAME), f = 0, m = 0, p = e.length;
          function _() {
            m == 0 ? n() : r();
          }
          e.forEach(function(g) {
            var w = d.get(g);
            w.onsuccess = function() {
              o.analyzePath(g).exists && o.unlink(g), o.createDataFile(
                M.dirname(g),
                M.basename(g),
                w.result,
                !0,
                !0,
                !0
              ), f++, f + m == p && _();
            }, w.onerror = function() {
              m++, f + m == p && _();
            };
          }), s.onerror = r;
        }, a.onerror = r;
      }
    }, A = {
      DEFAULT_POLLMASK: 5,
      mappings: {},
      umask: 511,
      calculateAt: function(e, n) {
        if (n[0] !== "/") {
          var r;
          if (e === -100)
            r = o.cwd();
          else {
            var t = o.getStream(e);
            if (!t) throw new o.ErrnoError(8);
            r = t.path;
          }
          n = M.join2(r, n);
        }
        return n;
      },
      doStat: function(e, n, r) {
        try {
          var t = e(n);
        } catch (a) {
          if (a && a.node && M.normalize(n) !== M.normalize(o.getPath(a.node)))
            return -54;
          throw a;
        }
        return E[r >> 2] = t.dev, E[r + 4 >> 2] = 0, E[r + 8 >> 2] = t.ino, E[r + 12 >> 2] = t.mode, E[r + 16 >> 2] = t.nlink, E[r + 20 >> 2] = t.uid, E[r + 24 >> 2] = t.gid, E[r + 28 >> 2] = t.rdev, E[r + 32 >> 2] = 0, pe = [
          t.size >>> 0,
          (Z = t.size, +Dn(Z) >= 1 ? Z > 0 ? (Pn(+Ye(Z / 4294967296), 4294967295) | 0) >>> 0 : ~~+He(
            (Z - +(~~Z >>> 0)) / 4294967296
          ) >>> 0 : 0)
        ], E[r + 40 >> 2] = pe[0], E[r + 44 >> 2] = pe[1], E[r + 48 >> 2] = 4096, E[r + 52 >> 2] = t.blocks, E[r + 56 >> 2] = t.atime.getTime() / 1e3 | 0, E[r + 60 >> 2] = 0, E[r + 64 >> 2] = t.mtime.getTime() / 1e3 | 0, E[r + 68 >> 2] = 0, E[r + 72 >> 2] = t.ctime.getTime() / 1e3 | 0, E[r + 76 >> 2] = 0, pe = [
          t.ino >>> 0,
          (Z = t.ino, +Dn(Z) >= 1 ? Z > 0 ? (Pn(+Ye(Z / 4294967296), 4294967295) | 0) >>> 0 : ~~+He(
            (Z - +(~~Z >>> 0)) / 4294967296
          ) >>> 0 : 0)
        ], E[r + 80 >> 2] = pe[0], E[r + 84 >> 2] = pe[1], 0;
      },
      doMsync: function(e, n, r, t) {
        var a = new Uint8Array(J.subarray(e, e + r));
        o.msync(n, a, 0, r, t);
      },
      doMkdir: function(e, n) {
        return e = M.normalize(e), e[e.length - 1] === "/" && (e = e.substr(0, e.length - 1)), o.mkdir(e, n, 0), 0;
      },
      doMknod: function(e, n, r) {
        switch (n & 61440) {
          case 32768:
          case 8192:
          case 24576:
          case 4096:
          case 49152:
            break;
          default:
            return -28;
        }
        return o.mknod(e, n, r), 0;
      },
      doReadlink: function(e, n, r) {
        if (r <= 0) return -28;
        var t = o.readlink(e), a = Math.min(r, Ve(t)), l = ne[n + a];
        return bn(t, n, r + 1), ne[n + a] = l, a;
      },
      doAccess: function(e, n) {
        if (n & -8)
          return -28;
        var r, t = o.lookupPath(e, { follow: !0 });
        if (r = t.node, !r)
          return -44;
        var a = "";
        return n & 4 && (a += "r"), n & 2 && (a += "w"), n & 1 && (a += "x"), a && o.nodePermissions(r, a) ? -2 : 0;
      },
      doDup: function(e, n, r) {
        var t = o.getStream(r);
        return t && o.close(t), o.open(e, n, 0, r, r).fd;
      },
      doReadv: function(e, n, r, t) {
        for (var a = 0, l = 0; l < r; l++) {
          var u = E[n + l * 8 >> 2], s = E[n + (l * 8 + 4) >> 2], d = o.read(e, ne, u, s, t);
          if (d < 0) return -1;
          if (a += d, d < s) break;
        }
        return a;
      },
      doWritev: function(e, n, r, t) {
        for (var a = 0, l = 0; l < r; l++) {
          var u = E[n + l * 8 >> 2], s = E[n + (l * 8 + 4) >> 2], d = o.write(e, ne, u, s, t);
          if (d < 0) return -1;
          a += d;
        }
        return a;
      },
      varargs: 0,
      get: function(e) {
        A.varargs += 4;
        var n = E[A.varargs - 4 >> 2];
        return n;
      },
      getStr: function() {
        var e = $e(A.get());
        return e;
      },
      getStreamFromFD: function(e) {
        e === void 0 && (e = A.get());
        var n = o.getStream(e);
        if (!n) throw new o.ErrnoError(8);
        return n;
      },
      get64: function() {
        var e = A.get();
        return A.get(), e;
      },
      getZero: function() {
        A.get();
      }
    };
    function ei(e, n) {
      A.varargs = n;
      try {
        var r = A.getStreamFromFD(), t = A.get();
        switch (t) {
          case 0: {
            var a = A.get();
            if (a < 0)
              return -28;
            var l;
            return l = o.open(r.path, r.flags, 0, a), l.fd;
          }
          case 1:
          case 2:
            return 0;
          case 3:
            return r.flags;
          case 4: {
            var a = A.get();
            return r.flags |= a, 0;
          }
          case 12: {
            var a = A.get(), u = 0;
            return nn[a + u >> 1] = 2, 0;
          }
          case 13:
          case 14:
            return 0;
          case 16:
          case 8:
            return -28;
          case 9:
            return Ee(28), -1;
          default:
            return -28;
        }
      } catch (s) {
        return (typeof o > "u" || !(s instanceof o.ErrnoError)) && G(s), -s.errno;
      }
    }
    function ni(e, n) {
      A.varargs = n;
      try {
        var r = A.getStreamFromFD(), t = A.get(), a = A.get();
        return o.read(r, ne, t, a);
      } catch (l) {
        return (typeof o > "u" || !(l instanceof o.ErrnoError)) && G(l), -l.errno;
      }
    }
    function ri(e, n) {
      A.varargs = n;
      try {
        var r = A.getStreamFromFD(), t = A.get(), a = A.get();
        return o.write(r, ne, t, a);
      } catch (l) {
        return (typeof o > "u" || !(l instanceof o.ErrnoError)) && G(l), -l.errno;
      }
    }
    function ii(e, n) {
      A.varargs = n;
      try {
        var r = A.getStr(), t = A.get(), a = A.get(), l = o.open(r, t, a);
        return l.fd;
      } catch (u) {
        return (typeof o > "u" || !(u instanceof o.ErrnoError)) && G(u), -u.errno;
      }
    }
    function ti(e, n) {
      A.varargs = n;
      try {
        var r = A.getStreamFromFD(), t = A.get();
        switch (t) {
          case 21509:
          case 21505:
            return r.tty ? 0 : -59;
          case 21510:
          case 21511:
          case 21512:
          case 21506:
          case 21507:
          case 21508:
            return r.tty ? 0 : -59;
          case 21519: {
            if (!r.tty) return -59;
            var a = A.get();
            return E[a >> 2] = 0, 0;
          }
          case 21520:
            return r.tty ? -28 : -59;
          case 21531: {
            var a = A.get();
            return o.ioctl(r, t, a);
          }
          case 21523:
            return r.tty ? 0 : -59;
          case 21524:
            return r.tty ? 0 : -59;
          default:
            G("bad ioctl syscall " + t);
        }
      } catch (l) {
        return (typeof o > "u" || !(l instanceof o.ErrnoError)) && G(l), -l.errno;
      }
    }
    function ai(e, n) {
      if (e === -1 || n === 0)
        return -28;
      var r = A.mappings[e];
      if (!r) return 0;
      if (n === r.len) {
        var t = o.getStream(r.fd);
        A.doMsync(e, t, n, r.flags), o.munmap(t), A.mappings[e] = null, r.allocated && oe(r.malloc);
      }
      return 0;
    }
    function oi(e, n) {
      A.varargs = n;
      try {
        var r = A.get(), t = A.get();
        return ai(r, t);
      } catch (a) {
        return (typeof o > "u" || !(a instanceof o.ErrnoError)) && G(a), -a.errno;
      }
    }
    function li() {
    }
    var an = {};
    function Ae(e) {
      for (; e.length; ) {
        var n = e.pop(), r = e.pop();
        r(n);
      }
    }
    function Me(e) {
      return this.fromWireType(se[e >> 2]);
    }
    var Le = {}, Se = {}, on = {}, ui = 48, si = 57;
    function ln(e) {
      if (e === void 0)
        return "_unknown";
      e = e.replace(/[^a-zA-Z0-9_]/g, "$");
      var n = e.charCodeAt(0);
      return n >= ui && n <= si ? "_" + e : e;
    }
    function Rn(e, n) {
      return e = ln(e), new Function(
        "body",
        "return function " + e + `() {
    "use strict";    return body.apply(this, arguments);
};
`
      )(n);
    }
    function An(e, n) {
      var r = Rn(n, function(t) {
        this.name = n, this.message = t;
        var a = new Error(t).stack;
        a !== void 0 && (this.stack = this.toString() + `
` + a.replace(/^Error(:[^\n]*)?\n/, ""));
      });
      return r.prototype = Object.create(e.prototype), r.prototype.constructor = r, r.prototype.toString = function() {
        return this.message === void 0 ? this.name : this.name + ": " + this.message;
      }, r;
    }
    var or = void 0;
    function un(e) {
      throw new or(e);
    }
    function re(e, n, r) {
      e.forEach(function(s) {
        on[s] = n;
      });
      function t(s) {
        var d = r(s);
        d.length !== e.length && un("Mismatched type converter count");
        for (var f = 0; f < e.length; ++f)
          ye(e[f], d[f]);
      }
      var a = new Array(n.length), l = [], u = 0;
      n.forEach(function(s, d) {
        Se.hasOwnProperty(s) ? a[d] = Se[s] : (l.push(s), Le.hasOwnProperty(s) || (Le[s] = []), Le[s].push(function() {
          a[d] = Se[s], ++u, u === l.length && t(a);
        }));
      }), l.length === 0 && t(a);
    }
    function di(e) {
      var n = an[e];
      delete an[e];
      var r = n.elements, t = r.length, a = r.map(function(s) {
        return s.getterReturnType;
      }).concat(
        r.map(function(s) {
          return s.setterArgumentType;
        })
      ), l = n.rawConstructor, u = n.rawDestructor;
      re(
        [e],
        a,
        function(s) {
          return r.forEach(function(d, f) {
            var m = s[f], p = d.getter, _ = d.getterContext, g = s[f + t], w = d.setter, L = d.setterContext;
            d.read = function(W) {
              return m.fromWireType(
                p(_, W)
              );
            }, d.write = function(W, z) {
              var v = [];
              w(
                L,
                W,
                g.toWireType(v, z)
              ), Ae(v);
            };
          }), [
            {
              name: n.name,
              fromWireType: function(d) {
                for (var f = new Array(t), m = 0; m < t; ++m)
                  f[m] = r[m].read(d);
                return u(d), f;
              },
              toWireType: function(d, f) {
                if (t !== f.length)
                  throw new TypeError(
                    "Incorrect number of tuple elements for " + n.name + ": expected=" + t + ", actual=" + f.length
                  );
                for (var m = l(), p = 0; p < t; ++p)
                  r[p].write(m, f[p]);
                return d !== null && d.push(u, m), m;
              },
              argPackAdvance: 8,
              readValueFromPointer: Me,
              destructorFunction: u
            }
          ];
        }
      );
    }
    var sn = {};
    function fi(e) {
      var n = sn[e];
      delete sn[e];
      var r = n.rawConstructor, t = n.rawDestructor, a = n.fields, l = a.map(function(u) {
        return u.getterReturnType;
      }).concat(
        a.map(function(u) {
          return u.setterArgumentType;
        })
      );
      re(
        [e],
        l,
        function(u) {
          var s = {};
          return a.forEach(function(d, f) {
            var m = d.fieldName, p = u[f], _ = d.getter, g = d.getterContext, w = u[f + a.length], L = d.setter, W = d.setterContext;
            s[m] = {
              read: function(z) {
                return p.fromWireType(
                  _(g, z)
                );
              },
              write: function(z, v) {
                var h = [];
                L(
                  W,
                  z,
                  w.toWireType(h, v)
                ), Ae(h);
              }
            };
          }), [
            {
              name: n.name,
              fromWireType: function(d) {
                var f = {};
                for (var m in s)
                  f[m] = s[m].read(d);
                return t(d), f;
              },
              toWireType: function(d, f) {
                for (var m in s)
                  if (!(m in f))
                    throw new TypeError("Missing field");
                var p = r();
                for (m in s)
                  s[m].write(p, f[m]);
                return d !== null && d.push(t, p), p;
              },
              argPackAdvance: 8,
              readValueFromPointer: Me,
              destructorFunction: t
            }
          ];
        }
      );
    }
    function Mn(e) {
      switch (e) {
        case 1:
          return 0;
        case 2:
          return 1;
        case 4:
          return 2;
        case 8:
          return 3;
        default:
          throw new TypeError("Unknown type size: " + e);
      }
    }
    function ci() {
      for (var e = new Array(256), n = 0; n < 256; ++n)
        e[n] = String.fromCharCode(n);
      lr = e;
    }
    var lr = void 0;
    function Y(e) {
      for (var n = "", r = e; J[r]; )
        n += lr[J[r++]];
      return n;
    }
    var Oe = void 0;
    function B(e) {
      throw new Oe(e);
    }
    function ye(e, n, r) {
      if (r = r || {}, !("argPackAdvance" in n))
        throw new TypeError(
          "registerType registeredInstance requires argPackAdvance"
        );
      var t = n.name;
      if (e || B(
        'type "' + t + '" must have a positive integer typeid pointer'
      ), Se.hasOwnProperty(e)) {
        if (r.ignoreDuplicateRegistrations)
          return;
        B("Cannot register type '" + t + "' twice");
      }
      if (Se[e] = n, delete on[e], Le.hasOwnProperty(e)) {
        var a = Le[e];
        delete Le[e], a.forEach(function(l) {
          l();
        });
      }
    }
    function mi(e, n, r, t, a) {
      var l = Mn(r);
      n = Y(n), ye(e, {
        name: n,
        fromWireType: function(u) {
          return !!u;
        },
        toWireType: function(u, s) {
          return s ? t : a;
        },
        argPackAdvance: 8,
        readValueFromPointer: function(u) {
          var s;
          if (r === 1)
            s = ne;
          else if (r === 2)
            s = nn;
          else if (r === 4)
            s = E;
          else
            throw new TypeError("Unknown boolean type size: " + n);
          return this.fromWireType(s[u >> l]);
        },
        destructorFunction: null
      });
    }
    function pi(e) {
      if (!(this instanceof ve) || !(e instanceof ve))
        return !1;
      for (var n = this.$$.ptrType.registeredClass, r = this.$$.ptr, t = e.$$.ptrType.registeredClass, a = e.$$.ptr; n.baseClass; )
        r = n.upcast(r), n = n.baseClass;
      for (; t.baseClass; )
        a = t.upcast(a), t = t.baseClass;
      return n === t && r === a;
    }
    function yi(e) {
      return {
        count: e.count,
        deleteScheduled: e.deleteScheduled,
        preservePointerOnDelete: e.preservePointerOnDelete,
        ptr: e.ptr,
        ptrType: e.ptrType,
        smartPtr: e.smartPtr,
        smartPtrType: e.smartPtrType
      };
    }
    function Ln(e) {
      function n(r) {
        return r.$$.ptrType.registeredClass.name;
      }
      B(n(e) + " instance already deleted");
    }
    var On = !1;
    function ur(e) {
    }
    function _i(e) {
      e.smartPtr ? e.smartPtrType.rawDestructor(e.smartPtr) : e.ptrType.registeredClass.rawDestructor(e.ptr);
    }
    function sr(e) {
      e.count.value -= 1;
      var n = e.count.value === 0;
      n && _i(e);
    }
    function Ke(e) {
      return typeof FinalizationGroup > "u" ? (Ke = function(n) {
        return n;
      }, e) : (On = new FinalizationGroup(function(n) {
        for (var r = n.next(); !r.done; r = n.next()) {
          var t = r.value;
          t.ptr ? sr(t) : console.warn("object already deleted: " + t.ptr);
        }
      }), Ke = function(n) {
        return On.register(n, n.$$, n.$$), n;
      }, ur = function(n) {
        On.unregister(n.$$);
      }, Ke(e));
    }
    function vi() {
      if (this.$$.ptr || Ln(this), this.$$.preservePointerOnDelete)
        return this.$$.count.value += 1, this;
      var e = Ke(
        Object.create(Object.getPrototypeOf(this), {
          $$: { value: yi(this.$$) }
        })
      );
      return e.$$.count.value += 1, e.$$.deleteScheduled = !1, e;
    }
    function gi() {
      this.$$.ptr || Ln(this), this.$$.deleteScheduled && !this.$$.preservePointerOnDelete && B("Object already scheduled for deletion"), ur(this), sr(this.$$), this.$$.preservePointerOnDelete || (this.$$.smartPtr = void 0, this.$$.ptr = void 0);
    }
    function hi() {
      return !this.$$.ptr;
    }
    var Ze = void 0, Qe = [];
    function xn() {
      for (; Qe.length; ) {
        var e = Qe.pop();
        e.$$.deleteScheduled = !1, e.delete();
      }
    }
    function wi() {
      return this.$$.ptr || Ln(this), this.$$.deleteScheduled && !this.$$.preservePointerOnDelete && B("Object already scheduled for deletion"), Qe.push(this), Qe.length === 1 && Ze && Ze(xn), this.$$.deleteScheduled = !0, this;
    }
    function Ci() {
      ve.prototype.isAliasOf = pi, ve.prototype.clone = vi, ve.prototype.delete = gi, ve.prototype.isDeleted = hi, ve.prototype.deleteLater = wi;
    }
    function ve() {
    }
    var dr = {};
    function Nn(e, n, r) {
      if (e[n].overloadTable === void 0) {
        var t = e[n];
        e[n] = function() {
          return e[n].overloadTable.hasOwnProperty(arguments.length) || B(
            "Function '" + r + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + e[n].overloadTable + ")!"
          ), e[n].overloadTable[arguments.length].apply(
            this,
            arguments
          );
        }, e[n].overloadTable = [], e[n].overloadTable[t.argCount] = t;
      }
    }
    function fr(e, n, r) {
      i.hasOwnProperty(e) ? ((r === void 0 || i[e].overloadTable !== void 0 && i[e].overloadTable[r] !== void 0) && B("Cannot register public name '" + e + "' twice"), Nn(i, e, e), i.hasOwnProperty(r) && B(
        "Cannot register multiple overloads of a function with the same number of arguments (" + r + ")!"
      ), i[e].overloadTable[r] = n) : (i[e] = n, r !== void 0 && (i[e].numArguments = r));
    }
    function Ei(e, n, r, t, a, l, u, s) {
      this.name = e, this.constructor = n, this.instancePrototype = r, this.rawDestructor = t, this.baseClass = a, this.getActualType = l, this.upcast = u, this.downcast = s, this.pureVirtualFunctions = [];
    }
    function dn(e, n, r) {
      for (; n !== r; )
        n.upcast || B(
          "Expected null or instance of " + r.name + ", got an instance of " + n.name
        ), e = n.upcast(e), n = n.baseClass;
      return e;
    }
    function bi(e, n) {
      if (n === null)
        return this.isReference && B("null is not a valid " + this.name), 0;
      n.$$ || B(
        'Cannot pass "' + xe(n) + '" as a ' + this.name
      ), n.$$.ptr || B(
        "Cannot pass deleted object as a pointer of type " + this.name
      );
      var r = n.$$.ptrType.registeredClass, t = dn(n.$$.ptr, r, this.registeredClass);
      return t;
    }
    function Si(e, n) {
      var r;
      if (n === null)
        return this.isReference && B("null is not a valid " + this.name), this.isSmartPointer ? (r = this.rawConstructor(), e !== null && e.push(this.rawDestructor, r), r) : 0;
      n.$$ || B(
        'Cannot pass "' + xe(n) + '" as a ' + this.name
      ), n.$$.ptr || B(
        "Cannot pass deleted object as a pointer of type " + this.name
      ), !this.isConst && n.$$.ptrType.isConst && B(
        "Cannot convert argument of type " + (n.$$.smartPtrType ? n.$$.smartPtrType.name : n.$$.ptrType.name) + " to parameter type " + this.name
      );
      var t = n.$$.ptrType.registeredClass;
      if (r = dn(n.$$.ptr, t, this.registeredClass), this.isSmartPointer)
        switch (n.$$.smartPtr === void 0 && B("Passing raw pointer to smart pointer is illegal"), this.sharingPolicy) {
          case 0:
            n.$$.smartPtrType === this ? r = n.$$.smartPtr : B(
              "Cannot convert argument of type " + (n.$$.smartPtrType ? n.$$.smartPtrType.name : n.$$.ptrType.name) + " to parameter type " + this.name
            );
            break;
          case 1:
            r = n.$$.smartPtr;
            break;
          case 2:
            if (n.$$.smartPtrType === this)
              r = n.$$.smartPtr;
            else {
              var a = n.clone();
              r = this.rawShare(
                r,
                De(function() {
                  a.delete();
                })
              ), e !== null && e.push(this.rawDestructor, r);
            }
            break;
          default:
            B("Unsupporting sharing policy");
        }
      return r;
    }
    function ki(e, n) {
      if (n === null)
        return this.isReference && B("null is not a valid " + this.name), 0;
      n.$$ || B(
        'Cannot pass "' + xe(n) + '" as a ' + this.name
      ), n.$$.ptr || B(
        "Cannot pass deleted object as a pointer of type " + this.name
      ), n.$$.ptrType.isConst && B(
        "Cannot convert argument of type " + n.$$.ptrType.name + " to parameter type " + this.name
      );
      var r = n.$$.ptrType.registeredClass, t = dn(n.$$.ptr, r, this.registeredClass);
      return t;
    }
    function Di(e) {
      return this.rawGetPointee && (e = this.rawGetPointee(e)), e;
    }
    function Pi(e) {
      this.rawDestructor && this.rawDestructor(e);
    }
    function Fi(e) {
      e !== null && e.delete();
    }
    function cr(e, n, r) {
      if (n === r)
        return e;
      if (r.baseClass === void 0)
        return null;
      var t = cr(e, n, r.baseClass);
      return t === null ? null : r.downcast(t);
    }
    function Ti() {
      return Object.keys(Je).length;
    }
    function Ri() {
      var e = [];
      for (var n in Je)
        Je.hasOwnProperty(n) && e.push(Je[n]);
      return e;
    }
    function Ai(e) {
      Ze = e, Qe.length && Ze && Ze(xn);
    }
    function Mi() {
      i.getInheritedInstanceCount = Ti, i.getLiveInheritedInstances = Ri, i.flushPendingDeletes = xn, i.setDelayFunction = Ai;
    }
    var Je = {};
    function Li(e, n) {
      for (n === void 0 && B("ptr should not be undefined"); e.baseClass; )
        n = e.upcast(n), e = e.baseClass;
      return n;
    }
    function Oi(e, n) {
      return n = Li(e, n), Je[n];
    }
    function fn(e, n) {
      (!n.ptrType || !n.ptr) && un("makeClassHandle requires ptr and ptrType");
      var r = !!n.smartPtrType, t = !!n.smartPtr;
      return r !== t && un("Both smartPtrType and smartPtr must be specified"), n.count = { value: 1 }, Ke(
        Object.create(e, { $$: { value: n } })
      );
    }
    function xi(e) {
      var n = this.getPointee(e);
      if (!n)
        return this.destructor(e), null;
      var r = Oi(
        this.registeredClass,
        n
      );
      if (r !== void 0) {
        if (r.$$.count.value === 0)
          return r.$$.ptr = n, r.$$.smartPtr = e, r.clone();
        var t = r.clone();
        return this.destructor(e), t;
      }
      function a() {
        return this.isSmartPointer ? fn(this.registeredClass.instancePrototype, {
          ptrType: this.pointeeType,
          ptr: n,
          smartPtrType: this,
          smartPtr: e
        }) : fn(this.registeredClass.instancePrototype, {
          ptrType: this,
          ptr: e
        });
      }
      var l = this.registeredClass.getActualType(n), u = dr[l];
      if (!u)
        return a.call(this);
      var s;
      this.isConst ? s = u.constPointerType : s = u.pointerType;
      var d = cr(
        n,
        this.registeredClass,
        s.registeredClass
      );
      return d === null ? a.call(this) : this.isSmartPointer ? fn(s.registeredClass.instancePrototype, {
        ptrType: s,
        ptr: d,
        smartPtrType: this,
        smartPtr: e
      }) : fn(s.registeredClass.instancePrototype, {
        ptrType: s,
        ptr: d
      });
    }
    function Ni() {
      ce.prototype.getPointee = Di, ce.prototype.destructor = Pi, ce.prototype.argPackAdvance = 8, ce.prototype.readValueFromPointer = Me, ce.prototype.deleteObject = Fi, ce.prototype.fromWireType = xi;
    }
    function ce(e, n, r, t, a, l, u, s, d, f, m) {
      this.name = e, this.registeredClass = n, this.isReference = r, this.isConst = t, this.isSmartPointer = a, this.pointeeType = l, this.sharingPolicy = u, this.rawGetPointee = s, this.rawConstructor = d, this.rawShare = f, this.rawDestructor = m, !a && n.baseClass === void 0 ? t ? (this.toWireType = bi, this.destructorFunction = null) : (this.toWireType = ki, this.destructorFunction = null) : this.toWireType = Si;
    }
    function mr(e, n, r) {
      i.hasOwnProperty(e) || un("Replacing nonexistant public symbol"), i[e].overloadTable !== void 0 && r !== void 0 ? i[e].overloadTable[r] = n : (i[e] = n, i[e].argCount = r);
    }
    function q(e, n) {
      e = Y(e);
      function r(l) {
        for (var u = [], s = 1; s < e.length; ++s)
          u.push("a" + s);
        var d = "dynCall_" + e + "_" + n, f = "return function " + d + "(" + u.join(", ") + `) {
`;
        return f += "    return dynCall(rawFunction" + (u.length ? ", " : "") + u.join(", ") + `);
`, f += `};
`, new Function("dynCall", "rawFunction", f)(
          l,
          n
        );
      }
      var t;
      if (i["FUNCTION_TABLE_" + e] !== void 0)
        t = i["FUNCTION_TABLE_" + e][n];
      else if (typeof FUNCTION_TABLE < "u")
        t = FUNCTION_TABLE[n];
      else {
        var a = i["dynCall_" + e];
        a === void 0 && (a = i["dynCall_" + e.replace(/f/g, "d")], a === void 0 && B("No dynCall invoker for signature: " + e)), t = r(a);
      }
      return typeof t != "function" && B(
        "unknown function pointer with signature " + e + ": " + n
      ), t;
    }
    var pr = void 0;
    function yr(e) {
      var n = qt(e), r = Y(n);
      return oe(n), r;
    }
    function ke(e, n) {
      var r = [], t = {};
      function a(l) {
        if (!t[l] && !Se[l]) {
          if (on[l]) {
            on[l].forEach(a);
            return;
          }
          r.push(l), t[l] = !0;
        }
      }
      throw n.forEach(a), new pr(
        e + ": " + r.map(yr).join([", "])
      );
    }
    function Bi(e, n, r, t, a, l, u, s, d, f, m, p, _) {
      m = Y(m), l = q(
        a,
        l
      ), s && (s = q(u, s)), f && (f = q(d, f)), _ = q(
        p,
        _
      );
      var g = ln(m);
      fr(g, function() {
        ke(
          "Cannot construct " + m + " due to unbound types",
          [t]
        );
      }), re(
        [e, n, r],
        t ? [t] : [],
        function(w) {
          w = w[0];
          var L, W;
          t ? (L = w.registeredClass, W = L.instancePrototype) : W = ve.prototype;
          var z = Rn(g, function() {
            if (Object.getPrototypeOf(this) !== v)
              throw new Oe("Use 'new' to construct " + m);
            if (h.constructor_body === void 0)
              throw new Oe(m + " has no accessible constructor");
            var Q = h.constructor_body[arguments.length];
            if (Q === void 0)
              throw new Oe(
                "Tried to invoke ctor of " + m + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(h.constructor_body).toString() + ") parameters instead!"
              );
            return Q.apply(this, arguments);
          }), v = Object.create(W, {
            constructor: { value: z }
          });
          z.prototype = v;
          var h = new Ei(
            m,
            z,
            v,
            _,
            L,
            l,
            s,
            f
          ), U = new ce(
            m,
            h,
            !0,
            !1,
            !1
          ), F = new ce(
            m + "*",
            h,
            !1,
            !1,
            !1
          ), I = new ce(
            m + " const*",
            h,
            !1,
            !0,
            !1
          );
          return dr[e] = {
            pointerType: F,
            constPointerType: I
          }, mr(g, z), [U, F, I];
        }
      );
    }
    function _r(e, n) {
      if (!(e instanceof Function))
        throw new TypeError(
          "new_ called with constructor type " + typeof e + " which is not a function"
        );
      var r = Rn(
        e.name || "unknownFunctionName",
        function() {
        }
      );
      r.prototype = e.prototype;
      var t = new r(), a = e.apply(t, n);
      return a instanceof Object ? a : t;
    }
    function Bn(e, n, r, t, a) {
      var l = n.length;
      l < 2 && B(
        "argTypes array size mismatch! Must at least get return value and 'this' types!"
      );
      for (var u = n[1] !== null && r !== null, s = !1, d = 1; d < n.length; ++d)
        if (n[d] !== null && n[d].destructorFunction === void 0) {
          s = !0;
          break;
        }
      for (var f = n[0].name !== "void", m = "", p = "", d = 0; d < l - 2; ++d)
        m += (d !== 0 ? ", " : "") + "arg" + d, p += (d !== 0 ? ", " : "") + "arg" + d + "Wired";
      var _ = "return function " + ln(e) + "(" + m + `) {
if (arguments.length !== ` + (l - 2) + `) {
throwBindingError('function ` + e + " called with ' + arguments.length + ' arguments, expected " + (l - 2) + ` args!');
}
`;
      s && (_ += `var destructors = [];
`);
      var g = s ? "destructors" : "null", w = [
        "throwBindingError",
        "invoker",
        "fn",
        "runDestructors",
        "retType",
        "classParam"
      ], L = [
        B,
        t,
        a,
        Ae,
        n[0],
        n[1]
      ];
      u && (_ += "var thisWired = classParam.toWireType(" + g + `, this);
`);
      for (var d = 0; d < l - 2; ++d)
        _ += "var arg" + d + "Wired = argType" + d + ".toWireType(" + g + ", arg" + d + "); // " + n[d + 2].name + `
`, w.push("argType" + d), L.push(n[d + 2]);
      if (u && (p = "thisWired" + (p.length > 0 ? ", " : "") + p), _ += (f ? "var rv = " : "") + "invoker(fn" + (p.length > 0 ? ", " : "") + p + `);
`, s)
        _ += `runDestructors(destructors);
`;
      else
        for (var d = u ? 1 : 2; d < n.length; ++d) {
          var W = d === 1 ? "thisWired" : "arg" + (d - 2) + "Wired";
          n[d].destructorFunction !== null && (_ += W + "_dtor(" + W + "); // " + n[d].name + `
`, w.push(W + "_dtor"), L.push(n[d].destructorFunction));
        }
      f && (_ += `var ret = retType.fromWireType(rv);
return ret;
`), _ += `}
`, w.push(_);
      var z = _r(Function, w).apply(null, L);
      return z;
    }
    function cn(e, n) {
      for (var r = [], t = 0; t < e; t++)
        r.push(E[(n >> 2) + t]);
      return r;
    }
    function Ii(e, n, r, t, a, l, u) {
      var s = cn(r, t);
      n = Y(n), l = q(a, l), re([], [e], function(d) {
        d = d[0];
        var f = d.name + "." + n;
        function m() {
          ke(
            "Cannot call " + f + " due to unbound types",
            s
          );
        }
        var p = d.registeredClass.constructor;
        return p[n] === void 0 ? (m.argCount = r - 1, p[n] = m) : (Nn(p, n, f), p[n].overloadTable[r - 1] = m), re([], s, function(_) {
          var g = [_[0], null].concat(_.slice(1)), w = Bn(
            f,
            g,
            null,
            l,
            u
          );
          return p[n].overloadTable === void 0 ? (w.argCount = r - 1, p[n] = w) : p[n].overloadTable[r - 1] = w, [];
        }), [];
      });
    }
    function zi(e, n, r, t, a, l) {
      var u = cn(n, r);
      a = q(t, a), re([], [e], function(s) {
        s = s[0];
        var d = "constructor " + s.name;
        if (s.registeredClass.constructor_body === void 0 && (s.registeredClass.constructor_body = []), s.registeredClass.constructor_body[n - 1] !== void 0)
          throw new Oe(
            "Cannot register multiple constructors with identical number of parameters (" + (n - 1) + ") for class '" + s.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!"
          );
        return s.registeredClass.constructor_body[n - 1] = function() {
          ke(
            "Cannot construct " + s.name + " due to unbound types",
            u
          );
        }, re([], u, function(f) {
          return s.registeredClass.constructor_body[n - 1] = function() {
            arguments.length !== n - 1 && B(
              d + " called with " + arguments.length + " arguments, expected " + (n - 1)
            );
            var p = [], _ = new Array(n);
            _[0] = l;
            for (var g = 1; g < n; ++g)
              _[g] = f[g].toWireType(
                p,
                arguments[g - 1]
              );
            var w = a.apply(null, _);
            return Ae(p), f[0].fromWireType(w);
          }, [];
        }), [];
      });
    }
    function Ui(e, n, r, t, a, l, u, s) {
      var d = cn(r, t);
      n = Y(n), l = q(a, l), re([], [e], function(f) {
        f = f[0];
        var m = f.name + "." + n;
        s && f.registeredClass.pureVirtualFunctions.push(n);
        function p() {
          ke(
            "Cannot call " + m + " due to unbound types",
            d
          );
        }
        var _ = f.registeredClass.instancePrototype, g = _[n];
        return g === void 0 || g.overloadTable === void 0 && g.className !== f.name && g.argCount === r - 2 ? (p.argCount = r - 2, p.className = f.name, _[n] = p) : (Nn(_, n, m), _[n].overloadTable[r - 2] = p), re([], d, function(w) {
          var L = Bn(
            m,
            w,
            f,
            l,
            u
          );
          return _[n].overloadTable === void 0 ? (L.argCount = r - 2, _[n] = L) : _[n].overloadTable[r - 2] = L, [];
        }), [];
      });
    }
    function vr(e, n, r) {
      return e instanceof Object || B(r + ' with invalid "this": ' + e), e instanceof n.registeredClass.constructor || B(
        r + ' incompatible with "this" of type ' + e.constructor.name
      ), e.$$.ptr || B(
        "cannot call emscripten binding method " + r + " on deleted object"
      ), dn(
        e.$$.ptr,
        e.$$.ptrType.registeredClass,
        n.registeredClass
      );
    }
    function ji(e, n, r, t, a, l, u, s, d, f) {
      n = Y(n), a = q(t, a), re([], [e], function(m) {
        m = m[0];
        var p = m.name + "." + n, _ = {
          get: function() {
            ke(
              "Cannot access " + p + " due to unbound types",
              [r, u]
            );
          },
          enumerable: !0,
          configurable: !0
        };
        return d ? _.set = function() {
          ke(
            "Cannot access " + p + " due to unbound types",
            [r, u]
          );
        } : _.set = function(g) {
          B(p + " is a read-only property");
        }, Object.defineProperty(
          m.registeredClass.instancePrototype,
          n,
          _
        ), re(
          [],
          d ? [r, u] : [r],
          function(g) {
            var w = g[0], L = {
              get: function() {
                var z = vr(this, m, p + " getter");
                return w.fromWireType(
                  a(l, z)
                );
              },
              enumerable: !0
            };
            if (d) {
              d = q(s, d);
              var W = g[1];
              L.set = function(z) {
                var v = vr(this, m, p + " setter"), h = [];
                d(
                  f,
                  v,
                  W.toWireType(h, z)
                ), Ae(h);
              };
            }
            return Object.defineProperty(
              m.registeredClass.instancePrototype,
              n,
              L
            ), [];
          }
        ), [];
      });
    }
    function Wi(e, n, r) {
      e = Y(e), re([], [n], function(t) {
        return t = t[0], i[e] = t.fromWireType(r), [];
      });
    }
    var In = [], ie = [
      {},
      { value: void 0 },
      { value: null },
      { value: !0 },
      { value: !1 }
    ];
    function zn(e) {
      e > 4 && --ie[e].refcount === 0 && (ie[e] = void 0, In.push(e));
    }
    function $i() {
      for (var e = 0, n = 5; n < ie.length; ++n)
        ie[n] !== void 0 && ++e;
      return e;
    }
    function Vi() {
      for (var e = 5; e < ie.length; ++e)
        if (ie[e] !== void 0)
          return ie[e];
      return null;
    }
    function qi() {
      i.count_emval_handles = $i, i.get_first_emval = Vi;
    }
    function De(e) {
      switch (e) {
        case void 0:
          return 1;
        case null:
          return 2;
        case !0:
          return 3;
        case !1:
          return 4;
        default: {
          var n = In.length ? In.pop() : ie.length;
          return ie[n] = { refcount: 1, value: e }, n;
        }
      }
    }
    function Hi(e, n) {
      n = Y(n), ye(e, {
        name: n,
        fromWireType: function(r) {
          var t = ie[r].value;
          return zn(r), t;
        },
        toWireType: function(r, t) {
          return De(t);
        },
        argPackAdvance: 8,
        readValueFromPointer: Me,
        destructorFunction: null
      });
    }
    function xe(e) {
      if (e === null)
        return "null";
      var n = typeof e;
      return n === "object" || n === "array" || n === "function" ? e.toString() : "" + e;
    }
    function Yi(e, n) {
      switch (n) {
        case 2:
          return function(r) {
            return this.fromWireType(Xn[r >> 2]);
          };
        case 3:
          return function(r) {
            return this.fromWireType(Kn[r >> 3]);
          };
        default:
          throw new TypeError("Unknown float type: " + e);
      }
    }
    function Gi(e, n, r) {
      var t = Mn(r);
      n = Y(n), ye(e, {
        name: n,
        fromWireType: function(a) {
          return a;
        },
        toWireType: function(a, l) {
          if (typeof l != "number" && typeof l != "boolean")
            throw new TypeError(
              'Cannot convert "' + xe(l) + '" to ' + this.name
            );
          return l;
        },
        argPackAdvance: 8,
        readValueFromPointer: Yi(n, t),
        destructorFunction: null
      });
    }
    function Xi(e, n, r, t, a, l) {
      var u = cn(n, r);
      e = Y(e), a = q(t, a), fr(
        e,
        function() {
          ke(
            "Cannot call " + e + " due to unbound types",
            u
          );
        },
        n - 1
      ), re([], u, function(s) {
        var d = [s[0], null].concat(s.slice(1));
        return mr(
          e,
          Bn(e, d, null, a, l),
          n - 1
        ), [];
      });
    }
    function Ki(e, n, r) {
      switch (n) {
        case 0:
          return r ? function(a) {
            return ne[a];
          } : function(a) {
            return J[a];
          };
        case 1:
          return r ? function(a) {
            return nn[a >> 1];
          } : function(a) {
            return Sn[a >> 1];
          };
        case 2:
          return r ? function(a) {
            return E[a >> 2];
          } : function(a) {
            return se[a >> 2];
          };
        default:
          throw new TypeError("Unknown integer type: " + e);
      }
    }
    function Zi(e, n, r, t, a) {
      n = Y(n), a === -1 && (a = 4294967295);
      var l = Mn(r), u = function(f) {
        return f;
      };
      if (t === 0) {
        var s = 32 - 8 * r;
        u = function(f) {
          return f << s >>> s;
        };
      }
      var d = n.indexOf("unsigned") != -1;
      ye(e, {
        name: n,
        fromWireType: u,
        toWireType: function(f, m) {
          if (typeof m != "number" && typeof m != "boolean")
            throw new TypeError(
              'Cannot convert "' + xe(m) + '" to ' + this.name
            );
          if (m < t || m > a)
            throw new TypeError(
              'Passing a number "' + xe(m) + '" from JS side to C/C++ side to an argument of type "' + n + '", which is outside the valid range [' + t + ", " + a + "]!"
            );
          return d ? m >>> 0 : m | 0;
        },
        argPackAdvance: 8,
        readValueFromPointer: Ki(
          n,
          l,
          t !== 0
        ),
        destructorFunction: null
      });
    }
    function Qi(e, n, r) {
      var t = [
        Int8Array,
        Uint8Array,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array
      ], a = t[n];
      function l(u) {
        u = u >> 2;
        var s = se, d = s[u], f = s[u + 1];
        return new a(s.buffer, f, d);
      }
      r = Y(r), ye(
        e,
        {
          name: r,
          fromWireType: l,
          argPackAdvance: 8,
          readValueFromPointer: l
        },
        { ignoreDuplicateRegistrations: !0 }
      );
    }
    function Ji(e, n, r, t, a, l, u, s, d, f, m, p) {
      r = Y(r), l = q(
        a,
        l
      ), s = q(
        u,
        s
      ), f = q(d, f), p = q(
        m,
        p
      ), re(
        [e],
        [n],
        function(_) {
          _ = _[0];
          var g = new ce(
            r,
            _.registeredClass,
            !1,
            !1,
            !0,
            _,
            t,
            l,
            s,
            f,
            p
          );
          return [g];
        }
      );
    }
    function et(e, n) {
      n = Y(n);
      var r = n === "std::string";
      ye(e, {
        name: n,
        fromWireType: function(t) {
          var a = se[t >> 2], l;
          if (r) {
            var u = J[t + 4 + a], s = 0;
            u != 0 && (s = u, J[t + 4 + a] = 0);
            for (var d = t + 4, f = 0; f <= a; ++f) {
              var m = t + 4 + f;
              if (J[m] == 0) {
                var p = $e(d);
                l === void 0 ? l = p : (l += "\0", l += p), d = m + 1;
              }
            }
            s != 0 && (J[t + 4 + a] = s);
          } else {
            for (var _ = new Array(a), f = 0; f < a; ++f)
              _[f] = String.fromCharCode(J[t + 4 + f]);
            l = _.join("");
          }
          return oe(t), l;
        },
        toWireType: function(t, a) {
          a instanceof ArrayBuffer && (a = new Uint8Array(a));
          var l, u = typeof a == "string";
          u || a instanceof Uint8Array || a instanceof Uint8ClampedArray || a instanceof Int8Array || B("Cannot pass non-string to std::string"), r && u ? l = function() {
            return Ve(a);
          } : l = function() {
            return a.length;
          };
          var s = l(), d = Te(4 + s + 1);
          if (se[d >> 2] = s, r && u)
            bn(a, d + 4, s + 1);
          else if (u)
            for (var f = 0; f < s; ++f) {
              var m = a.charCodeAt(f);
              m > 255 && (oe(d), B(
                "String has UTF-16 code units that do not fit in 8 bits"
              )), J[d + 4 + f] = m;
            }
          else
            for (var f = 0; f < s; ++f)
              J[d + 4 + f] = a[f];
          return t !== null && t.push(oe, d), d;
        },
        argPackAdvance: 8,
        readValueFromPointer: Me,
        destructorFunction: function(t) {
          oe(t);
        }
      });
    }
    function nt(e, n, r) {
      r = Y(r);
      var t, a;
      n === 2 ? (t = function() {
        return Sn;
      }, a = 1) : n === 4 && (t = function() {
        return se;
      }, a = 2), ye(e, {
        name: r,
        fromWireType: function(l) {
          for (var u = t(), s = se[l >> 2], d = new Array(s), f = l + 4 >> a, m = 0; m < s; ++m)
            d[m] = String.fromCharCode(u[f + m]);
          return oe(l), d.join("");
        },
        toWireType: function(l, u) {
          var s = u.length, d = Te(4 + s * n), f = t();
          se[d >> 2] = s;
          for (var m = d + 4 >> a, p = 0; p < s; ++p)
            f[m + p] = u.charCodeAt(p);
          return l !== null && l.push(oe, d), d;
        },
        argPackAdvance: 8,
        readValueFromPointer: Me,
        destructorFunction: function(l) {
          oe(l);
        }
      });
    }
    function rt(e, n, r, t, a, l) {
      an[e] = {
        name: Y(n),
        rawConstructor: q(
          r,
          t
        ),
        rawDestructor: q(
          a,
          l
        ),
        elements: []
      };
    }
    function it(e, n, r, t, a, l, u, s, d) {
      an[e].elements.push({
        getterReturnType: n,
        getter: q(r, t),
        getterContext: a,
        setterArgumentType: l,
        setter: q(u, s),
        setterContext: d
      });
    }
    function tt(e, n, r, t, a, l) {
      sn[e] = {
        name: Y(n),
        rawConstructor: q(
          r,
          t
        ),
        rawDestructor: q(
          a,
          l
        ),
        fields: []
      };
    }
    function at(e, n, r, t, a, l, u, s, d, f) {
      sn[e].fields.push({
        fieldName: Y(n),
        getterReturnType: r,
        getter: q(t, a),
        getterContext: l,
        setterArgumentType: u,
        setter: q(s, d),
        setterContext: f
      });
    }
    function ot(e, n) {
      n = Y(n), ye(e, {
        isVoid: !0,
        name: n,
        argPackAdvance: 0,
        fromWireType: function() {
        },
        toWireType: function(r, t) {
        }
      });
    }
    function Pe(e) {
      return e || B("Cannot use deleted val. handle = " + e), ie[e].value;
    }
    function Un(e, n) {
      var r = Se[e];
      return r === void 0 && B(
        n + " has unknown type " + yr(e)
      ), r;
    }
    function lt(e, n, r) {
      e = Pe(e), n = Un(n, "emval::as");
      var t = [], a = De(t);
      return E[r >> 2] = a, n.toWireType(t, e);
    }
    var ut = {};
    function gr(e) {
      var n = ut[e];
      return n === void 0 ? Y(e) : n;
    }
    var jn = [];
    function st(e, n, r, t) {
      e = jn[e], n = Pe(n), r = gr(r), e(n, r, null, t);
    }
    function dt(e) {
      var n = jn.length;
      return jn.push(e), n;
    }
    function ft(e, n, r) {
      for (var t = new Array(e), a = 0; a < e; ++a)
        t[a] = Un(
          E[(n >> 2) + a],
          "parameter " + a
        );
      return t;
    }
    function ct(e, n) {
      for (var r = ft(e, n), t = r[0], a = t.name + "_$" + r.slice(1).map(function(g) {
        return g.name;
      }).join("_") + "$", l = ["retType"], u = [t], s = "", d = 0; d < e - 1; ++d)
        s += (d !== 0 ? ", " : "") + "arg" + d, l.push("argType" + d), u.push(r[1 + d]);
      for (var f = ln("methodCaller_" + a), m = "return function " + f + `(handle, name, destructors, args) {
`, p = 0, d = 0; d < e - 1; ++d)
        m += "    var arg" + d + " = argType" + d + ".readValueFromPointer(args" + (p ? "+" + p : "") + `);
`, p += r[d + 1].argPackAdvance;
      m += "    var rv = handle[name](" + s + `);
`;
      for (var d = 0; d < e - 1; ++d)
        r[d + 1].deleteObject && (m += "    argType" + d + ".deleteObject(arg" + d + `);
`);
      t.isVoid || (m += `    return retType.toWireType(destructors, rv);
`), m += `};
`, l.push(m);
      var _ = _r(Function, l).apply(null, u);
      return dt(_);
    }
    function mt(e, n) {
      return e = Pe(e), n = Pe(n), De(e[n]);
    }
    function pt(e) {
      e > 4 && (ie[e].refcount += 1);
    }
    function yt() {
      return De([]);
    }
    function _t(e) {
      return De(gr(e));
    }
    function vt(e) {
      var n = ie[e].value;
      Ae(n), zn(e);
    }
    function gt(e, n, r) {
      e = Pe(e), n = Pe(n), r = Pe(r), e[n] = r;
    }
    function ht(e, n) {
      e = Un(e, "_emval_take_value");
      var r = e.readValueFromPointer(n);
      return De(r);
    }
    function wt() {
      G();
    }
    function Ct() {
      return N || typeof dateNow < "u" || typeof performance == "object" && performance && typeof performance.now == "function";
    }
    function Et(e, n) {
      var r;
      if (e === 0)
        r = Date.now();
      else if (e === 1 && Ct())
        r = Ce();
      else
        return Ee(28), -1;
      return E[n >> 2] = r / 1e3 | 0, E[n + 4 >> 2] = r % 1e3 * 1e3 * 1e3 | 0, 0;
    }
    function hr() {
      return ne.length;
    }
    function bt() {
      return 1779952;
    }
    function St(e, n, r) {
      J.set(J.subarray(n, n + r), e);
    }
    function kt(e) {
      try {
        return he.grow(e - qe.byteLength + 65535 >> 16), Zn(he.buffer), 1;
      } catch {
      }
    }
    function Dt(e) {
      var n = hr(), r = 65536, t = 2147483648 - r;
      if (e > t)
        return !1;
      for (var a = 16777216, l = Math.max(n, a); l < e; )
        l <= 536870912 ? l = Gn(2 * l, r) : l = Math.min(
          Gn((3 * l + 2147483648) / 4, r),
          t
        );
      if (l = Math.min(l, 1073741824), l == n)
        return !1;
      var u = kt(l);
      return !!u;
    }
    var wr = {};
    function en() {
      if (!en.strings) {
        var e = {
          USER: "web_user",
          LOGNAME: "web_user",
          PATH: "/",
          PWD: "/",
          HOME: "/home/web_user",
          LANG: (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8",
          _: C
        };
        for (var n in wr)
          e[n] = wr[n];
        var r = [];
        for (var n in e)
          r.push(n + "=" + e[n]);
        en.strings = r;
      }
      return en.strings;
    }
    function Pt(e, n) {
      var r = en(), t = 0;
      return r.forEach(function(a, l) {
        var u = n + t;
        E[e + l * 4 >> 2] = u, Ar(a, u), t += a.length + 1;
      }), 0;
    }
    function Ft(e, n) {
      var r = en();
      E[e >> 2] = r.length;
      var t = 0;
      return r.forEach(function(a) {
        t += a.length + 1;
      }), E[n >> 2] = t, 0;
    }
    function Tt(e) {
      try {
        var n = A.getStreamFromFD(e);
        return o.close(n), 0;
      } catch (r) {
        return (typeof o > "u" || !(r instanceof o.ErrnoError)) && G(r), r.errno;
      }
    }
    function Rt(e, n, r, t) {
      try {
        var a = A.getStreamFromFD(e), l = A.doReadv(a, n, r);
        return E[t >> 2] = l, 0;
      } catch (u) {
        return (typeof o > "u" || !(u instanceof o.ErrnoError)) && G(u), u.errno;
      }
    }
    function At(e, n, r, t, a) {
      try {
        var l = A.getStreamFromFD(e), u = 4294967296, s = r * u + (n >>> 0), d = 9007199254740992;
        return s <= -d || s >= d ? -61 : (o.llseek(l, s, t), pe = [
          l.position >>> 0,
          (Z = l.position, +Dn(Z) >= 1 ? Z > 0 ? (Pn(+Ye(Z / 4294967296), 4294967295) | 0) >>> 0 : ~~+He(
            (Z - +(~~Z >>> 0)) / 4294967296
          ) >>> 0 : 0)
        ], E[a >> 2] = pe[0], E[a + 4 >> 2] = pe[1], l.getdents && s === 0 && t === 0 && (l.getdents = null), 0);
      } catch (f) {
        return (typeof o > "u" || !(f instanceof o.ErrnoError)) && G(f), f.errno;
      }
    }
    function Mt(e, n, r, t) {
      try {
        var a = A.getStreamFromFD(e), l = A.doWritev(a, n, r);
        return E[t >> 2] = l, 0;
      } catch (u) {
        return (typeof o > "u" || !(u instanceof o.ErrnoError)) && G(u), u.errno;
      }
    }
    function Lt() {
    }
    function Ot() {
    }
    function xt() {
    }
    function Nt(e) {
      return e = +e, e >= 0 ? +Ye(e + 0.5) : +He(e - 0.5);
    }
    function Bt(e) {
      return e = +e, e >= 0 ? +Ye(e + 0.5) : +He(e - 0.5);
    }
    function It(e) {
    }
    function mn(e) {
      return e % 4 === 0 && (e % 100 !== 0 || e % 400 === 0);
    }
    function Wn(e, n) {
      for (var r = 0, t = 0; t <= n; r += e[t++]) ;
      return r;
    }
    var pn = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], yn = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function _n(e, n) {
      for (var r = new Date(e.getTime()); n > 0; ) {
        var t = mn(r.getFullYear()), a = r.getMonth(), l = (t ? pn : yn)[a];
        if (n > l - r.getDate())
          n -= l - r.getDate() + 1, r.setDate(1), a < 11 ? r.setMonth(a + 1) : (r.setMonth(0), r.setFullYear(r.getFullYear() + 1));
        else
          return r.setDate(r.getDate() + n), r;
      }
      return r;
    }
    function zt(e, n, r, t) {
      var a = E[t + 40 >> 2], l = {
        tm_sec: E[t >> 2],
        tm_min: E[t + 4 >> 2],
        tm_hour: E[t + 8 >> 2],
        tm_mday: E[t + 12 >> 2],
        tm_mon: E[t + 16 >> 2],
        tm_year: E[t + 20 >> 2],
        tm_wday: E[t + 24 >> 2],
        tm_yday: E[t + 28 >> 2],
        tm_isdst: E[t + 32 >> 2],
        tm_gmtoff: E[t + 36 >> 2],
        tm_zone: a ? $e(a) : ""
      }, u = $e(r), s = {
        "%c": "%a %b %d %H:%M:%S %Y",
        "%D": "%m/%d/%y",
        "%F": "%Y-%m-%d",
        "%h": "%b",
        "%r": "%I:%M:%S %p",
        "%R": "%H:%M",
        "%T": "%H:%M:%S",
        "%x": "%m/%d/%y",
        "%X": "%H:%M:%S",
        "%Ec": "%c",
        "%EC": "%C",
        "%Ex": "%m/%d/%y",
        "%EX": "%H:%M:%S",
        "%Ey": "%y",
        "%EY": "%Y",
        "%Od": "%d",
        "%Oe": "%e",
        "%OH": "%H",
        "%OI": "%I",
        "%Om": "%m",
        "%OM": "%M",
        "%OS": "%S",
        "%Ou": "%u",
        "%OU": "%U",
        "%OV": "%V",
        "%Ow": "%w",
        "%OW": "%W",
        "%Oy": "%y"
      };
      for (var d in s)
        u = u.replace(
          new RegExp(d, "g"),
          s[d]
        );
      var f = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ], m = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      function p(v, h, U) {
        for (var F = typeof v == "number" ? v.toString() : v || ""; F.length < h; )
          F = U[0] + F;
        return F;
      }
      function _(v, h) {
        return p(v, h, "0");
      }
      function g(v, h) {
        function U(I) {
          return I < 0 ? -1 : I > 0 ? 1 : 0;
        }
        var F;
        return (F = U(v.getFullYear() - h.getFullYear())) === 0 && (F = U(v.getMonth() - h.getMonth())) === 0 && (F = U(v.getDate() - h.getDate())), F;
      }
      function w(v) {
        switch (v.getDay()) {
          case 0:
            return new Date(v.getFullYear() - 1, 11, 29);
          case 1:
            return v;
          case 2:
            return new Date(v.getFullYear(), 0, 3);
          case 3:
            return new Date(v.getFullYear(), 0, 2);
          case 4:
            return new Date(v.getFullYear(), 0, 1);
          case 5:
            return new Date(v.getFullYear() - 1, 11, 31);
          case 6:
            return new Date(v.getFullYear() - 1, 11, 30);
        }
      }
      function L(v) {
        var h = _n(
          new Date(v.tm_year + 1900, 0, 1),
          v.tm_yday
        ), U = new Date(h.getFullYear(), 0, 4), F = new Date(h.getFullYear() + 1, 0, 4), I = w(U), Q = w(F);
        return g(I, h) <= 0 ? g(Q, h) <= 0 ? h.getFullYear() + 1 : h.getFullYear() : h.getFullYear() - 1;
      }
      var W = {
        "%a": function(v) {
          return f[v.tm_wday].substring(0, 3);
        },
        "%A": function(v) {
          return f[v.tm_wday];
        },
        "%b": function(v) {
          return m[v.tm_mon].substring(0, 3);
        },
        "%B": function(v) {
          return m[v.tm_mon];
        },
        "%C": function(v) {
          var h = v.tm_year + 1900;
          return _(h / 100 | 0, 2);
        },
        "%d": function(v) {
          return _(v.tm_mday, 2);
        },
        "%e": function(v) {
          return p(v.tm_mday, 2, " ");
        },
        "%g": function(v) {
          return L(v).toString().substring(2);
        },
        "%G": function(v) {
          return L(v);
        },
        "%H": function(v) {
          return _(v.tm_hour, 2);
        },
        "%I": function(v) {
          var h = v.tm_hour;
          return h == 0 ? h = 12 : h > 12 && (h -= 12), _(h, 2);
        },
        "%j": function(v) {
          return _(
            v.tm_mday + Wn(
              mn(v.tm_year + 1900) ? pn : yn,
              v.tm_mon - 1
            ),
            3
          );
        },
        "%m": function(v) {
          return _(v.tm_mon + 1, 2);
        },
        "%M": function(v) {
          return _(v.tm_min, 2);
        },
        "%n": function() {
          return `
`;
        },
        "%p": function(v) {
          return v.tm_hour >= 0 && v.tm_hour < 12 ? "AM" : "PM";
        },
        "%S": function(v) {
          return _(v.tm_sec, 2);
        },
        "%t": function() {
          return "	";
        },
        "%u": function(v) {
          return v.tm_wday || 7;
        },
        "%U": function(v) {
          var h = new Date(v.tm_year + 1900, 0, 1), U = h.getDay() === 0 ? h : _n(h, 7 - h.getDay()), F = new Date(
            v.tm_year + 1900,
            v.tm_mon,
            v.tm_mday
          );
          if (g(U, F) < 0) {
            var I = Wn(
              mn(F.getFullYear()) ? pn : yn,
              F.getMonth() - 1
            ) - 31, Q = 31 - U.getDate(), de = Q + I + F.getDate();
            return _(Math.ceil(de / 7), 2);
          }
          return g(U, h) === 0 ? "01" : "00";
        },
        "%V": function(v) {
          var h = new Date(v.tm_year + 1900, 0, 4), U = new Date(v.tm_year + 1901, 0, 4), F = w(h), I = w(U), Q = _n(
            new Date(v.tm_year + 1900, 0, 1),
            v.tm_yday
          );
          if (g(Q, F) < 0)
            return "53";
          if (g(I, Q) <= 0)
            return "01";
          var de;
          return F.getFullYear() < v.tm_year + 1900 ? de = v.tm_yday + 32 - F.getDate() : de = v.tm_yday + 1 - F.getDate(), _(Math.ceil(de / 7), 2);
        },
        "%w": function(v) {
          return v.tm_wday;
        },
        "%W": function(v) {
          var h = new Date(v.tm_year, 0, 1), U = h.getDay() === 1 ? h : _n(
            h,
            h.getDay() === 0 ? 1 : 7 - h.getDay() + 1
          ), F = new Date(
            v.tm_year + 1900,
            v.tm_mon,
            v.tm_mday
          );
          if (g(U, F) < 0) {
            var I = Wn(
              mn(F.getFullYear()) ? pn : yn,
              F.getMonth() - 1
            ) - 31, Q = 31 - U.getDate(), de = Q + I + F.getDate();
            return _(Math.ceil(de / 7), 2);
          }
          return g(U, h) === 0 ? "01" : "00";
        },
        "%y": function(v) {
          return (v.tm_year + 1900).toString().substring(2);
        },
        "%Y": function(v) {
          return v.tm_year + 1900;
        },
        "%z": function(v) {
          var h = v.tm_gmtoff, U = h >= 0;
          return h = Math.abs(h) / 60, h = h / 60 * 100 + h % 60, (U ? "+" : "-") + ("0000" + h).slice(-4);
        },
        "%Z": function(v) {
          return v.tm_zone;
        },
        "%%": function() {
          return "%";
        }
      };
      for (var d in W)
        u.indexOf(d) >= 0 && (u = u.replace(
          new RegExp(d, "g"),
          W[d](l)
        ));
      var z = vn(u, !1);
      return z.length > n ? 0 : (Rr(z, e), z.length - 1);
    }
    function Ut(e, n, r, t) {
      return zt(e, n, r, t);
    }
    function jt(e) {
      switch (e) {
        case 30:
          return Hn;
        case 85:
          var n = 2 * 1024 * 1024 * 1024 - 65536;
          return n = 1073741824, n / Hn;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 79:
          return 0;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0:
          return 2097152;
        case 3:
          return 65536;
        case 28:
          return 32768;
        case 44:
          return 32767;
        case 75:
          return 16384;
        case 39:
          return 1e3;
        case 89:
          return 700;
        case 71:
          return 256;
        case 40:
          return 255;
        case 2:
          return 100;
        case 180:
          return 64;
        case 25:
          return 20;
        case 5:
          return 16;
        case 6:
          return 6;
        case 73:
          return 4;
        case 84:
          return typeof navigator == "object" && navigator.hardwareConcurrency || 1;
      }
      return Ee(28), -1;
    }
    if (i.requestFullScreen = function(n, r, t) {
      ee(
        "Module.requestFullScreen is deprecated. Please call Module.requestFullscreen instead."
      ), i.requestFullScreen = i.requestFullscreen, c.requestFullScreen(n, r, t);
    }, i.requestFullscreen = function(n, r, t) {
      c.requestFullscreen(n, r, t);
    }, i.requestAnimationFrame = function(n) {
      c.requestAnimationFrame(n);
    }, i.setCanvasSize = function(n, r, t) {
      c.setCanvasSize(n, r, t);
    }, i.pauseMainLoop = function() {
      c.mainLoop.pause();
    }, i.resumeMainLoop = function() {
      c.mainLoop.resume();
    }, i.getUserMedia = function() {
      c.getUserMedia();
    }, i.createContext = function(n, r, t, a) {
      return c.createContext(
        n,
        r,
        t,
        a
      );
    }, N ? Ce = function() {
      var n = process.hrtime();
      return n[0] * 1e3 + n[1] / 1e6;
    } : typeof dateNow < "u" ? Ce = dateNow : typeof performance == "object" && performance && typeof performance.now == "function" ? Ce = function() {
      return performance.now();
    } : Ce = Date.now, o.staticInit(), i.FS_createFolder = o.createFolder, i.FS_createPath = o.createPath, i.FS_createDataFile = o.createDataFile, i.FS_createPreloadedFile = o.createPreloadedFile, i.FS_createLazyFile = o.createLazyFile, i.FS_createLink = o.createLink, i.FS_createDevice = o.createDevice, i.FS_unlink = o.unlink, j) {
      var K = require("fs"), Cr = require("path");
      D.staticInit();
    }
    or = i.InternalError = An(
      Error,
      "InternalError"
    ), ci(), Oe = i.BindingError = An(Error, "BindingError"), Ci(), Ni(), Mi(), pr = i.UnboundTypeError = An(
      Error,
      "UnboundTypeError"
    ), qi();
    function vn(e, n, r) {
      var t = Ve(e) + 1, a = new Array(t), l = En(
        e,
        a,
        0,
        a.length
      );
      return n && (a.length = l), a;
    }
    function Er(e) {
      for (var n = [], r = 0; r < e.length; r++) {
        var t = e[r];
        t > 255 && (t &= 255), n.push(String.fromCharCode(t));
      }
      return n.join("");
    }
    var Wt = typeof atob == "function" ? atob : function(e) {
      var n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", r = "", t, a, l, u, s, d, f, m = 0;
      e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
      do
        u = n.indexOf(e.charAt(m++)), s = n.indexOf(e.charAt(m++)), d = n.indexOf(e.charAt(m++)), f = n.indexOf(e.charAt(m++)), t = u << 2 | s >> 4, a = (s & 15) << 4 | d >> 2, l = (d & 3) << 6 | f, r = r + String.fromCharCode(t), d !== 64 && (r = r + String.fromCharCode(a)), f !== 64 && (r = r + String.fromCharCode(l));
      while (m < e.length);
      return r;
    };
    function $t(e) {
      if (typeof N == "boolean" && N) {
        var n;
        try {
          n = Buffer.from(e, "base64");
        } catch {
          n = new Buffer(e, "base64");
        }
        return new Uint8Array(n.buffer, n.byteOffset, n.byteLength);
      }
      try {
        for (var r = Wt(e), t = new Uint8Array(r.length), a = 0; a < r.length; ++a)
          t[a] = r.charCodeAt(a);
        return t;
      } catch {
        throw new Error("Converting base64 string to bytes failed.");
      }
    }
    function Fe(e) {
      if (Tn(e))
        return $t(e.slice(Fn.length));
    }
    var br = {
      __cxa_allocate_exception: Gr,
      __cxa_atexit: Xr,
      __cxa_thread_atexit: Kr,
      __cxa_throw: Zr,
      __lock: Qr,
      __map_file: Jr,
      __syscall221: ei,
      __syscall3: ni,
      __syscall4: ri,
      __syscall5: ii,
      __syscall54: ti,
      __syscall91: oi,
      __unlock: li,
      _embind_finalize_value_array: di,
      _embind_finalize_value_object: fi,
      _embind_register_bool: mi,
      _embind_register_class: Bi,
      _embind_register_class_class_function: Ii,
      _embind_register_class_constructor: zi,
      _embind_register_class_function: Ui,
      _embind_register_class_property: ji,
      _embind_register_constant: Wi,
      _embind_register_emval: Hi,
      _embind_register_float: Gi,
      _embind_register_function: Xi,
      _embind_register_integer: Zi,
      _embind_register_memory_view: Qi,
      _embind_register_smart_ptr: Ji,
      _embind_register_std_string: et,
      _embind_register_std_wstring: nt,
      _embind_register_value_array: rt,
      _embind_register_value_array_element: it,
      _embind_register_value_object: tt,
      _embind_register_value_object_field: at,
      _embind_register_void: ot,
      _emval_as: lt,
      _emval_call_void_method: st,
      _emval_decref: zn,
      _emval_get_method_caller: ct,
      _emval_get_property: mt,
      _emval_incref: pt,
      _emval_new_array: yt,
      _emval_new_cstring: _t,
      _emval_run_destructors: vt,
      _emval_set_property: gt,
      _emval_take_value: ht,
      abort: wt,
      clock_gettime: Et,
      emscripten_get_sbrk_ptr: bt,
      emscripten_memcpy_big: St,
      emscripten_resize_heap: Dt,
      environ_get: Pt,
      environ_sizes_get: Ft,
      fd_close: Tt,
      fd_read: Rt,
      fd_seek: At,
      fd_write: Mt,
      memory: he,
      pthread_mutexattr_destroy: Lt,
      pthread_mutexattr_init: Ot,
      pthread_mutexattr_settype: xt,
      round: Nt,
      roundf: Bt,
      setTempRet0: It,
      strftime_l: Ut,
      sysconf: jt,
      table: Fr
    }, Sr = jr();
    i.asm = Sr;
    var Vt = i.___wasm_call_ctors = function() {
      return i.asm.__wasm_call_ctors.apply(null, arguments);
    }, Te = i._malloc = function() {
      return i.asm.malloc.apply(null, arguments);
    }, oe = i._free = function() {
      return i.asm.free.apply(null, arguments);
    };
    i.___errno_location = function() {
      return i.asm.__errno_location.apply(null, arguments);
    }, i._setThrew = function() {
      return i.asm.setThrew.apply(null, arguments);
    };
    var $n = i.__ZSt18uncaught_exceptionv = function() {
      return i.asm._ZSt18uncaught_exceptionv.apply(
        null,
        arguments
      );
    };
    i.___cxa_demangle = function() {
      return i.asm.__cxa_demangle.apply(null, arguments);
    };
    var qt = i.___getTypeName = function() {
      return i.asm.__getTypeName.apply(null, arguments);
    };
    i.___embind_register_native_and_builtin_types = function() {
      return i.asm.__embind_register_native_and_builtin_types.apply(
        null,
        arguments
      );
    }, i.stackSave = function() {
      return i.asm.stackSave.apply(null, arguments);
    }, i.stackAlloc = function() {
      return i.asm.stackAlloc.apply(null, arguments);
    }, i.stackRestore = function() {
      return i.asm.stackRestore.apply(null, arguments);
    }, i.__growWasmMemory = function() {
      return i.asm.__growWasmMemory.apply(null, arguments);
    }, i.dynCall_ii = function() {
      return i.asm.dynCall_ii.apply(null, arguments);
    }, i.dynCall_vi = function() {
      return i.asm.dynCall_vi.apply(null, arguments);
    }, i.dynCall_i = function() {
      return i.asm.dynCall_i.apply(null, arguments);
    }, i.dynCall_iii = function() {
      return i.asm.dynCall_iii.apply(null, arguments);
    }, i.dynCall_iiii = function() {
      return i.asm.dynCall_iiii.apply(null, arguments);
    }, i.dynCall_iiiii = function() {
      return i.asm.dynCall_iiiii.apply(null, arguments);
    }, i.dynCall_iiiiii = function() {
      return i.asm.dynCall_iiiiii.apply(null, arguments);
    }, i.dynCall_iiiiiii = function() {
      return i.asm.dynCall_iiiiiii.apply(null, arguments);
    }, i.dynCall_viii = function() {
      return i.asm.dynCall_viii.apply(null, arguments);
    }, i.dynCall_viiii = function() {
      return i.asm.dynCall_viiii.apply(null, arguments);
    }, i.dynCall_vii = function() {
      return i.asm.dynCall_vii.apply(null, arguments);
    }, i.dynCall_viiidd = function() {
      return i.asm.dynCall_viiidd.apply(null, arguments);
    }, i.dynCall_viiiidd = function() {
      return i.asm.dynCall_viiiidd.apply(null, arguments);
    }, i.dynCall_viiid = function() {
      return i.asm.dynCall_viiid.apply(null, arguments);
    }, i.dynCall_viiiid = function() {
      return i.asm.dynCall_viiiid.apply(null, arguments);
    }, i.dynCall_viiiii = function() {
      return i.asm.dynCall_viiiii.apply(null, arguments);
    }, i.dynCall_dii = function() {
      return i.asm.dynCall_dii.apply(null, arguments);
    }, i.dynCall_diii = function() {
      return i.asm.dynCall_diii.apply(null, arguments);
    }, i.dynCall_iiiid = function() {
      return i.asm.dynCall_iiiid.apply(null, arguments);
    }, i.dynCall_fiii = function() {
      return i.asm.dynCall_fiii.apply(null, arguments);
    }, i.dynCall_fiiii = function() {
      return i.asm.dynCall_fiiii.apply(null, arguments);
    }, i.dynCall_fiiiii = function() {
      return i.asm.dynCall_fiiiii.apply(null, arguments);
    }, i.dynCall_diiiii = function() {
      return i.asm.dynCall_diiiii.apply(null, arguments);
    }, i.dynCall_diiii = function() {
      return i.asm.dynCall_diiii.apply(null, arguments);
    }, i.dynCall_viid = function() {
      return i.asm.dynCall_viid.apply(null, arguments);
    }, i.dynCall_fii = function() {
      return i.asm.dynCall_fii.apply(null, arguments);
    }, i.dynCall_viif = function() {
      return i.asm.dynCall_viif.apply(null, arguments);
    }, i.dynCall_iiiiiiiiii = function() {
      return i.asm.dynCall_iiiiiiiiii.apply(null, arguments);
    }, i.dynCall_iiiiiiiii = function() {
      return i.asm.dynCall_iiiiiiiii.apply(null, arguments);
    }, i.dynCall_iiiiiiii = function() {
      return i.asm.dynCall_iiiiiiii.apply(null, arguments);
    }, i.dynCall_viiif = function() {
      return i.asm.dynCall_viiif.apply(null, arguments);
    }, i.dynCall_iiiif = function() {
      return i.asm.dynCall_iiiif.apply(null, arguments);
    }, i.dynCall_viiiddii = function() {
      return i.asm.dynCall_viiiddii.apply(null, arguments);
    }, i.dynCall_viiddii = function() {
      return i.asm.dynCall_viiddii.apply(null, arguments);
    }, i.dynCall_viiiddi = function() {
      return i.asm.dynCall_viiiddi.apply(null, arguments);
    }, i.dynCall_viiddi = function() {
      return i.asm.dynCall_viiddi.apply(null, arguments);
    }, i.dynCall_viidd = function() {
      return i.asm.dynCall_viidd.apply(null, arguments);
    }, i.dynCall_viiiiddi = function() {
      return i.asm.dynCall_viiiiddi.apply(null, arguments);
    }, i.dynCall_viiiiddddii = function() {
      return i.asm.dynCall_viiiiddddii.apply(null, arguments);
    }, i.dynCall_viiiddddii = function() {
      return i.asm.dynCall_viiiddddii.apply(null, arguments);
    }, i.dynCall_viiiiddddi = function() {
      return i.asm.dynCall_viiiiddddi.apply(null, arguments);
    }, i.dynCall_viiiddddi = function() {
      return i.asm.dynCall_viiiddddi.apply(null, arguments);
    }, i.dynCall_viiiidddd = function() {
      return i.asm.dynCall_viiiidddd.apply(null, arguments);
    }, i.dynCall_viiidddd = function() {
      return i.asm.dynCall_viiidddd.apply(null, arguments);
    }, i.dynCall_viiiiddd = function() {
      return i.asm.dynCall_viiiiddd.apply(null, arguments);
    }, i.dynCall_viiiddd = function() {
      return i.asm.dynCall_viiiddd.apply(null, arguments);
    }, i.dynCall_viiiddidddd = function() {
      return i.asm.dynCall_viiiddidddd.apply(null, arguments);
    }, i.dynCall_viiddidddd = function() {
      return i.asm.dynCall_viiddidddd.apply(null, arguments);
    }, i.dynCall_viiiddiddd = function() {
      return i.asm.dynCall_viiiddiddd.apply(null, arguments);
    }, i.dynCall_viiddiddd = function() {
      return i.asm.dynCall_viiddiddd.apply(null, arguments);
    }, i.dynCall_viiiddidd = function() {
      return i.asm.dynCall_viiiddidd.apply(null, arguments);
    }, i.dynCall_viiddidd = function() {
      return i.asm.dynCall_viiddidd.apply(null, arguments);
    }, i.dynCall_viiiddid = function() {
      return i.asm.dynCall_viiiddid.apply(null, arguments);
    }, i.dynCall_viiddid = function() {
      return i.asm.dynCall_viiddid.apply(null, arguments);
    }, i.dynCall_viiiiiddi = function() {
      return i.asm.dynCall_viiiiiddi.apply(null, arguments);
    }, i.dynCall_viiiiidd = function() {
      return i.asm.dynCall_viiiiidd.apply(null, arguments);
    }, i.dynCall_viiiiid = function() {
      return i.asm.dynCall_viiiiid.apply(null, arguments);
    }, i.dynCall_viiiiiiddi = function() {
      return i.asm.dynCall_viiiiiiddi.apply(null, arguments);
    }, i.dynCall_viiiiiidd = function() {
      return i.asm.dynCall_viiiiiidd.apply(null, arguments);
    }, i.dynCall_viiiiiid = function() {
      return i.asm.dynCall_viiiiiid.apply(null, arguments);
    }, i.dynCall_viiiiii = function() {
      return i.asm.dynCall_viiiiii.apply(null, arguments);
    }, i.dynCall_viiiiiiiddi = function() {
      return i.asm.dynCall_viiiiiiiddi.apply(null, arguments);
    }, i.dynCall_viiiiiiidd = function() {
      return i.asm.dynCall_viiiiiiidd.apply(null, arguments);
    }, i.dynCall_viiiiiiid = function() {
      return i.asm.dynCall_viiiiiiid.apply(null, arguments);
    }, i.dynCall_viiiiiii = function() {
      return i.asm.dynCall_viiiiiii.apply(null, arguments);
    }, i.dynCall_viiidiiid = function() {
      return i.asm.dynCall_viiidiiid.apply(null, arguments);
    }, i.dynCall_viidiiid = function() {
      return i.asm.dynCall_viidiiid.apply(null, arguments);
    }, i.dynCall_viididdii = function() {
      return i.asm.dynCall_viididdii.apply(null, arguments);
    }, i.dynCall_vididdii = function() {
      return i.asm.dynCall_vididdii.apply(null, arguments);
    }, i.dynCall_viididdi = function() {
      return i.asm.dynCall_viididdi.apply(null, arguments);
    }, i.dynCall_vididdi = function() {
      return i.asm.dynCall_vididdi.apply(null, arguments);
    }, i.dynCall_viiidi = function() {
      return i.asm.dynCall_viiidi.apply(null, arguments);
    }, i.dynCall_viidi = function() {
      return i.asm.dynCall_viidi.apply(null, arguments);
    }, i.dynCall_viiiiiiii = function() {
      return i.asm.dynCall_viiiiiiii.apply(null, arguments);
    }, i.dynCall_viiiidiiiidi = function() {
      return i.asm.dynCall_viiiidiiiidi.apply(null, arguments);
    }, i.dynCall_viiidiiiidi = function() {
      return i.asm.dynCall_viiidiiiidi.apply(null, arguments);
    }, i.dynCall_viiiiiiiiiiid = function() {
      return i.asm.dynCall_viiiiiiiiiiid.apply(null, arguments);
    }, i.dynCall_viiiiiiiiiid = function() {
      return i.asm.dynCall_viiiiiiiiiid.apply(null, arguments);
    }, i.dynCall_viiiiiiiiiii = function() {
      return i.asm.dynCall_viiiiiiiiiii.apply(null, arguments);
    }, i.dynCall_viiiiiiiiii = function() {
      return i.asm.dynCall_viiiiiiiiii.apply(null, arguments);
    }, i.dynCall_viiiiiiiii = function() {
      return i.asm.dynCall_viiiiiiiii.apply(null, arguments);
    }, i.dynCall_diiiiiiiiiiiii = function() {
      return i.asm.dynCall_diiiiiiiiiiiii.apply(null, arguments);
    }, i.dynCall_diiiiiiiiiiii = function() {
      return i.asm.dynCall_diiiiiiiiiiii.apply(null, arguments);
    }, i.dynCall_diiiiiiiiiii = function() {
      return i.asm.dynCall_diiiiiiiiiii.apply(null, arguments);
    }, i.dynCall_diiiiiiiiii = function() {
      return i.asm.dynCall_diiiiiiiiii.apply(null, arguments);
    }, i.dynCall_di = function() {
      return i.asm.dynCall_di.apply(null, arguments);
    }, i.dynCall_viiiiidi = function() {
      return i.asm.dynCall_viiiiidi.apply(null, arguments);
    }, i.dynCall_viiiidi = function() {
      return i.asm.dynCall_viiiidi.apply(null, arguments);
    }, i.dynCall_vidiii = function() {
      return i.asm.dynCall_vidiii.apply(null, arguments);
    }, i.dynCall_vdiii = function() {
      return i.asm.dynCall_vdiii.apply(null, arguments);
    }, i.dynCall_vidii = function() {
      return i.asm.dynCall_vidii.apply(null, arguments);
    }, i.dynCall_vdii = function() {
      return i.asm.dynCall_vdii.apply(null, arguments);
    }, i.dynCall_viiiiiifi = function() {
      return i.asm.dynCall_viiiiiifi.apply(null, arguments);
    }, i.dynCall_viiiiifi = function() {
      return i.asm.dynCall_viiiiifi.apply(null, arguments);
    }, i.dynCall_viiiiiif = function() {
      return i.asm.dynCall_viiiiiif.apply(null, arguments);
    }, i.dynCall_viiiiif = function() {
      return i.asm.dynCall_viiiiif.apply(null, arguments);
    }, i.dynCall_viiiiiiiiiiii = function() {
      return i.asm.dynCall_viiiiiiiiiiii.apply(null, arguments);
    }, i.dynCall_viiiidddiiii = function() {
      return i.asm.dynCall_viiiidddiiii.apply(null, arguments);
    }, i.dynCall_viiidddiiii = function() {
      return i.asm.dynCall_viiidddiiii.apply(null, arguments);
    }, i.dynCall_viiiidddiii = function() {
      return i.asm.dynCall_viiiidddiii.apply(null, arguments);
    }, i.dynCall_viiidddiii = function() {
      return i.asm.dynCall_viiidddiii.apply(null, arguments);
    }, i.dynCall_viiiidddii = function() {
      return i.asm.dynCall_viiiidddii.apply(null, arguments);
    }, i.dynCall_viiidddii = function() {
      return i.asm.dynCall_viiidddii.apply(null, arguments);
    }, i.dynCall_viiiidddi = function() {
      return i.asm.dynCall_viiiidddi.apply(null, arguments);
    }, i.dynCall_viiidddi = function() {
      return i.asm.dynCall_viiidddi.apply(null, arguments);
    }, i.dynCall_iiiiiididi = function() {
      return i.asm.dynCall_iiiiiididi.apply(null, arguments);
    }, i.dynCall_viiiiididi = function() {
      return i.asm.dynCall_viiiiididi.apply(null, arguments);
    }, i.dynCall_iiiiiidid = function() {
      return i.asm.dynCall_iiiiiidid.apply(null, arguments);
    }, i.dynCall_viiiiidid = function() {
      return i.asm.dynCall_viiiiidid.apply(null, arguments);
    }, i.dynCall_iiiiiidi = function() {
      return i.asm.dynCall_iiiiiidi.apply(null, arguments);
    }, i.dynCall_iiiiiid = function() {
      return i.asm.dynCall_iiiiiid.apply(null, arguments);
    }, i.dynCall_viiiiiidi = function() {
      return i.asm.dynCall_viiiiiidi.apply(null, arguments);
    }, i.dynCall_iiiiidiid = function() {
      return i.asm.dynCall_iiiiidiid.apply(null, arguments);
    }, i.dynCall_viiiidiid = function() {
      return i.asm.dynCall_viiiidiid.apply(null, arguments);
    }, i.dynCall_iiiiidii = function() {
      return i.asm.dynCall_iiiiidii.apply(null, arguments);
    }, i.dynCall_viiiidii = function() {
      return i.asm.dynCall_viiiidii.apply(null, arguments);
    }, i.dynCall_iiiiidi = function() {
      return i.asm.dynCall_iiiiidi.apply(null, arguments);
    }, i.dynCall_iiiiid = function() {
      return i.asm.dynCall_iiiiid.apply(null, arguments);
    }, i.dynCall_diiiiiiii = function() {
      return i.asm.dynCall_diiiiiiii.apply(null, arguments);
    }, i.dynCall_diiiiiii = function() {
      return i.asm.dynCall_diiiiiii.apply(null, arguments);
    }, i.dynCall_diiiiii = function() {
      return i.asm.dynCall_diiiiii.apply(null, arguments);
    }, i.dynCall_viiididii = function() {
      return i.asm.dynCall_viiididii.apply(null, arguments);
    }, i.dynCall_viididii = function() {
      return i.asm.dynCall_viididii.apply(null, arguments);
    }, i.dynCall_viiididi = function() {
      return i.asm.dynCall_viiididi.apply(null, arguments);
    }, i.dynCall_viididi = function() {
      return i.asm.dynCall_viididi.apply(null, arguments);
    }, i.dynCall_iiidd = function() {
      return i.asm.dynCall_iiidd.apply(null, arguments);
    }, i.dynCall_viiiiddiiid = function() {
      return i.asm.dynCall_viiiiddiiid.apply(null, arguments);
    }, i.dynCall_viiiddiiid = function() {
      return i.asm.dynCall_viiiddiiid.apply(null, arguments);
    }, i.dynCall_viiiiddiii = function() {
      return i.asm.dynCall_viiiiddiii.apply(null, arguments);
    }, i.dynCall_viiiddiii = function() {
      return i.asm.dynCall_viiiddiii.apply(null, arguments);
    }, i.dynCall_viiiiddii = function() {
      return i.asm.dynCall_viiiiddii.apply(null, arguments);
    }, i.dynCall_viiiiddiiiid = function() {
      return i.asm.dynCall_viiiiddiiiid.apply(null, arguments);
    }, i.dynCall_viiiddiiiid = function() {
      return i.asm.dynCall_viiiddiiiid.apply(null, arguments);
    }, i.dynCall_viiiiddiiii = function() {
      return i.asm.dynCall_viiiiddiiii.apply(null, arguments);
    }, i.dynCall_viiiddiiii = function() {
      return i.asm.dynCall_viiiddiiii.apply(null, arguments);
    }, i.dynCall_diiiid = function() {
      return i.asm.dynCall_diiiid.apply(null, arguments);
    }, i.dynCall_diiid = function() {
      return i.asm.dynCall_diiid.apply(null, arguments);
    }, i.dynCall_viiddiii = function() {
      return i.asm.dynCall_viiddiii.apply(null, arguments);
    }, i.dynCall_vidi = function() {
      return i.asm.dynCall_vidi.apply(null, arguments);
    }, i.dynCall_viiiiiiiid = function() {
      return i.asm.dynCall_viiiiiiiid.apply(null, arguments);
    }, i.dynCall_viiiiidiiii = function() {
      return i.asm.dynCall_viiiiidiiii.apply(null, arguments);
    }, i.dynCall_viiiidiiii = function() {
      return i.asm.dynCall_viiiidiiii.apply(null, arguments);
    }, i.dynCall_viiiiidiii = function() {
      return i.asm.dynCall_viiiiidiii.apply(null, arguments);
    }, i.dynCall_viiiidiii = function() {
      return i.asm.dynCall_viiiidiii.apply(null, arguments);
    }, i.dynCall_viiiiidii = function() {
      return i.asm.dynCall_viiiiidii.apply(null, arguments);
    }, i.dynCall_iiiiiiiiiii = function() {
      return i.asm.dynCall_iiiiiiiiiii.apply(null, arguments);
    }, i.dynCall_viiiiiiidi = function() {
      return i.asm.dynCall_viiiiiiidi.apply(null, arguments);
    }, i.dynCall_iiiiiiiiiifdii = function() {
      return i.asm.dynCall_iiiiiiiiiifdii.apply(null, arguments);
    }, i.dynCall_iiiiiiiiifdii = function() {
      return i.asm.dynCall_iiiiiiiiifdii.apply(null, arguments);
    }, i.dynCall_iiiiiiiiiifdi = function() {
      return i.asm.dynCall_iiiiiiiiiifdi.apply(null, arguments);
    }, i.dynCall_iiiiiiiiifdi = function() {
      return i.asm.dynCall_iiiiiiiiifdi.apply(null, arguments);
    }, i.dynCall_iiiiiiiiiifd = function() {
      return i.asm.dynCall_iiiiiiiiiifd.apply(null, arguments);
    }, i.dynCall_iiiiiiiiifd = function() {
      return i.asm.dynCall_iiiiiiiiifd.apply(null, arguments);
    }, i.dynCall_iiiiiiiiiif = function() {
      return i.asm.dynCall_iiiiiiiiiif.apply(null, arguments);
    }, i.dynCall_iiiiiiiiif = function() {
      return i.asm.dynCall_iiiiiiiiif.apply(null, arguments);
    }, i.dynCall_diiiddi = function() {
      return i.asm.dynCall_diiiddi.apply(null, arguments);
    }, i.dynCall_diiddi = function() {
      return i.asm.dynCall_diiddi.apply(null, arguments);
    }, i.dynCall_iiidiiiii = function() {
      return i.asm.dynCall_iiidiiiii.apply(null, arguments);
    }, i.dynCall_viidiiiii = function() {
      return i.asm.dynCall_viidiiiii.apply(null, arguments);
    }, i.dynCall_iiidiiii = function() {
      return i.asm.dynCall_iiidiiii.apply(null, arguments);
    }, i.dynCall_viidiiii = function() {
      return i.asm.dynCall_viidiiii.apply(null, arguments);
    }, i.dynCall_iiidiii = function() {
      return i.asm.dynCall_iiidiii.apply(null, arguments);
    }, i.dynCall_viidiii = function() {
      return i.asm.dynCall_viidiii.apply(null, arguments);
    }, i.dynCall_iiidii = function() {
      return i.asm.dynCall_iiidii.apply(null, arguments);
    }, i.dynCall_viidii = function() {
      return i.asm.dynCall_viidii.apply(null, arguments);
    }, i.dynCall_iiidi = function() {
      return i.asm.dynCall_iiidi.apply(null, arguments);
    }, i.dynCall_iiid = function() {
      return i.asm.dynCall_iiid.apply(null, arguments);
    }, i.dynCall_iiiiifiiii = function() {
      return i.asm.dynCall_iiiiifiiii.apply(null, arguments);
    }, i.dynCall_viiiifiiii = function() {
      return i.asm.dynCall_viiiifiiii.apply(null, arguments);
    }, i.dynCall_iiiiifiii = function() {
      return i.asm.dynCall_iiiiifiii.apply(null, arguments);
    }, i.dynCall_viiiifiii = function() {
      return i.asm.dynCall_viiiifiii.apply(null, arguments);
    }, i.dynCall_iiiiifii = function() {
      return i.asm.dynCall_iiiiifii.apply(null, arguments);
    }, i.dynCall_viiiifii = function() {
      return i.asm.dynCall_viiiifii.apply(null, arguments);
    }, i.dynCall_iiiiifi = function() {
      return i.asm.dynCall_iiiiifi.apply(null, arguments);
    }, i.dynCall_viiiifi = function() {
      return i.asm.dynCall_viiiifi.apply(null, arguments);
    }, i.dynCall_iiiiif = function() {
      return i.asm.dynCall_iiiiif.apply(null, arguments);
    }, i.dynCall_viiiif = function() {
      return i.asm.dynCall_viiiif.apply(null, arguments);
    }, i.dynCall_vid = function() {
      return i.asm.dynCall_vid.apply(null, arguments);
    }, i.dynCall_iiiiffi = function() {
      return i.asm.dynCall_iiiiffi.apply(null, arguments);
    }, i.dynCall_viiiffi = function() {
      return i.asm.dynCall_viiiffi.apply(null, arguments);
    }, i.dynCall_iiiiff = function() {
      return i.asm.dynCall_iiiiff.apply(null, arguments);
    }, i.dynCall_viiiff = function() {
      return i.asm.dynCall_viiiff.apply(null, arguments);
    }, i.dynCall_iiiiiiffi = function() {
      return i.asm.dynCall_iiiiiiffi.apply(null, arguments);
    }, i.dynCall_viiiiiffi = function() {
      return i.asm.dynCall_viiiiiffi.apply(null, arguments);
    }, i.dynCall_iiiiiiff = function() {
      return i.asm.dynCall_iiiiiiff.apply(null, arguments);
    }, i.dynCall_viiiiiff = function() {
      return i.asm.dynCall_viiiiiff.apply(null, arguments);
    }, i.dynCall_iidi = function() {
      return i.asm.dynCall_iidi.apply(null, arguments);
    }, i.dynCall_iid = function() {
      return i.asm.dynCall_iid.apply(null, arguments);
    }, i.dynCall_iiifi = function() {
      return i.asm.dynCall_iiifi.apply(null, arguments);
    }, i.dynCall_viifi = function() {
      return i.asm.dynCall_viifi.apply(null, arguments);
    }, i.dynCall_iiif = function() {
      return i.asm.dynCall_iiif.apply(null, arguments);
    }, i.dynCall_vif = function() {
      return i.asm.dynCall_vif.apply(null, arguments);
    }, i.dynCall_viiiiifii = function() {
      return i.asm.dynCall_viiiiifii.apply(null, arguments);
    }, i.dynCall_viiifii = function() {
      return i.asm.dynCall_viiifii.apply(null, arguments);
    }, i.dynCall_viiifi = function() {
      return i.asm.dynCall_viiifi.apply(null, arguments);
    }, i.dynCall_iiiiiffiii = function() {
      return i.asm.dynCall_iiiiiffiii.apply(null, arguments);
    }, i.dynCall_viiiiffiii = function() {
      return i.asm.dynCall_viiiiffiii.apply(null, arguments);
    }, i.dynCall_iiiiiffii = function() {
      return i.asm.dynCall_iiiiiffii.apply(null, arguments);
    }, i.dynCall_viiiiffii = function() {
      return i.asm.dynCall_viiiiffii.apply(null, arguments);
    }, i.dynCall_iiiiiffi = function() {
      return i.asm.dynCall_iiiiiffi.apply(null, arguments);
    }, i.dynCall_viiiiffi = function() {
      return i.asm.dynCall_viiiiffi.apply(null, arguments);
    }, i.dynCall_iiiiiff = function() {
      return i.asm.dynCall_iiiiiff.apply(null, arguments);
    }, i.dynCall_viiiiff = function() {
      return i.asm.dynCall_viiiiff.apply(null, arguments);
    }, i.dynCall_iiiiiiffiii = function() {
      return i.asm.dynCall_iiiiiiffiii.apply(null, arguments);
    }, i.dynCall_viiiiiffiii = function() {
      return i.asm.dynCall_viiiiiffiii.apply(null, arguments);
    }, i.dynCall_iiiddiid = function() {
      return i.asm.dynCall_iiiddiid.apply(null, arguments);
    }, i.dynCall_viiddiid = function() {
      return i.asm.dynCall_viiddiid.apply(null, arguments);
    }, i.dynCall_iiiddii = function() {
      return i.asm.dynCall_iiiddii.apply(null, arguments);
    }, i.dynCall_iiiddi = function() {
      return i.asm.dynCall_iiiddi.apply(null, arguments);
    }, i.dynCall_iiiddiiid = function() {
      return i.asm.dynCall_iiiddiiid.apply(null, arguments);
    }, i.dynCall_viiddiiid = function() {
      return i.asm.dynCall_viiddiiid.apply(null, arguments);
    }, i.dynCall_iiiifiii = function() {
      return i.asm.dynCall_iiiifiii.apply(null, arguments);
    }, i.dynCall_viiifiii = function() {
      return i.asm.dynCall_viiifiii.apply(null, arguments);
    }, i.dynCall_iiiifii = function() {
      return i.asm.dynCall_iiiifii.apply(null, arguments);
    }, i.dynCall_iiiifi = function() {
      return i.asm.dynCall_iiiifi.apply(null, arguments);
    }, i.dynCall_iiiiiddiddi = function() {
      return i.asm.dynCall_iiiiiddiddi.apply(null, arguments);
    }, i.dynCall_viiiiddiddi = function() {
      return i.asm.dynCall_viiiiddiddi.apply(null, arguments);
    }, i.dynCall_iiiiiddidd = function() {
      return i.asm.dynCall_iiiiiddidd.apply(null, arguments);
    }, i.dynCall_viiiiddidd = function() {
      return i.asm.dynCall_viiiiddidd.apply(null, arguments);
    }, i.dynCall_iiiiiddid = function() {
      return i.asm.dynCall_iiiiiddid.apply(null, arguments);
    }, i.dynCall_viiiiddid = function() {
      return i.asm.dynCall_viiiiddid.apply(null, arguments);
    }, i.dynCall_iiiiiddi = function() {
      return i.asm.dynCall_iiiiiddi.apply(null, arguments);
    }, i.dynCall_iiiiidd = function() {
      return i.asm.dynCall_iiiiidd.apply(null, arguments);
    }, i.dynCall_iifff = function() {
      return i.asm.dynCall_iifff.apply(null, arguments);
    }, i.dynCall_vifff = function() {
      return i.asm.dynCall_vifff.apply(null, arguments);
    }, i.dynCall_iiff = function() {
      return i.asm.dynCall_iiff.apply(null, arguments);
    }, i.dynCall_viff = function() {
      return i.asm.dynCall_viff.apply(null, arguments);
    }, i.dynCall_iif = function() {
      return i.asm.dynCall_iif.apply(null, arguments);
    }, i.dynCall_iiifiiiiiii = function() {
      return i.asm.dynCall_iiifiiiiiii.apply(null, arguments);
    }, i.dynCall_viifiiiiiii = function() {
      return i.asm.dynCall_viifiiiiiii.apply(null, arguments);
    }, i.dynCall_iiifiiiiii = function() {
      return i.asm.dynCall_iiifiiiiii.apply(null, arguments);
    }, i.dynCall_viifiiiiii = function() {
      return i.asm.dynCall_viifiiiiii.apply(null, arguments);
    }, i.dynCall_iiifiiiii = function() {
      return i.asm.dynCall_iiifiiiii.apply(null, arguments);
    }, i.dynCall_viifiiiii = function() {
      return i.asm.dynCall_viifiiiii.apply(null, arguments);
    }, i.dynCall_iiifiiii = function() {
      return i.asm.dynCall_iiifiiii.apply(null, arguments);
    }, i.dynCall_viifiiii = function() {
      return i.asm.dynCall_viifiiii.apply(null, arguments);
    }, i.dynCall_iiifiii = function() {
      return i.asm.dynCall_iiifiii.apply(null, arguments);
    }, i.dynCall_viifiii = function() {
      return i.asm.dynCall_viifiii.apply(null, arguments);
    }, i.dynCall_iiifii = function() {
      return i.asm.dynCall_iiifii.apply(null, arguments);
    }, i.dynCall_viifii = function() {
      return i.asm.dynCall_viifii.apply(null, arguments);
    }, i.dynCall_iiffff = function() {
      return i.asm.dynCall_iiffff.apply(null, arguments);
    }, i.dynCall_viffff = function() {
      return i.asm.dynCall_viffff.apply(null, arguments);
    }, i.dynCall_iiiffii = function() {
      return i.asm.dynCall_iiiffii.apply(null, arguments);
    }, i.dynCall_fi = function() {
      return i.asm.dynCall_fi.apply(null, arguments);
    }, i.dynCall_iiffi = function() {
      return i.asm.dynCall_iiffi.apply(null, arguments);
    }, i.dynCall_viifff = function() {
      return i.asm.dynCall_viifff.apply(null, arguments);
    }, i.dynCall_iiifff = function() {
      return i.asm.dynCall_iiifff.apply(null, arguments);
    }, i.dynCall_viijii = function() {
      return i.asm.dynCall_viijii.apply(null, arguments);
    }, i.dynCall_ji = function() {
      return i.asm.dynCall_ji.apply(null, arguments);
    }, i.dynCall_viiiiiiiiiiddi = function() {
      return i.asm.dynCall_viiiiiiiiiiddi.apply(null, arguments);
    }, i.dynCall_v = function() {
      return i.asm.dynCall_v.apply(null, arguments);
    }, i.dynCall_viiiiiiiiidd = function() {
      return i.asm.dynCall_viiiiiiiiidd.apply(null, arguments);
    }, i.dynCall_jiii = function() {
      return i.asm.dynCall_jiii.apply(null, arguments);
    }, i.dynCall_vifi = function() {
      return i.asm.dynCall_vifi.apply(null, arguments);
    }, i.dynCall_vij = function() {
      return i.asm.dynCall_vij.apply(null, arguments);
    }, i.dynCall_iiiiiifiididiii = function() {
      return i.asm.dynCall_iiiiiifiididiii.apply(null, arguments);
    }, i.dynCall_vidddddi = function() {
      return i.asm.dynCall_vidddddi.apply(null, arguments);
    }, i.dynCall_vidd = function() {
      return i.asm.dynCall_vidd.apply(null, arguments);
    }, i.dynCall_vidddd = function() {
      return i.asm.dynCall_vidddd.apply(null, arguments);
    }, i.dynCall_jii = function() {
      return i.asm.dynCall_jii.apply(null, arguments);
    }, i.dynCall_viji = function() {
      return i.asm.dynCall_viji.apply(null, arguments);
    }, i.dynCall_jiji = function() {
      return i.asm.dynCall_jiji.apply(null, arguments);
    }, i.dynCall_iidiiii = function() {
      return i.asm.dynCall_iidiiii.apply(null, arguments);
    }, i.dynCall_iiiiij = function() {
      return i.asm.dynCall_iiiiij.apply(null, arguments);
    }, i.dynCall_iiiiijj = function() {
      return i.asm.dynCall_iiiiijj.apply(null, arguments);
    }, i.dynCall_iiiiiijj = function() {
      return i.asm.dynCall_iiiiiijj.apply(null, arguments);
    }, i.asm = Sr, i.getMemory = Tr, i.addRunDependency = tn, i.removeRunDependency = Xe, i.FS_createFolder = o.createFolder, i.FS_createPath = o.createPath, i.FS_createDataFile = o.createDataFile, i.FS_createPreloadedFile = o.createPreloadedFile, i.FS_createLazyFile = o.createLazyFile, i.FS_createLink = o.createLink, i.FS_createDevice = o.createDevice, i.FS_unlink = o.unlink, i.calledRun = Ne;
    var Ne;
    i.then = function(e) {
      if (Ne)
        e(i);
      else {
        var n = i.onRuntimeInitialized;
        i.onRuntimeInitialized = function() {
          n && n(), e(i);
        };
      }
      return i;
    };
    function kr(e) {
      this.name = "ExitStatus", this.message = "Program terminated with exit(" + e + ")", this.status = e;
    }
    Ge = function e() {
      Ne || Vn(), Ne || (Ge = e);
    };
    function Vn(e) {
      if (we > 0 || (Or(), we > 0)) return;
      function n() {
        Ne || (Ne = !0, i.calledRun = !0, !_e && (xr(), Nr(), i.onRuntimeInitialized && i.onRuntimeInitialized(), Br()));
      }
      i.setStatus ? (i.setStatus("Running..."), setTimeout(function() {
        setTimeout(function() {
          i.setStatus("");
        }, 1), n();
      }, 1)) : n();
    }
    if (i.run = Vn, i.preInit)
      for (typeof i.preInit == "function" && (i.preInit = [i.preInit]); i.preInit.length > 0; )
        i.preInit.pop()();
    if (Vn(), typeof i.FS > "u" && typeof o < "u" && (i.FS = o), typeof y > "u")
      var y = i;
    i.imread = function(e) {
      var n = null;
      typeof e == "string" ? n = document.getElementById(e) : n = e;
      var r = null, t = null;
      if (n instanceof HTMLImageElement)
        r = document.createElement("canvas"), r.width = n.width, r.height = n.height, t = r.getContext("2d", { willReadFrequently: !0 }), t.drawImage(n, 0, 0, n.width, n.height);
      else if (n instanceof HTMLCanvasElement || n instanceof OffscreenCanvas)
        r = n, t = r.getContext("2d");
      else
        throw new Error("Please input the valid canvas or img id.");
      var a = t.getImageData(0, 0, r.width, r.height);
      return y.matFromImageData(a);
    }, i.imshow = function(e, n) {
      var r = null;
      if (typeof e == "string" ? r = document.getElementById(e) : r = e, !(r instanceof HTMLCanvasElement))
        throw new Error("Please input the valid canvas element or id.");
      if (!(n instanceof y.Mat))
        throw new Error("Please input the valid cv.Mat instance.");
      var t = new y.Mat(), a = n.type() % 8, l = a <= y.CV_8S ? 1 : a <= y.CV_32S ? 1 / 256 : 255, u = a === y.CV_8S || a === y.CV_16S ? 128 : 0;
      switch (n.convertTo(t, y.CV_8U, l, u), t.type()) {
        case y.CV_8UC1:
          y.cvtColor(t, t, y.COLOR_GRAY2RGBA);
          break;
        case y.CV_8UC3:
          y.cvtColor(t, t, y.COLOR_RGB2RGBA);
          break;
        case y.CV_8UC4:
          break;
        default:
          throw new Error(
            "Bad number of channels (Source image must have 1, 3 or 4 channels)"
          );
      }
      var s = new ImageData(
        new Uint8ClampedArray(t.data),
        t.cols,
        t.rows
      ), d = r.getContext("2d");
      d.clearRect(0, 0, r.width, r.height), r.width = s.width, r.height = s.height, d.putImageData(s, 0, 0), t.delete();
    }, i.VideoCapture = function(e) {
      var n = null;
      if (typeof e == "string" ? n = document.getElementById(e) : n = e, !(n instanceof HTMLVideoElement))
        throw new Error("Please input the valid video element or id.");
      var r = document.createElement("canvas");
      r.width = n.width, r.height = n.height;
      var t = r.getContext("2d");
      this.video = n, this.read = function(a) {
        if (!(a instanceof y.Mat))
          throw new Error("Please input the valid cv.Mat instance.");
        if (a.type() !== y.CV_8UC4)
          throw new Error(
            "Bad type of input mat: the type should be cv.CV_8UC4."
          );
        if (a.cols !== n.width || a.rows !== n.height)
          throw new Error(
            "Bad size of input mat: the size should be same as the video."
          );
        t.drawImage(n, 0, 0, n.width, n.height), a.data.set(t.getImageData(0, 0, n.width, n.height).data);
      };
    };
    function Ht(e, n) {
      this.start = typeof e > "u" ? 0 : e, this.end = typeof n > "u" ? 0 : n;
    }
    i.Range = Ht;
    function gn(e, n) {
      this.x = typeof e > "u" ? 0 : e, this.y = typeof n > "u" ? 0 : n;
    }
    i.Point = gn;
    function Yt(e, n) {
      this.width = typeof e > "u" ? 0 : e, this.height = typeof n > "u" ? 0 : n;
    }
    i.Size = Yt;
    function Gt() {
      switch (arguments.length) {
        case 0: {
          this.x = 0, this.y = 0, this.width = 0, this.height = 0;
          break;
        }
        case 1: {
          var e = arguments[0];
          this.x = e.x, this.y = e.y, this.width = e.width, this.height = e.height;
          break;
        }
        case 2: {
          var n = arguments[0], r = arguments[1];
          this.x = n.x, this.y = n.y, this.width = r.width, this.height = r.height;
          break;
        }
        case 4: {
          this.x = arguments[0], this.y = arguments[1], this.width = arguments[2], this.height = arguments[3];
          break;
        }
        default:
          throw new Error("Invalid arguments");
      }
    }
    i.Rect = Gt;
    function hn() {
      switch (arguments.length) {
        case 0: {
          this.center = { x: 0, y: 0 }, this.size = { width: 0, height: 0 }, this.angle = 0;
          break;
        }
        case 3: {
          this.center = arguments[0], this.size = arguments[1], this.angle = arguments[2];
          break;
        }
        default:
          throw new Error("Invalid arguments");
      }
    }
    hn.points = function(e) {
      return i.rotatedRectPoints(e);
    }, hn.boundingRect = function(e) {
      return i.rotatedRectBoundingRect(e);
    }, hn.boundingRect2f = function(e) {
      return i.rotatedRectBoundingRect2f(e);
    }, i.RotatedRect = hn;
    function wn(e, n, r, t) {
      this.push(typeof e > "u" ? 0 : e), this.push(typeof n > "u" ? 0 : n), this.push(typeof r > "u" ? 0 : r), this.push(typeof t > "u" ? 0 : t);
    }
    wn.prototype = new Array(), wn.all = function(e) {
      return new wn(e, e, e, e);
    }, i.Scalar = wn;
    function Xt() {
      switch (arguments.length) {
        case 0: {
          this.minVal = 0, this.maxVal = 0, this.minLoc = new gn(), this.maxLoc = new gn();
          break;
        }
        case 4: {
          this.minVal = arguments[0], this.maxVal = arguments[1], this.minLoc = arguments[2], this.maxLoc = arguments[3];
          break;
        }
        default:
          throw new Error("Invalid arguments");
      }
    }
    i.MinMaxLoc = Xt;
    function Kt() {
      switch (arguments.length) {
        case 0: {
          this.center = new gn(), this.radius = 0;
          break;
        }
        case 2: {
          this.center = arguments[0], this.radius = arguments[1];
          break;
        }
        default:
          throw new Error("Invalid arguments");
      }
    }
    i.Circle = Kt;
    function Zt() {
      switch (arguments.length) {
        case 0: {
          this.type = 0, this.maxCount = 0, this.epsilon = 0;
          break;
        }
        case 3: {
          this.type = arguments[0], this.maxCount = arguments[1], this.epsilon = arguments[2];
          break;
        }
        default:
          throw new Error("Invalid arguments");
      }
    }
    return i.TermCriteria = Zt, i.matFromArray = function(e, n, r, t) {
      var a = new y.Mat(e, n, r);
      switch (r) {
        case y.CV_8U:
        case y.CV_8UC1:
        case y.CV_8UC2:
        case y.CV_8UC3:
        case y.CV_8UC4: {
          a.data.set(t);
          break;
        }
        case y.CV_8S:
        case y.CV_8SC1:
        case y.CV_8SC2:
        case y.CV_8SC3:
        case y.CV_8SC4: {
          a.data8S.set(t);
          break;
        }
        case y.CV_16U:
        case y.CV_16UC1:
        case y.CV_16UC2:
        case y.CV_16UC3:
        case y.CV_16UC4: {
          a.data16U.set(t);
          break;
        }
        case y.CV_16S:
        case y.CV_16SC1:
        case y.CV_16SC2:
        case y.CV_16SC3:
        case y.CV_16SC4: {
          a.data16S.set(t);
          break;
        }
        case y.CV_32S:
        case y.CV_32SC1:
        case y.CV_32SC2:
        case y.CV_32SC3:
        case y.CV_32SC4: {
          a.data32S.set(t);
          break;
        }
        case y.CV_32F:
        case y.CV_32FC1:
        case y.CV_32FC2:
        case y.CV_32FC3:
        case y.CV_32FC4: {
          a.data32F.set(t);
          break;
        }
        case y.CV_64F:
        case y.CV_64FC1:
        case y.CV_64FC2:
        case y.CV_64FC3:
        case y.CV_64FC4: {
          a.data64F.set(t);
          break;
        }
        default:
          throw new Error("Type is unsupported");
      }
      return a;
    }, i.matFromImageData = function(e) {
      var n = new y.Mat(e.height, e.width, y.CV_8UC4);
      return n.data.set(e.data), n;
    }, y;
  };
}()();
class Dr {
  /**
   * create a base model.
   * @param modelURL model URL
   * @param sessionOption onnxruntime session options
   * @param init init function
   * @param preProcess preprocess function
   * @param postProcess postprocess function
   * @returns base model object
   */
  constructor(y, i, T, k, C) {
    this.promises = Promise.all([
      Be.InferenceSession.create(y, i).then((R) => this.session = R)
    ]), typeof T < "u" && T(this), typeof k < "u" && (this.preProcess = k), typeof C < "u" && (this.postProcess = C);
  }
  /**
   * base model infer function.
   * @param args model infer paramters
   * @returns model infer results
   */
  async infer(...y) {
    await this.promises, console.time("Infer"), console.time("Infer.Preprocess");
    let i = this.preProcess(...y);
    console.timeEnd("Infer.Preprocess"), console.time("Infer.Run");
    let T = await this.session.run(i);
    console.timeEnd("Infer.Run"), console.time("Infer.Postprocess");
    let k = this.postProcess(T, ...y);
    return console.timeEnd("Infer.Postprocess"), console.timeEnd("Infer"), k;
  }
}
class Cn extends Dr {
  /**
   * create a base CV model.
   * @param modelURL model URL
   * @param inferConfig model infer config URL
   * @param sessionOption onnxruntime session options
   * @param getFeeds get infer session feeds function
   * @param postProcess postprocess function
   * @returns base CV model object
   */
  constructor(y, i, T, k, C) {
    super(y, T, void 0, void 0, C), this.loadConfigs(i), typeof k < "u" && (this.getFeeds = k);
  }
  /**
   * load infer configs
   * @param inferConfig model infer config URL
   */
  loadConfigs(y) {
    let i = JSON.parse(te.loadText(y)), T = i.Preprocess;
    this.isPermute = !1, this.isCrop = !1, this.isResize = !1;
    for (let k = 0; k < T.length; k++) {
      let C = T[k];
      if (C.type == "Decode") {
        if (this.mode = C.mode, !(this.mode == "RGB" || this.mode == "BGR"))
          throw `Not support ${C.mode} mode.`;
      } else if (C.type == "Resize")
        this.isResize = !0, this.interp = C.interp, this.keepRatio = C.keep_ratio, this.targetSize = C.target_size, this.limitMax = C.limit_max;
      else if (C.type == "Normalize")
        this.isScale = C.is_scale, this.isScale && (this.scale = new x.Scalar(255, 255, 255)), this.mean = new x.Scalar(...C.mean), this.std = new x.Scalar(...C.std);
      else if (C.type == "Crop")
        this.isCrop = !0, this.cropSize = C.crop_size;
      else if (C.type == "Permute")
        this.isPermute = !0;
      else
        throw `Not support ${C.type} OP.`;
    }
    i.hasOwnProperty("label_list") && (this.labelList = i.label_list, this.colorMap = te.getColorMap(this.labelList)), console.info("model info: ", {
      mode: this.mode,
      isResize: this.isResize,
      interp: this.interp,
      keepRatio: this.keepRatio,
      targetSize: this.targetSize,
      isScale: this.isScale,
      limitMax: this.limitMax,
      mean: this.mean,
      std: this.std,
      isCrop: this.isCrop,
      cropSize: this.cropSize,
      isPermute: this.isPermute,
      labelList: this.labelList
    });
  }
  /**
   * model preprocess function. 
   * @param args preprocess args
   * @returns session infer feeds
   */
  preProcess(...y) {
    let [i, T, k] = y.slice(0, 3), C, R, S;
    this.isResize ? [C, R, S] = te.resize(i, T, k, this.targetSize, this.keepRatio, this.limitMax, this.interp) : C = i.clone();
    let N;
    if (this.isCrop) {
      let H = te.crop(C, this.cropSize);
      this.mode == "RGB" ? N = te.rgba2rgb(H) : this.mode == "BGR" && (N = te.rgba2bgr(H)), H.delete();
    } else
      this.mode == "RGB" ? N = te.rgba2rgb(C) : this.mode == "BGR" && (N = te.rgba2bgr(C)), C.delete();
    let j = te.normalize(N, this.scale, this.mean, this.std, this.isScale), O, [$, le] = [j.rows, j.cols];
    return this.isPermute ? O = new Be.Tensor("float32", te.permute(j), [1, 3, $, le]) : (O = new Be.Tensor("float32", j.data32F, [1, $, le, 3]), j.delete()), this.getFeeds(O, R, S);
  }
}
class Jt extends Cn {
  /**
   * get session infer feeds.
   * @param imgTensor image tensor
   * @param imScaleX image scale factor of x axis
   * @param imScaleY image scale factor of y axis
   * @returns session infer feeds
   */
  getFeeds(y, i, T) {
    let k = this.session.inputNames, C = {
      im_shape: new Be.Tensor("float32", Float32Array.from(y.dims.slice(2, 4)), [1, 2]),
      image: y,
      scale_factor: new Be.Tensor("float32", Float32Array.from([T, i]), [1, 2])
    }, R = {};
    return k.forEach((S) => {
      R[S] = C[S];
    }), R;
  }
  /**
   * detection postprocess.
   * @param resultsTensors result tensors
   * @param args postprocess args
   * @returns bboxes of the detection
   */
  postProcess(y, ...i) {
    let [T, k, C] = i.slice(1, 4), R = Object.values(y)[0], S = [], N = R.dims[0], j = R.data;
    for (let O = 0; O < N; O++) {
      let $ = j[O * 6 + 0], le = j[O * 6 + 1], H = Math.max(0, Math.round(j[O * 6 + 2])), ge = Math.max(0, Math.round(j[O * 6 + 3])), ue = Math.min(k, Math.round(j[O * 6 + 4])), Ie = Math.min(T, Math.round(j[O * 6 + 5])), ze = this.labelList[$], Ue = this.colorMap[$].color;
      if (le > C) {
        let ee = {
          label: ze,
          color: Ue,
          score: le,
          x1: H,
          y1: ge,
          x2: ue,
          y2: Ie
        };
        S.push(ee);
      }
    }
    return S;
  }
  /**
   * detection infer.
   * @param imgRGBA RGBA image
   * @param drawThreshold threshold of detection
   * @returns bboxes of the detection
   */
  infer(y, i = 0.5) {
    return super.infer(y, y.rows, y.cols, i);
  }
}
class ea extends Cn {
  /**
   * get the feeds of the infer session.
   * @param imgTensor image tensor
   * @returns feeds of the infer session
   */
  getFeeds(y) {
    return { x: y };
  }
  /**
   * classification postprocess.
   * @param resultsTensors result tensors
   * @param args postprocess args
   * @returns probs of the classification
   */
  postProcess(y, ...i) {
    let T = i[3], C = Object.values(y)[0].data, R = [];
    for (let S = 0; S < this.labelList.length; S++)
      R.push({
        label: this.labelList[S],
        prob: C[S]
      });
    return T > 0 ? R.sort((S, N) => N.prob - S.prob).slice(0, T) : R.sort((S, N) => N.prob - S.prob);
  }
  /**
   * classification infer.
   * @param imgRGBA RGBA image
   * @param topK probs top K
   * @returns probs of the classification
   */
  infer(y, i = 5) {
    return super.infer(y, y.rows, y.cols, i);
  }
}
class na extends Cn {
  /**
   * get the feeds of the infer session.
   * @param imgTensor image tensor
   * @returns feeds of the infer session
   */
  getFeeds(y) {
    return { x: y };
  }
  /**
   * segmentation postprocess.
   * @param resultsTensors result tensors
   * @returns segmentation results
   */
  postProcess(y) {
    let i = Object.values(y)[0], T = i.data, [k, C, R, S] = i.dims, N = R * S, j = [];
    for (let H = 0; H < C; H++)
      j.push(T.slice(H * N, (H + 1) * N));
    let O = [], $ = [], le;
    for (let H = 0; H < N; H++) {
      let ge = [];
      for (let ue = 0; ue < C; ue++)
        ge.push(j[ue][H]);
      le = te.argmax(ge), $.push(le), O.push(...this.colorMap[le].color);
    }
    return {
      gray: x.matFromArray(R, S, x.CV_8UC1, $),
      colorRGBA: x.matFromArray(R, S, x.CV_8UC4, O),
      colorMap: this.colorMap,
      delete: function() {
        this.gray.isDeleted() || this.gray.delete(), this.colorRGBA.isDeleted() || this.colorRGBA.delete();
      }
    };
  }
  /**
   * segmentation infer.
   * @param imgRGBA RGBA image
   * @returns segmentation results
   */
  infer(y) {
    return super.infer(y, y.rows, y.cols);
  }
}
const te = {
  /**
   * get the index of the max value of the array.
   * @param arr array
   * @returns the index of the max value of the array
   */
  argmax(b) {
    let y = Math.max.apply(null, b);
    return b.findIndex(
      function(T) {
        return T == y;
      }
    );
  },
  /**
   * get image scale.
   * @param height image height
   * @param width image width
   * @param targetSize target size [h, w]
   * @param keepRatio is keep the ratio of image size
   * @param limitMax is limit max size of image
   * @returns [scale factor of x axis, , scale factor of y axis]
   */
  getIMScale(b, y, i, T, k) {
    let C, R;
    if (T) {
      let S = Math.min(b, y), j = Math.min(i[0], i[1]) / S;
      if (k) {
        let O = Math.max(b, y), $ = Math.max(i[0], i[1]);
        Math.round(j * O) > $ && (j = $ / O);
      }
      C = j, R = j;
    } else
      R = i[0] / b, C = i[1] / y;
    return [C, R];
  },
  /**
   * RGBA -> RGB image.
   * @param imgRGBA RGBA image
   * @returns RGB image
   */
  rgba2rgb(b) {
    let y = new x.Mat();
    return x.cvtColor(b, y, x.COLOR_RGBA2RGB), y;
  },
  /**
   * RGBA -> BGR image.
   * @param imgRGBA RGBA image
   * @returns BGR image
   */
  rgba2bgr(b) {
    let y = new x.Mat();
    return x.cvtColor(b, y, x.COLOR_RGBA2BGR), y;
  },
  /**
   * image resize.
   * @param img image mat
   * @param height image height
   * @param width image width
   * @param targetSize target size [h, w]
   * @param keepRatio is keep the ratio of image size
   * @param limitMax is limit max size of image
   * @param interp interpolation method
   * @returns [image resized, scale factor of x axis, , scale factor of y axis]
   */
  resize(b, y, i, T, k, C, R) {
    let [S, N] = te.getIMScale(y, i, T, k, C), j = new x.Mat();
    return x.resize(b, j, new x.Size(0, 0), S, N, R), [j, S, N];
  },
  /**
   * image center crop.
   * @param img image mat
   * @param cropSize crop size [h, w]
   * @returns cropped image
   */
  crop(b, y) {
    let i = b.roi(
      new x.Rect(
        Math.ceil((b.cols - y[1]) / 2),
        Math.ceil((b.rows - y[0]) / 2),
        y[1],
        y[0]
      )
    );
    return b.delete(), i;
  },
  /**
   * image normalize.
   * @param img image mat
   * @param scale normalize scale
   * @param mean normalize mean
   * @param std normalize std
   * @param isScale is scale the image
   * @returns normalized image
   */
  normalize(b, y, i, T, k) {
    if (b.convertTo(b, x.CV_32F), k) {
      let S = new x.Mat(b.rows, b.cols, x.CV_32FC3, y);
      x.divide(b, S, b), S.delete();
    }
    let C = new x.Mat(b.rows, b.cols, x.CV_32FC3, i);
    x.subtract(b, C, b), C.delete();
    let R = new x.Mat(b.rows, b.cols, x.CV_32FC3, T);
    return x.divide(b, R, b), R.delete(), b;
  },
  /**
   * permute hwc -> chw.
   * @param img image mat
   * @returns image data
   */
  permute(b) {
    let y = new x.MatVector();
    x.split(b, y);
    let i = y.get(0), T = y.get(1), k = y.get(2);
    y.delete();
    let C = new Float32Array(i.data32F.length * 3);
    return C.set(i.data32F, 0), C.set(T.data32F, i.data32F.length), C.set(k.data32F, i.data32F.length * 2), i.delete(), T.delete(), k.delete(), b.delete(), C;
  },
  /**
   * load text content.
   * @param textURL text URL
   * @returns content of the text
   */
  loadText(b) {
    let y = new XMLHttpRequest();
    return y.open("get", b, !1), y.send(null), y.responseText;
  },
  /**
   * get color map of label list.
   * @param labelList label list
   * @returns color map of label list
   */
  getColorMap(b) {
    let y = b.length, i = [], T = Math.ceil(256 * 256 * 256 / y);
    for (let k = 0; k < y; k++) {
      let C = (T * k).toString(16), R = [];
      for (let S = 0; S < 6; S += 2) {
        let N = C.slice(S, S + 2);
        N == "" ? R.push(0) : R.push(parseInt("0x" + N));
      }
      R.push(255), i.push({
        label: b[k],
        color: R
      });
    }
    return i;
  },
  /**
   * draw bboxes onto the image.
   * @param img image mat
   * @param bboxes bboxes of detection
   * @param withLabel draw with label 
   * @param withScore draw with score
   * @param thickness line thickness
   * @param lineType line type
   * @param fontFace font face
   * @param fontScale font scale
   * @returns drawed image
   */
  drawBBoxes(b, y, i = !0, T = !0, k = 2, C = 8, R = 0, S = 0.7) {
    let N = b.clone();
    for (let j = 0; j < y.length; j++) {
      let O = y[j];
      x.rectangle(N, new x.Point(O.x1, O.y1), new x.Point(O.x2, O.y2), O.color, k, C), i && T ? x.putText(N, `${O.label} ${(O.score * 100).toFixed(2)}%`, new x.Point(O.x1, O.y2), R, S, O.color, k, C) : i ? x.putText(N, `${O.label}`, new x.Point(O.x1, O.y2), R, S, O.color, k, C) : T && x.putText(N, `${(O.score * 100).toFixed(2)}%`, new x.Point(O.x1, O.y2), R, S, O.color, k, C);
    }
    return N;
  },
  Model: Dr,
  CV: Cn,
  Det: Jt,
  Cls: ea,
  Seg: na
};
window.WebAI = te;
window.cv = x;
window.ort = Be;
export {
  te as WebAI,
  x as cv,
  te as default,
  oa as ort
};
