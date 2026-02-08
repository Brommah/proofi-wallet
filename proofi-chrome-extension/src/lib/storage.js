/**
 * Proofi Storage Module
 * Wraps chrome.storage.local for wallet state persistence.
 */

const KEYS = {
  ENCRYPTED_SEED: 'proofi_encrypted_seed',
  ADDRESS: 'proofi_address',
  EMAIL: 'proofi_email',
  TOKEN: 'proofi_token',
  CONNECTED: 'proofi_connected',
};

/**
 * Get a value from chrome.storage.local.
 */
export async function get(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key] ?? null);
    });
  });
}

/**
 * Set a value in chrome.storage.local.
 */
export async function set(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

/**
 * Remove a key from chrome.storage.local.
 */
export async function remove(key) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, resolve);
  });
}

// ── Convenience methods ────────────────────────────────────────────────────

export async function getWalletState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(Object.values(KEYS), (result) => {
      resolve({
        encryptedSeed: result[KEYS.ENCRYPTED_SEED] || null,
        address: result[KEYS.ADDRESS] || null,
        email: result[KEYS.EMAIL] || null,
        token: result[KEYS.TOKEN] || null,
        connected: result[KEYS.CONNECTED] || false,
      });
    });
  });
}

export async function saveWalletState({ encryptedSeed, address, email, token }) {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      [KEYS.ENCRYPTED_SEED]: encryptedSeed,
      [KEYS.ADDRESS]: address,
      [KEYS.EMAIL]: email,
      [KEYS.TOKEN]: token,
      [KEYS.CONNECTED]: true,
    }, resolve);
  });
}

export async function clearWalletState() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(Object.values(KEYS), resolve);
  });
}

export { KEYS };
