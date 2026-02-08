#!/usr/bin/env tsx
/**
 * Proofi Health Data Import Script
 * =================================
 * Parses Apple Health XML exports and organizes data by scope.
 * 
 * Features:
 * - Parse Apple Health export.xml
 * - Group data by scope (sleep, steps, heartRate, etc.)
 * - Interactive scope selection
 * - Encrypt and store locally
 * 
 * Usage:
 *   tsx import-health-data.ts --file ~/export.xml
 *   tsx import-health-data.ts --file ~/export.xml --scopes steps,heartRate
 *   tsx import-health-data.ts --file ~/export.xml --all
 */

import { XMLParser } from 'fast-xml-parser';
import { createReadStream, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createHash, randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';
import { join, dirname } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import ora from 'ora';
import { program } from 'commander';
import inquirer from 'inquirer';

// ============================================================================
// Types
// ============================================================================

interface HealthRecord {
  type: string;
  sourceName: string;
  sourceVersion?: string;
  unit?: string;
  creationDate: string;
  startDate: string;
  endDate: string;
  value?: string | number;
  device?: string;
}

interface WorkoutRecord {
  workoutActivityType: string;
  duration: number;
  durationUnit: string;
  totalDistance?: number;
  distanceUnit?: string;
  totalEnergyBurned?: number;
  energyUnit?: string;
  sourceName: string;
  creationDate: string;
  startDate: string;
  endDate: string;
}

interface ScopeConfig {
  id: string;
  name: string;
  description: string;
  healthKitTypes: string[];
  sensitivity: 'low' | 'medium' | 'high';
  icon: string;
}

interface ScopeData {
  scope: string;
  records: HealthRecord[];
  summary: {
    totalRecords: number;
    dateRange: { start: string; end: string };
    sources: string[];
  };
}

interface ParsedHealthData {
  exportDate: string;
  scopes: Map<string, ScopeData>;
  workouts: WorkoutRecord[];
  metadata: {
    totalRecords: number;
    deviceInfo: string[];
    dateRange: { start: string; end: string };
  };
}

// ============================================================================
// Configuration
// ============================================================================

const DATA_DIR = join(homedir(), '.proofi');
const HEALTH_DATA_DIR = join(DATA_DIR, 'health');
const ENCRYPTED_DIR = join(DATA_DIR, 'encrypted');
const CONFIG_DIR = join(DATA_DIR, 'config');

// HealthKit type to scope mapping
const TYPE_TO_SCOPE: Record<string, string> = {
  // Sleep
  'HKCategoryTypeIdentifierSleepAnalysis': 'sleep',
  
  // Steps and distance
  'HKQuantityTypeIdentifierStepCount': 'steps',
  'HKQuantityTypeIdentifierDistanceWalkingRunning': 'steps',
  
  // Heart rate
  'HKQuantityTypeIdentifierHeartRate': 'heartRate',
  'HKQuantityTypeIdentifierRestingHeartRate': 'restingHeartRate',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN': 'heartRateVariability',
  
  // Activity
  'HKQuantityTypeIdentifierActiveEnergyBurned': 'activeEnergy',
  'HKQuantityTypeIdentifierBasalEnergyBurned': 'activeEnergy',
  'HKCategoryTypeIdentifierAppleStandHour': 'standHours',
  
  // Respiratory
  'HKQuantityTypeIdentifierOxygenSaturation': 'oxygenSaturation',
  'HKQuantityTypeIdentifierRespiratoryRate': 'respiratoryRate',
  
  // Body measurements
  'HKQuantityTypeIdentifierBodyMass': 'bodyMass',
  'HKQuantityTypeIdentifierHeight': 'height',
  'HKQuantityTypeIdentifierBodyMassIndex': 'bodyMass',
  
  // Mindfulness
  'HKCategoryTypeIdentifierMindfulSession': 'mindfulMinutes',
};

// ============================================================================
// Utility Functions
// ============================================================================

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function loadScopesConfig(): Record<string, ScopeConfig> {
  const configPath = join(CONFIG_DIR, 'scopes.json');
  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    return config.scopes;
  }
  return {};
}

// ============================================================================
// Encryption Functions
// ============================================================================

function generateKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, 32);
}

