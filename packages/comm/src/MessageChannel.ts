import type { Message, ChannelConfig } from './types';
import { isProofiMessage, generateId } from './utils';

export type MessageHandler = (message: Message) => void;

/**
 * Low-level postMessage wrapper.
 * Sends and receives typed Proofi wallet messages between windows (e.g. parent ↔ iframe).
 */
export class MessageChannel {
  private config: ChannelConfig;
  private handlers = new Set<MessageHandler>();
  private boundListener: (event: MessageEvent) => void;
  private destroyed = false;

  constructor(config: ChannelConfig) {
    this.config = config;
    this.boundListener = this.handleMessage.bind(this);
    const win = typeof window !== 'undefined' ? window : (globalThis as unknown as Window);
    win.addEventListener('message', this.boundListener as EventListener);
  }

  /** Send a fully-formed message to the target window. */
  send(message: Message): void {
    if (this.destroyed) return;
    this.config.targetWindow.postMessage(message, this.config.targetOrigin);
  }

  /** Send a request-type message (convenience). */
  sendRequest<T = unknown>(method: string, params?: T): string {
    const id = generateId();
    this.send({
      id,
      type: 'request',
      method,
      params,
      source: 'proofi-wallet',
    });
    return id;
  }

  /** Send a response-type message (convenience). */
  sendResponse<T = unknown>(id: string, method: string, result?: T, error?: Message['error']): void {
    this.send({
      id,
      type: 'response',
      method,
      result,
      error,
      source: 'proofi-wallet',
    });
  }

  /** Send an event-type message (convenience). */
  sendEvent<T = unknown>(method: string, params?: T): void {
    this.send({
      id: generateId(),
      type: 'event',
      method,
      params,
      source: 'proofi-wallet',
    });
  }

  /** Register a handler for incoming messages. */
  onMessage(handler: MessageHandler): void {
    this.handlers.add(handler);
  }

  /** Remove a previously registered handler. */
  offMessage(handler: MessageHandler): void {
    this.handlers.delete(handler);
  }

  /** Get the configured timeout (default 30 000 ms). */
  get timeout(): number {
    return this.config.timeout ?? 30_000;
  }

  /** Tear down: remove the global listener and clear all handlers. */
  destroy(): void {
    this.destroyed = true;
    const win = typeof window !== 'undefined' ? window : (globalThis as unknown as Window);
    win.removeEventListener('message', this.boundListener as EventListener);
    this.handlers.clear();
  }

  // ── private ──

  private handleMessage(event: MessageEvent): void {
    // Origin check
    if (this.config.targetOrigin !== '*' && event.origin !== this.config.targetOrigin) {
      return;
    }
    // Only accept Proofi wallet messages
    if (!isProofiMessage(event.data)) return;

    const message = event.data as Message;
    for (const handler of this.handlers) {
      handler(message);
    }
  }
}
