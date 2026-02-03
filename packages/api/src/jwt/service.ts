import * as jose from 'jose';
import { env } from '../config/env.js';

export interface JwtClaims {
  email: string;
  walletAddress?: string;
  [key: string]: unknown;
}

export class JwtService {
  private privateKey!: CryptoKey;
  private publicKey!: CryptoKey;
  private kid!: string;
  private jwk!: jose.JWK;
  private ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    const { privateKey, publicKey } = await jose.generateKeyPair('EdDSA', {
      crv: 'Ed25519',
    });
    this.privateKey = privateKey;
    this.publicKey = publicKey;

    // Export public key as JWK
    const exported = await jose.exportJWK(publicKey);
    this.kid = jose.calculateJwkThumbprint
      ? (await jose.calculateJwkThumbprint(exported))
      : 'proofi-key-1';
    this.jwk = { ...exported, kid: this.kid, use: 'sig', alg: 'EdDSA' };
  }

  /** Wait for key generation to complete */
  async ensureReady(): Promise<void> {
    await this.ready;
  }

  /** Sign a JWT with the given claims */
  async sign(claims: JwtClaims): Promise<string> {
    await this.ready;
    return new jose.SignJWT(claims as jose.JWTPayload)
      .setProtectedHeader({ alg: 'EdDSA', kid: this.kid })
      .setIssuer(env.JWT_ISSUER)
      .setAudience(env.JWT_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${env.JWT_EXPIRY_SECONDS}s`)
      .setSubject(claims.email)
      .sign(this.privateKey);
  }

  /** Verify a JWT and return its payload */
  async verify(token: string): Promise<jose.JWTPayload> {
    await this.ready;
    const { payload } = await jose.jwtVerify(token, this.publicKey, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    return payload;
  }

  /** Return the JWKS (JSON Web Key Set) */
  async getJwks(): Promise<{ keys: jose.JWK[] }> {
    await this.ready;
    return { keys: [this.jwk] };
  }
}
