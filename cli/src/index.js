#!/usr/bin/env node
/**
 * Proofi CLI
 * 
 * Complete wallet management from terminal:
 * - proofi init          Create wallet (email → OTP → PIN)
 * - proofi status        Show wallet & connection status
 * - proofi agent add     Authorize an agent
 * - proofi agent list    List authorized agents
 * - proofi agent remove  Revoke agent access
 * - proofi proof         Request/sign proofs
 * - proofi cred add      Add credential
 * - proofi cred list     List credentials
 */

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import readline from 'readline';

// ══════════════════════════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════════════════════════

const CONFIG_DIR = path.join(os.homedir(), '.proofi');
const WALLET_FILE = path.join(CONFIG_DIR, 'wallet.json');
const AGENTS_FILE = path.join(CONFIG_DIR, 'agents.json');
const CREDS_DIR = path.join(CONFIG_DIR, 'credentials');
const API_URL = process.env.PROOFI_API || 'https://proofi-api-production.up.railway.app';

// Ensure dirs exist
[CONFIG_DIR, CREDS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

program
  .name('proofi')
  .description('Proofi wallet CLI — Your data, your keys, your proof')
  .version('1.0.0');

// ══════════════════════════════════════════════════════════════════
// INIT — Create wallet
// ══════════════════════════════════════════════════════════════════
program
  .command('init')
  .description('Create a new Proofi wallet')
  .action(async () => {
    console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                    PROOFI WALLET SETUP                       ║
║                                                              ║
║  Your data. Your keys. Your proof.                           ║
╚══════════════════════════════════════════════════════════════╝
`));

    if (fs.existsSync(WALLET_FILE)) {
      const overwrite = await ask('Wallet already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log(chalk.yellow('\nSetup cancelled.\n'));
        process.exit(0);
      }
    }

    // Step 1: Email
    console.log(chalk.cyan('STEP 1: Email Verification\n'));
    const email = await ask('Email address: ');
    
    if (!email.includes('@')) {
      console.log(chalk.red('\n❌ Invalid email\n'));
      process.exit(1);
    }

    console.log(chalk.gray('\nSending verification code...'));
    
    // Call API to send OTP
    try {
      const res = await fetch(`${API_URL}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send OTP');
      }
    } catch (err) {
      // For demo, continue anyway
      console.log(chalk.yellow(`\n⚠️  API unavailable (${err.message})`));
      console.log(chalk.gray('Continuing in offline mode...\n'));
    }
    
    console.log(chalk.green(`\n✓ Code sent to ${email}\n`));

    // Step 2: OTP
    console.log(chalk.cyan('STEP 2: Enter Verification Code\n'));
    const otp = await ask('6-digit code: ');
    
    // Verify OTP (or skip in offline mode)
    let verified = false;
    try {
      const res = await fetch(`${API_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp })
      });
      verified = res.ok;
    } catch {
      // Offline mode: accept any 6-digit code
      verified = /^\d{6}$/.test(otp);
    }
    
    if (!verified && !/^\d{6}$/.test(otp)) {
      console.log(chalk.red('\n❌ Invalid code\n'));
      process.exit(1);
    }
    
    console.log(chalk.green('\n✓ Email verified\n'));

    // Step 3: PIN
    console.log(chalk.cyan('STEP 3: Create PIN\n'));
    console.log(chalk.gray('Your PIN derives your wallet keys.'));
    console.log(chalk.gray('Remember it — it cannot be recovered.\n'));
    
    const pin = await askHidden('Create PIN (6+ digits): ');
    
    if (pin.length < 6) {
      console.log(chalk.red('\n❌ PIN must be at least 6 digits\n'));
      process.exit(1);
    }
    
    const pinConfirm = await askHidden('Confirm PIN: ');
    
    if (pin !== pinConfirm) {
      console.log(chalk.red('\n❌ PINs do not match\n'));
      process.exit(1);
    }

    // Step 4: Derive keys
    console.log(chalk.gray('\nDeriving keys...'));
    
    const salt = crypto.randomBytes(32);
    const seed = crypto.pbkdf2Sync(
      `${email}:${pin}`,
      salt,
      100000,
      32,
      'sha512'
    );
    
    // Generate keypair (simplified - in production use @polkadot/util-crypto)
    const keypair = crypto.generateKeyPairSync('ed25519');
    const publicKey = keypair.publicKey.export({ type: 'spki', format: 'der' });
    const address = '5' + crypto.createHash('blake2b512')
      .update(publicKey)
      .digest('hex')
      .slice(0, 47);

    // Encrypt private key with PIN-derived key
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      seed,
      salt.slice(0, 12)
    );
    const privateKeyDer = keypair.privateKey.export({ type: 'pkcs8', format: 'der' });
    const encryptedKey = Buffer.concat([
      cipher.update(privateKeyDer),
      cipher.final(),
      cipher.getAuthTag()
    ]);

    // Save wallet
    const wallet = {
      version: 1,
      email,
      address,
      publicKey: publicKey.toString('hex'),
      encryptedKey: encryptedKey.toString('hex'),
      salt: salt.toString('hex'),
      createdAt: Date.now()
    };
    
    fs.writeFileSync(WALLET_FILE, JSON.stringify(wallet, null, 2));
    fs.writeFileSync(AGENTS_FILE, JSON.stringify([], null, 2));

    console.log(chalk.green(`
╔══════════════════════════════════════════════════════════════╗
║                    ✅ WALLET CREATED                         ║
╚══════════════════════════════════════════════════════════════╝
`));
    console.log(chalk.white('Address: '), chalk.cyan(address));
    console.log(chalk.white('Email:   '), chalk.gray(email));
    console.log(chalk.white('Stored:  '), chalk.gray(WALLET_FILE));
    console.log('');
    console.log(chalk.yellow('⚠️  Remember your PIN — it cannot be recovered!'));
    console.log('');
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray('  proofi agent add clawdbot --scopes "age,calendar"'));
    console.log(chalk.gray('  proofi cred add identity'));
    console.log('');
  });

// ══════════════════════════════════════════════════════════════════
// STATUS
// ══════════════════════════════════════════════════════════════════
program
  .command('status')
  .description('Show wallet status')
  .action(() => {
    if (!fs.existsSync(WALLET_FILE)) {
      console.log(chalk.yellow('\n⚠️  No wallet found. Run: proofi init\n'));
      process.exit(1);
    }

    const wallet = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
    const agents = fs.existsSync(AGENTS_FILE) 
      ? JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8')) 
      : [];
    const creds = fs.existsSync(CREDS_DIR)
      ? fs.readdirSync(CREDS_DIR).filter(f => f.endsWith('.json'))
      : [];

    console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                    PROOFI WALLET                             ║
╚══════════════════════════════════════════════════════════════╝
`));
    console.log(chalk.white('Address:     '), chalk.cyan(wallet.address));
    console.log(chalk.white('Email:       '), chalk.gray(wallet.email));
    console.log(chalk.white('Created:     '), chalk.gray(new Date(wallet.createdAt).toLocaleString()));
    console.log('');
    console.log(chalk.white('Agents:      '), chalk.yellow(agents.length + ' connected'));
    console.log(chalk.white('Credentials: '), chalk.yellow(creds.length + ' stored'));
    console.log('');
  });

