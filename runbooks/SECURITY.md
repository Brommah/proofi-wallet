# Proofi Security Practices

> Security guidelines for key management, encryption, auditing, and vulnerability handling.

---

## 🔐 Key Management

### User Keys (Self-Custodial)

**Principle:** Proofi NEVER has access to user private keys.

```
┌─────────────────────────────────────────────────────────────┐
│                    KEY ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   User Device (Extension)                                    │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Seed Phrase → Private Key → Public Key              │  │
│   │       ↓              ↓             ↓                 │  │
│   │  User backup   Encrypted     Shared with            │  │
│   │  (12 words)    locally       servers                │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   Server (API)                                               │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Only sees: Public Key + Encrypted Data Blobs        │  │
│   │  Cannot: Decrypt data or sign transactions           │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Generation

```javascript
// Using @polkadot/keyring for Cere-compatible keys
import { Keyring } from '@polkadot/keyring';
import { mnemonicGenerate } from '@polkadot/util-crypto';

// Generate new wallet
const mnemonic = mnemonicGenerate(12);
const keyring = new Keyring({ type: 'sr25519' });
const pair = keyring.addFromMnemonic(mnemonic);

// Store ONLY in extension local storage
// NEVER transmit mnemonic or private key
```

### Key Storage (Extension)

```javascript
// Keys stored in chrome.storage.local (encrypted by Chrome)
// Additional layer: encrypt with user-provided password

const encryptedKey = await encrypt(privateKey, userPassword);
await chrome.storage.local.set({ 
  wallet: {
    publicKey: pair.address,
    encryptedPrivateKey: encryptedKey
  }
});
```

### Platform Keys (Backend)

| Key Type | Storage | Access | Rotation |
|----------|---------|--------|----------|
| JWT Secret | Railway env var | API only | Every 90 days |
| Encryption Key | Railway env var | API only | On breach |
| DDC Credentials | Railway env var | API only | Yearly |
| Database Creds | Railway managed | Automatic | On breach |

**Rotation Procedure:**
1. Generate new key
2. Update in Railway env vars
3. Redeploy service
4. Verify functionality
5. Revoke old key (if applicable)

---

## 🔒 Encryption Standards

### Data at Rest

| Data Type | Encryption | Key |
|-----------|------------|-----|
| User credentials (DDC) | AES-256-GCM | User's derived key |
| Database PII | AES-256 | Platform key |
| Session tokens | JWT (HS256) | JWT secret |
| Extension storage | Chrome built-in | OS-level |

### Data in Transit

- **All connections:** TLS 1.3 minimum
- **API calls:** HTTPS only (HSTS enabled)
- **DDC uploads:** End-to-end encrypted before upload

### Encryption Implementation

```javascript
// Client-side encryption before DDC upload
import { encrypt } from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

async function encryptForStorage(data, userPublicKey) {
  // Generate ephemeral key pair
  const ephemeral = nacl.box.keyPair();
  
  // Encrypt data
  const nonce = nacl.randomBytes(24);
  const encrypted = nacl.box(
    Buffer.from(JSON.stringify(data)),
    nonce,
    userPublicKey,
    ephemeral.secretKey
  );
  
  return {
    nonce: encodeBase64(nonce),
    ephemeralPublic: encodeBase64(ephemeral.publicKey),
    ciphertext: encodeBase64(encrypted)
  };
}
```

### Password Requirements

For user passwords (if implemented):
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers
- No common passwords (check against list)
- Bcrypt with cost factor 12+

---

## ✅ Security Audit Checklist

### Weekly Checks

- [ ] Review access logs for anomalies
- [ ] Check for new Sentry errors (security-related)
- [ ] Verify SSL certificates valid
- [ ] Review failed login attempts

### Monthly Checks

- [ ] Dependency vulnerability scan (`pnpm audit`)
- [ ] Review and rotate API keys if needed
- [ ] Check for unused permissions/access
- [ ] Backup verification (can we restore?)

### Quarterly Checks

- [ ] Full security review meeting
- [ ] Penetration test (external or internal)
- [ ] Review and update this document
- [ ] Employee access audit

### Pre-Release Checks

- [ ] No secrets in code (`git secrets --scan`)
- [ ] Dependency audit passed
- [ ] OWASP Top 10 review
- [ ] Input validation on all endpoints
- [ ] Rate limiting in place

### Audit Commands

```bash
# Check for secrets in git history
git secrets --scan-history

