# Topologr

[![CI](https://github.com/tobeck/topologr/actions/workflows/ci.yml/badge.svg)](https://github.com/tobeck/topologr/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Open-source, self-hostable service architecture documentation tool. Define your infrastructure in YAML, visualize it as an interactive dependency graph.

## Features

- **YAML-first service definitions** — define services and connections as code
- **Interactive D3 graph** — force-directed visualization with zoom, pan, and click-to-inspect
- **Dependency metadata** — ports, protocols, SLAs, criticality, auth methods, ownership
- **Impact analysis** — hop-distance coloring and blast radius visualization when a service goes down
- **Services table** — filterable list with inline impact analysis
- **YAML import** — via the UI or REST API
- **Self-hostable** — SQLite + Next.js, no external dependencies

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

## Deployment (Docker)

```bash
docker compose up --build
```

This starts Topologr at [http://localhost:3000](http://localhost:3000) with a persistent SQLite volume.

**Notes:**
- Data is stored in a Docker volume (`topologr-data`). Back it up by copying the SQLite file from the volume.
- SQLite limits you to a single replica. For multi-instance deployments, swap to PostgreSQL.
- The container runs `drizzle-kit push` on startup to apply schema migrations automatically.

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
