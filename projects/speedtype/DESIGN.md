# SpeedType - Visual Identity Design Brief

## 🎯 Project Overview
**SpeedType** is a competitive typing speed test game focused on precision, speed, and competition.

---

## 🎨 Color Palette

### Primary Colors
| Role | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Terminal Green** | `#00FF41` | 0, 255, 65 | Primary accent, correct typing, success states |
| **Racing Red** | `#FF3131` | 255, 49, 49 | Errors, urgency, incorrect typing |
| **Deep Black** | `#0D0D0D` | 13, 13, 13 | Background, creates depth |
| **Phosphor Glow** | `#39FF14` | 57, 255, 20 | Glow effects, highlights |

### Secondary Colors
| Role | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Ghost Gray** | `#4A4A4A` | 74, 74, 74 | Untyped text, inactive elements |
| **Carbon** | `#1A1A1A` | 26, 26, 26 | Cards, input fields |
| **Electric Cyan** | `#00D9FF` | 0, 217, 255 | Links, WPM counter accent |
| **Gold Medal** | `#FFD700` | 255, 215, 0 | Leaderboard highlights, achievements |

### Gradients
```css
/* Speed Streak */
linear-gradient(90deg, #00FF41 0%, #00D9FF 100%)

/* Error Pulse */
linear-gradient(90deg, #FF3131 0%, #FF6B6B 100%)

/* Background Vignette */
radial-gradient(ellipse at center, #1A1A1A 0%, #0D0D0D 100%)
```

---

## 📝 Typography

### Primary Font: **JetBrains Mono**
- Monospace perfection for code/typing aesthetic
- Excellent character distinction (0 vs O, 1 vs l)
- Ligature support for polish
- **Weights:** Regular (400), Medium (500), Bold (700)

### Display Font: **Space Mono**
- Used for headers, WPM counters, leaderboards
- Retro-futuristic terminal feel
- **Weights:** Regular (400), Bold (700)

### Type Scale
```
├── Display (WPM counter): 72px / 4.5rem
├── H1 (Page titles): 48px / 3rem
├── H2 (Section headers): 32px / 2rem
├── H3 (Card titles): 24px / 1.5rem
├── Body (Typing area): 20px / 1.25rem
├── Small (Labels): 14px / 0.875rem
└── Micro (Timestamps): 12px / 0.75rem
```

---

## 🖥️ UI Components

