#!/bin/bash
#
# Proofi Mac Mini Health Data Setup Script
# =========================================
# Complete setup for Mac Mini with health data processing capabilities.
#
# Features:
# - Install Ollama (local LLM runtime)
# - Pull llama3.2:3b model for health data analysis
# - Setup health data import infrastructure
# - Configure data scopes and encryption
#
# Usage: ./setup-mac-mini.sh [--skip-ollama] [--skip-model] [--data-dir PATH]
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DATA_DIR="${HOME}/.proofi"
HEALTH_DATA_DIR="${DATA_DIR}/health"
ENCRYPTED_DIR="${DATA_DIR}/encrypted"
CONFIG_DIR="${DATA_DIR}/config"
MODEL_NAME="llama3.2:3b"
SKIP_OLLAMA=false
SKIP_MODEL=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-ollama)
            SKIP_OLLAMA=true
            shift
            ;;
        --skip-model)
            SKIP_MODEL=true
            shift
            ;;
        --data-dir)
            DATA_DIR="$2"
            HEALTH_DATA_DIR="${DATA_DIR}/health"
            ENCRYPTED_DIR="${DATA_DIR}/encrypted"
            CONFIG_DIR="${DATA_DIR}/config"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [--skip-ollama] [--skip-model] [--data-dir PATH]"
            echo ""
            echo "Options:"
            echo "  --skip-ollama    Skip Ollama installation"
            echo "  --skip-model     Skip model download"
            echo "  --data-dir PATH  Custom data directory (default: ~/.proofi)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# Header
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}       ${GREEN}Proofi Mac Mini Health Data Setup${NC}                  ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}       Privacy-first health data infrastructure          ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check macOS
if [[ "$(uname)" != "Darwin" ]]; then
    error "This script is designed for macOS"
fi

# Check if running on Apple Silicon or Intel
ARCH=$(uname -m)
log "Detected architecture: ${ARCH}"

# ============================================================================
# Step 1: Install Homebrew (if needed)
# ============================================================================
log "Checking Homebrew installation..."
if ! command -v brew &> /dev/null; then
    log "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon
    if [[ "$ARCH" == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    success "Homebrew installed"
else
    success "Homebrew already installed"
fi

# ============================================================================
# Step 2: Install Node.js and dependencies
# ============================================================================
log "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    log "Installing Node.js via Homebrew..."
    brew install node
    success "Node.js installed"
else
    NODE_VERSION=$(node -v)
    success "Node.js already installed (${NODE_VERSION})"
fi

# Install tsx for TypeScript execution
log "Installing tsx (TypeScript executor)..."
if ! command -v tsx &> /dev/null; then
    npm install -g tsx
    success "tsx installed globally"
else
    success "tsx already installed"
fi

# ============================================================================
# Step 3: Install Ollama
# ============================================================================
if [[ "$SKIP_OLLAMA" == false ]]; then
    log "Checking Ollama installation..."
    if ! command -v ollama &> /dev/null; then
        log "Installing Ollama..."
        curl -fsSL https://ollama.com/install.sh | sh
        success "Ollama installed"
    else
        OLLAMA_VERSION=$(ollama -v 2>/dev/null || echo "unknown")
        success "Ollama already installed (${OLLAMA_VERSION})"
    fi
    
    # Start Ollama service
    log "Starting Ollama service..."
    if pgrep -x "ollama" > /dev/null; then
        success "Ollama service already running"
    else
        ollama serve &>/dev/null &
        sleep 3
        success "Ollama service started"
    fi
else
    warn "Skipping Ollama installation (--skip-ollama)"
fi

# ============================================================================
# Step 4: Pull LLM Model
# ============================================================================
if [[ "$SKIP_MODEL" == false ]] && [[ "$SKIP_OLLAMA" == false ]]; then
    log "Pulling ${MODEL_NAME} model (this may take a few minutes)..."
    
    # Check if model already exists
    if ollama list 2>/dev/null | grep -q "${MODEL_NAME}"; then
        success "Model ${MODEL_NAME} already downloaded"
    else
        ollama pull "${MODEL_NAME}"
        success "Model ${MODEL_NAME} downloaded"
    fi
    
    # Verify model works
    log "Verifying model..."
    RESPONSE=$(echo "Say 'ready'" | ollama run "${MODEL_NAME}" 2>/dev/null | head -1)
    if [[ -n "$RESPONSE" ]]; then
        success "Model verified and working"
    else
        warn "Model may need additional verification"
    fi
else
    warn "Skipping model download"
fi

# ============================================================================
# Step 5: Create Directory Structure
# ============================================================================
log "Creating directory structure..."

mkdir -p "${HEALTH_DATA_DIR}/raw"          # Raw Apple Health exports
mkdir -p "${HEALTH_DATA_DIR}/parsed"       # Parsed JSON data
mkdir -p "${ENCRYPTED_DIR}"                 # Encrypted data store
mkdir -p "${CONFIG_DIR}"                    # Configuration files
mkdir -p "${DATA_DIR}/logs"                 # Log files

success "Directory structure created at ${DATA_DIR}"

# ============================================================================
# Step 6: Create Configuration Files
# ============================================================================
log "Creating configuration files..."

# Main config
cat > "${CONFIG_DIR}/proofi.json" << 'EOF'
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
  },
  "scopes": {
    "available": [
      "sleep",
      "steps",
      "heartRate",
      "activeEnergy",
      "restingHeartRate",
      "heartRateVariability",
      "oxygenSaturation",
      "respiratoryRate",
      "bodyMass",
      "height",
      "workouts",
      "mindfulMinutes",
      "standHours"
    ],
    "defaultEnabled": ["steps", "activeEnergy"]
  }
}
EOF
success "Created proofi.json"

