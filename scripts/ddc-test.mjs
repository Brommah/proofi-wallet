import { DdcClient, MAINNET, JsonSigner } from '@cere-ddc-sdk/ddc-client';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const secretsDir = resolve(__dirname, '../.secrets');

const walletJson = JSON.parse(readFileSync(resolve(secretsDir, 'cere-wallet.json'), 'utf-8'));
const password = 'roezel';

console.log('🔑 Wallet:', walletJson.address);
console.log('🌐 RPC:', MAINNET.blockchain);

try {
  console.log('\n⏳ Creating signer...');
  const signer = new JsonSigner(walletJson, { passphrase: password });
  
  console.log('⏳ Connecting to DDC (this may take 30s)...');
  const client = await DdcClient.create(signer, {
    ...MAINNET,
    logLevel: 'info',
  });
  
  console.log('✅ Connected!');
  
  try {
    const balance = await client.getBalance();
    console.log('💎 Balance:', balance?.toString());
  } catch(e) { console.log('Balance check failed:', e.message); }
  
  try {
    const deposit = await client.getDeposit();
    console.log('💰 Deposit:', deposit?.toString());
  } catch(e) { console.log('Deposit check failed:', e.message); }

  console.log('\n🎉 DDC connection works!');
  await client.disconnect();
  process.exit(0);
  
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