# Check npm dependencies
pnpm audit

# Check for outdated packages
pnpm outdated

# Static analysis (if eslint-plugin-security installed)
pnpm lint
```

---

## 🐛 Vulnerability Reporting

### For External Reporters

**Security Contact:** security@proofi.ai

Please include:
1. Description of vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

**Response Timeline:**
- Acknowledgment: 24 hours
- Initial assessment: 48 hours
- Resolution timeline: 7-30 days (severity dependent)

### Bug Bounty Program

| Severity | Reward | Examples |
|----------|--------|----------|
| Critical | $1,000 - $5,000 | Private key exposure, RCE |
| High | $500 - $1,000 | Auth bypass, data leak |
| Medium | $100 - $500 | XSS, CSRF, info disclosure |
| Low | $50 - $100 | Minor info leak, best practices |

**Scope:**
- proofi.ai and subdomains
- Chrome extension
- API endpoints
- Smart contracts (when deployed)

**Out of Scope:**
- Social engineering
- Physical attacks
- Third-party services

### Internal Vulnerability Process

```
┌─────────────────────────────────────────────────────────────┐
│              VULNERABILITY RESPONSE FLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   1. REPORT                                                  │
│      ↓                                                       │
│   2. TRIAGE (1 hour)                                         │
│      → Assign severity (P0-P3)                               │
│      → Assign owner                                          │
│      ↓                                                       │
│   3. CONTAINMENT (if P0/P1)                                 │
│      → Disable affected feature                              │
│      → Rotate compromised credentials                        │
│      ↓                                                       │
│   4. FIX                                                     │
│      → Develop patch                                         │
│      → Security review of patch                              │
│      → Test in staging                                       │
│      ↓                                                       │
│   5. DEPLOY                                                  │
│      → Deploy to production                                  │
│      → Verify fix                                            │
│      ↓                                                       │
│   6. DISCLOSURE                                              │
│      → Notify affected users (if needed)                     │
│      → Public disclosure (90 days or after fix)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Security Best Practices

### For Developers

1. **Never commit secrets**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   *.pem
   *.key
   ```

2. **Validate all input**
   ```javascript
   // Use zod or similar
   const schema = z.object({
     address: z.string().regex(/^[a-zA-Z0-9]{48}$/),
     data: z.string().max(10000)
   });
   ```

3. **Sanitize all output**
   ```javascript
   // Escape HTML in user content
   const safe = DOMPurify.sanitize(userInput);
   ```

4. **Use parameterized queries**
   ```javascript
   // Never concatenate SQL
   await db.query('SELECT * FROM users WHERE id = $1', [userId]);
   ```

5. **Implement rate limiting**
   ```javascript
   // Per endpoint, per IP
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
   });
   ```

### For Users (Document for Support)

1. **Backup seed phrase offline**
   - Write on paper, store securely
   - Never take a screenshot
   - Never store in cloud

2. **Verify website URL**
   - Always check for https://proofi.ai
   - Bookmark the site

3. **Extension verification**
   - Only install from Chrome Web Store
   - Check publisher is "Proofi"

---

## 🚨 Security Incident Response

### If Keys Compromised

1. **Immediately:**
   - Rotate all affected keys
   - Revoke active sessions
   - Enable maintenance mode if needed

2. **Within 1 hour:**
   - Assess scope of compromise
   - Identify affected users
   - Begin forensic investigation

3. **Within 24 hours:**
   - Notify affected users
   - Prepare public statement
   - Engage security firm if needed

### If Data Breach Suspected

1. **Contain:**
   - Isolate affected systems
   - Preserve logs for investigation

2. **Investigate:**
   - Determine what was accessed
   - How did attacker get in?
   - What's the blast radius?

3. **Notify:**
   - Users (if PII affected)
   - Regulators (if required by GDPR, etc.)
   - Law enforcement (if criminal activity)

4. **Remediate:**
   - Fix the vulnerability
   - Strengthen defenses
   - Document lessons learned

---

## 📋 Compliance Notes

### GDPR Considerations

- Users can export their data
- Users can delete their data (off-chain data)
- Clear privacy policy
- Data minimization (only collect needed data)

### Future: SOC 2 Preparation

For enterprise customers, consider:
- Formal security policies
- Access control documentation
- Incident response procedures
- Regular security training

---

*Last Updated: February 2025*
*Review: Quarterly or after any security incident*
