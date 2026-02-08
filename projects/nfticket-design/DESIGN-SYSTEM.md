# 🎫 NFTicket Design System
## Event Ticketing as Credentials

---

## 🎨 Brand Identity

### Tagline
**"Your Pass to the Moment"**

### Brand Personality
- **Electric** - Energetic, alive, buzzing with anticipation
- **Exclusive** - VIP access, credential-based entry
- **Ephemeral** - Capturing moments, FOMO-driven
- **Trustworthy** - Blockchain-verified, impossible to fake

---

## 🌈 Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Electric Purple** | `#8B5CF6` | Primary brand, CTAs, active states |
| **Sunset Orange** | `#F97316` | Accents, urgency, countdowns |
| **Hot Pink** | `#EC4899` | Highlights, VIP badges |

### Secondary Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Deep Violet** | `#4C1D95` | Dark backgrounds, cards |
| **Midnight Black** | `#0F0D15` | Primary background |
| **Neon Cyan** | `#06B6D4` | Success states, verified badges |

### Gradients
```css
/* Primary Gradient - Festival Vibes */
background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%);

/* Dark Card Gradient */
background: linear-gradient(180deg, #1E1B2E 0%, #0F0D15 100%);

/* Holographic Shimmer (for tickets) */
background: linear-gradient(45deg, 
  #8B5CF6 0%, 
  #06B6D4 25%, 
  #EC4899 50%, 
  #F97316 75%, 
  #8B5CF6 100%
);
```

---

## 📝 Typography

### Font Stack
```css
/* Headings - Bold, Impactful */
font-family: 'Space Grotesk', 'Inter', sans-serif;
font-weight: 700;

/* Body - Clean, Readable */
font-family: 'Inter', system-ui, sans-serif;
font-weight: 400;

/* Mono - Codes, Credentials */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale
| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 48px | 700 | Event titles |
| H2 | 32px | 700 | Section headers |
| H3 | 24px | 600 | Card titles |
| Body | 16px | 400 | General text |
| Caption | 14px | 500 | Metadata, dates |
| Mono | 12px | 400 | Ticket codes, IDs |

---

## 🎫 Ticket UI Components

### Digital Ticket Card
```
┌─────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← Holographic header bar
│                                         │
│   🎵 TOMORROWLAND 2024                 │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                         │
│   📅 July 19-21, 2024                  │
│   📍 Boom, Belgium                     │
│   👤 General Admission                  │
│                                         │
│   ┌─────────┐                          │
│   │ ▓▓▓▓▓▓▓ │  Ticket #NFT-7892        │
│   │ ▓ QR  ▓ │  ━━━━━━━━━━━━━━━         │
│   │ ▓▓▓▓▓▓▓ │  Verified ✓ On-chain     │
│   └─────────┘                          │
│                                         │
│  ════════════════════════════════════  │ ← Perforated tear line
│   🔗 0x7a3b...4f2d  │  🎭 VIP Pass     │
└─────────────────────────────────────────┘
```

### Countdown Timer
```
┌──────────────────────────────────────┐
│        ⚡ DOORS OPEN IN ⚡           │
│                                      │
│   ┌────┐  ┌────┐  ┌────┐  ┌────┐   │
│   │ 02 │  │ 14 │  │ 37 │  │ 52 │   │
│   │DAYS│  │HRS │  │MIN │  │SEC │   │
│   └────┘  └────┘  └────┘  └────┘   │
│                                      │
│        [  SCAN TO ENTER  ]          │
└──────────────────────────────────────┘
```

### Event Card
```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← Event image
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
├─────────────────────────────────────┤
│  🔥 SELLING FAST                    │
│                                     │
│  Coldplay: Music of the Spheres     │
│  📅 Aug 15  •  📍 Johan Cruijff ArenA│
│                                     │
│  💰 From €89      [GET TICKETS →]   │
└─────────────────────────────────────┘
```

---

## 🎯 UI Elements

### Buttons
```css
/* Primary CTA */
.btn-primary {
  background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
  border-radius: 12px;
  padding: 16px 32px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 4px 24px rgba(139, 92, 246, 0.4);
}

