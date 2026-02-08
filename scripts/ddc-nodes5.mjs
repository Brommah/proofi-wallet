import { DdcClient, MAINNET, JsonSigner, FileUri } from '@cere-ddc-sdk/ddc-client';
import { readFileSync } from 'fs';

const walletJson = JSON.parse(readFileSync('.secrets/cere-wallet.json', 'utf-8'));
const signer = new JsonSigner(walletJson, { passphrase: 'roezel' });
const client = await DdcClient.create(signer, MAINNET);

// Force node discovery by doing a read
const CID = 'baebb4ig4ze5l2hunoocrpx6nkoxxw45vuirs35doiylyxyvipixo4vz5nu';
try {
  const fileUri = new FileUri(1229n, CID);
  const resp = await client.read(fileUri);
  const chunks = [];
  for await (const c of resp.body) chunks.push(c);
  console.log('Read OK, length:', Buffer.concat(chunks).length);
} catch(e) { console.log('Read err:', e.message); }

const strategy = client.ddcNode.router.strategy;

console.log('\n=== nodesMap ===');
for (const [k, v] of strategy.nodesMap) {
  const info = {};
  for (const [ik, iv] of Object.entries(v)) {
    if (typeof iv === 'string' || typeof iv === 'number' || typeof iv === 'boolean') info[ik] = iv;
  }
  console.log(`  ${k}:`, JSON.stringify(info));
}

console.log('\n=== clusterNodes ===');
for (const [k, v] of strategy.clusterNodes) {
  console.log(`  cluster ${k}: ${Array.isArray(v) ? v.length + ' nodes' : typeof v}`);
  if (Array.isArray(v)) {
    v.forEach((n, i) => {
      const info = {};
      for (const [ik, iv] of Object.entries(n)) {
        if (typeof iv === 'string' || typeof iv === 'number' || typeof iv === 'boolean') info[ik] = iv;
      }
      console.log(`    [${i}]:`, JSON.stringify(info));
    });
  }
}

await client.disconnect();
process.exit(0);
