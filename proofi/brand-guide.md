# Proofi.ai Brand Guide

*Living document — all Proofi design work must align with this.*

---

## Identity

- **Name**: Proofi (styled as `Proofi` with the `i` in accent color, or `Proof<span style="color: accent">i</span>`)
- **Tagline**: "Verified credentials. No middleman."
- **Domain**: proofi.ai
- **Logo mark**: ◇ (diamond) — inherited from CereProof, represents crystallized trust

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#FFFFFF` | Primary background |
| `--bg-off` | `#FAFAFA` | Section backgrounds, alternating rows |
| `--surface` | `#F5F5F5` | Cards on off-white, subtle surfaces |
| `--border` | `#E0E0E0` | Default borders |
| `--border-strong` | `#000000` | Emphasis borders, dividers |
| `--text` | `#0A0A0A` | Primary text |
| `--text-dim` | `#6B6B6B` | Secondary text, labels |
| `--text-muted` | `#999999` | Tertiary text, metadata |
| `--accent` | `#3B82F6` | Primary accent — buttons, links, highlights |
| `--accent-hover` | `#2563EB` | Accent hover state |
| `--accent-light` | `#60A5FA` | Lighter accent for subtle highlights |
| `--accent-bg` | `#3B82F610` | Accent background tint (6% opacity) |
| `--success` | `#10B981` | Verified states, positive actions |
| `--danger` | `#EF4444` | Errors, invalid states |
| `--warning` | `#F59E0B` | Pending states, cautions |

### Rules
- Background is ALWAYS white or off-white. Never dark mode (yet).
- Accent blue is used sparingly — CTAs, links, key highlights only.
- Text is near-black (`#0A0A0A`), not pure black for slight softness.
- High contrast is mandatory. No light-gray-on-white.

---

## Typography

### Font Stack
1. **Space Grotesk** — Headlines, navigation, labels, buttons
2. **Inter** — Body text, paragraphs, descriptions
3. **JetBrains Mono** — Code, addresses, technical data, metadata

### Scale

| Element | Font | Size | Weight | Letter-spacing | Line-height |
|---------|------|------|--------|----------------|-------------|
| Hero headline | Space Grotesk | 72–80px | 700 | -3px | 1.0 |
| Section headline | Space Grotesk | 40–48px | 700 | -2px | 1.1 |
| Card title | Space Grotesk | 11px | 700 | 2.5px | — |
| Nav items | Space Grotesk | 13–15px | 600–700 | 0.5–1px | — |
| Body text | Inter | 16–18px | 400 | 0 | 1.6 |
| Small body | Inter | 14px | 400 | 0 | 1.5 |
| Labels | Space Grotesk | 11px | 700 | 1.5–2.5px | — |
| Monospace data | JetBrains Mono | 12–13px | 400–500 | 0.5px | — |
| Tiny mono | JetBrains Mono | 10–11px | 400 | 1px | — |

### Rules
- Headlines use TIGHT line-heights (1.0–1.1). Never loose.
- Labels and nav items are UPPERCASE with wide letter-spacing.
- Body text uses comfortable 1.6 line-height.
- Never use more than 2 font weights on a single element.

---

## Spacing System

Base unit: **8px**

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Inline gaps, tight padding |
| `sm` | 8px | Small component gaps |
| `md` | 16px | Standard gaps, form spacing |
| `lg` | 24px | Section padding, card padding |
| `xl` | 32px | Major section gaps |
| `2xl` | 48px | Section separators |
| `3xl` | 64px | Page-level vertical rhythm |
| `4xl` | 80px | Hero/major section padding |

### Rules
- All spacing is multiples of 8px.
- Cards use 28–32px internal padding.
- Sections have 48–64px vertical gaps.
- Page max-width: **1080px** (content), **1200px** (with padding).

---

## Components

### Buttons

**Primary (CTA)**
```css
padding: 16px 32px;
background: #3B82F6;
color: #FFFFFF;
border: 2px solid #3B82F6;
border-radius: 0; /* ZERO. Always. */
font-family: 'Space Grotesk';
font-size: 14px;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 1px;
```

**Secondary**
```css
padding: 12px 24px;
background: transparent;
color: #0A0A0A;
border: 2px solid #E0E0E0;
border-radius: 0;
/* Same font rules as primary */
```

**Ghost/Text**
```css
padding: 8px 0;
background: transparent;
color: #6B6B6B;
border: none;
text-decoration: underline;
```

### Cards
```css
background: #FFFFFF;
border: 1px solid #E0E0E0;
border-radius: 0; /* ZERO */
padding: 28px;
```
- Hover: `border-color: #000000`
- Active/selected: `border-color: #3B82F6`

### Inputs
```css
background: #FFFFFF;
border: 1px solid #E0E0E0;
border-radius: 0;
padding: 12px 16px;
font-family: 'JetBrains Mono';
font-size: 13px;
```
- Focus: `border-color: #3B82F6`

### Badges / Tags
```css
display: inline-flex;
padding: 4px 12px;
border: 1px solid <color>;
color: <color>;
background: transparent;
border-radius: 0;
font-size: 11px;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 1px;
```

---

## Design Principles

1. **Zero rounded corners** — Every element is sharp. Rectangles only. This is non-negotiable.
2. **Brutalist-light** — Structure over decoration. Bold typography carries the design. Minimal flourish.
3. **High information density** — Show data, don't hide it. Monospace for technical values.
4. **White space as design** — Let elements breathe. Don't fill every pixel.
5. **Professional, not crypto** — Clean SaaS aesthetic. Think Linear/Vercel, not DeFi dashboards.
6. **Borders over shadows** — Use borders for depth, never box-shadows.
7. **Animation is subtle** — Only hover transitions (0.15s) and essential loading states. No bouncing, no parallax.

---

## Don'ts

- ❌ No rounded corners. Ever.
- ❌ No box shadows.
- ❌ No gradients (except very subtle CSS-only decorative elements).
- ❌ No emoji in body text (UI icons in nav/badges are fine).
- ❌ No stock photos.
- ❌ No "crypto bro" aesthetics (dark themes, neon, blockchain graphics).
- ❌ No framework CSS (Tailwind classes in markup, Bootstrap, etc.).
- ❌ No heavy animations or scroll effects.

---

## File Structure

- Single HTML files with embedded `<style>` and `<script>`
- Google Fonts loaded via `<link>` (Space Grotesk, Inter, JetBrains Mono)
- No build step, no bundler, no framework
- Images: CSS-only where possible, SVG inline where needed

---

*Last updated: 2026-02-02*
