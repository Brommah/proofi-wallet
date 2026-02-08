# 🏰 CryptoQuest Design System
## RPG Character Creator - Visual Identity

---

## 🎨 Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Dragon Gold** | `#D4AF37` | Primary accents, legendary items, XP bars, coin icons |
| **Royal Purple** | `#4A0E4E` | Backgrounds, magical effects, rare items |
| **Dragon Red** | `#8B0000` | Health bars, fire effects, critical hits, epic rarity |

### Secondary Colors
| Name | Hex | Usage |
|------|-----|-------|
| **Mystic Blue** | `#1E3A5F` | Mana bars, water elements, frozen effects |
| **Ancient Bronze** | `#CD7F32` | Common items, armor, UI frames |
| **Shadow Black** | `#0D0D0D` | Deep backgrounds, text on light |
| **Parchment Cream** | `#F5E6C4` | Text backgrounds, scrolls, tooltips |

### Rarity Gradient System
```
Common     → #808080 (Gray)
Uncommon   → #2ECC71 (Green)  
Rare       → #3498DB (Blue)
Epic       → #9B59B6 (Purple)
Legendary  → #D4AF37 (Gold) ✨ with glow effect
Mythic     → #FF6B6B → #8B0000 (Red gradient, animated)
```

---

## 📜 Typography

### Primary Font: "Cinzel Decorative"
- **Usage:** Logo, headers, epic titles, character names
- **Weight:** 700-900
- **Style:** Medieval serif with fantasy flourishes
- **Fallback:** "Palatino Linotype", serif

### Secondary Font: "Cinzel"
- **Usage:** Subheadings, stat labels, item names
- **Weight:** 400-600
- **Fallback:** Georgia, serif

### Body Font: "Lora"
- **Usage:** Descriptions, lore text, dialogue
- **Weight:** 400-500
- **Fallback:** "Times New Roman", serif

### UI Font: "Alegreya Sans"
- **Usage:** Buttons, numbers, stats, interface elements
- **Weight:** 400-700
- **Fallback:** "Segoe UI", sans-serif

### Hierarchy
```css
--font-display: 'Cinzel Decorative', serif;
--font-heading: 'Cinzel', serif;
--font-body: 'Lora', serif;
--font-ui: 'Alegreya Sans', sans-serif;

--size-hero: 4rem;      /* 64px - Logo */
--size-title: 2.5rem;   /* 40px - Page titles */
--size-heading: 1.75rem;/* 28px - Section headers */
--size-subhead: 1.25rem;/* 20px - Card titles */
--size-body: 1rem;      /* 16px - Body text */
--size-small: 0.875rem; /* 14px - Captions, stats */
--size-micro: 0.75rem;  /* 12px - Tooltips */
```

---

## 🛡️ RPG UI Components

### Character Frame
```
┌─────────────────────────────────────┐
│  ╔═══════════════════════════════╗  │
│  ║  ┌─────────────────────────┐  ║  │
│  ║  │                         │  ║  │
│  ║  │    CHARACTER PORTRAIT   │  ║  │
│  ║  │       (256x256px)       │  ║  │
│  ║  │                         │  ║  │
│  ║  └─────────────────────────┘  ║  │
│  ╠═══════════════════════════════╣  │
│  ║  ⚔️ WARRIOR  Lvl 42         ║  │
│  ╚═══════════════════════════════╝  │
└─────────────────────────────────────┘

Frame: Ancient Bronze (#CD7F32) with gold corner ornaments
Border: 4px solid, beveled 3D effect
Shadow: 0 8px 32px rgba(0,0,0,0.6)
```

### Stat Bars
```css
.stat-bar {
  height: 24px;
  border-radius: 4px;
  border: 2px solid #1a1a1a;
  background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
  overflow: hidden;
}

.health-bar .fill {
  background: linear-gradient(90deg, #8B0000 0%, #FF4444 50%, #8B0000 100%);
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);
}

.mana-bar .fill {
  background: linear-gradient(90deg, #1E3A5F 0%, #4A90D9 50%, #1E3A5F 100%);
}

.xp-bar .fill {
  background: linear-gradient(90deg, #D4AF37 0%, #FFD700 50%, #D4AF37 100%);
  animation: shimmer 2s infinite;
}
```

### Stat Display
```
╔════════════════════════════════╗
║  ⚔️ STRENGTH     ████████░░ 84 ║
║  🛡️ DEFENSE      ██████░░░░ 62 ║
║  ⚡ AGILITY      █████████░ 91 ║
║  🔮 MAGIC        ███░░░░░░░ 28 ║
║  ❤️ VITALITY     ███████░░░ 73 ║
║  🍀 LUCK         ██░░░░░░░░ 21 ║
╚════════════════════════════════╝
```

### Button Styles

#### Primary Button (Gold)
```css
.btn-primary {
  background: linear-gradient(180deg, #D4AF37 0%, #B8860B 100%);
  border: 2px solid #8B7500;
  border-radius: 8px;
  color: #1a0a00;
  font-family: var(--font-ui);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 
    0 4px 0 #8B7500,
    0 8px 16px rgba(0,0,0,0.4);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 0 #8B7500,
    0 12px 24px rgba(212,175,55,0.3);
}

.btn-primary:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #8B7500;
}
```

