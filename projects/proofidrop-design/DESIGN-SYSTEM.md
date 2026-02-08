# ProofiDrop Design System
## Wallet-to-Wallet File Transfer — Visual Identity v2.0

---

## 🎯 Design Philosophy

**Core Concept: "Secure Gravity"**
Files don't just transfer — they *drop* through encrypted channels like water through a secure pipeline. The visual language combines:
- **Fluidity** — Smooth, organic movements
- **Weight** — Files have presence and gravity
- **Shield** — Every element feels protected
- **Magic** — The complexity is hidden; it just works

**Personality Pillars:**
1. **Confident, not cold** — Security doesn't mean sterile
2. **Playful, not childish** — WeTransfer vibes, grown up
3. **Mysterious, not confusing** — Encryption as magic, not math

---

## 🎨 Color System

### Primary Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Void Black** | `#0A0A0F` | Primary background |
| **Deep Space** | `#12121A` | Card backgrounds |
| **Nebula** | `#1A1A28` | Elevated surfaces |

### Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Drop Cyan** | `#00E5CC` | Primary actions, success |
| **Drop Cyan Glow** | `rgba(0, 229, 204, 0.2)` | Glows, shadows |
| **Pulse Violet** | `#8B5CF6` | Secondary, receiving |
| **Warning Amber** | `#F59E0B` | Alerts, limits |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Secure Green** | `#10B981` | Encryption verified |
| **Error Red** | `#EF4444` | Errors, destructive |
| **Ghost White** | `rgba(255,255,255,0.87)` | Primary text |
| **Mist Gray** | `rgba(255,255,255,0.5)` | Secondary text |

### Gradients

```css
/* Primary gradient - for main CTA and dropzone active state */
--gradient-drop: linear-gradient(135deg, #00E5CC 0%, #00B4A2 50%, #8B5CF6 100%);

/* Subtle background gradient */
--gradient-void: radial-gradient(ellipse at top, #1A1A28 0%, #0A0A0F 70%);

/* Security shield gradient */
--gradient-shield: linear-gradient(180deg, rgba(0,229,204,0.1) 0%, transparent 100%);
```

---

## ✨ Typography

### Font Stack

```css
--font-display: 'Space Grotesk', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Hero** | 48px | 700 | 1.1 | Main title |
| **H1** | 32px | 600 | 1.2 | Section headers |
| **H2** | 24px | 600 | 1.3 | Card titles |
| **H3** | 18px | 500 | 1.4 | Subsections |
| **Body** | 16px | 400 | 1.5 | Paragraphs |
| **Small** | 14px | 400 | 1.4 | Labels, hints |
| **Micro** | 12px | 500 | 1.3 | Badges, tags |
| **Mono** | 14px | 400 | 1.5 | Addresses, hashes |

---

## 🫧 The Drop Motif

### Visual Elements

**1. The Drop Shape**
A water droplet silhouette used throughout:
- Logo mark
- Loading states
- Success indicators
- Background patterns

```svg
<!-- Base drop shape -->
<path d="M12 2C12 2 4 10 4 15C4 19.4183 7.58172 23 12 23C16.4183 23 20 19.4183 20 15C20 10 12 2 12 2Z"/>
```

**2. Ripple Effect**
When files drop, ripples emanate from the impact point:
- 3 concentric circles
- Fade out + scale up
- 0.6s duration, ease-out

**3. Gravity Lines**
Subtle vertical lines suggesting downward motion:
- During file upload
- In loading states
- As background texture

---

## 🎭 Component Design

### Dropzone

**States:**
1. **Idle** — Dashed border, muted colors, subtle pulse animation
2. **Hover** — Border solid, glow intensifies, drop icon bounces
3. **Active (dragging)** — Gradient border, strong glow, "pull" animation
4. **Uploading** — Progress ring, gravity lines, percentage
5. **Complete** — Ripple burst, checkmark morph, success green

```css
.dropzone {
  background: var(--deep-space);
  border: 2px dashed rgba(0, 229, 204, 0.3);
  border-radius: 24px;
  padding: 48px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropzone:hover {
  border-color: var(--drop-cyan);
  box-shadow: 
    0 0 40px rgba(0, 229, 204, 0.15),
    inset 0 0 60px rgba(0, 229, 204, 0.05);
}

.dropzone.active {
  border-style: solid;
  background: linear-gradient(var(--deep-space), var(--deep-space)) padding-box,
              var(--gradient-drop) border-box;
  border-color: transparent;
}
```

### Send/Receive Tabs

**Design:** Pill-shaped toggle with sliding indicator

```css
.tab-group {
  background: var(--nebula);
  border-radius: 16px;
  padding: 4px;
  display: inline-flex;
}

.tab {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.tab.active {
  background: var(--gradient-drop);
  color: var(--void-black);
}
```

**Icons:**
- Send: Arrow curving up + droplet
- Receive: Arrow curving down into hand

### File Card

**Showing uploaded/received files:**

```css
.file-card {
  background: var(--nebula);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 16px;
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 16px;
  align-items: center;
}

.file-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--gradient-shield);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Lock overlay for encrypted files */
.file-icon::after {
  content: '🔐';
  position: absolute;
  bottom: -4px;
  right: -4px;
  font-size: 14px;
}
```

### Security Badge

**Trust indicators throughout the UI:**

```css
.security-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 100px;
  font-size: 12px;
  color: var(--secure-green);
}

