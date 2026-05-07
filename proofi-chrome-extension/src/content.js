/**
 * Proofi Wallet — Content Script
 * Runs on Proofi ecosystem pages.
 * - If wallet connected: injects wallet state for auto-connect
 * - If not connected: shows a connect banner that opens the extension login
 */

(function () {
  const PAGE_SOURCE = 'proofi-page';
  const CONTENT_SOURCE = 'proofi-content';
  const BRIDGE_TYPES = new Set([
    'GET_WALLET_STATE',
    'SIGN_RAW_BYTES',
    'AGENT_CONNECT',
    'AGENT_AUTH_REQUEST',
    'GET_HEALTH_DATA_ACCESS',
  ]);

  // Request wallet state from the background service worker
  requestWalletState((response) => {
    if (chrome.runtime.lastError) {
      console.log('[Proofi Extension] Could not get wallet state:', chrome.runtime.lastError.message);
      showConnectBanner();
      return;
    }

    injectWalletData(response || { connected: false, status: 'not_connected' });

    if (response && response.connected && response.address) {
      console.log('[Proofi Extension] Wallet connected, injecting data for', response.address.slice(0, 8) + '...');
    } else {
      console.log('[Proofi Extension] No connected wallet, showing connect banner');
      showConnectBanner();
    }
  });

  // Listen for wallet state changes (user logs in via popup window)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const relevant = [
      'proofi_connected',
      'proofi_address',
      'proofi_email',
      'proofi_unlocked',
      'proofi_vault_record',
      'proofi_vault_identity',
      'proofi_pending_sign',
      'proofi_sign_result',
    ].some((key) => changes[key]);
    if (!relevant) return;

    requestWalletState((state) => {
      window.postMessage({ source: CONTENT_SOURCE, type: 'WALLET_STATE_CHANGED', state }, window.location.origin);
      if (changes.proofi_pending_sign?.newValue) {
        window.postMessage({
          source: CONTENT_SOURCE,
          type: 'SIGN_REQUEST_PENDING',
          request: changes.proofi_pending_sign.newValue,
        }, window.location.origin);
      }
      if (changes.proofi_sign_result?.newValue) {
        const result = changes.proofi_sign_result.newValue;
        window.postMessage({
          source: CONTENT_SOURCE,
          type: 'SIGN_RAW_BYTES_RESPONSE',
          requestId: result.requestId,
          response: result.response,
        }, window.location.origin);
        chrome.storage.local.remove('proofi_sign_result');
      }
      if (state?.connected) {
        removeConnectBanner();
      } else {
        showConnectBanner();
      }
    });
  });

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const data = event.data || {};
    if (data.source !== PAGE_SOURCE || !BRIDGE_TYPES.has(data.type)) return;

    chrome.runtime.sendMessage({
      ...data,
      source: undefined,
      origin: window.location.origin,
    }, (response) => {
      const error = chrome.runtime.lastError;
      window.postMessage({
        source: CONTENT_SOURCE,
        type: `${data.type}_RESPONSE`,
        requestId: data.requestId,
        response: error ? { ok: false, error: error.message, code: 'EXTENSION_ERROR' } : response,
      }, window.location.origin);
    });
  });

  function requestWalletState(callback) {
    chrome.runtime.sendMessage({ type: 'GET_WALLET_STATE', origin: window.location.origin }, callback);
  }

  function injectWalletData(data) {
    if (document.documentElement.dataset.proofiBridgeInjected === 'true') {
      window.postMessage({ source: CONTENT_SOURCE, type: 'WALLET_STATE_CHANGED', state: data }, window.location.origin);
      return;
    }
    document.documentElement.dataset.proofiBridgeInjected = 'true';

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.dataset.proofiState = JSON.stringify(data || {});
    script.dataset.proofiAddress = data.address || '';
    script.dataset.proofiEmail = data.email || '';
    script.dataset.proofiConnected = data.connected ? 'true' : 'false';
    (document.head || document.documentElement).appendChild(script);
    script.addEventListener('load', () => script.remove());
  }

  function removeWalletData() {
    // Inject a script that clears the extension state and fires disconnect event
    const script = document.createElement('script');
    script.textContent = `
      window.postMessage({
        source: 'proofi-content',
        type: 'WALLET_STATE_CHANGED',
        state: { connected: false, address: null, email: null, status: 'not_connected' }
      }, window.location.origin);
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  function showConnectBanner() {
    if (document.getElementById('proofi-ext-connect-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'proofi-ext-connect-banner';
    banner.innerHTML = `
      <div style="
        position:fixed; bottom:24px; right:24px; z-index:999998;
        background:#0A0A0A; border:2px solid #00E5FF;
        border-radius:16px; padding:20px 24px;
        box-shadow:0 8px 32px rgba(0,229,255,0.15), 0 0 0 1px rgba(0,229,255,0.1);
        font-family:'Inter',system-ui,sans-serif; max-width:320px;
        animation: proofi-slide-in 0.3s ease;
      ">
        <style>
          @keyframes proofi-slide-in { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          @keyframes proofi-pulse { 0%,100% { box-shadow:0 0 0 0 rgba(0,229,255,0.4); } 50% { box-shadow:0 0 0 8px rgba(0,229,255,0); } }
        </style>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#00E5FF,#00FF88);display:flex;align-items:center;justify-content:center;font-size:18px;">🔐</div>
          <div>
            <div style="font-size:14px;font-weight:700;color:#F0F0F0;">Proofi Wallet</div>
            <div style="font-size:11px;color:#888;">Connect to use this app</div>
          </div>
          <button id="proofi-ext-close-banner" style="
            margin-left:auto; background:none; border:none; color:#555;
            font-size:18px; cursor:pointer; padding:4px; line-height:1;
          ">✕</button>
        </div>
        <button id="proofi-ext-connect-btn" style="
          width:100%; padding:12px; border:none; border-radius:10px;
          background:linear-gradient(135deg,#00E5FF,#00FF88); color:#000;
          font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700;
          letter-spacing:2px; cursor:pointer; text-transform:uppercase;
          transition:all 0.2s; animation: proofi-pulse 2s infinite;
        ">⚡ CONNECT WALLET</button>
        <div style="font-size:10px;color:#555;text-align:center;margin-top:8px;">
          Self-custodial · On-chain credentials · DDC storage
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('proofi-ext-connect-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_LOGIN_POPUP' }, (response) => {
        const btn = document.getElementById('proofi-ext-connect-btn');
        btn.textContent = response?.method === 'toolbar'
          ? 'CLICK PROOFI ICON'
          : 'WAITING FOR PROOFI...';
        btn.style.animation = 'none';
        btn.style.opacity = '0.85';
      });
    });

    document.getElementById('proofi-ext-close-banner').addEventListener('click', () => {
      removeConnectBanner();
    });
  }

  function removeConnectBanner() {
    const banner = document.getElementById('proofi-ext-connect-banner');
    if (banner) banner.remove();
  }
})();
