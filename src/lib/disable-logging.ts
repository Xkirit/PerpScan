// Complete console suppression utility
// This runs immediately when imported to disable all console output

const noop = () => {};

// Override all console methods globally
if (typeof console !== 'undefined') {
  console.log = noop;
  console.info = noop;
  console.warn = noop;
  console.error = noop;
  console.debug = noop;
  console.trace = noop;
  console.table = noop;
  console.group = noop;
  console.groupEnd = noop;
  console.groupCollapsed = noop;
  console.count = noop;
  console.countReset = noop;
  console.time = noop;
  console.timeEnd = noop;
  console.timeLog = noop;
  console.assert = noop;
  console.clear = noop;
  console.dir = noop;
  console.dirxml = noop;
}

// Also override global console if available
if (typeof globalThis !== 'undefined' && globalThis.console) {
  globalThis.console = {
    ...globalThis.console,
    log: noop,
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
    trace: noop,
    table: noop,
    group: noop,
    groupEnd: noop,
    groupCollapsed: noop,
    count: noop,
    countReset: noop,
    time: noop,
    timeEnd: noop,
    timeLog: noop,
    assert: noop,
    clear: noop,
    dir: noop,
    dirxml: noop,
  };
}

// For Node.js environment
if (typeof global !== 'undefined' && global.console) {
  global.console = {
    ...global.console,
    log: noop,
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
    trace: noop,
    table: noop,
    group: noop,
    groupEnd: noop,
    groupCollapsed: noop,
    count: noop,
    countReset: noop,
    time: noop,
    timeEnd: noop,
    timeLog: noop,
    assert: noop,
    clear: noop,
    dir: noop,
    dirxml: noop,
  };
}

export default {}; 