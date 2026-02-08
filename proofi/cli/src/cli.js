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
const AUDIT_FILE = path.join(CONFIG_DIR, 'audit.json');
const SCOPES_FILE = path.join(CONFIG_DIR, 'scopes.json');
const LOGS_DIR = path.join(CONFIG_DIR, 'logs');
const INSIGHTS_FILE = path.join(CONFIG_DIR, 'insights.json');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
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
// AUDIT TRAIL MANAGEMENT
// ==========================================

function loadAudit() {
  if (fs.existsSync(AUDIT_FILE)) {
    return JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
  }
  return { entries: [], lastHash: null };
}

function saveAudit(audit) {
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(audit, null, 2));
}

function addAuditEntry(action, details) {
  const audit = loadAudit();
  const timestamp = new Date().toISOString();
  const entryData = { timestamp, action, details, prevHash: audit.lastHash };
  const hash = crypto.createHash('sha256').update(JSON.stringify(entryData)).digest('hex').slice(0, 16);
  
  const entry = {
    ...entryData,
    hash
  };
  
  audit.entries.push(entry);
  audit.lastHash = hash;
  saveAudit(audit);
  
  return entry;
}

function verifyAuditChain() {
  const audit = loadAudit();
  const results = { valid: true, errors: [], verified: 0 };
  
  let prevHash = null;
  for (let i = 0; i < audit.entries.length; i++) {
    const entry = audit.entries[i];
    
    // Check prev hash link
    if (entry.prevHash !== prevHash) {
      results.valid = false;
      results.errors.push({ index: i, error: 'Invalid previous hash link' });
    }
    
    // Verify hash
    const entryData = { timestamp: entry.timestamp, action: entry.action, details: entry.details, prevHash: entry.prevHash };
    const computedHash = crypto.createHash('sha256').update(JSON.stringify(entryData)).digest('hex').slice(0, 16);
    
    if (computedHash !== entry.hash) {
      results.valid = false;
      results.errors.push({ index: i, error: 'Hash mismatch - data tampered' });
    }
    
    prevHash = entry.hash;
    results.verified++;
  }
  
  return results;
}

// ==========================================
// SCOPES MANAGEMENT
// ==========================================

const AVAILABLE_SCOPES = [
  { id: 'steps', name: 'Step Count', sensitivity: 'low', description: 'Daily steps and walking data' },
  { id: 'heartRate', name: 'Heart Rate', sensitivity: 'medium', description: 'Heart rate readings' },
  { id: 'sleep', name: 'Sleep Analysis', sensitivity: 'medium', description: 'Sleep duration and quality' },
  { id: 'workouts', name: 'Workouts', sensitivity: 'low', description: 'Exercise sessions and calories' },
  { id: 'hrv', name: 'Heart Rate Variability', sensitivity: 'high', description: 'HRV measurements (stress indicator)' },
  { id: 'bloodOxygen', name: 'Blood Oxygen', sensitivity: 'high', description: 'SpO2 saturation levels' },
  { id: 'bodyMass', name: 'Body Mass', sensitivity: 'high', description: 'Weight and BMI data' },
  { id: 'nutrition', name: 'Nutrition', sensitivity: 'medium', description: 'Food and water intake' },
  { id: 'menstrualCycle', name: 'Menstrual Cycle', sensitivity: 'high', description: 'Cycle tracking data' },
  { id: 'mindfulness', name: 'Mindfulness', sensitivity: 'low', description: 'Meditation minutes' }
];

function loadScopes() {
  if (fs.existsSync(SCOPES_FILE)) {
    return JSON.parse(fs.readFileSync(SCOPES_FILE, 'utf8'));
  }
  // Default: enable low/medium sensitivity scopes
  const defaults = {};
  for (const scope of AVAILABLE_SCOPES) {
    defaults[scope.id] = scope.sensitivity !== 'high';
  }
  return { enabled: defaults, lastUpdated: null };
}

function saveScopes(scopes) {
  scopes.lastUpdated = new Date().toISOString();
  fs.writeFileSync(SCOPES_FILE, JSON.stringify(scopes, null, 2));
}

// ==========================================
// LOGS MANAGEMENT
// ==========================================

function getAgentLogFile(agent, sessionId) {
  return path.join(LOGS_DIR, `${agent}-${sessionId}.json`);
}

