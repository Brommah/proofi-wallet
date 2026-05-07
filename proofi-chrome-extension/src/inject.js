/**
 * Proofi Wallet — Page-level Injection Script
 * Runs in the PAGE context and exposes an async provider bridge for apps.
 */

(function () {
  const PAGE_SOURCE = 'proofi-page';
  const CONTENT_SOURCE = 'proofi-content';
  const scriptEl = document.currentScript;
  const pending = new Map();
  let activeSignRequest = null;

  let walletState = {
    connected: false,
    unlocked: false,
    claimed: false,
    address: null,
    publicKeyHex: null,
    email: null,
    name: null,
    vaultId: null,
    cubbyId: null,
    network: 'cere-devnet',
    env: 'devnet',
    status: 'not_connected',
  };

  try {
    walletState = {
      ...walletState,
      ...JSON.parse(scriptEl?.dataset?.proofiState || '{}'),
    };
  } catch {
    // Keep default disconnected state.
  }

  function nextRequestId() {
    return `proofi-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function request(type, payload = {}) {
    const requestId = payload.requestId || nextRequestId();
    window.postMessage({
      ...payload,
      source: PAGE_SOURCE,
      type,
      requestId,
    }, window.location.origin);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(requestId);
        reject(Object.assign(new Error('Proofi request timed out'), { code: 'USER_REJECTED' }));
      }, 130_000);

      pending.set(requestId, { resolve, reject, timeout });
    });
  }

  function normalizeResponse(response) {
    if (response && response.ok === false) {
      const err = new Error(response.error || response.code || 'Proofi request failed');
      err.code = response.code;
      err.response = response;
      throw err;
    }
    return response?.ok === true ? { ...response, ok: undefined } : response;
  }

  function publishReady() {
    window.dispatchEvent(new CustomEvent('proofi-extension-ready', {
      detail: walletState,
    }));
  }

  function publishStateChanged() {
    window.dispatchEvent(new CustomEvent('proofi-wallet-state-changed', {
      detail: walletState,
    }));
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const data = event.data || {};
    if (data.source !== CONTENT_SOURCE) return;

    if (data.type === 'WALLET_STATE_CHANGED') {
      walletState = { ...walletState, ...(data.state || {}) };
      window.__proofi_extension__.state = walletState;
      publishStateChanged();
      return;
    }

    if (data.type === 'SIGN_REQUEST_PENDING') {
      window.dispatchEvent(new CustomEvent('proofi-sign-request-pending', {
        detail: data.request,
      }));
      return;
    }

    if (!data.requestId || !data.type?.endsWith('_RESPONSE')) return;
    const entry = pending.get(data.requestId);
    if (!entry) return;

    if (data.type === 'SIGN_RAW_BYTES_RESPONSE' && data.response?.pending) {
      return;
    }

    pending.delete(data.requestId);
    clearTimeout(entry.timeout);

    try {
      const normalized = normalizeResponse(data.response);
      if (data.type === 'GET_WALLET_STATE_RESPONSE' && normalized) {
        walletState = { ...walletState, ...normalized };
        window.__proofi_extension__.state = walletState;
        publishStateChanged();
      }
      entry.resolve(normalized);
    } catch (err) {
      entry.reject(err);
    }
  });

  window.__proofi_extension__ = {
    provider: 'proofi-wallet',
    version: '1.1.0',
    state: walletState,
    get connected() { return !!walletState.connected; },
    get unlocked() { return !!walletState.unlocked; },
    get claimed() { return !!walletState.claimed; },
    get status() { return walletState.status; },
    get address() { return walletState.address; },
    get publicKeyHex() { return walletState.publicKeyHex; },
    get email() { return walletState.email; },
    get name() { return walletState.name; },
    get vaultId() { return walletState.vaultId; },
    get cubbyId() { return walletState.cubbyId; },
    get network() { return walletState.network; },
    get env() { return walletState.env; },
    async getState() {
      return request('GET_WALLET_STATE').then(normalizeResponse);
    },
    async signRawBytes({ requestId, bytesHex, purpose } = {}) {
      if (activeSignRequest) {
        if (activeSignRequest.bytesHex === bytesHex && activeSignRequest.purpose === purpose) {
          return activeSignRequest.promise;
        }
        throw Object.assign(new Error('A Proofi signature request is already pending'), {
          code: 'SIGN_REQUEST_PENDING',
        });
      }

      const promise = request('SIGN_RAW_BYTES', { requestId, bytesHex, purpose })
        .then(normalizeResponse)
        .finally(() => {
          activeSignRequest = null;
        });
      activeSignRequest = { bytesHex, purpose, promise };
      return promise;
    },
    async request(args = {}) {
      const type = args.type || args.method;
      if (!type) throw Object.assign(new Error('Proofi request type missing'), { code: 'INVALID_PAYLOAD' });
      return request(type, args).then(normalizeResponse);
    },
  };

  publishReady();
  console.log('[Proofi Extension] Provider bridge injected:', walletState.status);
})();
