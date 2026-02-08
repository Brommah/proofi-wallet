# DropVault — Design System

## 🎯 Brand Identity

**Tagline:** *"Your secrets, fortified."*

**Personality:** Onbreekbaar, vertrouwd, premium, mysterieus

**Core Values:**
- Privacy als recht
- Onzichtbare beveiliging
- Eenvoud zonder concessies

---

## 🎨 Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Vault Black** | `#0D0F12` | Primary background |
| **Steel Gray** | `#1A1D24` | Cards, elevated surfaces |
| **Graphite** | `#2A2E38` | Borders, dividers |

### Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Emerald Glow** | `#10B981` | Success, secured states |
| **Deep Emerald** | `#047857` | Hover states, subtle accents |
| **Vault Gold** | `#D4AF37` | Premium features, highlights |
| **Burnished Gold** | `#B8860B` | Icons, badges |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Alert Red** | `#DC2626` | Errors, security warnings |
| **Caution Amber** | `#F59E0B` | Warnings |
| **Info Blue** | `#3B82F6` | Information states |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Pure White** | `#FFFFFF` | Headlines, primary text |
| **Soft Gray** | `#A1A1AA` | Secondary text |
| **Muted** | `#52525B` | Disabled, hints |

---

## 🔤 Typography

### Font Stack

```css
--font-display: 'Satoshi', 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| **Display** | 48px | 800 | 1.1 | Hero headlines |
| **H1** | 32px | 700 | 1.2 | Page titles |
| **H2** | 24px | 600 | 1.3 | Section headers |
| **H3** | 18px | 600 | 1.4 | Card titles |
| **Body** | 16px | 400 | 1.6 | Paragraph text |
| **Small** | 14px | 400 | 1.5 | Labels, hints |
| **Micro** | 12px | 500 | 1.4 | Badges, timestamps |

### Character: BOLD & CONFIDENT
- Headlines: All-caps met letter-spacing: 0.05em
- Numbers in monospace font voor data-feel

---

## 🏗️ Layout & Spacing

### Grid System
- 12-column grid
- Gutter: 24px
- Max container: 1280px
- Mobile: 16px padding

### Spacing Scale (8px base)

| Token | Value |
|-------|-------|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |
| `2xl` | 48px |
| `3xl` | 64px |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 4px | Buttons, inputs |
| `md` | 8px | Cards |
| `lg` | 12px | Modals |
| `xl` | 16px | Featured elements |
| `full` | 9999px | Avatars, badges |

---

## 🎭 Visual Language

### Shadows (Layered Security Feel)

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5), 0 4px 6px rgba(0, 0, 0, 0.3);
--shadow-glow: 0 0 20px rgba(16, 185, 129, 0.15);
```

### Glassmorphism (Subtle)

