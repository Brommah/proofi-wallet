import type { WalletEvent, WalletEventHandler } from './types';

/**
 * Typed event emitter for wallet lifecycle events.
 */
export class WalletEventEmitter {
  private listeners = new Map<WalletEvent, Set<WalletEventHandler>>();

  on(event: WalletEvent, handler: WalletEventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: WalletEvent, handler: WalletEventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: WalletEvent, data?: unknown): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error(`[WalletEventEmitter] Error in ${event} handler:`, err);
      }
    });
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
