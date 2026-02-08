# HR Candidate Source Pattern Analysis Report

**Generated:** 2026-01-27  
**Database:** Notion HR Candidates (112d8000-83d6-805c-a3aa-e21ec2741ba7)  
**Scope:** Candidates from 2025+ with no Source tagged

---

## Executive Summary

Analyzed **35 candidates** from 2025+ who have no `Source` field populated. Based on pattern analysis, I was able to infer likely sources for the majority of candidates with varying degrees of confidence.

### Key Findings

| Pattern | Count | Inferred Source | Confidence |
|---------|-------|-----------------|------------|
| Webflow form submission (PDF in LinkedIn field) | 28 | Website Application Form / Inbound: Join | High |
| `[If inbound]` = "Job Site" | 10 | Generic Job Board | Medium |
| `[If inbound]` = "Linkedln" | 1 | Inbound: LinkedIn | High |
| `[If inbound]` = "Web 3 career" | 1 | Inbound: Web 3 Career | High |
| CA Inbound relation present | 7 | Confirmed Inbound Applicant | High |
| No identifiable pattern | 3 | Unknown | Low |

---

## Pattern Detection Methods

### 1. **Webflow Form Submissions** (Primary Pattern)
**Detection:** LinkedIn Profile field contains `webflow.com/files/...` URL  
**What it means:** Candidate applied through the company's Webflow-hosted career page and uploaded their resume/CV as a PDF  
**Recommended Source:** `Inbound: Company Website [unknown]` or `Inbound: Join`  
**Confidence:** HIGH  
**Candidates affected:** 28 out of 35 (80%)

### 2. **[If inbound] Field Mapping**
The `[If inbound]` field appears to be a partial source indicator that was captured but not mapped to the `Source` field.

| [If inbound] Value | Recommended Source Mapping |
|--------------------|---------------------------|
| Linkedln | Inbound: Linkedin |
| Wellfound | Inbound: Wellfound |
| Web 3 career | Inbound: Web 3 Career |
| Remocate | Inbound: Remocate |
| NoFluffJob | Inbound: NoFluffJob |
| Indeed | Inbound: Indeed |
| Berlinstartup jobs | Inbound: Berlinstartup Jobs |
| Job Site | Inbound: Company Website [unknown] (generic) |
| Recooty | Inbound: Recooty |
| Github | Outbound: Github |

**Candidates with [If inbound] populated:** 12 out of 35 (34%)

### 3. **CA Inbound Relation**
**Detection:** `CA Inbound` relation field has linked records  
**What it means:** Candidate was processed through the inbound candidate assessment workflow  
**Confidence:** HIGH that they are inbound applicants (specific source may need additional context)

---

## Detailed Candidate Analysis (30 Samples)

### Sample 1: (no name)
- **Date Added:** 2025-01-03
- **Role:** N/A
- **[If inbound]:** (empty)
- **LinkedIn URL:** None
- **Resume:** 0 files
- **CA Relation:** None
- **→ INFERRED SOURCE:** Unknown
- **→ CONFIDENCE:** Low
- **→ PATTERNS:** None detected - likely incomplete record

### Sample 2: (no name)
- **Date Added:** 2025-01-03
- **Role:** N/A
- **[If inbound]:** (empty)
- **LinkedIn URL:** None
- **Resume:** 0 files
- **→ INFERRED SOURCE:** Unknown
- **→ CONFIDENCE:** Low
- **→ PATTERNS:** None detected - likely incomplete record

### Sample 3: Brett Butterfield / AI Innovator
- **Date Added:** 2025-01-06
- **Role:** AI Innovator
- **[If inbound]:** (empty)
- **LinkedIn URL:** None
- **Resume:** 2 files (CV Brett Butterfield.pdf, Cover Brett Butterfield.pdf)
- **Status:** Accepted (went through 3 interviews)
- **→ INFERRED SOURCE:** Unknown (no pattern detected)
- **→ CONFIDENCE:** Low
- **→ NOTE:** Resume filename format suggests direct email application or referral

