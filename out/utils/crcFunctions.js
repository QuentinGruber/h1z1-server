"use strict";
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module !== 'undefined' ? Module : {};
// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// {{PRE_JSES}}
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
    if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key];
    }
}
var arguments_ = [];
var thisProgram = './this.program';
var quit_ = function (status, toThrow) {
    throw toThrow;
};
// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string';
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (Module['ENVIRONMENT']) {
    throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)');
}
// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
    if (Module['locateFile']) {
        return Module['locateFile'](path, scriptDirectory);
    }
    return scriptDirectory + path;
}
// Hooks that are implemented differently in different runtime environments.
var read_, readAsync, readBinary, setWindowTitle;
var nodeFS;
var nodePath;
if (ENVIRONMENT_IS_NODE) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = require('path').dirname(scriptDirectory) + '/';
    }
    else {
        scriptDirectory = __dirname + '/';
    }
    // include: node_shell_read.js
    read_ = function shell_read(filename, binary) {
        var ret = tryParseAsDataURI(filename);
        if (ret) {
            return binary ? ret : ret.toString();
        }
        if (!nodeFS)
            nodeFS = require('fs');
        if (!nodePath)
            nodePath = require('path');
        filename = nodePath['normalize'](filename);
        return nodeFS['readFileSync'](filename, binary ? null : 'utf8');
    };
    readBinary = function readBinary(filename) {
        var ret = read_(filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret);
        }
        assert(ret.buffer);
        return ret;
    };
    // end include: node_shell_read.js
    if (process['argv'].length > 1) {
        thisProgram = process['argv'][1].replace(/\\/g, '/');
    }
    arguments_ = process['argv'].slice(2);
    if (typeof module !== 'undefined') {
        module['exports'] = Module;
    }
    process['on']('uncaughtException', function (ex) {
        // suppress ExitStatus exceptions from showing an error
        if (!(ex instanceof ExitStatus)) {
            throw ex;
        }
    });
    process['on']('unhandledRejection', abort);
    quit_ = function (status) {
        process['exit'](status);
    };
    Module['inspect'] = function () { return '[Emscripten Module object]'; };
}
else if (ENVIRONMENT_IS_SHELL) {
    if (typeof read != 'undefined') {
        read_ = function shell_read(f) {
            var data = tryParseAsDataURI(f);
            if (data) {
                return intArrayToString(data);
            }
            return read(f);
        };
    }
    readBinary = function readBinary(f) {
        var data;
        data = tryParseAsDataURI(f);
        if (data) {
            return data;
        }
        if (typeof readbuffer === 'function') {
            return new Uint8Array(readbuffer(f));
        }
        data = read(f, 'binary');
        assert(typeof data === 'object');
        return data;
    };
    if (typeof scriptArgs != 'undefined') {
        arguments_ = scriptArgs;
    }
    else if (typeof arguments != 'undefined') {
        arguments_ = arguments;
    }
    if (typeof quit === 'function') {
        quit_ = function (status) {
            quit(status);
        };
    }
    if (typeof print !== 'undefined') {
        // Prefer to use print/printErr where they exist, as they usually work better.
        if (typeof console === 'undefined')
            console = /** @type{!Console} */ ({});
        console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
        console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr !== 'undefined' ? printErr : print);
    }
}
else 
// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
        scriptDirectory = self.location.href;
    }
    else if (typeof document !== 'undefined' && document.currentScript) { // web
        scriptDirectory = document.currentScript.src;
    }
    // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
    // otherwise, slice off the final part of the url to find the script directory.
    // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
    // and scriptDirectory will correctly be replaced with an empty string.
    if (scriptDirectory.indexOf('blob:') !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/') + 1);
    }
    else {
        scriptDirectory = '';
    }
    // Differentiate the Web Worker from the Node Worker case, as reading must
    // be done differently.
    {
        // include: web_or_worker_shell_read.js
        read_ = function shell_read(url) {
            try {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                xhr.send(null);
                return xhr.responseText;
            }
            catch (err) {
                var data = tryParseAsDataURI(url);
                if (data) {
                    return intArrayToString(data);
                }
                throw err;
            }
        };
        if (ENVIRONMENT_IS_WORKER) {
            readBinary = function readBinary(url) {
                try {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, false);
                    xhr.responseType = 'arraybuffer';
                    xhr.send(null);
                    return new Uint8Array(/** @type{!ArrayBuffer} */ (xhr.response));
                }
                catch (err) {
                    var data = tryParseAsDataURI(url);
                    if (data) {
                        return data;
                    }
                    throw err;
                }
            };
        }
        readAsync = function readAsync(url, onload, onerror) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function xhr_onload() {
                if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
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
        // end include: web_or_worker_shell_read.js
    }
    setWindowTitle = function (title) { document.title = title; };
}
else {
    throw new Error('environment detection error');
}
// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.warn.bind(console);
// Merge back in the overrides
for (key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key];
    }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;
// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.
if (Module['arguments'])
    arguments_ = Module['arguments'];
if (!Object.getOwnPropertyDescriptor(Module, 'arguments'))
    Object.defineProperty(Module, 'arguments', { configurable: true, get: function () { abort('Module.arguments has been replaced with plain arguments_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)'); } });
if (Module['thisProgram'])
    thisProgram = Module['thisProgram'];
if (!Object.getOwnPropertyDescriptor(Module, 'thisProgram'))
    Object.defineProperty(Module, 'thisProgram', { configurable: true, get: function () { abort('Module.thisProgram has been replaced with plain thisProgram (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)'); } });
if (Module['quit'])
    quit_ = Module['quit'];
if (!Object.getOwnPropertyDescriptor(Module, 'quit'))
    Object.defineProperty(Module, 'quit', { configurable: true, get: function () { abort('Module.quit has been replaced with plain quit_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)'); } });
// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module['memoryInitializerPrefixURL'] === 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] === 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] === 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] === 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] === 'undefined', 'Module.read option was removed (modify read_ in JS)');
assert(typeof Module['readAsync'] === 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] === 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] === 'undefined', 'Module.setWindowTitle option was removed (modify setWindowTitle in JS)');
assert(typeof Module['TOTAL_MEMORY'] === 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
if (!Object.getOwnPropertyDescriptor(Module, 'read'))
    Object.defineProperty(Module, 'read', { configurable: true, get: function () { abort('Module.read has been replaced with plain read_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)'); } });
if (!Object.getOwnPropertyDescriptor(Module, 'readAsync'))
    Object.defineProperty(Module, 'readAsync', { configurable: true, get: function () { abort('Module.readAsync has been replaced with plain readAsync (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)'); } });
if (!Object.getOwnPropertyDescriptor(Module, 'readBinary'))
    Object.defineProperty(Module, 'readBinary', { configurable: true, get: function () { abort('Module.readBinary has been replaced with plain readBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)'); } });
if (!Object.getOwnPropertyDescriptor(Module, 'setWindowTitle'))
    Object.defineProperty(Module, 'setWindowTitle', { configurable: true, get: function () { abort('Module.setWindowTitle has been replaced with plain setWindowTitle (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)'); } });
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';
var STACK_ALIGN = 16;
function alignMemory(size, factor) {
    if (!factor)
        factor = STACK_ALIGN; // stack alignment (16-byte) by default
    return Math.ceil(size / factor) * factor;
}
function getNativeTypeSize(type) {
    switch (type) {
        case 'i1':
        case 'i8': return 1;
        case 'i16': return 2;
        case 'i32': return 4;
        case 'i64': return 8;
        case 'float': return 4;
        case 'double': return 8;
        default: {
            if (type[type.length - 1] === '*') {
                return 4; // A pointer
            }
            else if (type[0] === 'i') {
                var bits = Number(type.substr(1));
                assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
                return bits / 8;
            }
            else {
                return 0;
            }
        }
    }
}
function warnOnce(text) {
    if (!warnOnce.shown)
        warnOnce.shown = {};
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
    }
}
// include: runtime_functions.js
// Wraps a JS function as a wasm function with a given signature.
function convertJsFunctionToWasm(func, sig) {
    // If the type reflection proposal is available, use the new
    // "WebAssembly.Function" constructor.
    // Otherwise, construct a minimal wasm module importing the JS function and
    // re-exporting it.
    if (typeof WebAssembly.Function === "function") {
        var typeNames = {
            'i': 'i32',
            'j': 'i64',
            'f': 'f32',
            'd': 'f64'
        };
        var type = {
            parameters: [],
            results: sig[0] == 'v' ? [] : [typeNames[sig[0]]]
        };
        for (var i = 1; i < sig.length; ++i) {
            type.parameters.push(typeNames[sig[i]]);
        }
        return new WebAssembly.Function(type, func);
    }
    // The module is static, with the exception of the type section, which is
    // generated based on the signature passed in.
    var typeSection = [
        0x01,
        0x00,
        0x01,
        0x60,
    ];
    var sigRet = sig.slice(0, 1);
    var sigParam = sig.slice(1);
    var typeCodes = {
        'i': 0x7f,
        'j': 0x7e,
        'f': 0x7d,
        'd': 0x7c,
    };
    // Parameters, length + signatures
    typeSection.push(sigParam.length);
    for (var i = 0; i < sigParam.length; ++i) {
        typeSection.push(typeCodes[sigParam[i]]);
    }
    // Return values, length + signatures
    // With no multi-return in MVP, either 0 (void) or 1 (anything else)
    if (sigRet == 'v') {
        typeSection.push(0x00);
    }
    else {
        typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
    }
    // Write the overall length of the type section back into the section header
    // (excepting the 2 bytes for the section id and length)
    typeSection[1] = typeSection.length - 2;
    // Rest of the module is static
    var bytes = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d,
        0x01, 0x00, 0x00, 0x00,
    ].concat(typeSection, [
        0x02, 0x07,
        // (import "e" "f" (func 0 (type 0)))
        0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
        0x07, 0x05,
        // (export "f" (func 0 (type 0)))
        0x01, 0x01, 0x66, 0x00, 0x00,
    ]));
    // We can compile this wasm module synchronously because it is very small.
    // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
    var module = new WebAssembly.Module(bytes);
    var instance = new WebAssembly.Instance(module, {
        'e': {
            'f': func
        }
    });
    var wrappedFunc = instance.exports['f'];
    return wrappedFunc;
}
var freeTableIndexes = [];
// Weak map of functions in the table to their indexes, created on first use.
var functionsInTableMap;
function getEmptyTableSlot() {
    // Reuse a free index if there is one, otherwise grow.
    if (freeTableIndexes.length) {
        return freeTableIndexes.pop();
    }
    // Grow the table
    try {
        wasmTable.grow(1);
    }
    catch (err) {
        if (!(err instanceof RangeError)) {
            throw err;
        }
        throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.';
    }
    return wasmTable.length - 1;
}
// Add a wasm function to the table.
function addFunctionWasm(func, sig) {
    // Check if the function is already in the table, to ensure each function
    // gets a unique index. First, create the map if this is the first use.
    if (!functionsInTableMap) {
        functionsInTableMap = new WeakMap();
        for (var i = 0; i < wasmTable.length; i++) {
            var item = wasmTable.get(i);
            // Ignore null values.
            if (item) {
                functionsInTableMap.set(item, i);
            }
        }
    }
    if (functionsInTableMap.has(func)) {
        return functionsInTableMap.get(func);
    }
    // It's not in the table, add it now.
    var ret = getEmptyTableSlot();
    // Set the new value.
    try {
        // Attempting to call this with JS function will cause of table.set() to fail
        wasmTable.set(ret, func);
    }
    catch (err) {
        if (!(err instanceof TypeError)) {
            throw err;
        }
        assert(typeof sig !== 'undefined', 'Missing signature argument to addFunction: ' + func);
        var wrapped = convertJsFunctionToWasm(func, sig);
        wasmTable.set(ret, wrapped);
    }
    functionsInTableMap.set(func, ret);
    return ret;
}
function removeFunction(index) {
    functionsInTableMap.delete(wasmTable.get(index));
    freeTableIndexes.push(index);
}
// 'sig' parameter is required for the llvm backend but only when func is not
// already a WebAssembly function.
function addFunction(func, sig) {
    assert(typeof func !== 'undefined');
    return addFunctionWasm(func, sig);
}
// end include: runtime_functions.js
// include: runtime_debug.js
// end include: runtime_debug.js
function makeBigInt(low, high, unsigned) {
    return unsigned ? ((+((low >>> 0))) + ((+((high >>> 0))) * 4294967296.0)) : ((+((low >>> 0))) + ((+((high | 0))) * 4294967296.0));
}
var tempRet0 = 0;
var setTempRet0 = function (value) {
    tempRet0 = value;
};
var getTempRet0 = function () {
    return tempRet0;
};
function getCompilerSetting(name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for getCompilerSetting or emscripten_get_compiler_setting to work';
}
// === Preamble library stuff ===
// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html
var wasmBinary;
if (Module['wasmBinary'])
    wasmBinary = Module['wasmBinary'];
if (!Object.getOwnPropertyDescriptor(Module, 'wasmBinary'))
    Object.defineProperty(Module, 'wasmBinary', { configurable: true, get: function () { abort('Module.wasmBinary has been replaced with plain wasmBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)'); } });
var noExitRuntime;
if (Module['noExitRuntime'])
    noExitRuntime = Module['noExitRuntime'];
if (!Object.getOwnPropertyDescriptor(Module, 'noExitRuntime'))
    Object.defineProperty(Module, 'noExitRuntime', { configurable: true, get: function () { abort('Module.noExitRuntime has been replaced with plain noExitRuntime (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)'); } });
if (typeof WebAssembly !== 'object') {
    abort('no native wasm support detected');
}
// include: runtime_safe_heap.js
// In MINIMAL_RUNTIME, setValue() and getValue() are only available when building with safe heap enabled, for heap safety checking.
// In traditional runtime, setValue() and getValue() are always available (although their use is highly discouraged due to perf penalties)
/** @param {number} ptr
    @param {number} value
    @param {string} type
    @param {number|boolean=} noSafe */
function setValue(ptr, value, type, noSafe) {
    type = type || 'i8';
    if (type.charAt(type.length - 1) === '*')
        type = 'i32'; // pointers are 32-bit
    switch (type) {
        case 'i1':
            HEAP8[((ptr) >> 0)] = value;
            break;
        case 'i8':
            HEAP8[((ptr) >> 0)] = value;
            break;
        case 'i16':
            HEAP16[((ptr) >> 1)] = value;
            break;
        case 'i32':
            HEAP32[((ptr) >> 2)] = value;
            break;
        case 'i64':
            (tempI64 = [value >>> 0, (tempDouble = value, (+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble) / 4294967296.0))), 4294967295.0)) | 0) >>> 0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble))) >>> 0)) / 4294967296.0))))) >>> 0) : 0)], HEAP32[((ptr) >> 2)] = tempI64[0], HEAP32[(((ptr) + (4)) >> 2)] = tempI64[1]);
            break;
        case 'float':
            HEAPF32[((ptr) >> 2)] = value;
            break;
        case 'double':
            HEAPF64[((ptr) >> 3)] = value;
            break;
        default: abort('invalid type for setValue: ' + type);
    }
}
/** @param {number} ptr
    @param {string} type
    @param {number|boolean=} noSafe */
function getValue(ptr, type, noSafe) {
    type = type || 'i8';
    if (type.charAt(type.length - 1) === '*')
        type = 'i32'; // pointers are 32-bit
    switch (type) {
        case 'i1': return HEAP8[((ptr) >> 0)];
        case 'i8': return HEAP8[((ptr) >> 0)];
        case 'i16': return HEAP16[((ptr) >> 1)];
        case 'i32': return HEAP32[((ptr) >> 2)];
        case 'i64': return HEAP32[((ptr) >> 2)];
        case 'float': return HEAPF32[((ptr) >> 2)];
        case 'double': return HEAPF64[((ptr) >> 3)];
        default: abort('invalid type for getValue: ' + type);
    }
    return null;
}
// end include: runtime_safe_heap.js
// Wasm globals
var wasmMemory;
//========================================
// Runtime essentials
//========================================
// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;
// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS = 0;
/** @type {function(*, string=)} */
function assert(condition, text) {
    if (!condition) {
        abort('Assertion failed: ' + text);
    }
}
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
    var func = Module['_' + ident]; // closure exported function
    assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
    return func;
}
// C calling interface.
/** @param {string|null=} returnType
    @param {Array=} argTypes
    @param {Arguments|Array=} args
    @param {Object=} opts */
function ccall(ident, returnType, argTypes, args, opts) {
    // For fast lookup of conversion functions
    var toC = {
        'string': function (str) {
            var ret = 0;
            if (str !== null && str !== undefined && str !== 0) { // null string
                // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
                var len = (str.length << 2) + 1;
                ret = stackAlloc(len);
                stringToUTF8(str, ret, len);
            }
            return ret;
        },
        'array': function (arr) {
            var ret = stackAlloc(arr.length);
            writeArrayToMemory(arr, ret);
            return ret;
        }
    };
    function convertReturnValue(ret) {
        if (returnType === 'string')
            return UTF8ToString(ret);
        if (returnType === 'boolean')
            return Boolean(ret);
        return ret;
    }
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    assert(returnType !== 'array', 'Return type should not be "array".');
    if (args) {
        for (var i = 0; i < args.length; i++) {
            var converter = toC[argTypes[i]];
            if (converter) {
                if (stack === 0)
                    stack = stackSave();
                cArgs[i] = converter(args[i]);
            }
            else {
                cArgs[i] = args[i];
            }
        }
    }
    var ret = func.apply(null, cArgs);
    ret = convertReturnValue(ret);
    if (stack !== 0)
        stackRestore(stack);
    return ret;
}
/** @param {string=} returnType
    @param {Array=} argTypes
    @param {Object=} opts */
function cwrap(ident, returnType, argTypes, opts) {
    return function () {
        return ccall(ident, returnType, argTypes, arguments, opts);
    };
}
// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.
function _malloc() {
    abort("malloc() called but not included in the build - add '_malloc' to EXPORTED_FUNCTIONS");
}
function _free() {
    // Show a helpful error since we used to include free by default in the past.
    abort("free() called but not included in the build - add '_free' to EXPORTED_FUNCTIONS");
}
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((Uint8Array|Array<number>), number)} */
function allocate(slab, allocator) {
    var ret;
    assert(typeof allocator === 'number', 'allocate no longer takes a type argument');
    assert(typeof slab !== 'number', 'allocate no longer takes a number as arg0');
    if (allocator == ALLOC_STACK) {
        ret = stackAlloc(slab.length);
    }
    else {
        ret = abort('malloc was not included, but is needed in allocate. Adding "_malloc" to EXPORTED_FUNCTIONS should fix that. This may be a bug in the compiler, please file an issue.');
        ;
    }
    if (slab.subarray || slab.slice) {
        HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    }
    else {
        HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
}
// include: runtime_strings.js
// runtime_strings.js: Strings related runtime functions that are part of both MINIMAL_RUNTIME and regular runtime.
// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.
var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;
/**
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(heap, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
    // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
    // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
    while (heap[endPtr] && !(endPtr >= endIdx))
        ++endPtr;
    if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(heap.subarray(idx, endPtr));
    }
    else {
        var str = '';
        // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
        while (idx < endPtr) {
            // For UTF8 byte structure, see:
            // http://en.wikipedia.org/wiki/UTF-8#Description
            // https://www.ietf.org/rfc/rfc2279.txt
            // https://tools.ietf.org/html/rfc3629
            var u0 = heap[idx++];
            if (!(u0 & 0x80)) {
                str += String.fromCharCode(u0);
                continue;
            }
            var u1 = heap[idx++] & 63;
            if ((u0 & 0xE0) == 0xC0) {
                str += String.fromCharCode(((u0 & 31) << 6) | u1);
                continue;
            }
            var u2 = heap[idx++] & 63;
            if ((u0 & 0xF0) == 0xE0) {
                u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
            }
            else {
                if ((u0 & 0xF8) != 0xF0)
                    warnOnce('Invalid UTF-8 leading byte 0x' + u0.toString(16) + ' encountered when deserializing a UTF-8 string on the asm.js/wasm heap to a JS string!');
                u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heap[idx++] & 63);
            }
            if (u0 < 0x10000) {
                str += String.fromCharCode(u0);
            }
            else {
                var ch = u0 - 0x10000;
                str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
            }
        }
    }
    return str;
}
// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
// copy of that string as a Javascript String object.
// maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
//                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
//                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
//                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
//                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
//                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
//                 throw JS JIT optimizations off, so it is worth to consider consistently using one
//                 style or the other.
/**
 * @param {number} ptr
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}
// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   heap: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.
function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
        return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
    for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
        var u = str.charCodeAt(i); // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF) {
            var u1 = str.charCodeAt(++i);
            u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
        }
        if (u <= 0x7F) {
            if (outIdx >= endIdx)
                break;
            heap[outIdx++] = u;
        }
        else if (u <= 0x7FF) {
            if (outIdx + 1 >= endIdx)
                break;
            heap[outIdx++] = 0xC0 | (u >> 6);
            heap[outIdx++] = 0x80 | (u & 63);
        }
        else if (u <= 0xFFFF) {
            if (outIdx + 2 >= endIdx)
                break;
            heap[outIdx++] = 0xE0 | (u >> 12);
            heap[outIdx++] = 0x80 | ((u >> 6) & 63);
            heap[outIdx++] = 0x80 | (u & 63);
        }
        else {
            if (outIdx + 3 >= endIdx)
                break;
            if (u >= 0x200000)
                warnOnce('Invalid Unicode code point 0x' + u.toString(16) + ' encountered when serializing a JS string to an UTF-8 string on the asm.js/wasm heap! (Valid unicode code points should be in range 0-0x1FFFFF).');
            heap[outIdx++] = 0xF0 | (u >> 18);
            heap[outIdx++] = 0x80 | ((u >> 12) & 63);
            heap[outIdx++] = 0x80 | ((u >> 6) & 63);
            heap[outIdx++] = 0x80 | (u & 63);
        }
    }
    // Null-terminate the pointer to the buffer.
    heap[outIdx] = 0;
    return outIdx - startIdx;
}
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.
function stringToUTF8(str, outPtr, maxBytesToWrite) {
    assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var u = str.charCodeAt(i); // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF)
            u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
        if (u <= 0x7F)
            ++len;
        else if (u <= 0x7FF)
            len += 2;
        else if (u <= 0xFFFF)
            len += 3;
        else
            len += 4;
    }
    return len;
}
// end include: runtime_strings.js
// include: runtime_strings_extra.js
// runtime_strings_extra.js: Strings related runtime functions that are available only in regular runtime.
// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function AsciiToString(ptr) {
    var str = '';
    while (1) {
        var ch = HEAPU8[((ptr++) >> 0)];
        if (!ch)
            return str;
        str += String.fromCharCode(ch);
    }
}
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.
function stringToAscii(str, outPtr) {
    return writeAsciiToMemory(str, outPtr, false);
}
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
function UTF16ToString(ptr, maxBytesToRead) {
    assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
    var endPtr = ptr;
    // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
    // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
    var idx = endPtr >> 1;
    var maxIdx = idx + maxBytesToRead / 2;
    // If maxBytesToRead is not passed explicitly, it will be undefined, and this
    // will always evaluate to true. This saves on code size.
    while (!(idx >= maxIdx) && HEAPU16[idx])
        ++idx;
    endPtr = idx << 1;
    if (endPtr - ptr > 32 && UTF16Decoder) {
        return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
    }
    else {
        var str = '';
        // If maxBytesToRead is not passed explicitly, it will be undefined, and the for-loop's condition
        // will always evaluate to true. The loop is then terminated on the first null char.
        for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
            var codeUnit = HEAP16[(((ptr) + (i * 2)) >> 1)];
            if (codeUnit == 0)
                break;
            // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
            str += String.fromCharCode(codeUnit);
        }
        return str;
    }
}
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.
function stringToUTF16(str, outPtr, maxBytesToWrite) {
    assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
    assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
    if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 0x7FFFFFFF;
    }
    if (maxBytesToWrite < 2)
        return 0;
    maxBytesToWrite -= 2; // Null terminator.
    var startPtr = outPtr;
    var numCharsToWrite = (maxBytesToWrite < str.length * 2) ? (maxBytesToWrite / 2) : str.length;
    for (var i = 0; i < numCharsToWrite; ++i) {
        // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
        var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
        HEAP16[((outPtr) >> 1)] = codeUnit;
        outPtr += 2;
    }
    // Null-terminate the pointer to the HEAP.
    HEAP16[((outPtr) >> 1)] = 0;
    return outPtr - startPtr;
}
// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF16(str) {
    return str.length * 2;
}
function UTF32ToString(ptr, maxBytesToRead) {
    assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
    var i = 0;
    var str = '';
    // If maxBytesToRead is not passed explicitly, it will be undefined, and this
    // will always evaluate to true. This saves on code size.
    while (!(i >= maxBytesToRead / 4)) {
        var utf32 = HEAP32[(((ptr) + (i * 4)) >> 2)];
        if (utf32 == 0)
            break;
        ++i;
        // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        if (utf32 >= 0x10000) {
            var ch = utf32 - 0x10000;
            str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
        else {
            str += String.fromCharCode(utf32);
        }
    }
    return str;
}
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.
function stringToUTF32(str, outPtr, maxBytesToWrite) {
    assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
    assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
    if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 0x7FFFFFFF;
    }
    if (maxBytesToWrite < 4)
        return 0;
    var startPtr = outPtr;
    var endPtr = startPtr + maxBytesToWrite - 4;
    for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
        if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
            var trailSurrogate = str.charCodeAt(++i);
            codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
        }
        HEAP32[((outPtr) >> 2)] = codeUnit;
        outPtr += 4;
        if (outPtr + 4 > endPtr)
            break;
    }
    // Null-terminate the pointer to the HEAP.
    HEAP32[((outPtr) >> 2)] = 0;
    return outPtr - startPtr;
}
// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF32(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF)
            ++i; // possibly a lead surrogate, so skip over the tail surrogate.
        len += 4;
    }
    return len;
}
// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = abort('malloc was not included, but is needed in allocateUTF8. Adding "_malloc" to EXPORTED_FUNCTIONS should fix that. This may be a bug in the compiler, please file an issue.');
    ;
    if (ret)
        stringToUTF8Array(str, HEAP8, ret, size);
    return ret;
}
// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8Array(str, HEAP8, ret, size);
    return ret;
}
// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated
    @param {boolean=} dontAddNull */
function writeStringToMemory(string, buffer, dontAddNull) {
    warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');
    var /** @type {number} */ lastChar, /** @type {number} */ end;
    if (dontAddNull) {
        // stringToUTF8Array always appends null. If we don't want to do that, remember the
        // character that existed at the location where the null will be placed, and restore
        // that after the write (below).
        end = buffer + lengthBytesUTF8(string);
        lastChar = HEAP8[end];
    }
    stringToUTF8(string, buffer, Infinity);
    if (dontAddNull)
        HEAP8[end] = lastChar; // Restore the value under the null character.
}
function writeArrayToMemory(array, buffer) {
    assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)');
    HEAP8.set(array, buffer);
}
/** @param {boolean=} dontAddNull */
function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
        assert(str.charCodeAt(i) === str.charCodeAt(i) & 0xff);
        HEAP8[((buffer++) >> 0)] = str.charCodeAt(i);
    }
    // Null-terminate the pointer to the HEAP.
    if (!dontAddNull)
        HEAP8[((buffer) >> 0)] = 0;
}
// end include: runtime_strings_extra.js
// Memory management
function alignUp(x, multiple) {
    if (x % multiple > 0) {
        x += multiple - (x % multiple);
    }
    return x;
}
var HEAP, 
/** @type {ArrayBuffer} */
buffer, 
/** @type {Int8Array} */
HEAP8, 
/** @type {Uint8Array} */
HEAPU8, 
/** @type {Int16Array} */
HEAP16, 
/** @type {Uint16Array} */
HEAPU16, 
/** @type {Int32Array} */
HEAP32, 
/** @type {Uint32Array} */
HEAPU32, 
/** @type {Float32Array} */
HEAPF32, 
/** @type {Float64Array} */
HEAPF64;
function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module['HEAP8'] = HEAP8 = new Int8Array(buf);
    Module['HEAP16'] = HEAP16 = new Int16Array(buf);
    Module['HEAP32'] = HEAP32 = new Int32Array(buf);
    Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
    Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
    Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
    Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
    Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
}
var TOTAL_STACK = 5242880;
if (Module['TOTAL_STACK'])
    assert(TOTAL_STACK === Module['TOTAL_STACK'], 'the stack size can no longer be determined at runtime');
var INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 16777216;
if (!Object.getOwnPropertyDescriptor(Module, 'INITIAL_MEMORY'))
    Object.defineProperty(Module, 'INITIAL_MEMORY', { configurable: true, get: function () { abort('Module.INITIAL_MEMORY has been replaced with plain INITIAL_MEMORY (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)'); } });
