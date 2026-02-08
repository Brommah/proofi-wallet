/**
 * Proofi Wallet — Page-level Injection Script
 * Runs in the PAGE context (not the content script isolated world).
 * Reads wallet data from its own script element's data-attributes and
 * exposes them on window.__proofi_extension__ for demo apps to consume.
 */

(function () {
  // Find our own script element to read data-attributes
  const scriptEl = document.currentScript;
  if (!scriptEl) return;

  const address = scriptEl.dataset.proofiAddress;
  const email = scriptEl.dataset.proofiEmail || '';
  const token = scriptEl.dataset.proofiToken || '';
  const connected = scriptEl.dataset.proofiConnected === 'true';

  if (!connected || !address) return;

  // Expose wallet state to the page
  window.__proofi_extension__ = {
    address: address,
    email: email,
    token: token,
    connected: true,
  };

  // Store token in localStorage so ProofiSDK can use it for API calls
  if (token) {
    try { localStorage.setItem('proofi_token', token); } catch (e) {}
  }

  // Dispatch event so pages that are already loaded can react
  window.dispatchEvent(new CustomEvent('proofi-extension-ready', {
    detail: { address, email, token, connected: true }
  }));

  console.log('[Proofi Extension] Wallet data injected:', address.slice(0, 8) + '...');
})();
