import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Set up global mocks before importing modules ──

type Listener = (event: { data: unknown; origin: string }) => void;
const listeners: Listener[] = [];

const addEventListenerMock = vi.fn((type: string, listener: Listener) => {
  if (type === 'message') listeners.push(listener);
});
const removeEventListenerMock = vi.fn((type: string, listener: Listener) => {
  if (type === 'message') {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  }
});

(globalThis as Record<string, unknown>).window = globalThis;
(globalThis as Record<string, unknown>).addEventListener = addEventListenerMock;
(globalThis as Record<string, unknown>).removeEventListener = removeEventListenerMock;

// Now import
const { RpcChannel } = await import('../RpcChannel');

function createMockWindow() {
  return {
    postMessage: vi.fn((data: unknown, _origin: string) => {
      const event = { data, origin: 'http://localhost' };
      queueMicrotask(() => {
        for (const listener of [...listeners]) {
          listener(event);
        }
      });
    }),
  } as unknown as Window;
}

describe('RpcChannel', () => {
  let mockWindow: Window;
  let rpcA: InstanceType<typeof RpcChannel>;
  let rpcB: InstanceType<typeof RpcChannel>;

  beforeEach(() => {
    listeners.length = 0;
    addEventListenerMock.mockClear();
    removeEventListenerMock.mockClear();

    mockWindow = createMockWindow();

    // Both sides talk through the same mock window (simulates parent ↔ iframe)
    rpcA = new RpcChannel({
      targetOrigin: 'http://localhost',
      targetWindow: mockWindow,
      timeout: 5000,
    });

    rpcB = new RpcChannel({
      targetOrigin: 'http://localhost',
      targetWindow: mockWindow,
      timeout: 5000,
    });
  });

  afterEach(() => {
    rpcA.destroy();
    rpcB.destroy();
  });

  it('should send a request and receive a response', async () => {
    rpcB.onRequest(async (method, _params) => {
      if (method === 'wallet_connect') {
        return { address: '0xABC123' };
      }
      throw new Error('Unknown method');
    });

    const result = await rpcA.request('wallet_connect', { appId: 'test-app' });
    expect(result).toEqual({ address: '0xABC123' });
  });

  it('should propagate errors from the handler', async () => {
    rpcB.onRequest(async () => {
      throw Object.assign(new Error('User rejected'), { code: 4001 });
    });

    await expect(rpcA.request('wallet_signMessage', { message: 'hi' }))
      .rejects.toMatchObject({ message: 'User rejected', code: 4001 });
  });

  it('should timeout if no response comes', async () => {
    const lonelyRpc = new RpcChannel({
      targetOrigin: 'http://localhost',
      targetWindow: { postMessage: vi.fn() } as unknown as Window,
      timeout: 50,
    });

    await expect(lonelyRpc.request('wallet_connect'))
      .rejects.toMatchObject({ code: -32000 });

    lonelyRpc.destroy();
  });

  it('should return METHOD_NOT_FOUND when no handler is registered', async () => {
    const freshRpc = new RpcChannel({
      targetOrigin: 'http://localhost',
      targetWindow: mockWindow,
      timeout: 5000,
    });

    // rpcA sends request → freshRpc receives it but has no handler → sends error
    await expect(rpcA.request('unknown_method'))
      .rejects.toMatchObject({ code: -32601 });

    freshRpc.destroy();
  });
});
