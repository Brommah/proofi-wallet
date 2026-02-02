import EventEmitter from 'eventemitter3'
import type { Message, MessageError, ChannelConfig, WalletEvent } from './types'
import { ErrorCodes } from './types'
import { generateId, isProofiMessage } from './utils'

interface PendingRequest {
  resolve: (result: unknown) => void
  reject: (error: MessageError) => void
  timer: ReturnType<typeof setTimeout>
}

type ChannelEvents = {
  [K in WalletEvent]: (data: unknown) => void
} & {
  message: (msg: Message) => void
  request: (msg: Message) => void
}

/**
 * Typed postMessage communication channel.
 *
 * Handles RPC request/response correlation, event dispatch,
 * and security (origin validation).
 */
export class MessageChannel extends EventEmitter<ChannelEvents> {
  private target: Window
  private targetOrigin: string
  private timeout: number
  private pending = new Map<string, PendingRequest>()
  private disposed = false
  private boundHandler: (event: MessageEvent) => void

  constructor(config: ChannelConfig) {
    super()
    this.target = config.target
    this.targetOrigin = config.targetOrigin
    this.timeout = config.timeout ?? 30_000
    this.boundHandler = this.handleMessage.bind(this)

    window.addEventListener('message', this.boundHandler)
  }

  /**
   * Send an RPC request and wait for the response.
   */
  async request<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult> {
    if (this.disposed) {
      throw new Error('MessageChannel is disposed')
    }

    const id = generateId()
    const message: Message<TParams> = {
      id,
      type: 'request',
      method,
      params,
    }

    return new Promise<TResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject({
          code: ErrorCodes.TIMEOUT,
          message: `Request "${method}" timed out after ${this.timeout}ms`,
        })
      }, this.timeout)

      this.pending.set(id, {
        resolve: resolve as (result: unknown) => void,
        reject,
        timer,
      })

      this.postMessage(message)
    })
  }

  /**
   * Send a one-way event (no response expected).
   */
  sendEvent<T = unknown>(event: string, data?: T): void {
    if (this.disposed) return

    const message: Message<T> = {
      id: generateId(),
      type: 'event',
      method: event,
      params: data,
    }

    this.postMessage(message)
  }

  /**
   * Send a response to an incoming request.
   */
  respond<T = unknown>(requestId: string, method: string, result: T): void {
    if (this.disposed) return

    const message: Message<T> = {
      id: requestId,
      type: 'response',
      method,
      result,
    }

    this.postMessage(message)
  }

  /**
   * Send an error response to an incoming request.
   */
  respondError(requestId: string, method: string, error: MessageError): void {
    if (this.disposed) return

    const message: Message = {
      id: requestId,
      type: 'response',
      method,
      error,
    }

    this.postMessage(message)
  }

  /**
   * Clean up: remove listeners and reject pending requests.
   */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true

    window.removeEventListener('message', this.boundHandler)

    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer)
      pending.reject({
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Channel disposed',
      })
    }
    this.pending.clear()
    this.removeAllListeners()
  }

  private postMessage(message: Message): void {
    try {
      this.target.postMessage(message, this.targetOrigin)
    } catch (err) {
      // Target window may be closed
      console.warn('[proofi-comm] Failed to post message:', err)
    }
  }

  private handleMessage(event: MessageEvent): void {
    // Origin validation
    if (this.targetOrigin !== '*' && event.origin !== this.targetOrigin) {
      return
    }

    const data = event.data
    if (!isProofiMessage(data)) return

    const message = data as Message

    this.emit('message', message)

    switch (message.type) {
      case 'response':
        this.handleResponse(message)
        break
      case 'event':
        this.handleEvent(message)
        break
      case 'request':
        this.emit('request', message)
        break
    }
  }

  private handleResponse(message: Message): void {
    const pending = this.pending.get(message.id)
    if (!pending) return

    clearTimeout(pending.timer)
    this.pending.delete(message.id)

    if (message.error) {
      pending.reject(message.error)
    } else {
      pending.resolve(message.result)
    }
  }

  private handleEvent(message: Message): void {
    // Emit the specific event type
    const event = message.method as WalletEvent
    this.emit(event, message.params)
  }
}
