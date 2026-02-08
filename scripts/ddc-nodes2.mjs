import { DdcClient, MAINNET, JsonSigner } from '@cere-ddc-sdk/ddc-client';
import { readFileSync } from 'fs';

const walletJson = JSON.parse(readFileSync('.secrets/cere-wallet.json', 'utf-8'));
const signer = new JsonSigner(walletJson, { passphrase: 'roezel' });

const client = await DdcClient.create(signer, MAINNET);

// Deep inspect ddcNode
const node = client.ddcNode;
console.log('BalancedNode keys:', Object.keys(node));
console.log('BalancedNode props:', Object.getOwnPropertyNames(node));

// Check for URL/host info
for (const [k, v] of Object.entries(node)) {
  if (typeof v === 'string') console.log(`  ${k}: ${v}`);
  if (Array.isArray(v)) {
    console.log(`  ${k}: [${v.length} items]`);
    v.forEach((item, i) => {
      if (typeof item === 'object') {
        console.log(`    [${i}]:`, JSON.stringify(item).slice(0, 200));
        // Look for URLs
        for (const [ik, iv] of Object.entries(item)) {
          if (typeof iv === 'string' && (iv.includes('http') || iv.includes('grpc') || iv.includes('://')))
            console.log(`    >>> ${ik}: ${iv}`);
        }
      }
    });
  }
  if (v && typeof v === 'object' && !Array.isArray(v) && v.constructor?.name) {
    console.log(`  ${k}: ${v.constructor.name}`);
    const innerKeys = Object.keys(v);
    if (innerKeys.length < 20) {
      for (const ik of innerKeys) {
        const iv = v[ik];
        if (typeof iv === 'string') console.log(`    ${ik}: ${iv}`);
        if (Array.isArray(iv)) {
          console.log(`    ${ik}: [${iv.length}]`);
          iv.slice(0, 3).forEach((item, i) => {
            const s = typeof item === 'object' ? JSON.stringify(item).slice(0, 300) : String(item);
            console.log(`      [${i}]: ${s}`);
          });
        }
      }
    }
  }
}

await client.disconnect();
process.exit(0);
