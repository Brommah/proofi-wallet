/**
 * @module credentials/CredentialBuilder
 * Builds and signs W3C Verifiable Credentials.
 */
import type { KeyringPair } from '@polkadot/keyring/types';
import type { VerifiableCredential } from './types';
/** A signer that can sign bytes and provide an address */
export interface CredentialSigner {
    /** Sign raw bytes, returning the signature bytes */
    sign(message: Uint8Array): Uint8Array;
    /** The address/DID of the signer */
    address: string;
}
/** Wrap a Polkadot KeyringPair as a CredentialSigner */
export declare function fromPolkadotPair(pair: KeyringPair): CredentialSigner;
/**
 * Build a signed Verifiable Credential.
 *
 * @param subjectId - Address/DID of the credential subject
 * @param claims - Key-value claims about the subject
 * @param signer - Signer that will sign the credential
 * @returns A complete VerifiableCredential with proof
 */
export declare function create(subjectId: string, claims: Record<string, unknown>, signer: CredentialSigner): VerifiableCredential;
/**
 * Produce a deterministic JSON string of a credential (excluding proof).
 * Uses recursive key sorting for canonical representation.
 */
export declare function canonicalise(credential: VerifiableCredential): string;
//# sourceMappingURL=CredentialBuilder.d.ts.map