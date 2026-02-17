# ServiceMap

Open-source service architecture documentation tool. Define your infrastructure in YAML, visualize it as an interactive dependency graph.

## Features (MVP)
- **YAML-first:** Define services and connections as code
- **Interactive graph:** D3 force-directed visualization with zoom, pan, and click-to-inspect
- **Dependency metadata:** Ports, protocols, SLAs, criticality, auth methods
- **Impact analysis:** Select a service → see the blast radius if it goes down
- **Self-hostable:** SQLite + Next.js standalone, no external dependencies

## Quick Start

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Defining Services

Create a YAML file (see `examples/web-app-stack.yaml`):

```yaml
services:
  - id: auth-service
    name: Auth Service
    type: service
    tier: critical
    owner: platform-team

  - id: postgres-primary
    name: PostgreSQL
    type: database
    tier: critical

connections:
  - source: auth-service
    target: postgres-primary
    protocol: postgres
    port: 5432
    criticality: critical
    sla_target_ms: 10
    sla_uptime_percent: 99.99
```

Import via the UI or API:
```bash
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/yaml" \
  --data-binary @examples/web-app-stack.yaml
```

## Tech Stack
- **Next.js 15** (App Router) — fullstack framework
- **TypeScript** — strict mode
- **D3.js** — graph visualization
- **SQLite + Drizzle ORM** — zero-config database
- **Tailwind CSS + shadcn/ui** — styling
- **Zod** — runtime validation
- **Vitest** — testing

## License
MIT
