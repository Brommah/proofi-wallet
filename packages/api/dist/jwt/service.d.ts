import * as jose from 'jose';
export interface JwtClaims {
    email: string;
    walletAddress?: string;
    [key: string]: unknown;
}
export declare class JwtService {
    private privateKey;
    private publicKey;
    private kid;
    private jwk;
    private ready;
    constructor();
    /**
     * Deterministic JWT key derivation from MASTER_SECRET.
     * Uses HKDF to derive Ed25519 seed from the master secret,
     * so the same MASTER_SECRET always produces the same keypair.
     * No database needed — the secret IS the seed.
     */
    private init;
    /** Wait for key generation to complete */
    ensureReady(): Promise<void>;
    /** Sign a JWT with the given claims */
    sign(claims: JwtClaims): Promise<string>;
    /** Verify a JWT and return its payload */
    verify(token: string): Promise<jose.JWTPayload>;
    /** Return the JWKS (JSON Web Key Set) */
    getJwks(): Promise<{
        keys: jose.JWK[];
    }>;
}
//# sourceMappingURL=service.d.ts.map