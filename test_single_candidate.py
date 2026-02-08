#!/usr/bin/env python3

import json
import requests
import os
import tempfile
import sys
from pathlib import Path

# Configuration
NOTION_API_KEY = "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"
OPENAI_API_KEY = "sk-proj-UcLLyEDj3ZToGwihyS6kT3BlbkFJ1IJTSnZN1h706LJALheH"

# Headers for Notion API
notion_headers = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

def test_notion_api():
    """Test if we can fetch a Notion page"""
    test_page_id = "182d8000-83d6-8015-8091-dc8ede98b5c7"  # Sina Montazeri
    url = f"https://api.notion.com/v1/pages/{test_page_id}"
    
    print(f"Testing Notion API with URL: {url}")
    print(f"Headers: {notion_headers}")
    
    response = requests.get(url, headers=notion_headers)
    
    print(f"Response status: {response.status_code}")
    print(f"Response headers: {dict(response.headers)}")
    
    if response.status_code != 200:
        print(f"Error response: {response.text}")
        return None
    
    data = response.json()
    print(f"Successfully fetched page data")
    
    # Look for resume files
    properties = data.get('properties', {})
    print(f"Available properties: {list(properties.keys())}")
    
    resume_prop = properties.get('Resume', {})
    print(f"Resume property: {json.dumps(resume_prop, indent=2)}")
    
    return data

def test_openai_api():
    """Test OpenAI API"""
    url = "https://api.openai.com/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "user", "content": "Test message. Please respond with just the number 7."}
        ],
        "temperature": 0.3,
        "max_tokens": 10
    }
    
    print("Testing OpenAI API...")
    response = requests.post(url, headers=headers, json=payload)
    
    print(f"Response status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Error response: {response.text}")
        return False
    
    result = response.json()
    print(f"OpenAI response: {result['choices'][0]['message']['content']}")
    return True

if __name__ == "__main__":
    print("=== Testing Notion API ===")
    notion_result = test_notion_api()
    
    print("\n=== Testing OpenAI API ===")
    openai_result = test_openai_api()
    
    print(f"\nNotion test: {'✅' if notion_result else '❌'}")
    print(f"OpenAI test: {'✅' if openai_result else '❌'}")