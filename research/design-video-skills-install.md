# Design & Video Skills Installation Results

**Date:** 2026-01-29

## Summary

All three skill sources installed successfully on first attempt. Total: **19 skills** installed to Claude Code, Moltbot, and Cursor.

---

## 1. Superdesign Skill

**Command:** `npx skills add superdesigndev/superdesign-skill -y`
**Source:** https://github.com/superdesigndev/superdesign-skill
**Status:** ✅ Success

**Skills installed (1):**
- `superdesign` — Frontend UI/UX design agent. Creates design projects and iterates on drafts with parameters like theme, style, and mode.

**Key commands:**
- `superdesign create-project --title "X" --template .superdesign/replica_html_template/home.html --json`
- `superdesign iterate-design-draft --draft-id <id> -p "dark theme" -p "minimal" --mode branch --json`

---

## 2. Remotion Skills

**Command:** `npx skills add remotion-dev/skills -y`
**Source:** https://github.com/remotion-dev/skills
**Docs:** https://www.remotion.dev/docs/ai/skills
**Status:** ✅ Success

**Skills installed (1):**
- `remotion-best-practices` — Best practices for Remotion (video creation in React). Enables AI-driven video generation with proper Remotion patterns.

**Notes:**
- Can also be added when creating a new Remotion project via `bun create video`
- Skills source also available at https://github.com/remotion-dev/remotion/tree/main/packages/skills

---

## 3. Anthropic Canvas Design (+ full skills suite)

**Command:** `npx skills add anthropics/skills -y`
**Source:** https://github.com/anthropics/skills
**Status:** ✅ Success

**Skills installed (17):**

| Skill | Category |
|-------|----------|
| `canvas-design` | 🎨 Creative — Visual art in PNG/PDF using design philosophy |
| `algorithmic-art` | 🎨 Creative — Generative/algorithmic art |
| `frontend-design` | 🎨 Creative — Frontend design patterns |
| `theme-factory` | 🎨 Creative — Theme generation |
| `slack-gif-creator` | 🎨 Creative — GIF creation |
| `brand-guidelines` | 📋 Enterprise — Brand guideline management |
| `internal-comms` | 📋 Enterprise — Internal communications |
| `doc-coauthoring` | 📋 Enterprise — Document co-authoring |
| `docx` | 📄 Documents — Word document creation |
| `pdf` | 📄 Documents — PDF document creation |
| `pptx` | 📄 Documents — PowerPoint creation |
| `xlsx` | 📄 Documents — Excel spreadsheet creation |
| `mcp-builder` | 🔧 Technical — MCP server generation |
| `webapp-testing` | 🔧 Technical — Web app testing |
| `web-artifacts-builder` | 🔧 Technical — Web artifacts |
| `skill-creator` | 🔧 Technical — Skill creation helper |
| `template-skill` | 📝 Template — Skill template |

**Notes:**
- The `canvas-design` skill (the "Pencil design canvas" skill) is included in this bundle
- This repo includes Anthropic's official document skills (docx, pdf, pptx, xlsx) which power Claude's document capabilities
- Some skills are Apache 2.0, document skills are source-available

---

## Installation Location

All skills installed to: `~/.agents/skills/` (symlinked to Claude Code, Moltbot, and Cursor)

Full listing:
```
algorithmic-art/     frontend-design/    pdf/                  superdesign/
brand-guidelines/    internal-comms/     pptx/                 template-skill/
canvas-design/       mcp-builder/        remotion-best-practices/ theme-factory/
doc-coauthoring/     docx/               skill-creator/        web-artifacts-builder/
                                         slack-gif-creator/    webapp-testing/
                                                               xlsx/
```

## What Worked

- All three `npx skills add` commands worked on first try
- The `-y` flag auto-accepts prompts (installs to all detected agents, project scope)
- Skills CLI auto-detects agents (found Claude Code, Moltbot, Cursor)

## Issues / Notes

- No failures encountered
- The `anthropics/skills` repo installs ALL 17 skills — there's no way to cherry-pick just `canvas-design` via the CLI (you'd need to manually copy the folder)
- "Pencil design canvas" = `canvas-design` from the Anthropic skills repo (not a separate package)
