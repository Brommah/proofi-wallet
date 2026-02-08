/**
 * Proofi Shared Crypto Utilities
 * 
 * Used by both the extension (token generation) and agent SDK (token consumption).
 * Based on Web Crypto API + tweetnacl for X25519.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;
const DEK_LENGTH = 32; // 256 bits

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert Uint8Array to hex string
 */
function toHex(bytes) {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Convert hex string to Uint8Array
 */
function fromHex(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

/**
 * Convert Uint8Array to base64
 */
function toBase64(bytes) {
    return btoa(String.fromCharCode(...bytes));
}

/**
 * Convert base64 to Uint8Array
 */
function fromBase64(base64) {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

/**
 * Generate random bytes
 */
function randomBytes(length) {
    return crypto.getRandomValues(new Uint8Array(length));
}

// ============================================================================
// KEY DERIVATION
// ============================================================================

/**
 * Derive a key from password using PBKDF2
 * 
 * @param {string} password - The password/PIN
 * @param {Uint8Array} salt - Salt bytes
 * @param {number} iterations - PBKDF2 iterations (default: 100000)
 * @returns {Promise<Uint8Array>} - 32-byte derived key
 */
async function deriveKeyFromPassword(password, salt, iterations = PBKDF2_ITERATIONS) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: iterations,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );
    
    return new Uint8Array(derivedBits);
}

/**
 * Derive a resource-specific DEK from master key + path
 * 
 * @param {Uint8Array} masterKey - User's master encryption key
 * @param {string} resourcePath - Resource path (e.g., "health/metrics")
 * @returns {Promise<Uint8Array>} - 32-byte DEK for this resource
 */
async function deriveResourceDEK(masterKey, resourcePath) {
    const encoder = new TextEncoder();
    const pathBytes = encoder.encode(resourcePath);
    
    // Combine master key and path
    const combined = new Uint8Array(masterKey.length + pathBytes.length);
    combined.set(masterKey);
    combined.set(pathBytes, masterKey.length);
    
    // Hash to get DEK
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    return new Uint8Array(hashBuffer);
}

// ============================================================================
// AES-256-GCM ENCRYPTION
// ============================================================================

/**
 * Encrypt data with AES-256-GCM
 * 
 * @param {Uint8Array} plaintext - Data to encrypt
 * @param {Uint8Array} key - 32-byte encryption key
 * @returns {Promise<{ciphertext: Uint8Array, iv: Uint8Array}>}
 */
async function encryptAES(plaintext, key) {
    const iv = randomBytes(12); // 96-bit IV for GCM
    
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );
    
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        plaintext
    );
    
    return {
        ciphertext: new Uint8Array(ciphertext),
        iv: iv
    };
}

/**
 * Decrypt data with AES-256-GCM
 * 
 * @param {Uint8Array} ciphertext - Data to decrypt
 * @param {Uint8Array} key - 32-byte encryption key
 * @param {Uint8Array} iv - 12-byte IV
 * @returns {Promise<Uint8Array>}
 */
async function decryptAES(ciphertext, key, iv) {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );
    
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        ciphertext
    );
    
    return new Uint8Array(plaintext);
}

/**
 * Encrypt and encode to storable format
 * 
 * @param {string|object} data - Data to encrypt (will be JSON stringified if object)
 * @param {Uint8Array} key - 32-byte encryption key
 * @returns {Promise<string>} - Base64 encoded: iv + ciphertext
 */
async function encryptToString(data, key) {
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(
        typeof data === 'string' ? data : JSON.stringify(data)
    );
    
    const { ciphertext, iv } = await encryptAES(plaintext, key);
    
    // Combine IV + ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.length);
    combined.set(iv);
    combined.set(ciphertext, iv.length);
    
    return toBase64(combined);
}

/**
 * Decrypt from storable format
 * 
 * @param {string} encrypted - Base64 encoded: iv + ciphertext
 * @param {Uint8Array} key - 32-byte encryption key
 * @param {boolean} parseJson - Whether to parse result as JSON
 * @returns {Promise<string|object>}
 */
async function decryptFromString(encrypted, key, parseJson = true) {
    const combined = fromBase64(encrypted);
    
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const plaintext = await decryptAES(ciphertext, key, iv);
    const decoder = new TextDecoder();
    const text = decoder.decode(plaintext);
    
    return parseJson ? JSON.parse(text) : text;
}

// ============================================================================
// X25519 KEY EXCHANGE (for wrapping DEKs)
// ============================================================================

/**
 * Note: X25519 requires tweetnacl or libsodium.
 * This is a placeholder - actual implementation needs nacl.box
 */

/**
 * Wrap a DEK for a recipient using their public key
 * Uses X25519 + XSalsa20-Poly1305 (nacl.box)
 * 
 * @param {Uint8Array} dek - The DEK to wrap
 * @param {Uint8Array} recipientPublicKey - Recipient's X25519 public key
 * @param {Uint8Array} senderSecretKey - Sender's X25519 secret key
 * @returns {Promise<string>} - Base64 encoded wrapped DEK
 */
async function wrapDEK(dek, recipientPublicKey, senderSecretKey) {
    // Requires nacl.box from tweetnacl
    // const nonce = nacl.randomBytes(nacl.box.nonceLength);
    // const encrypted = nacl.box(dek, nonce, recipientPublicKey, senderSecretKey);
    // return toBase64(new Uint8Array([...nonce, ...encrypted]));
    
    // Placeholder - will be implemented with tweetnacl
    throw new Error('wrapDEK requires tweetnacl - load it first');
}

/**
 * Unwrap a DEK using recipient's secret key
 * 
 * @param {string} wrappedDEK - Base64 encoded wrapped DEK
 * @param {Uint8Array} senderPublicKey - Sender's X25519 public key
 * @param {Uint8Array} recipientSecretKey - Recipient's X25519 secret key
 * @returns {Promise<Uint8Array>} - The unwrapped DEK
 */
