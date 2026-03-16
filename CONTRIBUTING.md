# Contributing to Topologr

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/tobeck/topologr.git
cd topologr

# Install dependencies
npm install

# Push database schema to SQLite
npm run db:push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Import one of the example YAML files from the `examples/` directory to see data in the graph.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript strict check |
| `npm run test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:push` | Push Drizzle schema to SQLite |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |

## Making Changes

### Branch Naming

- `feat/short-description` — new features
- `fix/short-description` — bug fixes
- `docs/short-description` — documentation only

### Code Style

- **TypeScript strict mode** — no `any` types
- **ES modules** — no CommonJS (`require`)
- **Functional React** — hooks, no class components
- **Named exports** for components, default export only for pages
- **Zod** for runtime validation of user input and API payloads
- **Early returns** over nested conditionals

### Testing

Tests live next to their source files: `foo.ts` → `foo.test.ts`.

```bash
# Run all tests
npm run test

# Run a specific test file
npx vitest run src/lib/yaml/parser.test.ts

# Run with coverage
npm run test:coverage
```

- Use Vitest for unit/integration tests
- Don't mock the database — use the in-memory SQLite helper from `src/lib/api/test-helpers.ts`
- Always run tests before submitting a PR

### Commit Messages

Use imperative mood, max 72 characters:

```
Add YAML validation for connection ports
Fix impact analysis for disconnected nodes
Update services table to support tag filtering
```

One logical change per commit.

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes with tests
3. Run the full check suite:
   ```bash
   npm run lint && npm run typecheck && npm run test
   ```
4. Open a PR against `main`
5. Fill in the PR template — describe what changed and why
6. Ensure CI passes

### What Makes a Good PR

- **Focused** — one feature or fix per PR
- **Tested** — new code has tests, existing tests pass
- **Documented** — update the README if you add user-facing features

## Reporting Bugs

Open a [GitHub issue](https://github.com/tobeck/topologr/issues/new?template=bug_report.md) with:

- Steps to reproduce
- Expected vs actual behavior
- Browser/OS/Node version
- Example YAML if relevant

## Requesting Features

Open a [GitHub issue](https://github.com/tobeck/topologr/issues/new?template=feature_request.md) with:

- What problem does this solve?
- How should it work?
- Any alternatives you've considered?

## Project Structure

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for design decisions and data flow. Key directories:

```
src/app/api/        — REST API route handlers
src/components/     — React components (UI, graph, forms)
src/lib/db/         — Drizzle ORM schema and database
src/lib/yaml/       — YAML parser and Zod validation
src/lib/graph/      — Graph algorithms (impact analysis)
examples/           — Example YAML service definitions
```

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
