# Phone Call Skill (Bland.ai)

Make outbound AI phone calls to ask questions, gather info, or handle tasks.

## Limitations
- **NL numbers**: ✅ Work
- **US numbers**: ✅ Work  
- **BE numbers**: ❌ Blocked by Bland API
- Calls come from UK (+44) number
- Max balance: check before calling

## API

**Base URL:** `https://api.bland.ai/v1`
**Auth Header:** `Authorization: BLAND_API_KEY`

### Make a call

```bash
curl -X POST https://api.bland.ai/v1/calls \
  -H "Authorization: BLAND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+31XXXXXXXXX",
    "task": "Instructions for the AI caller in English or Dutch",
    "language": "nl",
    "voice": "nat",
    "max_duration": 5,
    "wait_for_greeting": true,
    "record": true
  }'
```

### Check call status

```bash
curl https://api.bland.ai/v1/calls/CALL_ID \
  -H "Authorization: BLAND_API_KEY"
```

### Get transcript

```bash
curl https://api.bland.ai/v1/calls/CALL_ID \
  -H "Authorization: BLAND_API_KEY"
```

Response includes `concatenated_transcript` and `transcripts` array.

### Check balance

```bash
curl https://api.bland.ai/v1/me \
  -H "Authorization: BLAND_API_KEY"
```

## Parameters

| Param | Description |
|-------|-------------|
| `phone_number` | E.164 format (e.g. `+31612345678`) |
| `task` | Instructions for the AI agent (what to say/ask) |
| `language` | `nl`, `en`, `de`, `fr`, etc. |
| `voice` | `nat`, `josh`, `florian`, `derek`, `june`, `paige` |
| `max_duration` | Max minutes for the call |
| `wait_for_greeting` | Wait for the other side to speak first |
| `record` | Record the call |
| `first_sentence` | Specific opening line |

## Cost
- ~$0.07-0.12/min
- Check balance before calling

## Workflow
1. Confirm with human what to call about
2. Check balance
3. Make call
4. Poll for completion (calls take 1-5 min)
5. Get transcript
6. Report results to human
