# Proofi Mobile — Developer Guide

> Privacy-preserving health data wallet for iOS and Android

## Quick Start

```bash
# Clone and install
cd proofi-mobile
npm install

# Start development
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

## Project Structure

```
proofi-mobile/
├── app/                    # Expo Router screens
│   ├── (app)/             # Main app tabs (authenticated)
│   │   ├── _layout.tsx    # Tab navigation
│   │   ├── wallet.tsx     # Wallet screen
│   │   ├── proofi.tsx     # Health data management
│   │   ├── vault.tsx      # DDC storage
│   │   ├── scan.tsx       # QR scanner
│   │   └── game.tsx       # Demo game
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Login redirect
│   └── pin.tsx            # PIN entry
│
├── src/
│   ├── screens/           # Screen components
│   │   ├── WalletScreen.tsx
│   │   ├── ProofiScreen.tsx          # NEW: Main Proofi hub
│   │   ├── HealthScopesScreen.tsx    # NEW: Data scope selection
│   │   ├── CapabilityTokensScreen.tsx # NEW: Token management
│   │   ├── AuditChainScreen.tsx      # NEW: Audit visualization
│   │   ├── DataVaultScreen.tsx
│   │   ├── QRScannerScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   └── PinScreen.tsx
│   │
│   ├── components/        # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ErrorBox.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── OtpInput.tsx
│   │   ├── PinDots.tsx
│   │   └── StatusBadge.tsx
│   │
│   ├── stores/            # Zustand state stores
│   │   ├── authStore.ts   # Auth state (email, token)
│   │   ├── walletStore.ts # Wallet state (address, balance)
│   │   └── requestStore.ts # Pending requests
│   │
│   ├── lib/               # Utilities
│   │   ├── api.ts         # Backend API client
│   │   ├── cere.ts        # CERE chain interactions
│   │   ├── crypto.ts      # Cryptographic functions
│   │   └── notifications.ts
│   │
│   └── constants/
│       ├── api.ts         # API endpoints
│       └── theme.ts       # Design system
│
└── assets/                # Images and fonts
```

## Feature Alignment

The mobile app is aligned with the **web extension** and **CLI**:

| Feature | Mobile | Extension | CLI |
|---------|--------|-----------|-----|
| Wallet (CERE) | ✅ | ✅ | ✅ |
| Data Scopes | ✅ | ✅ | ✅ |
| Capability Tokens | ✅ | ✅ | ✅ |
| Audit Chain | ✅ | ✅ | ✅ |
| DDC Storage | ✅ | ✅ | — |
| Health Analysis | — | — | ✅ |

### Data Scopes

Users select which health data categories to share:

```typescript
// From HealthScopesScreen.tsx
const SCOPES = [
  { id: 'steps', path: 'health/steps/*' },
  { id: 'heartRate', path: 'health/heartRate/*' },
  { id: 'hrv', path: 'health/hrv/*' },
  { id: 'sleep', path: 'health/sleep/*' },
  { id: 'spo2', path: 'health/spo2/*' },
  { id: 'workouts', path: 'health/workouts/*' },
];
```

### Capability Tokens

Tokens grant time-limited access to AI agents:

```typescript
interface CapabilityToken {
  id: string;
  agentId: string;
  agentName: string;
  scopes: string[];      // Enabled scope paths
  issuedAt: number;
  expiresAt: number;     // Auto-expire
  status: 'active' | 'expired' | 'revoked';
}
```

### Audit Chain

Every access is logged and cryptographically linked:

```typescript
interface AuditEntry {
  id: string;
  action: 'CONSENT_GRANTED' | 'TOKEN_CREATED' | 'DATA_ACCESSED' | ...;
  timestamp: number;
  hash: string;          // SHA-256
  prevHash: string;      // Links to previous
  details: Record<string, any>;
}
```

## Design System

The app follows a **brutalist dark theme**:

- **Background**: Pure black (#000000)
- **Accent**: Cyan (#00E5FF) for primary actions
- **Success**: Green (#00FF88)
- **Warning**: Amber (#FFB800)
- **Error**: Magenta (#FF3366)
- **Typography**: Monospace (Menlo/system mono)
- **Borders**: No border-radius — sharp edges

```typescript
import { Colors, Fonts, Spacing } from '../constants/theme';

// Example usage
<View style={{
  backgroundColor: Colors.surface,
  borderWidth: 2,
  borderColor: Colors.cyanAlpha(0.3),
  padding: Spacing.lg,
}}>
  <Text style={{
    fontFamily: Fonts.display,
    color: Colors.white,
  }}>
    PROOFI
  </Text>
