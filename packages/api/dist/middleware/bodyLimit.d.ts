/**
 * Max request body size middleware.
 * Rejects requests larger than the configured limit (default: 1MB).
 * Protects against oversized payloads / DoS attacks.
 */
export declare function maxPayloadSize(maxBytes?: number): import("hono").MiddlewareHandler;
//# sourceMappingURL=bodyLimit.d.ts.map