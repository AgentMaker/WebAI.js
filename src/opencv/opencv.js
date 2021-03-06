var _scriptDir = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : void 0;
var cv = {};
var scriptDirectory = "";
function locateFile(path) {
  if (cv["locateFile"]) {
    return cv["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}
if (document.currentScript) {
  scriptDirectory = document.currentScript.src;
}
if (_scriptDir) {
  scriptDirectory = _scriptDir;
}
if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
} else {
  scriptDirectory = "";
}
var read_ = function shell_read(url) {
  try {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send(null);
    return xhr.responseText;
  } catch (err2) {
    var data = tryParseAsDataURI(url);
    if (data) {
      return intArrayToString(data);
    }
    throw err2;
  }
};
var readAsync = function readAsync2(url, onload, onerror) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function xhr_onload() {
    if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
      onload(xhr.response);
      return;
    }
    var data = tryParseAsDataURI(url);
    if (data) {
      onload(data.buffer);
      return;
    }
    onerror();
  };
  xhr.onerror = onerror;
  xhr.send(null);
};
var out = cv["print"] || console.log.bind(console);
var err = cv["printErr"] || console.warn.bind(console);
function dynamicAlloc(size) {
  var ret = HEAP32[DYNAMICTOP_PTR >> 2];
  var end = ret + size + 15 & -16;
  if (end > _emscripten_get_heap_size()) {
    abort();
  }
  HEAP32[DYNAMICTOP_PTR >> 2] = end;
  return ret;
}
function warnOnce(text) {
  if (!warnOnce.shown)
    warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}
var wasmBinary;
if (cv["wasmBinary"])
  wasmBinary = cv["wasmBinary"];
