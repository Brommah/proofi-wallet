/**
 * @proofi/openclaw-auth — Agent authentication for OpenClaw
 *
 * Responsibilities:
 * - Agent session management (generate, validate, revoke)
 * - Credential access grants (grant, check, revoke)
 * - TEE attestation verification
 */
export const VERSION = '0.1.0';

export { AgentAuthenticator } from './AgentAuthenticator.js';
export { CredentialGrantManager } from './CredentialGrant.js';
export { TEEAttestationVerifier, TEEPlatform } from './TEEAttestation.js';
export { PermissionLevel, SessionStatus } from './types.js';
