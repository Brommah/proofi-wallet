/**
 * Proofi SDK v1.2
 * 
 * Lightweight JavaScript SDK for integrating Proofi wallet into any web app.
 * Opens wallet as an in-page modal overlay (iframe), not a popup/new tab.
 * 
 * v1.2 Changes:
 * - Robust error handling: all fetch calls wrapped in try/catch
 * - Retry logic: 1 retry with 1s delay on API failures
 * - localStorage caching: achievements cached as fallback
 * - Graceful defaults: storeAchievement returns local result on failure
 * - Better error messages: no more raw "Failed to fetch" errors
 * 
 * Usage:
 *   const proofi = new ProofiSDK({ walletUrl: 'https://proofi-virid.vercel.app/app' });
 *   const address = await proofi.connect();
 *   await proofi.storeAchievement({ game: 'snake', score: 100, achievement: 'First Kill' });
 */

class ProofiSDK {
  constructor(options = {}) {
    this.walletUrl = options.walletUrl || 'https://proofi-virid.vercel.app/app';
    this.apiUrl = options.apiUrl || 'https://proofi-api-production.up.railway.app';
    this.appName = options.appName || document.title || 'Web App';
    this.address = null;
    this.connected = false;
    this._overlay = null;
    this._iframe = null;
    this._listeners = {};
    this._pendingRequests = new Map();
    this._messageHandler = this._handleMessage.bind(this);
    window.addEventListener('message', this._messageHandler);
  }

