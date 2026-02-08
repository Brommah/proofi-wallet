// Chunked upload - receives file chunks and assembles them
const fs = require('fs');
const path = require('path');

let initError = null;
let DdcClient, DdcFile, MAINNET, JsonSigner;

try {
  require('@polkadot/wasm-crypto/initOnlyAsm');
  const ddcClient = require('@cere-ddc-sdk/ddc-client');
  const blockchain = require('@cere-ddc-sdk/blockchain');
  DdcClient = ddcClient.DdcClient;
  DdcFile = ddcClient.File;
  MAINNET = ddcClient.MAINNET;
  JsonSigner = blockchain.JsonSigner;
} catch (e) {
  initError = e;
}

const BUCKET_ID = BigInt(process.env.DDC_BUCKET_ID || '1229');
let client = null;

// In-memory chunk storage (for serverless, use Redis/KV in production)
const uploads = new Map();

async function getClient() {
  if (initError) throw initError;
  if (client) return client;
  const wallet = JSON.parse(process.env.DDC_WALLET_JSON);
  const signer = new JsonSigner(wallet, { passphrase: process.env.DDC_WALLET_PASSWORD || '' });
  client = await DdcClient.create(signer, { ...MAINNET, logLevel: 'silent' });
  return client;
}

function getCnsName(wallet) {
  return `photos-${wallet.slice(-8)}`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (initError) {
    return res.status(500).json({ error: 'SDK init failed: ' + initError.message });
  }

  try {
    const { uploadId, chunkIndex, totalChunks, chunk, wallet, fileName, fileType, fileSize, finalize } = req.body;

    // Initialize new upload
    if (chunkIndex === 0 && !uploads.has(uploadId)) {
      uploads.set(uploadId, {
        chunks: new Array(totalChunks).fill(null),
        wallet,
        fileName,
        fileType,
        fileSize,
        receivedChunks: 0
      });
    }

    const upload = uploads.get(uploadId);
    if (!upload) {
      return res.status(400).json({ error: 'Upload not found. Start with chunkIndex 0.' });
    }

    // Store chunk
    if (chunk && chunkIndex !== undefined) {
      const chunkBuffer = Buffer.from(chunk, 'base64');
      upload.chunks[chunkIndex] = chunkBuffer;
      upload.receivedChunks++;
      
      return res.status(200).json({ 
        ok: true, 
        chunkIndex, 
        received: upload.receivedChunks,
        total: totalChunks 
      });
    }

    // Finalize upload
    if (finalize) {
      // Check all chunks received
      if (upload.chunks.some(c => c === null)) {
        return res.status(400).json({ error: 'Not all chunks received' });
      }

      // Combine chunks
      const fullBuffer = Buffer.concat(upload.chunks);
      console.log('[CHUNK] Assembled file:', fullBuffer.length, 'bytes');

      const ddc = await getClient();
      const cnsName = getCnsName(upload.wallet);
      const id = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // Store on DDC
      const mediaUri = await ddc.store(BUCKET_ID, new DdcFile(fullBuffer));
      console.log('[CHUNK] Media stored:', mediaUri.cid);

      // Read existing index
      let idx = { items: [], storage: { used: 0, total: 10737418240 } };
      try {
        const existingCid = await ddc.resolveName(BUCKET_ID, cnsName);
        if (existingCid) {
          const { FileUri } = require('@cere-ddc-sdk/ddc-client');
          const uri = new FileUri(BUCKET_ID, existingCid.toString());
          const f = await ddc.read(uri);
          const chunks = [];
          for await (const c of f.body) chunks.push(c);
          idx = JSON.parse(Buffer.concat(chunks).toString());
        }
      } catch (e) {
        console.log('[CHUNK] No existing index:', e.message);
      }

      // Update index
      idx.items.unshift({
        id,
        cid: mediaUri.cid,
        name: upload.fileName,
        type: upload.fileType,
        size: upload.fileSize,
        uploadedAt: Date.now()
      });
      idx.storage.used = idx.items.reduce((sum, i) => sum + (i.size || 0), 0);

      // Store updated index
      const indexUri = await ddc.store(BUCKET_ID, new DdcFile(Buffer.from(JSON.stringify(idx))), {
        name: cnsName
      });

      // Clean up
      uploads.delete(uploadId);

      return res.status(200).json({
        ok: true,
        mediaCid: mediaUri.cid,
        mediaId: id,
        index: idx,
        indexCid: indexUri.cid,
        cnsName
      });
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (e) {
    console.error('Chunk upload error:', e);
    return res.status(500).json({ error: e.message });
  }
};

module.exports.config = { api: { bodyParser: { sizeLimit: '4mb' } } };
