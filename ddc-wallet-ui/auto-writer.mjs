#!/usr/bin/env node
// Auto-writer: stores a file to DDC every 10 seconds via the local server API

const API = 'http://localhost:3847';
let count = 0;

async function writeFile() {
  count++;
  const now = new Date().toISOString();
  const content = JSON.stringify({
    type: 'auto-write',
    sequence: count,
    timestamp: now,
    message: `Automated write #${count} from Claudemart`,
    data: {
      uptime_seconds: count * 10,
      random: Math.random().toString(36).slice(2, 10),
    }
  }, null, 2);

  try {
    const res = await fetch(`${API}/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        tags: [
          { key: 'type', value: 'auto-write' },
          { key: 'seq', value: String(count) },
          { key: 'ts', value: now },
        ]
      })
    });
    const result = await res.json();
    if (result.ok) {
      console.log(`[#${count}] ✅ ${now} → CID: ${result.cid}`);
    } else {
      console.error(`[#${count}] ❌ ${result.error}`);
    }
  } catch (err) {
    console.error(`[#${count}] ❌ ${err.message}`);
  }
}

console.log('🔄 DDC Auto-Writer started — writing every 10 seconds');
console.log(`   Target: ${API}/store\n`);

// First write immediately
writeFile();

// Then every 10 seconds
setInterval(writeFile, 10_000);