function loadAgentLogs(agent) {
  const files = fs.readdirSync(LOGS_DIR).filter(f => f.startsWith(`${agent}-`) && f.endsWith('.json'));
  const logs = [];
  
  for (const file of files) {
    try {
      const log = JSON.parse(fs.readFileSync(path.join(LOGS_DIR, file), 'utf8'));
      logs.push(log);
    } catch (e) {
      // Skip invalid logs
    }
  }
  
  return logs.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

function createAgentLog(agent) {
  const sessionId = crypto.randomUUID().slice(0, 8);
  const log = {
    agent,
    sessionId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    events: [],
    summary: null
  };
  
  fs.writeFileSync(getAgentLogFile(agent, sessionId), JSON.stringify(log, null, 2));
  return { sessionId, log };
}

function addLogEvent(agent, sessionId, event, dataAccessed = null) {
  const logFile = getAgentLogFile(agent, sessionId);
  if (!fs.existsSync(logFile)) return;
  
  const log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
  log.events.push({
    timestamp: new Date().toISOString(),
    event,
    dataAccessed
  });
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
}

function finishAgentLog(agent, sessionId, summary) {
  const logFile = getAgentLogFile(agent, sessionId);
  if (!fs.existsSync(logFile)) return;
  
  const log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
  log.endedAt = new Date().toISOString();
  log.summary = summary;
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
}

// ==========================================
// INSIGHTS MANAGEMENT
// ==========================================

function loadInsights() {
  if (fs.existsSync(INSIGHTS_FILE)) {
    return JSON.parse(fs.readFileSync(INSIGHTS_FILE, 'utf8'));
  }
  return { analyses: [] };
}

function saveInsights(insights) {
  fs.writeFileSync(INSIGHTS_FILE, JSON.stringify(insights, null, 2));
}

function addInsight(analysis) {
  const insights = loadInsights();
  insights.analyses.unshift({
    id: crypto.randomUUID().slice(0, 8),
    timestamp: new Date().toISOString(),
    ...analysis
  });
  // Keep last 10
  insights.analyses = insights.analyses.slice(0, 10);
  saveInsights(insights);
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
      
      // Log to audit
      addAuditEntry('WALLET_CREATED', { did: did.slice(0, 40) + '...' });
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

// UPLOAD / IMPORT
program
  .command('upload')
  .alias('import')
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
    
    // Log to audit
    addAuditEntry('DATA_UPLOADED', {
      cid,
      recordCount: healthData.records.length,
      sourceFile: path.basename(file)
    });
    
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
      expiresAt,
      revoked: false
    };
    saveConfig(config);
    
    // Log to audit
    addAuditEntry('CONSENT_GRANTED', {
      tokenId: token.id,
      agent,
      scopes: scopes.map(s => s.path),
      expiresAt: new Date(expiresAt * 1000).toISOString()
    });
    
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
    
    // Create agent log session
    const { sessionId } = createAgentLog(options.agent);
    addLogEvent(options.agent, sessionId, 'Session started', null);
    
    // Load token
    spinner = ora('Validating capability token...').start();
    const token = JSON.parse(fs.readFileSync(tokenInfo.file, 'utf8'));
    
    // Log token validation
    addAuditEntry('TOKEN_VALIDATED', { tokenId: token.id, agent: options.agent });
    
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
    
    // Log decryption
    addAuditEntry('DATA_DECRYPTED', { agent: options.agent, recordCount: healthData.records.length });
    addLogEvent(options.agent, sessionId, 'Data decrypted', { recordCount: healthData.records.length });
    
    // Summarize
    const summary = summarizeHealthData(healthData);
    console.log(chalk.dim('\n' + summary.text));
    
    // Log data access
    addAuditEntry('DATA_ACCESSED', { agent: options.agent, scopes: token.scopes.map(s => s.path) });
    addLogEvent(options.agent, sessionId, 'Health data accessed', { 
      dataTypes: Object.keys(summary.stats).filter(k => summary.stats[k]?.length > 0) 
    });
    
    // Run AI analysis
    console.log('');
    spinner = ora(`Running ${options.model} analysis (100% local)...`).start();
    
    try {
      const result = await runOllamaAnalysis(summary.text, options.model);
      const duration = (result.totalDuration / 1e9).toFixed(2);
      spinner.succeed(`Analysis complete (${duration}s)`);
      
      console.log(chalk.bold('\n📊 AI Health Insights\n'));
      console.log(result.text);
      
      console.log(chalk.dim(`\n────────────────────────────────────`));
      console.log(chalk.dim(`Model: ${result.model}`));
      console.log(chalk.dim(`Tokens: ${result.evalCount}`));
      console.log(chalk.green.bold('✓ Analysis performed 100% locally'));
      console.log(chalk.green.bold('✓ No health data sent to external servers'));
      
      // Log completion
      addAuditEntry('ANALYSIS_COMPLETE', { 
        agent: options.agent, 
        model: options.model, 
        duration: parseFloat(duration),
        tokens: result.evalCount 
      });
      addLogEvent(options.agent, sessionId, 'Analysis completed', { model: options.model, tokens: result.evalCount });
      
      // Save insights
      addInsight({
        agent: options.agent,
        model: options.model,
        summary: summary.text,
        analysis: result.text,
        duration: parseFloat(duration),
        tokens: result.evalCount,
        dataStats: {
          steps: summary.stats.steps?.length || 0,
          heartRate: summary.stats.hr?.length || 0,
          sleep: summary.stats.sleep?.length || 0,
          workouts: summary.stats.workouts?.length || 0
        }
      });
      
      // Finish agent log
      finishAgentLog(options.agent, sessionId, {
        eventsCount: 4,
        dataTypesAccessed: Object.keys(summary.stats).filter(k => summary.stats[k]?.length > 0).length,
        analysisTokens: result.evalCount,
        duration: parseFloat(duration)
      });
      
    } catch (err) {
      spinner.fail(`Analysis failed: ${err.message}`);
      addLogEvent(options.agent, sessionId, 'Analysis failed', { error: err.message });
      finishAgentLog(options.agent, sessionId, { error: err.message });
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

// ==========================================
// SCOPES - Interactive scope configuration
// ==========================================
program
  .command('scopes')
  .description('Configure data sharing scopes')
  .option('-l, --list', 'List scopes without interactive mode')
  .action(async (options) => {
    console.log(chalk.bold('\n🔒 Data Sharing Scopes\n'));
    
    const scopes = loadScopes();
    
    if (options.list) {
      // Non-interactive list mode
      console.log('');
      for (const scope of AVAILABLE_SCOPES) {
        const enabled = scopes.enabled[scope.id];
        const status = enabled ? chalk.green('  ✓') : chalk.red('  ✗');
        const sens = scope.sensitivity === 'high' 
          ? chalk.red('▲ HIGH')
          : scope.sensitivity === 'medium' 
            ? chalk.yellow('● MED ') 
            : chalk.green('○ LOW ');
        const name = scope.name.padEnd(24);
        console.log(`${status}  ${name} ${sens}  ${chalk.dim(scope.description)}`);
      }
      
      const enabledCount = Object.values(scopes.enabled).filter(Boolean).length;
      console.log(chalk.dim(`\n   ${enabledCount}/${AVAILABLE_SCOPES.length} scopes enabled`));
      if (scopes.lastUpdated) {
        console.log(chalk.dim(`   Last updated: ${new Date(scopes.lastUpdated).toLocaleString()}`));
      }
      console.log('');
      return;
    }
    
    // Interactive mode with checkboxes
    console.log(chalk.dim('Use ↑/↓ to navigate, Space to toggle, Enter to confirm\n'));
    
    const choices = AVAILABLE_SCOPES.map(scope => {
      const sens = scope.sensitivity === 'high' 
        ? chalk.red(`[HIGH]`)
        : scope.sensitivity === 'medium' 
          ? chalk.yellow(`[MED]`) 
          : chalk.green(`[LOW]`);
      return {
        name: `${scope.name.padEnd(22)} ${sens} ${chalk.dim(scope.description)}`,
        value: scope.id,
        checked: scopes.enabled[scope.id] || false
      };
    });
    
    const { selectedScopes } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'selectedScopes',
      message: 'Select data types to share:',
      choices,
      pageSize: 12
    }]);
    
    // Update scopes
    for (const scope of AVAILABLE_SCOPES) {
      scopes.enabled[scope.id] = selectedScopes.includes(scope.id);
    }
    saveScopes(scopes);
    
    // Show summary
    const highSensEnabled = AVAILABLE_SCOPES.filter(s => s.sensitivity === 'high' && scopes.enabled[s.id]);
    
    console.log(chalk.bold('\n✅ Scopes Updated\n'));
    console.log(`   Enabled: ${chalk.cyan(selectedScopes.length)} / ${AVAILABLE_SCOPES.length}`);
    
    if (highSensEnabled.length > 0) {
      console.log(chalk.yellow(`\n   ⚠️  High-sensitivity scopes enabled:`));
      for (const s of highSensEnabled) {
        console.log(chalk.yellow(`      • ${s.name}`));
      }
    }
    
    console.log(chalk.dim(`\n   Config saved to: ${SCOPES_FILE}`));
  });

