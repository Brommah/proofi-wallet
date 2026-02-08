import { DdcClient, MAINNET, JsonSigner, File, Tag, FileUri } from '@cere-ddc-sdk/ddc-client';
import { Keyring } from '@polkadot/keyring';
import { signatureVerify, cryptoWaitReady } from '@polkadot/util-crypto';
import { u8aToHex, stringToU8a, hexToU8a } from '@polkadot/util';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const secretsDir = resolve(__dirname, '../.secrets');
const PORT = 3847;
const BUCKET_ID = 1229n;
const CERE_WS = 'wss://archive.mainnet.cere.network/ws';

// ─── On-chain remark prefixes ───
const REMARK_PREFIX_CRED = 'cereproof:';        // cereproof:{wallet}:{manifestCID}
const REMARK_PREFIX_CLAIM = 'cereproof:claims:'; // cereproof:claims:{wallet}:{manifestCID}

// Wait for crypto WASM
await cryptoWaitReady();

// Init DDC client
console.log('⏳ Initializing DDC client...');
const walletJson = JSON.parse(readFileSync(resolve(secretsDir, 'cere-wallet.json'), 'utf-8'));
const signer = new JsonSigner(walletJson, { passphrase: 'roezel' });
const client = await DdcClient.create(signer, MAINNET);

// Init keyring for signing/verification
const keyring = new Keyring({ type: 'sr25519' });
const issuerPair = keyring.addFromJson(walletJson);
issuerPair.decodePkcs8('roezel');

const ISSUER_ADDRESS = walletJson.address;

// Init Polkadot API for on-chain remarks
console.log('⏳ Connecting to Cere blockchain...');
const wsProvider = new WsProvider(CERE_WS);
const api = await ApiPromise.create({ provider: wsProvider });
console.log(`✅ Connected to chain: ${(await api.rpc.system.chain()).toString()}`);

console.log('✅ Connected to DDC Mainnet');
console.log(`📦 Bucket: ${BUCKET_ID}`);
console.log(`🔑 Wallet: ${ISSUER_ADDRESS}`);
console.log('📡 Fully stateless — on-chain index + DDC storage');

// ─── Helpers ───

