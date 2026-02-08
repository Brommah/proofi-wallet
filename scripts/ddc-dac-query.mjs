import { DdcClient, MAINNET, JsonSigner } from '@cere-ddc-sdk/ddc-client';
import { readFileSync } from 'fs';

const walletJson = JSON.parse(readFileSync('.secrets/cere-wallet.json', 'utf-8'));
const signer = new JsonSigner(walletJson, { passphrase: 'roezel' });

console.log('⏳ Connecting...');
const client = await DdcClient.create(signer, MAINNET);
console.log('✅ Connected!');

// Get storage nodes from the strategy
const strategy = client.ddcNode.router.strategy;

// Get the nodes that serve our cluster
const clusterNodes = [];
for (const [clusterId, nodes] of strategy.clusterNodes) {
  if (nodes && nodes.length > 0) {
    console.log(`\nCluster: ${clusterId} — ${nodes.length} nodes`);
    // Find nodes with activity/collector role
    nodes.slice(0, 5).forEach((n, i) => {
      const mode = n.mode || 'unknown';
      const httpUrl = n.httpUrl || '';
      const grpcUrl = n.grpcUrl || '';
      console.log(`  [${i}] ${mode} | ${httpUrl} | ${grpcUrl}`);
      if (httpUrl) clusterNodes.push({ httpUrl, grpcUrl, mode });
    });
  }
}

// The DDC SDK uses gRPC internally — let's check if there are collector/DAC-specific nodes
console.log('\n=== Looking for DAC/Collector nodes ===');
for (const [clusterId, nodes] of strategy.clusterNodes) {
  if (!nodes) continue;
  const modes = new Set(nodes.map(n => n.mode));
  console.log(`Cluster ${clusterId}: modes = ${[...modes].join(', ')}`);
  
  // Look for nodes that might be collectors
  const collectors = nodes.filter(n => 
    n.mode === 'Collector' || n.mode === 'collector' || 
    n.mode === 'Full' || n.mode === 'full'
  );
  if (collectors.length > 0) {
    console.log(`  Found ${collectors.length} collector nodes:`);
    collectors.forEach(c => console.log(`    ${c.httpUrl} (${c.mode})`));
  }
}

// Try querying a storage node for activity data via its HTTP endpoint
// The DAC stores activity records on storage nodes under activity package
const testNode = clusterNodes[0];
if (testNode) {
  console.log(`\n=== Testing activity endpoint on ${testNode.httpUrl} ===`);
  try {
    const urls = [
      `${testNode.httpUrl}/api/v1/activity/bucket/1229`,
      `${testNode.httpUrl}/api/v1/activity`,
      `${testNode.httpUrl}/activity/bucket/1229`,
    ];
    for (const url of urls) {
      try {
        const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
        console.log(`  ${url} → ${resp.status}`);
        if (resp.ok) {
          const text = await resp.text();
          console.log(`  Response: ${text.slice(0, 500)}`);
        }
      } catch(e) {
        console.log(`  ${url} → ${e.message}`);
      }
    }
  } catch(e) {
    console.log('  Error:', e.message);
  }
}

await client.disconnect();
process.exit(0);
