# TokenGate — Visual Identity System
## *Exclusive Access. Verified Ownership.*

---

## 🎨 Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Obsidian Black** | `#0A0A0B` | Primary background |
| **Champagne Gold** | `#D4AF37` | Accent, CTAs, verified badges |
| **Platinum Silver** | `#E5E4E2` | Secondary text, borders |
| **Deep Amethyst** | `#2D1B4E` | Gradient overlays, premium cards |

### Supporting Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Velvet Purple** | `#4A1C6B` | Hover states, active elements |
| **Midnight Blue** | `#0D1B2A` | Card backgrounds |
| **Success Emerald** | `#2ECC71` | Wallet connected, access granted |
| **Error Ruby** | `#E74C3C` | Errors, access denied |

### Gradients
```css
/* Hero Gradient */
background: linear-gradient(135deg, #0A0A0B 0%, #2D1B4E 50%, #0A0A0B 100%);

/* Gold Shimmer (for premium elements) */
background: linear-gradient(90deg, #D4AF37 0%, #F5E6A3 50%, #D4AF37 100%);

/* Access Gate Glow */
box-shadow: 0 0 60px rgba(212, 175, 55, 0.3);
```

---

## ✨ Typography

### Font Stack
```css
/* Headlines - Luxurious, commanding */
font-family: 'Playfair Display', 'Cormorant Garamond', serif;

/* Body - Clean, modern */
font-family: 'Inter', 'SF Pro Display', -apple-system, sans-serif;

/* Mono - Wallet addresses, codes */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale
| Element | Size | Weight | Letter-spacing |
|---------|------|--------|----------------|
| Hero Title | 72px | 700 | -0.02em |
| Section Header | 48px | 600 | -0.01em |
| Card Title | 24px | 600 | 0 |
| Body | 16px | 400 | 0.01em |
| Caption | 14px | 500 | 0.02em |
| Wallet Address | 14px | 400 | 0.05em |

---

## 🚪 Access UI Components

### The Gate (Primary Access Check)
```
┌─────────────────────────────────────────┐
│                                         │
│     ═══════════════════════════         │
│            🔐 TokenGate                 │
│     ═══════════════════════════         │
│                                         │
│      ╔═══════════════════════╗          │
│      ║                       ║          │
│      ║   Connect Wallet to   ║          │
│      ║   Verify Ownership    ║          │
│      ║                       ║          │
│      ║   [ 🦊 MetaMask ]     ║          │
│      ║   [ 🌈 Rainbow  ]     ║          │
│      ║   [ 👻 Phantom  ]     ║          │
│      ║                       ║          │
│      ╚═══════════════════════╝          │
│                                         │
│          Holding: 0 / 1 required        │
└─────────────────────────────────────────┘
```

### Access States

**🔒 Locked State**
- Muted colors, slight blur on content
- Velvet rope animation (subtle sway)
- Gold keyhole icon pulsing

**🔓 Unlocking Animation**
- Gate doors slide open (left/right)
- Golden particles burst
- Content fades in with scale-up

**✅ Verified Badge**
```css
.verified-badge {
  background: linear-gradient(135deg, #D4AF37, #F5E6A3);
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
}
```

---

## 🎭 Iconography

### Custom Icon Set
- **Gate** — Ornate double doors with golden handles
- **Key** — Antique skeleton key with blockchain pattern
- **Lock** — Padlock with token symbol
- **Crown** — For top-tier access levels
- **Velvet Rope** — Classic stanchion design
- **Wallet** — Sleek billfold with glow effect

### Icon Style
- Stroke weight: 1.5px
- Corners: Slightly rounded (2px)
- Color: Gold (#D4AF37) or Platinum (#E5E4E2)
- Hover: Subtle glow + scale 1.05

---

## 💳 Card Designs

### NFT/Token Requirement Card
```
╔══════════════════════════════════════╗
║  ┌────────────────────────────────┐  ║
║  │                                │  ║
║  │      [NFT Collection Image]    │  ║
║  │                                │  ║
║  └────────────────────────────────┘  ║
║                                      ║
║  BORED APE YACHT CLUB               ║
║  ─────────────────────              ║
║  Required: 1 token                  ║
║  Floor: 28.5 ETH                    ║
║                                      ║
║  ┌──────────────────────────────┐   ║
║  │  ✓ Ownership Verified        │   ║
║  └──────────────────────────────┘   ║
╚══════════════════════════════════════╝
```

### Access Tier Cards
```
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │   BRONZE    │  │   SILVER    │  │    GOLD     │
   │     🥉      │  │     🥈      │  │     🥇      │
   │             │  │             │  │             │
   │  1 Token    │  │  5 Tokens   │  │  10 Tokens  │
   │  Basic      │  │  Premium    │  │  VIP        │
   │  Content    │  │  Content    │  │  All Access │
   └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 🎬 Animations & Micro-interactions

### Gate Opening Sequence
```css
@keyframes gateOpen {
  0% { transform: scaleX(1); opacity: 1; }
  50% { transform: scaleX(0.95); }
  100% { transform: scaleX(0); opacity: 0; }
}
```

### Gold Shimmer Effect
```css
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.gold-shimmer {
  background: linear-gradient(
    90deg,
    #D4AF37 0%,
    #F5E6A3 25%,
    #D4AF37 50%,
    #F5E6A3 75%,
    #D4AF37 100%
  );
  background-size: 200% auto;
  animation: shimmer 3s linear infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Velvet Rope Sway
```css
@keyframes ropeWave {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}
```

---

## 📐 Layout Guidelines

### Spacing Scale
```
4px  — micro
8px  — tight
16px — default
24px — comfortable
32px — spacious
48px — section gap
64px — major section
```

### Border Radius
- Buttons: 8px
- Cards: 16px
- Modals: 24px
- Avatars: 50%

### Shadows
```css
/* Subtle elevation */
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

/* Premium glow */
box-shadow: 0 0 40px rgba(212, 175, 55, 0.2);

/* Deep shadow for modals */
box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
```

---

## 🎯 UI Patterns

### Connect Wallet Button
```css
.connect-btn {
  background: linear-gradient(135deg, #D4AF37, #B8860B);
  color: #0A0A0B;
  font-weight: 600;
  padding: 16px 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.connect-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(212, 175, 55, 0.4);
}
```

### Access Denied Toast
```
┌────────────────────────────────────┐
│  🚫  Access Denied                 │
│  ───────────────────────────────   │
│  You need to hold 1 token from     │
│  the required collection.          │
│                                    │
│  [ View Collection ] [ Dismiss ]   │
└────────────────────────────────────┘
```

### Verified Owner Badge
```
┌──────────────────┐
│  ✓ Verified      │
│    Holder        │
└──────────────────┘
```

---

## 🌟 Brand Voice

### Taglines
- "Exclusive Access. Verified Ownership."
- "Your Wallet is Your Key"
- "The Velvet Rope of Web3"
- "Proof of Holding. Portal to Privilege."

### Tone
- **Confident** — Not arrogant, but assured
- **Exclusive** — Premium, not pretentious
- **Modern** — Web3-native, tech-savvy
- **Elegant** — Refined aesthetics

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1025px) { }

/* Large screens */
@media (min-width: 1440px) { }
```

---

## 🔗 References & Inspiration

- **Velvet rope aesthetics** — Nightclub exclusivity
- **Luxury brand minimalism** — Chanel, Cartier
- **Web3 dark modes** — OpenSea, Blur, Foundation
- **Gate/portal imagery** — Ancient architecture meets digital

---

*TokenGate Design System v1.0*
*Created for exclusive, wallet-gated experiences*
