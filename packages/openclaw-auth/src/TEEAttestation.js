/**
 * @module TEEAttestation
 * Verifies Trusted Execution Environment (TEE) attestation reports.
 *
 * Ensures OpenClaw agents are running inside a valid TEE enclave
 * before granting access to sensitive credentials.
 */
import { cryptoWaitReady, signatureVerify, decodeAddress } from '@polkadot/util-crypto';
import { hexToU8a, stringToU8a } from '@polkadot/util';

/** Supported TEE platforms */
export const TEEPlatform = {
  SGX: 'sgx',
  SEV: 'sev',
  TDX: 'tdx',
  NITRO: 'nitro',
};

const SUPPORTED_PLATFORMS = new Set(Object.values(TEEPlatform));

/**
 * TEEAttestationVerifier validates that an agent runs inside a legitimate TEE.
 *
 * @example
 * ```js
 * const verifier = new TEEAttestationVerifier();
 * await verifier.init();
 * const result = verifier.verifyTEEAttestation(attestation);
 * if (result.valid) { // agent is trusted }
 * ```
 */
export class TEEAttestationVerifier {
  trustedMeasurements = new Map();
  ready = false;

  /**
   * Initialise the WASM crypto backend.
   * Must be called before any attestation operations.
   */
  async init() {
    if (this.ready) return;
    await cryptoWaitReady();
    this.ready = true;
  }

  ensureReady() {
    if (!this.ready) {
      throw new Error('TEEAttestationVerifier not initialised — call init() first');
    }
  }

  /**
   * Register a trusted enclave measurement (MRENCLAVE / launch digest).
   *
   * @param {string} platform - TEE platform ('sgx', 'sev', 'tdx', 'nitro')
   * @param {string} measurement - Hex-encoded measurement hash
   * @param {string} [label] - Human-readable label
   */
  registerTrustedMeasurement(platform, measurement, label) {
    this.ensureReady();

    if (!SUPPORTED_PLATFORMS.has(platform)) {
      throw new Error(
        `Unsupported TEE platform: ${platform}. Supported: ${[...SUPPORTED_PLATFORMS].join(', ')}`,
      );
    }

    if (!measurement || typeof measurement !== 'string') {
      throw new Error('measurement is required');
    }

    this.trustedMeasurements.set(measurement, { platform, label: label || null });
  }

  /**
   * Verify a TEE attestation report.
   *
   * Checks:
   * 1. Attestation structure is valid
   * 2. Platform is supported
   * 3. Measurement matches a trusted value (if any registered)
   * 4. Attestation timestamp is recent (not replayed)
   * 5. Enclave signature is valid (if signer address provided)
   *
   * @param {object} attestation - The attestation report
   * @param {string} attestation.platform - TEE platform
   * @param {string} attestation.measurement - Enclave measurement hash
   * @param {string} attestation.timestamp - ISO 8601 timestamp
   * @param {string} [attestation.enclaveAddress] - Signer address (sr25519)
   * @param {string} [attestation.signature] - Hex-encoded signature over payload
   * @param {object} [attestation.report] - Platform-specific report data
   * @param {object} [options] - Verification options
   * @param {number} [options.maxAgeMs] - Max attestation age in ms (default: 5 min)
   * @param {boolean} [options.requireMeasurement] - Require measurement in trusted list (default: true if list non-empty)
   * @returns {{ valid: boolean, errors: string[], platform?: string, measurement?: string }}
   */
  verifyTEEAttestation(attestation, options = {}) {
    this.ensureReady();

    const errors = [];
    const maxAgeMs = options.maxAgeMs || 5 * 60 * 1000;

    // ── Structure validation ──────────────────────────────────────────────
    if (!attestation || typeof attestation !== 'object') {
      return { valid: false, errors: ['Attestation must be an object'] };
    }

    if (!attestation.platform || typeof attestation.platform !== 'string') {
      errors.push('Missing or invalid platform');
    } else if (!SUPPORTED_PLATFORMS.has(attestation.platform)) {
      errors.push(
        `Unsupported platform: ${attestation.platform}. Supported: ${[...SUPPORTED_PLATFORMS].join(', ')}`,
      );
    }

    if (!attestation.measurement || typeof attestation.measurement !== 'string') {
      errors.push('Missing or invalid measurement');
    }

    if (!attestation.timestamp || typeof attestation.timestamp !== 'string') {
      errors.push('Missing or invalid timestamp');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // ── Timestamp freshness ───────────────────────────────────────────────
    const attestationTime = new Date(attestation.timestamp);
    if (isNaN(attestationTime.getTime())) {
      errors.push('Invalid timestamp format');
      return { valid: false, errors };
    }

    const age = Date.now() - attestationTime.getTime();
    if (age > maxAgeMs) {
      errors.push(`Attestation too old: ${Math.round(age / 1000)}s (max: ${Math.round(maxAgeMs / 1000)}s)`);
    }
    if (age < 0) {
      errors.push('Attestation timestamp is in the future');
    }

    // ── Measurement trust ─────────────────────────────────────────────────
    const requireMeasurement = options.requireMeasurement !== undefined
      ? options.requireMeasurement
      : this.trustedMeasurements.size > 0;

    if (requireMeasurement) {
      const trusted = this.trustedMeasurements.get(attestation.measurement);
      if (!trusted) {
        errors.push('Measurement not in trusted list');
      } else if (trusted.platform !== attestation.platform) {
        errors.push(
          `Measurement registered for ${trusted.platform}, not ${attestation.platform}`,
        );
      }
    }

    // ── Enclave signature verification ────────────────────────────────────
    if (attestation.enclaveAddress && attestation.signature) {
      try {
        const payload = JSON.stringify({
          platform: attestation.platform,
          measurement: attestation.measurement,
          timestamp: attestation.timestamp,
        });
        const payloadBytes = stringToU8a(payload);
        const signatureBytes = hexToU8a(attestation.signature);
        const publicKey = decodeAddress(attestation.enclaveAddress);
        const result = signatureVerify(payloadBytes, signatureBytes, publicKey);
        if (!result.isValid) {
          errors.push('Enclave signature verification failed');
        }
      } catch (err) {
        errors.push(`Signature verification error: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      errors: [],
      platform: attestation.platform,
      measurement: attestation.measurement,
    };
  }

  /** Number of registered trusted measurements */
  get size() {
    return this.trustedMeasurements.size;
  }

  /** Clear all trusted measurements */
  clear() {
    this.trustedMeasurements.clear();
  }
}
