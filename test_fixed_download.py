#!/usr/bin/env python3

import json
import requests
import os
import tempfile
import subprocess
import time
import re

print("Testing fixed download process...")

# Configuration
NOTION_API_KEY = "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"
OPENAI_API_KEY = "sk-proj-UcLLyEDj3ZToGwihyS6kT3BlbkFJ1IJTSnZN1h706LJALheH"
PROMPTS_DIR = "/Users/martijnbroersma/clawd/cere-hr-service/prompts"

notion_headers = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

openai_headers = {
    "Authorization": f"Bearer {OPENAI_API_KEY}",
    "Content-Type": "application/json"
}

# Test with just one candidate
candidate = {"name": "Sina Montazeri", "role": "AI Innovator", "id": "182d8000-83d6-8015-8091-dc8ede98b5c7"}

print("Step 1: Fetching Notion page...")
url = f"https://api.notion.com/v1/pages/{candidate['id']}"
response = requests.get(url, headers=notion_headers)

if response.status_code != 200:
    print(f"Failed: {response.status_code}")
    exit(1)

page_data = response.json()
properties = page_data.get('properties', {})
resume_prop = properties.get('Resume', {})

if resume_prop.get('type') == 'files':
    files = resume_prop.get('files', [])
    if files:
        file_data = files[0]
        if file_data.get('type') == 'file':
            resume_url = file_data['file']['url']
            print(f"Resume URL found")
        else:
            print("No file type")
            exit(1)
    else:
        print("No files")
        exit(1)

print("Step 2: Downloading resume (without auth headers)...")
# Fixed: Don't add auth headers for pre-signed URLs
response = requests.get(resume_url)

if response.status_code != 200:
    print(f"Failed to download: {response.status_code}")
    exit(1)

with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
    tmp_path = tmp_file.name
    tmp_file.write(response.content)

print(f"Downloaded {len(response.content)} bytes to {tmp_path}")

print("Step 3: Extracting text...")
result = subprocess.run(['pdftotext', tmp_path, '-'], capture_output=True, text=True)
if result.returncode == 0:
    resume_text = result.stdout
    print(f"Extracted {len(resume_text)} characters")
else:
    print(f"pdftotext failed: {result.stderr}")
    os.unlink(tmp_path)
    exit(1)

os.unlink(tmp_path)

print("Step 4: Loading prompt...")
prompt_file = os.path.join(PROMPTS_DIR, "AI_Innovator.txt")
with open(prompt_file, 'r') as f:
    prompt = f.read()

print(f"Prompt loaded: {len(prompt)} characters")

print("Step 5: Scoring with OpenAI...")
if len(resume_text) > 8000:
    resume_text = resume_text[:8000] + "\n\n[Truncated for length]"

payload = {
    "model": "gpt-4o",
    "messages": [
        {"role": "system", "content": prompt},
        {"role": "user", "content": f"Resume:\n\n{resume_text}"}
    ],
    "temperature": 0.3,
    "max_tokens": 50
}

response = requests.post("https://api.openai.com/v1/chat/completions", 
                        headers=openai_headers, json=payload)

if response.status_code != 200:
    print(f"OpenAI failed: {response.status_code} - {response.text}")
    exit(1)

result = response.json()
score_text = result['choices'][0]['message']['content'].strip()
print(f"OpenAI response: {score_text}")

# Extract score
numbers = re.findall(r'\b([1-9]|10)\b', score_text)
if numbers:
    score = int(numbers[0])
    print(f"Extracted score: {score}")
else:
    print("No valid score found")
    exit(1)

print("Step 6: Updating Notion...")
url = f"https://api.notion.com/v1/pages/{candidate['id']}"
payload = {
    "properties": {
        "AI Score": {
            "number": score
        }
    }
}

response = requests.patch(url, headers=notion_headers, json=payload)

if response.status_code == 200:
    print(f"✅ SUCCESS! {candidate['name']} scored {score}/10")
else:
    print(f"Failed to update Notion: {response.status_code} - {response.text}")

print("Test completed successfully!")