// ==========================================
// AUDIT - View audit chain / DAC records
// ==========================================
program
  .command('audit')
  .description('View audit chain / DAC records')
  .option('-v, --verify', 'Verify chain integrity')
  .option('-l, --limit <n>', 'Limit number of entries', '20')
  .action(async (options) => {
    console.log(chalk.bold('\n📋 Audit Chain\n'));
    
    const audit = loadAudit();
    
    if (audit.entries.length === 0) {
      console.log(chalk.yellow('   No audit entries yet.'));
      console.log(chalk.dim('   Actions will be logged as you use Proofi.\n'));
      return;
    }
    
    if (options.verify) {
      const spinner = ora('Verifying chain integrity...').start();
      const result = verifyAuditChain();
      
      if (result.valid) {
        spinner.succeed(`Chain verified: ${result.verified} entries, all hashes valid`);
        console.log(chalk.green('\n   ✓ No tampering detected'));
        console.log(chalk.green('   ✓ All entries cryptographically linked'));
      } else {
        spinner.fail('Chain integrity compromised!');
        for (const err of result.errors) {
          console.log(chalk.red(`   Entry #${err.index}: ${err.error}`));
        }
      }
      console.log('');
      return;
    }
    
    // Display entries
    const limit = parseInt(options.limit);
    const entries = audit.entries.slice(-limit).reverse();
    
    // Action icons
    const actionIcons = {
      'WALLET_CREATED': '🔐',
      'DATA_UPLOADED': '📤',
      'CONSENT_GRANTED': '🎫',
      'TOKEN_VALIDATED': '✓ ',
      'DATA_DECRYPTED': '🔓',
      'DATA_ACCESSED': '👁 ',
      'ANALYSIS_COMPLETE': '🤖',
      'TOKEN_REVOKED': '🚫'
    };
    
    console.log(chalk.dim('┌──────────────────────────────────────────────────────────────────────────┐'));
    console.log(chalk.dim('│') + chalk.bold('  Time                Action              Details                  Hash') + chalk.dim('    │'));
    console.log(chalk.dim('├──────────────────────────────────────────────────────────────────────────┤'));
    
    for (const entry of entries) {
      const time = new Date(entry.timestamp).toLocaleString('en-US', {
        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }).padEnd(18);
      
      const icon = actionIcons[entry.action] || '• ';
      const action = (icon + entry.action).padEnd(20);
      
      let details = '';
      if (entry.details.agent) details = `agent: ${entry.details.agent}`;
      else if (entry.details.cid) details = `CID: ${entry.details.cid.slice(0, 12)}...`;
      else if (entry.details.tokenId) details = `token: ${entry.details.tokenId.slice(0, 8)}...`;
      else if (entry.details.did) details = `DID: ${entry.details.did.slice(0, 16)}...`;
      details = details.padEnd(24);
      
      const hash = chalk.dim(entry.hash);
      
      console.log(chalk.dim('│') + `  ${time}  ${action}  ${details}  ${hash}` + chalk.dim('  │'));
    }
    
    console.log(chalk.dim('└──────────────────────────────────────────────────────────────────────────┘'));
    
    console.log(chalk.dim(`\n   Showing ${entries.length} of ${audit.entries.length} total entries`));
    console.log(chalk.dim(`   Chain head: ${audit.lastHash}`));
    console.log(chalk.dim(`   Run 'proofi audit --verify' to check integrity\n`));
  });

