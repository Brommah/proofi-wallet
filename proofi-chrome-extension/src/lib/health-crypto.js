/**
 * Health Data Crypto Module
 * Handles encryption/decryption of health data for DDC storage.
 * Uses AES-256-GCM for data encryption and X25519 for key wrapping.
 */

// Generate a random Data Encryption Key (DEK) - 256 bits
export function generateDEK() {
  return crypto.getRandomValues(new Uint8Array(32));
}

// Generate random bytes
export function randomBytes(n) {
  return crypto.getRandomValues(new Uint8Array(n));
}

// Encrypt data with AES-256-GCM
export async function encryptAES(plaintext, key) {
  const iv = randomBytes(12); // 96-bit IV for GCM
  const encodedText = typeof plaintext === 'string' 
    ? new TextEncoder().encode(plaintext) 
    : plaintext;
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    cryptoKey,
    encodedText
  );
  
  return {
    ciphertext: uint8ToBase64(new Uint8Array(ciphertext)),
    iv: uint8ToBase64(iv),
    algorithm: 'AES-256-GCM'
  };
}

// Decrypt data with AES-256-GCM
export async function decryptAES(ciphertextB64, ivB64, key) {
  const ciphertext = base64ToUint8(ciphertextB64);
  const iv = base64ToUint8(ivB64);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    cryptoKey,
    ciphertext
  );
  
  return new TextDecoder().decode(plaintext);
}

// Wrap DEK using X25519 ECDH + HKDF + AES-KW
// For browser compatibility, we use a simpler approach with WebCrypto
export async function wrapDEKWithPublicKey(dek, recipientPublicKeyB64) {
  // Generate ephemeral keypair for ECDH
  const ephemeralKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  
  // Import recipient's public key (assuming P-256 for browser compat)
  // Note: In production, use X25519 via a library like tweetnacl
  const recipientPublicKey = await crypto.subtle.importKey(
    'raw',
    base64ToUint8(recipientPublicKeyB64),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  
  // Derive shared secret
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: recipientPublicKey },
    ephemeralKeyPair.privateKey,
    256
  );
  
  // Use shared secret to wrap the DEK with AES-GCM
  const wrappingKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(sharedBits),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = randomBytes(12);
  const wrappedDEK = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    wrappingKey,
    dek
  );
  
  // Export ephemeral public key
  const ephemeralPublicKeyRaw = await crypto.subtle.exportKey(
    'raw',
    ephemeralKeyPair.publicKey
  );
  
  return {
    wrappedDEK: uint8ToBase64(new Uint8Array(wrappedDEK)),
    ephemeralPublicKey: uint8ToBase64(new Uint8Array(ephemeralPublicKeyRaw)),
    iv: uint8ToBase64(iv),
    algorithm: 'ECDH-P256-AES-GCM'
  };
}

// Simple DEK wrapping using just AES-GCM with a derived key
// This is simpler and more compatible
export async function wrapDEKSimple(dek, secretKey) {
  const iv = randomBytes(12);
  
  const wrappingKey = await crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const wrapped = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    wrappingKey,
    dek
  );
  
  return {
    ciphertext: uint8ToBase64(new Uint8Array(wrapped)),
    iv: uint8ToBase64(iv)
  };
}

// Unwrap DEK
export async function unwrapDEKSimple(wrappedDEK, secretKey) {
  const ciphertext = base64ToUint8(wrappedDEK.ciphertext);
  const iv = base64ToUint8(wrappedDEK.iv);
  
  const wrappingKey = await crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const unwrapped = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    wrappingKey,
    ciphertext
  );
  
  return new Uint8Array(unwrapped);
}

// Generate a capability token for agent access
export async function generateCapabilityToken({
  issuerAddress,
  issuerDID,
  agentId,
  agentName,
  scopes,
  bucketId,
  dataCid,
  dek,
  expiresInSeconds = 86400,
  signingFunction
}) {
  const tokenId = uint8ToBase64(randomBytes(16));
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSeconds;
  
  // Create token payload
  const payload = {
    v: 1,
    id: tokenId,
    iss: issuerDID || issuerAddress,
    sub: agentId,
    agentName,
    iat: now,
    exp,
    scopes,
    bucketId: bucketId.toString(),
    resources: [dataCid]
  };
  
  // If we have a DEK and can wrap it
  if (dek) {
    // For now, include DEK hash as proof (actual wrapping needs agent's public key)
    const dekHash = await sha256(dek);
    payload.dekHash = uint8ToBase64(dekHash);
  }
  
  // Sign the token if signing function provided
  if (signingFunction) {
    const payloadString = JSON.stringify(payload);
    const signature = await signingFunction(payloadString);
    return {
      ...payload,
      sig: signature,
      sigAlg: 'Ed25519'
    };
  }
  
  return payload;
}

// SHA-256 hash
export async function sha256(data) {
  const buffer = typeof data === 'string' 
    ? new TextEncoder().encode(data) 
    : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return new Uint8Array(hashBuffer);
}

// Base64 utilities
export function uint8ToBase64(uint8Array) {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

export function base64ToUint8(base64) {
  const binary = atob(base64);
  const uint8 = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    uint8[i] = binary.charCodeAt(i);
  }
  return uint8;
}

// Generate a content ID (CID-like hash)
export async function generateCID(data) {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const hash = await sha256(jsonStr);
  
  // Create a base32-like string (simplified CID format)
  const base32Chars = 'abcdefghijklmnopqrstuvwxyz234567';
  let result = '';
  
  let bits = 0;
  let value = 0;
  for (let i = 0; i < hash.length && result.length < 54; i++) {
    value = (value << 8) | hash[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += base32Chars[(value >> bits) & 31];
    }
  }
  if (bits > 0) {
    result += base32Chars[(value << (5 - bits)) & 31];
  }
  
  return 'bafyb' + result.slice(0, 54);
}
