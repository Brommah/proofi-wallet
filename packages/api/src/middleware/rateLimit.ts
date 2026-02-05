import type { Context, Next } from 'hono';

/**
 * In-memory sliding window rate limiter.
 * Tracks request timestamps per key (IP) within a time window.
 * No external dependencies needed — fully in-memory (stateless on restart).
 */

interface WindowEntry {
  timestamps: number[];
}

class SlidingWindowRateLimiter {
  private windows = new Map<string, WindowEntry>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Periodic cleanup of expired entries (every 60s)
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
    // Don't block Node from exiting
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  /**
   * Check if a request is allowed for the given key.
   * Returns { allowed, remaining, retryAfterMs }.
   */
  check(key: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let entry = this.windows.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.windows.set(key, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    if (entry.timestamps.length >= this.maxRequests) {
      // Calculate when the oldest request in window will expire
      const oldestInWindow = entry.timestamps[0]!;
      const retryAfterMs = oldestInWindow + this.windowMs - now;
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(retryAfterMs, 0),
      };
    }

    entry.timestamps.push(now);
    return {
      allowed: true,
      remaining: this.maxRequests - entry.timestamps.length,
      retryAfterMs: 0,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [key, entry] of this.windows) {
      entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
      if (entry.timestamps.length === 0) {
        this.windows.delete(key);
      }
    }
  }
}

// ── Rate limiter instances ──

/** 5 OTP sends per minute per IP */
const otpLimiter = new SlidingWindowRateLimiter(60_000, 5);

/** 20 DDC operations per minute per IP */
const ddcLimiter = new SlidingWindowRateLimiter(60_000, 20);

/** 100 requests per minute per IP (global) */
const globalLimiter = new SlidingWindowRateLimiter(60_000, 100);

// ── Helpers ──

function getClientIp(c: Context): string {
  // Check common proxy headers
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]!.trim();
  }
  const realIp = c.req.header('x-real-ip');
  if (realIp) return realIp;
  // Fallback - Hono doesn't expose raw socket, use a generic key
  return 'unknown';
}

function rateLimitResponse(c: Context, retryAfterMs: number) {
  const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
  c.header('Retry-After', String(retryAfterSeconds));
  return c.json(
    { error: 'Too many requests. Please try again later.', retryAfter: retryAfterSeconds },
    429,
  );
}

// ── Middleware factories ──

/**
 * Global rate limit: 100 requests per minute per IP.
 * Applied to all routes.
 */
export function globalRateLimit() {
  return async (c: Context, next: Next) => {
    const ip = getClientIp(c);
    const result = globalLimiter.check(ip);

    c.header('X-RateLimit-Limit', '100');
    c.header('X-RateLimit-Remaining', String(result.remaining));

    if (!result.allowed) {
      return rateLimitResponse(c, result.retryAfterMs);
    }

    await next();
  };
}

/**
 * OTP rate limit: 5 sends per minute per IP.
 * Applied to POST /auth/otp/send.
 */
export function otpRateLimit() {
  return async (c: Context, next: Next) => {
    const ip = getClientIp(c);
    const result = otpLimiter.check(ip);

    c.header('X-RateLimit-Limit', '5');
    c.header('X-RateLimit-Remaining', String(result.remaining));

    if (!result.allowed) {
      return rateLimitResponse(c, result.retryAfterMs);
    }

    await next();
  };
}

/**
 * DDC rate limit: 20 operations per minute per IP.
 * Applied to DDC write endpoints.
 */
export function ddcRateLimit() {
  return async (c: Context, next: Next) => {
    const ip = getClientIp(c);
    const result = ddcLimiter.check(ip);

    c.header('X-RateLimit-Limit', '20');
    c.header('X-RateLimit-Remaining', String(result.remaining));

    if (!result.allowed) {
      return rateLimitResponse(c, result.retryAfterMs);
    }

    await next();
  };
}
