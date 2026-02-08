# Design Practices

UX patterns, UI components, and best practices for building Proofi-compatible applications.

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Token Grant Flow](#token-grant-flow)
3. [Mobile App Patterns](#mobile-app-patterns)
4. [Chrome Extension Patterns](#chrome-extension-patterns)
5. [Component Library](#component-library)
6. [Error Handling](#error-handling)
7. [Accessibility](#accessibility)

---

## Design Principles

### 1. Transparency First

Users must always understand:
- **What data** is being shared
- **With whom** (agent identity)
- **For how long** (token expiration)
- **What permissions** are granted

```
┌─────────────────────────────────────────┐
│  ✓ DO: Show exactly what's shared      │
├─────────────────────────────────────────┤
│                                         │
│  Share with Health Analyzer?            │
│                                         │
│  📊 Steps data (last 30 days)          │
│  😴 Sleep data (last 30 days)          │
│  💭 Mood entries (last 30 days)        │
│                                         │
│  ⏱️ Access expires in 1 hour           │
│  🔒 Agent cannot store your raw data   │
│                                         │
│  [Cancel]              [Grant Access]   │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Minimal Permission Requests

Ask only for what you need.

```typescript
// ❌ Bad: Request everything
scopes: [{ path: '*', permissions: ['read', 'write'] }]

// ✅ Good: Request only what's needed
scopes: [
  { path: 'health/steps', permissions: ['read'] },
  { path: 'health/sleep', permissions: ['read'] }
]
```

### 3. Reversible by Default

Users should always be able to:
- **Revoke** access immediately
- **See** what they've shared
- **Delete** their data

### 4. Progressive Disclosure

Don't overwhelm. Show complexity only when needed.

```
Simple View:
┌─────────────────────────────┐
│ Grant access to Health AI?  │
│ [Yes] [No] [Details ▼]      │
└─────────────────────────────┘

Expanded View:
┌─────────────────────────────┐
│ Grant access to Health AI?  │
├─────────────────────────────┤
│ Data: health/steps (read)   │
│ Expires: 2024-02-08 22:30   │
│ Agent: d+YpS3K8h2vJ1c...    │
│ [Yes] [No] [Details ▲]      │
└─────────────────────────────┘
```

---

## Token Grant Flow

### Standard Flow (Web/Mobile)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         TOKEN GRANT FLOW                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Discovery              2. Review                3. Confirm           │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐     │
│  │              │         │              │         │              │     │
│  │  Agent Card  │ ──────▶ │  Permission  │ ──────▶ │  Biometric   │     │
│  │  "Analyze"   │         │    Review    │         │  Confirmation│     │
│  │              │         │              │         │              │     │
│  └──────────────┘         └──────────────┘         └──────────────┘     │
│                                                            │             │
│                                                            ▼             │
│  4. Processing             5. Success                                    │
│  ┌──────────────┐         ┌──────────────┐                              │
│  │              │         │              │                              │
│  │  Encrypting  │ ──────▶ │   Results    │                              │
│  │  & Granting  │         │   Display    │                              │
│  │              │         │              │                              │
│  └──────────────┘         └──────────────┘                              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Discovery

Show available agents as cards:

```
┌─────────────────────────────────────────┐
│  🏥 Health Analyzer                     │
│                                         │
│  Analyze your health data and get       │
│  personalized insights and trends.      │
│                                         │
│  ✅ Verified Agent                      │
│  🔒 Local AI (Ollama)                   │
│  📜 On-chain attestation                │
│                                         │
│  [Connect]                              │
└─────────────────────────────────────────┘
```

### Step 2: Permission Review

Clear, scannable permission list:

```
┌─────────────────────────────────────────┐
│  Review Access Request                  │
├─────────────────────────────────────────┤
│                                         │
│  Health Analyzer wants to:              │
│                                         │
│  📊 Read your step data                 │
│     • Daily step counts                 │
│     • Walking distance                  │
│                                         │
│  😴 Read your sleep data                │
│     • Sleep duration                    │
│     • Sleep quality                     │
│                                         │
│  ⏱️ Access expires: 1 hour             │
│                                         │
│  ⚠️ The agent will NOT be able to:     │
│     • Store your raw data               │
│     • Share with third parties          │
│     • Access other data types           │
│                                         │
│  [Cancel]              [Grant Access]   │
│                                         │
└─────────────────────────────────────────┘
```

### Step 3: Biometric Confirmation

For sensitive operations, require biometric:

```
┌─────────────────────────────────────────┐
│                                         │
│            🔐 Confirm Access            │
│                                         │
│        Use Face ID to grant             │
│        access to Health Analyzer        │
│                                         │
│              [Face ID]                  │
│                                         │
│         [Use PIN instead]               │
│                                         │
└─────────────────────────────────────────┘
```

### Step 4: Processing

Show progress with clear steps:

```
┌─────────────────────────────────────────┐
│                                         │
│          Preparing Analysis...          │
│                                         │
│  ✅ Encrypting data key                 │
│  ✅ Creating access token               │
│  ⏳ Sending to agent...                 │
│  ⬜ Waiting for results                 │
│                                         │
│           ████████░░ 70%                │
│                                         │
└─────────────────────────────────────────┘
```

### Step 5: Results Display

```
┌─────────────────────────────────────────┐
│  📊 Health Analysis Results             │
├─────────────────────────────────────────┤
│                                         │
│  Summary                                │
│  Your health metrics show positive      │
│  trends over the past 30 days.          │
│                                         │
│  📈 Trends                              │
│  ┌─────────────────────────────────┐   │
│  │ Steps    ↑ 15%   Great progress!│   │
│  │ Sleep    → 0%    Consistent     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  💡 Recommendations                     │
│  • Try to walk 10 min more daily        │
│  • Maintain your sleep schedule         │
│                                         │
│  ─────────────────────────────────────  │
│  🔗 Verified on-chain                   │
│     Block #24282779                     │
│     [View Proof]                        │
│                                         │
│                    [Done]               │
└─────────────────────────────────────────┘
```

---

## Mobile App Patterns

### Proofi Mobile Structure

```
proofi-mobile/
├── app/                    # Expo Router screens
│   ├── index.tsx          # Login screen
│   ├── pin.tsx            # PIN entry
│   └── (app)/             # Authenticated screens
│       ├── _layout.tsx    # Tab navigation
│       ├── wallet.tsx     # Wallet & balance
│       ├── vault.tsx      # Data vault
│       ├── scan.tsx       # QR scanner
│       └── game.tsx       # Gamification
├── src/
│   ├── components/        # Reusable UI
│   ├── screens/           # Screen components
│   ├── stores/            # Zustand stores
│   └── lib/               # Utilities
```

### State Management (Zustand)

```typescript
// stores/walletStore.ts
import { create } from 'zustand';

interface WalletState {
  address: string | null;
  balance: string | null;
  isUnlocked: boolean;
  
  connect: (address: string, seedHex?: string) => void;
  disconnect: () => void;
  fetchBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>()((set, get) => ({
  address: null,
  balance: null,
  isUnlocked: false,
  
  connect: (address, seedHex) => {
    set({
      address,
      isUnlocked: !!seedHex,
    });
    get().fetchBalance();
  },
  
  disconnect: () => {
    set({
      address: null,
      balance: null,
      isUnlocked: false,
    });
  },
  
  fetchBalance: async () => {
    const { address } = get();
    if (!address) return;
    
    // Fetch from RPC...
    set({ balance: '100.00 CERE' });
  },
}));
```

### Secure Storage

```typescript
// lib/crypto.ts
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha2';
import * as SecureStore from 'expo-secure-store';

// Derive seed from PIN (100k iterations)
export function deriveSeedFromPin(pin: string, salt: string): string {
  const derived = pbkdf2(sha256, pin, salt, { c: 100000, dkLen: 32 });
  return '0x' + Buffer.from(derived).toString('hex');
}

// Store encrypted seed
export async function storeEncryptedSeed(seed: string, pin: string) {
  const encrypted = await encryptSeed(seed, pin);
  await SecureStore.setItemAsync('proofi_seed', encrypted);
}
```

### PIN Entry Component

```typescript
// components/PinDots.tsx
import { View, StyleSheet } from 'react-native';

interface PinDotsProps {
  length: number;
  filled: number;
}

export function PinDots({ length, filled }: PinDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < filled && styles.dotFilled
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 24,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  dotFilled: {
    backgroundColor: '#6366F1',
  },
});
```

---

## Chrome Extension Patterns

### Extension Structure

```
proofi-chrome-extension/
├── src/
│   ├── manifest.json      # MV3 manifest
│   ├── popup.html         # Popup UI
│   ├── popup.js           # Popup logic
│   ├── background.js      # Service worker
│   ├── content.js         # Content script
│   ├── inject.js          # Page injection
│   └── lib/
│       ├── crypto.js      # Web Crypto API
│       ├── keyring.js     # Key management
│       ├── storage.js     # chrome.storage
│       └── api.js         # Backend calls
├── icons/
└── dist/                  # Built output
```

### Manifest V3

```json
{
  "manifest_version": 3,
  "name": "Proofi Wallet",
  "version": "1.0.0",
  "description": "Self-custodial data wallet",
  
  "permissions": [
    "storage",
    "activeTab"
  ],
  
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "128": "icons/icon128.png"
    }
  },
  
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  
  "content_scripts": [{
    "matches": ["*://proofi.ai/*", "*://localhost/*"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }]
}
```

### Content Script ↔ Page Communication

```javascript
// inject.js (injected into page)
window.proofi = {
  async requestAccess(scopes) {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).slice(2);
      
      window.addEventListener('proofi:response:' + id, (e) => {
        if (e.detail.error) reject(new Error(e.detail.error));
        else resolve(e.detail.token);
      }, { once: true });
      
      window.dispatchEvent(new CustomEvent('proofi:request', {
        detail: { id, scopes }
      }));
    });
  }
};

// content.js (bridge)
window.addEventListener('proofi:request', async (e) => {
  const { id, scopes } = e.detail;
  
  try {
    // Ask background script
    const token = await chrome.runtime.sendMessage({
      type: 'REQUEST_ACCESS',
      scopes
    });
    
    window.dispatchEvent(new CustomEvent('proofi:response:' + id, {
      detail: { token }
    }));
  } catch (error) {
    window.dispatchEvent(new CustomEvent('proofi:response:' + id, {
      detail: { error: error.message }
    }));
  }
});
```

### Popup UI

```html
<!-- popup.html -->
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="app">
    <!-- Locked state -->
    <div id="locked" class="screen">
      <img src="icons/logo.svg" alt="Proofi">
      <input type="password" id="pin" placeholder="Enter PIN">
      <button id="unlock">Unlock</button>
    </div>
    
    <!-- Unlocked state -->
    <div id="unlocked" class="screen hidden">
      <div class="header">
        <span class="address" id="address"></span>
        <span class="balance" id="balance"></span>
      </div>
      
      <div class="actions">
        <button id="store">Store Data</button>
        <button id="share">Share Access</button>
      </div>
      
      <button id="lock" class="secondary">Lock</button>
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

---

## Component Library

### Design Tokens

```css
:root {
  /* Colors */
  --primary: #6366F1;
  --primary-dark: #4F46E5;
  --secondary: #10B981;
  --error: #EF4444;
  --warning: #F59E0B;
  
  /* Background */
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --bg-card: #334155;
  
  /* Text */
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}
```

### Button Component

```typescript
// components/Button.tsx
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ 
  onPress, 
  title, 
  variant = 'primary',
  loading,
  disabled 
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        (loading || disabled) && styles.disabled
      ]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#6366F1',
  },
  secondary: {
    backgroundColor: '#1E293B',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#94A3B8',
  },
  outlineText: {
    color: '#6366F1',
  },
});
```

### Card Component

```typescript
// components/Card.tsx
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'highlighted';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[
      styles.card,
      variant === 'highlighted' && styles.highlighted,
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  highlighted: {
    borderWidth: 1,
    borderColor: '#6366F1',
  },
});
```

### Status Badge

```typescript
// components/StatusBadge.tsx
import { View, Text, StyleSheet } from 'react-native';

type Status = 'success' | 'warning' | 'error' | 'info';

interface StatusBadgeProps {
  status: Status;
  text: string;
}

export function StatusBadge({ status, text }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, styles[status]]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  success: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  warning: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  error: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  info: { backgroundColor: 'rgba(99, 102, 241, 0.2)' },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F8FAFC',
  },
});
```

---

## Error Handling

### Error Message Patterns

```
┌─────────────────────────────────────────┐
│  ⚠️ Connection Failed                   │
│                                         │
│  We couldn't connect to the agent.      │
│  This might be because:                 │
│                                         │
│  • The agent is offline                 │
│  • Your internet connection is slow     │
│  • The agent's address changed          │
│                                         │
│  [Try Again]    [Contact Support]       │
└─────────────────────────────────────────┘
```

### Error Types

```typescript
// Map errors to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  'Token has expired': 
    'Your access has expired. Please request new access.',
  
  'DEK unwrapping failed': 
    'There was a security mismatch. Please try again.',
  
  'Network request failed': 
    'Connection problem. Check your internet and try again.',
  
  'Insufficient balance': 
    'Your wallet needs more CERE to complete this action.',
};

function getUserMessage(error: Error): string {
  return ERROR_MESSAGES[error.message] || 
    'Something went wrong. Please try again.';
}
```

### Toast Notifications

```typescript
// lib/toast.ts
import Toast from 'react-native-toast-message';

export const toast = {
  success: (message: string) => {
    Toast.show({
      type: 'success',
      text1: message,
      visibilityTime: 3000,
    });
  },
  
  error: (message: string) => {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: message,
      visibilityTime: 5000,
    });
  },
  
  loading: (message: string) => {
    Toast.show({
      type: 'info',
      text1: message,
      autoHide: false,
    });
  },
};
```

---

## Accessibility

### Guidelines

1. **Sufficient contrast** - Text on background meets WCAG AA (4.5:1)
2. **Touch targets** - Minimum 44x44 points
3. **Screen reader support** - All elements have labels
4. **Focus indicators** - Visible focus states

### Implementation

```typescript
// Accessible button
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Grant access to Health Analyzer"
  accessibilityHint="Double tap to share your health data"
  accessibilityRole="button"
  onPress={handleGrant}
>
  <Text>Grant Access</Text>
</TouchableOpacity>

// Accessible status
<View
  accessible={true}
  accessibilityLabel={`Balance: ${balance}`}
  accessibilityRole="text"
>
  <Text>{balance}</Text>
</View>
```

### Color-Blind Friendly

Don't rely on color alone:

```
✅ Good: 🟢 Connected (green + icon + text)
❌ Bad:  🟢 (just green dot)
```

---

## Animation Guidelines

### Micro-interactions

- **Button press**: Scale down 0.98, 100ms
- **Toggle**: Spring animation, 200ms
- **Loading**: Subtle pulse or skeleton
- **Success**: Check mark with bounce

### React Native Reanimated

```typescript
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';

function AnimatedButton({ onPress, title }) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };
  
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
```

---

## Next Steps

- [Quickstart](./QUICKSTART.md) - Build your first agent
- [API Reference](./API-REFERENCE.md) - SDK documentation
- [Runbook](./RUNBOOK.md) - Deployment guide
- [Architecture](./ARCHITECTURE.md) - System design
