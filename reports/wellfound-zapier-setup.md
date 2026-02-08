# Wellfound → Cere HR Pipeline: Zapier Setup Guide

## Overview

Since Wellfound has no public API, we use a single **Zapier zap** to bridge Wellfound applicants into our HR pipeline. The flow:

```
Wellfound (new applicant) → Zapier → POST webhook → Notion + AI scoring
```

The webhook endpoint lives in the `cere-hr-service` Railway deployment.

---

## Architecture

```
┌──────────────┐     ┌─────────┐     ┌─────────────────────────────────┐
│  Wellfound   │────▶│  Zapier  │────▶│  cere-hr-service (Railway)      │
│  New Applicant│     │   Zap    │     │  POST /api/webhook/wellfound    │
└──────────────┘     └─────────┘     └──────────┬──────────────────────┘
                                                  │
                                     ┌────────────┼────────────┐
                                     ▼            ▼            ▼
                                  Notion     AI Scoring    Slack Alert
                                (candidate)  (GPT-4)     (notification)
```

---

## Step 1: Create the Zapier Zap

### Trigger: Wellfound → New Applicant

1. Go to [zapier.com](https://zapier.com) and create a new Zap
2. **Trigger app:** Search for "Wellfound" (formerly AngelList Talent)
3. **Trigger event:** "New Applicant" or "New Application"
4. Connect your Wellfound account (you'll need admin access to your Wellfound company page)
5. Test the trigger — Zapier will pull a sample applicant

### Action: Webhooks by Zapier → POST

1. **Action app:** "Webhooks by Zapier"
2. **Action event:** "POST"
3. Configure the webhook:

| Field | Value |
|-------|-------|
| **URL** | `https://your-railway-url.up.railway.app/api/webhook/wellfound` |
| **Payload Type** | `json` |
| **Data** | *(see mapping below)* |
| **Headers** | `x-webhook-secret: YOUR_SECRET` *(optional, see Security)* |

### Field Mapping (Zapier → Webhook)

Map these fields in the Zapier "Data" section:

| Zapier Key (left) | Zapier Value (right - pick from trigger) |
|---|---|
| `source` | `wellfound` *(type literally)* |
| `candidate__firstName` | *Applicant First Name* |
| `candidate__lastName` | *Applicant Last Name* |
| `candidate__email` | *Applicant Email* |
| `candidate__linkedinUrl` | *Applicant LinkedIn URL* |
| `candidate__resumeUrl` | *Applicant Resume URL* |
| `candidate__location` | *Applicant Location* |
| `job__title` | *Job Title* |
| `job__id` | *Job ID* |

> **Note:** Use `__` (double underscore) for nested keys. Zapier will send them as nested JSON objects.

The resulting JSON payload looks like:

```json
{
  "source": "wellfound",
  "candidate": {
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "linkedinUrl": "https://linkedin.com/in/janedoe",
    "resumeUrl": "https://wellfound.com/resumes/...",
    "location": "Berlin, Germany"
  },
  "job": {
    "title": "AI Engineer",
    "id": "12345"
  }
}
```

### Alternative: Flat Payload

If Zapier sends flat key-value pairs (no nesting), the webhook also handles:

```json
{
  "source": "wellfound",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "linkedinUrl": "https://linkedin.com/in/janedoe",
  "resumeUrl": "https://wellfound.com/resumes/...",
  "location": "Berlin, Germany",
  "jobTitle": "AI Engineer",
  "jobId": "12345"
}
```

---

## Step 2: Security (Optional but Recommended)

Set a shared secret to verify Zapier requests:

1. **Railway env var:** Add `WELLFOUND_WEBHOOK_SECRET=your-random-secret-here`
2. **Zapier headers:** Add header `x-webhook-secret` with the same value

If the secret is not set, the webhook accepts all POST requests (fine for testing).

---

## Step 3: Test the Zap

1. In Zapier, click "Test & Review" on the webhook action
2. Check the response:
   - `ok: true` → Success. Candidate created in Notion with AI scoring.
   - `ok: true, skipped: true` → Duplicate detected. Candidate already exists.
   - `ok: false` → Error. Check the `logs` array in the response.
3. Verify in Notion that the candidate appears with:
   - Source: **Inbound: Wellfound**
   - Role mapped correctly
   - AI Score populated (may take a few seconds)

---

## Step 4: Turn On the Zap

Once tested, turn the Zap on. Every new Wellfound applicant will automatically:

1. ✅ Get de-duplicated by name
2. ✅ Get created in the Notion HR database
3. ✅ Get AI-scored by GPT-4 (role-specific prompts)
4. ✅ Trigger a Slack notification
5. ✅ Appear in the HR dashboard

---

## Endpoints Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/webhook/wellfound` | Main intake webhook (called by Zapier) |
| `GET` | `/api/webhook/wellfound/status` | Health check for the webhook |

---

## Troubleshooting

### "Unauthorized" (401)
- Check that `WELLFOUND_WEBHOOK_SECRET` matches between Railway and Zapier
- Try both `x-webhook-secret` header and `Authorization: Bearer ...`

### "Missing candidate name" (400)
- Verify the Zapier field mapping — firstName and lastName must be populated
- Check if Wellfound is providing the data in the trigger step

### Duplicate detected (skipped)
- This is expected behavior — the webhook checks by exact full name match
- If the candidate applied for a different role, you may want to manually review

### AI evaluation skipped
- The candidate was created but AI scoring couldn't run
- Common cause: no resume URL provided by Wellfound
- Check Notion — the candidate still exists, just without an AI score

### Notion property errors
- If you see "Email property" errors: the Notion database may not have an Email column
- The webhook auto-retries without the email field — check logs for `⚠️ Email property not in Notion schema`

---

## Monitoring

- **Wellfound status:** `GET /api/wellfound-status` (existing endpoint — checks Wellfound Autopilot cycle)
- **Webhook health:** `GET /api/webhook/wellfound/status`
- **Full pipeline:** `GET /api/full-report` (includes all sources)

---

## Cost

- **Zapier:** 1 Zap, 1 task per applicant. Free tier supports 100 tasks/month.
- **Railway:** Included in existing deployment (no additional cost).
- **OpenAI:** ~$0.03-0.10 per AI evaluation (GPT-4).
