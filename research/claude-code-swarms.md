# Claude Code Swarms — Multi-Agent Orchestration

> SKILL.md-style reference for setting up Claude Code as a team lead that delegates to specialist sub-agents.

## Overview

Claude Code Swarms is a multi-agent orchestration pattern where one Claude instance (the **Leader**) plans work, spawns specialist **Teammates**, and coordinates them via shared task boards and inbox messaging. Instead of one agent doing everything sequentially, you get parallel specialists with fresh context windows, coordinated through a Kanban-style task system.

**Discovered:** January 24, 2026 by Mike Kelly ([@NicerInPerson](https://x.com/NicerInPerson/status/2014989679796347375)). Built into Claude Code behind feature flags, unlockable via [claude-sneakpeek](https://github.com/mikekelly/claude-sneakpeek).

**Why it works:**
- **Context isolation** — Each agent gets a fresh context window focused on one task, avoiding the token bloat that cripples single-agent approaches at scale
- **Forced attention** — Assigning a role forces the LLM to "pay attention" to specific aspects rather than trying to handle everything
- **Parallelism** — Multiple agents work simultaneously on independent tasks
- **Natural quality gates** — Specialists review each other's work

---

## Architecture

### Primitives

| Primitive | What It Is | Location |
|-----------|-----------|----------|
| **Agent** | A Claude instance that can use tools | N/A (process) |
| **Team** | A named group of agents. One leader, multiple teammates | `~/.claude/teams/{name}/config.json` |
| **Teammate** | An agent that joined a team. Has name, color, inbox | Listed in team config |
| **Leader** | The agent that created the team. Receives messages, approves plans/shutdowns | First member in config |
| **Task** | Work item with subject, description, status, owner, dependencies | `~/.claude/tasks/{team}/N.json` |
| **Inbox** | JSON file where an agent receives messages from teammates | `~/.claude/teams/{name}/inboxes/{agent}.json` |
| **Message** | JSON object sent between agents (text, shutdown_request, idle_notification) | Stored in inbox files |

### File Structure

```
~/.claude/teams/{team-name}/
├── config.json              # Team metadata and member list
└── inboxes/
    ├── team-lead.json       # Leader's inbox
    ├── worker-1.json        # Worker 1's inbox
    └── worker-2.json        # Worker 2's inbox

~/.claude/tasks/{team-name}/
├── 1.json                   # Task #1
├── 2.json                   # Task #2
└── 3.json                   # Task #3
```

### Lifecycle

```
1. Create Team → 2. Create Tasks → 3. Spawn Teammates → 4. Work → 5. Coordinate → 6. Shutdown → 7. Cleanup
```

### Message Flow

```
Leader  →  TaskCreate (3 tasks)
Leader  →  spawn Teammate 1 with prompt
Leader  →  spawn Teammate 2 with prompt

T1  →  claim task #1
T2  →  claim task #2

T1  →  complete #1, send findings to Leader (inbox)
        ↳ Task #3 auto-unblocks

T2  →  complete #2, send findings to Leader (inbox)

Leader  →  requestShutdown to T1 → T1 approves
Leader  →  requestShutdown to T2 → T2 approves
Leader  →  cleanup
```

---

## Two Ways to Spawn Agents

### Method 1: Task Tool (Subagents) — Short-lived, focused work

```javascript
Task({
  subagent_type: "Explore",
  description: "Find auth files",
  prompt: "Find all authentication-related files in this codebase",
  model: "haiku"  // Optional: haiku, sonnet, opus
})
```

- Runs synchronously (or async with `run_in_background: true`)
- Returns result directly
- No team membership
- Best for: searches, analysis, one-off research

### Method 2: Task + team_name + name (Teammates) — Persistent parallel workers

```javascript
// First create a team
Teammate({ operation: "spawnTeam", team_name: "my-project" })

// Then spawn a teammate
Task({
  team_name: "my-project",
  name: "security-reviewer",
  subagent_type: "security-sentinel",
  prompt: "Review all authentication code for vulnerabilities. Send findings to team-lead via Teammate write.",
  run_in_background: true
})
```

- Joins team, appears in config
- Communicates via inbox messages
- Can claim tasks from shared task list
- Persists until shutdown
- Best for: parallel work, ongoing collaboration, pipeline stages

### Key Differences

| Aspect | Task (subagent) | Task + team (teammate) |
|--------|----------------|----------------------|
| Lifespan | Until task complete | Until shutdown requested |
| Communication | Return value | Inbox messages |
| Task access | None | Shared task list |
| Team membership | No | Yes |
| Coordination | One-off | Ongoing |

---

## Built-in Agent Types

| Type | Tools | Model | Best For |
|------|-------|-------|----------|
| **Bash** | Bash only | Inherits | Git ops, commands, system tasks |
| **Explore** | Read-only | Haiku (fast) | Codebase exploration, file searches |
| **Plan** | Read-only | Inherits | Architecture planning, strategies |
| **general-purpose** | All tools | Inherits | Multi-step tasks, research + action |
| **claude-code-guide** | Read-only + Web | Inherits | Questions about Claude Code itself |

---

## Shared Task Boards & Dependency Management

### Task System

Tasks are JSON files in `~/.claude/tasks/{team}/N.json`. Each task has:
- **Subject** and **description**
- **Status**: `pending` → `in_progress` → `completed`
- **Owner**: which teammate claimed it
- **Dependencies**: list of task IDs that must complete first

### Dependency Resolution

When a task completes, blocked tasks auto-unblock. The system acts as a Kanban board:

```
PENDING          IN_PROGRESS      COMPLETED
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Task #3   │    │ Task #2   │    │ Task #1   │
│ blocked   │←───│ worker-2  │    │ worker-1  │
│ by #2     │    │           │    │           │
└──────────┘    └──────────┘    └──────────┘
```

### TeammateTool Operations

| Operation | Purpose |
|-----------|---------|
| `spawnTeam` | Create a new team (you become leader) |
| `discoverTeams` | List available teams |
| `requestJoin` | Ask to join an existing team |
| `approveJoin` | Accept a join request (leader only) |
| `write` | Send a message to a teammate's inbox |
| `read` | Check your inbox for messages |
| `requestShutdown` | Ask a teammate to shut down |
| `approveShutdown` | Confirm shutdown |

---

## Cross-Worker Coordination Techniques

### The 5 Collaboration Patterns

1. **The Hive** — Every agent works from a single massive task queue. Best for large-scale refactors across many files.

2. **The Specialist** — Agents get rigid roles (e.g., "Security Auditor" critiques every line from "Developer"). Best for quality-critical work.

3. **The Council** — Agents debate architectural proposals. If "Architect" and "Performance" agents don't reach consensus, execution stops. Best for design decisions.

4. **The Pipeline** — Factory-style chain: Draft → Refine → Test → Document. Best for sequential workflows with clear stages.

5. **The Watchdog** — Background agent monitors work and spawns a "Fixer" agent on detected issues. Best for continuous validation.

### Inter-Agent Messaging

Agents coordinate via `@mentions` in inbox messages:

```javascript
// Worker sends findings to leader
Teammate({
  operation: "write",
  team_name: "my-project",
  recipient: "team-lead",
  message: "Completed security audit. Found 3 issues: [details]"
})

// Leader reads inbox
Teammate({
  operation: "read",
  team_name: "my-project"
})
```

### Spawn Backends

Teammates run via auto-detected backends:
- **in-process** — Same Node.js process, invisible (default)
- **tmux** — Separate terminal panes, visible and debuggable
- **iterm2** — Split panes in iTerm2 for visual monitoring

```
┌─────────────────┬─────────────────┐
│                 │  Worker 1       │
│  Leader         ├─────────────────┤
│  (your pane)    │  Worker 2       │
│                 ├─────────────────┤
│                 │  Worker 3       │
└─────────────────┴─────────────────┘
```

---

## Practical Examples

### Example 1: Full-Stack Feature Build

```javascript
// 1. Create team
Teammate({ operation: "spawnTeam", team_name: "auth-feature", description: "Implement OAuth2 authentication" })

// 2. Create tasks with dependencies
TaskCreate({ team: "auth-feature", tasks: [
  { id: 1, subject: "Design auth schema", description: "Design database schema for OAuth2" },
  { id: 2, subject: "Backend API", description: "Implement OAuth2 endpoints", dependencies: [1] },
  { id: 3, subject: "Frontend components", description: "Build login/signup UI", dependencies: [1] },
  { id: 4, subject: "Integration tests", description: "E2E test the full auth flow", dependencies: [2, 3] },
]})

// 3. Spawn specialists
Task({ team_name: "auth-feature", name: "architect", subagent_type: "Plan",
  prompt: "Claim task #1. Design the OAuth2 database schema and API contract. Send the design to team-lead when done.",
  run_in_background: true })

Task({ team_name: "auth-feature", name: "backend-dev", subagent_type: "general-purpose",
  prompt: "Wait for task #1 to complete, then claim task #2. Implement the OAuth2 backend using the architect's design.",
  run_in_background: true })

Task({ team_name: "auth-feature", name: "frontend-dev", subagent_type: "general-purpose",
  prompt: "Wait for task #1 to complete, then claim task #3. Build React login/signup components.",
  run_in_background: true })

Task({ team_name: "auth-feature", name: "qa-engineer", subagent_type: "general-purpose",
  prompt: "Wait for tasks #2 and #3 to complete, then claim task #4. Write and run E2E tests.",
  run_in_background: true })
```

### Example 2: Parallel Code Review (Specialist Pattern)

```javascript
Teammate({ operation: "spawnTeam", team_name: "pr-review" })

// Spawn review specialists in parallel
Task({ team_name: "pr-review", name: "security",
  subagent_type: "security-sentinel",
  prompt: "Audit the current PR diff for security vulnerabilities. Send findings to team-lead.",
  run_in_background: true })

Task({ team_name: "pr-review", name: "performance",
  subagent_type: "performance-oracle",
  prompt: "Analyze the current PR for performance bottlenecks. Send findings to team-lead.",
  run_in_background: true })

Task({ team_name: "pr-review", name: "architecture",
  subagent_type: "architecture-strategist",
  prompt: "Review the PR for architectural compliance. Send findings to team-lead.",
  run_in_background: true })

// Leader synthesizes all findings into a single review
```

### Example 3: 9-Agent Kanban (HN Community Pattern)

From a Hacker News commenter who ported a legacy Java server to C# .NET:

| Agent | Model | Role |
|-------|-------|------|
| Manager | Opus 4.5 | Global event loop, wakes agents based on Kanban state |
| Product Owner | Opus 4.5 | Strategy, cuts scope creep |
| Scrum Master | Opus 4.5 | Prioritizes backlog, assigns tickets |
| Architect | Sonnet 4.5 | Writes specs/interfaces, never implementation |
| Archaeologist | Grok | Reads legacy decompilation when Architect hits doc gaps |
| CAB (Change Advisory) | Opus 4.5 | Rejects features at Design (Gate 1) and Code (Gate 2) |
| Dev Junior | Haiku 4.5 | Writes failing tests (TDD) |
| Dev Senior | Sonnet 4.5 | Makes tests pass |
| Librarian | Gemini 2.5 | Maintains "As-Built" docs, triggers retrospectives |

7-stage Kanban with isolated Git Worktrees per agent.

---

## Practical Rules from the Field

From Zach Wills' experience managing 20 parallel agents for a week (800 commits, 100+ PRs):

### Rule 1: Align on the Plan, Not Just the Goal
Spend more time iterating on the plan with the agent. Co-author a high-quality ticket before execution. It's always cheaper to fix a bad plan than a bad implementation.

### Rule 2: A Long-Running Agent is a Bug
Long runtime = agent hitting context limits, compacting memory, forgetting original intent. Kill and restart with better instructions.

### Rule 3: Actively Manage AI Memory
Checkpoint progress somewhere persistent (markdown files, PR comments, Linear tickets). Then restart with fresh context pointing to the checkpoint.

### Rule 4: Architect as an Assembly Line
```
Main Agent → Solution Architect (fresh context) → plan summary →
Main Agent → Senior Engineer (fresh context) → code & PR →
Main Agent → Dedicated Tester (fresh context) → test results → Done
```
Each stage gets a fresh context window with only the relevant output from the previous stage.

### Rule 5: Trust the Autonomous Loop
Define → implement → test → fix → repeat. Let agents iterate autonomously until tests pass.

### Rule 6: Automate the System, Not Just the Code
Self-updating CLAUDE.md files. Self-refining tools. The system improves itself.

### Rule 7: Be Ruthless About Restarting
The moment an agent goes off track, kill it, give better instructions, restart. Never waste 5-10 minutes watching a bad thought complete.

### Rule 8: Commit Early and Often
Force agents to commit frequently. Git branches are your safety net for Rule 7.

---

## Setup Guide

### Option A: Native Swarm Mode (Experimental)

```bash
# Install the sneakpeek wrapper (isolated from your main Claude Code)
npx @realmikekelly/claude-sneakpeek quick --name claudesp

# Add to PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc

# Launch
claudesp
```

Lives in `~/.claude-sneakpeek/claudesp/` — completely isolated config, sessions, MCP servers.

### Option B: DIY Swarm with Standard Claude Code

You don't need the native TeammateTool to get swarm benefits. Use the Task tool with `run_in_background: true` and coordinate via files:

```javascript
// Spawn parallel workers
Task({ description: "Backend API", prompt: "...", run_in_background: true })
Task({ description: "Frontend UI", prompt: "...", run_in_background: true })
Task({ description: "Tests", prompt: "...", run_in_background: true })
```

Coordinate via:
- **Shared files** — Workers write status to a shared markdown file
- **Git branches** — Each worker on its own branch, leader merges
- **File-based task board** — Simple JSON or markdown Kanban in the repo

### Option C: Clawdbot Subagents

Clawdbot already supports subagent spawning. The pattern maps directly:

```
Main session (Leader) → spawns subagent sessions (Workers)
Workers complete tasks → report back to main session
Main session synthesizes results
```

---

## When to Use Swarms vs Single Agent

| Use Swarms When | Use Single Agent When |
|-----------------|----------------------|
| Task has independent parallel subtasks | Task is linear/sequential |
| Codebase is large (50k+ lines) | Small focused change |
| Multiple specialties needed (security + perf + arch) | Single domain |
| Context window would overflow | Context fits comfortably |
| Quality gates are important | Speed is priority |
| Greenfield or well-structured project | Messy legacy with hidden dependencies |

## Pitfalls

- **Review burden** — Swarms generate copious code fast. Human review becomes the bottleneck.
- **Coordination overhead** — For small tasks, swarm setup time exceeds time saved.
- **Context gaps** — Sub-agents don't receive full project context. They may make wrong decisions (e.g., reimplementing a library instead of installing it).
- **Cost** — Running multiple Opus/Sonnet instances simultaneously burns tokens fast.
- **Reliability** — Agents can still make fundamentally wrong architectural decisions. Human oversight remains essential.

---

## Sources

- [@NicerInPerson's original discovery](https://x.com/NicerInPerson/status/2014989679796347375) (Jan 24, 2026)
- [claude-sneakpeek](https://github.com/mikekelly/claude-sneakpeek) — Mike Kelly's unlock tool
- [Hacker News discussion](https://news.ycombinator.com/item?id=46743908) (281 points, 207 comments)
- [Kieran Klaassen's Swarm Orchestration Skill gist](https://gist.github.com/kieranklaassen/4f2aba89594a4aea4ad64d753984b2ea) — comprehensive reference
- [Zach Wills: 8 Rules from managing 20 AI agents](https://zachwills.net/i-managed-a-swarm-of-20-ai-agents-for-a-week-here-are-the-8-rules-i-learned/)
- [ByteIota coverage](https://byteiota.com/claude-code-swarms-hidden-multi-agent-feature-discovered/)
