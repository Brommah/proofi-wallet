# Claude Code Skills for Engineering Teams

> How to package, distribute, and maintain team expertise as Claude Code Skills

**Research date:** 2026-01-29
**Based on:** Anthropic's official Skills system, @dani_avila7's Claude Code Templates pattern, community best practices

---

## Table of Contents

1. [What Are Claude Code Skills?](#what-are-claude-code-skills)
2. [Skill Architecture](#skill-architecture)
3. [Distribution Methods](#distribution-methods)
4. [Packaging Engineering Knowledge](#packaging-engineering-knowledge)
5. [Best Practices](#best-practices)
6. [Cere/CEF Skill Templates](#cerecef-skill-templates)
7. [Setting Up a Team Marketplace](#setting-up-a-team-marketplace)

---

## What Are Claude Code Skills?

Skills are modular, self-contained packages of expertise that extend Claude Code's capabilities. They consist of a `SKILL.md` file (with YAML frontmatter) plus optional supporting files (templates, scripts, reference docs). Claude discovers and loads them **automatically** when relevant to the current task, or they can be invoked manually via `/skill-name`.

### Key Properties

- **Contextually triggered** — Claude reads skill descriptions and activates them based on semantic relevance, not keywords
- **Progressively loaded** — Only `SKILL.md` loads initially; supporting files load on-demand to save context
- **Composable** — Multiple skills can stack together on a single task
- **Portable** — Same format works across Claude Code, Claude.ai, and the API (follows the [Agent Skills](https://agentskills.io) open standard)

### Skill Types

| Type | Purpose | Example |
|------|---------|---------|
| **Reference** | Background knowledge applied to current work | Coding standards, API conventions, style guides |
| **Task** | Step-by-step instructions for specific actions | Deploy, commit, code review workflows |
| **Hybrid** | Knowledge + actionable steps | Architecture patterns with generation templates |

---

## Skill Architecture

### Minimal Skill

```
my-skill/
└── SKILL.md          # Required: instructions + frontmatter
```

### Full Skill

```
my-skill/
├── SKILL.md           # Required: main instructions
├── reference.md       # Detailed docs (loaded on-demand)
├── examples/
│   ├── good.ts        # Example of correct patterns
│   └── bad.ts         # Anti-patterns to avoid
├── templates/
│   └── component.md   # Templates Claude fills in
└── scripts/
    └── validate.sh    # Scripts Claude can execute
```

### SKILL.md Anatomy

```yaml
---
name: my-skill                    # Lowercase, hyphens only (max 64 chars)
description: What this skill does  # Claude uses this for matching
argument-hint: [filename]          # Shown in autocomplete
disable-model-invocation: false    # true = manual-only (/name)
user-invocable: true               # false = background knowledge only
allowed-tools: Read, Grep, Bash    # Tools allowed without permission
context: fork                      # Run in subagent (optional)
model: claude-sonnet-4-20250514          # Override model (optional)
---

# My Skill

Instructions for Claude go here...

## Additional Resources
- For API details, see [reference.md](reference.md)
- For examples, see [examples/](examples/)
```

### String Substitutions

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All arguments passed when invoking |
| `$ARGUMENTS[0]` or `$0` | First argument |
| `${CLAUDE_SESSION_ID}` | Current session ID |

---

## Distribution Methods

### 1. Project-Level (Version Control) — Simplest

Store skills in `.claude/skills/` in your repo. Anyone who clones gets them.

```
my-project/
├── .claude/
│   └── skills/
│       ├── coding-standards/
│       │   └── SKILL.md
│       └── deploy/
│           └── SKILL.md
├── src/
└── ...
```

**Pros:** Zero setup, version-controlled alongside code, PR-reviewable
**Cons:** Per-repo only, must duplicate across repos

### 2. Personal Skills (`~/.claude/skills/`)

Available across all your projects.

```
~/.claude/skills/
├── my-workflow/
│   └── SKILL.md
└── my-conventions/
    └── SKILL.md
```

### 3. Plugin Marketplace — Team Distribution ⭐

The **recommended approach for teams**. Create a private GitHub repo as a marketplace, package skills as plugins.

#### Plugin Structure

```
your-org/claude-skills/         # GitHub repo
├── .claude-plugin/
│   └── marketplace.json        # Plugin registry
├── plugins/
│   ├── engineering-standards/
│   │   ├── manifest.json
│   │   └── skills/
│   │       ├── coding-standards/
│   │       │   └── SKILL.md
│   │       ├── architecture-patterns/
│   │       │   └── SKILL.md
│   │       └── deploy-procedures/
│   │           └── SKILL.md
│   └── code-review/
│       ├── manifest.json
│       └── skills/
│           └── review-checklist/
│               └── SKILL.md
```

#### marketplace.json

```json
{
  "plugins": {
    "engineering-standards": {
      "name": "Engineering Standards",
      "description": "Coding standards, architecture patterns, and deployment procedures",
      "path": "plugins/engineering-standards"
    },
    "code-review": {
      "name": "Code Review",
      "description": "Standardized code review workflows",
      "path": "plugins/code-review"
    }
  }
}
```

#### Installation

```bash
# In Claude Code:
/plugin marketplace add your-org/claude-skills
/plugin install engineering-standards@your-org-skills
```

#### Auto-activate in repos via `.claude/settings.json`

```json
{
  "enabledPlugins": {
    "engineering-standards@your-org-skills": true,
    "code-review@your-org-skills": true
  },
  "extraKnownMarketplaces": {
    "your-org-skills": {
      "source": {
        "source": "github",
        "repo": "your-org/claude-skills"
      }
    }
  }
}
```

This is the **zero-friction approach**: developers clone a repo, and the skills are just there. No manual setup.

### 4. Enterprise-Level

For organizations on Claude Enterprise plans: deploy skills organization-wide via admin settings. All users get them automatically.

### Priority Order

When skills share the same name: **Enterprise > Personal > Project**
Plugin skills use namespacing (`plugin-name:skill-name`) so they never conflict.

---

## Packaging Engineering Knowledge

### What to Turn Into Skills

| Knowledge Type | Skill Pattern | Invocation |
|---------------|---------------|------------|
| **Coding standards** | Reference skill (auto-loaded) | Automatic when coding |
| **Architecture patterns** | Reference + templates | Automatic or `/arch-pattern` |
| **Code review checklists** | Task skill | `/review` |
| **Deployment procedures** | Task skill (manual-only) | `/deploy` |
| **Onboarding guides** | Reference skill | Automatic for new devs |
| **API conventions** | Reference skill | Automatic when writing APIs |
| **Testing patterns** | Reference + examples | Automatic when writing tests |
| **Incident response** | Task skill (manual-only) | `/incident` |

### Design Principles

1. **One skill = one concern.** Don't bundle coding standards with deployment procedures.
2. **Description is everything.** Claude matches tasks to skills via the `description` field. Make it specific and action-oriented.
3. **Progressive disclosure.** Put essential rules in SKILL.md, detailed references in supporting files.
4. **Include examples.** Show correct AND incorrect patterns. Claude learns from contrast.
5. **Keep SKILL.md focused.** Under ~500 lines. Link to supporting files for depth.
6. **Use `disable-model-invocation: true`** for anything with side effects (deploy, publish, send notifications).

### Writing Effective Descriptions

```yaml
# ❌ Too vague
description: Help with code

# ❌ Too broad
description: All engineering practices and standards

# ✅ Specific and actionable
description: TypeScript coding standards for the Cere platform - naming conventions, error handling patterns, and module structure

# ✅ Context-rich
description: Deployment procedures for CEF microservices to Kubernetes - including pre-deploy checks, rollback procedures, and monitoring verification
```

---

## Best Practices

### Versioning

1. **Use git tags** for marketplace releases: `v1.0.0`, `v1.1.0`
2. **Semantic versioning**: Breaking changes = major, new skills = minor, fixes = patch
3. **Changelog** in the marketplace repo
4. **Pin versions** in production repos' `settings.json` when stability matters
5. **Review skill PRs** like code PRs — these shape how your entire team writes code

### Skill Naming Conventions

```
# Pattern: {domain}-{action/type}
coding-standards        # Reference: coding conventions
api-conventions         # Reference: API patterns
deploy-production       # Task: deployment workflow
review-pr              # Task: PR review
test-patterns          # Reference: testing patterns
incident-response      # Task: incident handling
```

### Team Workflow

1. **Designate skill maintainers** — Treat skills like shared libraries
2. **PR process for changes** — Skills affect everyone's workflow
3. **Quarterly reviews** — Are skills still accurate? Remove stale ones
4. **Onboarding checklist** — New devs install the team marketplace on day 1
5. **Feedback channel** — Slack channel or GitHub issues for skill improvement requests

### Anti-Patterns to Avoid

- ❌ One massive skill with everything → Split by concern
- ❌ Skills that duplicate IDE/linter config → Use tools for what tools do best
- ❌ Outdated skills nobody maintains → Schedule reviews
- ❌ Skills with secrets/credentials → Use environment variables
- ❌ Skills that are too prescriptive about implementation → Guide, don't dictate

---

## Cere/CEF Skill Templates

Below are ready-to-use skill templates for a Cere engineering team. Customize the specifics for your stack.

---

### Template 1: Coding Standards

**File:** `.claude/skills/cere-coding-standards/SKILL.md`

```markdown
---
name: cere-coding-standards
description: TypeScript and Rust coding standards for Cere Network services - naming conventions, error handling, module structure, and code organization patterns
---

# Cere Coding Standards

Apply these standards when writing or reviewing code in this codebase.

## TypeScript Conventions

### Naming
- **Files:** kebab-case (`user-service.ts`)
- **Classes/Interfaces:** PascalCase (`UserService`, `IUserRepository`)
- **Functions/Variables:** camelCase (`getUserById`, `isActive`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Types:** PascalCase with `T` prefix for generics (`TResult<T>`)

### Error Handling
- Always use custom error classes extending `BaseError`
- Never catch and swallow errors silently
- Include context in error messages: what failed, why, and what to do
- Use Result types for expected failures, throw for unexpected ones

```typescript
// ✅ Good
class UserNotFoundError extends BaseError {
  constructor(userId: string) {
    super(`User ${userId} not found in database`, { userId });
  }
}

// ❌ Bad
catch (e) {
  console.log(e);
}
```

### Module Structure
```
src/
├── modules/
│   └── {module-name}/
│       ├── {module-name}.module.ts
│       ├── {module-name}.service.ts
│       ├── {module-name}.controller.ts
│       ├── {module-name}.repository.ts
│       ├── dto/
│       ├── entities/
│       └── __tests__/
├── common/
│   ├── errors/
│   ├── guards/
│   ├── interceptors/
│   └── utils/
└── config/
```

### Import Order
1. Node.js built-ins
2. External packages
3. Internal modules (absolute paths)
4. Relative imports
5. Type-only imports

### Testing
- Test files live next to source: `user.service.spec.ts`
- Use descriptive test names: `should return 404 when user does not exist`
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies, never databases in integration tests

## Rust Conventions

- Follow standard Rust naming (snake_case functions, PascalCase types)
- Use `thiserror` for error definitions
- Use `anyhow` for error propagation in application code
- Prefer `impl Trait` over `dyn Trait` when possible
- Document public APIs with `///` doc comments

## For detailed API patterns, see [api-conventions](../cere-api-conventions/SKILL.md)
```

---

### Template 2: Architecture Patterns

**File:** `.claude/skills/cere-architecture/SKILL.md`

```markdown
---
name: cere-architecture
description: Cere platform architecture patterns - microservice boundaries, event-driven communication, data flow patterns, and service interaction guidelines
---

# Cere Architecture Patterns

## Service Boundaries

Each microservice owns its data and exposes it only via APIs or events.

### Service Communication
- **Synchronous:** gRPC for internal service-to-service calls
- **Asynchronous:** Event bus (Kafka/NATS) for cross-domain events
- **External:** REST/GraphQL for client-facing APIs

### Event-Driven Patterns
```
Producer → Event Bus → Consumer(s)
         ↓
    Event Store (for replay)
```

- Events are immutable facts: `UserCreated`, `OrderPlaced`
- Event names: past tense, domain-specific
- Include correlation ID in all events
- Consumers must be idempotent

### Data Patterns
- Each service owns its database
- No cross-service database queries
- Use CQRS where read/write patterns differ significantly
- Event sourcing for audit-critical domains

### New Service Checklist
When creating a new microservice:
1. Define bounded context and domain boundaries
2. Set up health check endpoint (`/health`)
3. Configure structured logging (JSON format)
4. Add OpenTelemetry tracing
5. Define API contract (OpenAPI/protobuf)
6. Set up CI/CD pipeline
7. Configure resource limits and autoscaling
8. Add to service mesh

For deployment specifics, see [cere-deploy](../cere-deploy/SKILL.md).
```

---

### Template 3: Deployment Procedures

**File:** `.claude/skills/cere-deploy/SKILL.md`

```markdown
---
name: cere-deploy
description: Deployment procedures for Cere services to Kubernetes - pre-deploy validation, rollout strategy, monitoring verification, and rollback procedures
disable-model-invocation: true
allowed-tools: Read, Bash, Grep
---

# Cere Deployment Procedure

⚠️ This skill has side effects. Only invoke manually with `/cere-deploy`.

## Pre-Deploy Checklist

Before deploying, verify:

1. **Tests pass:** `npm run test:ci` or `cargo test`
2. **Build succeeds:** `npm run build` or `cargo build --release`
3. **No breaking API changes** (or migration plan documented)
4. **Environment variables** are set in target environment
5. **Database migrations** have been applied (if any)

## Deploy Steps

### 1. Build and Tag
```bash
# Build container
docker build -t registry.cere.network/$SERVICE_NAME:$VERSION .

# Push to registry
docker push registry.cere.network/$SERVICE_NAME:$VERSION
```

### 2. Deploy to Staging
```bash
kubectl --context staging set image deployment/$SERVICE_NAME \
  $SERVICE_NAME=registry.cere.network/$SERVICE_NAME:$VERSION
kubectl --context staging rollout status deployment/$SERVICE_NAME --timeout=300s
```

### 3. Verify Staging
- Check `/health` endpoint returns 200
- Verify key metrics in Grafana (no error spike)
- Run smoke tests: `npm run test:smoke -- --env staging`

### 4. Deploy to Production
```bash
kubectl --context production set image deployment/$SERVICE_NAME \
  $SERVICE_NAME=registry.cere.network/$SERVICE_NAME:$VERSION
kubectl --context production rollout status deployment/$SERVICE_NAME --timeout=300s
```

### 5. Post-Deploy Verification
- Monitor error rates for 15 minutes
- Check alerting dashboards
- Verify key user flows

## Rollback

If issues detected:
```bash
kubectl --context production rollout undo deployment/$SERVICE_NAME
```

Then investigate before re-deploying.
```

---

### Template 4: Code Review

**File:** `.claude/skills/cere-review/SKILL.md`

```markdown
---
name: cere-review
description: Code review checklist and procedures for Cere PRs - security checks, performance considerations, and standards compliance
argument-hint: [pr-number or file-path]
---

# Cere Code Review

Review code against these criteria, in priority order:

## 1. Security
- [ ] No secrets/credentials in code
- [ ] Input validation on all external inputs
- [ ] SQL injection protection (parameterized queries)
- [ ] Authentication/authorization checks present
- [ ] No sensitive data in logs

## 2. Correctness
- [ ] Logic handles edge cases (null, empty, boundary values)
- [ ] Error handling follows standards (see cere-coding-standards)
- [ ] Concurrency issues considered
- [ ] Database transactions used where needed

## 3. Architecture
- [ ] Follows service boundary rules (see cere-architecture)
- [ ] No cross-service database access
- [ ] Events are idempotent
- [ ] API contract is backward-compatible

## 4. Performance
- [ ] No N+1 query patterns
- [ ] Appropriate indexing for new queries
- [ ] Pagination for list endpoints
- [ ] Caching considered for hot paths

## 5. Maintainability
- [ ] Tests cover happy path AND error cases
- [ ] Code is self-documenting (clear names, small functions)
- [ ] No dead code or commented-out blocks
- [ ] Dependencies are justified and up-to-date

## Review Output Format

For each issue found, report:
- **Severity:** Critical / Warning / Suggestion
- **Location:** file:line
- **Issue:** What's wrong
- **Fix:** How to fix it

$ARGUMENTS
```

---

### Template 5: Testing Patterns

**File:** `.claude/skills/cere-test-patterns/SKILL.md`

```markdown
---
name: cere-test-patterns
description: Testing patterns and conventions for Cere services - unit test structure, integration test setup, mocking strategies, and test data management
---

# Cere Testing Patterns

## Test Pyramid

```
        E2E (few)
       /         \
    Integration (some)
   /                  \
  Unit Tests (many)
```

## Unit Tests

### Structure (AAA Pattern)
```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid input', async () => {
      // Arrange
      const input = createMockUserInput();
      const repo = createMockRepository();
      const service = new UserService(repo);

      // Act
      const result = await service.createUser(input);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.email).toBe(input.email);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
        email: input.email,
      }));
    });

    it('should throw when email already exists', async () => {
      // Arrange
      const repo = createMockRepository({
        findByEmail: jest.fn().mockResolvedValue(existingUser),
      });
      const service = new UserService(repo);

      // Act & Assert
      await expect(service.createUser(input))
        .rejects.toThrow(DuplicateEmailError);
    });
  });
});
```

### Mocking Strategy
- Mock at service boundaries (repositories, external APIs)
- Use factories for test data: `createMockUser()`, `createMockOrder()`
- Never mock the thing you're testing

## Integration Tests
- Use testcontainers for database dependencies
- Test actual SQL queries, not mocked repositories
- Seed data per test, clean up after
- Use separate test database config

## E2E Tests
- Test critical user flows only
- Run against staging environment
- Keep fast: under 5 minutes total
- Use API calls, not UI automation (for backend services)
```

---

## Setting Up a Team Marketplace

### Step-by-Step

1. **Create a GitHub repo** (private for your org):
   ```
   cere-network/claude-skills
   ```

2. **Add marketplace.json:**
   ```
   .claude-plugin/marketplace.json
   ```

3. **Organize plugins by concern:**
   ```
   plugins/
   ├── engineering-core/        # Standards, patterns, review
   │   ├── manifest.json
   │   └── skills/
   │       ├── cere-coding-standards/
   │       ├── cere-architecture/
   │       ├── cere-review/
   │       └── cere-test-patterns/
   └── engineering-ops/         # Deploy, incident, monitoring
       ├── manifest.json
       └── skills/
           ├── cere-deploy/
           └── cere-incident-response/
   ```

4. **Add to every repo's `.claude/settings.json`:**
   ```json
   {
     "enabledPlugins": {
       "engineering-core@cere-skills": true,
       "engineering-ops@cere-skills": true
     },
     "extraKnownMarketplaces": {
       "cere-skills": {
         "source": {
           "source": "github",
           "repo": "cere-network/claude-skills"
         }
       }
     }
   }
   ```

5. **Team onboarding:**
   ```bash
   # One-time setup for each developer
   /plugin marketplace add cere-network/claude-skills
   ```

### Maintenance Cadence

| Frequency | Action |
|-----------|--------|
| **Per PR** | Review skill changes like code changes |
| **Monthly** | Check skill accuracy against current practices |
| **Quarterly** | Prune stale skills, add new ones for emerging patterns |
| **On incidents** | Update deploy/incident skills with lessons learned |

---

## Resources

- **Official docs:** https://code.claude.com/docs/en/skills
- **Agent Skills standard:** https://agentskills.io
- **Anthropic's example skills:** https://github.com/anthropics/skills
- **Claude Code Templates (dani_avila7):** https://aitmpl.com
- **Community marketplace:** https://skillsmp.com
- **Team expertise as plugins:** [Pekastel's article on team plugin patterns](https://medium.com/@pekastel/shared-skills-shared-success-how-claude-code-plugins-embed-team-expertise-5012bc0ff232)
