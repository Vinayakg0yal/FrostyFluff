const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function createLogger(level = "info") {
  const threshold = LEVELS[level] ?? LEVELS.info;

  function shouldLog(logLevel) {
    return (LEVELS[logLevel] ?? LEVELS.info) >= threshold;
  }

  function log(logLevel, message, metadata) {
    if (!shouldLog(logLevel)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${logLevel.toUpperCase()}]`;

    if (metadata) {
      console.log(prefix, message, metadata);
      return;
    }

    console.log(prefix, message);
  }

  return {
    debug(message, metadata) {
      log("debug", message, metadata);
    },
    info(message, metadata) {
      log("info", message, metadata);
    },
    warn(message, metadata) {
      log("warn", message, metadata);
    },
    error(message, metadata) {
      log("error", message, metadata);
    }
  };
}

module.exports = {
  createLogger
};
