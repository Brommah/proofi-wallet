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

print("=== Simple Candidate Scorer ===")
print("Imports successful!")

# Configuration
NOTION_API_KEY = Path.home() / ".config" / "notion" / "api_key"
OPENAI_API_KEY = "sk-proj-UcLLyEDj3ZToGwihyS6kT3BlbkFJ1IJTSnZN1h706LJALheH"

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
    
    print(f"Fetching page: {page_id}")
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        print("✓ Page fetched successfully")
        return response.json()
    else:
        print(f"❌ Error fetching page: {response.status_code} - {response.text}")
        return None

# Test with one candidate first
print("\nReading API key...")
notion_key = read_notion_api_key()
print(f"✓ API key loaded (length: {len(notion_key)})")

print("\nTesting with Orhun's page...")
page_data = get_notion_page("2fcd8000-83d6-8146-9fbf-c0efd3c59566", notion_key)

if page_data:
    print("✓ Successfully fetched page data")
    # Extract resume URL
    try:
        properties = page_data.get("properties", {})
        resume_prop = properties.get("Resume", {})
        files = resume_prop.get("files", [])
        
        if files:
            file_obj = files[0]
            if "external" in file_obj:
                url = file_obj["external"]["url"]
                print(f"✓ Found external file URL: {url[:100]}...")
            elif "file" in file_obj:
                url = file_obj["file"]["url"]
                print(f"✓ Found internal file URL: {url[:100]}...")
            else:
                print("❌ Unknown file structure")
                url = None
                
            # Try to download the file
            if url:
                print("\nDownloading file...")
                try:
                    response = requests.get(url, stream=True, allow_redirects=True)
                    response.raise_for_status()
                    
                    content_type = response.headers.get('Content-Type', '').lower()
                    print(f"Content-Type: {content_type}")
                    
                    # Determine file extension
                    if 'pdf' in content_type:
                        file_extension = '.pdf'
                    elif 'docx' in content_type or 'officedocument' in content_type:
                        file_extension = '.docx'
                    else:
                        file_extension = '.pdf'  # Assume PDF as fallback
                    
                    # Save to temp file
                    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
                        for chunk in response.iter_content(chunk_size=8192):
                            tmp.write(chunk)
                        temp_file = tmp.name
                    
                    print(f"✓ Downloaded to: {temp_file}")
                    
                    # Try to extract text
                    if file_extension == '.pdf':
                        print("Extracting text from PDF...")
                        try:
                            text = ""
                            with open(temp_file, 'rb') as file:
                                pdf_reader = PyPDF2.PdfReader(file)
                                print(f"PDF has {len(pdf_reader.pages)} pages")
                                for i, page in enumerate(pdf_reader.pages):
                                    page_text = page.extract_text()
                                    text += page_text + "\n"
                                    if i == 0:  # Show first page preview
                                        print(f"First page preview: {page_text[:200]}...")
                            
                            print(f"✓ Extracted {len(text)} characters")
                            
                        except Exception as e:
                            print(f"❌ PDF extraction error: {e}")
                    
                    # Clean up
                    os.unlink(temp_file)
                    
                except Exception as e:
                    print(f"❌ Download error: {e}")
        else:
            print("❌ No files found in Resume property")
            
    except Exception as e:
        print(f"❌ Error extracting file: {e}")
        
else:
    print("❌ Failed to fetch page data")

print("\n=== Test Complete ===")