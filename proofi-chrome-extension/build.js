/**
 * esbuild configuration for Proofi Chrome Extension
 * Bundles popup.js and background.js with polkadot dependencies
 */

import esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');

// Ensure dist directory exists
mkdirSync(join(__dirname, 'dist'), { recursive: true });

// Copy static files to dist
const staticFiles = [
  ['src/manifest.json', 'dist/manifest.json'],
  ['src/popup.html', 'dist/popup.html'],
  ['src/styles.css', 'dist/styles.css'],
  ['src/content-styles.css', 'dist/content-styles.css'],
  ['src/inject.js', 'dist/inject.js'],
  ['src/agents-ui.js', 'dist/agents-ui.js'],
];

for (const [src, dest] of staticFiles) {
  const srcPath = join(__dirname, src);
  const destPath = join(__dirname, dest);
  if (existsSync(srcPath)) {
    copyFileSync(srcPath, destPath);
  }
}

// Copy icons
const iconsDir = join(__dirname, 'icons');
const distIconsDir = join(__dirname, 'dist', 'icons');
mkdirSync(distIconsDir, { recursive: true });
if (existsSync(iconsDir)) {
  for (const file of readdirSync(iconsDir)) {
    if (file.endsWith('.png') || file.endsWith('.svg')) {
      copyFileSync(join(iconsDir, file), join(distIconsDir, file));
    }
  }
}

// Shared esbuild options
const shared = {
  bundle: true,
  format: 'esm',
  target: 'chrome120',
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.NODE_DEBUG': 'false',
    'global': 'globalThis',
  },
};

// Build popup (runs in popup context with DOM)
const popupBuild = esbuild.build({
  ...shared,
  entryPoints: [join(__dirname, 'src/popup.js')],
  outfile: join(__dirname, 'dist/popup.js'),
  platform: 'browser',
});

// Build background service worker
const backgroundBuild = esbuild.build({
  ...shared,
  entryPoints: [join(__dirname, 'src/background.js')],
  outfile: join(__dirname, 'dist/background.js'),
  platform: 'browser',
});

// Build content script (no polkadot deps, lightweight)
const contentBuild = esbuild.build({
  ...shared,
  entryPoints: [join(__dirname, 'src/content.js')],
  outfile: join(__dirname, 'dist/content.js'),
  platform: 'browser',
});

await Promise.all([popupBuild, backgroundBuild, contentBuild]);
console.log('✅ Build complete → dist/');

if (isWatch) {
  console.log('👀 Watching for changes...');
}
