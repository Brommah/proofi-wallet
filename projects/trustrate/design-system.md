# TrustRate — Design System v1.0

## 🎨 Visuele Identiteit

### Brand Essence
**TrustRate** — Where Trust Meets Transparency  
Een platform waar geverifieerde reviews de standaard zijn, niet de uitzondering.

---

## 🎨 Kleurenpalet

### Primary Colors
| Naam | Hex | RGB | Gebruik |
|------|-----|-----|---------|
| **Deep Navy** | `#1A2B4A` | 26, 43, 74 | Headers, primary text, trust elements |
| **Royal Blue** | `#2B4A8C` | 43, 74, 140 | Interactive elements, links |
| **Ocean Blue** | `#3D5A9E` | 61, 90, 158 | Hover states, secondary actions |

### Accent Colors
| Naam | Hex | RGB | Gebruik |
|------|-----|-----|---------|
| **Warm Amber** | `#E8A838` | 232, 168, 56 | Stars, badges, CTAs, success |
| **Golden Honey** | `#F4C45A` | 244, 196, 90 | Highlights, premium features |
| **Sunset Orange** | `#E87B38` | 232, 123, 56 | Warnings, attention grabbers |

### Neutral Colors
| Naam | Hex | RGB | Gebruik |
|------|-----|-----|---------|
| **Pure White** | `#FFFFFF` | 255, 255, 255 | Backgrounds, cards |
| **Cloud White** | `#F8FAFC` | 248, 250, 252 | Page backgrounds |
| **Silver Mist** | `#E2E8F0` | 226, 232, 240 | Borders, dividers |
| **Slate Gray** | `#64748B` | 100, 116, 139 | Secondary text |
| **Charcoal** | `#334155` | 51, 65, 85 | Body text |

### Semantic Colors
| Status | Hex | Gebruik |
|--------|-----|---------|
| **Verified Green** | `#10B981` | Verified badges, success states |
| **Alert Red** | `#EF4444` | Errors, negative reviews indicator |

---

## 🔤 Typography

### Font Stack
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-display: 'Plus Jakarta Sans', 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| **H1 - Hero** | 48px / 3rem | 700 (Bold) | 1.1 |
| **H2 - Section** | 36px / 2.25rem | 600 (SemiBold) | 1.2 |
| **H3 - Card Title** | 24px / 1.5rem | 600 (SemiBold) | 1.3 |
| **H4 - Subtitle** | 18px / 1.125rem | 500 (Medium) | 1.4 |
| **Body Large** | 18px / 1.125rem | 400 (Regular) | 1.6 |
| **Body** | 16px / 1rem | 400 (Regular) | 1.6 |
| **Body Small** | 14px / 0.875rem | 400 (Regular) | 1.5 |
| **Caption** | 12px / 0.75rem | 500 (Medium) | 1.4 |

---

## ⭐ Review UI Components

### Star Ratings
```
★★★★★  5.0 - Excellent (Filled: #E8A838)
★★★★☆  4.0 - Great
★★★☆☆  3.0 - Average
★★☆☆☆  2.0 - Poor
★☆☆☆☆  1.0 - Bad (Empty: #E2E8F0)
```

### Verified Badge
```
┌─────────────────────────┐
│ ✓ Verified Purchase     │  Background: #ECFDF5
│                         │  Border: #10B981
│                         │  Icon: #10B981
└─────────────────────────┘
```

### Trust Score Badge
```
┌─────────────────────────────┐
│  ⭐ 4.8  │  TrustRate       │
│  ━━━━━━━━│  Verified        │
│  1,247   │  Reviews         │
└─────────────────────────────┘
```

---

## 📦 Component Library

### Review Card
```
┌────────────────────────────────────────────────────┐
│  ┌────┐  John D.           ★★★★★  5.0             │
│  │ JD │  ✓ Verified        2 days ago              │
│  └────┘                                            │
│                                                    │
│  "Absolutely fantastic service! The team went     │
│   above and beyond to help me. Highly recommend." │
│                                                    │
│  👍 Helpful (23)    💬 Reply                       │
└────────────────────────────────────────────────────┘
```

### Trust Score Widget
```
┌─────────────────────────────────────┐
│         TrustRate Score             │
│                                     │
│            ⭐ 4.8                   │
│         ━━━━━━━━━━━━                │
│        Based on 1,247               │
│       verified reviews              │
│                                     │
│  5★ ████████████████░░ 892 (72%)   │
│  4★ ████████░░░░░░░░░░ 231 (19%)   │
│  3★ ██░░░░░░░░░░░░░░░░  74  (6%)   │
│  2★ █░░░░░░░░░░░░░░░░░  31  (2%)   │
│  1★ ░░░░░░░░░░░░░░░░░░  19  (1%)   │
└─────────────────────────────────────┘
```

---

## 🎯 Design Principles

1. **Trust First** — Every element should reinforce credibility
2. **Clarity Over Cleverness** — Information hierarchy is king
3. **Warmth in Professionalism** — Approachable but authoritative
4. **Verification Visibility** — Make verified status unmissable
5. **Social Proof Amplification** — Numbers and stats upfront

---

## 📐 Spacing System

| Token | Value | Use Case |
|-------|-------|----------|
| `space-1` | 4px | Tight spacing, icons |
| `space-2` | 8px | Inline elements |
| `space-3` | 12px | Compact cards |
| `space-4` | 16px | Standard padding |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Section gaps |
| `space-12` | 48px | Large sections |
| `space-16` | 64px | Hero sections |

---

## 🔲 Border Radius

| Token | Value | Use Case |
|-------|-------|----------|
| `radius-sm` | 4px | Badges, small elements |
| `radius-md` | 8px | Buttons, inputs |
| `radius-lg` | 12px | Cards |
| `radius-xl` | 16px | Modal, large cards |
| `radius-full` | 9999px | Avatars, pills |

---

## 🌓 Shadow System

```css
--shadow-sm: 0 1px 2px rgba(26, 43, 74, 0.05);
--shadow-md: 0 4px 6px rgba(26, 43, 74, 0.07);
--shadow-lg: 0 10px 15px rgba(26, 43, 74, 0.1);
--shadow-xl: 0 20px 25px rgba(26, 43, 74, 0.15);
```

---

## 🖼️ Logo Concept

```
    ╭─────╮
    │ ✓★  │  TrustRate
    ╰─────╯
    
    Checkmark + Star fusion
    Deep Navy background
    Amber star accent
```

---

*Design System v1.0 — TrustRate © 2025*
