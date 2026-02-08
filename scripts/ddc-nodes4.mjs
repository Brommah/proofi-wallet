import { DdcClient, MAINNET, JsonSigner } from '@cere-ddc-sdk/ddc-client';
import { readFileSync } from 'fs';

const walletJson = JSON.parse(readFileSync('.secrets/cere-wallet.json', 'utf-8'));
const signer = new JsonSigner(walletJson, { passphrase: 'roezel' });
const client = await DdcClient.create(signer, MAINNET);

const strategy = client.ddcNode.router.strategy;
console.log('Strategy keys:', Object.keys(strategy));
for (const [k, v] of Object.entries(strategy)) {
  if (typeof v === 'string' || typeof v === 'number') console.log(`  ${k}: ${v}`);
  if (Array.isArray(v)) {
    console.log(`  ${k}: [${v.length}]`);
    v.slice(0, 10).forEach((item, i) => {
      const str = typeof item === 'object' ? JSON.stringify(item, (k,v) => {
        if (typeof v === 'bigint') return v.toString();
        if (typeof v === 'function') return '[fn]';
        return v;
      }).slice(0, 500) : String(item);
      console.log(`    [${i}]: ${str}`);
    });
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    console.log(`  ${k}: ${v.constructor?.name}`);
    const keys = Object.keys(v);
    if (keys.length && keys.length < 30) console.log(`    keys: ${keys.join(', ')}`);
  }
}

// Try to get nodes list from blockchain directly
try {
  const bc = client.blockchain;
  // Check for cluster/node methods
  const bcMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(bc))
    .filter(m => m.includes('node') || m.includes('Node') || m.includes('cluster') || m.includes('Cluster'));
  console.log('\nBlockchain node/cluster methods:', bcMethods);
} catch(e) {}

await client.disconnect();
process.exit(0);
