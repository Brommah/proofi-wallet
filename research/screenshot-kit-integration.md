# Screenshot APIs for Outbound Sales Personalization

> **Research Date:** 2026-01-29
> **Purpose:** Evaluate screenshot APIs for capturing prospect website screenshots to personalize outbound sales emails, landing pages, and pitch decks.

---

## ⚠️ Note on "Screenshot-Kit" by @ayushunleashed

No product called "screenshot-kit" was found associated with GitHub user [@ayushunleashed](https://github.com/AyushUnleashed) (Ayush Yadav). His repos focus on GenAI video tools (ReelsAI.pro), cold email writing (cold-crafter), and image effects. He does have a **cold-crafter** tool (Metaphor-powered cold email writer) which is tangentially related to outbound sales.

The research below covers the **best screenshot APIs available** for the outbound sales personalization use case.

---

## 📊 API Comparison Matrix

| Provider | Free Tier | Starter Price | Cost/1K Screenshots | Block Ads/Cookies | Stealth Mode | S3 Upload | AI Features |
|---|---|---|---|---|---|---|---|
| **ScreenshotOne** | 100/mo | ~$17/mo | ~$4-8 | ✅ | ✅ | ✅ | ❌ |
| **CaptureKit** | 100 credits | $7/mo (1K) | $7 | ✅ | ✅ | ✅ | ✅ AI Summarizer |
| **Urlbox** | 7-day trial | $19/mo (2K) | $6.60-9.80 | ✅ | ✅ (Ultra+) | ✅ | ❌ |
| **Scrnify** | Open beta (free) | €0.008/screenshot | €8 | ✅ | ❌ | ❌ | ❌ |
| **Screenshot Machine** | Limited free | $9/mo | ~$4.50 | ✅ | ❌ | ❌ | ❌ |

---

## 🏆 Top Recommendations for Outbound Sales

### 1. CaptureKit (Best Value + AI Features)
- **Why:** Cheapest starter plan ($7/mo), includes AI-powered content analysis (summarize prospect's website automatically), stealth mode, S3 upload
- **Website:** https://www.capturekit.dev
- **Docs:** https://docs.capturekit.dev

### 2. ScreenshotOne (Most Mature)
- **Why:** Extensive documentation, SDKs in multiple languages, reliable, custom feature development included
- **Website:** https://screenshotone.com
- **Docs:** https://screenshotone.com/docs/getting-started/

### 3. Urlbox (Enterprise-Grade)
- **Why:** Best for high-volume, anti-blocking stealth mode, GPU acceleration, video rendering
- **Website:** https://urlbox.com
- **Pricing:** Starts $49/mo for reliable 3rd-party screenshots (Hi-Fi plan)

---

## 🔧 Integration Guide: Outbound Sales Pipeline

### Architecture Overview

```
Prospect List (CSV/CRM) 
    → Screenshot API (batch capture)
    → S3/Cloud Storage
    → Email Template Engine (embed screenshots)
    → Outbound Email Tool (Instantly, Smartlead, etc.)
```

### Step 1: Batch Screenshot Capture

#### Using ScreenshotOne (Python)

```python
import requests
import time
import csv
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlencode

SCREENSHOTONE_API_KEY = os.environ["SCREENSHOTONE_API_KEY"]
OUTPUT_DIR = "screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def capture_screenshot(url: str, filename: str) -> dict:
    """Capture a screenshot of a prospect's website."""
    params = {
        "access_key": SCREENSHOTONE_API_KEY,
        "url": url,
        "format": "png",
        "viewport_width": 1280,
        "viewport_height": 800,
        "block_ads": True,
        "block_cookie_banners": True,
        "block_chats": True,
        "delay": 3,  # wait for page to fully render
        "cache": True,
        "cache_ttl": 86400,  # cache for 24h
    }
    
    response = requests.get(
        "https://api.screenshotone.com/take",
        params=params,
        timeout=30,
    )
    
    if response.status_code == 200:
        filepath = os.path.join(OUTPUT_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(response.content)
        return {"url": url, "status": "success", "path": filepath}
    else:
        return {"url": url, "status": "error", "code": response.status_code}


def batch_capture(prospects_csv: str, max_workers: int = 5):
    """Capture screenshots for all prospects in a CSV file."""
    results = []
    
    with open(prospects_csv) as f:
        reader = csv.DictReader(f)
        prospects = list(reader)
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {}
        for prospect in prospects:
            url = prospect["website"]
            company = prospect.get("company", "unknown").replace(" ", "_").lower()
            filename = f"{company}.png"
            future = executor.submit(capture_screenshot, url, filename)
            futures[future] = prospect
        
        for future in as_completed(futures):
            result = future.result()
            prospect = futures[future]
            result["company"] = prospect.get("company", "")
            result["email"] = prospect.get("email", "")
            results.append(result)
            print(f"  {'✅' if result['status'] == 'success' else '❌'} {result['company']}: {result['status']}")
            time.sleep(0.2)  # rate limiting
    
    return results
```

#### Using CaptureKit (Python)

```python
import requests
import os

CAPTUREKIT_API_KEY = os.environ["CAPTUREKIT_API_KEY"]

def capture_with_capturekit(url: str) -> bytes:
    """Capture screenshot + get AI summary of prospect's website."""
    # Screenshot
    params = {
        "url": url,
        "access_token": CAPTUREKIT_API_KEY,
        "format": "png",
        "width": 1280,
        "height": 800,
        "block_cookie_banners": True,
        "block_ads": True,
        "stealth": True,
    }
    
    response = requests.get(
        "https://api.capturekit.dev/capture",
        params=params,
        timeout=30,
    )
    return response.content


def get_ai_summary(url: str) -> dict:
    """Use CaptureKit's AI summarizer to understand prospect's business."""
    params = {
        "url": url,
        "access_token": CAPTUREKIT_API_KEY,
    }
    # CaptureKit has an AI summarizer endpoint
    response = requests.get(
        "https://api.capturekit.dev/content",
        params=params,
        timeout=30,
    )
    return response.json()
```

#### Using Urlbox (Node.js)

```javascript
const Urlbox = require('urlbox');

const urlbox = Urlbox(
  process.env.URLBOX_API_KEY,
  process.env.URLBOX_API_SECRET
);

async function captureProspect(url) {
  const options = {
    url,
    width: 1280,
    height: 800,
    format: 'png',
    block_ads: true,
    hide_cookie_banners: true,
    delay: 3000,
    full_page: false,
    retina: false,  // save on file size for emails
  };

  const imgUrl = urlbox.buildUrl(options);
  // imgUrl can be used directly in <img> tags
  // Or fetch and store:
  const response = await fetch(imgUrl);
  return Buffer.from(await response.arrayBuffer());
}
```

### Step 2: Upload to S3 for Email Embedding

```python
import boto3
from botocore.config import Config

s3 = boto3.client('s3', config=Config(signature_version='s3v4'))
BUCKET = "outbound-screenshots"

def upload_screenshot(filepath: str, company: str) -> str:
    """Upload screenshot to S3 and return public URL."""
    key = f"prospects/{company}/{os.path.basename(filepath)}"
    
    s3.upload_file(
        filepath, BUCKET, key,
        ExtraArgs={
            "ContentType": "image/png",
            "CacheControl": "max-age=604800",  # 7 days
        }
    )
    
    # Generate a public URL (or use CloudFront)
    url = f"https://{BUCKET}.s3.amazonaws.com/{key}"
    return url
```

### Step 3: Email Personalization Template

```python
from jinja2 import Template

EMAIL_TEMPLATE = Template("""
Hi {{ first_name }},

I was checking out {{ company }}'s website and noticed 
{{ personalization_hook }}.

Here's what caught my eye:

<img src="{{ screenshot_url }}" alt="{{ company }} website" 
     style="max-width: 600px; border: 1px solid #ddd; border-radius: 8px;" />

{{ value_prop }}

Would you be open to a quick 15-min chat this week?

Best,
{{ sender_name }}
""")

def generate_email(prospect: dict, screenshot_url: str) -> str:
    return EMAIL_TEMPLATE.render(
        first_name=prospect["first_name"],
        company=prospect["company"],
        screenshot_url=screenshot_url,
        personalization_hook=prospect.get("hook", "your approach to customer engagement"),
        value_prop=prospect.get("value_prop", "We help companies like yours..."),
        sender_name="Martijn",
    )
```

### Step 4: Full Pipeline Script

```python
#!/usr/bin/env python3
"""
Full outbound screenshot pipeline.
Usage: python pipeline.py prospects.csv
"""
import sys
import json
import csv
from datetime import datetime

def run_pipeline(csv_path: str):
    print(f"🚀 Starting screenshot pipeline: {csv_path}")
    
    # 1. Batch capture screenshots
    results = batch_capture(csv_path, max_workers=3)
    
    # 2. Upload to S3
    for result in results:
        if result["status"] == "success":
            result["s3_url"] = upload_screenshot(
                result["path"], result["company"]
            )
    
    # 3. Generate personalized emails
    with open(csv_path) as f:
        prospects = {r["website"]: r for r in csv.DictReader(f)}
    
    emails = []
    for result in results:
        if result.get("s3_url"):
            prospect = prospects.get(result["url"], {})
            email_html = generate_email(prospect, result["s3_url"])
            emails.append({
                "to": result["email"],
                "company": result["company"],
                "html": email_html,
            })
    
    # 4. Save output
    output_file = f"outbound_batch_{datetime.now():%Y%m%d_%H%M}.json"
    with open(output_file, "w") as f:
        json.dump(emails, f, indent=2)
    
    print(f"✅ Generated {len(emails)} personalized emails → {output_file}")
    print(f"❌ Failed: {sum(1 for r in results if r['status'] != 'success')}")

if __name__ == "__main__":
    run_pipeline(sys.argv[1])
```

### Input CSV Format

```csv
first_name,company,website,email,hook,value_prop
Jan,Coolblue,https://www.coolblue.nl,jan@coolblue.nl,your focus on customer happiness,We can help automate your support flows
Sarah,Booking,https://www.booking.com,sarah@booking.com,your personalized travel recommendations,Our AI can boost conversion by 15%
```

---

## 🔄 Alternative: Self-Hosted (Free, More Work)

If you want to avoid API costs entirely, use Playwright directly:

```python
from playwright.async_api import async_playwright
import asyncio

async def capture_screenshot_local(url: str, output_path: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        
        # Block cookie banners and ads
        await page.route("**/*", lambda route: (
            route.abort() if any(x in route.request.url for x in [
                "cookie", "consent", "gdpr", "onetrust",
                "doubleclick", "googlesyndication", "facebook.net/en_US/fbevents"
            ]) else route.continue_()
        ))
        
        await page.goto(url, wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)  # extra render time
        
        # Try to dismiss cookie banners
        for selector in ["[id*='cookie'] button", "[class*='consent'] button", 
                         "[id*='accept']", "button:has-text('Accept')"]:
            try:
                btn = page.locator(selector).first
                if await btn.is_visible(timeout=1000):
                    await btn.click()
            except:
                pass
        
        await page.screenshot(path=output_path, type="png")
        await browser.close()

# Run batch
async def batch_local(urls: list[str]):
    tasks = [capture_screenshot_local(url, f"screenshots/{i}.png") 
             for i, url in enumerate(urls)]
    await asyncio.gather(*tasks)
```

**Pros:** Free, full control, no rate limits  
**Cons:** Need to manage infrastructure, handle anti-bot, slower, browser maintenance

---

## 💡 Pro Tips for Outbound Sales Screenshots

1. **Block cookie banners** — Always enable this; messy screenshots look unprofessional
2. **Block ads and chat widgets** — Clean screenshots convert better
3. **Use caching** — Don't re-capture the same site multiple times
4. **Viewport 1280x800** — Standard laptop view, looks natural in emails
5. **Don't use full-page** — Above-the-fold only, keeps email compact
6. **Add a subtle border** — CSS `border: 1px solid #eee; border-radius: 8px` makes it look intentional
7. **Combine with AI analysis** — CaptureKit's AI summarizer can auto-generate personalization hooks
8. **Thumbnail size** — For emails, resize to ~600px wide max to keep email size manageable
9. **Respect privacy** — Don't screenshot login-gated or sensitive pages
10. **Refresh weekly** — Prospect sites change; stale screenshots look bad

---

## 📈 Cost Estimation for Outbound Campaigns

| Campaign Size | CaptureKit | ScreenshotOne | Urlbox | Self-Hosted |
|---|---|---|---|---|
| 100 prospects/mo | $0 (free tier) | $0 (free tier) | $19/mo | $0 + infra |
| 1,000 prospects/mo | $7/mo | ~$17/mo | $49/mo | $5-20/mo (VPS) |
| 5,000 prospects/mo | $29/mo | ~$50/mo | $49/mo | $20-50/mo (VPS) |
| 10,000 prospects/mo | $29/mo | ~$50/mo | $99/mo | $50-100/mo (VPS) |
| 50,000 prospects/mo | $89/mo | ~$125/mo | $498/mo | $100-200/mo |

**Winner for most outbound teams: CaptureKit** at $7-29/mo covers 1K-10K prospects with the bonus of AI content analysis.

---

## 🔗 Quick Links

- **CaptureKit:** https://www.capturekit.dev | [Docs](https://docs.capturekit.dev) | [Pricing](https://www.capturekit.dev/pricing)
- **ScreenshotOne:** https://screenshotone.com | [Docs](https://screenshotone.com/docs/getting-started/) | [Pricing](https://screenshotone.com/pricing/)
- **Urlbox:** https://urlbox.com | [Node SDK](https://github.com/urlbox/urlbox-node) | [Pricing](https://urlbox.com/pricing)
- **Scrnify:** https://scrnify.com | Pay-as-you-go €0.008/screenshot (currently free beta)
- **Screenshot Machine:** https://www.screenshotmachine.com | Budget option ~$9/mo
