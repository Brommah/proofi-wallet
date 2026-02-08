// Noop pino replacement for serverless environments
// The real pino uses thread-stream/worker_threads which don't work in Vercel

const noop = () => {};
const noopLogger = {
  trace: noop, debug: noop, info: noop, warn: noop, error: noop, fatal: noop,
  silent: noop, level: 'silent', child: () => noopLogger, bindings: () => ({}),
  flush: noop, isLevelEnabled: () => false, levels: { values: {}, labels: {} },
};

function pino(opts) {
  return noopLogger;
}

pino.destination = () => process.stdout;
pino.transport = () => process.stdout;
pino.multistream = () => process.stdout;
pino.levels = { values: {}, labels: {} };
pino.stdSerializers = {};
pino.stdTimeFunctions = { epochTime: () => '', unixTime: () => '', nullTime: () => '' };

module.exports = pino;
module.exports.default = pino;
module.exports.pino = pino;
