import type { Context, Next } from 'hono';

/**
 * Content Security Policy headers for API responses.
 * Restricts what the browser is allowed to load/execute.
 */
export function cspMiddleware() {
  return async (c: Context, next: Next) => {
    await next();

    // CSP for API responses
    c.header(
      'Content-Security-Policy',
      [
        "default-src 'none'",
        "frame-ancestors https://proofi-virid.vercel.app https://proofi.ai http://localhost:*",
      ].join('; '),
    );

    // Additional security headers
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('X-XSS-Protection', '0'); // Disabled in favor of CSP
  };
}
