#!/usr/bin/env python3
import json
import base64
import requests
import time
import os

API_KEY = "AIzaSyAMp8gJZUMLQpWj09vmrlxWm2Jj0toh4gc"
MODEL = "gemini-2.0-flash-exp-image-generation"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

ICONS = [
    ("neural-reflex", "Glowing neon brain with lightning bolt, cyberpunk style with neon cyan and hot pink colors"),
    ("cryptoquest", "Medieval sword crossed with shield featuring a dragon silhouette, royal gold and deep purple"),
    ("trustrate", "Professional star with checkmark inside, navy blue and amber gold colors"),
    ("dropvault", "Secure vault door with lock mechanism, black and emerald green colors"),
    ("skillbadge", "Trophy or badge with sparkles around it, purple gradient, friendly and playful"),
    ("chainpoll", "Ballot box with checkmark, navy blue and red, institutional and trustworthy"),
    ("memorychain", "Open diary or journal with a chain link, cream and rose warm colors"),
    ("tokengate", "Golden ornate key with velvet rope, black and gold luxury style"),
    ("nfticket", "Event ticket with glowing QR code, purple and orange festival vibes"),
    ("chainchat", "Chat bubble with chain link element, cyan and coral friendly colors"),
    ("artmint", "Pixel art style palette with brush, mint green and purple colors"),
    ("speedtype", "Keyboard with speedometer overlay, green terminal hacker aesthetic"),
    ("colordash", "Four colored circles arranged in a pattern, rainbow primary colors playful"),
    ("photos", "Camera aperture with crystal refraction effect, dark and amber premium style"),
    ("proofidrop", "Falling water droplet with lock inside, cyan and violet brutalist design"),
]

def generate_icon(name, description):
    prompt = f"Generate a 1024x1024 square app icon for iOS App Store: {description}. Clean iconic design, rich gradients, 3D depth with subtle shadows, no text anywhere, Apple App Store aesthetic, simple and memorable, recognizable at small sizes. Centered composition with rounded corner friendly design."
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["image", "text"]}
    }
    
    response = requests.post(URL, json=payload, headers={"Content-Type": "application/json"})
    data = response.json()
    
    if "error" in data:
        print(f"❌ {name}: {data['error']['message']}")
        return False
    
    # Find the image part
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    for part in parts:
        if "inlineData" in part:
            img_data = part["inlineData"]["data"]
            with open(f"{name}-icon.png", "wb") as f:
                f.write(base64.b64decode(img_data))
            size = os.path.getsize(f"{name}-icon.png")
            print(f"✅ {name}-icon.png ({size//1024}KB)")
            return True
    
    print(f"❌ {name}: No image in response")
    return False

if __name__ == "__main__":
    os.chdir("/Users/martijnbroersma/clawd/proofi/icons")
    success = 0
    for name, desc in ICONS:
        if generate_icon(name, desc):
            success += 1
        time.sleep(2)  # Rate limiting
    
    print(f"\n🎨 Generated {success}/{len(ICONS)} icons")
