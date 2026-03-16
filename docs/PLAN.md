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
- [ ] YAML export (DB → YAML)
- [ ] Git-backed YAML sync
- [ ] Dark mode
- [ ] NextAuth.js authentication
- [ ] Changelog/audit log of changes
- [ ] Playwright E2E tests in CI
- [ ] Automated releases (semantic-release or similar)
