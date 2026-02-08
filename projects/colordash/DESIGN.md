# 🎨 ColorDash - Visual Identity Design

> Stroop Effect Color Reaction Game

---

## 🎯 Design Philosophy

**Brain meets fun.** ColorDash is een cognitieve uitdaging verpakt in speelse, bold visuals. Het design moet:
- Instant herkenbaar zijn (color-forward)
- Snelle reacties aanmoedigen (clean, duidelijke targets)
- Spanning opbouwen (streak/score visuals)
- Toegankelijk blijven onder druk

---

## 🌈 Color Palette

### Primary Game Colors (The Stroop 4)
```css
:root {
  --color-red:    #FF3B3B;  /* Energetic vermillion */
  --color-blue:   #3B82F6;  /* Electric azure */
  --color-yellow: #FBBF24;  /* Vibrant gold */
  --color-green:  #22C55E;  /* Fresh lime */
}
```

### UI Colors
```css
:root {
  --bg-dark:      #0F0F1A;  /* Deep space purple-black */
  --bg-card:      #1A1A2E;  /* Elevated card surface */
  --text-primary: #FFFFFF;  /* Pure white */
  --text-muted:   #9CA3AF;  /* Soft gray */
  --accent-glow:  #A855F7;  /* Purple accent for streaks */
  --success:      #10B981;  /* Correct answer flash */
  --error:        #EF4444;  /* Wrong answer flash */
}
```

### Color Button States
| State | Effect |
|-------|--------|
| Idle | Solid color, subtle inner shadow |
| Hover | Slight scale (1.05), glow ring |
| Pressed | Scale down (0.95), darker shade |
| Correct | Green pulse overlay, confetti particles |
| Wrong | Red shake animation, brief red overlay |

---

## ✏️ Typography

### Font Stack
```css
--font-display: 'Fredoka', 'Nunito', sans-serif;
--font-body: 'Inter', 'SF Pro', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Scale
| Element | Size | Weight | Use |
|---------|------|--------|-----|
| Game Title | 48px | 700 | Logo, start screen |
| Color Word | 72px | 800 | The Stroop word display |
| Score Counter | 36px | 600 | Current score |
| Streak Badge | 24px | 700 | Streak indicator |
| Button Text | 20px | 600 | Color buttons |
| UI Labels | 14px | 500 | Secondary info |

### Style Notes
- **Fredoka** for playful, rounded headers
- All caps for color words (ROOD, BLAUW, etc.)
- Tabular numbers for scores (consistent width)

---

## 🎮 Core UI Components

### 1. Color Word Display
```
┌─────────────────────────────────┐
│                                 │
│           BLAUW                 │  ← Word in WRONG color
│        (displayed in RED)       │
│                                 │
└─────────────────────────────────┘
```
- Centered, massive text
- Subtle text-shadow for depth
- Background: dark with radial gradient glow

### 2. Color Buttons (4-button grid)
```
┌───────────────────────────────────────┐
│                                       │
│   ┌─────────┐      ┌─────────┐       │
│   │  ROOD   │      │  BLAUW  │       │
│   │   🔴    │      │   🔵    │       │
│   └─────────┘      └─────────┘       │
│                                       │
│   ┌─────────┐      ┌─────────┐       │
│   │  GEEL   │      │  GROEN  │       │
│   │   🟡    │      │   🟢    │       │
│   └─────────┘      └─────────┘       │
│                                       │
└───────────────────────────────────────┘
```
- Large touch targets (min 80x80px)
- Rounded corners (16px radius)
- White text on colored background
- Gap: 16px between buttons

### 3. Score Counter
```
┌──────────────────┐
│  ⭐ SCORE: 42    │
└──────────────────┘
```
- Top-right position
- Animated number flip on change
- Golden glow on milestones (10, 25, 50, 100)

### 4. Streak Indicator
```
┌─────────────────────────────┐
│  🔥 STREAK: 7  ████████░░   │
└─────────────────────────────┘
```
- Fire emoji + count
- Progress bar fills toward bonus
- Purple glow when streak > 5
- Shake animation when broken

### 5. Timer Bar
```
━━━━━━━━━━━━━━━━━━━░░░░░
```
- Full width, 6px height
- Gradient from green → yellow → red as time runs out
- Smooth animation, no jitter

---

## 📐 Layout Structure

### Mobile-First Game Screen
```
┌────────────────────────────────┐
│  [←]              ⭐ 42  🔥 7  │  Header: 60px
├────────────────────────────────┤
│                                │
│                                │
│            ROOD                │  Word Zone: flex-grow
│         (in BLUE)              │
│                                │
│                                │
├────────────────────────────────┤
│  ━━━━━━━━━━━━━━━━━░░░░         │  Timer: 40px
├────────────────────────────────┤
│                                │
│   [ROOD]    [BLAUW]            │
│                                │  Buttons: 200px
│   [GEEL]    [GROEN]            │
│                                │
└────────────────────────────────┘
```

### Desktop Adaptation
- Max-width: 480px centered
- Keyboard support (R/B/Y/G or 1/2/3/4)
- Larger word display (96px)

---

## ✨ Animations & Micro-interactions

### Correct Answer
```css
@keyframes correct-pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 var(--success); }
  50% { transform: scale(1.1); box-shadow: 0 0 30px 10px var(--success); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 transparent; }
}
```
- Duration: 300ms
- Confetti burst (10-15 particles)
- Score number bounces

### Wrong Answer
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
```
- Duration: 400ms
- Screen briefly flashes red (opacity 0.2)
- Streak counter falls with gravity

### Streak Fire
- At streak 5+: Fire emoji pulses
- At streak 10+: Background gets subtle animated gradient
- At streak 20+: Screen edges glow purple

