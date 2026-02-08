#!/usr/bin/env python3

import json
import requests
import os
import tempfile
import subprocess
import sys
import time
import re

print("Starting FULL candidate scoring (24 candidates)...")
sys.stdout.flush()

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

# ALL 24 candidates
candidates = [
    {"name": "Sina Montazeri", "role": "AI Innovator", "id": "182d8000-83d6-8015-8091-dc8ede98b5c7"},
    {"name": "Andre Kuzminykh", "role": "AI Innovator", "id": "182d8000-83d6-8056-b2fa-dae06bf0c49a"},
    {"name": "Ravi Teja Vempati", "role": "AI Innovator", "id": "183d8000-83d6-81d4-9f2d-feca94e7c01d"},
    {"name": "Joao Vitor Barros da Silva", "role": "AI Innovator", "id": "184d8000-83d6-8173-9042-ddbe9f53c083"},
    {"name": "Subhayan Guha Thakurta", "role": "AI Innovator", "id": "191d8000-83d6-80a9-a5e6-da8cf970025e"},
    {"name": "Vadim F.", "role": "Principal Fullstack Engineer", "id": "193d8000-83d6-80d8-8a3b-d34758b5b361"},
    {"name": "Giorgobiani Giorgi", "role": "Principal Fullstack Engineer", "id": "1ebd8000-83d6-80ab-981c-f84946cf2b83"},
    {"name": "Dimitrios Katelas", "role": "Principal Fullstack Engineer", "id": "201d8000-83d6-8015-a03a-e8d83c15c889"},
    {"name": "Ildemundo Roque", "role": "unknown", "id": "206d8000-83d6-80cf-acc9-f9dc7a236fd5"},
    {"name": "Selçuk KUBUR", "role": "unknown", "id": "20ad8000-83d6-8021-b52e-da119238ab56"},
    {"name": "Tristan Delmontreo Jones", "role": "AI Innovator", "id": "20ed8000-83d6-803c-a1ca-de27dfc693db"},
    {"name": "JAYESH MANANI", "role": "unknown", "id": "210d8000-83d6-80af-b24e-f5252dc8215d"},
    {"name": "Mykola Svystun", "role": "AI Innovator", "id": "216d8000-83d6-8040-940f-f0f85251bace"},
    {"name": "Ilia Kozhevnikov", "role": "Principal Fullstack Engineer", "id": "21ad8000-83d6-80ac-9d39-f3d0545541f0"},
    {"name": "Waqas Mian", "role": "Principal Fullstack Engineer", "id": "21cd8000-83d6-80ae-8204-fbdc8eaecd75"},
    {"name": "Diego Penilla", "role": "AI Innovator", "id": "22ad8000-83d6-8098-80db-cd573dea9c3a"},
    {"name": "Adel Ghatassi", "role": "unknown", "id": "22ad8000-83d6-8134-a402-da8e50113d9a"},
    {"name": "Ahmed Anes Hadjidj", "role": "unknown", "id": "22bd8000-83d6-81bc-89de-f1a0cf1f6f55"},
    {"name": "Ajit Singh", "role": "unknown", "id": "22dd8000-83d6-80e2-9255-e9900570ff16"},
    {"name": "Tao Chen", "role": "Principal Fullstack Engineer", "id": "230d8000-83d6-807e-83cb-eaacc0484c49"},
    {"name": "Sjuul Janssen", "role": "unknown", "id": "238d8000-83d6-8004-9d16-f3e8914f909c"},
    {"name": "David Park", "role": "Principal Fullstack Engineer", "id": "238d8000-83d6-8021-ac5a-e4cf51e0f591"},
    {"name": "Dhanvi Patel", "role": "Founder's Associate (Business Ops)", "id": "2fbd8000-83d6-81d2-8a9b-d7e9a1dbf03d"},
    {"name": "Hanna Novikava", "role": "Devops Lead", "id": "ea772c45-4450-4d9c-a2ca-04be6d2375fc"}
]

def load_scoring_prompt(role):
    """Load the appropriate scoring prompt based on role"""
    role_to_file = {
        "AI Innovator": "AI_Innovator.txt",
        "Principal Fullstack Engineer": "Principal_Fullstack_Engineer.txt",
        "Founder's Associate (Business Ops)": "Founders_Associate.txt",
        "Devops Lead": "Principal_Fullstack_Engineer.txt"  # Use fullstack for DevOps
    }
    
    if role in role_to_file:
        prompt_file = os.path.join(PROMPTS_DIR, role_to_file[role])
        try:
            with open(prompt_file, 'r') as f:
                return f.read()
        except:
            pass
    
    # Generic prompt for unknown roles
    return "Rate this candidate 1-10 based on their resume for a senior tech role at an AI infrastructure startup. Consider: relevant experience, technical depth, leadership, startup/scale experience. Return ONLY a number 1-10."