</View>
```

## State Management

Using **Zustand** for simple, performant state:

```typescript
// Wallet store example
import { useWalletStore } from '../stores/walletStore';

function MyComponent() {
  const { address, balance, fetchBalance } = useWalletStore();
  
  return (
    <Text>{balance}</Text>
  );
}
```

## API Integration

Backend endpoints (configurable in `constants/api.ts`):

```typescript
const API_URL = 'https://proofi.tech/api';

// DDC endpoints
POST /ddc/memo        // Store memo
POST /ddc/credential  // Issue credential
GET  /ddc/list        // List stored items
GET  /ddc/status      // DDC connection status

// Auth endpoints
POST /auth/otp        // Send OTP
POST /auth/verify     // Verify OTP
POST /auth/register   // Register wallet address

// Balance
GET  /balance/:address
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- __tests__/HealthScopesScreen.test.tsx

# Run with coverage
npm test -- --coverage
```

### Test Structure

Tests are located in `__tests__/` and cover:

- **Screen tests**: UI rendering and interactions
  - `HealthScopesScreen.test.tsx` - Health data scope selection
  - `CapabilityTokensScreen.test.tsx` - Agent access tokens
  - `AuditChainScreen.test.tsx` - Audit log visualization
  - `ProofiScreen.test.tsx` - Main Proofi hub
- **Store tests**: State management
  - `walletStore.test.ts` - Wallet connection and balance
- **Crypto tests**: Security utilities
  - `crypto.test.ts` - AES-GCM encryption, key derivation

### Test Dependencies

- **Jest** - Test runner
- **jest-expo** - Expo-specific test preset
- **@testing-library/react-native** - React Native testing utilities

## Building for Production

```bash
# EAS Build (recommended)
npx eas build --platform ios
npx eas build --platform android

# Local build
npx expo run:ios --configuration Release
npx expo run:android --variant release
```

## Environment Variables

Create `.env` for local development:

```env
EXPO_PUBLIC_API_URL=https://proofi.tech/api
EXPO_PUBLIC_CERE_RPC=https://archive.mainnet.cere.network
```

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes with tests
3. Run linter: `npm run lint`
4. Submit PR

## Architecture Notes

### Why Local-First?

- Health data never leaves the device
- AI analysis runs locally (via Ollama on desktop, future mobile ML)
- Only cryptographic proofs stored on-chain

### Cryptography

The app uses industry-standard cryptography via `@noble/hashes` and `@noble/ciphers`:

**Key Derivation:**
- PBKDF2-HMAC-SHA256 with 100,000 iterations
- Matches web wallet implementation exactly
- 32-byte keys derived from PIN + salt

**Seed Encryption:**
- AES-256-GCM for authenticated encryption
- Random 16-byte salt per encryption
- Random 12-byte IV (nonce) per encryption
- Automatic authentication tag verification
- Format: `base64(salt || iv || ciphertext || authTag)`

```typescript
import { encryptSeed, decryptSeed, verifyPin } from './src/lib/crypto';

// Encrypt seed with PIN
const encrypted = await encryptSeed(seedHex, pin);

// Decrypt seed with PIN (throws if wrong PIN)
const decrypted = await decryptSeed(encrypted, pin);

// Verify PIN without decrypting
const isValid = await verifyPin(encrypted, pin);
```

### Capability Token Model

Based on UCAN (User Controlled Authorization Networks):

1. User enables specific scopes
2. Token issued with scopes + expiry
3. Agent presents token for access
4. All access logged to audit chain
5. Token auto-expires or manual revoke

### CERE Integration

- **Wallet**: sr25519 keypairs derived from PIN
- **Balance**: Fetched via HTTP RPC (no WebSocket needed)
- **DDC**: Decentralized Data Cloud for storage
- **Tokens**: CERE tokens for future data marketplace

## Troubleshooting

### "Camera not working"

Ensure camera permissions in `app.json`:

```json
{
  "expo": {
    "plugins": [
      ["expo-camera", { "cameraPermission": "..." }]
    ]
  }
}
```

### "Balance shows 0"

Check RPC connectivity:

```typescript
// In walletStore.ts
const RPC_ENDPOINTS = [
  'https://archive.mainnet.cere.network',
  'https://rpc.mainnet.cere.network',
];
```

### "Fonts not loading"

Fonts are system defaults (Menlo/monospace). Custom fonts require bundling:

```bash
npx expo install expo-font
```

---

Built with ❤️ for privacy. Questions? Check `/proofi` or `/proofi-chrome-extension`.
