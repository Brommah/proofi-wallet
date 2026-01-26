# Clawdbot Skills Audit

Datum: 2025-01-27  
Totaal skills: 52 builtin + 1 custom

---

## 🟢 Actief in gebruik

Skills die geïnstalleerd én geconfigureerd zijn:

| Skill | Functie | Status |
|-------|---------|--------|
| **gog** | Google Workspace (Gmail, Calendar, Drive) | ✅ Geïnstalleerd, OAuth geconfigureerd |
| **bird** | Twitter/X lezen en posten | ✅ Geïnstalleerd |
| **spogo** | Spotify playback en zoeken | ✅ Geïnstalleerd |
| **wacli** | WhatsApp berichten naar anderen sturen | ✅ Geïnstalleerd |
| **remindctl** | Apple Reminders beheren | ✅ Geïnstalleerd |
| **memo** | Apple Notes beheren | ✅ Geïnstalleerd |
| **weather** | Weer opvragen (geen install nodig) | ✅ Altijd beschikbaar |
| **github** | GitHub via `gh` CLI | ✅ Standaard aanwezig |
| **nano-banana-pro** | Gemini 3 image generation | ✅ API key geconfigureerd |
| **aesthetic-image-gen** | Custom - 2026 design prompts | ✅ Custom skill |

---

## 🟡 Geïnstalleerd maar onbenut

Skills die klaar staan maar zelden/nooit gebruikt worden:

### **Apple Ecosystem**

| Skill | Wat doet het? | Waarom interessant? | Activatie |
|-------|---------------|---------------------|-----------|
| **apple-reminders** | Reminders via `remindctl` | Je hebt dit! Handig voor "herinner me aan X" | Al klaar - gewoon vragen |
| **apple-notes** | Notes via `memo` | Je hebt dit! Quick notes dumpen | Al klaar - gewoon vragen |
| **things-mac** | Things 3 todo's | Als je Things gebruikt ipv Reminders | `go install github.com/ossianhempel/things3-cli/cmd/things@latest` |

### **Productiviteit**

| Skill | Wat doet het? | Waarom interessant? | Activatie |
|-------|---------------|---------------------|-----------|
| **himalaya** | Email via IMAP/SMTP CLI | Alternatief voor gog email, werkt met elk account | `brew install himalaya` + config |
| **obsidian** | Obsidian vault doorzoeken | Als je Obsidian gebruikt | `brew install yakitrak/yakitrak/obsidian-cli` |
| **bear-notes** | Bear notes beheren | Als je Bear gebruikt | `go install github.com/tylerwince/grizzly/cmd/grizzly@latest` + token |
| **notion** | Notion API pages/databases | Als je Notion gebruikt | API key in `~/.config/notion/api_key` |
| **trello** | Trello boards/cards | Als je Trello gebruikt | `TRELLO_API_KEY` + `TRELLO_TOKEN` env vars |

---

## 🔴 Niet geïnstalleerd - Potentieel nuttig

Skills die je zou kunnen gebruiken maar nog niet hebt:

### ⭐ Hoge prioriteit (direct bruikbaar)

| Skill | Wat doet het? | Waarom voor Mart? | Installatie |
|-------|---------------|-------------------|-------------|
| **summarize** | URLs/videos/PDFs samenvatten | "Wat is dit artikel?" - super handig | `brew install steipete/tap/summarize` |
| **sag** | ElevenLabs TTS, stem-antwoorden | Voice replies via Telegram! Fun voor storytelling | `brew install steipete/tap/sag` + `ELEVENLABS_API_KEY` |
| **gifgrep** | GIF zoeken en downloaden | Fun in chats, snel een reactie-GIF vinden | `brew install steipete/tap/gifgrep` |
| **peekaboo** | macOS UI automation | Screenshots, UI inspecteren, automatiseren | `brew install steipete/tap/peekaboo` |
| **imsg** | iMessage lezen en sturen | iMessage via CLI, handig als je Mac openstaat | `brew install steipete/tap/imsg` |

### 📊 Medium prioriteit (situationeel)

