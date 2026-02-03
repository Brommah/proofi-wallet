import { describe, it, expect, beforeAll } from 'vitest';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/keyring';

import { create, fromPolkadotPair, canonicalise } from '../credentials/CredentialBuilder';
import { verify, verifyDetailed } from '../credentials/CredentialVerifier';
import type { VerifiableCredential } from '../credentials/types';

const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('Credentials', () => {
  let issuerPair: ReturnType<Keyring['addFromUri']>;
  let issuerAddress: string;

  beforeAll(async () => {
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'ed25519', ss58Format: 42 });
    issuerPair = keyring.addFromUri(TEST_MNEMONIC);
    issuerAddress = issuerPair.address;
  });

  describe('CredentialBuilder', () => {
    it('creates a valid credential with proof', () => {
      const signer = fromPolkadotPair(issuerPair);
      const credential = create('did:example:subject123', { name: 'Alice', age: 30 }, signer);

      expect(credential['@context']).toContain('https://www.w3.org/2018/credentials/v1');
      expect(credential.type).toContain('VerifiableCredential');
      expect(credential.issuer).toBe(issuerAddress);
      expect(credential.credentialSubject.id).toBe('did:example:subject123');
      expect(credential.credentialSubject.name).toBe('Alice');
      expect(credential.credentialSubject.age).toBe(30);
      expect(credential.issuanceDate).toBeTruthy();
      expect(credential.proof).toBeDefined();
      expect(credential.proof!.type).toBe('Ed25519Signature2020');
      expect(credential.proof!.proofPurpose).toBe('assertionMethod');
      expect(credential.proof!.verificationMethod).toBe(issuerAddress);
      expect(credential.proof!.proofValue).toMatch(/^0x[0-9a-f]+$/);
    });

    it('canonicalise excludes proof from output', () => {
      const signer = fromPolkadotPair(issuerPair);
      const credential = create('did:example:subject', { claim: true }, signer);
      const canonical = canonicalise(credential);
      expect(canonical).not.toContain('proof');
      expect(canonical).toContain('credentialSubject');
    });

    it('creates credentials with different claims', () => {
      const signer = fromPolkadotPair(issuerPair);
      const c1 = create('did:example:a', { role: 'admin' }, signer);
      const c2 = create('did:example:b', { role: 'user' }, signer);

      expect(c1.credentialSubject.role).toBe('admin');
      expect(c2.credentialSubject.role).toBe('user');
      // Different subjects → different signatures
      expect(c1.proof!.proofValue).not.toBe(c2.proof!.proofValue);
    });
  });

  describe('CredentialVerifier', () => {
    it('verifies a valid credential', () => {
      const signer = fromPolkadotPair(issuerPair);
      const credential = create('did:example:subject', { verified: true }, signer);

      expect(verify(credential)).toBe(true);
    });

    it('verifyDetailed returns valid result for good credential', () => {
      const signer = fromPolkadotPair(issuerPair);
      const credential = create('did:example:subject', { ok: true }, signer);

      const result = verifyDetailed(credential);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects credential with tampered claims', () => {
      const signer = fromPolkadotPair(issuerPair);
      const credential = create('did:example:subject', { score: 100 }, signer);

      // Tamper with the credential
      credential.credentialSubject.score = 999;

      expect(verify(credential)).toBe(false);
    });

    it('rejects credential with tampered issuer', () => {
      const signer = fromPolkadotPair(issuerPair);
      const credential = create('did:example:subject', { ok: true }, signer);

      // Create a different keypair
      const keyring = new Keyring({ type: 'ed25519', ss58Format: 42 });
      const otherPair = keyring.addFromUri('//Other');

      credential.issuer = otherPair.address;
      credential.proof!.verificationMethod = otherPair.address;

      expect(verify(credential)).toBe(false);
    });

    it('rejects credential without proof', () => {
      const credential: VerifiableCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: issuerAddress,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: 'did:example:subject' },
      };

      expect(verify(credential)).toBe(false);
      const result = verifyDetailed(credential);
      expect(result.errors).toContain('Missing proof');
    });

    it('rejects credential with missing @context', () => {
      const signer = fromPolkadotPair(issuerPair);
      const credential = create('did:example:subject', {}, signer);
      // @ts-expect-error - intentionally breaking the type
      credential['@context'] = null;

      const result = verifyDetailed(credential);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid @context');
    });

    it('rejects credential with wrong proofPurpose', () => {
      const signer = fromPolkadotPair(issuerPair);
      const credential = create('did:example:subject', {}, signer);
      credential.proof!.proofPurpose = 'authentication';

      const result = verifyDetailed(credential);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('proof.proofPurpose must be "assertionMethod"');
    });

    it('rejects when issuer does not match verificationMethod', () => {
      const signer = fromPolkadotPair(issuerPair);
      const credential = create('did:example:subject', {}, signer);
      credential.proof!.verificationMethod = 'did:example:other';

      const result = verifyDetailed(credential);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Issuer does not match proof.verificationMethod');
    });
  });
});
