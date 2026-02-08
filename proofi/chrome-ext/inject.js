/**
 * Proofi Wallet — Injected Script
 * 
 * This script is injected into the page context to provide
 * the window.proofi provider object for dApp integration.
 * 
 * Placeholder for future implementation — will enable:
 * - window.proofi.connect()
 * - window.proofi.sign(message)
 * - window.proofi.getAddress()
 * - Event: 'accountsChanged'
 * - Event: 'disconnect'
 */

(() => {
  if (window.__proofi__) return; // Already injected

  window.__proofi__ = {
    isProofi: true,
    version: '0.1.0',
    
    // Will be implemented to communicate with extension
    connect: async () => {
      throw new Error('Proofi extension provider not yet implemented. Use ProofiSDK instead.');
    },
    
    getAddress: () => null,
    isConnected: () => false,
  };

  // Signal that Proofi is available
  window.dispatchEvent(new Event('proofi#initialized'));
})();
