/**
 * CERE Network Token Functions
 * Mainnet RPC: wss://rpc.mainnet.cere.network/ws
 * Archive RPC: wss://archive.mainnet.cere.network/ws
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { formatBalance } from '@polkadot/util';

// Primary and fallback RPC endpoints (archive is more stable)
const CERE_RPC_ENDPOINTS = [
  'wss://archive.mainnet.cere.network/ws',
  'wss://rpc.mainnet.cere.network/ws',
];
const CERE_DECIMALS = 10;
const CERE_SYMBOL = 'CERE';

let api: ApiPromise | null = null;
let connecting = false;

/**
 * Get or create API connection to Cere mainnet (with fallback)
 */
export async function getApi(): Promise<ApiPromise> {
  if (api && api.isConnected) return api;
  
  if (connecting) {
    let waited = 0;
    while (connecting && waited < 15000) {
      await new Promise(r => setTimeout(r, 100));
      waited += 100;
    }
    if (api && api.isConnected) return api;
  }

  connecting = true;
  
  for (const endpoint of CERE_RPC_ENDPOINTS) {
    try {
      console.log('[CERE] Trying:', endpoint);
      const provider = new WsProvider(endpoint, 3000);
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 12000)
      );
      
      api = await Promise.race([
        ApiPromise.create({ provider }),
        timeoutPromise
      ]);
      
      console.log('[CERE] Connected via:', endpoint);
      connecting = false;
      return api;
    } catch (err) {
      console.warn('[CERE] Failed:', endpoint, err);
      // Try next endpoint
    }
  }
  
  connecting = false;
  throw new Error('All Cere RPC endpoints failed');
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
  const account = await api.query.system.account(address);
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
  
  const tx = api.tx.balances.transferKeepAlive(recipient, amount);
  
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
  const tx = api.tx.balances.transferKeepAlive(recipient, amount);
  const info = await tx.paymentInfo(sender);
  return BigInt(info.partialFee.toString());
}

/**
 * Validate Cere address
 */
export function isValidAddress(address: string): boolean {
  try {
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 54 });
    keyring.encodeAddress(keyring.decodeAddress(address));
    return true;
  } catch {
    return false;
  }
}

/**
 * Subscribe to balance changes
 */
export async function subscribeBalance(
  address: string,
  callback: (balance: { free: bigint; formatted: string }) => void
): Promise<() => void> {
  const api = await getApi();
  
  const unsub = await api.query.system.account(address, (account: any) => {
    const free = BigInt(account.data.free.toString());
    callback({
      free,
      formatted: formatCere(free),
    });
  });
  
  return unsub;
}
