# Proofi Photos — Design System v2.0
## "Your Photos, Forever Yours"

---

## 🎯 Design Philosophy

### Core Concept: **Crystalline Permanence**
Photos stored on Proofi aren't just files—they're **crystallized moments**, permanently etched into the decentralized web. Our design language reflects this through:
- **Glass morphism** with depth (not flat Apple-style)
- **Subtle crystalline patterns** suggesting blockchain permanence
- **Warm amber glow** = ownership/verification indicator
- **Liquid smooth animations** = premium confidence

### Differentiation from Apple Photos
| Apple Photos | Proofi Photos |
|--------------|---------------|
| Flat, minimal | Depth, layers, glass |
| White/gray dominance | Dark canvas, amber warmth |
| Hidden complexity | Visible ownership proof |
| iCloud lock-in | DDC freedom messaging |
| Static grids | Living, breathing layouts |

---

## 🎨 Color System

### Primary Palette
```css
:root {
  /* Deep Space Canvas - Not pure black, has warmth */
  --canvas-deepest: #0a0908;
  --canvas-deep: #121110;
  --canvas-base: #1a1918;
  --canvas-elevated: #242322;
  --canvas-surface: #2e2d2c;
  
  /* Amber Glow - Ownership & Verification */
  --amber-50: #fffbeb;
  --amber-100: #fef3c7;
  --amber-200: #fde68a;
  --amber-300: #fcd34d;
  --amber-400: #fbbf24;  /* Primary accent */
  --amber-500: #f59e0b;
  --amber-600: #d97706;
  --amber-glow: rgba(251, 191, 36, 0.15);
  --amber-glow-strong: rgba(251, 191, 36, 0.3);
  
  /* Crystal Accent - Blockchain/Permanence */
  --crystal-blue: #38bdf8;
  --crystal-teal: #2dd4bf;
  --crystal-gradient: linear-gradient(135deg, #38bdf8 0%, #2dd4bf 100%);
  
  /* Text */
  --text-primary: #fafaf9;
  --text-secondary: #a8a29e;
  --text-tertiary: #78716c;
  
  /* Semantic */
  --verified: #22c55e;
  --syncing: #f59e0b;
  --error: #ef4444;
}
```

### Gradients
```css
/* Hero Gradient - For headers, featured content */
--gradient-hero: linear-gradient(
  135deg,
  rgba(251, 191, 36, 0.08) 0%,
  rgba(56, 189, 248, 0.04) 50%,
  rgba(45, 212, 191, 0.06) 100%
);

/* Glass Surface */
--gradient-glass: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.08) 0%,
  rgba(255, 255, 255, 0.02) 100%
);

/* Ownership Beam - Subtle animated glow */
--gradient-ownership: linear-gradient(
  90deg,
  transparent 0%,
  var(--amber-glow-strong) 50%,
  transparent 100%
);
```

---

## 📐 Typography

