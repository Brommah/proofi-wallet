import type { Message } from './types';

/**
 * Generate a unique message ID.
 * Uses crypto.randomUUID when available, falls back to a simple random hex string.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Type guard: checks whether an unknown value is a valid Proofi wallet message.
 */
export function isProofiMessage(data: unknown): data is Message {
  if (typeof data !== 'object' || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    msg.source === 'proofi-wallet' &&
    typeof msg.id === 'string' &&
    typeof msg.type === 'string' &&
    typeof msg.method === 'string' &&
    ['request', 'response', 'event'].includes(msg.type as string)
  );
}
