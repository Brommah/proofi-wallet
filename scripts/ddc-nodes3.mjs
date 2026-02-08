import { DdcClient, MAINNET, JsonSigner } from '@cere-ddc-sdk/ddc-client';
import { readFileSync } from 'fs';

const walletJson = JSON.parse(readFileSync('.secrets/cere-wallet.json', 'utf-8'));
const signer = new JsonSigner(walletJson, { passphrase: 'roezel' });

const client = await DdcClient.create(signer, MAINNET);

const router = client.ddcNode.router;
console.log('Router keys:', Object.keys(router));
for (const [k, v] of Object.entries(router)) {
  if (typeof v === 'string') console.log(`  ${k}: ${v}`);
  if (Array.isArray(v)) {
    console.log(`  ${k}: [${v.length} items]`);
    v.slice(0, 5).forEach((item, i) => {
      console.log(`    [${i}]:`, JSON.stringify(item, (k,v) => typeof v === 'bigint' ? v.toString() : v).slice(0, 500));
    });
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    console.log(`  ${k}: ${v.constructor?.name || typeof v}`);
    if (v instanceof Map) {
      for (const [mk, mv] of v) {
        console.log(`    ${mk}:`, JSON.stringify(mv, (k,v) => typeof v === 'bigint' ? v.toString() : v).slice(0, 300));
      }
    }
  }
}

await client.disconnect();
process.exit(0);