/** Read a file from DDC by CID and return its content as a string */
async function ddcRead(cid) {
  const fileUri = new FileUri(BUCKET_ID, cid);
  const fileResponse = await client.read(fileUri);
  const chunks = [];
  for await (const chunk of fileResponse.body) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

/** Store content on DDC with optional tags, return CID string */
async function ddcStore(content, tags = []) {
  const ddcTags = tags.map(t => new Tag(t.key, t.value));
  const file = new File(Buffer.from(content), { tags: ddcTags });
  const result = await client.store(BUCKET_ID, file);
  return result.cid.toString();
}

/**
 * Query on-chain remarks from the ISSUER wallet matching a prefix.
 * Returns the latest remark string that starts with the given prefix.
 * We scan system events in reverse block order for efficiency.
 */
async function findLatestRemark(prefix) {
  // Use system.events storage to find remarks
  // Strategy: query extrinsics from the issuer account, look for system.remark calls
  // We'll scan recent blocks. For production, an indexer would be better.
  // For now, we scan the chain events using the api.query.system approach.
  
  // Alternative: use api.rpc.chain subscriptions or a simple scan.
  // Since archive node supports full history, we scan from latest backwards.
  
  const latestHeader = await api.rpc.chain.getHeader();
  const latestBlock = latestHeader.number.toNumber();
  
  // Scan backwards up to 10000 blocks (roughly ~16 hours at 6s blocks)
  const scanDepth = Math.min(10000, latestBlock);
  
  for (let i = latestBlock; i > latestBlock - scanDepth; i--) {
    try {
      const blockHash = await api.rpc.chain.getBlockHash(i);
      const signedBlock = await api.rpc.chain.getBlock(blockHash);
      
      for (const ext of signedBlock.block.extrinsics) {
        // Check if it's from our issuer
        if (!ext.isSigned) continue;
        const extSigner = ext.signer.toString();
        if (extSigner !== ISSUER_ADDRESS) continue;
        
        // Check if it's a system.remark or system.remarkWithEvent
        const { method, section } = ext.method;
        if (section !== 'system') continue;
        if (method !== 'remark' && method !== 'remarkWithEvent') continue;
        
        // Get the remark data
        const remarkBytes = ext.method.args[0];
        let remarkStr;
        try {
          remarkStr = Buffer.from(remarkBytes).toString('utf-8');
        } catch { continue; }
        
        if (remarkStr.startsWith(prefix)) {
          return remarkStr;
        }
      }
    } catch (err) {
      // Skip problematic blocks
      continue;
    }
  }
  
  return null;
}

/**
 * Find ALL remarks matching a given prefix (not just the latest).
 * Used for listing all claims across all wallets.
 */
async function findAllRemarks(prefix) {
  const results = [];
  const latestHeader = await api.rpc.chain.getHeader();
  const latestBlock = latestHeader.number.toNumber();
  const scanDepth = Math.min(10000, latestBlock);
  
  for (let i = latestBlock; i > latestBlock - scanDepth; i--) {
    try {
      const blockHash = await api.rpc.chain.getBlockHash(i);
      const signedBlock = await api.rpc.chain.getBlock(blockHash);
      
      for (const ext of signedBlock.block.extrinsics) {
        if (!ext.isSigned) continue;
        const extSigner = ext.signer.toString();
        if (extSigner !== ISSUER_ADDRESS) continue;
        
        const { method, section } = ext.method;
        if (section !== 'system') continue;
        if (method !== 'remark' && method !== 'remarkWithEvent') continue;
        
        const remarkBytes = ext.method.args[0];
        let remarkStr;
        try {
          remarkStr = Buffer.from(remarkBytes).toString('utf-8');
        } catch { continue; }
        
        if (remarkStr.startsWith(prefix)) {
          results.push(remarkStr);
        }
      }
    } catch { continue; }
  }
  
  return results;
}

/**
 * Submit a remark on-chain.
 * Returns the block hash where it was included.
 */
async function submitRemark(remarkString) {
  return new Promise((resolve, reject) => {
    const remarkHex = '0x' + Buffer.from(remarkString).toString('hex');
    api.tx.system.remarkWithEvent(remarkHex).signAndSend(issuerPair, ({ status, dispatchError }) => {
      if (dispatchError) {
        if (dispatchError.isModule) {
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
        } else {
          reject(new Error(dispatchError.toString()));
        }
      }
      if (status.isInBlock) {
        console.log(`📦 Remark included in block: ${status.asInBlock.toString()}`);
        resolve(status.asInBlock.toString());
      }
    });
  });
}

/**
 * Read a manifest from DDC. A manifest is a JSON array of CIDs.
 * Returns an array of CID strings.
 */
async function readManifest(manifestCid) {
  const content = await ddcRead(manifestCid);
  return JSON.parse(content);
}

/**
 * Get the credential manifest for a wallet address.
 * Returns { manifestCid, cids } or null if none found.
 */
async function getCredentialManifest(walletAddress) {
  const prefix = `${REMARK_PREFIX_CRED}${walletAddress}:`;
  const remark = await findLatestRemark(prefix);
  if (!remark) return null;
  
  const manifestCid = remark.slice(prefix.length);
  const cids = await readManifest(manifestCid);
  return { manifestCid, cids };
}

/**
 * Get the claim manifest for a wallet address.
 * Returns { manifestCid, claimCids } or null if none found.
 */
async function getClaimManifest(walletAddress) {
  const prefix = `${REMARK_PREFIX_CLAIM}${walletAddress}:`;
  const remark = await findLatestRemark(prefix);
  if (!remark) return null;
  
  const manifestCid = remark.slice(prefix.length);
  const claimCids = await readManifest(manifestCid);
  return { manifestCid, claimCids };
}

/**
 * Update a credential manifest for a wallet: append a new CID, store new manifest,
 * submit on-chain remark. Returns new manifest CID.
 */
async function updateCredentialManifest(walletAddress, newCid) {
  // Read existing manifest (if any)
  let cids = [];
  try {
    const existing = await getCredentialManifest(walletAddress);
    if (existing) cids = existing.cids;
  } catch { /* no existing manifest */ }
  
  cids.push(newCid);
  
  // Store updated manifest on DDC
  const manifestContent = JSON.stringify(cids);
  const manifestCid = await ddcStore(manifestContent, [
    { key: 'type', value: 'credential-manifest' },
    { key: 'wallet', value: walletAddress }
  ]);
  
  // Submit on-chain remark
  const remarkStr = `${REMARK_PREFIX_CRED}${walletAddress}:${manifestCid}`;
  await submitRemark(remarkStr);
  
  return manifestCid;
}

/**
 * Update a claim manifest for a wallet: append a new claim CID, store new manifest,
 * submit on-chain remark. Returns new manifest CID.
 */
async function updateClaimManifest(walletAddress, newClaimCid) {
  let claimCids = [];
  try {
    const existing = await getClaimManifest(walletAddress);
    if (existing) claimCids = existing.claimCids;
  } catch { /* no existing manifest */ }
  
  claimCids.push(newClaimCid);
  
  const manifestContent = JSON.stringify(claimCids);
  const manifestCid = await ddcStore(manifestContent, [
    { key: 'type', value: 'claim-manifest' },
    { key: 'wallet', value: walletAddress }
  ]);
  
  const remarkStr = `${REMARK_PREFIX_CLAIM}${walletAddress}:${manifestCid}`;
  await submitRemark(remarkStr);
  
  return manifestCid;
}

/** Verify a credential's signature. Returns { valid, credential } */
function verifyCredentialSignature(credential) {
  const payloadToVerify = JSON.stringify({
    "@context": credential["@context"],
    type: credential.type,
    issuer: credential.issuer,
    credentialSubject: credential.credentialSubject,
    issuanceDate: credential.issuanceDate
  });
  
  const result = signatureVerify(
    stringToU8a(payloadToVerify),
    hexToU8a(credential.proof.signatureValue),
    credential.issuer.address
  );
  
  return result.isValid;
}

// ─── HTTP Server ───

const server = createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const json = (data, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  try {
    // ===== STATUS =====
    if (url.pathname === '/status' && req.method === 'GET') {
      json({
        ok: true,
        connected: true,
        wallet: ISSUER_ADDRESS,
        bucket: BUCKET_ID.toString(),
        network: 'mainnet',
        version: 'v3-stateless',
        indexing: 'on-chain (system.remark)',
        storage: 'DDC'
      });
    }

    // ===== RAW STORE =====
    else if (url.pathname === '/store' && req.method === 'POST') {
      const body = await readBody(req);
      const { content, tags = [] } = JSON.parse(body);

      if (!content) {
        json({ ok: false, error: 'No content provided' }, 400);
        return;
      }

      console.log(`📝 Storing ${content.length} bytes...`);
      const cid = await ddcStore(content, tags);
      console.log(`✅ Stored! CID: ${cid}`);

      json({
        ok: true,
        cid,
        bucket: BUCKET_ID.toString(),
        cdnUrl: `https://cdn.ddc-dragon.com/${BUCKET_ID}/${cid}`,
        size: content.length,
        tags
      });
    }

    // ===== RAW READ =====
    else if (url.pathname.startsWith('/read/') && !url.pathname.startsWith('/read/credential') && req.method === 'GET') {
      const cid = url.pathname.replace('/read/', '');
      console.log(`📖 Reading CID: ${cid}...`);
      const content = await ddcRead(cid);
      console.log(`✅ Read ${content.length} bytes`);

      json({ ok: true, cid, content, size: content.length });
    }

    // ===== STORE CLIENT-SIGNED CREDENTIAL =====
    else if (url.pathname === '/credential/store' && req.method === 'POST') {
      const body = await readBody(req);
      const { credential, signature, issuer } = JSON.parse(body);

      if (!credential || !signature || !issuer) {
        json({ ok: false, error: 'Missing required fields: credential, signature, issuer' }, 400);
        return;
      }

      if (!credential['@context'] || !credential.type || !credential.issuer || !credential.credentialSubject || !credential.issuanceDate) {
        json({ ok: false, error: 'Invalid credential structure' }, 400);
        return;
      }

      // Attach proof
      credential.proof = {
        type: 'Ed25519Signature2020',
        created: credential.issuanceDate,
        verificationMethod: `did:cere:${issuer}#key-1`,
        proofPurpose: 'assertionMethod',
        signatureValue: signature
      };

      const credentialJson = JSON.stringify(credential, null, 2);
      const subject = credential.credentialSubject?.address || credential.credentialSubject?.id || 'unknown';
      const claimType = credential.type?.[1] || credential.type?.[0] || 'VerifiableCredential';

      console.log(`🎓 Storing client-signed credential: ${claimType} for ${subject.slice(0, 8)}...`);

      // 1. Store credential on DDC
      const cid = await ddcStore(credentialJson, [
        { key: 'type', value: 'verifiable-credential' },
        { key: 'credential-type', value: claimType },
        { key: 'subject', value: subject },
        { key: 'issuer', value: issuer }
      ]);

      console.log(`✅ Client-signed credential stored! CID: ${cid}`);

      // 2. Update on-chain manifest for the subject wallet
      console.log(`📡 Updating on-chain credential manifest for ${subject.slice(0, 8)}...`);
      const manifestCid = await updateCredentialManifest(subject, cid);
      console.log(`✅ Manifest updated! CID: ${manifestCid}`);

      json({
        ok: true,
        cid,
        manifestCid,
        credential,
        cdnUrl: `https://cdn.ddc-dragon.com/${BUCKET_ID}/${cid}`
      });
    }

    // ===== ISSUE CREDENTIAL (DEPRECATED — server-side signing) =====
    else if (url.pathname === '/credential/issue' && req.method === 'POST') {
      console.log('⚠️  DEPRECATED: /credential/issue called — use /credential/store with client-side signing');
      const body = await readBody(req);
      const { subject, claimType, claimData, subjectName } = JSON.parse(body);

      if (!subject || !claimType || !claimData) {
        json({ ok: false, error: 'Missing required fields: subject, claimType, claimData' }, 400);
        return;
      }

      // Build credential
      const credential = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", claimType],
        issuer: { id: `did:cere:${ISSUER_ADDRESS}`, address: ISSUER_ADDRESS },
        credentialSubject: {
          id: `did:cere:${subject}`,
          address: subject,
          name: subjectName || '',
          claim: claimData
        },
        issuanceDate: new Date().toISOString(),
        proof: {
          type: "Sr25519Signature2024",
          created: new Date().toISOString(),
          verificationMethod: `did:cere:${ISSUER_ADDRESS}#key-1`,
          proofPurpose: "assertionMethod"
        }
      };

      // Sign
      const payloadToSign = JSON.stringify({
        "@context": credential["@context"],
        type: credential.type,
        issuer: credential.issuer,
        credentialSubject: credential.credentialSubject,
        issuanceDate: credential.issuanceDate
      });
      const sig = issuerPair.sign(stringToU8a(payloadToSign));
      credential.proof.signatureValue = u8aToHex(sig);

      // Store on DDC
      const credentialJson = JSON.stringify(credential, null, 2);
      console.log(`🎓 Issuing credential: ${claimType} for ${subject.slice(0, 8)}...`);

      const cid = await ddcStore(credentialJson, [
        { key: 'type', value: 'verifiable-credential' },
        { key: 'credential-type', value: claimType },
        { key: 'subject', value: subject },
        { key: 'issuer', value: ISSUER_ADDRESS }
      ]);

      console.log(`✅ Credential issued! CID: ${cid}`);

      // Update on-chain manifest
      const manifestCid = await updateCredentialManifest(subject, cid);
      console.log(`✅ Manifest updated! CID: ${manifestCid}`);

      json({
        ok: true,
        cid,
        manifestCid,
        credential,
        cdnUrl: `https://cdn.ddc-dragon.com/${BUCKET_ID}/${cid}`
      });
    }

    // ===== VERIFY CREDENTIAL =====
    else if (url.pathname.startsWith('/credential/verify/') && req.method === 'GET') {
      const cid = url.pathname.replace('/credential/verify/', '');
      console.log(`🔍 Verifying credential CID: ${cid}...`);

      const content = await ddcRead(cid);
      let credential;
      try {
        credential = JSON.parse(content);
      } catch {
        json({ ok: false, verified: false, error: 'Content is not valid JSON credential' }, 400);
        return;
      }

      if (!credential.proof?.signatureValue || !credential.issuer?.address) {
        json({ ok: true, verified: false, error: 'Not a signed credential', credential });
        return;
      }

      try {
        const isValid = verifyCredentialSignature(credential);
        console.log(`${isValid ? '✅' : '❌'} Credential verification: ${isValid}`);

        json({
          ok: true,
          verified: isValid,
          credential,
          issuer: credential.issuer,
          subject: credential.credentialSubject,
          issuanceDate: credential.issuanceDate,
          claimType: credential.type?.[1] || credential.type?.[0],
          cid
        });
      } catch (verifyErr) {
        json({ ok: true, verified: false, error: `Signature verification failed: ${verifyErr.message}`, credential });
      }
    }

    // ===== LIST CREDENTIALS (from on-chain index) =====
    else if (url.pathname === '/credentials/issued' && req.method === 'GET') {
      const walletFilter = url.searchParams.get('wallet');
      
      if (!walletFilter) {
        // Without a wallet filter, we'd need to scan ALL remarks — return empty with hint
        json({
          ok: true,
          count: 0,
          credentials: [],
          hint: 'Provide ?wallet= parameter to query credentials for a specific address'
        });
        return;
      }

      console.log(`📋 Listing credentials for ${walletFilter.slice(0, 12)}...`);
      
      const manifest = await getCredentialManifest(walletFilter);
      if (!manifest) {
        json({ ok: true, count: 0, credentials: [] });
        return;
      }

      const credentials = [];
      for (const cid of manifest.cids) {
        try {
          const content = await ddcRead(cid);
          const cred = JSON.parse(content);
          credentials.push({
            cid,
            claimType: cred.type?.[1] || cred.type?.[0] || 'VerifiableCredential',
            claimData: cred.credentialSubject?.claim || '',
            subject: cred.credentialSubject?.address || '',
            subjectName: cred.credentialSubject?.name || '',
            issuer: cred.issuer?.address || '',
            issuanceDate: cred.issuanceDate,
            cdnUrl: `https://cdn.ddc-dragon.com/${BUCKET_ID}/${cid}`
          });
        } catch (err) {
          credentials.push({ cid, error: err.message });
        }
      }

      json({ ok: true, count: credentials.length, credentials });
    }

    // ===== PROFILE (API) =====
    else if (url.pathname.startsWith('/api/profile/') && req.method === 'GET') {
      const address = url.pathname.replace('/api/profile/', '');
      console.log(`👤 Profile lookup: ${address.slice(0, 12)}...`);

      // Get credential manifest from chain
      const manifest = await getCredentialManifest(address);
      
      const verifiedCredentials = [];
      if (manifest) {
        for (const cid of manifest.cids) {
          try {
            const content = await ddcRead(cid);
            const credential = JSON.parse(content);
            
            let verified = false;
            try {
              verified = verifyCredentialSignature(credential);
            } catch { /* verification failed */ }

            const isReceived = (credential.credentialSubject?.address === address);
            const isIssued = (credential.issuer?.address === address);

            verifiedCredentials.push({
              cid,
              claimType: credential.type?.[1] || credential.type?.[0],
              claimData: credential.credentialSubject?.claim || '',
              subject: credential.credentialSubject?.address || '',
              subjectName: credential.credentialSubject?.name || '',
              issuer: credential.issuer?.address || '',
              issuanceDate: credential.issuanceDate,
              cdnUrl: `https://cdn.ddc-dragon.com/${BUCKET_ID}/${cid}`,
              verified,
              credential,
              isReceived,
              isIssued
            });
          } catch (err) {
            verifiedCredentials.push({ cid, verified: false, error: err.message });
          }
        }
      }

      const received = verifiedCredentials.filter(c => c.isReceived);
      const issued = verifiedCredentials.filter(c => c.isIssued);

      json({
        ok: true,
        address,
        received: { count: received.length, credentials: received },
        issued: { count: issued.length, credentials: issued }
      });
    }

    // ===== PROFILE PAGE =====
    else if (url.pathname.startsWith('/profile/') && req.method === 'GET') {
      const html = readFileSync(resolve(__dirname, 'profile.html'), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    }

    // ===== SUBMIT CLAIM =====
    else if (url.pathname === '/claim/submit' && req.method === 'POST') {
      const body = await readBody(req);
      const { claimType, documentText, documentName, subjectWallet, subjectName, metadata } = JSON.parse(body);

      if (!claimType || !documentText || !subjectWallet) {
        json({ ok: false, error: 'Missing required fields: claimType, documentText, subjectWallet' }, 400);
        return;
      }

      const claimId = `claim_${randomUUID().slice(0, 12)}`;
      const submittedAt = new Date().toISOString();

      const claimPayload = JSON.stringify({
        claimId,
        claimType,
        documentText,
        documentName: documentName || '',
        subjectWallet,
        subjectName: subjectName || '',
        metadata: metadata || {},
        submittedAt,
        status: 'pending',
        credentialCid: null,
        rejectionReason: null,
        approvedAt: null
      }, null, 2);

      console.log(`📋 Submitting claim: ${claimType} for ${subjectWallet.slice(0, 8)}...`);

      // Store claim on DDC
      const ddcCid = await ddcStore(claimPayload, [
        { key: 'type', value: 'claim' },
        { key: 'claim-type', value: claimType },
        { key: 'subject', value: subjectWallet },
        { key: 'status', value: 'pending' },
        { key: 'claim-id', value: claimId }
      ]);

      console.log(`✅ Claim stored on DDC! CID: ${ddcCid}`);

      // Update on-chain claim manifest for this wallet
      console.log(`📡 Updating on-chain claim manifest for ${subjectWallet.slice(0, 8)}...`);
      const manifestCid = await updateClaimManifest(subjectWallet, ddcCid);
      console.log(`✅ Claim manifest updated! CID: ${manifestCid}`);

      json({
        ok: true,
        claimId,
        ddcCid,
        manifestCid,
        status: 'pending',
        cdnUrl: `https://cdn.ddc-dragon.com/${BUCKET_ID}/${ddcCid}`
      });
    }

    // ===== LIST PENDING CLAIMS =====
    else if (url.pathname === '/claims/pending' && req.method === 'GET') {
      console.log('📋 Listing pending claims (scanning on-chain remarks)...');
      
      // Find all claim manifests from on-chain remarks
      const remarks = await findAllRemarks(REMARK_PREFIX_CLAIM);
      
      // For each unique wallet, take only the latest manifest
      const latestManifests = new Map();
      for (const remark of remarks) {
        // cereproof:claims:{wallet}:{manifestCid}
        const withoutPrefix = remark.slice(REMARK_PREFIX_CLAIM.length);
        const colonIdx = withoutPrefix.indexOf(':');
        if (colonIdx === -1) continue;
        const wallet = withoutPrefix.slice(0, colonIdx);
        if (!latestManifests.has(wallet)) {
          latestManifests.set(wallet, withoutPrefix.slice(colonIdx + 1));
        }
      }

      const pendingClaims = [];
      for (const [wallet, manifestCid] of latestManifests) {
        try {
          const claimCids = await readManifest(manifestCid);
          for (const cid of claimCids) {
            try {
              const content = await ddcRead(cid);
              const claim = JSON.parse(content);
              if (claim.status === 'pending') {
                pendingClaims.push({
                  claimId: claim.claimId,
                  claimType: claim.claimType,
                  subjectName: claim.subjectName,
                  subjectWallet: claim.subjectWallet,
                  documentName: claim.documentName,
                  submittedAt: claim.submittedAt,
                  status: claim.status,
                  ddcCid: cid
                });
              }
            } catch { /* skip unreadable claims */ }
          }
        } catch { /* skip unreadable manifests */ }
      }

      json({ ok: true, count: pendingClaims.length, claims: pendingClaims });
    }

    // ===== CLAIMS HISTORY =====
    else if (url.pathname === '/claims/history' && req.method === 'GET') {
      const wallet = url.searchParams.get('wallet');
      
      if (!wallet) {
        json({ ok: true, count: 0, claims: [], hint: 'Provide ?wallet= parameter' });
        return;
      }

      console.log(`📋 Claims history for ${wallet.slice(0, 12)}...`);
      
      const manifest = await getClaimManifest(wallet);
      if (!manifest) {
        json({ ok: true, count: 0, claims: [] });
        return;
      }

      const claims = [];
      for (const cid of manifest.claimCids) {
        try {
          const content = await ddcRead(cid);
          const claim = JSON.parse(content);
          claims.push({
            claimId: claim.claimId,
            claimType: claim.claimType,
            subjectName: claim.subjectName,
            subjectWallet: claim.subjectWallet,
            documentName: claim.documentName,
            submittedAt: claim.submittedAt,
            status: claim.status,
            credentialCid: claim.credentialCid,
            rejectionReason: claim.rejectionReason,
            approvedAt: claim.approvedAt,
            ddcCid: cid
          });
        } catch (err) {
          claims.push({ ddcCid: cid, error: err.message });
        }
      }

      json({ ok: true, count: claims.length, claims });
    }

    // ===== CLAIM DETAIL =====
    else if (url.pathname.match(/^\/claim\/claim_[a-f0-9-]+$/) && req.method === 'GET') {
      const claimId = url.pathname.replace('/claim/', '');
      console.log(`📋 Looking up claim ${claimId}...`);
      
      // We need to find this claim. Scan all claim manifests.
      const remarks = await findAllRemarks(REMARK_PREFIX_CLAIM);
      
      let foundClaim = null;
      for (const remark of remarks) {
        const withoutPrefix = remark.slice(REMARK_PREFIX_CLAIM.length);
        const colonIdx = withoutPrefix.indexOf(':');
        if (colonIdx === -1) continue;
        const manifestCid = withoutPrefix.slice(colonIdx + 1);
        
        try {
          const claimCids = await readManifest(manifestCid);
          for (const cid of claimCids) {
            try {
              const content = await ddcRead(cid);
              const claim = JSON.parse(content);
              if (claim.claimId === claimId) {
                foundClaim = { ...claim, ddcCid: cid };
                break;
              }
            } catch { continue; }
          }
        } catch { continue; }
        if (foundClaim) break;
      }

      if (!foundClaim) {
        json({ ok: false, error: 'Claim not found' }, 404);
        return;
      }

      json({ ok: true, claim: foundClaim });
    }

    // ===== APPROVE CLAIM =====
    else if (url.pathname.match(/^\/claim\/claim_[a-f0-9-]+\/approve$/) && req.method === 'POST') {
      const claimId = url.pathname.replace('/claim/', '').replace('/approve', '');
      console.log(`✅ Approving claim ${claimId}...`);

      // Find the claim from on-chain index
      const remarks = await findAllRemarks(REMARK_PREFIX_CLAIM);
      let foundClaim = null;
      let foundClaimCid = null;
      let claimWallet = null;

      for (const remark of remarks) {
        const withoutPrefix = remark.slice(REMARK_PREFIX_CLAIM.length);
        const colonIdx = withoutPrefix.indexOf(':');
        if (colonIdx === -1) continue;
        const wallet = withoutPrefix.slice(0, colonIdx);
        const manifestCid = withoutPrefix.slice(colonIdx + 1);

        try {
          const claimCids = await readManifest(manifestCid);
          for (const cid of claimCids) {
            try {
              const content = await ddcRead(cid);
              const claim = JSON.parse(content);
              if (claim.claimId === claimId) {
                foundClaim = claim;
                foundClaimCid = cid;
                claimWallet = wallet;
                break;
              }
            } catch { continue; }
          }
        } catch { continue; }
        if (foundClaim) break;
      }

      if (!foundClaim) {
        json({ ok: false, error: 'Claim not found' }, 404);
        return;
      }

      if (foundClaim.status !== 'pending') {
        json({ ok: false, error: `Claim already ${foundClaim.status}` }, 400);
        return;
      }

      // Issue credential
      const credential = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", foundClaim.claimType],
        issuer: { id: `did:cere:${ISSUER_ADDRESS}`, address: ISSUER_ADDRESS },
        credentialSubject: {
          id: `did:cere:${foundClaim.subjectWallet}`,
          address: foundClaim.subjectWallet,
          name: foundClaim.subjectName,
          claim: foundClaim.metadata
        },
        issuanceDate: new Date().toISOString(),
        proof: {
          type: "Sr25519Signature2024",
          created: new Date().toISOString(),
          verificationMethod: `did:cere:${ISSUER_ADDRESS}#key-1`,
          proofPurpose: "assertionMethod"
        }
      };

      // Sign
      const payloadToSign = JSON.stringify({
        "@context": credential["@context"],
        type: credential.type,
        issuer: credential.issuer,
        credentialSubject: credential.credentialSubject,
        issuanceDate: credential.issuanceDate
      });
      const sig = issuerPair.sign(stringToU8a(payloadToSign));
      credential.proof.signatureValue = u8aToHex(sig);

      // Store credential on DDC
      const credentialCid = await ddcStore(JSON.stringify(credential, null, 2), [
        { key: 'type', value: 'verifiable-credential' },
        { key: 'credential-type', value: foundClaim.claimType },
        { key: 'subject', value: foundClaim.subjectWallet },
        { key: 'issuer', value: ISSUER_ADDRESS },
        { key: 'source-claim', value: claimId }
      ]);

      console.log(`🎓 Credential issued! CID: ${credentialCid}`);

      // Update credential manifest for the subject
      const credManifestCid = await updateCredentialManifest(foundClaim.subjectWallet, credentialCid);

      // Store updated claim (with approved status) on DDC
      const updatedClaim = {
        ...foundClaim,
        status: 'approved',
        credentialCid,
        approvedAt: new Date().toISOString()
      };
      const updatedClaimCid = await ddcStore(JSON.stringify(updatedClaim, null, 2), [
        { key: 'type', value: 'claim' },
        { key: 'claim-type', value: foundClaim.claimType },
        { key: 'subject', value: foundClaim.subjectWallet },
        { key: 'status', value: 'approved' },
        { key: 'claim-id', value: claimId }
      ]);

      // Update claim manifest: replace old claim CID with updated one
      // (We add the updated claim CID; the old one stays but readers should use the latest by claimId)
      await updateClaimManifest(foundClaim.subjectWallet, updatedClaimCid);

      json({
        ok: true,
        claimId,
        status: 'approved',
        credentialCid,
        credential,
        cdnUrl: `https://cdn.ddc-dragon.com/${BUCKET_ID}/${credentialCid}`
      });
    }

    // ===== REJECT CLAIM =====
    else if (url.pathname.match(/^\/claim\/claim_[a-f0-9-]+\/reject$/) && req.method === 'POST') {
      const claimId = url.pathname.replace('/claim/', '').replace('/reject', '');
      console.log(`❌ Rejecting claim ${claimId}...`);

      // Find the claim
      const remarks = await findAllRemarks(REMARK_PREFIX_CLAIM);
      let foundClaim = null;

      for (const remark of remarks) {
        const withoutPrefix = remark.slice(REMARK_PREFIX_CLAIM.length);
        const colonIdx = withoutPrefix.indexOf(':');
        if (colonIdx === -1) continue;
        const manifestCid = withoutPrefix.slice(colonIdx + 1);

        try {
          const claimCids = await readManifest(manifestCid);
          for (const cid of claimCids) {
            try {
              const content = await ddcRead(cid);
              const claim = JSON.parse(content);
              if (claim.claimId === claimId) {
                foundClaim = claim;
                break;
              }
            } catch { continue; }
          }
        } catch { continue; }
        if (foundClaim) break;
      }

      if (!foundClaim) {
        json({ ok: false, error: 'Claim not found' }, 404);
        return;
      }

      if (foundClaim.status !== 'pending') {
        json({ ok: false, error: `Claim already ${foundClaim.status}` }, 400);
        return;
      }

      const body = await readBody(req);
      let reason = '';
      try { reason = JSON.parse(body).reason || ''; } catch { /* no body ok */ }

      // Store updated claim with rejected status
      const updatedClaim = {
        ...foundClaim,
        status: 'rejected',
        rejectionReason: reason
      };
      const updatedClaimCid = await ddcStore(JSON.stringify(updatedClaim, null, 2), [
        { key: 'type', value: 'claim' },
        { key: 'claim-type', value: foundClaim.claimType },
        { key: 'subject', value: foundClaim.subjectWallet },
        { key: 'status', value: 'rejected' },
        { key: 'claim-id', value: claimId }
      ]);

      // Update claim manifest
      await updateClaimManifest(foundClaim.subjectWallet, updatedClaimCid);

      json({ ok: true, claimId, status: 'rejected', reason });
    }

    // ===== STATIC FILES =====
    else if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = readFileSync(resolve(__dirname, 'index.html'), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    }

    else {
      json({ error: 'Not found' }, 404);
    }

  } catch (err) {
    console.error('❌', err.message);
    json({ ok: false, error: err.message }, 500);
  }
});

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

