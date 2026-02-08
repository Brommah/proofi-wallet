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
  if (message.type === 'OPEN_LOGIN_POPUP' || message.type === 'OPEN_SIGN_POPUP') {
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
      // Open popup for approval
      chrome.windows.create({
        url: chrome.runtime.getURL('popup.html?view=agent-approve'),
        type: 'popup',
        width: 400,
        height: 600,
        focused: true,
      });
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
    
    chrome.storage.local.get({ proofi_agents: [] }, (result) => {
      const agents = result.proofi_agents.filter(a => a.agentId !== agentId);
      agents.push(session);
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
      
      chrome.storage.local.get([KEYS.ADDRESS, KEYS.TOKEN, 'proofi_health_dek'], (walletResult) => {
        if (!walletResult[KEYS.ADDRESS]) {
          sendResponse({ error: 'Wallet not connected', code: 'NO_WALLET' });
          return;
        }
        
        sendResponse({
          ok: true,
          address: walletResult[KEYS.ADDRESS],
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
      proofi_health_dek: null
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
    'GET_WALLET_STATE'
  ];
  
  if (!allowedTypes.includes(message.type)) {
    sendResponse({ error: 'Unknown message type', code: 'INVALID_TYPE' });
    return;
  }
  
  // Add sender info
  message.origin = sender.origin || sender.url;
  
  // Forward to internal handler
  chrome.runtime.sendMessage(message, sendResponse);
  return true; // Keep channel open for async response
});
