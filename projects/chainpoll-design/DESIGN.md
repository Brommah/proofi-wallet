# ChainPoll - Visual Identity Design

## 🗳️ Brand Concept
**Tagline:** "Your Vote, Verified on Chain"

ChainPoll combines the gravitas of democratic institutions with the transparency of blockchain technology. The design evokes trust, authority, and civic responsibility.

---

## 🎨 Color Palette

### Primary Colors
| Color | Hex | Usage |
|-------|-----|-------|
| **Navy Blue** | `#1B2A4E` | Primary backgrounds, headers, trust |
| **Pure White** | `#FFFFFF` | Cards, content areas, clarity |
| **Civic Red** | `#C41E3A` | CTAs, alerts, important actions |

### Secondary Colors
| Color | Hex | Usage |
|-------|-----|-------|
| **Slate Gray** | `#64748B` | Body text, secondary elements |
| **Light Gray** | `#F1F5F9` | Backgrounds, disabled states |
| **Success Green** | `#059669` | Confirmed votes, success states |
| **Gold Accent** | `#D4AF37` | Verified badges, premium features |

### Blockchain Accent
| Color | Hex | Usage |
|-------|-----|-------|
| **Chain Blue** | `#3B82F6` | Links, blockchain indicators |
| **Hash Purple** | `#7C3AED` | Transaction hashes, tech elements |

---

## 📝 Typography

### Font Stack
```css
--font-heading: 'Libre Baskerville', Georgia, serif;
--font-body: 'Inter', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Type Scale
| Element | Size | Weight | Font |
|---------|------|--------|------|
| H1 (Page Title) | 48px | 700 | Libre Baskerville |
| H2 (Section) | 32px | 600 | Libre Baskerville |
| H3 (Card Title) | 24px | 600 | Inter |
| Body | 16px | 400 | Inter |
| Caption | 14px | 400 | Inter |
| Hash/Address | 14px | 500 | JetBrains Mono |

### Rationale
- **Libre Baskerville:** Evokes official documents, newspapers of record, institutional authority
- **Inter:** Modern, highly legible, professional for UI
- **JetBrains Mono:** Perfect for blockchain addresses and transaction hashes

---

## 🧩 UI Components

### 1. Ballot Card
```
┌─────────────────────────────────────┐
│  ☐  Option A                        │
│     "Proposal for Community Fund"   │
├─────────────────────────────────────┤
│  ☐  Option B                        │
│     "Alternative Allocation"        │
├─────────────────────────────────────┤
│  ☐  Abstain                         │
└─────────────────────────────────────┘
     [ Cast Your Vote ]  (Civic Red)
```
- Navy border, white background
- Checkboxes with smooth transitions
- Hover state: subtle navy highlight

### 2. Results Visualization
```
        RESULTS
    ┌─────────────┐
    │    62%      │  ← Option A (Navy)
    │  ████████   │
    │    31%      │  ← Option B (Slate)
    │  ████       │
    │     7%      │  ← Abstain (Light)
    │  █          │
    └─────────────┘
    
    Donut Chart Alternative:
         ╭───────╮
        ╱  62%    ╲
       │   ●───    │
        ╲   31%   ╱
         ╰───────╯
```

### 3. Blockchain Verification Badge
```
┌────────────────────────────────────────┐
│ ✓ VERIFIED ON CHAIN                    │
│ ─────────────────────                  │
│ Tx: 0x7a3f...8b2c                      │
│ Block: #18,234,567                     │
│ ⏱️ 2 min ago                           │
└────────────────────────────────────────┘
```
- Gold border for verified status
- Monospace for hashes
- Subtle chain-link icon

### 4. Navigation Bar
```
┌──────────────────────────────────────────────────┐
│ ⬡ ChainPoll    Polls  Results  Create   [Wallet]│
└──────────────────────────────────────────────────┘
```
- Navy background
- White text
- Hexagon logo (blockchain reference)

---

## 🖼️ Iconography

### Style
- **Stroke weight:** 2px
- **Style:** Outlined, geometric
- **Corners:** Slightly rounded (2px radius)

### Key Icons
| Icon | Meaning |
|------|---------|
| 🗳️ | Cast vote |
| ⬡ | Blockchain/decentralized |
| ✓ | Verified/confirmed |
| 📊 | Results/analytics |
| 🔗 | On-chain transaction |
| 👥 | Participants/voters |
| ⏱️ | Time remaining |
| 🔒 | Secure/private |

---

## 📐 Layout Principles

### Grid System
- **12-column grid**
- **Gutter:** 24px
- **Max content width:** 1200px
- **Card padding:** 24px

### Spacing Scale
```
4px  → micro spacing
8px  → tight spacing
16px → default spacing
24px → comfortable spacing
32px → section spacing
48px → major section breaks
```

### Card Design
- **Border radius:** 8px
- **Shadow:** `0 2px 8px rgba(27, 42, 78, 0.08)`
- **Border:** 1px solid `#E2E8F0`

---

## 🌓 Dark Mode

| Element | Light | Dark |
|---------|-------|------|
| Background | `#FFFFFF` | `#0F172A` |
| Surface | `#F1F5F9` | `#1E293B` |
| Text Primary | `#1B2A4E` | `#F1F5F9` |
| Text Secondary | `#64748B` | `#94A3B8` |
| Accent | `#C41E3A` | `#EF4444` |

---

## 📱 Responsive Breakpoints

```css
--mobile: 320px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1440px;
```

---

## ✨ Micro-interactions

### Vote Confirmation
1. User clicks "Cast Vote"
2. Button transforms → loading spinner
3. Blockchain confirmation animation (chain links connecting)
4. Checkmark appears with confetti burst
5. Transaction hash fades in

### Progress Indicators
- Vote counting: Animated ballot papers stacking
- Blockchain sync: Pulsing chain-link icon
- Results loading: Bar chart growing animation

---

## 🏛️ Design Philosophy

> "Democracy thrives in transparency. Every vote is a voice, every voice is verified."

The design balances:
- **Authority** (serif headings, navy palette) → Trust
- **Clarity** (clean layouts, clear hierarchy) → Accessibility  
- **Modernity** (blockchain elements, smooth animations) → Innovation
- **Civic Pride** (red accents, official aesthetic) → Participation

---

## 📁 Asset Requirements

### Logo Variations
- Full logo (icon + wordmark)
- Icon only (hexagon with ballot)
- Wordmark only
- Monochrome versions

### Illustrations
- Empty state: "No active polls"
- Success state: "Vote recorded"
- Error state: "Connection failed"
- Onboarding: "Connect wallet"

---

*Design by ChainPoll Design Agent • v1.0*
