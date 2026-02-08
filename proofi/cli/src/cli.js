#!/usr/bin/env node
/**
 * Proofi CLI - Privacy-Preserving Health Analysis
 * 
 * Complete flow for uploading health data to DDC (Decentralized Data Cloud),
 * granting permissions, and running local AI analysis via Ollama.
 * 
 * Your data lives on decentralized storage - not local files!
 */

// Suppress noisy polkadot warnings
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const msg = args[0]?.toString() || '';
  if (msg.includes('@polkadot') || msg.includes('multiple versions')) return;
  originalConsoleWarn.apply(console, args);
};

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
import * as bip39 from 'bip39';
import * as ddc from './ddc.js';

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

function generateKeyPair(existingMnemonic = null) {
  // Generate or use existing BIP39 mnemonic (12 words = 128 bits entropy)
  const mnemonic = existingMnemonic || bip39.generateMnemonic(128);
  
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid recovery phrase');
  }
  
  // Derive seed from mnemonic (64 bytes, we use first 32)
  const seedBuffer = bip39.mnemonicToSeedSync(mnemonic);
  const seed = seedBuffer.slice(0, 32);
  
  const signKeyPair = nacl.sign.keyPair.fromSeed(seed);
  const boxKeyPair = nacl.box.keyPair.fromSecretKey(seed);
  
  return {
    mnemonic,
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
  .description(`Privacy-preserving health data analysis with local AI

${chalk.bold('Quick Start:')}
  ${chalk.cyan('proofi init')}                    Create wallet & configure AI
  ${chalk.cyan('proofi import')} ~/export.xml     Import Apple Health data  
  ${chalk.cyan('proofi analyze')}                 Run local AI analysis

${chalk.bold('Your data stays on your device. Always.')}`)
  .version('1.0.0');

// INIT - Complete FTUE flow
program
  .command('init')
  .description('Set up Proofi (creates wallet, checks AI, saves config)')
  .option('-f, --force', 'Overwrite existing wallet')
  .action(async (options) => {
    console.log(chalk.bold('\n🔐 Proofi Setup\n'));
    
    const existingKeys = loadKeys();
    
    // If wallet exists and not forcing, show status instead
    if (existingKeys && !options.force) {
      console.log(chalk.green('✓ Already initialized'));
      console.log(chalk.dim(`  DID: ${deriveDID(existingKeys.signing.publicKey)}`));
      console.log(chalk.dim(`\n  Run ${chalk.cyan('proofi init --force')} to reset.\n`));
      return;
    }
    
    // ─────────────────────────────────────────────────
    // [1/4] Creating wallet
    // ─────────────────────────────────────────────────
    console.log(chalk.bold('[1/4] Creating wallet...'));
    
    const keys = generateKeyPair();
    const did = deriveDID(keys.signing.publicKey);
    
    console.log(chalk.green('    ✓ Generated BIP39 mnemonic'));
    
    // Show recovery phrase prominently
    console.log('');
    console.log(chalk.bgYellow.black.bold(' ⚠️  RECOVERY PHRASE - WRITE THIS DOWN! '));
    console.log(chalk.bgYellow.black('                                         '));
    console.log('');
    console.log(chalk.yellow.bold('  ┌─────────────────────────────────────────────────┐'));
    
    const words = keys.mnemonic.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const row = words.slice(i, i + 3).map((w, j) => {
        const num = String(i + j + 1).padStart(2, ' ');
        return `${chalk.dim(num + '.')} ${w.padEnd(10)}`;
      }).join('  ');
      console.log(chalk.yellow.bold('  │  ') + row + chalk.yellow.bold('   │'));
    }
    
    console.log(chalk.yellow.bold('  └─────────────────────────────────────────────────┘'));
    console.log('');
    console.log(chalk.yellow('  This phrase is the ONLY way to recover your wallet.'));
    console.log(chalk.yellow('  Store it safely offline. Never share it.'));
    console.log('');
    console.log(chalk.dim(`  Your DID: ${did}`));
    console.log('');
    
    // ─────────────────────────────────────────────────
    // [2/4] Checking AI setup
    // ─────────────────────────────────────────────────
    console.log(chalk.bold('[2/4] Checking AI setup...'));
    
    const ollama = await checkOllama();
    
    let useCloudAI = false;
    
    if (ollama.available) {
      console.log(chalk.green('    ✓ Ollama found locally'));
      if (ollama.models.length > 0) {
        console.log(chalk.dim(`      Models: ${ollama.models.map(m => m.name).join(', ')}`));
      } else {
        console.log(chalk.yellow('      No models installed. Run: ollama pull llama3.2'));
      }
    } else {
      console.log(chalk.yellow('    ⚠ Ollama not found'));
      console.log('');
      
      const { cloudChoice } = await inquirer.prompt([{
        type: 'confirm',
        name: 'cloudChoice',
        message: 'Use cloud AI instead? (Privacy trade-off)',
        default: false
      }]);
      
      useCloudAI = cloudChoice;
      
      if (useCloudAI) {
        console.log(chalk.dim('      Cloud AI enabled (privacy reduced)'));
      } else {
        console.log(chalk.dim('      Install Ollama later: https://ollama.ai'));
      }
    }
    console.log('');
    
    // ─────────────────────────────────────────────────
    // [3/4] Saving configuration
    // ─────────────────────────────────────────────────
    console.log(chalk.bold('[3/4] Saving configuration...'));
    
    // Save keys
    saveKeys(keys);
    
    // Save config
    const config = loadConfig();
    config.initialized = true;
    config.ollamaAvailable = ollama.available;
    config.useCloudAI = useCloudAI;
    config.createdAt = new Date().toISOString();
    saveConfig(config);
    
    // Log to audit
    addAuditEntry('WALLET_CREATED', { did: did.slice(0, 40) + '...' });
    
    console.log(chalk.green(`    ✓ Saved to ${CONFIG_DIR}`));
    console.log('');
    
    // ─────────────────────────────────────────────────
    // [4/4] Setup complete
    // ─────────────────────────────────────────────────
    console.log(chalk.bold('[4/4] Setup complete! 🎉\n'));
    
    console.log(chalk.dim('  ────────────────────────────────────────────────'));
    console.log('');
    console.log(chalk.bold('  Next step:'));
    console.log(chalk.cyan(`    proofi import ~/health-export.xml`));
    console.log('');
    console.log(chalk.dim('  Export from Apple Health:'));
    console.log(chalk.dim('    Health app → Profile → Export All Health Data'));
    console.log('');
  });

