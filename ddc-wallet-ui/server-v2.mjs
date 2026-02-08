import { DdcClient, MAINNET, JsonSigner, File, Tag, FileUri } from '@cere-ddc-sdk/ddc-client';
import { Keyring } from '@polkadot/keyring';
import { signatureVerify, cryptoWaitReady } from '@polkadot/util-crypto';
import { u8aToHex, stringToU8a, hexToU8a } from '@polkadot/util';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const secretsDir = resolve(__dirname, '../.secrets');
const PORT = 3847;
const BUCKET_ID = 1229n;
const CREDENTIALS_INDEX_FILE = resolve(__dirname, 'credentials-index.json');
const CLAIMS_INDEX_FILE = resolve(__dirname, 'claims-index.json');

// Load or init credentials index (with dedup on load)
let credentialsIndex = [];
if (existsSync(CREDENTIALS_INDEX_FILE)) {
  try {
    const raw = JSON.parse(readFileSync(CREDENTIALS_INDEX_FILE, 'utf-8'));
    // Dedup: keep only newest entry per subject+claimType+claimData combo
    const seen = new Map();
    for (const entry of raw) {
      const key = `${entry.subject}|${entry.claimType}|${entry.claimData || ''}`;
      const existing = seen.get(key);
      if (!existing || new Date(entry.issuanceDate) > new Date(existing.issuanceDate)) {
        seen.set(key, entry);
      }
    }
    credentialsIndex = Array.from(seen.values());
    // Save deduped index if size changed
    if (credentialsIndex.length !== raw.length) {
      console.log(`🧹 Deduped credentials index: ${raw.length} → ${credentialsIndex.length}`);
    }
  } catch { credentialsIndex = []; }
}

function saveIndex() {
  writeFileSync(CREDENTIALS_INDEX_FILE, JSON.stringify(credentialsIndex, null, 2));
}

// Load or init claims index
let claimsIndex = [];
if (existsSync(CLAIMS_INDEX_FILE)) {
  try {
    claimsIndex = JSON.parse(readFileSync(CLAIMS_INDEX_FILE, 'utf-8'));
  } catch { claimsIndex = []; }
}

function saveClaimsIndex() {
  writeFileSync(CLAIMS_INDEX_FILE, JSON.stringify(claimsIndex, null, 2));
}

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

console.log('✅ Connected to DDC Mainnet');
console.log(`📦 Bucket: ${BUCKET_ID}`);
console.log(`🔑 Wallet: ${walletJson.address}`);
console.log(`🎓 Credentials indexed: ${credentialsIndex.length}`);
console.log(`📋 Claims indexed: ${claimsIndex.length}`);

