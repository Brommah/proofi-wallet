/**
 * @module Ed25519Signer
 * Signer for ed25519 keypairs — Substrate/Cere chain compatible.
 */

import { u8aToHex, u8aWrapBytes } from '@polkadot/util';
import type { SignerPayloadJSON } from '@polkadot/types/types';
import nacl from 'tweetnacl';

import { BaseSigner } from './BaseSigner.js';
import type { KeyPairData, SignerResult, SigningPurpose } from '../types.js';

/**
 * Ed25519 signer using tweetnacl for raw signing
 * and @polkadot/keyring pair for extrinsic payload signing.
 */
export class Ed25519Signer extends BaseSigner {
  constructor(pair: KeyPairData, purpose?: SigningPurpose) {
    if (pair.type !== 'ed25519') {
      throw new Error(`Ed25519Signer requires ed25519 keypair, got ${pair.type}`);
    }
    super(pair, purpose);
  }

  /**
   * Sign an arbitrary message.
   * The message is wrapped with the Substrate `<Bytes>...</Bytes>` prefix
   * when it's a string, matching Polkadot-js behaviour.
   */
  async signMessage(message: string | Uint8Array): Promise<string> {
    const msgBytes = typeof message === 'string'
      ? u8aWrapBytes(new TextEncoder().encode(message))
      : u8aWrapBytes(message);

    const polkadotPair = (this.pair as any).__polkadotPair;
    if (polkadotPair) {
      const sig = polkadotPair.sign(msgBytes);
      return u8aToHex(sig);
    }

    // Fallback to tweetnacl
    const sig = nacl.sign.detached(msgBytes, this.pair.secretKey);
    return u8aToHex(sig);
  }

  /**
   * Sign a Substrate extrinsic payload.
   * Requires that the keypair was created via KeyringManager (has __polkadotPair).
   */
  async signPayload(payload: SignerPayloadJSON): Promise<SignerResult> {
    const polkadotPair = (this.pair as any).__polkadotPair;
    if (!polkadotPair) {
      throw new Error('Cannot sign extrinsic payload without a Polkadot keypair. Use KeyringManager to create the pair.');
    }

    // We need @polkadot/api to create ExtrinsicPayload — for now, sign the raw bytes
    // This is a simplified version; full payload signing needs an API instance
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    const sig = polkadotPair.sign(payloadBytes);

    return {
      id: this.nextId(),
      signature: u8aToHex(sig),
    };
  }
}
