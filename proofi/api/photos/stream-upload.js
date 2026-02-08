// Streaming upload endpoint - uses formidable for file parsing
// This avoids loading the entire file into memory

const formidable = require('formidable');
const fs = require('fs');

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

  const form = formidable({
    maxFileSize: 100 * 1024 * 1024, // 100MB
    keepExtensions: true,
  });

  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const wallet = Array.isArray(fields.wallet) ? fields.wallet[0] : fields.wallet;
    const file = files.file?.[0] || files.file;
    
    if (!file || !wallet) {
      return res.status(400).json({ error: 'file and wallet required' });
    }

    const ddc = await getClient();
    const cnsName = getCnsName(wallet);
    const id = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Read file from temp location
    const fileBuffer = fs.readFileSync(file.filepath);
    
    // Store on DDC
    const mediaUri = await ddc.store(BUCKET_ID, new DdcFile(fileBuffer));
    console.log('[STREAM] Media stored:', mediaUri.cid);

    // Read existing index via CNS
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
      console.log('[STREAM] No existing index:', e.message);
    }

    // Update index
    idx.items.unshift({
      id,
      cid: mediaUri.cid,
      name: file.originalFilename || 'media',
      type: file.mimetype || 'application/octet-stream',
      size: file.size,
      uploadedAt: Date.now()
    });
    idx.storage.used = idx.items.reduce((sum, i) => sum + (i.size || 0), 0);

    // Store updated index with CNS name
    const indexUri = await ddc.store(BUCKET_ID, new DdcFile(Buffer.from(JSON.stringify(idx))), {
      name: cnsName
    });

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      ok: true,
      mediaCid: mediaUri.cid,
      mediaId: id,
      index: idx,
      indexCid: indexUri.cid,
      cnsName
    });
  } catch (e) {
    console.error('Stream upload error:', e);
    return res.status(500).json({ error: e.message });
  }
};

module.exports.config = {
  api: {
    bodyParser: false, // Important: disable body parser for formidable
  }
};
