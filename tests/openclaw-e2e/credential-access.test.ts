/**
 * Credential Access E2E Tests — Proofi ↔ OpenClaw
 *
 * Covers selective disclosure, credential revocation,
 * and multi-credential presentation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockProofiWallet,
  MockOpenClawAgent,
  createTestCredential,
  createHealthCredential,
  createAgeCredential,
  type DisclosureRequest,
} from './test-setup';

describe('Credential Access', () => {
  let wallet: MockProofiWallet;
  let agent: MockOpenClawAgent;

  beforeEach(() => {
    wallet = new MockProofiWallet();
    agent = new MockOpenClawAgent();
    agent.requestAuthorization(wallet, ['credential']);
  });

  // ──────────────────────────────────────────────────────
  // 1. Selective disclosure
  // ──────────────────────────────────────────────────────
  describe('selective disclosure', () => {
    it('should share age proof without revealing birthdate', () => {
      const cred = createAgeCredential('1990-01-15', 36);
      wallet.addCredential(cred);

      const request: DisclosureRequest = {
        credentialType: 'AgeCredential',
        requestedFields: [], // don't reveal any raw fields
        predicates: [
          { field: 'age', operator: '>=', value: 18 },
        ],
      };

      const proof = wallet.createSelectiveDisclosure(cred.id, request);

      expect(proof).not.toBeNull();
      // No raw fields disclosed
      expect(Object.keys(proof!.disclosedFields)).toHaveLength(0);
      // Predicate satisfied without revealing age
      expect(proof!.predicateResults).toHaveLength(1);
      expect(proof!.predicateResults![0].satisfied).toBe(true);
      expect(proof!.predicateResults![0].field).toBe('age');
      // ZKP proof is present
      expect(proof!.proof).toMatch(/^zkp:/);
    });

    it('should fail predicate when condition not met', () => {
      const cred = createAgeCredential('2010-06-01', 15);
      wallet.addCredential(cred);

      const request: DisclosureRequest = {
        credentialType: 'AgeCredential',
        requestedFields: [],
        predicates: [
          { field: 'age', operator: '>=', value: 18 },
        ],
      };

      const proof = wallet.createSelectiveDisclosure(cred.id, request);

      expect(proof!.predicateResults![0].satisfied).toBe(false);
    });

    it('should disclose only requested fields', () => {
      const cred = createTestCredential({
        credentialSubject: {
          id: 'did:proofi:sub-1',
          name: 'Alice',
          dateOfBirth: '1990-01-15',
          age: 36,
          nationality: 'NL',
          ssn: '123-45-6789',
        },
      });
      wallet.addCredential(cred);

      const request: DisclosureRequest = {
        credentialType: 'IdentityCredential',
        requestedFields: ['name', 'nationality'],
      };

      const proof = wallet.createSelectiveDisclosure(cred.id, request);

      expect(proof!.disclosedFields).toEqual({
        name: 'Alice',
        nationality: 'NL',
      });
      // SSN, dateOfBirth, age NOT disclosed
      expect(proof!.disclosedFields).not.toHaveProperty('ssn');
      expect(proof!.disclosedFields).not.toHaveProperty('dateOfBirth');
      expect(proof!.disclosedFields).not.toHaveProperty('age');
    });

    it('should combine field disclosure with predicates', () => {
      const cred = createAgeCredential('1990-01-15', 36);
      wallet.addCredential(cred);

      const request: DisclosureRequest = {
        credentialType: 'AgeCredential',
        requestedFields: ['id'], // only reveal subject ID
        predicates: [
          { field: 'age', operator: '>=', value: 21 },
        ],
      };

      const proof = wallet.createSelectiveDisclosure(cred.id, request);

      expect(proof!.disclosedFields).toHaveProperty('id');
      expect(proof!.disclosedFields).not.toHaveProperty('dateOfBirth');
      expect(proof!.predicateResults![0].satisfied).toBe(true);
    });

    it('should return null for unknown credential', () => {
      const proof = wallet.createSelectiveDisclosure('nonexistent', {
        credentialType: 'AgeCredential',
        requestedFields: [],
      });

      expect(proof).toBeNull();
    });

    it('should return null for wrong credential type', () => {
      const cred = createHealthCredential();
      wallet.addCredential(cred);

      const proof = wallet.createSelectiveDisclosure(cred.id, {
        credentialType: 'AgeCredential',
        requestedFields: [],
      });

      expect(proof).toBeNull();
    });

    it('should handle multiple predicates', () => {
      const cred = createAgeCredential('1990-01-15', 36);
      wallet.addCredential(cred);

      const request: DisclosureRequest = {
        credentialType: 'AgeCredential',
        requestedFields: [],
        predicates: [
          { field: 'age', operator: '>=', value: 18 },
          { field: 'age', operator: '<', value: 65 },
        ],
      };

      const proof = wallet.createSelectiveDisclosure(cred.id, request);

      expect(proof!.predicateResults).toHaveLength(2);
      expect(proof!.predicateResults![0].satisfied).toBe(true); // >= 18
      expect(proof!.predicateResults![1].satisfied).toBe(true); // < 65
    });
  });

  // ──────────────────────────────────────────────────────
  // 2. Credential revocation
  // ──────────────────────────────────────────────────────
  describe('credential revocation', () => {
    it('should revoke a credential', () => {
      const cred = createTestCredential();
      wallet.addCredential(cred);

      const result = wallet.revokeCredential(cred.id);

      expect(result).toBe(true);
      expect(wallet.isCredentialRevoked(cred.id)).toBe(true);
    });

    it('should return false when revoking unknown credential', () => {
      const result = wallet.revokeCredential('nonexistent');

      expect(result).toBe(false);
    });

    it('should not affect other credentials when one is revoked', () => {
      const cred1 = createTestCredential({ id: 'cred-a' });
      const cred2 = createTestCredential({ id: 'cred-b' });
      wallet.addCredential(cred1);
      wallet.addCredential(cred2);

      wallet.revokeCredential('cred-a');

      expect(wallet.isCredentialRevoked('cred-a')).toBe(true);
      expect(wallet.isCredentialRevoked('cred-b')).toBe(false);
    });

    it('should still allow reading a revoked credential', () => {
      const cred = createTestCredential();
      wallet.addCredential(cred);
      wallet.revokeCredential(cred.id);

      const retrieved = wallet.getCredential(cred.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.revoked).toBe(true);
    });

    it('should return false for non-revoked credential', () => {
      const cred = createTestCredential();
      wallet.addCredential(cred);

      expect(wallet.isCredentialRevoked(cred.id)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────
  // 3. Multi-credential presentation
  // ──────────────────────────────────────────────────────
  describe('multi-credential presentation', () => {
    it('should present multiple credentials of different types', () => {
      const idCred = createTestCredential({ id: 'id-cred' });
      const healthCred = createHealthCredential({ id: 'health-cred' });
      wallet.addCredential(idCred);
      wallet.addCredential(healthCred);

      // Disclose name from identity credential
      const idProof = wallet.createSelectiveDisclosure('id-cred', {
        credentialType: 'IdentityCredential',
        requestedFields: ['name'],
      });

      // Disclose vaccination status from health credential
      const healthProof = wallet.createSelectiveDisclosure('health-cred', {
        credentialType: 'HealthCredential',
        requestedFields: ['vaccinationStatus'],
      });

      expect(idProof).not.toBeNull();
      expect(healthProof).not.toBeNull();
      expect(idProof!.disclosedFields).toHaveProperty('name');
      expect(healthProof!.disclosedFields).toHaveProperty('vaccinationStatus');
    });

    it('should retrieve credentials by type', () => {
      wallet.addCredential(createTestCredential({ id: 'id-1' }));
      wallet.addCredential(createTestCredential({ id: 'id-2' }));
      wallet.addCredential(createHealthCredential({ id: 'health-1' }));

      const identityCreds = wallet.getCredentialsByType('IdentityCredential');
      const healthCreds = wallet.getCredentialsByType('HealthCredential');

      expect(identityCreds).toHaveLength(2);
      expect(healthCreds).toHaveLength(1);
    });

    it('should present credentials with mixed disclosure and predicates', () => {
      const ageCred = createAgeCredential('1990-01-15', 36);
      const healthCred = createHealthCredential();
      wallet.addCredential(ageCred);
      wallet.addCredential(healthCred);

      // Age: predicate only (no raw data)
      const ageProof = wallet.createSelectiveDisclosure(ageCred.id, {
        credentialType: 'AgeCredential',
        requestedFields: [],
        predicates: [{ field: 'age', operator: '>=', value: 18 }],
      });

      // Health: reveal vaccination status
      const healthProof = wallet.createSelectiveDisclosure(healthCred.id, {
        credentialType: 'HealthCredential',
        requestedFields: ['vaccinationStatus'],
      });

      expect(ageProof!.predicateResults![0].satisfied).toBe(true);
      expect(ageProof!.disclosedFields).toEqual({});
      expect(healthProof!.disclosedFields.vaccinationStatus).toBe(
        'fully_vaccinated',
      );
    });

    it('should handle presentation where one credential is revoked', () => {
      const idCred = createTestCredential({ id: 'id-valid' });
      const revokedCred = createTestCredential({ id: 'id-revoked' });
      wallet.addCredential(idCred);
      wallet.addCredential(revokedCred);
      wallet.revokeCredential('id-revoked');

      // Valid credential still works
      const validProof = wallet.createSelectiveDisclosure('id-valid', {
        credentialType: 'IdentityCredential',
        requestedFields: ['name'],
      });
      expect(validProof).not.toBeNull();

      // Revoked credential still produces disclosure (revocation
      // status is metadata — the verifier checks it separately)
      expect(wallet.isCredentialRevoked('id-revoked')).toBe(true);
    });
  });
});
