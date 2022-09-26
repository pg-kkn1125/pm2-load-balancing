const { isDev } = require("../utils/variables");

class Dev {
  error(...args) {
    isDev && console.error(`[DEV]: `, ...args);
  }
  log(...args) {
    isDev && console.log(`[DEV]: `, ...args);
  }
  warn(...args) {
    isDev && console.warn(`[DEV]: `, ...args);
  }
  info(...args) {
    isDev && console.info(`[DEV]: `, ...args);
  }
  debug(...args) {
    isDev && console.debug(`[DEV]: `, ...args);
  }
  trace(...args) {
    isDev && console.trace(`[DEV]: `, ...args);
  }
  dir(...args) {
    isDev && console.dir(`[DEV]: `, ...args);
  }
}

module.exports.dev = new Dev();
