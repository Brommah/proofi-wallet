import { generateKeyPair, exportJWK, importJWK, type JWK, type KeyLike } from 'jose';

let cachedKeyPair: { privateKey: KeyLike; publicKey: KeyLike; jwk: JWK; kid: string } | null = null;

/**
 * Generate or return cached Ed25519 keypair for JWT signing.
 * In production, load from env/secrets instead of generating.
 */
export async function getKeyPair() {
  if (cachedKeyPair) return cachedKeyPair;

  // Check for pre-configured keys (production)
  const privKeyJwk = process.env.JWT_PRIVATE_KEY_JWK;
  if (privKeyJwk) {
    const jwk = JSON.parse(privKeyJwk) as JWK;
    const privateKey = await importJWK(jwk, 'EdDSA') as KeyLike;
    // Derive public JWK (strip private fields)
    const { d, ...publicJwk } = jwk;
    const publicKey = await importJWK(publicJwk, 'EdDSA') as KeyLike;
    const kid = jwk.kid || generateKid(publicJwk);
    cachedKeyPair = { privateKey, publicKey, jwk: { ...publicJwk, kid, use: 'sig', alg: 'EdDSA' }, kid };
    return cachedKeyPair;
  }

  // Development: generate ephemeral keypair
  const { privateKey, publicKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
  const publicJwk = await exportJWK(publicKey);
  const kid = generateKid(publicJwk);
  const jwk: JWK = { ...publicJwk, kid, use: 'sig', alg: 'EdDSA' };

  cachedKeyPair = { privateKey, publicKey, jwk, kid };
  console.log('[keys] Generated ephemeral Ed25519 keypair (kid:', kid, ')');
  return cachedKeyPair;
}

function generateKid(jwk: JWK): string {
  // Simple kid from first 8 chars of x parameter
  return `proofi-${(jwk.x || '').slice(0, 8)}`;
}
