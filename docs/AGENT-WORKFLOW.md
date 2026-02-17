# Claude Code Agent Workflow Guide

## How This Project Is Designed for Claude Code

This document explains the project structure decisions, agent patterns, and cost optimization strategies for developing ServiceMap with Claude Code.

---

## 1. CLAUDE.md Philosophy

The CLAUDE.md is deliberately lean. Research shows LLMs can reliably follow ~150-200 instructions, and Claude Code's system prompt already uses ~50 of those. Our CLAUDE.md targets **under 40 focused instructions**.

### What's IN the CLAUDE.md
- **WHAT:** Stack, structure, key files (so Claude knows where to look)
- **WHY:** Architecture decisions (so Claude doesn't reliantly re-decide things)
- **HOW:** Commands to build/test/lint (so Claude can verify its own work)
- **Response style rules:** Token-saving instructions that reduce verbose output

### What's NOT in the CLAUDE.md
- Code style rules that a linter handles (ESLint does this, not Claude)
- Code snippets or examples (they go stale; point to files instead)
- Exhaustive API docs (tell Claude to read the file, don't paste it in)
- Workflow-specific instructions (those go in slash commands)

### The "Response Style" Section — Why It Matters
Every token Claude generates in responses is a token you pay for AND a token that fills the context window. The response style rules in CLAUDE.md (`"Be concise"`, `"No preambles"`, `"Don't narrate debugging"`) serve two purposes:
1. **Cost reduction:** 30-50% fewer output tokens per interaction
2. **Context preservation:** Less self-generated fluff means more room for actual code context

---

## 2. Project Structure for AI-Friendly Development

### Monorepo, Single Package
A monorepo lets Claude see schema, API, and UI in one place. No need to juggle multiple repos or packages. Claude can read the Drizzle schema, understand the data model, and implement a UI component in one session.

### Collocated Tests
Tests next to source (`foo.ts` → `foo.test.ts`) means Claude doesn't have to hunt for test files. When it edits a function, the test file is right there in the same directory listing.

### docs/ Directory as Working Memory
- **`docs/PLAN.md`** — The current task checklist. Claude writes plans here, checks items off as it goes. Persists across sessions via `claude --continue`.
- **`docs/ARCHITECTURE.md`** — Deeper design docs Claude can reference for complex decisions.
- **`docs/DECISIONS.md`** — ADR log. When Claude makes a significant choice, it logs it here so future sessions don't re-litigate.

### schemas/ as Source of Truth
The JSON Schema for YAML validation lives in `schemas/`. Claude reads this to understand what valid input looks like, rather than having it embedded in the CLAUDE.md.

---

## 3. Agent Patterns — Balancing Quality, Speed, and Cost

### Pattern A: Single Agent (Default — Use 80% of the Time)

For most tasks, one Claude Code session is all you need. The CLAUDE.md provides context. Claude reads files, makes changes, runs tests.

**When:** Bug fixes, small features, refactors, test writing, code review.

**Cost:** Lowest. One context window. ~10-50k tokens per task.

**How:**
```bash
claude
> Read src/lib/yaml/parser.ts. Add validation for duplicate service names. Write a test. Run it.
```

### Pattern B: Plan-Then-Execute (Use for Medium Features)

Use Claude's planning mode for features that touch 3+ files or require design decisions.

**When:** New feature, new component, new API endpoint.

**Cost:** Moderate. Planning adds ~5-10k tokens but saves rework.

**How:**
```bash
claude
# Shift+Tab twice to enter plan mode
> Plan how to add SLA metadata to connections. Consider the schema change, YAML parser update, API changes, and UI display. Write the plan to docs/PLAN.md.

# Review the plan, then:
> Execute the plan in docs/PLAN.md. Check off items as you go.
```

### Pattern C: Task Subagents (Use for Large Features)

Let Claude spawn focused subagents for independent pieces. The main agent coordinates. Each subagent gets a scoped task and returns a concise result.

**When:** Feature touches 5+ files across layers (DB, API, UI). Independent pieces that don't need each other's context.

**Cost:** Higher per-task, but avoids context window bloat. Each subagent starts clean.

**How:**
```bash
claude
> I need to add the "impact analysis" feature. Use subagents:
> 1. One to implement the graph traversal algorithm in src/lib/graph/impact.ts with tests
> 2. One to add the API endpoint in src/app/api/impact/route.ts
> 3. One to build the UI panel in src/components/graph/ImpactPanel.tsx
> Coordinate the interface between them using the types in src/types/.
```

**Important:** Don't create custom specialized subagents. Just let Claude use `Task(...)` to spawn copies of itself. Per the "Master-Clone" pattern — the main agent has full context from CLAUDE.md and delegates dynamically.

### Pattern D: Parallel Git Worktrees (Use for Independent Streams)

When you have 2-3 completely independent features, use git worktrees so multiple Claude instances don't step on each other.

**When:** Multiple unrelated features in the same sprint. E.g., one Claude does YAML import, another does graph visualization.

**Cost:** N × single-agent cost, but saves wall-clock time.

**How:**
```bash
git worktree add ../servicemap-yaml-import feat/yaml-import
git worktree add ../servicemap-graph-viz feat/graph-viz

# Terminal 1
cd ../servicemap-yaml-import && claude

# Terminal 2
cd ../servicemap-graph-viz && claude
```

---

## 4. Cost Optimization Strategies

### Model Selection
| Task Type | Model | Why |
|-----------|-------|-----|
| Planning, architecture, complex debugging | Opus | Better reasoning justifies the cost |
| Feature implementation, tests, refactors | Sonnet | Best quality/cost ratio for coding |
| Simple edits, formatting, boilerplate | Sonnet | Still Sonnet; Haiku not available in Claude Code CLI |

Use the `opusplan` setting if available — Opus for planning mode, Sonnet for execution.

### Context Management (The #1 Cost Factor)
1. **`/clear` aggressively.** After every completed task, clear the context. Don't let a testing session's output pollute a feature implementation session.
2. **`/compact` when context grows.** If you're mid-task and context is getting large, compact to summarize and free space.
3. **Don't `@`-include entire files in CLAUDE.md.** Say `"For YAML schema, see schemas/service-definition.json"` — Claude reads it on demand.
4. **Keep MCP tools minimal.** Each MCP tool definition eats tokens. Only enable what you actively use. For this project, we don't need MCP at all — just the shell.

### Prompt Efficiency
```
# BAD — vague, triggers clarification loop
"make the graph better"

# GOOD — specific, one-shot
"In ServiceGraph.tsx, add zoom controls: +/- buttons in bottom-right, zoom to fit button. Use D3 zoom behavior."

# BAD — asks Claude to explain
"Can you explain how D3 force layout works and then implement it?"

# GOOD — skips explanation, gets to work  
"Implement D3 force-directed layout in ServiceGraph.tsx. Pin nodes on drag. Link distance proportional to connection criticality."
```

### Batch Related Changes
Instead of 5 separate prompts for related changes:
```
# One prompt, multiple changes
"Update the connection schema to add `sla_target_ms` and `criticality` fields:
1. Update Drizzle schema in src/lib/db/schema.ts
2. Update the YAML parser in src/lib/yaml/parser.ts  
3. Update TypeScript types in src/types/
4. Add migration via npm run db:push
5. Run typecheck to verify"
```

---

## 5. Slash Commands

Store these in `.claude/commands/` for repeatable workflows:

### `.claude/commands/implement-feature.md`
```markdown
Implement the following feature: $ARGUMENTS

Steps:
1. Read docs/PLAN.md for any existing plan. If none, create one.
2. Read relevant source files to understand current patterns.
3. Implement changes following existing patterns in the codebase.
4. Write or update tests. Run them: npm run test
5. Run typecheck: npm run typecheck
6. Run lint: npm run lint
7. If all pass, commit with a descriptive message.
8. Check off completed items in docs/PLAN.md.
```

### `.claude/commands/fix-issue.md`
```markdown
Fix this issue: $ARGUMENTS

1. Reproduce the issue by reading relevant code.
2. Identify root cause.
3. Fix it with minimal changes.
4. Add a regression test.
5. Run: npm run test && npm run typecheck && npm run lint
6. Commit with message: fix: <description>
```

### `.claude/commands/review.md`
```markdown
Review the current diff for quality issues.

Check for:
- Type safety gaps (any, type assertions, missing null checks)
- Missing error handling
- Tests that don't actually assert anything meaningful
- D3/React integration issues (DOM ownership conflicts)
- SQL injection or unsafe user input handling
- Dead code or unused imports

Output a brief list of findings. No praise, just issues.
```

---

## 6. Hooks (Auto-Run on File Changes)

Add to `.claude/settings.json`:
```json
{
  "hooks": {
    "postEdit": ["npm run lint -- --fix"],
    "preCommit": ["npm run typecheck", "npm run test"]
  }
}
```

This way Claude's edits are auto-formatted, and commits are blocked if types or tests fail. **Linting is handled by tooling, not by instructions in CLAUDE.md.**

---

## 7. Iterative CLAUDE.md Improvement

The CLAUDE.md is a living document. Improve it based on what Claude gets wrong:

1. **After each session**, note patterns where Claude went off track.
2. **Add targeted rules** — not general advice, but specific corrections:
   - BAD: "Write good code" (too vague)
   - GOOD: "D3 selections must use useRef. Never render SVG via JSX in graph components." (specific, actionable)
3. **Remove rules Claude follows naturally.** If Claude never makes a mistake around something, the instruction is wasted context.
4. **Review monthly.** Run `claude --resume` on old sessions to see what errors were common, then update CLAUDE.md.

---

## 8. Session Workflow Cheat Sheet

```
┌─────────────────────────────────────────────┐
│              Starting a Session              │
├─────────────────────────────────────────────┤
│ 1. cd into project root                     │
│ 2. claude                                   │
│ 3. Check docs/PLAN.md for pending work      │
│ 4. Pick a task → work → verify → commit     │
│ 5. /clear between unrelated tasks           │
│ 6. Update docs/PLAN.md when done            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         When Things Go Wrong                │
├─────────────────────────────────────────────┤
│ • Claude loops on an error → Escape, give   │
│   it a specific hint, or /clear and retry   │
│ • Context feels stale → /compact            │
│ • Wrong approach entirely → Esc-Esc to edit │
│   your original prompt and try again        │
│ • Claude changed too many files → ask it to │
│   undo and break the task into smaller steps│
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         Cost Check                          │
├─────────────────────────────────────────────┤
│ • /cost — see current session token usage   │
│ • Install ccusage for daily/monthly tracking│
│ • If > 100k tokens on one task, you likely  │
│   need to break the task down smaller       │
└─────────────────────────────────────────────┘
```
