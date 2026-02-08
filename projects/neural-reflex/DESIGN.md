# 🎮 Neural Reflex - Visual Identity Design

> **Project:** Neural Reflex  
> **Type:** Gaming App - Reaction Speed & Memory Tests  
> **Design Style:** Cyberpunk / Neon Arcade / Futuristic Gaming

---

## 🎨 Color Palette

### Primary Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Electric Blue** | `#00D4FF` | 0, 212, 255 | Primary actions, highlights, progress |
| **Neon Pink** | `#FF0080` | 255, 0, 128 | Alerts, errors, intensity indicators |
| **Cyber Green** | `#00FF9F` | 0, 255, 159 | Success, scores, achievements |

### Supporting Colors
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Deep Void** | `#0A0A12` | 10, 10, 18 | Primary background |
| **Dark Matter** | `#12121C` | 18, 18, 28 | Card backgrounds |
| **Plasma Purple** | `#8B00FF` | 139, 0, 255 | Accents, hover states |
| **Chrome Silver** | `#C0C0C0` | 192, 192, 192 | Secondary text |

### Gradients
```css
/* Hero Gradient - Primary CTA */
--gradient-hero: linear-gradient(135deg, #00D4FF 0%, #FF0080 50%, #00FF9F 100%);

/* Neon Glow */
--gradient-glow: linear-gradient(180deg, rgba(0,212,255,0.3) 0%, transparent 100%);

/* Score Bar */
--gradient-score: linear-gradient(90deg, #00FF9F 0%, #00D4FF 100%);
```

---

## ✒️ Typography

### Font Stack
```css
/* Primary - Headings & UI */
--font-primary: 'Orbitron', 'Rajdhani', sans-serif;

/* Secondary - Body & Info */
--font-secondary: 'Exo 2', 'Titillium Web', sans-serif;

/* Monospace - Scores & Timers */
--font-mono: 'Share Tech Mono', 'JetBrains Mono', monospace;
```

### Scale
| Element | Size | Weight | Tracking |
|---------|------|--------|----------|
| Hero Title | 48-72px | 900 | 0.15em |
| Section Header | 32px | 700 | 0.1em |
| Card Title | 24px | 600 | 0.05em |
| Body | 16px | 400 | 0.02em |
| Timer Display | 64-96px | 700 | 0 |
| Score Counter | 48px | 700 | 0.05em |

---

## ✨ Effects & Animations

### Glow Effects (CSS)
```css
/* Neon Text Glow */
.neon-text {
  text-shadow: 
    0 0 5px currentColor,
    0 0 10px currentColor,
    0 0 20px currentColor,
    0 0 40px currentColor;
}

/* Button Glow */
.btn-glow {
  box-shadow: 
    0 0 5px #00D4FF,
    0 0 15px rgba(0, 212, 255, 0.5),
    0 0 30px rgba(0, 212, 255, 0.3),
    inset 0 0 15px rgba(0, 212, 255, 0.1);
}

/* Card Neon Border */
.card-neon {
  border: 1px solid rgba(0, 212, 255, 0.3);
  box-shadow: 
    0 0 10px rgba(0, 212, 255, 0.2),
    inset 0 0 20px rgba(0, 212, 255, 0.05);
}
```

### Pulse Animations
```css
/* Heartbeat Pulse - For Ready States */
@keyframes pulse-glow {
  0%, 100% { 
    box-shadow: 0 0 5px #00D4FF, 0 0 10px rgba(0, 212, 255, 0.5);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 20px #00D4FF, 0 0 40px rgba(0, 212, 255, 0.8);
    transform: scale(1.02);
  }
}

/* Intensity Pulse - For Reaction Tests */
@keyframes intensity-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Score Pop - Achievement */
@keyframes score-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); color: #00FF9F; }
  100% { transform: scale(1); }
}

/* Scan Line - Retro Effect */
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
```

### Micro-interactions
```css
/* Button Hover - Electric Surge */
.btn-primary:hover {
  animation: pulse-glow 0.6s ease-in-out infinite;
  transform: translateY(-2px);
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Reaction Target Appear */
.target-appear {
  animation: target-flash 0.15s ease-out;
}

@keyframes target-flash {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
```

---

## 🖼️ UI Components

### Buttons
```
┌─────────────────────────────────────┐
│  ▶ START REACTION TEST              │  ← Primary (Electric Blue glow)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ◆ MEMORY CHALLENGE                 │  ← Secondary (Outlined, subtle glow)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ⚡ QUICK PLAY                       │  ← Accent (Gradient border)
└─────────────────────────────────────┘
```

### Cards
```
╔═══════════════════════════════════════╗
║  ┌──────────────────────────────────┐ ║
║  │  🧠 MEMORY MATRIX                │ ║
║  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ║
║  │                                  │ ║
║  │  Best: 847ms    Avg: 1.2s       │ ║
║  │  ████████████████░░░░ 80%       │ ║
║  │                                  │ ║
║  │  [ PLAY NOW ]                   │ ║
║  └──────────────────────────────────┘ ║
╚═══════════════════════════════════════╝
     ↑ Neon border with corner accents
```