| Skill | Wat doet het? | Use case | Installatie |
|-------|---------------|----------|-------------|
| **camsnap** | RTSP camera snapshots/clips | Als je IP-camera's hebt | `brew install steipete/tap/camsnap` + config |
| **openhue** | Philips Hue lampen | Smart home control | `brew install openhue/cli/openhue-cli` |
| **sonoscli** | Sonos speakers | Als je Sonos hebt | `go install github.com/steipete/sonoscli/cmd/sonos@latest` |
| **blucli** | BluOS/NAD speakers | Als je BluOS hebt | `go install github.com/steipete/blucli/cmd/blu@latest` |
| **blogwatcher** | RSS/blog monitoring | Volg favoriete blogs | `go install github.com/Hyaxia/blogwatcher/cmd/blogwatcher@latest` |
| **openai-whisper** | Lokale transcriptie | Audio naar tekst, geen API kosten | `brew install openai-whisper` |
| **openai-whisper-api** | Cloud transcriptie | Sneller dan lokaal | `OPENAI_API_KEY` (heb je al) |

### 🛠️ Dev/Power user

| Skill | Wat doet het? | Use case | Installatie |
|-------|---------------|----------|-------------|
| **1password** | 1Password CLI secrets | Veilig secrets injecteren | `brew install 1password-cli` + desktop app |
| **oracle** | Bundel files + prompt voor andere LLMs | "Vraag GPT-5 over deze codebase" | `npm i -g @steipete/oracle` |
| **mcporter** | MCP servers aanroepen | Direct MCP tools callen | `npm i -g mcporter` |
| **coding-agent** | Codex/Claude Code via CLI | Sub-agents voor coding | Codex of Claude Code installed |
| **tmux** | Interactieve terminal sessies | Voor tools die TTY nodig hebben | Al aanwezig op Mac |
| **session-logs** | Zoek in oude chats | "Wat bespraken we vorige week?" | Geen install, jq + rg |

---

## ⚪ Niche / Waarschijnlijk niet relevant

| Skill | Reden om te skippen |
|-------|---------------------|
| **eightctl** | Eight Sleep bed - heb je die? |
| **food-order** | Foodora reorder - Europese steden specifiek |
| **ordercli** | Zelfde als food-order |
| **goplaces** | Google Places zoeken - web_search doet dit ook |
| **local-places** | Zelfde, lokale proxy |
| **songsee** | Spectrograms van audio - niche |
| **nano-pdf** | PDF editen met NL - specifiek |
| **video-frames** | ffmpeg wrapper - kun je ook direct doen |
| **sherpa-onnx-tts** | Lokale TTS - sag is beter |
| **voice-call** | Twilio calls - enterprise use case |
| **canvas** | Node canvas display - voor Mac app |
| **clawdhub** | Skill marketplace - meta |
| **skill-creator** | Skills maken - meta |
| **model-usage** | CodexBar stats - specifiek |
| **gemini** | Gemini CLI - je hebt al nano-banana-pro |
| **openai-image-gen** | DALL-E batch gen - nano-banana-pro is beter |
| **discord** | Discord - je gebruikt Telegram/Slack |
| **slack** | Slack - al geconfigureerd als channel |
| **bluebubbles** | iMessage server - complexe setup |

---

## 📋 Aanbevolen acties

### Quick wins (5 min elk)

1. **Installeer summarize** - Direct bruikbaar voor "wat is dit artikel/video?"
   ```bash
   brew install steipete/tap/summarize
   ```

2. **Installeer gifgrep** - Fun in chats
   ```bash
   brew install steipete/tap/gifgrep
   ```

3. **Test remindctl** - Je hebt het al! Probeer:
   ```bash
   remindctl today
   remindctl add "Test reminder" --list "Reminders"
   ```

### Medium effort (15-30 min)

4. **Setup sag** voor voice responses
   ```bash
   brew install steipete/tap/sag
   # Krijg API key van https://elevenlabs.io
   export ELEVENLABS_API_KEY="..."
   sag "Hello Mart, this is your AI assistant speaking"
   ```

5. **Setup peekaboo** voor UI automation
   ```bash
   brew install steipete/tap/peekaboo
   # Grant Screen Recording + Accessibility permissions
   peekaboo permissions
   ```

### Als je tijd hebt

6. **openai-whisper-api** voor transcripties (je hebt de key al)
7. **imsg** als je iMessage wilt lezen/sturen via CLI
8. **camsnap** als je IP-camera's hebt

---

## 💡 Skill discovery tip

Alle skills documentatie staat in:
```
/opt/homebrew/lib/node_modules/clawdbot/skills/<naam>/SKILL.md
```

Of vraag mij: "Wat kan de [skill-naam] skill?"
