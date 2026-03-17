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

## GHCR Docker Image Publishing — Implementation Plan

### Overview
Automate building and publishing the Docker image to GitHub Container Registry (`ghcr.io/tobeck/topologr`) so users can `docker pull` instead of building from source.

### Implementation Steps

1. **Add `.github/workflows/docker-publish.yml`** — CI workflow
   - **Triggers:**
     - Push to `main` → tag image as `latest` and `sha-<short>`
     - Push a version tag (`v*`) → tag image as `v1.2.3`, `1.2`, `1`, and `latest`
   - **Steps:**
     - Checkout code
     - Set up Docker Buildx (multi-platform support)
     - Log in to GHCR using `GITHUB_TOKEN` (no extra secrets needed)
     - Extract metadata/tags with `docker/metadata-action`
     - Build and push with `docker/build-push-action`
     - Use GitHub Actions cache for Docker layers
   - **Multi-platform:** Build for `linux/amd64` and `linux/arm64` (ARM users, e.g. Apple Silicon / Raspberry Pi)
   - **Labeling:** Apply OCI labels (source, description, license) via metadata-action for discoverability

2. **Add labels to `Dockerfile`** — OCI image metadata
   - `org.opencontainers.image.source` → GitHub repo URL
   - `org.opencontainers.image.description` → project description
   - `org.opencontainers.image.licenses` → MIT
   - These link the GHCR package page back to the repo and show metadata

3. **Set package visibility** — Manual step after first push
   - Go to the package settings on GitHub and set visibility to public
   - Link the package to the repository for unified permissions

4. **Update `README.md`** — Add GHCR pull instructions
   - Add `docker pull ghcr.io/tobeck/topologr:latest` to the Docker section
   - Show usage with `docker run` (port mapping, volume mount)
   - Keep the existing `docker compose up --build` instructions for development

5. **Update `docker-compose.yml`** — Reference published image
   - Add an `image:` field pointing to `ghcr.io/tobeck/topologr:latest`
   - Keep `build: .` as a commented-out alternative for local development

### Key Decisions
- **GHCR over Docker Hub:** Free for public repos, no extra account, image URL coupled to the repo
- **`GITHUB_TOKEN` permissions:** Workflow needs `packages: write` — no manual secrets to configure
- **Multi-platform:** `amd64` + `arm64` covers the vast majority of self-hosters
- **Tag strategy:** Semantic version tags (`v1.2.3` → `1.2.3`, `1.2`, `1`) follow container ecosystem conventions
- **No separate release workflow yet:** Image publishing is the first step; semantic-release can be layered on later
- **Layer caching:** GitHub Actions cache keeps rebuild times fast

## Stretch Goals
- [ ] **Service health status** — display live health state on graph nodes (green/red/unknown)
  - YAML config: optional `health_check` block per service (url, timeout, interval)
  - Separate backend process/sidecar that polls health checks on an interval, writes results to DB
  - Alternative: Prometheus integration — query PromQL to derive health status instead of direct HTTP checks
  - Topologr reads health state from DB and renders it in the graph/table
  - Avoids coupling polling logic into the Next.js app
