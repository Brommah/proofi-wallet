#!/usr/bin/env python3
import os
import json
import re
import requests
import PyPDF2
import docx
from pathlib import Path
import openai
import tempfile
from urllib.parse import urlparse, parse_qs

# Configuration
NOTION_API_KEY = Path.home() / ".config" / "notion" / "api_key"
OPENAI_API_KEY = "sk-proj-UcLLyEDj3ZToGwihyS6kT3BlbkFJ1IJTSnZN1h706LJALheH"
DATABASE_ID = "112d8000-83d6-805c-a3aa-e21ec2741ba7"

# Candidates to score
CANDIDATES = [
    {
        "name": "Orhun Ege Kercek",
        "role": "Founder's Associate (Business Ops)",
        "page_id": "2fcd8000-83d6-8146-9fbf-c0efd3c59566",
        "prompt_file": "/Users/martijnbroersma/clawd/cere-hr-service/prompts/Founders_Associate.txt"
    },
    {
        "name": "Maeve Mulgrew", 
        "role": "Founder's Associate (Business Ops)",
        "page_id": "2fcd8000-83d6-817a-a3ef-e78b10b3330d",
        "prompt_file": "/Users/martijnbroersma/clawd/cere-hr-service/prompts/Founders_Associate.txt"
    },
    {
        "name": "Garima Bhatnagar",
        "role": "Founder's Associate (Business Ops)", 
        "page_id": "2fdd8000-83d6-81ef-a9f8-ce0e688110e8",
        "prompt_file": "/Users/martijnbroersma/clawd/cere-hr-service/prompts/Founders_Associate.txt"
    },
    {
        "name": "Savio Vincent",
        "role": "Principal Fullstack Engineer",
        "page_id": "2fcd8000-83d6-80af-a4bb-f0fc7ed926a9", 
        "prompt_file": "/Users/martijnbroersma/clawd/cere-hr-service/prompts/Principal_Fullstack_Engineer.txt"
    }
]

def read_notion_api_key():
    """Read Notion API key from config file"""
    try:
        with open(NOTION_API_KEY, 'r') as f:
            return f.read().strip()
    except Exception as e:
        print(f"Error reading Notion API key: {e}")
        return None

def get_notion_page(page_id, notion_key):
    """Fetch Notion page data"""
    url = f"https://api.notion.com/v1/pages/{page_id}"
    headers = {
        "Authorization": f"Bearer {notion_key}",
        "Notion-Version": "2022-06-28"
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching page {page_id}: {response.text}")
        return None

def extract_cv_url_from_page(page_data):
    """Extract CV URL from Notion page Resume property"""
    try:
        properties = page_data.get("properties", {})
        resume_prop = properties.get("Resume", {})
        files = resume_prop.get("files", [])
        
        if files:
            file_obj = files[0]
            if "external" in file_obj:
                return file_obj["external"]["url"]
            elif "file" in file_obj:
                return file_obj["file"]["url"]
        
        print("No CV file found in Resume property")
        return None
    except Exception as e:
        print(f"Error extracting CV URL: {e}")
        return None

def extract_google_drive_id(url):
    """Extract file ID from Google Drive URL"""
    # Pattern for various Google Drive URL formats
    patterns = [
        r'/file/d/([a-zA-Z0-9-_]+)',
        r'id=([a-zA-Z0-9-_]+)',
        r'/d/([a-zA-Z0-9-_]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None

def download_file(url, notion_key=None):
    """Download file from URL"""
    try:
        headers = {}
        
        # Check if it's a Google Drive link
        if "drive.google.com" in url:
            file_id = extract_google_drive_id(url)
            if file_id:
                url = f"https://drive.google.com/uc?id={file_id}&export=download"
        
        # For Notion S3 links, no auth header needed (URLs are pre-signed)
        
        response = requests.get(url, headers=headers, stream=True, allow_redirects=True)
        response.raise_for_status()
        
        # Try to determine file extension from Content-Type or URL
        content_type = response.headers.get('Content-Type', '').lower()
        file_extension = None
        
        if 'pdf' in content_type:
            file_extension = '.pdf'
        elif 'docx' in content_type or 'officedocument' in content_type:
            file_extension = '.docx'
        elif 'msword' in content_type:
            file_extension = '.doc'
        else:
            # Try to guess from URL
            if 'pdf' in url.lower():
                file_extension = '.pdf'
            elif 'docx' in url.lower():
                file_extension = '.docx'
        
        # Create temporary file with proper extension
        suffix = file_extension if file_extension else ''
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            for chunk in response.iter_content(chunk_size=8192):
                tmp.write(chunk)
            
            print(f"Downloaded file: {tmp.name} (Content-Type: {content_type})")
            return tmp.name
            
    except Exception as e:
        print(f"Error downloading file: {e}")
        return None

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    try:
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None

def extract_text_from_docx(file_path):
    """Extract text from DOCX file"""
    try:
        doc = docx.Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}")
        return None

def detect_file_type(file_path):
    """Detect file type by reading magic numbers"""
    try:
        with open(file_path, 'rb') as f:
            header = f.read(8)
            
        # PDF magic number
        if header.startswith(b'%PDF'):
            return 'pdf'
        
        # DOCX/Office magic numbers (ZIP-based)
        elif header.startswith(b'PK\x03\x04'):
            # Read more to check for Office files
            with open(file_path, 'rb') as f:
                data = f.read(1000)
                if b'word/' in data or b'xl/' in data or b'ppt/' in data:
                    return 'docx'
        
        # DOC magic number 
        elif header.startswith(b'\xd0\xcf\x11\xe0'):
            return 'doc'
            
    except Exception:
        pass
    
    return None

def extract_text_from_file(file_path):
    """Extract text from file based on extension and magic numbers"""
    # First try by extension
    if file_path.lower().endswith('.pdf'):
        return extract_text_from_pdf(file_path)
    elif file_path.lower().endswith('.docx'):
        return extract_text_from_docx(file_path)
    
    # Fallback: detect by magic numbers
    file_type = detect_file_type(file_path)
    print(f"Detected file type: {file_type} for {file_path}")
    
    if file_type == 'pdf':
        return extract_text_from_pdf(file_path)
    elif file_type in ['docx', 'doc']:
        return extract_text_from_docx(file_path)
    else:
        print(f"Unsupported file format for {file_path}")
        return None

def load_scoring_prompt(prompt_file):
    """Load scoring prompt from file"""
    try:
        with open(prompt_file, 'r') as f:
            return f.read().strip()
    except Exception as e:
        print(f"Error loading prompt from {prompt_file}: {e}")
        return None

def score_with_openai(resume_text, prompt):
    """Score resume using OpenAI API"""
    try:
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        # Truncate resume if too long (GPT-4o has context limits)
        if len(resume_text) > 50000:
            resume_text = resume_text[:50000] + "\n\n[TRUNCATED]"
        
        response = client.chat.completions.create(
            model="gpt-4o",
            temperature=0.3,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Resume:\n\n{resume_text}"}
            ]
        )
        
        response_text = response.choices[0].message.content
        print(f"OpenAI response preview: {response_text[:200]}...")
        
        # Extract numeric score (1-10) from response - try multiple patterns
        score_patterns = [
            r'(?:score|rating)[:\s]*(\d{1,2}(?:\.\d)?)',
            r'(\d{1,2}(?:\.\d)?)\s*(?:/10|out of 10)',
            r'final\s+(?:score|rating)[:\s]*(\d{1,2}(?:\.\d)?)',
            r'overall[:\s]*(\d{1,2}(?:\.\d)?)',
            r'(\d{1,2}(?:\.\d)?)\s*(?:points?)?$'
        ]
        
        for pattern in score_patterns:
            score_match = re.search(pattern, response_text, re.IGNORECASE | re.MULTILINE)
            if score_match:
                score = float(score_match.group(1))
                if 1 <= score <= 10:
                    print(f"Extracted score: {score}")
                    return score, response_text
        
        print(f"Could not extract valid score from response: {response_text}")
        return None, response_text
        
    except Exception as e:
        print(f"Error scoring with OpenAI: {e}")
        return None, None

