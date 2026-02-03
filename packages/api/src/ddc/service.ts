/**
 * DDC Storage Service — powered by existing Cere wallet (JSON file)
 * 
 * Uses the funded cere-wallet.json as signer/payer for all DDC operations.
 * The Proofi user's email/wallet is stored as metadata in the credential.
 * 
 * This mirrors the ddc-wallet-ui/server-v3.mjs architecture:
 * - Server wallet pays for storage
 * - User identity is embedded in the credential
 */

import { DdcClient, MAINNET, TESTNET, JsonSigner, File as DdcFile, Tag, FileUri } from '@cere-ddc-sdk/ddc-client';
import { Keyring } from '@polkadot/keyring';
import { signatureVerify, cryptoWaitReady } from '@polkadot/util-crypto';
import { u8aToHex, stringToU8a, hexToU8a } from '@polkadot/util';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { env } from '../config/env.js';

// Config — find wallet JSON from env var (base64) or filesystem
function loadWalletJson(): any {
  // Option 1: CERE_WALLET_JSON env var (base64-encoded JSON)
  const walletEnv = process.env.CERE_WALLET_JSON;
  if (walletEnv) {
    try {
      const decoded = Buffer.from(walletEnv, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (e) {
      console.error('❌ Failed to decode CERE_WALLET_JSON env var');
      throw new Error('Invalid CERE_WALLET_JSON env var (expected base64-encoded JSON)');
    }
  }

  // Option 2: Read from filesystem
  const secretsDir = findSecretsDir();
  const walletPath = resolve(secretsDir, 'cere-wallet.json');
  try {
    return JSON.parse(readFileSync(walletPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Failed to read cere-wallet.json from ${walletPath}`);
    throw new Error('DDC wallet not found. Set CERE_WALLET_JSON env var or place cere-wallet.json in .secrets/');
  }
}

function findSecretsDir(): string {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = resolve(dir, '.secrets');
    try {
      readFileSync(resolve(candidate, 'cere-wallet.json'));
      return candidate;
    } catch { /* keep looking */ }
    dir = resolve(dir, '..');
  }
  return process.env.PROOFI_SECRETS_DIR || resolve(process.env.HOME || '', 'clawd/.secrets');
}

const WALLET_PASSPHRASE = process.env.CERE_WALLET_PASSPHRASE || 'roezel';
const BUCKET_ID = 1229n;
const USE_MAINNET = true; // server-v3 uses mainnet

let ddcClient: DdcClient;
let issuerPair: any;
let ISSUER_ADDRESS: string;
let initialized = false;

/**
 * Initialize DDC client with the funded Cere wallet.
 * Only called once on first use.
 */
export async function initDdc(): Promise<void> {
  if (initialized) return;

  await cryptoWaitReady();

  const walletJson = loadWalletJson();

  console.log('⏳ Initializing DDC client...');
  const signer = new JsonSigner(walletJson, { passphrase: WALLET_PASSPHRASE });
  ddcClient = await DdcClient.create(signer, USE_MAINNET ? MAINNET : TESTNET);

  // Init keyring for signing
  const keyring = new Keyring({ type: 'sr25519' });
  issuerPair = keyring.addFromJson(walletJson);
  issuerPair.decodePkcs8(WALLET_PASSPHRASE);
  ISSUER_ADDRESS = walletJson.address;

  console.log('✅ DDC connected');
  console.log(`📦 Bucket: ${BUCKET_ID}`);
  console.log(`🔑 Payer wallet: ${ISSUER_ADDRESS}`);

  initialized = true;
}

// ── Low-level DDC ops ──

export async function ddcStore(content: string, tags: { key: string; value: string }[] = []): Promise<string> {
  await initDdc();
  const ddcTags = tags.map(t => new Tag(t.key, t.value));
  const file = new DdcFile(Buffer.from(content), { tags: ddcTags });
  const result = await ddcClient.store(BUCKET_ID, file);
  return result.cid.toString();
}

export async function ddcRead(cid: string): Promise<string> {
  await initDdc();
  const fileUri = new FileUri(BUCKET_ID, cid);
  const fileResponse = await ddcClient.read(fileUri);
  const chunks: Buffer[] = [];
  for await (const chunk of (fileResponse as any).body) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf-8');
}

// ── Credential operations ──

export interface StoreCredentialResult {
  cid: string;
  credential: any;
  cdnUrl: string;
}

/**
 * Store a memo/credential on DDC.
 * The server wallet pays, the user's Proofi identity is embedded.
 */
export async function storeCredential(
  userEmail: string,
  userWalletAddress: string,
  claimType: string,
  claimData: any,
): Promise<StoreCredentialResult> {
  await initDdc();

  const credential = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", claimType],
    issuer: { id: `did:cere:${ISSUER_ADDRESS}`, address: ISSUER_ADDRESS },
    credentialSubject: {
      id: `did:proofi:${userEmail}`,
      address: userWalletAddress,
      email: userEmail,
      claim: claimData,
    },
    issuanceDate: new Date().toISOString(),
    proof: {
      type: "Sr25519Signature2024",
      created: new Date().toISOString(),
      verificationMethod: `did:cere:${ISSUER_ADDRESS}#key-1`,
      proofPurpose: "assertionMethod",
      signatureValue: '', // filled below
    },
  };

  // Sign with server wallet
  const payloadToSign = JSON.stringify({
    "@context": credential["@context"],
    type: credential.type,
    issuer: credential.issuer,
    credentialSubject: credential.credentialSubject,
    issuanceDate: credential.issuanceDate,
  });
  const sig = issuerPair.sign(stringToU8a(payloadToSign));
  credential.proof.signatureValue = u8aToHex(sig);

  // Store on DDC
  const credentialJson = JSON.stringify(credential, null, 2);
  const cid = await ddcStore(credentialJson, [
    { key: 'type', value: 'verifiable-credential' },
    { key: 'credential-type', value: claimType },
    { key: 'subject', value: userWalletAddress },
    { key: 'email', value: userEmail },
    { key: 'issuer', value: ISSUER_ADDRESS },
  ]);

  const cdnUrl = `https://cdn.ddc-dragon.com/${BUCKET_ID}/${cid}`;

  // Add to decentralized index (no database!)
  await addToWalletIndex(userWalletAddress, {
    cid,
    cdnUrl,
    type: 'credential',
    credentialType: claimType,
  });

  return {
    cid,
    credential,
    cdnUrl,
  };
}

/**
 * Read and verify a credential from DDC.
 */
export async function readCredential(cid: string): Promise<{ credential: any; verified: boolean }> {
  const content = await ddcRead(cid);
  const credential = JSON.parse(content);

  let verified = false;
  if (credential.proof?.signatureValue && credential.issuer?.address) {
    const payloadToVerify = JSON.stringify({
      "@context": credential["@context"],
      type: credential.type,
      issuer: credential.issuer,
      credentialSubject: credential.credentialSubject,
      issuanceDate: credential.issuanceDate,
    });
    const result = signatureVerify(
      stringToU8a(payloadToVerify),
      hexToU8a(credential.proof.signatureValue),
      credential.issuer.address,
    );
    verified = result.isValid;
  }

  return { credential, verified };
}

/**
 * Store a simple memo on DDC (not a credential, just text).
 * Also adds to the wallet's decentralized index.
 */
export async function storeMemo(
  userEmail: string,
  walletAddress: string,
  memo: string,
): Promise<{ cid: string; cdnUrl: string }> {
  const content = JSON.stringify({
    type: 'memo',
    author: userEmail,
    wallet: walletAddress,
    content: memo,
    createdAt: new Date().toISOString(),
  });

  const cid = await ddcStore(content, [
    { key: 'type', value: 'memo' },
    { key: 'author', value: userEmail },
    { key: 'wallet', value: walletAddress },
  ]);

  const cdnUrl = `https://cdn.ddc-dragon.com/${BUCKET_ID}/${cid}`;

  // Add to decentralized index (no database!)
  await addToWalletIndex(walletAddress, {
    cid,
    cdnUrl,
    type: 'memo',
  });

  return { cid, cdnUrl };
}

export function getIssuerAddress(): string {
  return ISSUER_ADDRESS;
}

export function getBucketId(): string {
  return BUCKET_ID.toString();
}

// ── Decentralized Index (no database!) ──

/**
 * Get the CNS name for a wallet's index.
 */
function getIndexName(walletAddress: string): string {
  return `proofi-index-${walletAddress}`;
}

export interface IndexEntry {
  cid: string;
  cdnUrl: string;
  type: 'memo' | 'credential';
  credentialType?: string;
  createdAt: string;
}

export interface WalletIndex {
  version: 1;
  wallet: string;
  entries: IndexEntry[];
  updatedAt: string;
}

/**
 * Read a wallet's index from DDC.
 * Returns empty index if not found.
 */
export async function readWalletIndex(walletAddress: string): Promise<WalletIndex> {
  await initDdc();
  const indexName = getIndexName(walletAddress);
  console.log(`📋 [readWalletIndex] Looking for index: ${indexName}`);
  
  try {
    // Try to resolve CNS name to CID
    console.log(`📋 [readWalletIndex] Resolving CNS name...`);
    const cid = await ddcClient.resolveName(BUCKET_ID, indexName);
    console.log(`📋 [readWalletIndex] CNS resolved to CID: ${cid}`);
    
    if (!cid) {
      console.log(`📋 [readWalletIndex] No CID found, returning empty index`);
      return createEmptyIndex(walletAddress);
    }
    
    // Read the index content
    console.log(`📋 [readWalletIndex] Reading index content from DDC...`);
    const content = await ddcRead(cid.toString());
    const index = JSON.parse(content) as WalletIndex;
    console.log(`📋 [readWalletIndex] Index loaded: ${index.entries.length} entries`);
    return index;
  } catch (e: any) {
    // Index doesn't exist yet
    console.log(`📋 [readWalletIndex] Error (probably not found): ${e.message}`);
    return createEmptyIndex(walletAddress);
  }
}

function createEmptyIndex(walletAddress: string): WalletIndex {
  return {
    version: 1,
    wallet: walletAddress,
    entries: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Add an entry to a wallet's index on DDC.
 * This is fully decentralized - no database!
 */
export async function addToWalletIndex(
  walletAddress: string,
  entry: Omit<IndexEntry, 'createdAt'>,
): Promise<void> {
  await initDdc();
  
  const indexName = getIndexName(walletAddress);
  console.log(`📋 [addToWalletIndex] Adding to index: ${indexName}`);
  
  // Read current index
  const index = await readWalletIndex(walletAddress);
  console.log(`📋 [addToWalletIndex] Current index has ${index.entries.length} entries`);
  
  // Add new entry
  index.entries.unshift({
    ...entry,
    createdAt: new Date().toISOString(),
  });
  index.updatedAt = new Date().toISOString();
  
  // Store updated index with CNS name (this updates the name pointer!)
  const indexContent = JSON.stringify(index, null, 2);
  
  const ddcTags = [
    new Tag('type', 'proofi-index'),
    new Tag('wallet', walletAddress),
    new Tag('version', '1'),
  ];
  const file = new DdcFile(Buffer.from(indexContent), { tags: ddcTags });
  
  // Store with name option - this creates/updates the CNS record
  console.log(`📋 [addToWalletIndex] Storing index with CNS name: ${indexName}`);
  const result = await ddcClient.store(BUCKET_ID, file, { name: indexName } as any);
  console.log(`📋 [addToWalletIndex] Stored! CID: ${result.cid}, ${index.entries.length} entries total`);
}