// Simple HTTP server
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
    // ===== EXISTING ENDPOINTS =====

    // Status
    if (url.pathname === '/status' && req.method === 'GET') {
      json({
        ok: true,
        connected: true,
        wallet: walletJson.address,
        bucket: BUCKET_ID.toString(),
        network: 'mainnet',
        credentialsIssued: credentialsIndex.length
      });
    }

    // Store
    else if (url.pathname === '/store' && req.method === 'POST') {
      const body = await readBody(req);
      const { content, tags = [] } = JSON.parse(body);

      if (!content) {
        json({ ok: false, error: 'No content provided' }, 400);
        return;
      }

      console.log(`📝 Storing ${content.length} bytes...`);
      
      const ddcTags = tags.map(t => new Tag(t.key, t.value));
      const file = new File(Buffer.from(content), { tags: ddcTags });
      const result = await client.store(BUCKET_ID, file);
      const cid = result.cid.toString();

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

    // Read
    else if (url.pathname.startsWith('/read/') && !url.pathname.startsWith('/read/credential') && req.method === 'GET') {
      const cid = url.pathname.replace('/read/', '');
      console.log(`📖 Reading CID: ${cid}...`);

      const fileUri = new FileUri(BUCKET_ID, cid);
      const fileResponse = await client.read(fileUri);
      
      const chunks = [];
      for await (const chunk of fileResponse.body) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks).toString('utf-8');

      console.log(`✅ Read ${content.length} bytes`);

      json({
        ok: true,
        cid,
        content,
        size: content.length
      });
    }

    // ===== CREDENTIAL ENDPOINTS =====

    // Store a pre-signed credential (client-side signing)
    else if (url.pathname === '/credential/store' && req.method === 'POST') {
      const body = await readBody(req);
      const { credential, signature, issuer } = JSON.parse(body);

      // Validate required structure
      if (!credential || !signature || !issuer) {
        json({ ok: false, error: 'Missing required fields: credential, signature, issuer' }, 400);
        return;
      }

      if (!credential['@context'] || !credential.type || !credential.issuer || !credential.credentialSubject || !credential.issuanceDate) {
        json({ ok: false, error: 'Invalid credential structure: missing @context, type, issuer, credentialSubject, or issuanceDate' }, 400);
        return;
      }

      // Attach the proof section with the client-provided signature
      credential.proof = {
        type: 'Ed25519Signature2020',
        created: credential.issuanceDate,
        verificationMethod: `did:cere:${issuer}#key-1`,
        proofPurpose: 'assertionMethod',
        signatureValue: signature
      };

      // Store on DDC
      const credentialJson = JSON.stringify(credential, null, 2);
      const subject = credential.credentialSubject?.address || credential.credentialSubject?.id || 'unknown';
      const claimType = credential.type?.[1] || credential.type?.[0] || 'VerifiableCredential';

      console.log(`🎓 Storing client-signed credential: ${claimType} for ${subject.slice(0,8)}... (issuer: ${issuer.slice(0,8)}...)`);

      const ddcTags = [
        new Tag('type', 'verifiable-credential'),
        new Tag('credential-type', claimType),
        new Tag('subject', subject),
        new Tag('issuer', issuer)
      ];
      const file = new File(Buffer.from(credentialJson), { tags: ddcTags });
      const result = await client.store(BUCKET_ID, file);
      const cid = result.cid.toString();

      console.log(`✅ Client-signed credential stored! CID: ${cid}`);

      // Add to local index
      const indexEntry = {
        cid,
        claimType,
        claimData: credential.credentialSubject?.claim || '',
        subject,
        subjectName: credential.credentialSubject?.name || '',
        issuer,
        issuanceDate: credential.issuanceDate,
        cdnUrl: `https://cdn.ddc-dragon.com/${BUCKET_ID}/${cid}`
      };
      credentialsIndex.push(indexEntry);
      saveIndex();

      json({
        ok: true,
        cid,
        credential,
        cdnUrl: `https://cdn.ddc-dragon.com/${BUCKET_ID}/${cid}`
      });
    }

    // Issue credential (DEPRECATED — use POST /credential/store with client-side signing instead)
    // This endpoint signs with the server's hardcoded keypair. Kept for backward compatibility.
    else if (url.pathname === '/credential/issue' && req.method === 'POST') {
      console.log('⚠️  DEPRECATED: /credential/issue called — use /credential/store with client-side signing');
      const body = await readBody(req);
      const { subject, claimType, claimData, subjectName } = JSON.parse(body);

      if (!subject || !claimType || !claimData) {
        json({ ok: false, error: 'Missing required fields: subject, claimType, claimData' }, 400);
        return;
      }

      // Build the credential (without signature)
      const credential = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", claimType],
        issuer: {
          id: `did:cere:${walletJson.address}`,
          address: walletJson.address
        },
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
          verificationMethod: `did:cere:${walletJson.address}#key-1`,
          proofPurpose: "assertionMethod"
        }
      };

      // Sign the credential payload (without signature field)
      const payloadToSign = JSON.stringify({
        "@context": credential["@context"],
        type: credential.type,
        issuer: credential.issuer,
        credentialSubject: credential.credentialSubject,
        issuanceDate: credential.issuanceDate
      });

      const signature = issuerPair.sign(stringToU8a(payloadToSign));
      credential.proof.signatureValue = u8aToHex(signature);

      // Store on DDC
      const credentialJson = JSON.stringify(credential, null, 2);
      console.log(`🎓 Issuing credential: ${claimType} for ${subject.slice(0,8)}...`);

      const ddcTags = [
        new Tag('type', 'verifiable-credential'),
        new Tag('credential-type', claimType),
        new Tag('subject', subject),
        new Tag('issuer', walletJson.address)
      ];
      const file = new File(Buffer.from(credentialJson), { tags: ddcTags });
      const result = await client.store(BUCKET_ID, file);
      const cid = result.cid.toString();

      console.log(`✅ Credential issued! CID: ${cid}`);

      // Add to local index
      const indexEntry = {
        cid,
        claimType,
        claimData,
        subject,
        subjectName: subjectName || '',
        issuer: walletJson.address,
        issuanceDate: credential.issuanceDate,
        cdnUrl: `https://cdn.ddc-dragon.com/${BUCKET_ID}/${cid}`
      };
      credentialsIndex.push(indexEntry);
      saveIndex();

      json({
        ok: true,
        cid,
        credential,
        cdnUrl: `https://cdn.ddc-dragon.com/${BUCKET_ID}/${cid}`
      });
    }

    // Verify credential
    else if (url.pathname.startsWith('/credential/verify/') && req.method === 'GET') {
      const cid = url.pathname.replace('/credential/verify/', '');
      console.log(`🔍 Verifying credential CID: ${cid}...`);

      // Read from DDC
      const fileUri = new FileUri(BUCKET_ID, cid);
      const fileResponse = await client.read(fileUri);
      
      const chunks = [];
      for await (const chunk of fileResponse.body) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks).toString('utf-8');

      let credential;
      try {
        credential = JSON.parse(content);
      } catch {
        json({ ok: false, verified: false, error: 'Content is not valid JSON credential' }, 400);
        return;
      }

      // Check structure
      if (!credential.proof?.signatureValue || !credential.issuer?.address) {
        json({
          ok: true,
          verified: false,
          error: 'Not a signed credential (missing proof or issuer)',
          credential
        });
        return;
      }

      // Reconstruct the signed payload
      const payloadToVerify = JSON.stringify({
        "@context": credential["@context"],
        type: credential.type,
        issuer: credential.issuer,
        credentialSubject: credential.credentialSubject,
        issuanceDate: credential.issuanceDate
      });

      try {
        // Detect signature type from proof section
        const isEd25519 = credential.proof.type?.includes('Ed25519');
        const result = signatureVerify(
          stringToU8a(payloadToVerify),
          hexToU8a(credential.proof.signatureValue),
          credential.issuer.address
        );

        console.log(`${result.isValid ? '✅' : '❌'} Credential verification: ${result.isValid}`);

        json({
          ok: true,
          verified: result.isValid,
          credential,
          issuer: credential.issuer,
          subject: credential.credentialSubject,
          issuanceDate: credential.issuanceDate,
          claimType: credential.type?.[1] || credential.type?.[0],
          cid
        });
      } catch (verifyErr) {
        json({
          ok: true,
          verified: false,
          error: `Signature verification failed: ${verifyErr.message}`,
          credential
        });
      }
    }

    // List issued credentials (optionally filtered by wallet)
    else if (url.pathname === '/credentials/issued' && req.method === 'GET') {
      const walletFilter = url.searchParams.get('wallet');
      const filtered = walletFilter
        ? credentialsIndex.filter(c => c.subject === walletFilter || c.issuer === walletFilter)
        : credentialsIndex;
      json({
        ok: true,
        count: filtered.length,
        credentials: filtered
      });
    }

    // ===== PROFILE ENDPOINTS =====

    // Get credentials for a specific wallet address (subject or issuer)
    else if (url.pathname.startsWith('/api/profile/') && req.method === 'GET') {
      const address = url.pathname.replace('/api/profile/', '');
      console.log(`👤 Profile lookup: ${address.slice(0, 12)}...`);

      // Find all credentials where this address is subject OR issuer
      const received = credentialsIndex.filter(c => c.subject === address);
      const issued = credentialsIndex.filter(c => c.issuer === address);

      // Verify each received credential
      const verifiedCredentials = [];
      for (const cred of received) {
        try {
          const fileUri = new FileUri(BUCKET_ID, cred.cid);
          const fileResponse = await client.read(fileUri);
          const chunks = [];
          for await (const chunk of fileResponse.body) chunks.push(chunk);
          const content = JSON.parse(Buffer.concat(chunks).toString('utf-8'));

          const payloadToVerify = JSON.stringify({
            "@context": content["@context"],
            type: content.type,
            issuer: content.issuer,
            credentialSubject: content.credentialSubject,
            issuanceDate: content.issuanceDate
          });

          const result = signatureVerify(
            stringToU8a(payloadToVerify),
            hexToU8a(content.proof.signatureValue),
            content.issuer.address
          );

          verifiedCredentials.push({
            ...cred,
            verified: result.isValid,
            credential: content
          });
        } catch (err) {
          verifiedCredentials.push({
            ...cred,
            verified: false,
            error: err.message
          });
        }
      }

      json({
        ok: true,
        address,
        received: {
          count: verifiedCredentials.length,
          credentials: verifiedCredentials
        },
        issued: {
          count: issued.length,
          credentials: issued
        }
      });
    }

    // Profile page (public, shareable)
    else if (url.pathname.startsWith('/profile/') && req.method === 'GET') {
      const html = readFileSync(resolve(__dirname, 'profile.html'), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    }

    // ===== CLAIM PIPELINE ENDPOINTS =====

    // Submit a new claim
    else if (url.pathname === '/claim/submit' && req.method === 'POST') {
      const body = await readBody(req);
      const { claimType, documentText, documentName, subjectWallet, subjectName, metadata } = JSON.parse(body);

      if (!claimType || !documentText || !subjectWallet) {
        json({ ok: false, error: 'Missing required fields: claimType, documentText, subjectWallet' }, 400);
        return;
      }

      const claimId = `claim_${randomUUID().slice(0, 12)}`;
      const submittedAt = new Date().toISOString();

      // Store raw claim data on DDC
      const claimPayload = JSON.stringify({
        claimId,
        claimType,
        documentText,
        documentName: documentName || '',
        subjectWallet,
        subjectName: subjectName || '',
        metadata: metadata || {},
        submittedAt
      }, null, 2);

      console.log(`📋 Submitting claim: ${claimType} for ${subjectWallet.slice(0, 8)}...`);

      const ddcTags = [
        new Tag('type', 'claim'),
        new Tag('claim-type', claimType),
        new Tag('subject', subjectWallet),
        new Tag('status', 'pending'),
        new Tag('claim-id', claimId)
      ];
      const file = new File(Buffer.from(claimPayload), { tags: ddcTags });
      const result = await client.store(BUCKET_ID, file);
      const ddcCid = result.cid.toString();

      console.log(`✅ Claim stored on DDC! CID: ${ddcCid}`);

      // Add to claims index
      const claimEntry = {
        claimId,
        claimType,
        subjectWallet,
        subjectName: subjectName || '',
        documentText,
        documentName: documentName || '',
        metadata: metadata || {},
        status: 'pending',
        submittedAt,
        ddcCid,
        credentialCid: null,
        rejectionReason: null,
        approvedAt: null
      };
      claimsIndex.push(claimEntry);
      saveClaimsIndex();

      json({
        ok: true,
        claimId,
        ddcCid,
        status: 'pending',
        cdnUrl: `https://cdn.ddc-dragon.com/${BUCKET_ID}/${ddcCid}`
      });
    }

    // List pending claims
    else if (url.pathname === '/claims/pending' && req.method === 'GET') {
      const pending = claimsIndex
        .filter(c => c.status === 'pending')
        .map(({ claimId, claimType, subjectName, documentName, submittedAt, status }) => ({
          claimId, claimType, subjectName, documentName, submittedAt, status
        }));

      json({
        ok: true,
        count: pending.length,
        claims: pending
      });
    }

    // Claims history (filter by wallet)
    else if (url.pathname === '/claims/history' && req.method === 'GET') {
      const wallet = url.searchParams.get('wallet');
      const filtered = wallet
        ? claimsIndex.filter(c => c.subjectWallet === wallet)
        : claimsIndex;

      json({
        ok: true,
        count: filtered.length,
        claims: filtered.map(({ claimId, claimType, subjectName, subjectWallet, documentName, submittedAt, status, credentialCid, rejectionReason, approvedAt }) => ({
          claimId, claimType, subjectName, subjectWallet, documentName, submittedAt, status, credentialCid, rejectionReason, approvedAt
        }))
      });
    }

    // Get claim detail
    else if (url.pathname.match(/^\/claim\/claim_[a-f0-9-]+$/) && req.method === 'GET') {
      const claimId = url.pathname.replace('/claim/', '');
      const claim = claimsIndex.find(c => c.claimId === claimId);

      if (!claim) {
        json({ ok: false, error: 'Claim not found' }, 404);
        return;
      }

      json({ ok: true, claim });
    }

    // Approve a claim
    // TODO: When organizations have their own Cere wallets, this should move to client-side signing
    // (similar to /credential/store). For now, uses the server's hardcoded keypair.
    else if (url.pathname.match(/^\/claim\/claim_[a-f0-9-]+\/approve$/) && req.method === 'POST') {
      const claimId = url.pathname.replace('/claim/', '').replace('/approve', '');
      const claim = claimsIndex.find(c => c.claimId === claimId);

      if (!claim) {
        json({ ok: false, error: 'Claim not found' }, 404);
        return;
      }
      if (claim.status !== 'pending') {
        json({ ok: false, error: `Claim already ${claim.status}` }, 400);
        return;
      }

      console.log(`✅ Approving claim ${claimId} — issuing credential...`);

      // Issue credential (reuse /credential/issue logic)
      const credential = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", claim.claimType],
        issuer: {
          id: `did:cere:${walletJson.address}`,
          address: walletJson.address
        },
        credentialSubject: {
          id: `did:cere:${claim.subjectWallet}`,
          address: claim.subjectWallet,
          name: claim.subjectName,
          claim: claim.metadata
        },
        issuanceDate: new Date().toISOString(),
        proof: {
          type: "Sr25519Signature2024",
          created: new Date().toISOString(),
          verificationMethod: `did:cere:${walletJson.address}#key-1`,
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
      const signature = issuerPair.sign(stringToU8a(payloadToSign));
      credential.proof.signatureValue = u8aToHex(signature);

      // Store credential on DDC
      const credentialJson = JSON.stringify(credential, null, 2);
      const credTags = [
        new Tag('type', 'verifiable-credential'),
        new Tag('credential-type', claim.claimType),
        new Tag('subject', claim.subjectWallet),
        new Tag('issuer', walletJson.address),
        new Tag('source-claim', claimId)
      ];
      const credFile = new File(Buffer.from(credentialJson), { tags: credTags });
      const credResult = await client.store(BUCKET_ID, credFile);
      const credentialCid = credResult.cid.toString();

      console.log(`🎓 Credential issued! CID: ${credentialCid}`);

      // Update claim status
      claim.status = 'approved';
      claim.credentialCid = credentialCid;
      claim.approvedAt = new Date().toISOString();
      saveClaimsIndex();

      // Also add to credentials index
      const indexEntry = {
        cid: credentialCid,
        claimType: claim.claimType,
        claimData: claim.metadata,
        subject: claim.subjectWallet,
        subjectName: claim.subjectName,
        issuer: walletJson.address,
        issuanceDate: credential.issuanceDate,
        cdnUrl: `https://cdn.ddc-dragon.com/${BUCKET_ID}/${credentialCid}`,
        sourceClaimId: claimId
      };
      credentialsIndex.push(indexEntry);
      saveIndex();

      json({
        ok: true,
        claimId,
        status: 'approved',
        credentialCid,
        credential,
        cdnUrl: `https://cdn.ddc-dragon.com/${BUCKET_ID}/${credentialCid}`
      });
    }

    // Reject a claim
    else if (url.pathname.match(/^\/claim\/claim_[a-f0-9-]+\/reject$/) && req.method === 'POST') {
      const claimId = url.pathname.replace('/claim/', '').replace('/reject', '');
      const claim = claimsIndex.find(c => c.claimId === claimId);

      if (!claim) {
        json({ ok: false, error: 'Claim not found' }, 404);
        return;
      }
      if (claim.status !== 'pending') {
        json({ ok: false, error: `Claim already ${claim.status}` }, 400);
        return;
      }

      const body = await readBody(req);
      let reason = '';
      try {
        const parsed = JSON.parse(body);
        reason = parsed.reason || '';
      } catch { /* no body is ok */ }

      console.log(`❌ Rejecting claim ${claimId}: ${reason || 'no reason given'}`);

      claim.status = 'rejected';
      claim.rejectionReason = reason;
      saveClaimsIndex();

      json({
        ok: true,
        claimId,
        status: 'rejected',
        reason
      });
    }

    // Static files (serve UI)
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
  console.log(`\n🚀 DDC Verifiable Credentials Server running at http://localhost:${PORT}`);
  console.log(`   UI: http://localhost:${PORT}/`);
  console.log(`   API:`);
  console.log(`     POST /store — raw data storage`);
  console.log(`     GET  /read/:cid — raw data read`);
  console.log(`     GET  /status — server status`);
  console.log(`     POST /credential/store — store a client-signed credential`);
  console.log(`     POST /credential/issue — issue a signed credential (DEPRECATED)`);
  console.log(`     GET  /credential/verify/:cid — verify a credential`);
  console.log(`     GET  /credentials/issued — list issued credentials
     GET  /api/profile/:address — get verified credentials for a wallet
     GET  /profile/:address — public profile page
     POST /claim/submit — submit a new claim
     GET  /claims/pending — list pending claims
     GET  /claims/history?wallet= — claim history by wallet
     GET  /claim/:claimId — claim detail
     POST /claim/:claimId/approve — approve & issue credential
     POST /claim/:claimId/reject — reject a claim\n`);
});
