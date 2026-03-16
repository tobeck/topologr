import { describe, it, expect, beforeEach, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestDB } from "@/lib/api/test-helpers";
import { services, connections } from "@/lib/db/schema";
import { parseServiceYAML } from "./parser";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "@/lib/db/schema";

let testDb: BetterSQLite3Database<typeof schema>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb;
  },
}));

const { exportServicesToYAML, exportServicesToJSON, buildExportDocument } =
  await import("./exporter");

function seedService(
  id: string,
  overrides: Partial<typeof services.$inferInsert> = {},
) {
  const now = new Date();
  testDb
    .insert(services)
    .values({
      id,
      name: overrides.name ?? id,
      tier: "medium",
      type: "service",
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .run();
}

function seedConnection(
  sourceId: string,
  targetId: string,
  overrides: Partial<typeof connections.$inferInsert> = {},
) {
  const now = new Date();
  testDb
    .insert(connections)
    .values({
      id: randomUUID(),
      sourceId,
      targetId,
      criticality: "medium",
      isAsync: false,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    })
    .run();
}

describe("exportServicesToYAML", () => {
  beforeEach(() => {
    testDb = createTestDB();
  });

  it("exports empty DB as valid YAML with empty arrays", () => {
    const yaml = exportServicesToYAML();
    expect(yaml).toContain("services");
    expect(yaml).toContain("connections");
    expect(yaml).toMatch(/services:\s*\[]/);
  });

  it("exports services-only (no connections)", () => {
    seedService("auth-svc", { name: "Auth Service", owner: "platform-team" });

    const yaml = exportServicesToYAML();
    const result = parseServiceYAML(yaml);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.services).toHaveLength(1);
    expect(result.data.services[0].id).toBe("auth-svc");
    expect(result.data.services[0].name).toBe("Auth Service");
    expect(result.data.services[0].owner).toBe("platform-team");
    expect(result.data.connections).toHaveLength(0);
  });

  it("exports services and connections", () => {
    seedService("api-gw", {
      name: "API Gateway",
      tier: "critical",
      type: "service",
    });
    seedService("user-db", {
      name: "User DB",
      type: "database",
      tier: "critical",
    });
    seedConnection("api-gw", "user-db", {
      protocol: "postgres",
      port: 5432,
      criticality: "critical",
      slaTargetMs: 15,
      slaUptimePercent: 99.99,
    });

    const yaml = exportServicesToYAML();
    const result = parseServiceYAML(yaml);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.services).toHaveLength(2);
    expect(result.data.connections).toHaveLength(1);
    expect(result.data.connections[0].source).toBe("api-gw");
    expect(result.data.connections[0].target).toBe("user-db");
    expect(result.data.connections[0].protocol).toBe("postgres");
    expect(result.data.connections[0].port).toBe(5432);
    expect(result.data.connections[0].sla_target_ms).toBe(15);
    expect(result.data.connections[0].sla_uptime_percent).toBe(99.99);
  });

  it("omits default values for clean output", () => {
    seedService("my-svc", { name: "My Service" });

    const json = exportServicesToJSON();
    const svc = json.services[0];

    expect(svc.tier).toBeUndefined();
    expect(svc.type).toBeUndefined();
  });

  it("includes non-default values", () => {
    seedService("my-svc", {
      name: "My Service",
      tier: "critical",
      type: "database",
    });

    const json = exportServicesToJSON();
    const svc = json.services[0];

    expect(svc.tier).toBe("critical");
    expect(svc.type).toBe("database");
  });

  it("preserves tags through JSON round-trip", () => {
    seedService("my-svc", {
      name: "My Service",
      tags: JSON.stringify(["auth", "core", "v2"]),
    });

    const json = exportServicesToJSON();
    expect(json.services[0].tags).toEqual(["auth", "core", "v2"]);
  });

  it("preserves metadata through JSON round-trip", () => {
    const meta = { runtime: "node", replicas: 3, nested: { key: "value" } };
    seedService("my-svc", {
      name: "My Service",
      metadata: JSON.stringify(meta),
    });

    const json = exportServicesToJSON();
    expect(json.services[0].metadata).toEqual(meta);
  });

  it("exports is_async correctly", () => {
    seedService("svc-aa", { name: "A" });
    seedService("svc-bb", { name: "B" });
    seedConnection("svc-aa", "svc-bb", { isAsync: true });

    const json = exportServicesToJSON();
    expect(json.connections[0].is_async).toBe(true);
  });

  it("omits is_async when false (default)", () => {
    seedService("svc-aa", { name: "A" });
    seedService("svc-bb", { name: "B" });
    seedConnection("svc-aa", "svc-bb", { isAsync: false });

    const json = exportServicesToJSON();
    expect(json.connections[0].is_async).toBeUndefined();
  });

  it("round-trips example YAML through import and export", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");

    const examplePath = join(
      process.cwd(),
      "examples",
      "microservices-platform.yaml",
    );
    const originalYaml = readFileSync(examplePath, "utf-8");
    const parseResult = parseServiceYAML(originalYaml);

    expect(parseResult.success).toBe(true);
    if (!parseResult.success) return;

    const doc = parseResult.data;
    const now = new Date();

    // Import into test DB
    for (const svc of doc.services) {
      testDb
        .insert(services)
        .values({
          id: svc.id,
          name: svc.name,
          description: svc.description ?? null,
          owner: svc.owner ?? null,
          tier: svc.tier ?? "medium",
          type: svc.type ?? "service",
          repository: svc.repository ?? null,
          documentation: svc.documentation ?? null,
          tags: svc.tags ? JSON.stringify(svc.tags) : null,
          metadata: svc.metadata ? JSON.stringify(svc.metadata) : null,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    for (const conn of doc.connections) {
      testDb
        .insert(connections)
        .values({
          id: randomUUID(),
          sourceId: conn.source,
          targetId: conn.target,
          label: conn.label ?? null,
          protocol: conn.protocol ?? "https",
          port: conn.port ?? null,
          description: conn.description ?? null,
          criticality: conn.criticality ?? "medium",
          slaTargetMs: conn.sla_target_ms ?? null,
          slaUptimePercent: conn.sla_uptime_percent ?? null,
          authMethod: conn.auth_method ?? null,
          isAsync: conn.is_async ?? false,
          metadata: conn.metadata ? JSON.stringify(conn.metadata) : null,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    // Export
    const exportedYaml = exportServicesToYAML();

    // Re-import the exported YAML
    const reParseResult = parseServiceYAML(exportedYaml);
    expect(reParseResult.success).toBe(true);
    if (!reParseResult.success) return;

    // Verify data matches
    expect(reParseResult.data.services).toHaveLength(doc.services.length);
    expect(reParseResult.data.connections).toHaveLength(
      doc.connections.length,
    );

    // Verify each service by ID
    for (const original of doc.services) {
      const exported = reParseResult.data.services.find(
        (s) => s.id === original.id,
      );
      expect(exported).toBeDefined();
      expect(exported!.name).toBe(original.name);
      expect(exported!.owner).toBe(original.owner);
      expect(exported!.description).toBe(original.description);
      if (original.tags) {
        expect(exported!.tags).toEqual(original.tags);
      }
    }

    // Verify each connection
    for (const original of doc.connections) {
      const exported = reParseResult.data.connections.find(
        (c) => c.source === original.source && c.target === original.target,
      );
      expect(exported).toBeDefined();
      expect(exported!.protocol).toBe(original.protocol);
      expect(exported!.port).toBe(original.port);
      if (original.sla_target_ms) {
        expect(exported!.sla_target_ms).toBe(original.sla_target_ms);
      }
    }
  });
});

describe("buildExportDocument", () => {
  it("handles empty arrays", () => {
    const doc = buildExportDocument([], []);
    expect(doc.services).toEqual([]);
    expect(doc.connections).toEqual([]);
  });
});
