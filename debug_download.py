#!/usr/bin/env python3

import json
import requests

# Configuration
NOTION_API_KEY = "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"

notion_headers = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

# Test with Sina Montazeri
candidate_id = "182d8000-83d6-8015-8091-dc8ede98b5c7"

print("Fetching Notion page...")
url = f"https://api.notion.com/v1/pages/{candidate_id}"
response = requests.get(url, headers=notion_headers)

if response.status_code != 200:
    print(f"Failed: {response.status_code}")
    exit(1)

page_data = response.json()
properties = page_data.get('properties', {})
resume_prop = properties.get('Resume', {})

print("Resume property:")
print(json.dumps(resume_prop, indent=2))

if resume_prop.get('type') == 'files':
    files = resume_prop.get('files', [])
    if files:
        file_data = files[0]
        print(f"\nFile data:")
        print(json.dumps(file_data, indent=2))
        
        if file_data.get('type') == 'file':
            resume_url = file_data['file']['url']
            print(f"\nFull resume URL:")
            print(resume_url)
            
            print(f"\nTrying to download...")
            
            # Try without auth first
            print("1. Trying without auth headers...")
            response = requests.get(resume_url)
            print(f"Status: {response.status_code}")
            
            # Try with Notion auth
            print("2. Trying with Notion auth headers...")
            headers = {"Authorization": f"Bearer {NOTION_API_KEY}"}
            response = requests.get(resume_url, headers=headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"Error: {response.text}")
                
                # Try with User-Agent
                print("3. Trying with User-Agent...")
                headers = {
                    "Authorization": f"Bearer {NOTION_API_KEY}",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
                }
                response = requests.get(resume_url, headers=headers)
                print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"Success! Content length: {len(response.content)} bytes")
                print(f"Content type: {response.headers.get('content-type')}")
                
                # Save it to test
                with open("/tmp/test_resume.pdf", "wb") as f:
                    f.write(response.content)
                print("Saved to /tmp/test_resume.pdf")
            else:
                print(f"Still failed: {response.status_code}")