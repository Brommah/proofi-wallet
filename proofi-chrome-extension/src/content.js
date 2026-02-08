/**
 * Proofi Wallet — Content Script
 * Runs on Proofi ecosystem pages.
 * - If wallet connected: injects wallet state for auto-connect
 * - If not connected: shows a connect banner that opens the extension login
 */

(function () {
  // Request wallet state from the background service worker
  chrome.runtime.sendMessage({ type: 'GET_WALLET_STATE' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('[Proofi Extension] Could not get wallet state:', chrome.runtime.lastError.message);
      showConnectBanner();
      return;
    }

    if (response && response.connected && response.address) {
      console.log('[Proofi Extension] Wallet connected, injecting data for', response.address.slice(0, 8) + '...');
      injectWalletData(response);
    } else {
      console.log('[Proofi Extension] No connected wallet, showing connect banner');
      showConnectBanner();
    }
  });

  // Listen for wallet state changes (user logs in via popup window)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.proofi_connected?.newValue === true && changes.proofi_address?.newValue) {
      console.log('[Proofi Extension] Wallet state changed — auto-connecting');
      removeConnectBanner();
      injectWalletData({
        address: changes.proofi_address.newValue,
        email: changes.proofi_email?.newValue || '',
        connected: true,
      });
    }
    // Handle disconnect
    if (changes.proofi_connected?.newValue === false || 
        (changes.proofi_connected && !changes.proofi_connected.newValue)) {
      console.log('[Proofi Extension] Wallet disconnected');
      removeWalletData();
      showConnectBanner();
    }
  });

  function injectWalletData(data) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.dataset.proofiAddress = data.address;
    script.dataset.proofiEmail = data.email || '';
    script.dataset.proofiToken = data.token || '';
    script.dataset.proofiConnected = 'true';
    (document.head || document.documentElement).appendChild(script);
    script.addEventListener('load', () => script.remove());
  }

  function removeWalletData() {
    // Inject a script that clears the extension state and fires disconnect event
    const script = document.createElement('script');
    script.textContent = `
      window.__proofi_extension__ = { connected: false, address: null, email: null };
      window.dispatchEvent(new CustomEvent('proofi-extension-disconnected'));
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
      // Tell background to open the extension popup (native dropdown)
      chrome.runtime.sendMessage({ type: 'OPEN_LOGIN_POPUP' }, (response) => {
        if (response?.method === 'popup') {
          // Native popup opened — show waiting state
          const btn = document.getElementById('proofi-ext-connect-btn');
          btn.textContent = '⏳ WAITING FOR LOGIN...';
          btn.style.animation = 'none';
          btn.style.opacity = '0.7';
        } else {
          // Fallback window opened — still show waiting
          const btn = document.getElementById('proofi-ext-connect-btn');
          btn.textContent = '⏳ WAITING FOR LOGIN...';
          btn.style.animation = 'none';
          btn.style.opacity = '0.7';
        }
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