// ==========================================
// LOGS - View agent activity logs
// ==========================================
program
  .command('logs')
  .description('View agent activity logs')
  .argument('[agent]', 'Agent name (e.g., health-analyzer)')
  .option('-s, --session <id>', 'Specific session ID')
  .action(async (agent, options) => {
    console.log(chalk.bold('\n📝 Agent Activity Logs\n'));
    
    if (!agent) {
      // List all agents with logs
      const files = fs.readdirSync(LOGS_DIR).filter(f => f.endsWith('.json'));
      const agents = [...new Set(files.map(f => f.split('-')[0]))];
      
      if (agents.length === 0) {
        console.log(chalk.yellow('   No agent logs found.'));
        console.log(chalk.dim('   Run an analysis to generate logs.\n'));
        return;
      }
      
      console.log('   Available agents:\n');
      for (const a of agents) {
        const logs = loadAgentLogs(a);
        console.log(`   ${chalk.cyan(a)} - ${logs.length} session(s)`);
        if (logs[0]) {
          console.log(chalk.dim(`     Last: ${new Date(logs[0].startedAt).toLocaleString()}`));
        }
      }
      
      console.log(chalk.dim('\n   Usage: proofi logs <agent-name>\n'));
      return;
    }
    
    const logs = loadAgentLogs(agent);
    
    if (logs.length === 0) {
      console.log(chalk.yellow(`   No logs found for agent: ${agent}`));
      return;
    }
    
    // Get specific session or latest
    const log = options.session 
      ? logs.find(l => l.sessionId === options.session)
      : logs[0];
    
    if (!log) {
      console.log(chalk.red(`   Session not found: ${options.session}`));
      return;
    }
    
    console.log(chalk.dim('┌────────────────────────────────────────────────────────────────┐'));
    console.log(chalk.dim('│') + chalk.bold(`  Agent: ${agent}`) + ' '.repeat(54 - agent.length) + chalk.dim('│'));
    console.log(chalk.dim('│') + `  Session: ${chalk.cyan(log.sessionId)}` + ' '.repeat(47) + chalk.dim('│'));
    console.log(chalk.dim('│') + `  Started: ${new Date(log.startedAt).toLocaleString()}` + ' '.repeat(34) + chalk.dim('│'));
    if (log.endedAt) {
      console.log(chalk.dim('│') + `  Ended:   ${new Date(log.endedAt).toLocaleString()}` + ' '.repeat(34) + chalk.dim('│'));
    }
    console.log(chalk.dim('├────────────────────────────────────────────────────────────────┤'));
    console.log(chalk.dim('│') + chalk.bold('  Timeline') + ' '.repeat(53) + chalk.dim('│'));
    console.log(chalk.dim('├────────────────────────────────────────────────────────────────┤'));
    
    for (let i = 0; i < log.events.length; i++) {
      const event = log.events[i];
      const time = new Date(event.timestamp).toLocaleTimeString();
      const isLast = i === log.events.length - 1;
      const connector = isLast ? '└' : '├';
      
      let dataInfo = '';
      if (event.dataAccessed) {
        if (event.dataAccessed.recordCount) {
          dataInfo = chalk.dim(` (${event.dataAccessed.recordCount} records)`);
        } else if (event.dataAccessed.dataTypes) {
          dataInfo = chalk.dim(` (${event.dataAccessed.dataTypes.join(', ')})`);
        } else if (event.dataAccessed.model) {
          dataInfo = chalk.dim(` (${event.dataAccessed.model})`);
        }
      }
      
      console.log(chalk.dim('│') + `  ${chalk.dim(time)}  ${connector}── ${event.event}${dataInfo}`.padEnd(63) + chalk.dim('│'));
    }
    
    console.log(chalk.dim('├────────────────────────────────────────────────────────────────┤'));
    
    if (log.summary) {
      console.log(chalk.dim('│') + chalk.bold('  Session Summary') + ' '.repeat(46) + chalk.dim('│'));
      console.log(chalk.dim('│') + `    Events: ${log.summary.eventsCount || log.events.length}`.padEnd(62) + chalk.dim('│'));
      if (log.summary.dataTypesAccessed) {
        console.log(chalk.dim('│') + `    Data types accessed: ${log.summary.dataTypesAccessed}`.padEnd(62) + chalk.dim('│'));
      }
      if (log.summary.analysisTokens) {
        console.log(chalk.dim('│') + `    Analysis tokens: ${log.summary.analysisTokens}`.padEnd(62) + chalk.dim('│'));
      }
      if (log.summary.duration) {
        console.log(chalk.dim('│') + `    Duration: ${log.summary.duration}s`.padEnd(62) + chalk.dim('│'));
      }
      if (log.summary.error) {
        console.log(chalk.dim('│') + chalk.red(`    Error: ${log.summary.error}`.padEnd(62)) + chalk.dim('│'));
      }
    }
    
    console.log(chalk.dim('└────────────────────────────────────────────────────────────────┘\n'));
    
    if (logs.length > 1) {
      console.log(chalk.dim(`   ${logs.length - 1} more session(s) available`));
      console.log(chalk.dim(`   Other sessions: ${logs.slice(1, 4).map(l => l.sessionId).join(', ')}${logs.length > 4 ? '...' : ''}\n`));
    }
  });