server.listen(PORT, () => {
  console.log(`\n🚀 CereProof v3 (Stateless) running at http://localhost:${PORT}`);
  console.log(`   📡 Index: on-chain system.remark (Cere Mainnet)`);
  console.log(`   💾 Storage: DDC (Bucket ${BUCKET_ID})`);
  console.log(`   🔑 Issuer: ${ISSUER_ADDRESS}`);
  console.log(`   UI: http://localhost:${PORT}/`);
  console.log(`   API:`);
  console.log(`     POST /store — raw data storage`);
  console.log(`     GET  /read/:cid — raw data read`);
  console.log(`     GET  /status — server status`);
  console.log(`     POST /credential/store — store a client-signed credential`);
  console.log(`     POST /credential/issue — issue a signed credential (DEPRECATED)`);
  console.log(`     GET  /credential/verify/:cid — verify a credential`);
  console.log(`     GET  /credentials/issued?wallet= — list credentials for a wallet`);
  console.log(`     GET  /api/profile/:address — get verified credentials for a wallet`);
  console.log(`     GET  /profile/:address — public profile page`);
  console.log(`     POST /claim/submit — submit a new claim`);
  console.log(`     GET  /claims/pending — list pending claims`);
  console.log(`     GET  /claims/history?wallet= — claim history by wallet`);
  console.log(`     GET  /claim/:claimId — claim detail`);
  console.log(`     POST /claim/:claimId/approve — approve & issue credential`);
  console.log(`     POST /claim/:claimId/reject — reject a claim\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await api.disconnect();
  await client.disconnect();
  process.exit(0);
});