# Scopes configuration with descriptions
cat > "${CONFIG_DIR}/scopes.json" << 'EOF'
{
  "scopes": {
    "sleep": {
      "id": "sleep",
      "name": "Sleep Analysis",
      "description": "Sleep duration, quality, and patterns",
      "healthKitTypes": ["HKCategoryTypeIdentifierSleepAnalysis"],
      "sensitivity": "medium",
      "icon": "🌙"
    },
    "steps": {
      "id": "steps",
      "name": "Step Count",
      "description": "Daily step count and walking distance",
      "healthKitTypes": ["HKQuantityTypeIdentifierStepCount", "HKQuantityTypeIdentifierDistanceWalkingRunning"],
      "sensitivity": "low",
      "icon": "👟"
    },
    "heartRate": {
      "id": "heartRate",
      "name": "Heart Rate",
      "description": "Heart rate measurements throughout the day",
      "healthKitTypes": ["HKQuantityTypeIdentifierHeartRate"],
      "sensitivity": "high",
      "icon": "❤️"
    },
    "activeEnergy": {
      "id": "activeEnergy",
      "name": "Active Energy",
      "description": "Calories burned through activity",
      "healthKitTypes": ["HKQuantityTypeIdentifierActiveEnergyBurned"],
      "sensitivity": "low",
      "icon": "🔥"
    },
    "restingHeartRate": {
      "id": "restingHeartRate",
      "name": "Resting Heart Rate",
      "description": "Heart rate while at rest",
      "healthKitTypes": ["HKQuantityTypeIdentifierRestingHeartRate"],
      "sensitivity": "medium",
      "icon": "💓"
    },
    "heartRateVariability": {
      "id": "heartRateVariability",
      "name": "Heart Rate Variability",
      "description": "HRV measurements (stress/recovery indicator)",
      "healthKitTypes": ["HKQuantityTypeIdentifierHeartRateVariabilitySDNN"],
      "sensitivity": "high",
      "icon": "📈"
    },
    "oxygenSaturation": {
      "id": "oxygenSaturation",
      "name": "Blood Oxygen",
      "description": "SpO2 blood oxygen levels",
      "healthKitTypes": ["HKQuantityTypeIdentifierOxygenSaturation"],
      "sensitivity": "high",
      "icon": "🫁"
    },
    "respiratoryRate": {
      "id": "respiratoryRate",
      "name": "Respiratory Rate",
      "description": "Breathing rate measurements",
      "healthKitTypes": ["HKQuantityTypeIdentifierRespiratoryRate"],
      "sensitivity": "medium",
      "icon": "💨"
    },
    "bodyMass": {
      "id": "bodyMass",
      "name": "Body Weight",
      "description": "Weight measurements",
      "healthKitTypes": ["HKQuantityTypeIdentifierBodyMass"],
      "sensitivity": "high",
      "icon": "⚖️"
    },
    "height": {
      "id": "height",
      "name": "Height",
      "description": "Height measurements",
      "healthKitTypes": ["HKQuantityTypeIdentifierHeight"],
      "sensitivity": "low",
      "icon": "📏"
    },
    "workouts": {
      "id": "workouts",
      "name": "Workouts",
      "description": "Exercise sessions and activities",
      "healthKitTypes": ["HKWorkoutTypeIdentifier"],
      "sensitivity": "low",
      "icon": "🏃"
    },
    "mindfulMinutes": {
      "id": "mindfulMinutes",
      "name": "Mindfulness",
      "description": "Meditation and mindfulness sessions",
      "healthKitTypes": ["HKCategoryTypeIdentifierMindfulSession"],
      "sensitivity": "low",
      "icon": "🧘"
    },
    "standHours": {
      "id": "standHours",
      "name": "Stand Hours",
      "description": "Hours with standing activity",
      "healthKitTypes": ["HKCategoryTypeIdentifierAppleStandHour"],
      "sensitivity": "low",
      "icon": "🧍"
    }
  }
}
EOF
success "Created scopes.json"

