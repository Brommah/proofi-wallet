/**
 * Proofi Wallet — Background Service Worker
 * Handles messages from content scripts and popup.
 * All API calls are proxied through here to avoid CORS issues.
 */

const KEYS = {
  ADDRESS: 'proofi_address',
  EMAIL: 'proofi_email',
  TOKEN: 'proofi_token',
  CONNECTED: 'proofi_connected',
};

const API_URL = 'https://proofi-api-production.up.railway.app';

// Helper: open popup.html in a small window (fallback for older Chrome)
function openPopupWindow() {
  chrome.windows.create({
    url: chrome.runtime.getURL('popup.html'),
    type: 'popup',
    width: 400,
    height: 600,
    focused: true,
  });
}

// Helper: flash the extension badge to draw attention
function flashBadge() {
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#00E5FF' });
  // Clear after 5 seconds
  setTimeout(() => {
    chrome.storage.local.get(KEYS.CONNECTED, (r) => {
      chrome.action.setBadgeText({ text: r[KEYS.CONNECTED] ? '✓' : '' });
    });
  }, 5000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_WALLET_STATE') {
    chrome.storage.local.get(Object.values(KEYS), (result) => {
      sendResponse({
        address: result[KEYS.ADDRESS] || null,
        email: result[KEYS.EMAIL] || null,
        token: result[KEYS.TOKEN] || null,
        connected: result[KEYS.CONNECTED] || false,
      });
    });
    return true;
  }

  // Open the extension popup dropdown (not a new window)
  if (message.type === 'OPEN_LOGIN_POPUP') {
    // chrome.action.openPopup() opens the native toolbar dropdown (Chrome 127+)
    if (chrome.action?.openPopup) {
      chrome.action.openPopup()
        .then(() => {
          sendResponse({ ok: true, method: 'popup' });
        })
        .catch((err) => {
          console.warn('[Proofi] openPopup() failed, falling back to window:', err.message);
          // Fallback: open as popup window + flash badge to draw attention
          openPopupWindow();
          sendResponse({ ok: true, method: 'window' });
        });
    } else {
      // Older Chrome — fallback to popup window
      openPopupWindow();
      sendResponse({ ok: true, method: 'window' });
    }
    return true; // async response
  }

  // Proxy API calls from popup to avoid CORS
  if (message.type === 'API_REQUEST') {
    const { path, method, body, authHeaders } = message;
    const headers = {
      'Content-Type': 'application/json',
      ...(authHeaders || {}),
    };

    fetch(`${API_URL}${path}`, {
      method: method || 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          sendResponse({ error: data.error || `API error: ${res.status}`, status: res.status });
        } else {
          sendResponse({ data, status: res.status });
        }
      })
      .catch((err) => {
        sendResponse({ error: err.message, status: 0 });
      });
    return true;
  }
});
