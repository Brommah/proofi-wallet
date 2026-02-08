# MemoryChain - Design System
## Encrypted Digital Diary

---

## 🎨 Visuele Identiteit

### Concept
MemoryChain is een **persoonlijke, intieme ruimte** voor herinneringen. Het design voelt als een vintage dagboek dat je op zolder vindt — warm, nostalgisch, maar met moderne elegantie. De encrypted nature wordt subtiel gecommuniceerd door de "chain" metafoor: verbonden momenten, veilig bewaard.

---

## 🎨 Kleurenpalet

### Primary Palette
| Naam | Hex | Gebruik |
|------|-----|---------|
| **Cream** | `#FDF8F3` | Achtergrond (notebook paper) |
| **Warm Ivory** | `#F5EDE4` | Card backgrounds |
| **Dusty Rose** | `#D4A5A5` | Accenten, highlights, actieve elementen |
| **Sage Green** | `#9CAF88` | Secundaire accenten, succes states |
| **Deep Burgundy** | `#6B4444` | Primary text, headers |

### Extended Palette
| Naam | Hex | Gebruik |
|------|-----|---------|
| **Soft Blush** | `#E8D4D4` | Hover states, selected entries |
| **Muted Gold** | `#C9B896` | Icons, dates, metadata |
| **Charcoal** | `#3A3A3A` | Body text |
| **Light Sage** | `#D4E1CC` | Secondary backgrounds |

---

## ✍️ Typografie

### Font Stack
```css
/* Primary - Handwritten feel */
--font-display: 'Caveat', 'Dancing Script', cursive;

/* Body - Readable warmth */
--font-body: 'Lora', 'Merriweather', Georgia, serif;

/* Mono - Dates & metadata */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale
| Element | Size | Weight | Font |
|---------|------|--------|------|
| H1 (Entry Title) | 2.5rem | 400 | Caveat |
| H2 | 1.75rem | 400 | Caveat |
| Date Header | 0.875rem | 500 | JetBrains Mono |
| Body Text | 1rem | 400 | Lora |
| Caption | 0.75rem | 400 | Lora |

---

## 📓 UI Components

### 1. Diary Entry Card
```
┌─────────────────────────────────────┐
│ ○ ○ ○  (notebook holes)             │
│                                     │
│  📅 Wednesday, January 15, 2025     │
│  ───────────────────────────        │
│                                     │
│  "A beautiful day for              │
│   new beginnings..."               │
│                                     │
│  The morning light filtered...      │
│                                     │
│  🏷️ #reflection #morning            │
│  🔒 encrypted                       │
└─────────────────────────────────────┘
```

### 2. Navigation
- Sidebar met **maandkalender** (vintage kalender stijl)
- **Chain indicator**: visuele lijn die entries verbindt
- **Lock icon** bij encrypted entries

### 3. Entry Editor
- Lined paper achtergrond (subtiele horizontale lijnen)
- Handwriting-style cursor
- Mood selector met pastel emoticons
- Auto-save indicator als **fadeout text**

---

## 🔐 Security Visual Language

De encryption wordt subtiel maar duidelijk gecommuniceerd:

- **Lock icon**: Kleine hangslot in dusty rose
- **Chain links**: Verbinden entries visueel
- **Sealed envelope**: Voor gedeelde maar encrypted entries
- **Wax seal**: Premium/master password indicator

---

## 🌙 Dark Mode

| Light | Dark |
|-------|------|
| Cream `#FDF8F3` | Deep Navy `#1A1D26` |
| Dusty Rose `#D4A5A5` | Muted Mauve `#9C7C7C` |
| Sage Green `#9CAF88` | Dark Sage `#5C6B52` |
| Deep Burgundy `#6B4444` | Soft Cream `#E8DDD4` |

---

## ✨ Micro-interactions

1. **Entry hover**: Subtle paper lift shadow
2. **Save animation**: Ink drop ripple
3. **Lock/unlock**: Key turning animation
4. **New entry**: Page flip transition
5. **Delete**: Gentle paper crumple

---

## 📐 Spacing System

Base unit: `4px`

| Token | Value |
|-------|-------|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |

---

## 🎯 Design Principles

1. **Warm, not cold** — Avoid sharp edges, use rounded corners (8-12px)
2. **Personal, not corporate** — Handwritten elements, organic shapes
3. **Secure, not scary** — Security should feel like a cozy safe, not a vault
4. **Nostalgic, not dated** — Vintage inspiration with modern execution
5. **Focused, not cluttered** — One entry at a time, no distractions

---

*Created for MemoryChain - Where memories live forever, safely.*
