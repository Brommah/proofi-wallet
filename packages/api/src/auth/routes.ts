import { Hono } from 'hono';
import { getKeyPair } from './keys.js';
import { signJwt, signRefreshToken } from './jwt.js';
import type { OtpService } from '../otp/service.js';

export function authRoutes(otpService: OtpService) {
  const app = new Hono();

  /** JWKS endpoint — public keys for JWT verification */
  app.get('/jwks', async (c) => {
    const { jwk } = await getKeyPair();
    return c.json({ keys: [jwk] });
  });

  /** Send OTP to email */
  app.post('/otp/send', async (c) => {
    const body = await c.req.json<{ email: string }>();

    if (!body.email || !isValidEmail(body.email)) {
      return c.json({ error: 'Valid email is required' }, 400);
    }

    const result = await otpService.send(body.email);
    return c.json(result);
  });

  /** Validate OTP (doesn't consume it — useful for magic links) */
  app.post('/otp/validate', async (c) => {
    const body = await c.req.json<{ email: string; otp: string }>();

    if (!body.email || !body.otp) {
      return c.json({ error: 'email and otp are required' }, 400);
    }

    const valid = await otpService.validate(body.email, body.otp);
    if (!valid) {
      return c.json({ error: 'Invalid or expired OTP' }, 401);
    }

    return c.json({ valid: true });
  });

  /** Validate OTP and return JWT (primary auth flow) */
  app.post('/token-by-email', async (c) => {
    const body = await c.req.json<{ email: string; otp: string }>();

    if (!body.email || !body.otp) {
      return c.json({ error: 'email and otp are required' }, 400);
    }

    const valid = await otpService.validateAndConsume(body.email, body.otp);
    if (!valid) {
      return c.json({ error: 'Invalid or expired OTP' }, 401);
    }

    const email = body.email.toLowerCase().trim();
    const [token, refreshToken] = await Promise.all([
      signJwt({ email }),
      signRefreshToken(email),
    ]);

    return c.json({ token, refreshToken });
  });

  return app;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