assert(INITIAL_MEMORY >= TOTAL_STACK, 'INITIAL_MEMORY should be larger than TOTAL_STACK, was ' + INITIAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined, 'JS engine does not provide full typed array support');
// In non-standalone/normal mode, we create the memory here.
// include: runtime_init_memory.js
// Create the main memory. (Note: this isn't used in STANDALONE_WASM mode since the wasm
// memory is created in the wasm, not in JS.)
if (Module['wasmMemory']) {
    wasmMemory = Module['wasmMemory'];
}
else {
    wasmMemory = new WebAssembly.Memory({
        'initial': INITIAL_MEMORY / 65536,
        'maximum': INITIAL_MEMORY / 65536
    });
}
if (wasmMemory) {
    buffer = wasmMemory.buffer;
}
// If the user provides an incorrect length, just use that length instead rather than providing the user to
// specifically provide the memory length with Module['INITIAL_MEMORY'].
INITIAL_MEMORY = buffer.byteLength;
assert(INITIAL_MEMORY % 65536 === 0);
updateGlobalBufferAndViews(buffer);
// end include: runtime_init_memory.js
// include: runtime_init_table.js
// In regular non-RELOCATABLE mode the table is exported
// from the wasm module and this will be assigned once
// the exports are available.
var wasmTable;
// end include: runtime_init_table.js
// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
    var max = _emscripten_stack_get_end();
    assert((max & 3) == 0);
    // The stack grows downwards
    HEAPU32[(max >> 2) + 1] = 0x2135467;
    HEAPU32[(max >> 2) + 2] = 0x89BACDFE;
    // Also test the global address 0 for integrity.
    HEAP32[0] = 0x63736d65; /* 'emsc' */
}
function checkStackCookie() {
    if (ABORT)
        return;
    var max = _emscripten_stack_get_end();
    var cookie1 = HEAPU32[(max >> 2) + 1];
    var cookie2 = HEAPU32[(max >> 2) + 2];
    if (cookie1 != 0x2135467 || cookie2 != 0x89BACDFE) {
        abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x2135467, but received 0x' + cookie2.toString(16) + ' ' + cookie1.toString(16));
    }
    // Also test the global address 0 for integrity.
    if (HEAP32[0] !== 0x63736d65 /* 'emsc' */)
        abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
}
// end include: runtime_stack_check.js
// include: runtime_assertions.js
// Endianness check (note: assumes compiler arch was little-endian)
(function () {
    var h16 = new Int16Array(1);
    var h8 = new Int8Array(h16.buffer);
    h16[0] = 0x6373;
    if (h8[0] !== 0x73 || h8[1] !== 0x63)
        throw 'Runtime error: expected the system to be little-endian!';
})();
function abortFnPtrError(ptr, sig) {
    abort("Invalid function pointer " + ptr + " called with signature '" + sig + "'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this). Build with ASSERTIONS=2 for more info.");
}
// end include: runtime_assertions.js
var __ATPRERUN__ = []; // functions called before the runtime is initialized
var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
    if (Module['preRun']) {
        if (typeof Module['preRun'] == 'function')
            Module['preRun'] = [Module['preRun']];
        while (Module['preRun'].length) {
            addOnPreRun(Module['preRun'].shift());
        }
    }
    callRuntimeCallbacks(__ATPRERUN__);
}
function initRuntime() {
    checkStackCookie();
    assert(!runtimeInitialized);
    runtimeInitialized = true;
    if (!Module["noFSInit"] && !FS.init.initialized)
        FS.init();
    TTY.init();
    callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
    checkStackCookie();
    FS.ignorePermissions = false;
    callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
    checkStackCookie();
    runtimeExited = true;
}
function postRun() {
    checkStackCookie();
    if (Module['postRun']) {
        if (typeof Module['postRun'] == 'function')
            Module['postRun'] = [Module['postRun']];
        while (Module['postRun'].length) {
            addOnPostRun(Module['postRun'].shift());
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb);
}
function addOnInit(cb) {
    __ATINIT__.unshift(cb);
}
function addOnPreMain(cb) {
    __ATMAIN__.unshift(cb);
}
function addOnExit(cb) {
}
function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb);
}
// include: runtime_math.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc
assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
// end include: runtime_math.js
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};
function getUniqueRunDependency(id) {
    var orig = id;
    while (1) {
        if (!runDependencyTracking[id])
            return id;
        id = orig + Math.random();
    }
}
function addRunDependency(id) {
    runDependencies++;
    if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
    }
    if (id) {
        assert(!runDependencyTracking[id]);
        runDependencyTracking[id] = 1;
        if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
            // Check for missing dependencies every few seconds
            runDependencyWatcher = setInterval(function () {
                if (ABORT) {
                    clearInterval(runDependencyWatcher);
                    runDependencyWatcher = null;
                    return;
                }
                var shown = false;
                for (var dep in runDependencyTracking) {
                    if (!shown) {
                        shown = true;
                        err('still waiting on run dependencies:');
                    }
                    err('dependency: ' + dep);
                }
                if (shown) {
                    err('(end of list)');
                }
            }, 10000);
        }
    }
    else {
        err('warning: run dependency added without ID');
    }
}
function removeRunDependency(id) {
    runDependencies--;
    if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
    }
    if (id) {
        assert(runDependencyTracking[id]);
        delete runDependencyTracking[id];
    }
    else {
        err('warning: run dependency removed without ID');
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback(); // can add another dependenciesFulfilled
        }
    }
}
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
/** @param {string|number=} what */
function abort(what) {
    if (Module['onAbort']) {
        Module['onAbort'](what);
    }
    what += '';
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    var output = 'abort(' + what + ') at ' + stackTrace();
    what = output;
    // Use a wasm runtime error, because a JS error might be seen as a foreign
    // exception, which means we'd run destructors on it. We need the error to
    // simply make the program stop.
    var e = new WebAssembly.RuntimeError(what);
    // Throw the error whether or not MODULARIZE is set because abort is used
    // in code paths apart from instantiation where an exception is expected
    // to be thrown when abort is called.
    throw e;
}
// {{MEM_INITIALIZER}}
// include: memoryprofiler.js
// end include: memoryprofiler.js
// include: URIUtils.js
function hasPrefix(str, prefix) {
    return String.prototype.startsWith ?
        str.startsWith(prefix) :
        str.indexOf(prefix) === 0;
}
// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';
// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
    return hasPrefix(filename, dataURIPrefix);
}
var fileURIPrefix = "file://";
// Indicates whether filename is delivered via file protocol (as opposed to http/https)
function isFileURI(filename) {
    return hasPrefix(filename, fileURIPrefix);
}
// end include: URIUtils.js
function createExportWrapper(name, fixedasm) {
    return function () {
        var displayName = name;
        var asm = fixedasm;
        if (!fixedasm) {
            asm = Module['asm'];
        }
        assert(runtimeInitialized, 'native function `' + displayName + '` called before runtime initialization');
        assert(!runtimeExited, 'native function `' + displayName + '` called after runtime exit (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
        if (!asm[name]) {
            assert(asm[name], 'exported native function `' + displayName + '` not found');
        }
        return asm[name].apply(null, arguments);
    };
}
var wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAAB7YOAgAA9YAF/AX9gAn9/AX9gAn9/AGADf39/AX9gAX8AYAZ/f39/f38Bf2AAAGAAAX9gBn9/f39/fwBgBX9/f39/AX9gBH9/f38Bf2ADf39/AGAIf39/f39/f38Bf2AEf39/fwBgBX9/f39/AGAHf39/f39/fwF/YAd/f39/f39/AGAFf35+fn4AYAABfmAFf39/f34Bf2AKf39/f39/f39/fwBgB39/f39/fn4Bf2AEf39/fwF+YAN/fn8BfmAFf39+f38AYAR/fn5/AGAKf39/f39/f39/fwF/YAZ/f39/fn4Bf2AIf39/f39/f38AYA9/f39/f39/f39/f39/f38AYAt/f39/f39/f39/fwF/YAx/f39/f39/f39/f38Bf2AFf39/f3wBf2AGf3x/f39/AX9gAn5/AX9gBH5+fn4Bf2ADf39/AX5gBH9/f34BfmACf38BfWADf39/AX1gAn9/AXxgA39/fwF8YAJ8fwF8YAZ/f39+f38AYAN/f34AYAJ/fgBgA39+fgBgAn99AGACf3wAYAl/f39/f39/f38Bf2AIf39/f39/fn4Bf2AGf39/f39+AX9gAn9+AX9gBH9+f38Bf2ADfn9/AX9gAn5+AX9gAn9/AX5gBH9/fn8BfmABfAF+YAJ+fgF9YAJ+fgF8AuOCgIAADQNlbnYMX19jeGFfYXRleGl0AAMDZW52BWFib3J0AAYWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQhmZF9jbG9zZQAAFndhc2lfc25hcHNob3RfcHJldmlldzEHZmRfcmVhZAAKFndhc2lfc25hcHNob3RfcHJldmlldzEIZmRfd3JpdGUAChZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxEWVudmlyb25fc2l6ZXNfZ2V0AAEWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQtlbnZpcm9uX2dldAABA2VudgpzdHJmdGltZV9sAAkDZW52FmVtc2NyaXB0ZW5fcmVzaXplX2hlYXAAAANlbnYVZW1zY3JpcHRlbl9tZW1jcHlfYmlnAAMDZW52C3NldFRlbXBSZXQwAAQWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQdmZF9zZWVrAAkDZW52Bm1lbW9yeQIBgAKAAgPni4CAAOULBgMKCgABAQADAQABAAAFAAIAAwMAAQAH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AkAgACgCGCICIAAoAhxHDQAgACABEGYgACgCACgCNBEBAA8LIAAgAkEEajYCGCACIAE2AgAgARBmCwQAIAALFAAgAEGoEhCcASIAQQRqEDoaIAALEwAgACAAKAIAQXRqKAIAahCdAQsKACAAEJ0BEPcKCxMAIAAgACgCAEF0aigCAGoQnwELBAAgAAsnAQF/AkAgACgCACICRQ0AIAIgARB/ECMQJEUNACAAQQA2AgALIAALBAAgAAtYAQN/IwBBEGsiAiQAAkAgAkEIaiAAEHkiAxAWRQ0AIAIgABAXIgQQoQEgARCiARogBBAbRQ0AIAAgACgCAEF0aigCAGpBARAcCyADEHsaIAJBEGokACAACwQAIAALFAAgAEHYEhClASIAQQRqED4aIAALEwAgACAAKAIAQXRqKAIAahCmAQsKACAAEKYBEPcKCxMAIAAgACgCAEF0aigCAGoQqAELBAAgAAspAQF/AkAgACgCACICRQ0AIAIgARCbARBkEJoBRQ0AIABBADYCAAsgAAsEACAACxMAIAAgASACIAAoAgAoAjARAwALLQEBfyMAQRBrIgIkACAAIAJBCGogAhAmGiAAIAEgARATEP8KIAJBEGokACAACwkAIAAgARCwAQspAQJ/IwBBEGsiAiQAIAJBCGogACABELgBIQMgAkEQaiQAIAEgACADGwsJACAAEDsQ9woLBQAQAQALQQAgAEEANgIUIAAgATYCGCAAQQA2AgwgAEKCoICA4AA3AgQgACABRTYCECAAQSBqQQBBKBDYCxogAEEcahDiBxoLBAAgAAs+AQF/IwBBEGsiAiQAIAIgABC2ASgCADYCDCAAIAEQtgEoAgA2AgAgASACQQxqELYBKAIANgIAIAJBEGokAAsEACAACw0AIAEoAgAgAigCAEgLDQAgASgCACACKAIASQsuAQF/AkAgACgCACIBRQ0AAkAgARB9ECMQJA0AIAAoAgBFDwsgAEEANgIAC0EBCzABAX8CQCAAKAIAIgFFDQACQCABEJgBEGQQmgENACAAKAIARQ8LIABBADYCAAtBAQsRACAAIAEgACgCACgCLBEBAAsEACAACxEAIAAgARC8ASgCADYCACAACwQAIAALBAAgAAsMACAAKAI8EL8BEAILBgBB4P4ACxYAAkAgAA0AQQAPCxDBASAANgIAQX8L2AEBBH8j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AEIAIQZCACEFDAELIAIgBK1CACAEZyIEQdEAahCYAiACQQhqKQMAQoCAgICAgMAAhUGJ/wAgBGutQjCGhCEFIAIpAwAhBgsgACAGNwMAIAAgBSADQYCAgIB4ca1CIIaENwMIIAJBEGokAAuNAQICfwJ+IwBBEGsiAiQAAkACQCABDQBCACEEQgAhBQwBCyACIAEgAUEfdSIDaiADcyIDrUIAIANnIgNB0QBqEJgCIAJBCGopAwBCgICAgICAwACFQZ6AASADa61CMIZ8IAFBgICAgHhxrUIghoQhBSACKQMAIQQLIAAgBDcDACAAIAU3AwggAkEQaiQAC1MBAX4CQAJAIANBwABxRQ0AIAIgA0FAaq2IIQFCACECDAELIANFDQAgAkHAACADa62GIAEgA60iBIiEIQEgAiAEiCECCyAAIAE3AwAgACACNwMIC+sLAgV/D34jAEHgAGsiBSQAIAFCIIggAkIghoQhCiADQhGIIARCL4aEIQsgA0IxiCAEQv///////z+DIgxCD4aEIQ0gBCAChUKAgICAgICAgIB/gyEOIAJC////////P4MiD0IgiCEQIAxCEYghESAEQjCIp0H//wFxIQYCQAJAAkAgAkIwiKdB//8BcSIHQX9qQf3/AUsNAEEAIQggBkF/akH+/wFJDQELAkAgAVAgAkL///////////8AgyISQoCAgICAgMD//wBUIBJCgICAgICAwP//AFEbDQAgAkKAgICAgIAghCEODAILAkAgA1AgBEL///////////8AgyICQoCAgICAgMD//wBUIAJCgICAgICAwP//AFEbDQAgBEKAgICAgIAghCEOIAMhAQwCCwJAIAEgEkKAgICAgIDA//8AhYRCAFINAAJAIAMgAoRQRQ0AQoCAgICAgOD//wAhDkIAIQEMAwsgDkKAgICAgIDA//8AhCEOQgAhAQwCCwJAIAMgAkKAgICAgIDA//8AhYRCAFINACABIBKEIQJCACEBAkAgAlBFDQBCgICAgICA4P//ACEODAMLIA5CgICAgICAwP//AIQhDgwCCwJAIAEgEoRCAFINAEIAIQEMAgsCQCADIAKEQgBSDQBCACEBDAILQQAhCAJAIBJC////////P1YNACAFQdAAaiABIA8gASAPIA9QIggbeSAIQQZ0rXynIghBcWoQmAJBECAIayEIIAUpA1AiAUIgiCAFQdgAaikDACIPQiCGhCEKIA9CIIghEAsgAkL///////8/Vg0AIAVBwABqIAMgDCADIAwgDFAiCRt5IAlBBnStfKciCUFxahCYAiAIIAlrQRBqIQggBSkDQCIDQjGIIAVByABqKQMAIgJCD4aEIQ0gA0IRiCACQi+GhCELIAJCEYghEQsgC0L/////D4MiAiABQv////8PgyIEfiITIANCD4ZCgID+/w+DIgEgCkL/////D4MiA358IgpCIIYiDCABIAR+fCILIAxUrSACIAN+IhQgASAPQv////8PgyIMfnwiEiANQv////8PgyIPIAR+fCINIApCIIggCiATVK1CIIaEfCITIAIgDH4iFSABIBBCgIAEhCIKfnwiECAPIAN+fCIWIBFC/////weDQoCAgIAIhCIBIAR+fCIRQiCGfCIXfCEEIAcgBmogCGpBgYB/aiEGAkACQCAPIAx+IhggAiAKfnwiAiAYVK0gAiABIAN+fCIDIAJUrXwgAyASIBRUrSANIBJUrXx8IgIgA1StfCABIAp+fCABIAx+IgMgDyAKfnwiASADVK1CIIYgAUIgiIR8IAIgAUIghnwiASACVK18IAEgEUIgiCAQIBVUrSAWIBBUrXwgESAWVK18QiCGhHwiAyABVK18IAMgEyANVK0gFyATVK18fCICIANUrXwiAUKAgICAgIDAAINQDQAgBkEBaiEGDAELIAtCP4ghAyABQgGGIAJCP4iEIQEgAkIBhiAEQj+IhCECIAtCAYYhCyADIARCAYaEIQQLAkAgBkH//wFIDQAgDkKAgICAgIDA//8AhCEOQgAhAQwBCwJAAkAgBkEASg0AAkBBASAGayIHQYABSQ0AQgAhAQwDCyAFQTBqIAsgBCAGQf8AaiIGEJgCIAVBIGogAiABIAYQmAIgBUEQaiALIAQgBxCbAiAFIAIgASAHEJsCIAUpAyAgBSkDEIQgBSkDMCAFQTBqQQhqKQMAhEIAUq2EIQsgBUEgakEIaikDACAFQRBqQQhqKQMAhCEEIAVBCGopAwAhASAFKQMAIQIMAQsgBq1CMIYgAUL///////8/g4QhAQsgASAOhCEOAkAgC1AgBEJ/VSAEQoCAgICAgICAgH9RGw0AIA4gAkIBfCIBIAJUrXwhDgwBCwJAIAsgBEKAgICAgICAgIB/hYRCAFENACACIQEMAQsgDiACIAJCAYN8IgEgAlStfCEOCyAAIAE3AwAgACAONwMIIAVB4ABqJAALBABBAAsEAEEAC/gKAgR/BH4jAEHwAGsiBSQAIARC////////////AIMhCQJAAkACQCABQn98IgpCf1EgAkL///////////8AgyILIAogAVStfEJ/fCIKQv///////7///wBWIApC////////v///AFEbDQAgA0J/fCIKQn9SIAkgCiADVK18Qn98IgpC////////v///AFQgCkL///////+///8AURsNAQsCQCABUCALQoCAgICAgMD//wBUIAtCgICAgICAwP//AFEbDQAgAkKAgICAgIAghCEEIAEhAwwCCwJAIANQIAlCgICAgICAwP//AFQgCUKAgICAgIDA//8AURsNACAEQoCAgICAgCCEIQQMAgsCQCABIAtCgICAgICAwP//AIWEQgBSDQBCgICAgICA4P//ACACIAMgAYUgBCAChUKAgICAgICAgIB/hYRQIgYbIQRCACABIAYbIQMMAgsgAyAJQoCAgICAgMD//wCFhFANAQJAIAEgC4RCAFINACADIAmEQgBSDQIgAyABgyEDIAQgAoMhBAwCCyADIAmEUEUNACABIQMgAiEEDAELIAMgASADIAFWIAkgC1YgCSALURsiBxshCSAEIAIgBxsiC0L///////8/gyEKIAIgBCAHGyICQjCIp0H//wFxIQgCQCALQjCIp0H//wFxIgYNACAFQeAAaiAJIAogCSAKIApQIgYbeSAGQQZ0rXynIgZBcWoQmAJBECAGayEGIAVB6ABqKQMAIQogBSkDYCEJCyABIAMgBxshAyACQv///////z+DIQQCQCAIDQAgBUHQAGogAyAEIAMgBCAEUCIHG3kgB0EGdK18pyIHQXFqEJgCQRAgB2shCCAFQdgAaikDACEEIAUpA1AhAwsgBEIDhiADQj2IhEKAgICAgICABIQhBCAKQgOGIAlCPYiEIQEgA0IDhiEDIAsgAoUhCgJAIAYgCGsiB0UNAAJAIAdB/wBNDQBCACEEQgEhAwwBCyAFQcAAaiADIARBgAEgB2sQmAIgBUEwaiADIAQgBxCbAiAFKQMwIAUpA0AgBUHAAGpBCGopAwCEQgBSrYQhAyAFQTBqQQhqKQMAIQQLIAFCgICAgICAgASEIQwgCUIDhiECAkACQCAKQn9VDQACQCACIAN9IgEgDCAEfSACIANUrX0iBIRQRQ0AQgAhA0IAIQQMAwsgBEL/////////A1YNASAFQSBqIAEgBCABIAQgBFAiBxt5IAdBBnStfKdBdGoiBxCYAiAGIAdrIQYgBUEoaikDACEEIAUpAyAhAQwBCyAEIAx8IAMgAnwiASADVK18IgRCgICAgICAgAiDUA0AIAFCAYggBEI/hoQgAUIBg4QhASAGQQFqIQYgBEIBiCEECyALQoCAgICAgICAgH+DIQICQCAGQf//AUgNACACQoCAgICAgMD//wCEIQRCACEDDAELQQAhBwJAAkAgBkEATA0AIAYhBwwBCyAFQRBqIAEgBCAGQf8AahCYAiAFIAEgBEEBIAZrEJsCIAUpAwAgBSkDECAFQRBqQQhqKQMAhEIAUq2EIQEgBUEIaikDACEECyABQgOIIARCPYaEIQMgBEIDiEL///////8/gyAChCAHrUIwhoQhBCABp0EHcSEGAkACQAJAAkACQBCdAg4DAAECAwsgBCADIAZBBEutfCIBIANUrXwhBAJAIAZBBEYNACABIQMMAwsgBCABQgGDIgIgAXwiAyACVK18IQQMAwsgBCADIAJCAFIgBkEAR3GtfCIBIANUrXwhBCABIQMMAQsgBCADIAJQIAZBAEdxrXwiASADVK18IQQgASEDCyAGRQ0BCxCeAhoLIAAgAzcDACAAIAQ3AwggBUHwAGokAAuOAgICfwN+IwBBEGsiAiQAAkACQCABvSIEQv///////////wCDIgVCgICAgICAgHh8Qv/////////v/wBWDQAgBUI8hiEGIAVCBIhCgICAgICAgIA8fCEFDAELAkAgBUKAgICAgICA+P8AVA0AIARCPIYhBiAEQgSIQoCAgICAgMD//wCEIQUMAQsCQCAFUEUNAEIAIQZCACEFDAELIAIgBUIAIASnZ0EgaiAFQiCIp2cgBUKAgICAEFQbIgNBMWoQmAIgAkEIaikDAEKAgICAgIDAAIVBjPgAIANrrUIwhoQhBSACKQMAIQYLIAAgBjcDACAAIAUgBEKAgICAgICAgIB/g4Q3AwggAkEQaiQAC+ABAgF/An5BASEEAkAgAEIAUiABQv///////////wCDIgVCgICAgICAwP//AFYgBUKAgICAgIDA//8AURsNACACQgBSIANC////////////AIMiBkKAgICAgIDA//8AViAGQoCAgICAgMD//wBRGw0AAkAgAiAAhCAGIAWEhFBFDQBBAA8LAkAgAyABg0IAUw0AQX8hBCAAIAJUIAEgA1MgASADURsNASAAIAKFIAEgA4WEQgBSDwtBfyEEIAAgAlYgASADVSABIANRGw0AIAAgAoUgASADhYRCAFIhBAsgBAvYAQIBfwJ+QX8hBAJAIABCAFIgAUL///////////8AgyIFQoCAgICAgMD//wBWIAVCgICAgICAwP//AFEbDQAgAkIAUiADQv///////////wCDIgZCgICAgICAwP//AFYgBkKAgICAgIDA//8AURsNAAJAIAIgAIQgBiAFhIRQRQ0AQQAPCwJAIAMgAYNCAFMNACAAIAJUIAEgA1MgASADURsNASAAIAKFIAEgA4WEQgBSDwsgACACViABIANVIAEgA1EbDQAgACAChSABIAOFhEIAUiEECyAECzUAIAAgATcDACAAIARCMIinQYCAAnEgAkIwiKdB//8BcXKtQjCGIAJC////////P4OENwMIC3ICAX8CfiMAQRBrIgIkAAJAAkAgAQ0AQgAhA0IAIQQMAQsgAiABrUIAIAFnIgFB0QBqEJgCIAJBCGopAwBCgICAgICAwACFQZ6AASABa61CMIZ8IQQgAikDACEDCyAAIAM3AwAgACAENwMIIAJBEGokAAtBAQF/IwBBEGsiBSQAIAUgASACIAMgBEKAgICAgICAgIB/hRCfAiAAIAUpAwA3AwAgACAFKQMINwMIIAVBEGokAAvnAgEBfyMAQdAAayIEJAACQAJAIANBgIABSA0AIARBIGogASACQgBCgICAgICAgP//ABCcAiAEQSBqQQhqKQMAIQIgBCkDICEBAkAgA0H//wFODQAgA0GBgH9qIQMMAgsgBEEQaiABIAJCAEKAgICAgICA//8AEJwCIANB/f8CIANB/f8CSBtBgoB+aiEDIARBEGpBCGopAwAhAiAEKQMQIQEMAQsgA0GBgH9KDQAgBEHAAGogASACQgBCgICAgICAwAAQnAIgBEHAAGpBCGopAwAhAiAEKQNAIQECQCADQYOAfkwNACADQf7/AGohAwwBCyAEQTBqIAEgAkIAQoCAgICAgMAAEJwCIANBhoB9IANBhoB9ShtB/P8BaiEDIARBMGpBCGopAwAhAiAEKQMwIQELIAQgASACQgAgA0H//wBqrUIwhhCcAiAAIARBCGopAwA3AwggACAEKQMANwMAIARB0ABqJAALdQEBfiAAIAQgAX4gAiADfnwgA0IgiCIEIAFCIIgiAn58IANC/////w+DIgMgAUL/////D4MiAX4iBUIgiCADIAJ+fCIDQiCIfCADQv////8PgyAEIAF+fCIDQiCIfDcDCCAAIANCIIYgBUL/////D4OENwMAC58SAgV/DH4jAEHAAWsiBSQAIARC////////P4MhCiACQv///////z+DIQsgBCAChUKAgICAgICAgIB/gyEMIARCMIinQf//AXEhBgJAAkACQAJAIAJCMIinQf//AXEiB0F/akH9/wFLDQBBACEIIAZBf2pB/v8BSQ0BCwJAIAFQIAJC////////////AIMiDUKAgICAgIDA//8AVCANQoCAgICAgMD//wBRGw0AIAJCgICAgICAIIQhDAwCCwJAIANQIARC////////////AIMiAkKAgICAgIDA//8AVCACQoCAgICAgMD//wBRGw0AIARCgICAgICAIIQhDCADIQEMAgsCQCABIA1CgICAgICAwP//AIWEQgBSDQACQCADIAJCgICAgICAwP//AIWEUEUNAEIAIQFCgICAgICA4P//ACEMDAMLIAxCgICAgICAwP//AIQhDEIAIQEMAgsCQCADIAJCgICAgICAwP//AIWEQgBSDQBCACEBDAILIAEgDYRCAFENAgJAIAMgAoRCAFINACAMQoCAgICAgMD//wCEIQxCACEBDAILQQAhCAJAIA1C////////P1YNACAFQbABaiABIAsgASALIAtQIggbeSAIQQZ0rXynIghBcWoQmAJBECAIayEIIAVBuAFqKQMAIQsgBSkDsAEhAQsgAkL///////8/Vg0AIAVBoAFqIAMgCiADIAogClAiCRt5IAlBBnStfKciCUFxahCYAiAJIAhqQXBqIQggBUGoAWopAwAhCiAFKQOgASEDCyAFQZABaiADQjGIIApCgICAgICAwACEIg5CD4aEIgJCAEKEyfnOv+a8gvUAIAJ9IgRCABCnAiAFQYABakIAIAVBkAFqQQhqKQMAfUIAIARCABCnAiAFQfAAaiAFKQOAAUI/iCAFQYABakEIaikDAEIBhoQiBEIAIAJCABCnAiAFQeAAaiAEQgBCACAFQfAAakEIaikDAH1CABCnAiAFQdAAaiAFKQNgQj+IIAVB4ABqQQhqKQMAQgGGhCIEQgAgAkIAEKcCIAVBwABqIARCAEIAIAVB0ABqQQhqKQMAfUIAEKcCIAVBMGogBSkDQEI/iCAFQcAAakEIaikDAEIBhoQiBEIAIAJCABCnAiAFQSBqIARCAEIAIAVBMGpBCGopAwB9QgAQpwIgBUEQaiAFKQMgQj+IIAVBIGpBCGopAwBCAYaEIgRCACACQgAQpwIgBSAEQgBCACAFQRBqQQhqKQMAfUIAEKcCIAggByAGa2ohBgJAAkBCACAFKQMAQj+IIAVBCGopAwBCAYaEQn98Ig1C/////w+DIgQgAkIgiCIPfiIQIA1CIIgiDSACQv////8PgyIRfnwiAkIgiCACIBBUrUIghoQgDSAPfnwgAkIghiIPIAQgEX58IgIgD1StfCACIAQgA0IRiEL/////D4MiEH4iESANIANCD4ZCgID+/w+DIhJ+fCIPQiCGIhMgBCASfnwgE1StIA9CIIggDyARVK1CIIaEIA0gEH58fHwiDyACVK18IA9CAFKtfH0iAkL/////D4MiECAEfiIRIBAgDX4iEiAEIAJCIIgiE358IgJCIIZ8IhAgEVStIAJCIIggAiASVK1CIIaEIA0gE358fCAQQgAgD30iAkIgiCIPIAR+IhEgAkL/////D4MiEiANfnwiAkIghiITIBIgBH58IBNUrSACQiCIIAIgEVStQiCGhCAPIA1+fHx8IgIgEFStfCACQn58IhEgAlStfEJ/fCIPQv////8PgyICIAFCPoggC0IChoRC/////w+DIgR+IhAgAUIeiEL/////D4MiDSAPQiCIIg9+fCISIBBUrSASIBFCIIgiECALQh6IQv//7/8Pg0KAgBCEIgt+fCITIBJUrXwgCyAPfnwgAiALfiIUIAQgD358IhIgFFStQiCGIBJCIIiEfCATIBJCIIZ8IhIgE1StfCASIBAgDX4iFCARQv////8PgyIRIAR+fCITIBRUrSATIAIgAUIChkL8////D4MiFH58IhUgE1StfHwiEyASVK18IBMgFCAPfiISIBEgC358Ig8gECAEfnwiBCACIA1+fCICQiCIIA8gElStIAQgD1StfCACIARUrXxCIIaEfCIPIBNUrXwgDyAVIBAgFH4iBCARIA1+fCINQiCIIA0gBFStQiCGhHwiBCAVVK0gBCACQiCGfCAEVK18fCIEIA9UrXwiAkL/////////AFYNACABQjGGIARC/////w+DIgEgA0L/////D4MiDX4iD0IAUq19QgAgD30iESAEQiCIIg8gDX4iEiABIANCIIgiEH58IgtCIIYiE1StfSAEIA5CIIh+IAMgAkIgiH58IAIgEH58IA8gCn58QiCGIAJC/////w+DIA1+IAEgCkL/////D4N+fCAPIBB+fCALQiCIIAsgElStQiCGhHx8fSENIBEgE30hASAGQX9qIQYMAQsgBEIhiCEQIAFCMIYgBEIBiCACQj+GhCIEQv////8PgyIBIANC/////w+DIg1+Ig9CAFKtfUIAIA99IgsgASADQiCIIg9+IhEgECACQh+GhCISQv////8PgyITIA1+fCIQQiCGIhRUrX0gBCAOQiCIfiADIAJCIYh+fCACQgGIIgIgD358IBIgCn58QiCGIBMgD34gAkL/////D4MgDX58IAEgCkL/////D4N+fCAQQiCIIBAgEVStQiCGhHx8fSENIAsgFH0hASACIQILAkAgBkGAgAFIDQAgDEKAgICAgIDA//8AhCEMQgAhAQwBCyAGQf//AGohBwJAIAZBgYB/Sg0AAkAgBw0AIAJC////////P4MgBCABQgGGIANWIA1CAYYgAUI/iIQiASAOViABIA5RG618IgEgBFStfCIDQoCAgICAgMAAg1ANACADIAyEIQwMAgtCACEBDAELIAJC////////P4MgBCABQgGGIANaIA1CAYYgAUI/iIQiASAOWiABIA5RG618IgEgBFStfCAHrUIwhnwgDIQhDAsgACABNwMAIAAgDDcDCCAFQcABaiQADwsgAEIANwMAIABCgICAgICA4P//ACAMIAMgAoRQGzcDCCAFQcABaiQACxwAIAAgAkL///////////8AgzcDCCAAIAE3AwAL3ggCBn8CfiMAQTBrIgQkAEIAIQoCQAJAIAJBAksNACABQQRqIQUgAkECdCICQdwbaigCACEGIAJB0BtqKAIAIQcDQAJAAkAgASgCBCICIAEoAmhPDQAgBSACQQFqNgIAIAItAAAhAgwBCyABEJUCIQILIAIQkwINAAtBASEIAkACQCACQVVqDgMAAQAB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AgAgA0J/fCEDDAMLIAkgA1gNABDBAUHEADYCAAwCCyAJIAasIgOFIAN9IQMMAQtCACEDIABCABCUAgsgBEEQaiQAIAMLxAMCA38BfiMAQSBrIgIkAAJAAkAgAUL///////////8AgyIFQoCAgICAgMC/QHwgBUKAgICAgIDAwL9/fFoNACABQhmIpyEDAkAgAFAgAUL///8PgyIFQoCAgAhUIAVCgICACFEbDQAgA0GBgICABGohAwwCCyADQYCAgIAEaiEDIAAgBUKAgIAIhYRCAFINASADQQFxIANqIQMMAQsCQCAAUCAFQoCAgICAgMD//wBUIAVCgICAgICAwP//AFEbDQAgAUIZiKdB////AXFBgICA/gdyIQMMAQtBgICA/AchAyAFQv///////7+/wABWDQBBACEDIAVCMIinIgRBkf4ASQ0AIAJBEGogACABQv///////z+DQoCAgICAgMAAhCIFIARB/4F/ahCYAiACIAAgBUGB/wAgBGsQmwIgAkEIaikDACIFQhmIpyEDAkAgAikDACACKQMQIAJBEGpBCGopAwCEQgBSrYQiAFAgBUL///8PgyIFQoCAgAhUIAVCgICACFEbDQAgA0EBaiEDDAELIAAgBUKAgIAIhYRCAFINACADQQFxIANqIQMLIAJBIGokACADIAFCIIinQYCAgIB4cXK+C+oDAgJ/An4jAEEgayICJAACQAJAIAFC////////////AIMiBEKAgICAgIDA/0N8IARCgICAgICAwIC8f3xaDQAgAEI8iCABQgSGhCEEAkAgAEL//////////w+DIgBCgYCAgICAgIAIVA0AIARCgYCAgICAgIDAAHwhBQwCCyAEQoCAgICAgICAwAB8IQUgAEKAgICAgICAgAiFQgBSDQEgBUIBgyAFfCEFDAELAkAgAFAgBEKAgICAgIDA//8AVCAEQoCAgICAgMD//wBRGw0AIABCPIggAUIEhoRC/////////wODQoCAgICAgID8/wCEIQUMAQtCgICAgICAgPj/ACEFIARC////////v//DAFYNAEIAIQUgBEIwiKciA0GR9wBJDQAgAkEQaiAAIAFC////////P4NCgICAgICAwACEIgQgA0H/iH9qEJgCIAIgACAEQYH4ACADaxCbAiACKQMAIgRCPIggAkEIaikDAEIEhoQhBQJA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AwszAQF/IwBBEGsiAyQAIAMgASACQQIQ9wIgACADKQMANwMAIAAgAykDCDcDCCADQRBqJAALCQAgACABEPYCCwkAIAAgARD4AgsxAQF/IwBBEGsiBCQAIAQgASACEPkCIAAgBCkDADcDACAAIAQpAwg3AwggBEEQaiQACwoAIAAQ/gIaIAALCgAgABDsChogAAsKACAAEP0CEPcKC1cBA38CQAJAA0AgAyAERg0BQX8hBSABIAJGDQIgASwAACIGIAMsAAAiB0gNAgJAIAcgBk4NAEEBDwsgA0EBaiEDIAFBAWohAQwACwALIAEgAkchBQsgBQsMACAAIAIgAxCCAxoLKwEBfyMAQRBrIgMkACAAIANBCGogAxAmGiAAIAEgAhCDAyADQRBqJAAgAAutAQEEfyMAQRBrIgMkAAJAIAEgAhCLCiIEIAAQxwlLDQACQAJAIARBCksNACAAIAQQygUgABDJBSEFDAELIAQQywkhBSAAIAAQkQkgBUEBaiIGEM0JIgUQzwkgACAGENAJIAAgBBDIBQsCQANAIAEgAkYNASAFIAEQxwUgBUEBaiEFIAFBAWohAQwACwALIANBADoADyAFIANBD2oQxwUgA0EQaiQADwsgABD7CgALQgECf0EAIQMDfwJAIAEgAkcNACADDwsgA0EEdCABLAAAaiIDQYCAgIB/cSIEQRh2IARyIANzIQMgAUEBaiEBDAALCwoAIAAQ/gIaIAALCgAgABCFAxD3CgtXAQN/AkACQANAIAMgBEYNAUF/IQUgASACRg0CIAEoAgAiBiADKAIAIgdIDQICQCAHIAZODQBBAQ8LIANBBGohAyABQQRqIQEMAAsACyABIAJHIQULIAULDAAgACACIAMQiQMaCywBAX8jAEEQayIDJAAgACADQQhqIAMQigMaIAAgASACEIsDIANBEGokACAACxoAIAEQKRogABCNChogAhApGiAAEI4KGiAAC60BAQR/IwBBEGsiAyQAAkAgASACEI8KIgQgABCQCksNAAJAAkAgBEEBSw0AIAAgBBCJBiAAEIgGIQUMAQsgBBCRCiEFIAAgABCdCSAFQQFqIgYQkgoiBRCTCiAAIAYQlAogACAEEIcGCwJAA0AgASACRg0BIAUgARCGBiAFQQRqIQUgAUEEaiEBDAALAAsgA0EANgIMIAUgA0EMahCGBiAD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AAA6AAALDAAgABCTCSABNgIECwoAIAAQkwkQygkLDAAgABCTCSABOgALC+cBAQR/IwBBIGsiAyQAIAAQmAMhBCAAEKIDIQUCQCABIAIQ0goiBkUNAAJAIAEQ1gkgABCLBCAAEIsEIAAQmANqENMKRQ0AIAAgA0EQaiABIAIgABCRCRDUCiIBECAgARCYAxCMCxogARCDCxoMAQsCQCAFIARrIAZPDQAgACAFIAYgBGogBWsgBCAEQQBBABCKCwsgABDJAyAEaiEFAkADQCABIAJGDQEgBSABEMcFIAFBAWohASAFQQFqIQUMAAsACyADQQA6AA8gBSADQQ9qEMcFIAAgBiAEahDVCgsgA0EgaiQAIAALHQAgACABENsKENwKGiAAQQRqIAIQvAEQvQEaIAALBwAgABDgCgsLACAAQeCYARCTAwsRACAAIAEgASgCACgCLBECAAsRACAAIAEgASgCACgCIBECAAsLACAAIAEQpwYgAAsRACAAIAEgASgCACgCHBECAAsPACAAIAAoAgAoAgwRAAALDwAgACAAKAIAKAIQEQAACxEAIAAgASABKAIAKAIUEQIACxEAIAAgASABKAIAKAIYEQIACw8AIAAgACgCACgCJBEAAAsLACAAQdiYARCTAwsRACAAIAEgASgCACgCLBECAAsRACAAIAEgASgCACgCIBECAAsRACAAIAEgASgCACgCHBECAAsPACAAIAAoAgAoAgwRAAALDwAgACAAKAIAKAIQEQAACxEAIAAgASABKAIAKAIUEQIACxEAIAAgASABKAIAKAIYEQIACw8AIAAgACgCACgCJBEAAAsSACAAIAI2AgQgACABOgAAIAALBwAgACgCAAsNACAAEOQFIAEQ4gVGCwcAIAAoAgALcwEBfyMAQSBrIgMkACADIAE2AhAgAyAANgIYIAMgAjYCCAJAA0AgA0EYaiADQRBqEIAEIgJFDQEgAyADQRhqEIEEIANBCGoQgQQQ4QpFDQEgA0EYahCCBBogA0EIahCCBBoMAAsACyADQSBqJAAgAkEBcwsyAQF/IwBBEGsiAiQAIAIgACgCADYCCCACQQhqIAEQjQkaIAIoAgghASACQRBqJAAgAQsHACAAEJkECwUAELwKCxoBAX8gABCYBCgCACEBIAAQmARBADYCACABCyUAIAAgARDpBRCUBCABEOcF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IAIgAUEMahCGBiAAQQAQhwYMAQsgABCIBiECIAFBADYCCCACIAFBCGoQhgYgAEEAEIkGCyABQRBqJAALCwAgACABIAIQigYLAgALCgAgABCfCSgCAAsMACAAIAEoAgA2AgALDAAgABCfCSABNgIECwoAIAAQnwkQmQoLDwAgABCfCUELaiABOgAAC+gBAQR/IwBBEGsiAyQAIAAQ1gMhBCAAEPAIIQUCQCABIAIQ7wgiBkUNAAJAIAEQoAogABCqBCAAEKoEIAAQ1gNBAnRqEOMKRQ0AIAAgAyABIAIgABCdCRDkCiIBENgEIAEQ1gMQlwsaIAEQkQsaDAELAkAgBSAEayAGTw0AIAAgBSAGIARqIAVrIAQgBEEAQQAQlQsLIAAQogQgBEECdGohBQJAA0AgASACRg0BIAUgARCGBiABQQRqIQEgBUEEaiEFDAALAAsgA0EANgIAIAUgAxCGBiAAIAYgBGoQ8ggLIANBEGokACAACwsAIABB8JgBEJMDCxEAIAAgASABKAIAKAIsEQIACxEAIAAgASABKAIAKAIgEQIACwsAIAAgARCoBiAACxEAIAAgASABKAIAKAIcEQIACw8AIAAgACgCACgCDBEAAAsPACAAIAAoAgAoAhARAAALEQAgACABIAEoAgAoAhQRAgALEQAgACABIAEoAgAoAhgRAgALDwAgACAAKAIAKAIkEQAACwsAIABB6JgBEJMDCxEAIAAgASABKAIAKAIsEQIACxEAIAAgASABKAIAKAIgEQIACxEAIAAgASABKAIAKAIcEQIACw8AIAAgACgCACgCDBEAAAsPACAAIAAoAgAoAhARAAALEQAgACABIAEoAgAoAhQRAgALEQAgACABIAEoAgAoAhgRAgALDwAgACAAKAIAKAIkEQAACxIAIAAgAjYCBCAAIAE2AgAgAAsHACAAKAIACw0AIAAQoQYgARCfBkYLBwAgACgCAAtzAQF/IwBBIGsiAyQAIAMgATYCECADIAA2AhggAyACNgIIAkADQCADQRhqIANBEGoQnwQiAkUNASADIANBGGoQoAQgA0EIahCgBBDpCkUNASADQRhqEKEEGiADQQhqEKEEGgwACwALIANBIGokACACQQFzCzIBAX8jAEEQayICJAAgAiAAKAIANgIIIAJBCGogARCOCRogAigCCCEBIAJBEGokACAB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BhogAEHE0AA2AgAgAAslAQF/IwBBEGsiASQAIAFBCGogABDhBigCACEAIAFBEGokACAAC+QBAQJ/IwBBoAFrIgQkACAEIAE2ApgBIARBkAFqIQUCQAJAA0AgAiADTw0BIAQgAjYCCCAAIARBkAFqIAIgAkEgaiADIAMgAmtBIEobIARBCGogBEEQaiAFIARBDGogACgCACgCEBEMAEECRg0CIARBEGohASAEKAIIIAJGDQIDQAJAIAEgBCgCDEkNACAEKAIIIQIMAgsgBCABKAIANgIEIARBmAFqEN4GIARBBGoQ3wYaIAFBBGohASAEQZgBahDgBhoMAAsACwALIAQoApgBIQEgBEGgAWokACABDwsgBBD/BAALGwAgACABEOUGGiAAEJIIGiAAQfDOADYCACAACwQAIAALFAAgACgCACABELEKKAIAEJgLIAALBAAgAAsOACAAIAEQ6wo2AgAgAAsTAEF/IAFBAXQgAUF/RhsQ3wIaCykAIABB2McANgIAAkAgACgCCBDFA0YNACAAKAIIEOACCyAAEP4CGiAAC4QDACAAIAEQ5QYaIABBkMcANgIAIABBEGpBHBDmBiEBIABBsAFqQYXHABCuARogARDnBhDoBiAAQcCjARDpBhDqBiAAQcijARDrBhDsBiAAQdCjARDtBhDuBiAAQeCjARDvBhDwBiAAQeijARDxBhDyBiAAQfCjARDzBhD0BiAAQYCkARD1BhD2BiAAQYikARD3BhD4BiAAQZCkARD5BhD6BiAAQbCkARD7BhD8BiAAQdCkARD9BhD+BiAAQdikARD/BhCAByAAQeCkARCBBxCCByAAQeikARCDBxCEByAAQfCkARCFBxCGByAAQfikARCHBxCIByAAQYClARCJBxCKByAAQYilARCLBxCMByAAQZClARCNBxCOByAAQZilARCPBxCQByAAQaClARCRBxCSByAAQailARCTBxCUByAAQbClARCVBxCWByAAQcClARCXBxCYByAAQdClARCZBxCaByAAQeClARCbBxCcByAAQfClARCdBxCeByAAQfilARCfByAACxgAIAAgAUF/ahCgBxogAEGcywA2AgAgAAsgACAAEKEHGgJAIAFFDQAgACABEKIHIAAgARCjBwsgAAscAQF/IAAQpAchASAAEKUHIAAgARCmByAAEKcHCwwAQcCjAUEBEKoHGgsQACAAIAFBiJgBEKgHEKkHCwwAQcijAUEBEKsHGgsQACAAIAFBkJgBEKgHEKkHCxAAQdCjAUEAQQBBARCsBxoLEAAgACABQdSZARCoBxCpBwsMAEHgowFBARCtBxoLEAAgACABQcyZARCoBxCpBwsMAEHoowFBARCuBxoLEAAgACABQdyZARCoBxCpBwsMAEHwowFBARCvBxoLEAAgACABQeSZARCoBxCpBwsMAEGApAFBARCwBxoLEAAgACABQeyZARCoBxCpBwsMAEGIpAFBARDdBhoLEAAgACABQfSZARCoBxCpBwsMAEGQpAFBARCxBxoLEAAgACABQfyZARCoBxCpBwsMAEGwpAFBARCyBxoLEAAgACABQYSaARCoBxCpBwsMAEHQpAFBARCzBxoLEAAgACABQZiYARCoBxCpBwsMAEHYpAFBARC0BxoLEAAgACABQaCYARCoBxCpBwsMAEHgpAFBARC1BxoLEAAgACABQaiYARCoBxCpBwsMAEHopAFBARC2BxoLEAAgACABQbCYARCoBxCpBwsMAEHwpAFBARC3BxoLEAAgACABQdiYARCoBxCpBwsMAEH4pAFBARC4BxoLEAAgACABQeCYARCoBxCpBwsMAEGApQFBARC5BxoLEAAgACABQeiYARCoBxCpBwsMAEGIpQFBARC6BxoLEAAgACABQfCYARCoBxCpBwsMAEGQpQFBARC7BxoLEAAgACABQfiYARCoBxCpBwsMAEGYpQFBARC8BxoLEAAgACABQYCZARCoBxCpBwsMAEGgpQFBARC9BxoLEAAgACABQYiZARCoBxCpBwsMAEGopQFBARC+BxoLEAAgACABQZCZARCoBxCpBwsMAEGwpQFBARC/BxoLEAAgACABQbiYARCoBxCpBwsMAEHApQFBARDABxoLEAAgACABQcCYARCoBxCpBwsMAEHQpQFBARDBBxoLEAAgACABQciYARCoBxCpBwsMAEHgpQFBARDCBxoLEAAgACABQdCYARCoBxCpBwsMAEHwpQFBARDDBxoLEAAgACABQZiZARCoBxCpBwsMAEH4pQFBARDEBxoLEAAgACABQaCZARCoBxCpBwsUACAAIAE2AgQgAEHE9QA2AgAgAAs9AQF/IwBBEGsiASQAIAAQpAkaIABCADcDACABQQA2AgwgAEEQaiABQQxqIAFBCGoQpQkaIAFBEGokACAAC0YBAX8CQCAAEKYJIAFPDQAgABCbCwALIAAgABCnCSABEKgJIgI2AgAgACACNgIEIAAQqQkgAiABQQJ0ajYCACAAQQAQqgkLXAECfyMAQRBrIgIkACACIAAgARCrCSIBKAIEIQMCQANAIAMgASgCCEYNASAAEKcJIAEoAgQQrAkQrQkgASABKAIEQQRqIgM2AgQMAAsACyABEK4JGiACQRBqJAALEAAgACgCBCAAKAIAa0ECdQsMACAAIAAoAgAQ2QkLMwAgACAAELgJIAAQuAkgABC5CUECdGogABC4CSABQQJ0aiAAELgJIAAQpAdBAnRqELoJCwIAC0oBAX8jAEEgayIBJAAgAUEANgIMIAFB1QA2AgggASABKQMINwMAIAAgAUEQaiABIAAQ5AcQ5QcgACgCBCEAIAFBIGokACAAQX9qC3gBAn8jAEEQayIDJAAgARDHByADQQhqIAEQywchBAJAIABBEGoiARCkByACSw0AIAEgAkEBahDOBwsCQCABIAIQxgcoAgBFDQAgASACEMYHKAIAEM8HGgsgBBDQByEAIAEgAhDGByAANgIAIAQQzAcaIANBEGokAAsVACAAIAEQ5QYaIABByNMANgIAIAALFQAgACABEOUGGiAAQejTADYCACAACzgAIAAgAxDlBhogABD9BxogACACOgAMIAAgATYCCCAAQaTHADYCAAJAIAENACAAEO8HNgIICyAACxsAIAAgARDlBhogABD9BxogAEHUywA2AgAgAAsbACAAIAEQ5QYaIAAQkggaIABB6MwANgIAIAALIwAgACABEOUGGiAAEJIIGiAAQdjHADYCACAAEMUDNgIIIAALGwAgACABEOUGGiAAEJIIGiAAQfzNADYCACAACycAIAAgARDlBhogAEGu2AA7AQggAEGIyAA2AgAgAEEMahChAxogAAsqACAAIAEQ5QYaIABCroCAgMAFNwIIIABBsMgANgIAIABBEGoQoQMaIAALFQAgACABEOUGGiAAQYjUADYCACAACxUAIAAgARDlBhogAEH81QA2AgAgAAsVACAAIAEQ5QYaIABB0NcANgIAIAALFQAgACABEOUGGiAAQbjZADYCACAACxsAIAAgARDlBhogABDdCRogAEGQ4QA2AgAgAAsbACAAIAEQ5QYaIAAQ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JAAgACABNgIAIAAgASgCBCIBNgIEIAAgASACQQJ0ajYCCCAACwQAIAALCQAgACABEMYJCxEAIAAoAgAgACgCBDYCBCAACwQAIAALEQAgARCvCRogAEEANgIAIAALCgAgABCyCRogAAsLACAAQQA6AHAgAAsKACAAQRBqELwJCwcAIAAQuwkLKwACQCABQRxLDQAgAC0AcEH/AXENACAAQQE6AHAgAA8LIAFBAnRBBBC/CQsKACAAQRBqEMAJCwcAIAAQwQkLCgAgACgCABCsCQsHACAAEMIJCwIACwcAIAAQvQkLCgAgAEEQahC+CQsIAEH/////AwsEACAACwcAIAAQ9goLBAAgAAsEACAACxMAIAAQwwkoAgAgACgCAGtBAnULCgAgAEEQahDECQsHACAAEMUJCwQAIAALCQAgAUEANgIACw0AIAAQyAkQyQlBcGoLBwAgABDTCQsHACAAENIJCwcAIAAQ1gkLLQEBf0EKIQECQCAAQQtJDQAgAEEBahDMCSIAIABBf2oiACAAQQtGGyEBCyABCwoAIABBD2pBcHELCwAgACABQQAQzgkLHgACQCAAENQJIAFPDQBBsPQAENcJAAsgAUEBEL8JCwwAIAAQkwkgATYCAAsTACAAEJMJIAFBgICAgHhyNgIICwQAIAALBwAgABDUCQsHACAAENUJCwQAQX8LBAAgAAsEACAACwUAEAEACwsAIAAgASACENoJCzQBAX8gACgCBCECAkADQCACIAFGDQEgABCnCSACQXxqIgIQrAkQ2wkMAAsACyAAIAE2AgQLIAACQCAAIAFHDQAgAEEAOgBwDwsgASACQQJ0QQQQlAkLCQAgACABENwJCwIACwQAIAALBAAgAAsEACAACwQAIAALBAAgAAsNACAAQfz0ADYCACAACw0AIABBoPUANgIAIAALDAAgABDFAzYCACAACwQAIAALYQECfyMAQRBrIgIkACACIAE2AgwCQCAAEKYJIgMgAUkNAAJAIAAQuQkiACADQQF2Tw0AIAIgAEEBdDYCCCACQQhqIAJBDGoQrwEoAgAhAwsgAkEQaiQAIAMPCyAAEJsLAAsCAAsEACAACxEAIAAgARDoCSgCADYCACAACwgAIAAQzwcaCwQAIAALcgECfyMAQRBrIgQkAEEAIQUgBEEANgIMIABBDGogBEEMaiADEPAJGgJAIAFFDQAgABDxCSABEKgJIQULIAAgBTYCACAAIAUgAkECdGoiAjYCCCAAIAI2AgQgABDyCSAFIAFBAnRqNgIAIARBEGokACAAC18BAn8jAEEQayICJAAgAiAAQQhqIAEQ8wkiASgCACEDAkADQCADIAEoAgRGDQEgABDxCSABKAIAEKwJEK0JIAEgASgCAEEEaiIDNgIADAALAAsgARD0CRogAkEQaiQAC1wBAX8gABDVByAAEKcJIAAoAgAgACgCBCABQQRqIgIQ9QkgACACEPYJIABBBGogAUEIahD2CSAAEKkJIAEQ8gkQ9gkgASABKAIENgIAIAAgABCkBxCqCSAAEKcHCyYAIAAQ9wkCQCAAKAIARQ0AIAAQ8QkgACgCACAAEPgJENgJCyAACx0AIAAgARCvCRCwCRogAEEEaiACEPkJEPoJGiAACwoAIABBDGoQ+wkLCgAgAEEMahD8CQsrAQF/IAAgASgCADYCACABKAIAIQMgACABNgIIIAAgAyACQQJ0ajYCBCAACxEAIAAoAgggACgCADYCACAACywBAX8gAyADKAIAIAIgAWsiAmsiBDYCAAJAIAJBAUgNACAEIAEgAhDXCxoLCz4BAX8jAEEQayICJAAgAiAAEP4JKAIANgIMIAAgARD+CSgCADYCACABIAJBDGoQ/gkoAgA2AgAgAkEQaiQACwwAIAAgACgCBBD/CQsTACAAEIAKKAIAIAAoAgBrQQJ1CwQAIAALDgAgACABEPkJNgIAIAALCgAgAEEEahD9CQsHACAAEMEJCwcAIAAoAgALBAAgAAsJACAAIAEQgQoLCgAgAEEMahCCCgs3AQJ/AkADQCAAKAIIIAFGDQEgABDxCSECIAAgACgCCEF8aiIDNgIIIAIgAxCsCRDbCQwACwALCwcAIAAQxQkLDAAgACABEIUKGiAACwcAIAAQhgoLCwAgACABNgIAIAALDQAgACgCABCHChCICgsHACAAEIoKCwcAIAAQiQoLPwECfyAAKAIAIABBCGooAgAiAUEBdWohAiAAKAIEIQACQCABQQFxRQ0AIAIoAgAgAGooAgAhAAsgAiAAEQQACwcAIAAoAgALCQAgACABEIwKCwcAIAEgAGsLBAAgAAsKACAAEJUKGiAACwkAIAAgARCWCgsNACAAEJcKEJgKQXBqCy0BAX9BASEBAkAgAEECSQ0AIABBAWoQmgoiACAAQX9qIgAgAEECRhshAQsgAQsLACAAIAFBABCbCgsMACAAEJ8JIAE2AgALEwAgABCfCSABQYCAgIB4cjYCCAsEACAACwoAIAEgAGtBAnULBwAgABCdCgsHACAAEJwKCwcAIAAQoAoLCgAgAEEDakF8cQshAAJAIAAQngogAU8NAEGw9AAQ1wkACyABQQJ0QQQQvwkLBwAgABCeCgsHACAAEJ8KCwgAQf////8DCwQAIAALBAAgAAsEACAACwkAIAAgARC1AQsdACAAIAEQpgoQpwoaIABBBGogAhC8ARC9ARogAAsHACAAEKgKCwoAIABBBGoQvgELBAAgAAsRACAAIAEQpgooAgA2AgAgAAsEACAACwkAIAAgARCqCgsRACABEJEJEKsKGiAAEJEJGgsEACAACwoAIAEgAGtBAnULCQAgACABEK4KCxEAIAEQnQkQrwoaIAAQnQkaCwQAIAALAgALBAAgAAs+AQF/IwBBEGsiAiQAIAIgABCxCigCADYCDCAAIAEQsQooAgA2AgAgASACQQxqELEKKAIANgIAIAJBEGokAAsKACABIABrQQxtCwUAELUKCwgAQYCAgIB4CwUAELgKCwUAELkKCw0AQoCAgICAgICAgH8LDQBC////////////AAsFABC7CgsGAEH//wMLBABBfwsFABC+CgsEAEJ/CwwAIAAgARDFAxD6AgsMACAAIAEQxQMQ+wILNAEBfyMAQRBrIgMkACADIAEgAhDFAxD8AiAAIAMpAwA3AwAgACADKQMINwMIIANBEGokAAsKACABIABrQQxtCwQAIAALEQAgACABEMMKKAIANgIAIAALBAAgAAsEACAACxEAIAAgARDGCigCADYCACAACwQAIAALCQAgACABEPUECwkAIAAgARCyCgsKACAAEJoJKAIACwoAIAAQmgkQzQoLBwAgABDOCgsEACAAC1kBAX8jAEEQayIDJAAgAyACNgIIAkADQCAAIAFGDQEgACwAACECIANBCGoQoQEgAhCiARogAEEBaiEAIANBCGoQowEaDAALAAsgAygCCCEAIANBEGokACAAC1kBAX8jAEEQayIDJAAgAyACNgIIAkADQCAAIAFGDQEgACgCACECIANBCGoQqgEgAhCrARogAEEEaiEAIANBCGoQrAEaDAALAAsgAygCCCEAIANBEGokACAACwQAIAALCQAgACABENYKCw0AIAEgAE0gACACSXELLAEBfyMAQRBrIgQkACAAIARBCGogAxDXChogACABIAIQ2AogBEEQaiQAIAALGwACQCAAEC1FDQAgACABEMgFDwsgACABEMoFCwcAIAEgAGsLGQAgARApGiAAECoaIAAgAhDZChDaChogAAutAQEEfyMAQRBrIgMkAAJAIAEgAhDSCiIEIAAQxwlLDQACQAJAIARBCksNACAAIAQQygUgABDJBSEFDAELIAQQywkhBSAAIAAQkQkgBUEBaiIGEM0JIgUQzwkgACAGENAJIAAgBBDIBQsCQANAIAEgAkYNASAFIAEQxwUgBUEBaiEFIAFBAWohAQwACwALIANBADoADyAFIANBD2oQxwUgA0EQaiQADwsgABD7CgALBAAgAAsKACABENkKGiAACwQAIAALEQAgACABENsKKAIANgIAIAALBwAgABDfCgsKACAAQQRqEL4BCwQAIAALBAAgAAsNACABLQAAIAItAABGCwQAIAALDQAgASAATSAAIAJJcQssAQF/IwBBEGsiBCQAIAAgBEEIaiADEOUKGiAAIAEgAhDmCiAEQRBqJAAgAAsaACABECkaIAAQjQoaIAAgAhDnChDoChogAAutAQEEfyMAQRBrIgMkAAJAIAEgAhDvCCIEIAAQkApLDQACQAJAIARBAUsNACAAIAQQiQYgABCIBiEFDAELIAQQkQohBSAAIAAQnQkgBUEBaiIGEJIKIgUQkwogACAGEJQKIAAgBBCHBgsCQANAIAEgAkYNASAFIAEQhgYgBUEEaiEFIAFBBGohAQwACwALIANBADYCDCAFIANBDGoQhgYgA0EQaiQADwsgABD7CgALBAAgAAsKACABEOcKGiAACw0AIAEoAgAgAigCAEYLBAAgAAsEACAACwQAIAALAwAACwcAIAAQ0AsLBwAgABDRCwttAEHApwEQ7goaAkADQCAAKAIAQQFHDQFB3KcBQcCnARDxChoMAAsACwJAIAAoAgANACAAEPIKQcCnARDvChogASACEQQAQcCnARDuChogABDzCkHApwEQ7woaQdynARD0ChoPC0HApwEQ7woaCwkAIAAgARDSCwsJACAAQQE2AgALCQAgAEF/NgIACwcAIAAQ0wsLBQAQAQALMwEBfyAAQQEgABshAQJAA0AgARDKCyIADQECQBCsCyIARQ0AIAARBgAMAQsLEAEACyAACwcAIAAQywsLBwAgABD3CgssAQF/AkAgAkUNACAAIQMDQCADIAE2AgAgA0EEaiEDIAJBf2oiAg0ACwsgAAtqAQF/AkACQCAAIAFrQQJ1IAJPDQADQCAAIAJBf2oiAkECdCIDaiABIANqKAIANgIAIAINAAwCCwALIAJFDQAgACEDA0AgAyABKAIANgIAIANBBGohAyABQQRqIQEgAkF/aiICDQALCyAACwoAQfT1ABDXCQALbwECfyMAQRBrIgIkACABEMgJEP0KIAAgAkEIaiACEP4KIQMCQAJAIAEQLQ0AIAEQMCEBIAMQkwkiA0EIaiABQQhqKAIANgIAIAMgASkCADcCAAwBCyAAIAEQLhAoIAEQygMQ/woLIAJBEGokACAACwcAIAAQgAsLGQAgARApGiAAECoaIAAgAhCBCxCCCxogAAuQAQEDfyMAQRBrIgMkAAJAIAAQxwkgAkkNAAJAAkAgAkEKSw0AIAAgAhDKBSAAEMkFIQQMAQsgAhDLCSEEIAAgABCRCSAEQQFqIgUQzQkiBBDPCSAAIAUQ0AkgACACEMgFCyAEENEJIAEgAhBMGiADQQA6AA8gBCACaiADQQ9qEMcFIANBEGokAA8LIAAQ+woACwIACwQAIAALCgAgARCBCxogAAsgAAJAIAAQLUUNACAAEJEJIAAQxgUgABDIAxCPCQsgAAt5AQN/IwBBEGsiAyQAAkACQCAAEKIDIgQgAkkNACAAEMkDENEJIgQgASACEIULGiADQQA6AA8gBCACaiADQQ9qEMcFIAAgAhDVCiAAIAIQsAoMAQsgACAEIAIgBGsgABCYAyIFQQAgBSACIAEQhgsLIANBEGokACAACxYAAkAgAkUNACAAIAEgAhDZCxoLIAALtgIBA38jAEEQayIIJAACQCAAEMcJIgkgAUF/c2ogAkkNACAAEMkDIQoCQAJAIAlBAXZBcGogAU0NACAIIAFBAXQ2AgggCCACIAFqNgIMIAhBDGogCEEIahCvASgCABDLCSECDAELIAlBf2ohAgsgABCRCSACQQFqIgkQzQkhAiAAEMUFAkAgBEUNACACENEJIAoQ0QkgBBBMGgsCQCAGRQ0AIAIQ0QkgBGogByAGEEwaCwJAIAMgBWsiAyAEayIHRQ0AIAIQ0QkgBGogBmogChDRCSAEaiAFaiAHEEwaCwJAIAFBAWoiBEELRg0AIAAQkQkgCiAEEI8JCyAAIAIQzwkgACAJENAJIAAgAyAGaiIEEMgFIAhBADoAByACIARqIAhBB2oQxwUgCEEQaiQADwsgABD7CgALKAEBfwJAIAAQmAMiAyABTw0AIAAgASADayACEIgLGg8LIAAgARCJCwuCAQEEfyMAQRBrIgMkAAJAIAFFDQAgABCiAyEEIAAQmAMiBSABaiEGAkAgBCAFayABTw0AIAAgBCAGIARrIAUgBUEAQQAQigsLIAAQyQMiBBDRCSAFaiABIAIQiwsaIAAgBhDVCiADQQA6AA8gBCAGaiADQQ9qEMcFCyADQRBqJAAgAAtuAQJ/IwBBEGsiAiQAAkACQCAAEC1FDQAgABDGBSEDIAJBADoADyADIAFqIAJBD2oQxwUgACABEMgFDAELIAAQyQUhAyACQQA6AA4gAyABaiACQQ5qEMcFIAAgARDKBQsgACABELAKIAJBEGokAAv6AQEDfyMAQRBrIgckAAJAIAAQxwkiCCABayACSQ0AIAAQyQMhCQJAAkAgCEEBdkFwaiABTQ0AIAcgAUEBdDYCCCAHIAIgAWo2AgwgB0EMaiAHQQhqEK8BKAIAEMsJIQIMAQsgCEF/aiECCyAAEJEJIAJBAWoiCBDNCSECIAAQxQUCQCAERQ0AIAIQ0QkgCRDRCSAEEEwaCwJAIAMgBWsgBGsiA0UNACACENEJIARqIAZqIAkQ0QkgBGogBWogAxBMGgsCQCABQQFqIgFBC0YNACAAEJEJIAkgARCPCQsgACACEM8JIAAgCBDQCSAHQRBqJAAPCyAAEPsKAAsYAAJAIAFFDQAgACACEFIgARDYCxoLIAALhAEBA38jAEEQayIDJAACQAJAIAAQogMiBCAAEJgDIgVrIAJJDQAgAkUNASAAEMkDENEJIgQgBWogASACEEwaIAAgBSACaiICENUKIANBADoADyAEIAJqIANBD2oQxwUMAQsgACAEIAUgAmogBGsgBSAFQQAgAiABEIYLCyADQRBqJAAgAAvFAQEDfyMAQRBrIgIkACACIAE6AA8CQAJAAkACQAJAIAAQLUUNACAAEMgDIQEgABDKAyIDIAFBf2oiBEYNAQwDC0EKIQNBCiEEIAAQywMiAUEKRw0BCyAAIARBASAEIARBAEEAEIoLIAMhASAAEC0NAQsgABDJBSEEIAAgAUEBahDKBQwBCyAAEMYFIQQgACADQQFqEMgFIAMhAQsgBCABaiIAIAJBD2oQxwUgAkEAOgAOIABBAWogAkEOahDHBSACQRBqJAALDQAgACABIAEQExCECwuRAQEDfyMAQRBrIgMkAAJAIAAQxwkgAUkNAAJAAkAgAUEKSw0AIAAgARDKBSAAEMkFIQQMAQsgARDLCSEEIAAgABCRCSAEQQFqIgUQzQkiBBDPCSAAIAUQ0AkgACABEMgFCyAEENEJIAEgAhCLCxogA0EAOgAPIAQgAWogA0EPahDHBSADQRBqJAAPCyAAEPsKAAuTAQEDfyMAQRBrIgMkAAJAIAAQkAogAkkNAAJAAkAgAkEBSw0AIAAgAhCJBiAAEIgGIQQMAQsgAhCRCiEEIAAgABCdCSAEQQFqIgUQkgoiBBCTCiAAIAUQlAogACACEIcGCyAEEKEKIAEgAhBgGiADQQA2AgwgBCACQQJ0aiADQQxqEIYGIANBEGokAA8LIAAQ+woACyEAAkAgABDbBEUNACAAEJ0JIAAQhQYgABCgCRCbCQsgAAt8AQN/IwBBEGsiAyQAAkACQCAAEPAIIgQgAkkNACAAEKIEEKEKIgQgASACEJMLGiADQQA2AgwgBCACQQJ0aiADQQxqEIYGIAAgAhDyCCAAIAIQ8QgMAQsgACAEIAIgBGsgABDWAyIFQQAgBSACIAEQlAsLIANBEGokACAACxcAAkAgAkUNACAAIAEgAhD6CiEACyAAC8cCAQN/IwBBEGsiCCQAAkAgABCQCiIJIAFBf3NqIAJJDQAgABCiBCEKAkACQCAJQQF2QXBqIAFNDQAgCCABQQF0NgIIIAggAiABajYCDCAIQQxqIAhBCGoQrwEoAgAQkQohAgwBCyAJQX9qIQILIAAQnQkgAkEBaiIJEJIKIQIgABCEBgJAIARFDQAgAhChCiAKEKEKIAQQYBoLAkAgBkUNACACEKEKIARBAnRqIAcgBhBgGgsCQCADIAVrIgMgBGsiB0UNACACEKEKIARBAnQiBGogBkECdGogChChCiAEaiAFQQJ0aiAHEGAaCwJAIAFBAWoiAUECRg0AIAAQnQkgCiABEJsJCyAAIAIQkwogACAJEJQKIAAgAyAGaiIBEIcGIAhBADYCBCACIAFBAnRqIAhBBGoQhgYgCEEQaiQADwsgABD7CgALhQIBA38jAEEQayIHJAACQCAAEJAKIgggAWsgAkkNACAAEKIEIQkCQAJAIAhBAXZBcGogAU0NACAHIAFBAXQ2AgggByACIAFqNgIMIAdBDGogB0EIahCvASgCABCRCiECDAELIAhBf2ohAgsgABCdCSACQQFqIggQkgohAiAAEIQGAkAgBEUNACACEKEKIAkQoQogBBBgGgsCQCADIAVrIARrIgNFDQAgAhChCiAEQQJ0IgRqIAZBAnRqIAkQoQogBGogBUECdGogAxBgGgsCQCABQQFqIgFBAkYNACAAEJ0JIAkgARCbCQsgACACEJMKIAAgCBCUCiAHQRBqJAAPCyAAEPsKAAsXAAJAIAFFDQAgACACIAEQ+QohAAsgAAuKAQEDfyMAQRBrIgMkAAJAAkAgABDwCCIEIAAQ1gMiBWsgAkkNACACRQ0BIAAQogQQoQoiBCAFQQJ0aiABIAIQYBogACAFIAJqIgIQ8gggA0EANgIMIAQgAkECdGogA0EMahCGBgwBCyAAIAQgBSACaiAEayAFIAVBACACIAEQlAsLIANBEGokACAAC8oBAQN/IwBBEGsiAiQAIAIgATYCDAJAAkACQAJAAkAgABDbBEUNACAAEKAJIQEgABDcBCIDIAFBf2oiBEYNAQwDC0EBIQNBASEEIAAQ3QQiAUEBRw0BCyAAIARBASAEIARBAEEAEJULIAMhASAAENsEDQELIAAQiAYhBCAAIAFBAWoQiQYMAQsgABCFBiEEIAAgA0EBahCHBiADIQELIAQgAUECdGoiACACQQxqEIYGIAJBADYCCCAAQQRqIAJBCGoQhgYgAkEQaiQACw4AIAAgASABEMcIEJILC5QBAQN/IwBBEGsiAyQAAkAgABCQCiABSQ0AAkACQCABQQFLDQAgACABEIkGIAAQiAYhBAwBCyABEJEKIQQgACAAEJ0JIARBAWoiBRCSCiIEEJMKIAAgBRCUCiAAIAEQhwYLIAQQoQogASACEJYLGiADQQA2AgwgBCABQQJ0aiADQQxqEIYGIANBEGokAA8LIAAQ+woACwoAQYH2ABDXCQALAwAACyIBAX8jAEEQayIBJAAgASAAEJ4LEJ8LIQAgAUEQaiQAIAALDAAgACABEKALGiAACzkBAn8jAEEQayIBJABBACECAkAgAUEIaiAAKAIEEKELEKILDQAgABCjCxCkCyECCyABQRBqJAAgAgsjACAAQQA2AgwgACABNgIEIAAgATYCACAAIAFBAWo2AgggAAsLACAAIAE2AgAgAAsKACAAKAIAEKkLCwQAIAALPgECf0EAIQECQAJAIAAoAggiAC0AACICQQFGDQAgAkECcQ0BIABBAjoAAEEBIQELIAEPC0GI9gBBABCcCwALHgEBfyMAQRBrIgEkACABIAAQngsQpgsgAUEQaiQACywBAX8jAEEQayIBJAAgAUEIaiAAKAIEEKELEKcLIAAQowsQqAsgAUEQaiQACwoAIAAoAgAQqgsLDAAgACgCCEEBOgAACwcAIAAtAAALCQAgAEEBOgAACwcAIAAoAgALCQBBjKgBEKsLCwwAQb72AEEAEJwLAAsEACAACwoAIAAQrgsaIAALAgALAgALDQAgABCvCxogABD3CgsNACAAEK8LGiAAEPcKCw0AIAAQrwsaIAAQ9woLLAACQCACDQAgACABELYLDwsCQCAAIAFHDQBBAQ8LIAAQtwsgARC3CxC8AkULDQAgACgCBCABKAIERgsHACAAKAIEC7ABAQJ/IwBBwABrIgMkAEEBIQQCQCAAIAFBABC1Cw0AQQAhBCABRQ0AQQAhBCABQZj3AEHI9wBBABC5CyIBRQ0AIANBCGpBBHJBAEE0ENgLGiADQQE2AjggA0F/NgIUIAMgADYCECADIAE2AgggASADQQhqIAIoAgBBASABKAIAKAIcEQ0AAkAgAygCICIEQQFHDQAgAiADKAIYNgIACyAEQQFGIQQLIANBwABqJAAgBAuqAgEDfyMAQcAAayIEJAAgACgCACIFQXxqKAIAIQYgBUF4aigCACEFIAQgAzYCFCAEIAE2AhAgBCAANgIMIAQgAjYCCEEAIQEgBEEYakEAQScQ2AsaIAAgBWohAAJAAkAgBiACQQAQtQtFDQAgBEEBNgI4IAYgBEEIaiAAIABBAUEAIAYoAgAoAhQRCAAgAEEAIAQoAiBBAUYbIQEMAQsgBiAEQQhqIABBAUEAIAYoAgAoAhgRDgACQAJAIAQoAiwOAgABAgsgBCgCHEEAIAQoAihBAUYbQQAgBCgCJEEBRhtBACAEKAIwQQFGGyEBDAELAkAgBCgCIEEBRg0AIAQoAjANASAEKAIkQQFHDQEgBCgCKEEBRw0BCyAEKAIYIQELIARBwABqJAAgAQtgAQF/AkAgASgCECIEDQAgAUEBNgIkIAEgAzYCGCABIAI2AhAPCwJAAkAgBCACRw0AIAEoAhhBAkcNASABIAM2AhgPCyABQQE6ADYgAUECNgIYIAEgASgCJEEBajYCJAsLHwACQCAAIAEoAghBABC1C0UNACABIAEgAiADELoLCws4AAJAIAAgASgCCEEAELULRQ0AIAEgASACIAMQugsPCyAAKAIIIgAgASACIAMgACgCACgCHBENAAtaAQJ/IAAoAgQhBAJAAkAgAg0AQQAhBQwBCyAEQQh1IQUgBEEBcUUNACACKAIAIAVqKAIAIQULIAAoAgAiACABIAIgBWogA0ECIARBAnEbIAAoAgAoAhwRDQALdQECfwJAIAAgASgCCEEAELULRQ0AIAAgASACIAMQugsPCyAAKAIMIQQgAEEQaiIFIAEgAiADEL0LAkAgBEECSA0AIAUgBEEDdGohBCAAQRhqIQADQCAAIAEgAiADEL0LIAEtADYNASAAQQhqIgAgBEkNAAsLC6gBACABQQE6ADUCQCABKAIEIANHDQAgAUEBOgA0AkAgASgCECIDDQAgAUEBNgIkIAEgBDYCGCABIAI2AhAgBEEBRw0BIAEoAjBBAUcNASABQQE6ADYPCwJAIAMgAkcNAAJAIAEoAhgiA0ECRw0AIAEgBDYCGCAEIQMLIAEoAjBBAUcNASADQQFHDQEgAUEBOgA2DwsgAUEBOgA2IAEgASgCJEEBajYCJAsLIAACQCABKAIEIAJHDQAgASgCHEEBRg0AIAEgAzYCHAsL0AQBBH8CQCAAIAEoAgggBBC1C0UNACABIAEgAiADEMALDwsCQAJAIAAgASgCACAEELULRQ0AAkACQCABKAIQIAJGDQAgASgCFCACRw0BCyADQQFHDQIgAUEBNgIgDwsgASADNgIgAkAgASgCLEEERg0AIABBEGoiBSAAKAIMQQN0aiEDQQAhBkEAIQcCQAJAAkADQCAFIANPDQEgAUEAOwE0IAUgASACIAJBASAEEMILIAEtADYNAQJAIAEtADVFDQACQCABLQA0RQ0AQQEhCCABKAIYQQFGDQRBASEGQQEhB0EBIQggAC0ACEECcQ0BDAQLQQEhBiAHIQggAC0ACEEBcUUNAwsgBUEIaiEFDAALAAtBBCEFIAchCCAGQQFxRQ0BC0EDIQULIAEgBTYCLCAIQQFxDQILIAEgAjYCFCABIAEoAihBAWo2AiggASgCJEEBRw0BIAEoAhhBAkcNASABQQE6ADYPCyAAKAIMIQUgAEEQaiIIIAEgAiADIAQQwwsgBUECSA0AIAggBUEDdGohCCAAQRhqIQUCQAJAIAAoAggiAEECcQ0AIAEoAiRBAUcNAQsDQCABLQA2DQIgBSABIAIgAyAEEMMLIAVBCGoiBSAISQ0ADAILAAsCQCAAQQFxDQADQCABLQA2DQIgASgCJEEBRg0CIAUgASACIAMgBBDDCyAFQQhqIgUgCEkNAAwCCwALA0AgAS0ANg0BAkAgASgCJEEBRw0AIAEoAhhBAUYNAgsgBSABIAIgAyAEEMMLIAVBCGoiBSAISQ0ACwsLTwECfyAAKAIEIgZBCHUhBwJAIAZBAXFFDQAgAygCACAHaigCACEHCyAAKAIAIgAgASACIAMgB2ogBEECIAZBAnEbIAUgACgCACgCFBEIAAtNAQJ/IAAoAgQiBUEIdSEGAkAgBUEBcUUNACACKAIAIAZqKAIAIQYLIAAoAgAiACABIAIgBmogA0ECIAVBAnEbIAQgACgCACgCGBEOAAuCAgACQCAAIAEoAgggBBC1C0UNACABIAEgAiADEMALDwsCQAJAIAAgASgCACAEELULRQ0AAkACQCABKAIQIAJGDQAgASgCFCACRw0BCyADQQFHDQIgAUEBNgIgDwsgASADNgIgAkAgASgCLEEERg0AIAFBADsBNCAAKAIIIgAgASACIAJBASAEIAAoAgAoAhQRCAACQCABLQA1RQ0AIAFBAzYCLCABLQA0RQ0BDAMLIAFBBDYCLAsgASACNgIUIAEgASgCKEEBajYCKCABKAIkQQFHDQEgASgCGEECRw0BIAFBAToANg8LIAAoAggiACABIAIgAyAEIAAoAgAoAhgRDgALC5sBAAJAIAAgASgCCCAEELULRQ0AIAEgASACIAMQwAsPCwJAIAAgASgCACAEELULRQ0AAkACQCABKAIQIAJGDQAgASgCFCACRw0BCyADQQFHDQEgAUEBNgIgDwsgASACNgIUIAEgAzYCICABIAEoAihBAWo2AigCQCABKAIkQQFHDQAgASgCGEECRw0AIAFBAToANgsgAUEENgIsCwunAgEGfwJAIAAgASgCCCAFELULRQ0AIAEgASACIAMgBBC/Cw8LIAEtADUhBiAAKAIMIQcgAUEAOgA1IAEtADQhCCABQQA6ADQgAEEQaiIJIAEgAiADIAQgBRDCCyAGIAEtADUiCnIhBiAIIAEtADQiC3IhCAJAIAdBAkgNACAJIAdBA3RqIQkgAEEYaiEHA0AgAS0ANg0BAkACQCALQf8BcUUNACABKAIYQQFGDQMgAC0ACEECcQ0BDAMLIApB/wFxRQ0AIAAtAAhBAXFFDQILIAFBADsBNCAHIAEgAiADIAQgBRDCCyABLQA1IgogBnIhBiABLQA0IgsgCHIhCCAHQQhqIgcgCUkNAAsLIAEgBkH/AXFBAEc6ADUgASAIQf8BcUEARzoANAs+AAJAIAAgASgCCCAFELULRQ0AIAEgASACIAMgBBC/Cw8LIAAoAggiACABIAIgAyAEIAUgACgCACgCFBEIAAshAAJAIAAgASgCCCAFELULRQ0AIAEgASACIAMgBBC/CwsLBABBAAvdMAEMfyMAQRBrIgEkAAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIABB9AFLDQACQEEAKAKQqAEiAkEQIABBC2pBeHEgAEELSRsiA0EDdiIEdiIAQQNxRQ0AIABBf3NBAXEgBGoiA0EDdCIFQcCoAWooAgAiBEEIaiEAAkACQCAEKAIIIgYgBUG4qAFqIgVHDQBBACACQX4gA3dxNgKQqAEMAQtBACgCoKgBIAZLGiAGIAU2AgwgBSAGNgIICyAEIANBA3QiBkEDcjYCBCAEIAZqIgQgBCgCBEEBcjYCBAwNCyADQQAoApioASIHTQ0BAkAgAEUNAAJAAkAgACAEdEECIAR0IgBBACAAa3JxIgBBACAAa3FBf2oiACAAQQx2QRBxIgB2IgRBBXZBCHEiBiAAciAEIAZ2IgBBAnZBBHEiBHIgACAEdiIAQQF2QQJxIgRyIAAgBHYiAEEBdkEBcSIEciAAIAR2aiIGQQN0IgVBwKgBaigCACIEKAIIIgAgBUG4qAFqIgVHDQBBACACQX4gBndxIgI2ApCoAQwBC0EAKAKgqAEgAEsaIAAgBTYCDCAFIAA2AggLIARBCGohACAEIANBA3I2AgQgBCADaiIFIAZBA3QiCCADayIGQQFyNgIEIAQgCGogBjYCAAJAIAdFDQAgB0EDdiIIQQN0QbioAWohA0EAKAKkqAEhBAJAAkAgAkEBIAh0IghxDQBBACACIAhyNgKQqAEgAyEIDAELIAMoAgghCAsgAyAENgIIIAggBDYCDCAEIAM2AgwgBCAINgIIC0EAIAU2AqSoAUEAIAY2ApioAQwNC0EAKAKUqAEiCUUNASAJQQAgCWtxQX9qIgAgAEEMdkEQcSIAdiIEQQV2QQhxIgYgAHIgBCAGdiIAQQJ2QQRxIgRyIAAgBHYiAEEBdkECcSIEciAAIAR2IgBBAXZBAXEiBHIgACAEdmpBAnRBwKoBaigCACIFKAIEQXhxIANrIQQgBSEGAkADQAJAIAYoAhAiAA0AIAZBFGooAgAiAEUNAgsgACgCBEF4cSADayIGIAQgBiAESSIGGyEEIAAgBSAGGyEFIAAhBgwACwALIAUgA2oiCiAFTQ0CIAUoAhghCwJAIAUoAgwiCCAFRg0AAkBBACgCoKgBIAUoAggiAEsNACAAKAIMIAVHGgsgACAINgIMIAggADYCCAwMCwJAIAVBFGoiBigCACIADQAgBSgCECIARQ0EIAVBEGohBgsDQCAGIQwgACIIQRRqIgYoAgAiAA0AIAhBEGohBiAIKAIQIgANAAsgDEEANgIADAsLQX8hAyAAQb9/Sw0AIABBC2oiAEF4cSEDQQAoApSoASIHRQ0AQR8hDAJAIANB////B0sNACAAQQh2IgAgAEGA/j9qQRB2QQhxIgB0IgQgBEGA4B9qQRB2QQRxIgR0IgYgBkGAgA9qQRB2QQJxIgZ0QQ92IAAgBHIgBnJrIgBBAXQgAyAAQRVqdkEBcXJBHGohDAtBACADayEEAkACQAJAAkAgDEECdEHAqgFqKAIAIgYNAEEAIQBBACEIDAELQQAhACADQQBBGSAMQQF2ayAMQR9GG3QhBUEAIQgDQAJAIAYoAgRBeHEgA2siAiAETw0AIAIhBCAGIQggAg0AQQAhBCAGIQggBiEADAMLIAAgBkEUaigCACICIAIgBiAFQR12QQRxakEQaigCACIGRhsgACACGyEAIAVBAXQhBSAGDQALCwJAIAAgCHINAEECIAx0IgBBACAAa3IgB3EiAEUNAyAAQQAgAGtxQX9qIgAgAEEMdkEQcSIAdiIGQQV2QQhxIgUgAHIgBiAFdiIAQQJ2QQRxIgZyIAAgBnYiAEEBdkECcSIGciAAIAZ2IgBBAXZBAXEiBnIgACAGdmpBAnRBwKoBaigCACEACyAARQ0BCwNAIAAoAgRBeHEgA2siAiAESSEFAkAgACgCECIGDQAgAEEUaigCACEGCyACIAQgBRshBCAAIAggBRshCCAGIQAgBg0ACwsgCEUNACAEQQAoApioASADa08NACAIIANqIgwgCE0NASAIKAIYIQkCQCAIKAIMIgUgCEYNAAJAQQAoAqCoASAIKAIIIgBLDQAgACgCDCAIRxoLIAAgBTYCDCAFIAA2AggMCgsCQCAIQRRqIgYoAgAiAA0AIAgoAhAiAEUNBCAIQRBqIQYLA0AgBiECIAAiBUEUaiIGKAIAIgANACAFQRBqIQYgBSgCECIADQALIAJBADYCAAwJCwJAQQAoApioASIAIANJDQBBACgCpKgBIQQCQAJAIAAgA2siBkEQSQ0AQQAgBjYCmKgBQQAgBCADaiIFNgKkqAEgBSAGQQFyNgIEIAQgAGogBjYCACAEIANBA3I2AgQMAQtBAEEANgKkqAFBAEEANgKYqAEgBCAAQQNyNgIEIAQgAGoiACAAKAIEQQFyNgIECyAEQQhqIQAMCwsCQEEAKAKcqAEiBSADTQ0AQQAgBSADayIENgKcqAFBAEEAKAKoqAEiACADaiIGNgKoqAEgBiAEQQFyNgIEIAAgA0EDcjYCBCAAQQhqIQAMCwsCQAJAQQAoAuirAUUNAEEAKALwqwEhBAwBC0EAQn83AvSrAUEAQoCggICAgAQ3AuyrAUEAIAFBDGpBcHFB2KrVqgVzNgLoqwFBAEEANgL8qwFBAEEANgLMqwFBgCAhBAtBACEAIAQgA0EvaiIHaiICQQAgBGsiDHEiCCADTQ0KQQAhAAJAQQAoAsirASIERQ0AQQAoAsCrASIGIAhqIgkgBk0NCyAJIARLDQsLQQAtAMyrAUEEcQ0FAkACQAJAQQAoAqioASIERQ0AQdCrASEAA0ACQCAAKAIAIgYgBEsNACAGIAAoAgRqIARLDQMLIAAoAggiAA0ACwtBABDPCyIFQX9GDQYgCCECAkBBACgC7KsBIgBBf2oiBCAFcUUNACAIIAVrIAQgBWpBACAAa3FqIQILIAIgA00NBiACQf7///8HSw0GAkBBACgCyKsBIgBFDQBBACgCwKsBIgQgAmoiBiAETQ0HIAYgAEsNBwsgAhDPCyIAIAVHDQEMCAsgAiAFayAMcSICQf7///8HSw0FIAIQzwsiBSAAKAIAIAAoAgRqRg0EIAUhAAsCQCADQTBqIAJNDQAgAEF/Rg0AAkAgByACa0EAKALwqwEiBGpBACAEa3EiBEH+////B00NACAAIQUMCAsCQCAEEM8LQX9GDQAgBCACaiECIAAhBQwIC0EAIAJrEM8LGgwFCyAAIQUgAEF/Rw0GDAQLAAtBACEIDAcLQQAhBQwFCyAFQX9HDQILQQBBACgCzKsBQQRyNgLMqwELIAhB/v///wdLDQEgCBDPCyIFQQAQzwsiAE8NASAFQX9GDQEgAEF/Rg0BIAAgBWsiAiADQShqTQ0BC0EAQQAoAsCrASACaiIANgLAqwECQCAAQQAoAsSrAU0NAEEAIAA2AsSrAQsCQAJAAkACQEEAKAKoqAEiBEUNAEHQqwEhAANAIAUgACgCACIGIAAoAgQiCGpGDQIgACgCCCIADQAMAwsACwJAAkBBACgCoKgBIgBFDQAgBSAATw0BC0EAIAU2AqCoAQtBACEAQQAgAjYC1KsBQQAgBTYC0KsBQQBBfzYCsKgBQQBBACgC6KsBNgK0qAFBAEEANgLcqwEDQCAAQQN0IgRBwKgBaiAEQbioAWoiBjYCACAEQcSoAWogBjYCACAAQQFqIgBBIEcNAAtBACACQVhqIgBBeCAFa0EHcUEAIAVBCGpBB3EbIgRrIgY2ApyoAUEAIAUgBGoiBDYCqKgBIAQgBkEBcjYCBCAFIABqQSg2AgRBAEEAKAL4qwE2AqyoAQwCCyAALQAMQQhxDQAgBSAETQ0AIAYgBEsNACAAIAggAmo2AgRBACAEQXggBGtBB3FBACAEQQhqQQdxGyIAaiIGNgKoqAFBAEEAKAKcqAEgAmoiBSAAayIANgKcqAEgBiAAQQFyNgIEIAQgBWpBKDYCBEEAQQAoAvirATYCrKgBDAELAkAgBUEAKAKgqAEiCE8NAEEAIAU2AqCoASAFIQgLIAUgAmohBkHQqwEhAAJAAkACQAJAAkACQAJAA0AgACgCACAGRg0BIAAoAggiAA0ADAILAAsgAC0ADEEIcUUNAQtB0KsBIQADQAJAIAAoAgAiBiAESw0AIAYgACgCBGoiBiAESw0DCyAAKAIIIQAMAAsACyAAIAU2AgAgACAAKAIEIAJqNgIEIAVBeCAFa0EHcUEAIAVBCGpBB3EbaiIMIANBA3I2AgQgBkF4IAZrQQdxQQAgBkEIakEHcRtqIgUgDGsgA2shACAMIANqIQYCQCAEIAVHDQBBACAGNgKoqAFBAEEAKAKcqAEgAGoiADYCnKgBIAYgAEEBcjYCBAwDCwJAQQAoAqSoASAFRw0AQQAgBjYCpKgBQQBBACgCmKgBIABqIgA2ApioASAGIABBAXI2AgQgBiAAaiAANgIADAMLAkAgBSgCBCIEQQNxQQFHDQAgBEF4cSEHAkACQCAEQf8BSw0AIAUoAgwhAwJAIAUoAggiAiAEQQN2IglBA3RBuKgBaiIERg0AIAggAksaCwJAIAMgAkcNAEEAQQAoApCoAUF+IAl3cTYCkKgBDAILAkAgAyAERg0AIAggA0saCyACIAM2AgwgAyACNgIIDAELIAUoAhghCQJAAkAgBSgCDCICIAVGDQACQCAIIAUoAggiBEsNACAEKAIMIAVHGgsgBCACNgIMIAIgBDYCCAwBCwJAIAVBFGoiBCgCACIDDQAgBUEQaiIEKAIAIgMNAEEAIQIMAQsDQCAEIQggAyICQRRqIgQoAgAiAw0AIAJBEGohBCACKAIQIgMNAAsgCEEANgIACyAJRQ0AAkACQCAFKAIcIgNBAnRBwKoBaiIEKAIAIAVHDQAgBCACNgIAIAINAUEAQQAoApSoAUF+IAN3cTYClKgBDAILIAlBEEEUIAkoAhAgBUYbaiACNgIAIAJFDQELIAIgCTYCGAJAIAUoAhAiBEUNACACIAQ2AhAgBCACNgIYCyAFKAIUIgRFDQAgAkEUaiAENgIAIAQgAjYCGAsgByAAaiEAIAUgB2ohBQsgBSAFKAIEQX5xNgIEIAYgAEEBcjYCBCAGIABqIAA2AgACQCAAQf8BSw0AIABBA3YiBEEDdEG4qAFqIQACQAJAQQAoApCoASIDQQEgBHQiBHENAEEAIAMgBHI2ApCoASAAIQQMAQsgACgCCCEECyAAIAY2AgggBCAGNgIMIAYgADYCDCAGIAQ2AggMAwtBHyEEAkAgAEH///8HSw0AIABBCHYiBCAEQYD+P2pBEHZBCHEiBHQiAyADQYDgH2pBEHZBBHEiA3QiBSAFQYCAD2pBEHZBAnEiBXRBD3YgBCADciAFcmsiBEEBdCAAIARBFWp2QQFxckEcaiEECyAGIAQ2AhwgBkIANwIQIARBAnRBwKoBaiEDAkACQEEAKAKUqAEiBUEBIAR0IghxDQBBACAFIAhyNgKUqAEgAyAGNgIAIAYgAzYCGAwBCyAAQQBBGSAEQQF2ayAEQR9GG3QhBCADKAIAIQUDQCAFIgMoAgRBeHEgAEYNAyAEQR12IQUgBEEBdCEEIAMgBUEEcWpBEGoiCCgCACIFDQALIAggBjYCACAGIAM2AhgLIAYgBjYCDCAGIAY2AggMAgtBACACQVhqIgBBeCAFa0EHcUEAIAVBCGpBB3EbIghrIgw2ApyoAUEAIAUgCGoiCDYCqKgBIAggDEEBcjYCBCAFIABqQSg2AgRBAEEAKAL4qwE2AqyoASAEIAZBJyAGa0EHcUEAIAZBWWpBB3EbakFRaiIAIAAgBEEQakkbIghBGzYCBCAIQRBqQQApAtirATcCACAIQQApAtCrATcCCEEAIAhBCGo2AtirAUEAIAI2AtSrAUEAIAU2AtCrAUEAQQA2AtyrASAIQRhqIQADQCAAQQc2AgQgAEEIaiEFIABBBGohACAGIAVLDQALIAggBEYNAyAIIAgoAgRBfnE2AgQgBCAIIARrIgJBAXI2AgQgCCACNgIAAkAgAkH/AUsNACACQQN2IgZBA3RBuKgBaiEAAkACQEEAKAKQqAEiBUEBIAZ0IgZxDQBBACAFIAZyNgKQqAEgACEGDAELIAAoAgghBgsgACAENgIIIAYgBDYCDCAEIAA2AgwgBCAGNgIIDAQLQR8hAAJAIAJB////B0sNACACQQh2IgAgAEGA/j9qQRB2QQhxIgB0IgYgBkGA4B9qQRB2QQRxIgZ0IgUgBUGAgA9qQRB2QQJxIgV0QQ92IAAgBnIgBXJrIgBBAXQgAiAAQRVqdkEBcXJBHGohAAsgBEIANwIQIARBHGogADYCACAAQQJ0QcCqAWohBgJAAkBBACgClKgBIgVBASAAdCIIcQ0AQQAgBSAIcjYClKgBIAYgBDYCACAEQRhqIAY2AgAMAQsgAkEAQRkgAEEBdmsgAEEfRht0IQAgBigCACEFA0AgBSIGKAIEQXhxIAJGDQQgAEEddiEFIABBAXQhACAGIAVBBHFqQRBqIggoAgAiBQ0ACyAIIAQ2AgAgBEEYaiAGNgIACyAEIAQ2AgwgBCAENgIIDAMLIAMoAggiACAGNgIMIAMgBjYCCCAGQQA2AhggBiADNgIMIAYgADYCCAsgDEEIaiEADAULIAYoAggiACAENgIMIAYgBDYCCCAEQRhqQQA2AgAgBCAGNgIMIAQgADYCCAtBACgCnKgBIgAgA00NAEEAIAAgA2siBDYCnKgBQQBBACgCqKgBIgAgA2oiBjYCqKgBIAYgBEEBcjYCBCAAIANBA3I2AgQgAEEIaiEADAMLEMEBQTA2AgBBACEADAILAkAgCUUNAAJAAkAgCCAIKAIcIgZBAnRBwKoBaiIAKAIARw0AIAAgBTYCACAFDQFBACAHQX4gBndxIgc2ApSoAQwCCyAJQRBBFCAJKAIQIAhGG2ogBTYCACAFRQ0BCyAFIAk2AhgCQCAIKAIQIgBFDQAgBSAANgIQIAAgBTYCGAsgCEEUaigCACIARQ0AIAVBFGogADYCACAAIAU2AhgLAkACQCAEQQ9LDQAgCCAEIANqIgBBA3I2AgQgCCAAaiIAIAAoAgRBAXI2AgQMAQsgCCADQQNyNgIEIAwgBEEBcjYCBCAMIARqIAQ2AgACQCAEQf8BSw0AIARBA3YiBEEDdEG4qAFqIQACQAJAQQAoApCoASIGQQEgBHQiBHENAEEAIAYgBHI2ApCoASAAIQQMAQsgACgCCCEECyAAIAw2AgggBCAMNgIMIAwgADYCDCAMIAQ2AggMAQtBHyEAAkAgBEH///8HSw0AIARBCHYiACAAQYD+P2pBEHZBCHEiAHQiBiAGQYDgH2pBEHZBBHEiBnQiAyADQYCAD2pBEHZBAnEiA3RBD3YgACAGciADcmsiAEEBdCAEIABBFWp2QQFxckEcaiEACyAMIAA2AhwgDEIANwIQIABBAnRBwKoBaiEGAkACQAJAIAdBASAAdCIDcQ0AQQAgByADcjYClKgBIAYgDDYCACAMIAY2AhgMAQsgBEEAQRkgAEEBdmsgAEEfRht0IQAgBigCACEDA0AgAyIGKAIEQXhxIARGDQIgAEEddiEDIABBAXQhACAGIANBBHFqQRBqIgUoAgAiAw0ACyAFIAw2AgAgDCAGNgIYCyAMIAw2AgwgDCAMNgIIDAELIAYoAggiACAMNgIMIAYgDDYCCCAMQQA2AhggDCAGNgIMIAwgADYCCAsgCEEIaiEADAELAkAgC0UNAAJAAkAgBSAFKAIcIgZBAnRBwKoBaiIAKAIARw0AIAAgCDYCACAIDQFBACAJQX4gBndxNgKUqAEMAgsgC0EQQRQgCygCECAFRhtqIAg2AgAgCEUNAQsgCCALNgIYAkAgBSgCECIARQ0AIAggADYCECAAIAg2AhgLIAVBFGooAgAiAEUNACAIQRRqIAA2AgAgACAINgIYCwJAAkAgBEEPSw0AIAUgBCADaiIAQQNyNgIEIAUgAGoiACAAKAIEQQFyNgIEDAELIAUgA0EDcjYCBCAKIARBAXI2AgQgCiAEaiAENgIAAkAgB0UNACAHQQN2IgNBA3RBuKgBaiEGQQAoAqSoASEAAkACQEEBIAN0IgMgAnENAEEAIAMgAnI2ApCoASAGIQMMAQsgBigCCCEDCyAGIAA2AgggAyAANgIMIAAgBjYCDCAAIAM2AggLQQAgCjYCpKgBQQAgBDYCmKgBCyAFQQhqIQALIAFBEGokACAAC4wOAQd/AkAgAEUNACAAQXhqIgEgAEF8aigCACICQXhxIgBqIQMCQCACQQFxDQAgAkEDcUUNASABIAEoAgAiAmsiAUEAKAKgqAEiBEkNASACIABqIQACQEEAKAKkqAEgAUYNAAJAIAJB/wFLDQAgASgCDCEFAkAgASgCCCIGIAJBA3YiB0EDdEG4qAFqIgJGDQAgBCAGSxoLAkAgBSAGRw0AQQBBACgCkKgBQX4gB3dxNgKQqAEMAwsCQCAFIAJGDQAgBCAFSxoLIAYgBTYCDCAFIAY2AggMAgsgASgCGCEHAkACQCABKAIMIgUgAUYNAAJAIAQgASgCCCICSw0AIAIoAgwgAUcaCyACIAU2AgwgBSACNgIIDAELAkAgAUEUaiICKAIAIgQNACABQRBqIgIoAgAiBA0AQQAhBQwBCwNAIAIhBiAEIgVBFGoiAigCACIEDQAgBUEQaiECIAUoAhAiBA0ACyAGQQA2AgALIAdFDQECQAJAIAEoAhwiBEECdEHAqgFqIgIoAgAgAUcNACACIAU2AgAgBQ0BQQBBACgClKgBQX4gBHdxNgKUqAEMAwsgB0EQQRQgBygCECABRhtqIAU2AgAgBUUNAgsgBSAHNgIYAkAgASgCECICRQ0AIAUgAjYCECACIAU2AhgLIAEoAhQiAkUNASAFQRRqIAI2AgAgAiAFNgIYDAELIAMoAgQiAkEDcUEDRw0AQQAgADYCmKgBIAMgAkF+cTYCBCABIABBAXI2AgQgASAAaiAANgIADwsgAyABTQ0AIAMoAgQiAkEBcUUNAAJAAkAgAkECcQ0AAkBBACgCqKgBIANHDQBBACABNgKoqAFBAEEAKAKcqAEgAGoiADYCnKgBIAEgAEEBcjYCBCABQQAoAqSoAUcNA0EAQQA2ApioAUEAQQA2AqSoAQ8LAkBBACgCpKgBIANHDQBBACABNgKkqAFBAEEAKAKYqAEgAGoiADYCmKgBIAEgAEEBcjYCBCABIABqIAA2AgAPCyACQXhxIABqIQACQAJAIAJB/wFLDQAgAygCDCEEAkAgAygCCCIFIAJBA3YiA0EDdEG4qAFqIgJGDQBBACgCoKgBIAVLGgsCQCAEIAVHDQBBAEEAKAKQqAFBfiADd3E2ApCoAQwCCwJAIAQgAkYNAEEAKAKgqAEgBEsaCyAFIAQ2AgwgBCAFNgIIDAELIAMoAhghBwJAAkAgAygCDCIFIANGDQACQEEAKAKgqAEgAygCCCICSw0AIAIoAgwgA0caCyACIAU2AgwgBSACNgIIDAELAkAgA0EUaiICKAIAIgQNACADQRBqIgIoAgAiBA0AQQAhBQwBCwNAIAIhBiAEIgVBFGoiAigCACIEDQAgBUEQaiECIAUoAhAiBA0ACyAGQQA2AgALIAdFDQACQAJAIAMoAhwiBEECdEHAqgFqIgIoAgAgA0cNACACIAU2AgAgBQ0BQQBBACgClKgBQX4gBHdxNgKUqAEMAgsgB0EQQRQgBygCECADRhtqIAU2AgAgBUUNAQsgBSAHNgIYAkAgAygCECICRQ0AIAUgAjYCECACIAU2AhgLIAMoAhQiAkUNACAFQRRqIAI2AgAgAiAFNgIYCyABIABBAXI2AgQgASAAaiAANgIAIAFBACgCpKgBRw0BQQAgADYCmKgBDwsgAyACQX5xNgIEIAEgAEEBcjYCBCABIABqIAA2AgALAkAgAEH/AUsNACAAQQN2IgJBA3RBuKgBaiEAAkACQEEAKAKQqAEiBEEBIAJ0IgJxDQBBACAEIAJyNgKQqAEgACECDAELIAAoAgghAgsgACABNgIIIAIgATYCDCABIAA2AgwgASACNgIIDwtBHyECAkAgAEH///8HSw0AIABBCHYiAiACQYD+P2pBEHZBCHEiAnQiBCAEQYDgH2pBEHZBBHEiBHQiBSAFQYCAD2pBEHZBAnEiBXRBD3YgAiAEciAFcmsiAkEBdCAAIAJBFWp2QQFxckEcaiECCyABQgA3AhAgAUEcaiACNgIAIAJBAnRBwKoBaiEEAkACQAJAAkBBACgClKgBIgVBASACdCIDcQ0AQQAgBSADcjYClKgBIAQgATYCACABQRhqIAQ2AgAMAQsgAEEAQRkgAkEBdmsgAkEfRht0IQIgBCgCACEFA0AgBSIEKAIEQXhxIABGDQIgAkEddiEFIAJBAXQhAiAEIAVBBHFqQRBqIgMoAgAiBQ0ACyADIAE2AgAgAUEYaiAENgIACyABIAE2AgwgASABNgIIDAELIAQoAggiACABNgIMIAQgATYCCCABQRhqQQA2AgAgASAENgIMIAEgADYCCAtBAEEAKAKwqAFBf2oiATYCsKgBIAENAEHYqwEhAQNAIAEoAgAiAEEIaiEBIAANAAtBAEF/NgKwqAELC4wBAQJ/AkAgAA0AIAEQygsPCwJAIAFBQEkNABDBAUEwNgIAQQAPCwJAIABBeGpBECABQQtqQXhxIAFBC0kbEM0LIgJFDQAgAkEIag8LAkAgARDKCyICDQBBAA8LIAIgAEF8QXggAEF8aigCACIDQQNxGyADQXhxaiIDIAEgAyABSRsQ1wsaIAAQywsgAguJCAEJfyAAKAIEIgJBA3EhAyAAIAJBeHEiBGohBQJAQQAoAqCoASIGIABLDQAgA0EBRg0AIAUgAE0aCwJAAkAgAw0AQQAhAyABQYACSQ0BAkAgBCABQQRqSQ0AIAAhAyAEIAFrQQAoAvCrAUEBdE0NAgtBAA8LAkACQCAEIAFJDQAgBCABayIDQRBJDQEgACACQQFxIAFyQQJyNgIEIAAgAWoiASADQQNyNgIEIAUgBSgCBEEBcjYCBCABIAMQzgsMAQtBACEDAkBBACgCqKgBIAVHDQBBACgCnKgBIARqIgUgAU0NAiAAIAJBAXEgAXJBAnI2AgQgACABaiIDIAUgAWsiAUEBcjYCBEEAIAE2ApyoAUEAIAM2AqioAQwBCwJAQQAoAqSoASAFRw0AQQAhA0EAKAKYqAEgBGoiBSABSQ0CAkACQCAFIAFrIgNBEEkNACAAIAJBAXEgAXJBAnI2AgQgACABaiIBIANBAXI2AgQgACAFaiIFIAM2AgAgBSAFKAIEQX5xNgIEDAELIAAgAkEBcSAFckECcjYCBCAAIAVqIgEgASgCBEEBcjYCBEEAIQNBACEBC0EAIAE2AqSoAUEAIAM2ApioAQwBC0EAIQMgBSgCBCIHQQJxDQEgB0F4cSAEaiIIIAFJDQEgCCABayEJAkACQCAHQf8BSw0AIAUoAgwhAwJAIAUoAggiBSAHQQN2IgdBA3RBuKgBaiIERg0AIAYgBUsaCwJAIAMgBUcNAEEAQQAoApCoAUF+IAd3cTYCkKgBDAILAkAgAyAERg0AIAYgA0saCyAFIAM2AgwgAyAFNgIIDAELIAUoAhghCgJAAkAgBSgCDCIHIAVGDQACQCAGIAUoAggiA0sNACADKAIMIAVHGgsgAyAHNgIMIAcgAzYCCAwBCwJAIAVBFGoiAygCACIEDQAgBUEQaiIDKAIAIgQNAEEAIQcMAQsDQCADIQYgBCIHQRRqIgMoAgAiBA0AIAdBEGohAyAHKAIQIgQNAAsgBkEANgIACyAKRQ0AAkACQCAFKAIcIgRBAnRBwKoBaiIDKAIAIAVHDQAgAyAHNgIAIAcNAUEAQQAoApSoAUF+IAR3cTYClKgBDAILIApBEEEUIAooAhAgBUYbaiAHNgIAIAdFDQELIAcgCjYCGAJAIAUoAhAiA0UNACAHIAM2AhAgAyAHNgIYCyAFKAIUIgVFDQAgB0EUaiAFNgIAIAUgBzYCGAsCQCAJQQ9LDQAgACACQQFxIAhyQQJyNgIEIAAgCGoiASABKAIEQQFyNgIEDAELIAAgAkEBcSABckECcjYCBCAAIAFqIgEgCUEDcjYCBCAAIAhqIgUgBSgCBEEBcjYCBCABIAkQzgsLIAAhAwsgAwugDQEGfyAAIAFqIQICQAJAIAAoAgQiA0EBcQ0AIANBA3FFDQEgACgCACIDIAFqIQECQEEAKAKkqAEgACADayIARg0AQQAoAqCoASEEAkAgA0H/AUsNACAAKAIMIQUCQCAAKAIIIgYgA0EDdiIHQQN0QbioAWoiA0YNACAEIAZLGgsCQCAFIAZHDQBBAEEAKAKQqAFBfiAHd3E2ApCoAQwDCwJAIAUgA0YNACAEIAVLGgsgBiAFNgIMIAUgBjYCCAwCCyAAKAIYIQcCQAJAIAAoAgwiBiAARg0AAkAgBCAAKAIIIgNLDQAgAygCDCAARxoLIAMgBjYCDCAGIAM2AggMAQsCQCAAQRRqIgMoAgAiBQ0AIABBEGoiAygCACIFDQBBACEGDAELA0AgAyEEIAUiBkEUaiIDKAIAIgUNACAGQRBqIQMgBigCECIFDQALIARBADYCAAsgB0UNAQJAAkAgACgCHCIFQQJ0QcCqAWoiAygCACAARw0AIAMgBjYCACAGDQFBAEEAKAKUqAFBfiAFd3E2ApSoAQwDCyAHQRBBFCAHKAIQIABGG2ogBjYCACAGRQ0CCyAGIAc2AhgCQCAAKAIQIgNFDQAgBiADNgIQIAMgBjYCGAsgACgCFCIDRQ0BIAZBFGogAzYCACADIAY2AhgMAQsgAigCBCIDQQNxQQNHDQBBACABNgKYqAEgAiADQX5xNgIEIAAgAUEBcjYCBCACIAE2AgAPCwJAAkAgAigCBCIDQQJxDQACQEEAKAKoqAEgAkcNAEEAIAA2AqioAUEAQQAoApyoASABaiIBNgKcqAEgACABQQFyNgIEIABBACgCpKgBRw0DQQBBADYCmKgBQQBBADYCpKgBDwsCQEEAKAKkqAEgAkcNAEEAIAA2AqSoAUEAQQAoApioASABaiIBNgKYqAEgACABQQFyNgIEIAAgAWogATYCAA8LQQAoAqCoASEEIANBeHEgAWohAQJAAkAgA0H/AUsNACACKAIMIQUCQCACKAIIIgYgA0EDdiICQQN0QbioAWoiA0YNACAEIAZLGgsCQCAFIAZHDQBBAEEAKAKQqAFBfiACd3E2ApCoAQwCCwJAIAUgA0YNACAEIAVLGgsgBiAFNgIMIAUgBjYCCAwBCyACKAIYIQcCQAJAIAIoAgwiBiACRg0AAkAgBCACKAIIIgNLDQAgAygCDCACRxoLIAMgBjYCDCAGIAM2AggMAQsCQCACQRRqIgMoAgAiBQ0AIAJBEGoiAygCACIFDQBBACEGDAELA0AgAyEEIAUiBkEUaiIDKAIAIgUNACAGQRBqIQMgBigCECIFDQALIARBADYCAAsgB0UNAAJAAkAgAigCHCIFQQJ0QcCqAWoiAygCACACRw0AIAMgBjYCACAGDQFBAEEAKAKUqAFBfiAFd3E2ApSoAQwCCyAHQRBBFCAHKAIQIAJGG2ogBjYCACAGRQ0BCyAGIAc2AhgCQCACKAIQIgNFDQAgBiADNgIQIAMgBjYCGAsgAigCFCIDRQ0AIAZBFGogAzYCACADIAY2AhgLIAAgAUEBcjYCBCAAIAFqIAE2AgAgAEEAKAKkqAFHDQFBACABNgKYqAEPCyACIANBfnE2AgQgACABQQFyNgIEIAAgAWogATYCAAsCQCABQf8BSw0AIAFBA3YiA0EDdEG4qAFqIQECQAJAQQAoApCoASIFQQEgA3QiA3ENAEEAIAUgA3I2ApCoASABIQMMAQsgASgCCCEDCyABIAA2AgggAyAANgIMIAAgATYCDCAAIAM2AggPC0EfIQMCQCABQf///wdLDQAgAUEIdiIDIANBgP4/akEQdkEIcSIDdCIFIAVBgOAfakEQdkEEcSIFdCIGIAZBgIAPakEQdkECcSIGdEEPdiADIAVyIAZyayIDQQF0IAEgA0EVanZBAXFyQRxqIQMLIABCADcCECAAQRxqIAM2AgAgA0ECdEHAqgFqIQUCQAJAAkBBACgClKgBIgZBASADdCICcQ0AQQAgBiACcjYClKgBIAUgADYCACAAQRhqIAU2AgAMAQsgAUEAQRkgA0EBdmsgA0EfRht0IQMgBSgCACEGA0AgBiIFKAIEQXhxIAFGDQIgA0EddiEGIANBAXQhAyAFIAZBBHFqQRBqIgIoAgAiBg0ACyACIAA2AgAgAEEYaiAFNgIACyAAIAA2AgwgACAANgIIDwsgBSgCCCIBIAA2AgwgBSAANgIIIABBGGpBADYCACAAIAU2AgwgACABNgIICwtWAQJ/QQAoAth+IgEgAEEDakF8cSICaiEAAkACQCACQQFIDQAgACABTQ0BCwJAIAA/AEEQdE0NACAAEAhFDQELQQAgADYC2H4gAQ8LEMEBQTA2AgBBfwsEAEEACwQAQQALBABBAAsEAEEAC9sGAgR/A34jAEGAAWsiBSQAAkACQAJAIAMgBEIAQgAQoQJFDQAgAyAEENYLIQYgAkIwiKciB0H//wFxIghB//8BRg0AIAYNAQsgBUEQaiABIAIgAyAEEJwCIAUgBSkDECIEIAVBEGpBCGopAwAiAyAEIAMQqAIgBUEIaikDACECIAUpAwAhBAwBCwJAIAEgCK1CMIYgAkL///////8/g4QiCSADIARCMIinQf//AXEiBq1CMIYgBEL///////8/g4QiChChAkEASg0AAkAgASAJIAMgChChAkUNACABIQQMAgsgBUHwAGogASACQgBCABCcAiAFQfgAaikDACECIAUpA3AhBAwBCwJAAkAgCEUNACABIQQMAQsgBUHgAGogASAJQgBCgICAgICAwLvAABCcAiAFQegAaikDACIJQjCIp0GIf2ohCCAFKQNgIQQLAkAgBg0AIAVB0ABqIAMgCkIAQoCAgICAgMC7wAAQnAIgBUHYAGopAwAiCkIwiKdBiH9qIQYgBSkDUCEDCyAKQv///////z+DQoCAgICAgMAAhCELIAlC////////P4NCgICAgICAwACEIQkCQCAIIAZMDQADQAJAAkAgCSALfSAEIANUrX0iCkIAUw0AAkAgCiAEIAN9IgSEQgBSDQAgBUEgaiABIAJCAEIAEJwCIAVBKGopAwAhAiAFKQMgIQQMBQsgCkIBhiAEQj+IhCEJDAELIAlCAYYgBEI/iIQhCQsgBEIBhiEEIAhBf2oiCCAGSg0ACyAGIQgLAkACQCAJIAt9IAQgA1StfSIKQgBZDQAgCSEKDAELIAogBCADfSIEhEIAUg0AIAVBMGogASACQgBCABCcAiAFQThqKQMAIQIgBSkDMCEEDAELAkAgCkL///////8/Vg0AA0AgBEI/iCEDIAhBf2ohCCAEQgGGIQQgAyAKQgGGhCIKQoCAgICAgMAAVA0ACwsgB0GAgAJxIQYCQCAIQQBKDQAgBUHAAGogBCAKQv///////z+DIAhB+ABqIAZyrUIwhoRCAEKAgICAgIDAwz8QnAIgBUHIAGopAwAhAiAFKQNAIQQMAQsgCkL///////8/gyAIIAZyrUIwhoQhAgsgACAENwMAIAAgAjcDCCAFQYABaiQAC64BAAJAAkAgAUGACEgNACAARAAAAAAAAOB/oiEAAkAgAUH/D04NACABQYF4aiEBDAILIABEAAAAAAAA4H+iIQAgAUH9FyABQf0XSBtBgnBqIQEMAQsgAUGBeEoNACAARAAAAAAAABAAoiEAAkAgAUGDcEwNACABQf4HaiEBDAELIABEAAAAAAAAEACiIQAgAUGGaCABQYZoShtB/A9qIQELIAAgAUH/B2qtQjSGv6ILSwICfwF+IAFC////////P4MhBAJAAkAgAUIwiKdB//8BcSICQf//AUYNAEEEIQMgAg0BQQJBAyAEIACEUBsPCyAEIACEUCEDCyADC5EEAQN/AkAgAkGABEkNACAAIAEgAhAJGiAADwsgACACaiEDAkACQCABIABzQQNxDQACQAJAIAJBAU4NACAAIQIMAQsCQCAAQQNxDQAgACECDAELIAAhAgNAIAIgAS0AADoAACABQQFqIQEgAkEBaiICIANPDQEgAkEDcQ0ACwsCQCADQXxxIgRBwABJDQAgAiAEQUBqIgVLDQADQCACIAEoAgA2AgAgAiABKAIENgIEIAIgASgCCDYCCCACIAEoAgw2AgwgAiABKAIQNgIQIAIgASgCFDYCFCACIAEoAhg2AhggAiABKAIcNgIcIAIgASgCIDYCICACIAEoAiQ2AiQgAiABKAIoNgIoIAIgASgCLDYCLCACIAEoAjA2AjAgAiABKAI0NgI0IAIgASgCODYCOCACIAEoAjw2AjwgAUHAAGohASACQcAAaiICIAVNDQALCyACIARPDQEDQCACIAEoAgA2AgAgAUEEaiEBIAJBBGoiAiAESQ0ADAILAAsCQCADQQRPDQAgACECDAELAkAgA0F8aiIEIABPDQAgACECDAELIAAhAgNAIAIgAS0AADoAACACIAEtAAE6AAEgAiABLQACOgACIAIgAS0AAzoAAyABQQRqIQEgAkEEaiICIARNDQALCwJAIAIgA08NAANAIAIgAS0AADoAACABQQFqIQEgAkEBaiICIANHDQALCyAAC/MCAgN/AX4CQCACRQ0AIAIgAGoiA0F/aiABOgAAIAAgAToAACACQQNJDQAgA0F+aiABOgAAIAAgAToAASADQX1qIAE6AAAgACABOgACIAJBB0kNACADQXxqIAE6AAAgACABOgADIAJBCUkNACAAQQAgAGtBA3EiBGoiAyABQf8BcUGBgoQIbCIBNgIAIAMgAiAEa0F8cSIEaiICQXxqIAE2AgAgBEEJSQ0AIAMgATYCCCADIAE2AgQgAkF4aiABNgIAIAJBdGogATYCACAEQRlJDQAgAyABNgIYIAMgATYCFCADIAE2AhAgAyABNgIMIAJBcGogATYCACACQWxqIAE2AgAgAkFoaiABNgIAIAJBZGogATYCACAEIANBBHFBGHIiBWsiAkEgSQ0AIAGtIgZCIIYgBoQhBiADIAVqIQEDQCABIAY3AxggASAGNwMQIAEgBjcDCCABIAY3AwAgAUEgaiEBIAJBYGoiAkEfSw0ACwsgAAv4AgEBfwJAIAAgAUYNAAJAIAEgAGsgAmtBACACQQF0a0sNACAAIAEgAhDXCw8LIAEgAHNBA3EhAwJAAkACQCAAIAFPDQACQCADRQ0AIAAhAwwDCwJAIABBA3ENACAAIQMMAgsgACEDA0AgAkUNBCADIAEtAAA6AAAgAUEBaiEBIAJBf2ohAiADQQFqIgNBA3FFDQIMAAsACwJAIAMNAAJAIAAgAmpBA3FFDQADQCACRQ0FIAAgAkF/aiICaiIDIAEgAmotAAA6AAAgA0EDcQ0ACwsgAkEDTQ0AA0AgACACQXxqIgJqIAEgAmooAgA2AgAgAkEDSw0ACwsgAkUNAgNAIAAgAkF/aiICaiABIAJqLQAAOgAAIAINAAwDCwALIAJBA00NAANAIAMgASgCADYCACABQQRqIQEgA0EEaiEDIAJBfGoiAkEDSw0ACwsgAkUNAANAIAMgAS0AADoAACADQQFqIQMgAUEBaiEBIAJBf2oiAg0ACwsgAAtcAQF/IAAgAC0ASiIBQX9qIAFyOgBKAkAgACgCACIBQQhxRQ0AIAAgAUEgcjYCAEF/DwsgAEIANwIEIAAgACgCLCIBNgIcIAAgATYCFCAAIAEgACgCMGo2AhBBAAvOAQEDfwJAAkAgAigCECIDDQBBACEEIAIQ2gsNASACKAIQIQMLAkAgAyACKAIUIgVrIAFPDQAgAiAAIAEgAigCJBEDAA8LAkACQCACLABLQQBODQBBACEDDAELIAEhBANAAkAgBCIDDQBBACEDDAILIAAgA0F/aiIEai0AAEEKRw0ACyACIAAgAyACKAIkEQMAIgQgA0kNASAAIANqIQAgASADayEBIAIoAhQhBQsgBSAAIAEQ1wsaIAIgAigCFCABajYCFCADIAFqIQQLIAQLWwECfyACIAFsIQQCQAJAIAMoAkxBf0oNACAAIAQgAxDbCyEADAELIAMQ3QshBSAAIAQgAxDbCyEAIAVFDQAgAxDeCwsCQCAAIARHDQAgAkEAIAEbDwsgACABbgsEAEEBCwIAC5sBAQN/IAAhAQJAAkAgAEEDcUUNAAJAIAAtAAANACAAIABrDwsgACEBA0AgAUEBaiIBQQNxRQ0BIAEtAABFDQIMAAsACwNAIAEiAkEEaiEBIAIoAgAiA0F/cyADQf/9+3dqcUGAgYKEeHFFDQALAkAgA0H/AXENACACIABrDwsDQCACLQABIQMgAkEBaiIBIQIgAw0ACwsgASAAawsVAEGArMECJAJBgKwBQQ9qQXBxJAELBwAjACMBawsEACMBCwQAIwALBgAgACQACxIBAn8jACAAa0FwcSIBJAAgAQsRACABIAIgAyAEIAUgABEYAAsNACABIAIgAyAAERcACxEAIAEgAiADIAQgBSAAERMACxMAIAEgAiADIAQgBSAGIAARGwALFQAgASACIAMgBCAFIAYgByAAERUACxkAIAAgASACIAOtIAStQiCGhCAFIAYQ5gsLJAEBfiAAIAEgAq0gA61CIIaEIAQQ5wshBSAFQiCIpxAKIAWnCxkAIAAgASACIAMgBCAFrSAGrUIghoQQ6AsLIwAgACABIAIgAyAEIAWtIAatQiCGhCAHrSAIrUIghoQQ6QsLJQAgACABIAIgAyAEIAUgBq0gB61CIIaEIAitIAmtQiCGhBDqCwsTACAAIAGnIAFCIIinIAIgAxALCwuQpIGAAAMAQYAIC7RxAAAAAJYwB3csYQ7uulEJmRnEbQeP9GpwNaVj6aOVZJ4yiNsOpLjceR7p1eCI2dKXK0y2Cb18sX4HLbjnkR2/kGQQtx3yILBqSHG5895BvoR91Noa6+TdbVG11PTHhdODVphsE8Coa2R6+WL97Mllik9cARTZbAZjYz0P+vUNCI3IIG47XhBpTORBYNVycWei0eQDPEfUBEv9hQ3Sa7UKpfqotTVsmLJC1sm720D5vKzjbNgydVzfRc8N1txZPdGrrDDZJjoA3lGAUdfIFmHQv7X0tCEjxLNWmZW6zw+lvbieuAIoCIgFX7LZDMYk6Quxh3xvLxFMaFirHWHBPS1mtpBB3HYGcdsBvCDSmCoQ1e+JhbFxH7W2BqXkv58z1LjooskHeDT5AA+OqAmWGJgO4bsNan8tPW0Il2xkkQFcY+b0UWtrYmFsHNgwZYVOAGLy7ZUGbHulARvB9AiCV8QP9cbZsGVQ6bcS6ri+i3yIufzfHd1iSS3aFfN804xlTNT7WGGyTc5RtTp0ALyj4jC71EGl30rXldg9bcTRpPv01tNq6WlD/NluNEaIZ63QuGDacy0EROUdAzNfTAqqyXwN3TxxBVCqQQInEBALvoYgDMkltWhXs4VvIAnUZrmf5GHODvneXpjJ2SkimNCwtKjXxxc9s1mBDbQuO1y9t61susAgg7jttrO/mgzitgOa0rF0OUfV6q930p0VJtsEgxbccxILY+OEO2SUPmptDahaanoLzw7knf8JkyeuAAqxngd9RJMP8NKjCIdo8gEe/sIGaV1XYvfLZ2WAcTZsGecGa252G9T+4CvTiVp62hDMSt1nb9+5+fnvvo5DvrcX1Y6wYOij1tZ+k9GhxMLYOFLy30/xZ7vRZ1e8pt0GtT9LNrJI2isN2EwbCq/2SgM2YHoEQcPvYN9V32eo745uMXm+aUaMs2HLGoNmvKDSbyU24mhSlXcMzANHC7u5FgIiLyYFVb47usUoC72yklq0KwRqs1yn/9fCMc/QtYue2Swdrt5bsMJkmybyY+yco2p1CpNtAqkGCZw/Ng7rhWcHchNXAAWCSr+VFHq44q4rsXs4G7YMm47Skg2+1eW379x8Id/bC9TS04ZC4tTx+LPdaG6D2h/NFr6BWya59uF3sG93R7cY5loIiHBqD//KOwZmXAsBEf+eZY9prmL40/9rYUXPbBZ44gqg7tIN11SDBE7CswM5YSZnp/cWYNBNR2lJ23duPkpq0a7cWtbZZgvfQPA72DdTrrypxZ673n/Pskfp/7UwHPK9vYrCusowk7NTpqO0JAU20LqTBtfNKVfeVL9n2SMuemazuEphxAIbaF2UK28qN74LtKGODMMb3wVaje8CLXBkYXRhOgBqZSByZW50cmUgZGFucyBsZSBmb3IAAAAAAAAAAGAKAAACAAAAAwAAAAQAAAAFAAAABgAAAAcAAAAIAAAACQAAAAoAAAALAAAADAAAAA0AAAAOAAAADwAAAAAAAACcCgAAEAAAABEAAAASAAAAEwAAABQAAAAVAAAAFgAAABcAAAAYAAAAGQAAABoAAAAbAAAAHAAAAB0AAAAIAAAAAAAAANQKAAAeAAAAHwAAAPj////4////1AoAACAAAAAhAAAArAgAAMAIAAAIAAAAAAAAABwLAAAiAAAAIwAAAPj////4////HAsAACQAAAAlAAAA3AgAAPAIAAAEAAAAAAAAAGQLAAAmAAAAJwAAAPz////8////ZAsAACgAAAApAAAADAkAACAJAAAEAAAAAAAAAKwLAAAqAAAAKwAAAPz////8////rAsAACwAAAAtAAAAPAkAAFAJAAAAAAAAlAkAAC4AAAAvAAAAaW9zX2Jhc2U6OmNsZWFyAE5TdDNfXzI4aW9zX2Jhc2VFAAAA3DsAAIAJAAAAAAAA2AkAADAAAAAxAAAATlN0M19fMjliYXNpY19pb3NJY05TXzExY2hhcl90cmFpdHNJY0VFRUUAAAAEPAAArAkAAJQJAAAAAAAAIAoAADIAAAAzAAAATlN0M19fMjliYXNpY19pb3NJd05TXzExY2hhcl90cmFpdHNJd0VFRUUAAAAEPAAA9AkAAJQJAABOU3QzX18yMTViYXNpY19zdHJlYW1idWZJY05TXzExY2hhcl90cmFpdHNJY0VFRUUAAAAA3DsAACwKAABOU3QzX18yMTViYXNpY19zdHJlYW1idWZJd05TXzExY2hhcl90cmFpdHNJd0VFRUUAAAAA3DsAAGgKAABOU3QzX18yMTNiYXNpY19pc3RyZWFtSWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFAABgPAAApAoAAAAAAAABAAAA2AkAAAP0//9OU3QzX18yMTNiYXNpY19pc3RyZWFtSXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFAABgPAAA7AoAAAAAAAABAAAAIAoAAAP0//9OU3QzX18yMTNiYXNpY19vc3RyZWFtSWNOU18xMWNoYXJfdHJhaXRzSWNFRUVFAABgPAAANAsAAAAAAAABAAAA2AkAAAP0//9OU3QzX18yMTNiYXNpY19vc3RyZWFtSXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFAABgPAAAfAsAAAAAAAABAAAAIAoAAAP0//+4PAAASD0AAOA9AAAAAAAAKAwAAAIAAAA7AAAAPAAAAAUAAAAGAAAABwAAAAgAAAAJAAAACgAAAD0AAAA+AAAAPwAAAA4AAAAPAAAATlN0M19fMjEwX19zdGRpbmJ1ZkljRUUABDwAABAMAABgCgAAdW5zdXBwb3J0ZWQgbG9jYWxlIGZvciBzdGFuZGFyZCBpbnB1dAAAAAAAAAC0DAAAEAAAAEAAAABBAAAAEwAAABQAAAAVAAAAFgAAABcAAAAYAAAAQgAAAEMAAABEAAAAHAAAAB0AAABOU3QzX18yMTBfX3N0ZGluYnVmSXdFRQAEPAAAnAwAAJwKAAAAAAAAHA0AAAIAAABFAAAARgAAAAUAAAAGAAAABwAAAEcAAAAJAAAACgAAAAsAAAAMAAAADQAAAEgAAABJAAAATlN0M19fMjExX19zdGRvdXRidWZJY0VFAAAAAAQ8AAAADQAAYAoAAAAAAACEDQAAEAAAAEoAAABLAAAAEwAAABQAAAAVAAAATAAAABcAAAAYAAAAGQAAABoAAAAbAAAATQAAAE4AAABOU3QzX18yMTFfX3N0ZG91dGJ1Zkl3RUUAAAAABDwAAGgNAACcCgAAaW5maW5pdHkAbmFuAAAAANF0ngBXnb0qgHBSD///PicKAAAAZAAAAOgDAAAQJwAAoIYBAEBCDwCAlpgAAOH1BRgAAAA1AAAAcQAAAGv////O+///kr///wAAAAAAAAAA/////////////////////////////////////////////////////////////////wABAgMEBQYHCAn/////////CgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiP///////8KCwwNDg8QERITFBUWFxgZGhscHR4fICEiI/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAQIEBwMGBQAAAAAAAAACAADAAwAAwAQAAMAFAADABgAAwAcAAMAIAADACQAAwAoAAMALAADADAAAwA0AAMAOAADADwAAwBAAAMARAADAEgAAwBMAAMAUAADAFQAAwBYAAMAXAADAGAAAwBkAAMAaAADAGwAAwBwAAMAdAADAHgAAwB8AAMAAAACzAQAAwwIAAMMDAADDBAAAwwUAAMMGAADDBwAAwwgAAMMJAADDCgAAwwsAAMMMAADDDQAA0w4AAMMPAADDAAAMuwEADMMCAAzDAwAMwwQADNMAAAAA3hIElQAAAAD////////////////QDwAAFAAAAEMuVVRGLTgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5A8AAAAAAAAAAAAAAAAAAAAAAAAAAAAATENfQUxMAAAAAAAAAAAAAExDX0NUWVBFAAAAAExDX05VTUVSSUMAAExDX1RJTUUAAAAAAExDX0NPTExBVEUAAExDX01PTkVUQVJZAExDX01FU1NBR0VTAExBTkcAQy5VVEYtOABQT1NJWAAALSsgICAwWDB4AChudWxsKQAAAAARAAoAERERAAAAAAUAAAAAAAAJAAAAAAsAAAAAAAAAABEADwoREREDCgcAAQAJCwsAAAkGCwAACwAGEQAAABEREQAAAAAAAAAAAAAAAAAAAAALAAAAAAAAAAARAAoKERERAAoAAAIACQsAAAAJAAsAAAsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAADAAAAAAMAAAAAAkMAAAAAAAMAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAA0AAAAEDQAAAAAJDgAAAAAADgAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAPAAAAAA8AAAAACRAAAAAAABAAABAAABIAAAASEhIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAABISEgAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsAAAAAAAAAAAAAAAoAAAAACgAAAAAJCwAAAAAACwAACwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAMAAAAAAwAAAAACQwAAAAAAAwAAAwAADAxMjM0NTY3ODlBQkNERUYtMFgrMFggMFgtMHgrMHggMHgAaW5mAElORgBuYW4ATkFOAC4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUBQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgACAAIAAgACAAIAAgACAAIAAyACIAIgAiACIAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAFgBMAEwATABMAEwATABMAEwATABMAEwATABMAEwATACNgI2AjYCNgI2AjYCNgI2AjYCNgEwATABMAEwATABMAEwAjVCNUI1QjVCNUI1QjFCMUIxQjFCMUIxQjFCMUIxQjFCMUIxQjFCMUIxQjFCMUIxQjFCMUEwATABMAEwATABMAI1gjWCNYI1gjWCNYIxgjGCMYIxgjGCMYIxgjGCMYIxgjGCMYIxgjGCMYIxgjGCMYIxgjGBMAEwATABMACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAIAAAADAAAABAAAAAUAAAAGAAAABwAAAAgAAAAJAAAACgAAAAsAAAAMAAAADQAAAA4AAAAPAAAAEAAAABEAAAASAAAAEwAAABQAAAAVAAAAFgAAABcAAAAYAAAAGQAAABoAAAAbAAAAHAAAAB0AAAAeAAAAHwAAACAAAAAhAAAAIgAAACMAAAAkAAAAJQAAACYAAAAnAAAAKAAAACkAAAAqAAAAKwAAACwAAAAtAAAALgAAAC8AAAAwAAAAMQAAADIAAAAzAAAANAAAADUAAAA2AAAANwAAADgAAAA5AAAAOgAAADsAAAA8AAAAPQAAAD4AAAA/AAAAQAAAAEEAAABCAAAAQwAAAEQAAABFAAAARgAAAEcAAABIAAAASQAAAEoAAABLAAAATAAAAE0AAABOAAAATwAAAFAAAABRAAAAUgAAAFMAAABUAAAAVQAAAFYAAABXAAAAWAAAAFkAAABaAAAAWwAAAFwAAABdAAAAXgAAAF8AAABgAAAAQQAAAEIAAABDAAAARAAAAEUAAABGAAAARwAAAEgAAABJAAAASgAAAEsAAABMAAAATQAAAE4AAABPAAAAUAAAAFEAAABSAAAAUwAAAFQAAABVAAAAVgAAAFcAAABYAAAAWQAAAFoAAAB7AAAAfAAAAH0AAAB+AAAAfwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcB4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAACAAAAAwAAAAQAAAAFAAAABgAAAAcAAAAIAAAACQAAAAoAAAALAAAADAAAAA0AAAAOAAAADwAAABAAAAARAAAAEgAAABMAAAAUAAAAFQAAABYA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AADkAAAA5QAAAE5TdDNfXzI3bnVtX3B1dEl3TlNfMTlvc3RyZWFtYnVmX2l0ZXJhdG9ySXdOU18xMWNoYXJfdHJhaXRzSXdFRUVFRUUATlN0M19fMjlfX251bV9wdXRJd0VFAAAAYDwAACgtAAAAAAAAAQAAAHAsAAAAAAAAYDwAAOQsAAAAAAAAAgAAAMAlAAACAAAAQC0AAAAAAAAAAAAAWC4AAOYAAADnAAAAZwAAAOgAAADpAAAA6gAAAOsAAADsAAAA7QAAAO4AAAD4////WC4AAO8AAADwAAAA8QAAAPIAAADzAAAA9AAAAPUAAABOU3QzX18yOHRpbWVfZ2V0SWNOU18xOWlzdHJlYW1idWZfaXRlcmF0b3JJY05TXzExY2hhcl90cmFpdHNJY0VFRUVFRQBOU3QzX18yOXRpbWVfYmFzZUUA3DsAABEuAABOU3QzX18yMjBfX3RpbWVfZ2V0X2Nfc3RvcmFnZUljRUUAAADcOwAALC4AAGA8AADMLQAAAAAAAAMAAADAJQAAAgAAACQuAAACAAAAUC4AAAAIAAAAAAAARC8AAPYAAAD3AAAAZwAAAPgAAAD5AAAA+gAAAPsAAAD8AAAA/QAAAP4AAAD4////RC8AAP8AAAAAAQAAAQEAAAIBAAADAQAABAEAAAUBAABOU3QzX18yOHRpbWVfZ2V0SXdOU18xOWlzdHJlYW1idWZfaXRlcmF0b3JJd05TXzExY2hhcl90cmFpdHNJd0VFRUVFRQBOU3QzX18yMjBfX3RpbWVfZ2V0X2Nfc3RvcmFnZUl3RUUAANw7AAAZLwAAYDwAANQuAAAAAAAAAwAAAMAlAAACAAAAJC4AAAIAAAA8LwAAAAgAAAAAAADoLwAABgEAAAcBAABnAAAACAEAAE5TdDNfXzI4dGltZV9wdXRJY05TXzE5b3N0cmVhbWJ1Zl9pdGVyYXRvckljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRUVFAE5TdDNfXzIxMF9fdGltZV9wdXRFAAAA3DsAAMkvAABgPAAAhC8AAAAAAAACAAAAwCUAAAIAAADgLwAAAAgAAAAAAABoMAAACQEAAAoBAABnAAAACwEAAE5TdDNfXzI4dGltZV9wdXRJd05TXzE5b3N0cmVhbWJ1Zl9pdGVyYXRvckl3TlNfMTFjaGFyX3RyYWl0c0l3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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADYSwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABWUAAAQeD+AAugLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
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
        }
        if (readBinary) {
            return readBinary(wasmBinaryFile);
        }
        else {
            throw "sync fetching of the wasm failed: you can preload it to Module['wasmBinary'] manually, or emcc.py will do that for you when generating HTML (but not JS)";
        }
    }
    catch (err) {
        abort(err);
    }
}
function getBinaryPromise() {
    // If we don't have the binary yet, and have the Fetch api, use that;
    // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
    if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function'
        // Let's not use fetch to get objects over file:// as it's most likely Cordova which doesn't support fetch for file://
        && !isFileURI(wasmBinaryFile)) {
        return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function (response) {
            if (!response['ok']) {
                throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
            }
            return response['arrayBuffer']();
        }).catch(function () {
            return getBinary();
        });
    }
    // Otherwise, getBinary should be able to get it synchronously
    return Promise.resolve().then(getBinary);
}
// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
    // prepare imports
    var info = {
        'env': asmLibraryArg,
        'wasi_snapshot_preview1': asmLibraryArg,
    };
    // Load the wasm module and create an instance of using native support in the JS engine.
    // handle a generated wasm instance, receiving its exports and
    // performing other necessary setup
    /** @param {WebAssembly.Module=} module*/
    function receiveInstance(instance, module) {
        var exports = instance.exports;
        Module['asm'] = exports;
        wasmTable = Module['asm']['__indirect_function_table'];
        assert(wasmTable, "table not found in wasm exports");
        removeRunDependency('wasm-instantiate');
    }
    // we can't run yet (except in a pthread, where we have a custom sync instantiator)
    addRunDependency('wasm-instantiate');
    // Async compilation can be confusing when an error on the page overwrites Module
    // (for example, if the order of elements is wrong, and the one defining Module is
    // later), so we save Module and check it later.
    var trueModule = Module;
    function receiveInstantiatedSource(output) {
        // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
        // receiveInstance() will swap in the exports (to Module.asm) so they can be called
        assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
        trueModule = null;
        // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
        // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
        receiveInstance(output['instance']);
    }
    function instantiateArrayBuffer(receiver) {
        return getBinaryPromise().then(function (binary) {
            return WebAssembly.instantiate(binary, info);
        }).then(receiver, function (reason) {
            err('failed to asynchronously prepare wasm: ' + reason);
            abort(reason);
        });
    }
    // Prefer streaming instantiation if available.
    function instantiateSync() {
        var instance;
        var module;
        var binary;
        try {
            binary = getBinary();
            module = new WebAssembly.Module(binary);
            instance = new WebAssembly.Instance(module, info);
        }
        catch (e) {
            var str = e.toString();
            err('failed to compile wasm module: ' + str);
            if (str.indexOf('imported Memory') >= 0 ||
                str.indexOf('memory import') >= 0) {
                err('Memory size incompatibility issues may be due to changing INITIAL_MEMORY at runtime to something too large. Use ALLOW_MEMORY_GROWTH to allow any size memory (and also make sure not to set INITIAL_MEMORY at runtime to something smaller than it was at compile time).');
            }
            throw e;
        }
        receiveInstance(instance, module);
    }
    // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
    // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
    // to any other async startup actions they are performing.
    if (Module['instantiateWasm']) {
        try {
            var exports = Module['instantiateWasm'](info, receiveInstance);
            return exports;
        }
        catch (e) {
            err('Module.instantiateWasm callback failed with error: ' + e);
            return false;
        }
    }
    instantiateSync();
    return Module['asm']; // exports were assigned here
}
// Globals used by JS i64 conversions
var tempDouble;
var tempI64;
// === Body ===
var ASM_CONSTS = {};
function abortStackOverflow(allocSize) {
    abort('Stack overflow! Attempted to allocate ' + allocSize + ' bytes on the stack, but stack has only ' + (_emscripten_stack_get_free() + allocSize) + ' bytes available!');
}
function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == 'function') {
            callback(Module); // Pass the module as the first argument.
            continue;
        }
        var func = callback.func;
        if (typeof func === 'number') {
            if (callback.arg === undefined) {
                wasmTable.get(func)();
            }
            else {
                wasmTable.get(func)(callback.arg);
            }
        }
        else {
            func(callback.arg === undefined ? null : callback.arg);
        }
    }
}
function demangle(func) {
    warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
    return func;
}
function demangleAll(text) {
    var regex = /\b_Z[\w\d_]+/g;
    return text.replace(regex, function (x) {
        var y = demangle(x);
        return x === y ? x : (y + ' [' + x + ']');
    });
}
function dynCallLegacy(sig, ptr, args) {
    assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
    if (args && args.length) {
        // j (64-bit integer) must be passed in as two numbers [low 32, high 32].
        assert(args.length === sig.substring(1).replace(/j/g, '--').length);
    }
    else {
        assert(sig.length == 1);
    }
    if (args && args.length) {
        return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
    }
    return Module['dynCall_' + sig].call(null, ptr);
}
function dynCall(sig, ptr, args) {
    // Without WASM_BIGINT support we cannot directly call function with i64 as
    // part of thier signature, so we rely the dynCall functions generated by
    // wasm-emscripten-finalize
    if (sig.indexOf('j') != -1) {
        return dynCallLegacy(sig, ptr, args);
    }
    assert(wasmTable.get(ptr), 'missing table entry in dynCall: ' + ptr);
    return wasmTable.get(ptr).apply(null, args);
}
function jsStackTrace() {
    var error = new Error();
    if (!error.stack) {
        // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
        // so try that as a special-case.
        try {
            throw new Error();
        }
        catch (e) {
            error = e;
        }
        if (!error.stack) {
            return '(no stack trace available)';
        }
    }
    return error.stack.toString();
}
function stackTrace() {
    var js = jsStackTrace();
    if (Module['extraStackTrace'])
        js += '\n' + Module['extraStackTrace']();
    return demangleAll(js);
}
function _atexit(func, arg) {
}
function ___cxa_atexit(a0, a1) {
    return _atexit(a0, a1);
}
function _abort() {
    abort();
}
function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.copyWithin(dest, src, src + num);
}
function _emscripten_get_heap_size() {
    return HEAPU8.length;
}
function abortOnCannotGrowMemory(requestedSize) {
    abort('Cannot enlarge memory arrays to size ' + requestedSize + ' bytes (OOM). Either (1) compile with  -s INITIAL_MEMORY=X  with X higher than the current value ' + HEAP8.length + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
}
function _emscripten_resize_heap(requestedSize) {
    requestedSize = requestedSize >>> 0;
    abortOnCannotGrowMemory(requestedSize);
}
var ENV = {};
function getExecutableName() {
    return thisProgram || './this.program';
}
function getEnvStrings() {
    if (!getEnvStrings.strings) {
        // Default values.
        // Browser language detection #8751
        var lang = ((typeof navigator === 'object' && navigator.languages && navigator.languages[0]) || 'C').replace('-', '_') + '.UTF-8';
        var env = {
            'USER': 'web_user',
            'LOGNAME': 'web_user',
            'PATH': '/',
            'PWD': '/',
            'HOME': '/home/web_user',
            'LANG': lang,
            '_': getExecutableName()
        };
        // Apply the user-provided values, if any.
        for (var x in ENV) {
            env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
            strings.push(x + '=' + env[x]);
        }
        getEnvStrings.strings = strings;
    }
    return getEnvStrings.strings;
}
var PATH = { splitPath: function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
    }, normalizeArray: function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === '.') {
                parts.splice(i, 1);
            }
            else if (last === '..') {
                parts.splice(i, 1);
                up++;
            }
            else if (up) {
                parts.splice(i, 1);
                up--;
            }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift('..');
            }
        }
        return parts;
    }, normalize: function (path) {
        var isAbsolute = path.charAt(0) === '/', trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function (p) {
            return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
            path = '.';
        }
        if (path && trailingSlash) {
            path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
    }, dirname: function (path) {
        var result = PATH.splitPath(path), root = result[0], dir = result[1];
        if (!root && !dir) {
            // No dirname whatsoever
            return '.';
        }
        if (dir) {
            // It has a dirname, strip trailing slash
            dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
    }, basename: function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/')
            return '/';
        path = PATH.normalize(path);
        path = path.replace(/\/$/, "");
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1)
            return path;
        return path.substr(lastSlash + 1);
    }, extname: function (path) {
        return PATH.splitPath(path)[3];
    }, join: function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
    }, join2: function (l, r) {
        return PATH.normalize(l + '/' + r);
    } };
