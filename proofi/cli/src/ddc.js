/**
 * DDC (Decentralized Data Cloud) Integration for Proofi CLI
 * 
 * Handles uploading/downloading encrypted health data to/from Cere DDC.
 */

import { DdcClient, File as DdcFile, UriSigner, TESTNET, MAINNET } from '@cere-ddc-sdk/ddc-client';
import { Keyring } from '@polkadot/keyring';
import crypto from 'crypto';
import naclUtil from 'tweetnacl-util';
import fs from 'fs';
import path from 'path';

// DDC Configuration
const DDC_CONFIG = {
  testnet: {
    blockchain: TESTNET.blockchain || 'wss://rpc.testnet.cere.network/ws',
    clusterAddress: TESTNET.clusterId,
  },
  mainnet: {
    blockchain: MAINNET.blockchain || 'wss://rpc.mainnet.cere.network/ws',
    clusterAddress: MAINNET.clusterId,
  }
};

// Default to testnet
const NETWORK = process.env.DDC_NETWORK || 'testnet';
const CONFIG = DDC_CONFIG[NETWORK];

// Cache directory for offline fallback
const CACHE_DIR = path.join(process.env.HOME, '.proofi', 'cache');

/**
 * Create a signer from wallet keys
 */
function createSigner(keys) {
  if (!keys || !keys.mnemonic) {
    throw new Error('Wallet mnemonic required for DDC client');
  }
  
  // Use UriSigner with the mnemonic phrase
  // Format: //Alice or a mnemonic phrase
  const signer = new UriSigner(keys.mnemonic);
  return signer;
}

/**
 * Create a DDC client using the wallet keys
 */
export async function createDdcClient(keys) {
  if (!keys) {
    throw new Error('Wallet keys required for DDC client');
  }

  try {
    const signer = createSigner(keys);
    
    const client = await DdcClient.create(signer, {
      blockchain: CONFIG.blockchain,
    });
    
    return client;
  } catch (error) {
    // If we can't connect to blockchain, return null (caller handles fallback)
    if (process.env.DEBUG) {
      console.error('DDC client creation failed:', error.message);
    }
    return null;
  }
}

/**
 * Get or create a bucket for the user
 */
export async function getOrCreateBucket(client) {
  const bucketIdFromEnv = process.env.DDC_BUCKET_ID;
  
  if (bucketIdFromEnv) {
    return BigInt(bucketIdFromEnv);
  }

  // Try to create a new bucket
  // Note: This requires the wallet to have CERE tokens for gas
  try {
    const clusterId = CONFIG.clusterAddress;
    const bucketId = await client.createBucket(clusterId, {
      isPublic: false, // Private bucket for health data
    });
    
    return bucketId;
  } catch (error) {
    throw new Error(`Failed to create DDC bucket: ${error.message}. Set DDC_BUCKET_ID env var or fund wallet.`);
  }
}

/**
 * Upload encrypted data to DDC
 * 
 * @param {Object} encryptedData - { ciphertext, iv } from AES encryption
 * @param {Object} keys - User's wallet keys (must have mnemonic)
 * @param {Object} options - { bucketId?, did? }
 * @returns {Object} - { cid, bucketId, uri, network }
 */
export async function uploadToDdc(encryptedData, keys, options = {}) {
  // Prepare the data as a buffer
  const dataBuffer = Buffer.from(JSON.stringify(encryptedData));
  
  // Try to create DDC client
  const client = await createDdcClient(keys);
  
  if (!client) {
    throw new Error('DDC_UNAVAILABLE');
  }

  try {
    // Get bucket ID
    const bucketId = options.bucketId 
      ? BigInt(options.bucketId) 
      : await getOrCreateBucket(client);

    // Create DDC file object
    const file = new DdcFile(dataBuffer, {
      contentType: 'application/json',
    });

    // Store to DDC
    const uri = await client.store(bucketId, file);
    
    // Extract CID from URI
    const cid = uri.cid;

    await client.disconnect();

    return {
      cid,
      bucketId: bucketId.toString(),
      uri: uri.toString(),
      network: NETWORK,
      storedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (client) {
      try { await client.disconnect(); } catch {}
    }
    throw error;
  }
}

/**
 * Download encrypted data from DDC
 * 
 * @param {string} cid - Content ID
 * @param {string} bucketId - Bucket ID
 * @param {Object} keys - User's wallet keys
 * @returns {Object} - The encrypted data object { ciphertext, iv }
 */
export async function downloadFromDdc(cid, bucketId, keys) {
  const client = await createDdcClient(keys);
  
  if (!client) {
    throw new Error('DDC_UNAVAILABLE');
  }

  try {
    // Read from DDC using the URI
    const uri = `ddc://${bucketId}/${cid}`;
    const fileResponse = await client.read(uri);
    
    // Get the data as buffer
    const chunks = [];
    for await (const chunk of fileResponse.body) {
      chunks.push(chunk);
    }
    const data = Buffer.concat(chunks);
    
    await client.disconnect();
    
    // Parse as JSON
    const encryptedData = JSON.parse(data.toString());
    return encryptedData;
  } catch (error) {
    if (client) {
      try { await client.disconnect(); } catch {}
    }
    throw error;
  }
}

/**
 * Check if DDC is available
 */
export async function checkDdcAvailability(keys) {
  try {
    const client = await createDdcClient(keys);
    if (client) {
      await client.disconnect();
      return { available: true, network: NETWORK };
    }
    return { available: false, reason: 'Client creation failed' };
  } catch (error) {
    return { available: false, reason: error.message };
  }
}

/**
 * Store to local cache (fallback for offline mode)
 */
export function storeToLocalCache(cid, encryptedData) {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  
  const cacheFile = path.join(CACHE_DIR, `${cid}.json`);
  fs.writeFileSync(cacheFile, JSON.stringify(encryptedData, null, 2));
  
  return cacheFile;
}

/**
 * Load from local cache
 */
export function loadFromLocalCache(cid) {
  const cacheFile = path.join(CACHE_DIR, `${cid}.json`);
  
  if (!fs.existsSync(cacheFile)) {
    return null;
  }
  
  return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
}

/**
 * Check if data exists in local cache
 */
export function existsInLocalCache(cid) {
  const cacheFile = path.join(CACHE_DIR, `${cid}.json`);
  return fs.existsSync(cacheFile);
}

/**
 * Compute a CID for data (for local fallback mode)
 */
export function computeLocalCid(data) {
  const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest();
  
  // CIDv1 format with base32 encoding (simplified)
  const prefix = Buffer.from([0x01, 0x55, 0x12, 0x20]); // version, codec, hash-type, hash-length
  const cidBytes = Buffer.concat([prefix, hash]);
  
  // Simple base32-like encoding
  return 'bafk' + hash.toString('base64url').slice(0, 44).replace(/=/g, '');
}

export default {
  uploadToDdc,
  downloadFromDdc,
  checkDdcAvailability,
  storeToLocalCache,
  loadFromLocalCache,
  existsInLocalCache,
  computeLocalCid,
  createDdcClient,
};
