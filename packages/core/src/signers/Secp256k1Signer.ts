/**
 * @module Secp256k1Signer
 * Signer for secp256k1 keypairs — Ethereum compatible.
 */

import { Wallet as EthersWallet, hashMessage, getBytes } from 'ethers';
import { u8aToHex } from '@polkadot/util';
import type { SignerPayloadJSON } from '@polkadot/types/types';

import { BaseSigner } from './BaseSigner.js';
import type { KeyPairData, SignerResult, SigningPurpose } from '../types.js';

/**
 * Secp256k1 signer wrapping an ethers Wallet.
 * Signs Ethereum personal messages and can produce EIP-191 signatures.
 */
export class Secp256k1Signer extends BaseSigner {
  private readonly wallet: EthersWallet;

  constructor(pair: KeyPairData, purpose?: SigningPurpose) {
    if (pair.type !== 'secp256k1') {
      throw new Error(`Secp256k1Signer requires secp256k1 keypair, got ${pair.type}`);
    }
    super(pair, purpose);

    this.wallet = (pair as any).__ethersWallet ?? new EthersWallet(u8aToHex(pair.secretKey));
  }

  /**
   * Sign an arbitrary message using EIP-191 personal_sign.
   * Returns hex-encoded signature.
   */
  async signMessage(message: string | Uint8Array): Promise<string> {
    const msg = typeof message === 'string' ? message : message;
    return this.wallet.signMessage(msg);
  }

  /**
   * Sign a Substrate extrinsic payload.
   * This is unusual for secp256k1 but supported for cross-chain use cases.
   * Signs the raw payload bytes with EIP-191.
   */
  async signPayload(payload: SignerPayloadJSON): Promise<SignerResult> {
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    const signature = await this.wallet.signMessage(payloadBytes);

    return {
      id: this.nextId(),
      signature,
    };
  }
}
