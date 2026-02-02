import type { Message, MessageError, ChannelConfig } from './types'
import { ErrorCodes } from './types'
import { MessageChannel } from './MessageChannel'

/** Handler for incoming RPC requests */
export type RpcHandler<TParams = unknown, TResult = unknown> = (
  params: TParams,
) => TResult | Promise<TResult>

/**
 * RPC layer on top of MessageChannel.
 *
 * Allows registering method handlers (wallet side) and making
 * typed RPC calls (host side). Supports middleware patterns.
 */
export class RpcChannel {
  private channel: MessageChannel
  private handlers = new Map<string, RpcHandler>()

  constructor(config: ChannelConfig) {
    this.channel = new MessageChannel(config)
    this.channel.on('request', this.handleIncomingRequest.bind(this))
  }

  /** Access the underlying message channel for event subscription */
  get messages(): MessageChannel {
    return this.channel
  }

  /**
   * Register a handler for an RPC method.
   * Used on the wallet side to respond to SDK requests.
   */
  registerMethod<TParams = unknown, TResult = unknown>(
    method: string,
    handler: RpcHandler<TParams, TResult>,
  ): void {
    this.handlers.set(method, handler as RpcHandler)
  }

  /**
   * Remove a registered method handler.
   */
  unregisterMethod(method: string): void {
    this.handlers.delete(method)
  }

  /**
   * Make an RPC call (request + wait for response).
   */
  async call<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult> {
    return this.channel.request<TParams, TResult>(method, params)
  }

  /**
   * Fire an event to the other side.
   */
  notify<T = unknown>(event: string, data?: T): void {
    this.channel.sendEvent(event, data)
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this.handlers.clear()
    this.channel.dispose()
  }

  private async handleIncomingRequest(message: Message): Promise<void> {
    const handler = this.handlers.get(message.method)

    if (!handler) {
      this.channel.respondError(message.id, message.method, {
        code: ErrorCodes.METHOD_NOT_FOUND,
        message: `Method "${message.method}" not found`,
      })
      return
    }

    try {
      const result = await handler(message.params)
      this.channel.respond(message.id, message.method, result)
    } catch (err) {
      const error: MessageError =
        typeof err === 'object' && err !== null && 'code' in err
          ? (err as MessageError)
          : {
              code: ErrorCodes.INTERNAL_ERROR,
              message: err instanceof Error ? err.message : 'Unknown error',
            }

      this.channel.respondError(message.id, message.method, error)
    }
  }
}