function encryptData(data: string, password: string): { encrypted: string; salt: string; iv: string; tag: string } {
  const salt = randomBytes(32);
  const iv = randomBytes(16);
  const key = generateKey(password, salt);
  
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

function decryptData(encryptedData: { encrypted: string; salt: string; iv: string; tag: string }, password: string): string {
  const salt = Buffer.from(encryptedData.salt, 'hex');
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const tag = Buffer.from(encryptedData.tag, 'hex');
  const key = generateKey(password, salt);
  
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// ============================================================================
// XML Parsing
// ============================================================================

async function parseHealthExport(filePath: string): Promise<ParsedHealthData> {
  const spinner = ora('Reading Apple Health export...').start();
  
  if (!existsSync(filePath)) {
    spinner.fail(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  const fileContent = readFileSync(filePath, 'utf-8');
  spinner.text = 'Parsing XML (this may take a while for large exports)...';
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseAttributeValue: true,
    allowBooleanAttributes: true,
  });
  
  const parsed = parser.parse(fileContent);
  spinner.text = 'Processing health records...';
  
  const healthData = parsed.HealthData;
  if (!healthData) {
    spinner.fail('Invalid Apple Health export format');
    process.exit(1);
  }
  
  // Process records
  const records: HealthRecord[] = [];
  const rawRecords = healthData.Record || [];
  const recordArray = Array.isArray(rawRecords) ? rawRecords : [rawRecords];
  
  for (const record of recordArray) {
    if (record && record.type) {
      records.push({
        type: record.type,
        sourceName: record.sourceName || 'Unknown',
        sourceVersion: record.sourceVersion,
        unit: record.unit,
        creationDate: record.creationDate,
        startDate: record.startDate,
        endDate: record.endDate,
        value: record.value,
        device: record.device,
      });
    }
  }
  
  // Process workouts
  const workouts: WorkoutRecord[] = [];
  const rawWorkouts = healthData.Workout || [];
  const workoutArray = Array.isArray(rawWorkouts) ? rawWorkouts : [rawWorkouts];
  
  for (const workout of workoutArray) {
    if (workout && workout.workoutActivityType) {
      workouts.push({
        workoutActivityType: workout.workoutActivityType,
        duration: parseFloat(workout.duration) || 0,
        durationUnit: workout.durationUnit || 'min',
        totalDistance: parseFloat(workout.totalDistance) || undefined,
        distanceUnit: workout.totalDistanceUnit,
        totalEnergyBurned: parseFloat(workout.totalEnergyBurned) || undefined,
        energyUnit: workout.totalEnergyBurnedUnit,
        sourceName: workout.sourceName || 'Unknown',
        creationDate: workout.creationDate,
        startDate: workout.startDate,
        endDate: workout.endDate,
      });
    }
  }
  
  spinner.text = 'Grouping data by scope...';
  
  // Group records by scope
  const scopeMap = new Map<string, ScopeData>();
  const deviceSet = new Set<string>();
  let minDate = '';
  let maxDate = '';
  
  for (const record of records) {
    const scope = TYPE_TO_SCOPE[record.type];
    if (!scope) continue;
    
    if (!scopeMap.has(scope)) {
      scopeMap.set(scope, {
        scope,
        records: [],
        summary: {
          totalRecords: 0,
          dateRange: { start: '', end: '' },
          sources: [],
        },
      });
    }
    
    const scopeData = scopeMap.get(scope)!;
    scopeData.records.push(record);
    
    // Track sources
    if (!scopeData.summary.sources.includes(record.sourceName)) {
      scopeData.summary.sources.push(record.sourceName);
    }
    
    // Track devices
    if (record.device) {
      deviceSet.add(record.device);
    }
    
    // Track date range
    if (!minDate || record.startDate < minDate) minDate = record.startDate;
    if (!maxDate || record.endDate > maxDate) maxDate = record.endDate;
  }
  
  // Update summaries
  for (const [, scopeData] of scopeMap) {
    scopeData.summary.totalRecords = scopeData.records.length;
    const dates = scopeData.records.map(r => r.startDate).sort();
    if (dates.length > 0) {
      scopeData.summary.dateRange = {
        start: dates[0],
        end: dates[dates.length - 1],
      };
    }
  }
  
  spinner.succeed(`Parsed ${formatNumber(records.length)} health records and ${formatNumber(workouts.length)} workouts`);
  
  return {
    exportDate: healthData.ExportDate?.value || new Date().toISOString(),
    scopes: scopeMap,
    workouts,
    metadata: {
      totalRecords: records.length,
      deviceInfo: Array.from(deviceSet),
      dateRange: { start: minDate, end: maxDate },
    },
  };
}

// ============================================================================
// Display Functions
// ============================================================================

function displayScopeSummary(data: ParsedHealthData): void {
  const scopesConfig = loadScopesConfig();
  
  console.log('\n' + chalk.blue('━'.repeat(60)));
  console.log(chalk.bold.white('📊 Health Data Summary'));
  console.log(chalk.blue('━'.repeat(60)) + '\n');
  
  console.log(chalk.gray(`Export Date: ${formatDate(data.exportDate)}`));
  console.log(chalk.gray(`Date Range: ${formatDate(data.metadata.dateRange.start)} - ${formatDate(data.metadata.dateRange.end)}`));
  console.log(chalk.gray(`Total Records: ${formatNumber(data.metadata.totalRecords)}`));
  console.log('');
  
  const sortedScopes = Array.from(data.scopes.entries()).sort((a, b) => 
    b[1].summary.totalRecords - a[1].summary.totalRecords
  );
  
  for (const [scopeId, scopeData] of sortedScopes) {
    const config = scopesConfig[scopeId];
    const icon = config?.icon || '📁';
    const name = config?.name || scopeId;
    const sensitivity = config?.sensitivity || 'unknown';
    
    const sensitivityColor = 
      sensitivity === 'low' ? chalk.green :
      sensitivity === 'medium' ? chalk.yellow :
      sensitivity === 'high' ? chalk.red :
      chalk.gray;
    
    console.log(
      `  ${icon} ${chalk.bold(name.padEnd(25))} ` +
      chalk.cyan(`${formatNumber(scopeData.summary.totalRecords).padStart(10)} records  `) +
      sensitivityColor(`[${sensitivity}]`)
    );
  }
  
  if (data.workouts.length > 0) {
    console.log(
      `  🏃 ${chalk.bold('Workouts'.padEnd(25))} ` +
      chalk.cyan(`${formatNumber(data.workouts.length).padStart(10)} sessions  `) +
      chalk.green('[low]')
    );
  }
  
  console.log('\n' + chalk.blue('━'.repeat(60)) + '\n');
}

// ============================================================================
// Scope Selection
// ============================================================================

async function selectScopes(data: ParsedHealthData): Promise<string[]> {
  const scopesConfig = loadScopesConfig();
  const availableScopes = Array.from(data.scopes.keys());
  
  if (data.workouts.length > 0) {
    availableScopes.push('workouts');
  }
  
  const choices = availableScopes.map(scopeId => {
    const config = scopesConfig[scopeId];
    const scopeData = data.scopes.get(scopeId);
    const count = scopeId === 'workouts' ? data.workouts.length : (scopeData?.summary.totalRecords || 0);
    const icon = config?.icon || (scopeId === 'workouts' ? '🏃' : '📁');
    const name = config?.name || scopeId;
    
    return {
      name: `${icon} ${name} (${formatNumber(count)} records)`,
      value: scopeId,
      checked: config?.sensitivity === 'low',
    };
  });
  
  const { selectedScopes } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedScopes',
      message: 'Select which data scopes to import:',
      choices,
      pageSize: 15,
    },
  ]);
  
  return selectedScopes;
}

