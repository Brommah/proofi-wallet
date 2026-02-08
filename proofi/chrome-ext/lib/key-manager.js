/**
 * Proofi Key Manager
 * 
 * Manages the user's cryptographic keys for the Proofi extension:
 * - Master key generation/storage
 * - Signing key pair (Ed25519/sr25519)
 * - Encryption key pair (X25519)
 * - DEK derivation for resources
 * 
 * Keys are stored encrypted in chrome.storage.local
 */

const KeyManager = (() => {
  // ── Constants ────────────────────────────────────────────────────

  const STORAGE_KEY = 'proofi_keys';
  const MASTER_KEY_LENGTH = 32; // 256 bits

  // ── State ────────────────────────────────────────────────────────

  let cachedKeys = null;

  // ── Key Storage Structure ────────────────────────────────────────
  // {
  //   masterKey: string (hex),
  //   signingKeyPair: { publicKeyHex, privateKeyBase64 },
  //   encryptionKeyPair: { publicKeyHex, privateKeyBase64 },
  //   createdAt: number,
  //   version: number
  // }

  // ── Initialize Keys ──────────────────────────────────────────────

  async function initialize(forceRegenerate = false) {
    if (!forceRegenerate) {
      const existing = await loadKeys();
      if (existing) {
        cachedKeys = existing;
        return cachedKeys;
      }
    }

    // Generate new key set
    console.log('[KeyManager] Generating new key set...');

    // Generate master key
    const masterKeyBytes = CryptoUtils.randomBytes(MASTER_KEY_LENGTH);
    const masterKey = CryptoUtils.bytesToHex(masterKeyBytes);

    // Generate signing key pair (Ed25519)
    const signingKeyPair = await CryptoUtils.generateSigningKeyPair();

    // Generate encryption key pair (X25519)
    const encryptionKeyPair = await CryptoUtils.generateX25519KeyPair();

    cachedKeys = {
      masterKey,
      signingKeyPair: {
        publicKeyHex: signingKeyPair.publicKeyHex,
        privateKeyBase64: signingKeyPair.privateKeyBase64,
      },
      encryptionKeyPair: {
        publicKeyHex: encryptionKeyPair.publicKeyHex,
        privateKeyBase64: encryptionKeyPair.privateKeyBase64,
      },
      createdAt: Date.now(),
      version: 1,
    };

    await saveKeys(cachedKeys);
    console.log('[KeyManager] New key set created');

    return cachedKeys;
  }

  // ── Load Keys from Storage ───────────────────────────────────────

  async function loadKeys() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      if (result[STORAGE_KEY]) {
        cachedKeys = result[STORAGE_KEY];
        return cachedKeys;
      }
    } catch (e) {
      console.error('[KeyManager] Failed to load keys:', e);
    }
    return null;
  }

  // ── Save Keys to Storage ─────────────────────────────────────────

  async function saveKeys(keys) {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: keys });
    } catch (e) {
      console.error('[KeyManager] Failed to save keys:', e);
      throw e;
    }
  }

  // ── Get Keys (with lazy init) ────────────────────────────────────

  async function getKeys() {
    if (cachedKeys) return cachedKeys;
    
    const loaded = await loadKeys();
    if (loaded) return loaded;
    
    return await initialize();
  }

  // ── Get Public Keys Only ─────────────────────────────────────────

  async function getPublicKeys() {
    const keys = await getKeys();
    return {
      signingPublicKey: keys.signingKeyPair.publicKeyHex,
      encryptionPublicKey: keys.encryptionKeyPair.publicKeyHex,
    };
  }

  // ── Derive DEK for Resource ──────────────────────────────────────

  async function deriveDEKForResource(resourcePath) {
    const keys = await getKeys();
    return await CryptoUtils.deriveDEK(keys.masterKey, resourcePath);
  }

  // ── Sign Message ─────────────────────────────────────────────────

  async function signMessage(message) {
    const keys = await getKeys();
    const privateKey = await CryptoUtils.importSigningPrivateKey(
      keys.signingKeyPair.privateKeyBase64
    );
    return await CryptoUtils.sign(message, privateKey);
  }

  // ── Wrap DEK for Grantee ─────────────────────────────────────────

  async function wrapDEKForGrantee(dekHex, granteePublicKeyHex) {
    return await CryptoUtils.wrapDEK(dekHex, granteePublicKeyHex);
  }

  // ── Unwrap DEK (when receiving as grantee) ───────────────────────

  async function unwrapDEK(wrappedDEK) {
    const keys = await getKeys();
    return await CryptoUtils.unwrapDEK(
      wrappedDEK,
      keys.encryptionKeyPair.privateKeyBase64
    );
  }

  // ── Regenerate Master Key ────────────────────────────────────────
  // Used during token revocation to invalidate old DEKs

  async function regenerateMasterKey() {
    const keys = await getKeys();
    const newMasterKeyBytes = CryptoUtils.randomBytes(MASTER_KEY_LENGTH);
    
    keys.masterKey = CryptoUtils.bytesToHex(newMasterKeyBytes);
    keys.version = (keys.version || 1) + 1;
    
    cachedKeys = keys;
    await saveKeys(keys);
    
    console.log('[KeyManager] Master key regenerated, version:', keys.version);
    return keys.version;
  }

  // ── Export Keys for Backup ───────────────────────────────────────

  async function exportKeys(includePrivate = false) {
    const keys = await getKeys();
    
    if (includePrivate) {
      // Full export (for user backup)
      const exportData = {
        masterKey: keys.masterKey,
        signingKeyPair: keys.signingKeyPair,
        encryptionKeyPair: keys.encryptionKeyPair,
        createdAt: keys.createdAt,
        version: keys.version,
        exportedAt: Date.now(),
      };
      return CryptoUtils.arrayBufferToBase64(
        new TextEncoder().encode(JSON.stringify(exportData))
      );
    }
    
    // Public keys only
    return {
      signingPublicKey: keys.signingKeyPair.publicKeyHex,
      encryptionPublicKey: keys.encryptionKeyPair.publicKeyHex,
    };
  }

  // ── Import Keys from Backup ──────────────────────────────────────

  async function importKeys(backupBase64) {
    try {
      const backupBytes = CryptoUtils.base64ToArrayBuffer(backupBase64);
      const backupData = JSON.parse(new TextDecoder().decode(new Uint8Array(backupBytes)));
      
      // Validate structure
      if (!backupData.masterKey || !backupData.signingKeyPair || !backupData.encryptionKeyPair) {
        throw new Error('Invalid backup format');
      }
      
      cachedKeys = {
        masterKey: backupData.masterKey,
        signingKeyPair: backupData.signingKeyPair,
        encryptionKeyPair: backupData.encryptionKeyPair,
        createdAt: backupData.createdAt || Date.now(),
        version: backupData.version || 1,
        importedAt: Date.now(),
      };
      
      await saveKeys(cachedKeys);
      console.log('[KeyManager] Keys imported successfully');
      
      return true;
    } catch (e) {
      console.error('[KeyManager] Failed to import keys:', e);
      throw e;
    }
  }

  // ── Clear Keys ───────────────────────────────────────────────────

  async function clearKeys() {
    cachedKeys = null;
    await chrome.storage.local.remove(STORAGE_KEY);
    console.log('[KeyManager] Keys cleared');
  }

  // ── Check if Keys Exist ──────────────────────────────────────────

  async function hasKeys() {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return !!result[STORAGE_KEY];
  }

  // ── Get Wallet Address (derived from signing public key) ─────────

  async function getWalletAddress() {
    const keys = await getKeys();
    // Use first 40 chars of signing public key as address
    // In production, this would use proper SS58 encoding
    return '0x' + keys.signingKeyPair.publicKeyHex.slice(0, 40);
  }

  // ── Public API ───────────────────────────────────────────────────

  return {
    initialize,
    getKeys,
    getPublicKeys,
    getWalletAddress,
    deriveDEKForResource,
    signMessage,
    wrapDEKForGrantee,
    unwrapDEK,
    regenerateMasterKey,
    exportKeys,
    importKeys,
    clearKeys,
    hasKeys,
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeyManager;
}
