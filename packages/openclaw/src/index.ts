/**
 * @proofi/openclaw — Proofi ↔ OpenClaw integration SDK
 *
 * Lets OpenClaw agents (NEAR AI TEE) authenticate and store
 * memory using Proofi credentials and sr25519 signing.
 */
export const VERSION = '0.1.0';

export {
  signAgentRequest,
  verifyAgentResponse,
  encryptForTEE,
  decryptFromTEE,
  ensureCryptoReady,
  canonicalise,
  generateNonce,
} from './auth.js';

export type {
  OpenClawConfig,
  AgentRequest,
  AgentResponse,
  VerificationResult,
  TEEEncryptedEnvelope,
  CredentialSigner,
  AgentMemory,
  AgentKeyType,
} from './types.js';

import { u8aToHex } from '@polkadot/util';
import {
  ensureCryptoReady,
  signAgentRequest,
  verifyAgentResponse,
  encryptForTEE,
  canonicalise,
} from './auth.js';
import type {
  OpenClawConfig,
  AgentRequest,
  AgentResponse,
  CredentialSigner,
  VerificationResult,
  TEEEncryptedEnvelope,
} from './types.js';

/**
 * Client for communicating with OpenClaw agents via Proofi credentials.
 *
 * @example
 * ```ts
 * const client = new OpenClawClient({
 *   agentUrl: 'https://openclaw.near.ai/agent/my-agent',
 *   agentId: 'my-agent.near',
 * });
 * await client.init();
 *
 * const signer = { sign: (msg) => pair.sign(msg), address: pair.address };
 * const response = await client.send(signer, { action: 'query', data: '...' });
 * ```
 */
export class OpenClawClient {
  private config: OpenClawConfig;
  private ready = false;

  constructor(config: OpenClawConfig) {
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
      throw new Error('OpenClawClient not initialised — call init() first');
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
   * Sign and send a request to the OpenClaw agent.
   *
   * @param signer - Proofi credential signer
   * @param payload - Request data
   * @returns The agent's response (verified if TEE public key is set)
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
   * Encrypt data for TEE-secured agent memory storage.
   *
   * @param data - Data to encrypt (will be JSON-serialised if object)
   * @returns TEEEncryptedEnvelope ready for agent storage
   * @throws Error if TEE public key is not configured
   */
  encryptMemory(data: Record<string, unknown> | Uint8Array): TEEEncryptedEnvelope {
    this.ensureReady();

    if (!this.config.teePublicKey) {
      throw new Error('TEE public key not configured — set teePublicKey in config');
    }

    const dataBytes =
      data instanceof Uint8Array
        ? data
        : new TextEncoder().encode(canonicalise(data));

    return encryptForTEE(dataBytes, this.config.teePublicKey);
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