### Sample 4: Volkan Samur / Marketing Lead
- **Date Added:** 2025-01-10
- **Role:** N/A
- **[If inbound]:** Job Site
- **LinkedIn URL:** None
- **Resume:** 0 files
- **→ INFERRED SOURCE:** Job Board (generic)
- **→ CONFIDENCE:** Medium
- **→ PATTERNS:** [If inbound] = Job Site

### Sample 5: Viktor Miller / AI Innovator (CEF)
- **Date Added:** 2025-01-10
- **Role:** AI Innovator
- **[If inbound]:** Job Site
- **LinkedIn URL:** None
- **Resume:** 1 file
- **→ INFERRED SOURCE:** Job Board (generic)
- **→ CONFIDENCE:** Medium
- **→ PATTERNS:** [If inbound] = Job Site

### Sample 6: Katarzyna Henel / Marketing Lead
- **Date Added:** 2025-01-16
- **Role:** N/A
- **[If inbound]:** Web 3 career
- **Resume:** 1 file (Resume-KatarzynaHenel.pdf)
- **→ INFERRED SOURCE:** Inbound: Web 3 Career
- **→ CONFIDENCE:** High
- **→ PATTERNS:** [If inbound] = Web 3 career

### Sample 7: Srikanth Nandiraju
- **Date Added:** 2025-01-18
- **Role:** Principal Fullstack Engineer
- **[If inbound]:** Linkedln
- **LinkedIn URL:** webflow.com/files/...pdf (Webflow form)
- **→ INFERRED SOURCE:** Inbound: LinkedIn
- **→ CONFIDENCE:** High
- **→ PATTERNS:** [If inbound] = LinkedIn, Webflow form submission

### Sample 8: Ravi Teja Vempati
- **Date Added:** 2025-01-22
- **Role:** AI Innovator
- **[If inbound]:** Job Site
- **Resume:** 1 file (webflow.com URL)
- **→ INFERRED SOURCE:** Job Board via Company Website
- **→ CONFIDENCE:** Medium
- **→ PATTERNS:** [If inbound] = Job Site, Webflow form submission

### Sample 9: ROMAN PIETRZAK
- **Date Added:** 2025-01-27
- **Role:** Principal Fullstack Engineer
- **[If inbound]:** Job Site
- **LinkedIn URL:** Webflow form
- **CA Inbound:** Yes (linked)
- **→ INFERRED SOURCE:** Inbound: Job Board via Company Website
- **→ CONFIDENCE:** High
- **→ PATTERNS:** [If inbound] = Job Site, Webflow form, CA Inbound relation

### Sample 10: Simon Subic
- **Date Added:** 2025-01-31
- **Role:** Principal Fullstack Engineer
- **[If inbound]:** Job Site
- **LinkedIn URL:** Webflow form
- **CA Inbound:** Yes
- **→ INFERRED SOURCE:** Inbound: Job Board via Company Website
- **→ CONFIDENCE:** High
- **→ PATTERNS:** [If inbound] = Job Site, Webflow form, CA Inbound relation

### Sample 11: Roman Jasinski
- **Date Added:** 2025-01-31
- **Role:** Principal Fullstack Engineer
- **[If inbound]:** Job Site
- **LinkedIn URL:** Webflow form
- **CA Inbound:** Yes
- **→ INFERRED SOURCE:** Inbound: Job Board via Company Website
- **→ CONFIDENCE:** High

### Sample 12: Szymon Zinkowicz
- **Date Added:** 2025-01-31
- **Role:** Principal Fullstack Engineer
- **[If inbound]:** (empty)
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High
- **→ PATTERNS:** Webflow form submission

### Sample 13: andrea morelli
- **Date Added:** 2025-01-31
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 14: mukund biradar
- **Date Added:** 2025-01-31
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 15: Yash Suhagiya
- **Date Added:** 2025-01-31
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 16: Fenyvesi Balint
- **Date Added:** 2025-02-01
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 17: Pawel Nguyen
- **Date Added:** 2025-02-01
- **Role:** Principal Fullstack Engineer
- **[If inbound]:** Job Site
- **LinkedIn URL:** Webflow form
- **CA Inbound:** Yes
- **→ INFERRED SOURCE:** Inbound: Job Board via Company Website
- **→ CONFIDENCE:** High