// ==========================================
// INSIGHTS - Show latest AI-generated insights
// ==========================================
program
  .command('insights')
  .description('Show latest AI-generated health insights')
  .option('-a, --all', 'Show all saved insights')
  .action(async (options) => {
    console.log(chalk.bold('\n💡 Health Insights\n'));
    
    const insights = loadInsights();
    
    if (insights.analyses.length === 0) {
      console.log(chalk.yellow('   No insights yet.'));
      console.log(chalk.dim('   Run an analysis first: proofi analyze\n'));
      return;
    }
    
    const toShow = options.all ? insights.analyses : [insights.analyses[0]];
    
    for (let i = 0; i < toShow.length; i++) {
      const insight = toShow[i];
      
      if (i > 0) console.log(chalk.dim('\n────────────────────────────────────────────────────\n'));
      
      // Header box
      console.log(chalk.dim('┌────────────────────────────────────────────────────────────────┐'));
      console.log(chalk.dim('│') + chalk.bold.cyan('  📊 Analysis Report') + ' '.repeat(43) + chalk.dim('│'));
      console.log(chalk.dim('├────────────────────────────────────────────────────────────────┤'));
      console.log(chalk.dim('│') + `  Generated: ${new Date(insight.timestamp).toLocaleString()}`.padEnd(63) + chalk.dim('│'));
      console.log(chalk.dim('│') + `  Model: ${insight.model} | Duration: ${insight.duration}s | Tokens: ${insight.tokens}`.padEnd(63) + chalk.dim('│'));
      console.log(chalk.dim('└────────────────────────────────────────────────────────────────┘'));
      
      // Data summary
      console.log(chalk.bold('\n  📈 Data Analyzed\n'));
      if (insight.summary) {
        const lines = insight.summary.split('\n');
        for (const line of lines) {
          console.log(`     ${line}`);
        }
      }
      
      // AI Analysis
      console.log(chalk.bold('\n  🤖 AI Recommendations\n'));
      if (insight.analysis) {
        const lines = insight.analysis.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            console.log(`     ${line}`);
          }
        }
      }
      
      // Stats footer
      if (insight.dataStats) {
        console.log(chalk.dim('\n  ──────────────────────────────────────────'));
        const stats = [];
        if (insight.dataStats.steps) stats.push(`${insight.dataStats.steps} steps`);
        if (insight.dataStats.heartRate) stats.push(`${insight.dataStats.heartRate} HR`);
        if (insight.dataStats.sleep) stats.push(`${insight.dataStats.sleep} sleep`);
        if (insight.dataStats.workouts) stats.push(`${insight.dataStats.workouts} workouts`);
        console.log(chalk.dim(`  Records analyzed: ${stats.join(' | ')}`));
      }
    }
    
    if (!options.all && insights.analyses.length > 1) {
      console.log(chalk.dim(`\n  ${insights.analyses.length - 1} more insight(s) available. Use --all to see history.\n`));
    } else {
      console.log('');
    }
  });