/* Secondary */
.btn-secondary {
  background: transparent;
  border: 2px solid #8B5CF6;
  color: #8B5CF6;
}

/* Urgency/FOMO */
.btn-urgency {
  background: #F97316;
  animation: pulse 2s infinite;
}
```

### Badges
- **🟣 VIP** - Purple gradient background
- **🟠 Selling Fast** - Orange pulsing badge
- **🟢 Verified** - Cyan with checkmark
- **⚪ Resale** - White outline, secondary

### Icons
Use **Phosphor Icons** (bold weight) for consistency:
- 🎫 `ticket` - Tickets
- 🎵 `music-notes` - Music events
- 🏟️ `stadium` - Venues
- ⚡ `lightning` - Live/urgent
- 🔗 `link-simple` - Blockchain verified
- 📱 `qr-code` - Scan entry

---

## 🌌 Visual Effects

### Glassmorphism Cards
```css
.glass-card {
  background: rgba(30, 27, 46, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 24px;
}
```

### Holographic Ticket Effect
```css
.ticket-holographic {
  background: linear-gradient(
    45deg,
    #8B5CF6 0%,
    #06B6D4 20%,
    #EC4899 40%,
    #F97316 60%,
    #8B5CF6 80%,
    #06B6D4 100%
  );
  background-size: 200% 200%;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

### Glow Effects
```css
.neon-glow {
  box-shadow: 
    0 0 20px rgba(139, 92, 246, 0.5),
    0 0 40px rgba(236, 72, 153, 0.3),
    0 0 60px rgba(249, 115, 22, 0.2);
}
```

---

## 📱 Mobile-First Layouts

### Ticket Wallet View
- Full-width ticket cards
- Swipe navigation between tickets
- Pull-to-refresh for sync
- Floating "Scan" FAB button

### Event Discovery
- Infinite scroll feed
- Sticky category filters
- Large hero banners
- Quick-buy overlays

### QR Scanner
- Full-screen camera view
- Haptic feedback on scan
- Success animation (confetti burst)
- Instant credential verification

---

## 🎪 FOMO Elements

### Scarcity Indicators
- "Only 23 tickets left!"
- "142 people viewing now"
- "Last ticket sold 2 min ago"
- Progress bar showing % sold

### Social Proof
- "Sarah + 12 friends going"
- Attendee avatars stack
- Live purchase notifications
- Celebrity/influencer badges

### Urgency Timers
- Early bird countdown
- Price increase timer
- Door opening countdown
- Last chance alerts

---

## 📋 Component Library Preview

| Component | Status | Notes |
|-----------|--------|-------|
| TicketCard | ✅ | Holographic effect ready |
| EventCard | ✅ | With FOMO badges |
| CountdownTimer | ✅ | Flip animation |
| QRScanner | ✅ | Camera integration |
| WalletView | ✅ | Swipe navigation |
| Button (all variants) | ✅ | With ripple effects |
| Badge system | ✅ | VIP, Verified, Urgent |
| Navigation | ✅ | Bottom bar + gestures |

---

## 🚀 Implementation Notes

### Tech Stack Recommendation
- **Framework**: React Native / Flutter for cross-platform
- **Styling**: Tailwind CSS with custom config
- **Animations**: Framer Motion / Reanimated
- **Icons**: Phosphor Icons
- **Fonts**: Google Fonts (Space Grotesk, Inter, JetBrains Mono)

### Accessibility
- All colors meet WCAG AA contrast
- QR codes have text alternatives
- Haptic feedback for interactions
- Voice-over compatible labels

---

*Design System v1.0 | NFTicket*
*"Your Pass to the Moment"*