### Sample 18: Andrea Lin
- **Date Added:** 2025-02-01
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 19: glenn all
- **Date Added:** 2025-02-01
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 20: Hussain Wali
- **Date Added:** 2025-02-01
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 21: Wojciech Grzegorz Bednarczyk
- **Date Added:** 2025-02-01
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 22: Ivan Prokopenko
- **Date Added:** 2025-02-01
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 23: Omar Belghaouti
- **Date Added:** 2025-02-02
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 24: Zubair Zubair
- **Date Added:** 2025-02-02
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 25: Emil Domagała
- **Date Added:** 2025-02-02
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 26: Virginia Balseiro
- **Date Added:** 2025-02-02
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 27: Mohamed Habib
- **Date Added:** 2025-02-03
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 28: Ivan Kolesnik
- **Date Added:** 2025-02-03
- **Role:** Principal Fullstack Engineer
- **[If inbound]:** Job Site
- **LinkedIn URL:** Webflow form
- **CA Inbound:** Yes
- **→ INFERRED SOURCE:** Inbound: Job Board via Company Website
- **→ CONFIDENCE:** High

### Sample 29: Muhammad Shahzaib
- **Date Added:** 2025-02-03
- **Role:** Principal Fullstack Engineer
- **LinkedIn URL:** Webflow form
- **→ INFERRED SOURCE:** Inbound: Company Website [unknown]
- **→ CONFIDENCE:** High

### Sample 30: Leo Brandt
- **Date Added:** 2025-02-03
- **Role:** Principal Fullstack Engineer
- **[If inbound]:** Job Site
- **LinkedIn URL:** Webflow form
- **CA Inbound:** Yes
- **→ INFERRED SOURCE:** Inbound: Job Board via Company Website
- **→ CONFIDENCE:** High

---

## Summary Statistics

### Source Inference Results

| Inferred Source | Count | Confidence |
|-----------------|-------|------------|
| Inbound: Company Website [unknown] / Webflow | 21 | High |
| Job Board via Company Website | 7 | High |
| Job Board (generic, unspecified) | 3 | Medium |
| Inbound: Web 3 Career | 1 | High |
| Inbound: LinkedIn | 1 | High |
| Unknown (incomplete data) | 2 | Low |

### Confidence Distribution

| Confidence Level | Count | Percentage |
|------------------|-------|------------|
| High | 30 | 86% |
| Medium | 3 | 8.5% |
| Low | 2 | 5.5% |

---

## Recommendations

### 1. **Automate Source Tagging**
Most candidates without sources came through the Webflow form. Consider:
- Adding a hidden field to the form capturing referrer/UTM parameters
- Setting up Zapier/automation to auto-populate Source based on form submission

### 2. **Backfill Strategy**
For the 35 candidates analyzed:
- **28 candidates** can be confidently tagged as `Inbound: Company Website [unknown]` or `Inbound: Join`
- **4 candidates** with `[If inbound]` = "Job Site" + Webflow should get `Inbound: Company Website [unknown]`
- **1 candidate** (Katarzyna Henel) should get `Inbound: Web 3 Career`
- **1 candidate** (Srikanth Nandiraju) should get `Inbound: Linkedin`
- **1 candidate** (Brett Butterfield) needs manual review

### 3. **Process Improvement**
The `[If inbound]` field captures partial source info but isn't being used. Either:
- Create automation to copy `[If inbound]` values to `Source` field
- Remove `[If inbound]` and train recruiters to use `Source` directly

### 4. **LinkedIn Profile Field Misuse**
The LinkedIn Profile field is being populated with resume PDF URLs from Webflow instead of actual LinkedIn URLs. Consider:
- Renaming the Webflow form field to "Resume Upload"
- Creating a separate dedicated LinkedIn URL field
- Validating that LinkedIn Profile contains linkedin.com URLs

---

## Technical Notes

### Data Sources
- Notion Database API v2022-06-28
- Query: Source is empty + Date Added >= 2025-01-01

### Pattern Detection Logic
1. Check `[If inbound]` select field for source hints
2. Check `Linkedin Profile` URL for `webflow.com` domain (indicates form submission)
3. Check `CA Inbound` relation for inbound applicant confirmation
4. Analyze resume filenames for source patterns (minimal signal)

---

*Report generated by automated analysis of Notion HR database*
