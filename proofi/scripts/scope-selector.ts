#!/usr/bin/env tsx
/**
 * Proofi Scope Selector
 * =====================
 * Interactive CLI to manage health data scopes.
 * 
 * Features:
 * - View available data scopes
 * - Toggle which scopes to share
 * - Preview data per scope
 * - Manage data retention
 * 
 * Usage:
 *   tsx scope-selector.ts
 *   tsx scope-selector.ts --list
 *   tsx scope-selector.ts --preview steps
 *   tsx scope-selector.ts --enable steps,heartRate
 *   tsx scope-selector.ts --disable bodyMass
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createDecipheriv, scryptSync } from 'crypto';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { program } from 'commander';

// ============================================================================
// Configuration
// ============================================================================

const DATA_DIR = join(homedir(), '.proofi');
const HEALTH_DATA_DIR = join(DATA_DIR, 'health');
const ENCRYPTED_DIR = join(DATA_DIR, 'encrypted');
const CONFIG_DIR = join(DATA_DIR, 'config');

interface ScopeConfig {
  id: string;
  name: string;
  description: string;
  healthKitTypes: string[];
  sensitivity: 'low' | 'medium' | 'high';
  icon: string;
}

interface UserPreferences {
  enabledScopes: string[];
  lastImport: string | null;
  dataRetentionDays: number;
  autoDelete: boolean;
}

interface ImportMetadata {
  importDate: string;
  exportDate: string;
  selectedScopes: string[];
  totalRecords: number;
  dateRange: { start: string; end: string };
  encrypted: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

function loadConfig<T>(filename: string, defaultValue: T): T {
  const path = join(CONFIG_DIR, filename);
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8'));
  }
  return defaultValue;
}

function saveConfig<T>(filename: string, data: T): void {
  const path = join(CONFIG_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function getSensitivityBadge(sensitivity: string): string {
  switch (sensitivity) {
    case 'low':
      return chalk.bgGreen.black(' LOW ');
    case 'medium':
      return chalk.bgYellow.black(' MED ');
    case 'high':
      return chalk.bgRed.white(' HIGH ');
    default:
      return chalk.bgGray.white(' ? ');
  }
}

// ============================================================================
// Decryption
// ============================================================================

function decryptData(
  encryptedData: { encrypted: string; salt: string; iv: string; tag: string },
  password: string
): string {
  const salt = Buffer.from(encryptedData.salt, 'hex');
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const tag = Buffer.from(encryptedData.tag, 'hex');
  const key = scryptSync(password, salt, 32);

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ============================================================================
// Data Loading
// ============================================================================

function getAvailableScopes(): { scopeId: string; file: string; encrypted: boolean }[] {
  const scopes: { scopeId: string; file: string; encrypted: boolean }[] = [];

  // Check encrypted directory
  if (existsSync(ENCRYPTED_DIR)) {
    const encFiles = readdirSync(ENCRYPTED_DIR).filter((f) => f.endsWith('.enc'));
    for (const file of encFiles) {
      const scopeId = file.replace(/-[a-f0-9]+\.enc$/, '');
      scopes.push({ scopeId, file, encrypted: true });
    }
  }

  // Check parsed directory
  const parsedDir = join(HEALTH_DATA_DIR, 'parsed');
  if (existsSync(parsedDir)) {
    const jsonFiles = readdirSync(parsedDir).filter((f) => f.endsWith('.json'));
    for (const file of jsonFiles) {
      const scopeId = file.replace(/-[a-f0-9]+\.json$/, '');
      if (!scopes.find((s) => s.scopeId === scopeId)) {
        scopes.push({ scopeId, file, encrypted: false });
      }
    }
  }

  return scopes;
}

async function loadScopeData(
  scopeId: string,
  password?: string
): Promise<{ records: any[]; summary: any } | null> {
  const available = getAvailableScopes();
  const scope = available.find((s) => s.scopeId === scopeId);

  if (!scope) return null;

  try {
    if (scope.encrypted) {
      if (!password) {
        const { pwd } = await inquirer.prompt([
          {
            type: 'password',
            name: 'pwd',
            message: 'Enter decryption password:',
            mask: '*',
          },
        ]);
        password = pwd;
      }

      const encPath = join(ENCRYPTED_DIR, scope.file);
      const encData = JSON.parse(readFileSync(encPath, 'utf-8'));
      const decrypted = decryptData(encData, password!);
      return JSON.parse(decrypted);
    } else {
      const path = join(HEALTH_DATA_DIR, 'parsed', scope.file);
      return JSON.parse(readFileSync(path, 'utf-8'));
    }
  } catch (error) {
    console.log(chalk.red(`Error loading scope data: ${(error as Error).message}`));
    return null;
  }
}

// ============================================================================
// Display Functions
// ============================================================================

function displayStatus(): void {
  const scopesConfig = loadConfig<{ scopes: Record<string, ScopeConfig> }>('scopes.json', { scopes: {} });
  const prefs = loadConfig<UserPreferences>('user-preferences.json', {
    enabledScopes: [],
    lastImport: null,
    dataRetentionDays: 365,
    autoDelete: false,
  });
  const metadata = loadConfig<ImportMetadata | null>('import-metadata.json', null);
  const available = getAvailableScopes();

  console.log('\n' + chalk.blue('━'.repeat(70)));
  console.log(chalk.bold.white('  🔐 Proofi Health Data Scopes'));
  console.log(chalk.blue('━'.repeat(70)) + '\n');

  // Import info
  if (metadata) {
    console.log(chalk.gray(`  Last import: ${formatDate(metadata.importDate)}`));
    console.log(chalk.gray(`  Data range: ${formatDate(metadata.dateRange.start)} - ${formatDate(metadata.dateRange.end)}`));
    console.log(chalk.gray(`  Total records: ${formatNumber(metadata.totalRecords)}`));
    console.log(chalk.gray(`  Storage: ${metadata.encrypted ? '🔒 Encrypted' : '📁 Plain'}`));
    console.log('');
  } else {
    console.log(chalk.yellow('  ⚠ No health data imported yet.'));
    console.log(chalk.gray('  Run: npm run import -- --file path/to/export.xml\n'));
    return;
  }

  // Scope table header
  console.log(
    chalk.gray('  ') +
      chalk.bold('Status'.padEnd(10)) +
      chalk.bold('Scope'.padEnd(22)) +
      chalk.bold('Records'.padEnd(12)) +
      chalk.bold('Privacy')
  );
  console.log(chalk.gray('  ' + '─'.repeat(60)));

  // List scopes
  for (const { scopeId, encrypted } of available) {
    const config = scopesConfig.scopes[scopeId];
    const isEnabled = prefs.enabledScopes.includes(scopeId);
    const icon = config?.icon || '📁';
    const name = config?.name || scopeId;
    const sensitivity = config?.sensitivity || 'unknown';

    const status = isEnabled ? chalk.green('✓ Enabled') : chalk.gray('○ Hidden ');
    const badge = getSensitivityBadge(sensitivity);

    console.log(
      chalk.gray('  ') +
        status.padEnd(19) +
        `${icon} ${name}`.padEnd(22) +
        chalk.cyan('•••'.padEnd(12)) +
        badge
    );
  }

  console.log('\n' + chalk.blue('━'.repeat(70)));
  console.log(chalk.gray('  Enabled scopes can be shared with verifiers.'));
  console.log(chalk.gray('  Hidden scopes are stored but not shared.'));
  console.log(chalk.blue('━'.repeat(70)) + '\n');
}

async function previewScope(scopeId: string): Promise<void> {
  const scopesConfig = loadConfig<{ scopes: Record<string, ScopeConfig> }>('scopes.json', { scopes: {} });
  const config = scopesConfig.scopes[scopeId];

  console.log('\n' + chalk.blue('━'.repeat(60)));
  console.log(chalk.bold.white(`  ${config?.icon || '📁'} ${config?.name || scopeId} - Data Preview`));
  console.log(chalk.blue('━'.repeat(60)) + '\n');

  const data = await loadScopeData(scopeId);
  if (!data) {
    console.log(chalk.red('  Could not load scope data.\n'));
    return;
  }

  console.log(chalk.gray(`  Total records: ${formatNumber(data.records?.length || 0)}`));
  console.log(chalk.gray(`  Date range: ${data.summary?.dateRange?.start || 'N/A'} - ${data.summary?.dateRange?.end || 'N/A'}`));
  console.log('');

  // Show sample records
  const records = data.records || [];
  const sampleSize = Math.min(5, records.length);

  if (sampleSize > 0) {
    console.log(chalk.bold('  Sample Records:'));
    console.log(chalk.gray('  ' + '─'.repeat(50)));

    for (let i = 0; i < sampleSize; i++) {
      const record = records[i];
      const date = formatDate(record.startDate || record.creationDate || '');
      const value = record.value !== undefined ? record.value : 'N/A';
      const unit = record.unit || record.durationUnit || '';
      const source = record.sourceName || 'Unknown';

      console.log(chalk.gray(`  ${date}`));
      console.log(`    Value: ${chalk.cyan(value)} ${unit}`);
      console.log(`    Source: ${chalk.gray(source)}`);
      console.log('');
    }

    if (records.length > sampleSize) {
      console.log(chalk.gray(`  ... and ${formatNumber(records.length - sampleSize)} more records`));
    }
  }

  // Statistics
  if (records.length > 0 && records[0].value !== undefined) {
    const numericValues = records
      .map((r: any) => parseFloat(r.value))
      .filter((v: number) => !isNaN(v));

    if (numericValues.length > 0) {
      const avg = numericValues.reduce((a: number, b: number) => a + b, 0) / numericValues.length;
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);

      console.log('');
      console.log(chalk.bold('  Statistics:'));
      console.log(chalk.gray('  ' + '─'.repeat(30)));
      console.log(`    Average: ${chalk.cyan(avg.toFixed(2))}`);
      console.log(`    Min: ${chalk.cyan(min.toFixed(2))}`);
      console.log(`    Max: ${chalk.cyan(max.toFixed(2))}`);
    }
  }

  console.log('\n' + chalk.blue('━'.repeat(60)) + '\n');
}

// ============================================================================
// Interactive Menu
// ============================================================================

async function interactiveMenu(): Promise<void> {
  const scopesConfig = loadConfig<{ scopes: Record<string, ScopeConfig> }>('scopes.json', { scopes: {} });
  const available = getAvailableScopes();

  if (available.length === 0) {
    console.log(chalk.yellow('\n  ⚠ No health data available.'));
    console.log(chalk.gray('  Import data first: npm run import -- --file path/to/export.xml\n'));
    return;
  }

  displayStatus();

  const prefs = loadConfig<UserPreferences>('user-preferences.json', {
    enabledScopes: [],
    lastImport: null,
    dataRetentionDays: 365,
    autoDelete: false,
  });

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '🔄  Toggle scope sharing', value: 'toggle' },
        { name: '👁️  Preview scope data', value: 'preview' },
        { name: '⚙️  Data retention settings', value: 'settings' },
        { name: '📊  Export enabled scopes', value: 'export' },
        new inquirer.Separator(),
        { name: '❌  Exit', value: 'exit' },
      ],
    },
  ]);

  switch (action) {
    case 'toggle':
      await toggleScopes(available, prefs, scopesConfig.scopes);
      break;
    case 'preview':
      await selectAndPreview(available, scopesConfig.scopes);
      break;
    case 'settings':
      await manageSettings(prefs);
      break;
    case 'export':
      await exportEnabledScopes(prefs);
      break;
    case 'exit':
      console.log(chalk.gray('\n  Goodbye! 👋\n'));
      return;
  }

  // Return to menu
  await interactiveMenu();
}

async function toggleScopes(
  available: { scopeId: string; file: string; encrypted: boolean }[],
  prefs: UserPreferences,
  scopesConfig: Record<string, ScopeConfig>
): Promise<void> {
  const choices = available.map(({ scopeId }) => {
    const config = scopesConfig[scopeId];
    const isEnabled = prefs.enabledScopes.includes(scopeId);
    const icon = config?.icon || '📁';
    const name = config?.name || scopeId;
    const sensitivity = config?.sensitivity || 'unknown';
    const badge =
      sensitivity === 'low' ? chalk.green('[low]') :
      sensitivity === 'medium' ? chalk.yellow('[med]') :
      sensitivity === 'high' ? chalk.red('[high]') : '';

    return {
      name: `${icon} ${name} ${badge}`,
      value: scopeId,
      checked: isEnabled,
    };
  });

  const { selectedScopes } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedScopes',
      message: 'Select scopes to enable for sharing:',
      choices,
      pageSize: 15,
    },
  ]);

  prefs.enabledScopes = selectedScopes;
  saveConfig('user-preferences.json', prefs);

  console.log(chalk.green(`\n  ✓ Updated! ${selectedScopes.length} scope(s) enabled.\n`));
}

async function selectAndPreview(
  available: { scopeId: string; file: string; encrypted: boolean }[],
  scopesConfig: Record<string, ScopeConfig>
): Promise<void> {
  const choices = available.map(({ scopeId }) => {
    const config = scopesConfig[scopeId];
    const icon = config?.icon || '📁';
    const name = config?.name || scopeId;

    return {
      name: `${icon} ${name}`,
      value: scopeId,
    };
  });

  const { scopeId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'scopeId',
      message: 'Select a scope to preview:',
      choices,
      pageSize: 15,
    },
  ]);

  await previewScope(scopeId);
}

async function manageSettings(prefs: UserPreferences): Promise<void> {
  console.log('\n' + chalk.bold('  ⚙️ Data Retention Settings') + '\n');

  const { retentionDays, autoDelete } = await inquirer.prompt([
    {
      type: 'number',
      name: 'retentionDays',
      message: 'Data retention period (days):',
      default: prefs.dataRetentionDays,
    },
    {
      type: 'confirm',
      name: 'autoDelete',
      message: 'Auto-delete data after retention period?',
      default: prefs.autoDelete,
    },
  ]);

  prefs.dataRetentionDays = retentionDays;
  prefs.autoDelete = autoDelete;
  saveConfig('user-preferences.json', prefs);

  console.log(chalk.green('\n  ✓ Settings saved!\n'));
}

async function exportEnabledScopes(prefs: UserPreferences): Promise<void> {
  if (prefs.enabledScopes.length === 0) {
    console.log(chalk.yellow('\n  ⚠ No scopes enabled. Enable some scopes first.\n'));
    return;
  }

  console.log(chalk.bold('\n  📊 Enabled Scopes Summary\n'));

  for (const scopeId of prefs.enabledScopes) {
    console.log(chalk.cyan(`  • ${scopeId}`));
  }

  console.log('');

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Generate shareable proof?',
      default: false,
    },
  ]);

  if (confirm) {
    console.log(chalk.gray('\n  Generating ZK proof... (not yet implemented)'));
    console.log(chalk.yellow('  This feature is coming soon!\n'));
  }
}

// ============================================================================
// CLI Commands
// ============================================================================

program
  .name('scope-selector')
  .description('Manage Proofi health data scopes')
  .version('1.0.0');

program
  .option('-l, --list', 'List all available scopes')
  .option('-p, --preview <scope>', 'Preview data for a specific scope')
  .option('-e, --enable <scopes>', 'Enable scopes (comma-separated)')
  .option('-d, --disable <scopes>', 'Disable scopes (comma-separated)')
  .option('-s, --status', 'Show current status')
  .action(async (options) => {
    console.log('\n' + chalk.bold.cyan('🔐 Proofi Scope Selector'));

    if (options.list || options.status) {
      displayStatus();
      return;
    }

    if (options.preview) {
      await previewScope(options.preview);
      return;
    }

    if (options.enable || options.disable) {
      const prefs = loadConfig<UserPreferences>('user-preferences.json', {
        enabledScopes: [],
        lastImport: null,
        dataRetentionDays: 365,
        autoDelete: false,
      });

      if (options.enable) {
        const toEnable = options.enable.split(',').map((s: string) => s.trim());
        for (const scope of toEnable) {
          if (!prefs.enabledScopes.includes(scope)) {
            prefs.enabledScopes.push(scope);
          }
        }
        console.log(chalk.green(`\n  ✓ Enabled: ${toEnable.join(', ')}`));
      }

      if (options.disable) {
        const toDisable = options.disable.split(',').map((s: string) => s.trim());
        prefs.enabledScopes = prefs.enabledScopes.filter((s) => !toDisable.includes(s));
        console.log(chalk.yellow(`\n  ○ Disabled: ${toDisable.join(', ')}`));
      }

      saveConfig('user-preferences.json', prefs);
      console.log('');
      return;
    }

    // Default: interactive mode
    await interactiveMenu();
  });

program.parse();
