# Topologr — Roadmap

## MVP (Complete)
- [x] YAML parser with Zod validation
- [x] SQLite schema via Drizzle
- [x] Import API endpoint (POST /api/import)
- [x] Services CRUD API
- [x] Connections CRUD API
- [x] Impact analysis API (GET /api/impact/:serviceId)
- [x] D3 force-directed graph component
- [x] Node styling by service type (icons/shapes)
- [x] Edge styling by criticality (color/thickness)
- [x] Click node → detail panel (SLAs, metadata, connections)
- [x] Click edge → connection detail
- [x] Zoom/pan controls
- [x] Impact highlight mode (select node → show blast radius)
- [x] Dashboard layout with sidebar
- [x] YAML import page (paste or file upload)
- [x] Service list/table view
- [x] Search/filter services
- [x] Example YAML download
- [x] Docker compose for self-hosting
- [x] CI pipeline (lint, typecheck, build, test)
- [x] ESLint configuration

## Open Source Readiness (Complete)
- [x] LICENSE file (MIT)
- [x] CONTRIBUTING.md
- [x] CODE_OF_CONDUCT.md
- [x] SECURITY.md
- [x] GitHub issue templates (bug report, feature request)
- [x] GitHub PR template
- [x] README with YAML schema reference and API docs
- [x] Add build step to CI
- [x] Update CLAUDE.md (fix stale refs, add key files)

## Post-MVP
- [x] YAML export (DB → YAML)
- [ ] Git-backed YAML sync
- [ ] Dark mode
- [ ] NextAuth.js authentication
- [ ] Changelog/audit log of changes
- [x] Playwright E2E tests (navigation, import, services, graph)
- [ ] Add E2E tests to CI workflow
- [ ] Automated releases (semantic-release or similar)

## YAML Export (DB → YAML) — Implementation Plan

### Overview
New API endpoint and UI to export the current service graph from the database back to valid YAML, producing output identical in structure to what the importer accepts.

### Implementation Steps

1. **Add `src/lib/yaml/exporter.ts`** — Core export logic
   - Query all services and connections from DB
   - Map DB camelCase fields → YAML snake_case (`slaTargetMs` → `sla_target_ms`, `isAsync` → `is_async`, `authMethod` → `auth_method`, `slaUptimePercent` → `sla_uptime_percent`)
   - Parse JSON-string fields (`tags`, `metadata`) back to objects
   - Omit fields that match defaults (tier: medium, type: service, protocol: https, criticality: medium, is_async: false) to keep output clean
   - Omit null/undefined optional fields
   - Omit DB-only fields (`createdAt`, `updatedAt`, connection `id`)
   - Serialize to YAML string using `yaml` package (already a dependency via the parser)
   - Export a `exportServicesToYAML(): Promise<string>` function

2. **Add `src/app/api/export/route.ts`** — GET endpoint
   - Call `exportServicesToYAML()`
   - Return with `Content-Type: text/yaml` and `Content-Disposition: attachment; filename="topologr-export.yaml"`
   - Support optional `?format=json` query param to return the structured object instead of YAML string
   - Handle empty DB case (return valid YAML with empty services array)

3. **Add export button to UI**
   - Add "Export YAML" button to the sidebar or services page header
   - Triggers download via `GET /api/export`
   - Use an anchor tag or `fetch` + `Blob` + `URL.createObjectURL` for download

4. **Round-trip test** — `src/lib/yaml/exporter.test.ts`
   - Import example YAML → DB → export → re-import → verify data matches
   - Test that exported YAML passes the existing Zod validation
   - Test empty DB export
   - Test services-only export (no connections)
   - Test that default-value fields are omitted
   - Test JSON metadata survives the round trip

5. **API test** — `src/app/api/export/route.test.ts`
   - Test GET returns `text/yaml` content type
   - Test `?format=json` returns JSON
   - Test empty DB returns valid response

### Key Decisions
- **Omit defaults vs include everything:** Omit defaults for cleaner output — matches the example YAML style
- **Field ordering:** Match the order in example YAML files (id, name, description, owner, tier, type, etc.)
- **YAML library:** Use the existing `yaml` package (already used by the parser)
- **No new dependencies needed**

## Stretch Goals
- [ ] **Service health status** — display live health state on graph nodes (green/red/unknown)
  - YAML config: optional `health_check` block per service (url, timeout, interval)
  - Separate backend process/sidecar that polls health checks on an interval, writes results to DB
  - Alternative: Prometheus integration — query PromQL to derive health status instead of direct HTTP checks
  - Topologr reads health state from DB and renders it in the graph/table
  - Avoids coupling polling logic into the Next.js app