// ==========================================
// REVOKE - Revoke an active token
// ==========================================
program
  .command('revoke')
  .description('Revoke an active capability token')
  .argument('<token-id>', 'Token ID or agent name')
  .option('-f, --force', 'Skip confirmation')
  .action(async (tokenId, options) => {
    const config = loadConfig();
    
    if (!config.tokens || Object.keys(config.tokens).length === 0) {
      console.log(chalk.red('\n   No active tokens found.\n'));
      return;
    }
    
    // Find token by ID or agent name
    let agent = null;
    let tokenInfo = null;
    
    for (const [a, info] of Object.entries(config.tokens)) {
      if (a === tokenId || info.id === tokenId || info.id.startsWith(tokenId)) {
        agent = a;
        tokenInfo = info;
        break;
      }
    }
    
    if (!tokenInfo) {
      console.log(chalk.red(`\n   Token not found: ${tokenId}`));
      console.log(chalk.dim('   Available tokens:'));
      for (const [a, info] of Object.entries(config.tokens)) {
        console.log(chalk.dim(`     ${a}: ${info.id}`));
      }
      console.log('');
      return;
    }
    
    if (tokenInfo.revoked) {
      console.log(chalk.yellow(`\n   Token already revoked: ${agent}\n`));
      return;
    }
    
    console.log(chalk.bold('\n🚫 Revoke Token\n'));
    console.log(`   Agent: ${chalk.cyan(agent)}`);
    console.log(`   Token ID: ${chalk.dim(tokenInfo.id)}`);
    console.log(`   Expires: ${new Date(tokenInfo.expiresAt * 1000).toLocaleString()}`);
    
    if (!options.force) {
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Revoke this token? Agent will lose access immediately.',
        default: false
      }]);
      
      if (!confirm) {
        console.log(chalk.dim('\n   Cancelled.\n'));
        return;
      }
    }
    
    // Revoke
    const spinner = ora('Revoking token...').start();
    
    // Mark as revoked in config
    config.tokens[agent].revoked = true;
    config.tokens[agent].revokedAt = new Date().toISOString();
    saveConfig(config);
    
    // Update token file
    if (fs.existsSync(tokenInfo.file)) {
      const token = JSON.parse(fs.readFileSync(tokenInfo.file, 'utf8'));
      token.revoked = true;
      token.revokedAt = new Date().toISOString();
      fs.writeFileSync(tokenInfo.file, JSON.stringify(token, null, 2));
    }
    
    // Log to audit
    addAuditEntry('TOKEN_REVOKED', {
      tokenId: tokenInfo.id,
      agent,
      revokedAt: new Date().toISOString()
    });
    
    spinner.succeed('Token revoked');
    
    console.log(chalk.bold('\n✅ Token Revoked\n'));
    console.log(`   Agent ${chalk.cyan(agent)} can no longer access your data.`);
    console.log(chalk.dim('   This action has been logged to the audit chain.\n'));
  });

