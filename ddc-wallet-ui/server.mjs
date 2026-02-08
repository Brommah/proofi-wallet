import { DdcClient, MAINNET, JsonSigner, File, Tag, FileUri } from '@cere-ddc-sdk/ddc-client';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const secretsDir = resolve(__dirname, '../.secrets');
const PORT = 3847;
const BUCKET_ID = 1229n;

// Init DDC client
console.log('⏳ Initializing DDC client...');
const walletJson = JSON.parse(readFileSync(resolve(secretsDir, 'cere-wallet.json'), 'utf-8'));
const signer = new JsonSigner(walletJson, { passphrase: 'roezel' });
const client = await DdcClient.create(signer, MAINNET);
console.log('✅ Connected to DDC Mainnet');
console.log(`📦 Bucket: ${BUCKET_ID}`);
console.log(`🔑 Wallet: ${walletJson.address}`);

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
    // Status
    if (url.pathname === '/status' && req.method === 'GET') {
      json({
        ok: true,
        connected: true,
        wallet: walletJson.address,
        bucket: BUCKET_ID.toString(),
        network: 'mainnet'
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
    else if (url.pathname.startsWith('/read/') && req.method === 'GET') {
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
  console.log(`\n🚀 DDC Wallet Writer running at http://localhost:${PORT}`);
  console.log(`   UI: http://localhost:${PORT}/`);
  console.log(`   API: http://localhost:${PORT}/store (POST)`);
  console.log(`        http://localhost:${PORT}/read/:cid (GET)`);
  console.log(`        http://localhost:${PORT}/status (GET)\n`);
});