### 1. Typing Area
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  The quick brown fox jumps over the lazy dog. Pack     │
│  my box with five dozen liquor jugs.                   │
│  ▌                                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
  ↑ Cursor: blinking underscore or block
  
  • Correct characters: Terminal Green (#00FF41)
  • Current word: Slightly brighter, subtle glow
  • Incorrect characters: Racing Red (#FF3131) + strikethrough
  • Untyped text: Ghost Gray (#4A4A4A)
```

### 2. WPM Counter (Real-time)
```
┌──────────────────┐
│       WPM        │  ← Small label, Ghost Gray
│       127        │  ← Large number, Terminal Green
│     ━━━━━━━      │  ← Progress bar showing speed trend
└──────────────────┘

Animation: Count-up effect, subtle pulse on milestones (50, 100, 150)
```

### 3. Accuracy Meter
```
┌──────────────────┐
│    ACCURACY      │
│      98.4%       │  ← Green if >95%, Yellow 85-95%, Red <85%
│    [████████░░]  │  ← Circular or linear progress
└──────────────────┘
```

### 4. Timer
```
        00:45
          ↑
   Countdown style
   Pulses red in final 10 seconds
   Format: MM:SS
```

### 5. Leaderboard
```
┌─────────────────────────────────────────────────────────┐
│  #   PLAYER          WPM    ACCURACY   DATE            │
├─────────────────────────────────────────────────────────┤
│  🥇  speedster_pro    156    99.2%     2024-01-15     │
│  🥈  keyboardwarrior  148    98.7%     2024-01-15     │
│  🥉  typist_king      142    97.4%     2024-01-14     │
│  4   ghost_typer      138    96.8%     2024-01-14     │
│  5   fast_fingers     135    98.1%     2024-01-13     │
└─────────────────────────────────────────────────────────┘

• Gold highlight (#FFD700) for top 3
• Hover effect: row glow
• Current user: highlighted border
```

---

## ✨ Visual Effects

### 1. Cursor
- Blinking block cursor (terminal style)
- Blink rate: 530ms
- Color: Terminal Green with subtle glow
- CSS: `box-shadow: 0 0 10px rgba(0, 255, 65, 0.5)`

### 2. Character Feedback
- **Correct:** Instant green color change
- **Incorrect:** Red + shake animation (2px, 100ms)
- **Typo correction:** Strikethrough effect

### 3. Speed Lines
```css
/* Subtle horizontal lines that appear during fast typing */
.speed-lines {
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 50px,
    rgba(0, 255, 65, 0.03) 50px,
    rgba(0, 255, 65, 0.03) 51px
  );
}
```

### 4. CRT Scanline Effect (Optional/Toggle)
```css
.crt-effect::before {
  content: '';
  position: absolute;
  background: repeating-linear-gradient(
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
  pointer-events: none;
}
```

### 5. Glow Effects
```css
.terminal-glow {
  text-shadow: 
    0 0 5px rgba(0, 255, 65, 0.5),
    0 0 10px rgba(0, 255, 65, 0.3),
    0 0 20px rgba(0, 255, 65, 0.1);
}
```

---

## 📐 Layout Structure

### Main Game Screen
```
┌────────────────────────────────────────────────────────────────┐
│  ⌨️ SPEEDTYPE                              👤 User  ⚙️ Settings │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│    ┌────────┐  ┌────────┐  ┌────────┐  ┌────────────────┐     │
│    │  WPM   │  │  ACC   │  │  TIME  │  │  MODE: 60s     │     │
│    │  127   │  │  98%   │  │  0:45  │  │  ▼             │     │
│    └────────┘  └────────┘  └────────┘  └────────────────┘     │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  The quick brown fox jumps over the lazy dog. Pack my   │ │
│  │  box with five dozen liquor jugs. How vexingly quick    │ │
│  │  daft zebras jump!▌                                      │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│    [← Restart]                           [Tab + Enter: Redo]   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Results Screen
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                        🏁 RACE COMPLETE                        │
│                                                                │
│                  ┌───────────────────────┐                    │
│                  │         WPM           │                    │
│                  │         142           │                    │
│                  │    ★ Personal Best!   │                    │
│                  └───────────────────────┘                    │
│                                                                │
│         Accuracy: 97.8%    Characters: 487/498                │
│         Time: 60.00s       Errors: 11                         │
│                                                                │
│    ┌──────────────────────────────────────────────────────┐   │
│    │  Character breakdown chart (heatmap of errors)       │   │
│    └──────────────────────────────────────────────────────┘   │
│                                                                │
│           [ Try Again ]    [ View Leaderboard ]                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎮 Interaction States

### Buttons
```css
/* Default */
background: #1A1A1A;
border: 1px solid #00FF41;
color: #00FF41;

/* Hover */
background: rgba(0, 255, 65, 0.1);
box-shadow: 0 0 15px rgba(0, 255, 65, 0.3);

/* Active */
background: #00FF41;
color: #0D0D0D;

/* Disabled */
border-color: #4A4A4A;
color: #4A4A4A;
```

### Input Fields
```css
background: #0D0D0D;
border: 2px solid #4A4A4A;
color: #00FF41;
font-family: 'JetBrains Mono', monospace;

/* Focus */
border-color: #00FF41;
box-shadow: 0 0 10px rgba(0, 255, 65, 0.2);
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Adjustments |
|------------|-------|-------------|
| Desktop XL | >1440px | Full layout, side panels |
| Desktop | 1024-1440px | Standard layout |
| Tablet | 768-1024px | Stacked stats, smaller text |
| Mobile | <768px | Single column, touch-friendly |

---

## 🔊 Sound Design Notes

| Event | Sound Style |
|-------|-------------|
| Keypress (correct) | Soft mechanical click |
| Keypress (error) | Sharp buzz/static |
| Timer warning (10s) | Subtle beep |
| Race complete | Retro "level complete" chime |
| New high score | Triumphant 8-bit fanfare |

---

## 📁 Asset Checklist

- [ ] Logo: "SPEEDTYPE" in Space Mono Bold with cursor
- [ ] Favicon: Stylized "S" with speed lines
- [ ] OG Image: Dark background with glowing text
- [ ] Loading animation: Typing cursor with dots
- [ ] Achievement badges (10 designs)
- [ ] Keyboard heatmap visualization
- [ ] Error character highlight sprites

---

## 🔗 Design Inspiration Sources

1. **ttyper** - Terminal-based typing test aesthetics
2. **MonkeyType** - Clean, minimal UI patterns
3. **10FastFingers** - Competitive leaderboard UX
4. **Retro terminal UIs** - CRT effects, phosphor glow
5. **Racing games** - Speed meters, countdown timers

---

## CSS Variables (Implementation)

```css
:root {
  /* Colors */
  --color-primary: #00FF41;
  --color-error: #FF3131;
  --color-bg-dark: #0D0D0D;
  --color-bg-card: #1A1A1A;
  --color-text-muted: #4A4A4A;
  --color-accent-cyan: #00D9FF;
  --color-gold: #FFD700;
  
  /* Typography */
  --font-mono: 'JetBrains Mono', monospace;
  --font-display: 'Space Mono', monospace;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 48px;
  
  /* Effects */
  --glow-primary: 0 0 10px rgba(0, 255, 65, 0.5);
  --glow-error: 0 0 10px rgba(255, 49, 49, 0.5);
  
  /* Animation */
  --transition-fast: 100ms ease;
  --transition-normal: 200ms ease;
  --cursor-blink: 530ms;
}
```

---

*Design created: 2025-01-19*
*Version: 1.0*
*Status: Draft - Ready for implementation*
