/**
 * CERE Network Token Functions
 * Mainnet RPC: wss://rpc.mainnet.cere.network/ws
 * Archive RPC: wss://archive.mainnet.cere.network/ws
 */

import { ApiPromise, WsProvider, HttpProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { formatBalance } from '@polkadot/util';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

// Multiple RPC endpoints for failover
const CERE_WSS_ENDPOINTS = [
  'wss://rpc.mainnet.cere.network/ws',      // Primary
  'wss://archive.mainnet.cere.network/ws',  // Archive (slower but complete history)
];

// HTTP fallbacks (more reliable when WSS times out)
const CERE_HTTP_ENDPOINTS = [
  'https://rpc.mainnet.cere.network',
  'https://archive.mainnet.cere.network',
];

const CERE_DECIMALS = 10;
const CERE_SYMBOL = 'CERE';

let api: ApiPromise | null = null;
let connecting = false;
let usingHttp = false;

/**
 * Get or create API connection to Cere mainnet (WSS first, HTTP fallback)
 */
export async function getApi(): Promise<ApiPromise> {
  if (api && api.isConnected) return api;
  
  if (connecting) {
    let waited = 0;
    while (connecting && waited < 20000) {
      await new Promise(r => setTimeout(r, 100));
      waited += 100;
    }
    if (api && api.isConnected) return api;
  }

  connecting = true;
  
  // Try WSS first (supports subscriptions)
  for (const endpoint of CERE_WSS_ENDPOINTS) {
    try {
      console.log('[CERE] Trying WSS:', endpoint);
      const provider = new WsProvider(endpoint, 3000);
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)  // 15s timeout
      );
      
      api = await Promise.race([
        ApiPromise.create({ provider }),
        timeoutPromise
      ]);
      
      console.log('[CERE] Connected via WSS:', endpoint);
      usingHttp = false;
      connecting = false;
      return api;
    } catch (err) {
      console.warn('[CERE] WSS failed:', endpoint, err);
    }
  }
  
  // Fallback to HTTP (no subscriptions, but reliable for queries)
  for (const endpoint of CERE_HTTP_ENDPOINTS) {
    try {
      console.log('[CERE] Trying HTTP:', endpoint);
      const provider = new HttpProvider(endpoint);
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)  // 15s timeout
      );
      
      api = await Promise.race([
        ApiPromise.create({ provider }),
        timeoutPromise
      ]);
      
      console.log('[CERE] Connected via HTTP:', endpoint);
      usingHttp = true;
      connecting = false;
      return api;
    } catch (err) {
      console.warn('[CERE] HTTP failed:', endpoint, err);
    }
  }
  
  connecting = false;
  throw new Error('All Cere RPC endpoints failed (WSS + HTTP)');
}

/**
 * Get CERE balance for an address
 */
export async function getBalance(address: string): Promise<{
  free: bigint;
  reserved: bigint;
  total: bigint;
  formatted: string;
}> {
  const api = await getApi();
  const normalizedAddr = normalizeAddress(address) || address;
  const account = await api.query.system.account(normalizedAddr);
  const { free, reserved } = account.data;
  
  const freeBn = BigInt(free.toString());
  const reservedBn = BigInt(reserved.toString());
  const total = freeBn + reservedBn;
  
  // Format with proper decimals
  const formatted = formatCere(freeBn);
  
  return {
    free: freeBn,
    reserved: reservedBn,
    total,
    formatted,
  };
}

/**
 * Format CERE amount with proper decimals
 */
export function formatCere(amount: bigint): string {
  const divisor = BigInt(10 ** CERE_DECIMALS);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  
  if (fraction === 0n) {
    return `${whole.toLocaleString()} ${CERE_SYMBOL}`;
  }
  
  // Show up to 4 decimal places
  const fractionStr = fraction.toString().padStart(CERE_DECIMALS, '0').slice(0, 4);
  const trimmed = fractionStr.replace(/0+$/, '');
  
  if (trimmed) {
    return `${whole.toLocaleString()}.${trimmed} ${CERE_SYMBOL}`;
  }
  return `${whole.toLocaleString()} ${CERE_SYMBOL}`;
}

/**
 * Parse CERE amount from string to smallest unit
 */
