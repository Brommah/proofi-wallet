/**
 * @module credentials/CredentialVerifier
 * Verifies W3C Verifiable Credentials signed with Ed25519.
 */

import { hexToU8a } from '@polkadot/util';
import { decodeAddress, signatureVerify } from '@polkadot/util-crypto';
import type { VerifiableCredential } from './types';
import { canonicalise } from './CredentialBuilder';

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
export function verify(credential: VerifiableCredential): boolean {
  const result = verifyDetailed(credential);
  return result.valid;
}

/**
 * Verify with detailed error reporting.
 */
export function verifyDetailed(credential: VerifiableCredential): VerificationResult {
  const errors: string[] = [];

  // ── Structure validation ──────────────────────────────────────────────

  if (!credential['@context'] || !Array.isArray(credential['@context'])) {
    errors.push('Missing or invalid @context');
  }

  if (!credential.type || !Array.isArray(credential.type)) {
    errors.push('Missing or invalid type');
  } else if (!credential.type.includes('VerifiableCredential')) {
    errors.push('type must include "VerifiableCredential"');
  }

  if (!credential.issuer || typeof credential.issuer !== 'string') {
    errors.push('Missing or invalid issuer');
  }

  if (!credential.issuanceDate || typeof credential.issuanceDate !== 'string') {
    errors.push('Missing or invalid issuanceDate');
  }

  if (!credential.credentialSubject || typeof credential.credentialSubject !== 'object') {
    errors.push('Missing or invalid credentialSubject');
  } else if (!credential.credentialSubject.id) {
    errors.push('credentialSubject.id is required');
  }

  if (!credential.proof) {
    errors.push('Missing proof');
    return { valid: false, errors };
  }

  const { proof } = credential;

  if (!proof.proofValue || typeof proof.proofValue !== 'string') {
    errors.push('Missing or invalid proof.proofValue');
  }

  if (!proof.verificationMethod || typeof proof.verificationMethod !== 'string') {
    errors.push('Missing or invalid proof.verificationMethod');
  }

  if (proof.proofPurpose !== 'assertionMethod') {
    errors.push('proof.proofPurpose must be "assertionMethod"');
  }

  // Issuer must match verification method
  if (credential.issuer !== proof.verificationMethod) {
    errors.push('Issuer does not match proof.verificationMethod');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // ── Signature verification ────────────────────────────────────────────

  try {
    const payload = canonicalise(credential);
    const payloadBytes = new TextEncoder().encode(payload);
    const signatureBytes = hexToU8a(proof.proofValue);
    const publicKey = decodeAddress(credential.issuer);

    const result = signatureVerify(payloadBytes, signatureBytes, publicKey);
    if (!result.isValid) {
      errors.push('Signature verification failed');
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  } catch (err) {
    errors.push(`Signature verification error: ${(err as Error).message}`);
    return { valid: false, errors };
  }
}
