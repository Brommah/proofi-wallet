import * as jose from 'jose';
import { env } from '../config/env.js';
export class JwtService {
    privateKey;
    publicKey;
    kid;
    jwk;
    ready;
    constructor() {
        this.ready = this.init();
    }
    /**
     * Deterministic JWT key derivation from MASTER_SECRET.
     * Uses HKDF to derive Ed25519 seed from the master secret,
     * so the same MASTER_SECRET always produces the same keypair.
     * No database needed — the secret IS the seed.
     */
    async init() {
        const encoder = new TextEncoder();
        // Derive a deterministic 32-byte seed from MASTER_SECRET using HKDF
        const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(env.MASTER_SECRET), 'HKDF', false, ['deriveBits']);
        const derivedBits = await crypto.subtle.deriveBits({
            name: 'HKDF',
            hash: 'SHA-256',
            salt: encoder.encode('proofi-jwt-signing-key-v1'),
            info: encoder.encode('Ed25519'),
        }, keyMaterial, 256);
        const seed = new Uint8Array(derivedBits);
        // Import the deterministic seed as an Ed25519 private key (PKCS8 format)
        // Ed25519 PKCS8 = prefix + 32-byte seed
        const pkcs8Prefix = new Uint8Array([
            0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70,
            0x04, 0x22, 0x04, 0x20,
        ]);
        const pkcs8 = new Uint8Array(pkcs8Prefix.length + seed.length);
        pkcs8.set(pkcs8Prefix);
        pkcs8.set(seed, pkcs8Prefix.length);
        this.privateKey = await crypto.subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, false, ['sign']);
        // Derive public key by exporting private as JWK then importing public portion
        // We need to export the private key as JWK to get the public 'x' component
        const privateJwk = await crypto.subtle.exportKey('jwk', this.privateKey);
        const publicJwk = { ...privateJwk, d: undefined, key_ops: ['verify'] };
        delete publicJwk.d;
        this.publicKey = await crypto.subtle.importKey('jwk', publicJwk, { name: 'Ed25519' }, true, ['verify']);
        // Export public key as JWK for JWKS endpoint
        const exported = await jose.exportJWK(this.publicKey);
        this.kid = jose.calculateJwkThumbprint
            ? (await jose.calculateJwkThumbprint(exported))
            : 'proofi-key-1';
        this.jwk = { ...exported, kid: this.kid, use: 'sig', alg: 'EdDSA' };
        console.log('🔑 JWT signing key derived deterministically from MASTER_SECRET');
    }
    /** Wait for key generation to complete */
    async ensureReady() {
        await this.ready;
    }
    /** Sign a JWT with the given claims */
    async sign(claims) {
        await this.ready;
        return new jose.SignJWT(claims)
            .setProtectedHeader({ alg: 'EdDSA', kid: this.kid })
            .setIssuer(env.JWT_ISSUER)
            .setAudience(env.JWT_AUDIENCE)
            .setIssuedAt()
            .setExpirationTime(`${env.JWT_EXPIRY_SECONDS}s`)
            .setSubject(claims.email)
            .sign(this.privateKey);
    }
    /** Verify a JWT and return its payload */
    async verify(token) {
        await this.ready;
        const { payload } = await jose.jwtVerify(token, this.publicKey, {
            issuer: env.JWT_ISSUER,
            audience: env.JWT_AUDIENCE,
        });
        return payload;
    }
    /** Return the JWKS (JSON Web Key Set) */
    async getJwks() {
        await this.ready;
        return { keys: [this.jwk] };
    }
}
//# sourceMappingURL=service.js.map