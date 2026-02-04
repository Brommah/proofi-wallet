/**
 * Returns the target origin for postMessage calls to the parent window.
 *
 * Priority:
 * 1. Origin from wallet initialization config (set by SDK)
 * 2. Document referrer origin (the page that embedded us)
 * 3. Fallback to own origin (safe default)
 *
 * Using '*' as postMessage origin is a security risk — any page could
 * intercept wallet events. This utility ensures we always target a
 * specific origin.
 */

let configuredOrigin: string | null = null;

/**
 * Set the target origin from wallet initialization config.
 * Called by the SDK when the wallet iframe is initialized.
 */
export function setTargetOrigin(origin: string): void {
  configuredOrigin = origin;
}

/**
 * Get the target origin for parent postMessage calls.
 */
export function getTargetOrigin(): string {
  // 1. Explicitly configured origin (from SDK init)
  if (configuredOrigin) return configuredOrigin;

  // 2. Try to extract origin from document.referrer (the embedding page)
  if (typeof document !== 'undefined' && document.referrer) {
    try {
      const url = new URL(document.referrer);
      return url.origin;
    } catch {
      // Invalid referrer URL, fall through
    }
  }

  // 3. Fallback to own origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '*'; // Last resort (SSR/testing)
}
