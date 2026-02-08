/**
 * Test Setup — Proofi ↔ OpenClaw E2E
 *
 * Mock implementations of the OpenClaw TEE agent and Proofi identity wallet
 * used across all integration tests.
 */

import { vi } from 'vitest';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface Credential {
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id: string;
    [key: string]: unknown;
  };
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
  revoked?: boolean;
}

export interface AgentSession {
  sessionId: string;
  agentId: string;
  walletDid: string;
  scopes: string[];
  createdAt: number;
  expiresAt: number;
  active: boolean;
}

export interface TeeAttestation {
  enclaveId: string;
  measurement: string;
  timestamp: number;
  signature: string;
  platform: 'sgx' | 'sev' | 'nitro';
  valid: boolean;
}

export interface DisclosureRequest {
  credentialType: string;
  requestedFields: string[];
  predicates?: Array<{
    field: string;
    operator: '>' | '<' | '>=' | '<=' | '==';
    value: unknown;
  }>;
}

export interface DisclosedProof {
  credentialType: string;
  disclosedFields: Record<string, unknown>;
  predicateResults?: Array<{ field: string; satisfied: boolean }>;
  proof: string;
}

export interface EncryptedMemoryEntry {
  key: string;
  ciphertext: string;
  iv: string;
  tag: string;
  storedAt: number;
}

// ═══════════════════════════════════════════════════════════════════
// Mock Proofi Wallet
// ═══════════════════════════════════════════════════════════════════

export class MockProofiWallet {
  did: string;
  private credentials: Map<string, Credential> = new Map();
  private authorizedAgents: Map<string, AgentSession> = new Map();
  private privateKey: string;

  constructor(did?: string) {
    this.did = did ?? `did:proofi:${randomHex(32)}`;
    this.privateKey = randomHex(64);
  }

  /** Add a credential to the wallet */
  addCredential(credential: Credential): void {
    this.credentials.set(credential.id, credential);
  }

  /** Get a credential by id */
  getCredential(id: string): Credential | undefined {
    return this.credentials.get(id);
  }

  /** Get all credentials of a given type */
  getCredentialsByType(type: string): Credential[] {
    return [...this.credentials.values()].filter((c) =>
      c.type.includes(type),
    );
  }

  /** Authorize an agent with specific scopes */
  authorizeAgent(
    agentId: string,
    scopes: string[],
    ttlMs = 3600_000,
  ): AgentSession {
    const session: AgentSession = {
      sessionId: `session-${randomHex(16)}`,
      agentId,
      walletDid: this.did,
      scopes,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      active: true,
    };
    this.authorizedAgents.set(session.sessionId, session);
    return session;
  }

  /** Check whether an agent session is valid */
  isSessionValid(sessionId: string): boolean {
    const session = this.authorizedAgents.get(sessionId);
    if (!session) return false;
    if (!session.active) return false;
    if (Date.now() >= session.expiresAt) {
      session.active = false;
      return false;
    }
    return true;
  }

  /** Get a session by id */
  getSession(sessionId: string): AgentSession | undefined {
    return this.authorizedAgents.get(sessionId);
  }

  /** Revoke a session */
  revokeSession(sessionId: string): boolean {
    const session = this.authorizedAgents.get(sessionId);
    if (!session) return false;
    session.active = false;
    return true;
  }

  /** Renew an expired/active session */
  renewSession(sessionId: string, ttlMs = 3600_000): AgentSession | null {
    const session = this.authorizedAgents.get(sessionId);
    if (!session) return null;
    session.expiresAt = Date.now() + ttlMs;
    session.active = true;
    return session;
  }

  /** Sign a payload on behalf of the wallet */
  sign(payload: string): string {
    // Deterministic mock signature: hash of payload + private key
    return `sig:${simpleHash(payload + this.privateKey)}`;
  }