#### Secondary Button (Purple)
```css
.btn-secondary {
  background: linear-gradient(180deg, #6B2D5B 0%, #4A0E4E 100%);
  border: 2px solid #3A0B3E;
  color: #F5E6C4;
}
```

#### Danger Button (Red)
```css
.btn-danger {
  background: linear-gradient(180deg, #AA2222 0%, #8B0000 100%);
  border: 2px solid #660000;
  color: #FFFFFF;
}
```

---

## 🎭 Character Classes Icons

```
⚔️ Warrior   - Crossed swords, red/bronze
🏹 Ranger    - Bow & arrow, green/brown
🔮 Mage      - Crystal orb, purple/blue
🗡️ Rogue     - Dagger, shadow/silver
🛡️ Paladin   - Shield & cross, gold/white
💀 Necromancer - Skull, dark purple/green
🔥 Pyromancer - Flame, red/orange
❄️ Cryomancer - Snowflake, ice blue/white
```

---

## 🎪 Layout System

### Character Creator Screen
```
┌────────────────────────────────────────────────────────────┐
│  🏰 CRYPTOQUEST                    💰 1,234  ⚡ 500  👤    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐    ┌─────────────────────────────┐   │
│  │                  │    │  CHARACTER NAME              │   │
│  │                  │    │  ┌─────────────────────────┐ │   │
│  │   3D CHARACTER   │    │  │ Enter your hero's name │ │   │
│  │     PREVIEW      │    │  └─────────────────────────┘ │   │
│  │    (Rotatable)   │    │                              │   │
│  │                  │    │  CLASS                       │   │
│  │                  │    │  ⚔️🏹🔮🗡️🛡️💀🔥❄️           │   │
│  │                  │    │                              │   │
│  └──────────────────┘    │  RACE                        │   │
│                          │  🧝 Human  🧝‍♂️ Elf  🧟 Orc  🧙 Dwarf │   │
│  ┌──────────────────┐    │                              │   │
│  │  EQUIPMENT       │    │  CUSTOMIZE                   │   │
│  │  🗡️ │ 🛡️ │ 👕 │ 👢 │    │  [Hair] [Face] [Body] [Armor]│   │
│  └──────────────────┘    └─────────────────────────────┘   │
│                                                            │
│            [ ⬅️ BACK ]              [ CREATE HERO ➡️ ]      │
└────────────────────────────────────────────────────────────┘
```

---

## ✨ Effects & Animations

### Legendary Glow
```css
@keyframes legendary-glow {
  0%, 100% { 
    box-shadow: 0 0 20px #D4AF37, 0 0 40px rgba(212,175,55,0.5);
  }
  50% { 
    box-shadow: 0 0 30px #FFD700, 0 0 60px rgba(255,215,0,0.7);
  }
}
```

### XP Bar Shimmer
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Particle Effects
- **Level Up:** Golden sparkles rising upward
- **Epic Drop:** Purple mist with swirling particles
- **Critical Hit:** Red flash + screen shake
- **Healing:** Green plus signs floating up

---

## 🖼️ Asset Guidelines

### Icons
- Size: 64x64px (large), 32x32px (medium), 16x16px (small)
- Style: Hand-painted fantasy with clean outlines
- Format: SVG preferred, PNG fallback

### Backgrounds
- Dark stone textures with subtle patterns
- Parchment overlays for content areas
- Magical ambient glow effects

### Portraits
- Resolution: 256x256px (display), 512x512px (source)
- Style: Painterly, semi-realistic fantasy art
- Frame: Ornate metallic border matching rarity

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
--breakpoint-sm: 640px;   /* Large phones */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large monitors */
```

---

## 🔧 CSS Variables Summary

```css
:root {
  /* Colors */
  --color-gold: #D4AF37;
  --color-purple: #4A0E4E;
  --color-red: #8B0000;
  --color-blue: #1E3A5F;
  --color-bronze: #CD7F32;
  --color-parchment: #F5E6C4;
  --color-shadow: #0D0D0D;
  
  /* Fonts */
  --font-display: 'Cinzel Decorative', serif;
  --font-heading: 'Cinzel', serif;
  --font-body: 'Lora', serif;
  --font-ui: 'Alegreya Sans', sans-serif;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  
  /* Borders */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.4);
  --shadow-lg: 0 8px 16px rgba(0,0,0,0.5);
  --shadow-glow: 0 0 20px var(--color-gold);
}
```

---

## 🎮 Design Philosophy

> *"Every pixel should feel like an adventure waiting to happen."*

### Core Principles
1. **Epic Scale** - Make players feel like heroes
2. **Tactile Feedback** - Every interaction feels impactful
3. **Mystery & Discovery** - Visual depth rewards exploration
4. **Accessible Fantasy** - Medieval vibes, modern usability

---

*Design System v1.0 | CryptoQuest | Created for epic adventures* 🐉