function getRandomDevice() {
    if (typeof crypto === 'object' && typeof crypto['getRandomValues'] === 'function') {
        // for modern web browsers
        var randomBuffer = new Uint8Array(1);
        return function () { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
    }
    else if (ENVIRONMENT_IS_NODE) {
        // for nodejs with or without crypto support included
        try {
            var crypto_module = require('crypto');
            // nodejs has crypto support
            return function () { return crypto_module['randomBytes'](1)[0]; };
        }
        catch (e) {
            // nodejs doesn't have crypto support
        }
    }
    // we couldn't find a proper implementation, as Math.random() is not suitable for /dev/random, see emscripten-core/emscripten/pull/7096
    return function () { abort("no cryptographic support found for randomDevice. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: function(array) { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };"); };
}
var PATH_FS = { resolve: function () {
        var resolvedPath = '', resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = (i >= 0) ? arguments[i] : FS.cwd();
            // Skip empty and invalid entries
            if (typeof path !== 'string') {
                throw new TypeError('Arguments to path.resolve must be strings');
            }
            else if (!path) {
                return ''; // an invalid portion invalidates the whole thing
            }
            resolvedPath = path + '/' + resolvedPath;
            resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function (p) {
            return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
    }, relative: function (from, to) {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== '')
                    break;
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== '')
                    break;
            }
            if (start > end)
                return [];
            return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
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
            outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
    } };
