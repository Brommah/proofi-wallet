import { DdcClient, MAINNET, JsonSigner, File, Tag, FileUri } from '@cere-ddc-sdk/ddc-client';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const secretsDir = resolve(__dirname, '../.secrets');

const walletJson = JSON.parse(readFileSync(resolve(secretsDir, 'cere-wallet.json'), 'utf-8'));
const password = 'roezel';
const BUCKET_ID = 1229n;

console.log('🔑 Wallet:', walletJson.address);
console.log('📦 Bucket:', BUCKET_ID.toString());

try {
  const signer = new JsonSigner(walletJson, { passphrase: password });
  console.log('⏳ Connecting...');
  const client = await DdcClient.create(signer, MAINNET);
  console.log('✅ Connected!\n');

  // Store a test message
  const testData = JSON.stringify({
    type: 'agent-memory',
    from: 'claudemart',
    timestamp: new Date().toISOString(),
    content: 'First message from Claudemart on DDC. Hello decentralized world! 🌍',
    metadata: {
      agent: 'claudemart',
      owner: 'mart',
      purpose: 'memory-sync-test'
    }
  });

  console.log('📝 Storing test data...');
  const file = new File(Buffer.from(testData), {
    tags: [
      new Tag('type', 'agent-memory'),
      new Tag('agent', 'claudemart'),
      new Tag('owner', 'mart'),
    ]
  });

  const result = await client.store(BUCKET_ID, file);
  console.log('✅ Stored!');
  console.log('🔗 CID:', result.cid.toString());

  // Now read it back
  console.log('\n📖 Reading back...');
  const fileUri = new FileUri(BUCKET_ID, result.cid.toString());
  const fileResponse = await client.read(fileUri);
  // Try different read patterns
  let readBack;
  if (fileResponse.body) {
    const chunks = [];
    for await (const chunk of fileResponse.body) {
      chunks.push(chunk);
    }
    readBack = Buffer.concat(chunks).toString('utf-8');
  } else if (typeof fileResponse.text === 'function') {
    readBack = await fileResponse.text();
  } else if (fileResponse instanceof Uint8Array || Buffer.isBuffer(fileResponse)) {
    readBack = Buffer.from(fileResponse).toString('utf-8');
  } else {
    readBack = JSON.stringify(fileResponse);
  }
  console.log('📄 Content:', readBack);

  console.log('\n🎉 Store + Read successful on DDC!');
  console.log('🔗 CID to share with Bren:', result.cid.toString());
  
  await client.disconnect();
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  console.error(err.stack?.split('\n').slice(0, 5).join('\n'));
  process.exit(1);
}