### Timer Display
```
     ╭────────────────────────────╮
     │                            │
     │      ⚡ 0.247s ⚡          │  ← Monospace, Electric Blue
     │                            │
     │   ▼ YOUR BEST: 0.189s     │  ← Cyber Green for records
     ╰────────────────────────────╯
```

### Score Counter
```
   ┌─────────────────────────────────┐
   │  SCORE                          │
   │  ██████████████████████████████ │
   │                                 │
   │      ✦ 12,847 ✦                │  ← Animated on increment
   │                                 │
   │  COMBO x7 🔥                   │  ← Neon Pink when active
   └─────────────────────────────────┘
```

---

## 📱 Screen Layouts

### Home Screen
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ≡                           ⚙️  👤     ┃
┃                                          ┃
┃      ███╗   ██╗██████╗                   ┃
┃      ████╗  ██║██╔══██╗                  ┃
┃      ██╔██╗ ██║██████╔╝                  ┃
┃      ██║╚██╗██║██╔══██╗                  ┃
┃      ██║ ╚████║██║  ██║                  ┃
┃      ╚═╝  ╚═══╝╚═╝  ╚═╝                  ┃
┃         NEURAL REFLEX                    ┃
┃     ─── TRAIN YOUR BRAIN ───            ┃
┃                                          ┃
┃    ┌────────────────────────────────┐   ┃
┃    │  ⚡ QUICK PLAY                  │   ┃
┃    └────────────────────────────────┘   ┃
┃                                          ┃
┃    ┌──────────┐    ┌──────────┐         ┃
┃    │ REACTION │    │  MEMORY  │         ┃
┃    │  0.23s   │    │  Lvl 12  │         ┃
┃    └──────────┘    └──────────┘         ┃
┃                                          ┃
┃    ┌──────────┐    ┌──────────┐         ┃
┃    │  SPEED   │    │  FOCUS   │         ┃
┃    │  847pts  │    │  92%     │         ┃
┃    └──────────┘    └──────────┘         ┃
┃                                          ┃
┃    ═══════════════════════════════      ┃
┃    🏆 LEADERBOARD    📊 STATS           ┃
┃                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### Game Screen - Reaction Test
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ← BACK              ROUND 3/5           ┃
┃                                          ┃
┃         ╔════════════════════╗          ┃
┃         ║                    ║          ┃
┃         ║   WAIT FOR IT...   ║          ┃
┃         ║                    ║          ┃
┃         ╚════════════════════╝          ┃
┃                                          ┃
┃                                          ┃
┃            ╭─────────────╮              ┃
┃            │             │              ┃
┃            │    ████     │  ← Target   ┃
┃            │    ████     │    (Pulses) ┃
┃            │             │              ┃
┃            ╰─────────────╯              ┃
┃                                          ┃
┃                                          ┃
┃       ⏱️ Best: 0.189s  Avg: 0.234s      ┃
┃                                          ┃
┃    ░░░░░░░░░░░█████████████░░░░░░░░░░   ┃
┃              Round Progress              ┃
┃                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 🎯 Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --color-electric-blue: #00D4FF;
  --color-neon-pink: #FF0080;
  --color-cyber-green: #00FF9F;
  --color-plasma-purple: #8B00FF;
  --color-deep-void: #0A0A12;
  --color-dark-matter: #12121C;
  --color-chrome: #C0C0C0;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-medium: 0.3s ease;
  --transition-slow: 0.5s ease;
  --transition-bounce: 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Shadows */
  --shadow-glow-sm: 0 0 10px rgba(0, 212, 255, 0.3);
  --shadow-glow-md: 0 0 20px rgba(0, 212, 255, 0.4);
  --shadow-glow-lg: 0 0 40px rgba(0, 212, 255, 0.5);
  
  /* Z-Index */
  --z-base: 0;
  --z-elevated: 10;
  --z-overlay: 100;
  --z-modal: 1000;
}
```

---

## 🚀 Key Design Principles

1. **Speed First** - Every animation under 300ms, instant feedback
2. **High Contrast** - Neon on dark for maximum visibility
3. **Arcade Feel** - Chunky buttons, bold numbers, satisfying clicks
4. **Progressive Intensity** - Colors intensify as scores increase
5. **Scanline Nostalgia** - Subtle CRT effects for retro gaming vibes
6. **Micro-rewards** - Every tap, score, achievement feels rewarding

---

## 📦 Tech Stack Recommendations

- **Framework:** React / React Native / Flutter
- **Animation:** Framer Motion / Lottie / Rive
- **Icons:** Custom SVG with glow filters
- **Sound:** Howler.js for arcade SFX
- **Haptics:** Native APIs for tactile feedback

---

*Design created: 2025-01-21*  
*Status: Draft v1.0*