var TTY = { ttys: [], init: function () {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
    }, shutdown: function () {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
    }, register: function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
    }, stream_ops: { open: function (stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(43);
            }
            stream.tty = tty;
            stream.seekable = false;
        }, close: function (stream) {
            // flush any pending line data
            stream.tty.ops.flush(stream.tty);
        }, flush: function (stream) {
            stream.tty.ops.flush(stream.tty);
        }, read: function (stream, buffer, offset, length, pos /* ignored */) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(60);
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty);
                }
                catch (e) {
                    throw new FS.ErrnoError(29);
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(6);
                }
                if (result === null || result === undefined)
                    break;
                bytesRead++;
                buffer[offset + i] = result;
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now();
            }
            return bytesRead;
        }, write: function (stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(60);
            }
            try {
                for (var i = 0; i < length; i++) {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
                }
            }
            catch (e) {
                throw new FS.ErrnoError(29);
            }
            if (length) {
                stream.node.timestamp = Date.now();
            }
            return i;
        } }, default_tty_ops: { get_char: function (tty) {
            if (!tty.input.length) {
                var result = null;
                if (ENVIRONMENT_IS_NODE) {
                    // we will read data by chunks of BUFSIZE
                    var BUFSIZE = 256;
                    var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
                    var bytesRead = 0;
                    try {
                        bytesRead = nodeFS.readSync(process.stdin.fd, buf, 0, BUFSIZE, null);
                    }
                    catch (e) {
                        // Cross-platform differences: on Windows, reading EOF throws an exception, but on other OSes,
                        // reading EOF returns 0. Uniformize behavior by treating the EOF exception to return 0.
                        if (e.toString().indexOf('EOF') != -1)
                            bytesRead = 0;
                        else
                            throw e;
                    }
                    if (bytesRead > 0) {
                        result = buf.slice(0, bytesRead).toString('utf-8');
                    }
                    else {
                        result = null;
                    }
                }
                else if (typeof window != 'undefined' &&
                    typeof window.prompt == 'function') {
                    // Browser.
                    result = window.prompt('Input: '); // returns null on cancel
                    if (result !== null) {
                        result += '\n';
                    }
                }
                else if (typeof readline == 'function') {
                    // Command line.
                    result = readline();
                    if (result !== null) {
                        result += '\n';
                    }
                }
                if (!result) {
                    return null;
                }
                tty.input = intArrayFromString(result, true);
            }
            return tty.input.shift();
        }, put_char: function (tty, val) {
            if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            }
            else {
                if (val != 0)
                    tty.output.push(val); // val == 0 would cut text output off in the middle.
            }
        }, flush: function (tty) {
            if (tty.output && tty.output.length > 0) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            }
        } }, default_tty1_ops: { put_char: function (tty, val) {
            if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            }
            else {
                if (val != 0)
                    tty.output.push(val);
            }
        }, flush: function (tty) {
            if (tty.output && tty.output.length > 0) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = [];
            }
        } } };
