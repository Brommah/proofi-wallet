import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { getKeyPair } from './keys.js';
import { env } from '../config/env.js';

export interface ProofiJwtPayload extends JWTPayload {
  email: string;
  wallet?: string;
  type?: 'access' | 'refresh';
}

/** Sign a JWT with Ed25519 */
export async function signJwt(
  claims: Omit<ProofiJwtPayload, 'iat' | 'exp' | 'iss'>,
  expiresIn: string = env.JWT_EXPIRY,
): Promise<string> {
  const { privateKey, kid } = await getKeyPair();

  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'EdDSA', kid })
    .setIssuedAt()
    .setIssuer('proofi')
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(privateKey);
}

/** Sign a refresh token */
export async function signRefreshToken(email: string): Promise<string> {
  return signJwt({ email, type: 'refresh' }, env.JWT_REFRESH_EXPIRY);
}

/** Verify a JWT */
export async function verifyJwt(token: string): Promise<ProofiJwtPayload> {
  const { publicKey } = await getKeyPair();
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: 'proofi',
    audience: env.JWT_AUDIENCE,
  });
  return payload as ProofiJwtPayload;
}