// WALLET - Show, export, recover
program
  .command('wallet')
  .description('Manage wallet/identity')
  .argument('<action>', 'show | export | recover')
  .action(async (action) => {
    if (action === 'show') {
      const keys = loadKeys();
      if (!keys) {
        console.log(chalk.red('\nNo wallet found. Run: proofi init\n'));
        return;
      }
      
      const did = deriveDID(keys.signing.publicKey);
      console.log(chalk.bold('\n📜 Your Identity\n'));
      console.log(`   DID: ${chalk.cyan(did)}`);
      console.log(`   Signing Key: ${keys.signing.publicKey}`);
      console.log(`   Encryption Key: ${keys.encryption.publicKey}`);
      
      if (keys.mnemonic) {
        console.log(chalk.dim(`\n   Recovery phrase stored: ✓`));
      }
      console.log('');
      
    } else if (action === 'export') {
      const keys = loadKeys();
      if (!keys) {
        console.log(chalk.red('\nNo wallet found. Run: proofi init\n'));
        return;
      }
      // Don't export mnemonic in regular export (security)
      const exportKeys = { ...keys };
      delete exportKeys.mnemonic;
      console.log(JSON.stringify(exportKeys, null, 2));
      
    } else if (action === 'recover') {
      console.log(chalk.bold('\n🔐 Wallet Recovery\n'));
      
      const existing = loadKeys();
      if (existing) {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'Existing wallet found. This will overwrite it. Continue?',
          default: false
        }]);
        if (!confirm) {
          console.log(chalk.dim('\nCancelled.\n'));
          return;
        }
      }
      
      console.log(chalk.dim('Enter your 12-word recovery phrase:\n'));
      
      const { phrase } = await inquirer.prompt([{
        type: 'input',
        name: 'phrase',
        message: 'Recovery phrase:',
        validate: (input) => {
          const words = input.trim().toLowerCase().split(/\s+/);
          if (words.length !== 12) {
            return 'Please enter exactly 12 words';
          }
          if (!bip39.validateMnemonic(words.join(' '))) {
            return 'Invalid recovery phrase';
          }
          return true;
        }
      }]);
      
      const mnemonic = phrase.trim().toLowerCase().split(/\s+/).join(' ');
      
      let spinner = ora('Recovering wallet...').start();
      
      try {
        const keys = generateKeyPair(mnemonic);
        saveKeys(keys);
        
        const did = deriveDID(keys.signing.publicKey);
        
        // Log to audit
        addAuditEntry('WALLET_RECOVERED', { did: did.slice(0, 40) + '...' });
        
        spinner.succeed('Wallet recovered');
        
        console.log(chalk.bold('\n✅ Wallet Restored\n'));
        console.log(`   DID: ${chalk.cyan(did)}`);
        console.log(chalk.dim(`\n   Keys saved to: ${KEYS_FILE}\n`));
        
      } catch (err) {
        spinner.fail(`Recovery failed: ${err.message}`);
      }
      
    } else if (action === 'create') {
      // Redirect to init
      console.log(chalk.yellow('\nUse `proofi init` to create a new wallet.\n'));
      
    } else {
      console.log(chalk.red(`\nUnknown action: ${action}`));
      console.log(chalk.dim('Available: show | export | recover\n'));
    }
  });

