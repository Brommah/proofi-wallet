/**
 * @proofi/openclaw — Proofi ↔ ProofiAgent integration SDK
 *
 * Lets ProofiAgent agents (NEAR AI DDC) authenticate and store
 * memory using Proofi credentials and sr25519 signing.
 */
export const VERSION = '0.1.0';

export {
  signAgentRequest,
  verifyAgentResponse,
  encryptForDDC,
  decryptFromDDC,
  ensureCryptoReady,
  canonicalise,
  generateNonce,
} from './auth.js';

export type {
  ProofiAgentConfig,
  AgentRequest,
  AgentResponse,
  VerificationResult,
  DDCEncryptedEnvelope,
  CredentialSigner,
  AgentMemory,
  AgentKeyType,
} from './types.js';

import { u8aToHex } from '@polkadot/util';
import {
  ensureCryptoReady,
  signAgentRequest,
  verifyAgentResponse,
  encryptForDDC,
  canonicalise,
} from './auth.js';
import type {
  ProofiAgentConfig,
  AgentRequest,
  AgentResponse,
  CredentialSigner,
  VerificationResult,
  DDCEncryptedEnvelope,
} from './types.js';

/**
 * Client for communicating with ProofiAgent agents via Proofi credentials.
 *
 * @example
 * ```ts
 * const client = new ProofiAgentClient({
 *   agentUrl: 'https://openclaw.near.ai/agent/my-agent',
 *   agentId: 'my-agent.near',
 * });
 * await client.init();
 *
 * const signer = { sign: (msg) => pair.sign(msg), address: pair.address };
 * const response = await client.send(signer, { action: 'query', data: '...' });
 * ```
 */
export class ProofiAgentClient {
  private config: ProofiAgentConfig;
  private ready = false;

  constructor(config: ProofiAgentConfig) {
    this.config = {
      timeoutMs: 30_000,
      ...config,
    };
  }

  /** Initialise WASM crypto. Must be called before signing/verifying. */
  async init(): Promise<void> {
    if (this.ready) return;
    await ensureCryptoReady();
    this.ready = true;
  }

  private ensureReady(): void {
    if (!this.ready) {
      throw new Error('ProofiAgentClient not initialised — call init() first');
    }
  }

  /** Get the configured agent URL */
  get agentUrl(): string {
    return this.config.agentUrl;
  }

  /** Get the configured agent ID */
  get agentId(): string {
    return this.config.agentId;
  }

  /**
   * Sign and send a request to the ProofiAgent agent.
   *
   * @param signer - Proofi credential signer
   * @param payload - Request data
   * @returns The agent's response (verified if DDC public key is set)
   */
  async send(
    signer: CredentialSigner,
    payload: Record<string, unknown>,
  ): Promise<AgentResponse> {
    this.ensureReady();

    const request = signAgentRequest(signer, payload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(this.config.agentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Agent request failed: ${res.status} ${res.statusText}`);
      }

      const response: AgentResponse = await res.json();
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Send a request and verify the agent's response signature.
   *
   * @param signer - Proofi credential signer
   * @param payload - Request data
   * @param agentPublicKeyOrAddress - Agent's public key or SS58 address for verification
   * @returns Object with the response and verification result
   */
  async sendAndVerify(
    signer: CredentialSigner,
    payload: Record<string, unknown>,
    agentPublicKeyOrAddress: string | Uint8Array,
  ): Promise<{ response: AgentResponse; verification: VerificationResult }> {
    const response = await this.send(signer, payload);
    const verification = verifyAgentResponse(response, agentPublicKeyOrAddress);
    return { response, verification };
  }

  /**
   * Encrypt data for DDC-secured agent memory storage.
   *
   * @param data - Data to encrypt (will be JSON-serialised if object)
   * @returns DDCEncryptedEnvelope ready for agent storage
   * @throws Error if DDC public key is not configured
   */
  encryptMemory(data: Record<string, unknown> | Uint8Array): DDCEncryptedEnvelope {
    this.ensureReady();

    if (!this.config.teePublicKey) {
      throw new Error('DDC public key not configured — set teePublicKey in config');
    }

    const dataBytes =
      data instanceof Uint8Array
        ? data
        : new TextEncoder().encode(canonicalise(data));

    return encryptForDDC(dataBytes, this.config.teePublicKey);
  }

  /**
   * Build a signed agent request without sending it.
   * Useful for offline signing or custom transport.
   */
  buildRequest(
    signer: CredentialSigner,
    payload: Record<string, unknown>,
  ): AgentRequest {
    this.ensureReady();
    return signAgentRequest(signer, payload);
  }
}