  /** Sign an agent's request after verifying session + scope */
  signAgentRequest(
    sessionId: string,
    action: string,
    payload: Record<string, unknown>,
  ): { signature: string; signedPayload: string } | null {
    const session = this.authorizedAgents.get(sessionId);
    if (!session || !this.isSessionValid(sessionId)) return null;

    // Check scope
    const actionScope = action.split(':')[0]; // e.g. "credential:read" → "credential"
    if (
      !session.scopes.includes(actionScope) &&
      !session.scopes.includes('*')
    ) {
      return null;
    }

    const signedPayload = JSON.stringify({
      action,
      payload,
      sessionId,
      timestamp: Date.now(),
    });
    return { signature: this.sign(signedPayload), signedPayload };
  }

  /**
   * Produce a selective disclosure proof.
   * Only reveals requested fields; predicates return boolean results
   * without exposing underlying data.
   */
  createSelectiveDisclosure(
    credentialId: string,
    request: DisclosureRequest,
  ): DisclosedProof | null {
    const credential = this.credentials.get(credentialId);
    if (!credential) return null;
    if (!credential.type.includes(request.credentialType)) return null;

    const disclosedFields: Record<string, unknown> = {};
    for (const field of request.requestedFields) {
      if (field in credential.credentialSubject) {
        disclosedFields[field] = credential.credentialSubject[field];
      }
    }

    const predicateResults = request.predicates?.map((pred) => {
      const value = credential.credentialSubject[pred.field];
      let satisfied = false;
      if (typeof value === 'number' && typeof pred.value === 'number') {
        switch (pred.operator) {
          case '>':
            satisfied = value > pred.value;
            break;
          case '<':
            satisfied = value < pred.value;
            break;
          case '>=':
            satisfied = value >= pred.value;
            break;
          case '<=':
            satisfied = value <= pred.value;
            break;
          case '==':
            satisfied = value === pred.value;
            break;
        }
      }
      return { field: pred.field, satisfied };
    });

    return {
      credentialType: request.credentialType,
      disclosedFields,
      predicateResults,
      proof: `zkp:${simpleHash(JSON.stringify(disclosedFields))}`,
    };
  }

  /** Revoke a credential in the wallet */
  revokeCredential(credentialId: string): boolean {
    const cred = this.credentials.get(credentialId);
    if (!cred) return false;
    cred.revoked = true;
    return true;
  }

