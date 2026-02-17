# ServiceMap — Current Plan

## MVP Phase 1: Core Engine
- [ ] YAML parser with Zod validation
- [ ] SQLite schema via Drizzle
- [ ] Import API endpoint (POST /api/import)
- [ ] Services CRUD API
- [ ] Connections CRUD API
- [ ] Impact analysis API (GET /api/impact/:serviceId)

## MVP Phase 2: Visualization
- [ ] D3 force-directed graph component
- [ ] Node styling by service type (icons/shapes)
- [ ] Edge styling by criticality (color/thickness)
- [ ] Click node → detail panel (SLAs, metadata, connections)
- [ ] Click edge → connection detail
- [ ] Zoom/pan controls
- [ ] Impact highlight mode (select node → show blast radius)

## MVP Phase 3: UI Shell
- [ ] Dashboard layout with sidebar
- [ ] YAML import page (paste or file upload)
- [ ] Service list/table view
- [ ] Search/filter services
- [ ] Example YAML download

## Post-MVP
- [ ] YAML export (DB → YAML)
- [ ] Git-backed YAML sync
- [ ] Dark mode
- [ ] NextAuth.js authentication
- [ ] Docker compose for self-hosting
- [ ] Changelog/audit log of changes
