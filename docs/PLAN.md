# ServiceMap — Current Plan

## MVP Phase 1: Core Engine
- [x] YAML parser with Zod validation
- [x] SQLite schema via Drizzle
- [x] Import API endpoint (POST /api/import)
- [x] Services CRUD API
- [x] Connections CRUD API
- [x] Impact analysis API (GET /api/impact/:serviceId)

## MVP Phase 2: Visualization
- [x] D3 force-directed graph component
- [x] Node styling by service type (icons/shapes)
- [x] Edge styling by criticality (color/thickness)
- [x] Click node → detail panel (SLAs, metadata, connections)
- [x] Click edge → connection detail
- [x] Zoom/pan controls
- [x] Impact highlight mode (select node → show blast radius)

## MVP Phase 3: UI Shell
- [x] Dashboard layout with sidebar
- [x] YAML import page (paste or file upload)
- [x] Service list/table view
- [x] Search/filter services
- [x] Example YAML download

## Post-MVP
- [ ] YAML export (DB → YAML)
- [ ] Git-backed YAML sync
- [ ] Dark mode
- [ ] NextAuth.js authentication
- [ ] Docker compose for self-hosting
- [ ] Changelog/audit log of changes