if (typeof WebAssembly !== "object") {
  err("no native wasm support detected");
}
var wasmMemory;
var wasmTable = new WebAssembly.Table({ "initial": 10498, "maximum": 10498 + 0, "element": "anyfunc" });
var ABORT = false;
function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed: " + text);
  }
}
function getMemory(size) {
  if (!runtimeInitialized)
    return dynamicAlloc(size);
  return _malloc(size);
}
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : void 0;
function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  while (u8Array[endPtr] && !(endPtr >= endIdx))
    ++endPtr;
  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var str = "";
    while (idx < endPtr) {
      var u0 = u8Array[idx++];
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue;
      }
      var u1 = u8Array[idx++] & 63;
      if ((u0 & 224) == 192) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue;
      }
      var u2 = u8Array[idx++] & 63;
      if ((u0 & 240) == 224) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2;
      } else {
        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u8Array[idx++] & 63;
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
      }
    }
  }
  return str;
}
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}
function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0))
    return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i);
      u = 65536 + ((u & 1023) << 10) | u1 & 1023;
    }
    if (u <= 127) {
      if (outIdx >= endIdx)
        break;
      outU8Array[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx)
        break;
      outU8Array[outIdx++] = 192 | u >> 6;
      outU8Array[outIdx++] = 128 | u & 63;
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx)
        break;
      outU8Array[outIdx++] = 224 | u >> 12;
      outU8Array[outIdx++] = 128 | u >> 6 & 63;
      outU8Array[outIdx++] = 128 | u & 63;
    } else {
      if (outIdx + 3 >= endIdx)
        break;
      outU8Array[outIdx++] = 240 | u >> 18;
      outU8Array[outIdx++] = 128 | u >> 12 & 63;
      outU8Array[outIdx++] = 128 | u >> 6 & 63;
      outU8Array[outIdx++] = 128 | u & 63;
    }
  }
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}
function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343)
      u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
    if (u <= 127)
      ++len;
    else if (u <= 2047)
      len += 2;
    else if (u <= 65535)
      len += 3;
    else
      len += 4;
  }
  return len;
}
typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : void 0;
function writeArrayToMemory(array, buffer2) {
  HEAP8.set(array, buffer2);
}
function writeAsciiToMemory(str, buffer2, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    HEAP8[buffer2++ >> 0] = str.charCodeAt(i);
  }
  if (!dontAddNull)
    HEAP8[buffer2 >> 0] = 0;
}
var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - x % multiple;
  }
  return x;
}
var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  cv["HEAP8"] = HEAP8 = new Int8Array(buf);
  cv["HEAP16"] = HEAP16 = new Int16Array(buf);
  cv["HEAP32"] = HEAP32 = new Int32Array(buf);
  cv["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
  cv["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
  cv["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
  cv["HEAPF32"] = HEAPF32 = new Float32Array(buf);
  cv["HEAPF64"] = HEAPF64 = new Float64Array(buf);
}
var DYNAMIC_BASE = 6627104, DYNAMICTOP_PTR = 1384064;
var INITIAL_TOTAL_MEMORY = cv["TOTAL_MEMORY"] || 134217728;
if (cv["wasmMemory"]) {
  wasmMemory = cv["wasmMemory"];
} else {
  wasmMemory = new WebAssembly.Memory({ "initial": INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE, "maximum": 1073741824 / WASM_PAGE_SIZE });
}
if (wasmMemory) {
  buffer = wasmMemory.buffer;
}
INITIAL_TOTAL_MEMORY = buffer.byteLength;
updateGlobalBufferAndViews(buffer);
HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
function callRuntimeCallbacks(callbacks) {
  while (callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == "function") {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === "number") {
      if (callback.arg === void 0) {
        cv["dynCall_v"](func);
      } else {
        cv["dynCall_vi"](func, callback.arg);
      }
    } else {
      func(callback.arg === void 0 ? null : callback.arg);
    }
  }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
function preRun() {
  if (cv["preRun"]) {
    if (typeof cv["preRun"] == "function")
      cv["preRun"] = [cv["preRun"]];
    while (cv["preRun"].length) {
      addOnPreRun(cv["preRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function initRuntime() {
  runtimeInitialized = true;
  if (!cv["noFSInit"] && !FS.init.initialized)
    FS.init();
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  FS.ignorePermissions = false;
  callRuntimeCallbacks(__ATMAIN__);
}
function postRun() {
  if (cv["postRun"]) {
    if (typeof cv["postRun"] == "function")
      cv["postRun"] = [cv["postRun"]];
    while (cv["postRun"].length) {
      addOnPostRun(cv["postRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
var Math_abs = Math.abs;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_min = Math.min;
var runDependencies = 0;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
  return id;
}
function addRunDependency(id) {
  runDependencies++;
  if (cv["monitorRunDependencies"]) {
    cv["monitorRunDependencies"](runDependencies);
  }
}
function removeRunDependency(id) {
  runDependencies--;
  if (cv["monitorRunDependencies"]) {
    cv["monitorRunDependencies"](runDependencies);
  }
  if (runDependencies == 0) {
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
}
cv["preloadedImages"] = {};
cv["preloadedAudios"] = {};
function abort(what) {
  if (cv["onAbort"]) {
    cv["onAbort"](what);
  }
  what += "";
  out(what);
  err(what);
  ABORT = true;
  throw "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
}
var dataURIPrefix = "data:application/octet-stream;base64,";
function isDataURI(filename) {
  return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0;
}
var wasmBinaryFile = "opencv.wasm";
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}
function getBinary() {
  try {
    if (wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    var binary = tryParseAsDataURI(wasmBinaryFile);
    if (binary) {
      return binary;
    } else {
      throw "both async and sync fetching of the wasm failed";
    }
  } catch (err2) {
    abort(err2);
  }
}
function getBinaryPromise() {
  if (!wasmBinary && typeof fetch === "function") {
    return fetch(wasmBinaryFile, { credentials: "same-origin" }).then(function(response) {
      if (!response["ok"]) {
        throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
      }
      return response["arrayBuffer"]();
    }).catch(function() {
      return getBinary();
    });
  }
  return new Promise(function(resolve, reject) {
    resolve(getBinary());
  });
}
function createWasm() {
  var info = { "env": asmLibraryArg, "wasi_unstable": asmLibraryArg };
  function receiveInstance(instance, module) {
    var exports2 = instance.exports;
    cv["asm"] = exports2;
    removeRunDependency();
  }
  addRunDependency();
  function receiveInstantiatedSource(output) {
    receiveInstance(output["instance"]);
  }
  function instantiateArrayBuffer(receiver) {
    return getBinaryPromise().then(function(binary) {
      return WebAssembly.instantiate(binary, info);
    }).then(receiver, function(reason) {
      err("failed to asynchronously prepare wasm: " + reason);
      abort(reason);
    });
  }
  function instantiateAsync() {
    if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
      fetch(wasmBinaryFile, { credentials: "same-origin" }).then(function(response) {
        var result = WebAssembly.instantiateStreaming(response, info);
        return result.then(receiveInstantiatedSource, function(reason) {
          err("wasm streaming compile failed: " + reason);
          err("falling back to ArrayBuffer instantiation");
          instantiateArrayBuffer(receiveInstantiatedSource);
        });
      });
    } else {
      return instantiateArrayBuffer(receiveInstantiatedSource);
    }
  }
  if (cv["instantiateWasm"]) {
    try {
      var exports = cv["instantiateWasm"](info, receiveInstance);
      return exports;
    } catch (e) {
      err("cv.instantiateWasm callback failed with error: " + e);
      return false;
    }
  }
  instantiateAsync();
  return {};
}
var tempDouble;
var tempI64;
__ATINIT__.push({ func: function() {
  ___wasm_call_ctors();
} });
function _emscripten_set_main_loop_timing(mode, value) {
  Browser.mainLoop.timingMode = mode;
  Browser.mainLoop.timingValue = value;
  if (!Browser.mainLoop.func) {
    return 1;
  }
  if (mode == 0) {
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
      var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
      setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
    };
    Browser.mainLoop.method = "timeout";
  } else if (mode == 1) {
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
      Browser.requestAnimationFrame(Browser.mainLoop.runner);
    };
    Browser.mainLoop.method = "rAF";
  } else if (mode == 2) {
    if (typeof setImmediate === "undefined") {
      var setImmediates = [];
      var emscriptenMainLoopMessageId = "setimmediate";
      var Browser_setImmediate_messageHandler = function(event) {
        if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
          event.stopPropagation();
          setImmediates.shift()();
        }
      };
      addEventListener("message", Browser_setImmediate_messageHandler, true);
      setImmediate = function Browser_emulated_setImmediate(func) {
        setImmediates.push(func);
        postMessage(emscriptenMainLoopMessageId, "*");
      };
    }
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
      setImmediate(Browser.mainLoop.runner);
    };
    Browser.mainLoop.method = "immediate";
  }
  return 0;
}
function _emscripten_get_now() {
  abort();
}
function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
  assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
  Browser.mainLoop.func = func;
  Browser.mainLoop.arg = arg;
  var browserIterationFunc;
  if (typeof arg !== "undefined") {
    browserIterationFunc = function() {
      cv["dynCall_vi"](func, arg);
    };
  } else {
    browserIterationFunc = function() {
      cv["dynCall_v"](func);
    };
  }
  var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
  Browser.mainLoop.runner = function Browser_mainLoop_runner() {
    if (ABORT)
      return;
    if (Browser.mainLoop.queue.length > 0) {
      var start = Date.now();
      var blocker = Browser.mainLoop.queue.shift();
      blocker.func(blocker.arg);
      if (Browser.mainLoop.remainingBlockers) {
        var remaining = Browser.mainLoop.remainingBlockers;
        var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
        if (blocker.counted) {
          Browser.mainLoop.remainingBlockers = next;
        } else {
          next = next + 0.5;
          Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
        }
      }
      console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
      Browser.mainLoop.updateStatus();
      if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop)
        return;
      setTimeout(Browser.mainLoop.runner, 0);
      return;
    }
    if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop)
      return;
    Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
    if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
      Browser.mainLoop.scheduler();
      return;
    } else if (Browser.mainLoop.timingMode == 0) {
      Browser.mainLoop.tickStartTime = _emscripten_get_now();
    }
    if (Browser.mainLoop.method === "timeout" && cv.ctx) {
      err("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!");
      Browser.mainLoop.method = "";
    }
    Browser.mainLoop.runIter(browserIterationFunc);
    if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop)
      return;
    if (typeof SDL === "object" && SDL.audio && SDL.audio.queueNewAudioData)
      SDL.audio.queueNewAudioData();
    Browser.mainLoop.scheduler();
  };
  if (!noSetTiming) {
    if (fps && fps > 0)
      _emscripten_set_main_loop_timing(0, 1e3 / fps);
    else
      _emscripten_set_main_loop_timing(1, 1);
    Browser.mainLoop.scheduler();
  }
  if (simulateInfiniteLoop) {
    throw "SimulateInfiniteLoop";
  }
}
var Browser = { mainLoop: { scheduler: null, method: "", currentlyRunningMainloop: 0, func: null, arg: 0, timingMode: 0, timingValue: 0, currentFrameNumber: 0, queue: [], pause: function() {
  Browser.mainLoop.scheduler = null;
  Browser.mainLoop.currentlyRunningMainloop++;
}, resume: function() {
  Browser.mainLoop.currentlyRunningMainloop++;
  var timingMode = Browser.mainLoop.timingMode;
  var timingValue = Browser.mainLoop.timingValue;
  var func = Browser.mainLoop.func;
  Browser.mainLoop.func = null;
  _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true);
  _emscripten_set_main_loop_timing(timingMode, timingValue);
  Browser.mainLoop.scheduler();
}, updateStatus: function() {
  if (cv["setStatus"]) {
    var message = cv["statusMessage"] || "Please wait...";
    var remaining = Browser.mainLoop.remainingBlockers;
    var expected = Browser.mainLoop.expectedBlockers;
    if (remaining) {
      if (remaining < expected) {
        cv["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
      } else {
        cv["setStatus"](message);
      }
    } else {
      cv["setStatus"]("");
    }
  }
}, runIter: function(func) {
  if (ABORT)
    return;
  if (cv["preMainLoop"]) {
    var preRet = cv["preMainLoop"]();
    if (preRet === false) {
      return;
    }
  }
  try {
    func();
  } catch (e) {
    if (e instanceof ExitStatus) {
      return;
    } else {
      if (e && typeof e === "object" && e.stack)
        err("exception thrown: " + [e, e.stack]);
      throw e;
    }
  }
  if (cv["postMainLoop"])
    cv["postMainLoop"]();
} }, isFullscreen: false, pointerLock: false, moduleContextCreatedCallbacks: [], workers: [], init: function() {
  if (!cv["preloadPlugins"])
    cv["preloadPlugins"] = [];
  if (Browser.initted)
    return;
  Browser.initted = true;
  try {
    new Blob();
    Browser.hasBlobConstructor = true;
  } catch (e) {
    Browser.hasBlobConstructor = false;
    console.log("warning: no blob constructor, cannot create blobs with mimetypes");
  }
  Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null;
  Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : void 0;
  if (!cv.noImageDecoding && typeof Browser.URLObject === "undefined") {
    console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
    cv.noImageDecoding = true;
  }
  var imagePlugin = {};
  imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
    return !cv.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
  };
  imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
    var b = null;
    if (Browser.hasBlobConstructor) {
      try {
        b = new Blob([byteArray], { type: Browser.getMimetype(name) });
        if (b.size !== byteArray.length) {
          b = new Blob([new Uint8Array(byteArray).buffer], { type: Browser.getMimetype(name) });
        }
      } catch (e) {
        warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder");
      }
    }
    if (!b) {
      var bb = new Browser.BlobBuilder();
      bb.append(new Uint8Array(byteArray).buffer);
      b = bb.getBlob();
    }
    var url = Browser.URLObject.createObjectURL(b);
    var img = new Image();
    img.onload = function img_onload() {
      assert(img.complete, "Image " + name + " could not be decoded");
      var canvas2 = document.createElement("canvas");
      canvas2.width = img.width;
      canvas2.height = img.height;
      var ctx = canvas2.getContext("2d");
      ctx.drawImage(img, 0, 0);
      cv["preloadedImages"][name] = canvas2;
      Browser.URLObject.revokeObjectURL(url);
      if (onload)
        onload(byteArray);
    };
    img.onerror = function img_onerror(event) {
      console.log("Image " + url + " could not be decoded");
      if (onerror)
        onerror();
    };
    img.src = url;
  };
  cv["preloadPlugins"].push(imagePlugin);
  var audioPlugin = {};
  audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
    return !cv.noAudioDecoding && name.substr(-4) in { ".ogg": 1, ".wav": 1, ".mp3": 1 };
  };
  audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
    var done = false;
    function finish(audio2) {
      if (done)
        return;
      done = true;
      cv["preloadedAudios"][name] = audio2;
      if (onload)
        onload(byteArray);
    }
    function fail() {
      if (done)
        return;
      done = true;
      cv["preloadedAudios"][name] = new Audio();
      if (onerror)
        onerror();
    }
    if (Browser.hasBlobConstructor) {
      try {
        var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
      } catch (e) {
        return fail();
      }
      var url = Browser.URLObject.createObjectURL(b);
      var audio = new Audio();
      audio.addEventListener("canplaythrough", function() {
        finish(audio);
      }, false);
      audio.onerror = function audio_onerror(event) {
        if (done)
          return;
        console.log("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
        function encode64(data) {
          var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
          var PAD = "=";
          var ret = "";
          var leftchar = 0;
          var leftbits = 0;
          for (var i = 0; i < data.length; i++) {
            leftchar = leftchar << 8 | data[i];
            leftbits += 8;
            while (leftbits >= 6) {
              var curr = leftchar >> leftbits - 6 & 63;
              leftbits -= 6;
              ret += BASE[curr];
            }
          }
          if (leftbits == 2) {
            ret += BASE[(leftchar & 3) << 4];
            ret += PAD + PAD;
          } else if (leftbits == 4) {
            ret += BASE[(leftchar & 15) << 2];
            ret += PAD;
          }
          return ret;
        }
        audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
        finish(audio);
      };
      audio.src = url;
      Browser.safeSetTimeout(function() {
        finish(audio);
      }, 1e4);
    } else {
      return fail();
    }
  };
  cv["preloadPlugins"].push(audioPlugin);
  function pointerLockChange() {
    Browser.pointerLock = document["pointerLockElement"] === cv["canvas"] || document["mozPointerLockElement"] === cv["canvas"] || document["webkitPointerLockElement"] === cv["canvas"] || document["msPointerLockElement"] === cv["canvas"];
  }
  var canvas = cv["canvas"];
  if (canvas) {
    canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || function() {
    };
    canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || function() {
    };
    canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
    document.addEventListener("pointerlockchange", pointerLockChange, false);
    document.addEventListener("mozpointerlockchange", pointerLockChange, false);
    document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
    document.addEventListener("mspointerlockchange", pointerLockChange, false);
    if (cv["elementPointerLock"]) {
      canvas.addEventListener("click", function(ev) {
        if (!Browser.pointerLock && cv["canvas"].requestPointerLock) {
          cv["canvas"].requestPointerLock();
          ev.preventDefault();
        }
      }, false);
    }
  }
}, createContext: function(canvas, useWebGL, setInModule, webGLContextAttributes) {
  if (useWebGL && cv.ctx && canvas == cv.canvas)
    return cv.ctx;
  var ctx;
  var contextHandle;
  if (useWebGL) {
    var contextAttributes = { antialias: false, alpha: false, majorVersion: 1 };
    if (webGLContextAttributes) {
      for (var attribute in webGLContextAttributes) {
        contextAttributes[attribute] = webGLContextAttributes[attribute];
      }
    }
    if (typeof GL !== "undefined") {
      contextHandle = GL.createContext(canvas, contextAttributes);
      if (contextHandle) {
        ctx = GL.getContext(contextHandle).GLctx;
      }
    }
  } else {
    ctx = canvas.getContext("2d");
  }
  if (!ctx)
    return null;
  if (setInModule) {
    if (!useWebGL)
      assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
    cv.ctx = ctx;
    if (useWebGL)
      GL.makeContextCurrent(contextHandle);
    cv.useWebGL = useWebGL;
    Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
      callback();
    });
    Browser.init();
  }
  return ctx;
}, destroyContext: function(canvas, useWebGL, setInModule) {
}, fullscreenHandlersInstalled: false, lockPointer: void 0, resizeCanvas: void 0, requestFullscreen: function(lockPointer, resizeCanvas, vrDevice) {
  Browser.lockPointer = lockPointer;
  Browser.resizeCanvas = resizeCanvas;
  Browser.vrDevice = vrDevice;
  if (typeof Browser.lockPointer === "undefined")
    Browser.lockPointer = true;
  if (typeof Browser.resizeCanvas === "undefined")
    Browser.resizeCanvas = false;
  if (typeof Browser.vrDevice === "undefined")
    Browser.vrDevice = null;
  var canvas = cv["canvas"];
  function fullscreenChange() {
    Browser.isFullscreen = false;
    var canvasContainer2 = canvas.parentNode;
    if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer2) {
      canvas.exitFullscreen = Browser.exitFullscreen;
      if (Browser.lockPointer)
        canvas.requestPointerLock();
      Browser.isFullscreen = true;
      if (Browser.resizeCanvas) {
        Browser.setFullscreenCanvasSize();
      } else {
        Browser.updateCanvasDimensions(canvas);
      }
    } else {
      canvasContainer2.parentNode.insertBefore(canvas, canvasContainer2);
      canvasContainer2.parentNode.removeChild(canvasContainer2);
      if (Browser.resizeCanvas) {
        Browser.setWindowedCanvasSize();
      } else {
        Browser.updateCanvasDimensions(canvas);
      }
    }
    if (cv["onFullScreen"])
      cv["onFullScreen"](Browser.isFullscreen);
    if (cv["onFullscreen"])
      cv["onFullscreen"](Browser.isFullscreen);
  }
  if (!Browser.fullscreenHandlersInstalled) {
    Browser.fullscreenHandlersInstalled = true;
    document.addEventListener("fullscreenchange", fullscreenChange, false);
    document.addEventListener("mozfullscreenchange", fullscreenChange, false);
    document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
    document.addEventListener("MSFullscreenChange", fullscreenChange, false);
  }
  var canvasContainer = document.createElement("div");
  canvas.parentNode.insertBefore(canvasContainer, canvas);
  canvasContainer.appendChild(canvas);
  canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? function() {
    canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]);
  } : null) || (canvasContainer["webkitRequestFullScreen"] ? function() {
    canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]);
  } : null);
  if (vrDevice) {
    canvasContainer.requestFullscreen({ vrDisplay: vrDevice });
  } else {
    canvasContainer.requestFullscreen();
  }
}, requestFullScreen: function(lockPointer, resizeCanvas, vrDevice) {
  err("Browser.requestFullScreen() is deprecated. Please call Browser.requestFullscreen instead.");
  Browser.requestFullScreen = function(lockPointer2, resizeCanvas2, vrDevice2) {
    return Browser.requestFullscreen(lockPointer2, resizeCanvas2, vrDevice2);
  };
  return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice);
}, exitFullscreen: function() {
  if (!Browser.isFullscreen) {
    return false;
  }
  var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || function() {
  };
  CFS.apply(document, []);
  return true;
}, nextRAF: 0, fakeRequestAnimationFrame: function(func) {
  var now = Date.now();
  if (Browser.nextRAF === 0) {
    Browser.nextRAF = now + 1e3 / 60;
  } else {
    while (now + 2 >= Browser.nextRAF) {
      Browser.nextRAF += 1e3 / 60;
    }
  }
  var delay = Math.max(Browser.nextRAF - now, 0);
  setTimeout(func, delay);
}, requestAnimationFrame: function(func) {
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(func);
    return;
  }
  var RAF = Browser.fakeRequestAnimationFrame;
  RAF(func);
}, safeCallback: function(func) {
  return function() {
    if (!ABORT)
      return func.apply(null, arguments);
  };
}, allowAsyncCallbacks: true, queuedAsyncCallbacks: [], pauseAsyncCallbacks: function() {
  Browser.allowAsyncCallbacks = false;
}, resumeAsyncCallbacks: function() {
  Browser.allowAsyncCallbacks = true;
  if (Browser.queuedAsyncCallbacks.length > 0) {
    var callbacks = Browser.queuedAsyncCallbacks;
    Browser.queuedAsyncCallbacks = [];
    callbacks.forEach(function(func) {
      func();
    });
  }
}, safeRequestAnimationFrame: function(func) {
  return Browser.requestAnimationFrame(function() {
    if (ABORT)
      return;
    if (Browser.allowAsyncCallbacks) {
      func();
    } else {
      Browser.queuedAsyncCallbacks.push(func);
    }
  });
}, safeSetTimeout: function(func, timeout) {
  return setTimeout(function() {
    if (ABORT)
      return;
    if (Browser.allowAsyncCallbacks) {
      func();
    } else {
      Browser.queuedAsyncCallbacks.push(func);
    }
  }, timeout);
}, safeSetInterval: function(func, timeout) {
  return setInterval(function() {
    if (ABORT)
      return;
    if (Browser.allowAsyncCallbacks) {
      func();
    }
  }, timeout);
}, getMimetype: function(name) {
  return { "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "bmp": "image/bmp", "ogg": "audio/ogg", "wav": "audio/wav", "mp3": "audio/mpeg" }[name.substr(name.lastIndexOf(".") + 1)];
}, getUserMedia: function(func) {
  if (!window.getUserMedia) {
    window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"];
  }
  window.getUserMedia(func);
}, getMovementX: function(event) {
  return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
}, getMovementY: function(event) {
  return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
}, getMouseWheelDelta: function(event) {
  var delta = 0;
  switch (event.type) {
    case "DOMMouseScroll":
      delta = event.detail / 3;
      break;
    case "mousewheel":
      delta = event.wheelDelta / 120;
      break;
    case "wheel":
      delta = event.deltaY;
      switch (event.deltaMode) {
        case 0:
          delta /= 100;
          break;
        case 1:
          delta /= 3;
          break;
        case 2:
          delta *= 80;
          break;
        default:
          throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
      }
      break;
    default:
      throw "unrecognized mouse wheel event: " + event.type;
  }
  return delta;
}, mouseX: 0, mouseY: 0, mouseMovementX: 0, mouseMovementY: 0, touches: {}, lastTouches: {}, calculateMouseEvent: function(event) {
  if (Browser.pointerLock) {
    if (event.type != "mousemove" && "mozMovementX" in event) {
      Browser.mouseMovementX = Browser.mouseMovementY = 0;
    } else {
      Browser.mouseMovementX = Browser.getMovementX(event);
      Browser.mouseMovementY = Browser.getMovementY(event);
    }
    if (typeof SDL != "undefined") {
      Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
      Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
    } else {
      Browser.mouseX += Browser.mouseMovementX;
      Browser.mouseY += Browser.mouseMovementY;
    }
  } else {
    var rect = cv["canvas"].getBoundingClientRect();
    var cw = cv["canvas"].width;
    var ch = cv["canvas"].height;
    var scrollX = typeof window.scrollX !== "undefined" ? window.scrollX : window.pageXOffset;
    var scrollY = typeof window.scrollY !== "undefined" ? window.scrollY : window.pageYOffset;
    if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
      var touch = event.touch;
      if (touch === void 0) {
        return;
      }
      var adjustedX = touch.pageX - (scrollX + rect.left);
      var adjustedY = touch.pageY - (scrollY + rect.top);
      adjustedX = adjustedX * (cw / rect.width);
      adjustedY = adjustedY * (ch / rect.height);
      var coords = { x: adjustedX, y: adjustedY };
      if (event.type === "touchstart") {
        Browser.lastTouches[touch.identifier] = coords;
        Browser.touches[touch.identifier] = coords;
      } else if (event.type === "touchend" || event.type === "touchmove") {
        var last = Browser.touches[touch.identifier];
        if (!last)
          last = coords;
        Browser.lastTouches[touch.identifier] = last;
        Browser.touches[touch.identifier] = coords;
      }
      return;
    }
    var x = event.pageX - (scrollX + rect.left);
    var y = event.pageY - (scrollY + rect.top);
    x = x * (cw / rect.width);
    y = y * (ch / rect.height);
    Browser.mouseMovementX = x - Browser.mouseX;
    Browser.mouseMovementY = y - Browser.mouseY;
    Browser.mouseX = x;
    Browser.mouseY = y;
  }
}, asyncLoad: function(url, onload, onerror, noRunDep) {
  var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
  readAsync(url, function(arrayBuffer) {
    assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
    onload(new Uint8Array(arrayBuffer));
    if (dep)
      removeRunDependency();
  }, function(event) {
    if (onerror) {
      onerror();
    } else {
      throw 'Loading data file "' + url + '" failed.';
    }
  });
  if (dep)
    addRunDependency();
}, resizeListeners: [], updateResizeListeners: function() {
  var canvas = cv["canvas"];
  Browser.resizeListeners.forEach(function(listener) {
    listener(canvas.width, canvas.height);
  });
}, setCanvasSize: function(width, height, noUpdates) {
  var canvas = cv["canvas"];
  Browser.updateCanvasDimensions(canvas, width, height);
  if (!noUpdates)
    Browser.updateResizeListeners();
}, windowedWidth: 0, windowedHeight: 0, setFullscreenCanvasSize: function() {
  if (typeof SDL != "undefined") {
    var flags = HEAPU32[SDL.screen >> 2];
    flags = flags | 8388608;
    HEAP32[SDL.screen >> 2] = flags;
  }
  Browser.updateCanvasDimensions(cv["canvas"]);
  Browser.updateResizeListeners();
}, setWindowedCanvasSize: function() {
  if (typeof SDL != "undefined") {
    var flags = HEAPU32[SDL.screen >> 2];
    flags = flags & ~8388608;
    HEAP32[SDL.screen >> 2] = flags;
  }
  Browser.updateCanvasDimensions(cv["canvas"]);
  Browser.updateResizeListeners();
}, updateCanvasDimensions: function(canvas, wNative, hNative) {
  if (wNative && hNative) {
    canvas.widthNative = wNative;
    canvas.heightNative = hNative;
  } else {
    wNative = canvas.widthNative;
    hNative = canvas.heightNative;
  }
  var w = wNative;
  var h = hNative;
  if (cv["forcedAspectRatio"] && cv["forcedAspectRatio"] > 0) {
    if (w / h < cv["forcedAspectRatio"]) {
      w = Math.round(h * cv["forcedAspectRatio"]);
    } else {
      h = Math.round(w / cv["forcedAspectRatio"]);
    }
  }
  if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
    var factor = Math.min(screen.width / w, screen.height / h);
    w = Math.round(w * factor);
    h = Math.round(h * factor);
  }
  if (Browser.resizeCanvas) {
    if (canvas.width != w)
      canvas.width = w;
    if (canvas.height != h)
      canvas.height = h;
    if (typeof canvas.style != "undefined") {
      canvas.style.removeProperty("width");
      canvas.style.removeProperty("height");
    }
  } else {
    if (canvas.width != wNative)
      canvas.width = wNative;
    if (canvas.height != hNative)
      canvas.height = hNative;
    if (typeof canvas.style != "undefined") {
      if (w != wNative || h != hNative) {
        canvas.style.setProperty("width", w + "px", "important");
        canvas.style.setProperty("height", h + "px", "important");
      } else {
        canvas.style.removeProperty("width");
        canvas.style.removeProperty("height");
      }
    }
  }
}, wgetRequests: {}, nextWgetRequestHandle: 0, getNextWgetRequestHandle: function() {
  var handle = Browser.nextWgetRequestHandle;
  Browser.nextWgetRequestHandle++;
  return handle;
} };
function demangle(func) {
  var __cxa_demangle_func = cv["___cxa_demangle"] || cv["__cxa_demangle"];
  assert(__cxa_demangle_func);
  try {
    var s = func;
    if (s.startsWith("__Z"))
      s = s.substr(1);
    var len = lengthBytesUTF8(s) + 1;
    var buf = _malloc(len);
    stringToUTF8(s, buf, len);
    var status = _malloc(4);
    var ret = __cxa_demangle_func(buf, 0, 0, status);
    if (HEAP32[status >> 2] === 0 && ret) {
      return UTF8ToString(ret);
    }
  } catch (e) {
  } finally {
    if (buf)
      _free(buf);
    if (status)
      _free(status);
    if (ret)
      _free(ret);
  }
  return func;
}
function demangleAll(text) {
  var regex = /\b_Z[\w\d_]+/g;
  return text.replace(regex, function(x) {
    var y = demangle(x);
    return x === y ? x : y + " [" + x + "]";
  });
}
function jsStackTrace() {
  var err2 = new Error();
  if (!err2.stack) {
    try {
      throw new Error(0);
    } catch (e) {
      err2 = e;
    }
    if (!err2.stack) {
      return "(no stack trace available)";
    }
  }
  return err2.stack.toString();
}
function stackTrace() {
  var js = jsStackTrace();
  if (cv["extraStackTrace"])
    js += "\n" + cv["extraStackTrace"]();
  return demangleAll(js);
}
function ___cxa_allocate_exception(size) {
  return _malloc(size);
}
function _atexit(func, arg) {
}
function ___cxa_atexit() {
  return _atexit.apply(null, arguments);
}
var ___exception_infos = {};
function ___cxa_throw(ptr, type, destructor) {
  ___exception_infos[ptr] = { ptr, adjusted: [ptr], type, destructor, refcount: 0, caught: false, rethrown: false };
  if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
    __ZSt18uncaught_exceptionv.uncaught_exceptions = 1;
  } else {
    __ZSt18uncaught_exceptionv.uncaught_exceptions++;
  }
  throw ptr;
}
function ___lock() {
}
function ___setErrNo(value) {
  if (cv["___errno_location"])
    HEAP32[cv["___errno_location"]() >> 2] = value;
  return value;
}
function ___map_file(pathname, size) {
  ___setErrNo(63);
  return -1;
}
var PATH = { splitPath: function(filename) {
  var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  return splitPathRe.exec(filename).slice(1);
}, normalizeArray: function(parts, allowAboveRoot) {
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === ".") {
      parts.splice(i, 1);
    } else if (last === "..") {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }
  if (allowAboveRoot) {
    for (; up; up--) {
      parts.unshift("..");
    }
  }
  return parts;
}, normalize: function(path) {
  var isAbsolute = path.charAt(0) === "/", trailingSlash = path.substr(-1) === "/";
  path = PATH.normalizeArray(path.split("/").filter(function(p) {
    return !!p;
  }), !isAbsolute).join("/");
  if (!path && !isAbsolute) {
    path = ".";
  }
  if (path && trailingSlash) {
    path += "/";
  }
  return (isAbsolute ? "/" : "") + path;
}, dirname: function(path) {
  var result = PATH.splitPath(path), root = result[0], dir = result[1];
  if (!root && !dir) {
    return ".";
  }
  if (dir) {
    dir = dir.substr(0, dir.length - 1);
  }
  return root + dir;
}, basename: function(path) {
  if (path === "/")
    return "/";
  var lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1)
    return path;
  return path.substr(lastSlash + 1);
}, extname: function(path) {
  return PATH.splitPath(path)[3];
}, join: function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return PATH.normalize(paths.join("/"));
}, join2: function(l, r) {
  return PATH.normalize(l + "/" + r);
} };
var PATH_FS = { resolve: function() {
  var resolvedPath = "", resolvedAbsolute = false;
  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = i >= 0 ? arguments[i] : FS.cwd();
    if (typeof path !== "string") {
      throw new TypeError("Arguments to path.resolve must be strings");
    } else if (!path) {
      return "";
    }
    resolvedPath = path + "/" + resolvedPath;
    resolvedAbsolute = path.charAt(0) === "/";
  }
  resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function(p) {
    return !!p;
  }), !resolvedAbsolute).join("/");
  return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
}, relative: function(from, to) {
  from = PATH_FS.resolve(from).substr(1);
  to = PATH_FS.resolve(to).substr(1);
  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== "")
        break;
    }
    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== "")
        break;
    }
    if (start > end)
      return [];
    return arr.slice(start, end - start + 1);
  }
  var fromParts = trim(from.split("/"));
  var toParts = trim(to.split("/"));
  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }
  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push("..");
  }
  outputParts = outputParts.concat(toParts.slice(samePartsLength));
  return outputParts.join("/");
} };
var TTY = { ttys: [], init: function() {
}, shutdown: function() {
}, register: function(dev, ops) {
  TTY.ttys[dev] = { input: [], output: [], ops };
  FS.registerDevice(dev, TTY.stream_ops);
}, stream_ops: { open: function(stream) {
  var tty = TTY.ttys[stream.node.rdev];
  if (!tty) {
    throw new FS.ErrnoError(43);
  }
  stream.tty = tty;
  stream.seekable = false;
}, close: function(stream) {
  stream.tty.ops.flush(stream.tty);
}, flush: function(stream) {
  stream.tty.ops.flush(stream.tty);
}, read: function(stream, buffer2, offset, length, pos) {
  if (!stream.tty || !stream.tty.ops.get_char) {
    throw new FS.ErrnoError(60);
  }
  var bytesRead = 0;
  for (var i = 0; i < length; i++) {
    var result;
    try {
      result = stream.tty.ops.get_char(stream.tty);
    } catch (e) {
      throw new FS.ErrnoError(29);
    }
    if (result === void 0 && bytesRead === 0) {
      throw new FS.ErrnoError(6);
    }
    if (result === null || result === void 0)
      break;
    bytesRead++;
    buffer2[offset + i] = result;
  }
  if (bytesRead) {
    stream.node.timestamp = Date.now();
  }
  return bytesRead;
}, write: function(stream, buffer2, offset, length, pos) {
  if (!stream.tty || !stream.tty.ops.put_char) {
    throw new FS.ErrnoError(60);
  }
  try {
    for (var i = 0; i < length; i++) {
      stream.tty.ops.put_char(stream.tty, buffer2[offset + i]);
    }
  } catch (e) {
    throw new FS.ErrnoError(29);
  }
  if (length) {
    stream.node.timestamp = Date.now();
  }
  return i;
} }, default_tty_ops: { get_char: function(tty) {
  if (!tty.input.length) {
    var result = null;
    if (typeof window != "undefined" && typeof window.prompt == "function") {
      result = window.prompt("Input: ");
      if (result !== null) {
        result += "\n";
      }
    } else if (typeof readline == "function") {
      result = readline();
      if (result !== null) {
        result += "\n";
      }
    }
    if (!result) {
      return null;
    }
    tty.input = intArrayFromString(result, true);
  }
  return tty.input.shift();
}, put_char: function(tty, val) {
  if (val === null || val === 10) {
    out(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
  } else {
    if (val != 0)
      tty.output.push(val);
  }
}, flush: function(tty) {
  if (tty.output && tty.output.length > 0) {
    out(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
  }
} }, default_tty1_ops: { put_char: function(tty, val) {
  if (val === null || val === 10) {
    err(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
  } else {
    if (val != 0)
      tty.output.push(val);
  }
}, flush: function(tty) {
  if (tty.output && tty.output.length > 0) {
    err(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
  }
} } };
var MEMFS = { ops_table: null, mount: function(mount) {
  return MEMFS.createNode(null, "/", 16384 | 511, 0);
}, createNode: function(parent, name, mode, dev) {
  if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
    throw new FS.ErrnoError(63);
  }
  if (!MEMFS.ops_table) {
    MEMFS.ops_table = { dir: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, lookup: MEMFS.node_ops.lookup, mknod: MEMFS.node_ops.mknod, rename: MEMFS.node_ops.rename, unlink: MEMFS.node_ops.unlink, rmdir: MEMFS.node_ops.rmdir, readdir: MEMFS.node_ops.readdir, symlink: MEMFS.node_ops.symlink }, stream: { llseek: MEMFS.stream_ops.llseek } }, file: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: { llseek: MEMFS.stream_ops.llseek, read: MEMFS.stream_ops.read, write: MEMFS.stream_ops.write, allocate: MEMFS.stream_ops.allocate, mmap: MEMFS.stream_ops.mmap, msync: MEMFS.stream_ops.msync } }, link: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, readlink: MEMFS.node_ops.readlink }, stream: {} }, chrdev: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: FS.chrdev_stream_ops } };
  }
  var node = FS.createNode(parent, name, mode, dev);
  if (FS.isDir(node.mode)) {
    node.node_ops = MEMFS.ops_table.dir.node;
    node.stream_ops = MEMFS.ops_table.dir.stream;
    node.contents = {};
  } else if (FS.isFile(node.mode)) {
    node.node_ops = MEMFS.ops_table.file.node;
    node.stream_ops = MEMFS.ops_table.file.stream;
    node.usedBytes = 0;
    node.contents = null;
  } else if (FS.isLink(node.mode)) {
    node.node_ops = MEMFS.ops_table.link.node;
    node.stream_ops = MEMFS.ops_table.link.stream;
  } else if (FS.isChrdev(node.mode)) {
    node.node_ops = MEMFS.ops_table.chrdev.node;
    node.stream_ops = MEMFS.ops_table.chrdev.stream;
  }
  node.timestamp = Date.now();
  if (parent) {
    parent.contents[name] = node;
  }
  return node;
}, getFileDataAsRegularArray: function(node) {
  if (node.contents && node.contents.subarray) {
    var arr = [];
    for (var i = 0; i < node.usedBytes; ++i)
      arr.push(node.contents[i]);
    return arr;
  }
  return node.contents;
}, getFileDataAsTypedArray: function(node) {
  if (!node.contents)
    return new Uint8Array();
  if (node.contents.subarray)
    return node.contents.subarray(0, node.usedBytes);
  return new Uint8Array(node.contents);
}, expandFileStorage: function(node, newCapacity) {
  var prevCapacity = node.contents ? node.contents.length : 0;
  if (prevCapacity >= newCapacity)
    return;
  var CAPACITY_DOUBLING_MAX = 1024 * 1024;
  newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
  if (prevCapacity != 0)
    newCapacity = Math.max(newCapacity, 256);
  var oldContents = node.contents;
  node.contents = new Uint8Array(newCapacity);
  if (node.usedBytes > 0)
    node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
  return;
}, resizeFileStorage: function(node, newSize) {
  if (node.usedBytes == newSize)
    return;
  if (newSize == 0) {
    node.contents = null;
    node.usedBytes = 0;
    return;
  }
  if (!node.contents || node.contents.subarray) {
    var oldContents = node.contents;
    node.contents = new Uint8Array(new ArrayBuffer(newSize));
    if (oldContents) {
      node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
    }
    node.usedBytes = newSize;
    return;
  }
  if (!node.contents)
    node.contents = [];
  if (node.contents.length > newSize)
    node.contents.length = newSize;
  else
    while (node.contents.length < newSize)
      node.contents.push(0);
  node.usedBytes = newSize;
}, node_ops: { getattr: function(node) {
  var attr = {};
  attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
  attr.ino = node.id;
  attr.mode = node.mode;
  attr.nlink = 1;
  attr.uid = 0;
  attr.gid = 0;
  attr.rdev = node.rdev;
  if (FS.isDir(node.mode)) {
    attr.size = 4096;
  } else if (FS.isFile(node.mode)) {
    attr.size = node.usedBytes;
  } else if (FS.isLink(node.mode)) {
    attr.size = node.link.length;
  } else {
    attr.size = 0;
  }
  attr.atime = new Date(node.timestamp);
  attr.mtime = new Date(node.timestamp);
  attr.ctime = new Date(node.timestamp);
  attr.blksize = 4096;
  attr.blocks = Math.ceil(attr.size / attr.blksize);
  return attr;
}, setattr: function(node, attr) {
  if (attr.mode !== void 0) {
    node.mode = attr.mode;
  }
  if (attr.timestamp !== void 0) {
    node.timestamp = attr.timestamp;
  }
  if (attr.size !== void 0) {
    MEMFS.resizeFileStorage(node, attr.size);
  }
}, lookup: function(parent, name) {
  throw FS.genericErrors[44];
}, mknod: function(parent, name, mode, dev) {
  return MEMFS.createNode(parent, name, mode, dev);
}, rename: function(old_node, new_dir, new_name) {
  if (FS.isDir(old_node.mode)) {
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {
    }
    if (new_node) {
      for (var i in new_node.contents) {
        throw new FS.ErrnoError(55);
      }
    }
  }
  delete old_node.parent.contents[old_node.name];
  old_node.name = new_name;
  new_dir.contents[new_name] = old_node;
  old_node.parent = new_dir;
}, unlink: function(parent, name) {
  delete parent.contents[name];
}, rmdir: function(parent, name) {
  var node = FS.lookupNode(parent, name);
  for (var i in node.contents) {
    throw new FS.ErrnoError(55);
  }
  delete parent.contents[name];
}, readdir: function(node) {
  var entries = [".", ".."];
  for (var key2 in node.contents) {
    if (!node.contents.hasOwnProperty(key2)) {
      continue;
    }
    entries.push(key2);
  }
  return entries;
}, symlink: function(parent, newname, oldpath) {
  var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
  node.link = oldpath;
  return node;
}, readlink: function(node) {
  if (!FS.isLink(node.mode)) {
    throw new FS.ErrnoError(28);
  }
  return node.link;
} }, stream_ops: { read: function(stream, buffer2, offset, length, position) {
  var contents = stream.node.contents;
  if (position >= stream.node.usedBytes)
    return 0;
  var size = Math.min(stream.node.usedBytes - position, length);
  if (size > 8 && contents.subarray) {
    buffer2.set(contents.subarray(position, position + size), offset);
  } else {
    for (var i = 0; i < size; i++)
      buffer2[offset + i] = contents[position + i];
  }
  return size;
}, write: function(stream, buffer2, offset, length, position, canOwn) {
  canOwn = false;
  if (!length)
    return 0;
  var node = stream.node;
  node.timestamp = Date.now();
  if (buffer2.subarray && (!node.contents || node.contents.subarray)) {
    if (canOwn) {
      node.contents = buffer2.subarray(offset, offset + length);
      node.usedBytes = length;
      return length;
    } else if (node.usedBytes === 0 && position === 0) {
      node.contents = new Uint8Array(buffer2.subarray(offset, offset + length));
      node.usedBytes = length;
      return length;
    } else if (position + length <= node.usedBytes) {
      node.contents.set(buffer2.subarray(offset, offset + length), position);
      return length;
    }
  }
  MEMFS.expandFileStorage(node, position + length);
  if (node.contents.subarray && buffer2.subarray)
    node.contents.set(buffer2.subarray(offset, offset + length), position);
  else {
    for (var i = 0; i < length; i++) {
      node.contents[position + i] = buffer2[offset + i];
    }
  }
  node.usedBytes = Math.max(node.usedBytes, position + length);
  return length;
}, llseek: function(stream, offset, whence) {
  var position = offset;
  if (whence === 1) {
    position += stream.position;
  } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
      position += stream.node.usedBytes;
    }
  }
  if (position < 0) {
    throw new FS.ErrnoError(28);
  }
  return position;
}, allocate: function(stream, offset, length) {
  MEMFS.expandFileStorage(stream.node, offset + length);
  stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
}, mmap: function(stream, buffer2, offset, length, position, prot, flags) {
  if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(43);
  }
  var ptr;
  var allocated;
  var contents = stream.node.contents;
  if (!(flags & 2) && (contents.buffer === buffer2 || contents.buffer === buffer2.buffer)) {
    allocated = false;
    ptr = contents.byteOffset;
  } else {
    if (position > 0 || position + length < stream.node.usedBytes) {
      if (contents.subarray) {
        contents = contents.subarray(position, position + length);
      } else {
        contents = Array.prototype.slice.call(contents, position, position + length);
      }
    }
    allocated = true;
    var fromHeap = buffer2.buffer == HEAP8.buffer;
    ptr = _malloc(length);
    if (!ptr) {
      throw new FS.ErrnoError(48);
    }
    (fromHeap ? HEAP8 : buffer2).set(contents, ptr);
  }
  return { ptr, allocated };
}, msync: function(stream, buffer2, offset, length, mmapFlags) {
  if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(43);
  }
  if (mmapFlags & 2) {
    return 0;
  }
  MEMFS.stream_ops.write(stream, buffer2, 0, length, offset, false);
  return 0;
} } };
var IDBFS = { dbs: {}, indexedDB: function() {
  if (typeof indexedDB !== "undefined")
    return indexedDB;
  var ret = null;
  if (typeof window === "object")
    ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  assert(ret, "IDBFS used, but indexedDB not supported");
  return ret;
}, DB_VERSION: 21, DB_STORE_NAME: "FILE_DATA", mount: function(mount) {
  return MEMFS.mount.apply(null, arguments);
}, syncfs: function(mount, populate, callback) {
  IDBFS.getLocalSet(mount, function(err2, local) {
    if (err2)
      return callback(err2);
    IDBFS.getRemoteSet(mount, function(err3, remote) {
      if (err3)
        return callback(err3);
      var src = populate ? remote : local;
      var dst = populate ? local : remote;
      IDBFS.reconcile(src, dst, callback);
    });
  });
}, getDB: function(name, callback) {
  var db = IDBFS.dbs[name];
  if (db) {
    return callback(null, db);
  }
  var req;
  try {
    req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
  } catch (e) {
    return callback(e);
  }
  if (!req) {
    return callback("Unable to connect to IndexedDB");
  }
  req.onupgradeneeded = function(e) {
    var db2 = e.target.result;
    var transaction = e.target.transaction;
    var fileStore;
    if (db2.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
      fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
    } else {
      fileStore = db2.createObjectStore(IDBFS.DB_STORE_NAME);
    }
    if (!fileStore.indexNames.contains("timestamp")) {
      fileStore.createIndex("timestamp", "timestamp", { unique: false });
    }
  };
  req.onsuccess = function() {
    db = req.result;
    IDBFS.dbs[name] = db;
    callback(null, db);
  };
  req.onerror = function(e) {
    callback(this.error);
    e.preventDefault();
  };
}, getLocalSet: function(mount, callback) {
  var entries = {};
  function isRealDir(p) {
    return p !== "." && p !== "..";
  }
  function toAbsolute(root) {
    return function(p) {
      return PATH.join2(root, p);
    };
  }
  var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  while (check.length) {
    var path = check.pop();
    var stat;
    try {
      stat = FS.stat(path);
    } catch (e) {
      return callback(e);
    }
    if (FS.isDir(stat.mode)) {
      check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
    }
    entries[path] = { timestamp: stat.mtime };
  }
  return callback(null, { type: "local", entries });
}, getRemoteSet: function(mount, callback) {
  var entries = {};
  IDBFS.getDB(mount.mountpoint, function(err2, db) {
    if (err2)
      return callback(err2);
    try {
      var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
      transaction.onerror = function(e) {
        callback(this.error);
        e.preventDefault();
      };
      var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
      var index = store.index("timestamp");
      index.openKeyCursor().onsuccess = function(event) {
        var cursor = event.target.result;
        if (!cursor) {
          return callback(null, { type: "remote", db, entries });
        }
        entries[cursor.primaryKey] = { timestamp: cursor.key };
        cursor.continue();
      };
    } catch (e) {
      return callback(e);
    }
  });
}, loadLocalEntry: function(path, callback) {
  var stat, node;
  try {
    var lookup = FS.lookupPath(path);
    node = lookup.node;
    stat = FS.stat(path);
  } catch (e) {
    return callback(e);
  }
  if (FS.isDir(stat.mode)) {
    return callback(null, { timestamp: stat.mtime, mode: stat.mode });
  } else if (FS.isFile(stat.mode)) {
    node.contents = MEMFS.getFileDataAsTypedArray(node);
    return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
  } else {
    return callback(new Error("node type not supported"));
  }
}, storeLocalEntry: function(path, entry, callback) {
  try {
    if (FS.isDir(entry.mode)) {
      FS.mkdir(path, entry.mode);
    } else if (FS.isFile(entry.mode)) {
      FS.writeFile(path, entry.contents, { canOwn: true });
    } else {
      return callback(new Error("node type not supported"));
    }
    FS.chmod(path, entry.mode);
    FS.utime(path, entry.timestamp, entry.timestamp);
  } catch (e) {
    return callback(e);
  }
  callback(null);
}, removeLocalEntry: function(path, callback) {
  try {
    var lookup = FS.lookupPath(path);
    var stat = FS.stat(path);
    if (FS.isDir(stat.mode)) {
      FS.rmdir(path);
    } else if (FS.isFile(stat.mode)) {
      FS.unlink(path);
    }
  } catch (e) {
    return callback(e);
  }
  callback(null);
}, loadRemoteEntry: function(store, path, callback) {
  var req = store.get(path);
  req.onsuccess = function(event) {
    callback(null, event.target.result);
  };
  req.onerror = function(e) {
    callback(this.error);
    e.preventDefault();
  };
}, storeRemoteEntry: function(store, path, entry, callback) {
  var req = store.put(entry, path);
  req.onsuccess = function() {
    callback(null);
  };
  req.onerror = function(e) {
    callback(this.error);
    e.preventDefault();
  };
}, removeRemoteEntry: function(store, path, callback) {
  var req = store.delete(path);
  req.onsuccess = function() {
    callback(null);
  };
  req.onerror = function(e) {
    callback(this.error);
    e.preventDefault();
  };
}, reconcile: function(src, dst, callback) {
  var total = 0;
  var create = [];
  Object.keys(src.entries).forEach(function(key2) {
    var e = src.entries[key2];
    var e2 = dst.entries[key2];
    if (!e2 || e.timestamp > e2.timestamp) {
      create.push(key2);
      total++;
    }
  });
  var remove = [];
  Object.keys(dst.entries).forEach(function(key2) {
    dst.entries[key2];
    var e2 = src.entries[key2];
    if (!e2) {
      remove.push(key2);
      total++;
    }
  });
  if (!total) {
    return callback(null);
  }
  var errored = false;
  var db = src.type === "remote" ? src.db : dst.db;
  var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
  var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  function done(err2) {
    if (err2 && !errored) {
      errored = true;
      return callback(err2);
    }
  }
  transaction.onerror = function(e) {
    done(this.error);
    e.preventDefault();
  };
  transaction.oncomplete = function(e) {
    if (!errored) {
      callback(null);
    }
  };
  create.sort().forEach(function(path) {
    if (dst.type === "local") {
      IDBFS.loadRemoteEntry(store, path, function(err2, entry) {
        if (err2)
          return done(err2);
        IDBFS.storeLocalEntry(path, entry, done);
      });
    } else {
      IDBFS.loadLocalEntry(path, function(err2, entry) {
        if (err2)
          return done(err2);
        IDBFS.storeRemoteEntry(store, path, entry, done);
      });
    }
  });
  remove.sort().reverse().forEach(function(path) {
    if (dst.type === "local") {
      IDBFS.removeLocalEntry(path, done);
    } else {
      IDBFS.removeRemoteEntry(store, path, done);
    }
  });
} };
var FS = { root: null, mounts: [], devices: {}, streams: [], nextInode: 1, nameTable: null, currentPath: "/", initialized: false, ignorePermissions: true, trackingDelegate: {}, tracking: { openFlags: { READ: 1, WRITE: 2 } }, ErrnoError: null, genericErrors: {}, filesystems: null, syncFSRequests: 0, handleFSError: function(e) {
  if (!(e instanceof FS.ErrnoError))
    throw e + " : " + stackTrace();
  return ___setErrNo(e.errno);
}, lookupPath: function(path, opts) {
  path = PATH_FS.resolve(FS.cwd(), path);
  opts = opts || {};
  if (!path)
    return { path: "", node: null };
  var defaults = { follow_mount: true, recurse_count: 0 };
  for (var key2 in defaults) {
    if (opts[key2] === void 0) {
      opts[key2] = defaults[key2];
    }
  }
  if (opts.recurse_count > 8) {
    throw new FS.ErrnoError(32);
  }
  var parts = PATH.normalizeArray(path.split("/").filter(function(p) {
    return !!p;
  }), false);
  var current = FS.root;
  var current_path = "/";
  for (var i = 0; i < parts.length; i++) {
    var islast = i === parts.length - 1;
    if (islast && opts.parent) {
      break;
    }
    current = FS.lookupNode(current, parts[i]);
    current_path = PATH.join2(current_path, parts[i]);
    if (FS.isMountpoint(current)) {
      if (!islast || islast && opts.follow_mount) {
        current = current.mounted.root;
      }
    }
    if (!islast || opts.follow) {
      var count = 0;
      while (FS.isLink(current.mode)) {
        var link = FS.readlink(current_path);
        current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
        var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
        current = lookup.node;
        if (count++ > 40) {
          throw new FS.ErrnoError(32);
        }
      }
    }
  }
  return { path: current_path, node: current };
}, getPath: function(node) {
  var path;
  while (true) {
    if (FS.isRoot(node)) {
      var mount = node.mount.mountpoint;
      if (!path)
        return mount;
      return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path;
    }
    path = path ? node.name + "/" + path : node.name;
    node = node.parent;
  }
}, hashName: function(parentid, name) {
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
  }
  return (parentid + hash >>> 0) % FS.nameTable.length;
}, hashAddNode: function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  node.name_next = FS.nameTable[hash];
  FS.nameTable[hash] = node;
}, hashRemoveNode: function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  if (FS.nameTable[hash] === node) {
    FS.nameTable[hash] = node.name_next;
  } else {
    var current = FS.nameTable[hash];
    while (current) {
      if (current.name_next === node) {
        current.name_next = node.name_next;
        break;
      }
      current = current.name_next;
    }
  }
}, lookupNode: function(parent, name) {
  var err2 = FS.mayLookup(parent);
  if (err2) {
    throw new FS.ErrnoError(err2, parent);
  }
  var hash = FS.hashName(parent.id, name);
  for (var node = FS.nameTable[hash]; node; node = node.name_next) {
    var nodeName = node.name;
    if (node.parent.id === parent.id && nodeName === name) {
      return node;
    }
  }
  return FS.lookup(parent, name);
}, createNode: function(parent, name, mode, rdev) {
  if (!FS.FSNode) {
    FS.FSNode = function(parent2, name2, mode2, rdev2) {
      if (!parent2) {
        parent2 = this;
      }
      this.parent = parent2;
      this.mount = parent2.mount;
      this.mounted = null;
      this.id = FS.nextInode++;
      this.name = name2;
      this.mode = mode2;
      this.node_ops = {};
      this.stream_ops = {};
      this.rdev = rdev2;
    };
    FS.FSNode.prototype = {};
    var readMode = 292 | 73;
    var writeMode = 146;
    Object.defineProperties(FS.FSNode.prototype, { read: { get: function() {
      return (this.mode & readMode) === readMode;
    }, set: function(val) {
      val ? this.mode |= readMode : this.mode &= ~readMode;
    } }, write: { get: function() {
      return (this.mode & writeMode) === writeMode;
    }, set: function(val) {
      val ? this.mode |= writeMode : this.mode &= ~writeMode;
    } }, isFolder: { get: function() {
      return FS.isDir(this.mode);
    } }, isDevice: { get: function() {
      return FS.isChrdev(this.mode);
    } } });
  }
  var node = new FS.FSNode(parent, name, mode, rdev);
  FS.hashAddNode(node);
  return node;
}, destroyNode: function(node) {
  FS.hashRemoveNode(node);
}, isRoot: function(node) {
  return node === node.parent;
}, isMountpoint: function(node) {
  return !!node.mounted;
}, isFile: function(mode) {
  return (mode & 61440) === 32768;
}, isDir: function(mode) {
  return (mode & 61440) === 16384;
}, isLink: function(mode) {
  return (mode & 61440) === 40960;
}, isChrdev: function(mode) {
  return (mode & 61440) === 8192;
}, isBlkdev: function(mode) {
  return (mode & 61440) === 24576;
}, isFIFO: function(mode) {
  return (mode & 61440) === 4096;
}, isSocket: function(mode) {
  return (mode & 49152) === 49152;
}, flagModes: { "r": 0, "rs": 1052672, "r+": 2, "w": 577, "wx": 705, "xw": 705, "w+": 578, "wx+": 706, "xw+": 706, "a": 1089, "ax": 1217, "xa": 1217, "a+": 1090, "ax+": 1218, "xa+": 1218 }, modeStringToFlags: function(str) {
  var flags = FS.flagModes[str];
  if (typeof flags === "undefined") {
    throw new Error("Unknown file open mode: " + str);
  }
  return flags;
}, flagsToPermissionString: function(flag) {
  var perms = ["r", "w", "rw"][flag & 3];
  if (flag & 512) {
    perms += "w";
  }
  return perms;
}, nodePermissions: function(node, perms) {
  if (FS.ignorePermissions) {
    return 0;
  }
  if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
    return 2;
  } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
    return 2;
  } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
    return 2;
  }
  return 0;
}, mayLookup: function(dir) {
  var err2 = FS.nodePermissions(dir, "x");
  if (err2)
    return err2;
  if (!dir.node_ops.lookup)
    return 2;
  return 0;
}, mayCreate: function(dir, name) {
  try {
    var node = FS.lookupNode(dir, name);
    return 20;
  } catch (e) {
  }
  return FS.nodePermissions(dir, "wx");
}, mayDelete: function(dir, name, isdir) {
  var node;
  try {
    node = FS.lookupNode(dir, name);
  } catch (e) {
    return e.errno;
  }
  var err2 = FS.nodePermissions(dir, "wx");
  if (err2) {
    return err2;
  }
  if (isdir) {
    if (!FS.isDir(node.mode)) {
      return 54;
    }
    if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
      return 10;
    }
  } else {
    if (FS.isDir(node.mode)) {
      return 31;
    }
  }
  return 0;
}, mayOpen: function(node, flags) {
  if (!node) {
    return 44;
  }
  if (FS.isLink(node.mode)) {
    return 32;
  } else if (FS.isDir(node.mode)) {
    if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
      return 31;
    }
  }
  return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
}, MAX_OPEN_FDS: 4096, nextfd: function(fd_start, fd_end) {
  fd_start = fd_start || 0;
  fd_end = fd_end || FS.MAX_OPEN_FDS;
  for (var fd = fd_start; fd <= fd_end; fd++) {
    if (!FS.streams[fd]) {
      return fd;
    }
  }
  throw new FS.ErrnoError(33);
}, getStream: function(fd) {
  return FS.streams[fd];
}, createStream: function(stream, fd_start, fd_end) {
  if (!FS.FSStream) {
    FS.FSStream = function() {
    };
    FS.FSStream.prototype = {};
    Object.defineProperties(FS.FSStream.prototype, { object: { get: function() {
      return this.node;
    }, set: function(val) {
      this.node = val;
    } }, isRead: { get: function() {
      return (this.flags & 2097155) !== 1;
    } }, isWrite: { get: function() {
      return (this.flags & 2097155) !== 0;
    } }, isAppend: { get: function() {
      return this.flags & 1024;
    } } });
  }
  var newStream = new FS.FSStream();
  for (var p in stream) {
    newStream[p] = stream[p];
  }
  stream = newStream;
  var fd = FS.nextfd(fd_start, fd_end);
  stream.fd = fd;
  FS.streams[fd] = stream;
  return stream;
}, closeStream: function(fd) {
  FS.streams[fd] = null;
}, chrdev_stream_ops: { open: function(stream) {
  var device = FS.getDevice(stream.node.rdev);
  stream.stream_ops = device.stream_ops;
  if (stream.stream_ops.open) {
    stream.stream_ops.open(stream);
  }
}, llseek: function() {
  throw new FS.ErrnoError(70);
} }, major: function(dev) {
  return dev >> 8;
}, minor: function(dev) {
  return dev & 255;
}, makedev: function(ma, mi) {
  return ma << 8 | mi;
}, registerDevice: function(dev, ops) {
  FS.devices[dev] = { stream_ops: ops };
}, getDevice: function(dev) {
  return FS.devices[dev];
}, getMounts: function(mount) {
  var mounts = [];
  var check = [mount];
  while (check.length) {
    var m = check.pop();
    mounts.push(m);
    check.push.apply(check, m.mounts);
  }
  return mounts;
}, syncfs: function(populate, callback) {
  if (typeof populate === "function") {
    callback = populate;
    populate = false;
  }
  FS.syncFSRequests++;
  if (FS.syncFSRequests > 1) {
    console.log("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work");
  }
  var mounts = FS.getMounts(FS.root.mount);
  var completed = 0;
  function doCallback(err2) {
    FS.syncFSRequests--;
    return callback(err2);
  }
  function done(err2) {
    if (err2) {
      if (!done.errored) {
        done.errored = true;
        return doCallback(err2);
      }
      return;
    }
    if (++completed >= mounts.length) {
      doCallback(null);
    }
  }
  mounts.forEach(function(mount) {
    if (!mount.type.syncfs) {
      return done(null);
    }
    mount.type.syncfs(mount, populate, done);
  });
}, mount: function(type, opts, mountpoint) {
  var root = mountpoint === "/";
  var pseudo = !mountpoint;
  var node;
  if (root && FS.root) {
    throw new FS.ErrnoError(10);
  } else if (!root && !pseudo) {
    var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
    mountpoint = lookup.path;
    node = lookup.node;
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    if (!FS.isDir(node.mode)) {
      throw new FS.ErrnoError(54);
    }
  }
  var mount = { type, opts, mountpoint, mounts: [] };
  var mountRoot = type.mount(mount);
  mountRoot.mount = mount;
  mount.root = mountRoot;
  if (root) {
    FS.root = mountRoot;
  } else if (node) {
    node.mounted = mount;
    if (node.mount) {
      node.mount.mounts.push(mount);
    }
  }
  return mountRoot;
}, unmount: function(mountpoint) {
  var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  if (!FS.isMountpoint(lookup.node)) {
    throw new FS.ErrnoError(28);
  }
  var node = lookup.node;
  var mount = node.mounted;
  var mounts = FS.getMounts(mount);
  Object.keys(FS.nameTable).forEach(function(hash) {
    var current = FS.nameTable[hash];
    while (current) {
      var next = current.name_next;
      if (mounts.indexOf(current.mount) !== -1) {
        FS.destroyNode(current);
      }
      current = next;
    }
  });
  node.mounted = null;
  var idx = node.mount.mounts.indexOf(mount);
  node.mount.mounts.splice(idx, 1);
}, lookup: function(parent, name) {
  return parent.node_ops.lookup(parent, name);
}, mknod: function(path, mode, dev) {
  var lookup = FS.lookupPath(path, { parent: true });
  var parent = lookup.node;
  var name = PATH.basename(path);
  if (!name || name === "." || name === "..") {
    throw new FS.ErrnoError(28);
  }
  var err2 = FS.mayCreate(parent, name);
  if (err2) {
    throw new FS.ErrnoError(err2);
  }
  if (!parent.node_ops.mknod) {
    throw new FS.ErrnoError(63);
  }
  return parent.node_ops.mknod(parent, name, mode, dev);
}, create: function(path, mode) {
  mode = mode !== void 0 ? mode : 438;
  mode &= 4095;
  mode |= 32768;
  return FS.mknod(path, mode, 0);
}, mkdir: function(path, mode) {
  mode = mode !== void 0 ? mode : 511;
  mode &= 511 | 512;
  mode |= 16384;
  return FS.mknod(path, mode, 0);
}, mkdirTree: function(path, mode) {
  var dirs = path.split("/");
  var d = "";
  for (var i = 0; i < dirs.length; ++i) {
    if (!dirs[i])
      continue;
    d += "/" + dirs[i];
    try {
      FS.mkdir(d, mode);
    } catch (e) {
      if (e.errno != 20)
        throw e;
    }
  }
}, mkdev: function(path, mode, dev) {
  if (typeof dev === "undefined") {
    dev = mode;
    mode = 438;
  }
  mode |= 8192;
  return FS.mknod(path, mode, dev);
}, symlink: function(oldpath, newpath) {
  if (!PATH_FS.resolve(oldpath)) {
    throw new FS.ErrnoError(44);
  }
  var lookup = FS.lookupPath(newpath, { parent: true });
  var parent = lookup.node;
  if (!parent) {
    throw new FS.ErrnoError(44);
  }
  var newname = PATH.basename(newpath);
  var err2 = FS.mayCreate(parent, newname);
  if (err2) {
    throw new FS.ErrnoError(err2);
  }
  if (!parent.node_ops.symlink) {
    throw new FS.ErrnoError(63);
  }
  return parent.node_ops.symlink(parent, newname, oldpath);
}, rename: function(old_path, new_path) {
  var old_dirname = PATH.dirname(old_path);
  var new_dirname = PATH.dirname(new_path);
  var old_name = PATH.basename(old_path);
  var new_name = PATH.basename(new_path);
  var lookup, old_dir, new_dir;
  try {
    lookup = FS.lookupPath(old_path, { parent: true });
    old_dir = lookup.node;
    lookup = FS.lookupPath(new_path, { parent: true });
    new_dir = lookup.node;
  } catch (e) {
    throw new FS.ErrnoError(10);
  }
  if (!old_dir || !new_dir)
    throw new FS.ErrnoError(44);
  if (old_dir.mount !== new_dir.mount) {
    throw new FS.ErrnoError(75);
  }
  var old_node = FS.lookupNode(old_dir, old_name);
  var relative = PATH_FS.relative(old_path, new_dirname);
  if (relative.charAt(0) !== ".") {
    throw new FS.ErrnoError(28);
  }
  relative = PATH_FS.relative(new_path, old_dirname);
  if (relative.charAt(0) !== ".") {
    throw new FS.ErrnoError(55);
  }
  var new_node;
  try {
    new_node = FS.lookupNode(new_dir, new_name);
  } catch (e) {
  }
  if (old_node === new_node) {
    return;
  }
  var isdir = FS.isDir(old_node.mode);
  var err2 = FS.mayDelete(old_dir, old_name, isdir);
  if (err2) {
    throw new FS.ErrnoError(err2);
  }
  err2 = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
  if (err2) {
    throw new FS.ErrnoError(err2);
  }
  if (!old_dir.node_ops.rename) {
    throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
    throw new FS.ErrnoError(10);
  }
  if (new_dir !== old_dir) {
    err2 = FS.nodePermissions(old_dir, "w");
    if (err2) {
      throw new FS.ErrnoError(err2);
    }
  }
  try {
    if (FS.trackingDelegate["willMovePath"]) {
      FS.trackingDelegate["willMovePath"](old_path, new_path);
    }
  } catch (e) {
    console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
  }
  FS.hashRemoveNode(old_node);
  try {
    old_dir.node_ops.rename(old_node, new_dir, new_name);
  } catch (e) {
    throw e;
  } finally {
    FS.hashAddNode(old_node);
  }
  try {
    if (FS.trackingDelegate["onMovePath"])
      FS.trackingDelegate["onMovePath"](old_path, new_path);
  } catch (e) {
    console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
  }
}, rmdir: function(path) {
  var lookup = FS.lookupPath(path, { parent: true });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var err2 = FS.mayDelete(parent, name, true);
  if (err2) {
    throw new FS.ErrnoError(err2);
  }
  if (!parent.node_ops.rmdir) {
    throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(node)) {
    throw new FS.ErrnoError(10);
  }
  try {
    if (FS.trackingDelegate["willDeletePath"]) {
      FS.trackingDelegate["willDeletePath"](path);
    }
  } catch (e) {
    console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
  }
  parent.node_ops.rmdir(parent, name);
  FS.destroyNode(node);
  try {
    if (FS.trackingDelegate["onDeletePath"])
      FS.trackingDelegate["onDeletePath"](path);
  } catch (e) {
    console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
  }
}, readdir: function(path) {
  var lookup = FS.lookupPath(path, { follow: true });
  var node = lookup.node;
  if (!node.node_ops.readdir) {
    throw new FS.ErrnoError(54);
  }
  return node.node_ops.readdir(node);
}, unlink: function(path) {
  var lookup = FS.lookupPath(path, { parent: true });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var err2 = FS.mayDelete(parent, name, false);
  if (err2) {
    throw new FS.ErrnoError(err2);
  }
  if (!parent.node_ops.unlink) {
    throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(node)) {
    throw new FS.ErrnoError(10);
  }
  try {
    if (FS.trackingDelegate["willDeletePath"]) {
      FS.trackingDelegate["willDeletePath"](path);
    }
  } catch (e) {
    console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
  }
  parent.node_ops.unlink(parent, name);
  FS.destroyNode(node);
  try {
    if (FS.trackingDelegate["onDeletePath"])
      FS.trackingDelegate["onDeletePath"](path);
  } catch (e) {
    console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
  }
}, readlink: function(path) {
  var lookup = FS.lookupPath(path);
  var link = lookup.node;
  if (!link) {
    throw new FS.ErrnoError(44);
  }
  if (!link.node_ops.readlink) {
    throw new FS.ErrnoError(28);
  }
  return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
}, stat: function(path, dontFollow) {
  var lookup = FS.lookupPath(path, { follow: !dontFollow });
  var node = lookup.node;
  if (!node) {
    throw new FS.ErrnoError(44);
  }
  if (!node.node_ops.getattr) {
    throw new FS.ErrnoError(63);
  }
  return node.node_ops.getattr(node);
}, lstat: function(path) {
  return FS.stat(path, true);
}, chmod: function(path, mode, dontFollow) {
  var node;
  if (typeof path === "string") {
    var lookup = FS.lookupPath(path, { follow: !dontFollow });
    node = lookup.node;
  } else {
    node = path;
  }
  if (!node.node_ops.setattr) {
    throw new FS.ErrnoError(63);
  }
  node.node_ops.setattr(node, { mode: mode & 4095 | node.mode & ~4095, timestamp: Date.now() });
}, lchmod: function(path, mode) {
  FS.chmod(path, mode, true);
}, fchmod: function(fd, mode) {
  var stream = FS.getStream(fd);
  if (!stream) {
    throw new FS.ErrnoError(8);
  }
  FS.chmod(stream.node, mode);
}, chown: function(path, uid, gid, dontFollow) {
  var node;
  if (typeof path === "string") {
    var lookup = FS.lookupPath(path, { follow: !dontFollow });
    node = lookup.node;
  } else {
    node = path;
  }
  if (!node.node_ops.setattr) {
    throw new FS.ErrnoError(63);
  }
  node.node_ops.setattr(node, { timestamp: Date.now() });
}, lchown: function(path, uid, gid) {
  FS.chown(path, uid, gid, true);
}, fchown: function(fd, uid, gid) {
  var stream = FS.getStream(fd);
  if (!stream) {
    throw new FS.ErrnoError(8);
  }
  FS.chown(stream.node, uid, gid);
}, truncate: function(path, len) {
  if (len < 0) {
    throw new FS.ErrnoError(28);
  }
  var node;
  if (typeof path === "string") {
    var lookup = FS.lookupPath(path, { follow: true });
    node = lookup.node;
  } else {
    node = path;
  }
  if (!node.node_ops.setattr) {
    throw new FS.ErrnoError(63);
  }
  if (FS.isDir(node.mode)) {
    throw new FS.ErrnoError(31);
  }
  if (!FS.isFile(node.mode)) {
    throw new FS.ErrnoError(28);
  }
  var err2 = FS.nodePermissions(node, "w");
  if (err2) {
    throw new FS.ErrnoError(err2);
  }
  node.node_ops.setattr(node, { size: len, timestamp: Date.now() });
}, ftruncate: function(fd, len) {
  var stream = FS.getStream(fd);
  if (!stream) {
    throw new FS.ErrnoError(8);
  }
  if ((stream.flags & 2097155) === 0) {
    throw new FS.ErrnoError(28);
  }
  FS.truncate(stream.node, len);
}, utime: function(path, atime, mtime) {
  var lookup = FS.lookupPath(path, { follow: true });
  var node = lookup.node;
  node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) });
}, open: function(path, flags, mode, fd_start, fd_end) {
  if (path === "") {
    throw new FS.ErrnoError(44);
  }
  flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
  mode = typeof mode === "undefined" ? 438 : mode;
  if (flags & 64) {
    mode = mode & 4095 | 32768;
  } else {
    mode = 0;
  }
  var node;
  if (typeof path === "object") {
    node = path;
  } else {
    path = PATH.normalize(path);
    try {
      var lookup = FS.lookupPath(path, { follow: !(flags & 131072) });
      node = lookup.node;
    } catch (e) {
    }
  }
  var created = false;
  if (flags & 64) {
    if (node) {
      if (flags & 128) {
        throw new FS.ErrnoError(20);
      }
    } else {
      node = FS.mknod(path, mode, 0);
      created = true;
    }
  }
  if (!node) {
    throw new FS.ErrnoError(44);
  }
  if (FS.isChrdev(node.mode)) {
    flags &= ~512;
  }
  if (flags & 65536 && !FS.isDir(node.mode)) {
    throw new FS.ErrnoError(54);
  }
  if (!created) {
    var err2 = FS.mayOpen(node, flags);
    if (err2) {
      throw new FS.ErrnoError(err2);
    }
  }
  if (flags & 512) {
    FS.truncate(node, 0);
  }
  flags &= ~(128 | 512);
  var stream = FS.createStream({ node, path: FS.getPath(node), flags, seekable: true, position: 0, stream_ops: node.stream_ops, ungotten: [], error: false }, fd_start, fd_end);
  if (stream.stream_ops.open) {
    stream.stream_ops.open(stream);
  }
  if (cv["logReadFiles"] && !(flags & 1)) {
    if (!FS.readFiles)
      FS.readFiles = {};
    if (!(path in FS.readFiles)) {
      FS.readFiles[path] = 1;
      console.log("FS.trackingDelegate error on read file: " + path);
    }
  }
  try {
    if (FS.trackingDelegate["onOpenFile"]) {
      var trackingFlags = 0;
      if ((flags & 2097155) !== 1) {
        trackingFlags |= FS.tracking.openFlags.READ;
      }
      if ((flags & 2097155) !== 0) {
        trackingFlags |= FS.tracking.openFlags.WRITE;
      }
      FS.trackingDelegate["onOpenFile"](path, trackingFlags);
    }
  } catch (e) {
    console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message);
  }
  return stream;
}, close: function(stream) {
  if (FS.isClosed(stream)) {
    throw new FS.ErrnoError(8);
  }
  if (stream.getdents)
    stream.getdents = null;
  try {
    if (stream.stream_ops.close) {
      stream.stream_ops.close(stream);
    }
  } catch (e) {
    throw e;
  } finally {
    FS.closeStream(stream.fd);
  }
  stream.fd = null;
}, isClosed: function(stream) {
  return stream.fd === null;
}, llseek: function(stream, offset, whence) {
  if (FS.isClosed(stream)) {
    throw new FS.ErrnoError(8);
  }
  if (!stream.seekable || !stream.stream_ops.llseek) {
    throw new FS.ErrnoError(70);
  }
  if (whence != 0 && whence != 1 && whence != 2) {
    throw new FS.ErrnoError(28);
  }
  stream.position = stream.stream_ops.llseek(stream, offset, whence);
  stream.ungotten = [];
  return stream.position;
}, read: function(stream, buffer2, offset, length, position) {
  if (length < 0 || position < 0) {
    throw new FS.ErrnoError(28);
  }
  if (FS.isClosed(stream)) {
    throw new FS.ErrnoError(8);
  }
  if ((stream.flags & 2097155) === 1) {
    throw new FS.ErrnoError(8);
  }
  if (FS.isDir(stream.node.mode)) {
    throw new FS.ErrnoError(31);
  }
  if (!stream.stream_ops.read) {
    throw new FS.ErrnoError(28);
  }
  var seeking = typeof position !== "undefined";
  if (!seeking) {
    position = stream.position;
  } else if (!stream.seekable) {
    throw new FS.ErrnoError(70);
  }
  var bytesRead = stream.stream_ops.read(stream, buffer2, offset, length, position);
  if (!seeking)
    stream.position += bytesRead;
  return bytesRead;
}, write: function(stream, buffer2, offset, length, position, canOwn) {
  if (length < 0 || position < 0) {
    throw new FS.ErrnoError(28);
  }
  if (FS.isClosed(stream)) {
    throw new FS.ErrnoError(8);
  }
  if ((stream.flags & 2097155) === 0) {
    throw new FS.ErrnoError(8);
  }
  if (FS.isDir(stream.node.mode)) {
    throw new FS.ErrnoError(31);
  }
  if (!stream.stream_ops.write) {
    throw new FS.ErrnoError(28);
  }
  if (stream.flags & 1024) {
    FS.llseek(stream, 0, 2);
  }
  var seeking = typeof position !== "undefined";
  if (!seeking) {
    position = stream.position;
  } else if (!stream.seekable) {
    throw new FS.ErrnoError(70);
  }
  var bytesWritten = stream.stream_ops.write(stream, buffer2, offset, length, position, canOwn);
  if (!seeking)
    stream.position += bytesWritten;
  try {
    if (stream.path && FS.trackingDelegate["onWriteToFile"])
      FS.trackingDelegate["onWriteToFile"](stream.path);
  } catch (e) {
    console.log("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message);
  }
  return bytesWritten;
}, allocate: function(stream, offset, length) {
  if (FS.isClosed(stream)) {
    throw new FS.ErrnoError(8);
  }
  if (offset < 0 || length <= 0) {
    throw new FS.ErrnoError(28);
  }
  if ((stream.flags & 2097155) === 0) {
    throw new FS.ErrnoError(8);
  }
  if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
    throw new FS.ErrnoError(43);
  }
  if (!stream.stream_ops.allocate) {
    throw new FS.ErrnoError(138);
  }
  stream.stream_ops.allocate(stream, offset, length);
}, mmap: function(stream, buffer2, offset, length, position, prot, flags) {
  if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
    throw new FS.ErrnoError(2);
  }
  if ((stream.flags & 2097155) === 1) {
    throw new FS.ErrnoError(2);
  }
  if (!stream.stream_ops.mmap) {
    throw new FS.ErrnoError(43);
  }
  return stream.stream_ops.mmap(stream, buffer2, offset, length, position, prot, flags);
}, msync: function(stream, buffer2, offset, length, mmapFlags) {
  if (!stream || !stream.stream_ops.msync) {
    return 0;
  }
  return stream.stream_ops.msync(stream, buffer2, offset, length, mmapFlags);
}, munmap: function(stream) {
  return 0;
}, ioctl: function(stream, cmd, arg) {
  if (!stream.stream_ops.ioctl) {
    throw new FS.ErrnoError(59);
  }
  return stream.stream_ops.ioctl(stream, cmd, arg);
}, readFile: function(path, opts) {
  opts = opts || {};
  opts.flags = opts.flags || "r";
  opts.encoding = opts.encoding || "binary";
  if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
    throw new Error('Invalid encoding type "' + opts.encoding + '"');
  }
  var ret;
  var stream = FS.open(path, opts.flags);
  var stat = FS.stat(path);
  var length = stat.size;
  var buf = new Uint8Array(length);
  FS.read(stream, buf, 0, length, 0);
  if (opts.encoding === "utf8") {
    ret = UTF8ArrayToString(buf, 0);
  } else if (opts.encoding === "binary") {
    ret = buf;
  }
  FS.close(stream);
  return ret;
}, writeFile: function(path, data, opts) {
  opts = opts || {};
  opts.flags = opts.flags || "w";
  var stream = FS.open(path, opts.flags, opts.mode);
  if (typeof data === "string") {
    var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
    var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
    FS.write(stream, buf, 0, actualNumBytes, void 0, opts.canOwn);
  } else if (ArrayBuffer.isView(data)) {
    FS.write(stream, data, 0, data.byteLength, void 0, opts.canOwn);
  } else {
    throw new Error("Unsupported data type");
  }
  FS.close(stream);
}, cwd: function() {
  return FS.currentPath;
}, chdir: function(path) {
  var lookup = FS.lookupPath(path, { follow: true });
  if (lookup.node === null) {
    throw new FS.ErrnoError(44);
  }
  if (!FS.isDir(lookup.node.mode)) {
    throw new FS.ErrnoError(54);
  }
  var err2 = FS.nodePermissions(lookup.node, "x");
  if (err2) {
    throw new FS.ErrnoError(err2);
  }
  FS.currentPath = lookup.path;
}, createDefaultDirectories: function() {
  FS.mkdir("/tmp");
  FS.mkdir("/home");
  FS.mkdir("/home/web_user");
}, createDefaultDevices: function() {
  FS.mkdir("/dev");
  FS.registerDevice(FS.makedev(1, 3), { read: function() {
    return 0;
  }, write: function(stream, buffer2, offset, length, pos) {
    return length;
  } });
  FS.mkdev("/dev/null", FS.makedev(1, 3));
  TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
  TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
  FS.mkdev("/dev/tty", FS.makedev(5, 0));
  FS.mkdev("/dev/tty1", FS.makedev(6, 0));
  var random_device;
  if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
    var randomBuffer = new Uint8Array(1);
    random_device = function() {
      crypto.getRandomValues(randomBuffer);
      return randomBuffer[0];
    };
  }
  if (!random_device) {
    random_device = function() {
      abort("random_device");
    };
  }
  FS.createDevice("/dev", "random", random_device);
  FS.createDevice("/dev", "urandom", random_device);
  FS.mkdir("/dev/shm");
  FS.mkdir("/dev/shm/tmp");
}, createSpecialDirectories: function() {
  FS.mkdir("/proc");
  FS.mkdir("/proc/self");
  FS.mkdir("/proc/self/fd");
  FS.mount({ mount: function() {
    var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
    node.node_ops = { lookup: function(parent, name) {
      var fd = +name;
      var stream = FS.getStream(fd);
      if (!stream)
        throw new FS.ErrnoError(8);
      var ret = { parent: null, mount: { mountpoint: "fake" }, node_ops: { readlink: function() {
        return stream.path;
      } } };
      ret.parent = ret;
      return ret;
    } };
    return node;
  } }, {}, "/proc/self/fd");
}, createStandardStreams: function() {
  if (cv["stdin"]) {
    FS.createDevice("/dev", "stdin", cv["stdin"]);
  } else {
    FS.symlink("/dev/tty", "/dev/stdin");
  }
  if (cv["stdout"]) {
    FS.createDevice("/dev", "stdout", null, cv["stdout"]);
  } else {
    FS.symlink("/dev/tty", "/dev/stdout");
  }
  if (cv["stderr"]) {
    FS.createDevice("/dev", "stderr", null, cv["stderr"]);
  } else {
    FS.symlink("/dev/tty1", "/dev/stderr");
  }
  FS.open("/dev/stdin", "r");
  FS.open("/dev/stdout", "w");
  FS.open("/dev/stderr", "w");
}, ensureErrnoError: function() {
  if (FS.ErrnoError)
    return;
  FS.ErrnoError = function ErrnoError(errno, node) {
    this.node = node;
    this.setErrno = function(errno2) {
      this.errno = errno2;
    };
    this.setErrno(errno);
    this.message = "FS error";
  };
  FS.ErrnoError.prototype = new Error();
  FS.ErrnoError.prototype.constructor = FS.ErrnoError;
  [44].forEach(function(code) {
    FS.genericErrors[code] = new FS.ErrnoError(code);
    FS.genericErrors[code].stack = "<generic error, no stack>";
  });
}, staticInit: function() {
  FS.ensureErrnoError();
  FS.nameTable = new Array(4096);
  FS.mount(MEMFS, {}, "/");
  FS.createDefaultDirectories();
  FS.createDefaultDevices();
  FS.createSpecialDirectories();
  FS.filesystems = { "MEMFS": MEMFS, "IDBFS": IDBFS };
}, init: function(input, output, error) {
  FS.init.initialized = true;
  FS.ensureErrnoError();
  cv["stdin"] = input || cv["stdin"];
  cv["stdout"] = output || cv["stdout"];
  cv["stderr"] = error || cv["stderr"];
  FS.createStandardStreams();
}, quit: function() {
  FS.init.initialized = false;
  var fflush = cv["_fflush"];
  if (fflush)
    fflush(0);
  for (var i = 0; i < FS.streams.length; i++) {
    var stream = FS.streams[i];
    if (!stream) {
      continue;
    }
    FS.close(stream);
  }
}, getMode: function(canRead, canWrite) {
  var mode = 0;
  if (canRead)
    mode |= 292 | 73;
  if (canWrite)
    mode |= 146;
  return mode;
}, joinPath: function(parts, forceRelative) {
  var path = PATH.join.apply(null, parts);
  if (forceRelative && path[0] == "/")
    path = path.substr(1);
  return path;
}, absolutePath: function(relative, base) {
  return PATH_FS.resolve(base, relative);
}, standardizePath: function(path) {
  return PATH.normalize(path);
}, findObject: function(path, dontResolveLastLink) {
  var ret = FS.analyzePath(path, dontResolveLastLink);
  if (ret.exists) {
    return ret.object;
  } else {
    ___setErrNo(ret.error);
    return null;
  }
}, analyzePath: function(path, dontResolveLastLink) {
  try {
    var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
    path = lookup.path;
  } catch (e) {
  }
  var ret = { isRoot: false, exists: false, error: 0, name: null, path: null, object: null, parentExists: false, parentPath: null, parentObject: null };
  try {
    var lookup = FS.lookupPath(path, { parent: true });
    ret.parentExists = true;
    ret.parentPath = lookup.path;
    ret.parentObject = lookup.node;
    ret.name = PATH.basename(path);
    lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
    ret.exists = true;
    ret.path = lookup.path;
    ret.object = lookup.node;
    ret.name = lookup.node.name;
    ret.isRoot = lookup.path === "/";
  } catch (e) {
    ret.error = e.errno;
  }
  return ret;
}, createFolder: function(parent, name, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(canRead, canWrite);
  return FS.mkdir(path, mode);
}, createPath: function(parent, path, canRead, canWrite) {
  parent = typeof parent === "string" ? parent : FS.getPath(parent);
  var parts = path.split("/").reverse();
  while (parts.length) {
    var part = parts.pop();
    if (!part)
      continue;
    var current = PATH.join2(parent, part);
    try {
      FS.mkdir(current);
    } catch (e) {
    }
    parent = current;
  }
  return current;
}, createFile: function(parent, name, properties, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(canRead, canWrite);
  return FS.create(path, mode);
}, createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
  var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
  var mode = FS.getMode(canRead, canWrite);
  var node = FS.create(path, mode);
  if (data) {
    if (typeof data === "string") {
      var arr = new Array(data.length);
      for (var i = 0, len = data.length; i < len; ++i)
        arr[i] = data.charCodeAt(i);
      data = arr;
    }
    FS.chmod(node, mode | 146);
    var stream = FS.open(node, "w");
    FS.write(stream, data, 0, data.length, 0, canOwn);
    FS.close(stream);
    FS.chmod(node, mode);
  }
  return node;
}, createDevice: function(parent, name, input, output) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(!!input, !!output);
  if (!FS.createDevice.major)
    FS.createDevice.major = 64;
  var dev = FS.makedev(FS.createDevice.major++, 0);
  FS.registerDevice(dev, { open: function(stream) {
    stream.seekable = false;
  }, close: function(stream) {
    if (output && output.buffer && output.buffer.length) {
      output(10);
    }
  }, read: function(stream, buffer2, offset, length, pos) {
    var bytesRead = 0;
    for (var i = 0; i < length; i++) {
      var result;
      try {
        result = input();
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
      if (result === void 0 && bytesRead === 0) {
        throw new FS.ErrnoError(6);
      }
      if (result === null || result === void 0)
        break;
      bytesRead++;
      buffer2[offset + i] = result;
    }
    if (bytesRead) {
      stream.node.timestamp = Date.now();
    }
    return bytesRead;
  }, write: function(stream, buffer2, offset, length, pos) {
    for (var i = 0; i < length; i++) {
      try {
        output(buffer2[offset + i]);
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
    }
    if (length) {
      stream.node.timestamp = Date.now();
    }
    return i;
  } });
  return FS.mkdev(path, mode, dev);
}, createLink: function(parent, name, target, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  return FS.symlink(target, path);
}, forceLoadFile: function(obj) {
  if (obj.isDevice || obj.isFolder || obj.link || obj.contents)
    return true;
  var success = true;
  if (typeof XMLHttpRequest !== "undefined") {
    throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
  } else if (read_) {
    try {
      obj.contents = intArrayFromString(read_(obj.url), true);
      obj.usedBytes = obj.contents.length;
    } catch (e) {
      success = false;
    }
  } else {
    throw new Error("Cannot load without read() or XMLHttpRequest.");
  }
  if (!success)
    ___setErrNo(29);
  return success;
}, createLazyFile: function(parent, name, url, canRead, canWrite) {
  function LazyUint8Array() {
    this.lengthKnown = false;
    this.chunks = [];
  }
  LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
    if (idx > this.length - 1 || idx < 0) {
      return void 0;
    }
    var chunkOffset = idx % this.chunkSize;
    var chunkNum = idx / this.chunkSize | 0;
    return this.getter(chunkNum)[chunkOffset];
  };
  LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
    this.getter = getter;
  };
  LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
    var xhr = new XMLHttpRequest();
    xhr.open("HEAD", url, false);
    xhr.send(null);
    if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
      throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
    var datalength = Number(xhr.getResponseHeader("Content-length"));
    var header;
    var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
    var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
    var chunkSize = 1024 * 1024;
    if (!hasByteServing)
      chunkSize = datalength;
    var doXHR = function(from, to) {
      if (from > to)
        throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
      if (to > datalength - 1)
        throw new Error("only " + datalength + " bytes available! programmer error!");
      var xhr2 = new XMLHttpRequest();
      xhr2.open("GET", url, false);
      if (datalength !== chunkSize)
        xhr2.setRequestHeader("Range", "bytes=" + from + "-" + to);
      if (typeof Uint8Array != "undefined")
        xhr2.responseType = "arraybuffer";
      if (xhr2.overrideMimeType) {
        xhr2.overrideMimeType("text/plain; charset=x-user-defined");
      }
      xhr2.send(null);
      if (!(xhr2.status >= 200 && xhr2.status < 300 || xhr2.status === 304))
        throw new Error("Couldn't load " + url + ". Status: " + xhr2.status);
      if (xhr2.response !== void 0) {
        return new Uint8Array(xhr2.response || []);
      } else {
        return intArrayFromString(xhr2.responseText || "", true);
      }
    };
    var lazyArray2 = this;
    lazyArray2.setDataGetter(function(chunkNum) {
      var start = chunkNum * chunkSize;
      var end = (chunkNum + 1) * chunkSize - 1;
      end = Math.min(end, datalength - 1);
      if (typeof lazyArray2.chunks[chunkNum] === "undefined") {
        lazyArray2.chunks[chunkNum] = doXHR(start, end);
      }
      if (typeof lazyArray2.chunks[chunkNum] === "undefined")
        throw new Error("doXHR failed!");
      return lazyArray2.chunks[chunkNum];
    });
    if (usesGzip || !datalength) {
      chunkSize = datalength = 1;
      datalength = this.getter(0).length;
      chunkSize = datalength;
      console.log("LazyFiles on gzip forces download of the whole file when length is accessed");
    }
    this._length = datalength;
    this._chunkSize = chunkSize;
    this.lengthKnown = true;
  };
  if (typeof XMLHttpRequest !== "undefined") {
    throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
    var lazyArray = new LazyUint8Array();
    var properties = { isDevice: false, contents: lazyArray };
  } else {
    var properties = { isDevice: false, url };
  }
  var node = FS.createFile(parent, name, properties, canRead, canWrite);
  if (properties.contents) {
    node.contents = properties.contents;
  } else if (properties.url) {
    node.contents = null;
    node.url = properties.url;
  }
  Object.defineProperties(node, { usedBytes: { get: function() {
    return this.contents.length;
  } } });
  var stream_ops = {};
  var keys = Object.keys(node.stream_ops);
  keys.forEach(function(key2) {
    var fn = node.stream_ops[key2];
    stream_ops[key2] = function forceLoadLazyFile() {
      if (!FS.forceLoadFile(node)) {
        throw new FS.ErrnoError(29);
      }
      return fn.apply(null, arguments);
    };
  });
  stream_ops.read = function stream_ops_read(stream, buffer2, offset, length, position) {
    if (!FS.forceLoadFile(node)) {
      throw new FS.ErrnoError(29);
    }
    var contents = stream.node.contents;
    if (position >= contents.length)
      return 0;
    var size = Math.min(contents.length - position, length);
    if (contents.slice) {
      for (var i = 0; i < size; i++) {
        buffer2[offset + i] = contents[position + i];
      }
    } else {
      for (var i = 0; i < size; i++) {
        buffer2[offset + i] = contents.get(position + i);
      }
    }
    return size;
  };
  node.stream_ops = stream_ops;
  return node;
}, createPreloadedFile: function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
  Browser.init();
  var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
  function processData(byteArray) {
    function finish(byteArray2) {
      if (preFinish)
        preFinish();
      if (!dontCreateFile) {
        FS.createDataFile(parent, name, byteArray2, canRead, canWrite, canOwn);
      }
      if (onload)
        onload();
      removeRunDependency();
    }
    var handled = false;
    cv["preloadPlugins"].forEach(function(plugin) {
      if (handled)
        return;
      if (plugin["canHandle"](fullname)) {
        plugin["handle"](byteArray, fullname, finish, function() {
          if (onerror)
            onerror();
          removeRunDependency();
        });
        handled = true;
      }
    });
    if (!handled)
      finish(byteArray);
  }
  addRunDependency();
  if (typeof url == "string") {
    Browser.asyncLoad(url, function(byteArray) {
      processData(byteArray);
    }, onerror);
  } else {
    processData(url);
  }
}, indexedDB: function() {
  return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
}, DB_NAME: function() {
  return "EM_FS_" + window.location.pathname;
}, DB_VERSION: 20, DB_STORE_NAME: "FILE_DATA", saveFilesToDB: function(paths, onload, onerror) {
  onload = onload || function() {
  };
  onerror = onerror || function() {
  };
  var indexedDB2 = FS.indexedDB();
  try {
    var openRequest = indexedDB2.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
    return onerror(e);
  }
  openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
    console.log("creating db");
    var db = openRequest.result;
    db.createObjectStore(FS.DB_STORE_NAME);
  };
  openRequest.onsuccess = function openRequest_onsuccess() {
    var db = openRequest.result;
    var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
    var files = transaction.objectStore(FS.DB_STORE_NAME);
    var ok = 0, fail = 0, total = paths.length;
    function finish() {
      if (fail == 0)
        onload();
      else
        onerror();
    }
    paths.forEach(function(path) {
      var putRequest = files.put(FS.analyzePath(path).object.contents, path);
      putRequest.onsuccess = function putRequest_onsuccess() {
        ok++;
        if (ok + fail == total)
          finish();
      };
      putRequest.onerror = function putRequest_onerror() {
        fail++;
        if (ok + fail == total)
          finish();
      };
    });
    transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
}, loadFilesFromDB: function(paths, onload, onerror) {
  onload = onload || function() {
  };
  onerror = onerror || function() {
  };
  var indexedDB2 = FS.indexedDB();
  try {
    var openRequest = indexedDB2.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
    return onerror(e);
  }
  openRequest.onupgradeneeded = onerror;
  openRequest.onsuccess = function openRequest_onsuccess() {
    var db = openRequest.result;
    try {
      var transaction = db.transaction([FS.DB_STORE_NAME], "readonly");
    } catch (e) {
      onerror(e);
      return;
    }
    var files = transaction.objectStore(FS.DB_STORE_NAME);
    var ok = 0, fail = 0, total = paths.length;
    function finish() {
      if (fail == 0)
        onload();
      else
        onerror();
    }
    paths.forEach(function(path) {
      var getRequest = files.get(path);
      getRequest.onsuccess = function getRequest_onsuccess() {
        if (FS.analyzePath(path).exists) {
          FS.unlink(path);
        }
        FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
        ok++;
        if (ok + fail == total)
          finish();
      };
      getRequest.onerror = function getRequest_onerror() {
        fail++;
        if (ok + fail == total)
          finish();
      };
    });
    transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
} };
var SYSCALLS = { DEFAULT_POLLMASK: 5, mappings: {}, umask: 511, calculateAt: function(dirfd, path) {
  if (path[0] !== "/") {
    var dir;
    if (dirfd === -100) {
      dir = FS.cwd();
    } else {
      var dirstream = FS.getStream(dirfd);
      if (!dirstream)
        throw new FS.ErrnoError(8);
      dir = dirstream.path;
    }
    path = PATH.join2(dir, path);
  }
  return path;
}, doStat: function(func, path, buf) {
  try {
    var stat = func(path);
  } catch (e) {
    if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
      return -54;
    }
    throw e;
  }
  HEAP32[buf >> 2] = stat.dev;
  HEAP32[buf + 4 >> 2] = 0;
  HEAP32[buf + 8 >> 2] = stat.ino;
  HEAP32[buf + 12 >> 2] = stat.mode;
  HEAP32[buf + 16 >> 2] = stat.nlink;
  HEAP32[buf + 20 >> 2] = stat.uid;
  HEAP32[buf + 24 >> 2] = stat.gid;
  HEAP32[buf + 28 >> 2] = stat.rdev;
  HEAP32[buf + 32 >> 2] = 0;
  tempI64 = [stat.size >>> 0, (tempDouble = stat.size, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 40 >> 2] = tempI64[0], HEAP32[buf + 44 >> 2] = tempI64[1];
  HEAP32[buf + 48 >> 2] = 4096;
  HEAP32[buf + 52 >> 2] = stat.blocks;
  HEAP32[buf + 56 >> 2] = stat.atime.getTime() / 1e3 | 0;
  HEAP32[buf + 60 >> 2] = 0;
  HEAP32[buf + 64 >> 2] = stat.mtime.getTime() / 1e3 | 0;
  HEAP32[buf + 68 >> 2] = 0;
  HEAP32[buf + 72 >> 2] = stat.ctime.getTime() / 1e3 | 0;
  HEAP32[buf + 76 >> 2] = 0;
  tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 80 >> 2] = tempI64[0], HEAP32[buf + 84 >> 2] = tempI64[1];
  return 0;
}, doMsync: function(addr, stream, len, flags) {
  var buffer2 = new Uint8Array(HEAPU8.subarray(addr, addr + len));
  FS.msync(stream, buffer2, 0, len, flags);
}, doMkdir: function(path, mode) {
  path = PATH.normalize(path);
  if (path[path.length - 1] === "/")
    path = path.substr(0, path.length - 1);
  FS.mkdir(path, mode, 0);
  return 0;
}, doMknod: function(path, mode, dev) {
  switch (mode & 61440) {
    case 32768:
    case 8192:
    case 24576:
    case 4096:
    case 49152:
      break;
    default:
      return -28;
  }
  FS.mknod(path, mode, dev);
  return 0;
}, doReadlink: function(path, buf, bufsize) {
  if (bufsize <= 0)
    return -28;
  var ret = FS.readlink(path);
  var len = Math.min(bufsize, lengthBytesUTF8(ret));
  var endChar = HEAP8[buf + len];
  stringToUTF8(ret, buf, bufsize + 1);
  HEAP8[buf + len] = endChar;
  return len;
}, doAccess: function(path, amode) {
  if (amode & ~7) {
    return -28;
  }
  var node;
  var lookup = FS.lookupPath(path, { follow: true });
  node = lookup.node;
  if (!node) {
    return -44;
  }
  var perms = "";
  if (amode & 4)
    perms += "r";
  if (amode & 2)
    perms += "w";
  if (amode & 1)
    perms += "x";
  if (perms && FS.nodePermissions(node, perms)) {
    return -2;
  }
  return 0;
}, doDup: function(path, flags, suggestFD) {
  var suggest = FS.getStream(suggestFD);
  if (suggest)
    FS.close(suggest);
  return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
}, doReadv: function(stream, iov, iovcnt, offset) {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = HEAP32[iov + i * 8 >> 2];
    var len = HEAP32[iov + (i * 8 + 4) >> 2];
    var curr = FS.read(stream, HEAP8, ptr, len, offset);
    if (curr < 0)
      return -1;
    ret += curr;
    if (curr < len)
      break;
  }
  return ret;
}, doWritev: function(stream, iov, iovcnt, offset) {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = HEAP32[iov + i * 8 >> 2];
    var len = HEAP32[iov + (i * 8 + 4) >> 2];
    var curr = FS.write(stream, HEAP8, ptr, len, offset);
    if (curr < 0)
      return -1;
    ret += curr;
  }
  return ret;
}, varargs: 0, get: function(varargs) {
  SYSCALLS.varargs += 4;
  var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
  return ret;
}, getStr: function() {
  var ret = UTF8ToString(SYSCALLS.get());
  return ret;
}, getStreamFromFD: function(fd) {
  if (fd === void 0)
    fd = SYSCALLS.get();
  var stream = FS.getStream(fd);
  if (!stream)
    throw new FS.ErrnoError(8);
  return stream;
}, get64: function() {
  var low = SYSCALLS.get();
  SYSCALLS.get();
  return low;
}, getZero: function() {
  SYSCALLS.get();
} };
function ___syscall221(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(), cmd = SYSCALLS.get();
    switch (cmd) {
      case 0: {
        var arg = SYSCALLS.get();
        if (arg < 0) {
          return -28;
        }
        var newStream;
        newStream = FS.open(stream.path, stream.flags, 0, arg);
        return newStream.fd;
      }
      case 1:
      case 2:
        return 0;
      case 3:
        return stream.flags;
      case 4: {
        var arg = SYSCALLS.get();
        stream.flags |= arg;
        return 0;
      }
      case 12: {
        var arg = SYSCALLS.get();
        var offset = 0;
        HEAP16[arg + offset >> 1] = 2;
        return 0;
      }
      case 13:
      case 14:
        return 0;
      case 16:
      case 8:
        return -28;
      case 9:
        ___setErrNo(28);
        return -1;
      default: {
        return -28;
      }
    }
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
      abort(e);
    return -e.errno;
  }
}
function ___syscall3(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(), buf = SYSCALLS.get(), count = SYSCALLS.get();
    return FS.read(stream, HEAP8, buf, count);
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
      abort(e);
    return -e.errno;
  }
}
function ___syscall4(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(), buf = SYSCALLS.get(), count = SYSCALLS.get();
    return FS.write(stream, HEAP8, buf, count);
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
      abort(e);
    return -e.errno;
  }
}
function ___syscall5(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var pathname = SYSCALLS.getStr(), flags = SYSCALLS.get(), mode = SYSCALLS.get();
    var stream = FS.open(pathname, flags, mode);
    return stream.fd;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
      abort(e);
    return -e.errno;
  }
}
function ___syscall54(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(), op = SYSCALLS.get();
    switch (op) {
      case 21509:
      case 21505: {
        if (!stream.tty)
          return -59;
        return 0;
      }
      case 21510:
      case 21511:
      case 21512:
      case 21506:
      case 21507:
      case 21508: {
        if (!stream.tty)
          return -59;
        return 0;
      }
      case 21519: {
        if (!stream.tty)
          return -59;
        var argp = SYSCALLS.get();
        HEAP32[argp >> 2] = 0;
        return 0;
      }
      case 21520: {
        if (!stream.tty)
          return -59;
        return -28;
      }
      case 21531: {
        var argp = SYSCALLS.get();
        return FS.ioctl(stream, op, argp);
      }
      case 21523: {
        if (!stream.tty)
          return -59;
        return 0;
      }
      case 21524: {
        if (!stream.tty)
          return -59;
        return 0;
      }
      default:
        abort("bad ioctl syscall " + op);
    }
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
      abort(e);
    return -e.errno;
  }
}
function __emscripten_syscall_munmap(addr, len) {
  if (addr === -1 || len === 0) {
    return -28;
  }
  var info = SYSCALLS.mappings[addr];
  if (!info)
    return 0;
  if (len === info.len) {
    var stream = FS.getStream(info.fd);
    SYSCALLS.doMsync(addr, stream, len, info.flags);
    FS.munmap(stream);
    SYSCALLS.mappings[addr] = null;
    if (info.allocated) {
      _free(info.malloc);
    }
  }
  return 0;
}
function ___syscall91(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var addr = SYSCALLS.get(), len = SYSCALLS.get();
    return __emscripten_syscall_munmap(addr, len);
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
      abort(e);
    return -e.errno;
  }
}
function ___unlock() {
}
var tupleRegistrations = {};
function runDestructors(destructors) {
  while (destructors.length) {
    var ptr = destructors.pop();
    var del = destructors.pop();
    del(ptr);
  }
}
function simpleReadValueFromPointer(pointer) {
  return this["fromWireType"](HEAPU32[pointer >> 2]);
}
var awaitingDependencies = {};
var registeredTypes = {};
var typeDependencies = {};
var char_0 = 48;
var char_9 = 57;
function makeLegalFunctionName(name) {
  if (name === void 0) {
    return "_unknown";
  }
  name = name.replace(/[^a-zA-Z0-9_]/g, "$");
  var f = name.charCodeAt(0);
  if (f >= char_0 && f <= char_9) {
    return "_" + name;
  } else {
    return name;
  }
}
function createNamedFunction(name, body) {
  name = makeLegalFunctionName(name);
  return new Function("body", "return function " + name + '() {\n    "use strict";    return body.apply(this, arguments);\n};\n')(body);
}
function extendError(baseErrorType, errorName) {
  var errorClass = createNamedFunction(errorName, function(message) {
    this.name = errorName;
    this.message = message;
    var stack = new Error(message).stack;
    if (stack !== void 0) {
      this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
    }
  });
  errorClass.prototype = Object.create(baseErrorType.prototype);
  errorClass.prototype.constructor = errorClass;
  errorClass.prototype.toString = function() {
    if (this.message === void 0) {
      return this.name;
    } else {
      return this.name + ": " + this.message;
    }
  };
  return errorClass;
}
var InternalError = void 0;
function throwInternalError(message) {
  throw new InternalError(message);
}
function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
  myTypes.forEach(function(type) {
    typeDependencies[type] = dependentTypes;
  });
  function onComplete(typeConverters2) {
    var myTypeConverters = getTypeConverters(typeConverters2);
    if (myTypeConverters.length !== myTypes.length) {
      throwInternalError("Mismatched type converter count");
    }
    for (var i = 0; i < myTypes.length; ++i) {
      registerType(myTypes[i], myTypeConverters[i]);
    }
  }
  var typeConverters = new Array(dependentTypes.length);
  var unregisteredTypes = [];
  var registered = 0;
  dependentTypes.forEach(function(dt, i) {
    if (registeredTypes.hasOwnProperty(dt)) {
      typeConverters[i] = registeredTypes[dt];
    } else {
      unregisteredTypes.push(dt);
      if (!awaitingDependencies.hasOwnProperty(dt)) {
        awaitingDependencies[dt] = [];
      }
      awaitingDependencies[dt].push(function() {
        typeConverters[i] = registeredTypes[dt];
        ++registered;
        if (registered === unregisteredTypes.length) {
          onComplete(typeConverters);
        }
      });
    }
  });
  if (unregisteredTypes.length === 0) {
    onComplete(typeConverters);
  }
}
function __embind_finalize_value_array(rawTupleType) {
  var reg = tupleRegistrations[rawTupleType];
  delete tupleRegistrations[rawTupleType];
  var elements = reg.elements;
  var elementsLength = elements.length;
  var elementTypes = elements.map(function(elt) {
    return elt.getterReturnType;
  }).concat(elements.map(function(elt) {
    return elt.setterArgumentType;
  }));
  var rawConstructor = reg.rawConstructor;
  var rawDestructor = reg.rawDestructor;
  whenDependentTypesAreResolved([rawTupleType], elementTypes, function(elementTypes2) {
    elements.forEach(function(elt, i) {
      var getterReturnType = elementTypes2[i];
      var getter = elt.getter;
      var getterContext = elt.getterContext;
      var setterArgumentType = elementTypes2[i + elementsLength];
      var setter = elt.setter;
      var setterContext = elt.setterContext;
      elt.read = function(ptr) {
        return getterReturnType["fromWireType"](getter(getterContext, ptr));
      };
      elt.write = function(ptr, o) {
        var destructors = [];
        setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
        runDestructors(destructors);
      };
    });
    return [{ name: reg.name, "fromWireType": function(ptr) {
      var rv = new Array(elementsLength);
      for (var i = 0; i < elementsLength; ++i) {
        rv[i] = elements[i].read(ptr);
      }
      rawDestructor(ptr);
      return rv;
    }, "toWireType": function(destructors, o) {
      if (elementsLength !== o.length) {
        throw new TypeError("Incorrect number of tuple elements for " + reg.name + ": expected=" + elementsLength + ", actual=" + o.length);
      }
      var ptr = rawConstructor();
      for (var i = 0; i < elementsLength; ++i) {
        elements[i].write(ptr, o[i]);
      }
      if (destructors !== null) {
        destructors.push(rawDestructor, ptr);
      }
      return ptr;
    }, "argPackAdvance": 8, "readValueFromPointer": simpleReadValueFromPointer, destructorFunction: rawDestructor }];
  });
}
var structRegistrations = {};
function __embind_finalize_value_object(structType) {
  var reg = structRegistrations[structType];
  delete structRegistrations[structType];
  var rawConstructor = reg.rawConstructor;
  var rawDestructor = reg.rawDestructor;
  var fieldRecords = reg.fields;
  var fieldTypes = fieldRecords.map(function(field) {
    return field.getterReturnType;
  }).concat(fieldRecords.map(function(field) {
    return field.setterArgumentType;
  }));
  whenDependentTypesAreResolved([structType], fieldTypes, function(fieldTypes2) {
    var fields = {};
    fieldRecords.forEach(function(field, i) {
      var fieldName = field.fieldName;
      var getterReturnType = fieldTypes2[i];
      var getter = field.getter;
      var getterContext = field.getterContext;
      var setterArgumentType = fieldTypes2[i + fieldRecords.length];
      var setter = field.setter;
      var setterContext = field.setterContext;
      fields[fieldName] = { read: function(ptr) {
        return getterReturnType["fromWireType"](getter(getterContext, ptr));
      }, write: function(ptr, o) {
        var destructors = [];
        setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
        runDestructors(destructors);
      } };
    });
    return [{ name: reg.name, "fromWireType": function(ptr) {
      var rv = {};
      for (var i in fields) {
        rv[i] = fields[i].read(ptr);
      }
      rawDestructor(ptr);
      return rv;
    }, "toWireType": function(destructors, o) {
      for (var fieldName in fields) {
        if (!(fieldName in o)) {
          throw new TypeError("Missing field");
        }
      }
      var ptr = rawConstructor();
      for (fieldName in fields) {
        fields[fieldName].write(ptr, o[fieldName]);
      }
      if (destructors !== null) {
        destructors.push(rawDestructor, ptr);
      }
      return ptr;
    }, "argPackAdvance": 8, "readValueFromPointer": simpleReadValueFromPointer, destructorFunction: rawDestructor }];
  });
}
function getShiftFromSize(size) {
  switch (size) {
    case 1:
      return 0;
    case 2:
      return 1;
    case 4:
      return 2;
    case 8:
      return 3;
    default:
      throw new TypeError("Unknown type size: " + size);
  }
}
function embind_init_charCodes() {
  var codes = new Array(256);
  for (var i = 0; i < 256; ++i) {
    codes[i] = String.fromCharCode(i);
  }
  embind_charCodes = codes;
}
var embind_charCodes = void 0;
function readLatin1String(ptr) {
  var ret = "";
  var c = ptr;
  while (HEAPU8[c]) {
    ret += embind_charCodes[HEAPU8[c++]];
  }
  return ret;
}
var BindingError = void 0;
function throwBindingError(message) {
  throw new BindingError(message);
}
function registerType(rawType, registeredInstance, options) {
  options = options || {};
  if (!("argPackAdvance" in registeredInstance)) {
    throw new TypeError("registerType registeredInstance requires argPackAdvance");
  }
  var name = registeredInstance.name;
  if (!rawType) {
    throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
  }
  if (registeredTypes.hasOwnProperty(rawType)) {
    if (options.ignoreDuplicateRegistrations) {
      return;
    } else {
      throwBindingError("Cannot register type '" + name + "' twice");
    }
  }
  registeredTypes[rawType] = registeredInstance;
  delete typeDependencies[rawType];
  if (awaitingDependencies.hasOwnProperty(rawType)) {
    var callbacks = awaitingDependencies[rawType];
    delete awaitingDependencies[rawType];
    callbacks.forEach(function(cb) {
      cb();
    });
  }
}
function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
  var shift = getShiftFromSize(size);
  name = readLatin1String(name);
  registerType(rawType, { name, "fromWireType": function(wt) {
    return !!wt;
  }, "toWireType": function(destructors, o) {
    return o ? trueValue : falseValue;
  }, "argPackAdvance": 8, "readValueFromPointer": function(pointer) {
    var heap;
    if (size === 1) {
      heap = HEAP8;
    } else if (size === 2) {
      heap = HEAP16;
    } else if (size === 4) {
      heap = HEAP32;
    } else {
      throw new TypeError("Unknown boolean type size: " + name);
    }
    return this["fromWireType"](heap[pointer >> shift]);
  }, destructorFunction: null });
}
function ClassHandle_isAliasOf(other) {
  if (!(this instanceof ClassHandle)) {
    return false;
  }
  if (!(other instanceof ClassHandle)) {
    return false;
  }
  var leftClass = this.$$.ptrType.registeredClass;
  var left = this.$$.ptr;
  var rightClass = other.$$.ptrType.registeredClass;
  var right = other.$$.ptr;
  while (leftClass.baseClass) {
    left = leftClass.upcast(left);
    leftClass = leftClass.baseClass;
  }
  while (rightClass.baseClass) {
    right = rightClass.upcast(right);
    rightClass = rightClass.baseClass;
  }
  return leftClass === rightClass && left === right;
}
function shallowCopyInternalPointer(o) {
  return { count: o.count, deleteScheduled: o.deleteScheduled, preservePointerOnDelete: o.preservePointerOnDelete, ptr: o.ptr, ptrType: o.ptrType, smartPtr: o.smartPtr, smartPtrType: o.smartPtrType };
}
function throwInstanceAlreadyDeleted(obj) {
  function getInstanceTypeName(handle) {
    return handle.$$.ptrType.registeredClass.name;
  }
  throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
}
var finalizationGroup = false;
function detachFinalizer(handle) {
}
function runDestructor($$) {
  if ($$.smartPtr) {
    $$.smartPtrType.rawDestructor($$.smartPtr);
  } else {
    $$.ptrType.registeredClass.rawDestructor($$.ptr);
  }
}
function releaseClassHandle($$) {
  $$.count.value -= 1;
  var toDelete = $$.count.value === 0;
  if (toDelete) {
    runDestructor($$);
  }
}
function attachFinalizer(handle) {
  if (typeof FinalizationGroup === "undefined") {
    attachFinalizer = function(handle2) {
      return handle2;
    };
    return handle;
  }
  finalizationGroup = new FinalizationGroup(function(iter) {
    for (var result = iter.next(); !result.done; result = iter.next()) {
      var $$ = result.value;
      if (!$$.ptr) {
        console.warn("object already deleted: " + $$.ptr);
      } else {
        releaseClassHandle($$);
      }
    }
  });
  attachFinalizer = function(handle2) {
    finalizationGroup.register(handle2, handle2.$$, handle2.$$);
    return handle2;
  };
  detachFinalizer = function(handle2) {
    finalizationGroup.unregister(handle2.$$);
  };
  return attachFinalizer(handle);
}
function ClassHandle_clone() {
  if (!this.$$.ptr) {
    throwInstanceAlreadyDeleted(this);
  }
  if (this.$$.preservePointerOnDelete) {
    this.$$.count.value += 1;
    return this;
  } else {
    var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), { $$: { value: shallowCopyInternalPointer(this.$$) } }));
    clone.$$.count.value += 1;
    clone.$$.deleteScheduled = false;
    return clone;
  }
}
function ClassHandle_delete() {
  if (!this.$$.ptr) {
    throwInstanceAlreadyDeleted(this);
  }
  if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
    throwBindingError("Object already scheduled for deletion");
  }
  detachFinalizer(this);
  releaseClassHandle(this.$$);
  if (!this.$$.preservePointerOnDelete) {
    this.$$.smartPtr = void 0;
    this.$$.ptr = void 0;
  }
}
function ClassHandle_isDeleted() {
  return !this.$$.ptr;
}
var delayFunction = void 0;
var deletionQueue = [];
function flushPendingDeletes() {
  while (deletionQueue.length) {
    var obj = deletionQueue.pop();
    obj.$$.deleteScheduled = false;
    obj["delete"]();
  }
}
function ClassHandle_deleteLater() {
  if (!this.$$.ptr) {
    throwInstanceAlreadyDeleted(this);
  }
  if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
    throwBindingError("Object already scheduled for deletion");
  }
  deletionQueue.push(this);
  if (deletionQueue.length === 1 && delayFunction) {
    delayFunction(flushPendingDeletes);
  }
  this.$$.deleteScheduled = true;
  return this;
}
function init_ClassHandle() {
  ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
  ClassHandle.prototype["clone"] = ClassHandle_clone;
  ClassHandle.prototype["delete"] = ClassHandle_delete;
  ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
  ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater;
}
function ClassHandle() {
}
var registeredPointers = {};
function ensureOverloadTable(proto, methodName, humanName) {
  if (proto[methodName].overloadTable === void 0) {
    var prevFunc = proto[methodName];
    proto[methodName] = function() {
      if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
        throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
      }
      return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
    };
    proto[methodName].overloadTable = [];
    proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
  }
}
function exposePublicSymbol(name, value, numArguments) {
  if (cv.hasOwnProperty(name)) {
    if (numArguments === void 0 || cv[name].overloadTable !== void 0 && cv[name].overloadTable[numArguments] !== void 0) {
      throwBindingError("Cannot register public name '" + name + "' twice");
    }
    ensureOverloadTable(cv, name, name);
    if (cv.hasOwnProperty(numArguments)) {
      throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
    }
    cv[name].overloadTable[numArguments] = value;
  } else {
    cv[name] = value;
    if (numArguments !== void 0) {
      cv[name].numArguments = numArguments;
    }
  }
}
function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
  this.name = name;
  this.constructor = constructor;
  this.instancePrototype = instancePrototype;
  this.rawDestructor = rawDestructor;
  this.baseClass = baseClass;
  this.getActualType = getActualType;
  this.upcast = upcast;
  this.downcast = downcast;
  this.pureVirtualFunctions = [];
}
function upcastPointer(ptr, ptrClass, desiredClass) {
  while (ptrClass !== desiredClass) {
    if (!ptrClass.upcast) {
      throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
    }
    ptr = ptrClass.upcast(ptr);
    ptrClass = ptrClass.baseClass;
  }
  return ptr;
}
function constNoSmartPtrRawPointerToWireType(destructors, handle) {
  if (handle === null) {
    if (this.isReference) {
      throwBindingError("null is not a valid " + this.name);
    }
    return 0;
  }
  if (!handle.$$) {
    throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
  }
  if (!handle.$$.ptr) {
    throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
  }
  var handleClass = handle.$$.ptrType.registeredClass;
  var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  return ptr;
}
function genericPointerToWireType(destructors, handle) {
  var ptr;
  if (handle === null) {
    if (this.isReference) {
      throwBindingError("null is not a valid " + this.name);
    }
    if (this.isSmartPointer) {
      ptr = this.rawConstructor();
      if (destructors !== null) {
        destructors.push(this.rawDestructor, ptr);
      }
      return ptr;
    } else {
      return 0;
    }
  }
  if (!handle.$$) {
    throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
  }
  if (!handle.$$.ptr) {
    throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
  }
  if (!this.isConst && handle.$$.ptrType.isConst) {
    throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
  }
  var handleClass = handle.$$.ptrType.registeredClass;
  ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  if (this.isSmartPointer) {
    if (handle.$$.smartPtr === void 0) {
      throwBindingError("Passing raw pointer to smart pointer is illegal");
    }
    switch (this.sharingPolicy) {
      case 0:
        if (handle.$$.smartPtrType === this) {
          ptr = handle.$$.smartPtr;
        } else {
          throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
        }
        break;
      case 1:
        ptr = handle.$$.smartPtr;
        break;
      case 2:
        if (handle.$$.smartPtrType === this) {
          ptr = handle.$$.smartPtr;
        } else {
          var clonedHandle = handle["clone"]();
          ptr = this.rawShare(ptr, __emval_register(function() {
            clonedHandle["delete"]();
          }));
          if (destructors !== null) {
            destructors.push(this.rawDestructor, ptr);
          }
        }
        break;
      default:
        throwBindingError("Unsupporting sharing policy");
    }
  }
  return ptr;
}
function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
  if (handle === null) {
    if (this.isReference) {
      throwBindingError("null is not a valid " + this.name);
    }
    return 0;
  }
  if (!handle.$$) {
    throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
  }
  if (!handle.$$.ptr) {
    throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
  }
  if (handle.$$.ptrType.isConst) {
    throwBindingError("Cannot convert argument of type " + handle.$$.ptrType.name + " to parameter type " + this.name);
  }
  var handleClass = handle.$$.ptrType.registeredClass;
  var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  return ptr;
}
function RegisteredPointer_getPointee(ptr) {
  if (this.rawGetPointee) {
    ptr = this.rawGetPointee(ptr);
  }
  return ptr;
}
function RegisteredPointer_destructor(ptr) {
  if (this.rawDestructor) {
    this.rawDestructor(ptr);
  }
}
function RegisteredPointer_deleteObject(handle) {
  if (handle !== null) {
    handle["delete"]();
  }
}
function downcastPointer(ptr, ptrClass, desiredClass) {
  if (ptrClass === desiredClass) {
    return ptr;
  }
  if (desiredClass.baseClass === void 0) {
    return null;
  }
  var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
  if (rv === null) {
    return null;
  }
  return desiredClass.downcast(rv);
}
function getInheritedInstanceCount() {
  return Object.keys(registeredInstances).length;
}
function getLiveInheritedInstances() {
  var rv = [];
  for (var k in registeredInstances) {
    if (registeredInstances.hasOwnProperty(k)) {
      rv.push(registeredInstances[k]);
    }
  }
  return rv;
}
function setDelayFunction(fn) {
  delayFunction = fn;
  if (deletionQueue.length && delayFunction) {
    delayFunction(flushPendingDeletes);
  }
}
function init_embind() {
  cv["getInheritedInstanceCount"] = getInheritedInstanceCount;
  cv["getLiveInheritedInstances"] = getLiveInheritedInstances;
  cv["flushPendingDeletes"] = flushPendingDeletes;
  cv["setDelayFunction"] = setDelayFunction;
}
var registeredInstances = {};
function getBasestPointer(class_, ptr) {
  if (ptr === void 0) {
    throwBindingError("ptr should not be undefined");
  }
  while (class_.baseClass) {
    ptr = class_.upcast(ptr);
    class_ = class_.baseClass;
  }
  return ptr;
}
function getInheritedInstance(class_, ptr) {
  ptr = getBasestPointer(class_, ptr);
  return registeredInstances[ptr];
}
function makeClassHandle(prototype, record) {
  if (!record.ptrType || !record.ptr) {
    throwInternalError("makeClassHandle requires ptr and ptrType");
  }
  var hasSmartPtrType = !!record.smartPtrType;
  var hasSmartPtr = !!record.smartPtr;
  if (hasSmartPtrType !== hasSmartPtr) {
    throwInternalError("Both smartPtrType and smartPtr must be specified");
  }
  record.count = { value: 1 };
  return attachFinalizer(Object.create(prototype, { $$: { value: record } }));
}
function RegisteredPointer_fromWireType(ptr) {
  var rawPointer = this.getPointee(ptr);
  if (!rawPointer) {
    this.destructor(ptr);
    return null;
  }
  var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
  if (registeredInstance !== void 0) {
    if (registeredInstance.$$.count.value === 0) {
      registeredInstance.$$.ptr = rawPointer;
      registeredInstance.$$.smartPtr = ptr;
      return registeredInstance["clone"]();
    } else {
      var rv = registeredInstance["clone"]();
      this.destructor(ptr);
      return rv;
    }
  }
  function makeDefaultHandle() {
    if (this.isSmartPointer) {
      return makeClassHandle(this.registeredClass.instancePrototype, { ptrType: this.pointeeType, ptr: rawPointer, smartPtrType: this, smartPtr: ptr });
    } else {
      return makeClassHandle(this.registeredClass.instancePrototype, { ptrType: this, ptr });
    }
  }
  var actualType = this.registeredClass.getActualType(rawPointer);
  var registeredPointerRecord = registeredPointers[actualType];
  if (!registeredPointerRecord) {
    return makeDefaultHandle.call(this);
  }
  var toType;
  if (this.isConst) {
    toType = registeredPointerRecord.constPointerType;
  } else {
    toType = registeredPointerRecord.pointerType;
  }
  var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
  if (dp === null) {
    return makeDefaultHandle.call(this);
  }
  if (this.isSmartPointer) {
    return makeClassHandle(toType.registeredClass.instancePrototype, { ptrType: toType, ptr: dp, smartPtrType: this, smartPtr: ptr });
  } else {
    return makeClassHandle(toType.registeredClass.instancePrototype, { ptrType: toType, ptr: dp });
  }
}
function init_RegisteredPointer() {
  RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
  RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
  RegisteredPointer.prototype["argPackAdvance"] = 8;
  RegisteredPointer.prototype["readValueFromPointer"] = simpleReadValueFromPointer;
  RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
  RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType;
}
function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
  this.name = name;
  this.registeredClass = registeredClass;
  this.isReference = isReference;
  this.isConst = isConst;
  this.isSmartPointer = isSmartPointer;
  this.pointeeType = pointeeType;
  this.sharingPolicy = sharingPolicy;
  this.rawGetPointee = rawGetPointee;
  this.rawConstructor = rawConstructor;
  this.rawShare = rawShare;
  this.rawDestructor = rawDestructor;
  if (!isSmartPointer && registeredClass.baseClass === void 0) {
    if (isConst) {
      this["toWireType"] = constNoSmartPtrRawPointerToWireType;
      this.destructorFunction = null;
    } else {
      this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
      this.destructorFunction = null;
    }
  } else {
    this["toWireType"] = genericPointerToWireType;
  }
}
function replacePublicSymbol(name, value, numArguments) {
  if (!cv.hasOwnProperty(name)) {
    throwInternalError("Replacing nonexistant public symbol");
  }
  if (cv[name].overloadTable !== void 0 && numArguments !== void 0) {
    cv[name].overloadTable[numArguments] = value;
  } else {
    cv[name] = value;
    cv[name].argCount = numArguments;
  }
}
function embind__requireFunction(signature, rawFunction) {
  signature = readLatin1String(signature);
  function makeDynCaller(dynCall) {
    var args = [];
    for (var i = 1; i < signature.length; ++i) {
      args.push("a" + i);
    }
    var name = "dynCall_" + signature + "_" + rawFunction;
    var body = "return function " + name + "(" + args.join(", ") + ") {\n";
    body += "    return dynCall(rawFunction" + (args.length ? ", " : "") + args.join(", ") + ");\n";
    body += "};\n";
    return new Function("dynCall", "rawFunction", body)(dynCall, rawFunction);
  }
  var fp;
  if (cv["FUNCTION_TABLE_" + signature] !== void 0) {
    fp = cv["FUNCTION_TABLE_" + signature][rawFunction];
  } else if (typeof FUNCTION_TABLE !== "undefined") {
    fp = FUNCTION_TABLE[rawFunction];
  } else {
    var dc = cv["dynCall_" + signature];
    if (dc === void 0) {
      dc = cv["dynCall_" + signature.replace(/f/g, "d")];
      if (dc === void 0) {
        throwBindingError("No dynCall invoker for signature: " + signature);
      }
    }
    fp = makeDynCaller(dc);
  }
  if (typeof fp !== "function") {
    throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
  }
  return fp;
}
var UnboundTypeError = void 0;
function getTypeName(type) {
  var ptr = ___getTypeName(type);
  var rv = readLatin1String(ptr);
  _free(ptr);
  return rv;
}
function throwUnboundTypeError(message, types) {
  var unboundTypes = [];
  var seen = {};
  function visit(type) {
    if (seen[type]) {
      return;
    }
    if (registeredTypes[type]) {
      return;
    }
    if (typeDependencies[type]) {
      typeDependencies[type].forEach(visit);
      return;
    }
    unboundTypes.push(type);
    seen[type] = true;
  }
  types.forEach(visit);
  throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([", "]));
}
function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
  name = readLatin1String(name);
  getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
  if (upcast) {
    upcast = embind__requireFunction(upcastSignature, upcast);
  }
  if (downcast) {
    downcast = embind__requireFunction(downcastSignature, downcast);
  }
  rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
  var legalFunctionName = makeLegalFunctionName(name);
  exposePublicSymbol(legalFunctionName, function() {
    throwUnboundTypeError("Cannot construct " + name + " due to unbound types", [baseClassRawType]);
  });
  whenDependentTypesAreResolved([rawType, rawPointerType, rawConstPointerType], baseClassRawType ? [baseClassRawType] : [], function(base) {
    base = base[0];
    var baseClass;
    var basePrototype;
    if (baseClassRawType) {
      baseClass = base.registeredClass;
      basePrototype = baseClass.instancePrototype;
    } else {
      basePrototype = ClassHandle.prototype;
    }
    var constructor = createNamedFunction(legalFunctionName, function() {
      if (Object.getPrototypeOf(this) !== instancePrototype) {
        throw new BindingError("Use 'new' to construct " + name);
      }
      if (registeredClass.constructor_body === void 0) {
        throw new BindingError(name + " has no accessible constructor");
      }
      var body = registeredClass.constructor_body[arguments.length];
      if (body === void 0) {
        throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
      }
      return body.apply(this, arguments);
    });
    var instancePrototype = Object.create(basePrototype, { constructor: { value: constructor } });
    constructor.prototype = instancePrototype;
    var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
    var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
    var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
    var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
    registeredPointers[rawType] = { pointerType: pointerConverter, constPointerType: constPointerConverter };
    replacePublicSymbol(legalFunctionName, constructor);
    return [referenceConverter, pointerConverter, constPointerConverter];
  });
}
function new_(constructor, argumentList) {
  if (!(constructor instanceof Function)) {
    throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function");
  }
  var dummy = createNamedFunction(constructor.name || "unknownFunctionName", function() {
  });
  dummy.prototype = constructor.prototype;
  var obj = new dummy();
  var r = constructor.apply(obj, argumentList);
  return r instanceof Object ? r : obj;
}
function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
  var argCount = argTypes.length;
  if (argCount < 2) {
    throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
  }
  var isClassMethodFunc = argTypes[1] !== null && classType !== null;
  var needsDestructorStack = false;
  for (var i = 1; i < argTypes.length; ++i) {
    if (argTypes[i] !== null && argTypes[i].destructorFunction === void 0) {
      needsDestructorStack = true;
      break;
    }
  }
  var returns = argTypes[0].name !== "void";
  var argsList = "";
  var argsListWired = "";
  for (var i = 0; i < argCount - 2; ++i) {
    argsList += (i !== 0 ? ", " : "") + "arg" + i;
    argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
  }
  var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\nif (arguments.length !== " + (argCount - 2) + ") {\nthrowBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n}\n";
  if (needsDestructorStack) {
    invokerFnBody += "var destructors = [];\n";
  }
  var dtorStack = needsDestructorStack ? "destructors" : "null";
  var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
  var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
  if (isClassMethodFunc) {
    invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
  }
  for (var i = 0; i < argCount - 2; ++i) {
    invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
    args1.push("argType" + i);
    args2.push(argTypes[i + 2]);
  }
  if (isClassMethodFunc) {
    argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
  }
  invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
  if (needsDestructorStack) {
    invokerFnBody += "runDestructors(destructors);\n";
  } else {
    for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
      var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
      if (argTypes[i].destructorFunction !== null) {
        invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
        args1.push(paramName + "_dtor");
        args2.push(argTypes[i].destructorFunction);
      }
    }
  }
  if (returns) {
    invokerFnBody += "var ret = retType.fromWireType(rv);\nreturn ret;\n";
  }
  invokerFnBody += "}\n";
  args1.push(invokerFnBody);
  var invokerFunction = new_(Function, args1).apply(null, args2);
  return invokerFunction;
}
function heap32VectorToArray(count, firstElement) {
  var array = [];
  for (var i = 0; i < count; i++) {
    array.push(HEAP32[(firstElement >> 2) + i]);
  }
  return array;
}
function __embind_register_class_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, fn) {
  var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
  methodName = readLatin1String(methodName);
  rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
  whenDependentTypesAreResolved([], [rawClassType], function(classType) {
    classType = classType[0];
    var humanName = classType.name + "." + methodName;
    function unboundTypesHandler() {
      throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes);
    }
    var proto = classType.registeredClass.constructor;
    if (proto[methodName] === void 0) {
      unboundTypesHandler.argCount = argCount - 1;
      proto[methodName] = unboundTypesHandler;
    } else {
      ensureOverloadTable(proto, methodName, humanName);
      proto[methodName].overloadTable[argCount - 1] = unboundTypesHandler;
    }
    whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
      var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
      var func = craftInvokerFunction(humanName, invokerArgsArray, null, rawInvoker, fn);
      if (proto[methodName].overloadTable === void 0) {
        func.argCount = argCount - 1;
        proto[methodName] = func;
      } else {
        proto[methodName].overloadTable[argCount - 1] = func;
      }
      return [];
    });
    return [];
  });
}
function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
  var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
  invoker = embind__requireFunction(invokerSignature, invoker);
  whenDependentTypesAreResolved([], [rawClassType], function(classType) {
    classType = classType[0];
    var humanName = "constructor " + classType.name;
    if (classType.registeredClass.constructor_body === void 0) {
      classType.registeredClass.constructor_body = [];
    }
    if (classType.registeredClass.constructor_body[argCount - 1] !== void 0) {
      throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
    }
    classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
      throwUnboundTypeError("Cannot construct " + classType.name + " due to unbound types", rawArgTypes);
    };
    whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
      classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
        if (arguments.length !== argCount - 1) {
          throwBindingError(humanName + " called with " + arguments.length + " arguments, expected " + (argCount - 1));
        }
        var destructors = [];
        var args = new Array(argCount);
        args[0] = rawConstructor;
        for (var i = 1; i < argCount; ++i) {
          args[i] = argTypes[i]["toWireType"](destructors, arguments[i - 1]);
        }
        var ptr = invoker.apply(null, args);
        runDestructors(destructors);
        return argTypes[0]["fromWireType"](ptr);
      };
      return [];
    });
    return [];
  });
}
function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual) {
  var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
  methodName = readLatin1String(methodName);
  rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
  whenDependentTypesAreResolved([], [rawClassType], function(classType) {
    classType = classType[0];
    var humanName = classType.name + "." + methodName;
    if (isPureVirtual) {
      classType.registeredClass.pureVirtualFunctions.push(methodName);
    }
    function unboundTypesHandler() {
      throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes);
    }
    var proto = classType.registeredClass.instancePrototype;
    var method = proto[methodName];
    if (method === void 0 || method.overloadTable === void 0 && method.className !== classType.name && method.argCount === argCount - 2) {
      unboundTypesHandler.argCount = argCount - 2;
      unboundTypesHandler.className = classType.name;
      proto[methodName] = unboundTypesHandler;
    } else {
      ensureOverloadTable(proto, methodName, humanName);
      proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
    }
    whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
      var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
      if (proto[methodName].overloadTable === void 0) {
        memberFunction.argCount = argCount - 2;
        proto[methodName] = memberFunction;
      } else {
        proto[methodName].overloadTable[argCount - 2] = memberFunction;
      }
      return [];
    });
    return [];
  });
}
function validateThis(this_, classType, humanName) {
  if (!(this_ instanceof Object)) {
    throwBindingError(humanName + ' with invalid "this": ' + this_);
  }
  if (!(this_ instanceof classType.registeredClass.constructor)) {
    throwBindingError(humanName + ' incompatible with "this" of type ' + this_.constructor.name);
  }
  if (!this_.$$.ptr) {
    throwBindingError("cannot call emscripten binding method " + humanName + " on deleted object");
  }
  return upcastPointer(this_.$$.ptr, this_.$$.ptrType.registeredClass, classType.registeredClass);
}
function __embind_register_class_property(classType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
  fieldName = readLatin1String(fieldName);
  getter = embind__requireFunction(getterSignature, getter);
  whenDependentTypesAreResolved([], [classType], function(classType2) {
    classType2 = classType2[0];
    var humanName = classType2.name + "." + fieldName;
    var desc = { get: function() {
      throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [getterReturnType, setterArgumentType]);
    }, enumerable: true, configurable: true };
    if (setter) {
      desc.set = function() {
        throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [getterReturnType, setterArgumentType]);
      };
    } else {
      desc.set = function(v) {
        throwBindingError(humanName + " is a read-only property");
      };
    }
    Object.defineProperty(classType2.registeredClass.instancePrototype, fieldName, desc);
    whenDependentTypesAreResolved([], setter ? [getterReturnType, setterArgumentType] : [getterReturnType], function(types) {
      var getterReturnType2 = types[0];
      var desc2 = { get: function() {
        var ptr = validateThis(this, classType2, humanName + " getter");
        return getterReturnType2["fromWireType"](getter(getterContext, ptr));
      }, enumerable: true };
      if (setter) {
        setter = embind__requireFunction(setterSignature, setter);
        var setterArgumentType2 = types[1];
        desc2.set = function(v) {
          var ptr = validateThis(this, classType2, humanName + " setter");
          var destructors = [];
          setter(setterContext, ptr, setterArgumentType2["toWireType"](destructors, v));
          runDestructors(destructors);
        };
      }
      Object.defineProperty(classType2.registeredClass.instancePrototype, fieldName, desc2);
      return [];
    });
    return [];
  });
}
function __embind_register_constant(name, type, value) {
  name = readLatin1String(name);
  whenDependentTypesAreResolved([], [type], function(type2) {
    type2 = type2[0];
    cv[name] = type2["fromWireType"](value);
    return [];
  });
}
var emval_free_list = [];
var emval_handle_array = [{}, { value: void 0 }, { value: null }, { value: true }, { value: false }];
function __emval_decref(handle) {
  if (handle > 4 && --emval_handle_array[handle].refcount === 0) {
    emval_handle_array[handle] = void 0;
    emval_free_list.push(handle);
  }
}
function count_emval_handles() {
  var count = 0;
  for (var i = 5; i < emval_handle_array.length; ++i) {
    if (emval_handle_array[i] !== void 0) {
      ++count;
    }
  }
  return count;
}
function get_first_emval() {
  for (var i = 5; i < emval_handle_array.length; ++i) {
    if (emval_handle_array[i] !== void 0) {
      return emval_handle_array[i];
    }
  }
  return null;
}
function init_emval() {
  cv["count_emval_handles"] = count_emval_handles;
  cv["get_first_emval"] = get_first_emval;
}
function __emval_register(value) {
  switch (value) {
    case void 0: {
      return 1;
    }
    case null: {
      return 2;
    }
    case true: {
      return 3;
    }
    case false: {
      return 4;
    }
    default: {
      var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
      emval_handle_array[handle] = { refcount: 1, value };
      return handle;
    }
  }
}
function __embind_register_emval(rawType, name) {
  name = readLatin1String(name);
  registerType(rawType, { name, "fromWireType": function(handle) {
    var rv = emval_handle_array[handle].value;
    __emval_decref(handle);
    return rv;
  }, "toWireType": function(destructors, value) {
    return __emval_register(value);
  }, "argPackAdvance": 8, "readValueFromPointer": simpleReadValueFromPointer, destructorFunction: null });
}
function _embind_repr(v) {
  if (v === null) {
    return "null";
  }
  var t = typeof v;
  if (t === "object" || t === "array" || t === "function") {
    return v.toString();
  } else {
    return "" + v;
  }
}
function floatReadValueFromPointer(name, shift) {
  switch (shift) {
    case 2:
      return function(pointer) {
        return this["fromWireType"](HEAPF32[pointer >> 2]);
      };
    case 3:
      return function(pointer) {
        return this["fromWireType"](HEAPF64[pointer >> 3]);
      };
    default:
      throw new TypeError("Unknown float type: " + name);
  }
}
function __embind_register_float(rawType, name, size) {
  var shift = getShiftFromSize(size);
  name = readLatin1String(name);
  registerType(rawType, { name, "fromWireType": function(value) {
    return value;
  }, "toWireType": function(destructors, value) {
    if (typeof value !== "number" && typeof value !== "boolean") {
      throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
    }
    return value;
  }, "argPackAdvance": 8, "readValueFromPointer": floatReadValueFromPointer(name, shift), destructorFunction: null });
}
function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
  var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
  name = readLatin1String(name);
  rawInvoker = embind__requireFunction(signature, rawInvoker);
  exposePublicSymbol(name, function() {
    throwUnboundTypeError("Cannot call " + name + " due to unbound types", argTypes);
  }, argCount - 1);
  whenDependentTypesAreResolved([], argTypes, function(argTypes2) {
    var invokerArgsArray = [argTypes2[0], null].concat(argTypes2.slice(1));
    replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn), argCount - 1);
    return [];
  });
}
function integerReadValueFromPointer(name, shift, signed) {
  switch (shift) {
    case 0:
      return signed ? function readS8FromPointer(pointer) {
        return HEAP8[pointer];
      } : function readU8FromPointer(pointer) {
        return HEAPU8[pointer];
      };
    case 1:
      return signed ? function readS16FromPointer(pointer) {
        return HEAP16[pointer >> 1];
      } : function readU16FromPointer(pointer) {
        return HEAPU16[pointer >> 1];
      };
    case 2:
      return signed ? function readS32FromPointer(pointer) {
        return HEAP32[pointer >> 2];
      } : function readU32FromPointer(pointer) {
        return HEAPU32[pointer >> 2];
      };
    default:
      throw new TypeError("Unknown integer type: " + name);
  }
}
function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
  name = readLatin1String(name);
  if (maxRange === -1) {
    maxRange = 4294967295;
  }
  var shift = getShiftFromSize(size);
  var fromWireType = function(value) {
    return value;
  };
  if (minRange === 0) {
    var bitshift = 32 - 8 * size;
    fromWireType = function(value) {
      return value << bitshift >>> bitshift;
    };
  }
  var isUnsignedType = name.indexOf("unsigned") != -1;
  registerType(primitiveType, { name, "fromWireType": fromWireType, "toWireType": function(destructors, value) {
    if (typeof value !== "number" && typeof value !== "boolean") {
      throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
    }
    if (value < minRange || value > maxRange) {
      throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!");
    }
    return isUnsignedType ? value >>> 0 : value | 0;
  }, "argPackAdvance": 8, "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0), destructorFunction: null });
}
function __embind_register_memory_view(rawType, dataTypeIndex, name) {
  var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
  var TA = typeMapping[dataTypeIndex];
  function decodeMemoryView(handle) {
    handle = handle >> 2;
    var heap = HEAPU32;
    var size = heap[handle];
    var data = heap[handle + 1];
    return new TA(heap["buffer"], data, size);
  }
  name = readLatin1String(name);
  registerType(rawType, { name, "fromWireType": decodeMemoryView, "argPackAdvance": 8, "readValueFromPointer": decodeMemoryView }, { ignoreDuplicateRegistrations: true });
}
function __embind_register_smart_ptr(rawType, rawPointeeType, name, sharingPolicy, getPointeeSignature, rawGetPointee, constructorSignature, rawConstructor, shareSignature, rawShare, destructorSignature, rawDestructor) {
  name = readLatin1String(name);
  rawGetPointee = embind__requireFunction(getPointeeSignature, rawGetPointee);
  rawConstructor = embind__requireFunction(constructorSignature, rawConstructor);
  rawShare = embind__requireFunction(shareSignature, rawShare);
  rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
  whenDependentTypesAreResolved([rawType], [rawPointeeType], function(pointeeType) {
    pointeeType = pointeeType[0];
    var registeredPointer = new RegisteredPointer(name, pointeeType.registeredClass, false, false, true, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor);
    return [registeredPointer];
  });
}
function __embind_register_std_string(rawType, name) {
  name = readLatin1String(name);
  var stdStringIsUTF8 = name === "std::string";
  registerType(rawType, { name, "fromWireType": function(value) {
    var length = HEAPU32[value >> 2];
    var str;
    if (stdStringIsUTF8) {
      var endChar = HEAPU8[value + 4 + length];
      var endCharSwap = 0;
      if (endChar != 0) {
        endCharSwap = endChar;
        HEAPU8[value + 4 + length] = 0;
      }
      var decodeStartPtr = value + 4;
      for (var i = 0; i <= length; ++i) {
        var currentBytePtr = value + 4 + i;
        if (HEAPU8[currentBytePtr] == 0) {
          var stringSegment = UTF8ToString(decodeStartPtr);
          if (str === void 0)
            str = stringSegment;
          else {
            str += String.fromCharCode(0);
            str += stringSegment;
          }
          decodeStartPtr = currentBytePtr + 1;
        }
      }
      if (endCharSwap != 0)
        HEAPU8[value + 4 + length] = endCharSwap;
    } else {
      var a = new Array(length);
      for (var i = 0; i < length; ++i) {
        a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
      }
      str = a.join("");
    }
    _free(value);
    return str;
  }, "toWireType": function(destructors, value) {
    if (value instanceof ArrayBuffer) {
      value = new Uint8Array(value);
    }
    var getLength;
    var valueIsOfTypeString = typeof value === "string";
    if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
      throwBindingError("Cannot pass non-string to std::string");
    }
    if (stdStringIsUTF8 && valueIsOfTypeString) {
      getLength = function() {
        return lengthBytesUTF8(value);
      };
    } else {
      getLength = function() {
        return value.length;
      };
    }
    var length = getLength();
    var ptr = _malloc(4 + length + 1);
    HEAPU32[ptr >> 2] = length;
    if (stdStringIsUTF8 && valueIsOfTypeString) {
      stringToUTF8(value, ptr + 4, length + 1);
    } else {
      if (valueIsOfTypeString) {
        for (var i = 0; i < length; ++i) {
          var charCode = value.charCodeAt(i);
          if (charCode > 255) {
            _free(ptr);
            throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
          }
          HEAPU8[ptr + 4 + i] = charCode;
        }
      } else {
        for (var i = 0; i < length; ++i) {
          HEAPU8[ptr + 4 + i] = value[i];
        }
      }
    }
    if (destructors !== null) {
      destructors.push(_free, ptr);
    }
    return ptr;
  }, "argPackAdvance": 8, "readValueFromPointer": simpleReadValueFromPointer, destructorFunction: function(ptr) {
    _free(ptr);
  } });
}
function __embind_register_std_wstring(rawType, charSize, name) {
  name = readLatin1String(name);
  var getHeap, shift;
  if (charSize === 2) {
    getHeap = function() {
      return HEAPU16;
    };
    shift = 1;
  } else if (charSize === 4) {
    getHeap = function() {
      return HEAPU32;
    };
    shift = 2;
  }
  registerType(rawType, { name, "fromWireType": function(value) {
    var HEAP = getHeap();
    var length = HEAPU32[value >> 2];
    var a = new Array(length);
    var start = value + 4 >> shift;
    for (var i = 0; i < length; ++i) {
      a[i] = String.fromCharCode(HEAP[start + i]);
    }
    _free(value);
    return a.join("");
  }, "toWireType": function(destructors, value) {
    var length = value.length;
    var ptr = _malloc(4 + length * charSize);
    var HEAP = getHeap();
    HEAPU32[ptr >> 2] = length;
    var start = ptr + 4 >> shift;
    for (var i = 0; i < length; ++i) {
      HEAP[start + i] = value.charCodeAt(i);
    }
    if (destructors !== null) {
      destructors.push(_free, ptr);
    }
    return ptr;
  }, "argPackAdvance": 8, "readValueFromPointer": simpleReadValueFromPointer, destructorFunction: function(ptr) {
    _free(ptr);
  } });
}
function __embind_register_value_array(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
  tupleRegistrations[rawType] = { name: readLatin1String(name), rawConstructor: embind__requireFunction(constructorSignature, rawConstructor), rawDestructor: embind__requireFunction(destructorSignature, rawDestructor), elements: [] };
}
function __embind_register_value_array_element(rawTupleType, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
  tupleRegistrations[rawTupleType].elements.push({ getterReturnType, getter: embind__requireFunction(getterSignature, getter), getterContext, setterArgumentType, setter: embind__requireFunction(setterSignature, setter), setterContext });
}
function __embind_register_value_object(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
  structRegistrations[rawType] = { name: readLatin1String(name), rawConstructor: embind__requireFunction(constructorSignature, rawConstructor), rawDestructor: embind__requireFunction(destructorSignature, rawDestructor), fields: [] };
}
function __embind_register_value_object_field(structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
  structRegistrations[structType].fields.push({ fieldName: readLatin1String(fieldName), getterReturnType, getter: embind__requireFunction(getterSignature, getter), getterContext, setterArgumentType, setter: embind__requireFunction(setterSignature, setter), setterContext });
}
function __embind_register_void(rawType, name) {
  name = readLatin1String(name);
  registerType(rawType, { isVoid: true, name, "argPackAdvance": 0, "fromWireType": function() {
    return void 0;
  }, "toWireType": function(destructors, o) {
    return void 0;
  } });
}
function requireHandle(handle) {
  if (!handle) {
    throwBindingError("Cannot use deleted val. handle = " + handle);
  }
  return emval_handle_array[handle].value;
}
function requireRegisteredType(rawType, humanName) {
  var impl = registeredTypes[rawType];
  if (impl === void 0) {
    throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
  }
  return impl;
}
function __emval_as(handle, returnType, destructorsRef) {
  handle = requireHandle(handle);
  returnType = requireRegisteredType(returnType, "emval::as");
  var destructors = [];
  var rd = __emval_register(destructors);
  HEAP32[destructorsRef >> 2] = rd;
  return returnType["toWireType"](destructors, handle);
}
var emval_symbols = {};
function getStringOrSymbol(address) {
  var symbol = emval_symbols[address];
  if (symbol === void 0) {
    return readLatin1String(address);
  } else {
    return symbol;
  }
}
var emval_methodCallers = [];
function __emval_call_void_method(caller, handle, methodName, args) {
  caller = emval_methodCallers[caller];
  handle = requireHandle(handle);
  methodName = getStringOrSymbol(methodName);
  caller(handle, methodName, null, args);
}
function __emval_addMethodCaller(caller) {
  var id = emval_methodCallers.length;
  emval_methodCallers.push(caller);
  return id;
}
function __emval_lookupTypes(argCount, argTypes, argWireTypes) {
  var a = new Array(argCount);
  for (var i = 0; i < argCount; ++i) {
    a[i] = requireRegisteredType(HEAP32[(argTypes >> 2) + i], "parameter " + i);
  }
  return a;
}
function __emval_get_method_caller(argCount, argTypes) {
  var types = __emval_lookupTypes(argCount, argTypes);
  var retType = types[0];
  var signatureName = retType.name + "_$" + types.slice(1).map(function(t) {
    return t.name;
  }).join("_") + "$";
  var params = ["retType"];
  var args = [retType];
  var argsList = "";
  for (var i = 0; i < argCount - 1; ++i) {
    argsList += (i !== 0 ? ", " : "") + "arg" + i;
    params.push("argType" + i);
    args.push(types[1 + i]);
  }
  var functionName = makeLegalFunctionName("methodCaller_" + signatureName);
  var functionBody = "return function " + functionName + "(handle, name, destructors, args) {\n";
  var offset = 0;
  for (var i = 0; i < argCount - 1; ++i) {
    functionBody += "    var arg" + i + " = argType" + i + ".readValueFromPointer(args" + (offset ? "+" + offset : "") + ");\n";
    offset += types[i + 1]["argPackAdvance"];
  }
  functionBody += "    var rv = handle[name](" + argsList + ");\n";
  for (var i = 0; i < argCount - 1; ++i) {
    if (types[i + 1]["deleteObject"]) {
      functionBody += "    argType" + i + ".deleteObject(arg" + i + ");\n";
    }
  }
  if (!retType.isVoid) {
    functionBody += "    return retType.toWireType(destructors, rv);\n";
  }
  functionBody += "};\n";
  params.push(functionBody);
  var invokerFunction = new_(Function, params).apply(null, args);
  return __emval_addMethodCaller(invokerFunction);
}
function __emval_get_property(handle, key2) {
  handle = requireHandle(handle);
  key2 = requireHandle(key2);
  return __emval_register(handle[key2]);
}
function __emval_incref(handle) {
  if (handle > 4) {
    emval_handle_array[handle].refcount += 1;
  }
}
function __emval_new_array() {
  return __emval_register([]);
}
function __emval_new_cstring(v) {
  return __emval_register(getStringOrSymbol(v));
}
function __emval_run_destructors(handle) {
  var destructors = emval_handle_array[handle].value;
  runDestructors(destructors);
  __emval_decref(handle);
}
function __emval_set_property(handle, key2, value) {
  handle = requireHandle(handle);
  key2 = requireHandle(key2);
  value = requireHandle(value);
  handle[key2] = value;
}
function __emval_take_value(type, argv) {
  type = requireRegisteredType(type, "_emval_take_value");
  var v = type["readValueFromPointer"](argv);
  return __emval_register(v);
}
function _abort() {
  abort();
}
function _emscripten_get_now_is_monotonic() {
  return typeof dateNow !== "undefined" || typeof performance === "object" && performance && typeof performance["now"] === "function";
}
function _clock_gettime(clk_id, tp) {
  var now;
  if (clk_id === 0) {
    now = Date.now();
  } else if (clk_id === 1 && _emscripten_get_now_is_monotonic()) {
    now = _emscripten_get_now();
  } else {
    ___setErrNo(28);
    return -1;
  }
  HEAP32[tp >> 2] = now / 1e3 | 0;
  HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
  return 0;
}
function _emscripten_get_heap_size() {
  return HEAP8.length;
}
function _emscripten_get_sbrk_ptr() {
  return 1384064;
}
function _emscripten_memcpy_big(dest, src, num) {
  HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
}
function emscripten_realloc_buffer(size) {
  try {
    wasmMemory.grow(size - buffer.byteLength + 65535 >> 16);
    updateGlobalBufferAndViews(wasmMemory.buffer);
    return 1;
  } catch (e) {
  }
}
function _emscripten_resize_heap(requestedSize) {
  var oldSize = _emscripten_get_heap_size();
  var PAGE_MULTIPLE = 65536;
  var LIMIT = 2147483648 - PAGE_MULTIPLE;
  if (requestedSize > LIMIT) {
    return false;
  }
  var MIN_TOTAL_MEMORY = 16777216;
  var newSize = Math.max(oldSize, MIN_TOTAL_MEMORY);
  while (newSize < requestedSize) {
    if (newSize <= 536870912) {
      newSize = alignUp(2 * newSize, PAGE_MULTIPLE);
    } else {
      newSize = Math.min(alignUp((3 * newSize + 2147483648) / 4, PAGE_MULTIPLE), LIMIT);
    }
  }
  newSize = Math.min(newSize, 1073741824);
  if (newSize == oldSize) {
    return false;
  }
  var replacement = emscripten_realloc_buffer(newSize);
  if (!replacement) {
    return false;
  }
  return true;
}
var ENV = {};
function _emscripten_get_environ() {
  if (!_emscripten_get_environ.strings) {
    var env = { "USER": "web_user", "LOGNAME": "web_user", "PATH": "/", "PWD": "/", "HOME": "/home/web_user", "LANG": (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8", "_": "./this.program" };
    for (var x in ENV) {
      env[x] = ENV[x];
    }
    var strings = [];
    for (var x in env) {
      strings.push(x + "=" + env[x]);
    }
    _emscripten_get_environ.strings = strings;
  }
  return _emscripten_get_environ.strings;
}
function _environ_get(__environ, environ_buf) {
  var strings = _emscripten_get_environ();
  var bufSize = 0;
  strings.forEach(function(string, i) {
    var ptr = environ_buf + bufSize;
    HEAP32[__environ + i * 4 >> 2] = ptr;
    writeAsciiToMemory(string, ptr);
    bufSize += string.length + 1;
  });
  return 0;
}
function _environ_sizes_get(penviron_count, penviron_buf_size) {
  var strings = _emscripten_get_environ();
  HEAP32[penviron_count >> 2] = strings.length;
  var bufSize = 0;
  strings.forEach(function(string) {
    bufSize += string.length + 1;
  });
  HEAP32[penviron_buf_size >> 2] = bufSize;
  return 0;
}
function _fd_close(fd) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.close(stream);
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
      abort(e);
    return e.errno;
  }
}
function _fd_read(fd, iov, iovcnt, pnum) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = SYSCALLS.doReadv(stream, iov, iovcnt);
    HEAP32[pnum >> 2] = num;
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
      abort(e);
    return e.errno;
  }
}
function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var HIGH_OFFSET = 4294967296;
    var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
    var DOUBLE_LIMIT = 9007199254740992;
    if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
      return -61;
    }
    FS.llseek(stream, offset, whence);
    tempI64 = [stream.position >>> 0, (tempDouble = stream.position, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[newOffset >> 2] = tempI64[0], HEAP32[newOffset + 4 >> 2] = tempI64[1];
    if (stream.getdents && offset === 0 && whence === 0)
      stream.getdents = null;
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
      abort(e);
    return e.errno;
  }
}
function _fd_write(fd, iov, iovcnt, pnum) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = SYSCALLS.doWritev(stream, iov, iovcnt);
    HEAP32[pnum >> 2] = num;
    return 0;
  } catch (e) {
    if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
      abort(e);
    return e.errno;
  }
}
function _pthread_mutexattr_destroy() {
}
function _pthread_mutexattr_init() {
}
function _pthread_mutexattr_settype() {
}
function _round(d) {
  d = +d;
  return d >= 0 ? +Math_floor(d + 0.5) : +Math_ceil(d - 0.5);
}
function _roundf(d) {
  d = +d;
  return d >= 0 ? +Math_floor(d + 0.5) : +Math_ceil(d - 0.5);
}
function _setTempRet0($i) {
}
function __isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function __arraySum(array, index) {
  var sum = 0;
  return sum;
}
var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function __addDays(date, days) {
  var newDate = new Date(date.getTime());
  while (days > 0) {
    var leap = __isLeapYear(newDate.getFullYear());
    var currentMonth = newDate.getMonth();
    var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
    if (days > daysInCurrentMonth - newDate.getDate()) {
      days -= daysInCurrentMonth - newDate.getDate() + 1;
      newDate.setDate(1);
      if (currentMonth < 11) {
        newDate.setMonth(currentMonth + 1);
      } else {
        newDate.setMonth(0);
        newDate.setFullYear(newDate.getFullYear() + 1);
      }
    } else {
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    }
  }
  return newDate;
}
function _strftime(s, maxsize, format, tm) {
  var tm_zone = HEAP32[tm + 40 >> 2];
  var date = { tm_sec: HEAP32[tm >> 2], tm_min: HEAP32[tm + 4 >> 2], tm_hour: HEAP32[tm + 8 >> 2], tm_mday: HEAP32[tm + 12 >> 2], tm_mon: HEAP32[tm + 16 >> 2], tm_year: HEAP32[tm + 20 >> 2], tm_wday: HEAP32[tm + 24 >> 2], tm_yday: HEAP32[tm + 28 >> 2], tm_isdst: HEAP32[tm + 32 >> 2], tm_gmtoff: HEAP32[tm + 36 >> 2], tm_zone: tm_zone ? UTF8ToString(tm_zone) : "" };
  var pattern = UTF8ToString(format);
  var EXPANSION_RULES_1 = { "%c": "%a %b %d %H:%M:%S %Y", "%D": "%m/%d/%y", "%F": "%Y-%m-%d", "%h": "%b", "%r": "%I:%M:%S %p", "%R": "%H:%M", "%T": "%H:%M:%S", "%x": "%m/%d/%y", "%X": "%H:%M:%S", "%Ec": "%c", "%EC": "%C", "%Ex": "%m/%d/%y", "%EX": "%H:%M:%S", "%Ey": "%y", "%EY": "%Y", "%Od": "%d", "%Oe": "%e", "%OH": "%H", "%OI": "%I", "%Om": "%m", "%OM": "%M", "%OS": "%S", "%Ou": "%u", "%OU": "%U", "%OV": "%V", "%Ow": "%w", "%OW": "%W", "%Oy": "%y" };
  for (var rule in EXPANSION_RULES_1) {
    pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule]);
  }
  var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function leadingSomething(value, digits, character) {
    var str = typeof value === "number" ? value.toString() : value || "";
    while (str.length < digits) {
      str = character[0] + str;
    }
    return str;
  }
  function leadingNulls(value, digits) {
    return leadingSomething(value, digits, "0");
  }
  function compareByDay(date1, date2) {
    function sgn(value) {
      return value < 0 ? -1 : value > 0 ? 1 : 0;
    }
    var compare;
    if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
      if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
        compare = sgn(date1.getDate() - date2.getDate());
      }
    }
    return compare;
  }
  function getFirstWeekStartDate(janFourth) {
    switch (janFourth.getDay()) {
      case 0:
        return new Date(janFourth.getFullYear() - 1, 11, 29);
      case 1:
        return janFourth;
      case 2:
        return new Date(janFourth.getFullYear(), 0, 3);
      case 3:
        return new Date(janFourth.getFullYear(), 0, 2);
      case 4:
        return new Date(janFourth.getFullYear(), 0, 1);
      case 5:
        return new Date(janFourth.getFullYear() - 1, 11, 31);
      case 6:
        return new Date(janFourth.getFullYear() - 1, 11, 30);
    }
  }
  function getWeekBasedYear(date2) {
    var thisDate = __addDays(new Date(date2.tm_year + 1900, 0, 1), date2.tm_yday);
    var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
    var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
    var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
    var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
    if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
      if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
        return thisDate.getFullYear() + 1;
      } else {
        return thisDate.getFullYear();
      }
    } else {
      return thisDate.getFullYear() - 1;
    }
  }
  var EXPANSION_RULES_2 = { "%a": function(date2) {
    return WEEKDAYS[date2.tm_wday].substring(0, 3);
  }, "%A": function(date2) {
    return WEEKDAYS[date2.tm_wday];
  }, "%b": function(date2) {
    return MONTHS[date2.tm_mon].substring(0, 3);
  }, "%B": function(date2) {
    return MONTHS[date2.tm_mon];
  }, "%C": function(date2) {
    var year = date2.tm_year + 1900;
    return leadingNulls(year / 100 | 0, 2);
  }, "%d": function(date2) {
    return leadingNulls(date2.tm_mday, 2);
  }, "%e": function(date2) {
    return leadingSomething(date2.tm_mday, 2, " ");
  }, "%g": function(date2) {
    return getWeekBasedYear(date2).toString().substring(2);
  }, "%G": function(date2) {
    return getWeekBasedYear(date2);
  }, "%H": function(date2) {
    return leadingNulls(date2.tm_hour, 2);
  }, "%I": function(date2) {
    var twelveHour = date2.tm_hour;
    if (twelveHour == 0)
      twelveHour = 12;
    else if (twelveHour > 12)
      twelveHour -= 12;
    return leadingNulls(twelveHour, 2);
  }, "%j": function(date2) {
    return leadingNulls(date2.tm_mday + __arraySum(__isLeapYear(date2.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date2.tm_mon - 1), 3);
  }, "%m": function(date2) {
    return leadingNulls(date2.tm_mon + 1, 2);
  }, "%M": function(date2) {
    return leadingNulls(date2.tm_min, 2);
  }, "%n": function() {
    return "\n";
  }, "%p": function(date2) {
    if (date2.tm_hour >= 0 && date2.tm_hour < 12) {
      return "AM";
    } else {
      return "PM";
    }
  }, "%S": function(date2) {
    return leadingNulls(date2.tm_sec, 2);
  }, "%t": function() {
    return "	";
  }, "%u": function(date2) {
    return date2.tm_wday || 7;
  }, "%U": function(date2) {
    var janFirst = new Date(date2.tm_year + 1900, 0, 1);
    var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
    var endDate = new Date(date2.tm_year + 1900, date2.tm_mon, date2.tm_mday);
    if (compareByDay(firstSunday, endDate) < 0) {
      var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
      var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
      var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
      return leadingNulls(Math.ceil(days / 7), 2);
    }
    return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00";
  }, "%V": function(date2) {
    var janFourthThisYear = new Date(date2.tm_year + 1900, 0, 4);
    var janFourthNextYear = new Date(date2.tm_year + 1901, 0, 4);
    var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
    var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
    var endDate = __addDays(new Date(date2.tm_year + 1900, 0, 1), date2.tm_yday);
    if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
      return "53";
    }
    if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
      return "01";
    }
    var daysDifference;
    if (firstWeekStartThisYear.getFullYear() < date2.tm_year + 1900) {
      daysDifference = date2.tm_yday + 32 - firstWeekStartThisYear.getDate();
    } else {
      daysDifference = date2.tm_yday + 1 - firstWeekStartThisYear.getDate();
    }
    return leadingNulls(Math.ceil(daysDifference / 7), 2);
  }, "%w": function(date2) {
    return date2.tm_wday;
  }, "%W": function(date2) {
    var janFirst = new Date(date2.tm_year, 0, 1);
    var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
    var endDate = new Date(date2.tm_year + 1900, date2.tm_mon, date2.tm_mday);
    if (compareByDay(firstMonday, endDate) < 0) {
      var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
      var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
      var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
      return leadingNulls(Math.ceil(days / 7), 2);
    }
    return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00";
  }, "%y": function(date2) {
    return (date2.tm_year + 1900).toString().substring(2);
  }, "%Y": function(date2) {
    return date2.tm_year + 1900;
  }, "%z": function(date2) {
    var off = date2.tm_gmtoff;
    var ahead = off >= 0;
    off = Math.abs(off) / 60;
    off = off / 60 * 100 + off % 60;
    return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
  }, "%Z": function(date2) {
    return date2.tm_zone;
  }, "%%": function() {
    return "%";
  } };
  for (var rule in EXPANSION_RULES_2) {
    if (pattern.indexOf(rule) >= 0) {
      pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date));
    }
  }
  var bytes = intArrayFromString(pattern, false);
  if (bytes.length > maxsize) {
    return 0;
  }
  writeArrayToMemory(bytes, s);
  return bytes.length - 1;
}
function _strftime_l(s, maxsize, format, tm) {
  return _strftime(s, maxsize, format, tm);
}
function _sysconf(name) {
  switch (name) {
    case 30:
      return PAGE_SIZE;
    case 85:
      var maxHeapSize = 2 * 1024 * 1024 * 1024 - 65536;
      maxHeapSize = 1073741824;
      return maxHeapSize / PAGE_SIZE;
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
    case 84: {
      if (typeof navigator === "object")
        return navigator["hardwareConcurrency"] || 1;
      return 1;
    }
  }
  ___setErrNo(28);
  return -1;
}
cv["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) {
  err("cv.requestFullScreen is deprecated. Please call cv.requestFullscreen instead.");
  cv["requestFullScreen"] = cv["requestFullscreen"];
  Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice);
};
cv["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas, vrDevice) {
  Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice);
};
cv["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
  Browser.requestAnimationFrame(func);
};
cv["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
  Browser.setCanvasSize(width, height, noUpdates);
};
cv["pauseMainLoop"] = function Module_pauseMainLoop() {
  Browser.mainLoop.pause();
};
cv["resumeMainLoop"] = function Module_resumeMainLoop() {
  Browser.mainLoop.resume();
};
cv["getUserMedia"] = function Module_getUserMedia() {
  Browser.getUserMedia();
};
cv["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
  return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes);
};
if (typeof dateNow !== "undefined") {
  _emscripten_get_now = dateNow;
} else if (typeof performance === "object" && performance && typeof performance["now"] === "function") {
  _emscripten_get_now = function() {
    return performance["now"]();
  };
} else {
  _emscripten_get_now = Date.now;
}
FS.staticInit();
cv["FS_createFolder"] = FS.createFolder;
cv["FS_createPath"] = FS.createPath;
cv["FS_createDataFile"] = FS.createDataFile;
cv["FS_createPreloadedFile"] = FS.createPreloadedFile;
cv["FS_createLazyFile"] = FS.createLazyFile;
cv["FS_createLink"] = FS.createLink;
cv["FS_createDevice"] = FS.createDevice;
cv["FS_unlink"] = FS.unlink;
InternalError = cv["InternalError"] = extendError(Error, "InternalError");
embind_init_charCodes();
BindingError = cv["BindingError"] = extendError(Error, "BindingError");
init_ClassHandle();
init_RegisteredPointer();
init_embind();
UnboundTypeError = cv["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
init_emval();
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull)
    u8array.length = numBytesWritten;
  return u8array;
}
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 255) {
      chr &= 255;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join("");
}
var decodeBase64 = typeof atob === "function" ? atob : function(input) {
  var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var output = "";
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
  do {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));
    chr1 = enc1 << 2 | enc2 >> 4;
    chr2 = (enc2 & 15) << 4 | enc3 >> 2;
    chr3 = (enc3 & 3) << 6 | enc4;
    output = output + String.fromCharCode(chr1);
    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);
  return output;
};
function intArrayFromBase64(s) {
  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0; i < decoded.length; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error("Converting base64 string to bytes failed.");
  }
}
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }
  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}