  /**
   * Connect to the Proofi wallet. Opens modal overlay with wallet iframe.
   * Returns the wallet address once connected.
   */
  async connect() {
    if (this.connected && this.address) return this.address;

    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();

      // Create modal overlay with iframe
      this._createOverlay();

      // Wait for wallet to be ready, then send connect request
      const checkReady = setInterval(() => {
        try {
          if (this._iframe && this._iframe.contentWindow) {
            this._iframe.contentWindow.postMessage({
              type: 'PROOFI_CONNECT_REQUEST',
              id: requestId,
              appName: this.appName,
              origin: window.location.origin,
              permissions: ['read', 'sign'],
            }, '*');
          }
        } catch (e) { /* iframe not ready yet */ }
      }, 500);

      // Store the pending request (include interval ref so we can clear on approve)
      this._pendingRequests.set(requestId, {
        resolve: (address) => {
          clearInterval(checkReady);
          this.address = address;
          this.connected = true;
          this._emit('connected', { address });
          resolve(address);
        },
        reject: (err) => {
          clearInterval(checkReady);
          reject(err);
        },
        type: 'connect',
        _interval: checkReady,
      });

      // Also listen for generic PROOFI_CONNECTED (from auth flow)
      this._pendingRequests.set('__auth_connect__', {
        resolve: (address) => {
          clearInterval(checkReady);
          this.address = address;
          this.connected = true;
          this._emit('connected', { address });
          resolve(address);
        },
        reject: () => {},
        type: 'auth',
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkReady);
        this._pendingRequests.delete(requestId);
        this._pendingRequests.delete('__auth_connect__');
        if (!this.connected) {
          this._removeOverlay();
          reject(new Error('Connection timed out. Please try again.'));
        }
      }, 300000);
    });
  }

  /**
   * Disconnect from the wallet.
   */
  disconnect() {
    this.address = null;
    this.connected = false;
    this._removeOverlay();
    this._emit('disconnected');
  }

  /**
   * Show the wallet overlay (e.g. to manage wallet while connected).
   */
  showWallet() {
    if (this._overlay) {
      this._overlay.style.display = 'flex';
    } else {
      this._createOverlay();
    }
  }

  /**
   * Hide the wallet overlay without disconnecting.
   */
  hideWallet() {
    if (this._overlay) {
      this._overlay.style.display = 'none';
    }
  }

  /**
   * Store a game achievement on DDC via the Proofi API.
   * On API failure, stores locally and returns a local result.
   * Never throws network errors to the caller.
   */
  async storeAchievement({ game, score, achievement, data }) {
    if (!this.connected || !this.address) {
      throw new Error('Not connected. Call connect() first.');
    }

    const payload = {
      game,
      score: score || 0,
      achievement: achievement || 'score',
      data: data || {},
    };

    try {
      const token = this._getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const result = await this._fetchWithRetry(`${this.apiUrl}/game/achievement`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      // Cache locally for offline access
      this._cacheAchievement(game, { ...payload, cid: result.cid, timestamp: Date.now() });
      this._emit('achievement', { game, score, achievement, cid: result.cid });
      return result;
    } catch (err) {
      // Network/API error — fallback to local storage
      console.warn('ProofiSDK: API unavailable, storing locally:', err.message);
      const localCid = 'local_' + Date.now().toString(36);
      const localResult = { cid: localCid, stored: 'local' };
      this._cacheAchievement(game, { ...payload, cid: localCid, timestamp: Date.now() });
      this._emit('achievement', { game, score, achievement, cid: localCid });
      return localResult;
    }
  }

  /**
   * Get achievements for a wallet address.
   * On API failure, returns cached achievements from localStorage.
   */
  async getAchievements(walletAddress) {
    const addr = walletAddress || this.address;
    if (!addr) return [];

    try {
      const result = await this._fetchWithRetry(`${this.apiUrl}/game/achievements/${addr}`);
      const achievements = result.achievements || [];
      // Cache for offline use
      this._setCachedAchievements(addr, achievements);
      return achievements;
    } catch (err) {
      console.warn('ProofiSDK: Failed to fetch achievements, using cache:', err.message);
      return this._getCachedAchievements(addr);
    }
  }

  /**
   * Listen for events: 'connected', 'disconnected', 'achievement'
   */
  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
    return () => {
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    };
  }

  /**
   * Clean up resources.
   */
  destroy() {
    window.removeEventListener('message', this._messageHandler);
    this._removeOverlay();
    this._pendingRequests.clear();
    this._listeners = {};
  }

  // ── Internal: Fetch with retry ──

  async _fetchWithRetry(url, options = {}, retries = 1) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Server error (${res.status})`);
        }
        return data;
      } catch (err) {
        if (attempt < retries) {
          // Wait 1 second before retry
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        // Translate common errors to user-friendly messages
        if (err.name === 'AbortError') {
          throw new Error('Request timed out. The server may be busy.');
        }
        if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
          throw new Error('Network unavailable. Data saved locally.');
        }
        throw err;
      }
    }
  }

  // ── Internal: Caching ──

  _cacheAchievement(game, data) {
    try {
      const key = `proofi_cache_${game}`;
      const cached = JSON.parse(localStorage.getItem(key) || '[]');
      cached.push(data);
      // Keep last 100 entries
      if (cached.length > 100) cached.splice(0, cached.length - 100);
      localStorage.setItem(key, JSON.stringify(cached));
    } catch { /* localStorage unavailable */ }
  }

  _getCachedAchievements(addr) {
    try {
      return JSON.parse(localStorage.getItem(`proofi_achievements_${addr}`) || '[]');
    } catch { return []; }
  }

  _setCachedAchievements(addr, achievements) {
    try {
      localStorage.setItem(`proofi_achievements_${addr}`, JSON.stringify(achievements));
    } catch { /* localStorage unavailable */ }
  }

  // ── Internal: Overlay ──

  _createOverlay() {
    if (this._overlay) {
      this._overlay.style.display = 'flex';
      return;
    }

    // Backdrop
    this._overlay = document.createElement('div');
    Object.assign(this._overlay.style, {
      position: 'fixed',
      top: '0', left: '0', right: '0', bottom: '0',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '999999',
      animation: 'proofi-fade-in 0.2s ease',
    });

    // Modal container
    const modal = document.createElement('div');
    Object.assign(modal.style, {
      width: '400px',
      maxWidth: '95vw',
      height: '680px',
      maxHeight: '90vh',
      background: '#000',
      border: '2px solid #00E5FF',
      boxShadow: '0 0 40px rgba(0, 229, 255, 0.15)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    });

    // Header bar
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 16px',
      background: '#0A0A0A',
      borderBottom: '1px solid #1A1A1A',
      flexShrink: '0',
    });

    const title = document.createElement('span');
    title.textContent = '🔐 PROOFI WALLET';
    Object.assign(title.style, {
      fontFamily: "'Orbitron', 'JetBrains Mono', monospace",
      fontSize: '12px',
      letterSpacing: '2px',
      color: '#00E5FF',
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    Object.assign(closeBtn.style, {
      background: 'none',
      border: '1px solid #333',
      color: '#666',
      fontSize: '14px',
      cursor: 'pointer',
      padding: '4px 8px',
      fontFamily: 'monospace',
    });
    closeBtn.onmouseenter = () => { closeBtn.style.color = '#FF3366'; closeBtn.style.borderColor = '#FF3366'; };
    closeBtn.onmouseleave = () => { closeBtn.style.color = '#666'; closeBtn.style.borderColor = '#333'; };
    closeBtn.onclick = () => {
      if (this.connected) {
        this.hideWallet();
      } else {
        this._removeOverlay();
        // Reject pending connect
        for (const [id, pending] of this._pendingRequests) {
          pending.reject(new Error('User closed wallet'));
          this._pendingRequests.delete(id);
        }
      }
    };

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Iframe
    this._iframe = document.createElement('iframe');
    this._iframe.src = this.walletUrl;
    Object.assign(this._iframe.style, {
      flex: '1',
      width: '100%',
      border: 'none',
      background: '#000',
    });
    this._iframe.allow = 'clipboard-write';

    modal.appendChild(header);
    modal.appendChild(this._iframe);
    this._overlay.appendChild(modal);

    // Click backdrop to close
    this._overlay.onclick = (e) => {
      if (e.target === this._overlay) {
        closeBtn.onclick();
      }
    };

    // Inject animation CSS
    if (!document.getElementById('proofi-sdk-styles')) {
      const style = document.createElement('style');
      style.id = 'proofi-sdk-styles';
      style.textContent = `
        @keyframes proofi-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(this._overlay);
  }

  _removeOverlay() {
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
      this._iframe = null;
    }
  }

  // ── Internal: Messages ──

  _handleMessage(event) {
    const { data } = event;
    if (!data || typeof data !== 'object' || !data.type) return;

    switch (data.type) {
      case 'PROOFI_REQUEST_APPROVED': {
        // Stop polling — approval received, now waiting for PROOFI_CONNECTED with address
        const approvedReq = this._pendingRequests.get(data.requestId);
        if (approvedReq && approvedReq._interval) {
          clearInterval(approvedReq._interval);
          approvedReq._interval = null;
        }
        break;
      }

      case 'PROOFI_REQUEST_REJECTED': {
        const pending = this._pendingRequests.get(data.requestId);
        if (pending) {
          pending.reject(new Error('User rejected the request'));
          this._pendingRequests.delete(data.requestId);
          this._removeOverlay();
        }
        break;
      }

      case 'PROOFI_CONNECTED': {
        if (data.address) {
          for (const [id, pending] of this._pendingRequests) {
            if (pending.type === 'connect' || pending.type === 'auth') {
              pending.resolve(data.address);
              this._pendingRequests.delete(id);
            }
          }
          // Hide overlay after connect (keep iframe alive for future use)
          setTimeout(() => this.hideWallet(), 800);
        }
        break;
      }

      case 'PROOFI_AUTHENTICATED': {
        if (data.address) {
          for (const [id, pending] of this._pendingRequests) {
            if (pending.type === 'connect' || pending.type === 'auth') {
              pending.resolve(data.address);
              this._pendingRequests.delete(id);
            }
          }
          setTimeout(() => this.hideWallet(), 800);
        }
        break;
      }

      case 'PROOFI_DISCONNECTED':
      case 'PROOFI_LOGGED_OUT': {
        this.address = null;
        this.connected = false;
        this._emit('disconnected');
        this._removeOverlay();
        break;
      }
    }
  }

  _getToken() {
    try {
      // Check localStorage first
      const token = localStorage.getItem('proofi_token');
      if (token) return token;
      // Fallback: check Chrome extension injected state
      if (window.__proofi_extension__?.token) {
        localStorage.setItem('proofi_token', window.__proofi_extension__.token);
        return window.__proofi_extension__.token;
      }
      return null;
    } catch {
      return null;
    }
  }

  _emit(event, data) {
    const callbacks = this._listeners[event] || [];
    callbacks.forEach(cb => {
      try { cb(data); } catch (e) { console.error('ProofiSDK event error:', e); }
    });
  }
}

// Export for both module and script tag usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProofiSDK };
}
if (typeof window !== 'undefined') {
  window.ProofiSDK = ProofiSDK;
}
