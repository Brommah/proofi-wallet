/**
 * @module credentials/CredentialBuilder
 * Builds and signs W3C Verifiable Credentials.
 */

import { u8aToHex } from '@polkadot/util';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { VerifiableCredential, CredentialProof } from './types';

/** A signer that can sign bytes and provide an address */
export interface CredentialSigner {
  /** Sign raw bytes, returning the signature bytes */
  sign(message: Uint8Array): Uint8Array;
  /** The address/DID of the signer */
  address: string;
}

/** Wrap a Polkadot KeyringPair as a CredentialSigner */
export function fromPolkadotPair(pair: KeyringPair): CredentialSigner {
  return {
    sign: (msg: Uint8Array) => pair.sign(msg),
    address: pair.address,
  };
}

/**
 * Build a signed Verifiable Credential.
 *
 * @param subjectId - Address/DID of the credential subject
 * @param claims - Key-value claims about the subject
 * @param signer - Signer that will sign the credential
 * @returns A complete VerifiableCredential with proof
 */
export function create(
  subjectId: string,
  claims: Record<string, unknown>,
  signer: CredentialSigner,
): VerifiableCredential {
  const now = new Date().toISOString();

  // Build the credential without proof
  const credential: VerifiableCredential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://www.w3.org/2018/credentials/examples/v1',
    ],
    type: ['VerifiableCredential'],
    issuer: signer.address,
    issuanceDate: now,
    credentialSubject: {
      id: subjectId,
      ...claims,
    },
  };

  // Canonical payload to sign (deterministic JSON)
  const payload = canonicalise(credential);
  const payloadBytes = new TextEncoder().encode(payload);
  const signatureBytes = signer.sign(payloadBytes);

  const proof: CredentialProof = {
    type: 'Ed25519Signature2020',
    created: now,
    verificationMethod: signer.address,
    proofPurpose: 'assertionMethod',
    proofValue: u8aToHex(signatureBytes),
  };

  return { ...credential, proof };
}

/**
 * Produce a deterministic JSON string of a credential (excluding proof).
 * Uses recursive key sorting for canonical representation.
 */
export function canonicalise(credential: VerifiableCredential): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { proof: _proof, ...rest } = credential;
  return JSON.stringify(sortDeep(rest));
}

/** Recursively sort object keys for deterministic serialisation */
function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortDeep);
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortDeep((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}
