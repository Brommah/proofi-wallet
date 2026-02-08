/**
 * TEE Verification E2E Tests — Proofi ↔ OpenClaw
 *
 * Covers TEE attestation verification and encrypted memory storage.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockOpenClawAgent,
  MockTeeVerifier,
  type TeeAttestation,
} from './test-setup';

describe('TEE Verification', () => {
  let agent: MockOpenClawAgent;
  let verifier: MockTeeVerifier;

  beforeEach(() => {
    agent = new MockOpenClawAgent();
    verifier = new MockTeeVerifier();
  });

  // ──────────────────────────────────────────────────────
  // 1. TEE attestation verification
  // ──────────────────────────────────────────────────────
  describe('TEE attestation verification', () => {
    it('should generate a valid attestation', () => {
      const attestation = agent.generateAttestation();

      expect(attestation.enclaveId).toBe(agent.agentId);
      expect(attestation.measurement).toBe(agent.enclaveMeasurement);
      expect(attestation.valid).toBe(true);
      expect(attestation.signature).toBeTruthy();
      expect(attestation.platform).toBe('nitro');
    });

    it('should verify a valid attestation', () => {
      const attestation = agent.generateAttestation();
      const result = verifier.verify(attestation);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject attestation with invalid flag', () => {
      const attestation = agent.generateAttestation();
      attestation.valid = false;

      const result = verifier.verify(attestation);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Attestation marked as invalid');
    });

    it('should reject attestation with missing signature', () => {
      const attestation = agent.generateAttestation();
      attestation.signature = '';

      const result = verifier.verify(attestation);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing attestation signature');
    });

    it('should reject attestation with missing measurement', () => {
      const attestation = agent.generateAttestation();
      attestation.measurement = '';

      const result = verifier.verify(attestation);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing enclave measurement');
    });

    it('should reject stale attestation (>5 min old)', () => {
      const attestation = agent.generateAttestation();
      attestation.timestamp = Date.now() - 6 * 60 * 1000; // 6 min ago

      const result = verifier.verify(attestation);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Attestation is stale');
    });

    it('should accept attestation within 5 min window', () => {
      const attestation = agent.generateAttestation();
      attestation.timestamp = Date.now() - 4 * 60 * 1000; // 4 min ago

      const result = verifier.verify(attestation);

      expect(result.valid).toBe(true);
    });

    it('should support different TEE platforms', () => {
      const sgx = agent.generateAttestation('sgx');
      const sev = agent.generateAttestation('sev');
      const nitro = agent.generateAttestation('nitro');

      expect(sgx.platform).toBe('sgx');
      expect(sev.platform).toBe('sev');
      expect(nitro.platform).toBe('nitro');

      // All should verify
      expect(verifier.verify(sgx).valid).toBe(true);
      expect(verifier.verify(sev).valid).toBe(true);
      expect(verifier.verify(nitro).valid).toBe(true);
    });

    it('should reject untrusted measurement when trust list is set', () => {
      verifier.trustMeasurement('trusted-measurement-hash');

      const attestation = agent.generateAttestation();
      // agent.enclaveMeasurement is random, not in trust list

      const result = verifier.verify(attestation);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Enclave measurement not in trusted set',
      );
    });

    it('should accept trusted measurement', () => {
      verifier.trustMeasurement(agent.enclaveMeasurement);

      const attestation = agent.generateAttestation();
      const result = verifier.verify(attestation);

      expect(result.valid).toBe(true);
    });

    it('should collect multiple errors', () => {
      const attestation: TeeAttestation = {
        enclaveId: '',
        measurement: '',
        timestamp: Date.now() - 10 * 60 * 1000,
        signature: '',
        platform: 'nitro',
        valid: false,
      };

      const result = verifier.verify(attestation);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ──────────────────────────────────────────────────────
  // 2. Encrypted memory storage
  // ──────────────────────────────────────────────────────
  describe('encrypted memory storage', () => {
    it('should store data in encrypted form', () => {
      const entry = agent.storeEncrypted('user-pref', 'dark-mode');

      expect(entry.key).toBe('user-pref');
      expect(entry.ciphertext).toBeTruthy();
      expect(entry.iv).toBeTruthy();
      expect(entry.tag).toBeTruthy();
      // Ciphertext should not equal plaintext
      expect(entry.ciphertext).not.toBe('dark-mode');
    });

    it('should retrieve stored encrypted data', () => {
      agent.storeEncrypted('session-token', 'abc123');

      const retrieved = agent.retrieveEncrypted('session-token');

      expect(retrieved).not.toBeNull();
      expect(retrieved!.key).toBe('session-token');
      expect(retrieved!.ciphertext).toBeTruthy();
    });

    it('should return null for missing key', () => {
      const result = agent.retrieveEncrypted('nonexistent');

      expect(result).toBeNull();
    });

    it('should verify memory integrity', () => {
      agent.storeEncrypted('important-data', 'secret-value');

      const isValid = agent.verifyMemoryIntegrity('important-data');

      expect(isValid).toBe(true);
    });

    it('should detect tampered memory', () => {
      const entry = agent.storeEncrypted('tamper-test', 'original');

      // Tamper with ciphertext
      entry.ciphertext = 'tampered-value';

      const isValid = agent.verifyMemoryIntegrity('tamper-test');

      expect(isValid).toBe(false);
    });

    it('should store timestamp with each entry', () => {
      const before = Date.now();
      const entry = agent.storeEncrypted('timed', 'value');
      const after = Date.now();

      expect(entry.storedAt).toBeGreaterThanOrEqual(before);
      expect(entry.storedAt).toBeLessThanOrEqual(after);
    });

    it('should overwrite existing key', () => {
      agent.storeEncrypted('key', 'value-1');
      const entry2 = agent.storeEncrypted('key', 'value-2');

      const retrieved = agent.retrieveEncrypted('key');

      expect(retrieved!.ciphertext).toBe(entry2.ciphertext);
    });

    it('should clear all encrypted memory', () => {
      agent.storeEncrypted('key-1', 'val-1');
      agent.storeEncrypted('key-2', 'val-2');

      agent.clearMemory();

      expect(agent.retrieveEncrypted('key-1')).toBeNull();
      expect(agent.retrieveEncrypted('key-2')).toBeNull();
    });

    it('should produce different ciphertexts for same plaintext (different IV)', () => {
      const e1 = agent.storeEncrypted('k1', 'same-plaintext');
      // Store under different key to avoid overwrite
      const e2 = agent.storeEncrypted('k2', 'same-plaintext');

      // IVs should differ → ciphertexts should differ
      expect(e1.iv).not.toBe(e2.iv);
    });

    it('should fail integrity check for unknown key', () => {
      const isValid = agent.verifyMemoryIntegrity('ghost-key');

      expect(isValid).toBe(false);
    });
  });
});
