/**
 * @proofi/core — Key management & signing engine
 *
 * Responsibilities:
 * - Multi-keypair management (manifest-based key selection)
 * - Ed25519 / Sr25519 signing
 * - Deterministic key derivation from email
 * - Scoped signing (tag-query based key selection)
 * - Verifiable credential building & verification
 */
export const VERSION = '0.1.0';
export { KeyringManager } from './keyring/KeyringManager.js';
export * as CredentialBuilder from './credentials/CredentialBuilder.js';
export * as CredentialVerifier from './credentials/CredentialVerifier.js';
//# sourceMappingURL=index.js.map