var asmLibraryArg = { "__cxa_allocate_exception": ___cxa_allocate_exception, "__cxa_atexit": ___cxa_atexit, "__cxa_throw": ___cxa_throw, "__lock": ___lock, "__map_file": ___map_file, "__syscall221": ___syscall221, "__syscall3": ___syscall3, "__syscall4": ___syscall4, "__syscall5": ___syscall5, "__syscall54": ___syscall54, "__syscall91": ___syscall91, "__unlock": ___unlock, "_embind_finalize_value_array": __embind_finalize_value_array, "_embind_finalize_value_object": __embind_finalize_value_object, "_embind_register_bool": __embind_register_bool, "_embind_register_class": __embind_register_class, "_embind_register_class_class_function": __embind_register_class_class_function, "_embind_register_class_constructor": __embind_register_class_constructor, "_embind_register_class_function": __embind_register_class_function, "_embind_register_class_property": __embind_register_class_property, "_embind_register_constant": __embind_register_constant, "_embind_register_emval": __embind_register_emval, "_embind_register_float": __embind_register_float, "_embind_register_function": __embind_register_function, "_embind_register_integer": __embind_register_integer, "_embind_register_memory_view": __embind_register_memory_view, "_embind_register_smart_ptr": __embind_register_smart_ptr, "_embind_register_std_string": __embind_register_std_string, "_embind_register_std_wstring": __embind_register_std_wstring, "_embind_register_value_array": __embind_register_value_array, "_embind_register_value_array_element": __embind_register_value_array_element, "_embind_register_value_object": __embind_register_value_object, "_embind_register_value_object_field": __embind_register_value_object_field, "_embind_register_void": __embind_register_void, "_emval_as": __emval_as, "_emval_call_void_method": __emval_call_void_method, "_emval_decref": __emval_decref, "_emval_get_method_caller": __emval_get_method_caller, "_emval_get_property": __emval_get_property, "_emval_incref": __emval_incref, "_emval_new_array": __emval_new_array, "_emval_new_cstring": __emval_new_cstring, "_emval_run_destructors": __emval_run_destructors, "_emval_set_property": __emval_set_property, "_emval_take_value": __emval_take_value, "abort": _abort, "clock_gettime": _clock_gettime, "emscripten_get_sbrk_ptr": _emscripten_get_sbrk_ptr, "emscripten_memcpy_big": _emscripten_memcpy_big, "emscripten_resize_heap": _emscripten_resize_heap, "environ_get": _environ_get, "environ_sizes_get": _environ_sizes_get, "fd_close": _fd_close, "fd_read": _fd_read, "fd_seek": _fd_seek, "fd_write": _fd_write, "memory": wasmMemory, "pthread_mutexattr_destroy": _pthread_mutexattr_destroy, "pthread_mutexattr_init": _pthread_mutexattr_init, "pthread_mutexattr_settype": _pthread_mutexattr_settype, "round": _round, "roundf": _roundf, "setTempRet0": _setTempRet0, "strftime_l": _strftime_l, "sysconf": _sysconf, "table": wasmTable };
var asm = createWasm();
cv["asm"] = asm;
var ___wasm_call_ctors = cv["___wasm_call_ctors"] = function() {
  return cv["asm"]["__wasm_call_ctors"].apply(null, arguments);
};
var _malloc = cv["_malloc"] = function() {
  return cv["asm"]["malloc"].apply(null, arguments);
};
var _free = cv["_free"] = function() {
  return cv["asm"]["free"].apply(null, arguments);
};
cv["___errno_location"] = function() {
  return cv["asm"]["__errno_location"].apply(null, arguments);
};
cv["_setThrew"] = function() {
  return cv["asm"]["setThrew"].apply(null, arguments);
};
var __ZSt18uncaught_exceptionv = cv["__ZSt18uncaught_exceptionv"] = function() {
  return cv["asm"]["_ZSt18uncaught_exceptionv"].apply(null, arguments);
};
cv["___cxa_demangle"] = function() {
  return cv["asm"]["__cxa_demangle"].apply(null, arguments);
};
var ___getTypeName = cv["___getTypeName"] = function() {
  return cv["asm"]["__getTypeName"].apply(null, arguments);
};
cv["___embind_register_native_and_builtin_types"] = function() {
  return cv["asm"]["__embind_register_native_and_builtin_types"].apply(null, arguments);
};
cv["stackSave"] = function() {
  return cv["asm"]["stackSave"].apply(null, arguments);
};
cv["stackAlloc"] = function() {
  return cv["asm"]["stackAlloc"].apply(null, arguments);
};
cv["stackRestore"] = function() {
  return cv["asm"]["stackRestore"].apply(null, arguments);
};
cv["__growWasmMemory"] = function() {
  return cv["asm"]["__growWasmMemory"].apply(null, arguments);
};
cv["dynCall_ii"] = function() {
  return cv["asm"]["dynCall_ii"].apply(null, arguments);
};
cv["dynCall_vi"] = function() {
  return cv["asm"]["dynCall_vi"].apply(null, arguments);
};
cv["dynCall_i"] = function() {
  return cv["asm"]["dynCall_i"].apply(null, arguments);
};
cv["dynCall_iii"] = function() {
  return cv["asm"]["dynCall_iii"].apply(null, arguments);
};
cv["dynCall_iiii"] = function() {
  return cv["asm"]["dynCall_iiii"].apply(null, arguments);
};
cv["dynCall_iiiii"] = function() {
  return cv["asm"]["dynCall_iiiii"].apply(null, arguments);
};
cv["dynCall_iiiiii"] = function() {
  return cv["asm"]["dynCall_iiiiii"].apply(null, arguments);
};
cv["dynCall_iiiiiii"] = function() {
  return cv["asm"]["dynCall_iiiiiii"].apply(null, arguments);
};
cv["dynCall_viii"] = function() {
  return cv["asm"]["dynCall_viii"].apply(null, arguments);
};
cv["dynCall_viiii"] = function() {
  return cv["asm"]["dynCall_viiii"].apply(null, arguments);
};
cv["dynCall_vii"] = function() {
  return cv["asm"]["dynCall_vii"].apply(null, arguments);
};
cv["dynCall_viiidd"] = function() {
  return cv["asm"]["dynCall_viiidd"].apply(null, arguments);
};
cv["dynCall_viiiidd"] = function() {
  return cv["asm"]["dynCall_viiiidd"].apply(null, arguments);
};
cv["dynCall_viiid"] = function() {
  return cv["asm"]["dynCall_viiid"].apply(null, arguments);
};
cv["dynCall_viiiid"] = function() {
  return cv["asm"]["dynCall_viiiid"].apply(null, arguments);
};
cv["dynCall_viiiii"] = function() {
  return cv["asm"]["dynCall_viiiii"].apply(null, arguments);
};
cv["dynCall_dii"] = function() {
  return cv["asm"]["dynCall_dii"].apply(null, arguments);
};
cv["dynCall_diii"] = function() {
  return cv["asm"]["dynCall_diii"].apply(null, arguments);
};
cv["dynCall_iiiid"] = function() {
  return cv["asm"]["dynCall_iiiid"].apply(null, arguments);
};
cv["dynCall_fiii"] = function() {
  return cv["asm"]["dynCall_fiii"].apply(null, arguments);
};
cv["dynCall_fiiii"] = function() {
  return cv["asm"]["dynCall_fiiii"].apply(null, arguments);
};
cv["dynCall_fiiiii"] = function() {
  return cv["asm"]["dynCall_fiiiii"].apply(null, arguments);
};
cv["dynCall_diiiii"] = function() {
  return cv["asm"]["dynCall_diiiii"].apply(null, arguments);
};
cv["dynCall_diiii"] = function() {
  return cv["asm"]["dynCall_diiii"].apply(null, arguments);
};
cv["dynCall_viid"] = function() {
  return cv["asm"]["dynCall_viid"].apply(null, arguments);
};
cv["dynCall_fii"] = function() {
  return cv["asm"]["dynCall_fii"].apply(null, arguments);
};
cv["dynCall_viif"] = function() {
  return cv["asm"]["dynCall_viif"].apply(null, arguments);
};
cv["dynCall_iiiiiiiiii"] = function() {
  return cv["asm"]["dynCall_iiiiiiiiii"].apply(null, arguments);
};
cv["dynCall_iiiiiiiii"] = function() {
  return cv["asm"]["dynCall_iiiiiiiii"].apply(null, arguments);
};
cv["dynCall_iiiiiiii"] = function() {
  return cv["asm"]["dynCall_iiiiiiii"].apply(null, arguments);
};
cv["dynCall_viiif"] = function() {
  return cv["asm"]["dynCall_viiif"].apply(null, arguments);
};
cv["dynCall_iiiif"] = function() {
  return cv["asm"]["dynCall_iiiif"].apply(null, arguments);
};
cv["dynCall_viiiddii"] = function() {
  return cv["asm"]["dynCall_viiiddii"].apply(null, arguments);
};
cv["dynCall_viiddii"] = function() {
  return cv["asm"]["dynCall_viiddii"].apply(null, arguments);
};
cv["dynCall_viiiddi"] = function() {
  return cv["asm"]["dynCall_viiiddi"].apply(null, arguments);
};
cv["dynCall_viiddi"] = function() {
  return cv["asm"]["dynCall_viiddi"].apply(null, arguments);
};
cv["dynCall_viidd"] = function() {
  return cv["asm"]["dynCall_viidd"].apply(null, arguments);
};
cv["dynCall_viiiiddi"] = function() {
  return cv["asm"]["dynCall_viiiiddi"].apply(null, arguments);
};
cv["dynCall_viiiiddddii"] = function() {
  return cv["asm"]["dynCall_viiiiddddii"].apply(null, arguments);
};
cv["dynCall_viiiddddii"] = function() {
  return cv["asm"]["dynCall_viiiddddii"].apply(null, arguments);
};
cv["dynCall_viiiiddddi"] = function() {
  return cv["asm"]["dynCall_viiiiddddi"].apply(null, arguments);
};
cv["dynCall_viiiddddi"] = function() {
  return cv["asm"]["dynCall_viiiddddi"].apply(null, arguments);
};
cv["dynCall_viiiidddd"] = function() {
  return cv["asm"]["dynCall_viiiidddd"].apply(null, arguments);
};
cv["dynCall_viiidddd"] = function() {
  return cv["asm"]["dynCall_viiidddd"].apply(null, arguments);
};
cv["dynCall_viiiiddd"] = function() {
  return cv["asm"]["dynCall_viiiiddd"].apply(null, arguments);
};
cv["dynCall_viiiddd"] = function() {
  return cv["asm"]["dynCall_viiiddd"].apply(null, arguments);
};
cv["dynCall_viiiddidddd"] = function() {
  return cv["asm"]["dynCall_viiiddidddd"].apply(null, arguments);
};
cv["dynCall_viiddidddd"] = function() {
  return cv["asm"]["dynCall_viiddidddd"].apply(null, arguments);
};
cv["dynCall_viiiddiddd"] = function() {
  return cv["asm"]["dynCall_viiiddiddd"].apply(null, arguments);
};
cv["dynCall_viiddiddd"] = function() {
  return cv["asm"]["dynCall_viiddiddd"].apply(null, arguments);
};
cv["dynCall_viiiddidd"] = function() {
  return cv["asm"]["dynCall_viiiddidd"].apply(null, arguments);
};
cv["dynCall_viiddidd"] = function() {
  return cv["asm"]["dynCall_viiddidd"].apply(null, arguments);
};
cv["dynCall_viiiddid"] = function() {
  return cv["asm"]["dynCall_viiiddid"].apply(null, arguments);
};
cv["dynCall_viiddid"] = function() {
  return cv["asm"]["dynCall_viiddid"].apply(null, arguments);
};
cv["dynCall_viiiiiddi"] = function() {
  return cv["asm"]["dynCall_viiiiiddi"].apply(null, arguments);
};
cv["dynCall_viiiiidd"] = function() {
  return cv["asm"]["dynCall_viiiiidd"].apply(null, arguments);
};
cv["dynCall_viiiiid"] = function() {
  return cv["asm"]["dynCall_viiiiid"].apply(null, arguments);
};
cv["dynCall_viiiiiiddi"] = function() {
  return cv["asm"]["dynCall_viiiiiiddi"].apply(null, arguments);
};
cv["dynCall_viiiiiidd"] = function() {
  return cv["asm"]["dynCall_viiiiiidd"].apply(null, arguments);
};
cv["dynCall_viiiiiid"] = function() {
  return cv["asm"]["dynCall_viiiiiid"].apply(null, arguments);
};
cv["dynCall_viiiiii"] = function() {
  return cv["asm"]["dynCall_viiiiii"].apply(null, arguments);
};
cv["dynCall_viiiiiiiddi"] = function() {
  return cv["asm"]["dynCall_viiiiiiiddi"].apply(null, arguments);
};
cv["dynCall_viiiiiiidd"] = function() {
  return cv["asm"]["dynCall_viiiiiiidd"].apply(null, arguments);
};
cv["dynCall_viiiiiiid"] = function() {
  return cv["asm"]["dynCall_viiiiiiid"].apply(null, arguments);
};
cv["dynCall_viiiiiii"] = function() {
  return cv["asm"]["dynCall_viiiiiii"].apply(null, arguments);
};
cv["dynCall_viiidiiid"] = function() {
  return cv["asm"]["dynCall_viiidiiid"].apply(null, arguments);
};
cv["dynCall_viidiiid"] = function() {
  return cv["asm"]["dynCall_viidiiid"].apply(null, arguments);
};
cv["dynCall_viididdii"] = function() {
  return cv["asm"]["dynCall_viididdii"].apply(null, arguments);
};
cv["dynCall_vididdii"] = function() {
  return cv["asm"]["dynCall_vididdii"].apply(null, arguments);
};
cv["dynCall_viididdi"] = function() {
  return cv["asm"]["dynCall_viididdi"].apply(null, arguments);
};
cv["dynCall_vididdi"] = function() {
  return cv["asm"]["dynCall_vididdi"].apply(null, arguments);
};
cv["dynCall_viiidi"] = function() {
  return cv["asm"]["dynCall_viiidi"].apply(null, arguments);
};
cv["dynCall_viidi"] = function() {
  return cv["asm"]["dynCall_viidi"].apply(null, arguments);
};
cv["dynCall_viiiiiiii"] = function() {
  return cv["asm"]["dynCall_viiiiiiii"].apply(null, arguments);
};
cv["dynCall_viiiidiiiidi"] = function() {
  return cv["asm"]["dynCall_viiiidiiiidi"].apply(null, arguments);
};
cv["dynCall_viiidiiiidi"] = function() {
  return cv["asm"]["dynCall_viiidiiiidi"].apply(null, arguments);
};
cv["dynCall_viiiiiiiiiiid"] = function() {
  return cv["asm"]["dynCall_viiiiiiiiiiid"].apply(null, arguments);
};
cv["dynCall_viiiiiiiiiid"] = function() {
  return cv["asm"]["dynCall_viiiiiiiiiid"].apply(null, arguments);
};
cv["dynCall_viiiiiiiiiii"] = function() {
  return cv["asm"]["dynCall_viiiiiiiiiii"].apply(null, arguments);
};
cv["dynCall_viiiiiiiiii"] = function() {
  return cv["asm"]["dynCall_viiiiiiiiii"].apply(null, arguments);
};
cv["dynCall_viiiiiiiii"] = function() {
  return cv["asm"]["dynCall_viiiiiiiii"].apply(null, arguments);
};
cv["dynCall_diiiiiiiiiiiii"] = function() {
  return cv["asm"]["dynCall_diiiiiiiiiiiii"].apply(null, arguments);
};
cv["dynCall_diiiiiiiiiiii"] = function() {
  return cv["asm"]["dynCall_diiiiiiiiiiii"].apply(null, arguments);
};
cv["dynCall_diiiiiiiiiii"] = function() {
  return cv["asm"]["dynCall_diiiiiiiiiii"].apply(null, arguments);
};
cv["dynCall_diiiiiiiiii"] = function() {
  return cv["asm"]["dynCall_diiiiiiiiii"].apply(null, arguments);
};
cv["dynCall_di"] = function() {
  return cv["asm"]["dynCall_di"].apply(null, arguments);
};
cv["dynCall_viiiiidi"] = function() {
  return cv["asm"]["dynCall_viiiiidi"].apply(null, arguments);
};
cv["dynCall_viiiidi"] = function() {
  return cv["asm"]["dynCall_viiiidi"].apply(null, arguments);
};
cv["dynCall_vidiii"] = function() {
  return cv["asm"]["dynCall_vidiii"].apply(null, arguments);
};
cv["dynCall_vdiii"] = function() {
  return cv["asm"]["dynCall_vdiii"].apply(null, arguments);
};
cv["dynCall_vidii"] = function() {
  return cv["asm"]["dynCall_vidii"].apply(null, arguments);
};
cv["dynCall_vdii"] = function() {
  return cv["asm"]["dynCall_vdii"].apply(null, arguments);
};
cv["dynCall_viiiiiifi"] = function() {
  return cv["asm"]["dynCall_viiiiiifi"].apply(null, arguments);
};
cv["dynCall_viiiiifi"] = function() {
  return cv["asm"]["dynCall_viiiiifi"].apply(null, arguments);
};
cv["dynCall_viiiiiif"] = function() {
  return cv["asm"]["dynCall_viiiiiif"].apply(null, arguments);
};
cv["dynCall_viiiiif"] = function() {
  return cv["asm"]["dynCall_viiiiif"].apply(null, arguments);
};
cv["dynCall_viiiiiiiiiiii"] = function() {
  return cv["asm"]["dynCall_viiiiiiiiiiii"].apply(null, arguments);
};
cv["dynCall_viiiidddiiii"] = function() {
  return cv["asm"]["dynCall_viiiidddiiii"].apply(null, arguments);
};
cv["dynCall_viiidddiiii"] = function() {
  return cv["asm"]["dynCall_viiidddiiii"].apply(null, arguments);
};
cv["dynCall_viiiidddiii"] = function() {
  return cv["asm"]["dynCall_viiiidddiii"].apply(null, arguments);
};
cv["dynCall_viiidddiii"] = function() {
  return cv["asm"]["dynCall_viiidddiii"].apply(null, arguments);
};
cv["dynCall_viiiidddii"] = function() {
  return cv["asm"]["dynCall_viiiidddii"].apply(null, arguments);
};
cv["dynCall_viiidddii"] = function() {
  return cv["asm"]["dynCall_viiidddii"].apply(null, arguments);
};
cv["dynCall_viiiidddi"] = function() {
  return cv["asm"]["dynCall_viiiidddi"].apply(null, arguments);
};
cv["dynCall_viiidddi"] = function() {
  return cv["asm"]["dynCall_viiidddi"].apply(null, arguments);
};
cv["dynCall_iiiiiididi"] = function() {
  return cv["asm"]["dynCall_iiiiiididi"].apply(null, arguments);
};
cv["dynCall_viiiiididi"] = function() {
  return cv["asm"]["dynCall_viiiiididi"].apply(null, arguments);
};
cv["dynCall_iiiiiidid"] = function() {
  return cv["asm"]["dynCall_iiiiiidid"].apply(null, arguments);
};
cv["dynCall_viiiiidid"] = function() {
  return cv["asm"]["dynCall_viiiiidid"].apply(null, arguments);
};
cv["dynCall_iiiiiidi"] = function() {
  return cv["asm"]["dynCall_iiiiiidi"].apply(null, arguments);
};
cv["dynCall_iiiiiid"] = function() {
  return cv["asm"]["dynCall_iiiiiid"].apply(null, arguments);
};
cv["dynCall_viiiiiidi"] = function() {
  return cv["asm"]["dynCall_viiiiiidi"].apply(null, arguments);
};
cv["dynCall_iiiiidiid"] = function() {
  return cv["asm"]["dynCall_iiiiidiid"].apply(null, arguments);
};
cv["dynCall_viiiidiid"] = function() {
  return cv["asm"]["dynCall_viiiidiid"].apply(null, arguments);
};
cv["dynCall_iiiiidii"] = function() {
  return cv["asm"]["dynCall_iiiiidii"].apply(null, arguments);
};
cv["dynCall_viiiidii"] = function() {
  return cv["asm"]["dynCall_viiiidii"].apply(null, arguments);
};
cv["dynCall_iiiiidi"] = function() {
  return cv["asm"]["dynCall_iiiiidi"].apply(null, arguments);
};
cv["dynCall_iiiiid"] = function() {
  return cv["asm"]["dynCall_iiiiid"].apply(null, arguments);
};
cv["dynCall_diiiiiiii"] = function() {
  return cv["asm"]["dynCall_diiiiiiii"].apply(null, arguments);
};
cv["dynCall_diiiiiii"] = function() {
  return cv["asm"]["dynCall_diiiiiii"].apply(null, arguments);
};
cv["dynCall_diiiiii"] = function() {
  return cv["asm"]["dynCall_diiiiii"].apply(null, arguments);
};
cv["dynCall_viiididii"] = function() {
  return cv["asm"]["dynCall_viiididii"].apply(null, arguments);
};
cv["dynCall_viididii"] = function() {
  return cv["asm"]["dynCall_viididii"].apply(null, arguments);
};
cv["dynCall_viiididi"] = function() {
  return cv["asm"]["dynCall_viiididi"].apply(null, arguments);
};
cv["dynCall_viididi"] = function() {
  return cv["asm"]["dynCall_viididi"].apply(null, arguments);
};
cv["dynCall_iiidd"] = function() {
  return cv["asm"]["dynCall_iiidd"].apply(null, arguments);
};
cv["dynCall_viiiiddiiid"] = function() {
  return cv["asm"]["dynCall_viiiiddiiid"].apply(null, arguments);
};
cv["dynCall_viiiddiiid"] = function() {
  return cv["asm"]["dynCall_viiiddiiid"].apply(null, arguments);
};
cv["dynCall_viiiiddiii"] = function() {
  return cv["asm"]["dynCall_viiiiddiii"].apply(null, arguments);
};
cv["dynCall_viiiddiii"] = function() {
  return cv["asm"]["dynCall_viiiddiii"].apply(null, arguments);
};
cv["dynCall_viiiiddii"] = function() {
  return cv["asm"]["dynCall_viiiiddii"].apply(null, arguments);
};
cv["dynCall_viiiiddiiiid"] = function() {
  return cv["asm"]["dynCall_viiiiddiiiid"].apply(null, arguments);
};
cv["dynCall_viiiddiiiid"] = function() {
  return cv["asm"]["dynCall_viiiddiiiid"].apply(null, arguments);
};
cv["dynCall_viiiiddiiii"] = function() {
  return cv["asm"]["dynCall_viiiiddiiii"].apply(null, arguments);
};
cv["dynCall_viiiddiiii"] = function() {
  return cv["asm"]["dynCall_viiiddiiii"].apply(null, arguments);
};
cv["dynCall_diiiid"] = function() {
  return cv["asm"]["dynCall_diiiid"].apply(null, arguments);
};
cv["dynCall_diiid"] = function() {
  return cv["asm"]["dynCall_diiid"].apply(null, arguments);
};
cv["dynCall_viiddiii"] = function() {
  return cv["asm"]["dynCall_viiddiii"].apply(null, arguments);
};
cv["dynCall_vidi"] = function() {
  return cv["asm"]["dynCall_vidi"].apply(null, arguments);
};
cv["dynCall_viiiiiiiid"] = function() {
  return cv["asm"]["dynCall_viiiiiiiid"].apply(null, arguments);
};
cv["dynCall_viiiiidiiii"] = function() {
  return cv["asm"]["dynCall_viiiiidiiii"].apply(null, arguments);
};
cv["dynCall_viiiidiiii"] = function() {
  return cv["asm"]["dynCall_viiiidiiii"].apply(null, arguments);
};
cv["dynCall_viiiiidiii"] = function() {
  return cv["asm"]["dynCall_viiiiidiii"].apply(null, arguments);
};
cv["dynCall_viiiidiii"] = function() {
  return cv["asm"]["dynCall_viiiidiii"].apply(null, arguments);
};
cv["dynCall_viiiiidii"] = function() {
  return cv["asm"]["dynCall_viiiiidii"].apply(null, arguments);
};
cv["dynCall_viiiiiiidi"] = function() {
  return cv["asm"]["dynCall_viiiiiiidi"].apply(null, arguments);
};
cv["dynCall_iiiiiiiiiifdii"] = function() {
  return cv["asm"]["dynCall_iiiiiiiiiifdii"].apply(null, arguments);
};
cv["dynCall_iiiiiiiiifdii"] = function() {
  return cv["asm"]["dynCall_iiiiiiiiifdii"].apply(null, arguments);
};
cv["dynCall_iiiiiiiiiifdi"] = function() {
  return cv["asm"]["dynCall_iiiiiiiiiifdi"].apply(null, arguments);
};
cv["dynCall_iiiiiiiiifdi"] = function() {
  return cv["asm"]["dynCall_iiiiiiiiifdi"].apply(null, arguments);
};
cv["dynCall_iiiiiiiiiifd"] = function() {
  return cv["asm"]["dynCall_iiiiiiiiiifd"].apply(null, arguments);
};
cv["dynCall_iiiiiiiiifd"] = function() {
  return cv["asm"]["dynCall_iiiiiiiiifd"].apply(null, arguments);
};
cv["dynCall_iiiiiiiiiif"] = function() {
  return cv["asm"]["dynCall_iiiiiiiiiif"].apply(null, arguments);
};
cv["dynCall_iiiiiiiiif"] = function() {
  return cv["asm"]["dynCall_iiiiiiiiif"].apply(null, arguments);
};
cv["dynCall_diiiddi"] = function() {
  return cv["asm"]["dynCall_diiiddi"].apply(null, arguments);
};
cv["dynCall_diiddi"] = function() {
  return cv["asm"]["dynCall_diiddi"].apply(null, arguments);
};
cv["dynCall_iiidiiiii"] = function() {
  return cv["asm"]["dynCall_iiidiiiii"].apply(null, arguments);
};
cv["dynCall_viidiiiii"] = function() {
  return cv["asm"]["dynCall_viidiiiii"].apply(null, arguments);
};
cv["dynCall_iiidiiii"] = function() {
  return cv["asm"]["dynCall_iiidiiii"].apply(null, arguments);
};
cv["dynCall_viidiiii"] = function() {
  return cv["asm"]["dynCall_viidiiii"].apply(null, arguments);
};
cv["dynCall_iiidiii"] = function() {
  return cv["asm"]["dynCall_iiidiii"].apply(null, arguments);
};
cv["dynCall_viidiii"] = function() {
  return cv["asm"]["dynCall_viidiii"].apply(null, arguments);
};
cv["dynCall_iiidii"] = function() {
  return cv["asm"]["dynCall_iiidii"].apply(null, arguments);
};
cv["dynCall_viidii"] = function() {
  return cv["asm"]["dynCall_viidii"].apply(null, arguments);
};
cv["dynCall_iiidi"] = function() {
  return cv["asm"]["dynCall_iiidi"].apply(null, arguments);
};
cv["dynCall_iiid"] = function() {
  return cv["asm"]["dynCall_iiid"].apply(null, arguments);
};
cv["dynCall_iiiiifiii"] = function() {
  return cv["asm"]["dynCall_iiiiifiii"].apply(null, arguments);
};
cv["dynCall_viiiifiii"] = function() {
  return cv["asm"]["dynCall_viiiifiii"].apply(null, arguments);
};
cv["dynCall_iiiiifii"] = function() {
  return cv["asm"]["dynCall_iiiiifii"].apply(null, arguments);
};
cv["dynCall_viiiifii"] = function() {
  return cv["asm"]["dynCall_viiiifii"].apply(null, arguments);
};
cv["dynCall_iiiiifi"] = function() {
  return cv["asm"]["dynCall_iiiiifi"].apply(null, arguments);
};
cv["dynCall_viiiifi"] = function() {
  return cv["asm"]["dynCall_viiiifi"].apply(null, arguments);
};
cv["dynCall_iiiiif"] = function() {
  return cv["asm"]["dynCall_iiiiif"].apply(null, arguments);
};
cv["dynCall_viiiif"] = function() {
  return cv["asm"]["dynCall_viiiif"].apply(null, arguments);
};
cv["dynCall_vid"] = function() {
  return cv["asm"]["dynCall_vid"].apply(null, arguments);
};
cv["dynCall_iiiiffi"] = function() {
  return cv["asm"]["dynCall_iiiiffi"].apply(null, arguments);
};
cv["dynCall_viiiffi"] = function() {
  return cv["asm"]["dynCall_viiiffi"].apply(null, arguments);
};
cv["dynCall_iiiiff"] = function() {
  return cv["asm"]["dynCall_iiiiff"].apply(null, arguments);
};
cv["dynCall_viiiff"] = function() {
  return cv["asm"]["dynCall_viiiff"].apply(null, arguments);
};
cv["dynCall_iiiiiiffi"] = function() {
  return cv["asm"]["dynCall_iiiiiiffi"].apply(null, arguments);
};
cv["dynCall_viiiiiffi"] = function() {
  return cv["asm"]["dynCall_viiiiiffi"].apply(null, arguments);
};
cv["dynCall_iiiiiiff"] = function() {
  return cv["asm"]["dynCall_iiiiiiff"].apply(null, arguments);
};
cv["dynCall_viiiiiff"] = function() {
  return cv["asm"]["dynCall_viiiiiff"].apply(null, arguments);
};
cv["dynCall_iidi"] = function() {
  return cv["asm"]["dynCall_iidi"].apply(null, arguments);
};
cv["dynCall_iid"] = function() {
  return cv["asm"]["dynCall_iid"].apply(null, arguments);
};
cv["dynCall_iiifi"] = function() {
  return cv["asm"]["dynCall_iiifi"].apply(null, arguments);
};
cv["dynCall_viifi"] = function() {
  return cv["asm"]["dynCall_viifi"].apply(null, arguments);
};
cv["dynCall_iiif"] = function() {
  return cv["asm"]["dynCall_iiif"].apply(null, arguments);
};
cv["dynCall_vif"] = function() {
  return cv["asm"]["dynCall_vif"].apply(null, arguments);
};
cv["dynCall_viiidiiii"] = function() {
  return cv["asm"]["dynCall_viiidiiii"].apply(null, arguments);
};
cv["dynCall_viiidiii"] = function() {
  return cv["asm"]["dynCall_viiidiii"].apply(null, arguments);
};
cv["dynCall_viiidii"] = function() {
  return cv["asm"]["dynCall_viiidii"].apply(null, arguments);
};
cv["dynCall_viiiiidiiiii"] = function() {
  return cv["asm"]["dynCall_viiiiidiiiii"].apply(null, arguments);
};
cv["dynCall_viiiiiidiiiii"] = function() {
  return cv["asm"]["dynCall_viiiiiidiiiii"].apply(null, arguments);
};
cv["dynCall_viiiiiidiiii"] = function() {
  return cv["asm"]["dynCall_viiiiiidiiii"].apply(null, arguments);
};
cv["dynCall_viiiiiidiii"] = function() {
  return cv["asm"]["dynCall_viiiiiidiii"].apply(null, arguments);
};
cv["dynCall_viiiiiidii"] = function() {
  return cv["asm"]["dynCall_viiiiiidii"].apply(null, arguments);
};
cv["dynCall_viiiiifii"] = function() {
  return cv["asm"]["dynCall_viiiiifii"].apply(null, arguments);
};
cv["dynCall_viiifii"] = function() {
  return cv["asm"]["dynCall_viiifii"].apply(null, arguments);
};
cv["dynCall_viiifi"] = function() {
  return cv["asm"]["dynCall_viiifi"].apply(null, arguments);
};
cv["dynCall_iiiddiid"] = function() {
  return cv["asm"]["dynCall_iiiddiid"].apply(null, arguments);
};
cv["dynCall_viiddiid"] = function() {
  return cv["asm"]["dynCall_viiddiid"].apply(null, arguments);
};
cv["dynCall_iiiddii"] = function() {
  return cv["asm"]["dynCall_iiiddii"].apply(null, arguments);
};
cv["dynCall_iiiddi"] = function() {
  return cv["asm"]["dynCall_iiiddi"].apply(null, arguments);
};
cv["dynCall_iiiddiiid"] = function() {
  return cv["asm"]["dynCall_iiiddiiid"].apply(null, arguments);
};
cv["dynCall_viiddiiid"] = function() {
  return cv["asm"]["dynCall_viiddiiid"].apply(null, arguments);
};
cv["dynCall_iiiiiiiididiii"] = function() {
  return cv["asm"]["dynCall_iiiiiiiididiii"].apply(null, arguments);
};
cv["dynCall_iiiiiiiiiiiii"] = function() {
  return cv["asm"]["dynCall_iiiiiiiiiiiii"].apply(null, arguments);
};
cv["dynCall_viiiidiiddi"] = function() {
  return cv["asm"]["dynCall_viiiidiiddi"].apply(null, arguments);
};
cv["dynCall_viiiiidiiddi"] = function() {
  return cv["asm"]["dynCall_viiiiidiiddi"].apply(null, arguments);
};
cv["dynCall_viiiidiidd"] = function() {
  return cv["asm"]["dynCall_viiiidiidd"].apply(null, arguments);
};
cv["dynCall_viiiiidiidd"] = function() {
  return cv["asm"]["dynCall_viiiiidiidd"].apply(null, arguments);
};
cv["dynCall_viiiiidiid"] = function() {
  return cv["asm"]["dynCall_viiiiidiid"].apply(null, arguments);
};
cv["dynCall_iiiifiii"] = function() {
  return cv["asm"]["dynCall_iiiifiii"].apply(null, arguments);
};
cv["dynCall_viiifiii"] = function() {
  return cv["asm"]["dynCall_viiifiii"].apply(null, arguments);
};
cv["dynCall_iiiifii"] = function() {
  return cv["asm"]["dynCall_iiiifii"].apply(null, arguments);
};
cv["dynCall_iiiifi"] = function() {
  return cv["asm"]["dynCall_iiiifi"].apply(null, arguments);
};
cv["dynCall_iiiiiddiddi"] = function() {
  return cv["asm"]["dynCall_iiiiiddiddi"].apply(null, arguments);
};
cv["dynCall_viiiiddiddi"] = function() {
  return cv["asm"]["dynCall_viiiiddiddi"].apply(null, arguments);
};
cv["dynCall_iiiiiddidd"] = function() {
  return cv["asm"]["dynCall_iiiiiddidd"].apply(null, arguments);
};
cv["dynCall_viiiiddidd"] = function() {
  return cv["asm"]["dynCall_viiiiddidd"].apply(null, arguments);
};
cv["dynCall_iiiiiddid"] = function() {
  return cv["asm"]["dynCall_iiiiiddid"].apply(null, arguments);
};
cv["dynCall_viiiiddid"] = function() {
  return cv["asm"]["dynCall_viiiiddid"].apply(null, arguments);
};
cv["dynCall_iiiiiddi"] = function() {
  return cv["asm"]["dynCall_iiiiiddi"].apply(null, arguments);
};
cv["dynCall_iiiiidd"] = function() {
  return cv["asm"]["dynCall_iiiiidd"].apply(null, arguments);
};
cv["dynCall_iifff"] = function() {
  return cv["asm"]["dynCall_iifff"].apply(null, arguments);
};
cv["dynCall_vifff"] = function() {
  return cv["asm"]["dynCall_vifff"].apply(null, arguments);
};
cv["dynCall_iiff"] = function() {
  return cv["asm"]["dynCall_iiff"].apply(null, arguments);
};
cv["dynCall_viff"] = function() {
  return cv["asm"]["dynCall_viff"].apply(null, arguments);
};
cv["dynCall_iif"] = function() {
  return cv["asm"]["dynCall_iif"].apply(null, arguments);
};
cv["dynCall_iiifiiiiiii"] = function() {
  return cv["asm"]["dynCall_iiifiiiiiii"].apply(null, arguments);
};
cv["dynCall_viifiiiiiii"] = function() {
  return cv["asm"]["dynCall_viifiiiiiii"].apply(null, arguments);
};
cv["dynCall_iiifiiiiii"] = function() {
  return cv["asm"]["dynCall_iiifiiiiii"].apply(null, arguments);
};
cv["dynCall_viifiiiiii"] = function() {
  return cv["asm"]["dynCall_viifiiiiii"].apply(null, arguments);
};
cv["dynCall_iiifiiiii"] = function() {
  return cv["asm"]["dynCall_iiifiiiii"].apply(null, arguments);
};
cv["dynCall_viifiiiii"] = function() {
  return cv["asm"]["dynCall_viifiiiii"].apply(null, arguments);
};
cv["dynCall_iiifiiii"] = function() {
  return cv["asm"]["dynCall_iiifiiii"].apply(null, arguments);
};
cv["dynCall_viifiiii"] = function() {
  return cv["asm"]["dynCall_viifiiii"].apply(null, arguments);
};
cv["dynCall_iiifiii"] = function() {
  return cv["asm"]["dynCall_iiifiii"].apply(null, arguments);
};
cv["dynCall_viifiii"] = function() {
  return cv["asm"]["dynCall_viifiii"].apply(null, arguments);
};
cv["dynCall_iiifii"] = function() {
  return cv["asm"]["dynCall_iiifii"].apply(null, arguments);
};
cv["dynCall_viifii"] = function() {
  return cv["asm"]["dynCall_viifii"].apply(null, arguments);
};
cv["dynCall_iiffff"] = function() {
  return cv["asm"]["dynCall_iiffff"].apply(null, arguments);
};
cv["dynCall_viffff"] = function() {
  return cv["asm"]["dynCall_viffff"].apply(null, arguments);
};
cv["dynCall_viifff"] = function() {
  return cv["asm"]["dynCall_viifff"].apply(null, arguments);
};
cv["dynCall_iiifff"] = function() {
  return cv["asm"]["dynCall_iiifff"].apply(null, arguments);
};
cv["dynCall_viijii"] = function() {
  return cv["asm"]["dynCall_viijii"].apply(null, arguments);
};
cv["dynCall_ji"] = function() {
  return cv["asm"]["dynCall_ji"].apply(null, arguments);
};
cv["dynCall_viiiiiiiiiiddi"] = function() {
  return cv["asm"]["dynCall_viiiiiiiiiiddi"].apply(null, arguments);
};
cv["dynCall_v"] = function() {
  return cv["asm"]["dynCall_v"].apply(null, arguments);
};
cv["dynCall_viiiiiiiiidd"] = function() {
  return cv["asm"]["dynCall_viiiiiiiiidd"].apply(null, arguments);
};
cv["dynCall_fi"] = function() {
  return cv["asm"]["dynCall_fi"].apply(null, arguments);
};
cv["dynCall_jiii"] = function() {
  return cv["asm"]["dynCall_jiii"].apply(null, arguments);
};
cv["dynCall_vifi"] = function() {
  return cv["asm"]["dynCall_vifi"].apply(null, arguments);
};
cv["dynCall_vij"] = function() {
  return cv["asm"]["dynCall_vij"].apply(null, arguments);
};
cv["dynCall_iiiiiifiididiii"] = function() {
  return cv["asm"]["dynCall_iiiiiifiididiii"].apply(null, arguments);
};
cv["dynCall_viiidiiddi"] = function() {
  return cv["asm"]["dynCall_viiidiiddi"].apply(null, arguments);
};
cv["dynCall_jii"] = function() {
  return cv["asm"]["dynCall_jii"].apply(null, arguments);
};
cv["dynCall_viji"] = function() {
  return cv["asm"]["dynCall_viji"].apply(null, arguments);
};
cv["dynCall_jiji"] = function() {
  return cv["asm"]["dynCall_jiji"].apply(null, arguments);
};
cv["dynCall_iidiiii"] = function() {
  return cv["asm"]["dynCall_iidiiii"].apply(null, arguments);
};
cv["dynCall_iiiiij"] = function() {
  return cv["asm"]["dynCall_iiiiij"].apply(null, arguments);
};
cv["dynCall_iiiiijj"] = function() {
  return cv["asm"]["dynCall_iiiiijj"].apply(null, arguments);
};
cv["dynCall_iiiiiijj"] = function() {
  return cv["asm"]["dynCall_iiiiiijj"].apply(null, arguments);
};
cv["asm"] = asm;
cv["getMemory"] = getMemory;
cv["addRunDependency"] = addRunDependency;
cv["removeRunDependency"] = removeRunDependency;
cv["FS_createFolder"] = FS.createFolder;
cv["FS_createPath"] = FS.createPath;
cv["FS_createDataFile"] = FS.createDataFile;
cv["FS_createPreloadedFile"] = FS.createPreloadedFile;
cv["FS_createLazyFile"] = FS.createLazyFile;
cv["FS_createLink"] = FS.createLink;
cv["FS_createDevice"] = FS.createDevice;
cv["FS_unlink"] = FS.unlink;
cv["calledRun"] = calledRun;
var calledRun;
cv["then"] = function(func) {
  if (calledRun) {
    func(cv);
  } else {
    var old = cv["onRuntimeInitialized"];
    cv["onRuntimeInitialized"] = function() {
      if (old)
        old();
      func(cv);
    };
  }
  return cv;
};
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}
dependenciesFulfilled = function runCaller() {
  if (!calledRun)
    run();
  if (!calledRun)
    dependenciesFulfilled = runCaller;
};
function run(args) {
  if (runDependencies > 0) {
    return;
  }
  preRun();
  if (runDependencies > 0)
    return;
  function doRun() {
    if (calledRun)
      return;
    calledRun = true;
    cv["calledRun"] = true;
    if (ABORT)
      return;
    initRuntime();
    preMain();
    if (cv["onRuntimeInitialized"])
      cv["onRuntimeInitialized"]();
    postRun();
  }
  if (cv["setStatus"]) {
    cv["setStatus"]("Running...");
    setTimeout(function() {
      setTimeout(function() {
        cv["setStatus"]("");
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
cv["run"] = run;
if (cv["preInit"]) {
  if (typeof cv["preInit"] == "function")
    cv["preInit"] = [cv["preInit"]];
  while (cv["preInit"].length > 0) {
    cv["preInit"].pop()();
  }
}
run();
if (typeof cv.FS === "undefined" && typeof FS !== "undefined") {
  cv.FS = FS;
}
cv["imread"] = function(imageSource) {
  var img = null;
  if (typeof imageSource === "string") {
    img = document.getElementById(imageSource);
  } else {
    img = imageSource;
  }
  var canvas = null;
  var ctx = null;
  if (img instanceof HTMLImageElement) {
    canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, img.width, img.height);
  } else if (img instanceof HTMLCanvasElement) {
    canvas = img;
    ctx = canvas.getContext("2d");
  } else {
    throw new Error("Please input the valid canvas or img id.");
  }
  var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return cv.matFromImageData(imgData);
};
cv["imshow"] = function(canvasSource, mat) {
  var canvas = null;
  if (typeof canvasSource === "string") {
    canvas = document.getElementById(canvasSource);
  } else {
    canvas = canvasSource;
  }
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Please input the valid canvas element or id.");
  }
  if (!(mat instanceof cv.Mat)) {
    throw new Error("Please input the valid cv.Mat instance.");
  }
  var img = new cv.Mat();
  var depth = mat.type() % 8;
  var scale = depth <= cv.CV_8S ? 1 : depth <= cv.CV_32S ? 1 / 256 : 255;
  var shift = depth === cv.CV_8S || depth === cv.CV_16S ? 128 : 0;
  mat.convertTo(img, cv.CV_8U, scale, shift);
  switch (img.type()) {
    case cv.CV_8UC1:
      cv.cvtColor(img, img, cv.COLOR_GRAY2RGBA);
      break;
    case cv.CV_8UC3:
      cv.cvtColor(img, img, cv.COLOR_RGB2RGBA);
      break;
    case cv.CV_8UC4:
      break;
    default:
      throw new Error("Bad number of channels (Source image must have 1, 3 or 4 channels)");
  }
  var imgData = new ImageData(new Uint8ClampedArray(img.data), img.cols, img.rows);
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = imgData.width;
  canvas.height = imgData.height;
  ctx.putImageData(imgData, 0, 0);
  img.delete();
};
cv["VideoCapture"] = function(videoSource) {
  var video = null;
  if (typeof videoSource === "string") {
    video = document.getElementById(videoSource);
  } else {
    video = videoSource;
  }
  if (!(video instanceof HTMLVideoElement)) {
    throw new Error("Please input the valid video element or id.");
  }
  var canvas = document.createElement("canvas");
  canvas.width = video.width;
  canvas.height = video.height;
  var ctx = canvas.getContext("2d");
  this.video = video;
  this.read = function(frame) {
    if (!(frame instanceof cv.Mat)) {
      throw new Error("Please input the valid cv.Mat instance.");
    }
    if (frame.type() !== cv.CV_8UC4) {
      throw new Error("Bad type of input mat: the type should be cv.CV_8UC4.");
    }
    if (frame.cols !== video.width || frame.rows !== video.height) {
      throw new Error("Bad size of input mat: the size should be same as the video.");
    }
    ctx.drawImage(video, 0, 0, video.width, video.height);
    frame.data.set(ctx.getImageData(0, 0, video.width, video.height).data);
  };
};
function Range(start, end) {
  this.start = typeof start === "undefined" ? 0 : start;
  this.end = typeof end === "undefined" ? 0 : end;
}
cv["Range"] = Range;
function Point(x, y) {
  this.x = typeof x === "undefined" ? 0 : x;
  this.y = typeof y === "undefined" ? 0 : y;
}
cv["Point"] = Point;
function Size(width, height) {
  this.width = typeof width === "undefined" ? 0 : width;
  this.height = typeof height === "undefined" ? 0 : height;
}
cv["Size"] = Size;
function Rect() {
  switch (arguments.length) {
    case 0: {
      this.x = 0;
      this.y = 0;
      this.width = 0;
      this.height = 0;
      break;
    }
    case 1: {
      var rect = arguments[0];
      this.x = rect.x;
      this.y = rect.y;
      this.width = rect.width;
      this.height = rect.height;
      break;
    }
    case 2: {
      var point = arguments[0];
      var size = arguments[1];
      this.x = point.x;
      this.y = point.y;
      this.width = size.width;
      this.height = size.height;
      break;
    }
    case 4: {
      this.x = arguments[0];
      this.y = arguments[1];
      this.width = arguments[2];
      this.height = arguments[3];
      break;
    }
    default: {
      throw new Error("Invalid arguments");
    }
  }
}
cv["Rect"] = Rect;
function RotatedRect() {
  switch (arguments.length) {
    case 0: {
      this.center = { x: 0, y: 0 };
      this.size = { width: 0, height: 0 };
      this.angle = 0;
      break;
    }
    case 3: {
      this.center = arguments[0];
      this.size = arguments[1];
      this.angle = arguments[2];
      break;
    }
    default: {
      throw new Error("Invalid arguments");
    }
  }
}
RotatedRect.points = function(obj) {
  return cv.rotatedRectPoints(obj);
};
RotatedRect.boundingRect = function(obj) {
  return cv.rotatedRectBoundingRect(obj);
};
RotatedRect.boundingRect2f = function(obj) {
  return cv.rotatedRectBoundingRect2f(obj);
};
cv["RotatedRect"] = RotatedRect;
function Scalar(v0, v1, v2, v3) {
  this.push(typeof v0 === "undefined" ? 0 : v0);
  this.push(typeof v1 === "undefined" ? 0 : v1);
  this.push(typeof v2 === "undefined" ? 0 : v2);
  this.push(typeof v3 === "undefined" ? 0 : v3);
}
Scalar.prototype = new Array();
Scalar.all = function(v) {
  return new Scalar(v, v, v, v);
};
cv["Scalar"] = Scalar;
function MinMaxLoc() {
  switch (arguments.length) {
    case 0: {
      this.minVal = 0;
      this.maxVal = 0;
      this.minLoc = new Point();
      this.maxLoc = new Point();
      break;
    }
    case 4: {
      this.minVal = arguments[0];
      this.maxVal = arguments[1];
      this.minLoc = arguments[2];
      this.maxLoc = arguments[3];
      break;
    }
    default: {
      throw new Error("Invalid arguments");
    }
  }
}
cv["MinMaxLoc"] = MinMaxLoc;
function Circle() {
  switch (arguments.length) {
    case 0: {
      this.center = new Point();
      this.radius = 0;
      break;
    }
    case 2: {
      this.center = arguments[0];
      this.radius = arguments[1];
      break;
    }
    default: {
      throw new Error("Invalid arguments");
    }
  }
}
cv["Circle"] = Circle;
function TermCriteria() {
  switch (arguments.length) {
    case 0: {
      this.type = 0;
      this.maxCount = 0;
      this.epsilon = 0;
      break;
    }
    case 3: {
      this.type = arguments[0];
      this.maxCount = arguments[1];
      this.epsilon = arguments[2];
      break;
    }
    default: {
      throw new Error("Invalid arguments");
    }
  }
}
cv["TermCriteria"] = TermCriteria;
cv["matFromArray"] = function(rows, cols, type, array) {
  var mat = new cv.Mat(rows, cols, type);
  switch (type) {
    case cv.CV_8U:
    case cv.CV_8UC1:
    case cv.CV_8UC2:
    case cv.CV_8UC3:
    case cv.CV_8UC4: {
      mat.data.set(array);
      break;
    }
    case cv.CV_8S:
    case cv.CV_8SC1:
    case cv.CV_8SC2:
    case cv.CV_8SC3:
    case cv.CV_8SC4: {
      mat.data8S.set(array);
      break;
    }
    case cv.CV_16U:
    case cv.CV_16UC1:
    case cv.CV_16UC2:
    case cv.CV_16UC3:
    case cv.CV_16UC4: {
      mat.data16U.set(array);
      break;
    }
    case cv.CV_16S:
    case cv.CV_16SC1:
    case cv.CV_16SC2:
    case cv.CV_16SC3:
    case cv.CV_16SC4: {
      mat.data16S.set(array);
      break;
    }
    case cv.CV_32S:
    case cv.CV_32SC1:
    case cv.CV_32SC2:
    case cv.CV_32SC3:
    case cv.CV_32SC4: {
      mat.data32S.set(array);
      break;
    }
    case cv.CV_32F:
    case cv.CV_32FC1:
    case cv.CV_32FC2:
    case cv.CV_32FC3:
    case cv.CV_32FC4: {
      mat.data32F.set(array);
      break;
    }
    case cv.CV_64F:
    case cv.CV_64FC1:
    case cv.CV_64FC2:
    case cv.CV_64FC3:
    case cv.CV_64FC4: {
      mat.data64F.set(array);
      break;
    }
    default: {
      throw new Error("Type is unsupported");
    }
  }
  return mat;
};
cv["matFromImageData"] = function(imageData) {
  var mat = new cv.Mat(imageData.height, imageData.width, cv.CV_8UC4);
  mat.data.set(imageData.data);
  return mat;
};
cv["loadPromise"] = new Promise((resolve) => {
  cv.onRuntimeInitialized = resolve;
});
cv["init"] = function () {
  return cv.loadPromise;
};
export { cv as default };
