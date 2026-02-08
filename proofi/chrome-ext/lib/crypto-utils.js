/**
 * Proofi Crypto Utilities
 * 
 * Provides cryptographic primitives for the Capability Token Engine:
 * - X25519 key exchange (for wrapping DEKs)
 * - Ed25519 signing (sr25519-compatible on Curve25519)
 * - AES-GCM encryption for DEK wrapping
 * - Key derivation (HKDF-based)
 */

const CryptoUtils = (() => {
  // ── Constants ────────────────────────────────────────────────────

  const ALGORITHM_AES = 'AES-GCM';
  const AES_KEY_LENGTH = 256;
  const IV_LENGTH = 12;
  const SALT_LENGTH = 16;

  // ── Base64 Utilities ─────────────────────────────────────────────

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  function bytesToHex(bytes) {
    return Array.from(new Uint8Array(bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  // ── Random Bytes ─────────────────────────────────────────────────

  function randomBytes(length) {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  // ── Key Derivation (HKDF) ────────────────────────────────────────

  async function deriveKey(masterKey, info, salt = null) {
    // Import master key if it's raw bytes
    const keyMaterial = typeof masterKey === 'string'
      ? await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(masterKey),
          { name: 'HKDF' },
          false,
          ['deriveBits', 'deriveKey']
        )
      : masterKey;

    // Generate salt if not provided
    const useSalt = salt || randomBytes(SALT_LENGTH);

    // Derive a new key using HKDF
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: useSalt,
        info: new TextEncoder().encode(info),
      },
      keyMaterial,
      { name: ALGORITHM_AES, length: AES_KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );

    return { key: derivedKey, salt: useSalt };
  }

  // ── DEK Derivation from Master Key + Resource Path ───────────────

  async function deriveDEK(masterKeyHex, resourcePath) {
    // Create deterministic info string from resource path
    const info = `proofi:dek:${resourcePath}`;
    
    // Use resource path hash as deterministic salt for consistent DEKs
    const pathHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(resourcePath)
    );
    const salt = new Uint8Array(pathHash).slice(0, SALT_LENGTH);

    const masterKeyBytes = hexToBytes(masterKeyHex);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      masterKeyBytes,
      { name: 'HKDF' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const dek = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: salt,
        info: new TextEncoder().encode(info),
      },
      keyMaterial,
      { name: ALGORITHM_AES, length: AES_KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );

    // Export DEK as raw bytes for wrapping
    const dekRaw = await crypto.subtle.exportKey('raw', dek);
    return {
      key: dek,
      raw: new Uint8Array(dekRaw),
      hex: bytesToHex(dekRaw),
    };
  }

  // ── X25519 Key Pair Generation ───────────────────────────────────

  async function generateX25519KeyPair() {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'X25519' },
      true,
      ['deriveBits']
    );

    const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKeyRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      publicKeyHex: bytesToHex(publicKeyRaw),
      privateKeyBase64: arrayBufferToBase64(privateKeyRaw),
    };
  }

  // ── X25519 Key Import ────────────────────────────────────────────

  async function importX25519PublicKey(publicKeyHex) {
    const publicKeyBytes = hexToBytes(publicKeyHex);
    return await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      { name: 'X25519' },
      true,
      []
    );
  }

  async function importX25519PrivateKey(privateKeyBase64) {
    const privateKeyBytes = base64ToArrayBuffer(privateKeyBase64);
    return await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBytes,
      { name: 'X25519' },
      true,
      ['deriveBits']
    );
  }

  // ── X25519 Key Exchange (ECDH) ───────────────────────────────────

  async function deriveSharedSecret(privateKey, publicKey) {
    const sharedSecret = await crypto.subtle.deriveBits(
      { name: 'X25519', public: publicKey },
      privateKey,
      256
    );
    return new Uint8Array(sharedSecret);
  }

  // ── Wrap DEK with X25519 (ECIES-style) ───────────────────────────

  async function wrapDEK(dekHex, granteePublicKeyHex) {
    // Generate ephemeral key pair for this wrapping operation
    const ephemeral = await generateX25519KeyPair();
    
    // Import grantee's public key
    const granteePublicKey = await importX25519PublicKey(granteePublicKeyHex);
    
    // Derive shared secret
    const sharedSecret = await deriveSharedSecret(ephemeral.privateKey, granteePublicKey);
    
    // Derive wrapping key from shared secret
    const wrappingKeyMaterial = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );
    
    const wrappingKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(16), // Zero salt for determinism
        info: new TextEncoder().encode('proofi:dek-wrap'),
      },
      wrappingKeyMaterial,
      { name: ALGORITHM_AES, length: AES_KEY_LENGTH },
      false,
      ['encrypt']
    );
    
    // Encrypt DEK with wrapping key
    const dekBytes = hexToBytes(dekHex);
    const iv = randomBytes(IV_LENGTH);
    
    const encryptedDEK = await crypto.subtle.encrypt(
      { name: ALGORITHM_AES, iv },
      wrappingKey,
      dekBytes
    );
    
    // Return ephemeral public key + IV + encrypted DEK
    const result = {
      ephemeralPublicKey: ephemeral.publicKeyHex,
      iv: bytesToHex(iv),
      encryptedDEK: bytesToHex(new Uint8Array(encryptedDEK)),
    };
    
    // Encode as single base64 string for transport
    const combined = JSON.stringify(result);
    return arrayBufferToBase64(new TextEncoder().encode(combined));
  }

  // ── Unwrap DEK with X25519 ───────────────────────────────────────

  async function unwrapDEK(wrappedDEK, granteePrivateKeyBase64) {
    // Decode wrapped DEK
    const combinedBytes = new Uint8Array(base64ToArrayBuffer(wrappedDEK));
    const combined = JSON.parse(new TextDecoder().decode(combinedBytes));
    
    const { ephemeralPublicKey, iv, encryptedDEK } = combined;
    
    // Import keys
    const ephemeralPubKey = await importX25519PublicKey(ephemeralPublicKey);
    const granteePrivateKey = await importX25519PrivateKey(granteePrivateKeyBase64);
    
    // Derive shared secret
    const sharedSecret = await deriveSharedSecret(granteePrivateKey, ephemeralPubKey);
    
    // Derive unwrapping key
    const unwrappingKeyMaterial = await crypto.subtle.importKey(
      'raw',
      sharedSecret,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );
    
    const unwrappingKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(16),
        info: new TextEncoder().encode('proofi:dek-wrap'),
      },
      unwrappingKeyMaterial,
      { name: ALGORITHM_AES, length: AES_KEY_LENGTH },
      false,
      ['decrypt']
    );
    
    // Decrypt DEK
    const dekBytes = await crypto.subtle.decrypt(
      { name: ALGORITHM_AES, iv: hexToBytes(iv) },
      unwrappingKey,
      hexToBytes(encryptedDEK)
    );
    
    return bytesToHex(new Uint8Array(dekBytes));
  }

  // ── Ed25519 Signing (sr25519-compatible on Curve25519) ───────────

  async function generateSigningKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    );

    const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKeyRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      publicKeyHex: bytesToHex(publicKeyRaw),
      privateKeyBase64: arrayBufferToBase64(privateKeyRaw),
    };
  }

  async function importSigningPrivateKey(privateKeyBase64) {
    const privateKeyBytes = base64ToArrayBuffer(privateKeyBase64);
    return await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBytes,
      { name: 'Ed25519' },
      false,
      ['sign']
    );
  }

  async function importSigningPublicKey(publicKeyHex) {
    const publicKeyBytes = hexToBytes(publicKeyHex);
    return await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      { name: 'Ed25519' },
      true,
      ['verify']
    );
  }

  async function sign(message, privateKey) {
    const messageBytes = typeof message === 'string'
      ? new TextEncoder().encode(message)
      : message;
    
    const signature = await crypto.subtle.sign(
      { name: 'Ed25519' },
      privateKey,
      messageBytes
    );
    
    return bytesToHex(new Uint8Array(signature));
  }

  async function verify(message, signatureHex, publicKey) {
    const messageBytes = typeof message === 'string'
      ? new TextEncoder().encode(message)
      : message;
    
    const signatureBytes = hexToBytes(signatureHex);
    
    return await crypto.subtle.verify(
      { name: 'Ed25519' },
      publicKey,
      signatureBytes,
      messageBytes
    );
  }

  // ── AES-GCM Encryption ───────────────────────────────────────────

  async function encrypt(plaintext, keyHex) {
    const keyBytes = hexToBytes(keyHex);
    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: ALGORITHM_AES },
      false,
      ['encrypt']
    );
    
    const iv = randomBytes(IV_LENGTH);
    const plaintextBytes = typeof plaintext === 'string'
      ? new TextEncoder().encode(plaintext)
      : plaintext;
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM_AES, iv },
      key,
      plaintextBytes
    );
    
    // Prepend IV to ciphertext
    const result = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(ciphertext), IV_LENGTH);
    
    return arrayBufferToBase64(result.buffer);
  }

  async function decrypt(ciphertextBase64, keyHex) {
    const keyBytes = hexToBytes(keyHex);
    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: ALGORITHM_AES },
      false,
      ['decrypt']
    );
    
    const ciphertextBytes = new Uint8Array(base64ToArrayBuffer(ciphertextBase64));
    const iv = ciphertextBytes.slice(0, IV_LENGTH);
    const ciphertext = ciphertextBytes.slice(IV_LENGTH);
    
    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM_AES, iv },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(plaintext);
  }

  // ── Hash Utilities ───────────────────────────────────────────────

  async function sha256(data) {
    const dataBytes = typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data;
    const hash = await crypto.subtle.digest('SHA-256', dataBytes);
    return bytesToHex(new Uint8Array(hash));
  }

  // ── Public API ───────────────────────────────────────────────────

  return {
    // Utilities
    randomBytes,
    arrayBufferToBase64,
    base64ToArrayBuffer,
    bytesToHex,
    hexToBytes,
    sha256,
    
    // Key derivation
    deriveKey,
    deriveDEK,
    
    // X25519 (key exchange)
    generateX25519KeyPair,
    importX25519PublicKey,
    importX25519PrivateKey,
    deriveSharedSecret,
    wrapDEK,
    unwrapDEK,
    
    // Ed25519 (signing)
    generateSigningKeyPair,
    importSigningPrivateKey,
    importSigningPublicKey,
    sign,
    verify,
    
    // AES-GCM
    encrypt,
    decrypt,
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CryptoUtils;
}
