# Personal Agent 🔒

**Privacy-first personal AI assistant that runs 100% locally.**

## 🚫 What This Agent NEVER Does

- ❌ Sends data to OpenAI
- ❌ Sends data to Anthropic Cloud
- ❌ Sends data to any external LLM API
- ❌ Connects to cloud services for inference

## ✅ What It DOES

- ✅ Runs on **Ollama** (local only)
- ✅ Reads your `MEMORY.md` and `SOUL.md`
- ✅ Generates contextual briefings
- ✅ Answers questions with full memory context
- ✅ Respects your privacy completely

## Setup

```bash
# Install Ollama
brew install ollama

# Pull a model
ollama pull llama3.2:3b

# Install dependencies
cd agents/personal-agent
npm install

# Start Ollama
ollama serve
```

## Usage

### Morning Briefing
```bash
npm run briefing
```
Generates an actionable daily briefing based on your priorities and recent activity.

### Ask Questions
```bash
npm run query "What are my priorities this week?"
npm run query "Who is Fred and what does he need?"
npm run query "Wat heb ik gisteren gedaan?"
```

## Memory Files

The agent reads these files from your clawd workspace:

| File | Purpose |
|------|---------|
| `MEMORY-STRUCTURED.md` | Long-term memory (people, projects, lessons) |
| `SOUL-STRUCTURED.md` | Behavioral rules and personality |
| `memory/*.md` | Daily notes |

## Privacy Guarantees

```typescript
// From ollama.ts - enforced at code level
const url = new URL(OLLAMA_URL);
if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
  throw new Error('PRIVACY VIOLATION: Must use localhost');
}
```

The code actively blocks connections to:
- api.openai.com
- api.anthropic.com
- generativelanguage.googleapis.com
- Any non-localhost URL

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2:3b` | Model to use |
| `CLAWD_DIR` | `../..` | Path to clawd workspace |

## Development

```bash
# Run in dev mode
npm run dev

# Build
npm run build
```

---

*Your data stays on your machine. Always.*
