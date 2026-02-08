#!/usr/bin/env node

/**
 * Proofi Health Data Scope Selector - CLI Version
 * Interactive terminal prompt for selecting health data scopes
 */

import { createInterface } from 'readline';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// ============ Data ============

const HEALTH_SCOPES = [
  {
    id: 'sleep',
    name: 'Sleep',
    description: 'Sleep duration, quality, and stages',
    icon: '🌙',
    sensitivity: 'low',
    sampleData: { duration: '7h 23m', quality: 'Good', deepSleep: '1h 45m' },
  },
  {
    id: 'steps',
    name: 'Steps',
    description: 'Daily step count and distance walked',
    icon: '👟',
    sensitivity: 'low',
    sampleData: { daily: 8432, distance: '6.2 km', floors: 12 },
  },
  {
    id: 'heart_rate',
    name: 'Heart Rate',
    description: 'Resting and active heart rate measurements',
    icon: '❤️',
    sensitivity: 'medium',
    sampleData: { resting: '62 bpm', average: '74 bpm', max: '142 bpm' },
  },
  {
    id: 'hrv',
    name: 'HRV',
    description: 'Heart rate variability indicating recovery',
    icon: '📈',
    sensitivity: 'medium',
    sampleData: { average: '45 ms', trend: 'Improving', lastNight: '52 ms' },
  },
  {
    id: 'workouts',
    name: 'Workouts',
    description: 'Exercise sessions, duration, and intensity',
    icon: '🏃',
    sensitivity: 'low',
    sampleData: { thisWeek: 4, totalMinutes: 185, calories: 1240 },
  },
  {
    id: 'body_mass',
    name: 'Body Mass',
    description: 'Weight and body composition data',
    icon: '⚖️',
    sensitivity: 'high',
    sampleData: { weight: '75.2 kg', bmi: 23.4, trend: 'Stable' },
  },
  {
    id: 'blood_oxygen',
    name: 'Blood Oxygen',
    description: 'SpO2 levels and oxygen saturation',
    icon: '🫁',
    sensitivity: 'medium',
    sampleData: { average: '98%', min: '95%', nightAvg: '97%' },
  },
  {
    id: 'respiratory_rate',
    name: 'Respiratory Rate',
    description: 'Breathing rate during rest and activity',
    icon: '💨',
    sensitivity: 'medium',
    sampleData: { resting: '14 br/min', sleeping: '12 br/min' },
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    description: 'Calorie intake and macronutrient tracking',
    icon: '🍎',
    sensitivity: 'medium',
    sampleData: { calories: 2150, protein: '95g', carbs: '240g' },
  },
  {
    id: 'menstrual',
    name: 'Menstrual Cycle',
    description: 'Cycle tracking and predictions',
    icon: '🩸',
    sensitivity: 'high',
    sampleData: { cycleDay: 14, phase: 'Ovulation', predicted: 'May 28' },
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    description: 'Meditation and mindfulness sessions',
    icon: '🧘',
    sensitivity: 'low',
    sampleData: { thisWeek: '45 min', streak: '7 days', sessions: 12 },
  },
  {
    id: 'stress',
    name: 'Stress',
    description: 'Stress indicators and recovery metrics',
    icon: '😰',
    sensitivity: 'high',
    sampleData: { current: 'Moderate', weeklyAvg: 42, recoveryTime: '2.5h' },
  },
];

const SENSITIVITY_DISPLAY = {
  low: { label: '🟢 LOW', color: '\x1b[32m' },
  medium: { label: '🟡 MED', color: '\x1b[33m' },
  high: { label: '🔴 HIGH', color: '\x1b[31m' },
};

const PREFS_FILE = join(homedir(), '.proofi-scopes.json');

// ============ Utilities ============

const reset = '\x1b[0m';
const bold = '\x1b[1m';
const dim = '\x1b[2m';
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const white = '\x1b[37m';

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[H');
}

function moveCursor(row, col = 1) {
  process.stdout.write(`\x1b[${row};${col}H`);
}

function hideCursor() {
  process.stdout.write('\x1b[?25l');
}

function showCursor() {
  process.stdout.write('\x1b[?25h');
}

function loadPreferences() {
  try {
    if (existsSync(PREFS_FILE)) {
      const data = JSON.parse(readFileSync(PREFS_FILE, 'utf8'));
      return new Set(data.scopes || []);
    }
  } catch {}
  return new Set();
}

function savePreferences(selected) {
  try {
    writeFileSync(
      PREFS_FILE,
      JSON.stringify({
        scopes: Array.from(selected),
        updatedAt: new Date().toISOString(),
      }),
      'utf8'
    );
    return true;
  } catch {
    return false;
  }
}

// ============ Interactive Selector ============

class ScopeSelector {
  constructor() {
    this.selected = loadPreferences();
    this.cursor = 0;
    this.previewMode = false;
    this.filter = 'all'; // all, low, medium, high
    this.running = true;
  }