export function parseCere(amount: string): bigint {
  const cleaned = amount.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  const whole = BigInt(parts[0] || '0');
  
  let fraction = 0n;
  if (parts[1]) {
    const fractionStr = parts[1].slice(0, CERE_DECIMALS).padEnd(CERE_DECIMALS, '0');
    fraction = BigInt(fractionStr);
  }
  
  return whole * BigInt(10 ** CERE_DECIMALS) + fraction;
}

/**
 * Transfer CERE tokens
 */
export async function transfer(
  secretKey: Uint8Array,
  recipient: string,
  amount: bigint,
  onStatus?: (status: string) => void
): Promise<{ hash: string; blockHash?: string }> {
  const api = await getApi();
  
  // Create keypair from secret
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 54 });
  const sender = keyring.addFromSeed(secretKey.slice(0, 32));
  
  onStatus?.('Building transaction...');
  
  // Normalize recipient address to fix any checksum issues
  const normalizedRecipient = normalizeAddress(recipient) || recipient;
  const tx = api.tx.balances.transferKeepAlive(normalizedRecipient, amount);
  
  return new Promise((resolve, reject) => {
    let unsub: () => void;
    
    onStatus?.('Signing and submitting...');
    
    tx.signAndSend(sender, ({ status, events, dispatchError }) => {
      console.log('[CERE] TX status:', status.type);
      
      if (status.isInBlock) {
        onStatus?.('In block, waiting for finalization...');
      }
      
      if (status.isFinalized) {
        const hash = tx.hash.toHex();
        const blockHash = status.asFinalized.toHex();
        
        // Check for errors
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = api.registry.findMetaError(dispatchError.asModule);
            reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
          } else {
            reject(new Error(dispatchError.toString()));
          }
        } else {
          onStatus?.('Finalized!');
          resolve({ hash, blockHash });
        }
        
        unsub?.();
      }
    }).then(u => { unsub = u; }).catch(reject);
  });
}

/**
 * Estimate transfer fee
 */
export async function estimateFee(
  sender: string,
  recipient: string,
  amount: bigint
): Promise<bigint> {
  const api = await getApi();
  const normalizedRecipient = normalizeAddress(recipient) || recipient;
  const tx = api.tx.balances.transferKeepAlive(normalizedRecipient, amount);
  const info = await tx.paymentInfo(sender);
  return BigInt(info.partialFee.toString());
}

/**
 * Normalize an SS58 address: decode (ignoring checksum) and re-encode with correct checksum.
 * This fixes addresses from wallets that may produce incorrect checksums.
 * Returns the corrected address with Cere prefix (54), or null if not decodable.
 */
export function normalizeAddress(address: string): string | null {
  if (!address || address.length < 46 || address.length > 48) return null;
  if (address[0] !== '5' && address[0] !== '6') return null;
  try {
    // decodeAddress with ignoreChecksum=true extracts the pubkey regardless of checksum
    const pubkey = decodeAddress(address, true);
    if (pubkey.length !== 32) return null;
    // Re-encode with correct SS58 checksum for Cere (prefix 54)
    return encodeAddress(pubkey, 54);
  } catch {
    return null;
  }
}

/**
 * Validate Cere address — accepts prefix 42 (5...) and prefix 54 (6...).
 * Tolerates incorrect checksums by normalizing first.
 */
export function isValidAddress(address: string): boolean {
  return normalizeAddress(address) !== null;
}

/**
 * Subscribe to balance changes (falls back to polling over HTTP)
 */
export async function subscribeBalance(
  address: string,
  callback: (balance: { free: bigint; formatted: string }) => void
): Promise<() => void> {
  const api = await getApi();
  const normalizedAddr = normalizeAddress(address) || address;
  
  // If using HTTP provider, subscriptions don't work — poll instead
  if (usingHttp) {
    let active = true;
    const poll = async () => {
      while (active) {
        try {
          const account = await api.query.system.account(normalizedAddr);
          const free = BigInt((account as any).data.free.toString());
          callback({ free, formatted: formatCere(free) });
        } catch (err) {
          console.warn('[CERE] Poll error:', err);
        }
        await new Promise(r => setTimeout(r, 30000)); // Poll every 30s
      }
    };
    poll();
    return () => { active = false; };
  }
  
  const unsub = await api.query.system.account(normalizedAddr, (account: any) => {
    const free = BigInt(account.data.free.toString());
    callback({
      free,
      formatted: formatCere(free),
    });
  });
  
  return unsub;
}