def update_notion_page_score(page_id, score, notion_key):
    """Update Notion page with AI Score"""
    url = f"https://api.notion.com/v1/pages/{page_id}"
    headers = {
        "Authorization": f"Bearer {notion_key}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }
    
    data = {
        "properties": {
            "AI Score": {
                "number": score
            }
        }
    }
    
    response = requests.patch(url, headers=headers, json=data)
    if response.status_code == 200:
        return True
    else:
        print(f"Error updating page {page_id}: {response.text}")
        return False

def main():
    print("Starting candidate scoring process...")
    
    # Read Notion API key
    print("Reading Notion API key...")
    notion_key = read_notion_api_key()
    if not notion_key:
        print("Failed to read Notion API key")
        return
    print(f"✓ Notion API key loaded (length: {len(notion_key)})")
    
    results = []
    
    for candidate in CANDIDATES:
        print(f"\n--- Processing {candidate['name']} ---")
        
        # 1. Fetch Notion page
        page_data = get_notion_page(candidate['page_id'], notion_key)
        if not page_data:
            print(f"Failed to fetch page for {candidate['name']}")
            continue
        
        # 2. Extract CV URL
        cv_url = extract_cv_url_from_page(page_data)
        if not cv_url:
            print(f"No CV URL found for {candidate['name']}")
            continue
        
        print(f"CV URL: {cv_url}")
        
        # 3. Download CV
        cv_file = download_file(cv_url, notion_key)
        if not cv_file:
            print(f"Failed to download CV for {candidate['name']}")
            continue
        
        # 4. Extract text from CV
        cv_text = extract_text_from_file(cv_file)
        if not cv_text:
            print(f"Failed to extract text from CV for {candidate['name']}")
            os.unlink(cv_file)
            continue
        
        print(f"Extracted {len(cv_text)} characters from CV")
        
        # 5. Load scoring prompt
        prompt = load_scoring_prompt(candidate['prompt_file'])
        if not prompt:
            print(f"Failed to load prompt for {candidate['name']}")
            os.unlink(cv_file)
            continue
        
        # 6. Score with OpenAI
        score, reasoning = score_with_openai(cv_text, prompt)
        if score is None:
            print(f"Failed to score {candidate['name']}")
            os.unlink(cv_file)
            continue
        
        print(f"Score: {score}")
        
        # 7. Update Notion page
        success = update_notion_page_score(candidate['page_id'], score, notion_key)
        if success:
            print(f"Successfully updated Notion page for {candidate['name']}")
        else:
            print(f"Failed to update Notion page for {candidate['name']}")
        
        results.append({
            "name": candidate['name'],
            "role": candidate['role'],
            "score": score,
            "success": success
        })
        
        # Clean up temporary file
        os.unlink(cv_file)
    
    # Print summary
    print("\n=== SCORING RESULTS ===")
    for result in results:
        status = "✅ Updated" if result['success'] else "❌ Failed"
        print(f"{result['name']} ({result['role']}): {result['score']}/10 {status}")

if __name__ == "__main__":
    main()