  /** Check if a credential is revoked */
  isCredentialRevoked(credentialId: string): boolean {
    return this.credentials.get(credentialId)?.revoked === true;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Mock OpenClaw Agent (TEE)
// ═══════════════════════════════════════════════════════════════════

export class MockOpenClawAgent {
  agentId: string;
  enclaveMeasurement: string;
  private encryptedMemory: Map<string, EncryptedMemoryEntry> = new Map();
  private encryptionKey: string;
  private currentSession: AgentSession | null = null;

  constructor(agentId?: string) {
    this.agentId = agentId ?? `agent-${randomHex(8)}`;
    this.enclaveMeasurement = randomHex(64);
    this.encryptionKey = randomHex(32);
  }

  /** Produce a TEE attestation report */
  generateAttestation(platform: TeeAttestation['platform'] = 'nitro'): TeeAttestation {
    return {
      enclaveId: this.agentId,
      measurement: this.enclaveMeasurement,
      timestamp: Date.now(),
      signature: `att:${simpleHash(this.enclaveMeasurement + Date.now())}`,
      platform,
      valid: true,
    };
  }

  /** Request authorization from a wallet */
  requestAuthorization(
    wallet: MockProofiWallet,
    scopes: string[],
    ttlMs?: number,
  ): AgentSession {
    const session = wallet.authorizeAgent(this.agentId, scopes, ttlMs);
    this.currentSession = session;
    return session;
  }

  /** Get the current session */
  getSession(): AgentSession | null {
    return this.currentSession;
  }

  /** Request a credential from the wallet via the active session */
  requestCredentialAccess(
    wallet: MockProofiWallet,
    action: string,
    payload: Record<string, unknown>,
  ): { signature: string; signedPayload: string } | null {
    if (!this.currentSession) return null;
    return wallet.signAgentRequest(
      this.currentSession.sessionId,
      action,
      payload,
    );
  }

  /** Perform an action using a signed credential */
  performAction(
    signedResult: { signature: string; signedPayload: string },
    action: string,
  ): { success: boolean; action: string; result: string } {
    // In a real system this would verify the signature and execute in TEE
    return {
      success: true,
      action,
      result: `Executed ${action} with sig ${signedResult.signature.slice(0, 12)}...`,
    };
  }

  /** Store data in encrypted TEE memory */
  storeEncrypted(key: string, plaintext: string): EncryptedMemoryEntry {
    const iv = randomHex(24);
    const ciphertext = simpleHash(plaintext + this.encryptionKey + iv);
    const tag = simpleHash(ciphertext + this.encryptionKey);

    const entry: EncryptedMemoryEntry = {
      key,
      ciphertext,
      iv,
      tag,
      storedAt: Date.now(),
    };
    this.encryptedMemory.set(key, entry);
    return entry;
  }

  /** Retrieve + "decrypt" from TEE memory */
  retrieveEncrypted(key: string): EncryptedMemoryEntry | null {
    return this.encryptedMemory.get(key) ?? null;
  }

  /** Verify that encrypted memory is intact (tag check) */
  verifyMemoryIntegrity(key: string): boolean {
    const entry = this.encryptedMemory.get(key);
    if (!entry) return false;
    const expectedTag = simpleHash(entry.ciphertext + this.encryptionKey);
    return entry.tag === expectedTag;
  }

  /** Clear encrypted memory */
  clearMemory(): void {
    this.encryptedMemory.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEE Attestation Verifier (mock)
// ═══════════════════════════════════════════════════════════════════

export class MockTeeVerifier {
  private trustedMeasurements: Set<string> = new Set();

  /** Register a measurement as trusted */
  trustMeasurement(measurement: string): void {
    this.trustedMeasurements.add(measurement);
  }

  /** Verify a TEE attestation */
  verify(attestation: TeeAttestation): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!attestation.valid) {
      errors.push('Attestation marked as invalid');
    }

    if (!attestation.signature) {
      errors.push('Missing attestation signature');
    }

    if (!attestation.measurement) {
      errors.push('Missing enclave measurement');
    }

    if (
      this.trustedMeasurements.size > 0 &&
      !this.trustedMeasurements.has(attestation.measurement)
    ) {
      errors.push('Enclave measurement not in trusted set');
    }

    // Check attestation freshness (5 min window)
    const age = Date.now() - attestation.timestamp;
    if (age > 5 * 60 * 1000) {
      errors.push('Attestation is stale');
    }

    return { valid: errors.length === 0, errors };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Test Helpers
// ═══════════════════════════════════════════════════════════════════

/** Create a credential with sensible defaults */
export function createTestCredential(
  overrides: Partial<Credential> = {},
): Credential {
  const id = overrides.id ?? `cred-${randomHex(8)}`;
  return {
    id,
    type: ['VerifiableCredential', 'IdentityCredential'],
    issuer: `did:proofi:issuer-${randomHex(8)}`,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: `did:proofi:subject-${randomHex(8)}`,
      name: 'Test User',
      dateOfBirth: '1990-01-15',
      age: 36,
      nationality: 'NL',
    },
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `did:proofi:issuer#key-1`,
      proofPurpose: 'assertionMethod',
      proofValue: randomHex(128),
    },
    ...overrides,
  };
}

/** Create a health credential */
export function createHealthCredential(
  overrides: Partial<Credential> = {},
): Credential {
  return createTestCredential({
    type: ['VerifiableCredential', 'HealthCredential'],
    credentialSubject: {
      id: `did:proofi:subject-${randomHex(8)}`,
      vaccinationStatus: 'fully_vaccinated',
      bloodType: 'A+',
      lastCheckup: '2025-12-01',
      insuranceProvider: 'VGZ',
    },
    ...overrides,
  });
}

/** Create an age credential for selective disclosure tests */
export function createAgeCredential(
  birthdate: string,
  age: number,
): Credential {
  return createTestCredential({
    type: ['VerifiableCredential', 'AgeCredential'],
    credentialSubject: {
      id: `did:proofi:subject-${randomHex(8)}`,
      dateOfBirth: birthdate,
      age,
    },
  });
}

/** Simple non-cryptographic hash for deterministic test output */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // 32-bit int
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/** Random hex string */
function randomHex(length: number): string {
  return Array.from({ length }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
}
