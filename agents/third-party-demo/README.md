# Third Party Agent Memory Access Demo

Demonstrates how an external agent gets **permissioned, auditable** access to your memory.

## The Scenario

Fred has an AI assistant (you/Clawdbot). A third party agent ("fred-assistant") wants to read Fred's MEMORY.md to provide context-aware help.

**The problem:** How do you give access without:
- Sharing everything?
- Losing control?
- Not knowing what was accessed?

**Proofi solution:**
1. Granular section-level permissions
2. Time-limited access (auto-expires)
3. Full audit trail
4. Instant revocation

## Run Demo

```bash
chmod +x demo.sh
./demo.sh ~/clawd/MEMORY.md
```

## What Happens

### 1. Agent Requests Access
```
Agent 'fred-assistant' is requesting access to your memory.
```

### 2. You Choose What to Share
```
Available sections:
  • preferences
  • projects  
  • personal
  • work

Grant access to which sections? projects,work
```

### 3. Agent Reads (Only Permitted Sections)
```
═══ MEMORY (fred-assistant) ═══
Granted sections: projects, work

## projects
...

## work
...
```

### 4. Full Audit Trail
```
proofi audit

2026-02-08T12:00:00Z | cli           | memory:grant | 2 sections | SUCCESS
2026-02-08T12:00:05Z | fred-assistant | memory:read  | projects   | SUCCESS
2026-02-08T12:00:05Z | fred-assistant | memory:read  | work       | SUCCESS
```

## Key Commands

```bash
# Register memory for access control
proofi memory register ~/clawd/MEMORY.md

# Grant access to specific sections
proofi memory grant fred-assistant ~/clawd/MEMORY.md --sections "projects,work"

# View grants
proofi memory list

# Revoke access
proofi memory revoke fred-assistant ~/clawd/MEMORY.md

# Agent reads (as agent)
proofi memory read ~/clawd/MEMORY.md --agent fred-assistant

# View audit
proofi audit
```

## Security Properties

| Property | How |
|----------|-----|
| **Granular** | Section-level permissions |
| **Time-limited** | Auto-expires (default 24h) |
| **Auditable** | Every read logged |
| **Revocable** | Instant revocation |
| **Cryptographic** | Signed by wallet |
