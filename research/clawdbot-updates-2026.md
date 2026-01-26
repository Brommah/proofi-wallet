# Clawdbot Updates & Nieuwe Features - Januari 2026

*Research rapport - 26 januari 2026*

## 📋 Samenvatting

Clawdbot is een personal AI assistant die draait op je eigen devices en communiceert via WhatsApp, Telegram, Discord, Slack, iMessage, en vele andere kanalen. Het project is zeer actief met frequente updates.

**Correctie:** De GitHub repo is `github.com/clawdbot/clawdbot` (niet `cabloy/clawdbot` zoals eerder gedacht).

---

## 🆕 Recente Releases (Januari 2026)

### Release 2026.1.24 (Nieuwste)

**Highlights:**
- **LINE Plugin** - Nieuw kanaal! Messaging API met rich replies + quick replies (#1630)
- **TTS Edge Fallback** - Keyless Edge TTS als backup + `/tts` auto modes (off/always/inbound/tagged) (#1668, #1667)
- **Exec Approvals In-Chat** - `/approve` commando werkt nu in alle kanalen inclusief plugins (#1621)
- **Telegram DM Topics** - Topics als aparte sessies + link preview toggle (#1597, #1700)
- **Ollama Discovery** - Automatische Ollama detectie + docs (#1606)
- **Web Search Freshness Filter** - Brave search ondersteunt nu time-scoped results (#1688)
- **Control UI Refresh** - Nieuwe design system (typography, colors, spacing) (#1786)

### Release 2026.1.23

**Highlights:**
- **TTS in Core** - Telegram TTS nu ingebouwd + model-driven TTS tags (#1559)
- **/tools/invoke HTTP Endpoint** - Direct tool calls via HTTP API (#1575)
- **Heartbeat Visibility Controls** - Per-channel controls voor OK/alerts/indicator (#1452)
- **Fly.io Deployment** - Officiële support + guide (#1570)
- **Tlon/Urbit Channel** - Nieuw kanaal plugin voor Urbit DMs, groups, threads (#1544)
- **Per-Group Tool Policies** - Allow/deny policies per groep over alle kanalen (#1546)
- **Bedrock Auto-Discovery** - AWS Bedrock defaults + config overrides (#1553)
- **LLM-Task Tool** - JSON-only tool voor workflows (#1498)

---

## 🔌 Kanalen (Huidige Support)

### Volledig Ondersteund
- WhatsApp (Baileys)
- Telegram (grammY)
- Discord (discord.js)
- Slack (Bolt)
- Signal (signal-cli)
- iMessage (imsg CLI)
- Google Chat
- WebChat

### Plugin/Extension Channels
- Microsoft Teams
- Matrix
- BlueBubbles
- Mattermost
- LINE *(nieuw!)*
- Tlon/Urbit *(nieuw!)*
- Zalo / Zalo Personal

---

## 🛠️ Belangrijke Nieuwe Features

### 1. Pi Agent Runtime
Clawdbot gebruikt nu **Pi** als de enige coding-agent runtime (RPC mode). Legacy Claude/Codex/Gemini paths zijn verwijderd.

### 2. Canvas + A2UI
Agent-driven visual workspace met:
- `canvas.present` / `canvas.hide`
- `canvas.eval` / `canvas.snapshot`
- A2UI push/reset voor dynamic UI

### 3. Voice & TTS
- **Voice Wake** - Always-on speech detection (macOS/iOS/Android)
- **Talk Mode** - Continuous conversation overlay
- **TTS Providers**: ElevenLabs, Edge TTS (keyless fallback)
- **Auto modes**: off/always/inbound/tagged

### 4. Node System
iOS/Android/macOS kunnen als "nodes" verbinden:
- Camera snap/clip
- Screen recording
- Location.get
- System notifications
- Remote exec via `nodes.run`

### 5. Exec Approvals
Verbeterde security met:
- In-chat `/approve` command
- Per-channel tool policies
- Allowlist persistence

### 6. Gateway Improvements
- Config.patch via gateway tool (#1653)
- Diagnostic flags voor debug logs
- IPv6 loopback support
- Lock files in temp directory

---

## ⚠️ Breaking Changes & Deprecations

### Verwijderd
- Legacy Claude/Codex/Gemini/Opencode paths - alleen Pi wordt ondersteund
- Legacy TCP bridge voor nodes - alleen Gateway WebSocket
- Standalone `wake` command - vervangen door `clawdbot system`

### Gewijzigd
- Gateway restart is nu default na `clawdbot update` (use `--no-restart` to skip)
- Session key casing is genormaliseerd
- Array-backed session stores worden geweigerd

### Security Defaults
- `dmPolicy="pairing"` is nu default - unknown senders krijgen pairing code
- Gateway token wordt nu default gegenereerd (zelfs op loopback)
- Funnel vereist `gateway.auth.mode: "password"`

---

## 📦 Skills Platform

### ClawdHub
Skills marketplace op [clawdhub.com](https://clawdhub.com):
```bash
clawdhub install <skill>
clawdhub update --all
clawdhub sync --all
```

### Skill Locations
1. **Bundled** - Shipped met install (laagste precedence)
2. **Managed** - `~/.clawdbot/skills`
3. **Workspace** - `<workspace>/skills` (hoogste precedence)

### Skill Gating
Skills kunnen gates hebben:
- `requires.bins` - Binary moet op PATH staan
- `requires.env` - Environment variable vereist
- `requires.config` - Config path moet truthy zijn
- `os` - Platform filter (darwin/linux/win32)

---

## 🚀 Deployment Opties

- **Local** - macOS/Linux/Windows (WSL2)
- **Fly.io** - Nieuw! Officiële guide
- **Hetzner** - VPS deployment
- **Docker** - Container support
- **Tailscale Serve/Funnel** - Remote access
- **Nix** - Declarative config

---

## 📱 Companion Apps

- **macOS App** - Menu bar + Voice Wake + Talk Mode
- **iOS Node** - Canvas + Voice + Camera + Screen recording
- **Android Node** - Canvas + Chat + Camera

---

## 🔧 Aanbevelingen voor Onze Setup

### Te Overwegen Updates

1. **Update naar latest**
   ```bash
   curl -fsSL https://clawd.bot/install.sh | bash
   clawdbot doctor
   ```

2. **TTS Configuratie** - Check of Edge TTS fallback gewenst is

3. **Exec Approvals** - `/approve` in chat is handig

4. **Heartbeat Controls** - Per-channel visibility configureren

5. **Skills Refresh** - Check ClawdHub voor nieuwe skills

### Commando's om te runnen
```bash
clawdbot status --all
clawdbot health
clawdbot security audit --deep
clawdbot doctor
```

---

## 📚 Bronnen

- **GitHub**: https://github.com/clawdbot/clawdbot
- **Releases**: https://github.com/clawdbot/clawdbot/releases
- **Docs**: https://docs.clawd.bot
- **Discord**: https://discord.gg/clawd
- **ClawdHub**: https://clawdhub.com

---

## 📝 Notes

- GitHub repo `github.com/cabloy/clawdbot` bestaat niet - correcte URL is `github.com/clawdbot/clawdbot`
- clawdhub.com is live maar minimale landing page (marketplace functionaliteit via CLI)
- Brave Search API was rate limited tijdens research - sommige queries niet uitgevoerd
- Project is pre-1.0 dus verwacht frequente breaking changes

*Rapport gegenereerd: 26 januari 2026*
