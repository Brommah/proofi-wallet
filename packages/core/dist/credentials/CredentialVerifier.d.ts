/**
 * @module credentials/CredentialVerifier
 * Verifies W3C Verifiable Credentials signed with Ed25519.
 */
import type { VerifiableCredential } from './types';
export interface VerificationResult {
    valid: boolean;
    errors: string[];
}
/**
 * Verify a Verifiable Credential:
 * 1. Validates required structure/fields
 * 2. Checks the proof signature against the issuer's public key
 *
 * @returns true if the credential is valid, false otherwise
 */
export declare function verify(credential: VerifiableCredential): boolean;
/**
 * Verify with detailed error reporting.
 */
export declare function verifyDetailed(credential: VerifiableCredential): VerificationResult;
//# sourceMappingURL=CredentialVerifier.d.ts.map