import { DdcClient, MAINNET, JsonSigner, FileUri } from '@cere-ddc-sdk/ddc-client';
import { readFileSync } from 'fs';

const walletJson = JSON.parse(readFileSync('.secrets/cere-wallet.json', 'utf-8'));
const signer = new JsonSigner(walletJson, { passphrase: 'roezel' });
const BUCKET_ID = 1229n;
const CID = 'baebb4ig4ze5l2hunoocrpx6nkoxxw45vuirs35doiylyxyvipixo4vz5nu';

const client = await DdcClient.create(signer, MAINNET);

// Try to get a shareable URL
try {
  const fileUri = new FileUri(BUCKET_ID, CID);
  
  // Check if there's a resolveName or getUrl method
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
    .filter(m => !m.startsWith('_'));
  console.log('DdcClient methods:', methods);
  
  // Check if there's a CDN/gateway URL builder
  if (client.getFileUrl) {
    const url = await client.getFileUrl(fileUri);
    console.log('URL:', url);
  }
  
  // Try grantAccess for a public token
  if (client.grantAccess) {
    console.log('\nTrying grantAccess...');
    const token = await client.grantAccess({
      bucketId: BUCKET_ID,
      pieceCid: CID,
      operations: [0], // GET
    });
    console.log('Token:', token?.toString());
  }
} catch(e) {
  console.error('Error:', e.message);
}

await client.disconnect();
process.exit(0);
