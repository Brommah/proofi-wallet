/**
 * Wallet-signature based authentication for API calls.
 * Fully decentralized — no JWT tokens needed.
 * 
 * Signs: `proofi:{timestamp}:{address}`
 * Header: `Signature {address}:{timestamp}:{signature}`
 */

import { useWalletStore } from '../stores/walletStore';
import { u8aToHex } from '@polkadot/util';

/**
 * Create signature auth headers for API requests.
 * Returns null if wallet not connected or no keypair available.
 */
export function getSignatureAuthHeaders(): Record<string, string> | null {
  const { address, keypair } = useWalletStore.getState();
  
  if (!address || !keypair) {
    console.warn('[signatureAuth] No wallet connected or keypair missing');
    return null;
  }

  const timestamp = Date.now();
  const message = `proofi:${timestamp}:${address}`;
  
  try {
    // Sign the message with the wallet's private key
    const messageBytes = new TextEncoder().encode(message);
    
    // Use the keypair's _polkadotPair if available (for sr25519)
    let signature: string;
    
    if ((keypair as any)._polkadotPair) {
      const sigBytes = (keypair as any)._polkadotPair.sign(messageBytes);
      signature = u8aToHex(sigBytes);
    } else {
      // Fallback: try direct signing if keypair has sign method
      console.error('[signatureAuth] No _polkadotPair available');
      return null;
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Signature ${address}:${timestamp}:${signature}`,
    };
  } catch (e) {
    console.error('[signatureAuth] Failed to sign:', e);
    return null;
  }
}

/**
 * Async version that waits for wallet to be ready.
 */
export async function getSignatureAuthHeadersAsync(): Promise<Record<string, string> | null> {
  // Small delay to ensure wallet state is synced
  await new Promise(resolve => setTimeout(resolve, 10));
  return getSignatureAuthHeaders();
}
