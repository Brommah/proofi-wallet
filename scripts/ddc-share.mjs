import { DdcClient, MAINNET, JsonSigner, AuthTokenOperation } from '@cere-ddc-sdk/ddc-client';
import { readFileSync } from 'fs';

const walletJson = JSON.parse(readFileSync('.secrets/cere-wallet.json', 'utf-8'));
const signer = new JsonSigner(walletJson, { passphrase: 'roezel' });
const BUCKET_ID = 1229n;
const CID = 'baebb4ig4ze5l2hunoocrpx6nkoxxw45vuirs35doiylyxyvipixo4vz5nu';

console.log('⏳ Connecting...');
const client = await DdcClient.create(signer, MAINNET);
console.log('✅ Connected!');

// Check if bucket is public
try {
  const bucket = await client.getBucket(BUCKET_ID);
  console.log('📦 Bucket info:', JSON.stringify(bucket, (k,v) => typeof v === 'bigint' ? v.toString() : v));
} catch(e) {
  console.log('Bucket info error:', e.message);
}

// Try generating access token
try {
  console.log('\n🔑 Generating access token...');
  const token = await client.grantAccess({
    bucketId: BUCKET_ID,
    pieceCid: CID,
    operations: [AuthTokenOperation.GET],
  });
  console.log('Token:', token.toString());
  
  // Build CDN URLs to try
  const urls = [
    `https://cdn.mainnet.cere.network/${BUCKET_ID}/${CID}?token=${token}`,
    `https://storage.mainnet.cere.network/${BUCKET_ID}/${CID}?token=${token}`,
  ];
  console.log('\n🌐 Try these URLs in browser:');
  urls.forEach(u => console.log(u));
} catch(e) {
  console.log('Grant access error:', e.message);
  
  // Try public URL anyway
  console.log('\n🌐 Try public URLs (if bucket is public):');
  console.log(`https://cdn.mainnet.cere.network/${BUCKET_ID}/${CID}`);
  console.log(`https://storage.mainnet.cere.network/${BUCKET_ID}/${CID}`);
}

await client.disconnect();
process.exit(0);