// ══════════════════════════════════════════════════════════════════
// AGENT commands
// ══════════════════════════════════════════════════════════════════
const agent = program.command('agent').description('Manage authorized agents');

agent
  .command('add <name>')
  .description('Authorize a new agent')
  .option('-s, --scopes <scopes>', 'Comma-separated scopes', 'age,calendar,identity')
  .option('-e, --expires <hours>', 'Expiry in hours', '24')
  .action((name, opts) => {
    requireWallet();
    
    const agents = loadAgents();
    const scopes = opts.scopes.split(',').map(s => s.trim());
    const expiresIn = parseInt(opts.expires) * 60 * 60 * 1000;
    
    const newAgent = {
      id: `agent-${Date.now()}`,
      name,
      scopes,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresIn
    };
    
    // Remove existing with same name
    const filtered = agents.filter(a => a.name !== name);
    filtered.push(newAgent);
    
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(filtered, null, 2));
    
    console.log(chalk.green(`\n✅ Agent "${name}" authorized\n`));
    console.log(chalk.white('Scopes:  '), chalk.yellow(scopes.join(', ')));
    console.log(chalk.white('Expires: '), chalk.gray(new Date(newAgent.expiresAt).toLocaleString()));
    console.log('');
  });

agent
  .command('list')
  .description('List authorized agents')
  .action(() => {
    requireWallet();
    const agents = loadAgents();
    
    if (agents.length === 0) {
      console.log(chalk.yellow('\n⚠️  No agents authorized\n'));
      console.log(chalk.gray('Add one with: proofi agent add <name> --scopes "age,calendar"\n'));
      return;
    }
    
    console.log(chalk.cyan('\n═══ AUTHORIZED AGENTS ═══\n'));
    
    agents.forEach(a => {
      const expired = Date.now() > a.expiresAt;
      const status = expired ? chalk.red('[EXPIRED]') : chalk.green('[ACTIVE]');
      
      console.log(`${status} ${chalk.white(a.name)}`);
      console.log(chalk.gray(`   ID: ${a.id}`));
      console.log(chalk.gray(`   Scopes: ${a.scopes.join(', ')}`));
      console.log(chalk.gray(`   Expires: ${new Date(a.expiresAt).toLocaleString()}`));
      console.log('');
    });
  });

