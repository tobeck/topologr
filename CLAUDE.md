# Topologr

## Project Overview
Topologr is an open-source, self-hostable service architecture documentation tool. Users define services and their connections in YAML, and the app renders an interactive visual dependency map with metadata (ports, protocols, SLAs, criticality, ownership).

**Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, D3.js (graph visualization), SQLite via Drizzle ORM.
**Monorepo:** Single repo, no separate packages.

## Project Structure
```
topologr/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (dashboard)/  # Main app layout group
│   │   └── api/          # Route handlers
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui primitives
│   │   ├── graph/        # D3 graph visualization
│   │   ├── import/       # YAML import UI
│   │   ├── services/     # Service table & filters
│   │   ├── impact/       # Impact analysis UI
│   │   └── layout/       # App shell (sidebar)
│   ├── lib/              # Shared utilities
│   │   ├── db/           # Drizzle schema + queries
│   │   ├── yaml/         # YAML parser/validator (Zod schemas)
│   │   ├── graph/        # Graph algorithms (impact analysis)
│   │   └── api/          # Shared API helpers (validation, errors, test utils)
│   └── types/            # TypeScript type definitions
├── examples/             # Example YAML service definitions
├── drizzle/              # DB migrations
├── docs/                 # Project documentation
│   ├── ARCHITECTURE.md   # System design decisions
│   └── PLAN.md           # Current roadmap
├── .github/              # CI workflow, issue/PR templates
├── public/
├── CLAUDE.md
└── package.json
```

## Commands
- `npm run dev` — Start dev server (port 3000)
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript strict check
- `npm run test` — Vitest unit tests
- `npm run test:coverage` — Vitest with coverage report
- `npm run db:push` — Push Drizzle schema to SQLite
- `npm run db:studio` — Open Drizzle Studio

## Verification
After making changes, always run:
```bash
npm run lint && npm run typecheck && npm run test
```

## Code Style
- ES modules only. No CommonJS.
- Functional components with hooks. No class components.
- Named exports for components. Default export only for pages.
- Use `type` for type aliases, `interface` for object shapes that may be extended.
- Zod for runtime validation of YAML input and API payloads.
- Prefer early returns over nested conditionals.
- Error messages must be user-facing and actionable.

## Response Style — IMPORTANT
- Be concise. No preambles like "Great question!" or "Sure, I can help with that."
- Skip explanations of what you're about to do. Just do it.
- When reporting what you did, use 1-2 sentences max. Don't restate the task.
- Don't list files you changed unless asked. The diff speaks for itself.
- If you hit an error, state the error and the fix. Don't narrate the debugging process.
- Never output code in chat when you can write it to a file instead.
- When asked to plan, output a numbered list in `docs/PLAN.md`, not prose.

## Architecture Decisions
- **YAML-first:** Services defined in YAML files, imported via UI or API. DB stores parsed state.
- **Graph model:** Services are nodes, connections are directed edges. Stored as adjacency list in DB.
- **D3 force-directed layout** for the interactive graph. Not React Flow (too opinionated, too heavy).
- **SQLite** for zero-config self-hosting. Drizzle for type-safe queries.
- **No auth in MVP.** Add later via NextAuth.js.
- **API-first:** All mutations go through `/api/` route handlers. UI calls API, never DB directly from components.

## Testing
- Write tests alongside implementation. Test files live next to source: `foo.ts` → `foo.test.ts`.
- Use Vitest for unit/integration. Playwright for E2E.
- Test the YAML parser exhaustively—it's the primary user input surface.
- Don't mock DB in integration tests. Use the in-memory SQLite helper from `src/lib/api/test-helpers.ts`.
- Always run `npm run test` after making changes to verify nothing is broken.

## Git Workflow
- Branch naming: `feat/short-description`, `fix/short-description`
- Commit messages: imperative mood, max 72 chars. e.g., `Add YAML validation for connection ports`
- One logical change per commit. Don't bundle unrelated changes.
- Do NOT add `Co-Authored-By` lines to commit messages.

## Key Files
- `src/lib/db/schema.ts` — Drizzle schema (source of truth for data model)
- `src/lib/yaml/parser.ts` — YAML → validated service graph
- `src/lib/yaml/schemas.ts` — Zod validation schemas for YAML input
- `src/lib/graph/impact.ts` — Dependency impact analysis (BFS)
- `src/lib/api/validation.ts` — Zod schemas for API request validation
- `src/lib/api/errors.ts` — Standardized API error responses
- `src/components/graph/ServiceGraph.tsx` — Main D3 visualization component

## Common Pitfalls
- D3 and React both want DOM control. Use `useRef` + `useEffect` for D3, never let React render SVG elements that D3 manages.
- Drizzle's SQLite driver is synchronous. Don't wrap in unnecessary async.
- `next/dynamic` with `ssr: false` for the graph component (D3 needs `window`).
- YAML allows tabs but we reject them. Validate and give a clear error.
