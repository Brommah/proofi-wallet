#!/usr/bin/env python3

import json
import requests
import os
import tempfile
import subprocess
import sys
from pathlib import Path
import time
import re

# Configuration
NOTION_API_KEY = "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"
OPENAI_API_KEY = "sk-proj-UcLLyEDj3ZToGwihyS6kT3BlbkFJ1IJTSnZN1h706LJALheH"
DATABASE_ID = "112d8000-83d6-805c-a3aa-e21ec2741ba7"
PROMPTS_DIR = "/Users/martijnbroersma/clawd/cere-hr-service/prompts"

# Headers for Notion API
notion_headers = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

# Headers for OpenAI API
openai_headers = {
    "Authorization": f"Bearer {OPENAI_API_KEY}",
    "Content-Type": "application/json"
}

# Candidates to score
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
        "Blockchain Engineer": "Blockchain_Engineer.txt",
        "AI Engineer": "AI_Engineer.txt",
        "Devops Lead": "Principal_Fullstack_Engineer.txt"  # Use fullstack for DevOps
    }
    
    if role in role_to_file:
        prompt_file = os.path.join(PROMPTS_DIR, role_to_file[role])
        try:
            with open(prompt_file, 'r') as f:
                return f.read()
        except FileNotFoundError:
            print(f"Warning: Prompt file {prompt_file} not found")
            
    # Generic prompt for unknown roles
    return "Rate this candidate 1-10 based on their resume for a senior tech role at an AI infrastructure startup. Consider: relevant experience, technical depth, leadership, startup/scale experience. Return ONLY a number 1-10."

def fetch_notion_page(page_id):
    """Fetch a Notion page to get resume URL"""
    url = f"https://api.notion.com/v1/pages/{page_id}"
    try:
        response = requests.get(url, headers=notion_headers, timeout=30)
        
        if response.status_code != 200:
            print(f"Failed to fetch page {page_id}: {response.status_code}")
            return None
            
        return response.json()
    except Exception as e:
        print(f"Exception fetching page {page_id}: {e}")
        return None

def extract_resume_url(page_data):
    """Extract resume file URL from Notion page"""
    try:
        properties = page_data.get('properties', {})
        resume_prop = properties.get('Resume', {})
        
        if resume_prop.get('type') == 'files':
            files = resume_prop.get('files', [])
            if files and len(files) > 0:
                file_data = files[0]
                if file_data.get('type') == 'file':
                    return file_data['file']['url']
                elif file_data.get('type') == 'external':
                    return file_data['external']['url']
        return None
    except Exception as e:
        print(f"Error extracting resume URL: {e}")
        return None

def download_file(url, filename):
    """Download file from Notion (pre-signed URLs don't need auth headers)"""
    try:
        # Notion file URLs are AWS S3 pre-signed URLs - don't add auth headers
        response = requests.get(url, timeout=60)
        if response.status_code == 200:
            with open(filename, 'wb') as f:
                f.write(response.content)
            return True
        else:
            print(f"Failed to download file: {response.status_code}")
            return False
    except Exception as e:
        print(f"Exception downloading file: {e}")
        return False

def extract_pdf_text_with_pdftotext(file_path):
    """Extract text from PDF using pdftotext command"""
    try:
        # Use pdftotext command if available
        result = subprocess.run(['pdftotext', file_path, '-'], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            return result.stdout
        else:
            print(f"pdftotext failed: {result.stderr}")
            return None
    except subprocess.TimeoutExpired:
        print("pdftotext timed out")
        return None
    except FileNotFoundError:
        print("pdftotext not found, install with: brew install poppler")
        return None
    except Exception as e:
        print(f"pdftotext exception: {e}")
        return None

def extract_text_from_file(file_path):
    """Extract text from various file formats"""
    file_ext = os.path.splitext(file_path)[1].lower()
    
    if file_ext == '.pdf':
        # Try pdftotext first (more reliable)
        text = extract_pdf_text_with_pdftotext(file_path)
        if text and len(text.strip()) > 50:
            return text
        
        # Fallback to PyPDF2
        try:
            import PyPDF2
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                return text if len(text.strip()) > 50 else None
        except Exception as e:
            print(f"PyPDF2 failed: {e}")
            return None
    
    elif file_ext in ['.docx', '.doc']:
        try:
            import docx
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text if len(text.strip()) > 50 else None
        except Exception as e:
            print(f"DOCX extraction failed: {e}")
            return None
    
    elif file_ext == '.txt':
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"TXT extraction failed: {e}")
            return None
    else:
        print(f"Unsupported file type: {file_ext}")
        return None

