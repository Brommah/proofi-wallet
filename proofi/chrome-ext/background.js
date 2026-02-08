/**
 * Proofi Chrome Extension — Background Service Worker
 *
 * Handles wallet state, API calls, and cross-tab communication.
 */

const API_BASE = 'https://proofi-api-production.up.railway.app';
const WALLET_URL = 'https://proofi-virid.vercel.app/app';

// ── Default State ──────────────────────────────────────────────────

const DEFAULT_STATE = {
  walletAddress: null,
  email: null,
  theme: 'dark',
  notifications: true,
  connectedAt: null,
};

// ── State helpers ──────────────────────────────────────────────────

async function getState() {
  const result = await chrome.storage.local.get([
    'walletAddress', 'email', 'theme', 'notifications', 'connectedAt'
  ]);
  return { ...DEFAULT_STATE, ...result };
}

async function setState(updates) {
  await chrome.storage.local.set(updates);
}

async function clearState() {
  await chrome.storage.local.remove([
    'walletAddress', 'email', 'connectedAt'
  ]);
}

// ── API helpers ────────────────────────────────────────────────────

async function fetchBalance(address) {
  try {
    const response = await fetch(`${API_BASE}/balance/${address}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Balance API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('fetchBalance error:', error);
    return { error: error.message };
  }
}

async function fetchCredentials(address) {
  try {
    const response = await fetch(`${API_BASE}/ddc/list/${address}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Credentials API error: ${response.status}`);
    }

    const data = await response.json();

    // Determine last activity from credentials
    let lastActivity = null;
    if (Array.isArray(data)) {
      const sorted = data
        .filter(item => item.timestamp || item.createdAt)
        .sort((a, b) => {
          const tA = new Date(a.timestamp || a.createdAt).getTime();
          const tB = new Date(b.timestamp || b.createdAt).getTime();
          return tB - tA;
        });
      if (sorted.length > 0) {
        lastActivity = sorted[0].timestamp || sorted[0].createdAt;
      }
    }

    return {
      credentials: Array.isArray(data) ? data : (data.credentials || data.items || []),
      lastActivity,
    };
  } catch (error) {
    console.error('fetchCredentials error:', error);
    return { credentials: [], error: error.message };
  }
}

// ── Message Handler ────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle async responses
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(err => {
      console.error('Message handler error:', err);
      sendResponse({ error: err.message });
    });

  // Return true to indicate we'll send a response asynchronously
  return true;
});

async function handleMessage(message, sender) {
  const { type } = message;

  switch (type) {
    // ── Get full state ──
    case 'GET_STATE': {
      return await getState();
    }

    // ── Open wallet for connection ──
    case 'CONNECT_WALLET': {
      await chrome.tabs.create({ url: WALLET_URL });
      return { success: true };
    }

    // ── Wallet authenticated (from content script or wallet page) ──
    case 'WALLET_AUTHENTICATED': {
      const { address, email } = message;
      if (address) {
        await setState({
          walletAddress: address,
          email: email || null,
          connectedAt: new Date().toISOString(),
        });
        return { success: true };
      }
      return { error: 'No address provided' };
    }

    // ── Fetch balance ──
    case 'FETCH_BALANCE': {
      const state = await getState();
      if (!state.walletAddress) {
        return { error: 'No wallet connected' };
      }
      return await fetchBalance(state.walletAddress);
    }

    // ── Fetch credentials ──
    case 'FETCH_CREDENTIALS': {
      const state = await getState();
      if (!state.walletAddress) {
        return { credentials: [], error: 'No wallet connected' };
      }
      return await fetchCredentials(state.walletAddress);
    }

    // ── Set theme ──
    case 'SET_THEME': {
      const { theme } = message;
      if (theme === 'dark' || theme === 'light') {
        await setState({ theme });
        return { success: true };
      }
      return { error: 'Invalid theme' };
    }

    // ── Set notifications ──
    case 'SET_NOTIFICATIONS': {
      const { enabled } = message;
      await setState({ notifications: !!enabled });
      return { success: true };
    }

    // ── Disconnect wallet ──
    case 'DISCONNECT_WALLET': {
      await clearState();
      return { success: true };
    }

    // ── dApp detected on page (from content script) ──
    case 'PROOFI_DAPP_DETECTED': {
      if (sender.tab) {
        chrome.action.setBadgeText({ tabId: sender.tab.id, text: '●' });
        chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#00FF88' });
      }
      return { acknowledged: true };
    }

    default: {
      console.warn('Unknown message type:', type);
      return { error: `Unknown message type: ${type}` };
    }
  }
}

// ── Tab navigation — clear badge ───────────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ tabId, text: '' });
  }
});

// ── Extension install handler ──────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Proofi extension installed — setting defaults');
    setState({
      theme: 'dark',
      notifications: true,
    });
  }
});

// ══════════════════════════════════════════════════════════════════════
// Capability Token Engine - Background Handlers
// ══════════════════════════════════════════════════════════════════════

// Token storage key
const TOKEN_STORAGE_KEY = 'proofi_tokens';

// Get active tokens (for external queries)
async function getActiveTokens() {
  const result = await chrome.storage.local.get(TOKEN_STORAGE_KEY);
  const data = result[TOKEN_STORAGE_KEY] || { tokens: [], revokedTokenIds: [] };
  const now = Date.now();
  
  return data.tokens.filter(t => 
    t.status === 'active' && 
    t.expiry > now &&
    !data.revokedTokenIds.includes(t.tokenId)
  );
}

// Check if a token is valid
async function validateToken(tokenId) {
  const result = await chrome.storage.local.get(TOKEN_STORAGE_KEY);
  const data = result[TOKEN_STORAGE_KEY] || { tokens: [], revokedTokenIds: [] };
  
  const token = data.tokens.find(t => t.tokenId === tokenId);
  if (!token) {
    return { valid: false, reason: 'Token not found' };
  }
  
  if (token.status !== 'active') {
    return { valid: false, reason: 'Token is not active' };
  }
  
  if (token.expiry <= Date.now()) {
    return { valid: false, reason: 'Token has expired' };
  }
  
  if (data.revokedTokenIds.includes(tokenId)) {
    return { valid: false, reason: 'Token has been revoked' };
  }
  
  return { 
    valid: true, 
    token: {
      tokenId: token.tokenId,
      grantee: token.grantee,
      scope: token.scope,
      permissions: token.permissions,
      expiry: token.expiry,
    }
  };
}

// Add token-related message handlers
const originalHandleMessage = handleMessage;
handleMessage = async function(message, sender) {
  const { type } = message;
  
  switch (type) {
    // ── Get active tokens ──
    case 'GET_ACTIVE_TOKENS': {
      return await getActiveTokens();
    }
    
    // ── Validate a token ──
    case 'VALIDATE_TOKEN': {
      const { tokenId } = message;
      return await validateToken(tokenId);
    }
    
    // ── Get token stats ──
    case 'GET_TOKEN_STATS': {
      const result = await chrome.storage.local.get(TOKEN_STORAGE_KEY);
      const data = result[TOKEN_STORAGE_KEY] || { tokens: [], revokedTokenIds: [] };
      const now = Date.now();
      
      return {
        total: data.tokens.length,
        active: data.tokens.filter(t => t.status === 'active' && t.expiry > now).length,
        revoked: data.tokens.filter(t => t.status === 'revoked').length,
        expired: data.tokens.filter(t => t.expiry <= now).length,
      };
    }
    
    default:
      // Fall through to original handler
      return await originalHandleMessage(message, sender);
  }
};
