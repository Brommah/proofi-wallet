import EventEmitter from 'eventemitter3'
import type { WalletEvent, WalletEventHandler } from './types'
import { MessageChannel } from './MessageChannel'

/**
 * Strongly-typed event emitter for wallet lifecycle events.
 *
 * Bridges postMessage events from the MessageChannel to
 * a clean EventEmitter API for consumers.
 */
export class WalletEventEmitter {
  private emitter = new EventEmitter()
  private channel: MessageChannel | null = null

  /**
   * Bind to a MessageChannel to automatically forward wallet events.
   */
  bind(channel: MessageChannel): void {
    this.channel = channel

    const walletEvents: WalletEvent[] = [
      'connected',
      'disconnected',
      'accountChanged',
      'chainChanged',
      'ready',
      'error',
    ]

    for (const event of walletEvents) {
      channel.on(event, (data: unknown) => {
        this.emitter.emit(event, data)
      })
    }
  }

  /**
   * Subscribe to a wallet event.
   */
  on(event: WalletEvent, handler: WalletEventHandler): void {
    this.emitter.on(event, handler)
  }

  /**
   * Subscribe to a wallet event (fires once).
   */
  once(event: WalletEvent, handler: WalletEventHandler): void {
    this.emitter.once(event, handler)
  }

  /**
   * Unsubscribe from a wallet event.
   */
  off(event: WalletEvent, handler: WalletEventHandler): void {
    this.emitter.off(event, handler)
  }

  /**
   * Emit an event locally (used by the wallet iframe side).
   */
  emit(event: WalletEvent, data?: unknown): void {
    this.emitter.emit(event, data)

    // Also send through the channel if bound
    if (this.channel) {
      this.channel.sendEvent(event, data)
    }
  }

  /**
   * Remove all listeners.
   */
  removeAllListeners(): void {
    this.emitter.removeAllListeners()
  }
}
