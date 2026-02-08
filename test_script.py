#!/usr/bin/env python3
import os
from pathlib import Path

print("Test script starting...")

# Configuration
NOTION_API_KEY = Path.home() / ".config" / "notion" / "api_key"

def read_notion_api_key():
    """Read Notion API key from config file"""
    try:
        with open(NOTION_API_KEY, 'r') as f:
            return f.read().strip()
    except Exception as e:
        print(f"Error reading Notion API key: {e}")
        return None

print("Reading Notion API key...")
notion_key = read_notion_api_key()
if notion_key:
    print(f"✓ Notion API key loaded (length: {len(notion_key)})")
else:
    print("Failed to read Notion API key")

print("Test completed successfully!")