async function unwrapDEK(wrappedDEK, senderPublicKey, recipientSecretKey) {
    // Requires nacl.box.open from tweetnacl
    // const combined = fromBase64(wrappedDEK);
    // const nonce = combined.slice(0, nacl.box.nonceLength);
    // const encrypted = combined.slice(nacl.box.nonceLength);
    // const dek = nacl.box.open(encrypted, nonce, senderPublicKey, recipientSecretKey);
    // if (!dek) throw new Error('Failed to unwrap DEK');
    // return dek;
    
    // Placeholder - will be implemented with tweetnacl
    throw new Error('unwrapDEK requires tweetnacl - load it first');
}

// ============================================================================
// CAPABILITY TOKEN
// ============================================================================

/**
 * Capability Token structure
 * @typedef {Object} CapabilityToken
 * @property {string} issuer - User's wallet address
 * @property {string} grantee - Agent's public key (hex)
 * @property {string[]} scope - Allowed resource paths
 * @property {('read'|'write'|'append')[]} permissions - Allowed operations
 * @property {number} expiry - Unix timestamp
 * @property {string} wrappedDEK - Base64 wrapped DEK
 * @property {string} signature - Hex signature
 */

/**
 * Create a capability token
 * 
 * @param {Object} params
 * @param {string} params.issuerAddress - User's wallet address
 * @param {Uint8Array} params.issuerSecretKey - User's signing key
 * @param {Uint8Array} params.issuerEncryptionKey - User's X25519 secret key
 * @param {string} params.granteePublicKey - Agent's X25519 public key (hex)
 * @param {string[]} params.scope - Resource paths to grant access to
 * @param {string[]} params.permissions - Permissions to grant
 * @param {number} params.durationSeconds - How long token is valid
 * @param {Uint8Array} params.masterKey - User's master encryption key (for DEK derivation)
 * @returns {Promise<CapabilityToken>}
 */
async function createCapabilityToken(params) {
    const {
        issuerAddress,
        issuerSecretKey,
        issuerEncryptionKey,
        granteePublicKey,
        scope,
        permissions,
        durationSeconds,
        masterKey
    } = params;
    
    const expiry = Math.floor(Date.now() / 1000) + durationSeconds;
    
    // Derive DEKs for each scope and combine
    // For simplicity, we derive one DEK from the first scope
    // In production, might need multi-DEK handling
    const primaryScope = scope[0].replace('/*', '');
    const dek = await deriveResourceDEK(masterKey, primaryScope);
    
    // Wrap DEK for grantee
    const granteeKey = fromHex(granteePublicKey);
    const wrappedDEK = await wrapDEK(dek, granteeKey, issuerEncryptionKey);
    
    // Create token payload (without signature)
    const payload = {
        issuer: issuerAddress,
        grantee: granteePublicKey,
        scope,
        permissions,
        expiry,
        wrappedDEK
    };
    
    // Sign the payload
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    // signature = sr25519.sign(payloadBytes, issuerSecretKey)
    // Placeholder - requires polkadot-js or similar
    const signature = 'SIGNATURE_PLACEHOLDER';
    
    return {
        ...payload,
        signature
    };
}

/**
 * Validate a capability token
 * 
 * @param {CapabilityToken} token
 * @returns {{valid: boolean, error?: string}}
 */
function validateToken(token) {
    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (token.expiry < now) {
        return { valid: false, error: 'Token expired' };
    }
    
    // Check required fields
    if (!token.issuer || !token.grantee || !token.scope || !token.wrappedDEK) {
        return { valid: false, error: 'Missing required fields' };
    }
    
    // TODO: Verify signature
    // const payloadWithoutSig = { ...token };
    // delete payloadWithoutSig.signature;
    // if (!sr25519.verify(signature, payload, issuerPublicKey)) {
    //     return { valid: false, error: 'Invalid signature' };
    // }
    
    return { valid: true };
}

/**
 * Check if a resource path matches a scope pattern
 * 
 * @param {string} path - Resource path (e.g., "health/metrics/2024-01")
 * @param {string[]} scope - Allowed scope patterns (e.g., ["health/*"])
 * @returns {boolean}
 */
function matchesScope(path, scope) {
    for (const pattern of scope) {
        if (pattern === path) return true;
        if (pattern.endsWith('/*')) {
            const prefix = pattern.slice(0, -2);
            if (path.startsWith(prefix)) return true;
        }
    }
    return false;
}

// ============================================================================
// EXPORTS
// ============================================================================

// For browser/extension use
if (typeof window !== 'undefined') {
    window.ProofiCrypto = {
        // Utils
        toHex,
        fromHex,
        toBase64,
        fromBase64,
        randomBytes,
        
        // Key derivation
        deriveKeyFromPassword,
        deriveResourceDEK,
        
        // AES encryption
        encryptAES,
        decryptAES,
        encryptToString,
        decryptFromString,
        
        // X25519 (requires tweetnacl)
        wrapDEK,
        unwrapDEK,
        
        // Tokens
        createCapabilityToken,
        validateToken,
        matchesScope,
        
        // Constants
        PBKDF2_ITERATIONS,
        DEK_LENGTH
    };
}

// For Node.js/bundler use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toHex,
        fromHex,
        toBase64,
        fromBase64,
        randomBytes,
        deriveKeyFromPassword,
        deriveResourceDEK,
        encryptAES,
        decryptAES,
        encryptToString,
        decryptFromString,
        wrapDEK,
        unwrapDEK,
        createCapabilityToken,
        validateToken,
        matchesScope,
        PBKDF2_ITERATIONS,
        DEK_LENGTH
    };
}
