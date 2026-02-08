#!/usr/bin/env node
/**
 * Proofi Demo Agent
 * 
 * Demonstrates the agent → wallet connection flow:
 * 1. Agent sends connect request
 * 2. User approves in wallet popup
 * 3. Agent requests age proof
 * 4. Wallet returns selective disclosure
 * 
 * For demo: run this, then open Chrome extension to see approval popup.
 */

const EXTENSION_ID = process.env.PROOFI_EXTENSION_ID || 'YOUR_EXTENSION_ID';
const AGENT_ID = 'demo-agent-001';
const AGENT_NAME = 'Fred Demo Agent';

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    PROOFI DEMO AGENT                         ║
║                                                              ║
║  This agent will request access to your Proofi wallet.       ║
║  Open Chrome and watch for the approval popup.               ║
╚══════════════════════════════════════════════════════════════╝
`);

console.log('Agent ID:', AGENT_ID);
console.log('Agent Name:', AGENT_NAME);
console.log('');

// Demo flow simulation
async function runDemo() {
  console.log('═══ STEP 1: Requesting wallet connection ═══');
  console.log('→ Sending AGENT_CONNECT to extension...');
  console.log('→ Scopes: ["age", "calendar"]');
  console.log('');
  
  // In real implementation, this would use chrome.runtime.sendMessage
  // For demo, we show what the message looks like
  const connectRequest = {
    type: 'AGENT_CONNECT',
    payload: {
      agentId: AGENT_ID,
      name: AGENT_NAME,
      scopes: ['age', 'calendar'],
    }
  };
  console.log('Message:', JSON.stringify(connectRequest, null, 2));
  console.log('');
  
  console.log('⏳ Waiting for user approval in wallet popup...');
  console.log('   (In real demo, extension popup opens here)');
  console.log('');
  
  // Simulate approval
  await sleep(2000);
  
  console.log('✅ User approved! Session created.');
  console.log('');
  
  console.log('═══ STEP 2: Requesting age proof ═══');
  console.log('→ Sending AGENT_PROOF_REQUEST...');
  console.log('→ Requested: age verification (18+)');
  console.log('');
  
  const proofRequest = {
    type: 'AGENT_PROOF_REQUEST',
    payload: {
      agentId: AGENT_ID,
      fields: ['age'],
      predicates: [{ field: 'age', operator: '>=', value: 18 }]
    }
  };
  console.log('Message:', JSON.stringify(proofRequest, null, 2));
  console.log('');
  
  // Simulate proof response
  await sleep(1500);
  
  console.log('✅ Proof received!');
  console.log('');
  console.log('Response:');
  console.log(JSON.stringify({
    ok: true,
    proof: {
      age: { verified: true, predicate: '>=18', disclosed: false }
    },
    disclosed: []
  }, null, 2));
  console.log('');
  
  console.log('═══ STEP 3: Performing action ═══');
  console.log('→ Agent can now perform age-gated actions');
  console.log('→ User\'s actual age was NOT disclosed');
  console.log('→ Only the fact that age >= 18 was proven');
  console.log('');
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      DEMO COMPLETE                          ║');
  console.log('║                                                              ║');
  console.log('║  Key takeaways for Fred:                                     ║');
  console.log('║  • User explicitly approved agent access                     ║');
  console.log('║  • Agent only sees what user permits (scopes)                ║');
  console.log('║  • Selective disclosure: prove facts, hide data              ║');
  console.log('║  • All signed with user\'s private key                       ║');
  console.log('║  • Data stored on Cere DDC, not centralized                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

runDemo().catch(console.error);