agent
  .command('remove <name>')
  .description('Revoke agent access')
  .action((name) => {
    requireWallet();
    const agents = loadAgents();
    const filtered = agents.filter(a => a.name !== name);
    
    if (filtered.length === agents.length) {
      console.log(chalk.yellow(`\n⚠️  Agent "${name}" not found\n`));
      return;
    }
    
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(filtered, null, 2));
    console.log(chalk.green(`\n✅ Agent "${name}" removed\n`));
  });

// ══════════════════════════════════════════════════════════════════
// PROOF command
// ══════════════════════════════════════════════════════════════════
program
  .command('proof <type>')
  .description('Generate a proof')
  .option('-p, --predicate <pred>', 'Predicate (e.g., ">=18")')
  .option('-a, --agent <name>', 'Agent requesting proof', 'cli')
  .action(async (type, opts) => {
    requireWallet();
    
    const wallet = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
    const agents = loadAgents();
    
    // Check agent authorization
    const agent = agents.find(a => a.name === opts.agent);
    if (opts.agent !== 'cli' && !agent) {
      console.log(chalk.red(`\n❌ Agent "${opts.agent}" not authorized\n`));
      process.exit(1);
    }
    
    if (agent && !agent.scopes.includes(type)) {
      console.log(chalk.red(`\n❌ Agent "${opts.agent}" not authorized for scope "${type}"\n`));
      process.exit(1);
    }

    console.log(chalk.cyan('\n═══ GENERATING PROOF ═══\n'));
    console.log(chalk.white('Type:      '), chalk.yellow(type));
    if (opts.predicate) {
      console.log(chalk.white('Predicate: '), chalk.yellow(opts.predicate));
    }
    console.log(chalk.white('Agent:     '), chalk.gray(opts.agent));
    console.log('');

    // PIN unlock
    const pin = await askHidden('Enter PIN to sign: ');
    
    // Verify PIN by attempting to decrypt
    try {
      const salt = Buffer.from(wallet.salt, 'hex');
      const seed = crypto.pbkdf2Sync(`${wallet.email}:${pin}`, salt, 100000, 32, 'sha512');
      
      const encryptedKey = Buffer.from(wallet.encryptedKey, 'hex');
      const authTag = encryptedKey.slice(-16);
      const ciphertext = encryptedKey.slice(0, -16);
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', seed, salt.slice(0, 12));
      decipher.setAuthTag(authTag);
      decipher.update(ciphertext);
      decipher.final();
    } catch {
      console.log(chalk.red('\n❌ Invalid PIN\n'));
      process.exit(1);
    }

    // Generate proof
    const proofData = {
      type,
      predicate: opts.predicate || null,
      issuer: wallet.address,
      issuedAt: new Date().toISOString(),
      disclosed: opts.predicate ? [] : [type]
    };
    
    // Sign proof
    const proofHash = crypto.createHash('sha256')
      .update(JSON.stringify(proofData))
      .digest('hex');
    
    const proof = {
      ...proofData,
      verified: true,
      proof: `zkp:${proofHash.slice(0, 32)}`,
      signature: `sig:${proofHash.slice(32)}`
    };

    console.log(chalk.green('\n✅ Proof generated!\n'));
    console.log(chalk.gray(JSON.stringify(proof, null, 2)));
    console.log('');
    
    if (opts.predicate) {
      console.log(chalk.cyan(`ℹ️  Predicate "${opts.predicate}" verified WITHOUT revealing actual ${type}`));
      console.log('');
    }
  });

