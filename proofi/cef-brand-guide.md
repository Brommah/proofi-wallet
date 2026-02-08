# CEF Brand Guide

*Cere Ecosystem Framework — "Lambda for AI Agents"*
*Dark-first. Developer-native. Zero purple.*

---

## What CEF Is

CEF is the developer experience layer for Cere's decentralized infrastructure. Developers use CEF to build and deploy AI agents. Enterprises choose CEF because every agent decision is cryptographically verified, every byte of data is sovereign, and compliance isn't a checkbox — it's built into the protocol.

**The product stack:**
- **ROB** — Real-Time Orchestration Builder (visual workflow editor)
- **Agent Runtime** — V8 serverless runtime (TypeScript agents)
- **DDC** — Decentralized Data Cloud (Streams, Rafts, Cubbies)
- **DAC** — Data Activity Capture (verification/audit layer)

**The pitch:**
- To developers: "Build agents, not infrastructure"
- To enterprise: "Trustless compliance — verify, don't trust"

---

## Brand Principles

### 1. Dark Is the Brand
Developers live in dark mode — editors, terminals, browsers. CEF meets them there. Dark mode isn't a toggle. It's the identity.

### 2. Invisible by Design
The best infrastructure disappears. Color appears only when it carries meaning. Surfaces are quiet. The agent's work, not the platform's chrome, takes center stage.

### 3. Verifiable, Not Trusted
CEF provides proof, not promises. Status is always visible. Every colored indicator maps to something cryptographically real.

---

## Color System

### Why Teal
CEF IS data infrastructure. The primary color IS the data color — they're the same thing because the product and its purpose are inseparable. Teal reads as "technical infrastructure" — it's the color of network diagrams, data flows, terminal prompts. It's completely distinct from Proofi's blue, MUI's blue, and any shade of purple.

### Dark Surface Scale
12 steps with a subtle cool tint. Code-editor warmth — not sterile, not blue.

| Token | Hex | Role |
|-------|-----|------|
| `gray-1` | `#0A0B0E` | Deepest (behind overlays) |
| `gray-2` | `#0F1115` | **Page background** |
| `gray-3` | `#15181E` | **Card/panel surface** |
| `gray-4` | `#1C2027` | **Elevated** (inputs, dropdowns) |
| `gray-5` | `#24292F` | Hover states |
| `gray-6` | `#2D343D` | **Default border** |
| `gray-7` | `#3A424D` | Strong border |
| `gray-8` | `#505862` | Placeholder |
| `gray-9` | `#6B7480` | **Muted text** |
| `gray-10` | `#8B939F` | **Secondary text** |
| `gray-11` | `#B0B8C4` | **Body text** |
| `gray-12` | `#E2E8F0` | **Primary text** |

### Primary — Teal
**The product and its data layer.** On dark backgrounds `#2DD4BF` (teal-400) is the primary accent. Filled buttons use `#14B8A6` (teal-500). On light backgrounds `#0D9488` (teal-600).

| Token | Hex | Usage |
|-------|-----|-------|
| `teal-50` | `#F0FDFA` | Badge bg (light) |
| `teal-100` | `#CCFBF1` | Hover bg (light) |
| `teal-200` | `#99F6E4` | Selected bg (light) |
| `teal-300` | `#5EEAD4` | Hover accent (dark) |
| `teal-400` | `#2DD4BF` | **Primary accent on dark** — links, highlights |
| `teal-500` | `#14B8A6` | **Button fill** (both themes) |
| `teal-600` | `#0D9488` | **Primary accent on light** |
| `teal-700` | `#0F766E` | Active/pressed (light) |
| `teal-800` | `#115E59` | Badge text (light) |
| `teal-900` | `#134E4A` | Dark badge bg |
| `teal-950` | `#042F2E` | Subtle dark bg |

Accent backgrounds on dark: `rgba(45, 212, 191, 0.10)` muted, `rgba(45, 212, 191, 0.18)` emphasized.

### Semantic Colors

#### Verified — Green
**DAC.** Cryptographically proven. Green = signed receipt.

| Token | Hex |
|-------|-----|
| `green-400` | `#4ADE80` |
| `green-500` | `#22C55E` |
| `green-700` | `#15803D` |

#### Error — Red
**Failures.** Node down, pipeline broken.

| Token | Hex |
|-------|-----|
| `red-400` | `#F87171` |
| `red-500` | `#EF4444` |
| `red-700` | `#B91C1C` |

#### Warning — Amber
**Degraded.** Threshold exceeded, latency spike.

| Token | Hex |
|-------|-----|
| `amber-400` | `#FBBF24` |
| `amber-500` | `#F59E0B` |
| `amber-700` | `#B45309` |

