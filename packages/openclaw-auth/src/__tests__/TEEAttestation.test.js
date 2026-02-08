import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/keyring';
import { u8aToHex, stringToU8a } from '@polkadot/util';
import { TEEAttestationVerifier, TEEPlatform } from '../TEEAttestation.js';

const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('TEEAttestationVerifier', () => {
  let verifier;
  let enclavePair;

  beforeAll(async () => {
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 42 });
    enclavePair = keyring.addFromUri(TEST_MNEMONIC);
  });

  beforeEach(async () => {
    verifier = new TEEAttestationVerifier();
    await verifier.init();
  });

  /** Helper to build a valid attestation */
  function makeAttestation(overrides = {}) {
    return {
      platform: 'sgx',
      measurement: '0xaabbccdd',
      timestamp: new Date().toISOString(),
      ...overrides,
    };
  }

  /** Helper to build a signed attestation */
  function makeSignedAttestation(overrides = {}) {
    const att = makeAttestation({
      enclaveAddress: enclavePair.address,
      ...overrides,
    });
    const payload = JSON.stringify({
      platform: att.platform,
      measurement: att.measurement,
      timestamp: att.timestamp,
    });
    const signature = enclavePair.sign(stringToU8a(payload));
    att.signature = u8aToHex(signature);
    return att;
  }

  // ── Initialisation ──────────────────────────────────────────────────────
  describe('init', () => {
    it('throws if not initialised', () => {
      const uninit = new TEEAttestationVerifier();
      expect(() => uninit.verifyTEEAttestation(makeAttestation())).toThrow('not initialised');
    });
  });

  // ── Trusted measurements ────────────────────────────────────────────────
  describe('registerTrustedMeasurement', () => {
    it('registers a measurement', () => {
      verifier.registerTrustedMeasurement('sgx', '0xaabb', 'test-enclave');
      expect(verifier.size).toBe(1);
    });

    it('throws on unsupported platform', () => {
      expect(() => verifier.registerTrustedMeasurement('arm', '0xaabb')).toThrow(
        'Unsupported TEE platform',
      );
    });

    it('throws on empty measurement', () => {
      expect(() => verifier.registerTrustedMeasurement('sgx', '')).toThrow(
        'measurement is required',
      );
    });
  });

  // ── Structure validation ────────────────────────────────────────────────
  describe('verifyTEEAttestation — structure', () => {
    it('rejects null attestation', () => {
      const result = verifier.verifyTEEAttestation(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Attestation must be an object');
    });

    it('rejects missing platform', () => {
      const result = verifier.verifyTEEAttestation(makeAttestation({ platform: '' }));
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid platform');
    });

    it('rejects unsupported platform', () => {
      const result = verifier.verifyTEEAttestation(makeAttestation({ platform: 'arm' }));
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unsupported platform');
    });

    it('rejects missing measurement', () => {
      const result = verifier.verifyTEEAttestation(makeAttestation({ measurement: '' }));
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid measurement');
    });

    it('rejects missing timestamp', () => {
      const result = verifier.verifyTEEAttestation(makeAttestation({ timestamp: '' }));
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid timestamp');
    });

    it('rejects invalid timestamp format', () => {
      const result = verifier.verifyTEEAttestation(makeAttestation({ timestamp: 'not-a-date' }));
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid timestamp format');
    });
  });

  // ── Timestamp freshness ─────────────────────────────────────────────────
  describe('verifyTEEAttestation — freshness', () => {
    it('accepts a fresh attestation', () => {
      const result = verifier.verifyTEEAttestation(makeAttestation(), {
        requireMeasurement: false,
      });
      expect(result.valid).toBe(true);
    });

    it('rejects an old attestation', () => {
      const old = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 min ago
      const result = verifier.verifyTEEAttestation(makeAttestation({ timestamp: old }), {
        requireMeasurement: false,
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Attestation too old');
    });

    it('respects custom maxAgeMs', () => {
      const old = new Date(Date.now() - 2000).toISOString(); // 2s ago
      const result = verifier.verifyTEEAttestation(makeAttestation({ timestamp: old }), {
        maxAgeMs: 1000,
        requireMeasurement: false,
      });
      expect(result.valid).toBe(false);
    });

    it('rejects future timestamp', () => {
      const future = new Date(Date.now() + 60000).toISOString();
      const result = verifier.verifyTEEAttestation(makeAttestation({ timestamp: future }), {
        requireMeasurement: false,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Attestation timestamp is in the future');
    });
  });

  // ── Measurement trust ───────────────────────────────────────────────────
  describe('verifyTEEAttestation — measurement trust', () => {
    it('accepts attestation with trusted measurement', () => {
      verifier.registerTrustedMeasurement('sgx', '0xaabbccdd');
      const result = verifier.verifyTEEAttestation(makeAttestation());
      expect(result.valid).toBe(true);
    });

    it('rejects attestation with untrusted measurement', () => {
      verifier.registerTrustedMeasurement('sgx', '0x11223344');
      const result = verifier.verifyTEEAttestation(makeAttestation({ measurement: '0xdeadbeef' }));
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Measurement not in trusted list');
    });

    it('rejects measurement registered for different platform', () => {
      verifier.registerTrustedMeasurement('sev', '0xaabbccdd');
      const result = verifier.verifyTEEAttestation(makeAttestation({ platform: 'sgx' }));
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('registered for sev, not sgx');
    });

    it('skips measurement check when no measurements registered', () => {
      const result = verifier.verifyTEEAttestation(makeAttestation());
      expect(result.valid).toBe(true);
    });

    it('skips measurement check when requireMeasurement is false', () => {
      verifier.registerTrustedMeasurement('sgx', '0x11223344');
      const result = verifier.verifyTEEAttestation(makeAttestation({ measurement: '0xdeadbeef' }), {
        requireMeasurement: false,
      });
      expect(result.valid).toBe(true);
    });
  });

  // ── Signature verification ──────────────────────────────────────────────
  describe('verifyTEEAttestation — signature', () => {
    it('accepts valid signed attestation', () => {
      const att = makeSignedAttestation();
      const result = verifier.verifyTEEAttestation(att, { requireMeasurement: false });
      expect(result.valid).toBe(true);
    });

    it('rejects tampered signed attestation', () => {
      const att = makeSignedAttestation();
      att.measurement = '0xTAMPERED';
      const result = verifier.verifyTEEAttestation(att, { requireMeasurement: false });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('signature verification');
    });

    it('skips signature check when no address/signature', () => {
      const att = makeAttestation();
      const result = verifier.verifyTEEAttestation(att, { requireMeasurement: false });
      expect(result.valid).toBe(true);
    });
  });

  // ── Successful verification result ──────────────────────────────────────
  describe('verifyTEEAttestation — success result', () => {
    it('returns platform and measurement on success', () => {
      const result = verifier.verifyTEEAttestation(makeAttestation(), {
        requireMeasurement: false,
      });
      expect(result.valid).toBe(true);
      expect(result.platform).toBe('sgx');
      expect(result.measurement).toBe('0xaabbccdd');
      expect(result.errors).toHaveLength(0);
    });
  });

  // ── Platform constants ──────────────────────────────────────────────────
  describe('TEEPlatform', () => {
    it('exports expected platforms', () => {
      expect(TEEPlatform.SGX).toBe('sgx');
      expect(TEEPlatform.SEV).toBe('sev');
      expect(TEEPlatform.TDX).toBe('tdx');
      expect(TEEPlatform.NITRO).toBe('nitro');
    });
  });

  // ── Cleanup ─────────────────────────────────────────────────────────────
  describe('clear', () => {
    it('removes all trusted measurements', () => {
      verifier.registerTrustedMeasurement('sgx', '0xaa');
      verifier.registerTrustedMeasurement('sev', '0xbb');
      expect(verifier.size).toBe(2);
      verifier.clear();
      expect(verifier.size).toBe(0);
    });
  });
});
