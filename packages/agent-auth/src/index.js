/**
 * @proofi/openclaw-auth — Agent authentication for ProofiAgent
 *
 * Responsibilities:
 * - Agent session management (generate, validate, revoke)
 * - Credential access grants (grant, check, revoke)
 * - DDC attestation verification
 */
export const VERSION = '0.1.0';

export { AgentAuthenticator } from './AgentAuthenticator.js';
export { CredentialGrantManager } from './CredentialGrant.js';
export { DDCVerificationVerifier, DDCPlatform } from './DDCVerification.js';
export { PermissionLevel, SessionStatus } from './types.js';
