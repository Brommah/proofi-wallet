/**
 * @module BaseSigner
 * Abstract base for all signer implementations.
 */

import type { SignerPayloadJSON } from '@polkadot/types/types';
import type { Signer, SignerResult, KeyPairData, SigningPurpose } from '../types.js';

let signerIdCounter = 0;

/**
 * Base class providing shared signer infrastructure.
 * Subclasses must implement `signMessage` and `signPayload`.
 */
export abstract class BaseSigner implements Signer {
  protected readonly pair: KeyPairData;
  protected readonly purpose?: SigningPurpose;

  constructor(pair: KeyPairData, purpose?: SigningPurpose) {
    this.pair = pair;
    this.purpose = purpose;
  }

  abstract signMessage(message: string | Uint8Array): Promise<string>;
  abstract signPayload(payload: SignerPayloadJSON): Promise<SignerResult>;

  getAddress(): string {
    return this.pair.address;
  }

  getPublicKey(): Uint8Array {
    return new Uint8Array(this.pair.publicKey);
  }

  /** Generate an incrementing signer result id */
  protected nextId(): number {
    return ++signerIdCounter;
  }
}