function mmapAlloc(size) {
    var alignedSize = alignMemory(size, 16384);
    var ptr = abort('malloc was not included, but is needed in mmapAlloc. Adding "_malloc" to EXPORTED_FUNCTIONS should fix that. This may be a bug in the compiler, please file an issue.');
    ;
    while (size < alignedSize)
        HEAP8[ptr + size++] = 0;
    return ptr;
}
var MEMFS = { ops_table: null, mount: function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
    }, createNode: function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            // no supported
            throw new FS.ErrnoError(63);
        }
        if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
                dir: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        lookup: MEMFS.node_ops.lookup,
                        mknod: MEMFS.node_ops.mknod,
                        rename: MEMFS.node_ops.rename,
                        unlink: MEMFS.node_ops.unlink,
                        rmdir: MEMFS.node_ops.rmdir,
                        readdir: MEMFS.node_ops.readdir,
                        symlink: MEMFS.node_ops.symlink
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek
                    }
                },
                file: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek,
                        read: MEMFS.stream_ops.read,
                        write: MEMFS.stream_ops.write,
                        allocate: MEMFS.stream_ops.allocate,
                        mmap: MEMFS.stream_ops.mmap,
                        msync: MEMFS.stream_ops.msync
                    }
                },
                link: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        readlink: MEMFS.node_ops.readlink
                    },
                    stream: {}
                },
                chrdev: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: FS.chrdev_stream_ops
                }
            };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {};
        }
        else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
            // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
            // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
            // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
            node.contents = null;
        }
        else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream;
        }
        else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
            parent.contents[name] = node;
        }
        return node;
    }, getFileDataAsRegularArray: function (node) {
        if (node.contents && node.contents.subarray) {
            var arr = [];
            for (var i = 0; i < node.usedBytes; ++i)
                arr.push(node.contents[i]);
            return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
    }, getFileDataAsTypedArray: function (node) {
        if (!node.contents)
            return new Uint8Array(0);
        if (node.contents.subarray)
            return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
    }, expandFileStorage: function (node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity)
            return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
        // avoid overshooting the allocation cap by a very large margin.
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) >>> 0);
        if (prevCapacity != 0)
            newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        if (node.usedBytes > 0)
            node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
        return;
    }, resizeFileStorage: function (node, newSize) {
        if (node.usedBytes == newSize)
            return;
        if (newSize == 0) {
            node.contents = null; // Fully decommit when requesting a resize to zero.
            node.usedBytes = 0;
            return;
        }
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
            var oldContents = node.contents;
            node.contents = new Uint8Array(newSize); // Allocate new storage.
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
            }
            node.usedBytes = newSize;
            return;
        }
        // Backing with a JS array.
        if (!node.contents)
            node.contents = [];
        if (node.contents.length > newSize)
            node.contents.length = newSize;
        else
            while (node.contents.length < newSize)
                node.contents.push(0);
        node.usedBytes = newSize;
    }, node_ops: { getattr: function (node) {
            var attr = {};
            // device numbers reuse inode numbers.
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096;
            }
            else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes;
            }
            else if (FS.isLink(node.mode)) {
                attr.size = node.link.length;
            }
            else {
                attr.size = 0;
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
            //       but this is not required by the standard.
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr;
        }, setattr: function (node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp;
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size);
            }
        }, lookup: function (parent, name) {
            throw FS.genericErrors[44];
        }, mknod: function (parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev);
        }, rename: function (old_node, new_dir, new_name) {
            // if we're overwriting a directory at new_name, make sure it's empty.
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name);
                }
                catch (e) {
                }
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(55);
                    }
                }
            }
            // do the internal rewiring
            delete old_node.parent.contents[old_node.name];
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            old_node.parent = new_dir;
        }, unlink: function (parent, name) {
            delete parent.contents[name];
        }, rmdir: function (parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(55);
            }
            delete parent.contents[name];
        }, readdir: function (node) {
            var entries = ['.', '..'];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue;
                }
                entries.push(key);
            }
            return entries;
        }, symlink: function (parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
            node.link = oldpath;
            return node;
        }, readlink: function (node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(28);
            }
            return node.link;
        } }, stream_ops: { read: function (stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes)
                return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            assert(size >= 0);
            if (size > 8 && contents.subarray) { // non-trivial, and typed array
                buffer.set(contents.subarray(position, position + size), offset);
            }
            else {
                for (var i = 0; i < size; i++)
                    buffer[offset + i] = contents[position + i];
            }
            return size;
        }, write: function (stream, buffer, offset, length, position, canOwn) {
            // The data buffer should be a typed array view
            assert(!(buffer instanceof ArrayBuffer));
            if (!length)
                return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
                if (canOwn) {
                    assert(position === 0, 'canOwn must imply no weird position inside the file');
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length;
                }
                else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
                    node.contents = buffer.slice(offset, offset + length);
                    node.usedBytes = length;
                    return length;
                }
                else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length;
                }
            }
            // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) {
                // Use typed array write which is available.
                node.contents.set(buffer.subarray(offset, offset + length), position);
            }
            else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length;
        }, llseek: function (stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position;
            }
            else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes;
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(28);
            }
            return position;
        }, allocate: function (stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        }, mmap: function (stream, address, length, position, prot, flags) {
            // We don't currently support location hints for the address of the mapping
            assert(address === 0);
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43);
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            // Only make a new copy when MAP_PRIVATE is specified.
            if (!(flags & 2) && contents.buffer === buffer) {
                // We can't emulate MAP_SHARED when the file is not backed by the buffer
                // we're mapping to (e.g. the HEAP buffer).
                allocated = false;
                ptr = contents.byteOffset;
            }
            else {
                // Try to avoid unnecessary slices.
                if (position > 0 || position + length < contents.length) {
                    if (contents.subarray) {
                        contents = contents.subarray(position, position + length);
                    }
                    else {
                        contents = Array.prototype.slice.call(contents, position, position + length);
                    }
                }
                allocated = true;
                ptr = mmapAlloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(48);
                }
                HEAP8.set(contents, ptr);
            }
            return { ptr: ptr, allocated: allocated };
        }, msync: function (stream, buffer, offset, length, mmapFlags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43);
            }
            if (mmapFlags & 2) {
                // MAP_PRIVATE calls need not to be synced back to underlying fs
                return 0;
            }
            var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            // should we check if bytesWritten and length are the same?
            return 0;
        } } };
