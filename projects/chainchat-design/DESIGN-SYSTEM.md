# ChainChat Design System
## Verified Wallet-to-Wallet Messaging

---

## 🎨 Brand Identity

### Concept
ChainChat combineert de betrouwbaarheid van blockchain verificatie met de warmte van menselijke communicatie. Het design balanceert **tech credibility** met **friendly approachability**.

### Tagline
*"Verified conversations. Real connections."*

---

## 🌈 Color Palette

### Primary Gradient
```css
--gradient-primary: linear-gradient(135deg, #00D9FF 0%, #00B4A0 50%, #00E5A0 100%);
```
- **Cyan Spark** `#00D9FF` - Trust, technology, clarity
- **Teal Bridge** `#00B4A0` - Connection, balance
- **Mint Fresh** `#00E5A0` - Growth, authenticity

### Accent Colors
```css
--coral-verified: #FF6B6B;      /* Verified badge glow */
--coral-light: #FFB4A2;         /* Soft highlights */
--gold-premium: #FFD93D;        /* Premium/Pro features */
```

### Neutral Palette
```css
--dark-bg: #0D1117;             /* Deep space background */
--card-bg: #161B22;             /* Card surfaces */
--surface: #21262D;             /* Elevated surfaces */
--border: #30363D;              /* Subtle borders */
--text-primary: #F0F6FC;        /* Primary text */
--text-secondary: #8B949E;      /* Secondary text */
--text-muted: #6E7681;          /* Muted text */
```

### Light Mode Alternative
```css
--light-bg: #F6F8FA;
--light-surface: #FFFFFF;
--light-text: #1F2328;
```

---

## ✍️ Typography

### Font Stack
```css
--font-display: 'Plus Jakarta Sans', sans-serif;  /* Headers */
--font-body: 'Inter', sans-serif;                  /* Body text */
--font-mono: 'JetBrains Mono', monospace;          /* Wallet addresses */
```

### Scale
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 Hero | 48px | 800 | 1.1 |
| H2 Section | 32px | 700 | 1.2 |
| H3 Card | 20px | 600 | 1.3 |
| Body | 16px | 400 | 1.5 |
| Small | 14px | 400 | 1.4 |
| Caption | 12px | 500 | 1.3 |
| Wallet Address | 14px | 500 (mono) | 1.2 |

---

## 💬 Chat UI Components

### Message Bubbles
```css
/* Sent messages */
.bubble-sent {
  background: linear-gradient(135deg, #00B4A0, #00E5A0);
  border-radius: 20px 20px 4px 20px;
  color: #0D1117;
  padding: 12px 16px;
  max-width: 75%;
}

/* Received messages */
.bubble-received {
  background: #21262D;
  border-radius: 20px 20px 20px 4px;
  color: #F0F6FC;
  border: 1px solid #30363D;
}
```

### Typing Indicator
```
┌─────────────────┐
│  ●  ●  ●        │  ← Animated bounce (0.3s stagger)
│  "0x42...typing"│  ← Truncated address
└─────────────────┘
```

### Verified Badge
```css
.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 107, 107, 0.15);
  border: 1px solid #FF6B6B;
  border-radius: 100px;
  padding: 4px 10px;
  font-size: 12px;
  color: #FF6B6B;
}

.verified-badge::before {
  content: "✓";
  font-weight: bold;
}
```

### Wallet Identity Card
```
┌────────────────────────────────────────────┐
│  ┌────┐                                    │
│  │ 🦊 │  vitalik.eth           ✓ Verified  │
│  └────┘  0x42d3...8f2a                     │
│          ───────────────────               │
│          Last active: 2 min ago            │
└────────────────────────────────────────────┘
```

---

## 🔘 Buttons & Actions

### Primary Button
```css
.btn-primary {
  background: linear-gradient(135deg, #00D9FF, #00E5A0);
  color: #0D1117;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 217, 255, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(0, 217, 255, 0.4);
}
```

### Connect Wallet Button
```css
.btn-connect {
  background: #21262D;
  border: 1px solid #00D9FF;
  color: #00D9FF;
  display: flex;
  align-items: center;
  gap: 8px;
}
```

---

## 📱 Layout & Spacing

