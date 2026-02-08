import { DdcClient, MAINNET, JsonSigner } from '@cere-ddc-sdk/ddc-client';
import { readFileSync } from 'fs';

const walletJson = JSON.parse(readFileSync('.secrets/cere-wallet.json', 'utf-8'));
const signer = new JsonSigner(walletJson, { passphrase: 'roezel' });

console.log('⏳ Connecting...');
const client = await DdcClient.create(signer, MAINNET);
console.log('✅ Connected!\n');

// Get cluster info for bucket 1229
try {
  const bucket = await client.getBucket(1229n);
  console.log('Bucket:', JSON.stringify(bucket, (k,v) => typeof v === 'bigint' ? v.toString() : v));
  
  // Try to find storage nodes via internal router
  const router = client.router || client._router;
  if (router) {
    console.log('\nRouter:', Object.getOwnPropertyNames(Object.getPrototypeOf(router)));
    if (router.nodes) {
      for (const node of router.nodes) {
        console.log('Node:', node.url || node.httpUrl || node.grpcUrl || JSON.stringify(node));
      }
    }
  }
  
  // Check all properties
  const props = Object.getOwnPropertyNames(client).filter(p => !p.startsWith('_'));
  console.log('\nClient props:', props);
  
  // Dig into internals
  for (const [key, val] of Object.entries(client)) {
    if (val && typeof val === 'object' && val.constructor?.name !== 'Object') {
      console.log(`${key}: ${val.constructor?.name}`);
      if (val.nodes || val.storageNodes) {
        const nodes = val.nodes || val.storageNodes;
        console.log('  Nodes:', JSON.stringify(nodes, null, 2).slice(0, 500));
      }
    }
  }
} catch(e) {
  console.error('Error:', e.message);
}

await client.disconnect();
process.exit(0);