  get filteredScopes() {
    if (this.filter === 'all') return HEALTH_SCOPES;
    return HEALTH_SCOPES.filter((s) => s.sensitivity === this.filter);
  }

  render() {
    clearScreen();
    const scopes = this.filteredScopes;

    // Header
    console.log(`${bold}${cyan}╔════════════════════════════════════════════════════════════╗${reset}`);
    console.log(`${bold}${cyan}║${reset}   ${bold}🔐 PROOFI HEALTH DATA SCOPE SELECTOR${reset}                     ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}║${reset}   ${dim}Choose which health metrics to include in your proof${reset}     ${bold}${cyan}║${reset}`);
    console.log(`${bold}${cyan}╚════════════════════════════════════════════════════════════╝${reset}`);
    console.log();

    // Controls
    console.log(`${dim}  [↑/↓] Navigate  [SPACE] Toggle  [A] All  [N] None  [P] Preview  [F] Filter  [S] Save  [Q] Quit${reset}`);
    console.log(`${dim}  Filter: ${this.filter.toUpperCase()}  |  Selected: ${this.selected.size}/${HEALTH_SCOPES.length}${reset}`);
    console.log();

    // Scope list
    console.log(`${bold}  # │ Scope              │ Sensitivity │ Status${reset}`);
    console.log(`${dim}  ──┼────────────────────┼─────────────┼────────${reset}`);

    scopes.forEach((scope, i) => {
      const isSelected = this.selected.has(scope.id);
      const isCursor = i === this.cursor;
      const sens = SENSITIVITY_DISPLAY[scope.sensitivity];

      const prefix = isCursor ? `${cyan}▶${reset}` : ' ';
      const checkbox = isSelected ? `${green}[✓]${reset}` : `${dim}[ ]${reset}`;
      const num = String(i + 1).padStart(2);
      const name = `${scope.icon} ${scope.name}`.padEnd(18);
      const sensLabel = `${sens.color}${sens.label}${reset}`.padEnd(20);

      console.log(`${prefix} ${num} │ ${name} │ ${sensLabel} │ ${checkbox}`);

      // Preview mode: show sample data for current item
      if (this.previewMode && isCursor) {
        console.log(`${dim}     └─ Sample data:${reset}`);
        Object.entries(scope.sampleData).forEach(([key, val]) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
          console.log(`${dim}        ${label}: ${white}${val}${reset}`);
        });
      }
    });

    // Summary
    console.log();
    console.log(`${dim}  ─────────────────────────────────────────────────────────────${reset}`);
    console.log();

    if (this.selected.size > 0) {
      const selectedNames = HEALTH_SCOPES.filter((s) => this.selected.has(s.id))
        .map((s) => `${s.icon} ${s.name}`)
        .join('  ');
      console.log(`  ${bold}Selected:${reset} ${selectedNames}`);
    } else {
      console.log(`  ${dim}No scopes selected${reset}`);
    }

    // Legend
    console.log();
    console.log(`  ${dim}Sensitivity: 🟢 Low (general fitness)  🟡 Medium (health indicators)  🔴 High (sensitive data)${reset}`);
  }

  handleKey(key) {
    const scopes = this.filteredScopes;

    switch (key) {
      case '\x1B[A': // Up
        this.cursor = Math.max(0, this.cursor - 1);
        break;
      case '\x1B[B': // Down
        this.cursor = Math.min(scopes.length - 1, this.cursor + 1);
        break;
      case ' ': // Space - toggle
        if (scopes[this.cursor]) {
          const id = scopes[this.cursor].id;
          if (this.selected.has(id)) {
            this.selected.delete(id);
          } else {
            this.selected.add(id);
          }
        }
        break;
      case 'a':
      case 'A': // Select all
        HEALTH_SCOPES.forEach((s) => this.selected.add(s.id));
        break;
      case 'n':
      case 'N': // Select none
        this.selected.clear();
        break;
      case 'p':
      case 'P': // Toggle preview
        this.previewMode = !this.previewMode;
        break;
      case 'f':
      case 'F': // Cycle filter
        const filters = ['all', 'low', 'medium', 'high'];
        const currentIdx = filters.indexOf(this.filter);
        this.filter = filters[(currentIdx + 1) % filters.length];
        this.cursor = 0;
        break;
      case 's':
      case 'S': // Save
        if (savePreferences(this.selected)) {
          clearScreen();
          console.log(`\n${green}  ✓ Preferences saved to ${PREFS_FILE}${reset}\n`);
          console.log(`  Selected scopes: ${Array.from(this.selected).join(', ') || '(none)'}\n`);
          setTimeout(() => this.render(), 1500);
        }
        return;
      case 'q':
      case 'Q':
      case '\x03': // Ctrl+C
        this.running = false;
        return;
      case '\r': // Enter - toggle like space
        if (scopes[this.cursor]) {
          const id = scopes[this.cursor].id;
          if (this.selected.has(id)) {
            this.selected.delete(id);
          } else {
            this.selected.add(id);
          }
        }
        break;
    }

    this.render();
  }

  async run() {
    // Set up raw mode for keyboard input
    if (!process.stdin.isTTY) {
      console.error('This tool requires an interactive terminal.');
      process.exit(1);
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    hideCursor();
    this.render();

    return new Promise((resolve) => {
      process.stdin.on('data', (key) => {
        if (!this.running) {
          showCursor();
          clearScreen();
          console.log(`\n${dim}  Goodbye! Your selections: ${Array.from(this.selected).join(', ') || '(none)'}${reset}\n`);
          process.stdin.setRawMode(false);
          resolve(Array.from(this.selected));
          process.exit(0);
        }
        this.handleKey(key);
      });
    });
  }
}