### Font Stack
```css
/* Primary: Modern geometric sans */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Display: For headlines, dramatic moments */
--font-display: 'Instrument Sans', 'Inter', sans-serif;

/* Mono: For blockchain hashes, technical */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Scale
| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `display-xl` | 48px | 600 | Hero headlines |
| `display-lg` | 36px | 600 | Section titles |
| `display-md` | 28px | 600 | Page titles |
| `heading-lg` | 24px | 500 | Card headers |
| `heading-md` | 20px | 500 | Subsections |
| `body-lg` | 16px | 400 | Primary content |
| `body-md` | 14px | 400 | Secondary content |
| `caption` | 12px | 400 | Metadata, timestamps |
| `micro` | 10px | 500 | Badges, pills |

---

## 🪟 Glass Morphism Components

### Glass Panel (Elevated Surface)
```css
.glass-panel {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  backdrop-filter: blur(40px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

### Glass Card (Photo Container)
```css
.glass-card {
  background: rgba(30, 29, 28, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-card:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: var(--amber-400);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--amber-400),
    0 0 60px var(--amber-glow);
}
```

---

## 🔷 Signature Element: Ownership Beacon

### The "Proof Crystal"
A unique visual indicator showing DDC ownership. Appears as a small crystalline icon that pulses gently when verified.

```css
.proof-crystal {
  width: 20px;
  height: 20px;
  position: relative;
  
  /* Hexagonal crystal shape */
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: var(--crystal-gradient);
  
  /* Gentle pulse animation */
  animation: crystal-pulse 3s ease-in-out infinite;
}

@keyframes crystal-pulse {
  0%, 100% { 
    opacity: 0.8;
    filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.3));
  }
  50% { 
    opacity: 1;
    filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.6));
  }
}

/* Verified state - adds amber glow */
.proof-crystal.verified {
  background: linear-gradient(135deg, var(--amber-400) 0%, var(--amber-500) 100%);
  animation: verified-pulse 2s ease-in-out infinite;
}

@keyframes verified-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(251, 191, 36, 0.8));
  }
}
```

---

## 🎭 Micro-Interactions

### 1. Photo Hover - "Lift & Glow"
```css
.photo-item {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.photo-item:hover {
  transform: translateY(-8px) scale(1.03);
  z-index: 10;
}

.photo-item:hover::after {
  content: '';
  position: absolute;
  inset: -20px;
  background: radial-gradient(
    ellipse at center,
    var(--amber-glow) 0%,
    transparent 70%
  );
  z-index: -1;
  opacity: 0;
  animation: glow-in 0.3s ease-out forwards;
}
```

### 2. Selection - "Crystal Lock"
When photo is selected, a crystalline overlay confirms it's "locked in":
```css
.photo-item.selected::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(56, 189, 248, 0.1) 0%,
    rgba(45, 212, 191, 0.1) 100%
  );
  border: 2px solid var(--crystal-blue);
  border-radius: inherit;
  animation: lock-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes lock-in {
  0% { transform: scale(1.1); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
```

### 3. Upload - "Crystal Formation"
Photos materializing as they upload:
```css
@keyframes crystallize {
  0% {
    opacity: 0;
    transform: scale(0.8) rotate(-5deg);
    filter: blur(10px);
  }
  50% {
    filter: blur(5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
    filter: blur(0);
  }
}
```

### 4. Verification Complete - "Ownership Confirmed"
```css
@keyframes ownership-confirmed {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Ripple effect from the proof crystal */
.proof-crystal.just-verified::after {
  content: '';
  position: absolute;
  inset: -10px;
  border: 2px solid var(--amber-400);
  border-radius: 50%;
  animation: verify-ripple 0.8s ease-out;
}

@keyframes verify-ripple {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}
```

### 5. Scroll Momentum - "Parallax Depth"
```javascript
// Photos at different depths move at different speeds
// Creates a sense of dimensional space
const parallaxLayers = {
  featured: 1.0,    // Full speed
  recent: 0.95,     // Slightly slower
  background: 0.85  // Slowest
};
```

---

## 📱 Layout System

### Grid Specifications
```css
/* Masonry-inspired fluid grid */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  
  /* Featured photos span more */
  .featured { grid-column: span 2; grid-row: span 2; }
}

/* Timeline View - Horizontal flow with date grouping */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.timeline-group {
  position: relative;
  padding-left: 80px;
}

.timeline-date {
  position: absolute;
  left: 0;
  top: 0;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  color: var(--text-tertiary);
  font-size: var(--caption);
  font-weight: 500;
}
```

### Sidebar
```css
.sidebar {
  width: 260px;
  background: var(--canvas-deep);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  padding: 24px 16px;
  
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.sidebar-item.active {
  background: var(--amber-glow);
  color: var(--amber-400);
}
```

---

## 🎪 Memories Carousel

### "Crystallized Moments"
Featured memories appear as floating glass cards with depth:

```css
.memories-carousel {
  position: relative;
  height: 320px;
  perspective: 1200px;
}

.memory-card {
  position: absolute;
  width: 280px;
  height: 280px;
  border-radius: 24px;
  overflow: hidden;
  
  /* Glass effect */
  background: rgba(30, 29, 28, 0.8);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  /* Depth shadows */
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.5),
    0 10px 20px rgba(0, 0, 0, 0.3);
  
  /* 3D positioning */
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.memory-card:hover {
  transform: translateZ(40px) rotateY(-5deg);
}

/* Stacked card effect */
.memory-card:nth-child(1) { z-index: 3; }
.memory-card:nth-child(2) { 
  z-index: 2; 
  transform: translateX(60px) translateZ(-30px) scale(0.95);
}
.memory-card:nth-child(3) { 
  z-index: 1; 
  transform: translateX(120px) translateZ(-60px) scale(0.9);
}
```

---

## 🔐 DDC Ownership UI

### Ownership Badge
```css
.ownership-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 6px;
  
  background: linear-gradient(
    135deg,
    rgba(56, 189, 248, 0.15) 0%,
    rgba(45, 212, 191, 0.15) 100%
  );
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 20px;
  
  font-size: var(--micro);
  font-family: var(--font-mono);
  color: var(--crystal-blue);
}

.ownership-badge .hash {
  opacity: 0.7;
}

/* Tooltip showing full proof on hover */
.ownership-badge:hover .full-proof {
  display: block;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  
  padding: 12px 16px;
  background: var(--canvas-surface);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  
  font-family: var(--font-mono);
  font-size: 11px;
  white-space: nowrap;
}
```

### Storage Indicator
```css
.storage-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  
  background: var(--canvas-elevated);
  border-radius: 16px;
}

.storage-bar {
  flex: 1;
  height: 6px;
  background: var(--canvas-surface);
  border-radius: 3px;
  overflow: hidden;
}

.storage-fill {
  height: 100%;
  background: var(--crystal-gradient);
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.storage-label {
  font-size: var(--caption);
  color: var(--text-secondary);
}
```

---

## 🌟 Premium Touches

### 1. Ambient Background
Subtle animated gradient that responds to content:
```css
.ambient-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: var(--canvas-deepest);
  
  /* Noise texture for depth */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('data:image/svg+xml,<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
    opacity: 0.03;
    mix-blend-mode: overlay;
  }
  
  /* Animated gradient orbs */
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: 
      radial-gradient(ellipse at 20% 30%, var(--amber-glow) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 70%, rgba(56, 189, 248, 0.05) 0%, transparent 40%);
    animation: ambient-drift 30s ease-in-out infinite;
  }
}

@keyframes ambient-drift {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(-5%, 5%); }
  66% { transform: translate(5%, -5%); }
}
```

### 2. Cursor Trail (Optional - Performance Consider)
```javascript
// Subtle amber particle trail on hover over photos
document.querySelectorAll('.photo-item').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    createParticle(e.clientX, e.clientY);
  });
});
```

### 3. Sound Design (Future Enhancement)
- Soft "crystalline chime" on verification complete
- Subtle "whoosh" on photo navigation
- Gentle "click" on selection

---

## 📦 Component Library

### Buttons
```css
/* Primary CTA */
.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--amber-400) 0%, var(--amber-500) 100%);
  color: var(--canvas-deepest);
  font-weight: 600;
  border-radius: 12px;
  border: none;
  
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(251, 191, 36, 0.4);
}

/* Secondary / Glass */
.btn-secondary {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  color: var(--text-primary);
  font-weight: 500;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}
```

### Input Fields
```css
.input {
  padding: 14px 18px;
  background: var(--canvas-elevated);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: var(--text-primary);
  
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--amber-400);
  box-shadow: 0 0 0 3px var(--amber-glow);
}
```

### Pills / Tags
```css
.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  
  background: rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  
  font-size: var(--caption);
  color: var(--text-secondary);
}

.pill.active {
  background: var(--amber-glow);
  color: var(--amber-400);
}
```

---

## 🎬 Page Transitions

### Route Change
```css
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.page-exit {
  opacity: 1;
}

.page-exit-active {
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.2s ease;
}
```

---

## 🔮 Future Enhancements

1. **AR Mode** - View memories in physical space
2. **Timeline Scrubber** - Visual time travel through your collection
3. **Collaborative Memories** - Shared albums with ownership proof
4. **NFT Export** - One-click mint verified photos
5. **AI Stories** - Auto-generated narratives from photo collections

---

## 📝 Design Tokens Summary

```css
:root {
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
  
  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.5);
  
  /* Transitions */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
}
```

---

*Design System v2.0 — Proofi Photos*
*"Your Photos, Forever Yours"*
