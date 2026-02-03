import type { RpcChannel } from '@proofi/comm';
import type { Provider } from './types';

/**
 * Basic chain provider that routes all requests through the wallet iframe via RPC.
 */
export class ProofiProvider implements Provider {
  private rpc: RpcChannel;

  constructor(rpc: RpcChannel) {
    this.rpc = rpc;
  }

  async request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T> {
    return this.rpc.request<T>('provider_request', args);
  }
}
