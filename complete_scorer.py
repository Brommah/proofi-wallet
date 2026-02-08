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

print("=== Complete Candidate Scorer ===")

# Configuration
NOTION_API_KEY = Path.home() / ".config" / "notion" / "api_key"
OPENAI_API_KEY = "sk-proj-UcLLyEDj3ZToGwihyS6kT3BlbkFJ1IJTSnZN1h706LJALheH"

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
    with open(NOTION_API_KEY, 'r') as f:
        return f.read().strip()

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
        print(f"❌ Error fetching page {page_id}: {response.status_code}")
        return None

def extract_cv_url(page_data):
    """Extract CV URL from Notion page"""
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
        return None
    except Exception as e:
        print(f"❌ Error extracting CV URL: {e}")
        return None

def download_and_extract_text(url):
    """Download file and extract text"""
    temp_file = None
    try:
        print(f"    Downloading from: {url[:50]}...")
        response = requests.get(url, stream=True, allow_redirects=True, timeout=30)
        response.raise_for_status()
        
        content_type = response.headers.get('Content-Type', '').lower()
        print(f"    Content-Type: {content_type}")
        
        # Determine file extension
        if 'pdf' in content_type:
            file_extension = '.pdf'
        elif 'docx' in content_type or 'officedocument' in content_type:
            file_extension = '.docx'
        else:
            file_extension = '.pdf'  # Assume PDF
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
            file_size = 0
            for chunk in response.iter_content(chunk_size=8192):
                tmp.write(chunk)
                file_size += len(chunk)
            temp_file = tmp.name
        
        print(f"    Downloaded {file_size} bytes to {temp_file}")
        
        # Extract text
        text = ""
        if file_extension == '.pdf':
            try:
                # Suppress PyPDF2 warnings
                import warnings
                warnings.filterwarnings("ignore", category=UserWarning)
                
                with open(temp_file, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    print(f"    PDF has {len(pdf_reader.pages)} pages")
                    
                    for i, page in enumerate(pdf_reader.pages):
                        try:
                            page_text = page.extract_text()
                            if page_text and page_text.strip():
                                text += page_text + "\n"
                        except Exception as page_e:
                            print(f"    ⚠️  Error on page {i+1}: {page_e}")
                            continue
                            
            except Exception as pdf_e:
                print(f"    ❌ PDF parsing failed: {pdf_e}")
                return None
                
        elif file_extension == '.docx':
            try:
                doc = docx.Document(temp_file)
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"
            except Exception as docx_e:
                print(f"    ❌ DOCX parsing failed: {docx_e}")
                return None
        
        if text.strip():
            print(f"    ✓ Extracted {len(text)} characters")
            return text
        else:
            print("    ❌ No text extracted")
            return None
        
    except Exception as e:
        print(f"    ❌ Download/extract error: {e}")
        return None
    finally:
        # Clean up temp file
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except:
                pass

def load_prompt(prompt_file):
    """Load scoring prompt"""
    try:
        with open(prompt_file, 'r') as f:
            return f.read().strip()
    except Exception as e:
        print(f"❌ Error loading prompt: {e}")
        return None

def score_with_openai(resume_text, prompt):
    """Score with OpenAI"""
    try:
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        # Truncate if too long
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
        print(f"  Response preview: {response_text[:150]}...")
        
        # Extract score
        score_patterns = [
            r'(?:score|rating)[:\s]*(\d{1,2}(?:\.\d)?)',
            r'(\d{1,2}(?:\.\d)?)\s*(?:/10|out of 10)',
            r'final\s+(?:score|rating)[:\s]*(\d{1,2}(?:\.\d)?)',
            r'overall[:\s]*(\d{1,2}(?:\.\d)?)',
        ]
        
        for pattern in score_patterns:
            score_match = re.search(pattern, response_text, re.IGNORECASE | re.MULTILINE)
            if score_match:
                score = float(score_match.group(1))
                if 1 <= score <= 10:
                    return score
        
        print(f"❌ Could not extract score from response")
        return None
        
    except Exception as e:
        print(f"❌ OpenAI error: {e}")
        return None

def update_notion_score(page_id, score, notion_key):
    """Update Notion page with score"""
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
    return response.status_code == 200

def main():
    print("Starting scoring process...\n")
    
    notion_key = read_notion_api_key()
    results = []
    
    for i, candidate in enumerate(CANDIDATES):
        print(f"[{i+1}/4] Processing {candidate['name']}...")
        
        # 1. Fetch page
        page_data = get_notion_page(candidate['page_id'], notion_key)
        if not page_data:
            continue
        
        # 2. Extract CV URL
        cv_url = extract_cv_url(page_data)
        if not cv_url:
            print("  ❌ No CV URL found")
            continue
        print(f"  ✓ Found CV URL")
        
        # 3. Download and extract text
        print("  📄 Downloading and extracting text...")
        cv_text = download_and_extract_text(cv_url)
        if not cv_text:
            continue
        print(f"  ✓ Extracted {len(cv_text)} characters")
        
        # 4. Load prompt
        prompt = load_prompt(candidate['prompt_file'])
        if not prompt:
            continue
        print("  ✓ Loaded scoring prompt")
        
        # 5. Score with OpenAI
        print("  🤖 Scoring with OpenAI...")
        score = score_with_openai(cv_text, prompt)
        if score is None:
            continue
        print(f"  ✓ Score: {score}/10")
        
        # 6. Update Notion
        print("  📝 Updating Notion...")
        success = update_notion_score(candidate['page_id'], score, notion_key)
        if success:
            print("  ✅ Updated successfully")
        else:
            print("  ❌ Update failed")
        
        results.append({
            "name": candidate['name'],
            "role": candidate['role'],
            "score": score,
            "success": success
        })
        
        print()
    
    # Summary
    print("=" * 50)
    print("FINAL RESULTS:")
    print("=" * 50)
    for result in results:
        status = "✅" if result['success'] else "❌"
        print(f"{status} {result['name']} ({result['role']}): {result['score']}/10")

if __name__ == "__main__":
    main()