.security-badge::before {
  content: '';
  width: 8px;
  height: 8px;
  background: var(--secure-green);
  border-radius: 50%;
  animation: pulse 2s infinite;
}
```

### Wallet Address Input

**Truncated with copy functionality:**

```css
.wallet-input {
  background: var(--void-black);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--ghost-white);
  transition: all 0.2s ease;
}

.wallet-input:focus {
  border-color: var(--drop-cyan);
  box-shadow: 0 0 0 3px rgba(0, 229, 204, 0.15);
}

.wallet-input.valid {
  border-color: var(--secure-green);
}
```

---

## 🎬 Animations & Micro-interactions

### Keyframes Library

```css
/* Gentle pulse for idle states */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Drop bounce for icons */
@keyframes dropBounce {
  0% { transform: translateY(-20px); opacity: 0; }
  50% { transform: translateY(5px); }
  100% { transform: translateY(0); opacity: 1; }
}

/* Ripple effect on success */
@keyframes ripple {
  0% { transform: scale(0); opacity: 0.8; }
  100% { transform: scale(2); opacity: 0; }
}

/* Gravity fall for uploading */
@keyframes gravityFall {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

/* Shield shimmer for security elements */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* Float for waiting states */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

### Interaction Choreography

| Action | Animation | Duration | Easing |
|--------|-----------|----------|--------|
| File drop | Bounce + Ripple | 0.5s | cubic-bezier(0.34, 1.56, 0.64, 1) |
| Tab switch | Slide + Fade | 0.3s | ease-out |
| Upload progress | Gravity lines flow | Continuous | linear |
| Success | Checkmark draw + Ripple | 0.6s | ease-out |
| Copy address | Tooltip slide up | 0.2s | ease-out |
| Hover glow | Glow intensity | 0.3s | ease |

---

## 🛡️ Trust Indicators

### Visual Trust Language

**1. Encryption Status**
Always visible, never hidden:
- 🔒 "End-to-end encrypted" badge in header
- Lock icon on all file cards
- Green pulse when encryption verified

**2. Connection Status**
```
Connected: Green dot + wallet avatar
Connecting: Cyan spinner
Disconnected: Gray dot + "Connect" CTA
```

**3. Progress Transparency**
- Show exact bytes transferred
- Display connection quality
- Estimate time remaining honestly

---

## 📐 Layout & Spacing

### Grid System

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;

--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;
```

### Container Widths

```css
--container-sm: 480px;   /* Single action modals */
--container-md: 640px;   /* Main drop interface */
--container-lg: 800px;   /* With sidebar */
```

---

## 🌊 Background Treatment

### Animated Background

Subtle, performant background that adds depth:

```css
.background {
  position: fixed;
  inset: 0;
  background: var(--gradient-void);
  overflow: hidden;
}

/* Floating drops - CSS only, no JS */
.background::before,
.background::after {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,229,204,0.03) 0%, transparent 70%);
  animation: float 20s infinite ease-in-out;
}

.background::before {
  top: 10%;
  left: 20%;
  animation-delay: -5s;
}

.background::after {
  bottom: 20%;
  right: 15%;
  animation-duration: 25s;
}
```

---

## 📱 Responsive Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

### Mobile Adaptations

- Dropzone becomes full-width
- Tabs stack or become bottom nav
- File cards simplify to essential info
- Touch targets minimum 44px

---

## 🎯 Unique Identity Elements

### 1. The "Drop Signature"
A unique visual that appears when transfer completes — like a wax seal:
- Combines sender + receiver wallet fragments
- Creates unique pattern per transfer
- Can be used as transfer receipt

### 2. Encryption Visualization
When file is being encrypted, show:
- File icon fragmenting into particles
- Particles reforming as locked package
- Shield wrapping around the package

### 3. Sound Design (Optional)
- Soft "plop" on successful drop
- Subtle whoosh during upload
- Gentle chime on receive

---

## 🔗 Proofi Ecosystem Integration

### Shared Elements with Proofi Core
- Same font stack (Space Grotesk + Inter)
- Same dark theme base
- Cyan as primary action color
- Consistent wallet connection UI

### ProofiDrop Differentiators
- More playful, less corporate
- Drop/water motifs unique to this product
- Purple as secondary (receiving) color
- More animation and delight

---

## ✅ Implementation Checklist

- [ ] Set up CSS custom properties
- [ ] Implement dropzone states
- [ ] Create tab component with sliding indicator
- [ ] Build file card component
- [ ] Add security badges
- [ ] Implement animations
- [ ] Add background treatment
- [ ] Test on mobile
- [ ] Verify accessibility (contrast, focus states)
- [ ] Add loading/error states

---

*Design System v2.0 — ProofiDrop*
*"Secure drops, made magical"*
