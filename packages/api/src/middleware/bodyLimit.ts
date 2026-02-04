import { bodyLimit } from 'hono/body-limit';

/**
 * Max request body size middleware.
 * Rejects requests larger than the configured limit (default: 1MB).
 * Protects against oversized payloads / DoS attacks.
 */
export function maxPayloadSize(maxBytes: number = 1_048_576 /* 1MB */) {
  return bodyLimit({
    maxSize: maxBytes,
    onError: (c) => {
      return c.json(
        { error: `Request body too large. Maximum size is ${Math.round(maxBytes / 1024)}KB.` },
        413,
      );
    },
  });
}
