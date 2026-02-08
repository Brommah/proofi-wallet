# Proofi Mac Mini Health Data Scripts

Privacy-first health data processing for the Proofi ecosystem.

## 📋 Overview

These scripts enable local processing of Apple Health data on a Mac Mini, with:
- **Local LLM processing** via Ollama (llama3.2:3b)
- **Scope-based data organization** (steps, sleep, heart rate, etc.)
- **User-controlled sharing** (choose exactly what to share)
- **AES-256-GCM encryption** for stored data

## 🚀 Quick Start

### 1. Run Setup Script

```bash
cd ~/clawd/proofi/scripts
chmod +x setup-mac-mini.sh
./setup-mac-mini.sh
```

This installs:
- Homebrew (if needed)
- Node.js & tsx
- Ollama with llama3.2:3b model
- Directory structure at `~/.proofi/`

### 2. Export Apple Health Data

On your iPhone:
1. Open **Health** app
2. Tap your **profile picture** (top right)
3. Scroll down → **Export All Health Data**
4. Save/AirDrop the `export.zip` to your Mac Mini
5. Unzip and place `export.xml` in `~/.proofi/health/raw/`

### 3. Import Health Data

```bash
npm run import -- --file ~/.proofi/health/raw/export.xml
```

Or with specific scopes:
```bash
npm run import -- --file export.xml --scopes steps,heartRate,sleep
```

### 4. Manage Data Sharing

```bash
npm run scopes
```

Interactive menu to:
- View available scopes
- Enable/disable sharing per scope
- Preview data before sharing

## 📁 Directory Structure

```
~/.proofi/
├── health/
│   ├── raw/          # Place export.xml here
│   └── parsed/       # Parsed JSON (if unencrypted)
├── encrypted/        # Encrypted scope data
├── config/
│   ├── proofi.json         # Main config
│   ├── scopes.json         # Scope definitions
│   └── user-preferences.json
└── logs/
```

## 🔒 Data Scopes

| Scope | Description | Sensitivity |
|-------|-------------|-------------|
| 🌙 sleep | Sleep duration & patterns | Medium |
| 👟 steps | Step count & distance | Low |
| ❤️ heartRate | Heart rate measurements | High |
| 🔥 activeEnergy | Calories burned | Low |
| 💓 restingHeartRate | Resting heart rate | Medium |
| 📈 heartRateVariability | HRV (stress indicator) | High |
| 🫁 oxygenSaturation | Blood oxygen (SpO2) | High |
| 💨 respiratoryRate | Breathing rate | Medium |
| ⚖️ bodyMass | Weight measurements | High |
| 📏 height | Height | Low |
| 🏃 workouts | Exercise sessions | Low |
| 🧘 mindfulMinutes | Meditation sessions | Low |
| 🧍 standHours | Standing hours | Low |

## 📖 CLI Reference

### import-health-data.ts

```bash
# Basic import (interactive scope selection)
npm run import -- --file export.xml

# Import specific scopes
npm run import -- --file export.xml --scopes steps,heartRate

# Import all scopes
npm run import -- --file export.xml --all

# Preview without storing
npm run import -- --file export.xml --preview

# Store without encryption (not recommended)
npm run import -- --file export.xml --no-encrypt
```

### scope-selector.ts

```bash
# Interactive menu
npm run scopes

# List all scopes
npm run scopes -- --list

# Preview specific scope
npm run scopes -- --preview steps

# Enable scopes
npm run scopes -- --enable steps,heartRate

# Disable scopes
npm run scopes -- --disable bodyMass

# Show status
npm run scopes -- --status
```

## 🔐 Security

### Encryption
- **Algorithm:** AES-256-GCM
- **Key derivation:** scrypt with random salt
- **Per-file encryption:** Each scope stored separately

### Data Privacy
- All data stays on your Mac Mini
- You choose exactly which scopes to share
- Encryption password never leaves your device
- No cloud sync, no external APIs

## 🔧 Configuration

### proofi.json
```json
{
  "version": "1.0.0",
  "dataDir": "~/.proofi",
  "ollama": {
    "model": "llama3.2:3b",
    "host": "http://localhost:11434"
  },
  "encryption": {
    "algorithm": "aes-256-gcm",
    "keyDerivation": "argon2id"
  }
}
```

### user-preferences.json
```json
{
  "enabledScopes": ["steps", "activeEnergy"],
  "lastImport": "2025-02-08T14:30:00Z",
  "dataRetentionDays": 365,
  "autoDelete": false
}
```

## 🐛 Troubleshooting

### Ollama not running
```bash
ollama serve &
```

### Model not found
```bash
ollama pull llama3.2:3b
```

### XML parsing slow
Large exports (>100MB) may take 1-2 minutes. This is normal.

### Decryption failed
Wrong password. Data is encrypted with AES-256-GCM which will fail on incorrect passwords.

## 📄 License

Part of the Proofi ecosystem. See main repository for license.
