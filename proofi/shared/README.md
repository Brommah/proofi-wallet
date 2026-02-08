# Proofi Health Data Scope Selector

Interactive components for selecting which health data types to share in zero-knowledge proofs.

## Components

### 1. Web Component (`scope-selector.html`)

Standalone HTML/JS component for web browsers.

```bash
# Open in browser
open scope-selector.html

# Or serve locally
npx serve .
```

**Features:**
- Visual card-based selection
- Sensitivity indicators (low/medium/high)
- Data preview per scope
- Filter by sensitivity level
- Select All / Select None
- Persistent preferences (localStorage)

**JavaScript API:**
```javascript
// Get currently selected scopes
const selected = window.ProofiScopeSelector.getSelected();

// Programmatically set selection
window.ProofiScopeSelector.setSelected(['sleep', 'steps', 'workouts']);

// Save to localStorage
window.ProofiScopeSelector.save();
```

---

### 2. React Native Component (`ScopeSelector.tsx`)

Mobile-ready React/React Native component.

```bash
# Install peer dependency
npm install @react-native-async-storage/async-storage
```

**Usage:**
```tsx
import { ScopeSelector } from './ScopeSelector';

function App() {
  return (
    <ScopeSelector
      initialSelection={['sleep', 'steps']}
      onSelectionChange={(scopes) => console.log('Selected:', scopes)}
      onSave={(scopes) => console.log('Saved:', scopes)}
      showPreview={true}
      persistPreferences={true}
    />
  );
}
```

**Hook for programmatic access:**
```tsx
import { useScopeSelector } from './ScopeSelector';

function MyComponent() {
  const { selected, save } = useScopeSelector();
  
  return (
    <Text>Selected: {selected.join(', ')}</Text>
  );
}
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialSelection` | `string[]` | `[]` | Initially selected scope IDs |
| `onSelectionChange` | `(scopes: string[]) => void` | - | Callback on selection change |
| `onSave` | `(scopes: string[]) => void` | - | Callback when saved |
| `showPreview` | `boolean` | `true` | Show sample data previews |
| `persistPreferences` | `boolean` | `true` | Enable AsyncStorage persistence |
| `storageKey` | `string` | `'proofi_health_scopes'` | Custom storage key |

---

### 3. CLI Interactive Prompt (`scope-selector-cli.js`)

Terminal-based interactive selector.

```bash
# Make executable
chmod +x scope-selector-cli.js

# Run interactive mode
./scope-selector-cli.js

# Or with node
node scope-selector-cli.js
```

**Interactive Controls:**
- `↑/↓` - Navigate scopes
- `SPACE` / `ENTER` - Toggle selection
- `A` - Select all
- `N` - Select none
- `P` - Toggle preview mode
- `F` - Cycle filter (all/low/medium/high)
- `S` - Save preferences
- `Q` - Quit

**CLI Flags:**
```bash
# List all available scopes
./scope-selector-cli.js --list

# Show current saved preferences
./scope-selector-cli.js --show

# Output preferences as JSON
./scope-selector-cli.js --json

# Set scopes directly
./scope-selector-cli.js --set sleep,steps,workouts
./scope-selector-cli.js --set all
./scope-selector-cli.js --set none
```

**Storage Location:** `~/.proofi-scopes.json`

---

## Health Data Scopes

| ID | Name | Sensitivity | Description |
|----|------|-------------|-------------|
| `sleep` | 🌙 Sleep | 🟢 Low | Sleep duration, quality, stages |
| `steps` | 👟 Steps | 🟢 Low | Daily step count, distance |
| `heart_rate` | ❤️ Heart Rate | 🟡 Medium | Resting/active heart rate |
| `hrv` | 📈 HRV | 🟡 Medium | Heart rate variability |
| `workouts` | 🏃 Workouts | 🟢 Low | Exercise sessions |
| `body_mass` | ⚖️ Body Mass | 🔴 High | Weight, body composition |
| `blood_oxygen` | 🫁 Blood Oxygen | 🟡 Medium | SpO2 levels |
| `respiratory_rate` | 💨 Respiratory Rate | 🟡 Medium | Breathing rate |
| `nutrition` | 🍎 Nutrition | 🟡 Medium | Calorie/macro tracking |
| `menstrual` | 🩸 Menstrual Cycle | 🔴 High | Cycle tracking |
| `mindfulness` | 🧘 Mindfulness | 🟢 Low | Meditation sessions |
| `stress` | 😰 Stress | 🔴 High | Stress indicators |

---

## Sensitivity Levels

- **🟢 Low** - General fitness data (activity, sleep patterns)
- **🟡 Medium** - Health indicators (vitals, nutrition)
- **🔴 High** - Sensitive health data (body metrics, reproductive, mental health)

---

## Shared Data Types (`health-scopes.js`)

Import the scope definitions for custom integrations:

```javascript
import { 
  HEALTH_SCOPES,
  SENSITIVITY_LEVELS,
  CATEGORIES,
  loadPreferences,
  savePreferences 
} from './health-scopes.js';

// Get all scope IDs
const allIds = HEALTH_SCOPES.map(s => s.id);

// Filter by sensitivity
const lowSensitivity = HEALTH_SCOPES.filter(s => s.sensitivity === 'low');

// Check if a scope exists
const hasScope = HEALTH_SCOPES.some(s => s.id === 'sleep');
```

---

## Integration with Proofi

These selectors generate an array of scope IDs that can be passed to the Proofi proof generation:

```javascript
// Web
const scopes = window.ProofiScopeSelector.getSelected();

// React Native
const { selected } = useScopeSelector();

// CLI
const prefs = JSON.parse(fs.readFileSync('~/.proofi-scopes.json'));
const scopes = prefs.scopes;

// Use with Proofi
await proofi.generateProof({
  scopes: scopes,
  // ... other options
});
```
