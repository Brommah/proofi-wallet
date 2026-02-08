/**
 * Proofi Crypto Module
 * Handles seed encryption/decryption and PBKDF2 key derivation.
 * Uses only Web Crypto API — no external dependencies.
 */

const ENCRYPT_SALT = 'proofi-encrypt';
const ENCRYPT_ITERATIONS = 50000;
const DERIVE_ITERATIONS = 100000;

/**
 * Derive a 32-byte hex seed from PIN + derivation salt using PBKDF2.
 * Matches the web wallet's deriveSeedFromPin exactly.
 */
export async function deriveSeedFromPin(pin, salt) {
  const encoder = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: encoder.encode(salt),
      iterations: DERIVE_ITERATIONS,
    },
    keyMaterial,
    256,
  );

  const bytes = new Uint8Array(derivedBits);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt seed with PIN using AES-GCM.
 * Returns base64 string of iv:ciphertext.
 */
export async function encryptSeed(seed, pin) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: encoder.encode(ENCRYPT_SALT),
      iterations: ENCRYPT_ITERATIONS,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(seed),
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt seed with PIN using AES-GCM.
 * Returns the hex seed string.
 */
export async function decryptSeed(encrypted, pin) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: encoder.encode(ENCRYPT_SALT),
      iterations: ENCRYPT_ITERATIONS,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  return decoder.decode(plaintext);
}