// ============================================================================
// Data Storage
// ============================================================================

async function storeData(
  data: ParsedHealthData,
  selectedScopes: string[],
  encrypt: boolean = true
): Promise<void> {
  ensureDir(join(HEALTH_DATA_DIR, 'parsed'));
  ensureDir(ENCRYPTED_DIR);
  
  const spinner = ora('Storing health data...').start();
  
  let password = '';
  if (encrypt) {
    spinner.stop();
    const { pwd } = await inquirer.prompt([
      {
        type: 'password',
        name: 'pwd',
        message: 'Enter encryption password:',
        mask: '*',
      },
    ]);
    password = pwd;
    spinner.start();
  }
  
  for (const scopeId of selectedScopes) {
    spinner.text = `Processing ${scopeId}...`;
    
    let scopeData: any;
    if (scopeId === 'workouts') {
      scopeData = {
        scope: 'workouts',
        records: data.workouts,
        summary: {
          totalRecords: data.workouts.length,
          dateRange: data.metadata.dateRange,
        },
      };
    } else {
      scopeData = data.scopes.get(scopeId);
    }
    
    if (!scopeData) continue;
    
    const jsonData = JSON.stringify(scopeData, null, 2);
    const hash = createHash('sha256').update(jsonData).digest('hex').slice(0, 8);
    
    if (encrypt) {
      const encrypted = encryptData(jsonData, password);
      const encryptedPath = join(ENCRYPTED_DIR, `${scopeId}-${hash}.enc`);
      writeFileSync(encryptedPath, JSON.stringify(encrypted, null, 2));
    } else {
      const plainPath = join(HEALTH_DATA_DIR, 'parsed', `${scopeId}-${hash}.json`);
      writeFileSync(plainPath, jsonData);
    }
  }
  
  // Save metadata
  const metadataPath = join(CONFIG_DIR, 'import-metadata.json');
  writeFileSync(metadataPath, JSON.stringify({
    importDate: new Date().toISOString(),
    exportDate: data.exportDate,
    selectedScopes,
    totalRecords: data.metadata.totalRecords,
    dateRange: data.metadata.dateRange,
    encrypted: encrypt,
  }, null, 2));
  
  // Update user preferences
  const prefsPath = join(CONFIG_DIR, 'user-preferences.json');
  let prefs: { enabledScopes: string[]; lastImport: string | null; dataRetentionDays: number; autoDelete: boolean } = 
    { enabledScopes: [], lastImport: null, dataRetentionDays: 365, autoDelete: false };
  if (existsSync(prefsPath)) {
    prefs = JSON.parse(readFileSync(prefsPath, 'utf-8'));
  }
  prefs.enabledScopes = selectedScopes;
  prefs.lastImport = new Date().toISOString();
  writeFileSync(prefsPath, JSON.stringify(prefs, null, 2));
  
  spinner.succeed(`Stored ${selectedScopes.length} scope(s) ${encrypt ? '(encrypted)' : ''}`);
}

