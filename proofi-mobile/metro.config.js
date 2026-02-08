const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('html');

// Force @polkadot/wasm-crypto to use ASM.js only (no WebAssembly).
// Hermes can abort() when the Polkadot WASM binary is instantiated.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect WASM+ASM ("both") init to ASM-only
  if (moduleName === '@polkadot/wasm-crypto-init/both') {
    return context.resolveRequest(context, '@polkadot/wasm-crypto-init/asm', platform);
  }
  // Skip loading the raw WASM bytes entirely (saves ~1MB bundle size)
  if (moduleName === '@polkadot/wasm-crypto-wasm') {
    return { type: 'empty' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