### Timer Urgency
- Last 3 seconds: Timer bar pulses
- Last 1 second: Heartbeat effect on word

---

## 🎵 Sound Design Notes (Optional)

| Event | Sound |
|-------|-------|
| Correct | Quick "ping" (C major chord) |
| Wrong | Low "buzz" (short, not annoying) |
| Streak +1 | Rising tone |
| Streak lost | Descending womp |
| New high score | Fanfare jingle |

---

## 📱 Responsive Breakpoints

```css
/* Mobile (default) */
@media (min-width: 375px) { }

/* Large mobile */  
@media (min-width: 428px) { }

/* Tablet/Desktop */
@media (min-width: 768px) {
  /* Center game, larger typography */
}
```

---

## 🧩 Component Checklist

- [ ] `<ColorWord />` - Displays the Stroop word
- [ ] `<ColorButton />` - Single color button
- [ ] `<ButtonGrid />` - 2x2 button layout
- [ ] `<ScoreDisplay />` - Current score
- [ ] `<StreakMeter />` - Streak count + progress
- [ ] `<TimerBar />` - Countdown visualization
- [ ] `<GameOverModal />` - Final score, high score, replay
- [ ] `<StartScreen />` - Title, play button, settings
- [ ] `<Confetti />` - Celebration particles

---

## 🖼️ Visual Mockup (ASCII)

```
╔════════════════════════════════════════╗
║  ←                        ⭐ 23   🔥 5 ║
╠════════════════════════════════════════╣
║                                        ║
║                                        ║
║              G R O E N                 ║
║            (in bright RED)             ║
║                                        ║
║                                        ║
╠════════════════════════════════════════╣
║  ━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░       ║
╠════════════════════════════════════════╣
║                                        ║
║     ┌─────────┐    ┌─────────┐        ║
║     │  ROOD   │    │  BLAUW  │        ║
║     └─────────┘    └─────────┘        ║
║     ┌─────────┐    ┌─────────┐        ║
║     │  GEEL   │    │  GROEN  │        ║
║     └─────────┘    └─────────┘        ║
║                                        ║
╚════════════════════════════════════════╝
```

---

## 🚀 Implementation Priority

1. **MVP**: Word display + 4 buttons + basic scoring
2. **Polish**: Animations, timer, streak system
3. **Delight**: Confetti, sounds, high score persistence
4. **Extra**: Difficulty levels, color-blind mode, leaderboard

---

## ♿ Accessibility: Color-Blind Mode

> **Problem**: ~8% of men have color vision deficiency. A color-matching game is unplayable without visual alternatives.

### Pattern System

Each color gets a unique, recognizable pattern overlay:

| Color | Pattern | CSS Technique | Visual |
|-------|---------|---------------|--------|
| 🔴 Red | Diagonal stripes (///) | 45° repeating gradient | `///` |
| 🔵 Blue | Horizontal stripes (===) | 0° repeating gradient | `===` |
| 🟡 Yellow | Dots (• • •) | Radial gradient dots | `• • •` |
| 🟢 Green | Vertical stripes (\|\|\|) | 90° repeating gradient | `|||` |

### Implementation

```css
/* Color-blind pattern overlays */
.cb-mode .pattern-red::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(255,255,255,0.35) 5px,
    rgba(255,255,255,0.35) 10px
  );
  pointer-events: none;
  border-radius: inherit;
}

.cb-mode .pattern-blue::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 6px,
    rgba(255,255,255,0.35) 6px,
    rgba(255,255,255,0.35) 12px
  );
  pointer-events: none;
  border-radius: inherit;
}

.cb-mode .pattern-yellow::after {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 25% 25%, rgba(255,255,255,0.4) 3px, transparent 3px),
    radial-gradient(circle at 75% 25%, rgba(255,255,255,0.4) 3px, transparent 3px),
    radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 3px, transparent 3px),
    radial-gradient(circle at 25% 75%, rgba(255,255,255,0.4) 3px, transparent 3px),
    radial-gradient(circle at 75% 75%, rgba(255,255,255,0.4) 3px, transparent 3px);
  pointer-events: none;
  border-radius: inherit;
}

.cb-mode .pattern-green::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 6px,
    rgba(255,255,255,0.35) 6px,
    rgba(255,255,255,0.35) 12px
  );
  pointer-events: none;
  border-radius: inherit;
}
```

### Word Display Enhancement

In color-blind mode, the displayed word also shows a pattern indicator:

```
┌─────────────────────────────────┐
│                                 │
│     /// BLAUW ///               │  ← Pattern symbols around word
│        (in RED with ///)        │
│                                 │
└─────────────────────────────────┘
```

### Settings Toggle

```
┌──────────────────────────────────────┐
│  ⚙️ Settings                         │
├──────────────────────────────────────┤
│                                      │
│  Color-Blind Mode          [  🔘  ]  │
│  Adds patterns to colors             │
│                                      │
│  Pattern Legend:                     │
│  /// = Red   === = Blue              │
│  • • = Yellow ||| = Green            │
│                                      │
└──────────────────────────────────────┘
```

### Design Principles

1. **Patterns are subtle but visible** - 35% white opacity
2. **Patterns don't interfere with color** - overlay, not replacement
3. **Each pattern is visually distinct** - testable in grayscale
4. **Persisted preference** - localStorage remembers setting
5. **Works on word AND buttons** - consistent visual language

### Grayscale Test

The game should be fully playable with monitor in grayscale mode when color-blind mode is enabled. Each button should be distinguishable by pattern alone.

---

*Design by ColorDash Design Agent • 2025*