# User preferences (empty initially)
cat > "${CONFIG_DIR}/user-preferences.json" << 'EOF'
{
  "enabledScopes": [],
  "lastImport": null,
  "dataRetentionDays": 365,
  "autoDelete": false
}
EOF
success "Created user-preferences.json"

# ============================================================================
# Step 7: Install Script Dependencies
# ============================================================================
log "Installing script dependencies..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

# Create package.json for the scripts
cat > "${SCRIPT_DIR}/package.json" << 'EOF'
{
  "name": "proofi-health-scripts",
  "version": "1.0.0",
  "description": "Proofi health data processing scripts",
  "type": "module",
  "scripts": {
    "import": "tsx import-health-data.ts",
    "scopes": "tsx scope-selector.ts",
    "verify": "tsx verify-data.ts"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "fast-xml-parser": "^4.3.2",
    "inquirer": "^9.2.12",
    "ora": "^8.0.1"
  },
  "devDependencies": {
    "@types/inquirer": "^9.0.7",
    "@types/node": "^20.10.0",
    "tsx": "^4.6.2",
    "typescript": "^5.3.2"
  }
}
EOF

npm install --silent 2>/dev/null || npm install
success "Dependencies installed"

# ============================================================================
# Step 8: Create TypeScript Config
# ============================================================================
cat > "${SCRIPT_DIR}/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": ".",
    "resolveJsonModule": true
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}
EOF
success "TypeScript configured"

# ============================================================================
# Step 9: Verify Setup
# ============================================================================
echo ""
log "Verifying setup..."

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}Directory Structure:${NC}"
echo "  ${DATA_DIR}/"
echo "  ├── health/"
echo "  │   ├── raw/      (Place Apple Health export.xml here)"
echo "  │   └── parsed/   (Parsed JSON data)"
echo "  ├── encrypted/    (Encrypted data storage)"
echo "  ├── config/       (Configuration files)"
echo "  └── logs/         (Log files)"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Export your Apple Health data from iPhone:"
echo "     Health App → Profile → Export All Health Data"
echo ""
echo "  2. Copy the export.xml file to:"
echo "     ${HEALTH_DATA_DIR}/raw/export.xml"
echo ""
echo "  3. Run the import script:"
echo "     cd ${SCRIPT_DIR}"
echo "     npm run import -- --file ${HEALTH_DATA_DIR}/raw/export.xml"
echo ""
echo "  4. Select which data scopes to share:"
echo "     npm run scopes"
echo ""

if command -v ollama &> /dev/null; then
    echo -e "${BLUE}Ollama Status:${NC}"
    if pgrep -x "ollama" > /dev/null; then
        echo "  ✓ Ollama service running"
        echo "  ✓ Model: ${MODEL_NAME}"
        echo "  ✓ API: http://localhost:11434"
    else
        echo "  ⚠ Ollama installed but not running"
        echo "    Start with: ollama serve"
    fi
    echo ""
fi

echo -e "${GREEN}Ready to process health data!${NC}"
echo ""