// ============================================================================
// Main
// ============================================================================

program
  .name('import-health-data')
  .description('Import and process Apple Health export data')
  .version('1.0.0')
  .requiredOption('-f, --file <path>', 'Path to Apple Health export.xml')
  .option('-s, --scopes <scopes>', 'Comma-separated list of scopes to import')
  .option('-a, --all', 'Import all available scopes')
  .option('--no-encrypt', 'Store data without encryption')
  .option('--preview', 'Preview data without storing')
  .action(async (options) => {
    console.log('\n' + chalk.bold.cyan('🍎 Proofi Health Data Import') + '\n');
    
    // Parse health export
    const data = await parseHealthExport(options.file);
    
    // Display summary
    displayScopeSummary(data);
    
    if (options.preview) {
      console.log(chalk.yellow('Preview mode - no data stored'));
      return;
    }
    
    // Select scopes
    let selectedScopes: string[];
    if (options.all) {
      selectedScopes = Array.from(data.scopes.keys());
      if (data.workouts.length > 0) {
        selectedScopes.push('workouts');
      }
      console.log(chalk.green(`Importing all ${selectedScopes.length} scopes...`));
    } else if (options.scopes) {
      selectedScopes = options.scopes.split(',').map((s: string) => s.trim());
      const invalid = selectedScopes.filter(s => !data.scopes.has(s) && s !== 'workouts');
      if (invalid.length > 0) {
        console.log(chalk.yellow(`Warning: Invalid scopes ignored: ${invalid.join(', ')}`));
        selectedScopes = selectedScopes.filter(s => data.scopes.has(s) || s === 'workouts');
      }
    } else {
      selectedScopes = await selectScopes(data);
    }
    
    if (selectedScopes.length === 0) {
      console.log(chalk.yellow('No scopes selected. Exiting.'));
      return;
    }
    
    // Confirm
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Import ${selectedScopes.length} scope(s)?`,
        default: true,
      },
    ]);
    
    if (!confirm) {
      console.log(chalk.yellow('Import cancelled.'));
      return;
    }
    
    // Store data
    await storeData(data, selectedScopes, options.encrypt);
    
    console.log('\n' + chalk.green.bold('✓ Import complete!'));
    console.log(chalk.gray(`  Data stored in: ${options.encrypt ? ENCRYPTED_DIR : join(HEALTH_DATA_DIR, 'parsed')}`));
    console.log(chalk.gray(`  Run 'npm run scopes' to manage your data sharing preferences`));
    console.log('');
  });

program.parse();
