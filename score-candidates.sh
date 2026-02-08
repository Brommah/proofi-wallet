#!/bin/bash
set -e

NOTION_KEY=$(cat ~/.config/notion/api_key)
OPENAI_KEY=$(grep OPENAI_API_KEY ~/.zshrc 2>/dev/null | head -1 | sed 's/export OPENAI_API_KEY=//' | tr -d '"' | tr -d "'")
if [ -z "$OPENAI_KEY" ]; then
  OPENAI_KEY="$OPENAI_API_KEY"
fi

FA_PROMPT=$(cat ~/clawd/cere-hr-service/prompts/Founders_Associate.txt)

CANDIDATES=(
  "2f8d8000-83d6-8110-b716-ef45bc639e4f|Leonardo Colacicchi|Founder's Associate (Business Ops)|https://drive.google.com/uc?id=1VBBq1Dd_iNdVSozTagH965pwTkVMomQU&export=download"
  "2f8d8000-83d6-8176-a62f-edea19206da5|Shamli Hingorani|Founder's Associate (Business Ops)|https://drive.google.com/uc?id=164CPOHOl8VMhWQUTRLRRO5WGJJV0JmWm&export=download"
  "2fbd8000-83d6-8174-9c93-f66a8050c5e9|Israel Montelongo|Founder's Associate (Business Ops)|https://drive.google.com/uc?id=1tLopwJ2taYFIHde3PCVn8Jhwm-xkJDRl&export=download"
)

for entry in "${CANDIDATES[@]}"; do
  IFS='|' read -r PAGE_ID NAME ROLE RESUME_URL <<< "$entry"
  echo "=== Processing: $NAME ==="
  
  # Download resume
  RESUME_FILE="/tmp/resume_${PAGE_ID}.pdf"
  curl -sL "$RESUME_URL" -o "$RESUME_FILE" 2>/dev/null
  
  # Extract text from PDF
  RESUME_TEXT=$(python3 -c "
import sys
try:
    import fitz  # pymupdf
    doc = fitz.open('$RESUME_FILE')
    text = ''
    for page in doc:
        text += page.get_text()
    print(text[:8000])
except:
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader('$RESUME_FILE')
        text = ''
        for page in reader.pages:
            text += page.extract_text() or ''
        print(text[:8000])
    except Exception as e:
        print(f'ERROR: {e}')
" 2>&1)
  
  if echo "$RESUME_TEXT" | grep -q "^ERROR"; then
    echo "  ❌ Could not parse resume: $RESUME_TEXT"
    continue
  fi
  
  echo "  Resume parsed ($(echo "$RESUME_TEXT" | wc -c | tr -d ' ') chars)"
  
  # Create the evaluation request
  EVAL_PROMPT=$(cat <<PROMPT_END
$FA_PROMPT

---
CANDIDATE NAME: $NAME
ROLE: $ROLE

RESUME:
$RESUME_TEXT
---

Evaluate this candidate. Respond in this exact JSON format:
{
  "score": <1-10>,
  "summary": "<2-3 sentence summary>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "concerns": ["<concern1>", "<concern2>"],
  "recommendation": "<1 sentence recommendation>"
}
PROMPT_END
)
  
  # Call OpenAI
  RESPONSE=$(python3 -c "
import json, sys, os
import urllib.request

data = json.dumps({
    'model': 'gpt-4o',
    'messages': [{'role': 'user', 'content': sys.stdin.read()}],
    'response_format': {'type': 'json_object'},
    'temperature': 0.3
}).encode()

req = urllib.request.Request(
    'https://api.openai.com/v1/chat/completions',
    data=data,
    headers={
        'Authorization': 'Bearer $OPENAI_KEY',
        'Content-Type': 'application/json'
    }
)

resp = urllib.request.urlopen(req, timeout=60)
result = json.loads(resp.read())
content = result['choices'][0]['message']['content']
print(content)
" <<< "$EVAL_PROMPT" 2>&1)
  
  echo "  AI Response: $RESPONSE"
  
  # Parse score
  SCORE=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['score'])" 2>/dev/null)
  
  if [ -z "$SCORE" ]; then
    echo "  ❌ Could not parse score"
    continue
  fi
  
  echo "  Score: $SCORE"
  
  # Format eval text
  EVAL_TEXT=$(echo "$RESPONSE" | python3 -c "
import json, sys
d = json.load(sys.stdin)
text = f\"\"\"**Score: {d['score']}/10**
_Prompt: ✅ Role-specific (Founder's Associate V7)_

**Summary:** {d['summary']}

**Strengths:**
\"\"\"
for s in d.get('strengths', []):
    text += f'• {s}\n'
text += '\n**Concerns:**\n'
for c in d.get('concerns', []):
    text += f'• {c}\n'
text += f\"\"\"\n**Recommendation:** {d['recommendation']}\"\"\"
print(text)
" 2>/dev/null)
  
  # Update Notion
  UPDATE_BODY=$(python3 -c "
import json
body = {
    'properties': {
        'AI Score': {'number': $SCORE},
        'AI Status': {'rich_text': [{'text': {'content': 'Scored by Clawdbot (FA V7)'}}]},
        'Passed AI Filter': {'checkbox': $SCORE >= 6}
    }
}
print(json.dumps(body))
")
  
  curl -s -X PATCH "https://api.notion.com/v1/pages/$PAGE_ID" \
    -H "Authorization: Bearer $NOTION_KEY" \
    -H "Notion-Version: 2025-09-03" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'  ✅ Updated: {d.get(\"id\",\"ERROR\")}')" 2>&1
  
  echo ""
done
