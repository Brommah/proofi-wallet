/**
 * Proofi API Client
 * All requests are proxied through the background service worker to avoid CORS.
 */

const API_URL = 'https://proofi-api-production.up.railway.app';

/**
 * Make an API request via the background service worker.
 */
async function apiRequest(path, options = {}, authHeaders = null) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'API_REQUEST',
      path,
      method: options.method || 'GET',
      body: options.body ? JSON.parse(options.body) : undefined,
      authHeaders: authHeaders || {},
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response) {
        reject(new Error('No response from background worker'));
        return;
      }
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(response.data);
    });
  });
}

// ── Auth Flow ──────────────────────────────────────────────────────────────

export async function sendOtp(email) {
  return apiRequest('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyOtp(email, code) {
  return apiRequest('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function registerAddress(address, token) {
  return apiRequest('/auth/register-address', {
    method: 'POST',
    body: JSON.stringify({ address }),
  }, {
    'Authorization': `Bearer ${token}`,
  });
}

// ── DDC Operations ─────────────────────────────────────────────────────────

export async function getDdcStatus() {
  return apiRequest('/ddc/status');
}

export async function storeMemo(memo, authHeaders) {
  return apiRequest('/ddc/memo', {
    method: 'POST',
    body: JSON.stringify({ memo }),
  }, authHeaders);
}

export async function storeCredential(claimType, claimData, authHeaders) {
  return apiRequest('/ddc/credential', {
    method: 'POST',
    body: JSON.stringify({ claimType, claimData }),
  }, authHeaders);
}

export async function listItems(authHeaders) {
  return apiRequest('/ddc/list', {
    method: 'GET',
  }, authHeaders);
}

// ── Game Achievements ──────────────────────────────────────────────────────

export async function storeAchievement(data, authHeaders) {
  return apiRequest('/game/achievement', {
    method: 'POST',
    body: JSON.stringify(data),
  }, authHeaders);
}

export async function getAchievements(address) {
  return apiRequest(`/game/achievements/${address}`);
}

export { API_URL };