// ============ Non-interactive mode (for piping) ============

async function nonInteractiveMode() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('\n🔐 Proofi Health Data Scope Selector\n');
  console.log('Available scopes:\n');

  HEALTH_SCOPES.forEach((scope, i) => {
    const sens = SENSITIVITY_DISPLAY[scope.sensitivity];
    console.log(`  ${i + 1}. ${scope.icon} ${scope.name} ${sens.label}`);
    console.log(`     ${dim}${scope.description}${reset}\n`);
  });

  return new Promise((resolve) => {
    rl.question('\nEnter scope numbers (comma-separated) or "all"/"none": ', (answer) => {
      let selected;

      if (answer.toLowerCase() === 'all') {
        selected = HEALTH_SCOPES.map((s) => s.id);
      } else if (answer.toLowerCase() === 'none') {
        selected = [];
      } else {
        const indices = answer
          .split(',')
          .map((s) => parseInt(s.trim()) - 1)
          .filter((i) => i >= 0 && i < HEALTH_SCOPES.length);
        selected = indices.map((i) => HEALTH_SCOPES[i].id);
      }

      rl.question('\nSave preferences? (y/n): ', (save) => {
        if (save.toLowerCase() === 'y') {
          savePreferences(new Set(selected));
          console.log(`\n${green}✓ Saved!${reset}\n`);
        }

        console.log(`\nSelected: ${selected.join(', ') || '(none)'}\n`);
        rl.close();
        resolve(selected);
      });
    });
  });
}

// ============ Main ============

async function main() {
  // Check for flags
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔐 Proofi Health Data Scope Selector

Usage:
  scope-selector-cli.js          Interactive mode (requires TTY)
  scope-selector-cli.js --list   List all available scopes
  scope-selector-cli.js --show   Show current saved preferences
  scope-selector-cli.js --json   Output current preferences as JSON
  scope-selector-cli.js --set <scopes>  Set scopes (comma-separated IDs)

Examples:
  scope-selector-cli.js --set sleep,steps,workouts
  scope-selector-cli.js --set all
`);
    return;
  }

  if (args.includes('--list')) {
    console.log('\n🔐 Available Health Data Scopes:\n');
    HEALTH_SCOPES.forEach((scope) => {
      const sens = SENSITIVITY_DISPLAY[scope.sensitivity];
      console.log(`  ${scope.id.padEnd(16)} ${scope.icon} ${scope.name.padEnd(20)} ${sens.label}`);
    });
    console.log();
    return;
  }

  if (args.includes('--show')) {
    const prefs = loadPreferences();
    console.log('\n🔐 Current Preferences:\n');
    if (prefs.size === 0) {
      console.log('  (none selected)\n');
    } else {
      HEALTH_SCOPES.filter((s) => prefs.has(s.id)).forEach((scope) => {
        console.log(`  ${scope.icon} ${scope.name}`);
      });
      console.log();
    }
    return;
  }

  if (args.includes('--json')) {
    const prefs = loadPreferences();
    console.log(JSON.stringify({ scopes: Array.from(prefs) }, null, 2));
    return;
  }

  if (args.includes('--set')) {
    const idx = args.indexOf('--set');
    const value = args[idx + 1];

    if (!value) {
      console.error('Error: --set requires a value');
      process.exit(1);
    }

    let scopes;
    if (value === 'all') {
      scopes = HEALTH_SCOPES.map((s) => s.id);
    } else if (value === 'none') {
      scopes = [];
    } else {
      scopes = value.split(',').filter((id) => HEALTH_SCOPES.some((s) => s.id === id));
    }

    savePreferences(new Set(scopes));
    console.log(`✓ Saved: ${scopes.join(', ') || '(none)'}`);
    return;
  }

  // Interactive mode
  if (process.stdin.isTTY) {
    const selector = new ScopeSelector();
    await selector.run();
  } else {
    await nonInteractiveMode();
  }
}

main().catch(console.error);