def score_with_openai(resume_text, prompt, max_retries=3):
    """Score resume using OpenAI API with retries"""
    url = "https://api.openai.com/v1/chat/completions"
    
    # Limit resume text length to avoid token limits
    max_chars = 8000
    if len(resume_text) > max_chars:
        resume_text = resume_text[:max_chars] + "\n\n[Resume truncated for length]"
    
    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"Resume:\n\n{resume_text}"}
        ],
        "temperature": 0.3,
        "max_tokens": 50
    }
    
    for attempt in range(max_retries):
        try:
            response = requests.post(url, headers=openai_headers, json=payload, timeout=60)
            if response.status_code == 200:
                result = response.json()
                score_text = result['choices'][0]['message']['content'].strip()
                
                # Extract number from response (looking for first number 1-10)
                numbers = re.findall(r'\b([1-9]|10)\b', score_text)
                if numbers:
                    score = int(numbers[0])
                    if 1 <= score <= 10:
                        return score
                
                print(f"Invalid score format: {score_text}")
                return None
            elif response.status_code == 429:
                print(f"Rate limited, waiting before retry {attempt + 1}")
                time.sleep(30)
            else:
                print(f"OpenAI API error: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Error calling OpenAI API (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(10)
    
    return None

def update_notion_score(page_id, score):
    """Update AI Score in Notion"""
    url = f"https://api.notion.com/v1/pages/{page_id}"
    
    payload = {
        "properties": {
            "AI Score": {
                "number": score
            }
        }
    }
    
    try:
        response = requests.patch(url, headers=notion_headers, json=payload, timeout=30)
        if response.status_code == 200:
            return True
        else:
            print(f"Failed to update Notion page {page_id}: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Exception updating Notion: {e}")
        return False

def process_candidate(candidate):
    """Process a single candidate"""
    print(f"\n{'='*60}")
    print(f"Processing: {candidate['name']} ({candidate['role']})")
    print(f"{'='*60}")
    
    # Step 1: Fetch Notion page
    print("Step 1: Fetching Notion page...")
    page_data = fetch_notion_page(candidate['id'])
    if not page_data:
        return {"status": "failed", "error": "Failed to fetch page"}
    
    # Step 2: Extract resume URL
    print("Step 2: Extracting resume URL...")
    resume_url = extract_resume_url(page_data)
    if not resume_url:
        return {"status": "failed", "error": "No resume URL found"}
    
    print(f"Resume URL found: {resume_url[:100]}...")
    
    # Step 3: Download resume
    print("Step 3: Downloading resume...")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_path = tmp_file.name
    
    if not download_file(resume_url, tmp_path):
        os.unlink(tmp_path)
        return {"status": "failed", "error": "Failed to download resume"}
    
    print(f"Downloaded to: {tmp_path}")
    
    # Step 4: Extract text
    print("Step 4: Extracting text from resume...")
    resume_text = extract_text_from_file(tmp_path)
    os.unlink(tmp_path)  # Clean up
    
    if not resume_text or len(resume_text.strip()) == 0:
        return {"status": "failed", "error": "Failed to extract text from resume"}
    
    print(f"Extracted {len(resume_text)} characters from resume")
    
    # Step 5: Load scoring prompt
    print("Step 5: Loading scoring prompt...")
    prompt = load_scoring_prompt(candidate['role'])
    print(f"Using prompt for role: {candidate['role']}")
    
    # Step 6: Score with OpenAI
    print("Step 6: Scoring with OpenAI...")
    score = score_with_openai(resume_text, prompt)
    if score is None:
        return {"status": "failed", "error": "Failed to get score from OpenAI"}
    
    print(f"OpenAI Score: {score}")
    
    # Step 7: Update Notion
    print("Step 7: Updating Notion...")
    if update_notion_score(candidate['id'], score):
        print(f"✅ Successfully scored {candidate['name']}: {score}/10")
        return {"status": "success", "score": score}
    else:
        return {"status": "failed", "error": "Failed to update Notion"}

def main():
    """Main function to process all candidates"""
    results = []
    
    print(f"Starting to process {len(candidates)} candidates...")
    print(f"Time started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    for i, candidate in enumerate(candidates, 1):
        print(f"\n🔄 Candidate {i}/{len(candidates)}")
        
        result = process_candidate(candidate)
        result['candidate'] = candidate
        results.append(result)
        
        # Add delay to avoid rate limits
        if i < len(candidates):  # Don't wait after the last one
            print("Waiting 3 seconds before next candidate...")
            time.sleep(3)
    
    # Print summary
    print(f"\n{'='*60}")
    print("🎯 FINAL SCORING SUMMARY")
    print(f"{'='*60}")
    
    successful = []
    failed = []
    
    for result in results:
        candidate = result['candidate']
        if result['status'] == 'success':
            successful.append((candidate['name'], candidate['role'], result['score']))
        else:
            failed.append((candidate['name'], candidate['role'], result['error']))
    
    print(f"\n✅ Successfully scored ({len(successful)} candidates):")
    print("-" * 60)
    for name, role, score in successful:
        print(f"{score:2d}/10 | {name} | {role}")
    
    if failed:
        print(f"\n❌ Failed to score ({len(failed)} candidates):")
        print("-" * 60)
        for name, role, error in failed:
            print(f"     | {name} | {role} | {error}")
    
    print(f"\n📊 Summary: {len(successful)} successful, {len(failed)} failed")
    print(f"Time completed: {time.strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user. Exiting...")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)