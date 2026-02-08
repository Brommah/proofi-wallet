// Noop replacement for pino-pretty (serverless compatible)
// pino-pretty uses worker_threads which don't work in Vercel serverless
module.exports = function() {
  const { Transform } = require('stream');
  return new Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk);
    }
  });
};
module.exports.default = module.exports;
