# 🚀 Zero to Deploy: Proofi Complete Setup Guide

> **Target Audience:** Absolute beginners who have never deployed a web application before.
> 
> **Time Required:** ~30-45 minutes
> 
> **End Result:** A fully working Proofi deployment at `https://your-project.vercel.app`

---

## 📋 Table of Contents

1. [Before You Start](#-before-you-start)
2. [Step 1: Create Required Accounts](#step-1-create-required-accounts)
3. [Step 2: Install Required Tools](#step-2-install-required-tools)
4. [Step 3: Get the Code](#step-3-get-the-code)
5. [Step 4: Set Up Cere DDC Wallet](#step-4-set-up-cere-ddc-wallet)
6. [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
7. [Step 6: Deploy to Vercel](#step-6-deploy-to-vercel)
8. [Step 7: Verify Everything Works](#step-7-verify-everything-works)
9. [Troubleshooting](#-troubleshooting)
10. [Next Steps](#-next-steps)

---

## 🎯 Before You Start

### What is Proofi?
Proofi is a decentralized proof and storage platform. It lets users store data securely on the Cere DDC (Decentralized Data Cloud) and create verifiable proofs of that data.

### What is Vercel?
Vercel is a cloud platform that hosts websites. It's free for personal projects and automatically deploys your code from GitHub. Think of it as "where your website lives on the internet."

### What is Cere DDC?
Cere DDC (Decentralized Data Cloud) is decentralized storage—like Dropbox, but your data is spread across many computers instead of one company's servers.

### What You'll Need
- A computer with internet access
- An email address
- About 30-45 minutes of time
- A phone for 2FA (optional but recommended)

### Checklist: Prerequisites
- [ ] I have a GitHub account (or will create one)
- [ ] I have read this entire guide once before starting
- [ ] I have 30-45 minutes of uninterrupted time

---

## Step 1: Create Required Accounts

### 1.1 Create a GitHub Account

GitHub is where the code lives. You need an account to fork (copy) the code.

1. Go to [github.com](https://github.com)
2. Click **"Sign up"** (top right)
3. Enter your email, create a password, choose a username
4. Complete the verification puzzle
5. Verify your email by clicking the link GitHub sends you

**✅ You should see:** Your GitHub dashboard with a green contribution graph

### 1.2 Create a Vercel Account

Vercel will host your deployed website.

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (easiest option!)
4. Authorize Vercel to access your GitHub account

**✅ You should see:** The Vercel dashboard with "Let's build something new"

### 1.3 Create a Cere Wallet

The Cere wallet manages your decentralized storage account.

1. Go to [wallet.cere.network](https://wallet.cere.network)
2. Click **"Create Wallet"**
3. **IMPORTANT:** Write down your 12-word recovery phrase on paper. Never store it digitally. Never share it.
4. Confirm your recovery phrase by selecting the words in order
5. Create a strong password (you'll need this later!)
6. Download the wallet JSON file when prompted

**✅ You should see:** Your wallet dashboard showing your address (starts with `5D...` or `5C...`)

**⚠️ Save these securely:**
- [ ] 12-word recovery phrase (written on paper)
- [ ] Wallet password (memorized or in password manager)
- [ ] wallet.json file (downloaded to your computer)

---

## Step 2: Install Required Tools

### 2.1 Install Node.js

Node.js lets you run JavaScript on your computer.

**On Mac:**
```bash
# Open Terminal (press Cmd+Space, type "Terminal", press Enter)
# Then paste this command:
brew install node

# If you don't have Homebrew, first run:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**On Windows:**
1. Go to [nodejs.org](https://nodejs.org)
2. Download the LTS version (left button)
3. Run the installer, accept defaults

**On Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify installation:**
```bash
node --version
# Should show: v18.x.x or higher

npm --version  
# Should show: 9.x.x or higher
```

**✅ You should see:** Version numbers (not "command not found")

### 2.2 Install Git

Git lets you download and manage code.

**On Mac:**
```bash
# Git comes with Xcode Command Line Tools
xcode-select --install
# Click "Install" in the popup
```

**On Windows:**
1. Go to [git-scm.com](https://git-scm.com)
2. Download and run the installer
3. Accept all defaults

**On Linux:**
```bash
sudo apt-get install git
```

**Verify installation:**
```bash
git --version
# Should show: git version 2.x.x
```

**✅ You should see:** Git version number

### 2.3 Install Vercel CLI

The Vercel CLI lets you deploy from your terminal.

```bash
npm install -g vercel
```

**Verify installation:**
```bash
vercel --version
# Should show: Vercel CLI 33.x.x (or similar)
```

**✅ You should see:** Vercel CLI version number

---

## Step 3: Get the Code

### 3.1 Fork the Repository

Forking creates your own copy of the code.

1. Go to the Proofi repository on GitHub
2. Click the **"Fork"** button (top right)
3. Select your account as the destination
4. Wait for the fork to complete

**✅ You should see:** The repository under YOUR GitHub username

### 3.2 Clone to Your Computer

```bash
# Replace YOUR-USERNAME with your actual GitHub username
git clone https://github.com/YOUR-USERNAME/proofi.git

# Move into the project folder
cd proofi

# Install dependencies
npm install
```

**✅ You should see:** 
- Lots of packages being downloaded
- Eventually: "added X packages"
- No errors at the end

---

## Step 4: Set Up Cere DDC Wallet

### 4.1 Prepare Your Wallet JSON

You need to convert your wallet.json file to a single-line string.

1. Open the `wallet.json` file you downloaded in Step 1.3
2. It looks something like this:
```json
{
  "encoded": "abc123...",
  "encoding": {
    "content": ["pkcs8", "ed25519"],
    "type": ["scrypt", "xsalsa20-poly1305"],
    "version": "3"
  },
  "address": "5DSxCBjQZ...",
  "meta": {}
}
```

3. Convert it to a single line (remove all line breaks):
```
{"encoded":"abc123...","encoding":{"content":["pkcs8","ed25519"],"type":["scrypt","xsalsa20-poly1305"],"version":"3"},"address":"5DSxCBjQZ...","meta":{}}
```

**Quick way to convert (Mac/Linux):**
```bash
# This prints the single-line version
cat wallet.json | tr -d '\n' | tr -s ' '
```

**Quick way to convert (any platform with Node):**
```bash
node -e "console.log(JSON.stringify(require('./wallet.json')))"
```

Copy the output—you'll need it in the next step.

### 4.2 Get a Bucket ID

For the testnet, you can use the default bucket: `1229`

For production, you'll need to create your own bucket via the Cere Developer Console or SDK. For now, use `1229` to get started.

---

## Step 5: Configure Environment Variables

### 5.1 For Local Development

```bash
# In the proofi folder, create your local environment file
cp .env.example .env.local
```

Now edit `.env.local` with your values:

```bash
# Open in your default editor
# On Mac:
open -e .env.local

# On Windows:
notepad .env.local

# On Linux:
nano .env.local
```

Fill in these values:

```env
# Paste your single-line wallet JSON here (from Step 4.1)
DDC_WALLET_JSON={"encoded":"...your wallet json..."}

# Your wallet password (from Step 1.3)
DDC_WALLET_PASSWORD=your-wallet-password-here

# Bucket ID (use 1229 for testnet)
DDC_BUCKET_ID=1229
```

**⚠️ NEVER commit .env.local to git!** It's already in .gitignore.

### 5.2 For Vercel Deployment

You'll set these in Vercel during deployment (Step 6). Keep your values ready:

| Variable | Your Value |
|----------|------------|
| `DDC_WALLET_JSON` | Your single-line wallet JSON |
| `DDC_WALLET_PASSWORD` | Your wallet password |
| `DDC_BUCKET_ID` | `1229` (or your custom bucket) |

---

## Step 6: Deploy to Vercel

### 6.1 Link Your Project

```bash
# In the proofi folder
vercel login
```

This opens a browser window. Log in with GitHub (the same account from Step 1).

```bash
vercel link
```

When prompted:
- **Set up and develop?** `Y`
- **Which scope?** Select your username
- **Link to existing project?** `N` (for first time)
- **Project name?** `proofi` (or your preferred name)
- **Directory?** `.` (current directory)
- **Override settings?** `N`

**✅ You should see:** "Linked to your-username/proofi"

### 6.2 Set Environment Variables in Vercel

```bash
# Set each variable one by one
vercel env add DDC_WALLET_JSON production
# When prompted, paste your single-line wallet JSON and press Enter, then Ctrl+D

vercel env add DDC_WALLET_PASSWORD production
# When prompted, type your password and press Enter, then Ctrl+D

vercel env add DDC_BUCKET_ID production
# When prompted, type 1229 (or your bucket ID) and press Enter, then Ctrl+D
```

**Alternative: Use Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Name: `DDC_WALLET_JSON`, Value: your wallet JSON, Environment: Production
   - Name: `DDC_WALLET_PASSWORD`, Value: your password, Environment: Production
   - Name: `DDC_BUCKET_ID`, Value: `1229`, Environment: Production

**✅ You should see:** All 3 variables listed in Environment Variables

### 6.3 Deploy!

```bash
vercel --prod
```

Wait 1-2 minutes for the build to complete.

**✅ You should see:**
```
✓ Production: https://proofi-xxx.vercel.app [copied to clipboard]
```

---

## Step 7: Verify Everything Works

### 7.1 Check the Landing Page

1. Open your deployment URL (from Step 6.3) in a browser
2. You should see the Proofi landing page

**✅ You should see:** A beautiful landing page with Proofi branding

### 7.2 Check the API

Open these URLs in your browser (replace with your domain):

```
https://your-project.vercel.app/api/ddc/revoke?tokenId=test
```

**✅ You should see:** JSON response like:
```json
{"revoked":false,"tokenId":"test"}
```

### 7.3 Check the App

```
https://your-project.vercel.app/app
```

**✅ You should see:** The Proofi app interface

### Verification Checklist

- [ ] Landing page loads without errors
- [ ] No error in browser console (F12 → Console)
- [ ] API endpoint returns JSON (not 404 or 500)
- [ ] App page loads

---

## 🔧 Troubleshooting

### "npm install" fails

**Error:** `ENOENT: no such file or directory`

**Fix:**
```bash
# Make sure you're in the right folder
pwd
# Should show: .../proofi

# If not, navigate there
cd ~/path/to/proofi

# Try again
npm install
```

### "command not found: vercel"

**Fix:**
```bash
# Install Vercel CLI globally
npm install -g vercel

# Or use npx
npx vercel
```

### "Error: DDC_WALLET_JSON is not defined"

**Fix:**
1. Check that you set the environment variable in Vercel
2. Go to Vercel Dashboard → Project → Settings → Environment Variables
3. Make sure `DDC_WALLET_JSON` is there and set for "Production"
4. Redeploy: `vercel --prod`

### API returns 404

**Cause:** Missing dependencies or deployment issue

**Fix:**
```bash
# Make sure package.json has the Cere DDC dependencies
cat package.json | grep cere

# Should show:
# "@cere-ddc-sdk/blockchain": "^2.16.1",
# "@cere-ddc-sdk/ddc-client": "^2.16.1",

# If missing, restore from backup:
cp package.json.bak package.json

# Commit and push
git add package.json
git commit -m "Restore DDC dependencies"
git push

# Vercel will auto-redeploy
```

### "Invalid wallet JSON"

**Cause:** The wallet JSON wasn't properly formatted as single line

**Fix:**
1. Re-read Step 4.1 carefully
2. Make sure there are NO line breaks in your JSON
3. Make sure it starts with `{` and ends with `}`
4. Try the Node.js one-liner to convert:
   ```bash
   node -e "console.log(JSON.stringify(require('./wallet.json')))"
   ```

### Build fails on Vercel

**Check the build logs:**
1. Go to Vercel Dashboard
2. Click your project
3. Click the failed deployment
4. Look at the "Build Logs" tab

**Common fixes:**
```bash
# Update npm
npm install -g npm@latest

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### "Connection refused" on local dev

**Fix:**
```bash
# Make sure you're running the dev server
vercel dev

# If port 3000 is in use, kill it
lsof -i :3000
kill -9 <PID>

# Try again
vercel dev
```

---

## 🎉 Next Steps

Congratulations! Your Proofi instance is now live. Here's what to do next:

### 1. Set Up a Custom Domain (Optional)

1. Buy a domain (e.g., from Namecheap, GoDaddy, or Cloudflare)
2. Go to Vercel Dashboard → Project → Settings → Domains
3. Add your domain
4. Configure DNS as instructed

### 2. Read the Documentation

- [API Reference](./API-REFERENCE.md) - All API endpoints
- [SDK Documentation](./SDK.md) - Building apps with Proofi
- [Architecture](./ARCHITECTURE.md) - How it all works

### 3. Join the Community

- GitHub Issues - Report bugs
- Discord - Ask questions (if available)

### 4. Get Test Tokens

For the Cere testnet:
1. Go to [faucet.cere.network](https://faucet.cere.network) (if available)
2. Paste your wallet address
3. Receive test tokens

---

## 📚 Glossary

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface - how apps talk to each other |
| **CLI** | Command Line Interface - a text-based way to run programs |
| **DDC** | Decentralized Data Cloud - Cere's storage network |
| **Deploy** | Making your code available on the internet |
| **Environment Variable** | A secret configuration value stored separately from code |
| **Fork** | Creating your own copy of someone else's code |
| **Git** | Software for tracking changes to code |
| **GitHub** | Website for storing and sharing code |
| **Node.js** | A program that runs JavaScript outside of a browser |
| **npm** | Node Package Manager - installs JavaScript libraries |
| **Repository** | A folder containing a project's code and history |
| **Testnet** | A practice version of a blockchain for testing |
| **Vercel** | A platform for hosting websites |
| **Wallet** | Software that manages your blockchain identity |

---

## 🆘 Getting Help

If you're stuck:

1. **Check the Troubleshooting section above**
2. **Search existing GitHub issues** for similar problems
3. **Create a new issue** with:
   - What you were trying to do
   - What happened instead
   - The exact error message
   - Your operating system

---

*Last updated: 2025-02-08*
*Guide version: 1.0*