### Data Visualization
No purple. High contrast on dark canvas.

| Slot | Hex | Name |
|------|-----|------|
| 1 | `#2DD4BF` | Teal |
| 2 | `#4ADE80` | Green |
| 3 | `#FBBF24` | Amber |
| 4 | `#F87171` | Red |
| 5 | `#38BDF8` | Sky |
| 6 | `#FB923C` | Orange |
| 7 | `#F472B6` | Pink |
| 8 | `#A3E635` | Lime |

### Brand Gradient (Marketing Only)
```css
background: linear-gradient(135deg, #0D9488, #4ADE80);
```
Teal → Green: infrastructure → verification.

---

## Typography

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
```

**JetBrains Mono is first-class** — agent IDs, hashes, metrics, timestamps, configs.

| Token | Size | Weight | Line Height | Tracking |
|-------|------|--------|-------------|----------|
| `display-lg` | 48px | 700 | 1.1 | -0.025em |
| `display-md` | 36px | 700 | 1.15 | -0.02em |
| `heading-lg` | 24px | 600 | 1.25 | -0.015em |
| `heading-md` | 20px | 600 | 1.3 | -0.01em |
| `heading-sm` | 16px | 600 | 1.35 | -0.01em |
| `body-lg` | 15px | 400 | 1.6 | 0 |
| `body-md` | 14px | 400 | 1.5 | 0 |
| `body-sm` | 13px | 400 | 1.5 | 0 |
| `label-sm` | 11px | 500 | 1.0 | 0.04em |
| `mono-md` | 13px | 400 | 1.5 | 0 |
| `mono-sm` | 12px | 400 | 1.4 | 0 |

---

## Spacing & Shape

**4px grid.** Spacing: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 6px | Badges, chips |
| `radius-md` | 8px | Buttons, inputs, cards |
| `radius-lg` | 12px | Modals, popovers |
| `radius-full` | 9999px | Avatars, dots, pills |

---

## Depth Model

**Borders, not shadows.** On dark surfaces, shadows vanish.

| Level | Background | Border |
|-------|-----------|--------|
| Page | gray-2 `#0F1115` | — |
| Surface | gray-3 `#15181E` | gray-6 `#2D343D` |
| Elevated | gray-4 `#1C2027` | gray-6 |
| Overlay | gray-3 | gray-7 `#3A424D` |

Focus ring: `0 0 0 2px gray-2, 0 0 0 4px teal-400`

---

## Components

### Buttons
**Primary:** `bg: #14B8A6; color: #FFFFFF; hover: #2DD4BF; active: #0D9488`
**Secondary:** `bg: transparent; border: 1px solid #2D343D; color: #B0B8C4`
**Ghost:** `bg: transparent; color: #8B939F; hover-bg: #1C2027`
**Danger:** `bg: #EF4444; color: #FFFFFF`
Sizes: 28px (sm), 36px (default), 44px (lg)

### Inputs
`bg: #1C2027; border: #2D343D; focus-border: #2DD4BF; placeholder: #505862`

### Cards
`bg: #15181E; border: #2D343D; selected: border #2DD4BF + bg rgba(45,212,191,0.06)`

### Badges
| Variant | Background | Text |
|---------|-----------|------|
| Default | `#24292F` | `#B0B8C4` |
| Primary | `rgba(45,212,191,0.12)` | `#2DD4BF` |
| Verified | `rgba(74,222,128,0.12)` | `#4ADE80` |
| Error | `rgba(248,113,113,0.12)` | `#F87171` |
| Warning | `rgba(251,191,36,0.12)` | `#FBBF24` |

---

## Do's and Don'ts

✅ Teal for product interactions
✅ Green for DAC verification only
✅ Monospace for all data values
✅ Borders for depth
✅ Dark-first always

❌ No purple — not indigo, not violet, not lavender, nothing
❌ No blue primary (#1976d2, #3B82F6)
❌ No shadows on dark
❌ No Space Grotesk (Proofi)
❌ No 0px radius (Proofi)
❌ No gradients in product UI

---

## CEF vs Proofi

| | CEF | Proofi |
|-|-----|--------|
| Mode | Dark-first | Light only |
| Primary | Teal `#2DD4BF` / `#14B8A6` | Blue `#3B82F6` |
| Font | Inter + JetBrains Mono | Space Grotesk + Inter |
| Radius | 8px | 0px |
| Depth | Borders + surface steps | Borders only |
| Target | Developers + enterprise | Consumers |

---

*Last updated: 2026-02-05 · Dark is the brand. Teal is the color. No purple.*
