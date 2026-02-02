/**
 * @module Sr25519Signer
 * Signer for sr25519 keypairs — Polkadot native.
 */

import { u8aToHex, u8aWrapBytes } from '@polkadot/util';
import type { SignerPayloadJSON } from '@polkadot/types/types';

import { BaseSigner } from './BaseSigner.js';
import type { KeyPairData, SignerResult, SigningPurpose } from '../types.js';

/**
 * Sr25519 signer using @polkadot/keyring pair.
 * sr25519 is not available in tweetnacl — all signing goes through the Polkadot pair.
 */
export class Sr25519Signer extends BaseSigner {
  constructor(pair: KeyPairData, purpose?: SigningPurpose) {
    if (pair.type !== 'sr25519') {
      throw new Error(`Sr25519Signer requires sr25519 keypair, got ${pair.type}`);
    }
    if (!(pair as any).__polkadotPair) {
      throw new Error('Sr25519Signer requires a Polkadot keypair. Use KeyringManager to create the pair.');
    }
    super(pair, purpose);
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    const msgBytes = typeof message === 'string'
      ? u8aWrapBytes(new TextEncoder().encode(message))
      : u8aWrapBytes(message);

    const polkadotPair = (this.pair as any).__polkadotPair;
    const sig = polkadotPair.sign(msgBytes);
    return u8aToHex(sig);
  }

  async signPayload(payload: SignerPayloadJSON): Promise<SignerResult> {
    const polkadotPair = (this.pair as any).__polkadotPair;
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    const sig = polkadotPair.sign(payloadBytes);

    return {
      id: this.nextId(),
      signature: u8aToHex(sig),
    };
  }
}
