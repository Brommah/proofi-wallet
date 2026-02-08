#!/usr/bin/env python3
"""Generate 4 X/Twitter ad visuals for Cere Network hiring campaign using Gemini Imagen 4."""

import os
from google import genai
from google.genai import types

API_KEY = "AIzaSyAMp8gJZUMLQpWj09vmrlxWm2Jj0toh4gc"
OUTPUT_DIR = "/Users/martijnbroersma/clawd/assets"

client = genai.Client(api_key=API_KEY)

IMAGES = [
    {
        "name": "x-ad-principal-swe-creative",
        "prompt": "A dark premium 3D visualization of distributed systems architecture. Multiple sleek server nodes rendered as translucent geometric cubes connected by luminous data streams flowing between them in a mesh network topology. Each node emits soft cool light. Thin fiber-optic threads of data pulse between nodes in silver and ice blue. The architecture floats in a deep navy void with subtle slate particle clouds. Chrome and brushed metal materials on the server nodes. Volumetric lighting from data streams. Color palette: slate, silver, ice blue, deep navy background. Hyper-real 3D render. No text, no logos, no people, no branding. Dark background. Photorealistic. Aspect ratio 1.91:1 landscape format."
    },
    {
        "name": "x-ad-blockchain-eng-creative",
        "prompt": "A dark premium 3D visualization of blockchain infrastructure. Crystalline interlocking blocks forming a chain structure stretching diagonally, each block semi-transparent with internal glowing circuitry visible inside. Golden light flows through the chain links connecting each block. The blocks have faceted gem-like surfaces with subtle purple refractions. Around the main chain, smaller parallel chains orbit as thinner crystalline strands connected by bridge-like light beams. Deep black background with subtle deep purple atmospheric fog. Color palette: deep purple, gold accents, amethyst crystalline. Hyper-real 3D render with caustics and refractions. No text, no logos, no people, no branding, no Bitcoin symbols. Photorealistic. Aspect ratio 1.91:1 landscape format."
    },
    {
        "name": "x-ad-founders-associate-creative",
        "prompt": "A dark premium 3D visualization of a strategic command center concept. Multiple translucent data streams and holographic information flows converging from different directions toward a single bright central nexus point. The streams carry abstract representations — flowing ribbons, connected dot networks, streaming particles. The convergence point glows with warm amber light. Surrounding the streams are faint circular radar-like rings suggesting monitoring and oversight. Composition suggests orchestration of complex operations. Color palette: amber, champagne gold, warm charcoal background, copper accents. Soft-glow gradients with warm premium lighting. No text, no logos, no people, no screens. Abstract premium 3D render. Photorealistic. Aspect ratio 1.91:1 landscape format."
    },
    {
        "name": "x-ad-ai-innovator-creative",
        "prompt": "A dark premium 3D visualization of AI deployment and creation. A luminous abstract neural network brain structure at center-left, rendered as interconnected glowing nodes with electric blue synaptic connections. From this brain, bright signal beams radiate outward to the right, transforming into concrete deployed forms — the signals crystallize into solid geometric shapes like clean cubes, spheres, architectural forms. Hot coral energy pulses at the transformation boundary where abstract becomes concrete. Trailing particle effects follow the signal paths. Color palette: electric blue, hot coral accents, deep dark background. High-contrast energetic but premium. No text, no logos, no people, no robots, no faces. Abstract conceptual 3D art. Photorealistic. Aspect ratio 1.91:1 landscape format."
    }
]

os.makedirs(OUTPUT_DIR, exist_ok=True)

for img_config in IMAGES:
    name = img_config["name"]
    prompt = img_config["prompt"]
    output_path = os.path.join(OUTPUT_DIR, f"{name}.png")
    
    print(f"\n{'='*60}")
    print(f"Generating: {name}")
    print(f"{'='*60}")
    
    try:
        # Try Imagen 4 first
        response = client.models.generate_images(
            model="imagen-4.0-generate-001",
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="16:9",  # Closest standard ratio to 1.91:1
                output_mime_type="image/png",
            )
        )
        
        if response.generated_images:
            image = response.generated_images[0]
            image.image.save(output_path)
            print(f"✅ Saved: {output_path}")
        else:
            print(f"❌ No image generated for {name}")
            
    except Exception as e:
        print(f"❌ Error with Imagen 4 for {name}: {e}")
        # Fallback: try gemini-2.5-flash-image
        try:
            print(f"Trying fallback model gemini-2.5-flash-image...")
            response = client.models.generate_content(
                model="gemini-2.5-flash-image",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                )
            )
            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    with open(output_path, "wb") as f:
                        f.write(part.inline_data.data)
                    print(f"✅ Saved (fallback): {output_path}")
                    break
        except Exception as e2:
            print(f"❌ Fallback also failed: {e2}")

print(f"\n{'='*60}")
print("Done!")
