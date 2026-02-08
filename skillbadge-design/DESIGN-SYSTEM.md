# 🏆 SkillBadge Design System

## Brand Identity

**Tagline:** *"Level up your learning"*

**Personality:** Friendly, motivating, celebratory, accessible

---

## 🎨 Color Palette

### Primary Gradient (Hero/CTA)
```css
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
/* Vibrant purple-blue - represents growth & wisdom */
```

### Achievement Tiers
```css
--bronze: linear-gradient(135deg, #cd7f32 0%, #8b4513 100%);
--silver: linear-gradient(135deg, #c0c0c0 0%, #808080 100%);
--gold: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
--platinum: linear-gradient(135deg, #e5e4e2 0%, #a0b2c6 100%);
--diamond: linear-gradient(135deg, #b9f2ff 0%, #89cff0 100%);
```

### Semantic Colors
```css
--success: #10b981;      /* Emerald - completion */
--progress: #f59e0b;     /* Amber - in progress */
--locked: #9ca3af;       /* Gray - not yet available */
--xp-blue: #3b82f6;      /* XP points accent */
--streak-orange: #f97316; /* Streak flames */
```

### Backgrounds
```css
--bg-dark: #0f172a;      /* Slate 900 - night mode */
--bg-light: #f8fafc;     /* Slate 50 - day mode */
--card-dark: #1e293b;
--card-light: #ffffff;
```

---

## 📝 Typography

### Font Stack
```css
--font-display: 'Nunito', 'Quicksand', sans-serif;  /* Headings - friendly rounded */
--font-body: 'Inter', 'Open Sans', sans-serif;       /* Body - clean readability */
--font-mono: 'JetBrains Mono', monospace;            /* Code/stats */
```

### Scale
```css
--text-xs: 0.75rem;    /* 12px - metadata */
--text-sm: 0.875rem;   /* 14px - captions */
--text-base: 1rem;     /* 16px - body */
--text-lg: 1.125rem;   /* 18px - lead */
--text-xl: 1.25rem;    /* 20px - h4 */
--text-2xl: 1.5rem;    /* 24px - h3 */
--text-3xl: 1.875rem;  /* 30px - h2 */
--text-4xl: 2.25rem;   /* 36px - h1 */
--text-5xl: 3rem;      /* 48px - hero */
```

---

## 🏅 Badge Component Design

### Badge Anatomy
```
┌─────────────────────────────────────┐
│         ✨ Glow Effect ✨           │
│    ┌─────────────────────────┐     │
│    │    🎯 Icon/Symbol       │     │
│    │    (centered, 48px)     │     │
│    └─────────────────────────┘     │
│         Badge Name                  │
│         ★★★☆☆ (tier stars)         │
└─────────────────────────────────────┘
```

### Badge States
| State    | Visual Treatment                           |
|----------|-------------------------------------------|
| Locked   | Grayscale, slight blur, padlock overlay   |
| Available| Subtle pulse animation, full color        |
| Earned   | Full color + glow + confetti on unlock    |
| Mastered | Rainbow shimmer border animation          |

### Badge CSS Example
```css
.badge {
  width: 120px;
  height: 140px;
  border-radius: 16px;
  background: var(--card-dark);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  transition: transform 0.2s, box-shadow 0.3s;
}

.badge:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
}

.badge--gold {
  border: 3px solid transparent;
  background: 
    linear-gradient(var(--card-dark), var(--card-dark)) padding-box,
    var(--gold) border-box;
}

.badge--earned::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 20px;
  background: var(--gradient-primary);
  filter: blur(12px);
  opacity: 0.4;
  z-index: -1;
}
```

---

## 📊 Progress UI Components

### XP Progress Bar
```
┌──────────────────────────────────────────────┐
│ Level 12                      2,450 / 3,000 XP│
│ [████████████████████░░░░░░░░░░░░░] 82%      │
└──────────────────────────────────────────────┘
```

```css
.progress-bar {
  height: 24px;
  border-radius: 12px;
  background: rgba(255,255,255,0.1);
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 12px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(rgba(255,255,255,0.3), transparent);
  border-radius: 12px 12px 0 0;
}
```

### Streak Counter
```
🔥 12 Day Streak!
   ○ ● ● ● ● ● ● (weekly dots)
```

### Skill Tree Node
```css
.skill-node {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 3px solid var(--locked);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.skill-node--completed {
  border-color: var(--success);
  background: radial-gradient(circle, rgba(16,185,129,0.2), transparent);
}

.skill-node--available {
  border-color: var(--gradient-primary);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 0 0 12px rgba(102, 126, 234, 0); }
}
```

---

## 🎮 Gamification Patterns

### Achievement Popup
```
┌────────────────────────────────────────────┐
│  🎉 ACHIEVEMENT UNLOCKED!                   │
│                                             │
│      [🏆 Gold Badge Animation]              │
│                                             │
│      "Code Warrior"                         │
│      Complete 50 coding challenges          │
│                                             │
│      +500 XP  •  🔓 New skill unlocked     │
│                                             │
│         [ Share ]  [ Continue ]             │
└────────────────────────────────────────────┘
```

### Leaderboard Row
```css
.leaderboard-row {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 16px;
  border-radius: 12px;
  background: var(--card-dark);
}

.rank-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-1 { background: var(--gold); color: #000; }
.rank-2 { background: var(--silver); color: #000; }
.rank-3 { background: var(--bronze); color: #fff; }
```

---

## 📱 Responsive Breakpoints

```css
--mobile: 375px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1440px;
```

---

## ✨ Micro-interactions

| Action           | Animation                                    |
|------------------|---------------------------------------------|
| Badge unlock     | Scale up 1.2x → bounce → confetti burst    |
| XP gain          | Numbers fly up and fade (+50 XP)           |
| Level up         | Screen flash + particle explosion          |
| Streak extend    | Fire emoji pulse + streak number increment |
| Button hover     | Subtle lift + glow intensify               |
| Card hover       | Lift 4px + shadow expand                   |

---

## 🎯 Key Screens

1. **Dashboard** - Today's progress, streak, recent badges
2. **Badge Collection** - Grid view with filters (earned/locked/category)
3. **Skill Tree** - Visual path of learning progression
4. **Profile** - Stats, level, total XP, showcase badges
5. **Leaderboard** - Weekly/monthly/all-time rankings
6. **Achievement Detail** - Badge info, requirements, progress

---

## 📦 Tech Stack Recommendation

- **Framework:** Next.js 14 / React
- **Styling:** Tailwind CSS + custom CSS variables
- **Animations:** Framer Motion / React Spring
- **Icons:** Heroicons + custom badge SVGs
- **Charts:** Recharts (for progress visualization)

---

*Design System v1.0 - SkillBadge*
