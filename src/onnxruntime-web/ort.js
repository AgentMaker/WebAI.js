var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getAugmentedNamespace(n) {
  if (n.__esModule)
    return n;
  var a = Object.defineProperty({}, "__esModule", { value: true });
  Object.keys(n).forEach(function(k) {
    var d = Object.getOwnPropertyDescriptor(n, k);
    Object.defineProperty(a, k, d.get ? d : {
      enumerable: true,
      get: function() {
        return n[k];
      }
    });
  });
  return a;
}
function commonjsRequire(path2) {
  throw new Error('Could not dynamically require "' + path2 + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var lib$1 = {};
const backends = {};
const backendsSortedByPriority = [];
const registerBackend = (name2, backend2, priority) => {
  if (backend2 && typeof backend2.init === "function" && typeof backend2.createSessionHandler === "function") {
    const currentBackend = backends[name2];
    if (currentBackend === void 0) {
      backends[name2] = { backend: backend2, priority };
    } else if (currentBackend.backend === backend2) {
      return;
    } else {
      throw new Error(`backend "${name2}" is already registered`);
    }
    if (priority >= 0) {
      for (let i = 0; i < backendsSortedByPriority.length; i++) {
        if (backends[backendsSortedByPriority[i]].priority <= priority) {
          backendsSortedByPriority.splice(i, 0, name2);
          return;
        }
      }
      backendsSortedByPriority.push(name2);
    }
    return;
  }
  throw new TypeError("not a valid backend");
};
const resolveBackend = async (backendHints) => {
  const backendNames = backendHints.length === 0 ? backendsSortedByPriority : backendHints;
  const errors = [];
  for (const backendName of backendNames) {
    const backendInfo = backends[backendName];
    if (backendInfo) {
      if (backendInfo.initialized) {
        return backendInfo.backend;
      } else if (backendInfo.aborted) {
        continue;
      }
      const isInitializing = !!backendInfo.initPromise;
      try {
        if (!isInitializing) {
          backendInfo.initPromise = backendInfo.backend.init();
        }
        await backendInfo.initPromise;
        backendInfo.initialized = true;
        return backendInfo.backend;
      } catch (e) {
        if (!isInitializing) {
          errors.push({ name: backendName, err: e });
        }
        backendInfo.aborted = true;
      } finally {
        delete backendInfo.initPromise;
      }
    }
  }
  throw new Error(`no available backend found. ERR: ${errors.map((e) => `[${e.name}] ${e.err}`).join(", ")}`);
};
class EnvImpl {
  constructor() {
    this.wasm = {};
    this.webgl = {};
    this.logLevelInternal = "warning";
  }
  set logLevel(value) {
    if (value === void 0) {
      return;
    }
    if (typeof value !== "string" || ["verbose", "info", "warning", "error", "fatal"].indexOf(value) === -1) {
      throw new Error(`Unsupported logging level: ${value}`);
    }
    this.logLevelInternal = value;
  }
  get logLevel() {
    return this.logLevelInternal;
  }
}
const env = new EnvImpl();
const isBigInt64ArrayAvailable = typeof BigInt64Array !== "undefined" && typeof BigInt64Array.from === "function";
const isBigUint64ArrayAvailable = typeof BigUint64Array !== "undefined" && typeof BigUint64Array.from === "function";
const NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP = /* @__PURE__ */ new Map([
  ["float32", Float32Array],
  ["uint8", Uint8Array],
  ["int8", Int8Array],
  ["uint16", Uint16Array],
  ["int16", Int16Array],
  ["int32", Int32Array],
  ["bool", Uint8Array],
  ["float64", Float64Array],
  ["uint32", Uint32Array]
]);
const NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP = /* @__PURE__ */ new Map([
  [Float32Array, "float32"],
  [Uint8Array, "uint8"],
  [Int8Array, "int8"],
  [Uint16Array, "uint16"],
  [Int16Array, "int16"],
  [Int32Array, "int32"],
  [Float64Array, "float64"],
  [Uint32Array, "uint32"]
]);
if (isBigInt64ArrayAvailable) {
  NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.set("int64", BigInt64Array);
  NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP.set(BigInt64Array, "int64");
}
if (isBigUint64ArrayAvailable) {
  NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.set("uint64", BigUint64Array);
  NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP.set(BigUint64Array, "uint64");
}
const calculateSize = (dims) => {
  let size = 1;
  for (let i = 0; i < dims.length; i++) {
    const dim = dims[i];
    if (typeof dim !== "number" || !Number.isSafeInteger(dim)) {
      throw new TypeError(`dims[${i}] must be an integer, got: ${dim}`);
    }
    if (dim < 0) {
      throw new RangeError(`dims[${i}] must be a non-negative integer, got: ${dim}`);
    }
    size *= dim;
  }
  return size;
};
class Tensor$2 {
  constructor(arg0, arg1, arg2) {
    let type;
    let data;
    let dims;
    if (typeof arg0 === "string") {
      type = arg0;
      dims = arg2;
      if (arg0 === "string") {
        if (!Array.isArray(arg1)) {
          throw new TypeError("A string tensor's data must be a string array.");
        }
        data = arg1;
      } else {
        const typedArrayConstructor = NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.get(arg0);
        if (typedArrayConstructor === void 0) {
          throw new TypeError(`Unsupported tensor type: ${arg0}.`);
        }
        if (Array.isArray(arg1)) {
          data = typedArrayConstructor.from(arg1);
        } else if (arg1 instanceof typedArrayConstructor) {
          data = arg1;
        } else {
          throw new TypeError(`A ${type} tensor's data must be type of ${typedArrayConstructor}`);
        }
      }
    } else {
      dims = arg1;
      if (Array.isArray(arg0)) {
        if (arg0.length === 0) {
          throw new TypeError("Tensor type cannot be inferred from an empty array.");
        }
        const firstElementType = typeof arg0[0];
        if (firstElementType === "string") {
          type = "string";
          data = arg0;
        } else if (firstElementType === "boolean") {
          type = "bool";
          data = Uint8Array.from(arg0);
        } else {
          throw new TypeError(`Invalid element type of data array: ${firstElementType}.`);
        }
      } else {
        const mappedType = NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP.get(arg0.constructor);
        if (mappedType === void 0) {
          throw new TypeError(`Unsupported type for tensor data: ${arg0.constructor}.`);
        }
        type = mappedType;
        data = arg0;
      }
    }
    if (dims === void 0) {
      dims = [data.length];
    } else if (!Array.isArray(dims)) {
      throw new TypeError("A tensor's dims must be a number array");
    }
    const size = calculateSize(dims);
    if (size !== data.length) {
      throw new Error(`Tensor's size(${size}) does not match data length(${data.length}).`);
    }
    this.dims = dims;
    this.type = type;
    this.data = data;
    this.size = size;
  }
  reshape(dims) {
    return new Tensor$2(this.type, this.data, dims);
  }
}
const Tensor$1 = Tensor$2;
class InferenceSession$1 {
  constructor(handler) {
    this.handler = handler;
  }
  async run(feeds, arg1, arg2) {
    const fetches = {};
    let options = {};
    if (typeof feeds !== "object" || feeds === null || feeds instanceof Tensor$1 || Array.isArray(feeds)) {
      throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");
    }
    let isFetchesEmpty = true;
    if (typeof arg1 === "object") {
      if (arg1 === null) {
        throw new TypeError("Unexpected argument[1]: cannot be null.");
      }
      if (arg1 instanceof Tensor$1) {
        throw new TypeError("'fetches' cannot be a Tensor");
      }
      if (Array.isArray(arg1)) {
        if (arg1.length === 0) {
          throw new TypeError("'fetches' cannot be an empty array.");
        }
        isFetchesEmpty = false;
        for (const name2 of arg1) {
          if (typeof name2 !== "string") {
            throw new TypeError("'fetches' must be a string array or an object.");
          }
          if (this.outputNames.indexOf(name2) === -1) {
            throw new RangeError(`'fetches' contains invalid output name: ${name2}.`);
          }
          fetches[name2] = null;
        }
        if (typeof arg2 === "object" && arg2 !== null) {
          options = arg2;
        } else if (typeof arg2 !== "undefined") {
          throw new TypeError("'options' must be an object.");
        }
      } else {
        let isFetches = false;
        const arg1Keys = Object.getOwnPropertyNames(arg1);
        for (const name2 of this.outputNames) {
          if (arg1Keys.indexOf(name2) !== -1) {
            const v = arg1[name2];
            if (v === null || v instanceof Tensor$1) {
              isFetches = true;
              isFetchesEmpty = false;
              fetches[name2] = v;
            }
          }
        }
        if (isFetches) {
          if (typeof arg2 === "object" && arg2 !== null) {
            options = arg2;
          } else if (typeof arg2 !== "undefined") {
            throw new TypeError("'options' must be an object.");
          }
        } else {
          options = arg1;
        }
      }
    } else if (typeof arg1 !== "undefined") {
      throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");
    }
    for (const name2 of this.inputNames) {
      if (typeof feeds[name2] === "undefined") {
        throw new Error(`input '${name2}' is missing in 'feeds'.`);
      }
    }
    if (isFetchesEmpty) {
      for (const name2 of this.outputNames) {
        fetches[name2] = null;
      }
    }
    const results = await this.handler.run(feeds, fetches, options);
    const returnValue = {};
    for (const key in results) {
      if (Object.hasOwnProperty.call(results, key)) {
        returnValue[key] = new Tensor$1(results[key].type, results[key].data, results[key].dims);
      }
    }
    return returnValue;
  }
  static async create(arg0, arg1, arg2, arg3) {
    let filePathOrUint8Array;
    let options = {};
    if (typeof arg0 === "string") {
      filePathOrUint8Array = arg0;
      if (typeof arg1 === "object" && arg1 !== null) {
        options = arg1;
      } else if (typeof arg1 !== "undefined") {
        throw new TypeError("'options' must be an object.");
      }
    } else if (arg0 instanceof Uint8Array) {
      filePathOrUint8Array = arg0;
      if (typeof arg1 === "object" && arg1 !== null) {
        options = arg1;
      } else if (typeof arg1 !== "undefined") {
        throw new TypeError("'options' must be an object.");
      }
    } else if (arg0 instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && arg0 instanceof SharedArrayBuffer) {
      const buffer = arg0;
      let byteOffset = 0;
      let byteLength = arg0.byteLength;
      if (typeof arg1 === "object" && arg1 !== null) {
        options = arg1;
      } else if (typeof arg1 === "number") {
        byteOffset = arg1;
        if (!Number.isSafeInteger(byteOffset)) {
          throw new RangeError("'byteOffset' must be an integer.");
        }
        if (byteOffset < 0 || byteOffset >= buffer.byteLength) {
          throw new RangeError(`'byteOffset' is out of range [0, ${buffer.byteLength}).`);
        }
        byteLength = arg0.byteLength - byteOffset;
        if (typeof arg2 === "number") {
          byteLength = arg2;
          if (!Number.isSafeInteger(byteLength)) {
            throw new RangeError("'byteLength' must be an integer.");
          }
          if (byteLength <= 0 || byteOffset + byteLength > buffer.byteLength) {
            throw new RangeError(`'byteLength' is out of range (0, ${buffer.byteLength - byteOffset}].`);
          }
          if (typeof arg3 === "object" && arg3 !== null) {
            options = arg3;
          } else if (typeof arg3 !== "undefined") {
            throw new TypeError("'options' must be an object.");
          }
        } else if (typeof arg2 !== "undefined") {
          throw new TypeError("'byteLength' must be a number.");
        }
      } else if (typeof arg1 !== "undefined") {
        throw new TypeError("'options' must be an object.");
      }
      filePathOrUint8Array = new Uint8Array(buffer, byteOffset, byteLength);
    } else {
      throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");
    }
    const eps = options.executionProviders || [];
    const backendHints = eps.map((i) => typeof i === "string" ? i : i.name);
    const backend2 = await resolveBackend(backendHints);
    const handler = await backend2.createSessionHandler(filePathOrUint8Array, options);
    return new InferenceSession$1(handler);
  }
  startProfiling() {
    this.handler.startProfiling();
  }
  endProfiling() {
    this.handler.endProfiling();
  }
  get inputNames() {
    return this.handler.inputNames;
  }
  get outputNames() {
    return this.handler.outputNames;
  }
}
const InferenceSession = InferenceSession$1;
var lib = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  registerBackend,
  env,
  InferenceSession,
  Tensor: Tensor$1
}, Symbol.toStringTag, { value: "Module" }));
var require$$0$1 = /* @__PURE__ */ getAugmentedNamespace(lib);
var backendOnnxjs = {};
var session = {};
var __viteBrowserExternal = {};
var __viteBrowserExternal$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": __viteBrowserExternal
}, Symbol.toStringTag, { value: "Module" }));
var require$$3$1 = /* @__PURE__ */ getAugmentedNamespace(__viteBrowserExternal$1);
var backend = {};
var backendWebgl = {};
var instrument = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.now = exports.Profiler = exports.Logger = void 0;
  class NoOpLoggerProvider {
    log(_severity, _content, _category) {
    }
  }
  class ConsoleLoggerProvider {
    log(severity, content, category) {
      console.log(`${this.color(severity)} ${category ? "\x1B[35m" + category + "\x1B[0m " : ""}${content}`);
    }
    color(severity) {
      switch (severity) {
        case "verbose":
          return "\x1B[34;40mv\x1B[0m";
        case "info":
          return "\x1B[32mi\x1B[0m";
        case "warning":
          return "\x1B[30;43mw\x1B[0m";
        case "error":
          return "\x1B[31;40me\x1B[0m";
        case "fatal":
          return "\x1B[101mf\x1B[0m";
        default:
          throw new Error(`unsupported severity: ${severity}`);
      }
    }
  }
  const SEVERITY_VALUE = {
    verbose: 1e3,
    info: 2e3,
    warning: 4e3,
    error: 5e3,
    fatal: 6e3
  };
  const LOGGER_PROVIDER_MAP = {
    ["none"]: new NoOpLoggerProvider(),
    ["console"]: new ConsoleLoggerProvider()
  };
  const LOGGER_DEFAULT_CONFIG = {
    provider: "console",
    minimalSeverity: "warning",
    logDateTime: true,
    logSourceLocation: false
  };
  let LOGGER_CONFIG_MAP = { [""]: LOGGER_DEFAULT_CONFIG };
  function log(arg0, arg1, arg2, arg3) {
    if (arg1 === void 0) {
      return createCategorizedLogger(arg0);
    } else if (arg2 === void 0) {
      logInternal(arg0, arg1);
    } else if (typeof arg2 === "number" && arg3 === void 0) {
      logInternal(arg0, arg1);
    } else if (typeof arg2 === "string" && arg3 === void 0) {
      logInternal(arg0, arg2, 1, arg1);
    } else if (typeof arg2 === "string" && typeof arg3 === "number") {
      logInternal(arg0, arg2, arg3, arg1);
    } else {
      throw new TypeError("input is valid");
    }
  }
  function createCategorizedLogger(category) {
    return {
      verbose: log.verbose.bind(null, category),
      info: log.info.bind(null, category),
      warning: log.warning.bind(null, category),
      error: log.error.bind(null, category),
      fatal: log.fatal.bind(null, category)
    };
  }
  function logInternal(severity, content, stack, category) {
    const config = LOGGER_CONFIG_MAP[category || ""] || LOGGER_CONFIG_MAP[""];
    if (SEVERITY_VALUE[severity] < SEVERITY_VALUE[config.minimalSeverity]) {
      return;
    }
    if (config.logDateTime) {
      content = `${new Date().toISOString()}|${content}`;
    }
    if (config.logSourceLocation)
      ;
    LOGGER_PROVIDER_MAP[config.provider].log(severity, content, category);
  }
  (function(log2) {
    function verbose(arg0, arg1) {
      log2("verbose", arg0, arg1);
    }
    log2.verbose = verbose;
    function info(arg0, arg1) {
      log2("info", arg0, arg1);
    }
    log2.info = info;
    function warning(arg0, arg1) {
      log2("warning", arg0, arg1);
    }
    log2.warning = warning;
    function error(arg0, arg1) {
      log2("error", arg0, arg1);
    }
    log2.error = error;
    function fatal(arg0, arg1) {
      log2("fatal", arg0, arg1);
    }
    log2.fatal = fatal;
    function reset2(config) {
      LOGGER_CONFIG_MAP = {};
      set("", config || {});
    }
    log2.reset = reset2;
    function set(category, config) {
      if (category === "*") {
        reset2(config);
      } else {
        const previousConfig = LOGGER_CONFIG_MAP[category] || LOGGER_DEFAULT_CONFIG;
        LOGGER_CONFIG_MAP[category] = {
          provider: config.provider || previousConfig.provider,
          minimalSeverity: config.minimalSeverity || previousConfig.minimalSeverity,
          logDateTime: config.logDateTime === void 0 ? previousConfig.logDateTime : config.logDateTime,
          logSourceLocation: config.logSourceLocation === void 0 ? previousConfig.logSourceLocation : config.logSourceLocation
        };
      }
    }
    log2.set = set;
    function setWithEnv(env2) {
      const config = {};
      if (env2.logLevel) {
        config.minimalSeverity = env2.logLevel;
      }
      set("", config);
    }
    log2.setWithEnv = setWithEnv;
  })(log || (log = {}));
  exports.Logger = log;
  class Event {
    constructor(category, name2, startTime, endCallback, timer, ctx) {
      this.category = category;
      this.name = name2;
      this.startTime = startTime;
      this.endCallback = endCallback;
      this.timer = timer;
      this.ctx = ctx;
    }
    end() {
      return this.endCallback(this);
    }
    async checkTimer() {
      if (this.ctx === void 0 || this.timer === void 0) {
        throw new Error("No webgl timer found");
      } else {
        this.ctx.endTimer();
        return this.ctx.waitForQueryAndGetTime(this.timer);
      }
    }
  }
  class EventRecord {
    constructor(category, name2, startTime, endTime) {
      this.category = category;
      this.name = name2;
      this.startTime = startTime;
      this.endTime = endTime;
    }
  }
  class Profiler {
    constructor(maxNumberEvents, flushBatchSize, flushIntervalInMilliseconds) {
      this._started = false;
      this._flushPointer = 0;
      this._started = false;
      this._maxNumberEvents = maxNumberEvents === void 0 ? 1e4 : maxNumberEvents;
      this._flushBatchSize = flushBatchSize === void 0 ? 10 : flushBatchSize;
      this._flushIntervalInMilliseconds = flushIntervalInMilliseconds === void 0 ? 5e3 : flushIntervalInMilliseconds;
    }
    static create(config) {
      if (config === void 0) {
        return new this();
      }
      return new this(config.maxNumberEvents, config.flushBatchSize, config.flushIntervalInMilliseconds);
    }
    start() {
      this._started = true;
      this._timingEvents = [];
      this._flushTime = exports.now();
      this._flushPointer = 0;
    }
    stop() {
      this._started = false;
      for (; this._flushPointer < this._timingEvents.length; this._flushPointer++) {
        this.logOneEvent(this._timingEvents[this._flushPointer]);
      }
    }
    event(category, name2, func, ctx) {
      const event = this._started ? this.begin(category, name2, ctx) : void 0;
      let isPromise = false;
      const res = func();
      if (res && typeof res.then === "function") {
        isPromise = true;
        return new Promise((resolve, reject) => {
          res.then(async (value) => {
            if (event) {
              await event.end();
            }
            resolve(value);
          }, async (reason) => {
            if (event) {
              await event.end();
            }
            reject(reason);
          });
        });
      }
      if (!isPromise && event) {
        const eventRes = event.end();
        if (eventRes && typeof eventRes.then === "function") {
          return new Promise((resolve, reject) => {
            eventRes.then(() => {
              resolve(res);
            }, (reason) => {
              reject(reason);
            });
          });
        }
      }
      return res;
    }
    begin(category, name2, ctx) {
      if (!this._started) {
        throw new Error("profiler is not started yet");
      }
      if (ctx === void 0) {
        const startTime = exports.now();
        this.flush(startTime);
        return new Event(category, name2, startTime, (e) => this.endSync(e));
      } else {
        const timer = ctx.beginTimer();
        return new Event(category, name2, 0, async (e) => this.end(e), timer, ctx);
      }
    }
    async end(event) {
      const endTime = await event.checkTimer();
      if (this._timingEvents.length < this._maxNumberEvents) {
        this._timingEvents.push(new EventRecord(event.category, event.name, event.startTime, endTime));
        this.flush(endTime);
      }
    }
    endSync(event) {
      const endTime = exports.now();
      if (this._timingEvents.length < this._maxNumberEvents) {
        this._timingEvents.push(new EventRecord(event.category, event.name, event.startTime, endTime));
        this.flush(endTime);
      }
    }
    logOneEvent(event) {
      exports.Logger.verbose(`Profiler.${event.category}`, `${(event.endTime - event.startTime).toFixed(2)}ms on event '${event.name}' at ${event.endTime.toFixed(2)}`);
    }
    flush(currentTime) {
      if (this._timingEvents.length - this._flushPointer >= this._flushBatchSize || currentTime - this._flushTime >= this._flushIntervalInMilliseconds) {
        for (const previousPointer = this._flushPointer; this._flushPointer < previousPointer + this._flushBatchSize && this._flushPointer < this._timingEvents.length; this._flushPointer++) {
          this.logOneEvent(this._timingEvents[this._flushPointer]);
        }
        this._flushTime = exports.now();
      }
    }
    get started() {
      return this._started;
    }
  }
  exports.Profiler = Profiler;
  exports.now = typeof performance !== "undefined" && performance.now ? () => performance.now() : Date.now;
})(instrument);
var sessionHandler$2 = {};
var opset = {};
Object.defineProperty(opset, "__esModule", { value: true });
opset.resolveOperator = void 0;
function resolveOperator(node, opsets, rules) {
  for (const rule of rules) {
    const opType = rule[0];
    const domain = rule[1];
    const versionSelector = rule[2];
    const opImpl = rule[3];
    const opInit = rule[4];
    if (node.opType === opType) {
      for (const opset2 of opsets) {
        if (opset2.domain === domain || opset2.domain === "ai.onnx" && domain === "") {
          if (matchSelector(opset2.version, versionSelector)) {
            return { opImpl, opInit };
          }
        }
      }
    }
  }
  throw new TypeError(`cannot resolve operator '${node.opType}' with opsets: ${opsets.map((set) => `${set.domain || "ai.onnx"} v${set.version}`).join(", ")}`);
}
opset.resolveOperator = resolveOperator;
function matchSelector(version, selector) {
  if (selector.endsWith("+")) {
    const rangeStart = Number.parseInt(selector.substring(0, selector.length - 1), 10);
    return !isNaN(rangeStart) && rangeStart <= version;
  } else if (selector.split("-").length === 2) {
    const pair = selector.split("-");
    const rangeStart = Number.parseInt(pair[0], 10);
    const rangeEnd = Number.parseInt(pair[1], 10);
    return !isNaN(rangeStart) && !isNaN(rangeEnd) && rangeStart <= version && version <= rangeEnd;
  } else {
    return Number.parseInt(selector, 10) === version;
  }
}
var inferenceHandler = {};
var tensor = {};
var guid = {};
guid.__esModule = true;
var Guid = function() {
  function Guid2(guid2) {
    if (!guid2) {
      throw new TypeError("Invalid argument; `value` has no value.");
    }
    this.value = Guid2.EMPTY;
    if (guid2 && Guid2.isGuid(guid2)) {
      this.value = guid2;
    }
  }
  Guid2.isGuid = function(guid2) {
    var value = guid2.toString();
    return guid2 && (guid2 instanceof Guid2 || Guid2.validator.test(value));
  };
  Guid2.create = function() {
    return new Guid2([Guid2.gen(2), Guid2.gen(1), Guid2.gen(1), Guid2.gen(1), Guid2.gen(3)].join("-"));
  };
  Guid2.createEmpty = function() {
    return new Guid2("emptyguid");
  };
  Guid2.parse = function(guid2) {
    return new Guid2(guid2);
  };
  Guid2.raw = function() {
    return [Guid2.gen(2), Guid2.gen(1), Guid2.gen(1), Guid2.gen(1), Guid2.gen(3)].join("-");
  };
  Guid2.gen = function(count) {
    var out = "";
    for (var i = 0; i < count; i++) {
      out += ((1 + Math.random()) * 65536 | 0).toString(16).substring(1);
    }
    return out;
  };
  Guid2.prototype.equals = function(other) {
    return Guid2.isGuid(other) && this.value === other.toString();
  };
  Guid2.prototype.isEmpty = function() {
    return this.value === Guid2.EMPTY;
  };
  Guid2.prototype.toString = function() {
    return this.value;
  };
  Guid2.prototype.toJSON = function() {
    return {
      value: this.value
    };
  };
  Guid2.validator = new RegExp("^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$", "i");
  Guid2.EMPTY = "00000000-0000-0000-0000-000000000000";
  return Guid2;
}();
guid.Guid = Guid;
var long = Long;
var wasm$1 = null;
try {
  wasm$1 = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([
    0,
    97,
    115,
    109,
    1,
    0,
    0,
    0,
    1,
    13,
    2,
    96,
    0,
    1,
    127,
    96,
    4,
    127,
    127,
    127,
    127,
    1,
    127,
    3,
    7,
    6,
    0,
    1,
    1,
    1,
    1,
    1,
    6,
    6,
    1,
    127,
    1,
    65,
    0,
    11,
    7,
    50,
    6,
    3,
    109,
    117,
    108,
    0,
    1,
    5,
    100,
    105,
    118,
    95,
    115,
    0,
    2,
    5,
    100,
    105,
    118,
    95,
    117,
    0,
    3,
    5,
    114,
    101,
    109,
    95,
    115,
    0,
    4,
    5,
    114,
    101,
    109,
    95,
    117,
    0,
    5,
    8,
    103,
    101,
    116,
    95,
    104,
    105,
    103,
    104,
    0,
    0,
    10,
    191,
    1,
    6,
    4,
    0,
    35,
    0,
    11,
    36,
    1,
    1,
    126,
    32,
    0,
    173,
    32,
    1,
    173,
    66,
    32,
    134,
    132,
    32,
    2,
    173,
    32,
    3,
    173,
    66,
    32,
    134,
    132,
    126,
    34,
    4,
    66,
    32,
    135,
    167,
    36,
    0,
    32,
    4,
    167,
    11,
    36,
    1,
    1,
    126,
    32,
    0,
    173,
    32,
    1,
    173,
    66,
    32,
    134,
    132,
    32,
    2,
    173,
    32,
    3,
    173,
    66,
    32,
    134,
    132,
    127,
    34,
    4,
    66,
    32,
    135,
    167,
    36,
    0,
    32,
    4,
    167,
    11,
    36,
    1,
    1,
    126,
    32,
    0,
    173,
    32,
    1,
    173,
    66,
    32,
    134,
    132,
    32,
    2,
    173,
    32,
    3,
    173,
    66,
    32,
    134,
    132,
    128,
    34,
    4,
    66,
    32,
    135,
    167,
    36,
    0,
    32,
    4,
    167,
    11,
    36,
    1,
    1,
    126,
    32,
    0,
    173,
    32,
    1,
    173,
    66,
    32,
    134,
    132,
    32,
    2,
    173,
    32,
    3,
    173,
    66,
    32,
    134,
    132,
    129,
    34,
    4,
    66,
    32,
    135,
    167,
    36,
    0,
    32,
    4,
    167,
    11,
    36,
    1,
    1,
    126,
    32,
    0,
    173,
    32,
    1,
    173,
    66,
    32,
    134,
    132,
    32,
    2,
    173,
    32,
    3,
    173,
    66,
    32,
    134,
    132,
    130,
    34,
    4,
    66,
    32,
    135,
    167,
    36,
    0,
    32,
    4,
    167,
    11
  ])), {}).exports;
} catch (e) {
}
function Long(low, high, unsigned) {
  this.low = low | 0;
  this.high = high | 0;
  this.unsigned = !!unsigned;
}
Long.prototype.__isLong__;
Object.defineProperty(Long.prototype, "__isLong__", { value: true });
function isLong(obj) {
  return (obj && obj["__isLong__"]) === true;
}
Long.isLong = isLong;
var INT_CACHE = {};
var UINT_CACHE = {};
function fromInt(value, unsigned) {
  var obj, cachedObj, cache2;
  if (unsigned) {
    value >>>= 0;
    if (cache2 = 0 <= value && value < 256) {
      cachedObj = UINT_CACHE[value];
      if (cachedObj)
        return cachedObj;
    }
    obj = fromBits(value, (value | 0) < 0 ? -1 : 0, true);
    if (cache2)
      UINT_CACHE[value] = obj;
    return obj;
  } else {
    value |= 0;
    if (cache2 = -128 <= value && value < 128) {
      cachedObj = INT_CACHE[value];
      if (cachedObj)
        return cachedObj;
    }
    obj = fromBits(value, value < 0 ? -1 : 0, false);
    if (cache2)
      INT_CACHE[value] = obj;
    return obj;
  }
}
Long.fromInt = fromInt;
function fromNumber(value, unsigned) {
  if (isNaN(value))
    return unsigned ? UZERO : ZERO;
  if (unsigned) {
    if (value < 0)
      return UZERO;
    if (value >= TWO_PWR_64_DBL)
      return MAX_UNSIGNED_VALUE;
  } else {
    if (value <= -TWO_PWR_63_DBL)
      return MIN_VALUE;
    if (value + 1 >= TWO_PWR_63_DBL)
      return MAX_VALUE;
  }
  if (value < 0)
    return fromNumber(-value, unsigned).neg();
  return fromBits(value % TWO_PWR_32_DBL | 0, value / TWO_PWR_32_DBL | 0, unsigned);
}
Long.fromNumber = fromNumber;
function fromBits(lowBits, highBits, unsigned) {
  return new Long(lowBits, highBits, unsigned);
}
Long.fromBits = fromBits;
var pow_dbl = Math.pow;
function fromString(str, unsigned, radix) {
  if (str.length === 0)
    throw Error("empty string");
  if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
    return ZERO;
  if (typeof unsigned === "number") {
    radix = unsigned, unsigned = false;
  } else {
    unsigned = !!unsigned;
  }
  radix = radix || 10;
  if (radix < 2 || 36 < radix)
    throw RangeError("radix");
  var p;
  if ((p = str.indexOf("-")) > 0)
    throw Error("interior hyphen");
  else if (p === 0) {
    return fromString(str.substring(1), unsigned, radix).neg();
  }
  var radixToPower = fromNumber(pow_dbl(radix, 8));
  var result = ZERO;
  for (var i = 0; i < str.length; i += 8) {
    var size = Math.min(8, str.length - i), value = parseInt(str.substring(i, i + size), radix);
    if (size < 8) {
      var power = fromNumber(pow_dbl(radix, size));
      result = result.mul(power).add(fromNumber(value));
    } else {
      result = result.mul(radixToPower);
      result = result.add(fromNumber(value));
    }
  }
  result.unsigned = unsigned;
  return result;
}
Long.fromString = fromString;
function fromValue(val, unsigned) {
  if (typeof val === "number")
    return fromNumber(val, unsigned);
  if (typeof val === "string")
    return fromString(val, unsigned);
  return fromBits(val.low, val.high, typeof unsigned === "boolean" ? unsigned : val.unsigned);
}
Long.fromValue = fromValue;
var TWO_PWR_16_DBL = 1 << 16;
var TWO_PWR_24_DBL = 1 << 24;
var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);
var ZERO = fromInt(0);
Long.ZERO = ZERO;
var UZERO = fromInt(0, true);
Long.UZERO = UZERO;
var ONE = fromInt(1);
Long.ONE = ONE;
var UONE = fromInt(1, true);
Long.UONE = UONE;
var NEG_ONE = fromInt(-1);
Long.NEG_ONE = NEG_ONE;
var MAX_VALUE = fromBits(4294967295 | 0, 2147483647 | 0, false);
Long.MAX_VALUE = MAX_VALUE;
var MAX_UNSIGNED_VALUE = fromBits(4294967295 | 0, 4294967295 | 0, true);
Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;
var MIN_VALUE = fromBits(0, 2147483648 | 0, false);
Long.MIN_VALUE = MIN_VALUE;
var LongPrototype = Long.prototype;
LongPrototype.toInt = function toInt() {
  return this.unsigned ? this.low >>> 0 : this.low;
};
LongPrototype.toNumber = function toNumber() {
  if (this.unsigned)
    return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
  return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
};
LongPrototype.toString = function toString(radix) {
  radix = radix || 10;
  if (radix < 2 || 36 < radix)
    throw RangeError("radix");
  if (this.isZero())
    return "0";
  if (this.isNegative()) {
    if (this.eq(MIN_VALUE)) {
      var radixLong = fromNumber(radix), div2 = this.div(radixLong), rem1 = div2.mul(radixLong).sub(this);
      return div2.toString(radix) + rem1.toInt().toString(radix);
    } else
      return "-" + this.neg().toString(radix);
  }
  var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned), rem = this;
  var result = "";
  while (true) {
    var remDiv = rem.div(radixToPower), intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0, digits = intval.toString(radix);
    rem = remDiv;
    if (rem.isZero())
      return digits + result;
    else {
      while (digits.length < 6)
        digits = "0" + digits;
      result = "" + digits + result;
    }
  }
};
LongPrototype.getHighBits = function getHighBits() {
  return this.high;
};
LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
  return this.high >>> 0;
};
LongPrototype.getLowBits = function getLowBits() {
  return this.low;
};
LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
  return this.low >>> 0;
};
LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
  if (this.isNegative())
    return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
  var val = this.high != 0 ? this.high : this.low;
  for (var bit = 31; bit > 0; bit--)
    if ((val & 1 << bit) != 0)
      break;
  return this.high != 0 ? bit + 33 : bit + 1;
};
LongPrototype.isZero = function isZero() {
  return this.high === 0 && this.low === 0;
};
LongPrototype.eqz = LongPrototype.isZero;
LongPrototype.isNegative = function isNegative() {
  return !this.unsigned && this.high < 0;
};
LongPrototype.isPositive = function isPositive() {
  return this.unsigned || this.high >= 0;
};
LongPrototype.isOdd = function isOdd() {
  return (this.low & 1) === 1;
};
LongPrototype.isEven = function isEven() {
  return (this.low & 1) === 0;
};
LongPrototype.equals = function equals(other) {
  if (!isLong(other))
    other = fromValue(other);
  if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1)
    return false;
  return this.high === other.high && this.low === other.low;
};
LongPrototype.eq = LongPrototype.equals;
LongPrototype.notEquals = function notEquals(other) {
  return !this.eq(other);
};
LongPrototype.neq = LongPrototype.notEquals;
LongPrototype.ne = LongPrototype.notEquals;
LongPrototype.lessThan = function lessThan(other) {
  return this.comp(other) < 0;
};
LongPrototype.lt = LongPrototype.lessThan;
LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
  return this.comp(other) <= 0;
};
LongPrototype.lte = LongPrototype.lessThanOrEqual;
LongPrototype.le = LongPrototype.lessThanOrEqual;
LongPrototype.greaterThan = function greaterThan(other) {
  return this.comp(other) > 0;
};
LongPrototype.gt = LongPrototype.greaterThan;
LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
  return this.comp(other) >= 0;
};
LongPrototype.gte = LongPrototype.greaterThanOrEqual;
LongPrototype.ge = LongPrototype.greaterThanOrEqual;
LongPrototype.compare = function compare(other) {
  if (!isLong(other))
    other = fromValue(other);
  if (this.eq(other))
    return 0;
  var thisNeg = this.isNegative(), otherNeg = other.isNegative();
  if (thisNeg && !otherNeg)
    return -1;
  if (!thisNeg && otherNeg)
    return 1;
  if (!this.unsigned)
    return this.sub(other).isNegative() ? -1 : 1;
  return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
};
LongPrototype.comp = LongPrototype.compare;
LongPrototype.negate = function negate() {
  if (!this.unsigned && this.eq(MIN_VALUE))
    return MIN_VALUE;
  return this.not().add(ONE);
};
LongPrototype.neg = LongPrototype.negate;
LongPrototype.add = function add2(addend) {
  if (!isLong(addend))
    addend = fromValue(addend);
  var a48 = this.high >>> 16;
  var a32 = this.high & 65535;
  var a16 = this.low >>> 16;
  var a00 = this.low & 65535;
  var b48 = addend.high >>> 16;
  var b32 = addend.high & 65535;
  var b16 = addend.low >>> 16;
  var b00 = addend.low & 65535;
  var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
  c00 += a00 + b00;
  c16 += c00 >>> 16;
  c00 &= 65535;
  c16 += a16 + b16;
  c32 += c16 >>> 16;
  c16 &= 65535;
  c32 += a32 + b32;
  c48 += c32 >>> 16;
  c32 &= 65535;
  c48 += a48 + b48;
  c48 &= 65535;
  return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
};
LongPrototype.subtract = function subtract(subtrahend) {
  if (!isLong(subtrahend))
    subtrahend = fromValue(subtrahend);
  return this.add(subtrahend.neg());
};
LongPrototype.sub = LongPrototype.subtract;
LongPrototype.multiply = function multiply(multiplier) {
  if (this.isZero())
    return ZERO;
  if (!isLong(multiplier))
    multiplier = fromValue(multiplier);
  if (wasm$1) {
    var low = wasm$1.mul(this.low, this.high, multiplier.low, multiplier.high);
    return fromBits(low, wasm$1.get_high(), this.unsigned);
  }
  if (multiplier.isZero())
    return ZERO;
  if (this.eq(MIN_VALUE))
    return multiplier.isOdd() ? MIN_VALUE : ZERO;
  if (multiplier.eq(MIN_VALUE))
    return this.isOdd() ? MIN_VALUE : ZERO;
  if (this.isNegative()) {
    if (multiplier.isNegative())
      return this.neg().mul(multiplier.neg());
    else
      return this.neg().mul(multiplier).neg();
  } else if (multiplier.isNegative())
    return this.mul(multiplier.neg()).neg();
  if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24))
    return fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);
  var a48 = this.high >>> 16;
  var a32 = this.high & 65535;
  var a16 = this.low >>> 16;
  var a00 = this.low & 65535;
  var b48 = multiplier.high >>> 16;
  var b32 = multiplier.high & 65535;
  var b16 = multiplier.low >>> 16;
  var b00 = multiplier.low & 65535;
  var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
  c00 += a00 * b00;
  c16 += c00 >>> 16;
  c00 &= 65535;
  c16 += a16 * b00;
  c32 += c16 >>> 16;
  c16 &= 65535;
  c16 += a00 * b16;
  c32 += c16 >>> 16;
  c16 &= 65535;
  c32 += a32 * b00;
  c48 += c32 >>> 16;
  c32 &= 65535;
  c32 += a16 * b16;
  c48 += c32 >>> 16;
  c32 &= 65535;
  c32 += a00 * b32;
  c48 += c32 >>> 16;
  c32 &= 65535;
  c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
  c48 &= 65535;
  return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
};
LongPrototype.mul = LongPrototype.multiply;
LongPrototype.divide = function divide(divisor) {
  if (!isLong(divisor))
    divisor = fromValue(divisor);
  if (divisor.isZero())
    throw Error("division by zero");
  if (wasm$1) {
    if (!this.unsigned && this.high === -2147483648 && divisor.low === -1 && divisor.high === -1) {
      return this;
    }
    var low = (this.unsigned ? wasm$1.div_u : wasm$1.div_s)(this.low, this.high, divisor.low, divisor.high);
    return fromBits(low, wasm$1.get_high(), this.unsigned);
  }
  if (this.isZero())
    return this.unsigned ? UZERO : ZERO;
  var approx, rem, res;
  if (!this.unsigned) {
    if (this.eq(MIN_VALUE)) {
      if (divisor.eq(ONE) || divisor.eq(NEG_ONE))
        return MIN_VALUE;
      else if (divisor.eq(MIN_VALUE))
        return ONE;
      else {
        var halfThis = this.shr(1);
        approx = halfThis.div(divisor).shl(1);
        if (approx.eq(ZERO)) {
          return divisor.isNegative() ? ONE : NEG_ONE;
        } else {
          rem = this.sub(divisor.mul(approx));
          res = approx.add(rem.div(divisor));
          return res;
        }
      }
    } else if (divisor.eq(MIN_VALUE))
      return this.unsigned ? UZERO : ZERO;
    if (this.isNegative()) {
      if (divisor.isNegative())
        return this.neg().div(divisor.neg());
      return this.neg().div(divisor).neg();
    } else if (divisor.isNegative())
      return this.div(divisor.neg()).neg();
    res = ZERO;
  } else {
    if (!divisor.unsigned)
      divisor = divisor.toUnsigned();
    if (divisor.gt(this))
      return UZERO;
    if (divisor.gt(this.shru(1)))
      return UONE;
    res = UZERO;
  }
  rem = this;
  while (rem.gte(divisor)) {
    approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));
    var log2 = Math.ceil(Math.log(approx) / Math.LN2), delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48), approxRes = fromNumber(approx), approxRem = approxRes.mul(divisor);
    while (approxRem.isNegative() || approxRem.gt(rem)) {
      approx -= delta;
      approxRes = fromNumber(approx, this.unsigned);
      approxRem = approxRes.mul(divisor);
    }
    if (approxRes.isZero())
      approxRes = ONE;
    res = res.add(approxRes);
    rem = rem.sub(approxRem);
  }
  return res;
};
LongPrototype.div = LongPrototype.divide;
LongPrototype.modulo = function modulo(divisor) {
  if (!isLong(divisor))
    divisor = fromValue(divisor);
  if (wasm$1) {
    var low = (this.unsigned ? wasm$1.rem_u : wasm$1.rem_s)(this.low, this.high, divisor.low, divisor.high);
    return fromBits(low, wasm$1.get_high(), this.unsigned);
  }
  return this.sub(this.div(divisor).mul(divisor));
};
LongPrototype.mod = LongPrototype.modulo;
LongPrototype.rem = LongPrototype.modulo;
LongPrototype.not = function not() {
  return fromBits(~this.low, ~this.high, this.unsigned);
};
LongPrototype.and = function and2(other) {
  if (!isLong(other))
    other = fromValue(other);
  return fromBits(this.low & other.low, this.high & other.high, this.unsigned);
};
LongPrototype.or = function or2(other) {
  if (!isLong(other))
    other = fromValue(other);
  return fromBits(this.low | other.low, this.high | other.high, this.unsigned);
};
LongPrototype.xor = function xor2(other) {
  if (!isLong(other))
    other = fromValue(other);
  return fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
};
LongPrototype.shiftLeft = function shiftLeft(numBits) {
  if (isLong(numBits))
    numBits = numBits.toInt();
  if ((numBits &= 63) === 0)
    return this;
  else if (numBits < 32)
    return fromBits(this.low << numBits, this.high << numBits | this.low >>> 32 - numBits, this.unsigned);
  else
    return fromBits(0, this.low << numBits - 32, this.unsigned);
};
LongPrototype.shl = LongPrototype.shiftLeft;
LongPrototype.shiftRight = function shiftRight(numBits) {
  if (isLong(numBits))
    numBits = numBits.toInt();
  if ((numBits &= 63) === 0)
    return this;
  else if (numBits < 32)
    return fromBits(this.low >>> numBits | this.high << 32 - numBits, this.high >> numBits, this.unsigned);
  else
    return fromBits(this.high >> numBits - 32, this.high >= 0 ? 0 : -1, this.unsigned);
};
LongPrototype.shr = LongPrototype.shiftRight;
LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
  if (isLong(numBits))
    numBits = numBits.toInt();
  numBits &= 63;
  if (numBits === 0)
    return this;
  else {
    var high = this.high;
    if (numBits < 32) {
      var low = this.low;
      return fromBits(low >>> numBits | high << 32 - numBits, high >>> numBits, this.unsigned);
    } else if (numBits === 32)
      return fromBits(high, 0, this.unsigned);
    else
      return fromBits(high >>> numBits - 32, 0, this.unsigned);
  }
};
LongPrototype.shru = LongPrototype.shiftRightUnsigned;
LongPrototype.shr_u = LongPrototype.shiftRightUnsigned;
LongPrototype.toSigned = function toSigned() {
  if (!this.unsigned)
    return this;
  return fromBits(this.low, this.high, false);
};
LongPrototype.toUnsigned = function toUnsigned() {
  if (this.unsigned)
    return this;
  return fromBits(this.low, this.high, true);
};
LongPrototype.toBytes = function toBytes(le) {
  return le ? this.toBytesLE() : this.toBytesBE();
};
LongPrototype.toBytesLE = function toBytesLE() {
  var hi = this.high, lo = this.low;
  return [
    lo & 255,
    lo >>> 8 & 255,
    lo >>> 16 & 255,
    lo >>> 24,
    hi & 255,
    hi >>> 8 & 255,
    hi >>> 16 & 255,
    hi >>> 24
  ];
};
LongPrototype.toBytesBE = function toBytesBE() {
  var hi = this.high, lo = this.low;
  return [
    hi >>> 24,
    hi >>> 16 & 255,
    hi >>> 8 & 255,
    hi & 255,
    lo >>> 24,
    lo >>> 16 & 255,
    lo >>> 8 & 255,
    lo & 255
  ];
};
Long.fromBytes = function fromBytes(bytes, unsigned, le) {
  return le ? Long.fromBytesLE(bytes, unsigned) : Long.fromBytesBE(bytes, unsigned);
};
Long.fromBytesLE = function fromBytesLE(bytes, unsigned) {
  return new Long(bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24, bytes[4] | bytes[5] << 8 | bytes[6] << 16 | bytes[7] << 24, unsigned);
};
Long.fromBytesBE = function fromBytesBE(bytes, unsigned) {
  return new Long(bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7], bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3], unsigned);
};
var indexMinimal = {};
var minimal$1 = {};
var aspromise = asPromise;
function asPromise(fn, ctx) {
  var params = new Array(arguments.length - 1), offset = 0, index = 2, pending = true;
  while (index < arguments.length)
    params[offset++] = arguments[index++];
  return new Promise(function executor(resolve, reject) {
    params[offset] = function callback(err2) {
      if (pending) {
        pending = false;
        if (err2)
          reject(err2);
        else {
          var params2 = new Array(arguments.length - 1), offset2 = 0;
          while (offset2 < params2.length)
            params2[offset2++] = arguments[offset2];
          resolve.apply(null, params2);
        }
      }
    };
    try {
      fn.apply(ctx || null, params);
    } catch (err2) {
      if (pending) {
        pending = false;
        reject(err2);
      }
    }
  });
}
var base64$1 = {};
(function(exports) {
  var base642 = exports;
  base642.length = function length2(string) {
    var p = string.length;
    if (!p)
      return 0;
    var n = 0;
    while (--p % 4 > 1 && string.charAt(p) === "=")
      ++n;
    return Math.ceil(string.length * 3) / 4 - n;
  };
  var b64 = new Array(64);
  var s64 = new Array(123);
  for (var i = 0; i < 64; )
    s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;
  base642.encode = function encode(buffer, start, end2) {
    var parts = null, chunk = [];
    var i2 = 0, j = 0, t;
    while (start < end2) {
      var b = buffer[start++];
      switch (j) {
        case 0:
          chunk[i2++] = b64[b >> 2];
          t = (b & 3) << 4;
          j = 1;
          break;
        case 1:
          chunk[i2++] = b64[t | b >> 4];
          t = (b & 15) << 2;
          j = 2;
          break;
        case 2:
          chunk[i2++] = b64[t | b >> 6];
          chunk[i2++] = b64[b & 63];
          j = 0;
          break;
      }
      if (i2 > 8191) {
        (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
        i2 = 0;
      }
    }
    if (j) {
      chunk[i2++] = b64[t];
      chunk[i2++] = 61;
      if (j === 1)
        chunk[i2++] = 61;
    }
    if (parts) {
      if (i2)
        parts.push(String.fromCharCode.apply(String, chunk.slice(0, i2)));
      return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i2));
  };
  var invalidEncoding = "invalid encoding";
  base642.decode = function decode(string, buffer, offset) {
    var start = offset;
    var j = 0, t;
    for (var i2 = 0; i2 < string.length; ) {
      var c = string.charCodeAt(i2++);
      if (c === 61 && j > 1)
        break;
      if ((c = s64[c]) === void 0)
        throw Error(invalidEncoding);
      switch (j) {
        case 0:
          t = c;
          j = 1;
          break;
        case 1:
          buffer[offset++] = t << 2 | (c & 48) >> 4;
          t = c;
          j = 2;
          break;
        case 2:
          buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
          t = c;
          j = 3;
          break;
        case 3:
          buffer[offset++] = (t & 3) << 6 | c;
          j = 0;
          break;
      }
    }
    if (j === 1)
      throw Error(invalidEncoding);
    return offset - start;
  };
  base642.test = function test(string) {
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string);
  };
})(base64$1);
var eventemitter = EventEmitter;
function EventEmitter() {
  this._listeners = {};
}
EventEmitter.prototype.on = function on(evt, fn, ctx) {
  (this._listeners[evt] || (this._listeners[evt] = [])).push({
    fn,
    ctx: ctx || this
  });
  return this;
};
EventEmitter.prototype.off = function off(evt, fn) {
  if (evt === void 0)
    this._listeners = {};
  else {
    if (fn === void 0)
      this._listeners[evt] = [];
    else {
      var listeners = this._listeners[evt];
      for (var i = 0; i < listeners.length; )
        if (listeners[i].fn === fn)
          listeners.splice(i, 1);
        else
          ++i;
    }
  }
  return this;
};
EventEmitter.prototype.emit = function emit(evt) {
  var listeners = this._listeners[evt];
  if (listeners) {
    var args = [], i = 1;
    for (; i < arguments.length; )
      args.push(arguments[i++]);
    for (i = 0; i < listeners.length; )
      listeners[i].fn.apply(listeners[i++].ctx, args);
  }
  return this;
};
var float = factory(factory);
function factory(exports) {
  if (typeof Float32Array !== "undefined")
    (function() {
      var f32 = new Float32Array([-0]), f8b = new Uint8Array(f32.buffer), le = f8b[3] === 128;
      function writeFloat_f32_cpy(val, buf, pos) {
        f32[0] = val;
        buf[pos] = f8b[0];
        buf[pos + 1] = f8b[1];
        buf[pos + 2] = f8b[2];
        buf[pos + 3] = f8b[3];
      }
      function writeFloat_f32_rev(val, buf, pos) {
        f32[0] = val;
        buf[pos] = f8b[3];
        buf[pos + 1] = f8b[2];
        buf[pos + 2] = f8b[1];
        buf[pos + 3] = f8b[0];
      }
      exports.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
      exports.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;
      function readFloat_f32_cpy(buf, pos) {
        f8b[0] = buf[pos];
        f8b[1] = buf[pos + 1];
        f8b[2] = buf[pos + 2];
        f8b[3] = buf[pos + 3];
        return f32[0];
      }
      function readFloat_f32_rev(buf, pos) {
        f8b[3] = buf[pos];
        f8b[2] = buf[pos + 1];
        f8b[1] = buf[pos + 2];
        f8b[0] = buf[pos + 3];
        return f32[0];
      }
      exports.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
      exports.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;
    })();
  else
    (function() {
      function writeFloat_ieee754(writeUint, val, buf, pos) {
        var sign = val < 0 ? 1 : 0;
        if (sign)
          val = -val;
        if (val === 0)
          writeUint(1 / val > 0 ? 0 : 2147483648, buf, pos);
        else if (isNaN(val))
          writeUint(2143289344, buf, pos);
        else if (val > 34028234663852886e22)
          writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);
        else if (val < 11754943508222875e-54)
          writeUint((sign << 31 | Math.round(val / 1401298464324817e-60)) >>> 0, buf, pos);
        else {
          var exponent = Math.floor(Math.log(val) / Math.LN2), mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
          writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
        }
      }
      exports.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
      exports.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);
      function readFloat_ieee754(readUint, buf, pos) {
        var uint = readUint(buf, pos), sign = (uint >> 31) * 2 + 1, exponent = uint >>> 23 & 255, mantissa = uint & 8388607;
        return exponent === 255 ? mantissa ? NaN : sign * Infinity : exponent === 0 ? sign * 1401298464324817e-60 * mantissa : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
      }
      exports.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
      exports.readFloatBE = readFloat_ieee754.bind(null, readUintBE);
    })();
  if (typeof Float64Array !== "undefined")
    (function() {
      var f64 = new Float64Array([-0]), f8b = new Uint8Array(f64.buffer), le = f8b[7] === 128;
      function writeDouble_f64_cpy(val, buf, pos) {
        f64[0] = val;
        buf[pos] = f8b[0];
        buf[pos + 1] = f8b[1];
        buf[pos + 2] = f8b[2];
        buf[pos + 3] = f8b[3];
        buf[pos + 4] = f8b[4];
        buf[pos + 5] = f8b[5];
        buf[pos + 6] = f8b[6];
        buf[pos + 7] = f8b[7];
      }
      function writeDouble_f64_rev(val, buf, pos) {
        f64[0] = val;
        buf[pos] = f8b[7];
        buf[pos + 1] = f8b[6];
        buf[pos + 2] = f8b[5];
        buf[pos + 3] = f8b[4];
        buf[pos + 4] = f8b[3];
        buf[pos + 5] = f8b[2];
        buf[pos + 6] = f8b[1];
        buf[pos + 7] = f8b[0];
      }
      exports.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
      exports.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;
      function readDouble_f64_cpy(buf, pos) {
        f8b[0] = buf[pos];
        f8b[1] = buf[pos + 1];
        f8b[2] = buf[pos + 2];
        f8b[3] = buf[pos + 3];
        f8b[4] = buf[pos + 4];
        f8b[5] = buf[pos + 5];
        f8b[6] = buf[pos + 6];
        f8b[7] = buf[pos + 7];
        return f64[0];
      }
      function readDouble_f64_rev(buf, pos) {
        f8b[7] = buf[pos];
        f8b[6] = buf[pos + 1];
        f8b[5] = buf[pos + 2];
        f8b[4] = buf[pos + 3];
        f8b[3] = buf[pos + 4];
        f8b[2] = buf[pos + 5];
        f8b[1] = buf[pos + 6];
        f8b[0] = buf[pos + 7];
        return f64[0];
      }
      exports.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
      exports.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;
    })();
  else
    (function() {
      function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
        var sign = val < 0 ? 1 : 0;
        if (sign)
          val = -val;
        if (val === 0) {
          writeUint(0, buf, pos + off0);
          writeUint(1 / val > 0 ? 0 : 2147483648, buf, pos + off1);
        } else if (isNaN(val)) {
          writeUint(0, buf, pos + off0);
          writeUint(2146959360, buf, pos + off1);
        } else if (val > 17976931348623157e292) {
          writeUint(0, buf, pos + off0);
          writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
        } else {
          var mantissa;
          if (val < 22250738585072014e-324) {
            mantissa = val / 5e-324;
            writeUint(mantissa >>> 0, buf, pos + off0);
            writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
          } else {
            var exponent = Math.floor(Math.log(val) / Math.LN2);
            if (exponent === 1024)
              exponent = 1023;
            mantissa = val * Math.pow(2, -exponent);
            writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
            writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
          }
        }
      }
      exports.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
      exports.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);
      function readDouble_ieee754(readUint, off0, off1, buf, pos) {
        var lo = readUint(buf, pos + off0), hi = readUint(buf, pos + off1);
        var sign = (hi >> 31) * 2 + 1, exponent = hi >>> 20 & 2047, mantissa = 4294967296 * (hi & 1048575) + lo;
        return exponent === 2047 ? mantissa ? NaN : sign * Infinity : exponent === 0 ? sign * 5e-324 * mantissa : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
      }
      exports.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
      exports.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);
    })();
  return exports;
}
function writeUintLE(val, buf, pos) {
  buf[pos] = val & 255;
  buf[pos + 1] = val >>> 8 & 255;
  buf[pos + 2] = val >>> 16 & 255;
  buf[pos + 3] = val >>> 24;
}
function writeUintBE(val, buf, pos) {
  buf[pos] = val >>> 24;
  buf[pos + 1] = val >>> 16 & 255;
  buf[pos + 2] = val >>> 8 & 255;
  buf[pos + 3] = val & 255;
}
function readUintLE(buf, pos) {
  return (buf[pos] | buf[pos + 1] << 8 | buf[pos + 2] << 16 | buf[pos + 3] << 24) >>> 0;
}
function readUintBE(buf, pos) {
  return (buf[pos] << 24 | buf[pos + 1] << 16 | buf[pos + 2] << 8 | buf[pos + 3]) >>> 0;
}
var inquire_1 = inquire;
function inquire(moduleName) {
  try {
    var mod = eval("quire".replace(/^/, "re"))(moduleName);
    if (mod && (mod.length || Object.keys(mod).length))
      return mod;
  } catch (e) {
  }
  return null;
}
var utf8$2 = {};
(function(exports) {
  var utf82 = exports;
  utf82.length = function utf8_length(string) {
    var len = 0, c = 0;
    for (var i = 0; i < string.length; ++i) {
      c = string.charCodeAt(i);
      if (c < 128)
        len += 1;
      else if (c < 2048)
        len += 2;
      else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
        ++i;
        len += 4;
      } else
        len += 3;
    }
    return len;
  };
  utf82.read = function utf8_read(buffer, start, end2) {
    var len = end2 - start;
    if (len < 1)
      return "";
    var parts = null, chunk = [], i = 0, t;
    while (start < end2) {
      t = buffer[start++];
      if (t < 128)
        chunk[i++] = t;
      else if (t > 191 && t < 224)
        chunk[i++] = (t & 31) << 6 | buffer[start++] & 63;
      else if (t > 239 && t < 365) {
        t = ((t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63) - 65536;
        chunk[i++] = 55296 + (t >> 10);
        chunk[i++] = 56320 + (t & 1023);
      } else
        chunk[i++] = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
      if (i > 8191) {
        (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
        i = 0;
      }
    }
    if (parts) {
      if (i)
        parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
      return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
  };
  utf82.write = function utf8_write(string, buffer, offset) {
    var start = offset, c1, c2;
    for (var i = 0; i < string.length; ++i) {
      c1 = string.charCodeAt(i);
      if (c1 < 128) {
        buffer[offset++] = c1;
      } else if (c1 < 2048) {
        buffer[offset++] = c1 >> 6 | 192;
        buffer[offset++] = c1 & 63 | 128;
      } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
        c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
        ++i;
        buffer[offset++] = c1 >> 18 | 240;
        buffer[offset++] = c1 >> 12 & 63 | 128;
        buffer[offset++] = c1 >> 6 & 63 | 128;
        buffer[offset++] = c1 & 63 | 128;
      } else {
        buffer[offset++] = c1 >> 12 | 224;
        buffer[offset++] = c1 >> 6 & 63 | 128;
        buffer[offset++] = c1 & 63 | 128;
      }
    }
    return offset - start;
  };
})(utf8$2);
var pool_1$1 = pool$1;
function pool$1(alloc2, slice2, size) {
  var SIZE = size || 8192;
  var MAX = SIZE >>> 1;
  var slab = null;
  var offset = SIZE;
  return function pool_alloc(size2) {
    if (size2 < 1 || size2 > MAX)
      return alloc2(size2);
    if (offset + size2 > SIZE) {
      slab = alloc2(SIZE);
      offset = 0;
    }
    var buf = slice2.call(slab, offset, offset += size2);
    if (offset & 7)
      offset = (offset | 7) + 1;
    return buf;
  };
}
var longbits = LongBits$2;
var util$6 = minimal$1;
function LongBits$2(lo, hi) {
  this.lo = lo >>> 0;
  this.hi = hi >>> 0;
}
var zero = LongBits$2.zero = new LongBits$2(0, 0);
zero.toNumber = function() {
  return 0;
};
zero.zzEncode = zero.zzDecode = function() {
  return this;
};
zero.length = function() {
  return 1;
};
var zeroHash = LongBits$2.zeroHash = "\0\0\0\0\0\0\0\0";
LongBits$2.fromNumber = function fromNumber2(value) {
  if (value === 0)
    return zero;
  var sign = value < 0;
  if (sign)
    value = -value;
  var lo = value >>> 0, hi = (value - lo) / 4294967296 >>> 0;
  if (sign) {
    hi = ~hi >>> 0;
    lo = ~lo >>> 0;
    if (++lo > 4294967295) {
      lo = 0;
      if (++hi > 4294967295)
        hi = 0;
    }
  }
  return new LongBits$2(lo, hi);
};
LongBits$2.from = function from(value) {
  if (typeof value === "number")
    return LongBits$2.fromNumber(value);
  if (util$6.isString(value)) {
    if (util$6.Long)
      value = util$6.Long.fromString(value);
    else
      return LongBits$2.fromNumber(parseInt(value, 10));
  }
  return value.low || value.high ? new LongBits$2(value.low >>> 0, value.high >>> 0) : zero;
};
LongBits$2.prototype.toNumber = function toNumber2(unsigned) {
  if (!unsigned && this.hi >>> 31) {
    var lo = ~this.lo + 1 >>> 0, hi = ~this.hi >>> 0;
    if (!lo)
      hi = hi + 1 >>> 0;
    return -(lo + hi * 4294967296);
  }
  return this.lo + this.hi * 4294967296;
};
LongBits$2.prototype.toLong = function toLong(unsigned) {
  return util$6.Long ? new util$6.Long(this.lo | 0, this.hi | 0, Boolean(unsigned)) : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
};
var charCodeAt = String.prototype.charCodeAt;
LongBits$2.fromHash = function fromHash(hash) {
  if (hash === zeroHash)
    return zero;
  return new LongBits$2((charCodeAt.call(hash, 0) | charCodeAt.call(hash, 1) << 8 | charCodeAt.call(hash, 2) << 16 | charCodeAt.call(hash, 3) << 24) >>> 0, (charCodeAt.call(hash, 4) | charCodeAt.call(hash, 5) << 8 | charCodeAt.call(hash, 6) << 16 | charCodeAt.call(hash, 7) << 24) >>> 0);
};
LongBits$2.prototype.toHash = function toHash() {
  return String.fromCharCode(this.lo & 255, this.lo >>> 8 & 255, this.lo >>> 16 & 255, this.lo >>> 24, this.hi & 255, this.hi >>> 8 & 255, this.hi >>> 16 & 255, this.hi >>> 24);
};
LongBits$2.prototype.zzEncode = function zzEncode() {
  var mask = this.hi >> 31;
  this.hi = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
  this.lo = (this.lo << 1 ^ mask) >>> 0;
  return this;
};
LongBits$2.prototype.zzDecode = function zzDecode() {
  var mask = -(this.lo & 1);
  this.lo = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
  this.hi = (this.hi >>> 1 ^ mask) >>> 0;
  return this;
};
LongBits$2.prototype.length = function length() {
  var part0 = this.lo, part1 = (this.lo >>> 28 | this.hi << 4) >>> 0, part2 = this.hi >>> 24;
  return part2 === 0 ? part1 === 0 ? part0 < 16384 ? part0 < 128 ? 1 : 2 : part0 < 2097152 ? 3 : 4 : part1 < 16384 ? part1 < 128 ? 5 : 6 : part1 < 2097152 ? 7 : 8 : part2 < 128 ? 9 : 10;
};
(function(exports) {
  var util2 = exports;
  util2.asPromise = aspromise;
  util2.base64 = base64$1;
  util2.EventEmitter = eventemitter;
  util2.float = float;
  util2.inquire = inquire_1;
  util2.utf8 = utf8$2;
  util2.pool = pool_1$1;
  util2.LongBits = longbits;
  util2.isNode = Boolean(typeof commonjsGlobal !== "undefined" && commonjsGlobal && commonjsGlobal.process && commonjsGlobal.process.versions && commonjsGlobal.process.versions.node);
  util2.global = util2.isNode && commonjsGlobal || typeof window !== "undefined" && window || typeof self !== "undefined" && self || commonjsGlobal;
  util2.emptyArray = Object.freeze ? Object.freeze([]) : [];
  util2.emptyObject = Object.freeze ? Object.freeze({}) : {};
  util2.isInteger = Number.isInteger || function isInteger(value) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
  };
  util2.isString = function isString(value) {
    return typeof value === "string" || value instanceof String;
  };
  util2.isObject = function isObject(value) {
    return value && typeof value === "object";
  };
  util2.isset = util2.isSet = function isSet(obj, prop) {
    var value = obj[prop];
    if (value != null && obj.hasOwnProperty(prop))
      return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
    return false;
  };
  util2.Buffer = function() {
    try {
      var Buffer = util2.inquire("buffer").Buffer;
      return Buffer.prototype.utf8Write ? Buffer : null;
    } catch (e) {
      return null;
    }
  }();
  util2._Buffer_from = null;
  util2._Buffer_allocUnsafe = null;
  util2.newBuffer = function newBuffer(sizeOrArray) {
    return typeof sizeOrArray === "number" ? util2.Buffer ? util2._Buffer_allocUnsafe(sizeOrArray) : new util2.Array(sizeOrArray) : util2.Buffer ? util2._Buffer_from(sizeOrArray) : typeof Uint8Array === "undefined" ? sizeOrArray : new Uint8Array(sizeOrArray);
  };
  util2.Array = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
  util2.Long = util2.global.dcodeIO && util2.global.dcodeIO.Long || util2.global.Long || util2.inquire("long");
  util2.key2Re = /^true|false|0|1$/;
  util2.key32Re = /^-?(?:0|[1-9][0-9]*)$/;
  util2.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/;
  util2.longToHash = function longToHash(value) {
    return value ? util2.LongBits.from(value).toHash() : util2.LongBits.zeroHash;
  };
  util2.longFromHash = function longFromHash(hash, unsigned) {
    var bits = util2.LongBits.fromHash(hash);
    if (util2.Long)
      return util2.Long.fromBits(bits.lo, bits.hi, unsigned);
    return bits.toNumber(Boolean(unsigned));
  };
  function merge(dst, src, ifNotSet) {
    for (var keys = Object.keys(src), i = 0; i < keys.length; ++i)
      if (dst[keys[i]] === void 0 || !ifNotSet)
        dst[keys[i]] = src[keys[i]];
    return dst;
  }
  util2.merge = merge;
  util2.lcFirst = function lcFirst(str) {
    return str.charAt(0).toLowerCase() + str.substring(1);
  };
  function newError(name2) {
    function CustomError(message, properties) {
      if (!(this instanceof CustomError))
        return new CustomError(message, properties);
      Object.defineProperty(this, "message", { get: function() {
        return message;
      } });
      if (Error.captureStackTrace)
        Error.captureStackTrace(this, CustomError);
      else
        Object.defineProperty(this, "stack", { value: new Error().stack || "" });
      if (properties)
        merge(this, properties);
    }
    (CustomError.prototype = Object.create(Error.prototype)).constructor = CustomError;
    Object.defineProperty(CustomError.prototype, "name", { get: function() {
      return name2;
    } });
    CustomError.prototype.toString = function toString2() {
      return this.name + ": " + this.message;
    };
    return CustomError;
  }
  util2.newError = newError;
  util2.ProtocolError = newError("ProtocolError");
  util2.oneOfGetter = function getOneOf(fieldNames) {
    var fieldMap = {};
    for (var i = 0; i < fieldNames.length; ++i)
      fieldMap[fieldNames[i]] = 1;
    return function() {
      for (var keys = Object.keys(this), i2 = keys.length - 1; i2 > -1; --i2)
        if (fieldMap[keys[i2]] === 1 && this[keys[i2]] !== void 0 && this[keys[i2]] !== null)
          return keys[i2];
    };
  };
  util2.oneOfSetter = function setOneOf(fieldNames) {
    return function(name2) {
      for (var i = 0; i < fieldNames.length; ++i)
        if (fieldNames[i] !== name2)
          delete this[fieldNames[i]];
    };
  };
  util2.toJSONOptions = {
    longs: String,
    enums: String,
    bytes: String,
    json: true
  };
  util2._configure = function() {
    var Buffer = util2.Buffer;
    if (!Buffer) {
      util2._Buffer_from = util2._Buffer_allocUnsafe = null;
      return;
    }
    util2._Buffer_from = Buffer.from !== Uint8Array.from && Buffer.from || function Buffer_from(value, encoding) {
      return new Buffer(value, encoding);
    };
    util2._Buffer_allocUnsafe = Buffer.allocUnsafe || function Buffer_allocUnsafe(size) {
      return new Buffer(size);
    };
  };
})(minimal$1);
var writer = Writer$1;
var util$5 = minimal$1;
var BufferWriter$1;
var LongBits$1 = util$5.LongBits, base64 = util$5.base64, utf8$1 = util$5.utf8;
function Op(fn, len, val) {
  this.fn = fn;
  this.len = len;
  this.next = void 0;
  this.val = val;
}
function noop() {
}
function State(writer2) {
  this.head = writer2.head;
  this.tail = writer2.tail;
  this.len = writer2.len;
  this.next = writer2.states;
}
function Writer$1() {
  this.len = 0;
  this.head = new Op(noop, 0, 0);
  this.tail = this.head;
  this.states = null;
}
var create$1 = function create2() {
  return util$5.Buffer ? function create_buffer_setup() {
    return (Writer$1.create = function create_buffer() {
      return new BufferWriter$1();
    })();
  } : function create_array3() {
    return new Writer$1();
  };
};
Writer$1.create = create$1();
Writer$1.alloc = function alloc(size) {
  return new util$5.Array(size);
};
if (util$5.Array !== Array)
  Writer$1.alloc = util$5.pool(Writer$1.alloc, util$5.Array.prototype.subarray);
Writer$1.prototype._push = function push(fn, len, val) {
  this.tail = this.tail.next = new Op(fn, len, val);
  this.len += len;
  return this;
};
function writeByte(val, buf, pos) {
  buf[pos] = val & 255;
}
function writeVarint32(val, buf, pos) {
  while (val > 127) {
    buf[pos++] = val & 127 | 128;
    val >>>= 7;
  }
  buf[pos] = val;
}
function VarintOp(len, val) {
  this.len = len;
  this.next = void 0;
  this.val = val;
}
VarintOp.prototype = Object.create(Op.prototype);
VarintOp.prototype.fn = writeVarint32;
Writer$1.prototype.uint32 = function write_uint32(value) {
  this.len += (this.tail = this.tail.next = new VarintOp((value = value >>> 0) < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : value < 268435456 ? 4 : 5, value)).len;
  return this;
};
Writer$1.prototype.int32 = function write_int32(value) {
  return value < 0 ? this._push(writeVarint64, 10, LongBits$1.fromNumber(value)) : this.uint32(value);
};
Writer$1.prototype.sint32 = function write_sint32(value) {
  return this.uint32((value << 1 ^ value >> 31) >>> 0);
};
function writeVarint64(val, buf, pos) {
  while (val.hi) {
    buf[pos++] = val.lo & 127 | 128;
    val.lo = (val.lo >>> 7 | val.hi << 25) >>> 0;
    val.hi >>>= 7;
  }
  while (val.lo > 127) {
    buf[pos++] = val.lo & 127 | 128;
    val.lo = val.lo >>> 7;
  }
  buf[pos++] = val.lo;
}
Writer$1.prototype.uint64 = function write_uint64(value) {
  var bits = LongBits$1.from(value);
  return this._push(writeVarint64, bits.length(), bits);
};
Writer$1.prototype.int64 = Writer$1.prototype.uint64;
Writer$1.prototype.sint64 = function write_sint64(value) {
  var bits = LongBits$1.from(value).zzEncode();
  return this._push(writeVarint64, bits.length(), bits);
};
Writer$1.prototype.bool = function write_bool(value) {
  return this._push(writeByte, 1, value ? 1 : 0);
};
function writeFixed32(val, buf, pos) {
  buf[pos] = val & 255;
  buf[pos + 1] = val >>> 8 & 255;
  buf[pos + 2] = val >>> 16 & 255;
  buf[pos + 3] = val >>> 24;
}
Writer$1.prototype.fixed32 = function write_fixed32(value) {
  return this._push(writeFixed32, 4, value >>> 0);
};
Writer$1.prototype.sfixed32 = Writer$1.prototype.fixed32;
Writer$1.prototype.fixed64 = function write_fixed64(value) {
  var bits = LongBits$1.from(value);
  return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
};
Writer$1.prototype.sfixed64 = Writer$1.prototype.fixed64;
Writer$1.prototype.float = function write_float(value) {
  return this._push(util$5.float.writeFloatLE, 4, value);
};
Writer$1.prototype.double = function write_double(value) {
  return this._push(util$5.float.writeDoubleLE, 8, value);
};
var writeBytes = util$5.Array.prototype.set ? function writeBytes_set(val, buf, pos) {
  buf.set(val, pos);
} : function writeBytes_for(val, buf, pos) {
  for (var i = 0; i < val.length; ++i)
    buf[pos + i] = val[i];
};
Writer$1.prototype.bytes = function write_bytes(value) {
  var len = value.length >>> 0;
  if (!len)
    return this._push(writeByte, 1, 0);
  if (util$5.isString(value)) {
    var buf = Writer$1.alloc(len = base64.length(value));
    base64.decode(value, buf, 0);
    value = buf;
  }
  return this.uint32(len)._push(writeBytes, len, value);
};
Writer$1.prototype.string = function write_string(value) {
  var len = utf8$1.length(value);
  return len ? this.uint32(len)._push(utf8$1.write, len, value) : this._push(writeByte, 1, 0);
};
Writer$1.prototype.fork = function fork() {
  this.states = new State(this);
  this.head = this.tail = new Op(noop, 0, 0);
  this.len = 0;
  return this;
};
Writer$1.prototype.reset = function reset() {
  if (this.states) {
    this.head = this.states.head;
    this.tail = this.states.tail;
    this.len = this.states.len;
    this.states = this.states.next;
  } else {
    this.head = this.tail = new Op(noop, 0, 0);
    this.len = 0;
  }
  return this;
};
Writer$1.prototype.ldelim = function ldelim() {
  var head = this.head, tail = this.tail, len = this.len;
  this.reset().uint32(len);
  if (len) {
    this.tail.next = head.next;
    this.tail = tail;
    this.len += len;
  }
  return this;
};
Writer$1.prototype.finish = function finish() {
  var head = this.head.next, buf = this.constructor.alloc(this.len), pos = 0;
  while (head) {
    head.fn(head.val, buf, pos);
    pos += head.len;
    head = head.next;
  }
  return buf;
};
Writer$1._configure = function(BufferWriter_) {
  BufferWriter$1 = BufferWriter_;
  Writer$1.create = create$1();
  BufferWriter$1._configure();
};
var writer_buffer = BufferWriter;
var Writer = writer;
(BufferWriter.prototype = Object.create(Writer.prototype)).constructor = BufferWriter;
var util$4 = minimal$1;
function BufferWriter() {
  Writer.call(this);
}
BufferWriter._configure = function() {
  BufferWriter.alloc = util$4._Buffer_allocUnsafe;
  BufferWriter.writeBytesBuffer = util$4.Buffer && util$4.Buffer.prototype instanceof Uint8Array && util$4.Buffer.prototype.set.name === "set" ? function writeBytesBuffer_set(val, buf, pos) {
    buf.set(val, pos);
  } : function writeBytesBuffer_copy(val, buf, pos) {
    if (val.copy)
      val.copy(buf, pos, 0, val.length);
    else
      for (var i = 0; i < val.length; )
        buf[pos++] = val[i++];
  };
};
BufferWriter.prototype.bytes = function write_bytes_buffer(value) {
  if (util$4.isString(value))
    value = util$4._Buffer_from(value, "base64");
  var len = value.length >>> 0;
  this.uint32(len);
  if (len)
    this._push(BufferWriter.writeBytesBuffer, len, value);
  return this;
};
function writeStringBuffer(val, buf, pos) {
  if (val.length < 40)
    util$4.utf8.write(val, buf, pos);
  else if (buf.utf8Write)
    buf.utf8Write(val, pos);
  else
    buf.write(val, pos);
}
BufferWriter.prototype.string = function write_string_buffer(value) {
  var len = util$4.Buffer.byteLength(value);
  this.uint32(len);
  if (len)
    this._push(writeStringBuffer, len, value);
  return this;
};
BufferWriter._configure();
var reader = Reader$1;
var util$3 = minimal$1;
var BufferReader$1;
var LongBits = util$3.LongBits, utf8 = util$3.utf8;
function indexOutOfRange(reader2, writeLength) {
  return RangeError("index out of range: " + reader2.pos + " + " + (writeLength || 1) + " > " + reader2.len);
}
function Reader$1(buffer) {
  this.buf = buffer;
  this.pos = 0;
  this.len = buffer.length;
}
var create_array = typeof Uint8Array !== "undefined" ? function create_typed_array(buffer) {
  if (buffer instanceof Uint8Array || Array.isArray(buffer))
    return new Reader$1(buffer);
  throw Error("illegal buffer");
} : function create_array2(buffer) {
  if (Array.isArray(buffer))
    return new Reader$1(buffer);
  throw Error("illegal buffer");
};
var create = function create3() {
  return util$3.Buffer ? function create_buffer_setup(buffer) {
    return (Reader$1.create = function create_buffer(buffer2) {
      return util$3.Buffer.isBuffer(buffer2) ? new BufferReader$1(buffer2) : create_array(buffer2);
    })(buffer);
  } : create_array;
};
Reader$1.create = create();
Reader$1.prototype._slice = util$3.Array.prototype.subarray || util$3.Array.prototype.slice;
Reader$1.prototype.uint32 = function read_uint32_setup() {
  var value = 4294967295;
  return function read_uint32() {
    value = (this.buf[this.pos] & 127) >>> 0;
    if (this.buf[this.pos++] < 128)
      return value;
    value = (value | (this.buf[this.pos] & 127) << 7) >>> 0;
    if (this.buf[this.pos++] < 128)
      return value;
    value = (value | (this.buf[this.pos] & 127) << 14) >>> 0;
    if (this.buf[this.pos++] < 128)
      return value;
    value = (value | (this.buf[this.pos] & 127) << 21) >>> 0;
    if (this.buf[this.pos++] < 128)
      return value;
    value = (value | (this.buf[this.pos] & 15) << 28) >>> 0;
    if (this.buf[this.pos++] < 128)
      return value;
    if ((this.pos += 5) > this.len) {
      this.pos = this.len;
      throw indexOutOfRange(this, 10);
    }
    return value;
  };
}();
Reader$1.prototype.int32 = function read_int32() {
  return this.uint32() | 0;
};
Reader$1.prototype.sint32 = function read_sint32() {
  var value = this.uint32();
  return value >>> 1 ^ -(value & 1) | 0;
};
function readLongVarint() {
  var bits = new LongBits(0, 0);
  var i = 0;
  if (this.len - this.pos > 4) {
    for (; i < 4; ++i) {
      bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
      if (this.buf[this.pos++] < 128)
        return bits;
    }
    bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
    bits.hi = (bits.hi | (this.buf[this.pos] & 127) >> 4) >>> 0;
    if (this.buf[this.pos++] < 128)
      return bits;
    i = 0;
  } else {
    for (; i < 3; ++i) {
      if (this.pos >= this.len)
        throw indexOutOfRange(this);
      bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
      if (this.buf[this.pos++] < 128)
        return bits;
    }
    bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
    return bits;
  }
  if (this.len - this.pos > 4) {
    for (; i < 5; ++i) {
      bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
      if (this.buf[this.pos++] < 128)
        return bits;
    }
  } else {
    for (; i < 5; ++i) {
      if (this.pos >= this.len)
        throw indexOutOfRange(this);
      bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
      if (this.buf[this.pos++] < 128)
        return bits;
    }
  }
  throw Error("invalid varint encoding");
}
Reader$1.prototype.bool = function read_bool() {
  return this.uint32() !== 0;
};
function readFixed32_end(buf, end2) {
  return (buf[end2 - 4] | buf[end2 - 3] << 8 | buf[end2 - 2] << 16 | buf[end2 - 1] << 24) >>> 0;
}
Reader$1.prototype.fixed32 = function read_fixed32() {
  if (this.pos + 4 > this.len)
    throw indexOutOfRange(this, 4);
  return readFixed32_end(this.buf, this.pos += 4);
};
Reader$1.prototype.sfixed32 = function read_sfixed32() {
  if (this.pos + 4 > this.len)
    throw indexOutOfRange(this, 4);
  return readFixed32_end(this.buf, this.pos += 4) | 0;
};
function readFixed64() {
  if (this.pos + 8 > this.len)
    throw indexOutOfRange(this, 8);
  return new LongBits(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
}
Reader$1.prototype.float = function read_float() {
  if (this.pos + 4 > this.len)
    throw indexOutOfRange(this, 4);
  var value = util$3.float.readFloatLE(this.buf, this.pos);
  this.pos += 4;
  return value;
};
Reader$1.prototype.double = function read_double() {
  if (this.pos + 8 > this.len)
    throw indexOutOfRange(this, 4);
  var value = util$3.float.readDoubleLE(this.buf, this.pos);
  this.pos += 8;
  return value;
};
Reader$1.prototype.bytes = function read_bytes() {
  var length2 = this.uint32(), start = this.pos, end2 = this.pos + length2;
  if (end2 > this.len)
    throw indexOutOfRange(this, length2);
  this.pos += length2;
  if (Array.isArray(this.buf))
    return this.buf.slice(start, end2);
  return start === end2 ? new this.buf.constructor(0) : this._slice.call(this.buf, start, end2);
};
Reader$1.prototype.string = function read_string() {
  var bytes = this.bytes();
  return utf8.read(bytes, 0, bytes.length);
};
Reader$1.prototype.skip = function skip(length2) {
  if (typeof length2 === "number") {
    if (this.pos + length2 > this.len)
      throw indexOutOfRange(this, length2);
    this.pos += length2;
  } else {
    do {
      if (this.pos >= this.len)
        throw indexOutOfRange(this);
    } while (this.buf[this.pos++] & 128);
  }
  return this;
};
Reader$1.prototype.skipType = function(wireType) {
  switch (wireType) {
    case 0:
      this.skip();
      break;
    case 1:
      this.skip(8);
      break;
    case 2:
      this.skip(this.uint32());
      break;
    case 3:
      while ((wireType = this.uint32() & 7) !== 4) {
        this.skipType(wireType);
      }
      break;
    case 5:
      this.skip(4);
      break;
    default:
      throw Error("invalid wire type " + wireType + " at offset " + this.pos);
  }
  return this;
};
Reader$1._configure = function(BufferReader_) {
  BufferReader$1 = BufferReader_;
  Reader$1.create = create();
  BufferReader$1._configure();
  var fn = util$3.Long ? "toLong" : "toNumber";
  util$3.merge(Reader$1.prototype, {
    int64: function read_int64() {
      return readLongVarint.call(this)[fn](false);
    },
    uint64: function read_uint64() {
      return readLongVarint.call(this)[fn](true);
    },
    sint64: function read_sint64() {
      return readLongVarint.call(this).zzDecode()[fn](false);
    },
    fixed64: function read_fixed64() {
      return readFixed64.call(this)[fn](true);
    },
    sfixed64: function read_sfixed64() {
      return readFixed64.call(this)[fn](false);
    }
  });
};
var reader_buffer = BufferReader;
var Reader = reader;
(BufferReader.prototype = Object.create(Reader.prototype)).constructor = BufferReader;
var util$2 = minimal$1;
function BufferReader(buffer) {
  Reader.call(this, buffer);
}
BufferReader._configure = function() {
  if (util$2.Buffer)
    BufferReader.prototype._slice = util$2.Buffer.prototype.slice;
};
BufferReader.prototype.string = function read_string_buffer() {
  var len = this.uint32();
  return this.buf.utf8Slice ? this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + len, this.len)) : this.buf.toString("utf-8", this.pos, this.pos = Math.min(this.pos + len, this.len));
};
BufferReader._configure();
var rpc = {};
var service = Service;
var util$1 = minimal$1;
(Service.prototype = Object.create(util$1.EventEmitter.prototype)).constructor = Service;
function Service(rpcImpl, requestDelimited, responseDelimited) {
  if (typeof rpcImpl !== "function")
    throw TypeError("rpcImpl must be a function");
  util$1.EventEmitter.call(this);
  this.rpcImpl = rpcImpl;
  this.requestDelimited = Boolean(requestDelimited);
  this.responseDelimited = Boolean(responseDelimited);
}
Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {
  if (!request)
    throw TypeError("request must be specified");
  var self2 = this;
  if (!callback)
    return util$1.asPromise(rpcCall, self2, method, requestCtor, responseCtor, request);
  if (!self2.rpcImpl) {
    setTimeout(function() {
      callback(Error("already ended"));
    }, 0);
    return void 0;
  }
  try {
    return self2.rpcImpl(method, requestCtor[self2.requestDelimited ? "encodeDelimited" : "encode"](request).finish(), function rpcCallback(err2, response) {
      if (err2) {
        self2.emit("error", err2, method);
        return callback(err2);
      }
      if (response === null) {
        self2.end(true);
        return void 0;
      }
      if (!(response instanceof responseCtor)) {
        try {
          response = responseCtor[self2.responseDelimited ? "decodeDelimited" : "decode"](response);
        } catch (err3) {
          self2.emit("error", err3, method);
          return callback(err3);
        }
      }
      self2.emit("data", response, method);
      return callback(null, response);
    });
  } catch (err2) {
    self2.emit("error", err2, method);
    setTimeout(function() {
      callback(err2);
    }, 0);
    return void 0;
  }
};
Service.prototype.end = function end(endedByRPC) {
  if (this.rpcImpl) {
    if (!endedByRPC)
      this.rpcImpl(null, null, null);
    this.rpcImpl = null;
    this.emit("end").off();
  }
  return this;
};
(function(exports) {
  var rpc2 = exports;
  rpc2.Service = service;
})(rpc);
var roots = {};
(function(exports) {
  var protobuf = exports;
  protobuf.build = "minimal";
  protobuf.Writer = writer;
  protobuf.BufferWriter = writer_buffer;
  protobuf.Reader = reader;
  protobuf.BufferReader = reader_buffer;
  protobuf.util = minimal$1;
  protobuf.rpc = rpc;
  protobuf.roots = roots;
  protobuf.configure = configure;
  function configure() {
    protobuf.util._configure();
    protobuf.Writer._configure(protobuf.BufferWriter);
    protobuf.Reader._configure(protobuf.BufferReader);
  }
  configure();
})(indexMinimal);
var minimal = indexMinimal;
var $protobuf = minimal;
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});
$root.onnx = function() {
  var onnx2 = {};
  onnx2.Version = function() {
    var valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "_START_VERSION"] = 0;
    values[valuesById[1] = "IR_VERSION_2017_10_10"] = 1;
    values[valuesById[2] = "IR_VERSION_2017_10_30"] = 2;
    values[valuesById[3] = "IR_VERSION_2017_11_3"] = 3;
    values[valuesById[4] = "IR_VERSION_2019_1_22"] = 4;
    values[valuesById[5] = "IR_VERSION"] = 5;
    return values;
  }();
  onnx2.AttributeProto = function() {
    function AttributeProto(properties) {
      this.floats = [];
      this.ints = [];
      this.strings = [];
      this.tensors = [];
      this.graphs = [];
      if (properties) {
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null)
            this[keys[i]] = properties[keys[i]];
      }
    }
    AttributeProto.prototype.name = "";
    AttributeProto.prototype.refAttrName = "";
    AttributeProto.prototype.docString = "";
    AttributeProto.prototype.type = 0;
    AttributeProto.prototype.f = 0;
    AttributeProto.prototype.i = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
    AttributeProto.prototype.s = $util.newBuffer([]);
    AttributeProto.prototype.t = null;
    AttributeProto.prototype.g = null;
    AttributeProto.prototype.floats = $util.emptyArray;
    AttributeProto.prototype.ints = $util.emptyArray;
    AttributeProto.prototype.strings = $util.emptyArray;
    AttributeProto.prototype.tensors = $util.emptyArray;
    AttributeProto.prototype.graphs = $util.emptyArray;
    AttributeProto.create = function create4(properties) {
      return new AttributeProto(properties);
    };
    AttributeProto.encode = function encode(message, writer2) {
      if (!writer2)
        writer2 = $Writer.create();
      if (message.name != null && message.hasOwnProperty("name"))
        writer2.uint32(10).string(message.name);
      if (message.f != null && message.hasOwnProperty("f"))
        writer2.uint32(21).float(message.f);
      if (message.i != null && message.hasOwnProperty("i"))
        writer2.uint32(24).int64(message.i);
      if (message.s != null && message.hasOwnProperty("s"))
        writer2.uint32(34).bytes(message.s);
      if (message.t != null && message.hasOwnProperty("t"))
        $root.onnx.TensorProto.encode(message.t, writer2.uint32(42).fork()).ldelim();
      if (message.g != null && message.hasOwnProperty("g"))
        $root.onnx.GraphProto.encode(message.g, writer2.uint32(50).fork()).ldelim();
      if (message.floats != null && message.floats.length) {
        writer2.uint32(58).fork();
        for (var i = 0; i < message.floats.length; ++i)
          writer2.float(message.floats[i]);
        writer2.ldelim();
      }
      if (message.ints != null && message.ints.length) {
        writer2.uint32(66).fork();
        for (var i = 0; i < message.ints.length; ++i)
          writer2.int64(message.ints[i]);
        writer2.ldelim();
      }
      if (message.strings != null && message.strings.length)
        for (var i = 0; i < message.strings.length; ++i)
          writer2.uint32(74).bytes(message.strings[i]);
      if (message.tensors != null && message.tensors.length)
        for (var i = 0; i < message.tensors.length; ++i)
          $root.onnx.TensorProto.encode(message.tensors[i], writer2.uint32(82).fork()).ldelim();
      if (message.graphs != null && message.graphs.length)
        for (var i = 0; i < message.graphs.length; ++i)
          $root.onnx.GraphProto.encode(message.graphs[i], writer2.uint32(90).fork()).ldelim();
      if (message.docString != null && message.hasOwnProperty("docString"))
        writer2.uint32(106).string(message.docString);
      if (message.type != null && message.hasOwnProperty("type"))
        writer2.uint32(160).int32(message.type);
      if (message.refAttrName != null && message.hasOwnProperty("refAttrName"))
        writer2.uint32(170).string(message.refAttrName);
      return writer2;
    };
    AttributeProto.encodeDelimited = function encodeDelimited(message, writer2) {
      return this.encode(message, writer2).ldelim();
    };
    AttributeProto.decode = function decode(reader2, length2) {
      if (!(reader2 instanceof $Reader))
        reader2 = $Reader.create(reader2);
      var end2 = length2 === void 0 ? reader2.len : reader2.pos + length2, message = new $root.onnx.AttributeProto();
      while (reader2.pos < end2) {
        var tag = reader2.uint32();
        switch (tag >>> 3) {
          case 1:
            message.name = reader2.string();
            break;
          case 21:
            message.refAttrName = reader2.string();
            break;
          case 13:
            message.docString = reader2.string();
            break;
          case 20:
            message.type = reader2.int32();
            break;
          case 2:
            message.f = reader2.float();
            break;
          case 3:
            message.i = reader2.int64();
            break;
          case 4:
            message.s = reader2.bytes();
            break;
          case 5:
            message.t = $root.onnx.TensorProto.decode(reader2, reader2.uint32());
            break;
          case 6:
            message.g = $root.onnx.GraphProto.decode(reader2, reader2.uint32());
            break;
          case 7:
            if (!(message.floats && message.floats.length))
              message.floats = [];
            if ((tag & 7) === 2) {
              var end22 = reader2.uint32() + reader2.pos;
              while (reader2.pos < end22)
                message.floats.push(reader2.float());
            } else
              message.floats.push(reader2.float());
            break;
          case 8:
            if (!(message.ints && message.ints.length))
              message.ints = [];
            if ((tag & 7) === 2) {
              var end22 = reader2.uint32() + reader2.pos;
              while (reader2.pos < end22)
                message.ints.push(reader2.int64());
            } else
              message.ints.push(reader2.int64());
            break;
          case 9:
            if (!(message.strings && message.strings.length))
              message.strings = [];
            message.strings.push(reader2.bytes());
            break;
          case 10:
            if (!(message.tensors && message.tensors.length))
              message.tensors = [];
            message.tensors.push($root.onnx.TensorProto.decode(reader2, reader2.uint32()));
            break;
          case 11:
            if (!(message.graphs && message.graphs.length))
              message.graphs = [];
            message.graphs.push($root.onnx.GraphProto.decode(reader2, reader2.uint32()));
            break;
          default:
            reader2.skipType(tag & 7);
            break;
        }
      }
      return message;
    };
    AttributeProto.decodeDelimited = function decodeDelimited(reader2) {
      if (!(reader2 instanceof $Reader))
        reader2 = new $Reader(reader2);
      return this.decode(reader2, reader2.uint32());
    };
    AttributeProto.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.name != null && message.hasOwnProperty("name")) {
        if (!$util.isString(message.name))
          return "name: string expected";
      }
      if (message.refAttrName != null && message.hasOwnProperty("refAttrName")) {
        if (!$util.isString(message.refAttrName))
          return "refAttrName: string expected";
      }
      if (message.docString != null && message.hasOwnProperty("docString")) {
        if (!$util.isString(message.docString))
          return "docString: string expected";
      }
      if (message.type != null && message.hasOwnProperty("type"))
        switch (message.type) {
          default:
            return "type: enum value expected";
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
          case 7:
          case 8:
          case 9:
          case 10:
            break;
        }
      if (message.f != null && message.hasOwnProperty("f")) {
        if (typeof message.f !== "number")
          return "f: number expected";
      }
      if (message.i != null && message.hasOwnProperty("i")) {
        if (!$util.isInteger(message.i) && !(message.i && $util.isInteger(message.i.low) && $util.isInteger(message.i.high)))
          return "i: integer|Long expected";
      }
      if (message.s != null && message.hasOwnProperty("s")) {
        if (!(message.s && typeof message.s.length === "number" || $util.isString(message.s)))
          return "s: buffer expected";
      }
      if (message.t != null && message.hasOwnProperty("t")) {
        var error = $root.onnx.TensorProto.verify(message.t);
        if (error)
          return "t." + error;
      }
      if (message.g != null && message.hasOwnProperty("g")) {
        var error = $root.onnx.GraphProto.verify(message.g);
        if (error)
          return "g." + error;
      }
      if (message.floats != null && message.hasOwnProperty("floats")) {
        if (!Array.isArray(message.floats))
          return "floats: array expected";
        for (var i = 0; i < message.floats.length; ++i)
          if (typeof message.floats[i] !== "number")
            return "floats: number[] expected";
      }
      if (message.ints != null && message.hasOwnProperty("ints")) {
        if (!Array.isArray(message.ints))
          return "ints: array expected";
        for (var i = 0; i < message.ints.length; ++i)
          if (!$util.isInteger(message.ints[i]) && !(message.ints[i] && $util.isInteger(message.ints[i].low) && $util.isInteger(message.ints[i].high)))
            return "ints: integer|Long[] expected";
      }
      if (message.strings != null && message.hasOwnProperty("strings")) {
        if (!Array.isArray(message.strings))
          return "strings: array expected";
        for (var i = 0; i < message.strings.length; ++i)
          if (!(message.strings[i] && typeof message.strings[i].length === "number" || $util.isString(message.strings[i])))
            return "strings: buffer[] expected";
      }
      if (message.tensors != null && message.hasOwnProperty("tensors")) {
        if (!Array.isArray(message.tensors))
          return "tensors: array expected";
        for (var i = 0; i < message.tensors.length; ++i) {
          var error = $root.onnx.TensorProto.verify(message.tensors[i]);
          if (error)
            return "tensors." + error;
        }
      }
      if (message.graphs != null && message.hasOwnProperty("graphs")) {
        if (!Array.isArray(message.graphs))
          return "graphs: array expected";
        for (var i = 0; i < message.graphs.length; ++i) {
          var error = $root.onnx.GraphProto.verify(message.graphs[i]);
          if (error)
            return "graphs." + error;
        }
      }
      return null;
    };
    AttributeProto.fromObject = function fromObject(object) {
      if (object instanceof $root.onnx.AttributeProto)
        return object;
      var message = new $root.onnx.AttributeProto();
      if (object.name != null)
        message.name = String(object.name);
      if (object.refAttrName != null)
        message.refAttrName = String(object.refAttrName);
      if (object.docString != null)
        message.docString = String(object.docString);
      switch (object.type) {
        case "UNDEFINED":
        case 0:
          message.type = 0;
          break;
        case "FLOAT":
        case 1:
          message.type = 1;
          break;
        case "INT":
        case 2:
          message.type = 2;
          break;
        case "STRING":
        case 3:
          message.type = 3;
          break;
        case "TENSOR":
        case 4:
          message.type = 4;
          break;
        case "GRAPH":
        case 5:
          message.type = 5;
          break;
        case "FLOATS":
        case 6:
          message.type = 6;
          break;
        case "INTS":
        case 7:
          message.type = 7;
          break;
        case "STRINGS":
        case 8:
          message.type = 8;
          break;
        case "TENSORS":
        case 9:
          message.type = 9;
          break;
        case "GRAPHS":
        case 10:
          message.type = 10;
          break;
      }
      if (object.f != null)
        message.f = Number(object.f);
      if (object.i != null) {
        if ($util.Long)
          (message.i = $util.Long.fromValue(object.i)).unsigned = false;
        else if (typeof object.i === "string")
          message.i = parseInt(object.i, 10);
        else if (typeof object.i === "number")
          message.i = object.i;
        else if (typeof object.i === "object")
          message.i = new $util.LongBits(object.i.low >>> 0, object.i.high >>> 0).toNumber();
      }
      if (object.s != null) {
        if (typeof object.s === "string")
          $util.base64.decode(object.s, message.s = $util.newBuffer($util.base64.length(object.s)), 0);
        else if (object.s.length)
          message.s = object.s;
      }
      if (object.t != null) {
        if (typeof object.t !== "object")
          throw TypeError(".onnx.AttributeProto.t: object expected");
        message.t = $root.onnx.TensorProto.fromObject(object.t);
      }
      if (object.g != null) {
        if (typeof object.g !== "object")
          throw TypeError(".onnx.AttributeProto.g: object expected");
        message.g = $root.onnx.GraphProto.fromObject(object.g);
      }
      if (object.floats) {
        if (!Array.isArray(object.floats))
          throw TypeError(".onnx.AttributeProto.floats: array expected");
        message.floats = [];
        for (var i = 0; i < object.floats.length; ++i)
          message.floats[i] = Number(object.floats[i]);
      }
      if (object.ints) {
        if (!Array.isArray(object.ints))
          throw TypeError(".onnx.AttributeProto.ints: array expected");
        message.ints = [];
        for (var i = 0; i < object.ints.length; ++i)
          if ($util.Long)
            (message.ints[i] = $util.Long.fromValue(object.ints[i])).unsigned = false;
          else if (typeof object.ints[i] === "string")
            message.ints[i] = parseInt(object.ints[i], 10);
          else if (typeof object.ints[i] === "number")
            message.ints[i] = object.ints[i];
          else if (typeof object.ints[i] === "object")
            message.ints[i] = new $util.LongBits(object.ints[i].low >>> 0, object.ints[i].high >>> 0).toNumber();
      }
      if (object.strings) {
        if (!Array.isArray(object.strings))
          throw TypeError(".onnx.AttributeProto.strings: array expected");
        message.strings = [];
        for (var i = 0; i < object.strings.length; ++i)
          if (typeof object.strings[i] === "string")
            $util.base64.decode(object.strings[i], message.strings[i] = $util.newBuffer($util.base64.length(object.strings[i])), 0);
          else if (object.strings[i].length)
            message.strings[i] = object.strings[i];
      }
      if (object.tensors) {
        if (!Array.isArray(object.tensors))
          throw TypeError(".onnx.AttributeProto.tensors: array expected");
        message.tensors = [];
        for (var i = 0; i < object.tensors.length; ++i) {
          if (typeof object.tensors[i] !== "object")
            throw TypeError(".onnx.AttributeProto.tensors: object expected");
          message.tensors[i] = $root.onnx.TensorProto.fromObject(object.tensors[i]);
        }
      }
      if (object.graphs) {
        if (!Array.isArray(object.graphs))
          throw TypeError(".onnx.AttributeProto.graphs: array expected");
        message.graphs = [];
        for (var i = 0; i < object.graphs.length; ++i) {
          if (typeof object.graphs[i] !== "object")
            throw TypeError(".onnx.AttributeProto.graphs: object expected");
          message.graphs[i] = $root.onnx.GraphProto.fromObject(object.graphs[i]);
        }
      }
      return message;
    };
    AttributeProto.toObject = function toObject(message, options) {
      if (!options)
        options = {};
      var object = {};
      if (options.arrays || options.defaults) {
        object.floats = [];
        object.ints = [];
        object.strings = [];
        object.tensors = [];
        object.graphs = [];
      }
      if (options.defaults) {
        object.name = "";
        object.f = 0;
        if ($util.Long) {
          var long2 = new $util.Long(0, 0, false);
          object.i = options.longs === String ? long2.toString() : options.longs === Number ? long2.toNumber() : long2;
        } else
          object.i = options.longs === String ? "0" : 0;
        if (options.bytes === String)
          object.s = "";
        else {
          object.s = [];
          if (options.bytes !== Array)
            object.s = $util.newBuffer(object.s);
        }
        object.t = null;
        object.g = null;
        object.docString = "";
        object.type = options.enums === String ? "UNDEFINED" : 0;
        object.refAttrName = "";
      }
      if (message.name != null && message.hasOwnProperty("name"))
        object.name = message.name;
      if (message.f != null && message.hasOwnProperty("f"))
        object.f = options.json && !isFinite(message.f) ? String(message.f) : message.f;
      if (message.i != null && message.hasOwnProperty("i"))
        if (typeof message.i === "number")
          object.i = options.longs === String ? String(message.i) : message.i;
        else
          object.i = options.longs === String ? $util.Long.prototype.toString.call(message.i) : options.longs === Number ? new $util.LongBits(message.i.low >>> 0, message.i.high >>> 0).toNumber() : message.i;
      if (message.s != null && message.hasOwnProperty("s"))
        object.s = options.bytes === String ? $util.base64.encode(message.s, 0, message.s.length) : options.bytes === Array ? Array.prototype.slice.call(message.s) : message.s;
      if (message.t != null && message.hasOwnProperty("t"))
        object.t = $root.onnx.TensorProto.toObject(message.t, options);
      if (message.g != null && message.hasOwnProperty("g"))
        object.g = $root.onnx.GraphProto.toObject(message.g, options);
      if (message.floats && message.floats.length) {
        object.floats = [];
        for (var j = 0; j < message.floats.length; ++j)
          object.floats[j] = options.json && !isFinite(message.floats[j]) ? String(message.floats[j]) : message.floats[j];
      }
      if (message.ints && message.ints.length) {
        object.ints = [];
        for (var j = 0; j < message.ints.length; ++j)
          if (typeof message.ints[j] === "number")
            object.ints[j] = options.longs === String ? String(message.ints[j]) : message.ints[j];
          else
            object.ints[j] = options.longs === String ? $util.Long.prototype.toString.call(message.ints[j]) : options.longs === Number ? new $util.LongBits(message.ints[j].low >>> 0, message.ints[j].high >>> 0).toNumber() : message.ints[j];
      }
      if (message.strings && message.strings.length) {
        object.strings = [];
        for (var j = 0; j < message.strings.length; ++j)
          object.strings[j] = options.bytes === String ? $util.base64.encode(message.strings[j], 0, message.strings[j].length) : options.bytes === Array ? Array.prototype.slice.call(message.strings[j]) : message.strings[j];
      }
      if (message.tensors && message.tensors.length) {
        object.tensors = [];
        for (var j = 0; j < message.tensors.length; ++j)
          object.tensors[j] = $root.onnx.TensorProto.toObject(message.tensors[j], options);
      }
      if (message.graphs && message.graphs.length) {
        object.graphs = [];
        for (var j = 0; j < message.graphs.length; ++j)
          object.graphs[j] = $root.onnx.GraphProto.toObject(message.graphs[j], options);
      }
      if (message.docString != null && message.hasOwnProperty("docString"))
        object.docString = message.docString;
      if (message.type != null && message.hasOwnProperty("type"))
        object.type = options.enums === String ? $root.onnx.AttributeProto.AttributeType[message.type] : message.type;
      if (message.refAttrName != null && message.hasOwnProperty("refAttrName"))
        object.refAttrName = message.refAttrName;
      return object;
    };
    AttributeProto.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };
    AttributeProto.AttributeType = function() {
      var valuesById = {}, values = Object.create(valuesById);
      values[valuesById[0] = "UNDEFINED"] = 0;
      values[valuesById[1] = "FLOAT"] = 1;
      values[valuesById[2] = "INT"] = 2;
      values[valuesById[3] = "STRING"] = 3;
      values[valuesById[4] = "TENSOR"] = 4;
      values[valuesById[5] = "GRAPH"] = 5;
      values[valuesById[6] = "FLOATS"] = 6;
      values[valuesById[7] = "INTS"] = 7;
      values[valuesById[8] = "STRINGS"] = 8;
      values[valuesById[9] = "TENSORS"] = 9;
      values[valuesById[10] = "GRAPHS"] = 10;
      return values;
    }();
    return AttributeProto;
  }();
  onnx2.ValueInfoProto = function() {
    function ValueInfoProto(properties) {
      if (properties) {
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null)
            this[keys[i]] = properties[keys[i]];
      }
    }
    ValueInfoProto.prototype.name = "";
    ValueInfoProto.prototype.type = null;
    ValueInfoProto.prototype.docString = "";
    ValueInfoProto.create = function create4(properties) {
      return new ValueInfoProto(properties);
    };
    ValueInfoProto.encode = function encode(message, writer2) {
      if (!writer2)
        writer2 = $Writer.create();
      if (message.name != null && message.hasOwnProperty("name"))
        writer2.uint32(10).string(message.name);
      if (message.type != null && message.hasOwnProperty("type"))
        $root.onnx.TypeProto.encode(message.type, writer2.uint32(18).fork()).ldelim();
      if (message.docString != null && message.hasOwnProperty("docString"))
        writer2.uint32(26).string(message.docString);
      return writer2;
    };
    ValueInfoProto.encodeDelimited = function encodeDelimited(message, writer2) {
      return this.encode(message, writer2).ldelim();
    };
    ValueInfoProto.decode = function decode(reader2, length2) {
      if (!(reader2 instanceof $Reader))
        reader2 = $Reader.create(reader2);
      var end2 = length2 === void 0 ? reader2.len : reader2.pos + length2, message = new $root.onnx.ValueInfoProto();
      while (reader2.pos < end2) {
        var tag = reader2.uint32();
        switch (tag >>> 3) {
          case 1:
            message.name = reader2.string();
            break;
          case 2:
            message.type = $root.onnx.TypeProto.decode(reader2, reader2.uint32());
            break;
          case 3:
            message.docString = reader2.string();
            break;
          default:
            reader2.skipType(tag & 7);
            break;
        }
      }
      return message;
    };
    ValueInfoProto.decodeDelimited = function decodeDelimited(reader2) {
      if (!(reader2 instanceof $Reader))
        reader2 = new $Reader(reader2);
      return this.decode(reader2, reader2.uint32());
    };
    ValueInfoProto.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.name != null && message.hasOwnProperty("name")) {
        if (!$util.isString(message.name))
          return "name: string expected";
      }
      if (message.type != null && message.hasOwnProperty("type")) {
        var error = $root.onnx.TypeProto.verify(message.type);
        if (error)
          return "type." + error;
      }
      if (message.docString != null && message.hasOwnProperty("docString")) {
        if (!$util.isString(message.docString))
          return "docString: string expected";
      }
      return null;
    };
    ValueInfoProto.fromObject = function fromObject(object) {
      if (object instanceof $root.onnx.ValueInfoProto)
        return object;
      var message = new $root.onnx.ValueInfoProto();
      if (object.name != null)
        message.name = String(object.name);
      if (object.type != null) {
        if (typeof object.type !== "object")
          throw TypeError(".onnx.ValueInfoProto.type: object expected");
        message.type = $root.onnx.TypeProto.fromObject(object.type);
      }
      if (object.docString != null)
        message.docString = String(object.docString);
      return message;
    };
    ValueInfoProto.toObject = function toObject(message, options) {
      if (!options)
        options = {};
      var object = {};
      if (options.defaults) {
        object.name = "";
        object.type = null;
        object.docString = "";
      }
      if (message.name != null && message.hasOwnProperty("name"))
        object.name = message.name;
      if (message.type != null && message.hasOwnProperty("type"))
        object.type = $root.onnx.TypeProto.toObject(message.type, options);
      if (message.docString != null && message.hasOwnProperty("docString"))
        object.docString = message.docString;
      return object;
    };
    ValueInfoProto.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };
    return ValueInfoProto;
  }();
  onnx2.NodeProto = function() {
    function NodeProto(properties) {
      this.input = [];
      this.output = [];
      this.attribute = [];
      if (properties) {
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null)
            this[keys[i]] = properties[keys[i]];
      }
    }
    NodeProto.prototype.input = $util.emptyArray;
    NodeProto.prototype.output = $util.emptyArray;
    NodeProto.prototype.name = "";
    NodeProto.prototype.opType = "";
    NodeProto.prototype.domain = "";
    NodeProto.prototype.attribute = $util.emptyArray;
    NodeProto.prototype.docString = "";
    NodeProto.create = function create4(properties) {
      return new NodeProto(properties);
    };
    NodeProto.encode = function encode(message, writer2) {
      if (!writer2)
        writer2 = $Writer.create();
      if (message.input != null && message.input.length)
        for (var i = 0; i < message.input.length; ++i)
          writer2.uint32(10).string(message.input[i]);
      if (message.output != null && message.output.length)
        for (var i = 0; i < message.output.length; ++i)
          writer2.uint32(18).string(message.output[i]);
      if (message.name != null && message.hasOwnProperty("name"))
        writer2.uint32(26).string(message.name);
      if (message.opType != null && message.hasOwnProperty("opType"))
        writer2.uint32(34).string(message.opType);
      if (message.attribute != null && message.attribute.length)
        for (var i = 0; i < message.attribute.length; ++i)
          $root.onnx.AttributeProto.encode(message.attribute[i], writer2.uint32(42).fork()).ldelim();
      if (message.docString != null && message.hasOwnProperty("docString"))
        writer2.uint32(50).string(message.docString);
      if (message.domain != null && message.hasOwnProperty("domain"))
        writer2.uint32(58).string(message.domain);
      return writer2;
    };
    NodeProto.encodeDelimited = function encodeDelimited(message, writer2) {
      return this.encode(message, writer2).ldelim();
    };
    NodeProto.decode = function decode(reader2, length2) {
      if (!(reader2 instanceof $Reader))
        reader2 = $Reader.create(reader2);
      var end2 = length2 === void 0 ? reader2.len : reader2.pos + length2, message = new $root.onnx.NodeProto();
      while (reader2.pos < end2) {
        var tag = reader2.uint32();
        switch (tag >>> 3) {
          case 1:
            if (!(message.input && message.input.length))
              message.input = [];
            message.input.push(reader2.string());
            break;
          case 2:
            if (!(message.output && message.output.length))
              message.output = [];
            message.output.push(reader2.string());
            break;
          case 3:
            message.name = reader2.string();
            break;
          case 4:
            message.opType = reader2.string();
            break;
          case 7:
            message.domain = reader2.string();
            break;
          case 5:
            if (!(message.attribute && message.attribute.length))
              message.attribute = [];
            message.attribute.push($root.onnx.AttributeProto.decode(reader2, reader2.uint32()));
            break;
          case 6:
            message.docString = reader2.string();
            break;
          default:
            reader2.skipType(tag & 7);
            break;
        }
      }
      return message;
    };
    NodeProto.decodeDelimited = function decodeDelimited(reader2) {
      if (!(reader2 instanceof $Reader))
        reader2 = new $Reader(reader2);
      return this.decode(reader2, reader2.uint32());
    };
    NodeProto.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.input != null && message.hasOwnProperty("input")) {
        if (!Array.isArray(message.input))
          return "input: array expected";
        for (var i = 0; i < message.input.length; ++i)
          if (!$util.isString(message.input[i]))
            return "input: string[] expected";
      }
      if (message.output != null && message.hasOwnProperty("output")) {
        if (!Array.isArray(message.output))
          return "output: array expected";
        for (var i = 0; i < message.output.length; ++i)
          if (!$util.isString(message.output[i]))
            return "output: string[] expected";
      }
      if (message.name != null && message.hasOwnProperty("name")) {
        if (!$util.isString(message.name))
          return "name: string expected";
      }
      if (message.opType != null && message.hasOwnProperty("opType")) {
        if (!$util.isString(message.opType))
          return "opType: string expected";
      }
      if (message.domain != null && message.hasOwnProperty("domain")) {
        if (!$util.isString(message.domain))
          return "domain: string expected";
      }
      if (message.attribute != null && message.hasOwnProperty("attribute")) {
        if (!Array.isArray(message.attribute))
          return "attribute: array expected";
        for (var i = 0; i < message.attribute.length; ++i) {
          var error = $root.onnx.AttributeProto.verify(message.attribute[i]);
          if (error)
            return "attribute." + error;
        }
      }
      if (message.docString != null && message.hasOwnProperty("docString")) {
        if (!$util.isString(message.docString))
          return "docString: string expected";
      }
      return null;
    };
    NodeProto.fromObject = function fromObject(object) {
      if (object instanceof $root.onnx.NodeProto)
        return object;
      var message = new $root.onnx.NodeProto();
      if (object.input) {
        if (!Array.isArray(object.input))
          throw TypeError(".onnx.NodeProto.input: array expected");
        message.input = [];
        for (var i = 0; i < object.input.length; ++i)
          message.input[i] = String(object.input[i]);
      }
      if (object.output) {
        if (!Array.isArray(object.output))
          throw TypeError(".onnx.NodeProto.output: array expected");
        message.output = [];
        for (var i = 0; i < object.output.length; ++i)
          message.output[i] = String(object.output[i]);
      }
      if (object.name != null)
        message.name = String(object.name);
      if (object.opType != null)
        message.opType = String(object.opType);
      if (object.domain != null)
        message.domain = String(object.domain);
      if (object.attribute) {
        if (!Array.isArray(object.attribute))
          throw TypeError(".onnx.NodeProto.attribute: array expected");
        message.attribute = [];
        for (var i = 0; i < object.attribute.length; ++i) {
          if (typeof object.attribute[i] !== "object")
            throw TypeError(".onnx.NodeProto.attribute: object expected");
          message.attribute[i] = $root.onnx.AttributeProto.fromObject(object.attribute[i]);
        }
      }
      if (object.docString != null)
        message.docString = String(object.docString);
      return message;
    };
    NodeProto.toObject = function toObject(message, options) {
      if (!options)
        options = {};
      var object = {};
      if (options.arrays || options.defaults) {
        object.input = [];
        object.output = [];
        object.attribute = [];
      }
      if (options.defaults) {
        object.name = "";
        object.opType = "";
        object.docString = "";
        object.domain = "";
      }
      if (message.input && message.input.length) {
        object.input = [];
        for (var j = 0; j < message.input.length; ++j)
          object.input[j] = message.input[j];
      }
      if (message.output && message.output.length) {
        object.output = [];
        for (var j = 0; j < message.output.length; ++j)
          object.output[j] = message.output[j];
      }
      if (message.name != null && message.hasOwnProperty("name"))
        object.name = message.name;
      if (message.opType != null && message.hasOwnProperty("opType"))
        object.opType = message.opType;
      if (message.attribute && message.attribute.length) {
        object.attribute = [];
        for (var j = 0; j < message.attribute.length; ++j)
          object.attribute[j] = $root.onnx.AttributeProto.toObject(message.attribute[j], options);
      }
      if (message.docString != null && message.hasOwnProperty("docString"))
        object.docString = message.docString;
      if (message.domain != null && message.hasOwnProperty("domain"))
        object.domain = message.domain;
      return object;
    };
    NodeProto.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };
    return NodeProto;
  }();
  onnx2.ModelProto = function() {
    function ModelProto(properties) {
      this.opsetImport = [];
      this.metadataProps = [];
      if (properties) {
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null)
            this[keys[i]] = properties[keys[i]];
      }
    }
    ModelProto.prototype.irVersion = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
    ModelProto.prototype.opsetImport = $util.emptyArray;
    ModelProto.prototype.producerName = "";
    ModelProto.prototype.producerVersion = "";
    ModelProto.prototype.domain = "";
    ModelProto.prototype.modelVersion = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
    ModelProto.prototype.docString = "";
    ModelProto.prototype.graph = null;
    ModelProto.prototype.metadataProps = $util.emptyArray;
    ModelProto.create = function create4(properties) {
      return new ModelProto(properties);
    };
    ModelProto.encode = function encode(message, writer2) {
      if (!writer2)
        writer2 = $Writer.create();
      if (message.irVersion != null && message.hasOwnProperty("irVersion"))
        writer2.uint32(8).int64(message.irVersion);
      if (message.producerName != null && message.hasOwnProperty("producerName"))
        writer2.uint32(18).string(message.producerName);
      if (message.producerVersion != null && message.hasOwnProperty("producerVersion"))
        writer2.uint32(26).string(message.producerVersion);
      if (message.domain != null && message.hasOwnProperty("domain"))
        writer2.uint32(34).string(message.domain);
      if (message.modelVersion != null && message.hasOwnProperty("modelVersion"))
        writer2.uint32(40).int64(message.modelVersion);
      if (message.docString != null && message.hasOwnProperty("docString"))
        writer2.uint32(50).string(message.docString);
      if (message.graph != null && message.hasOwnProperty("graph"))
        $root.onnx.GraphProto.encode(message.graph, writer2.uint32(58).fork()).ldelim();
      if (message.opsetImport != null && message.opsetImport.length)
        for (var i = 0; i < message.opsetImport.length; ++i)
          $root.onnx.OperatorSetIdProto.encode(message.opsetImport[i], writer2.uint32(66).fork()).ldelim();
      if (message.metadataProps != null && message.metadataProps.length)
        for (var i = 0; i < message.metadataProps.length; ++i)
          $root.onnx.StringStringEntryProto.encode(message.metadataProps[i], writer2.uint32(114).fork()).ldelim();
      return writer2;
    };
    ModelProto.encodeDelimited = function encodeDelimited(message, writer2) {
      return this.encode(message, writer2).ldelim();
    };
    ModelProto.decode = function decode(reader2, length2) {
      if (!(reader2 instanceof $Reader))
        reader2 = $Reader.create(reader2);
      var end2 = length2 === void 0 ? reader2.len : reader2.pos + length2, message = new $root.onnx.ModelProto();
      while (reader2.pos < end2) {
        var tag = reader2.uint32();
        switch (tag >>> 3) {
          case 1:
            message.irVersion = reader2.int64();
            break;
          case 8:
            if (!(message.opsetImport && message.opsetImport.length))
              message.opsetImport = [];
            message.opsetImport.push($root.onnx.OperatorSetIdProto.decode(reader2, reader2.uint32()));
            break;
          case 2:
            message.producerName = reader2.string();
            break;
          case 3:
            message.producerVersion = reader2.string();
            break;
          case 4:
            message.domain = reader2.string();
            break;
          case 5:
            message.modelVersion = reader2.int64();
            break;
          case 6:
            message.docString = reader2.string();
            break;
          case 7:
            message.graph = $root.onnx.GraphProto.decode(reader2, reader2.uint32());
            break;
          case 14:
            if (!(message.metadataProps && message.metadataProps.length))
              message.metadataProps = [];
            message.metadataProps.push($root.onnx.StringStringEntryProto.decode(reader2, reader2.uint32()));
            break;
          default:
            reader2.skipType(tag & 7);
            break;
        }
      }
      return message;
    };
    ModelProto.decodeDelimited = function decodeDelimited(reader2) {
      if (!(reader2 instanceof $Reader))
        reader2 = new $Reader(reader2);
      return this.decode(reader2, reader2.uint32());
    };
    ModelProto.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.irVersion != null && message.hasOwnProperty("irVersion")) {
        if (!$util.isInteger(message.irVersion) && !(message.irVersion && $util.isInteger(message.irVersion.low) && $util.isInteger(message.irVersion.high)))
          return "irVersion: integer|Long expected";
      }
      if (message.opsetImport != null && message.hasOwnProperty("opsetImport")) {
        if (!Array.isArray(message.opsetImport))
          return "opsetImport: array expected";
        for (var i = 0; i < message.opsetImport.length; ++i) {
          var error = $root.onnx.OperatorSetIdProto.verify(message.opsetImport[i]);
          if (error)
            return "opsetImport." + error;
        }
      }
      if (message.producerName != null && message.hasOwnProperty("producerName")) {
        if (!$util.isString(message.producerName))
          return "producerName: string expected";
      }
      if (message.producerVersion != null && message.hasOwnProperty("producerVersion")) {
        if (!$util.isString(message.producerVersion))
          return "producerVersion: string expected";
      }
      if (message.domain != null && message.hasOwnProperty("domain")) {
        if (!$util.isString(message.domain))
          return "domain: string expected";
      }
      if (message.modelVersion != null && message.hasOwnProperty("modelVersion")) {
        if (!$util.isInteger(message.modelVersion) && !(message.modelVersion && $util.isInteger(message.modelVersion.low) && $util.isInteger(message.modelVersion.high)))
          return "modelVersion: integer|Long expected";
      }
      if (message.docString != null && message.hasOwnProperty("docString")) {
        if (!$util.isString(message.docString))
          return "docString: string expected";
      }
      if (message.graph != null && message.hasOwnProperty("graph")) {
        var error = $root.onnx.GraphProto.verify(message.graph);
        if (error)
          return "graph." + error;
      }
      if (message.metadataProps != null && message.hasOwnProperty("metadataProps")) {
        if (!Array.isArray(message.metadataProps))
          return "metadataProps: array expected";
        for (var i = 0; i < message.metadataProps.length; ++i) {
          var error = $root.onnx.StringStringEntryProto.verify(message.metadataProps[i]);
          if (error)
            return "metadataProps." + error;
        }
      }
      return null;
    };
    ModelProto.fromObject = function fromObject(object) {
      if (object instanceof $root.onnx.ModelProto)
        return object;
      var message = new $root.onnx.ModelProto();
      if (object.irVersion != null) {
        if ($util.Long)
          (message.irVersion = $util.Long.fromValue(object.irVersion)).unsigned = false;
        else if (typeof object.irVersion === "string")
          message.irVersion = parseInt(object.irVersion, 10);
        else if (typeof object.irVersion === "number")
          message.irVersion = object.irVersion;
        else if (typeof object.irVersion === "object")
          message.irVersion = new $util.LongBits(object.irVersion.low >>> 0, object.irVersion.high >>> 0).toNumber();
      }
      if (object.opsetImport) {
        if (!Array.isArray(object.opsetImport))
          throw TypeError(".onnx.ModelProto.opsetImport: array expected");
        message.opsetImport = [];
        for (var i = 0; i < object.opsetImport.length; ++i) {
          if (typeof object.opsetImport[i] !== "object")
            throw TypeError(".onnx.ModelProto.opsetImport: object expected");
          message.opsetImport[i] = $root.onnx.OperatorSetIdProto.fromObject(object.opsetImport[i]);
        }
      }
      if (object.producerName != null)
        message.producerName = String(object.producerName);
      if (object.producerVersion != null)
        message.producerVersion = String(object.producerVersion);
      if (object.domain != null)
        message.domain = String(object.domain);
      if (object.modelVersion != null) {
        if ($util.Long)
          (message.modelVersion = $util.Long.fromValue(object.modelVersion)).unsigned = false;
        else if (typeof object.modelVersion === "string")
          message.modelVersion = parseInt(object.modelVersion, 10);
        else if (typeof object.modelVersion === "number")
          message.modelVersion = object.modelVersion;
        else if (typeof object.modelVersion === "object")
          message.modelVersion = new $util.LongBits(object.modelVersion.low >>> 0, object.modelVersion.high >>> 0).toNumber();
      }
      if (object.docString != null)
        message.docString = String(object.docString);
      if (object.graph != null) {
        if (typeof object.graph !== "object")
          throw TypeError(".onnx.ModelProto.graph: object expected");
        message.graph = $root.onnx.GraphProto.fromObject(object.graph);
      }
      if (object.metadataProps) {
        if (!Array.isArray(object.metadataProps))
          throw TypeError(".onnx.ModelProto.metadataProps: array expected");
        message.metadataProps = [];
        for (var i = 0; i < object.metadataProps.length; ++i) {
          if (typeof object.metadataProps[i] !== "object")
            throw TypeError(".onnx.ModelProto.metadataProps: object expected");
          message.metadataProps[i] = $root.onnx.StringStringEntryProto.fromObject(object.metadataProps[i]);
        }
      }
      return message;
    };
    ModelProto.toObject = function toObject(message, options) {
      if (!options)
        options = {};
      var object = {};
      if (options.arrays || options.defaults) {
        object.opsetImport = [];
        object.metadataProps = [];
      }
      if (options.defaults) {
        if ($util.Long) {
          var long2 = new $util.Long(0, 0, false);
          object.irVersion = options.longs === String ? long2.toString() : options.longs === Number ? long2.toNumber() : long2;
        } else
          object.irVersion = options.longs === String ? "0" : 0;
        object.producerName = "";
        object.producerVersion = "";
        object.domain = "";
        if ($util.Long) {
          var long2 = new $util.Long(0, 0, false);
          object.modelVersion = options.longs === String ? long2.toString() : options.longs === Number ? long2.toNumber() : long2;
        } else
          object.modelVersion = options.longs === String ? "0" : 0;
        object.docString = "";
        object.graph = null;
      }
      if (message.irVersion != null && message.hasOwnProperty("irVersion"))
        if (typeof message.irVersion === "number")
          object.irVersion = options.longs === String ? String(message.irVersion) : message.irVersion;
        else
          object.irVersion = options.longs === String ? $util.Long.prototype.toString.call(message.irVersion) : options.longs === Number ? new $util.LongBits(message.irVersion.low >>> 0, message.irVersion.high >>> 0).toNumber() : message.irVersion;
      if (message.producerName != null && message.hasOwnProperty("producerName"))
        object.producerName = message.producerName;
      if (message.producerVersion != null && message.hasOwnProperty("producerVersion"))
        object.producerVersion = message.producerVersion;
      if (message.domain != null && message.hasOwnProperty("domain"))
        object.domain = message.domain;
      if (message.modelVersion != null && message.hasOwnProperty("modelVersion"))
        if (typeof message.modelVersion === "number")
          object.modelVersion = options.longs === String ? String(message.modelVersion) : message.modelVersion;
        else
          object.modelVersion = options.longs === String ? $util.Long.prototype.toString.call(message.modelVersion) : options.longs === Number ? new $util.LongBits(message.modelVersion.low >>> 0, message.modelVersion.high >>> 0).toNumber() : message.modelVersion;
      if (message.docString != null && message.hasOwnProperty("docString"))
        object.docString = message.docString;
      if (message.graph != null && message.hasOwnProperty("graph"))
        object.graph = $root.onnx.GraphProto.toObject(message.graph, options);
      if (message.opsetImport && message.opsetImport.length) {
        object.opsetImport = [];
        for (var j = 0; j < message.opsetImport.length; ++j)
          object.opsetImport[j] = $root.onnx.OperatorSetIdProto.toObject(message.opsetImport[j], options);
      }
      if (message.metadataProps && message.metadataProps.length) {
        object.metadataProps = [];
        for (var j = 0; j < message.metadataProps.length; ++j)
          object.metadataProps[j] = $root.onnx.StringStringEntryProto.toObject(message.metadataProps[j], options);
      }
      return object;
    };
    ModelProto.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };
    return ModelProto;
  }();
  onnx2.StringStringEntryProto = function() {
    function StringStringEntryProto(properties) {
      if (properties) {
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null)
            this[keys[i]] = properties[keys[i]];
      }
    }
    StringStringEntryProto.prototype.key = "";
    StringStringEntryProto.prototype.value = "";
    StringStringEntryProto.create = function create4(properties) {
      return new StringStringEntryProto(properties);
    };
    StringStringEntryProto.encode = function encode(message, writer2) {
      if (!writer2)
        writer2 = $Writer.create();
      if (message.key != null && message.hasOwnProperty("key"))
        writer2.uint32(10).string(message.key);
      if (message.value != null && message.hasOwnProperty("value"))
        writer2.uint32(18).string(message.value);
      return writer2;
    };
    StringStringEntryProto.encodeDelimited = function encodeDelimited(message, writer2) {
      return this.encode(message, writer2).ldelim();
    };
    StringStringEntryProto.decode = function decode(reader2, length2) {
      if (!(reader2 instanceof $Reader))
        reader2 = $Reader.create(reader2);
      var end2 = length2 === void 0 ? reader2.len : reader2.pos + length2, message = new $root.onnx.StringStringEntryProto();
      while (reader2.pos < end2) {
        var tag = reader2.uint32();
        switch (tag >>> 3) {
          case 1:
            message.key = reader2.string();
            break;
          case 2:
            message.value = reader2.string();
            break;
          default:
            reader2.skipType(tag & 7);
            break;
        }
      }
      return message;
    };
    StringStringEntryProto.decodeDelimited = function decodeDelimited(reader2) {
      if (!(reader2 instanceof $Reader))
        reader2 = new $Reader(reader2);
      return this.decode(reader2, reader2.uint32());
    };
    StringStringEntryProto.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.key != null && message.hasOwnProperty("key")) {
        if (!$util.isString(message.key))
          return "key: string expected";
      }
      if (message.value != null && message.hasOwnProperty("value")) {
        if (!$util.isString(message.value))
          return "value: string expected";
      }
      return null;
    };
    StringStringEntryProto.fromObject = function fromObject(object) {
      if (object instanceof $root.onnx.StringStringEntryProto)
        return object;
      var message = new $root.onnx.StringStringEntryProto();
      if (object.key != null)
        message.key = String(object.key);
      if (object.value != null)
        message.value = String(object.value);
      return message;
    };
    StringStringEntryProto.toObject = function toObject(message, options) {
      if (!options)
        options = {};
      var object = {};
      if (options.defaults) {
        object.key = "";
        object.value = "";
      }
      if (message.key != null && message.hasOwnProperty("key"))
        object.key = message.key;
      if (message.value != null && message.hasOwnProperty("value"))
        object.value = message.value;
      return object;
    };
    StringStringEntryProto.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };
    return StringStringEntryProto;
  }();
  onnx2.TensorAnnotation = function() {
    function TensorAnnotation(properties) {
      this.quantParameterTensorNames = [];
      if (properties) {
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null)
            this[keys[i]] = properties[keys[i]];
      }
    }
    TensorAnnotation.prototype.tensorName = "";
    TensorAnnotation.prototype.quantParameterTensorNames = $util.emptyArray;
    TensorAnnotation.create = function create4(properties) {
      return new TensorAnnotation(properties);
    };
    TensorAnnotation.encode = function encode(message, writer2) {
      if (!writer2)
        writer2 = $Writer.create();
      if (message.tensorName != null && message.hasOwnProperty("tensorName"))
        writer2.uint32(10).string(message.tensorName);
      if (message.quantParameterTensorNames != null && message.quantParameterTensorNames.length)
        for (var i = 0; i < message.quantParameterTensorNames.length; ++i)
          $root.onnx.StringStringEntryProto.encode(message.quantParameterTensorNames[i], writer2.uint32(18).fork()).ldelim();
      return writer2;
    };
    TensorAnnotation.encodeDelimited = function encodeDelimited(message, writer2) {
      return this.encode(message, writer2).ldelim();
    };
    TensorAnnotation.decode = function decode(reader2, length2) {
      if (!(reader2 instanceof $Reader))
        reader2 = $Reader.create(reader2);
      var end2 = length2 === void 0 ? reader2.len : reader2.pos + length2, message = new $root.onnx.TensorAnnotation();
      while (reader2.pos < end2) {
        var tag = reader2.uint32();
        switch (tag >>> 3) {
          case 1:
            message.tensorName = reader2.string();
            break;
          case 2:
            if (!(message.quantParameterTensorNames && message.quantParameterTensorNames.length))
              message.quantParameterTensorNames = [];
            message.quantParameterTensorNames.push($root.onnx.StringStringEntryProto.decode(reader2, reader2.uint32()));
            break;
          default:
            reader2.skipType(tag & 7);
            break;
        }
      }
      return message;
    };
    TensorAnnotation.decodeDelimited = function decodeDelimited(reader2) {
      if (!(reader2 instanceof $Reader))
        reader2 = new $Reader(reader2);
      return this.decode(reader2, reader2.uint32());
    };
    TensorAnnotation.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.tensorName != null && message.hasOwnProperty("tensorName")) {
        if (!$util.isString(message.tensorName))
          return "tensorName: string expected";
      }
      if (message.quantParameterTensorNames != null && message.hasOwnProperty("quantParameterTensorNames")) {
        if (!Array.isArray(message.quantParameterTensorNames))
          return "quantParameterTensorNames: array expected";
        for (var i = 0; i < message.quantParameterTensorNames.length; ++i) {
          var error = $root.onnx.StringStringEntryProto.verify(message.quantParameterTensorNames[i]);
          if (error)
            return "quantParameterTensorNames." + error;
        }
      }
      return null;
    };
    TensorAnnotation.fromObject = function fromObject(object) {
      if (object instanceof $root.onnx.TensorAnnotation)
        return object;
      var message = new $root.onnx.TensorAnnotation();
      if (object.tensorName != null)
        message.tensorName = String(object.tensorName);
      if (object.quantParameterTensorNames) {
        if (!Array.isArray(object.quantParameterTensorNames))
          throw TypeError(".onnx.TensorAnnotation.quantParameterTensorNames: array expected");
        message.quantParameterTensorNames = [];
        for (var i = 0; i < object.quantParameterTensorNames.length; ++i) {
          if (typeof object.quantParameterTensorNames[i] !== "object")
            throw TypeError(".onnx.TensorAnnotation.quantParameterTensorNames: object expected");
          message.quantParameterTensorNames[i] = $root.onnx.StringStringEntryProto.fromObject(object.quantParameterTensorNames[i]);
        }
      }
      return message;
    };
    TensorAnnotation.toObject = function toObject(message, options) {
      if (!options)
        options = {};
      var object = {};
      if (options.arrays || options.defaults)
        object.quantParameterTensorNames = [];
      if (options.defaults)
        object.tensorName = "";
      if (message.tensorName != null && message.hasOwnProperty("tensorName"))
        object.tensorName = message.tensorName;
      if (message.quantParameterTensorNames && message.quantParameterTensorNames.length) {
        object.quantParameterTensorNames = [];
        for (var j = 0; j < message.quantParameterTensorNames.length; ++j)
          object.quantParameterTensorNames[j] = $root.onnx.StringStringEntryProto.toObject(message.quantParameterTensorNames[j], options);
      }
      return object;
    };
    TensorAnnotation.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };
    return TensorAnnotation;
  }();
  onnx2.GraphProto = function() {
    function GraphProto(properties) {
      this.node = [];
      this.initializer = [];
      this.input = [];
      this.output = [];
      this.valueInfo = [];
      this.quantizationAnnotation = [];
      if (properties) {
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null)
            this[keys[i]] = properties[keys[i]];
      }
    }
    GraphProto.prototype.node = $util.emptyArray;
    GraphProto.prototype.name = "";
    GraphProto.prototype.initializer = $util.emptyArray;
    GraphProto.prototype.docString = "";
    GraphProto.prototype.input = $util.emptyArray;
    GraphProto.prototype.output = $util.emptyArray;
    GraphProto.prototype.valueInfo = $util.emptyArray;
    GraphProto.prototype.quantizationAnnotation = $util.emptyArray;
    GraphProto.create = function create4(properties) {
      return new GraphProto(properties);
    };
    GraphProto.encode = function encode(message, writer2) {
      if (!writer2)
        writer2 = $Writer.create();
      if (message.node != null && message.node.length)
        for (var i = 0; i < message.node.length; ++i)
          $root.onnx.NodeProto.encode(message.node[i], writer2.uint32(10).fork()).ldelim();
      if (message.name != null && message.hasOwnProperty("name"))
        writer2.uint32(18).string(message.name);
      if (message.initializer != null && message.initializer.length)
        for (var i = 0; i < message.initializer.length; ++i)
          $root.onnx.TensorProto.encode(message.initializer[i], writer2.uint32(42).fork()).ldelim();
      if (message.docString != null && message.hasOwnProperty("docString"))
        writer2.uint32(82).string(message.docString);
      if (message.input != null && message.input.length)
        for (var i = 0; i < message.input.length; ++i)
          $root.onnx.ValueInfoProto.encode(message.input[i], writer2.uint32(90).fork()).ldelim();
      if (message.output != null && message.output.length)
        for (var i = 0; i < message.output.length; ++i)
          $root.onnx.ValueInfoProto.encode(message.output[i], writer2.uint32(98).fork()).ldelim();
      if (message.valueInfo != null && message.valueInfo.length)
        for (var i = 0; i < message.valueInfo.length; ++i)
          $root.onnx.ValueInfoProto.encode(message.valueInfo[i], writer2.uint32(106).fork()).ldelim();
      if (message.quantizationAnnotation != null && message.quantizationAnnotation.length)
        for (var i = 0; i < message.quantizationAnnotation.length; ++i)
          $root.onnx.TensorAnnotation.encode(message.quantizationAnnotation[i], writer2.uint32(114).fork()).ldelim();
      return writer2;
    };
    GraphProto.encodeDelimited = function encodeDelimited(message, writer2) {
      return this.encode(message, writer2).ldelim();
    };
    GraphProto.decode = function decode(reader2, length2) {
      if (!(reader2 instanceof $Reader))
        reader2 = $Reader.create(reader2);
      var end2 = length2 === void 0 ? reader2.len : reader2.pos + length2, message = new $root.onnx.GraphProto();
      while (reader2.pos < end2) {
        var tag = reader2.uint32();
        switch (tag >>> 3) {
          case 1:
            if (!(message.node && message.node.length))
              message.node = [];
            message.node.push($root.onnx.NodeProto.decode(reader2, reader2.uint32()));
            break;
          case 2:
            message.name = reader2.string();
            break;
          case 5:
            if (!(message.initializer && message.initializer.length))
              message.initializer = [];
            message.initializer.push($root.onnx.TensorProto.decode(reader2, reader2.uint32()));
            break;
          case 10:
            message.docString = reader2.string();
            break;
          case 11:
            if (!(message.input && message.input.length))
              message.input = [];
            message.input.push($root.onnx.ValueInfoProto.decode(reader2, reader2.uint32()));
            break;
          case 12:
            if (!(message.output && message.output.length))
              message.output = [];
            message.output.push($root.onnx.ValueInfoProto.decode(reader2, reader2.uint32()));
            break;
          case 13:
            if (!(message.valueInfo && message.valueInfo.length))
              message.valueInfo = [];
            message.valueInfo.push($root.onnx.ValueInfoProto.decode(reader2, reader2.uint32()));
            break;
          case 14:
            if (!(message.quantizationAnnotation && message.quantizationAnnotation.length))
              message.quantizationAnnotation = [];
            message.quantizationAnnotation.push($root.onnx.TensorAnnotation.decode(reader2, reader2.uint32()));
            break;
          default:
            reader2.skipType(tag & 7);
            break;
        }
      }
      return message;
    };
    GraphProto.decodeDelimited = function decodeDelimited(reader2) {
      if (!(reader2 instanceof $Reader))
        reader2 = new $Reader(reader2);
      return this.decode(reader2, reader2.uint32());
    };
    GraphProto.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.node != null && message.hasOwnProperty("node")) {
        if (!Array.isArray(message.node))
          return "node: array expected";
        for (var i = 0; i < message.node.length; ++i) {
          var error = $root.onnx.NodeProto.verify(message.node[i]);
          if (error)
            return "node." + error;
        }
      }
      if (message.name != null && message.hasOwnProperty("name")) {
        if (!$util.isString(message.name))
          return "name: string expected";
      }
      if (message.initializer != null && message.hasOwnProperty("initializer")) {
        if (!Array.isArray(message.initializer))
          return "initializer: array expected";
        for (var i = 0; i < message.initializer.length; ++i) {
          var error = $root.onnx.TensorProto.verify(message.initializer[i]);
          if (error)
            return "initializer." + error;
        }
      }
      if (message.docString != null && message.hasOwnProperty("docString")) {
        if (!$util.isString(message.docString))
          return "docString: string expected";
      }
      if (message.input != null && message.hasOwnProperty("input")) {
        if (!Array.isArray(message.input))
          return "input: array expected";
        for (var i = 0; i < message.input.length; ++i) {
          var error = $root.onnx.ValueInfoProto.verify(message.input[i]);
          if (error)
            return "input." + error;
        }
      }
      if (message.output != null && message.hasOwnProperty("output")) {
        if (!Array.isArray(message.output))
          return "output: array expected";
        for (var i = 0; i < message.output.length; ++i) {
          var error = $root.onnx.ValueInfoProto.verify(message.output[i]);
          if (error)
            return "output." + error;
        }
      }
      if (message.valueInfo != null && message.hasOwnProperty("valueInfo")) {
        if (!Array.isArray(message.valueInfo))
          return "valueInfo: array expected";
        for (var i = 0; i < message.valueInfo.length; ++i) {
          var error = $root.onnx.ValueInfoProto.verify(message.valueInfo[i]);
          if (error)
            return "valueInfo." + error;
        }
      }
      if (message.quantizationAnnotation != null && message.hasOwnProperty("quantizationAnnotation")) {
        if (!Array.isArray(message.quantizationAnnotation))
          return "quantizationAnnotation: array expected";
        for (var i = 0; i < message.quantizationAnnotation.length; ++i) {
          var error = $root.onnx.TensorAnnotation.verify(message.quantizationAnnotation[i]);
          if (error)
            return "quantizationAnnotation." + error;
        }
      }
      return null;
    };
    GraphProto.fromObject = function fromObject(object) {
      if (object instanceof $root.onnx.GraphProto)
        return object;
      var message = new $root.onnx.GraphProto();
      if (object.node) {
        if (!Array.isArray(object.node))
          throw TypeError(".onnx.GraphProto.node: array expected");
        message.node = [];
        for (var i = 0; i < object.node.length; ++i) {
          if (typeof object.node[i] !== "object")
            throw TypeError(".onnx.GraphProto.node: object expected");
          message.node[i] = $root.onnx.NodeProto.fromObject(object.node[i]);
        }
      }
      if (object.name != null)
        message.name = String(object.name);
      if (object.initializer) {
        if (!Array.isArray(object.initializer))
          throw TypeError(".onnx.GraphProto.initializer: array expected");
        message.initializer = [];
        for (var i = 0; i < object.initializer.length; ++i) {
          if (typeof object.initializer[i] !== "object")
            throw TypeError(".onnx.GraphProto.initializer: object expected");
          message.initializer[i] = $root.onnx.TensorProto.fromObject(object.initializer[i]);
        }
      }
      if (object.docString != null)
        message.docString = String(object.docString);
      if (object.input) {
        if (!Array.isArray(object.input))
          throw TypeError(".onnx.GraphProto.input: array expected");
        message.input = [];
        for (var i = 0; i < object.input.length; ++i) {
          if (typeof object.input[i] !== "object")
            throw TypeError(".onnx.GraphProto.input: object expected");
          message.input[i] = $root.onnx.ValueInfoProto.fromObject(object.input[i]);
        }
      }
      if (object.output) {
        if (!Array.isArray(object.output))
          throw TypeError(".onnx.GraphProto.output: array expected");
        message.output = [];
        for (var i = 0; i < object.output.length; ++i) {
          if (typeof object.output[i] !== "object")
            throw TypeError(".onnx.GraphProto.output: object expected");
          message.output[i] = $root.onnx.ValueInfoProto.fromObject(object.output[i]);
        }
      }
      if (object.valueInfo) {
        if (!Array.isArray(object.valueInfo))
          throw TypeError(".onnx.GraphProto.valueInfo: array expected");
        message.valueInfo = [];
        for (var i = 0; i < object.valueInfo.length; ++i) {
          if (typeof object.valueInfo[i] !== "object")
            throw TypeError(".onnx.GraphProto.valueInfo: object expected");
          message.valueInfo[i] = $root.onnx.ValueInfoProto.fromObject(object.valueInfo[i]);
        }
      }
      if (object.quantizationAnnotation) {
        if (!Array.isArray(object.quantizationAnnotation))
          throw TypeError(".onnx.GraphProto.quantizationAnnotation: array expected");
        message.quantizationAnnotation = [];
        for (var i = 0; i < object.quantizationAnnotation.length; ++i) {
          if (typeof object.quantizationAnnotation[i] !== "object")
            throw TypeError(".onnx.GraphProto.quantizationAnnotation: object expected");
          message.quantizationAnnotation[i] = $root.onnx.TensorAnnotation.fromObject(object.quantizationAnnotation[i]);
        }
      }
      return message;
    };
    GraphProto.toObject = function toObject(message, options) {
      if (!options)
        options = {};
      var object = {};
      if (options.arrays || options.defaults) {
        object.node = [];
        object.initializer = [];
        object.input = [];
        object.output = [];
        object.valueInfo = [];
        object.quantizationAnnotation = [];
      }
      if (options.defaults) {
        object.name = "";
        object.docString = "";
      }
      if (message.node && message.node.length) {
        object.node = [];
        for (var j = 0; j < message.node.length; ++j)
          object.node[j] = $root.onnx.NodeProto.toObject(message.node[j], options);
      }
      if (message.name != null && message.hasOwnProperty("name"))
        object.name = message.name;
      if (message.initializer && message.initializer.length) {
        object.initializer = [];
        for (var j = 0; j < message.initializer.length; ++j)
          object.initializer[j] = $root.onnx.TensorProto.toObject(message.initializer[j], options);
      }
      if (message.docString != null && message.hasOwnProperty("docString"))
        object.docString = message.docString;
      if (message.input && message.input.length) {
        object.input = [];
        for (var j = 0; j < message.input.length; ++j)
          object.input[j] = $root.onnx.ValueInfoProto.toObject(message.input[j], options);
      }
      if (message.output && message.output.length) {
        object.output = [];
        for (var j = 0; j < message.output.length; ++j)
          object.output[j] = $root.onnx.ValueInfoProto.toObject(message.output[j], options);
      }
      if (message.valueInfo && message.valueInfo.length) {
        object.valueInfo = [];
        for (var j = 0; j < message.valueInfo.length; ++j)
          object.valueInfo[j] = $root.onnx.ValueInfoProto.toObject(message.valueInfo[j], options);
      }
      if (message.quantizationAnnotation && message.quantizationAnnotation.length) {
        object.quantizationAnnotation = [];
        for (var j = 0; j < message.quantizationAnnotation.length; ++j)
          object.quantizationAnnotation[j] = $root.onnx.TensorAnnotation.toObject(message.quantizationAnnotation[j], options);
      }
      return object;
    };
    GraphProto.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };
    return GraphProto;
  }();
  onnx2.TensorProto = function() {
    function TensorProto(properties) {
      this.dims = [];
      this.floatData = [];
      this.int32Data = [];
      this.stringData = [];
      this.int64Data = [];
      this.externalData = [];
      this.doubleData = [];
      this.uint64Data = [];
      if (properties) {
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null)
            this[keys[i]] = properties[keys[i]];
      }
    }
    TensorProto.prototype.dims = $util.emptyArray;
    TensorProto.prototype.dataType = 0;
    TensorProto.prototype.segment = null;
    TensorProto.prototype.floatData = $util.emptyArray;
    TensorProto.prototype.int32Data = $util.emptyArray;
    TensorProto.prototype.stringData = $util.emptyArray;
    TensorProto.prototype.int64Data = $util.emptyArray;
    TensorProto.prototype.name = "";
    TensorProto.prototype.docString = "";
    TensorProto.prototype.rawData = $util.newBuffer([]);
    TensorProto.prototype.externalData = $util.emptyArray;
    TensorProto.prototype.dataLocation = 0;
    TensorProto.prototype.doubleData = $util.emptyArray;
    TensorProto.prototype.uint64Data = $util.emptyArray;
    TensorProto.create = function create4(properties) {
      return new TensorProto(properties);
    };
    TensorProto.encode = function encode(message, writer2) {
      if (!writer2)
        writer2 = $Writer.create();
      if (message.dims != null && message.dims.length) {
        writer2.uint32(10).fork();
        for (var i = 0; i < message.dims.length; ++i)
          writer2.int64(message.dims[i]);
        writer2.ldelim();
      }
      if (message.dataType != null && message.hasOwnProperty("dataType"))
        writer2.uint32(16).int32(message.dataType);
      if (message.segment != null && message.hasOwnProperty("segment"))
        $root.onnx.TensorProto.Segment.encode(message.segment, writer2.uint32(26).fork()).ldelim();
      if (message.floatData != null && message.floatData.length) {
        writer2.uint32(34).fork();
        for (var i = 0; i < message.floatData.length; ++i)
          writer2.float(message.floatData[i]);
        writer2.ldelim();
      }
      if (message.int32Data != null && message.int32Data.length) {
        writer2.uint32(42).fork();
        for (var i = 0; i < message.int32Data.length; ++i)
          writer2.int32(message.int32Data[i]);
        writer2.ldelim();
      }
      if (message.stringData != null && message.stringData.length)
        for (var i = 0; i < message.stringData.length; ++i)
          writer2.uint32(50).bytes(message.stringData[i]);
      if (message.int64Data != null && message.int64Data.length) {
        writer2.uint32(58).fork();
        for (var i = 0; i < message.int64Data.length; ++i)
          writer2.int64(message.int64Data[i]);
        writer2.ldelim();
      }
      if (message.name != null && message.hasOwnProperty("name"))
        writer2.uint32(66).string(message.name);
      if (message.rawData != null && message.hasOwnProperty("rawData"))
        writer2.uint32(74).bytes(message.rawData);
      if (message.doubleData != null && message.doubleData.length) {
        writer2.uint32(82).fork();
        for (var i = 0; i < message.doubleData.length; ++i)
          writer2.double(message.doubleData[i]);
        writer2.ldelim();
      }
      if (message.uint64Data != null && message.uint64Data.length) {
        writer2.uint32(90).fork();
        for (var i = 0; i < message.uint64Data.length; ++i)
          writer2.uint64(message.uint64Data[i]);
        writer2.ldelim();
      }
      if (message.docString != null && message.hasOwnProperty("docString"))
        writer2.uint32(98).string(message.docString);
      if (message.externalData != null && message.externalData.length)
        for (var i = 0; i < message.externalData.length; ++i)
          $root.onnx.StringStringEntryProto.encode(message.externalData[i], writer2.uint32(106).fork()).ldelim();
      if (message.dataLocation != null && message.hasOwnProperty("dataLocation"))
        writer2.uint32(112).int32(message.dataLocation);
      return writer2;
    };
    TensorProto.encodeDelimited = function encodeDelimited(message, writer2) {
      return this.encode(message, writer2).ldelim();
    };
    TensorProto.decode = function decode(reader2, length2) {
      if (!(reader2 instanceof $Reader))
        reader2 = $Reader.create(reader2);
      var end2 = length2 === void 0 ? reader2.len : reader2.pos + length2, message = new $root.onnx.TensorProto();
      while (reader2.pos < end2) {
        var tag = reader2.uint32();
        switch (tag >>> 3) {
          case 1:
            if (!(message.dims && message.dims.length))
              message.dims = [];
            if ((tag & 7) === 2) {
              var end22 = reader2.uint32() + reader2.pos;
              while (reader2.pos < end22)
                message.dims.push(reader2.int64());
            } else
              message.dims.push(reader2.int64());
            break;
          case 2:
            message.dataType = reader2.int32();
            break;
          case 3:
            message.segment = $root.onnx.TensorProto.Segment.decode(reader2, reader2.uint32());
            break;
          case 4:
            if (!(message.floatData && message.floatData.length))
              message.floatData = [];
            if ((tag & 7) === 2) {
              var end22 = reader2.uint32() + reader2.pos;
              while (reader2.pos < end22)
                message.floatData.push(reader2.float());
            } else
              message.floatData.push(reader2.float());
            break;
          case 5:
            if (!(message.int32Data && message.int32Data.length))
              message.int32Data = [];
            if ((tag & 7) === 2) {
              var end22 = reader2.uint32() + reader2.pos;
              while (reader2.pos < end22)
                message.int32Data.push(reader2.int32());
            } else
              message.int32Data.push(reader2.int32());
            break;
          case 6:
            if (!(message.stringData && message.stringData.length))
              message.stringData = [];
            message.stringData.push(reader2.bytes());
            break;
          case 7:
            if (!(message.int64Data && message.int64Data.length))
              message.int64Data = [];
            if ((tag & 7) === 2) {
              var end22 = reader2.uint32() + reader2.pos;
              while (reader2.pos < end22)
                message.int64Data.push(reader2.int64());
            } else
              message.int64Data.push(reader2.int64());
            break;
          case 8:
            message.name = reader2.string();
            break;
          case 12:
            message.docString = reader2.string();
            break;
          case 9:
            message.rawData = reader2.bytes();
            break;
          case 13:
            if (!(message.externalData && message.externalData.length))
              message.externalData = [];
            message.externalData.push($root.onnx.StringStringEntryProto.decode(reader2, reader2.uint32()));
            break;
          case 14:
            message.dataLocation = reader2.int32();
            break;
          case 10:
            if (!(message.doubleData && message.doubleData.length))
              message.doubleData = [];
            if ((tag & 7) === 2) {
              var end22 = reader2.uint32() + reader2.pos;
              while (reader2.pos < end22)
                message.doubleData.push(reader2.double());
            } else
              message.doubleData.push(reader2.double());
            break;
          case 11:
            if (!(message.uint64Data && message.uint64Data.length))
              message.uint64Data = [];
            if ((tag & 7) === 2) {
              var end22 = reader2.uint32() + reader2.pos;
              while (reader2.pos < end22)
                message.uint64Data.push(reader2.uint64());
            } else
              message.uint64Data.push(reader2.uint64());
            break;
          default:
            reader2.skipType(tag & 7);
            break;
        }
      }
      return message;
    };
    TensorProto.decodeDelimited = function decodeDelimited(reader2) {
      if (!(reader2 instanceof $Reader))
        reader2 = new $Reader(reader2);
      return this.decode(reader2, reader2.uint32());
    };
    TensorProto.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.dims != null && message.hasOwnProperty("dims")) {
        if (!Array.isArray(message.dims))
          return "dims: array expected";
        for (var i = 0; i < message.dims.length; ++i)
          if (!$util.isInteger(message.dims[i]) && !(message.dims[i] && $util.isInteger(message.dims[i].low) && $util.isInteger(message.dims[i].high)))
            return "dims: integer|Long[] expected";
      }
      if (message.dataType != null && message.hasOwnProperty("dataType")) {
        if (!$util.isInteger(message.dataType))
          return "dataType: integer expected";
      }
      if (message.segment != null && message.hasOwnProperty("segment")) {
        var error = $root.onnx.TensorProto.Segment.verify(message.segment);
        if (error)
          return "segment." + error;
      }
      if (message.floatData != null && message.hasOwnProperty("floatData")) {
        if (!Array.isArray(message.floatData))
          return "floatData: array expected";
        for (var i = 0; i < message.floatData.length; ++i)
          if (typeof message.floatData[i] !== "number")
            return "floatData: number[] expected";
      }
      if (message.int32Data != null && message.hasOwnProperty("int32Data")) {
        if (!Array.isArray(message.int32Data))
          return "int32Data: array expected";
        for (var i = 0; i < message.int32Data.length; ++i)
          if (!$util.isInteger(message.int32Data[i]))
            return "int32Data: integer[] expected";
      }
      if (message.stringData != null && message.hasOwnProperty("stringData")) {
        if (!Array.isArray(message.stringData))
          return "stringData: array expected";
        for (var i = 0; i < message.stringData.length; ++i)
          if (!(message.stringData[i] && typeof message.stringData[i].length === "number" || $util.isString(message.stringData[i])))
            return "stringData: buffer[] expected";
      }
      if (message.int64Data != null && message.hasOwnProperty("int64Data")) {
        if (!Array.isArray(message.int64Data))
          return "int64Data: array expected";
        for (var i = 0; i < message.int64Data.length; ++i)
          if (!$util.isInteger(message.int64Data[i]) && !(message.int64Data[i] && $util.isInteger(message.int64Data[i].low) && $util.isInteger(message.int64Data[i].high)))
            return "int64Data: integer|Long[] expected";
      }
      if (message.name != null && message.hasOwnProperty("name")) {
        if (!$util.isString(message.name))
          return "name: string expected";
      }
      if (message.docString != null && message.hasOwnProperty("docString")) {
        if (!$util.isString(message.docString))
          return "docString: string expected";
      }
      if (message.rawData != null && message.hasOwnProperty("rawData")) {
        if (!(message.rawData && typeof message.rawData.length === "number" || $util.isString(message.rawData)))
          return "rawData: buffer expected";
      }
      if (message.externalData != null && message.hasOwnProperty("externalData")) {
        if (!Array.isArray(message.externalData))
          return "externalData: array expected";
        for (var i = 0; i < message.externalData.length; ++i) {
          var error = $root.onnx.StringStringEntryProto.verify(message.externalData[i]);
          if (error)
            return "externalData." + error;
        }
      }
      if (message.dataLocation != null && message.hasOwnProperty("dataLocation"))
        switch (message.dataLocation) {
          default:
            return "dataLocation: enum value expected";
          case 0:
          case 1:
            break;
        }
      if (message.doubleData != null && message.hasOwnProperty("doubleData")) {
        if (!Array.isArray(message.doubleData))
          return "doubleData: array expected";
        for (var i = 0; i < message.doubleData.length; ++i)
          if (typeof message.doubleData[i] !== "number")
            return "doubleData: number[] expected";
      }
      if (message.uint64Data != null && message.hasOwnProperty("uint64Data")) {
        if (!Array.isArray(message.uint64Data))
          return "uint64Data: array expected";
        for (var i = 0; i < message.uint64Data.length; ++i)
          if (!$util.isInteger(message.uint64Data[i]) && !(message.uint64Data[i] && $util.isInteger(message.uint64Data[i].low) && $util.isInteger(message.uint64Data[i].high)))
            return "uint64Data: integer|Long[] expected";
      }
      return null;
    };
    TensorProto.fromObject = function fromObject(object) {
      if (object instanceof $root.onnx.TensorProto)
        return object;
      var message = new $root.onnx.TensorProto();
      if (object.dims) {
        if (!Array.isArray(object.dims))
          throw TypeError(".onnx.TensorProto.dims: array expected");
        message.dims = [];
        for (var i = 0; i < object.dims.length; ++i)
          if ($util.Long)
            (message.dims[i] = $util.Long.fromValue(object.dims[i])).unsigned = false;
          else if (typeof object.dims[i] === "string")
            message.dims[i] = parseInt(object.dims[i], 10);
          else if (typeof object.dims[i] === "number")
            message.dims[i] = object.dims[i];
          else if (typeof object.dims[i] === "object")
            message.dims[i] = new $util.LongBits(object.dims[i].low >>> 0, object.dims[i].high >>> 0).toNumber();
      }
      if (object.dataType != null)
        message.dataType = object.dataType | 0;
      if (object.segment != null) {
        if (typeof object.segment !== "object")
          throw TypeError(".onnx.TensorProto.segment: object expected");
        message.segment = $root.onnx.TensorProto.Segment.fromObject(object.segment);
      }
      if (object.floatData) {
        if (!Array.isArray(object.floatData))
          throw TypeError(".onnx.TensorProto.floatData: array expected");
        message.floatData = [];
        for (var i = 0; i < object.floatData.length; ++i)
          message.floatData[i] = Number(object.floatData[i]);
      }
      if (object.int32Data) {
        if (!Array.isArray(object.int32Data))
          throw TypeError(".onnx.TensorProto.int32Data: array expected");
        message.int32Data = [];
        for (var i = 0; i < object.int32Data.length; ++i)
          message.int32Data[i] = object.int32Data[i] | 0;
      }
      if (object.stringData) {
        if (!Array.isArray(object.stringData))
          throw TypeError(".onnx.TensorProto.stringData: array expected");
        message.stringData = [];
        for (var i = 0; i < object.stringData.length; ++i)
          if (typeof object.stringData[i] === "string")
            $util.base64.decode(object.stringData[i], message.stringData[i] = $util.newBuffer($util.base64.length(object.stringData[i])), 0);
          else if (object.stringData[i].length)
            message.stringData[i] = object.stringData[i];
      }
      if (object.int64Data) {
        if (!Array.isArray(object.int64Data))
          throw TypeError(".onnx.TensorProto.int64Data: array expected");
        message.int64Data = [];
        for (var i = 0; i < object.int64Data.length; ++i)
          if ($util.Long)
            (message.int64Data[i] = $util.Long.fromValue(object.int64Data[i])).unsigned = false;
          else if (typeof object.int64Data[i] === "string")
            message.int64Data[i] = parseInt(object.int64Data[i], 10);
          else if (typeof object.int64Data[i] === "number")
            message.int64Data[i] = object.int64Data[i];
          else if (typeof object.int64Data[i] === "object")
            message.int64Data[i] = new $util.LongBits(object.int64Data[i].low >>> 0, object.int64Data[i].high >>> 0).toNumber();
      }
      if (object.name != null)
        message.name = String(object.name);
      if (object.docString != null)
        message.docString = String(object.docString);
      if (object.rawData != null) {
        if (typeof object.rawData === "string")
          $util.base64.decode(object.rawData, message.rawData = $util.newBuffer($util.base64.length(object.rawData)), 0);
        else if (object.rawData.length)
          message.rawData = object.rawData;
      }
      if (object.externalData) {
        if (!Array.isArray(object.externalData))
          throw TypeError(".onnx.TensorProto.externalData: array expected");
        message.externalData = [];
        for (var i = 0; i < object.externalData.length; ++i) {
          if (typeof object.externalData[i] !== "object")
            throw TypeError(".onnx.TensorProto.externalData: object expected");
          message.externalData[i] = $root.onnx.StringStringEntryProto.fromObject(object.externalData[i]);
        }
      }
      switch (object.dataLocation) {
        case "DEFAULT":
        case 0:
          message.dataLocation = 0;
          break;
        case "EXTERNAL":
        case 1:
          message.dataLocation = 1;
          break;
      }
      if (object.doubleData) {
        if (!Array.isArray(object.doubleData))
          throw TypeError(".onnx.TensorProto.doubleData: array expected");
        message.doubleData = [];
        for (var i = 0; i < object.doubleData.length; ++i)
          message.doubleData[i] = Number(object.doubleData[i]);
      }
      if (object.uint64Data) {
        if (!Array.isArray(object.uint64Data))
          throw TypeError(".onnx.TensorProto.uint64Data: array expected");
        message.uint64Data = [];
        for (var i = 0; i < object.uint64Data.length; ++i)
          if ($util.Long)
            (message.uint64Data[i] = $util.Long.fromValue(object.uint64Data[i])).unsigned = true;
          else if (typeof object.uint64Data[i] === "string")
            message.uint64Data[i] = parseInt(object.uint64Data[i], 10);
          else if (typeof object.uint64Data[i] === "number")
            message.uint64Data[i] = object.uint64Data[i];
          else if (typeof object.uint64Data[i] === "object")
            message.uint64Data[i] = new $util.LongBits(object.uint64Data[i].low >>> 0, object.uint64Data[i].high >>> 0).toNumber(true);
      }
      return message;
    };
    TensorProto.toObject = function toObject(message, options) {
      if (!options)
        options = {};
      var object = {};
      if (options.arrays || options.defaults) {
        object.dims = [];
        object.floatData = [];
        object.int32Data = [];
        object.stringData = [];
        object.int64Data = [];
        object.doubleData = [];
        object.uint64Data = [];
        object.externalData = [];
      }
      if (options.defaults) {
        object.dataType = 0;
        object.segment = null;
        object.name = "";
        if (options.bytes === String)
          object.rawData = "";
        else {
          object.rawData = [];
          if (options.bytes !== Array)
            object.rawData = $util.newBuffer(object.rawData);
        }
        object.docString = "";
        object.dataLocation = options.enums === String ? "DEFAULT" : 0;
      }
      if (message.dims && message.dims.length) {
        object.dims = [];
        for (var j = 0; j < message.dims.length; ++j)
          if (typeof message.dims[j] === "number")
            object.dims[j] = options.longs === String ? String(message.dims[j]) : message.dims[j];
          else
            object.dims[j] = options.longs === String ? $util.Long.prototype.toString.call(message.dims[j]) : options.longs === Number ? new $util.LongBits(message.dims[j].low >>> 0, message.dims[j].high >>> 0).toNumber() : message.dims[j];
      }
      if (message.dataType != null && message.hasOwnProperty("dataType"))
        object.dataType = message.dataType;
      if (message.segment != null && message.hasOwnProperty("segment"))
        object.segment = $root.onnx.TensorProto.Segment.toObject(message.segment, options);
      if (message.floatData && message.floatData.length) {
        object.floatData = [];
        for (var j = 0; j < message.floatData.length; ++j)
          object.floatData[j] = options.json && !isFinite(message.floatData[j]) ? String(message.floatData[j]) : message.floatData[j];
      }
      if (message.int32Data && message.int32Data.length) {
        object.int32Data = [];
        for (var j = 0; j < message.int32Data.length; ++j)
          object.int32Data[j] = message.int32Data[j];
      }
      if (message.stringData && message.stringData.length) {
        object.stringData = [];
        for (var j = 0; j < message.stringData.length; ++j)
          object.stringData[j] = options.bytes === String ? $util.base64.encode(message.stringData[j], 0, message.stringData[j].length) : options.bytes === Array ? Array.prototype.slice.call(message.stringData[j]) : message.stringData[j];
      }
      if (message.int64Data && message.int64Data.length) {
        object.int64Data = [];
        for (var j = 0; j < message.int64Data.length; ++j)
          if (typeof message.int64Data[j] === "number")
            object.int64Data[j] = options.longs === String ? String(message.int64Data[j]) : message.int64Data[j];
          else
            object.int64Data[j] = options.longs === String ? $util.Long.prototype.toString.call(message.int64Data[j]) : options.longs === Number ? new $util.LongBits(message.int64Data[j].low >>> 0, message.int64Data[j].high >>> 0).toNumber() : message.int64Data[j];
      }
      if (message.name != null && message.hasOwnProperty("name"))
        object.name = message.name;
      if (message.rawData != null && message.hasOwnProperty("rawData"))
        object.rawData = options.bytes === String ? $util.base64.encode(message.rawData, 0, message.rawData.length) : options.bytes === Array ? Array.prototype.slice.call(message.rawData) : message.rawData;
      if (message.doubleData && message.doubleData.length) {
        object.doubleData = [];
        for (var j = 0; j < message.doubleData.length; ++j)
          object.doubleData[j] = options.json && !isFinite(message.doubleData[j]) ? String(message.doubleData[j]) : message.doubleData[j];
      }
      if (message.uint64Data && message.uint64Data.length) {
        object.uint64Data = [];
        for (var j = 0; j < message.uint64Data.length; ++j)
          if (typeof message.uint64Data[j] === "number")
            object.uint64Data[j] = options.longs === String ? String(message.uint64Data[j]) : message.uint64Data[j];
          else
            object.uint64Data[j] = options.longs === String ? $util.Long.prototype.toString.call(message.uint64Data[j]) : options.longs === Number ? new $util.LongBits(message.uint64Data[j].low >>> 0, message.uint64Data[j].high >>> 0).toNumber(true) : message.uint64Data[j];
      }
      if (message.docString != null && message.hasOwnProperty("docString"))
        object.docString = message.docString;
      if (message.externalData && message.externalData.length) {
        object.externalData = [];
        for (var j = 0; j < message.externalData.length; ++j)
          object.externalData[j] = $root.onnx.StringStringEntryProto.toObject(message.externalData[j], options);
      }
      if (message.dataLocation != null && message.hasOwnProperty("dataLocation"))
        object.dataLocation = options.enums === String ? $root.onnx.TensorProto.DataLocation[message.dataLocation] : message.dataLocation;
      return object;
    };
    TensorProto.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };
    TensorProto.DataType = function() {
      var valuesById = {}, values = Object.create(valuesById);
      values[valuesById[0] = "UNDEFINED"] = 0;
      values[valuesById[1] = "FLOAT"] = 1;
      values[valuesById[2] = "UINT8"] = 2;
      values[valuesById[3] = "INT8"] = 3;
      values[valuesById[4] = "UINT16"] = 4;
      values[valuesById[5] = "INT16"] = 5;
      values[valuesById[6] = "INT32"] = 6;
      values[valuesById[7] = "INT64"] = 7;
      values[valuesById[8] = "STRING"] = 8;
      values[valuesById[9] = "BOOL"] = 9;
      values[valuesById[10] = "FLOAT16"] = 10;
      values[valuesById[11] = "DOUBLE"] = 11;
      values[valuesById[12] = "UINT32"] = 12;
      values[valuesById[13] = "UINT64"] = 13;
      values[valuesById[14] = "COMPLEX64"] = 14;
      values[valuesById[15] = "COMPLEX128"] = 15;
      values[valuesById[16] = "BFLOAT16"] = 16;
      return values;
    }();
    TensorProto.Segment = function() {
      function Segment(properties) {
        if (properties) {
          for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null)
              this[keys[i]] = properties[keys[i]];
        }
      }
      Segment.prototype.begin = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
      Segment.prototype.end = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
      Segment.create = function create4(properties) {
        return new Segment(properties);
      };
      Segment.encode = function encode(message, writer2) {
        if (!writer2)
          writer2 = $Writer.create();
        if (message.begin != null && message.hasOwnProperty("begin"))
          writer2.uint32(8).int64(message.begin);
        if (message.end != null && message.hasOwnProperty("end"))
          writer2.uint32(16).int64(message.end);
        return writer2;
      };
      Segment.encodeDelimited = function encodeDelimited(message, writer2) {
        return this.encode(message, writer2).ldelim();
      };
      Segment.decode = function decode(reader2, length2) {
        if (!(reader2 instanceof $Reader))
          reader2 = $Reader.create(reader2);
        var end2 = length2 === void 0 ? reader2.len : reader2.pos + length2, message = new $root.onnx.TensorProto.Segment();
        while (reader2.pos < end2) {
          var tag = reader2.uint32();
          switch (tag >>> 3) {
            case 1:
              message.begin = reader2.int64();
              break;
            case 2:
              message.end = reader2.int64();
              break;
            default:
              reader2.skipType(tag & 7);
              break;
          }
        }
        return message;
      };
      Segment.decodeDelimited = function decodeDelimited(reader2) {
        if (!(reader2 instanceof $Reader))
          reader2 = new $Reader(reader2);
        return this.decode(reader2, reader2.uint32());
      };
      Segment.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (message.begin != null && message.hasOwnProperty("begin")) {
          if (!$util.isInteger(message.begin) && !(message.begin && $util.isInteger(message.begin.low) && $util.isInteger(message.begin.high)))
            return "begin: integer|Long expected";
        }
        if (message.end != null && message.hasOwnProperty("end")) {
          if (!$util.isInteger(message.end) && !(message.end && $util.isInteger(message.end.low) && $util.isInteger(message.end.high)))
            return "end: integer|Long expected";
        }
        return null;
      };
      Segment.fromObject = function fromObject(object) {
        if (object instanceof $root.onnx.TensorProto.Segment)
          return object;
        var message = new $root.onnx.TensorProto.Segment();
        if (object.begin != null) {
          if ($util.Long)
            (message.begin = $util.Long.fromValue(object.begin)).unsigned = false;
          else if (typeof object.begin === "string")
            message.begin = parseInt(object.begin, 10);
          else if (typeof object.begin === "number")
            message.begin = object.begin;
          else if (typeof object.begin === "object")
            message.begin = new $util.LongBits(object.begin.low >>> 0, object.begin.high >>> 0).toNumber();
        }
        if (object.end != null) {
          if ($util.Long)
            (message.end = $util.Long.fromValue(object.end)).unsigned = false;
          else if (typeof object.end === "string")
            message.end = parseInt(object.end, 10);
          else if (typeof object.end === "number")
            message.end = object.end;
          else if (typeof object.end === "object")
            message.end = new $util.LongBits(object.end.low >>> 0, object.end.high >>> 0).toNumber();
        }
        return message;
      };
      Segment.toObject = function toObject(message, options) {
        if (!options)
          options = {};
        var object = {};
        if (options.defaults) {
          if ($util.Long) {
            var long2 = new $util.Long(0, 0, false);
            object.begin = options.longs === String ? long2.toString() : options.longs === Number ? long2.toNumber() : long2;
          } else
            object.begin = options.longs === String ? "0" : 0;
          if ($util.Long) {
            var long2 = new $util.Long(0, 0, false);
            object.end = options.longs === String ? long2.toString() : options.longs === Number ? long2.toNumber() : long2;
          } else
            object.end = options.longs === String ? "0" : 0;
        }
        if (message.begin != null && message.hasOwnProperty("begin"))
          if (typeof message.begin === "number")
            object.begin = options.longs === String ? String(message.begin) : message.begin;
          else
            object.begin = options.longs === String ? $util.Long.prototype.toString.call(message.begin) : options.longs === Number ? new $util.LongBits(message.begin.low >>> 0, message.begin.high >>> 0).toNumber() : message.begin;
        if (message.end != null && message.hasOwnProperty("end"))
          if (typeof message.end === "number")
            object.end = options.longs === String ? String(message.end) : message.end;
          else
            object.end = options.longs === String ? $util.Long.prototype.toString.call(message.end) : options.longs === Number ? new $util.LongBits(message.end.low >>> 0, message.end.high >>> 0).toNumber() : message.end;
        return object;
      };
      Segment.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      return Segment;
    }();
    TensorProto.DataLocation = function() {
      var valuesById = {}, values = Object.create(valuesById);
      values[valuesById[0] = "DEFAULT"] = 0;
      values[valuesById[1] = "EXTERNAL"] = 1;
      return values;
    }();
    return TensorProto;
  }();
  onnx2.TensorShapeProto = function() {
    function TensorShapeProto(properties) {
      this.dim = [];
      if (properties) {
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null)
            this[keys[i]] = properties[keys[i]];
      }
    }
    TensorShapeProto.prototype.dim = $util.emptyArray;
    TensorShapeProto.create = function create4(properties) {
      return new TensorShapeProto(properties);
    };
    TensorShapeProto.encode = function encode(message, writer2) {
      if (!writer2)
        writer2 = $Writer.create();
      if (message.dim != null && message.dim.length)
        for (var i = 0; i < message.dim.length; ++i)
          $root.onnx.TensorShapeProto.Dimension.encode(message.dim[i], writer2.uint32(10).fork()).ldelim();
      return writer2;
    };
    TensorShapeProto.encodeDelimited = function encodeDelimited(message, writer2) {
      return this.encode(message, writer2).ldelim();
    };
    TensorShapeProto.decode = function decode(reader2, length2) {
      if (!(reader2 instanceof $Reader))
        reader2 = $Reader.create(reader2);
      var end2 = length2 === void 0 ? reader2.len : reader2.pos + length2, message = new $root.onnx.TensorShapeProto();
      while (reader2.pos < end2) {
        var tag = reader2.uint32();
        switch (tag >>> 3) {
          case 1:
            if (!(message.dim && message.dim.length))
              message.dim = [];
            message.dim.push($root.onnx.TensorShapeProto.Dimension.decode(reader2, reader2.uint32()));
            break;
          default:
            reader2.skipType(tag & 7);
            break;
        }
      }
      return message;
    };
    TensorShapeProto.decodeDelimited = function decodeDelimited(reader2) {
      if (!(reader2 instanceof $Reader))
        reader2 = new $Reader(reader2);
      return this.decode(reader2, reader2.uint32());
    };
    TensorShapeProto.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.dim != null && message.hasOwnProperty("dim")) {
        if (!Array.isArray(message.dim))
          return "dim: array expected";
        for (var i = 0; i < message.dim.length; ++i) {
          var error = $root.onnx.TensorShapeProto.Dimension.verify(message.dim[i]);
          if (error)
            return "dim." + error;
        }
      }
      return null;
    };
    TensorShapeProto.fromObject = function fromObject(object) {
      if (object instanceof $root.onnx.TensorShapeProto)
        return object;
      var message = new $root.onnx.TensorShapeProto();
      if (object.dim) {
        if (!Array.isArray(object.dim))
          throw TypeError(".onnx.TensorShapeProto.dim: array expected");
        message.dim = [];
        for (var i = 0; i < object.dim.length; ++i) {
          if (typeof object.dim[i] !== "object")
            throw TypeError(".onnx.TensorShapeProto.dim: object expected");
          message.dim[i] = $root.onnx.TensorShapeProto.Dimension.fromObject(object.dim[i]);
        }
      }
      return message;
    };
    TensorShapeProto.toObject = function toObject(message, options) {
      if (!options)
        options = {};
      var object = {};
      if (options.arrays || options.defaults)
        object.dim = [];
      if (message.dim && message.dim.length) {
        object.dim = [];
        for (var j = 0; j < message.dim.length; ++j)
          object.dim[j] = $root.onnx.TensorShapeProto.Dimension.toObject(message.dim[j], options);
      }
      return object;
    };
    TensorShapeProto.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };
    TensorShapeProto.Dimension = function() {
      function Dimension(properties) {
        if (properties) {
          for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null)
              this[keys[i]] = properties[keys[i]];
        }
      }
      Dimension.prototype.dimValue = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
      Dimension.prototype.dimParam = "";
      Dimension.prototype.denotation = "";
      var $oneOfFields;
      Object.defineProperty(Dimension.prototype, "value", {
        get: $util.oneOfGetter($oneOfFields = ["dimValue", "dimParam"]),
        set: $util.oneOfSetter($oneOfFields)
      });
      Dimension.create = function create4(properties) {
        return new Dimension(properties);
      };
      Dimension.encode = function encode(message, writer2) {
        if (!writer2)
          writer2 = $Writer.create();
        if (message.dimValue != null && message.hasOwnProperty("dimValue"))
          writer2.uint32(8).int64(message.dimValue);
        if (message.dimParam != null && message.hasOwnProperty("dimParam"))
          writer2.uint32(18).string(message.dimParam);
        if (message.denotation != null && message.hasOwnProperty("denotation"))
          writer2.uint32(26).string(message.denotation);
        return writer2;
      };
      Dimension.encodeDelimited = function encodeDelimited(message, writer2) {
        return this.encode(message, writer2).ldelim();
      };
      Dimension.decode = function decode(reader2, length2) {
        if (!(reader2 instanceof $Reader))
          reader2 = $Reader.create(reader2);
        var end2 = length2 === void 0 ? reader2.len : reader2.pos + length2, message = new $root.onnx.TensorShapeProto.Dimension();
        while (reader2.pos < end2) {
          var tag = reader2.uint32();
          switch (tag >>> 3) {
            case 1:
              message.dimValue = reader2.int64();
              break;
            case 2:
              message.dimParam = reader2.string();
              break;
            case 3:
              message.denotation = reader2.string();
              break;
            default:
              reader2.skipType(tag & 7);
              break;
          }
        }
        return message;
      };
      Dimension.decodeDelimited = function decodeDelimited(reader2) {
        if (!(reader2 instanceof $Reader))
          reader2 = new $Reader(reader2);
        return this.decode(reader2, reader2.uint32());
      };
      Dimension.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        var properties = {};
        if (message.dimValue != null && message.hasOwnProperty("dimValue")) {
          properties.value = 1;
          if (!$util.isInteger(message.dimValue) && !(message.dimValue && $util.isInteger(message.dimValue.low) && $util.isInteger(message.dimValue.high)))
            return "dimValue: integer|Long expected";
        }
        if (message.dimParam != null && message.hasOwnProperty("dimParam")) {
          if (properties.value === 1)
            return "value: multiple values";
          properties.value = 1;
          if (!$util.isString(message.dimParam))
            return "dimParam: string expected";
        }
        if (message.denotation != null && message.hasOwnProperty("denotation")) {
          if (!$util.isString(message.denotation))
            return "denotation: string expected";
        }
        return null;
      };
      Dimension.fromObject = function fromObject(object) {
        if (object instanceof $root.onnx.TensorShapeProto.Dimension)
          return object;
        var message = new $root.onnx.TensorShapeProto.Dimension();
        if (object.dimValue != null) {
          if ($util.Long)
            (message.dimValue = $util.Long.fromValue(object.dimValue)).unsigned = false;
          else if (typeof object.dimValue === "string")
            message.dimValue = parseInt(object.dimValue, 10);
          else if (typeof object.dimValue === "number")
            message.dimValue = object.dimValue;
          else if (typeof object.dimValue === "object")
            message.dimValue = new $util.LongBits(object.dimValue.low >>> 0, object.dimValue.high >>> 0).toNumber();
        }
        if (object.dimParam != null)
          message.dimParam = String(object.dimParam);
        if (object.denotation != null)
          message.denotation = String(object.denotation);
        return message;
      };
      Dimension.toObject = function toObject(message, options) {
        if (!options)
          options = {};
        var object = {};
        if (options.defaults)
          object.denotation = "";
        if (message.dimValue != null && message.hasOwnProperty("dimValue")) {
          if (typeof message.dimValue === "number")
            object.dimValue = options.longs === String ? String(message.dimValue) : message.dimValue;
          else
            object.dimValue = options.longs === String ? $util.Long.prototype.toString.call(message.dimValue) : options.longs === Number ? new $util.LongBits(message.dimValue.low >>> 0, message.dimValue.high >>> 0).toNumber() : message.dimValue;
          if (options.oneofs)
            object.value = "dimValue";
        }
        if (message.dimParam != null && message.hasOwnProperty("dimParam")) {
          object.dimParam = message.dimParam;
          if (options.oneofs)
            object.value = "dimParam";
        }
        if (message.denotation != null && message.hasOwnProperty("denotation"))
          object.denotation = message.denotation;
        return object;
      };
      Dimension.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      return Dimension;
    }();
    return TensorShapeProto;
  }();
  onnx2.TypeProto = function() {
    function TypeProto(properties) {
      if (properties) {
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null)
            this[keys[i]] = properties[keys[i]];
      }
    }
    TypeProto.prototype.tensorType = null;
    TypeProto.prototype.denotation = "";
    var $oneOfFields;
    Object.defineProperty(TypeProto.prototype, "value", {
      get: $util.oneOfGetter($oneOfFields = ["tensorType"]),
      set: $util.oneOfSetter($oneOfFields)
    });
    TypeProto.create = function create4(properties) {
      return new TypeProto(properties);
    };
    TypeProto.encode = function encode(message, writer2) {
      if (!writer2)
        writer2 = $Writer.create();
      if (message.tensorType != null && message.hasOwnProperty("tensorType"))
        $root.onnx.TypeProto.Tensor.encode(message.tensorType, writer2.uint32(10).fork()).ldelim();
      if (message.denotation != null && message.hasOwnProperty("denotation"))
        writer2.uint32(50).string(message.denotation);
      return writer2;
    };
    TypeProto.encodeDelimited = function encodeDelimited(message, writer2) {
      return this.encode(message, writer2).ldelim();
    };
    TypeProto.decode = function decode(reader2, length2) {
      if (!(reader2 instanceof $Reader))
        reader2 = $Reader.create(reader2);
      var end2 = length2 === void 0 ? reader2.len : reader2.pos + length2, message = new $root.onnx.TypeProto();
      while (reader2.pos < end2) {
        var tag = reader2.uint32();
        switch (tag >>> 3) {
          case 1:
            message.tensorType = $root.onnx.TypeProto.Tensor.decode(reader2, reader2.uint32());
            break;
          case 6:
            message.denotation = reader2.string();
            break;
          default:
            reader2.skipType(tag & 7);
            break;
        }
      }
      return message;
    };
    TypeProto.decodeDelimited = function decodeDelimited(reader2) {
      if (!(reader2 instanceof $Reader))
        reader2 = new $Reader(reader2);
      return this.decode(reader2, reader2.uint32());
    };
    TypeProto.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.tensorType != null && message.hasOwnProperty("tensorType")) {
        {
          var error = $root.onnx.TypeProto.Tensor.verify(message.tensorType);
          if (error)
            return "tensorType." + error;
        }
      }
      if (message.denotation != null && message.hasOwnProperty("denotation")) {
        if (!$util.isString(message.denotation))
          return "denotation: string expected";
      }
      return null;
    };
    TypeProto.fromObject = function fromObject(object) {
      if (object instanceof $root.onnx.TypeProto)
        return object;
      var message = new $root.onnx.TypeProto();
      if (object.tensorType != null) {
        if (typeof object.tensorType !== "object")
          throw TypeError(".onnx.TypeProto.tensorType: object expected");
        message.tensorType = $root.onnx.TypeProto.Tensor.fromObject(object.tensorType);
      }
      if (object.denotation != null)
        message.denotation = String(object.denotation);
      return message;
    };
    TypeProto.toObject = function toObject(message, options) {
      if (!options)
        options = {};
      var object = {};
      if (options.defaults)
        object.denotation = "";
      if (message.tensorType != null && message.hasOwnProperty("tensorType")) {
        object.tensorType = $root.onnx.TypeProto.Tensor.toObject(message.tensorType, options);
        if (options.oneofs)
          object.value = "tensorType";
      }
      if (message.denotation != null && message.hasOwnProperty("denotation"))
        object.denotation = message.denotation;
      return object;
    };
    TypeProto.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };
    TypeProto.Tensor = function() {
      function Tensor2(properties) {
        if (properties) {
          for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null)
              this[keys[i]] = properties[keys[i]];
        }
      }
      Tensor2.prototype.elemType = 0;
      Tensor2.prototype.shape = null;
      Tensor2.create = function create4(properties) {
        return new Tensor2(properties);
      };
      Tensor2.encode = function encode(message, writer2) {
        if (!writer2)
          writer2 = $Writer.create();
        if (message.elemType != null && message.hasOwnProperty("elemType"))
          writer2.uint32(8).int32(message.elemType);
        if (message.shape != null && message.hasOwnProperty("shape"))
          $root.onnx.TensorShapeProto.encode(message.shape, writer2.uint32(18).fork()).ldelim();
        return writer2;
      };
      Tensor2.encodeDelimited = function encodeDelimited(message, writer2) {
        return this.encode(message, writer2).ldelim();
      };
      Tensor2.decode = function decode(reader2, length2) {
        if (!(reader2 instanceof $Reader))
          reader2 = $Reader.create(reader2);
        var end2 = length2 === void 0 ? reader2.len : reader2.pos + length2, message = new $root.onnx.TypeProto.Tensor();
        while (reader2.pos < end2) {
          var tag = reader2.uint32();
          switch (tag >>> 3) {
            case 1:
              message.elemType = reader2.int32();
              break;
            case 2:
              message.shape = $root.onnx.TensorShapeProto.decode(reader2, reader2.uint32());
              break;
            default:
              reader2.skipType(tag & 7);
              break;
          }
        }
        return message;
      };
      Tensor2.decodeDelimited = function decodeDelimited(reader2) {
        if (!(reader2 instanceof $Reader))
          reader2 = new $Reader(reader2);
        return this.decode(reader2, reader2.uint32());
      };
      Tensor2.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (message.elemType != null && message.hasOwnProperty("elemType")) {
          if (!$util.isInteger(message.elemType))
            return "elemType: integer expected";
        }
        if (message.shape != null && message.hasOwnProperty("shape")) {
          var error = $root.onnx.TensorShapeProto.verify(message.shape);
          if (error)
            return "shape." + error;
        }
        return null;
      };
      Tensor2.fromObject = function fromObject(object) {
        if (object instanceof $root.onnx.TypeProto.Tensor)
          return object;
        var message = new $root.onnx.TypeProto.Tensor();
        if (object.elemType != null)
          message.elemType = object.elemType | 0;
        if (object.shape != null) {
          if (typeof object.shape !== "object")
            throw TypeError(".onnx.TypeProto.Tensor.shape: object expected");
          message.shape = $root.onnx.TensorShapeProto.fromObject(object.shape);
        }
        return message;
      };
      Tensor2.toObject = function toObject(message, options) {
        if (!options)
          options = {};
        var object = {};
        if (options.defaults) {
          object.elemType = 0;
          object.shape = null;
        }
        if (message.elemType != null && message.hasOwnProperty("elemType"))
          object.elemType = message.elemType;
        if (message.shape != null && message.hasOwnProperty("shape"))
          object.shape = $root.onnx.TensorShapeProto.toObject(message.shape, options);
        return object;
      };
      Tensor2.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      return Tensor2;
    }();
    return TypeProto;
  }();
  onnx2.OperatorSetIdProto = function() {
    function OperatorSetIdProto(properties) {
      if (properties) {
        for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null)
            this[keys[i]] = properties[keys[i]];
      }
    }
    OperatorSetIdProto.prototype.domain = "";
    OperatorSetIdProto.prototype.version = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
    OperatorSetIdProto.create = function create4(properties) {
      return new OperatorSetIdProto(properties);
    };
    OperatorSetIdProto.encode = function encode(message, writer2) {
      if (!writer2)
        writer2 = $Writer.create();
      if (message.domain != null && message.hasOwnProperty("domain"))
        writer2.uint32(10).string(message.domain);
      if (message.version != null && message.hasOwnProperty("version"))
        writer2.uint32(16).int64(message.version);
      return writer2;
    };
    OperatorSetIdProto.encodeDelimited = function encodeDelimited(message, writer2) {
      return this.encode(message, writer2).ldelim();
    };
    OperatorSetIdProto.decode = function decode(reader2, length2) {
      if (!(reader2 instanceof $Reader))
        reader2 = $Reader.create(reader2);
      var end2 = length2 === void 0 ? reader2.len : reader2.pos + length2, message = new $root.onnx.OperatorSetIdProto();
      while (reader2.pos < end2) {
        var tag = reader2.uint32();
        switch (tag >>> 3) {
          case 1:
            message.domain = reader2.string();
            break;
          case 2:
            message.version = reader2.int64();
            break;
          default:
            reader2.skipType(tag & 7);
            break;
        }
      }
      return message;
    };
    OperatorSetIdProto.decodeDelimited = function decodeDelimited(reader2) {
      if (!(reader2 instanceof $Reader))
        reader2 = new $Reader(reader2);
      return this.decode(reader2, reader2.uint32());
    };
    OperatorSetIdProto.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected";
      if (message.domain != null && message.hasOwnProperty("domain")) {
        if (!$util.isString(message.domain))
          return "domain: string expected";
      }
      if (message.version != null && message.hasOwnProperty("version")) {
        if (!$util.isInteger(message.version) && !(message.version && $util.isInteger(message.version.low) && $util.isInteger(message.version.high)))
          return "version: integer|Long expected";
      }
      return null;
    };
    OperatorSetIdProto.fromObject = function fromObject(object) {
      if (object instanceof $root.onnx.OperatorSetIdProto)
        return object;
      var message = new $root.onnx.OperatorSetIdProto();
      if (object.domain != null)
        message.domain = String(object.domain);
      if (object.version != null) {
        if ($util.Long)
          (message.version = $util.Long.fromValue(object.version)).unsigned = false;
        else if (typeof object.version === "string")
          message.version = parseInt(object.version, 10);
        else if (typeof object.version === "number")
          message.version = object.version;
        else if (typeof object.version === "object")
          message.version = new $util.LongBits(object.version.low >>> 0, object.version.high >>> 0).toNumber();
      }
      return message;
    };
    OperatorSetIdProto.toObject = function toObject(message, options) {
      if (!options)
        options = {};
      var object = {};
      if (options.defaults) {
        object.domain = "";
        if ($util.Long) {
          var long2 = new $util.Long(0, 0, false);
          object.version = options.longs === String ? long2.toString() : options.longs === Number ? long2.toNumber() : long2;
        } else
          object.version = options.longs === String ? "0" : 0;
      }
      if (message.domain != null && message.hasOwnProperty("domain"))
        object.domain = message.domain;
      if (message.version != null && message.hasOwnProperty("version"))
        if (typeof message.version === "number")
          object.version = options.longs === String ? String(message.version) : message.version;
        else
          object.version = options.longs === String ? $util.Long.prototype.toString.call(message.version) : options.longs === Number ? new $util.LongBits(message.version.low >>> 0, message.version.high >>> 0).toNumber() : message.version;
      return object;
    };
    OperatorSetIdProto.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };
    return OperatorSetIdProto;
  }();
  return onnx2;
}();
var onnx = $root;
var ortGenerated = {};
var flatbuffers = {};
flatbuffers.Offset;
flatbuffers.Table;
flatbuffers.SIZEOF_SHORT = 2;
flatbuffers.SIZEOF_INT = 4;
flatbuffers.FILE_IDENTIFIER_LENGTH = 4;
flatbuffers.SIZE_PREFIX_LENGTH = 4;
flatbuffers.Encoding = {
  UTF8_BYTES: 1,
  UTF16_STRING: 2
};
flatbuffers.int32 = new Int32Array(2);
flatbuffers.float32 = new Float32Array(flatbuffers.int32.buffer);
flatbuffers.float64 = new Float64Array(flatbuffers.int32.buffer);
flatbuffers.isLittleEndian = new Uint16Array(new Uint8Array([1, 0]).buffer)[0] === 1;
flatbuffers.Long = function(low, high) {
  this.low = low | 0;
  this.high = high | 0;
};
flatbuffers.Long.create = function(low, high) {
  return low == 0 && high == 0 ? flatbuffers.Long.ZERO : new flatbuffers.Long(low, high);
};
flatbuffers.Long.prototype.toFloat64 = function() {
  return (this.low >>> 0) + this.high * 4294967296;
};
flatbuffers.Long.prototype.equals = function(other) {
  return this.low == other.low && this.high == other.high;
};
flatbuffers.Long.ZERO = new flatbuffers.Long(0, 0);
flatbuffers.Builder = function(opt_initial_size) {
  if (!opt_initial_size) {
    var initial_size = 1024;
  } else {
    var initial_size = opt_initial_size;
  }
  this.bb = flatbuffers.ByteBuffer.allocate(initial_size);
  this.space = initial_size;
  this.minalign = 1;
  this.vtable = null;
  this.vtable_in_use = 0;
  this.isNested = false;
  this.object_start = 0;
  this.vtables = [];
  this.vector_num_elems = 0;
  this.force_defaults = false;
};
flatbuffers.Builder.prototype.clear = function() {
  this.bb.clear();
  this.space = this.bb.capacity();
  this.minalign = 1;
  this.vtable = null;
  this.vtable_in_use = 0;
  this.isNested = false;
  this.object_start = 0;
  this.vtables = [];
  this.vector_num_elems = 0;
  this.force_defaults = false;
};
flatbuffers.Builder.prototype.forceDefaults = function(forceDefaults) {
  this.force_defaults = forceDefaults;
};
flatbuffers.Builder.prototype.dataBuffer = function() {
  return this.bb;
};
flatbuffers.Builder.prototype.asUint8Array = function() {
  return this.bb.bytes().subarray(this.bb.position(), this.bb.position() + this.offset());
};
flatbuffers.Builder.prototype.prep = function(size, additional_bytes) {
  if (size > this.minalign) {
    this.minalign = size;
  }
  var align_size = ~(this.bb.capacity() - this.space + additional_bytes) + 1 & size - 1;
  while (this.space < align_size + size + additional_bytes) {
    var old_buf_size = this.bb.capacity();
    this.bb = flatbuffers.Builder.growByteBuffer(this.bb);
    this.space += this.bb.capacity() - old_buf_size;
  }
  this.pad(align_size);
};
flatbuffers.Builder.prototype.pad = function(byte_size) {
  for (var i = 0; i < byte_size; i++) {
    this.bb.writeInt8(--this.space, 0);
  }
};
flatbuffers.Builder.prototype.writeInt8 = function(value) {
  this.bb.writeInt8(this.space -= 1, value);
};
flatbuffers.Builder.prototype.writeInt16 = function(value) {
  this.bb.writeInt16(this.space -= 2, value);
};
flatbuffers.Builder.prototype.writeInt32 = function(value) {
  this.bb.writeInt32(this.space -= 4, value);
};
flatbuffers.Builder.prototype.writeInt64 = function(value) {
  this.bb.writeInt64(this.space -= 8, value);
};
flatbuffers.Builder.prototype.writeFloat32 = function(value) {
  this.bb.writeFloat32(this.space -= 4, value);
};
flatbuffers.Builder.prototype.writeFloat64 = function(value) {
  this.bb.writeFloat64(this.space -= 8, value);
};
flatbuffers.Builder.prototype.addInt8 = function(value) {
  this.prep(1, 0);
  this.writeInt8(value);
};
flatbuffers.Builder.prototype.addInt16 = function(value) {
  this.prep(2, 0);
  this.writeInt16(value);
};
flatbuffers.Builder.prototype.addInt32 = function(value) {
  this.prep(4, 0);
  this.writeInt32(value);
};
flatbuffers.Builder.prototype.addInt64 = function(value) {
  this.prep(8, 0);
  this.writeInt64(value);
};
flatbuffers.Builder.prototype.addFloat32 = function(value) {
  this.prep(4, 0);
  this.writeFloat32(value);
};
flatbuffers.Builder.prototype.addFloat64 = function(value) {
  this.prep(8, 0);
  this.writeFloat64(value);
};
flatbuffers.Builder.prototype.addFieldInt8 = function(voffset, value, defaultValue) {
  if (this.force_defaults || value != defaultValue) {
    this.addInt8(value);
    this.slot(voffset);
  }
};
flatbuffers.Builder.prototype.addFieldInt16 = function(voffset, value, defaultValue) {
  if (this.force_defaults || value != defaultValue) {
    this.addInt16(value);
    this.slot(voffset);
  }
};
flatbuffers.Builder.prototype.addFieldInt32 = function(voffset, value, defaultValue) {
  if (this.force_defaults || value != defaultValue) {
    this.addInt32(value);
    this.slot(voffset);
  }
};
flatbuffers.Builder.prototype.addFieldInt64 = function(voffset, value, defaultValue) {
  if (this.force_defaults || !value.equals(defaultValue)) {
    this.addInt64(value);
    this.slot(voffset);
  }
};
flatbuffers.Builder.prototype.addFieldFloat32 = function(voffset, value, defaultValue) {
  if (this.force_defaults || value != defaultValue) {
    this.addFloat32(value);
    this.slot(voffset);
  }
};
flatbuffers.Builder.prototype.addFieldFloat64 = function(voffset, value, defaultValue) {
  if (this.force_defaults || value != defaultValue) {
    this.addFloat64(value);
    this.slot(voffset);
  }
};
flatbuffers.Builder.prototype.addFieldOffset = function(voffset, value, defaultValue) {
  if (this.force_defaults || value != defaultValue) {
    this.addOffset(value);
    this.slot(voffset);
  }
};
flatbuffers.Builder.prototype.addFieldStruct = function(voffset, value, defaultValue) {
  if (value != defaultValue) {
    this.nested(value);
    this.slot(voffset);
  }
};
flatbuffers.Builder.prototype.nested = function(obj) {
  if (obj != this.offset()) {
    throw new Error("FlatBuffers: struct must be serialized inline.");
  }
};
flatbuffers.Builder.prototype.notNested = function() {
  if (this.isNested) {
    throw new Error("FlatBuffers: object serialization must not be nested.");
  }
};
flatbuffers.Builder.prototype.slot = function(voffset) {
  this.vtable[voffset] = this.offset();
};
flatbuffers.Builder.prototype.offset = function() {
  return this.bb.capacity() - this.space;
};
flatbuffers.Builder.growByteBuffer = function(bb) {
  var old_buf_size = bb.capacity();
  if (old_buf_size & 3221225472) {
    throw new Error("FlatBuffers: cannot grow buffer beyond 2 gigabytes.");
  }
  var new_buf_size = old_buf_size << 1;
  var nbb = flatbuffers.ByteBuffer.allocate(new_buf_size);
  nbb.setPosition(new_buf_size - old_buf_size);
  nbb.bytes().set(bb.bytes(), new_buf_size - old_buf_size);
  return nbb;
};
flatbuffers.Builder.prototype.addOffset = function(offset) {
  this.prep(flatbuffers.SIZEOF_INT, 0);
  this.writeInt32(this.offset() - offset + flatbuffers.SIZEOF_INT);
};
flatbuffers.Builder.prototype.startObject = function(numfields) {
  this.notNested();
  if (this.vtable == null) {
    this.vtable = [];
  }
  this.vtable_in_use = numfields;
  for (var i = 0; i < numfields; i++) {
    this.vtable[i] = 0;
  }
  this.isNested = true;
  this.object_start = this.offset();
};
flatbuffers.Builder.prototype.endObject = function() {
  if (this.vtable == null || !this.isNested) {
    throw new Error("FlatBuffers: endObject called without startObject");
  }
  this.addInt32(0);
  var vtableloc = this.offset();
  var i = this.vtable_in_use - 1;
  for (; i >= 0 && this.vtable[i] == 0; i--) {
  }
  var trimmed_size = i + 1;
  for (; i >= 0; i--) {
    this.addInt16(this.vtable[i] != 0 ? vtableloc - this.vtable[i] : 0);
  }
  var standard_fields = 2;
  this.addInt16(vtableloc - this.object_start);
  var len = (trimmed_size + standard_fields) * flatbuffers.SIZEOF_SHORT;
  this.addInt16(len);
  var existing_vtable = 0;
  var vt1 = this.space;
  outer_loop:
    for (i = 0; i < this.vtables.length; i++) {
      var vt2 = this.bb.capacity() - this.vtables[i];
      if (len == this.bb.readInt16(vt2)) {
        for (var j = flatbuffers.SIZEOF_SHORT; j < len; j += flatbuffers.SIZEOF_SHORT) {
          if (this.bb.readInt16(vt1 + j) != this.bb.readInt16(vt2 + j)) {
            continue outer_loop;
          }
        }
        existing_vtable = this.vtables[i];
        break;
      }
    }
  if (existing_vtable) {
    this.space = this.bb.capacity() - vtableloc;
    this.bb.writeInt32(this.space, existing_vtable - vtableloc);
  } else {
    this.vtables.push(this.offset());
    this.bb.writeInt32(this.bb.capacity() - vtableloc, this.offset() - vtableloc);
  }
  this.isNested = false;
  return vtableloc;
};
flatbuffers.Builder.prototype.finish = function(root_table, opt_file_identifier, opt_size_prefix) {
  var size_prefix = opt_size_prefix ? flatbuffers.SIZE_PREFIX_LENGTH : 0;
  if (opt_file_identifier) {
    var file_identifier = opt_file_identifier;
    this.prep(this.minalign, flatbuffers.SIZEOF_INT + flatbuffers.FILE_IDENTIFIER_LENGTH + size_prefix);
    if (file_identifier.length != flatbuffers.FILE_IDENTIFIER_LENGTH) {
      throw new Error("FlatBuffers: file identifier must be length " + flatbuffers.FILE_IDENTIFIER_LENGTH);
    }
    for (var i = flatbuffers.FILE_IDENTIFIER_LENGTH - 1; i >= 0; i--) {
      this.writeInt8(file_identifier.charCodeAt(i));
    }
  }
  this.prep(this.minalign, flatbuffers.SIZEOF_INT + size_prefix);
  this.addOffset(root_table);
  if (size_prefix) {
    this.addInt32(this.bb.capacity() - this.space);
  }
  this.bb.setPosition(this.space);
};
flatbuffers.Builder.prototype.finishSizePrefixed = function(root_table, opt_file_identifier) {
  this.finish(root_table, opt_file_identifier, true);
};
flatbuffers.Builder.prototype.requiredField = function(table, field) {
  var table_start = this.bb.capacity() - table;
  var vtable_start = table_start - this.bb.readInt32(table_start);
  var ok = this.bb.readInt16(vtable_start + field) != 0;
  if (!ok) {
    throw new Error("FlatBuffers: field " + field + " must be set");
  }
};
flatbuffers.Builder.prototype.startVector = function(elem_size, num_elems, alignment) {
  this.notNested();
  this.vector_num_elems = num_elems;
  this.prep(flatbuffers.SIZEOF_INT, elem_size * num_elems);
  this.prep(alignment, elem_size * num_elems);
};
flatbuffers.Builder.prototype.endVector = function() {
  this.writeInt32(this.vector_num_elems);
  return this.offset();
};
flatbuffers.Builder.prototype.createString = function(s) {
  if (s instanceof Uint8Array) {
    var utf82 = s;
  } else {
    var utf82 = [];
    var i = 0;
    while (i < s.length) {
      var codePoint;
      var a = s.charCodeAt(i++);
      if (a < 55296 || a >= 56320) {
        codePoint = a;
      } else {
        var b = s.charCodeAt(i++);
        codePoint = (a << 10) + b + (65536 - (55296 << 10) - 56320);
      }
      if (codePoint < 128) {
        utf82.push(codePoint);
      } else {
        if (codePoint < 2048) {
          utf82.push(codePoint >> 6 & 31 | 192);
        } else {
          if (codePoint < 65536) {
            utf82.push(codePoint >> 12 & 15 | 224);
          } else {
            utf82.push(codePoint >> 18 & 7 | 240, codePoint >> 12 & 63 | 128);
          }
          utf82.push(codePoint >> 6 & 63 | 128);
        }
        utf82.push(codePoint & 63 | 128);
      }
    }
  }
  this.addInt8(0);
  this.startVector(1, utf82.length, 1);
  this.bb.setPosition(this.space -= utf82.length);
  for (var i = 0, offset = this.space, bytes = this.bb.bytes(); i < utf82.length; i++) {
    bytes[offset++] = utf82[i];
  }
  return this.endVector();
};
flatbuffers.Builder.prototype.createLong = function(low, high) {
  return flatbuffers.Long.create(low, high);
};
flatbuffers.ByteBuffer = function(bytes) {
  this.bytes_ = bytes;
  this.position_ = 0;
};
flatbuffers.ByteBuffer.allocate = function(byte_size) {
  return new flatbuffers.ByteBuffer(new Uint8Array(byte_size));
};
flatbuffers.ByteBuffer.prototype.clear = function() {
  this.position_ = 0;
};
flatbuffers.ByteBuffer.prototype.bytes = function() {
  return this.bytes_;
};
flatbuffers.ByteBuffer.prototype.position = function() {
  return this.position_;
};
flatbuffers.ByteBuffer.prototype.setPosition = function(position) {
  this.position_ = position;
};
flatbuffers.ByteBuffer.prototype.capacity = function() {
  return this.bytes_.length;
};
flatbuffers.ByteBuffer.prototype.readInt8 = function(offset) {
  return this.readUint8(offset) << 24 >> 24;
};
flatbuffers.ByteBuffer.prototype.readUint8 = function(offset) {
  return this.bytes_[offset];
};
flatbuffers.ByteBuffer.prototype.readInt16 = function(offset) {
  return this.readUint16(offset) << 16 >> 16;
};
flatbuffers.ByteBuffer.prototype.readUint16 = function(offset) {
  return this.bytes_[offset] | this.bytes_[offset + 1] << 8;
};
flatbuffers.ByteBuffer.prototype.readInt32 = function(offset) {
  return this.bytes_[offset] | this.bytes_[offset + 1] << 8 | this.bytes_[offset + 2] << 16 | this.bytes_[offset + 3] << 24;
};
flatbuffers.ByteBuffer.prototype.readUint32 = function(offset) {
  return this.readInt32(offset) >>> 0;
};
flatbuffers.ByteBuffer.prototype.readInt64 = function(offset) {
  return new flatbuffers.Long(this.readInt32(offset), this.readInt32(offset + 4));
};
flatbuffers.ByteBuffer.prototype.readUint64 = function(offset) {
  return new flatbuffers.Long(this.readUint32(offset), this.readUint32(offset + 4));
};
flatbuffers.ByteBuffer.prototype.readFloat32 = function(offset) {
  flatbuffers.int32[0] = this.readInt32(offset);
  return flatbuffers.float32[0];
};
flatbuffers.ByteBuffer.prototype.readFloat64 = function(offset) {
  flatbuffers.int32[flatbuffers.isLittleEndian ? 0 : 1] = this.readInt32(offset);
  flatbuffers.int32[flatbuffers.isLittleEndian ? 1 : 0] = this.readInt32(offset + 4);
  return flatbuffers.float64[0];
};
flatbuffers.ByteBuffer.prototype.writeInt8 = function(offset, value) {
  this.bytes_[offset] = value;
};
flatbuffers.ByteBuffer.prototype.writeUint8 = function(offset, value) {
  this.bytes_[offset] = value;
};
flatbuffers.ByteBuffer.prototype.writeInt16 = function(offset, value) {
  this.bytes_[offset] = value;
  this.bytes_[offset + 1] = value >> 8;
};
flatbuffers.ByteBuffer.prototype.writeUint16 = function(offset, value) {
  this.bytes_[offset] = value;
  this.bytes_[offset + 1] = value >> 8;
};
flatbuffers.ByteBuffer.prototype.writeInt32 = function(offset, value) {
  this.bytes_[offset] = value;
  this.bytes_[offset + 1] = value >> 8;
  this.bytes_[offset + 2] = value >> 16;
  this.bytes_[offset + 3] = value >> 24;
};
flatbuffers.ByteBuffer.prototype.writeUint32 = function(offset, value) {
  this.bytes_[offset] = value;
  this.bytes_[offset + 1] = value >> 8;
  this.bytes_[offset + 2] = value >> 16;
  this.bytes_[offset + 3] = value >> 24;
};
flatbuffers.ByteBuffer.prototype.writeInt64 = function(offset, value) {
  this.writeInt32(offset, value.low);
  this.writeInt32(offset + 4, value.high);
};
flatbuffers.ByteBuffer.prototype.writeUint64 = function(offset, value) {
  this.writeUint32(offset, value.low);
  this.writeUint32(offset + 4, value.high);
};
flatbuffers.ByteBuffer.prototype.writeFloat32 = function(offset, value) {
  flatbuffers.float32[0] = value;
  this.writeInt32(offset, flatbuffers.int32[0]);
};
flatbuffers.ByteBuffer.prototype.writeFloat64 = function(offset, value) {
  flatbuffers.float64[0] = value;
  this.writeInt32(offset, flatbuffers.int32[flatbuffers.isLittleEndian ? 0 : 1]);
  this.writeInt32(offset + 4, flatbuffers.int32[flatbuffers.isLittleEndian ? 1 : 0]);
};
flatbuffers.ByteBuffer.prototype.getBufferIdentifier = function() {
  if (this.bytes_.length < this.position_ + flatbuffers.SIZEOF_INT + flatbuffers.FILE_IDENTIFIER_LENGTH) {
    throw new Error("FlatBuffers: ByteBuffer is too short to contain an identifier.");
  }
  var result = "";
  for (var i = 0; i < flatbuffers.FILE_IDENTIFIER_LENGTH; i++) {
    result += String.fromCharCode(this.readInt8(this.position_ + flatbuffers.SIZEOF_INT + i));
  }
  return result;
};
flatbuffers.ByteBuffer.prototype.__offset = function(bb_pos, vtable_offset) {
  var vtable = bb_pos - this.readInt32(bb_pos);
  return vtable_offset < this.readInt16(vtable) ? this.readInt16(vtable + vtable_offset) : 0;
};
flatbuffers.ByteBuffer.prototype.__union = function(t, offset) {
  t.bb_pos = offset + this.readInt32(offset);
  t.bb = this;
  return t;
};
flatbuffers.ByteBuffer.prototype.__string = function(offset, opt_encoding) {
  offset += this.readInt32(offset);
  var length2 = this.readInt32(offset);
  var result = "";
  var i = 0;
  offset += flatbuffers.SIZEOF_INT;
  if (opt_encoding === flatbuffers.Encoding.UTF8_BYTES) {
    return this.bytes_.subarray(offset, offset + length2);
  }
  while (i < length2) {
    var codePoint;
    var a = this.readUint8(offset + i++);
    if (a < 192) {
      codePoint = a;
    } else {
      var b = this.readUint8(offset + i++);
      if (a < 224) {
        codePoint = (a & 31) << 6 | b & 63;
      } else {
        var c = this.readUint8(offset + i++);
        if (a < 240) {
          codePoint = (a & 15) << 12 | (b & 63) << 6 | c & 63;
        } else {
          var d = this.readUint8(offset + i++);
          codePoint = (a & 7) << 18 | (b & 63) << 12 | (c & 63) << 6 | d & 63;
        }
      }
    }
    if (codePoint < 65536) {
      result += String.fromCharCode(codePoint);
    } else {
      codePoint -= 65536;
      result += String.fromCharCode((codePoint >> 10) + 55296, (codePoint & (1 << 10) - 1) + 56320);
    }
  }
  return result;
};
flatbuffers.ByteBuffer.prototype.__indirect = function(offset) {
  return offset + this.readInt32(offset);
};
flatbuffers.ByteBuffer.prototype.__vector = function(offset) {
  return offset + this.readInt32(offset) + flatbuffers.SIZEOF_INT;
};
flatbuffers.ByteBuffer.prototype.__vector_len = function(offset) {
  return this.readInt32(offset + this.readInt32(offset));
};
flatbuffers.ByteBuffer.prototype.__has_identifier = function(ident) {
  if (ident.length != flatbuffers.FILE_IDENTIFIER_LENGTH) {
    throw new Error("FlatBuffers: file identifier must be length " + flatbuffers.FILE_IDENTIFIER_LENGTH);
  }
  for (var i = 0; i < flatbuffers.FILE_IDENTIFIER_LENGTH; i++) {
    if (ident.charCodeAt(i) != this.readInt8(this.position_ + flatbuffers.SIZEOF_INT + i)) {
      return false;
    }
  }
  return true;
};
flatbuffers.ByteBuffer.prototype.createLong = function(low, high) {
  return flatbuffers.Long.create(low, high);
};
var flatbuffers$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  flatbuffers
}, Symbol.toStringTag, { value: "Module" }));
var require$$0 = /* @__PURE__ */ getAugmentedNamespace(flatbuffers$1);
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.onnxruntime = void 0;
  const flatbuffers_12 = require$$0;
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        (function(AttributeType) {
          AttributeType[AttributeType["UNDEFINED"] = 0] = "UNDEFINED";
          AttributeType[AttributeType["FLOAT"] = 1] = "FLOAT";
          AttributeType[AttributeType["INT"] = 2] = "INT";
          AttributeType[AttributeType["STRING"] = 3] = "STRING";
          AttributeType[AttributeType["TENSOR"] = 4] = "TENSOR";
          AttributeType[AttributeType["GRAPH"] = 5] = "GRAPH";
          AttributeType[AttributeType["FLOATS"] = 6] = "FLOATS";
          AttributeType[AttributeType["INTS"] = 7] = "INTS";
          AttributeType[AttributeType["STRINGS"] = 8] = "STRINGS";
          AttributeType[AttributeType["TENSORS"] = 9] = "TENSORS";
          AttributeType[AttributeType["GRAPHS"] = 10] = "GRAPHS";
          AttributeType[AttributeType["SPARSE_TENSOR"] = 11] = "SPARSE_TENSOR";
          AttributeType[AttributeType["SPARSE_TENSORS"] = 12] = "SPARSE_TENSORS";
        })(fbs.AttributeType || (fbs.AttributeType = {}));
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        (function(DimensionValueType) {
          DimensionValueType[DimensionValueType["UNKNOWN"] = 0] = "UNKNOWN";
          DimensionValueType[DimensionValueType["VALUE"] = 1] = "VALUE";
          DimensionValueType[DimensionValueType["PARAM"] = 2] = "PARAM";
        })(fbs.DimensionValueType || (fbs.DimensionValueType = {}));
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        (function(TensorDataType) {
          TensorDataType[TensorDataType["UNDEFINED"] = 0] = "UNDEFINED";
          TensorDataType[TensorDataType["FLOAT"] = 1] = "FLOAT";
          TensorDataType[TensorDataType["UINT8"] = 2] = "UINT8";
          TensorDataType[TensorDataType["INT8"] = 3] = "INT8";
          TensorDataType[TensorDataType["UINT16"] = 4] = "UINT16";
          TensorDataType[TensorDataType["INT16"] = 5] = "INT16";
          TensorDataType[TensorDataType["INT32"] = 6] = "INT32";
          TensorDataType[TensorDataType["INT64"] = 7] = "INT64";
          TensorDataType[TensorDataType["STRING"] = 8] = "STRING";
          TensorDataType[TensorDataType["BOOL"] = 9] = "BOOL";
          TensorDataType[TensorDataType["FLOAT16"] = 10] = "FLOAT16";
          TensorDataType[TensorDataType["DOUBLE"] = 11] = "DOUBLE";
          TensorDataType[TensorDataType["UINT32"] = 12] = "UINT32";
          TensorDataType[TensorDataType["UINT64"] = 13] = "UINT64";
          TensorDataType[TensorDataType["COMPLEX64"] = 14] = "COMPLEX64";
          TensorDataType[TensorDataType["COMPLEX128"] = 15] = "COMPLEX128";
          TensorDataType[TensorDataType["BFLOAT16"] = 16] = "BFLOAT16";
        })(fbs.TensorDataType || (fbs.TensorDataType = {}));
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        (function(NodeType) {
          NodeType[NodeType["Primitive"] = 0] = "Primitive";
          NodeType[NodeType["Fused"] = 1] = "Fused";
        })(fbs.NodeType || (fbs.NodeType = {}));
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        (function(TypeInfoValue) {
          TypeInfoValue[TypeInfoValue["NONE"] = 0] = "NONE";
          TypeInfoValue[TypeInfoValue["tensor_type"] = 1] = "tensor_type";
          TypeInfoValue[TypeInfoValue["sequence_type"] = 2] = "sequence_type";
          TypeInfoValue[TypeInfoValue["map_type"] = 3] = "map_type";
        })(fbs.TypeInfoValue || (fbs.TypeInfoValue = {}));
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class Shape {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsShape(bb, obj) {
            return (obj || new Shape()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsShape(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new Shape()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          dim(index, obj) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? (obj || new onnxruntime.experimental.fbs.Dimension()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
          }
          dimLength() {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          static startShape(builder) {
            builder.startObject(1);
          }
          static addDim(builder, dimOffset) {
            builder.addFieldOffset(0, dimOffset, 0);
          }
          static createDimVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startDimVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static endShape(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createShape(builder, dimOffset) {
            Shape.startShape(builder);
            Shape.addDim(builder, dimOffset);
            return Shape.endShape(builder);
          }
        }
        fbs.Shape = Shape;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class Dimension {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsDimension(bb, obj) {
            return (obj || new Dimension()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsDimension(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new Dimension()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          value(obj) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? (obj || new onnxruntime.experimental.fbs.DimensionValue()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
          }
          denotation(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          static startDimension(builder) {
            builder.startObject(2);
          }
          static addValue(builder, valueOffset) {
            builder.addFieldOffset(0, valueOffset, 0);
          }
          static addDenotation(builder, denotationOffset) {
            builder.addFieldOffset(1, denotationOffset, 0);
          }
          static endDimension(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createDimension(builder, valueOffset, denotationOffset) {
            Dimension.startDimension(builder);
            Dimension.addValue(builder, valueOffset);
            Dimension.addDenotation(builder, denotationOffset);
            return Dimension.endDimension(builder);
          }
        }
        fbs.Dimension = Dimension;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class DimensionValue {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsDimensionValue(bb, obj) {
            return (obj || new DimensionValue()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsDimensionValue(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new DimensionValue()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          dimType() {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.readInt8(this.bb_pos + offset) : onnxruntime.experimental.fbs.DimensionValueType.UNKNOWN;
          }
          dimValue() {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.readInt64(this.bb_pos + offset) : this.bb.createLong(0, 0);
          }
          dimParam(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          static startDimensionValue(builder) {
            builder.startObject(3);
          }
          static addDimType(builder, dimType) {
            builder.addFieldInt8(0, dimType, onnxruntime.experimental.fbs.DimensionValueType.UNKNOWN);
          }
          static addDimValue(builder, dimValue) {
            builder.addFieldInt64(1, dimValue, builder.createLong(0, 0));
          }
          static addDimParam(builder, dimParamOffset) {
            builder.addFieldOffset(2, dimParamOffset, 0);
          }
          static endDimensionValue(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createDimensionValue(builder, dimType, dimValue, dimParamOffset) {
            DimensionValue.startDimensionValue(builder);
            DimensionValue.addDimType(builder, dimType);
            DimensionValue.addDimValue(builder, dimValue);
            DimensionValue.addDimParam(builder, dimParamOffset);
            return DimensionValue.endDimensionValue(builder);
          }
        }
        fbs.DimensionValue = DimensionValue;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class TensorTypeAndShape {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsTensorTypeAndShape(bb, obj) {
            return (obj || new TensorTypeAndShape()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsTensorTypeAndShape(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new TensorTypeAndShape()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          elemType() {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.readInt32(this.bb_pos + offset) : onnxruntime.experimental.fbs.TensorDataType.UNDEFINED;
          }
          shape(obj) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? (obj || new onnxruntime.experimental.fbs.Shape()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
          }
          static startTensorTypeAndShape(builder) {
            builder.startObject(2);
          }
          static addElemType(builder, elemType) {
            builder.addFieldInt32(0, elemType, onnxruntime.experimental.fbs.TensorDataType.UNDEFINED);
          }
          static addShape(builder, shapeOffset) {
            builder.addFieldOffset(1, shapeOffset, 0);
          }
          static endTensorTypeAndShape(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createTensorTypeAndShape(builder, elemType, shapeOffset) {
            TensorTypeAndShape.startTensorTypeAndShape(builder);
            TensorTypeAndShape.addElemType(builder, elemType);
            TensorTypeAndShape.addShape(builder, shapeOffset);
            return TensorTypeAndShape.endTensorTypeAndShape(builder);
          }
        }
        fbs.TensorTypeAndShape = TensorTypeAndShape;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class MapType {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsMapType(bb, obj) {
            return (obj || new MapType()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsMapType(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new MapType()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          keyType() {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.readInt32(this.bb_pos + offset) : onnxruntime.experimental.fbs.TensorDataType.UNDEFINED;
          }
          valueType(obj) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? (obj || new onnxruntime.experimental.fbs.TypeInfo()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
          }
          static startMapType(builder) {
            builder.startObject(2);
          }
          static addKeyType(builder, keyType) {
            builder.addFieldInt32(0, keyType, onnxruntime.experimental.fbs.TensorDataType.UNDEFINED);
          }
          static addValueType(builder, valueTypeOffset) {
            builder.addFieldOffset(1, valueTypeOffset, 0);
          }
          static endMapType(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createMapType(builder, keyType, valueTypeOffset) {
            MapType.startMapType(builder);
            MapType.addKeyType(builder, keyType);
            MapType.addValueType(builder, valueTypeOffset);
            return MapType.endMapType(builder);
          }
        }
        fbs.MapType = MapType;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class SequenceType {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsSequenceType(bb, obj) {
            return (obj || new SequenceType()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsSequenceType(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new SequenceType()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          elemType(obj) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? (obj || new onnxruntime.experimental.fbs.TypeInfo()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
          }
          static startSequenceType(builder) {
            builder.startObject(1);
          }
          static addElemType(builder, elemTypeOffset) {
            builder.addFieldOffset(0, elemTypeOffset, 0);
          }
          static endSequenceType(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createSequenceType(builder, elemTypeOffset) {
            SequenceType.startSequenceType(builder);
            SequenceType.addElemType(builder, elemTypeOffset);
            return SequenceType.endSequenceType(builder);
          }
        }
        fbs.SequenceType = SequenceType;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class EdgeEnd {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          nodeIndex() {
            return this.bb.readUint32(this.bb_pos);
          }
          srcArgIndex() {
            return this.bb.readInt32(this.bb_pos + 4);
          }
          dstArgIndex() {
            return this.bb.readInt32(this.bb_pos + 8);
          }
          static createEdgeEnd(builder, node_index, src_arg_index, dst_arg_index) {
            builder.prep(4, 12);
            builder.writeInt32(dst_arg_index);
            builder.writeInt32(src_arg_index);
            builder.writeInt32(node_index);
            return builder.offset();
          }
        }
        fbs.EdgeEnd = EdgeEnd;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class NodeEdge {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsNodeEdge(bb, obj) {
            return (obj || new NodeEdge()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsNodeEdge(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new NodeEdge()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          nodeIndex() {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
          }
          inputEdges(index, obj) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? (obj || new onnxruntime.experimental.fbs.EdgeEnd()).__init(this.bb.__vector(this.bb_pos + offset) + index * 12, this.bb) : null;
          }
          inputEdgesLength() {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          outputEdges(index, obj) {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? (obj || new onnxruntime.experimental.fbs.EdgeEnd()).__init(this.bb.__vector(this.bb_pos + offset) + index * 12, this.bb) : null;
          }
          outputEdgesLength() {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          static startNodeEdge(builder) {
            builder.startObject(3);
          }
          static addNodeIndex(builder, nodeIndex) {
            builder.addFieldInt32(0, nodeIndex, 0);
          }
          static addInputEdges(builder, inputEdgesOffset) {
            builder.addFieldOffset(1, inputEdgesOffset, 0);
          }
          static startInputEdgesVector(builder, numElems) {
            builder.startVector(12, numElems, 4);
          }
          static addOutputEdges(builder, outputEdgesOffset) {
            builder.addFieldOffset(2, outputEdgesOffset, 0);
          }
          static startOutputEdgesVector(builder, numElems) {
            builder.startVector(12, numElems, 4);
          }
          static endNodeEdge(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createNodeEdge(builder, nodeIndex, inputEdgesOffset, outputEdgesOffset) {
            NodeEdge.startNodeEdge(builder);
            NodeEdge.addNodeIndex(builder, nodeIndex);
            NodeEdge.addInputEdges(builder, inputEdgesOffset);
            NodeEdge.addOutputEdges(builder, outputEdgesOffset);
            return NodeEdge.endNodeEdge(builder);
          }
        }
        fbs.NodeEdge = NodeEdge;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class Node2 {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsNode(bb, obj) {
            return (obj || new Node2()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsNode(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new Node2()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          name(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          docString(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          domain(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          sinceVersion() {
            let offset = this.bb.__offset(this.bb_pos, 10);
            return offset ? this.bb.readInt32(this.bb_pos + offset) : 0;
          }
          index() {
            let offset = this.bb.__offset(this.bb_pos, 12);
            return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
          }
          opType(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 14);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          type() {
            let offset = this.bb.__offset(this.bb_pos, 16);
            return offset ? this.bb.readInt32(this.bb_pos + offset) : onnxruntime.experimental.fbs.NodeType.Primitive;
          }
          executionProviderType(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 18);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          inputs(index, optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 20);
            return offset ? this.bb.__string(this.bb.__vector(this.bb_pos + offset) + index * 4, optionalEncoding) : null;
          }
          inputsLength() {
            let offset = this.bb.__offset(this.bb_pos, 20);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          outputs(index, optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 22);
            return offset ? this.bb.__string(this.bb.__vector(this.bb_pos + offset) + index * 4, optionalEncoding) : null;
          }
          outputsLength() {
            let offset = this.bb.__offset(this.bb_pos, 22);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          attributes(index, obj) {
            let offset = this.bb.__offset(this.bb_pos, 24);
            return offset ? (obj || new onnxruntime.experimental.fbs.Attribute()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
          }
          attributesLength() {
            let offset = this.bb.__offset(this.bb_pos, 24);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          inputArgCounts(index) {
            let offset = this.bb.__offset(this.bb_pos, 26);
            return offset ? this.bb.readInt32(this.bb.__vector(this.bb_pos + offset) + index * 4) : 0;
          }
          inputArgCountsLength() {
            let offset = this.bb.__offset(this.bb_pos, 26);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          inputArgCountsArray() {
            let offset = this.bb.__offset(this.bb_pos, 26);
            return offset ? new Int32Array(this.bb.bytes().buffer, this.bb.bytes().byteOffset + this.bb.__vector(this.bb_pos + offset), this.bb.__vector_len(this.bb_pos + offset)) : null;
          }
          implicitInputs(index, optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 28);
            return offset ? this.bb.__string(this.bb.__vector(this.bb_pos + offset) + index * 4, optionalEncoding) : null;
          }
          implicitInputsLength() {
            let offset = this.bb.__offset(this.bb_pos, 28);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          static startNode(builder) {
            builder.startObject(13);
          }
          static addName(builder, nameOffset) {
            builder.addFieldOffset(0, nameOffset, 0);
          }
          static addDocString(builder, docStringOffset) {
            builder.addFieldOffset(1, docStringOffset, 0);
          }
          static addDomain(builder, domainOffset) {
            builder.addFieldOffset(2, domainOffset, 0);
          }
          static addSinceVersion(builder, sinceVersion) {
            builder.addFieldInt32(3, sinceVersion, 0);
          }
          static addIndex(builder, index) {
            builder.addFieldInt32(4, index, 0);
          }
          static addOpType(builder, opTypeOffset) {
            builder.addFieldOffset(5, opTypeOffset, 0);
          }
          static addType(builder, type) {
            builder.addFieldInt32(6, type, onnxruntime.experimental.fbs.NodeType.Primitive);
          }
          static addExecutionProviderType(builder, executionProviderTypeOffset) {
            builder.addFieldOffset(7, executionProviderTypeOffset, 0);
          }
          static addInputs(builder, inputsOffset) {
            builder.addFieldOffset(8, inputsOffset, 0);
          }
          static createInputsVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startInputsVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addOutputs(builder, outputsOffset) {
            builder.addFieldOffset(9, outputsOffset, 0);
          }
          static createOutputsVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startOutputsVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addAttributes(builder, attributesOffset) {
            builder.addFieldOffset(10, attributesOffset, 0);
          }
          static createAttributesVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startAttributesVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addInputArgCounts(builder, inputArgCountsOffset) {
            builder.addFieldOffset(11, inputArgCountsOffset, 0);
          }
          static createInputArgCountsVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addInt32(data[i]);
            }
            return builder.endVector();
          }
          static startInputArgCountsVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addImplicitInputs(builder, implicitInputsOffset) {
            builder.addFieldOffset(12, implicitInputsOffset, 0);
          }
          static createImplicitInputsVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startImplicitInputsVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static endNode(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createNode(builder, nameOffset, docStringOffset, domainOffset, sinceVersion, index, opTypeOffset, type, executionProviderTypeOffset, inputsOffset, outputsOffset, attributesOffset, inputArgCountsOffset, implicitInputsOffset) {
            Node2.startNode(builder);
            Node2.addName(builder, nameOffset);
            Node2.addDocString(builder, docStringOffset);
            Node2.addDomain(builder, domainOffset);
            Node2.addSinceVersion(builder, sinceVersion);
            Node2.addIndex(builder, index);
            Node2.addOpType(builder, opTypeOffset);
            Node2.addType(builder, type);
            Node2.addExecutionProviderType(builder, executionProviderTypeOffset);
            Node2.addInputs(builder, inputsOffset);
            Node2.addOutputs(builder, outputsOffset);
            Node2.addAttributes(builder, attributesOffset);
            Node2.addInputArgCounts(builder, inputArgCountsOffset);
            Node2.addImplicitInputs(builder, implicitInputsOffset);
            return Node2.endNode(builder);
          }
        }
        fbs.Node = Node2;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class ValueInfo {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsValueInfo(bb, obj) {
            return (obj || new ValueInfo()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsValueInfo(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new ValueInfo()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          name(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          docString(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          type(obj) {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? (obj || new onnxruntime.experimental.fbs.TypeInfo()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
          }
          static startValueInfo(builder) {
            builder.startObject(3);
          }
          static addName(builder, nameOffset) {
            builder.addFieldOffset(0, nameOffset, 0);
          }
          static addDocString(builder, docStringOffset) {
            builder.addFieldOffset(1, docStringOffset, 0);
          }
          static addType(builder, typeOffset) {
            builder.addFieldOffset(2, typeOffset, 0);
          }
          static endValueInfo(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createValueInfo(builder, nameOffset, docStringOffset, typeOffset) {
            ValueInfo.startValueInfo(builder);
            ValueInfo.addName(builder, nameOffset);
            ValueInfo.addDocString(builder, docStringOffset);
            ValueInfo.addType(builder, typeOffset);
            return ValueInfo.endValueInfo(builder);
          }
        }
        fbs.ValueInfo = ValueInfo;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class TypeInfo {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsTypeInfo(bb, obj) {
            return (obj || new TypeInfo()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsTypeInfo(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new TypeInfo()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          denotation(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          valueType() {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.readUint8(this.bb_pos + offset) : onnxruntime.experimental.fbs.TypeInfoValue.NONE;
          }
          value(obj) {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? this.bb.__union(obj, this.bb_pos + offset) : null;
          }
          static startTypeInfo(builder) {
            builder.startObject(3);
          }
          static addDenotation(builder, denotationOffset) {
            builder.addFieldOffset(0, denotationOffset, 0);
          }
          static addValueType(builder, valueType) {
            builder.addFieldInt8(1, valueType, onnxruntime.experimental.fbs.TypeInfoValue.NONE);
          }
          static addValue(builder, valueOffset) {
            builder.addFieldOffset(2, valueOffset, 0);
          }
          static endTypeInfo(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createTypeInfo(builder, denotationOffset, valueType, valueOffset) {
            TypeInfo.startTypeInfo(builder);
            TypeInfo.addDenotation(builder, denotationOffset);
            TypeInfo.addValueType(builder, valueType);
            TypeInfo.addValue(builder, valueOffset);
            return TypeInfo.endTypeInfo(builder);
          }
        }
        fbs.TypeInfo = TypeInfo;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class OperatorSetId {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsOperatorSetId(bb, obj) {
            return (obj || new OperatorSetId()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsOperatorSetId(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new OperatorSetId()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          domain(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          version() {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.readInt64(this.bb_pos + offset) : this.bb.createLong(0, 0);
          }
          static startOperatorSetId(builder) {
            builder.startObject(2);
          }
          static addDomain(builder, domainOffset) {
            builder.addFieldOffset(0, domainOffset, 0);
          }
          static addVersion(builder, version) {
            builder.addFieldInt64(1, version, builder.createLong(0, 0));
          }
          static endOperatorSetId(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createOperatorSetId(builder, domainOffset, version) {
            OperatorSetId.startOperatorSetId(builder);
            OperatorSetId.addDomain(builder, domainOffset);
            OperatorSetId.addVersion(builder, version);
            return OperatorSetId.endOperatorSetId(builder);
          }
        }
        fbs.OperatorSetId = OperatorSetId;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class Tensor2 {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsTensor(bb, obj) {
            return (obj || new Tensor2()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsTensor(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new Tensor2()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          name(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          docString(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          dims(index) {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? this.bb.readInt64(this.bb.__vector(this.bb_pos + offset) + index * 8) : this.bb.createLong(0, 0);
          }
          dimsLength() {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          dataType() {
            let offset = this.bb.__offset(this.bb_pos, 10);
            return offset ? this.bb.readInt32(this.bb_pos + offset) : onnxruntime.experimental.fbs.TensorDataType.UNDEFINED;
          }
          rawData(index) {
            let offset = this.bb.__offset(this.bb_pos, 12);
            return offset ? this.bb.readUint8(this.bb.__vector(this.bb_pos + offset) + index) : 0;
          }
          rawDataLength() {
            let offset = this.bb.__offset(this.bb_pos, 12);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          rawDataArray() {
            let offset = this.bb.__offset(this.bb_pos, 12);
            return offset ? new Uint8Array(this.bb.bytes().buffer, this.bb.bytes().byteOffset + this.bb.__vector(this.bb_pos + offset), this.bb.__vector_len(this.bb_pos + offset)) : null;
          }
          stringData(index, optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 14);
            return offset ? this.bb.__string(this.bb.__vector(this.bb_pos + offset) + index * 4, optionalEncoding) : null;
          }
          stringDataLength() {
            let offset = this.bb.__offset(this.bb_pos, 14);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          static startTensor(builder) {
            builder.startObject(6);
          }
          static addName(builder, nameOffset) {
            builder.addFieldOffset(0, nameOffset, 0);
          }
          static addDocString(builder, docStringOffset) {
            builder.addFieldOffset(1, docStringOffset, 0);
          }
          static addDims(builder, dimsOffset) {
            builder.addFieldOffset(2, dimsOffset, 0);
          }
          static createDimsVector(builder, data) {
            builder.startVector(8, data.length, 8);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addInt64(data[i]);
            }
            return builder.endVector();
          }
          static startDimsVector(builder, numElems) {
            builder.startVector(8, numElems, 8);
          }
          static addDataType(builder, dataType) {
            builder.addFieldInt32(3, dataType, onnxruntime.experimental.fbs.TensorDataType.UNDEFINED);
          }
          static addRawData(builder, rawDataOffset) {
            builder.addFieldOffset(4, rawDataOffset, 0);
          }
          static createRawDataVector(builder, data) {
            builder.startVector(1, data.length, 1);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addInt8(data[i]);
            }
            return builder.endVector();
          }
          static startRawDataVector(builder, numElems) {
            builder.startVector(1, numElems, 1);
          }
          static addStringData(builder, stringDataOffset) {
            builder.addFieldOffset(5, stringDataOffset, 0);
          }
          static createStringDataVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startStringDataVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static endTensor(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createTensor(builder, nameOffset, docStringOffset, dimsOffset, dataType, rawDataOffset, stringDataOffset) {
            Tensor2.startTensor(builder);
            Tensor2.addName(builder, nameOffset);
            Tensor2.addDocString(builder, docStringOffset);
            Tensor2.addDims(builder, dimsOffset);
            Tensor2.addDataType(builder, dataType);
            Tensor2.addRawData(builder, rawDataOffset);
            Tensor2.addStringData(builder, stringDataOffset);
            return Tensor2.endTensor(builder);
          }
        }
        fbs.Tensor = Tensor2;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class SparseTensor {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsSparseTensor(bb, obj) {
            return (obj || new SparseTensor()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsSparseTensor(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new SparseTensor()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          values(obj) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? (obj || new onnxruntime.experimental.fbs.Tensor()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
          }
          indices(obj) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? (obj || new onnxruntime.experimental.fbs.Tensor()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
          }
          dims(index) {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? this.bb.readInt64(this.bb.__vector(this.bb_pos + offset) + index * 8) : this.bb.createLong(0, 0);
          }
          dimsLength() {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          static startSparseTensor(builder) {
            builder.startObject(3);
          }
          static addValues(builder, valuesOffset) {
            builder.addFieldOffset(0, valuesOffset, 0);
          }
          static addIndices(builder, indicesOffset) {
            builder.addFieldOffset(1, indicesOffset, 0);
          }
          static addDims(builder, dimsOffset) {
            builder.addFieldOffset(2, dimsOffset, 0);
          }
          static createDimsVector(builder, data) {
            builder.startVector(8, data.length, 8);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addInt64(data[i]);
            }
            return builder.endVector();
          }
          static startDimsVector(builder, numElems) {
            builder.startVector(8, numElems, 8);
          }
          static endSparseTensor(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createSparseTensor(builder, valuesOffset, indicesOffset, dimsOffset) {
            SparseTensor.startSparseTensor(builder);
            SparseTensor.addValues(builder, valuesOffset);
            SparseTensor.addIndices(builder, indicesOffset);
            SparseTensor.addDims(builder, dimsOffset);
            return SparseTensor.endSparseTensor(builder);
          }
        }
        fbs.SparseTensor = SparseTensor;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class Attribute2 {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsAttribute(bb, obj) {
            return (obj || new Attribute2()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsAttribute(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new Attribute2()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          name(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          docString(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          type() {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? this.bb.readInt32(this.bb_pos + offset) : onnxruntime.experimental.fbs.AttributeType.UNDEFINED;
          }
          f() {
            let offset = this.bb.__offset(this.bb_pos, 10);
            return offset ? this.bb.readFloat32(this.bb_pos + offset) : 0;
          }
          i() {
            let offset = this.bb.__offset(this.bb_pos, 12);
            return offset ? this.bb.readInt64(this.bb_pos + offset) : this.bb.createLong(0, 0);
          }
          s(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 14);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          t(obj) {
            let offset = this.bb.__offset(this.bb_pos, 16);
            return offset ? (obj || new onnxruntime.experimental.fbs.Tensor()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
          }
          g(obj) {
            let offset = this.bb.__offset(this.bb_pos, 18);
            return offset ? (obj || new onnxruntime.experimental.fbs.Graph()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
          }
          floats(index) {
            let offset = this.bb.__offset(this.bb_pos, 20);
            return offset ? this.bb.readFloat32(this.bb.__vector(this.bb_pos + offset) + index * 4) : 0;
          }
          floatsLength() {
            let offset = this.bb.__offset(this.bb_pos, 20);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          floatsArray() {
            let offset = this.bb.__offset(this.bb_pos, 20);
            return offset ? new Float32Array(this.bb.bytes().buffer, this.bb.bytes().byteOffset + this.bb.__vector(this.bb_pos + offset), this.bb.__vector_len(this.bb_pos + offset)) : null;
          }
          ints(index) {
            let offset = this.bb.__offset(this.bb_pos, 22);
            return offset ? this.bb.readInt64(this.bb.__vector(this.bb_pos + offset) + index * 8) : this.bb.createLong(0, 0);
          }
          intsLength() {
            let offset = this.bb.__offset(this.bb_pos, 22);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          strings(index, optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 24);
            return offset ? this.bb.__string(this.bb.__vector(this.bb_pos + offset) + index * 4, optionalEncoding) : null;
          }
          stringsLength() {
            let offset = this.bb.__offset(this.bb_pos, 24);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          tensors(index, obj) {
            let offset = this.bb.__offset(this.bb_pos, 26);
            return offset ? (obj || new onnxruntime.experimental.fbs.Tensor()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
          }
          tensorsLength() {
            let offset = this.bb.__offset(this.bb_pos, 26);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          graphs(index, obj) {
            let offset = this.bb.__offset(this.bb_pos, 28);
            return offset ? (obj || new onnxruntime.experimental.fbs.Graph()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
          }
          graphsLength() {
            let offset = this.bb.__offset(this.bb_pos, 28);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          static startAttribute(builder) {
            builder.startObject(13);
          }
          static addName(builder, nameOffset) {
            builder.addFieldOffset(0, nameOffset, 0);
          }
          static addDocString(builder, docStringOffset) {
            builder.addFieldOffset(1, docStringOffset, 0);
          }
          static addType(builder, type) {
            builder.addFieldInt32(2, type, onnxruntime.experimental.fbs.AttributeType.UNDEFINED);
          }
          static addF(builder, f) {
            builder.addFieldFloat32(3, f, 0);
          }
          static addI(builder, i) {
            builder.addFieldInt64(4, i, builder.createLong(0, 0));
          }
          static addS(builder, sOffset) {
            builder.addFieldOffset(5, sOffset, 0);
          }
          static addT(builder, tOffset) {
            builder.addFieldOffset(6, tOffset, 0);
          }
          static addG(builder, gOffset) {
            builder.addFieldOffset(7, gOffset, 0);
          }
          static addFloats(builder, floatsOffset) {
            builder.addFieldOffset(8, floatsOffset, 0);
          }
          static createFloatsVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addFloat32(data[i]);
            }
            return builder.endVector();
          }
          static startFloatsVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addInts(builder, intsOffset) {
            builder.addFieldOffset(9, intsOffset, 0);
          }
          static createIntsVector(builder, data) {
            builder.startVector(8, data.length, 8);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addInt64(data[i]);
            }
            return builder.endVector();
          }
          static startIntsVector(builder, numElems) {
            builder.startVector(8, numElems, 8);
          }
          static addStrings(builder, stringsOffset) {
            builder.addFieldOffset(10, stringsOffset, 0);
          }
          static createStringsVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startStringsVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addTensors(builder, tensorsOffset) {
            builder.addFieldOffset(11, tensorsOffset, 0);
          }
          static createTensorsVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startTensorsVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addGraphs(builder, graphsOffset) {
            builder.addFieldOffset(12, graphsOffset, 0);
          }
          static createGraphsVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startGraphsVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static endAttribute(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createAttribute(builder, nameOffset, docStringOffset, type, f, i, sOffset, tOffset, gOffset, floatsOffset, intsOffset, stringsOffset, tensorsOffset, graphsOffset) {
            Attribute2.startAttribute(builder);
            Attribute2.addName(builder, nameOffset);
            Attribute2.addDocString(builder, docStringOffset);
            Attribute2.addType(builder, type);
            Attribute2.addF(builder, f);
            Attribute2.addI(builder, i);
            Attribute2.addS(builder, sOffset);
            Attribute2.addT(builder, tOffset);
            Attribute2.addG(builder, gOffset);
            Attribute2.addFloats(builder, floatsOffset);
            Attribute2.addInts(builder, intsOffset);
            Attribute2.addStrings(builder, stringsOffset);
            Attribute2.addTensors(builder, tensorsOffset);
            Attribute2.addGraphs(builder, graphsOffset);
            return Attribute2.endAttribute(builder);
          }
        }
        fbs.Attribute = Attribute2;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class Graph {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsGraph(bb, obj) {
            return (obj || new Graph()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsGraph(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new Graph()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          initializers(index, obj) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? (obj || new onnxruntime.experimental.fbs.Tensor()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
          }
          initializersLength() {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          nodeArgs(index, obj) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? (obj || new onnxruntime.experimental.fbs.ValueInfo()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
          }
          nodeArgsLength() {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          nodes(index, obj) {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? (obj || new onnxruntime.experimental.fbs.Node()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
          }
          nodesLength() {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          maxNodeIndex() {
            let offset = this.bb.__offset(this.bb_pos, 10);
            return offset ? this.bb.readUint32(this.bb_pos + offset) : 0;
          }
          nodeEdges(index, obj) {
            let offset = this.bb.__offset(this.bb_pos, 12);
            return offset ? (obj || new onnxruntime.experimental.fbs.NodeEdge()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
          }
          nodeEdgesLength() {
            let offset = this.bb.__offset(this.bb_pos, 12);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          inputs(index, optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 14);
            return offset ? this.bb.__string(this.bb.__vector(this.bb_pos + offset) + index * 4, optionalEncoding) : null;
          }
          inputsLength() {
            let offset = this.bb.__offset(this.bb_pos, 14);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          outputs(index, optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 16);
            return offset ? this.bb.__string(this.bb.__vector(this.bb_pos + offset) + index * 4, optionalEncoding) : null;
          }
          outputsLength() {
            let offset = this.bb.__offset(this.bb_pos, 16);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          sparseInitializers(index, obj) {
            let offset = this.bb.__offset(this.bb_pos, 18);
            return offset ? (obj || new onnxruntime.experimental.fbs.SparseTensor()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
          }
          sparseInitializersLength() {
            let offset = this.bb.__offset(this.bb_pos, 18);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          static startGraph(builder) {
            builder.startObject(8);
          }
          static addInitializers(builder, initializersOffset) {
            builder.addFieldOffset(0, initializersOffset, 0);
          }
          static createInitializersVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startInitializersVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addNodeArgs(builder, nodeArgsOffset) {
            builder.addFieldOffset(1, nodeArgsOffset, 0);
          }
          static createNodeArgsVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startNodeArgsVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addNodes(builder, nodesOffset) {
            builder.addFieldOffset(2, nodesOffset, 0);
          }
          static createNodesVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startNodesVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addMaxNodeIndex(builder, maxNodeIndex) {
            builder.addFieldInt32(3, maxNodeIndex, 0);
          }
          static addNodeEdges(builder, nodeEdgesOffset) {
            builder.addFieldOffset(4, nodeEdgesOffset, 0);
          }
          static createNodeEdgesVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startNodeEdgesVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addInputs(builder, inputsOffset) {
            builder.addFieldOffset(5, inputsOffset, 0);
          }
          static createInputsVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startInputsVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addOutputs(builder, outputsOffset) {
            builder.addFieldOffset(6, outputsOffset, 0);
          }
          static createOutputsVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startOutputsVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addSparseInitializers(builder, sparseInitializersOffset) {
            builder.addFieldOffset(7, sparseInitializersOffset, 0);
          }
          static createSparseInitializersVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startSparseInitializersVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static endGraph(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createGraph(builder, initializersOffset, nodeArgsOffset, nodesOffset, maxNodeIndex, nodeEdgesOffset, inputsOffset, outputsOffset, sparseInitializersOffset) {
            Graph.startGraph(builder);
            Graph.addInitializers(builder, initializersOffset);
            Graph.addNodeArgs(builder, nodeArgsOffset);
            Graph.addNodes(builder, nodesOffset);
            Graph.addMaxNodeIndex(builder, maxNodeIndex);
            Graph.addNodeEdges(builder, nodeEdgesOffset);
            Graph.addInputs(builder, inputsOffset);
            Graph.addOutputs(builder, outputsOffset);
            Graph.addSparseInitializers(builder, sparseInitializersOffset);
            return Graph.endGraph(builder);
          }
        }
        fbs.Graph = Graph;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class Model2 {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsModel(bb, obj) {
            return (obj || new Model2()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsModel(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new Model2()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          irVersion() {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.readInt64(this.bb_pos + offset) : this.bb.createLong(0, 0);
          }
          opsetImport(index, obj) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? (obj || new onnxruntime.experimental.fbs.OperatorSetId()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
          }
          opsetImportLength() {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          producerName(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          producerVersion(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 10);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          domain(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 12);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          modelVersion() {
            let offset = this.bb.__offset(this.bb_pos, 14);
            return offset ? this.bb.readInt64(this.bb_pos + offset) : this.bb.createLong(0, 0);
          }
          docString(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 16);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          graph(obj) {
            let offset = this.bb.__offset(this.bb_pos, 18);
            return offset ? (obj || new onnxruntime.experimental.fbs.Graph()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
          }
          graphDocString(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 20);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          static startModel(builder) {
            builder.startObject(9);
          }
          static addIrVersion(builder, irVersion) {
            builder.addFieldInt64(0, irVersion, builder.createLong(0, 0));
          }
          static addOpsetImport(builder, opsetImportOffset) {
            builder.addFieldOffset(1, opsetImportOffset, 0);
          }
          static createOpsetImportVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startOpsetImportVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addProducerName(builder, producerNameOffset) {
            builder.addFieldOffset(2, producerNameOffset, 0);
          }
          static addProducerVersion(builder, producerVersionOffset) {
            builder.addFieldOffset(3, producerVersionOffset, 0);
          }
          static addDomain(builder, domainOffset) {
            builder.addFieldOffset(4, domainOffset, 0);
          }
          static addModelVersion(builder, modelVersion) {
            builder.addFieldInt64(5, modelVersion, builder.createLong(0, 0));
          }
          static addDocString(builder, docStringOffset) {
            builder.addFieldOffset(6, docStringOffset, 0);
          }
          static addGraph(builder, graphOffset) {
            builder.addFieldOffset(7, graphOffset, 0);
          }
          static addGraphDocString(builder, graphDocStringOffset) {
            builder.addFieldOffset(8, graphDocStringOffset, 0);
          }
          static endModel(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createModel(builder, irVersion, opsetImportOffset, producerNameOffset, producerVersionOffset, domainOffset, modelVersion, docStringOffset, graphOffset, graphDocStringOffset) {
            Model2.startModel(builder);
            Model2.addIrVersion(builder, irVersion);
            Model2.addOpsetImport(builder, opsetImportOffset);
            Model2.addProducerName(builder, producerNameOffset);
            Model2.addProducerVersion(builder, producerVersionOffset);
            Model2.addDomain(builder, domainOffset);
            Model2.addModelVersion(builder, modelVersion);
            Model2.addDocString(builder, docStringOffset);
            Model2.addGraph(builder, graphOffset);
            Model2.addGraphDocString(builder, graphDocStringOffset);
            return Model2.endModel(builder);
          }
        }
        fbs.Model = Model2;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class KernelCreateInfos {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsKernelCreateInfos(bb, obj) {
            return (obj || new KernelCreateInfos()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsKernelCreateInfos(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new KernelCreateInfos()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          nodeIndices(index) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.readUint32(this.bb.__vector(this.bb_pos + offset) + index * 4) : 0;
          }
          nodeIndicesLength() {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          nodeIndicesArray() {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? new Uint32Array(this.bb.bytes().buffer, this.bb.bytes().byteOffset + this.bb.__vector(this.bb_pos + offset), this.bb.__vector_len(this.bb_pos + offset)) : null;
          }
          kernelDefHashes(index) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.readUint64(this.bb.__vector(this.bb_pos + offset) + index * 8) : this.bb.createLong(0, 0);
          }
          kernelDefHashesLength() {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          static startKernelCreateInfos(builder) {
            builder.startObject(2);
          }
          static addNodeIndices(builder, nodeIndicesOffset) {
            builder.addFieldOffset(0, nodeIndicesOffset, 0);
          }
          static createNodeIndicesVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addInt32(data[i]);
            }
            return builder.endVector();
          }
          static startNodeIndicesVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static addKernelDefHashes(builder, kernelDefHashesOffset) {
            builder.addFieldOffset(1, kernelDefHashesOffset, 0);
          }
          static createKernelDefHashesVector(builder, data) {
            builder.startVector(8, data.length, 8);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addInt64(data[i]);
            }
            return builder.endVector();
          }
          static startKernelDefHashesVector(builder, numElems) {
            builder.startVector(8, numElems, 8);
          }
          static endKernelCreateInfos(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createKernelCreateInfos(builder, nodeIndicesOffset, kernelDefHashesOffset) {
            KernelCreateInfos.startKernelCreateInfos(builder);
            KernelCreateInfos.addNodeIndices(builder, nodeIndicesOffset);
            KernelCreateInfos.addKernelDefHashes(builder, kernelDefHashesOffset);
            return KernelCreateInfos.endKernelCreateInfos(builder);
          }
        }
        fbs.KernelCreateInfos = KernelCreateInfos;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class SubGraphSessionState {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsSubGraphSessionState(bb, obj) {
            return (obj || new SubGraphSessionState()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsSubGraphSessionState(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new SubGraphSessionState()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          graphId(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          sessionState(obj) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? (obj || new onnxruntime.experimental.fbs.SessionState()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
          }
          static startSubGraphSessionState(builder) {
            builder.startObject(2);
          }
          static addGraphId(builder, graphIdOffset) {
            builder.addFieldOffset(0, graphIdOffset, 0);
          }
          static addSessionState(builder, sessionStateOffset) {
            builder.addFieldOffset(1, sessionStateOffset, 0);
          }
          static endSubGraphSessionState(builder) {
            let offset = builder.endObject();
            builder.requiredField(offset, 4);
            return offset;
          }
          static createSubGraphSessionState(builder, graphIdOffset, sessionStateOffset) {
            SubGraphSessionState.startSubGraphSessionState(builder);
            SubGraphSessionState.addGraphId(builder, graphIdOffset);
            SubGraphSessionState.addSessionState(builder, sessionStateOffset);
            return SubGraphSessionState.endSubGraphSessionState(builder);
          }
        }
        fbs.SubGraphSessionState = SubGraphSessionState;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class SessionState {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsSessionState(bb, obj) {
            return (obj || new SessionState()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsSessionState(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new SessionState()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          kernels(obj) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? (obj || new onnxruntime.experimental.fbs.KernelCreateInfos()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
          }
          subGraphSessionStates(index, obj) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? (obj || new onnxruntime.experimental.fbs.SubGraphSessionState()).__init(this.bb.__indirect(this.bb.__vector(this.bb_pos + offset) + index * 4), this.bb) : null;
          }
          subGraphSessionStatesLength() {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? this.bb.__vector_len(this.bb_pos + offset) : 0;
          }
          static startSessionState(builder) {
            builder.startObject(2);
          }
          static addKernels(builder, kernelsOffset) {
            builder.addFieldOffset(0, kernelsOffset, 0);
          }
          static addSubGraphSessionStates(builder, subGraphSessionStatesOffset) {
            builder.addFieldOffset(1, subGraphSessionStatesOffset, 0);
          }
          static createSubGraphSessionStatesVector(builder, data) {
            builder.startVector(4, data.length, 4);
            for (let i = data.length - 1; i >= 0; i--) {
              builder.addOffset(data[i]);
            }
            return builder.endVector();
          }
          static startSubGraphSessionStatesVector(builder, numElems) {
            builder.startVector(4, numElems, 4);
          }
          static endSessionState(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static createSessionState(builder, kernelsOffset, subGraphSessionStatesOffset) {
            SessionState.startSessionState(builder);
            SessionState.addKernels(builder, kernelsOffset);
            SessionState.addSubGraphSessionStates(builder, subGraphSessionStatesOffset);
            return SessionState.endSessionState(builder);
          }
        }
        fbs.SessionState = SessionState;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
  (function(onnxruntime) {
    (function(experimental) {
      (function(fbs) {
        class InferenceSession2 {
          constructor() {
            this.bb = null;
            this.bb_pos = 0;
          }
          __init(i, bb) {
            this.bb_pos = i;
            this.bb = bb;
            return this;
          }
          static getRootAsInferenceSession(bb, obj) {
            return (obj || new InferenceSession2()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static getSizePrefixedRootAsInferenceSession(bb, obj) {
            bb.setPosition(bb.position() + flatbuffers_12.flatbuffers.SIZE_PREFIX_LENGTH);
            return (obj || new InferenceSession2()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
          }
          static bufferHasIdentifier(bb) {
            return bb.__has_identifier("ORTM");
          }
          ortVersion(optionalEncoding) {
            let offset = this.bb.__offset(this.bb_pos, 4);
            return offset ? this.bb.__string(this.bb_pos + offset, optionalEncoding) : null;
          }
          model(obj) {
            let offset = this.bb.__offset(this.bb_pos, 6);
            return offset ? (obj || new onnxruntime.experimental.fbs.Model()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
          }
          sessionState(obj) {
            let offset = this.bb.__offset(this.bb_pos, 8);
            return offset ? (obj || new onnxruntime.experimental.fbs.SessionState()).__init(this.bb.__indirect(this.bb_pos + offset), this.bb) : null;
          }
          static startInferenceSession(builder) {
            builder.startObject(3);
          }
          static addOrtVersion(builder, ortVersionOffset) {
            builder.addFieldOffset(0, ortVersionOffset, 0);
          }
          static addModel(builder, modelOffset) {
            builder.addFieldOffset(1, modelOffset, 0);
          }
          static addSessionState(builder, sessionStateOffset) {
            builder.addFieldOffset(2, sessionStateOffset, 0);
          }
          static endInferenceSession(builder) {
            let offset = builder.endObject();
            return offset;
          }
          static finishInferenceSessionBuffer(builder, offset) {
            builder.finish(offset, "ORTM");
          }
          static finishSizePrefixedInferenceSessionBuffer(builder, offset) {
            builder.finish(offset, "ORTM", true);
          }
          static createInferenceSession(builder, ortVersionOffset, modelOffset, sessionStateOffset) {
            InferenceSession2.startInferenceSession(builder);
            InferenceSession2.addOrtVersion(builder, ortVersionOffset);
            InferenceSession2.addModel(builder, modelOffset);
            InferenceSession2.addSessionState(builder, sessionStateOffset);
            return InferenceSession2.endInferenceSession(builder);
          }
        }
        fbs.InferenceSession = InferenceSession2;
      })(experimental.fbs || (experimental.fbs = {}));
    })(onnxruntime.experimental || (onnxruntime.experimental = {}));
  })(exports.onnxruntime || (exports.onnxruntime = {}));
})(ortGenerated);
var util = {};
var __importDefault$2 = commonjsGlobal && commonjsGlobal.__importDefault || function(mod2) {
  return mod2 && mod2.__esModule ? mod2 : { "default": mod2 };
};
Object.defineProperty(util, "__esModule", { value: true });
util.decodeUtf8String = util.MAX_CLIP = util.MIN_CLIP = util.PoolConvUtil = util.ReduceUtil = util.SplitUtil = util.MathUtil = util.ShapeUtil = util.LongUtil = util.ProtoUtil = util.GemmUtil = util.arrayCopyHelper = util.BroadcastUtil = util.MatMulUtil = util.ArrayUtil = util.assert = util.checkInputsShape = void 0;
const flatbuffers_1$1 = require$$0;
const long_1$1 = __importDefault$2(long);
const onnx_proto_1$4 = onnx;
const tensor_1$5 = tensor;
function checkInputsShape(inputs, ...expectedDimensions) {
  if (!inputs || inputs.length !== expectedDimensions.length) {
    return false;
  }
  for (let i = 0; i < inputs.length; i++) {
    if (!inputs[i].dims || inputs[i].dims.length !== expectedDimensions[i]) {
      return false;
    }
  }
  return true;
}
util.checkInputsShape = checkInputsShape;
function assert(expr, msg) {
  if (!expr) {
    throw new Error(typeof msg === "string" ? msg : msg());
  }
}
util.assert = assert;
class ArrayUtil {
  static arraysEqual(n1, n2) {
    if (n1.length !== n2.length) {
      return false;
    }
    for (let i = 0; i < n1.length; i++) {
      if (n1[i] !== n2[i]) {
        return false;
      }
    }
    return true;
  }
}
util.ArrayUtil = ArrayUtil;
class MatMulUtil {
  static preprocessInputShapes(dimsA, dimsB) {
    const a = dimsA.length === 1 ? [1, dimsA[0]] : dimsA;
    const b = dimsB.length === 1 ? [dimsB[0], 1] : dimsB;
    return [a, b];
  }
  static postprocessOutputShape(outputShape, aRank, bRank) {
    if (aRank === 1) {
      outputShape.splice(outputShape.length - 2, 1);
    }
    if (bRank === 1) {
      outputShape.pop();
    }
  }
  static calcMatMulShape(a, b) {
    return a[1] !== b[0] ? void 0 : [a[0], b[1]];
  }
}
util.MatMulUtil = MatMulUtil;
class BroadcastUtil {
  static calcShape(adims, bdims, isMatMul = false) {
    const arank = adims.length;
    const brank = bdims.length;
    if (arank === 0) {
      return bdims;
    }
    if (brank === 0) {
      return adims;
    }
    const crank = Math.max(adims.length, bdims.length);
    const cdims = new Array(crank);
    if (isMatMul) {
      if (arank < 2 || brank < 2) {
        return void 0;
      }
      const cShapeMatMul = MatMulUtil.calcMatMulShape([adims[arank - 2], adims[arank - 1]], [bdims[brank - 2], bdims[brank - 1]]);
      if (cShapeMatMul === void 0) {
        return void 0;
      }
      [cdims[crank - 2], cdims[crank - 1]] = cShapeMatMul;
    }
    for (let i = isMatMul ? 3 : 1; i <= crank; i++) {
      const aLen = arank - i < 0 ? 1 : adims[arank - i];
      const bLen = brank - i < 0 ? 1 : bdims[brank - i];
      if (aLen !== bLen && aLen > 1 && bLen > 1) {
        return void 0;
      }
      cdims[crank - i] = Math.max(aLen, bLen);
    }
    return cdims;
  }
  static index(broadcastedIndices, originalShape) {
    const originalIndices = new Array(originalShape.length);
    BroadcastUtil.fillIndex(broadcastedIndices, originalShape, originalIndices);
    return originalIndices;
  }
  static fillIndex(broadcastedIndices, originalShape, originalIndices) {
    const dimOffset = broadcastedIndices.length - originalShape.length;
    for (let i = 0; i < originalShape.length; i++) {
      originalIndices[i] = broadcastedIndices[dimOffset + i] % originalShape[i];
    }
  }
  static calc(a, b, op, inplace, resultType) {
    const outputShape = BroadcastUtil.calcShape(a.dims, b.dims);
    if (outputShape) {
      if (inplace && !ShapeUtil.areEqual(outputShape, a.dims)) {
        return void 0;
      }
      const size = ShapeUtil.size(outputShape);
      const c = inplace ? a : new tensor_1$5.Tensor(outputShape, resultType || a.type);
      if (outputShape.length === 0) {
        c.set([], op(a.get([]), b.get([])));
      } else {
        const outputIndices = new Array(outputShape.length);
        const originalIndicesA = new Array(a.dims.length);
        const originalIndicesB = new Array(b.dims.length);
        let valA = 0;
        let valB = 0;
        let isAScalar = false;
        let isBScalar = false;
        if (a.dims.length === 0) {
          valA = a.get([]);
          isAScalar = true;
        }
        if (b.dims.length === 0) {
          valB = b.get([]);
          isBScalar = true;
        }
        let rest;
        for (let i = 0; i < size; i++) {
          rest = i;
          for (let j = outputShape.length - 1; j >= 0; j--) {
            outputIndices[j] = rest % outputShape[j];
            rest = Math.floor(rest / outputShape[j]);
          }
          if (!isAScalar) {
            BroadcastUtil.fillIndex(outputIndices, a.dims, originalIndicesA);
            valA = a.get(originalIndicesA);
          }
          if (!isBScalar) {
            BroadcastUtil.fillIndex(outputIndices, b.dims, originalIndicesB);
            valB = b.get(originalIndicesB);
          }
          c.set(outputIndices, op(valA, valB));
        }
      }
      return c;
    }
    return void 0;
  }
  static isValidBroadcast(shape2, finalShape) {
    const inputRank = shape2.length;
    const finalRank = finalShape.length;
    if (inputRank > finalRank) {
      return false;
    }
    for (let i = 1; i <= inputRank; i++) {
      if (shape2[inputRank - i] !== 1 && shape2[inputRank - i] !== finalShape[finalRank - i]) {
        return false;
      }
    }
    return true;
  }
  static getBroadcastDims(inputShape, outputShape) {
    const inRank = inputShape.length;
    const dims = [];
    for (let i = 0; i < inRank; i++) {
      const dim = inRank - 1 - i;
      const a = inputShape[dim] || 1;
      const b = outputShape[outputShape.length - 1 - i] || 1;
      if (b > 1 && a === 1) {
        dims.unshift(dim);
      }
    }
    return dims;
  }
}
util.BroadcastUtil = BroadcastUtil;
function arrayCopyHelper(target, source, targetIndex, sourceIndex, blockSize) {
  if (sourceIndex < 0 || sourceIndex >= source.length) {
    throw new Error("sourceIndex out of bounds");
  }
  if (targetIndex < 0 || targetIndex >= target.length) {
    throw new Error("targetIndex out of bounds");
  }
  if (sourceIndex + blockSize > source.length) {
    throw new Error("source indices to be copied are outside bounds");
  }
  if (targetIndex + blockSize > target.length) {
    throw new Error("target array is too small to hold result");
  }
  for (let offset = 0; offset < blockSize; offset++) {
    target[targetIndex + offset] = source[sourceIndex + offset];
  }
}
util.arrayCopyHelper = arrayCopyHelper;
class GemmUtil {
  static getShapeOfGemmResult(leftShape, transLeft, rightShape, transRight, biasShape) {
    if (leftShape.length !== 2 || rightShape.length !== 2) {
      throw new Error("shape need to be of size 2");
    }
    let M;
    let K;
    let N;
    if (transLeft) {
      M = leftShape[1];
      K = leftShape[0];
    } else {
      M = leftShape[0];
      K = leftShape[1];
    }
    let kDim = -1;
    if (transRight) {
      N = rightShape[0];
      kDim = 1;
    } else {
      N = rightShape[1];
      kDim = 0;
    }
    if (rightShape[kDim] !== K) {
      throw new Error("dimension mismatch");
    }
    if (M <= 0 || N <= 0 || K <= 0) {
      throw new Error("invalid shape specified");
    }
    if (biasShape && !BroadcastUtil.isValidBroadcast(biasShape, [M, N])) {
      throw new Error("gemm: invalid bias shape for broadcast");
    }
    return [M, N, K];
  }
}
util.GemmUtil = GemmUtil;
class ProtoUtil {
  static tensorDataTypeFromProto(typeProto) {
    switch (typeProto) {
      case onnx_proto_1$4.onnx.TensorProto.DataType.INT8:
        return "int8";
      case onnx_proto_1$4.onnx.TensorProto.DataType.UINT8:
        return "uint8";
      case onnx_proto_1$4.onnx.TensorProto.DataType.BOOL:
        return "bool";
      case onnx_proto_1$4.onnx.TensorProto.DataType.INT16:
        return "int16";
      case onnx_proto_1$4.onnx.TensorProto.DataType.UINT16:
        return "uint16";
      case onnx_proto_1$4.onnx.TensorProto.DataType.INT32:
        return "int32";
      case onnx_proto_1$4.onnx.TensorProto.DataType.UINT32:
        return "uint32";
      case onnx_proto_1$4.onnx.TensorProto.DataType.FLOAT:
        return "float32";
      case onnx_proto_1$4.onnx.TensorProto.DataType.DOUBLE:
        return "float64";
      case onnx_proto_1$4.onnx.TensorProto.DataType.STRING:
        return "string";
      case onnx_proto_1$4.onnx.TensorProto.DataType.INT64:
        return "int32";
      case onnx_proto_1$4.onnx.TensorProto.DataType.UINT64:
        return "uint32";
      default:
        throw new Error(`unsupported data type: ${onnx_proto_1$4.onnx.TensorProto.DataType[typeProto]}`);
    }
  }
  static tensorDataTypeStringToEnum(type) {
    switch (type) {
      case "int8":
        return onnx_proto_1$4.onnx.TensorProto.DataType.INT8;
      case "uint8":
        return onnx_proto_1$4.onnx.TensorProto.DataType.UINT8;
      case "bool":
        return onnx_proto_1$4.onnx.TensorProto.DataType.BOOL;
      case "int16":
        return onnx_proto_1$4.onnx.TensorProto.DataType.INT16;
      case "uint16":
        return onnx_proto_1$4.onnx.TensorProto.DataType.UINT16;
      case "int32":
        return onnx_proto_1$4.onnx.TensorProto.DataType.INT32;
      case "uint32":
        return onnx_proto_1$4.onnx.TensorProto.DataType.UINT32;
      case "float32":
        return onnx_proto_1$4.onnx.TensorProto.DataType.FLOAT;
      case "float64":
        return onnx_proto_1$4.onnx.TensorProto.DataType.DOUBLE;
      case "string":
        return onnx_proto_1$4.onnx.TensorProto.DataType.STRING;
      case "int64":
        return onnx_proto_1$4.onnx.TensorProto.DataType.INT64;
      case "uint64":
        return onnx_proto_1$4.onnx.TensorProto.DataType.UINT64;
      default:
        throw new Error(`unsupported data type: ${type}`);
    }
  }
  static tensorDimsFromProto(dims) {
    return dims.map((d) => long_1$1.default.isLong(d) ? d.toNumber() : d);
  }
  static tensorValueTypeFromProto(valueType) {
    return {
      tensorType: ProtoUtil.tensorDataTypeFromProto(valueType.elemType),
      shape: { dims: ProtoUtil.tensorDimsFromProto(valueType.shape.dim.map((d) => d.dimValue)) }
    };
  }
  static tensorDimsFromORTFormat(tensor2) {
    const dims = [];
    for (let i = 0; i < tensor2.dimsLength(); i++) {
      dims.push(LongUtil.longToNumber(tensor2.dims(i)));
    }
    return dims;
  }
  static tensorAttributesFromORTFormat(node) {
    const attributes = [];
    for (let i = 0; i < node.attributesLength(); i++) {
      attributes.push(node.attributes(i));
    }
    return attributes;
  }
}
util.ProtoUtil = ProtoUtil;
class LongUtil {
  static longToNumber(n, unsigned) {
    if (long_1$1.default.isLong(n)) {
      return n.toNumber();
    } else if (n instanceof flatbuffers_1$1.flatbuffers.Long) {
      return long_1$1.default.fromValue({ low: n.low, high: n.high, unsigned: unsigned !== null && unsigned !== void 0 ? unsigned : false }).toNumber();
    }
    return n;
  }
  static isLong(n) {
    return long_1$1.default.isLong(n) || n instanceof flatbuffers_1$1.flatbuffers.Long;
  }
}
util.LongUtil = LongUtil;
class ShapeUtil {
  static size(dims) {
    return ShapeUtil.getSizeFromDimensionRange(dims, 0, dims.length);
  }
  static sizeFromDimension(dims, axis) {
    if (axis < 0 || axis > dims.length) {
      throw new Error(`invalid dimension of ${axis} for sizeFromDimension as Tensor has ${dims.length} dimensions.`);
    }
    return ShapeUtil.getSizeFromDimensionRange(dims, axis, dims.length);
  }
  static sizeToDimension(dims, axis) {
    if (axis < 0 || axis > dims.length) {
      throw new Error(`invalid dimension of ${axis} for sizeToDimension as Tensor has ${dims.length} dimensions.`);
    }
    return ShapeUtil.getSizeFromDimensionRange(dims, 0, axis);
  }
  static getSizeFromDimensionRange(dims, start, end2) {
    let size = 1;
    for (let i = start; i < end2; i++) {
      if (dims[i] <= 0) {
        throw new Error("cannot get valid size from specified dimension range. Most likely the range contains 0 or negative values in them.");
      }
      size *= dims[i];
    }
    return size;
  }
  static computeStrides(dims) {
    const rank = dims.length;
    if (rank === 0) {
      return [];
    } else if (rank === 1) {
      return [1];
    }
    const strides = new Array(rank);
    strides[rank - 1] = 1;
    strides[rank - 2] = dims[rank - 1];
    for (let i = rank - 3; i >= 0; --i) {
      strides[i] = strides[i + 1] * dims[i + 1];
    }
    return strides;
  }
  static transpose(dims) {
    const copy = dims.slice();
    return copy.reverse();
  }
  static indicesToOffset(indices, strides, axis) {
    if (axis === void 0) {
      axis = indices.length;
    }
    let offset = 0;
    for (let i = 0; i < axis; ++i) {
      offset += strides[i] * indices[i];
    }
    return offset;
  }
  static offsetToIndices(offset, strides) {
    const rank = strides.length;
    if (rank === 0) {
      return [];
    } else if (rank === 1) {
      return [offset * strides[0]];
    }
    const indices = new Array(strides.length);
    for (let i = 0; i < indices.length - 1; ++i) {
      indices[i] = Math.floor(offset / strides[i]);
      offset -= indices[i] * strides[i];
    }
    indices[indices.length - 1] = offset;
    return indices;
  }
  static normalizeAxis(axis, tensorRank) {
    if (axis < -tensorRank && axis >= tensorRank) {
      throw new Error("unsupported axis for this operation.");
    }
    return axis < 0 ? axis + tensorRank : axis;
  }
  static normalizeAxes(axes, tensorRank) {
    return axes.map((x) => this.normalizeAxis(x, tensorRank));
  }
  static incrementIndex(index, dims, axisToIncrementOn) {
    if (dims.length === 0 || index.length === 0) {
      throw new Error("Index incrementing unsupported for scalar Tensor");
    }
    if (axisToIncrementOn === void 0) {
      axisToIncrementOn = dims.length;
    } else {
      if (axisToIncrementOn <= 0 || axisToIncrementOn > dims.length) {
        throw new Error("Incorrect axis to increment on");
      }
    }
    for (let k = axisToIncrementOn - 1; k >= 0; --k) {
      index[k]++;
      if (index[k] < dims[k]) {
        break;
      }
      index[k] = 0;
    }
  }
  static calculateReshapedDims(originalDims, shapeHints) {
    if (shapeHints.length === 0) {
      if (originalDims.length === 0 || ShapeUtil.size(originalDims) === 1) {
        return [];
      } else {
        throw new Error("cannot reshape to a scalar Tensor");
      }
    }
    const nDims = shapeHints.length;
    const reshapedDims = new Array(nDims);
    let unknownDimension = -1;
    let newTensorSize = 1;
    for (let i = 0; i < nDims; i++) {
      if (shapeHints[i] < -1) {
        throw new Error("a dimension in shape hints cannot be less than -1");
      }
      if (shapeHints[i] === -1) {
        if (unknownDimension !== -1) {
          throw new Error("at most one dimension in shape hints can be -1");
        }
        unknownDimension = i;
      } else {
        if (shapeHints[i] === 0) {
          if (i >= originalDims.length) {
            throw new Error("the dimension with value zero exceeds the dimension size of the input tensor");
          }
          reshapedDims[i] = originalDims[i];
        } else {
          reshapedDims[i] = shapeHints[i];
        }
        newTensorSize *= reshapedDims[i];
      }
    }
    const oldTensorSize = ShapeUtil.size(originalDims);
    if (unknownDimension !== -1) {
      if (oldTensorSize % newTensorSize !== 0) {
        throw new Error(`the input tensor cannot be reshaped to the requested shape. Input shape: [${originalDims}] Output shape: [${shapeHints}]`);
      }
      reshapedDims[unknownDimension] = oldTensorSize / newTensorSize;
    } else {
      if (newTensorSize !== oldTensorSize) {
        throw new Error("reshapedDims and originalDims don't have matching sizes");
      }
    }
    return reshapedDims;
  }
  static sortBasedOnPerm(a, perm) {
    if (perm) {
      return perm.map((v) => a[v]);
    } else {
      return a.slice().reverse();
    }
  }
  static padShape(dims, pad2) {
    const rank = dims.length;
    return dims.map((v, i) => v + pad2[i] + pad2[i + rank]);
  }
  static areEqual(shape1, shape2) {
    if (shape1.length !== shape2.length) {
      return false;
    }
    return shape1.every((v, i) => v === shape2[i]);
  }
  static validateDimsAndCalcSize(dims) {
    if (dims.length > 6) {
      throw new TypeError("Only rank 0 to 6 is supported for tensor shape.");
    }
    let size = 1;
    for (const n of dims) {
      if (!Number.isInteger(n)) {
        throw new TypeError(`Invalid shape: ${n} is not an integer`);
      }
      if (n < 0 || n > 2147483647) {
        throw new TypeError(`Invalid shape: length ${n} is not allowed`);
      }
      size *= n;
    }
    return size;
  }
  static flattenShape(dims, axis) {
    if (axis < 0) {
      axis += dims.length;
    }
    const total = dims.reduce((x, y) => x * y, 1);
    const right = dims.slice(axis).reduce((x, y) => x * y, 1);
    const outputDims = [total / right, right];
    return outputDims;
  }
  static squeezeShape(dims, axes) {
    const outputDims = new Array();
    axes = ShapeUtil.normalizeAxes(axes, dims.length);
    for (let i = 0; i < dims.length; i++) {
      const inSqueezeList = axes.indexOf(i) >= 0;
      if (inSqueezeList && dims[i] !== 1) {
        throw new Error("squeeze an axis of size different than 1");
      }
      if (axes.length === 0 && dims[i] > 1 || axes.length > 0 && !inSqueezeList) {
        outputDims.push(dims[i]);
      }
    }
    return outputDims;
  }
  static unsqueezeShape(dims, axes) {
    const outputDims = new Array(dims.length + axes.length);
    outputDims.fill(0);
    for (let i = 0; i < axes.length; i++) {
      const axis = ShapeUtil.normalizeAxis(axes[i], dims.length);
      if (axis >= outputDims.length) {
        throw new Error("'axes' has an out of range axis");
      }
      if (outputDims[axis] !== 0) {
        throw new Error("'axes' has a duplicate axis");
      }
      outputDims[axis] = 1;
    }
    let inputDimsIterator = 0;
    for (let i = 0; i < outputDims.length; i++) {
      if (outputDims[i] === 0) {
        outputDims[i] = dims[inputDimsIterator++];
      }
    }
    if (inputDimsIterator !== dims.length) {
      throw new Error("the unsqueezed dimension could not be established");
    }
    return outputDims;
  }
}
util.ShapeUtil = ShapeUtil;
class MathUtil {
  static sqr(target, source, targetIndex, sourceIndex, blockSize) {
    if (sourceIndex < 0 || sourceIndex >= source.length) {
      throw new Error("sourceIndex out of bounds");
    }
    if (targetIndex < 0 || targetIndex >= target.length) {
      throw new Error("targetIndex out of bounds");
    }
    if (sourceIndex + blockSize > source.length) {
      throw new Error("source indices to be copied are outside bounds");
    }
    if (targetIndex + blockSize > target.length) {
      throw new Error("target array is too small to hold result");
    }
    for (let offset = 0; offset < blockSize; offset++) {
      target[targetIndex + offset] += Math.pow(source[sourceIndex + offset], 2);
    }
  }
  static axpy(target, source, targetIndex, sourceIndex, blockSize, alpha) {
    if (sourceIndex < 0 || sourceIndex >= source.length) {
      throw new Error("sourceIndex out of bounds");
    }
    if (targetIndex < 0 || targetIndex >= target.length) {
      throw new Error("targetIndex out of bounds");
    }
    if (sourceIndex + blockSize > source.length) {
      throw new Error("source indices to be copied are outside bounds");
    }
    if (targetIndex + blockSize > target.length) {
      throw new Error("target array is too small to hold result");
    }
    for (let offset = 0; offset < blockSize; offset++) {
      target[targetIndex + offset] += alpha * source[sourceIndex + offset];
    }
  }
  static powx(target, source, targetIndex, sourceIndex, blockSize, b) {
    if (sourceIndex < 0 || sourceIndex >= source.length) {
      throw new Error("sourceIndex out of bounds");
    }
    if (targetIndex < 0 || targetIndex >= target.length) {
      throw new Error("targetIndex out of bounds");
    }
    if (sourceIndex + blockSize > source.length) {
      throw new Error("source indices to be copied are outside bounds");
    }
    if (targetIndex + blockSize > target.length) {
      throw new Error("target array is too small to hold result");
    }
    for (let offset = 0; offset < blockSize; offset++) {
      target[targetIndex + offset] = Math.pow(source[sourceIndex + offset], b);
    }
  }
  static mul(target, source, targetIndex, sourceIndex, blockSize) {
    if (sourceIndex < 0 || sourceIndex >= source.length) {
      throw new Error("sourceIndex out of bounds");
    }
    if (targetIndex < 0 || targetIndex >= target.length) {
      throw new Error("targetIndex out of bounds");
    }
    if (sourceIndex + blockSize > source.length) {
      throw new Error("source indices to be copied are outside bounds");
    }
    if (targetIndex + blockSize > target.length) {
      throw new Error("target array is too small to hold result");
    }
    for (let offset = 0; offset < blockSize; offset++) {
      target[targetIndex + offset] = source[sourceIndex + offset] * target[targetIndex + offset];
    }
  }
}
util.MathUtil = MathUtil;
class SplitUtil {
  static splitShape(dims, axis, split2, numOutputs) {
    if (split2.length === 0) {
      if (!numOutputs) {
        throw new Error("need to know number of outputs when the 'split' attribute is not specified");
      }
      SplitUtil.determineSplit(dims[axis], numOutputs, split2);
    }
    const shapes = [];
    const offsets = [0];
    for (let i = 0; i < split2.length; ++i) {
      if (i !== 0) {
        offsets.push(offsets[i - 1] + split2[i - 1]);
      }
      const shape2 = dims.slice();
      shape2[axis] = split2[i];
      shapes.push(shape2);
    }
    return [shapes, offsets];
  }
  static determineSplit(numElementsAlongAxis, numOutputs, split2) {
    if (numElementsAlongAxis % numOutputs !== 0) {
      throw new Error("cannot split tensor to equal sized parts");
    }
    for (let i = 0; i < numOutputs; ++i) {
      split2.push(numElementsAlongAxis / numOutputs);
    }
  }
}
util.SplitUtil = SplitUtil;
class ReduceUtil {
  static calcReduce(a, axes, keepdims, op1, op2) {
    const dims = a.dims.slice(0);
    if (axes.length === 0) {
      dims.forEach((d, ind) => axes.push(ind));
    }
    const outputDims = ReduceUtil.calcReduceShape(dims, axes, true);
    const size = ShapeUtil.size(outputDims);
    const y = new tensor_1$5.Tensor(outputDims, a.type);
    const strides = ShapeUtil.computeStrides(outputDims);
    const inputStrides = ShapeUtil.computeStrides(dims);
    const indicesY = new Array(dims.length);
    for (let i = 0; i < size; i++) {
      const indices = ShapeUtil.offsetToIndices(i, strides);
      BroadcastUtil.fillIndex(indices, dims, indicesY);
      y.set(indices, ReduceUtil.calcReduceByAxis(a.numberData, axes, dims, 0, ShapeUtil.indicesToOffset(indicesY, inputStrides), op1, op2));
    }
    if (keepdims) {
      return y;
    } else {
      return new tensor_1$5.Tensor(ReduceUtil.calcReduceShape(dims, axes, keepdims), y.type, void 0, void 0, y.data, y.dataId);
    }
  }
  static calcReduceByAxis(input, axes, dims, curAxisInd, pos, op1, op2) {
    let res = 0;
    if (curAxisInd >= axes.length) {
      return op1(input[pos]);
    }
    const axis = axes[curAxisInd];
    const step = axis >= dims.length ? 1 : ShapeUtil.size(dims.slice(axis + 1));
    for (let i = 0; i < dims[axis]; i++) {
      res = i === 0 ? ReduceUtil.calcReduceByAxis(input, axes, dims, curAxisInd + 1, pos, op1, op2) : op2(res, ReduceUtil.calcReduceByAxis(input, axes, dims, curAxisInd + 1, pos, op1, op2));
      pos += step;
    }
    return res;
  }
  static calcReduceShape(dims, axes, keepDims) {
    const outputDims = dims.slice();
    for (let i = 0; i < axes.length; i++) {
      if (keepDims) {
        outputDims[axes[i]] = 1;
      } else {
        outputDims[axes[i]] = 0;
      }
    }
    return outputDims.filter((dim) => dim !== 0);
  }
}
util.ReduceUtil = ReduceUtil;
class PoolConvUtil {
  static adjustPoolAttributes(isGlobalOperator, inputDims, kernelShape, strides, dilations, pads) {
    if (!isGlobalOperator && kernelShape.length !== inputDims.length - 2) {
      throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");
    }
    if (isGlobalOperator) {
      for (let dim = 0; dim < inputDims.length - 2; dim++) {
        if (dim >= kernelShape.length) {
          kernelShape.push(inputDims[dim + 2]);
        } else {
          kernelShape[dim] = inputDims[dim + 2];
        }
      }
    }
    for (let dim = 0; dim < kernelShape.length; dim++) {
      if (dim < strides.length) {
        if (strides[dim] < 0) {
          throw new Error("strides should be greater than or equal to 1");
        }
      } else {
        strides.push(1);
      }
    }
    for (let dim = 0; dim < kernelShape.length; dim++) {
      if (dim < dilations.length) {
        if (dilations[dim] < 0) {
          throw new Error("dilations should be greater than or equal to 1");
        }
      } else {
        dilations.push(1);
      }
    }
    for (let dim = 0; dim < kernelShape.length * 2; dim++) {
      if (dim < pads.length) {
        if (pads[dim] < 0) {
          throw new Error("pad should be greater than or equal to 1");
        }
      } else {
        pads.push(0);
      }
    }
    for (let dim = 0; dim < kernelShape.length; dim++) {
      if (kernelShape[dim] <= 0) {
        throw new Error("kernel shapes need to be greater than 0");
      }
      if (pads[dim] >= kernelShape[dim] || pads[dim + kernelShape.length] >= kernelShape[dim]) {
        throw new Error("pads should be smaller than kernel");
      }
    }
  }
  static adjustPadsBasedOnAutoPad(inputDims, strides, dilations, kernelShape, pads, autoPad) {
    if (!autoPad) {
      return;
    }
    if (pads.length !== 2 * (inputDims.length - 2)) {
      throw new Error("length of pads should be twice the length of data dimensions");
    }
    if (strides.length !== inputDims.length - 2) {
      throw new Error("length of strides should be the length of data dimensions");
    }
    if (kernelShape.length !== inputDims.length - 2) {
      throw new Error("length of kernel shapes should be the length of data dimensions");
    }
    for (let dim = 0; dim < inputDims.length - 2; dim++) {
      PoolConvUtil.adjustPadAndReturnShape(inputDims[dim + 2], strides[dim], dilations[dim], kernelShape[dim], pads, dim, dim + inputDims.length - 2, autoPad);
    }
  }
  static computePoolOutputShape(isGlobalOperator, inputDims, strides, dilations, kernelShape, pads, autoPad) {
    if (inputDims.length <= 0) {
      throw new Error("input shape must be of size greater than 0");
    }
    const outputDims = [inputDims[0], inputDims[1]];
    PoolConvUtil.computeShapeHelper(isGlobalOperator, inputDims, outputDims, strides, dilations, kernelShape, pads, autoPad);
    return outputDims;
  }
  static computeConvOutputShape(inputDims, filterDims, strides, dilations, kernelShape, pads, autoPad) {
    if (inputDims.length <= 0 || filterDims.length <= 0) {
      throw new Error("invalid input tensor dims or invalid filter tensor dims");
    }
    const outputDims = [inputDims[0], filterDims[0]];
    PoolConvUtil.computeShapeHelper(false, inputDims, outputDims, strides, dilations, kernelShape, pads, autoPad);
    return outputDims;
  }
  static computeShapeHelper(isGlobalOperator, inputDims, outputDims, strides, dilations, kernelShape, pads, autoPad) {
    if (isGlobalOperator) {
      for (let dim = 0; dim < inputDims.length - 2; dim++) {
        outputDims.push(1);
      }
    } else {
      for (let dim = 0; dim < inputDims.length - 2; dim++) {
        outputDims.push(PoolConvUtil.adjustPadAndReturnShape(inputDims[dim + 2], strides[dim], dilations[dim], kernelShape[dim], pads, dim, dim + inputDims.length - 2, autoPad));
      }
    }
  }
  static adjustPadAndReturnShape(inSize, stride, dilation, kernel, pads, padHeadIndex, padTailIndex, autoPad) {
    const dkernel = dilation * (kernel - 1) + 1;
    if (autoPad && autoPad !== "NOTSET") {
      switch (autoPad) {
        case "VALID":
          pads[padHeadIndex] = 0;
          pads[padTailIndex] = 0;
          return Math.floor((inSize - dkernel) / stride + 1);
        case "SAME_LOWER":
        case "SAME_UPPER":
          if (dilation !== 1) {
            throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");
          } else {
            const legacyTargetSize = (inSize + stride - 1) / stride;
            const padNeeded = (legacyTargetSize - 1) * stride + kernel - inSize;
            pads[padHeadIndex] = autoPad === "SAME_LOWER" ? Math.floor((padNeeded + 1) / 2) : Math.floor(padNeeded / 2);
            pads[padTailIndex] = padNeeded - pads[padHeadIndex];
            return Math.floor((inSize + padNeeded - kernel) / stride + 1);
          }
        default:
          throw new Error("Unsupported AutoPad type");
      }
    } else {
      return Math.floor((inSize + pads[padHeadIndex] + pads[padTailIndex] - dkernel) / stride + 1);
    }
  }
}
util.PoolConvUtil = PoolConvUtil;
util.MIN_CLIP = -34028234663852886e22;
util.MAX_CLIP = 34028234663852886e22;
function decodeUtf8String(buffer) {
  return new TextDecoder().decode(buffer);
}
util.decodeUtf8String = decodeUtf8String;
var __importDefault$1 = commonjsGlobal && commonjsGlobal.__importDefault || function(mod2) {
  return mod2 && mod2.__esModule ? mod2 : { "default": mod2 };
};
Object.defineProperty(tensor, "__esModule", { value: true });
tensor.Tensor = void 0;
const guid_typescript_1 = guid;
const long_1 = __importDefault$1(long);
const onnx_proto_1$3 = onnx;
const ort_generated_1$3 = ortGenerated;
var ortFbs$3 = ort_generated_1$3.onnxruntime.experimental.fbs;
const util_1$p = util;
class Tensor {
  constructor(dims, type, dataProvider, asyncDataProvider, cache2, dataId = guid_typescript_1.Guid.create()) {
    this.dims = dims;
    this.type = type;
    this.dataProvider = dataProvider;
    this.asyncDataProvider = asyncDataProvider;
    this.cache = cache2;
    this.dataId = dataId;
    this.size = util_1$p.ShapeUtil.validateDimsAndCalcSize(dims);
    const size = this.size;
    const empty = dataProvider === void 0 && asyncDataProvider === void 0 && cache2 === void 0;
    if (cache2 !== void 0) {
      if (cache2.length !== size) {
        throw new RangeError("Input dims doesn't match data length.");
      }
    }
    if (type === "string") {
      if (cache2 !== void 0 && (!Array.isArray(cache2) || !cache2.every((i) => typeof i === "string"))) {
        throw new TypeError("cache should be a string array");
      }
      if (empty) {
        this.cache = new Array(size);
      }
    } else {
      if (cache2 !== void 0) {
        const constructor = dataviewConstructor(type);
        if (!(cache2 instanceof constructor)) {
          throw new TypeError(`cache should be type ${constructor.name}`);
        }
      }
      if (empty) {
        const buf = new ArrayBuffer(size * sizeof(type));
        this.cache = createView(buf, type);
      }
    }
  }
  get data() {
    if (this.cache === void 0) {
      const data = this.dataProvider(this.dataId);
      if (data.length !== this.size) {
        throw new Error("Length of data provided by the Data Provider is inconsistent with the dims of this Tensor.");
      }
      this.cache = data;
    }
    return this.cache;
  }
  get stringData() {
    if (this.type !== "string") {
      throw new TypeError("data type is not string");
    }
    return this.data;
  }
  get integerData() {
    switch (this.type) {
      case "uint8":
      case "int8":
      case "uint16":
      case "int16":
      case "int32":
      case "uint32":
      case "bool":
        return this.data;
      default:
        throw new TypeError("data type is not integer (uint8, int8, uint16, int16, int32, uint32, bool)");
    }
  }
  get floatData() {
    switch (this.type) {
      case "float32":
      case "float64":
        return this.data;
      default:
        throw new TypeError("data type is not float (float32, float64)");
    }
  }
  get numberData() {
    if (this.type !== "string") {
      return this.data;
    }
    throw new TypeError("type cannot be non-number (string)");
  }
  get(indices) {
    return this.data[util_1$p.ShapeUtil.indicesToOffset(indices, this.strides)];
  }
  set(indices, value) {
    this.data[util_1$p.ShapeUtil.indicesToOffset(indices, this.strides)] = value;
  }
  async getData() {
    if (this.cache === void 0) {
      this.cache = await this.asyncDataProvider(this.dataId);
    }
    return this.cache;
  }
  get strides() {
    if (!this._strides) {
      this._strides = util_1$p.ShapeUtil.computeStrides(this.dims);
    }
    return this._strides;
  }
  static fromProto(tensorProto) {
    if (!tensorProto) {
      throw new Error("cannot construct Value from an empty tensor");
    }
    const type = util_1$p.ProtoUtil.tensorDataTypeFromProto(tensorProto.dataType);
    const dims = util_1$p.ProtoUtil.tensorDimsFromProto(tensorProto.dims);
    const value = new Tensor(dims, type);
    if (type === "string") {
      tensorProto.stringData.forEach((str, i) => {
        value.data[i] = util_1$p.decodeUtf8String(str);
      });
    } else if (tensorProto.rawData && typeof tensorProto.rawData.byteLength === "number" && tensorProto.rawData.byteLength > 0) {
      const dataDest = value.data;
      const dataSource = new DataView(tensorProto.rawData.buffer, tensorProto.rawData.byteOffset, tensorProto.rawData.byteLength);
      const elementSize = sizeofProto(tensorProto.dataType);
      const length2 = tensorProto.rawData.byteLength / elementSize;
      if (tensorProto.rawData.byteLength % elementSize !== 0) {
        throw new Error("invalid buffer length");
      }
      if (dataDest.length !== length2) {
        throw new Error("buffer length mismatch");
      }
      for (let i = 0; i < length2; i++) {
        const n = readProto(dataSource, tensorProto.dataType, i * elementSize);
        dataDest[i] = n;
      }
    } else {
      let array;
      switch (tensorProto.dataType) {
        case onnx_proto_1$3.onnx.TensorProto.DataType.FLOAT:
          array = tensorProto.floatData;
          break;
        case onnx_proto_1$3.onnx.TensorProto.DataType.INT32:
        case onnx_proto_1$3.onnx.TensorProto.DataType.INT16:
        case onnx_proto_1$3.onnx.TensorProto.DataType.UINT16:
        case onnx_proto_1$3.onnx.TensorProto.DataType.INT8:
        case onnx_proto_1$3.onnx.TensorProto.DataType.UINT8:
        case onnx_proto_1$3.onnx.TensorProto.DataType.BOOL:
          array = tensorProto.int32Data;
          break;
        case onnx_proto_1$3.onnx.TensorProto.DataType.INT64:
          array = tensorProto.int64Data;
          break;
        case onnx_proto_1$3.onnx.TensorProto.DataType.DOUBLE:
          array = tensorProto.doubleData;
          break;
        case onnx_proto_1$3.onnx.TensorProto.DataType.UINT32:
        case onnx_proto_1$3.onnx.TensorProto.DataType.UINT64:
          array = tensorProto.uint64Data;
          break;
        default:
          throw new Error("unspecific error");
      }
      if (array === null || array === void 0) {
        throw new Error("failed to populate data from a tensorproto value");
      }
      const data = value.data;
      if (data.length !== array.length) {
        throw new Error("array length mismatch");
      }
      for (let i = 0; i < array.length; i++) {
        const element = array[i];
        if (long_1.default.isLong(element)) {
          data[i] = longToNumber(element, tensorProto.dataType);
        } else {
          data[i] = element;
        }
      }
    }
    return value;
  }
  static fromData(data, dims, type) {
    return new Tensor(dims, type, void 0, void 0, data);
  }
  static fromOrtTensor(ortTensor) {
    if (!ortTensor) {
      throw new Error("cannot construct Value from an empty tensor");
    }
    const dims = util_1$p.ProtoUtil.tensorDimsFromORTFormat(ortTensor);
    const type = util_1$p.ProtoUtil.tensorDataTypeFromProto(ortTensor.dataType());
    const value = new Tensor(dims, type);
    if (type === "string") {
      for (let i = 0; i < ortTensor.stringDataLength(); i++) {
        value.data[i] = ortTensor.stringData(i);
      }
    } else if (ortTensor.rawDataArray() && typeof ortTensor.rawDataLength() === "number" && ortTensor.rawDataLength() > 0) {
      const dataDest = value.data;
      const dataSource = new DataView(ortTensor.rawDataArray().buffer, ortTensor.rawDataArray().byteOffset, ortTensor.rawDataLength());
      const elementSize = sizeofProto(ortTensor.dataType());
      const length2 = ortTensor.rawDataLength() / elementSize;
      if (ortTensor.rawDataLength() % elementSize !== 0) {
        throw new Error("invalid buffer length");
      }
      if (dataDest.length !== length2) {
        throw new Error("buffer length mismatch");
      }
      for (let i = 0; i < length2; i++) {
        const n = readProto(dataSource, ortTensor.dataType(), i * elementSize);
        dataDest[i] = n;
      }
    }
    return value;
  }
}
tensor.Tensor = Tensor;
function sizeof(type) {
  switch (type) {
    case "bool":
    case "int8":
    case "uint8":
      return 1;
    case "int16":
    case "uint16":
      return 2;
    case "int32":
    case "uint32":
    case "float32":
      return 4;
    case "float64":
      return 8;
    default:
      throw new Error(`cannot calculate sizeof() on type ${type}`);
  }
}
function sizeofProto(type) {
  switch (type) {
    case onnx_proto_1$3.onnx.TensorProto.DataType.UINT8:
    case onnx_proto_1$3.onnx.TensorProto.DataType.INT8:
    case onnx_proto_1$3.onnx.TensorProto.DataType.BOOL:
      return 1;
    case onnx_proto_1$3.onnx.TensorProto.DataType.UINT16:
    case onnx_proto_1$3.onnx.TensorProto.DataType.INT16:
      return 2;
    case onnx_proto_1$3.onnx.TensorProto.DataType.FLOAT:
    case onnx_proto_1$3.onnx.TensorProto.DataType.INT32:
    case onnx_proto_1$3.onnx.TensorProto.DataType.UINT32:
      return 4;
    case onnx_proto_1$3.onnx.TensorProto.DataType.INT64:
    case onnx_proto_1$3.onnx.TensorProto.DataType.DOUBLE:
    case onnx_proto_1$3.onnx.TensorProto.DataType.UINT64:
      return 8;
    default:
      throw new Error(`cannot calculate sizeof() on type ${onnx_proto_1$3.onnx.TensorProto.DataType[type]}`);
  }
}
function createView(dataBuffer, type) {
  return new (dataviewConstructor(type))(dataBuffer);
}
function dataviewConstructor(type) {
  switch (type) {
    case "bool":
    case "uint8":
      return Uint8Array;
    case "int8":
      return Int8Array;
    case "int16":
      return Int16Array;
    case "uint16":
      return Uint16Array;
    case "int32":
      return Int32Array;
    case "uint32":
      return Uint32Array;
    case "float32":
      return Float32Array;
    case "float64":
      return Float64Array;
    default:
      throw new Error("unspecified error");
  }
}
function longToNumber(i, type) {
  if (type === onnx_proto_1$3.onnx.TensorProto.DataType.INT64 || type === ortFbs$3.TensorDataType.INT64) {
    if (i.greaterThanOrEqual(2147483648) || i.lessThan(-2147483648)) {
      throw new TypeError("int64 is not supported");
    }
  } else if (type === onnx_proto_1$3.onnx.TensorProto.DataType.UINT32 || type === ortFbs$3.TensorDataType.UINT32 || type === onnx_proto_1$3.onnx.TensorProto.DataType.UINT64 || type === ortFbs$3.TensorDataType.UINT64) {
    if (i.greaterThanOrEqual(4294967296) || i.lessThan(0)) {
      throw new TypeError("uint64 is not supported");
    }
  } else {
    throw new TypeError(`not a LONG type: ${onnx_proto_1$3.onnx.TensorProto.DataType[type]}`);
  }
  return i.toNumber();
}
function readProto(view, type, byteOffset) {
  switch (type) {
    case onnx_proto_1$3.onnx.TensorProto.DataType.BOOL:
    case onnx_proto_1$3.onnx.TensorProto.DataType.UINT8:
      return view.getUint8(byteOffset);
    case onnx_proto_1$3.onnx.TensorProto.DataType.INT8:
      return view.getInt8(byteOffset);
    case onnx_proto_1$3.onnx.TensorProto.DataType.UINT16:
      return view.getUint16(byteOffset, true);
    case onnx_proto_1$3.onnx.TensorProto.DataType.INT16:
      return view.getInt16(byteOffset, true);
    case onnx_proto_1$3.onnx.TensorProto.DataType.FLOAT:
      return view.getFloat32(byteOffset, true);
    case onnx_proto_1$3.onnx.TensorProto.DataType.INT32:
      return view.getInt32(byteOffset, true);
    case onnx_proto_1$3.onnx.TensorProto.DataType.UINT32:
      return view.getUint32(byteOffset, true);
    case onnx_proto_1$3.onnx.TensorProto.DataType.INT64:
      return longToNumber(long_1.default.fromBits(view.getUint32(byteOffset, true), view.getUint32(byteOffset + 4, true), false), type);
    case onnx_proto_1$3.onnx.TensorProto.DataType.DOUBLE:
      return view.getFloat64(byteOffset, true);
    case onnx_proto_1$3.onnx.TensorProto.DataType.UINT64:
      return longToNumber(long_1.default.fromBits(view.getUint32(byteOffset, true), view.getUint32(byteOffset + 4, true), true), type);
    default:
      throw new Error(`cannot read from DataView for type ${onnx_proto_1$3.onnx.TensorProto.DataType[type]}`);
  }
}
var pack = {};
var glslSource = {};
Object.defineProperty(glslSource, "__esModule", { value: true });
glslSource.getDefaultFragShaderMain = glslSource.getFragShaderPreamble = glslSource.getVertexShaderSource = glslSource.getGlsl = void 0;
const GLSL_ES_2_0 = {
  version: "",
  attribute: "attribute",
  varyingVertex: "varying",
  varyingFrag: "varying",
  texture2D: "texture2D",
  output: "gl_FragColor",
  outputDeclaration: ""
};
const GLSL_ES_3_0 = {
  version: "#version 300 es",
  attribute: "in",
  varyingVertex: "out",
  varyingFrag: "in",
  texture2D: "texture",
  output: "outputColor",
  outputDeclaration: "out vec4 outputColor;"
};
function getGlsl(version) {
  return version === 1 ? GLSL_ES_2_0 : GLSL_ES_3_0;
}
glslSource.getGlsl = getGlsl;
function getVertexShaderSource(version) {
  const glsl = getGlsl(version);
  return `${glsl.version}
      precision highp float;
      ${glsl.attribute} vec3 position;
      ${glsl.attribute} vec2 textureCoord;

      ${glsl.varyingVertex} vec2 TexCoords;

      void main()
      {
          gl_Position = vec4(position, 1.0);
          TexCoords = textureCoord;
      }`;
}
glslSource.getVertexShaderSource = getVertexShaderSource;
function getFragShaderPreamble(version) {
  const glsl = getGlsl(version);
  return `${glsl.version}
    precision highp float;
    precision highp int;
    precision highp sampler2D;
    ${glsl.varyingFrag} vec2 TexCoords;
    ${glsl.outputDeclaration}
    const vec2 halfCR = vec2(0.5, 0.5);

    // Custom vector types to handle higher dimenalities.
    struct ivec5
    {
      int x;
      int y;
      int z;
      int w;
      int u;
    };

    struct ivec6
    {
      int x;
      int y;
      int z;
      int w;
      int u;
      int v;
    };

    int imod(int x, int y) {
      return x - y * (x / y);
    }

    `;
}
glslSource.getFragShaderPreamble = getFragShaderPreamble;
function getDefaultFragShaderMain(version, outputShapeLength) {
  const glsl = getGlsl(version);
  return `
  void main() {
    int indices[${outputShapeLength}];
    toVec(TexCoords, indices);
    vec4 result = vec4(process(indices));
    ${glsl.output} = result;
  }
  `;
}
glslSource.getDefaultFragShaderMain = getDefaultFragShaderMain;
var types = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TextureType = void 0;
  (function(TextureType) {
    TextureType[TextureType["unpacked"] = 0] = "unpacked";
    TextureType[TextureType["unpackedReversed"] = 1] = "unpackedReversed";
    TextureType[TextureType["packed"] = 2] = "packed";
    TextureType[TextureType["downloadUint8AsFloat"] = 3] = "downloadUint8AsFloat";
    TextureType[TextureType["packedLastDimension"] = 4] = "packedLastDimension";
  })(exports.TextureType || (exports.TextureType = {}));
})(types);
var utils = {};
Object.defineProperty(utils, "__esModule", { value: true });
utils.getGlChannels = utils.getCoordsDataType = utils.getSqueezedParams = utils.squeezeInputShape = utils.generateShaderFuncNameFromInputSamplerNameAtOutCoords = utils.generateShaderFuncNameFromInputSamplerName = utils.repeatedTry = utils.getPackedShape = void 0;
const util_1$o = util;
function getPackedShape(unpackedShape) {
  const len = unpackedShape.length;
  return unpackedShape.slice(0, len - 1).concat(unpackedShape[len - 1] / 4);
}
utils.getPackedShape = getPackedShape;
async function repeatedTry(checkFn, delayFn = (_counter) => 0, maxCounter) {
  return new Promise((resolve, reject) => {
    let tryCount = 0;
    const tryFn = () => {
      if (checkFn()) {
        resolve();
        return;
      }
      tryCount++;
      const nextBackoff = delayFn(tryCount);
      if (maxCounter != null && tryCount >= maxCounter) {
        reject();
        return;
      }
      setTimeout(tryFn, nextBackoff);
    };
    tryFn();
  });
}
utils.repeatedTry = repeatedTry;
function generateShaderFuncNameFromInputSamplerName(samplerName) {
  util_1$o.assert(typeof samplerName !== "undefined" && samplerName.length !== 0, () => "empty string found for sampler name");
  return "get" + samplerName.charAt(0).toUpperCase() + samplerName.slice(1);
}
utils.generateShaderFuncNameFromInputSamplerName = generateShaderFuncNameFromInputSamplerName;
function generateShaderFuncNameFromInputSamplerNameAtOutCoords(samplerName) {
  util_1$o.assert(typeof samplerName !== "undefined" && samplerName.length !== 0, () => "empty string found for sampler name");
  return "get" + samplerName.charAt(0).toUpperCase() + samplerName.slice(1) + "AtOutCoords";
}
utils.generateShaderFuncNameFromInputSamplerNameAtOutCoords = generateShaderFuncNameFromInputSamplerNameAtOutCoords;
function squeezeInputShape(inputShape, squeezedShape) {
  let newInputShape = JSON.parse(JSON.stringify(inputShape));
  newInputShape = squeezedShape;
  return newInputShape;
}
utils.squeezeInputShape = squeezeInputShape;
function getSqueezedParams(params, keptDims) {
  return keptDims.map((d) => params[d]).join(", ");
}
utils.getSqueezedParams = getSqueezedParams;
function getCoordsDataType(rank) {
  if (rank <= 1) {
    return "int";
  } else if (rank === 2) {
    return "ivec2";
  } else if (rank === 3) {
    return "ivec3";
  } else if (rank === 4) {
    return "ivec4";
  } else if (rank === 5) {
    return "ivec5";
  } else if (rank === 6) {
    return "ivec6";
  } else {
    throw Error(`GPU for rank ${rank} is not yet supported`);
  }
}
utils.getCoordsDataType = getCoordsDataType;
function getGlChannels(rank = 6) {
  return ["x", "y", "z", "w", "u", "v"].slice(0, rank);
}
utils.getGlChannels = getGlChannels;
var packingUtils = {};
Object.defineProperty(packingUtils, "__esModule", { value: true });
packingUtils.unpackFromChannel = packingUtils.getChannels = packingUtils.getVecChannels = void 0;
const utils_1$7 = utils;
function getVecChannels(name2, rank) {
  return utils_1$7.getGlChannels(rank).map((d) => `${name2}.${d}`);
}
packingUtils.getVecChannels = getVecChannels;
function getChannels(name2, rank) {
  if (rank === 1) {
    return [name2];
  }
  return getVecChannels(name2, rank);
}
packingUtils.getChannels = getChannels;
function unpackFromChannel() {
  return `
    float getChannel(vec4 frag, int dim) {
      int modCoord = imod(dim, 2);
      return modCoord == 0 ? frag.r : frag.g;
    }

    float getChannel(vec4 frag, vec2 innerDims) {
      vec2 modCoord = mod(innerDims, 2.);
      return modCoord.x == 0. ?
        (modCoord.y == 0. ? frag.r : frag.g) :
        (modCoord.y == 0. ? frag.b : frag.a);
    }
  `;
}
packingUtils.unpackFromChannel = unpackFromChannel;
Object.defineProperty(pack, "__esModule", { value: true });
pack.createPackProgramInfoLoader = void 0;
const glsl_source_1$h = glslSource;
const types_1$p = types;
const utils_1$6 = utils;
const packing_utils_1$4 = packingUtils;
const packProgramMetadata = {
  name: "pack",
  inputNames: ["A"],
  inputTypes: [types_1$p.TextureType.unpackedReversed]
};
const createPackProgramInfo = (handler, input) => {
  const glsl = glsl_source_1$h.getGlsl(handler.session.backend.glContext.version);
  const inputShape = input.dims;
  const inputRank = inputShape.length;
  const outputRank = input.dims.length;
  const coordsDataType = utils_1$6.getCoordsDataType(outputRank);
  const channels = packing_utils_1$4.getChannels("rc", outputRank);
  const setup = getSetup(outputRank, channels, inputShape[inputShape.length - 2], inputShape[inputShape.length - 1]);
  let reversedInputWH;
  if (inputRank === 0) {
    reversedInputWH = [1, 1];
  } else if (inputRank === 1) {
    reversedInputWH = [inputShape[0], 1];
  } else {
    reversedInputWH = [inputShape[outputRank - 1], inputShape[outputRank - 2]];
  }
  const outOfBoundsCondition = getOutOfBoundsCondition(outputRank, reversedInputWH, channels);
  const output = getOutput(inputShape, channels);
  const shaderSource = `
        void main() {
          ${coordsDataType} rc = getOutputCoords();

          if(${outOfBoundsCondition}) {
            ${glsl.output} = vec4(0);
          } else {
            ${setup}

            ${glsl.output} = vec4(${output});
          }
        }
      `;
  return Object.assign(Object.assign({}, packProgramMetadata), { hasMain: true, output: { dims: input.dims, type: input.type, textureType: types_1$p.TextureType.packed }, shaderSource });
};
const createPackProgramInfoLoader = (handler, input) => Object.assign(Object.assign({}, packProgramMetadata), { get: () => createPackProgramInfo(handler, input) });
pack.createPackProgramInfoLoader = createPackProgramInfoLoader;
function getOutOfBoundsCondition(rank, shape2, dims) {
  if (rank === 0) {
    return "false";
  }
  if (rank === 1) {
    return `rc > ${shape2[0]}`;
  }
  let cond = "";
  for (let i = rank - 2; i < rank; i++) {
    cond += `${dims[i]} >= ${shape2[i - rank + 2]}`;
    if (i < rank - 1) {
      cond += "||";
    }
  }
  return cond;
}
function getOutput(shape2, dims) {
  const rank = shape2.length;
  if (rank === 0) {
    return "getA(), 0, 0, 0";
  }
  if (rank === 1) {
    return `getA(rc),
            rc + 1 >= ${shape2[0]} ? 0. : getA(rc + 1),
            0, 0`;
  }
  const coord00 = "r, c";
  const coord01 = "r, cp1";
  const coord10 = "rp1, c";
  const coord11 = "rp1, cp1";
  let D = "";
  if (rank > 2) {
    for (let i = 0; i < rank - 2; ++i) {
      D = D + `${dims[i]},`;
    }
  }
  return `getA(${D}${coord00}),
          rEdge ? 0. : getA(${D}${coord10}),
          cEdge ? 0. : getA(${D}${coord01}),
          rEdge || cEdge ? 0. : getA(${D}${coord11})`;
}
function getSetup(rank, dims, rows, cols) {
  if (rank === 0 || rank === 1) {
    return "";
  } else {
    const setup = `
    int r = ${dims[rank - 2]};
    int c = ${dims[rank - 1]};
    int rp1 = ${dims[rank - 2]} + 1;
    int cp1 = ${dims[rank - 1]} + 1;
    bool rEdge = rp1 >= ${cols};
    bool cEdge = cp1 >= ${rows};
    `;
    return setup;
  }
}
var reshapePacked = {};
Object.defineProperty(reshapePacked, "__esModule", { value: true });
reshapePacked.isReshapeCheap = reshapePacked.processDims3D = reshapePacked.createPackedReshape3DProgramInfoLoader = void 0;
const util_1$n = util;
const glsl_source_1$g = glslSource;
const types_1$o = types;
const packing_utils_1$3 = packingUtils;
const createPackedReshape3DProgramMetadata = (outputShape3D) => ({ name: "Reshape (packed)", inputTypes: [types_1$o.TextureType.packed], inputNames: ["A"], cacheHint: `${outputShape3D}` });
const createPackedReshape3DProgramInfo = (handler, input3D, metadata, outputShape3D) => {
  const inputShape3D = input3D.dims;
  const squeezedOutputShape = outputShape3D;
  let mainLoop = "";
  for (let i = 0; i < 4; i++) {
    let outputCoords = "";
    switch (i) {
      case 0:
        outputCoords = "outputCoords = rc;";
        break;
      case 1:
        outputCoords = "outputCoords = ivec3(rc.x, rc.y+1, rc.z);";
        break;
      case 2:
        outputCoords = "outputCoords = ivec3(rc.x, rc.y, rc.z+1);";
        break;
      case 3:
        outputCoords = "outputCoords = ivec3(rc.x, rc.y+1, rc.z+1);";
        break;
      default:
        throw new Error();
    }
    mainLoop += `
        ${outputCoords}
        ${i > 0 ? "if(outputCoords.y < rows && outputCoords.z < cols){" : ""}
          int flattenedIndex = getFlattenedIndex(outputCoords);

          ivec3 inputRC = inputCoordsFromReshapedOutCoords(flattenedIndex);
          vec2 innerDims = vec2(float(inputRC.y),float(inputRC.z));

          result[${i}] = getChannel(getA(inputRC.x, inputRC.y, inputRC.z), innerDims);

        ${i > 0 ? "}" : ""}
      `;
  }
  const glsl = glsl_source_1$g.getGlsl(handler.session.backend.glContext.version);
  const shaderSource = `
      ${getReshapedInputCoords(inputShape3D)}
      ${getFlattenedIndexFrom3D(squeezedOutputShape)}
      ${packing_utils_1$3.unpackFromChannel()}

      void main() {
        ivec3 rc = getOutputCoords();

        vec4 result = vec4(0.0);

        ivec3 outputCoords;
        int rows = ${squeezedOutputShape[2]};
        int cols = ${squeezedOutputShape[1]};

        ${mainLoop}
        ${glsl.output} = result;
      }
    `;
  return Object.assign(Object.assign({}, metadata), { output: { dims: squeezedOutputShape, type: input3D.type, textureType: types_1$o.TextureType.packed }, shaderSource, hasMain: true });
};
const createPackedReshape3DProgramInfoLoader = (handler, input3D, outputShape3D) => {
  const metadata = createPackedReshape3DProgramMetadata(outputShape3D);
  return Object.assign(Object.assign({}, metadata), { get: () => createPackedReshape3DProgramInfo(handler, input3D, metadata, outputShape3D) });
};
reshapePacked.createPackedReshape3DProgramInfoLoader = createPackedReshape3DProgramInfoLoader;
function processDims3D(shape2) {
  if (shape2.length === 0) {
    return [1, 1, 1];
  }
  let batch = 1;
  for (let i = 0; i < shape2.length - 2; ++i) {
    batch *= shape2[i];
  }
  return [batch, shape2.length > 1 ? shape2[shape2.length - 2] : 1, shape2[shape2.length - 1]];
}
reshapePacked.processDims3D = processDims3D;
function isReshapeCheap(dims, reshapedDims) {
  let isCheapReshape = false;
  if (dims.length === 0 || reshapedDims.length === 0) {
    isCheapReshape = true;
  } else if (dims.length < 2 || reshapedDims.length < 2) {
    isCheapReshape = dims[dims.length - 1] === reshapedDims[reshapedDims.length - 1];
  } else {
    isCheapReshape = dims[dims.length - 1] === reshapedDims[reshapedDims.length - 1] && dims[dims.length - 2] === reshapedDims[reshapedDims.length - 2];
  }
  return isCheapReshape;
}
reshapePacked.isReshapeCheap = isReshapeCheap;
function getReshapedInputCoords(shape2) {
  const strides = util_1$n.ShapeUtil.computeStrides(shape2);
  const coords = ["b", "r", "c"];
  const index = "index";
  const coordsFromIndexSnippet = strides.map((stride, i) => {
    const line1 = `int ${coords[i]} = ${index} / ${stride}`;
    const line2 = i === strides.length - 1 ? `int ${coords[i + 1]} = ${index} - ${coords[i]} * ${stride}` : `index -= ${coords[i]} * ${stride}`;
    return `${line1}; ${line2};`;
  }).join("");
  return `
    ivec3 inputCoordsFromReshapedOutCoords(int index) {
      ${coordsFromIndexSnippet}
      return ivec3(b, r, c);
    }
  `;
}
function getFlattenedIndexFrom3D(shape2) {
  const strides = util_1$n.ShapeUtil.computeStrides(shape2);
  return `
  int getFlattenedIndex(ivec3 coords) {
    // reverse y, z order
    return coords.x * ${strides[0]} + coords.z * ${strides[1]} + coords.y;
  }
`;
}
var uint8Encode = {};
Object.defineProperty(uint8Encode, "__esModule", { value: true });
uint8Encode.encodeAsUint8 = void 0;
const glsl_source_1$f = glslSource;
const types_1$n = types;
const encodeAsUint8 = (inferenceHandler2, input) => {
  const outputShape = input.shape;
  const glsl = glsl_source_1$f.getGlsl(inferenceHandler2.session.backend.glContext.version);
  const shaderSource = `
    const float FLOAT_MAX = 1.70141184e38;
    const float FLOAT_MIN = 1.17549435e-38;

    bool isNaN(float val) {
      return (val < 1.0 || 0.0 < val || val == 0.0) ? false : true;
    }

    highp vec4 encodeAsUint8(highp float v) {
      if (isNaN(v)) {
        return vec4(255, 255, 255, 255);
      }

      highp float av = abs(v);

      if(av < FLOAT_MIN) {
        return vec4(0.0, 0.0, 0.0, 0.0);
      } else if(v > FLOAT_MAX) {
        return vec4(0.0, 0.0, 128.0, 127.0) / 255.0;
      } else if(v < -FLOAT_MAX) {
        return vec4(0.0, 0.0,  128.0, 255.0) / 255.0;
      }

      highp vec4 c = vec4(0,0,0,0);

      highp float e = floor(log2(av));
      highp float m = exp2(fract(log2(av))) - 1.0;

      c[2] = floor(128.0 * m);
      m -= c[2] / 128.0;
      c[1] = floor(32768.0 * m);
      m -= c[1] / 32768.0;
      c[0] = floor(8388608.0 * m);

      highp float ebias = e + 127.0;
      c[3] = floor(ebias / 2.0);
      ebias -= c[3] * 2.0;
      c[2] += floor(ebias) * 128.0;

      c[3] += 128.0 * step(0.0, -v);

      return c / 255.0;
    }

    void main() {
      float value = ${glsl.texture2D}(X,TexCoords).r;
      ${glsl.output} = encodeAsUint8(value);
    }`;
  const programInfo = {
    name: "Uint8Encode",
    inputTypes: [types_1$n.TextureType.unpacked],
    inputNames: ["X"],
    output: { dims: outputShape, type: input.tensor.type, textureType: types_1$n.TextureType.downloadUint8AsFloat },
    shaderSource,
    hasMain: true
  };
  return inferenceHandler2.executeProgram(programInfo, [input.tensor]);
};
uint8Encode.encodeAsUint8 = encodeAsUint8;
var unpack = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createUnpackProgramInfoLoader = exports.createUnpackProgramInfo = void 0;
  const glsl_source_12 = glslSource;
  const types_12 = types;
  const utils_12 = utils;
  const packing_utils_12 = packingUtils;
  const unpackProgramMetadata = {
    name: "unpack",
    inputNames: ["A"],
    inputTypes: [types_12.TextureType.packed]
  };
  const createUnpackProgramInfo = (handler, input) => {
    const rank = input.dims.length;
    const channels = packing_utils_12.getChannels("rc", rank);
    const innerDims = channels.slice(-2);
    const coordsDataType = utils_12.getCoordsDataType(rank);
    const unpackChannel = packing_utils_12.unpackFromChannel();
    const isScalar = input.dims.length === 0;
    const sourceCoords = isScalar ? "" : getSourceCoords(rank, channels);
    const coords = rank <= 1 ? "rc" : `vec2(${innerDims.join(",")})`;
    const glsl = glsl_source_12.getGlsl(handler.session.backend.glContext.version);
    const shaderSource = `
    ${unpackChannel}
    void main() {
      ${coordsDataType} rc = getOutputCoords();

       // Sample the texture with the coords to get the rgba channel value.
       vec4 packedInput = getA(${sourceCoords});

       ${glsl.output} = vec4(getChannel(packedInput, ${coords}), 0, 0, 0);
     }
   `;
    return Object.assign(Object.assign({}, unpackProgramMetadata), { hasMain: true, output: { dims: input.dims, type: input.type, textureType: types_12.TextureType.unpacked }, shaderSource });
  };
  exports.createUnpackProgramInfo = createUnpackProgramInfo;
  const createUnpackProgramInfoLoader = (handler, input) => Object.assign(Object.assign({}, unpackProgramMetadata), { get: () => exports.createUnpackProgramInfo(handler, input) });
  exports.createUnpackProgramInfoLoader = createUnpackProgramInfoLoader;
  function getSourceCoords(rank, dims) {
    if (rank === 1) {
      return "rc";
    }
    let coords = "";
    for (let i = 0; i < rank; i++) {
      coords += dims[i];
      if (i < rank - 1) {
        coords += ",";
      }
    }
    return coords;
  }
})(unpack);
var textureLayout = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createTextureLayoutFromShape = exports.calculateTextureWidthAndHeight = exports.createTextureLayoutFromTextureType = void 0;
  const util_12 = util;
  const types_12 = types;
  const createTextureLayoutFromTextureType = (textureLayoutStrategy2, shape2, textureType) => {
    const channel = textureType === types_12.TextureType.unpacked || textureType === types_12.TextureType.unpackedReversed ? 1 : 4;
    const isPacked = textureType === types_12.TextureType.packed;
    const reverseWH = textureType === types_12.TextureType.unpackedReversed || textureType === types_12.TextureType.packed;
    const breakAxis = textureType === types_12.TextureType.packedLastDimension ? shape2.length - 1 : void 0;
    const unpackedShape = textureType === types_12.TextureType.packedLastDimension ? shape2.map((d, i) => i === shape2.length - 1 ? d * 4 : d) : void 0;
    return exports.createTextureLayoutFromShape(textureLayoutStrategy2, shape2, channel, unpackedShape, { isPacked, reverseWH, breakAxis });
  };
  exports.createTextureLayoutFromTextureType = createTextureLayoutFromTextureType;
  const calculateTextureWidthAndHeight = (textureLayoutStrategy2, shape2, textureType) => {
    const layout = exports.createTextureLayoutFromTextureType(textureLayoutStrategy2, shape2, textureType);
    return [layout.width, layout.height];
  };
  exports.calculateTextureWidthAndHeight = calculateTextureWidthAndHeight;
  const createTextureLayoutFromShape = (textureLayoutStrategy2, shape2, channels = 1, unpackedShape, prefs) => {
    const isPacked = !!(prefs && prefs.isPacked);
    const [width, height] = textureLayoutStrategy2.computeTextureWH(isPacked ? unpackedShape || shape2 : shape2, prefs);
    const rank = shape2.length;
    let inferredDims = shape2.slice(0);
    if (rank === 0) {
      inferredDims = [1];
    }
    if (channels === 1) {
      unpackedShape = shape2;
    } else if (isPacked) {
      if (channels !== 4) {
        throw new Error("a packed texture must be 4-channel");
      }
      unpackedShape = shape2;
      if (rank > 0) {
        inferredDims[rank - 1] = Math.ceil(inferredDims[rank - 1] / 2);
      }
      if (rank > 1) {
        inferredDims[rank - 2] = Math.ceil(inferredDims[rank - 2] / 2);
      }
    } else if (!unpackedShape) {
      throw new Error("Unpacked shape is needed when using channels > 1");
    }
    return {
      width,
      height,
      channels,
      isPacked,
      shape: inferredDims,
      strides: util_12.ShapeUtil.computeStrides(inferredDims),
      unpackedShape,
      reversedWH: prefs && prefs.reverseWH
    };
  };
  exports.createTextureLayoutFromShape = createTextureLayoutFromShape;
})(textureLayout);
Object.defineProperty(inferenceHandler, "__esModule", { value: true });
inferenceHandler.WebGLInferenceHandler = void 0;
const instrument_1$a = instrument;
const tensor_1$4 = tensor;
const util_1$m = util;
const pack_1 = pack;
const reshape_packed_1 = reshapePacked;
const uint8_encode_1 = uint8Encode;
const unpack_1 = unpack;
const texture_layout_1 = textureLayout;
const types_1$m = types;
const getProgramInfoUniqueKey = (programInfo, inputTextureDatas) => {
  const inputs = inputTextureDatas.map((texture) => `${texture.unpackedShape.join(",")};${texture.width}x${texture.height}`).join("_");
  let key = programInfo.name;
  if (programInfo.cacheHint) {
    key += "[" + programInfo.cacheHint + "]";
  }
  key += ":" + inputs;
  return key;
};
class WebGLInferenceHandler {
  constructor(session2) {
    this.session = session2;
    this.packedTextureDataCache = /* @__PURE__ */ new Map();
    this.unpackedTextureDataCache = /* @__PURE__ */ new Map();
  }
  calculateTextureWidthAndHeight(shape2, textureType) {
    return texture_layout_1.calculateTextureWidthAndHeight(this.session.layoutStrategy, shape2, textureType);
  }
  executeProgram(program, inputs) {
    if (inputs.length < program.inputNames.length) {
      throw new Error(`Input size mustn't be less than ${program.inputNames.length}.`);
    }
    if (program.inputNames.length !== program.inputTypes.length) {
      throw new Error("input names size does not match input types");
    }
    const inputTextureDatas = [];
    for (let i = 0; i < program.inputNames.length; ++i) {
      inputTextureDatas[i] = this.getOrCreateTextureData(inputs[i], program.inputTypes[i]);
    }
    const key = getProgramInfoUniqueKey(program, inputTextureDatas);
    let artifact = this.session.programManager.getArtifact(key);
    const programInfo = artifact ? artifact.programInfo : typeof program.get === "function" ? program.get() : program;
    const outputTextureLayout = texture_layout_1.createTextureLayoutFromTextureType(this.session.layoutStrategy, programInfo.output.dims, programInfo.output.textureType);
    const outputTextureData = this.createTextureData(outputTextureLayout, programInfo.output.type);
    if (!artifact) {
      artifact = this.session.programManager.build(programInfo, inputTextureDatas, outputTextureData);
      this.session.programManager.setArtifact(key, artifact);
    }
    this.runProgram(artifact, inputTextureDatas, outputTextureData);
    return outputTextureData;
  }
  run(program, inputs) {
    const outputTextureData = this.executeProgram(program, inputs);
    return outputTextureData.tensor;
  }
  runProgram(artifact, inputs, output) {
    for (let i = 0; i < inputs.length; ++i) {
      if (!!inputs[i].isPacked !== (artifact.programInfo.inputTypes[i] === types_1$m.TextureType.packed)) {
        throw new Error(`input[${i}] property packed inconsistent`);
      }
    }
    if (!!output.isPacked !== (artifact.programInfo.output.textureType === types_1$m.TextureType.packed)) {
      throw new Error("output property packed inconsistent");
    }
    this.session.programManager.run(artifact, inputs, output);
  }
  getOrCreateTextureData(tensor2, textureType) {
    let td = this.getTextureData(tensor2.dataId, textureType === types_1$m.TextureType.packed);
    if (!td) {
      td = this.getTextureData(tensor2.dataId, textureType !== types_1$m.TextureType.packed);
      if (td) {
        if (textureType === types_1$m.TextureType.packed) {
          return this.pack(td);
        } else {
          return this.unpack(td);
        }
      }
    }
    if (!td) {
      const layout = texture_layout_1.createTextureLayoutFromTextureType(this.session.layoutStrategy, tensor2.dims, textureType);
      if (textureType === types_1$m.TextureType.packedLastDimension) {
        const group = 1;
        const channels = 4;
        const shape2 = tensor2.dims;
        if (shape2.length === 4) {
          const adjustedKernelShape = [shape2[0], Math.ceil(shape2[1] * shape2[2] * shape2[3] / channels)];
          const adjustedLayout = texture_layout_1.createTextureLayoutFromTextureType(this.session.layoutStrategy, adjustedKernelShape, textureType);
          let buffer = tensor2.numberData;
          if (shape2[1] * shape2[2] * shape2[3] % channels !== 0) {
            const numFeatureMaps = shape2[0];
            const oldRowSize = shape2[1] * shape2[2] * shape2[3];
            const newRowSize = Math.ceil(oldRowSize * group / channels) * channels;
            const newSize = numFeatureMaps * newRowSize;
            buffer = new Float32Array(newSize);
            for (let f = 0; f < numFeatureMaps; ++f) {
              const oldOffset = f * oldRowSize;
              const newOffset = f * newRowSize + f % group * oldRowSize;
              buffer.set(tensor2.numberData.subarray(oldOffset, oldOffset + oldRowSize), newOffset);
            }
          }
          return this.createTextureData(adjustedLayout, tensor2.type, buffer, tensor2, 1);
        }
      }
      if (textureType === types_1$m.TextureType.packed) {
        const unpackedTextureLayout = texture_layout_1.createTextureLayoutFromShape(this.session.layoutStrategy, tensor2.dims, 1, [], { reverseWH: true });
        const unpackedTextureData = this.createTextureData(unpackedTextureLayout, tensor2.type, tensor2.numberData, tensor2, 1);
        td = this.pack(unpackedTextureData);
      } else {
        td = this.createTextureData(layout, tensor2.type, tensor2.numberData, tensor2, 1);
      }
    }
    return td;
  }
  createTextureDataFromLayoutBindTensor(layout, dataType, data, tensor2) {
    return this.createTextureData(layout, dataType, data, tensor2, 1);
  }
  createTextureData(layout, dataType, data, tensor2, usage) {
    instrument_1$a.Logger.verbose("InferenceHandler", `Creating TextureData: layout:[${JSON.stringify(layout)}]`);
    const texture = this.session.textureManager.createTextureFromLayout(dataType, layout, data, usage);
    return this.createTextureDataFromTexture(layout, dataType, texture, tensor2);
  }
  reshapeUnpacked(input, reshapedDims) {
    const inputTD = this.getOrCreateTextureData(input, types_1$m.TextureType.unpacked);
    const newTextureLayout = {
      channels: inputTD.channels,
      height: inputTD.height,
      width: inputTD.width,
      shape: reshapedDims.length !== 0 ? reshapedDims : [1],
      strides: util_1$m.ShapeUtil.computeStrides(reshapedDims),
      unpackedShape: reshapedDims
    };
    const newTextureData = this.createTextureDataFromTexture(newTextureLayout, input.type, inputTD.texture);
    return newTextureData.tensor;
  }
  reshapePacked(input, reshapedDims) {
    const inputTD = this.getOrCreateTextureData(input, types_1$m.TextureType.packed);
    if (reshape_packed_1.isReshapeCheap(input.dims, reshapedDims)) {
      const newTextureLayout = {
        channels: inputTD.channels,
        height: inputTD.height,
        width: inputTD.width,
        shape: reshapedDims.length !== 0 ? reshapedDims : [1],
        strides: util_1$m.ShapeUtil.computeStrides(reshapedDims),
        unpackedShape: reshapedDims,
        isPacked: true
      };
      const newTextureData = this.createTextureDataFromTexture(newTextureLayout, input.type, inputTD.texture);
      return newTextureData.tensor;
    }
    const squeezedInputShape = reshape_packed_1.processDims3D(input.dims);
    const squeezedOutputShape = reshape_packed_1.processDims3D(reshapedDims);
    const squeezedInputTensor = this.reshapePacked(input, squeezedInputShape);
    const squeezedOutputTensor = this.run(reshape_packed_1.createPackedReshape3DProgramInfoLoader(this, squeezedInputTensor, squeezedOutputShape), [squeezedInputTensor]);
    const outputTensor = this.reshapePacked(squeezedOutputTensor, reshapedDims);
    return outputTensor;
  }
  cast(input, type) {
    const inputTD = this.getOrCreateTextureData(input, types_1$m.TextureType.unpacked);
    const newTextureData = this.createTextureDataFromTexture(inputTD, type, inputTD.texture);
    return newTextureData.tensor;
  }
  createTextureDataFromTexture(layout, dataType, texture, tensor2, tensorId) {
    const textureData = Object.assign(Object.assign({}, layout), { tensor: tensor2 || new tensor_1$4.Tensor(layout.unpackedShape, dataType, (_id) => this.readTexture(textureData), async (_id) => this.readTextureAsync(textureData), void 0, tensorId), texture });
    this.setTextureData(textureData.tensor.dataId, textureData, layout.isPacked);
    return textureData;
  }
  getTextureData(tensorId, isPacked = false) {
    return this.session.isInitializer(tensorId) ? this.session.getTextureData(tensorId, isPacked) : isPacked ? this.packedTextureDataCache.get(tensorId) : this.unpackedTextureDataCache.get(tensorId);
  }
  setTextureData(tensorId, td, isPacked = false) {
    if (this.session.isInitializer(tensorId)) {
      this.session.setTextureData(tensorId, td, isPacked);
    } else {
      (isPacked ? this.packedTextureDataCache : this.unpackedTextureDataCache).set(tensorId, td);
    }
  }
  isTextureLayoutCached(tensor2, isPacked = false) {
    return !!this.getTextureData(tensor2.dataId, isPacked);
  }
  dispose() {
    this.session.textureManager.clearActiveTextures();
    this.packedTextureDataCache.forEach((td) => this.session.textureManager.releaseTexture(td));
    this.packedTextureDataCache = /* @__PURE__ */ new Map();
    this.unpackedTextureDataCache.forEach((td) => this.session.textureManager.releaseTexture(td));
    this.unpackedTextureDataCache = /* @__PURE__ */ new Map();
  }
  readTexture(textureData) {
    if (textureData.isPacked) {
      return this.readTexture(this.unpack(textureData));
    }
    if (!this.session.backend.glContext.isFloat32DownloadSupported) {
      return this.session.textureManager.readUint8TextureAsFloat(uint8_encode_1.encodeAsUint8(this, textureData));
    }
    return this.session.textureManager.readTexture(textureData, textureData.tensor.type, textureData.channels);
  }
  async readTextureAsync(textureData) {
    if (textureData.isPacked) {
      return this.readTextureAsync(this.unpack(textureData));
    }
    if (!this.session.backend.glContext.isFloat32DownloadSupported) {
      return this.session.textureManager.readUint8TextureAsFloat(uint8_encode_1.encodeAsUint8(this, textureData));
    }
    return this.session.textureManager.readTextureAsync(textureData, textureData.tensor.type, textureData.channels);
  }
  pack(input) {
    const outputTextureData = this.executeProgram(pack_1.createPackProgramInfoLoader(this, input.tensor), [input.tensor]);
    return outputTextureData;
  }
  unpack(input) {
    const outputTextureData = this.executeProgram(unpack_1.createUnpackProgramInfoLoader(this, input.tensor), [input.tensor]);
    return outputTextureData;
  }
}
inferenceHandler.WebGLInferenceHandler = WebGLInferenceHandler;
var opResolveRules = {};
var batchNormalization$1 = {};
var attributeWithCacheKey = {};
Object.defineProperty(attributeWithCacheKey, "__esModule", { value: true });
attributeWithCacheKey.createAttributeWithCacheKey = void 0;
class AttributeWithCacheKeyImpl {
  constructor(attribute2) {
    Object.assign(this, attribute2);
  }
  get cacheKey() {
    if (!this._cacheKey) {
      this._cacheKey = Object.getOwnPropertyNames(this).sort().map((name2) => `${this[name2]}`).join(";");
    }
    return this._cacheKey;
  }
}
const createAttributeWithCacheKey = (attribute2) => new AttributeWithCacheKeyImpl(attribute2);
attributeWithCacheKey.createAttributeWithCacheKey = createAttributeWithCacheKey;
Object.defineProperty(batchNormalization$1, "__esModule", { value: true });
batchNormalization$1.parseBatchNormalizationAttributes = batchNormalization$1.batchNormalization = void 0;
const attribute_with_cache_key_1$a = attributeWithCacheKey;
const glsl_source_1$e = glslSource;
const types_1$l = types;
const batchNormalizationProgramMetadata = {
  name: "BatchNormalization",
  inputNames: ["A", "Scale", "B", "Mean", "Variance"],
  inputTypes: [types_1$l.TextureType.unpacked, types_1$l.TextureType.unpacked, types_1$l.TextureType.unpacked, types_1$l.TextureType.unpacked, types_1$l.TextureType.unpacked]
};
const batchNormalization = (inferenceHandler2, inputs, attributes) => {
  validateInputs$i(inputs);
  const output = inferenceHandler2.run(Object.assign(Object.assign({}, batchNormalizationProgramMetadata), { cacheHint: attributes.cacheKey, get: () => createBatchNormalizationProgramInfo(inferenceHandler2, inputs, attributes) }), inputs);
  return [output];
};
batchNormalization$1.batchNormalization = batchNormalization;
const parseBatchNormalizationAttributes = (node) => {
  const epsilon = node.attributes.getFloat("epsilon", 1e-5);
  const momentum = node.attributes.getFloat("momentum", 0.9);
  const spatial = node.attributes.getInt("spatial", 1);
  return attribute_with_cache_key_1$a.createAttributeWithCacheKey({ epsilon, momentum, spatial });
};
batchNormalization$1.parseBatchNormalizationAttributes = parseBatchNormalizationAttributes;
const createBatchNormalizationProgramInfo = (inferenceHandler2, inputs, attributes) => {
  const glsl = glsl_source_1$e.getGlsl(inferenceHandler2.session.backend.glContext.version);
  const rank = inputs[0].dims.length;
  const [scaleWidth, scaleHeight] = inferenceHandler2.calculateTextureWidthAndHeight(inputs[1].dims, types_1$l.TextureType.unpacked);
  const shaderSource = `
  float process(int[${rank}] indices) {
    vec2 position = offsetToCoords(indices[1], ${scaleWidth}, ${scaleHeight});
    float scale = getColorAsFloat(${glsl.texture2D}(Scale, position));
    float mean = getColorAsFloat(${glsl.texture2D}(Mean, position));
    float variance = getColorAsFloat(${glsl.texture2D}(Variance, position));
    float b = getColorAsFloat(${glsl.texture2D}(B, position));

    return scale * ( (_A(indices) - mean) / sqrt(variance + float(${attributes.epsilon})) ) + b;
  }`;
  return Object.assign(Object.assign({}, batchNormalizationProgramMetadata), { output: { dims: inputs[0].dims, type: inputs[0].type, textureType: types_1$l.TextureType.unpacked }, shaderSource });
};
const validateInputs$i = (inputs) => {
  if (!inputs || inputs.length !== 5) {
    throw new Error("BatchNormalization requires 5 inputs.");
  }
  const X = inputs[0];
  const scale = inputs[1];
  const B = inputs[2];
  const mean = inputs[3];
  const var_ = inputs[4];
  if (X.dims.length < 3 || scale.dims.length !== 1 || B.dims.length !== 1 || mean.dims.length !== 1 || var_.dims.length !== 1) {
    throw new Error("invalid input shape.");
  }
  if (scale.dims[0] !== X.dims[1] || B.dims[0] !== X.dims[1] || mean.dims[0] !== X.dims[1] || var_.dims[0] !== X.dims[1]) {
    throw new Error("invalid input shape.");
  }
  if (X.type !== "float32" && X.type !== "float64" || scale.type !== "float32" && scale.type !== "float64" || B.type !== "float32" && B.type !== "float64" || mean.type !== "float32" && mean.type !== "float64" || var_.type !== "float32" && var_.type !== "float64") {
    throw new Error("invalid input tensor types.");
  }
};
var binaryOp = {};
var glslDefinitions = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TopologicalSortGlslRoutines = exports.GlslLibRoutineNode = exports.GlslLibRoutine = exports.GlslLib = exports.GlslContext = exports.FunctionType = void 0;
  (function(FunctionType) {
    FunctionType[FunctionType["ValueBased"] = 0] = "ValueBased";
    FunctionType[FunctionType["Positional"] = 1] = "Positional";
  })(exports.FunctionType || (exports.FunctionType = {}));
  class GlslContext {
    constructor(glContext, programInfo, inputTextureLayouts, outputTextureLayout) {
      this.glContext = glContext;
      this.programInfo = programInfo;
      this.inputTextureLayouts = inputTextureLayouts;
      this.outputTextureLayout = outputTextureLayout;
    }
  }
  exports.GlslContext = GlslContext;
  class GlslLib {
    constructor(context) {
      this.context = context;
    }
  }
  exports.GlslLib = GlslLib;
  class GlslLibRoutine {
    constructor(routineBody, dependencies) {
      this.routineBody = routineBody;
      this.dependencies = dependencies;
    }
  }
  exports.GlslLibRoutine = GlslLibRoutine;
  class GlslLibRoutineNode {
    constructor(name2, routineBody, dependencies) {
      this.name = name2;
      if (dependencies) {
        this.dependencies = dependencies;
      } else {
        this.dependencies = [];
      }
      if (routineBody) {
        this.routineBody = routineBody;
      }
    }
    addDependency(node) {
      if (node) {
        this.dependencies.push(node);
      }
    }
  }
  exports.GlslLibRoutineNode = GlslLibRoutineNode;
  class TopologicalSortGlslRoutines {
    static returnOrderedNodes(nodes) {
      if (!nodes || nodes.length === 0) {
        return [];
      }
      if (nodes.length === 1) {
        return nodes;
      }
      const cycleCheck = /* @__PURE__ */ new Set();
      const alreadyTraversed = /* @__PURE__ */ new Set();
      const result = new Array();
      this.createOrderedNodes(nodes, cycleCheck, alreadyTraversed, result);
      return result;
    }
    static createOrderedNodes(graphNodes, cycleCheck, alreadyTraversed, result) {
      for (let i = 0; i < graphNodes.length; ++i) {
        this.dfsTraverse(graphNodes[i], cycleCheck, alreadyTraversed, result);
      }
    }
    static dfsTraverse(root, cycleCheck, alreadyTraversed, result) {
      if (!root || alreadyTraversed.has(root.name)) {
        return;
      }
      if (cycleCheck.has(root.name)) {
        throw new Error("Cyclic dependency detected. Can't topologically sort routines needed for shader.");
      }
      cycleCheck.add(root.name);
      const dependencies = root.dependencies;
      if (dependencies && dependencies.length > 0) {
        for (let i = 0; i < dependencies.length; ++i) {
          this.dfsTraverse(dependencies[i], cycleCheck, alreadyTraversed, result);
        }
      }
      result.push(root);
      alreadyTraversed.add(root.name);
      cycleCheck.delete(root.name);
    }
  }
  exports.TopologicalSortGlslRoutines = TopologicalSortGlslRoutines;
})(glslDefinitions);
Object.defineProperty(binaryOp, "__esModule", { value: true });
binaryOp.xor = binaryOp.sub = binaryOp.pRelu = binaryOp.pow = binaryOp.or = binaryOp.mul = binaryOp.less = binaryOp.greater = binaryOp.equal = binaryOp.div = binaryOp.and = binaryOp.add = binaryOp.glslPRelu = binaryOp.glslPow = binaryOp.glslXor = binaryOp.glslOr = binaryOp.glslAnd = binaryOp.glslLess = binaryOp.glslGreater = binaryOp.glslEqual = binaryOp.glslSub = binaryOp.glslMul = binaryOp.glslDiv = binaryOp.glslAdd = void 0;
const util_1$l = util;
const glsl_definitions_1$6 = glslDefinitions;
const glsl_source_1$d = glslSource;
const types_1$k = types;
function glslAdd() {
  const name2 = "add_";
  const body = `
  float ${name2}(float a, float b) {
    return a + b;
  }
  vec4 ${name2}(vec4 v1, vec4 v2) {
    return v1 + v2;
  }
  `;
  return { body, name: name2, type: glsl_definitions_1$6.FunctionType.ValueBased };
}
binaryOp.glslAdd = glslAdd;
function glslDiv() {
  const name2 = "div_";
  const body = `
  float ${name2}(float a, float b) {
    return a / b;
  }
  vec4 ${name2}(vec4 v1, vec4 v2) {
    return v1 / v2;
  }
  `;
  return { body, name: name2, type: glsl_definitions_1$6.FunctionType.ValueBased };
}
binaryOp.glslDiv = glslDiv;
function glslMul() {
  const name2 = "mul_";
  const body = `
  float ${name2}(float a, float b) {
    return a * b;
  }
  vec4 ${name2}(vec4 v1, vec4 v2) {
    return v1 * v2;
  }
  `;
  return { body, name: name2, type: glsl_definitions_1$6.FunctionType.ValueBased };
}
binaryOp.glslMul = glslMul;
function glslSub() {
  const name2 = "sub_";
  const body = `
  float ${name2}(float a, float b) {
    return a - b;
  }
  vec4 ${name2}(vec4 v1, vec4 v2) {
    return v1 - v2;
  }
  `;
  return { body, name: name2, type: glsl_definitions_1$6.FunctionType.ValueBased };
}
binaryOp.glslSub = glslSub;
function glslEqual() {
  const name2 = "equal_";
  const body = `
  float ${name2}(float a, float b) {
    return float(a == b);
  }
  vec4 ${name2}(vec4 v1, vec4 v2) {
    return vec4(equal(v1, v2));
  }
  `;
  return { body, name: name2, type: glsl_definitions_1$6.FunctionType.ValueBased };
}
binaryOp.glslEqual = glslEqual;
function glslGreater() {
  const name2 = "greater_";
  const body = `
  float ${name2}(float a, float b) {
    return float(a > b);
  }
  vec4 ${name2}(vec4 v1, vec4 v2) {
    return vec4( v1.r > v2.r ,
      v1.g > v2.g,
      v1.b > v2.b,
      v1.a > v2.a );
  }
  `;
  return { body, name: name2, type: glsl_definitions_1$6.FunctionType.ValueBased };
}
binaryOp.glslGreater = glslGreater;
function glslLess() {
  const name2 = "less_";
  const body = `
  float ${name2}(float a, float b) {
    return float(a < b);
  }
  vec4 ${name2}(vec4 v1, vec4 v2) {
    return vec4( v1.r < v2.r ,
                v1.g < v2.g,
                v1.b < v2.b,
                v1.a < v2.a );
  }
  `;
  return { body, name: name2, type: glsl_definitions_1$6.FunctionType.ValueBased };
}
binaryOp.glslLess = glslLess;
function glslAnd() {
  const name2 = "and_";
  const body = `
  float ${name2}(float a, float b) {
    return float( bool(a) && bool(b) );
  }
  vec4 ${name2}(vec4 v1, vec4 v2) {
    bvec4 b1 = bvec4(v1);
    bvec4 b2 = bvec4(v2);
    return vec4( b1.r && b2.r ,
                b1.g && b2.g,
                b1.b && b2.b,
                b1.a && b2.a );
  }
  `;
  return { body, name: name2, type: glsl_definitions_1$6.FunctionType.ValueBased };
}
binaryOp.glslAnd = glslAnd;
function glslOr() {
  const name2 = "or_";
  const body = `
  float ${name2}(float a, float b) {
    return float( bool(a) || bool(b) );
  }
  vec4 ${name2}(vec4 v1, vec4 v2) {
    bvec4 b1 = bvec4(v1);
    bvec4 b2 = bvec4(v2);
    return vec4( b1.r || b2.r ,
                b1.g || b2.g,
                b1.b || b2.b,
                b1.a || b2.a );
  }
  `;
  return { body, name: name2, type: glsl_definitions_1$6.FunctionType.ValueBased };
}
binaryOp.glslOr = glslOr;
function glslXor() {
  const name2 = "xor_";
  const body = `
  float ${name2}(float a, float b) {
    return float( bool(a) ^^ bool(b) );
  }
  vec4 ${name2}(vec4 v1, vec4 v2) {
    bvec4 b1 = bvec4(v1);
    bvec4 b2 = bvec4(v2);
    return vec4( b1.r ^^ b2.r ,
                b1.g ^^ b2.g,
                b1.b ^^ b2.b,
                b1.a ^^ b2.a );
  }
  `;
  return { body, name: name2, type: glsl_definitions_1$6.FunctionType.ValueBased };
}
binaryOp.glslXor = glslXor;
function glslPow() {
  return glslBuiltinBinary("pow");
}
binaryOp.glslPow = glslPow;
function glslPRelu() {
  const name2 = "prelu_";
  const body = `
  float ${name2}(float a, float b) {
    return a < 0.0 ? a * b: a;
  }
  vec4 ${name2}(vec4 v1, vec4 v2) {
    return vec4(
      v1.r < 0.0 ? v1.r * v2.r: v1.r,
      v1.g < 0.0 ? v1.g * v2.g: v1.g,
      v1.b < 0.0 ? v1.b * v2.b: v1.b,
      v1.a < 0.0 ? v1.a * v2.a: v1.a
      );
  }
  `;
  return { body, name: name2, type: glsl_definitions_1$6.FunctionType.ValueBased };
}
binaryOp.glslPRelu = glslPRelu;
function glslBuiltinBinary(fname) {
  const name2 = `${fname}_`;
  const body = `
  float ${name2}(float a, float b) {
    return ${fname}(a, b);
  }
  vec4 ${name2}(vec4 v1, vec4 v2) {
    return ${fname}(v1, v2);
  }
  `;
  return { body, name: name2, type: glsl_definitions_1$6.FunctionType.ValueBased };
}
const createBinaryProgramInfoLoader = (handler, inputs, glslFunc, outputTensorType = inputs[0].type, cacheKey) => {
  const textureType = handler.session.pack ? types_1$k.TextureType.packed : types_1$k.TextureType.unpacked;
  return {
    name: glslFunc.name,
    inputNames: ["A", "B"],
    inputTypes: [textureType, textureType],
    cacheHint: cacheKey,
    get: () => createBinaryProgramInfo(handler, inputs, glslFunc, outputTensorType)
  };
};
const createBinaryProgramInfo = (handler, inputs, glslFunc, outputTensorType = inputs[0].type) => {
  const textureType = handler.session.pack ? types_1$k.TextureType.packed : types_1$k.TextureType.unpacked;
  const isBroadcast = !util_1$l.ShapeUtil.areEqual(inputs[0].dims, inputs[1].dims);
  let outputShape = inputs[0].dims;
  const usePackedTexture = handler.session.pack;
  if (isBroadcast) {
    const calculatedShape = util_1$l.BroadcastUtil.calcShape(inputs[0].dims, inputs[1].dims, false);
    if (!calculatedShape) {
      throw new Error("Can't perform binary op on the given tensors");
    }
    outputShape = calculatedShape;
    const outputRank = outputShape.length;
    const aRank = inputs[0].dims.length !== 0 ? inputs[0].dims.length : 1;
    const bRank = inputs[1].dims.length !== 0 ? inputs[1].dims.length : 1;
    const aBcast = inputs[0].dims.length !== 0 ? "bcastIndices_A(indices, aindices);" : "aindices[0] = 0;";
    const bBcast = inputs[1].dims.length !== 0 ? "bcastIndices_B(indices, bindices);" : "bindices[0] = 0;";
    const glsl2 = glsl_source_1$d.getGlsl(handler.session.backend.glContext.version);
    const shaderSource2 = usePackedTexture ? `
      ${glslFunc.body}
      void main() {
        vec4 a = getAAtOutCoords();
        vec4 b = getBAtOutCoords();
        vec4 result = ${glslFunc.name}(a, b);
        ${glsl2.output} = result;
      }` : `
      ${glslFunc.body}
      float process(int indices[${outputRank}]) {
        int aindices[${aRank}];
        int bindices[${bRank}];
        ${aBcast}
        ${bBcast}
        return ${glslFunc.name}(_A(aindices), _B(bindices));
      }`;
    return {
      name: glslFunc.name,
      inputNames: ["A", "B"],
      inputTypes: [textureType, textureType],
      output: { dims: outputShape, type: outputTensorType, textureType },
      shaderSource: shaderSource2,
      hasMain: usePackedTexture
    };
  }
  const glsl = glsl_source_1$d.getGlsl(handler.session.backend.glContext.version);
  const shaderSource = `
    ${glslFunc.body}
    void main() {
      vec4 v1 = ${glsl.texture2D}(A, TexCoords);
      vec4 v2 = ${glsl.texture2D}(B, TexCoords);
      vec4 result = ${glslFunc.name}(v1, v2);
      ${glsl.output} = result;
    }
    `;
  return {
    name: glslFunc.name,
    inputNames: ["A", "B"],
    inputTypes: [textureType, textureType],
    output: { dims: inputs[0].dims, type: outputTensorType, textureType },
    shaderSource,
    hasMain: true
  };
};
const add = (handler, inputs) => [handler.run(createBinaryProgramInfoLoader(handler, inputs, glslAdd()), inputs)];
binaryOp.add = add;
const and = (handler, inputs) => [handler.run(createBinaryProgramInfoLoader(handler, inputs, glslAnd(), "bool"), inputs)];
binaryOp.and = and;
const div = (handler, inputs) => [handler.run(createBinaryProgramInfoLoader(handler, inputs, glslDiv()), inputs)];
binaryOp.div = div;
const equal = (handler, inputs) => [handler.run(createBinaryProgramInfoLoader(handler, inputs, glslEqual(), "bool"), inputs)];
binaryOp.equal = equal;
const greater = (handler, inputs) => [handler.run(createBinaryProgramInfoLoader(handler, inputs, glslGreater(), "bool"), inputs)];
binaryOp.greater = greater;
const less = (handler, inputs) => [handler.run(createBinaryProgramInfoLoader(handler, inputs, glslLess(), "bool"), inputs)];
binaryOp.less = less;
const mul = (handler, inputs) => [handler.run(createBinaryProgramInfoLoader(handler, inputs, glslMul()), inputs)];
binaryOp.mul = mul;
const or = (handler, inputs) => [handler.run(createBinaryProgramInfoLoader(handler, inputs, glslOr(), "bool"), inputs)];
binaryOp.or = or;
const pow = (handler, inputs) => [handler.run(createBinaryProgramInfoLoader(handler, inputs, glslPow()), inputs)];
binaryOp.pow = pow;
const pRelu = (handler, inputs) => [handler.run(createBinaryProgramInfoLoader(handler, inputs, glslPRelu()), inputs)];
binaryOp.pRelu = pRelu;
const sub = (handler, inputs) => [handler.run(createBinaryProgramInfoLoader(handler, inputs, glslSub()), inputs)];
binaryOp.sub = sub;
const xor = (handler, inputs) => [handler.run(createBinaryProgramInfoLoader(handler, inputs, glslXor(), "bool"), inputs)];
binaryOp.xor = xor;
var cast$1 = {};
Object.defineProperty(cast$1, "__esModule", { value: true });
cast$1.parseCastAttributes = cast$1.cast = void 0;
const util_1$k = util;
const cast = (handler, inputs, to) => {
  validateInputs$h(inputs);
  return [handler.cast(inputs[0], to)];
};
cast$1.cast = cast;
const parseCastAttributes = (node) => util_1$k.ProtoUtil.tensorDataTypeFromProto(node.attributes.getInt("to"));
cast$1.parseCastAttributes = parseCastAttributes;
const validateInputs$h = (inputs) => {
  if (!inputs || inputs.length !== 1) {
    throw new Error("Cast requires 1 input.");
  }
  if (inputs[0].type === "string") {
    throw new Error("Invalid input type.");
  }
};
var concat$1 = {};
var concatPacked = {};
Object.defineProperty(concatPacked, "__esModule", { value: true });
concatPacked.createPackedConcatProgramInfoLoader = void 0;
const glsl_source_1$c = glslSource;
const types_1$j = types;
const utils_1$5 = utils;
const packing_utils_1$2 = packingUtils;
const createPackedConcatProgramMetadata = (inputCount, cacheHint) => ({
  name: "Concat (packed)",
  inputNames: Array.from({ length: inputCount }, (v, i) => `X${i}`),
  inputTypes: Array(inputCount).fill(types_1$j.TextureType.packed),
  cacheHint
});
const createPackedConcatProgramInfo = (handler, metadata, inputs, axis) => {
  const inputShape = inputs[0].dims.slice();
  if (axis >= inputShape.length || axis < -1 * inputShape.length) {
    throw new Error("axis specified for concat doesn't match input dimensionality");
  }
  if (axis < 0) {
    axis = inputShape.length + axis;
  }
  const outputShape = inputShape.slice(0);
  for (let i = 1; i < inputs.length; i++) {
    const dataNShape = inputs[i].dims.slice();
    for (let axisIndex = 0; axisIndex < inputShape.length; axisIndex++) {
      if (axisIndex === axis) {
        outputShape[axis] += dataNShape[axisIndex];
      } else if (inputShape[axisIndex] !== dataNShape[axisIndex]) {
        throw new Error("non concat dimensions must match");
      }
    }
  }
  const rank = outputShape.length;
  const coords = packing_utils_1$2.getChannels("coords", rank);
  const dtype = utils_1$5.getCoordsDataType(rank);
  const unpackChannel = packing_utils_1$2.unpackFromChannel();
  const shapes = inputs.map((i) => i.dims);
  const channels = utils_1$5.getGlChannels(rank);
  const offsets = new Array(shapes.length - 1);
  offsets[0] = shapes[0][axis];
  for (let i = 1; i < offsets.length; i++) {
    offsets[i] = offsets[i - 1] + shapes[i][axis];
  }
  const channel = channels[axis];
  const lastChannels = channels.slice(-2);
  const allChannels = channels.join();
  let getValueSnippet = `if (${channel} < ${offsets[0]}) {
        return getChannel(
            getX0(${allChannels}), vec2(${lastChannels.join()}));
        }`;
  for (let i = 1; i < offsets.length; i++) {
    const shift2 = offsets[i - 1];
    getValueSnippet += `
            if (${channel} < ${offsets[i]}  && ${channel} >= ${offsets[i - 1]}) {
              return getChannel(
                getX${i}(${getShiftedChannelsSnippet(channels, channel, shift2)}),
                vec2(${getShiftedChannelsSnippet(lastChannels, channel, shift2)}));
            }`;
  }
  const lastIndex = offsets.length;
  const shift = offsets[offsets.length - 1];
  getValueSnippet += `
            return getChannel(
              getX${lastIndex}(${getShiftedChannelsSnippet(channels, channel, shift)}),
              vec2(${getShiftedChannelsSnippet(lastChannels, channel, shift)}));`;
  const glsl = glsl_source_1$c.getGlsl(handler.session.backend.glContext.version);
  const shaderSource = `
          ${unpackChannel}
          float getValue(${channels.map((x) => "int " + x)}) {
            ${getValueSnippet}
          }

          void main() {
            ${dtype} coords = getOutputCoords();
            int lastDim = coords.${channels[rank - 1]};
            coords.${channels[rank - 1]} = coords.${channels[rank - 2]};
            coords.${channels[rank - 2]} = lastDim;

            vec4 result = vec4(getValue(${coords}), 0., 0., 0.);

            ${coords[rank - 1]} = ${coords[rank - 1]} + 1;
            if (${coords[rank - 1]} < ${outputShape[rank - 1]}) {
              result.g = getValue(${coords});
            }

            ${coords[rank - 2]} = ${coords[rank - 2]} + 1;
            if (${coords[rank - 2]} < ${outputShape[rank - 2]}) {
              result.a = getValue(${coords});
            }

            ${coords[rank - 1]} = ${coords[rank - 1]} - 1;
            if (${coords[rank - 2]} < ${outputShape[rank - 2]} &&
                ${coords[rank - 1]} < ${outputShape[rank - 1]}) {
              result.b = getValue(${coords});
            }
            ${glsl.output} = result;
          }
        `;
  return Object.assign(Object.assign({}, metadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$j.TextureType.packed }, shaderSource, hasMain: true });
};
const createPackedConcatProgramInfoLoader = (handler, inputs, attributes) => {
  const metadata = createPackedConcatProgramMetadata(inputs.length, attributes.cacheKey);
  return Object.assign(Object.assign({}, metadata), { get: () => createPackedConcatProgramInfo(handler, metadata, inputs, attributes.axis) });
};
concatPacked.createPackedConcatProgramInfoLoader = createPackedConcatProgramInfoLoader;
const getShiftedChannelsSnippet = (channels, channel, shift) => {
  const channelIdx = channels.indexOf(channel);
  const res = channels.map((c, idx) => {
    if (idx === channelIdx) {
      return `${c} - ${shift}`;
    } else {
      return c;
    }
  });
  return res.join();
};
Object.defineProperty(concat$1, "__esModule", { value: true });
concat$1.parseConcatAttributes = concat$1.concat = void 0;
const attribute_with_cache_key_1$9 = attributeWithCacheKey;
const types_1$i = types;
const concat_packed_1 = concatPacked;
const concat = (inferenceHandler2, inputs, attributes) => {
  validateInputs$g(inputs);
  if (inferenceHandler2.session.pack && inputs[0].dims.length > 1) {
    const output = inferenceHandler2.run(concat_packed_1.createPackedConcatProgramInfoLoader(inferenceHandler2, inputs, attributes), inputs);
    return [output];
  } else {
    const output = inferenceHandler2.run(createUnpackedConcatProgramInfoLoader(inferenceHandler2, inputs, attributes), inputs);
    return [output];
  }
};
concat$1.concat = concat;
const createUnpackedConcatProgramMetadata = (inputCount, cacheHint) => ({
  name: "Concat",
  inputNames: Array.from({ length: inputCount }, (v, i) => `X${i}`),
  inputTypes: Array(inputCount).fill(types_1$i.TextureType.unpacked),
  cacheHint
});
const createUnpackedConcatProgramInfo = (handler, metadata, inputs, axis) => {
  const inputShape = inputs[0].dims.slice();
  if (axis >= inputShape.length || axis < -1 * inputShape.length) {
    throw new Error("axis specified for concat doesn't match input dimensionality");
  }
  if (axis < 0) {
    axis = inputShape.length + axis;
  }
  const outputShape = inputShape.slice(0);
  for (let i = 1; i < inputs.length; i++) {
    const dataNShape = inputs[i].dims.slice();
    for (let axisIndex = 0; axisIndex < inputShape.length; axisIndex++) {
      if (axisIndex === axis) {
        outputShape[axis] += dataNShape[axisIndex];
      } else if (inputShape[axisIndex] !== dataNShape[axisIndex]) {
        throw new Error("non concat dimensions must match");
      }
    }
  }
  const rank = outputShape.length;
  const sizeInConcatAxis = new Array(inputs.length);
  let previousSum = 0;
  for (let i = 0; i < sizeInConcatAxis.length; ++i) {
    previousSum += inputs[i].dims[axis];
    sizeInConcatAxis[i] = previousSum;
  }
  let getTextureIndexWhereDataResidesMethod = "";
  if (inputs.length < 5) {
    getTextureIndexWhereDataResidesMethod = getTextureIndexWhereDataResidesLinearSearch(sizeInConcatAxis);
  } else {
    getTextureIndexWhereDataResidesMethod = getTextureIndexWhereDataResidesBinarySearch(sizeInConcatAxis);
  }
  const fetchDataFromCorrectTextureMethod = getFetchDataFromCorrectTextureMethod(inputs.length, rank);
  const getSizeInConcatAxisValueFromIndexMethod = getGetSizeInConcatAxisValueFromIndexMethod(sizeInConcatAxis);
  const shaderSource = `
        ${fetchDataFromCorrectTextureMethod}
        ${getSizeInConcatAxisValueFromIndexMethod}
        ${getTextureIndexWhereDataResidesMethod}
        float process(int indices[${rank}]) {
          int textureIndex = getTextureWhereDataResides (indices[${axis}]);

          if(textureIndex != 0) {
            indices[${axis}] = indices[${axis}] - int(getSizeInConcatAxisValueFromIndex(textureIndex-int(1)));
          }

          return fetchDataFromCorrectTexture(textureIndex, indices);
        }`;
  return Object.assign(Object.assign({}, metadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$i.TextureType.unpacked }, shaderSource });
};
const createUnpackedConcatProgramInfoLoader = (handler, inputs, attributes) => {
  const metadata = createUnpackedConcatProgramMetadata(inputs.length, attributes.cacheKey);
  return Object.assign(Object.assign({}, metadata), { get: () => createUnpackedConcatProgramInfo(handler, metadata, inputs, attributes.axis) });
};
const getTextureIndexWhereDataResidesLinearSearch = (sizeInConcatAxis) => {
  const searchAxis = sizeInConcatAxis.map((size, i) => `if(index<${size}) {return ${i};}
`);
  return `int getTextureWhereDataResides(int index) {
      ${searchAxis.join("")}
    }`;
};
const getTextureIndexWhereDataResidesBinarySearch = (sizeInConcatAxis) => getTextureIndexWhereDataResidesLinearSearch(sizeInConcatAxis);
const getFetchDataFromCorrectTextureMethod = (numberOfTensors, tensorRank) => {
  const codeLines = [`float fetchDataFromCorrectTexture(int textureIndex, int indices[${tensorRank}]) {`];
  for (let i = 0; i < numberOfTensors; ++i) {
    if (i === 0) {
      codeLines.push(`	if (textureIndex == ${i}) { return _X${i}(indices); }`);
    } else if (i === numberOfTensors - 1) {
      codeLines.push(`	else { return _X${i}(indices); }`);
    } else {
      codeLines.push(`	else if (textureIndex == ${i}) { return _X${i}(indices); }`);
    }
  }
  codeLines.push("	}");
  return codeLines.join("\n");
};
const getGetSizeInConcatAxisValueFromIndexMethod = (sizeInConcatAxis) => {
  const codeLines = ["int getSizeInConcatAxisValueFromIndex(int index) {"];
  for (let i = 0; i < sizeInConcatAxis.length; ++i) {
    if (i === 0) {
      codeLines.push(`	if (index == ${i}) { return ${sizeInConcatAxis[i]}; }`);
    } else if (i === sizeInConcatAxis.length - 1) {
      codeLines.push(`	else { return ${sizeInConcatAxis[i]}; }`);
    } else {
      codeLines.push(`	else if (index == ${i}) { return ${sizeInConcatAxis[i]}; }`);
    }
  }
  codeLines.push("	}");
  return codeLines.join("\n");
};
const parseConcatAttributes = (node) => attribute_with_cache_key_1$9.createAttributeWithCacheKey({ axis: node.attributes.getInt("axis") });
concat$1.parseConcatAttributes = parseConcatAttributes;
const validateInputs$g = (inputs) => {
  if (!inputs || inputs.length < 1) {
    throw new Error("too few inputs");
  }
  const inputType = inputs[0].type;
  const inputDimensionality = inputs[0].dims.length;
  if (inputType === "string") {
    throw new Error("string tensor is not supported yet");
  }
  for (const input of inputs) {
    if (input.type !== inputType) {
      throw new Error("input tensors should be one type");
    }
    if (input.dims.length !== inputDimensionality) {
      throw new Error("input tensors should have the same shape");
    }
  }
};
var conv = {};
var convGrouped = {};
var fuseUtils = {};
var unaryOp = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.tanh = exports.tan = exports.sqrt = exports.sin = exports.sigmoid = exports.relu = exports.not = exports.neg = exports.log = exports.parseLeakyReluAttributes = exports.leakyRelu = exports.identity = exports.floor = exports.exp = exports.parseEluAttributes = exports.elu = exports.cos = exports.ceil = exports.clipV11 = exports.parseClipAttributes = exports.clip = exports.atan = exports.asin = exports.acos = exports.abs = exports.glslTanh = exports.glslTan = exports.glslSqrt = exports.glslSigmoid = exports.glslRelu = exports.glslSin = exports.glslNot = exports.glslNeg = exports.glslLog = exports.glslLeakyRelu = exports.glslIdentity = exports.glslClip = exports.glslFloor = exports.glslExp = exports.glslElu = exports.glslCos = exports.glslCeil = exports.glslAtan = exports.glslAsin = exports.glslAcos = exports.glslAbs = void 0;
  const attribute_with_cache_key_12 = attributeWithCacheKey;
  const util_12 = util;
  const glsl_definitions_12 = glslDefinitions;
  const glsl_source_12 = glslSource;
  const types_12 = types;
  function glslAbs() {
    return glslBuiltinUnary("abs");
  }
  exports.glslAbs = glslAbs;
  function glslAcos() {
    return glslBuiltinUnary("acos");
  }
  exports.glslAcos = glslAcos;
  function glslAsin() {
    return glslBuiltinUnary("asin");
  }
  exports.glslAsin = glslAsin;
  function glslAtan() {
    return glslBuiltinUnary("atan");
  }
  exports.glslAtan = glslAtan;
  function glslCeil() {
    return glslBuiltinUnary("ceil");
  }
  exports.glslCeil = glslCeil;
  function glslCos() {
    return glslBuiltinUnary("cos");
  }
  exports.glslCos = glslCos;
  function glslElu(alpha) {
    const name2 = "elu";
    const body = `
  const float alpha = float(${alpha});

  float ${name2}_(float a) {
    return a >= 0.0 ? a: (exp(a) - 1.0) * alpha;
  }
  vec4 ${name2}_(vec4 v) {
    return vec4(${name2}_(v.x), ${name2}_(v.y), ${name2}_(v.z), ${name2}_(v.w));
  }
  `;
    return { body, name: name2, type: glsl_definitions_12.FunctionType.ValueBased };
  }
  exports.glslElu = glslElu;
  function glslExp() {
    return glslBuiltinUnary("exp");
  }
  exports.glslExp = glslExp;
  function glslFloor() {
    return glslBuiltinUnary("floor");
  }
  exports.glslFloor = glslFloor;
  function glslClip(min, max) {
    const name2 = "clip";
    const body = `
  const float min = float(${min});
  const float max = float(${max});

  float ${name2}_(float a) {
    return clamp(a, min, max);
  }
  vec4 ${name2}_(vec4 v) {
    return clamp(v, min, max);
  }
  `;
    return { body, name: name2, type: glsl_definitions_12.FunctionType.ValueBased };
  }
  exports.glslClip = glslClip;
  function glslIdentity() {
    const name2 = "indentity";
    const body = `
  float ${name2}_(float a) {
    return a;
  }
  vec4 ${name2}_(vec4 v) {
    return v;
  }
  `;
    return { body, name: name2, type: glsl_definitions_12.FunctionType.ValueBased };
  }
  exports.glslIdentity = glslIdentity;
  function glslLeakyRelu(alpha) {
    const name2 = "leakyRelu";
    const body = `
  const float alpha = float(${alpha});

  float ${name2}_(float a) {
    return a < 0.0 ? a * alpha : a;
  }
  vec4 ${name2}_(vec4 v) {
    return vec4(${name2}_(v.x), ${name2}_(v.y), ${name2}_(v.z), ${name2}_(v.w));
  }
  `;
    return { body, name: name2, type: glsl_definitions_12.FunctionType.ValueBased };
  }
  exports.glslLeakyRelu = glslLeakyRelu;
  function glslLog() {
    return glslBuiltinUnary("log");
  }
  exports.glslLog = glslLog;
  function glslNeg() {
    const name2 = "neg";
    const body = `
  float ${name2}_(float a) {
    return -a;
  }
  vec4 ${name2}_(vec4 v) {
    return -v;
  }
  `;
    return { body, name: name2, type: glsl_definitions_12.FunctionType.ValueBased };
  }
  exports.glslNeg = glslNeg;
  function glslNot() {
    const name2 = "not";
    const body = `
  float ${name2}_(float a) {
    return float( ! bool(a) );
  }
  bool ${name2}_(bool a) {
    return !a;
  }
  vec4 ${name2}_(vec4 v) {
    return vec4(!bool(v.x), !bool(v.y), !bool(v.z), !bool(v.w));
  }
  bvec4 ${name2}_(bvec4 v) {
    return bvec4(!v.x, !v.y, !v.z, !v.w);
  }
  `;
    return { body, name: name2, type: glsl_definitions_12.FunctionType.ValueBased };
  }
  exports.glslNot = glslNot;
  function glslSin() {
    return glslBuiltinUnary("sin");
  }
  exports.glslSin = glslSin;
  function glslRelu() {
    const name2 = "relu";
    const body = `
  float ${name2}_(float a) {
    return max( a, 0.0 );
  }
  vec4 ${name2}_(vec4 v) {
    return max( v, 0.0 );
  }
  `;
    return { body, name: name2, type: glsl_definitions_12.FunctionType.ValueBased };
  }
  exports.glslRelu = glslRelu;
  function glslSigmoid() {
    const name2 = "sigmoid";
    const body = `
  float ${name2}_(float a) {
    return 1.0 / (1.0 + exp(-a));
  }
  vec4 ${name2}_(vec4 v) {
    return 1.0 / (1.0 + exp(-v));
  }
  `;
    return { body, name: name2, type: glsl_definitions_12.FunctionType.ValueBased };
  }
  exports.glslSigmoid = glslSigmoid;
  function glslSqrt() {
    return glslBuiltinUnary("sqrt");
  }
  exports.glslSqrt = glslSqrt;
  function glslTan() {
    return glslBuiltinUnary("tan");
  }
  exports.glslTan = glslTan;
  function glslTanh() {
    const name2 = "tanh";
    const body = `
  float ${name2}_(float a) {
    a = clamp(a, -10., 10.);
    a = exp(2.*a);
    return (a - 1.) / (a + 1.);
  }
  vec4 ${name2}_(vec4 v) {
    v = clamp(v, -10., 10.);
    v = exp(2.*v);
    return (v - 1.) / (v + 1.);
  }
  `;
    return { body, name: name2, type: glsl_definitions_12.FunctionType.ValueBased };
  }
  exports.glslTanh = glslTanh;
  function glslBuiltinUnary(name2) {
    const body = `
  float ${name2}_(float a) {
    return ${name2}(a);
  }
  vec4 ${name2}_(vec4 v) {
    return ${name2}(v);
  }
  `;
    return { body, name: name2, type: glsl_definitions_12.FunctionType.ValueBased };
  }
  const createElementwiseProgramInfo = (handler, metadata, input, glslFunc) => {
    const textureType = handler.session.pack ? types_12.TextureType.packed : types_12.TextureType.unpacked;
    const glsl = glsl_source_12.getGlsl(handler.session.backend.glContext.version);
    return Object.assign(Object.assign({}, metadata), { output: { dims: input.dims, type: input.type, textureType }, shaderSource: `
     ${glslFunc.body}
     void main() {
       vec4 v = ${glsl.texture2D}(A, TexCoords);
       v = ${glslFunc.name}_(v);
       ${glsl.output} = v;
     }
     `, hasMain: true });
  };
  const createElementwiseProgramInfoLoader = (handler, input, glslFunc, cacheKey) => {
    const textureType = handler.session.pack ? types_12.TextureType.packed : types_12.TextureType.unpacked;
    const metadata = { name: glslFunc.name, inputTypes: [textureType], inputNames: ["A"], cacheHint: cacheKey };
    return Object.assign(Object.assign({}, metadata), { get: () => createElementwiseProgramInfo(handler, metadata, input, glslFunc) });
  };
  const abs = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslAbs()), inputs)];
  exports.abs = abs;
  const acos = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslAcos()), inputs)];
  exports.acos = acos;
  const asin = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslAsin()), inputs)];
  exports.asin = asin;
  const atan = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslAtan()), inputs)];
  exports.atan = atan;
  const clip = (handler, inputs, attributes) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslClip(attributes.min, attributes.max), attributes.cacheKey), inputs)];
  exports.clip = clip;
  const parseClipAttributes = (node) => attribute_with_cache_key_12.createAttributeWithCacheKey({ min: node.attributes.getFloat("min", util_12.MIN_CLIP), max: node.attributes.getFloat("max", util_12.MAX_CLIP) });
  exports.parseClipAttributes = parseClipAttributes;
  const clipV11 = (handler, inputs) => {
    const attributes = generateClipAttributesFromInputs(handler, inputs);
    return exports.clip(handler, [inputs[0]], attributes);
  };
  exports.clipV11 = clipV11;
  const generateClipAttributesFromInputs = (handler, inputs) => {
    if (inputs.length >= 3 && (!handler.session.isInitializer(inputs[1].dataId) || !handler.session.isInitializer(inputs[2].dataId))) {
      throw new Error("dynamic clip attributes are not allowed");
    }
    const min = inputs.length >= 3 ? inputs[1].numberData[0] : util_12.MIN_CLIP;
    const max = inputs.length >= 3 ? inputs[2].numberData[0] : util_12.MAX_CLIP;
    return attribute_with_cache_key_12.createAttributeWithCacheKey({ min, max });
  };
  const ceil = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslCeil()), inputs)];
  exports.ceil = ceil;
  const cos = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslCos()), inputs)];
  exports.cos = cos;
  const elu = (handler, inputs, attributes) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslElu(attributes.alpha), attributes.cacheKey), inputs)];
  exports.elu = elu;
  const parseEluAttributes = (node) => attribute_with_cache_key_12.createAttributeWithCacheKey({ alpha: node.attributes.getFloat("alpha", 1) });
  exports.parseEluAttributes = parseEluAttributes;
  const exp = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslExp()), inputs)];
  exports.exp = exp;
  const floor = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslFloor()), inputs)];
  exports.floor = floor;
  const identity = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslIdentity()), inputs)];
  exports.identity = identity;
  const leakyRelu = (handler, inputs, attributes) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslLeakyRelu(attributes.alpha), attributes.cacheKey), inputs)];
  exports.leakyRelu = leakyRelu;
  const parseLeakyReluAttributes = (node) => attribute_with_cache_key_12.createAttributeWithCacheKey({ alpha: node.attributes.getFloat("alpha", 0.01) });
  exports.parseLeakyReluAttributes = parseLeakyReluAttributes;
  const log = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslLog()), inputs)];
  exports.log = log;
  const neg = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslNeg()), inputs)];
  exports.neg = neg;
  const not2 = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslNot()), inputs)];
  exports.not = not2;
  const relu = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslRelu()), inputs)];
  exports.relu = relu;
  const sigmoid = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslSigmoid()), inputs)];
  exports.sigmoid = sigmoid;
  const sin = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslSin()), inputs)];
  exports.sin = sin;
  const sqrt = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslSqrt()), inputs)];
  exports.sqrt = sqrt;
  const tan = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslTan()), inputs)];
  exports.tan = tan;
  const tanh = (handler, inputs) => [handler.run(createElementwiseProgramInfoLoader(handler, inputs[0], glslTanh()), inputs)];
  exports.tanh = tanh;
})(unaryOp);
Object.defineProperty(fuseUtils, "__esModule", { value: true });
fuseUtils.parseInternalActivationAttributes = fuseUtils.getActicationSnippet = void 0;
const util_1$j = util;
const unary_op_1 = unaryOp;
function getActicationSnippet(attributes) {
  let func;
  switch (attributes.activation) {
    case "Relu":
      func = unary_op_1.glslRelu();
      break;
    case "Sigmoid":
      func = unary_op_1.glslSigmoid();
      break;
    case "Clip":
      func = unary_op_1.glslClip(attributes.clipMin, attributes.clipMax);
      break;
    default:
      return { activationFunction: "", applyActivation: "" };
  }
  const activationName = func.name;
  const activationFunction = func.body;
  const applyActivation = `value = ${activationName}_(value);`;
  return { activationFunction, applyActivation };
}
fuseUtils.getActicationSnippet = getActicationSnippet;
const parseInternalActivationAttributes = (attributes) => {
  const activation = attributes.getString("activation", "");
  if (activation === "Clip") {
    const [clipMin, clipMax] = attributes.getFloats("activation_params", [util_1$j.MIN_CLIP, util_1$j.MAX_CLIP]);
    return { activation, clipMax, clipMin, activationCacheKey: `${activation}:${clipMin},${clipMax}` };
  }
  return { activation, activationCacheKey: activation };
};
fuseUtils.parseInternalActivationAttributes = parseInternalActivationAttributes;
Object.defineProperty(convGrouped, "__esModule", { value: true });
convGrouped.createUnpackedGroupedConvProgramInfoLoader = void 0;
const instrument_1$9 = instrument;
const glsl_source_1$b = glslSource;
const types_1$h = types;
const conv_1$2 = conv;
const fuse_utils_1$3 = fuseUtils;
const createUnpackedGroupedConvProgramMetadata = (hasBias, cacheHint) => ({
  name: "GroupedConv",
  inputNames: hasBias ? ["X", "W", "Bias"] : ["X", "W"],
  inputTypes: hasBias ? [types_1$h.TextureType.unpacked, types_1$h.TextureType.unpacked, types_1$h.TextureType.unpacked] : [types_1$h.TextureType.unpacked, types_1$h.TextureType.unpacked],
  cacheHint
});
const createUnpackedGroupedConvProgramInfo = (inferenceHandler2, inputs, metadata, attributes) => {
  const hasBias = inputs.length > 2;
  const processBias = hasBias ? "value += getBias(output_channel);" : "";
  const xShape = inputs[0].dims.slice();
  const wShape = inputs[1].dims.slice();
  const outputChannelsPerGroup = wShape[0] / attributes.group;
  instrument_1$9.Logger.verbose("GroupedConv", `autpPad:${attributes.autoPad}, dilations:${attributes.dilations}, group:${attributes.group}, kernelShape:${attributes.kernelShape}, pads:${attributes.pads}, strides:${attributes.strides}`);
  const outputShape = conv_1$2.calculateOutputShape(xShape, wShape, attributes.dilations, attributes.pads, attributes.strides);
  const glsl = glsl_source_1$b.getGlsl(inferenceHandler2.session.backend.glContext.version);
  const { activationFunction, applyActivation } = fuse_utils_1$3.getActicationSnippet(attributes);
  const shaderSource = `
  const ivec2 strides = ivec2(${attributes.strides[0]}, ${attributes.strides[1]});
  const ivec2 pads = ivec2(${attributes.pads[0]}, ${attributes.pads[1]});
  ${activationFunction}
  void main() {
    ivec4 coords = getOutputCoords();
    int batch = coords.x;
    int output_channel = coords.y;
    ivec2 xRCCorner = coords.zw * strides - pads;
    int group_id = output_channel / ${outputChannelsPerGroup};

    float value = 0.0;
    for (int wInChannel = 0; wInChannel < ${wShape[1]}; wInChannel++) {
      int input_channel = group_id * ${wShape[1]} + wInChannel;
      for (int wHeight = 0; wHeight < ${wShape[2]}; wHeight++) {
        int xHeight = xRCCorner.x + wHeight * ${attributes.dilations[0]};

        if (xHeight < 0 || xHeight >= ${xShape[2]}) {
          continue;
        }

        for (int wWidth = 0; wWidth < ${wShape[3]}; wWidth++) {
          int xWidth = xRCCorner.y + wWidth * ${attributes.dilations[1]};
          if (xWidth < 0 || xWidth >= ${xShape[3]}) {
            continue;
          }

          float xVal = getX(batch, input_channel, xWidth, xHeight);
          float wVal = getW(output_channel, wInChannel, wWidth, wHeight);
          value += xVal*wVal;
        }
      }
    }
    ${processBias}
    ${applyActivation}
    ${glsl.output} = vec4(value, .0, .0, .0);
  }
`;
  return Object.assign(Object.assign({}, metadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$h.TextureType.unpacked }, shaderSource, hasMain: true });
};
const createUnpackedGroupedConvProgramInfoLoader = (inferenceHandler2, inputs, attributes) => {
  const metadata = createUnpackedGroupedConvProgramMetadata(inputs.length > 2, attributes.cacheKey);
  return Object.assign(Object.assign({}, metadata), { get: () => createUnpackedGroupedConvProgramInfo(inferenceHandler2, inputs, metadata, attributes) });
};
convGrouped.createUnpackedGroupedConvProgramInfoLoader = createUnpackedGroupedConvProgramInfoLoader;
var convPack = {};
var im2colPack = {};
Object.defineProperty(im2colPack, "__esModule", { value: true });
im2colPack.createPackedIm2ColProgramInfoLoader = void 0;
const glsl_source_1$a = glslSource;
const types_1$g = types;
const packing_utils_1$1 = packingUtils;
const createPackedIm2ColProgramMetadata = (cacheHint) => ({
  name: "Im2Col (packed)",
  inputNames: ["A"],
  inputTypes: [types_1$g.TextureType.packed],
  cacheHint
});
const createPackedIm2ColProgramInfo = (inferenceHandler2, metadata, x, w, outputShape, attributes) => {
  const xshape = x.dims;
  const wshape = w.dims;
  const rowDim = 2;
  const colDim = 3;
  const rank = outputShape.length;
  const im2colShape = [wshape[1] * wshape[2] * wshape[3], outputShape[2] * outputShape[3]];
  const kernelSize = wshape[2] * wshape[3];
  const unpackChannel = packing_utils_1$1.unpackFromChannel();
  const glsl = glsl_source_1$a.getGlsl(inferenceHandler2.session.backend.glContext.version);
  let unrolled = "";
  for (let row = 0; row <= 1; row++) {
    for (let col = 0; col <= 1; col++) {
      unrolled += `
            blockIndex = rc.x + ${col};
            pos = rc.y + ${row};

            if(blockIndex < ${im2colShape[1]} && pos < ${im2colShape[0]}) {
              offsetY = int(blockIndex / (${outputShape[rank - 1]})) * ${attributes.strides[0]} -
                ${attributes.pads[0]};
              d0 = offsetY + ${attributes.dilations[0]} * (imod(pos, ${kernelSize}) / ${wshape[2]});

              if(d0 < ${xshape[rowDim]} && d0 >= 0) {
                offsetX = imod(blockIndex, ${outputShape[rank - 1]}) * ${attributes.strides[1]} -
                  ${attributes.pads[1]};
                d1 = offsetX + ${attributes.dilations[1]} * imod(imod(pos, ${kernelSize}), ${wshape[2]});

                if(d1 < ${xshape[colDim]} && d1 >= 0) {

                  ch = int(float(pos)/ ${kernelSize}.);
                    innerDims = vec2(d0, d1);
                    result[${row * 2 + col}] = getChannel(
                      getA(0, ch, int(innerDims.x),
                      int(innerDims.y)), innerDims);
                }
              }
            }

          `;
    }
  }
  const shaderSource = `
      ${unpackChannel}

      void main() {
        ivec2 rc = getOutputCoords();
          vec4 result = vec4(0.0);
          int blockIndex, pos, offsetY, d0, offsetX, d1, ch;
          vec2 innerDims;
          ${unrolled}
          ${glsl.output} = result;
      }
            `;
  return Object.assign(Object.assign({}, metadata), { output: { dims: im2colShape, type: x.type, textureType: types_1$g.TextureType.packed }, shaderSource, hasMain: true });
};
const createPackedIm2ColProgramInfoLoader = (inferenceHandler2, x, w, outputShape, attributes) => {
  const metadata = createPackedIm2ColProgramMetadata(attributes.cacheKey);
  return Object.assign(Object.assign({}, metadata), { get: () => createPackedIm2ColProgramInfo(inferenceHandler2, metadata, x, w, outputShape, attributes) });
};
im2colPack.createPackedIm2ColProgramInfoLoader = createPackedIm2ColProgramInfoLoader;
var matmulPack = {};
var matmul = {};
Object.defineProperty(matmul, "__esModule", { value: true });
matmul.getBiasForMatmul = matmul.createMatmulProgramInfoLoader = matmul.parseMatMulAttributes = matmul.matMul = void 0;
const util_1$i = util;
const types_1$f = types;
const utils_1$4 = utils;
const fuse_utils_1$2 = fuseUtils;
const matmul_pack_1$1 = matmulPack;
const matMul = (inferenceHandler2, inputs, attributes) => {
  validateInputs$f(inputs);
  if (inferenceHandler2.session.pack) {
    return [inferenceHandler2.run(matmul_pack_1$1.createPackedMatmulProgramInfoLoader(inferenceHandler2, inputs, attributes), inputs)];
  } else {
    return [inferenceHandler2.run(createMatmulProgramInfoLoader(inputs, attributes), inputs)];
  }
};
matmul.matMul = matMul;
const parseMatMulAttributes = (node) => fuse_utils_1$2.parseInternalActivationAttributes(node.attributes);
matmul.parseMatMulAttributes = parseMatMulAttributes;
const createMatmulProgramMetadata = (hasBias, cacheHint) => ({
  name: "MatMul",
  inputNames: hasBias ? ["A", "B", "Bias"] : ["A", "B"],
  inputTypes: hasBias ? [types_1$f.TextureType.unpacked, types_1$f.TextureType.unpacked, types_1$f.TextureType.unpacked] : [types_1$f.TextureType.unpacked, types_1$f.TextureType.unpacked],
  cacheHint
});
function createMatmulProgramInfo(metadata, inputs, activationAttributes) {
  const aShape = inputs[0].dims;
  const bShape = inputs[1].dims;
  const outputShape = util_1$i.BroadcastUtil.calcShape(aShape, bShape, true);
  if (!outputShape) {
    throw new Error("Can't use matmul on the given tensors");
  }
  const coordsDataType = utils_1$4.getCoordsDataType(outputShape.length);
  const allGlChannels = utils_1$4.getGlChannels();
  const { activationFunction, applyActivation } = fuse_utils_1$2.getActicationSnippet(activationAttributes);
  const hasBias = inputs.length > 2;
  const processBias = hasBias ? "value += getBiasForMatmul();" : "";
  const getBiasForMatmulSnippet = hasBias ? `${getBiasForMatmul(coordsDataType, allGlChannels, inputs[2].dims, outputShape, false)}` : "";
  const rank = outputShape.length;
  const arank = aShape.length;
  const brank = bShape.length;
  const sharedDim = aShape[aShape.length - 1];
  const shaderSource = `
    ${activationFunction}
    ${getBiasForMatmulSnippet}
    float process(int indices[${rank}]) {
        int a[${arank}];
        int b[${brank}];
        bcastMatmulIndices_A(indices, a);
        bcastMatmulIndices_B(indices, b);

        float value;
        for (int k=0; k<${sharedDim}; ++k) {
            a[${arank - 1}] = k;
            b[${brank - 2}] = k;
            value += _A(a) * _B(b);
        }
        ${processBias}
        ${applyActivation}
        return value;
    }`;
  return Object.assign(Object.assign({}, metadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$f.TextureType.unpacked }, shaderSource });
}
function createMatmulProgramInfoLoader(inputs, activationAttributes) {
  const metadata = createMatmulProgramMetadata(inputs.length > 2, activationAttributes.activationCacheKey);
  return Object.assign(Object.assign({}, metadata), { get: () => createMatmulProgramInfo(metadata, inputs, activationAttributes) });
}
matmul.createMatmulProgramInfoLoader = createMatmulProgramInfoLoader;
const validateInputs$f = (inputs) => {
  if (!inputs || inputs.length !== 2) {
    throw new Error("MatMul requires 2 inputs.");
  }
  if (inputs[0].dims[inputs[0].dims.length - 1] !== inputs[1].dims[inputs[1].dims.length - 2]) {
    throw new Error("shared dimension does not match.");
  }
  if (inputs[0].type !== "float32" && inputs[0].type !== "float64" || inputs[1].type !== "float32" && inputs[1].type !== "float64") {
    throw new Error("inputs should be float type");
  }
  if (inputs[0].type !== inputs[1].type) {
    throw new Error("inputs types should match");
  }
};
function getBiasForMatmul(coordsDataType, allGlChannels, inShape, outShape, isPacked) {
  let unpackedCoordsSnippet = "";
  const inRank = inShape.length;
  const outRank = outShape.length;
  const rankDiff = outRank - inRank;
  if (outRank < 2 && inRank > 0) {
    unpackedCoordsSnippet = "coords";
  } else {
    unpackedCoordsSnippet = inShape.map((s, i) => `coords.${allGlChannels[i + rankDiff]}`).join(", ");
  }
  const broadcastDims = util_1$i.BroadcastUtil.getBroadcastDims(inShape, outShape);
  const coordsSnippet = broadcastDims.map((d) => `coords.${allGlChannels[d + rankDiff]} = 0;`).join("\n");
  const inSize = util_1$i.ShapeUtil.size(inShape);
  const isInputScalar = inSize === 1;
  let output = "vec4(outputValue.xx, outputValue.yy)";
  if (isInputScalar) {
    output = "vec4(outputValue.x)";
  }
  const getBiasForMatmulSource = isPacked ? `
vec4 getBiasForMatmul() {
  ${coordsDataType} coords = getOutputCoords();
  ${coordsSnippet}
  vec4 outputValue = getBias(${unpackedCoordsSnippet});
  return ${output};
}` : `
float getBiasForMatmul() {
  ${coordsDataType} coords = getOutputCoords();
  ${coordsSnippet}
  return getBias(coords.x);
}`;
  return getBiasForMatmulSource;
}
matmul.getBiasForMatmul = getBiasForMatmul;
Object.defineProperty(matmulPack, "__esModule", { value: true });
matmulPack.createPackedMatmulProgramInfoLoader = void 0;
const util_1$h = util;
const util_2 = util;
const glsl_source_1$9 = glslSource;
const types_1$e = types;
const utils_1$3 = utils;
const fuse_utils_1$1 = fuseUtils;
const matmul_1$1 = matmul;
const createPackedMatmulProgramMetadata = (hasBias, cacheHint) => ({
  name: "MatMul (packed)",
  inputNames: hasBias ? ["A", "B", "Bias"] : ["A", "B"],
  inputTypes: hasBias ? [types_1$e.TextureType.packed, types_1$e.TextureType.packed, types_1$e.TextureType.packed] : [types_1$e.TextureType.packed, types_1$e.TextureType.packed],
  cacheHint
});
const createPackedMatmulProgramInfo = (inferenceHandler2, metadata, inputs, activationAttributes) => {
  const hasBias = inputs.length > 2;
  const processBias = hasBias ? "value += getBiasForMatmul();" : "";
  const aShape = inputs[0].dims;
  const bShape = inputs[1].dims;
  const outputShape = util_1$h.BroadcastUtil.calcShape(aShape, bShape, true);
  const isBroadcast = !util_2.ShapeUtil.areEqual(inputs[0].dims, inputs[1].dims);
  if (!outputShape) {
    throw new Error("Can't use matmul on the given tensors");
  }
  const sharedDim = aShape[aShape.length - 1];
  const sharedDimIndex = Math.ceil(sharedDim / 2);
  const aRank = aShape.length;
  const bRank = bShape.length;
  const glsl = glsl_source_1$9.getGlsl(inferenceHandler2.session.backend.glContext.version);
  const coordsDataType = utils_1$3.getCoordsDataType(outputShape.length);
  const outRank = outputShape.length;
  const allGlChannels = utils_1$3.getGlChannels();
  const { activationFunction, applyActivation } = fuse_utils_1$1.getActicationSnippet(activationAttributes);
  const getBiasForMatmulSnippet = hasBias ? `${matmul_1$1.getBiasForMatmul(coordsDataType, allGlChannels, inputs[2].dims, outputShape, true)}` : "";
  const getBcastedSamplerForMatmulSnippet = isBroadcast ? `${getBcastSamplerForMatmul(coordsDataType, allGlChannels, inputs, outputShape)}` : "";
  const getSamplerAInLoopSnippet = isBroadcast ? "getAAtOutCoordsMatmul(i)" : `getA(${getA(allGlChannels, aRank)})`;
  const getSamplerBInLoopSnippet = isBroadcast ? "getBAtOutCoordsMatmul(i)" : `getB(${getB(allGlChannels, bRank)})`;
  const getOutputCoordsSnippet = isBroadcast ? "" : `${coordsDataType} rc =
          getOutputCoords(); int lastDim = rc.${allGlChannels[outRank - 1]}; rc.${allGlChannels[outRank - 1]} =
          rc.${allGlChannels[outRank - 2]}; rc.${allGlChannels[outRank - 2]} = lastDim;
      `;
  const shaderSource = `
            ${getBcastedSamplerForMatmulSnippet}
            ${getBiasForMatmulSnippet}
            ${activationFunction}
            void main() {
              ${getOutputCoordsSnippet}

              vec4 value = vec4(0);
              for (int i = 0; i < ${sharedDimIndex}; i++) {
                vec4 a = ${getSamplerAInLoopSnippet};
                vec4 b = ${getSamplerBInLoopSnippet};

                value += (a.rrbb * b.rgrg);
                value += (a.ggaa * b.baba);
              }
              ${processBias}
              ${applyActivation}
              ${glsl.output} = value;
            }`;
  return Object.assign(Object.assign({}, metadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$e.TextureType.packed }, shaderSource, hasMain: true });
};
const createPackedMatmulProgramInfoLoader = (inferenceHandler2, inputs, activationAttributes) => {
  const metadata = createPackedMatmulProgramMetadata(inputs.length > 2, activationAttributes.activationCacheKey);
  return Object.assign(Object.assign({}, metadata), { get: () => createPackedMatmulProgramInfo(inferenceHandler2, metadata, inputs, activationAttributes) });
};
matmulPack.createPackedMatmulProgramInfoLoader = createPackedMatmulProgramInfoLoader;
function getBcastSamplerForMatmul(coordsDataType, allGlChannels, inputs, outShape) {
  let unpackedACoordsSnippet = [];
  let unpackedBCoordsSnippet = [];
  const inAShape = inputs[0].dims;
  const inBShape = inputs[1].dims;
  const inARank = inAShape.length;
  const inBRank = inBShape.length;
  const outRank = outShape.length;
  const rankADiff = outRank - inARank;
  const rankBDiff = outRank - inBRank;
  unpackedACoordsSnippet = inAShape.map((s, i) => `coords.${allGlChannels[i + rankADiff]}`);
  unpackedACoordsSnippet[inARank - 1] = "i*2";
  unpackedACoordsSnippet.join(", ");
  unpackedBCoordsSnippet = inBShape.map((s, i) => `coords.${allGlChannels[i + rankBDiff]}`);
  unpackedBCoordsSnippet[inBRank - 2] = "i*2";
  unpackedBCoordsSnippet.join(", ");
  const broadcastADims = util_1$h.BroadcastUtil.getBroadcastDims(inAShape, outShape);
  const broadcastBDims = util_1$h.BroadcastUtil.getBroadcastDims(inBShape, outShape);
  const coordsASnippet = broadcastADims.map((d) => `coords.${allGlChannels[d + rankADiff]} = 0;`).join("\n");
  const coordsBSnippet = broadcastBDims.map((d) => `coords.${allGlChannels[d + rankBDiff]} = 0;`).join("\n");
  const swapDimSnippet = `int lastDim = coords.${allGlChannels[outRank - 1]};
  coords.${allGlChannels[outRank - 1]} = coords.${allGlChannels[outRank - 2]};
  coords.${allGlChannels[outRank - 2]} = lastDim;`;
  const getBcastSamplerMatmulSource = `
vec4 getAAtOutCoordsMatmul(int i) {
  ${coordsDataType} coords = getOutputCoords();
  ${swapDimSnippet}
  ${coordsASnippet}
  vec4 outputValue = getA(${unpackedACoordsSnippet});
  return outputValue;
}

vec4 getBAtOutCoordsMatmul(int i) {
  ${coordsDataType} coords = getOutputCoords();
  ${swapDimSnippet}
  ${coordsBSnippet}
  vec4 outputValue = getB(${unpackedBCoordsSnippet});
  return outputValue;
}`;
  return getBcastSamplerMatmulSource;
}
function getA(allGlChannels, rank) {
  let res = "";
  for (let i = 0; i < rank - 2; i++) {
    res += `rc.${allGlChannels[i]}, `;
  }
  res += `rc.${allGlChannels[rank - 2]}, i*2`;
  return res;
}
function getB(allGlChannels, rank) {
  let res = "";
  for (let i = 0; i < rank - 2; i++) {
    res += `rc.${allGlChannels[i]}, `;
  }
  res += `i*2, rc.${allGlChannels[rank - 1]}`;
  return res;
}
Object.defineProperty(convPack, "__esModule", { value: true });
convPack.conv2DPacked = convPack.conv2DPackedPointwise = void 0;
const conv_1$1 = conv;
const im2col_pack_1 = im2colPack;
const matmul_pack_1 = matmulPack;
const conv2DPackedPointwise = (inferenceHandler2, inputs, attributes) => {
  const xshape = inputs[0].dims;
  const kshape = inputs[1].dims;
  const outputShape = conv_1$1.calculateOutputShape(xshape, kshape, attributes.dilations, attributes.pads, attributes.strides);
  const reshapedX = inferenceHandler2.reshapePacked(inputs[0], [xshape[1], xshape[2] * xshape[3]]);
  const reshapedK = inferenceHandler2.reshapePacked(inputs[1], [kshape[0], kshape[1]]);
  const matmulInputs = inputs.length > 2 ? [reshapedK, reshapedX, inputs[2]] : [reshapedK, reshapedX];
  const matmulOutput = inferenceHandler2.run(matmul_pack_1.createPackedMatmulProgramInfoLoader(inferenceHandler2, matmulInputs, attributes), matmulInputs);
  return inferenceHandler2.reshapePacked(matmulOutput, outputShape);
};
convPack.conv2DPackedPointwise = conv2DPackedPointwise;
const conv2DPacked = (inferenceHandler2, inputs, attributes) => {
  const xshape = inputs[0].dims;
  const kshape = inputs[1].dims;
  const outputShape = conv_1$1.calculateOutputShape(xshape, kshape, attributes.dilations, attributes.pads, attributes.strides);
  const im2colOutput = inferenceHandler2.run(im2col_pack_1.createPackedIm2ColProgramInfoLoader(inferenceHandler2, inputs[0], inputs[1], outputShape, attributes), [inputs[0]]);
  const kernelReshaped = inferenceHandler2.reshapePacked(inputs[1], [kshape[0], kshape[1] * kshape[2] * kshape[3]]);
  const matmulInputs = inputs.length === 3 ? [kernelReshaped, im2colOutput, inputs[2]] : [kernelReshaped, im2colOutput];
  const matmulOutput = inferenceHandler2.run(matmul_pack_1.createPackedMatmulProgramInfoLoader(inferenceHandler2, matmulInputs, attributes), matmulInputs);
  const outputReshaped = inferenceHandler2.reshapePacked(matmulOutput, outputShape);
  return outputReshaped;
};
convPack.conv2DPacked = conv2DPacked;
var dotProduct = {};
var im2col = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.calculateIm2ColDims = exports.createIm2ColProgramInfoLoader = void 0;
  const types_12 = types;
  const createIm2ColProgramMetadata = (cacheHint) => ({
    name: "Im2Col",
    inputNames: ["X"],
    inputTypes: [types_12.TextureType.unpacked],
    cacheHint
  });
  const createIm2ColProgramInfo = (inferenceHandler2, metadata, x, w, outputShape, attributes) => {
    const xshape = x.dims;
    const wshape = w.dims;
    const rank = outputShape.length;
    const im2colDims = exports.calculateIm2ColDims(xshape, wshape, outputShape, 4);
    const shaderSource = `
        const int XC = ${xshape[1]};
        const int XH = ${xshape[2]};
        const int XW = ${xshape[3]};
        const int KH = ${attributes.kernelShape[0]};
        const int KW = ${attributes.kernelShape[1]};
        const int dilationH = ${attributes.dilations[0]};
        const int dilationW = ${attributes.dilations[1]};
        const int strideH = ${attributes.strides[0]};
        const int strideW = ${attributes.strides[1]};
        const int padH = ${attributes.pads[0]};
        const int padW = ${attributes.pads[1]};
        const int KHKW = KH*KW;
        const int XCKHKW = XC * KHKW;
        const int outputChannels = 4;
        vec4 process(int indices[${rank}]) {
          int b  = indices[0]; // batch size
          int oh = indices[1] * strideH - padH; //output height
          int ow = indices[2] * strideW - padW; //output width
          int p = indices[3] * outputChannels; //patch
          vec4 value = vec4(0.0);
          for(int i=0; i < outputChannels; ++i) {
            if(p < XCKHKW) {
              int patchC = p / KHKW;
              int patchH = (p - patchC*KHKW) / KW;
              int patchW = (p - patchC*KHKW) - patchH * KW;
              int xh2 = oh + patchH * dilationH;
              int xw2 = ow + patchW * dilationW;
              int x[${xshape.length}];
              x[0] = b;
              x[1] = patchC;
              x[2] = xh2;
              x[3] = xw2;
              if(xh2 >= 0 &&
                  xh2 < XH &&
                  xw2 >= 0 &&
                  xw2 < XW) {
                value[i] = _X(x);
              }
            }
            ++p;
          }
          return value;
        }
        `;
    return Object.assign(Object.assign({}, metadata), { output: { dims: im2colDims, type: x.type, textureType: types_12.TextureType.packedLastDimension }, shaderSource });
  };
  const createIm2ColProgramInfoLoader = (inferenceHandler2, x, w, outputShape, attributes) => {
    const metadata = createIm2ColProgramMetadata(attributes.cacheKey);
    return Object.assign(Object.assign({}, metadata), { get: () => createIm2ColProgramInfo(inferenceHandler2, metadata, x, w, outputShape, attributes) });
  };
  exports.createIm2ColProgramInfoLoader = createIm2ColProgramInfoLoader;
  const calculateIm2ColDims = (inputShape, kernelShape, outputShape, channels = 4) => [
    outputShape[0],
    outputShape[2],
    outputShape[3],
    Math.ceil(inputShape[1] * kernelShape[2] * kernelShape[3] / channels)
  ];
  exports.calculateIm2ColDims = calculateIm2ColDims;
})(im2col);
Object.defineProperty(dotProduct, "__esModule", { value: true });
dotProduct.createDotProductProgramInfoLoader = void 0;
const util_1$g = util;
const glsl_source_1$8 = glslSource;
const types_1$d = types;
const fuse_utils_1 = fuseUtils;
const im2col_1 = im2col;
const createDotProductProgramMetadata = (hasBias, attributes) => ({
  name: "ConvDotProduct",
  inputNames: hasBias ? ["Im2Col", "K", "B"] : ["Im2Col", "K"],
  inputTypes: hasBias ? [types_1$d.TextureType.unpacked, types_1$d.TextureType.packedLastDimension, types_1$d.TextureType.unpacked] : [types_1$d.TextureType.unpacked, types_1$d.TextureType.packedLastDimension],
  cacheKey: attributes.activationCacheKey
});
const createDotProductProgramInfo = (inferenceHandler2, metadata, inputs, outputShape, attributes) => {
  const xshape = inputs[0].dims;
  const kshape = inputs[1].dims;
  const adjustedKernelShape = [kshape[0], Math.ceil(xshape[1] * kshape[2] * kshape[3] / 4)];
  const im2colShape = im2col_1.calculateIm2ColDims(xshape, kshape, outputShape);
  const [kWidth, kHeight] = inferenceHandler2.calculateTextureWidthAndHeight(adjustedKernelShape, types_1$d.TextureType.packedLastDimension);
  const im2colStrides = util_1$g.ShapeUtil.computeStrides(im2colShape);
  const [im2colWidth, im2colHeight] = inferenceHandler2.calculateTextureWidthAndHeight(im2colShape, types_1$d.TextureType.packedLastDimension);
  const rank = outputShape.length;
  const initValue = inputs.length < 3 ? "0.0" : "_B(b)";
  const sharedDim = Math.ceil(xshape[1] * kshape[2] * kshape[3] / 4);
  const { activationFunction, applyActivation } = fuse_utils_1.getActicationSnippet(attributes);
  const glsl = glsl_source_1$8.getGlsl(inferenceHandler2.session.backend.glContext.version);
  const shaderSource = `
${activationFunction}
float process(int indices[${rank}]) {
  int b[1];
  b[0] = indices[1];
  int im2col[4];
  im2col[0] = indices[0];
  im2col[1] = indices[2];
  im2col[2] = indices[3];
  int im2colOffset = im2col[0] * ${im2colStrides[0]} + im2col[1] * ${im2colStrides[1]} + im2col[2] * ${im2colStrides[2]};
  int kernelOffset = indices[1] * ${adjustedKernelShape[1]};
  float value = ${initValue};
  for (int i = 0; i < ${sharedDim}; ++i) {
    vec2 im2colCoords = offsetToCoords(im2colOffset, ${im2colWidth}, ${im2colHeight});
    vec2 kernelCoords = offsetToCoords(kernelOffset, ${kWidth}, ${kHeight});
    value += dot(${glsl.texture2D}(Im2Col, im2colCoords), ${glsl.texture2D}(K, kernelCoords));
    ++im2colOffset;
    ++kernelOffset;
  }
  ${applyActivation}
  return value;
}`;
  return Object.assign(Object.assign({}, metadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$d.TextureType.unpacked }, shaderSource });
};
const createDotProductProgramInfoLoader = (inferenceHandler2, inputs, outputShape, attributes) => {
  const metadata = createDotProductProgramMetadata(inputs.length > 2, attributes);
  return Object.assign(Object.assign({}, metadata), { get: () => createDotProductProgramInfo(inferenceHandler2, metadata, inputs, outputShape, attributes) });
};
dotProduct.createDotProductProgramInfoLoader = createDotProductProgramInfoLoader;
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.parseConvAttributes = exports.conv = exports.calculateOutputShape = void 0;
  const attribute_with_cache_key_12 = attributeWithCacheKey;
  const util_12 = util;
  const conv_grouped_1 = convGrouped;
  const conv_pack_1 = convPack;
  const dot_product_1 = dotProduct;
  const fuse_utils_12 = fuseUtils;
  const im2col_12 = im2col;
  const matmul_12 = matmul;
  const calculateOutputShape = (inputShape, kernelShape, dilations, adjustPads, strides) => {
    const batchSize = inputShape[0];
    const inputSpatialShape = inputShape.slice(2);
    const spatialRank = inputSpatialShape.length;
    const outChannels = kernelShape[0];
    const kernelSpatialShape = kernelShape.slice(2);
    const dilatedKernelShape = kernelSpatialShape.map((v, i) => v + (v - 1) * (dilations[i] - 1));
    const inputSpatialShapeWithPad = inputSpatialShape.map((v, i) => v + adjustPads[i] + adjustPads[i + spatialRank]);
    const outputSpatialShape = inputSpatialShapeWithPad.map((v, i) => Math.floor((v - dilatedKernelShape[i] + strides[i]) / strides[i]));
    const outputShape = [batchSize, outChannels].concat(...outputSpatialShape);
    return outputShape;
  };
  exports.calculateOutputShape = calculateOutputShape;
  const conv2 = (inferenceHandler2, inputs, attributes) => {
    validateInputs2(inputs, attributes);
    return conv2d(inferenceHandler2, inputs, attributes);
  };
  exports.conv = conv2;
  const conv2d = (inferenceHandler2, inputs, attributes) => {
    const adjustedAttributes = getAdjustedConvAttributes(attributes, inputs);
    const packMode = inferenceHandler2.session.pack;
    const isPointwise = adjustedAttributes.kernelShape[0] === 1 && adjustedAttributes.kernelShape[1] === 1;
    if (adjustedAttributes.group > 1) {
      const result = inferenceHandler2.run(conv_grouped_1.createUnpackedGroupedConvProgramInfoLoader(inferenceHandler2, inputs, adjustedAttributes), inputs);
      return [result];
    } else if (isPointwise && packMode) {
      return [conv2DUnpackedPointwise(inferenceHandler2, inputs, adjustedAttributes)];
    } else if (packMode && inputs[0].dims.length === 4 && inputs[0].dims[0] === 1 && !isPointwise) {
      return [conv_pack_1.conv2DPacked(inferenceHandler2, inputs, adjustedAttributes)];
    } else {
      return [conv2DUnpacked(inferenceHandler2, inputs, adjustedAttributes)];
    }
  };
  const conv2DUnpackedPointwise = (inferenceHandler2, inputs, attributes) => {
    const xshape = inputs[0].dims;
    const kshape = inputs[1].dims;
    const outputShape = exports.calculateOutputShape(xshape, kshape, attributes.dilations, attributes.pads, attributes.strides);
    const reshapedX = inferenceHandler2.reshapeUnpacked(inputs[0], [xshape[1], xshape[2] * xshape[3]]);
    const reshapedK = inferenceHandler2.reshapeUnpacked(inputs[1], [kshape[0], kshape[1]]);
    const matmulInputs = inputs.length > 2 ? [reshapedK, reshapedX, inputs[2]] : [reshapedK, reshapedX];
    const matmulOutput = inferenceHandler2.run(matmul_12.createMatmulProgramInfoLoader(matmulInputs, attributes), matmulInputs);
    return inferenceHandler2.reshapeUnpacked(matmulOutput, outputShape);
  };
  const conv2DUnpacked = (inferenceHandler2, inputs, attributes) => {
    const xshape = inputs[0].dims;
    const kshape = inputs[1].dims;
    const outputShape = exports.calculateOutputShape(xshape, kshape, attributes.dilations, attributes.pads, attributes.strides);
    const xIm2Col = inferenceHandler2.run(im2col_12.createIm2ColProgramInfoLoader(inferenceHandler2, inputs[0], inputs[1], outputShape, attributes), [inputs[0]]);
    const dotProductInputs = inputs.length === 3 ? [xIm2Col, inputs[1], inputs[2]] : [xIm2Col, inputs[1]];
    const output = inferenceHandler2.run(dot_product_1.createDotProductProgramInfoLoader(inferenceHandler2, inputs, outputShape, attributes), dotProductInputs);
    return output;
  };
  const getAdjustedConvAttributes = (attributes, inputs) => {
    const kernelShape = attributes.kernelShape.slice();
    if (attributes.kernelShape.length === 0) {
      for (let i = 2; i < inputs[1].dims.length; ++i) {
        kernelShape.push(inputs[1].dims[i]);
      }
    }
    const pads = attributes.pads.slice();
    util_12.PoolConvUtil.adjustPadsBasedOnAutoPad(inputs[0].dims, attributes.strides, attributes.dilations, kernelShape, pads, attributes.autoPad);
    const newAttributes = Object.assign({}, attributes);
    Object.assign(newAttributes, { kernelShape, pads, cacheKey: attributes.cacheKey });
    return newAttributes;
  };
  const parseConvAttributes = (node) => {
    const attributes = node.attributes;
    const activationAttributes = fuse_utils_12.parseInternalActivationAttributes(attributes);
    const autoPad = attributes.getString("auto_pad", "NOTSET");
    const dilations = attributes.getInts("dilations", [1, 1]);
    const group = attributes.getInt("group", 1);
    const kernelShape = attributes.getInts("kernel_shape", []);
    const pads = attributes.getInts("pads", [0, 0, 0, 0]);
    const strides = attributes.getInts("strides", [1, 1]);
    return attribute_with_cache_key_12.createAttributeWithCacheKey(Object.assign({ autoPad, dilations, group, kernelShape, pads, strides }, activationAttributes));
  };
  exports.parseConvAttributes = parseConvAttributes;
  const validateInputs2 = (inputs, attributes) => {
    if (!inputs || inputs.length !== 2 && inputs.length !== 3) {
      throw new Error("Conv requires 2 or 3 inputs");
    }
    if (inputs[0].dims.length !== 4 || inputs[1].dims.length !== 4) {
      throw new Error("currently only support 2-dimensional conv");
    }
    const dataChannel = inputs[0].dims[1];
    const filterInChannel = inputs[1].dims[1] * attributes.group;
    if (dataChannel !== filterInChannel) {
      throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");
    }
    if (inputs.length === 3 && (inputs[2].dims.length !== 1 || inputs[1].dims[0] !== inputs[2].dims[0])) {
      throw new Error("invalid bias");
    }
    const spatialRank = inputs[0].dims.length - 2;
    if (attributes.dilations.length !== spatialRank) {
      throw new Error(`dilations should be ${spatialRank}D`);
    }
    if (attributes.strides.length !== spatialRank) {
      throw new Error(`strides should be ${spatialRank}D`);
    }
    if (attributes.pads.length !== spatialRank * 2) {
      throw new Error(`pads should be ${spatialRank * 2}D`);
    }
    if (attributes.kernelShape.length !== 0 && attributes.kernelShape.length !== inputs[1].dims.length - 2) {
      throw new Error("invalid kernel shape");
    }
    if (inputs[0].type !== "float32" || inputs[1].type !== "float32") {
      throw new Error("Conv input(X,W) should be float tensor");
    }
    if (inputs.length === 3 && inputs[2].type !== "float32") {
      throw new Error("Conv input(bias) should be float tensor");
    }
  };
})(conv);
var depthToSpace$1 = {};
var transpose$1 = {};
Object.defineProperty(transpose$1, "__esModule", { value: true });
transpose$1.parseTransposeAttributes = transpose$1.transpose = void 0;
const attribute_with_cache_key_1$8 = attributeWithCacheKey;
const util_1$f = util;
const types_1$c = types;
const transposeProgramMetadata = {
  name: "Transpose",
  inputNames: ["A"],
  inputTypes: [types_1$c.TextureType.unpacked]
};
const transpose = (inferenceHandler2, inputs, attributes) => {
  validateInputs$e(inputs);
  const output = inferenceHandler2.run(Object.assign(Object.assign({}, transposeProgramMetadata), { cacheHint: attributes.cacheKey, get: () => createTransposeProgramInfo(inferenceHandler2, inputs[0], attributes.perm) }), inputs);
  return [output];
};
transpose$1.transpose = transpose;
const parseTransposeAttributes = (node) => attribute_with_cache_key_1$8.createAttributeWithCacheKey({ perm: node.attributes.getInts("perm", []) });
transpose$1.parseTransposeAttributes = parseTransposeAttributes;
const createTransposeProgramInfo = (inferenceHandler2, input, perm) => {
  const inputShape = input.dims;
  perm = getAdjustedPerm(inputShape, perm);
  const unpackedOutputShape = getOutputShape(inputShape, perm);
  const rank = inputShape.length;
  const shaderSource = `
      ${getPermFunctionBody("perm", perm, rank)}
      float process(int indices[${rank}]) {
        int a[${rank}];
        perm(a, indices);
        return _A(a);
      }`;
  return Object.assign(Object.assign({}, transposeProgramMetadata), { output: { dims: unpackedOutputShape, type: input.type, textureType: types_1$c.TextureType.unpacked }, shaderSource });
};
const getAdjustedPerm = (inputShape, perm) => {
  if (perm && perm.length !== inputShape.length) {
    perm = [...inputShape.keys()].reverse();
  }
  return perm;
};
const getOutputShape = (inputShape, perm) => {
  perm = getAdjustedPerm(inputShape, perm);
  return util_1$f.ShapeUtil.sortBasedOnPerm(inputShape, perm);
};
const getPermFunctionBody = (name2, perm, rank) => {
  const reverseFunc = [];
  reverseFunc.push(`void ${name2}(out int a[${rank}], int src[${rank}]) {`);
  for (let i = 0; i < rank; ++i) {
    reverseFunc.push(`	a[${perm[i]}]=src[${i}];`);
  }
  reverseFunc.push("	}");
  return reverseFunc.join("\n");
};
const validateInputs$e = (inputs) => {
  if (!inputs || inputs.length !== 1) {
    throw new Error("Transpose requires 1 input.");
  }
  if (inputs[0].type !== "float32" && inputs[0].type !== "float64") {
    throw new Error("input should be float tensor");
  }
};
Object.defineProperty(depthToSpace$1, "__esModule", { value: true });
depthToSpace$1.parseDepthToSpaceAttributes = depthToSpace$1.depthToSpace = void 0;
const transpose_1$2 = transpose$1;
const depthToSpace = (inferenceHandler2, inputs, attributes) => {
  validateInputs$d(inputs);
  const blocksize = attributes.blocksize;
  const blocksizeSqr = blocksize * blocksize;
  const transposePerm = attributes.mode === "DCR" ? [0, 3, 4, 1, 5, 2] : [0, 1, 4, 2, 5, 3];
  const firstReshapeShape = attributes.mode === "DCR" ? [
    inputs[0].dims[0],
    blocksize,
    blocksize,
    inputs[0].dims[1] / blocksizeSqr,
    inputs[0].dims[2],
    inputs[0].dims[3]
  ] : [
    inputs[0].dims[0],
    inputs[0].dims[1] / blocksizeSqr,
    blocksize,
    blocksize,
    inputs[0].dims[2],
    inputs[0].dims[3]
  ];
  const firstReshapedTensor = inferenceHandler2.reshapeUnpacked(inputs[0], firstReshapeShape);
  const transposeAttributes = { perm: transposePerm, cacheKey: `${transposePerm}` };
  const [transposeOutput] = transpose_1$2.transpose(inferenceHandler2, [firstReshapedTensor], transposeAttributes);
  const secondReshapeShape = [
    inputs[0].dims[0],
    inputs[0].dims[1] / blocksizeSqr,
    inputs[0].dims[2] * blocksize,
    inputs[0].dims[3] * blocksize
  ];
  const result = inferenceHandler2.reshapeUnpacked(transposeOutput, secondReshapeShape);
  return [result];
};
depthToSpace$1.depthToSpace = depthToSpace;
const parseDepthToSpaceAttributes = (node) => {
  const blocksize = node.attributes.getInt("blocksize");
  if (blocksize < 1) {
    throw new Error(`blocksize must be >= 1, but got : ${blocksize} for DepthToSpace`);
  }
  const mode = node.attributes.getString("mode", "DCR");
  if (mode !== "DCR" && mode !== "CRD") {
    throw new Error(`unrecognized mode: ${mode} for DepthToSpace`);
  }
  return { mode, blocksize };
};
depthToSpace$1.parseDepthToSpaceAttributes = parseDepthToSpaceAttributes;
const validateInputs$d = (inputs) => {
  if (inputs.length !== 1) {
    throw new Error(`DepthToSpace expect 1 inputs, but got ${inputs.length}`);
  }
  if (inputs[0].type === "string" || inputs[0].dims.length !== 4) {
    throw new TypeError("DepthToSpace input should be a 4-D numeric tensor");
  }
};
var flatten$1 = {};
Object.defineProperty(flatten$1, "__esModule", { value: true });
flatten$1.parseFlattenAttributes = flatten$1.flatten = void 0;
const util_1$e = util;
const flatten = (inferenceHandler2, inputs, axis) => {
  validateInputs$c(inputs, axis);
  const outputDims = util_1$e.ShapeUtil.flattenShape(inputs[0].dims, axis);
  return [inferenceHandler2.reshapeUnpacked(inputs[0], outputDims)];
};
flatten$1.flatten = flatten;
const parseFlattenAttributes = (node) => node.attributes.getInt("axis", 1);
flatten$1.parseFlattenAttributes = parseFlattenAttributes;
const validateInputs$c = (inputs, axis) => {
  if (!inputs || inputs.length !== 1) {
    throw new Error("Flatten requires 1 input.");
  }
  const r = inputs[0].dims.length;
  if (r === 0) {
    throw new Error("scalar tensor is not supported.");
  }
  if (axis < -r || axis > r) {
    throw new Error("Invalid axis");
  }
  if (inputs[0].type === "string") {
    throw new Error("string tensor is not supported.");
  }
};
var gather$1 = {};
var operators = {};
Object.defineProperty(operators, "__esModule", { value: true });
operators.FLOAT_TYPES = operators.INT_TYPES = operators.NUMBER_TYPES = void 0;
operators.NUMBER_TYPES = ["float32", "float64", "int32", "int16", "int8", "uint16", "uint32", "uint8"];
operators.INT_TYPES = ["int32", "int16", "int8", "uint16", "uint32", "uint8"];
operators.FLOAT_TYPES = ["float32", "float64"];
Object.defineProperty(gather$1, "__esModule", { value: true });
gather$1.parseGatherAttributes = gather$1.gather = void 0;
const attribute_with_cache_key_1$7 = attributeWithCacheKey;
const operators_1$3 = operators;
const util_1$d = util;
const types_1$b = types;
const gather = (inferenceHandler2, inputs, attributes) => {
  validateInputs$b(inputs, attributes.axis);
  const output = inferenceHandler2.run(createGatherProgramInfoLoader(inferenceHandler2, inputs, attributes), inputs);
  return [output];
};
gather$1.gather = gather;
const parseGatherAttributes = (node) => attribute_with_cache_key_1$7.createAttributeWithCacheKey({ axis: node.attributes.getInt("axis", 0) });
gather$1.parseGatherAttributes = parseGatherAttributes;
const gatherProgramMetadata = {
  name: "Gather",
  inputNames: ["A", "B"],
  inputTypes: [types_1$b.TextureType.unpacked, types_1$b.TextureType.unpacked]
};
const createGatherProgramInfo = (handler, metadata, inputs, axis) => {
  const inputShape = inputs[0].dims.slice();
  const indexDataShape = inputs[1].dims.slice();
  const outputShape = new Array(inputShape.length + indexDataShape.length - 1);
  axis = util_1$d.ShapeUtil.normalizeAxis(axis, inputShape.length);
  const indexCopyOps = [];
  for (let i = 0; i < outputShape.length; i++) {
    if (i < axis) {
      outputShape[i] = inputShape[i];
      indexCopyOps.push(`inputIdx[${i}] = outputIdx[${i}];`);
    } else {
      if (i < axis + indexDataShape.length) {
        outputShape[i] = indexDataShape[i - axis];
        indexCopyOps.push(`indexDataIdx[${i - axis}] = outputIdx[${i}];`);
      } else {
        outputShape[i] = inputShape[i - indexDataShape.length + 1];
        indexCopyOps.push(`inputIdx[${i - indexDataShape.length + 1}] = outputIdx[${i}];`);
      }
    }
  }
  const orank = outputShape.length || 1;
  const irank = inputShape.length;
  const iDrank = indexDataShape.length || 1;
  const shaderSource = `
      float process(int outputIdx[${orank}]) {
        int inputIdx[${irank}];
        int indexDataIdx[${iDrank}];
        indexDataIdx[0] = 0;
        ${indexCopyOps.join("\n        ")}
        int idx = int(_B(indexDataIdx));
        inputIdx[${axis}] = idx < 0 ? idx + ${inputShape[axis]} : idx;
        return _A(inputIdx);
      }`;
  return Object.assign(Object.assign({}, metadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$b.TextureType.unpacked }, shaderSource });
};
const createGatherProgramInfoLoader = (handler, inputs, attributes) => {
  const metadata = Object.assign(Object.assign({}, gatherProgramMetadata), { cacheHint: attributes.cacheKey });
  return Object.assign(Object.assign({}, metadata), { get: () => createGatherProgramInfo(handler, metadata, inputs, attributes.axis) });
};
const validateInputs$b = (inputs, axis) => {
  if (!inputs || inputs.length !== 2) {
    throw new Error("Gather requires 2 inputs.");
  }
  const tensorRank = inputs[0].dims.length;
  if (tensorRank < 1) {
    throw new Error("Invalid input shape.");
  }
  if (axis < -tensorRank || axis > tensorRank - 1) {
    throw new Error("Invalid axis.");
  }
  if (operators_1$3.NUMBER_TYPES.indexOf(inputs[0].type) === -1) {
    throw new Error("Invaid input type.");
  }
  if (inputs[1].type !== "int32" && inputs[1].type !== "int16") {
    throw new Error("Invaid input type.");
  }
};
var gemm$1 = {};
Object.defineProperty(gemm$1, "__esModule", { value: true });
gemm$1.parseGemmAttributesV11 = gemm$1.parseGemmAttributesV7 = gemm$1.gemm = void 0;
const attribute_with_cache_key_1$6 = attributeWithCacheKey;
const util_1$c = util;
const types_1$a = types;
const gemm = (inferenceHandler2, inputs, attributes) => {
  validateInputs$a(inputs, attributes);
  const output = inferenceHandler2.run(createGemmProgramInfoLoader(inputs, attributes), inputs);
  return [output];
};
gemm$1.gemm = gemm;
const parseGemmAttributes = (node, isOptionalC) => {
  const transA = node.attributes.getInt("transA", 0) !== 0;
  const transB = node.attributes.getInt("transB", 0) !== 0;
  const alpha = node.attributes.getFloat("alpha", 1);
  const beta = node.attributes.getFloat("beta", 1);
  return attribute_with_cache_key_1$6.createAttributeWithCacheKey({ transA, transB, alpha, beta, isOptionalC });
};
const parseGemmAttributesV7 = (node) => parseGemmAttributes(node, false);
gemm$1.parseGemmAttributesV7 = parseGemmAttributesV7;
const parseGemmAttributesV11 = (node) => parseGemmAttributes(node, true);
gemm$1.parseGemmAttributesV11 = parseGemmAttributesV11;
const createGemmProgramInfoLoader = (inputs, attributes) => {
  const metadata = {
    name: "Gemm",
    inputNames: inputs.length === 3 ? ["A", "B", "C"] : ["A", "B"],
    inputTypes: inputs.length === 3 ? [types_1$a.TextureType.unpacked, types_1$a.TextureType.unpacked, types_1$a.TextureType.unpacked] : [types_1$a.TextureType.unpacked, types_1$a.TextureType.unpacked],
    key: attributes.cacheKey
  };
  return Object.assign(Object.assign({}, metadata), { get: () => createGemmProgramInfo(metadata, inputs, attributes) });
};
const createGemmProgramInfo = (metadata, inputs, attributes) => {
  const aShape = inputs[0].dims.slice();
  const bShape = inputs[1].dims.slice();
  const [M, N] = util_1$c.GemmUtil.getShapeOfGemmResult(aShape, attributes.transA, bShape, attributes.transB, inputs.length === 3 ? inputs[2].dims : void 0);
  const outputShape = [M, N];
  if (!outputShape) {
    throw new Error("Can't use gemm on the given tensors");
  }
  let sharedDim = aShape[aShape.length - 1];
  let line = "";
  if (attributes.transA) {
    sharedDim = aShape[0];
  }
  if (attributes.transA && attributes.transB) {
    line = "value += _A_T(a) * _B_T(b);";
  } else if (attributes.transA && !attributes.transB) {
    line = "value += _A_T(a) * _B(b);";
  } else if (!attributes.transA && attributes.transB) {
    line = "value += _A(a) * _B_T(b);";
  } else if (!attributes.transA && !attributes.transB) {
    line = "value += _A(a) * _B(b);";
  }
  const rank = outputShape.length;
  const declareC = inputs.length === 3 ? `int c[${inputs[2].dims.length}];` : "";
  const broadcastC = inputs.length === 3 ? "bcastIndices_C(indices, c);" : "";
  const calculateC = inputs.length === 3 ? "value += beta * _C(c);" : "";
  const shaderSource = `
      float process(int indices[${rank}]) {
          int a[${rank}];
          int b[${rank}];
          ${declareC}

          copyVec(indices, a);
          copyVec(indices, b);
          ${broadcastC}

          float value = 0.0;
          for (int k=0; k<${sharedDim}; ++k) {
              a[${rank - 1}] = k;
              b[${rank - 2}] = k;
              ${line}
          }

          value = value * alpha;
          ${calculateC}
          return value;
      }`;
  return Object.assign(Object.assign({}, metadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$a.TextureType.unpacked }, variables: [
    { name: "alpha", type: "float", data: attributes.alpha },
    { name: "beta", type: "float", data: attributes.beta }
  ], shaderSource });
};
const validateInputs$a = (inputs, attributes) => {
  if (!inputs) {
    throw new Error("Input is missing");
  }
  if (attributes.isOptionalC && (inputs.length < 2 || inputs.length > 3)) {
    throw new Error("Invaid input shape.");
  }
  if (!attributes.isOptionalC && inputs.length !== 3) {
    throw new Error("Gemm requires 3 inputs");
  }
  if (inputs.length === 3 && inputs[2].dims.length !== 1 && inputs[2].dims.length !== 2) {
    throw new Error("Invalid input shape of C");
  }
  if (inputs[0].type !== "float32" && inputs[0].type !== "float64" || inputs[1].type !== "float32" && inputs[1].type !== "float64" || inputs.length === 3 && inputs[2].type !== "float32" && inputs[2].type !== "float64") {
    throw new Error("Invalid input type.");
  }
  if (inputs[0].type !== inputs[1].type || inputs.length === 3 && inputs[0].type !== inputs[2].type) {
    throw new Error("Input types are mismatched");
  }
};
var imageScaler$1 = {};
Object.defineProperty(imageScaler$1, "__esModule", { value: true });
imageScaler$1.parseImageScalerAttributes = imageScaler$1.imageScaler = void 0;
const attribute_with_cache_key_1$5 = attributeWithCacheKey;
const types_1$9 = types;
const imageScaler = (inferenceHandler2, inputs, attributes) => {
  validateInputs$9(inputs);
  const output = inferenceHandler2.run(createImageScalerProgramInfoLoader(inferenceHandler2, inputs, attributes), inputs);
  return [output];
};
imageScaler$1.imageScaler = imageScaler;
const parseImageScalerAttributes = (node) => {
  const scale = node.attributes.getFloat("scale");
  const bias = node.attributes.getFloats("bias");
  return attribute_with_cache_key_1$5.createAttributeWithCacheKey({ scale, bias });
};
imageScaler$1.parseImageScalerAttributes = parseImageScalerAttributes;
const imageScalerProgramMetadata = {
  name: "ImageScaler",
  inputNames: ["X"],
  inputTypes: [types_1$9.TextureType.unpacked]
};
const createImageScalerProgramInfo = (handler, metadata, inputs, attributes) => {
  const outputShape = inputs[0].dims.slice();
  const rank = outputShape.length;
  const getBiasMethod = createGetBiasMethod(attributes.bias.length);
  const shaderSource = `
      ${getBiasMethod}
      float process(int indices[${rank}]) {
        return _X(indices) * scale + getBias(bias, indices[1]);
      }`;
  return Object.assign(Object.assign({}, metadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$9.TextureType.unpacked }, variables: [
    { name: "bias", type: "float", arrayLength: attributes.bias.length, data: attributes.bias },
    { name: "scale", type: "float", data: attributes.scale }
  ], shaderSource });
};
const createImageScalerProgramInfoLoader = (handler, inputs, attributes) => {
  const metadata = Object.assign(Object.assign({}, imageScalerProgramMetadata), { cacheHint: attributes.cacheKey });
  return Object.assign(Object.assign({}, metadata), { get: () => createImageScalerProgramInfo(handler, metadata, inputs, attributes) });
};
const createGetBiasMethod = (numChannels) => {
  const codeLines = [`float getBias(float bias[${numChannels}], int channel) {`];
  for (let i = 0; i < numChannels; ++i) {
    if (i === 0) {
      codeLines.push(`	if (channel == ${i}) { return bias[${i}]; }`);
    } else if (i === numChannels - 1) {
      codeLines.push(`	else { return bias[${i}]; }`);
    } else {
      codeLines.push(`	else if (channel == ${i}) { return bias[${i}]; }`);
    }
  }
  codeLines.push("	}");
  return codeLines.join("\n");
};
const validateInputs$9 = (inputs) => {
  if (!inputs || inputs.length !== 1) {
    throw new Error("ImageScaler requires 1 input.");
  }
  if (inputs[0].dims.length !== 4) {
    throw new Error("Invalid input shape.");
  }
  if (inputs[0].type !== "float32" && inputs[0].type !== "float64") {
    throw new Error("Invalid input type.");
  }
};
var instanceNormalization$1 = {};
Object.defineProperty(instanceNormalization$1, "__esModule", { value: true });
instanceNormalization$1.parseInstanceNormalizationAttributes = instanceNormalization$1.instanceNormalization = void 0;
const glsl_source_1$7 = glslSource;
const types_1$8 = types;
const instanceNormalization = (inferenceHandler2, inputs, epsilon) => {
  validateInputs$8(inputs);
  const meanAndVariance = inferenceHandler2.run(createMeanAndVarianceProgramInfoLoader(inputs[0]), inputs);
  const output = inferenceHandler2.run(createComputeOutputProgramInfoLoader(inferenceHandler2, inputs[0], epsilon, meanAndVariance.dims), [inputs[0], meanAndVariance, inputs[1], inputs[2]]);
  return [output];
};
instanceNormalization$1.instanceNormalization = instanceNormalization;
const parseInstanceNormalizationAttributes = (node) => node.attributes.getFloat("epsilon", 1e-5);
instanceNormalization$1.parseInstanceNormalizationAttributes = parseInstanceNormalizationAttributes;
const meanAndVarianceProgramMetadata = {
  name: "InstanceNormalization_MeanAndVariance",
  inputNames: ["X"],
  inputTypes: [types_1$8.TextureType.unpacked]
};
const createMeanAndVarianceProgramInfo = (metadata, input) => {
  const xDims = input.dims.slice();
  const channel = xDims[1];
  const channelSize = xDims[2] * xDims[3];
  const outputShape = [xDims[0], channel];
  const shaderSource = `
      vec4 process(int[2] indices) {
        vec4 v = vec4(0.0);
        int a[4];
        a[0] = indices[0];
        a[1] = indices[1];
        float temp = 0.0;
        for(int a2=0; a2<${xDims[2]}; a2++) {
          a[2] = a2;
          for(int a3=0; a3<${xDims[3]}; a3++) {
            a[3] = a3;
            float x = _X(a);
            temp += x;
          }
        }
        float mean = temp / float(${channelSize});
        temp = 0.0;
        for(int a2=0; a2<${xDims[2]}; a2++) {
          a[2] = a2;
          for(int a3=0; a3<${xDims[3]}; a3++) {
            a[3] = a3;
            float x = _X(a);
            temp += (x - mean) * (x - mean);
          }
        }
        v.r = mean;
        v.g = temp / float(${channelSize});

        return v;
      }`;
  return Object.assign(Object.assign({}, metadata), { output: { dims: outputShape, type: input.type, textureType: types_1$8.TextureType.packedLastDimension }, shaderSource });
};
const createMeanAndVarianceProgramInfoLoader = (input) => Object.assign(Object.assign({}, meanAndVarianceProgramMetadata), { get: () => createMeanAndVarianceProgramInfo(meanAndVarianceProgramMetadata, input) });
const computeOutputProgramMetadata = {
  name: "InstanceNormalization_ComputeOutput",
  inputNames: ["X", "MeanAndVariance", "Scale", "B"],
  inputTypes: [types_1$8.TextureType.unpacked, types_1$8.TextureType.packedLastDimension, types_1$8.TextureType.unpacked, types_1$8.TextureType.unpacked]
};
const createComputeOutputProgramInfo = (inferenceHandler2, metadata, input, epsilon, meanAndVarianceShape) => {
  const glsl = glsl_source_1$7.getGlsl(inferenceHandler2.session.backend.glContext.version);
  const [textureWidth, textureHeight] = inferenceHandler2.calculateTextureWidthAndHeight(meanAndVarianceShape, types_1$8.TextureType.packedLastDimension);
  const [meanAndVarianceWidth, meanAndVarianceHeight] = [textureWidth / 4, textureHeight];
  const shaderSource = `
      vec4 get_MeanAndVariance(int[2] mv) {
        int offset = indicesToOffset_MeanAndVariance(mv);
        vec2 coords = offsetToCoords(offset, ${meanAndVarianceWidth}, ${meanAndVarianceHeight});
        return ${glsl.texture2D}(MeanAndVariance, coords);
      }

      float process(int[4] indices) {
        int mv[2];
        mv[0] = indices[0];
        mv[1] = indices[1];
        vec4 mean_and_variance = get_MeanAndVariance(mv);
        float mean = mean_and_variance.r;
        float variance = mean_and_variance.g;

        int sb[1];
        sb[0] = indices[1];
        float scale = _Scale(sb);
        float b = _B(sb);

        return scale * (_X(indices) - mean) / sqrt(variance + epsilon) + b;
      }`;
  return Object.assign(Object.assign({}, metadata), { output: { dims: input.dims, type: input.type, textureType: types_1$8.TextureType.unpacked }, variables: [{ name: "epsilon", type: "float", data: epsilon }], shaderSource });
};
const createComputeOutputProgramInfoLoader = (inferenceHandler2, input, epsilon, meanAndVarianceShape) => {
  const metadata = Object.assign(Object.assign({}, computeOutputProgramMetadata), { cacheHint: `${epsilon}` });
  return Object.assign(Object.assign({}, metadata), { get: () => createComputeOutputProgramInfo(inferenceHandler2, metadata, input, epsilon, meanAndVarianceShape) });
};
const validateInputs$8 = (inputs) => {
  if (!inputs || inputs.length !== 3) {
    throw new Error("InstanceNormalization requires 3 inputs.");
  }
  const X = inputs[0];
  const scale = inputs[1];
  const B = inputs[2];
  if (X.dims.length < 3 || scale.dims.length !== 1 || B.dims.length !== 1) {
    throw new Error("Invalid input shape.");
  }
  if (scale.dims[0] !== X.dims[1] || B.dims[0] !== X.dims[1]) {
    throw new Error("Input shapes are mismatched.");
  }
  if (X.type !== "float32" && X.type !== "float64" || scale.type !== "float32" && scale.type !== "float64" || B.type !== "float32" && B.type !== "float64") {
    throw new Error("Invalid input type.");
  }
  if (inputs[0].dims.length !== 4) {
    throw new Error("Only support 4-D input shape.");
  }
};
var pad = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.parsePadAttributesV11 = exports.padV11 = exports.parsePadAttributesV2 = exports.padV2 = void 0;
  const attribute_with_cache_key_12 = attributeWithCacheKey;
  const util_12 = util;
  const glsl_source_12 = glslSource;
  const types_12 = types;
  const padProgramMetadata = {
    name: "Pad",
    inputNames: ["A"],
    inputTypes: [types_12.TextureType.unpacked]
  };
  const padV2 = (inferenceHandler2, inputs, attributes) => {
    validateInputsV2(inputs);
    const output = inferenceHandler2.run(Object.assign(Object.assign({}, padProgramMetadata), { cacheHint: attributes.cacheKey, get: () => createPadProgramInfo(inferenceHandler2, inputs[0], attributes) }), inputs);
    return [output];
  };
  exports.padV2 = padV2;
  const parsePadAttributesV2 = (node) => {
    const mode = node.attributes.getString("mode", "constant");
    const value = node.attributes.getFloat("value", 0);
    const pads = node.attributes.getInts("pads");
    return attribute_with_cache_key_12.createAttributeWithCacheKey({ mode, value, pads });
  };
  exports.parsePadAttributesV2 = parsePadAttributesV2;
  const padV11 = (inferenceHandler2, inputs, mode) => {
    validateInputsV11(inputs);
    const attrubutes = generatePadAttributesFromInputs(inferenceHandler2, inputs, mode);
    return exports.padV2(inferenceHandler2, [inputs[0]], attrubutes);
  };
  exports.padV11 = padV11;
  const parsePadAttributesV11 = (node) => node.attributes.getString("mode", "constant");
  exports.parsePadAttributesV11 = parsePadAttributesV11;
  const generatePadAttributesFromInputs = (inferenceHandler2, inputs, mode) => {
    if (!inferenceHandler2.session.isInitializer(inputs[1].dataId) || inputs.length >= 3 && !inferenceHandler2.session.isInitializer(inputs[2].dataId)) {
      throw new Error("dynamic pad attributes are not allowed");
    }
    const pads = Array.from(inputs[1].integerData);
    const value = inputs.length >= 3 ? inputs[2].floatData[0] : 0;
    return attribute_with_cache_key_12.createAttributeWithCacheKey({ mode, pads, value });
  };
  const createPadProgramInfo = (inferenceHandler2, input, attributes) => {
    const outputShape = util_12.ShapeUtil.padShape(input.dims.slice(), attributes.pads);
    const rank = outputShape.length;
    const padFunction = getPadFunction(inferenceHandler2, input, attributes);
    const shaderSource = `
      ${padFunction}
      float process(int[${rank}] indices) {
          return padA(indices);
      }`;
    return {
      name: "Pad",
      inputNames: ["A"],
      inputTypes: [types_12.TextureType.unpacked],
      output: { dims: outputShape, type: input.type, textureType: types_12.TextureType.unpacked },
      shaderSource
    };
  };
  const validateInputsV2 = (inputs) => {
    if (!inputs || inputs.length !== 1) {
      throw new Error("Pad requires 1 input");
    }
    if (inputs[0].type !== "float32" && inputs[0].type !== "float64") {
      throw new Error("Invalid input type.");
    }
  };
  const validateInputsV11 = (inputs) => {
    if (!inputs || inputs.length !== 2 && inputs.length !== 3) {
      throw new Error("Pad requires 2 or 3 inputs");
    }
    if (inputs[1].type !== "int32") {
      throw new Error("Invalid input type.");
    }
    if (inputs.length >= 3 && inputs[2].type === "string") {
      throw new Error("Invalid input type.");
    }
  };
  const getPadFunction = (inferenceHandler2, input, attributes) => {
    const glsl = glsl_source_12.getGlsl(inferenceHandler2.session.backend.glContext.version);
    const [width, height] = inferenceHandler2.calculateTextureWidthAndHeight(input.dims, types_12.TextureType.unpacked);
    const strides = util_12.ShapeUtil.computeStrides(input.dims);
    switch (attributes.mode) {
      case "constant":
        return getPadConstant(glsl, input.dims, strides, width, height, attributes.pads, attributes.value);
      case "reflect":
        return getPadReflect(glsl, input.dims, strides, width, height, attributes.pads);
      case "edge":
        return getPadEdge(glsl, input.dims, strides, width, height, attributes.pads);
      default:
        throw new Error("Invalid mode");
    }
  };
  const getPadConstant = (glsl, shape2, strides, width, height, pads, value) => {
    const rank = shape2.length;
    let block = "";
    for (let i = rank - 1; i >= 0; --i) {
      block += `
        k = m[${i}] - ${pads[i]};
        if (k < 0)  return constant;
        if (k >= ${shape2[i]}) return constant;
        offset += k * ${strides[i]};
        `;
    }
    return `
      float padA(int m[${rank}]) {
        const float constant = float(${value});
        int offset = 0;
        int k = 0;
        ${block}
        vec2 coords = offsetToCoords(offset, ${width}, ${height});
        float value = getColorAsFloat(${glsl.texture2D}(A, coords));
        return value;
      }
      `;
  };
  const getPadReflect = (glsl, shape2, strides, width, height, pads) => {
    const rank = shape2.length;
    let block = "";
    for (let i = rank - 1; i >= 0; --i) {
      block += `
        k = m[${i}] - ${pads[i]};
        if (k < 0) { k = -k; }
        {
          const int _2n_1 = ${2 * (shape2[i] - 1)};
          k = int( mod( float(k), float(_2n_1) ) ) ;
          if(k >= ${shape2[i]}) { k = _2n_1 - k; }
        }
        offset += k * ${strides[i]};
        `;
    }
    return `
      float padA(int m[${rank}]) {
        int offset = 0;
        int k = 0;
        ${block}
        vec2 coords = offsetToCoords(offset, ${width}, ${height});
        float value = getColorAsFloat(${glsl.texture2D}(A, coords));
        return value;
      }
      `;
  };
  const getPadEdge = (glsl, shape2, strides, width, height, pads) => {
    const rank = shape2.length;
    let block = "";
    for (let i = rank - 1; i >= 0; --i) {
      block += `
        k = m[${i}] - ${pads[i]};
        if (k < 0)  k = 0;
        if (k >= ${shape2[i]}) k = ${shape2[i] - 1};
        offset += k * ${strides[i]};
      `;
    }
    return `
      float padA(int m[${rank}]) {
        int offset = 0;
        int k = 0;
        ${block}
        vec2 coords = offsetToCoords(offset, ${width}, ${height});
        float value = getColorAsFloat(${glsl.texture2D}(A, coords));
        return value;
      }
      `;
  };
})(pad);
var pool = {};
Object.defineProperty(pool, "__esModule", { value: true });
pool.globalMaxPool = pool.parseMaxPoolAttributes = pool.maxPool = pool.parseGlobalAveragePoolAttributes = pool.globalAveragePool = pool.parseAveragePoolAttributes = pool.averagePool = void 0;
const attribute_with_cache_key_1$4 = attributeWithCacheKey;
const util_1$b = util;
const types_1$7 = types;
const averagePool = (inferenceHandler2, inputs, attributes) => {
  validateInputs$7(inputs);
  const metadata = { name: "AveragePool", inputNames: ["X"], inputTypes: [types_1$7.TextureType.unpacked], cacheHint: attributes.cacheKey };
  const output = inferenceHandler2.run(Object.assign(Object.assign({}, metadata), { get: () => createAveragePoolProgramInfo(inputs, metadata, false, attributes) }), inputs);
  return [output];
};
pool.averagePool = averagePool;
const parseAveragePoolAttributes = (node) => {
  const autoPad = node.attributes.getString("auto_pad", "NOTSET");
  const ceilMode = node.attributes.getInt("ceil_mode", 0);
  const countIncludePad = node.attributes.getInt("count_include_pad", 0) === 0 ? false : true;
  const kernelShape = node.attributes.getInts("kernel_shape");
  const strides = node.attributes.getInts("strides", []);
  const pads = node.attributes.getInts("pads", []);
  if (ceilMode !== 0) {
    throw new Error("using ceil() in shape computation is not yet supported for AveragePool");
  }
  return attribute_with_cache_key_1$4.createAttributeWithCacheKey({ autoPad, ceilMode, countIncludePad, kernelShape, strides, pads });
};
pool.parseAveragePoolAttributes = parseAveragePoolAttributes;
const createAveragePoolProgramInfo = (inputs, metadata, isGlobalOperator, attributes) => {
  const [adjustedAttributes, outputShape] = getAdjustedPoolAttributesAndOutputShape(inputs, attributes, isGlobalOperator);
  const kernelSize = util_1$b.ShapeUtil.size(adjustedAttributes.kernelShape);
  const op1 = "value += _X(x);";
  let op2 = "";
  if (adjustedAttributes.countIncludePad) {
    op2 += `value /= float(${kernelSize});`;
  } else {
    op2 += `value /= float(${kernelSize} - pad);`;
  }
  const poolingCode = generatePoolingCode(inputs[0].dims, adjustedAttributes, op1, op2, "0.0");
  const shaderSource = `
        ${poolingCode}
      `;
  return Object.assign(Object.assign({}, metadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$7.TextureType.unpacked }, shaderSource });
};
const globalAveragePool = (inferenceHandler2, inputs, attributes) => {
  validateInputs$7(inputs);
  const metadata = {
    name: "GlobalAveragePool",
    inputNames: ["X"],
    inputTypes: [types_1$7.TextureType.unpacked],
    cacheHint: `${attributes.countIncludePad}`
  };
  const output = inferenceHandler2.run(Object.assign(Object.assign({}, metadata), { get: () => createAveragePoolProgramInfo(inputs, metadata, true, attributes) }), inputs);
  return [output];
};
pool.globalAveragePool = globalAveragePool;
const parseGlobalAveragePoolAttributes = (node) => {
  const countIncludePad = node.attributes.getInt("count_include_pad", 0) === 0 ? false : true;
  return attribute_with_cache_key_1$4.createAttributeWithCacheKey({ autoPad: "", ceilMode: 0, countIncludePad, kernelShape: [], strides: [], pads: [] });
};
pool.parseGlobalAveragePoolAttributes = parseGlobalAveragePoolAttributes;
const maxPool = (inferenceHandler2, inputs, attributes) => {
  validateInputs$7(inputs);
  const metadata = { name: "MaxPool", inputNames: ["X"], inputTypes: [types_1$7.TextureType.unpacked], cacheHint: attributes.cacheKey };
  const output = inferenceHandler2.run(Object.assign(Object.assign({}, metadata), { get: () => createMaxPoolProgramInfo(inputs, metadata, false, attributes) }), inputs);
  return [output];
};
pool.maxPool = maxPool;
const parseMaxPoolAttributes = (node) => {
  const autoPad = node.attributes.getString("auto_pad", "NOTSET");
  const ceilMode = node.attributes.getInt("ceil_mode", 0);
  const kernelShape = node.attributes.getInts("kernel_shape");
  const strides = node.attributes.getInts("strides", []);
  const pads = node.attributes.getInts("pads", []);
  const storageOrder = node.attributes.getInt("storage_order", 0);
  const dilations = node.attributes.getInts("dilations", []);
  if (storageOrder !== 0) {
    throw new Error("column major storage order is not yet supported for MaxPool");
  }
  if (ceilMode !== 0) {
    throw new Error("using ceil() in shape computation is not yet supported for MaxPool");
  }
  return attribute_with_cache_key_1$4.createAttributeWithCacheKey({ autoPad, ceilMode, countIncludePad: false, kernelShape, strides, pads, storageOrder, dilations });
};
pool.parseMaxPoolAttributes = parseMaxPoolAttributes;
const createMaxPoolProgramInfo = (inputs, metadata, isGlobalOperator, attributes) => {
  const [adjustedAttributes, outputShape] = getAdjustedPoolAttributesAndOutputShape(inputs, attributes, isGlobalOperator);
  const op1 = `
      value = max(_X(x), value);
    `;
  const op2 = "";
  const poolingCode = generatePoolingCode(inputs[0].dims, adjustedAttributes, op1, op2, "-1e5");
  const shaderSource = `
      ${poolingCode}
    `;
  return Object.assign(Object.assign({}, metadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$7.TextureType.unpacked }, shaderSource });
};
const getAdjustedPoolAttributesAndOutputShape = (inputs, attributes, isGlobalOperator) => {
  const inputShape = inputs[0].dims.slice();
  const hasDilations = Object.hasOwnProperty.call(attributes, "dilations");
  const kernelShape = attributes.kernelShape.slice();
  const strides = attributes.strides.slice();
  const dilations = hasDilations ? attributes.dilations.slice() : [];
  const pads = attributes.pads.slice();
  util_1$b.PoolConvUtil.adjustPoolAttributes(isGlobalOperator, inputShape, kernelShape, strides, dilations, pads);
  const outputShape = util_1$b.PoolConvUtil.computePoolOutputShape(isGlobalOperator, inputShape, strides, dilations, kernelShape, pads, attributes.autoPad);
  const newAttributes = Object.assign({}, attributes);
  if (hasDilations) {
    Object.assign(newAttributes, { kernelShape, strides, pads, dilations, cacheKey: attributes.cacheKey });
  } else {
    Object.assign(newAttributes, { kernelShape, strides, pads, cacheKey: attributes.cacheKey });
  }
  return [newAttributes, outputShape];
};
const globalMaxPoolAttributes = {
  autoPad: "",
  ceilMode: 0,
  countIncludePad: false,
  kernelShape: [],
  strides: [],
  pads: [],
  storageOrder: 0,
  dilations: [],
  cacheKey: ""
};
const globalMaxPoolMetadata = {
  name: "GlobalMaxPool",
  inputNames: ["X"],
  inputTypes: [types_1$7.TextureType.unpacked]
};
const globalMaxPool = (inferenceHandler2, inputs) => {
  validateInputs$7(inputs);
  const output = inferenceHandler2.run(Object.assign(Object.assign({}, globalMaxPoolMetadata), { get: () => createMaxPoolProgramInfo(inputs, globalMaxPoolMetadata, true, globalMaxPoolAttributes) }), inputs);
  return [output];
};
pool.globalMaxPool = globalMaxPool;
const validateInputs$7 = (inputs) => {
  if (!inputs || inputs.length !== 1) {
    throw new Error("Pool ops requires 1 input.");
  }
  if (inputs[0].type !== "float32" && inputs[0].type !== "float64") {
    throw new Error("Invalid input type.");
  }
};
const generatePoolingCode = (inputDims, attributes, op1, op2, start) => {
  const rank = inputDims.length;
  if (attributes.kernelShape.length <= 2) {
    const kw = attributes.kernelShape[attributes.kernelShape.length - 1];
    const sw = attributes.strides[attributes.strides.length - 1];
    const pwStart = attributes.pads[attributes.pads.length / 2 - 1];
    const pwEnd = attributes.pads[attributes.pads.length - 1];
    const dimW = inputDims[rank - 1];
    let codeW = "";
    let codeH = "";
    let codeHEnd = "";
    if (pwStart + pwEnd !== 0) {
      codeW = `
          for (int i = 0; i < ${kw}; i++) {
            x[${rank} - 1] = indices[${rank} - 1] * ${sw} - ${pwStart} + i;
            if (x[${rank} - 1] < 0 || x[${rank} - 1] >= ${dimW}) {
              pad++;
              continue;
            }
            ${op1}
          }`;
    } else {
      codeW = `
          for (int i = 0; i < ${kw}; i++) {
            x[${rank} - 1] = indices[${rank} - 1] * ${sw} - ${pwStart} + i;
            ${op1}
          }`;
    }
    if (attributes.kernelShape.length === 2) {
      const kh = attributes.kernelShape[attributes.kernelShape.length - 2];
      const sh = attributes.strides[attributes.strides.length - 2];
      const phStart = attributes.pads[attributes.pads.length / 2 - 2];
      const phEnd = attributes.pads[attributes.pads.length - 2];
      const dimH = inputDims[rank - 2];
      if (phStart + phEnd !== 0) {
        codeH = `
            for (int j = 0; j < ${kh}; j++) {
              x[${rank} - 2] = indices[${rank} - 2] * ${sh} - ${phStart} + j;
              if (x[${rank} - 2] < 0 || x[${rank} - 2] >= ${dimH}) {
                pad+= ${kw};
                continue;
              }
          `;
      } else {
        codeH = `
            for (int j = 0; j < ${kh}; j++) {
              x[${rank} - 2] = indices[${rank} - 2] * ${sh} - ${phStart} + j;
            `;
      }
      codeHEnd = `
          }
        `;
    }
    const poolingCode = `
        float process(int indices[${rank}]) {
          int x[${rank}];
          copyVec(indices, x);

          float value = ${start};
          int pad = 0;
          ${codeH}
          ${codeW}
          ${codeHEnd}
          ${op2}
          return value;
        }
      `;
    return poolingCode;
  } else {
    const kernelSize = util_1$b.ShapeUtil.size(attributes.kernelShape);
    const kernelStrides = util_1$b.ShapeUtil.computeStrides(attributes.kernelShape);
    const stridesRank = kernelStrides.length;
    const padsRank = attributes.pads.length;
    const offsetToIndicesFunction = offsetToIndices(stridesRank);
    const copyInputDims = copyArray(inputDims, "inputDims");
    const copyPads = copyArray(attributes.pads, "pads");
    const copyKernelStrides = copyArray(kernelStrides, "kernelStrides");
    const copyStrides = copyArray(attributes.strides, "strides");
    const hasPads = attributes.pads.reduce((sum2, cur) => sum2 + cur);
    let padCode = "";
    if (hasPads) {
      padCode = `
            if (x[j] >= inputDims[j] || x[j] < 0) {
              pad++;
              isPad = true;
              break;
            }
          }
          if (!isPad) {
            ${op1}
          }`;
    } else {
      padCode = `
          }
          ${op1}
        `;
    }
    const poolingCode = `
        ${offsetToIndicesFunction}
        float process(int indices[${rank}]) {
          int x[${rank}];
          copyVec(indices, x);
          int offset[${stridesRank}];
          int pads[${padsRank}];
          int inputDims[${rank}];
          int kernelStrides[${stridesRank}];
          int strides[${stridesRank}];
          ${copyPads}
          ${copyInputDims}
          ${copyStrides}
          ${copyKernelStrides}

          float value = ${start};
          int pad = 0;
          bool isPad = false;
          for (int i = 0; i < ${kernelSize}; i++) {
            offsetToIndices(i, kernelStrides, offset);
            isPad = false;
            for (int j = ${rank} - ${stridesRank}; j < ${rank}; j++) {
              x[j] = indices[j] * strides[j - ${rank} + ${stridesRank}]
                + offset[j - ${rank} + ${stridesRank}] - pads[j - 2];
              ${padCode}
          }
          ${op2}

          return value;
        }
      `;
    return poolingCode;
  }
};
const copyArray = (array, arrayName) => {
  let block = "";
  for (let i = 0; i < array.length; i++) {
    block += `
      ${arrayName}[${i}] = ${array[i]};
    `;
  }
  return block;
};
const offsetToIndices = (rank) => `
  void offsetToIndices(int offset, int[${rank}] strides, out int[${rank}] indices) {
    if (${rank} == 0) {
      return;
    }
    for (int i = 0; i < ${rank} - 1; ++i) {
      indices[i] = offset / strides[i];
      offset -= indices[i] * strides[i];
    }
    indices[${rank} - 1] = offset;
  }`;
var reduce$1 = {};
Object.defineProperty(reduce$1, "__esModule", { value: true });
reduce$1.reduceLogSumSquare = reduce$1.reduceLogSum = reduce$1.reduceProd = reduce$1.reduceMin = reduce$1.reduceMax = reduce$1.reduceMean = reduce$1.reduceSum = reduce$1.parseReduceAttributes = void 0;
const attribute_with_cache_key_1$3 = attributeWithCacheKey;
const operators_1$2 = operators;
const util_1$a = util;
const types_1$6 = types;
const reduce = (inferenceHandler2, inputs, attributes, name2, reduceOp) => {
  validateInputs$6(inputs);
  const reduceProgramMetadata = {
    name: name2,
    inputNames: ["A"],
    inputTypes: [types_1$6.TextureType.unpacked]
  };
  const output = inferenceHandler2.run(Object.assign(Object.assign({}, reduceProgramMetadata), { cacheHint: attributes.cacheKey, get: () => createReduceProgramInfo(inferenceHandler2, inputs, attributes, name2, reduceOp, reduceProgramMetadata) }), inputs);
  return [output];
};
const parseReduceAttributes = (node) => {
  const axes = node.attributes.getInts("axes", []);
  const keepDims = node.attributes.getInt("keepdims", 1) === 1;
  return attribute_with_cache_key_1$3.createAttributeWithCacheKey({ axes, keepDims });
};
reduce$1.parseReduceAttributes = parseReduceAttributes;
const createReduceProgramInfo = (handler, inputs, attributes, name2, reduceOp, reduceProgramMetadata) => {
  const outputShape = [];
  const iRank = inputs[0].dims.length || 1;
  const idxCopy = [];
  const axes = util_1$a.ShapeUtil.normalizeAxes(attributes.axes, inputs[0].dims.length);
  const ops = reduceOp(inputs, axes);
  let reduceOps = ops[1];
  for (let k = 0; k < inputs[0].dims.length; k++) {
    if (axes.indexOf(k) >= 0 || axes.length === 0) {
      if (attributes.keepDims) {
        outputShape.push(1);
      }
      reduceOps = `
          for(int j${k} = 0; j${k} < ${inputs[0].dims[k]}; j${k}++) {
            inputIdx[${k}] = j${k};
            ${reduceOps}
          }`;
    } else {
      idxCopy.push(`inputIdx[${k}] = outputIdx[${outputShape.length}];`);
      outputShape.push(inputs[0].dims[k]);
    }
  }
  const oRank = outputShape.length || 1;
  const shaderSource = `
      float process(int outputIdx[${oRank}]) {
        float value;                 // final result
        int inputIdx[${iRank}];      // addressing input data
        ${idxCopy.join("\n")}
        ${ops[0]}       // init ops for reduce max/min
        ${reduceOps}
        ${ops[2]}       // final computation for reduce mean
        return value;
      }`;
  return Object.assign(Object.assign({}, reduceProgramMetadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$6.TextureType.unpacked }, shaderSource });
};
const validateInputs$6 = (inputs) => {
  if (!inputs || inputs.length !== 1) {
    throw new Error("Reduce op requires 1 input.");
  }
  if (operators_1$2.NUMBER_TYPES.indexOf(inputs[0].type) === -1) {
    throw new Error("Invalid input type.");
  }
};
const reduceSum = (inferenceHandler2, inputs, attributes) => {
  const reduceOp = () => ["value = 0.0;", "value += _A(inputIdx);", ""];
  return reduce(inferenceHandler2, inputs, attributes, "ReduceSum", reduceOp);
};
reduce$1.reduceSum = reduceSum;
const reduceMean = (inferenceHandler2, inputs, attributes) => {
  const reduceOp = (inputs2, axes) => {
    let size = 1;
    for (let k = 0; k < inputs2[0].dims.length; k++) {
      if (axes.indexOf(k) >= 0 || axes.length === 0) {
        size *= inputs2[0].dims[k];
      }
    }
    return ["value = 0.0;", "value += _A(inputIdx);", `value /= ${size}.;`];
  };
  return reduce(inferenceHandler2, inputs, attributes, "ReduceMean", reduceOp);
};
reduce$1.reduceMean = reduceMean;
const reduceMax = (inferenceHandler2, inputs, attributes) => {
  const reduceOp = (inputs2, axes) => {
    const idxZero = [];
    for (let k = 0; k < inputs2[0].dims.length; k++) {
      if (axes.indexOf(k) >= 0 || axes.length === 0) {
        idxZero.push(`inputIdx[${k}] = 0;`);
      }
    }
    return [`${idxZero.join("\n")}
value = _A(inputIdx);`, "value = max(value, _A(inputIdx));", ""];
  };
  return reduce(inferenceHandler2, inputs, attributes, "ReduceMax", reduceOp);
};
reduce$1.reduceMax = reduceMax;
const reduceMin = (inferenceHandler2, inputs, attributes) => {
  const reduceOp = (inputs2, axes) => {
    const idxZero = [];
    for (let k = 0; k < inputs2[0].dims.length; k++) {
      if (axes.indexOf(k) >= 0 || axes.length === 0) {
        idxZero.push(`inputIdx[${k}] = 0;`);
      }
    }
    return [`${idxZero.join("\n")}
value = _A(inputIdx);`, "value = min(value, _A(inputIdx));", ""];
  };
  return reduce(inferenceHandler2, inputs, attributes, "ReduceMin", reduceOp);
};
reduce$1.reduceMin = reduceMin;
const reduceProd = (inferenceHandler2, inputs, attributes) => {
  const reduceOp = () => ["value = 1.0;", "value *= _A(inputIdx);", ""];
  return reduce(inferenceHandler2, inputs, attributes, "ReduceProd", reduceOp);
};
reduce$1.reduceProd = reduceProd;
const reduceLogSum = (inferenceHandler2, inputs, attributes) => {
  const reduceOp = () => ["value = 0.0;", "value += _A(inputIdx);", "value = log(value);"];
  return reduce(inferenceHandler2, inputs, attributes, "ReduceLogSum", reduceOp);
};
reduce$1.reduceLogSum = reduceLogSum;
const reduceLogSumSquare = (inferenceHandler2, inputs, attributes) => {
  const reduceOp = () => ["float t; value = 0.0;", "t = _A(inputIdx); value += t * t;", ""];
  return reduce(inferenceHandler2, inputs, attributes, "ReduceLogSumSquare", reduceOp);
};
reduce$1.reduceLogSumSquare = reduceLogSumSquare;
var reshape$1 = {};
Object.defineProperty(reshape$1, "__esModule", { value: true });
reshape$1.reshape = void 0;
const util_1$9 = util;
const reshape = (handler, inputs) => {
  const reshapedDims = util_1$9.ShapeUtil.calculateReshapedDims(inputs[0].dims, inputs[1].integerData);
  if (handler.session.pack) {
    return [handler.reshapePacked(inputs[0], reshapedDims)];
  } else {
    return [handler.reshapeUnpacked(inputs[0], reshapedDims)];
  }
};
reshape$1.reshape = reshape;
var resizePacked = {};
var upsample = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.scalesValidation = exports.validateInputs = exports.parseUpsampleAttributes = exports.parseUpsampleAttributesV9 = exports.parseUpsampleAttributesV7 = exports.upsample = void 0;
  const attribute_with_cache_key_12 = attributeWithCacheKey;
  const glsl_source_12 = glslSource;
  const types_12 = types;
  const upsampleProgramMetadata = {
    name: "Upsample",
    inputNames: ["X"],
    inputTypes: [types_12.TextureType.unpacked]
  };
  const upsample2 = (inferenceHandler2, inputs, attributes) => {
    exports.validateInputs(inputs, attributes);
    const output = inferenceHandler2.run(Object.assign(Object.assign({}, upsampleProgramMetadata), { cacheHint: attributes.cacheKey, get: () => createUpsampleProgramInfo(inferenceHandler2, inputs, attributes) }), inputs);
    return [output];
  };
  exports.upsample = upsample2;
  const parseUpsampleAttributesV7 = (node) => exports.parseUpsampleAttributes(node, 7);
  exports.parseUpsampleAttributesV7 = parseUpsampleAttributesV7;
  const parseUpsampleAttributesV9 = (node) => exports.parseUpsampleAttributes(node, 9);
  exports.parseUpsampleAttributesV9 = parseUpsampleAttributesV9;
  const parseUpsampleAttributes = (node, opset2) => {
    const isResize = opset2 >= 10;
    const mode = node.attributes.getString("mode", "nearest");
    if (mode !== "nearest" && mode !== "linear" && (opset2 < 11 || mode !== "cubic")) {
      throw new Error(`unrecognized mode: ${mode}`);
    }
    let scales = [];
    if (opset2 < 9) {
      scales = node.attributes.getFloats("scales");
      exports.scalesValidation(scales, mode, isResize);
    }
    const extrapolationValue = node.attributes.getFloat("extrapolation_value", 0);
    const coordinateTransformMode = opset2 > 10 ? node.attributes.getString("coordinate_transformation_mode", "half_pixel") : "asymmetric";
    if ([
      "asymmetric",
      "pytorch_half_pixel",
      "tf_half_pixel_for_nn",
      "align_corners",
      "tf_crop_and_resize",
      "half_pixel"
    ].indexOf(coordinateTransformMode) === -1) {
      throw new Error(`coordinate_transform_mode '${coordinateTransformMode}' is not supported`);
    }
    const needRoiInput = coordinateTransformMode === "tf_crop_and_resize";
    const useExtrapolation = needRoiInput;
    const nearestMode = mode === "nearest" && opset2 >= 11 ? node.attributes.getString("nearest_mode", "round_prefer_floor") : "";
    if (["round_prefer_floor", "round_prefer_ceil", "floor", "ceil", ""].indexOf(nearestMode) === -1) {
      throw new Error(`nearest_mode '${nearestMode}' is not supported`);
    }
    const cubicCoefficientA = node.attributes.getFloat("cubic_coeff_a", -0.75);
    const excludeOutside = node.attributes.getInt("exclude_outside", 0) !== 0;
    if (excludeOutside && mode !== "cubic") {
      throw new Error("exclude_outside can be set to 1 only when mode is CUBIC.");
    }
    const useNearest2xOptimization = opset2 < 11 ? true : mode === "nearest" && coordinateTransformMode === "asymmetric" && nearestMode === "floor";
    let roiInputIdx = 0;
    let scalesInputIdx = 0;
    let sizesInputIdx = 0;
    if (opset2 > 10) {
      roiInputIdx = 1;
      scalesInputIdx = 2;
      sizesInputIdx = 3;
    } else if (opset2 === 9) {
      scalesInputIdx = 1;
    }
    return attribute_with_cache_key_12.createAttributeWithCacheKey({
      opset: opset2,
      isResize,
      mode,
      scales,
      extrapolationValue,
      coordinateTransformMode,
      useExtrapolation,
      needRoiInput,
      nearestMode,
      cubicCoefficientA,
      excludeOutside,
      useNearest2xOptimization,
      roiInputIdx,
      scalesInputIdx,
      sizesInputIdx
    });
  };
  exports.parseUpsampleAttributes = parseUpsampleAttributes;
  const createUpsampleProgramInfo = (inferenceHandler2, inputs, attributes) => {
    const glsl = glsl_source_12.getGlsl(inferenceHandler2.session.backend.glContext.version);
    const [inputWidth, inputHeight] = inferenceHandler2.calculateTextureWidthAndHeight(inputs[0].dims, types_12.TextureType.unpacked);
    const outputShape = inputs[0].dims.map((dim2, i) => Math.floor(dim2 * attributes.scales[i]));
    const [outputWidth, outputHeight] = inferenceHandler2.calculateTextureWidthAndHeight(outputShape, types_12.TextureType.unpacked);
    const dim = outputShape.length;
    const outputPitches = new Array(dim);
    const inputPitches = new Array(dim);
    let precalculatedPitches = `
      int output_pitches[${dim}];
      int input_pitches[${dim}];
      `;
    for (let d = dim - 1; d >= 0; d--) {
      outputPitches[d] = d === dim - 1 ? 1 : outputPitches[d + 1] * outputShape[d + 1];
      inputPitches[d] = d === dim - 1 ? 1 : inputPitches[d + 1] * inputs[0].dims[d + 1];
      precalculatedPitches += `
        output_pitches[${d}] = ${outputPitches[d]};
        input_pitches[${d}] = ${inputPitches[d]};
        `;
    }
    const getInputFloatFunction = `
      float getInputFloat(int index) {
        vec2 coords = offsetToCoords(index, ${inputWidth}, ${inputHeight});
        float value = getColorAsFloat(${glsl.texture2D}(X, coords));
        return value;
      }
      `;
    const shaderSource = attributes.mode === "nearest" ? `
    ${getInputFloatFunction}
    float process(int indices[${dim}]) {
      int input_index = 0;
      int output_index = coordsToOffset(TexCoords, ${outputWidth}, ${outputHeight});

      ${precalculatedPitches}

      int d, m;
      for (int dim = 0; dim < ${dim}; ++dim) {
        d = output_index / output_pitches[dim];
        m = output_index - d * output_pitches[dim];
        output_index = m;

        if (scales[dim] != 1 && d > 0) {
          int d2 = d / scales[dim];
          m = d - d2 * scales[dim];
          d = d2;
        }
        input_index += input_pitches[dim] * d;
      }

      return getInputFloat(input_index);
    }` : dim === 4 ? `
    ${getInputFloatFunction}
    float process(int indices[4]) {
      int input_index = 0;
      int output_index = coordsToOffset(TexCoords, ${outputWidth}, ${outputHeight});

      ${precalculatedPitches}

      int m;
      int index_of_dim0, index_of_dim1, index_of_dim2, index_of_dim3;
      index_of_dim0 = output_index / output_pitches[0];
      m = output_index - index_of_dim0 * output_pitches[0];
      index_of_dim1 = m / output_pitches[1];
      m = m - index_of_dim1 * output_pitches[1];
      index_of_dim2 = m / output_pitches[2];
      m = m - index_of_dim2 * output_pitches[2];
      index_of_dim3 = m;

      int index_of_input_dim2, index_of_input_dim3, x_offset, y_offset;
      index_of_input_dim2 = index_of_dim2 / scales[2];
      y_offset = index_of_dim2 - index_of_input_dim2 * scales[2];
      index_of_input_dim3 = index_of_dim3 / scales[3];
      x_offset = index_of_dim3 - index_of_input_dim3 * scales[3];

      input_index = index_of_dim0 * input_pitches[0] +
            index_of_dim1 * input_pitches[1] +
            index_of_input_dim2 * input_pitches[2] +
            index_of_input_dim3;

      float x00 = getInputFloat(input_index);
      float x10, x01, x11;

      bool end_of_dim2 = false;
      if (index_of_input_dim2 == (${inputs[0].dims[2]} - 1)) {
        // It's the end in dimension 2
        x01 = x00;
        end_of_dim2 = true;
      } else {
        x01 = getInputFloat(input_index + input_pitches[2]);
      }

      if (index_of_input_dim3 == (input_pitches[2] - 1)) {
        // It's the end in dimension 3
        x10 = x00;
        x11 = x01;
      }
      else {
        x10 = getInputFloat(input_index + 1);
        x11 = end_of_dim2 ? x10 : getInputFloat(input_index + input_pitches[2] + 1);
      }

      float y0 = x00 + float(y_offset) * (x01 - x00) / float(scales[2]);
      float y1 = x10 + float(y_offset) * (x11 - x10) / float(scales[2]);
      return y0 + float(x_offset) * (y1 - y0) / float(scales[3]);
    }` : `
    ${getInputFloatFunction}
    float process(int indices[2]) {
      int input_index = 0;
      int output_index = coordsToOffset(TexCoords, ${outputWidth}, ${outputHeight});

      ${precalculatedPitches}

      int m;
      int index_of_dim0, index_of_dim1;
      index_of_dim0 = output_index / output_pitches[0];
      m = output_index - index_of_dim0 * output_pitches[0];
      index_of_dim1 = m;

      int index_of_input_dim0, index_of_input_dim1, x_offset, y_offset;
      index_of_input_dim0 = index_of_dim0 / scales[0];
      y_offset = index_of_dim0 - index_of_input_dim0 * scales[0];
      index_of_input_dim1 = index_of_dim1 / scales[1];
      x_offset = index_of_dim1 - index_of_input_dim1 * scales[1];

      input_index = index_of_input_dim0 * input_pitches[0] + index_of_input_dim1;

      float x00 = getInputFloat(input_index);
      float x10, x01, x11;

      bool end_of_dim0 = false;
      if (index_of_input_dim0 == (${inputs[0].dims[0]} - 1)) {
        // It's the end in dimension 0
        x01 = x00;
        end_of_dim0 = true;
      } else {
        x01 = getInputFloat(input_index + input_pitches[0]);
      }

      if (index_of_input_dim1 == (input_pitches[0] - 1)) {
        // It's the end in dimension 1
        x10 = x00;
        x11 = x01;
      }
      else {
        x10 = getInputFloat(input_index + 1);
        x11 = end_of_dim0 ? x10 : getInputFloat(input_index + input_pitches[0] + 1);
      }

      float y0 = x00 + float(y_offset) * (x01 - x00) / float(scales[0]);
      float y1 = x10 + float(y_offset) * (x11 - x10) / float(scales[0]);
      return y0 + float(x_offset) * (y1 - y0) / float(scales[1]);
    }`;
    return Object.assign(Object.assign({}, upsampleProgramMetadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_12.TextureType.unpacked }, shaderSource, variables: [{
      name: "scales",
      type: "int",
      arrayLength: attributes.scales.length,
      data: attributes.scales.map((x) => Math.ceil(x))
    }] });
  };
  const validateInputs2 = (inputs, attribute2) => {
    if (!inputs || attribute2.opset < 9 && inputs.length !== 1 || attribute2.opset >= 9 && attribute2.opset < 11 && inputs.length !== 2 || attribute2.opset >= 11 && inputs.length !== 3 && inputs.length !== 4) {
      throw new Error("invalid inputs.");
    }
    if (attribute2.scales.length > 0 && inputs[0].dims.length !== attribute2.scales.length) {
      throw new Error("Invalid input shape.");
    }
    if (inputs[0].type === "string") {
      throw new Error("Invalid input tensor types.");
    }
  };
  exports.validateInputs = validateInputs2;
  const scalesValidation = (scales, mode, isResize) => {
    if (!isResize) {
      for (const scale of scales) {
        if (scale < 1) {
          throw new Error("Scale value should be greater than or equal to 1.");
        }
      }
    } else {
      for (const scale of scales) {
        if (scale <= 0) {
          throw new Error("Scale value should be greater than 0.");
        }
      }
    }
    if (mode === "linear" || mode === "cubic") {
      if (scales.length !== 2 && (scales.length !== 4 || scales[0] !== 1 || scales[1] !== 1)) {
        throw new Error(`'Linear' mode and 'Cubic' mode only support 2-D inputs ('Bilinear', 'Bicubic')         or 4-D inputs with the corresponding outermost 2 scale values being 1         in the ${isResize ? "Resize" : "Upsample"} opeartor.`);
      }
    }
  };
  exports.scalesValidation = scalesValidation;
})(upsample);
Object.defineProperty(resizePacked, "__esModule", { value: true });
resizePacked.parseResizeAttributesV11 = resizePacked.parseResizeAttributesV10 = resizePacked.resize = void 0;
const glsl_source_1$6 = glslSource;
const types_1$5 = types;
const utils_1$2 = utils;
const packing_utils_1 = packingUtils;
const upsample_1$1 = upsample;
const resizeProgramMetadata = {
  name: "Resize",
  inputNames: ["A"],
  inputTypes: [types_1$5.TextureType.packed]
};
const resize = (inferenceHandler2, inputs, attributes) => {
  upsample_1$1.validateInputs(inputs, attributes);
  const output = inferenceHandler2.run(Object.assign(Object.assign({}, resizeProgramMetadata), { cacheHint: attributes.cacheKey, get: () => createPackedResizeProgramInfo(inferenceHandler2, inputs, attributes) }), inputs);
  return [output];
};
resizePacked.resize = resize;
const parseResizeAttributesV10 = (node) => upsample_1$1.parseUpsampleAttributes(node, 10);
resizePacked.parseResizeAttributesV10 = parseResizeAttributesV10;
const parseResizeAttributesV11 = (node) => upsample_1$1.parseUpsampleAttributes(node, 11);
resizePacked.parseResizeAttributesV11 = parseResizeAttributesV11;
const createPackedResizeProgramInfo = (inferenceHandler2, inputs, attributes) => {
  const glsl = glsl_source_1$6.getGlsl(inferenceHandler2.session.backend.glContext.version);
  const [scales, outputShape] = prepareInputs(inputs, attributes);
  const isSame = scales.every((s) => s === 1) && attributes.coordinateTransformMode !== "tf_crop_and_resize";
  if (isSame) {
    return Object.assign(Object.assign({}, resizeProgramMetadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$5.TextureType.packed }, hasMain: true, shaderSource: `void main() {
                    vec4 v = ${glsl.texture2D}(X, TexCoords);
                    ${glsl.output} = v;
                }` });
  }
  const dim = outputShape.length;
  if (dim < 2) {
    throw new Error(`output dimension should be at least 2, but got ${dim}`);
  }
  const outputHeight = outputShape[dim - 2];
  const outputWidth = outputShape[dim - 1];
  const inputShape = inputs[0].dims;
  if (dim !== inputShape.length) {
    throw new Error(`output dimension should match input ${inputShape.length}, but got ${dim}`);
  }
  const inputHeight = inputShape[dim - 2];
  const inputWidth = inputShape[dim - 1];
  const scalesHeight = scales[dim - 2];
  const scalesWidth = scales[dim - 1];
  let getSourceFracIndex = "";
  if (attributes.mode !== "linear") {
    throw new Error(`resize (packed) does not support mode: '${attributes.mode}'`);
  }
  switch (attributes.coordinateTransformMode) {
    case "asymmetric":
      getSourceFracIndex = `
                    vec4 getSourceFracIndex(ivec4 coords) {
                        return vec4(coords) / scaleWHWH;
                    }
                `;
      break;
    case "half_pixel":
      getSourceFracIndex = `
                    vec4 getSourceFracIndex(ivec4 coords) {
                        return (vec4(coords) + 0.5) / scaleWHWH - 0.5;
                    }
                `;
      break;
    case "align_corners":
      getSourceFracIndex = `
                    vec4 getSourceFracIndex(ivec4 coords) {
                        vec4 resized = vec4(${outputWidth}.0 - 1.0, ${outputHeight}.0 - 1.0, ${outputWidth}.0 - 1.0,
                            ${outputHeight}.0 - 1.0);
                        vec4 original = vec4(${inputWidth}.0 - 1.0, ${inputHeight}.0 - 1.0, ${inputWidth}.0 - 1.0,
                            ${inputHeight}.0 - 1.0);
                        vec4 new_scale = original / resized;
                        return vec4(coords) * new_scale;
                    }
                `;
      break;
    default:
      throw new Error(`resize (packed) does not support coordinateTransformMode:                                 '${attributes.coordinateTransformMode}'`);
  }
  const coordsDataType = utils_1$2.getCoordsDataType(dim);
  const unpackChannel = packing_utils_1.unpackFromChannel();
  const shaderSource = `
            const vec2 inputWH = vec2(${inputHeight}.0, ${inputWidth}.0);
            const vec4 scaleWHWH = vec4(${scalesHeight}.0, ${scalesWidth}.0, ${scalesHeight}.0, ${scalesWidth}.0);
            ${unpackChannel}
            ${getSourceFracIndex}
            float getAValue(int x10, int r, int c, int d) {
                return getChannel(getA(x10, r, c, d), vec2(c, d));
            }
            void main() {
                ${coordsDataType} rc = getOutputCoords();

                int batch = rc[0];
                int depth = rc[1];

                // retrieve the 4 coordinates that is used in the 4 packed output values.
                ivec4 coords = ivec4(rc.wz, rc.w + 1, rc.z + 1);

                // calculate the source index in fraction
                vec4 sourceFrac = getSourceFracIndex(coords);

                // get the lower and upper bound of the 4 values that will be packed into one texel.
                ivec4 x00 = ivec4(max(sourceFrac.xy, vec2(0.0)), min(inputWH - 1.0, ceil(sourceFrac.xy)));
                ivec4 x01 = ivec4(max(sourceFrac.xw, vec2(0.0)), min(inputWH - 1.0, ceil(sourceFrac.xw)));
                ivec4 x10 = ivec4(max(sourceFrac.zy, vec2(0.0)), min(inputWH - 1.0, ceil(sourceFrac.zy)));
                ivec4 x11 = ivec4(max(sourceFrac.zw, vec2(0.0)), min(inputWH - 1.0, ceil(sourceFrac.zw)));

                bool hasNextRow = rc.w < ${outputHeight - 1};
                bool hasNextCol = rc.z < ${outputWidth - 1};

                // pack x00, x01, x10, x11's top-left corner into one vec4 structure
                vec4 topLeft = vec4(
                    getAValue(batch, depth, x00.x, x00.y),
                    hasNextCol ? getAValue(batch, depth, x01.x, x01.y) : 0.0,
                    hasNextRow ? getAValue(batch, depth, x10.x, x10.y) : 0.0,
                    (hasNextRow && hasNextCol) ? getAValue(batch, depth, x11.x, x11.y) : 0.0);

                // pack x00, x01, x10, x11's top-right corner into one vec4 structure
                vec4 topRight = vec4(
                    getAValue(batch, depth, x00.x, x00.w),
                    hasNextCol ? getAValue(batch, depth, x01.x, x01.w) : 0.0,
                    hasNextRow ? getAValue(batch, depth, x10.x, x10.w) : 0.0,
                    (hasNextRow && hasNextCol) ? getAValue(batch, depth, x11.x, x11.w) : 0.0);

                // pack x00, x01, x10, x11's bottom-left corner into one vec4 structure
                vec4 bottomLeft = vec4(
                    getAValue(batch, depth, x00.z, x00.y),
                    hasNextCol ? getAValue(batch, depth, x01.z, x01.y) : 0.0,
                    hasNextRow ? getAValue(batch, depth, x10.z, x10.y) : 0.0,
                    (hasNextRow && hasNextCol) ? getAValue(batch, depth, x11.z, x11.y) : 0.0);

                // pack x00, x01, x10, x11's bottom-right corner into one vec4 structure
                vec4 bottomRight = vec4(
                    getAValue(batch, depth, x00.z, x00.w),
                    hasNextCol ? getAValue(batch, depth, x01.z, x01.w) : 0.0,
                    hasNextRow ? getAValue(batch, depth, x10.z, x10.w) : 0.0,
                    (hasNextRow && hasNextCol) ? getAValue(batch, depth, x11.z, x11.w) : 0.0);

                // calculate the interpolation fraction on u and v direction
                vec4 frac = vec4(sourceFrac) - floor(sourceFrac);
                vec4 clampFrac = clamp(frac, vec4(0.0), vec4(1.0));

                vec4 top = mix(topLeft, topRight, clampFrac.ywyw);
                vec4 bottom = mix(bottomLeft, bottomRight, clampFrac.ywyw);
                vec4 newValue = mix(top, bottom, clampFrac.xxzz);

                ${glsl.output} = vec4(newValue);
            }
        `;
  return Object.assign(Object.assign({}, resizeProgramMetadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$5.TextureType.packed }, hasMain: true, shaderSource });
};
const prepareInputs = (inputs, attributes) => {
  const x = inputs[0];
  const xDims = x.dims;
  let scales = attributes.scales;
  let outputSizes;
  if (scales.length === 0) {
    const scalesTensor = inputs[attributes.scalesInputIdx];
    if (scalesTensor && scalesTensor.size !== 0) {
      if (inputs[attributes.sizesInputIdx]) {
        throw new Error("Only one of scales or sizes must be provided as input.");
      }
      scales = parseScalesData(scalesTensor, attributes.mode, attributes.isResize);
    } else {
      const sizesTensor = inputs[attributes.sizesInputIdx];
      if (!sizesTensor || sizesTensor.size === 0) {
        throw new Error("Either scales or sizes MUST be provided as input.");
      }
      outputSizes = Array.from(sizesTensor.integerData);
      scales = parseScalesDataFromOutputSize(outputSizes, xDims, attributes.mode, attributes.isResize);
    }
  } else {
    if (inputs[attributes.sizesInputIdx]) {
      throw new Error("Only one of scales or sizes must be provided as input.");
    }
  }
  const yDims = outputSizes || xDims.map((dim, i) => Math.floor(dim * scales[i]));
  return [scales, yDims];
};
const parseScalesData = (scale, mode, isResize) => {
  const scales = Array.from(scale.floatData);
  upsample_1$1.scalesValidation(scales, mode, isResize);
  return scales;
};
const parseScalesDataFromOutputSize = (yDims, xDims, mode, isResize) => {
  const length2 = xDims.length;
  const scales = new Array(length2);
  for (let i = 0, end2 = length2; i < end2; i++) {
    if (xDims[i] === 0) {
      if (yDims[i] !== 0) {
        throw new Error("Input dim is zero but required output dim is non-zero.");
      }
      scales[i] = 1;
    } else {
      scales[i] = yDims[i] / xDims[i];
    }
  }
  upsample_1$1.scalesValidation(scales, mode, isResize);
  return scales;
};
var shape$1 = {};
Object.defineProperty(shape$1, "__esModule", { value: true });
shape$1.shape = void 0;
const tensor_1$3 = tensor;
const shape = (inferenceHandler2, inputs) => {
  validateInputs$5(inputs);
  return [new tensor_1$3.Tensor([inputs[0].dims.length], "int32", void 0, void 0, new Int32Array(inputs[0].dims))];
};
shape$1.shape = shape;
const validateInputs$5 = (inputs) => {
  if (!inputs || inputs.length !== 1) {
    throw new Error("Shape requires 1 input.");
  }
};
var slice$1 = {};
Object.defineProperty(slice$1, "__esModule", { value: true });
slice$1.sliceV10 = slice$1.parseSliceAttributes = slice$1.slice = void 0;
const attribute_with_cache_key_1$2 = attributeWithCacheKey;
const operators_1$1 = operators;
const util_1$8 = util;
const types_1$4 = types;
const sliceProgramMetadata = {
  name: "Slice",
  inputNames: ["A"],
  inputTypes: [types_1$4.TextureType.unpacked]
};
const slice = (inferenceHandler2, inputs, attributes) => {
  validateInputs$4(inputs);
  const output = inferenceHandler2.run(Object.assign(Object.assign({}, sliceProgramMetadata), { cacheHint: attributes.cacheKey, get: () => createSliceProgramInfo(inferenceHandler2, inputs[0], attributes) }), inputs);
  return [output];
};
slice$1.slice = slice;
const parseSliceAttributes = (node) => {
  const starts = node.attributes.getInts("starts");
  const ends = node.attributes.getInts("ends");
  const axes = node.attributes.getInts("axes", []);
  return attribute_with_cache_key_1$2.createAttributeWithCacheKey({ starts, ends, axes });
};
slice$1.parseSliceAttributes = parseSliceAttributes;
const createSliceProgramInfo = (inferenceHandler2, input, attributes) => {
  const axes = attributes.axes.length === 0 ? input.dims.slice(0).map((val, i) => i) : attributes.axes;
  const normalizedAxes = util_1$8.ShapeUtil.normalizeAxes(axes, input.dims.length);
  const starts = attributes.starts.map((start, i) => {
    if (start > input.dims[normalizedAxes[i]] - 1) {
      return input.dims[normalizedAxes[i]];
    }
    return util_1$8.ShapeUtil.normalizeAxis(start, input.dims[normalizedAxes[i]]);
  });
  const ends = attributes.ends.map((end2, i) => {
    if (end2 > input.dims[normalizedAxes[i]] - 1) {
      return input.dims[normalizedAxes[i]];
    }
    return util_1$8.ShapeUtil.normalizeAxis(end2, input.dims[normalizedAxes[i]]);
  });
  const outputShape = input.dims.slice();
  const sliceOps = [];
  for (let i = 0; i < normalizedAxes.length; i++) {
    outputShape[normalizedAxes[i]] = ends[i] - starts[i];
    if (starts[i] > 0) {
      sliceOps.push(`outputIdx[${normalizedAxes[i]}] += ${starts[i]};`);
    }
  }
  const rank = outputShape.length;
  const shaderSource = `
      float process(int outputIdx[${rank}]) {
        ${sliceOps.join("\n      ")}
        return _A(outputIdx);
      }`;
  return Object.assign(Object.assign({}, sliceProgramMetadata), { output: { dims: outputShape, type: input.type, textureType: types_1$4.TextureType.unpacked }, shaderSource });
};
const validateInputs$4 = (inputs) => {
  if (!inputs || inputs.length !== 1) {
    throw new Error("Slice requires 1 input.");
  }
  if (operators_1$1.NUMBER_TYPES.indexOf(inputs[0].type) === -1) {
    throw new Error("Invalid input type.");
  }
};
const sliceV10 = (inferenceHandler2, inputs) => {
  validateInputsV10(inputs);
  const attributes = generateSliceAttributesFromInputs(inferenceHandler2, inputs);
  const output = inferenceHandler2.run(Object.assign(Object.assign({}, sliceProgramMetadata), { cacheHint: attributes.cacheKey, get: () => createSliceProgramInfo(inferenceHandler2, inputs[0], attributes) }), [inputs[0]]);
  return [output];
};
slice$1.sliceV10 = sliceV10;
const generateSliceAttributesFromInputs = (inferenceHandler2, inputs) => {
  if (!inferenceHandler2.session.isInitializer(inputs[1].dataId) || !inferenceHandler2.session.isInitializer(inputs[2].dataId) || inputs.length >= 4 && !inferenceHandler2.session.isInitializer(inputs[3].dataId) || inputs.length >= 5 && !inferenceHandler2.session.isInitializer(inputs[4].dataId)) {
    throw new Error("dynamic slice attributes are not allowed");
  }
  if (inputs.length >= 5 && inputs[4].integerData.some((i) => i !== 1)) {
    throw new Error("currently non-1 steps is not supported for Slice");
  }
  const starts = Array.from(inputs[1].integerData);
  const ends = Array.from(inputs[2].integerData);
  const axes = inputs.length >= 4 ? Array.from(inputs[3].integerData) : [];
  const cacheKey = `${axes};${starts};${ends}`;
  return { starts, ends, axes, cacheKey };
};
const validateInputsV10 = (inputs) => {
  if (!inputs || inputs.length < 3 || inputs.length > 5) {
    throw new Error("Invalid input number.");
  }
  if (inputs[1].type !== "int32" || inputs[1].dims.length !== 1) {
    throw new Error("Invalid input type.");
  }
  if (inputs[2].type !== "int32" || inputs[2].dims.length !== 1) {
    throw new Error("Invalid input type.");
  }
  if (inputs.length >= 4 && (inputs[3].type !== "int32" || inputs[3].dims.length !== 1)) {
    throw new Error("Invalid input type.");
  }
  if (inputs.length >= 5 && (inputs[4].type !== "int32" || inputs[4].dims.length !== 1)) {
    throw new Error("Invalid input type.");
  }
};
var softmax$1 = {};
Object.defineProperty(softmax$1, "__esModule", { value: true });
softmax$1.softmaxV13 = softmax$1.parseSoftmaxAttributesV13 = softmax$1.parseSoftmaxAttributes = softmax$1.softmax = void 0;
const attribute_with_cache_key_1$1 = attributeWithCacheKey;
const util_1$7 = util;
const glsl_source_1$5 = glslSource;
const types_1$3 = types;
const transpose_1$1 = transpose$1;
const softmaxComputeMaxProgramMetadata = {
  name: "SoftmaxComputeMax",
  inputNames: ["A"],
  inputTypes: [types_1$3.TextureType.unpacked]
};
const softmaxComputeScaleProgramMetadata = {
  name: "SoftmaxComputeScale",
  inputNames: ["A", "Max"],
  inputTypes: [types_1$3.TextureType.unpacked, types_1$3.TextureType.unpacked]
};
const softmaxProgramMetadata = {
  name: "SoftMax",
  inputNames: ["A", "Max", "Norm"],
  inputTypes: [types_1$3.TextureType.unpacked, types_1$3.TextureType.unpacked, types_1$3.TextureType.unpacked]
};
const softmax = (inferenceHandler2, inputs, attributes) => {
  validateInputs$3(inputs);
  const inputShape = inputs[0].dims.slice();
  const axis = util_1$7.ShapeUtil.normalizeAxis(attributes.axis, inputShape.length);
  const logicalRowCount = util_1$7.ShapeUtil.sizeToDimension(inputShape, axis);
  const featureCount = util_1$7.ShapeUtil.sizeFromDimension(inputShape, axis);
  const output = computeSoftmax(inferenceHandler2, inputs, attributes, logicalRowCount, featureCount);
  return output;
};
softmax$1.softmax = softmax;
const parseSoftmaxAttributes = (node) => attribute_with_cache_key_1$1.createAttributeWithCacheKey({ axis: node.attributes.getInt("axis", 1) });
softmax$1.parseSoftmaxAttributes = parseSoftmaxAttributes;
const parseSoftmaxAttributesV13 = (node) => attribute_with_cache_key_1$1.createAttributeWithCacheKey({ axis: node.attributes.getInt("axis", -1) });
softmax$1.parseSoftmaxAttributesV13 = parseSoftmaxAttributesV13;
const softmaxV13 = (inferenceHandler2, inputs, attributes) => {
  validateInputs$3(inputs);
  const inputShape = inputs[0].dims.slice();
  const axis = util_1$7.ShapeUtil.normalizeAxis(attributes.axis, inputShape.length);
  const rank = inputShape.length;
  const isTransposeRequired = axis !== rank - 1 ? true : false;
  const transposedInputShape = [];
  let perm = [];
  let transposedInputs = [];
  let transposeAttribute;
  if (isTransposeRequired) {
    perm = Array.from({ length: rank }).map((_, i) => i);
    perm[axis] = rank - 1;
    perm[rank - 1] = axis;
    perm.map((p) => transposedInputShape.push(inputShape[p]));
    transposeAttribute = attribute_with_cache_key_1$1.createAttributeWithCacheKey({ perm });
    transposedInputs = transpose_1$1.transpose(inferenceHandler2, inputs, transposeAttribute);
  }
  const logicalRowCount = isTransposeRequired ? util_1$7.ShapeUtil.sizeToDimension(transposedInputShape, rank - 1) : util_1$7.ShapeUtil.sizeToDimension(inputShape, rank - 1);
  const featureCount = isTransposeRequired ? util_1$7.ShapeUtil.sizeFromDimension(transposedInputShape, rank - 1) : util_1$7.ShapeUtil.sizeFromDimension(inputShape, rank - 1);
  const output = computeSoftmax(inferenceHandler2, isTransposeRequired ? transposedInputs : inputs, attributes, logicalRowCount, featureCount);
  if (isTransposeRequired) {
    const reversedOutput = transpose_1$1.transpose(inferenceHandler2, output, transposeAttribute);
    return reversedOutput;
  } else {
    return output;
  }
};
softmax$1.softmaxV13 = softmaxV13;
const computeSoftmax = (inferenceHandler2, inputs, attributes, logicalRowCount, featureCount) => {
  const computeMaxProgramInfo = createComputeMaxProgramInfo(inferenceHandler2, inputs[0], logicalRowCount, featureCount, [logicalRowCount]);
  const max = inferenceHandler2.run(Object.assign(Object.assign({}, softmaxComputeMaxProgramMetadata), { cacheHint: attributes.cacheKey, get: () => computeMaxProgramInfo }), inputs);
  const computeScaleProgramInfo = createComputScaleProgramInfo(inferenceHandler2, inputs[0], logicalRowCount, featureCount, computeMaxProgramInfo.output.dims, [logicalRowCount]);
  const scale = inferenceHandler2.run(Object.assign(Object.assign({}, softmaxComputeScaleProgramMetadata), { cacheHint: attributes.cacheKey, get: () => computeScaleProgramInfo }), [inputs[0], max]);
  const softMaxProgramInfo = createSoftMaxProgramInfo(inferenceHandler2, inputs[0], logicalRowCount, featureCount, computeMaxProgramInfo.output.dims, computeScaleProgramInfo.output.dims);
  const output = inferenceHandler2.run(Object.assign(Object.assign({}, softmaxProgramMetadata), { cacheHint: attributes.cacheKey, get: () => softMaxProgramInfo }), [inputs[0], max, scale]);
  return [output];
};
const createComputeMaxProgramInfo = (inferenceHandler2, input, logicalRowCount, featureCount, outputShape) => {
  const [textureWidth, textureHeight] = inferenceHandler2.calculateTextureWidthAndHeight(input.dims, types_1$3.TextureType.unpacked);
  const rank = outputShape.length;
  if (logicalRowCount < 1 || featureCount < 1) {
    throw new Error("Logical row count N and feature count D must be greater than or equal to 1");
  }
  if (outputShape.length !== 1) {
    throw new Error("Dimensionality of the output should be 1");
  }
  if (outputShape[0] !== logicalRowCount) {
    throw new Error("Shape of the output should be equal to logical row count");
  }
  const glsl = glsl_source_1$5.getGlsl(inferenceHandler2.session.backend.glContext.version);
  const shaderSource = `
      float process(int[${rank}] indices) {
        int logical_row_start_offset = indices[0] * ${featureCount};

        float max = getColorAsFloat(${glsl.texture2D}(A, offsetToCoords(logical_row_start_offset, ${textureWidth},
        ${textureHeight} )));
        for(int i=1; i<${featureCount}; ++i)
        {
          float current = getColorAsFloat(${glsl.texture2D}(A, offsetToCoords(logical_row_start_offset + i,
            ${textureWidth}, ${textureHeight})));
          if(current > max)
          max = current;
        }

        return max;
      }`;
  return Object.assign(Object.assign({}, softmaxComputeMaxProgramMetadata), { output: { dims: outputShape, type: input.type, textureType: types_1$3.TextureType.unpacked }, shaderSource });
};
const createComputScaleProgramInfo = (inferenceHandler2, input, logicalRowCount, featureCount, maxElementPerLogicalRow, outputShape) => {
  const [textureWidth, textureHeight] = inferenceHandler2.calculateTextureWidthAndHeight(input.dims, types_1$3.TextureType.unpacked);
  const rank = outputShape.length;
  if (logicalRowCount < 1 || featureCount < 1) {
    throw new Error("Logical row count N and feature count D must be greater than or equal to 1");
  }
  if (outputShape.length !== 1) {
    throw new Error("Dimensionality of the output should be 1");
  }
  if (outputShape[0] !== logicalRowCount) {
    throw new Error("Shape of the output should be equal to logical row count");
  }
  if (maxElementPerLogicalRow.length !== 1) {
    throw new Error("Dimensionality of the intermediate results should be 1");
  }
  if (maxElementPerLogicalRow[0] !== logicalRowCount) {
    throw new Error("Shape of the intermediate results should be equal to logical row count");
  }
  const glsl = glsl_source_1$5.getGlsl(inferenceHandler2.session.backend.glContext.version);
  const shaderSource = `
      float process(int[${rank}] indices) {
        int logical_row_start_offset = indices[0] * ${featureCount};

        float norm_factor = 0.0;
        float max = _Max(indices);
        for(int i=0; i<${featureCount}; ++i)
        {
          norm_factor += exp(getColorAsFloat(${glsl.texture2D}(A, offsetToCoords(logical_row_start_offset + i,
            ${textureWidth}, ${textureHeight}))) - max);
        }

        return norm_factor;
      }`;
  return Object.assign(Object.assign({}, softmaxComputeScaleProgramMetadata), { output: { dims: outputShape, type: input.type, textureType: types_1$3.TextureType.unpacked }, shaderSource });
};
const createSoftMaxProgramInfo = (inferenceHandler2, input, logicalRowCount, featureCount, maxElementPerLogicalRow, normalizationPerLogicalRow) => {
  const [textureWidth, textureHeight] = inferenceHandler2.calculateTextureWidthAndHeight(input.dims, types_1$3.TextureType.unpacked);
  const rank = input.dims.length;
  if (logicalRowCount < 1 || featureCount < 1) {
    throw new Error("Logical row count N and feature count D must be greater than or equal to 1");
  }
  if (maxElementPerLogicalRow.length !== 1 || normalizationPerLogicalRow.length !== 1) {
    throw new Error("Dimensionality of the intermediate results should be 1");
  }
  if (maxElementPerLogicalRow[0] !== logicalRowCount || normalizationPerLogicalRow[0] !== logicalRowCount) {
    throw new Error("Shape of the intermediate results should be equal to logical row count");
  }
  const shaderSource = `
      float process(int[${rank}] indices) {

      // get offset of current logical tensor index from the 2-D texture coordinates (TexCoords)
      int offset = coordsToOffset(TexCoords, ${textureWidth}, ${textureHeight});

      //determine the logical row for this index
      int logical_row_index[1];
      logical_row_index[0] = offset / ${featureCount};

      float norm_factor = _Norm(logical_row_index);

      // avoid possible division by 0
      // if norm_facor is 0, all elements are zero
      // if so, return 0
      if(norm_factor == 0.0)
        return 0.0;

      return exp(_A(indices) - _Max(logical_row_index)) / norm_factor;
    }`;
  return Object.assign(Object.assign({}, softmaxProgramMetadata), { output: { dims: input.dims, type: input.type, textureType: types_1$3.TextureType.unpacked }, shaderSource });
};
const validateInputs$3 = (inputs) => {
  if (!inputs || inputs.length !== 1) {
    throw new Error("Softmax requires 1 input.");
  }
  if (inputs[0].type !== "float32" && inputs[0].type !== "float64") {
    throw new Error("Invalid input type");
  }
};
var split$1 = {};
Object.defineProperty(split$1, "__esModule", { value: true });
split$1.parseSplitAttributes = split$1.split = void 0;
const attribute_with_cache_key_1 = attributeWithCacheKey;
const util_1$6 = util;
const types_1$2 = types;
const splitProgramMetadata = {
  name: "Split",
  inputNames: ["A"],
  inputTypes: [types_1$2.TextureType.unpacked]
};
const split = (inferenceHandler2, inputs, attributes) => {
  validateInputs$2(inputs);
  const axis = util_1$6.ShapeUtil.normalizeAxis(attributes.axis, inputs[0].dims.length);
  const count = getProgramCount(inferenceHandler2, inputs, axis, attributes);
  const output = [];
  for (let i = 0; i < count; ++i) {
    output.push(inferenceHandler2.run(Object.assign(Object.assign({}, splitProgramMetadata), { cacheHint: `${attributes.cacheKey};${i}`, get: () => createSplitProgramInfo(inferenceHandler2, inputs[0], attributes, axis, i) }), inputs));
  }
  return output;
};
split$1.split = split;
const parseSplitAttributes = (node) => {
  const axis = node.attributes.getInt("axis", 0);
  const split2 = node.attributes.getInts("split", []);
  const numOutputs = node.outputs.length;
  return attribute_with_cache_key_1.createAttributeWithCacheKey({ axis, split: split2, numOutputs });
};
split$1.parseSplitAttributes = parseSplitAttributes;
const getProgramCount = (inferenceHandler2, inputs, axis, attributes) => {
  const [, offsets] = util_1$6.SplitUtil.splitShape(inputs[0].dims, axis, attributes.split, attributes.numOutputs);
  return offsets.length;
};
const createSplitProgramInfo = (inferenceHandler2, input, attributes, axis, index) => {
  const [shapes, offsets] = util_1$6.SplitUtil.splitShape(input.dims, axis, attributes.split, attributes.numOutputs);
  const offset = offsets[index];
  const outputShape = shapes[index];
  const rank = outputShape.length;
  const shaderSource = `
      float process(int indices[${rank}]) {
        indices[${axis}] += ${offset};
        return _A(indices);
      }
    `;
  return Object.assign(Object.assign({}, splitProgramMetadata), { cacheHint: `${attributes.cacheKey}:${index}`, output: { dims: outputShape, type: input.type, textureType: types_1$2.TextureType.unpacked }, shaderSource });
};
const validateInputs$2 = (inputs) => {
  if (!inputs || inputs.length !== 1) {
    throw new Error("Split requires one input.");
  }
  if (inputs[0].type !== "int8" && inputs[0].type !== "uint8" && inputs[0].type !== "int16" && inputs[0].type !== "uint16" && inputs[0].type !== "int32" && inputs[0].type !== "uint32" && inputs[0].type !== "float32" && inputs[0].type !== "float64" && inputs[0].type !== "bool") {
    throw new Error("Invalid input type.");
  }
};
var squeeze = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.parseSqueezeAttributes = exports.squeezeV13 = exports.squeeze = void 0;
  const util_12 = util;
  const squeeze2 = (inferenceHandler2, inputs, axes) => {
    validateInputs2(inputs);
    const outputShape = util_12.ShapeUtil.squeezeShape(inputs[0].dims, axes);
    const output = inferenceHandler2.reshapeUnpacked(inputs[0], outputShape);
    return [output];
  };
  exports.squeeze = squeeze2;
  const squeezeV13 = (inferenceHandler2, inputs) => {
    validateInputsV13(inputs);
    return exports.squeeze(inferenceHandler2, [inputs[0]], Array.from(inputs[1].integerData));
  };
  exports.squeezeV13 = squeezeV13;
  const parseSqueezeAttributes = (node) => node.attributes.getInts("axes");
  exports.parseSqueezeAttributes = parseSqueezeAttributes;
  const validateInputs2 = (inputs) => {
    if (!inputs || inputs.length !== 1) {
      throw new Error("Squeeze requires 1 input.");
    }
    if (inputs[0].type === "string") {
      throw new Error("invalid input tensor types.");
    }
  };
  const validateInputsV13 = (inputs) => {
    if (!inputs || inputs.length !== 2) {
      throw new Error("Squeeze requires 2 inputs.");
    }
    if (inputs[1].type !== "int32") {
      throw new Error("Invalid input type.");
    }
  };
})(squeeze);
var sum$1 = {};
Object.defineProperty(sum$1, "__esModule", { value: true });
sum$1.sum = void 0;
const glsl_source_1$4 = glslSource;
const types_1$1 = types;
const sum = (inferenceHandler2, inputs) => {
  validateInputs$1(inputs);
  const sumProgramMetadata = {
    name: "Sum",
    inputNames: inputs.map((v, i) => `X${i}`),
    inputTypes: new Array(inputs.length).fill(types_1$1.TextureType.unpacked)
  };
  const output = inferenceHandler2.run(Object.assign(Object.assign({}, sumProgramMetadata), { get: () => createSumProgramInfo(inferenceHandler2, inputs, sumProgramMetadata) }), inputs);
  return [output];
};
sum$1.sum = sum;
const createSumProgramInfo = (inferenceHandler2, inputs, sumProgramMetadata) => {
  const glsl = glsl_source_1$4.getGlsl(inferenceHandler2.session.backend.glContext.version);
  const outputShape = inputs[0].dims.slice();
  const sumLine = inputs.map((v, i) => `${glsl.texture2D}(X${i},TexCoords)`).join(" + ");
  const shaderSource = `
      void main() {
        vec4 result = ${sumLine};
        ${glsl.output} = result;
      }
    `;
  return Object.assign(Object.assign({}, sumProgramMetadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1$1.TextureType.unpacked }, hasMain: true, shaderSource });
};
const validateInputs$1 = (inputs) => {
  if (!inputs || inputs.length === 0) {
    throw new Error("Sum requires inputs.");
  }
  const length2 = inputs[0].dims.length;
  for (let i = 1; i < inputs.length; i++) {
    if (length2 !== inputs[i].dims.length) {
      throw new Error("Input shapes are mismatched.");
    }
    for (let j = 0; j < length2; j++) {
      if (inputs[0].dims[j] !== inputs[i].dims[j]) {
        throw new Error("Input shapes are not matched.");
      }
    }
  }
  if (inputs[0].type !== "float32" && inputs[0].type !== "float64") {
    throw new Error("Invalid input type.");
  }
  for (let i = 1; i < inputs.length; i++) {
    if (inputs[0].type !== inputs[i].type) {
      throw new Error("Input types are not matched.");
    }
  }
};
var tile$1 = {};
Object.defineProperty(tile$1, "__esModule", { value: true });
tile$1.tile = void 0;
const operators_1 = operators;
const types_1 = types;
const tile = (inferenceHandler2, inputs) => {
  validateInputs(inputs);
  const tileProgramMetadata = {
    name: "Tile",
    inputNames: ["A"],
    inputTypes: [types_1.TextureType.unpacked]
  };
  const output = inferenceHandler2.run(Object.assign(Object.assign({}, tileProgramMetadata), { get: () => createTileProgramInfo(inferenceHandler2, inputs, tileProgramMetadata) }), inputs);
  return [output];
};
tile$1.tile = tile;
const createTileProgramInfo = (handler, inputs, tileProgramMetadata) => {
  const inputShape = inputs[0].dims.slice();
  const outputShape = new Array(inputShape.length);
  const tileOps = [];
  for (let i = 0; i < inputShape.length; i++) {
    outputShape[i] = inputShape[i] * inputs[1].numberData[i];
    tileOps.push(`inputIdx[${i}] = int(mod(float(outputIdx[${i}]), ${inputShape[i]}.));`);
  }
  const rank = outputShape.length;
  const shaderSource = `
      float process(int outputIdx[${rank}]) {
        int inputIdx[${rank}];
        ${tileOps.join("\n")}
        return _A(inputIdx);
      }
    `;
  return Object.assign(Object.assign({}, tileProgramMetadata), { output: { dims: outputShape, type: inputs[0].type, textureType: types_1.TextureType.unpacked }, shaderSource });
};
const validateInputs = (inputs) => {
  if (!inputs || inputs.length !== 2) {
    throw new Error("Tile requires 2 input.");
  }
  if (inputs[1].dims.length !== 1) {
    throw new Error("The second input shape must 1 dimension.");
  }
  if (inputs[1].dims[0] !== inputs[0].dims.length) {
    throw new Error("Invalid input shape.");
  }
  if (operators_1.NUMBER_TYPES.indexOf(inputs[0].type) === -1) {
    throw new Error("Invalid input type.");
  }
  if (inputs[1].type !== "int32" && inputs[1].type !== "int16") {
    throw new Error("Invalid repeat type.");
  }
};
var unsqueeze = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.parseUnsqueezeAttributes = exports.unsqueezeV13 = exports.unsqueeze = void 0;
  const util_12 = util;
  const unsqueeze2 = (inferenceHandler2, inputs, axes) => {
    validateInputs2(inputs);
    const outputShape = util_12.ShapeUtil.unsqueezeShape(inputs[0].dims, axes);
    const output = inferenceHandler2.reshapeUnpacked(inputs[0], outputShape);
    return [output];
  };
  exports.unsqueeze = unsqueeze2;
  const unsqueezeV13 = (inferenceHandler2, inputs) => {
    validateInputsV13(inputs);
    return exports.unsqueeze(inferenceHandler2, [inputs[0]], Array.from(inputs[1].integerData));
  };
  exports.unsqueezeV13 = unsqueezeV13;
  const parseUnsqueezeAttributes = (node) => node.attributes.getInts("axes");
  exports.parseUnsqueezeAttributes = parseUnsqueezeAttributes;
  const validateInputs2 = (inputs) => {
    if (!inputs || inputs.length !== 1) {
      throw new Error("Unsqueeze requires 1 input.");
    }
    if (inputs[0].type === "string") {
      throw new Error("invalid input tensor types.");
    }
  };
  const validateInputsV13 = (inputs) => {
    if (!inputs || inputs.length !== 2) {
      throw new Error("Unsqueeze requires 2 inputs.");
    }
    if (inputs[1].type !== "int32") {
      throw new Error("Invalid input type.");
    }
  };
})(unsqueeze);
var __createBinding$3 = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(o, m, k, k2) {
  if (k2 === void 0)
    k2 = k;
  Object.defineProperty(o, k2, { enumerable: true, get: function() {
    return m[k];
  } });
} : function(o, m, k, k2) {
  if (k2 === void 0)
    k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault$3 = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
} : function(o, v) {
  o["default"] = v;
});
var __importStar$3 = commonjsGlobal && commonjsGlobal.__importStar || function(mod2) {
  if (mod2 && mod2.__esModule)
    return mod2;
  var result = {};
  if (mod2 != null) {
    for (var k in mod2)
      if (k !== "default" && Object.prototype.hasOwnProperty.call(mod2, k))
        __createBinding$3(result, mod2, k);
  }
  __setModuleDefault$3(result, mod2);
  return result;
};
Object.defineProperty(opResolveRules, "__esModule", { value: true });
opResolveRules.WEBGL_OP_RESOLVE_RULES = void 0;
const batch_normalization_1 = batchNormalization$1;
const binaryOps = __importStar$3(binaryOp);
const cast_1 = cast$1;
const concat_1 = concat$1;
const conv_1 = conv;
const depth_to_space_1 = depthToSpace$1;
const flatten_1 = flatten$1;
const gather_1 = gather$1;
const gemm_1 = gemm$1;
const image_scaler_1 = imageScaler$1;
const instance_normalization_1 = instanceNormalization$1;
const matmul_1 = matmul;
const pad_1 = pad;
const pool_1 = pool;
const pool_2 = pool;
const pool_3 = pool;
const pool_4 = pool;
const reduce_1 = reduce$1;
const reduce_2 = reduce$1;
const reshape_1 = reshape$1;
const resize_packed_1 = resizePacked;
const shape_1 = shape$1;
const slice_1 = slice$1;
const softmax_1 = softmax$1;
const split_1 = split$1;
const squeeze_1 = squeeze;
const sum_1 = sum$1;
const tile_1 = tile$1;
const transpose_1 = transpose$1;
const unaryOps = __importStar$3(unaryOp);
const unsqueeze_1 = unsqueeze;
const upsample_1 = upsample;
opResolveRules.WEBGL_OP_RESOLVE_RULES = [
  ["Abs", "", "6+", unaryOps.abs],
  ["Acos", "", "7+", unaryOps.acos],
  ["Add", "", "7+", binaryOps.add],
  ["And", "", "7+", binaryOps.and],
  ["Asin", "", "7+", unaryOps.asin],
  ["Atan", "", "7+", unaryOps.atan],
  ["AveragePool", "", "7+", pool_1.averagePool, pool_1.parseAveragePoolAttributes],
  ["BatchNormalization", "", "7+", batch_normalization_1.batchNormalization, batch_normalization_1.parseBatchNormalizationAttributes],
  ["Cast", "", "6+", cast_1.cast, cast_1.parseCastAttributes],
  ["Ceil", "", "6+", unaryOps.ceil],
  ["Clip", "", "6-10", unaryOps.clip, unaryOps.parseClipAttributes],
  ["Clip", "", "11+", unaryOps.clipV11],
  ["Concat", "", "4+", concat_1.concat, concat_1.parseConcatAttributes],
  ["Conv", "", "1+", conv_1.conv, conv_1.parseConvAttributes],
  ["Cos", "", "7+", unaryOps.cos],
  ["Div", "", "7+", binaryOps.div],
  ["Dropout", "", "7+", unaryOps.identity],
  ["DepthToSpace", "", "1+", depth_to_space_1.depthToSpace, depth_to_space_1.parseDepthToSpaceAttributes],
  ["Equal", "", "7+", binaryOps.equal],
  ["Elu", "", "6+", unaryOps.elu, unaryOps.parseEluAttributes],
  ["Exp", "", "6+", unaryOps.exp],
  ["Flatten", "", "1+", flatten_1.flatten, flatten_1.parseFlattenAttributes],
  ["Floor", "", "6+", unaryOps.floor],
  ["FusedConv", "com.microsoft", "1+", conv_1.conv, conv_1.parseConvAttributes],
  ["Gather", "", "1+", gather_1.gather, gather_1.parseGatherAttributes],
  ["Gemm", "", "7-10", gemm_1.gemm, gemm_1.parseGemmAttributesV7],
  ["Gemm", "", "11+", gemm_1.gemm, gemm_1.parseGemmAttributesV11],
  ["GlobalAveragePool", "", "1+", pool_2.globalAveragePool, pool_2.parseGlobalAveragePoolAttributes],
  ["GlobalMaxPool", "", "1+", pool_4.globalMaxPool],
  ["Greater", "", "7+", binaryOps.greater],
  ["Identity", "", "1+", unaryOps.identity],
  ["ImageScaler", "", "1+", image_scaler_1.imageScaler, image_scaler_1.parseImageScalerAttributes],
  ["InstanceNormalization", "", "6+", instance_normalization_1.instanceNormalization, instance_normalization_1.parseInstanceNormalizationAttributes],
  ["LeakyRelu", "", "6+", unaryOps.leakyRelu, unaryOps.parseLeakyReluAttributes],
  ["Less", "", "7+", binaryOps.less],
  ["Log", "", "6+", unaryOps.log],
  ["MatMul", "", "1+", matmul_1.matMul, matmul_1.parseMatMulAttributes],
  ["MaxPool", "", "1+", pool_3.maxPool, pool_3.parseMaxPoolAttributes],
  ["Mul", "", "7+", binaryOps.mul],
  ["Neg", "", "6+", unaryOps.neg],
  ["Not", "", "1+", unaryOps.not],
  ["Or", "", "7+", binaryOps.or],
  ["Pad", "", "2-10", pad_1.padV2, pad_1.parsePadAttributesV2],
  ["Pad", "", "11+", pad_1.padV11, pad_1.parsePadAttributesV11],
  ["Pow", "", "7+", binaryOps.pow],
  ["PRelu", "", "7+", binaryOps.pRelu],
  ["ReduceLogSum", "", "1+", reduce_1.reduceLogSum, reduce_2.parseReduceAttributes],
  ["ReduceMax", "", "1+", reduce_1.reduceMax, reduce_2.parseReduceAttributes],
  ["ReduceMean", "", "1+", reduce_1.reduceMean, reduce_2.parseReduceAttributes],
  ["ReduceMin", "", "1+", reduce_1.reduceMin, reduce_2.parseReduceAttributes],
  ["ReduceProd", "", "1+", reduce_1.reduceProd, reduce_2.parseReduceAttributes],
  ["ReduceSum", "", "1-12", reduce_1.reduceSum, reduce_2.parseReduceAttributes],
  ["ReduceSumSquare", "", "1+", reduce_1.reduceLogSumSquare, reduce_2.parseReduceAttributes],
  ["Relu", "", "6+", unaryOps.relu],
  ["Reshape", "", "5+", reshape_1.reshape],
  ["Resize", "", "10", resize_packed_1.resize, resize_packed_1.parseResizeAttributesV10],
  ["Resize", "", "11+", resize_packed_1.resize, resize_packed_1.parseResizeAttributesV11],
  ["Shape", "", "1+", shape_1.shape],
  ["Sigmoid", "", "6+", unaryOps.sigmoid],
  ["Sin", "", "7+", unaryOps.sin],
  ["Slice", "", "10+", slice_1.sliceV10],
  ["Slice", "", "1-9", slice_1.slice, slice_1.parseSliceAttributes],
  ["Softmax", "", "1-12", softmax_1.softmax, softmax_1.parseSoftmaxAttributes],
  ["Softmax", "", "13+", softmax_1.softmaxV13, softmax_1.parseSoftmaxAttributesV13],
  ["Split", "", "2-12", split_1.split, split_1.parseSplitAttributes],
  ["Sqrt", "", "6+", unaryOps.sqrt],
  ["Squeeze", "", "1-12", squeeze_1.squeeze, squeeze_1.parseSqueezeAttributes],
  ["Squeeze", "", "13+", squeeze_1.squeezeV13],
  ["Sub", "", "7+", binaryOps.sub],
  ["Sum", "", "6+", sum_1.sum],
  ["Tan", "", "7+", unaryOps.tan],
  ["Tanh", "", "6+", unaryOps.tanh],
  ["Tile", "", "6+", tile_1.tile],
  ["Transpose", "", "1+", transpose_1.transpose, transpose_1.parseTransposeAttributes],
  ["Upsample", "", "7-8", upsample_1.upsample, upsample_1.parseUpsampleAttributesV7],
  ["Upsample", "", "9", upsample_1.upsample, upsample_1.parseUpsampleAttributesV9],
  ["Unsqueeze", "", "1-12", unsqueeze_1.unsqueeze, unsqueeze_1.parseUnsqueezeAttributes],
  ["Unsqueeze", "", "13+", unsqueeze_1.unsqueezeV13],
  ["Xor", "", "7+", binaryOps.xor]
];
var programManager = {};
var glslPreprocessor = {};
var glslFunctionInliner = {};
Object.defineProperty(glslFunctionInliner, "__esModule", { value: true });
glslFunctionInliner.replaceInlines = void 0;
const INLINE_FUNC_DEF_REGEX = /@inline[\s\n\r]+(\w+)[\s\n\r]+([0-9a-zA-Z_]+)\s*\(([^)]*)\)\s*{(([^}]|[\n\r])*)}/gm;
const FUNC_CALL_REGEX = "(\\w+)?\\s+([_0-9a-zA-Z]+)\\s+=\\s+__FUNC__\\((.*)\\)\\s*;";
function replaceInlines(script) {
  const inlineDefs = {};
  let match;
  while ((match = INLINE_FUNC_DEF_REGEX.exec(script)) !== null) {
    const params = match[3].split(",").map((s) => {
      const tokens = s.trim().split(" ");
      if (tokens && tokens.length === 2) {
        return { type: tokens[0], name: tokens[1] };
      }
      return null;
    }).filter((v) => v !== null);
    inlineDefs[match[2]] = { params, body: match[4] };
  }
  for (const name2 in inlineDefs) {
    const regexString = FUNC_CALL_REGEX.replace("__FUNC__", name2);
    const regex = new RegExp(regexString, "gm");
    while ((match = regex.exec(script)) !== null) {
      const type = match[1];
      const variable = match[2];
      const params = match[3].split(",");
      const declLine = type ? `${type} ${variable};` : "";
      let newBody = inlineDefs[name2].body;
      let paramRedecLine = "";
      inlineDefs[name2].params.forEach((v, i) => {
        if (v) {
          paramRedecLine += `${v.type} ${v.name} = ${params[i]};
`;
        }
      });
      newBody = `${paramRedecLine}
 ${newBody}`;
      newBody = newBody.replace("return", `${variable} = `);
      const replacement = `
      ${declLine}
      {
        ${newBody}
      }
      `;
      script = script.replace(match[0], replacement);
    }
  }
  script = script.replace(INLINE_FUNC_DEF_REGEX, "");
  return script;
}
glslFunctionInliner.replaceInlines = replaceInlines;
var glslRegisteredLibs = {};
var glslCoordinateLib = {};
var textureLayoutStrategy = {};
Object.defineProperty(textureLayoutStrategy, "__esModule", { value: true });
textureLayoutStrategy.getBatchDim = textureLayoutStrategy.sizeToSquarishShape = textureLayoutStrategy.getRowsCols = textureLayoutStrategy.sizeFromShape = textureLayoutStrategy.isInt = textureLayoutStrategy.parseAxisParam = textureLayoutStrategy.squeezeShape = textureLayoutStrategy.PreferLogicalStrategy = textureLayoutStrategy.AlwaysKeepOriginalSizeStrategy = void 0;
const instrument_1$8 = instrument;
const util_1$5 = util;
class AlwaysKeepOriginalSizeStrategy {
  constructor(maxTextureSize) {
    this.maxTextureSize = maxTextureSize;
  }
  computeTextureWH(shape2, prefs) {
    if (shape2.length === 0) {
      return [1, 1];
    }
    const maxTextureSize = this.maxTextureSize;
    if (prefs && prefs.breakAxis !== void 0) {
      const wsize = prefs.breakAxis >= shape2.length ? 1 : shape2.slice(prefs.breakAxis).reduce((a, b) => a * b);
      const hsize = prefs.breakAxis <= 0 ? 1 : shape2.slice(0, prefs.breakAxis).reduce((a, b) => a * b);
      if (wsize > maxTextureSize || hsize > maxTextureSize) {
        instrument_1$8.Logger.verbose("TextureLayout", `Given width/height preferences were unattainable: shape:${shape2}, breakAxis:${prefs.breakAxis}`);
      } else {
        return [wsize, hsize];
      }
    }
    const totalSize = shape2.reduce((a, b) => a * b);
    let width = Math.floor(Math.sqrt(totalSize));
    for (; width < maxTextureSize && width < totalSize; width++) {
      if (totalSize % width === 0) {
        break;
      }
    }
    if (width >= maxTextureSize || totalSize % width !== 0) {
      throw new Error(`The given dimensions are outside this GPU's boundaries: ${shape2}`);
    }
    return [width, totalSize / width];
  }
}
textureLayoutStrategy.AlwaysKeepOriginalSizeStrategy = AlwaysKeepOriginalSizeStrategy;
class PreferLogicalStrategy {
  constructor(maxTextureSize) {
    this.maxTextureSize = maxTextureSize;
  }
  computeTextureWH(shape2, prefs) {
    const wh = this.computeTexture(shape2, prefs);
    if (prefs && prefs.isPacked) {
      wh[0] /= 2;
      wh[1] /= 2;
    }
    if (prefs && prefs.reverseWH) {
      return [wh[1], wh[0]];
    }
    return wh;
  }
  computeTexture(shape2, prefs) {
    const isPacked = prefs && prefs.isPacked;
    if (shape2.length === 0) {
      return isPacked ? [2, 2] : [1, 1];
    }
    let maxTextureSize = this.maxTextureSize;
    if (prefs && prefs.breakAxis !== void 0) {
      const wsize = prefs.breakAxis >= shape2.length ? 1 : shape2.slice(prefs.breakAxis).reduce((a, b) => a * b);
      const hsize = prefs.breakAxis <= 0 ? 1 : shape2.slice(0, prefs.breakAxis).reduce((a, b) => a * b);
      if (wsize > maxTextureSize || hsize > maxTextureSize) {
        instrument_1$8.Logger.verbose("TextureLayout", `Given width/height preferences were unattainable: shape:${shape2}, breakAxis:${prefs.breakAxis}`);
      } else {
        return [wsize, hsize];
      }
    }
    let logShape = shape2.slice(0);
    if (isPacked) {
      maxTextureSize = maxTextureSize * 2;
      logShape = logShape.map((d, i) => i >= logShape.length - 2 ? logShape[i] % 2 === 0 ? logShape[i] : logShape[i] + 1 : logShape[i]);
      if (logShape.length === 1) {
        logShape = [2, logShape[0]];
      }
    }
    if (logShape.length !== 2) {
      const squeezeResult = squeezeShape(logShape);
      logShape = squeezeResult.newShape;
    }
    const size = sizeFromShape(logShape);
    if (logShape.length <= 1 && size <= maxTextureSize) {
      return [1, size];
    } else if (logShape.length === 2 && logShape[0] <= maxTextureSize && logShape[1] <= maxTextureSize) {
      return logShape;
    } else if (logShape.length === 3 && logShape[0] * logShape[1] <= maxTextureSize && logShape[2] <= maxTextureSize) {
      return [logShape[0] * logShape[1], logShape[2]];
    } else if (logShape.length === 3 && logShape[0] <= maxTextureSize && logShape[1] * logShape[2] <= maxTextureSize) {
      return [logShape[0], logShape[1] * logShape[2]];
    } else if (logShape.length === 4 && logShape[0] * logShape[1] * logShape[2] <= maxTextureSize && logShape[3] <= maxTextureSize) {
      return [logShape[0] * logShape[1] * logShape[2], logShape[3]];
    } else if (logShape.length === 4 && logShape[0] <= maxTextureSize && logShape[1] * logShape[2] * logShape[3] <= maxTextureSize) {
      return [logShape[0], logShape[1] * logShape[2] * logShape[3]];
    } else {
      if (isPacked) {
        return sizeToSquarishShape(size / 4).map((d) => d * 2);
      }
      return sizeToSquarishShape(size);
    }
  }
}
textureLayoutStrategy.PreferLogicalStrategy = PreferLogicalStrategy;
function squeezeShape(shape2, axis) {
  const newShape = [];
  const keptDims = [];
  const isEmptyArray = axis != null && Array.isArray(axis) && axis.length === 0;
  const axes = axis == null || isEmptyArray ? null : parseAxisParam(axis, shape2).sort();
  let j = 0;
  for (let i = 0; i < shape2.length; ++i) {
    if (axes != null) {
      if (axes[j] === i && shape2[i] !== 1) {
        throw new Error(`Can't squeeze axis ${i} since its dim '${shape2[i]}' is not 1`);
      }
      if ((axes[j] == null || axes[j] > i) && shape2[i] === 1) {
        newShape.push(shape2[i]);
        keptDims.push(i);
      }
      if (axes[j] <= i) {
        j++;
      }
    }
    if (shape2[i] !== 1) {
      newShape.push(shape2[i]);
      keptDims.push(i);
    }
  }
  return { newShape, keptDims };
}
textureLayoutStrategy.squeezeShape = squeezeShape;
function parseAxisParam(axis, shape2) {
  const rank = shape2.length;
  axis = axis == null ? shape2.map((s, i) => i) : [].concat(axis);
  util_1$5.assert(axis.every((ax) => ax >= -rank && ax < rank), () => `All values in axis param must be in range [-${rank}, ${rank}) but got axis ${axis}`);
  util_1$5.assert(axis.every(isInt), () => `All values in axis param must be integers but got axis ${axis}`);
  return axis.map((a) => a < 0 ? rank + a : a);
}
textureLayoutStrategy.parseAxisParam = parseAxisParam;
function isInt(a) {
  return a % 1 === 0;
}
textureLayoutStrategy.isInt = isInt;
function sizeFromShape(shape2) {
  if (shape2.length === 0) {
    return 1;
  }
  let size = shape2[0];
  for (let i = 1; i < shape2.length; i++) {
    size *= shape2[i];
  }
  return size;
}
textureLayoutStrategy.sizeFromShape = sizeFromShape;
function getRowsCols(shape2) {
  if (shape2.length === 0) {
    throw Error("Cannot get rows and columns of an empty shape array.");
  }
  return [shape2.length > 1 ? shape2[shape2.length - 2] : 1, shape2[shape2.length - 1]];
}
textureLayoutStrategy.getRowsCols = getRowsCols;
function sizeToSquarishShape(size) {
  const width = Math.ceil(Math.sqrt(size));
  return [width, Math.ceil(size / width)];
}
textureLayoutStrategy.sizeToSquarishShape = sizeToSquarishShape;
function getBatchDim(shape2, dimsToSkip = 2) {
  return sizeFromShape(shape2.slice(0, shape2.length - dimsToSkip));
}
textureLayoutStrategy.getBatchDim = getBatchDim;
Object.defineProperty(glslCoordinateLib, "__esModule", { value: true });
glslCoordinateLib.CoordsGlslLib = void 0;
const util_1$4 = util;
const glsl_definitions_1$5 = glslDefinitions;
const glsl_source_1$3 = glslSource;
const texture_layout_strategy_1$1 = textureLayoutStrategy;
const utils_1$1 = utils;
class CoordsGlslLib extends glsl_definitions_1$5.GlslLib {
  constructor(context) {
    super(context);
  }
  getFunctions() {
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, this.offsetToCoords()), this.coordsToOffset()), this.toVec()), this.valueFrom()), this.getCommonUtilFuncs()), this.getInputsSamplingSnippets()), this.getOutputSamplingSnippet());
  }
  getCustomTypes() {
    return {};
  }
  offsetToCoords() {
    const funcName = "offsetToCoords";
    return {
      offsetToCoords: new glsl_definitions_1$5.GlslLibRoutine(`
      vec2 ${funcName}(int offset, int width, int height) {
        int t = offset / width;
        int s = offset - t*width;
        vec2 coords = (vec2(s,t) + vec2(0.5,0.5)) / vec2(width, height);
        return coords;
      }
      `)
    };
  }
  coordsToOffset() {
    const funcName = "coordsToOffset";
    return {
      coordsToOffset: new glsl_definitions_1$5.GlslLibRoutine(`
      int ${funcName}(vec2 coords, int width, int height) {
        float s = coords.s * float(width);
        float t = coords.t * float(height);
        int offset = int(t) * width + int(s);
        return offset;
      }
      `)
    };
  }
  getOutputSamplingSnippet() {
    const outputLayout = this.context.outputTextureLayout;
    if (outputLayout.isPacked) {
      return this.getPackedOutputSamplingSnippet(outputLayout);
    } else {
      return this.getUnpackedOutputSamplingSnippet(outputLayout);
    }
  }
  getPackedOutputSamplingSnippet(outputLayout) {
    const outShape = outputLayout.unpackedShape;
    const outTexShape = [outputLayout.width, outputLayout.height];
    const result = {};
    const funcName = "getOutputCoords";
    switch (outShape.length) {
      case 0:
        result[funcName] = this.getOutputScalarCoords();
        break;
      case 1:
        result[funcName] = this.getOutputPacked1DCoords(outShape, outTexShape);
        break;
      case 2:
        result[funcName] = this.getOutputPacked2DCoords(outShape, outTexShape);
        break;
      case 3:
        result[funcName] = this.getOutputPacked3DCoords(outShape, outTexShape);
        break;
      default:
        result[funcName] = this.getOutputPackedNDCoords(outShape, outTexShape);
    }
    const glsl = glsl_source_1$3.getGlsl(this.context.glContext.version);
    const floatTextureSetRGBASource = `
      void setOutput(vec4 val) {
        ${glsl.output} = val;
      }
    `;
    const floatTextureSetRGBAFuncName = "floatTextureSetRGBA";
    result[floatTextureSetRGBAFuncName] = new glsl_definitions_1$5.GlslLibRoutine(floatTextureSetRGBASource);
    return result;
  }
  getUnpackedOutputSamplingSnippet(outputLayout) {
    const outShape = outputLayout.unpackedShape;
    const outTexShape = [outputLayout.width, outputLayout.height];
    const result = {};
    const funcName = "getOutputCoords";
    switch (outShape.length) {
      case 0:
        result[funcName] = this.getOutputScalarCoords();
        break;
      case 1:
        result[funcName] = this.getOutputUnpacked1DCoords(outShape, outTexShape);
        break;
      case 2:
        result[funcName] = this.getOutputUnpacked2DCoords(outShape, outTexShape);
        break;
      case 3:
        result[funcName] = this.getOutputUnpacked3DCoords(outShape, outTexShape);
        break;
      case 4:
        result[funcName] = this.getOutputUnpacked4DCoords(outShape, outTexShape);
        break;
      case 5:
        result[funcName] = this.getOutputUnpacked5DCoords(outShape, outTexShape);
        break;
      case 6:
        result[funcName] = this.getOutputUnpacked6DCoords(outShape, outTexShape);
        break;
      default:
        throw new Error(`Unsupported output dimensionality: ${outShape.length}`);
    }
    const glsl = glsl_source_1$3.getGlsl(this.context.glContext.version);
    const floatTextureSetRSource = `
        void setOutput(float val) {
          ${glsl.output} = vec4(val, 0, 0, 0);
        }
    `;
    const floatTextureSetRFuncName = "floatTextureSetR";
    result[floatTextureSetRFuncName] = new glsl_definitions_1$5.GlslLibRoutine(floatTextureSetRSource);
    return result;
  }
  getOutputScalarCoords() {
    return new glsl_definitions_1$5.GlslLibRoutine(`
      int getOutputCoords() {
        return 0;
      }
    `);
  }
  getOutputPacked1DCoords(shape2, texShape) {
    const packedTexShape = texShape;
    let source = "";
    if (packedTexShape[0] === 1) {
      source = `
          int getOutputCoords() {
            return 2 * int(TexCoords.y * ${packedTexShape[1]}.0);
          }
        `;
      return new glsl_definitions_1$5.GlslLibRoutine(source);
    }
    if (packedTexShape[1] === 1) {
      source = `
          int getOutputCoords() {
            return 2 * int(TexCoords.x * ${packedTexShape[0]}.0);
          }
        `;
      return new glsl_definitions_1$5.GlslLibRoutine(source);
    }
    source = `
        int getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                 vec2(${packedTexShape[0]}, ${packedTexShape[1]}));
          return 2 * (resTexRC.y * ${packedTexShape[0]} + resTexRC.x);
        }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source);
  }
  getOutputPacked2DCoords(shape2, texShape) {
    let source = "";
    if (util_1$4.ArrayUtil.arraysEqual(shape2, texShape)) {
      source = `
        ivec2 getOutputCoords() {
          return 2 * ivec2(TexCoords.xy * vec2(${texShape[0]}, ${texShape[1]}));
        }
      `;
      return new glsl_definitions_1$5.GlslLibRoutine(source);
    }
    const packedTexShape = texShape;
    const texelsInLogicalRow = Math.ceil(shape2[1] / 2);
    source = `
        ivec2 getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                vec2(${packedTexShape[0]}, ${packedTexShape[1]}));

          int index = resTexRC.y * ${packedTexShape[0]} + resTexRC.x;

          // reverse r and c order for packed texture
          int r = imod(index, ${texelsInLogicalRow}) * 2;
          int c = 2 * (index / ${texelsInLogicalRow});

          return ivec2(r, c);
        }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source);
  }
  getOutputPacked3DCoords(shape2, texShape) {
    const packedTexShape = [texShape[0], texShape[1]];
    const texelsInLogicalRow = Math.ceil(shape2[2] / 2);
    const texelsInBatch = texelsInLogicalRow * Math.ceil(shape2[1] / 2);
    const source = `
        ivec3 getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                vec2(${packedTexShape[0]}, ${packedTexShape[1]}));
          int index = resTexRC.y * ${packedTexShape[0]} + resTexRC.x;

          int b = index / ${texelsInBatch};
          index -= b * ${texelsInBatch};

          // reverse r and c order for packed texture
          int r = imod(index, ${texelsInLogicalRow}) * 2;
          int c = 2 * (index / ${texelsInLogicalRow});

          return ivec3(b, r, c);
        }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source);
  }
  getOutputPackedNDCoords(shape2, texShape) {
    const packedTexShape = [texShape[0], texShape[1]];
    const texelsInLogicalRow = Math.ceil(shape2[shape2.length - 1] / 2);
    const texelsInBatch = texelsInLogicalRow * Math.ceil(shape2[shape2.length - 2] / 2);
    let texelsInBatchN = texelsInBatch;
    let batches = "";
    let coords = "b, r, c";
    for (let b = 2; b < shape2.length - 1; b++) {
      texelsInBatchN *= shape2[shape2.length - b - 1];
      batches = `
      int b${b} = index / ${texelsInBatchN};
      index -= b${b} * ${texelsInBatchN};
    ` + batches;
      coords = `b${b}, ` + coords;
    }
    const source = `
      ivec${shape2.length} getOutputCoords() {
        ivec2 resTexRC = ivec2(TexCoords.xy *
                              vec2(${packedTexShape[0]}, ${packedTexShape[1]}));
        int index = resTexRC.y * ${packedTexShape[0]} + resTexRC.x;

        ${batches}

        int b = index / ${texelsInBatch};
        index -= b * ${texelsInBatch};

        // reverse r and c order for packed texture
        int r = imod(index, ${texelsInLogicalRow}) * 2;
        int c = 2 * (index / ${texelsInLogicalRow});

        return ivec${shape2.length}(${coords});
      }
    `;
    return new glsl_definitions_1$5.GlslLibRoutine(source);
  }
  getOutputUnpacked1DCoords(shape2, texShape) {
    const source = `
        int getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                vec2(${texShape[0]}, ${texShape[1]}));
          return resTexRC.y * ${texShape[0]} + resTexRC.x;
        }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source);
  }
  getOutputUnpacked2DCoords(shape2, texShape) {
    const source = `
        ivec2 getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                vec2(${texShape[0]}, ${texShape[1]}));
          int index = resTexRC.y * ${texShape[0]} + resTexRC.x;
          int r = index / ${shape2[1]};
          int c = index - r * ${shape2[1]};
          return ivec2(r, c);
        }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source);
  }
  getOutputUnpacked3DCoords(shape2, texShape) {
    let source = "";
    const rank = shape2.length;
    let strides = null;
    if (rank < 2) {
      strides = [];
    }
    strides = new Array(rank - 1);
    strides[rank - 2] = shape2[rank - 1];
    for (let i = rank - 3; i >= 0; --i) {
      strides[i] = strides[i + 1] * shape2[i + 1];
    }
    const coordsToCompute = ["r", "c", "d"];
    const coordsFromIndexSnippet = strides.map((stride, i) => {
      const line1 = `int ${coordsToCompute[i]} = index / ${stride}`;
      const line2 = i === strides.length - 1 ? `int ${coordsToCompute[i + 1]} = index - ${coordsToCompute[i]} * ${stride}` : `index -= ${coordsToCompute[i]} * ${stride}`;
      return `${line1}; ${line2};`;
    }).join("");
    source = `
        ivec3 getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                vec2(${texShape[0]}, ${texShape[1]}));
          int index = resTexRC.y * ${texShape[0]} + resTexRC.x;
          ${coordsFromIndexSnippet}
          return ivec3(r, c, d);
        }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source);
  }
  getOutputUnpacked4DCoords(shape2, texShape) {
    let source = "";
    const rank = shape2.length;
    let strides = null;
    if (rank < 2) {
      strides = [];
    }
    strides = new Array(rank - 1);
    strides[rank - 2] = shape2[rank - 1];
    for (let i = rank - 3; i >= 0; --i) {
      strides[i] = strides[i + 1] * shape2[i + 1];
    }
    const coordsToCompute = ["r", "c", "d", "d2"];
    const coordsFromIndexSnippet = strides.map((stride, i) => {
      const line1 = `int ${coordsToCompute[i]} = index / ${stride}`;
      const line2 = i === strides.length - 1 ? `int ${coordsToCompute[i + 1]} = index - ${coordsToCompute[i]} * ${stride}` : `index -= ${coordsToCompute[i]} * ${stride}`;
      return `${line1}; ${line2};`;
    }).join("");
    source = `
      ivec4 getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                vec2(${texShape[0]}, ${texShape[1]}));
          int index = resTexRC.y * ${texShape[0]} + resTexRC.x;
          ${coordsFromIndexSnippet}
          return ivec4(r, c, d, d2);
        }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source);
  }
  getOutputUnpacked5DCoords(shape2, texShape) {
    let source = "";
    const rank = shape2.length;
    let strides = null;
    if (rank < 2) {
      strides = [];
    }
    strides = new Array(rank - 1);
    strides[rank - 2] = shape2[rank - 1];
    for (let i = rank - 3; i >= 0; --i) {
      strides[i] = strides[i + 1] * shape2[i + 1];
    }
    const coordsToCompute = ["r", "c", "d", "d2", "d3"];
    const coordsFromIndexSnippet = strides.map((stride, i) => {
      const line1 = `int ${coordsToCompute[i]} = index / ${stride}`;
      const line2 = i === strides.length - 1 ? `int ${coordsToCompute[i + 1]} = index - ${coordsToCompute[i]} * ${stride}` : `index -= ${coordsToCompute[i]} * ${stride}`;
      return `${line1}; ${line2};`;
    }).join("");
    source = `
      ivec5 getOutputCoords() {
          ivec2 resTexRC = ivec2(TexCoords.xy *
                                vec2(${texShape[0]}, ${texShape[1]}));
          int index = resTexRC.y * ${texShape[0]} + resTexRC.x;
          ${coordsFromIndexSnippet}
          return ivec5(r, c, d, d2, d3);
        }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source);
  }
  getOutputUnpacked6DCoords(shape2, texShape) {
    let source = "";
    const rank = shape2.length;
    let strides = null;
    if (rank < 2) {
      strides = [];
    }
    strides = new Array(rank - 1);
    strides[rank - 2] = shape2[rank - 1];
    for (let i = rank - 3; i >= 0; --i) {
      strides[i] = strides[i + 1] * shape2[i + 1];
    }
    const coordsToCompute = ["r", "c", "d", "d2", "d3", "d4"];
    const coordsFromIndexSnippet = strides.map((stride, i) => {
      const line1 = `int ${coordsToCompute[i]} = index / ${stride}`;
      const line2 = i === strides.length - 1 ? `int ${coordsToCompute[i + 1]} = index - ${coordsToCompute[i]} * ${stride}` : `index -= ${coordsToCompute[i]} * ${stride}`;
      return `${line1}; ${line2};`;
    }).join("");
    source = `
     ivec6 getOutputCoords() {
         ivec2 resTexRC = ivec2(TexCoords.xy *
                               vec2(${texShape[0]}, ${texShape[1]}));
         int index = resTexRC.y * ${texShape[0]} + resTexRC.x;
         ${coordsFromIndexSnippet}
         return ivec6(r, c, d, d2, d3, d4);
       }
     `;
    return new glsl_definitions_1$5.GlslLibRoutine(source);
  }
  getCommonUtilFuncs() {
    const result = {};
    let funcName = "uvFromFlat";
    result[funcName] = new glsl_definitions_1$5.GlslLibRoutine(`
    vec2 uvFromFlat(int texNumR, int texNumC, int index) {
      int texC = index / texNumR;
      int texR = index - texC * texNumR;
      // TODO: swap texR, texC order in following function so row is corresponding to u and column is corresponding to
      //       v.
      return (vec2(texR, texC) + halfCR) / vec2(texNumR, texNumC);
    }
    `);
    funcName = "packedUVfrom1D";
    result[funcName] = new glsl_definitions_1$5.GlslLibRoutine(`
      vec2 packedUVfrom1D(int texNumR, int texNumC, int index) {
        int texelIndex = index / 2;
        int texR = texelIndex / texNumC;
        int texC = texelIndex - texR * texNumC;
        return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
      }
      `);
    funcName = "packedUVfrom2D";
    result[funcName] = new glsl_definitions_1$5.GlslLibRoutine(`
      vec2 packedUVfrom2D(int texNumR, int texNumC, int texelsInLogicalRow, int row, int col) {
        int texelIndex = (row / 2) * texelsInLogicalRow + (col / 2);
        int texR = texelIndex / texNumC;
        int texC = texelIndex - texR * texNumC;
        return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
      }
      `);
    funcName = "packedUVfrom3D";
    result[funcName] = new glsl_definitions_1$5.GlslLibRoutine(`
      vec2 packedUVfrom3D(int texNumR, int texNumC,
          int texelsInBatch, int texelsInLogicalRow, int b,
          int row, int col) {
        int index = b * texelsInBatch + (row / 2) * texelsInLogicalRow + (col / 2);
        int texR = index / texNumC;
        int texC = index - texR * texNumC;
        return (vec2(texC, texR) + halfCR) / vec2(texNumC, texNumR);
      }
      `);
    funcName = "sampleTexture";
    const glsl = glsl_source_1$3.getGlsl(this.context.glContext.version);
    result[funcName] = new glsl_definitions_1$5.GlslLibRoutine(`
        float sampleTexture(sampler2D textureSampler, vec2 uv) {
            return ${glsl.texture2D}(textureSampler, uv).r;
        }`);
    return result;
  }
  getInputsSamplingSnippets() {
    const result = {};
    const outputLayout = this.context.outputTextureLayout;
    this.context.programInfo.inputNames.forEach((samplerName, i) => {
      const inputLayout = this.context.inputTextureLayouts[i];
      const funcName = utils_1$1.generateShaderFuncNameFromInputSamplerName(samplerName);
      if (inputLayout.isPacked) {
        result[funcName] = this.getPackedSamplerFromInput(funcName, samplerName, inputLayout);
      } else {
        result[funcName] = this.getUnpackedSamplerFromInput(funcName, samplerName, inputLayout);
      }
      const outCoordFuncName = utils_1$1.generateShaderFuncNameFromInputSamplerNameAtOutCoords(samplerName);
      if (inputLayout.unpackedShape.length <= outputLayout.unpackedShape.length) {
        if (inputLayout.isPacked) {
          result[outCoordFuncName] = this.getPackedSamplerAtOutputCoords(outCoordFuncName, inputLayout, outputLayout, samplerName);
        } else {
          result[outCoordFuncName] = this.getUnpackedSamplerAtOutputCoords(outCoordFuncName, inputLayout, outputLayout, samplerName);
        }
      }
    });
    return result;
  }
  getPackedSamplerAtOutputCoords(funcName, inputLayout, outputLayout, name2) {
    const inShape = inputLayout.unpackedShape;
    const outShape = outputLayout.unpackedShape;
    const texName = name2;
    const texFuncSnippet = utils_1$1.generateShaderFuncNameFromInputSamplerName(texName);
    const inRank = inShape.length;
    const outRank = outShape.length;
    const broadcastDims = util_1$4.BroadcastUtil.getBroadcastDims(inShape, outShape);
    const type = utils_1$1.getCoordsDataType(outRank);
    const rankDiff = outRank - inRank;
    let coordsSnippet;
    const fields = utils_1$1.getGlChannels();
    if (inRank === 0) {
      coordsSnippet = "";
    } else if (outRank < 2 && broadcastDims.length >= 1) {
      coordsSnippet = "coords = 0;";
    } else {
      coordsSnippet = broadcastDims.map((d) => `coords.${fields[d + rankDiff]} = 0;`).join("\n");
    }
    let unpackedCoordsSnippet = "";
    if (outRank < 2 && inRank > 0) {
      unpackedCoordsSnippet = "coords";
    } else {
      unpackedCoordsSnippet = inShape.map((s, i) => `coords.${fields[i + rankDiff]}`).join(", ");
    }
    let output = "return outputValue;";
    const inSize = util_1$4.ShapeUtil.size(inShape);
    const isInputScalar = inSize === 1;
    const outSize = util_1$4.ShapeUtil.size(outShape);
    const isOutputScalar = outSize === 1;
    if (inRank === 1 && !isInputScalar && !isOutputScalar) {
      output = `
        return vec4(outputValue.xy, outputValue.xy);
      `;
    } else if (isInputScalar && !isOutputScalar) {
      if (outRank === 1) {
        output = `
          return vec4(outputValue.x, outputValue.x, 0., 0.);
        `;
      } else {
        output = `
          return vec4(outputValue.x);
        `;
      }
    } else if (broadcastDims.length) {
      const rows = inRank - 2;
      const cols = inRank - 1;
      if (broadcastDims.indexOf(rows) > -1 && broadcastDims.indexOf(cols) > -1) {
        output = "return vec4(outputValue.x);";
      } else if (broadcastDims.indexOf(rows) > -1) {
        output = "return vec4(outputValue.x, outputValue.y, outputValue.x, outputValue.y);";
      } else if (broadcastDims.indexOf(cols) > -1) {
        output = "return vec4(outputValue.xx, outputValue.zz);";
      }
    }
    const swapLastDimsSnippet = `
        int lastDim = coords.${fields[outRank - 1]};
        coords.${fields[outRank - 1]} = coords.${fields[outRank - 2]};
        coords.${fields[outRank - 2]} = lastDim;
      `;
    const source = `
      vec4 ${funcName}() {
        ${type} coords = getOutputCoords();
        ${swapLastDimsSnippet}
        ${coordsSnippet}
        vec4 outputValue = ${texFuncSnippet}(${unpackedCoordsSnippet});
        ${output}
      }
    `;
    return new glsl_definitions_1$5.GlslLibRoutine(source, ["coordinates.getOutputCoords"]);
  }
  getUnpackedSamplerAtOutputCoords(funcName, inputLayout, outputLayout, name2) {
    const outTexShape = [outputLayout.width, outputLayout.height];
    const inTexShape = [inputLayout.width, inputLayout.height];
    const inRank = inputLayout.unpackedShape.length;
    const outRank = outputLayout.unpackedShape.length;
    const inShape = inputLayout.unpackedShape;
    const outShape = outputLayout.unpackedShape;
    const texFuncSnippet = utils_1$1.generateShaderFuncNameFromInputSamplerName(name2);
    if (inRank === outRank && util_1$4.ArrayUtil.arraysEqual(inTexShape, outTexShape)) {
      const source2 = `
          float ${funcName}() {
            return sampleTexture(${name2}, TexCoords);
          }
        `;
      return new glsl_definitions_1$5.GlslLibRoutine(source2, ["coordinates.sampleTexture"]);
    }
    const type = utils_1$1.getCoordsDataType(outRank);
    const broadcastDims = util_1$4.BroadcastUtil.getBroadcastDims(inShape, outShape);
    const rankDiff = outRank - inRank;
    let coordsSnippet;
    const fields = utils_1$1.getGlChannels();
    if (inRank === 0) {
      coordsSnippet = "";
    } else if (outRank < 2 && broadcastDims.length >= 1) {
      coordsSnippet = "coords = 0;";
    } else {
      coordsSnippet = broadcastDims.map((d) => `coords.${fields[d + rankDiff]} = 0;`).join("\n");
    }
    let unpackedCoordsSnippet = "";
    if (outRank < 2 && inRank > 0) {
      unpackedCoordsSnippet = "coords";
    } else {
      unpackedCoordsSnippet = inputLayout.unpackedShape.map((s, i) => `coords.${fields[i + rankDiff]}`).join(", ");
    }
    const source = `
        float ${funcName}() {
          ${type} coords = getOutputCoords();
          ${coordsSnippet}
          return ${texFuncSnippet}(${unpackedCoordsSnippet});
        }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source, ["coordinates.getOutputCoords"]);
  }
  getPackedSamplerFromInput(funcName, name2, inputLayout) {
    switch (inputLayout.unpackedShape.length) {
      case 0:
        return this.getPackedSamplerScalar(funcName, name2);
      case 1:
        return this.getPackedSampler1D(funcName, name2, inputLayout);
      case 2:
        return this.getPackedSampler2D(funcName, name2, inputLayout);
      case 3:
        return this.getPackedSampler3D(funcName, name2, inputLayout);
      default:
        return this.getPackedSamplerND(funcName, name2, inputLayout);
    }
  }
  getUnpackedSamplerFromInput(funcName, name2, inputLayout) {
    const shape2 = inputLayout.unpackedShape;
    switch (shape2.length) {
      case 0:
        return this.getUnpackedSamplerScalar(funcName, name2, inputLayout);
      case 1:
        return this.getUnpackedSampler1D(funcName, name2, inputLayout);
      case 2:
        return this.getUnpackedSampler2D(funcName, name2, inputLayout);
      case 3:
        return this.getUnpackedSampler3D(funcName, name2, inputLayout);
      case 4:
        return this.getUnpackedSampler4D(funcName, name2, inputLayout);
      case 5:
        return this.getUnpackedSampler5D(funcName, name2, inputLayout);
      case 6:
        return this.getUnpackedSampler6D(funcName, name2, inputLayout);
      default:
        throw new Error(`Unsupported dimension ${shape2.length}-D`);
    }
  }
  getPackedSamplerScalar(funcName, name2) {
    const glsl = glsl_source_1$3.getGlsl(this.context.glContext.version);
    const source = `
          vec4 ${funcName}() {
            return ${glsl.texture2D}(${name2}, halfCR);
          }
        `;
    return new glsl_definitions_1$5.GlslLibRoutine(source);
  }
  getPackedSampler1D(funcName, name2, inputLayout) {
    const texShape = [inputLayout.width, inputLayout.height];
    const packedTexShape = [texShape[1], texShape[0]];
    const glsl = glsl_source_1$3.getGlsl(this.context.glContext.version);
    const packedSampler = `vec4 ${funcName}(int index) {
      vec2 uv = packedUVfrom1D(
      ${packedTexShape[0]}, ${packedTexShape[1]}, index);
      return ${glsl.texture2D}(${name2}, uv);
    }`;
    const source = packedSampler;
    return new glsl_definitions_1$5.GlslLibRoutine(source, ["coordinates.packedUVfrom1D"]);
  }
  getPackedSampler2D(funcName, name2, inputLayout) {
    const shape2 = inputLayout.unpackedShape;
    const texShape = [inputLayout.width, inputLayout.height];
    const glsl = glsl_source_1$3.getGlsl(this.context.glContext.version);
    const texNumR = texShape[0];
    const texNumC = texShape[1];
    if (texShape != null && util_1$4.ArrayUtil.arraysEqual(shape2, texShape)) {
      const packedSampler2 = `vec4 ${funcName}(int row, int col) {
        vec2 uv = (vec2(col, row) + halfCR) / vec2(${texNumC}.0, ${texNumR}.0);
        return ${glsl.texture2D}(${name2}, uv);
      }`;
      return new glsl_definitions_1$5.GlslLibRoutine(packedSampler2);
    }
    const packedTexShape = texShape;
    const valuesPerRow = Math.ceil(shape2[1] / 2);
    const packedSampler = `vec4 ${funcName}(int row, int col) {
      vec2 uv = packedUVfrom2D(${packedTexShape[1]}, ${packedTexShape[0]}, ${valuesPerRow}, row, col);
      return ${glsl.texture2D}(${name2}, uv);
    }`;
    const source = packedSampler;
    return new glsl_definitions_1$5.GlslLibRoutine(source, ["coordinates.packedUVfrom2D"]);
  }
  getPackedSampler3D(funcName, name2, inputLayout) {
    const shape2 = inputLayout.unpackedShape;
    const texShape = [inputLayout.width, inputLayout.height];
    const packedTexShape = [texShape[0], texShape[1]];
    const glsl = glsl_source_1$3.getGlsl(this.context.glContext.version);
    if (shape2[0] === 1) {
      const squeezedShape = shape2.slice(1);
      const keptDims = [1, 2];
      const newInputShape = utils_1$1.squeezeInputShape(shape2, squeezedShape);
      const params = ["b", "row", "col"];
      const newInputLayout = JSON.parse(JSON.stringify(inputLayout));
      newInputLayout.unpackedShape = newInputShape;
      const samplerRoutine = this.getPackedSamplerFromInput(funcName, name2, newInputLayout);
      const packedSampler2 = `${samplerRoutine.routineBody}
      vec4 ${funcName}(int b, int row, int col) {
        return ${funcName}(${utils_1$1.getSqueezedParams(params, keptDims)});
      } `;
      const source2 = packedSampler2;
      return new glsl_definitions_1$5.GlslLibRoutine(source2, samplerRoutine.dependencies);
    }
    const texNumR = packedTexShape[0];
    const texNumC = packedTexShape[1];
    const valuesPerRow = Math.ceil(shape2[2] / 2);
    const texelsInBatch = valuesPerRow * Math.ceil(shape2[1] / 2);
    const packedSampler = `vec4 ${funcName}(int b, int row, int col) {
      vec2 uv = packedUVfrom3D(
        ${texNumC}, ${texNumR}, ${texelsInBatch}, ${valuesPerRow}, b, row, col);
      return ${glsl.texture2D}(${name2}, uv);}`;
    const source = packedSampler;
    return new glsl_definitions_1$5.GlslLibRoutine(source, ["coordinates.packedUVfrom3D"]);
  }
  getPackedSamplerND(funcName, name2, inputLayout) {
    const shape2 = inputLayout.unpackedShape;
    const rank = shape2.length;
    const texShape = [inputLayout.width, inputLayout.height];
    const glsl = glsl_source_1$3.getGlsl(this.context.glContext.version);
    const packedTexShape = [texShape[0], texShape[1]];
    const texNumR = packedTexShape[1];
    const texNumC = packedTexShape[0];
    const valuesPerRow = Math.ceil(shape2[rank - 1] / 2);
    let texelsInBatch = valuesPerRow * Math.ceil(shape2[rank - 2] / 2);
    let params = "int b, int row, int col";
    let index = `b * ${texelsInBatch} + (row / 2) * ${valuesPerRow} + (col / 2)`;
    for (let b = 2; b < rank - 1; b++) {
      params = `int b${b}, ` + params;
      texelsInBatch *= shape2[rank - b - 1];
      index = `b${b} * ${texelsInBatch} + ` + index;
    }
    const packedSampler = `vec4 ${funcName}(${params}) {
      int index = ${index};
      int texR = index / ${texNumC};
      int texC = index - texR * ${texNumC};
      vec2 uv = (vec2(texC, texR) + halfCR) / vec2(${texNumC}, ${texNumR});
      return ${glsl.texture2D}(${name2}, uv);
    }`;
    const source = packedSampler;
    return new glsl_definitions_1$5.GlslLibRoutine(source);
  }
  getUnpackedSamplerScalar(funcName, name2, inputLayout) {
    const [texNumR, texNumC] = [inputLayout.width, inputLayout.height];
    if (texNumR === 1 && texNumC === 1) {
      const source2 = `
          float ${funcName}() {
            return sampleTexture(${name2}, halfCR);
          }
        `;
      return new glsl_definitions_1$5.GlslLibRoutine(source2, ["coordinates.sampleTexture"]);
    }
    const source = `
        float ${funcName}() {
          int offset_${name2} = coordsToOffset(TexCoords, ${texNumR}, ${texNumC});
          vec2 uv = uvFromFlat(${texNumR}, ${texNumC}, offset_${name2});
          return sampleTexture(${name2}, uv);
        }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source, ["coordinates.uvFromFlat", "coordinates.sampleTexture", "coordinates.coordsToOffset"]);
  }
  getUnpackedSampler1D(funcName, name2, inputLayout) {
    const tNumR = inputLayout.width;
    const tNumC = inputLayout.height;
    if (tNumC === 1 && tNumR === 1) {
      const source2 = `
        float ${funcName}(int index) {
          return sampleTexture(${name2}, halfCR);
        }
      `;
      return new glsl_definitions_1$5.GlslLibRoutine(source2, ["coordinates.sampleTexture"]);
    }
    if (tNumC === 1) {
      const source2 = `
          float ${funcName}(int index) {
            vec2 uv = vec2((float(index) + 0.5) / ${tNumR}.0, 0.5);
            return sampleTexture(${name2}, uv);
          }
        `;
      return new glsl_definitions_1$5.GlslLibRoutine(source2, ["coordinates.sampleTexture"]);
    }
    if (tNumR === 1) {
      const source2 = `
          float ${funcName}(int index) {
            vec2 uv = vec2(0.5, (float(index) + 0.5) / ${tNumC}.0);
            return sampleTexture(${name2}, uv);
          }
        `;
      return new glsl_definitions_1$5.GlslLibRoutine(source2, ["coordinates.sampleTexture"]);
    }
    const source = `
        float ${funcName}(int index) {
          vec2 uv = uvFromFlat(${tNumR}, ${tNumC}, index);
          return sampleTexture(${name2}, uv);
        }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source, ["coordinates.uvFromFlat", "coordinates.sampleTexture"]);
  }
  getUnpackedSampler2D(funcName, name2, inputLayout) {
    const shape2 = inputLayout.unpackedShape;
    const texShape = [inputLayout.height, inputLayout.width];
    if (texShape != null && util_1$4.ArrayUtil.arraysEqual(shape2, texShape)) {
      const texNumR2 = texShape[1];
      const texNumC2 = texShape[0];
      const source2 = `
          float ${funcName}(int row, int col) {
            vec2 uv = (vec2(row, col) + halfCR) / vec2(${texNumR2}.0, ${texNumC2}.0);
            return sampleTexture(${name2}, uv);
          }
        `;
      return new glsl_definitions_1$5.GlslLibRoutine(source2, ["coordinates.sampleTexture"]);
    }
    const { newShape, keptDims } = texture_layout_strategy_1$1.squeezeShape(shape2);
    const squeezedShape = newShape;
    if (squeezedShape.length < shape2.length) {
      const newInputShape = utils_1$1.squeezeInputShape(shape2, squeezedShape);
      const newInputLayout = JSON.parse(JSON.stringify(inputLayout));
      newInputLayout.unpackedShape = newInputShape;
      const params = ["col", "row"];
      const source2 = `
          ${this.getUnpackedSamplerFromInput(funcName, name2, newInputLayout).routineBody}
          float ${funcName}(int row, int col) {
            return ${funcName}(${utils_1$1.getSqueezedParams(params, keptDims)});
          }
        `;
      return new glsl_definitions_1$5.GlslLibRoutine(source2, ["coordinates.sampleTexture"]);
    }
    const texNumR = texShape[1];
    const texNumC = texShape[0];
    if (texNumC === 1) {
      const source2 = `
          float ${funcName}(int row, int col) {
            int offset_${name2} = coordsToOffset(TexCoords, ${texNumR}, ${texNumC});
            float index = dot(vec3(row, col, offset_${name2}), vec3(${shape2[1]}, 1, 1));
            vec2 uv = vec2(0.5, (index + 0.5) / ${texNumR}.0);
            return sampleTexture(${name2}, uv);
          }
        `;
      return new glsl_definitions_1$5.GlslLibRoutine(source2, ["coordinates.sampleTexture", "coordinates.coordsToOffset"]);
    }
    if (texNumR === 1) {
      const source2 = `
          float ${funcName}(int row, int col) {
            int offset_${name2} = coordsToOffset(TexCoords, ${texNumR}, ${texNumC});
            float index = dot(vec3(row, col, offset_${name2}), vec3(${shape2[1]}, 1, 1));
            vec2 uv = vec2((index + 0.5) / ${texNumC}.0, 0.5);
            return sampleTexture(${name2}, uv);
          }
        `;
      return new glsl_definitions_1$5.GlslLibRoutine(source2, ["coordinates.sampleTexture", "coordinates.coordsToOffset"]);
    }
    const source = `
        float ${funcName}(int row, int col) {
          int index = col * ${shape2[1]} + row;
          vec2 uv = uvFromFlat(${texNumR}, ${texNumC}, index);
          return sampleTexture(${name2}, uv);
        }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source, ["coordinates.uvFromFlat", "coordinates.sampleTexture", "coordinates.coordsToOffset"]);
  }
  getUnpackedSampler3D(funcName, name2, inputLayout) {
    const shape2 = inputLayout.unpackedShape;
    const stride0 = shape2[1] * shape2[2];
    const stride1 = shape2[2];
    const { newShape, keptDims } = texture_layout_strategy_1$1.squeezeShape(shape2);
    const squeezedShape = newShape;
    if (squeezedShape.length < shape2.length) {
      const newInputShape = utils_1$1.squeezeInputShape(shape2, squeezedShape);
      const params = ["batch", "col", "row"];
      const newInputLayout = JSON.parse(JSON.stringify(inputLayout));
      newInputLayout.unpackedShape = newInputShape;
      const routine = this.getUnpackedSamplerFromInput(funcName, name2, newInputLayout);
      const revDims = keptDims.reverse();
      const source2 = `
          ${routine.routineBody}
          float ${funcName}(int batch, int row, int col) {
            return ${funcName}(${utils_1$1.getSqueezedParams(params, revDims)});
          }
        `;
      return new glsl_definitions_1$5.GlslLibRoutine(source2, routine.dependencies);
    }
    const texNumR = inputLayout.width;
    const texNumC = inputLayout.height;
    const source = `
          float ${funcName}(int depth, int row, int col) {
            // Explicitly use integer operations as dot() only works on floats.
            int index = depth * ${stride0} + col * ${stride1} + row;
            vec2 uv = uvFromFlat(${texNumR}, ${texNumC}, index);
            return sampleTexture(${name2}, uv);
          }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source, ["coordinates.uvFromFlat", "coordinates.sampleTexture", "coordinates.coordsToOffset"]);
  }
  getUnpackedSampler4D(funcName, name2, inputLayout) {
    const shape2 = inputLayout.unpackedShape;
    const stride2 = shape2[3];
    const stride1 = shape2[2] * stride2;
    const stride0 = shape2[1] * stride1;
    const texNumR = inputLayout.width;
    const texNumC = inputLayout.height;
    const source = `
        float ${funcName}(int row, int col, int depth, int depth2) {
          int index = row * ${stride0} + col * ${stride1} +
              depth2 * ${stride2} + depth;
          vec2 uv = uvFromFlat(${texNumR}, ${texNumC}, index);
          return sampleTexture(${name2}, uv);
        }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source, ["coordinates.uvFromFlat", "coordinates.sampleTexture"]);
  }
  getUnpackedSampler5D(funcName, name2, inputLayout) {
    const shape2 = inputLayout.unpackedShape;
    const stride3 = shape2[4];
    const stride2 = shape2[3] * stride3;
    const stride1 = shape2[2] * stride2;
    const stride0 = shape2[1] * stride1;
    const { newShape, keptDims } = texture_layout_strategy_1$1.squeezeShape(shape2);
    if (newShape.length < shape2.length) {
      const newInputShape = utils_1$1.squeezeInputShape(shape2, newShape);
      const params = ["row", "col", "depth", "depth2", "depth3"];
      const newInputLayout = JSON.parse(JSON.stringify(inputLayout));
      newInputLayout.unpackedShape = newInputShape;
      const source2 = `
          ${this.getUnpackedSamplerFromInput(funcName, name2, newInputLayout).routineBody}
          float ${funcName}(int row, int col, int depth, int depth2, int depth3) {
            return ${funcName}(${utils_1$1.getSqueezedParams(params, keptDims)});
          }
        `;
      return new glsl_definitions_1$5.GlslLibRoutine(source2, ["coordinates.sampleTexture", "coordinates.uvFromFlat"]);
    }
    const texNumR = inputLayout.width;
    const texNumC = inputLayout.height;
    const source = `
        float ${funcName}(int row, int col, int depth, int depth2, int depth3) {
          int index = row * ${stride0} + col * ${stride1} + depth * ${stride2} +
          depth3 * ${stride3} + depth2;
          vec2 uv = uvFromFlat(${texNumR}, ${texNumC}, index);
          return sampleTexture(${name2}, uv);
        }
      `;
    return new glsl_definitions_1$5.GlslLibRoutine(source, ["coordinates.sampleTexture", "coordinates.uvFromFlat"]);
  }
  getUnpackedSampler6D(funcName, name2, inputLayout) {
    const shape2 = inputLayout.unpackedShape;
    const stride4 = shape2[5];
    const stride3 = shape2[4] * stride4;
    const stride2 = shape2[3] * stride3;
    const stride1 = shape2[2] * stride2;
    const stride0 = shape2[1] * stride1;
    const { newShape, keptDims } = texture_layout_strategy_1$1.squeezeShape(shape2);
    if (newShape.length < shape2.length) {
      const newInputShape = utils_1$1.squeezeInputShape(shape2, newShape);
      const params = ["row", "col", "depth", "depth2", "depth3", "depth4"];
      const newInputLayout = JSON.parse(JSON.stringify(inputLayout));
      newInputLayout.unpackedShape = newInputShape;
      const source2 = `
            ${this.getUnpackedSamplerFromInput(funcName, name2, newInputLayout).routineBody}
            float ${funcName}(int row, int col, int depth,
              int depth2, int depth3, int depth4) {
              return ${funcName}(${utils_1$1.getSqueezedParams(params, keptDims)});
            }
          `;
      return new glsl_definitions_1$5.GlslLibRoutine(source2, ["coordinates.sampleTexture", "coordinates.uvFromFlat"]);
    }
    const texNumR = inputLayout.width;
    const texNumC = inputLayout.height;
    const source = `
          float ${funcName}(int row, int col, int depth,
            int depth2, int depth3, int depth4) {
            int index = row * ${stride0} + col * ${stride1} + depth * ${stride2} +
            depth2 * ${stride3} + depth3 * ${stride4} + depth4;
            vec2 uv = uvFromFlat(${texNumR}, ${texNumC}, index);
            return sampleTexture(${name2}, uv);
          }
        `;
    return new glsl_definitions_1$5.GlslLibRoutine(source, ["coordinates.uvFromFlat", "coordinates.sampleTexture", "coordinates.coordsToOffset"]);
  }
  toVec() {
    const output = this.context.outputTextureLayout;
    const rank = output.shape.length;
    const strides = output.strides;
    const xScale = output.width;
    const yScale = output.height;
    const stridesBlock = [];
    for (let i = 0; i < rank - 1; ++i) {
      stridesBlock.push(`
        c[${i}] = offset / ${strides[i]};`);
      stridesBlock.push(`
        offset -= c[${i}] * ${strides[i]};`);
    }
    stridesBlock.push(`
        c[${rank - 1}] = offset;`);
    const body = `
      void toVec(vec2 texCoords, out int c[${rank}]) {
        int offset = coordsToOffset(texCoords, ${xScale}, ${yScale});
        ${stridesBlock.join("")}
      }
      void toVec(int offset, out int c[${rank}]) {
        ${stridesBlock.join("")}
      }
    `;
    return { toVec: new glsl_definitions_1$5.GlslLibRoutine(body, ["coordinates.coordsToOffset"]) };
  }
  valueFrom() {
    const result = {};
    this.context.programInfo.inputNames.forEach((name2, i) => {
      const layout = this.context.inputTextureLayouts[i];
      const shape2 = layout.unpackedShape.length > 0 ? layout.unpackedShape : layout.shape;
      const rank = shape2.length;
      let funcName = `_${name2}`;
      result[funcName] = new glsl_definitions_1$5.GlslLibRoutine(this.getValueFromSingle(name2, rank, layout.width, layout.height, false), [`shapeUtils.indicesToOffset${funcName}`, "coordinates.offsetToCoords", "fragcolor.getColorAsFloat"]);
      funcName = funcName + "_T";
      result[funcName] = new glsl_definitions_1$5.GlslLibRoutine(this.getValueFromSingle(name2, rank, layout.width, layout.height, true), [`shapeUtils.indicesToOffset${funcName}`, "coordinates.offsetToCoords", "fragcolor.getColorAsFloat"]);
    });
    return result;
  }
  getValueFromSingle(varName, rank, width, height, transpose2) {
    let name2 = `_${varName}`;
    if (transpose2) {
      name2 = name2 + "_T";
    }
    const glsl = glsl_source_1$3.getGlsl(this.context.glContext.version);
    return `
        float ${name2}(int m[${rank}]) {
          int offset = indicesToOffset${name2}(m);
          vec2 coords = offsetToCoords(offset, ${width}, ${height});
          float value = getColorAsFloat(${glsl.texture2D}(${varName}, coords));
          return value;
        }
        `;
  }
  getPackedValueFrom(varName, rank, width, height, transpose2) {
    let name2 = `_${varName}_Pack`;
    if (transpose2) {
      name2 = name2 + "_T";
    }
    const glsl = glsl_source_1$3.getGlsl(this.context.glContext.version);
    return `
        vec4 ${name2}(int m[${rank}]) {
          int offset = indicesToOffset_${varName}(m);
          vec2 coords = offsetToCoords(offset, ${width}, ${height});
          return ${glsl.texture2D}(${varName}, coords);
        }
        `;
  }
}
glslCoordinateLib.CoordsGlslLib = CoordsGlslLib;
var glslEncodingLib = {};
Object.defineProperty(glslEncodingLib, "__esModule", { value: true });
glslEncodingLib.EncodingGlslLib = void 0;
const glsl_definitions_1$4 = glslDefinitions;
class EncodingGlslLib extends glsl_definitions_1$4.GlslLib {
  constructor(context) {
    super(context);
  }
  getFunctions() {
    return Object.assign(Object.assign({}, this.encodeFloat32()), this.decodeFloat32());
  }
  getCustomTypes() {
    return {};
  }
  encodeFloat32() {
    return {
      encode: new glsl_definitions_1$4.GlslLibRoutine(`highp vec4 encode(highp float f) {
        return vec4(f, 0.0, 0.0, 0.0);
      }
        `)
    };
  }
  decodeFloat32() {
    return {
      decode: new glsl_definitions_1$4.GlslLibRoutine(`highp float decode(highp vec4 rgba) {
        return rgba.r;
      }
        `)
    };
  }
  encodeUint8() {
    const endianness = EncodingGlslLib.isLittleEndian() ? "rgba.rgba=rgba.abgr;" : "";
    return {
      encode: new glsl_definitions_1$4.GlslLibRoutine(`
      highp vec4 encode(highp float f) {
        highp float F = abs(f);
        highp float Sign = step(0.0,-f);
        highp float Exponent = floor(log2(F));
        highp float Mantissa = (exp2(- Exponent) * F);
        Exponent = floor(log2(F) + 127.0) + floor(log2(Mantissa));
        highp vec4 rgba;
        rgba[0] = 128.0 * Sign  + floor(Exponent*exp2(-1.0));
        rgba[1] = 128.0 * mod(Exponent,2.0) + mod(floor(Mantissa*128.0),128.0);
        rgba[2] = floor(mod(floor(Mantissa*exp2(23.0 -8.0)),exp2(8.0)));
        rgba[3] = floor(exp2(23.0)*mod(Mantissa,exp2(-15.0)));
        ${endianness}
        rgba = rgba / 255.0; // values need to be normalized to [0,1]
        return rgba;
    }
        `)
    };
  }
  decodeUint8() {
    const endianness = EncodingGlslLib.isLittleEndian() ? "rgba.rgba=rgba.abgr;" : "";
    return {
      decode: new glsl_definitions_1$4.GlslLibRoutine(`
        highp float decode(highp vec4 rgba) {
          rgba = rgba * 255.0; // values need to be de-normalized from [0,1] to [0,255]
          ${endianness}
          highp float Sign = 1.0 - step(128.0,rgba[0])*2.0;
          highp float Exponent = 2.0 * mod(rgba[0],128.0) + step(128.0,rgba[1]) - 127.0;
          highp float Mantissa = mod(rgba[1],128.0)*65536.0 + rgba[2]*256.0 +rgba[3] + float(0x800000);
          highp float Result =  Sign * exp2(Exponent) * (Mantissa * exp2(-23.0 ));
          return Result;
      }
        `)
    };
  }
  static isLittleEndian() {
    const b = new ArrayBuffer(4);
    const a = new Uint32Array(b);
    const c = new Uint8Array(b);
    a[0] = 3735928559;
    if (c[0] === 239) {
      return true;
    }
    if (c[0] === 222) {
      return false;
    }
    throw new Error("unknown endianness");
  }
}
glslEncodingLib.EncodingGlslLib = EncodingGlslLib;
var glslFragcolorLib = {};
Object.defineProperty(glslFragcolorLib, "__esModule", { value: true });
glslFragcolorLib.FragColorGlslLib = void 0;
const glsl_definitions_1$3 = glslDefinitions;
const glsl_source_1$2 = glslSource;
class FragColorGlslLib extends glsl_definitions_1$3.GlslLib {
  constructor(context) {
    super(context);
  }
  getFunctions() {
    return Object.assign(Object.assign({}, this.setFragColor()), this.getColorAsFloat());
  }
  getCustomTypes() {
    return {};
  }
  setFragColor() {
    const glsl = glsl_source_1$2.getGlsl(this.context.glContext.version);
    return {
      setFragColor: new glsl_definitions_1$3.GlslLibRoutine(`
        void setFragColor(float value) {
            ${glsl.output} = encode(value);
        }
        `, ["encoding.encode"])
    };
  }
  getColorAsFloat() {
    return {
      getColorAsFloat: new glsl_definitions_1$3.GlslLibRoutine(`
        float getColorAsFloat(vec4 color) {
            return decode(color);
        }
        `, ["encoding.decode"])
    };
  }
}
glslFragcolorLib.FragColorGlslLib = FragColorGlslLib;
var glslShapeUtilsLib = {};
Object.defineProperty(glslShapeUtilsLib, "__esModule", { value: true });
glslShapeUtilsLib.ShapeUtilsGlslLib = void 0;
const glsl_definitions_1$2 = glslDefinitions;
class ShapeUtilsGlslLib extends glsl_definitions_1$2.GlslLib {
  constructor(context) {
    super(context);
  }
  getFunctions() {
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, this.bcastIndex()), this.bcastMatmulIndex()), this.offsetToIndices()), this.indicesToOffset()), this.incrementIndices());
  }
  getCustomTypes() {
    return {};
  }
  bcastIndex() {
    const outputRank = this.context.outputTextureLayout.shape.length;
    const result = {};
    this.context.programInfo.inputNames.forEach((name2, i) => {
      const shape2 = this.context.inputTextureLayouts[i].unpackedShape;
      if (shape2.length <= outputRank) {
        const rank = shape2.length;
        const dimOffset = outputRank - rank;
        const funcName = `bcastIndices_${name2}`;
        let block = "";
        for (let i2 = 0; i2 < rank; ++i2) {
          block += `
          realIndices[${i2}] = int( mod(float(bcastedIndices[${dimOffset + i2}]), ${shape2[i2]}.0) );
          `;
        }
        const body = `
        void ${funcName} (int bcastedIndices[${outputRank}], out int realIndices[${rank}]) {
          ${block}
        }
        `;
        result[funcName] = new glsl_definitions_1$2.GlslLibRoutine(body);
      }
    });
    return result;
  }
  bcastMatmulIndex() {
    const outputRank = this.context.outputTextureLayout.shape.length;
    const result = {};
    this.context.programInfo.inputNames.forEach((name2, i) => {
      const shape2 = this.context.inputTextureLayouts[i].shape;
      if (!(shape2.length < 2 || shape2.length > outputRank)) {
        const rank = shape2.length;
        const dimOffset = outputRank - rank;
        const funcName = `bcastMatmulIndices_${name2}`;
        let block = "";
        for (let i2 = 0; i2 < rank - 2; ++i2) {
          block += `
          realIndices[${i2}] = int( mod(float(bcastedIndices[${dimOffset + i2}]), ${shape2[i2]}.0) );
          `;
        }
        const body = `
        void ${funcName}(int bcastedIndices[${outputRank}], out int realIndices[${rank}]) {
          ${block}
          realIndices[${rank - 1}] = bcastedIndices[${outputRank - 1}];
          realIndices[${rank - 2}] = bcastedIndices[${outputRank - 2}];
        }
        `;
        result[funcName] = new glsl_definitions_1$2.GlslLibRoutine(body);
      }
    });
    return result;
  }
  indicesToOffset() {
    const result = {};
    this.context.programInfo.inputNames.forEach((name2, i) => {
      const shape2 = this.context.inputTextureLayouts[i].shape;
      const strides = this.context.inputTextureLayouts[i].strides;
      const rank = shape2.length;
      let funcName = `indicesToOffset_${name2}`;
      result[funcName] = new glsl_definitions_1$2.GlslLibRoutine(ShapeUtilsGlslLib.indexToOffsetSingle(funcName, rank, strides));
      funcName = `indicesToOffset_${name2}_T`;
      result[funcName] = new glsl_definitions_1$2.GlslLibRoutine(ShapeUtilsGlslLib.indexToOffsetSingle(funcName, rank, strides.slice().reverse()));
    });
    return result;
  }
  static indexToOffsetSingle(name2, rank, strides) {
    let block = "";
    for (let i = rank - 1; i >= 0; --i) {
      block += `
        offset += indices[${i}] * ${strides[i]};
        `;
    }
    return `
      int ${name2}(int indices[${rank}]) {
        int offset = 0;
        ${block}
        return offset;
      }
      `;
  }
  offsetToIndices() {
    const result = {};
    this.context.programInfo.inputNames.forEach((name2, i) => {
      const shape2 = this.context.inputTextureLayouts[i].shape;
      const strides = this.context.inputTextureLayouts[i].strides;
      const rank = shape2.length;
      let funcName = `offsetToIndices_${name2}`;
      result[funcName] = new glsl_definitions_1$2.GlslLibRoutine(ShapeUtilsGlslLib.offsetToIndicesSingle(funcName, rank, strides));
      funcName = `offsetToIndices_${name2}_T`;
      result[funcName] = new glsl_definitions_1$2.GlslLibRoutine(ShapeUtilsGlslLib.offsetToIndicesSingle(funcName, rank, strides.slice().reverse()));
    });
    return result;
  }
  static offsetToIndicesSingle(name2, rank, strides) {
    const stridesBlock = [];
    for (let i = 0; i < rank - 1; ++i) {
      stridesBlock.push(`
      indices[${i}] = offset / ${strides[i]};`);
      stridesBlock.push(`
        offset -= indices[${i}] * ${strides[i]};`);
    }
    stridesBlock.push(`
      indices[${rank - 1}] = offset;`);
    return `
      void ${name2}(int offset, out int indices[${rank}]) {
        ${stridesBlock.join("")}
      }
      `;
  }
  incrementIndices() {
    const result = {};
    this.context.programInfo.inputNames.forEach((name2, i) => {
      const shape2 = this.context.inputTextureLayouts[i].shape;
      const rank = shape2.length;
      const funcName = `incrementIndices_${name2}`;
      let shapeInit = "";
      for (let i2 = 0; i2 < rank; ++i2) {
        shapeInit += `
        shape[${i2}] = ${shape2[i2]};`;
      }
      const body = `
        void ${funcName}(int axis, out int indices[${rank}]) {
          int shape[${rank}];
          ${shapeInit};
          for(int i = ${rank} -1 ; i >= 0; --i) {
            if(i > axis) continue;
            indices[i] += 1;
            if(indices[i] < shape[i]) {
              break;
            }
            indices[i] = 0;
          }
        }
        `;
      result[funcName] = new glsl_definitions_1$2.GlslLibRoutine(body);
    });
    return result;
  }
}
glslShapeUtilsLib.ShapeUtilsGlslLib = ShapeUtilsGlslLib;
var glslVecLib = {};
Object.defineProperty(glslVecLib, "__esModule", { value: true });
glslVecLib.VecGlslLib = void 0;
const glsl_definitions_1$1 = glslDefinitions;
class VecGlslLib extends glsl_definitions_1$1.GlslLib {
  constructor(context) {
    super(context);
  }
  getCustomTypes() {
    return {};
  }
  getFunctions() {
    return Object.assign(Object.assign(Object.assign(Object.assign({}, this.binaryVecFunctions()), this.copyVec()), this.setVecItem()), this.getVecItem());
  }
  binaryVecFunctions() {
    const outputLayout = this.context.outputTextureLayout;
    const rank = outputLayout.shape.length;
    const nameOp = { add: "+=", sub: "-=", mul: "*=", div: "/=" };
    const result = {};
    for (const name2 in nameOp) {
      const fname = `${name2}Vec`;
      let assignmentBlock = "";
      for (let i = 0; i < rank; ++i) {
        assignmentBlock += `
          dest[${i}] ${nameOp[name2]} src[${i}];
          `;
      }
      const body = `
        void ${fname}(int src[${rank}], out int dest[${rank}]) {
          ${assignmentBlock}
        }
        `;
      result[fname] = new glsl_definitions_1$1.GlslLibRoutine(body);
    }
    return result;
  }
  copyVec() {
    const outputLayout = this.context.outputTextureLayout;
    const rank = outputLayout.shape.length;
    let assignmentBlock = "";
    for (let i = 0; i < rank; ++i) {
      assignmentBlock += `
        dest[${i}] = src[${i}];
        `;
    }
    const body = `
      void copyVec(int src[${rank}], out int dest[${rank}]) {
        ${assignmentBlock}
      }
      `;
    return { copyVec: new glsl_definitions_1$1.GlslLibRoutine(body) };
  }
  setVecItem() {
    const outputLayout = this.context.outputTextureLayout;
    const rank = outputLayout.shape.length;
    let block = `
        if(index < 0)
            index =${rank} + index;
        if (index == 0)
            m[0] = value;
        `;
    for (let i = 1; i < rank - 1; ++i) {
      block += `
        else if (index == ${i})
            m[${i}] = value;
            `;
    }
    block += `
        else
            m[${rank - 1}] = value;
        `;
    const body = `
      void setVecItem(out int m[${rank}], int index, int value) {
        ${block}
      }
        `;
    return { setVecItem: new glsl_definitions_1$1.GlslLibRoutine(body) };
  }
  getVecItem() {
    const outputLayout = this.context.outputTextureLayout;
    const rank = outputLayout.shape.length;
    let block = `
        if(index < 0)
            index = ${rank} + index;
        if (index == 0)
            return m[0];
      `;
    for (let i = 1; i < rank - 1; ++i) {
      block += `
        else if (index == ${i})
            return m[${i}];
      `;
    }
    block += `
        else
            return m[${rank - 1}];
        `;
    const body = `
      int getVecItem(int m[${rank}], int index) {
        ${block}
      }
    `;
    return { getVecItem: new glsl_definitions_1$1.GlslLibRoutine(body) };
  }
}
glslVecLib.VecGlslLib = VecGlslLib;
Object.defineProperty(glslRegisteredLibs, "__esModule", { value: true });
glslRegisteredLibs.glslRegistry = void 0;
const glsl_coordinate_lib_1 = glslCoordinateLib;
const glsl_encoding_lib_1 = glslEncodingLib;
const glsl_fragcolor_lib_1 = glslFragcolorLib;
const glsl_shape_utils_lib_1 = glslShapeUtilsLib;
const glsl_vec_lib_1 = glslVecLib;
glslRegisteredLibs.glslRegistry = {
  "encoding": glsl_encoding_lib_1.EncodingGlslLib,
  "fragcolor": glsl_fragcolor_lib_1.FragColorGlslLib,
  "vec": glsl_vec_lib_1.VecGlslLib,
  "shapeUtils": glsl_shape_utils_lib_1.ShapeUtilsGlslLib,
  "coordinates": glsl_coordinate_lib_1.CoordsGlslLib
};
Object.defineProperty(glslPreprocessor, "__esModule", { value: true });
glslPreprocessor.GlslPreprocessor = void 0;
const glsl_definitions_1 = glslDefinitions;
const glsl_function_inliner_1 = glslFunctionInliner;
const glsl_registered_libs_1 = glslRegisteredLibs;
const glsl_source_1$1 = glslSource;
class GlslPreprocessor {
  constructor(glContext, programInfo, inputTextureLayouts, outputTextureLayout) {
    this.libs = {};
    this.glslLibRoutineDependencyGraph = {};
    this.context = new glsl_definitions_1.GlslContext(glContext, programInfo, inputTextureLayouts, outputTextureLayout);
    Object.keys(glsl_registered_libs_1.glslRegistry).forEach((name2) => {
      const lib2 = new glsl_registered_libs_1.glslRegistry[name2](this.context);
      this.libs[name2] = lib2;
    });
    const map = this.glslLibRoutineDependencyGraph;
    for (const libName in this.libs) {
      const lib2 = this.libs[libName];
      const routinesInLib = lib2.getFunctions();
      for (const routine in routinesInLib) {
        const key = libName + "." + routine;
        let currentNode;
        if (map[key]) {
          currentNode = map[key];
          currentNode.routineBody = routinesInLib[routine].routineBody;
        } else {
          currentNode = new glsl_definitions_1.GlslLibRoutineNode(key, routinesInLib[routine].routineBody);
          map[key] = currentNode;
        }
        const dependencies = routinesInLib[routine].dependencies;
        if (dependencies) {
          for (let i = 0; i < dependencies.length; ++i) {
            if (!map[dependencies[i]]) {
              const node = new glsl_definitions_1.GlslLibRoutineNode(dependencies[i]);
              map[dependencies[i]] = node;
              currentNode.addDependency(node);
            } else {
              currentNode.addDependency(map[dependencies[i]]);
            }
          }
        }
      }
    }
  }
  preprocess() {
    const programInfo = this.context.programInfo;
    let source = programInfo.shaderSource;
    if (!this.context.programInfo.hasMain) {
      source = `${source}
      ${glsl_source_1$1.getDefaultFragShaderMain(this.context.glContext.version, this.context.outputTextureLayout.shape.length)}`;
    }
    source = glsl_function_inliner_1.replaceInlines(source);
    return `${glsl_source_1$1.getFragShaderPreamble(this.context.glContext.version)}
    ${this.getUniforms(programInfo.inputNames, programInfo.variables)}
    ${this.getImports(source)}
    ${source}`;
  }
  getImports(script) {
    const routinesIncluded = this.selectGlslLibRoutinesToBeIncluded(script);
    if (routinesIncluded.length === 0) {
      return "";
    }
    let routines = "";
    for (let i = 0; i < routinesIncluded.length; ++i) {
      if (routinesIncluded[i].routineBody) {
        routines += routinesIncluded[i].routineBody + "\n";
      } else {
        throw new Error(`Missing body for the Glsl Library routine: ${routinesIncluded[i].name}`);
      }
    }
    return routines;
  }
  selectGlslLibRoutinesToBeIncluded(script) {
    const nodes = [];
    Object.keys(this.glslLibRoutineDependencyGraph).forEach((classAndRoutine) => {
      const routine = classAndRoutine.split(".")[1];
      if (script.indexOf(routine) !== -1) {
        nodes.push(this.glslLibRoutineDependencyGraph[classAndRoutine]);
      }
    });
    return glsl_definitions_1.TopologicalSortGlslRoutines.returnOrderedNodes(nodes);
  }
  getUniforms(samplers, variables) {
    const uniformLines = [];
    if (samplers) {
      for (const sampler of samplers) {
        uniformLines.push(`uniform sampler2D ${sampler};`);
      }
    }
    if (variables) {
      for (const variable of variables) {
        uniformLines.push(`uniform ${variable.type} ${variable.name}${variable.arrayLength ? `[${variable.arrayLength}]` : ""};`);
      }
    }
    return uniformLines.join("\n");
  }
}
glslPreprocessor.GlslPreprocessor = GlslPreprocessor;
Object.defineProperty(programManager, "__esModule", { value: true });
programManager.ProgramManager = void 0;
const onnxruntime_common_1$5 = require$$0$1;
const instrument_1$7 = instrument;
const glsl_preprocessor_1 = glslPreprocessor;
const glsl_source_1 = glslSource;
class ProgramManager {
  constructor(profiler, glContext, textureLayoutStrategy2) {
    this.profiler = profiler;
    this.glContext = glContext;
    this.textureLayoutStrategy = textureLayoutStrategy2;
    this.repo = /* @__PURE__ */ new Map();
    this.attributesBound = false;
  }
  getArtifact(key) {
    return this.repo.get(key);
  }
  setArtifact(key, artifact) {
    this.repo.set(key, artifact);
  }
  run(buildArtifact, inputs, output) {
    var _a2;
    this.profiler.event("op", `ProgramManager.run ${(_a2 = buildArtifact.programInfo.name) !== null && _a2 !== void 0 ? _a2 : "unknown kernel"}`, () => {
      var _a3;
      const gl = this.glContext.gl;
      const program = buildArtifact.program;
      gl.useProgram(program);
      try {
        this.bindOutput(output);
        if (!this.attributesBound) {
          this.bindAttributes(buildArtifact.attribLocations);
        }
        this.bindUniforms(buildArtifact.uniformLocations, (_a3 = buildArtifact.programInfo.variables) !== null && _a3 !== void 0 ? _a3 : [], inputs);
      } catch (err2) {
        instrument_1$7.Logger.error("ProgramManager", buildArtifact.programInfo.shaderSource);
        throw err2;
      }
      this.profiler.event("backend", "GlContext.draw()", () => {
        this.glContext.draw();
      });
    }, this.glContext);
  }
  dispose() {
    if (this.vertexShader) {
      this.glContext.deleteShader(this.vertexShader);
    }
    this.repo.forEach((a) => this.glContext.deleteProgram(a.program));
  }
  build(programInfo, inputTextureLayouts, outputTextureLayout) {
    return this.profiler.event("backend", "ProgramManager.build", () => {
      const preprocessor = new glsl_preprocessor_1.GlslPreprocessor(this.glContext, programInfo, inputTextureLayouts, outputTextureLayout);
      const fragScript = preprocessor.preprocess();
      const program = this.compile(fragScript);
      const artifact = {
        programInfo,
        program,
        uniformLocations: this.getUniformLocations(program, preprocessor.context.programInfo.inputNames, preprocessor.context.programInfo.variables),
        attribLocations: this.getAttribLocations(program)
      };
      return artifact;
    });
  }
  compile(fragShaderScript) {
    if (!this.vertexShader) {
      instrument_1$7.Logger.verbose("ProrgramManager", "Compiling and caching Vertex shader for the first time");
      const vertexShaderScript = glsl_source_1.getVertexShaderSource(this.glContext.version);
      this.vertexShader = this.glContext.compileShader(vertexShaderScript, this.glContext.gl.VERTEX_SHADER);
    }
    if (onnxruntime_common_1$5.env.debug) {
      instrument_1$7.Logger.verbose("ProrgramManager", `FragShader:
${fragShaderScript}
`);
    }
    const fragShader = this.glContext.compileShader(fragShaderScript, this.glContext.gl.FRAGMENT_SHADER);
    const program = this.glContext.createProgram(this.vertexShader, fragShader);
    this.glContext.deleteShader(fragShader);
    return program;
  }
  bindOutput(td) {
    const width = td.width;
    const height = td.height;
    instrument_1$7.Logger.verbose("ProrgramManager", `Binding output texture to Framebuffer: w/h=${width}/${height}, shape=${td.shape}, type=${td.tensor.type}`);
    this.glContext.attachFramebuffer(td.texture, width, height);
  }
  bindAttributes(attribLocations) {
    const positionHandle = attribLocations.position;
    const textureCoordHandle = attribLocations.textureCoord;
    this.glContext.setVertexAttributes(positionHandle, textureCoordHandle);
    this.attributesBound = true;
  }
  bindUniforms(uniformLocations, variables, textures) {
    var _a2;
    const gl = this.glContext.gl;
    let texturePosition = 0;
    for (const { name: name2, type, location, arrayLength } of uniformLocations) {
      const value = (_a2 = variables.find((v) => v.name === name2)) === null || _a2 === void 0 ? void 0 : _a2.data;
      if (type !== "sampler2D" && !value) {
        throw new Error(`variable '${name2}' does not have data defined in program info`);
      }
      switch (type) {
        case "sampler2D":
          this.bindTexture(textures[texturePosition], location, texturePosition);
          texturePosition++;
          break;
        case "float":
          if (arrayLength) {
            gl.uniform1fv(location, value);
          } else {
            gl.uniform1f(location, value);
          }
          break;
        case "int":
          if (arrayLength) {
            gl.uniform1iv(location, value);
          } else {
            gl.uniform1i(location, value);
          }
          break;
        default:
          throw new Error(`Uniform not implemented: ${type}`);
      }
    }
  }
  bindTexture(td, uniformHandle, position) {
    this.glContext.bindTextureToUniform(td.texture, position, uniformHandle);
  }
  getAttribLocations(program) {
    return {
      position: this.getAttribLocation(program, "position"),
      textureCoord: this.getAttribLocation(program, "textureCoord")
    };
  }
  getUniformLocations(program, samplers, variables) {
    const uniformLocations = [];
    if (samplers) {
      for (const sampler of samplers) {
        uniformLocations.push({ name: sampler, type: "sampler2D", location: this.getUniformLocation(program, sampler) });
      }
    }
    if (variables) {
      for (const variable of variables) {
        uniformLocations.push(Object.assign(Object.assign({}, variable), { location: this.getUniformLocation(program, variable.name) }));
      }
    }
    return uniformLocations;
  }
  getUniformLocation(program, name2) {
    const gl = this.glContext.gl;
    const reference = gl.getUniformLocation(program, name2);
    if (reference === null) {
      throw new Error(`Uniform ${name2} not found.`);
    }
    return reference;
  }
  getAttribLocation(program, name2) {
    const gl = this.glContext.gl;
    const attributeLocation = gl.getAttribLocation(program, name2);
    return attributeLocation;
  }
}
programManager.ProgramManager = ProgramManager;
var textureManager = {};
Object.defineProperty(textureManager, "__esModule", { value: true });
textureManager.TextureManager = void 0;
const instrument_1$6 = instrument;
class TextureManager {
  constructor(glContext, layoutStrategy, profiler, config) {
    this.glContext = glContext;
    this.layoutStrategy = layoutStrategy;
    this.profiler = profiler;
    this.config = config;
    this.pendingRead = /* @__PURE__ */ new Map();
    if (config.reuseTextures) {
      this.inUseTextures = /* @__PURE__ */ new Map();
      this.idleTextures = /* @__PURE__ */ new Map();
      this.textureLookup = /* @__PURE__ */ new Map();
    }
  }
  createTextureFromLayout(dataType, layout, data, usage) {
    const textureDataType = this.toEncoderType(dataType);
    const encoder = this.glContext.getEncoder(textureDataType, layout.channels || 1, usage);
    if (layout.isPacked && usage === 1) {
      throw new Error("not implemented");
    }
    const width = layout.width;
    const height = layout.height;
    let key;
    let inUseTextures;
    if (this.config.reuseTextures) {
      key = `${width}x${height}_${encoder.format}_${encoder.internalFormat}_${encoder.textureType}`;
      inUseTextures = this.inUseTextures.get(key);
      if (!inUseTextures) {
        inUseTextures = [];
        this.inUseTextures.set(key, inUseTextures);
      }
      const idleTextures = this.idleTextures.get(key);
      if (idleTextures && idleTextures.length > 0) {
        const texture2 = idleTextures.pop();
        inUseTextures.push(texture2);
        if (usage === 1) {
          this.glContext.updateTexture(texture2, width, height, encoder, this.toTextureData(dataType, data));
        }
        return texture2;
      }
    }
    instrument_1$6.Logger.verbose("TextureManager", `Creating new texture of size ${layout.width}x${layout.height}`);
    const texture = this.glContext.allocateTexture(width, height, encoder, this.toTextureData(dataType, data));
    if (this.config.reuseTextures) {
      inUseTextures.push(texture);
      this.textureLookup.set(texture, key);
    }
    return texture;
  }
  readTexture(td, dataType, channels) {
    if (!channels) {
      channels = 1;
    }
    return this.profiler.event("backend", "TextureManager.readTexture", () => {
      const dataSize = td.shape.reduce((a, b) => a * b) * channels;
      const data = this.glContext.readTexture(td.texture, td.width, td.height, dataSize, this.toEncoderType(dataType), channels);
      return this.toTensorData(dataType, data);
    });
  }
  async readTextureAsync(td, dataType, channels) {
    const dataId = td.tensor.dataId;
    if (!channels) {
      channels = 1;
    }
    if (this.pendingRead.has(dataId)) {
      const subscribers = this.pendingRead.get(dataId);
      return new Promise((resolve) => subscribers === null || subscribers === void 0 ? void 0 : subscribers.push(resolve));
    }
    return this.profiler.event("backend", "TextureManager.readTextureAsync", async () => {
      this.pendingRead.set(dataId, []);
      const dataSize = td.shape.reduce((a, b) => a * b) * channels;
      await this.glContext.createAndWaitForFence();
      const data = this.glContext.readTexture(td.texture, td.width, td.height, dataSize, this.toEncoderType(dataType), channels);
      const tensorData = this.toTensorData(dataType, data);
      const subscribers = this.pendingRead.get(dataId);
      this.pendingRead.delete(dataId);
      subscribers === null || subscribers === void 0 ? void 0 : subscribers.forEach((resolve) => resolve(tensorData));
      return tensorData;
    });
  }
  readUint8TextureAsFloat(td) {
    return this.profiler.event("backend", "TextureManager.readUint8TextureAsFloat", () => {
      const dataSize = td.shape.reduce((a, b) => a * b);
      const data = this.glContext.readTexture(td.texture, td.width, td.height, dataSize * 4, "byte", 4);
      return new Float32Array(data.buffer, data.byteOffset, dataSize);
    });
  }
  releaseTexture(textureData, deleteTexture) {
    let key;
    if (this.config.reuseTextures) {
      key = this.textureLookup.get(textureData.texture);
      if (key) {
        if (deleteTexture) {
          this.textureLookup.delete(key);
        }
        const inUseTextures = this.inUseTextures.get(key);
        if (inUseTextures) {
          const index = inUseTextures.indexOf(textureData.texture);
          if (index !== -1) {
            inUseTextures.splice(index, 1);
            let idleTextures = this.idleTextures.get(key);
            if (!idleTextures) {
              idleTextures = [];
              this.idleTextures.set(key, idleTextures);
            }
            idleTextures.push(textureData.texture);
          }
        }
      }
    }
    if (!key || deleteTexture) {
      instrument_1$6.Logger.verbose("TextureManager", `Deleting texture of size ${textureData.width}x${textureData.height}`);
      this.glContext.deleteTexture(textureData.texture);
    }
  }
  toTensorData(dataType, data) {
    switch (dataType) {
      case "int16":
        return data instanceof Int16Array ? data : Int16Array.from(data);
      case "int32":
        return data instanceof Int32Array ? data : Int32Array.from(data);
      case "int8":
        return data instanceof Int8Array ? data : Int8Array.from(data);
      case "uint16":
        return data instanceof Uint16Array ? data : Uint16Array.from(data);
      case "uint32":
        return data instanceof Uint32Array ? data : Uint32Array.from(data);
      case "uint8":
      case "bool":
        return data instanceof Uint8Array ? data : Uint8Array.from(data);
      case "float32":
        return data instanceof Float32Array ? data : Float32Array.from(data);
      case "float64":
        return data instanceof Float64Array ? data : Float64Array.from(data);
      default:
        throw new Error(`TensorData type ${dataType} is not supported`);
    }
  }
  toTextureData(dataType, data) {
    if (!data) {
      return void 0;
    }
    return data instanceof Float32Array ? data : new Float32Array(data);
  }
  toEncoderType(_dataType) {
    return "float";
  }
  clearActiveTextures() {
    this.glContext.clearActiveTextures();
  }
}
textureManager.TextureManager = TextureManager;
Object.defineProperty(sessionHandler$2, "__esModule", { value: true });
sessionHandler$2.WebGLSessionHandler = void 0;
const instrument_1$5 = instrument;
const opset_1 = opset;
const inference_handler_1 = inferenceHandler;
const op_resolve_rules_1 = opResolveRules;
const program_manager_1 = programManager;
const texture_layout_strategy_1 = textureLayoutStrategy;
const texture_manager_1 = textureManager;
class WebGLSessionHandler {
  constructor(backend2, context) {
    this.backend = backend2;
    this.context = context;
    this.layoutStrategy = new texture_layout_strategy_1.PreferLogicalStrategy(backend2.glContext.maxTextureSize);
    this.programManager = new program_manager_1.ProgramManager(this.context.profiler, backend2.glContext, this.layoutStrategy);
    this.textureManager = new texture_manager_1.TextureManager(backend2.glContext, this.layoutStrategy, this.context.profiler, { reuseTextures: backend2.textureCacheMode === "full" });
    this.packedTextureDataCache = /* @__PURE__ */ new Map();
    this.unpackedTextureDataCache = /* @__PURE__ */ new Map();
    this.pack = backend2.pack;
    this.pack2unpackMap = /* @__PURE__ */ new Map();
    this.unpack2packMap = /* @__PURE__ */ new Map();
  }
  createInferenceHandler() {
    return new inference_handler_1.WebGLInferenceHandler(this);
  }
  onGraphInitialized(graph2) {
    const initializers = graph2.getValues().filter((v) => v.from === -1 && v.tensor).map((v) => v.tensor.dataId);
    this.initializers = new Set(initializers);
  }
  isInitializer(tensorId) {
    return this.initializers ? this.initializers.has(tensorId) : false;
  }
  addInitializer(tensorId) {
    this.initializers.add(tensorId);
  }
  getTextureData(tensorId, isPacked) {
    if (isPacked) {
      return this.packedTextureDataCache.get(tensorId);
    } else {
      return this.unpackedTextureDataCache.get(tensorId);
    }
  }
  setTextureData(tensorId, textureData, isPacked = false) {
    instrument_1$5.Logger.verbose("WebGLSessionHandler", "Storing Texture data in cache");
    if (isPacked) {
      this.packedTextureDataCache.set(tensorId, textureData);
    } else {
      this.unpackedTextureDataCache.set(tensorId, textureData);
    }
  }
  dispose() {
    this.programManager.dispose();
    this.textureManager.clearActiveTextures();
    this.packedTextureDataCache.forEach((td) => this.textureManager.releaseTexture(td, true));
    this.packedTextureDataCache = /* @__PURE__ */ new Map();
    this.unpackedTextureDataCache.forEach((td) => this.textureManager.releaseTexture(td, true));
    this.unpackedTextureDataCache = /* @__PURE__ */ new Map();
  }
  resolve(node, opsets, graph2) {
    const op = opset_1.resolveOperator(node, opsets, op_resolve_rules_1.WEBGL_OP_RESOLVE_RULES);
    return { impl: op.opImpl, context: op.opInit ? op.opInit(node, graph2) : node };
  }
}
sessionHandler$2.WebGLSessionHandler = WebGLSessionHandler;
var webglContextFactory = {};
var webglContext = {};
var textureDataEncoder = {};
Object.defineProperty(textureDataEncoder, "__esModule", { value: true });
textureDataEncoder.Uint8DataEncoder = textureDataEncoder.RGBAFloatDataEncoder = textureDataEncoder.RedFloat32DataEncoder = void 0;
const instrument_1$4 = instrument;
class RedFloat32DataEncoder {
  constructor(gl, channels = 1) {
    if (channels === 1) {
      this.internalFormat = gl.R32F;
      this.format = gl.RED;
      this.textureType = gl.FLOAT;
      this.channelSize = channels;
    } else if (channels === 4) {
      this.internalFormat = gl.RGBA32F;
      this.format = gl.RGBA;
      this.textureType = gl.FLOAT;
      this.channelSize = channels;
    } else {
      throw new Error(`Invalid number of channels: ${channels}`);
    }
  }
  encode(src, textureSize) {
    let result;
    let source;
    if (src.constructor !== Float32Array) {
      instrument_1$4.Logger.warning("Encoder", "data was not of type Float32; creating new Float32Array");
      source = new Float32Array(src);
    }
    if (textureSize * this.channelSize > src.length) {
      instrument_1$4.Logger.warning("Encoder", "Source data too small. Allocating larger array");
      source = src;
      result = this.allocate(textureSize * this.channelSize);
      source.forEach((v, i) => result[i] = v);
    } else {
      source = src;
      result = source;
    }
    return result;
  }
  allocate(size) {
    return new Float32Array(size * 4);
  }
  decode(buffer, dataSize) {
    if (this.channelSize === 1) {
      const filteredData = buffer.filter((value, index) => index % 4 === 0).subarray(0, dataSize);
      return filteredData;
    }
    return buffer.subarray(0, dataSize);
  }
}
textureDataEncoder.RedFloat32DataEncoder = RedFloat32DataEncoder;
class RGBAFloatDataEncoder {
  constructor(gl, channels = 1, textureType) {
    if (channels !== 1 && channels !== 4) {
      throw new Error(`Invalid number of channels: ${channels}`);
    }
    this.internalFormat = gl.RGBA;
    this.format = gl.RGBA;
    this.channelSize = channels;
    this.textureType = textureType || gl.FLOAT;
  }
  encode(src, textureSize) {
    let dest = src;
    if (this.channelSize === 1) {
      instrument_1$4.Logger.verbose("Encoder", "Exploding into a larger array");
      dest = this.allocate(textureSize);
      src.forEach((v, i) => dest[i * 4] = v);
    }
    return dest;
  }
  allocate(size) {
    return new Float32Array(size * 4);
  }
  decode(buffer, dataSize) {
    if (this.channelSize === 1) {
      const filteredData = buffer.filter((value, index) => index % 4 === 0).subarray(0, dataSize);
      return filteredData;
    }
    return buffer.subarray(0, dataSize);
  }
}
textureDataEncoder.RGBAFloatDataEncoder = RGBAFloatDataEncoder;
class Uint8DataEncoder {
  constructor(gl, channels = 1) {
    this.channelSize = 4;
    if (channels === 1) {
      this.internalFormat = gl.ALPHA;
      this.format = gl.ALPHA;
      this.textureType = gl.UNSIGNED_BYTE;
      this.channelSize = channels;
    } else if (channels === 4) {
      this.internalFormat = gl.RGBA;
      this.format = gl.RGBA;
      this.textureType = gl.UNSIGNED_BYTE;
      this.channelSize = channels;
    } else {
      throw new Error(`Invalid number of channels: ${channels}`);
    }
  }
  encode(src, _textureSize) {
    return new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
  }
  allocate(size) {
    return new Uint8Array(size * this.channelSize);
  }
  decode(buffer, dataSize) {
    if (buffer instanceof Uint8Array) {
      return buffer.subarray(0, dataSize);
    }
    throw new Error(`Invalid array type: ${buffer.constructor}`);
  }
}
textureDataEncoder.Uint8DataEncoder = Uint8DataEncoder;
var __createBinding$2 = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(o, m, k, k2) {
  if (k2 === void 0)
    k2 = k;
  Object.defineProperty(o, k2, { enumerable: true, get: function() {
    return m[k];
  } });
} : function(o, m, k, k2) {
  if (k2 === void 0)
    k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault$2 = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
} : function(o, v) {
  o["default"] = v;
});
var __importStar$2 = commonjsGlobal && commonjsGlobal.__importStar || function(mod2) {
  if (mod2 && mod2.__esModule)
    return mod2;
  var result = {};
  if (mod2 != null) {
    for (var k in mod2)
      if (k !== "default" && Object.prototype.hasOwnProperty.call(mod2, k))
        __createBinding$2(result, mod2, k);
  }
  __setModuleDefault$2(result, mod2);
  return result;
};
Object.defineProperty(webglContext, "__esModule", { value: true });
webglContext.WebGLContext = webglContext.linearSearchLastTrue = void 0;
const onnxruntime_common_1$4 = require$$0$1;
const DataEncoders = __importStar$2(textureDataEncoder);
const utils_1 = utils;
function linearSearchLastTrue(arr) {
  let i = 0;
  for (; i < arr.length; ++i) {
    const isDone = arr[i]();
    if (!isDone) {
      break;
    }
  }
  return i - 1;
}
webglContext.linearSearchLastTrue = linearSearchLastTrue;
class WebGLContext {
  constructor(gl, version) {
    this.frameBufferBound = false;
    this.itemsToPoll = [];
    this.gl = gl;
    this.version = version;
    this.getExtensions();
    this.vertexbuffer = this.createVertexbuffer();
    this.framebuffer = this.createFramebuffer();
    this.queryVitalParameters();
  }
  allocateTexture(width, height, encoder, data) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const buffer = data ? encoder.encode(data, width * height) : null;
    gl.texImage2D(gl.TEXTURE_2D, 0, encoder.internalFormat, width, height, 0, encoder.format, encoder.textureType, buffer);
    this.checkError();
    return texture;
  }
  updateTexture(texture, width, height, encoder, data) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const buffer = encoder.encode(data, width * height);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, encoder.format, encoder.textureType, buffer);
    this.checkError();
  }
  attachFramebuffer(texture, width, height) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    this.checkError();
    gl.viewport(0, 0, width, height);
    gl.scissor(0, 0, width, height);
  }
  readTexture(texture, width, height, dataSize, dataType, channels) {
    const gl = this.gl;
    if (!channels) {
      channels = 1;
    }
    if (!this.frameBufferBound) {
      this.attachFramebuffer(texture, width, height);
    }
    const encoder = this.getEncoder(dataType, channels);
    const buffer = encoder.allocate(width * height);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.readPixels(0, 0, width, height, gl.RGBA, encoder.textureType, buffer);
    this.checkError();
    return encoder.decode(buffer, dataSize);
  }
  isFramebufferReady() {
    return true;
  }
  getActiveTexture() {
    const gl = this.gl;
    const n = gl.getParameter(this.gl.ACTIVE_TEXTURE);
    return `TEXTURE${n - gl.TEXTURE0}`;
  }
  getTextureBinding() {
    return this.gl.getParameter(this.gl.TEXTURE_BINDING_2D);
  }
  getFramebufferBinding() {
    return this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);
  }
  setVertexAttributes(positionHandle, textureCoordHandle) {
    const gl = this.gl;
    gl.vertexAttribPointer(positionHandle, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(positionHandle);
    if (textureCoordHandle !== -1) {
      gl.vertexAttribPointer(textureCoordHandle, 2, gl.FLOAT, false, 20, 12);
      gl.enableVertexAttribArray(textureCoordHandle);
    }
    this.checkError();
  }
  createProgram(vertexShader, fragShader) {
    const gl = this.gl;
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    return program;
  }
  compileShader(shaderSource, shaderType) {
    const gl = this.gl;
    const shader = gl.createShader(shaderType);
    if (!shader) {
      throw new Error(`createShader() returned null with type ${shaderType}`);
    }
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === false) {
      throw new Error(`Failed to compile shader: ${gl.getShaderInfoLog(shader)}
Shader source:
${shaderSource}`);
    }
    return shader;
  }
  deleteShader(shader) {
    this.gl.deleteShader(shader);
  }
  bindTextureToUniform(texture, position, uniformHandle) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + position);
    this.checkError();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    this.checkError();
    gl.uniform1i(uniformHandle, position);
    this.checkError();
  }
  draw() {
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    this.checkError();
  }
  checkError() {
    if (onnxruntime_common_1$4.env.debug) {
      const gl = this.gl;
      const error = gl.getError();
      let label = "";
      switch (error) {
        case gl.NO_ERROR:
          return;
        case gl.INVALID_ENUM:
          label = "INVALID_ENUM";
          break;
        case gl.INVALID_VALUE:
          label = "INVALID_VALUE";
          break;
        case gl.INVALID_OPERATION:
          label = "INVALID_OPERATION";
          break;
        case gl.INVALID_FRAMEBUFFER_OPERATION:
          label = "INVALID_FRAMEBUFFER_OPERATION";
          break;
        case gl.OUT_OF_MEMORY:
          label = "OUT_OF_MEMORY";
          break;
        case gl.CONTEXT_LOST_WEBGL:
          label = "CONTEXT_LOST_WEBGL";
          break;
        default:
          label = `Unknown WebGL Error: ${error.toString(16)}`;
      }
      throw new Error(label);
    }
  }
  deleteTexture(texture) {
    this.gl.deleteTexture(texture);
  }
  deleteProgram(program) {
    this.gl.deleteProgram(program);
  }
  getEncoder(dataType, channels, usage = 0) {
    if (this.version === 2) {
      return new DataEncoders.RedFloat32DataEncoder(this.gl, channels);
    }
    switch (dataType) {
      case "float":
        if (usage === 1 || this.isRenderFloat32Supported) {
          return new DataEncoders.RGBAFloatDataEncoder(this.gl, channels);
        } else {
          return new DataEncoders.RGBAFloatDataEncoder(this.gl, channels, this.textureHalfFloatExtension.HALF_FLOAT_OES);
        }
      case "int":
        throw new Error("not implemented");
      case "byte":
        return new DataEncoders.Uint8DataEncoder(this.gl, channels);
      default:
        throw new Error(`Invalid dataType: ${dataType}`);
    }
  }
  clearActiveTextures() {
    const gl = this.gl;
    for (let unit = 0; unit < this.maxTextureImageUnits; ++unit) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }
  dispose() {
    if (this.disposed) {
      return;
    }
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(this.framebuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(this.vertexbuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.finish();
    this.disposed = true;
  }
  createDefaultGeometry() {
    return new Float32Array([
      -1,
      1,
      0,
      0,
      1,
      -1,
      -1,
      0,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      1,
      -1,
      0,
      1,
      0
    ]);
  }
  createVertexbuffer() {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error("createBuffer() returned null");
    }
    const geometry = this.createDefaultGeometry();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);
    this.checkError();
    return buffer;
  }
  createFramebuffer() {
    const fb = this.gl.createFramebuffer();
    if (!fb) {
      throw new Error("createFramebuffer returned null");
    }
    return fb;
  }
  queryVitalParameters() {
    const gl = this.gl;
    this.isFloatTextureAttachableToFrameBuffer = this.checkFloatTextureAttachableToFrameBuffer();
    this.isRenderFloat32Supported = this.checkRenderFloat32();
    this.isFloat32DownloadSupported = this.checkFloat32Download();
    if (this.version === 1 && !this.textureHalfFloatExtension && !this.isRenderFloat32Supported) {
      throw new Error("both float32 and float16 TextureType are not supported");
    }
    this.isBlendSupported = !this.isRenderFloat32Supported || this.checkFloat32Blend();
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.maxTextureImageUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    if (this.version === 2)
      ;
  }
  getExtensions() {
    if (this.version === 2) {
      this.colorBufferFloatExtension = this.gl.getExtension("EXT_color_buffer_float");
      this.disjointTimerQueryWebgl2Extension = this.gl.getExtension("EXT_disjoint_timer_query_webgl2");
    } else {
      this.textureFloatExtension = this.gl.getExtension("OES_texture_float");
      this.textureHalfFloatExtension = this.gl.getExtension("OES_texture_half_float");
    }
  }
  checkFloatTextureAttachableToFrameBuffer() {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const internalFormat = this.version === 2 ? gl.RGBA32F : gl.RGBA;
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
    const frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const isComplete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteTexture(texture);
    gl.deleteFramebuffer(frameBuffer);
    return isComplete;
  }
  checkRenderFloat32() {
    if (this.version === 2) {
      if (!this.colorBufferFloatExtension) {
        return false;
      }
    } else {
      if (!this.textureFloatExtension) {
        return false;
      }
    }
    return this.isFloatTextureAttachableToFrameBuffer;
  }
  checkFloat32Download() {
    if (this.version === 2) {
      if (!this.colorBufferFloatExtension) {
        return false;
      }
    } else {
      if (!this.textureFloatExtension) {
        return false;
      }
      if (!this.gl.getExtension("WEBGL_color_buffer_float")) {
        return false;
      }
    }
    return this.isFloatTextureAttachableToFrameBuffer;
  }
  checkFloat32Blend() {
    const gl = this.gl;
    let texture;
    let frameBuffer;
    let vertexShader;
    let fragmentShader;
    let program;
    try {
      texture = gl.createTexture();
      frameBuffer = gl.createFramebuffer();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      const internalFormat = this.version === 2 ? gl.RGBA32F : gl.RGBA;
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.enable(gl.BLEND);
      vertexShader = gl.createShader(gl.VERTEX_SHADER);
      if (!vertexShader) {
        return false;
      }
      gl.shaderSource(vertexShader, "void main(){}");
      gl.compileShader(vertexShader);
      fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fragmentShader) {
        return false;
      }
      gl.shaderSource(fragmentShader, "precision highp float;void main(){gl_FragColor=vec4(0.5);}");
      gl.compileShader(fragmentShader);
      program = gl.createProgram();
      if (!program) {
        return false;
      }
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);
      gl.drawArrays(gl.POINTS, 0, 1);
      return gl.getError() === gl.NO_ERROR;
    } finally {
      gl.disable(gl.BLEND);
      if (program) {
        gl.deleteProgram(program);
      }
      if (vertexShader) {
        gl.deleteShader(vertexShader);
      }
      if (fragmentShader) {
        gl.deleteShader(fragmentShader);
      }
      if (frameBuffer) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(frameBuffer);
      }
      if (texture) {
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.deleteTexture(texture);
      }
    }
  }
  beginTimer() {
    if (this.version === 2 && this.disjointTimerQueryWebgl2Extension) {
      const gl2 = this.gl;
      const ext = this.disjointTimerQueryWebgl2Extension;
      const query = gl2.createQuery();
      gl2.beginQuery(ext.TIME_ELAPSED_EXT, query);
      return query;
    } else {
      throw new Error("WebGL1 profiling currently not supported.");
    }
  }
  endTimer() {
    if (this.version === 2 && this.disjointTimerQueryWebgl2Extension) {
      const gl2 = this.gl;
      const ext = this.disjointTimerQueryWebgl2Extension;
      gl2.endQuery(ext.TIME_ELAPSED_EXT);
      return;
    } else {
      throw new Error("WebGL1 profiling currently not supported");
    }
  }
  isTimerResultAvailable(query) {
    let available = false, disjoint = false;
    if (this.version === 2 && this.disjointTimerQueryWebgl2Extension) {
      const gl2 = this.gl;
      const ext = this.disjointTimerQueryWebgl2Extension;
      available = gl2.getQueryParameter(query, gl2.QUERY_RESULT_AVAILABLE);
      disjoint = gl2.getParameter(ext.GPU_DISJOINT_EXT);
    } else {
      throw new Error("WebGL1 profiling currently not supported");
    }
    return available && !disjoint;
  }
  getTimerResult(query) {
    let timeElapsed = 0;
    if (this.version === 2) {
      const gl2 = this.gl;
      timeElapsed = gl2.getQueryParameter(query, gl2.QUERY_RESULT);
      gl2.deleteQuery(query);
    } else {
      throw new Error("WebGL1 profiling currently not supported");
    }
    return timeElapsed / 1e6;
  }
  async waitForQueryAndGetTime(query) {
    await utils_1.repeatedTry(() => this.isTimerResultAvailable(query));
    return this.getTimerResult(query);
  }
  async createAndWaitForFence() {
    const fenceContext = this.createFence(this.gl);
    return this.pollFence(fenceContext);
  }
  createFence(gl) {
    let isFencePassed;
    const gl2 = gl;
    const query = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    if (query === null) {
      isFencePassed = () => true;
    } else {
      isFencePassed = () => {
        const status = gl2.clientWaitSync(query, 0, 0);
        return status === gl2.ALREADY_SIGNALED || status === gl2.CONDITION_SATISFIED;
      };
    }
    return { query, isFencePassed };
  }
  async pollFence(fenceContext) {
    return new Promise((resolve) => {
      void this.addItemToPoll(() => fenceContext.isFencePassed(), () => resolve());
    });
  }
  pollItems() {
    const index = linearSearchLastTrue(this.itemsToPoll.map((x) => x.isDoneFn));
    for (let i = 0; i <= index; ++i) {
      const { resolveFn } = this.itemsToPoll[i];
      resolveFn();
    }
    this.itemsToPoll = this.itemsToPoll.slice(index + 1);
  }
  async addItemToPoll(isDoneFn, resolveFn) {
    this.itemsToPoll.push({ isDoneFn, resolveFn });
    if (this.itemsToPoll.length > 1) {
      return;
    }
    await utils_1.repeatedTry(() => {
      this.pollItems();
      return this.itemsToPoll.length === 0;
    });
  }
}
webglContext.WebGLContext = WebGLContext;
Object.defineProperty(webglContextFactory, "__esModule", { value: true });
webglContextFactory.createNewWebGLContext = webglContextFactory.createWebGLContext = void 0;
const instrument_1$3 = instrument;
const webgl_context_1 = webglContext;
const cache = {};
function createWebGLContext(contextId) {
  let context;
  if ((!contextId || contextId === "webgl2") && "webgl2" in cache) {
    context = cache.webgl2;
  } else if ((!contextId || contextId === "webgl") && "webgl" in cache) {
    context = cache.webgl;
  }
  context = context || createNewWebGLContext(contextId);
  contextId = contextId || context.version === 1 ? "webgl" : "webgl2";
  const gl = context.gl;
  cache[contextId] = context;
  if (gl.isContextLost()) {
    delete cache[contextId];
    return createWebGLContext(contextId);
  }
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.STENCIL_TEST);
  gl.disable(gl.BLEND);
  gl.disable(gl.DITHER);
  gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.disable(gl.SAMPLE_COVERAGE);
  gl.enable(gl.SCISSOR_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  return context;
}
webglContextFactory.createWebGLContext = createWebGLContext;
function createNewWebGLContext(contextId) {
  const canvas = createCanvas();
  const contextAttributes = {
    alpha: false,
    depth: false,
    antialias: false,
    stencil: false,
    preserveDrawingBuffer: false,
    premultipliedAlpha: false,
    failIfMajorPerformanceCaveat: false
  };
  let gl;
  const ca = contextAttributes;
  if (!contextId || contextId === "webgl2") {
    gl = canvas.getContext("webgl2", ca);
    if (gl) {
      try {
        return new webgl_context_1.WebGLContext(gl, 2);
      } catch (err2) {
        instrument_1$3.Logger.warning("GlContextFactory", `failed to create WebGLContext using contextId 'webgl2'. Error: ${err2}`);
      }
    }
  }
  if (!contextId || contextId === "webgl") {
    gl = canvas.getContext("webgl", ca) || canvas.getContext("experimental-webgl", ca);
    if (gl) {
      try {
        return new webgl_context_1.WebGLContext(gl, 1);
      } catch (err2) {
        instrument_1$3.Logger.warning("GlContextFactory", `failed to create WebGLContext using contextId 'webgl' or 'experimental-webgl'. Error: ${err2}`);
      }
    }
  }
  throw new Error("WebGL is not supported");
}
webglContextFactory.createNewWebGLContext = createNewWebGLContext;
function createCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas;
}
Object.defineProperty(backendWebgl, "__esModule", { value: true });
backendWebgl.WebGLBackend = void 0;
const onnxruntime_common_1$3 = require$$0$1;
const instrument_1$2 = instrument;
const session_handler_1$1 = sessionHandler$2;
const webgl_context_factory_1 = webglContextFactory;
class WebGLBackend {
  get contextId() {
    return onnxruntime_common_1$3.env.webgl.contextId;
  }
  set contextId(value) {
    onnxruntime_common_1$3.env.webgl.contextId = value;
  }
  get matmulMaxBatchSize() {
    return onnxruntime_common_1$3.env.webgl.matmulMaxBatchSize;
  }
  set matmulMaxBatchSize(value) {
    onnxruntime_common_1$3.env.webgl.matmulMaxBatchSize = value;
  }
  get textureCacheMode() {
    return onnxruntime_common_1$3.env.webgl.textureCacheMode;
  }
  set textureCacheMode(value) {
    onnxruntime_common_1$3.env.webgl.textureCacheMode = value;
  }
  get pack() {
    return onnxruntime_common_1$3.env.webgl.pack;
  }
  set pack(value) {
    onnxruntime_common_1$3.env.webgl.pack = value;
  }
  get async() {
    return onnxruntime_common_1$3.env.webgl.async;
  }
  set async(value) {
    onnxruntime_common_1$3.env.webgl.async = value;
  }
  initialize() {
    try {
      this.glContext = webgl_context_factory_1.createWebGLContext(this.contextId);
      if (typeof this.matmulMaxBatchSize !== "number") {
        this.matmulMaxBatchSize = 16;
      }
      if (typeof this.textureCacheMode !== "string") {
        this.textureCacheMode = "full";
      }
      if (typeof this.pack !== "boolean") {
        this.pack = false;
      }
      if (typeof this.async !== "boolean") {
        this.async = false;
      }
      instrument_1$2.Logger.setWithEnv(onnxruntime_common_1$3.env);
      instrument_1$2.Logger.verbose("WebGLBackend", `Created WebGLContext: ${typeof this.glContext} with matmulMaxBatchSize: ${this.matmulMaxBatchSize}; textureCacheMode: ${this.textureCacheMode}; pack: ${this.pack}; async: ${this.async}.`);
      return true;
    } catch (e) {
      instrument_1$2.Logger.warning("WebGLBackend", `Unable to initialize WebGLBackend. ${e}`);
      return false;
    }
  }
  createSessionHandler(context) {
    return new session_handler_1$1.WebGLSessionHandler(this, context);
  }
  dispose() {
    this.glContext.dispose();
  }
}
backendWebgl.WebGLBackend = WebGLBackend;
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.resolveBackend = exports.backend = void 0;
  const backend_webgl_1 = backendWebgl;
  const backendsCache = /* @__PURE__ */ new Map();
  exports.backend = {
    webgl: new backend_webgl_1.WebGLBackend()
  };
  async function resolveBackend2(hint) {
    if (!hint) {
      return resolveBackend2(["webgl"]);
    } else {
      const hints = typeof hint === "string" ? [hint] : hint;
      for (const backendHint of hints) {
        const cache2 = backendsCache.get(backendHint);
        if (cache2) {
          return cache2;
        }
        const backend2 = await tryLoadBackend(backendHint);
        if (backend2) {
          return backend2;
        }
      }
    }
    throw new Error("no available backend to use");
  }
  exports.resolveBackend = resolveBackend2;
  async function tryLoadBackend(backendHint) {
    const backendObj = exports.backend;
    if (typeof backendObj[backendHint] !== "undefined" && isBackend(backendObj[backendHint])) {
      const backend2 = backendObj[backendHint];
      let init = backend2.initialize();
      if (typeof init === "object" && "then" in init) {
        init = await init;
      }
      if (init) {
        backendsCache.set(backendHint, backend2);
        return backend2;
      }
    }
    return void 0;
  }
  function isBackend(obj) {
    const o = obj;
    if ("initialize" in o && typeof o.initialize === "function" && "createSessionHandler" in o && typeof o.createSessionHandler === "function" && "dispose" in o && typeof o.dispose === "function") {
      return true;
    }
    return false;
  }
})(backend);
var executionPlan = {};
Object.defineProperty(executionPlan, "__esModule", { value: true });
executionPlan.ExecutionPlan = void 0;
const instrument_1$1 = instrument;
class KernelOp {
  constructor(op, node) {
    this.op = op;
    this.node = node;
  }
}
class ExecutionPlan {
  constructor(graph2, ops, profiler) {
    this.graph = graph2;
    this.profiler = profiler;
    this.initialize(ops);
  }
  initialize(ops) {
    this.profiler.event("session", "ExecutionPlan.initialize", () => {
      const graphNodes = this.graph.getNodes();
      if (graphNodes.length !== ops.length) {
        throw new Error("The size of nodes and OPs do not match.");
      }
      this._ops = ops.map((op, i) => new KernelOp(op, graphNodes[i]));
      this.reset();
      this._starter = [];
      this._ops.forEach((op, i) => {
        let resolved = true;
        for (const input of op.node.inputs) {
          if (!this._values[input] && this.graph.getInputIndices().indexOf(input) === -1) {
            resolved = false;
            break;
          }
        }
        if (resolved) {
          this._starter.push(i);
        }
      });
    });
  }
  reset() {
    this._values = this.graph.getValues().map((i) => i.tensor);
  }
  async execute(sessionHandler2, modelInputs) {
    return this.profiler.event("session", "ExecutionPlan.execute", async () => {
      this.reset();
      const inferenceHandler2 = sessionHandler2.createInferenceHandler();
      const graphInputs = this.graph.getInputIndices();
      if (modelInputs.length !== graphInputs.length) {
        throw new Error(`number of input tensors don't match the number of inputs to the model: actual: ${modelInputs.length} expected: ${graphInputs.length}`);
      }
      modelInputs.forEach((input, i) => {
        const index = graphInputs[i];
        this._values[index] = input;
      });
      const sequence = this._starter.slice(0);
      const graphValues = this.graph.getValues();
      const graphNodes = this.graph.getNodes();
      let rear = 0;
      while (rear < sequence.length) {
        const thisOpIndex = sequence[rear++];
        const thisOp = this._ops[thisOpIndex];
        const inputList = thisOp.node.inputs.map((i) => this._values[i]);
        if (inputList.indexOf(void 0) !== -1) {
          throw new Error(`unresolved input detected: op: ${thisOp.node}`);
        }
        const inputTensors = inputList;
        instrument_1$1.Logger.verbose("ExecPlan", `Runing op:${thisOp.node.name} (${inputTensors.map((t, i) => `'${thisOp.node.inputs[i]}': ${t.type}[${t.dims.join(",")}]`).join(", ")})`);
        const outputList = await this.profiler.event("node", thisOp.node.name, async () => thisOp.op.impl(inferenceHandler2, inputTensors, thisOp.op.context));
        if (outputList.length !== thisOp.node.outputs.length) {
          throw new Error("the size of output does not match model definition.");
        }
        outputList.forEach((output2, i) => {
          const j = thisOp.node.outputs[i];
          if (this._values[j]) {
            throw new Error(`output [${j}] already has value: op:${thisOp.node.name}`);
          }
          this._values[j] = output2;
        });
        const downstreamNodes = /* @__PURE__ */ new Set();
        outputList.forEach((output2, i) => {
          const j = thisOp.node.outputs[i];
          for (const currentDownstreamNodeIndex of graphValues[j].to) {
            const currentDownstreamNode = graphNodes[currentDownstreamNodeIndex];
            let resolved = true;
            for (const k of currentDownstreamNode.inputs) {
              if (!this._values[k]) {
                resolved = false;
                break;
              }
            }
            if (resolved) {
              downstreamNodes.add(currentDownstreamNodeIndex);
            }
          }
        });
        sequence.push(...downstreamNodes);
      }
      const output = [];
      for (let i = 0; i < this.graph.getOutputIndices().length; i++) {
        const outputIndex = this.graph.getOutputIndices()[i];
        const outputTensor = this._values[outputIndex];
        if (outputTensor === void 0) {
          throw new Error(`required output [${outputIndex}] does not have value`);
        }
        if (outputIndex === 0) {
          await outputTensor.getData();
        } else {
          outputTensor.data;
        }
        output.push(outputTensor);
      }
      instrument_1$1.Logger.verbose("ExecPlan", "disposing of inferenceHandler");
      inferenceHandler2.dispose();
      return output;
    });
  }
}
executionPlan.ExecutionPlan = ExecutionPlan;
var model = {};
var graph = {};
var attribute = {};
Object.defineProperty(attribute, "__esModule", { value: true });
attribute.Attribute = void 0;
const onnx_proto_1$2 = onnx;
const ort_generated_1$2 = ortGenerated;
var ortFbs$2 = ort_generated_1$2.onnxruntime.experimental.fbs;
const tensor_1$2 = tensor;
const util_1$3 = util;
class Attribute {
  constructor(attributes) {
    this._attributes = /* @__PURE__ */ new Map();
    if (attributes !== null && attributes !== void 0) {
      for (const attr of attributes) {
        if (attr instanceof onnx_proto_1$2.onnx.AttributeProto) {
          this._attributes.set(attr.name, [Attribute.getValue(attr), Attribute.getType(attr)]);
        } else if (attr instanceof ortFbs$2.Attribute) {
          this._attributes.set(attr.name(), [Attribute.getValue(attr), Attribute.getType(attr)]);
        }
      }
      if (this._attributes.size < attributes.length) {
        throw new Error("duplicated attribute names");
      }
    }
  }
  set(key, type, value) {
    this._attributes.set(key, [value, type]);
  }
  delete(key) {
    this._attributes.delete(key);
  }
  getFloat(key, defaultValue) {
    return this.get(key, "float", defaultValue);
  }
  getInt(key, defaultValue) {
    return this.get(key, "int", defaultValue);
  }
  getString(key, defaultValue) {
    return this.get(key, "string", defaultValue);
  }
  getTensor(key, defaultValue) {
    return this.get(key, "tensor", defaultValue);
  }
  getFloats(key, defaultValue) {
    return this.get(key, "floats", defaultValue);
  }
  getInts(key, defaultValue) {
    return this.get(key, "ints", defaultValue);
  }
  getStrings(key, defaultValue) {
    return this.get(key, "strings", defaultValue);
  }
  getTensors(key, defaultValue) {
    return this.get(key, "tensors", defaultValue);
  }
  get(key, type, defaultValue) {
    const valueAndType = this._attributes.get(key);
    if (valueAndType === void 0) {
      if (defaultValue !== void 0) {
        return defaultValue;
      }
      throw new Error(`required attribute not found: ${key}`);
    }
    if (valueAndType[1] !== type) {
      throw new Error(`type mismatch: expected ${type} but got ${valueAndType[1]}`);
    }
    return valueAndType[0];
  }
  static getType(attr) {
    const type = attr instanceof onnx_proto_1$2.onnx.AttributeProto ? attr.type : attr.type();
    switch (type) {
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.FLOAT:
        return "float";
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.INT:
        return "int";
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.STRING:
        return "string";
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.TENSOR:
        return "tensor";
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.FLOATS:
        return "floats";
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.INTS:
        return "ints";
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.STRINGS:
        return "strings";
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.TENSORS:
        return "tensors";
      default:
        throw new Error(`attribute type is not supported yet: ${onnx_proto_1$2.onnx.AttributeProto.AttributeType[type]}`);
    }
  }
  static getValue(attr) {
    const attrType = attr instanceof onnx_proto_1$2.onnx.AttributeProto ? attr.type : attr.type();
    if (attrType === onnx_proto_1$2.onnx.AttributeProto.AttributeType.GRAPH || attrType === onnx_proto_1$2.onnx.AttributeProto.AttributeType.GRAPHS) {
      throw new Error("graph attribute is not supported yet");
    }
    const value = this.getValueNoCheck(attr);
    if (attrType === onnx_proto_1$2.onnx.AttributeProto.AttributeType.INT && util_1$3.LongUtil.isLong(value)) {
      return util_1$3.LongUtil.longToNumber(value);
    }
    if (attrType === onnx_proto_1$2.onnx.AttributeProto.AttributeType.INTS) {
      const arr = value;
      const numberValue = new Array(arr.length);
      for (let i = 0; i < arr.length; i++) {
        const maybeLong = arr[i];
        numberValue[i] = util_1$3.LongUtil.longToNumber(maybeLong);
      }
      return numberValue;
    }
    if (attrType === onnx_proto_1$2.onnx.AttributeProto.AttributeType.TENSOR) {
      return attr instanceof onnx_proto_1$2.onnx.AttributeProto ? tensor_1$2.Tensor.fromProto(value) : tensor_1$2.Tensor.fromOrtTensor(value);
    }
    if (attrType === onnx_proto_1$2.onnx.AttributeProto.AttributeType.TENSORS) {
      if (attr instanceof onnx_proto_1$2.onnx.AttributeProto) {
        const tensorProtos = value;
        return tensorProtos.map((value2) => tensor_1$2.Tensor.fromProto(value2));
      } else if (attr instanceof ortFbs$2.Attribute) {
        const tensorProtos = value;
        return tensorProtos.map((value2) => tensor_1$2.Tensor.fromOrtTensor(value2));
      }
    }
    if (attrType === onnx_proto_1$2.onnx.AttributeProto.AttributeType.STRING) {
      if (attr instanceof onnx_proto_1$2.onnx.AttributeProto) {
        const utf8String = value;
        return util_1$3.decodeUtf8String(utf8String);
      }
    }
    if (attrType === onnx_proto_1$2.onnx.AttributeProto.AttributeType.STRINGS) {
      if (attr instanceof onnx_proto_1$2.onnx.AttributeProto) {
        const utf8Strings = value;
        return utf8Strings.map(util_1$3.decodeUtf8String);
      }
    }
    return value;
  }
  static getValueNoCheck(attr) {
    return attr instanceof onnx_proto_1$2.onnx.AttributeProto ? this.getValueNoCheckFromOnnxFormat(attr) : this.getValueNoCheckFromOrtFormat(attr);
  }
  static getValueNoCheckFromOnnxFormat(attr) {
    switch (attr.type) {
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.FLOAT:
        return attr.f;
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.INT:
        return attr.i;
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.STRING:
        return attr.s;
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.TENSOR:
        return attr.t;
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.GRAPH:
        return attr.g;
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.FLOATS:
        return attr.floats;
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.INTS:
        return attr.ints;
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.STRINGS:
        return attr.strings;
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.TENSORS:
        return attr.tensors;
      case onnx_proto_1$2.onnx.AttributeProto.AttributeType.GRAPHS:
        return attr.graphs;
      default:
        throw new Error(`unsupported attribute type: ${onnx_proto_1$2.onnx.AttributeProto.AttributeType[attr.type]}`);
    }
  }
  static getValueNoCheckFromOrtFormat(attr) {
    switch (attr.type()) {
      case ortFbs$2.AttributeType.FLOAT:
        return attr.f();
      case ortFbs$2.AttributeType.INT:
        return attr.i();
      case ortFbs$2.AttributeType.STRING:
        return attr.s();
      case ortFbs$2.AttributeType.TENSOR:
        return attr.t();
      case ortFbs$2.AttributeType.GRAPH:
        return attr.g();
      case ortFbs$2.AttributeType.FLOATS:
        return attr.floatsArray();
      case ortFbs$2.AttributeType.INTS: {
        const ints = [];
        for (let i = 0; i < attr.intsLength(); i++) {
          ints.push(attr.ints(i));
        }
        return ints;
      }
      case ortFbs$2.AttributeType.STRINGS: {
        const strings = [];
        for (let i = 0; i < attr.stringsLength(); i++) {
          strings.push(attr.strings(i));
        }
        return strings;
      }
      case ortFbs$2.AttributeType.TENSORS: {
        const tensors = [];
        for (let i = 0; i < attr.tensorsLength(); i++) {
          tensors.push(attr.tensors(i));
        }
        return tensors;
      }
      default:
        throw new Error(`unsupported attribute type: ${ortFbs$2.AttributeType[attr.type()]}`);
    }
  }
}
attribute.Attribute = Attribute;
Object.defineProperty(graph, "__esModule", { value: true });
graph.Graph = void 0;
const onnx_proto_1$1 = onnx;
const attribute_1 = attribute;
const ort_generated_1$1 = ortGenerated;
var ortFbs$1 = ort_generated_1$1.onnxruntime.experimental.fbs;
const tensor_1$1 = tensor;
const util_1$2 = util;
graph.Graph = {
  from: (graphProto, initializer) => new GraphImpl(graphProto, initializer)
};
class Value {
  constructor(valueInfo) {
    this._from = void 0;
    this._to = [];
    this.tensor = void 0;
    this.type = void 0;
    if (valueInfo) {
      this.type = util_1$2.ProtoUtil.tensorValueTypeFromProto(valueInfo.type.tensorType);
    }
  }
  get from() {
    return this._from;
  }
  get to() {
    return this._to;
  }
}
class Node {
  constructor(_nodeProto, name2) {
    if (_nodeProto instanceof onnx_proto_1$1.onnx.NodeProto) {
      this.name = _nodeProto.name;
      this.opType = _nodeProto.opType;
      this.attributes = new attribute_1.Attribute(_nodeProto.attribute);
    } else if (_nodeProto instanceof ortFbs$1.Node) {
      this.name = name2 !== null && name2 !== void 0 ? name2 : _nodeProto.name();
      this.opType = _nodeProto.opType();
      this.attributes = new attribute_1.Attribute(util_1$2.ProtoUtil.tensorAttributesFromORTFormat(_nodeProto));
    }
    this.inputs = [];
    this.outputs = [];
    this.executeNode = true;
  }
}
class GraphImpl {
  constructor(graph2, graphInitializer) {
    if (!graph2) {
      throw new TypeError("graph is empty");
    }
    this.buildGraph(graph2);
    this.transformGraph(graphInitializer);
    this.checkIsAcyclic();
  }
  getInputIndices() {
    return this._allInputIndices;
  }
  getInputNames() {
    return this._allInputNames;
  }
  getOutputIndices() {
    return this._allOutputIndices;
  }
  getOutputNames() {
    return this._allOutputNames;
  }
  getValues() {
    return this._allData;
  }
  getNodes() {
    return this._nodes;
  }
  buildGraph(graph2) {
    if (graph2 instanceof onnx_proto_1$1.onnx.GraphProto) {
      this.buildGraphFromOnnxFormat(graph2);
    } else if (graph2 instanceof ortFbs$1.Graph) {
      this.buildGraphFromOrtFormat(graph2);
    } else {
      throw new TypeError("Graph type is not supported.");
    }
  }
  buildGraphFromOnnxFormat(graph2) {
    const dataIndices = /* @__PURE__ */ new Map();
    this._allData = [];
    this._allInputIndices = [];
    this._allInputNames = [];
    this._allOutputIndices = [];
    this._allOutputNames = [];
    this._nodes = [];
    const nodesIndices = /* @__PURE__ */ new Map();
    if (!graph2.input) {
      throw new Error("missing information in graph: input");
    }
    const inputValueNames = [];
    for (const i of graph2.input) {
      if (dataIndices.has(i.name)) {
        throw new Error(`duplicated input name: ${i.name}`);
      }
      const currentIndex = this._allData.push(new Value(i)) - 1;
      dataIndices.set(i.name, currentIndex);
      inputValueNames.push(i.name);
    }
    if (!graph2.initializer) {
      throw new Error("missing information in graph: initializer");
    }
    for (const i of graph2.initializer) {
      let index = dataIndices.get(i.name);
      if (index === void 0) {
        const value = new Value();
        value.type = {
          shape: { dims: util_1$2.ProtoUtil.tensorDimsFromProto(i.dims) },
          tensorType: util_1$2.ProtoUtil.tensorDataTypeFromProto(i.dataType)
        };
        index = this._allData.push(value) - 1;
        dataIndices.set(i.name, index);
      }
      this._allData[index]._from = -1;
      this._allData[index].tensor = tensor_1$1.Tensor.fromProto(i);
    }
    for (let i = 0; i < this._allData.length; i++) {
      if (!this._allData[i].tensor) {
        this._allInputIndices.push(i);
        this._allInputNames.push(inputValueNames[i]);
      }
    }
    if (!graph2.output) {
      throw new Error("missing information in graph: output");
    }
    for (const i of graph2.output) {
      if (dataIndices.has(i.name)) {
        throw new Error(`duplicated output name: ${i.name}`);
      }
      const currentIndex = this._allData.push(new Value(i)) - 1;
      dataIndices.set(i.name, currentIndex);
      this._allOutputIndices.push(currentIndex);
      this._allOutputNames.push(i.name);
    }
    if (!graph2.node) {
      throw new Error("missing information in graph: node");
    }
    for (const nodeProto of graph2.node) {
      if (!nodeProto.name) {
        for (let pick = 0; ; pick++) {
          const name2 = `unnamed_${nodeProto.opType}_${pick}`;
          if (!nodesIndices.has(name2)) {
            nodeProto.name = name2;
            break;
          }
        }
      }
      if (nodesIndices.has(nodeProto.name)) {
        throw new Error(`duplicated node name: ${nodeProto.name}`);
      }
      const currentIndex = this._nodes.push(new Node(nodeProto)) - 1;
      nodesIndices.set(nodeProto.name, currentIndex);
    }
    for (let i = 0; i < this._nodes.length; i++) {
      const node = this._nodes[i];
      const nodeProto = graph2.node[i];
      if (!nodeProto.output) {
        throw new Error(`missing output for node: ${nodeProto.name}`);
      }
      for (const output of nodeProto.output) {
        let dataIndex = dataIndices.get(output);
        if (typeof dataIndex === "undefined") {
          dataIndex = this._allData.push(new Value()) - 1;
          dataIndices.set(output, dataIndex);
        }
        node.outputs.push(dataIndex);
        if (this._allData[dataIndex]._from !== void 0) {
          throw new Error(`multiple nodes output to one data value: ${dataIndex}`);
        }
        this._allData[dataIndex]._from = i;
        if (nodeProto.opType === "Constant") {
          if (!nodeProto.attribute || nodeProto.attribute.length !== 1 || !nodeProto.attribute[0].t) {
            throw new Error("missing attributes or missing tensor value in attributes for this Constant operator");
          }
          if (!nodeProto.output || nodeProto.output.length !== 1) {
            throw new Error("missing output or incorrect number of outputs for this Constant operator");
          }
          node.outputs.pop();
          node.executeNode = false;
          this._allData[dataIndex]._from = -1;
          this._allData[dataIndex].tensor = tensor_1$1.Tensor.fromProto(nodeProto.attribute[0].t);
        }
      }
    }
    for (let i = 0; i < this._nodes.length; i++) {
      const node = this._nodes[i];
      const nodeProto = graph2.node[i];
      if (!nodeProto.input) {
        throw new Error(`missing input for node: ${nodeProto.name}`);
      }
      for (const input of nodeProto.input) {
        const dataIndex = dataIndices.get(input);
        if (typeof dataIndex === "undefined") {
          throw new Error(`unrecognized input '${input}' for node: ${nodeProto.name}`);
        }
        node.inputs.push(dataIndex);
        this._allData[dataIndex]._to.push(i);
      }
    }
    return true;
  }
  buildGraphFromOrtFormat(graph2) {
    var _a2, _b, _c;
    const dataIndices = /* @__PURE__ */ new Map();
    this._allData = [];
    this._allInputIndices = [];
    this._allInputNames = [];
    this._allOutputIndices = [];
    this._allOutputNames = [];
    this._nodes = [];
    const nodesIndices = /* @__PURE__ */ new Map();
    const inputValueNames = [];
    for (let i = 0; i < graph2.inputsLength(); i++) {
      const inputName = graph2.inputs(i);
      if (dataIndices.has(inputName)) {
        throw new Error(`duplicated input name: ${inputName}`);
      }
      for (let j = 0; j < graph2.nodeArgsLength(); j++) {
        if (((_a2 = graph2.nodeArgs(j)) === null || _a2 === void 0 ? void 0 : _a2.name()) === inputName) {
          const value = new Value();
          const valueType = (_c = (_b = graph2.nodeArgs(j)) === null || _b === void 0 ? void 0 : _b.type()) === null || _c === void 0 ? void 0 : _c.valueType();
          if (valueType !== ortFbs$1.TypeInfoValue.tensor_type) {
            throw new Error("Unexpected value type for the nodeArg.");
          }
          const valueInfo = graph2.nodeArgs(j).type().value(new ortFbs$1.TensorTypeAndShape());
          const type = util_1$2.ProtoUtil.tensorDataTypeFromProto(valueInfo.elemType());
          const shape2 = valueInfo.shape();
          const dims = [];
          for (let k = 0; k < shape2.dimLength(); k++) {
            dims.push(util_1$2.LongUtil.longToNumber(shape2.dim(k).value().dimValue()));
          }
          value.type = { shape: { dims }, tensorType: type };
          const currentIndex = this._allData.push(value) - 1;
          dataIndices.set(inputName, currentIndex);
          inputValueNames.push(inputName);
        }
      }
    }
    for (let i = 0; i < graph2.initializersLength(); i++) {
      const initializer = graph2.initializers(i);
      let index = dataIndices.get(initializer.name());
      if (index === void 0) {
        const value = new Value();
        const dims = util_1$2.ProtoUtil.tensorDimsFromORTFormat(initializer);
        const type = util_1$2.ProtoUtil.tensorDataTypeFromProto(initializer.dataType());
        value.type = { shape: { dims }, tensorType: type };
        index = this._allData.push(value) - 1;
        dataIndices.set(initializer.name(), index);
      }
      this._allData[index]._from = -1;
      this._allData[index].tensor = tensor_1$1.Tensor.fromOrtTensor(initializer);
    }
    for (let i = 0; i < this._allData.length; i++) {
      if (!this._allData[i].tensor) {
        this._allInputIndices.push(i);
        this._allInputNames.push(inputValueNames[i]);
      }
    }
    for (let i = 0; i < graph2.outputsLength(); i++) {
      const outputName = graph2.outputs(i);
      if (dataIndices.has(outputName)) {
        throw new Error(`duplicated output name: ${outputName}`);
      }
      const currentIndex = this._allData.push(new Value()) - 1;
      dataIndices.set(outputName, currentIndex);
      this._allOutputIndices.push(currentIndex);
      this._allOutputNames.push(outputName);
    }
    if (!graph2.nodes) {
      throw new Error("missing information in graph: node");
    }
    for (let i = 0; i < graph2.nodesLength(); i++) {
      const nodeProto = graph2.nodes(i);
      let name2 = nodeProto.name();
      if (!name2) {
        for (let pick = 0; ; pick++) {
          name2 = `unnamed_${nodeProto.opType()}_${pick}`;
          if (!nodesIndices.has(name2)) {
            break;
          }
        }
      }
      if (nodesIndices.has(name2)) {
        throw new Error(`duplicated node name: ${name2}`);
      }
      const currentIndex = this._nodes.push(new Node(nodeProto, name2)) - 1;
      nodesIndices.set(name2, currentIndex);
    }
    for (let i = 0; i < this._nodes.length; i++) {
      const node = this._nodes[i];
      const nodeProto = graph2.nodes(i);
      if (nodeProto == null) {
        throw new Error(`No node exists at index ${i}`);
      }
      if ((nodeProto === null || nodeProto === void 0 ? void 0 : nodeProto.outputsLength()) === 0) {
        throw new Error(`missing output for node: ${nodeProto.name}`);
      }
      for (let j = 0; j < (nodeProto === null || nodeProto === void 0 ? void 0 : nodeProto.outputsLength()); j++) {
        const output = nodeProto === null || nodeProto === void 0 ? void 0 : nodeProto.outputs(j);
        let dataIndex = dataIndices.get(output);
        if (typeof dataIndex === "undefined") {
          dataIndex = this._allData.push(new Value()) - 1;
          dataIndices.set(output, dataIndex);
        }
        node.outputs.push(dataIndex);
        if (this._allData[dataIndex]._from !== void 0) {
          throw new Error(`multiple nodes output to one data value: ${dataIndex}`);
        }
        this._allData[dataIndex]._from = i;
        if (nodeProto.opType() === "Constant") {
          if (nodeProto.attributesLength() !== 1 || !nodeProto.attributes(0).t()) {
            throw new Error("missing attributes or missing tensor value in attributes for this Constant operator");
          }
          if (nodeProto.outputsLength() !== 1) {
            throw new Error("missing output or incorrect number of outputs for this Constant operator");
          }
          node.outputs.pop();
          node.executeNode = false;
          this._allData[dataIndex]._from = -1;
          this._allData[dataIndex].tensor = tensor_1$1.Tensor.fromOrtTensor(nodeProto.attributes(0).t());
        }
      }
    }
    for (let i = 0; i < this._nodes.length; i++) {
      const node = this._nodes[i];
      const nodeProto = graph2.nodes(i);
      if (nodeProto.inputsLength() === 0) {
        throw new Error(`missing input for node: ${nodeProto.name}`);
      }
      for (let j = 0; j < nodeProto.inputsLength(); j++) {
        const input = nodeProto.inputs(j);
        const dataIndex = dataIndices.get(input);
        if (typeof dataIndex === "undefined") {
          throw new Error(`unrecognized input '${input}' for node: ${nodeProto.name()}`);
        }
        node.inputs.push(dataIndex);
        this._allData[dataIndex]._to.push(i);
      }
    }
  }
  checkIsAcyclic() {
    const starters = /* @__PURE__ */ new Set();
    this._allInputIndices.forEach((i) => {
      const data = this._allData[i];
      data._to.forEach((j) => {
        starters.add(j);
      });
    });
    const nodesStack = Array.from(starters);
    const nodesState = new Array(this._nodes.length).fill("white");
    while (nodesStack.length > 0) {
      const nodeIndex = nodesStack.pop();
      if (nodesState[nodeIndex] === "gray") {
        nodesState[nodeIndex] = "black";
      } else {
        nodesStack.push(nodeIndex);
        nodesState[nodeIndex] = "gray";
        this._nodes[nodeIndex].outputs.forEach((outgoingEdgeIndex) => {
          const data = this._allData[outgoingEdgeIndex];
          if (typeof data.tensor !== "undefined") {
            throw new Error("node outputs should not be initialized");
          }
          if (data._from !== nodeIndex) {
            throw new Error("from property of the Value object doesn't match index of Node being processed");
          }
          data._to.forEach((downstreamNodeIndex) => {
            if (nodesState[downstreamNodeIndex] === "gray") {
              throw new Error("model graph is cyclic");
            } else if (nodesState[downstreamNodeIndex] === "white") {
              nodesStack.push(downstreamNodeIndex);
            }
          });
        });
      }
    }
  }
  transformGraph(graphInitializer) {
    this.removeAllIdentityNodes();
    this.removeAllDropoutNodes();
    this.fuseConvActivationNodes();
    if (graphInitializer) {
      graphInitializer.transformGraph(this);
    }
    this.finalizeGraph();
  }
  finalizeGraph() {
    let offset = 0;
    for (let i = 0; i < this._nodes.length; i++) {
      if (!this._nodes[i].executeNode) {
        offset++;
        this._nodes[i].outputs.forEach((ind) => {
          this._allData[ind]._from = -2;
        });
        this._nodes.splice(i, 1);
        i--;
        continue;
      }
      if (offset > 0) {
        this._nodes[i].inputs.forEach((value) => {
          const ind = this._allData[value]._to.indexOf(i + offset);
          if (ind !== -1) {
            this._allData[value]._to[ind] = i;
          }
        });
        this._nodes[i].outputs.forEach((value) => {
          if (this._allData[value]._from && this._allData[value]._from === i + offset) {
            this._allData[value]._from = i;
          }
        });
      }
    }
    offset = 0;
    for (let i = 0; i < this._allData.length; i++) {
      if (this._allData[i].from === -2 && this._allOutputIndices.indexOf(i + offset) === -1) {
        offset++;
        this._allData.splice(i, 1);
        i--;
        continue;
      }
      if (offset > 0) {
        let ind = -1;
        if (this._allData[i].from !== void 0 && this._allData[i].from !== -1) {
          ind = this._nodes[this._allData[i].from].outputs.indexOf(i + offset);
          if (ind !== -1) {
            this._nodes[this._allData[i].from].outputs[ind] = i;
          }
        } else {
          ind = this._allInputIndices.indexOf(i + offset);
          if (ind !== -1) {
            this._allInputIndices[ind] = i;
          }
        }
        this._allData[i].to.forEach((node) => {
          ind = this._nodes[node].inputs.indexOf(i + offset);
          if (ind !== -1) {
            this._nodes[node].inputs[ind] = i;
          }
        });
        if (this._allData[i].to.length === 0) {
          ind = this._allOutputIndices.indexOf(i + offset);
          if (ind !== -1) {
            this._allOutputIndices[ind] = i;
          }
        }
      }
    }
  }
  deleteNode(nodeIndex) {
    const node = this._nodes[nodeIndex];
    if (node.outputs.length > 1) {
      for (let i = 1; i < node.outputs.length; i++) {
        if (this._allData[node.outputs[i]].to.length > 0) {
          throw new Error("Node deletion with more than one output connected to other nodes is not supported. ");
        }
      }
    }
    node.executeNode = false;
    const inputValueIndex = node.inputs[0];
    const outputValueIndex = node.outputs[0];
    const nodesConsumingOutput = this._allData[outputValueIndex].to;
    const delIndex = this._allData[inputValueIndex].to.indexOf(nodeIndex);
    if (delIndex === -1) {
      throw new Error("The Value object doesn't have the current Node in it's 'to' property ");
    }
    this._allData[inputValueIndex].to.splice(delIndex, 1);
    this._allData[outputValueIndex]._to = [];
    const index = this._allOutputIndices.indexOf(outputValueIndex);
    if (index !== -1) {
      this._allOutputIndices[index] = inputValueIndex;
    }
    if (nodesConsumingOutput && nodesConsumingOutput.length > 0) {
      for (const nodeIndex2 of nodesConsumingOutput) {
        const replaceIndex = this._nodes[nodeIndex2].inputs.indexOf(outputValueIndex);
        if (replaceIndex === -1) {
          throw new Error("The Node object doesn't have the output Value in it's 'inputs' property ");
        }
        this._nodes[nodeIndex2].inputs[replaceIndex] = inputValueIndex;
        this._allData[inputValueIndex].to.push(nodeIndex2);
      }
    }
  }
  removeAllDropoutNodes() {
    let nodeIndex = 0;
    for (const node of this._nodes) {
      if (node.opType === "Dropout") {
        if (node.inputs.length !== 1) {
          throw new Error("Dropout nodes should only contain one input. ");
        }
        if (node.outputs.length !== 1 && node.outputs.length !== 2) {
          throw new Error("Dropout nodes should contain either 1 or 2 output(s)");
        }
        if (node.outputs.length === 2 && this._allData[node.outputs[1]]._to.length !== 0) {
          throw new Error("Dropout nodes's second output should not be referenced by other nodes");
        }
        this.deleteNode(nodeIndex);
      }
      nodeIndex++;
    }
  }
  removeAllIdentityNodes() {
    let nodeIndex = 0;
    for (const node of this._nodes) {
      if (node.opType === "Identity") {
        this.deleteNode(nodeIndex);
      }
      nodeIndex++;
    }
  }
  isActivation(n) {
    switch (n.opType) {
      case "Relu":
      case "Sigmoid":
      case "Clip":
        return true;
      default:
        return false;
    }
  }
  fuseConvActivationNodes() {
    for (const node of this._nodes) {
      if (node.opType === "Conv") {
        const next = this._allData[node.outputs[0]]._to;
        if (next.length === 1 && this.isActivation(this._nodes[next[0]])) {
          const child = this._nodes[next[0]];
          if (child.opType === "Clip") {
            if (child.inputs.length === 1) {
              try {
                node.attributes.set("activation_params", "floats", [child.attributes.getFloat("min"), child.attributes.getFloat("max")]);
              } catch (e) {
                node.attributes.set("activation_params", "floats", [util_1$2.MIN_CLIP, util_1$2.MAX_CLIP]);
              }
            } else if (child.inputs.length >= 3 && this._allData[child.inputs[1]].tensor !== void 0 && this._allData[child.inputs[2]].tensor !== void 0) {
              node.attributes.set("activation_params", "floats", [
                this._allData[child.inputs[1]].tensor.floatData[0],
                this._allData[child.inputs[2]].tensor.floatData[0]
              ]);
            } else {
              continue;
            }
          }
          node.attributes.set("activation", "string", child.opType);
          this.deleteNode(next[0]);
        }
      }
    }
  }
}
Object.defineProperty(model, "__esModule", { value: true });
model.Model = void 0;
const flatbuffers_1 = require$$0;
const onnx_proto_1 = onnx;
const graph_1 = graph;
const ort_generated_1 = ortGenerated;
var ortFbs = ort_generated_1.onnxruntime.experimental.fbs;
const util_1$1 = util;
class Model {
  constructor() {
  }
  load(buf, graphInitializer, isOrtFormat) {
    if (!isOrtFormat) {
      try {
        this.loadFromOnnxFormat(buf, graphInitializer);
        return;
      } catch (e) {
        if (isOrtFormat !== void 0) {
          throw e;
        }
      }
    }
    this.loadFromOrtFormat(buf, graphInitializer);
  }
  loadFromOnnxFormat(buf, graphInitializer) {
    const modelProto = onnx_proto_1.onnx.ModelProto.decode(buf);
    const irVersion = util_1$1.LongUtil.longToNumber(modelProto.irVersion);
    if (irVersion < 3) {
      throw new Error("only support ONNX model with IR_VERSION>=3");
    }
    this._opsets = modelProto.opsetImport.map((i) => ({ domain: i.domain, version: util_1$1.LongUtil.longToNumber(i.version) }));
    this._graph = graph_1.Graph.from(modelProto.graph, graphInitializer);
  }
  loadFromOrtFormat(buf, graphInitializer) {
    const fb = new flatbuffers_1.flatbuffers.ByteBuffer(buf);
    const ortModel = ortFbs.InferenceSession.getRootAsInferenceSession(fb).model();
    const irVersion = util_1$1.LongUtil.longToNumber(ortModel.irVersion());
    if (irVersion < 3) {
      throw new Error("only support ONNX model with IR_VERSION>=3");
    }
    this._opsets = [];
    for (let i = 0; i < ortModel.opsetImportLength(); i++) {
      const opsetId = ortModel.opsetImport(i);
      this._opsets.push({ domain: opsetId === null || opsetId === void 0 ? void 0 : opsetId.domain(), version: util_1$1.LongUtil.longToNumber(opsetId.version()) });
    }
    this._graph = graph_1.Graph.from(ortModel.graph(), graphInitializer);
  }
  get graph() {
    return this._graph;
  }
  get opsets() {
    return this._opsets;
  }
}
model.Model = Model;
Object.defineProperty(session, "__esModule", { value: true });
session.Session = void 0;
const fs_1 = require$$3$1;
const util_1 = require$$3$1;
const backend_1 = backend;
const execution_plan_1 = executionPlan;
const instrument_1 = instrument;
const model_1 = model;
class Session {
  constructor(config = {}) {
    this._initialized = false;
    this.backendHint = config.backendHint;
    this.profiler = instrument_1.Profiler.create(config.profiler);
    this.context = { profiler: this.profiler, graphInputTypes: [], graphInputDims: [] };
  }
  get inputNames() {
    return this._model.graph.getInputNames();
  }
  get outputNames() {
    return this._model.graph.getOutputNames();
  }
  startProfiling() {
    this.profiler.start();
  }
  endProfiling() {
    this.profiler.stop();
  }
  async loadModel(arg, byteOffset, length2) {
    await this.profiler.event("session", "Session.loadModel", async () => {
      const backend2 = await backend_1.resolveBackend(this.backendHint);
      this.sessionHandler = backend2.createSessionHandler(this.context);
      this._model = new model_1.Model();
      if (typeof arg === "string") {
        const isOrtFormat = arg.endsWith(".ort");
        if (typeof fetch === "undefined") {
          const buf = await util_1.promisify(fs_1.readFile)(arg);
          this.initialize(buf, isOrtFormat);
        } else {
          const response = await fetch(arg);
          const buf = await response.arrayBuffer();
          this.initialize(new Uint8Array(buf), isOrtFormat);
        }
      } else if (!ArrayBuffer.isView(arg)) {
        const arr = new Uint8Array(arg, byteOffset || 0, length2 || arg.byteLength);
        this.initialize(arr);
      } else {
        this.initialize(arg);
      }
    });
  }
  initialize(modelProtoBlob, isOrtFormat) {
    if (this._initialized) {
      throw new Error("already initialized");
    }
    this.profiler.event("session", "Session.initialize", () => {
      const graphInitializer = this.sessionHandler.transformGraph ? this.sessionHandler : void 0;
      this._model.load(modelProtoBlob, graphInitializer, isOrtFormat);
      if (this.sessionHandler.onGraphInitialized) {
        this.sessionHandler.onGraphInitialized(this._model.graph);
      }
      this.initializeOps(this._model.graph);
      this._executionPlan = new execution_plan_1.ExecutionPlan(this._model.graph, this._ops, this.profiler);
    });
    this._initialized = true;
  }
  async run(inputs) {
    if (!this._initialized) {
      throw new Error("session not initialized yet");
    }
    return this.profiler.event("session", "Session.run", async () => {
      const inputTensors = this.normalizeAndValidateInputs(inputs);
      const outputTensors = await this._executionPlan.execute(this.sessionHandler, inputTensors);
      return this.createOutput(outputTensors);
    });
  }
  normalizeAndValidateInputs(inputs) {
    const modelInputNames = this._model.graph.getInputNames();
    if (Array.isArray(inputs)) {
      if (inputs.length !== modelInputNames.length) {
        throw new Error(`incorrect input array length: expected ${modelInputNames.length} but got ${inputs.length}`);
      }
    } else {
      if (inputs.size !== modelInputNames.length) {
        throw new Error(`incorrect input map size: expected ${modelInputNames.length} but got ${inputs.size}`);
      }
      const sortedInputs = new Array(inputs.size);
      let sortedInputsIndex = 0;
      for (let i = 0; i < modelInputNames.length; ++i) {
        const tensor2 = inputs.get(modelInputNames[i]);
        if (!tensor2) {
          throw new Error(`missing input tensor for: '${name}'`);
        }
        sortedInputs[sortedInputsIndex++] = tensor2;
      }
      inputs = sortedInputs;
    }
    if (!this.context.graphInputTypes || this.context.graphInputTypes.length === 0 || !this.context.graphInputDims || this.context.graphInputDims.length === 0) {
      const modelInputIndices = this._model.graph.getInputIndices();
      const modelValues = this._model.graph.getValues();
      const graphInputDims = new Array(modelInputIndices.length);
      for (let i = 0; i < modelInputIndices.length; ++i) {
        const graphInput = modelValues[modelInputIndices[i]];
        graphInputDims[i] = graphInput.type.shape.dims;
        this.context.graphInputTypes.push(graphInput.type.tensorType);
        this.context.graphInputDims.push(inputs[i].dims);
      }
      this.validateInputTensorDims(graphInputDims, inputs, true);
    } else {
      this.validateInputTensorDims(this.context.graphInputDims, inputs, false);
    }
    this.validateInputTensorTypes(this.context.graphInputTypes, inputs);
    return inputs;
  }
  validateInputTensorTypes(graphInputTypes, givenInputs) {
    for (let i = 0; i < givenInputs.length; i++) {
      const expectedType = graphInputTypes[i];
      const actualType = givenInputs[i].type;
      if (expectedType !== actualType) {
        throw new Error(`input tensor[${i}] check failed: expected type '${expectedType}' but got ${actualType}`);
      }
    }
  }
  validateInputTensorDims(graphInputDims, givenInputs, noneDimSupported) {
    for (let i = 0; i < givenInputs.length; i++) {
      const expectedDims = graphInputDims[i];
      const actualDims = givenInputs[i].dims;
      if (!this.compareTensorDims(expectedDims, actualDims, noneDimSupported)) {
        throw new Error(`input tensor[${i}] check failed: expected shape '[${expectedDims.join(",")}]' but got [${actualDims.join(",")}]`);
      }
    }
  }
  compareTensorDims(expectedDims, actualDims, noneDimSupported) {
    if (expectedDims.length !== actualDims.length) {
      return false;
    }
    for (let i = 0; i < expectedDims.length; ++i) {
      if (expectedDims[i] !== actualDims[i] && (!noneDimSupported || expectedDims[i] !== 0)) {
        return false;
      }
    }
    return true;
  }
  createOutput(outputTensors) {
    const modelOutputNames = this._model.graph.getOutputNames();
    if (outputTensors.length !== modelOutputNames.length) {
      throw new Error("expected number of outputs do not match number of generated outputs");
    }
    const output = /* @__PURE__ */ new Map();
    for (let i = 0; i < modelOutputNames.length; ++i) {
      output.set(modelOutputNames[i], outputTensors[i]);
    }
    return output;
  }
  initializeOps(graph2) {
    const nodes = graph2.getNodes();
    this._ops = new Array(nodes.length);
    for (let i = 0; i < nodes.length; i++) {
      this._ops[i] = this.sessionHandler.resolve(nodes[i], this._model.opsets, graph2);
    }
  }
}
session.Session = Session;
var sessionHandler$1 = {};
Object.defineProperty(sessionHandler$1, "__esModule", { value: true });
sessionHandler$1.OnnxjsSessionHandler = void 0;
const onnxruntime_common_1$2 = require$$0$1;
const tensor_1 = tensor;
class OnnxjsSessionHandler {
  constructor(session2) {
    this.session = session2;
    this.inputNames = this.session.inputNames;
    this.outputNames = this.session.outputNames;
  }
  async dispose() {
  }
  async run(feeds, _fetches, _options) {
    const inputMap = /* @__PURE__ */ new Map();
    for (const name2 in feeds) {
      if (Object.hasOwnProperty.call(feeds, name2)) {
        const feed = feeds[name2];
        inputMap.set(name2, new tensor_1.Tensor(feed.dims, feed.type, void 0, void 0, feed.data));
      }
    }
    const outputMap = await this.session.run(inputMap);
    const output = {};
    outputMap.forEach((tensor2, name2) => {
      output[name2] = new onnxruntime_common_1$2.Tensor(tensor2.type, tensor2.data, tensor2.dims);
    });
    return output;
  }
  startProfiling() {
    this.session.startProfiling();
  }
  endProfiling() {
    this.session.endProfiling();
  }
}
sessionHandler$1.OnnxjsSessionHandler = OnnxjsSessionHandler;
Object.defineProperty(backendOnnxjs, "__esModule", { value: true });
backendOnnxjs.onnxjsBackend = void 0;
const session_1 = session;
const session_handler_1 = sessionHandler$1;
class OnnxjsBackend {
  async init() {
  }
  async createSessionHandler(pathOrBuffer, options) {
    const session2 = new session_1.Session(options);
    if (typeof pathOrBuffer === "string") {
      await session2.loadModel(pathOrBuffer);
    } else {
      await session2.loadModel(pathOrBuffer);
    }
    return new session_handler_1.OnnxjsSessionHandler(session2);
  }
}
backendOnnxjs.onnxjsBackend = new OnnxjsBackend();
var backendWasm = {};
var proxyWrapper = {};
var wasmCoreImpl = {};
var runOptions = {};
var optionsUtils = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.iterateExtraOptions = void 0;
  const iterateExtraOptions = (options, prefix, seen, handler) => {
    if (typeof options == "object" && options !== null) {
      if (seen.has(options)) {
        throw new Error("Circular reference in options");
      } else {
        seen.add(options);
      }
    }
    Object.entries(options).forEach(([key, value]) => {
      const name2 = prefix ? prefix + key : key;
      if (typeof value === "object") {
        exports.iterateExtraOptions(value, name2 + ".", seen, handler);
      } else if (typeof value === "string" || typeof value === "number") {
        handler(name2, value.toString());
      } else if (typeof value === "boolean") {
        handler(name2, value ? "1" : "0");
      } else {
        throw new Error(`Can't handle extra config type: ${typeof value}`);
      }
    });
  };
  exports.iterateExtraOptions = iterateExtraOptions;
})(optionsUtils);
var stringUtils = {};
var wasmFactory = {};
var ortWasm = { exports: {} };
(function(module, exports) {
  var ortWasm2 = (() => {
    var _scriptDir = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : void 0;
    if (typeof __filename !== "undefined")
      _scriptDir = _scriptDir || __filename;
    return function(ortWasm3) {
      ortWasm3 = ortWasm3 || {};
      var c;
      c || (c = typeof ortWasm3 !== "undefined" ? ortWasm3 : {});
      var aa = Object.assign, ba, g;
      c.ready = new Promise(function(a, b) {
        ba = a;
        g = b;
      });
      var ca = aa({}, c), r = "./this.program", da = typeof window === "object", t = typeof importScripts === "function", ea = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string", w = "", x, y, A, fs, B, C;
      if (ea)
        w = t ? require$$3$1.dirname(w) + "/" : __dirname + "/", C = () => {
          B || (fs = require$$3$1, B = require$$3$1);
        }, x = function(a, b) {
          C();
          a = B.normalize(a);
          return fs.readFileSync(a, b ? null : "utf8");
        }, A = (a) => {
          a = x(a, true);
          a.buffer || (a = new Uint8Array(a));
          return a;
        }, y = (a, b, e) => {
          C();
          a = B.normalize(a);
          fs.readFile(a, function(f, h) {
            f ? e(f) : b(h.buffer);
          });
        }, 1 < process.argv.length && (r = process.argv[1].replace(/\\/g, "/")), process.argv.slice(2), process.on("uncaughtException", function(a) {
          throw a;
        }), process.on("unhandledRejection", function(a) {
          throw a;
        }), c.inspect = function() {
          return "[Emscripten Module object]";
        };
      else if (da || t)
        t ? w = self.location.href : typeof document !== "undefined" && document.currentScript && (w = document.currentScript.src), _scriptDir && (w = _scriptDir), w.indexOf("blob:") !== 0 ? w = w.substr(0, w.replace(/[?#].*/, "").lastIndexOf("/") + 1) : w = "", x = (a) => {
          var b = new XMLHttpRequest();
          b.open("GET", a, false);
          b.send(null);
          return b.responseText;
        }, t && (A = (a) => {
          var b = new XMLHttpRequest();
          b.open("GET", a, false);
          b.responseType = "arraybuffer";
          b.send(null);
          return new Uint8Array(b.response);
        }), y = (a, b, e) => {
          var f = new XMLHttpRequest();
          f.open("GET", a, true);
          f.responseType = "arraybuffer";
          f.onload = () => {
            f.status == 200 || f.status == 0 && f.response ? b(f.response) : e();
          };
          f.onerror = e;
          f.send(null);
        };
      var fa = c.print || console.log.bind(console), D = c.printErr || console.warn.bind(console);
      aa(c, ca);
      ca = null;
      c.thisProgram && (r = c.thisProgram);
      var E;
      c.wasmBinary && (E = c.wasmBinary);
      c.noExitRuntime || false;
      typeof WebAssembly !== "object" && F("no native wasm support detected");
      var G, ha = false, ia = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : void 0;
      function ja(a, b, e) {
        var f = b + e;
        for (e = b; a[e] && !(e >= f); )
          ++e;
        if (16 < e - b && a.subarray && ia)
          return ia.decode(a.subarray(b, e));
        for (f = ""; b < e; ) {
          var h = a[b++];
          if (h & 128) {
            var k = a[b++] & 63;
            if ((h & 224) == 192)
              f += String.fromCharCode((h & 31) << 6 | k);
            else {
              var l = a[b++] & 63;
              h = (h & 240) == 224 ? (h & 15) << 12 | k << 6 | l : (h & 7) << 18 | k << 12 | l << 6 | a[b++] & 63;
              65536 > h ? f += String.fromCharCode(h) : (h -= 65536, f += String.fromCharCode(55296 | h >> 10, 56320 | h & 1023));
            }
          } else
            f += String.fromCharCode(h);
        }
        return f;
      }
      function H(a, b) {
        return a ? ja(I, a, b) : "";
      }
      function J(a, b, e, f) {
        if (!(0 < f))
          return 0;
        var h = e;
        f = e + f - 1;
        for (var k = 0; k < a.length; ++k) {
          var l = a.charCodeAt(k);
          if (55296 <= l && 57343 >= l) {
            var p = a.charCodeAt(++k);
            l = 65536 + ((l & 1023) << 10) | p & 1023;
          }
          if (127 >= l) {
            if (e >= f)
              break;
            b[e++] = l;
          } else {
            if (2047 >= l) {
              if (e + 1 >= f)
                break;
              b[e++] = 192 | l >> 6;
            } else {
              if (65535 >= l) {
                if (e + 2 >= f)
                  break;
                b[e++] = 224 | l >> 12;
              } else {
                if (e + 3 >= f)
                  break;
                b[e++] = 240 | l >> 18;
                b[e++] = 128 | l >> 12 & 63;
              }
              b[e++] = 128 | l >> 6 & 63;
            }
            b[e++] = 128 | l & 63;
          }
        }
        b[e] = 0;
        return e - h;
      }
      function K(a) {
        for (var b = 0, e = 0; e < a.length; ++e) {
          var f = a.charCodeAt(e);
          55296 <= f && 57343 >= f && (f = 65536 + ((f & 1023) << 10) | a.charCodeAt(++e) & 1023);
          127 >= f ? ++b : b = 2047 >= f ? b + 2 : 65535 >= f ? b + 3 : b + 4;
        }
        return b;
      }
      function ka(a) {
        var b = K(a) + 1, e = L(b);
        e && J(a, M, e, b);
        return e;
      }
      var la, M, I, N;
      function ma() {
        var a = G.buffer;
        la = a;
        c.HEAP8 = M = new Int8Array(a);
        c.HEAP16 = new Int16Array(a);
        c.HEAP32 = N = new Int32Array(a);
        c.HEAPU8 = I = new Uint8Array(a);
        c.HEAPU16 = new Uint16Array(a);
        c.HEAPU32 = new Uint32Array(a);
        c.HEAPF32 = new Float32Array(a);
        c.HEAPF64 = new Float64Array(a);
      }
      var na, oa = [], pa = [], qa = [];
      function ra() {
        var a = c.preRun.shift();
        oa.unshift(a);
      }
      var O = 0, Q = null;
      c.preloadedImages = {};
      c.preloadedAudios = {};
      function F(a) {
        if (c.onAbort)
          c.onAbort(a);
        a = "Aborted(" + a + ")";
        D(a);
        ha = true;
        a = new WebAssembly.RuntimeError(a + ". Build with -s ASSERTIONS=1 for more info.");
        g(a);
        throw a;
      }
      function sa() {
        return R.startsWith("data:application/octet-stream;base64,");
      }
      var R;
      R = "ort-wasm.wasm";
      if (!sa()) {
        var ta = R;
        R = c.locateFile ? c.locateFile(ta, w) : w + ta;
      }
      function ua() {
        var a = R;
        try {
          if (a == R && E)
            return new Uint8Array(E);
          if (A)
            return A(a);
          throw "both async and sync fetching of the wasm failed";
        } catch (b) {
          F(b);
        }
      }
      function va() {
        if (!E && (da || t)) {
          if (typeof fetch === "function" && !R.startsWith("file://"))
            return fetch(R, { credentials: "same-origin" }).then(function(a) {
              if (!a.ok)
                throw "failed to load wasm binary file at '" + R + "'";
              return a.arrayBuffer();
            }).catch(function() {
              return ua();
            });
          if (y)
            return new Promise(function(a, b) {
              y(R, function(e) {
                a(new Uint8Array(e));
              }, b);
            });
        }
        return Promise.resolve().then(function() {
          return ua();
        });
      }
      function S(a) {
        for (; 0 < a.length; ) {
          var b = a.shift();
          if (typeof b == "function")
            b(c);
          else {
            var e = b.Na;
            typeof e === "number" ? b.va === void 0 ? wa(e)() : wa(e)(b.va) : e(b.va === void 0 ? null : b.va);
          }
        }
      }
      var T = [];
      function wa(a) {
        var b = T[a];
        b || (a >= T.length && (T.length = a + 1), T[a] = b = na.get(a));
        return b;
      }
      function xa(a) {
        this.qa = a - 16;
        this.Fa = function(b) {
          N[this.qa + 4 >> 2] = b;
        };
        this.Ca = function(b) {
          N[this.qa + 8 >> 2] = b;
        };
        this.Da = function() {
          N[this.qa >> 2] = 0;
        };
        this.Ba = function() {
          M[this.qa + 12 >> 0] = 0;
        };
        this.Ea = function() {
          M[this.qa + 13 >> 0] = 0;
        };
        this.ya = function(b, e) {
          this.Fa(b);
          this.Ca(e);
          this.Da();
          this.Ba();
          this.Ea();
        };
      }
      var za = {}, Aa = [null, [], []], U = {};
      function Ba(a, b, e) {
        function f(v) {
          return (v = v.toTimeString().match(/\(([A-Za-z ]+)\)$/)) ? v[1] : "GMT";
        }
        var h = new Date().getFullYear(), k = new Date(h, 0, 1), l = new Date(h, 6, 1);
        h = k.getTimezoneOffset();
        var p = l.getTimezoneOffset();
        N[a >> 2] = 60 * Math.max(h, p);
        N[b >> 2] = Number(h != p);
        a = f(k);
        b = f(l);
        a = ka(a);
        b = ka(b);
        p < h ? (N[e >> 2] = a, N[e + 4 >> 2] = b) : (N[e >> 2] = b, N[e + 4 >> 2] = a);
      }
      function Ca(a, b, e) {
        Ca.xa || (Ca.xa = true, Ba(a, b, e));
      }
      var Ga;
      Ga = ea ? () => {
        var a = process.hrtime();
        return 1e3 * a[0] + a[1] / 1e6;
      } : () => performance.now();
      var Ha = {};
      function Ia() {
        if (!Ja) {
          var a = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8", _: r || "./this.program" }, b;
          for (b in Ha)
            Ha[b] === void 0 ? delete a[b] : a[b] = Ha[b];
          var e = [];
          for (b in a)
            e.push(b + "=" + a[b]);
          Ja = e;
        }
        return Ja;
      }
      var Ja;
      function V(a) {
        return a % 4 === 0 && (a % 100 !== 0 || a % 400 === 0);
      }
      function Ka(a, b) {
        for (var e = 0, f = 0; f <= b; e += a[f++])
          ;
        return e;
      }
      var W = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], X = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      function Y(a, b) {
        for (a = new Date(a.getTime()); 0 < b; ) {
          var e = a.getMonth(), f = (V(a.getFullYear()) ? W : X)[e];
          if (b > f - a.getDate())
            b -= f - a.getDate() + 1, a.setDate(1), 11 > e ? a.setMonth(e + 1) : (a.setMonth(0), a.setFullYear(a.getFullYear() + 1));
          else {
            a.setDate(a.getDate() + b);
            break;
          }
        }
        return a;
      }
      function La(a, b, e, f) {
        function h(d, m, n) {
          for (d = typeof d === "number" ? d.toString() : d || ""; d.length < m; )
            d = n[0] + d;
          return d;
        }
        function k(d, m) {
          return h(d, m, "0");
        }
        function l(d, m) {
          function n(Da) {
            return 0 > Da ? -1 : 0 < Da ? 1 : 0;
          }
          var z;
          (z = n(d.getFullYear() - m.getFullYear())) === 0 && (z = n(d.getMonth() - m.getMonth())) === 0 && (z = n(d.getDate() - m.getDate()));
          return z;
        }
        function p(d) {
          switch (d.getDay()) {
            case 0:
              return new Date(d.getFullYear() - 1, 11, 29);
            case 1:
              return d;
            case 2:
              return new Date(d.getFullYear(), 0, 3);
            case 3:
              return new Date(d.getFullYear(), 0, 2);
            case 4:
              return new Date(d.getFullYear(), 0, 1);
            case 5:
              return new Date(d.getFullYear() - 1, 11, 31);
            case 6:
              return new Date(d.getFullYear() - 1, 11, 30);
          }
        }
        function v(d) {
          d = Y(new Date(d.oa + 1900, 0, 1), d.ua);
          var m = new Date(d.getFullYear() + 1, 0, 4), n = p(new Date(d.getFullYear(), 0, 4));
          m = p(m);
          return 0 >= l(n, d) ? 0 >= l(m, d) ? d.getFullYear() + 1 : d.getFullYear() : d.getFullYear() - 1;
        }
        var u = N[f + 40 >> 2];
        f = { Ia: N[f >> 2], Ha: N[f + 4 >> 2], sa: N[f + 8 >> 2], ra: N[f + 12 >> 2], pa: N[f + 16 >> 2], oa: N[f + 20 >> 2], ta: N[f + 24 >> 2], ua: N[f + 28 >> 2], Qa: N[f + 32 >> 2], Ga: N[f + 36 >> 2], Ja: u ? H(u) : "" };
        e = H(e);
        u = { "%c": "%a %b %d %H:%M:%S %Y", "%D": "%m/%d/%y", "%F": "%Y-%m-%d", "%h": "%b", "%r": "%I:%M:%S %p", "%R": "%H:%M", "%T": "%H:%M:%S", "%x": "%m/%d/%y", "%X": "%H:%M:%S", "%Ec": "%c", "%EC": "%C", "%Ex": "%m/%d/%y", "%EX": "%H:%M:%S", "%Ey": "%y", "%EY": "%Y", "%Od": "%d", "%Oe": "%e", "%OH": "%H", "%OI": "%I", "%Om": "%m", "%OM": "%M", "%OS": "%S", "%Ou": "%u", "%OU": "%U", "%OV": "%V", "%Ow": "%w", "%OW": "%W", "%Oy": "%y" };
        for (var q in u)
          e = e.replace(new RegExp(q, "g"), u[q]);
        var Ea = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "), Fa = "January February March April May June July August September October November December".split(" ");
        u = { "%a": function(d) {
          return Ea[d.ta].substring(0, 3);
        }, "%A": function(d) {
          return Ea[d.ta];
        }, "%b": function(d) {
          return Fa[d.pa].substring(0, 3);
        }, "%B": function(d) {
          return Fa[d.pa];
        }, "%C": function(d) {
          return k((d.oa + 1900) / 100 | 0, 2);
        }, "%d": function(d) {
          return k(d.ra, 2);
        }, "%e": function(d) {
          return h(d.ra, 2, " ");
        }, "%g": function(d) {
          return v(d).toString().substring(2);
        }, "%G": function(d) {
          return v(d);
        }, "%H": function(d) {
          return k(d.sa, 2);
        }, "%I": function(d) {
          d = d.sa;
          d == 0 ? d = 12 : 12 < d && (d -= 12);
          return k(d, 2);
        }, "%j": function(d) {
          return k(d.ra + Ka(V(d.oa + 1900) ? W : X, d.pa - 1), 3);
        }, "%m": function(d) {
          return k(d.pa + 1, 2);
        }, "%M": function(d) {
          return k(d.Ha, 2);
        }, "%n": function() {
          return "\n";
        }, "%p": function(d) {
          return 0 <= d.sa && 12 > d.sa ? "AM" : "PM";
        }, "%S": function(d) {
          return k(d.Ia, 2);
        }, "%t": function() {
          return "	";
        }, "%u": function(d) {
          return d.ta || 7;
        }, "%U": function(d) {
          var m = new Date(d.oa + 1900, 0, 1), n = m.getDay() === 0 ? m : Y(m, 7 - m.getDay());
          d = new Date(d.oa + 1900, d.pa, d.ra);
          return 0 > l(n, d) ? k(Math.ceil((31 - n.getDate() + (Ka(V(d.getFullYear()) ? W : X, d.getMonth() - 1) - 31) + d.getDate()) / 7), 2) : l(n, m) === 0 ? "01" : "00";
        }, "%V": function(d) {
          var m = new Date(d.oa + 1901, 0, 4), n = p(new Date(d.oa + 1900, 0, 4));
          m = p(m);
          var z = Y(new Date(d.oa + 1900, 0, 1), d.ua);
          return 0 > l(z, n) ? "53" : 0 >= l(m, z) ? "01" : k(Math.ceil((n.getFullYear() < d.oa + 1900 ? d.ua + 32 - n.getDate() : d.ua + 1 - n.getDate()) / 7), 2);
        }, "%w": function(d) {
          return d.ta;
        }, "%W": function(d) {
          var m = new Date(d.oa, 0, 1), n = m.getDay() === 1 ? m : Y(m, m.getDay() === 0 ? 1 : 7 - m.getDay() + 1);
          d = new Date(d.oa + 1900, d.pa, d.ra);
          return 0 > l(n, d) ? k(Math.ceil((31 - n.getDate() + (Ka(V(d.getFullYear()) ? W : X, d.getMonth() - 1) - 31) + d.getDate()) / 7), 2) : l(n, m) === 0 ? "01" : "00";
        }, "%y": function(d) {
          return (d.oa + 1900).toString().substring(2);
        }, "%Y": function(d) {
          return d.oa + 1900;
        }, "%z": function(d) {
          d = d.Ga;
          var m = 0 <= d;
          d = Math.abs(d) / 60;
          return (m ? "+" : "-") + String("0000" + (d / 60 * 100 + d % 60)).slice(-4);
        }, "%Z": function(d) {
          return d.Ja;
        }, "%%": function() {
          return "%";
        } };
        for (q in u)
          e.includes(q) && (e = e.replace(new RegExp(q, "g"), u[q](f)));
        q = Ma(e);
        if (q.length > b)
          return 0;
        M.set(q, a);
        return q.length - 1;
      }
      function Ma(a) {
        var b = Array(K(a) + 1);
        J(a, b, 0, b.length);
        return b;
      }
      var Qa = {
        a: function(a) {
          return L(a + 16) + 16;
        },
        b: function(a, b, e) {
          new xa(a).ya(b, e);
          throw a;
        },
        g: function() {
          return 0;
        },
        I: function() {
        },
        F: function() {
        },
        v: function() {
        },
        y: function() {
        },
        r: function() {
          return 0;
        },
        G: function() {
        },
        B: function(a, b) {
          a = H(a);
          return U.Ka(a, b);
        },
        A: function(a, b, e, f, h, k) {
          k <<= 12;
          if ((f & 16) !== 0 && a % 65536 !== 0)
            b = -28;
          else if ((f & 32) !== 0) {
            a = 65536 * Math.ceil(b / 65536);
            var l = Na(65536, a);
            l ? (I.fill(0, l, l + a), a = l) : a = 0;
            a ? (za[a] = { Aa: a, za: b, wa: true, fd: h, Pa: e, flags: f, offset: k }, b = a) : b = -48;
          } else
            b = -52;
          return b;
        },
        z: function(a, b) {
          var e = za[a];
          b !== 0 && e ? (b === e.za && (za[a] = null, e.wa && Oa(e.Aa)), a = 0) : a = -28;
          return a;
        },
        k: function() {
        },
        x: function(a, b, e) {
          a = H(a);
          return U.La(a, b, e);
        },
        t: function() {
        },
        H: function() {
        },
        u: function() {
        },
        h: function() {
          F("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking");
        },
        n: function() {
          F("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking");
        },
        J: function(a, b) {
          a = new Date(1e3 * N[a >> 2]);
          N[b >> 2] = a.getUTCSeconds();
          N[b + 4 >> 2] = a.getUTCMinutes();
          N[b + 8 >> 2] = a.getUTCHours();
          N[b + 12 >> 2] = a.getUTCDate();
          N[b + 16 >> 2] = a.getUTCMonth();
          N[b + 20 >> 2] = a.getUTCFullYear() - 1900;
          N[b + 24 >> 2] = a.getUTCDay();
          N[b + 28 >> 2] = (a.getTime() - Date.UTC(a.getUTCFullYear(), 0, 1, 0, 0, 0, 0)) / 864e5 | 0;
        },
        K: function(a, b) {
          a = new Date(1e3 * N[a >> 2]);
          N[b >> 2] = a.getSeconds();
          N[b + 4 >> 2] = a.getMinutes();
          N[b + 8 >> 2] = a.getHours();
          N[b + 12 >> 2] = a.getDate();
          N[b + 16 >> 2] = a.getMonth();
          N[b + 20 >> 2] = a.getFullYear() - 1900;
          N[b + 24 >> 2] = a.getDay();
          var e = new Date(a.getFullYear(), 0, 1);
          N[b + 28 >> 2] = (a.getTime() - e.getTime()) / 864e5 | 0;
          N[b + 36 >> 2] = -(60 * a.getTimezoneOffset());
          var f = new Date(a.getFullYear(), 6, 1).getTimezoneOffset();
          e = e.getTimezoneOffset();
          N[b + 32 >> 2] = (f != e && a.getTimezoneOffset() == Math.min(e, f)) | 0;
        },
        L: function(a) {
          var b = new Date(N[a + 20 >> 2] + 1900, N[a + 16 >> 2], N[a + 12 >> 2], N[a + 8 >> 2], N[a + 4 >> 2], N[a >> 2], 0), e = N[a + 32 >> 2], f = b.getTimezoneOffset(), h = new Date(b.getFullYear(), 0, 1), k = new Date(b.getFullYear(), 6, 1).getTimezoneOffset(), l = h.getTimezoneOffset(), p = Math.min(l, k);
          0 > e ? N[a + 32 >> 2] = Number(k != l && p == f) : 0 < e != (p == f) && (k = Math.max(l, k), b.setTime(b.getTime() + 6e4 * ((0 < e ? p : k) - f)));
          N[a + 24 >> 2] = b.getDay();
          N[a + 28 >> 2] = (b.getTime() - h.getTime()) / 864e5 | 0;
          N[a >> 2] = b.getSeconds();
          N[a + 4 >> 2] = b.getMinutes();
          N[a + 8 >> 2] = b.getHours();
          N[a + 12 >> 2] = b.getDate();
          N[a + 16 >> 2] = b.getMonth();
          return b.getTime() / 1e3 | 0;
        },
        M: Ca,
        d: function() {
          F("");
        },
        m: function(a, b) {
          if (a === 0)
            a = Date.now();
          else if (a === 1 || a === 4)
            a = Ga();
          else
            return N[Pa() >> 2] = 28, -1;
          N[b >> 2] = a / 1e3 | 0;
          N[b + 4 >> 2] = a % 1e3 * 1e6 | 0;
          return 0;
        },
        p: function(a, b) {
          return a - b;
        },
        s: function() {
          return 2147483648;
        },
        l: Ga,
        E: function(a, b, e) {
          I.copyWithin(a, b, b + e);
        },
        f: function(a) {
          var b = I.length;
          a >>>= 0;
          if (2147483648 < a)
            return false;
          for (var e = 1; 4 >= e; e *= 2) {
            var f = b * (1 + 0.2 / e);
            f = Math.min(f, a + 100663296);
            f = Math.max(a, f);
            0 < f % 65536 && (f += 65536 - f % 65536);
            a: {
              try {
                G.grow(Math.min(2147483648, f) - la.byteLength + 65535 >>> 16);
                ma();
                var h = 1;
                break a;
              } catch (k) {
              }
              h = void 0;
            }
            if (h)
              return true;
          }
          return false;
        },
        C: function(a, b) {
          var e = 0;
          Ia().forEach(function(f, h) {
            var k = b + e;
            h = N[a + 4 * h >> 2] = k;
            for (k = 0; k < f.length; ++k)
              M[h++ >> 0] = f.charCodeAt(k);
            M[h >> 0] = 0;
            e += f.length + 1;
          });
          return 0;
        },
        D: function(a, b) {
          var e = Ia();
          N[a >> 2] = e.length;
          var f = 0;
          e.forEach(function(h) {
            f += h.length + 1;
          });
          N[b >> 2] = f;
          return 0;
        },
        e: function() {
          return 0;
        },
        j: function(a, b, e, f) {
          a = U.Oa(a);
          b = U.Ma(a, b, e);
          N[f >> 2] = b;
          return 0;
        },
        q: function() {
        },
        i: function(a, b, e, f) {
          for (var h = 0, k = 0; k < e; k++) {
            var l = N[b >> 2], p = N[b + 4 >> 2];
            b += 8;
            for (var v = 0; v < p; v++) {
              var u = I[l + v], q = Aa[a];
              u === 0 || u === 10 ? ((a === 1 ? fa : D)(ja(q, 0)), q.length = 0) : q.push(u);
            }
            h += p;
          }
          N[f >> 2] = h;
          return 0;
        },
        w: function(a) {
          var b = Date.now();
          N[a >> 2] = b / 1e3 | 0;
          N[a + 4 >> 2] = b % 1e3 * 1e3 | 0;
          return 0;
        },
        o: La,
        c: function(a, b, e, f) {
          return La(a, b, e, f);
        }
      };
      (function() {
        function a(h) {
          c.asm = h.exports;
          G = c.asm.N;
          ma();
          na = c.asm.ja;
          pa.unshift(c.asm.O);
          O--;
          c.monitorRunDependencies && c.monitorRunDependencies(O);
          O == 0 && (Q && (h = Q, Q = null, h()));
        }
        function b(h) {
          a(h.instance);
        }
        function e(h) {
          return va().then(function(k) {
            return WebAssembly.instantiate(k, f);
          }).then(function(k) {
            return k;
          }).then(h, function(k) {
            D("failed to asynchronously prepare wasm: " + k);
            F(k);
          });
        }
        var f = { a: Qa };
        O++;
        c.monitorRunDependencies && c.monitorRunDependencies(O);
        if (c.instantiateWasm)
          try {
            return c.instantiateWasm(f, a);
          } catch (h) {
            return D("Module.instantiateWasm callback failed with error: " + h), false;
          }
        (function() {
          return E || typeof WebAssembly.instantiateStreaming !== "function" || sa() || R.startsWith("file://") || typeof fetch !== "function" ? e(b) : fetch(R, { credentials: "same-origin" }).then(function(h) {
            return WebAssembly.instantiateStreaming(h, f).then(b, function(k) {
              D("wasm streaming compile failed: " + k);
              D("falling back to ArrayBuffer instantiation");
              return e(b);
            });
          });
        })().catch(g);
        return {};
      })();
      c.___wasm_call_ctors = function() {
        return (c.___wasm_call_ctors = c.asm.O).apply(null, arguments);
      };
      c._OrtInit = function() {
        return (c._OrtInit = c.asm.P).apply(null, arguments);
      };
      c._OrtCreateSessionOptions = function() {
        return (c._OrtCreateSessionOptions = c.asm.Q).apply(null, arguments);
      };
      c._OrtAddSessionConfigEntry = function() {
        return (c._OrtAddSessionConfigEntry = c.asm.R).apply(null, arguments);
      };
      c._OrtReleaseSessionOptions = function() {
        return (c._OrtReleaseSessionOptions = c.asm.S).apply(null, arguments);
      };
      c._OrtCreateSession = function() {
        return (c._OrtCreateSession = c.asm.T).apply(null, arguments);
      };
      c._OrtReleaseSession = function() {
        return (c._OrtReleaseSession = c.asm.U).apply(null, arguments);
      };
      c._OrtGetInputCount = function() {
        return (c._OrtGetInputCount = c.asm.V).apply(null, arguments);
      };
      c._OrtGetOutputCount = function() {
        return (c._OrtGetOutputCount = c.asm.W).apply(null, arguments);
      };
      c._OrtGetInputName = function() {
        return (c._OrtGetInputName = c.asm.X).apply(null, arguments);
      };
      c._OrtGetOutputName = function() {
        return (c._OrtGetOutputName = c.asm.Y).apply(null, arguments);
      };
      c._OrtFree = function() {
        return (c._OrtFree = c.asm.Z).apply(null, arguments);
      };
      c._OrtCreateTensor = function() {
        return (c._OrtCreateTensor = c.asm._).apply(null, arguments);
      };
      c._OrtGetTensorData = function() {
        return (c._OrtGetTensorData = c.asm.$).apply(null, arguments);
      };
      c._OrtReleaseTensor = function() {
        return (c._OrtReleaseTensor = c.asm.aa).apply(null, arguments);
      };
      c._OrtCreateRunOptions = function() {
        return (c._OrtCreateRunOptions = c.asm.ba).apply(null, arguments);
      };
      c._OrtAddRunConfigEntry = function() {
        return (c._OrtAddRunConfigEntry = c.asm.ca).apply(null, arguments);
      };
      c._OrtReleaseRunOptions = function() {
        return (c._OrtReleaseRunOptions = c.asm.da).apply(null, arguments);
      };
      c._OrtRun = function() {
        return (c._OrtRun = c.asm.ea).apply(null, arguments);
      };
      c._OrtEndProfiling = function() {
        return (c._OrtEndProfiling = c.asm.fa).apply(null, arguments);
      };
      var Pa = c.___errno_location = function() {
        return (Pa = c.___errno_location = c.asm.ga).apply(null, arguments);
      }, L = c._malloc = function() {
        return (L = c._malloc = c.asm.ha).apply(null, arguments);
      }, Oa = c._free = function() {
        return (Oa = c._free = c.asm.ia).apply(null, arguments);
      }, Na = c._memalign = function() {
        return (Na = c._memalign = c.asm.ka).apply(null, arguments);
      }, Ra = c.stackSave = function() {
        return (Ra = c.stackSave = c.asm.la).apply(null, arguments);
      }, Sa = c.stackRestore = function() {
        return (Sa = c.stackRestore = c.asm.ma).apply(null, arguments);
      }, Ta = c.stackAlloc = function() {
        return (Ta = c.stackAlloc = c.asm.na).apply(null, arguments);
      };
      c.UTF8ToString = H;
      c.stringToUTF8 = function(a, b, e) {
        return J(a, I, b, e);
      };
      c.lengthBytesUTF8 = K;
      c.stackSave = Ra;
      c.stackRestore = Sa;
      c.stackAlloc = Ta;
      var Z;
      Q = function Ua() {
        Z || Va();
        Z || (Q = Ua);
      };
      function Va() {
        function a() {
          if (!Z && (Z = true, c.calledRun = true, !ha)) {
            S(pa);
            ba(c);
            if (c.onRuntimeInitialized)
              c.onRuntimeInitialized();
            if (c.postRun)
              for (typeof c.postRun == "function" && (c.postRun = [c.postRun]); c.postRun.length; ) {
                var b = c.postRun.shift();
                qa.unshift(b);
              }
            S(qa);
          }
        }
        if (!(0 < O)) {
          if (c.preRun)
            for (typeof c.preRun == "function" && (c.preRun = [c.preRun]); c.preRun.length; )
              ra();
          S(oa);
          0 < O || (c.setStatus ? (c.setStatus("Running..."), setTimeout(function() {
            setTimeout(function() {
              c.setStatus("");
            }, 1);
            a();
          }, 1)) : a());
        }
      }
      c.run = Va;
      if (c.preInit)
        for (typeof c.preInit == "function" && (c.preInit = [c.preInit]); 0 < c.preInit.length; )
          c.preInit.pop()();
      Va();
      return ortWasm3.ready;
    };
  })();
  module.exports = ortWasm2;
})(ortWasm);
var ortWasmThreaded$1 = { exports: {} };
(function(module, exports) {
  var ortWasmThreaded2 = (() => {
    var _scriptDir = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : void 0;
    if (typeof __filename !== "undefined")
      _scriptDir = _scriptDir || __filename;
    return function(ortWasmThreaded3) {
      ortWasmThreaded3 = ortWasmThreaded3 || {};
      function d() {
        g.buffer != m && n(g.buffer);
        return aa;
      }
      function q() {
        g.buffer != m && n(g.buffer);
        return ba;
      }
      function t() {
        g.buffer != m && n(g.buffer);
        return ca;
      }
      function da() {
        g.buffer != m && n(g.buffer);
        return ea;
      }
      var v;
      v || (v = typeof ortWasmThreaded3 !== "undefined" ? ortWasmThreaded3 : {});
      var fa = Object.assign, ha, ia;
      v.ready = new Promise(function(a, b) {
        ha = a;
        ia = b;
      });
      var ja = fa({}, v), ka = "./this.program", w = (a, b) => {
        throw b;
      }, la = typeof window === "object", x = typeof importScripts === "function", z = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string", B = v.ENVIRONMENT_IS_PTHREAD || false, D = "";
      function ma(a) {
        return v.locateFile ? v.locateFile(a, D) : D + a;
      }
      var na, E, F, fs, H, I;
      if (z) {
        D = x ? require$$3$1.dirname(D) + "/" : __dirname + "/";
        I = () => {
          H || (fs = require$$3$1, H = require$$3$1);
        };
        na = function(b, c) {
          I();
          b = H.normalize(b);
          return fs.readFileSync(b, c ? null : "utf8");
        };
        F = (b) => {
          b = na(b, true);
          b.buffer || (b = new Uint8Array(b));
          return b;
        };
        E = (b, c, e) => {
          I();
          b = H.normalize(b);
          fs.readFile(b, function(h, k) {
            h ? e(h) : c(k.buffer);
          });
        };
        1 < process.argv.length && (ka = process.argv[1].replace(/\\/g, "/"));
        process.argv.slice(2);
        process.on("uncaughtException", function(b) {
          if (!(b instanceof J))
            throw b;
        });
        process.on("unhandledRejection", function(b) {
          throw b;
        });
        w = (b, c) => {
          if (K())
            throw process.exitCode = b, c;
          c instanceof J || L("exiting due to exception: " + c);
          process.exit(b);
        };
        v.inspect = function() {
          return "[Emscripten Module object]";
        };
        let a;
        try {
          a = require("worker_threads");
        } catch (b) {
          throw console.error('The "worker_threads" module is not supported in this node.js build - perhaps a newer version is needed?'), b;
        }
        commonjsGlobal.Worker = a.Worker;
      } else if (la || x)
        x ? D = self.location.href : typeof document !== "undefined" && document.currentScript && (D = document.currentScript.src), _scriptDir && (D = _scriptDir), D.indexOf("blob:") !== 0 ? D = D.substr(0, D.replace(/[?#].*/, "").lastIndexOf("/") + 1) : D = "", z || (na = (a) => {
          var b = new XMLHttpRequest();
          b.open("GET", a, false);
          b.send(null);
          return b.responseText;
        }, x && (F = (a) => {
          var b = new XMLHttpRequest();
          b.open("GET", a, false);
          b.responseType = "arraybuffer";
          b.send(null);
          return new Uint8Array(b.response);
        }), E = (a, b, c) => {
          var e = new XMLHttpRequest();
          e.open("GET", a, true);
          e.responseType = "arraybuffer";
          e.onload = () => {
            e.status == 200 || e.status == 0 && e.response ? b(e.response) : c();
          };
          e.onerror = c;
          e.send(null);
        });
      z && typeof performance === "undefined" && (commonjsGlobal.performance = require$$3$1.performance);
      var oa = console.log.bind(console), pa = console.warn.bind(console);
      z && (I(), oa = (a) => fs.writeSync(1, a + "\n"), pa = (a) => fs.writeSync(2, a + "\n"));
      var qa = v.print || oa, L = v.printErr || pa;
      fa(v, ja);
      ja = null;
      v.thisProgram && (ka = v.thisProgram);
      v.quit && (w = v.quit);
      var M, N;
      v.wasmBinary && (N = v.wasmBinary);
      var noExitRuntime = v.noExitRuntime || false;
      typeof WebAssembly !== "object" && O("no native wasm support detected");
      var g, ra, sa = false;
      function ta(a) {
        var b = new TextDecoder(a);
        this.decode = (c) => {
          c.buffer instanceof SharedArrayBuffer && (c = new Uint8Array(c));
          return b.decode.call(b, c);
        };
      }
      var ua = typeof TextDecoder !== "undefined" ? new ta("utf8") : void 0;
      function va(a, b, c) {
        var e = b + c;
        for (c = b; a[c] && !(c >= e); )
          ++c;
        if (16 < c - b && a.subarray && ua)
          return ua.decode(a.subarray(b, c));
        for (e = ""; b < c; ) {
          var h = a[b++];
          if (h & 128) {
            var k = a[b++] & 63;
            if ((h & 224) == 192)
              e += String.fromCharCode((h & 31) << 6 | k);
            else {
              var l = a[b++] & 63;
              h = (h & 240) == 224 ? (h & 15) << 12 | k << 6 | l : (h & 7) << 18 | k << 12 | l << 6 | a[b++] & 63;
              65536 > h ? e += String.fromCharCode(h) : (h -= 65536, e += String.fromCharCode(55296 | h >> 10, 56320 | h & 1023));
            }
          } else
            e += String.fromCharCode(h);
        }
        return e;
      }
      function P(a, b) {
        return a ? va(q(), a, b) : "";
      }
      function wa(a, b, c, e) {
        if (!(0 < e))
          return 0;
        var h = c;
        e = c + e - 1;
        for (var k = 0; k < a.length; ++k) {
          var l = a.charCodeAt(k);
          if (55296 <= l && 57343 >= l) {
            var u = a.charCodeAt(++k);
            l = 65536 + ((l & 1023) << 10) | u & 1023;
          }
          if (127 >= l) {
            if (c >= e)
              break;
            b[c++] = l;
          } else {
            if (2047 >= l) {
              if (c + 1 >= e)
                break;
              b[c++] = 192 | l >> 6;
            } else {
              if (65535 >= l) {
                if (c + 2 >= e)
                  break;
                b[c++] = 224 | l >> 12;
              } else {
                if (c + 3 >= e)
                  break;
                b[c++] = 240 | l >> 18;
                b[c++] = 128 | l >> 12 & 63;
              }
              b[c++] = 128 | l >> 6 & 63;
            }
            b[c++] = 128 | l & 63;
          }
        }
        b[c] = 0;
        return c - h;
      }
      function xa(a, b, c) {
        return wa(a, q(), b, c);
      }
      function Q(a) {
        for (var b = 0, c = 0; c < a.length; ++c) {
          var e = a.charCodeAt(c);
          55296 <= e && 57343 >= e && (e = 65536 + ((e & 1023) << 10) | a.charCodeAt(++c) & 1023);
          127 >= e ? ++b : b = 2047 >= e ? b + 2 : 65535 >= e ? b + 3 : b + 4;
        }
        return b;
      }
      typeof TextDecoder !== "undefined" && new ta("utf-16le");
      function ya(a) {
        var b = Q(a) + 1, c = R(b);
        c && wa(a, d(), c, b);
        return c;
      }
      function za(a, b) {
        d().set(a, b);
      }
      var m, aa, ba, ca, ea;
      B && (m = v.buffer);
      function n(a) {
        m = a;
        v.HEAP8 = aa = new Int8Array(a);
        v.HEAP16 = new Int16Array(a);
        v.HEAP32 = ca = new Int32Array(a);
        v.HEAPU8 = ba = new Uint8Array(a);
        v.HEAPU16 = new Uint16Array(a);
        v.HEAPU32 = new Uint32Array(a);
        v.HEAPF32 = new Float32Array(a);
        v.HEAPF64 = ea = new Float64Array(a);
      }
      var Aa = v.INITIAL_MEMORY || 16777216;
      if (B)
        g = v.wasmMemory, m = v.buffer;
      else if (v.wasmMemory)
        g = v.wasmMemory;
      else if (g = new WebAssembly.Memory({ initial: Aa / 65536, maximum: 32768, shared: true }), !(g.buffer instanceof SharedArrayBuffer))
        throw L("requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag"), z && console.log("(on node you may need: --experimental-wasm-threads --experimental-wasm-bulk-memory and also use a recent version)"), Error("bad memory");
      g && (m = g.buffer);
      Aa = m.byteLength;
      n(m);
      var Ba, Ca = [], Da = [], Ea = [], Fa = [], Ga = 0;
      function K() {
        return noExitRuntime || 0 < Ga;
      }
      function Ha() {
        var a = v.preRun.shift();
        Ca.unshift(a);
      }
      var S = 0, T = null;
      v.preloadedImages = {};
      v.preloadedAudios = {};
      function O(a) {
        if (B)
          postMessage({ cmd: "onAbort", arg: a });
        else if (v.onAbort)
          v.onAbort(a);
        a = "Aborted(" + a + ")";
        L(a);
        sa = true;
        a = new WebAssembly.RuntimeError(a + ". Build with -s ASSERTIONS=1 for more info.");
        ia(a);
        throw a;
      }
      function Ja() {
        return U.startsWith("data:application/octet-stream;base64,");
      }
      var U;
      U = "ort-wasm-threaded.wasm";
      Ja() || (U = ma(U));
      function Ka() {
        var a = U;
        try {
          if (a == U && N)
            return new Uint8Array(N);
          if (F)
            return F(a);
          throw "both async and sync fetching of the wasm failed";
        } catch (b) {
          O(b);
        }
      }
      function La() {
        if (!N && (la || x)) {
          if (typeof fetch === "function" && !U.startsWith("file://"))
            return fetch(U, { credentials: "same-origin" }).then(function(a) {
              if (!a.ok)
                throw "failed to load wasm binary file at '" + U + "'";
              return a.arrayBuffer();
            }).catch(function() {
              return Ka();
            });
          if (E)
            return new Promise(function(a, b) {
              E(U, function(c) {
                a(new Uint8Array(c));
              }, b);
            });
        }
        return Promise.resolve().then(function() {
          return Ka();
        });
      }
      var Ma = {};
      function V(a) {
        for (; 0 < a.length; ) {
          var b = a.shift();
          if (typeof b == "function")
            b(v);
          else {
            var c = b.Tb;
            typeof c === "number" ? b.Sa === void 0 ? Na(c)() : Na(c)(b.Sa) : c(b.Sa === void 0 ? null : b.Sa);
          }
        }
      }
      function Oa(a) {
        var b = Pa();
        a = a();
        W(b);
        return a;
      }
      function Qa(a) {
        var b = X.Oa[a];
        b && (t()[a >> 2] = 0, X.jb(b.worker));
      }
      var X = {
        Pa: [],
        Va: [],
        fb: [],
        Wb: function() {
        },
        ub: function() {
          X.receiveObjectTransfer = X.zb;
          X.threadInit = X.lb;
          X.setExitStatus = X.Bb;
        },
        Oa: {},
        Bb: function() {
        },
        kb: function() {
          for (var a in X.Oa) {
            var b = X.Oa[a];
            b && b.worker && X.jb(b.worker);
          }
          for (a = 0; a < X.Pa.length; ++a)
            X.Pa[a].terminate();
          X.Pa = [];
        },
        jb: function(a) {
          X.Ab(function() {
            delete X.Oa[a.Qa.eb];
            X.Pa.push(a);
            X.Va.splice(X.Va.indexOf(a), 1);
            Ra(a.Qa.eb);
            a.Qa = void 0;
          });
        },
        Ab: function(a) {
          t()[Sa >> 2] = 0;
          try {
            a();
          } finally {
            t()[Sa >> 2] = 1;
          }
        },
        zb: function() {
        },
        lb: function() {
          for (var a in X.fb)
            X.fb[a]();
        },
        wb: function(a, b) {
          a.onmessage = (c) => {
            c = c.data;
            var e = c.cmd;
            a.Qa && (X.pb = a.Qa.eb);
            if (c.targetThread && c.targetThread != Y()) {
              var h = X.Oa[c.bc];
              h ? h.worker.postMessage(c, c.transferList) : L('Internal error! Worker sent a message "' + e + '" to target pthread ' + c.targetThread + ", but that thread no longer exists!");
            } else if (e === "processQueuedMainThreadWork")
              Ta();
            else if (e === "spawnThread")
              Ua(c);
            else if (e === "cleanupThread")
              Qa(c.thread);
            else if (e === "killThread")
              c = c.thread, t()[c >> 2] = 0, e = X.Oa[c], delete X.Oa[c], e.worker.terminate(), Ra(c), X.Va.splice(X.Va.indexOf(e.worker), 1), e.worker.Qa = void 0;
            else if (e === "cancelThread")
              X.Oa[c.thread].worker.postMessage({ cmd: "cancel" });
            else if (e === "loaded")
              a.loaded = true, b && b(a), a.Ua && (a.Ua(), delete a.Ua);
            else if (e === "print")
              qa("Thread " + c.threadId + ": " + c.text);
            else if (e === "printErr")
              L("Thread " + c.threadId + ": " + c.text);
            else if (e === "alert")
              alert("Thread " + c.threadId + ": " + c.text);
            else if (c.target === "setimmediate")
              a.postMessage(c);
            else if (e === "onAbort") {
              if (v.onAbort)
                v.onAbort(c.arg);
            } else
              L("worker sent an unknown command " + e);
            X.pb = void 0;
          };
          a.onerror = (c) => {
            L("worker sent an error! " + c.filename + ":" + c.lineno + ": " + c.message);
            throw c;
          };
          z && (a.on("message", function(c) {
            a.onmessage({ data: c });
          }), a.on("error", function(c) {
            a.onerror(c);
          }), a.on("detachedExit", function() {
          }));
          a.postMessage({ cmd: "load", urlOrBlob: v.mainScriptUrlOrBlob || _scriptDir, wasmMemory: g, wasmModule: ra });
        },
        mb: function() {
          var a = ma("ort-wasm-threaded.worker.js");
          X.Pa.push(new Worker(a));
        },
        rb: function() {
          X.Pa.length == 0 && (X.mb(), X.wb(X.Pa[0]));
          return X.Pa.pop();
        }
      };
      v.establishStackSpace = function() {
        var a = Y(), b = t()[a + 44 >> 2];
        a = t()[a + 48 >> 2];
        Va(b, b - a);
        W(b);
      };
      function Wa(a) {
        if (B)
          return Z(1, 0, a);
        try {
          Xa(a);
        } catch (b) {
          b instanceof J || b == "unwind" || w(1, b);
        }
      }
      var Ya = [];
      function Na(a) {
        var b = Ya[a];
        b || (a >= Ya.length && (Ya.length = a + 1), Ya[a] = b = Ba.get(a));
        return b;
      }
      v.invokeEntryPoint = function(a, b) {
        return Na(a)(b);
      };
      var Za;
      Za = z ? () => {
        var a = process.hrtime();
        return 1e3 * a[0] + a[1] / 1e6;
      } : B ? () => performance.now() - v.__performance_now_clock_drift : () => performance.now();
      function $a(a) {
        this.Ta = a - 16;
        this.Gb = function(b) {
          t()[this.Ta + 4 >> 2] = b;
        };
        this.Db = function(b) {
          t()[this.Ta + 8 >> 2] = b;
        };
        this.Eb = function() {
          t()[this.Ta >> 2] = 0;
        };
        this.Cb = function() {
          var b = 0;
          d()[this.Ta + 12 >> 0] = b;
        };
        this.Fb = function() {
          var b = 0;
          d()[this.Ta + 13 >> 0] = b;
        };
        this.sb = function(b, c) {
          this.Gb(b);
          this.Db(c);
          this.Eb();
          this.Cb();
          this.Fb();
        };
      }
      function Ua(a) {
        var b = X.rb();
        if (!b)
          return 6;
        X.Va.push(b);
        var c = X.Oa[a.cb] = { worker: b, eb: a.cb };
        b.Qa = c;
        var e = { cmd: "run", start_routine: a.Hb, arg: a.Sa, threadInfoStruct: a.cb };
        b.Ua = () => {
          e.time = performance.now();
          b.postMessage(e, a.Mb);
        };
        b.loaded && (b.Ua(), delete b.Ua);
        return 0;
      }
      var bb = {}, cb = [null, [], []];
      function db(a, b) {
        var c = cb[a];
        b === 0 || b === 10 ? ((a === 1 ? qa : L)(va(c, 0)), c.length = 0) : c.push(b);
      }
      var eb = {};
      function fb(a, b, c) {
        return B ? Z(2, 1, a, b, c) : 0;
      }
      function gb(a, b) {
        if (B)
          return Z(3, 1, a, b);
      }
      function hb(a, b, c, e) {
        if (B)
          return Z(4, 1, a, b, c, e);
      }
      function ib(a, b) {
        if (B)
          return Z(5, 1, a, b);
      }
      function jb(a, b, c) {
        if (B)
          return Z(6, 1, a, b, c);
      }
      function kb(a, b, c) {
        return B ? Z(7, 1, a, b, c) : 0;
      }
      function lb(a, b) {
        if (B)
          return Z(8, 1, a, b);
      }
      function mb(a, b) {
        if (B)
          return Z(9, 1, a, b);
        a = P(a);
        return eb.Qb(a, b);
      }
      function nb(a, b, c, e, h, k) {
        if (B)
          b = Z(10, 1, a, b, c, e, h, k);
        else if (k <<= 12, (e & 16) !== 0 && a % 65536 !== 0)
          b = -28;
        else if ((e & 32) !== 0) {
          var l = 65536 * Math.ceil(b / 65536);
          (a = ob(65536, l)) ? q().fill(0, a, a + l) : a = 0;
          a ? (bb[a] = { yb: a, vb: b, nb: true, fd: h, Zb: c, flags: e, offset: k }, b = a) : b = -48;
        } else
          b = -52;
        return b;
      }
      function pb(a, b) {
        if (B)
          a = Z(11, 1, a, b);
        else {
          var c = bb[a];
          b !== 0 && c ? (b === c.vb && (bb[a] = null, c.nb && qb(c.yb)), a = 0) : a = -28;
        }
        return a;
      }
      function rb(a, b, c) {
        if (B)
          return Z(12, 1, a, b, c);
      }
      function sb(a, b, c) {
        if (B)
          return Z(13, 1, a, b, c);
        a = P(a);
        return eb.Rb(a, b, c);
      }
      function tb(a) {
        if (B)
          return Z(14, 1, a);
      }
      function ub(a, b) {
        if (B)
          return Z(15, 1, a, b);
      }
      function vb(a) {
        if (B)
          return Z(16, 1, a);
      }
      function wb(a, b, c) {
        function e(y) {
          return (y = y.toTimeString().match(/\(([A-Za-z ]+)\)$/)) ? y[1] : "GMT";
        }
        if (B)
          return Z(17, 1, a, b, c);
        var h = new Date().getFullYear(), k = new Date(h, 0, 1), l = new Date(h, 6, 1);
        h = k.getTimezoneOffset();
        var u = l.getTimezoneOffset(), C = Math.max(h, u);
        t()[a >> 2] = 60 * C;
        t()[b >> 2] = Number(h != u);
        a = e(k);
        b = e(l);
        a = ya(a);
        b = ya(b);
        u < h ? (t()[c >> 2] = a, t()[c + 4 >> 2] = b) : (t()[c >> 2] = b, t()[c + 4 >> 2] = a);
      }
      function xb(a, b, c) {
        xb.ob || (xb.ob = true, wb(a, b, c));
      }
      function Z(a, b) {
        var c = arguments.length - 2, e = arguments;
        return Oa(function() {
          for (var h = yb(8 * c), k = h >> 3, l = 0; l < c; l++) {
            var u = e[2 + l];
            da()[k + l] = u;
          }
          return zb(a, c, h, b);
        });
      }
      var Ab = [];
      function Bb(a, b, c, e) {
        Oa(function() {
          var h = yb(12), k = 0;
          if (b) {
            k = Q(b) + 1;
            var l = R(k);
            xa(b, l, k);
            k = l;
          }
          t()[h >> 2] = k;
          t()[h + 4 >> 2] = c;
          t()[h + 8 >> 2] = e;
          Cb(a, 657457152, 0, k, h);
        });
      }
      var Db = [0, typeof document !== "undefined" ? document : 0, typeof window !== "undefined" ? window : 0];
      function Eb(a) {
        a = 2 < a ? P(a) : a;
        return Db[a] || (typeof document !== "undefined" ? document.querySelector(a) : void 0);
      }
      function Fb(a, b, c) {
        var e = Eb(a);
        if (!e)
          return -4;
        e.Za && (t()[e.Za >> 2] = b, t()[e.Za + 4 >> 2] = c);
        if (e.ib || !e.Ob)
          e.ib && (e = e.ib), a = false, e.Ya && e.Ya.Xa && (a = e.Ya.Xa.getParameter(2978), a = a[0] === 0 && a[1] === 0 && a[2] === e.width && a[3] === e.height), e.width = b, e.height = c, a && e.Ya.Xa.viewport(0, 0, b, c);
        else
          return e.Za ? (e = t()[e.Za + 8 >> 2], a = a ? P(a) : "", Bb(e, a, b, c), 1) : -4;
        return 0;
      }
      function Gb(a, b, c) {
        return B ? Z(18, 1, a, b, c) : Fb(a, b, c);
      }
      function Hb(a) {
        var b = a.getExtension("ANGLE_instanced_arrays");
        b && (a.vertexAttribDivisor = function(c, e) {
          b.vertexAttribDivisorANGLE(c, e);
        }, a.drawArraysInstanced = function(c, e, h, k) {
          b.drawArraysInstancedANGLE(c, e, h, k);
        }, a.drawElementsInstanced = function(c, e, h, k, l) {
          b.drawElementsInstancedANGLE(c, e, h, k, l);
        });
      }
      function Ib(a) {
        var b = a.getExtension("OES_vertex_array_object");
        b && (a.createVertexArray = function() {
          return b.createVertexArrayOES();
        }, a.deleteVertexArray = function(c) {
          b.deleteVertexArrayOES(c);
        }, a.bindVertexArray = function(c) {
          b.bindVertexArrayOES(c);
        }, a.isVertexArray = function(c) {
          return b.isVertexArrayOES(c);
        });
      }
      function Jb(a) {
        var b = a.getExtension("WEBGL_draw_buffers");
        b && (a.drawBuffers = function(c, e) {
          b.drawBuffersWEBGL(c, e);
        });
      }
      function Kb(a, b) {
        a.hb || (a.hb = a.getContext, a.getContext = function(e, h) {
          h = a.hb(e, h);
          return e == "webgl" == h instanceof WebGLRenderingContext ? h : null;
        });
        var c = a.getContext("webgl", b);
        return c ? Lb(c, b) : 0;
      }
      function Lb(a, b) {
        var c = R(8);
        t()[c + 4 >> 2] = Y();
        var e = { Vb: c, attributes: b, version: b.xb, Xa: a };
        a.canvas && (a.canvas.Ya = e);
        (typeof b.gb === "undefined" || b.gb) && Mb(e);
        return c;
      }
      function Mb(a) {
        a || (a = Nb);
        if (!a.tb) {
          a.tb = true;
          var b = a.Xa;
          Hb(b);
          Ib(b);
          Jb(b);
          b.Pb = b.getExtension("EXT_disjoint_timer_query");
          b.Yb = b.getExtension("WEBGL_multi_draw");
          (b.getSupportedExtensions() || []).forEach(function(c) {
            c.includes("lose_context") || c.includes("debug") || b.getExtension(c);
          });
        }
      }
      var Nb, Ob = ["default", "low-power", "high-performance"], Sb = {};
      function Tb() {
        if (!Ub) {
          var a = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8", _: ka || "./this.program" }, b;
          for (b in Sb)
            Sb[b] === void 0 ? delete a[b] : a[b] = Sb[b];
          var c = [];
          for (b in a)
            c.push(b + "=" + a[b]);
          Ub = c;
        }
        return Ub;
      }
      var Ub;
      function Vb(a, b) {
        if (B)
          return Z(19, 1, a, b);
        var c = 0;
        Tb().forEach(function(e, h) {
          var k = b + c;
          h = t()[a + 4 * h >> 2] = k;
          for (k = 0; k < e.length; ++k)
            d()[h++ >> 0] = e.charCodeAt(k);
          d()[h >> 0] = 0;
          c += e.length + 1;
        });
        return 0;
      }
      function Wb(a, b) {
        if (B)
          return Z(20, 1, a, b);
        var c = Tb();
        t()[a >> 2] = c.length;
        var e = 0;
        c.forEach(function(h) {
          e += h.length + 1;
        });
        t()[b >> 2] = e;
        return 0;
      }
      function Xb(a) {
        return B ? Z(21, 1, a) : 0;
      }
      function Yb(a, b, c, e) {
        if (B)
          return Z(22, 1, a, b, c, e);
        a = eb.Ub(a);
        b = eb.Sb(a, b, c);
        t()[e >> 2] = b;
        return 0;
      }
      function Zb(a, b, c, e, h) {
        if (B)
          return Z(23, 1, a, b, c, e, h);
      }
      function $b(a, b, c, e) {
        if (B)
          return Z(24, 1, a, b, c, e);
        for (var h = 0, k = 0; k < c; k++) {
          var l = t()[b >> 2], u = t()[b + 4 >> 2];
          b += 8;
          for (var C = 0; C < u; C++)
            db(a, q()[l + C]);
          h += u;
        }
        t()[e >> 2] = h;
        return 0;
      }
      function ac(a) {
        return a % 4 === 0 && (a % 100 !== 0 || a % 400 === 0);
      }
      function bc(a, b) {
        for (var c = 0, e = 0; e <= b; c += a[e++])
          ;
        return c;
      }
      var cc = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], dc = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      function ec(a, b) {
        for (a = new Date(a.getTime()); 0 < b; ) {
          var c = a.getMonth(), e = (ac(a.getFullYear()) ? cc : dc)[c];
          if (b > e - a.getDate())
            b -= e - a.getDate() + 1, a.setDate(1), 11 > c ? a.setMonth(c + 1) : (a.setMonth(0), a.setFullYear(a.getFullYear() + 1));
          else {
            a.setDate(a.getDate() + b);
            break;
          }
        }
        return a;
      }
      function fc(a, b, c, e) {
        function h(f, p, r) {
          for (f = typeof f === "number" ? f.toString() : f || ""; f.length < p; )
            f = r[0] + f;
          return f;
        }
        function k(f, p) {
          return h(f, p, "0");
        }
        function l(f, p) {
          function r(Pb) {
            return 0 > Pb ? -1 : 0 < Pb ? 1 : 0;
          }
          var G;
          (G = r(f.getFullYear() - p.getFullYear())) === 0 && (G = r(f.getMonth() - p.getMonth())) === 0 && (G = r(f.getDate() - p.getDate()));
          return G;
        }
        function u(f) {
          switch (f.getDay()) {
            case 0:
              return new Date(f.getFullYear() - 1, 11, 29);
            case 1:
              return f;
            case 2:
              return new Date(f.getFullYear(), 0, 3);
            case 3:
              return new Date(f.getFullYear(), 0, 2);
            case 4:
              return new Date(f.getFullYear(), 0, 1);
            case 5:
              return new Date(f.getFullYear() - 1, 11, 31);
            case 6:
              return new Date(f.getFullYear() - 1, 11, 30);
          }
        }
        function C(f) {
          f = ec(new Date(f.Na + 1900, 0, 1), f.bb);
          var p = new Date(f.getFullYear() + 1, 0, 4), r = u(new Date(f.getFullYear(), 0, 4));
          p = u(p);
          return 0 >= l(r, f) ? 0 >= l(p, f) ? f.getFullYear() + 1 : f.getFullYear() : f.getFullYear() - 1;
        }
        var y = t()[e + 40 >> 2];
        e = { Kb: t()[e >> 2], Jb: t()[e + 4 >> 2], $a: t()[e + 8 >> 2], Wa: t()[e + 12 >> 2], Ra: t()[e + 16 >> 2], Na: t()[e + 20 >> 2], ab: t()[e + 24 >> 2], bb: t()[e + 28 >> 2], cc: t()[e + 32 >> 2], Ib: t()[e + 36 >> 2], Lb: y ? P(y) : "" };
        c = P(c);
        y = { "%c": "%a %b %d %H:%M:%S %Y", "%D": "%m/%d/%y", "%F": "%Y-%m-%d", "%h": "%b", "%r": "%I:%M:%S %p", "%R": "%H:%M", "%T": "%H:%M:%S", "%x": "%m/%d/%y", "%X": "%H:%M:%S", "%Ec": "%c", "%EC": "%C", "%Ex": "%m/%d/%y", "%EX": "%H:%M:%S", "%Ey": "%y", "%EY": "%Y", "%Od": "%d", "%Oe": "%e", "%OH": "%H", "%OI": "%I", "%Om": "%m", "%OM": "%M", "%OS": "%S", "%Ou": "%u", "%OU": "%U", "%OV": "%V", "%Ow": "%w", "%OW": "%W", "%Oy": "%y" };
        for (var A in y)
          c = c.replace(new RegExp(A, "g"), y[A]);
        var Qb = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "), Rb = "January February March April May June July August September October November December".split(" ");
        y = { "%a": function(f) {
          return Qb[f.ab].substring(0, 3);
        }, "%A": function(f) {
          return Qb[f.ab];
        }, "%b": function(f) {
          return Rb[f.Ra].substring(0, 3);
        }, "%B": function(f) {
          return Rb[f.Ra];
        }, "%C": function(f) {
          return k((f.Na + 1900) / 100 | 0, 2);
        }, "%d": function(f) {
          return k(f.Wa, 2);
        }, "%e": function(f) {
          return h(f.Wa, 2, " ");
        }, "%g": function(f) {
          return C(f).toString().substring(2);
        }, "%G": function(f) {
          return C(f);
        }, "%H": function(f) {
          return k(f.$a, 2);
        }, "%I": function(f) {
          f = f.$a;
          f == 0 ? f = 12 : 12 < f && (f -= 12);
          return k(f, 2);
        }, "%j": function(f) {
          return k(f.Wa + bc(ac(f.Na + 1900) ? cc : dc, f.Ra - 1), 3);
        }, "%m": function(f) {
          return k(f.Ra + 1, 2);
        }, "%M": function(f) {
          return k(f.Jb, 2);
        }, "%n": function() {
          return "\n";
        }, "%p": function(f) {
          return 0 <= f.$a && 12 > f.$a ? "AM" : "PM";
        }, "%S": function(f) {
          return k(f.Kb, 2);
        }, "%t": function() {
          return "	";
        }, "%u": function(f) {
          return f.ab || 7;
        }, "%U": function(f) {
          var p = new Date(f.Na + 1900, 0, 1), r = p.getDay() === 0 ? p : ec(p, 7 - p.getDay());
          f = new Date(f.Na + 1900, f.Ra, f.Wa);
          return 0 > l(r, f) ? k(Math.ceil((31 - r.getDate() + (bc(ac(f.getFullYear()) ? cc : dc, f.getMonth() - 1) - 31) + f.getDate()) / 7), 2) : l(r, p) === 0 ? "01" : "00";
        }, "%V": function(f) {
          var p = new Date(f.Na + 1901, 0, 4), r = u(new Date(f.Na + 1900, 0, 4));
          p = u(p);
          var G = ec(new Date(f.Na + 1900, 0, 1), f.bb);
          return 0 > l(G, r) ? "53" : 0 >= l(p, G) ? "01" : k(Math.ceil((r.getFullYear() < f.Na + 1900 ? f.bb + 32 - r.getDate() : f.bb + 1 - r.getDate()) / 7), 2);
        }, "%w": function(f) {
          return f.ab;
        }, "%W": function(f) {
          var p = new Date(f.Na, 0, 1), r = p.getDay() === 1 ? p : ec(p, p.getDay() === 0 ? 1 : 7 - p.getDay() + 1);
          f = new Date(f.Na + 1900, f.Ra, f.Wa);
          return 0 > l(r, f) ? k(Math.ceil((31 - r.getDate() + (bc(ac(f.getFullYear()) ? cc : dc, f.getMonth() - 1) - 31) + f.getDate()) / 7), 2) : l(r, p) === 0 ? "01" : "00";
        }, "%y": function(f) {
          return (f.Na + 1900).toString().substring(2);
        }, "%Y": function(f) {
          return f.Na + 1900;
        }, "%z": function(f) {
          f = f.Ib;
          var p = 0 <= f;
          f = Math.abs(f) / 60;
          return (p ? "+" : "-") + String("0000" + (f / 60 * 100 + f % 60)).slice(-4);
        }, "%Z": function(f) {
          return f.Lb;
        }, "%%": function() {
          return "%";
        } };
        for (A in y)
          c.includes(A) && (c = c.replace(new RegExp(A, "g"), y[A](e)));
        A = gc(c);
        if (A.length > b)
          return 0;
        za(A, a);
        return A.length - 1;
      }
      var hc = [null, Wa, fb, gb, hb, ib, jb, kb, lb, mb, nb, pb, rb, sb, tb, ub, vb, wb, Gb, Vb, Wb, Xb, Yb, Zb, $b];
      function gc(a) {
        var b = Array(Q(a) + 1);
        wa(a, b, 0, b.length);
        return b;
      }
      var mc = {
        b: function(a) {
          return R(a + 16) + 16;
        },
        c: function(a, b, c) {
          new $a(a).sb(b, c);
          throw a;
        },
        M: function(a) {
          ic(a, !x, 1, !la);
          X.lb();
        },
        n: function(a) {
          B ? postMessage({ cmd: "cleanupThread", thread: a }) : Qa(a);
        },
        p: function(a, b, c, e) {
          if (typeof SharedArrayBuffer === "undefined")
            return L("Current environment does not support SharedArrayBuffer, pthreads are not available!"), 6;
          var h = [];
          if (B && h.length === 0)
            return jc(687865856, a, b, c, e);
          a = { Hb: c, cb: a, Sa: e, Mb: h };
          return B ? (a.Nb = "spawnThread", postMessage(a, h), 0) : Ua(a);
        },
        i: fb,
        U: gb,
        R: hb,
        y: ib,
        A: jb,
        t: kb,
        S: lb,
        H: mb,
        G: nb,
        F: pb,
        o: rb,
        z: sb,
        w: tb,
        T: ub,
        x: vb,
        j: function() {
          O("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking");
        },
        _: function() {
          O("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking");
        },
        E: function() {
          return 2097152;
        },
        Z: function(a, b, c) {
          var e = performance.now();
          c = e + c;
          for (Atomics.exchange(t(), kc >> 2, a); ; ) {
            e = performance.now();
            if (e > c)
              return Atomics.exchange(t(), kc >> 2, 0), -73;
            e = Atomics.exchange(t(), kc >> 2, 0);
            if (e == 0)
              break;
            Ta();
            if (Atomics.load(t(), a >> 2) != b)
              return -6;
            Atomics.exchange(t(), kc >> 2, a);
          }
          return 0;
        },
        N: function(a, b) {
          if (a == b)
            postMessage({ cmd: "processQueuedMainThreadWork" });
          else if (B)
            postMessage({ targetThread: a, cmd: "processThreadQueue" });
          else {
            a = (a = X.Oa[a]) && a.worker;
            if (!a)
              return;
            a.postMessage({ cmd: "processThreadQueue" });
          }
          return 1;
        },
        V: function(a, b) {
          a = new Date(1e3 * t()[a >> 2]);
          t()[b >> 2] = a.getUTCSeconds();
          t()[b + 4 >> 2] = a.getUTCMinutes();
          t()[b + 8 >> 2] = a.getUTCHours();
          t()[b + 12 >> 2] = a.getUTCDate();
          t()[b + 16 >> 2] = a.getUTCMonth();
          t()[b + 20 >> 2] = a.getUTCFullYear() - 1900;
          t()[b + 24 >> 2] = a.getUTCDay();
          a = (a.getTime() - Date.UTC(a.getUTCFullYear(), 0, 1, 0, 0, 0, 0)) / 864e5 | 0;
          t()[b + 28 >> 2] = a;
        },
        W: function(a, b) {
          a = new Date(1e3 * t()[a >> 2]);
          t()[b >> 2] = a.getSeconds();
          t()[b + 4 >> 2] = a.getMinutes();
          t()[b + 8 >> 2] = a.getHours();
          t()[b + 12 >> 2] = a.getDate();
          t()[b + 16 >> 2] = a.getMonth();
          t()[b + 20 >> 2] = a.getFullYear() - 1900;
          t()[b + 24 >> 2] = a.getDay();
          var c = new Date(a.getFullYear(), 0, 1), e = (a.getTime() - c.getTime()) / 864e5 | 0;
          t()[b + 28 >> 2] = e;
          t()[b + 36 >> 2] = -(60 * a.getTimezoneOffset());
          e = new Date(a.getFullYear(), 6, 1).getTimezoneOffset();
          c = c.getTimezoneOffset();
          a = (e != c && a.getTimezoneOffset() == Math.min(c, e)) | 0;
          t()[b + 32 >> 2] = a;
        },
        X: function(a) {
          var b = new Date(t()[a + 20 >> 2] + 1900, t()[a + 16 >> 2], t()[a + 12 >> 2], t()[a + 8 >> 2], t()[a + 4 >> 2], t()[a >> 2], 0), c = t()[a + 32 >> 2], e = b.getTimezoneOffset(), h = new Date(b.getFullYear(), 0, 1), k = new Date(b.getFullYear(), 6, 1).getTimezoneOffset(), l = h.getTimezoneOffset(), u = Math.min(l, k);
          0 > c ? t()[a + 32 >> 2] = Number(k != l && u == e) : 0 < c != (u == e) && (k = Math.max(l, k), b.setTime(b.getTime() + 6e4 * ((0 < c ? u : k) - e)));
          t()[a + 24 >> 2] = b.getDay();
          c = (b.getTime() - h.getTime()) / 864e5 | 0;
          t()[a + 28 >> 2] = c;
          t()[a >> 2] = b.getSeconds();
          t()[a + 4 >> 2] = b.getMinutes();
          t()[a + 8 >> 2] = b.getHours();
          t()[a + 12 >> 2] = b.getDate();
          t()[a + 16 >> 2] = b.getMonth();
          return b.getTime() / 1e3 | 0;
        },
        Y: xb,
        d: function() {
          O("");
        },
        q: function(a, b) {
          if (a === 0)
            a = Date.now();
          else if (a === 1 || a === 4)
            a = Za();
          else
            return t()[lc() >> 2] = 28, -1;
          t()[b >> 2] = a / 1e3 | 0;
          t()[b + 4 >> 2] = a % 1e3 * 1e6 | 0;
          return 0;
        },
        B: function(a, b) {
          return a - b;
        },
        m: function() {
          z || x || (M || (M = {}), M["Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread"] || (M["Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread"] = 1, L("Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread")));
        },
        v: function() {
          return 2147483648;
        },
        f: Za,
        Q: function(a, b, c) {
          q().copyWithin(a, b, b + c);
        },
        g: function() {
          return z ? require$$3$1.cpus().length : navigator.hardwareConcurrency;
        },
        I: function(a, b, c) {
          Ab.length = b;
          c >>= 3;
          for (var e = 0; e < b; e++)
            Ab[e] = da()[c + e];
          return (0 > a ? Ma[-a - 1] : hc[a]).apply(null, Ab);
        },
        u: function(a) {
          var b = q().length;
          a >>>= 0;
          if (a <= b || 2147483648 < a)
            return false;
          for (var c = 1; 4 >= c; c *= 2) {
            var e = b * (1 + 0.2 / c);
            e = Math.min(e, a + 100663296);
            e = Math.max(a, e);
            0 < e % 65536 && (e += 65536 - e % 65536);
            a: {
              try {
                g.grow(Math.min(2147483648, e) - m.byteLength + 65535 >>> 16);
                n(g.buffer);
                var h = 1;
                break a;
              } catch (k) {
              }
              h = void 0;
            }
            if (h)
              return true;
          }
          return false;
        },
        K: function(a, b, c) {
          return Eb(a) ? Fb(a, b, c) : Gb(a, b, c);
        },
        C: function() {
          throw "unwind";
        },
        L: function(a, b) {
          b >>= 2;
          var c = t()[b + 6];
          b = { alpha: !!t()[b], depth: !!t()[b + 1], stencil: !!t()[b + 2], antialias: !!t()[b + 3], premultipliedAlpha: !!t()[b + 4], preserveDrawingBuffer: !!t()[b + 5], powerPreference: Ob[c], failIfMajorPerformanceCaveat: !!t()[b + 7], xb: t()[b + 8], Xb: t()[b + 9], gb: t()[b + 10], qb: t()[b + 11], $b: t()[b + 12], ac: t()[b + 13] };
          a = Eb(a);
          return !a || b.qb ? 0 : Kb(a, b);
        },
        O: Vb,
        P: Wb,
        D: function(a) {
          Xa(a);
        },
        h: Xb,
        l: Yb,
        s: Zb,
        k: $b,
        J: function(a) {
          var b = Date.now();
          t()[a >> 2] = b / 1e3 | 0;
          t()[a + 4 >> 2] = b % 1e3 * 1e3 | 0;
          return 0;
        },
        a: g || v.wasmMemory,
        r: fc,
        e: function(a, b, c, e) {
          return fc(a, b, c, e);
        }
      };
      (function() {
        function a(h, k) {
          v.asm = h.exports;
          X.fb.push(v.asm.xa);
          Ba = v.asm.Ba;
          Da.unshift(v.asm.$);
          ra = k;
          B || (S--, v.monitorRunDependencies && v.monitorRunDependencies(S), S == 0 && (T && (h = T, T = null, h())));
        }
        function b(h) {
          a(h.instance, h.module);
        }
        function c(h) {
          return La().then(function(k) {
            return WebAssembly.instantiate(k, e);
          }).then(function(k) {
            return k;
          }).then(h, function(k) {
            L("failed to asynchronously prepare wasm: " + k);
            O(k);
          });
        }
        var e = { a: mc };
        B || (S++, v.monitorRunDependencies && v.monitorRunDependencies(S));
        if (v.instantiateWasm)
          try {
            return v.instantiateWasm(e, a);
          } catch (h) {
            return L("Module.instantiateWasm callback failed with error: " + h), false;
          }
        (function() {
          return N || typeof WebAssembly.instantiateStreaming !== "function" || Ja() || U.startsWith("file://") || typeof fetch !== "function" ? c(b) : fetch(U, { credentials: "same-origin" }).then(function(h) {
            return WebAssembly.instantiateStreaming(h, e).then(b, function(k) {
              L("wasm streaming compile failed: " + k);
              L("falling back to ArrayBuffer instantiation");
              return c(b);
            });
          });
        })().catch(ia);
        return {};
      })();
      v.___wasm_call_ctors = function() {
        return (v.___wasm_call_ctors = v.asm.$).apply(null, arguments);
      };
      v._OrtInit = function() {
        return (v._OrtInit = v.asm.aa).apply(null, arguments);
      };
      v._OrtCreateSessionOptions = function() {
        return (v._OrtCreateSessionOptions = v.asm.ba).apply(null, arguments);
      };
      v._OrtAddSessionConfigEntry = function() {
        return (v._OrtAddSessionConfigEntry = v.asm.ca).apply(null, arguments);
      };
      v._OrtReleaseSessionOptions = function() {
        return (v._OrtReleaseSessionOptions = v.asm.da).apply(null, arguments);
      };
      v._OrtCreateSession = function() {
        return (v._OrtCreateSession = v.asm.ea).apply(null, arguments);
      };
      v._OrtReleaseSession = function() {
        return (v._OrtReleaseSession = v.asm.fa).apply(null, arguments);
      };
      v._OrtGetInputCount = function() {
        return (v._OrtGetInputCount = v.asm.ga).apply(null, arguments);
      };
      v._OrtGetOutputCount = function() {
        return (v._OrtGetOutputCount = v.asm.ha).apply(null, arguments);
      };
      v._OrtGetInputName = function() {
        return (v._OrtGetInputName = v.asm.ia).apply(null, arguments);
      };
      v._OrtGetOutputName = function() {
        return (v._OrtGetOutputName = v.asm.ja).apply(null, arguments);
      };
      v._OrtFree = function() {
        return (v._OrtFree = v.asm.ka).apply(null, arguments);
      };
      v._OrtCreateTensor = function() {
        return (v._OrtCreateTensor = v.asm.la).apply(null, arguments);
      };
      v._OrtGetTensorData = function() {
        return (v._OrtGetTensorData = v.asm.ma).apply(null, arguments);
      };
      v._OrtReleaseTensor = function() {
        return (v._OrtReleaseTensor = v.asm.na).apply(null, arguments);
      };
      v._OrtCreateRunOptions = function() {
        return (v._OrtCreateRunOptions = v.asm.oa).apply(null, arguments);
      };
      v._OrtAddRunConfigEntry = function() {
        return (v._OrtAddRunConfigEntry = v.asm.pa).apply(null, arguments);
      };
      v._OrtReleaseRunOptions = function() {
        return (v._OrtReleaseRunOptions = v.asm.qa).apply(null, arguments);
      };
      v._OrtRun = function() {
        return (v._OrtRun = v.asm.ra).apply(null, arguments);
      };
      v._OrtEndProfiling = function() {
        return (v._OrtEndProfiling = v.asm.sa).apply(null, arguments);
      };
      var lc = v.___errno_location = function() {
        return (lc = v.___errno_location = v.asm.ta).apply(null, arguments);
      }, Y = v._pthread_self = function() {
        return (Y = v._pthread_self = v.asm.ua).apply(null, arguments);
      }, R = v._malloc = function() {
        return (R = v._malloc = v.asm.va).apply(null, arguments);
      }, qb = v._free = function() {
        return (qb = v._free = v.asm.wa).apply(null, arguments);
      };
      v._emscripten_tls_init = function() {
        return (v._emscripten_tls_init = v.asm.xa).apply(null, arguments);
      };
      var nc = v.___funcs_on_exit = function() {
        return (nc = v.___funcs_on_exit = v.asm.ya).apply(null, arguments);
      }, Ta = v._emscripten_main_thread_process_queued_calls = function() {
        return (Ta = v._emscripten_main_thread_process_queued_calls = v.asm.za).apply(null, arguments);
      }, ic = v.__emscripten_thread_init = function() {
        return (ic = v.__emscripten_thread_init = v.asm.Aa).apply(null, arguments);
      };
      v._emscripten_current_thread_process_queued_calls = function() {
        return (v._emscripten_current_thread_process_queued_calls = v.asm.Ca).apply(null, arguments);
      };
      var jc = v._emscripten_sync_run_in_main_thread_4 = function() {
        return (jc = v._emscripten_sync_run_in_main_thread_4 = v.asm.Da).apply(null, arguments);
      }, zb = v._emscripten_run_in_main_runtime_thread_js = function() {
        return (zb = v._emscripten_run_in_main_runtime_thread_js = v.asm.Ea).apply(null, arguments);
      }, Cb = v._emscripten_dispatch_to_thread_ = function() {
        return (Cb = v._emscripten_dispatch_to_thread_ = v.asm.Fa).apply(null, arguments);
      }, Ra = v.__emscripten_thread_free_data = function() {
        return (Ra = v.__emscripten_thread_free_data = v.asm.Ga).apply(null, arguments);
      };
      v.__emscripten_thread_exit = function() {
        return (v.__emscripten_thread_exit = v.asm.Ha).apply(null, arguments);
      };
      var ob = v._memalign = function() {
        return (ob = v._memalign = v.asm.Ia).apply(null, arguments);
      }, Va = v._emscripten_stack_set_limits = function() {
        return (Va = v._emscripten_stack_set_limits = v.asm.Ja).apply(null, arguments);
      }, Pa = v.stackSave = function() {
        return (Pa = v.stackSave = v.asm.Ka).apply(null, arguments);
      }, W = v.stackRestore = function() {
        return (W = v.stackRestore = v.asm.La).apply(null, arguments);
      }, yb = v.stackAlloc = function() {
        return (yb = v.stackAlloc = v.asm.Ma).apply(null, arguments);
      }, kc = v.__emscripten_main_thread_futex = 687896, Sa = v.__emscripten_allow_main_runtime_queued_calls = 683012;
      v.UTF8ToString = P;
      v.stringToUTF8 = xa;
      v.lengthBytesUTF8 = Q;
      v.keepRuntimeAlive = K;
      v.PThread = X;
      v.stackSave = Pa;
      v.stackRestore = W;
      v.stackAlloc = yb;
      v.PThread = X;
      v.wasmMemory = g;
      v.ExitStatus = J;
      var oc;
      function J(a) {
        this.name = "ExitStatus";
        this.message = "Program terminated with exit(" + a + ")";
        this.status = a;
      }
      T = function pc() {
        oc || qc();
        oc || (T = pc);
      };
      function qc() {
        function a() {
          if (!oc && (oc = true, v.calledRun = true, !sa)) {
            B || V(Da);
            ha(v);
            if (v.onRuntimeInitialized)
              v.onRuntimeInitialized();
            if (!B) {
              if (v.postRun)
                for (typeof v.postRun == "function" && (v.postRun = [v.postRun]); v.postRun.length; ) {
                  var b = v.postRun.shift();
                  Fa.unshift(b);
                }
              V(Fa);
            }
          }
        }
        if (!(0 < S))
          if (B)
            ha(v), B || V(Da), postMessage({ cmd: "loaded" });
          else {
            if (v.preRun)
              for (typeof v.preRun == "function" && (v.preRun = [v.preRun]); v.preRun.length; )
                Ha();
            V(Ca);
            0 < S || (v.setStatus ? (v.setStatus("Running..."), setTimeout(function() {
              setTimeout(function() {
                v.setStatus("");
              }, 1);
              a();
            }, 1)) : a());
          }
      }
      v.run = qc;
      function Xa(a) {
        if (B)
          throw Wa(a), "unwind";
        K() || B || (nc(), V(Ea), cb[1].length && db(1, 10), cb[2].length && db(2, 10), X.kb());
        if (!K()) {
          X.kb();
          if (v.onExit)
            v.onExit(a);
          sa = true;
        }
        w(a, new J(a));
      }
      if (v.preInit)
        for (typeof v.preInit == "function" && (v.preInit = [v.preInit]); 0 < v.preInit.length; )
          v.preInit.pop()();
      B && (noExitRuntime = false, X.ub());
      qc();
      return ortWasmThreaded3.ready;
    };
  })();
  module.exports = ortWasmThreaded2;
})(ortWasmThreaded$1);
var ortWasmThreaded_worker = {};
var Module = {};
if (typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string") {
  var nodeWorkerThreads = require$$3$1;
  var parentPort = nodeWorkerThreads.parentPort;
  parentPort.on("message", function(data) {
    onmessage({ data });
  });
  var nodeFS = require$$3$1;
  Object.assign(commonjsGlobal, { self: commonjsGlobal, require: commonjsRequire, Module, location: { href: __filename }, Worker: nodeWorkerThreads.Worker, importScripts: function(f) {
    (0, eval)(nodeFS.readFileSync(f, "utf8"));
  }, postMessage: function(msg) {
    parentPort.postMessage(msg);
  }, performance: commonjsGlobal.performance || { now: function() {
    return Date.now();
  } } });
}
function threadPrintErr() {
  var text = Array.prototype.slice.call(arguments).join(" ");
  console.error(text);
}
function threadAlert() {
  var text = Array.prototype.slice.call(arguments).join(" ");
  postMessage({ cmd: "alert", text, threadId: Module["_pthread_self"]() });
}
var err = threadPrintErr;
self.alert = threadAlert;
Module["instantiateWasm"] = (info, receiveInstance) => {
  var instance = new WebAssembly.Instance(Module["wasmModule"], info);
  receiveInstance(instance);
  Module["wasmModule"] = null;
  return instance.exports;
};
self.onmessage = (e) => {
  try {
    if (e.data.cmd === "load") {
      Module["wasmModule"] = e.data.wasmModule;
      Module["wasmMemory"] = e.data.wasmMemory;
      Module["buffer"] = Module["wasmMemory"].buffer;
      Module["ENVIRONMENT_IS_PTHREAD"] = true;
      if (typeof e.data.urlOrBlob === "string") {
        importScripts(e.data.urlOrBlob);
      } else {
        var objectUrl = URL.createObjectURL(e.data.urlOrBlob);
        importScripts(objectUrl);
        URL.revokeObjectURL(objectUrl);
      }
      ortWasmThreaded(Module).then(function(instance) {
        Module = instance;
      });
    } else if (e.data.cmd === "run") {
      Module["__performance_now_clock_drift"] = performance.now() - e.data.time;
      Module["__emscripten_thread_init"](e.data.threadInfoStruct, 0, 0, 1);
      Module["establishStackSpace"]();
      Module["PThread"].receiveObjectTransfer(e.data);
      Module["PThread"].threadInit();
      try {
        var result = Module["invokeEntryPoint"](e.data.start_routine, e.data.arg);
        if (Module["keepRuntimeAlive"]()) {
          Module["PThread"].setExitStatus(result);
        } else {
          Module["__emscripten_thread_exit"](result);
        }
      } catch (ex) {
        if (ex != "unwind") {
          if (ex instanceof Module["ExitStatus"]) {
            if (Module["keepRuntimeAlive"]()) {
            } else {
              Module["__emscripten_thread_exit"](ex.status);
            }
          } else {
            throw ex;
          }
        }
      }
    } else if (e.data.cmd === "cancel") {
      if (Module["_pthread_self"]()) {
        Module["__emscripten_thread_exit"](-1);
      }
    } else if (e.data.target === "setimmediate") {
    } else if (e.data.cmd === "processThreadQueue") {
      if (Module["_pthread_self"]()) {
        Module["_emscripten_current_thread_process_queued_calls"]();
      }
    } else {
      err("worker.js received unknown command " + e.data.cmd);
      err(e.data);
    }
  } catch (ex) {
    err("worker.js onmessage() captured an uncaught exception: " + ex);
    if (ex && ex.stack)
      err(ex.stack);
    throw ex;
  }
};
var __createBinding$1 = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(o, m, k, k2) {
  if (k2 === void 0)
    k2 = k;
  Object.defineProperty(o, k2, { enumerable: true, get: function() {
    return m[k];
  } });
} : function(o, m, k, k2) {
  if (k2 === void 0)
    k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault$1 = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
} : function(o, v) {
  o["default"] = v;
});
var __importStar$1 = commonjsGlobal && commonjsGlobal.__importStar || function(mod2) {
  if (mod2 && mod2.__esModule)
    return mod2;
  var result = {};
  if (mod2 != null) {
    for (var k in mod2)
      if (k !== "default" && Object.prototype.hasOwnProperty.call(mod2, k))
        __createBinding$1(result, mod2, k);
  }
  __setModuleDefault$1(result, mod2);
  return result;
};
var __importDefault = commonjsGlobal && commonjsGlobal.__importDefault || function(mod2) {
  return mod2 && mod2.__esModule ? mod2 : { "default": mod2 };
};
Object.defineProperty(wasmFactory, "__esModule", { value: true });
wasmFactory.dispose = wasmFactory.getInstance = wasmFactory.initializeWebAssembly = void 0;
const path = __importStar$1(require$$3$1);
const ort_wasm_js_1 = __importDefault(ortWasm.exports);
const ortWasmFactoryThreaded = ortWasmThreaded$1.exports;
let wasm;
let initialized$1 = false;
let initializing$1 = false;
let aborted$1 = false;
const isMultiThreadSupported = () => {
  try {
    if (typeof SharedArrayBuffer === "undefined") {
      return false;
    }
    if (typeof MessageChannel !== "undefined") {
      new MessageChannel().port1.postMessage(new SharedArrayBuffer(1));
    }
    return WebAssembly.validate(new Uint8Array([
      0,
      97,
      115,
      109,
      1,
      0,
      0,
      0,
      1,
      4,
      1,
      96,
      0,
      0,
      3,
      2,
      1,
      0,
      5,
      4,
      1,
      3,
      1,
      1,
      10,
      11,
      1,
      9,
      0,
      65,
      0,
      254,
      16,
      2,
      0,
      26,
      11
    ]));
  } catch (e) {
    return false;
  }
};
const isSimdSupported = () => {
  try {
    return WebAssembly.validate(new Uint8Array([
      0,
      97,
      115,
      109,
      1,
      0,
      0,
      0,
      1,
      4,
      1,
      96,
      0,
      0,
      3,
      2,
      1,
      0,
      10,
      30,
      1,
      28,
      0,
      65,
      0,
      253,
      15,
      253,
      12,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      253,
      186,
      1,
      26,
      11
    ]));
  } catch (e) {
    return false;
  }
};
const getWasmFileName = (useSimd, useThreads) => {
  if (useThreads) {
    return useSimd ? "ort-wasm-simd-threaded.wasm" : "ort-wasm-threaded.wasm";
  } else {
    return useSimd ? "ort-wasm-simd.wasm" : "ort-wasm.wasm";
  }
};
const initializeWebAssembly = async (flags) => {
  if (initialized$1) {
    return Promise.resolve();
  }
  if (initializing$1) {
    throw new Error("multiple calls to 'initializeWebAssembly()' detected.");
  }
  if (aborted$1) {
    throw new Error("previous call to 'initializeWebAssembly()' failed.");
  }
  initializing$1 = true;
  const timeout = flags.initTimeout;
  const numThreads = flags.numThreads;
  const simd = flags.simd;
  const useThreads = numThreads > 1 && isMultiThreadSupported();
  const useSimd = simd && isSimdSupported();
  const wasmPrefixOverride = typeof flags.wasmPaths === "string" ? flags.wasmPaths : void 0;
  const wasmFileName = getWasmFileName(false, useThreads);
  const wasmOverrideFileName = getWasmFileName(useSimd, useThreads);
  const wasmPathOverride = typeof flags.wasmPaths === "object" ? flags.wasmPaths[wasmOverrideFileName] : void 0;
  let isTimeout = false;
  const tasks = [];
  if (timeout > 0) {
    tasks.push(new Promise((resolve) => {
      setTimeout(() => {
        isTimeout = true;
        resolve();
      }, timeout);
    }));
  }
  tasks.push(new Promise((resolve, reject) => {
    const factory2 = useThreads ? ortWasmFactoryThreaded : ort_wasm_js_1.default;
    const config = {
      locateFile: (fileName, scriptDirectory) => {
        if (useThreads && fileName.endsWith(".worker.js") && typeof Blob !== "undefined") {
          return URL.createObjectURL(new Blob([
            ortWasmThreaded_worker
          ], { type: "text/javascript" }));
        }
        if (fileName === wasmFileName) {
          const prefix = wasmPrefixOverride !== null && wasmPrefixOverride !== void 0 ? wasmPrefixOverride : scriptDirectory;
          return wasmPathOverride !== null && wasmPathOverride !== void 0 ? wasmPathOverride : prefix + wasmOverrideFileName;
        }
        return scriptDirectory + fileName;
      }
    };
    if (useThreads) {
      if (typeof Blob === "undefined") {
        config.mainScriptUrlOrBlob = path.join(__dirname, "ort-wasm-threaded.js");
      } else {
        const scriptSourceCode = `var ortWasmThreaded=(function(){var _scriptDir;return ${factory2.toString()}})();`;
        config.mainScriptUrlOrBlob = new Blob([scriptSourceCode], { type: "text/javascript" });
      }
    }
    factory2(config).then((module) => {
      initializing$1 = false;
      initialized$1 = true;
      wasm = module;
      resolve();
    }, (what) => {
      initializing$1 = false;
      aborted$1 = true;
      reject(what);
    });
  }));
  await Promise.race(tasks);
  if (isTimeout) {
    throw new Error(`WebAssembly backend initializing failed due to timeout: ${timeout}ms`);
  }
};
wasmFactory.initializeWebAssembly = initializeWebAssembly;
const getInstance = () => {
  if (initialized$1 && wasm) {
    return wasm;
  }
  throw new Error("WebAssembly is not initialized yet.");
};
wasmFactory.getInstance = getInstance;
const dispose = () => {
  var _a2;
  if (initialized$1 && !initializing$1 && !aborted$1) {
    initializing$1 = true;
    (_a2 = wasm.PThread) === null || _a2 === void 0 ? void 0 : _a2.terminateAllThreads();
    wasm = void 0;
    initializing$1 = false;
    initialized$1 = false;
    aborted$1 = true;
  }
};
wasmFactory.dispose = dispose;
Object.defineProperty(stringUtils, "__esModule", { value: true });
stringUtils.allocWasmString = void 0;
const wasm_factory_1$4 = wasmFactory;
const allocWasmString = (data, allocs) => {
  const wasm2 = wasm_factory_1$4.getInstance();
  const dataLength = wasm2.lengthBytesUTF8(data) + 1;
  const dataOffset = wasm2._malloc(dataLength);
  wasm2.stringToUTF8(data, dataOffset, dataLength);
  allocs.push(dataOffset);
  return dataOffset;
};
stringUtils.allocWasmString = allocWasmString;
Object.defineProperty(runOptions, "__esModule", { value: true });
runOptions.setRunOptions = void 0;
const options_utils_1$1 = optionsUtils;
const string_utils_1$2 = stringUtils;
const wasm_factory_1$3 = wasmFactory;
const setRunOptions = (options) => {
  const wasm2 = wasm_factory_1$3.getInstance();
  let runOptionsHandle = 0;
  const allocs = [];
  const runOptions2 = options || {};
  try {
    if ((options === null || options === void 0 ? void 0 : options.logSeverityLevel) === void 0) {
      runOptions2.logSeverityLevel = 2;
    } else if (typeof options.logSeverityLevel !== "number" || !Number.isInteger(options.logSeverityLevel) || options.logSeverityLevel < 0 || options.logSeverityLevel > 4) {
      throw new Error(`log serverity level is not valid: ${options.logSeverityLevel}`);
    }
    if ((options === null || options === void 0 ? void 0 : options.logVerbosityLevel) === void 0) {
      runOptions2.logVerbosityLevel = 0;
    } else if (typeof options.logVerbosityLevel !== "number" || !Number.isInteger(options.logVerbosityLevel)) {
      throw new Error(`log verbosity level is not valid: ${options.logVerbosityLevel}`);
    }
    if ((options === null || options === void 0 ? void 0 : options.terminate) === void 0) {
      runOptions2.terminate = false;
    }
    let tagDataOffset = 0;
    if ((options === null || options === void 0 ? void 0 : options.tag) !== void 0) {
      tagDataOffset = string_utils_1$2.allocWasmString(options.tag, allocs);
    }
    runOptionsHandle = wasm2._OrtCreateRunOptions(runOptions2.logSeverityLevel, runOptions2.logVerbosityLevel, !!runOptions2.terminate, tagDataOffset);
    if (runOptionsHandle === 0) {
      throw new Error("Can't create run options");
    }
    if ((options === null || options === void 0 ? void 0 : options.extra) !== void 0) {
      options_utils_1$1.iterateExtraOptions(options.extra, "", /* @__PURE__ */ new WeakSet(), (key, value) => {
        const keyDataOffset = string_utils_1$2.allocWasmString(key, allocs);
        const valueDataOffset = string_utils_1$2.allocWasmString(value, allocs);
        if (wasm2._OrtAddRunConfigEntry(runOptionsHandle, keyDataOffset, valueDataOffset) !== 0) {
          throw new Error(`Can't set a run config entry: ${key} - ${value}`);
        }
      });
    }
    return [runOptionsHandle, allocs];
  } catch (e) {
    if (runOptionsHandle !== 0) {
      wasm2._OrtReleaseRunOptions(runOptionsHandle);
    }
    allocs.forEach(wasm2._free);
    throw e;
  }
};
runOptions.setRunOptions = setRunOptions;
var sessionOptions = {};
Object.defineProperty(sessionOptions, "__esModule", { value: true });
sessionOptions.setSessionOptions = void 0;
const options_utils_1 = optionsUtils;
const string_utils_1$1 = stringUtils;
const wasm_factory_1$2 = wasmFactory;
const getGraphOptimzationLevel = (graphOptimizationLevel) => {
  switch (graphOptimizationLevel) {
    case "disabled":
      return 0;
    case "basic":
      return 1;
    case "extended":
      return 2;
    case "all":
      return 99;
    default:
      throw new Error(`unsupported graph optimization level: ${graphOptimizationLevel}`);
  }
};
const getExecutionMode = (executionMode) => {
  switch (executionMode) {
    case "sequential":
      return 0;
    case "parallel":
      return 1;
    default:
      throw new Error(`unsupported execution mode: ${executionMode}`);
  }
};
const appendDefaultOptions = (options) => {
  if (!options.extra) {
    options.extra = {};
  }
  if (!options.extra.session) {
    options.extra.session = {};
  }
  const session2 = options.extra.session;
  if (!session2.use_ort_model_bytes_directly) {
    session2.use_ort_model_bytes_directly = "1";
  }
};
const setSessionOptions = (options) => {
  const wasm2 = wasm_factory_1$2.getInstance();
  let sessionOptionsHandle = 0;
  const allocs = [];
  const sessionOptions2 = options || {};
  appendDefaultOptions(sessionOptions2);
  try {
    if ((options === null || options === void 0 ? void 0 : options.graphOptimizationLevel) === void 0) {
      sessionOptions2.graphOptimizationLevel = "all";
    }
    const graphOptimizationLevel = getGraphOptimzationLevel(sessionOptions2.graphOptimizationLevel);
    if ((options === null || options === void 0 ? void 0 : options.enableCpuMemArena) === void 0) {
      sessionOptions2.enableCpuMemArena = true;
    }
    if ((options === null || options === void 0 ? void 0 : options.enableMemPattern) === void 0) {
      sessionOptions2.enableMemPattern = true;
    }
    if ((options === null || options === void 0 ? void 0 : options.executionMode) === void 0) {
      sessionOptions2.executionMode = "sequential";
    }
    const executionMode = getExecutionMode(sessionOptions2.executionMode);
    let logIdDataOffset = 0;
    if ((options === null || options === void 0 ? void 0 : options.logId) !== void 0) {
      logIdDataOffset = string_utils_1$1.allocWasmString(options.logId, allocs);
    }
    if ((options === null || options === void 0 ? void 0 : options.logSeverityLevel) === void 0) {
      sessionOptions2.logSeverityLevel = 2;
    } else if (typeof options.logSeverityLevel !== "number" || !Number.isInteger(options.logSeverityLevel) || options.logSeverityLevel < 0 || options.logSeverityLevel > 4) {
      throw new Error(`log serverity level is not valid: ${options.logSeverityLevel}`);
    }
    if ((options === null || options === void 0 ? void 0 : options.logVerbosityLevel) === void 0) {
      sessionOptions2.logVerbosityLevel = 0;
    } else if (typeof options.logVerbosityLevel !== "number" || !Number.isInteger(options.logVerbosityLevel)) {
      throw new Error(`log verbosity level is not valid: ${options.logVerbosityLevel}`);
    }
    if ((options === null || options === void 0 ? void 0 : options.enableProfiling) === void 0) {
      sessionOptions2.enableProfiling = false;
    }
    sessionOptionsHandle = wasm2._OrtCreateSessionOptions(graphOptimizationLevel, !!sessionOptions2.enableCpuMemArena, !!sessionOptions2.enableMemPattern, executionMode, !!sessionOptions2.enableProfiling, 0, logIdDataOffset, sessionOptions2.logSeverityLevel, sessionOptions2.logVerbosityLevel);
    if (sessionOptionsHandle === 0) {
      throw new Error("Can't create session options");
    }
    if ((options === null || options === void 0 ? void 0 : options.extra) !== void 0) {
      options_utils_1.iterateExtraOptions(options.extra, "", /* @__PURE__ */ new WeakSet(), (key, value) => {
        const keyDataOffset = string_utils_1$1.allocWasmString(key, allocs);
        const valueDataOffset = string_utils_1$1.allocWasmString(value, allocs);
        if (wasm2._OrtAddSessionConfigEntry(sessionOptionsHandle, keyDataOffset, valueDataOffset) !== 0) {
          throw new Error(`Can't set a session config entry: ${key} - ${value}`);
        }
      });
    }
    return [sessionOptionsHandle, allocs];
  } catch (e) {
    if (sessionOptionsHandle !== 0) {
      wasm2._OrtReleaseSessionOptions(sessionOptionsHandle);
    }
    allocs.forEach(wasm2._free);
    throw e;
  }
};
sessionOptions.setSessionOptions = setSessionOptions;
Object.defineProperty(wasmCoreImpl, "__esModule", { value: true });
wasmCoreImpl.extractTransferableBuffers = wasmCoreImpl.endProfiling = wasmCoreImpl.run = wasmCoreImpl.releaseSession = wasmCoreImpl.createSession = wasmCoreImpl.initOrt = void 0;
const run_options_1 = runOptions;
const session_options_1 = sessionOptions;
const string_utils_1 = stringUtils;
const wasm_factory_1$1 = wasmFactory;
const initOrt$1 = (numThreads, loggingLevel) => {
  const errorCode = wasm_factory_1$1.getInstance()._OrtInit(numThreads, loggingLevel);
  if (errorCode !== 0) {
    throw new Error(`Can't initialize onnxruntime. error code = ${errorCode}`);
  }
};
wasmCoreImpl.initOrt = initOrt$1;
const activeSessions = /* @__PURE__ */ new Map();
const createSession$1 = (model2, options) => {
  const wasm2 = wasm_factory_1$1.getInstance();
  const modelDataOffset = wasm2._malloc(model2.byteLength);
  let sessionHandle = 0;
  let sessionOptionsHandle = 0;
  let allocs = [];
  try {
    [sessionOptionsHandle, allocs] = session_options_1.setSessionOptions(options);
    wasm2.HEAPU8.set(model2, modelDataOffset);
    sessionHandle = wasm2._OrtCreateSession(modelDataOffset, model2.byteLength, sessionOptionsHandle);
    if (sessionHandle === 0) {
      throw new Error("Can't create a session");
    }
  } finally {
    wasm2._free(modelDataOffset);
    wasm2._OrtReleaseSessionOptions(sessionOptionsHandle);
    allocs.forEach(wasm2._free);
  }
  const inputCount = wasm2._OrtGetInputCount(sessionHandle);
  const outputCount = wasm2._OrtGetOutputCount(sessionHandle);
  const inputNames = [];
  const inputNamesUTF8Encoded = [];
  const outputNames = [];
  const outputNamesUTF8Encoded = [];
  for (let i = 0; i < inputCount; i++) {
    const name2 = wasm2._OrtGetInputName(sessionHandle, i);
    if (name2 === 0) {
      throw new Error("Can't get an input name");
    }
    inputNamesUTF8Encoded.push(name2);
    inputNames.push(wasm2.UTF8ToString(name2));
  }
  for (let i = 0; i < outputCount; i++) {
    const name2 = wasm2._OrtGetOutputName(sessionHandle, i);
    if (name2 === 0) {
      throw new Error("Can't get an output name");
    }
    outputNamesUTF8Encoded.push(name2);
    outputNames.push(wasm2.UTF8ToString(name2));
  }
  activeSessions.set(sessionHandle, [sessionHandle, inputNamesUTF8Encoded, outputNamesUTF8Encoded]);
  return [sessionHandle, inputNames, outputNames];
};
wasmCoreImpl.createSession = createSession$1;
const releaseSession$1 = (sessionId) => {
  const wasm2 = wasm_factory_1$1.getInstance();
  const session2 = activeSessions.get(sessionId);
  if (!session2) {
    throw new Error("invalid session id");
  }
  const sessionHandle = session2[0];
  const inputNamesUTF8Encoded = session2[1];
  const outputNamesUTF8Encoded = session2[2];
  inputNamesUTF8Encoded.forEach(wasm2._OrtFree);
  outputNamesUTF8Encoded.forEach(wasm2._OrtFree);
  wasm2._OrtReleaseSession(sessionHandle);
  activeSessions.delete(sessionId);
};
wasmCoreImpl.releaseSession = releaseSession$1;
const tensorDataTypeStringToEnum = (type) => {
  switch (type) {
    case "int8":
      return 3;
    case "uint8":
      return 2;
    case "bool":
      return 9;
    case "int16":
      return 5;
    case "uint16":
      return 4;
    case "int32":
      return 6;
    case "uint32":
      return 12;
    case "float32":
      return 1;
    case "float64":
      return 11;
    case "string":
      return 8;
    case "int64":
      return 7;
    case "uint64":
      return 13;
    default:
      throw new Error(`unsupported data type: ${type}`);
  }
};
const tensorDataTypeEnumToString = (typeProto) => {
  switch (typeProto) {
    case 3:
      return "int8";
    case 2:
      return "uint8";
    case 9:
      return "bool";
    case 5:
      return "int16";
    case 4:
      return "uint16";
    case 6:
      return "int32";
    case 12:
      return "uint32";
    case 1:
      return "float32";
    case 11:
      return "float64";
    case 8:
      return "string";
    case 7:
      return "int32";
    case 13:
      return "uint32";
    default:
      throw new Error(`unsupported data type: ${typeProto}`);
  }
};
const numericTensorTypeToTypedArray = (type) => {
  switch (type) {
    case "float32":
      return Float32Array;
    case "uint8":
      return Uint8Array;
    case "int8":
      return Int8Array;
    case "uint16":
      return Uint16Array;
    case "int16":
      return Int16Array;
    case "int32":
      return Int32Array;
    case "bool":
      return Uint8Array;
    case "float64":
      return Float64Array;
    case "uint32":
      return Uint32Array;
    case "int64":
      return BigInt64Array;
    case "uint64":
      return BigUint64Array;
    default:
      throw new Error(`unsupported type: ${type}`);
  }
};
const run$1 = (sessionId, inputIndices, inputs, outputIndices, options) => {
  const wasm2 = wasm_factory_1$1.getInstance();
  const session2 = activeSessions.get(sessionId);
  if (!session2) {
    throw new Error("invalid session id");
  }
  const sessionHandle = session2[0];
  const inputNamesUTF8Encoded = session2[1];
  const outputNamesUTF8Encoded = session2[2];
  const inputCount = inputIndices.length;
  const outputCount = outputIndices.length;
  let runOptionsHandle = 0;
  let runOptionsAllocs = [];
  const inputValues = [];
  const inputAllocs = [];
  try {
    [runOptionsHandle, runOptionsAllocs] = run_options_1.setRunOptions(options);
    for (let i = 0; i < inputCount; i++) {
      const dataType = inputs[i][0];
      const dims = inputs[i][1];
      const data = inputs[i][2];
      let dataOffset;
      let dataByteLength;
      if (Array.isArray(data)) {
        dataByteLength = 4 * data.length;
        dataOffset = wasm2._malloc(dataByteLength);
        inputAllocs.push(dataOffset);
        let dataIndex = dataOffset / 4;
        for (let i2 = 0; i2 < data.length; i2++) {
          if (typeof data[i2] !== "string") {
            throw new TypeError(`tensor data at index ${i2} is not a string`);
          }
          wasm2.HEAPU32[dataIndex++] = string_utils_1.allocWasmString(data[i2], inputAllocs);
        }
      } else {
        dataByteLength = data.byteLength;
        dataOffset = wasm2._malloc(dataByteLength);
        inputAllocs.push(dataOffset);
        wasm2.HEAPU8.set(new Uint8Array(data.buffer, data.byteOffset, dataByteLength), dataOffset);
      }
      const stack = wasm2.stackSave();
      const dimsOffset = wasm2.stackAlloc(4 * dims.length);
      try {
        let dimIndex = dimsOffset / 4;
        dims.forEach((d) => wasm2.HEAP32[dimIndex++] = d);
        const tensor2 = wasm2._OrtCreateTensor(tensorDataTypeStringToEnum(dataType), dataOffset, dataByteLength, dimsOffset, dims.length);
        if (tensor2 === 0) {
          throw new Error("Can't create a tensor");
        }
        inputValues.push(tensor2);
      } finally {
        wasm2.stackRestore(stack);
      }
    }
    const beforeRunStack = wasm2.stackSave();
    const inputValuesOffset = wasm2.stackAlloc(inputCount * 4);
    const inputNamesOffset = wasm2.stackAlloc(inputCount * 4);
    const outputValuesOffset = wasm2.stackAlloc(outputCount * 4);
    const outputNamesOffset = wasm2.stackAlloc(outputCount * 4);
    try {
      let inputValuesIndex = inputValuesOffset / 4;
      let inputNamesIndex = inputNamesOffset / 4;
      let outputValuesIndex = outputValuesOffset / 4;
      let outputNamesIndex = outputNamesOffset / 4;
      for (let i = 0; i < inputCount; i++) {
        wasm2.HEAPU32[inputValuesIndex++] = inputValues[i];
        wasm2.HEAPU32[inputNamesIndex++] = inputNamesUTF8Encoded[inputIndices[i]];
      }
      for (let i = 0; i < outputCount; i++) {
        wasm2.HEAPU32[outputValuesIndex++] = 0;
        wasm2.HEAPU32[outputNamesIndex++] = outputNamesUTF8Encoded[outputIndices[i]];
      }
      let errorCode = wasm2._OrtRun(sessionHandle, inputNamesOffset, inputValuesOffset, inputCount, outputNamesOffset, outputCount, outputValuesOffset, runOptionsHandle);
      const output = [];
      if (errorCode === 0) {
        for (let i = 0; i < outputCount; i++) {
          const tensor2 = wasm2.HEAPU32[outputValuesOffset / 4 + i];
          const beforeGetTensorDataStack = wasm2.stackSave();
          const tensorDataOffset = wasm2.stackAlloc(4 * 4);
          let type, dataOffset = 0;
          try {
            errorCode = wasm2._OrtGetTensorData(tensor2, tensorDataOffset, tensorDataOffset + 4, tensorDataOffset + 8, tensorDataOffset + 12);
            if (errorCode !== 0) {
              throw new Error(`Can't get a tensor data. error code = ${errorCode}`);
            }
            let tensorDataIndex = tensorDataOffset / 4;
            const dataType = wasm2.HEAPU32[tensorDataIndex++];
            dataOffset = wasm2.HEAPU32[tensorDataIndex++];
            const dimsOffset = wasm2.HEAPU32[tensorDataIndex++];
            const dimsLength = wasm2.HEAPU32[tensorDataIndex++];
            const dims = [];
            for (let i2 = 0; i2 < dimsLength; i2++) {
              dims.push(wasm2.HEAPU32[dimsOffset / 4 + i2]);
            }
            wasm2._OrtFree(dimsOffset);
            const size = dims.length === 0 ? 1 : dims.reduce((a, b) => a * b);
            type = tensorDataTypeEnumToString(dataType);
            if (type === "string") {
              const stringData = [];
              let dataIndex = dataOffset / 4;
              for (let i2 = 0; i2 < size; i2++) {
                const offset = wasm2.HEAPU32[dataIndex++];
                const maxBytesToRead = i2 === size - 1 ? void 0 : wasm2.HEAPU32[dataIndex] - offset;
                stringData.push(wasm2.UTF8ToString(offset, maxBytesToRead));
              }
              output.push([type, dims, stringData]);
            } else {
              const typedArrayConstructor = numericTensorTypeToTypedArray(type);
              const data = new typedArrayConstructor(size);
              new Uint8Array(data.buffer, data.byteOffset, data.byteLength).set(wasm2.HEAPU8.subarray(dataOffset, dataOffset + data.byteLength));
              output.push([type, dims, data]);
            }
          } finally {
            wasm2.stackRestore(beforeGetTensorDataStack);
            if (type === "string" && dataOffset) {
              wasm2._free(dataOffset);
            }
            wasm2._OrtReleaseTensor(tensor2);
          }
        }
      }
      if (errorCode === 0) {
        return output;
      } else {
        throw new Error(`failed to call OrtRun(). error code = ${errorCode}.`);
      }
    } finally {
      wasm2.stackRestore(beforeRunStack);
    }
  } finally {
    inputValues.forEach(wasm2._OrtReleaseTensor);
    inputAllocs.forEach(wasm2._free);
    wasm2._OrtReleaseRunOptions(runOptionsHandle);
    runOptionsAllocs.forEach(wasm2._free);
  }
};
wasmCoreImpl.run = run$1;
const endProfiling$1 = (sessionId) => {
  const wasm2 = wasm_factory_1$1.getInstance();
  const session2 = activeSessions.get(sessionId);
  if (!session2) {
    throw new Error("invalid session id");
  }
  const sessionHandle = session2[0];
  const profileFileName = wasm2._OrtEndProfiling(sessionHandle);
  if (profileFileName === 0) {
    throw new Error("Can't get an profile file name");
  }
  wasm2._OrtFree(profileFileName);
};
wasmCoreImpl.endProfiling = endProfiling$1;
const extractTransferableBuffers = (tensors) => {
  const buffers = [];
  for (const tensor2 of tensors) {
    const data = tensor2[2];
    if (!Array.isArray(data) && data.buffer) {
      buffers.push(data.buffer);
    }
  }
  return buffers;
};
wasmCoreImpl.extractTransferableBuffers = extractTransferableBuffers;
function WorkerWrapper() {
  return new Worker("/worker.js", {
    "type": "module"
  });
}
var main = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": WorkerWrapper
}, Symbol.toStringTag, { value: "Module" }));
var require$$3 = /* @__PURE__ */ getAugmentedNamespace(main);
var __createBinding = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(o, m, k, k2) {
  if (k2 === void 0)
    k2 = k;
  Object.defineProperty(o, k2, { enumerable: true, get: function() {
    return m[k];
  } });
} : function(o, m, k, k2) {
  if (k2 === void 0)
    k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = commonjsGlobal && commonjsGlobal.__setModuleDefault || (Object.create ? function(o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
} : function(o, v) {
  o["default"] = v;
});
var __importStar = commonjsGlobal && commonjsGlobal.__importStar || function(mod2) {
  if (mod2 && mod2.__esModule)
    return mod2;
  var result = {};
  if (mod2 != null) {
    for (var k in mod2)
      if (k !== "default" && Object.prototype.hasOwnProperty.call(mod2, k))
        __createBinding(result, mod2, k);
  }
  __setModuleDefault(result, mod2);
  return result;
};
var _a;
Object.defineProperty(proxyWrapper, "__esModule", { value: true });
proxyWrapper.endProfiling = proxyWrapper.run = proxyWrapper.releaseSession = proxyWrapper.createSession = proxyWrapper.initOrt = proxyWrapper.initWasm = void 0;
const onnxruntime_common_1$1 = require$$0$1;
const core = __importStar(wasmCoreImpl);
const wasm_factory_1 = wasmFactory;
const isProxy = () => !!onnxruntime_common_1$1.env.wasm.proxy && typeof document !== "undefined";
let proxyWorker;
let initializing = false;
let initialized = false;
let aborted = false;
let initWasmCallbacks;
let initOrtCallbacks;
const createSessionCallbacks = [];
const releaseSessionCallbacks = [];
const runCallbacks = [];
const endProfilingCallbacks = [];
const ensureWorker = () => {
  if (initializing || !initialized || aborted || !proxyWorker) {
    throw new Error("worker not ready");
  }
};
const onProxyWorkerMessage = (ev) => {
  switch (ev.data.type) {
    case "init-wasm":
      initializing = false;
      if (ev.data.err) {
        aborted = true;
        initWasmCallbacks[1](ev.data.err);
      } else {
        initialized = true;
        initWasmCallbacks[0]();
      }
      break;
    case "init-ort":
      if (ev.data.err) {
        initOrtCallbacks[1](ev.data.err);
      } else {
        initOrtCallbacks[0]();
      }
      break;
    case "create":
      if (ev.data.err) {
        createSessionCallbacks.shift()[1](ev.data.err);
      } else {
        createSessionCallbacks.shift()[0](ev.data.out);
      }
      break;
    case "release":
      if (ev.data.err) {
        releaseSessionCallbacks.shift()[1](ev.data.err);
      } else {
        releaseSessionCallbacks.shift()[0]();
      }
      break;
    case "run":
      if (ev.data.err) {
        runCallbacks.shift()[1](ev.data.err);
      } else {
        runCallbacks.shift()[0](ev.data.out);
      }
      break;
    case "end-profiling":
      if (ev.data.err) {
        endProfilingCallbacks.shift()[1](ev.data.err);
      } else {
        endProfilingCallbacks.shift()[0]();
      }
      break;
  }
};
const scriptSrc = typeof document !== "undefined" ? (_a = document === null || document === void 0 ? void 0 : document.currentScript) === null || _a === void 0 ? void 0 : _a.src : void 0;
const initWasm = async () => {
  if (isProxy()) {
    if (initialized) {
      return;
    }
    if (initializing) {
      throw new Error("multiple calls to 'initWasm()' detected.");
    }
    if (aborted) {
      throw new Error("previous call to 'initWasm()' failed.");
    }
    initializing = true;
    if (onnxruntime_common_1$1.env.wasm.wasmPaths === void 0) {
      if (scriptSrc && scriptSrc.indexOf("blob:") !== 0) {
        onnxruntime_common_1$1.env.wasm.wasmPaths = scriptSrc.substr(0, scriptSrc.lastIndexOf("/") + 1);
      }
    }
    return new Promise((resolve, reject) => {
      proxyWorker === null || proxyWorker === void 0 ? void 0 : proxyWorker.terminate();
      proxyWorker = require$$3.default();
      proxyWorker.onmessage = onProxyWorkerMessage;
      initWasmCallbacks = [resolve, reject];
      const message = { type: "init-wasm", in: onnxruntime_common_1$1.env.wasm };
      proxyWorker.postMessage(message);
    });
  } else {
    return wasm_factory_1.initializeWebAssembly(onnxruntime_common_1$1.env.wasm);
  }
};
proxyWrapper.initWasm = initWasm;
const initOrt = async (numThreads, loggingLevel) => {
  if (isProxy()) {
    ensureWorker();
    return new Promise((resolve, reject) => {
      initOrtCallbacks = [resolve, reject];
      const message = { type: "init-ort", in: { numThreads, loggingLevel } };
      proxyWorker.postMessage(message);
    });
  } else {
    core.initOrt(numThreads, loggingLevel);
  }
};
proxyWrapper.initOrt = initOrt;
const createSession = async (model2, options) => {
  if (isProxy()) {
    ensureWorker();
    return new Promise((resolve, reject) => {
      createSessionCallbacks.push([resolve, reject]);
      const message = { type: "create", in: { model: model2, options } };
      proxyWorker.postMessage(message, [model2.buffer]);
    });
  } else {
    return core.createSession(model2, options);
  }
};
proxyWrapper.createSession = createSession;
const releaseSession = async (sessionId) => {
  if (isProxy()) {
    ensureWorker();
    return new Promise((resolve, reject) => {
      releaseSessionCallbacks.push([resolve, reject]);
      const message = { type: "release", in: sessionId };
      proxyWorker.postMessage(message);
    });
  } else {
    core.releaseSession(sessionId);
  }
};
proxyWrapper.releaseSession = releaseSession;
const run = async (sessionId, inputIndices, inputs, outputIndices, options) => {
  if (isProxy()) {
    ensureWorker();
    return new Promise((resolve, reject) => {
      runCallbacks.push([resolve, reject]);
      const message = { type: "run", in: { sessionId, inputIndices, inputs, outputIndices, options } };
      proxyWorker.postMessage(message, core.extractTransferableBuffers(inputs));
    });
  } else {
    return core.run(sessionId, inputIndices, inputs, outputIndices, options);
  }
};
proxyWrapper.run = run;
const endProfiling = async (sessionId) => {
  if (isProxy()) {
    ensureWorker();
    return new Promise((resolve, reject) => {
      endProfilingCallbacks.push([resolve, reject]);
      const message = { type: "end-profiling", in: sessionId };
      proxyWorker.postMessage(message);
    });
  } else {
    core.endProfiling(sessionId);
  }
};
proxyWrapper.endProfiling = endProfiling;
var sessionHandler = {};
Object.defineProperty(sessionHandler, "__esModule", { value: true });
sessionHandler.OnnxruntimeWebAssemblySessionHandler = void 0;
const onnxruntime_common_1 = require$$0$1;
const proxy_wrapper_1 = proxyWrapper;
let ortInit;
const getLogLevel = (logLevel) => {
  switch (logLevel) {
    case "verbose":
      return 0;
    case "info":
      return 1;
    case "warning":
      return 2;
    case "error":
      return 3;
    case "fatal":
      return 4;
    default:
      throw new Error(`unsupported logging level: ${logLevel}`);
  }
};
class OnnxruntimeWebAssemblySessionHandler {
  async loadModel(model2, options) {
    if (!ortInit) {
      await proxy_wrapper_1.initOrt(onnxruntime_common_1.env.wasm.numThreads, getLogLevel(onnxruntime_common_1.env.logLevel));
      ortInit = true;
    }
    [this.sessionId, this.inputNames, this.outputNames] = await proxy_wrapper_1.createSession(model2, options);
  }
  async dispose() {
    return proxy_wrapper_1.releaseSession(this.sessionId);
  }
  async run(feeds, fetches, options) {
    const inputArray = [];
    const inputIndices = [];
    Object.entries(feeds).forEach((kvp) => {
      const name2 = kvp[0];
      const tensor2 = kvp[1];
      const index = this.inputNames.indexOf(name2);
      if (index === -1) {
        throw new Error(`invalid input '${name2}'`);
      }
      inputArray.push(tensor2);
      inputIndices.push(index);
    });
    const outputIndices = [];
    Object.entries(fetches).forEach((kvp) => {
      const name2 = kvp[0];
      const index = this.outputNames.indexOf(name2);
      if (index === -1) {
        throw new Error(`invalid output '${name2}'`);
      }
      outputIndices.push(index);
    });
    const outputs = await proxy_wrapper_1.run(this.sessionId, inputIndices, inputArray.map((t) => [t.type, t.dims, t.data]), outputIndices, options);
    const result = {};
    for (let i = 0; i < outputs.length; i++) {
      result[this.outputNames[outputIndices[i]]] = new onnxruntime_common_1.Tensor(outputs[i][0], outputs[i][2], outputs[i][1]);
    }
    return result;
  }
  startProfiling() {
  }
  endProfiling() {
    void proxy_wrapper_1.endProfiling(this.sessionId);
  }
}
sessionHandler.OnnxruntimeWebAssemblySessionHandler = OnnxruntimeWebAssemblySessionHandler;
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.wasmBackend = exports.initializeFlags = void 0;
  const fs_12 = require$$3$1;
  const onnxruntime_common_12 = require$$0$1;
  const os_1 = require$$3$1;
  const util_12 = require$$3$1;
  const proxy_wrapper_12 = proxyWrapper;
  const session_handler_12 = sessionHandler;
  const initializeFlags = () => {
    if (typeof onnxruntime_common_12.env.wasm.initTimeout !== "number" || onnxruntime_common_12.env.wasm.initTimeout < 0) {
      onnxruntime_common_12.env.wasm.initTimeout = 0;
    }
    if (typeof onnxruntime_common_12.env.wasm.simd !== "boolean") {
      onnxruntime_common_12.env.wasm.simd = true;
    }
    if (typeof onnxruntime_common_12.env.wasm.proxy !== "boolean") {
      onnxruntime_common_12.env.wasm.proxy = false;
    }
    if (typeof onnxruntime_common_12.env.wasm.numThreads !== "number" || !Number.isInteger(onnxruntime_common_12.env.wasm.numThreads) || onnxruntime_common_12.env.wasm.numThreads <= 0) {
      const numCpuLogicalCores = typeof navigator === "undefined" ? os_1.cpus().length : navigator.hardwareConcurrency;
      onnxruntime_common_12.env.wasm.numThreads = Math.min(4, Math.ceil((numCpuLogicalCores || 1) / 2));
    }
  };
  exports.initializeFlags = initializeFlags;
  class OnnxruntimeWebAssemblyBackend {
    async init() {
      exports.initializeFlags();
      await proxy_wrapper_12.initWasm();
    }
    async createSessionHandler(pathOrBuffer, options) {
      let buffer;
      if (typeof pathOrBuffer === "string") {
        if (typeof fetch === "undefined") {
          buffer = await util_12.promisify(fs_12.readFile)(pathOrBuffer);
        } else {
          const response = await fetch(pathOrBuffer);
          const arrayBuffer = await response.arrayBuffer();
          buffer = new Uint8Array(arrayBuffer);
        }
      } else {
        buffer = pathOrBuffer;
      }
      const handler = new session_handler_12.OnnxruntimeWebAssemblySessionHandler();
      await handler.loadModel(buffer, options);
      return Promise.resolve(handler);
    }
  }
  exports.wasmBackend = new OnnxruntimeWebAssemblyBackend();
})(backendWasm);
(function(exports) {
  var __createBinding2 = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = commonjsGlobal && commonjsGlobal.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding2(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require$$0$1, exports);
  const onnxruntime_common_12 = require$$0$1;
  {
    const onnxjsBackend = backendOnnxjs.onnxjsBackend;
    onnxruntime_common_12.registerBackend("webgl", onnxjsBackend, -1);
  }
  {
    const wasmBackend = backendWasm.wasmBackend;
    onnxruntime_common_12.registerBackend("wasm", wasmBackend, 0);
  }
})(lib$1);
export default lib$1