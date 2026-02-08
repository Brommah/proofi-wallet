// Build DDC SDK for browser use
const esbuild = require('esbuild');
const path = require('path');

async function build() {
  try {
    await esbuild.build({
      entryPoints: [path.join(__dirname, '../lib/ddc-browser-entry.js')],
      bundle: true,
      outfile: path.join(__dirname, '../public/ddc-sdk.js'),
      format: 'iife',
      globalName: 'DDC',
      platform: 'browser',
      target: ['es2020'],
      minify: true,
      sourcemap: false,
      define: {
        'process.env.NODE_ENV': '"production"',
        'global': 'window',
      },
      inject: [path.join(__dirname, '../lib/browser-shims.js')],
    });
    console.log('✅ DDC SDK browser bundle created: public/ddc-sdk.js');
  } catch (e) {
    console.error('Build failed:', e);
    process.exit(1);
  }
}

build();
