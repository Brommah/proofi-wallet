# Proofi Troubleshooting Guide

> Common issues and how to fix them.

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Frontend Issues](#frontend-issues)
3. [Wallet Connection Issues](#wallet-connection-issues)
4. [API Issues](#api-issues)
5. [Agent SDK Issues](#agent-sdk-issues)
6. [Chrome Extension Issues](#chrome-extension-issues)
7. [Health Data Issues](#health-data-issues)
8. [DDC/Cere Issues](#ddccere-issues)
9. [Deployment Issues](#deployment-issues)
10. [Performance Issues](#performance-issues)
11. [Emergency Procedures](#emergency-procedures)

---

## Quick Diagnostics

### Health Check Script

```bash
#!/bin/bash
# Save as: check-proofi.sh

echo "=== Proofi Health Check ==="
echo ""

# Check frontend
echo -n "Frontend (proofi.ai): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://proofi.ai)
[ "$HTTP_CODE" = "200" ] && echo "✓ OK" || echo "✗ FAIL ($HTTP_CODE)"

# Check API
echo -n "API (revoke endpoint): "
API_RESP=$(curl -s "https://proofi-virid.vercel.app/api/ddc/revoke?tokenId=test")
echo "$API_RESP" | grep -q "revoked" && echo "✓ OK" || echo "✗ FAIL"

# Check Vercel status
echo -n "Vercel status: "
curl -s https://www.vercel-status.com/api/v2/status.json | grep -q '"indicator":"none"' && echo "✓ OK" || echo "⚠ Check https://vercel-status.com"

echo ""
echo "=== Local Environment ==="
echo "Node: $(node -v 2>/dev/null || echo 'not installed')"
echo "npm: $(npm -v 2>/dev/null || echo 'not installed')"
echo "Vercel CLI: $(vercel -v 2>/dev/null || echo 'not installed')"

echo ""
echo "=== Done ==="
```

---

## Frontend Issues

### Page Shows Blank/White Screen

**Symptoms:** Landing page or app shows nothing

**Causes & Fixes:**

1. **JavaScript error blocking render**
   ```bash
   # Check browser console (F12 → Console)
   # Look for red errors
   
   # Common fix: clear browser cache
   # Chrome: Ctrl+Shift+Delete → Cached images/files
   ```

2. **Vercel deployment failed**
   ```bash
   # Check deployment status
   vercel ls
   
   # Redeploy
   vercel --prod
   ```

3. **Missing environment variables**
   ```bash
   # Check Vercel env vars
   vercel env ls
   
   # Pull to local
   vercel env pull
   ```

### CSS Not Loading / Broken Layout

**Symptoms:** Page loads but looks broken, unstyled

**Fixes:**

1. **Hard refresh**
   - Windows/Linux: `Ctrl+Shift+R`
   - Mac: `Cmd+Shift+R`

2. **Check for CSS errors in console**
   ```
   Failed to load resource: net::ERR_CONNECTION_REFUSED
   # → Check if correct domain in CSS links
   ```

3. **Clear CDN cache**
   ```bash
   # Vercel automatically handles this, but you can force:
   vercel --prod --force
   ```

### Images Not Loading

**Symptoms:** Broken image icons, 404s for images

**Fixes:**

1. **Check image paths**
   ```bash
   # Paths should be relative or absolute from root
   # ✓ Good: /icons/logo.svg
   # ✓ Good: ./assets/image.png
   # ✗ Bad: ../../../images/logo.svg (can break on deploy)
   ```

2. **Check file case sensitivity**
   ```bash
   # Linux servers are case-sensitive
   # Logo.PNG ≠ logo.png
   
   # Find case mismatches
   find . -name "*.png" -o -name "*.PNG" -o -name "*.svg" -o -name "*.SVG"
   ```

3. **Large images failing to load**
   ```bash
   # Optimize images
   npx sharp-cli resize 1200 input.png -o output.png
   
   # Or convert to WebP
   npx sharp-cli input.png -o output.webp
   ```

---

## Wallet Connection Issues

### "Connect" Button Does Nothing

**Symptoms:** Clicking connect has no effect

**Fixes:**

1. **Check if SDK is loaded**
   ```javascript
   // In browser console:
   console.log(window.ProofiSDK); // Should not be undefined
   ```

2. **Check for JS errors before connect**
   ```javascript
   // Look for errors that stopped script execution
   // Fix: Check console for the actual error message
   ```

3. **Check wallet URL**
   ```javascript
   // In browser console:
   const sdk = new ProofiSDK();
   console.log(sdk.walletUrl); // Should be valid URL
   ```

### Wallet Modal Opens But Stays Blank

**Symptoms:** Overlay appears, but iframe content is empty

**Fixes:**

1. **Check iframe src**
   ```javascript
   // In browser console after clicking connect:
   document.querySelector('.proofi-iframe').src
   // Should return valid wallet URL
   ```

2. **Check for cross-origin issues**
   ```
   # In console, look for:
   Refused to display in a frame because it set 'X-Frame-Options' to 'deny'
   
   # Fix: Wallet app must allow framing from your domain
   ```

3. **Check network tab**
   ```
   # F12 → Network → filter by "app" or "wallet"
   # Look for failed requests (red)
   ```

### Connection Lost After Refresh

**Symptoms:** Have to reconnect every page load

**Causes:**

1. **localStorage disabled/blocked**
   ```javascript
   // Check if localStorage works:
   try {
     localStorage.setItem('test', 'test');
     localStorage.removeItem('test');
     console.log('localStorage works');
   } catch (e) {
     console.log('localStorage blocked:', e);
   }
   ```

2. **Private/incognito mode**
   - Some browsers restrict storage in incognito
   - Fix: Use normal browsing mode

3. **Third-party cookie blocking**
   - Cross-origin iframes may not store cookies
   - Fix: Use localStorage instead of cookies

---

## API Issues

### 500 Internal Server Error

**Symptoms:** API returns 500 status

**Diagnosis:**

```bash
# Check Vercel logs
vercel logs --follow

# Or in dashboard:
# Vercel → Project → Deployments → Functions tab → Logs
```

**Common Causes:**

1. **Missing environment variable**
   ```javascript
   // Error: Cannot read property 'split' of undefined
   // → Check if env var is set
   vercel env ls
   ```

2. **DDC connection failed**
   ```bash
   # Check if DDC RPC is reachable
   curl -I wss://rpc.testnet.cere.network/ws
   ```

3. **Timeout on heavy operation**
   ```javascript
   // Vercel serverless timeout: 10-60s depending on plan
   // Fix: Optimize or use streaming
   ```

### CORS Errors

**Symptoms:** `Access-Control-Allow-Origin` errors in console

**Fixes:**

1. **Check vercel.json headers**
   ```json
   {
     "headers": [
       {
         "source": "/api/(.*)",
         "headers": [
           { "key": "Access-Control-Allow-Origin", "value": "https://proofi.ai" }
         ]
       }
     ]
   }
   ```

2. **Add your domain to allowed origins**
   ```json
   { "key": "Access-Control-Allow-Origin", "value": "https://proofi.ai, https://your-domain.com" }
   ```

3. **For development, allow localhost**
   ```json
   { "key": "Access-Control-Allow-Origin", "value": "*" }
   // ⚠️ Only for development! Remove before production
   ```

### API Returns Empty Response

**Symptoms:** 200 OK but empty body

**Fixes:**

1. **Check if response is being sent**
   ```javascript
   // In API handler, ensure you return:
   export default function handler(req, res) {
     res.status(200).json({ data: 'something' }); // ← Must call this
   }
   ```

2. **Check for early returns**
   ```javascript
   // Look for return statements before response
   if (someCondition) {
     return; // ← This returns nothing!
   }
   res.json({ data: 'x' });
   ```

---

## Agent SDK Issues

### Token Validation Fails

**Symptoms:** `TokenExpiredError` or `InvalidTokenError`

**Diagnosis:**

```typescript
import { parseToken } from '@proofi/agent-sdk';

const token = parseToken(tokenString);
console.log('Token:', {
  expiresAt: new Date(token.expiresAt * 1000),
  now: new Date(),
  isExpired: token.expiresAt * 1000 < Date.now(),
});
```

**Fixes:**

1. **Token expired**
   - Request new token from user
   - Tokens are time-limited by design

2. **Clock skew**
   ```bash
   # Sync system time
   sudo ntpdate pool.ntp.org  # Linux
   # macOS syncs automatically
   ```

3. **Wrong audience**
   - Token was issued for different agent
   - Request token specifically for your agent

### DEK Unwrap Fails

**Symptoms:** `DEKUnwrapError: Failed to unwrap DEK`

**Causes:**

1. **Wrong private key**
   ```typescript
   // Ensure you're using the key that matches your public key
   const { publicKey, privateKey } = loadAgentKeyPair();
   console.log('Agent public key:', encodeBase64(publicKey));
   // This should match what user used to wrap DEK
   ```

2. **Corrupted wrappedDEK**
   ```typescript
   // Validate wrappedDEK format
   const decoded = decodeBase64(token.wrappedDEK);
   console.log('Wrapped DEK length:', decoded.length);
   // Should be 48 bytes (32 DEK + 16 nonce) or similar
   ```

3. **Key format mismatch**
   ```typescript
   // Keys must be Uint8Array or base64 string
   // Common mistake: using hex-encoded keys
   ```

### DDC Connection Issues

**Symptoms:** `DDCError: Connection failed`

**Fixes:**

1. **Check RPC URL**
   ```bash
   # Testnet
   export DDC_RPC_URL=wss://rpc.testnet.cere.network/ws
   
   # Mainnet
   export DDC_RPC_URL=wss://rpc.mainnet.cere.network/ws
   ```

2. **Network connectivity**
   ```bash
   # Test WebSocket connection
   wscat -c wss://rpc.testnet.cere.network/ws
   ```

3. **Rate limiting**
   - Wait and retry
   - Use exponential backoff

---

## Chrome Extension Issues

### Extension Not Loading

**Symptoms:** Extension doesn't appear in toolbar

**Fixes:**

1. **Check manifest.json**
   ```bash
   # Validate JSON syntax
   cat chrome-ext/manifest.json | jq .
   ```

2. **Reload extension**
   ```
   chrome://extensions → Toggle extension off/on
   Or: Click refresh icon on extension card
   ```

3. **Check for errors**
   ```
   chrome://extensions → Details → Errors
   ```

### Popup Shows Blank

**Symptoms:** Clicking extension shows empty popup

**Fixes:**

1. **Check popup.html path in manifest**
   ```json
   {
     "action": {
       "default_popup": "popup.html"  // Must match filename
     }
   }
   ```

2. **Check console for popup**
   ```
   Right-click extension icon → Inspect popup → Console
   ```

### Background Script Errors

**Symptoms:** Extension partially works, some features broken

**Debug:**

```
chrome://extensions → Details → 
  Inspect views: background page (or service worker)
  → Console tab
```

---

## Health Data Issues

### XML Import Fails

**Symptoms:** `Error: Failed to parse export.xml`

**Fixes:**

1. **Check file exists**
   ```bash
   ls -la ~/.proofi/health/raw/export.xml
   ```

2. **Check file size**
   ```bash
   # Very large files (>500MB) may need more memory
   du -h ~/.proofi/health/raw/export.xml
   
   # Increase Node memory if needed
   NODE_OPTIONS="--max-old-space-size=4096" npm run import -- --file export.xml
   ```

3. **Check XML validity**
   ```bash
   # Quick syntax check
   head -50 export.xml
   
   # Should start with <?xml version="1.0"
   ```

### Ollama Not Running

**Symptoms:** `Error: Connection refused to localhost:11434`

**Fixes:**

```bash
# Start Ollama
ollama serve &

# Check if running
curl http://localhost:11434/api/tags

# If model missing
ollama pull llama3.2:3b
```

### Decryption Failed

**Symptoms:** `Error: Decryption failed`

**Causes:**

1. **Wrong password**
   - Re-enter correct encryption password
   - No recovery if password lost

2. **Corrupted encrypted file**
   ```bash
   # Check file integrity
   ls -la ~/.proofi/encrypted/
   
   # Re-import from source if corrupted
   npm run import -- --file export.xml --force
   ```

---

## DDC/Cere Issues

### Bucket Not Found

**Symptoms:** `ResourceNotFoundError: Bucket does not exist`

**Fixes:**

1. **Check bucket ID**
   ```bash
   echo $DDC_BUCKET_ID
   # Should be valid bucket ID from DDC
   ```

2. **Create bucket if needed**
   ```typescript
   // Use DDC SDK to create bucket
   const bucketId = await ddcClient.createBucket({ ... });
   ```

### Upload Failed

**Symptoms:** `DDCError: Upload failed`

**Causes:**

1. **Insufficient balance**
   - Check CERE token balance
   - Top up testnet tokens from faucet

2. **Blob too large**
   - Split into chunks
   - Use streaming upload

3. **Network issues**
   - Retry with exponential backoff
   - Check DDC status

---

## Deployment Issues

### Vercel Build Fails

**Symptoms:** Deploy fails during build

**Check logs:**

```bash
vercel logs --scope=build
```

**Common Fixes:**

1. **Missing dependency**
   ```bash
   # Check if all deps are in package.json
   npm install
   
   # Commit lock file
   git add package-lock.json
   git commit -m "Update lock file"
   ```

2. **Node version mismatch**
   ```json
   // package.json
   {
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```

3. **TypeScript error**
   ```bash
   # Fix type errors locally first
   npx tsc --noEmit
   ```

### Environment Variables Not Available

**Symptoms:** Code can't access env vars

**Fixes:**

1. **Check variable scope**
   ```bash
   # List all env vars
   vercel env ls
   
   # Make sure scope includes your environment:
   # Development, Preview, Production
   ```

2. **Re-deploy after adding vars**
   ```bash
   vercel --prod
   ```

3. **Check for typos**
   ```bash
   # In code:
   process.env.DDC_BUCKET_ID  // Must match exactly
   process.env.Ddc_Bucket_Id  // Wrong!
   ```

---

## Performance Issues

### Slow Page Load

**Diagnosis:**

```bash
# Run Lighthouse
lighthouse https://proofi.ai --output json | jq '.categories.performance.score'
```

**Fixes:**

1. **Large images**
   ```bash
   # Compress images
   find . -name "*.png" -size +100k -exec npx sharp-cli {} -o {} \;
   ```

2. **No caching headers**
   ```json
   // vercel.json
   {
     "headers": [
       {
         "source": "/(.*)\\.(js|css|png|jpg|svg)",
         "headers": [
           { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
         ]
       }
     ]
   }
   ```

3. **Large JavaScript bundle**
   ```bash
   # Analyze bundle
   npx source-map-explorer dist/*.js
   
   # Consider code splitting
   ```

### API Timeouts

**Symptoms:** 504 Gateway Timeout

**Fixes:**

1. **Optimize slow operations**
   ```typescript
   // Move heavy work to background
   // Return quickly, process async
   ```

2. **Upgrade Vercel plan**
   - Hobby: 10s timeout
   - Pro: 60s timeout
   - Enterprise: 900s

3. **Use streaming**
   ```typescript
   // Stream large responses
   res.write('chunk1');
   res.write('chunk2');
   res.end();
   ```

---

## Emergency Procedures

### Site Is Completely Down

1. **Check Vercel status:** https://vercel-status.com
2. **Check DNS:** `dig proofi.ai`
3. **Roll back:**
   ```bash
   vercel ls
   vercel promote <previous-good-deployment>
   ```

### Data Breach Suspected

1. **Rotate all secrets immediately**
   ```bash
   vercel env rm DDC_PRIVATE_KEY
   vercel env add DDC_PRIVATE_KEY
   ```

2. **Check access logs**
   - Vercel Dashboard → Analytics → Logs

3. **Notify affected users**

### Cannot Access Vercel

1. **Use GitHub to deploy**
   - Push to main triggers auto-deploy

2. **Use Vercel CLI from different machine**
   ```bash
   vercel login
   vercel --prod
   ```

3. **Contact Vercel support**
   - Enterprise: Direct support
   - Hobby/Pro: support@vercel.com

---

## Support Contacts

| Issue Type | Contact |
|------------|---------|
| Vercel issues | support@vercel.com |
| Cere DDC issues | https://cere.network/support |
| Project issues | Create GitHub issue |

---

*Last updated: 2025-02-08*
