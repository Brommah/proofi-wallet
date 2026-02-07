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

    /**
     * Sign a message using the wallet's Sr25519 keypair.
     * Prompts for PIN unlock if the wallet is locked.
     * @param {string} message - The message to sign
     * @returns {Promise<string>} Hex-encoded signature
     */
    signMessage(message) {
      return new Promise((resolve, reject) => {
        const requestId = Date.now() + '-' + Math.random().toString(36).slice(2);

        function onResponse(event) {
          if (event.data?.type !== '__proofi_sign_response__') return;
          const detail = event.data.detail;
          if (detail?.requestId !== requestId) return;
          window.removeEventListener('message', onResponse);
          if (detail.error) {
            reject(new Error(detail.error));
          } else {
            resolve(detail.signature);
          }
        }

        window.addEventListener('message', onResponse);

        window.dispatchEvent(new CustomEvent('__proofi_sign_request__', {
          detail: { requestId, message }
        }));

        // Timeout after 2 minutes (user may need to enter PIN)
        setTimeout(() => {
          window.removeEventListener('message', onResponse);
          reject(new Error('signMessage timed out'));
        }, 120000);
      });
    },
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