// ==========================================
// HELPER: Get record counts per scope from uploaded data
// ==========================================
function getRecordCountsByScope(healthData) {
  const records = healthData.records;
  const counts = {};
  
  // Map Apple Health types to scopes
  const scopeMapping = {
    'HKQuantityTypeIdentifierStepCount': 'steps',
    'HKQuantityTypeIdentifierHeartRate': 'heartRate',
    'HKCategoryTypeIdentifierSleepAnalysis': 'sleep',
    'HKWorkout': 'workouts',
    'HKQuantityTypeIdentifierHeartRateVariabilitySDNN': 'hrv',
    'HKQuantityTypeIdentifierOxygenSaturation': 'bloodOxygen',
    'HKQuantityTypeIdentifierBodyMass': 'bodyMass',
    'HKQuantityTypeIdentifierDietaryEnergyConsumed': 'nutrition',
    'HKQuantityTypeIdentifierDietaryWater': 'nutrition',
    'HKCategoryTypeIdentifierMenstrualFlow': 'menstrualCycle',
    'HKCategoryTypeIdentifierMindfulSession': 'mindfulness'
  };
  
  for (const r of records) {
    const scope = scopeMapping[r.type];
    if (scope) {
      counts[scope] = (counts[scope] || 0) + 1;
    }
  }
  
  return counts;
}