```css
.glass-panel {
  background: rgba(26, 29, 36, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

### Gradients

```css
/* Vault door gradient */
--gradient-vault: linear-gradient(135deg, #1A1D24 0%, #0D0F12 100%);

/* Emerald accent */
--gradient-secure: linear-gradient(135deg, #10B981 0%, #047857 100%);

/* Gold premium */
--gradient-premium: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);

/* Steel texture */
--gradient-steel: linear-gradient(180deg, 
  rgba(255,255,255,0.03) 0%, 
  transparent 50%, 
  rgba(0,0,0,0.1) 100%
);
```

---

## 🔐 Security UI Components

### Lock Icons & States

| State | Visual | Color |
|-------|--------|-------|
| **Unlocked** | Open padlock | Emerald Glow |
| **Locked** | Closed padlock | Vault Gold |
| **Encrypting** | Spinning lock | Pulsing emerald |
| **Error** | Broken lock | Alert Red |

### Vault Door Animation

```css
@keyframes vault-open {
  0% { transform: perspective(1000px) rotateY(0deg); }
  100% { transform: perspective(1000px) rotateY(-90deg); }
}
```

### Security Indicators

- **Encryption badge**: Pill-shaped, gold border, lock icon
- **Secure connection**: Green dot + "Encrypted" label
- **Password strength**: 4-segment bar (red → amber → emerald)

---

## 🧩 Component Library

### Buttons

| Variant | Background | Text | Border |
|---------|------------|------|--------|
| **Primary** | Emerald gradient | White | None |
| **Secondary** | Transparent | Emerald | 1px Emerald |
| **Ghost** | Transparent | Soft Gray | None |
| **Premium** | Gold gradient | Vault Black | None |
| **Danger** | Alert Red | White | None |

**Button Style:**
```css
.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
}
```

### Cards (Note Cards)

```css
.note-card {
  background: var(--steel-gray);
  border: 1px solid var(--graphite);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.note-card::before {
  /* Subtle steel texture overlay */
  content: '';
  position: absolute;
  inset: 0;
  background: var(--gradient-steel);
  pointer-events: none;
}

.note-card--locked {
  border-color: var(--vault-gold);
}

.note-card--locked::after {
  content: '🔒';
  position: absolute;
  top: 12px;
  right: 12px;
}
```

### Input Fields

```css
.input {
  background: var(--vault-black);
  border: 1px solid var(--graphite);
  border-radius: 8px;
  padding: 14px 16px;
  color: var(--pure-white);
  transition: border-color 0.2s;
}

.input:focus {
  border-color: var(--emerald-glow);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.input--secure {
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
}
```

### Navigation

- **Top bar**: Glassmorphism, fixed
- **Sidebar**: Full height, vault-black
- **Tab bar (mobile)**: Floating, rounded, glass effect

---

## 🎬 Motion Design

### Timing Functions

```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out-circ: cubic-bezier(0.85, 0, 0.15, 1);
```

### Transitions

| Action | Duration | Easing |
|--------|----------|--------|
| Hover | 150ms | ease-out |
| Focus | 200ms | ease-out |
| Page transition | 300ms | ease-out-expo |
| Modal open | 400ms | ease-out-expo |
| Vault unlock | 600ms | ease-in-out-circ |

### Micro-interactions

1. **Lock toggle**: Satisfying "click" animation + subtle shake
2. **Note save**: Brief green flash on card border
3. **Encrypt**: Scramble text effect → reveal
4. **Delete**: Fade + scale down + slide out

---

## 📱 Responsive Breakpoints

| Name | Width | Target |
|------|-------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |

---

## 🖼️ Iconography

**Style:** Outline icons, 2px stroke, rounded caps

**Icon Set:** Lucide Icons (consistent with security theme)

**Key Icons:**
- 🔒 `lock` — Encrypted
- 🔓 `unlock` — Decrypted
- 🛡️ `shield` — Protected
- 🔑 `key` — Access/Password
- 📝 `file-text` — Note
- 🗑️ `trash-2` — Delete
- ⚙️ `settings` — Settings
- 👤 `user` — Account

---

## 🌟 Signature Elements

### 1. Vault Door Motif
Subtle concentric circles (like a vault door) used as:
- Background pattern (very low opacity)
- Loading spinner
- Empty state illustration

### 2. Brushed Steel Texture
Horizontal micro-lines creating a metallic feel on cards and headers.

### 3. Gold Accents
Used sparingly for:
- Premium badges
- Important CTAs
- Locked note indicators
- Achievement unlocks

### 4. Emerald Glow
Security-confirmed states emit a subtle emerald glow:
- Successful encryption
- Verified identity
- Secure connection

---

## 📐 Example Compositions

### Login Screen
```
┌─────────────────────────────────────┐
│                                     │
│          [VAULT DOOR LOGO]          │
│                                     │
│            D R O P V A U L T        │
│        Your secrets, fortified.     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Email                       │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ Master Password        👁️  │    │
│  └─────────────────────────────┘    │
│                                     │
│  [========= UNLOCK VAULT =========] │
│                                     │
│         Forgot password? →          │
│                                     │
└─────────────────────────────────────┘
```

### Dashboard
```
┌─────────────────────────────────────────────────────┐
│ ◉ DropVault    [Search...]    🔔  👤               │
├───────────┬─────────────────────────────────────────┤
│           │                                         │
│ 📁 All    │  MY VAULT                   [+ New]    │
│ 🔒 Secure │  ─────────────────────────────────     │
│ ⭐ Starred│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ 🗑️ Trash  │  │ 🔒      │ │ 📝      │ │ 🔒      │   │
│           │  │ Passwords│ │ Ideas   │ │ Private │   │
│ ───────── │  │ 12 items│ │ 3 items │ │ 7 items │   │
│ 🏷️ Tags   │  │ Updated │ │ Updated │ │ Updated │   │
│  • Work   │  │ 2h ago  │ │ 1d ago  │ │ 3d ago  │   │
│  • Personal│  └─────────┘ └─────────┘ └─────────┘   │
│           │                                         │
└───────────┴─────────────────────────────────────────┘
```

---

## 📦 Asset Deliverables

1. **Logo** — SVG + PNG (dark/light variants)
2. **Icon set** — SVG sprites
3. **Figma file** — Component library
4. **CSS variables** — Design tokens
5. **Tailwind config** — Theme extension

---

*Design system v1.0 — DropVault*
*Created for fortress-grade encrypted note storage*
