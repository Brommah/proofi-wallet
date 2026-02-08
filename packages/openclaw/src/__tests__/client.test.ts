import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/keyring';
import { OpenClawClient } from '../index.js';
import type { CredentialSigner, AgentResponse } from '../types.js';
import nacl from 'tweetnacl';

const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('OpenClawClient', () => {
  let pair: ReturnType<InstanceType<typeof Keyring>['addFromUri']>;
  let signer: CredentialSigner;

  beforeAll(async () => {
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 42 });
    pair = keyring.addFromUri(TEST_MNEMONIC);
    signer = {
      sign: (msg) => pair.sign(msg),
      address: pair.address,
    };
  });

  describe('constructor', () => {
    it('creates a client with config', () => {
      const client = new OpenClawClient({
        agentUrl: 'https://openclaw.near.ai/agent/test',
        agentId: 'test.near',
      });

      expect(client.agentUrl).toBe('https://openclaw.near.ai/agent/test');
      expect(client.agentId).toBe('test.near');
    });
  });

  describe('init', () => {
    it('initialises crypto without error', async () => {
      const client = new OpenClawClient({
        agentUrl: 'https://openclaw.near.ai/agent/test',
        agentId: 'test.near',
      });

      await expect(client.init()).resolves.not.toThrow();
    });

    it('is idempotent', async () => {
      const client = new OpenClawClient({
        agentUrl: 'https://openclaw.near.ai/agent/test',
        agentId: 'test.near',
      });

      await client.init();
      await expect(client.init()).resolves.not.toThrow();
    });
  });

  describe('buildRequest', () => {
    it('throws if not initialised', () => {
      const client = new OpenClawClient({
        agentUrl: 'https://openclaw.near.ai/agent/test',
        agentId: 'test.near',
      });

      expect(() => client.buildRequest(signer, { test: true })).toThrow(
        'not initialised',
      );
    });

    it('builds a signed request', async () => {
      const client = new OpenClawClient({
        agentUrl: 'https://openclaw.near.ai/agent/test',
        agentId: 'test.near',
      });
      await client.init();

      const request = client.buildRequest(signer, { action: 'store' });

      expect(request.signer).toBe(pair.address);
      expect(request.payload).toEqual({ action: 'store' });
      expect(request.signature).toMatch(/^0x[0-9a-f]+$/);
      expect(request.timestamp).toBeTruthy();
      expect(request.nonce).toBeTruthy();
    });
  });

  describe('encryptMemory', () => {
    it('throws if TEE public key is not configured', async () => {
      const client = new OpenClawClient({
        agentUrl: 'https://openclaw.near.ai/agent/test',
        agentId: 'test.near',
      });
      await client.init();

      expect(() => client.encryptMemory({ key: 'value' })).toThrow(
        'TEE public key not configured',
      );
    });

    it('encrypts object data for TEE', async () => {
      const teeKeyPair = nacl.box.keyPair();
      const client = new OpenClawClient({
        agentUrl: 'https://openclaw.near.ai/agent/test',
        agentId: 'test.near',
        teePublicKey: teeKeyPair.publicKey,
      });
      await client.init();

      const envelope = client.encryptMemory({ memory: 'user prefers dark mode' });

      expect(envelope.ciphertext).toBeInstanceOf(Uint8Array);
      expect(envelope.ephemeralPublicKey.length).toBe(32);
      expect(envelope.nonce.length).toBe(24);
    });

    it('encrypts raw Uint8Array data', async () => {
      const teeKeyPair = nacl.box.keyPair();
      const client = new OpenClawClient({
        agentUrl: 'https://openclaw.near.ai/agent/test',
        agentId: 'test.near',
        teePublicKey: teeKeyPair.publicKey,
      });
      await client.init();

      const rawData = new TextEncoder().encode('raw bytes');
      const envelope = client.encryptMemory(rawData);

      expect(envelope.ciphertext).toBeInstanceOf(Uint8Array);
    });

    it('throws if not initialised', () => {
      const teeKeyPair = nacl.box.keyPair();
      const client = new OpenClawClient({
        agentUrl: 'https://openclaw.near.ai/agent/test',
        agentId: 'test.near',
        teePublicKey: teeKeyPair.publicKey,
      });

      expect(() => client.encryptMemory({ key: 'value' })).toThrow(
        'not initialised',
      );
    });
  });

  describe('send', () => {
    it('throws if not initialised', async () => {
      const client = new OpenClawClient({
        agentUrl: 'https://openclaw.near.ai/agent/test',
        agentId: 'test.near',
      });

      await expect(client.send(signer, { test: true })).rejects.toThrow(
        'not initialised',
      );
    });

    it('sends a signed request via fetch', async () => {
      const mockResponse: AgentResponse = {
        payload: { result: 'success' },
        timestamp: new Date().toISOString(),
        agentId: 'test.near',
        signature: '0xdead',
        nonce: '0xbeef',
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const client = new OpenClawClient({
        agentUrl: 'https://openclaw.near.ai/agent/test',
        agentId: 'test.near',
      });
      await client.init();

      const response = await client.send(signer, { action: 'query' });

      expect(response.payload.result).toBe('success');
      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://openclaw.near.ai/agent/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('throws on non-ok response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const client = new OpenClawClient({
        agentUrl: 'https://openclaw.near.ai/agent/test',
        agentId: 'test.near',
      });
      await client.init();

      await expect(client.send(signer, {})).rejects.toThrow(
        'Agent request failed: 500',
      );
    });
  });
});
