#!/usr/bin/env node
// Patch pino to work in serverless environments without worker_threads
const fs = require('fs');
const path = require('path');

const pinoPath = path.join(__dirname, '..', 'node_modules', 'pino', 'lib', 'transport.js');

if (fs.existsSync(pinoPath)) {
  // Replace entire file with serverless-compatible version
  const replacement = `'use strict'

// PATCHED FOR SERVERLESS - pino transport disabled
// Original file uses thread-stream which requires worker_threads
// This noop version allows pino to work without transports

const { Transform } = require('stream')

function transport (fullOptions) {
  // Return a passthrough stream instead of worker-based transport
  const stream = new Transform({
    objectMode: true,
    autoDestroy: true,
    transform (chunk, enc, cb) {
      cb(null, chunk)
    }
  })
  stream.flushSync = () => {}
  stream.end = () => {}
  return stream
}

module.exports = transport
`;

  fs.writeFileSync(pinoPath, replacement);
  console.log('✅ Patched pino/lib/transport.js for serverless compatibility');
} else {
  console.log('⚠️ pino not found, skipping patch');
}
