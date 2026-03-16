# Topologr

[![CI](https://github.com/tobeck/topologr/actions/workflows/ci.yml/badge.svg)](https://github.com/tobeck/topologr/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Open-source, self-hostable service architecture documentation tool. Define your infrastructure in YAML, visualize it as an interactive dependency graph.

## Features

- **YAML-first service definitions** — define services and connections as code, keep them in version control
- **Interactive D3 graph** — force-directed visualization with zoom, pan, and click-to-inspect
- **Dependency metadata** — ports, protocols, SLAs, criticality, auth methods, ownership
- **Impact analysis** — hop-distance coloring and blast radius visualization when a service goes down
- **Services table** — filterable list with inline impact analysis
- **YAML import** — via the UI or REST API
- **Self-hostable** — SQLite + Next.js, no external dependencies

## Quick Start

```bash
# Clone and install
git clone https://github.com/tobeck/topologr.git
cd topologr
npm install

# Initialize the database
npm run db:push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then import one of the example files from `examples/` to see the graph in action.

## Docker Deployment

```bash
docker compose up --build
```

This starts Topologr at [http://localhost:3000](http://localhost:3000) with a persistent SQLite volume.

- Data is stored in a Docker volume (`topologr-data`). Back it up by copying the SQLite file from the volume.
- The container runs `drizzle-kit push` on startup to apply schema migrations automatically.
- SQLite limits you to a single replica. For multi-instance deployments, swap to PostgreSQL.

## Defining Services

Create a YAML file (see [`examples/`](examples/) for full examples):

```yaml
services:
  - id: auth-service
    name: Auth Service
    type: service
    tier: critical
    owner: platform-team
    tags: [auth, security]

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
  -H "Content-Type: application/json" \
  -d '{"yaml": "'"$(cat examples/web-app-stack.yaml)"'"}'
```

### YAML Schema Reference

#### Services

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | yes | — | Lowercase alphanumeric with hyphens, 1-64 chars |
| `name` | string | yes | — | Display name, 1-128 chars |
| `description` | string | no | — | Max 1024 chars |
| `owner` | string | no | — | Team or person, max 128 chars |
| `tier` | enum | no | `medium` | `critical`, `high`, `medium`, `low` |
| `type` | enum | no | `service` | `service`, `database`, `queue`, `cache`, `external`, `cdn`, `storage` |
| `repository` | URL | no | — | Source code link |
| `documentation` | URL | no | — | Docs link |
| `tags` | string[] | no | — | Max 20 tags, each max 64 chars |
| `metadata` | object | no | — | Arbitrary key-value pairs |

#### Connections

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `source` | string | yes | — | Source service ID |
| `target` | string | yes | — | Target service ID |
| `label` | string | no | — | Edge label, max 128 chars |
| `protocol` | enum | no | `https` | `http`, `https`, `grpc`, `tcp`, `udp`, `amqp`, `redis`, `postgres`, `mysql`, `custom` |
| `port` | number | no | — | 1-65535 |
| `description` | string | no | — | Max 1024 chars |
| `criticality` | enum | no | `medium` | `critical`, `high`, `medium`, `low` |
| `sla_target_ms` | number | no | — | Target latency in milliseconds |
| `sla_uptime_percent` | number | no | — | Target uptime (0-100) |
| `auth_method` | enum | no | — | `none`, `api_key`, `oauth2`, `mtls`, `jwt`, `basic`, `custom` |
| `is_async` | boolean | no | `false` | Async connection (e.g., message queue) |
| `metadata` | object | no | — | Arbitrary key-value pairs |

#### Validation Rules

- Service IDs must be unique within a file
- All connection `source`/`target` values must reference a defined service ID
- Self-loops (source equals target) are not allowed
- Tabs in YAML are rejected with a clear error

## REST API

All mutations go through the API. The UI never accesses the database directly.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/services` | List services (filterable by `owner`, `tier`, `type`, `tag`) |
| `POST` | `/api/services` | Create a service |
| `GET` | `/api/services/:id` | Get a service |
| `PUT` | `/api/services/:id` | Update a service |
| `DELETE` | `/api/services/:id` | Delete a service |
| `GET` | `/api/connections` | List connections (filterable by `sourceId`, `targetId`, `protocol`, `criticality`) |
| `POST` | `/api/connections` | Create a connection |
| `GET` | `/api/connections/:id` | Get a connection |
| `PUT` | `/api/connections/:id` | Update a connection |
| `DELETE` | `/api/connections/:id` | Delete a connection |
| `POST` | `/api/import` | Import services and connections from YAML |
| `GET` | `/api/impact/:serviceId` | Analyze downstream impact of a service failure |
| `GET` | `/api/examples/:filename` | Download an example YAML file |

## Tech Stack

- **[Next.js 15](https://nextjs.org/)** (App Router) — fullstack framework
- **TypeScript** — strict mode
- **[D3.js](https://d3js.org/)** — force-directed graph visualization
- **[SQLite](https://www.sqlite.org/) + [Drizzle ORM](https://orm.drizzle.team/)** — zero-config database
- **[Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)** — styling
- **[Zod](https://zod.dev/)** — runtime validation

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and PR guidelines.

## License

[MIT](LICENSE)