var ERRNO_MESSAGES = { 0: "Success", 1: "Arg list too long", 2: "Permission denied", 3: "Address already in use", 4: "Address not available", 5: "Address family not supported by protocol family", 6: "No more processes", 7: "Socket already connected", 8: "Bad file number", 9: "Trying to read unreadable message", 10: "Mount device busy", 11: "Operation canceled", 12: "No children", 13: "Connection aborted", 14: "Connection refused", 15: "Connection reset by peer", 16: "File locking deadlock error", 17: "Destination address required", 18: "Math arg out of domain of func", 19: "Quota exceeded", 20: "File exists", 21: "Bad address", 22: "File too large", 23: "Host is unreachable", 24: "Identifier removed", 25: "Illegal byte sequence", 26: "Connection already in progress", 27: "Interrupted system call", 28: "Invalid argument", 29: "I/O error", 30: "Socket is already connected", 31: "Is a directory", 32: "Too many symbolic links", 33: "Too many open files", 34: "Too many links", 35: "Message too long", 36: "Multihop attempted", 37: "File or path name too long", 38: "Network interface is not configured", 39: "Connection reset by network", 40: "Network is unreachable", 41: "Too many open files in system", 42: "No buffer space available", 43: "No such device", 44: "No such file or directory", 45: "Exec format error", 46: "No record locks available", 47: "The link has been severed", 48: "Not enough core", 49: "No message of desired type", 50: "Protocol not available", 51: "No space left on device", 52: "Function not implemented", 53: "Socket is not connected", 54: "Not a directory", 55: "Directory not empty", 56: "State not recoverable", 57: "Socket operation on non-socket", 59: "Not a typewriter", 60: "No such device or address", 61: "Value too large for defined data type", 62: "Previous owner died", 63: "Not super-user", 64: "Broken pipe", 65: "Protocol error", 66: "Unknown protocol", 67: "Protocol wrong type for socket", 68: "Math result not representable", 69: "Read only file system", 70: "Illegal seek", 71: "No such process", 72: "Stale file handle", 73: "Connection timed out", 74: "Text file busy", 75: "Cross-device link", 100: "Device not a stream", 101: "Bad font file fmt", 102: "Invalid slot", 103: "Invalid request code", 104: "No anode", 105: "Block device required", 106: "Channel number out of range", 107: "Level 3 halted", 108: "Level 3 reset", 109: "Link number out of range", 110: "Protocol driver not attached", 111: "No CSI structure available", 112: "Level 2 halted", 113: "Invalid exchange", 114: "Invalid request descriptor", 115: "Exchange full", 116: "No data (for no delay io)", 117: "Timer expired", 118: "Out of streams resources", 119: "Machine is not on the network", 120: "Package not installed", 121: "The object is remote", 122: "Advertise error", 123: "Srmount error", 124: "Communication error on send", 125: "Cross mount point (not really error)", 126: "Given log. name not unique", 127: "f.d. invalid for this operation", 128: "Remote address changed", 129: "Can   access a needed shared lib", 130: "Accessing a corrupted shared lib", 131: ".lib section in a.out corrupted", 132: "Attempting to link in too many libs", 133: "Attempting to exec a shared library", 135: "Streams pipe error", 136: "Too many users", 137: "Socket type not supported", 138: "Not supported", 139: "Protocol family not supported", 140: "Can't send after socket shutdown", 141: "Too many references", 142: "Host is down", 148: "No medium (in tape drive)", 156: "Level 2 not synchronized" };
var ERRNO_CODES = { EPERM: 63, ENOENT: 44, ESRCH: 71, EINTR: 27, EIO: 29, ENXIO: 60, E2BIG: 1, ENOEXEC: 45, EBADF: 8, ECHILD: 12, EAGAIN: 6, EWOULDBLOCK: 6, ENOMEM: 48, EACCES: 2, EFAULT: 21, ENOTBLK: 105, EBUSY: 10, EEXIST: 20, EXDEV: 75, ENODEV: 43, ENOTDIR: 54, EISDIR: 31, EINVAL: 28, ENFILE: 41, EMFILE: 33, ENOTTY: 59, ETXTBSY: 74, EFBIG: 22, ENOSPC: 51, ESPIPE: 70, EROFS: 69, EMLINK: 34, EPIPE: 64, EDOM: 18, ERANGE: 68, ENOMSG: 49, EIDRM: 24, ECHRNG: 106, EL2NSYNC: 156, EL3HLT: 107, EL3RST: 108, ELNRNG: 109, EUNATCH: 110, ENOCSI: 111, EL2HLT: 112, EDEADLK: 16, ENOLCK: 46, EBADE: 113, EBADR: 114, EXFULL: 115, ENOANO: 104, EBADRQC: 103, EBADSLT: 102, EDEADLOCK: 16, EBFONT: 101, ENOSTR: 100, ENODATA: 116, ETIME: 117, ENOSR: 118, ENONET: 119, ENOPKG: 120, EREMOTE: 121, ENOLINK: 47, EADV: 122, ESRMNT: 123, ECOMM: 124, EPROTO: 65, EMULTIHOP: 36, EDOTDOT: 125, EBADMSG: 9, ENOTUNIQ: 126, EBADFD: 127, EREMCHG: 128, ELIBACC: 129, ELIBBAD: 130, ELIBSCN: 131, ELIBMAX: 132, ELIBEXEC: 133, ENOSYS: 52, ENOTEMPTY: 55, ENAMETOOLONG: 37, ELOOP: 32, EOPNOTSUPP: 138, EPFNOSUPPORT: 139, ECONNRESET: 15, ENOBUFS: 42, EAFNOSUPPORT: 5, EPROTOTYPE: 67, ENOTSOCK: 57, ENOPROTOOPT: 50, ESHUTDOWN: 140, ECONNREFUSED: 14, EADDRINUSE: 3, ECONNABORTED: 13, ENETUNREACH: 40, ENETDOWN: 38, ETIMEDOUT: 73, EHOSTDOWN: 142, EHOSTUNREACH: 23, EINPROGRESS: 26, EALREADY: 7, EDESTADDRREQ: 17, EMSGSIZE: 35, EPROTONOSUPPORT: 66, ESOCKTNOSUPPORT: 137, EADDRNOTAVAIL: 4, ENETRESET: 39, EISCONN: 30, ENOTCONN: 53, ETOOMANYREFS: 141, EUSERS: 136, EDQUOT: 19, ESTALE: 72, ENOTSUP: 138, ENOMEDIUM: 148, EILSEQ: 25, EOVERFLOW: 61, ECANCELED: 11, ENOTRECOVERABLE: 56, EOWNERDEAD: 62, ESTRPIPE: 135 };
var FS = { root: null, mounts: [], devices: {}, streams: [], nextInode: 1, nameTable: null, currentPath: "/", initialized: false, ignorePermissions: true, trackingDelegate: {}, tracking: { openFlags: { READ: 1, WRITE: 2 } }, ErrnoError: null, genericErrors: {}, filesystems: null, syncFSRequests: 0, lookupPath: function (path, opts) {
        path = PATH_FS.resolve(FS.cwd(), path);
        opts = opts || {};
        if (!path)
            return { path: '', node: null };
        var defaults = {
            follow_mount: true,
            recurse_count: 0
        };
        for (var key in defaults) {
            if (opts[key] === undefined) {
                opts[key] = defaults[key];
            }
        }
        if (opts.recurse_count > 8) { // max recursive lookup of 8
            throw new FS.ErrnoError(32);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function (p) {
            return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
            var islast = (i === parts.length - 1);
            if (islast && opts.parent) {
                // stop resolving
                break;
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            // jump to the mount's root node if this is a mountpoint
            if (FS.isMountpoint(current)) {
                if (!islast || (islast && opts.follow_mount)) {
                    current = current.mounted.root;
                }
            }
            // by default, lookupPath will not follow a symlink if it is the final path component.
            // setting opts.follow = true will override this behavior.
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
                    current = lookup.node;
                    if (count++ > 40) { // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                        throw new FS.ErrnoError(32);
                    }
                }
            }
        }
        return { path: current_path, node: current };
    }, getPath: function (node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path)
                    return mount;
                return mount[mount.length - 1] !== '/' ? mount + '/' + path : mount + path;
            }
            path = path ? node.name + '/' + path : node.name;
            node = node.parent;
        }
    }, hashName: function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
    }, hashAddNode: function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
    }, hashRemoveNode: function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next;
        }
        else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break;
                }
                current = current.name_next;
            }
        }
    }, lookupNode: function (parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
            throw new FS.ErrnoError(errCode, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node;
            }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
    }, createNode: function (parent, name, mode, rdev) {
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node;
    }, destroyNode: function (node) {
        FS.hashRemoveNode(node);
    }, isRoot: function (node) {
        return node === node.parent;
    }, isMountpoint: function (node) {
        return !!node.mounted;
    }, isFile: function (mode) {
        return (mode & 61440) === 32768;
    }, isDir: function (mode) {
        return (mode & 61440) === 16384;
    }, isLink: function (mode) {
        return (mode & 61440) === 40960;
    }, isChrdev: function (mode) {
        return (mode & 61440) === 8192;
    }, isBlkdev: function (mode) {
        return (mode & 61440) === 24576;
    }, isFIFO: function (mode) {
        return (mode & 61440) === 4096;
    }, isSocket: function (mode) {
        return (mode & 49152) === 49152;
    }, flagModes: { "r": 0, "r+": 2, "w": 577, "w+": 578, "a": 1089, "a+": 1090 }, modeStringToFlags: function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
            throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
    }, flagsToPermissionString: function (flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
            perms += 'w';
        }
        return perms;
    }, nodePermissions: function (node, perms) {
        if (FS.ignorePermissions) {
            return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
            return 2;
        }
        else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
            return 2;
        }
        else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
            return 2;
        }
        return 0;
    }, mayLookup: function (dir) {
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode)
            return errCode;
        if (!dir.node_ops.lookup)
            return 2;
        return 0;
    }, mayCreate: function (dir, name) {
        try {
            var node = FS.lookupNode(dir, name);
            return 20;
        }
        catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
    }, mayDelete: function (dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name);
        }
        catch (e) {
            return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
            return errCode;
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return 54;
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 10;
            }
        }
        else {
            if (FS.isDir(node.mode)) {
                return 31;
            }
        }
        return 0;
    }, mayOpen: function (node, flags) {
        if (!node) {
            return 44;
        }
        if (FS.isLink(node.mode)) {
            return 32;
        }
        else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
                (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
                return 31;
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
    }, MAX_OPEN_FDS: 4096, nextfd: function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
            if (!FS.streams[fd]) {
                return fd;
            }
        }
        throw new FS.ErrnoError(33);
    }, getStream: function (fd) {
        return FS.streams[fd];
    }, createStream: function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
            FS.FSStream = /** @constructor */ function () { };
            FS.FSStream.prototype = {
                object: {
                    get: function () { return this.node; },
                    set: function (val) { this.node = val; }
                },
                isRead: {
                    get: function () { return (this.flags & 2097155) !== 1; }
                },
                isWrite: {
                    get: function () { return (this.flags & 2097155) !== 0; }
                },
                isAppend: {
                    get: function () { return (this.flags & 1024); }
                }
            };
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
            newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
    }, closeStream: function (fd) {
        FS.streams[fd] = null;
    }, chrdev_stream_ops: { open: function (stream) {
            var device = FS.getDevice(stream.node.rdev);
            // override node's stream ops with the device's
            stream.stream_ops = device.stream_ops;
            // forward the open call
            if (stream.stream_ops.open) {
                stream.stream_ops.open(stream);
            }
        }, llseek: function () {
            throw new FS.ErrnoError(70);
        } }, major: function (dev) {
        return ((dev) >> 8);
    }, minor: function (dev) {
        return ((dev) & 0xff);
    }, makedev: function (ma, mi) {
        return ((ma) << 8 | (mi));
    }, registerDevice: function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
    }, getDevice: function (dev) {
        return FS.devices[dev];
    }, getMounts: function (mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts);
        }
        return mounts;
    }, syncfs: function (populate, callback) {
        if (typeof (populate) === 'function') {
            callback = populate;
            populate = false;
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            err('warning: ' + FS.syncFSRequests + ' FS.syncfs operations in flight at once, probably just doing extra work');
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
        function doCallback(errCode) {
            assert(FS.syncFSRequests > 0);
            FS.syncFSRequests--;
            return callback(errCode);
        }
        function done(errCode) {
            if (errCode) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(errCode);
                }
                return;
            }
            if (++completed >= mounts.length) {
                doCallback(null);
            }
        }
        ;
        // sync all mounts
        mounts.forEach(function (mount) {
            if (!mount.type.syncfs) {
                return done(null);
            }
            mount.type.syncfs(mount, populate, done);
        });
    }, mount: function (type, opts, mountpoint) {
        if (typeof type === 'string') {
            // The filesystem was not included, and instead we have an error
            // message stored in the variable.
            throw type;
        }
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(10);
        }
        else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
            mountpoint = lookup.path; // use the absolute path
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(10);
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(54);
            }
        }
        var mount = {
            type: type,
            opts: opts,
            mountpoint: mountpoint,
            mounts: []
        };
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot;
        }
        else if (node) {
            // set as a mountpoint
            node.mounted = mount;
            // add the new mount to the current mount's children
            if (node.mount) {
                node.mount.mounts.push(mount);
            }
        }
        return mountRoot;
    }, unmount: function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(28);
        }
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach(function (hash) {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.indexOf(current.mount) !== -1) {
                    FS.destroyNode(current);
                }
                current = next;
            }
        });
        // no longer a mountpoint
        node.mounted = null;
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
    }, lookup: function (parent, name) {
        return parent.node_ops.lookup(parent, name);
    }, mknod: function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
            throw new FS.ErrnoError(28);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
    }, create: function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
    }, mkdir: function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
    }, mkdirTree: function (path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i])
                continue;
            d += '/' + dirs[i];
            try {
                FS.mkdir(d, mode);
            }
            catch (e) {
                if (e.errno != 20)
                    throw e;
            }
        }
    }, mkdev: function (path, mode, dev) {
        if (typeof (dev) === 'undefined') {
            dev = mode;
            mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
    }, symlink: function (oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
    }, rename: function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        // let the errors from non existant directories percolate up
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
        if (!old_dir || !new_dir)
            throw new FS.ErrnoError(44);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(75);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
            throw new FS.ErrnoError(28);
        }
        // new path should not be an ancestor of the old path
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
            throw new FS.ErrnoError(55);
        }
        // see if the new path already exists
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name);
        }
        catch (e) {
            // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
            return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        errCode = new_node ?
            FS.mayDelete(new_dir, new_name, isdir) :
            FS.mayCreate(new_dir, new_name);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
            throw new FS.ErrnoError(10);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
            errCode = FS.nodePermissions(old_dir, 'w');
            if (errCode) {
                throw new FS.ErrnoError(errCode);
            }
        }
        try {
            if (FS.trackingDelegate['willMovePath']) {
                FS.trackingDelegate['willMovePath'](old_path, new_path);
            }
        }
        catch (e) {
            err("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name);
        }
        catch (e) {
            throw e;
        }
        finally {
            // add the node back to the hash (in case node_ops.rename
            // changed its name)
            FS.hashAddNode(old_node);
        }
        try {
            if (FS.trackingDelegate['onMovePath'])
                FS.trackingDelegate['onMovePath'](old_path, new_path);
        }
        catch (e) {
            err("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
        }
    }, rmdir: function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
        }
        try {
            if (FS.trackingDelegate['willDeletePath']) {
                FS.trackingDelegate['willDeletePath'](path);
            }
        }
        catch (e) {
            err("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate['onDeletePath'])
                FS.trackingDelegate['onDeletePath'](path);
        }
        catch (e) {
            err("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
        }
    }, readdir: function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(54);
        }
        return node.node_ops.readdir(node);
    }, unlink: function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
            // According to POSIX, we should map EISDIR to EPERM, but
            // we instead do what Linux does (and we must, as we use
            // the musl linux libc).
            throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
        }
        try {
            if (FS.trackingDelegate['willDeletePath']) {
                FS.trackingDelegate['willDeletePath'](path);
            }
        }
        catch (e) {
            err("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate['onDeletePath'])
                FS.trackingDelegate['onDeletePath'](path);
        }
        catch (e) {
            err("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
        }
    }, readlink: function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(28);
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
    }, stat: function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(44);
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(63);
        }
        return node.node_ops.getattr(node);
    }, lstat: function (path) {
        return FS.stat(path, true);
    }, chmod: function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
        }
        else {
            node = path;
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
            mode: (mode & 4095) | (node.mode & ~4095),
            timestamp: Date.now()
        });
    }, lchmod: function (path, mode) {
        FS.chmod(path, mode, true);
    }, fchmod: function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8);
        }
        FS.chmod(stream.node, mode);
    }, chown: function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
        }
        else {
            node = path;
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
            timestamp: Date.now()
            // we ignore the uid / gid for now
        });
    }, lchown: function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
    }, fchown: function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8);
        }
        FS.chown(stream.node, uid, gid);
    }, truncate: function (path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path === 'string') {
            var lookup = FS.lookupPath(path, { follow: true });
            node = lookup.node;
        }
        else {
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
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        node.node_ops.setattr(node, {
            size: len,
            timestamp: Date.now()
        });
    }, ftruncate: function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
    }, utime: function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
            timestamp: Math.max(atime, mtime)
        });
    }, open: function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
            throw new FS.ErrnoError(44);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
            mode = (mode & 4095) | 32768;
        }
        else {
            mode = 0;
        }
        var node;
        if (typeof path === 'object') {
            node = path;
        }
        else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, {
                    follow: !(flags & 131072)
                });
                node = lookup.node;
            }
            catch (e) {
                // ignore
            }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
            if (node) {
                // if O_CREAT and O_EXCL are set, error out if the node already exists
                if ((flags & 128)) {
                    throw new FS.ErrnoError(20);
                }
            }
            else {
                // node doesn't exist, try to create it
                node = FS.mknod(path, mode, 0);
                created = true;
            }
        }
        if (!node) {
            throw new FS.ErrnoError(44);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
            flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
            var errCode = FS.mayOpen(node, flags);
            if (errCode) {
                throw new FS.ErrnoError(errCode);
            }
        }
        // do truncation if necessary
        if ((flags & 512)) {
            FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512 | 131072);
        // register the stream with the filesystem
        var stream = FS.createStream({
            node: node,
            path: FS.getPath(node),
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            // used by the file family libc calls (fopen, fwrite, ferror, etc.)
            ungotten: [],
            error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
            if (!FS.readFiles)
                FS.readFiles = {};
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
                err("FS.trackingDelegate error on read file: " + path);
            }
        }
        try {
            if (FS.trackingDelegate['onOpenFile']) {
                var trackingFlags = 0;
                if ((flags & 2097155) !== 1) {
                    trackingFlags |= FS.tracking.openFlags.READ;
                }
                if ((flags & 2097155) !== 0) {
                    trackingFlags |= FS.tracking.openFlags.WRITE;
                }
                FS.trackingDelegate['onOpenFile'](path, trackingFlags);
            }
        }
        catch (e) {
            err("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message);
        }
        return stream;
    }, close: function (stream) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
        }
        if (stream.getdents)
            stream.getdents = null; // free readdir state
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream);
            }
        }
        catch (e) {
            throw e;
        }
        finally {
            FS.closeStream(stream.fd);
        }
        stream.fd = null;
    }, isClosed: function (stream) {
        return stream.fd === null;
    }, llseek: function (stream, offset, whence) {
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
    }, read: function (stream, buffer, offset, length, position) {
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
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
            position = stream.position;
        }
        else if (!stream.seekable) {
            throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking)
            stream.position += bytesRead;
        return bytesRead;
    }, write: function (stream, buffer, offset, length, position, canOwn) {
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
        if (stream.seekable && stream.flags & 1024) {
            // seek to the end before writing in append mode
            FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
            position = stream.position;
        }
        else if (!stream.seekable) {
            throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking)
            stream.position += bytesWritten;
        try {
            if (stream.path && FS.trackingDelegate['onWriteToFile'])
                FS.trackingDelegate['onWriteToFile'](stream.path);
        }
        catch (e) {
            err("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message);
        }
        return bytesWritten;
    }, allocate: function (stream, offset, length) {
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
    }, mmap: function (stream, address, length, position, prot, flags) {
        // User requests writing to file (prot & PROT_WRITE != 0).
        // Checking if we have permissions to write to the file unless
        // MAP_PRIVATE flag is set. According to POSIX spec it is possible
        // to write to file opened in read-only mode with MAP_PRIVATE flag,
        // as all modifications will be visible only in the memory of
        // the current process.
        if ((prot & 2) !== 0
            && (flags & 2) === 0
            && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(43);
        }
        return stream.stream_ops.mmap(stream, address, length, position, prot, flags);
    }, msync: function (stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
            return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
    }, munmap: function (stream) {
        return 0;
    }, ioctl: function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
    }, readFile: function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
            throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
            ret = UTF8ArrayToString(buf, 0);
        }
        else if (opts.encoding === 'binary') {
            ret = buf;
        }
        FS.close(stream);
        return ret;
    }, writeFile: function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === 'string') {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        }
        else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        }
        else {
            throw new Error('Unsupported data type');
        }
        FS.close(stream);
    }, cwd: function () {
        return FS.currentPath;
    }, chdir: function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
            throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
            throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
    }, createDefaultDirectories: function () {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
    }, createDefaultDevices: function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
            read: function () { return 0; },
            write: function (stream, buffer, offset, length, pos) { return length; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device = getRandomDevice();
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
    }, createSpecialDirectories: function () {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
            mount: function () {
                var node = FS.createNode('/proc/self', 'fd', 16384 | 511 /* 0777 */, 73);
                node.node_ops = {
                    lookup: function (parent, name) {
                        var fd = +name;
                        var stream = FS.getStream(fd);
                        if (!stream)
                            throw new FS.ErrnoError(8);
                        var ret = {
                            parent: null,
                            mount: { mountpoint: 'fake' },
                            node_ops: { readlink: function () { return stream.path; } }
                        };
                        ret.parent = ret; // make it look like a simple root node
                        return ret;
                    }
                };
                return node;
            }
        }, {}, '/proc/self/fd');
    }, createStandardStreams: function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
            FS.createDevice('/dev', 'stdin', Module['stdin']);
        }
        else {
            FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
            FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        }
        else {
            FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
            FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        }
        else {
            FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 0);
        var stdout = FS.open('/dev/stdout', 1);
        var stderr = FS.open('/dev/stderr', 1);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
    }, ensureErrnoError: function () {
        if (FS.ErrnoError)
            return;
        FS.ErrnoError = /** @this{Object} */ function ErrnoError(errno, node) {
            this.node = node;
            this.setErrno = /** @this{Object} */ function (errno) {
                this.errno = errno;
                for (var key in ERRNO_CODES) {
                    if (ERRNO_CODES[key] === errno) {
                        this.code = key;
                        break;
                    }
                }
            };
            this.setErrno(errno);
            this.message = ERRNO_MESSAGES[errno];
            // Try to get a maximally helpful stack trace. On Node.js, getting Error.stack
            // now ensures it shows what we want.
            if (this.stack) {
                // Define the stack property for Node.js 4, which otherwise errors on the next line.
                Object.defineProperty(this, "stack", { value: (new Error).stack, writable: true });
                this.stack = demangleAll(this.stack);
            }
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [44].forEach(function (code) {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = '<generic error, no stack>';
        });
    }, staticInit: function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = {
            'MEMFS': MEMFS,
        };
    }, init: function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
    }, quit: function () {
        FS.init.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        var fflush = Module['_fflush'];
        if (fflush)
            fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue;
            }
            FS.close(stream);
        }
    }, getMode: function (canRead, canWrite) {
        var mode = 0;
        if (canRead)
            mode |= 292 | 73;
        if (canWrite)
            mode |= 146;
        return mode;
    }, findObject: function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
            return ret.object;
        }
        else {
            return null;
        }
    }, analyzePath: function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
            var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            path = lookup.path;
        }
        catch (e) {
        }
        var ret = {
            isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
            parentExists: false, parentPath: null, parentObject: null
        };
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
            ret.isRoot = lookup.path === '/';
        }
        catch (e) {
            ret.error = e.errno;
        }
        ;
        return ret;
    }, createPath: function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part)
                continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current);
            }
            catch (e) {
                // ignore EEXIST
            }
            parent = current;
        }
        return current;
    }, createFile: function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
    }, createDataFile: function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data === 'string') {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i)
                    arr[i] = data.charCodeAt(i);
                data = arr;
            }
            // make sure we can write to the file
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, 577);
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode);
        }
        return node;
    }, createDevice: function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major)
            FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
            open: function (stream) {
                stream.seekable = false;
            },
            close: function (stream) {
                // flush any pending line data
                if (output && output.buffer && output.buffer.length) {
                    output(10);
                }
            },
            read: function (stream, buffer, offset, length, pos /* ignored */) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input();
                    }
                    catch (e) {
                        throw new FS.ErrnoError(29);
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(6);
                    }
                    if (result === null || result === undefined)
                        break;
                    bytesRead++;
                    buffer[offset + i] = result;
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now();
                }
                return bytesRead;
            },
            write: function (stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i]);
                    }
                    catch (e) {
                        throw new FS.ErrnoError(29);
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now();
                }
                return i;
            }
        });
        return FS.mkdev(path, mode, dev);
    }, forceLoadFile: function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents)
            return true;
        if (typeof XMLHttpRequest !== 'undefined') {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        }
        else if (read_) {
            // Command-line.
            try {
                // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
                //          read() will try to parse UTF8.
                obj.contents = intArrayFromString(read_(obj.url), true);
                obj.usedBytes = obj.contents.length;
            }
            catch (e) {
                throw new FS.ErrnoError(29);
            }
        }
        else {
            throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
    }, createLazyFile: function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        /** @constructor */
        function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = /** @this{Object} */ function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
                return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = (idx / this.chunkSize) | 0;
            return this.getter(chunkNum)[chunkOffset];
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
                throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024; // Chunk size in bytes
            if (!hasByteServing)
                chunkSize = datalength;
            // Function to get a range from the remote URL.
            var doXHR = (function (from, to) {
                if (from > to)
                    throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength - 1)
                    throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize)
                    xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined')
                    xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
                    throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                    return new Uint8Array(/** @type{Array<number>} */ (xhr.response || []));
                }
                else {
                    return intArrayFromString(xhr.responseText || '', true);
                }
            });
            var lazyArray = this;
            lazyArray.setDataGetter(function (chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength - 1); // if datalength-1 is selected, this is the last block
                if (typeof (lazyArray.chunks[chunkNum]) === "undefined") {
                    lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof (lazyArray.chunks[chunkNum]) === "undefined")
                    throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
            });
            if (usesGzip || !datalength) {
                // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
                chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
                datalength = this.getter(0).length;
                chunkSize = datalength;
                out("LazyFiles on gzip forces download of the whole file when length is accessed");
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
        };
        if (typeof XMLHttpRequest !== 'undefined') {
            if (!ENVIRONMENT_IS_WORKER)
                throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
            var lazyArray = new LazyUint8Array();
            Object.defineProperties(lazyArray, {
                length: {
                    get: /** @this{Object} */ function () {
                        if (!this.lengthKnown) {
                            this.cacheLength();
                        }
                        return this._length;
                    }
                },
                chunkSize: {
                    get: /** @this{Object} */ function () {
                        if (!this.lengthKnown) {
                            this.cacheLength();
                        }
                        return this._chunkSize;
                    }
                }
            });
            var properties = { isDevice: false, contents: lazyArray };
        }
        else {
            var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
            node.contents = properties.contents;
        }
        else if (properties.url) {
            node.contents = null;
            node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
            usedBytes: {
                get: /** @this {FSNode} */ function () { return this.contents.length; }
            }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function (key) {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
                FS.forceLoadFile(node);
                return fn.apply(null, arguments);
            };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
            FS.forceLoadFile(node);
            var contents = stream.node.contents;
            if (position >= contents.length)
                return 0;
            var size = Math.min(contents.length - position, length);
            assert(size >= 0);
            if (contents.slice) { // normal array
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i];
                }
            }
            else {
                for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
                    buffer[offset + i] = contents.get(position + i);
                }
            }
            return size;
        };
        node.stream_ops = stream_ops;
        return node;
    }, createPreloadedFile: function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init(); // XXX perhaps this method should move onto Browser?
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
        function processData(byteArray) {
            function finish(byteArray) {
                if (preFinish)
                    preFinish();
                if (!dontCreateFile) {
                    FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
                }
                if (onload)
                    onload();
                removeRunDependency(dep);
            }
            var handled = false;
            Module['preloadPlugins'].forEach(function (plugin) {
                if (handled)
                    return;
                if (plugin['canHandle'](fullname)) {
                    plugin['handle'](byteArray, fullname, finish, function () {
                        if (onerror)
                            onerror();
                        removeRunDependency(dep);
                    });
                    handled = true;
                }
            });
            if (!handled)
                finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == 'string') {
            Browser.asyncLoad(url, function (byteArray) {
                processData(byteArray);
            }, onerror);
        }
        else {
            processData(url);
        }
    }, indexedDB: function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    }, DB_NAME: function () {
        return 'EM_FS_' + window.location.pathname;
    }, DB_VERSION: 20, DB_STORE_NAME: "FILE_DATA", saveFilesToDB: function (paths, onload, onerror) {
        onload = onload || function () { };
        onerror = onerror || function () { };
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        }
        catch (e) {
            return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
            out('creating db');
            var db = openRequest.result;
            db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0, fail = 0, total = paths.length;
            function finish() {
                if (fail == 0)
                    onload();
                else
                    onerror();
            }
            paths.forEach(function (path) {
                var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total)
                    finish(); };
                putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total)
                    finish(); };
            });
            transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
    }, loadFilesFromDB: function (paths, onload, onerror) {
        onload = onload || function () { };
        onerror = onerror || function () { };
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        }
        catch (e) {
            return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            try {
                var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
            }
            catch (e) {
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
            paths.forEach(function (path) {
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
                getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total)
                    finish(); };
            });
            transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
    }, absolutePath: function () {
        abort('FS.absolutePath has been removed; use PATH_FS.resolve instead');
    }, createFolder: function () {
        abort('FS.createFolder has been removed; use FS.mkdir instead');
    }, createLink: function () {
        abort('FS.createLink has been removed; use FS.symlink instead');
    }, joinPath: function () {
        abort('FS.joinPath has been removed; use PATH.join instead');
    }, mmapAlloc: function () {
        abort('FS.mmapAlloc has been replaced by the top level function mmapAlloc');
    }, standardizePath: function () {
        abort('FS.standardizePath has been removed; use PATH.normalize instead');
    } };