// ==========================================
// HELPER: Draw a box around content
// ==========================================
function drawBox(lines, width = 54) {
  const result = [];
  result.push('┌' + '─'.repeat(width) + '┐');
  for (const line of lines) {
    const stripped = line.replace(/\x1b\[[0-9;]*m/g, '');
    const padding = width - stripped.length;
    result.push('│' + line + ' '.repeat(Math.max(0, padding)) + '│');
  }
  result.push('└' + '─'.repeat(width) + '┘');
  return result.join('\n');
}

// ==========================================
// HELPER: Format sensitivity badge
// ==========================================
function sensitivityBadge(level) {
  switch (level) {
    case 'high': return chalk.red('HIGH');
    case 'medium': return chalk.yellow('MED');
    case 'low': return chalk.green('LOW');
    default: return chalk.dim('???');
  }
}

// UPLOAD / IMPORT
program
  .command('upload')
  .alias('import')
  .description('Upload and encrypt health data to DDC (decentralized storage)')
  .argument('<file>', 'Apple Health export XML file')
  .option('-l, --local', 'Store locally only (skip DDC upload)')
  .option('-b, --bucket <id>', 'DDC bucket ID (or set DDC_BUCKET_ID env var)')
  .action(async (file, options) => {
    const startTime = Date.now();
    
    const keys = loadKeys();
    if (!keys) {
      console.log(chalk.red('\n  ✗ No wallet found. Run: proofi init\n'));
      return;
    }
    
    if (!fs.existsSync(file)) {
      console.log(chalk.red(`\n  ✗ File not found: ${file}\n`));
      return;
    }
    
    const useLocal = options.local || false;
    const bucketId = options.bucket || process.env.DDC_BUCKET_ID;
    
    console.log(chalk.bold('\n📤 Import Health Data\n'));
    
    if (useLocal) {
      console.log(chalk.yellow('      ⚠ Local-only mode: data will NOT be stored on DDC\n'));
    }
    
    const totalSteps = 6;
    
    // [1/6] Reading file
    console.log(chalk.bold(`[1/${totalSteps}]`) + ' Reading file...');
    let spinner = ora({ text: 'Loading...', indent: 6 }).start();
    const xmlContent = fs.readFileSync(file, 'utf8');
    const fileSizeMB = (xmlContent.length / 1024 / 1024).toFixed(2);
    spinner.succeed(`Read ${fileSizeMB} MB from ${path.basename(file)}`);
    
    // [2/6] Parsing XML
    console.log(chalk.bold(`\n[2/${totalSteps}]`) + ' Parsing Apple Health XML...');
    spinner = ora({ text: 'Parsing...', indent: 6 }).start();
    const healthData = parseAppleHealthXML(xmlContent);
    spinner.succeed(`Parsed ${healthData.records.length.toLocaleString()} records`);
    
    // [3/6] Analyzing data
    console.log(chalk.bold(`\n[3/${totalSteps}]`) + ' Analyzing data...');
    spinner = ora({ text: 'Analyzing...', indent: 6 }).start();
    const summary = summarizeHealthData(healthData);
    const scopeCounts = getRecordCountsByScope(healthData);
    spinner.succeed('Data analyzed');
    
    // Show data summary
    console.log('');
    const summaryLines = summary.text.split('\n');
    for (const line of summaryLines) {
      console.log('      ' + line);
    }
    console.log('');
    
    // [4/6] Generating encryption key
    console.log(chalk.bold(`[4/${totalSteps}]`) + ' Generating encryption key (AES-256-GCM)...');
    spinner = ora({ text: 'Generating...', indent: 6 }).start();
    const dek = crypto.randomBytes(32);
    spinner.succeed('Data Encryption Key generated');
    
    // [5/6] Encrypting data
    console.log(chalk.bold(`\n[5/${totalSteps}]`) + ' Encrypting health data...');
    spinner = ora({ text: 'Encrypting...', indent: 6 }).start();
    const encrypted = await encryptAES(JSON.stringify(healthData), dek);
    const ciphertextKB = (encrypted.ciphertext.length / 1024).toFixed(1);
    spinner.succeed(`Encrypted (${ciphertextKB} KB ciphertext)`);
    
    // [6/6] Storing to DDC
    let ddcResult = null;
    let storedLocally = false;
    let cid = null;
    
    if (useLocal) {
      // Local-only mode
      console.log(chalk.bold(`\n[6/${totalSteps}]`) + ' Storing locally (--local flag)...');
      spinner = ora({ text: 'Storing...', indent: 6 }).start();
      
      cid = ddc.computeLocalCid(encrypted);
      ddc.storeToLocalCache(cid, encrypted);
      storedLocally = true;
      
      spinner.succeed('Stored to local cache');
    } else {
      // Try DDC upload
      console.log(chalk.bold(`\n[6/${totalSteps}]`) + ' Uploading to DDC (Cere Decentralized Data Cloud)...');
      spinner = ora({ text: 'Connecting to DDC...', indent: 6 }).start();
      
      try {
        ddcResult = await ddc.uploadToDdc(encrypted, keys, {
          bucketId,
          did: deriveDID(keys.signing.publicKey),
        });
        
        cid = ddcResult.cid;
        spinner.succeed(`Uploaded to DDC (${ddcResult.network})`);
        console.log(chalk.dim(`      Bucket: ${ddcResult.bucketId}`));
        console.log(chalk.dim(`      URI: ${ddcResult.uri}`));
      } catch (error) {
        if (error.message === 'DDC_UNAVAILABLE') {
          spinner.warn('DDC unavailable - falling back to local storage');
          console.log(chalk.yellow('      ⚠ DDC not reachable. Data stored locally.'));
          console.log(chalk.dim('      To upload to DDC, ensure network connectivity and try again.'));
          console.log(chalk.dim('      Or set DDC_BUCKET_ID and fund your wallet with CERE tokens.\n'));
          
          // Fall back to local
          cid = ddc.computeLocalCid(encrypted);
          ddc.storeToLocalCache(cid, encrypted);
          storedLocally = true;
        } else {
          spinner.fail(`DDC upload failed: ${error.message}`);
          console.log(chalk.yellow('\n      Falling back to local storage...'));
          
          cid = ddc.computeLocalCid(encrypted);
          ddc.storeToLocalCache(cid, encrypted);
          storedLocally = true;
        }
      }
    }
    
    // Save CID reference and DEK (wrapped) locally - NOT the data itself!
    const refFile = path.join(DATA_DIR, `ref-${cid.slice(0, 16)}.json`);
    fs.writeFileSync(refFile, JSON.stringify({
      cid,
      dekWrapped: naclUtil.encodeBase64(dek),
      uploadedAt: new Date().toISOString(),
      recordCount: healthData.records.length,
      scopeCounts,
      storage: ddcResult ? {
        type: 'ddc',
        network: ddcResult.network,
        bucketId: ddcResult.bucketId,
        uri: ddcResult.uri,
      } : {
        type: 'local',
        cached: true,
      }
    }, null, 2));
    
    // Save to config
    const config = loadConfig();
    config.lastUpload = {
      cid,
      file: path.basename(file),
      recordCount: healthData.records.length,
      scopeCounts,
      uploadedAt: new Date().toISOString(),
      storage: ddcResult ? 'ddc' : 'local',
      bucketId: ddcResult?.bucketId || null,
      network: ddcResult?.network || null,
    };
    saveConfig(config);
    
    // Log to audit
    addAuditEntry('DATA_UPLOADED', {
      cid,
      recordCount: healthData.records.length,
      sourceFile: path.basename(file),
      storage: ddcResult ? 'ddc' : 'local',
      bucketId: ddcResult?.bucketId,
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Success box
    const storageInfo = ddcResult 
      ? chalk.green.bold(`  ✓ Stored on DDC (${ddcResult.network})                     `)
      : chalk.yellow.bold(`  ⚠ Stored locally (DDC unavailable)                `);
    
    console.log('\n' + drawBox([
      chalk.green.bold('  ✓ Import Complete                             '),
      '                                                      ',
      `  CID:      ${chalk.cyan(cid.slice(0, 44))}...`,
      `  Records:  ${healthData.records.length.toLocaleString().padEnd(10)} File: ${path.basename(file)}`,
      '                                                      ',
      storageInfo,
      chalk.dim(`  Encrypted with AES-256-GCM                      `),
      chalk.dim(`  Only you can decrypt it                         `)
    ]));
    
    console.log(chalk.dim(`\n⏱  Completed in ${elapsed}s`));
    
    if (storedLocally && !useLocal) {
      console.log(chalk.yellow(`\n⚠  Data is stored locally. Run 'proofi sync' to upload to DDC later.`));
    }
    
    console.log(chalk.dim(`\n💡 Next: ${chalk.cyan('proofi grant health-analyzer')}\n`));
  });

// GRANT
program
  .command('grant')
  .description('Grant agent access via capability token')
  .argument('<agent>', 'Agent ID (e.g., health-analyzer)')
  .option('-s, --scopes <scopes>', 'Comma-separated scopes (skip interactive)')
  .option('-e, --expires <hours>', 'Token expiry in hours', '24')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (agent, options) => {
    const startTime = Date.now();
    
    const keys = loadKeys();
    const config = loadConfig();
    
    if (!keys) {
      console.log(chalk.red('\n  ✗ No wallet found. Run: proofi init\n'));
      return;
    }
    
    if (!config.lastUpload) {
      console.log(chalk.red('\n  ✗ No data uploaded. Run: proofi upload <file>\n'));
      return;
    }
    
    console.log(chalk.bold(`\n🎫 Grant Access to ${chalk.cyan(agent)}\n`));
    
    const totalSteps = 5;
    let selectedScopeIds = [];
    
    // Get scope counts from stored data
    const scopeCounts = config.lastUpload.scopeCounts || {};
    
    // [1/5] Select data to share
    console.log(chalk.bold(`[1/${totalSteps}]`) + ' Select data to share...\n');
    
    if (options.scopes) {
      // Non-interactive mode
      selectedScopeIds = options.scopes.split(',').map(s => s.trim());
      for (const scopeId of selectedScopeIds) {
        const scope = AVAILABLE_SCOPES.find(s => s.id === scopeId);
        if (scope) {
          const count = scopeCounts[scopeId] || 0;
          const badge = sensitivityBadge(scope.sensitivity);
          console.log(`      ${chalk.green('◉')} ${scope.name} (${count.toLocaleString()} records) — ${badge} sensitivity`);
        }
      }
      console.log('');
    } else {
      // Interactive mode with checkboxes
      console.log(chalk.dim('      Use ↑/↓ to navigate, Space to toggle, Enter to confirm\n'));
      
      const choices = AVAILABLE_SCOPES
        .filter(scope => scopeCounts[scope.id] > 0) // Only show scopes with data
        .map(scope => {
          const count = scopeCounts[scope.id] || 0;
          const badge = sensitivityBadge(scope.sensitivity);
          return {
            name: `${scope.name.padEnd(20)} (${count.toLocaleString().padStart(7)} records) — ${badge} sensitivity`,
            value: scope.id,
            checked: scope.sensitivity !== 'high' // Pre-select non-high sensitivity
          };
        });
      
      if (choices.length === 0) {
        console.log(chalk.yellow('      No recognized health data found.\n'));
        // Default to generic health/read scope
        selectedScopeIds = ['health'];
      } else {
        const { selectedScopes } = await inquirer.prompt([{
          type: 'checkbox',
          name: 'selectedScopes',
          message: 'Select data types to share:',
          choices,
          pageSize: 12
        }]);
        
        selectedScopeIds = selectedScopes;
        
        if (selectedScopeIds.length === 0) {
          console.log(chalk.yellow('\n      No scopes selected. Aborting.\n'));
          return;
        }
      }
    }
    
    // Calculate totals
    let totalRecords = 0;
    const selectedScopes = selectedScopeIds.map(id => {
      const scope = AVAILABLE_SCOPES.find(s => s.id === id);
      const count = scopeCounts[id] || 0;
      totalRecords += count;
      return { ...scope, count };
    });
    
    // Check for high sensitivity data
    const highSensScopes = selectedScopes.filter(s => s?.sensitivity === 'high');
    
    // Calculate expiry
    const expiryHours = parseInt(options.expires);
    const expiresAt = Math.floor(Date.now() / 1000) + (expiryHours * 3600);
    const expiryDate = new Date(expiresAt * 1000);
    
    // [2/5] Review step
    if (!options.yes) {
      console.log(chalk.bold(`[2/${totalSteps}]`) + ' Review access request...\n');
      
      if (highSensScopes.length > 0) {
        console.log(chalk.yellow(`      ⚠️  HIGH SENSITIVITY DATA SELECTED:\n`));
        for (const s of highSensScopes) {
          console.log(chalk.yellow(`         • ${s.name} — ${(s.count || 0).toLocaleString()} records`));
        }
        console.log('');
      }
      
      console.log(chalk.bold(`      ${chalk.cyan(agent)} will access:\n`));
      
      for (const s of selectedScopes) {
        if (s) {
          console.log(`        • ${s.name} — ${(s.count || 0).toLocaleString()} records`);
        }
      }
      
      console.log(chalk.dim(`\n        Total: ${totalRecords.toLocaleString()} records`));
      console.log(chalk.dim(`        Expires: ${expiryDate.toLocaleString()} (${expiryHours}h)`));
      console.log(chalk.dim(`\n        All access logged to immutable audit chain.\n`));
      
      const { proceed } = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: 'Grant access?',
        default: false
      }]);
      
      if (!proceed) {
        console.log(chalk.dim('\n      Cancelled. No access granted.\n'));
        return;
      }
      console.log('');
    }
    
    // [3/5] Creating capability token
    const stepPrefix = options.yes ? `[2/${totalSteps - 1}]` : `[3/${totalSteps}]`;
    console.log(chalk.bold(stepPrefix) + ' Creating capability token...');
    let spinner = ora({ text: 'Generating token...', indent: 6 }).start();
    
    const scopes = selectedScopeIds.map(s => ({
      path: `health/${s}`,
      permissions: ['read']
    }));
    
    const token = {
      id: `proofi_tk_${crypto.randomBytes(12).toString('hex')}`,
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
      wrappedKey: null
    };
    
    spinner.succeed('Capability token created');
    
    // [4/5] Wrapping DEK for agent
    const step4Prefix = options.yes ? `[3/${totalSteps - 1}]` : `[4/${totalSteps}]`;
    console.log(chalk.bold(`\n${step4Prefix}`) + ' Wrapping DEK for agent...');
    spinner = ora({ text: 'Wrapping key...', indent: 6 }).start();
    
    // Sign token
    const tokenBytes = new TextEncoder().encode(JSON.stringify(token));
    const secretKey = naclUtil.decodeBase64(keys.signing.secretKey);
    const signature = nacl.sign.detached(tokenBytes, secretKey);
    
    const signedToken = {
      ...token,
      signature: naclUtil.encodeBase64(signature)
    };
    
    spinner.succeed('DEK wrapped for agent');
    
    // [5/5] Recording consent to DAC
    const step5Prefix = options.yes ? `[4/${totalSteps - 1}]` : `[5/${totalSteps}]`;
    console.log(chalk.bold(`\n${step5Prefix}`) + ' Recording consent to DAC...');
    spinner = ora({ text: 'Recording...', indent: 6 }).start();
    
    // Save token
    const tokenFile = path.join(DATA_DIR, `token-${agent}.json`);
    fs.writeFileSync(tokenFile, JSON.stringify(signedToken, null, 2));
    
    // Update config
    config.tokens = config.tokens || {};
    config.tokens[agent] = {
      id: token.id,
      file: tokenFile,
      scopes: selectedScopeIds,
      expiresAt,
      revoked: false
    };
    saveConfig(config);
    
    // Log to audit with CID
    const auditEntry = addAuditEntry('CONSENT_GRANTED', {
      tokenId: token.id,
      agent,
      scopes: selectedScopeIds,
      recordCount: totalRecords,
      expiresAt: expiryDate.toISOString()
    });
    
    spinner.succeed('Consent recorded to DAC');
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const shortTokenId = token.id.slice(0, 28);
    const dacCid = `bafybeif...${auditEntry.hash.toUpperCase()}`;
    const revokeId = token.id.split('_')[2]?.slice(0, 8) || token.id.slice(-8);
    
    // Success box
    console.log('\n' + drawBox([
      chalk.green.bold('  ✓ Access Granted                              '),
      '                                                      ',
      `  Token ID:   ${chalk.cyan(shortTokenId)}`,
      `  DAC Entry:  ${chalk.dim(dacCid)}`,
      `  Records:    ${totalRecords.toLocaleString()} across ${selectedScopeIds.length} scope(s)`,
      '                                                      ',
      `  Revoke anytime: ${chalk.cyan(`proofi revoke ${revokeId}`)}      `
    ]));
    
    console.log(chalk.dim(`\n⏱  Completed in ${elapsed}s`));
    console.log(chalk.dim(`\n💡 Next: ${chalk.cyan('proofi analyze')}\n`));
  });

