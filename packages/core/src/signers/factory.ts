/**
 * @module factory
 * Factory function to create the appropriate signer for a keypair.
 */

import type { KeyPairData, Signer, SigningPurpose } from '../types.js';
import { Ed25519Signer } from './Ed25519Signer.js';
import { Sr25519Signer } from './Sr25519Signer.js';
import { Secp256k1Signer } from './Secp256k1Signer.js';

/**
 * Create a signer for the given keypair, optionally scoped to a purpose.
 *
 * @param pair - The keypair to create a signer for
 * @param purpose - Optional signing purpose for scoping
 * @returns A Signer instance appropriate for the key type
 */
export function createSigner(pair: KeyPairData, purpose?: SigningPurpose): Signer {
  switch (pair.type) {
    case 'ed25519':
      return new Ed25519Signer(pair, purpose);
    case 'sr25519':
      return new Sr25519Signer(pair, purpose);
    case 'secp256k1':
      return new Secp256k1Signer(pair, purpose);
    default:
      throw new Error(`No signer available for key type: ${(pair as any).type}`);
  }
}
