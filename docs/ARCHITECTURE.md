# ServiceMap Architecture

## Overview
ServiceMap is a YAML-first service architecture documentation tool. Users define their infrastructure as YAML files, import them, and get an interactive dependency graph with metadata.

## Data Flow
```
YAML file → Parser (Zod validation) → API → SQLite (Drizzle) → Graph API → D3 Visualization
```

## Key Design Decisions

### YAML as the Primary Interface
Services and connections are defined in YAML, not through a GUI-first approach. This means:
- Architecture definitions can live in version control alongside code
- Changes are diffable and reviewable in PRs
- Bulk imports are trivial
- The GUI is for visualization and exploration, not data entry

### SQLite for Storage
- Zero-config: no database server to install
- Single-file backup: copy `servicemap.db`
- WAL mode for concurrent read performance
- Good enough for thousands of services (this isn't a high-write workload)
- If someone needs Postgres later, Drizzle makes migration straightforward

### D3 over React Flow
- React Flow is opinionated about node/edge rendering and fights with custom layouts
- D3 gives full control over the force simulation, which we need for:
  - Clustering by service type or team
  - Variable link distance based on criticality
  - Custom node shapes per service type
- Trade-off: More manual work for interactions (zoom, drag, selection)

### API-First Architecture
All data mutations go through Next.js API route handlers. Components never import `db` directly. This:
- Makes the API testable independently
- Enables future CLI tools or external integrations
- Keeps the data layer swappable

### No Auth in MVP
Auth adds complexity that blocks shipping. The target user (IT team, internal tool) likely has network-level access control already. NextAuth.js can be added later without restructuring.

## Graph Model
- **Nodes:** Services (any infrastructure component)
- **Edges:** Directed connections (source depends on target)
- **Impact analysis:** Reverse BFS from a failed node to find all upstream dependents
- **Criticality propagation:** The max criticality of affected edges determines alert level
