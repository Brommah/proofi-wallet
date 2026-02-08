# Proofi Chrome Extension Update Runbook

> How to version, build, and publish Proofi Wallet extension updates.

---

## 📋 Prerequisites

### Required Access
- [ ] Chrome Web Store Developer account
- [ ] Developer Dashboard access: [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
- [ ] Extension signing key (keep secure!)
- [ ] GitHub repo write access

### Local Setup
- [ ] Node.js v18+
- [ ] pnpm installed
- [ ] Chrome browser for testing

---

## 🔢 Version Bump Process

### Semantic Versioning

```
MAJOR.MINOR.PATCH
  │     │     └── Bug fixes, small tweaks
  │     └──────── New features, non-breaking
  └────────────── Breaking changes, major updates
```

### When to Bump

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fix | PATCH | 1.0.0 → 1.0.1 |
| New feature | MINOR | 1.0.1 → 1.1.0 |
| Breaking change | MAJOR | 1.1.0 → 2.0.0 |
| Security fix | PATCH + flag | 1.0.0 → 1.0.1 |

### Bump Steps

1. **Update manifest.json:**
   ```bash
   cd extension/
   # Edit manifest.json
   ```
   
   ```json
   {
     "version": "1.1.0",
     "version_name": "1.1.0 (February 2025)"
   }
   ```

2. **Update CHANGELOG.md:**
   ```markdown
   ## [1.1.0] - 2025-02-08
   
   ### Added
   - New feature X
   
   ### Fixed
   - Bug in Y
   
   ### Changed
   - Improved Z
   ```

3. **Commit version bump:**
   ```bash
   git add manifest.json CHANGELOG.md
   git commit -m "chore: bump extension version to 1.1.0"
   git tag -a v1.1.0 -m "Extension v1.1.0"
   git push origin main --tags
   ```

---

## 🔨 Build & Package

### Build Steps

```bash
cd extension/

# Install dependencies (if any)
pnpm install

# Build for production
pnpm build

# Or if no build step, just package
zip -r ../proofi-extension-v1.1.0.zip . \
  -x "*.git*" \
  -x "node_modules/*" \
  -x "*.md" \
  -x "package*.json" \
  -x "tsconfig.json"
```

### Package Contents Checklist

Verify the zip contains:
- [ ] `manifest.json` (correct version)
- [ ] `popup.html` + `popup.js`
- [ ] `background.js`
- [ ] `content.js` + `content-styles.css`
- [ ] `inject.js`
- [ ] `icons/` folder (16, 32, 48, 128px)
- [ ] No `node_modules` or dev files

### Local Testing

1. **Load unpacked:**
   - Chrome → `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `extension/` folder

2. **Test checklist:**
   - [ ] Extension icon appears
   - [ ] Popup opens correctly
   - [ ] Wallet creation works
   - [ ] Connection to proofi.ai works
   - [ ] Data signing works
   - [ ] No console errors

3. **Test on fresh profile:**
   - Create new Chrome profile
   - Install extension
   - Complete full user flow

---

## 🏪 Chrome Web Store Submission

### Prepare Submission

1. **Screenshots** (at least 1, up to 5):
   - 1280x800 or 640x400 pixels
   - Show key features
   - Store in `extension/store-assets/`

2. **Promotional images:**
   - Small: 440x280 px
   - Large: 920x680 px (optional)
   - Marquee: 1400x560 px (optional)

3. **Description** (update if needed):
   ```
   Proofi Wallet - Your Data, Your Keys, Your Proof
   
   Self-custodial data wallet for the decentralized web.
   Store your personal data on-chain with one click.
   
   Features:
   • Create secure wallet with seed phrase backup
   • Encrypt and store data on Cere Network
   • Share data selectively with AI agents
   • Earn CERE tokens from your data
   
   Your data never leaves your control.
   ```

### Submit Update

1. **Go to Developer Dashboard:**
   ```
   https://chrome.google.com/webstore/devconsole
   ```

2. **Select Proofi Wallet extension**

3. **Click "Package" tab:**
   - Upload new zip file
   - Wait for upload to complete

4. **Update Store Listing (if needed):**
   - Description
   - Screenshots
   - What's new

5. **Submit for Review:**
   - Click "Submit for Review"
   - Review typically takes 1-3 business days

### Review Guidelines Compliance

Ensure extension follows:
- [Chrome Web Store Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- No remote code execution
- Minimal permissions requested
- Clear privacy policy
- Accurate description

---

## ⚠️ Handling Review Rejection

### Common Rejection Reasons

1. **Permissions too broad**
   - Solution: Request only necessary permissions
   - Use optional permissions where possible

2. **Missing privacy policy**
   - Solution: Add privacy policy URL in manifest
   - Host at proofi.ai/privacy

3. **Unclear functionality**
   - Solution: Better description and screenshots
   - Explain why each permission is needed

4. **Remote code execution**
   - Solution: Bundle all code in extension
   - Don't fetch and execute external scripts

### Appeal Process

1. Read rejection reason carefully
2. Fix the issue
3. Resubmit with explanation
4. If unclear, contact developer support

---

## 📢 User Update Notifications

### Automatic Updates

Chrome auto-updates extensions. No user action needed.

### In-App Changelog

Show changelog popup for significant updates:

```javascript
// In popup.js
const CURRENT_VERSION = chrome.runtime.getManifest().version;
const LAST_SEEN_VERSION = await chrome.storage.local.get('lastSeenVersion');

if (LAST_SEEN_VERSION !== CURRENT_VERSION) {
  showChangelogModal();
  await chrome.storage.local.set({ lastSeenVersion: CURRENT_VERSION });
}
```

### Announcement Channels

For major updates, announce on:
- [ ] Twitter/X: @proofi_ai
- [ ] Discord: #announcements
- [ ] Email: Subscribed users
- [ ] Blog: proofi.ai/blog

### Announcement Template

```
🆕 Proofi Wallet v1.1.0 Released!

What's new:
• [Feature 1]
• [Feature 2]
• [Bug fix]

Update automatically or reinstall from Chrome Web Store:
[link]

#Proofi #CereNetwork #Web3
```

---

## 🔄 Rollback Procedure

If critical bug found after release:

1. **Prepare hotfix:**
   - Fix the bug
   - Bump patch version (e.g., 1.1.0 → 1.1.1)
   - Test thoroughly

2. **Fast-track submission:**
   - Submit to Chrome Web Store
   - Note in review: "Critical bug fix, please expedite"

3. **Communicate:**
   - Acknowledge issue on social
   - Provide workaround if possible
   - Update when fix is live

**⚠️ Note:** Chrome Web Store doesn't support instant rollback. 
You must submit a new version with the fix.

---

## 📋 Release Checklist

Use this for every release:

```markdown
## Extension Release v{X.X.X}

### Pre-Release
- [ ] All changes tested locally
- [ ] Version bumped in manifest.json
- [ ] CHANGELOG.md updated
- [ ] No console errors
- [ ] Tested on fresh profile

### Build
- [ ] Created production build
- [ ] Zip file created
- [ ] Verified zip contents

### Submit
- [ ] Uploaded to Chrome Web Store
- [ ] Store listing updated (if needed)
- [ ] Submitted for review

### Post-Release
- [ ] Monitor for review completion
- [ ] Verify update works after approval
- [ ] Post announcement (major releases)
- [ ] Tag release in GitHub
```

---

## 📞 Support Contacts

| Issue | Contact |
|-------|---------|
| Chrome Web Store | [Developer Support](https://support.google.com/chrome_webstore/contact/developer_support) |
| Review issues | [One-time review request](https://support.google.com/chrome_webstore/contact/one_time_review) |
| Policy questions | [Policy clarification](https://support.google.com/chrome_webstore/contact/policy_clarification) |

---

*Last Updated: February 2025*