var SYSCALLS = { mappings: {}, DEFAULT_POLLMASK: 5, umask: 511, calculateAt: function (dirfd, path) {
        if (path[0] !== '/') {
            // relative path
            var dir;
            if (dirfd === -100) {
                dir = FS.cwd();
            }
            else {
                var dirstream = FS.getStream(dirfd);
                if (!dirstream)
                    throw new FS.ErrnoError(8);
                dir = dirstream.path;
            }
            path = PATH.join2(dir, path);
        }
        return path;
    }, doStat: function (func, path, buf) {
        try {
            var stat = func(path);
        }
        catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                // an error occurred while trying to look up the path; we should just report ENOTDIR
                return -54;
            }
            throw e;
        }
        HEAP32[((buf) >> 2)] = stat.dev;
        HEAP32[(((buf) + (4)) >> 2)] = 0;
        HEAP32[(((buf) + (8)) >> 2)] = stat.ino;
        HEAP32[(((buf) + (12)) >> 2)] = stat.mode;
        HEAP32[(((buf) + (16)) >> 2)] = stat.nlink;
        HEAP32[(((buf) + (20)) >> 2)] = stat.uid;
        HEAP32[(((buf) + (24)) >> 2)] = stat.gid;
        HEAP32[(((buf) + (28)) >> 2)] = stat.rdev;
        HEAP32[(((buf) + (32)) >> 2)] = 0;
        (tempI64 = [stat.size >>> 0, (tempDouble = stat.size, (+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble) / 4294967296.0))), 4294967295.0)) | 0) >>> 0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble))) >>> 0)) / 4294967296.0))))) >>> 0) : 0)], HEAP32[(((buf) + (40)) >> 2)] = tempI64[0], HEAP32[(((buf) + (44)) >> 2)] = tempI64[1]);
        HEAP32[(((buf) + (48)) >> 2)] = 4096;
        HEAP32[(((buf) + (52)) >> 2)] = stat.blocks;
        HEAP32[(((buf) + (56)) >> 2)] = (stat.atime.getTime() / 1000) | 0;
        HEAP32[(((buf) + (60)) >> 2)] = 0;
        HEAP32[(((buf) + (64)) >> 2)] = (stat.mtime.getTime() / 1000) | 0;
        HEAP32[(((buf) + (68)) >> 2)] = 0;
        HEAP32[(((buf) + (72)) >> 2)] = (stat.ctime.getTime() / 1000) | 0;
        HEAP32[(((buf) + (76)) >> 2)] = 0;
        (tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino, (+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble) / 4294967296.0))), 4294967295.0)) | 0) >>> 0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble))) >>> 0)) / 4294967296.0))))) >>> 0) : 0)], HEAP32[(((buf) + (80)) >> 2)] = tempI64[0], HEAP32[(((buf) + (84)) >> 2)] = tempI64[1]);
        return 0;
    }, doMsync: function (addr, stream, len, flags, offset) {
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
    }, doMkdir: function (path, mode) {
        // remove a trailing slash, if one - /a/b/ has basename of '', but
        // we want to create b in the context of this function
        path = PATH.normalize(path);
        if (path[path.length - 1] === '/')
            path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0;
    }, doMknod: function (path, mode, dev) {
        // we don't want this in the JS API as it uses mknod to create all nodes.
        switch (mode & 61440) {
            case 32768:
            case 8192:
            case 24576:
            case 4096:
            case 49152:
                break;
            default: return -28;
        }
        FS.mknod(path, mode, dev);
        return 0;
    }, doReadlink: function (path, buf, bufsize) {
        if (bufsize <= 0)
            return -28;
        var ret = FS.readlink(path);
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf + len];
        stringToUTF8(ret, buf, bufsize + 1);
        // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
        // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
        HEAP8[buf + len] = endChar;
        return len;
    }, doAccess: function (path, amode) {
        if (amode & ~7) {
            // need a valid mode
            return -28;
        }
        var node;
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
        if (!node) {
            return -44;
        }
        var perms = '';
        if (amode & 4)
            perms += 'r';
        if (amode & 2)
            perms += 'w';
        if (amode & 1)
            perms += 'x';
        if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
            return -2;
        }
        return 0;
    }, doDup: function (path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest)
            FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
    }, doReadv: function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[(((iov) + (i * 8)) >> 2)];
            var len = HEAP32[(((iov) + (i * 8 + 4)) >> 2)];
            var curr = FS.read(stream, HEAP8, ptr, len, offset);
            if (curr < 0)
                return -1;
            ret += curr;
            if (curr < len)
                break; // nothing more to read
        }
        return ret;
    }, doWritev: function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[(((iov) + (i * 8)) >> 2)];
            var len = HEAP32[(((iov) + (i * 8 + 4)) >> 2)];
            var curr = FS.write(stream, HEAP8, ptr, len, offset);
            if (curr < 0)
                return -1;
            ret += curr;
        }
        return ret;
    }, varargs: undefined, get: function () {
        assert(SYSCALLS.varargs != undefined);
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs) - (4)) >> 2)];
        return ret;
    }, getStr: function (ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
    }, getStreamFromFD: function (fd) {
        var stream = FS.getStream(fd);
        if (!stream)
            throw new FS.ErrnoError(8);
        return stream;
    }, get64: function (low, high) {
        if (low >= 0)
            assert(high === 0);
        else
            assert(high === -1);
        return low;
    } };
