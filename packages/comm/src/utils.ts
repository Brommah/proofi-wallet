let counter = 0

/**
 * Generate a unique message ID.
 * Uses a combination of timestamp and incrementing counter for uniqueness.
 */
export function generateId(): string {
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER
  return `proofi_${Date.now()}_${counter}`
}

/**
 * Check if a value looks like a Proofi Message.
 */
export function isProofiMessage(data: unknown): data is { id: string; type: string; method: string } {
  if (typeof data !== 'object' || data === null) return false
  const msg = data as Record<string, unknown>
  return (
    typeof msg.id === 'string' &&
    typeof msg.type === 'string' &&
    typeof msg.method === 'string' &&
    msg.id.startsWith('proofi_')
  )
}