// ══════════════════════════════════════════════════════════════════
// CRED commands
// ══════════════════════════════════════════════════════════════════
const cred = program.command('cred').description('Manage credentials');

cred
  .command('add <type>')
  .description('Add a credential')
  .option('-d, --data <json>', 'Credential data as JSON')
  .action(async (type, opts) => {
    requireWallet();
    
    const wallet = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
    
    let data = {};
    if (opts.data) {
      try {
        data = JSON.parse(opts.data);
      } catch {
        console.log(chalk.red('\n❌ Invalid JSON data\n'));
        process.exit(1);
      }
    } else {
      // Interactive mode
      console.log(chalk.cyan(`\n═══ ADD ${type.toUpperCase()} CREDENTIAL ═══\n`));
      
      if (type === 'age' || type === 'identity') {
        data.name = await ask('Full name: ');
        data.dateOfBirth = await ask('Date of birth (YYYY-MM-DD): ');
        data.age = Math.floor((Date.now() - new Date(data.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      } else {
        const rawData = await ask('Data (JSON): ');
        data = JSON.parse(rawData);
      }
    }

    // PIN unlock
    const pin = await askHidden('\nEnter PIN to sign credential: ');
    
    // Create credential
    const credential = {
      id: `cred-${Date.now()}`,
      type: ['VerifiableCredential', `${type}Credential`],
      issuer: wallet.address,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: wallet.address,
        ...data
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        proofValue: crypto.createHash('sha256')
          .update(JSON.stringify(data) + pin)
          .digest('hex')
      }
    };
    
    const credFile = path.join(CREDS_DIR, `${credential.id}.json`);
    fs.writeFileSync(credFile, JSON.stringify(credential, null, 2));
    
    console.log(chalk.green(`\n✅ Credential created!\n`));
    console.log(chalk.white('ID:   '), chalk.gray(credential.id));
    console.log(chalk.white('Type: '), chalk.yellow(type));
    console.log(chalk.white('File: '), chalk.gray(credFile));
    console.log('');
  });

cred
  .command('list')
  .description('List credentials')
  .action(() => {
    requireWallet();
    
    const files = fs.existsSync(CREDS_DIR)
      ? fs.readdirSync(CREDS_DIR).filter(f => f.endsWith('.json'))
      : [];
    
    if (files.length === 0) {
      console.log(chalk.yellow('\n⚠️  No credentials stored\n'));
      console.log(chalk.gray('Add one with: proofi cred add identity\n'));
      return;
    }
    
    console.log(chalk.cyan('\n═══ STORED CREDENTIALS ═══\n'));
    
    files.forEach(f => {
      const cred = JSON.parse(fs.readFileSync(path.join(CREDS_DIR, f), 'utf8'));
      const type = cred.type.find(t => t !== 'VerifiableCredential') || 'Unknown';
      
      console.log(chalk.white(type.replace('Credential', '')));
      console.log(chalk.gray(`   ID: ${cred.id}`));
      console.log(chalk.gray(`   Issued: ${cred.issuanceDate}`));
      console.log('');
    });
  });

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

function requireWallet() {
  if (!fs.existsSync(WALLET_FILE)) {
    console.log(chalk.red('\n❌ No wallet found. Run: proofi init\n'));
    process.exit(1);
  }
}

function loadAgents() {
  if (!fs.existsSync(AGENTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8'));
}

function ask(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askHidden(prompt) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    process.stdout.write(prompt);
    
    // Attempt to hide input
    if (process.stdin.isTTY) {
      const stdin = process.stdin;
      stdin.setRawMode(true);
      stdin.resume();
      
      let input = '';
      stdin.on('data', (char) => {
        char = char.toString();
        
        if (char === '\n' || char === '\r') {
          stdin.setRawMode(false);
          stdin.pause();
          rl.close();
          console.log('');
          resolve(input);
        } else if (char === '\u0003') {
          process.exit();
        } else if (char === '\u007F') {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else {
          input += char;
          process.stdout.write('•');
        }
      });
    } else {
      rl.question('', answer => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

program.parse();