function _environ_get(__environ, environ_buf) {
    try {
        var bufSize = 0;
        getEnvStrings().forEach(function (string, i) {
            var ptr = environ_buf + bufSize;
            HEAP32[(((__environ) + (i * 4)) >> 2)] = ptr;
            writeAsciiToMemory(string, ptr);
            bufSize += string.length + 1;
        });
        return 0;
    }
    catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError))
            abort(e);
        return e.errno;
    }
}
function _environ_sizes_get(penviron_count, penviron_buf_size) {
    try {
        var strings = getEnvStrings();
        HEAP32[((penviron_count) >> 2)] = strings.length;
        var bufSize = 0;
        strings.forEach(function (string) {
            bufSize += string.length + 1;
        });
        HEAP32[((penviron_buf_size) >> 2)] = bufSize;
        return 0;
    }
    catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError))
            abort(e);
        return e.errno;
    }
}
function _fd_close(fd) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0;
    }
    catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError))
            abort(e);
        return e.errno;
    }
}
function _fd_read(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doReadv(stream, iov, iovcnt);
        HEAP32[((pnum) >> 2)] = num;
        return 0;
    }
    catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError))
            abort(e);
        return e.errno;
    }
}
function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var HIGH_OFFSET = 0x100000000; // 2^32
        // use an unsigned operator on low and shift high by 32-bits
        var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
        var DOUBLE_LIMIT = 0x20000000000000; // 2^53
        // we also check for equality since DOUBLE_LIMIT + 1 == DOUBLE_LIMIT
        if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
            return -61;
        }
        FS.llseek(stream, offset, whence);
        (tempI64 = [stream.position >>> 0, (tempDouble = stream.position, (+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble) / 4294967296.0))), 4294967295.0)) | 0) >>> 0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble))) >>> 0)) / 4294967296.0))))) >>> 0) : 0)], HEAP32[((newOffset) >> 2)] = tempI64[0], HEAP32[(((newOffset) + (4)) >> 2)] = tempI64[1]);
        if (stream.getdents && offset === 0 && whence === 0)
            stream.getdents = null; // reset readdir state
        return 0;
    }
    catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError))
            abort(e);
        return e.errno;
    }
}
function _fd_write(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doWritev(stream, iov, iovcnt);
        HEAP32[((pnum) >> 2)] = num;
        return 0;
    }
    catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError))
            abort(e);
        return e.errno;
    }
}
function _setTempRet0($i) {
    setTempRet0(($i) | 0);
}
function __isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function __arraySum(array, index) {
    var sum = 0;
    for (var i = 0; i <= index; sum += array[i++]) {
        // no-op
    }
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
            // we spill over to next month
            days -= (daysInCurrentMonth - newDate.getDate() + 1);
            newDate.setDate(1);
            if (currentMonth < 11) {
                newDate.setMonth(currentMonth + 1);
            }
            else {
                newDate.setMonth(0);
                newDate.setFullYear(newDate.getFullYear() + 1);
            }
        }
        else {
            // we stay in current month
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        }
    }
    return newDate;
}
function _strftime(s, maxsize, format, tm) {
    // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
    // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
    var tm_zone = HEAP32[(((tm) + (40)) >> 2)];
    var date = {
        tm_sec: HEAP32[((tm) >> 2)],
        tm_min: HEAP32[(((tm) + (4)) >> 2)],
        tm_hour: HEAP32[(((tm) + (8)) >> 2)],
        tm_mday: HEAP32[(((tm) + (12)) >> 2)],
        tm_mon: HEAP32[(((tm) + (16)) >> 2)],
        tm_year: HEAP32[(((tm) + (20)) >> 2)],
        tm_wday: HEAP32[(((tm) + (24)) >> 2)],
        tm_yday: HEAP32[(((tm) + (28)) >> 2)],
        tm_isdst: HEAP32[(((tm) + (32)) >> 2)],
        tm_gmtoff: HEAP32[(((tm) + (36)) >> 2)],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : ''
    };
    var pattern = UTF8ToString(format);
    // expand format
    var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',
        '%D': '%m/%d/%y',
        '%F': '%Y-%m-%d',
        '%h': '%b',
        '%r': '%I:%M:%S %p',
        '%R': '%H:%M',
        '%T': '%H:%M:%S',
        '%x': '%m/%d/%y',
        '%X': '%H:%M:%S',
        // Modified Conversion Specifiers
        '%Ec': '%c',
        '%EC': '%C',
        '%Ex': '%m/%d/%y',
        '%EX': '%H:%M:%S',
        '%Ey': '%y',
        '%EY': '%Y',
        '%Od': '%d',
        '%Oe': '%e',
        '%OH': '%H',
        '%OI': '%I',
        '%Om': '%m',
        '%OM': '%M',
        '%OS': '%S',
        '%Ou': '%u',
        '%OU': '%U',
        '%OV': '%V',
        '%Ow': '%w',
        '%OW': '%W',
        '%Oy': '%y',
    };
    for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
    }
    var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
            str = character[0] + str;
        }
        return str;
    }
    function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
    }
    function compareByDay(date1, date2) {
        function sgn(value) {
            return value < 0 ? -1 : (value > 0 ? 1 : 0);
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
            case 0: // Sunday
                return new Date(janFourth.getFullYear() - 1, 11, 29);
            case 1: // Monday
                return janFourth;
            case 2: // Tuesday
                return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
                return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
                return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
                return new Date(janFourth.getFullYear() - 1, 11, 31);
            case 6: // Saturday
                return new Date(janFourth.getFullYear() - 1, 11, 30);
        }
    }
    function getWeekBasedYear(date) {
        var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
        var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
        var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                return thisDate.getFullYear() + 1;
            }
            else {
                return thisDate.getFullYear();
            }
        }
        else {
            return thisDate.getFullYear() - 1;
        }
    }
    var EXPANSION_RULES_2 = {
        '%a': function (date) {
            return WEEKDAYS[date.tm_wday].substring(0, 3);
        },
        '%A': function (date) {
            return WEEKDAYS[date.tm_wday];
        },
        '%b': function (date) {
            return MONTHS[date.tm_mon].substring(0, 3);
        },
        '%B': function (date) {
            return MONTHS[date.tm_mon];
        },
        '%C': function (date) {
            var year = date.tm_year + 1900;
            return leadingNulls((year / 100) | 0, 2);
        },
        '%d': function (date) {
            return leadingNulls(date.tm_mday, 2);
        },
        '%e': function (date) {
            return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function (date) {
            // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year.
            // In this system, weeks begin on a Monday and week 1 of the year is the week that includes
            // January 4th, which is also the week that includes the first Thursday of the year, and
            // is also the first week that contains at least four days in the year.
            // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of
            // the last week of the preceding year; thus, for Saturday 2nd January 1999,
            // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th,
            // or 31st is a Monday, it and any following days are part of week 1 of the following year.
            // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
            return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function (date) {
            return getWeekBasedYear(date);
        },
        '%H': function (date) {
            return leadingNulls(date.tm_hour, 2);
        },
        '%I': function (date) {
            var twelveHour = date.tm_hour;
            if (twelveHour == 0)
                twelveHour = 12;
            else if (twelveHour > 12)
                twelveHour -= 12;
            return leadingNulls(twelveHour, 2);
        },
        '%j': function (date) {
            // Day of the year (001-366)
            return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3);
        },
        '%m': function (date) {
            return leadingNulls(date.tm_mon + 1, 2);
        },
        '%M': function (date) {
            return leadingNulls(date.tm_min, 2);
        },
        '%n': function () {
            return '\n';
        },
        '%p': function (date) {
            if (date.tm_hour >= 0 && date.tm_hour < 12) {
                return 'AM';
            }
            else {
                return 'PM';
            }
        },
        '%S': function (date) {
            return leadingNulls(date.tm_sec, 2);
        },
        '%t': function () {
            return '\t';
        },
        '%u': function (date) {
            return date.tm_wday || 7;
        },
        '%U': function (date) {
            // Replaced by the week number of the year as a decimal number [00,53].
            // The first Sunday of January is the first day of week 1;
            // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
            var janFirst = new Date(date.tm_year + 1900, 0, 1);
            var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
            var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
            // is target date after the first Sunday?
            if (compareByDay(firstSunday, endDate) < 0) {
                // calculate difference in days between first Sunday and endDate
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
                var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2);
            }
            return compareByDay(firstSunday, janFirst) === 0 ? '01' : '00';
        },
        '%V': function (date) {
            // Replaced by the week number of the year (Monday as the first day of the week)
            // as a decimal number [01,53]. If the week containing 1 January has four
            // or more days in the new year, then it is considered week 1.
            // Otherwise, it is the last week of the previous year, and the next week is week 1.
            // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
            var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
            var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
            var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
            var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
            var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
            if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                // if given date is before this years first week, then it belongs to the 53rd week of last year
                return '53';
            }
            if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                // if given date is after next years first week, then it belongs to the 01th week of next year
                return '01';
            }
            // given date is in between CW 01..53 of this calendar year
            var daysDifference;
            if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
                // first CW of this year starts last year
                daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate();
            }
            else {
                // first CW of this year starts this year
                daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate();
            }
            return leadingNulls(Math.ceil(daysDifference / 7), 2);
        },
        '%w': function (date) {
            return date.tm_wday;
        },
        '%W': function (date) {
            // Replaced by the week number of the year as a decimal number [00,53].
            // The first Monday of January is the first day of week 1;
            // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
            var janFirst = new Date(date.tm_year, 0, 1);
            var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
            var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
            // is target date after the first Monday?
            if (compareByDay(firstMonday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
                var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2);
            }
            return compareByDay(firstMonday, janFirst) === 0 ? '01' : '00';
        },
        '%y': function (date) {
            // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
            return (date.tm_year + 1900).toString().substring(2);
        },
        '%Y': function (date) {
            // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
            return date.tm_year + 1900;
        },
        '%z': function (date) {
            // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ).
            // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich).
            var off = date.tm_gmtoff;
            var ahead = off >= 0;
            off = Math.abs(off) / 60;
            // convert from minutes into hhmm format (which means 60 minutes = 100 units)
            off = (off / 60) * 100 + (off % 60);
            return (ahead ? '+' : '-') + String("0000" + off).slice(-4);
        },
        '%Z': function (date) {
            return date.tm_zone;
        },
        '%%': function () {
            return '%';
        }
    };
    for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
            pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
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
    return _strftime(s, maxsize, format, tm); // no locale support yet
}
var FSNode = /** @constructor */ function (parent, name, mode, rdev) {
    if (!parent) {
        parent = this; // root node sets parent to itself
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev;
};
var readMode = 292 /*292*/ | 73 /*73*/;
var writeMode = 146 /*146*/;
Object.defineProperties(FSNode.prototype, {
    read: {
        get: /** @this{FSNode} */ function () {
            return (this.mode & readMode) === readMode;
        },
        set: /** @this{FSNode} */ function (val) {
            val ? this.mode |= readMode : this.mode &= ~readMode;
        }
    },
    write: {
        get: /** @this{FSNode} */ function () {
            return (this.mode & writeMode) === writeMode;
        },
        set: /** @this{FSNode} */ function (val) {
            val ? this.mode |= writeMode : this.mode &= ~writeMode;
        }
    },
    isFolder: {
        get: /** @this{FSNode} */ function () {
            return FS.isDir(this.mode);
        }
    },
    isDevice: {
        get: /** @this{FSNode} */ function () {
            return FS.isChrdev(this.mode);
        }
    }
});
FS.FSNode = FSNode;
FS.staticInit();
;
var ASSERTIONS = true;
/** @type {function(string, boolean=, number=)} */
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
        if (chr > 0xFF) {
            if (ASSERTIONS) {
                assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
            }
            chr &= 0xFF;
        }
        ret.push(String.fromCharCode(chr));
    }
    return ret.join('');
}
// Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149
// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com
/**
 * Decodes a base64 string.
 * @param {string} input The string to decode.
 */
var decodeBase64 = typeof atob === 'function' ? atob : function (input) {
    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var output = '';
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    do {
        enc1 = keyStr.indexOf(input.charAt(i++));
        enc2 = keyStr.indexOf(input.charAt(i++));
        enc3 = keyStr.indexOf(input.charAt(i++));
        enc4 = keyStr.indexOf(input.charAt(i++));
        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
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
// Converts a string of base64 into a byte array.
// Throws error on invalid input.
function intArrayFromBase64(s) {
    if (typeof ENVIRONMENT_IS_NODE === 'boolean' && ENVIRONMENT_IS_NODE) {
        var buf;
        try {
            // TODO: Update Node.js externs, Closure does not recognize the following Buffer.from()
            /**@suppress{checkTypes}*/
            buf = Buffer.from(s, 'base64');
        }
        catch (_) {
            buf = new Buffer(s, 'base64');
        }
        return new Uint8Array(buf['buffer'], buf['byteOffset'], buf['byteLength']);
    }
    try {
        var decoded = decodeBase64(s);
        var bytes = new Uint8Array(decoded.length);
        for (var i = 0; i < decoded.length; ++i) {
            bytes[i] = decoded.charCodeAt(i);
        }
        return bytes;
    }
    catch (_) {
        throw new Error('Converting base64 string to bytes failed.');
    }
}
// If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
function tryParseAsDataURI(filename) {
    if (!isDataURI(filename)) {
        return;
    }
    return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}
__ATINIT__.push({ func: function () { ___wasm_call_ctors(); } });
var asmLibraryArg = {
    "__cxa_atexit": ___cxa_atexit,
    "abort": _abort,
    "emscripten_memcpy_big": _emscripten_memcpy_big,
    "emscripten_resize_heap": _emscripten_resize_heap,
    "environ_get": _environ_get,
    "environ_sizes_get": _environ_sizes_get,
    "fd_close": _fd_close,
    "fd_read": _fd_read,
    "fd_seek": _fd_seek,
    "fd_write": _fd_write,
    "memory": wasmMemory,
    "setTempRet0": _setTempRet0,
    "strftime_l": _strftime_l
};
var asm = createWasm();
/** @type {function(...*):?} */
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = createExportWrapper("__wasm_call_ctors", asm);
/** @type {function(...*):?} */
var _GenerateCrc = Module["_GenerateCrc"] = createExportWrapper("GenerateCrc", asm);
/** @type {function(...*):?} */
var _CrcTest = Module["_CrcTest"] = createExportWrapper("CrcTest", asm);
/** @type {function(...*):?} */
var _AppendCRC = Module["_AppendCRC"] = createExportWrapper("AppendCRC", asm);
/** @type {function(...*):?} */
var ___errno_location = Module["___errno_location"] = createExportWrapper("__errno_location", asm);
/** @type {function(...*):?} */
var _fflush = Module["_fflush"] = createExportWrapper("fflush", asm);
/** @type {function(...*):?} */
var stackSave = Module["stackSave"] = createExportWrapper("stackSave", asm);
/** @type {function(...*):?} */
var stackRestore = Module["stackRestore"] = createExportWrapper("stackRestore", asm);
/** @type {function(...*):?} */
var stackAlloc = Module["stackAlloc"] = createExportWrapper("stackAlloc", asm);
/** @type {function(...*):?} */
var _emscripten_stack_init = Module["_emscripten_stack_init"] = asm["emscripten_stack_init"];
/** @type {function(...*):?} */
var _emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = asm["emscripten_stack_get_free"];
/** @type {function(...*):?} */
var _emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = asm["emscripten_stack_get_end"];
/** @type {function(...*):?} */
var dynCall_viijii = Module["dynCall_viijii"] = createExportWrapper("dynCall_viijii", asm);
/** @type {function(...*):?} */
var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji", asm);
/** @type {function(...*):?} */
var dynCall_iiiiij = Module["dynCall_iiiiij"] = createExportWrapper("dynCall_iiiiij", asm);
/** @type {function(...*):?} */
var dynCall_iiiiijj = Module["dynCall_iiiiijj"] = createExportWrapper("dynCall_iiiiijj", asm);
/** @type {function(...*):?} */
var dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = createExportWrapper("dynCall_iiiiiijj", asm);
// === Auto-generated postamble setup entry stuff ===
if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromString"))
    Module["intArrayFromString"] = function () { abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "intArrayToString"))
    Module["intArrayToString"] = function () { abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
if (!Object.getOwnPropertyDescriptor(Module, "setValue"))
    Module["setValue"] = function () { abort("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "getValue"))
    Module["getValue"] = function () { abort("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "allocate"))
    Module["allocate"] = function () { abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "UTF8ArrayToString"))
    Module["UTF8ArrayToString"] = function () { abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "UTF8ToString"))
    Module["UTF8ToString"] = function () { abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8Array"))
    Module["stringToUTF8Array"] = function () { abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8"))
    Module["stringToUTF8"] = function () { abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF8"))
    Module["lengthBytesUTF8"] = function () { abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "stackTrace"))
    Module["stackTrace"] = function () { abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "addOnPreRun"))
    Module["addOnPreRun"] = function () { abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "addOnInit"))
    Module["addOnInit"] = function () { abort("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "addOnPreMain"))
    Module["addOnPreMain"] = function () { abort("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "addOnExit"))
    Module["addOnExit"] = function () { abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "addOnPostRun"))
    Module["addOnPostRun"] = function () { abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "writeStringToMemory"))
    Module["writeStringToMemory"] = function () { abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "writeArrayToMemory"))
    Module["writeArrayToMemory"] = function () { abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "writeAsciiToMemory"))
    Module["writeAsciiToMemory"] = function () { abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "addRunDependency"))
    Module["addRunDependency"] = function () { abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
if (!Object.getOwnPropertyDescriptor(Module, "removeRunDependency"))
    Module["removeRunDependency"] = function () { abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createFolder"))
    Module["FS_createFolder"] = function () { abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createPath"))
    Module["FS_createPath"] = function () { abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createDataFile"))
    Module["FS_createDataFile"] = function () { abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createPreloadedFile"))
    Module["FS_createPreloadedFile"] = function () { abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createLazyFile"))
    Module["FS_createLazyFile"] = function () { abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createLink"))
    Module["FS_createLink"] = function () { abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createDevice"))
    Module["FS_createDevice"] = function () { abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
if (!Object.getOwnPropertyDescriptor(Module, "FS_unlink"))
    Module["FS_unlink"] = function () { abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you"); };
if (!Object.getOwnPropertyDescriptor(Module, "getLEB"))
    Module["getLEB"] = function () { abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "getFunctionTables"))
    Module["getFunctionTables"] = function () { abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "alignFunctionTables"))
    Module["alignFunctionTables"] = function () { abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "registerFunctions"))
    Module["registerFunctions"] = function () { abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "addFunction"))
    Module["addFunction"] = function () { abort("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "removeFunction"))
    Module["removeFunction"] = function () { abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper"))
    Module["getFuncWrapper"] = function () { abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "prettyPrint"))
    Module["prettyPrint"] = function () { abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "makeBigInt"))
    Module["makeBigInt"] = function () { abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "dynCall"))
    Module["dynCall"] = function () { abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "getCompilerSetting"))
    Module["getCompilerSetting"] = function () { abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "print"))
    Module["print"] = function () { abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "printErr"))
    Module["printErr"] = function () { abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "getTempRet0"))
    Module["getTempRet0"] = function () { abort("'getTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "setTempRet0"))
    Module["setTempRet0"] = function () { abort("'setTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "callMain"))
    Module["callMain"] = function () { abort("'callMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "abort"))
    Module["abort"] = function () { abort("'abort' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "stringToNewUTF8"))
    Module["stringToNewUTF8"] = function () { abort("'stringToNewUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "setFileTime"))
    Module["setFileTime"] = function () { abort("'setFileTime' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "abortOnCannotGrowMemory"))
    Module["abortOnCannotGrowMemory"] = function () { abort("'abortOnCannotGrowMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "emscripten_realloc_buffer"))
    Module["emscripten_realloc_buffer"] = function () { abort("'emscripten_realloc_buffer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "ENV"))
    Module["ENV"] = function () { abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_CODES"))
    Module["ERRNO_CODES"] = function () { abort("'ERRNO_CODES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_MESSAGES"))
    Module["ERRNO_MESSAGES"] = function () { abort("'ERRNO_MESSAGES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "setErrNo"))
    Module["setErrNo"] = function () { abort("'setErrNo' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "DNS"))
    Module["DNS"] = function () { abort("'DNS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "getHostByName"))
    Module["getHostByName"] = function () { abort("'getHostByName' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "GAI_ERRNO_MESSAGES"))
    Module["GAI_ERRNO_MESSAGES"] = function () { abort("'GAI_ERRNO_MESSAGES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "Protocols"))
    Module["Protocols"] = function () { abort("'Protocols' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "Sockets"))
    Module["Sockets"] = function () { abort("'Sockets' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "getRandomDevice"))
    Module["getRandomDevice"] = function () { abort("'getRandomDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "traverseStack"))
    Module["traverseStack"] = function () { abort("'traverseStack' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "UNWIND_CACHE"))
    Module["UNWIND_CACHE"] = function () { abort("'UNWIND_CACHE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "withBuiltinMalloc"))
    Module["withBuiltinMalloc"] = function () { abort("'withBuiltinMalloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgsArray"))
    Module["readAsmConstArgsArray"] = function () { abort("'readAsmConstArgsArray' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgs"))
    Module["readAsmConstArgs"] = function () { abort("'readAsmConstArgs' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "mainThreadEM_ASM"))
    Module["mainThreadEM_ASM"] = function () { abort("'mainThreadEM_ASM' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "jstoi_q"))
    Module["jstoi_q"] = function () { abort("'jstoi_q' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "jstoi_s"))
    Module["jstoi_s"] = function () { abort("'jstoi_s' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "getExecutableName"))
    Module["getExecutableName"] = function () { abort("'getExecutableName' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "listenOnce"))
    Module["listenOnce"] = function () { abort("'listenOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "autoResumeAudioContext"))
    Module["autoResumeAudioContext"] = function () { abort("'autoResumeAudioContext' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "dynCallLegacy"))
    Module["dynCallLegacy"] = function () { abort("'dynCallLegacy' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "getDynCaller"))
    Module["getDynCaller"] = function () { abort("'getDynCaller' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "dynCall"))
    Module["dynCall"] = function () { abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "callRuntimeCallbacks"))
    Module["callRuntimeCallbacks"] = function () { abort("'callRuntimeCallbacks' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "abortStackOverflow"))
    Module["abortStackOverflow"] = function () { abort("'abortStackOverflow' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "reallyNegative"))
    Module["reallyNegative"] = function () { abort("'reallyNegative' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "unSign"))
    Module["unSign"] = function () { abort("'unSign' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "reSign"))
    Module["reSign"] = function () { abort("'reSign' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "formatString"))
    Module["formatString"] = function () { abort("'formatString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "PATH"))
    Module["PATH"] = function () { abort("'PATH' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "PATH_FS"))
    Module["PATH_FS"] = function () { abort("'PATH_FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "SYSCALLS"))
    Module["SYSCALLS"] = function () { abort("'SYSCALLS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "syscallMmap2"))
    Module["syscallMmap2"] = function () { abort("'syscallMmap2' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "syscallMunmap"))
    Module["syscallMunmap"] = function () { abort("'syscallMunmap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "JSEvents"))
    Module["JSEvents"] = function () { abort("'JSEvents' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "specialHTMLTargets"))
    Module["specialHTMLTargets"] = function () { abort("'specialHTMLTargets' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "maybeCStringToJsString"))
    Module["maybeCStringToJsString"] = function () { abort("'maybeCStringToJsString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "findEventTarget"))
    Module["findEventTarget"] = function () { abort("'findEventTarget' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "findCanvasEventTarget"))
    Module["findCanvasEventTarget"] = function () { abort("'findCanvasEventTarget' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "polyfillSetImmediate"))
    Module["polyfillSetImmediate"] = function () { abort("'polyfillSetImmediate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "demangle"))
    Module["demangle"] = function () { abort("'demangle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "demangleAll"))
    Module["demangleAll"] = function () { abort("'demangleAll' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "jsStackTrace"))
    Module["jsStackTrace"] = function () { abort("'jsStackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "stackTrace"))
    Module["stackTrace"] = function () { abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "getEnvStrings"))
    Module["getEnvStrings"] = function () { abort("'getEnvStrings' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "checkWasiClock"))
    Module["checkWasiClock"] = function () { abort("'checkWasiClock' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64"))
    Module["writeI53ToI64"] = function () { abort("'writeI53ToI64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Clamped"))
    Module["writeI53ToI64Clamped"] = function () { abort("'writeI53ToI64Clamped' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Signaling"))
    Module["writeI53ToI64Signaling"] = function () { abort("'writeI53ToI64Signaling' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Clamped"))
    Module["writeI53ToU64Clamped"] = function () { abort("'writeI53ToU64Clamped' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Signaling"))
    Module["writeI53ToU64Signaling"] = function () { abort("'writeI53ToU64Signaling' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "readI53FromI64"))
    Module["readI53FromI64"] = function () { abort("'readI53FromI64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "readI53FromU64"))
    Module["readI53FromU64"] = function () { abort("'readI53FromU64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "convertI32PairToI53"))
    Module["convertI32PairToI53"] = function () { abort("'convertI32PairToI53' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "convertU32PairToI53"))
    Module["convertU32PairToI53"] = function () { abort("'convertU32PairToI53' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "uncaughtExceptionCount"))
    Module["uncaughtExceptionCount"] = function () { abort("'uncaughtExceptionCount' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "exceptionLast"))
    Module["exceptionLast"] = function () { abort("'exceptionLast' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "exceptionCaught"))
    Module["exceptionCaught"] = function () { abort("'exceptionCaught' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "ExceptionInfoAttrs"))
    Module["ExceptionInfoAttrs"] = function () { abort("'ExceptionInfoAttrs' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "ExceptionInfo"))
    Module["ExceptionInfo"] = function () { abort("'ExceptionInfo' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "CatchInfo"))
    Module["CatchInfo"] = function () { abort("'CatchInfo' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "exception_addRef"))
    Module["exception_addRef"] = function () { abort("'exception_addRef' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "exception_decRef"))
    Module["exception_decRef"] = function () { abort("'exception_decRef' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "Browser"))
    Module["Browser"] = function () { abort("'Browser' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "funcWrappers"))
    Module["funcWrappers"] = function () { abort("'funcWrappers' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper"))
    Module["getFuncWrapper"] = function () { abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "setMainLoop"))
    Module["setMainLoop"] = function () { abort("'setMainLoop' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "FS"))
    Module["FS"] = function () { abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "mmapAlloc"))
    Module["mmapAlloc"] = function () { abort("'mmapAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "MEMFS"))
    Module["MEMFS"] = function () { abort("'MEMFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "TTY"))
    Module["TTY"] = function () { abort("'TTY' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "PIPEFS"))
    Module["PIPEFS"] = function () { abort("'PIPEFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "SOCKFS"))
    Module["SOCKFS"] = function () { abort("'SOCKFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "tempFixedLengthArray"))
    Module["tempFixedLengthArray"] = function () { abort("'tempFixedLengthArray' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "miniTempWebGLFloatBuffers"))
    Module["miniTempWebGLFloatBuffers"] = function () { abort("'miniTempWebGLFloatBuffers' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "heapObjectForWebGLType"))
    Module["heapObjectForWebGLType"] = function () { abort("'heapObjectForWebGLType' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "heapAccessShiftForWebGLHeap"))
    Module["heapAccessShiftForWebGLHeap"] = function () { abort("'heapAccessShiftForWebGLHeap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "GL"))
    Module["GL"] = function () { abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGet"))
    Module["emscriptenWebGLGet"] = function () { abort("'emscriptenWebGLGet' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "computeUnpackAlignedImageSize"))
    Module["computeUnpackAlignedImageSize"] = function () { abort("'computeUnpackAlignedImageSize' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetTexPixelData"))
    Module["emscriptenWebGLGetTexPixelData"] = function () { abort("'emscriptenWebGLGetTexPixelData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetUniform"))
    Module["emscriptenWebGLGetUniform"] = function () { abort("'emscriptenWebGLGetUniform' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetVertexAttrib"))
    Module["emscriptenWebGLGetVertexAttrib"] = function () { abort("'emscriptenWebGLGetVertexAttrib' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "writeGLArray"))
    Module["writeGLArray"] = function () { abort("'writeGLArray' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "AL"))
    Module["AL"] = function () { abort("'AL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "SDL_unicode"))
    Module["SDL_unicode"] = function () { abort("'SDL_unicode' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "SDL_ttfContext"))
    Module["SDL_ttfContext"] = function () { abort("'SDL_ttfContext' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "SDL_audio"))
    Module["SDL_audio"] = function () { abort("'SDL_audio' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "SDL"))
    Module["SDL"] = function () { abort("'SDL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "SDL_gfx"))
    Module["SDL_gfx"] = function () { abort("'SDL_gfx' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "GLUT"))
    Module["GLUT"] = function () { abort("'GLUT' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "EGL"))
    Module["EGL"] = function () { abort("'EGL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "GLFW_Window"))
    Module["GLFW_Window"] = function () { abort("'GLFW_Window' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "GLFW"))
    Module["GLFW"] = function () { abort("'GLFW' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "GLEW"))
    Module["GLEW"] = function () { abort("'GLEW' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "IDBStore"))
    Module["IDBStore"] = function () { abort("'IDBStore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "runAndAbortIfError"))
    Module["runAndAbortIfError"] = function () { abort("'runAndAbortIfError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "warnOnce"))
    Module["warnOnce"] = function () { abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "stackSave"))
    Module["stackSave"] = function () { abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "stackRestore"))
    Module["stackRestore"] = function () { abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "stackAlloc"))
    Module["stackAlloc"] = function () { abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "AsciiToString"))
    Module["AsciiToString"] = function () { abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "stringToAscii"))
    Module["stringToAscii"] = function () { abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "UTF16ToString"))
    Module["UTF16ToString"] = function () { abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF16"))
    Module["stringToUTF16"] = function () { abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF16"))
    Module["lengthBytesUTF16"] = function () { abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "UTF32ToString"))
    Module["UTF32ToString"] = function () { abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF32"))
    Module["stringToUTF32"] = function () { abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF32"))
    Module["lengthBytesUTF32"] = function () { abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8"))
    Module["allocateUTF8"] = function () { abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8OnStack"))
    Module["allocateUTF8OnStack"] = function () { abort("'allocateUTF8OnStack' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
Module["writeStackCookie"] = writeStackCookie;
Module["checkStackCookie"] = checkStackCookie;
if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromBase64"))
    Module["intArrayFromBase64"] = function () { abort("'intArrayFromBase64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "tryParseAsDataURI"))
    Module["tryParseAsDataURI"] = function () { abort("'tryParseAsDataURI' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); };
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NORMAL"))
    Object.defineProperty(Module, "ALLOC_NORMAL", { configurable: true, get: function () { abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); } });
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_STACK"))
    Object.defineProperty(Module, "ALLOC_STACK", { configurable: true, get: function () { abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)"); } });
var calledRun;
/**
 * @constructor
 * @this {ExitStatus}
 */
function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status;
}
var calledMain = false;
dependenciesFulfilled = function runCaller() {
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun)
        run();
    if (!calledRun)
        dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};
/** @type {function(Array=)} */
function run(args) {
    args = args || arguments_;
    if (runDependencies > 0) {
        return;
    }
    // This is normally called automatically during __wasm_call_ctors but need to
    // get these values before even running any of the ctors so we call it redundantly
    // here.
    // TODO(sbc): Move writeStackCookie to native to to avoid this.
    _emscripten_stack_init();
    writeStackCookie();
    preRun();
    if (runDependencies > 0)
        return; // a preRun added a dependency, run will be called later
    function doRun() {
        // run may have just been called through dependencies being fulfilled just in this very frame,
        // or while the async setStatus time below was happening
        if (calledRun)
            return;
        calledRun = true;
        Module['calledRun'] = true;
        if (ABORT)
            return;
        initRuntime();
        preMain();
        if (Module['onRuntimeInitialized'])
            Module['onRuntimeInitialized']();
        assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');
        postRun();
    }
    if (Module['setStatus']) {
        Module['setStatus']('Running...');
        setTimeout(function () {
            setTimeout(function () {
                Module['setStatus']('');
            }, 1);
            doRun();
        }, 1);
    }
    else {
        doRun();
    }
    checkStackCookie();
}
Module['run'] = run;
function checkUnflushedContent() {
    // Compiler settings do not allow exiting the runtime, so flushing
    // the streams is not possible. but in ASSERTIONS mode we check
    // if there was something to flush, and if so tell the user they
    // should request that the runtime be exitable.
    // Normally we would not even include flush() at all, but in ASSERTIONS
    // builds we do so just for this check, and here we see if there is any
    // content to flush, that is, we check if there would have been
    // something a non-ASSERTIONS build would have not seen.
    // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
    // mode (which has its own special function for this; otherwise, all
    // the code is inside libc)
    var print = out;
    var printErr = err;
    var has = false;
    out = err = function (x) {
        has = true;
    };
    try { // it doesn't matter if it fails
        var flush = Module['_fflush'];
        if (flush)
            flush(0);
        // also flush in the JS FS layer
        ['stdout', 'stderr'].forEach(function (name) {
            var info = FS.analyzePath('/dev/' + name);
            if (!info)
                return;
            var stream = info.object;
            var rdev = stream.rdev;
            var tty = TTY.ttys[rdev];
            if (tty && tty.output && tty.output.length) {
                has = true;
            }
        });
    }
    catch (e) { }
    out = print;
    err = printErr;
    if (has) {
        warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
    }
}
/** @param {boolean|number=} implicit */
function exit(status, implicit) {
    checkUnflushedContent();
    // if this is just main exit-ing implicitly, and the status is 0, then we
    // don't need to do anything here and can just leave. if the status is
    // non-zero, though, then we need to report it.
    // (we may have warned about this earlier, if a situation justifies doing so)
    if (implicit && noExitRuntime && status === 0) {
        return;
    }
    if (noExitRuntime) {
        // if exit() was called, we may warn the user if the runtime isn't actually being shut down
        if (!implicit) {
            var msg = 'program exited (with status: ' + status + '), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)';
            err(msg);
        }
    }
    else {
        EXITSTATUS = status;
        exitRuntime();
        if (Module['onExit'])
            Module['onExit'](status);
        ABORT = true;
    }
    quit_(status, new ExitStatus(status));
}
if (Module['preInit']) {
    if (typeof Module['preInit'] == 'function')
        Module['preInit'] = [Module['preInit']];
    while (Module['preInit'].length > 0) {
        Module['preInit'].pop()();
    }
}
noExitRuntime = true;
run();
