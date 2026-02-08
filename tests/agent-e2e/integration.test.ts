/**
 * Full Integration E2E Test — Proofi ↔ ProofiAgent
 *
 * End-to-end flow: wallet connect → DDC attestation →
 * agent authorization → credential access → action execution.
 * 
 * Uses REAL Proofi wallet with actual cryptographic operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RealProofiWallet,
  MockProofiAgentAgent,
  MockDdcVerifier,
  createRealWallet,
  createTestCredential,
  createHealthCredential,
  createAgeCredential,
  type DisclosureRequest,
} from './test-setup';

describe('Integration: Full E2E Flow', () => {
  let wallet: RealProofiWallet;
  let agent: MockProofiAgentAgent;
  let verifier: MockDdcVerifier;

  beforeEach(async () => {
    wallet = await createRealWallet();
    agent = new MockProofiAgentAgent();
    verifier = new MockDdcVerifier();
  });

  it('should complete full flow: connect → attest → authorize → access → act', () => {
    // ── Step 1: Wallet connects and DDC is verified ──
    const attestation = agent.generateAttestation();
    verifier.trustMeasurement(agent.bucketMeasurement);
    const attestResult = verifier.verify(attestation);
    expect(attestResult.valid).toBe(true);

    // ── Step 2: Wallet authorizes agent ──
    const session = agent.requestAuthorization(wallet, [
      'credential',
      'identity',
    ]);
    expect(session.active).toBe(true);
    expect(wallet.isSessionValid(session.sessionId)).toBe(true);

    // ── Step 3: Wallet loads credentials ──
    const idCred = createTestCredential({ id: 'my-id' });
    wallet.addCredential(idCred);

    // ── Step 4: Agent requests credential access ──
    const signed = agent.requestCredentialAccess(
      wallet,
      'credential:read',
      { credentialId: 'my-id' },
    );
    expect(signed).not.toBeNull();

    // ── Step 5: Agent performs action with signed credential ──
    const result = agent.performAction(signed!, 'verify-identity');
    expect(result.success).toBe(true);
    expect(result.action).toBe('verify-identity');
  });

  it('should complete flow with selective disclosure (age gate)', () => {
    // Attest
    verifier.trustMeasurement(agent.bucketMeasurement);
    expect(verifier.verify(agent.generateAttestation()).valid).toBe(true);

    // Authorize
    agent.requestAuthorization(wallet, ['credential']);

    // Add age credential
    const ageCred = createAgeCredential('1990-01-15', 36);
    wallet.addCredential(ageCred);

    // Selective disclosure: prove age >= 21 without revealing birthdate
    const request: DisclosureRequest = {
      credentialType: 'AgeCredential',
      requestedFields: [],
      predicates: [{ field: 'age', operator: '>=', value: 21 }],
    };

    const proof = wallet.createSelectiveDisclosure(ageCred.id, request);
    expect(proof).not.toBeNull();
    expect(proof!.predicateResults![0].satisfied).toBe(true);
    expect(proof!.disclosedFields).toEqual({});

    // Agent stores proof in encrypted DDC memory
    const stored = agent.storeEncrypted(
      'age-proof',
      JSON.stringify(proof),
    );
    expect(agent.verifyMemoryIntegrity('age-proof')).toBe(true);
    expect(stored.ciphertext).not.toContain('1990-01-15');
  });

  it('should handle multi-credential presentation with DDC storage', () => {
    // Attest + authorize
    verifier.trustMeasurement(agent.bucketMeasurement);
    agent.requestAuthorization(wallet, ['credential', 'health']);

    // Add credentials
    const idCred = createTestCredential({ id: 'id-1' });
    const healthCred = createHealthCredential({ id: 'health-1' });
    wallet.addCredential(idCred);
    wallet.addCredential(healthCred);

    // Present both
    const idProof = wallet.createSelectiveDisclosure('id-1', {
      credentialType: 'IdentityCredential',
      requestedFields: ['name', 'nationality'],
    });
    const healthProof = wallet.createSelectiveDisclosure('health-1', {
      credentialType: 'HealthCredential',
      requestedFields: ['vaccinationStatus'],
    });

    expect(idProof!.disclosedFields.name).toBe('Test User');
    expect(healthProof!.disclosedFields.vaccinationStatus).toBe(
      'fully_vaccinated',
    );

    // Agent stores combined presentation in encrypted memory
    agent.storeEncrypted(
      'presentation',
      JSON.stringify({ identity: idProof, health: healthProof }),
    );
    expect(agent.verifyMemoryIntegrity('presentation')).toBe(true);
  });

  it('should reject flow when DDC attestation fails', () => {
    // Trust a different measurement
    verifier.trustMeasurement('some-other-measurement');

    const attestation = agent.generateAttestation();
    const result = verifier.verify(attestation);

    expect(result.valid).toBe(false);

    // The wallet owner should NOT authorize an untrusted agent
    // (In production this would be enforced; here we verify the signal)
    expect(result.errors).toContain(
      'Bucket measurement not in trusted set',
    );
  });

  it('should reject flow when session expires mid-operation', () => {
    // Authorize with very short TTL
    const session = agent.requestAuthorization(wallet, ['credential'], 0);

    // Session already expired
    expect(wallet.isSessionValid(session.sessionId)).toBe(false);

    // Agent cannot request credential access
    const signed = agent.requestCredentialAccess(
      wallet,
      'credential:read',
      {},
    );
    expect(signed).toBeNull();
  });

  it('should recover from expired session via renewal', () => {
    // Short TTL
    const session = agent.requestAuthorization(wallet, ['credential'], 0);
    expect(wallet.isSessionValid(session.sessionId)).toBe(false);

    // Renew
    wallet.renewSession(session.sessionId, 3600_000);
    expect(wallet.isSessionValid(session.sessionId)).toBe(true);

    // Now credential access works
    const cred = createTestCredential();
    wallet.addCredential(cred);

    const signed = wallet.signAgentRequest(
      session.sessionId,
      'credential:read',
      { credentialId: cred.id },
    );
    expect(signed).not.toBeNull();
  });

  it('should handle credential revocation during active session', () => {
    agent.requestAuthorization(wallet, ['credential']);

    const cred = createTestCredential({ id: 'revocable' });
    wallet.addCredential(cred);

    // Credential works before revocation
    const proof1 = wallet.createSelectiveDisclosure('revocable', {
      credentialType: 'IdentityCredential',
      requestedFields: ['name'],
    });
    expect(proof1).not.toBeNull();

    // Revoke
    wallet.revokeCredential('revocable');
    expect(wallet.isCredentialRevoked('revocable')).toBe(true);

    // Credential data still accessible (revocation is metadata)
    const retrieved = wallet.getCredential('revocable');
    expect(retrieved!.revoked).toBe(true);
  });

  it('should isolate encrypted memory between agents', () => {
    const agent1 = new MockProofiAgentAgent('agent-alpha');
    const agent2 = new MockProofiAgentAgent('agent-beta');

    agent1.storeEncrypted('shared-key', 'agent1-secret');
    agent2.storeEncrypted('shared-key', 'agent2-secret');

    const e1 = agent1.retrieveEncrypted('shared-key');
    const e2 = agent2.retrieveEncrypted('shared-key');

    // Each agent has its own isolated memory
    expect(e1!.ciphertext).not.toBe(e2!.ciphertext);
  });

  it('should scope agent permissions correctly across multiple actions', () => {
    const session = agent.requestAuthorization(wallet, ['credential']);

    // Allowed scope
    const allowed = wallet.signAgentRequest(
      session.sessionId,
      'credential:read',
      {},
    );
    expect(allowed).not.toBeNull();

    // Also allowed (same scope prefix)
    const alsoAllowed = wallet.signAgentRequest(
      session.sessionId,
      'credential:list',
      {},
    );
    expect(alsoAllowed).not.toBeNull();

    // Denied scope
    const denied = wallet.signAgentRequest(
      session.sessionId,
      'payment:send',
      {},
    );
    expect(denied).toBeNull();
  });

  it('should handle complete lifecycle: create → use → revoke → cleanup', () => {
    // 1. DDC verification
    verifier.trustMeasurement(agent.bucketMeasurement);
    expect(verifier.verify(agent.generateAttestation()).valid).toBe(true);

    // 2. Authorization
    const session = agent.requestAuthorization(wallet, ['credential']);

    // 3. Add and use credential
    const cred = createTestCredential({ id: 'lifecycle-cred' });
    wallet.addCredential(cred);

    const signed = agent.requestCredentialAccess(
      wallet,
      'credential:read',
      { credentialId: cred.id },
    );
    expect(signed).not.toBeNull();

    const actionResult = agent.performAction(signed!, 'process-identity');
    expect(actionResult.success).toBe(true);

    // 4. Agent stores result
    agent.storeEncrypted('result', JSON.stringify(actionResult));
    expect(agent.verifyMemoryIntegrity('result')).toBe(true);

    // 5. Revoke credential
    wallet.revokeCredential(cred.id);
    expect(wallet.isCredentialRevoked(cred.id)).toBe(true);

    // 6. Revoke session
    wallet.revokeSession(session.sessionId);
    expect(wallet.isSessionValid(session.sessionId)).toBe(false);

    // 7. Agent cleans up memory
    agent.clearMemory();
    expect(agent.retrieveEncrypted('result')).toBeNull();
  });
});
