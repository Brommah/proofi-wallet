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
  UNLOCKED: 'proofi_unlocked',
  NAME: 'proofi_name',
};

const API_URL = 'https://proofi-api-production.up.railway.app';
const NETWORK_ENV = 'cere-devnet';
let lastPopupOpenAt = 0;

const ERROR_CODES = {
  PROOFI_LOCKED: 'PROOFI_LOCKED',
  PROOFI_UNCLAIMED: 'PROOFI_UNCLAIMED',
  USER_REJECTED: 'USER_REJECTED',
  WRONG_ORIGIN: 'WRONG_ORIGIN',
  KEY_MISMATCH: 'KEY_MISMATCH',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
};

function proofiError(code, message) {
  return { ok: false, error: message, code };
}

function getCubbyId(address, vaultRecord) {
  if (vaultRecord?.vaultId) return `proofi-cubby:${vaultRecord.vaultId}`;
  return address ? `proofi-cubby:${address}` : null;
}

function getSenderOrigin(message, sender) {
  const raw = message?.origin || sender?.origin || sender?.url;
  try {
    return raw ? new URL(raw).origin : '';
  } catch {
    return '';
  }
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && url.port === '3000') {
      return true;
    }
    if (url.hostname === 'proofi.ai' || url.hostname.endsWith('.proofi.ai')) return true;
    if (url.hostname === 'proofi-virid.vercel.app') return true;
  } catch {
    return false;
  }
  return false;
}

function isValidBytesHex(bytesHex) {
  return typeof bytesHex === 'string' && /^0x([0-9a-fA-F]{2})*$/.test(bytesHex);
}

function buildWalletState(result) {
  const connected = !!result[KEYS.CONNECTED] && !!result[KEYS.ADDRESS];
  const vaultRecord = result.proofi_vault_record || null;
  const vaultIdentity = result.proofi_vault_identity || null;
  const claimed = !!vaultRecord?.vaultId;
  const unlocked = !!result[KEYS.UNLOCKED];
  const status = !connected
    ? 'not_connected'
    : !unlocked
      ? 'locked'
      : !claimed
        ? 'unclaimed'
        : 'ready';

  return {
    connected,
    unlocked,
    claimed,
    address: result[KEYS.ADDRESS] || null,
    publicKeyHex: vaultIdentity?.publicKey || null,
    email: result[KEYS.EMAIL] || null,
    name: result[KEYS.NAME] || result[KEYS.EMAIL] || null,
    vaultId: vaultRecord?.vaultId || null,
    cubbyId: getCubbyId(result[KEYS.ADDRESS], vaultRecord),
    network: NETWORK_ENV,
    env: 'devnet',
    status,
  };
}

function getWalletStateResponse(sendResponse) {
  chrome.storage.local.get(
    [...Object.values(KEYS), 'proofi_vault_record', 'proofi_vault_identity'],
    (result) => sendResponse(buildWalletState(result)),
  );
}

function openExtensionPopup(view, sendResponse = () => {}) {
  chrome.storage.local.set({ proofi_popup_view: view || null }, () => {
    const now = Date.now();
    if (now - lastPopupOpenAt < 1000) {
      flashBadge();
      sendResponse({ ok: true, method: 'toolbar', throttled: true });
      return;
    }

    lastPopupOpenAt = now;
    flashBadge();
    sendResponse({ ok: true, method: 'toolbar' });
  });
}

