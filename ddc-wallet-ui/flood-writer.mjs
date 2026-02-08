#!/usr/bin/env node
// Flood writer: blasts files to DDC as fast as possible with concurrency

const API = 'http://localhost:3847';
let count = 0;
let success = 0;
let errors = 0;
const CONCURRENCY = 10; // parallel writes
const DELAY_MS = 200;   // 200ms between batches = ~50 writes/sec

async function writeOne() {
  const seq = ++count;
  const now = new Date().toISOString();
  const content = JSON.stringify({
    type: 'flood-write',
    seq,
    ts: now,
    msg: `Flood write #${seq}`,
    payload: crypto.randomUUID() + crypto.randomUUID() + crypto.randomUUID(),
  });

  try {
    const res = await fetch(`${API}/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        tags: [
          { key: 'type', value: 'flood' },
          { key: 'seq', value: String(seq) },
        ]
      })
    });
    const result = await res.json();
    if (result.ok) {
      success++;
    } else {
      errors++;
      console.error(`❌ #${seq}: ${result.error}`);
    }
  } catch (err) {
    errors++;
  }
}

async function writeBatch() {
  const promises = Array.from({ length: CONCURRENCY }, () => writeOne());
  await Promise.all(promises);
}

console.log('🌊 DDC FLOOD WRITER — blasting files to DDC');
console.log(`   Concurrency: ${CONCURRENCY} | Batch delay: ${DELAY_MS}ms\n`);

// Status printer every 2 seconds
setInterval(() => {
  console.log(`📊 Total: ${count} | ✅ ${success} | ❌ ${errors} | Rate: ~${Math.round(success / ((Date.now() - start) / 1000))}/sec`);
}, 2000);

const start = Date.now();

// Main loop
async function run() {
  while (true) {
    await writeBatch();
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
}

run();
