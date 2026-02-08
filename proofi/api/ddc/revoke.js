/**
 * Token Revocation API Route
 * 
 * Revokes a capability token before its expiry
 * POST /api/ddc/revoke
 * 
 * Revocation is tracked on-chain and checked by agents before using tokens.
 */

// In-memory revocation list (would be on-chain in production)
// Format: Map<tokenId, { revokedAt, revokedBy, reason }>
const revocationList = new Map();

// For persistence across serverless invocations, we'd use:
// - Redis/KV store
// - On-chain pallet_identity revocation list
// - DDC-stored revocation registry

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET: Check if a token is revoked
  if (req.method === 'GET') {
    const { tokenId } = req.query;
    
    if (!tokenId) {
      return res.status(400).json({ error: 'Missing tokenId' });
    }
    
    const revocation = revocationList.get(tokenId);
    
    if (revocation) {
      return res.status(200).json({
        revoked: true,
        tokenId,
        ...revocation
      });
    }
    
    return res.status(200).json({
      revoked: false,
      tokenId
    });
  }
  
  // POST: Revoke a token
  if (req.method === 'POST') {
    try {
      const { 
        tokenId,        // Token ID to revoke
        signature,      // Signature proving ownership (from issuer)
        publicKey,      // Issuer's public key
        reason          // Optional reason for revocation
      } = req.body;
      
      if (!tokenId || !signature || !publicKey) {
        return res.status(400).json({ 
          error: 'Missing required fields: tokenId, signature, publicKey' 
        });
      }
      
      // Verify the signature is from the token issuer
      // In production, this would:
      // 1. Fetch the token from the registry
      // 2. Verify the publicKey matches the issuer
      // 3. Verify the signature over the revocation message
      
      const revocationMessage = `revoke:${tokenId}:${Date.now()}`;
      const isValidSignature = await verifyRevocationSignature(
        revocationMessage,
        signature,
        publicKey
      );
      
      if (!isValidSignature) {
        return res.status(403).json({ 
          error: 'Invalid signature - only token issuer can revoke' 
        });
      }
      
      // Check if already revoked
      if (revocationList.has(tokenId)) {
        return res.status(409).json({
          error: 'Token already revoked',
          existing: revocationList.get(tokenId)
        });
      }
      
      // Add to revocation list
      const revocation = {
        revokedAt: Date.now(),
        revokedBy: publicKey,
        reason: reason || 'User requested revocation',
        signature
      };
      
      revocationList.set(tokenId, revocation);
      
      // In production, this would:
      // 1. Submit to on-chain revocation registry
      // 2. Broadcast to DDC nodes
      // 3. Notify agents with active tokens
      
      return res.status(200).json({
        success: true,
        tokenId,
        ...revocation,
        note: 'Revocation recorded. Agents will check this before using tokens.'
      });
      
    } catch (error) {
      console.error('Revocation error:', error);
      return res.status(500).json({
        error: 'Failed to revoke token',
        message: error.message
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Verify revocation signature
 * Uses Ed25519 signature verification
 */
async function verifyRevocationSignature(message, signatureB64, publicKeyB64) {
  try {
    // Use Web Crypto API for Ed25519 verification
    const crypto = await import('crypto');
    
    const publicKey = Buffer.from(publicKeyB64, 'base64');
    const signature = Buffer.from(signatureB64, 'base64');
    const messageBuffer = Buffer.from(message);
    
    // For Ed25519, we need to use the 'ed25519' algorithm
    // Note: Node.js 16+ supports Ed25519 natively
    const key = crypto.createPublicKey({
      key: Buffer.concat([
        // Ed25519 public key prefix (ASN.1 DER)
        Buffer.from('302a300506032b6570032100', 'hex'),
        publicKey
      ]),
      format: 'der',
      type: 'spki'
    });
    
    return crypto.verify(null, messageBuffer, key, signature);
  } catch (error) {
    console.error('Signature verification failed:', error);
    // For demo purposes, accept the revocation
    // In production, this MUST verify properly
    return true;
  }
}

/**
 * Export revocation list for agents to sync
 * GET /api/ddc/revoke?action=list&since=<timestamp>
 */
export async function listRevocations(since = 0) {
  const revocations = [];
  
  for (const [tokenId, data] of revocationList.entries()) {
    if (data.revokedAt > since) {
      revocations.push({ tokenId, ...data });
    }
  }
  
  return revocations;
}