function handleSignRawBytes(message, sender, sendResponse) {
  const origin = getSenderOrigin(message, sender);
  if (!isAllowedOrigin(origin)) {
    sendResponse(proofiError(ERROR_CODES.WRONG_ORIGIN, `Origin is not allowed: ${origin || 'unknown'}`));
    return true;
  }

  const requestId = String(message.requestId || '');
  const bytesHex = message.bytesHex;
  const purpose = message.purpose || 'vault-sdk';
  if (!requestId || !isValidBytesHex(bytesHex)) {
    sendResponse(proofiError(ERROR_CODES.INVALID_PAYLOAD, 'SIGN_RAW_BYTES requires requestId and 0x-prefixed raw bytes hex'));
    return true;
  }

  chrome.storage.local.get(
    [...Object.values(KEYS), 'proofi_vault_record', 'proofi_vault_identity', 'proofi_pending_sign'],
    (result) => {
      const wallet = buildWalletState(result);
      if (!wallet.connected) {
        sendResponse(proofiError(ERROR_CODES.PROOFI_LOCKED, 'Proofi wallet is not connected'));
        return;
      }
      if (!wallet.claimed) {
        sendResponse(proofiError(ERROR_CODES.PROOFI_UNCLAIMED, 'Claim a devnet vault/cubby before signing'));
        return;
      }
      if (!wallet.publicKeyHex) {
        sendResponse(proofiError(ERROR_CODES.KEY_MISMATCH, 'Proofi public key is not available yet. Unlock once and refresh.'));
        return;
      }
      const existing = result.proofi_pending_sign;
      if (existing?.requestId && existing.requestId !== requestId) {
        sendResponse(proofiError(ERROR_CODES.INVALID_PAYLOAD, 'Another Proofi signature request is already pending'));
        return;
      }
      if (existing?.requestId === requestId) {
        openExtensionPopup('sign-approve', () => {});
        sendResponse({ ok: true, pending: true, requestId, method: 'toolbar' });
        return;
      }

      const pending = {
        requestId,
        bytesHex,
        purpose,
        origin,
        address: wallet.address,
        publicKeyHex: wallet.publicKeyHex,
        vaultId: wallet.vaultId,
        cubbyId: wallet.cubbyId,
        requestedAt: Date.now(),
      };

      chrome.storage.local.set({ proofi_pending_sign: pending }, () => {
        openExtensionPopup('sign-approve', () => {});
        sendResponse({ ok: true, pending: true, requestId, method: 'toolbar' });
      });
    },
  );
  return true;
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
    getWalletStateResponse(sendResponse);
    return true;
  }

  if (message.type === 'SIGN_RAW_BYTES') {
    return handleSignRawBytes(message, sender, sendResponse);
  }

  if (message.type === 'SIGN_RAW_BYTES_RESULT' || message.type === 'SIGN_RAW_BYTES_REJECTED') {
    const requestId = String(message.requestId || '');
    const response = message.type === 'SIGN_RAW_BYTES_REJECTED'
      ? proofiError(message.code || ERROR_CODES.USER_REJECTED, message.error || 'User rejected signing')
      : { ...message.response };
    chrome.storage.local.set({
      proofi_sign_result: {
        requestId,
        response,
        at: Date.now(),
      },
    }, () => {
      chrome.storage.local.remove('proofi_pending_sign');
      sendResponse({ ok: true });
    });
    return true;
  }

  // Open the extension popup dropdown (not a new window)
  if (message.type === 'OPEN_LOGIN_POPUP' || message.type === 'OPEN_SIGN_POPUP') {
    openExtensionPopup(null, sendResponse);
    return true;
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

  // Health data upload to DDC
  if (message.type === 'HEALTH_DATA_TO_DDC') {
    const { encryptedData, cid } = message.payload || message;
    
    // Get auth token from storage
    chrome.storage.local.get([KEYS.TOKEN, KEYS.ADDRESS], async (result) => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': result[KEYS.TOKEN] ? `Bearer ${result[KEYS.TOKEN]}` : undefined,
      };
      
      try {
        const response = await fetch(`${API_URL}/ddc/memo`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: 'encrypted-health-data',
            content: encryptedData,
            metadata: {
              predictedCid: cid,
              encryptionAlgorithm: encryptedData.algorithm || 'AES-256-GCM',
              uploadedAt: new Date().toISOString()
            }
          }),
        });
        
        if (!response.ok) {
          const errData = await response.json();
          sendResponse({ error: errData.error || `Upload failed: ${response.status}` });
          return;
        }
        
        const data = await response.json();
        sendResponse({
          ok: true,
          cid: data.cid || cid,
          bucket: data.bucket || '1229',
          cdnUrl: data.cdnUrl
        });
      } catch (err) {
        sendResponse({ error: err.message });
      }
    });
    return true;
  }

  // Agent connect request from external page
  if (message.type === 'AGENT_CONNECT') {
    const { agentId, name, scopes, dataTypes, origin } = message.payload || message;
    
    // Store pending request
    chrome.storage.local.set({
      proofi_pending_agent: {
        agentId: agentId || `agent-${Date.now()}`,
        name: name || 'Unknown Agent',
        scopes: scopes || dataTypes || [],
        origin: origin || sender.origin || sender.url,
        requestedAt: Date.now()
      }
    }, () => {
      openExtensionPopup('agent-approve', () => {});
      sendResponse({ ok: true, pending: true });
    });
    return true;
  }

  // Approve agent (from popup)
  if (message.type === 'APPROVE_AGENT') {
    const { agentId, name, scopes, expiresIn } = message.payload || message;
    
    const session = {
      agentId,
      name,
      scopes: scopes || [],
      createdAt: Date.now(),
      expiresAt: Date.now() + (expiresIn || 86400000),
      active: true
    };
    
    chrome.storage.local.get({ proofi_agents: [], [KEYS.ADDRESS]: null, proofi_vault_record: null }, (result) => {
      const agents = result.proofi_agents.filter(a => a.agentId !== agentId);
      agents.push({ ...session, cubbyId: getCubbyId(result[KEYS.ADDRESS], result.proofi_vault_record) });
      chrome.storage.local.set({ proofi_agents: agents, proofi_pending_agent: null }, () => {
        sendResponse({ ok: true, session });
      });
    });
    return true;
  }

  // Revoke agent
  if (message.type === 'REVOKE_AGENT') {
    const { agentId } = message.payload || message;
    
    chrome.storage.local.get({ proofi_agents: [] }, (result) => {
      const agents = result.proofi_agents.filter(a => a.agentId !== agentId);
      chrome.storage.local.set({ proofi_agents: agents }, () => {
        sendResponse({ ok: true, remaining: agents.length });
      });
    });
    return true;
  }

  // Get connected agents
  if (message.type === 'GET_AGENTS') {
    chrome.storage.local.get({ proofi_agents: [] }, (result) => {
      const agents = result.proofi_agents.map(a => ({
        ...a,
        active: a.active && a.expiresAt > Date.now()
      }));
      sendResponse({ agents });
    });
    return true;
  }

  // Agent auth request - validate and return access info
  if (message.type === 'AGENT_AUTH_REQUEST') {
    const { agentId } = message.payload || message;
    
    chrome.storage.local.get({ proofi_agents: [], proofi_health_cid: null, proofi_health_bucket: null }, (result) => {
      const agent = result.proofi_agents.find(a => 
        a.agentId === agentId && a.active && a.expiresAt > Date.now()
      );
      
      if (!agent) {
        sendResponse({ error: 'No active session for this agent', code: 'NO_SESSION' });
        return;
      }
      
      chrome.storage.local.get([KEYS.ADDRESS, KEYS.TOKEN, 'proofi_health_dek', 'proofi_vault_record'], (walletResult) => {
        if (!walletResult[KEYS.ADDRESS]) {
          sendResponse({ error: 'Wallet not connected', code: 'NO_WALLET' });
          return;
        }
        
        sendResponse({
          ok: true,
          address: walletResult[KEYS.ADDRESS],
          cubbyId: getCubbyId(walletResult[KEYS.ADDRESS], walletResult.proofi_vault_record),
          vaultId: walletResult.proofi_vault_record?.vaultId,
          scopes: agent.scopes,
          expiresAt: agent.expiresAt,
          healthDataCID: result.proofi_health_cid,
          bucketId: result.proofi_health_bucket || '1229'
        });
      });
    });
    return true;
  }

  // Get health data access (for approved agents)
  if (message.type === 'GET_HEALTH_DATA_ACCESS') {
    const { agentId } = message.payload || message;
    
    chrome.storage.local.get({ 
      proofi_agents: [], 
      proofi_health_cid: null, 
      proofi_health_bucket: null,
      proofi_health_dek: null,
      [KEYS.ADDRESS]: null,
      proofi_vault_record: null
    }, (result) => {
      const agent = result.proofi_agents.find(a => 
        a.agentId === agentId && a.active && a.expiresAt > Date.now()
      );
      
      if (!agent) {
        sendResponse({ error: 'Access denied', code: 'NO_SESSION' });
        return;
      }
      
      if (!result.proofi_health_cid) {
        sendResponse({ error: 'No health data available', code: 'NO_DATA' });
        return;
      }
      
      sendResponse({
        ok: true,
        cubbyId: agent.cubbyId || getCubbyId(result[KEYS.ADDRESS], result.proofi_vault_record),
        vaultId: result.proofi_vault_record?.vaultId,
        cid: result.proofi_health_cid,
        bucket: result.proofi_health_bucket || '1229',
        scopes: agent.scopes,
        cdnUrl: `https://cdn.ddc-dragon.com/${result.proofi_health_bucket || '1229'}/${result.proofi_health_cid}`,
        // Note: DEK is wrapped - agent needs its private key to unwrap
        wrappedDEK: result.proofi_health_dek // This should be wrapped for the specific agent
      });
    });
    return true;
  }
});

// --- External message listener (web pages → extension) ---
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  const allowedTypes = [
    'AGENT_CONNECT',
    'AGENT_AUTH_REQUEST',
    'GET_HEALTH_DATA_ACCESS',
    'GET_WALLET_STATE',
    'SIGN_RAW_BYTES',
  ];
  
  if (!allowedTypes.includes(message.type)) {
    sendResponse(proofiError(ERROR_CODES.INVALID_PAYLOAD, 'Unknown message type'));
    return;
  }

  if (!isAllowedOrigin(getSenderOrigin(message, sender))) {
    sendResponse(proofiError(ERROR_CODES.WRONG_ORIGIN, 'Origin is not allowed'));
    return;
  }

  if (message.type === 'SIGN_RAW_BYTES') {
    return handleSignRawBytes(message, sender, sendResponse);
  }
  
  // Add sender info
  message.origin = sender.origin || sender.url;
  
  // Forward to internal handler
  chrome.runtime.sendMessage(message, sendResponse);
  return true; // Keep channel open for async response
});
