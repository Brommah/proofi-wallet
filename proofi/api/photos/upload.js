// DDC storage with CNS via name parameter in store options
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
  console.log('[INIT] DDC SDK loaded');
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

// CNS name per wallet (sanitized, short for DDC naming limits)
function getCnsName(wallet) {
  return `photos-${wallet.slice(-8)}`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (initError) {
    return res.status(500).json({ error: 'SDK init failed: ' + initError.message });
  }

  try {
    const ddc = await getClient();
    
    // GET - Resolve CNS name to get index
    if (req.method === 'GET') {
      const { wallet } = req.query;
      console.log('[API] GET request, wallet:', wallet);
      
      if (!wallet) {
        return res.status(200).json({ items: [], storage: { used: 0, total: 10737418240 }, cnsStatus: 'no-wallet' });
      }
      
      const cnsName = getCnsName(wallet);
      console.log('[API] Resolving CNS:', cnsName);
      
      try {
        // resolveName returns the CID for the name
        const cid = await ddc.resolveName(BUCKET_ID, cnsName);
        console.log('[API] CNS resolved to CID:', cid);
        
        if (!cid) {
          console.log('[API] No CNS record found');
          return res.status(200).json({ items: [], storage: { used: 0, total: 10737418240 }, cnsStatus: 'not-found' });
        }
        
        // Read index from DDC using the resolved CID
        const { FileUri } = require('@cere-ddc-sdk/ddc-client');
        const uri = new FileUri(BUCKET_ID, cid.toString());
        const f = await ddc.read(uri);
        const chunks = [];
        for await (const c of f.body) chunks.push(c);
        const content = Buffer.concat(chunks).toString();
        const parsed = JSON.parse(content);
        console.log('[API] Parsed index, items count:', parsed.items?.length);
        
        return res.status(200).json({ ...parsed, cnsStatus: 'resolved', indexCid: cid.toString() });
      } catch (e) {
        console.error('[API] CNS/Read error:', e.message);
        return res.status(200).json({ items: [], storage: { used: 0, total: 10737418240 }, cnsStatus: 'error', error: e.message });
      }
    }
    
    // POST - Upload photo + update index with CNS name
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { name, type, data, wallet } = req.body || {};
    console.log('[API] POST request, wallet:', wallet?.slice(0, 10));
    if (!data || !wallet) return res.status(400).json({ error: 'data and wallet required' });
    
    const buf = Buffer.from(data.replace(/^data:[^;]+;base64,/, ''), 'base64');
    const id = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const cnsName = getCnsName(wallet);
    
    // 1. Store photo on DDC
    const photoUri = await ddc.store(BUCKET_ID, new DdcFile(buf));
    console.log('[API] Photo stored:', photoUri.cid);
    
    // 2. Try to read existing index via CNS
    let idx = { items: [], storage: { used: 0, total: 10737418240 } };
    
    try {
      const existingCid = await ddc.resolveName(BUCKET_ID, cnsName);
      if (existingCid) {
        console.log('[API] Existing CNS record:', existingCid.toString());
        const { FileUri } = require('@cere-ddc-sdk/ddc-client');
        const uri = new FileUri(BUCKET_ID, existingCid.toString());
        const f = await ddc.read(uri);
        const chunks = [];
        for await (const c of f.body) chunks.push(c);
        idx = JSON.parse(Buffer.concat(chunks).toString());
        console.log('[API] Existing index has', idx.items?.length, 'items');
      }
    } catch (e) {
      console.log('[API] No existing CNS/index:', e.message);
    }
    
    // 3. Update index
    idx.items.unshift({
      id,
      cid: photoUri.cid,
      name: name || 'photo.jpg',
      type: type || 'image/jpeg',
      size: buf.length,
      uploadedAt: Date.now()
    });
    idx.storage.used = idx.items.reduce((sum, i) => sum + (i.size || 0), 0);
    
    // 4. Store updated index with CNS name (this creates/updates the CNS record!)
    const indexUri = await ddc.store(BUCKET_ID, new DdcFile(Buffer.from(JSON.stringify(idx))), {
      name: cnsName  // This creates a CNS entry pointing to this CID
    });
    console.log('[API] Index stored with CNS name:', cnsName, '->', indexUri.cid);
    
    return res.status(200).json({
      ok: true,
      photoCid: photoUri.cid,
      photoId: id,
      verified: true,
      index: idx,
      indexCid: indexUri.cid,
      cnsName,
      cnsStatus: 'updated'
    });
  } catch (e) {
    console.error('DDC Error:', e);
    return res.status(500).json({ error: e.message });
  }
};

module.exports.config = { api: { bodyParser: { sizeLimit: '75mb' } } };