// ==========================================
// TOKENS - List all tokens
// ==========================================
program
  .command('tokens')
  .description('List all capability tokens')
  .action(async () => {
    const config = loadConfig();
    
    console.log(chalk.bold('\n🎫 Capability Tokens\n'));
    
    if (!config.tokens || Object.keys(config.tokens).length === 0) {
      console.log(chalk.yellow('   No tokens issued yet.'));
      console.log(chalk.dim('   Grant access with: proofi grant <agent-name>\n'));
      return;
    }
    
    console.log(chalk.dim('┌────────────────────────────────────────────────────────────────┐'));
    console.log(chalk.dim('│') + chalk.bold('  Agent               Status        Expires') + ' '.repeat(20) + chalk.dim('│'));
    console.log(chalk.dim('├────────────────────────────────────────────────────────────────┤'));
    
    for (const [agent, info] of Object.entries(config.tokens)) {
      const name = agent.padEnd(18);
      const expired = info.expiresAt < Date.now() / 1000;
      const revoked = info.revoked;
      
      let status;
      if (revoked) {
        status = chalk.red('revoked   ');
      } else if (expired) {
        status = chalk.yellow('expired   ');
      } else {
        status = chalk.green('active    ');
      }
      
      const expiry = new Date(info.expiresAt * 1000).toLocaleString();
      
      console.log(chalk.dim('│') + `  ${name}  ${status}    ${expiry}`.padEnd(63) + chalk.dim('│'));
      console.log(chalk.dim('│') + chalk.dim(`    ID: ${info.id}`).padEnd(63) + chalk.dim('│'));
    }
    
    console.log(chalk.dim('└────────────────────────────────────────────────────────────────┘\n'));
    
    console.log(chalk.dim('   Revoke a token: proofi revoke <token-id>\n'));
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
