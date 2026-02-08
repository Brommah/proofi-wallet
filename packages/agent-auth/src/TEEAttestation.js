/**
 * @module DDCVerification
 * Verifies Trusted Execution Environment (DDC) attestation reports.
 *
 * Ensures ProofiAgent agents are running inside a valid DDC bucket
 * before granting access to sensitive credentials.
 */
import { cryptoWaitReady, signatureVerify, decodeAddress } from '@polkadot/util-crypto';
import { hexToU8a, stringToU8a } from '@polkadot/util';

/** Supported DDC platforms */
export const DDCPlatform = {
  SGX: 'sgx',
  SEV: 'sev',
  TDX: 'tdx',
  NITRO: 'nitro',
};

const SUPPORTED_PLATFORMS = new Set(Object.values(DDCPlatform));

/**
 * DDCVerificationVerifier validates that an agent runs inside a legitimate DDC.
 *
 * @example
 * ```js
 * const verifier = new DDCVerificationVerifier();
 * await verifier.init();
 * const result = verifier.verifyDDCVerification(attestation);
 * if (result.valid) { // agent is trusted }
 * ```
 */
export class DDCVerificationVerifier {
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
      throw new Error('DDCVerificationVerifier not initialised — call init() first');
    }
  }

  /**
   * Register a trusted bucket measurement (MRENCLAVE / launch digest).
   *
   * @param {string} platform - DDC platform ('sgx', 'sev', 'tdx', 'nitro')
   * @param {string} measurement - Hex-encoded measurement hash
   * @param {string} [label] - Human-readable label
   */
  registerTrustedMeasurement(platform, measurement, label) {
    this.ensureReady();

    if (!SUPPORTED_PLATFORMS.has(platform)) {
      throw new Error(
        `Unsupported DDC platform: ${platform}. Supported: ${[...SUPPORTED_PLATFORMS].join(', ')}`,
      );
    }

    if (!measurement || typeof measurement !== 'string') {
      throw new Error('measurement is required');
    }

    this.trustedMeasurements.set(measurement, { platform, label: label || null });
  }

  /**
   * Verify a DDC attestation report.
   *
   * Checks:
   * 1. Attestation structure is valid
   * 2. Platform is supported
   * 3. Measurement matches a trusted value (if any registered)
   * 4. Attestation timestamp is recent (not replayed)
   * 5. Bucket signature is valid (if signer address provided)
   *
   * @param {object} attestation - The attestation report
   * @param {string} attestation.platform - DDC platform
   * @param {string} attestation.measurement - Bucket measurement hash
   * @param {string} attestation.timestamp - ISO 8601 timestamp
   * @param {string} [attestation.bucketAddress] - Signer address (sr25519)
   * @param {string} [attestation.signature] - Hex-encoded signature over payload
   * @param {object} [attestation.report] - Platform-specific report data
   * @param {object} [options] - Verification options
   * @param {number} [options.maxAgeMs] - Max attestation age in ms (default: 5 min)
   * @param {boolean} [options.requireMeasurement] - Require measurement in trusted list (default: true if list non-empty)
   * @returns {{ valid: boolean, errors: string[], platform?: string, measurement?: string }}
   */
  verifyDDCVerification(attestation, options = {}) {
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

    // ── Bucket signature verification ────────────────────────────────────
    if (attestation.bucketAddress && attestation.signature) {
      try {
        const payload = JSON.stringify({
          platform: attestation.platform,
          measurement: attestation.measurement,
          timestamp: attestation.timestamp,
        });
        const payloadBytes = stringToU8a(payload);
        const signatureBytes = hexToU8a(attestation.signature);
        const publicKey = decodeAddress(attestation.bucketAddress);
        const result = signatureVerify(payloadBytes, signatureBytes, publicKey);
        if (!result.isValid) {
          errors.push('Bucket signature verification failed');
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
