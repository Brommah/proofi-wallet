/**
 * CERE Network transfer utilities for React Native.
 * Uses @polkadot/api with HttpProvider (no WebSocket needed).
 */
import { ApiPromise, HttpProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady, decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { CERE_DECIMALS, CERE_SS58_PREFIX } from '../constants/api';

/**
 * Normalize an address: decode (ignoring checksum for legacy addresses)
 * then re-encode with proper SS58 checksum.
 */
function normalizeAddress(address: string): string {
  const pubkey = decodeAddress(address, true); // ignoreChecksum
  return encodeAddress(pubkey, CERE_SS58_PREFIX);
}

const RPC_ENDPOINTS = [
  'https://archive.mainnet.cere.network',
  'https://rpc.mainnet.cere.network',
];

let apiInstance: ApiPromise | null = null;
let apiConnecting = false;

/**
 * Get or create an ApiPromise connected via HTTP.
 */
async function getApi(): Promise<ApiPromise> {
  if (apiInstance?.isConnected) return apiInstance;

  if (apiConnecting) {
    // Wait for existing connection attempt
    let waited = 0;
    while (apiConnecting && waited < 15000) {
      await new Promise((r) => setTimeout(r, 200));
      waited += 200;
    }
    if (apiInstance?.isConnected) return apiInstance;
  }

  apiConnecting = true;
  try {
    for (const endpoint of RPC_ENDPOINTS) {
      try {
        console.log('[cere] Connecting to:', endpoint);
        const provider = new HttpProvider(endpoint);
        const api = await ApiPromise.create({ provider, noInitWarn: true });
        console.log('[cere] Connected via:', endpoint);
        apiInstance = api;
        return api;
      } catch (e) {
        console.warn('[cere] Failed:', endpoint, e);
      }
    }
    throw new Error('All CERE RPC endpoints failed');
  } finally {
    apiConnecting = false;
  }
}

/**
 * Parse a human-readable amount string to planck (smallest unit).
 * e.g. "15" → 150000000000n (15 * 10^10)
 */
export function parseAmount(amount: string): bigint {
  const parts = amount.replace(/[^0-9.]/g, '').split('.');
  const whole = BigInt(parts[0] || '0');
  let frac = 0n;
  if (parts[1]) {
    const fracStr = parts[1].slice(0, CERE_DECIMALS).padEnd(CERE_DECIMALS, '0');
    frac = BigInt(fracStr);
  }
  return whole * BigInt(10 ** CERE_DECIMALS) + frac;
}

/**
 * Format planck to human-readable CERE amount.
 */
export function formatBalance(planck: bigint): string {
  const divisor = BigInt(10 ** CERE_DECIMALS);
  const whole = planck / divisor;
  const frac = planck % divisor;
  if (frac === 0n) return `${whole.toLocaleString()} CERE`;
  const fracStr = frac.toString().padStart(CERE_DECIMALS, '0').slice(0, 4).replace(/0+$/, '');
  return fracStr ? `${whole.toLocaleString()}.${fracStr} CERE` : `${whole.toLocaleString()} CERE`;
}

/**
 * Validate a CERE address.
 */
export function isValidAddress(address: string): boolean {
  try {
    // Accept addresses even with invalid checksums (legacy wallets)
    const pubkey = decodeAddress(address, true);
    return pubkey.length === 32;
  } catch {
    return false;
  }
}

/**
 * Estimate transfer fee.
 */
export async function estimateFee(
  senderAddress: string,
  recipient: string,
  amountPlanck: bigint,
): Promise<string> {
  const api = await getApi();
  const normalizedRecipient = normalizeAddress(recipient);
  const tx = api.tx.balances.transferKeepAlive(normalizedRecipient, amountPlanck);
  const info = await tx.paymentInfo(senderAddress);
  const fee = BigInt(info.partialFee.toString());
  return formatBalance(fee);
}

/**
 * Transfer CERE tokens.
 * Returns the transaction hash.
 */
export async function transfer(
  seedHex: string,
  recipient: string,
  amountPlanck: bigint,
  onStatus?: (status: string) => void,
): Promise<{ hash: string; blockHash?: string }> {
  await cryptoWaitReady();
  
  onStatus?.('Connecting to network...');
  const api = await getApi();
  
  onStatus?.('Preparing keypair...');
  const keyring = new Keyring({ type: 'sr25519', ss58Format: CERE_SS58_PREFIX });
  const pair = keyring.addFromUri(seedHex);

  onStatus?.('Building transaction...');
  const normalizedRecipient = normalizeAddress(recipient);
  const tx = api.tx.balances.transferKeepAlive(normalizedRecipient, amountPlanck);

  onStatus?.('Signing & submitting...');
  
  // For HTTP provider, we can't subscribe to events
  // Use signAndSend with nonce auto-detection
  const hash = await tx.signAndSend(pair);
  const txHash = hash.toHex();
  
  onStatus?.('Submitted!');
  console.log('[cere] Transfer submitted:', txHash);
  
  return { hash: txHash };
}
