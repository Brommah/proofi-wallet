import { MessageChannel } from './MessageChannel';
import type { ChannelConfig, Message, MessageError } from './types';
import { ErrorCodes } from './types';
import { generateId } from './utils';

export type RpcHandler = (method: string, params: unknown) => Promise<unknown>;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * JSON-RPC layer on top of MessageChannel.
 *
 * SDK side (parent window):
 *   const rpc = new RpcChannel({ targetOrigin: '*', targetWindow: iframe.contentWindow });
 *   const address = await rpc.request('wallet_connect', { appId: 'my-app' });
 *
 * UI side (iframe):
 *   const rpc = new RpcChannel({ targetOrigin: '*', targetWindow: window.parent });
 *   rpc.onRequest(async (method, params) => { ... return result; });
 */
export class RpcChannel {
  private channel: MessageChannel;
  private handler: RpcHandler | null = null;
  private pending = new Map<string, PendingRequest>();
  private sentRequestIds = new Set<string>();
  private timeout: number;

  constructor(config: ChannelConfig) {
    this.timeout = config.timeout ?? 30_000;
    this.channel = new MessageChannel(config);
    this.channel.onMessage((msg) => this.handleMessage(msg));
  }

  /** Register a handler for incoming RPC requests. */
  onRequest(handler: RpcHandler): void {
    this.handler = handler;
  }

  /** Send an RPC request and wait for the response. */
  async request<T = unknown>(method: string, params?: unknown): Promise<T> {
    const id = generateId();
    const msg: Message = {
      id,
      type: 'request',
      method,
      params,
      source: 'proofi-wallet',
    };

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(
          Object.assign(new Error(`RPC timeout: ${method}`), {
            code: ErrorCodes.TIMEOUT,
          }),
        );
      }, this.timeout);

      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v as T);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
        timer,
      });

      this.sentRequestIds.add(id);
      this.channel.send(msg);
    });
  }

  /** Send an event (fire-and-forget). */
  emit(event: string, data?: unknown): void {
    this.channel.sendEvent(event, data);
  }

  /** Access the underlying MessageChannel (e.g. for WalletEventEmitter). */
  get messageChannel(): MessageChannel {
    return this.channel;
  }

  /** Tear down: destroy the channel and reject all pending requests. */
  destroy(): void {
    for (const [, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(
        Object.assign(new Error('RPC channel destroyed'), {
          code: ErrorCodes.TIMEOUT,
        }),
      );
    }
    this.pending.clear();
    this.handler = null;
    this.channel.destroy();
  }

  // ── private ──

  private async handleMessage(msg: Message): Promise<void> {
    if (msg.type === 'response') {
      const pending = this.pending.get(msg.id);
      if (pending) {
        this.pending.delete(msg.id);
        this.sentRequestIds.delete(msg.id);
        if (msg.error) {
          const err = Object.assign(new Error(msg.error.message), {
            code: msg.error.code,
            data: msg.error.data,
          });
          pending.reject(err);
        } else {
          pending.resolve(msg.result);
        }
      }
      return;
    }

    if (msg.type === 'request') {
      // Skip requests we sent ourselves (relevant when both sides share a window in tests)
      if (this.sentRequestIds.has(msg.id)) return;
      if (!this.handler) {
        this.channel.sendResponse(msg.id, msg.method, undefined, {
          code: ErrorCodes.METHOD_NOT_FOUND,
          message: `No request handler registered`,
        });
        return;
      }

      try {
        const result = await this.handler(msg.method, msg.params);
        this.channel.sendResponse(msg.id, msg.method, result);
      } catch (err: unknown) {
        const error: MessageError =
          typeof err === 'object' && err !== null && 'code' in err
            ? { code: (err as { code: number }).code, message: String((err as { message?: string }).message ?? err) }
            : { code: -32603, message: err instanceof Error ? err.message : String(err) };
        this.channel.sendResponse(msg.id, msg.method, undefined, error);
      }
    }
  }
}
