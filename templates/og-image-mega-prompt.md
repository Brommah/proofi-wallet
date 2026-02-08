# OG Image Mega-Prompt Template for Nano Banana Pro

> **Created:** 2026-01-29
> **Model:** Google Gemini 3 Pro Image (Nano Banana Pro)
> **Purpose:** Reusable templates for generating Open Graph images via AI

---

## ⚠️ Note on @rincidium's Mega-Prompt

**Exhaustive web search yielded zero results** for any user "@rincidium" or associated "OG Image Mega-Prompt" for Nano Banana Pro. This handle does not appear on X/Twitter, GitHub, Reddit, or any prompt engineering community as of January 2026. It may be:
- A misspelling or confusion with another creator
- A deleted/private account
- Content that was removed

If you find the original, add it to Section 1 below.

---

## Table of Contents

1. [Placeholder: Original @rincidium Mega-Prompt](#1-original-rincidium-mega-prompt)
2. [Universal OG Image Mega-Prompt](#2-universal-og-image-mega-prompt)
3. [Variations by Use Case](#3-variations-by-use-case)
4. [OG Image Design Best Practices](#4-og-image-design-best-practices)
5. [Prompt Engineering Tips for Nano Banana Pro](#5-prompt-engineering-tips)
6. [Quick Reference](#6-quick-reference)

---

## 1. Original @rincidium Mega-Prompt

> **STATUS: NOT FOUND** — Placeholder for when/if the original is located.
> Add the exact prompt text here once sourced.

---

## 2. Universal OG Image Mega-Prompt

This is a battle-tested mega-prompt template synthesized from top Nano Banana Pro prompt engineers and OG image best practices. Copy, customize the variables in `[BRACKETS]`, and generate.

### The Mega-Prompt

```
Create a professional Open Graph social card image at exactly 1200×630 pixels.

CONTENT:
- Headline text: "[YOUR HEADLINE HERE]"
- Subheadline (optional): "[YOUR SUBHEADLINE]"
- Brand/author: "[BRAND NAME or AUTHOR]"
- Logo placement: [top-left / bottom-left / bottom-right]

VISUAL STYLE:
- Background: [gradient / solid / photo-based / abstract pattern]
- Primary color: [HEX CODE, e.g., #1A1A2E]
- Accent color: [HEX CODE, e.g., #E94560]
- Overall mood: [professional / playful / dramatic / minimal / tech-forward]

TYPOGRAPHY:
- Headline font style: bold [geometric sans-serif / modern serif / display]
- Headline size: large, dominant, occupying ~40% of the card width
- Text color: [white / dark / accent] with strong contrast against background
- ALL text must be crisp, sharp, and perfectly legible at thumbnail size (300×157px)
- Maximum 2 font weights (bold headline + regular subtitle)

COMPOSITION:
- Layout: [left-aligned text with visual on right / centered / split-screen]
- Safe zone: Keep all critical text within the center 1000×500px area
- Visual hierarchy: Headline → Visual element → Brand mark → Subtext
- Ensure clean negative space — avoid clutter

TECHNICAL:
- Aspect ratio: 1.91:1 (1200×630)
- No thin lines or small details that disappear at thumbnail size
- High contrast between text and background (WCAG AA minimum)
- No gradients on text itself
- Output as a single clean image ready for web use

QUALITY:
- Ultra-sharp text rendering with no artifacts
- Professional, publication-ready finish
- Clean edges, no noise or grain unless intentionally stylistic
```

---

## 3. Variations by Use Case

### 3A. Blog Post OG Image

```
Create a professional Open Graph image (1200×630px) for a blog article.

Title text (exact, do not change): "[BLOG POST TITLE]"
Author line: "By [AUTHOR NAME]"
Publication: "[SITE NAME]"

Style: Modern editorial magazine aesthetic. Clean white or off-white background
with a bold accent color stripe or geometric shape on the left edge.

Typography:
- Title: Bold geometric sans-serif (Montserrat/Inter style), dark charcoal (#1A1A1A)
- Author: Light weight, smaller, muted gray (#666666)
- Site name: Small, positioned bottom-right with subtle brand mark

Layout: Title left-aligned in the center-left area. Generous padding (80px minimum).
Optional: Small thematic icon or abstract illustration on the right third.

The image must look excellent when displayed as a small 300px-wide thumbnail
in Twitter/X feeds and Slack previews. Prioritize text clarity above all else.
```

### 3B. Landing Page / Product Launch OG Image

```
Create a high-impact Open Graph image (1200×630px) for a product landing page.

Headline: "[PRODUCT NAME]"
Tagline: "[SHORT VALUE PROPOSITION]"
CTA hint: "[e.g., Try Free, Coming Soon, Join the Beta]"

Style: Premium tech-product aesthetic. Dark background (#0D1117 or deep navy)
with a bold gradient accent (e.g., electric blue → purple, or brand colors).
Slight 3D depth effect or glassmorphism element.

Typography:
- Product name: Extra-bold, large, white (#FFFFFF)
- Tagline: Medium weight, slightly muted (#B0B0B0 or light accent)
- CTA: Small badge-style element with accent color background

Layout: Centered composition with product name dominant.
Optional: Abstract product screenshot, icon, or 3D element on the right side,
slightly cropped and fading into the background.

Atmosphere: Polished, confident, high-tech. Think: Apple keynote slide meets
GitHub dark mode. No clutter. Maximum 3 text elements visible.
```

### 3C. Social Media Share Card (Twitter/X, LinkedIn)

```
Create a bold, scroll-stopping Open Graph image (1200×630px) optimized for
social media sharing on Twitter/X and LinkedIn.

Main text: "[KEY MESSAGE OR STAT]"
Context line: "[SUPPORTING DETAIL]"
Brand: "[YOUR BRAND]" with logo mark in corner

Style: High-contrast, attention-grabbing. Use a vivid background color
or bold gradient ([PRIMARY HEX] → [SECONDARY HEX]).

Typography:
- Main text: Extra-bold, large (fills ~60% of width), high contrast
- Use white text on dark backgrounds OR dark text on light backgrounds
- If including a number or statistic, make it 2× larger than surrounding text

Layout: Text centered or left-heavy. Brand mark small in bottom-right.
NO busy patterns, NO stock photo backgrounds, NO more than 15 words total.

Critical: This must be instantly readable in a fast-scrolling feed at ~500px width.
Every word must be legible. If in doubt, make text bigger and remove detail.
```

### 3D. Documentation / Developer Content OG Image

```
Create a clean, technical Open Graph image (1200×630px) for developer
documentation or a technical blog post.

Title: "[DOC/ARTICLE TITLE]"
Category badge: "[e.g., API Reference, Tutorial, Guide]"
Brand: "[PROJECT/COMPANY NAME]"

Style: Clean developer aesthetic. Dark background (#0D1117 or #1E1E1E)
reminiscent of a code editor theme. Monospace font accents.

Typography:
- Title: Bold sans-serif, white or light gray
- Category: Small rounded badge with accent color (green for tutorials,
  blue for reference, orange for guides)
- Brand: Small, bottom-left, subtle

Optional elements:
- Faint code snippet or syntax-highlighted text in background (decorative only)
- Small terminal-style prompt icon
- Thin accent line or border

Keep it minimal. Developers appreciate clean, no-nonsense design.
Maximum 3 visual elements. Lots of breathing room.
```

### 3E. Event / Webinar OG Image

```
Create an event-style Open Graph image (1200×630px) for a webinar or
live event promotion.

Event name: "[EVENT TITLE]"
Date & time: "[DATE] · [TIME] [TIMEZONE]"
Speaker(s): "[SPEAKER NAME(S)]"
Host/brand: "[ORGANIZER NAME]"

Style: Modern event poster aesthetic. Bold, confident typography.
Background: Dark with subtle gradient or texture. One strong accent color.

Typography:
- Event name: Bold, large, dominant — this is the hero element
- Date/time: Medium, clearly readable, accent color or white
- Speaker names: Smaller, light weight
- Brand: Small logo or text, bottom area

Layout: Vertically stacked text, left-aligned or centered.
Optional: Small speaker headshot(s) on the right side, circular crop,
subtle drop shadow.

Must convey: "This is a professional event worth attending."
```

### 3F. Newsletter / Content Digest OG Image

```
Create a clean Open Graph image (1200×630px) for a newsletter or
content digest.

Newsletter name: "[NEWSLETTER NAME]"
Issue info: "[e.g., Issue #42 · January 2026]"
Teaser/topic: "[BRIEF TOPIC DESCRIPTION]"

Style: Editorial, warm, approachable. Light background (off-white, cream,
or very light brand color). Feels like a well-designed email header.

Typography:
- Newsletter name: Bold serif or distinctive display font, dark
- Issue info: Small, muted, positioned above or below the name
- Topic teaser: Medium sans-serif, secondary emphasis

Optional: Small decorative element — a colored bar, envelope icon,
or simple illustration. Nothing busy.

This should feel personal and curated, not corporate. Like receiving
a letter from a smart friend.
```

---

## 4. OG Image Design Best Practices

### Dimensions & Technical Specs

| Platform | Recommended Size | Aspect Ratio | Max File Size |
|----------|-----------------|--------------|---------------|
| **Universal OG** | **1200×630px** | **1.91:1** | **< 8MB** |
| Twitter/X | 1200×628px | 1.91:1 | 5MB |
| Facebook | 1200×630px | 1.91:1 | 8MB |
| LinkedIn | 1200×627px | 1.91:1 | 5MB |
| Discord | 1200×630px | 1.91:1 | 8MB |
| WhatsApp | 1200×630px | 1.91:1 | — |

**→ Use 1200×630px for everything.** It works universally.

### Design Principles

1. **Thumbnail test first.** Your OG image will most often be seen at ~300–600px wide. Design for that, not fullscreen.

2. **Safe zone.** Keep all critical content within the center 1000×500px. Platforms crop edges differently.

3. **Maximum 15 words.** Less is more. If you can't read it in 2 seconds, simplify.

4. **High contrast text.** White on dark or dark on light. Never mid-tone text on mid-tone backgrounds. Aim for WCAG AA (4.5:1 contrast ratio minimum).

5. **Bold typography.** Use bold or extra-bold weights. Regular weight text disappears at thumbnail size.

6. **No thin lines or fine details.** They become noise at small sizes.

7. **Consistent brand system.** Use the same template structure across your content for brand recognition.

8. **Avoid photos with faces** unless it's a personal brand — they often get awkwardly cropped.

9. **Text rendering is king.** With Nano Banana Pro, always emphasize "crisp, sharp, perfectly legible text" in your prompt. This model excels at text but needs explicit instruction.

10. **Test across platforms.** Use [opengraph.xyz](https://www.opengraph.xyz) or similar tools to preview how your OG image renders on different platforms.

### Color Palette Suggestions

```
Dark Professional:  BG #0D1117  Text #FFFFFF  Accent #58A6FF
Warm Editorial:     BG #FFF8F0  Text #1A1A1A  Accent #E85D04
Bold Tech:          BG #1A1A2E  Text #EAEAEA  Accent #E94560
Clean Minimal:      BG #FFFFFF  Text #111111  Accent #0066FF
Nature/Green:       BG #1B2D1B  Text #F0F0F0  Accent #4ADE80
Purple Creative:    BG #13111C  Text #FFFFFF  Accent #A855F7
```

---

## 5. Prompt Engineering Tips for Nano Banana Pro

### What Makes Nano Banana Pro Special for OG Images

- **Best-in-class text rendering** — it can generate sharp, readable text inside images
- **Layout reasoning** — it understands composition instructions (left-align, center, safe zones)
- **Color accuracy** — it respects hex codes when specified
- **Aspect ratio control** — explicitly state dimensions for correct output

### Prompt Structure (Recommended Order)

```
1. FORMAT:    Image type + exact dimensions
2. CONTENT:   Text content (exact wording in quotes)
3. STYLE:     Visual aesthetic + mood
4. COLORS:    Background, text, accent (use hex codes)
5. TYPOGRAPHY: Font style, weight, size relationships
6. LAYOUT:    Composition, alignment, spacing
7. TECHNICAL: Quality requirements, constraints
```

### Pro Tips

- **Always quote your text exactly:** `Title text (exact): "Your Title Here"` — prevents the model from paraphrasing
- **Specify what NOT to include:** `No stock photos, no clip art, no busy patterns`
- **Reference real design systems:** "Apple keynote style" or "GitHub dark mode aesthetic" gives strong style anchoring
- **Use hex codes for colors** — Nano Banana Pro respects them well
- **End with a purpose statement:** `"This is for social media sharing, so prioritize text clarity and thumbnail readability"`
- **Iterate with follow-ups:** Generate once, then say "Make the headline 30% larger and increase contrast"

### Common Failures & Fixes

| Problem | Fix |
|---------|-----|
| Text is blurry/unreadable | Add: "Ultra-sharp text rendering, perfectly crisp letterforms" |
| Wrong text content | Quote exact text, add: "Do NOT change any words" |
| Too cluttered | Add: "Maximum 3 visual elements. Generous white space." |
| Bad color contrast | Specify exact hex codes for both text AND background |
| Wrong dimensions | State dimensions twice: in opening line AND in technical section |
| Text gets cut off | Add: "Keep all text within center 1000×500px safe zone" |

---

## 6. Quick Reference

### Fastest Possible Prompt (Copy & Customize)

```
Create a 1200×630px Open Graph image.
Dark background (#0D1117).
Bold white text: "[YOUR TITLE]"
Small gray text below: "[YOUR SUBTITLE]"
Brand mark bottom-right: "[YOUR BRAND]"
Style: Clean, modern, professional. Ultra-sharp text.
```

### Sources & Further Reading

- [Nano Banana Pro Prompting Guide (imagine.art)](https://www.imagine.art/blogs/nano-banana-pro-prompt-guide) — 75 prompts
- [30+ Production Prompts (acecloud.ai)](https://acecloud.ai/blog/best-nano-banana-pro-prompts/) — Client-ready templates
- [20 Marketing Prompts (willfrancis.com)](https://willfrancis.com/digital-marketing-use-cases-prompts-for-nano-banana-pro/) — Social/marketing focus
- [Awesome Nano Banana Pro (GitHub)](https://github.com/ZeroLu/awesome-nanobanana-pro) — 200+ curated prompts from X
- [OG Image Size Guide 2025 (krumzi.com)](https://www.krumzi.com/blog/open-graph-image-sizes-for-social-media-the-complete-2025-guide)
- [Vercel OG Image Generation](https://vercel.com/docs/og-image-generation) — Programmatic approach
- [OpenGraph.xyz](https://www.opengraph.xyz) — Preview & debug tool

---

*Template maintained in `/templates/og-image-mega-prompt.md`*