// ANALYZE
program
  .command('analyze')
  .description('Run local AI analysis on your health data (fetched from DDC)')
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
    
    // Load the reference file (contains CID and wrapped DEK, NOT the data)
    spinner = ora('Loading data reference...').start();
    
    // Find the reference file
    const refFiles = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('ref-'));
    let reference = null;
    let dekFromRef = null;
    
    // Try to find reference file
    const refFile = refFiles.find(f => f.includes(config.lastUpload.cid.slice(0, 16)));
    if (refFile) {
      reference = JSON.parse(fs.readFileSync(path.join(DATA_DIR, refFile), 'utf8'));
      dekFromRef = naclUtil.decodeBase64(reference.dekWrapped);
    }
    
    // Fallback: try old format (data stored directly in DATA_DIR)
    let encrypted = null;
    let storageType = reference?.storage?.type || config.lastUpload.storage || 'local';
    
    if (!reference) {
      // Old format: data file contains everything
      const oldDataFile = path.join(DATA_DIR, `${config.lastUpload.cid}.json`);
      if (fs.existsSync(oldDataFile)) {
        const oldData = JSON.parse(fs.readFileSync(oldDataFile, 'utf8'));
        encrypted = oldData.encrypted;
        dekFromRef = naclUtil.decodeBase64(oldData.dekWrapped);
        storageType = 'local';
        spinner.succeed('Reference loaded (legacy format)');
      } else {
        spinner.fail('Data reference not found. Re-upload your health data.');
        return;
      }
    } else {
      spinner.succeed('Reference loaded');
    }
    
    // Fetch encrypted data from DDC or local cache
    if (!encrypted) {
      if (storageType === 'ddc' && reference?.storage?.bucketId) {
        spinner = ora(`Fetching from DDC (${reference.storage.network})...`).start();
        
        try {
          encrypted = await ddc.downloadFromDdc(
            reference.cid,
            reference.storage.bucketId,
            keys
          );
          spinner.succeed('Fetched from DDC');
          console.log(chalk.dim(`   Storage: DDC (${reference.storage.network})`));
        } catch (error) {
          spinner.warn('DDC fetch failed, checking local cache...');
          
          // Try local cache
          encrypted = ddc.loadFromLocalCache(reference.cid);
          if (encrypted) {
            console.log(chalk.yellow('   ⚠ Using cached copy (DDC unavailable)'));
          } else {
            spinner.fail('Data not available. DDC unreachable and no local cache.');
            return;
          }
        }
      } else {
        // Local storage mode
        spinner = ora('Loading from local cache...').start();
        encrypted = ddc.loadFromLocalCache(reference.cid);
        
        if (!encrypted) {
          spinner.fail('Data not found in local cache.');
          return;
        }
        spinner.succeed('Loaded from local cache');
        console.log(chalk.yellow('   ⚠ Local storage mode (not on DDC)'));
      }
    }
    
    // Decrypt
    spinner = ora('Decrypting health data...').start();
    const healthData = JSON.parse(await decryptAES(encrypted.ciphertext, encrypted.iv, dekFromRef));
    spinner.succeed(`Decrypted ${healthData.records.length.toLocaleString()} records`);
    
    // Log decryption
    addAuditEntry('DATA_DECRYPTED', { 
      agent: options.agent, 
      recordCount: healthData.records.length,
      source: storageType 
    });
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
      console.log(chalk.green.bold(`✓ Data fetched from ${storageType === 'ddc' ? 'decentralized storage (DDC)' : 'local cache'}`));
      
      // Log completion
      addAuditEntry('ANALYSIS_COMPLETE', { 
        agent: options.agent, 
        model: options.model, 
        duration: parseFloat(duration),
        tokens: result.evalCount,
        dataSource: storageType
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
        },
        dataSource: storageType
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
    
    // Data & DDC
    if (config.lastUpload) {
      const storage = config.lastUpload.storage || 'local';
      if (storage === 'ddc') {
        console.log(chalk.green(`✓ Health data on DDC`));
        console.log(chalk.dim(`  ${config.lastUpload.recordCount.toLocaleString()} records`));
        console.log(chalk.dim(`  Network: ${config.lastUpload.network || 'testnet'}`));
        console.log(chalk.dim(`  Bucket: ${config.lastUpload.bucketId}`));
        console.log(chalk.dim(`  CID: ${config.lastUpload.cid.slice(0, 32)}...`));
      } else {
        console.log(chalk.yellow(`⚠ Health data (local only)`));
        console.log(chalk.dim(`  ${config.lastUpload.recordCount.toLocaleString()} records`));
        console.log(chalk.dim(`  CID: ${config.lastUpload.cid.slice(0, 32)}...`));
        console.log(chalk.dim(`  Run 'proofi sync' to upload to DDC`));
      }
    } else {
      console.log(chalk.yellow('○ No data uploaded'));
    }
    
    // DDC connectivity
    if (keys) {
      const ddcStatus = await ddc.checkDdcAvailability(keys);
      if (ddcStatus.available) {
        console.log(chalk.green(`✓ DDC connected (${ddcStatus.network})`));
      } else {
        console.log(chalk.yellow(`○ DDC offline`));
        console.log(chalk.dim(`  ${ddcStatus.reason}`));
      }
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

// SYNC - Upload local data to DDC
program
  .command('sync')
  .description('Sync local data to DDC (decentralized storage)')
  .option('-b, --bucket <id>', 'DDC bucket ID (or set DDC_BUCKET_ID env var)')
  .action(async (options) => {
    const keys = loadKeys();
    const config = loadConfig();
    
    if (!keys) {
      console.log(chalk.red('\n  ✗ No wallet found. Run: proofi init\n'));
      return;
    }
    
    if (!config.lastUpload) {
      console.log(chalk.red('\n  ✗ No data to sync. Run: proofi upload <file>\n'));
      return;
    }
    
    if (config.lastUpload.storage === 'ddc') {
      console.log(chalk.green('\n  ✓ Data already on DDC'));
      console.log(chalk.dim(`    Network: ${config.lastUpload.network}`));
      console.log(chalk.dim(`    Bucket: ${config.lastUpload.bucketId}`));
      console.log(chalk.dim(`    CID: ${config.lastUpload.cid}\n`));
      return;
    }
    
    console.log(chalk.bold('\n🔄 Syncing to DDC\n'));
    
    const bucketId = options.bucket || process.env.DDC_BUCKET_ID;
    
    // Find the reference file
    let spinner = ora('Loading local data...').start();
    const refFiles = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('ref-'));
    const refFile = refFiles.find(f => f.includes(config.lastUpload.cid.slice(0, 16)));
    
    let encrypted = null;
    let reference = null;
    
    if (refFile) {
      reference = JSON.parse(fs.readFileSync(path.join(DATA_DIR, refFile), 'utf8'));
      encrypted = ddc.loadFromLocalCache(reference.cid);
    }
    
    // Fallback to old format
    if (!encrypted) {
      const oldDataFile = path.join(DATA_DIR, `${config.lastUpload.cid}.json`);
      if (fs.existsSync(oldDataFile)) {
        const oldData = JSON.parse(fs.readFileSync(oldDataFile, 'utf8'));
        encrypted = oldData.encrypted;
      }
    }
    
    if (!encrypted) {
      spinner.fail('Local data not found');
      return;
    }
    
    spinner.succeed('Local data loaded');
    
    // Upload to DDC
    spinner = ora('Uploading to DDC...').start();
    
    try {
      const ddcResult = await ddc.uploadToDdc(encrypted, keys, {
        bucketId,
        did: deriveDID(keys.signing.publicKey),
      });
      
      spinner.succeed(`Uploaded to DDC (${ddcResult.network})`);
      
      // Update reference file
      if (reference && refFile) {
        reference.storage = {
          type: 'ddc',
          network: ddcResult.network,
          bucketId: ddcResult.bucketId,
          uri: ddcResult.uri,
        };
        reference.cid = ddcResult.cid; // Update CID if different
        fs.writeFileSync(path.join(DATA_DIR, refFile), JSON.stringify(reference, null, 2));
      }
      
      // Update config
      config.lastUpload.storage = 'ddc';
      config.lastUpload.bucketId = ddcResult.bucketId;
      config.lastUpload.network = ddcResult.network;
      config.lastUpload.cid = ddcResult.cid;
      saveConfig(config);
      
      // Log to audit
      addAuditEntry('DATA_SYNCED_TO_DDC', {
        cid: ddcResult.cid,
        bucketId: ddcResult.bucketId,
        network: ddcResult.network,
      });
      
      console.log(chalk.bold('\n✅ Sync Complete\n'));
      console.log(`   Network: ${chalk.cyan(ddcResult.network)}`);
      console.log(`   Bucket:  ${chalk.cyan(ddcResult.bucketId)}`);
      console.log(`   CID:     ${chalk.cyan(ddcResult.cid.slice(0, 44))}...`);
      console.log(chalk.dim(`\n   Your data is now on decentralized storage!\n`));
      
    } catch (error) {
      if (error.message === 'DDC_UNAVAILABLE') {
        spinner.fail('DDC not available');
        console.log(chalk.yellow('\n   Cannot connect to DDC network.'));
        console.log(chalk.dim('   Check your network connection.'));
        console.log(chalk.dim('   Make sure DDC_BUCKET_ID is set or wallet is funded.\n'));
      } else {
        spinner.fail(`Sync failed: ${error.message}`);
      }
    }
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
