import type { RpcChannel } from '@proofi/comm';
import type { Signer, SignerPayload, SignerResult } from './types';

/**
 * Signer implementation that delegates all signing to the wallet iframe via RPC.
 */
export class ProofiSigner implements Signer {
  private walletAddress: string;
  private rpc: RpcChannel;

  constructor(rpc: RpcChannel, address: string) {
    this.rpc = rpc;
    this.walletAddress = address;
  }

  getAddress(): string {
    return this.walletAddress;
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    const messageStr =
      message instanceof Uint8Array
        ? Array.from(message)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
        : message;

    return this.rpc.request<string>(
      'wallet_signMessage',
      { address: this.walletAddress, message: messageStr },
    );
  }

  async signPayload(payload: SignerPayload): Promise<SignerResult> {
    return this.rpc.request<SignerResult>(
      'wallet_signPayload',
      { address: this.walletAddress, payload },
    );
  }
}