def process_candidate(candidate, index):
    """Process a single candidate"""
    print(f"\n--- Candidate {index}/24: {candidate['name']} ({candidate['role']}) ---")
    sys.stdout.flush()
    
    # Step 1: Fetch page
    print("Fetching Notion page...")
    sys.stdout.flush()
    try:
        url = f"https://api.notion.com/v1/pages/{candidate['id']}"
        response = requests.get(url, headers=notion_headers, timeout=30)
        
        if response.status_code != 200:
            print(f"Failed to fetch page: {response.status_code}")
            return None
            
        page_data = response.json()
    except Exception as e:
        print(f"Error fetching page: {e}")
        return None
    
    # Step 2: Get resume URL
    print("Getting resume URL...")
    sys.stdout.flush()
    try:
        properties = page_data.get('properties', {})
        resume_prop = properties.get('Resume', {})
        
        if resume_prop.get('type') == 'files':
            files = resume_prop.get('files', [])
            if files:
                file_data = files[0]
                if file_data.get('type') == 'file':
                    resume_url = file_data['file']['url']
                else:
                    print("No resume file found")
                    return None
            else:
                print("No resume files")
                return None
        else:
            print("No resume property")
            return None
    except Exception as e:
        print(f"Error extracting resume URL: {e}")
        return None
    
    # Step 3: Download resume
    print("Downloading resume...")
    sys.stdout.flush()
    try:
        response = requests.get(resume_url, timeout=60)
        if response.status_code != 200:
            print(f"Failed to download: {response.status_code}")
            return None
            
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_file.write(response.content)
            tmp_path = tmp_file.name
            
        print(f"Downloaded {len(response.content)} bytes")
        sys.stdout.flush()
    except Exception as e:
        print(f"Error downloading: {e}")
        return None
    
    # Step 4: Extract text
    print("Extracting text...")
    sys.stdout.flush()
    try:
        result = subprocess.run(['pdftotext', tmp_path, '-'], capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            resume_text = result.stdout
            print(f"Extracted {len(resume_text)} characters")
            sys.stdout.flush()
        else:
            print(f"Text extraction failed")
            os.unlink(tmp_path)
            return None
    except Exception as e:
        print(f"Error extracting text: {e}")
        os.unlink(tmp_path)
        return None
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
    
    # Step 5: Score with OpenAI
    print("Scoring with OpenAI...")
    sys.stdout.flush()
    try:
        prompt = load_scoring_prompt(candidate['role'])
        
        # Limit text length
        if len(resume_text) > 8000:
            resume_text = resume_text[:8000] + "\n\n[Truncated]"
        
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
                                headers=openai_headers, json=payload, timeout=60)
        
        if response.status_code != 200:
            print(f"OpenAI failed: {response.status_code}")
            return None
            
        result = response.json()
        score_text = result['choices'][0]['message']['content'].strip()
        
        # Extract score
        numbers = re.findall(r'\b([1-9]|10)\b', score_text)
        if numbers:
            score = int(numbers[0])
        else:
            print(f"Invalid score format: {score_text}")
            return None
            
        print(f"Score: {score}/10")
        sys.stdout.flush()
        
    except Exception as e:
        print(f"Error with OpenAI: {e}")
        return None
    
    # Step 6: Update Notion
    print("Updating Notion...")
    sys.stdout.flush()
    try:
        url = f"https://api.notion.com/v1/pages/{candidate['id']}"
        payload = {
            "properties": {
                "AI Score": {
                    "number": score
                }
            }
        }
        
        response = requests.patch(url, headers=notion_headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            print(f"✅ Success: {candidate['name']} = {score}/10")
            sys.stdout.flush()
            return score
        else:
            print(f"Failed to update Notion: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Error updating Notion: {e}")
        return None

# Main processing
results = []
start_time = time.time()

print(f"Processing {len(candidates)} candidates...")
print(f"Start time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
sys.stdout.flush()

for i, candidate in enumerate(candidates, 1):
    score = process_candidate(candidate, i)
    if score is not None:
        results.append((candidate['name'], candidate['role'], score))
    else:
        results.append((candidate['name'], candidate['role'], 'FAILED'))
    
    if i < len(candidates):
        print("Waiting 3 seconds...")
        sys.stdout.flush()
        time.sleep(3)

# Final summary
print(f"\n{'='*60}")
print("FINAL SUMMARY")
print(f"{'='*60}")

successful = []
failed = []

for name, role, score in results:
    if score != 'FAILED':
        successful.append((name, role, score))
    else:
        failed.append((name, role))

print(f"\n✅ Successfully scored ({len(successful)} candidates):")
for name, role, score in successful:
    print(f"  {score:2d}/10 | {name} | {role}")

if failed:
    print(f"\n❌ Failed to score ({len(failed)} candidates):")
    for name, role in failed:
        print(f"      | {name} | {role}")

elapsed = time.time() - start_time
print(f"\n📊 Total: {len(successful)} successful, {len(failed)} failed")
print(f"⏱️  Time elapsed: {elapsed/60:.1f} minutes")
print(f"End time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
sys.stdout.flush()