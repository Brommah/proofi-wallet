#!/usr/bin/env node
/**
 * Proofi CLI - Privacy-Preserving Health Analysis
 * 
 * Complete flow for uploading health data, granting permissions,
 * and running local AI analysis via Ollama.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import { XMLParser } from 'fast-xml-parser';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = path.join(process.env.HOME, '.proofi');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const KEYS_FILE = path.join(CONFIG_DIR, 'keys.json');
const DATA_DIR = path.join(CONFIG_DIR, 'data');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ==========================================
// CRYPTO UTILITIES
// ==========================================

function generateKeyPair() {
  const seed = nacl.randomBytes(32);
  const signKeyPair = nacl.sign.keyPair.fromSeed(seed);
  const boxKeyPair = nacl.box.keyPair.fromSecretKey(seed);
  
  return {
    seed: naclUtil.encodeBase64(seed),
    signing: {
      publicKey: naclUtil.encodeBase64(signKeyPair.publicKey),
      secretKey: naclUtil.encodeBase64(signKeyPair.secretKey)
    },
    encryption: {
      publicKey: naclUtil.encodeBase64(boxKeyPair.publicKey),
      secretKey: naclUtil.encodeBase64(boxKeyPair.secretKey)
    }
  };
}

function deriveDID(publicKeyB64) {
  return `did:key:z${publicKeyB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}`;
}

async function encryptAES(plaintext, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return {
    ciphertext: Buffer.concat([encrypted, authTag]).toString('base64'),
    iv: iv.toString('base64')
  };
}

async function decryptAES(ciphertextB64, ivB64, key) {
  const ciphertext = Buffer.from(ciphertextB64, 'base64');
  const iv = Buffer.from(ivB64, 'base64');
  
  const authTag = ciphertext.slice(-16);
  const encrypted = ciphertext.slice(0, -16);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  return decipher.update(encrypted) + decipher.final('utf8');
}

function generateCID(data) {
  const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest();
  return 'bafy' + hash.toString('base64url').slice(0, 48);
}

// ==========================================
// CONFIG & KEYS MANAGEMENT
// ==========================================

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  return { initialized: false };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadKeys() {
  if (fs.existsSync(KEYS_FILE)) {
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
  }
  return null;
}

function saveKeys(keys) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), { mode: 0o600 });
}

// ==========================================
// OLLAMA INTEGRATION
// ==========================================

async function checkOllama() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      return { available: true, models: data.models || [] };
    }
  } catch (e) {
    // Not available
  }
  return { available: false, models: [] };
}

async function runOllamaAnalysis(healthSummary, model = 'llama3.2') {
  const prompt = `You are a health advisor. Analyze this health data and provide personalized recommendations.

${healthSummary}

Provide:
1. Key observations from the data (3-4 points)
2. 4-5 specific health recommendations  
3. What to focus on for improvement
4. Any concerning patterns to watch

Be encouraging and constructive. Use emojis for readability. Keep response concise.`;

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false
    })
  });
  
  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return {
    text: data.response,
    model,
    totalDuration: data.total_duration,
    evalCount: data.eval_count
  };
}

// ==========================================
// HEALTH DATA PROCESSING
// ==========================================

function parseAppleHealthXML(xmlContent) {
  // Use regex-based parsing for large files (more memory efficient)
  const records = [];
  
  // Extract Record elements
  const recordRegex = /<Record\s+([^>]+)\/>/g;
  let match;
  
  while ((match = recordRegex.exec(xmlContent)) !== null) {
    const attrs = match[1];
    const record = {};
    
    // Parse attributes
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      record[attrMatch[1]] = attrMatch[2];
    }
    
    if (record.type) {
      records.push({
        type: record.type,
        value: parseFloat(record.value) || record.value,
        unit: record.unit,
        startDate: record.startDate,
        endDate: record.endDate,
        sourceName: record.sourceName
      });
    }
  }
  
  // Extract Workout elements
  const workoutRegex = /<Workout\s+([^>]+)\/>/g;
  while ((match = workoutRegex.exec(xmlContent)) !== null) {
    const attrs = match[1];
    const workout = {};
    
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      workout[attrMatch[1]] = attrMatch[2];
    }
    
    if (workout.workoutActivityType) {
      records.push({
        type: 'HKWorkout',
        workoutType: workout.workoutActivityType,
        duration: parseFloat(workout.duration),
        calories: parseFloat(workout.totalEnergyBurned),
        startDate: workout.startDate,
        endDate: workout.endDate
      });
    }
  }
  
  // Extract export date
  const exportMatch = xmlContent.match(/ExportDate\s+value="([^"]+)"/);
  
  return {
    exportDate: exportMatch ? exportMatch[1] : null,
    records,
    me: null
  };
}

function summarizeHealthData(healthData) {
  const records = healthData.records;
  
  // Group by type
  const byType = {};
  for (const r of records) {
    if (!byType[r.type]) byType[r.type] = [];
    byType[r.type].push(r);
  }
  
  const summary = [];
  
  // Steps
  const steps = byType['HKQuantityTypeIdentifierStepCount'] || [];
  if (steps.length > 0) {
    const dailySteps = {};
    for (const s of steps) {
      const date = s.startDate.split(' ')[0];
      dailySteps[date] = (dailySteps[date] || 0) + s.value;
    }
    const days = Object.values(dailySteps);
    const avgSteps = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
    summary.push(`📊 Steps: ${steps.length} records, avg ${avgSteps.toLocaleString()}/day`);
  }
  
  // Heart Rate
  const hr = byType['HKQuantityTypeIdentifierHeartRate'] || [];
  if (hr.length > 0) {
    const values = hr.map(h => h.value);
    const avgHR = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const minHR = Math.min(...values);
    const maxHR = Math.max(...values);
    summary.push(`❤️  Heart Rate: ${hr.length} readings, avg ${avgHR} BPM (${minHR}-${maxHR})`);
  }
  
  // HRV
  const hrv = byType['HKQuantityTypeIdentifierHeartRateVariabilitySDNN'] || [];
  if (hrv.length > 0) {
    const avgHRV = Math.round(hrv.reduce((a, b) => a + b.value, 0) / hrv.length);
    summary.push(`📈 HRV: ${hrv.length} readings, avg ${avgHRV}ms`);
  }
  
  // Sleep
  const sleep = byType['HKCategoryTypeIdentifierSleepAnalysis'] || [];
  if (sleep.length > 0) {
    const inBed = sleep.filter(s => s.value === 'HKCategoryValueSleepAnalysisInBed');
    summary.push(`😴 Sleep: ${inBed.length} nights tracked`);
  }
  
  // SpO2
  const spo2 = byType['HKQuantityTypeIdentifierOxygenSaturation'] || [];
  if (spo2.length > 0) {
    const avgO2 = Math.round(spo2.reduce((a, b) => a + b.value, 0) / spo2.length);
    summary.push(`🫁 Blood Oxygen: ${spo2.length} readings, avg ${avgO2}%`);
  }
  
  // Workouts
  const workouts = byType['HKWorkout'] || [];
  if (workouts.length > 0) {
    const totalCal = Math.round(workouts.reduce((a, b) => a + (b.calories || 0), 0));
    summary.push(`🏋️  Workouts: ${workouts.length} sessions, ${totalCal.toLocaleString()} kcal total`);
  }
  
  return {
    text: summary.join('\n'),
    stats: { steps, hr, hrv, sleep, spo2, workouts },
    totalRecords: records.length
  };
}

// ==========================================
// CLI COMMANDS
// ==========================================

const program = new Command();

program
  .name('proofi')
  .description('Privacy-preserving health data analysis with local AI')
  .version('1.0.0');

// INIT
program
  .command('init')
  .description('Initialize Proofi and check dependencies')
  .action(async () => {
    console.log(chalk.bold('\n🔐 Proofi CLI Setup\n'));
    
    const spinner = ora('Checking Ollama...').start();
    const ollama = await checkOllama();
    
    if (ollama.available) {
      spinner.succeed(`Ollama available with ${ollama.models.length} models`);
      if (ollama.models.length > 0) {
        console.log(chalk.dim(`   Models: ${ollama.models.map(m => m.name).join(', ')}`));
      }
    } else {
      spinner.fail('Ollama not running');
      console.log(chalk.yellow('\n   Install Ollama: https://ollama.ai'));
      console.log(chalk.yellow('   Then run: ollama pull llama3.2\n'));
    }
    
    const config = loadConfig();
    const keys = loadKeys();
    
    if (keys) {
      console.log(chalk.green('✓ Wallet configured'));
      console.log(chalk.dim(`  DID: ${deriveDID(keys.signing.publicKey).slice(0, 40)}...`));
    } else {
      console.log(chalk.yellow('○ No wallet configured - run: proofi wallet create'));
    }
    
    config.initialized = true;
    config.ollamaAvailable = ollama.available;
    saveConfig(config);
    
    console.log(chalk.dim(`\nConfig: ${CONFIG_DIR}`));
  });

// WALLET CREATE
program
  .command('wallet')
  .description('Manage wallet/identity')
  .argument('<action>', 'create | show | export')
  .action(async (action) => {
    if (action === 'create') {
      const existing = loadKeys();
      if (existing) {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'Wallet already exists. Overwrite?',
          default: false
        }]);
        if (!confirm) return;
      }
      
      const spinner = ora('Generating Ed25519 + X25519 keypairs...').start();
      const keys = generateKeyPair();
      saveKeys(keys);
      spinner.succeed('Wallet created');
      
      const did = deriveDID(keys.signing.publicKey);
      console.log(chalk.bold('\n📜 Your Identity\n'));
      console.log(`   DID: ${chalk.cyan(did)}`);
      console.log(`   Signing Key: ${chalk.dim(keys.signing.publicKey.slice(0, 32))}...`);
      console.log(`   Encryption Key: ${chalk.dim(keys.encryption.publicKey.slice(0, 32))}...`);
      console.log(chalk.dim(`\n   Keys stored in: ${KEYS_FILE}`));
      
    } else if (action === 'show') {
      const keys = loadKeys();
      if (!keys) {
        console.log(chalk.red('No wallet found. Run: proofi wallet create'));
        return;
      }
      
      const did = deriveDID(keys.signing.publicKey);
      console.log(chalk.bold('\n📜 Your Identity\n'));
      console.log(`   DID: ${chalk.cyan(did)}`);
      console.log(`   Signing Key: ${keys.signing.publicKey}`);
      console.log(`   Encryption Key: ${keys.encryption.publicKey}`);
      
    } else if (action === 'export') {
      const keys = loadKeys();
      if (!keys) {
        console.log(chalk.red('No wallet found. Run: proofi wallet create'));
        return;
      }
      console.log(JSON.stringify(keys, null, 2));
    }
  });

// UPLOAD
program
  .command('upload')
  .description('Upload and encrypt health data')
  .argument('<file>', 'Apple Health export XML file')
  .action(async (file) => {
    const keys = loadKeys();
    if (!keys) {
      console.log(chalk.red('No wallet found. Run: proofi wallet create'));
      return;
    }
    
    if (!fs.existsSync(file)) {
      console.log(chalk.red(`File not found: ${file}`));
      return;
    }
    
    console.log(chalk.bold('\n📤 Uploading Health Data\n'));
    
    let spinner = ora('Reading file...').start();
    const xmlContent = fs.readFileSync(file, 'utf8');
    spinner.succeed(`Read ${(xmlContent.length / 1024 / 1024).toFixed(2)} MB`);
    
    spinner = ora('Parsing Apple Health XML...').start();
    const healthData = parseAppleHealthXML(xmlContent);
    spinner.succeed(`Parsed ${healthData.records.length.toLocaleString()} records`);
    
    // Summarize
    const summary = summarizeHealthData(healthData);
    console.log(chalk.dim('\n' + summary.text + '\n'));
    
    // Generate DEK (Data Encryption Key)
    spinner = ora('Generating encryption key (AES-256)...').start();
    const dek = crypto.randomBytes(32);
    spinner.succeed('DEK generated');
    
    // Encrypt
    spinner = ora('Encrypting health data...').start();
    const encrypted = await encryptAES(JSON.stringify(healthData), dek);
    spinner.succeed(`Encrypted (${(encrypted.ciphertext.length / 1024).toFixed(1)} KB ciphertext)`);
    
    // Generate CID
    const cid = generateCID(encrypted);
    
    // Store locally (would be DDC in production)
    const dataFile = path.join(DATA_DIR, `${cid}.json`);
    fs.writeFileSync(dataFile, JSON.stringify({
      cid,
      encrypted,
      dekWrapped: naclUtil.encodeBase64(dek), // In real impl, wrap with user's key
      uploadedAt: new Date().toISOString(),
      recordCount: healthData.records.length
    }, null, 2));
    
    console.log(chalk.bold('\n✅ Upload Complete\n'));
    console.log(`   CID: ${chalk.cyan(cid)}`);
    console.log(`   Records: ${healthData.records.length.toLocaleString()}`);
    console.log(`   Storage: ${chalk.dim(dataFile)}`);
    
    // Save to config
    const config = loadConfig();
    config.lastUpload = {
      cid,
      file: path.basename(file),
      recordCount: healthData.records.length,
      uploadedAt: new Date().toISOString()
    };
    saveConfig(config);
    
    console.log(chalk.dim('\nNext: proofi grant health-analyzer --scopes health/read'));
  });

// GRANT
program
  .command('grant')
  .description('Grant agent access via capability token')
  .argument('<agent>', 'Agent ID (e.g., health-analyzer)')
  .option('-s, --scopes <scopes>', 'Comma-separated scopes', 'health/read')
  .option('-e, --expires <hours>', 'Token expiry in hours', '24')
  .action(async (agent, options) => {
    const keys = loadKeys();
    const config = loadConfig();
    
    if (!keys) {
      console.log(chalk.red('No wallet found. Run: proofi wallet create'));
      return;
    }
    
    if (!config.lastUpload) {
      console.log(chalk.red('No data uploaded. Run: proofi upload <file>'));
      return;
    }
    
    console.log(chalk.bold('\n🎫 Creating Capability Token\n'));
    
    const scopes = options.scopes.split(',').map(s => ({
      path: s.trim(),
      permissions: ['read']
    }));
    
    const expiresAt = Math.floor(Date.now() / 1000) + (parseInt(options.expires) * 3600);
    
    // Create token
    const token = {
      id: crypto.randomUUID(),
      version: '1.0',
      issuer: deriveDID(keys.signing.publicKey),
      subject: `did:proofi:agent:${agent}`,
      issuedAt: Math.floor(Date.now() / 1000),
      expiresAt,
      scopes,
      resources: [{
        cid: config.lastUpload.cid,
        type: 'health-data'
      }],
      // Wrapped DEK would go here
      wrappedKey: null // In real impl, wrap DEK for agent's public key
    };
    
    // Sign token
    const tokenBytes = new TextEncoder().encode(JSON.stringify(token));
    const secretKey = naclUtil.decodeBase64(keys.signing.secretKey);
    const signature = nacl.sign.detached(tokenBytes, secretKey);
    
    const signedToken = {
      ...token,
      signature: naclUtil.encodeBase64(signature)
    };
    
    // Save token
    const tokenFile = path.join(DATA_DIR, `token-${agent}.json`);
    fs.writeFileSync(tokenFile, JSON.stringify(signedToken, null, 2));
    
    console.log(`   Agent: ${chalk.cyan(agent)}`);
    console.log(`   Scopes: ${scopes.map(s => s.path).join(', ')}`);
    console.log(`   Expires: ${new Date(expiresAt * 1000).toLocaleString()}`);
    console.log(`   Token ID: ${chalk.dim(token.id)}`);
    
    // Update config
    config.tokens = config.tokens || {};
    config.tokens[agent] = {
      id: token.id,
      file: tokenFile,
      expiresAt
    };
    saveConfig(config);
    
    console.log(chalk.dim(`\nToken saved: ${tokenFile}`));
    console.log(chalk.dim('Next: proofi analyze'));
  });

// ANALYZE
program
  .command('analyze')
  .description('Run local AI analysis on your health data')
  .option('-m, --model <model>', 'Ollama model to use', 'llama3.2')
  .option('-a, --agent <agent>', 'Agent to use', 'health-analyzer')
  .action(async (options) => {
    const keys = loadKeys();
    const config = loadConfig();
    
    if (!keys) {
      console.log(chalk.red('No wallet found. Run: proofi wallet create'));
      return;
    }
    
    if (!config.lastUpload) {
      console.log(chalk.red('No data uploaded. Run: proofi upload <file>'));
      return;
    }
    
    const tokenInfo = config.tokens?.[options.agent];
    if (!tokenInfo) {
      console.log(chalk.red(`No token for ${options.agent}. Run: proofi grant ${options.agent}`));
      return;
    }
    
    console.log(chalk.bold('\n🤖 Running Health Analysis\n'));
    
    // Check Ollama
    let spinner = ora('Checking Ollama...').start();
    const ollama = await checkOllama();
    if (!ollama.available) {
      spinner.fail('Ollama not running. Start with: ollama serve');
      return;
    }
    spinner.succeed('Ollama connected');
    
    // Load token
    spinner = ora('Validating capability token...').start();
    const token = JSON.parse(fs.readFileSync(tokenInfo.file, 'utf8'));
    
    // Verify token
    const tokenData = { ...token };
    delete tokenData.signature;
    const tokenBytes = new TextEncoder().encode(JSON.stringify(tokenData));
    const signature = naclUtil.decodeBase64(token.signature);
    const publicKey = naclUtil.decodeBase64(keys.signing.publicKey);
    
    const valid = nacl.sign.detached.verify(tokenBytes, signature, publicKey);
    if (!valid) {
      spinner.fail('Invalid token signature');
      return;
    }
    
    if (token.expiresAt < Date.now() / 1000) {
      spinner.fail('Token expired');
      return;
    }
    
    spinner.succeed('Token validated');
    console.log(chalk.dim(`   Scopes: ${token.scopes.map(s => s.path).join(', ')}`));
    
    // Load encrypted data
    spinner = ora('Loading encrypted data...').start();
    const dataFile = path.join(DATA_DIR, `${config.lastUpload.cid}.json`);
    const stored = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    spinner.succeed('Data loaded');
    
    // Decrypt
    spinner = ora('Decrypting health data...').start();
    const dek = naclUtil.decodeBase64(stored.dekWrapped);
    const healthData = JSON.parse(await decryptAES(stored.encrypted.ciphertext, stored.encrypted.iv, dek));
    spinner.succeed(`Decrypted ${healthData.records.length.toLocaleString()} records`);
    
    // Summarize
    const summary = summarizeHealthData(healthData);
    console.log(chalk.dim('\n' + summary.text));
    
    // Run AI analysis
    console.log('');
    spinner = ora(`Running ${options.model} analysis (100% local)...`).start();
    
    try {
      const result = await runOllamaAnalysis(summary.text, options.model);
      spinner.succeed(`Analysis complete (${(result.totalDuration / 1e9).toFixed(2)}s)`);
      
      console.log(chalk.bold('\n📊 AI Health Insights\n'));
      console.log(result.text);
      
      console.log(chalk.dim(`\n────────────────────────────────────`));
      console.log(chalk.dim(`Model: ${result.model}`));
      console.log(chalk.dim(`Tokens: ${result.evalCount}`));
      console.log(chalk.green.bold('✓ Analysis performed 100% locally'));
      console.log(chalk.green.bold('✓ No health data sent to external servers'));
      
    } catch (err) {
      spinner.fail(`Analysis failed: ${err.message}`);
      console.log(chalk.yellow(`\nMake sure model is installed: ollama pull ${options.model}`));
    }
  });

// STATUS
program
  .command('status')
  .description('Show current Proofi status')
  .action(async () => {
    const config = loadConfig();
    const keys = loadKeys();
    const ollama = await checkOllama();
    
    console.log(chalk.bold('\n🔐 Proofi Status\n'));
    
    // Wallet
    if (keys) {
      console.log(chalk.green('✓ Wallet'));
      console.log(chalk.dim(`  ${deriveDID(keys.signing.publicKey).slice(0, 50)}...`));
    } else {
      console.log(chalk.red('✗ No wallet'));
    }
    
    // Ollama
    if (ollama.available) {
      console.log(chalk.green(`✓ Ollama (${ollama.models.length} models)`));
    } else {
      console.log(chalk.red('✗ Ollama not running'));
    }
    
    // Data
    if (config.lastUpload) {
      console.log(chalk.green(`✓ Health data uploaded`));
      console.log(chalk.dim(`  ${config.lastUpload.recordCount.toLocaleString()} records`));
      console.log(chalk.dim(`  CID: ${config.lastUpload.cid}`));
    } else {
      console.log(chalk.yellow('○ No data uploaded'));
    }
    
    // Tokens
    if (config.tokens && Object.keys(config.tokens).length > 0) {
      console.log(chalk.green(`✓ ${Object.keys(config.tokens).length} active token(s)`));
      for (const [agent, info] of Object.entries(config.tokens)) {
        const expired = info.expiresAt < Date.now() / 1000;
        console.log(chalk.dim(`  ${agent}: ${expired ? chalk.red('expired') : chalk.green('valid')}`));
      }
    } else {
      console.log(chalk.yellow('○ No tokens granted'));
    }
    
    console.log('');
  });

// DEMO - Quick flow
program
  .command('demo')
  .description('Run full demo flow with sample data')
  .action(async () => {
    console.log(chalk.bold.cyan('\n🎬 Proofi Demo Flow\n'));
    console.log(chalk.dim('This demonstrates the complete privacy-preserving health analysis.\n'));
    
    // 1. Init
    console.log(chalk.bold('Step 1: Initialize'));
    await program.parseAsync(['', '', 'init']);
    
    // 2. Wallet
    console.log(chalk.bold('\nStep 2: Create Wallet'));
    const keys = loadKeys();
    if (!keys) {
      await program.parseAsync(['', '', 'wallet', 'create']);
    } else {
      console.log(chalk.green('✓ Wallet already exists'));
    }
    
    // 3. Check for sample data
    const sampleFile = path.join(__dirname, '../../demo-health/apple-health-export.xml');
    if (!fs.existsSync(sampleFile)) {
      console.log(chalk.yellow(`\nSample data not found at: ${sampleFile}`));
      console.log(chalk.dim('Generate with: node demo-health/generate-health-export.js'));
      return;
    }
    
    // 4. Upload
    console.log(chalk.bold('\nStep 3: Upload Health Data'));
    await program.parseAsync(['', '', 'upload', sampleFile]);
    
    // 5. Grant
    console.log(chalk.bold('\nStep 4: Grant Agent Access'));
    await program.parseAsync(['', '', 'grant', 'health-analyzer', '--scopes', 'health/read']);
    
    // 6. Analyze
    console.log(chalk.bold('\nStep 5: Run Analysis'));
    await program.parseAsync(['', '', 'analyze']);
    
    console.log(chalk.bold.green('\n✅ Demo Complete!\n'));
  });

program.parse();