### Spacing Scale
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
```

### Border Radius
```css
--radius-sm: 8px;     /* Small elements */
--radius-md: 12px;    /* Cards, buttons */
--radius-lg: 20px;    /* Message bubbles */
--radius-xl: 24px;    /* Modal containers */
--radius-full: 9999px; /* Pills, avatars */
```

### Shadows
```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
--shadow-md: 0 4px 20px rgba(0, 0, 0, 0.3);
--shadow-glow-cyan: 0 0 30px rgba(0, 217, 255, 0.2);
--shadow-glow-coral: 0 0 20px rgba(255, 107, 107, 0.3);
```

---

## 🎭 Iconography

### Style
- **Stroke weight:** 1.5px
- **Size:** 20x20px (default), 24x24px (action)
- **Style:** Rounded, friendly, consistent

### Core Icons
| Icon | Usage |
|------|-------|
| 💬 | New chat |
| ✓✓ | Message read |
| 🔗 | Wallet connected |
| ✓ | Verified identity |
| 🔒 | Encrypted |
| ⚡ | Fast transaction |
| 👛 | Wallet |
| 🔔 | Notifications |

---

## ✨ Animations & Micro-interactions

### Message Send
```css
@keyframes messageSend {
  0% { transform: scale(0.8) translateY(20px); opacity: 0; }
  60% { transform: scale(1.02); }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
```

### Verified Badge Pulse
```css
@keyframes verifiedPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(255, 107, 107, 0); }
}
```

### Typing Dots
```css
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}
```

---

## 📐 Key Screens

### 1. Landing Page
```
┌─────────────────────────────────────────────────────────────┐
│  🔗 ChainChat                      [Connect Wallet]         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│          ┌───────────────────────────────────┐              │
│          │     ✨ Floating chat bubbles ✨    │              │
│          │        with gradient glow         │              │
│          └───────────────────────────────────┘              │
│                                                             │
│        Verified Wallet-to-Wallet Messaging                  │
│        ─────────────────────────────────────                │
│        Chat with confidence. Every message is               │
│        cryptographically signed by verified wallets.        │
│                                                             │
│              [ 🦊 Connect with MetaMask ]                   │
│              [ 🌈 Connect with Rainbow  ]                   │
│              [ 👛 More wallets...       ]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Chat Interface
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back    vitalik.eth ✓               🔒 Encrypted         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐                                   │
│  │ Hey! Saw your ENS    │                                   │
│  │ domain. Nice work! 🎨│                                   │
│  └──────────────────────┘                     10:42 AM ✓✓   │
│                                                             │
│                        ┌───────────────────────────────────┐│
│                        │Thanks! Been working on it. Want   ││
│                        │to collab on something?            ││
│                        └───────────────────────────────────┘│
│                                                   10:43 AM  │
│                                                             │
│  ┌────────────────────┐                                     │
│  │  ●  ●  ●           │                                     │
│  │  typing...         │                                     │
│  └────────────────────┘                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [+]  Type a message...                           [Send ➤]  │
└─────────────────────────────────────────────────────────────┘
```

### 3. Contact List
```
┌─────────────────────────────────────────────────────────────┐
│  🔗 ChainChat                      [🔔] [⚙️]                │
├─────────────────────────────────────────────────────────────┤
│  🔍 Search by ENS or address...                             │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🟢 vitalik.eth          ✓    "Thanks! Let's..."  2m   │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ ⚪ punk6529.eth         ✓    "Check this NFT"    1h   │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ 🟢 0x42d3...8f2a        ✓    "Tx confirmed ✓"    3h   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│                    [ + New Chat ]                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Trust Indicators

### Verification Levels
| Level | Badge | Meaning |
|-------|-------|---------|
| Basic | 🔵 | Wallet connected |
| Verified | ✓ (coral) | ENS/Lens verified |
| Premium | ⭐ | Long-standing reputation |
| Official | 🔷 | Official project account |

### Security Footer
```css
.security-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
}

/* "🔒 End-to-end encrypted • Signed by 0x42d3...8f2a" */
```

---

## 📋 Implementation Notes

### Tech Stack Recommendation
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + CSS Variables
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Fonts:** Google Fonts (Plus Jakarta Sans, Inter)
- **Web3:** wagmi + viem + RainbowKit

### Accessibility
- Minimum contrast ratio: 4.5:1
- Focus indicators on all interactive elements
- Screen reader announcements for message states
- Reduced motion support

---

## 🎯 Design Principles

1. **Trust through Transparency** - Every verified element is clearly marked
2. **Friendly Tech** - Complex Web3 concepts made approachable
3. **Communication First** - Chat UX prioritized over crypto complexity
4. **Progressive Disclosure** - Advanced features revealed when needed
5. **Delightful Details** - Micro-animations that spark joy

---

*Created for ChainChat by Design Agent*
*Last updated: 2025*
